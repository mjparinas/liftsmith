// One icon set for the app: 24-unit grid, 2px rounded strokes, drawn for Liftsmith (no icon font, no
// emoji in the UI chrome). Icons are decorative (aria-hidden); the control around them carries the label.

const PATHS = {
  today: "M3 12h4l3-8 4 16 3-8h4",
  recovery: "M12 21s-7-4.5-9-9.5C1.6 7.6 4.3 4 7.9 4c1.8 0 3.2 1 4.1 2.3C12.9 5 14.3 4 16.1 4 19.7 4 22.4 7.6 21 11.5 19 16.5 12 21 12 21z",
  progress: "M4 20V11M10 20V5M16 20v-7M21 20H3",
  gym: "M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01",
  swap: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  heart: "M12 21s-7-4.5-9-9.5C1.6 7.6 4.3 4 7.9 4c1.8 0 3.2 1 4.1 2.3C12.9 5 14.3 4 16.1 4 19.7 4 22.4 7.6 21 11.5 19 16.5 12 21 12 21z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  chevronUp: "M6 15l6-6 6 6",
  chevronDown: "M6 9l6 6 6-6",
  play: "M7 4.5v15l12-7.5z",
  plus: "M12 5v14M5 12h14",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  leaf: "M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c3-4 6-6 10-8",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z",
  dumbbell: "M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11",
  layers: "M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5",
  flame: "M12 22c4.4 0 7-3 7-7 0-4.5-4-6.5-4-11-3 2-4 5-4 7-1.2-.7-2-2-2-3.5C6.5 9 5 11.5 5 15c0 4 2.6 7 7 7z",
  quote: "M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  flag: "M5 21V4M5 4h12l-2 4 2 4H5",
  lock: "M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
  gift: "M4 10h16v4H4zM5.5 14h13v7h-13zM12 10v11M12 10c-1.5-3.5-6-4-6-1.5S12 10 12 10zM12 10c1.5-3.5 6-4 6-1.5S12 10 12 10z",
  camera: "M3 8h4l2-3h6l2 3h4v11H3zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  flip: "M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M20 12a8 8 0 0 1-14 5.3M6 21v-4h4",
  undo: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  watch: "M8 7h8v10H8zM9 7l1-4h4l1 4M9 17l1 4h4l1-4M12 10v2.5l1.5 1",
  lightbulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className = "",
  strokeWidth = 2,
  filled = false,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
