import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitNINApplication } from '../lib/supabaseClient';
import { usePersistentDraft } from '../lib/usePersistentDraft';
import { reportValidationErrors } from '../lib/reportValidationErrors';
import '../css/pages/NINVerificationPage.css';

function NINVerificationPage() {
  const navigate = useNavigate();
  const initialForm = { nin: '', phone: '', surname: '', firstName: '', dateOfBirth: '', email: '', address: '' };
  const { form, setForm, step, setStep, clearDraft } = usePersistentDraft('pernestdigitalservices_draft_nin_verification', initialForm);
  const [errors, setErrors] = useState({});
  const [reference, setReference] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const validate = () => {
    const nextErrors = {};
    if (step === 1 && !form.nin.trim() && !form.phone.trim() && !(form.surname.trim() && form.firstName.trim() && form.dateOfBirth)) {
      nextErrors.lookup = 'Provide your NIN, phone number, or surname, first name, and date of birth.';
    }
    if (step === 2 && !form.email.trim()) nextErrors.email = 'Email is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) reportValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const next = () => { if (validate()) setStep(2); };
  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const applicationReference = `NIN-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error } = await submitNINApplication({ reference_number: applicationReference, nin: form.nin, phone: form.phone, surname: form.surname, first_name: form.firstName, date_of_birth: form.dateOfBirth || null, email: form.email, address: form.address, status: 'pending', created_at: new Date().toISOString() });
    if (error) setErrors({ submit: error.message });
    else { setReference(applicationReference); setSubmitted(true); clearDraft(); }
  };

  if (submitted) return <main className="nin-page"><section className="nin-card nin-success"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /><p className="nin-kicker">Request received</p><h1>NIN verification request submitted</h1><p>Your reference number is <strong>{reference}</strong>. Our team will review your request and contact you using the details provided.</p><button className="nin-primary" type="button" onClick={() => navigate('/')}>Return to website</button></section></main>;

  return <main className="nin-page"><section className="nin-card"><header className="nin-header"><a href="/" aria-label="Go to home page"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /></a><p>PERNEST DIGITAL ENTERPRISE</p><h1>NIN Verification Form</h1><span>Provide any one of the accepted verification options.</span></header><div className="nin-progress"><span style={{ width: `${step * 50}%` }} /></div><p className="nin-step">Step {step} of 2</p><form onSubmit={submit}>{step === 1 && <section className="nin-section"><h2>Verification details</h2><p className="nin-help">Provide either your NIN, your phone number, or all three identity details: surname, first name, and date of birth.</p><div className="nin-grid"><Field label="NIN" value={form.nin} onChange={(value) => update('nin', value)} /><Field label="Phone number" value={form.phone} onChange={(value) => update('phone', value)} /><Field label="Surname" value={form.surname} onChange={(value) => update('surname', value)} /><Field label="First name" value={form.firstName} onChange={(value) => update('firstName', value)} /><Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => update('dateOfBirth', value)} /></div>{errors.lookup && <p className="nin-error">{errors.lookup}</p>}</section>}{step === 2 && <section className="nin-section"><h2>Contact and review</h2><div className="nin-grid"><Field label="Email address" type="email" value={form.email} error={errors.email} onChange={(value) => update('email', value)} required /><Field label="Address" value={form.address} onChange={(value) => update('address', value)} /></div><div className="nin-review"><p><strong>Search method:</strong> {form.nin ? 'NIN' : form.phone ? 'Phone number' : 'Name and date of birth'}</p><p><strong>Name:</strong> {form.firstName} {form.surname}</p><p><strong>NIN:</strong> {form.nin || 'Not provided'}</p><p><strong>Phone:</strong> {form.phone || 'Not provided'}</p></div>{errors.submit && <p className="nin-error">{errors.submit}</p>}</section>}<div className="nin-actions">{step === 2 && <button type="button" className="nin-secondary" onClick={() => { setErrors({}); setStep(1); }}>Back</button>}{step === 1 ? <button type="button" className="nin-primary" onClick={next}>Next</button> : <button type="submit" className="nin-primary">Submit verification request</button>}</div></form></section></main>;
}

function Field({ label, value, onChange, error, type = 'text', required = false }) { return <label className="nin-field">{label}{required && ' *'}<input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} />{error && <small className="nin-error">{error}</small>}</label>; }
export default NINVerificationPage;
