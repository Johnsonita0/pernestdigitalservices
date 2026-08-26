import React, { useState } from 'react';
import '../css/components/ContactSection.css';
import { saveContactMessage } from '../lib/supabaseClient';

function ContactSection() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState('idle');

  const showToast = (message, type = 'success') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message, type, duration: 4000 },
        })
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      const { error } = await saveContactMessage({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        subject: form.subject || 'General Inquiry',
        message: form.message,
        status: 'new',
      });

      if (error) {
        throw error;
      }

      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      showToast('Thank you! Your message has been sent successfully.', 'success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      showToast('Failed to send message. Please try again.', 'error');
      console.error('Contact form error:', err);
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="app-shell">
        <div className="section-header">
          <h2>Get In Touch</h2>
          <p>Have a question or ready to place an order? We'd love to hear from you.</p>
        </div>

        <div className="contact-container">
          <div className="contact-info">
            <div className="info-card">
              <h3>📍 Address</h3>
              <p>No. 33b Afaha Eket Road, Eket<br />Akwa Ibom State, Nigeria</p>
            </div>

            <div className="info-card">
              <h3>📞 Phone</h3>
              <p>
                <a href="tel:+2348130801666">+234 (0) 813 080 1666</a>
              </p>
            </div>

            <div className="info-card">
              <h3>✉️ Email</h3>
              <p>
                <a href="mailto:info@pernestdigitalservices.com">info@pernestdigitalservices.com</a><br />
                <a href="mailto:orders@pernestdigitalservices.com">orders@pernestdigitalservices.com</a>
              </p>
            </div>

            <div className="info-card">
              <h3>🕐 Hours</h3>
              <p>
                Mon - Fri: 9:00 AM - 6:00 PM<br />
                Saturday: 10:00 AM - 4:00 PM<br />
                Sunday: Closed
              </p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} onKeyDown={(event) => { if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') event.preventDefault(); }}>
            <h3>Send us a Message</h3>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0803 000 0000"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="What is this about?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your project or inquiry..."
                rows="5"
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
