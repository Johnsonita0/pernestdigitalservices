import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EventRegistrationPage from './pages/EventRegistrationPage';
import RegistrationPage from './pages/RegistrationPage';
import InternshipRegistrationPage from './pages/InternshipRegistrationPage';
import VerificationPage from './pages/VerificationPage';
import VerificationStatusPage from './pages/VerificationStatusPage';
import SuccessPage from './pages/SuccessPage';
import MorePage from './pages/MorePage';
import NGORegistrationPage from './pages/NGORegistrationPage';
import CompanyRegistrationPage from './pages/CompanyRegistrationPage';
import BusinessRegistrationPage from './pages/BusinessRegistrationPage';
import SCUMLRegistrationPage from './pages/SCUMLRegistrationPage';
import NINVerificationPage from './pages/NINVerificationPage';
import NINNameChangePage from './pages/NINNameChangePage';
import NINDateOfBirthChangePage from './pages/NINDateOfBirthChangePage';
import './css/App.css';

function AppLoader() {
  return (
    <div className="app-loader-shell" aria-live="polite" aria-busy="true">
      <div className="app-loader-card">
        <div className="loader-brand-wrap">
          <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="loader-brand-logo" />
        </div>
        <div className="skeleton-line skeleton-line-lg" />
        <div className="skeleton-line skeleton-line-md" />
        <div className="skeleton-line skeleton-line-sm" />
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const { message = '', type = 'success', duration = 4000 } = event.detail || {};
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, type }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, duration);
    };

    window.addEventListener('app:toast', handleToast);

    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) {
      try {
        const auth = JSON.parse(adminAuth);
        if (auth.authenticated && auth.user) {
          setAdminUser(auth.user);
        }
      } catch (e) {
        localStorage.removeItem('adminAuth');
      }
    }
    setAdminLoading(false);

    return () => {
      window.removeEventListener('app:toast', handleToast);
    };
  }, []);

  const handleAdminLoginSuccess = (user) => {
    setAdminUser(user);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminAuth');
    setAdminUser(null);
  };

  if (adminLoading) {
    return <AppLoader />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<InternshipRegistrationPage />} />
        <Route path="/event-register" element={<EventRegistrationPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/verification-status" element={<VerificationStatusPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/ngo-register" element={<NGORegistrationPage />} />
        <Route path="/company-register" element={<CompanyRegistrationPage />} />
        <Route path="/business-register" element={<BusinessRegistrationPage />} />
        <Route path="/scuml-register" element={<SCUMLRegistrationPage />} />
        <Route path="/nin-verify" element={<NINVerificationPage />} />
        <Route path="/nin-name-change" element={<NINNameChangePage />} />
        <Route path="/nin-date-of-birth-change" element={<NINDateOfBirthChangePage />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={adminUser ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} />}
        />
        <Route
          path="/admin/dashboard"
          element={
            adminUser ? (
              <AdminDashboardPage user={adminUser} onLogout={handleAdminLogout} />
            ) : (
              <Navigate to="/admin" />
            )
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </Router>
  );
}

export default App;
