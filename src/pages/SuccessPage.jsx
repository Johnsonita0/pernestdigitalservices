import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faPrint } from '@fortawesome/free-solid-svg-icons';
import '../css/pages/VerificationPage.css';

function SuccessPage() {
  const { state } = useLocation();
  const reference = state?.reference || 'REFERENCE NUMBER';
  return (
    <main className="success-page">
      <section className="success-slip">
        <div className="fireworks" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} style={{ '--ray': `${index * 30}deg` }} />)}</div>
        <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="success-slip-logo" />
        <p className="success-kicker">Pernest Digital Services · Official receipt</p>
        <h1>Your application was received</h1>
        <p>Your registration has been submitted successfully. Save or print this slip. Your reference number is required for status checks and payment-slip uploads.</p>
        <div className="success-reference"><span>Reference number</span><strong>{reference}</strong></div>
        <div className="success-account-details"><strong>Payment account</strong><span>Bank: Opay</span><span>Account number: 8130801666</span><span>Account name: ERNEST EMMANUEL OSUNG</span></div>
        <p className="success-slip-note">Use <strong>Confirm Registration Status</strong> to follow this application. Use <strong>Upload payment slip</strong> to submit your bank transfer evidence with this reference.</p>
        <div className="success-slip-actions"><button type="button" onClick={() => window.print()}><FontAwesomeIcon icon={faPrint} /> Print slip</button><Link to="/verify">Check status</Link><Link to="/upload-payment-slip"><FontAwesomeIcon icon={faCloudArrowUp} /> Upload payment slip</Link></div>
      </section>
    </main>
  );
}

export default SuccessPage;
