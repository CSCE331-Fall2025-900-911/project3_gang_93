import MenuItem from './MenuItem'
import './MenuGrid.css'

function MenuGrid({ items, onAddToCart }) {
  return (
    <section className="menu-section">
      <h2 className="section-title">Menu</h2>
      <div className="menu-grid">
        {items.map(item => (
          <MenuItem key={item.id} item={item} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  )
}

export default MenuGrid

