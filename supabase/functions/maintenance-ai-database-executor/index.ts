import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function out(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method === "GET") return out({ ok: true, name: "maintenance-ai-database-executor", status: "online" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service environment missing.");

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    if (!await requireOwner(req, supabase, serviceKey)) {
      return out({ ok: false, error: "Owner access required." }, 403);
    }
    const body = await req.json().catch(() => ({}));
    const actionId = body.database_action_id;
    const createCheck = Boolean(body.create_check);
    const statusOnly = Boolean(body.status);

    if (statusOnly) {
      const { data, error } = await supabase.rpc("ppd_maintenance_ai_database_executor_status");
      if (error) throw error;
      return out(data);
    }

    if (createCheck) {
      const { data, error } = await supabase.rpc("ppd_maintenance_ai_create_database_bridge_check");
      if (error) throw error;
      return out(data);
    }

    if (!actionId) return out({ ok: false, error: "database_action_id or create_check=true is required." }, 400);

    const { data, error } = await supabase.rpc("ppd_apply_low_risk_database_bridge_action", {
      p_database_action_id: actionId,
      p_executor: "maintenance-ai-database-executor",
    });
    if (error) throw error;
    return out(data);
  } catch (error) {
    return out({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
