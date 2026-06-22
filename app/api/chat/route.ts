import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://emxgkftxbpoqnmzxwcop.supabase.co";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  try {
    if (!SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          ok: false,
          reply:
            "The website chat is installed, but the secure Supabase server key is not configured yet. Please email sales@phoenixprecisiondrones.com.",
          error: "missing_supabase_service_role_key",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const message = cleanText(body?.message, 1200);
    if (!message) {
      return NextResponse.json({
        ok: false,
        reply: "Please type a message so I can help.",
        error: "empty_message",
      });
    }

    const sessionId =
      cleanText(body?.sessionId, 120) ||
      `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/website_chat_message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        p_session_id: sessionId,
        p_message: message,
        p_name: cleanText(body?.name, 120),
        p_email: cleanText(body?.email, 180),
        p_page_url: cleanText(body?.pageUrl, 500),
        p_user_agent: cleanText(request.headers.get("user-agent"), 500),
        p_ip:
          cleanText(request.headers.get("x-forwarded-for"), 120) ||
          cleanText(request.headers.get("x-real-ip"), 120),
      }),
    });

    const data = await rpcResponse.json();

    if (!rpcResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          reply:
            "I’m having trouble reaching the Phoenix Precision Drones AI right now. Please email sales@phoenixprecisiondrones.com.",
          error: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reply:
          "I’m having trouble connecting right now. Please email sales@phoenixprecisiondrones.com.",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
