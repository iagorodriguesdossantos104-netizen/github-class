"""Sintetiza os efeitos sonoros do vídeo (tudo gerado por código, sem samples).

Uso:
    python scripts/sfx.py          -> public/audio/sfx/*.wav
"""

from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "sfx"
SR = 48000
rng = np.random.default_rng(31)


def tt(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def sweep_bp(x, centers, q=1.6, block=256):
    out = np.zeros_like(x)
    zi = None
    for b in range(0, len(x), block):
        c = float(np.clip(centers[min(b, len(centers) - 1)], 60, 16000))
        sos = butter(2, [c / q, min(c * q, SR * 0.45)], "band", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
        out[b : b + block], zi = sosfilt(sos, x[b : b + block], axis=0, zi=zi)
    return out


def pan(x, p):
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], axis=1)


def env(d, a, r):
    t = tt(d)
    return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)


def save(name, x, peak=0.89):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    sf.write(OUT / f"{name}.wav", x.astype(np.float32), SR, subtype="PCM_16")


# ---------------------------------------------------------------- movimento de câmera
def whoosh(d=0.7, f0=400, ratio=14, spread=0.6):
    t = tt(d)
    p = t / d
    shape = np.sin(np.pi * p) ** 2
    n = rng.standard_normal((len(t), 2))
    y = sweep_bp(n, f0 * ratio ** np.sin(np.pi * p * 0.5)) * shape[:, None]
    pn = np.linspace(-spread, spread, len(t))
    y[:, 0] *= np.cos((pn + 1) * np.pi / 4) * 1.4
    y[:, 1] *= np.sin((pn + 1) * np.pi / 4) * 1.4
    return y


def dive(d=2.2):
    # câmera atravessando o chão: ar + terra passando, filtro descendo
    t = tt(d)
    p = t / d
    n = rng.standard_normal((len(t), 2))
    y = sweep_bp(n, 3500 * 0.08 ** (p**0.8), q=2.0)
    rumble = lp(rng.standard_normal(len(t)), 110) * 2.5 * np.sin(np.pi * p) ** 2
    amp = np.sin(np.pi * np.clip(p * 1.1, 0, 1)) ** 1.3
    return (y + rumble[:, None]) * amp[:, None]


# ---------------------------------------------------------------- interface
def pop(f0=760, f1=380):
    t = tt(0.09)
    f = f1 + (f0 - f1) * np.exp(-t / 0.015)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) * (1 - np.exp(-t / 0.001))


def badge():
    # "plim" suave de entrada de badge: pop + dois parciais
    t = tt(0.5)
    y = np.zeros(len(t))
    for f, dl, g in [(1046.5, 0.0, 1.0), (1568, 0.045, 0.6)]:
        u = np.clip(t - dl, 0, None)
        y += np.where(t >= dl, np.sin(2 * np.pi * f * u) * np.exp(-u / 0.12), 0) * g
    y[: int(0.09 * SR)] += pop(900, 450)[: int(0.09 * SR)] * 0.6
    return y * 0.6


def tick():
    t = tt(0.06)
    return np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.008) * 0.6 + hp(rng.standard_normal(len(t)), 5000) * np.exp(-t / 0.002) * 0.3


def click():
    t = tt(0.07)
    y = np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.006) + np.sin(2 * np.pi * 420 * t) * np.exp(-t / 0.015) * 0.7
    return y + hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.003) * 0.5


def buzz():
    # alerta negativo discreto (duas notas descendentes)
    t = tt(0.42)
    y = np.zeros(len(t))
    for f, dl in [(392, 0.0), (311, 0.16)]:
        u = np.clip(t - dl, 0, None)
        tone = np.sign(np.sin(2 * np.pi * f * u)) * 0.35 + np.sin(2 * np.pi * f * u)
        y += np.where(t >= dl, lp(tone, 2200) * np.exp(-u / 0.11), 0)
    return y * 0.6


def ding(f1=1318.5, f2=1975.5, d=1.1):
    t = tt(d)
    y = np.zeros(len(t))
    for f, dl, g in [(f1, 0.0, 1.0), (f2, 0.07, 0.7)]:
        u = np.clip(t - dl, 0, None)
        tone = np.sin(2 * np.pi * f * u + 0.9 * np.exp(-u / 0.2) * np.sin(2 * np.pi * f * 2 * u))
        y += np.where(t >= dl, tone * np.exp(-u / 0.35), 0) * g
    return y


def shimmer(d=1.6):
    # descoberta: notas agudas subindo + brilho
    t = tt(d)
    y = np.zeros((len(t), 2))
    notes = [1396.9, 1760, 2093, 2637, 3136]
    for k, f in enumerate(notes):
        dl = k * 0.07
        u = np.clip(t - dl, 0, None)
        y += pan(np.sin(2 * np.pi * f * u) * np.exp(-u / 0.5) * np.where(t >= dl, 1, 0), -0.6 + 1.2 * k / (len(notes) - 1))
    return y + hp(rng.standard_normal((len(t), 2)), 7000) * (np.exp(-t / 0.5) * (1 - np.exp(-t / 0.1)))[:, None] * 0.12


def glow():
    t = tt(1.2)
    f = 520 * 2 ** (0.5 * np.minimum(1, t / 0.6))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.minimum(1, t / 1.2)) * 0.5
    return y + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.sin(np.pi * np.minimum(1, t / 1.2)) * 0.2


def final():
    t = tt(2.4)
    y = np.zeros((len(t), 2))
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5]):
        dl = k * 0.05
        u = np.clip(t - dl, 0, None)
        y += pan(np.sin(2 * np.pi * f * u) * np.exp(-u / 0.9) * np.where(t >= dl, 1, 0), -0.5 + 0.25 * k) * (0.9 - 0.1 * k)
    boom = np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.4)
    return y + boom[:, None] * 0.7


# ---------------------------------------------------------------- máquina e terra
def thud():
    # caminhão aterrissando + suspensão
    t = tt(0.9)
    f = 38 + 90 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    dirt = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.12) * 0.5
    rattle = bp(rng.standard_normal(len(t)), 900, 3500) * np.exp(-t / 0.05) * 0.3
    return np.tanh((boom + dirt + rattle) * 1.4)


def hydraulic(d=0.75):
    t = tt(d)
    p = t / d
    hiss = bp(rng.standard_normal(len(t)), 2500, 9000) * np.sin(np.pi * p) ** 0.7 * 0.5
    motor = np.sin(2 * np.pi * np.cumsum(110 + 60 * p) / SR) * 0.4 * np.sin(np.pi * p)
    return hiss + lp(np.sign(motor), 600) * 0.3


def drill(d=3.0):
    # motor da perfuratriz + broca triturando rocha (com variação conforme a camada)
    t = tt(d)
    motor = np.zeros(len(t))
    base = 72 + 6 * np.sin(2 * np.pi * 0.6 * t)
    for h in range(1, 7):
        motor += np.sin(2 * np.pi * np.cumsum(base * h) / SR) / h
    motor = lp(motor, 900) * 0.6
    grind = bp(rng.standard_normal(len(t)), 300, 2400) * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 9 * t)))
    crunch = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, d - 0.05, 70)):
        i = int(t0 * SR)
        k = tt(0.03)
        seg = bp(rng.standard_normal(len(k)), 1200, 6000) * np.exp(-k / 0.006) * rng.uniform(0.3, 1.0)
        crunch[i : i + len(k)] += seg[: len(crunch) - i]
    return (motor + grind * 0.5 + crunch * 0.45) * env(d, 0.12, 0.35)


def crumble():
    t = tt(0.7)
    y = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, 0.45, 26)):
        i = int(t0 * SR)
        k = tt(0.05)
        seg = lp(rng.standard_normal(len(k)), rng.uniform(1500, 4000)) * np.exp(-k / 0.012) * rng.uniform(0.3, 1.0)
        y[i : i + len(k)] += seg[: len(y) - i]
    return y + lp(rng.standard_normal(len(t)), 200) * np.exp(-t / 0.2) * 0.6


def clunk():
    t = tt(0.6)
    y = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.08) + np.sin(2 * np.pi * 523 * t) * np.exp(-t / 0.15) * 0.5 + np.sin(2 * np.pi * 1290 * t) * np.exp(-t / 0.1) * 0.25
    return y + lp(rng.standard_normal(len(t)), 1200) * np.exp(-t / 0.02) * 0.5


def rumble_soft(d=1.4):
    t = tt(d)
    return lp(rng.standard_normal(len(t)), 140) * env(d, 0.3, 0.7) * 1.2 + np.sin(2 * np.pi * 52 * t) * env(d, 0.3, 0.7) * 0.4


def pressure(d=2.6):
    # pressão: grave pulsante e discreto
    t = tt(d)
    sub = np.sin(2 * np.pi * 46 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 2.2 * t))
    body = lp(np.sign(np.sin(2 * np.pi * 92 * t)), 300) * 0.25
    creak = bp(rng.standard_normal(len(t)), 180, 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * t)) * 0.3
    return (sub + body + creak) * env(d, 0.35, 0.9)


# ---------------------------------------------------------------- água
def bubbles(d=1.6, n=30, lo=500, hi=1400):
    t = tt(d)
    y = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, d - 0.1, n)):
        i = int(t0 * SR)
        k = tt(0.08)
        f0 = rng.uniform(lo, hi)
        f = f0 * (1 + 0.8 * k / 0.08)
        seg = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k / 0.02) * rng.uniform(0.3, 1.0)
        y[i : i + len(k)] += seg[: len(y) - i]
    return y * env(d, 0.1, 0.4)


def water_rise(d=2.3):
    t = tt(d)
    p = t / d
    n = rng.standard_normal((len(t), 2))
    rush = sweep_bp(n, 300 * 6 ** p, q=1.4) * (0.3 + 0.7 * p)[:, None] * env(d, 0.15, 0.25)[:, None]
    gl = bubbles(d, 55, 400, 1100)
    gl2 = bubbles(d, 40, 900, 2000)
    return rush * 0.8 + pan(gl, -0.3) * 0.6 + pan(gl2, 0.3) * 0.4


def gush(d=2.8):
    # água saindo com força e caindo em volta
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    spray = bp(n, 1500, 9000) * (np.minimum(1, t / 0.08) * (0.65 + 0.35 * np.exp(-t / 0.5)))[:, None]
    body = lp(n, 900) * 0.6 * np.exp(-t / 0.9)[:, None]
    splat = np.stack([bubbles(d, 50, 600, 1600), bubbles(d, 50, 700, 1800)], axis=1) * 0.35
    return (spray + body + splat) * env(d, 0.02, 0.9)[:, None]


def rain(d=4.6):
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    bed = bp(n, 1200, 8000) * 0.35
    drops = np.zeros(len(t))
    for t0 in np.sort(rng.uniform(0, d - 0.05, 160)):
        i = int(t0 * SR)
        k = tt(0.02)
        seg = hp(rng.standard_normal(len(k)), 3000) * np.exp(-k / 0.003) * rng.uniform(0.2, 1.0)
        drops[i : i + len(k)] += seg[: len(drops) - i]
    return (bed + pan(drops, 0.2) * 0.5) * env(d, 0.6, 1.0)[:, None]


def flow(d=3.2):
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    stream = sweep_bp(n, 700 + 250 * np.sin(2 * np.pi * 0.7 * t), q=1.8) * 0.6
    gl = bubbles(d, 45, 500, 1300)
    return (stream + pan(gl, 0.1) * 0.5) * env(d, 0.25, 0.8)[:, None]


def fill(d=2.3):
    # caixa enchendo: tom do "glug" sobe com o nível
    t = tt(d)
    p = t / d
    n = rng.standard_normal(len(t))
    pour = bp(n, 800, 5000) * 0.35
    res = np.sin(2 * np.pi * np.cumsum(260 + 520 * p) / SR) * (0.25 + 0.15 * np.sin(2 * np.pi * 11 * t))
    return (pour + lp(res, 1500) * 0.5 + bubbles(d, 40, 300 + 0, 900) * 0.4) * env(d, 0.2, 0.6)


def pump(d=2.0):
    t = tt(d)
    f = 95 + 125 * np.minimum(1, t / 0.5)
    whir = np.zeros(len(t))
    for h in (1, 2, 3, 5):
        whir += np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h
    hum = lp(whir, 1400) * 0.6
    start = np.concatenate([click(), np.zeros(len(t) - len(click()))]) * 0.6
    return (hum + bp(rng.standard_normal(len(t)), 400, 2000) * 0.12 + start) * env(d, 0.04, 0.6)


# ---------------------------------------------------------------- rede elétrica (este vídeo)
def hum_on(d=0.9):
    # zumbido elétrico que "acende" (50/60 Hz + harmônicos), entra e some
    t = tt(d)
    y = sum(np.sin(2 * np.pi * 120 * k * t) / k for k in (1, 2, 3, 5))
    return lp(y, 1800) * env(d, 0.05, 0.5) * 0.5


def leaves(d=0.8):
    n = rng.standard_normal(len(tt(d)))
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt(d)) ** 2
    return bp(n, 1500, 7000) * am * env(d, 0.15, 0.4) * 0.5


def zap(d=0.7):
    # arco elétrico: estalos rápidos + chiado
    t = tt(d)
    crackle = np.zeros(len(t))
    for _ in range(60):
        i = int(rng.random() * len(t) * 0.85)
        L = int(SR * (0.002 + rng.random() * 0.006))
        crackle[i : i + L] += rng.standard_normal(min(L, len(t) - i)) * (0.4 + rng.random())
    hiss = hp(rng.standard_normal(len(t)), 2500) * 0.35
    tone = np.sin(2 * np.pi * 120 * t) * 0.25 + np.sign(np.sin(2 * np.pi * 240 * t)) * 0.1
    return (crackle + hiss + tone) * np.exp(-t / 0.3)


def clack():
    # contato mecânico abrindo/fechando
    t = tt(0.22)
    y = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.01) + np.sin(2 * np.pi * 620 * t) * np.exp(-t / 0.03) * 0.8
    thump = np.sin(2 * np.pi * np.cumsum(80 + 120 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.06)
    return y + thump * 0.8 + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.004) * 0.4


def power_down(d=1.1):
    t = tt(d)
    f = 340 * np.exp(-t / 0.35) + 40
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)
    return lp(y, 1600) * env(d, 0.01, 0.6) * 0.7


def power_up(d=1.0):
    t = tt(d)
    f = 60 + 420 * (t / d) ** 1.4
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(2 * np.pi * np.cumsum(3 * f) / SR)
    return lp(y, 2600) * env(d, 0.05, 0.35) * 0.6


def creak(d=1.0):
    t = tt(d)
    f = 180 + 60 * np.sin(2 * np.pi * 1.3 * t)
    pulses = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.97).astype(float)
    return bp(pulses + rng.standard_normal(len(t)) * 0.05, 300, 2500) * env(d, 0.1, 0.3)


def beep():
    t = tt(0.16)
    return np.sin(2 * np.pi * 1760 * t) * env(0.16, 0.005, 0.06) * 0.6 + np.sin(2 * np.pi * 2640 * t) * env(0.16, 0.005, 0.05) * 0.2


def blip():
    t = tt(0.1)
    f = 900 + 900 * t / 0.1
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.1, 0.004, 0.05) * 0.6


def scan(d=1.2):
    t = tt(d)
    f = 700 + 500 * np.sin(2 * np.pi * 0.8 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * env(d, 0.1, 0.3) * 0.35


def engine(d=2.6):
    t = tt(d)
    f = 38 + 10 * np.minimum(1, t / 1.5)
    y = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in (1, 2, 3, 4))
    return lp(y + rng.standard_normal(len(t)) * 0.2, 700) * env(d, 0.3, 0.9) * 0.6



# ---------------------------------------------------------------- TV de tubo (este vídeo)
def knob_click():
    t = tt(0.16)
    a = click()
    y = np.zeros(len(t))
    y[: len(a)] += a
    b = click() * 0.6
    i = int(0.07 * SR)
    y[i : i + len(b)] += b[: len(y) - i]
    return y


def crt_on(d=1.1):
    # "tunc" grave do degauss + estática que some (sem o apito agudo real)
    t = tt(d)
    thump = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.25)
    hum = np.sin(2 * np.pi * 60 * t) * np.exp(-t / 0.5) * 0.35
    stat = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.18) * 0.35
    return thump + hum + stat


def zap_small():
    t = tt(0.18)
    f = 2400 * np.exp(-t / 0.03) + 500
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04) * 0.6 + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.01) * 0.3


def heat_hum(d=1.4):
    t = tt(d)
    f = 70 + 40 * np.minimum(1, t / 0.8)
    y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 2, 3))
    return lp(y, 900) * env(d, 0.4, 0.5) * 0.5


def pings(d=1.6, n=9):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(n):
        at = rng.random() * (d - 0.2)
        f = 1800 + rng.random() * 1800
        u = np.clip(t - at, 0, None)
        y += np.where(t >= at, np.sin(2 * np.pi * f * u) * np.exp(-u / 0.03), 0) * (0.5 + 0.5 * rng.random())
    return y * 0.5


def vacuum_hiss(d=1.8):
    t = tt(d)
    p = t / d
    n = rng.standard_normal((len(t), 2))
    y = sweep_bp(n, 5000 * 0.12 ** p, q=1.8)
    return y * (np.sin(np.pi * np.clip(p * 1.05, 0, 1)) ** 1.2)[:, None]


def seal_tick():
    t = tt(0.25)
    y = np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.012) + np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.05) * 0.5
    return y * 0.7


def charge_up(d=1.2):
    t = tt(d)
    f = 120 + 1600 * (t / d) ** 2
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + hp(rng.standard_normal(len(t)), 3000) * (t / d) * 0.25
    return y * env(d, 0.1, 0.12)


def zap_beam(d=0.6):
    t = tt(d)
    f = 300 + 2600 * np.exp(-t / 0.08)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    return y * 0.7 + np.pad(zap_small(), (0, len(t) - len(zap_small()))) * 0.6


def magnet_hum(d=1.6):
    t = tt(d)
    y = sum(np.sin(2 * np.pi * 100 * k * t) / k for k in (1, 2, 3)) * (0.7 + 0.3 * np.sin(2 * np.pi * 3 * t))
    return lp(y, 1200) * env(d, 0.25, 0.6) * 0.5


def swish(d=0.4):
    t = tt(d)
    p = t / d
    n = rng.standard_normal(len(t))
    return sweep_bp(n, 900 * 6 ** p, q=2.2) * np.sin(np.pi * p) ** 2


def scan_tick(d=3.0, rate=4.0):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(int(d * rate)):
        i = int(k / rate * SR)
        a = tick()
        y[i : i + len(a)] += a[: len(y) - i] * 0.6
    return y


def signal_warble(d=2.0):
    t = tt(d)
    f = 520 + 180 * np.sin(2 * np.pi * 6 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.15, 0.5) * 0.4


def speed_rise(d=1.3):
    t = tt(d)
    p = t / d
    n = rng.standard_normal((len(t), 2))
    y = sweep_bp(n, 300 * 25 ** p, q=1.5) * (p ** 1.5)[:, None]
    tone = np.sin(2 * np.pi * np.cumsum(200 * 6 ** p) / SR) * 0.2 * p
    return y + tone[:, None] * env(d, 0.05, 0.1)[:, None]


def tick_count(d=1.6):
    t = tt(d)
    y = np.zeros(len(t))
    tm = 0.0
    step = 0.13
    while tm < d - 0.05:
        i = int(tm * SR)
        a = tick()
        y[i : i + len(a)] += a[: len(y) - i]
        step *= 0.86
        tm += max(step, 0.035)
    return y * 0.6


def buzz_wrong():
    t = tt(0.45)
    y = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + np.sin(2 * np.pi * 150 * t)
    return lp(y, 1500) * env(0.45, 0.01, 0.15) * 0.6


def slide_clunk(d=0.7):
    t = tt(d)
    n = rng.standard_normal(len(t))
    slide = bp(n, 600, 2500) * env(d, 0.05, 0.1) * 0.4 * (t < 0.45)
    c = clunk()
    y = slide.astype(float)
    i = int(0.42 * SR)
    y[i : i + len(c)] += c[: len(y) - i]
    return y


def chime():
    return ding(1568, 2349.3, 1.3)



# ---------------------------------------------------------------- ozônio (este vídeo)
def waves(d=4.0):
    t = tt(d)
    n = rng.standard_normal((len(t), 2))
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * 0.28 * t) ** 2
    y = lp(n, 900) * 0.8 + hp(n, 3000) * 0.15
    return y * swell[:, None] * env(d, 0.6, 1.2)[:, None]


def vanish(d=1.4):
    # faixa se desfazendo: grãos agudos que descem e somem
    t = tt(d)
    y = np.zeros(len(t))
    for _ in range(140):
        at = rng.random() * (d - 0.15)
        i = int(at * SR)
        f = 3200 - 2200 * at / d + rng.random() * 600
        L = int(0.03 * SR)
        u = np.arange(L) / SR
        y[i : i + L] += (np.sin(2 * np.pi * f * u) * np.exp(-u / 0.008))[: len(y) - i] * (0.3 + 0.7 * rng.random())
    sweep = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t / 0.5) + 120) / SR) * 0.25
    return (y * 0.4 + sweep) * env(d, 0.02, 0.6)


def squeeze(d=1.0):
    t = tt(d)
    f = 220 + 900 * (t / d) ** 2
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.08, 0.15) * 0.45


def uv_rise(d=1.6):
    t = tt(d)
    f = 180 + 700 * (t / d)
    y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 2, 3))
    return lp(y, 2400) * env(d, 0.2, 0.3) * 0.45


def uv_hit(d=1.2):
    t = tt(d)
    boom = np.sin(2 * np.pi * np.cumsum(60 + 140 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.35)
    sizz = hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.4) * 0.3
    return boom + sizz


def lamp_buzz(d=1.4):
    t = tt(d)
    y = np.sin(2 * np.pi * 120 * t) + 0.5 * np.sign(np.sin(2 * np.pi * 240 * t)) * 0.3
    return lp(y, 1600) * env(d, 0.05, 0.4) * 0.35


def crack():
    t = tt(0.35)
    y = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.02)
    y += np.sin(2 * np.pi * 1400 * t) * np.exp(-t / 0.03) * 0.6
    return y


def fill_rise(d=2.2):
    t = tt(d)
    f = 300 + 500 * (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.4 + 0.6 * t / d) * env(d, 0.1, 0.2) * 0.4


def tick_fast(d=1.2):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(int(d * 9)):
        i = int(k / 9 * SR)
        a = tick()
        y[i : i + len(a)] += a[: len(y) - i]
    return y * 0.7


def sizzle(d=1.2):
    t = tt(d)
    n = hp(rng.standard_normal(len(t)), 4000)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 13 * t)
    return n * am * env(d, 0.05, 0.5) * 0.5


def block():
    t = tt(0.3)
    y = np.sin(2 * np.pi * 320 * t) * np.exp(-t / 0.05) + hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.01) * 0.4
    return y


def fizz(d=1.5):
    return bubbles(d, 40, 1800, 4200) * 0.8


def underwater(d=2.0):
    t = tt(d)
    y = lp(rng.standard_normal(len(t)), 400) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t))
    return y * env(d, 0.3, 0.6)


def restore(d=1.6):
    t = tt(d)
    y = np.zeros(len(t))
    for k, f in enumerate((523.3, 659.3, 784.0, 1046.5)):
        at = k * 0.12
        u = np.clip(t - at, 0, None)
        y += np.where(t >= at, np.sin(2 * np.pi * f * u) * np.exp(-u / 0.5), 0)
    return y[:, None] * 0.4 + shimmer(d)[: len(t)] * 0.3


def night_amb(d=3.0):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(8):
        at = 0.2 + k * 0.35 + rng.random() * 0.1
        i = int(at * SR)
        L = int(0.08 * SR)
        u = np.arange(L) / SR
        y[i : i + L] += (np.sin(2 * np.pi * 4200 * u) * np.sin(np.pi * u / 0.08))[: len(y) - i] * 0.3
    return y + lp(rng.standard_normal(len(t)), 300) * 0.15 * env(d, 0.5, 0.8)


def pages(d=1.2):
    t = tt(d)
    y = np.zeros(len(t))
    for k in range(3):
        i = int((0.1 + k * 0.33) * SR)
        L = int(0.18 * SR)
        n = bp(rng.standard_normal(L), 1500, 7000) * np.sin(np.pi * np.arange(L) / L)
        y[i : i + L] += n[: len(y) - i]
    return y


def low_tone(d=2.0):
    t = tt(d)
    y = np.sin(2 * np.pi * 73.4 * t) + 0.4 * np.sin(2 * np.pi * 110 * t)
    return lp(y, 600) * env(d, 0.3, 0.8) * 0.6


def stamp():
    t = tt(0.4)
    return np.sin(2 * np.pi * np.cumsum(90 + 160 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.08) + hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.01) * 0.5


OUT.mkdir(parents=True, exist_ok=True)
save("whoosh", whoosh(0.7))
save("whoosh-soft", whoosh(0.9, 300, 6, 0.3))
save("whoosh-big", whoosh(1.2, 200, 20, 0.8))
save("dive", dive())
save("pop", pop())
save("pop-high", pop(1150, 640))
save("badge", badge())
save("tick", tick())
save("click", click())
save("buzz", buzz())
save("ding", ding())
save("shimmer", shimmer())
save("glow", glow())
save("final", final())
save("thud", thud())
save("hydraulic", hydraulic())
save("drill", drill())
save("crumble", crumble())
save("clunk", clunk())
save("rumble-soft", rumble_soft())
save("pressure", pressure())
save("bubbles", bubbles())
save("water-rise", water_rise())
save("gush", gush())
save("rain", rain())
save("flow", flow())
save("fill", fill())
save("pump", pump())
save("hum-on", hum_on())
save("leaves", leaves())
save("zap", zap())
save("clack", clack())
save("power-down", power_down())
save("power-up", power_up())
save("creak", creak())
save("beep", beep())
save("blip", blip())
save("scan", scan())
save("engine", engine())
save("badge-final", final())
save("knob-click", knob_click())
save("crt-on", crt_on())
save("zap-small", zap_small())
save("heat-hum", heat_hum())
save("pings", pings())
save("badge-neg", buzz())
save("vacuum-hiss", vacuum_hiss())
save("seal-tick", seal_tick())
save("charge-up", charge_up())
save("zap-beam", zap_beam())
save("magnet-hum", magnet_hum())
save("swish", swish())
save("scan-tick", scan_tick())
save("signal-warble", signal_warble())
save("speed-rise", speed_rise())
save("tick-count", tick_count())
save("buzz-wrong", buzz_wrong())
save("slide-clunk", slide_clunk())
save("chime", chime())
for name, fn in [("waves", waves), ("vanish", vanish), ("squeeze", squeeze), ("uv-rise", uv_rise), ("uv-hit", uv_hit), ("lamp-buzz", lamp_buzz), ("crack", crack), ("fill-rise", fill_rise), ("tick-fast", tick_fast), ("sizzle", sizzle), ("block", block), ("fizz", fizz), ("underwater", underwater), ("restore", restore), ("night", night_amb), ("pages", pages), ("low-tone", low_tone), ("stamp", stamp)]:
    save(name, fn())
print("sfx:", sorted(p.name for p in OUT.glob("*.wav")))
