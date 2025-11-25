import { useState, useEffect } from "react";
import { employeeAPI } from "../services/api";
import "./EmployeeManagement.css";

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeAPI.getAll();
      setEmployees(data.employees || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (employeeId) => {
    try {
      const employee = await employeeAPI.getById(employeeId);
      setSelectedEmployee(employee);
    } catch (err) {
      console.error("Failed to fetch employee details:", err);
      alert(`Failed to load employee details: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="employee-management">
        <div className="loading-state">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="employee-management">
      <h1 className="employee-title">Employee Management</h1>

      {error && <div className="error-state">{error}</div>}

      <div className="employees-grid">
        {employees.length === 0 ? (
          <div className="empty-state">No employees found</div>
        ) : (
          employees.map((employee) => (
            <div key={employee.employeeId} className="employee-card">
              <div className="employee-card-header">
                <div className="employee-avatar">
                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                </div>
                <div className="employee-info">
                  <div className="employee-name">
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className="employee-id">ID: {employee.employeeId}</div>
                </div>
              </div>
              <div className="employee-details">
                <div className="detail-item">
                  <span className="detail-label">Role:</span>
                  <span className={`detail-value ${employee.authLevel?.toLowerCase()}`}>
                    {employee.authLevel}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{employee.startDate}</span>
                </div>
              </div>
              <button
                className="view-details-btn"
                onClick={() => handleViewDetails(employee.employeeId)}
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Employee Details</h2>
            <div className="employee-detail-view">
              <div className="detail-row">
                <span className="detail-label">Employee ID:</span>
                <span className="detail-value">{selectedEmployee.employeeId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">First Name:</span>
                <span className="detail-value">{selectedEmployee.firstName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Name:</span>
                <span className="detail-value">{selectedEmployee.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className={`detail-value ${selectedEmployee.authLevel?.toLowerCase()}`}>
                  {selectedEmployee.authLevel}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{selectedEmployee.startDate}</span>
              </div>
            </div>
            <button
              className="close-btn"
              onClick={() => setSelectedEmployee(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;

