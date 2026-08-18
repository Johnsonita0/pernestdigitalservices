import { useState } from 'react'
import { 
  initializePaystackPayment, 
  initializeOpayPayment,
  TROPHY_COD_ACCOUNT,
  TROPHY_PAYMENT_METHODS,
  PAYMENT_METHODS,
  formatAccountDetails,
  getPaymentStatusColor,
  getPaymentStatusLabel
} from '../lib/payment'
import './PaymentModal.css'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function PaymentModal({ orderId, amount, email, customerName, onSuccess, onClose, onError }) {
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.PAYSTACK)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [copied, setCopied] = useState(null)

  const handlePaystackPayment = async () => {
    setIsProcessing(true)
    try {
      const response = await initializePaystackPayment(email, amount, {
        orderId,
        customerName,
        reference: `order_${orderId}_${Date.now()}`,
      })

      if (response && response.reference) {
        setPaymentStatus('success')
        setTimeout(() => {
          onSuccess({
            reference: response.reference,
            method: PAYMENT_METHODS.PAYSTACK,
            status: 'success',
            amount,
          })
        }, 2000)
      }
    } catch (error) {
      setPaymentStatus('failed')
      onError?.(error)
      console.error('Paystack payment error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpayPayment = async () => {
    setIsProcessing(true)
    setPaymentStatus('processing')
    try {
      await initializeOpayPayment(email, amount, orderId, `Order #${orderId}`)
      // Opay redirects, so we don't need to call onSuccess here
    } catch (error) {
      setPaymentStatus('failed')
      onError?.(error)
      console.error('Opay payment error:', error)
      setIsProcessing(false)
    }
  }

  const handleCODPayment = () => {
    setPaymentStatus('success')
    setTimeout(() => {
      onSuccess({
        reference: `COD_${orderId}_${Date.now()}`,
        method: PAYMENT_METHODS.CASH_ON_DELIVERY,
        status: 'pending',
        amount,
        accountDetails: TROPHY_COD_ACCOUNT,
      })
    }, 1000)
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const renderPaymentContent = () => {
    switch (paymentMethod) {
      case PAYMENT_METHODS.PAYSTACK:
        return (
          <div className="payment-method-content">
            <div className="payment-info-box">
              <p>💳 Pay securely with Paystack</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                Your card information is secure and encrypted.
              </p>
            </div>
            <button
              className="primary-btn payment-action-btn"
              onClick={handlePaystackPayment}
              disabled={isProcessing}
            >
              {isProcessing ? '⏳ Processing...' : '💳 Pay with Paystack'}
            </button>
          </div>
        )

      case PAYMENT_METHODS.OPAY:
        return (
          <div className="payment-method-content">
            <div className="payment-info-box">
              <p>📱 Pay with Opay Mobile Money</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                Fast, secure USSD and card payments via Opay
              </p>
            </div>
            <button
              className="primary-btn payment-action-btn"
              onClick={handleOpayPayment}
              disabled={isProcessing}
            >
              {isProcessing ? '⏳ Redirecting to Opay...' : '📱 Pay with Opay'}
            </button>
          </div>
        )

      case PAYMENT_METHODS.CASH_ON_DELIVERY:
        return (
          <div className="payment-method-content">
            <div className="payment-info-box" style={{ backgroundColor: '#fef3c7', borderColor: '#fbbf24' }}>
              <p>💰 Payment on Delivery</p>
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                Please transfer the payment to the account below before delivery:
              </p>
            </div>

            <div className="cod-account-details">
              <div className="account-detail-row">
                <span className="detail-label">Bank Name:</span>
                <span className="detail-value">{TROPHY_COD_ACCOUNT.bankName}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(TROPHY_COD_ACCOUNT.bankName, 'bank')}
                  title="Copy to clipboard"
                >
                  {copied === 'bank' ? '✓' : '📋'}
                </button>
              </div>

              <div className="account-detail-row">
                <span className="detail-label">Account Name:</span>
                <span className="detail-value">{TROPHY_COD_ACCOUNT.accountName}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(TROPHY_COD_ACCOUNT.accountName, 'name')}
                  title="Copy to clipboard"
                >
                  {copied === 'name' ? '✓' : '📋'}
                </button>
              </div>

              <div className="account-detail-row highlight">
                <span className="detail-label">Account Number:</span>
                <span className="detail-value" style={{ fontWeight: '700', fontSize: '1.05rem' }}>
                  {TROPHY_COD_ACCOUNT.accountNumber}
                </span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(TROPHY_COD_ACCOUNT.accountNumber, 'account')}
                  title="Copy to clipboard"
                >
                  {copied === 'account' ? '✓' : '📋'}
                </button>
              </div>

              <div className="account-detail-row">
                <span className="detail-label">Account Type:</span>
                <span className="detail-value">{TROPHY_COD_ACCOUNT.accountType}</span>
              </div>

              <div className="account-detail-row">
                <span className="detail-label">SWIFT Code:</span>
                <span className="detail-value">{TROPHY_COD_ACCOUNT.swiftCode}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(TROPHY_COD_ACCOUNT.swiftCode, 'swift')}
                  title="Copy to clipboard"
                >
                  {copied === 'swift' ? '✓' : '📋'}
                </button>
              </div>

              <div className="payment-note">
                <p style={{ margin: '0' }}>
                  ⚠️ <strong>Important:</strong> Use Order ID <code>#{orderId.slice(0, 8)}</code> as the payment reference
                </p>
              </div>
            </div>

            <button
              className="primary-btn payment-action-btn"
              onClick={handleCODPayment}
            >
              ✓ Confirm - I will transfer payment
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="payment-modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Secure Payment</p>
            <h3>Choose Payment Method</h3>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close payment modal"
          >
            ×
          </button>
        </div>

        <div className="payment-modal-body">
          {/* Order Summary */}
          <div className="payment-summary-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#666' }}>
                  Order Total
                </p>
                <h2 style={{ margin: '0', fontSize: '1.8rem', color: '#ff6b35' }}>
                  {formatNaira(amount)}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#666' }}>
                  Status
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: getPaymentStatusColor(paymentStatus),
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                  }}
                >
                  {getPaymentStatusLabel(paymentStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="payment-methods-grid">
            <button
              className={`payment-method-card ${paymentMethod === PAYMENT_METHODS.PAYSTACK ? 'active' : ''}`}
              onClick={() => !isProcessing && setPaymentMethod(PAYMENT_METHODS.PAYSTACK)}
              disabled={isProcessing}
            >
              <div className="method-icon">💳</div>
              <div className="method-name">Paystack</div>
              <div className="method-desc">Card & USSD</div>
            </button>

            <button
              className={`payment-method-card ${paymentMethod === PAYMENT_METHODS.OPAY ? 'active' : ''}`}
              onClick={() => !isProcessing && setPaymentMethod(PAYMENT_METHODS.OPAY)}
              disabled={isProcessing}
            >
              <div className="method-icon">📱</div>
              <div className="method-name">Opay</div>
              <div className="method-desc">Mobile Money</div>
            </button>

            <button
              className={`payment-method-card ${paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY ? 'active' : ''}`}
              onClick={() => !isProcessing && setPaymentMethod(PAYMENT_METHODS.CASH_ON_DELIVERY)}
              disabled={isProcessing}
            >
              <div className="method-icon">💰</div>
              <div className="method-name">Pay On Delivery</div>
              <div className="method-desc">Bank Transfer</div>
            </button>
          </div>

          {/* Payment Method Content */}
          {renderPaymentContent()}
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
