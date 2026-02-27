import { C } from "../../utils/theme";

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, style }) {
  const base = {
    border: "none",
    borderRadius: 9,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? 12 : 14,
    padding: size === "sm" ? "6px 13px" : "10px 20px",
    fontFamily: "inherit",
  };
  const v = {
    primary: {
      background: `linear-gradient(135deg, ${C.gold}, #a07848)`,
      color: "#0f0c09",
    },
    ghost: {
      background: "transparent",
      color: C.gold,
      border: `1px solid ${C.border}`,
    },
    danger: {
      background: "transparent",
      color: C.danger,
      border: `1px solid ${C.danger}`,
    },
    success: {
      background: `linear-gradient(135deg, ${C.success}, #3a7d50)`,
      color: "#fff",
    },
  };
  return (
    <button
      style={{ ...base, ...v[variant], ...style }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
