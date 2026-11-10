// A real app screenshot from public/screens/ at the size it's shown. Images aren't optimised on this site
// (`images.unoptimized`, the static export needs it and Vercel's optimiser is metered), so
// scripts/site-screenshots.mjs writes each one twice: full size (780 px wide) and a 540 px copy, which is
// what a phone needs for a 300 px wide picture. The browser picks one from `srcSet`.

/** The 540 px copy's path beside a full-size screenshot. */
export const smallCopy = (src: string) => src.replace(/\.webp$/, "-540.webp");

export function Screenshot({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  /** Above the fold: load straight away instead of lazily. */
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={`${smallCopy(src)} 540w, ${src} 780w`}
      sizes={sizes}
      alt={alt}
      width={780}
      height={1688}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
