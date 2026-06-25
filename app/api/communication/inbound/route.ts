import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing Supabase server environment variables." }, { status: 500 });
  }

  const contentType = request.headers.get("content-type") || "";
  let payload: Record<string, any> = {};

  if (contentType.includes("application/json")) {
    payload = await request.json();
  } else {
    const form = await request.formData();
    form.forEach((value, key) => {
      payload[key] = String(value);
    });
  }

  const normalized = {
    channel: payload.channel || "email",
    subject: payload.subject || payload.Subject || "New communication",
    body: payload.body || payload.text || payload.TextBody || payload.Body || payload.message || "",
    sender_email: payload.sender_email || payload.from || payload.From || payload.email || payload.Sender,
    to: payload.to || payload.To,
    phone: payload.phone || payload.From,
    name: payload.name || payload.Name,
    project_location: payload.project_location || payload.location,
    service_type: payload.service_type || payload.service,
    raw_payload: payload,
    source: "api_communication_inbound",
  };

  const { data, error } = await supabase.rpc("ppd_process_incoming_communication", { p_payload: normalized });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "PPD inbound communication endpoint" });
}
