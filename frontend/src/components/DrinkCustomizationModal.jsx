import { useState, useEffect } from "react";
import { addOnsAPI } from "../services/api";
import { translate, translateBatch, clearTranslationCache } from "../utils/translation";
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

// UI text keys (defined outside component to avoid dependency issues)
const UI_TEXT_KEYS = {
  customizeYourDrink: "Customize Your Drink",
  base: "Base",
  iceLevel: "Ice Level",
  sweetnessLevel: "Sweetness Level",
  addOnsOptional: "Add-Ons (Optional)",
  loadingAddOns: "Loading add-ons...",
  noAddOnsAvailable: "No add-ons available",
  total: "Total",
  cancel: "Cancel",
  addToCart: "Add to Cart",
};

function DrinkCustomizationModal({ item, isOpen, onClose, onAddToCart, isExpanded = false, language = "en" }) {
  const [addOns, setAddOns] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [iceLevel, setIceLevel] = useState("normal");
  const [sweetnessLevel, setSweetnessLevel] = useState("100%");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [translations, setTranslations] = useState({});
  const [translatedIceOptions, setTranslatedIceOptions] = useState(ICE_OPTIONS);
  const [translatedSweetnessOptions, setTranslatedSweetnessOptions] = useState(SWEETNESS_OPTIONS);
  const [translatedAddOns, setTranslatedAddOns] = useState([]);
  const [itemTranslatedName, setItemTranslatedName] = useState(null);

  // Clear cache and translate UI text when language changes or modal opens
  useEffect(() => {
    // Clear cache when modal opens with a new language to force fresh translations
    if (isOpen && language !== "en") {
      // Clear specific cache entries for our UI text to force re-translation
      const textsToClear = Object.values(UI_TEXT_KEYS);
      textsToClear.forEach(text => {
        const cacheKey = `${text}|${language}`;
        // We'll clear these in the translation function itself
      });
    }

    const translateUIText = async () => {
      // Initialize with English first
      const englishTranslations = {};
      Object.keys(UI_TEXT_KEYS).forEach(key => {
        englishTranslations[key] = UI_TEXT_KEYS[key];
      });
      
      if (language === "en") {
        setTranslations(englishTranslations);
        setTranslatedIceOptions(ICE_OPTIONS);
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS);
        return;
      }

      if (!isOpen) {
        // Still set English translations if modal is closed
        setTranslations(englishTranslations);
        setTranslatedIceOptions(ICE_OPTIONS);
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS);
        return;
      }

      try {
        console.log("[DrinkCustomizationModal] Translating UI text to", language);
        const textsToTranslate = Object.values(UI_TEXT_KEYS);
        // Force fresh translation by bypassing cache for these specific strings
        const translatedTexts = await Promise.all(
          textsToTranslate.map(text => translate(text, language, true))
        );
        console.log("[DrinkCustomizationModal] Translated texts:", translatedTexts);
        console.log("[DrinkCustomizationModal] Original texts:", textsToTranslate);
        
        const newTranslations = {};
        Object.keys(UI_TEXT_KEYS).forEach((key, index) => {
          newTranslations[key] = translatedTexts[index];
          // Log if translation didn't change
          if (translatedTexts[index] === textsToTranslate[index] && language !== "en") {
            console.warn(`[DrinkCustomizationModal] "${textsToTranslate[index]}" was not translated (returned same text) - key: ${key}`);
          }
          // Debug log for specific keys
          if (key === "base" || key === "total") {
            console.log(`[DrinkCustomizationModal] Translation for "${key}": "${textsToTranslate[index]}" -> "${translatedTexts[index]}"`);
          }
        });
        console.log("[DrinkCustomizationModal] Final translations object:", newTranslations);
        setTranslations(newTranslations);

        // Translate ice options
        console.log("[DrinkCustomizationModal] Translating ice options");
        const iceLabels = ICE_OPTIONS.map(opt => opt.label);
        const translatedIceLabels = await Promise.all(
          iceLabels.map(label => translate(label, language, true))
        );
        console.log("[DrinkCustomizationModal] Translated ice labels:", translatedIceLabels);
        setTranslatedIceOptions(ICE_OPTIONS.map((opt, idx) => ({
          ...opt,
          label: translatedIceLabels[idx]
        })));

        // Translate sweetness options
        console.log("[DrinkCustomizationModal] Translating sweetness options");
        const sweetnessLabels = SWEETNESS_OPTIONS.map(opt => opt.label);
        const translatedSweetnessLabels = await Promise.all(
          sweetnessLabels.map(label => translate(label, language, true))
        );
        console.log("[DrinkCustomizationModal] Translated sweetness labels:", translatedSweetnessLabels);
        console.log("[DrinkCustomizationModal] Original sweetness labels:", sweetnessLabels);
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS.map((opt, idx) => ({
          ...opt,
          label: translatedSweetnessLabels[idx]
        })));
      } catch (error) {
        console.error("[DrinkCustomizationModal] Failed to translate:", error);
        setTranslations(englishTranslations);
        setTranslatedIceOptions(ICE_OPTIONS);
        setTranslatedSweetnessOptions(SWEETNESS_OPTIONS);
      }
    };

    translateUIText();
  }, [language, isOpen]);

  // Translate item name when item or language changes
  useEffect(() => {
    const translateItemName = async () => {
      if (!item) {
        setItemTranslatedName(null);
        return;
      }

      if (language === "en") {
        setItemTranslatedName(item.name);
        return;
      }

      if (!isOpen) {
        return; // Don't translate if modal is closed
      }

      try {
        console.log("[DrinkCustomizationModal] Translating item name:", item.name);
        const translated = await translate(item.name, language, true); // Force refresh
        console.log("[DrinkCustomizationModal] Translated item name:", translated);
        setItemTranslatedName(translated);
      } catch (error) {
        console.error("[DrinkCustomizationModal] Failed to translate item name:", error);
        setItemTranslatedName(item.name);
      }
    };

    translateItemName();
  }, [item, language, isOpen]);

  // Translate add-ons when they load or language changes
  useEffect(() => {
    const translateAddOns = async () => {
      if (addOns.length === 0) {
        setTranslatedAddOns([]);
        return;
      }

      if (language === "en") {
        setTranslatedAddOns(addOns);
        return;
      }

      if (!isOpen) {
        return; // Don't translate if modal is closed
      }

      try {
        console.log("[DrinkCustomizationModal] Translating add-ons");
        const addOnNames = addOns.map(addOn => addOn.name);
        // Force fresh translation for add-ons
        const translatedNames = await Promise.all(
          addOnNames.map(name => translate(name, language, true))
        );
        console.log("[DrinkCustomizationModal] Translated add-on names:", translatedNames);
        setTranslatedAddOns(addOns.map((addOn, idx) => ({
          ...addOn,
          translatedName: translatedNames[idx]
        })));
      } catch (error) {
        console.error("[DrinkCustomizationModal] Failed to translate add-ons:", error);
        setTranslatedAddOns(addOns);
      }
    };

    translateAddOns();
  }, [addOns, language, isOpen]);

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
          <h2 className="customization-modal-title">{translations.customizeYourDrink || "Customize Your Drink"}</h2>
          <button className="customization-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="customization-modal-content">
          <div className="customization-drink-info">
            <div className="drink-icon">{item.icon}</div>
            <div className="drink-details">
              <h3 className="drink-name">{itemTranslatedName || item.name}</h3>
              <p className="drink-base-price">{translations.base || "Base"}: ${item.price.toFixed(2)}</p>
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
                  onClick={() => setIceLevel(option.value)}
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

