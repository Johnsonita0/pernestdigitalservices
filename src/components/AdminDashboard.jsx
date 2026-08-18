import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingBag, faComment, faUtensils, faToggleOn, faToggleOff, faStar, faUsers, faChevronRight, faPhone, faMapMarkerAlt, faEnvelope, faSyncAlt, faSignOutAlt, faChartLine, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'

function AdminDashboard({ products, pendingTestimonials = [], onApproveTestimonial, onRejectTestimonial, user, onLogout, onRefresh, allUsers = [], allOrders = [], onCreateMenuItem, onUpdateOrderStatus }) {
  const [activeTab, setActiveTab] = useState('users')
  const [reportTab, setReportTab] = useState('transfers')
  const [transferNotifications, setTransferNotifications] = useState([])
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [cashPeriod, setCashPeriod] = useState('daily')
  const [selectedUser, setSelectedUser] = useState(null)
  const [productAvailability, setProductAvailability] = useState(
    products.reduce((acc, p) => ({ ...acc, [p.id]: true }), {})
  )
  const [featuredProducts, setFeaturedProducts] = useState(
    products.slice(0, 3).map((p) => p.id)
  )
  const [menuForm, setMenuForm] = useState({
    title: '',
    description: '',
    price: '',
    tag: '',
    badge: '',
    imageUrl: '',
    available: true,
    featured: false,
  })
  const [menuMessage, setMenuMessage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)

  // Get user orders
  const userOrders = selectedUser ? (selectedUser.orders || []) : allOrders
  const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone })
  }

  const handleRefresh = async () => {
    if (typeof onRefresh !== 'function') return

    try {
      setRefreshing(true)
      await onRefresh()
      showToast('Dashboard refreshed.', 'success')
    } catch (error) {
      showToast(error?.message || 'Could not refresh dashboard.', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (activeTab !== 'reports' || !user?.id) return

    const loadTransferNotifications = async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('notification_type', 'bank_transfer_payment')
        .order('created_at', { ascending: false })

      if (error) {
        showToast(error.message || 'Could not load transfer reports.', 'error')
        return
      }

      setTransferNotifications(data || [])
    }

    loadTransferNotifications()
  }, [activeTab, user?.id])

  const completedCashOrders = allOrders.filter((order) => order.paymentMethod === 'cash' && order.status === 'delivered')
  const getPeriodKey = (dateValue, period) => {
    const date = new Date(dateValue)
    if (period === 'monthly') return date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
    if (period === 'weekly') {
      const start = new Date(date)
      start.setDate(date.getDate() - date.getDay())
      return start.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
    }
    return date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' })
  }
  const cashReport = completedCashOrders.reduce((groups, order) => {
    const key = getPeriodKey(order.date, cashPeriod)
    const current = groups[key] || { label: key, amount: 0, orders: 0 }
    current.amount += Number(order.total) || 0
    current.orders += 1
    groups[key] = current
    return groups
  }, {})
  const cashChartData = Object.values(cashReport).slice(-8)
  const cashTotal = completedCashOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
  const maxCashAmount = Math.max(...cashChartData.map((item) => item.amount), 1)

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

  const handleMenuImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) {
      showToast('Please choose a food image first.', 'error')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setMenuForm((current) => ({ ...current, imageUrl: previewUrl }))

    try {
      setUploadingImage(true)
      const safeName = file.name.replace(/\s+/g, '_')
      const filePath = `${user.id}/food-images/${Date.now()}-${safeName}`

      const { error } = await supabase.storage.from('food_img').upload(filePath, file, { upsert: true })
      if (error) throw new Error(error.message)

      const { data } = supabase.storage.from('food_img').getPublicUrl(filePath)
      setMenuForm((current) => ({ ...current, imageUrl: data.publicUrl }))
      showToast('Food image uploaded successfully.', 'success')
    } catch (error) {
      console.error('Error uploading food image:', error)
      const message = error?.message || 'Upload failed.'
      showToast(message, 'error')
      setMenuForm((current) => ({ ...current, imageUrl: '' }))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateMenuItem = async () => {
    if (!menuForm.title || !menuForm.description || !menuForm.price) {
      showToast('Please fill in title, description, and price.', 'error')
      return
    }

    const newProduct = {
      id: Date.now(),
      title: menuForm.title,
      name: menuForm.title,
      description: menuForm.description,
      price: Number(menuForm.price),
      tag: menuForm.tag || 'Chef special',
      badge: menuForm.badge || 'New',
      feature: menuForm.featured,
      featured: menuForm.featured,
      available: menuForm.available,
      image: menuForm.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    }

    try {
      if (typeof onCreateMenuItem !== 'function') {
        throw new Error('Menu creation is not available.')
      }

      await onCreateMenuItem(newProduct)
      setMenuForm({
        title: '',
        description: '',
        price: '',
        tag: '',
        badge: '',
        imageUrl: '',
        available: true,
        featured: false,
      })
      showToast('Menu item created successfully.', 'success')
    } catch (error) {
      console.error('Error creating menu item:', error)
      showToast(error?.message || 'Menu item could not be created.', 'error')
    }
  }

  const renderUserDetails = (userDetails) => (
    <div className="user-details">
      <div className="user-details-header">
        <h4>{userDetails.fullName}</h4>
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
            <label><FontAwesomeIcon icon={faEnvelope} /> Email</label>
            <p>{userDetails.email}</p>
          </div>
          <div className="detail-item">
            <label>Username</label>
            <p>@{userDetails.username}</p>
          </div>
          <div className="detail-item">
            <label><FontAwesomeIcon icon={faPhone} /> Phone</label>
            <p>{userDetails.phone}</p>
          </div>
          <div className="detail-item">
            <label><FontAwesomeIcon icon={faMapMarkerAlt} /> Address</label>
            <p>{userDetails.address}</p>
          </div>
          <div className="detail-item">
            <label>Joined</label>
            <p>{new Date(userDetails.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h5>User Orders ({userDetails.orders?.length || 0})</h5>
        {userDetails.orders && userDetails.orders.length > 0 ? (
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
                {userDetails.orders.map((order) => (
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
  )

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '18px',
          right: '18px',
          zIndex: 9999,
          minWidth: '240px',
          maxWidth: '360px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: toast.tone === 'error' ? '#fef2f2' : toast.tone === 'warning' ? '#fff7ed' : '#f0fdf4',
          border: `1px solid ${toast.tone === 'error' ? '#fecaca' : toast.tone === 'warning' ? '#fed7aa' : '#bbf7d0'}`,
          boxShadow: '0 10px 28px rgba(36, 31, 27, 0.12)',
          color: toast.tone === 'error' ? '#991b1b' : toast.tone === 'warning' ? '#9a4d00' : '#166534',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: toast.tone === 'error' ? '#ef4444' : toast.tone === 'warning' ? '#f59e0b' : '#22c55e',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span>{toast.message}</span>
        </div>
      )}

      <section className="admin-section" id="admin">
      <div className="admin-topbar">
        <div className="container admin-topbar-wrap">
          <div>
            <p className="admin-greeting">Welcome, {user?.user_metadata?.username || 'admin'}</p>
          </div>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-header-icon" onClick={handleRefresh} disabled={refreshing} aria-label="Refresh dashboard" title="Refresh dashboard">
              <FontAwesomeIcon icon={faSyncAlt} spin={refreshing} />
            </button>
            <button type="button" className="admin-header-icon" onClick={onLogout} aria-label="Log out" title="Log out">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Back Office Dashboard.</h2>
          </div>
        </div>

        {activeTab === 'reports' && (
          <div className="admin-report-tabs" role="tablist" aria-label="Reports">
            <button type="button" className={reportTab === 'transfers' ? 'active' : ''} onClick={() => setReportTab('transfers')}>
              <FontAwesomeIcon icon={faFileInvoiceDollar} /> Bank transfers
            </button>
            <button type="button" className={reportTab === 'cash' ? 'active' : ''} onClick={() => setReportTab('cash')}>
              <FontAwesomeIcon icon={faChartLine} /> Cash analysis
            </button>
          </div>
        )}

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
          {activeTab === 'users' && (
            <div className="tab-content">
              <h3>Users Management</h3>
              <div className="users-container">
                <div className="users-list">
                  {allUsers.length === 0 ? (
                    <p className="empty-state">No registered users yet.</p>
                  ) : (
                    allUsers.map((userData) => (
                      <div key={userData.id} className="user-list-item">
                        <div
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
                        {selectedUser?.id === userData.id && renderUserDetails(userData)}
                      </div>
                    ))
                  )}
                </div>
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
                      <th>Order Timestamp</th>
                      <th>Cancelled At</th>
                      <th>Cancellation Reason</th>
                      <th>Items Ordered</th>
                      <th>Delivery Address</th>
                      <th>Amount Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="empty-message">No orders yet.</td>
                      </tr>
                    ) : (
                      allOrders.map((order) => {
                        const orderUser = allUsers.find((u) => u.id === order.userId)
                        return (
                          <tr key={order.id}>
                            <td className="order-id">#{order.id}</td>
                            <td>{orderUser?.fullName || order.name || 'Unknown'}</td>
                            <td>{new Date(order.date).toLocaleString('en-NG')}</td>
                            <td>{order.status === 'cancelled' && order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '—'}</td>
                            <td className="address-cell">
                              {order.status === 'cancelled' ? (
                                <>
                                  <strong>{order.cancellationReason || 'Not provided'}</strong>
                                  {order.cancellationNote && <div>{order.cancellationNote}</div>}
                                </>
                              ) : '—'}
                            </td>
                            <td className="items-cell">
                              {order.items?.map((item) => item.name || item.title || item).join(', ')}
                            </td>
                            <td className="address-cell">{order.address}</td>
                            <td className="amount">{formatNaira(order.total)}</td>
                            <td>
                              {order.status === 'cancelled' ? (
                                <span className="admin-order-status-select status-cancelled" aria-label={`Order ${order.id} is cancelled`}>
                                  Cancelled
                                </span>
                              ) : (
                                <select
                                  className={`admin-order-status-select status-${order.status || 'pending'}`}
                                  value={order.status || 'pending'}
                                  aria-label={`Update order ${order.id} status`}
                                  onChange={async (event) => {
                                    try {
                                      await onUpdateOrderStatus(order.id, event.target.value)
                                      showToast('Order status updated.', 'success')
                                    } catch (error) {
                                      showToast(error?.message || 'Could not update order status.', 'error')
                                    }
                                  }}
                                >
                                  <option value="pending_payment_confirmation">Awaiting payment</option>
                                  <option value="pending">Confirmed</option>
                                  <option value="preparing">Preparing</option>
                                  <option value="ready">On the way</option>
                                  <option value="delivered">Delivered</option>
                                </select>
                              )}
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

              <div className="menu-form admin-menu-form">
                <div className="admin-menu-form-fields">
                  <div className="admin-image-upload-row">
                    <div className="admin-image-preview">
                      {menuForm.imageUrl ? (
                        <img src={menuForm.imageUrl} alt="Food preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#6b4f3c', fontSize: '0.8rem', fontWeight: 700 }}>Image</span>
                      )}
                    </div>
                    <label className="admin-image-upload-label">
                      <span>Upload food image</span>
                      <small>JPG, PNG or WEBP up to 5MB</small>
                      <input type="file" accept="image/*" onChange={handleMenuImageUpload} />
                    </label>
                  </div>

                  <label className="admin-menu-field admin-menu-field-wide">
                    <span>Food title</span>
                    <input
                      type="text"
                      value={menuForm.title}
                      placeholder="e.g. Fisherman native soup"
                      onChange={(event) => setMenuForm((current) => ({ ...current, title: event.target.value }))}
                    />
                  </label>
                  <label className="admin-menu-field admin-menu-field-wide">
                    <span>Description</span>
                    <textarea
                      value={menuForm.description}
                      placeholder="Describe the ingredients and serving style"
                      rows="3"
                      onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))}
                    />
                  </label>
                  <div className="admin-menu-meta-grid">
                    <label className="admin-menu-field admin-price-field">
                      <span>Price</span>
                      <div className="admin-price-input">
                        <strong>₦</strong>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={menuForm.price}
                          placeholder="0"
                          onChange={(event) => setMenuForm((current) => ({ ...current, price: event.target.value }))}
                        />
                      </div>
                    </label>
                    <label className="admin-menu-field">
                      <span>Tag</span>
                      <input
                        type="text"
                        value={menuForm.tag}
                        placeholder="Chef special"
                        onChange={(event) => setMenuForm((current) => ({ ...current, tag: event.target.value }))}
                      />
                    </label>
                    <label className="admin-menu-field">
                      <span>Badge</span>
                      <input
                        type="text"
                        value={menuForm.badge}
                        placeholder="Popular"
                        onChange={(event) => setMenuForm((current) => ({ ...current, badge: event.target.value }))}
                      />
                    </label>
                  </div>

                  <div className="admin-menu-options">
                    <label>
                      <input
                        type="checkbox"
                        checked={menuForm.available}
                        onChange={(event) => setMenuForm((current) => ({ ...current, available: event.target.checked }))}
                      />
                      Available
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={menuForm.featured}
                        onChange={(event) => setMenuForm((current) => ({ ...current, featured: event.target.checked }))}
                      />
                      Featured
                    </label>
                  </div>

                  {menuMessage && (
                    <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: menuMessage.includes('✅') ? '#f0fdf4' : '#fef2f2', color: menuMessage.includes('✅') ? '#166534' : '#991b1b' }}>
                      {menuMessage}
                    </div>
                  )}

                  <button type="button" className="primary-btn admin-menu-submit" onClick={handleCreateMenuItem} disabled={uploadingImage}>
                    {uploadingImage ? 'Uploading...' : 'Create menu item'}
                  </button>
                </div>
              </div>

              <div className="menu-controls">
                <div className="menu-list">
                  {products.map((product) => (
                    <div key={product.id} className="menu-item">
                      <div className="item-info">
                        <div className="item-header">
                          <h4>{product.title || product.name}</h4>
                          <span className="item-price">₦{Number(product.price || 0).toLocaleString()}</span>
                        </div>
                        <p className="item-description">{product.description}</p>
                      </div>

                      <div className="item-controls">
                        <div className="control-group">
                          <label>Availability</label>
                          <button
                            type="button"
                            className={`toggle-btn ${productAvailability[product.id] ?? product.available ?? true ? 'available' : 'unavailable'}`}
                            onClick={() => toggleProductAvailability(product.id)}
                            title={productAvailability[product.id] ?? product.available ?? true ? 'Available' : 'Not Available'}
                          >
                            <FontAwesomeIcon
                              icon={productAvailability[product.id] ?? product.available ?? true ? faToggleOn : faToggleOff}
                            />
                            <span>{productAvailability[product.id] ?? product.available ?? true ? 'Available' : 'Not Available'}</span>
                          </button>
                        </div>

                        <div className="control-group">
                          <label>Featured</label>
                          <button
                            type="button"
                            className={`feature-btn ${featuredProducts.includes(product.id) || product.featured ? 'featured' : ''}`}
                            onClick={() => toggleFeaturedProduct(product.id)}
                            title={featuredProducts.includes(product.id) || product.featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <FontAwesomeIcon icon={faStar} />
                            <span>{featuredProducts.includes(product.id) || product.featured ? 'Featured' : 'Add to Featured'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && reportTab === 'transfers' && (
            <div className="tab-content report-content">
              <div className="report-heading-row">
                <div><p className="eyebrow">Payment review</p><h3>Bank transfer payments</h3></div>
                <span className="report-count">{transferNotifications.length} submissions</span>
              </div>
              {transferNotifications.length === 0 ? <p className="empty-state">No bank transfer submissions yet.</p> : (
                <div className="transfer-report-list">
                  {transferNotifications.map((notification) => (
                    <button type="button" className="transfer-report-row" key={notification.id} onClick={() => setSelectedTransfer(notification)}>
                      <span className="transfer-report-main"><strong>{notification.user_name}</strong><small>{notification.user_email}</small></span>
                      <span className="transfer-report-meta"><strong>{formatNaira(Number(notification.order_total) || 0)}</strong><small>{new Date(notification.created_at).toLocaleString('en-NG')}</small></span>
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && reportTab === 'cash' && (
            <div className="tab-content report-content">
              <div className="report-heading-row">
                <div><p className="eyebrow">Completed orders</p><h3>Cash collection analysis</h3></div>
                <select className="report-period-select" value={cashPeriod} onChange={(event) => setCashPeriod(event.target.value)} aria-label="Cash report period">
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="report-summary-grid"><div><span>Completed cash orders</span><strong>{completedCashOrders.length}</strong></div><div><span>Total collected</span><strong>{formatNaira(cashTotal)}</strong></div></div>
              <div className="cash-report-chart" aria-label={`${cashPeriod} cash collection chart`}>
                {cashChartData.length === 0 ? <p className="empty-state">No completed cash orders yet.</p> : cashChartData.map((item) => (
                  <div className="cash-chart-column" key={item.label} title={`${item.label}: ${formatNaira(item.amount)}`}><div className="cash-chart-bar" style={{ height: `${Math.max((item.amount / maxCashAmount) * 100, 8)}%` }} /><small>{item.label}</small></div>
                ))}
              </div>
              <div className="report-table-wrapper"><table className="admin-table report-table"><thead><tr><th>Period</th><th>Orders</th><th>Amount collected</th></tr></thead><tbody>{cashChartData.map((item) => <tr key={item.label}><td>{item.label}</td><td>{item.orders}</td><td className="amount">{formatNaira(item.amount)}</td></tr>)}</tbody></table></div>
            </div>
          )}
        </div>
      </div>

      <nav className="admin-bottom-nav" aria-label="Admin dashboard navigation">
        <button
          type="button"
          className={`admin-bottom-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users')
            setSelectedUser(null)
          }}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span>Users</span>
          {allUsers.length > 0 && <b>{allUsers.length}</b>}
        </button>
        <button
          type="button"
          className={`admin-bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <FontAwesomeIcon icon={faShoppingBag} />
          <span>Orders</span>
          {allOrders.length > 0 && <b>{allOrders.length}</b>}
        </button>
        <button
          type="button"
          className={`admin-bottom-nav-item ${activeTab === 'testimonials' ? 'active' : ''}`}
          onClick={() => setActiveTab('testimonials')}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>Reviews</span>
          {pendingTestimonials.length > 0 && <b>{pendingTestimonials.length}</b>}
        </button>
        <button
          type="button"
          className={`admin-bottom-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          <FontAwesomeIcon icon={faUtensils} />
          <span>Menu</span>
        </button>
        <button
          type="button"
          className={`admin-bottom-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FontAwesomeIcon icon={faChartLine} />
          <span>Reports</span>
        </button>
      </nav>
      {selectedTransfer && (
        <div className="transfer-proof-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedTransfer(null)}>
          <div className="transfer-proof-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-proof-title">
            <div className="report-heading-row"><div><p className="eyebrow">Transfer submission</p><h3 id="transfer-proof-title">Payment proof</h3></div><button type="button" className="close-btn" onClick={() => setSelectedTransfer(null)}>✕</button></div>
            <div className="transfer-sender-card"><strong>{selectedTransfer.user_name}</strong><span>{selectedTransfer.user_email}</span><span>{selectedTransfer.user_phone}</span><b>{formatNaira(Number(selectedTransfer.order_total) || 0)}</b></div>
            {selectedTransfer.proof_of_payment_url ? <img className="transfer-proof-image" src={selectedTransfer.proof_of_payment_url} alt={`Payment proof from ${selectedTransfer.user_name}`} /> : <p className="empty-state">No proof image attached.</p>}
            <p className="transfer-file-name">{selectedTransfer.proof_of_payment_filename || 'Bank transfer proof'}</p>
          </div>
        </div>
      )}
      </section>
    </>
  )
}

export default AdminDashboard
