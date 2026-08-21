import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faPrint } from '@fortawesome/free-solid-svg-icons';
import '../css/components/PaidSubmissionSuccess.css';

function PaidSubmissionSuccess({ title, reference, description }) {
  return (
    <main className="paid-success-page">
      <section className="paid-success-card">
        <div className="paid-success-fireworks" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} style={{ '--ray': `${index * 30}deg` }} />)}</div>
        <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="paid-success-logo" />
        <p className="paid-success-kicker">Request received</p>
        <h1>{title}</h1>
        <p className="paid-success-copy">{description}</p>
        <div className="paid-success-reference"><span>Reference number</span><strong>{reference}</strong></div>
        <div className="paid-success-account"><strong>Payment account</strong><span>Bank: Opay</span><span>Account number: 8130801666</span><span>Account name: ERNEST EMMANUEL OSUNG</span></div>
        <p className="paid-success-note">Keep this reference number safe. Use it to check your status and upload your bank transfer slip.</p>
        <div className="paid-success-actions"><button type="button" onClick={() => window.print()}><FontAwesomeIcon icon={faPrint} /> Print slip</button><Link to="/upload-payment-slip"><FontAwesomeIcon icon={faCloudArrowUp} /> Upload payment slip</Link><Link to="/verify">Check status</Link></div>
      </section>
    </main>
  );
}

export default PaidSubmissionSuccess;
