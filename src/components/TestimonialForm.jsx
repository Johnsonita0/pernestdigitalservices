import { useState } from 'react'

function TestimonialForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    rating: 5,
    text: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((current) => ({
      ...current,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.role || !formData.text) {
      alert('Please fill in all fields')
      return
    }
    onSubmit(formData)
    setFormData({
      name: '',
      role: '',
      rating: 5,
      text: '',
    })
    alert('Thank you! Your review is pending approval.')
  }

  return (
    <form className="testimonial-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="text"
          name="name"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <input
          type="text"
          name="role"
          placeholder="Your role (e.g. Food blogger)"
          value={formData.role}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <select
          name="rating"
          value={formData.rating}
          onChange={handleChange}
          className="rating-select"
        >
          <option value="1">1 star</option>
          <option value="2">2 stars</option>
          <option value="3">3 stars</option>
          <option value="4">4 stars</option>
          <option value="5">5 stars</option>
        </select>
      </div>

      <div className="form-row">
        <textarea
          name="text"
          placeholder="Share your experience..."
          rows="4"
          value={formData.text}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="primary-btn">
        Submit review
      </button>
    </form>
  )
}

export default TestimonialForm
