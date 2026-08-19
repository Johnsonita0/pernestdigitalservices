import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import HeroSlider from '../components/HeroSlider.jsx';
import AboutSection from '../components/AboutSection.jsx';
import ServicesSection from '../components/ServicesSection.jsx';
import TeamSection from '../components/TeamSection.jsx';
import ClientTestimonial from '../components/ClientTestimonial.jsx';
import FAQSection from '../components/FAQSection.jsx';
import ContactSection from '../components/ContactSection.jsx';
import Footer from '../components/Footer.jsx';

function HomePage() {
  const [contactFormVisible, setContactFormVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [whatsappTip, setWhatsappTip] = useState('Need Branded Tees?');
  const [showWhatsappTip, setShowWhatsappTip] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero');
      const heroHeight = heroSection ? heroSection.offsetHeight : 480;
      setShowScrollTop(window.scrollY > heroHeight);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const messages = [
      'Need CAC Registration?',
      'Need NIN Support?',
      'SCUML Registration?',
      'Protect Your Brand?',
      'Need an Export License?',
      'Business Documentation?',
      'Registration Questions?',
      'Professional Guidance?',
      'Chat With Us!',
      'Get Started Today!'
    ];
    let index = 0;

    const cycleTip = () => {
      setWhatsappTip(messages[index]);
      setShowWhatsappTip(true);
      index = (index + 1) % messages.length;

      // Show for 4 seconds
      const hideTimer = window.setTimeout(() => {
        setShowWhatsappTip(false);
      }, 4000);

      // Come back after 3 seconds (4s shown + 3s hidden = 7s total cycle)
      const showTimer = window.setTimeout(() => {
        cycleTip();
      }, 7000);

      return () => {
        window.clearTimeout(hideTimer);
        window.clearTimeout(showTimer);
      };
    };

    // Start the cycle after a short delay
    const initialTimer = window.setTimeout(() => {
      cycleTip();
    }, 500);

    return () => window.clearTimeout(initialTimer);
  }, []);

  const handleHeroContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="page-content">
      <Navbar />
      <div id="hero">
        <HeroSlider onContactClick={handleHeroContact} />
      </div>
      <div id="about">
        <AboutSection />
      </div>
      <div id="services">
        <ServicesSection />
      </div>
      <div id="team">
        <TeamSection />
      </div>
      <div id="testimonials">
        <ClientTestimonial />
      </div>
      <div id="faq">
        <FAQSection />
      </div>
      <div id="contact">
        <ContactSection />
      </div>
      <Footer />

      <div className={`floating-actions${showScrollTop ? '' : ' floating-actions-single'}`}>
        <div className="floating-whatsapp-wrap">
          {showWhatsappTip && <span className="whatsapp-tip">{whatsappTip}</span>}
          <a
            href="https://wa.me/2348130801666?text=Hello%20Pernest%20Digital%20Services%2C%20I%20want%20to%20chat%20with%20you."
            className="floating-whatsapp"
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 18.5c-.44 0-.8-.12-1.08-.37A1.42 1.42 0 0 1 3.5 16.9V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v10.4a1.42 1.42 0 0 1-.42 1.03c-.28.25-.64.37-1.08.37H8.5l-3.5 3v-3H5Zm3.25-7.5h7.5a1.25 1.25 0 0 0 0-2.5h-7.5a1.25 1.25 0 0 0 0 2.5Zm0 3.5h5.5a1.25 1.25 0 0 0 0-2.5h-5.5a1.25 1.25 0 0 0 0 2.5Z"/>
            </svg>
          </a>
        </div>

        {showScrollTop && (
          <button
            type="button"
            className="floating-scroll-top"
            onClick={handleScrollToTop}
            aria-label="Scroll to top"
          >
            ↑
          </button>
        )}
      </div>
    </main>
  );
}

export default HomePage;
