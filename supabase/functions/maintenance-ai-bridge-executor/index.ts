import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string) {
  return Deno.env.get(name) || "";
}

async function requireOwner(req: Request, supabase: ReturnType<typeof createClient>, serviceKey: string) {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || token === serviceKey) return false;
  const { data: identity, error: identityError } = await supabase.auth.getUser(token);
  if (identityError || !identity.user?.email) return false;

  const { data: byId, error: idError } = await supabase.from("users")
    .select("id, role, status").eq("id", identity.user.id).maybeSingle();
  if (idError) throw idError;
  let profile = byId;
  if (!profile) {
    const { data: byEmail, error: emailError } = await supabase.from("users")
      .select("id, role, status").ilike("email", identity.user.email).maybeSingle();
    if (emailError) throw emailError;
    profile = byEmail;
  }
  return profile?.role === "owner" && profile?.status === "active";
}

async function githubFetch(path: string, init: RequestInit = {}) {
  const token = env("PPD_AI_GITHUB_TOKEN");
  if (!token) throw new Error("PPD_AI_GITHUB_TOKEN is not configured in Edge Function secrets.");
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/vnd.github+json");
  headers.set("X-GitHub-Api-Version", "2022-11-28");
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(`https://api.github.com${path}`, { ...init, headers });
}

async function getDefaultBranch(repo: string) {
  const res = await githubFetch(`/repos/${repo}`);
  if (!res.ok) throw new Error(`GitHub repo lookup failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.default_branch || "main";
}

async function getBranchSha(repo: string, branch: string) {
  const res = await githubFetch(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  if (!res.ok) throw new Error(`GitHub branch lookup failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.object?.sha;
}

async function ensureBranch(repo: string, baseBranch: string, targetBranch: string) {
  const existing = await githubFetch(`/repos/${repo}/git/ref/heads/${encodeURIComponent(targetBranch)}`);
  if (existing.ok) return { existed: true };
  const baseSha = await getBranchSha(repo, baseBranch);
  const res = await githubFetch(`/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${targetBranch}`, sha: baseSha }),
  });
  if (!res.ok) throw new Error(`GitHub branch create failed: ${res.status} ${await res.text()}`);
  return { existed: false };
}

async function readFileSha(repo: string, branch: string, filePath: string) {
  const res = await githubFetch(`/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub file lookup failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.sha || null;
}

async function writeFile(repo: string, branch: string, filePath: string, content: string, message: string) {
  const sha = await readFileSha(repo, branch, filePath);
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await githubFetch(`/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub file write failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function openPullRequest(repo: string, base: string, head: string, title: string, body: string) {
  const res = await githubFetch(`/repos/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, body, head, base, draft: false, maintainer_can_modify: true }),
  });
  if (!res.ok) throw new Error(`GitHub PR create failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") return json({ ok: true, name: "maintenance-ai-bridge-executor", status: "online" });

  try {
    const supabaseUrl = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service environment is not configured for bridge executor.");
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    if (!await requireOwner(req, supabase, serviceKey)) {
      return json({ ok: false, error: "Owner access required." }, 403);
    }

    const body = await req.json();
    const githubActionId = body.github_action_id as string | undefined;
    const databaseActionId = body.database_action_id as string | undefined;

    if (githubActionId) {
      const { data: action, error } = await supabase.from("ppd_github_bridge_actions").select("*").eq("id", githubActionId).single();
      if (error) throw error;
      if (!["queued", "drafted"].includes(action.action_status)) {
        return json({ ok: false, message: "GitHub action is not queued/drafted.", status: action.action_status }, 409);
      }
      if (!action.proposed_content) {
        await supabase.from("ppd_github_bridge_actions").update({ action_status: "blocked", execution_result: { error: "proposed_content is required" } }).eq("id", githubActionId);
        return json({ ok: false, error: "proposed_content is required" }, 400);
      }

      await supabase.from("ppd_github_bridge_actions").update({ action_status: "running" }).eq("id", githubActionId);
      const repo = action.repo_full_name || "piratecomp/phoenix-precision-drones-web";
      const base = action.base_branch || await getDefaultBranch(repo);
      const target = action.target_branch || `maintenance-ai/${githubActionId}`;
      await ensureBranch(repo, base, target);
      const writeResult = await writeFile(repo, target, action.file_path, action.proposed_content, action.commit_message || `Maintenance AI repair: ${action.file_path}`);
      const pr = await openPullRequest(repo, base, target, action.commit_message || `Maintenance AI repair: ${action.file_path}`, `Automated Maintenance AI repair request.\n\nBridge action: ${githubActionId}\n\nReview before merge.`);

      const result = { branch: target, commit: writeResult.commit?.sha, pull_request_number: pr.number, pull_request_url: pr.html_url };
      await supabase.from("ppd_github_bridge_actions").update({
        action_status: "completed",
        target_branch: target,
        pull_request_number: pr.number,
        pull_request_url: pr.html_url,
        execution_result: result,
      }).eq("id", githubActionId);
      await supabase.from("ppd_bridge_runs").insert({
        run_key: `github-run:${githubActionId}:${Date.now()}`,
        bridge_type: "github",
        bridge_action_id: githubActionId,
        run_status: "completed",
        executor: "maintenance-ai-bridge-executor",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        result_payload: result,
      });
      return json({ ok: true, type: "github", result });
    }

    if (databaseActionId) {
      const { data: action, error } = await supabase.from("ppd_database_bridge_actions").select("*").eq("id", databaseActionId).single();
      if (error) throw error;
      await supabase.from("ppd_database_bridge_actions").update({
        action_status: action.destructive_sql_detected ? "blocked" : "owner_exception",
        execution_result: { message: "Database migrations are drafted here but require Supabase management execution or approved migration apply path.", destructive_sql_detected: action.destructive_sql_detected },
      }).eq("id", databaseActionId);
      return json({ ok: true, type: "database", message: "Database action recorded. Apply path requires approved Supabase migration execution." });
    }

    return json({ ok: false, error: "Provide github_action_id or database_action_id." }, 400);
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
