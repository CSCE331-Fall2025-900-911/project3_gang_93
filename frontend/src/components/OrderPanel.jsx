import CartItem from './CartItem'
import OrderSummary from './OrderSummary'
import CompleteButton from './CompleteButton'
import { TAX_RATE } from '../constants/menuItems'
import './OrderPanel.css'

function OrderPanel({ cart, onRemoveItem, onCompleteTransaction }) {
  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <section className="order-section">
      <div className="order-panel">
        <h2 className="section-title">
          <span className="cart-icon">🛒</span>
          Current Order
        </h2>
        
        <div className="order-items">
          {cartItems.length === 0 ? (
            <div className="empty-cart">No items in cart</div>
          ) : (
            <div className="cart-items">
              {cartItems.map(item => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        <OrderSummary subtotal={subtotal} tax={tax} total={total} />

        <CompleteButton 
          disabled={cartItems.length === 0}
          onClick={onCompleteTransaction}
        />
      </div>
    </section>
  )
}

export default OrderPanel

