from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images" / "depression-food-japan-cover.png"

W, H = 900, 1350
SCALE = 2

CREAM = (251, 247, 239)
WARM = (243, 231, 215)
INK = (38, 49, 38)
MUTED = (101, 112, 98)
SAGE = (113, 134, 106)
SAGE_DARK = (63, 85, 63)
CLAY = (189, 118, 91)
WHITE = (255, 253, 248)


def xy(value: int) -> int:
    return value * SCALE


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, xy(size))


SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"
SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"


def draw_text(draw: ImageDraw.ImageDraw, position: tuple[int, int], text: str, face: ImageFont.FreeTypeFont, fill: tuple[int, int, int], spacing: int = 10) -> None:
    draw.multiline_text((xy(position[0]), xy(position[1])), text, font=face, fill=fill, spacing=xy(spacing))


def create_cover() -> None:
    width, height = xy(W), xy(H)
    img = Image.new("RGB", (width, height), CREAM)
    pixels = img.load()

    for y in range(height):
        t = y / max(1, height - 1)
        if t < 0.62:
            local = t / 0.62
            color = tuple(int(CREAM[i] * (1 - local) + WARM[i] * local) for i in range(3))
        else:
            local = (t - 0.62) / 0.38
            color = tuple(int(WARM[i] * (1 - local) + (231, 235, 222)[i] * local) for i in range(3))
        for x in range(width):
            pixels[x, y] = color

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    od.rectangle((0, 0, xy(64), height), fill=(*SAGE_DARK, 245))
    od.rectangle((xy(64), 0, xy(78), height), fill=(*CLAY, 170))
    od.rounded_rectangle((xy(42), xy(42), xy(858), xy(1308)), radius=xy(22), outline=(*SAGE_DARK, 150), width=xy(3))

    od.ellipse((xy(610), xy(120), xy(848), xy(358)), fill=(*CLAY, 160))
    od.ellipse((xy(644), xy(154), xy(814), xy(324)), fill=(251, 247, 239, 80))

    wave = [(xy(90), xy(820)), (xy(230), xy(765)), (xy(380), xy(820)), (xy(545), xy(760)), (xy(720), xy(815)), (xy(850), xy(770))]
    od.line(wave, fill=(*SAGE, 105), width=xy(18), joint="curve")
    od.line([(xy(112), xy(865)), (xy(290), xy(825)), (xy(470), xy(872)), (xy(672), xy(825)), (xy(832), xy(862))], fill=(*CLAY, 115), width=xy(8), joint="curve")

    od.rounded_rectangle((xy(176), xy(930), xy(724), xy(1104)), radius=xy(72), fill=(255, 253, 248, 220), outline=(*SAGE_DARK, 110), width=xy(3))
    od.arc((xy(210), xy(910), xy(690), xy(1140)), start=8, end=172, fill=(*SAGE_DARK, 170), width=xy(5))
    od.line((xy(520), xy(895), xy(770), xy(820)), fill=(*SAGE_DARK, 150), width=xy(8))
    od.line((xy(495), xy(882), xy(748), xy(805)), fill=(*CLAY, 150), width=xy(6))

    for x, y, r in [(315, 1000, 8), (365, 985, 6), (420, 1018, 7), (470, 992, 5), (530, 1010, 6)]:
        od.ellipse((xy(x - r), xy(y - r), xy(x + r), xy(y + r)), fill=(*SAGE, 130))

    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((xy(470), xy(52), xy(1030), xy(612)), fill=(255, 253, 248, 72))
    glow = glow.filter(ImageFilter.GaussianBlur(xy(22)))
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)
    serif_98 = font(SERIF, 98)
    serif_52 = font(SERIF, 52)
    sans_28 = font(SANS, 28)
    sans_24 = font(SANS, 24)
    sans_34 = font(SANS, 34)
    sans_18 = font(SANS, 18)

    draw_text(draw, (116, 116), "Natural Healing", sans_24, SAGE_DARK, 6)
    draw_text(draw, (116, 255), "Depresja\ni jedzenie", serif_98, INK, 18)
    draw_text(draw, (120, 548), "lekcja z Japonii", serif_52, CLAY, 10)
    draw_text(draw, (122, 655), "Depression and Food\nA Lesson from Japan", sans_28, MUTED, 9)
    draw_text(draw, (116, 1188), "Natalia Wcisło", sans_34, INK, 8)
    draw_text(draw, (116, 1242), "przewodnik w przygotowaniu", sans_18, MUTED, 6)

    final = img.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUT, quality=94, optimize=True)


if __name__ == "__main__":
    create_cover()
