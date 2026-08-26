import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faClock, faDownload, faRotate } from '@fortawesome/free-solid-svg-icons';
import { lookupApplicationStatus } from '../lib/supabaseClient';
import '../css/pages/VerificationPage.css';

const steps = [
  ['Received', 'Your application was received'],
  ['Under review', 'Our team is reviewing your details'],
  ['Processing', 'Registration work is in progress'],
  ['Completed', 'Your application is complete'],
];

const statusLabels = {
  payment_pending: 'Payment pending',
  payment_submitted: 'Payment submitted',
  payment_confirmed: 'Payment confirmed',
  pending: 'Pending review',
  in_review: 'In review',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
};

const statusMessages = {
  payment_pending: 'Payment is still required before processing can begin.',
  payment_submitted: 'Payment has been received and is awaiting review.',
  payment_confirmed: 'Payment has been confirmed by our admin team. Registration processing can continue.',
  pending: 'Your application is waiting for review.',
  in_review: 'Our team is reviewing your application.',
  approved: 'Your application has been approved.',
  completed: 'Your application has been completed.',
  rejected: 'Please contact our support team for guidance on the next step.',
};

function getProgress(status) {
  if (status === 'rejected') return 1;
  if (status === 'payment_pending') return 0;
  if (status === 'payment_submitted' || status === 'pending') return 1;
  if (status === 'payment_confirmed') return 2;
  if (status === 'in_review') return 2;
  if (status === 'approved' || status === 'completed') return 3;
  return 0;
}

function VerificationStatusPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [application, setApplication] = useState(state?.application || null);
  const [loading, setLoading] = useState(!state?.application);

  useEffect(() => {
    if (application) return;
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference) {
      setLoading(false);
      return;
    }
    lookupApplicationStatus(reference).then((result) => {
      setApplication(result.data || null);
      setLoading(false);
    });
  }, [application]);

  if (loading) return <main className="verification-status-page"><section className="status-result-card"><p className="status-kicker">Application support</p><h1>Loading status</h1><p className="status-copy">Checking the latest application update...</p></section></main>;
  if (!application) return <main className="verification-status-page"><section className="status-result-card"><p className="status-kicker">Application support</p><h1>Check your status</h1><p className="status-copy">Use your reference number to view the latest update.</p><Link className="status-new-search" to="/verify">Check a reference number</Link></section></main>;

  const progress = getProgress(application.status);
  const isRejected = application.status === 'rejected';
  const statusLabel = statusLabels[application.status] || application.status.replace(/_/g, ' ');
  const statusMessage = statusMessages[application.status] || 'Your application status has been updated.';
  return (
    <main className="verification-status-page">
      <section className={`status-result-card ${isRejected ? 'rejected' : ''}`}>
        <div className="status-mark"><FontAwesomeIcon icon={isRejected ? faClock : faCheck} /></div>
        <p className="status-kicker">Application status</p>
        <h1>{application.application_type || 'Registration application'}</h1>
        <p className="status-copy">Here is the latest update available for your application.</p>
        <span className="status-reference">{application.reference_number}</span>
        <div className="status-progress" aria-label="Application progress">
          {steps.map(([label], index) => <div className={`status-step ${index < progress ? 'complete' : ''} ${index === progress ? 'current' : ''}`} key={label}>{label}</div>)}
        </div>
        <div className={`status-detail status-cell-${String(application.status || 'unknown').toLowerCase()} ${isRejected ? 'rejected' : ''}`}><strong>{statusLabel}</strong><span>{statusMessage}</span></div>
        <p className="status-copy">Applicant: {application.applicant_name || 'Applicant'}<br />Last updated: {new Date(application.updated_at || application.created_at).toLocaleString()}</p>
        <RegistrationDocuments documents={application.registration_documents} />
        <div className="success-slip-actions"><button type="button" className="status-new-search" onClick={() => navigate('/verify')}><FontAwesomeIcon icon={faRotate} /> Check another</button><Link to={`/edit?reference=${encodeURIComponent(application.reference_number)}`}>Edit this submission</Link><Link to="/">Return to website</Link></div>
      </section>
    </main>
  );
}

function RegistrationDocuments({ documents }) {
  if (!Array.isArray(documents) || !documents.length) return null;
  return (
    <section className="status-documents">
      <h2>Registration documents</h2>
      <p>Documents released for download by our registration team.</p>
      <div className="status-document-list">
        {documents.map((document, index) => {
          const documentLabel = document.label || document.name || `Registration document ${index + 1}`;
          const isImage = document.type?.startsWith('image/') || document.dataUrl?.startsWith('data:image/');
          const isPdf = document.type === 'application/pdf' || document.dataUrl?.startsWith('data:application/pdf');
          return (
            <article className="status-document-card" key={`${document.name}-${index}`}>
              <div className="status-document-preview">
                {isImage && <img src={document.dataUrl} alt={`Preview of ${documentLabel}`} />}
                {isPdf && <iframe src={document.dataUrl} title={`Preview of ${documentLabel}`} />}
                {!isImage && !isPdf && <span>Preview unavailable</span>}
              </div>
              <div className="status-document-footer">
                <span>{documentLabel}</span>
                <a className="status-document-download" href={document.dataUrl} download={document.name || `registration-document-${index + 1}`} target="_blank" rel="noreferrer" title={`Download ${documentLabel}`} aria-label={`Download ${documentLabel}`}>
                  <FontAwesomeIcon icon={faDownload} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default VerificationStatusPage;
