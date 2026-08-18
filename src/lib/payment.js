// Payment Configuration and Helpers
// Paystack Public Key - Replace with your actual public key from https://dashboard.paystack.com
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_51234567890abcdefghijklmnop'

// Opay Merchant ID and App ID - Replace with your actual credentials from Opay
const OPAY_MERCHANT_ID = import.meta.env.VITE_OPAY_MERCHANT_ID || 'MERCHANT_ID'
const OPAY_APP_ID = import.meta.env.VITE_OPAY_APP_ID || 'APP_ID'

// Trophy Account Details for Cash on Delivery
export const TROPHY_COD_ACCOUNT = {
  bankName: 'Zenith Bank',
  accountName: 'Trophy Sip & Savor',
  accountNumber: '1234567890',
  accountType: 'Business',
  swiftCode: 'ZENLNGLA',
  note: 'Please transfer the order amount to this account and include the order ID as payment reference.',
}

// Alternative payment method for COD
export const TROPHY_PAYMENT_METHODS = {
  bank_transfer: {
    bankName: 'First Bank Nigeria',
    accountName: 'Trophy Ventures',
    accountNumber: '0987654321',
    note: '24-hour payment window'
  },
  ussd: {
    code: '*737*251*ACCOUNT_NUMBER#',
    note: 'Use Zenith Bank USSD'
  }
}

export const PAYMENT_METHODS = {
  CARD: 'card',
  USSD: 'ussd',
  BANK_TRANSFER: 'bank_transfer',
  OPAY: 'opay',
  PAYSTACK: 'paystack',
  CASH_ON_DELIVERY: 'cash_on_delivery',
}

// Paystack Payment Handler
export const initializePaystackPayment = async (email, amount, metadata) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    
    script.onload = () => {
      const PaystackPop = window.PaystackPop
      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount * 100, // Paystack expects amount in kobo (cents)
        ref: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: metadata,
        onClose: () => {
          reject(new Error('Payment window closed'))
        },
        onSuccess: (response) => {
          resolve(response)
        },
      })
      
      handler.openIframe()
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load Paystack script'))
    }
    
    document.body.appendChild(script)
  })
}

// Opay Payment Handler
export const initializeOpayPayment = async (email, amount, orderId, orderDetails) => {
  try {
    // Opay API endpoint for payment initialization
    const response = await fetch('https://api.opaycheckout.com/api/v1/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPAY_APP_ID}`,
      },
      body: JSON.stringify({
        merchantId: OPAY_MERCHANT_ID,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: 'NGN',
        orderId: orderId,
        orderTitle: 'Trophy Order',
        orderDesc: `Order #${orderId} - ${orderDetails}`,
        callbackUrl: `${window.location.origin}/payment/callback`,
        returnUrl: `${window.location.origin}/dashboard`,
        customerEmail: email,
        customerPhone: '',
        paymentMethods: ['CARD', 'USSD'],
      }),
    })

    const data = await response.json()
    
    if (data.success && data.data?.paymentUrl) {
      // Redirect to Opay payment page
      window.location.href = data.data.paymentUrl
    } else {
      throw new Error(data.message || 'Failed to initialize Opay payment')
    }
  } catch (error) {
    throw new Error(`Opay payment error: ${error.message}`)
  }
}

// Verify Paystack Payment
export const verifyPaystackPayment = async (reference) => {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY || ''}`,
      },
    })

    const data = await response.json()
    return data.status && data.data?.status === 'success' ? data.data : null
  } catch (error) {
    console.error('Paystack verification error:', error)
    throw error
  }
}

// Format account details for display
export const formatAccountDetails = (accountInfo) => {
  return `
Bank Name: ${accountInfo.bankName}
Account Name: ${accountInfo.accountName}
Account Number: ${accountInfo.accountNumber}
Account Type: ${accountInfo.accountType || 'N/A'}
${accountInfo.swiftCode ? `SWIFT Code: ${accountInfo.swiftCode}` : ''}
${accountInfo.note ? `\nNote: ${accountInfo.note}` : ''}
  `.trim()
}

// Payment status helper
export const getPaymentStatusColor = (status) => {
  const colors = {
    pending: '#fbbf24',      // yellow
    processing: '#60a5fa',   // blue
    success: '#34d399',      // green
    failed: '#f87171',       // red
    cancelled: '#9ca3af',    // gray
  }
  return colors[status] || colors.pending
}

export const getPaymentStatusLabel = (status) => {
  const labels = {
    pending: '⏳ Awaiting Payment',
    processing: '⚙️ Processing',
    success: '✅ Payment Confirmed',
    failed: '❌ Payment Failed',
    cancelled: '⛔ Cancelled',
  }
  return labels[status] || 'Unknown'
}
