import { useState } from 'react'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function Shop({ products, onAddToCart }) {
  const [expandedItems, setExpandedItems] = useState({})

  const toggleExpanded = (id) => {
    setExpandedItems((current) => ({
      ...current,
      [id]: !current[id],
    }))
  }

  return (
    <section className="shop-section" id="shop">
      <div className="container">
        <div className="section-heading shop-heading">
          <div>
            <p className="eyebrow">Order online</p>
            <h2>Fresh picks from our shop.</h2>
          </div>
        </div>

        <div className="shop-grid">
          {products.map((product) => {
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
      </div>
    </section>
  )
}

export default Shop
