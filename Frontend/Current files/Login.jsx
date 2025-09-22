import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Login.css'
import logo from '/logo.svg'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please fill in both fields.')
      return
    }
    navigate('/profile') // TODO: connect to real backend auth
  }

  // Google Sign-In
  useEffect(() => {
    if (window.google && window.google.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: "257643953276-8su4c8tr824kok0k40jd2rbgp5ek6roa.apps.googleusercontent.com",
        callback: (response) => {
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]))
            alert(`Signed in as: ${payload.email || payload.name}`)
            navigate('/profile')
          } catch (err) {
            console.error("Failed to decode Google token", err)
          }
        }
      })

      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", shape: "rectangular", text: "signin_with", width: 300}
      )
    }
  }, [navigate])

  return (
    <main className="login-wrap">

      <div className="login-card">
        <img src={logo} alt="FindersNotKeepers logo" className="login-logo" />
        <h1 className="login-title">Welcome back!</h1>
        <p className="login-sub">Enter your credentials to access your account</p>

        <form className="login-form" onSubmit={onSubmit}>
          {error && <div className="login-error">{error}</div>}

          <label className="login-label">
            Email address
            <input
              className="login-input"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label className="login-label">
            Password
            <input
              className="login-input"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={onChange}
              required
              minLength={6}
            />
          </label>

          <label className="login-remember">
            <input type="checkbox" /> Remember for 30 days
          </label>

          <button type="submit" className="login-btn">Login</button>
        </form>

        <div className="login-social">
          <div id="googleSignInDiv" className="google-slot" />
          <button type="button" className="apple-btn">
             Sign in with Apple
          </button>
        </div>

        <p className="login-footer">
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </main>
  )
}
