import React, { useState } from 'react';
import { signInAdmin } from '../lib/supabaseClient';
import '../css/pages/AdminLoginPage.css';

function AdminLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    if (!email.trim() || !password.trim()) {
      setStatus('error');
      setError('Please enter both email and password.');
      return;
    }

    try {
      const { data, error: signInError } = await signInAdmin(email, password);

      if (signInError) {
        setStatus('error');
        setError('Invalid credentials. Please try again.');
        return;
      }

      if (data?.session && data?.user) {
        setStatus('success');
        localStorage.setItem('adminAuth', JSON.stringify({
          authenticated: true,
          user: data.user,
          session: data.session,
        }));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setStatus('error');
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="header-content">
              <a href="/" className="login-logo-link" aria-label="Go to home page">
                <img src="/logo/logo2.jpeg" alt="T-Shirts Village" className="login-logo" />
              </a>
              <div className="header-text">
                <h1>Management Portal</h1>
                <p>Secure Admin Access</p>
              </div>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === 'submitting'}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={status === 'submitting'}
                required
                autoComplete="off"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="login-btn"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="footer-text">
              Authorized personnel only.<br />
              For access assistance, contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
