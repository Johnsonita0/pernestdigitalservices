import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/components/PaymentSuccessModal.css';

function PaymentSuccessModal({ isOpen, onComplete, reference }) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(10);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(10);
      return undefined;
    }

    const countdown = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    const redirect = window.setTimeout(() => onCompleteRef.current(), 10000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(redirect);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="payment-success-backdrop" role="dialog" aria-modal="true" aria-labelledby="payment-success-title">
      <div className="payment-success-modal">
        <div className="fireworks" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span key={index} style={{ '--ray': `${index * 30}deg` }} />)}
        </div>
        <div className="success-check" aria-hidden="true">✓</div>
        <p className="success-kicker">Payment slip received</p>
        <h2 id="payment-success-title">Submission successful</h2>
        <p className="success-message">Thank you. Your payment slip has been submitted for review.</p>
        <p className="success-countdown">Returning to home in <strong>{secondsLeft}s</strong></p>
        <div className="success-modal-actions">
          <button type="button" className="success-slip-button" onClick={() => navigate('/success', { state: { reference } })}>View registration slip</button>
          <button type="button" className="success-home-button" onClick={onComplete}>Return home now</button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessModal;
