const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function CheckoutModal({ items, total, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="checkout-modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Complete order</p>
            <h3>Delivery details</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close checkout modal">
            ×
          </button>
        </div>

        <div className="checkout-body">
          <div className="checkout-form">
            <label>
              Full name
              <input type="text" placeholder="Your full name" />
            </label>

            <label>
              Phone number
              <input type="tel" placeholder="0803 000 0000" />
            </label>

            <label>
              Delivery address
              <textarea rows="3" placeholder="Street, area, city" />
            </label>

            <label>
              Delivery notes
              <textarea rows="2" placeholder="Extra instructions" />
            </label>

            <label>
              Payment method
              <select defaultValue="card">
                <option value="card">Card payment</option>
                <option value="cash">Cash on delivery</option>
                <option value="transfer">Bank transfer</option>
              </select>
            </label>
          </div>

          <div className="checkout-summary">
            <h4>Order summary</h4>
            {items.map((item) => (
              <div key={`${item.id}-modal`} className="checkout-item">
                <span>{item.title}</span>
                <strong>{formatNaira(item.price)}</strong>
              </div>
            ))}

            <div className="checkout-total">
              <span>Total</span>
              <strong>{formatNaira(total)}</strong>
            </div>

            <button type="button" className="primary-btn checkout-confirm-btn" onClick={onConfirm}>
              Confirm order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
