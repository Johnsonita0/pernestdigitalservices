import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Hero from './components/Hero'
import Story from './components/Story'
import FeaturedDishes from './components/FeaturedDishes'
import Shop from './components/Shop'
import Cart from './components/Cart'
import AdminDashboard from './components/AdminDashboard'
import CheckoutModal from './components/CheckoutModal'
import { menuItems } from './data/menu'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function App() {
  const [view, setView] = useState('home')
  const [cartItems, setCartItems] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)

  const handleAddToCart = (product) => {
    setCartItems((current) => [...current, product])
    setView('shop')
  }

  const handleOrderNow = (product) => {
    setCartItems((current) => [...current, product])
    setView('shop')
  }

  const handleRemoveFromCart = (id) => {
    setCartItems((current) => current.filter((item) => item.id !== id))
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) return
    setShowCheckout(true)
  }

  const handleConfirmOrder = () => {
    setShowCheckout(false)
    setCartItems([])
    setView('home')
  }

  const total = cartItems.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="page-shell">
      <Header onNavigate={setView} cartCount={cartItems.length} />

      {view === 'home' && (
        <main>
          <Hero dishes={menuItems} onOrderNow={handleOrderNow} />
          <Story />
          <FeaturedDishes items={menuItems} onAddToCart={handleAddToCart} onViewMenu={() => setView('shop')} />
        </main>
      )}

      {view === 'shop' && (
        <main className="container" id="shop">
          <Shop products={menuItems} onAddToCart={handleAddToCart} cartCount={cartItems.length} />
        </main>
      )}

      {view === 'admin' && (
        <main>
          <AdminDashboard products={menuItems} />
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

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand" aria-label="Trophy restaurant home">
              <span className="brand-mark">T</span>
              <div>
                <strong>Trophy</strong>
                <small>Naija Kitchen</small>
              </div>
            </div>
          </div>

          <div>
            <h4>Visit us</h4>
            <p>12 Lekki Phase 1, Lagos</p>
            <p>+234 800 123 4567</p>
          </div>

          <div>
            <h4>Hours</h4>
            <p>Mon - Sat: 10:00am - 10:00pm</p>
            <p>Sun: 12:00pm - 9:00pm</p>
          </div>

          <div>
            <h4>Follow</h4>
            <p>Instagram</p>
            <p>Facebook</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
