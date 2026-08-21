import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faPhone } from '@fortawesome/free-solid-svg-icons';
import PaymentSuccessModal from './PaymentSuccessModal';
import '../css/components/PaymentSubmissionCard.css';

const CONTACT_NUMBER = '+234 813 080 1666';

function PaymentSubmissionCard({
  title,
  reference,
  description = 'Your application was received. Complete payment, then upload your bank transfer slip so our team can begin processing.',
  file,
  onFileChange,
  onSubmit,
  paymentSubmitted = false,
  onComplete,
  className = '',
}) {
  const hasInlineUpload = Boolean(onFileChange && onSubmit);

  return (
    <main className={`payment-submission-page ${className}`}>
      <section className="payment-submission-card">
        <div className="payment-submission-fireworks" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span key={index} style={{ '--ray': `${index * 30}deg` }} />)}
        </div>
        <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="payment-submission-logo" />
        <p className="payment-submission-kicker">Application received</p>
        <h1>{title}</h1>
        <p className="payment-submission-copy">{description}</p>
        <div className="payment-submission-reference"><span>Application reference</span><strong>{reference}</strong></div>
        <div className="payment-submission-account">
          <strong>Payment account</strong>
          <span>Account number: 8130801666</span>
          <span>Bank: Opay</span>
          <span>Account name: ERNEST EMMANUEL OSUNG</span>
        </div>
        <div className="payment-submission-contact">
          <strong>Before making payment</strong>
          <span>Call <a href="tel:+2348130801666"><FontAwesomeIcon icon={faPhone} /> {CONTACT_NUMBER}</a> to negotiate and confirm the service charge.</span>
        </div>
        <p className="payment-submission-instruction">After payment, upload your bank transfer slip below so our team can confirm it.</p>
        {hasInlineUpload ? (
          <>
            <label className="payment-submission-file">Upload bank transfer slip
              <input type="file" accept="image/*,.pdf" onChange={(event) => onFileChange(event.target.files[0])} />
              {file?.name && <small>{file.name}</small>}
            </label>
            <button className="payment-submission-button" type="button" onClick={onSubmit} disabled={!file || paymentSubmitted}>{paymentSubmitted ? 'Slip submitted for review' : 'Upload bank transfer slip'}</button>
          </>
        ) : (
          <Link className="payment-submission-button" to="/upload-payment-slip"><FontAwesomeIcon icon={faCloudArrowUp} /> Upload bank transfer slip</Link>
        )}
        <PaymentSuccessModal isOpen={paymentSubmitted} reference={reference} onComplete={onComplete} />
      </section>
    </main>
  );
}

export default PaymentSubmissionCard;
