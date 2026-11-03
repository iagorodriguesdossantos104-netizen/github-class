import { useEffect, useMemo } from "react";
import { BoxGeometry, CatmullRomCurve3, CircleGeometry, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { METAL, PALETTE } from "../theme";
import { clamp, lerp, rand, randRange } from "../utils/animation";
import { halfRing, type WellSpec } from "./ArtesianWell";

// Água em movimento: coluna dentro do tubo (com altura controlável), bolhas subindo,
// jorro (só quando a pressão basta), linha do nível de pressão e fluxo pela tubulação.

const sphere = new SphereGeometry(1, 8, 6);

/** Coluna de água dentro do revestimento, vista em corte. `level` é o y do topo da água. */
export const WaterColumn: React.FC<{ spec: WellSpec; level: number; glow?: number }> = ({ spec, level, glow = 0 }) => {
  const h = Math.min(level, 0) - spec.bottom;
  const geo = useMemo(() => halfRing(0, spec.casingInner - 0.006, 1, 12), [spec.casingInner]);
  if (h <= 0.005) return null;
  return (
    <mesh geometry={geo} position={[spec.x, spec.bottom, spec.z]} scale={[1, h, 1]}>
      <meshStandardMaterial color={PALETTE.water} emissive={PALETTE.waterBright} emissiveIntensity={0.32 + 0.3 * glow} roughness={0.25} metalness={0} transparent opacity={0.92} />
    </mesh>
  );
};

/** Bolhas/partículas subindo dentro da coluna enquanto a água sobe. */
export const RisingParticles: React.FC<{ spec: WellSpec; level: number; frame: number; amount: number; speed?: number }> = ({ spec, level, frame, amount, speed = 0.07 }) => {
  if (amount <= 0.01) return null;
  const topY = Math.min(level, spec.top);
  const span = topY - spec.bottom;
  if (span <= 0.05) return null;
  const items = [];
  for (let i = 0; i < 16; i++) {
    const seed = `rise-${spec.x}-${i}`;
    const cycle = randRange(`${seed}c`, 2.6, 4.2) / speed;
    const u = (rand(`${seed}u`) + frame / cycle) % 1;
    const y = spec.bottom + u * span;
    if (y > 0.02) continue;
    const x = spec.x + randRange(`${seed}x`, -0.6, 0.6) * spec.casingInner;
    const r = 0.022 * amount * clamp(Math.min(u, 1 - u) * 10, 0, 1);
    items.push(
      <mesh key={i} geometry={sphere} position={[x, y, spec.z + 0.02]} scale={r}>
        <meshBasicMaterial color={PALETTE.waterFoam} />
      </mesh>,
    );
  }
  return <>{items}</>;
};

const halfDisc = (r: number) => {
  const g = new CircleGeometry(r, 18, 0, Math.PI);
  g.rotateX(-Math.PI / 2);
  return g;
};

/** Jorro controlado na boca do poço (só existe no caso em que a pressão leva a água acima do solo). */
export const Jet: React.FC<{ spec: WellSpec; amount: number; frame: number; height?: number }> = ({ spec, amount, frame, height = 0.95 }) => {
  const puddle = useMemo(() => halfDisc(1), []);
  if (amount <= 0.005) return null;
  const H = height * amount;
  const y0 = spec.top;
  const drops = [];
  for (let i = 0; i < 40; i++) {
    const seed = `jet-${spec.x}-${i}`;
    const period = randRange(`${seed}p`, 18, 26);
    const age = (rand(`${seed}o`) * period + frame) % period;
    // direções para trás e para os lados (a frente do diorama é o plano de corte)
    const ang = randRange(`${seed}a`, Math.PI * 0.05, Math.PI * 0.95);
    const v = randRange(`${seed}v`, 0.022, 0.045) * (0.5 + 0.5 * amount);
    const vx = Math.cos(ang) * v;
    const vz = -Math.sin(ang) * v;
    const vy = randRange(`${seed}y`, 0.0, 0.025);
    const y = y0 + H + vy * age - 0.0042 * age * age;
    if (y < 0.1) continue;
    const r = randRange(`${seed}r`, 0.026, 0.045) * Math.min(1, amount * 1.6);
    drops.push(
      <mesh key={i} geometry={sphere} position={[spec.x + vx * age, y, spec.z + vz * age]} scale={r}>
        <meshStandardMaterial color={PALETTE.waterBright} emissive={PALETTE.waterBright} emissiveIntensity={0.35} transparent opacity={0.9} />
      </mesh>,
    );
  }
  const wobble = 1 + 0.06 * Math.sin(frame * 0.9);
  return (
    <group>
      <mesh position={[spec.x, y0 + H / 2, spec.z]} scale={[wobble, 1, wobble]}>
        <cylinderGeometry args={[0.05, 0.085, H, 10, 1, true]} />
        <meshStandardMaterial color={PALETTE.waterBright} emissive={PALETTE.waterBright} emissiveIntensity={0.4} transparent opacity={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[spec.x, y0 + H, spec.z]} scale={[0.12 * wobble * amount, 0.08 * amount, 0.12 * wobble * amount]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={PALETTE.waterFoam} emissive={PALETTE.waterBright} emissiveIntensity={0.5} transparent opacity={0.9} />
      </mesh>
      {drops}
      <mesh geometry={puddle} position={[spec.x, 0.118, spec.z - 0.001]} scale={[0.7 * amount, 1, 0.7 * amount]}>
        <meshStandardMaterial color={PALETTE.water} emissive={PALETTE.waterBright} emissiveIntensity={0.25} transparent opacity={0.75} roughness={0.15} />
      </mesh>
    </group>
  );
};

const dash = new BoxGeometry(1, 1, 1);

/** Linha tracejada do nível potenciométrico (até onde a pressão faz a água subir). */
export const HeadLevelLine: React.FC<{ from: number; to: number; yAt: (x: number) => number; z: number; opacity: number; frame: number; color?: string }> = ({ from, to, yAt, z, opacity, frame, color = PALETTE.pressure }) => {
  if (opacity <= 0.01) return null;
  const items = [];
  const step = 0.24;
  const shift = (frame * 0.006) % step;
  const reveal = from + (to - from) * clamp(opacity * 1.4, 0, 1);
  for (let x = from + shift; x < reveal; x += step) {
    const x2 = Math.min(x + step * 0.55, to);
    const y1 = yAt(x);
    const y2 = yAt(x2);
    const len = Math.hypot(x2 - x, y2 - y1);
    items.push(
      <mesh key={x.toFixed(3)} geometry={dash} position={[(x + x2) / 2, (y1 + y2) / 2, z]} rotation={[0, 0, Math.atan2(y2 - y1, x2 - x)]} scale={[len, 0.05, 0.05]}>
        <meshBasicMaterial color={color} transparent opacity={clamp(opacity, 0, 1)} />
      </mesh>,
    );
  }
  return <>{items}</>;
};

/** Trecho de tubulação: cresce ao longo do caminho e mostra a água correndo por dentro. */
export const PipeRun: React.FC<{ points: [number, number, number][]; grow: number; flow: number; frame: number; radius?: number; speed?: number }> = ({ points, grow, flow, frame, radius = 0.055, speed = 0.035 }) => {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, "catmullrom", 0.08), [points]);
  const length = useMemo(() => curve.getLength(), [curve]);
  const SEG = 180;
  const RAD = 8;
  const tube = useMemo(() => new TubeGeometry(curve, SEG, radius, RAD, false), [curve, radius]);
  useEffect(() => () => tube.dispose(), [tube]);
  if (grow <= 0.001) return null;
  tube.setDrawRange(0, Math.floor(grow * SEG) * RAD * 6);
  const n = Math.ceil(length / 0.16);
  const items = [];
  if (flow > 0.001) {
    const front = flow;
    for (let i = 0; i < n; i++) {
      const u = (i / n + (frame * speed) / length) % 1;
      if (u > front || u > grow) continue;
      const p = curve.getPointAt(u);
      items.push(
        <mesh key={i} geometry={sphere} position={p} scale={radius * 0.62}>
          <meshBasicMaterial color={PALETTE.waterBright} />
        </mesh>,
      );
    }
  }
  return (
    <group>
      <mesh geometry={tube} castShadow>
        <meshStandardMaterial {...METAL} color={PALETTE.pipe} transparent opacity={flow > 0.001 ? 0.5 : 0.95} depthWrite={false} />
      </mesh>
      {items}
    </group>
  );
};

export const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
