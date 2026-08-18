import { useState } from 'react'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function CheckoutModal({ items, total, onClose, onConfirm, userEmail = '', userId = null }) {
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    address: '',
    notes: '',
    paymentMethod: 'card',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim() || !formData.contactNumber.trim() || !formData.address.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (!userId) {
      setError('User ID not found. Please log in again.')
      return
    }

    if (!onConfirm) {
      setError('Checkout handler is unavailable.')
      return
    }

    setLoading(true)

    try {
      await onConfirm(formData)
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

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
          <form className="checkout-form" onSubmit={handleSubmit}>
            <label>
              Full name *
              <input
                type="text"
                name="name"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Contact number *
              <input
                type="tel"
                name="contactNumber"
                placeholder="0803 000 0000"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Delivery address *
              <textarea
                name="address"
                rows="3"
                placeholder="Street, area, city"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Delivery notes
              <textarea
                name="notes"
                rows="2"
                placeholder="Extra instructions"
                value={formData.notes}
                onChange={handleChange}
              />
            </label>

            <label>
              Payment method
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                <option value="card">Card payment</option>
                <option value="cash">Cash on delivery</option>
                <option value="transfer">Bank transfer</option>
              </select>
            </label>

            <button type="submit" className="primary-btn checkout-confirm-btn" disabled={loading}>
              {loading ? 'Creating order...' : 'Confirm order'}
            </button>

            {error && (
              <div style={{
                padding: '12px',
                marginTop: '12px',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
          </form>

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
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
