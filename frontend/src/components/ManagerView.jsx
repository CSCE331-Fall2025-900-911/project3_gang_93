import { useState } from "react";
import ManagerDashboard from "./ManagerDashboard";
import InventoryManagement from "./InventoryManagement";
import Reports from "./Reports";
import CustomerManagement from "./CustomerManagement";
import EmployeeManagement from "./EmployeeManagement";
import "./ManagerView.css";

function ManagerView({ onBack }) {
  const [currentView, setCurrentView] = useState("dashboard");

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <ManagerDashboard onNavigate={handleNavigate} />;
      case "inventory":
        return <InventoryManagement />;
      case "reports":
        return <Reports />;
      case "customers":
        return <CustomerManagement />;
      case "employees":
        return <EmployeeManagement />;
      default:
        return <ManagerDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="manager-view">
      <div className="manager-sidebar">
        <div className="sidebar-header">
          <h2>Manager</h2>
          <button className="back-btn" onClick={onBack}>
            ← Back to POS
          </button>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentView("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-item ${currentView === "inventory" ? "active" : ""}`}
            onClick={() => setCurrentView("inventory")}
          >
            📦 Inventory
          </button>
          <button
            className={`nav-item ${currentView === "reports" ? "active" : ""}`}
            onClick={() => setCurrentView("reports")}
          >
            📄 Reports
          </button>
          <button
            className={`nav-item ${currentView === "customers" ? "active" : ""}`}
            onClick={() => setCurrentView("customers")}
          >
            👥 Customers
          </button>
          <button
            className={`nav-item ${currentView === "employees" ? "active" : ""}`}
            onClick={() => setCurrentView("employees")}
          >
            👤 Employees
          </button>
        </nav>
      </div>
      <div className="manager-content">{renderView()}</div>
    </div>
  );
}

export default ManagerView;

