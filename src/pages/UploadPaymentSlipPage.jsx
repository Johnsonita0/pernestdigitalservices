import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheck, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { lookupApplicationStatus, updatePaymentSlipByReference } from '../lib/supabaseClient';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import '../css/pages/VerificationPage.css';

function readFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function UploadPaymentSlipPage() {
  const [reference, setReference] = useState('');
  const [application, setApplication] = useState(null);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const findApplication = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const result = await lookupApplicationStatus(reference);
    if (result.error || !result.data) {
      setApplication(null);
      setError(result.error?.message || 'No application was found for that reference number.');
      return;
    }
    setApplication(result.data);
  };

  const submitSlip = async (event) => {
    event.preventDefault();
    if (!paymentSlip || !application) return;
    setBusy(true);
    setError('');
    const result = await updatePaymentSlipByReference(application.reference_number, paymentSlip);
    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage('Payment slip uploaded successfully. Your payment is now awaiting admin confirmation.');
      setApplication((current) => ({ ...current, status: 'payment_submitted' }));
    }
    setBusy(false);
  };

  return (
    <main className="verification-page payment-upload-page">
      <Navbar />
      <section className="verification-card payment-upload-card">
        <Link className="verification-back-link" to="/verify"><FontAwesomeIcon icon={faArrowLeft} /> Back to status check</Link>
        <div className="verification-illustration"><FontAwesomeIcon icon={faCloudArrowUp} /><span className="verification-orbit" /></div>
        <p className="verification-kicker">Payment support</p>
        <h1>Upload payment slip</h1>
        <p className="verification-intro">Use the reference number on your registration slip to attach your bank transfer evidence.</p>
        <form className="verification-form" onSubmit={findApplication}>
          <label htmlFor="payment-reference">Reference number</label>
          <div className="verification-input-wrap"><input id="payment-reference" value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="NGO-2026-ABC123" required /><button type="submit">Find application</button></div>
        </form>
        {application && <form className="payment-upload-form" onSubmit={submitSlip}>
          <div className="payment-upload-summary"><span>{application.application_type}</span><strong>{application.reference_number}</strong><small>Status: {String(application.status).replace(/_/g, ' ')}</small></div>
          <label className="payment-upload-file">Choose bank transfer slip<input type="file" accept="image/*,.pdf" onChange={async (event) => setPaymentSlip(await readFile(event.target.files[0]))} required />{paymentSlip && <small>Selected: {paymentSlip.name}</small>}</label>
          {paymentSlip?.dataUrl && paymentSlip.type?.startsWith('image/') && <img className="payment-upload-preview" src={paymentSlip.dataUrl} alt="Payment slip preview" />}
          {paymentSlip?.dataUrl && paymentSlip.type === 'application/pdf' && <iframe className="payment-upload-preview" src={paymentSlip.dataUrl} title="Payment slip preview" />}
          <button className="verification-submit-payment" type="submit" disabled={busy}>{busy ? 'Uploading...' : <><FontAwesomeIcon icon={faCloudArrowUp} /> Upload payment slip</>}</button>
        </form>}
        {message && <p className="verification-success"><FontAwesomeIcon icon={faCheck} /> {message}</p>}
        {error && <p className="verification-error">{error}</p>}
        <p className="verification-help">Keep your reference number safe. It is used to check your status and upload payment evidence.</p>
      </section>
      <Footer />
    </main>
  );
}

export default UploadPaymentSlipPage;
