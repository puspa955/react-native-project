"""Makes the app icon, splash image and favicon from the Material "article" glyph (the same
icon the header uses, see src/components/Brand.js).
Run: python scripts/make-app-icons.py   (needs Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf"
OUT = ROOT / "assets/images"
GLYPH = chr(61250)  # "article" in MaterialIcons.json
YELLOW = (251, 188, 4, 255)  # #fbbc04, the brand colour
WHITE = (255, 255, 255, 255)
BIG = 2048  # the glyph is drawn large and shrunk, which smooths the edges


def glyph(color):
    """The glyph alone, cropped to its edges, in the given colour."""
    font = ImageFont.truetype(str(FONT), BIG)
    mask = Image.new("L", (BIG * 2, BIG * 2), 0)
    ImageDraw.Draw(mask).text((BIG // 2, BIG // 2), GLYPH, font=font, fill=255)
    mask = mask.crop(mask.getbbox())
    out = Image.new("RGBA", mask.size, color)
    out.putalpha(mask)
    return out


def canvas(size, bg, color, fraction, radius=0):
    """A square image with the glyph centred, `fraction` of the width wide."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if bg:
        # the rounded square is drawn 4x larger and shrunk, so its corners are smooth
        k = 4
        shape = Image.new("RGBA", (size * k, size * k), (0, 0, 0, 0))
        ImageDraw.Draw(shape).rounded_rectangle((0, 0, size * k - 1, size * k - 1), radius * k, fill=bg)
        img = Image.alpha_composite(img, shape.resize((size, size), Image.LANCZOS))
    g = glyph(color)
    w = round(size * fraction)
    g = g.resize((w, round(g.height * w / g.width)), Image.LANCZOS)
    img.alpha_composite(g, ((size - g.width) // 2, (size - g.height) // 2))
    return img


# app icon: white glyph on the yellow square (the stores round the corners themselves)
canvas(1024, YELLOW, WHITE, 0.52).save(OUT / "icon.png")

# Android adaptive icon: the glyph stays inside the centre safe zone, the background is plain yellow
canvas(512, None, WHITE, 0.40).save(OUT / "android-icon-foreground.png")
Image.new("RGBA", (512, 512), YELLOW).save(OUT / "android-icon-background.png")
canvas(432, None, WHITE, 0.40).save(OUT / "android-icon-monochrome.png")

# splash screen: just the yellow glyph, it sits well on the light and the dark splash background
canvas(512, None, YELLOW, 0.62).save(OUT / "splash-icon.png")

# browser tab icon
canvas(48, YELLOW, WHITE, 0.62, radius=10).save(OUT / "favicon.png")
print("done")
