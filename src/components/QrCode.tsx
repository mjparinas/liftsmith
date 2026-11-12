import qrcode from "qrcode-generator";

// Ported from Gradelings (src/components/teachers/QrCode.tsx); used for the two-step sign-in setup and Friends' scan to follow.

// A QR code drawn as one inline SVG path (no image files or scripts at print time). Always black on white, whatever the
// theme, because a code in other colours may not scan.

/** The path of the dark squares and the number of squares along a side. */
export function qrPath(text: string): { size: number; d: string } {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  let d = "";
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
  return { size, d };
}

const QUIET = 3;

export function QrCode({ text, label, className }: { text: string; label: string; className?: string }) {
  const { size, d } = qrPath(text);
  const edge = size + QUIET * 2;
  return (
    <svg role="img" aria-label={label} viewBox={`${-QUIET} ${-QUIET} ${edge} ${edge}`} shapeRendering="crispEdges" className={className}>
      <rect x={-QUIET} y={-QUIET} width={edge} height={edge} fill="white" />
      <path d={d} fill="black" />
    </svg>
  );
}
