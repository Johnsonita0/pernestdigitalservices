import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getDeviceType, updateApplicationForEdit } from '../lib/supabaseClient';
import '../css/components/ApplicationEditForm.css';

const blockedFields = new Set(['id', 'reference_number', 'application_type', 'application', 'created_at', 'updated_at', 'status', 'payment_slip', 'registration_documents', 'edit_history']);

const labelFor = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

function ApplicationEditForm({ application, applicationType, identifier = '', isAdmin = false, onSaved, onCancel }) {
  const record = application?.application && application?.application_type ? application.application : application;
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValues(Object.fromEntries(Object.entries(record || {}).filter(([key]) => !blockedFields.has(key))));
  }, [record]);

  const updateValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value];
      if (value.trim() === '') return [key, null];
      if (['trustees', 'witness', 'directors', 'shareholders', 'proprietors', 'persons'].includes(key)) {
        try { return [key, JSON.parse(value)]; } catch { return [key, value]; }
      }
      return [key, value];
    }));
    const result = await updateApplicationForEdit(record.reference_number, identifier, changes, record.id, isAdmin ? 'Administrator' : 'Client', getDeviceType());
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onSaved?.(result.data?.application || result.data);
  };

  return <form className="application-edit-form" onSubmit={submit} onKeyDown={(event) => { if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') event.preventDefault(); }}>
    <div className="application-edit-heading"><div><p className="application-edit-kicker">{isAdmin ? 'Administrator edit' : 'Correct your submission'}</p><h2>Edit {applicationType}</h2><p>Update the information below and resubmit the existing application.</p></div><button type="button" className="application-edit-close" onClick={onCancel} aria-label="Cancel editing" title="Cancel"><FontAwesomeIcon icon={faXmark} /></button></div>
    <div className="application-edit-grid">
      {Object.entries(values).map(([key, value]) => {
        const jsonField = typeof value === 'object' && value !== null;
        const inputType = key.includes('date') ? 'date' : key === 'email' ? 'email' : 'text';
        return <label className={jsonField ? 'application-edit-field application-edit-field-wide' : 'application-edit-field'} key={key}><span>{labelFor(key)}</span>{jsonField ? <textarea value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)} onChange={(event) => updateValue(key, event.target.value)} rows="7" /> : <input type={inputType} value={value ?? ''} onChange={(event) => updateValue(key, event.target.value)} />}</label>;
      })}
    </div>
    {error && <p className="application-edit-error" role="alert">{error}</p>}
    <div className="application-edit-actions"><button type="button" className="application-edit-cancel" onClick={onCancel}>Cancel</button><button type="submit" className="application-edit-save" disabled={busy}><FontAwesomeIcon icon={faFloppyDisk} /> {busy ? 'Saving...' : 'Save and resubmit'}</button></div>
  </form>;
}

export default ApplicationEditForm;