import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, rand, randRange } from "../utils/animation";
import { aquiferBottomAt, aquiferTopAt, clayTopAt, surfaceAt, ZF } from "../utils/geology";
import type { SceneModule, SceneProps } from "./types";

// 00:16 — Aquífero confinado: a chuva recarrega o aquífero onde ele aflora no morro; mais abaixo
// ele fica preso entre duas camadas pouco permeáveis (destacadas) e a água fica sob pressão (setas).

const CLOUD: [number, number, number, number][] = [
  [0, 0, 0, 0.55],
  [0.5, -0.08, 0.1, 0.42],
  [-0.5, -0.1, -0.05, 0.4],
  [0.2, 0.25, -0.1, 0.38],
  [-0.15, 0.18, 0.25, 0.34],
];

const Rain: React.FC<{ frame: number; amount: number }> = ({ frame, amount }) => {
  if (amount <= 0.001) return null;
  const drops = [];
  for (let i = 0; i < 40; i++) {
    const seed = `rain-${i}`;
    const period = randRange(`${seed}p`, 12, 17);
    const age = (rand(`${seed}o`) * period + frame) % period;
    const x = randRange(`${seed}x`, -4.95, -3.55);
    const z = randRange(`${seed}z`, -1.9, 2.0);
    const y0 = 4.4;
    const y1 = surfaceAt(x) + 0.05;
    const y = lerp(y0, y1, age / period);
    drops.push(
      <mesh key={i} position={[x, y, z]}>
        <boxGeometry args={[0.018, 0.24, 0.018]} />
        <meshBasicMaterial color="#bfeaff" transparent opacity={0.85 * amount} />
      </mesh>,
    );
  }
  // água infiltrando pelo solo até o aquífero que aflora no morro
  for (let j = 0; j < 16; j++) {
    const seed = `infil-${j}`;
    const period = randRange(`${seed}p`, 38, 52);
    const u = ((rand(`${seed}o`) * period + frame) % period) / period;
    const x = randRange(`${seed}x`, -4.9, -4.0);
    const yTop = surfaceAt(x) - 0.08;
    const yBot = lerp(aquiferTopAt(x), aquiferBottomAt(x), 0.55);
    const y = lerp(yTop, yBot, u);
    drops.push(
      <mesh key={`f${j}`} position={[x + Math.sin(u * 6 + j) * 0.04, y, ZF + 0.07]} scale={0.035 * amount * clamp(Math.min(u, 1 - u) * 8, 0, 1)}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={PALETTE.waterBright} />
      </mesh>,
    );
  }
  return (
    <group>
      <group position={[-4.25, 4.75, 0.1]} scale={amount}>
        {CLOUD.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[r * 1.25, r, r]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial {...MATTE} color="#f4f8fb" />
          </mesh>
        ))}
      </group>
      {drops}
    </group>
  );
};

const Stage: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  return <Rain frame={frame} amount={track("rain", frame)} />;
};

const Overlay: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const pose = cameraPoseAt(frame);
  const conf = track("confining.highlight", frame);
  const rech = track("recharge.label", frame);
  const x = -0.7;
  return (
    <>
      <WorldLabel pose={pose} point={[-4.35, surfaceAt(-4.35) + 0.15, ZF - 0.4]} text="RECARGA" appear={rech} offset={[170, 110]} accent={PALETTE.waterBright} />
      <WorldLabel pose={pose} point={[x, (clayTopAt(x) + aquiferTopAt(x)) / 2, ZF]} text="POUCO PERMEÁVEL" appear={conf} offset={[200, -150]} accent="#ffcf73" />
      <WorldLabel pose={pose} point={[-2.6, aquiferBottomAt(-2.6) - 0.45, ZF]} text="POUCO PERMEÁVEL" appear={clamp(conf * 1.3 - 0.3, 0, 1)} offset={[-60, 150]} accent="#ffcf73" />
    </>
  );
};

export const PressureScene: SceneModule = { Stage, Overlay };
