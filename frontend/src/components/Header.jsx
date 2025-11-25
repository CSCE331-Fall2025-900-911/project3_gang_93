import NavButton from './NavButton'
import './Header.css'

function Header({ viewMode, onViewModeChange, onManagerClick }) {
  const navItems = [
    { icon: '🔍', label: 'Toggle Size' },
    { icon: '🕐', label: 'Transaction History' },
    { icon: '⚙️', label: 'Manage', onClick: onManagerClick },
    { icon: '📤', label: 'Log Out' },
  ]

  return (
    <header className="header">
      <h1 className="header-title">POS System</h1>
      <nav className="header-nav">
        <div className="nav-item-wrapper">
          <button
            className="view-toggle-button"
            onClick={onViewModeChange}
            title={`Switch to ${viewMode === 'cashier' ? 'Kiosk' : 'Cashier'} view`}
          >
            {viewMode === 'cashier' ? '🖥️ Kiosk Mode' : '👤 Cashier Mode'}
          </button>
          <span className="nav-divider">|</span>
        </div>
        {navItems.map((item, index) => (
          <div key={index} className="nav-item-wrapper">
            <NavButton 
              icon={item.icon} 
              label={item.label} 
              onClick={item.onClick}
            />
            {index < navItems.length - 1 && <span className="nav-divider">|</span>}
          </div>
        ))}
      </nav>
    </header>
  )
}

export default Header

