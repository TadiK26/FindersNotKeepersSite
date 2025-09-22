import { useNavigate } from 'react-router-dom'
import logo from '/logo.svg'
import './Land.css'
import Footer from '../components/Land Footer.jsx'
import laptopbag from '../photos/blacklaptop.jpg'
import digitalcamera from '../photos/digitalcamera.jpg'
import balletshoes from '../photos/balletshoes.jpg'
import keys from '../photos/keys.jpg'

function Landing() {
  const navigate = useNavigate()

  return (
    <>
    <main className="landing-wrap">

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
          onClick={() => navigate('/login')}
        >
          REPORT LOST ITEM
        </button>
        <button
          className="report-found"
          onClick={() => navigate('/login')}
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
            
            <img src={laptopbag} alt="" />
            <div className="meta">
              <div className="title">Black Laptop Bag</div>
              <div>Where: UP, Hatfield Campus</div>
              <div>When: 7 September 2025</div>
            </div>
          </article>

          <article className="list-card">
            <img src={digitalcamera} alt="" />
            <div className="meta">
              <div className="title">Digital Camera</div>
              <div>Where: Brooklyn Mall, Pretoria</div>
              <div>When: 3 September 2025</div>
            </div>
          </article>

          <article className="list-card">
            <img src={balletshoes} alt="" />
            <div className="meta">
              <div className="title">Ballet Shoes</div>
              <div>Where: UP, Hatfield Campus</div>
              <div>When: 31 August 2025</div>
            </div>
          </article>

          <article className="list-card">
            <img src={keys} alt="" />
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
    
    </main>
    </>
  )
}

export default Landing
