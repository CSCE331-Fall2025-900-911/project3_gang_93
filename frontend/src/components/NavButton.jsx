import './NavButton.css'

function NavButton({ icon, label, onClick }) {
  return (
    <button className="nav-button" onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default NavButton

