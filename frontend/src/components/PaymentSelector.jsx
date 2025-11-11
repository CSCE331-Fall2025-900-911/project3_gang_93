import React, { useState } from "react";

export default function PaymentSelector({ open, onClose, onSelect }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    if (selectedMethod === "Cash") {
      const value = parseFloat(cashAmount);
      if (isNaN(value) || value <= 0) {
        setError("Please enter a valid cash amount.");
        return;
      }
      onSelect("Cash", value);
    } else {
      onSelect("Card");
    }
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
          width: "300px",
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
            Confirm
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
