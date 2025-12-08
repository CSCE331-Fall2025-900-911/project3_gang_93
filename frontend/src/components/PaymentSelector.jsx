import React, { useState, useEffect } from "react";
import { translate, translateBatch } from "../utils/translation";
import "./PaymentSelector.css";

// UI text keys (defined outside component to avoid dependency issues)
const UI_TEXT_KEYS = {
  selectPaymentMethod: "Select Payment Method",
  card: "Card",
  cash: "Cash",
  enterCashGiven: "Enter cash given",
  addTipOptional: "Add Tip (Optional)",
  customPercent: "Custom %",
  customAmount: "Custom amount",
  tip: "Tip",
  confirmPayment: "Confirm Payment",
  cancel: "Cancel",
  pleaseSelectPaymentMethod: "Please select a payment method.",
  pleaseEnterValidCashAmount: "Please enter a valid cash amount.",
};

export default function PaymentSelector({ open, onClose, onSelect, subtotal, isExpanded = false, language = "en" }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [tipType, setTipType] = useState("percent"); // "percent" or "dollar"
  const [error, setError] = useState("");
  const [translations, setTranslations] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedMethod(null);
      setCashAmount("");
      setTipAmount("");
      setTipType("percent");
      setError("");
    }
  }, [open]);

  // Translate UI text when language changes or modal opens
  useEffect(() => {
    const translateUIText = async () => {
      // Initialize with English first
      const englishTranslations = {};
      Object.keys(UI_TEXT_KEYS).forEach(key => {
        englishTranslations[key] = UI_TEXT_KEYS[key];
      });
      
      if (language === "en") {
        setTranslations(englishTranslations);
        return;
      }

      if (!open) {
        setTranslations(englishTranslations);
        return;
      }

      try {
        console.log("[PaymentSelector] Translating UI text to", language);
        const textsToTranslate = Object.values(UI_TEXT_KEYS);
        const translatedTexts = await Promise.all(
          textsToTranslate.map(text => translate(text, language, true))
        );
        console.log("[PaymentSelector] Translated texts:", translatedTexts);
        
        const newTranslations = {};
        Object.keys(UI_TEXT_KEYS).forEach((key, index) => {
          newTranslations[key] = translatedTexts[index];
        });
        setTranslations(newTranslations);
      } catch (error) {
        console.error("[PaymentSelector] Failed to translate:", error);
        setTranslations(englishTranslations);
      }
    };

    translateUIText();
  }, [language, open]);

  if (!open) return null;

  const calculateTip = () => {
    if (!tipAmount || tipAmount === "") return 0;
    const tip = parseFloat(tipAmount);
    if (isNaN(tip) || tip < 0) return 0;
    
    if (tipType === "percent") {
      return (subtotal * tip) / 100;
    } else {
      return tip;
    }
  };

  const handleTipButton = (percent) => {
    setTipType("percent");
    setTipAmount(percent.toString());
  };

  const handleConfirm = () => {
    if (!selectedMethod) {
      setError(translations.pleaseSelectPaymentMethod || "Please select a payment method.");
      return;
    }

    if (selectedMethod === "Cash") {
      const value = parseFloat(cashAmount);
      if (isNaN(value) || value <= 0) {
        setError(translations.pleaseEnterValidCashAmount || "Please enter a valid cash amount.");
        return;
      }
    }

    const tip = calculateTip();
    onSelect(selectedMethod, selectedMethod === "Cash" ? parseFloat(cashAmount) : null, tip);
  };

  return (
    <div className="payment-selector-overlay">
      <div
        className={`payment-selector-content ${isExpanded ? "payment-selector-content-expanded" : ""}`}
      >
        <h2 className="payment-selector-title">
          {translations.selectPaymentMethod || "Select Payment Method"}
        </h2>

        <div className="payment-methods">
          <button
            onClick={() => setSelectedMethod("Card")}
            className={`payment-method-button ${selectedMethod === "Card" ? "selected" : ""}`}
          >
            💳 {translations.card || "Card"}
          </button>
          <button
            onClick={() => setSelectedMethod("Cash")}
            className={`payment-method-button ${selectedMethod === "Cash" ? "selected" : ""}`}
          >
            💵 {translations.cash || "Cash"}
          </button>
        </div>

        {selectedMethod === "Cash" && (
          <div className="cash-input-container">
            <input
              type="number"
              step="0.01"
              placeholder={translations.enterCashGiven || "Enter cash given"}
              value={cashAmount}
              onChange={(e) => {
                setCashAmount(e.target.value);
                setError("");
              }}
              className="cash-input"
            />
            {error && <p className="error-message">{error}</p>}
          </div>
        )}

        {/* Tip Section */}
        <div className="tip-section">
          <h3 className="tip-title">
            {translations.addTipOptional || "Add Tip (Optional)"}
          </h3>
          
          {/* Quick Tip Buttons */}
          <div className="tip-buttons">
            <button
              onClick={() => handleTipButton(15)}
              className={`tip-button ${tipAmount === "15" && tipType === "percent" ? "active" : ""}`}
            >
              15%
            </button>
            <button
              onClick={() => handleTipButton(18)}
              className={`tip-button ${tipAmount === "18" && tipType === "percent" ? "active" : ""}`}
            >
              18%
            </button>
            <button
              onClick={() => handleTipButton(20)}
              className={`tip-button ${tipAmount === "20" && tipType === "percent" ? "active" : ""}`}
            >
              20%
            </button>
            <button
              onClick={() => handleTipButton(25)}
              className={`tip-button ${tipAmount === "25" && tipType === "percent" ? "active" : ""}`}
            >
              25%
            </button>
          </div>

          {/* Custom Tip Input */}
          <div className="custom-tip-container">
            <div className="tip-type-buttons">
              <button
                onClick={() => {
                  setTipType("percent");
                  setTipAmount("");
                }}
                className={`tip-type-button ${tipType === "percent" ? "active" : ""}`}
              >
                %
              </button>
              <button
                onClick={() => {
                  setTipType("dollar");
                  setTipAmount("");
                }}
                className={`tip-type-button ${tipType === "dollar" ? "active" : ""}`}
              >
                $
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              placeholder={tipType === "percent" 
                ? (translations.customPercent || "Custom %")
                : (translations.customAmount || "Custom amount")}
              value={tipAmount}
              onChange={(e) => {
                setTipAmount(e.target.value);
                setError("");
              }}
              className="custom-tip-input"
            />
          </div>
          
          {tipAmount && (
            <p className="tip-amount-display">
              {translations.tip || "Tip"}: ${calculateTip().toFixed(2)}
            </p>
          )}
        </div>

        <div className="confirm-button-container">
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod}
            className="confirm-button"
          >
            {translations.confirmPayment || "Confirm Payment"}
          </button>
        </div>

        <div className="cancel-button-container">
          <button
            onClick={onClose}
            className="cancel-button"
          >
            {translations.cancel || "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
