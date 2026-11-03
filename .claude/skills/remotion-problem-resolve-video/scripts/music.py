"""MODELO de trilha — este arranjo é o do exemplo "poço artesiano"; adapte antes de usar:
  1. DUR = duração do vídeo; S = início (s) de cada cena = SCENE_FRAMES de src/utils/timing.ts / 30.
  2. Troque os momentos-chave (DRILL_START, JET, PUMP...) pelos do seu roteiro (frames/30).
  3. Reescreva a seção "arranjo" com uma intenção por cena (calma, tensão, crescendo, resolução).
Os instrumentos (marimba, pad, baixo, bumbo, sinos, riser) e a mixagem com sidechain são reutilizáveis.

Sintetiza a trilha instrumental (didática e curiosa, 100 BPM, Fá maior, 45 s).

Tudo é gerado por código (sem samples), então a trilha é livre de direitos.
As seções seguem os cortes de src/utils/timing.ts (derivados da narração):
  intro curiosa -> descoberta -> perfuração (groove) -> pressão (tensão) ->
  subida da água (crescendo até o jorro) -> comparação -> distribuição -> resolução.

Uso:
    python scripts/music.py          -> public/audio/music.wav
"""

from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "music.wav"

SR = 48000
DUR = 45.0
N = int(SR * DUR)
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(12)

# Cortes das cenas (s) — iguais a SCENE_FRAMES em src/utils/timing.ts (frames / 30)
S = [0.0, 4.1, 9.1, 14.833, 19.767, 25.833, 33.033, 39.767]
DRILL_START = 11.92  # "perfura"
DRILL_HIT = 13.7  # broca alcança o aquífero
JET = 24.27  # água chega à boca do poço
JORRAR = 25.07
PUMP = 31.4  # "bomba"
HOUSE = 39.07  # "casa"
FINAL_HIT = 43.72

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


# 1) intro curiosa — pad + motivo de "pergunta"
section_pads(S[0], S[1], ["F", "Dm"], 1100, 0.7)
for t0, m in [(0.35, 72), (0.65, 69), (0.95, 65), (1.25, 67), (2.75, 72), (3.05, 74), (3.35, 76)]:
    place(leads, stereo(marimba(m, 1.2), 0.2), t0, 0.5)
place(fx, riser(1.6), S[1] - 1.6, 0.35)

# 2) descoberta — arpejo de marimba e chocalho
section_pads(S[1], S[2], MAJOR, 1500, 0.75)
arps(S[1], S[2], MAJOR, BEAT / 2, [0, 2, 3, 1, 2, 3, 1, 2], 0.42)
groove(S[1] + BAR, S[2], 0, 0.5)
basses(S[1] + BAR, S[2], MAJOR, [1, 0, 0, 1, 0, 0, 1, 0], 0.55)

# 3) perfuração — groove com bumbo e baixo mais ativo
section_pads(S[2], S[3], MAJOR, 1800, 0.65)
arps(S[2], S[3], MAJOR, BEAT / 2, [0, 3, 2, 3, 1, 3, 2, 3], 0.38)
groove(S[2], S[3] - 0.3, 0.75, 0.6, 0.35)
basses(S[2], S[3], MAJOR, [1, 0, 1, 1, 0, 1, 1, 0], 0.6)
for k in range(4):
    place(leads, stereo(bell(84 + (0, 3, 7, 12)[k], 1.6), 0.4), DRILL_HIT + k * 0.06, 0.22)

# 4) pressão — progressão menor, pulso grave e contido
section_pads(S[3], S[4], TENSE, 1000, 0.85)
for t0 in np.arange(S[3], S[4] - 0.05, BEAT):
    name = chord_at(t0, TENSE, S[3])
    place(low, stereo(bass(ROOT_NOTE[name], BEAT * 0.8)), t0, 0.5)
    kicks.append((t0, 0.4))
    place(drums, kick(0.45), t0, 1.0)
arps(S[3] + BEAT, S[4], TENSE, BEAT, [0, 2, 1, 3], 0.3, inst=pluck)
place(fx, riser(2.2), S[4] - 2.2, 0.3)

# 5) subida da água — crescendo até o jorro
section_pads(S[4], S[5], MAJOR, 2200, 0.7)
arps(S[4], JET, MAJOR, BEAT / 2, [0, 1, 2, 3, 1, 2, 3, 0], 0.38)
arps(S[4] + 2 * BAR, JET, MAJOR, BEAT / 4, [0, 1, 2, 3], 0.16, inst=pluck, octave=24)
groove(S[4] + BAR, JET - 0.2, 0.7, 0.55)
basses(S[4], S[5], MAJOR, [1, 0, 1, 0, 1, 1, 1, 0], 0.6)
place(fx, riser(JET - (S[4] + 1.8)), S[4] + 1.8, 0.4)
place(fx, stereo(soft_hit(1.0)), JET, 0.55)
for k, m in enumerate([77, 81, 84, 89]):
    place(leads, stereo(bell(m, 2.0), -0.5 + 0.33 * k), JORRAR + 0.03 * k, 0.24)
groove(JET + 0.6, S[5], 0.8, 0.6, 0.4)
arps(JET + 0.6, S[5], MAJOR, BEAT / 2, [0, 2, 3, 1], 0.36)

# 6) comparação — groove mais leve
section_pads(S[5], S[6], MAJOR, 1600, 0.6)
arps(S[5], S[6], MAJOR, BEAT / 2, [0, 2, 1, 3, 2, 3, 1, 2], 0.34)
groove(S[5], S[6] - 0.2, 0.55, 0.45, 0.25)
basses(S[5], S[6], MAJOR, [1, 0, 0, 1, 0, 1, 0, 0], 0.55)
for k, m in enumerate([72, 76, 79]):
    place(leads, stereo(bell(m + 12, 1.5), 0.3), PUMP + 0.05 * k, 0.18)

# 7) distribuição — fluido e acolhedor
section_pads(S[6], S[7], ["Bb", "C", "F", "Dm"], 2000, 0.7)
arps(S[6], S[7], ["Bb", "C", "F", "Dm"], BEAT / 2, [0, 1, 2, 3, 2, 1], 0.36)
groove(S[6] + BAR / 2, S[7] - 0.4, 0.6, 0.5, 0.3)
basses(S[6], S[7], ["Bb", "C", "F", "Dm"], [1, 0, 1, 0, 1, 0, 1, 1], 0.55)
place(leads, stereo(bell(84, 1.8)), HOUSE, 0.2)
place(fx, riser(1.4), S[7] - 1.4, 0.3)

# 8) resolução
place(fx, stereo(soft_hit(1.2)), S[7], 0.5)
place(pads, pad(CH["Fadd9"], 45.0 - S[7], 2400, 1.0), S[7], 1.0)
place(low, stereo(np.sin(2 * np.pi * hz(29) * tt(5.0)) * env(5.0, 0.05, 2.5) * 0.6), S[7], 1.0)
arps(S[7], FINAL_HIT - 0.3, ["Fadd9"], BEAT / 2, [0, 1, 2, 3, 2, 1], 0.3)
for k, m in enumerate([77, 81, 84, 88, 91]):
    place(leads, stereo(bell(m, 2.6), -0.6 + 0.3 * k), FINAL_HIT + 0.05 * k, 0.24)
place(fx, stereo(soft_hit(1.0)), FINAL_HIT, 0.45)

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
