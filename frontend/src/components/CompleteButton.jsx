import './CompleteButton.css'

function CompleteButton({ disabled, onClick }) {
  return (
    <button 
      className="complete-button"
      onClick={onClick}
      disabled={disabled}
    >
      Complete Transaction
    </button>
  )
}

export default CompleteButton

