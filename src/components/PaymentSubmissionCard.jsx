import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faHouse, faPhone, faPrint } from '@fortawesome/free-solid-svg-icons';
import PaymentSuccessModal from './PaymentSuccessModal';
import PrintSlipPreviewModal from './PrintSlipPreviewModal';
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
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const hasInlineUpload = Boolean(onFileChange && onSubmit);
  const handlePaymentSubmit = async () => {
    if (!file || paymentBusy || paymentSubmitted) return;
    setPaymentBusy(true);
    setPaymentError('');
    try {
      await onSubmit();
    } catch (error) {
      setPaymentError(error.message || 'Unable to upload the payment slip. Please try again.');
    } finally {
      setPaymentBusy(false);
    }
  };

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
        <div className="payment-submission-actions">
          <button className="payment-submission-button payment-submission-print" type="button" onClick={() => setPrintPreviewOpen(true)}><FontAwesomeIcon icon={faPrint} /> Print slip</button>
          {hasInlineUpload ? (
          <>
            <label className="payment-submission-file">Upload bank transfer slip
              <input type="file" accept="image/*,.pdf" onChange={(event) => onFileChange(event.target.files[0])} />
              {file?.name && <small>{file.name}</small>}
            </label>
            <button className="payment-submission-button" type="button" onClick={handlePaymentSubmit} disabled={!file || paymentBusy || paymentSubmitted}>{paymentSubmitted ? 'Slip submitted for review' : paymentBusy ? 'Uploading...' : 'Upload bank transfer slip'}</button>
            {paymentError && <p className="payment-submission-error" role="alert">{paymentError}</p>}
            </>
          ) : (
            <Link className="payment-submission-button" to="/upload-payment-slip"><FontAwesomeIcon icon={faCloudArrowUp} /> Upload bank transfer slip</Link>
          )}
          <Link className="payment-submission-home" to="/"><FontAwesomeIcon icon={faHouse} /> Back to home</Link>
        </div>
        <PrintSlipPreviewModal isOpen={printPreviewOpen} title={title} reference={reference} description={description} onClose={() => setPrintPreviewOpen(false)} />
        <PaymentSuccessModal isOpen={paymentSubmitted} reference={reference} onComplete={onComplete} />
      </section>
    </main>
  );
}

export default PaymentSubmissionCard;
