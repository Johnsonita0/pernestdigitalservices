import React, { useState } from 'react';
import '../css/components/FAQSection.css';

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      id: 1,
      question: 'What services do you provide?',
      answer: 'We provide CAC registration, NIN services, SCUML registration, trademark registration, export license registration, and other business documentation support.'
    },
    {
      id: 2,
      question: 'Can you help register my business or company?',
      answer: 'Yes. We assist with business name, company, NGO, and foundation registration, as well as annual returns and approved changes to business records.'
    },
    {
      id: 3,
      question: 'Do you assist with NIN updates and verification?',
      answer: 'Yes. We assist with changes to names, dates of birth, addresses, and phone numbers, as well as NIN verification.'
    },
    {
      id: 4,
      question: 'What compliance and brand-protection services do you offer?',
      answer: 'We provide SCUML registration support and trademark registration guidance to help businesses meet requirements and protect their brands.'
    },
    {
      id: 5,
      question: 'Do you assist with export license registration?',
      answer: 'Yes. We help businesses prepare for international trade by providing export license registration support and regulatory guidance.'
    },
    {
      id: 6,
      question: 'When is customer care available?',
      answer: 'Our customer care team is available 24/7 to answer questions and provide support with your registration and documentation needs.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="app-shell">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Find answers to common questions about our services</p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div key={faq.id} className={`faq-item ${openIndex === index ? 'open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">+</span>
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
