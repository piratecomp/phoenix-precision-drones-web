"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, Bot, CheckCircle2, Mail, MessageSquare, RefreshCw, Send } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { markNotificationRead, type PortalNotification } from "@/lib/portalApi";

type Thread = {
  id: string;
  thread_title: string;
  department_key: string;
  unread_count?: number;
  last_message_body?: string;
  last_sender?: string;
};

type Message = {
  id: string;
  sender_type: string;
  sender_display_name: string;
  message_body: string;
  action_label?: string | null;
  action_path?: string | null;
};

type Props = {
  dashboardKey: string;
  notifications: PortalNotification[];
  onRefresh?: () => Promise<void> | void;
  compact?: boolean;
};

type Tab = "internal" | "email" | "alerts" | "ai";

export default function DashboardCommunicationsPanel({ dashboardKey, notifications, onRefresh, compact = false }: Props) {
  const [tab, setTab] = useState<Tab>("internal");
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) || threads[0], [threads, activeThreadId]);

  async function loadThread(threadId: string, showLoading = true) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase.rpc("ppd_get_internal_thread", {
        p_thread_id: threadId,
        p_limit: compact ? 25 : 80,
      });
      if (error) throw error;
      setMessages(data?.messages || []);
      setActiveThreadId(threadId);
      setNotice(null);
    } catch (err: any) {
      setNotice(err?.message || "Unable to load internal thread.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function loadInbox(showLoading = true) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (showLoading) setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const { data, error } = await supabase.rpc("ppd_get_internal_inbox", {
        p_dashboard_key: dashboardKey,
        p_limit: compact ? 12 : 30,
      });
      if (error) throw error;
      const nextThreads = data?.threads || [];
      setThreads(nextThreads);
      const nextActive = activeThreadId && nextThreads.some((thread: Thread) => thread.id === activeThreadId)
        ? activeThreadId
        : nextThreads[0]?.id || null;
      setActiveThreadId(nextActive);
      if (nextActive) await loadThread(nextActive, false);
      setNotice(null);
    } catch (err: any) {
      setNotice(err?.message || "Internal communications unavailable.");
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
    setLoading(true);
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
      await loadInbox(false);
      setNotice(null);
    } catch (err: any) {
      setNotice(err?.message || "Unable to send internal message.");
      setDraft(body);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(notification: PortalNotification) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      await markNotificationRead(supabase, notification.id);
      await onRefresh?.();
    } catch (err: any) {
      setNotice(err?.message || "Unable to update notification.");
    }
  }

  useEffect(() => {
    void loadInbox();
  }, [dashboardKey]);

  const emailNotifications = notifications.filter((note) => String(note.notification_title || note.notification_type || "").toLowerCase().includes("email"));
  const tabButtons: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: "internal", label: "Internal", icon: <MessageSquare size={15} /> },
    { key: "email", label: "Email", icon: <Mail size={15} /> },
    { key: "alerts", label: "Alerts", icon: <Bell size={15} /> },
    { key: "ai", label: "PPD AI", icon: <Bot size={15} /> },
  ];

  return (
    <article className={`panel-card portal-workflow-card portal-embedded-comms ${compact ? "compact" : ""}`}>
      <div className="portal-game-panel-head portal-comms-head">
        <div>
          <span className="section-kicker">Communications</span>
          <h3>Message Center</h3>
        </div>
        <button className="compact-portal-btn ghost-btn" type="button" onClick={() => { void loadInbox(); void onRefresh?.(); }}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="portal-action-list portal-comms-tabs">
        {tabButtons.map((item) => (
          <button className={`compact-portal-btn ghost-btn ${tab === item.key ? "active" : ""}`} key={item.key} type="button" onClick={() => setTab(item.key)} title={item.label}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {tab === "internal" && (
        <div className="portal-comms-grid">
          <aside className="portal-comms-thread-list">
            {threads.length === 0 && <p>No channels loaded.</p>}
            {threads.map((thread) => (
              <button className={thread.id === activeThread?.id ? "active" : ""} key={thread.id} type="button" onClick={() => loadThread(thread.id)}>
                <strong>{thread.thread_title}</strong>
                <span>{thread.last_sender || "PPD AI"}: {thread.last_message_body || "Ready"}</span>
                {Number(thread.unread_count || 0) > 0 && <em>{thread.unread_count}</em>}
              </button>
            ))}
          </aside>

          <main className="portal-comms-thread">
            <div className="portal-comms-title">
              <span>{activeThread?.department_key || "internal"}</span>
              <strong>{activeThread?.thread_title || "Internal Messages"}</strong>
            </div>
            <div className="portal-comms-messages">
              {loading && <p>Loading...</p>}
              {!loading && messages.length === 0 && <p>No messages yet.</p>}
              {messages.map((message) => (
                <article className={`portal-comms-bubble ${message.sender_type}`} key={message.id}>
                  <span>{message.sender_display_name}</span>
                  <p>{message.message_body}</p>
                  {message.action_label && message.action_path && <a href={message.action_path}>{message.action_label}</a>}
                </article>
              ))}
            </div>
            <form className="portal-comms-compose" onSubmit={sendMessage}>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message PPD AI..." />
              <button type="submit" disabled={!draft.trim() || loading}><Send size={18} /></button>
            </form>
          </main>
        </div>
      )}

      {tab === "email" && (
        <div className="portal-task-list portal-comms-simple-list">
          {emailNotifications.length === 0 && <p>No unread email notifications.</p>}
          {emailNotifications.slice(0, compact ? 4 : 8).map((note) => (
            <div className="portal-task-row" key={note.id}>
              <div><strong>{note.notification_title}</strong><span>{note.notification_body || note.notification_type}</span></div>
              <button type="button" onClick={() => markRead(note)}><CheckCircle2 size={16} /> Read</button>
            </div>
          ))}
        </div>
      )}

      {tab === "alerts" && (
        <div className="portal-task-list portal-comms-simple-list">
          {notifications.length === 0 && <p>No unread alerts.</p>}
          {notifications.slice(0, compact ? 4 : 8).map((note) => (
            <div className="portal-task-row" key={note.id}>
              <div><strong>{note.notification_title}</strong><span>{note.notification_body || note.notification_type}</span></div>
              <button type="button" onClick={() => markRead(note)}><CheckCircle2 size={16} /> Read</button>
            </div>
          ))}
        </div>
      )}

      {tab === "ai" && (
        <div className="portal-task-list portal-comms-simple-list">
          <div className="portal-action-row"><Bot size={18} /><div><strong>PPD AI internal mode</strong><span>Use Internal to message the active department channel. PPD AI replies are written into the same thread.</span></div></div>
          <div className="portal-action-row"><Mail size={18} /><div><strong>Email status</strong><span>Inbound email drafts are created by Communication AI. Outbound delivery depends on the email worker processing the queue.</span></div></div>
        </div>
      )}

      {notice && <p className="portal-error-note">{notice}</p>}
    </article>
  );
}
