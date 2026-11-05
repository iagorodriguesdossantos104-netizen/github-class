"""Confere se a narração medida (src/data/vo.json) cabe nos 90 s com a regra de utils/timing.ts.
Sai com código 1 se não couber (o 1-preparar.ps1 então regera a voz um pouco mais rápida)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
vo = json.loads((ROOT / "src" / "data" / "vo.json").read_text(encoding="utf-8-sig"))
keys = [f"s{i}" for i in range(1, 16)]
t = 0.45 + sum(vo[k]["seconds"] for k in keys) + 0.55 * (len(keys) - 1)
print(f"fala total {sum(vo[k]['seconds'] for k in keys):.2f} s; fim da ultima fala {t:.2f} s")
sys.exit(0 if t <= 89.2 else 1)
