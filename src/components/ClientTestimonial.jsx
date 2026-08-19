import React, { useState } from 'react';
import '../css/components/ClientTestimonial.css';
import { saveTestimonial } from '../lib/supabaseClient';

function ClientTestimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      name: 'Chioma Okafor',
      company: 'Fashion Hub Lagos',
      rating: 5,
      message: 'Working with T-Shirts Village has been an incredible experience. Their quality and professionalism are unmatched. Highly recommended!',
      image: '👩‍💼'
    },
    {
      id: 2,
      name: 'Tunde Adeyemi',
      company: 'AdeyemiCorp Events',
      rating: 5,
      message: 'The custom designs exceeded our expectations. The internship program trained their team to perfection. Truly outstanding service!',
      image: '👨‍💼'
    },
    {
      id: 3,
      name: 'Amara Nwankwo',
      company: 'Style Collective',
      rating: 5,
      message: 'Best T-shirt vendor in Nigeria! Their attention to detail and customer service is exceptional. We order from them regularly.',
      image: '👩‍💼'
    },
    {
      id: 4,
      name: 'Chidi Eze',
      company: 'Events & Co',
      rating: 5,
      message: 'From design to delivery, everything was seamless. The quality is premium and pricing is fair. Five stars definitely!',
      image: '👨‍💼'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    rating: 5,
    message: ''
  });

  const [showForm, setShowForm] = useState(false);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const showToast = (message, type = 'success') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message, type, duration: 4000 },
        })
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.company.trim() || !formData.message.trim()) {
      showToast('Please complete all required testimonial fields.', 'error');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        company: formData.company,
        rating: Number(formData.rating),
        message: formData.message,
        status: 'new',
      };

      const { data, error } = await saveTestimonial(payload);

      if (error) {
        throw error;
      }

      const newTestimonial = {
        id: data?.id || testimonials.length + 1,
        ...payload,
        image: formData.message.toLowerCase().includes('great') ? '👩‍💼' : '👨‍💼'
      };

      setTestimonials((prev) => [...prev, newTestimonial]);
      setFormData({ name: '', company: '', rating: 5, message: '' });
      setShowForm(false);
      showToast('Thank you! Your testimonial has been submitted successfully.', 'success');
    } catch (error) {
      console.error('Testimonial submission error:', error);
      showToast('We could not submit your testimonial right now. Please try again.', 'error');
    }
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="client-testimonial-section" id="testimonials">
      <div className="app-shell">
        <div className="section-header">
          <h2>Clients Love Us</h2>
          <p>Real feedback from our satisfied clients and partners</p>
        </div>

        <div className="testimonial-container">
          <div className="testimonial-slider">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-image">{currentTestimonial.image}</div>
                <div className="testimonial-info">
                  <h3>{currentTestimonial.name}</h3>
                  <p className="company">{currentTestimonial.company}</p>
                  <div className="stars">
                    {[...Array(currentTestimonial.rating)].map((_, i) => (
                      <span key={i} className="star">⭐</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="testimonial-message">"{currentTestimonial.message}"</p>
            </div>

            <div className="slider-controls">
              <button className="slider-btn prev" onClick={handlePrevious}>
                ❮
              </button>
              <div className="slider-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
              <button className="slider-btn next" onClick={handleNext}>
                ❯
              </button>
            </div>
          </div>

          <div className="testimonial-form-section">
            {!showForm ? (
              <div className="form-prompt">
                <h3>Share Your Experience</h3>
                <p>Help others learn about our amazing service</p>
                <button className="btn-add-testimonial" onClick={() => setShowForm(true)}>
                  ✍️ Write a Testimonial
                </button>
              </div>
            ) : (
              <form className="testimonial-form" onSubmit={handleSubmit}>
                <h3>Share Your Feedback</h3>
                
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company/Organization *</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleFormChange}
                    placeholder="Your company"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rating">Rating</label>
                  <select
                    id="rating"
                    name="rating"
                    value={formData.rating}
                    onChange={handleFormChange}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                    <option value="4">⭐⭐⭐⭐ Very Good</option>
                    <option value="3">⭐⭐⭐ Good</option>
                    <option value="2">⭐⭐ Fair</option>
                    <option value="1">⭐ Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Your Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    placeholder="Tell us about your experience..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    Submit Review
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="testimonial-stats">
          <div className="stat">
            <h4>{testimonials.length}+</h4>
            <p>Happy Clients</p>
          </div>
          <div className="stat">
            <h4>5.0</h4>
            <p>Average Rating</p>
          </div>
          <div className="stat">
            <h4>100%</h4>
            <p>Satisfaction Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClientTestimonial;
