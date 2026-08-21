import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSCUMLApplication, updateSCUMLPaymentSlip } from '../lib/supabaseClient';
import '../css/pages/SCUMLRegistrationPage.css';
import { usePersistentDraft } from '../lib/usePersistentDraft';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import { reportValidationErrors } from '../lib/reportValidationErrors';

const emptyPerson = { name: '', dateOfBirth: '', phone: '', email: '', bvn: '', nin: '', address: '' };

function SCUMLRegistrationPage() {
  const navigate = useNavigate();
  const initialForm = { entityName: '', registrationNumber: '', registeredAddress: '', taxId: '', persons: [{ ...emptyPerson }], bankName: '', accountNumber: '', accountName: '' };
  const { form, setForm, step, setStep, clearDraft } = usePersistentDraft('pernestdigitalservices_draft_scuml', initialForm);
  const [errors, setErrors] = useState({});
  const [reference, setReference] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updatePerson = (index, field, value) => setForm((current) => ({ ...current, persons: current.persons.map((person, personIndex) => personIndex === index ? { ...person, [field]: value } : person) }));
  const addPerson = () => setForm((current) => ({ ...current, persons: [...current.persons, { ...emptyPerson }] }));
  const readFile = (file) => new Promise((resolve) => { if (!file) return resolve(null); const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result }); reader.onerror = () => resolve({ name: file.name, type: file.type, size: file.size }); reader.readAsDataURL(file); });

  const validate = () => {
    const nextErrors = {};
    if (step === 1) ['entityName', 'registrationNumber', 'registeredAddress', 'taxId'].forEach((field) => { if (!form[field].trim()) nextErrors[field] = 'Required'; });
    if (step === 2) form.persons.forEach((person, index) => ['name', 'dateOfBirth', 'phone', 'email', 'bvn', 'nin', 'address'].forEach((field) => { if (!person[field].trim()) nextErrors[`person-${index}-${field}`] = 'Required'; }));
    if (step === 3) ['bankName', 'accountNumber', 'accountName'].forEach((field) => { if (!form[field].trim()) nextErrors[field] = 'Required'; });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) reportValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const next = () => { if (validate()) setStep((current) => Math.min(4, current + 1)); };
  const back = () => { setErrors({}); setStep((current) => Math.max(1, current - 1)); };
  const makeReference = () => `SCUML-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const submit = async (event) => { event.preventDefault(); if (!validate()) return; const applicationReference = makeReference(); const { error } = await submitSCUMLApplication({ reference_number: applicationReference, entity_name: form.entityName, registration_number: form.registrationNumber, registered_address: form.registeredAddress, tax_id: form.taxId, persons: form.persons, bank_name: form.bankName, account_number: form.accountNumber, account_name: form.accountName, status: 'payment_pending', created_at: new Date().toISOString() }); if (error) setErrors({ submit: error.message }); else { setReference(applicationReference); setSubmitted(true); clearDraft(); } };
  const submitPayment = async () => { if (!paymentSlip) return; const { error } = await updateSCUMLPaymentSlip(reference, paymentSlip); if (!error) setPaymentSubmitted(true); };

  if (submitted) return <main className="scuml-page"><PaymentSuccessModal isOpen={paymentSubmitted} reference={reference} onComplete={() => navigate('/')} /><section className="scuml-card scuml-payment"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /><p className="scuml-kicker">Application received</p><h1>Complete SCUML Registration Payment</h1><p>Reference: <strong>{reference}</strong></p><div className="scuml-account"><strong>Pay the agreed service charge</strong><span>Account: 8130801666</span><span>Bank: Opay</span><span>Account name: ERNEST EMMANUEL OSUNG</span></div><p>Part payment is accepted, but complete payment is required before documents are issued.</p><label className="scuml-file">Upload bank transfer slip<input type="file" accept="image/*,.pdf" onChange={async (event) => setPaymentSlip(await readFile(event.target.files[0]))} />{paymentSlip && <small>{paymentSlip.name}</small>}</label><button className="scuml-primary" type="button" onClick={submitPayment} disabled={!paymentSlip || paymentSubmitted}>{paymentSubmitted ? 'Slip submitted for review' : 'Submit payment slip'}</button></section></main>;

  return <main className="scuml-page"><section className="scuml-card"><header className="scuml-header"><a href="/" aria-label="Go to home page"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /></a><p>PERNEST DIGITAL ENTERPRISE</p><h1>SCUML Registration Form</h1><span>Complete each step accurately.</span></header><div className="scuml-progress"><span style={{ width: `${(step / 4) * 100}%` }} /></div><p className="scuml-step">Step {step} of 4</p><form onSubmit={submit}>{step === 1 && <section className="scuml-section"><h2>Business, company, or NGO details</h2><div className="scuml-grid"><Field label="Business / Company / NGO name" value={form.entityName} error={errors.entityName} onChange={(value) => update('entityName', value)} required /><Field label="BN / RC / IT number" value={form.registrationNumber} error={errors.registrationNumber} onChange={(value) => update('registrationNumber', value)} required /><Field label="Registered address" value={form.registeredAddress} error={errors.registeredAddress} onChange={(value) => update('registeredAddress', value)} required /><Field label="Tax ID" value={form.taxId} error={errors.taxId} onChange={(value) => update('taxId', value)} required /></div></section>}{step === 2 && <section className="scuml-section"><h2>Proprietor, director, or trustee details</h2><p className="scuml-help">Add every proprietor, director, or trustee connected to the entity.</p>{form.persons.map((person, index) => <Person key={index} index={index} person={person} errors={errors} update={updatePerson} />)}<button type="button" className="add-person" onClick={addPerson}>+ Add another person</button></section>}{step === 3 && <section className="scuml-section"><h2>Account details</h2><div className="scuml-grid"><Field label="Bank name" value={form.bankName} error={errors.bankName} onChange={(value) => update('bankName', value)} required /><Field label="Account number" value={form.accountNumber} error={errors.accountNumber} onChange={(value) => update('accountNumber', value)} required /><Field label="Account name" value={form.accountName} error={errors.accountName} onChange={(value) => update('accountName', value)} required /></div></section>}{step === 4 && <section className="scuml-section"><h2>Review and submit</h2><div className="scuml-review"><p><strong>Entity:</strong> {form.entityName}</p><p><strong>Registration number:</strong> {form.registrationNumber}</p><p><strong>Tax ID:</strong> {form.taxId}</p><p><strong>People listed:</strong> {form.persons.length}</p><p><strong>Bank:</strong> {form.bankName} · {form.accountNumber} · {form.accountName}</p></div><div className="scuml-notes"><strong>Important</strong><span>Part payment is accepted, but complete payment is required before documents are issued. Ensure all details are correct because corrections may attract a fee.</span></div>{errors.submit && <p className="scuml-error">{errors.submit}</p>}</section>}<div className="scuml-actions">{step > 1 && <button type="button" className="scuml-secondary" onClick={back}>Back</button>}{step < 4 ? <button type="button" className="scuml-primary" onClick={next}>Next</button> : <button type="submit" className="scuml-primary">Submit application</button>}</div></form></section></main>;
}

function Field({ label, value, onChange, error, type = 'text', required = false }) { return <label className="scuml-field">{label}{required && ' *'}<input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} />{error && <small className="scuml-error">{error}</small>}</label>; }
function Person({ index, person, errors, update }) { const fields = [['name', 'Full name'], ['dateOfBirth', 'Date of birth', 'date'], ['phone', 'Phone number'], ['email', 'Email', 'email'], ['bvn', 'BVN'], ['nin', 'NIN'], ['address', 'Address']]; return <div className="scuml-person"><h3>Person {index + 1}</h3><div className="scuml-grid">{fields.map(([field, label, type]) => <Field key={field} label={label} type={type || 'text'} value={person[field]} error={errors[`person-${index}-${field}`]} onChange={(value) => update(index, field, value)} required />)}</div></div>; }
export default SCUMLRegistrationPage;
