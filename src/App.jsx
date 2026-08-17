import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import Story from './components/Story'
import FeaturedDishes from './components/FeaturedDishes'
import Shop from './components/Shop'
import AdminDashboard from './components/AdminDashboard'
import CheckoutModal from './components/CheckoutModal'
import TestimonialForm from './components/TestimonialForm'
import LoginPage from './components/LoginPage'
import SignUpPage from './components/SignUpPage'
import UserDashboard from './components/UserDashboard'
import { menuItems } from './data/menu'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

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
  const [cartItems, setCartItems] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeFaq, setActiveFaq] = useState(0)
  const [pendingTestimonials, setPendingTestimonials] = useState([])
  const [approvedTestimonials, setApprovedTestimonials] = useState(testimonials)
  const [testimonialSliderIndex, setTestimonialSliderIndex] = useState(0)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favoriteItems, setFavoriteItems] = useState([])
  const [userOrders, setUserOrders] = useState([])
  const [authView, setAuthView] = useState('login') // 'login' or 'signup'
  const [allUsers, setAllUsers] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileAccount, setShowMobileAccount] = useState(false)
  const [mobileAuthView, setMobileAuthView] = useState('login') // 'login', 'signup', or 'forgot'

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const syncViewFromPath = () => {
      const path = window.location.pathname.replace(/\/+$/, '') || '/'
      if (path === '/admin') {
        if (!user) {
          setAuthView('login')
          setView('login')
          return
        }
        setView('admin')
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
    setView(nextView)

    const route = nextView === 'home' ? '/' : `/${nextView}`
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route)
    }
  }

  const handleLoginSuccess = (authUser) => {
    setUser(authUser)
    setFavoriteItems([])
    setUserOrders([])
    setView('dashboard')
    setAuthView('login')
    window.history.pushState({}, '', '/dashboard')
  }

  const handleSignUpSuccess = (authUser) => {
    setUser(authUser)
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
    setView('dashboard')
    setAuthView('login')
    window.history.pushState({}, '', '/dashboard')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setFavoriteItems([])
    setUserOrders([])
    setView('home')
    window.history.pushState({}, '', '/')
  }

  const handleAddToCart = (product) => {
    setCartItems((current) => [...current, product])
    updateRoute('shop')
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
    if (!user) {
      setAuthView('login')
      setView('login')
      window.history.pushState({}, '', '/login')
      alert('Please sign in before confirming and paying for your order.')
      return
    }
    setShowCheckout(true)
  }

  const handleConfirmOrder = (orderData) => {
    if (!user) {
      setAuthView('login')
      setView('login')
      window.history.pushState({}, '', '/login')
      alert('Please sign in before confirming and paying for your order.')
      return
    }

    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: cartItems,
      total,
      name: orderData.name,
      contactNumber: orderData.contactNumber,
      address: orderData.address,
      notes: orderData.notes,
      paymentMethod: orderData.paymentMethod,
      status: 'pending',
      userId: user?.id || null,
    }
    setUserOrders((current) => [newOrder, ...current])
    
    // Add to all orders
    setAllOrders((current) => [newOrder, ...current])
    
    // Update user's orders in allUsers
    setAllUsers((current) =>
      current.map((u) =>
        u.id === user?.id ? { ...u, orders: [newOrder, ...(u.orders || [])] } : u
      )
    )
    
    setShowCheckout(false)
    setCartItems([])
    updateRoute('home')
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
      {view !== 'login' && (
        <Header
          onNavigate={updateRoute}
          cartCount={cartItems.length}
          user={user}
          onLogout={handleLogout}
          isShop={view === 'shop'}
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
        />
      )}

      {view === 'home' && (
        <main>
          <Hero dishes={menuItems} onOrderNow={handleOrderNow} />
          <Story />

          <FeaturedDishes items={menuItems} onAddToCart={handleAddToCart} onViewMenu={() => updateRoute('shop')} />

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
      )}

      {view === 'shop' && (
        <main className="shop-page" id="shop">
          <Shop
            products={menuItems}
            onAddToCart={handleAddToCart}
            cartCount={cartItems.length}
            searchTerm={searchTerm}
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
          favoriteItems={favoriteItems}
          userOrders={userOrders}
          onLogout={handleLogout}
          onAddFavorite={handleAddFavorite}
          onRemoveFavorite={handleRemoveFavorite}
          onViewMenu={() => updateRoute('shop')}
        />
      )}

      {view === 'admin' && user && (
        <main>
          <AdminDashboard
            products={menuItems}
            pendingTestimonials={pendingTestimonials}
            onApproveTestimonial={handleApproveTestimonial}
            onRejectTestimonial={handleRejectTestimonial}
            user={user}
            onLogout={handleLogout}
            allUsers={allUsers}
            allOrders={allOrders}
          />
        </main>
      )}

      {showCheckout && (
        <CheckoutModal
          items={cartItems}
          total={total}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmOrder}
        />
      )}

      {view !== 'login' && (
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
              <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
              <a href="https://wa.me/2349063316300" target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
