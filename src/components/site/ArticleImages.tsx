// The pictures in a guide or blog post (src/lib/articleImages.ts): the preview card at the top, and real app
// screenshots and 3D figures between its sections. Plain <img> with their sizes (images aren't optimised on this
// site, see Screenshot.tsx); the preview loads first, everything below it lazily.
import Link from "next/link";

import type { Article, Block } from "@/content/articles";
import { HERO_SIZE, heroSrc, type ArticleImage } from "@/lib/articleImages";

import { Thumb } from "./SiteChrome";

/** The post's preview: the same card as its og:image, so a shared link and the page look the same. */
export function ArticleHero({ a }: { a: Article }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={heroSrc(a)}
      alt={`${a.title}: Liftsmith's 3D figure beside the title`}
      width={HERO_SIZE.width}
      height={HERO_SIZE.height}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      className="mt-6 aspect-[1200/630] w-full max-w-3xl rounded-2xl border border-line object-cover"
    />
  );
}

function One({ img }: { img: ArticleImage }) {
  const picture =
    img.kind === "screen" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img.src}
        srcSet={`${img.small} 540w, ${img.src} 780w`}
        sizes="(min-width: 640px) 260px, 62vw"
        alt={img.alt}
        width={img.width}
        height={img.height}
        loading="lazy"
        decoding="async"
        className="mx-auto w-[62vw] max-w-[260px] rounded-[1.75rem] border border-line shadow-lg"
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img.src}
        alt={img.alt}
        width={img.width}
        height={img.height}
        loading="lazy"
        decoding="async"
        className="mx-auto aspect-square w-full max-w-[300px]"
      />
    );
  return (
    <figure className={`flex h-full flex-col justify-center p-4 ${img.kind === "figure" ? "card" : ""}`}>
      {img.href ? (
        <Link href={img.href} className="block">
          {picture}
        </Link>
      ) : (
        picture
      )}
      <figcaption className="mt-3 text-center text-sm text-muted">{img.caption}</figcaption>
    </figure>
  );
}

/** One picture, or two side by side. */
export function ImageGroup({ images }: { images: ArticleImage[] }) {
  return (
    <div className={`mt-8 grid items-stretch gap-4 ${images.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {images.map((img) => (
        <One key={img.src} img={img} />
      ))}
    </div>
  );
}

/**
 * Where the pictures go: after the first paragraph of evenly spaced sections, one picture per place, or two side by
 * side when a post has more pictures than sections. Returns the index in `body` after which each group goes.
 */
export function placeImages(body: Block[], images: ArticleImage[]): Map<number, ArticleImage[]> {
  const heads = body.flatMap((b, i) => ("h2" in b ? [i] : []));
  // After the section's first paragraph when it opens with one, else straight after the heading.
  const spots = heads.map((i) => ("p" in (body[i + 1] ?? {}) ? i + 1 : i));
  if (!spots.length) spots.push(Math.min(1, body.length - 1));
  const groups: ArticleImage[][] = [];
  const n = Math.min(images.length, spots.length);
  // Pair pictures up from the end until they fit the places.
  let pairs = images.length - n;
  for (let i = 0; i < images.length;) {
    if (pairs > 0 && i + 1 < images.length) {
      groups.push([images[i]!, images[i + 1]!]);
      i += 2;
      pairs--;
    } else groups.push([images[i++]!]);
  }
  const out = new Map<number, ArticleImage[]>();
  groups.forEach((g, k) => {
    const at = spots[Math.floor((k * spots.length) / groups.length)]!;
    out.set(at, [...(out.get(at) ?? []), ...g]);
  });
  return out;
}

/** A post's preview on a list of posts. Its title is right beside it in the same link, so the picture is decorative. */
export function PostThumb({ a, eager }: { a: Article; eager?: boolean }) {
  return <Thumb src={heroSrc(a)} eager={eager} />;
}
