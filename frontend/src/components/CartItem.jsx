import './CartItem.css'

function CartItem({ item, onRemove }) {
  const totalPrice = item.price * item.quantity;

  return (
    <div className="cart-item">
      <div className="cart-item-left">
        <span className="cart-item-name">{item.name}</span>
        {item.quantity > 1 && (
          <span className="cart-item-quantity">Qty: {item.quantity}</span>
        )}
      </div>
      <div className="cart-item-right">
        <span className="cart-item-price">
          {item.quantity > 1 && (
            <span className="cart-item-unit-price">
              ${item.price.toFixed(2)} × {item.quantity} = 
            </span>
          )}
          ${totalPrice.toFixed(2)}
        </span>
        <button 
          className="remove-button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove one ${item.name} from cart`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default CartItem

