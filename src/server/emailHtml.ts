import sanitizeHtml from "sanitize-html";

// Received mail is shown in the admin Inbox as the sender wrote it, but never trusted. Three layers keep it safe:
// 1. This allowlist sanitizer drops scripts, event handlers, forms, frames, embeds and every link scheme but
//    http(s) and mailto, so the markup that reaches a browser can't run code.
// 2. The page is served on its own (`/api/admin/inbox/view/`) with a strict policy (`EMAIL_VIEW_POLICY`): it is
//    sandboxed without scripts or same-origin access, and loads nothing from the network unless images are asked for.
// 3. The panel shows it in an <iframe sandbox> with the same limits, so even a sanitizer miss can't reach the
//    panel, its cookies or its API.
// Remote images are left out until the admin asks for them, because loading one tells the sender it was read.

const MAX_HTML = 500_000;

const TAGS = [
  ...["a", "abbr", "address", "b", "bdi", "bdo", "big", "blockquote", "br", "caption", "center", "cite", "code", "col", "colgroup", "dd", "del", "dfn", "div", "dl", "dt"],
  ...["em", "figcaption", "figure", "font", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd", "li", "mark", "ol", "p", "pre", "q", "s", "samp", "small"],
  ...["span", "strike", "strong", "style", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "tt", "u", "ul", "var", "wbr"],
];

// Layout attributes mail apps still use. No event handlers, no `id`/`name` (so the mail can't clobber anything), no `srcset`.
const LAYOUT = ["align", "valign", "width", "height", "bgcolor", "border", "cellpadding", "cellspacing", "color", "dir", "lang", "title", "style", "class"];

/** Drops `url(...)` from CSS when images are off, so a background image can't fetch either (the policy blocks it too). */
const noRemoteCss = (css: string) => css.replace(/url\s*\([^)]*\)/gi, "none").replace(/@import[^;]*;?/gi, "");

/** Turns a received email's HTML into markup that can't run code, with remote images only when `images` is on. */
export function sanitizeEmailHtml(html: string, opts: { images?: boolean } = {}): string {
  const images = Boolean(opts.images);
  const css = (attribs: sanitizeHtml.Attributes) => (images || !attribs.style ? attribs : { ...attribs, style: noRemoteCss(attribs.style) });
  return sanitizeHtml(html.slice(0, MAX_HTML), {
    allowedTags: TAGS,
    // <style> keeps a mail's own layout. Its text is raw CSS that a browser never runs as markup, and the frame has no scripts.
    allowVulnerableTags: true,
    disallowedTagsMode: "discard",
    nonTextTags: ["script", "noscript", "textarea", "option", "title", "template", "iframe", "object", "embed", "svg", "math"],
    allowedAttributes: {
      "*": LAYOUT,
      a: ["href", "target", "rel", ...LAYOUT],
      img: ["src", "alt", ...LAYOUT],
      td: ["colspan", "rowspan", ...LAYOUT],
      th: ["colspan", "rowspan", "scope", ...LAYOUT],
      col: ["span", ...LAYOUT],
      colgroup: ["span", ...LAYOUT],
      ol: ["start", "type", ...LAYOUT],
      font: ["face", "size", ...LAYOUT],
      time: ["datetime"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: images ? ["https", "http", "data"] : ["data"] },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      // Links open in a new tab, apart from the panel, and don't tell the site where they came from.
      "*": (tagName, attribs) => ({ tagName, attribs: css(attribs) }),
      a: (tag, attribs) => ({ tagName: "a", attribs: { ...css(attribs), target: "_blank", rel: "noopener noreferrer nofollow" } }),
      // An image left out keeps its alt text, so the mail still reads.
      img: (tag, attribs) => {
        const src = attribs.src ?? "";
        if (/^data:image\/(png|gif|jpe?g|webp);/i.test(src) || (images && /^https?:\/\//i.test(src))) return { tagName: "img", attribs: css(attribs) };
        return { tagName: "span", attribs: {}, text: attribs.alt ?? "" };
      },
    },
  })
    // Text outside <style> has its "<" escaped, so this only ever meets the mail's own style sheets.
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open: string, sheet: string, close: string) => `${open}${images ? sheet : noRemoteCss(sheet)}${close}`);
}

/** Whether the mail has remote images the admin could choose to load. */
export const hasRemoteImages = (html: string) => /<img\b[^>]*\ssrc\s*=\s*["']?\s*https?:/i.test(html) || /url\s*\(\s*["']?\s*https?:/i.test(html);

/**
 * The policy the email page is served with. `sandbox` without `allow-scripts` or `allow-same-origin` means no code runs
 * and the page has an origin of its own, even if someone opens its address directly. Nothing loads from the network
 * but images, and those only when asked for.
 */
export function emailViewPolicy(images: boolean): string {
  return [
    "sandbox allow-popups allow-popups-to-escape-sandbox",
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    `img-src data:${images ? " https: http:" : ""}`,
    "font-src data:",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
  ].join("; ");
}

/** A whole page around the sanitized mail (copied from Gradelings): light colours, so a dark panel can't make it unreadable. */
export function emailPage(body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="referrer" content="no-referrer"><style>html{background:#fff;color:#1d2233}body{margin:12px;font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.5;overflow-wrap:anywhere}img{max-width:100%;height:auto}</style></head><body>${body}</body></html>`;
}
