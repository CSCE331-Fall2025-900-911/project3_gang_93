import { useState, useEffect, useRef } from "react";
import { addOnsAPI } from "../services/api";
import { translate, translateBatch, clearTranslationCache } from "../utils/translation";
import "./DrinkCustomizationModal.css";

const TEMPERATURE_OPTIONS = [
  { value: "cold", label: "Cold" },
  { value: "hot", label: "Hot" },
];

const ICE_OPTIONS = [
  { value: "no ice", label: "No Ice" },
  { value: "light", label: "Light Ice" },
  { value: "normal", label: "Normal Ice" },
  { value: "extra", label: "Extra Ice" },
];

const SIZE_OPTIONS = [
  { value: "small", label: "Small", priceAdjustment: -1.0 },
  { value: "regular", label: "Regular", priceAdjustment: 0.0 },
  { value: "large", label: "Large", priceAdjustment: 1.0 },
];

const SWEETNESS_OPTIONS = [
  { value: "0%", label: "0% (No Sugar)" },
  { value: "25%", label: "25% (Less Sweet)" },
  { value: "50%", label: "50% (Half Sweet)" },
  { value: "75%", label: "75% (Regular)" },
  { value: "100%", label: "100% (Full Sweet)" },
  { value: "125%", label: "125% (Extra Sweetness)" },
];

// UI text keys (defined outside component to avoid dependency issues)
const UI_TEXT_KEYS = {
  customizeYourDrink: "Customize Your Drink",
  base: "Base",
  temperature: "Temperature",
  iceLevel: "Ice Level",
  size: "Size",
  sweetnessLevel: "Sweetness Level",
  addOnsOptional: "Add-Ons (Optional)",
  loadingAddOns: "Loading add-ons...",
  noAddOnsAvailable: "No add-ons available",
  total: "Total",
  cancel: "Cancel",
  addToCart: "Add to Cart",
};

function DrinkCustomizationModal({ item, isOpen, onClose, onAddToCart, isExpanded = false, language = "en", onTranslatingChange }) {
  const [addOns, setAddOns] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [temperature, setTemperature] = useState("cold");
  const [iceLevel, setIceLevel] = useState("normal");
  const [size, setSize] = useState("regular");
  const [sweetnessLevel, setSweetnessLevel] = useState("100%");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState(false);
  const [translatedTemperatureOptions, setTranslatedTemperatureOptions] = useState(TEMPERATURE_OPTIONS);
  const [translatedIceOptions, setTranslatedIceOptions] = useState(ICE_OPTIONS);
  const [translatedSizeOptions, setTranslatedSizeOptions] = useState(SIZE_OPTIONS);
  const [translatedSweetnessOptions, setTranslatedSweetnessOptions] = useState(SWEETNESS_OPTIONS);
  const [translatedAddOns, setTranslatedAddOns] = useState([]);
  const [itemTranslatedName, setItemTranslatedName] = useState(null);

  // Debug: Log when modal receives props
  useEffect(() => {
    console.log("[DrinkCustomizationModal] Props changed - isOpen:", isOpen, "language:", language, "item:", item?.name);
  }, [isOpen, language, item]);

  // Track previous language to detect actual language changes
  const prevLanguageRef = useRef(language);

  // Translate ALL content (UI text, options, item name, add-ons) in one batch when language changes
  // Only translate when language changes, not when modal just opens
  useEffect(() => {
    const translateAllContent = async () => {
      // Initialize with English first
      const englishTranslations = {};
      Object.keys(UI_TEXT_KEYS).forEach(key => {
        englishTranslations[key] = UI_TEXT_KEYS[key];
      });
      
      if (language === "en") {
        setTranslations(englishTranslations);
        setTranslatedTemperatureOptions(TEMPERATURE_OPTIONS);
        setTranslatedIceOptions(ICE_OPTIONS);
        setTranslatedSizeOptions(SIZE_OPTIONS);
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS);
        if (item) setItemTranslatedName(item.name);
        setTranslatedAddOns(addOns);
        setTranslating(false);
        if (onTranslatingChange) {
          onTranslatingChange(false);
        }
        return;
      }

      // Only translate if modal is open AND language is not English
      // Don't translate just because modal opened - only when language changes
      if (!isOpen) {
        // Set English as fallback, but don't notify parent of translation state
        setTranslations(englishTranslations);
        setTranslatedTemperatureOptions(TEMPERATURE_OPTIONS);
        setTranslatedIceOptions(ICE_OPTIONS);
        setTranslatedSizeOptions(SIZE_OPTIONS);
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS);
        setTranslating(false);
        // Don't call onTranslatingChange when modal is closed
        return;
      }

      // Modal is open and language is not English - translate ALL content in one batch
      // Only notify parent of translation state if language actually changed (not just modal opening)
      const languageChanged = prevLanguageRef.current !== language;
      prevLanguageRef.current = language;
      
      setTranslating(true);
      // Only show loading overlay if language actually changed
      if (onTranslatingChange && languageChanged) {
        onTranslatingChange(true);
      }

      try {
        // Collect ALL texts to translate in one batch: UI text, options, item name, add-ons
        const allTexts = [
          ...Object.values(UI_TEXT_KEYS),
          ...TEMPERATURE_OPTIONS.map(opt => opt.label),
          ...ICE_OPTIONS.map(opt => opt.label),
          ...SIZE_OPTIONS.map(opt => opt.label),
          ...SWEETNESS_OPTIONS.map(opt => opt.label),
          ...(item ? [item.name] : []),
          ...addOns.map(addOn => addOn.name),
        ];

        // Use batch translation API (respects cache automatically, won't retranslate cached items)
        const allTranslated = await translateBatch(allTexts, language);

        // Map translations back to their components
        let index = 0;
        
        // UI text translations
        const newTranslations = {};
        Object.keys(UI_TEXT_KEYS).forEach((key) => {
          newTranslations[key] = allTranslated[index++];
        });
        setTranslations(newTranslations);

        // Temperature options
        const translatedTemperatureLabels = allTranslated.slice(index, index + TEMPERATURE_OPTIONS.length);
        index += TEMPERATURE_OPTIONS.length;
        setTranslatedTemperatureOptions(TEMPERATURE_OPTIONS.map((opt, idx) => ({
          ...opt,
          label: translatedTemperatureLabels[idx]
        })));

        // Ice options
        const translatedIceLabels = allTranslated.slice(index, index + ICE_OPTIONS.length);
        index += ICE_OPTIONS.length;
        setTranslatedIceOptions(ICE_OPTIONS.map((opt, idx) => ({
          ...opt,
          label: translatedIceLabels[idx]
        })));

        // Size options
        const translatedSizeLabels = allTranslated.slice(index, index + SIZE_OPTIONS.length);
        index += SIZE_OPTIONS.length;
        setTranslatedSizeOptions(SIZE_OPTIONS.map((opt, idx) => ({
          ...opt,
          label: translatedSizeLabels[idx]
        })));

        // Sweetness options
        const translatedSweetnessLabels = allTranslated.slice(index, index + SWEETNESS_OPTIONS.length);
        index += SWEETNESS_OPTIONS.length;
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS.map((opt, idx) => ({
          ...opt,
          label: translatedSweetnessLabels[idx]
        })));

        // Item name
        if (item) {
          setItemTranslatedName(allTranslated[index++]);
        }

        // Add-ons
        const translatedAddOnNames = allTranslated.slice(index);
        setTranslatedAddOns(addOns.map((addOn, idx) => ({
          ...addOn,
          translatedName: translatedAddOnNames[idx] || addOn.name
        })));

        console.log("[DrinkCustomizationModal] All translations completed");
      } catch (error) {
        console.error("[DrinkCustomizationModal] Failed to translate:", error);
        setTranslations(englishTranslations);
        setTranslatedTemperatureOptions(TEMPERATURE_OPTIONS);
        setTranslatedIceOptions(ICE_OPTIONS);
        setTranslatedSizeOptions(SIZE_OPTIONS);
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS);
        if (item) setItemTranslatedName(item.name);
        setTranslatedAddOns(addOns);
      } finally {
        setTranslating(false);
        // Only notify parent if we notified it of translation start
        if (onTranslatingChange && prevLanguageRef.current === language) {
          onTranslatingChange(false);
        }
      }
    };

    translateAllContent();
    // Only depend on language - don't retranslate when modal just opens or item/addOns change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Item name and add-ons are now translated in the main batch translation effect above

  useEffect(() => {
    if (isOpen) {
      // Reset selections when modal opens
      setSelectedAddOns([]);
      setTemperature("cold");
      setIceLevel("normal");
      setSize("regular");
      setSweetnessLevel("100%");
      // Note: If temperature is set to "hot" elsewhere, ice will be auto-set to "no ice" via the temperature change handler
      // Fetch add-ons - translations will happen after add-ons load (via dependency array)
      fetchAddOns();
    } else {
      // Reset translating state when modal closes
      setTranslating(false);
      if (onTranslatingChange) {
        onTranslatingChange(false);
      }
    }
  }, [isOpen, onTranslatingChange]);

  // Automatically set ice to "no ice" when temperature is set to "hot"
  useEffect(() => {
    if (temperature === "hot" && iceLevel !== "no ice") {
      setIceLevel("no ice");
    }
  }, [temperature, iceLevel]);

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
    
    // Add size adjustment
    const selectedSize = SIZE_OPTIONS.find(s => s.value === size);
    if (selectedSize) {
      total += selectedSize.priceAdjustment;
    }
    
    // Add add-ons
    selectedAddOns.forEach((addOnId) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      if (addOn) {
        total += addOn.price;
      }
    });
    
    return total;
  };

  const handleAddToCart = () => {
    // Calculate the total price including size adjustment and add-ons
    const selectedSize = SIZE_OPTIONS.find(s => s.value === size);
    const sizeAdjustment = selectedSize ? selectedSize.priceAdjustment : 0;
    
    const addOnsTotal = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      return sum + (addOn ? addOn.price : 0);
    }, 0);
    
    const customizedItem = {
      ...item,
      price: item.price + sizeAdjustment + addOnsTotal, // Update price to include size and add-ons
      addOnIDs: selectedAddOns,
      temperature: temperature,
      ice: iceLevel,
      size: size,
      sweetness: sweetnessLevel,
    };
    onAddToCart(customizedItem);
    onClose();
  };

  if (!isOpen) {
    // Reset translating state when modal is closed
    if (translating) {
      setTranslating(false);
      if (onTranslatingChange) {
        onTranslatingChange(false);
      }
    }
    return null;
  }

  return (
    <div className="customization-modal-overlay" onClick={onClose}>
      <div
        className={`customization-modal ${isExpanded ? 'customization-modal-expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* No loading overlay in modal - main KioskView handles it */}
        
        <div className="customization-modal-header">
          <h2 className="customization-modal-title">{translations.customizeYourDrink || "Customize Your Drink"}</h2>
          <button className="customization-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="customization-modal-content">
          <div className="customization-drink-info">
            {item && item.icon && (
              <div className="drink-icon">
                <img 
                  src={item.icon}
                  alt={itemTranslatedName || item.name}
                  onError={(e) => {
                    // Hide image if it fails to load (e.g., file doesn't exist on deployed server)
                    console.warn(`[DrinkCustomizationModal] Failed to load image for ${item.name}:`, item.icon);
                    e.target.style.display = 'none';
                  }}
                  loading="lazy"
                  key={`${item.id}-${language}`}
                />
              </div>
            )}
            <div className="drink-details">
              <h3 className="drink-name">{itemTranslatedName || item.name}</h3>
              <p className="drink-base-price">{translations.base || "Base"}: ${item.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Temperature Selection */}
          <div className="customization-section">
            <h4 className="section-title">{translations.temperature || "Temperature"}</h4>
            <div className="option-buttons">
              {translatedTemperatureOptions.map((option) => (
                <button
                  key={option.value}
                  className={`option-button ${
                    temperature === option.value ? "active" : ""
                  }`}
                  onClick={() => {
                    setTemperature(option.value);
                    // If switching to hot, automatically set ice to "no ice"
                    if (option.value === "hot") {
                      setIceLevel("no ice");
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="customization-section">
            <h4 className="section-title">{translations.size || "Size"}</h4>
            <div className="option-buttons">
              {translatedSizeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`option-button ${
                    size === option.value ? "active" : ""
                  }`}
                  onClick={() => setSize(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ice Level Selection */}
          <div className="customization-section">
            <h4 className="section-title">{translations.iceLevel || "Ice Level"}</h4>
            <div className="option-buttons">
              {translatedIceOptions.map((option) => (
                <button
                  key={option.value}
                  className={`option-button ${
                    iceLevel === option.value ? "active" : ""
                  }`}
                  onClick={() => {
                    setIceLevel(option.value);
                    // If selecting ice and temperature is hot, switch to cold
                    if (option.value !== "no ice" && temperature === "hot") {
                      setTemperature("cold");
                    }
                  }}
                  disabled={temperature === "hot" && option.value !== "no ice"}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sweetness Level Selection */}
          <div className="customization-section">
            <h4 className="section-title">{translations.sweetnessLevel || "Sweetness Level"}</h4>
            <div className="option-buttons">
              {translatedSweetnessOptions.map((option) => (
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
            <h4 className="section-title">{translations.addOnsOptional || "Add-Ons (Optional)"}</h4>
            {loading ? (
              <p className="loading-text">{translations.loadingAddOns || "Loading add-ons..."}</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : addOns.length === 0 ? (
              <p className="no-addons-text">{translations.noAddOnsAvailable || "No add-ons available"}</p>
            ) : (
              <div className="addons-grid">
                {(translatedAddOns.length > 0 ? translatedAddOns : addOns).map((addOn) => {
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
                        <span className="addon-name">{addOn.translatedName || addOn.name}</span>
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
            <span className="total-label">{translations.total || "Total"}:</span>
            <span className="total-price">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="customization-modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
          >
            {translations.cancel || "Cancel"}
          </button>
          <button
            className="add-to-cart-button"
            onClick={handleAddToCart}
          >
            {translations.addToCart || "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DrinkCustomizationModal;

