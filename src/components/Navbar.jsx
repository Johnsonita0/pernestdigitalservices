import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBagShopping, faXmark } from '@fortawesome/free-solid-svg-icons';
import '../css/components/Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const scrollToSection = (sectionId) => {
    setMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <a href="/" className="navbar-logo" aria-label="Go to home page">
          <img src="/logo/logo1.jpeg" alt="Pernest Digital Services" className="logo-img" />
        </a>

        {/* Menu Button */}
        <button className="nav-menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} aria-hidden="true" />
        </button>

        {/* Nav Links */}
        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <li>
            <button onClick={() => scrollToSection('hero')}>Home</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('about')}>About</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('services')}>Services</button>
          </li>
          <li className="nav-registration">
            <button onClick={() => setRegistrationOpen((open) => !open)} aria-expanded={registrationOpen}>
              Registration
            </button>
            <ul className={`registration-dropdown ${registrationOpen ? 'open' : ''}`}>
              <li>
                <Link to="/ngo-register" onClick={() => { setRegistrationOpen(false); setMenuOpen(false); }}>
                  NGO Registration
                </Link>
              </li>
              <li>
                <Link to="/company-register" onClick={() => { setRegistrationOpen(false); setMenuOpen(false); }}>
                  Company Registration
                </Link>
              </li>
              <li>
                <Link to="/business-register" onClick={() => { setRegistrationOpen(false); setMenuOpen(false); }}>
                  Business Registration
                </Link>
              </li>
              <li>
                <Link to="/scuml-register" onClick={() => { setRegistrationOpen(false); setMenuOpen(false); }}>
                  SCUML Registration
                </Link>
              </li>
              <li>
                <Link to="/nin-verify" onClick={() => { setRegistrationOpen(false); setMenuOpen(false); }}>
                  NIN Verification
                </Link>
              </li>
              <li>
                <Link to="/nin-name-change" onClick={() => { setRegistrationOpen(false); setMenuOpen(false); }}>
                  NIN Change of Name
                </Link>
              </li>
              <li>
                <Link to="/nin-date-of-birth-change" onClick={() => { setRegistrationOpen(false); setMenuOpen(false); }}>
                  NIN Date of Birth Change
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <button onClick={() => scrollToSection('contact')}>Contact</button>
          </li>
          <li className="nav-divider"></li>
          <li className="nav-shop">
            <Link to="/shop" onClick={() => setMenuOpen(false)} className="shop-link">
              <FontAwesomeIcon icon={faBagShopping} aria-hidden="true" />
              <span>Shop Now</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
