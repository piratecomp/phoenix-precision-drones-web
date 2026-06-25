"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, ChevronDown, MessageSquare, RefreshCw, Send, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type InternalThread = {
  id: string;
  thread_title: string;
  department_key: string;
  priority: string;
  unread_count?: number;
  last_message_body?: string;
  last_sender?: string;
  last_sender_type?: string;
  last_message_created_at?: string;
};

type InternalMessage = {
  id: string;
  thread_id: string;
  sender_type: string;
  sender_display_name: string;
  message_type: string;
  message_body: string;
  action_label?: string | null;
  action_path?: string | null;
  priority?: string;
  created_at: string;
};

function activeDashboardKey() {
  if (typeof window === "undefined") return "owner";
  const path = window.location.pathname;
  if (path.includes("/portal/admin")) return "admin";
  if (path.includes("/portal/finance")) return "finance";
  if (path.includes("/portal/maintenance")) return "maintenance";
  if (path.includes("/portal/safety")) return "safety";
  if (path.includes("/portal/sales")) return "sales";
  if (path.includes("/portal/pilot")) return "pilot_network";
  if (path.includes("/portal/observer")) return "pilot_network";
  if (path.includes("/portal/customer")) return "customer";
  return "owner";
}

export default function InternalMessageWindow() {
  const [portalPage, setPortalPage] = useState(false);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<InternalThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) || threads[0], [threads, activeThreadId]);
  const unreadTotal = useMemo(() => threads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0), [threads]);

  async function loadInbox() {
    if (typeof window === "undefined") return;
    setPortalPage(window.location.pathname.startsWith("/portal"));
    if (!window.location.pathname.startsWith("/portal")) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setThreads([]);
        setMessages([]);
        return;
      }
      const { data, error } = await supabase.rpc("ppd_get_internal_inbox", {
        p_dashboard_key: activeDashboardKey(),
        p_limit: 30,
      });
      if (error) throw error;
      const nextThreads = data?.threads || [];
      setThreads(nextThreads);
      const nextActive = activeThreadId && nextThreads.some((t: InternalThread) => t.id === activeThreadId)
        ? activeThreadId
        : nextThreads[0]?.id || null;
      setActiveThreadId(nextActive);
      if (nextActive) await loadThread(nextActive, false);
    } catch (err: any) {
      setNotice(err?.message || "Internal messages unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(threadId: string, showLoading = true) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase.rpc("ppd_get_internal_thread", {
        p_thread_id: threadId,
        p_limit: 60,
      });
      if (error) throw error;
      setMessages(data?.messages || []);
      setActiveThreadId(threadId);
    } catch (err: any) {
      setNotice(err?.message || "Unable to load thread.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeThread) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDraft("");
    try {
      const { error } = await supabase.rpc("ppd_send_internal_message", {
        p_thread_id: activeThread.id,
        p_message_body: body,
        p_message_type: "message",
        p_action_label: null,
        p_action_path: null,
        p_priority: "normal",
      });
      if (error) throw error;
      await loadThread(activeThread.id, false);
      await loadInbox();
    } catch (err: any) {
      setNotice(err?.message || "Unable to send message.");
      setDraft(body);
    }
  }

  useEffect(() => {
    loadInbox();
    const interval = window.setInterval(loadInbox, 45000);
    return () => window.clearInterval(interval);
  }, []);

  if (!portalPage) return null;

  return (
    <div className={`ppd-internal-msg ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
      {!open && (
        <button className="ppd-msg-launch" type="button" onClick={() => setOpen(true)} aria-label="Open internal messages">
          <MessageSquare size={22} />
          <span>Internal</span>
          {unreadTotal > 0 && <strong>{unreadTotal}</strong>}
        </button>
      )}

      {open && (
        <section className="ppd-msg-panel" aria-label="Internal employee and AI messages">
          <header className="ppd-msg-header">
            <div>
              <span><Bot size={17} /> PPD AI + Internal</span>
              <h3>Message Center</h3>
            </div>
            <div className="ppd-msg-controls">
              <button type="button" onClick={loadInbox} title="Refresh"><RefreshCw size={16} /></button>
              <button type="button" onClick={() => setCollapsed(!collapsed)} title="Collapse"><ChevronDown size={16} /></button>
              <button type="button" onClick={() => setOpen(false)} title="Close"><X size={16} /></button>
            </div>
          </header>

          {!collapsed && (
            <div className="ppd-msg-body">
              <aside className="ppd-msg-threads">
                {threads.length === 0 && <p className="ppd-msg-empty">No internal channels loaded yet.</p>}
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    className={thread.id === activeThread?.id ? "active" : ""}
                    type="button"
                    onClick={() => loadThread(thread.id)}
                  >
                    <span>{thread.thread_title}</span>
                    <small>{thread.last_sender || "PPD AI"}: {thread.last_message_body || "Ready"}</small>
                    {Number(thread.unread_count || 0) > 0 && <strong>{thread.unread_count}</strong>}
                  </button>
                ))}
              </aside>

              <main className="ppd-msg-thread-view">
                <div className="ppd-msg-thread-title">
                  <span>{activeThread?.department_key || "internal"}</span>
                  <strong>{activeThread?.thread_title || "Internal Messages"}</strong>
                </div>

                <div className="ppd-msg-list">
                  {loading && <p className="ppd-msg-empty">Loading...</p>}
                  {!loading && messages.length === 0 && <p className="ppd-msg-empty">No messages yet.</p>}
                  {messages.map((message) => (
                    <article className={`ppd-msg-bubble ${message.sender_type}`} key={message.id}>
                      <span>{message.sender_display_name}</span>
                      <p>{message.message_body}</p>
                      {message.action_label && message.action_path && <a href={message.action_path}>{message.action_label}</a>}
                    </article>
                  ))}
                </div>

                <form className="ppd-msg-compose" onSubmit={sendMessage}>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Message employee channel or PPD AI..."
                  />
                  <button type="submit" aria-label="Send internal message"><Send size={18} /></button>
                </form>
                {notice && <p className="ppd-msg-notice">{notice}</p>}
              </main>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
