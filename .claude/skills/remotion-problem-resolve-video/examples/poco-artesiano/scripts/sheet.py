"""Monta uma folha de contato (grade) com os stills de out/stills para revisão.

Uso:
    python scripts/sheet.py out/sheet.png f0000 f0060 ...   (nomes sem .png; vazio = todos)
    COLS=4 python scripts/sheet.py ...
"""

import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
STILLS = ROOT / "out" / "stills"
out = Path(sys.argv[1])
names = sys.argv[2:] or sorted(p.stem for p in STILLS.glob("*.png"))
imgs = [Image.open(STILLS / f"{n}.png").convert("RGB") for n in names]
w, h = imgs[0].size
cols = int(os.environ.get("COLS", 4))
rows = (len(imgs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols + 1) * 8, rows * h + (rows + 1) * 8), (40, 40, 40))
draw = ImageDraw.Draw(sheet)
for k, (name, im) in enumerate(zip(names, imgs)):
    x = 8 + (k % cols) * (w + 8)
    y = 8 + (k // cols) * (h + 8)
    sheet.paste(im, (x, y))
    draw.rectangle([x, y, x + 70, y + 22], fill=(0, 0, 0))
    draw.text((x + 6, y + 5), name, fill=(255, 255, 0))
sheet.save(out)
print(out, sheet.size)
