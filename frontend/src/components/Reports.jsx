import { useState } from "react";
import { reportsAPI } from "../services/api";
import "./Reports.css";

// Helper function to safely convert Decimal/string to number
const toNumber = (value) => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to get today's date in local timezone (YYYY-MM-DD format)
const getTodayLocal = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function Reports() {
  const [reportType, setReportType] = useState("x-report");
  const [xReportData, setXReportData] = useState(null);
  const [zReportData, setZReportData] = useState(null);
  const [productUsageData, setProductUsageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportDate, setReportDate] = useState(getTodayLocal());
  const [startDate, setStartDate] = useState(getTodayLocal());
  const [endDate, setEndDate] = useState(getTodayLocal());

  const fetchXReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsAPI.getXReport(reportDate || null);
      setXReportData(data);
    } catch (err) {
      console.error("Failed to fetch X-Report:", err);
      setError("Failed to generate X-Report");
    } finally {
      setLoading(false);
    }
  };

  const fetchZReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsAPI.getZReport(reportDate || null);
      setZReportData(data);
    } catch (err) {
      console.error("Failed to fetch Z-Report:", err);
      setError("Failed to generate Z-Report");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsAPI.getProductUsage(startDate, endDate);
      setProductUsageData(data);
    } catch (err) {
      console.error("Failed to fetch Product Usage:", err);
      setError("Failed to generate Product Usage Report");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (reportType === "x-report") {
      fetchXReport();
    } else if (reportType === "z-report") {
      fetchZReport();
    } else if (reportType === "product-usage") {
      fetchProductUsage();
    }
  };

  console.log("Reports render:", { reportType, loading, hasXReport: !!xReportData, hasZReport: !!zReportData, hasProductUsage: !!productUsageData }); // Debug log

  return (
    <div className="reports-page">
      <h1 className="reports-page-title">Manager Reports</h1>

      <div className="report-selector">
        <button
          className={`report-type-btn ${reportType === "x-report" ? "active" : ""}`}
          onClick={() => setReportType("x-report")}
        >
          X-Report (Hourly Sales)
        </button>
        <button
          className={`report-type-btn ${reportType === "z-report" ? "active" : ""}`}
          onClick={() => setReportType("z-report")}
        >
          Z-Report (End of Day)
        </button>
        <button
          className={`report-type-btn ${reportType === "product-usage" ? "active" : ""}`}
          onClick={() => setReportType("product-usage")}
        >
          Product Usage
        </button>
      </div>

      <div className="report-controls">
        {reportType === "product-usage" ? (
          <div className="date-range-inputs">
            <div className="date-input-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-input-group">
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="date-input-group">
            <label>Report Date:</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>
        )}
        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && <div className="error-state">{error}</div>}

      {loading ? (
        <div className="loading-state">Generating report...</div>
      ) : (
        <>
          {reportType === "x-report" && xReportData && (
            <div className="x-report">
              <div className="report-header">
                <h2>X-Report - Hourly Sales Activity</h2>
                <div className="report-date">Date: {xReportData.date}</div>
              </div>

              <div className="report-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Sales:</span>
                  <span className="summary-value">${toNumber(xReportData.totalSales).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Voids:</span>
                  <span className="summary-value">${toNumber(xReportData.totalVoids).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Cash Payments:</span>
                  <span className="summary-value">${toNumber(xReportData.cashPayments).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Card Payments:</span>
                  <span className="summary-value">${toNumber(xReportData.cardPayments).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Transactions:</span>
                  <span className="summary-value">{xReportData.totalTransactions || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Avg Transaction:</span>
                  <span className="summary-value">${toNumber(xReportData.avgTransaction).toFixed(2)}</span>
                </div>
              </div>

              {xReportData.hourlyData && xReportData.hourlyData.length > 0 && (
                <div className="hourly-breakdown">
                  <h3>Hourly Breakdown</h3>
                  <table className="hourly-table">
                    <thead>
                      <tr>
                        <th>Hour</th>
                        <th>Sales</th>
                        <th>Voids</th>
                        <th>Cash</th>
                        <th>Card</th>
                        <th>Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {xReportData.hourlyData.map((hour, index) => (
                        <tr key={index}>
                          <td>{hour.hour}:00</td>
                          <td>${toNumber(hour.sales).toFixed(2)}</td>
                          <td>${toNumber(hour.voids).toFixed(2)}</td>
                          <td>${toNumber(hour.cash).toFixed(2)}</td>
                          <td>${toNumber(hour.card).toFixed(2)}</td>
                          <td>{hour.transactions || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {reportType === "z-report" && zReportData && (
            <div className="z-report">
              <div className="report-header">
                <h2>Z-Report - End of Day Summary</h2>
                <div className="report-date">Date: {zReportData.date}</div>
              </div>

              <div className="report-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Sales:</span>
                  <span className="summary-value">${toNumber(zReportData.totalSales).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Tax:</span>
                  <span className="summary-value">${toNumber(zReportData.totalTax).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Cash Payments:</span>
                  <span className="summary-value">${toNumber(zReportData.cashPayments).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Card Payments:</span>
                  <span className="summary-value">${toNumber(zReportData.cardPayments).toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Transactions:</span>
                  <span className="summary-value">{zReportData.totalTransactions || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Avg Transaction:</span>
                  <span className="summary-value">${toNumber(zReportData.avgTransaction).toFixed(2)}</span>
                </div>
              </div>

              {(zReportData.lastResetDate || zReportData.lastResetEmployee) && (
                <div className="reset-info">
                  <h3>Last Reset Information</h3>
                  {zReportData.lastResetDate && (
                    <p>Last Reset Date: {zReportData.lastResetDate}</p>
                  )}
                  {zReportData.lastResetEmployee && (
                    <p>Last Reset Employee: {zReportData.lastResetEmployee}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {reportType === "product-usage" && productUsageData && (
            <div className="product-usage-report">
              <div className="report-header">
                <h2>Product Usage Report</h2>
                <div className="report-date">
                  {productUsageData.startDate} to {productUsageData.endDate}
                </div>
              </div>

              <div className="usage-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Products:</span>
                  <span className="summary-value">{productUsageData.totalProducts || 0}</span>
                </div>
              </div>

              {productUsageData.products && productUsageData.products.length > 0 && (
                <div className="usage-table-container">
                  <table className="usage-table">
                    <thead>
                      <tr>
                        <th>Item ID</th>
                        <th>Item Name</th>
                        <th>Quantity Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productUsageData.products.map((product) => (
                        <tr key={product.itemId}>
                          <td>{product.itemId}</td>
                          <td>{product.itemName}</td>
                          <td>{toNumber(product.quantityUsed).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;

