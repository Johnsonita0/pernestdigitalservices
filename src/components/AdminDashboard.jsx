import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingBag, faComment, faUtensils, faToggleOn, faToggleOff, faStar, faUsers, faChevronRight, faPhone, faMapMarkerAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'

function AdminDashboard({ products, pendingTestimonials = [], onApproveTestimonial, onRejectTestimonial, user, onLogout, allUsers = [], allOrders = [], onCreateMenuItem }) {
  const [activeTab, setActiveTab] = useState('users')
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
  const [toast, setToast] = useState(null)

  // Get user orders
  const userOrders = selectedUser ? (selectedUser.orders || []) : allOrders
  const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone })
  }

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

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

              <div className="menu-form" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #e5d7c5', borderRadius: '16px', background: '#fffaf5' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden', background: '#f3efe9', border: '1px solid #e5d7c5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {menuForm.imageUrl ? (
                        <img src={menuForm.imageUrl} alt="Food preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#6b4f3c', fontSize: '0.8rem', fontWeight: 700 }}>Image</span>
                      )}
                    </div>
                    <label style={{ flex: 1, cursor: 'pointer', color: '#6b4f3c', fontWeight: 700 }}>
                      Upload food image
                      <input type="file" accept="image/*" onChange={handleMenuImageUpload} style={{ display: 'block', marginTop: '8px', width: '100%' }} />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={menuForm.title}
                    placeholder="Food title"
                    onChange={(event) => setMenuForm((current) => ({ ...current, title: event.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d9c7b2' }}
                  />
                  <textarea
                    value={menuForm.description}
                    placeholder="Description"
                    rows="3"
                    onChange={(event) => setMenuForm((current) => ({ ...current, description: event.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d9c7b2' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    <input
                      type="number"
                      value={menuForm.price}
                      placeholder="Price"
                      onChange={(event) => setMenuForm((current) => ({ ...current, price: event.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d9c7b2' }}
                    />
                    <input
                      type="text"
                      value={menuForm.tag}
                      placeholder="Tag"
                      onChange={(event) => setMenuForm((current) => ({ ...current, tag: event.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d9c7b2' }}
                    />
                    <input
                      type="text"
                      value={menuForm.badge}
                      placeholder="Badge"
                      onChange={(event) => setMenuForm((current) => ({ ...current, badge: event.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d9c7b2' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#4a352b' }}>
                      <input
                        type="checkbox"
                        checked={menuForm.available}
                        onChange={(event) => setMenuForm((current) => ({ ...current, available: event.target.checked }))}
                      />
                      Available
                    </label>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#4a352b' }}>
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

                  <button type="button" className="primary-btn" onClick={handleCreateMenuItem} disabled={uploadingImage}>
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
      </nav>
      </section>
    </>
  )
}

export default AdminDashboard
