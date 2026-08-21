import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faXmark } from '@fortawesome/free-solid-svg-icons';
import '../css/components/PrintSlipPreviewModal.css';

function PrintSlipPreviewModal({ isOpen, title, reference, description, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="print-slip-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="print-slip-modal" role="dialog" aria-modal="true" aria-labelledby="print-slip-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="print-slip-toolbar">
          <span>Print preview</span>
          <div className="print-slip-toolbar-actions">
            <button type="button" className="print-slip-action" onClick={() => window.print()}><FontAwesomeIcon icon={faPrint} /> Print slip</button>
            <button type="button" className="print-slip-close" onClick={onClose} aria-label="Close print preview" title="Close print preview"><FontAwesomeIcon icon={faXmark} /></button>
          </div>
        </div>
        <article className="print-slip-document">
          <div className="print-slip-fireworks" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} style={{ '--ray': `${index * 30}deg` }} />)}</div>
          <img src="/logo/logo2.jpeg" alt="Pernest Digital Services" className="print-slip-logo" />
          <p className="print-slip-kicker">Application received</p>
          <h1 id="print-slip-title">{title}</h1>
          <p className="print-slip-description">{description}</p>
          <div className="print-slip-reference"><span>Application reference</span><strong>{reference}</strong></div>
          <div className="print-slip-account"><strong>Payment account</strong><span>Account number: 8130801666</span><span>Bank: Opay</span><span>Account name: ERNEST EMMANUEL OSUNG</span></div>
          <div className="print-slip-contact"><strong>Before making payment</strong><span>Call <b>+234 813 080 1666</b> to negotiate and confirm the service charge.</span></div>
          <p className="print-slip-footer">After payment, upload your bank transfer slip so our team can confirm it.</p>
        </article>
      </section>
    </div>
  );
}

export default PrintSlipPreviewModal;
