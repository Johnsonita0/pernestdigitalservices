import { useEffect, useState } from 'react'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function FeaturedDishes({ items, onAddToCart, onViewMenu }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [items.length])

  const activeDish = items[activeIndex]

  return (
    <section className="featured-section" id="menu">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured dishes</p>
            <h2>Fresh favorites from our kitchen.</h2>
          </div>
        </div>

        <div className="featured-slider">
          <article className="dish-card featured-slide">
            <div className="featured-slide-grid">
              <div className="dish-image-wrap">
                <img src={activeDish.image} alt={activeDish.title} />
                <span>{activeDish.badge}</span>
              </div>

              <div className="dish-body">
                <div className="dish-header-row featured-header-row">
                  <div>
                    <small className="dish-mini-label">{activeDish.tag}</small>
                    <h3>{activeDish.title}</h3>
                  </div>
                  <strong>{formatNaira(activeDish.price)}</strong>
                </div>

                <p>{activeDish.description}</p>

                <div className="featured-actions">
                  <button type="button" className="primary-btn" onClick={() => onAddToCart(activeDish)}>
                    Add to cart
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => onAddToCart(activeDish)}>
                    Order now
                  </button>
                  <button type="button" className="ghost-btn dark-ghost" onClick={onViewMenu}>
                    View menu
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="slider-dots feature-dots" aria-label="Featured dish slider navigation">
          {items.map((dish, index) => (
            <button
              key={dish.id}
              type="button"
              className={index === activeIndex ? 'dot active' : 'dot'}
              aria-label={`Show ${dish.title}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedDishes
