import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import Story from './components/Story'
import FeaturedDishes from './components/FeaturedDishes'
import Shop from './components/Shop'
import AdminDashboard from './components/AdminDashboard'
import RiderDashboard from './components/RiderDashboard'
import TestimonialForm from './components/TestimonialForm'
import LoginPage from './components/LoginPage'
import SignUpPage from './components/SignUpPage'
import UserDashboard from './components/UserDashboard'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { initializePaystackPayment } from './lib/payment'
import { notifyToast } from './lib/toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faSearch, faUser } from '@fortawesome/free-solid-svg-icons'
import { faFacebookF, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

const ADMIN_USER_ID = '58876079-3e57-4b35-9a54-b7f3d00a18c7'
const ADMIN_EMAIL = 'admin@trophysip.com'
const RIDER_USER_ID = '054bb3f4-feb1-45b6-bd0c-0bede0a24e9d'
const BROWSER_NOTIFICATION_PROMPT_KEY = 'trophy-browser-notification-prompted'
const CART_STORAGE_KEY = 'trophy-cart-items'
const getProofStorageKey = (userId) => `trophy-proof-of-payment-${userId || 'guest'}`

const resolveStoredProfileImageUrl = async (storedValue) => {
  if (!storedValue) return ''

  const publicPathMarker = '/storage/v1/object/public/bank_prof/'
  const path = storedValue.includes(publicPathMarker)
    ? decodeURIComponent(storedValue.split(publicPathMarker)[1])
    : storedValue.startsWith('http')
      ? ''
      : storedValue

  if (!path) return storedValue

  const { data, error } = await supabase.storage
    .from('bank_prof')
    .createSignedUrl(path, 60 * 60)

  return error ? '' : data?.signedUrl || ''
}

const isAdminUser = (authUser) => {
  if (!authUser) return false

  const emailLower = authUser.email?.toLowerCase?.() || ''
  const role = authUser.user_metadata?.role || authUser.app_metadata?.role || ''

  return (
    authUser.id === ADMIN_USER_ID ||
    emailLower === ADMIN_EMAIL.toLowerCase() ||
    role === 'admin' ||
    authUser.user_metadata?.is_admin === true ||
    authUser.app_metadata?.is_admin === true
  )
}

const resolveUserType = async (authUser) => {
  if (!authUser) return 'customer'

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error) {
    console.warn('Unable to verify account type:', error)
  }

  if (data?.is_admin || isAdminUser(authUser)) return 'admin'
  return data?.role === 'rider' && authUser.id === RIDER_USER_ID ? 'rider' : 'customer'
}

const faqItems = [
  {
    question: 'Do you offer delivery in Lagos?',
    answer: 'Yes. We deliver across select zones in Lagos, with fast turnaround for lunch, dinner, and family orders.',
  },
  {
    question: 'Can I reserve for a private event?',
    answer: 'Absolutely. We host intimate dinners, family celebrations, and small group gatherings with tailored menu options.',
  },
  {
    question: 'Do you make menu adjustments for dietary needs?',
    answer: 'We can adapt many dishes for vegetarian, lighter, or spice-preference requests based on availability.',
  },
  {
    question: 'What is your busiest time?',
    answer: 'Evenings and weekends are busiest, so booking ahead is recommended if you plan a special table reservation.',
  },
]

const testimonials = [
  {
    name: 'Chika A.',
    role: 'Food blogger',
    rating: 5,
    text: 'The suya bowl was rich, flavourful, and beautifully plated. You can feel the care in every bite.',
  },
  {
    name: 'Tunde M.',
    role: 'Family guest',
    rating: 5,
    text: 'The atmosphere is warm, the service feels personal, and the menu seriously delivers comfort food with flair.',
  },
  {
    name: 'Ife O.',
    role: 'Event host',
    rating: 5,
    text: 'We booked for a small family gathering and the food tasted incredible. Everyone asked for the recipe ideas afterwards.',
  },
]

function App() {
  const [view, setView] = useState('home')
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === 'undefined') return []

    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
      return storedCart ? JSON.parse(storedCart) : []
    } catch {
      return []
    }
  })
  const [activeFaq, setActiveFaq] = useState(0)
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    contactNumber: '',
    address: '',
    notes: '',
    paymentMethod: 'paystack',
    proofOfPayment: null,
    proofOfPaymentUrl: '',
    proofOfPaymentFilename: '',
    proofOfPaymentMimeType: '',
    proofOfPaymentSize: null,
  })
  const [pendingTestimonials, setPendingTestimonials] = useState([])
  const [approvedTestimonials, setApprovedTestimonials] = useState(testimonials)
  const [testimonialSliderIndex, setTestimonialSliderIndex] = useState(0)
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState('customer')
  const [loading, setLoading] = useState(true)
  const [favoriteItems, setFavoriteItems] = useState([])
  const [userOrders, setUserOrders] = useState([])
  const [menuCatalog, setMenuCatalog] = useState([])
  const [authView, setAuthView] = useState('login') // 'login' or 'signup'
  const [allUsers, setAllUsers] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [riderOrders, setRiderOrders] = useState([])
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileAccount, setShowMobileAccount] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)
  const [orderToTrackId, setOrderToTrackId] = useState(null)
  const [mobileAuthView, setMobileAuthView] = useState('login') // 'login', 'signup', or 'forgot'
  const [toast, setToast] = useState(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    const handleToast = (event) => {
      setToast({
        id: Date.now(),
        message: event.detail?.message || '',
        tone: event.detail?.tone || 'info',
      })
    }

    window.addEventListener('trophy:toast', handleToast)
    return () => window.removeEventListener('trophy:toast', handleToast)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const currentPermission = window.Notification.permission
    const hasPrompted = window.localStorage.getItem(BROWSER_NOTIFICATION_PROMPT_KEY) === 'true'

    if (currentPermission !== 'default' || hasPrompted) return

    window.localStorage.setItem(BROWSER_NOTIFICATION_PROMPT_KEY, 'true')
    window.Notification.requestPermission().catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) {
      setNotifications([])
      return undefined
    }

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.warn('Unable to load notifications:', error)
        return
      }

      setNotifications(data || [])
    }

    loadNotifications()

    const notificationChannel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setNotifications((current) => [payload.new, ...current].slice(0, 50))
          notifyToast(payload.new.title || 'New notification', 'info')
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification(payload.new.title || 'Trophy update', { body: payload.new.message || '' })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationChannel)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) {
      setProfileImageUrl('')
      return undefined
    }

    let cancelled = false

    const loadProfileImage = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_image_url')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled || error) return

      const imageUrl = await resolveStoredProfileImageUrl(data?.profile_image_url)
      if (!cancelled) setProfileImageUrl(imageUrl)
    }

    loadProfileImage()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      const resolvedUserType = await resolveUserType(authUser)
      setUserType(resolvedUserType)
      if (authUser && resolvedUserType !== 'customer') {
        const nextRoute = resolvedUserType === 'rider' ? '/rider' : '/admin'
        setView(resolvedUserType)
        window.history.pushState({}, '', nextRoute)
      }
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          resolveUserType(session.user).then(setUserType)
        } else {
          setUserType('customer')
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadMenuCatalog = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error loading menu items:', error)
        return
      }

      const persistedItems = (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        name: item.title,
        description: item.description,
        price: Number(item.price) || 0,
        tag: item.tag || 'Chef special',
        badge: item.badge || 'New',
        image: item.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
        createdAt: item.created_at,
        featured: Boolean(item.featured),
        feature: Boolean(item.featured),
        available: Boolean(item.available),
      }))

      setMenuCatalog(persistedItems)
    }

    loadMenuCatalog()
  }, [user?.id, dashboardRefreshKey])

  useEffect(() => {
    if (!isSupabaseConfigured || userType !== 'admin' || !user?.id) return

    const loadAdminUsers = async () => {
      const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, email, phone, address, profile_image_url, is_admin, created_at')
          .eq('is_admin', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('id, user_id, order_total, status, created_at, order_items(*)')
          .order('created_at', { ascending: false }),
      ])

      if (profilesError || ordersError) {
        console.warn('Error loading admin users and order counts:', profilesError || ordersError)
        return
      }

      const ordersByUser = (orders || []).reduce((grouped, order) => {
        const userOrders = grouped[order.user_id] || []
        userOrders.push({
          id: order.id,
          date: order.created_at,
          total: Number(order.order_total) || 0,
          status: order.status,
          items: order.order_items || [],
        })
        grouped[order.user_id] = userOrders
        return grouped
      }, {})

      setAllUsers((profiles || []).map((profile) => ({
        id: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        profileImageUrl: profile.profile_image_url || '',
        isAdmin: Boolean(profile.is_admin),
        createdAt: profile.created_at,
        orders: ordersByUser[profile.id] || [],
      })))
    }

    loadAdminUsers()
  }, [user?.id, userType, dashboardRefreshKey])

  useEffect(() => {
    if (!isSupabaseConfigured || userType !== 'rider' || !user?.id) return

    const loadRiderOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), profiles:user_id(full_name, phone)')
        .in('status', ['ready', 'delivered'])
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error loading rider orders:', error)
        return
      }

      setRiderOrders((data || []).map((order) => ({
        ...order,
        customerName: order.profiles?.full_name || 'Customer',
        customerPhone: order.profiles?.phone || '',
        address: order.delivery_address || 'No delivery address',
        total: Number(order.order_total) || 0,
        items: order.order_items || [],
      })))
    }

    loadRiderOrders()

    const riderOrderChannel = supabase
      .channel(`rider-orders-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        loadRiderOrders,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(riderOrderChannel)
    }
  }, [user?.id, userType, dashboardRefreshKey])

  useEffect(() => {
    if (!isSupabaseConfigured || userType !== 'admin' || !user?.id) return

    const loadAdminOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error loading admin orders:', error)
        return
      }

      setAllOrders((data || []).map((order) => ({
        ...order,
        userId: order.user_id,
        name: order.profiles?.full_name || 'Unknown user',
        email: order.profiles?.email || '',
        address: order.delivery_address || '',
        total: Number(order.order_total) || 0,
        date: order.created_at,
        updatedAt: order.updated_at,
        paymentMethod: order.payment_method,
        cancellationReason: order.cancellation_reason,
        cancellationNote: order.cancellation_note,
        items: order.order_items || [],
      })))
    }

    loadAdminOrders()
  }, [user?.id, userType, dashboardRefreshKey])

  useEffect(() => {
    const syncViewFromPath = () => {
      const path = window.location.pathname.replace(/\/+$/, '') || '/'
      if (path === '/admin') {
        if (!user) {
          setAuthView('login')
          setView('login')
          return
        }
        if (!isAdminUser(user)) {
          setAuthView('login')
          setView('account')
          window.history.pushState({}, '', '/account')
          return
        }
        setView('admin')
        return
      }
      if (path === '/rider') {
        if (!user) {
          setAuthView('login')
          setView('login')
          return
        }
        if (userType !== 'rider') {
          setView(userType === 'admin' ? 'admin' : 'account')
          window.history.pushState({}, '', userType === 'admin' ? '/admin' : '/account')
          return
        }
        setView('rider')
        return
      }
      if (path === '/dashboard') {
        if (!user) {
          setAuthView('login')
          setView('login')
          return
        }
        setView('dashboard')
        return
      }
      if (path === '/account') {
        if (!user) {
          setAuthView('login')
          setView('login')
          return
        }
        setView('account')
        return
      }
      if (path === '/login') {
        setAuthView('login')
        setView('login')
        return
      }
      if (path === '/signup') {
        setAuthView('signup')
        setView('login')
        return
      }
      if (path === '/checkout') {
        setView('checkout')
        return
      }
      if (path === '/shop') {
        setView('shop')
        return
      }
      setView('home')
    }

    syncViewFromPath()
    window.addEventListener('popstate', syncViewFromPath)
    return () => window.removeEventListener('popstate', syncViewFromPath)
  }, [user])

  const updateRoute = (nextView) => {
    if (nextView === 'admin' && !user) {
      setAuthView('login')
      setView('login')
      window.history.pushState({}, '', '/login')
      return
    }
    if (nextView === 'dashboard' && !user) {
      setAuthView('login')
      setView('login')
      window.history.pushState({}, '', '/login')
      return
    }
    if (nextView === 'account' && !user) {
      setAuthView('login')
      setView('login')
      window.history.pushState({}, '', '/login')
      return
    }
    if (nextView === 'signup') {
      setAuthView('signup')
      setView('login')
      window.history.pushState({}, '', '/signup')
      return
    }
    if (nextView === 'login') {
      setAuthView('login')
      setView('login')
      window.history.pushState({}, '', '/login')
      return
    }
    if (nextView === 'checkout') {
      setView('checkout')
      window.history.pushState({}, '', '/checkout')
      return
    }
    setView(nextView)

    const route = nextView === 'home' ? '/' : `/${nextView}`
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route)
    }
  }

  const handleLoginSuccess = async (authUser) => {
    const resolvedUserType = await resolveUserType(authUser)
    setUser(authUser)
    setProfileImageUrl('')
    setUserType(resolvedUserType)
    setFavoriteItems([])
    setUserOrders([])

    const nextView = resolvedUserType === 'admin' ? 'admin' : resolvedUserType === 'rider' ? 'rider' : 'account'
    const route = nextView === 'admin' ? '/admin' : nextView === 'rider' ? '/rider' : '/account'

    setView(nextView)
    setAuthView('login')
    window.history.pushState({}, '', route)
  }

  const handleSignUpSuccess = (authUser) => {
    setUser(authUser)
    setProfileImageUrl('')
    setUserType('customer')
    setFavoriteItems([])
    setUserOrders([])
    // Add new user to all users list
    setAllUsers((current) => [
      ...current,
      {
        id: authUser.id,
        email: authUser.email,
        username: authUser.user_metadata?.username || 'User',
        fullName: authUser.user_metadata?.fullName || 'Not provided',
        phone: authUser.user_metadata?.phone || 'Not provided',
        address: authUser.user_metadata?.address || 'Not provided',
        createdAt: new Date().toISOString(),
        orders: [],
      },
    ])
    setView('account')
    setAuthView('login')
    window.history.pushState({}, '', '/account')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfileImageUrl('')
    setUserType('customer')
    setFavoriteItems([])
    setUserOrders([])
    setRiderOrders([])
    setView('home')
    window.history.pushState({}, '', '/')
  }

  const handleAdminRefresh = async () => {
    setDashboardRefreshKey((current) => current + 1)
  }

  const createNotifications = async (entries) => {
    if (!isSupabaseConfigured || entries.length === 0) return

    const { error } = await supabase.from('notifications').insert(entries)
    if (error) console.warn('Unable to create notifications:', error)
  }

  const handleMarkNotificationRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', user?.id)

    if (error) {
      notifyToast('Could not update notification.', 'error')
      return
    }

    setNotifications((current) => current.map((notification) => (
      notification.id === notificationId ? { ...notification, is_read: true } : notification
    )))
  }

  const handleCustomerNotificationClick = async (notification) => {
    await handleMarkNotificationRead(notification.id)

    if (notification.notification_type === 'order_status' && notification.order_id) {
      setOrderToTrackId(notification.order_id)
      updateRoute('account')
      return
    }

    if (notification.notification_type === 'menu_update') updateRoute('shop')
  }

  const handleAdminNotificationClick = async (notification) => {
    await handleMarkNotificationRead(notification.id)
    if (notification.notification_type === 'new_order') updateRoute('admin')
  }

  const handleRiderNotificationClick = async (notification) => {
    await handleMarkNotificationRead(notification.id)
  }

  const handleSendUserNotification = async ({ title, message }) => {
    if (!title?.trim() || !message?.trim()) throw new Error('Title and message are required.')

    const { data: customerProfiles, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'customer')

    if (error) throw new Error(error.message)

    await createNotifications((customerProfiles || []).map((profile) => ({
      recipient_id: profile.id,
      notification_type: 'admin_broadcast',
      title: title.trim(),
      message: message.trim(),
    })))
  }

  const handleUpdateRiderOrderStatus = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'ready')

    if (error) throw new Error(error.message)

    setRiderOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, status: 'delivered' } : order
    )))

    const order = riderOrders.find((item) => item.id === orderId)
    if (order?.user_id) {
      await createNotifications([{
        recipient_id: order.user_id,
        notification_type: 'order_status',
        title: 'Order delivered',
        message: `Order #${String(orderId).slice(0, 8)} has been delivered.`,
        order_id: orderId,
      }])
    }
  }

  const handleAddToCart = (product) => {
    setCartItems((current) => [...current, product])
    updateRoute('shop')
  }

  const handleCreateMenuItem = async (newItem) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.')
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        title: newItem.title,
        description: newItem.description,
        price: Number(newItem.price) || 0,
        tag: newItem.tag || null,
        badge: newItem.badge || null,
        featured: Boolean(newItem.featured),
        available: Boolean(newItem.available),
        image_url: newItem.image || null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    setMenuCatalog((current) => [
      {
        ...newItem,
        id: data.id,
        image: data.image_url || newItem.image,
        createdAt: data.created_at,
        featured: Boolean(data.featured),
        available: Boolean(data.available),
        price: Number(data.price) || 0,
      },
      ...current,
    ])

    const { data: customerProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'customer')

    if (!profilesError) {
      await createNotifications((customerProfiles || []).map((profile) => ({
        recipient_id: profile.id,
        notification_type: 'menu_update',
        title: 'New meal available',
        message: `${data.title} is now available on the Trophy menu.`,
        menu_item_id: data.id,
      })))
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) throw new Error(error.message)

    setAllOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, status } : order
    )))
    setUserOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, status } : order
    )))

    const order = allOrders.find((item) => item.id === orderId)
    if (order?.userId) {
      await createNotifications([{
        recipient_id: order.userId,
        notification_type: 'order_status',
        title: 'Order status updated',
        message: `Order #${String(orderId).slice(0, 8)} is now ${status.replaceAll('_', ' ')}.`,
        order_id: orderId,
      }, ...(status === 'ready' ? [{
        recipient_id: RIDER_USER_ID,
        notification_type: 'order_status',
        title: 'New delivery assigned',
        message: `Order #${String(orderId).slice(0, 8)} is ready for delivery.`,
        order_id: orderId,
      }] : [])])
    }
  }

  const handleOrderNow = (product) => {
    setCartItems((current) => [...current, product])
    updateRoute('shop')
  }

  const handleRemoveFromCart = (id) => {
    setCartItems((current) => current.filter((item) => item.id !== id))
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) return
    setView('checkout')
    window.history.pushState({}, '', '/checkout')
  }

  const handleMobileCartAction = () => {
    if (cartItems.length === 0) {
      notifyToast('Your cart is empty. Add a few dishes first.', 'warning')
      return
    }

    setView('checkout')
    window.history.pushState({}, '', '/checkout')
  }

  useEffect(() => {
    if (!user) return

    let savedProof = {}
    try {
      savedProof = JSON.parse(window.localStorage.getItem(getProofStorageKey(user.id)) || '{}')
    } catch {
      savedProof = {}
    }

    setCheckoutForm((current) => ({
      name: current.name || user.user_metadata?.fullName || user.user_metadata?.name || user.email?.split('@')[0] || '',
      contactNumber: current.contactNumber || user.user_metadata?.phone || '',
      address: current.address || user.user_metadata?.address || '',
      notes: current.notes || '',
      paymentMethod: current.paymentMethod || 'card',
      proofOfPaymentUrl: current.proofOfPaymentUrl || savedProof.url || '',
      proofOfPaymentFilename: current.proofOfPaymentFilename || savedProof.filename || '',
      proofOfPaymentMimeType: current.proofOfPaymentMimeType || savedProof.mimeType || '',
      proofOfPaymentSize: current.proofOfPaymentSize || savedProof.size || null,
    }))
  }, [user])

  const handleCheckoutInputChange = async (event) => {
    const { name, value, files } = event.target
    if (files) {
      const file = files[0]
      if (!file || !user?.id) return

      const fileName = `${user.id}/bank-proof/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      const { error: uploadError } = await supabase.storage
        .from('bank_prof')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        notifyToast('Failed to upload proof of payment: ' + uploadError.message, 'error')
        return
      }

      const proofUrl = supabase.storage.from('bank_prof').getPublicUrl(fileName).data.publicUrl
      const proofDetails = {
        url: proofUrl,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }

      window.localStorage.setItem(getProofStorageKey(user.id), JSON.stringify(proofDetails))
      setCheckoutForm((current) => ({
        ...current,
        [name]: file,
        proofOfPaymentUrl: proofDetails.url,
        proofOfPaymentFilename: proofDetails.filename,
        proofOfPaymentMimeType: proofDetails.mimeType,
        proofOfPaymentSize: proofDetails.size,
      }))
    } else {
      setCheckoutForm((current) => ({ ...current, [name]: value }))
    }
  }

  const handleConfirmOrder = async (orderData) => {
    if (!user) {
      setAuthView('login')
      setView('login')
      window.history.pushState({}, '', '/login')
      notifyToast('Please sign in before confirming and paying for your order.', 'warning')
      return
    }

    try {
      let proofOfPaymentUrl = null
      let proofFilename = null
      let proofMimeType = null
      let proofFileSize = null
      let orderStatus = 'pending'

      if (orderData.paymentMethod === 'paystack') {
        const paymentAmount = total + 2500
        const paymentResponse = await initializePaystackPayment(user.email, paymentAmount, {
          orderType: 'food_order',
          userId: user.id,
          name: orderData.name,
          contactNumber: orderData.contactNumber,
          address: orderData.address,
        })

        if (!paymentResponse?.reference) {
          throw new Error('Paystack payment was not completed.')
        }
      }

      if (orderData.paymentMethod === 'transfer') {
        if (!orderData.proofOfPayment && !orderData.proofOfPaymentUrl) {
          notifyToast('Please upload proof of payment for bank transfer.', 'warning')
          return
        }

        proofFilename = orderData.proofOfPaymentFilename || orderData.proofOfPayment?.name
        proofMimeType = orderData.proofOfPaymentMimeType || orderData.proofOfPayment?.type
        proofFileSize = orderData.proofOfPaymentSize || orderData.proofOfPayment?.size
        proofOfPaymentUrl = orderData.proofOfPaymentUrl

        if (!proofOfPaymentUrl && orderData.proofOfPayment) {
          const fileName = `${user.id}/bank-proof/${Date.now()}-${proofFilename.replace(/\s+/g, '_')}`
          const { error: uploadError } = await supabase.storage
            .from('bank_prof')
            .upload(fileName, orderData.proofOfPayment, { upsert: true })

          if (uploadError) {
            throw new Error('Failed to upload proof of payment: ' + uploadError.message)
          }

          proofOfPaymentUrl = supabase.storage.from('bank_prof').getPublicUrl(fileName).data.publicUrl
        }

        orderStatus = 'pending_payment_confirmation'
      }

      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            order_total: total + 2500,
            status: orderStatus,
            delivery_address: orderData.address,
            delivery_notes: orderData.notes,
            payment_method: orderData.paymentMethod,
            proof_of_payment: proofOfPaymentUrl,
            proof_of_payment_filename: proofFilename,
            proof_of_payment_mime_type: proofMimeType,
            proof_of_payment_size: proofFileSize,
            proof_of_payment_uploaded_at: orderData.paymentMethod === 'transfer' ? new Date().toISOString() : null,
          }
        ])
        .select()

      if (orderError) {
        notifyToast('Failed to create order: ' + orderError.message, 'error')
        return
      }

      const orderId = orderResult?.[0]?.id

      if (!orderId) {
        notifyToast('Failed to create order.', 'error')
        return
      }

      if (orderData.paymentMethod === 'transfer' && proofOfPaymentUrl) {
        const { error: proofInsertError } = await supabase
          .from('payment_proofs')
          .insert([
            {
              order_id: orderId,
              storage_path: proofOfPaymentUrl,
              filename: proofFilename,
              mime_type: proofMimeType,
              size_bytes: proofFileSize,
              uploaded_at: new Date().toISOString(),
            }
          ])

        if (proofInsertError) {
          console.warn('Error saving payment proof metadata:', proofInsertError)
        }
      }

      const orderItems = cartItems.map((item) => ({
        order_id: orderId,
        food_name: item.title,
        food_id: item.id,
        quantity: item.quantity || 1,
        price: item.price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.warn('Error saving order items:', itemsError)
      }

      await createNotifications([
        {
          recipient_id: user.id,
          notification_type: 'order_status',
          title: 'Order received',
          message: `Order #${String(orderId).slice(0, 8)} has been received and is being reviewed.`,
          order_id: orderId,
        },
        {
          recipient_id: ADMIN_USER_ID,
          notification_type: 'new_order',
          title: 'New order received',
          message: `${orderData.name} placed order #${String(orderId).slice(0, 8)}.`,
          order_id: orderId,
        },
      ])

      // Create admin notification for bank transfer payments
      if (orderData.paymentMethod === 'transfer') {
        const { error: notifError } = await supabase
          .from('admin_notifications')
          .insert([
            {
              order_id: orderId,
              notification_type: 'bank_transfer_payment',
              title: `Bank Transfer Payment - Order #${String(orderId).slice(0, 8)}`,
              message: `${orderData.name} submitted a bank transfer payment proof for order ₦${(total + 2500).toLocaleString('en-NG')}. Please verify the payment.`,
              proof_of_payment_url: proofOfPaymentUrl,
              proof_of_payment_filename: proofFilename,
              proof_of_payment_mime_type: proofMimeType,
              proof_of_payment_size: proofFileSize,
              user_name: orderData.name,
              user_email: user.email,
              user_phone: orderData.contactNumber,
              order_total: total + 2500,
              is_read: false,
              created_at: new Date().toISOString(),
            }
          ])

        if (notifError) {
          console.warn('Error creating admin notification:', notifError)
        }
      }

      const newOrder = {
        id: orderId,
        date: new Date().toISOString(),
        items: cartItems,
        total: total + 2500,
        name: orderData.name,
        contactNumber: orderData.contactNumber,
        address: orderData.address,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        status: 'pending',
        userId: user?.id || null,
      }

      setUserOrders((current) => [newOrder, ...current])
      setAllOrders((current) => [newOrder, ...current])
      setAllUsers((current) =>
        current.map((u) =>
          u.id === user?.id ? { ...u, orders: [newOrder, ...(u.orders || [])] } : u
        )
      )

      setCartItems([])
      window.localStorage.removeItem(getProofStorageKey(user.id))
      setCheckoutForm({
        name: '',
        contactNumber: '',
        address: '',
        notes: '',
        paymentMethod: 'paystack',
        proofOfPayment: null,
        proofOfPaymentUrl: '',
        proofOfPaymentFilename: '',
        proofOfPaymentMimeType: '',
        proofOfPaymentSize: null,
      })

      setSuccessOrder(newOrder)
      setShowOrderSuccessModal(true)
      updateRoute('home')
    } catch (error) {
      console.error('Error creating order:', error)
      notifyToast('Error creating order: ' + error.message, 'error')
    }
  }

  const handleAddFavorite = (product) => {
    if (!favoriteItems.find((item) => item.id === product.id)) {
      setFavoriteItems((current) => [...current, product])
    }
  }

  const handleRemoveFavorite = (productId) => {
    setFavoriteItems((current) => current.filter((item) => item.id !== productId))
  }

  const total = cartItems.reduce((sum, item) => sum + item.price, 0)
  const handleSubmitTestimonial = (data) => {
    const newReview = {
      name: data.name,
      role: data.role,
      rating: data.rating,
      text: data.text,
      id: Date.now(),
      status: 'pending',
    }
    setPendingTestimonials((current) => [newReview, ...current])
  }

  const handleApproveTestimonial = (id) => {
    const testimonial = pendingTestimonials.find((t) => t.id === id)
    if (testimonial) {
      setApprovedTestimonials((current) => [
        ...current,
        { ...testimonial, status: 'approved' },
      ])
      setPendingTestimonials((current) => current.filter((t) => t.id !== id))
    }
  }

  const handleRejectTestimonial = (id) => {
    setPendingTestimonials((current) => current.filter((t) => t.id !== id))
  }

  useEffect(() => {
    if (approvedTestimonials.length === 0) return
    const interval = setInterval(() => {
      setTestimonialSliderIndex(
        (current) => (current + 1) % approvedTestimonials.length
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [approvedTestimonials.length])
  if (loading) {
    return (
      <div className="page-shell">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      {toast && (
        <div className={`global-toast global-toast-${toast.tone}`} role="status" aria-live="polite">
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
        </div>
      )}
      {showOrderSuccessModal && successOrder && (
        <div className="success-modal-backdrop" onClick={() => setShowOrderSuccessModal(false)}>
          <div className="success-modal" onClick={(event) => event.stopPropagation()}>
            <div className="fireworks" aria-hidden="true">
              <span className="firework firework-1" />
              <span className="firework firework-2" />
              <span className="firework firework-3" />
              <span className="firework firework-4" />
              <span className="firework firework-5" />
            </div>

            <div className="success-modal-icon">✓</div>
            <h3>Order placed successfully</h3>
            <p>Your food is being prepared and the order is now tracking in your account.</p>

            <div className="success-order-summary">
              <span>Order #{String(successOrder.id).slice(0, 8)}</span>
              <strong>{formatNaira(successOrder.total)}</strong>
            </div>

            <div className="success-modal-actions">
              <button type="button" className="primary-btn" onClick={() => {
                setShowOrderSuccessModal(false)
                setOrderToTrackId(successOrder.id)
                updateRoute('account')
              }}>
                Track order
              </button>
              <button type="button" className="ghost-btn" onClick={() => setShowOrderSuccessModal(false)}>
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {view !== 'login' && (
        <Header
          onNavigate={updateRoute}
          cartCount={cartItems.length}
          user={user}
          profileImageUrl={profileImageUrl}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showMobileSearch={showMobileSearch}
          onToggleMobileSearch={() => setShowMobileSearch(!showMobileSearch)}
          showMobileAccount={showMobileAccount}
          onToggleMobileAccount={() => setShowMobileAccount(!showMobileAccount)}
          mobileAuthView={mobileAuthView}
          onMobileAuthViewChange={setMobileAuthView}
          onMobileLoginSuccess={(authUser) => {
            setUser(authUser)
            setShowMobileAccount(false)
          }}
          onCartAction={handleMobileCartAction}
        />
      )}

      {view === 'home' && (
        <section className="mobile-dashboard-shell">
          <div className="mobile-dashboard-phone">
            <header className="mobile-dashboard-header">
              <div className="mobile-location-row">
                <div className="mobile-location-pin">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="mobile-user-avatar" />
                  ) : (
                    <FontAwesomeIcon icon={faUser} />
                  )}
                </div>
                <div className="mobile-location-copy">
                  <strong>{user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest'}</strong>
                </div>
                <button type="button" className="mobile-bell-btn" aria-label="Notifications">
                  <FontAwesomeIcon icon={faBell} />
                </button>
              </div>

              <label className="mobile-search-bar" aria-label="Search food menu">
                <FontAwesomeIcon icon={faSearch} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search for dishes or restaurants"
                  aria-label="Search food menu"
                />
              </label>
            </header>

            <main className="mobile-dashboard-main">
              <Hero dishes={menuCatalog} onOrderNow={handleOrderNow} />
              <Story />

          <FeaturedDishes items={menuCatalog} onAddToCart={handleAddToCart} onViewMenu={() => updateRoute('shop')} />

          <section className="faq-section" id="faq">
            <div className="container">
              <div className="section-heading centered">
                <p className="eyebrow">FAQ</p>
                <h2>Everything you need to know.</h2>
              </div>

              <div className="faq-accordion">
                {faqItems.map((item, index) => {
                  const isOpen = activeFaq === index

                  return (
                    <div key={item.question} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="faq-trigger"
                        onClick={() => setActiveFaq(isOpen ? -1 : index)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.question}</span>
                        <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                      </button>

                      {isOpen && <p className="faq-answer">{item.answer}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="testimonials-section" id="reviews">
            <div className="container">
              <div className="section-heading centered">
                <p className="eyebrow">Testimonials</p>
                <h2>Guests who keep coming back.</h2>
              </div>

              <div className="testimonial-showcase">
                <div className="testimonial-form-card">
                  <h3>Share your experience</h3>
                  <TestimonialForm onSubmit={handleSubmitTestimonial} />
                </div>

                <div className="testimonial-slider-card">
                  {approvedTestimonials.length > 0 ? (
                    <>
                      <article className="active-testimonial">
                        <div className="star-row" aria-label={`${approvedTestimonials[testimonialSliderIndex].rating} star rating`}>
                          {Array.from({ length: approvedTestimonials[testimonialSliderIndex].rating }).map(
                            (_, index) => (
                              <span key={`star-${index}`}>★</span>
                            )
                          )}
                        </div>
                        <p className="testimonial-quote">
                          "{approvedTestimonials[testimonialSliderIndex].text}"
                        </p>
                        <div className="testimonial-person">
                          <strong>{approvedTestimonials[testimonialSliderIndex].name}</strong>
                          <span>{approvedTestimonials[testimonialSliderIndex].role}</span>
                        </div>
                      </article>

                      <div className="slider-dots">
                        {approvedTestimonials.map((_, index) => (
                          <button
                            key={`dot-${index}`}
                            type="button"
                            className={`dot ${index === testimonialSliderIndex ? 'active' : ''}`}
                            onClick={() => setTestimonialSliderIndex(index)}
                            aria-label={`Go to testimonial ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="no-testimonials">No testimonials yet. Be the first to share!</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="contact-section" id="contact">
            <div className="container contact-grid">
              <div className="chef-card">
                <img src="/people/pic1.jpg" alt="Chief Chef Alexy Mama" className="chef-photo" />
                <div className="chef-meta">
                  <p className="eyebrow">Chief Chef</p>
                  <h3>Alexy Mama</h3>
                </div>
              </div>

              <div className="contact-copy">
                <p className="eyebrow">Contact us</p>
                <h2>Let’s bring your next meal to life.</h2>
                <p>
                  Whether you’re planning a family dinner, a private celebration, or a quick
                  takeout fix, we’re ready to serve something memorable.
                </p>

                <div className="contact-list">
                  <a href="tel:+2349063316300">📞 +234 906 331 6300</a>
                  <a href="https://wa.me/2349063316300" target="_blank" rel="noreferrer">💬 WhatsApp</a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer">📸 Instagram</a>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer">👍 Facebook</a>
                </div>

                <div className="map-card">
                  <iframe
                    title="Trophy location map"
                    src="https://www.google.com/maps?q=Lekki%20Phase%201%2C%20Lagos&z=13&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </section>
            </main>
          </div>
        </section>
      )}

      {view === 'shop' && (
        <main className="shop-page" id="shop">
          <Shop
            products={menuCatalog}
            onAddToCart={handleAddToCart}
            cartCount={cartItems.length}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            user={user}
            profileImageUrl={profileImageUrl}
            onNavigate={updateRoute}
          />
        </main>
      )}

      {view === 'login' && (
        authView === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignUp={() => {
              setAuthView('signup')
              window.history.pushState({}, '', '/signup')
            }}
          />
        ) : (
          <SignUpPage
            onSignUpSuccess={handleSignUpSuccess}
            onSwitchToLogin={() => {
              setAuthView('login')
              window.history.pushState({}, '', '/login')
            }}
          />
        )
      )}

      {view === 'dashboard' && user && (
        <UserDashboard
          user={user}
          menuItems={menuCatalog}
          userType={userType}
          favoriteItems={favoriteItems}
          userOrders={userOrders}
          onLogout={handleLogout}
          onAddFavorite={handleAddFavorite}
          onRemoveFavorite={handleRemoveFavorite}
          onViewMenu={() => updateRoute('shop')}
          onOpenAccount={() => updateRoute('account')}
          onProfileImageChange={setProfileImageUrl}
        />
      )}

      {view === 'account' && user && (
        <UserDashboard
          user={user}
          menuItems={menuCatalog}
          userType={userType}
          favoriteItems={favoriteItems}
          userOrders={userOrders}
          onLogout={handleLogout}
          onAddFavorite={handleAddFavorite}
          onRemoveFavorite={handleRemoveFavorite}
          onViewMenu={() => updateRoute('shop')}
          onOpenAccount={() => updateRoute('account')}
          onProfileImageChange={setProfileImageUrl}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onNotificationClick={handleCustomerNotificationClick}
          initialAccountSubmenu={orderToTrackId ? 'orders' : null}
          initialExpandedOrderId={orderToTrackId}
          isAccountView
        />
      )}

      {view === 'rider' && user && userType === 'rider' && (
        <RiderDashboard
          user={user}
          orders={riderOrders}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onNotificationClick={handleRiderNotificationClick}
          onUpdateOrderStatus={handleUpdateRiderOrderStatus}
          onLogout={handleLogout}
        />
      )}

      {view === 'admin' && user && (
        <main>
          <AdminDashboard
            products={menuCatalog}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onNotificationClick={handleAdminNotificationClick}
            pendingTestimonials={pendingTestimonials}
            onApproveTestimonial={handleApproveTestimonial}
            onRejectTestimonial={handleRejectTestimonial}
            user={user}
            onLogout={handleLogout}
            onRefresh={handleAdminRefresh}
            allUsers={allUsers}
            allOrders={allOrders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onCreateMenuItem={handleCreateMenuItem}
            onSendUserNotification={handleSendUserNotification}
          />
        </main>
      )}

      {view === 'checkout' && (
        <main className="checkout-page-shell">
          <section className="checkout-page">
            <div className="checkout-page-header">
              <div>
                <h1>Checkout</h1>
              </div>
              <button type="button" className="ghost-btn small-btn" onClick={() => updateRoute('shop')}>
                Continue shopping
              </button>
            </div>

            {!user ? (
              <div className="checkout-login-gate">
                <div className="checkout-login-card">
                  <h2>Login to complete payment</h2>
                  <p>
                    Please sign in to confirm your delivery address and complete payment for your order.
                  </p>
                  <div className="checkout-login-actions">
                    <button type="button" className="primary-btn" onClick={() => {
                      setAuthView('login')
                      setView('login')
                      window.history.pushState({}, '', '/login')
                    }}>
                      Login
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => {
                      setAuthView('signup')
                      setView('login')
                      window.history.pushState({}, '', '/signup')
                    }}>
                      Create account
                    </button>
                  </div>
                  <div className="checkout-summary-list">
                    <h3>Order summary</h3>
                    {cartItems.map((item) => (
                      <div key={`checkout-${item.id}`} className="checkout-item-row">
                        <span>{item.title}</span>
                        <strong>{formatNaira(item.price)}</strong>
                      </div>
                    ))}
                    <div className="checkout-total-row">
                      <span>Total</span>
                      <strong>{formatNaira(total)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="checkout-layout">
                  <form
                    className="checkout-form-panel"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const name = (checkoutForm.name || user?.user_metadata?.fullName || user?.email?.split('@')[0] || '').trim()
                      const contactNumber = (checkoutForm.contactNumber || '').trim()
                      const address = (checkoutForm.address || user?.user_metadata?.address || '').trim()

                      if (!name || !contactNumber || !address) {
                        notifyToast('Please fill in all required fields.', 'warning')
                        return
                      }

                      handleConfirmOrder({
                        ...checkoutForm,
                        name,
                        contactNumber,
                        address,
                      })
                    }}
                  >
                    <label>
                      Full name
                      <input
                        type="text"
                        name="name"
                        value={checkoutForm.name || user.user_metadata?.fullName || user.email?.split('@')[0] || ''}
                        onChange={handleCheckoutInputChange}
                        placeholder="Your full name"
                        required
                      />
                    </label>

                    <label>
                      Contact number
                      <input
                        type="tel"
                        name="contactNumber"
                        value={checkoutForm.contactNumber}
                        onChange={handleCheckoutInputChange}
                        placeholder="0803 000 0000"
                        required
                      />
                    </label>

                    <label>
                      Delivery address
                      <textarea
                        name="address"
                        rows="3"
                        value={checkoutForm.address}
                        onChange={handleCheckoutInputChange}
                        placeholder="Street, area, city"
                        required
                      />
                    </label>

                    <label>
                      Delivery notes
                      <textarea
                        name="notes"
                        rows="2"
                        value={checkoutForm.notes}
                        onChange={handleCheckoutInputChange}
                        placeholder="Extra instructions"
                      />
                    </label>

                    <div className="payment-method-block">
                      <label>Payment method</label>
                      <div className="payment-method-grid" role="radiogroup" aria-label="Payment method">
                        {[
                          { value: 'paystack', label: 'Paystack', note: 'Fast online payment' },
                          { value: 'cash', label: 'Cash on delivery', note: 'Pay when delivered' },
                          { value: 'transfer', label: 'Bank transfer', note: 'Transfer to account' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`payment-method-option ${checkoutForm.paymentMethod === option.value ? 'active' : ''}`}
                            onClick={() => {
                              setCheckoutForm((current) => ({ ...current, paymentMethod: option.value }))
                            }}
                            aria-pressed={checkoutForm.paymentMethod === option.value}
                          >
                            <span className="payment-method-name">{option.label}</span>
                            <span className="payment-method-note">{option.note}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {checkoutForm.paymentMethod === 'paystack' && (
                      <div className="payment-inline-box">
                        <div className="payment-inline-header">
                          <strong>Paystack</strong>
                          <span>Secure online checkout</span>
                        </div>
                        <p>Pay securely with your card or bank via the Paystack checkout popup.</p>
                      </div>
                    )}

                    {checkoutForm.paymentMethod === 'transfer' && (
                      <div className="payment-inline-box bank-transfer-section">
                        <div className="payment-inline-header">
                          <strong>Bank transfer</strong>
                          <span>Manual payment approval</span>
                        </div>
                        
                        <div className="bank-account-details">
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '600', color: '#201814' }}>Transfer details:</p>
                          <p style={{ margin: '0', fontSize: '0.85rem', color: '#333' }}>
                            <strong>Account name:</strong> Trophy Sip &amp; Savor<br />
                            <strong>Account number:</strong> 1234567890<br />
                            <strong>Bank:</strong> First Bank
                          </p>
                        </div>

                        <div className="payment-confirmation-notice" style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
                          <p style={{ margin: '0', fontSize: '0.85rem', color: '#1e40af', lineHeight: '1.5' }}>
                            ℹ️ <strong>Your payment will be confirmed by our admin within 1-2 hours.</strong> We will contact you at <strong>{user?.email}</strong> to confirm.
                          </p>
                          <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#1e40af' }}>
                            <strong>Admin contact:</strong> +234 906 331 6300 | support@trophysip.com
                          </p>
                        </div>

                        <div className="proof-upload-container" style={{ marginTop: '14px' }}>
                          <label style={{ display: 'grid', gap: '10px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#201814' }}>Upload proof of payment</span>
                            
                            <div 
                              className="image-upload-box"
                              style={{
                                cursor: 'pointer',
                                border: '2px dashed rgba(255, 107, 53, 0.4)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                backgroundColor: '#fff8f4',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.8)'
                                e.currentTarget.style.backgroundColor = '#fffbf8'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.4)'
                                e.currentTarget.style.backgroundColor = '#fff8f4'
                              }}
                            >
                              {checkoutForm.proofOfPayment ? (
                                <div style={{ display: 'grid', gap: '8px', alignItems: 'center' }}>
                                  <img 
                                    src={checkoutForm.proofOfPayment ? URL.createObjectURL(checkoutForm.proofOfPayment) : checkoutForm.proofOfPaymentUrl}
                                    alt="proof preview"
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '200px',
                                      borderRadius: '8px',
                                      objectFit: 'contain'
                                    }}
                                  />
                                  <p style={{ margin: '0', fontSize: '0.85rem', color: '#4ade80', fontWeight: '600' }}>
                                    ✓ {checkoutForm.proofOfPayment.name}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      window.localStorage.removeItem(getProofStorageKey(user?.id))
                                      setCheckoutForm((current) => ({
                                        ...current,
                                        proofOfPayment: null,
                                        proofOfPaymentUrl: '',
                                        proofOfPaymentFilename: '',
                                        proofOfPaymentMimeType: '',
                                        proofOfPaymentSize: null,
                                      }))
                                    }}
                                    style={{
                                      fontSize: '0.8rem',
                                      padding: '4px 12px',
                                      border: '1px solid #ccc',
                                      borderRadius: '6px',
                                      background: '#fff',
                                      cursor: 'pointer',
                                      color: '#666'
                                    }}
                                  >
                                    Change image
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>📸</p>
                                  <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: '600', color: '#201814' }}>
                                    Click to upload proof of payment
                                  </p>
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#7d6056' }}>
                                    PNG, JPG, or PDF (Max 5MB)
                                  </p>
                                </div>
                              )}
                            </div>

                            <input
                              id="proofOfPaymentInput"
                              type="file"
                              name="proofOfPayment"
                              onChange={handleCheckoutInputChange}
                              accept="image/*,.pdf"
                              required={!checkoutForm.proofOfPaymentUrl}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {checkoutForm.paymentMethod === 'cash' && (
                      <div className="payment-inline-box">
                        <div className="payment-inline-header">
                          <strong>Cash on delivery</strong>
                          <span>Pay on arrival</span>
                        </div>
                        <p>Pay the delivery rider when your order arrives at your location.</p>
                      </div>
                    )}

                    <button type="submit" className="primary-btn checkout-confirm-btn">
                      Confirm and pay {formatNaira(total)}
                    </button>
                  </form>

                  <aside className="checkout-summary-panel">
                    <h3>Order summary</h3>
                    {cartItems.map((item) => (
                      <div key={`summary-${item.id}`} className="checkout-item-row">
                        <span>{item.title}</span>
                        <strong>{formatNaira(item.price)}</strong>
                      </div>
                    ))}

                    <div className="checkout-total-row">
                      <span>Subtotal</span>
                      <strong>{formatNaira(total)}</strong>
                    </div>

                    <div className="checkout-total-row delivery-row">
                      <span>Delivery</span>
                      <strong>₦2,500</strong>
                    </div>

                    <div className="checkout-total-row grand-total-row">
                      <span>Total</span>
                      <strong>{formatNaira(total + 2500)}</strong>
                    </div>
                  </aside>
                </div>
              )}
            </section>
          </main>
      )}

      {view !== 'login' && view !== 'checkout' && (
        <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <div className="brand footer-brand" aria-label="Trophy home">
                <div>
                  <strong>Trophy</strong>
                  <small>Sip &amp; Savor</small>
                </div>
              </div>
            </div>

            <div>
              <h4>Visit us</h4>
              <p>12 Lekki Phase 1, Lagos</p>
              <p>+234 906 331 6300</p>
            </div>

            <div>
              <h4>Hours</h4>
              <p>Mon - Sat: 10:00am - 10:00pm</p>
              <p>Sun: 12:00pm - 9:00pm</p>
            </div>

            <div>
              <h4>Follow</h4>
              <div className="footer-social-links">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook">
                  <FontAwesomeIcon icon={faFacebookF} />
                </a>
                <a href="https://wa.me/2349063316300" target="_blank" rel="noreferrer" aria-label="WhatsApp" title="WhatsApp">
                  <FontAwesomeIcon icon={faWhatsapp} />
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
