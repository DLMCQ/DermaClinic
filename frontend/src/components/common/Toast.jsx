import { useEffect } from "react";
import { C } from "../../utils/theme";

export function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        background: type === "error" ? "#3d1515" : "#0f2a1a",
        border: `1px solid ${type === "error" ? C.danger : C.success}`,
        color: type === "error" ? C.danger : "#7ed4a0",
        borderRadius: 12,
        padding: "14px 22px",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        animation: "slideIn 0.3s ease",
      }}
    >
      {type === "error" ? "❌ " : "✅ "}
      {message}
    </div>
  );
}
