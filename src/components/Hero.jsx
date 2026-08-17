import { useEffect, useState } from 'react'

const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function Hero({ dishes, onOrderNow }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % dishes.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [dishes.length])

  const activeDish = dishes[activeIndex]

  return (
    <section className="hero-section" id="home">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Freshly made • Lagos style</p>
          <h1>{activeDish.title}</h1>
          <p className="hero-text">{activeDish.description}</p>

          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={() => onOrderNow(activeDish)}>
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

        <div className="hero-visual" aria-label="Featured dishes available right now">
          <div className="hero-card main-card">
            <span className="status-pill">Available now</span>
            <img src={activeDish.image} alt={`${activeDish.title} — ${activeDish.description}`} />
            <div className="dish-meta">
              <div>
                <small>{activeDish.tag}</small>
                <h3>{activeDish.title}</h3>
              </div>
              <strong>{formatNaira(activeDish.price)}</strong>
            </div>
          </div>

          <div className="slider-dots" aria-label="Hero slider navigation">
            {dishes.map((dish, index) => (
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
      </div>
    </section>
  )
}

export default Hero
