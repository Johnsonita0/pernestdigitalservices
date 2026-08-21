import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCompanyApplication, updateCompanyPaymentSlip } from '../lib/supabaseClient';
import { COMMON_LGAS, GENDERS, NIGERIAN_STATES } from '../data/nigeriaLocations';
import { useLocationData } from '../lib/locationData';
import SearchableLocationField from '../components/SearchableLocationField';
import { usePersistentDraft } from '../lib/usePersistentDraft';
import { reportValidationErrors } from '../lib/reportValidationErrors';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import '../css/pages/CompanyRegistrationPage.css';

const TOTAL_STEPS = 7;
const emptyPerson = {
  surname: '', firstName: '', otherName: '', phone: '', email: '', dateOfBirth: '', nationality: 'Nigeria',
  gender: '', occupation: '', state: '', lga: '', town: '', houseNumber: '', streetName: '', idType: '', idNumber: '', shareAmount: '', idDocument: null, signature: null,
};
const initialForm = {
  proposedName1: '', proposedName2: '', email: '', phone: '', state: '', lga: '', town: '', houseNumber: '', streetName: '', objects: '', witness: { ...emptyPerson }, directors: [{ ...emptyPerson }], shareholders: [{ ...emptyPerson }],
};

function CompanyRegistrationPage() {
  const navigate = useNavigate();
  const { form, setForm, step, setStep, clearDraft } = usePersistentDraft('pernestdigitalservices_draft_company', initialForm);
  const [errors, setErrors] = useState({});
  const [reference, setReference] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value, ...(field === 'state' ? { lga: '' } : {}) }));
  const updatePerson = (group, index, field, value) => setForm((current) => {
    const stateKey = group === 'director' ? 'directors' : group === 'shareholder' ? 'shareholders' : group;
    return {
      ...current,
      [stateKey]: Array.isArray(current[stateKey])
        ? current[stateKey].map((person, personIndex) => personIndex === index ? { ...person, [field]: value, ...(field === 'state' ? { lga: '' } : {}) } : person)
        : { ...current[stateKey], [field]: value, ...(field === 'state' ? { lga: '' } : {}) },
    };
  });
  const addPerson = (group) => setForm((current) => ({ ...current, [group]: [...current[group], { ...emptyPerson }] }));

  const readFile = (file) => new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => resolve({ name: file.name, type: file.type, size: file.size });
    reader.readAsDataURL(file);
  });
  const setPersonFile = async (group, index, field, file) => updatePerson(group, index, field, await readFile(file));

  const validatePerson = (person, prefix, includeShare = false) => {
    const nextErrors = {};
    ['surname', 'firstName', 'phone', 'email', 'dateOfBirth', 'occupation', 'state', 'lga', 'town', 'streetName'].forEach((field) => {
      if (!String(person[field] || '').trim()) nextErrors[`${prefix}-${field}`] = 'Required';
    });
    if (includeShare && !String(person.shareAmount || '').trim()) nextErrors[`${prefix}-shareAmount`] = 'Required';
    return nextErrors;
  };

  const validate = () => {
    const nextErrors = {};
    if (step === 1) {
      if (!form.proposedName1.trim() || !/\b(ltd|limited)$/i.test(form.proposedName1.trim())) nextErrors.proposedName1 = 'Name must end with LTD or LIMITED.';
      if (!form.email.trim()) nextErrors.email = 'Required';
      if (!form.phone.trim()) nextErrors.phone = 'Required';
      if (!form.state.trim() || !form.lga.trim() || !form.town.trim() || !form.streetName.trim()) nextErrors.address = 'Complete the company address.';
    }
    if (step === 2 && !form.objects.trim()) nextErrors.objects = 'List the company activities.';
    if (step === 3) Object.assign(nextErrors, validatePerson(form.witness, 'witness'));
    if (step === 4) form.directors.forEach((person, index) => Object.assign(nextErrors, validatePerson(person, `director-${index}`)));
    if (step === 5) form.shareholders.forEach((person, index) => Object.assign(nextErrors, validatePerson(person, `shareholder-${index}`, true)));
    if (step === 6) {
      const people = [['witness', form.witness, 0], ...form.directors.map((person, index) => ['director', person, index]), ...form.shareholders.map((person, index) => ['shareholder', person, index])];
      people.forEach(([group, person, index]) => ['idDocument', 'signature'].forEach((field) => { if (!person[field]) nextErrors[`${group}-${index}-${field}`] = 'Upload required'; }));
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) reportValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => { if (validate()) setStep((current) => Math.min(TOTAL_STEPS, current + 1)); };
  const back = () => { setErrors({}); setStep((current) => Math.max(1, current - 1)); };
  const makeReference = () => `CAC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const applicationReference = makeReference();
    const payload = {
      reference_number: applicationReference, proposed_name_1: form.proposedName1, proposed_name_2: form.proposedName2, email: form.email, phone: form.phone,
      state: form.state, lga: form.lga, town: form.town, house_number: form.houseNumber, street_name: form.streetName, objects: form.objects,
      witness: form.witness, directors: form.directors, shareholders: form.shareholders, status: 'payment_pending', created_at: new Date().toISOString(),
    };
    const { error } = await submitCompanyApplication(payload);
    if (error) setErrors({ submit: error.message });
    else { setReference(applicationReference); setSubmitted(true); clearDraft(); }
    setBusy(false);
  };

  const submitPayment = async () => {
    if (!paymentSlip) return;
    const { error } = await updateCompanyPaymentSlip(reference, paymentSlip);
    if (!error) setPaymentSubmitted(true);
  };

  if (submitted) return <PaymentView reference={reference} paymentSlip={paymentSlip} setPaymentSlip={async (file) => setPaymentSlip(await readFile(file))} submitPayment={submitPayment} paymentSubmitted={paymentSubmitted} navigate={navigate} />;

  return (
    <main className="company-page">
      <section className="company-card">
        <header className="company-header"><a href="/" aria-label="Go to home page"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /></a><p>PERNEST DIGITAL ENTERPRISE</p><h1>Company Registration With CAC</h1><span>Complete each step with accurate information.</span></header>
        <div className="company-progress"><span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} /></div>
        <p className="company-step">Step {step} of {TOTAL_STEPS}</p>
        <form onSubmit={submit}>
          {step === 1 && <Step title="Company and entity details"><div className="company-grid"><Field label="Proposed company name 1 (must end with LTD or LIMITED)" value={form.proposedName1} error={errors.proposedName1} onChange={(value) => update('proposedName1', value)} required /><Field label="Proposed company name 2" value={form.proposedName2} onChange={(value) => update('proposedName2', value)} /><Field label="Company email" type="email" value={form.email} error={errors.email} onChange={(value) => update('email', value)} required /><Field label="Company phone" value={form.phone} error={errors.phone} onChange={(value) => update('phone', value)} required /><Field label="State" options={NIGERIAN_STATES} value={form.state} onChange={(value) => update('state', value)} required /><Field label="LGA" options={COMMON_LGAS} stateValue={form.state} value={form.lga} onChange={(value) => update('lga', value)} required /><Field label="Town / city / village" value={form.town} onChange={(value) => update('town', value)} required /><Field label="House number" value={form.houseNumber} onChange={(value) => update('houseNumber', value)} /><Field label="Street name" value={form.streetName} onChange={(value) => update('streetName', value)} required /></div>{errors.address && <p className="company-error">{errors.address}</p>}</Step>}
          {step === 2 && <Step title="Object of memorandum"><TextArea label="List everything the company will be doing, one activity per line" value={form.objects} error={errors.objects} onChange={(value) => update('objects', value)} required /></Step>}
          {step === 3 && <Step title="Witness information"><PersonFields group="witness" index={0} person={form.witness} errors={errors} updatePerson={updatePerson} setPersonFile={setPersonFile} /></Step>}
          {step === 4 && <Step title="Director information"><p className="company-help">Add and complete every director.</p>{form.directors.map((person, index) => <PersonFields key={index} group="director" index={index} person={person} errors={errors} updatePerson={updatePerson} setPersonFile={setPersonFile} />)}<button type="button" className="add-person" onClick={() => addPerson('directors')}>+ Add another director</button></Step>}
          {step === 5 && <Step title="Shareholder information"><p className="company-help">Add and complete every shareholder.</p>{form.shareholders.map((person, index) => <PersonFields key={index} group="shareholder" index={index} person={person} errors={errors} updatePerson={updatePerson} setPersonFile={setPersonFile} includeShare />)}<button type="button" className="add-person" onClick={() => addPerson('shareholders')}>+ Add another shareholder</button></Step>}
          {step === 6 && <Step title="Documents and declaration"><p className="company-help">Upload a clear means of ID and signature for the witness, every director, and every shareholder. NIN card generation may attract an additional fee.</p><DocumentSummary form={form} errors={errors} /></Step>}
          {step === 7 && <Step title="Review and submit"><div className="company-review"><p><strong>Proposed name:</strong> {form.proposedName1}</p><p><strong>Company email:</strong> {form.email}</p><p><strong>Directors:</strong> {form.directors.length}</p><p><strong>Shareholders:</strong> {form.shareholders.length}</p><p><strong>Objects:</strong> {form.objects}</p></div><div className="company-notes"><strong>Documents and payment</strong><span>Part payment is accepted, but complete payment is required before the certificate and other documents are issued. Corrections after registration may attract a fee.</span></div>{errors.submit && <p className="company-error">{errors.submit}</p>}</Step>}
          <div className="company-actions">{step > 1 && <button type="button" className="company-secondary" onClick={back}>Back</button>}{step < TOTAL_STEPS ? <button type="button" className="company-primary" onClick={next}>Next</button> : <button type="submit" className="company-primary" disabled={busy}>{busy ? 'Submitting...' : 'Submit application'}</button>}</div>
        </form>
      </section>
    </main>
  );
}

function Step({ title, children }) { return <section className="company-step-content"><h2>{title}</h2>{children}</section>; }
function Field({ label, value, onChange, error, type = 'text', required = false, options, stateValue }) { const { states, lgasByState } = useLocationData(); const fieldOptions = label === 'State' ? states : label === 'LGA' ? lgasByState[stateValue] || [] : options; return <label className="company-field">{label}{required && ' *'}{fieldOptions ? (label === 'State' || label === 'LGA' ? <SearchableLocationField label={label} value={value} options={fieldOptions} onChange={onChange} /> : <select value={value || ''} onChange={(event) => onChange(event.target.value)}><option value="">Select {label}</option>{fieldOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>) : <input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} />}{error && <small className="company-error">{error}</small>}</label>; }
function TextArea({ label, value, onChange, error, required = false }) { return <label className="company-field company-full-field">{label}{required && ' *'}<textarea rows="9" value={value} onChange={(event) => onChange(event.target.value)} />{error && <small className="company-error">{error}</small>}</label>; }
function PersonFields({ group, index, person, errors, updatePerson, setPersonFile, includeShare = false, showId = true }) { const fields = [['surname', 'Surname'], ['firstName', 'First name'], ['otherName', 'Other name'], ['phone', 'Phone number'], ['email', 'Email', 'email'], ['dateOfBirth', 'Date of birth', 'date'], ['nationality', 'Nationality'], ['gender', 'Gender'], ['occupation', 'Occupation'], ['state', 'State'], ['lga', 'LGA'], ['town', 'Town / city / village'], ['houseNumber', 'House number'], ['streetName', 'Street name']]; return <div className="company-person"><h3>{group === 'witness' ? 'Witness' : `${group.charAt(0).toUpperCase()}${group.slice(1)} ${index + 1}`}</h3><div className="company-grid">{fields.map(([field, label, type]) => <Field key={field} label={label} type={type || 'text'} options={field === 'gender' ? GENDERS : field === 'state' ? NIGERIAN_STATES : field === 'lga' ? COMMON_LGAS : undefined} stateValue={person.state} value={person[field]} error={errors[`${group}-${index}-${field}`]} onChange={(value) => updatePerson(group, index, field, value)} required={!['otherName', 'nationality', 'gender', 'houseNumber'].includes(field)} />)}{includeShare && <Field label="Share amount" value={person.shareAmount} error={errors[`${group}-${index}-shareAmount`]} onChange={(value) => updatePerson(group, index, 'shareAmount', value)} required />}</div><div className="company-files">{showId && <FileField label="Means of ID" value={person.idDocument} onChange={(file) => setPersonFile(group, index, 'idDocument', file)} error={errors[`${group}-${index}-idDocument`]} />}<FileField label="Signature" value={person.signature} onChange={(file) => setPersonFile(group, index, 'signature', file)} error={errors[`${group}-${index}-signature`]} /></div></div>; }
function FileField({ label, value, onChange, error }) { return <label className="company-file">{label}<input type="file" accept="image/*,.pdf" onChange={(event) => onChange(event.target.files[0])} /><FilePreview value={value} />{error && <small className="company-error">{error}</small>}</label>; }
function FilePreview({ value }) { if (!value) return null; const isImage = value.type?.startsWith('image/') || value.dataUrl?.startsWith('data:image/'); return <span className="upload-preview">{isImage ? <img src={value.dataUrl} alt={`${value.name} preview`} /> : <span className="upload-file-icon">PDF</span>}<small>{value.name}</small></span>; }
function DocumentSummary({ form, errors }) { const people = [['witness', form.witness, 0], ...form.directors.map((person, index) => ['director', person, index]), ...form.shareholders.map((person, index) => ['shareholder', person, index])]; return <div className="company-documents">{people.map(([group, person, index]) => <div key={`${group}-${index}`}><strong>{group === 'witness' ? 'Witness' : `${group} ${index + 1}`}</strong><span>{person.idDocument?.name || 'ID not selected'} · {person.signature?.name || 'signature not selected'}</span>{['idDocument', 'signature'].map((field) => errors[`${group}-${index}-${field}`] && <small className="company-error" key={field}>{field} is required.</small>)}</div>)}</div>; }
function PaymentView({ reference, paymentSlip, setPaymentSlip, submitPayment, paymentSubmitted, navigate }) { return <main className="company-page"><PaymentSuccessModal isOpen={paymentSubmitted} reference={reference} onComplete={() => navigate('/')} /><section className="company-card company-payment"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /><p className="company-kicker">Application received</p><h1>Complete CAC Company Registration Payment</h1><p>Reference: <strong>{reference}</strong></p><div className="company-account"><strong>Pay the agreed service charge</strong><span>Account: 8130801666</span><span>Bank: Opay</span><span>Account name: ERNEST EMMANUEL OSUNG</span></div><p>Part payment is accepted, but complete payment is required before certificate issuance.</p><label className="company-file">Upload bank transfer slip<input type="file" accept="image/*,.pdf" onChange={(event) => setPaymentSlip(event.target.files[0])} /><FilePreview value={paymentSlip} /></label><button className="company-primary" type="button" onClick={submitPayment} disabled={!paymentSlip || paymentSubmitted}>{paymentSubmitted ? 'Slip submitted for review' : 'Submit payment slip'}</button></section></main>; }

export default CompanyRegistrationPage;
