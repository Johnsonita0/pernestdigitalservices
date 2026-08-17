const navItems = [
  { label: 'Home', view: 'home' },
  { label: 'Shop', view: 'shop' },
  { label: 'Admin', view: 'admin' },
]

function Header({ onNavigate, cartCount = 0 }) {
  return (
    <header className="topbar">
      <div className="container nav-wrap">
        <button type="button" className="brand brand-button" onClick={() => onNavigate('home')} aria-label="Trophy restaurant home">
          <span className="brand-mark">T</span>
          <div>
            <strong>Trophy</strong>
            <small>Naija Kitchen</small>
          </div>
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="nav-button"
              onClick={() => onNavigate(item.view)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button type="button" className="cart-pill" onClick={() => onNavigate('shop')} aria-label="Cart">
            Cart ({cartCount})
          </button>
          <button type="button" className="primary-btn small-btn" onClick={() => onNavigate('shop')}>
            Reserve table
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
