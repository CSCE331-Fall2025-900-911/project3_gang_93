import './CartItem.css'

function CartItem({ item, onRemove, onAddItem, cartKey }) {
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
        <div className="cart-item-quantity-controls">
          <button
            className="cart-item-quantity-button"
            onClick={() => onRemove(cartKey || item.id)}
            aria-label={`Decrease quantity of ${item.name}`}
          >
            −
          </button>
          <span className="cart-item-quantity-display">{item.quantity}</span>
          {onAddItem && (
            <button
              className="cart-item-quantity-button"
              onClick={() => {
                // Reconstruct the item with all its customizations to add another
                const itemToAdd = {
                  id: item.id || item.menuItemId,
                  menuItemId: item.menuItemId || item.id,
                  name: item.name,
                  price: item.price,
                  addOnIDs: item.addOnIDs || [],
                  ice: item.ice || "normal",
                  sweetness: item.sweetness || "100%",
                };
                onAddItem(itemToAdd);
              }}
              aria-label={`Increase quantity of ${item.name}`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartItem

