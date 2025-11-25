import { useState, useEffect } from "react";
import { managementAPI } from "../services/api";
import "./ManagerDashboard.css";

function ManagerDashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await managementAPI.getDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="manager-dashboard">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manager-dashboard">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="manager-dashboard">
      <h1 className="dashboard-title">Manager Dashboard</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value">${dashboardData?.todaySales?.toFixed(2) || "0.00"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Transactions</div>
          <div className="stat-value">{dashboardData?.todayTransactions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value warning">{dashboardData?.lowStockItems || 0}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Top Selling Items Today</h2>
          <div className="top-items-list">
            {dashboardData?.topSellingItems?.length > 0 ? (
              dashboardData.topSellingItems.map((item, index) => (
                <div key={index} className="top-item">
                  <span className="item-rank">{index + 1}</span>
                  <span className="item-name">{item.itemname || item.itemName}</span>
                  <span className="item-quantity">Qty: {item.quantity || 0}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">No sales today</div>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Transactions</h2>
          <div className="recent-transactions">
            {dashboardData?.recentTransactions?.length > 0 ? (
              dashboardData.recentTransactions.slice(0, 5).map((trans) => (
                <div key={trans.transactionid} className="transaction-item">
                  <div className="transaction-info">
                    <span className="transaction-id">#{trans.transactionid}</span>
                    <span className="transaction-date">
                      {trans.date} {trans.time}
                    </span>
                  </div>
                  <div className="transaction-type">{trans.transactiontype}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No recent transactions</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button className="action-button" onClick={() => onNavigate("inventory")}>
          📦 Manage Inventory
        </button>
        <button className="action-button" onClick={() => onNavigate("sales")}>
          📊 View Sales Reports
        </button>
        <button className="action-button" onClick={() => onNavigate("reports")}>
          📄 Generate Reports
        </button>
        <button className="action-button" onClick={() => onNavigate("customers")}>
          👥 Manage Customers
        </button>
        <button className="action-button" onClick={() => onNavigate("employees")}>
          👤 Manage Employees
        </button>
      </div>
    </div>
  );
}

export default ManagerDashboard;

