import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EventRegistrationPage from './pages/EventRegistrationPage';
import RegistrationPage from './pages/RegistrationPage';
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
import ShopComingSoonPage from './pages/ShopComingSoonPage';
import UploadPaymentSlipPage from './pages/UploadPaymentSlipPage';
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

function UserWhatsAppButton() {
  const location = useLocation();
  if (location.pathname === '/' || location.pathname.startsWith('/admin')) return null;

  return <a className="global-whatsapp-button" href="https://wa.me/2348130801666?text=Hello%20Pernest%20Digital%20Services%2C%20I%20need%20assistance." target="_blank" rel="noreferrer" aria-label="Chat with Pernest Digital Services on WhatsApp" title="Chat on WhatsApp"><FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" /></a>;
}

function UserFloatingActions() {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 280);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname === '/' || location.pathname.startsWith('/admin')) return null;

  return <>
    <UserWhatsAppButton />
    {showScrollTop && <button type="button" className="global-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Scroll back to top" title="Scroll back to top"><FontAwesomeIcon icon={faArrowUp} aria-hidden="true" /></button>}
  </>;
}

function App() {
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let lastNetworkToast = { message: '', timestamp: 0 };

    const showNetworkToast = (message, type = 'error') => {
      const now = Date.now();
      if (lastNetworkToast.message === message && now - lastNetworkToast.timestamp < 4000) return;
      lastNetworkToast = { message, timestamp: now };
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type, duration: 4000 } }));
    };

    const handleToast = (event) => {
      const { message = '', type = 'success', duration = 4000 } = event.detail || {};
      const toastType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, type: toastType }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, duration);
    };

    const handleOffline = () => showNetworkToast('You are offline. Your form data is saved on this device.', 'error');
    const handleOnline = () => showNetworkToast('Connection restored. You can continue.', 'success');
    const handleUnhandledRejection = (event) => {
      const message = String(event.reason?.message || event.reason || '').toLowerCase();
      if (message.includes('network') || message.includes('fetch') || message.includes('failed to load')) {
        showNetworkToast('Network problem. Please check your connection and try again.');
      }
    };
    const handleWindowError = (event) => {
      const message = String(event.message || '').toLowerCase();
      if (message.includes('network') || message.includes('fetch') || message.includes('failed to load')) {
        showNetworkToast('Network problem. Please check your connection and try again.');
      }
    };

    window.addEventListener('app:toast', handleToast);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

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
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
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
        <Route path="/event-register" element={<EventRegistrationPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/verification-status" element={<VerificationStatusPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/upload-payment-slip" element={<UploadPaymentSlipPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/shop" element={<ShopComingSoonPage />} />
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

      <UserFloatingActions />

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
