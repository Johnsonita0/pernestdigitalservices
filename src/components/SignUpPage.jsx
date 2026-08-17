import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function SignUpPage({ onSignUpSuccess, onSwitchToLogin }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.')
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    if (!username.trim()) {
      setError('Username is required')
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message || 'Sign up failed. Please try again.')
        setLoading(false)
        return
      }

      if (data?.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            username,
            fullName,
            phone,
            address,
          },
        })

        if (updateError) {
          console.warn('Could not save profile data:', updateError)
        }

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
            username,
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

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="new-password"
              className="auth-input"
              placeholder="Minimum 6 characters"
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

          <div className="auth-field auth-field-full">
            <label htmlFor="signup-confirm-password">Confirm password</label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="new-password"
              className="auth-input"
              placeholder="Repeat your password"
            />
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
