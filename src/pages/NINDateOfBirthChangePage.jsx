import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitNINDateChange } from '../lib/supabaseClient';
import { GENDERS, MARITAL_STATUSES } from '../data/nigeriaLocations';
import { useLocationData } from '../lib/locationData';
import SearchableLocationField from '../components/SearchableLocationField';
import '../css/pages/NINVerificationPage.css';

const initialForm = {
  nin: '', surname: '', firstName: '', middleName: '', gender: '', oldDateOfBirth: '', newDateOfBirth: '', maritalStatus: '', stateOfOrigin: '', lgaOfOrigin: '', townOfOrigin: '', phone: '', stateOfBirth: '', lgaOfBirth: '', stateOfResidence: '', lgaOfResidence: '', residentialAddress: '', education: '', occupation: '', workAddress: '', fatherSurname: '', fatherFirstName: '', fatherState: '', fatherLga: '', fatherTown: '', motherSurname: '', motherFirstName: '', motherMaidenName: '', motherState: '', motherLga: '', motherTown: '', email: ''
};

function NINDateOfBirthChangePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { states, lgasByState } = useLocationData();
  const NIGERIAN_STATES = states;
  const COMMON_LGAS = [];
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateLocation = (field, value) => setForm((current) => ({
    ...current,
    [field]: value,
    ...(field.endsWith('State') || field === 'stateOfOrigin' ? { [field.replace('State', 'Lga').replace('stateOfOrigin', 'lgaOfOrigin')]: '' } : {}),
  }));
  const submit = async (event) => {
    event.preventDefault();
    const required = ['nin', 'surname', 'firstName', 'gender', 'oldDateOfBirth', 'newDateOfBirth', 'maritalStatus', 'stateOfOrigin', 'lgaOfOrigin', 'townOfOrigin', 'phone', 'stateOfBirth', 'lgaOfBirth', 'stateOfResidence', 'lgaOfResidence', 'residentialAddress', 'education', 'occupation', 'fatherSurname', 'fatherFirstName', 'fatherState', 'fatherLga', 'fatherTown', 'motherSurname', 'motherFirstName', 'motherMaidenName', 'motherState', 'motherLga', 'motherTown', 'email'];
    if (required.some((field) => !String(form[field] || '').trim())) { setError('Please complete all required fields.'); return; }
    const reference = `NIN-DOB-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { error: submitError } = await submitNINDateChange({ reference_number: reference, ...form, status: 'pending', created_at: new Date().toISOString() });
    if (submitError) setError(submitError.message); else setSubmitted(reference);
  };
  if (submitted) return <main className="nin-page"><section className="nin-card nin-success"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /><p className="nin-kicker">Request received</p><h1>Date of birth change request submitted</h1><p>Your reference number is <strong>{submitted}</strong>. Our team will contact you using the details provided.</p><button className="nin-primary" type="button" onClick={() => navigate('/')}>Return to website</button></section></main>;
  return <main className="nin-page"><section className="nin-card"><header className="nin-header"><a href="/" aria-label="Go to home page"><img src="/logo/logo2.jpeg" alt="Pernest Digital Services" /></a><p>PERNEST DIGITAL ENTERPRISE</p><h1>NIN Change of Date of Birth</h1><span>Complete the applicant, additional, and parent information accurately.</span></header><form onSubmit={submit}><Section title="Particulars of applicant"><div className="nin-grid">{fields([['nin','NIN Number'],['surname','Surname'],['firstName','First Name'],['middleName','Middle Name','text',false],['gender','Gender','text',true,GENDERS],['oldDateOfBirth','Old Date of Birth','date'],['newDateOfBirth','New Date of Birth','date'],['maritalStatus','Marital Status','text',true,MARITAL_STATUSES],['stateOfOrigin','State of Origin','text',true,NIGERIAN_STATES],['lgaOfOrigin','LGA of Origin','text',true,COMMON_LGAS],['townOfOrigin','Town / Village of Origin'],['phone','Phone Number']])}</div></Section><Section title="Additional information"><div className="nin-grid">{fields([['stateOfBirth','State of Birth','text',true,NIGERIAN_STATES],['lgaOfBirth','LGA of Birth','text',true,COMMON_LGAS],['stateOfResidence','State of Residence','text',true,NIGERIAN_STATES],['lgaOfResidence','LGA of Residence','text',true,COMMON_LGAS],['residentialAddress','Residential Address'],['education','Highest Level of Education'],['occupation','Occupation'],['workAddress','Address of Place of Work']])}</div></Section><Section title="Parent's information"><div className="nin-grid">{fields([['fatherSurname',"Father's Surname"],['fatherFirstName',"Father's First Name"],['fatherState',"Father's State of Origin",'text',true,NIGERIAN_STATES],['fatherLga',"Father's LGA of Origin",'text',true,COMMON_LGAS],['fatherTown',"Father's Village/Town"],['motherSurname',"Mother's Surname"],['motherFirstName',"Mother's First Name"],['motherMaidenName',"Mother's Maiden Name"],['motherState',"Mother's State of Origin",'text',true,NIGERIAN_STATES],['motherLga',"Mother's LGA of Origin",'text',true,COMMON_LGAS],['motherTown',"Mother's Village/Town"]])}</div></Section>{error && <p className="nin-error">{error}</p>}<div className="nin-actions"><button className="nin-primary" type="submit">Submit date change request</button></div></form></section></main>;
  function fields(items) { return items.map(([field, label, type = 'text', required = true, options]) => { const isState = field.endsWith('State') || field === 'stateOfOrigin'; const isLga = field.endsWith('Lga') || field === 'lgaOfOrigin'; const stateField = field === 'lgaOfOrigin' ? 'stateOfOrigin' : field.replace('Lga', 'State'); const fieldOptions = isState ? states : isLga ? lgasByState[form[stateField]] || [] : options; return <Field key={field} label={label} type={type} value={form[field]} options={fieldOptions} onChange={(value) => (isState ? updateLocation(field, value) : update(field, value))} required={required} />; }); }
}
function Section({ title, children }) { return <section className="nin-section"><h2>{title}</h2>{children}</section>; }
function Field({ label, value, onChange, type = 'text', required = false, options }) { return <label className="nin-field">{label}{required && ' *'}{options ? (label.includes('State') || label.includes('LGA') ? <SearchableLocationField label={label} value={value} options={options} onChange={onChange} /> : <select value={value || ''} onChange={(event) => onChange(event.target.value)}><option value="">Select {label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>) : <input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} />}</label>; }
export default NINDateOfBirthChangePage;
