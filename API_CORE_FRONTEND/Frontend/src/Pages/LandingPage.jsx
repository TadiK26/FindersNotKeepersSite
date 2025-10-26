import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logo from '/logo.svg'
import './Land.css'
import Footer from '../components/Land Footer.jsx'

function Landing() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])

  useEffect(() => {
    fetch("http://127.0.0.1:5000/auth/all-listings") // replace with your backend URL
      .then(res => res.json())
      .then(data => setListings(data))
      .catch(err => console.error("Error fetching listings:", err))
  }, [])

  return (
    <>
    <main className="landing-wrap">

      {/* Header */}
      <header className="site-header">
        <img src={logo} alt="FindersNotKeepers logo" className="site-logo" />
        <h1 className="site-brand">FindersNotKeepers</h1>
        <h6 className="site-text">
          Lost something? Found something? Connect here.
        </h6>
      </header>

      {/* Report buttons */}
      <div className="reportcard">
        <button className="report-lost" onClick={() => navigate('/login')}>
          REPORT LOST ITEM
        </button>
        <button className="report-found" onClick={() => navigate('/login')}>
          REPORT FOUND ITEM
        </button>
      </div>

      {/* Top-right navigation */}
      <div className="topcard">
        <button className="about" onClick={() => navigate('/about')}>ABOUT</button>
        <button className="login" onClick={() => navigate('/login')}>LOGIN</button>
        <button className="signup" onClick={() => navigate('/signup')}>SIGNUP</button>
      </div>

      {/* Recent Listings */}
      <section className="recent">
        <h3>Recent Listings</h3>
        <div className="list-grid">
          {listings.length === 0 ? (
            <p>No listings found.</p>
          ) : (
            listings.map(item => (
              <article key={item.id} className="list-card">
                {item.photo ? (
                  <img src={`http://127.0.0.1:5000${item.photo}`} alt={item.title} />
                ) : (
                  <div className="thumb-fallback">
                    <strong>IMAGE NOT FOUND</strong>
                  </div>
                )}
                <div className="meta">
                  <div className="title">{item.title}</div>
                  <div>Where: {item.where}</div>
                  <div>When: {item.when}</div>
                  <div>Status: {item.status}</div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <Footer />
    
    </main>
    </>
  )
}

export default Landing
