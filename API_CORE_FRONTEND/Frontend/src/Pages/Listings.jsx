import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '/logo.svg';
import profileIcon from '../assets/profile_icon.svg';
import notificationsIcon from '../assets/notifications_icon.svg';
import settingsIcon from '../assets/settings_icon.svg';
import messageIcon from '../assets/message.svg';
import './Listings.css';

export default function Listings() {
  const itemsPerPage = 6;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [otherItemsPage, setOtherItemsPage] = useState(1);
  const [items, setItems] = useState([]);

  // Fetch listings from backend
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/auth/all-listings');
        const data = await res.json();
        setItems(data);
        console.log('Fetched listings:', data);
      } catch (err) {
        console.error('Error fetching listings:', err);
      }
    };
    fetchListings();
  }, []);

  // Filter listings by search query
  const filtered = items.filter(
    (it) =>
      it.title?.toLowerCase().includes(query.toLowerCase()) ||
      it.where?.toLowerCase().includes(query.toLowerCase()) ||
      it.status?.toLowerCase().includes(query.toLowerCase())
  );

  // Sidebar "other items"
  const otherItems = filtered.filter((item) => item.id !== selectedItem?.id);
  const otherItemsPerPage = 2;
  const otherItemsTotalPages = Math.ceil(otherItems.length / otherItemsPerPage);
  const otherItemsStart = (otherItemsPage - 1) * otherItemsPerPage;
  const visibleOtherItems = otherItems.slice(
    otherItemsStart,
    otherItemsStart + otherItemsPerPage
  );

  // Paginate main listing
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const visibleItems = filtered.slice(start, end);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedItem(null);
    setPage(1);
  }, [query]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setOtherItemsPage(1);
  };

  const handleBackClick = () => {
    setSelectedItem(null);
    setOtherItemsPage(1);
  };

  if (selectedItem) {
    return (
      <main className="listings-wrap detailed-view">
        {/* Header */}
        <header className="listings-top">
          <img src={logo} alt="FindersNotKeepers" className="site-logo" />
        </header>

        {/* Right rail icons */}
        <aside className="icons" aria-label="Quick actions">
          <Link to="/notifications" className="rail-icon">
            <img src={notificationsIcon} alt="Notifications" />
          </Link>
          <Link to="/profile" className="rail-icon">
            <img src={profileIcon} alt="Profile" />
          </Link>
          <Link to="/settings" className="rail-icon">
            <img src={settingsIcon} alt="Settings" />
          </Link>
          <Link to="/settings" className="rail-icon">
            <img src={settingsIcon} alt="Settings" />
          </Link>
        </aside>

        {/* Back button */}
        <div className="back-button-container">
          <button className="back-button" onClick={handleBackClick}>
            ← Back to All Listings
          </button>
        </div>

        <div className="detailed-layout">
          {/* Other listings sidebar */}
          <aside className="other-listings-sidebar">
            <h3>Other Listings</h3>
            <div className="other-listings-container">
              {visibleOtherItems.map((item) => (
                <article
                  key={item.id}
                  className="card small-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="thumb">
                    <img
                      src={
                        item.photo
                          ? `http://127.0.0.1:5000${item.photo}`
                          : '/default-image.png'
                      }
                      alt={item.title}
                    />
                  </div>
                  <div className="meta">
                    <h4 className="title">{item.title}</h4>
                    <p className="line">
                      <span className="k">Status:</span>{' '}
                      <span className={`status ${item.status?.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {otherItemsTotalPages > 1 && (
              <div className="other-listings-pager">
                <button
                  className="page-btn"
                  onClick={() =>
                    setOtherItemsPage((p) => Math.max(1, p - 1))
                  }
                  disabled={otherItemsPage === 1}
                >
                  ↑
                </button>
                <span>
                  Page {otherItemsPage} of {otherItemsTotalPages}
                </span>
                <button
                  className="page-btn"
                  onClick={() =>
                    setOtherItemsPage((p) =>
                      Math.min(otherItemsTotalPages, p + 1)
                    )
                  }
                  disabled={otherItemsPage === otherItemsTotalPages}
                >
                  ↓
                </button>
              </div>
            )}
          </aside>

          {/* Detailed view */}
          <section className="detailed-card">
            <div className="detailed-thumb">
              <img
                src={
                  selectedItem.photo
                    ? `http://127.0.0.1:5000${selectedItem.photo}`
                    : '/default-image.png'
                }
                alt={selectedItem.title}
              />
            </div>
            <div className="detailed-meta">
              <h1>{selectedItem.title}</h1>
              <div className="detailed-info">
                <p>
                  <strong>Where:</strong> {selectedItem.where}
                </p>
                <p>
                  <strong>When:</strong> {selectedItem.when}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    className={`status large ${selectedItem.status?.toLowerCase()}`}
                  >
                    {selectedItem.status}
                  </span>
                </p>
                <p>
                  <strong>Description:</strong> {selectedItem.description}
                </p>
              </div>

              {/* Contact */}
              <div className="contact-section">
                <h3>Contact</h3>
                <p>If this is your item or you have information, please contact:</p>
                <div className="contact-info">
                  <p>Email: contact@findersnotkeepers.com</p>
                  <p>Phone: (012) 345-6789</p>
                  <p>Reference ID: #{selectedItem.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mini-footer">
          <a>Contact us</a>
          <a>FAQs</a>
          <a>Terms and conditions</a>
          <a>Privacy</a>
        </footer>
        <p className="copy">© 2025 FindersNotKeepers</p>
      </main>
    );
  }

  return (
    <main className="listings-wrap">
      {/* Header */}
      <header className="listings-top">
        <img src={logo} alt="FindersNotKeepers" className="site-logo" />
      </header>

      {/* Right rail icons */}
      <aside className="icons" aria-label="Quick actions">
        <Link to="/notifications" className="rail-icon">
          <img src={notificationsIcon} alt="Notifications" />
        </Link>
        <Link to="/profile" className="rail-icon">
          <img src={profileIcon} alt="Profile" />
        </Link>
        <Link to="/settings" className="rail-icon">
          <img src={settingsIcon} alt="Settings" />
        </Link>
        <Link to="/messages" className="rail-icon">
          <img src={messageIcon} alt="Messages" />
        </Link>
      </aside>

      {/* Page title */}
      <div className="heading">
        <h1 className="page-title">All Listings</h1>
        <div className="title-bar" />
      </div>

      <div className="actions-row">
        <div className="searchbar">
          <input
            type="text"
            placeholder="Search items..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <nav className="reportbut">
          <Link to="/create">REPORT</Link>
        </nav>
      </div>

      {/* Grid */}
      <section className="listingcard-grid">
        {visibleItems.map((it) => (
          <article
            key={it.id}
            className="card selectable-card"
            onClick={() => handleCardClick(it)}
          >
            <div className="thumb">
              <img
                src={it.photo ? `http://127.0.0.1:5000${it.photo}` : '/default-image.png'}
                alt={it.title}
              />
            </div>
            <div className="meta">
              <h3 className="title">{it.title}</h3>
              <p className="line">
                <span className="k">Where:</span> {it.where}
              </p>
              <p className="line">
                <span className="k">When:</span> {it.when}
              </p>
              <p className="line">
                <span className="k">Status:</span>{' '}
                <span className={`status ${it.status?.toLowerCase()}`}>{it.status}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Pager */}
      <div className="pager">
        <button
          className="page-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          «
        </button>

        {[...Array(totalPages)].map((_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              className={`dot ${page === n ? 'active' : ''}`}
              aria-label={`Page ${n}`}
              onClick={() => setPage(n)}
            />
          );
        })}

        <button
          className="page-btn"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          »
        </button>
      </div>

      {/* Footer */}
      <footer className="mini-footer">
        <a>Contact us</a>
        <a>FAQs</a>
        <a>Terms and conditions</a>
        <a>Privacy</a>
      </footer>
      <p className="copy">© 2025 FindersNotKeepers</p>
    </main>
  );
}
