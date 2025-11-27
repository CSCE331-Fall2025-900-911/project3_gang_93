import './MenuItem.css'

function MenuItem({ item, onItemClick }) {
  return (
    <div className="menu-item" onClick={() => onItemClick(item)}>
      <div className="menu-item-icon">{item.icon}</div>
      <div className="menu-item-name">{item.name}</div>
      <div className="menu-item-price">${item.price.toFixed(2)}</div>
    </div>
  )
}

export default MenuItem

