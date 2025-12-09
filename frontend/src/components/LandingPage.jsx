import "./LandingPage.css";

function LandingPage({ onSelectSelfService, onSelectCashier, onSelectManager }) {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-header">
          <h1 className="landing-title">POS System</h1>
          <p className="landing-subtitle">Select an interface to continue</p>
        </div>

        <div className="landing-buttons">
          <button
            className="landing-button self-service-button"
            onClick={onSelectSelfService}
          >
            <div className="button-icon">🛒</div>
            <div className="button-content">
              <h2>Self-Service</h2>
              <p>Customer kiosk interface</p>
            </div>
          </button>

          <button
            className="landing-button cashier-button"
            onClick={onSelectCashier}
          >
            <div className="button-icon">💳</div>
            <div className="button-content">
              <h2>Cashier</h2>
              <p>Employee POS interface</p>
            </div>
          </button>

          <button
            className="landing-button manager-button"
            onClick={onSelectManager}
          >
            <div className="button-icon">👔</div>
            <div className="button-content">
              <h2>Manager</h2>
              <p>Management dashboard</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;

