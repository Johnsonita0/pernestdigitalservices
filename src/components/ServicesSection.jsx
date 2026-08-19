import React from 'react';
import '../css/components/ServicesSection.css';

function ServicesSection() {
  const services = [
    {
      id: 1,
      title: 'CAC services',
      description: [
        'Business Name Registration',
        'Company Name Registration',
        'NGO registration for churches, associations, ministries, clubs, alumni organizations, and foundations',
        'Annual return payment',
        'Change of business or company name',
        'Change of company director or shareholder',
        'Change of NGO trustee'
      ],
      image: '/image/cac.jpg'
    },
    {
      id: 2,
      title: 'NIN Services',
      description: [
        'Change of name',
        'Change of date of birth',
        'Change of address',
        'Change of phone number',
        'NIN verification'
      ],
      image: '/image/nin.jpg'
    },
    {
      id: 3,
      title: 'SCUML Registration',
      description: 'We assist with the registration of your business with the Special Control Unit Against Money Laundering (SCUML), ensuring compliance with anti-money laundering regulations.',
      image: '/image/SCUML.jpg'
    },
    {
      id: 4,
      title: 'Trademark Registration',
      description: 'Protect your brand and intellectual property with our trademark registration services. We guide you through the process to secure your unique identity in the market.',
      image: '/image/Trademark.jpg'
    },
     {
      id: 5,
      title: 'Export License Registration',
      description: 'We help businesses obtain the necessary export licenses to legally export goods and services. Our team ensures that your business meets all regulatory requirements for international trade.',
      image: '/image/Export.jpg'
    }
  ];

  return (
    <section className="services-section" id="services">
      <div className="app-shell">
        <div className="section-header">
          <h2>What We Offer</h2>
          <p>We provide a range of professional services, including:</p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              {service.image ? (
                <img className="service-image" src={service.image} alt={`${service.title} service`} />
              ) : (
                <div className="service-icon">{service.icon}</div>
              )}
              <h3>{service.title}</h3>
              {Array.isArray(service.description) ? (
                <ul className="service-list">
                  {service.description.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{service.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
