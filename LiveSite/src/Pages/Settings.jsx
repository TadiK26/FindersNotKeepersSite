import { Link } from 'react-router-dom'
import logo from '/logo.svg'
import './Settings.css'

//SETTINGS PAGE - ALLOWING FOR PASSWORD CHANGE, AND OTHER SETTINGS
export default function Settings() {
  return (
    <main className="settings-wrap">
      <header className="settings-top">
        <img src={logo} alt="FindersNotKeepers" className="settings-logo" />
        <h1 className="settings-title">Settings <span className="gear">⚙️</span></h1>
        <Link to="/listings" className="settings-home">HOME</Link>
      </header>

      <div className="settings-bar" />

      <section className="settings-list">
        {/* Change Password */}
        <details className="settings-item">
          <summary>Change Password</summary>
          <form className="settings-form" onSubmit={(e)=>e.preventDefault()}>
            <label>
              Current password
              <input type="password" placeholder="••••••••" />
            </label>
            <label>
              New password
              <input type="password" placeholder="••••••••" minLength={6} />
            </label>
            <label>
              Confirm new password
              <input type="password" placeholder="••••••••" minLength={6} />
            </label>
            <button type="submit" className="btn-save">Save password</button>
          </form>
        </details>

        {/* Notification Preferences */}
        <details className="settings-item">
          <summary>Notification Preferences</summary>
          <div className="settings-block">
            <label className="row">
              <input type="checkbox" defaultChecked /> Email notifications
            </label>
            <label className="row">
              <input type="checkbox" /> SMS notifications
            </label>
            <label className="row">
              <input type="checkbox" defaultChecked /> Push notifications
            </label>
            <button className="btn-save">Save preferences</button>
          </div>
        </details>

        {/* Privacy Control */}
        <details className="settings-item">
          <summary>Privacy Control</summary>
          <div className="settings-block">
            <label className="row">
              <input type="checkbox" defaultChecked /> Show profile publicly
            </label>
            <label className="row">
              <input type="checkbox" /> Allow messages from non-contacts
            </label>
            <label className="row">
              <input type="checkbox" defaultChecked /> Share location with my posts
            </label>
            <button className="btn-save">Save privacy</button>
          </div>
        </details>

        {/* Logout */}
        <details className="settings-item">
          <summary>Logout</summary>
          <div className="settings-block">
            <p>You’re currently signed in.</p>
            <button className="btn-danger" onClick={()=>alert('Log out action here')}>  
              <Link to="/" className="settings-logout">Log out</Link>
            </button>
          </div>
        </details>
      </section>
    </main>
  )
}
