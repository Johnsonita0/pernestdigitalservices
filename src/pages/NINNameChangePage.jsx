import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitNINNameChange } from '../lib/supabaseClient';
import { usePersistentDraft } from '../lib/usePersistentDraft';
import { reportValidationErrors } from '../lib/reportValidationErrors';
import '../css/pages/NINVerificationPage.css';

function NINNameChangePage() {
  const navigate = useNavigate();
  const initialForm = { nin: '', newSurname: '', newFirstName: '', newMiddleName: '', newPhoneNumber: '', email: '' };
  const { form, setForm, clearDraft } = usePersistentDraft('pernestdigitalservices_draft_nin_name_change', initialForm);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.nin || !form.newSurname || !form.newFirstName || !form.newPhoneNumber || !form.email) {
      const message = 'NIN, new surname, new first name, new phone number, and email are required.';
      setError(message);
      reportValidationErrors({ required: message });
      return;
    }
    const reference = `NIN-NAME-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error: submitError } = await submitNINNameChange({ reference_number: reference, nin: form.nin, new_surname: form.newSurname, new_first_name: form.newFirstName, new_middle_name: form.newMiddleName, new_phone_number: form.newPhoneNumber, email: form.email, status: 'pending', created_at: new Date().toISOString() });
    if (submitError) setError(submitError.message);
    else { setSubmitted(reference); clearDraft(); }
  };

  if (submitted) return <main className="nin-page"><section className="nin-card nin-success"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /><p className="nin-kicker">Request received</p><h1>NIN name change request submitted</h1><p>Your reference number is <strong>{submitted}</strong>. Our team will contact you using your email address.</p><button className="nin-primary" type="button" onClick={() => navigate('/')}>Return to website</button></section></main>;
  return <main className="nin-page"><section className="nin-card"><header className="nin-header"><a href="/" aria-label="Go to home page"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /></a><p>PERNEST DIGITAL ENTERPRISE</p><h1>NIN Change of Name</h1><span>Submit the details required for your NIN name update.</span></header><form onSubmit={submit}><section className="nin-section"><h2>Change details</h2><div className="nin-grid"><Field label="NIN" value={form.nin} onChange={(value) => update('nin', value)} required /><Field label="New surname" value={form.newSurname} onChange={(value) => update('newSurname', value)} required /><Field label="New first name" value={form.newFirstName} onChange={(value) => update('newFirstName', value)} required /><Field label="New middle name" value={form.newMiddleName} onChange={(value) => update('newMiddleName', value)} /><Field label="New phone number" value={form.newPhoneNumber} onChange={(value) => update('newPhoneNumber', value)} required /><Field label="Email address" type="email" value={form.email} onChange={(value) => update('email', value)} required /></div>{error && <p className="nin-error">{error}</p>}</section><div className="nin-actions"><button className="nin-primary" type="submit">Submit name change request</button></div></form></section></main>;
}

function Field({ label, value, onChange, type = 'text', required = false }) { return <label className="nin-field">{label}{required && ' *'}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
export default NINNameChangePage;
