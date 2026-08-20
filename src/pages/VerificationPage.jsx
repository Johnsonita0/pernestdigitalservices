import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faClipboardCheck, faMagnifyingGlass, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { lookupApplicationStatus } from '../lib/supabaseClient';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import '../css/pages/VerificationPage.css';

function VerificationPage() {
  const navigate = useNavigate();
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await lookupApplicationStatus(reference);
    setBusy(false);
    if (result.error) setError(result.error.message);
    else navigate('/verification-status', { state: { application: result.data } });
  };

  return (
    <main className="verification-page">
      <Navbar />
      <section className="verification-card">
        <div className="verification-illustration" aria-hidden="true"><span className="verification-orbit" /><FontAwesomeIcon icon={faMagnifyingGlass} /></div>
        <p className="verification-kicker">Application support</p>
        <h1>Confirm registration status</h1>
        <p className="verification-intro">Enter the reference number on your registration slip to see the latest progress of your application.</p>
        <form className="verification-form" onSubmit={submit}>
          <label htmlFor="reference-number">Reference number</label>
          <div className="verification-input-wrap"><input id="reference-number" value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="e.g. NGO-2026-HTE2VL" autoComplete="off" required /><button type="submit" disabled={busy}>{busy ? 'Checking...' : <><span>Check status</span><FontAwesomeIcon icon={faArrowRight} /></>}</button></div>
          {error && <p className="verification-error" role="alert">{error}</p>}
        </form>
        <section className="verification-details" aria-label="Registration status details">
          <h2>What you can check</h2>
          <div className="verification-detail-grid">
            <article><FontAwesomeIcon icon={faClipboardCheck} /><div><h3>Any registration form</h3><p>NGO, company, business, SCUML, internship, and NIN applications are supported.</p></div></article>
            <article><FontAwesomeIcon icon={faShieldHalved} /><div><h3>Private progress update</h3><p>Your reference shows the application name, current status, and latest update time only.</p></div></article>
          </div>
        </section>
        <p className="verification-help">Keep your reference number private and use it whenever you need an update.</p>
        <Link className="verification-home-link" to="/">Return to website</Link>
      </section>
      <Footer />
    </main>
  );
}

export default VerificationPage;
