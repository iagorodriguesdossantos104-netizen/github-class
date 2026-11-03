import { useLayoutEffect, useMemo, useRef } from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { InstancedMesh, Object3D, QuadraticBezierCurve3, Quaternion, TubeGeometry, Vector3 } from "three";
import { isVisible, track } from "../data/scenes";
import { MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, pulse, rand, type Vec3 } from "../utils/animation";

// Cenário persistente: uma rua-maquete com subestação, 8 postes, 7 casas, equipamentos de automação,
// circuito vizinho e centro de operação. Tudo lê as trilhas (track) no frame GLOBAL.
// Eixos: rua ao longo de x; postes em z=0; casas em z=-2,4; rua (asfalto) em z≈2,5.

// ------------------------------------------------------------------ geometria da rede
export const POLES_X = [-7, -5, -3, -1, 1, 3, 5, 7];
const NEIGHBOR_POLES_X = [9, 11];
export const GANTRY_X = -8.6;
const NEIGHBOR_GANTRY_X = 12.6;
export const WIRE_Y = 4.2;
const PHASES_Z = [-0.45, 0, 0.45];
const SAG = 0.16;

export type Seg = "A" | "B" | "C" | "D" | "N";
export const SEG_RANGE: Record<Seg, [number, number]> = { A: [GANTRY_X, -3], B: [-3, 1], C: [1, 3], D: [3, 7], N: [7, NEIGHBOR_GANTRY_X] };
export const segOf = (x: number): Seg => (x < -3 ? "A" : x < 1 ? "B" : x < 3 ? "C" : x < 7 ? "D" : "N");
export const segPower = (seg: Seg, frame: number) => (seg === "N" ? track("neighbor.power", frame, 1) : track(`seg${seg}.power`, frame, 1));

const FEEDER_POINTS = [GANTRY_X, ...POLES_X];
const NEIGHBOR_POINTS = [7, ...NEIGHBOR_POLES_X, NEIGHBOR_GANTRY_X];

/** Altura do fio em x (catenária simplificada entre postes), com a flecha extra da árvore no trecho C. */
export const wireYAt = (x: number, extraSagC = 0) => {
  const pts = x <= 7 ? FEEDER_POINTS : NEIGHBOR_POINTS;
  let i = 0;
  while (i < pts.length - 2 && x > pts[i + 1]) i++;
  const a = pts[i];
  const b = pts[i + 1];
  const t = clamp((x - a) / (b - a), 0, 1);
  const extra = a === 1 && b === 3 ? extraSagC : 0;
  return WIRE_Y - 4 * (SAG + extra) * t * (1 - t);
};

// Pontos-chave (rótulos 2D usam estes mesmos pontos)
export const POINTS = {
  substation: [-9.6, 2.4, 0] as Vec3,
  breaker: [-9.3, 1.1, 1.2] as Vec3,
  recloser: [-3, 3.55, 0.35] as Vec3,
  switch1: [1, 4.7, 0] as Vec3,
  switch2: [3, 4.7, 0] as Vec3,
  tie: [7, 4.7, 0] as Vec3,
  neighbor: [11, 4.3, 0] as Vec3,
  branchTouch: [-1.4, WIRE_Y - 0.1, 0.35] as Vec3,
  treeTouch: [2, WIRE_Y - 0.3, 0.2] as Vec3,
  house3Switch: [-1.55, 0.95, -1.78] as Vec3,
  house7: [6, 1.6, -1.8] as Vec3,
  cod: [-1, 2.2, -12] as Vec3,
  codAntenna: [-0.2, 4.4, -12] as Vec3,
  codScreen: [-1, 1.25, -10.79] as Vec3,
};

/** Casas: posição x e índice de cor; o trecho define se estão acesas. */
export const HOUSES = [
  { x: -6, i: 0 },
  { x: -4, i: 1 },
  { x: -2, i: 2 },
  { x: 0, i: 3 },
  { x: 2.2, i: 4 },
  { x: 4, i: 5 },
  { x: 6, i: 6 },
];
const HOUSE_Z = -2.4;

const DEVICE_BOXES: { id: string; x: number }[] = [
  { id: "recloser", x: -3 },
  { id: "switch1", x: 1 },
  { id: "switch2", x: 3 },
  { id: "tieSwitch", x: 7 },
];
export const deviceAntenna = (x: number): Vec3 => [x, 2.55, 0.32];

// ------------------------------------------------------------------ helpers
const up = new Vector3(0, 1, 0);
const tmpA = new Vector3();
const tmpB = new Vector3();

/** Cilindro entre dois pontos (cabos, braços, galhos). */
const Rod: React.FC<{ a: Vec3; b: Vec3; r: number; color: string; emissive?: string; emissiveIntensity?: number; opacity?: number; castShadow?: boolean }> = ({
  a,
  b,
  r,
  color,
  emissive = "#000000",
  emissiveIntensity = 0,
  opacity = 1,
  castShadow = true,
}) => {
  tmpA.set(...a);
  tmpB.set(...b);
  const len = tmpA.distanceTo(tmpB);
  const mid = tmpA.clone().add(tmpB).multiplyScalar(0.5);
  const q = new Quaternion().setFromUnitVectors(up, tmpB.clone().sub(tmpA).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow={castShadow}>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial {...MATTE} color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

const Glow: React.FC<{ p: Vec3; r: number; color: string; opacity: number }> = ({ p, r, color, opacity }) =>
  opacity > 0.01 ? (
    <mesh position={p}>
      <sphereGeometry args={[r, 12, 10]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  ) : null;

// ------------------------------------------------------------------ chão e rua
const Ground: React.FC = () => (
  <group>
    <mesh position={[1, -0.2, -3]} receiveShadow>
      <boxGeometry args={[30, 0.4, 20]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.ground} />
    </mesh>
    <mesh position={[1, -0.75, -3]}>
      <boxGeometry args={[30.6, 0.7, 20.6]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.groundSide} />
    </mesh>
    <mesh position={[1, -1.25, -3]}>
      <boxGeometry args={[31.4, 0.3, 21.4]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.pedestal} />
    </mesh>
    <mesh position={[1, 0.012, 2.55]} receiveShadow>
      <boxGeometry args={[30, 0.025, 2.3]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.asphalt} />
    </mesh>
    {Array.from({ length: 15 }, (_, i) => (
      <mesh key={i} position={[-13 + i * 2, 0.03, 2.55]} receiveShadow>
        <boxGeometry args={[0.9, 0.01, 0.1]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.stripe} />
      </mesh>
    ))}
    <mesh position={[1, 0.03, 0.75]} receiveShadow>
      <boxGeometry args={[30, 0.06, 1.3]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.sidewalk} />
    </mesh>
    {/* árvores de fundo (decoração) */}
    {Array.from({ length: 9 }, (_, i) => {
      const x = -11 + i * 2.9 + rand(`bgx${i}`) * 0.8;
      const z = -5.4 - rand(`bgz${i}`) * 2.2;
      const h = 0.9 + rand(`bgh${i}`) * 0.6;
      return (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, h * 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, h, 5]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.trunk} />
          </mesh>
          <mesh position={[0, h + 0.45, 0]} castShadow>
            <icosahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial {...MATTE} color={i % 2 ? PALETTE.leaves : PALETTE.leavesDark} />
          </mesh>
        </group>
      );
    })}
  </group>
);

// ------------------------------------------------------------------ postes e fios
const Pole: React.FC<{ x: number; transformer?: boolean }> = ({ x, transformer }) => (
  <group position={[x, 0, 0]}>
    <mesh position={[0, 2.35, 0]} castShadow>
      <cylinderGeometry args={[0.085, 0.14, 4.7, 7]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.concrete} />
    </mesh>
    <mesh position={[0, WIRE_Y - 0.08, 0]} castShadow>
      <boxGeometry args={[0.12, 0.1, 1.25]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.crossarm} />
    </mesh>
    {PHASES_Z.map((z) => (
      <mesh key={z} position={[0, WIRE_Y - 0.02, z]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.12, 6]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.insulator} />
      </mesh>
    ))}
    {transformer ? (
      <mesh position={[0, 3.25, -0.28]} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.5, 8]} />
        <meshStandardMaterial {...METAL} color={PALETTE.metal} />
      </mesh>
    ) : null}
  </group>
);

type WireLook = { frame: number; heat: number; tint: number; dark: number; sagC: number };

const segColor: Record<Seg, string> = { A: PALETTE.segA, B: PALETTE.segB, C: PALETTE.segC, D: PALETTE.segD, N: PALETTE.radio };

const Span: React.FC<{ x0: number; x1: number; z: number; look: WireLook }> = ({ x0, x1, z, look }) => {
  const seg = segOf((x0 + x1) / 2);
  const extra = x0 === 1 && x1 === 3 && z === 0 ? look.sagC : x0 === 1 && x1 === 3 ? look.sagC * 0.6 : 0;
  const geometry = useMemo(() => {
    const a = new Vector3(x0, WIRE_Y, z);
    const b = new Vector3(x1, WIRE_Y, z);
    const m = new Vector3((x0 + x1) / 2, WIRE_Y - 2 * (SAG + extra), z);
    return new TubeGeometry(new QuadraticBezierCurve3(a, m, b), 18, 0.032, 5, false);
  }, [x0, x1, z, extra]);
  // aquecimento: a frente "quente" vai do galho (x≈-1,4) até a subestação
  const mid = (x0 + x1) / 2;
  const front = -1.4 - look.heat * 8;
  const hot = look.heat > 0.01 && mid < -0.4 && mid > front ? clamp(look.heat * 1.4, 0, 1) : 0;
  const off = segPower(seg, look.frame) < 0.5 && seg !== "N";
  const darkPulse = off ? look.dark * (0.35 + 0.65 * pulse(look.frame, 18)) : 0;
  const tint = seg === "N" ? 0 : look.tint;
  let color = PALETTE.wire as string;
  if (tint > 0) color = interpolateColors(tint, [0, 1], [PALETTE.wire, segColor[seg]]);
  if (hot > 0) color = interpolateColors(hot, [0, 1], [color, "#ff3b1f"]);
  const emissive = hot > 0 ? "#ff3b1f" : darkPulse > 0 ? PALETTE.negative : tint > 0 ? segColor[seg] : "#000000";
  const ei = hot > 0 ? hot * 1.6 : darkPulse > 0 ? darkPulse * 0.9 : tint * 0.45;
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial {...MATTE} color={color} emissive={emissive} emissiveIntensity={ei} />
    </mesh>
  );
};

const Wires: React.FC<{ look: WireLook }> = ({ look }) => {
  const spans: [number, number][] = [];
  for (let i = 0; i < FEEDER_POINTS.length - 1; i++) spans.push([FEEDER_POINTS[i], FEEDER_POINTS[i + 1]]);
  for (let i = 0; i < NEIGHBOR_POINTS.length - 1; i++) spans.push([NEIGHBOR_POINTS[i] + (i === 0 ? 0.35 : 0), NEIGHBOR_POINTS[i + 1]]);
  return (
    <group>
      {spans.flatMap(([a, b]) => PHASES_Z.map((z) => <Span key={`${a}-${z}`} x0={a} x1={b} z={z} look={look} />))}
    </group>
  );
};

// Partículas de energia: cada partícula vive dentro do seu trecho; posição = função pura do frame.
type Particle = { seg: Seg; z: number; u: number };
const PARTICLES: Particle[] = (() => {
  const out: Particle[] = [];
  (Object.keys(SEG_RANGE) as Seg[]).forEach((seg) => {
    const [a, b] = SEG_RANGE[seg];
    const n = Math.max(3, Math.round((b - a) / 0.62));
    PHASES_Z.forEach((z, zi) => {
      for (let i = 0; i < n; i++) out.push({ seg, z, u: (i + rand(`p${seg}${zi}${i}`) * 0.35) / n });
    });
  });
  return out;
})();

const dummy = new Object3D();

const EnergyFlow: React.FC<{ frame: number; sagC: number }> = ({ frame, sagC }) => {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const power: Record<Seg, number> = { A: segPower("A", frame), B: segPower("B", frame), C: segPower("C", frame), D: segPower("D", frame), N: segPower("N", frame) };
    const dirD = track("segD.flowDir", frame, 1);
    PARTICLES.forEach((p, i) => {
      const [a, b] = SEG_RANGE[p.seg];
      const len = b - a;
      const dir = p.seg === "N" ? -1 : p.seg === "D" ? dirD : 1;
      const t = (((p.u + (dir * frame * 0.05) / len) % 1) + 1) % 1;
      const x = a + t * len;
      const edge = Math.min(t, 1 - t) * len; // encolhe perto das pontas do trecho
      const k = clamp(power[p.seg], 0, 1) * clamp(edge / 0.25, 0, 1);
      dummy.position.set(x, wireYAt(x, p.z === 0 ? sagC : sagC * 0.6) + 0.005, p.z);
      dummy.scale.setScalar(Math.max(0.0001, k));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [frame, sagC]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PARTICLES.length]} frustumCulled={false}>
      <sphereGeometry args={[0.075, 8, 6]} />
      <meshBasicMaterial color={PALETTE.energy} toneMapped={false} />
    </instancedMesh>
  );
};

// ------------------------------------------------------------------ casas
const House: React.FC<{ x: number; i: number; lit: number; frame: number }> = ({ x, i, lit, frame }) => {
  const win = interpolateColors(clamp(lit, 0, 1), [0, 1], [PALETTE.windowOff, PALETTE.windowOn]);
  const flicker = 1 + 0.04 * Math.sin(frame / 7 + i);
  return (
    <group position={[x, 0, HOUSE_Z]}>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.24, 1.2]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.wall[i]} />
      </mesh>
      <mesh position={[0, 1.52, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.12, 0.62, 4]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.roof[i]} />
      </mesh>
      {[-0.36, 0.36].map((wx) => (
        <mesh key={wx} position={[wx, 0.78, 0.605]}>
          <boxGeometry args={[0.36, 0.34, 0.02]} />
          <meshStandardMaterial {...MATTE} color={win} emissive={PALETTE.windowOn} emissiveIntensity={lit * 1.1 * flicker} />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0.605]}>
        <boxGeometry args={[0.26, 0.5, 0.02]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.roof[i]} />
      </mesh>
    </group>
  );
};

/** Ramal de ligação: do poste mais próximo até a casa. */
const ServiceDrop: React.FC<{ x: number }> = ({ x }) => {
  const pole = POLES_X.reduce((best, p) => (Math.abs(p - x) < Math.abs(best - x) ? p : best), POLES_X[0]);
  return <Rod a={[pole, 3.4, -0.1]} b={[x, 1.25, HOUSE_Z + 0.6]} r={0.014} color={PALETTE.wire} castShadow={false} />;
};

/** Casa 3 da abertura: interruptor na fachada + lâmpada atrás da janela. */
const House3Details: React.FC<{ frame: number; lit: number }> = ({ frame, lit }) => {
  const press = track("switch.press", frame, 1);
  const bulb = track("bulb.glow", frame, 1) * lit;
  return (
    <group>
      <mesh position={[POINTS.house3Switch[0], POINTS.house3Switch[1], POINTS.house3Switch[2] + 0.01]}>
        <boxGeometry args={[0.16, 0.22, 0.03]} />
        <meshStandardMaterial {...MATTE} color="#ffffff" />
      </mesh>
      <mesh position={[POINTS.house3Switch[0], POINTS.house3Switch[1], POINTS.house3Switch[2] + 0.035]} rotation={[lerp(0.5, -0.5, clamp(press, 0, 1)), 0, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.03]} />
        <meshStandardMaterial {...MATTE} color="#c9d1da" />
      </mesh>
      <Glow p={[-2.36, 0.86, -1.95]} r={0.09} color="#fff2c4" opacity={clamp(bulb, 0, 1)} />
      <Glow p={[-2.36, 0.86, -1.95]} r={0.2} color={PALETTE.windowOn} opacity={clamp(bulb, 0, 1) * 0.35} />
    </group>
  );
};

// ------------------------------------------------------------------ subestação e disjuntor
const Substation: React.FC<{ frame: number }> = ({ frame }) => {
  const open = clamp(track("breaker.open", frame), 0, 1.2);
  const powered = segPower("A", frame) > 0.5;
  return (
    <group>
      <mesh position={[-9.9, 0.06, 0]} receiveShadow>
        <boxGeometry args={[3, 0.12, 3.4]} />
        <meshStandardMaterial {...MATTE} color="#8f8b84" />
      </mesh>
      {/* transformador de força */}
      <mesh position={[-10.3, 0.85, -0.6]} castShadow>
        <boxGeometry args={[1.3, 1.4, 1.1]} />
        <meshStandardMaterial {...METAL} color={PALETTE.substation} />
      </mesh>
      {[-0.45, -0.15, 0.15, 0.45].map((dz) => (
        <mesh key={dz} position={[-9.6, 0.85, -0.6 + dz]} castShadow>
          <boxGeometry args={[0.12, 1.1, 0.06]} />
          <meshStandardMaterial {...METAL} color={PALETTE.metalDark} />
        </mesh>
      ))}
      {[-0.35, 0, 0.35].map((dz) => (
        <mesh key={dz} position={[-10.3, 1.75, -0.6 + dz]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.4, 6]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.insulator} />
        </mesh>
      ))}
      {/* pórtico de saída do alimentador */}
      {[-0.7, 0.7].map((dz) => (
        <mesh key={dz} position={[GANTRY_X, 2.2, dz]} castShadow>
          <boxGeometry args={[0.14, 4.4, 0.14]} />
          <meshStandardMaterial {...METAL} color={PALETTE.metal} />
        </mesh>
      ))}
      <mesh position={[GANTRY_X, WIRE_Y + 0.1, 0]} castShadow>
        <boxGeometry args={[0.16, 0.14, 1.6]} />
        <meshStandardMaterial {...METAL} color={PALETTE.metal} />
      </mesh>
      {/* cerca */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-11.35 + i * 0.42, 0.35, 1.65]}>
          <boxGeometry args={[0.04, 0.6, 0.04]} />
          <meshStandardMaterial {...METAL} color={PALETTE.metalDark} />
        </mesh>
      ))}
      {/* disjuntor: armário com tampa transparente e contato móvel */}
      <group position={[-9.3, 0, 0.9]}>
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[0.9, 1.1, 0.55]} />
          <meshStandardMaterial {...METAL} color="#c3c9cf" />
        </mesh>
        <mesh position={[0, 0.62, 0.28]}>
          <boxGeometry args={[0.74, 0.86, 0.01]} />
          <meshStandardMaterial {...MATTE} color="#1d2836" />
        </mesh>
        {[-0.24, 0.24].map((dx) => (
          <mesh key={dx} position={[dx, 0.62, 0.3]}>
            <boxGeometry args={[0.08, 0.08, 0.03]} />
            <meshStandardMaterial {...METAL} color="#e2c06a" />
          </mesh>
        ))}
        <mesh position={[-0.24, 0.62, 0.31]} rotation={[0, 0, open * 1.05]}>
          <boxGeometry args={[0.5, 0.05, 0.02]} />
          <meshStandardMaterial {...METAL} color="#f0d27a" emissive="#f0d27a" emissiveIntensity={0.3} />
        </mesh>
        <Glow p={[0.3, 1.05, 0.3]} r={0.045} color={powered ? PALETTE.positive : PALETTE.negative} opacity={1} />
      </group>
      {/* cabos de descida do transformador ao pórtico */}
      {PHASES_Z.map((z) => (
        <Rod key={z} a={[-10.3, 1.95, -0.6 + z * 0.78]} b={[GANTRY_X, WIRE_Y, z]} r={0.022} color={PALETTE.wire} castShadow={false} />
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ equipamentos de automação
const ControlBox: React.FC<{ x: number; scale: number; frame: number }> = ({ x, scale, frame }) => {
  if (scale < 0.001) return null;
  const sensor = track("sensors.pulse", frame);
  return (
    <group position={[x, 0, 0]} scale={scale}>
      <mesh position={[0, 1.85, 0.2]} castShadow>
        <boxGeometry args={[0.32, 0.42, 0.18]} />
        <meshStandardMaterial {...METAL} color="#d4d9de" />
      </mesh>
      <mesh position={[0.1, 2.3, 0.28]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
        <meshStandardMaterial {...METAL} color={PALETTE.metalDark} />
      </mesh>
      <Glow p={[0.1, 2.56, 0.28]} r={0.05 + 0.04 * sensor * pulse(frame, 16)} color={PALETTE.radio} opacity={0.25 + 0.75 * sensor} />
    </group>
  );
};

const Recloser: React.FC<{ frame: number }> = ({ frame }) => {
  const k = clamp(track("recloser.install", frame), 0, 1.25);
  if (k < 0.001) return null;
  const open = clamp(track("recloser.open", frame), 0, 1);
  const lock = clamp(track("recloser.lock", frame), 0, 1);
  const drop = (1 - clamp(k, 0, 1)) * 1.4;
  const led = open > 0.5 || lock > 0.5 ? PALETTE.negative : PALETTE.positive;
  const [x, y, z] = POINTS.recloser;
  return (
    <group>
      <group position={[x, y + drop, z]} scale={k}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.62, 10]} />
          <meshStandardMaterial {...METAL} color="#b4bcc5" />
        </mesh>
        {[-0.2, 0.2].map((dx) => (
          <mesh key={dx} position={[dx, 0.26, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.06, 0.3, 6]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.insulator} />
          </mesh>
        ))}
        {/* indicador do contato: barra que levanta quando abre */}
        <mesh position={[-0.2, 0.43, 0]} rotation={[0, 0, open * 0.9]}>
          <boxGeometry args={[0.42, 0.04, 0.04]} />
          <meshStandardMaterial {...METAL} color="#e2c06a" />
        </mesh>
        <Glow p={[0, 0, 0.22]} r={0.07} color={led} opacity={1} />
        <Glow p={[0, 0, 0.22]} r={0.16} color={led} opacity={0.35} />
      </group>
      <ControlBox x={x} scale={clamp(k, 0, 1)} frame={frame} />
    </group>
  );
};

/** Chave de lâmina no topo do poste: `open` 0→1 levanta a lâmina 70°. */
const BladeSwitch: React.FC<{ x: number; scale: number; open: number; ring?: number; ringColor?: string; frame: number }> = ({ x, scale, open, ring = 0, ringColor = PALETTE.warning, frame }) => {
  if (scale < 0.001) return null;
  return (
    <group>
      <group position={[x, WIRE_Y + 0.38, 0]} scale={scale}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.07, 0.12]} />
          <meshStandardMaterial {...METAL} color={PALETTE.metal} />
        </mesh>
        {[-0.28, 0.28].map((dx) => (
          <mesh key={dx} position={[dx, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.055, 0.22, 6]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.insulator} />
          </mesh>
        ))}
        <group position={[-0.28, 0.27, 0]} rotation={[0, 0, clamp(open, 0, 1.1) * 1.22]}>
          <mesh position={[0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.58, 0.045, 0.06]} />
            <meshStandardMaterial {...METAL} color="#e2c06a" emissive="#e2c06a" emissiveIntensity={0.15} />
          </mesh>
        </group>
        {ring > 0.01 ? (
          <mesh position={[0, 0.2, 0]} scale={ring * (1 + 0.08 * pulse(frame, 20))}>
            <torusGeometry args={[0.55, 0.035, 8, 32]} />
            <meshBasicMaterial color={ringColor} toneMapped={false} />
          </mesh>
        ) : null}
      </group>
      <ControlBox x={x} scale={clamp(scale, 0, 1)} frame={frame} />
    </group>
  );
};

// ------------------------------------------------------------------ árvores, galho, faíscas
const StreetTree: React.FC<{ frame: number }> = ({ frame }) => {
  const sway = track("streetTree.sway", frame);
  const swing = sway > 0 && sway < 1 ? Math.sin(frame / 3) * 0.05 * Math.sin(sway * Math.PI) : 0;
  return (
    <group position={[-1.2, 0, 1.55]} rotation={[swing, 0, swing * 0.6]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 2.4, 6]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.trunk} />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <icosahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.leaves} />
      </mesh>
      <mesh position={[0.4, 2.55, 0.25]} castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.leavesDark} />
      </mesh>
    </group>
  );
};

const PIVOT: Vec3 = [-1.25, 3.25, 1.2];
const REST_DIR = new Vector3(0.15, 1, 0.35).normalize();
const TOUCH_DIR = new Vector3(POINTS.branchTouch[0] - PIVOT[0], POINTS.branchTouch[1] - PIVOT[1], POINTS.branchTouch[2] - PIVOT[2]).normalize();
const GROUND_DIR = new Vector3(1, 0.02, 0.25).normalize();
const BRANCH_LEN = Math.hypot(POINTS.branchTouch[0] - PIVOT[0], POINTS.branchTouch[1] - PIVOT[1], POINTS.branchTouch[2] - PIVOT[2]);

const BranchShape: React.FC<{ base: Vec3; dir: Vector3; opacity?: number }> = ({ base, dir, opacity = 1 }) => {
  const tip: Vec3 = [base[0] + dir.x * BRANCH_LEN, base[1] + dir.y * BRANCH_LEN, base[2] + dir.z * BRANCH_LEN];
  const leafAt: Vec3 = [base[0] + dir.x * BRANCH_LEN * 0.7, base[1] + dir.y * BRANCH_LEN * 0.7, base[2] + dir.z * BRANCH_LEN * 0.7];
  return (
    <group>
      <Rod a={base} b={tip} r={0.045} color={PALETTE.trunk} opacity={opacity} />
      <mesh position={leafAt}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.leaves} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
};

const Branch: React.FC<{ frame: number }> = ({ frame }) => {
  const drop = clamp(track("branch.drop", frame), 0, 1);
  const fall = clamp(track("branch.fall", frame), 0, 1.15);
  const ghost = clamp(track("branchGhost.touch", frame), 0, 1);
  const dir = REST_DIR.clone().lerp(TOUCH_DIR, drop).normalize();
  const f = clamp(fall, 0, 1);
  const base: Vec3 = [lerp(PIVOT[0], -1.9, f), lerp(PIVOT[1], 0.1 + Math.max(0, fall - 1) * 0.6, f), lerp(PIVOT[2], 0.75, f)];
  const d = f > 0 ? dir.clone().lerp(GROUND_DIR, f).normalize() : dir;
  return (
    <group>
      <BranchShape base={base} dir={d} />
      {ghost > 0.01 ? <BranchShape base={PIVOT} dir={REST_DIR.clone().lerp(TOUCH_DIR, ghost).normalize()} opacity={0.42} /> : null}
    </group>
  );
};

const Sparks: React.FC<{ p: Vec3; k: number; frame: number; seed: string }> = ({ p, k, frame, seed }) => {
  if (k < 0.02) return null;
  const items = Array.from({ length: 16 }, (_, i) => {
    const period = 9 + (i % 4);
    const age = ((frame + i * 3) % period) / period;
    const cycle = Math.floor((frame + i * 3) / period);
    const dx = rand(`${seed}x${i}-${cycle}`) * 2 - 1;
    const dy = rand(`${seed}y${i}-${cycle}`) * 1.2 - 0.2;
    const dz = rand(`${seed}z${i}-${cycle}`) * 2 - 1;
    const r = 0.55 * age;
    const pos: Vec3 = [p[0] + dx * r, p[1] + dy * r - 0.5 * age * age, p[2] + dz * r];
    return { pos, size: 0.045 * (1 - age) * k, hot: i % 3 === 0 };
  });
  const flicker = 0.65 + 0.35 * rand(`${seed}f${frame}`);
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos}>
          <sphereGeometry args={[Math.max(0.002, it.size), 6, 4]} />
          <meshBasicMaterial color={it.hot ? "#fff3a6" : PALETTE.spark} toneMapped={false} />
        </mesh>
      ))}
      <Glow p={p} r={0.32 * k * flicker} color="#ff7a3a" opacity={0.5 * k} />
      <Glow p={p} r={0.12 * k} color="#fff7c2" opacity={0.95 * k} />
    </group>
  );
};

const BigTree: React.FC<{ frame: number }> = ({ frame }) => {
  const fall = clamp(track("tree.fall", frame), 0, 1);
  return (
    <group position={[2, 0, 1.75]} rotation={[-0.4 * fall, 0, 0.04 * fall]}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 3.4, 7]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.trunk} />
      </mesh>
      <mesh position={[0, 3.95, 0]} castShadow>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.leavesDark} />
      </mesh>
      <mesh position={[0.55, 3.45, 0.3]} castShadow>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.leaves} />
      </mesh>
      <mesh position={[-0.5, 3.6, -0.2]} castShadow>
        <icosahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.leaves} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ circuito vizinho, centro de operação, rádio
const NeighborSub: React.FC = () => (
  <group position={[13.4, 0, -0.2]}>
    <mesh position={[0, 0.06, 0]}>
      <boxGeometry args={[1.8, 0.12, 2.4]} />
      <meshStandardMaterial {...MATTE} color="#8f8b84" />
    </mesh>
    <mesh position={[0.2, 0.75, -0.3]} castShadow>
      <boxGeometry args={[0.9, 1.2, 0.9]} />
      <meshStandardMaterial {...METAL} color={PALETTE.substation} />
    </mesh>
    {[-0.6, 0.6].map((dz) => (
      <mesh key={dz} position={[-0.8, 2.2, dz + 0.2]} castShadow>
        <boxGeometry args={[0.12, 4.4, 0.12]} />
        <meshStandardMaterial {...METAL} color={PALETTE.metal} />
      </mesh>
    ))}
  </group>
);

const OperationCenter: React.FC<{ frame: number }> = ({ frame }) => {
  const screen = clamp(track("cod.screen", frame), 0, 1);
  return (
    <group>
      <mesh position={[-1, 0.9, -12]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.8, 2.4]} />
        <meshStandardMaterial {...MATTE} color="#e9edf2" />
      </mesh>
      <mesh position={[-1, 1.86, -12]} castShadow>
        <boxGeometry args={[4.2, 0.12, 2.6]} />
        <meshStandardMaterial {...MATTE} color="#55606e" />
      </mesh>
      <mesh position={[POINTS.codScreen[0], POINTS.codScreen[1], POINTS.codScreen[2]]}>
        <boxGeometry args={[2.4, 1.2, 0.02]} />
        <meshStandardMaterial {...MATTE} color={interpolateColors(screen, [0, 1], ["#1b2430", "#0f2a44"])} emissive="#2a7fd0" emissiveIntensity={screen * 0.6} />
      </mesh>
      <mesh position={[-0.2, 3.1, -12]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.5, 6]} />
        <meshStandardMaterial {...METAL} color={PALETTE.metal} />
      </mesh>
      <mesh position={[-0.2, 4.0, -11.85]} rotation={[0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.05, 0.12, 12]} />
        <meshStandardMaterial {...METAL} color="#dfe5ea" />
      </mesh>
    </group>
  );
};

const RadioLinks: React.FC<{ frame: number; k: number; sources: number[] }> = ({ frame, k, sources }) => {
  if (k < 0.01) return null;
  const dst = POINTS.codAntenna;
  return (
    <group>
      {sources.map((x) => {
        const src = deviceAntenna(x);
        return (
          <group key={x}>
            {[0, 0.5].map((ph) => {
              const age = (frame / 36 + ph) % 1;
              return (
                <mesh key={ph} position={src} rotation={[Math.PI / 2, 0, 0]} scale={0.2 + age * 1.1}>
                  <torusGeometry args={[0.5, 0.025, 6, 28]} />
                  <meshBasicMaterial color={PALETTE.radio} transparent opacity={(1 - age) * k * 0.9} depthWrite={false} toneMapped={false} />
                </mesh>
              );
            })}
            {[0, 1, 2, 3, 4].map((i) => {
              const t = (frame / 50 + i / 5 + x * 0.07) % 1;
              const pos: Vec3 = [lerp(src[0], dst[0], t), lerp(src[1], dst[1], t) + Math.sin(t * Math.PI) * 2.2, lerp(src[2], dst[2], t)];
              return (
                <mesh key={i} position={pos}>
                  <sphereGeometry args={[0.07 * k, 8, 6]} />
                  <meshBasicMaterial color={PALETTE.radio} toneMapped={false} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

const Truck: React.FC<{ frame: number }> = ({ frame }) => {
  const x = track("truck.x", frame, 12);
  const boom = clamp(track("truck.boom", frame), 0, 1);
  const wheel = -(12 - x) / 0.22;
  const arm = 0.25 + boom * 0.75;
  const armLen = 2.9;
  const pivot: Vec3 = [x + 0.9, 1.15, 2.5];
  const tip: Vec3 = [pivot[0] - Math.cos(arm) * armLen * 0.55, pivot[1] + Math.sin(arm) * armLen, pivot[2] - boom * 1.3];
  return (
    <group>
      <group position={[x, 0, 2.6]}>
        <mesh position={[0.3, 0.6, 0]} castShadow>
          <boxGeometry args={[2.3, 0.55, 1.0]} />
          <meshStandardMaterial {...MATTE} color="#f2f2ee" />
        </mesh>
        <mesh position={[-1.05, 0.85, 0]} castShadow>
          <boxGeometry args={[0.85, 0.95, 1.0]} />
          <meshStandardMaterial {...MATTE} color="#f4a21c" />
        </mesh>
        <mesh position={[-1.3, 1.0, 0]}>
          <boxGeometry args={[0.36, 0.38, 1.02]} />
          <meshStandardMaterial {...MATTE} color="#22324a" />
        </mesh>
        {[-1.0, 0.9].map((wx) =>
          [-0.5, 0.5].map((wz) => (
            <mesh key={`${wx}${wz}`} position={[wx, 0.22, wz]} rotation={[Math.PI / 2, 0, wheel]}>
              <cylinderGeometry args={[0.22, 0.22, 0.14, 10]} />
              <meshStandardMaterial {...MATTE} color="#1d1f24" />
            </mesh>
          )),
        )}
      </group>
      <Rod a={pivot} b={tip} r={0.07} color="#f4a21c" />
      <mesh position={[tip[0], tip[1] + 0.15, tip[2]]} castShadow>
        <boxGeometry args={[0.5, 0.45, 0.5]} />
        <meshStandardMaterial {...MATTE} color="#f2f2ee" />
      </mesh>
      {/* técnico (silhueta low-poly) */}
      <mesh position={[tip[0], tip[1] + 0.55, tip[2]]} castShadow>
        <capsuleGeometry args={[0.11, 0.22, 4, 8]} />
        <meshStandardMaterial {...MATTE} color="#2c6bc9" />
      </mesh>
      <mesh position={[tip[0], tip[1] + 0.82, tip[2]]} castShadow>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial {...MATTE} color="#ffd23f" />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ mundo
export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const sagC = clamp(track("tree.fall", frame), 0, 1) * 0.55;
  const look: WireLook = {
    frame,
    heat: clamp(track("wire.heat", frame), 0, 1),
    tint: clamp(track("segments.tint", frame), 0, 1),
    dark: clamp(track("segHighlight.dark", frame), 0, 1),
    sagC,
  };
  const scan = track("segD.scan", frame);
  const scanX = lerp(3.1, 6.9, clamp(scan, 0, 1));
  const tieClosed = clamp(track("tieSwitch.closed", frame), 0, 1.1);
  const tieRing = clamp(track("tieSwitch.ring", frame), 0, 1.2);
  const radio = clamp(track("radio.waves", frame), 0, 1);
  const recloserIn = track("recloser.install", frame) > 0.5;
  const sw1 = clamp(track("switch1.install", frame), 0, 1.25);
  const sw2 = clamp(track("switch2.install", frame), 0, 1.25);
  const sources = [recloserIn ? -3 : null, sw1 > 0.5 ? 1 : null, sw2 > 0.5 ? 3 : null, 7].filter((v): v is number => v !== null);
  const ghost = clamp(track("branchGhost.touch", frame), 0, 1);
  const recloserOpen = clamp(track("recloser.open", frame), 0, 1);
  return (
    <group>
      <Ground />
      <Substation frame={frame} />
      {POLES_X.map((x, i) => (
        <Pole key={x} x={x} transformer={i % 2 === 1} />
      ))}
      {NEIGHBOR_POLES_X.map((x) => (
        <Pole key={x} x={x} />
      ))}
      <NeighborSub />
      <Wires look={look} />
      <EnergyFlow frame={frame} sagC={sagC} />
      {HOUSES.map((h) => {
        const lit = segPower(segOf(h.x), frame) * (h.i === 2 ? track("bulb.glow", frame, 1) : 1);
        return (
          <group key={h.x}>
            <House x={h.x} i={h.i} lit={lit} frame={frame} />
            <ServiceDrop x={h.x} />
          </group>
        );
      })}
      <House3Details frame={frame} lit={segPower("B", frame)} />
      <StreetTree frame={frame} />
      <Branch frame={frame} />
      <BigTree frame={frame} />
      <Sparks p={POINTS.branchTouch} k={clamp(track("arc.fault", frame), 0, 1.2)} frame={frame} seed="arc1" />
      <Sparks p={POINTS.branchTouch} k={ghost > 0.85 ? (1 - recloserOpen) * 0.8 : 0} frame={frame} seed="arcg" />
      <Sparks p={POINTS.treeTouch} k={clamp(track("arc.fault2", frame), 0, 1.2)} frame={frame} seed="arc2" />
      <Recloser frame={frame} />
      <BladeSwitch x={1} scale={sw1} open={track("switch1.open", frame)} frame={frame} />
      <BladeSwitch x={3} scale={sw2} open={track("switch2.open", frame)} frame={frame} />
      <BladeSwitch x={7} scale={1} open={1 - tieClosed} ring={tieRing} ringColor={tieClosed > 0.5 ? PALETTE.positive : PALETTE.warning} frame={frame} />
      <OperationCenter frame={frame} />
      <RadioLinks frame={frame} k={radio} sources={sources} />
      {scan > 0.001 && scan < 0.999 ? <Glow p={[scanX, wireYAt(scanX) + 0.02, 0]} r={0.16} color={PALETTE.radio} opacity={0.9} /> : null}
      {isVisible("truck", frame) ? <Truck frame={frame} /> : null}
    </group>
  );
};
