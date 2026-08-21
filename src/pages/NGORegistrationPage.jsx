import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitNGOApplication, updateNGOPaymentSlip } from '../lib/supabaseClient';
import { COMMON_LGAS, GENDERS, NIGERIAN_STATES } from '../data/nigeriaLocations';
import { useLocationData } from '../lib/locationData';
import SearchableLocationField from '../components/SearchableLocationField';
import { usePersistentDraft } from '../lib/usePersistentDraft';
import { reportValidationErrors } from '../lib/reportValidationErrors';
import PaymentSubmissionCard from '../components/PaymentSubmissionCard';
import '../css/pages/NGORegistrationPage.css';

const TOTAL_STEPS = 7;
const initialTrustee = {
  surname: '', firstName: '', otherName: '', dateOfBirth: '', gender: '', nationality: '',
  phone: '', email: '', occupation: '', country: 'Nigeria', state: '', lga: '', town: '',
  houseNumber: '', streetName: '', idType: '', idNumber: '', idDocument: null, signature: null, passport: null,
};

const initialForm = {
  proposedName1: '', proposedName2: '', proposedName3: '', email: '', officeAddress: '', state: '', lga: '', town: '', houseNumber: '', streetName: '',
  trusteeCount: 2, trusteeTenure: '', aims: '', sourceOfIncome: '', trustees: [{ ...initialTrustee }, { ...initialTrustee }], paymentSlip: null,
};

function NGORegistrationPage() {
  const navigate = useNavigate();
  const { form, setForm, step, setStep, clearDraft } = usePersistentDraft('pernestdigitalservices_draft_ngo', initialForm);
  const [errors, setErrors] = useState({});
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const progress = useMemo(() => `${(step / TOTAL_STEPS) * 100}%`, [step]);

  const showToast = (message, type = 'success') => {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type, duration: 4500 } }));
  };

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value, ...(field === 'state' ? { lga: '' } : {}) }));
  const updateTrustee = (index, field, value) => setForm((current) => field === '__remove' && current.trustees.length > 2
    ? { ...current, trusteeCount: current.trusteeCount - 1, trustees: current.trustees.filter((_, trusteeIndex) => trusteeIndex !== index) }
    : ({ ...current, trustees: current.trustees.map((trustee, trusteeIndex) => trusteeIndex === index ? { ...trustee, [field]: value, ...(field === 'state' ? { lga: '' } : {}) } : trustee) }));

  const updateTrusteeCount = (value) => {
    const count = Math.min(20, Math.max(2, Number(value) || 2));
    setForm((current) => ({
      ...current,
      trusteeCount: count,
      trustees: Array.from({ length: count }, (_, index) => current.trustees[index] || { ...initialTrustee }),
    }));
  };

  const addTrustee = () => updateTrusteeCount(form.trusteeCount + 1);

  const validateStep = () => {
    const nextErrors = {};
    if (step === 1) {
      if (!form.proposedName1.trim()) nextErrors.proposedName1 = 'Enter at least one proposed name.';
      if (!form.email.trim()) nextErrors.email = 'Email is required.';
      if (!form.officeAddress.trim()) nextErrors.officeAddress = 'Registered office address is required.';
      if (!form.state.trim()) nextErrors.state = 'State is required.';
      if (!form.lga.trim()) nextErrors.lga = 'LGA is required.';
      if (!form.town.trim()) nextErrors.town = 'Town or city is required.';
      if (!form.streetName.trim()) nextErrors.streetName = 'Street name is required.';
    }
    if (step === 2) {
      if (form.trusteeCount < 2) nextErrors.trusteeCount = 'At least two trustees are required.';
      if (!form.trusteeTenure) nextErrors.trusteeTenure = 'Enter the trustee tenure.';
    }
    if (step === 3 && !form.aims.trim()) nextErrors.aims = 'List the aims and objectives.';
    if (step === 4) {
      form.trustees.forEach((trustee, index) => {
        ['surname', 'firstName', 'dateOfBirth', 'gender', 'nationality', 'phone', 'email', 'occupation', 'state', 'lga', 'town', 'streetName', 'idType', 'idNumber'].forEach((field) => {
          if (!String(trustee[field] || '').trim()) nextErrors[`trustee-${index}-${field}`] = 'Required';
        });
      });
    }
    if (step === 5 && !form.sourceOfIncome.trim()) nextErrors.sourceOfIncome = 'List the sources of income.';
    if (step === 6) {
      form.trustees.forEach((trustee, index) => {
        ['idDocument', 'signature', 'passport'].forEach((field) => {
          if (!trustee[field]) nextErrors[`trustee-${index}-${field}`] = 'Upload this document.';
        });
      });
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) reportValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };
  const previousStep = () => { setErrors({}); setStep((current) => Math.max(1, current - 1)); };

  const makeReference = () => `NGO-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    setIsSubmitting(true);
    const reference = makeReference();
    const payload = {
      reference_number: reference,
      proposed_name_1: form.proposedName1,
      proposed_name_2: form.proposedName2,
      proposed_name_3: form.proposedName3,
      email: form.email,
      office_address: form.officeAddress,
      state: form.state,
      lga: form.lga,
      town: form.town,
      house_number: form.houseNumber,
      street_name: form.streetName,
      trustee_count: form.trusteeCount,
      trustee_tenure: form.trusteeTenure,
      aims: form.aims,
      source_of_income: form.sourceOfIncome,
      trustees: form.trustees,
      status: 'payment_pending',
      created_at: new Date().toISOString(),
    };
    const { error } = await submitNGOApplication(payload);
    if (error) {
      setErrors({ submit: error.message });
      setIsSubmitting(false);
      return;
    }
    setReferenceNumber(reference);
    setSubmitted(true);
    clearDraft();
    setStep(7);
    setIsSubmitting(false);
  };

  const readFile = (file) => new Promise((resolve) => {
    if (!file) { resolve(null); return; }
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => resolve({ name: file.name, type: file.type, size: file.size });
    reader.readAsDataURL(file);
  });
  const handleFile = async (field, file) => updateField(field, await readFile(file));
  const handleTrusteeFile = async (index, field, file) => updateTrustee(index, field, await readFile(file));
  const handlePaymentSlipSubmit = async () => {
    if (!form.paymentSlip) return;
    const { error } = await updateNGOPaymentSlip(referenceNumber, form.paymentSlip);
    if (!error) {
      setPaymentSubmitted(true);
      showToast('NGO payment slip submitted successfully.');
    } else {
      showToast(`Unable to submit payment slip: ${error.message}`, 'error');
    }
  };

  if (submitted) return <PaymentSubmissionCard title="Complete Your NGO Registration Payment" reference={referenceNumber} description="Your NGO application was received. Complete payment, then upload your bank transfer slip so our admin team can confirm it." file={form.paymentSlip} onFileChange={(file) => handleFile('paymentSlip', file)} onSubmit={handlePaymentSlipSubmit} paymentSubmitted={paymentSubmitted} onComplete={() => navigate('/')} />;

  return (
    <main className="ngo-page">
      <section className="ngo-card">
        <header className="ngo-header">
          <a href="/" aria-label="Go to home page"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="ngo-logo" /></a>
          <p className="ngo-kicker">PERNEST DIGITAL ENTERPRISES</p>
          <h1>NGO Registration Form</h1>
          <p>Complete each step carefully. Your details will be reviewed before registration begins.</p>
        </header>
        <div className="ngo-progress"><span style={{ width: progress }} /></div>
        <div className="ngo-step-label">Step {step} of {TOTAL_STEPS}</div>
        <form onSubmit={handleSubmit}>
          {step === 1 && <Step title="NGO details"><div className="form-grid"><Field label="Proposed name 1" value={form.proposedName1} error={errors.proposedName1} onChange={(value) => updateField('proposedName1', value)} required /><Field label="Proposed name 2" value={form.proposedName2} onChange={(value) => updateField('proposedName2', value)} /><Field label="Proposed name 3" value={form.proposedName3} onChange={(value) => updateField('proposedName3', value)} /><Field label="Email" type="email" value={form.email} error={errors.email} onChange={(value) => updateField('email', value)} required /><Field label="Registered office address" value={form.officeAddress} error={errors.officeAddress} onChange={(value) => updateField('officeAddress', value)} required /><Field label="State" options={NIGERIAN_STATES} value={form.state} error={errors.state} onChange={(value) => updateField('state', value)} required /><Field label="LGA" options={COMMON_LGAS} value={form.lga} error={errors.lga} stateValue={form.state} onChange={(value) => updateField('lga', value)} required /><Field label="City / town / village" value={form.town} error={errors.town} onChange={(value) => updateField('town', value)} required /><Field label="House number" value={form.houseNumber} onChange={(value) => updateField('houseNumber', value)} /><Field label="Street name" value={form.streetName} error={errors.streetName} onChange={(value) => updateField('streetName', value)} required /></div></Step>}
          {step === 2 && <Step title="Constitution"><div className="form-grid"><Field label="Number of trustees (minimum 2)" type="number" min="2" max="20" value={form.trusteeCount} error={errors.trusteeCount} onChange={updateTrusteeCount} required /><Field label="Trustee tenure (years)" type="number" min="1" value={form.trusteeTenure} error={errors.trusteeTenure} onChange={(value) => updateField('trusteeTenure', value)} required /></div><button className="add-trustee-btn" type="button" onClick={addTrustee} disabled={form.trusteeCount >= 20}>+ Add another trustee</button><p className="form-help">The chairman must be entered first, followed by the secretary and any additional trustees.</p></Step>}
          {step === 3 && <Step title="Aims and objectives"><TextArea label="State as many aims and objectives as possible in precise terms" value={form.aims} error={errors.aims} onChange={(value) => updateField('aims', value)} required /></Step>}
          {step === 4 && <Step title="Trustee information"><p className="form-help">Enter the chairman first, followed by the secretary and other trustees. Repeat this section for every trustee.</p>{form.trustees.map((trustee, index) => <TrusteeFields key={index} index={index} trustee={trustee} errors={errors} updateTrustee={updateTrustee} handleTrusteeFile={handleTrusteeFile} />)}</Step>}
          {step === 5 && <Step title="Source of income"><TextArea label="State all sources of income in precise terms" value={form.sourceOfIncome} error={errors.sourceOfIncome} onChange={(value) => updateField('sourceOfIncome', value)} required /></Step>}
          {step === 6 && <Step title="Documents and declaration"><p className="form-help">Every trustee must provide a valid means of ID, signature, and passport. Ensure each file is clear and readable.</p><div className="document-summary">{form.trustees.map((trustee, index) => <div key={index}><p>Trustee {index + 1}: {trustee.idDocument?.name || 'ID not selected'} · {trustee.signature?.name || 'signature not selected'} · {trustee.passport?.name || 'passport not selected'}</p>{['idDocument', 'signature', 'passport'].map((field) => errors[`trustee-${index}-${field}`] && <small className="form-error" key={field}>{field} is required.</small>)}</div>)}</div><label className="checkbox-line"><input type="checkbox" required /> I confirm that the information provided is correct.</label></Step>}
          {step === 7 && <Step title="Review and submit"><Review form={form} /><div className="fee-box"><strong>Registration fee: N150,000</strong><span>Includes registration, one local and one national newspaper publication, trustees' statutory declaration, constitution, meeting filing, and service charges.</span></div>{errors.submit && <p className="form-error">{errors.submit}</p>}</Step>}
          <div className="form-actions">{step > 1 && <button className="secondary-btn" type="button" onClick={previousStep}>Back</button>}{step < TOTAL_STEPS ? <button className="primary-btn" type="button" onClick={nextStep}>Next</button> : <button className="primary-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit application'}</button>}</div>
        </form>
      </section>
    </main>
  );
}

function Step({ title, children }) { return <section className="ngo-step"><h2>{title}</h2>{children}</section>; }
function Field({ label, value, onChange, error, type = 'text', options, stateValue, ...props }) { const { states, lgasByState } = useLocationData(); const fieldRef = useRef(null); const [selectedState, setSelectedState] = useState(stateValue || ''); useEffect(() => { if (stateValue !== undefined) { setSelectedState(stateValue); return undefined; } if (label !== 'LGA' || !fieldRef.current) return undefined; const stateInput = fieldRef.current.closest('.form-grid')?.querySelector('.location-search-trigger'); if (!stateInput) return undefined; const syncState = (event) => setSelectedState(event.detail || stateInput.textContent.replace('▾', '').trim()); syncState({ detail: '' }); stateInput.addEventListener('change', syncState); return () => stateInput.removeEventListener('change', syncState); }, [label, stateValue]); const fieldOptions = label === 'State' ? states : label === 'LGA' ? lgasByState[selectedState] || [] : options; return <label ref={fieldRef} className="field">{label}{props.required && ' *'}{fieldOptions ? (label === 'State' || label === 'LGA' ? <SearchableLocationField label={label} value={value} options={fieldOptions} onChange={onChange} /> : <select value={value ?? ''} onChange={(event) => onChange(event.target.value)}><option value="">Select {label}</option>{fieldOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>) : <input {...props} type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />}{error && <small className="form-error">{error}</small>}</label>; }
function TextArea({ label, value, onChange, error, ...props }) { return <label className="field full-field">{label}{props.required && ' *'}<textarea {...props} value={value} onChange={(event) => onChange(event.target.value)} rows="8" />{error && <small className="form-error">{error}</small>}</label>; }
function TrusteeFields({ index, trustee, errors, updateTrustee, handleTrusteeFile }) { const fields = [['surname', 'Surname'], ['firstName', 'First name'], ['otherName', 'Other name'], ['dateOfBirth', 'Date of birth', 'date'], ['gender', 'Gender'], ['nationality', 'Nationality'], ['phone', 'Phone number'], ['email', 'Email', 'email'], ['occupation', 'Occupation'], ['country', 'Country'], ['state', 'State'], ['lga', 'LGA'], ['town', 'City / town / village'], ['houseNumber', 'House number'], ['streetName', 'Street name'], ['idType', 'ID type'], ['idNumber', 'ID number']]; return <div className="trustee-block"><div className="person-heading"><h3>Trustee {index + 1}{index === 0 ? ' (Chairman first)' : ''}</h3>{index > 1 && <button type="button" className="remove-person" onClick={() => updateTrustee(index, '__remove', true)}>Remove trustee</button>}</div><div className="form-grid">{fields.map(([field, label, type]) => <Field key={field} label={label} type={type || 'text'} options={field === 'gender' ? GENDERS : field === 'state' ? NIGERIAN_STATES : field === 'lga' ? COMMON_LGAS : undefined} stateValue={trustee.state} value={trustee[field]} error={errors[`trustee-${index}-${field}`]} onChange={(value) => updateTrustee(index, field, value)} required={field !== 'otherName' && field !== 'houseNumber'} />)}</div><div className="file-grid">{[['idDocument', 'Means of ID'], ['signature', 'Signature'], ['passport', 'Passport photograph']].map(([field, label]) => <label className="file-upload" key={field}>{label}<input type="file" accept="image/*,.pdf" onChange={(event) => handleTrusteeFile(index, field, event.target.files[0])} /><FilePreview value={trustee[field]} /></label>)}</div></div>; }
function FilePreview({ value }) { if (!value) return null; const isImage = value.type?.startsWith('image/') || value.dataUrl?.startsWith('data:image/'); return <span className="upload-preview">{isImage ? <img src={value.dataUrl} alt={`${value.name} preview`} /> : <span className="upload-file-icon">PDF</span>}<small>{value.name}</small></span>; }
function Review({ form }) { return <div className="review-grid"><p><strong>Names:</strong> {form.proposedName1}, {form.proposedName2}, {form.proposedName3}</p><p><strong>Email:</strong> {form.email}</p><p><strong>Office:</strong> {form.officeAddress}</p><p><strong>Trustees:</strong> {form.trusteeCount}</p><p><strong>Tenure:</strong> {form.trusteeTenure} years</p><p><strong>Aims:</strong> {form.aims}</p><p><strong>Income sources:</strong> {form.sourceOfIncome}</p></div>; }

export default NGORegistrationPage;
