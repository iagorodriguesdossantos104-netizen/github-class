import { useMemo } from "react";
import { CatmullRomCurve3, SphereGeometry, Vector3 } from "three";
import { MATTE, METAL, PALETTE } from "../theme";
import { clamp, pulse, rand, randRange } from "../utils/animation";
import type { WellSpec } from "./ArtesianWell";

// Bomba submersa instalada abaixo do nível da água, com tubo edutor até a superfície.
// Ligada, ela eleva a água que a pressão sozinha não consegue trazer até a boca do poço.

const sphere = new SphereGeometry(1, 8, 6);

export const SubmersiblePump: React.FC<{ spec: WellSpec; pumpY: number; on: number; flow: number; frame: number }> = ({ spec, pumpY, on, flow, frame }) => {
  const r = spec.casingInner * 0.7;
  const pipeR = r * 0.42;
  const top = spec.top + 0.12;
  const { path, spoutEnd } = useMemo(() => {
    const end: [number, number, number] = [spec.x + 0.62, top - 0.02, spec.z - 0.12];
    const pts: [number, number, number][] = [
      [spec.x, pumpY + 0.26, spec.z - 0.02],
      [spec.x, top - 0.08, spec.z - 0.02],
      [spec.x + 0.12, top, spec.z - 0.05],
      [spec.x + 0.4, top, spec.z - 0.1],
      end,
    ];
    return { path: new CatmullRomCurve3(pts.map((p) => new Vector3(...p)), false, "catmullrom", 0.1), spoutEnd: end };
  }, [spec.x, spec.z, pumpY, top]);
  const glow = on * (0.5 + 0.4 * pulse(frame, 10));
  const band = (frame * 0.25 * on) % 1;
  const items = [];
  if (flow > 0.001) {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const u = (i / n + frame * 0.03) % 1;
      if (u > flow) continue;
      const p = path.getPointAt(u);
      items.push(
        <mesh key={i} geometry={sphere} position={p} scale={pipeR * 0.9}>
          <meshBasicMaterial color={PALETTE.waterBright} />
        </mesh>,
      );
    }
    // água saindo pela bica
    for (let j = 0; j < 14; j++) {
      const seed = `spout-${j}`;
      const period = randRange(`${seed}p`, 14, 20);
      const age = (rand(`${seed}o`) * period + frame) % period;
      const y = spoutEnd[1] - 0.004 * age * age;
      if (y < 0.05) continue;
      const k = clamp(flow * 1.5 - 0.5, 0, 1);
      items.push(
        <mesh key={`s${j}`} geometry={sphere} position={[spoutEnd[0] + 0.022 * age + randRange(`${seed}x`, -0.02, 0.02), y, spoutEnd[2] + randRange(`${seed}z`, -0.03, 0.03)]} scale={0.03 * k}>
          <meshBasicMaterial color={PALETTE.waterBright} />
        </mesh>,
      );
    }
  }
  return (
    <group>
      {/* tubo edutor */}
      <mesh position={[spec.x, (pumpY + 0.26 + top) / 2, spec.z - 0.02]}>
        <cylinderGeometry args={[pipeR, pipeR, top - pumpY - 0.26, 8]} />
        <meshStandardMaterial {...METAL} color={PALETTE.pipe} transparent opacity={flow > 0.001 ? 0.55 : 1} depthWrite={false} />
      </mesh>
      <mesh position={[spec.x + 0.3, top, spec.z - 0.08]} rotation={[0, 0.35, Math.PI / 2]}>
        <cylinderGeometry args={[pipeR, pipeR, 0.62, 8]} />
        <meshStandardMaterial {...METAL} color={PALETTE.pipe} transparent opacity={flow > 0.001 ? 0.55 : 1} depthWrite={false} />
      </mesh>
      {/* cabo elétrico */}
      <mesh position={[spec.x - r * 0.75, (pumpY + top) / 2, spec.z - 0.03]}>
        <boxGeometry args={[0.014, top - pumpY, 0.014]} />
        <meshStandardMaterial {...MATTE} color="#1b1f24" />
      </mesh>
      {/* corpo da bomba: motor embaixo, estágios de bombeamento em cima */}
      <group position={[spec.x, pumpY, spec.z - 0.02]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[r, r, 0.3, 10]} />
          <meshStandardMaterial {...METAL} color="#47515d" />
        </mesh>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[r * 0.92, r, 0.22, 10]} />
          <meshStandardMaterial {...METAL} color="#7d8894" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.04 + ((i / 3 + band) % 1) * 0.18, 0]}>
            <cylinderGeometry args={[r * 0.95, r * 0.95, 0.018, 10]} />
            <meshStandardMaterial {...MATTE} color="#2c333b" />
          </mesh>
        ))}
        <mesh position={[0, 0.0, 0]}>
          <cylinderGeometry args={[r * 1.04, r * 1.04, 0.035, 10]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.positive} emissive={PALETTE.positive} emissiveIntensity={glow} />
        </mesh>
      </group>
      {items}
    </group>
  );
};
