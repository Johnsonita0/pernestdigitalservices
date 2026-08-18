import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faHeart, faMapMarkerAlt, faSearch, faShoppingBag, faStar, faUser, faSignOutAlt, faChevronRight, faCog, faCreditCard, faTicketAlt, faClipboardList, faQuestionCircle, faMapPin, faLock, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { menuItems } from '../data/menu'
import { supabase } from '../lib/supabase'

function UserDashboard({ user, favoriteItems = [], userOrders = [], onLogout, onRemoveFavorite, onViewMenu, onOpenAccount = null, isAccountView = false }) {
  const [activeNav, setActiveNav] = useState(isAccountView ? 'account' : 'home')
  const [accountSubmenu, setAccountSubmenu] = useState(null)
  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.fullName || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
    preferences: user?.user_metadata?.preferences || 'No dietary preference set',
    deliveryNote: user?.user_metadata?.deliveryNote || 'Leave at the door if I am not available.',
  })
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Load profile data from database on component mount
  useEffect(() => {
    if (user?.id) {
      loadProfileData()
    }
  }, [user?.id])

  const loadProfileData = async () => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Error loading profile:', profileError)
      }

      if (profileData) {
        setProfile({
          fullName: profileData.full_name || profile.fullName,
          phone: profileData.phone || profile.phone,
          address: profileData.address || profile.address,
          preferences: profile.preferences,
          deliveryNote: profile.deliveryNote,
        })
      }

      // Fetch preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.warn('Error loading preferences:', prefsError)
      }

      if (prefsData) {
        setProfile((curr) => ({
          ...curr,
          preferences: prefsData.food_preferences || curr.preferences,
          deliveryNote: prefsData.delivery_notes || curr.deliveryNote,
        }))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  const email = user?.email || 'user@example.com'
  const location = user?.user_metadata?.address || 'Old City, Hyderabad'
  const quickMeals = favoriteItems.length ? favoriteItems.slice(0, 5) : menuItems.slice(0, 5)
  const topPicks = favoriteItems.length ? favoriteItems.slice(0, 2) : menuItems.slice(0, 2)

  const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

  const handleProfileSave = async () => {
    setLoading(true)
    setSaveMessage('')

    try {
      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.fullName,
          phone: profile.phone,
          address: profile.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Update preferences in user_preferences table
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .update({
          food_preferences: profile.preferences,
          delivery_notes: profile.deliveryNote,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (prefsError) {
        throw new Error(prefsError.message)
      }

      setSaveMessage('✅ Profile saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mobile-dashboard-shell">
      <div className="mobile-dashboard-phone">
        <header className="mobile-dashboard-header">
          <div className="mobile-location-row">
            <div className="mobile-location-pin">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="mobile-location-copy">
              <strong>{username}</strong>
            </div>
            <button type="button" className="mobile-bell-btn" aria-label="Notifications">
              <FontAwesomeIcon icon={faBell} />
            </button>
          </div>

          <label className="mobile-search-bar" aria-label="Search food menu">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search for dishes or restaurants"
              aria-label="Search food menu"
              disabled
            />
          </label>
        </header>

        <main className="mobile-dashboard-main">
          {activeNav === 'account' ? (
            <div className="mobile-account-profile-wrap">
              {!accountSubmenu ? (
                <>
                  {/* Profile Card */}
                  <div className="mobile-account-header">
                    <div className="mobile-profile-card">
                      <div className="mobile-profile-header">
                        <div className="mobile-profile-avatar">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div>
                          <p className="mobile-greeting-label">Hello</p>
                          <strong>{username}</strong>
                          <small>{email}</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Menu Items */}
                  <div className="mobile-account-menu">
                    <button 
                      type="button" 
                      className="mobile-account-menu-item"
                      onClick={() => setAccountSubmenu('orders')}
                    >
                      <div className="menu-item-icon">
                        <FontAwesomeIcon icon={faShoppingBag} />
                      </div>
                      <div className="menu-item-text">
                        <span>My Orders</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                    </button>

                    <button 
                      type="button" 
                      className="mobile-account-menu-item"
                      onClick={() => setAccountSubmenu('saved')}
                    >
                      <div className="menu-item-icon">
                        <FontAwesomeIcon icon={faHeart} />
                      </div>
                      <div className="menu-item-text">
                        <span>Saved Items</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                    </button>

                    <button 
                      type="button" 
                      className="mobile-account-menu-item"
                      onClick={() => setAccountSubmenu('vouchers')}
                    >
                      <div className="menu-item-icon">
                        <FontAwesomeIcon icon={faTicketAlt} />
                      </div>
                      <div className="menu-item-text">
                        <span>Vouchers</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                    </button>

                    <button 
                      type="button" 
                      className="mobile-account-menu-item"
                      onClick={() => setAccountSubmenu('faq')}
                    >
                      <div className="menu-item-icon">
                        <FontAwesomeIcon icon={faQuestionCircle} />
                      </div>
                      <div className="menu-item-text">
                        <span>FAQs</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                    </button>

                    <button 
                      type="button" 
                      className="mobile-account-menu-item"
                      onClick={() => setAccountSubmenu('notifications')}
                    >
                      <div className="menu-item-icon">
                        <FontAwesomeIcon icon={faBell} />
                      </div>
                      <div className="menu-item-text">
                        <span>Notifications</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                    </button>

                    <button 
                      type="button" 
                      className="mobile-account-menu-item"
                      onClick={() => setAccountSubmenu('payment')}
                    >
                      <div className="menu-item-icon">
                        <FontAwesomeIcon icon={faCreditCard} />
                      </div>
                      <div className="menu-item-text">
                        <span>Payment Information</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                    </button>
                  </div>

                  {/* Settings Section */}
                  <div className="mobile-account-section">
                    <div className="mobile-account-section-title">MY SETTINGS</div>
                    <div className="mobile-account-menu">
                      <button 
                        type="button" 
                        className="mobile-account-menu-item"
                        onClick={() => setAccountSubmenu('profile')}
                      >
                        <div className="menu-item-icon">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div className="menu-item-text">
                          <span>My Information</span>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                      </button>

                      <button 
                        type="button" 
                        className="mobile-account-menu-item"
                        onClick={() => setAccountSubmenu('address')}
                      >
                        <div className="menu-item-icon">
                          <FontAwesomeIcon icon={faMapPin} />
                        </div>
                        <div className="menu-item-text">
                          <span>Address Book</span>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                      </button>

                      <button 
                        type="button" 
                        className="mobile-account-menu-item"
                        onClick={() => setAccountSubmenu('password')}
                      >
                        <div className="menu-item-icon">
                          <FontAwesomeIcon icon={faLock} />
                        </div>
                        <div className="menu-item-text">
                          <span>Change Password</span>
                        </div>
                        <FontAwesomeIcon icon={faChevronRight} className="menu-item-arrow" />
                      </button>

                      <button 
                        type="button" 
                        className="mobile-account-menu-item danger"
                        onClick={() => setAccountSubmenu('delete')}
                      >
                        <div className="menu-item-icon">
                          <FontAwesomeIcon icon={faTrash} />
                        </div>
                        <div className="menu-item-text">
                          <span>Delete my Account and Data</span>
                        </div>
                        <FontAwesomeIcon icon={faPencilAlt} className="menu-item-icon-right" />
                      </button>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="mobile-account-footer">
                    <button 
                      type="button" 
                      className="mobile-account-logout"
                      onClick={onLogout}
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : accountSubmenu === 'profile' ? (
                <div className="mobile-account-submenu">
                  <div className="mobile-submenu-header">
                    <button 
                      type="button" 
                      className="mobile-submenu-back"
                      onClick={() => setAccountSubmenu(null)}
                    >
                      ← Back
                    </button>
                    <h2>My Information</h2>
                  </div>

                  <div className="mobile-profile-form">
                    <label>
                      Full name
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                      />
                    </label>
                    <label>
                      Email
                      <input type="email" value={email} disabled />
                    </label>
                    <label>
                      Food preferences
                      <input
                        type="text"
                        value={profile.preferences}
                        onChange={(event) => setProfile((current) => ({ ...current, preferences: event.target.value }))}
                      />
                    </label>
                    <label>
                      Delivery note
                      <textarea
                        rows="3"
                        value={profile.deliveryNote}
                        onChange={(event) => setProfile((current) => ({ ...current, deliveryNote: event.target.value }))}
                      />
                    </label>

                    {saveMessage && (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        backgroundColor: saveMessage.includes('✅') ? '#f0fdf4' : '#fef2f2',
                        color: saveMessage.includes('✅') ? '#166534' : '#991b1b',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}>
                        {saveMessage}
                      </div>
                    )}

                    <button 
                      type="button" 
                      className="mobile-order-btn" 
                      onClick={handleProfileSave}
                      disabled={loading}
                      style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              ) : accountSubmenu === 'address' ? (
                <div className="mobile-account-submenu">
                  <div className="mobile-submenu-header">
                    <button 
                      type="button" 
                      className="mobile-submenu-back"
                      onClick={() => setAccountSubmenu(null)}
                    >
                      ← Back
                    </button>
                    <h2>Address Book</h2>
                  </div>

                  <div className="mobile-profile-form">
                    <label>
                      Home Address
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))}
                        placeholder="Enter your home address"
                      />
                    </label>

                    {saveMessage && (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        backgroundColor: saveMessage.includes('✅') ? '#f0fdf4' : '#fef2f2',
                        color: saveMessage.includes('✅') ? '#166534' : '#991b1b',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}>
                        {saveMessage}
                      </div>
                    )}

                    <button 
                      type="button" 
                      className="mobile-order-btn" 
                      onClick={handleProfileSave}
                      disabled={loading}
                      style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? 'Saving...' : 'Save address'}
                    </button>
                  </div>
                </div>
              ) : accountSubmenu === 'password' ? (
                <div className="mobile-account-submenu">
                  <div className="mobile-submenu-header">
                    <button 
                      type="button" 
                      className="mobile-submenu-back"
                      onClick={() => setAccountSubmenu(null)}
                    >
                      ← Back
                    </button>
                    <h2>Change Password</h2>
                  </div>

                  <div className="mobile-profile-form">
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                      To change your password, you will receive a password reset link via email.
                    </p>
                    <button 
                      type="button" 
                      className="mobile-order-btn"
                    >
                      Send Password Reset Email
                    </button>
                  </div>
                </div>
              ) : accountSubmenu === 'delete' ? (
                <div className="mobile-account-submenu">
                  <div className="mobile-submenu-header">
                    <button 
                      type="button" 
                      className="mobile-submenu-back"
                      onClick={() => setAccountSubmenu(null)}
                    >
                      ← Back
                    </button>
                    <h2>Delete Account</h2>
                  </div>

                  <div className="mobile-profile-form">
                    <div style={{
                      padding: '15px',
                      borderRadius: '12px',
                      backgroundColor: '#fef2f2',
                      borderLeft: '4px solid #dc2626',
                      marginBottom: '20px'
                    }}>
                      <p style={{ color: '#991b1b', margin: 0 }}>
                        <strong>⚠️ Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="mobile-order-btn" 
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      Delete my account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mobile-account-submenu">
                  <div className="mobile-submenu-header">
                    <button 
                      type="button" 
                      className="mobile-submenu-back"
                      onClick={() => setAccountSubmenu(null)}
                    >
                      ← Back
                    </button>
                    <h2>{accountSubmenu === 'orders' ? 'My Orders' : accountSubmenu === 'saved' ? 'Saved Items' : accountSubmenu === 'vouchers' ? 'Vouchers' : accountSubmenu === 'faq' ? 'FAQs' : accountSubmenu === 'notifications' ? 'Notifications' : 'Payment Information'}</h2>
                  </div>

                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    <p>Coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mobile-greeting-row">
                <div>
                  <p className="mobile-greeting-label">Hi, {username}</p>
                  <h1>What are you craving?</h1>
                </div>
                <button type="button" className="mobile-logout-btn" onClick={onLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                </button>
              </div>

              <div className="mobile-food-row">
            {quickMeals.map((item, index) => (
              <div key={item.id || index} className="mobile-food-pill">
                <img src={item.image} alt={item.title} />
                <span>{item.title.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div className="mobile-section-head">
            <h2>Top Picks Near You</h2>
            <button type="button" className="mobile-link-btn" onClick={onViewMenu}>
              See all →
            </button>
          </div>

          <div className="mobile-restaurant-list">
            {topPicks.map((item, index) => (
              <article key={item.id || index} className="mobile-restaurant-card">
                <img src={item.image} alt={item.title} />
                <div className="mobile-restaurant-meta">
                  <div className="mobile-restaurant-row">
                    <h3>{item.title}</h3>
                    <div className="mobile-favorite-mini">
                      <button
                        type="button"
                        className="mini-favorite-btn active"
                        onClick={() => onRemoveFavorite?.(item.id)}
                        aria-label="Remove favorite"
                      >
                        <FontAwesomeIcon icon={faHeart} />
                      </button>
                    </div>
                  </div>
                  <p>{item.description}</p>
                  <div className="mobile-rating-row">
                    <span className="mobile-rating">
                      <FontAwesomeIcon icon={faStar} /> 4.2
                    </span>
                    <span>•</span>
                    <span>25–30 mins</span>
                  </div>
                  <div className="mobile-price-row">
                    <strong>{formatNaira(item.price)}</strong>
                    <button type="button" className="mobile-order-btn" onClick={onViewMenu}>
                      Order
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

              <div className="mobile-section-head compact">
                <h2>Saved Favorites</h2>
              </div>

              <div className="mobile-favorites-strip">
                {quickMeals.slice(0, 3).map((item, index) => (
                  <div key={item.id || index} className="mobile-favorite-tile">
                    <img src={item.image} alt={item.title} />
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        <nav className="mobile-bottom-nav dashboard-bottom-nav" aria-label="Mobile navigation">
          <button type="button" className={`mobile-nav-btn ${activeNav === 'home' ? 'active' : ''}`} onClick={() => setActiveNav('home')}>
            <span className="mobile-nav-icon">🏠</span>
            <span>Home</span>
          </button>
          <button type="button" className={`mobile-nav-btn ${activeNav === 'search' ? 'active' : ''}`} onClick={() => setActiveNav('search')}>
            <span className="mobile-nav-icon">🔍</span>
            <span>Search</span>
          </button>
          <button type="button" className={`mobile-nav-btn ${activeNav === 'menu' ? 'active' : ''}`} onClick={() => { setActiveNav('menu'); onViewMenu(); }}>
            <span className="mobile-nav-icon">📋</span>
            <span>Menu</span>
          </button>
          <button type="button" className={`mobile-nav-btn ${activeNav === 'cart' ? 'active' : ''}`} onClick={() => setActiveNav('cart')}>
            <span className="mobile-nav-icon">🛒</span>
            <span>Cart</span>
          </button>
          <button type="button" className={`mobile-nav-btn ${activeNav === 'account' ? 'active' : ''}`} onClick={() => {
            setActiveNav('account')
            onOpenAccount?.()
          }}>
            <span className="mobile-nav-icon">👤</span>
            <span>Account</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default UserDashboard
