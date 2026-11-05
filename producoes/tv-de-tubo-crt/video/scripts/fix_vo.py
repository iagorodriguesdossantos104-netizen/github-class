"""Depois de prepare_vo.py: devolve às palavras de src/data/vo.json a grafia da legenda
(pontuação e termos como "self-healing", que o TTS recebeu escritos foneticamente).
Alinha letra a letra a fala do TTS com o texto de scripts/narration.json.

    python scripts/fix_vo.py
"""
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VO_JSON = ROOT / "src" / "data" / "vo.json"
DISPLAY = json.loads((ROOT / "scripts" / "narration.json").read_text(encoding="utf-8-sig"))


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in w if unicodedata.category(c) != "Mn"))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    vo = json.loads(VO_JSON.read_text(encoding="utf-8-sig"))
    for key, line in vo.items():
        orig = DISPLAY[key].split()
        tts = line["words"]
        a_chars, a_idx = "", []
        for i, w in enumerate(tts):
            n = norm(w["text"])
            a_chars += n
            a_idx += [i] * len(n)
        b_chars, b_idx = "", []
        for j, w in enumerate(orig):
            n = norm(w)
            b_chars += n
            b_idx += [j] * len(n)
        first: dict[int, int] = {}
        last: dict[int, int] = {}
        for blk in SequenceMatcher(None, a_chars, b_chars, autojunk=False).get_matching_blocks():
            for k in range(blk.size):
                j = b_idx[blk.b + k]
                i = a_idx[blk.a + k]
                first.setdefault(j, i)
                last[j] = i
        words = []
        for j, text in enumerate(orig):
            if j in first:
                words.append({"text": text, "start": tts[first[j]]["start"], "end": tts[last[j]]["end"]})
            else:
                words.append({"text": text, "start": None, "end": None})
        # palavras sem correspondência: interpola entre vizinhas
        for j, w in enumerate(words):
            if w["start"] is None:
                prev = next((words[k]["end"] for k in range(j - 1, -1, -1) if words[k]["end"] is not None), 0.0)
                nxt = next((words[k]["start"] for k in range(j + 1, len(words)) if words[k]["start"] is not None), line["seconds"])
                w["start"], w["end"] = prev, max(prev + 0.05, nxt)
        for j in range(1, len(words)):
            words[j]["start"] = max(words[j]["start"], words[j - 1]["start"])
        line["words"] = words
        line["text"] = DISPLAY[key]
        print(key, len(tts), "->", len(words))
    VO_JSON.write_text(json.dumps(vo, ensure_ascii=False, indent=2), encoding="utf-8")


main()
