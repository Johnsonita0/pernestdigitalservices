import { useState } from 'react'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function Shop({ products, onAddToCart, searchTerm = '' }) {
  const [expandedItems, setExpandedItems] = useState({})

  const toggleExpanded = (id) => {
    setExpandedItems((current) => ({
      ...current,
      [id]: !current[id],
    }))
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProducts = normalizedSearch
    ? products.filter((product) => {
        const searchableText = [
          product.title,
          product.description,
          product.tag,
          product.badge,
          product.category,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(normalizedSearch)
      })
    : products

  const featuredDish = products[0]

  return (
    <section className="shop-section" id="shop">
      <div className="shop-full-width">
        <div className="section-heading shop-heading">
          <div>
            <p className="eyebrow">Order online</p>
            <h2>Fresh picks from our shop.</h2>
          </div>
        </div>

        {featuredDish && (
          <div
            className="shop-mobile-hero"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(22, 16, 14, 0.12), rgba(22, 16, 14, 0.72)), url(${featuredDish.image})`,
            }}
          >
            <div className="shop-mobile-hero-copy">
              <p className="eyebrow">Freshly made • Lagos style</p>
              <h1>{featuredDish.title}</h1>
              <p className="hero-text">{featuredDish.description}</p>

              <div className="hero-actions">
                <button type="button" className="primary-btn" onClick={() => onAddToCart(featuredDish)}>
                  Order now
                </button>
                <button type="button" className="ghost-btn">
                  Explore menu
                </button>
              </div>

              <div className="hero-stats" aria-label="Restaurant metrics">
                <div>
                  <strong>12+</strong>
                  <span>Years serving</span>
                </div>
                <div>
                  <strong>4.9/5</strong>
                  <span>Guest rating</span>
                </div>
                <div>
                  <strong>30 min</strong>
                  <span>Fast delivery</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>No dishes match “{searchTerm}”. Try another food, meal, or flavor.</p>
          </div>
        ) : (
          <div className="shop-grid">
            {filteredProducts.map((product) => {
              const isExpanded = !!expandedItems[product.id]
              const description = product.description
              const previewText = description.length > 90 && !isExpanded ? `${description.slice(0, 90)}...` : description

              return (
                <article key={product.id} className="shop-card">
                  <img src={product.image} alt={product.title} />
                  <div className="shop-body">
                    <div className="shop-row">
                      <span className="shop-tag">{product.tag}</span>
                      <strong>{formatNaira(product.price)}</strong>
                    </div>

                    <h3>{product.title}</h3>
                    <p className={isExpanded ? 'shop-description expanded' : 'shop-description'}>
                      {previewText}
                    </p>

                    {description.length > 90 && (
                      <button type="button" className="text-btn read-more-btn" onClick={() => toggleExpanded(product.id)}>
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}

                    <button
                      type="button"
                      className="primary-btn shop-btn"
                      onClick={() => onAddToCart(product)}
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Shop
