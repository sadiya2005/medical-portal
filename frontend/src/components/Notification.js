import React, { useEffect } from "react";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const getStyle = () => {
    const baseStyle = {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "15px 25px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      animation: "slideIn 0.3s ease-out forwards",
      maxWidth: "350px",
      lineHeight: "1.4"
    };

    if (type === "success") return { ...baseStyle, background: "#2ecc71" };
    if (type === "error") return { ...baseStyle, background: "#e74c3c" };
    return { ...baseStyle, background: "#3498db" };
  };

  return (
    <div style={getStyle()}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        style={{ 
          background: "transparent", 
          border: "none", 
          color: "white", 
          cursor: "pointer", 
          fontSize: "18px",
          marginLeft: "10px"
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Notification;
