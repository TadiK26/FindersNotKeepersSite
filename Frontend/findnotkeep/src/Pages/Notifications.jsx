import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "./Notifications.css";

/** Demo data — swap for real API later */
const SEED = [
  {
    id: 1,
    title: "Sara sent a message",
    body: "Found your black Laptop bag",
    unread: true,
    type: "message",
    threadId: "sara",        // deep-link target
    at: "Today • 10:25",
  },
  {
    id: 2,
    title: "David sent a message",
    body: "Looking for lost Dell Laptop",
    unread: false,
    type: "message",
    threadId: "david",
    at: "Yesterday • 09:12",
  },
  {
    id: 3,
    title: "Verify your account",
    body: "Verify your email address",
    unread: true,
    type: "system",
    at: "2 days ago • 08:00",
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(SEED);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
    );
  }, [items, query]);

  const openItem = (n) => {
    // Mark read locally
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));

    // Deep-link messages if this is a chat notification
    if (n.type === "message" && n.threadId) {
      navigate(`/messages/${n.threadId}`);
    }
  };

  const clearAll = () => setItems([]);

  return (
    <main className="note-wrap">
      {/* Header */}
      <header className="note-top">
        <img src={logo} alt="FindersNotKeepers" className="note-logo" />
        <h1 className="note-title">
          Notifications <span className="note-icon" aria-hidden>🔔</span>
        </h1>
        <Link to="/listings" className="note-home">HOME</Link>
      </header>

      <div className="note-bar" />

      {/* Search + Clear */}
      <div className="note-actions">
        <input
          className="note-search"
          type="text"
          placeholder="Search notifications…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="note-clear" onClick={clearAll} disabled={!items.length}>
          Clear all
        </button>
      </div>

      {/* List */}
      <section className="note-list">
        {filtered.length === 0 ? (
          <p className="note-empty">No notifications.</p>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              className={`note-row ${n.unread ? "unread" : ""}`}
              onClick={() => openItem(n)}
            >
              <div className="note-main">
                <div className="note-titleline">
                  <span className="note-row-title">{n.title}</span>
                  <span className={`dot ${n.unread ? "on" : ""}`} aria-hidden />
                </div>
                <div className="note-body">{n.body}</div>
                <div className="note-meta">{n.at}</div>
              </div>
            </button>
          ))
        )}
      </section>
    </main>
  );
}
