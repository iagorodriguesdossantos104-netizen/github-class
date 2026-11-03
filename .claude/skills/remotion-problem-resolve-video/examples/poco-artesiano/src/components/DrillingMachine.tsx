import { useMemo } from "react";
import { TetrahedronGeometry } from "three";
import { MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, randRange } from "../utils/animation";
import { LAYERS, evalPoly, SITE, WELL, ZF } from "../utils/geology";

// Perfuratriz estilizada montada em caminhão. A torre se ergue, a cabeça rotativa desce pela
// torre e a broca atravessa as camadas; cascalho da camada atual voa do furo.

const PIVOT: [number, number, number] = [1.3, 1.18, SITE.rig.mastZ];
const MAST_LEN = 3.25;
const STRING_Z = ZF - 0.03;

export type RigState = {
  /** 0 = fora de cena, 1 = estacionada (pode passar de 1 no quique da chegada). */
  drop: number;
  /** 0 = torre deitada, 1 = de pé. */
  mast: number;
  /** y da ponta da broca (≤ 0). */
  depth: number;
  /** 0→1 retirada da coluna de perfuração. */
  retract: number;
  /** ângulo acumulado de rotação da broca. */
  spin: number;
};

const Box: React.FC<{ p: [number, number, number]; s: [number, number, number]; c: string; metal?: boolean }> = ({ p, s, c, metal }) => (
  <mesh position={p} castShadow receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial {...(metal ? METAL : MATTE)} color={c} />
  </mesh>
);

const Wheel: React.FC<{ p: [number, number, number] }> = ({ p }) => (
  <group position={p} rotation={[Math.PI / 2, 0, 0]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.22, 0.22, 0.16, 10]} />
      <meshStandardMaterial {...MATTE} color="#1c2127" />
    </mesh>
    <mesh>
      <cylinderGeometry args={[0.11, 0.11, 0.17, 8]} />
      <meshStandardMaterial {...METAL} color={PALETTE.pipe} />
    </mesh>
  </group>
);

const Truck: React.FC = () => (
  <group>
    <Box p={[2.42, 0.38, 1.45]} s={[2.4, 0.16, 0.9]} c={PALETTE.rigDark} />
    {[1.6, 2.15, 3.25].flatMap((x) => [0.98, 1.92].map((z) => <Wheel key={`${x}-${z}`} p={[x, 0.22, z]} />))}
    {/* cabine */}
    <Box p={[3.31, 0.79, 1.45]} s={[0.62, 0.66, 0.86]} c={PALETTE.rig} />
    <Box p={[3.63, 0.88, 1.45]} s={[0.02, 0.3, 0.7]} c="#2c4a63" />
    <Box p={[3.33, 0.9, 1.885]} s={[0.4, 0.26, 0.02]} c="#2c4a63" />
    <Box p={[3.33, 0.9, 1.015]} s={[0.4, 0.26, 0.02]} c="#2c4a63" />
    {/* compressor / motor */}
    <Box p={[2.38, 0.69, 1.45]} s={[0.96, 0.46, 0.8]} c={PALETTE.rig} />
    <Box p={[2.38, 0.69, 1.86]} s={[0.8, 0.06, 0.02]} c={PALETTE.rigDark} />
    <Box p={[2.38, 0.79, 1.86]} s={[0.8, 0.06, 0.02]} c={PALETTE.rigDark} />
    {/* base da torre e sapatas */}
    <Box p={[1.45, 0.75, 1.62]} s={[0.36, 0.7, 0.62]} c={PALETTE.rigDark} />
    <Box p={[1.3, 0.12, 1.02]} s={[0.12, 0.24, 0.12]} c={PALETTE.pipeDark} metal />
    <Box p={[1.3, 0.12, 1.98]} s={[0.12, 0.24, 0.12]} c={PALETTE.pipeDark} metal />
  </group>
);

/** Torre (mastro treliçado) no referencial do pivô: cresce para +y quando de pé. */
const Mast: React.FC<{ carriageY: number }> = ({ carriageY }) => (
  <group>
    {[-0.11, 0.11].map((z) => (
      <Box key={z} p={[0, MAST_LEN / 2, z]} s={[0.07, MAST_LEN, 0.07]} c={PALETTE.rig} />
    ))}
    {Array.from({ length: 9 }, (_, i) => (
      <Box key={i} p={[0, 0.2 + i * 0.36, 0]} s={[0.05, 0.05, 0.22]} c={PALETTE.rig} />
    ))}
    <Box p={[0, MAST_LEN + 0.06, 0]} s={[0.22, 0.12, 0.34]} c={PALETTE.rigDark} />
    {/* cabeça rotativa com braço até a coluna de perfuração */}
    <group position={[0, carriageY, 0]}>
      <Box p={[0, 0, 0]} s={[0.2, 0.3, 0.32]} c={PALETTE.rigDark} />
      <Box p={[(WELL.x - PIVOT[0]) / 2, 0, (STRING_Z - PIVOT[2]) / 2]} s={[Math.abs(WELL.x - PIVOT[0]) + 0.1, 0.12, 0.14]} c={PALETTE.rigDark} />
      <Box p={[WELL.x - PIVOT[0], 0, STRING_Z - PIVOT[2]]} s={[0.22, 0.26, 0.22]} c={PALETTE.pipeDark} metal />
    </group>
  </group>
);

const chipGeo = new TetrahedronGeometry(1, 0);

const layerColorAt = (y: number) => {
  for (const l of LAYERS) {
    if (y <= evalPoly(l.top, WELL.x) + 0.01 && y >= evalPoly(l.bottom, WELL.x) - 0.01) return l.color;
  }
  return PALETTE.bedrock;
};

/** Cascalho expelido pela broca (determinístico: cada lasca nasce num frame e segue uma parábola). */
export const Cuttings: React.FC<{ frame: number; depthAt: (frame: number) => number; activeAt: (frame: number) => number }> = ({ frame, depthAt, activeAt }) => {
  const chips = [];
  for (let sf = frame - 16; sf <= frame; sf++) {
    if (activeAt(sf) < 0.5) continue;
    const d0 = depthAt(sf - 1);
    const d1 = depthAt(sf);
    if (Math.abs(d1 - d0) < 1e-4) continue;
    for (let k = 0; k < 3; k++) {
      const seed = `chip-${sf}-${k}`;
      const age = frame - sf;
      const vx = randRange(`${seed}x`, -0.05, 0.05);
      const vy = randRange(`${seed}y`, 0.025, 0.07);
      const vz = randRange(`${seed}z`, 0.025, 0.06);
      const p: [number, number, number] = [WELL.x + vx * age, d1 + 0.15 + vy * age - 0.0045 * age * age, STRING_Z + 0.06 + vz * age];
      const r = randRange(`${seed}r`, 0.03, 0.055) * clamp((17 - age) / 6, 0, 1);
      chips.push(
        <mesh key={seed} geometry={chipGeo} position={p} rotation={[age * 0.4 + k, age * 0.3, 0]} scale={r}>
          <meshStandardMaterial {...MATTE} color={layerColorAt(d1)} />
        </mesh>,
      );
    }
  }
  return <>{chips}</>;
};

export const DrillingMachine: React.FC<{ state: RigState }> = ({ state }) => {
  const { drop, mast, depth, retract, spin } = state;
  const entering = clamp(drop * 3, 0, 1);
  const lift = Math.max(0, 1 - drop) * 3.2;
  const squash = Math.max(0, drop - 1);
  const frac = clamp(depth / WELL.bottom, 0, 1);
  const carriageY = lerp(lerp(MAST_LEN - 0.35, 0.45, frac), MAST_LEN - 0.35, retract);
  const bitY = lerp(depth, PIVOT[1] + 0.25, retract);
  const stringTop = PIVOT[1] + carriageY;
  const upright = mast > 0.985;
  const pile = Math.sqrt(frac) * clamp(drop * 1.5, 0, 1);
  const spoil = useMemo(() => [WELL.x - 0.55, 0, ZF - 0.32] as [number, number, number], []);
  if (drop <= 0.001) return null;
  return (
    <group>
      <group position={[2.3, lift, 1.45]} scale={[entering * (1 + squash * 0.6), entering * (1 - squash * 1.4), entering * (1 + squash * 0.6)]}>
        <group position={[-2.3, 0, -1.45]}>
          <Truck />
          <group position={PIVOT} rotation={[0, 0, -(1 - mast) * (Math.PI / 2)]}>
            <Mast carriageY={carriageY} />
          </group>
        </group>
      </group>
      {upright && drop > 0.6 && retract < 0.999 ? (
        <group>
          <mesh position={[WELL.x, (stringTop + bitY + 0.3) / 2, STRING_Z]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, Math.max(0.01, stringTop - bitY - 0.3), 8]} />
            <meshStandardMaterial {...METAL} color={PALETTE.pipe} />
          </mesh>
          <group position={[WELL.x, bitY + 0.17, STRING_Z]} rotation={[0, spin, 0]}>
            <mesh rotation={[Math.PI, 0, 0]} castShadow>
              <coneGeometry args={[0.19, 0.34, 6]} />
              <meshStandardMaterial {...METAL} color="#59626d" />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.12, 0.17, 0.1, 6]} />
              <meshStandardMaterial {...METAL} color={PALETTE.rig} />
            </mesh>
          </group>
        </group>
      ) : null}
      {pile > 0.01 ? (
        <mesh position={[spoil[0], (0.16 * pile) / 2, spoil[2]]} castShadow receiveShadow>
          <coneGeometry args={[0.32 * pile, 0.16 * pile, 7]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.clay} />
        </mesh>
      ) : null}
    </group>
  );
};
