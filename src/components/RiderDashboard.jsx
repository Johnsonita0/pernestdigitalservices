import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faCheck, faClipboardCheck, faList, faMapMarkerAlt, faPhone, faSignOutAlt, faTruck } from '@fortawesome/free-solid-svg-icons'

function RiderDashboard({ user, orders = [], onUpdateOrderStatus, onLogout }) {
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [message, setMessage] = useState('')
  const [activeView, setActiveView] = useState('orders')

  const activeOrders = orders.filter((order) => order.status === 'ready')
  const deliveredOrders = orders.filter((order) => order.status === 'delivered')
  const visibleOrders = activeView === 'orders' ? activeOrders : deliveredOrders

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
          <p className="eyebrow">Rider account</p>
          <h1>Delivery desk</h1>
          <p>{user?.user_metadata?.username || 'rider'} · Delivery partner</p>
        </div>
        <button type="button" className="rider-header-icon" onClick={onLogout} aria-label="Log out" title="Log out">
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      </header>

      <section className="rider-summary" aria-label="Rider summary">
        <FontAwesomeIcon icon={faTruck} />
        <div>
          <strong>{activeOrders.length} order{activeOrders.length === 1 ? '' : 's'} ready for delivery</strong>
          <span>Orders appear here after admin marks them On the way.</span>
        </div>
      </section>

      {message && <p className="rider-message">{message}</p>}

      <nav className="rider-bottom-nav" aria-label="Rider order views">
        <button
          type="button"
          className={activeView === 'orders' ? 'active' : ''}
          onClick={() => setActiveView('orders')}
        >
          <FontAwesomeIcon icon={faList} />
          Orders <span>{activeOrders.length}</span>
        </button>
        <button
          type="button"
          className={activeView === 'delivered' ? 'active' : ''}
          onClick={() => setActiveView('delivered')}
        >
          <FontAwesomeIcon icon={faClipboardCheck} />
          Delivered records <span>{deliveredOrders.length}</span>
        </button>
      </nav>

      <section className="rider-order-list">
        {visibleOrders.length === 0 ? (
          <div className="rider-empty-state">
            <FontAwesomeIcon icon={faBox} />
            <h2>{activeView === 'orders' ? 'No active orders' : 'No delivered records'}</h2>
            <p>{activeView === 'orders' ? 'New orders appear here when the admin sends them On the way.' : 'Completed deliveries will be recorded here.'}</p>
          </div>
        ) : (
          visibleOrders.map((order) => (
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

              {activeView === 'orders' ? (
                <button
                  type="button"
                  className="rider-delivered-btn"
                  disabled={updatingOrderId === order.id}
                  onClick={() => handleDelivered(order.id)}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  {updatingOrderId === order.id ? 'Updating...' : 'Mark delivered'}
                </button>
              ) : (
                <div className="rider-delivered-label">
                  <FontAwesomeIcon icon={faCheck} /> Delivered
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default RiderDashboard
