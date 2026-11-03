"""Gera a narração com a ElevenLabs (eleven_multilingual_v2) e os tempos por palavra.

A chave vem de .env (ELEVENLABS_API_KEY) na raiz do projeto e nunca é impressa.

Uso:
    python scripts/voiceover.py <voice_id>        # gera public/audio/vo/<fala>.mp3
    python scripts/voiceover.py <voice_id> s3 s5  # regera só essas falas

Depois rode scripts/prepare_vo.py (normaliza, apara silêncio e mede as durações).
"""

import base64
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_AUDIO = ROOT / "public" / "audio" / "vo"
OUT_JSON = ROOT / "scripts" / "out" / "vo-timings.json"
MODEL = "eleven_multilingual_v2"

# Uma fala por cena, exatamente como no roteiro.
LINES = {
    "s1": "Como é possível tirar água do chão, mesmo sem ter um rio por perto?",
    "s2": "O segredo está nos aquíferos: camadas de rochas e sedimentos que armazenam água.",
    "s3": "Mas a água está lá embaixo! Então uma máquina perfura o solo até alcançar a camada certa.",
    "s4": "Em um aquífero confinado, a água fica sob pressão entre camadas pouco permeáveis.",
    "s5": "Quando o poço alcança esse aquífero, a pressão empurra a água para cima. Às vezes, ela chega a jorrar!",
    "s6": "Mas atenção: nem todo poço artesiano jorra! Se a água não chegar à superfície, uma bomba pode ser necessária.",
    "s7": "Com revestimento e proteção adequados, a água captada pode seguir para um reservatório e abastecer a casa.",
    "s8": "E é assim que um poço artesiano aproveita a água escondida no subsolo!",
}
# Tom curioso e energético; 1.12 cabe nos 45 s sem soar acelerado.
SETTINGS = {"stability": 0.42, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.12}
SPEED: dict[str, float] = {}


def api_key() -> str:
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("ELEVENLABS_API_KEY="):
            key = line.split("=", 1)[1].strip().strip('"').strip("'")
            if key:
                return key
    sys.exit("ELEVENLABS_API_KEY vazio em .env")


def request(path: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"https://api.elevenlabs.io{path}",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": api_key(), "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code}: {e.read().decode()[:400]}")


def words_from_alignment(al: dict) -> list[dict]:
    words, cur, start, end = [], "", None, None
    for ch, s, e in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur:
                words.append({"text": cur, "start": round(start, 3), "end": round(end, 3)})
            cur, start = "", None
            continue
        if start is None:
            start = s
        cur += ch
        end = e
    if cur:
        words.append({"text": cur, "start": round(start, 3), "end": round(end, 3)})
    return words


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    voice = sys.argv[1]
    only = set(sys.argv[2:])
    OUT_AUDIO.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    timings = json.loads(OUT_JSON.read_text(encoding="utf-8")) if OUT_JSON.exists() and only else {"lines": {}}
    timings.update({"voice": voice, "model": MODEL})
    for key, text in LINES.items():
        if only and key not in only:
            continue
        settings = {**SETTINGS, "speed": SPEED.get(key, SETTINGS["speed"])}
        res = request(
            f"/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
            {"text": text, "model_id": MODEL, "language_code": "pt", "voice_settings": settings},
        )
        (OUT_AUDIO / f"{key}.mp3").write_bytes(base64.b64decode(res["audio_base64"]))
        words = words_from_alignment(res["alignment"])
        timings["lines"][key] = {"text": text, "words": words}
        print(f"{key}: {words[-1]['end']:.2f}s  {text}")
    OUT_JSON.write_text(json.dumps(timings, ensure_ascii=False, indent=2), encoding="utf-8")


main()
