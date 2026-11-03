import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { progress } from "../utils/animation";
import { headAt, WELL, ZF } from "../utils/geology";
import { s } from "../utils/timing";
import type { SceneModule, SceneProps } from "./types";

// 00:22 — Revestimento instalado, a água entra pelo filtro e a pressão a empurra para cima.
// A linha do nível de pressão aparece acima do solo: por isso, neste caso, a água jorra.

const Overlay: React.FC<SceneProps> = ({ scene }) => {
  const local = useCurrentFrame();
  const frame = local + scene.startFrame;
  const pose = cameraPoseAt(frame);
  const filter = progress(local, s(1.0), s(1.3)) * (1 - progress(local, s(2.6), s(2.9)));
  return (
    <>
      <WorldLabel pose={pose} point={[WELL.x - 0.13, (WELL.filterTop + WELL.filterBottom) / 2, ZF]} text="FILTRO" appear={filter} offset={[-200, -240]} accent={PALETTE.waterBright} size={34} />
      <WorldLabel pose={pose} point={[0.25, headAt(0.25), ZF + 0.3]} text="NÍVEL DA PRESSÃO" appear={track("headLine", frame)} offset={[130, -80]} accent={PALETTE.pressure} />
    </>
  );
};

export const RisingWaterScene: SceneModule = { Overlay };
