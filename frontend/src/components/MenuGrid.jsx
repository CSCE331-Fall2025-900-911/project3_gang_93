import { useState } from 'react'
import MenuItem from './MenuItem'
import { filterMenuItems } from '../utils/menuCategories'
import './MenuGrid.css'

function MenuGrid({ items, onItemClick }) {
  const [filter, setFilter] = useState('all')
  
  const filteredItems = filterMenuItems(items, filter)
  
  return (
    <section className="menu-section">
      <h2 className="section-title">Menu</h2>
      
      <div className="menu-filters">
        <button 
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Items
        </button>
        <button 
          className={`filter-button ${filter === 'coffee' ? 'active' : ''}`}
          onClick={() => setFilter('coffee')}
        >
          Coffee
        </button>
        <button 
          className={`filter-button ${filter === 'tea' ? 'active' : ''}`}
          onClick={() => setFilter('tea')}
        >
          Tea
        </button>
      </div>
      
      <div className="menu-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <MenuItem key={item.id} item={item} onItemClick={onItemClick} />
          ))
        ) : (
          <div className="no-items-message">
            <p>No items found in this category.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default MenuGrid

