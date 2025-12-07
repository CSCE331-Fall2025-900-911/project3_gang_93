import { useState } from "react";
import { authAPI } from "../services/api";
import "./EmployeeLoginPage.css";

function EmployeeLoginPage({ onLoginSuccess, onCancel, title = "Employee Login", subtitle = "Enter your employee ID to access the POS system" }) {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!employeeId.trim()) {
      setError("Please enter your employee ID");
      setLoading(false);
      return;
    }

    try {
      const employeeIdNum = parseInt(employeeId.trim());
      if (isNaN(employeeIdNum)) {
        setError("Employee ID must be a number");
        setLoading(false);
        return;
      }

      const response = await authAPI.login(employeeIdNum);
      
      // Store employee info in localStorage
      localStorage.setItem("employee", JSON.stringify(response));
      
      onLoginSuccess(response);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid employee ID. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-login-page">
      <div className="employee-login-container">
        <div className="employee-login-header">
          <h1 className="employee-login-title">{title}</h1>
          <p className="employee-login-subtitle">{subtitle}</p>
        </div>

        <div className="employee-login-content">
          {error && (
            <div className="employee-login-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="employee-login-form">
            <div className="employee-login-input-group">
              <label htmlFor="employeeId">Employee ID</label>
              <input
                id="employeeId"
                type="text"
                inputMode="numeric"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter your employee ID"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="employee-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {onCancel && (
            <div className="employee-login-footer">
              <button
                className="employee-login-cancel"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeLoginPage;

