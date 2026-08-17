function AdminDashboard({ products }) {
  return (
    <section className="admin-section" id="admin">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Back office dashboard.</h2>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-card stats-card">
            <h3>Overview</h3>
            <ul>
              <li>Meals posted: {products.length}</li>
              <li>Orders today: 48</li>
              <li>Revenue: ₦284,500</li>
            </ul>
          </div>

          <div className="admin-card form-card">
            <h3>Add new dish</h3>
            <form className="admin-form">
              <input type="text" placeholder="Dish title" />
              <textarea rows="3" placeholder="Description" />
              <input type="number" placeholder="Price in Naira" />
              <button type="button" className="primary-btn">
                Publish dish
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard
