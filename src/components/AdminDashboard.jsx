import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingBag, faComment, faUtensils, faToggleOn, faToggleOff, faStar, faUsers, faChevronRight, faPhone, faMapMarkerAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons'

function AdminDashboard({ products, pendingTestimonials = [], onApproveTestimonial, onRejectTestimonial, user, onLogout, allUsers = [], allOrders = [] }) {
  const [activeTab, setActiveTab] = useState('users')
  const [selectedUser, setSelectedUser] = useState(null)
  const [productAvailability, setProductAvailability] = useState(
    products.reduce((acc, p) => ({ ...acc, [p.id]: true }), {})
  )
  const [featuredProducts, setFeaturedProducts] = useState(
    products.slice(0, 3).map((p) => p.id)
  )

  // Get user orders
  const userOrders = selectedUser ? (selectedUser.orders || []) : allOrders
  const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

  const toggleProductAvailability = (productId) => {
    setProductAvailability((current) => ({
      ...current,
      [productId]: !current[productId],
    }))
  }

  const toggleFeaturedProduct = (productId) => {
    setFeaturedProducts((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId)
      }
      return [...current, productId]
    })
  }

  return (
    <section className="admin-section" id="admin">
      <div className="admin-topbar">
        <div className="container admin-topbar-wrap">
          <div>
            <p className="admin-greeting">Welcome, {user?.email}</p>
          </div>
          <button type="button" className="ghost-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Back office dashboard.</h2>
          </div>
        </div>

        <div className="admin-stats">
          <div className="stat-card">
            <p className="stat-label">Total Users</p>
            <p className="stat-value">{allUsers.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{allOrders.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Pending Reviews</p>
            <p className="stat-value">{pendingTestimonials.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Available Items</p>
            <p className="stat-value">{Object.values(productAvailability).filter(Boolean).length}</p>
          </div>
        </div>

        <div className="admin-tabs">
          <div className="tab-navigation">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('users')
                setSelectedUser(null)
              }}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span>Users</span>
              {allUsers.length > 0 && <span className="badge">{allUsers.length}</span>}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FontAwesomeIcon icon={faShoppingBag} />
              <span>Orders</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'testimonials' ? 'active' : ''}`}
              onClick={() => setActiveTab('testimonials')}
            >
              <FontAwesomeIcon icon={faComment} />
              <span>Testimonials</span>
              {pendingTestimonials.length > 0 && (
                <span className="badge">{pendingTestimonials.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              <FontAwesomeIcon icon={faUtensils} />
              <span>Menu & Featured</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="tab-content">
              <h3>Users Management</h3>
              <div className="users-container">
                <div className="users-list">
                  {allUsers.length === 0 ? (
                    <p className="empty-state">No registered users yet.</p>
                  ) : (
                    allUsers.map((userData) => (
                      <div
                        key={userData.id}
                        className={`user-card ${selectedUser?.id === userData.id ? 'selected' : ''}`}
                        onClick={() => setSelectedUser(userData)}
                      >
                        <div className="user-info">
                          <h4>{userData.fullName}</h4>
                          <p className="user-email">{userData.email}</p>
                          <p className="user-username">@{userData.username}</p>
                        </div>
                        <div className="user-meta">
                          <span className="order-count">{userData.orders?.length || 0} orders</span>
                          <FontAwesomeIcon icon={faChevronRight} className="chevron" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedUser && (
                  <div className="user-details">
                    <div className="user-details-header">
                      <h4>{selectedUser.fullName}</h4>
                      <button
                        type="button"
                        className="close-btn"
                        onClick={() => setSelectedUser(null)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="detail-section">
                      <h5>Profile Information</h5>
                      <div className="detail-group">
                        <div className="detail-item">
                          <label>
                            <FontAwesomeIcon icon={faEnvelope} /> Email
                          </label>
                          <p>{selectedUser.email}</p>
                        </div>
                        <div className="detail-item">
                          <label>Username</label>
                          <p>@{selectedUser.username}</p>
                        </div>
                        <div className="detail-item">
                          <label>
                            <FontAwesomeIcon icon={faPhone} /> Phone
                          </label>
                          <p>{selectedUser.phone}</p>
                        </div>
                        <div className="detail-item">
                          <label>
                            <FontAwesomeIcon icon={faMapMarkerAlt} /> Address
                          </label>
                          <p>{selectedUser.address}</p>
                        </div>
                        <div className="detail-item">
                          <label>Joined</label>
                          <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h5>User Orders ({selectedUser.orders?.length || 0})</h5>
                      {selectedUser.orders && selectedUser.orders.length > 0 ? (
                        <div className="orders-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedUser.orders.map((order) => (
                                <tr key={order.id}>
                                  <td>#{order.id}</td>
                                  <td>{new Date(order.date).toLocaleDateString()}</td>
                                  <td>{order.items?.length || 0} item(s)</td>
                                  <td>{formatNaira(order.total)}</td>
                                  <td>
                                    <span className={`status-badge ${order.status?.toLowerCase() || 'pending'}`}>
                                      {order.status || 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="empty-message">No orders yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="tab-content">
              <h3>Orders Management</h3>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>User</th>
                      <th>Date</th>
                      <th>Items Ordered</th>
                      <th>Delivery Address</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-message">No orders yet.</td>
                      </tr>
                    ) : (
                      allOrders.map((order) => {
                        const orderUser = allUsers.find((u) => u.id === order.userId)
                        return (
                          <tr key={order.id}>
                            <td className="order-id">#{order.id}</td>
                            <td>{orderUser?.fullName || order.name || 'Unknown'}</td>
                            <td>{new Date(order.date).toLocaleDateString()}</td>
                            <td className="items-cell">
                              {order.items?.map((item) => item.name || item.title || item).join(', ')}
                            </td>
                            <td className="address-cell">{order.address}</td>
                            <td className="amount">{formatNaira(order.total)}</td>
                            <td>
                              <span className={`status-badge ${(order.status || 'pending').toLowerCase()}`}>
                                {order.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="tab-content">
              <h3>Testimonial Responses</h3>
              {pendingTestimonials.length > 0 ? (
                <div className="testimonial-review-list">
                  {pendingTestimonials.map((review) => (
                    <div key={review.id} className="testimonial-review-item">
                      <div className="review-content">
                        <div className="star-row">
                          {Array.from({ length: review.rating }).map((_, index) => (
                            <span key={`star-${index}`}>★</span>
                          ))}
                        </div>
                        <p className="review-text">"{review.text}"</p>
                        <div className="review-meta">
                          <strong>{review.name}</strong>
                          <span> • {review.role}</span>
                        </div>
                      </div>
                      <div className="review-actions">
                        <button
                          type="button"
                          className="primary-btn"
                          onClick={() => onApproveTestimonial(review.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => onRejectTestimonial(review.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No pending testimonials.</p>
              )}
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="tab-content">
              <h3>Menu Items Management</h3>
              <div className="menu-controls">
                <div className="menu-list">
                  {products.map((product) => (
                    <div key={product.id} className="menu-item">
                      <div className="item-info">
                        <div className="item-header">
                          <h4>{product.name}</h4>
                          <span className="item-price">₦{product.price.toLocaleString()}</span>
                        </div>
                        <p className="item-description">{product.description}</p>
                      </div>

                      <div className="item-controls">
                        <div className="control-group">
                          <label>Availability</label>
                          <button
                            type="button"
                            className={`toggle-btn ${productAvailability[product.id] ? 'available' : 'unavailable'}`}
                            onClick={() => toggleProductAvailability(product.id)}
                            title={productAvailability[product.id] ? 'Available' : 'Not Available'}
                          >
                            <FontAwesomeIcon
                              icon={productAvailability[product.id] ? faToggleOn : faToggleOff}
                            />
                            <span>{productAvailability[product.id] ? 'Available' : 'Not Available'}</span>
                          </button>
                        </div>

                        <div className="control-group">
                          <label>Featured</label>
                          <button
                            type="button"
                            className={`feature-btn ${featuredProducts.includes(product.id) ? 'featured' : ''}`}
                            onClick={() => toggleFeaturedProduct(product.id)}
                            title={featuredProducts.includes(product.id) ? 'Remove from featured' : 'Add to featured'}
                          >
                            <FontAwesomeIcon icon={faStar} />
                            <span>{featuredProducts.includes(product.id) ? 'Featured' : 'Add to Featured'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard
