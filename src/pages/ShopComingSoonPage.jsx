import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faGem, faGlobeEurope, faShirt } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar.jsx';
import '../css/pages/ShopComingSoonPage.css';

const shopFeatures = [
  {
    icon: faShirt,
    title: 'Italian wear',
    text: 'Statement pieces and refined everyday styles selected for a confident wardrobe.'
  },
  {
    icon: faGem,
    title: 'Boutique finds',
    text: 'Thoughtful accessories and beautiful essentials for gifting, dressing, and living well.'
  },
  {
    icon: faGlobeEurope,
    title: 'Curated arrivals',
    text: 'Fresh collections sourced with an eye for quality, character, and timeless appeal.'
  }
];

function ShopComingSoonPage() {
  return (
    <main className="shop-coming-page">
      <Navbar />
      <section className="shop-coming-hero">
        <div className="shop-coming-copy">
          <Link to="/" className="shop-back-link">
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
            Back to Pernest Digital Services
          </Link>
          <p className="shop-kicker">A new Pernest experience</p>
          <h1>The boutique is almost ready.</h1>
          <p className="shop-lead">
            We are preparing a beautiful online home for Italian wears and carefully chosen boutique products.
          </p>
          <div className="shop-launch-note">
            <span className="shop-launch-dot" />
            <span><strong>Coming soon</strong> to your wardrobe and everyday life</span>
          </div>
          <a
            className="shop-interest-button"
            href="https://wa.me/2348130801666?text=Hello%20Pernest%20Digital%20Services%2C%20I%20would%20like%20to%20know%20when%20the%20boutique%20shop%20launches."
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={faBell} aria-hidden="true" />
            Notify me at launch
          </a>
        </div>

        <div className="shop-illustration" aria-label="Illustration of the Pernest boutique coming soon" role="img">
          <div className="shop-sun" />
          <div className="shop-cloud shop-cloud-one" />
          <div className="shop-cloud shop-cloud-two" />
          <div className="shop-building">
            <div className="shop-roof"><span>PER</span>NEST <small>BOUTIQUE</small></div>
            <div className="shop-awning"><span /><span /><span /><span /><span /><span /></div>
            <div className="shop-window shop-window-left"><i>ITALIAN</i><strong>WEAR</strong></div>
            <div className="shop-door"><span>SOON</span></div>
            <div className="shop-window shop-window-right"><i>CURATED</i><strong>FINDS</strong></div>
          </div>
          <div className="shop-plant shop-plant-left"><span /><i /><i /><i /></div>
          <div className="shop-plant shop-plant-right"><span /><i /><i /><i /></div>
          <div className="shop-ground" />
        </div>
      </section>

      <section className="shop-features" aria-labelledby="shop-features-title">
        <div className="shop-section-heading">
          <p className="shop-kicker">What is coming</p>
          <h2 id="shop-features-title">A little more style, selected with intention.</h2>
        </div>
        <div className="shop-feature-grid">
          {shopFeatures.map((feature) => (
            <article className="shop-feature" key={feature.title}>
              <span className="shop-feature-icon"><FontAwesomeIcon icon={feature.icon} aria-hidden="true" /></span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default ShopComingSoonPage;