import React from "react";
import "./AlertModal.css";

export default function AlertModal({ message, onClose, show = false }) {
  if (!show || !message) return null;

  return (
    <div
      className="alert-modal-overlay"
      onClick={onClose}
    >
      <div
        className="alert-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-modal-message">
          {message.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <button
          className="alert-modal-button"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}

