import { useState, useEffect } from "react";
import { menuAPI, inventoryAPI } from "../services/api";
import "./MenuManagement.css";

function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({}); // itemId -> itemName mapping
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "seasonal", "regular"

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    ingredients: "",
    isSeasonal: false,
  });

  useEffect(() => {
    fetchInventory();
    fetchMenuItems();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await inventoryAPI.getAll();
      // Create a map of itemId -> itemName
      const map = {};
      if (data.inventory && Array.isArray(data.inventory)) {
        data.inventory.forEach((item) => {
          map[item.itemId] = item.itemName;
        });
      }
      setInventoryMap(map);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      // Continue without inventory map - will show IDs instead
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const items = await menuAPI.getAll();
      setMenuItems(items);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      price: "",
      ingredients: "",
      isSeasonal: false,
    });
    setShowAddForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    // Format ingredients for display in the form
    // Ingredients are stored as [{itemId: X, qty: Y}, ...]
    // For editing, we'll show just the itemIds as comma-separated values
    let ingredientsString = "";
    if (item.ingredients) {
      let ingredientsArray = null;
      
      if (Array.isArray(item.ingredients)) {
        ingredientsArray = item.ingredients;
      } else if (typeof item.ingredients === "string") {
        try {
          ingredientsArray = JSON.parse(item.ingredients);
        } catch (e) {
          ingredientsString = item.ingredients;
        }
      }
      
      if (Array.isArray(ingredientsArray)) {
        // Extract itemIds for display (user can edit these)
        ingredientsString = ingredientsArray
          .map((ing) => {
            if (typeof ing === "object" && ing !== null) {
              // Show itemId if available, or name/itemName
              return ing.itemId ? `Item ${ing.itemId}` : (ing.name || ing.itemName || "");
            }
            return String(ing);
          })
          .filter((ing) => ing)
          .join(", ");
      }
    }
    
    setFormData({
      name: item.name,
      price: item.price.toString(),
      ingredients: ingredientsString,
      isSeasonal: item.isSeasonal || false,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      await menuAPI.delete(id);
      await fetchMenuItems();
      setError(null);
    } catch (err) {
      console.error("Failed to delete menu item:", err);
      setError("Failed to delete menu item");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Parse ingredients from comma-separated string
      const ingredients = formData.ingredients
        .split(",")
        .map((ing) => ing.trim())
        .filter((ing) => ing.length > 0)
        .map((ing) => ({ name: ing, qty: 1 })); // Default qty to 1

      const itemData = {
        name: formData.name,
        price: parseFloat(formData.price),
        ingredients: ingredients,
        isSeasonal: formData.isSeasonal,
      };

      if (editingItem) {
        // Update existing item
        await menuAPI.update(editingItem.menuItemId, itemData);
      } else {
        // Create new item
        await menuAPI.create(itemData);
      }

      setShowAddForm(false);
      setEditingItem(null);
      await fetchMenuItems();
    } catch (err) {
      console.error("Failed to save menu item:", err);
      setError(err.message || "Failed to save menu item");
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({
      name: "",
      price: "",
      ingredients: "",
      isSeasonal: false,
    });
  };

  const filteredItems = menuItems.filter((item) => {
    if (filter === "seasonal") return item.isSeasonal === true;
    if (filter === "regular") return item.isSeasonal === false;
    return true; // "all"
  });

  if (loading) {
    return <div className="menu-management-loading">Loading menu items...</div>;
  }

  return (
    <div className="menu-management">
      <div className="menu-management-header">
        <h2>Menu Management</h2>
        <div className="menu-management-actions">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Items
            </button>
            <button
              className={`filter-btn ${filter === "seasonal" ? "active" : ""}`}
              onClick={() => setFilter("seasonal")}
            >
              Seasonal Only
            </button>
            <button
              className={`filter-btn ${filter === "regular" ? "active" : ""}`}
              onClick={() => setFilter("regular")}
            >
              Regular Only
            </button>
          </div>
          <button className="add-btn" onClick={handleAdd}>
            + Add Menu Item
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="menu-form-modal">
          <div className="menu-form-content">
            <h3>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Item Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Price ($):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Ingredients (comma-separated):</label>
                <input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e) =>
                    setFormData({ ...formData, ingredients: e.target.value })
                  }
                  placeholder="e.g., Coffee, Milk, Sugar"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isSeasonal}
                    onChange={(e) =>
                      setFormData({ ...formData, isSeasonal: e.target.checked })
                    }
                  />
                  Seasonal Menu Item
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingItem ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="menu-items-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Ingredients</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-items">
                  No menu items found
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.menuItemId}>
                  <td>{item.menuItemId}</td>
                  <td>{item.name}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    {(() => {
                      if (!item.ingredients) return "None";
                      
                      let ingredientsArray = null;
                      
                      // Parse ingredients if it's a string
                      if (typeof item.ingredients === "string") {
                        try {
                          ingredientsArray = JSON.parse(item.ingredients);
                        } catch (e) {
                          return item.ingredients;
                        }
                      } else if (Array.isArray(item.ingredients)) {
                        ingredientsArray = item.ingredients;
                      } else {
                        return "None";
                      }
                      
                      // Format ingredients array with actual names from inventory
                      if (Array.isArray(ingredientsArray) && ingredientsArray.length > 0) {
                        return ingredientsArray
                          .map((ing) => {
                            if (typeof ing === "string") return ing;
                            if (typeof ing === "object" && ing !== null) {
                              // Handle structure: {itemId: X, qty: Y}
                              if (ing.itemId !== undefined) {
                                const itemName = inventoryMap[ing.itemId] || `Item ${ing.itemId}`;
                                return `${itemName}${ing.qty !== undefined ? ` (${ing.qty})` : ""}`;
                              } else if (ing.name) {
                                return `${ing.name}${ing.qty ? ` (${ing.qty})` : ""}`;
                              } else if (ing.itemName) {
                                return `${ing.itemName}${ing.qty ? ` (${ing.qty})` : ""}`;
                              }
                              // Fallback: show itemId and qty if available
                              const parts = [];
                              if (ing.itemId !== undefined) {
                                const itemName = inventoryMap[ing.itemId] || `Item ${ing.itemId}`;
                                parts.push(itemName);
                              }
                              if (ing.qty !== undefined) parts.push(`qty: ${ing.qty}`);
                              return parts.length > 0 ? parts.join(", ") : JSON.stringify(ing);
                            }
                            return String(ing);
                          })
                          .join(", ");
                      }
                      
                      return "None";
                    })()}
                  </td>
                  <td>
                    {item.isSeasonal ? (
                      <span className="seasonal-badge">🌿 Seasonal</span>
                    ) : (
                      <span className="regular-badge">Regular</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item.menuItemId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MenuManagement;

