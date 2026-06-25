import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function twiml(message: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`, {
    headers: { "content-type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const payload: Record<string, any> = {};
  form.forEach((value, key) => {
    payload[key] = String(value);
  });

  const supabase = getAdminClient();
  if (!supabase) return twiml("Phoenix Precision Drones received your message. Our team will follow up.");

  const normalized = {
    channel: "sms",
    subject: "Inbound SMS",
    body: payload.Body || "",
    phone: payload.From,
    from: payload.From,
    to: payload.To,
    raw_payload: payload,
    source: "twilio_sms_webhook",
  };

  await supabase.rpc("ppd_process_incoming_communication", { p_payload: normalized });

  return twiml("Phoenix Precision Drones received your message. Our operations team will review and follow up.");
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "PPD Twilio SMS webhook" });
}
