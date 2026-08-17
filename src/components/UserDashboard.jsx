import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faShoppingBag, faSignOutAlt, faStar, faUser, faPhone, faMapMarkerAlt, faEnvelope, faPen, faLock, faSave, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons'

function UserDashboard({ user, favoriteItems = [], userOrders = [], onLogout, onAddFavorite, onRemoveFavorite, onViewMenu }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [editFormData, setEditFormData] = useState({
    fullName: user?.user_metadata?.fullName || '',
    username: user?.user_metadata?.username || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saveMessage, setSaveMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    // Validate form
    if (!editFormData.fullName.trim()) {
      setSaveMessage({ type: 'error', text: 'Full name is required' })
      return
    }
    if (!editFormData.username.trim()) {
      setSaveMessage({ type: 'error', text: 'Username is required' })
      return
    }
    if (!editFormData.phone.trim()) {
      setSaveMessage({ type: 'error', text: 'Phone number is required' })
      return
    }
    if (!editFormData.address.trim()) {
      setSaveMessage({ type: 'error', text: 'Delivery address is required' })
      return
    }

    // Simulate saving (in real app, would update user metadata in Supabase)
    setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
    setIsEditing(false)
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    // Validate
    if (!passwordForm.currentPassword.trim()) {
      setPasswordMessage({ type: 'error', text: 'Current password is required' })
      return
    }
    if (!passwordForm.newPassword.trim()) {
      setPasswordMessage({ type: 'error', text: 'New password is required' })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    // Simulate changing password (in real app, would call Supabase auth.updateUser)
    setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
    setShowPasswordForm(false)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setPasswordMessage(''), 3000)
  }

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  const fullName = user?.user_metadata?.fullName || 'Not provided'
  const phone = user?.user_metadata?.phone || 'Not provided'
  const address = user?.user_metadata?.address || 'Not provided'
  const email = user?.email || 'Not provided'

  const pendingOrders = userOrders.filter((order) => order.status === 'pending')
  const completedOrders = userOrders.filter((order) => order.status === 'delivered')
  const latestOrder = userOrders[0]

  const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

  return (
    <div className="page-shell">
      <div className="container">
        <div className="user-dashboard-header">
          <div>
            <h1>Welcome, {username}!</h1>
            <p className="user-email">{user?.email}</p>
          </div>
          <button type="button" className="ghost-btn" onClick={onLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <p className="stat-label">Pending Orders</p>
            <p className="stat-value">{pendingOrders.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Completed Orders</p>
            <p className="stat-value">{completedOrders.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Favorite Meals</p>
            <p className="stat-value">{favoriteItems.length}</p>
          </div>
        </div>

        <div className="dashboard-tabs">
          <div className="tab-navigation">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FontAwesomeIcon icon={faUser} />
              <span>Overview</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FontAwesomeIcon icon={faUser} />
              <span>Profile</span>
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
              className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              <FontAwesomeIcon icon={faHeart} />
              <span>Favorites</span>
              {favoriteItems.length > 0 && <span className="badge">{favoriteItems.length}</span>}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-layout">
                <div className="overview-hero">
                  <div>
                    <p className="eyebrow dark">Your account</p>
                    <h3>Welcome back, {username}.</h3>
                    <p className="overview-subtitle">
                      {pendingOrders.length > 0
                        ? `You have ${pendingOrders.length} active order${pendingOrders.length > 1 ? 's' : ''} in progress.`
                        : 'Everything is looking fresh and ready for your next craving.'}
                    </p>
                  </div>
                  <div className="overview-status">
                    <span className="status-chip">{pendingOrders.length > 0 ? 'Order in progress' : 'Ready to order'}</span>
                  </div>
                </div>

                <div className="overview-grid">
                  <div className="overview-card accent">
                    <p className="mini-label">Pending orders</p>
                    <strong>{pendingOrders.length}</strong>
                    <span>Current kitchen queue</span>
                  </div>
                  <div className="overview-card">
                    <p className="mini-label">Completed</p>
                    <strong>{completedOrders.length}</strong>
                    <span>Meals delivered</span>
                  </div>
                  <div className="overview-card">
                    <p className="mini-label">Favorite meals</p>
                    <strong>{favoriteItems.length}</strong>
                    <span>Saved for later</span>
                  </div>
                </div>

                <div className="summary-grid">
                  <div className="summary-panel">
                    <h4>Delivery snapshot</h4>
                    <div className="summary-row">
                      <span>Primary address</span>
                      <strong>{address}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Contact</span>
                      <strong>{phone}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Latest order</span>
                      <strong>
                        {latestOrder ? `${formatNaira(latestOrder.total)} • ${new Date(latestOrder.date).toLocaleDateString()}` : 'No orders yet'}
                      </strong>
                    </div>
                  </div>

                  <div className="summary-panel">
                    <h4>Quick actions</h4>
                    <div className="quick-action-list">
                      <button type="button" className="quick-action" onClick={onViewMenu}>
                        Browse menu
                      </button>
                      <button type="button" className="quick-action" onClick={() => setActiveTab('orders')}>
                        View order history
                      </button>
                      <button type="button" className="quick-action" onClick={() => setActiveTab('favorites')}>
                        Open favorites
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <>
                <h3>Account Management</h3>
                
                <div className="account-management">
                  {/* Edit Profile Section */}
                  <div className="management-card">
                    <div className="card-header">
                      <h4>
                        <FontAwesomeIcon icon={faUser} /> Personal Information
                      </h4>
                      {!isEditing && (
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setIsEditing(true)}
                        >
                          <FontAwesomeIcon icon={faPen} />
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {saveMessage && (
                      <div className={`alert alert-${saveMessage.type}`}>
                        {saveMessage.type === 'success' && <FontAwesomeIcon icon={faCheck} />}
                        {saveMessage.text}
                      </div>
                    )}

                    {!isEditing ? (
                      <div className="profile-display">
                        <div className="info-row">
                          <div className="info-item">
                            <label>Full Name</label>
                            <p>{editFormData.fullName || 'Not provided'}</p>
                          </div>
                          <div className="info-item">
                            <label>Username</label>
                            <p>@{editFormData.username || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="info-row">
                          <div className="info-item">
                            <label>
                              <FontAwesomeIcon icon={faEnvelope} /> Email Address
                            </label>
                            <p>{email}</p>
                            <small>This cannot be changed</small>
                          </div>
                          <div className="info-item">
                            <label>
                              <FontAwesomeIcon icon={faPhone} /> Phone Number
                            </label>
                            <p>{editFormData.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="info-row">
                          <div className="info-item full">
                            <label>
                              <FontAwesomeIcon icon={faMapMarkerAlt} /> Delivery Address
                            </label>
                            <p>{editFormData.address || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveProfile} className="profile-form">
                        <div className="form-group">
                          <label>Full Name *</label>
                          <input
                            type="text"
                            value={editFormData.fullName}
                            onChange={(e) => handleEditChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Username *</label>
                          <input
                            type="text"
                            value={editFormData.username}
                            onChange={(e) => handleEditChange('username', e.target.value)}
                            placeholder="Enter your username"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            <FontAwesomeIcon icon={faPhone} /> Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={editFormData.phone}
                            onChange={(e) => handleEditChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            <FontAwesomeIcon icon={faMapMarkerAlt} /> Delivery Address *
                          </label>
                          <textarea
                            value={editFormData.address}
                            onChange={(e) => handleEditChange('address', e.target.value)}
                            placeholder="Enter your delivery address"
                            rows="3"
                            required
                          />
                        </div>

                        <div className="form-actions">
                          <button type="submit" className="primary-btn">
                            <FontAwesomeIcon icon={faSave} />
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => {
                              setIsEditing(false)
                              setEditFormData({
                                fullName: user?.user_metadata?.fullName || '',
                                username: user?.user_metadata?.username || '',
                                phone: user?.user_metadata?.phone || '',
                                address: user?.user_metadata?.address || '',
                              })
                            }}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Change Password Section */}
                  <div className="management-card">
                    <div className="card-header">
                      <h4>
                        <FontAwesomeIcon icon={faLock} /> Security
                      </h4>
                      {!showPasswordForm && (
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setShowPasswordForm(true)}
                        >
                          <FontAwesomeIcon icon={faLock} />
                          Change Password
                        </button>
                      )}
                    </div>

                    {passwordMessage && (
                      <div className={`alert alert-${passwordMessage.type}`}>
                        {passwordMessage.type === 'success' && <FontAwesomeIcon icon={faCheck} />}
                        {passwordMessage.text}
                      </div>
                    )}

                    {showPasswordForm && (
                      <form onSubmit={handleChangePassword} className="password-form">
                        <div className="form-group">
                          <label>Current Password *</label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                currentPassword: e.target.value,
                              }))
                            }
                            placeholder="Enter your current password"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>New Password *</label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }))
                            }
                            placeholder="Enter new password (min 6 characters)"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Confirm New Password *</label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            placeholder="Confirm new password"
                            required
                          />
                        </div>

                        <div className="form-actions">
                          <button type="submit" className="primary-btn">
                            <FontAwesomeIcon icon={faCheck} />
                            Update Password
                          </button>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => {
                              setShowPasswordForm(false)
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              })
                            }}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {!showPasswordForm && (
                      <div className="security-info">
                        <p>
                          <strong>Password Status:</strong> Your account is secured with a password.
                        </p>
                        <p className="security-tip">
                          💡 <strong>Tip:</strong> Change your password regularly to keep your account secure.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Account Settings Section */}
                  <div className="management-card">
                    <div className="card-header">
                      <h4>Account Settings</h4>
                    </div>
                    <div className="settings-info">
                      <div className="setting-item">
                        <div className="setting-label">
                          <h5>Account Status</h5>
                          <p>Your account is active and in good standing</p>
                        </div>
                        <span className="status-badge active">✓ Active</span>
                      </div>

                      <div className="setting-item">
                        <div className="setting-label">
                          <h5>Two-Factor Authentication</h5>
                          <p>Add an extra layer of security to your account</p>
                        </div>
                        <button type="button" className="secondary-btn disabled" disabled>
                          Coming Soon
                        </button>
                      </div>

                      <div className="setting-item">
                        <div className="setting-label">
                          <h5>Email Notifications</h5>
                          <p>Manage your notification preferences</p>
                        </div>
                        <button type="button" className="secondary-btn disabled" disabled>
                          Coming Soon
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <>
                <h3>Your Orders</h3>

                {userOrders.length === 0 ? (
                  <div className="empty-state">
                    <p>No orders yet. Start ordering delicious meals!</p>
                    <button type="button" className="primary-btn" onClick={onViewMenu}>
                      Browse menu
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="orders-section">
                      <h4>Pending Orders</h4>
                      {pendingOrders.length === 0 ? (
                        <p className="empty-message">No pending orders</p>
                      ) : (
                        <div className="orders-list">
                          {pendingOrders.map((order) => (
                            <div key={order.id} className="order-card">
                              <div className="order-header">
                                <span className="order-id">Order #{order.id}</span>
                                <span className="status-badge pending">Preparing</span>
                              </div>
                              <p className="order-date">Ordered on {new Date(order.date).toLocaleDateString()}</p>
                              <div className="order-details">
                                <p>
                                  <strong>Items:</strong> {order.items.length} item(s)
                                </p>
                                <p>
                                  <strong>Total:</strong> {formatNaira(order.total)}
                                </p>
                                <p>
                                  <strong>Contact:</strong> {order.contactNumber}
                                </p>
                                <p>
                                  <strong>Address:</strong> {order.address}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="orders-section">
                      <h4>Completed Orders</h4>
                      {completedOrders.length === 0 ? (
                        <p className="empty-message">No completed orders</p>
                      ) : (
                        <div className="orders-list">
                          {completedOrders.map((order) => (
                            <div key={order.id} className="order-card completed">
                              <div className="order-header">
                                <span className="order-id">Order #{order.id}</span>
                                <span className="status-badge delivered">Delivered</span>
                              </div>
                              <p className="order-date">Ordered on {new Date(order.date).toLocaleDateString()}</p>
                              <div className="order-details">
                                <p>
                                  <strong>Items:</strong> {order.items.length} item(s)
                                </p>
                                <p>
                                  <strong>Total:</strong> {formatNaira(order.total)}
                                </p>
                                <p>
                                  <strong>Contact:</strong> {order.contactNumber}
                                </p>
                                <p>
                                  <strong>Address:</strong> {order.address}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'favorites' && (
              <>
                <h3>Your Favorite Meals</h3>

                {favoriteItems.length === 0 ? (
                  <div className="empty-state">
                    <p>No favorite meals yet. Explore our menu and add your favorites!</p>
                    <button type="button" className="primary-btn" onClick={onViewMenu}>
                      Browse menu
                    </button>
                  </div>
                ) : (
                  <div className="favorites-grid">
                    {favoriteItems.map((item) => (
                      <div key={item.id} className="favorite-card">
                        <div className="favorite-image">
                          <img src={item.image} alt={item.title} />
                          <button
                            type="button"
                            className="favorite-btn active"
                            onClick={() => onRemoveFavorite(item.id)}
                            title="Remove from favorites"
                          >
                            <FontAwesomeIcon icon={faHeart} />
                          </button>
                        </div>
                        <div className="favorite-info">
                          <h4>{item.title}</h4>
                          <p className="favorite-desc">{item.description}</p>
                          <div className="favorite-footer">
                            <span className="price">{formatNaira(item.price)}</span>
                            {item.rating && (
                              <span className="rating">
                                <FontAwesomeIcon icon={faStar} /> {item.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
