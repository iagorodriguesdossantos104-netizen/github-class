"""Trilha instrumental do vídeo "automação dos postes de energia" (90 s, 100 BPM, Fá maior).

Tudo é gerado por código (sem samples), então a trilha é livre de direitos.
Os cortes S vêm de src/data/vo.json com a MESMA regra de src/utils/timing.ts
(1ª fala em 0,45 s, pausas de 0,55 s, corte 0,25 s antes de cada fala).

Uso:
    python scripts/music.py          -> public/audio/music.wav
"""

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "music.wav"

SR = 48000
DUR = 90.0
N = int(SR * DUR)
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(12)

VO = json.loads((ROOT / "src" / "data" / "vo.json").read_text(encoding="utf-8-sig"))
KEYS = [f"s{i}" for i in range(1, 15)]
FIRST, LEAD, GAP = 0.45, 0.25, 0.55
starts = []
t = FIRST
for k in KEYS:
    starts.append(t)
    t += VO[k]["seconds"] + GAP
S = [0.0] + [round(round((st - LEAD) * 30) / 30, 3) for st in starts[1:]] + [DUR]


def word_t(key, i):
    return starts[KEYS.index(key)] + VO[key]["words"][i]["start"]


CH = {
    "F": [53, 57, 60, 65],
    "Dm": [50, 53, 57, 62],
    "Bb": [46, 50, 53, 58],
    "C": [48, 52, 55, 60],
    "Gm": [43, 50, 55, 58],
    "A": [45, 49, 52, 57],
    "Fadd9": [53, 57, 60, 67],
}
ROOT_NOTE = {"F": 41, "Dm": 38, "Bb": 34, "C": 36, "Gm": 31, "A": 33, "Fadd9": 41}
MAJOR = ["F", "Dm", "Bb", "C"]
TENSE = ["Dm", "Bb", "Gm", "A"]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def stereo(x, p=0.0):
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], axis=1)


def place(bus, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(bus):
        return
    if sig.ndim == 1:
        sig = stereo(sig)
    j = min(i + len(sig), len(bus))
    bus[i:j] += sig[: j - i] * gain


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def env(d, a, r):
    t = tt(d)
    return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)


def saw(f, d):
    t = tt(d)
    p = (rng.random() + t * f) % 1.0
    return 2 * p - 1


def ir(length, decay, damp=6500):
    t = tt(length)
    h = rng.standard_normal((len(t), 2)) * np.exp(-t / decay)[:, None]
    h = lp(h, damp)
    h[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return h / np.sqrt(np.sum(h**2))


def verb(x, h):
    return np.stack([fftconvolve(x[:, c], h[:, c])[: len(x)] for c in range(2)], axis=1)


# ---------------------------------------------------------------- instrumentos
def marimba(m, d=0.9, bright=1.0):
    t = tt(d)
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.35) + 0.35 * bright * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.06) + 0.12 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t / 0.02)
    return y * (1 - np.exp(-t / 0.0015)) * 0.4


def pluck(m, d=0.4):
    t = tt(d)
    f = hz(m)
    y = sum(np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * (7 + 4 * k)) for k in range(1, 9))
    return y * (1 - np.exp(-t / 0.002)) * 0.32


def pad(chord, d, cutoff=1500, gain=1.0):
    out = np.zeros((int(d * SR), 2))
    for i, m in enumerate(chord):
        for v in (-0.08, 0.08):
            out += stereo(saw(hz(m + v), d), -0.6 + 1.2 * i / max(1, len(chord) - 1))
    return lp(out / (2 * len(chord)), cutoff) * env(d, 0.5, 0.8)[:, None] * gain


def bass(m, d):
    t = tt(d)
    f = hz(m)
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2 * t)
    return np.tanh(y * 1.3) * env(d, 0.01, 0.12) * 0.5


def kick(g=1.0):
    t = tt(0.4)
    f = 48 + 100 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    return np.tanh(y * 1.5) * 0.8 * g


def shaker():
    t = tt(0.09)
    return hp(rng.standard_normal(len(t)), 6000, 4) * np.exp(-t / 0.025) * 0.35


def clap():
    t = tt(0.3)
    n = rng.standard_normal(len(t))
    e = sum(np.where(t >= o, np.exp(-(t - o) / 0.006), 0) for o in (0.0, 0.01, 0.02)) + np.where(t >= 0.02, np.exp(-(t - 0.02) / 0.1), 0) * 0.5
    return sosfilt(butter(2, [1000, 5000], "band", fs=SR, output="sos"), n * e) * 0.7


def bell(m, d=2.2):
    t = tt(d)
    f = hz(m)
    y = np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t / 0.5) * np.sin(2 * np.pi * f * 3.5 * t))
    return y * np.exp(-t / 0.8) * (1 - np.exp(-t / 0.002)) * 0.28


def sweep_lp(x, cut, block=512):
    out = np.zeros_like(x)
    zi = None
    for b in range(0, len(x), block):
        sos = butter(2, float(np.clip(cut[min(b, len(cut) - 1)], 40, SR * 0.45)), "low", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
        out[b : b + block], zi = sosfilt(sos, x[b : b + block], axis=0, zi=zi)
    return out


def riser(d):
    t = tt(d)
    p = t / d
    n = hp(rng.standard_normal((len(t), 2)), 400)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (p * 2)) / SR) * 0.15
    return (sweep_lp(n, 600 + 8000 * p**2) * 0.5 + tone[:, None]) * (p**2)[:, None]


def soft_hit(size=1.0):
    t = tt(2.0)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 70 * np.exp(-t / 0.08)) / SR) * np.exp(-t / (0.5 * size))
    air = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.12) * 0.3
    return np.tanh((boom + air) * 1.2) * 0.7


# ---------------------------------------------------------------- arranjo
drums = np.zeros((N, 2))
low = np.zeros((N, 2))
pads = np.zeros((N, 2))
leads = np.zeros((N, 2))
fx = np.zeros((N, 2))
kicks = []


def chord_at(t, prog, start):
    return prog[int((t - start) // BAR) % len(prog)]


def section_pads(start, end, prog, cutoff, gain):
    t0 = start
    while t0 < end - 0.05:
        d = min(BAR, end - t0)
        name = chord_at(t0, prog, start)
        place(pads, pad(CH[name], d + 0.6, cutoff, gain), t0, 1.0)
        t0 += BAR


def arps(start, end, prog, step, pattern, gain, inst=marimba, octave=12):
    k = 0
    for t0 in np.arange(start, end - 0.02, step):
        name = chord_at(t0, prog, start)
        n = CH[name][pattern[k % len(pattern)] % 4] + octave
        place(leads, stereo(inst(n), (-0.35, 0.35)[k % 2]), t0, gain)
        k += 1


def basses(start, end, prog, pattern, gain):
    for t0 in np.arange(start, end - 0.02, BEAT / 2):
        k = int(round((t0 - start) / (BEAT / 2)))
        if not pattern[k % len(pattern)]:
            continue
        name = chord_at(t0, prog, start)
        place(low, stereo(bass(ROOT_NOTE[name], BEAT * 0.45)), t0, gain)


def groove(start, end, kick_g, hat_g, clap_g=0.0):
    for t0 in np.arange(start, end - 0.02, BEAT):
        k = int(round((t0 - start) / BEAT))
        if k % 2 == 0 and kick_g > 0:
            place(drums, kick(kick_g), t0, 1.0)
            kicks.append((t0, kick_g))
        if k % 2 == 1 and clap_g > 0:
            place(drums, clap(), t0, clap_g)
        for sub in (0.0, 0.5):
            place(drums, stereo(shaker(), 0.3 if sub else -0.2), t0 + sub * BEAT, hat_g * (1.0 if sub else 0.6))


def calm(a, b, prog=MAJOR, g=0.38):
    section_pads(a, b, prog, 1500, 0.7)
    arps(a, b, prog, BEAT / 2, [0, 2, 3, 1, 2, 3, 1, 2], g)
    basses(a, b, prog, [1, 0, 0, 1, 0, 0, 1, 0], 0.5)
    groove(a, b - 0.2, 0, 0.45)


def tense(a, b):
    section_pads(a, b, TENSE, 1000, 0.85)
    for t0 in np.arange(a, b - 0.05, BEAT):
        name = chord_at(t0, TENSE, a)
        place(low, stereo(bass(ROOT_NOTE[name], BEAT * 0.8)), t0, 0.45)
        kicks.append((t0, 0.35))
        place(drums, kick(0.4), t0, 1.0)
    arps(a + BEAT, b, TENSE, BEAT, [0, 2, 1, 3], 0.28, inst=pluck)


def bright(a, b, prog=MAJOR, kick_g=0.65):
    section_pads(a, b, prog, 2000, 0.65)
    arps(a, b, prog, BEAT / 2, [0, 3, 2, 3, 1, 3, 2, 3], 0.36)
    groove(a, b - 0.2, kick_g, 0.55, 0.3)
    basses(a, b, prog, [1, 0, 1, 1, 0, 1, 1, 0], 0.55)


def chime(at, notes=(77, 81, 84), g=0.2):
    for k, m in enumerate(notes):
        place(leads, stereo(bell(m, 1.8), -0.4 + 0.4 * k), at + 0.04 * k, g)


# s1 gancho: curioso e calmo
section_pads(S[0], S[1], ["F", "Dm"], 1100, 0.7)
for t0, m in [(0.4, 72), (0.7, 69), (1.0, 65), (1.3, 67)]:
    place(leads, stereo(marimba(m, 1.2), 0.2), t0, 0.5)
arps(S[0] + 2 * BAR, S[1], MAJOR, BEAT / 2, [0, 2, 3, 1], 0.32)
chime(word_t("s1", 6), (84, 88, 91), 0.16)
# s2 curto / s3 disjuntor / s4 apagão: tensão
tense(S[1], S[3])
place(fx, stereo(soft_hit(0.8)), word_t("s3", 14), 0.4)
section_pads(S[3], S[4], ["Dm", "Gm"], 800, 0.6)
# s5–s6 religador: volta a luz
place(fx, riser(1.4), S[4] + 0.2, 0.25)
bright(S[4], S[6])
chime(S[5] + 0.5)
# s7–s8 falha permanente: tensão
tense(S[6], S[8])
place(fx, stereo(soft_hit(1.0)), word_t("s7", 4) + 0.3, 0.45)
# s9 chaves: solução
bright(S[8], S[9], ["Bb", "C", "F", "Dm"], 0.55)
chime(word_t("s9", 18))
# s10 casas no escuro: suspense leve
section_pads(S[9], S[10], ["Dm", "Bb"], 1000, 0.7)
arps(S[9], S[10], ["Dm", "Bb"], BEAT, [0, 2, 1, 3], 0.26, inst=pluck)
place(fx, riser(S[10] - S[9] - 0.2), S[9] + 0.2, 0.25)
# s11 chave NA: solução
bright(S[10], S[11])
chime(word_t("s11", 8), (79, 84, 88), 0.22)
# s12–s13 comunicação + self-healing: pulsante e moderno
bright(S[11], S[13], ["F", "C", "Dm", "Bb"], 0.6)
arps(S[11], S[13], ["F", "C", "Dm", "Bb"], BEAT / 4, [0, 1, 2, 3], 0.12, inst=pluck, octave=24)
chime(word_t("s13", 14), (77, 81, 84, 89), 0.24)
# s14 resolução
place(fx, stereo(soft_hit(1.2)), S[13], 0.4)
bright(S[13], word_t("s14", 7), ["Bb", "C"], 0.5)
place(pads, pad(CH["Fadd9"], DUR - word_t("s14", 7), 2400, 1.0), word_t("s14", 7), 1.0)
arps(word_t("s14", 7), DUR - 1.2, ["Fadd9"], BEAT / 2, [0, 1, 2, 3, 2, 1], 0.28)
chime(word_t("s14", 7), (77, 81, 84, 88, 91), 0.24)

# ---------------------------------------------------------------- mixagem
sc = np.ones(N)
tf = np.arange(N) / SR
for k, depth in kicks:
    i = int(k * SR)
    seg = tf[i : i + int(0.3 * SR)] - k
    sc[i : i + len(seg)] = np.minimum(sc[i : i + len(seg)], 1 - 0.45 * depth * np.exp(-seg / 0.09))
sc = lp(sc, 40)
pads *= sc[:, None]
low *= (sc**0.5)[:, None]

delay = int(BEAT * 0.75 * SR)
echo = np.zeros_like(leads)
echo[delay:, 0] = leads[:-delay, 1] * 0.28
echo[2 * delay :, 1] = leads[: -2 * delay, 0] * 0.18
leads = leads + lp(echo, 4000)

wet = verb(pads * 0.3 + leads * 0.45 + fx * 0.3, ir(2.6, 0.7)) * 0.8 + verb(drums * 0.08, ir(0.8, 0.18))
mix = drums * 0.7 + low * 0.9 + pads * 0.9 + leads * 0.85 + fx * 0.7 + wet
mix = hp(mix, 28)
mix *= (np.clip((DUR - tf) / 0.9, 0, 1) ** 1.5)[:, None]
mix = np.tanh(mix * 1.1)
mix *= 0.89 / np.max(np.abs(mix))
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, mix.astype(np.float32), SR, subtype="PCM_16")
print(f"music: {OUT} ({DUR:.1f}s)")
