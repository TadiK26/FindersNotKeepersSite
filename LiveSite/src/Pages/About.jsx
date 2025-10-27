import { useNavigate } from 'react-router-dom'
import logo from '/logo.svg'
import './About.css'
import Footer from '../components/Land Footer.jsx'

/*ABOUT PAGE WITH DETAILS ABOUT THE WEBSITE AND BACK BUTTON*/
export default function About(){
  const navigate = useNavigate()
  return (
    <>
    <header className="about-header">
        <img src={logo} alt="FindersNotKeepers logo" className="site-logo" />
        <h1 className="about-brand">FindersNotKeepers</h1>
        <div className="about-right" /> {/* keep empty for now */}
    </header>
    <h6 className="about-text">
          FindersNotKeepers is a Lost & Found web platform designed to help people recover misplaced belongings in high-density environments such as universities, shopping malls, and events.The system lets users:
          Report lost or found items by creating detailed listings with descriptions, categories, dates, locations, and photos.
          Search and filter listings to find items, narrowing results by category, date, or location.
          Claim items by submitting proof of ownership, which administrators review before approval.
          Communicate securely with other users through an in-app messaging system, without exposing personal contact details.
          Receive notifications when items are matched or claim results are ready.
          Administrators oversee the platform by approving listings, reviewing claims, and ensuring safety and accuracy
    </h6>
    <div className="topcard">
      <button className="backbutton" onClick={() => navigate('/')}>Back</button>
    </div>

  </>
  );
}