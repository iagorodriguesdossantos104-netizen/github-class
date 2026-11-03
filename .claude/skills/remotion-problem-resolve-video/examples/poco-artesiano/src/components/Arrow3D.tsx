import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { aquiferBottomAt, aquiferTopAt, ZF } from "../utils/geology";

// Seta volumétrica (haste + ponta) apontando de `from` na direção `dir`.
export const Arrow3D: React.FC<{ from: Vec3; dir: Vec3; length: number; radius?: number; color: string; scale?: number; emissive?: number }> = ({
  from,
  dir,
  length,
  radius = 0.07,
  color,
  scale = 1,
  emissive = 0.35,
}) => {
  const q = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...dir).normalize()), [dir]);
  if (scale <= 0.001) return null;
  const head = radius * 3.2;
  const shaft = Math.max(0.01, length - head);
  return (
    <group position={from} quaternion={q} scale={scale}>
      <mesh position={[0, shaft / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, shaft, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]} castShadow>
        <coneGeometry args={[radius * 2.3, head, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.5} flatShading />
      </mesh>
    </group>
  );
};

const mid = (x: number) => (aquiferTopAt(x) + aquiferBottomAt(x)) / 2;

/** Setas de pressão: a água empurra a camada de cima e escoa pelo aquífero rumo ao poço. */
export const PressureArrows: React.FC<{ amount: number; frame: number }> = ({ amount, frame }) => {
  if (amount <= 0.001) return null;
  const up = [-2.2, -1.1, 0.0].map((x) => ({ x, y: aquiferTopAt(x) - 0.92 }));
  const along = [-3.7, -2.75].map((x) => ({ x, y: mid(x), dy: mid(x + 0.5) - mid(x) }));
  return (
    <group>
      {up.map((a, i) => {
        const k = clamp(amount * 1.15 - i * 0.12, 0, 1.2);
        const beat = 1 + 0.08 * Math.sin(frame / 4 + i);
        return <Arrow3D key={`u${i}`} from={[a.x, a.y, ZF + 0.28]} dir={[0, 1, 0]} length={0.78} radius={0.06} color={PALETTE.water} scale={k * beat} emissive={0.5} />;
      })}
      {along.map((a, i) => {
        const k = clamp(amount * 1.15 - 0.2 - i * 0.12, 0, 1.2);
        return <Arrow3D key={`a${i}`} from={[a.x, a.y, ZF + 0.28]} dir={[0.5, a.dy, 0]} length={0.85} radius={0.06} color={PALETTE.waterBright} scale={k} emissive={0.5} />;
      })}
    </group>
  );
};
