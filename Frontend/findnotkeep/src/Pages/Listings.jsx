import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '/logo.svg'
import profileIcon from '../assets/profile_icon.svg'
import notificationsIcon from '../assets/notifications_icon.svg'
import settingsIcon from '../assets/settings_icon.svg'
import './Listings.css'

import laptopbag from '../photos/blacklaptop.jpg'
import digitalcamera from '../photos/digitalcamera.jpg'
import balletshoes from '../photos/balletshoes.jpg'
import keys from '../photos/keys.jpg'
import watch from '../photos/watch.jpg'
import orangeglasses from '../photos/orange glasses.jpg'
import wallet from '../photos/wallet.jpg'
import teddy from '../photos/teddy.jpg'

const ITEMS = [
  { id: 1,  title: 'Black Laptop Bag',  where: 'UP, Hatfield Campus',    when: '7 September 2025',  status: 'LOST',     img: laptopbag, description: 'Black laptop bag with silver zippers. Contains laptop charger and notebooks.' },
  { id: 2,  title: 'Digital Camera',    where: 'Brooklyn Mall, Pretoria', when: '3 September 2025',  status: 'FOUND',    img: digitalcamera, description: 'Canon EOS Rebel T7 with 18-55mm lens. Found near the food court.' },
  { id: 3,  title: 'Ballet Shoes',      where: 'UP, Hatfield Campus',    when: '31 August 2025',    status: 'RETURNED', img: balletshoes, description: 'Pink ballet shoes with worn soles. Size 6. Returned to dance department.' },
  { id: 4,  title: 'A Set of Keys',     where: 'UP, Hatfield Campus',    when: '1 September 2025',  status: 'LOST',     img: keys, description: 'Set of 5 keys with a blue keychain. Includes car key and office keys.' },
  { id: 5,  title: 'Emporio Armani Watch', where: 'Menlyn Maine, Pretoria', when: '1 September 2025', status: 'LOST',     img: watch, description: 'Black Emporio Armani watch with leather strap. Lost near the fountain.' },
  { id: 6,  title: 'Orange Glasses',    where: 'UP, Hatfield Campus',    when: '4 September 2025',  status: 'FOUND',    img: orangeglasses, description: 'Orange retro-style sunglasses. Found in the library reading area.' },
  { id: 7,  title: 'Brown Wallet',      where: 'Menlyn Maine, Pretoria', when: '3 September 2025',  status: 'RETURNED', img: wallet, description: 'Brown leather wallet containing ID cards. Returned to security office.' },
  { id: 8,  title: 'White Teddy Bear',  where: 'UP, Hatfield Campus',    when: '6 September 2025',  status: 'LOST',     img: teddy, description: 'Small white teddy bear with red ribbon. Lost near student center.' },
];

export default function Listings() {
  const itemsPerPage = 6;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [otherItemsPage, setOtherItemsPage] = useState(1);

  // Filter by query
  const filtered = ITEMS.filter(it =>
    it.title.toLowerCase().includes(query.toLowerCase()) ||
    it.where.toLowerCase().includes(query.toLowerCase()) ||
    it.status.toLowerCase().includes(query.toLowerCase())
  );

  // Get other items (excluding selected item)
  const otherItems = filtered.filter(item => item.id !== selectedItem?.id);
  const otherItemsPerPage = 2;
  const otherItemsTotalPages = Math.ceil(otherItems.length / otherItemsPerPage);
  const otherItemsStart = (otherItemsPage - 1) * otherItemsPerPage;
  const visibleOtherItems = otherItems.slice(otherItemsStart, otherItemsStart + otherItemsPerPage);

  // Paginate the filtered list for main view
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
        {/* Top header */}
        <header className="listings-top">
          <img src={logo} alt="FindersNotKeepers" className="site-logo" />
        </header>

        {/* Right rail icons */}
        <aside className="icons" aria-label="Quick actions">
          <Link to="/notifications" className="rail-icon" aria-label="Notifications">
            <img src={notificationsIcon} alt="Notifications" />
          </Link>
          <Link to="/profile" className="rail-icon" aria-label="Profile">
            <img src={profileIcon} alt="Profile" />
          </Link>
          <Link to="/settings" className="rail-icon" aria-label="Settings">
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
              {visibleOtherItems.map(item => (
                <article 
                  key={item.id} 
                  className="card small-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="thumb">
                    <img src={item.img} alt={item.title} />
                  </div>
                  <div className="meta">
                    <h4 className="title">{item.title}</h4>
                    <p className="line"><span className="k">Status:</span>{' '}
                      <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
            
            {/* Pagination for other listings */}
            {otherItemsTotalPages > 1 && (
              <div className="other-listings-pager">
                <button
                  className="page-btn"
                  onClick={() => setOtherItemsPage(p => Math.max(1, p - 1))}
                  disabled={otherItemsPage === 1}
                >
                  ↑
                </button>
                <span>Page {otherItemsPage} of {otherItemsTotalPages}</span>
                <button
                  className="page-btn"
                  onClick={() => setOtherItemsPage(p => Math.min(otherItemsTotalPages, p + 1))}
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
              <img src={selectedItem.img} alt={selectedItem.title} />
            </div>
            <div className="detailed-meta">
              <h1>{selectedItem.title}</h1>
              <div className="detailed-info">
                <p><strong>Where:</strong> {selectedItem.where}</p>
                <p><strong>When:</strong> {selectedItem.when}</p>
                <p><strong>Status:</strong>{' '}
                  <span className={`status large ${selectedItem.status.toLowerCase()}`}>
                    {selectedItem.status}
                  </span>
                </p>
                <p><strong>Description:</strong> {selectedItem.description}</p>
              </div>
              
              {/* Contact section */}
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

      {/* Top header */}
      <header className="listings-top">
        <img src={logo} alt="FindersNotKeepers" className="site-logo" />
      </header>

      {/* Right rail icons */}
      <aside className="icons" aria-label="Quick actions">
        <Link to="/notifications" className="rail-icon" aria-label="Notifications">
          <img src={notificationsIcon} alt="Notifications" />
        </Link>
        <Link to="/profile" className="rail-icon" aria-label="Profile">
          <img src={profileIcon} alt="Profile" />
        </Link>
        <Link to="/settings" className="rail-icon" aria-label="Settings">
          <img src={settingsIcon} alt="Settings" />
        </Link>
      </aside>

      {/* Page title + bar */}
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
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
        </div>

        <nav className="reportbut">
          <Link to="/report-lost">REPORT</Link>
        </nav>
      </div>

      {/* Grid */}
      <section className="listingcard-grid">
        {visibleItems.map(it => (
          <article 
            key={it.id} 
            className="card selectable-card"
            onClick={() => handleCardClick(it)}
          >
            <div className="thumb">
              <img src={it.img} alt={it.title} />
            </div>
            <div className="meta">
              <h3 className="title">{it.title}</h3>
              <p className="line"><span className="k">Where:</span> {it.where}</p>
              <p className="line"><span className="k">When:</span> {it.when}</p>
              <p className="line">
                <span className="k">Status:</span>{' '}
                <span className={`status ${it.status.toLowerCase()}`}>{it.status}</span>
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Pager */}
      <div className="pager">
        <button
          className="page-btn"
          aria-label="Previous"
          onClick={() => setPage(p => Math.max(1, p - 1))}
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
          aria-label="Next"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
  )
}