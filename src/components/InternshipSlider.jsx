import React from 'react';
import '../css/components/InternshipSlider.css';

function InternshipSlider() {
  const handleRegisterClick = () => {
    const registrationSection = document.getElementById('registration');
    if (registrationSection) {
      registrationSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="internship-slider">
      <div className="internship-container">
        {/* Left Content */}
        <div className="internship-content">
          <div className="internship-badge">
            <span className="badge-text">In Commemoration with our</span>
          </div>

          <div className="anniversary-banner">
            <div className="anniversary-number">8</div>
            <div className="anniversary-text">
              <span className="years-text">th YEARS</span>
              <span className="anniversary-label">Anniversary</span>
            </div>
          </div>

          <h2 className="internship-title">
            <span className="highlight-blue">T-SHIRTS VILLAGE</span> IS <br />
            <span className="highlight-offer">OFFERING A</span>
          </h2>

          <div className="offer-banner">
            <span className="offer-text">FREE INTERNSHIP OPPORTUNITY</span>
          </div>

          <div className="internship-details">
            <div className="detail-box">
              <div className="detail-icon">📋</div>
              <div className="detail-text">
                <span className="detail-label">FOR AN INTERESTED APPLICANTS</span>
                <ul className="skills-list">
                  <li>Practical Workshop Skills</li>
                  <li>T-Shirts Production Techniques</li>
                  <li>Equipment Handling</li>
                  <li>Quality & Finishing</li>
                  <li>Work Ethics & Teamwork</li>
                </ul>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-icon-sm">📅</div>
                <div className="detail-info">
                  <span className="detail-label">DURATION:</span>
                  <span className="detail-value">6 MONTHS</span>
                  <span className="detail-label">WITH FREE TRAINING</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-sm">🎯</div>
                <div className="detail-info">
                  <span className="detail-label">PROGRAM:</span>
                  <span className="detail-value">FREE</span>
                </div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-item">
                <div className="detail-icon-sm">⏰</div>
                <div className="detail-info">
                  <span className="detail-label">REGISTRATION DEADLINE:</span>
                  <span className="detail-value">27TH AUGUST</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-sm">🎓</div>
                <div className="detail-info">
                  <span className="detail-label">CLASS STARTS:</span>
                  <span className="detail-value">31ST AUGUST</span>
                </div>
              </div>
            </div>
          </div>

          <div className="limited-slots">
            <span className="slots-badge">LIMITED SLOTS AVAILABLE</span>
          </div>

          <button className="register-btn" onClick={handleRegisterClick}>
            REGISTER NOW!
          </button>
        </div>

        {/* Right Visual */}
        <div className="internship-visual">
          <div className="chair-visual">
            <div className="chair-back"></div>
            <div className="chair-seat"></div>
            <div className="chair-wheels"></div>
          </div>
          <div className="accent-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InternshipSlider;
