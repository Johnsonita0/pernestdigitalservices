import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'

const navItems = [
  { label: 'Home', view: 'home' },
  { label: 'Shop', view: 'shop' },
  { label: 'Reviews', view: 'reviews' },
  { label: 'Contact', view: 'contact' },
]

const estoreCategories = ['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Drinks', 'Special Combos']

function Header({
  onNavigate,
  cartCount = 0,
  user = null,
  onLogout = null,
  isShop = false,
  searchTerm = '',
  onSearchChange = null,
  showMobileSearch = false,
  onToggleMobileSearch = null,
  showMobileAccount = false,
  onToggleMobileAccount = null,
  mobileAuthView = 'login',
  onMobileAuthViewChange = null,
  onMobileLoginSuccess = null,
  onCartAction = null,
}) {
  const handleNavClick = (view) => {
    if (view === 'shop') {
      onNavigate('shop')
      return
    }

    if (view === 'home') {
      onNavigate('home')
      return
    }

    const target = document.getElementById(view)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    onNavigate('home')
  }

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || null

  if (isShop) {
    return (
      <>
        {showMobileSearch && (
          <div className="mobile-search-modal" onClick={() => onToggleMobileSearch?.()}>
            <div className="mobile-search-overlay" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-search-header">
                <input
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  placeholder="Search meals, cuisines and favorites"
                  aria-label="Search food menu"
                  className="mobile-search-input"
                />
                <button type="button" className="mobile-search-close" onClick={() => onToggleMobileSearch?.()}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {showMobileAccount && (
          <div className="mobile-account-modal" onClick={() => onToggleMobileAccount?.()}>
            <div className="mobile-account-overlay" onClick={(e) => e.stopPropagation()}>
              {mobileAuthView === 'login' && (
                <MobileLoginForm 
                  onLoginSuccess={onMobileLoginSuccess}
                  onSwitchToSignUp={() => onMobileAuthViewChange?.('signup')}
                  onForgotPassword={() => onMobileAuthViewChange?.('forgot')}
                  onClose={() => onToggleMobileAccount?.()}
                />
              )}
              {mobileAuthView === 'signup' && (
                <MobileSignUpForm 
                  onSignUpSuccess={onMobileLoginSuccess}
                  onSwitchToLogin={() => onMobileAuthViewChange?.('login')}
                  onClose={() => onToggleMobileAccount?.()}
                />
              )}
              {mobileAuthView === 'forgot' && (
                <MobileForgotPasswordForm 
                  onClose={() => onMobileAuthViewChange?.('login')}
                />
              )}
            </div>
          </div>
        )}

        <header className="topbar estore-header">
          <div className="container estore-shell">
            <div className="estore-toolbar mobile-only-category-bar">
              <nav className="estore-categories" aria-label="Store categories">
                {estoreCategories.map((category) => (
                  <button key={category} type="button" className="estore-category-btn">
                    {category}
                  </button>
                ))}
              </nav>

              {user ? (
                <button type="button" className="ghost-btn small-btn" onClick={onLogout}>
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          <button type="button" className="mobile-nav-btn" onClick={() => onToggleMobileSearch?.()}>
            <span className="mobile-nav-icon">🔍</span>
            <span>Search</span>
          </button>
          <button type="button" className="mobile-nav-btn" onClick={() => onNavigate('home')}>
            <span className="mobile-nav-icon">🏠</span>
            <span>Home</span>
          </button>
          <button type="button" className="mobile-nav-btn" onClick={() => onNavigate('shop')}>
            <span className="mobile-nav-icon">🍽️</span>
            <span>Food</span>
          </button>
          <button type="button" className="mobile-nav-btn cart-nav-btn" onClick={onCartAction}>
            <span className="mobile-nav-icon">🛒</span>
            <span>Cart</span>
            {cartCount > 0 && <span className="mobile-nav-badge">{cartCount}</span>}
          </button>
          <button type="button" className="mobile-nav-btn" onClick={() => {
            if (user) {
              onNavigate('dashboard')
            } else {
              onToggleMobileAccount?.()
            }
          }}>
            <span className="mobile-nav-icon">👤</span>
            <span>Account</span>
          </button>
        </nav>
      </>
    )
  }

  return (
    <>
      <header className="topbar">
        <div className="container nav-wrap">
          <button type="button" className="brand brand-button" onClick={() => onNavigate('home')} aria-label="Trophy home">
            <img src="/logo/logo1.png" alt="Trophy logo" className="brand-logo" />
            <div>
              <strong>Trophy</strong>
              <small>Sip &amp; Savor</small>
            </div>
          </button>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="nav-button"
                onClick={() => handleNavClick(item.view)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="nav-actions">
            <button type="button" className="cart-pill" onClick={() => onNavigate('shop')} aria-label="Cart">
              <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            {user ? (
              <>
                <div className="user-menu">
                  <button
                    type="button"
                    className="user-button"
                    onClick={() => onNavigate('dashboard')}
                    title={`Welcome, ${username}`}
                  >
                    👤 {username}
                  </button>
                </div>
                <button type="button" className="ghost-btn small-btn" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ghost-btn small-btn" onClick={() => onNavigate('login')}>
                  Login
                </button>
                <button type="button" className="primary-btn small-btn" onClick={() => onNavigate('signup')}>
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button type="button" className="mobile-nav-btn" onClick={() => onToggleMobileSearch?.()}>
          <span className="mobile-nav-icon">🔍</span>
          <span>Search</span>
        </button>
        <button type="button" className="mobile-nav-btn" onClick={() => onNavigate('home')}>
          <span className="mobile-nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button type="button" className="mobile-nav-btn" onClick={() => onNavigate('shop')}>
          <span className="mobile-nav-icon">🍽️</span>
          <span>Food</span>
        </button>
        <button type="button" className="mobile-nav-btn cart-nav-btn" onClick={onCartAction || (() => onNavigate(user ? 'dashboard' : 'login'))}>
          <span className="mobile-nav-icon">🛒</span>
          <span>Cart</span>
          {cartCount > 0 && <span className="mobile-nav-badge">{cartCount}</span>}
        </button>
        <button type="button" className="mobile-nav-btn" onClick={() => onNavigate(user ? 'dashboard' : 'login')}>
          <span className="mobile-nav-icon">👤</span>
          <span>Account</span>
        </button>
      </nav>
    </>
  )
}

import { useState } from 'react'
import { supabase } from '../lib/supabase'

function MobileLoginForm({ onLoginSuccess, onSwitchToSignUp, onForgotPassword, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || 'Login failed.')
        setLoading(false)
        return
      }

      if (data?.user) {
        onLoginSuccess?.(data.user)
      }
    } catch (err) {
      setError(err.message || 'An error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="mobile-auth-form">
      <div className="mobile-auth-header">
        <h2>Login</h2>
        <button type="button" className="mobile-auth-close" onClick={onClose}>✕</button>
      </div>

      {error && <div className="mobile-auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="mobile-auth-body">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading} className="primary-btn mobile-auth-btn">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mobile-auth-links">
        <button type="button" className="text-btn" onClick={onForgotPassword}>
          Forgot password?
        </button>
        <div className="mobile-auth-divider">Don't have an account?</div>
        <button type="button" className="primary-btn mobile-auth-btn" onClick={onSwitchToSignUp}>
          Sign up
        </button>
      </div>
    </div>
  )
}

function MobileSignUpForm({ onSignUpSuccess, onSwitchToLogin, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message || 'Sign up failed.')
        setLoading(false)
        return
      }

      if (data?.user) {
        onSignUpSuccess?.(data.user)
      }
    } catch (err) {
      setError(err.message || 'An error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="mobile-auth-form">
      <div className="mobile-auth-header">
        <h2>Sign up</h2>
        <button type="button" className="mobile-auth-close" onClick={onClose}>✕</button>
      </div>

      {error && <div className="mobile-auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="mobile-auth-body">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading} className="primary-btn mobile-auth-btn">
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <div className="mobile-auth-links">
        <div className="mobile-auth-divider">Already have an account?</div>
        <button type="button" className="ghost-btn mobile-auth-btn" onClick={onSwitchToLogin}>
          Login
        </button>
      </div>
    </div>
  )
}

function MobileForgotPasswordForm({ onClose }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email.')
        setLoading(false)
        return
      }

      setSuccess('Check your email for the reset link.')
      setEmail('')
    } catch (err) {
      setError(err.message || 'An error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="mobile-auth-form">
      <div className="mobile-auth-header">
        <h2>Reset Password</h2>
        <button type="button" className="mobile-auth-close" onClick={onClose}>✕</button>
      </div>

      {error && <div className="mobile-auth-error">{error}</div>}
      {success && <div className="mobile-auth-success">{success}</div>}

      <form onSubmit={handleSubmit} className="mobile-auth-body">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading} className="primary-btn mobile-auth-btn">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
  )
}

export default Header
