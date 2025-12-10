import { Link } from "react-router-dom";
import "./LandingPage.css";

function LandingPage({ onSelectSelfService, onSelectCashier, onSelectManager }) {
  // Use Link for proper routing, but support onClick handlers if provided
  const handleClick = (e, onClickHandler) => {
    if (onClickHandler) {
      e.preventDefault();
      onClickHandler();
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <h1 className="landing-title">POS System</h1>
          <p className="landing-subtitle">Select an interface to continue</p>
        </div>

        <div className="landing-buttons">
          <Link
            to="/customer"
            className="landing-button self-service-button"
            onClick={(e) => handleClick(e, onSelectSelfService)}
          >
            <div className="button-icon">🛒</div>
            <div className="button-content">
              <h2>Self-Service</h2>
              <p>Customer kiosk interface</p>
            </div>
          </Link>

          <Link
            to="/cashier"
            className="landing-button cashier-button"
            onClick={(e) => handleClick(e, onSelectCashier)}
          >
            <div className="button-icon">💳</div>
            <div className="button-content">
              <h2>Cashier</h2>
              <p>Employee POS interface</p>
            </div>
          </Link>

          <Link
            to="/manager"
            className="landing-button manager-button"
            onClick={(e) => handleClick(e, onSelectManager)}
          >
            <div className="button-icon">👔</div>
            <div className="button-content">
              <h2>Manager</h2>
              <p>Management dashboard</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;

