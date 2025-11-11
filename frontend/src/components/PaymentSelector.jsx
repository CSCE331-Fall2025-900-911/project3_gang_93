import React, { useState, useEffect } from "react";

export default function PaymentSelector({ open, onClose, onSelect, subtotal }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [tipType, setTipType] = useState("percent"); // "percent" or "dollar"
  const [error, setError] = useState("");

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
      setError("Please select a payment method.");
      return;
    }

    if (selectedMethod === "Cash") {
      const value = parseFloat(cashAmount);
      if (isNaN(value) || value <= 0) {
        setError("Please enter a valid cash amount.");
        return;
      }
    }

    const tip = calculateTip();
    onSelect(selectedMethod, selectedMethod === "Cash" ? parseFloat(cashAmount) : null, tip);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          textAlign: "center",
          width: "400px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2>Select Payment Method</h2>

        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setSelectedMethod("Card")}
            style={{
              marginRight: "1rem",
              padding: "0.5rem 1rem",
              background:
                selectedMethod === "Card" ? "#2563eb" : "transparent",
              color: selectedMethod === "Card" ? "white" : "black",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            💳 Card
          </button>
          <button
            onClick={() => setSelectedMethod("Cash")}
            style={{
              padding: "0.5rem 1rem",
              background:
                selectedMethod === "Cash" ? "#2563eb" : "transparent",
              color: selectedMethod === "Cash" ? "white" : "black",
              border: "1px solid #ccc",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            💵 Cash
          </button>
        </div>

        {selectedMethod === "Cash" && (
          <div style={{ marginTop: "1rem" }}>
            <input
              type="number"
              step="0.01"
              placeholder="Enter cash given"
              value={cashAmount}
              onChange={(e) => {
                setCashAmount(e.target.value);
                setError("");
              }}
              style={{
                padding: "0.5rem",
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "5px",
                marginBottom: "0.5rem",
              }}
            />
            {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}
          </div>
        )}

        {/* Tip Section */}
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem" }}>Add Tip (Optional)</h3>
          
          {/* Quick Tip Buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={() => handleTipButton(15)}
              style={{
                padding: "0.4rem 0.8rem",
                background: tipAmount === "15" && tipType === "percent" ? "#2563eb" : "#f0f0f0",
                color: tipAmount === "15" && tipType === "percent" ? "white" : "black",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              15%
            </button>
            <button
              onClick={() => handleTipButton(18)}
              style={{
                padding: "0.4rem 0.8rem",
                background: tipAmount === "18" && tipType === "percent" ? "#2563eb" : "#f0f0f0",
                color: tipAmount === "18" && tipType === "percent" ? "white" : "black",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              18%
            </button>
            <button
              onClick={() => handleTipButton(20)}
              style={{
                padding: "0.4rem 0.8rem",
                background: tipAmount === "20" && tipType === "percent" ? "#2563eb" : "#f0f0f0",
                color: tipAmount === "20" && tipType === "percent" ? "white" : "black",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              20%
            </button>
            <button
              onClick={() => handleTipButton(25)}
              style={{
                padding: "0.4rem 0.8rem",
                background: tipAmount === "25" && tipType === "percent" ? "#2563eb" : "#f0f0f0",
                color: tipAmount === "25" && tipType === "percent" ? "white" : "black",
                border: "1px solid #ccc",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              25%
            </button>
          </div>

          {/* Custom Tip Input */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "0.25rem", flex: 1 }}>
              <button
                onClick={() => {
                  setTipType("percent");
                  setTipAmount("");
                }}
                style={{
                  padding: "0.4rem 0.6rem",
                  background: tipType === "percent" ? "#2563eb" : "#f0f0f0",
                  color: tipType === "percent" ? "white" : "black",
                  border: "1px solid #ccc",
                  borderRadius: "5px 0 0 5px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                %
              </button>
              <button
                onClick={() => {
                  setTipType("dollar");
                  setTipAmount("");
                }}
                style={{
                  padding: "0.4rem 0.6rem",
                  background: tipType === "dollar" ? "#2563eb" : "#f0f0f0",
                  color: tipType === "dollar" ? "white" : "black",
                  border: "1px solid #ccc",
                  borderRadius: "0 5px 5px 0",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                $
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              placeholder={tipType === "percent" ? "Custom %" : "Custom amount"}
              value={tipAmount}
              onChange={(e) => {
                setTipAmount(e.target.value);
                setError("");
              }}
              style={{
                padding: "0.5rem",
                flex: 2,
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
          </div>
          
          {tipAmount && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
              Tip: ${calculateTip().toFixed(2)}
            </p>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod}
            style={{
              background: selectedMethod ? "#2563eb" : "#ccc",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "5px",
              cursor: selectedMethod ? "pointer" : "not-allowed",
              width: "100%",
            }}
          >
            Confirm Payment
          </button>
        </div>

        <div style={{ marginTop: "0.5rem" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#555",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
