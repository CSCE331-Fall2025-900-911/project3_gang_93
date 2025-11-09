import './CartItem.css'

function CartItem({ item, onRemove }) {
  return (
    <div className="cart-item">
      <span>{item.name}</span>
      <div className="cart-item-right">
        <span>${item.price.toFixed(2)}</span>
        <button 
          className="remove-button"
          onClick={() => onRemove(item.cartId)}
          aria-label={`Remove ${item.name} from cart`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default CartItem

