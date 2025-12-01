import { useState } from "react";
import "./KioskView.css";

function KioskView({ menuItems, cart, onItemClick, onAddToCart, onRemoveItem, onCompleteTransaction, onSwitchToCashier, user, onLoginClick, onLogout, isExpanded, onToggleExpanded }) {
  const [filter, setFilter] = useState("all");
  const [currentStep, setCurrentStep] = useState("menu"); // "menu" or "cart"

  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  const filteredItems = filter === "all" 
    ? menuItems 
    : menuItems.filter(item => {
        const name = item.name.toLowerCase();
        if (filter === "coffee") return name.includes("coffee") || name.includes("latte");
        if (filter === "tea") return name.includes("tea");
        return true;
      });

  if (currentStep === "cart" && cartItems.length > 0) {
    return (
      <div className={`kiosk-view ${isExpanded ? 'kiosk-view-expanded' : ''}`}>
        <div className="kiosk-cart-view">
          <div className="kiosk-cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>
                <span className="cart-icon">🛒</span>
                Current Order
              </h2>
              <button
                className="kiosk-mode-toggle"
                onClick={onSwitchToCashier}
                title="Switch to Cashier Mode"
              >
                👤
              </button>
            </div>
            <button 
              className="kiosk-back-button"
              onClick={() => setCurrentStep("menu")}
            >
              ← Add More Items
            </button>
          </div>

          <div className="kiosk-cart-items">
            {Object.entries(cart).map(([cartKey, item]) => (
              <div key={cartKey} className="kiosk-cart-item">
                <div className="kiosk-cart-item-info">
                  <span className="kiosk-cart-item-name">{item.name}</span>
                  <span className="kiosk-cart-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="kiosk-cart-item-controls">
                  <button
                    className="kiosk-quantity-button"
                    onClick={() => onRemoveItem(cartKey)}
                  >
                    −
                  </button>
                  <span className="kiosk-quantity">{item.quantity}</span>
                  <button
                    className="kiosk-quantity-button"
                    onClick={() => onAddToCart(item)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="kiosk-order-summary">
            <div className="kiosk-summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="kiosk-summary-row">
              <span>Tax:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="kiosk-summary-row kiosk-total-row">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="kiosk-checkout-button"
            onClick={onCompleteTransaction}
          >
            Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`kiosk-view ${isExpanded ? 'kiosk-view-expanded' : ''}`}>
      <div className="kiosk-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <h1 className="kiosk-title">Order Here</h1>
          {user && (
            <div className="kiosk-user-info">
              <span className="kiosk-user-name">{user.name || user.email}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="kiosk-mode-toggle"
            onClick={onToggleExpanded}
            title={isExpanded ? "Normal View" : "Expand View"}
          >
            🔍
          </button>
          {cartItems.length > 0 && (
            <button
              className="kiosk-cart-badge"
              onClick={() => setCurrentStep("cart")}
            >
              🛒 {totalItems} item{totalItems !== 1 ? 's' : ''} • ${subtotal.toFixed(2)}
            </button>
          )}
          {!user && onLoginClick && (
            <button
              className="kiosk-login-button"
              onClick={onLoginClick}
              title="Sign in with Google"
            >
              Sign In
            </button>
          )}
          {user && onLogout && (
            <button
              className="kiosk-logout-button"
              onClick={onLogout}
              title="Logout"
            >
              Logout
            </button>
          )}
          <button
            className="kiosk-mode-toggle"
            onClick={onSwitchToCashier}
            title="Switch to Cashier Mode"
          >
            👤
          </button>
        </div>
      </div>

      <div className="kiosk-filters">
        <button
          className={`kiosk-filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`kiosk-filter-button ${filter === "coffee" ? "active" : ""}`}
          onClick={() => setFilter("coffee")}
        >
          Coffee
        </button>
        <button
          className={`kiosk-filter-button ${filter === "tea" ? "active" : ""}`}
          onClick={() => setFilter("tea")}
        >
          Tea
        </button>
      </div>

      <div className={`kiosk-menu-grid ${isExpanded ? 'kiosk-menu-grid-expanded' : ''}`}>
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`kiosk-menu-item ${isExpanded ? 'kiosk-menu-item-expanded' : ''}`}
            onClick={() => onItemClick(item)}
          >
            <div className="kiosk-menu-item-icon">{item.icon}</div>
            <div className="kiosk-menu-item-name">{item.name}</div>
            <div className="kiosk-menu-item-price">${item.price.toFixed(2)}</div>
            <div className="kiosk-menu-item-add">+ Customize</div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="kiosk-empty-state">
          <p>No items found in this category.</p>
        </div>
      )}
    </div>
  );
}

export default KioskView;

