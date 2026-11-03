"""Gera a narração (uma fala por cena) com tempos por palavra, para sincronizar cenas e legendas.

As falas vêm de um JSON {"s1": "texto da cena 1", "s2": "...", ...} (mesma ordem das cenas).
Dois provedores:
  - elevenlabs (padrão quando há ELEVENLABS_API_KEY no .env da raiz do projeto; a chave nunca é impressa)
  - edge (edge-tts, gratuito, vozes neurais pt-BR; `python -m pip install edge-tts`)

Uso (na raiz do projeto Remotion):
    python scripts/voiceover.py --lines scripts/narration.json --voice TX3LPaxmHKxFdv7VOQHJ
    python scripts/voiceover.py --lines scripts/narration.json --provider edge --voice pt-BR-AntonioNeural --rate +8%
    python scripts/voiceover.py --lines scripts/narration.json --voice <id> --only s3 s5   # regera só essas

Saída: public/audio/vo/<fala>.mp3 + scripts/out/vo-timings.json.
Depois rode scripts/prepare_vo.py (normaliza, apara o silêncio e grava src/data/vo.json).
"""

import argparse
import asyncio
import base64
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
OUT_AUDIO = ROOT / "public" / "audio" / "vo"
OUT_JSON = ROOT / "scripts" / "out" / "vo-timings.json"
ELEVEN_MODEL = "eleven_multilingual_v2"


def env_key() -> str | None:
    env = ROOT / ".env"
    if not env.exists():
        return None
    for line in env.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("ELEVENLABS_API_KEY="):
            key = line.split("=", 1)[1].strip().strip('"').strip("'")
            return key or None
    return None


# ---------------------------------------------------------------- ElevenLabs
def eleven_request(path: str, body: dict, key: str) -> dict:
    req = urllib.request.Request(
        f"https://api.elevenlabs.io{path}",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"},
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


def synth_eleven(key: str, text: str, args, api_key: str) -> list[dict]:
    settings = {"stability": args.stability, "similarity_boost": 0.8, "style": args.style, "use_speaker_boost": True, "speed": args.speed}
    res = eleven_request(
        f"/v1/text-to-speech/{args.voice}/with-timestamps?output_format=mp3_44100_128",
        {"text": text, "model_id": ELEVEN_MODEL, "language_code": args.language, "voice_settings": settings},
        api_key,
    )
    (OUT_AUDIO / f"{key}.mp3").write_bytes(base64.b64decode(res["audio_base64"]))
    return words_from_alignment(res["alignment"])


# ---------------------------------------------------------------- edge-tts
async def synth_edge(key: str, text: str, args) -> list[dict]:
    import edge_tts

    for attempt in range(1, 6):
        try:
            communicate = edge_tts.Communicate(text, args.voice, rate=args.rate, boundary="WordBoundary")
            words = []
            with open(OUT_AUDIO / f"{key}.mp3", "wb") as f:
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        start = chunk["offset"] / 1e7
                        words.append({"text": chunk["text"], "start": round(start, 3), "end": round(start + chunk["duration"] / 1e7, 3)})
            return words
        except edge_tts.exceptions.NoAudioReceived:
            # o serviço às vezes responde sem áudio; tentar de novo costuma resolver
            if attempt == 5:
                raise
            await asyncio.sleep(2 * attempt)
    return []


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True, help="JSON {chave: texto}, uma fala por cena")
    p.add_argument("--provider", choices=["elevenlabs", "edge"], default=None)
    p.add_argument("--voice", required=True, help="voice_id (ElevenLabs) ou nome da voz (edge, ex.: pt-BR-AntonioNeural)")
    p.add_argument("--speed", type=float, default=1.08, help="ElevenLabs: 0.7–1.2 (evite passar de ~1.12)")
    p.add_argument("--stability", type=float, default=0.42)
    p.add_argument("--style", type=float, default=0.35)
    p.add_argument("--rate", default="+6%", help="edge-tts: ex. +0%%, +8%%")
    p.add_argument("--language", default="pt")
    p.add_argument("--only", nargs="*", default=[])
    args = p.parse_args()

    lines: dict[str, str] = json.loads(Path(args.lines).read_text(encoding="utf-8-sig"))
    api_key = env_key()
    provider = args.provider or ("elevenlabs" if api_key else "edge")
    if provider == "elevenlabs" and not api_key:
        sys.exit("ELEVENLABS_API_KEY ausente em .env — peça a chave ao usuário ou use --provider edge")

    OUT_AUDIO.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    only = set(args.only)
    timings = json.loads(OUT_JSON.read_text(encoding="utf-8")) if OUT_JSON.exists() and only else {"lines": {}}
    timings.update({"provider": provider, "voice": args.voice})
    for key, text in lines.items():
        if only and key not in only:
            continue
        words = synth_eleven(key, text, args, api_key) if provider == "elevenlabs" else asyncio.run(synth_edge(key, text, args))
        timings["lines"][key] = {"text": text, "words": words}
        print(f"{key}: {words[-1]['end']:.2f}s  {text}")
    # mantém a ordem das cenas
    timings["lines"] = {k: timings["lines"][k] for k in lines if k in timings["lines"]}
    OUT_JSON.write_text(json.dumps(timings, ensure_ascii=False, indent=2), encoding="utf-8")


main()
