import NavButton from './NavButton'
import './Header.css'

function Header({ onBackToHome, onManagerClick, employee, onLogout }) {
  const navItems = [
    { icon: '⚙️', label: 'Manage', onClick: onManagerClick },
    { icon: '📤', label: 'Log Out', onClick: onLogout },
  ]

  return (
    <header className="header">
      <h1 className="header-title">POS System</h1>
      <nav className="header-nav">
        {employee && (
          <div className="employee-info">
            <span className="employee-name">
              {employee.firstName} {employee.lastName}
            </span>
            <span className="employee-role">
              ({employee.authLevel})
            </span>
            <span className="nav-divider">|</span>
          </div>
        )}
        {onBackToHome && (
          <div className="nav-item-wrapper">
            <button
              className="view-toggle-button"
              onClick={onBackToHome}
              title="Back to Home"
            >
              🏠 Home
            </button>
            <span className="nav-divider">|</span>
          </div>
        )}
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

