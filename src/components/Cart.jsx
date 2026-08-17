const formatNaira = (value) => `₦${value.toLocaleString('en-NG')}`

function Cart({ items, onRemoveFromCart, onCheckout }) {
  const total = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <aside className="cart-panel">
      <div className="cart-header">
        <h3>Your cart</h3>
        <span>{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {items.map((item) => (
              <div key={`${item.id}-${item.title}`} className="cart-item">
                <div>
                  <strong>{item.title}</strong>
                  <small>{formatNaira(item.price)}</small>
                </div>
                <button type="button" onClick={() => onRemoveFromCart(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div>
              <span>Total</span>
              <strong>{formatNaira(total)}</strong>
            </div>
            <button type="button" className="primary-btn checkout-btn" onClick={onCheckout}>
              Proceed to checkout
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

export default Cart
