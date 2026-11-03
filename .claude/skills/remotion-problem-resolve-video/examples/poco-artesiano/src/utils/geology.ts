import { random } from "remotion";
import { Shape } from "three";
import { PALETTE } from "../theme";
import { clamp, smoothstep } from "./animation";

// Modelo do diorama: um bloco de terreno com corte transversal no plano frontal (z = ZF).
// As camadas mergulham para a direita e sobem para a esquerda, onde o aquífero aflora
// sob o solo do morro (área de recarga) — é essa diferença de altura, somada às camadas
// pouco permeáveis acima e abaixo, que mantém a água do aquífero confinado sob pressão.

export const X0 = -5;
export const X1 = 5;
export const Z0 = -2.2;
export const ZF = 2.2;
export const BOTTOM = -7.2;

const STEP = 0.25;
export const XS: readonly number[] = Array.from({ length: Math.round((X1 - X0) / STEP) + 1 }, (_, i) => X0 + i * STEP);

const jitter = (seed: string, i: number, amp: number) => (random(`${seed}-${i}`) - 0.5) * 2 * amp;

const surfaceRaw = (x: number) => 2.0 * smoothstep((-1.2 - x) / 2.6);
const bend = (x: number) => 3.6 * smoothstep((-1.0 - x) / 3.6);
const tilt = (x: number) => -0.22 * x;

type Poly = readonly number[];

const surface: Poly = XS.map((x, i) => surfaceRaw(x) + (x > -1.1 ? random(`s-${i}`) * 0.035 : jitter("s", i, 0.06)));
const grassBottom: Poly = surface.map((y) => y - 0.07);
const soilBottom: Poly = surface.map((y, i) => y - 0.36 + jitter("soil", i, 0.04));
const sedimentBottom: Poly = XS.map((x, i) => Math.min(-1.3 + tilt(x) + bend(x) + jitter("sed", i, 0.06), soilBottom[i]));
const clayBottom: Poly = XS.map((x, i) => Math.min(-2.35 + tilt(x) + bend(x) + jitter("clay", i, 0.06), sedimentBottom[i]));
const aquiferBottom: Poly = XS.map((x, i) => Math.min(-3.95 + tilt(x) + bend(x) + jitter("aq", i, 0.07), clayBottom[i]));
const blockBottom: Poly = XS.map(() => BOTTOM);

/** Interpolação linear de uma polilinha amostrada em XS. */
export const evalPoly = (poly: Poly, x: number) => {
  const t = clamp((x - X0) / STEP, 0, XS.length - 1);
  const i = Math.min(Math.floor(t), XS.length - 2);
  const u = t - i;
  return poly[i] * (1 - u) + poly[i + 1] * u;
};

export type LayerId = "grass" | "topsoil" | "sediment" | "clay" | "aquifer" | "bedrock";

export type Layer = {
  id: LayerId;
  label: string;
  color: string;
  top: Poly;
  bottom: Poly;
  /** Deslocamento na "vista explodida" da cena 2: [y, z]. */
  explode: [number, number];
};

export const LAYERS: readonly Layer[] = [
  { id: "grass", label: "", color: PALETTE.grass, top: surface, bottom: grassBottom, explode: [0.8, 0] },
  { id: "topsoil", label: "SOLO", color: PALETTE.topsoil, top: grassBottom, bottom: soilBottom, explode: [0.8, 0] },
  { id: "sediment", label: "SEDIMENTOS", color: PALETTE.sediment, top: soilBottom, bottom: sedimentBottom, explode: [0.55, 0] },
  { id: "clay", label: "ARGILA", color: PALETTE.clay, top: sedimentBottom, bottom: clayBottom, explode: [0.3, 0] },
  { id: "aquifer", label: "AQUÍFERO", color: PALETTE.aquifer, top: clayBottom, bottom: aquiferBottom, explode: [0, 0.32] },
  { id: "bedrock", label: "ROCHA", color: PALETTE.bedrock, top: aquiferBottom, bottom: blockBottom, explode: [-0.3, 0] },
];

export const layer = (id: LayerId) => LAYERS.find((l) => l.id === id)!;

export const surfaceAt = (x: number) => evalPoly(surface, x);
export const aquiferTopAt = (x: number) => evalPoly(clayBottom, x);
export const aquiferBottomAt = (x: number) => evalPoly(aquiferBottom, x);
export const clayTopAt = (x: number) => evalPoly(sedimentBottom, x);

/** Nível potenciométrico (até onde a pressão do aquífero confinado elevaria a água). */
export const headAt = (x: number) => 1.85 - 0.06 * (x + 4.5);

// ---------------------------------------------------------------- poço
const WX = 0.9;
export const WELL = {
  x: WX,
  z: ZF,
  boreR: 0.2,
  casingR: 0.13,
  casingInner: 0.104,
  top: 0.3,
  sealBottom: -1.7,
  filterTop: aquiferTopAt(WX) - 0.12,
  filterBottom: aquiferBottomAt(WX) + 0.25,
  bottom: aquiferBottomAt(WX) + 0.12,
} as const;

/** Profundidade em que a broca encontra o aquífero. */
export const AQUIFER_HIT = aquiferTopAt(WX);

// ---------------------------------------------------------------- superfície
export const SITE = {
  house: { x: 3.95, z: -0.55, w: 1.35, d: 1.1, wallH: 0.85 },
  tank: { x: 2.55, z: -1.25, standH: 0.6, r: 0.36, h: 0.62 },
  rig: { mastX: 1.14, mastZ: 1.98 },
} as const;

// ---------------------------------------------------------------- geometria
/**
 * Contorno 2D (plano XY) de uma camada entre xa e xb, recortado em y ∈ [ylo, yhi].
 * Trechos com espessura nula (camadas que se afinam até sumir) viram formas separadas.
 */
export const layerShapes = (l: Layer, xa: number, xb: number, ylo = -Infinity, yhi = Infinity): Shape[] => {
  const xs = [xa, ...XS.filter((x) => x > xa + 1e-6 && x < xb - 1e-6), xb];
  const top = (x: number) => Math.min(evalPoly(l.top, x), yhi);
  const bot = (x: number) => Math.max(evalPoly(l.bottom, x), ylo);
  const th = (x: number) => top(x) - bot(x);
  const EPS = 0.004;
  const shapes: Shape[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length >= 2) {
      const s = new Shape();
      s.moveTo(run[0], bot(run[0]));
      for (const x of run) s.lineTo(x, Math.max(top(x), bot(x) + EPS));
      for (let k = run.length - 1; k >= 0; k--) s.lineTo(run[k], bot(run[k]));
      shapes.push(s);
    }
    run = [];
  };
  for (let k = 0; k < xs.length; k++) {
    const x = xs[k];
    const inside = th(x) > EPS;
    if (inside) {
      if (run.length === 0 && k > 0) {
        // entra numa faixa com espessura: acha onde a espessura cruza EPS
        const xp = xs[k - 1];
        const a = th(xp);
        const b = th(x);
        run.push(xp + ((EPS - a) / (b - a)) * (x - xp));
      }
      run.push(x);
    } else if (run.length > 0) {
      const xp = xs[k - 1];
      const a = th(xp);
      const b = th(x);
      run.push(xp + ((a - EPS) / (a - b)) * (x - xp));
      flush();
    }
  }
  flush();
  return shapes;
};
