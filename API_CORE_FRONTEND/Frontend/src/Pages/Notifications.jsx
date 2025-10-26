import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "./Notifications.css";

export default function Notifications() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const token = localStorage.getItem("access_token");

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/auth/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setItems(data);
        else console.error("Failed to fetch notifications:", data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
    );
  }, [items, query]);

  const clearAll = () => setItems([]);

  return (
    <main className="note-wrap">
      <header className="note-top">
        <img src={logo} alt="FindersNotKeepers" className="note-logo" />
        <h1 className="note-title">
          Notifications <span className="note-icon" aria-hidden>🔔</span>
        </h1>
        <Link to="/listings" className="note-home">HOME</Link>
      </header>

      <div className="note-bar" />

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

      <section className="note-list">
        {filtered.length === 0 ? (
          <p className="note-empty">No notifications yet.</p>
        ) : (
        filtered.map((n) => (
          <div
            key={n.id}
            className={`note-row ${n.unread ? "unread" : ""}`}
            onClick={() => navigate(`/listing/${n.listing_id}`)}  // 👈 Go to detail
            style={{ cursor: "pointer" }}
          >
              <div className="note-main">
                <div className="note-titleline">
                  <span className="note-row-title">{n.title}</span>
                  <span className={`dot ${n.unread ? "on" : ""}`} />
                </div>
                <div className="note-body">{n.body}</div>
                <div className="note-meta">{n.at}</div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
