function Story() {
  return (
    <section className="story-section" id="story">
      <div className="container story-grid">
        <div className="story-image">
          <div className="image-panel large" />
          <div className="image-panel small" />
        </div>

        <div className="story-copy">
          <p className="eyebrow">Our story</p>
          <h2>Crafted for slow dining and shared celebrations.</h2>
          <p>
            Trophy blends neighborhood warmth with elevated comfort food. From intimate dinners
            to big family gatherings, every plate is built around local ingredients, honest
            cooking, and the joy of gathering around the table.
          </p>
          <ul className="story-points">
            <li>Small-batch ingredients sourced from local farms</li>
            <li>Seasonal menus designed by our in-house chefs</li>
            <li>House-made sauces, desserts, and signature cocktails</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Story
