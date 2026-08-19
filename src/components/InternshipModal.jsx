import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/components/InternshipModal.css';

function InternshipModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleRegister = () => {
    onClose();
    navigate('/register');
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
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-content">
          <div className="modal-header">
            <h1>Join Our Internship Program</h1>
            <p className="modal-subtitle">Transform Your Skills, Build Your Future</p>
          </div>

          <div className="modal-body">
            <div className="modal-highlights">
              <div className="highlight-item">
                <div className="highlight-icon">📚</div>
                <h3>Professional Training</h3>
                <p>Learn industry best practices from experienced professionals</p>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">🏆</div>
                <h3>Real Experience</h3>
                <p>Work on actual projects and build your portfolio</p>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">🤝</div>
                <h3>Mentorship</h3>
                <p>Get guidance from seasoned industry experts</p>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">💼</div>
                <h3>Career Growth</h3>
                <p>Excellent opportunity for permanent placement</p>
              </div>
            </div>

            <div className="modal-details">
              <h2>Program Overview</h2>
              <ul className="benefits-list">
                <li>✓ 3-6 month structured internship program</li>
                <li>✓ Hands-on training in textile production</li>
                <li>✓ Mentoring from industry leaders</li>
                <li>✓ Certificate upon completion</li>
                <li>✓ Potential for permanent employment</li>
                <li>✓ Competitive stipend provided</li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-primary-large" onClick={handleRegister}>
              Register Now →
            </button>
            <button className="btn-secondary-modal" onClick={onClose}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InternshipModal;
