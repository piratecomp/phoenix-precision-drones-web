import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405, headers: { "content-type": "application/json" },
    });
  }
  const payload = await req.json().catch(() => ({}));
  return new Response(JSON.stringify({
    ok: false,
    action: "human_review_required",
    mission_id: typeof payload.mission_id === "string" ? payload.mission_id : null,
    reason: "Aircraft execution is held until site, airspace, weather, pilot, mission, and DJI integration checks are approved.",
  }), {
    status: 409, headers: { "content-type": "application/json" },
  });
});

