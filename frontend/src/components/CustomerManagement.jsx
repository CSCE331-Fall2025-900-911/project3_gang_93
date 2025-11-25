import { useState, useEffect } from "react";
import { customerAPI } from "../services/api";
import "./CustomerManagement.css";

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pointsUpdate, setPointsUpdate] = useState({ customerId: null, points: "", reason: "" });

  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    DOB: "",
    phoneNumber: "",
    email: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getAll(searchTerm || null);
      setCustomers(data.customers || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers();
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await customerAPI.create(newCustomer);
      setShowCreateForm(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        DOB: "",
        phoneNumber: "",
        email: "",
      });
      fetchCustomers();
    } catch (err) {
      console.error("Failed to create customer:", err);
      alert(`Failed to create customer: ${err.message}`);
    }
  };

  const handleUpdatePoints = async () => {
    if (!pointsUpdate.customerId || !pointsUpdate.points) return;

    try {
      await customerAPI.updatePoints(
        pointsUpdate.customerId,
        parseInt(pointsUpdate.points),
        pointsUpdate.reason || null
      );
      setPointsUpdate({ customerId: null, points: "", reason: "" });
      fetchCustomers();
    } catch (err) {
      console.error("Failed to update points:", err);
      alert(`Failed to update points: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="customer-management">
        <div className="loading-state">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="customer-management">
      <div className="customer-header">
        <h1 className="customer-title">Customer Management</h1>
        <button
          className="create-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Add Customer
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="search-btn" onClick={handleSearch}>
          Search
        </button>
        {searchTerm && (
          <button
            className="clear-btn"
            onClick={() => {
              setSearchTerm("");
              fetchCustomers();
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <div className="error-state">{error}</div>}

      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Points</th>
              <th>Date Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.customerId}>
                  <td>{customer.customerId}</td>
                  <td>
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phoneNumber}</td>
                  <td className="points-cell">
                    {customer.points}
                    {pointsUpdate.customerId === customer.customerId ? (
                      <div className="points-edit-form">
                        <input
                          type="number"
                          value={pointsUpdate.points}
                          onChange={(e) =>
                            setPointsUpdate({
                              ...pointsUpdate,
                              points: e.target.value,
                            })
                          }
                          placeholder="Points to add/subtract"
                          className="points-input"
                        />
                        <input
                          type="text"
                          value={pointsUpdate.reason}
                          onChange={(e) =>
                            setPointsUpdate({
                              ...pointsUpdate,
                              reason: e.target.value,
                            })
                          }
                          placeholder="Reason (optional)"
                          className="reason-input"
                        />
                        <button
                          className="save-points-btn"
                          onClick={handleUpdatePoints}
                        >
                          Save
                        </button>
                        <button
                          className="cancel-points-btn"
                          onClick={() =>
                            setPointsUpdate({
                              customerId: null,
                              points: "",
                              reason: "",
                            })
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="edit-points-btn"
                        onClick={() =>
                          setPointsUpdate({
                            customerId: customer.customerId,
                            points: "",
                            reason: "",
                          })
                        }
                      >
                        Edit Points
                      </button>
                    )}
                  </td>
                  <td>{customer.dateJoined}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        alert(
                          `Customer Details:\nID: ${customer.customerId}\nName: ${customer.firstName} ${customer.lastName}\nEmail: ${customer.email}\nPhone: ${customer.phoneNumber}\nPoints: ${customer.points}\nDOB: ${customer.DOB}\nJoined: ${customer.dateJoined}`
                        )
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create New Customer</h2>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label>First Name:</label>
                <input
                  type="text"
                  value={newCustomer.firstName}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name:</label>
                <input
                  type="text"
                  value={newCustomer.lastName}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, lastName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  value={newCustomer.DOB}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, DOB: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  value={newCustomer.phoneNumber}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      phoneNumber: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Create Customer
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerManagement;

