import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import '../css/pages/VerificationPage.css';

function SuccessPage() {
  const { state } = useLocation();
  const reference = state?.reference || 'REFERENCE NUMBER';
  return (
    <main className="success-page">
      <section className="success-slip">
        <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="success-slip-logo" />
        <p className="success-kicker">Registration successful</p>
        <h1>Your application was received</h1>
        <p>Your registration has been submitted successfully. Keep this slip and your reference number for future updates.</p>
        <div className="success-reference"><span>Reference number</span><strong>{reference}</strong></div>
        <p className="success-slip-note">To check your application progress, visit <strong>Confirm Registration Status</strong> on our website and enter this reference number.</p>
        <div className="success-slip-actions"><button type="button" onClick={() => window.print()}><FontAwesomeIcon icon={faPrint} /> Print slip</button><Link to="/verify">Check status</Link></div>
      </section>
    </main>
  );
}

export default SuccessPage;
