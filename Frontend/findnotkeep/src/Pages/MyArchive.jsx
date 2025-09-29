import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "./MyArchive.css";

export default function MyArchive() {
  const navigate = useNavigate();

  // Load user's listings (demo: from localStorage, newest first)
  const [all, setAll] = useState([]);
  useEffect(() => {
    const ls = JSON.parse(localStorage.getItem("listings") || "[]");
    // Only show approved items; if "approved" is missing, assume approved for now
    const approved = ls.filter(it => it.approved !== false);
    setAll(approved);
  }, []);

  // Filter tab
  const TABS = ["LOST", "RETURNED", "FOUND"];
  const [tab, setTab] = useState("LOST");

  const filtered = useMemo(
    () => all.filter(it => (it.status || "").toUpperCase() === tab),
    [all, tab]
  );

  return (
    <main className="mylist-wrap">
      {/* Header */}
      <header className="mylist-top">
        <img src={logo} alt="FindersNotKeepers" className="mylist-logo" />
        <h1 className="mylist-title">My Listings</h1>
        <div className="mylist-links">
          <Link to="/listings" className="link">HOME</Link>
          <button className="link as-button" onClick={() => navigate(-1)}>BACK</button>
        </div>
      </header>

      <div className="mylist-bar" />

      {/* Tabs */}
      <nav className="mylist-tabs" role="tablist" aria-label="Filter by status">
        {TABS.map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t[0] + t.slice(1).toLowerCase()} Items
          </button>
        ))}
      </nav>

      <div className="mylist-divider" />

      {/* Cards grid */}
      <section className="mylist-grid">
        {filtered.length === 0 && (
          <p className="empty">No {tab.toLowerCase()} items yet.</p>
        )}

        {filtered.map(it => (
          <article key={it.id} className="mycard">
            <div className="thumb">
              {it.img ? (
                <img src={it.img} alt={it.title} />
              ) : (
                <div className="thumb-fallback">
                  <strong>IMAGE NOT FOUND</strong>
                  <span>🖼️</span>
                </div>
              )}
            </div>

            <div className="meta">
              <div className="title-row">
                <h3 className="title">{it.title}</h3>
                <button
                  className="edit-btn"
                  title="Edit listing"
                  onClick={() => navigate(`/edit-listing/${it.id}`)}
                >
                  ✎
                </button>
              </div>

              <p className="line"><span className="k">Where:</span> {it.where}</p>
              <p className="line"><span className="k">When:</span> {it.when}</p>
              <p className="line">
                <span className="k">Status:</span>{" "}
                <span className={`status ${it.status?.toLowerCase()}`}>{it.status}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Create listing CTA */}
      <section className="create-cta" onClick={() => navigate("/create")} role="button" tabIndex={0}
        onKeyDown={(e)=> (e.key === "Enter" || e.key === " ") && navigate("/create")}>
        <h2>Create Listing</h2>
      </section>
    </main>
  );
}
