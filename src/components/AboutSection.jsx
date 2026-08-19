import React from 'react';
import '../css/components/AboutSection.css';

function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="app-shell">
        <div className="section-header">
          <h2>About Pernest Digital Services</h2>
          <p>Your best plug for <strong>CAC</strong> and Company Registration</p>
        </div>

        <div className="about-content">
          <div className="about-text">
            <h3>Our Story</h3>
            <p>
              Pernest Digital Services is a professional digital and business support service provider committed to making registration and documentation processes simple, reliable, and accessible. We assist individuals, entrepreneurs, and businesses with services such as <strong>CAC registration</strong>, <strong>SCUML registration</strong>, <strong>Trademark registration</strong>, <strong>NIN services</strong>, and other digital government-related services.

              Our goal is to save our clients time and reduce the stress associated with registration processes by providing fast, transparent, and professional assistance from start to finish.
            </p>
            <p>
              Our team of skilled professionals is dedicated to transforming your ideas into reality. From concept to completion, we ensure every piece meets our rigorous quality standards.
            </p>

            <h3 style={{ marginTop: '30px' }}>Our Values</h3>
            <div className="values-grid">
              <div className="value-item">
                <h4>Integrity</h4>
                <p>We operate with honesty, transparency, and professionalism.</p>
              </div>
              <div className="value-item">
                <h4>Reliability</h4>
                <p>We are committed to delivering dependable services and support.</p>
              </div>
              <div className="value-item">
                <h4>Efficiency</h4>
                <p>We value your time and strive to make every process simple and convenient.</p>
              </div>
               <div className="value-item">
                <h4>Excellence</h4>
                <p>We maintain high standards in every service we provide.</p>
              </div>
              <div className="value-item">
                <h4>Customer Satisfaction</h4>
                <p>Our clients’ needs and satisfaction remain at the heart of what we do.</p>
              </div>
            </div>
          </div>

          <div className="about-stats">
            <div className="stat-card">
              <h4>8+</h4>
              <p>Years of Experience</p>
            </div>
            <div className="stat-card">
              <h4>1000+</h4>
              <p>Satisfied Clients</p>
            </div>
            <div className="stat-card">
              <h4>150+</h4>
              <p>Services Delivered</p>
            </div>
            <div className="stat-card">
              <h4>24/7</h4>
              <p>Customer Support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
