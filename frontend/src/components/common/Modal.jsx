import { C } from "../../utils/theme";

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 32,
          width: wide ? 780 : 520,
          maxWidth: "96vw",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 30px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 26,
          }}
        >
          <h2
            style={{
              color: C.gold,
              fontSize: 20,
              fontFamily: "serif",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              fontSize: 26,
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
