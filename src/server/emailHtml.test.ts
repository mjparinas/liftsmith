import { describe, expect, it } from "vitest";

const { emailViewPolicy, hasRemoteImages, sanitizeEmailHtml } = await import("./emailHtml");

// Received mail is untrusted. These are the usual ways an HTML email tries to run code, reach the network or leave
// its frame; the sanitizer must drop every one, and keep the ordinary formatting a mail app sends.

const clean = (html: string, images = false) => sanitizeEmailHtml(html, { images });

describe("sanitizeEmailHtml", () => {
  it("keeps ordinary formatting, tables and the mail's own styles", () => {
    const html = '<style>.x{color:red}</style><table width="100%" cellpadding="4"><tr><td align="center" style="color:#333"><h1>Hi</h1><p><b>Bold</b> <i>it</i></p><ul><li>One</li></ul></td></tr></table>';
    const out = clean(html);
    expect(out).toContain("<style>.x{color:red}</style>");
    expect(out).toContain('<table width="100%" cellpadding="4">');
    expect(out).toContain('<td align="center" style="color:#333"><h1>Hi</h1><p><b>Bold</b> <i>it</i></p><ul><li>One</li></ul></td>');
  });

  it.each([
    ["script", "<script>alert(1)</script>", /<script|alert/],
    ["event handler", '<p onclick="alert(1)">x</p><body onload="alert(1)">', /onclick|onload/],
    ["broken-image handler", '<img src=x onerror="alert(1)">', /onerror|alert/],
    ["javascript link", '<a href="javascript:alert(1)">x</a><a href="JaVaScRiPt:alert(1)">y</a><a href=" javascript:alert(1)">z</a>', /javascript/i],
    ["entity-encoded javascript link", '<a href="&#106;avascript:alert(1)">x</a>', /href/],
    ["data: link", '<a href="data:text/html,<script>alert(1)</script>">x</a>', /href|script/],
    ["vbscript link", '<a href="vbscript:msgbox(1)">x</a>', /vbscript/i],
    ["iframe", '<iframe src="https://evil.example"></iframe>', /iframe|evil/],
    ["object and embed", '<object data="x.swf"></object><embed src="x.swf">', /object|embed|swf/],
    ["form", '<form action="https://evil.example"><input name="password"><button>Go</button></form>', /form|input|button|evil/],
    ["svg with script", "<svg><script>alert(1)</script><a xlink:href=\"javascript:alert(1)\"></a></svg>", /svg|script|javascript/],
    ["math", '<math><mi xlink:href="javascript:alert(1)">x</mi></math>', /math|javascript/],
    ["meta refresh", '<meta http-equiv="refresh" content="0;url=https://evil.example">', /meta|evil/],
    ["base tag", '<base href="https://evil.example/">', /base|evil/],
    ["link stylesheet", '<link rel="stylesheet" href="https://evil.example/x.css">', /link|evil/],
    ["protocol-relative link", '<a href="//evil.example">x</a>', /href/],
    ["srcset", '<img srcset="https://evil.example/a.png 1x" alt="a">', /srcset|evil/],
    ["mXSS through a closing tag in an attribute", '<p title="</p><script>alert(1)</script>">x</p>', /<script/],
    ["comment trick", "<!--<img src=x onerror=alert(1)>-->", /onerror/],
    ["unclosed style escape", "<style></style><script>alert(1)</script>", /<script/],
    ["noscript", '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>', /onerror/],
    ["id and name clobbering", '<div id="x" name="y">a</div>', /id=|name=/],
  ])("drops %s", (_, html, bad) => {
    expect(clean(html)).not.toMatch(bad);
    expect(clean(html, true)).not.toMatch(bad);
  });

  it("opens links in a new tab without telling the site where they came from", () => {
    expect(clean('<a href="https://example.com/x?a=1&amp;b=2">x</a><a href="mailto:pat@example.com">m</a>')).toBe(
      '<a href="https://example.com/x?a=1&amp;b=2" target="_blank" rel="noopener noreferrer nofollow">x</a><a href="mailto:pat@example.com" target="_blank" rel="noopener noreferrer nofollow">m</a>',
    );
    // A link can't override where it opens.
    expect(clean('<a href="https://example.com" target="_top" rel="opener">x</a>')).toBe('<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">x</a>');
  });

  it("leaves out remote images, CSS backgrounds and imports until images are asked for, keeping alt text", () => {
    const html = '<style>@import url(https://t.example/a.css); body{background:url("https://t.example/b.png")}</style><p style="background-image:url(https://t.example/c.png)">x</p><img src="https://t.example/p.gif" alt="Logo"><img src="cid:abc" alt="Inline"><img src="data:image/png;base64,iVBORw0KGgo=" alt="ok">';
    const off = clean(html);
    expect(off).not.toContain("t.example");
    expect(off).toContain("<span>Logo</span>");
    expect(off).toContain("<span>Inline</span>");
    expect(off).toContain('<img src="data:image/png;base64,iVBORw0KGgo=" alt="ok" />');
    const on = clean(html, true);
    expect(on).toContain('<img src="https://t.example/p.gif" alt="Logo" />');
    expect(on).toContain("background-image:url(https://t.example/c.png)");
  });

  it("never lets an SVG through as a data image", () => {
    expect(clean('<img src="data:image/svg+xml;base64,PHN2Zz4=" alt="s">', true)).toBe("<span>s</span>");
  });

  it("knows when a mail has remote images", () => {
    expect(hasRemoteImages('<img src="https://t.example/p.gif">')).toBe(true);
    expect(hasRemoteImages('<td style="background:url(\'http://t.example/b.png\')">')).toBe(true);
    expect(hasRemoteImages('<img src="data:image/png;base64,AA">')).toBe(false);
  });
});

describe("emailViewPolicy", () => {
  it("sandboxes the page with no scripts and loads nothing from the network until images are asked for", () => {
    for (const images of [false, true]) {
      const p = emailViewPolicy(images);
      expect(p.startsWith("sandbox allow-popups allow-popups-to-escape-sandbox;")).toBe(true);
      expect(p).not.toMatch(/allow-scripts|allow-same-origin|allow-top-navigation|allow-forms|script-src/);
      expect(p).toContain("default-src 'none'");
      expect(p).toContain("frame-ancestors 'self'");
    }
    expect(emailViewPolicy(false)).toContain("img-src data:;");
    expect(emailViewPolicy(true)).toContain("img-src data: https: http:;");
  });
});
