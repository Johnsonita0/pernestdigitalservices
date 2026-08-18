import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faCheck, faMapMarkerAlt, faPhone, faSignOutAlt, faTruck } from '@fortawesome/free-solid-svg-icons'

function RiderDashboard({ user, orders = [], onUpdateOrderStatus, onLogout }) {
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [message, setMessage] = useState('')

  const handleDelivered = async (orderId) => {
    try {
      setUpdatingOrderId(orderId)
      setMessage('')
      await onUpdateOrderStatus(orderId)
      setMessage('Order marked as delivered.')
    } catch (error) {
      setMessage(error?.message || 'Could not update this order.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <main className="rider-app-shell">
      <header className="rider-app-header">
        <div>
          <p className="eyebrow">Rider delivery desk</p>
          <h1>Ready for delivery</h1>
          <p>{user?.email}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} />
          Logout
        </button>
      </header>

      <section className="rider-summary" aria-label="Rider summary">
        <FontAwesomeIcon icon={faTruck} />
        <div>
          <strong>{orders.length} order{orders.length === 1 ? '' : 's'} to deliver</strong>
          <span>Orders appear here after admin marks them On the way.</span>
        </div>
      </section>

      {message && <p className="rider-message">{message}</p>}

      <section className="rider-order-list">
        {orders.length === 0 ? (
          <div className="rider-empty-state">
            <FontAwesomeIcon icon={faBox} />
            <h2>No deliveries yet</h2>
            <p>New orders will appear here when they are ready for delivery.</p>
          </div>
        ) : (
          orders.map((order) => (
            <article className="rider-order-card" key={order.id}>
              <div className="rider-order-heading">
                <div>
                  <span>Order #{String(order.id).slice(0, 8)}</span>
                  <h2>{order.customerName}</h2>
                </div>
                <strong>₦{order.total.toLocaleString('en-NG')}</strong>
              </div>

              <div className="rider-order-detail">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>{order.address}</span>
              </div>
              {order.customerPhone && (
                <div className="rider-order-detail">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{order.customerPhone}</span>
                </div>
              )}

              <div className="rider-order-items">
                {order.items.map((item) => (
                  <span key={item.id || `${item.food_id}-${item.food_name}`}>
                    {item.quantity} x {item.food_name}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="rider-delivered-btn"
                disabled={updatingOrderId === order.id}
                onClick={() => handleDelivered(order.id)}
              >
                <FontAwesomeIcon icon={faCheck} />
                {updatingOrderId === order.id ? 'Updating...' : 'Mark delivered'}
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default RiderDashboard
