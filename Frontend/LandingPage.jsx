import { useNavigate } from 'react-router-dom'
import logo from '/logo.svg'
import './Land.css'
import Footer from '../components/Land Footer.jsx'

function Landing() {
  const navigate = useNavigate()

  return (
    <>
    {/*Header with the logo, website name and text below the website name */}
      <header className="site-header">
        <img src={logo} alt="FindersNotKeepers logo" className="site-logo" />
        <h1 className="site-brand">FindersNotKeepers</h1>
        <h6 className="site-text">Lost something? Found something? Connect here. </h6>
        <div className="site-right" /> {/* keep empty for now */}
      </header>

    {/*Two buttons to report a lost or found item*/}
      <div className="bottomcard">
        <button className="report-lost" onClick={() => navigate('/report-lost')}>
          REPORT LOST ITEM
        </button>
         <button className="report-found" onClick={() => navigate('/report-found')}>
          REPORT FOUND ITEM
        </button>
      </div>

    {/*Three buttons to access the about,login and signup page*/}
      <div className="topcard">
        <button className="about" onClick={() => navigate('/about')}>ABOUT</button>
        <button className="login" onClick={() => navigate('/login')}>LOGIN</button>
        <button className="signup" onClick={() => navigate('/signup')}>SIGNUP</button>
      </div>

    {/*Footer will be imported; will have contact us, FAQs and Terms of Privacy buttons*/}
      <Footer />
    </>
  )
}

export default Landing
