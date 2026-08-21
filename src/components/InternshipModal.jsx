import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faChevronLeft, faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons';
import '../css/components/InternshipModal.css';

function InternshipModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const ads = [
    {
      eyebrow: 'Start your next chapter',
      title: 'Build your business on a solid foundation',
      description: 'From business names to companies and NGOs, get guided registration support without the paperwork confusion.',
      image: '/image/cac.jpg',
      cta: 'Explore CAC registration',
      href: '/business-register'
    },
    {
      eyebrow: 'For entrepreneurs',
      title: 'Register your business name',
      description: 'Turn your idea into a recognized business with a clear, guided application process.',
      image: '/image/cac.jpg',
      cta: 'Register a business',
      href: '/business-register'
    },
    {
      eyebrow: 'For growing teams',
      title: 'Take the next step with a company registration',
      description: 'Get practical support for company details, directors, shareholders, documents, and submission.',
      image: '/image/cac.jpg',
      cta: 'Register a company',
      href: '/company-register'
    },
    {
      eyebrow: 'Make an impact',
      title: 'Give your NGO the right structure',
      description: 'We help you organize the information and documents needed for a smoother NGO registration journey.',
      image: '/image/cac.jpg',
      cta: 'Register an NGO',
      href: '/ngo-register'
    },
    {
      eyebrow: 'Stay compliant',
      title: 'Get your SCUML registration moving',
      description: 'Prepare your entity and compliance information with guided support from start to submission.',
      image: '/image/SCUML.jpg',
      cta: 'Start SCUML registration',
      href: '/scuml-register'
    },
    {
      eyebrow: 'NIN support',
      title: 'Verify your NIN with confidence',
      description: 'Request NIN verification using a simple, guided process and get the support you need.',
      image: '/image/nin.jpg',
      cta: 'Start NIN verification',
      href: '/nin-verify'
    },
    {
      eyebrow: 'NIN support',
      title: 'Update your name on your NIN record',
      description: 'Submit the details needed for a smoother NIN change-of-name support request.',
      image: '/image/nin.jpg',
      cta: 'Start name change',
      href: '/nin-name-change'
    },
    {
      eyebrow: 'NIN support',
      title: 'Correct your date of birth',
      description: 'Get guided support for your NIN date-of-birth correction request and documentation.',
      image: '/image/nin.jpg',
      cta: 'Start date change',
      href: '/nin-date-of-birth-change'
    },
  ];

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % ads.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isOpen, ads.length]);

  const handleRegister = (href) => {
    onClose();
    navigate(href);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="internship-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close registration offers">
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </button>

        <div className="modal-ad-visual">
          <img src={ads[currentSlide].image} alt="" aria-hidden="true" />
          <span className="modal-slide-count">{String(currentSlide + 1).padStart(2, '0')} / {String(ads.length).padStart(2, '0')}</span>
          <div className="modal-ad-shade" />
          <span className="modal-brand-mark">PERNEST <strong>DIGITAL</strong> SERVICES</span>
        </div>

        <div className="modal-content">
          <p className="modal-eyebrow">{ads[currentSlide].eyebrow}</p>
          <h1>{ads[currentSlide].title}</h1>
          <p className="modal-subtitle">{ads[currentSlide].description}</p>
          <div className="modal-footer">
            <button className="btn-primary-large" onClick={() => handleRegister(ads[currentSlide].href)}>
              {ads[currentSlide].cta} <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </button>
            <button className="btn-secondary-modal" onClick={onClose}>Maybe later</button>
          </div>
          <div className="modal-slider-controls">
            <button type="button" className="modal-arrow" onClick={() => setCurrentSlide((slide) => (slide - 1 + ads.length) % ads.length)} aria-label="Previous offer">
              <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
            </button>
            <div className="modal-dots" aria-label="Registration offers">
              {ads.map((ad, index) => <button type="button" key={ad.href + index} className={index === currentSlide ? 'active' : ''} onClick={() => setCurrentSlide(index)} aria-label={`Show offer ${index + 1}`} />)}
            </div>
            <button type="button" className="modal-arrow" onClick={() => setCurrentSlide((slide) => (slide + 1) % ads.length)} aria-label="Next offer">
              <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InternshipModal;
