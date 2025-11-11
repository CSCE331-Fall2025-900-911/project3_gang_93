// src/components/PaymentSelector.jsx
import React from "react";

export default function PaymentSelector({ open, onClose, onSelect }) {
  if (!open) return null;

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
        }}
      >
        <h2>Select Payment Method</h2>
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => onSelect("Card")}
            style={{
              marginRight: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            💳 Card
          </button>
          <button
            onClick={() => onSelect("Cash")}
            style={{
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            💵 Cash
          </button>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={onClose} style={{ padding: "0.25rem 0.75rem" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
