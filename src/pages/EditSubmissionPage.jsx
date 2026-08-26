import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { faArrowRight, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ApplicationEditForm from '../components/ApplicationEditForm.jsx';
import { getApplicationForEdit } from '../lib/supabaseClient';
import '../css/pages/VerificationPage.css';

function EditSubmissionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState(searchParams.get('reference')?.toUpperCase() || '');
  const [identifier, setIdentifier] = useState('');
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const findApplication = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    const result = await getApplicationForEdit(reference, identifier);
    setBusy(false);
    if (result.error) setError(result.error.message); else setApplication(result.data);
  };

  return <main className="verification-page"><Navbar /><section className="verification-card edit-submission-card">
    {!application ? <><div className="verification-illustration" aria-hidden="true"><FontAwesomeIcon icon={faPenToSquare} /></div><p className="verification-kicker">Application support</p><h1>Edit your submission</h1><p className="verification-intro">Use your reference number, email, or phone number to retrieve your application and correct it.</p><form className="verification-form edit-submission-form" onSubmit={findApplication}><label htmlFor="edit-reference">Reference number <span>optional if using email or phone</span></label><input id="edit-reference" value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="e.g. NGO-2026-HTE2VL" /><label htmlFor="edit-identifier">Email or phone number <span>optional if using reference</span></label><input id="edit-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@example.com or 08012345678" /><button type="submit" disabled={busy || (!reference.trim() && !identifier.trim())}>{busy ? 'Finding application...' : <><span>Open application</span><FontAwesomeIcon icon={faArrowRight} /></>}</button>{error && <p className="verification-error" role="alert">{error}</p>}</form><div className="verification-page-links"><Link className="verification-home-link" to="/verify">Verify registration</Link><Link className="verification-home-link" to="/">Return to website</Link></div></> : <ApplicationEditForm application={application.application} applicationType={application.application_type} identifier={identifier || reference} onCancel={() => setApplication(null)} onSaved={() => { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Application updated successfully and sent for review.', type: 'success' } })); navigate(`/verification-status?reference=${encodeURIComponent(reference || application.application.reference_number)}`); }} />}
  </section><Footer /></main>;
}

export default EditSubmissionPage;