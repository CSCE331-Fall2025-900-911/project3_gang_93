import { useState, useEffect } from "react";
import { inventoryAPI } from "../services/api";
import "./InventoryManagement.css";

function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editReason, setEditReason] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "low"

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryAPI.getAll();
      console.log("Inventory API response:", data); // Debug log
      setInventory(data.inventory || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const data = await inventoryAPI.getLowStock(10);
      setLowStockItems(data.inventory || []);
    } catch (err) {
      console.error("Failed to fetch low stock:", err);
      // Set empty array on error to prevent crashes
      setLowStockItems([]);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    // Safely convert quantity to number then to string
    const quantity = typeof item.quantity === 'number' 
      ? item.quantity 
      : parseFloat(item.quantity) || 0;
    setEditQuantity(quantity.toString());
    setEditReason("");
  };

  const handleSave = async () => {
    if (!editingItem) return;

    try {
      await inventoryAPI.update(
        editingItem.itemId,
        parseFloat(editQuantity),
        editReason || null
      );
      await fetchInventory();
      await fetchLowStock();
      setEditingItem(null);
      setEditQuantity("");
      setEditReason("");
    } catch (err) {
      console.error("Failed to update inventory:", err);
      alert(`Failed to update inventory: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditQuantity("");
    setEditReason("");
  };

  const displayedItems = filter === "low" ? lowStockItems : inventory;

  console.log("InventoryManagement render:", { loading, inventory: inventory.length, lowStockItems: lowStockItems.length, displayedItems: displayedItems.length }); // Debug log

  if (loading) {
    return (
      <div className="inventory-management">
        <div className="loading-state">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="inventory-management">
      <div className="inventory-header">
        <h1 className="inventory-title">Inventory Management</h1>
        <div className="inventory-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Items
          </button>
          <button
            className={`filter-btn ${filter === "low" ? "active" : ""}`}
            onClick={() => setFilter("low")}
          >
            Low Stock ({lowStockItems.length})
          </button>
        </div>
      </div>

      {error && <div className="error-state">{error}</div>}

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No items found
                </td>
              </tr>
            ) : (
              displayedItems.map((item) => {
                if (!item || !item.itemId) {
                  console.warn("Invalid item in inventory:", item);
                  return null;
                }
                // Safely convert quantity to number
                const quantity = typeof item.quantity === 'number' 
                  ? item.quantity 
                  : parseFloat(item.quantity) || 0;
                
                return (
                  <tr
                    key={item.itemId}
                    className={quantity < 10 ? "low-stock-row" : ""}
                  >
                    <td>{item.itemId}</td>
                    <td>{item.itemName || 'N/A'}</td>
                    <td>
                      {editingItem?.itemId === item.itemId ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="quantity-input"
                        />
                    ) : (
                      quantity.toFixed(2)
                    )}
                    </td>
                  <td>
                    {quantity < 10 ? (
                      <span className="status-badge warning">Low Stock</span>
                    ) : (
                      <span className="status-badge">In Stock</span>
                    )}
                  </td>
                  <td>
                    {editingItem?.itemId === item.itemId ? (
                      <div className="edit-actions">
                        <button className="save-btn" onClick={handleSave}>
                          Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancel}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
                );
              }).filter(Boolean)
            )}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit Inventory: {editingItem.itemName}</h3>
            <div className="edit-form">
              <label>
                New Quantity:
                <input
                  type="number"
                  step="0.01"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="form-input"
                />
              </label>
              <label>
                Reason (optional):
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., Restocked, Adjustment, etc."
                  className="form-input"
                />
              </label>
              <div className="modal-actions">
                <button className="save-btn" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;

