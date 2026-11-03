import { useMemo } from "react";
import { SphereGeometry } from "three";
import { PALETTE } from "../theme";
import { clamp, lerp, rand, randRange } from "../utils/animation";
import { evalPoly, layer, WELL, X0, X1, ZF } from "../utils/geology";
import { Scatter } from "./GeologicalLayers";

// Água armazenada: não é um lago subterrâneo. O aquífero é um arenito cujos grãos (bege)
// deixam poros entre si — o azul que aparece entre os grãos é a água ocupando esses poros.
// Na rocha cristalina abaixo, a água só existe nas fraturas.

const AQ = layer("aquifer");
const top = (x: number) => evalPoly(AQ.top, x);
const bot = (x: number) => evalPoly(AQ.bottom, x);

type Grain = { position: [number, number, number]; scale: [number, number, number]; rotation: [number, number, number]; color: string };

const makeGrains = (xa: number, xb: number, ylo: number, slotR: number) => {
  const out: Grain[] = [];
  const slot: Grain[] = [];
  const dx = 0.19;
  const dy = 0.165;
  let row = 0;
  for (let y = -8; y < 3; y += dy, row++) {
    for (let x = X0 + 0.07 + (row % 2) * dx * 0.5; x < X1 - 0.05; x += dx) {
      if (x < xa + 0.06 || x > xb - 0.06) continue;
      const seed = `gr-${row}-${Math.round(x * 100)}`;
      const r = randRange(`${seed}r`, 0.068, 0.094);
      const jx = x + randRange(`${seed}jx`, -0.025, 0.025);
      const jy = y + randRange(`${seed}jy`, -0.02, 0.02);
      if (jy < bot(jx) + r * 0.75 || jy > top(jx) - r * 0.75 || jy < ylo + r) continue;
      const g: Grain = {
        position: [jx, jy, ZF + 0.012],
        scale: [r, r * randRange(`${seed}s`, 0.78, 0.95), r * 0.55],
        rotation: [rand(`${seed}a`) * 3, rand(`${seed}b`) * 3, rand(`${seed}c`) * 3],
        color: rand(`${seed}k`) > 0.7 ? PALETTE.grainDark : PALETTE.grain,
      };
      if (Math.abs(jx - WELL.x) < slotR + 0.07) slot.push(g);
      else out.push(g);
    }
  }
  slot.sort((a, b) => a.position[1] - b.position[1]);
  return { out, slot };
};

/** Grãos do arenito (o azul entre eles é a água nos poros). */
export const AquiferGrains: React.FC<{ xa?: number; xb?: number; ylo?: number; boreY: number; slotR?: number }> = ({ xa = X0, xb = X1, ylo = -Infinity, boreY, slotR = WELL.boreR }) => {
  const { out, slot } = useMemo(() => makeGrains(xa, xb, ylo, slotR), [xa, xb, ylo, slotR]);
  // grãos na faixa do furo, do mais fundo para o mais raso: os que a broca já atravessou somem
  const count = slot.filter((g) => boreY > g.position[1] + g.scale[0]).length;
  const slotItems = useMemo(() => slot.slice(0, count), [slot, count]);
  return (
    <>
      <Scatter items={out} roughness={0.95} />
      <Scatter items={slotItems} roughness={0.95} />
    </>
  );
};

const sphere = new SphereGeometry(1, 8, 6);

const PARTICLES = 58;

/** Partículas de água que se movem lentamente pelos poros, no sentido do mergulho da camada. */
export const AquiferWater: React.FC<{ frame: number; intensity: number; inflow: number; glow: number; xa?: number; xb?: number; filterGap?: number }> = ({ frame, intensity, inflow, glow, xa = X0, xb = X1, filterGap = 0.14 }) => {
  if (intensity <= 0.001) return null;
  const items = [];
  for (let i = 0; i < PARTICLES; i++) {
    const seed = `aqw-${i}`;
    const speed = randRange(`${seed}v`, 0.006, 0.012);
    const u = (rand(`${seed}u`) + frame * (speed / (X1 - X0))) % 1;
    let x = X0 + 0.15 + u * (X1 - X0 - 0.3);
    const fr = randRange(`${seed}f`, 0.2, 0.8);
    let y = lerp(bot(x), top(x), fr);
    // perto do poço, a água converge para o filtro
    const w = inflow * Math.exp(-(((x - WELL.x) / 0.9) ** 2));
    if (w > 0.001) {
      const fy = clamp(y, WELL.filterBottom + 0.1, WELL.filterTop - 0.1);
      x = lerp(x, WELL.x + Math.sign(x - WELL.x) * filterGap, w);
      y = lerp(y, fy, w);
    }
    if (x < xa + 0.05 || x > xb - 0.05) continue;
    const edge = clamp(Math.min(u, 1 - u) * 12, 0, 1);
    const r = 0.034 * edge * intensity * (1 + 0.35 * glow);
    items.push(
      <mesh key={i} geometry={sphere} position={[x, y, ZF + 0.07]} scale={r}>
        <meshBasicMaterial color={PALETTE.waterBright} />
      </mesh>,
    );
  }
  // jatos laterais entrando no filtro quando o poço está captando
  if (inflow > 0.01) {
    for (let j = 0; j < 14; j++) {
      const seed = `inflow-${j}`;
      const side = j % 2 ? 1 : -1;
      const u = (rand(`${seed}u`) + frame / randRange(`${seed}p`, 26, 38)) % 1;
      const x = WELL.x + side * lerp(Math.min(1.15, (xb - xa) / 2 - 0.1), filterGap - 0.01, u);
      const y = lerp(WELL.filterBottom + 0.12, WELL.filterTop - 0.12, rand(`${seed}y`));
      const r = 0.03 * inflow * clamp(Math.min(u, 1 - u) * 8, 0, 1);
      items.push(
        <mesh key={`in-${j}`} geometry={sphere} position={[x, y, ZF + 0.07]} scale={r}>
          <meshBasicMaterial color={PALETTE.waterBright} />
        </mesh>,
      );
    }
  }
  return <>{items}</>;
};

type Seg = [[number, number], [number, number]];
const FRACTURES: [number, number][][] = [
  [
    [-3.6, -4.4],
    [-3.3, -4.9],
    [-3.45, -5.4],
    [-3.1, -6.0],
    [-3.25, -6.6],
  ],
  [
    [-3.3, -4.9],
    [-2.85, -5.2],
    [-2.6, -5.1],
  ],
  [
    [2.4, -5.6],
    [2.7, -6.0],
    [2.55, -6.5],
    [2.9, -7.0],
  ],
  [
    [2.7, -6.0],
    [3.2, -6.15],
  ],
  [
    [-0.8, -5.9],
    [-0.5, -6.3],
    [-0.75, -6.8],
  ],
  [
    [4.1, -6.0],
    [4.35, -6.4],
    [4.2, -6.9],
  ],
];
const SEGMENTS: Seg[] = FRACTURES.flatMap((pl) => pl.slice(1).map((p, i) => [pl[i], p] as Seg));

/** Água nas fraturas da rocha cristalina (pouco permeável fora delas). */
export const Fractures: React.FC<{ glow: number; xa?: number; xb?: number }> = ({ glow, xa = X0, xb = X1 }) => (
  <>
    {SEGMENTS.filter(([a, b]) => a[0] > xa && b[0] > xa && a[0] < xb && b[0] < xb).map(([a, b], i) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ZF + 0.006];
      return (
        <group key={i} position={mid} rotation={[0, 0, ang]}>
          <mesh>
            <boxGeometry args={[len + 0.06, 0.085, 0.01]} />
            <meshBasicMaterial color={PALETTE.bedrockDark} />
          </mesh>
          <mesh position={[0, 0, 0.004]}>
            <boxGeometry args={[len + 0.03, 0.04, 0.01]} />
            <meshBasicMaterial color={PALETTE.fracture} transparent opacity={0.75 + 0.25 * glow} />
          </mesh>
        </group>
      );
    })}
  </>
);
