import { TAX_RATE } from '../constants/menuItems'
import './OrderSummary.css'

function OrderSummary({ subtotal, tax, total }) {
  return (
    <div className="order-summary">
      <div className="summary-row">
        <span>Subtotal:</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="summary-row">
        <span>Tax ({Math.round(TAX_RATE * 100)}%):</span>
        <span>${tax.toFixed(2)}</span>
      </div>
      <div className="summary-divider"></div>
      <div className="summary-row total-row">
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default OrderSummary

