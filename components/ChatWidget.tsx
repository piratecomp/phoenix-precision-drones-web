"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "assistant" | "user";
  body: string;
};

const quickQuestions = [
  "Do you do cell tower inspections?",
  "Can you help with construction progress photos?",
  "Do you offer LiDAR mapping?",
];

function getSessionId() {
  if (typeof window === "undefined") return "server";
  const key = "ppd_website_chat_session";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, value);
  }
  return value;
}

export default function ChatWidget() {
  const [portalPage, setPortalPage] = useState(false);
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      body:
        "Hi, I’m the Phoenix Precision Drones AI. Ask me about services, inspections, mapping, cell tower work, thermal imaging, LiDAR, scheduling, or quote details.",
    },
  ]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showLeadFields, setShowLeadFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getSessionId());
    setPortalPage(window.location.pathname.startsWith("/portal"));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(messageOverride?: string) {
    const text = (messageOverride ?? input).trim();
    if (!text || loading) return;

    setMessages((current) => [...current, { role: "user", body: text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          name: name || null,
          email: email || null,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
        }),
      });

      const data = await response.json();

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          body:
            data?.reply ||
            "I’m having trouble reaching the Phoenix Precision Drones AI right now. Please email sales@phoenixprecisiondrones.com and we’ll help you directly.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          body:
            "I’m having trouble connecting right now. Please email sales@phoenixprecisiondrones.com and we’ll help you directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  if (portalPage) return null;

  return (
    <div className="ppd-chat-root" aria-live="polite">
      {open && (
        <section className="ppd-chat-window" aria-label="Phoenix Precision Drones AI chat">
          <div className="ppd-chat-header">
            <div>
              <span className="ppd-chat-kicker">PPD AI</span>
              <h2>Ask Phoenix Precision Drones</h2>
            </div>
            <button className="ppd-chat-close" type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="ppd-chat-body" ref={scrollRef}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`ppd-chat-message ${message.role}`}>
                {message.body}
              </div>
            ))}
            {loading && <div className="ppd-chat-message assistant">Thinking…</div>}
          </div>

          <div className="ppd-chat-quick">
            {quickQuestions.map((question) => (
              <button key={question} type="button" onClick={() => void sendMessage(question)} disabled={loading}>
                {question}
              </button>
            ))}
          </div>

          <button className="ppd-chat-lead-toggle" type="button" onClick={() => setShowLeadFields((value) => !value)}>
            {showLeadFields ? "Hide contact fields" : "Add name/email for quote follow-up"}
          </button>

          {showLeadFields && (
            <div className="ppd-chat-lead-fields">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name optional" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email optional" />
            </div>
          )}

          <form className="ppd-chat-form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about drone services…"
              maxLength={1200}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>

          <p className="ppd-chat-note">
            Public business questions only. For private project records or billing, contact the company directly.
          </p>
        </section>
      )}

      <button className="ppd-chat-button" type="button" onClick={() => setOpen((value) => !value)}>
        <span>Ask PPD AI</span>
      </button>
    </div>
  );
}
