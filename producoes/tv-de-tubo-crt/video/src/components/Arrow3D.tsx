import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import type { Vec3 } from "../utils/animation";

// Seta volumétrica (haste + ponta) apontando de `from` na direção `dir`.
// Use para força, pressão, fluxo, calor — sempre explicando algo, nunca só decorando.
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
