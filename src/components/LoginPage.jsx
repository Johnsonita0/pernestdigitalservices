import { useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { notifyToast } from '../lib/toast'

function LoginPage({ onLoginSuccess, onSwitchToSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const loginCardRef = useRef(null)
  const emailInputRef = useRef(null)

  useEffect(() => {
    loginCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    emailInputRef.current?.focus({ preventScroll: true })
    notifyToast('Sign in to continue.', 'info')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isSupabaseConfigured) {
      notifyToast('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.', 'error')
      return
    }

    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        notifyToast(signInError.message || 'Login failed. Please check your credentials.', 'error')
        setLoading(false)
        return
      }

      if (data?.user) {
        setEmail('')
        setPassword('')
        onLoginSuccess(data.user)
      }
    } catch (err) {
      notifyToast(err.message || 'An error occurred during login.', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card login-card-focus-target" ref={loginCardRef}>
        <div className="auth-brand">
          <img src="/logo/logo1.png" alt="Trophy Logo" className="auth-logo-img" />
          <div>
            <p className="auth-kicker">Welcome back</p>
            <h1>Trophy</h1>
          </div>
        </div>

        <div className="auth-header">
          <h2>Sign in</h2>
          <p>Order your favorite meals in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
              className="auth-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
                className="auth-input"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button type="submit" className="primary-action" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <button type="button" className="ghost-link" onClick={() => {}}>
          Forgot password?
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button type="button" className="secondary-action" onClick={onSwitchToSignUp}>
          Create an account
        </button>
      </div>
    </div>
  )
}

export default LoginPage
