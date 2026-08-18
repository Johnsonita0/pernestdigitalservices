import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faCheck, faClipboardCheck, faList, faMapMarkerAlt, faPhone, faSignOutAlt, faTruck } from '@fortawesome/free-solid-svg-icons'
import { notifyToast } from '../lib/toast'

function RiderDashboard({ user, orders = [], notifications = [], onMarkNotificationRead, onUpdateOrderStatus, onLogout }) {
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [activeView, setActiveView] = useState('orders')

  const activeOrders = orders.filter((order) => order.status === 'ready')
  const deliveredOrders = orders.filter((order) => order.status === 'delivered')
  const visibleOrders = activeView === 'orders' ? activeOrders : deliveredOrders

  const handleDelivered = async (orderId) => {
    try {
      setUpdatingOrderId(orderId)
      await onUpdateOrderStatus(orderId)
      notifyToast('Order marked as delivered.', 'success')
    } catch (error) {
      notifyToast(error?.message || 'Could not update this order.', 'error')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <main className="rider-app-shell">
      <header className="rider-app-header">
        <div>
          <div className="rider-header-topline">
            <p className="rider-account-label">Rider account</p>
            <button type="button" className="rider-header-icon" onClick={onLogout} aria-label="Log out" title="Log out">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </div>
          <h1>Delivery desk</h1>
          <p>{user?.user_metadata?.username || 'rider'} · Delivery partner</p>
        </div>
      </header>

      <section className="rider-summary" aria-label="Rider summary">
        <FontAwesomeIcon icon={faTruck} />
        <div>
          <strong>{activeOrders.length} order{activeOrders.length === 1 ? '' : 's'} ready for delivery</strong>
          <span>Orders appear here after admin marks them On the way.</span>
        </div>
      </section>

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
        <button
          type="button"
          className={activeView === 'notifications' ? 'active' : ''}
          onClick={() => setActiveView('notifications')}
        >
          Notifications <span>{notifications.filter((notification) => !notification.is_read).length}</span>
        </button>
      </nav>

      <section className="rider-order-list">
        {activeView === 'notifications' ? (
          notifications.length === 0 ? (
            <div className="rider-empty-state">
              <FontAwesomeIcon icon={faClipboardCheck} />
              <h2>No notifications yet</h2>
              <p>New delivery assignments will appear here.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                type="button"
                className="rider-order-card"
                key={notification.id}
                onClick={() => onMarkNotificationRead?.(notification.id)}
                style={{ textAlign: 'left', border: notification.is_read ? undefined : '2px solid #f97316' }}
              >
                <div className="rider-order-heading">
                  <div>
                    <span>{notification.is_read ? 'Read notification' : 'New notification'}</span>
                    <h2>{notification.title}</h2>
                  </div>
                </div>
                <p>{notification.message}</p>
                <small>{new Date(notification.created_at).toLocaleString('en-NG')}</small>
              </button>
            ))
          )
        ) : (
          visibleOrders.length === 0 ? (
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
          )
        )}
      </section>
    </main>
  )
}

export default RiderDashboard
