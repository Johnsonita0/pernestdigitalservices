import React, { useState } from 'react';
import { saveContactMessage } from '../lib/supabaseClient';
import '../css/pages/EventRegistrationPage.css';

function EventRegistrationPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', eventName: '', eventDate: '', attendees: '', notes: '' });
  const [status, setStatus] = useState('idle');

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    try {
      const { error } = await saveContactMessage({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      subject: `Event registration: ${form.eventName}`,
      message: `Event date: ${form.eventDate || 'To be confirmed'}\nExpected attendees: ${form.attendees || 'Not provided'}\nNotes: ${form.notes || 'None'}`,
      status: 'new',
      });
      if (error) {
        setStatus('error');
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: error.message || 'Unable to submit your event request. Please try again.', type: 'error' } }));
        return;
      }
      setStatus('success');
    } catch (error) {
      setStatus('error');
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: error.message || 'Unable to submit your event request. Please try again.', type: 'error' } }));
    }
  };

  if (status === 'success') {
    return <main className="event-page"><section className="event-card event-success"><p className="event-kicker">Request received</p><h1>We will be in touch shortly.</h1><p>Our team has received your event registration request and will contact you with the next steps.</p><a className="event-button" href="/">Return to website</a></section></main>;
  }

  return (
    <main className="event-page">
      <section className="event-card">
        <p className="event-kicker">PERNEST DIGITAL SERVICES</p>
        <h1>Event Registration</h1>
        <p className="event-intro">Tell us about your event and we will help you plan the right support.</p>
        <form className="event-form" onSubmit={submit} onKeyDown={(event) => { if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') event.preventDefault(); }}>
          <label>Full name *<input name="name" value={form.name} onChange={update} required /></label>
          <label>Email address *<input name="email" type="email" value={form.email} onChange={update} required /></label>
          <label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} /></label>
          <label>Event name *<input name="eventName" value={form.eventName} onChange={update} required /></label>
          <label>Event date<input name="eventDate" type="date" value={form.eventDate} onChange={update} /></label>
          <label>Expected attendees<input name="attendees" type="number" min="1" value={form.attendees} onChange={update} /></label>
          <label className="event-full-field">Notes<textarea name="notes" rows="4" value={form.notes} onChange={update} /></label>
          {status === 'error' && <p className="event-error">Something went wrong. Please try again.</p>}
          <button className="event-button" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Submitting...' : 'Submit event request'}</button>
        </form>
      </section>
    </main>
  );
}

export default EventRegistrationPage;
