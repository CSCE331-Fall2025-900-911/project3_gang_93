import { useState, useEffect } from "react";
import { addOnsAPI } from "../services/api";
import "./DrinkCustomizationModal.css";

const ICE_OPTIONS = [
  { value: "light", label: "Light Ice" },
  { value: "normal", label: "Normal Ice" },
  { value: "extra", label: "Extra Ice" },
];

const SWEETNESS_OPTIONS = [
  { value: "0%", label: "0% (No Sugar)" },
  { value: "25%", label: "25% (Less Sweet)" },
  { value: "50%", label: "50% (Half Sweet)" },
  { value: "75%", label: "75% (Regular)" },
  { value: "100%", label: "100% (Full Sweet)" },
];

function DrinkCustomizationModal({ item, isOpen, onClose, onAddToCart, isExpanded = false }) {
  const [addOns, setAddOns] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [iceLevel, setIceLevel] = useState("normal");
  const [sweetnessLevel, setSweetnessLevel] = useState("100%");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAddOns();
      // Reset selections when modal opens
      setSelectedAddOns([]);
      setIceLevel("normal");
      setSweetnessLevel("100%");
    }
  }, [isOpen]);

  const fetchAddOns = async () => {
    try {
      setLoading(true);
      const addOnsData = await addOnsAPI.getAll();
      setAddOns(addOnsData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch add-ons:", err);
      setError("Failed to load add-ons");
    } finally {
      setLoading(false);
    }
  };

  const toggleAddOn = (addOnId) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotal = () => {
    let total = item.price;
    selectedAddOns.forEach((addOnId) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      if (addOn) {
        total += addOn.price;
      }
    });
    return total;
  };

  const handleAddToCart = () => {
    // Calculate the total price including add-ons
    const addOnsTotal = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      return sum + (addOn ? addOn.price : 0);
    }, 0);
    
    const customizedItem = {
      ...item,
      price: item.price + addOnsTotal, // Update price to include add-ons
      addOnIDs: selectedAddOns,
      ice: iceLevel,
      sweetness: sweetnessLevel,
    };
    onAddToCart(customizedItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="customization-modal-overlay" onClick={onClose}>
      <div
        className={`customization-modal ${isExpanded ? 'customization-modal-expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="customization-modal-header">
          <h2 className="customization-modal-title">Customize Your Drink</h2>
          <button className="customization-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="customization-modal-content">
          <div className="customization-drink-info">
            <div className="drink-icon">{item.icon}</div>
            <div className="drink-details">
              <h3 className="drink-name">{item.name}</h3>
              <p className="drink-base-price">Base: ${item.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Ice Level Selection */}
          <div className="customization-section">
            <h4 className="section-title">Ice Level</h4>
            <div className="option-buttons">
              {ICE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`option-button ${
                    iceLevel === option.value ? "active" : ""
                  }`}
                  onClick={() => setIceLevel(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sweetness Level Selection */}
          <div className="customization-section">
            <h4 className="section-title">Sweetness Level</h4>
            <div className="option-buttons">
              {SWEETNESS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`option-button ${
                    sweetnessLevel === option.value ? "active" : ""
                  }`}
                  onClick={() => setSweetnessLevel(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add-Ons Selection */}
          <div className="customization-section">
            <h4 className="section-title">Add-Ons (Optional)</h4>
            {loading ? (
              <p className="loading-text">Loading add-ons...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : addOns.length === 0 ? (
              <p className="no-addons-text">No add-ons available</p>
            ) : (
              <div className="addons-grid">
                {addOns.map((addOn) => {
                  const isSelected = selectedAddOns.includes(addOn.id);
                  return (
                    <button
                      key={addOn.id}
                      className={`addon-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleAddOn(addOn.id)}
                    >
                      <div className="addon-checkbox">
                        {isSelected && <span className="checkmark">✓</span>}
                      </div>
                      <div className="addon-info">
                        <span className="addon-name">{addOn.name}</span>
                        <span className="addon-price">
                          +${addOn.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total Price */}
          <div className="customization-total">
            <span className="total-label">Total:</span>
            <span className="total-price">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="customization-modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="add-to-cart-button"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default DrinkCustomizationModal;

