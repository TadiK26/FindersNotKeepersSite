import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "./Messages.css";

/*MESSAGRS PAGE WITH OPTION TO TYPE MESSAGE*/
const DEMO_THREADS = [
  {
    id: "sara",
    name: "Sara",
    preview: "Found your black Laptop bag",
    unread: true,
    messages: [
      { id: 1, from: "Sara", text: "Hi! I think I found your black laptop bag.", at: "10:21" },
      { id: 2, from: "You",  text: "That’s amazing! Where can we meet?", at: "10:22" },
    ]
  },
  {
    id: "david",
    name: "David",
    preview: "Looking for lost Dell Laptop",
    unread: false,
    messages: [
      { id: 1, from: "David", text: "Have you seen a Dell Laptop near the library?", at: "09:05" }
    ]
  },
  {
    id: "system",
    name: "System",
    preview: "Verify your account",
    unread: false,
    messages: [
      { id: 1, from: "System", text: "Please verify your email to enable messages.", at: "08:00" }
    ]
  }
];

export default function Messages() {
  const { id } = useParams();                      // /messages/:id
  const navigate = useNavigate();
  const [threads, setThreads] = useState(DEMO_THREADS);
  const [draft, setDraft] = useState("");

  const current = useMemo(() => {
    const t = threads.find(t => t.id === (id || threads[0]?.id));
    return t || null;
  }, [threads, id]);

  // When you “send” a message (front-end only)
  const send = (e) => {
    e.preventDefault();
    if (!draft.trim() || !current) return;
    setThreads(ts =>
      ts.map(t => t.id === current.id
        ? { ...t, messages: [...t.messages, { id: Date.now(), from: "You", text: draft.trim(), at: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }], preview: draft.trim(), unread: false }
        : t
      )
    );
    setDraft("");
  };

  const openThread = (tid) => navigate(`/messages/${tid}`);

  return (
    <main className="msg-wrap">
      {/* header */}
      <header className="msg-top">
        <img src={logo} alt="FindersNotKeepers" className="msg-logo" />
        <h1 className="msg-title">Messages <span className="msg-icon" aria-hidden>💬</span></h1>
        <Link to="/listings" className="msg-home">HOME</Link>
      </header>

      <div className="msg-bar" />

      {/* two-column layout */}
      <section className="msg-grid">
        {/* left: thread list */}
        <aside className="thread-list">
          <input
            className="thread-search"
            placeholder="Search conversations"
            onChange={(e)=>{
              const q = e.target.value.toLowerCase();
              setThreads(DEMO_THREADS.filter(t =>
                t.name.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q)
              ));
            }}
          />
          <div className="thread-scroll">
            {threads.map(t => (
              <button
                key={t.id}
                className={`thread-item ${current?.id === t.id ? "active" : ""}`}
                onClick={()=>openThread(t.id)}
              >
                <div className="thread-name">
                  {t.name}
                  {t.unread ? <span className="pill">NEW</span> : null}
                </div>
                <div className="thread-preview">{t.preview}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* right: chat panel */}
        <section className="chat-panel">
          {current ? (
            <>
              <div className="chat-head">
                <strong>{current.name}</strong>
              </div>

              <div className="chat-scroll">
                {current.messages.map(m => (
                  <div key={m.id} className={`bubble ${m.from === "You" ? "me" : "them"}`}>
                    <div className="bubble-text">{m.text}</div>
                    <div className="bubble-meta">{m.from} · {m.at}</div>
                  </div>
                ))}
              </div>

              <form className="chat-compose" onSubmit={send}>
                <input
                  className="chat-input"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e)=>setDraft(e.target.value)}
                />
                <button className="chat-send" type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="chat-empty">Select a conversation</div>
          )}
        </section>
      </section>
    </main>
  );
}
