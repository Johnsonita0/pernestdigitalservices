import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faHeart, faMapMarkerAlt, faSearch, faShoppingBag, faStar, faUser, faSignOutAlt, faChevronRight, faCog, faCreditCard, faTicketAlt, faClipboardList, faQuestionCircle, faMapPin, faLock, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../lib/supabase'
import { notifyToast } from '../lib/toast'

const prepareProfileImageFile = (file) => {
  if (!['image/png', 'image/webp'].includes(file.type)) return Promise.resolve(file)

  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d').drawImage(image, 0, 0)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl)
        if (!blob) {
          reject(new Error('Could not prepare this image for upload.'))
          return
        }
        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.9)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read this image.'))
    }
    image.src = objectUrl
  })
}

const getProfileImagePath = (storedValue) => {
  if (!storedValue) return ''
  const publicPathMarker = '/storage/v1/object/public/bank_prof/'

  if (storedValue.includes(publicPathMarker)) {
    return decodeURIComponent(storedValue.split(publicPathMarker)[1])
  }

  return storedValue.startsWith('http') ? '' : storedValue
}

const resolveProfileImageUrl = async (storedValue) => {
  const path = getProfileImagePath(storedValue)
  if (!path) return storedValue || ''

  const { data, error } = await supabase.storage
    .from('bank_prof')
    .createSignedUrl(path, 60 * 60)

  return error ? '' : data?.signedUrl || ''
}

function UserDashboard({ user, userType = 'customer', menuItems = [], favoriteItems = [], userOrders = [], onLogout, onRemoveFavorite, onViewMenu, onOpenAccount = null, onProfileImageChange, isAccountView = false, initialAccountSubmenu = null, initialExpandedOrderId = null }) {
  const [activeNav, setActiveNav] = useState(isAccountView ? 'account' : 'home')
  const [accountSubmenu, setAccountSubmenu] = useState(initialAccountSubmenu)
  const [expandedOrderId, setExpandedOrderId] = useState(initialExpandedOrderId)
  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.fullName || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
    preferences: user?.user_metadata?.preferences || 'No dietary preference set',
    deliveryNote: user?.user_metadata?.deliveryNote || 'Leave at the door if I am not available.',
    profileImageUrl: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.profile_image_url || '',
    profileImagePath: getProfileImagePath(user?.user_metadata?.profile_image_url),
  })
  const [loading, setLoading] = useState(false)
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false)
  const [pendingProfileImage, setPendingProfileImage] = useState(null)

  // Load profile data from database on component mount
  useEffect(() => {
    if (user?.id) {
      loadProfileData()
      loadOrders()
    }
  }, [user?.id])

  const loadOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            food_name,
            quantity,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError && ordersError.code !== 'PGRST116') {
        console.warn('Error loading orders:', ordersError)
      }

      if (ordersData) {
        setOrders(ordersData)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const handleProfileImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    if (!file.type.startsWith('image/')) {
      notifyToast('Please choose an image file.', 'warning')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notifyToast('Profile photos must be 5MB or smaller.', 'warning')
      return
    }

    if (pendingProfileImage?.previewUrl) {
      URL.revokeObjectURL(pendingProfileImage.previewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setPendingProfileImage({ file, previewUrl })
    event.target.value = ''
    notifyToast('Preview ready. Confirm when you are happy with the photo.', 'info')
  }

  const cancelProfileImageUpload = () => {
    if (pendingProfileImage?.previewUrl) {
      URL.revokeObjectURL(pendingProfileImage.previewUrl)
    }
    setPendingProfileImage(null)
  }

  const handleProfileImageUpload = async () => {
    if (!pendingProfileImage || !user?.id) return

    const { file, previewUrl } = pendingProfileImage

    try {
      setUploadingProfileImage(true)
      notifyToast('Uploading profile photo...', 'info')
      const uploadFile = await prepareProfileImageFile(file)
      const safeName = uploadFile.name.replace(/\s+/g, '_')
      const filePath = `${user.id}/profile/${Date.now()}-${safeName}`

      const { error } = await supabase.storage
        .from('bank_prof')
        .upload(filePath, uploadFile, { upsert: true })

      if (error) {
        throw new Error(error.message)
      }

      const { data: signedImage, error: signedImageError } = await supabase.storage
        .from('bank_prof')
        .createSignedUrl(filePath, 60 * 60)

      if (signedImageError || !signedImage?.signedUrl) {
        throw new Error(signedImageError?.message || 'Could not prepare the uploaded image for display.')
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          profile_image_url: filePath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      setProfile((current) => ({
        ...current,
        profileImageUrl: signedImage.signedUrl,
        profileImagePath: filePath,
      }))
      onProfileImageChange?.(signedImage.signedUrl)
      setPendingProfileImage(null)
      URL.revokeObjectURL(previewUrl)

      notifyToast('Profile photo uploaded successfully.', 'success')
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      setProfile((current) => ({
        ...current,
      }))
      URL.revokeObjectURL(previewUrl)
      notifyToast(`Profile photo upload failed: ${error.message}`, 'error')
    } finally {
      setUploadingProfileImage(false)
    }
  }

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
        const profileImageUrl = await resolveProfileImageUrl(profileData.profile_image_url)
        onProfileImageChange?.(profileImageUrl)
        setProfile((current) => ({
          ...current,
          fullName: profileData.full_name || current.fullName,
          phone: profileData.phone || current.phone,
          address: profileData.address || current.address,
          profileImageUrl: profileImageUrl || current.profileImageUrl,
          profileImagePath: getProfileImagePath(profileData.profile_image_url) || current.profileImagePath,
        }))
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
    if (uploadingProfileImage) {
      notifyToast('Please wait for the profile photo upload to finish.', 'warning')
      return
    }

    setLoading(true)

    try {
      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.fullName,
          phone: profile.phone,
          address: profile.address,
          profile_image_url: profile.profileImagePath || profile.profileImageUrl,
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

      notifyToast('Profile saved successfully.', 'success')
    } catch (error) {
      console.error('Error saving profile:', error)
      notifyToast(`Error: ${error.message}`, 'error')
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
              {profile.profileImageUrl ? (
                <img className="mobile-user-avatar" src={profile.profileImageUrl} alt="" />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
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
                          {profile.profileImageUrl ? (
                            <img src={profile.profileImageUrl} alt="Profile" />
                          ) : (
                            <FontAwesomeIcon icon={faUser} />
                          )}
                        </div>
                        <div>
                            <p className="mobile-greeting-label">{userType === 'admin' ? 'Admin account' : 'Customer account'}</p>
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
                    <div className="profile-photo-upload">
                      <div className="profile-photo-preview">
                        {pendingProfileImage?.previewUrl || profile.profileImageUrl ? (
                          <img
                            src={pendingProfileImage?.previewUrl || profile.profileImageUrl}
                            alt="Profile"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} />
                        )}
                      </div>

                      <div className="profile-photo-actions">
                        <label className="profile-photo-picker">
                        Upload profile photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageSelect}
                          disabled={uploadingProfileImage}
                        />
                        </label>
                        {pendingProfileImage && (
                          <div className="profile-photo-confirmation">
                            <span>Preview selected</span>
                            <div>
                              <button type="button" className="profile-photo-confirm" onClick={handleProfileImageUpload} disabled={uploadingProfileImage}>
                                {uploadingProfileImage ? 'Uploading...' : 'Use this photo'}
                              </button>
                              <button type="button" className="profile-photo-cancel" onClick={cancelProfileImageUpload} disabled={uploadingProfileImage}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

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

                    <button 
                      type="button" 
                      className="mobile-order-btn" 
                      onClick={handleProfileSave}
                      disabled={loading || uploadingProfileImage}
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

                  {accountSubmenu === 'orders' ? (
                    <div style={{ padding: '20px' }}>
                      {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                          <p style={{ fontSize: '1rem', marginBottom: '10px' }}>📋 No orders yet</p>
                          <p style={{ fontSize: '0.9rem' }}>Your orders will appear here</p>
                          <button 
                            type="button"
                            className="mobile-order-btn"
                            onClick={() => { setAccountSubmenu(null); onViewMenu(); }}
                            style={{ marginTop: '20px', width: '100%' }}
                          >
                            Start ordering
                          </button>
                        </div>
                      ) : (
                        orders.map((order) => {
                          const orderStatus = order.status || 'pending'
                          const statusSteps = orderStatus === 'pending_payment_confirmation' 
                            ? ['Awaiting payment confirmation', 'Confirmed', 'Preparing', 'On the way', 'Delivered']
                            : ['Confirmed', 'Preparing', 'On the way', 'Delivered']
                          const statusIndexMap = ['pending_payment_confirmation', 'pending', 'preparing', 'ready', 'delivered']
                          const statusIndex = statusIndexMap.indexOf(orderStatus)
                          const currentStep = statusIndex >= 0 ? statusIndex : 0
                          const isExpanded = expandedOrderId === order.id

                          return (
                            <div 
                              key={order.id}
                              style={{
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                padding: '16px',
                                marginBottom: '16px',
                                backgroundColor: '#fafafa'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#666' }}>
                                    Order #{order.id.slice(0, 8)}
                                  </p>
                                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#999' }}>
                                    {new Date(order.created_at).toLocaleDateString('en-NG', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div style={{
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  backgroundColor: orderStatus === 'pending_payment_confirmation' ? '#fed7aa' : orderStatus === 'pending' ? '#fef3c7' : orderStatus === 'preparing' ? '#dbeafe' : orderStatus === 'ready' ? '#dcfce7' : orderStatus === 'delivered' ? '#dcfce7' : '#f3e8ff',
                                  color: orderStatus === 'pending_payment_confirmation' ? '#b45309' : orderStatus === 'pending' ? '#92400e' : orderStatus === 'preparing' ? '#1e40af' : orderStatus === 'ready' ? '#166534' : orderStatus === 'delivered' ? '#166534' : '#6b21a8',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  textTransform: 'capitalize',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {orderStatus === 'pending_payment_confirmation' ? 'Awaiting payment confirmation' : orderStatus}
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                  <p style={{ margin: '0', fontSize: '0.85rem', color: '#666' }}>Total</p>
                                  <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: '700', color: '#ff6b35' }}>
                                    ₦{order.order_total.toLocaleString('en-NG')}
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #ff6b35',
                                    backgroundColor: 'transparent',
                                    color: '#ff6b35',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#ff6b35'; e.target.style.color = '#fff'; }}
                                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#ff6b35'; }}
                                >
                                  {isExpanded ? 'Hide details' : 'Track'}
                                </button>
                              </div>

                              {isExpanded && (
                                <div>
                                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                                    {order.order_items.map((item, idx) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.9rem' }}>
                                        <span>
                                          {item.food_name} <span style={{ color: '#999' }}>×{item.quantity}</span>
                                        </span>
                                        <span style={{ fontWeight: '600' }}>₦{(item.price * item.quantity).toLocaleString('en-NG')}</span>
                                      </div>
                                    ))}
                                  </div>

                                  <div style={{ margin: '16px 0' }}>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#666', fontWeight: '700' }}>Tracking</p>
                                    <div className="order-tracking-grid">
                                      {statusSteps.map((step, index) => {
                                        const isActive = index <= currentStep
                                        return (
                                          <div key={step} className="order-tracking-step" style={{
                                            background: isActive ? '#fff1eb' : '#f3f4f6',
                                            borderRadius: '8px',
                                            padding: '8px 6px',
                                            textAlign: 'center',
                                            fontSize: '0.7rem',
                                            color: isActive ? '#ff6b35' : '#6b7280',
                                            fontWeight: isActive ? 700 : 500,
                                            border: `1px solid ${isActive ? '#ffb899' : '#e5e7eb'}`
                                          }}>
                                            {step}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  <div style={{ marginBottom: '12px' }}>
                                    <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#666' }}>
                                      <strong>Delivery Address:</strong>
                                    </p>
                                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#333' }}>
                                      {order.delivery_address}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      <p>Coming soon...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mobile-greeting-row">
                <div>
                  <p className="mobile-greeting-label">{userType === 'admin' ? 'Admin account' : 'Customer account'} · {username}</p>
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

      </div>
    </div>
  )
}

export default UserDashboard
