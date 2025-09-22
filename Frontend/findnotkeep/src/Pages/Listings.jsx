import { Link } from 'react-router-dom'
import logo from '/logo.svg'
import profileIcon from '../assets/profile_icon.svg'
import notificationsIcon from '../assets/notifications_icon.svg'
import settingsIcon from '../assets/settings_icon.svg'
import './Listings.css'

const ITEMS = [
  { id: 1,  title: 'Black Laptop Bag',  where: 'UP, Hatfield Campus',    when: '7 September 2025',  status: 'LOST',     img: '/assets/listing-laptop-bag.jpg' },
  { id: 2,  title: 'Digital Camera',    where: 'Brooklyn Mall, Pretoria', when: '3 September 2025',  status: 'FOUND',    img: '/assets/listing-camera.jpg' },
  { id: 3,  title: 'Ballet Shoes',      where: 'UP, Hatfield Campus',    when: '31 August 2025',    status: 'RETURNED', img: '/assets/listing-ballet.jpg' },
  { id: 4,  title: 'A Set of Keys',     where: 'UP, Hatfield Campus',    when: '1 September 2025',  status: 'LOST',     img: '/assets/listing-keys.jpg' },
  { id: 5,  title: 'Emporio Armani Watch', where: 'Menlyn Maine, Pretoria', when: '1 September 2025', status: 'LOST',     img: '/assets/listing-watch.jpg' },
  { id: 6,  title: 'Orange Glasses',    where: 'UP, Hatfield Campus',    when: '4 September 2025',  status: 'FOUND',    img: '/assets/listing-glasses.jpg' },
  { id: 7,  title: 'Brown Wallet',      where: 'Menlyn Maine, Pretoria', when: '3 September 2025',  status: 'RETURNED', img: '/assets/listing-wallet.jpg' },
  { id: 8,  title: 'White Teddy Bear',  where: 'UP, Hatfield Campus',    when: '6 September 2025',  status: 'LOST',     img: '/assets/listing-teddy.jpg' },
];

export default function Listings() {
  return (
    <main className="listings-wrap">

      {/* top header */}
      <header className="listings-top">
        <img src={logo} alt="FindersNotKeepers" className="site-logo" />
        <nav className="top-nav">
          <Link to="/">HOME</Link>
          <Link to="/search">SEARCH</Link>
          <Link to="/report-lost">REPORT</Link>
        </nav>
      </header>

      {/* page title + bar */}
      <h1 className="page-title">All Listings</h1>
      <div className="title-bar" />

      {/* right rail icons — SVGs are the buttons */}
      <aside className="icon-rail" aria-label="Quick actions">
        <Link to="/profile" className="rail-icon" aria-label="Profile">
          <img src={profileIcon} alt="Profile" />
        </Link>
        <Link to="/notifications" className="rail-icon" aria-label="Notifications">
          <img src={notificationsIcon} alt="Notifications" />
        </Link>
        <Link to="/settings" className="rail-icon" aria-label="Settings">
          <img src={settingsIcon} alt="Settings" />
        </Link>
      </aside>

      {/* grid */}
      <section className="card-grid">
        {ITEMS.map(it => (
          <article key={it.id} className="card">
            <div className="thumb">
              <img
                src={it.img}
                alt={it.title}
                onError={(e)=>{e.currentTarget.src='/assets/placeholder.jpg'}}
              />
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

      {/* pagination stub */}
      <div className="pager">
        <button className="page-btn" aria-label="Previous">«</button>
        <button className="dot active" aria-label="Page 1" />
        <button className="dot" aria-label="Page 2" />
        <button className="page-btn" aria-label="Next">»</button>
      </div>

      {/* footer mini */}
      <footer className="mini-footer">
        <a>Contact us</a>
        <a>FAQs</a>
        <a>Terms and conditions</a>
        <a>Cookie policy</a>
        <a>Privacy</a>
      </footer>
      <p className="copy">Copyright © 2025</p>
    </main>
  )
}
