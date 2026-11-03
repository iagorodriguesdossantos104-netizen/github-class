import { MATTE, PALETTE } from "../theme";
import { clamp, rand, randRange } from "../utils/animation";
import { surfaceAt, X0, X1, Z0, ZF } from "../utils/geology";

// Vegetação de terreno seco (árvores de copa rala, mandacarus, arbustos e tufos de capim).

type Kind = "tree" | "cactus" | "bush" | "rock";
const ITEMS: { kind: Kind; x: number; z: number; s: number }[] = [
  { kind: "tree", x: -0.35, z: -1.45, s: 1.05 },
  { kind: "tree", x: -4.3, z: -1.0, s: 0.95 },
  { kind: "tree", x: 4.72, z: 1.55, s: 0.85 },
  { kind: "cactus", x: -0.05, z: 1.35, s: 0.9 },
  { kind: "cactus", x: -3.05, z: 0.9, s: 0.8 },
  { kind: "cactus", x: 4.55, z: -1.75, s: 0.75 },
  { kind: "bush", x: -1.65, z: 1.55, s: 1 },
  { kind: "bush", x: 1.95, z: -1.8, s: 0.9 },
  { kind: "bush", x: -4.7, z: 1.5, s: 0.85 },
  { kind: "bush", x: 4.25, z: 1.9, s: 0.8 },
  { kind: "rock", x: -2.2, z: -1.6, s: 1 },
  { kind: "rock", x: -4.8, z: -1.85, s: 0.8 },
  { kind: "rock", x: 0.35, z: -0.6, s: 0.7 },
];

const Tree: React.FC<{ s: number }> = ({ s }) => (
  <group scale={s}>
    <mesh position={[0, 0.32, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.08, 0.64, 6]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.trunk} />
    </mesh>
    <mesh position={[0, 0.82, 0]} castShadow>
      <icosahedronGeometry args={[0.38, 0]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.foliage} />
    </mesh>
    <mesh position={[0.22, 0.7, 0.1]} castShadow>
      <icosahedronGeometry args={[0.24, 0]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.foliageDark} />
    </mesh>
    <mesh position={[-0.2, 0.74, -0.08]} castShadow>
      <icosahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.foliage} />
    </mesh>
  </group>
);

const Cactus: React.FC<{ s: number }> = ({ s }) => (
  <group scale={s}>
    <mesh position={[0, 0.38, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.08, 0.76, 6]} />
      <meshStandardMaterial {...MATTE} color="#5f8a45" />
    </mesh>
    <mesh position={[0.13, 0.42, 0]} castShadow>
      <cylinderGeometry args={[0.045, 0.045, 0.26, 6]} />
      <meshStandardMaterial {...MATTE} color="#5f8a45" />
    </mesh>
    <mesh position={[0.08, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.04, 0.04, 0.14, 6]} />
      <meshStandardMaterial {...MATTE} color="#5f8a45" />
    </mesh>
    <mesh position={[-0.12, 0.52, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 0.22, 6]} />
      <meshStandardMaterial {...MATTE} color="#5f8a45" />
    </mesh>
    <mesh position={[-0.07, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.035, 0.035, 0.12, 6]} />
      <meshStandardMaterial {...MATTE} color="#5f8a45" />
    </mesh>
  </group>
);

const Bush: React.FC<{ s: number }> = ({ s }) => (
  <group scale={s}>
    <mesh position={[0, 0.12, 0]} castShadow>
      <icosahedronGeometry args={[0.17, 0]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.foliageDark} />
    </mesh>
    <mesh position={[0.15, 0.09, 0.05]} castShadow>
      <icosahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.foliage} />
    </mesh>
  </group>
);

const Rock: React.FC<{ s: number }> = ({ s }) => (
  <mesh position={[0, 0.06 * s, 0]} scale={[0.2 * s, 0.13 * s, 0.16 * s]} rotation={[0.3, 0.8, 0]} castShadow>
    <dodecahedronGeometry args={[1, 0]} />
    <meshStandardMaterial {...MATTE} color={PALETTE.rock} />
  </mesh>
);

const KIND: Record<Kind, React.FC<{ s: number }>> = { tree: Tree, cactus: Cactus, bush: Bush, rock: Rock };

// Áreas onde não nasce capim: casa, caixa d'água, caminhão e boca do poço.
const blocked = (x: number, z: number) =>
  (x > 3.1 && x < 4.8 && z > -1.3 && z < 0.2) || (x > 2.0 && x < 3.1 && z > -1.8 && z < -0.6) || (x > 0.5 && x < 3.8 && z > 0.8) || (Math.abs(x - 0.9) < 0.6 && z > 1.5);

const TUFTS = Array.from({ length: 70 }, (_, i) => {
  const x = randRange(`tuft-x-${i}`, X0 + 0.15, X1 - 0.15);
  const z = randRange(`tuft-z-${i}`, Z0 + 0.15, ZF - 0.15);
  return { x, z, h: randRange(`tuft-h-${i}`, 0.07, 0.14), r: rand(`tuft-r-${i}`) * 3, ok: !blocked(x, z) };
}).filter((t) => t.ok);

/** `scaleAt(i)` devolve a escala de entrada (spring) de cada item, com atraso escalonado. */
export const Vegetation: React.FC<{ scaleAt: (index: number) => number }> = ({ scaleAt }) => (
  <group>
    {ITEMS.map((it, i) => {
      const sc = clamp(scaleAt(i), 0, 2);
      if (sc <= 0.001) return null;
      const C = KIND[it.kind];
      return (
        <group key={i} position={[it.x, surfaceAt(it.x), it.z]} scale={sc} rotation={[0, i * 1.7, 0]}>
          <C s={it.s} />
        </group>
      );
    })}
    {TUFTS.map((t, i) => {
      const sc = clamp(scaleAt(ITEMS.length + (i % 6)), 0, 2);
      if (sc <= 0.001) return null;
      return (
        <mesh key={`t${i}`} position={[t.x, surfaceAt(t.x) + (t.h * sc) / 2, t.z]} rotation={[0, t.r, 0]} scale={[sc, sc, sc]}>
          <coneGeometry args={[0.05, t.h, 4]} />
          <meshStandardMaterial {...MATTE} color={i % 3 ? PALETTE.grassDark : "#b9a35c"} />
        </mesh>
      );
    })}
  </group>
);
