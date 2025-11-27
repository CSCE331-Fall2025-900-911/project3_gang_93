import './CartItem.css'

function CartItem({ item, onRemove, cartKey }) {
  const totalPrice = item.price * item.quantity;

  // Format customizations for display
  const customizations = [];
  if (item.ice && item.ice !== "normal") {
    customizations.push(`Ice: ${item.ice}`);
  }
  if (item.sweetness && item.sweetness !== "100%") {
    customizations.push(`Sweet: ${item.sweetness}`);
  }
  if (item.addOnIDs && item.addOnIDs.length > 0) {
    customizations.push(`${item.addOnIDs.length} add-on${item.addOnIDs.length > 1 ? 's' : ''}`);
  }

  return (
    <div className="cart-item">
      <div className="cart-item-left">
        <span className="cart-item-name">{item.name}</span>
        {customizations.length > 0 && (
          <div className="cart-item-customizations">
            {customizations.map((custom, index) => (
              <span key={index} className="customization-tag">{custom}</span>
            ))}
          </div>
        )}
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
          onClick={() => onRemove(cartKey || item.id)}
          aria-label={`Remove one ${item.name} from cart`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default CartItem

