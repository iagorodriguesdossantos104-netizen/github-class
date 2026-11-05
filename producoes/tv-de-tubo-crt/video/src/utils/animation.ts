import { Easing, interpolate, random, spring } from "remotion";

// Utilitários de animação. Tudo é função pura do frame: nada depende de tempo real
// nem de Math.random(), então qualquer frame pode ser renderizado isoladamente.

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

/** Progresso 0→1 entre dois frames, com easing. */
export const progress = (frame: number, start: number, end: number, easing: (t: number) => number = EASE.inOut) =>
  interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const EASE = {
  linear: (t: number) => t,
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.45, 0, 0.25, 1),
} as const;

export type EaseName = keyof typeof EASE;

/** Entrada elástica com leve overshoot (badges, objetos que "brotam"). */
export const pop = (frame: number, fps: number, delay = 0, damping = 11) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness: 140, mass: 0.7 } });

/** Pulso suave 0→1→0 contínuo (brilhos). */
export const pulse = (frame: number, periodFrames: number, phase = 0) =>
  0.5 - 0.5 * Math.cos(((frame + phase) / periodFrames) * Math.PI * 2);

export type Vec3 = [number, number, number];

/**
 * Pose de câmera descrita como órbita em torno do alvo: azimute 0° = de frente para o corte
 * (eixo +z), positivo = vindo da direita; elevação positiva = de cima.
 */
export const orbit = (target: Vec3, distance: number, azimuthDeg: number, elevationDeg: number) => {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  const position: Vec3 = [
    target[0] + distance * Math.sin(az) * Math.cos(el),
    target[1] + distance * Math.sin(el),
    target[2] + distance * Math.cos(az) * Math.cos(el),
  ];
  return { position, target };
};

/** Número pseudoaleatório determinístico em [0, 1). */
export const rand = (seed: string | number) => random(seed);
export const randRange = (seed: string | number, lo: number, hi: number) => lo + (hi - lo) * random(seed);

// ---------------------------------------------------------------- trilhas de animação dos dados de cena
export type TrackAnimation = {
  type: "interpolate" | "spring";
  /** "objeto.propriedade", ex.: "drill.depth", "water.level", "pump.on". */
  target: string;
  /** Frames LOCAIS à cena. Para spring, deixe ≥ 30 frames: ao fim o valor assume `to`. */
  startFrame: number;
  endFrame: number;
  /** Omitido = continua do `to` da animação anterior do mesmo alvo. */
  from?: number;
  to?: number;
  easing?: EaseName;
  damping?: number;
  /** Unidade do valor: "u3d" (unidades do mundo 3D), "px", "deg", "rad" ou "0-1". */
  unit?: "u3d" | "px" | "deg" | "rad" | "0-1";
};

type SceneLike = { startFrame: number; animations: readonly TrackAnimation[] };

type Resolved = { start: number; end: number; from: number; to: number; anim: TrackAnimation };

const cache = new WeakMap<readonly SceneLike[], Map<string, Resolved[]>>();

const resolve = (scenes: readonly SceneLike[], target: string): Resolved[] => {
  let byTarget = cache.get(scenes);
  if (!byTarget) {
    byTarget = new Map();
    cache.set(scenes, byTarget);
  }
  const hit = byTarget.get(target);
  if (hit) return hit;
  const entries = scenes
    .flatMap((sc) => sc.animations.filter((a) => a.target === target).map((a) => ({ a, start: sc.startFrame + a.startFrame, end: sc.startFrame + a.endFrame })))
    .sort((p, q) => p.start - q.start);
  const out: Resolved[] = [];
  let prev = 0;
  for (const { a, start, end } of entries) {
    const from = a.from ?? prev;
    const to = a.to ?? 1;
    out.push({ start, end, from, to, anim: a });
    prev = to;
  }
  byTarget.set(target, out);
  return out;
};

/**
 * Valor de uma trilha (ex.: "drill.depth") no frame global, a partir do array de cenas.
 * Frames das animações são locais à cena; antes da 1ª animação vale o `from` dela,
 * depois da última vale o `to`.
 */
export const evaluateTrack = (scenes: readonly SceneLike[], target: string, frame: number, fps: number, fallback = 0) => {
  const list = resolve(scenes, target);
  if (list.length === 0) return fallback;
  let cur: Resolved | null = null;
  for (const r of list) {
    if (r.start <= frame) cur = r;
    else break;
  }
  if (!cur) return list[0].from;
  if (frame >= cur.end) return cur.to;
  if (cur.anim.type === "spring") {
    const p = spring({ frame: frame - cur.start, fps, config: { damping: cur.anim.damping ?? 12, stiffness: 120, mass: 0.8 } });
    return lerp(cur.from, cur.to, p);
  }
  const p = progress(frame, cur.start, cur.end, EASE[cur.anim.easing ?? "inOut"]);
  return lerp(cur.from, cur.to, p);
};
