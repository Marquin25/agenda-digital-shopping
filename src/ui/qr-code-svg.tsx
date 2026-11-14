import QRCode from "qrcode";

/** Light modules around the code, as the QR standard recommends for reliable scanning. */
const QUIET_ZONE = 4;

/**
 * QR Code drawn as inline SVG on the server (no external service, no HTML injection).
 * Rendered dark on a light background in both themes, which phone cameras need.
 */
export function QrCodeSvg({ value, label, className }: { value: string; label: string; className?: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const size = modules.size + QUIET_ZONE * 2;
  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
    }
  }
  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      data-qr-value={value}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
