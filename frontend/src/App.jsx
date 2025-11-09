import { useState } from 'react'
import './App.css'

function App() {
  const [cart, setCart] = useState([])

  const menuItems = [
    { id: 1, name: 'Classic Milk Tea', price: 5.50, icon: '🥛' },
    { id: 2, name: 'Taro Milk Tea', price: 6.00, icon: '🥛' },
    { id: 3, name: 'Brown Sugar Boba', price: 6.50, icon: '🥛' },
    { id: 4, name: 'Strawberry Milk Tea', price: 6.00, icon: '🍦' },
    { id: 5, name: 'Honeydew Milk Tea', price: 5.75, icon: '🍦' },
    { id: 6, name: 'Passion Fruit Tea', price: 5.25, icon: '💧' },
  ]

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() }])
  }

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const completeTransaction = () => {
    if (cart.length === 0) return
    alert('Transaction completed!')
    setCart([])
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="header-title">POS System</h1>
        <nav className="header-nav">
          <button className="nav-button">
            <span className="nav-icon">🔍</span>
            <span>Toggle Size</span>
          </button>
          <span className="nav-divider">|</span>
          <button className="nav-button">
            <span className="nav-icon">🕐</span>
            <span>Transaction History</span>
          </button>
          <span className="nav-divider">|</span>
          <button className="nav-button">
            <span className="nav-icon">⚙️</span>
            <span>Manage</span>
          </button>
          <span className="nav-divider">|</span>
          <button className="nav-button">
            <span className="nav-icon">📤</span>
            <span>Log Out</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Menu Section */}
        <section className="menu-section">
          <h2 className="section-title">Menu</h2>
          <div className="menu-grid">
            {menuItems.map(item => (
              <div key={item.id} className="menu-item" onClick={() => addToCart(item)}>
                <div className="menu-item-icon">{item.icon}</div>
                <div className="menu-item-name">{item.name}</div>
                <div className="menu-item-price">${item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Current Order Section */}
        <section className="order-section">
          <div className="order-panel">
            <h2 className="section-title">
              <span className="cart-icon">🛒</span>
              Current Order
            </h2>
            
            <div className="order-items">
              {cart.length === 0 ? (
                <div className="empty-cart">No items in cart</div>
              ) : (
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.cartId} className="cart-item">
                      <span>{item.name}</span>
                      <div className="cart-item-right">
                        <span>${item.price.toFixed(2)}</span>
                        <button 
                          className="remove-button"
                          onClick={() => removeFromCart(item.cartId)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (8%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="complete-button"
              onClick={completeTransaction}
              disabled={cart.length === 0}
            >
              Complete Transaction
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
