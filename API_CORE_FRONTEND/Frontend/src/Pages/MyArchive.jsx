import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/logo.svg";
import "./MyArchive.css";

export default function MyArchive() {
  const navigate = useNavigate();

  const [all, setAll] = useState([]);
  const [tab, setTab] = useState("LOST");

  // Fetch logged-in user's listings from backend
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const token = localStorage.getItem("access_token"); // adjust if stored elsewhere
        const res = await fetch("http://127.0.0.1:5000/auth/listings", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch listings");
        const data = await res.json();

        const formatted = data.map(l => ({
          id: l.id,
          title: l.title,
          where: l.where,
          when: l.when,
          status: l.status.toUpperCase(),
          img: l.photo || "/assets/default-image.png", // fallback default
        }));

        setAll(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    fetchListings();
  }, []);

  const TABS = ["LOST", "RETURNED", "FOUND"];

  const filtered = useMemo(
    () => all.filter(it => it.status === tab),
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
              <img src={it.img} alt={it.title} />
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
                <span className={`status ${it.status.toLowerCase()}`}>{it.status}</span>
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
