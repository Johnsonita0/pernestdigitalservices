import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import '../css/components/Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer-professional">
      <div className="footer-content">
        <div className="footer-section">
          <a href="/" className="footer-logo" aria-label="Go to home page">
            <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="logo-image" />
            <h3>Pernest Digital Services</h3>
          </a>
          <p className="footer-description">
            We are a professional digital and business support service provider committed to making registration and documentation processes simple, reliable, and accessible. Our services include CAC registration, SCUML registration, Trademark registration, NIN services, and other digital government-related services.
          </p>
          <div className="social-links">
            <a href="#" title="Facebook" aria-label="Facebook" className="social-icon fb">
              <FontAwesomeIcon icon={faFacebookF} aria-hidden="true" />
            </a>
            <a href="#" title="Twitter" aria-label="Twitter" className="social-icon tw">
              <FontAwesomeIcon icon={faXTwitter} aria-hidden="true" />
            </a>
            <a href="#" title="Instagram" aria-label="Instagram" className="social-icon ig">
              <FontAwesomeIcon icon={faInstagram} aria-hidden="true" />
            </a>
            <a href="https://wa.me/2348130801666" title="WhatsApp" aria-label="WhatsApp" className="social-icon wa">
              <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#services">Services</a></li>
            <li><a href="#team">Our Team</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#contact">Contact</a></li>
            {/* <li><a href="#internship">Internship</a></li> */}
          </ul>
        </div>

        <div className="footer-section">
          <h4>Services</h4>
          <ul>
            <li><a href="#services">CAC Registration</a></li>
            <li><a href="#services">SCUML Registration</a></li>
            <li><a href="#services">Trademark Registration</a></li>
            <li><a href="#services">NIN Services</a></li>
            <li><a href="#services">Other Digital Government Services</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Info</h4>
          <ul>
            <li>
              <strong>Address:</strong><br />
              No. 33b Afaha Eket Road, Eket<br />
              Akwa Ibom State
            </li>
            <li>
              <strong>Phone:</strong><br />
              <a href="tel:+2348130801666">+234 (0) 813 080 1666</a>
            </li>
            <li>
              <strong>Email:</strong><br />
              <a href="mailto:info@pernestdigitalservices.com">info@pernestdigitalservices.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} Pernest Digital Services. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
