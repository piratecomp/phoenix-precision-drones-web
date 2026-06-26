"use client";

type DeskBox = {
  id: string;
  display_name?: string;
  email_address?: string;
  department_key?: string;
  mailbox_type?: string;
};

type DeskThread = {
  id: string;
  subject?: string;
  external_contact?: string;
  priority?: string;
  thread_status?: string;
  unread_count?: number;
  last_message_at?: string;
};

export default function ZPanel({ boxes = [], threads = [] }: { boxes?: DeskBox[]; threads?: DeskThread[] }) {
  return (
    <section className="panel-card company-desk-panel">
      <div className="panel-heading-row">
        <div>
          <span className="section-kicker">Company Communications</span>
          <h2>Department & Employee Inbox</h2>
          <p>
            Shared department addresses and employee addresses are organized here for review, replies, and internal handoff.
          </p>
        </div>
      </div>
      <div className="desk-layout">
        <aside className="desk-sidebar">
          <h3>Mailboxes</h3>
          {boxes.length === 0 ? (
            <p className="muted-copy">No mailbox data loaded yet.</p>
          ) : (
            boxes.map((box) => (
              <div className="desk-box" key={box.id}>
                <strong>{box.display_name}</strong>
                <span>{box.email_address}</span>
              </div>
            ))
          )}
        </aside>
        <div className="desk-thread-list">
          <h3>Threads</h3>
          {threads.length === 0 ? (
            <p className="muted-copy">No message threads selected.</p>
          ) : (
            threads.map((thread) => (
              <article className="desk-thread" key={thread.id}>
                <strong>{thread.subject || "Untitled thread"}</strong>
                <span>{thread.external_contact || "No external contact"}</span>
                <small>{thread.thread_status || "open"} · {thread.priority || "normal"}</small>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
