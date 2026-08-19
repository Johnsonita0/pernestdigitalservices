import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBagShopping, faXmark } from '@fortawesome/free-solid-svg-icons';
import '../css/components/Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleShopClick = () => {
    setMenuOpen(false);
    window.location.href = '#shop';
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
          <li>
            <button onClick={() => scrollToSection('team')}>Team</button>
          </li>
          <li>
            <button onClick={() => scrollToSection('contact')}>Contact</button>
          </li>
          <li className="nav-divider"></li>
          <li className="nav-shop">
            <button onClick={handleShopClick} className="shop-link">
              <FontAwesomeIcon icon={faBagShopping} aria-hidden="true" />
              <span>Shop Now</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
