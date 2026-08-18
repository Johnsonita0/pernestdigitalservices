import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faHeart, faSearch, faStar, faUser } from '@fortawesome/free-solid-svg-icons'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

const getShortDescription = (description = '') => {
  if (description.length <= 48) return description
  return `${description.slice(0, 48).trim()}...`
}

function Shop({ products, onAddToCart, searchTerm = '', onSearchChange = null, user = null, profileImageUrl = '', onNavigate = null }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest'
  const displayName = user ? username : 'Guest'
  const profileImage = profileImageUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar || user?.user_metadata?.profilePic || user?.user_metadata?.photoURL || user?.avatar_url || user?.picture || user?.photoURL || null
  const quickMeals = products.slice(0, 5)
  const topPicks = products.slice(0, 2)

  const filteredProducts = searchTerm.trim()
    ? products.filter((product) => {
        const searchableText = [product.title, product.description, product.tag, product.badge, product.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(searchTerm.trim().toLowerCase())
      })
    : products

  const showProducts = filteredProducts.length ? filteredProducts : products

  return (
    <section className="mobile-dashboard-shell shop-mobile-shell" id="shop">
      <div className="mobile-dashboard-phone shop-phone-frame">
        <header className="mobile-dashboard-header">
          <div className="mobile-location-row">
            <div className="mobile-location-pin">
              {profileImage ? (
                <img src={profileImage} alt={displayName} className="mobile-user-avatar" />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
            </div>
            <div className="mobile-location-copy">
              {user ? (
                <strong>{displayName}</strong>
              ) : (
                <button type="button" className="mobile-location-name" onClick={() => onNavigate?.('login')}>
                  <strong>Login</strong>
                </button>
              )}
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
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search for dishes or restaurants"
              aria-label="Search food menu"
            />
          </label>
        </header>

        <main className="mobile-dashboard-main">
          <div className="mobile-section-head shop-intro-head">
            <h2>What are you craving?</h2>
          </div>

          <div className="mobile-food-row">
            {quickMeals.map((item, index) => (
              <div key={item.id || index} className="mobile-food-pill">
                <img src={item.image} alt={item.title} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>

          <div className="mobile-section-head">
            <h2>Top Picks Near You</h2>
            <button type="button" className="mobile-link-btn" onClick={() => onAddToCart?.(showProducts[0])}>
              See all →
            </button>
          </div>

          <div className="mobile-restaurant-list">
            {showProducts.map((item, index) => (
              <article
                key={item.id || index}
                className="mobile-restaurant-card"
                onClick={() => setSelectedItem(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedItem(item)
                  }
                }}
              >
                <img src={item.image} alt={item.title} />
                <div className="mobile-restaurant-meta">
                  <div className="mobile-restaurant-row">
                    <h3>{item.title}</h3>
                    <div className="mobile-favorite-mini">
                      <button type="button" className="mini-favorite-btn active" aria-label="Favorite item" onClick={(event) => event.stopPropagation()}>
                        <FontAwesomeIcon icon={faHeart} />
                      </button>
                    </div>
                  </div>

                  <div className="mobile-food-status-row">
                    <span className={`mobile-status-badge ${item.available === false ? 'unavailable' : 'available'}`}>
                      {item.available === false ? 'Not available' : 'Available'}
                    </span>
                  </div>

                  <p>{getShortDescription(item.description)}</p>
                  <div className="mobile-rating-row">
                    <span className="mobile-rating">
                      <FontAwesomeIcon icon={faStar} /> 4.2
                    </span>
                    <span>•</span>
                    <span>25–30 mins</span>
                  </div>
                  <div className="mobile-price-row">
                    <strong>{formatNaira(item.price)}</strong>
                    <button
                      type="button"
                      className="mobile-order-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedItem(item)
                      }}
                      disabled={item.available === false}
                    >
                      {item.available === false ? 'Sold out' : 'Order'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mobile-section-head compact">
            <h2>Popular this week</h2>
          </div>

          <div className="mobile-favorites-strip">
            {showProducts.slice(0, 3).map((item, index) => (
              <div key={item.id || index} className="mobile-favorite-tile">
                <img src={item.image} alt={item.title} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </main>

        {selectedItem && (
          <div className="mobile-product-modal-backdrop" onClick={() => setSelectedItem(null)}>
            <div className="mobile-product-modal" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="mobile-product-close" onClick={() => setSelectedItem(null)} aria-label="Close item details">
                ×
              </button>
              <img src={selectedItem.image} alt={selectedItem.title} />
              <div className="mobile-product-modal-body">
                <div className="mobile-product-header-row">
                  <h3>{selectedItem.title}</h3>
                  <span className={`mobile-status-badge ${selectedItem.available === false ? 'unavailable' : 'available'}`}>
                    {selectedItem.available === false ? 'Not available' : 'Available'}
                  </span>
                </div>

                <p className="mobile-product-modal-tag">{selectedItem.tag || selectedItem.badge}</p>
                <p className="mobile-product-modal-description">{selectedItem.description}</p>

                <div className="mobile-product-modal-footer">
                  <strong>{formatNaira(selectedItem.price)}</strong>
                  <button
                    type="button"
                    className="mobile-order-btn"
                    disabled={selectedItem.available === false}
                    onClick={() => {
                      if (selectedItem.available === false) return
                      onAddToCart?.(selectedItem)
                      setSelectedItem(null)
                    }}
                  >
                    {selectedItem.available === false ? 'Unavailable' : 'Add to cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Shop
