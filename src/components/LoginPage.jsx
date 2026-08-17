import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function LoginPage({ onLoginSuccess, onSwitchToSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.')
      return
    }

    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || 'Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      if (data?.user) {
        setEmail('')
        setPassword('')
        onLoginSuccess(data.user)
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
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
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
              className="auth-input"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="error-alert">
              <p>{error}</p>
            </div>
          )}

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
