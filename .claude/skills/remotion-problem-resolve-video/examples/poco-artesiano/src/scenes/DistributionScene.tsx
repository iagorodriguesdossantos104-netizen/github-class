import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp } from "../utils/animation";
import { WELL, ZF } from "../utils/geology";
import type { SceneModule, SceneProps } from "./types";

// 00:36 — Esquema construtivo em destaque (revestimento, selo sanitário, laje e tampa).
// Depois a câmera acompanha a tubulação: a água vai para a caixa d'água e dela para a casa.

const Overlay: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const pose = cameraPoseAt(frame);
  const casing = track("casing.highlight", frame);
  const prot = track("protection.highlight", frame);
  return (
    <>
      <WorldLabel pose={pose} point={[WELL.x + 0.1, -0.95, ZF]} text="REVESTIMENTO" appear={casing} offset={[230, 40]} accent={PALETTE.pipe} size={34} />
      <WorldLabel pose={pose} point={[WELL.x - 0.16, -1.15, ZF]} text="SELO SANITÁRIO" appear={prot} offset={[-110, -90]} accent="#ffe08a" size={34} />
      <WorldLabel pose={pose} point={[WELL.x - 0.38, 0.11, ZF - 0.05]} text="LAJE DE PROTEÇÃO" appear={clamp(prot * 1.3 - 0.3, 0, 1)} offset={[40, -110]} accent="#ffe08a" size={34} />
    </>
  );
};

export const DistributionScene: SceneModule = { Overlay };
