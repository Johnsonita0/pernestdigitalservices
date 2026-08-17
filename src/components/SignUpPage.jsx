import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faUser, faSpinner, faUserPlus, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'

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

    // Validation
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
        // Store all profile data in user metadata for dashboard
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

        // Clear form
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
            address 
          } 
        })
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign up.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/logo/logo1.png" alt="Trophy logo" className="login-logo" />
            <h1>Trophy</h1>
            <p>Sip &amp; Savor</p>
          </div>

          <div className="login-divider" />

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faUser} className="input-icon" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faUser} className="input-icon" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
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
                <FontAwesomeIcon icon={faPhone} className="input-icon" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="input-icon" />
                <textarea
                  placeholder="Delivery Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="street-address"
                  rows="2"
                  className="address-textarea"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="error-alert">
                <p>{error}</p>
              </div>
            )}

            <button type="submit" className="primary-btn login-btn" disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="icon-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserPlus} className="icon-sign-in" />
                  <span>Create account</span>
                </>
              )}
            </button>
          </form>

          <p className="login-footer">
            Already have an account?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
