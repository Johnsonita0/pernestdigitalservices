import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const usernamePattern = /^[a-z0-9]+$/

function SignUpPage({ onSignUpSuccess, onSwitchToLogin }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [usernameSuggestion, setUsernameSuggestion] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUsernameSuggestion('')

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.')
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    const normalizedUsername = username.trim().toLowerCase()

    if (!normalizedUsername) {
      setError('Username is required')
      return
    }

    if (!usernamePattern.test(normalizedUsername)) {
      setError('Username can contain only letters and numbers, with no spaces or email addresses.')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }

    if (!address.trim()) {
      setError('Delivery address is required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { data: usernameAvailable, error: usernameCheckError } = await supabase
        .rpc('is_username_available', { candidate: normalizedUsername })

      if (usernameCheckError) {
        setError('We could not verify that username. Please try again.')
        setLoading(false)
        return
      }

      if (!usernameAvailable) {
        let suggestedUsername = `${normalizedUsername}${Math.floor(100 + Math.random() * 900)}`

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const { data: suggestionAvailable, error: suggestionError } = await supabase
            .rpc('is_username_available', { candidate: suggestedUsername })

          if (suggestionError) break
          if (suggestionAvailable) break
          suggestedUsername = `${normalizedUsername}${Math.floor(100 + Math.random() * 900)}`
        }

        setUsernameSuggestion(suggestedUsername)
        setError('That username is already taken. Please choose another username.')
        setLoading(false)
        return
      }

      const normalizedEmail = email.trim().toLowerCase()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            username: normalizedUsername,
            fullName,
            phone,
            address,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signUpError) {
        setError(signUpError.message || 'Sign up failed. Please try again.')
        setLoading(false)
        return
      }

      if (data?.user) {
        // Data is already saved as user_metadata from the options above
        // The trigger will create the profile automatically

        setFullName('')
        setUsername('')
        setEmail('')
        setPhone('')
        setAddress('')
        setPassword('')
        setConfirmPassword('')

        onSignUpSuccess({
          ...data.user,
          user_metadata: {
            username: normalizedUsername,
            fullName,
            phone,
            address,
          },
        })
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign up.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen auth-screen-alt">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">
          <img src="/logo/logo1.png" alt="Trophy Logo" className="auth-logo-img" />
          <div>
            <p className="auth-kicker">Create account</p>
            <h1>Trophy</h1>
          </div>
        </div>

        <div className="auth-header">
          <h2>Join us</h2>
          <p>Set up your profile and get ordering right away.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form auth-form-grid">
          <div className="auth-field">
            <label htmlFor="signup-fullname">Full name</label>
            <input
              id="signup-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              autoComplete="name"
              className="auth-input"
              placeholder="Jane Doe"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoComplete="username"
              className="auth-input"
              placeholder="yourname"
            />
            {usernameSuggestion && (
              <p className="username-suggestion" role="status">
                Username unavailable. Try{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setUsername(usernameSuggestion)
                    setUsernameSuggestion('')
                    setError('')
                  }}
                >
                  {usernameSuggestion}
                </button>
              </p>
            )}
          </div>

          <div className="auth-field auth-field-full">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-phone">Phone</label>
            <input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
              autoComplete="tel"
              className="auth-input"
              placeholder="0803 000 0000"
            />
          </div>

          <div className="auth-field auth-field-full">
            <label htmlFor="signup-address">Delivery address</label>
            <textarea
              id="signup-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              required
              autoComplete="street-address"
              className="auth-textarea"
              placeholder="Your delivery address"
              rows="3"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
                className="auth-input"
                placeholder="Minimum 6 characters"
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

          <div className="auth-field">
            <label htmlFor="signup-confirm-password">Confirm password</label>
            <div className="password-input-wrapper">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
                className="auth-input"
                placeholder="Repeat your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-alert auth-error-box">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="primary-action" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={onSwitchToLogin} disabled={loading}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default SignUpPage
