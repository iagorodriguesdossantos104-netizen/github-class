import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { Cuttings } from "../components/DrillingMachine";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { pulse } from "../utils/animation";
import { AQUIFER_HIT, WELL, ZF } from "../utils/geology";
import type { SceneModule, SceneProps } from "./types";

// 00:10 — Água inacessível: um guia vermelho mostra a distância até o aquífero.
// A perfuratriz chega, ergue a torre e a broca desce camada por camada até alcançá-lo.

const DepthGuide: React.FC<{ frame: number }> = ({ frame }) => {
  const k = track("depthGuide", frame);
  if (k <= 0.001) return null;
  const bit = Math.min(track("drill.depth", frame), 0);
  const topY = Math.min(-0.05, bit - 0.25);
  const span = topY - (AQUIFER_HIT + 0.12);
  const dashes = [];
  for (let y = topY; y > AQUIFER_HIT + 0.3; y -= 0.22) {
    dashes.push(
      <mesh key={y.toFixed(2)} position={[WELL.x, y - 0.06, ZF + 0.1]}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <meshBasicMaterial color={PALETTE.negative} transparent opacity={k} />
      </mesh>,
    );
  }
  const ring = 1 + 0.18 * pulse(frame, 16);
  return (
    <group>
      {span > 0.1 ? dashes : null}
      <mesh position={[WELL.x, AQUIFER_HIT + 0.2, ZF + 0.1]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.13, 0.22, 8]} />
        <meshBasicMaterial color={PALETTE.negative} transparent opacity={k} />
      </mesh>
      <mesh position={[WELL.x, AQUIFER_HIT, ZF + 0.1]} rotation={[Math.PI / 2, 0, 0]} scale={ring}>
        <torusGeometry args={[0.32, 0.035, 6, 24]} />
        <meshBasicMaterial color={PALETTE.waterBright} transparent opacity={k} />
      </mesh>
    </group>
  );
};

const Stage: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  return (
    <>
      <DepthGuide frame={frame} />
      <Cuttings frame={frame} depthAt={(g) => track("drill.depth", g)} activeAt={(g) => track("drill.active", g)} />
    </>
  );
};

const Overlay: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const k = track("depthGuide", frame);
  return <WorldLabel pose={cameraPoseAt(frame)} point={[WELL.x + 0.34, AQUIFER_HIT, ZF + 0.1]} text="AQUÍFERO" appear={k} offset={[200, -70]} accent={PALETTE.waterBright} size={34} />;
};

export const DrillingScene: SceneModule = { Stage, Overlay };
