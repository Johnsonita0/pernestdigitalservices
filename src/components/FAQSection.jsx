import React, { useState } from 'react';
import '../css/components/FAQSection.css';

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      id: 1,
      question: 'What is your minimum order quantity?',
      answer: 'We accept orders as small as 1 piece for custom printing. For bulk orders, we offer special pricing starting from 50+ pieces.'
    },
    {
      id: 2,
      question: 'How long does production take?',
      answer: 'Standard orders typically take 5-7 business days. Rush orders can be completed in 2-3 days with a small rush fee.'
    },
    {
      id: 3,
      question: 'Do you offer design services?',
      answer: 'Yes! Our professional design team can create custom artwork for your project. Design consultation is free for all orders.'
    },
    {
      id: 4,
      question: 'What printing methods do you use?',
      answer: 'We offer direct-to-garment printing, screen printing, embroidery, and heat transfer. Each method is chosen based on your design and garment.'
    },
    {
      id: 5,
      question: 'Can you do international shipping?',
      answer: 'Yes, we ship internationally. Contact us for a shipping quote to your location.'
    },
    {
      id: 6,
      question: 'What about the internship program?',
      answer: 'Our free 6-month internship covers T-shirt production, polo tailoring, face cap manufacturing, and quality finishing. Applications are open year-round.'
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
