import { useNavigate } from 'react-router-dom'
import logo from '/logo.svg'
import './Land.css'
import Footer from '../components/Land Footer.jsx'

function Landing() {
  const navigate = useNavigate()

  return (
    <>
      {/* Header with the logo, website name and text below the website name */}
      <header className="site-header">
        <img src={logo} alt="FindersNotKeepers logo" className="site-logo" />
        <h1 className="site-brand">FindersNotKeepers</h1>
        <h6 className="site-text">
          Lost something? Found something? Connect here.
        </h6>
        <div className="site-right" /> {/* keep empty for now */}
      </header>

      {/* Two buttons to report a lost or found item */}
      <div className="reportcard">
        <button
          className="report-lost"
          onClick={() => navigate('/report-lost')}
        >
          REPORT LOST ITEM
        </button>
        <button
          className="report-found"
          onClick={() => navigate('/report-found')}
        >
          REPORT FOUND ITEM
        </button>
      </div>

      {/* Top-right navigation buttons */}
      <div className="topcard">
        <button className="about" onClick={() => navigate('/about')}>
          ABOUT
        </button>
        <button className="login" onClick={() => navigate('/login')}>
          LOGIN
        </button>
        <button className="signup" onClick={() => navigate('/signup')}>
          SIGNUP
        </button>
      </div>

      {/* Recent Listings Section */}
      <section className="recent">
        <h3>Recent Listings</h3>
        <div className="list-grid">
          <article className="list-card">
            <img src="https://picsum.photos/seed/bag/400/200" alt="" />
            <div className="meta">
              <div className="title">Black Laptop Bag</div>
              <div>Where: UP, Hatfield Campus</div>
              <div>When: 7 September 2025</div>
            </div>
          </article>

          <article className="list-card">
            <img src="https://picsum.photos/seed/camera/400/200" alt="" />
            <div className="meta">
              <div className="title">Digital Camera</div>
              <div>Where: Brooklyn Mall, Pretoria</div>
              <div>When: 3 September 2025</div>
            </div>
          </article>

          <article className="list-card">
            <img src="https://picsum.photos/seed/shoes/400/200" alt="" />
            <div className="meta">
              <div className="title">Ballet Shoes</div>
              <div>Where: UP, Hatfield Campus</div>
              <div>When: 31 August 2025</div>
            </div>
          </article>

          <article className="list-card">
            <img src="https://picsum.photos/seed/keys/400/200" alt="" />
            <div className="meta">
              <div className="title">A Set of Keys</div>
              <div>Where: UP, Hatfield Campus</div>
              <div>When: 1 September 2025</div>
            </div>
          </article>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  )
}

export default Landing
