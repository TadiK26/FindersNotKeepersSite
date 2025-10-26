import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '/logo.svg'
import './Signup.css'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', agree: false })
  const [error, setError] = useState('')

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }
//Errors if form not filled correctly
  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password || !form.confirm) return setError('Please fill in all fields.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (!form.agree) return setError('Please agree to the terms & policy.')
    // TODO: send to backend
    navigate('/listings')
  }
//Google API
  useEffect(() => {
    if (window.google && window.google.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: "257643953276-8su4c8tr824kok0k40jd2rbgp5ek6roa.apps.googleusercontent.com",
        callback: () => navigate('/listings'),
      })
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignupDiv'),
        { theme: 'outline', size: 'large', shape: 'rectangular', text: 'signup_with', width: 300 }
      )
    }
  }, [navigate])

  return (

    <main className="signup-wrap">
      <div className="signup-card">
        {/* header group (move together) - The logo and title page*/}
        <div className="signup-header">
          <img src={logo} alt="FindersNotKeepers" className="signup-logo" />
          <h1 className="signup-title">Get Started Now</h1>
          <p className="signup-sub">Create your account to join the community</p>
        </div>

        <form className="signup-form" onSubmit={onSubmit}>
          {error && <div className="signup-error">{error}</div>}
          {/*Name info*/}
          <label className="signup-label">
            Name
            <input
              className="signup-input"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>
          {/*Email address info*/}
          <label className="signup-label">
            Email address
            <input
              className="signup-input"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>
          {/*Password info*/}
          <label className="signup-label">
            Password
            <input
              className="signup-input"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={onChange}
              minLength={6}
              required
            />
          </label>

          <label className="signup-label">
            Confirm password
            <input
              className="signup-input"
              name="confirm"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirm}
              onChange={onChange}
              minLength={6}
              required
            />
          </label>
        {/*Checkbox for item*/}
          <label className="signup-terms">
            <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} />
            I agree to the <a href="/terms">terms</a> & <a href="/privacy">policy</a>
          </label>

          <button type="submit" className="signup-btn">Sign Up</button>
        </form>

        <div className="signup-social">
          <div id="googleSignupDiv" className="google-slot" />
          <button type="button" className="apple-btn" style={{ width: 300 }}>
             Sign up with Apple
          </button>
        </div>

        <p className="signup-footer">
          Have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </main>
  )
}
