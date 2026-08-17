import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faSignInAlt, faSpinner } from '@fortawesome/free-solid-svg-icons'
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
    <>
      <div className="login-page">
        <div className="login-container">
          {/* Welcome Section */}
          <div className="login-welcome-section">
            <h2>Hello, Welcome</h2>
            <p>Don't have an Account?</p>
            <button 
              type="button" 
              className="login-register-link"
              onClick={onSwitchToSignUp}
            >
              Register
            </button>
          </div>

          <div className="login-card">
            <h1 className="login-card-title">Login</h1>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <div className="input-wrapper">
                  <span className="input-icon-text">👤</span>
                  <input
                    type="email"
                    placeholder="Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <span className="input-icon-text">🔒</span>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button type="button" className="login-forgot-link">
                Forgot Password
              </button>

              {error && (
                <div className="error-alert">
                  <p>{error}</p>
                </div>
              )}

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="icon-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            <div className="login-divider-text">
              or login with social platforms
            </div>

            <div className="login-social-buttons">
              <button type="button" className="social-btn" title="Login with Google">
                <span>G</span>
              </button>
              <button type="button" className="social-btn" title="Login with Facebook">
                <span>f</span>
              </button>
              <button type="button" className="social-btn" title="Login with GitHub">
                <span>⚡</span>
              </button>
              <button type="button" className="social-btn" title="Login with LinkedIn">
                <span>in</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav className="mobile-bottom-nav login-bottom-nav" aria-label="Mobile navigation">
        <button type="button" className="mobile-nav-btn" disabled>
          <span className="mobile-nav-icon">🔍</span>
          <span>Search</span>
        </button>
        <button type="button" className="mobile-nav-btn" disabled>
          <span className="mobile-nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button type="button" className="mobile-nav-btn" disabled>
          <span className="mobile-nav-icon">🛍️</span>
          <span>Shop</span>
        </button>
        <button type="button" className="mobile-nav-btn" disabled>
          <span className="mobile-nav-icon">👤</span>
          <span>Account</span>
        </button>
      </nav>
    </>
  )
}

export default LoginPage
