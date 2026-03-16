import { C } from "../../utils/theme";

export function Avatar({ url, name, size = 80 }) {
  const ini = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: url
          ? "transparent"
          : C.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        border: `3px solid ${C.gold}`,
        flexShrink: 0,
        fontSize: size * 0.3,
        fontWeight: 700,
        color: "#fff",
        fontFamily: "Marcellus, serif",
      }}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        ini
      )}
    </div>
  );
}
