import NavButton from './NavButton'
import './Header.css'

function Header() {
  const navItems = [
    { icon: '🔍', label: 'Toggle Size' },
    { icon: '🕐', label: 'Transaction History' },
    { icon: '⚙️', label: 'Manage' },
    { icon: '📤', label: 'Log Out' },
  ]

  return (
    <header className="header">
      <h1 className="header-title">POS System</h1>
      <nav className="header-nav">
        {navItems.map((item, index) => (
          <div key={index} className="nav-item-wrapper">
            {index > 0 && <span className="nav-divider">|</span>}
            <NavButton icon={item.icon} label={item.label} />
          </div>
        ))}
      </nav>
    </header>
  )
}

export default Header

