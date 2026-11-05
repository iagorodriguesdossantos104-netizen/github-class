"""Normaliza a narração, apara o silêncio e exporta durações + tempos por palavra.

Lê public/audio/vo/<fala>.mp3 + scripts/out/vo-timings.json (gerados por voiceover.py)
e grava public/audio/vo/<fala>.wav e src/data/vo.json. Os tempos das palavras ficam
relativos ao áudio já aparado, então o início de cada fala na timeline marca a 1ª sílaba.

Uso (na raiz do projeto):
    python scripts/prepare_vo.py
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path.cwd()  # rode da raiz do projeto Remotion
VO = ROOT / "public" / "audio" / "vo"
TIMINGS = json.loads((ROOT / "scripts" / "out" / "vo-timings.json").read_text(encoding="utf-8"))
OUT_JSON = ROOT / "src" / "data" / "vo.json"

SR = 48000
TARGET_RMS_DB = -17.0
FADE = 0.012


def load(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def trim_bounds(x: np.ndarray) -> tuple[int, int]:
    idx = np.flatnonzero(np.abs(x) > 10 ** (-42 / 20))
    if len(idx) == 0:
        return 0, len(x)
    return max(idx[0] - int(0.015 * SR), 0), min(idx[-1] + int(0.08 * SR), len(x))


def normalize(x: np.ndarray) -> np.ndarray:
    speech = x[np.abs(x) > 10 ** (-45 / 20)]
    rms = np.sqrt(np.mean(speech**2)) if len(speech) else 1.0
    y = x * (10 ** (TARGET_RMS_DB / 20) / rms)
    peak = np.max(np.abs(y))
    return y * (0.89 / peak) if peak > 0.89 else y


def fade(x: np.ndarray) -> np.ndarray:
    n = min(int(FADE * SR), len(x) // 2)
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    x[:n] *= ramp
    x[-n:] *= ramp[::-1]
    return x


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    out = {}
    for key, line in TIMINGS["lines"].items():
        x = normalize(load(VO / f"{key}.mp3"))
        a, b = trim_bounds(x)
        y = fade(x[a:b].copy())
        sf.write(VO / f"{key}.wav", y, SR, subtype="PCM_16")
        offset = a / SR
        out[key] = {
            "text": line["text"],
            "seconds": round(len(y) / SR, 3),
            "words": [
                {"text": w["text"], "start": round(max(w["start"] - offset, 0), 3), "end": round(w["end"] - offset, 3)}
                for w in line["words"]
            ],
        }
        print(f"{key}: {out[key]['seconds']:.3f}s (aparado {offset * 1000:.0f} ms no início)")
    print(f"total: {sum(v['seconds'] for v in out.values()):.2f}s")
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")


main()
