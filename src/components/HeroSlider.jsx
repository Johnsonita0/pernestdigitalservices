import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '../css/components/HeroSlider.css';

function HeroSlider({ onContactClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Professional Support for Your Business',
      description: 'Pernest Digital Services makes registration and documentation simple, reliable, and accessible for individuals, entrepreneurs, and businesses.',
      image: '/image/cac.jpg',
      cta: 'Explore Our Services'
    },  
    {
      id: 2,
      title: 'NIN Services Without the Stress',
      description: 'Get help with name, date of birth, address, phone number changes, and NIN verification through a simple process.',
      image: '/image/nin.jpg',
      cta: 'Explore NIN Services'
    },
    {
      id: 3,
      title: 'SCUML Registration Support',
      description: 'We help your business meet anti-money laundering compliance requirements through a clear SCUML registration process.',
      image: '/image/SCUML.jpg',
      cta: 'Explore SCUML Services'
    },
    {
      id: 4,
      title: 'Compliance and Brand Protection',
      description: 'From SCUML compliance to trademark registration, we help you protect your business and operate with confidence.',
      image: '/image/Trademark.jpg',
      cta: 'See Compliance Services'
    },
    {
      id: 5,
      title: 'Ready Your Business for Growth',
      description: 'Get export license support and practical regulatory guidance as you prepare to take your goods and services to new markets.',
      image: '/image/Export.jpg',
      cta: 'View Export Services'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleCtaClick = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      onContactClick();
    }
  };

  return (
    <section className="hero-slider">
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slider-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img className="slider-image" src={slide.image} alt="" aria-hidden="true" />
            <div className="slider-overlay" />
            <div className="slider-content">
              <h1 className="slider-title">{slide.title}</h1>
              <p className="slider-description">{slide.description}</p>
              <button className="slider-cta" onClick={handleCtaClick}>
                {slide.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button className="slider-arrow prev-arrow" onClick={prevSlide} aria-label="Previous slide">
        <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
      </button>
      <button className="slider-arrow next-arrow" onClick={nextSlide} aria-label="Next slide">
        <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
      </button>

      {/* Dots */}
      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroSlider;
