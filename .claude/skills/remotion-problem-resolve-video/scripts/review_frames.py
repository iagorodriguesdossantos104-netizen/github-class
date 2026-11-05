"""Lista frames de revisão (3 por cena) a partir de src/data/vo.json, com a regra de utils/timing.ts."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VO = json.loads((ROOT / "src" / "data" / "vo.json").read_text(encoding="utf-8-sig"))
keys = sorted(VO, key=lambda k: int(k[1:]))
TOTAL = int(round(float(__import__("os").environ.get("SECONDS", "90")) * 30))
t, starts = 0.45, []
for k in keys:
    starts.append(t)
    t += VO[k]["seconds"] + 0.55
cuts = [0] + [round((s - 0.25) * 30) for s in starts[1:]] + [TOTAL]
frames = []
for a, b in zip(cuts, cuts[1:]):
    frames += [a + int((b - a) * p) for p in (0.12, 0.55, 0.92)]
print(" ".join(str(f) for f in frames))
