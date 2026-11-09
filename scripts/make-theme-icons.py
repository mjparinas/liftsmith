#!/usr/bin/env python3
"""Draws the earned app icons (src/lib/themes.ts) from the default icon.

The default icon is a blue mark on a light grid. Each theme icon keeps the shapes and swaps the colours:
a dark background in the theme's tint, the grid in the theme's line colour, and the mark in a gradient
of the theme's accent. Writes:
  ios/App/App/Assets.xcassets/AppIcon-<id>.appiconset/  (iOS alternate icons, 1024 px)
  android/app/src/main/res/mipmap-<density>/ic_launcher_<id>_foreground.png
  android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_<id>.xml and values/theme_icons.xml
Run it again after the default icon changes: python3 scripts/make-theme-icons.py
"""
import colorsys
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android/app/src/main/res")
XC = os.path.join(ROOT, "ios/App/App/Assets.xcassets")

# id: (background, grid line, mark gradient start, mark gradient end). Matches THEMES in themes.ts.
ICONS = {
    "forge": ("#140d0a", "#3a2a22", "#ffb15c", "#ff5a2e"),
    "glacier": ("#08121a", "#1f3442", "#c8f2ff", "#3fc4ff"),
    "aurora": ("#0b0d18", "#262c44", "#3ee0a8", "#8b6bff"),
    "royal": ("#120b1b", "#33264a", "#ffe08a", "#e0a42a"),
}
DENSITIES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def masks(im):
    """Per pixel: how much is mark (saturated blue) and how much is grid line (pale grey-blue)."""
    w, h = im.size
    px = im.load()
    mark = Image.new("L", (w, h))
    grid = Image.new("L", (w, h))
    mp, gp = mark.load(), grid.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.25:
                mp[x, y] = int(min(1, (s - 0.25) / 0.2) * a)
            elif v < 0.98:
                gp[x, y] = int(min(1, (0.98 - v) / 0.1) * a)
    return mark, grid


def paint(size, mark, grid, bg, line, a, b, transparent=False):
    w, h = size
    out = Image.new("RGBA", size, (0, 0, 0, 0) if transparent else rgb(bg) + (255,))
    line_layer = Image.new("RGBA", size, rgb(line) + (255,))
    out.paste(line_layer, (0, 0), grid)
    grad = Image.new("RGBA", size)
    gp = grad.load()
    ca, cb = rgb(a), rgb(b)
    for y in range(h):
        for x in range(w):
            t = (x + (h - y)) / (w + h)  # bottom-left to top-right, like the original
            gp[x, y] = tuple(int(ca[i] + (cb[i] - ca[i]) * t) for i in range(3)) + (255,)
    out.paste(grad, (0, 0), mark)
    return out


def main():
    full = Image.open(os.path.join(XC, "AppIcon.appiconset/AppIcon-512@2x.png")).convert("RGBA")
    fmark, fgrid = masks(full)
    fg = Image.open(os.path.join(RES, "mipmap-xxxhdpi/ic_launcher_foreground.png")).convert("RGBA")
    gmark, ggrid = masks(fg)
    colours = []
    for name, (bg, line, a, b) in ICONS.items():
        # iOS: one 1024 px image per alternate icon set (Xcode 14+ single size).
        d = os.path.join(XC, f"AppIcon-{name}.appiconset")
        os.makedirs(d, exist_ok=True)
        paint(full.size, fmark, fgrid, bg, line, a, b).convert("RGB").save(os.path.join(d, "icon.png"))
        with open(os.path.join(d, "Contents.json"), "w") as f:
            json.dump({"images": [{"filename": "icon.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}], "info": {"author": "xcode", "version": 1}}, f, indent=2)
            f.write("\n")
        # Android: an adaptive icon per alias, foreground drawn per density, background a colour.
        big = paint(fg.size, gmark, ggrid, bg, line, a, b, transparent=True)
        for dens, px in DENSITIES.items():
            big.resize((px, px), Image.LANCZOS).save(os.path.join(RES, f"mipmap-{dens}/ic_launcher_{name}_foreground.png"), optimize=True)
        with open(os.path.join(RES, f"mipmap-anydpi-v26/ic_launcher_{name}.xml"), "w") as f:
            f.write(
                '<?xml version="1.0" encoding="utf-8"?>\n'
                '<!-- Drawn by scripts/make-theme-icons.py -->\n'
                '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                f'    <background android:drawable="@color/ic_launcher_{name}_background"/>\n'
                f'    <foreground android:drawable="@mipmap/ic_launcher_{name}_foreground"/>\n'
                "</adaptive-icon>\n"
            )
        colours.append(f'    <color name="ic_launcher_{name}_background">{bg.upper()}</color>')
    with open(os.path.join(RES, "values/theme_icons.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<!-- Drawn by scripts/make-theme-icons.py -->\n<resources>\n' + "\n".join(colours) + "\n</resources>\n")


if __name__ == "__main__":
    main()
