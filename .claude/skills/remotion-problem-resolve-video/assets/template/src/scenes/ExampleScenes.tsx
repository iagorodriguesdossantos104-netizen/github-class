import { useCurrentFrame } from "remotion";
import { Arrow3D } from "../components/Arrow3D";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, progress } from "../utils/animation";
import { s } from "../utils/timing";
import type { SceneModule, SceneProps } from "./types";

// Cada cena pode ter extras 3D (Stage, dentro do canvas do diorama) e uma camada 2D (Overlay).
// useCurrentFrame() aqui é LOCAL à cena; some scene.startFrame para ler trilhas globais.

const GanchoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const local = useCurrentFrame();
  const frame = local + scene.startFrame;
  const appear = progress(local, s(1.2), s(1.6));
  return <WorldLabel pose={cameraPoseAt(frame)} point={[0, 1.4, 0.5]} text="MECANISMO" appear={appear} offset={[180, -120]} />;
};

const SolucaoStage: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const k = clamp(track("subject.glow", frame) * 1.2, 0, 1);
  return <Arrow3D from={[-1.6, 0.75, 0.5]} dir={[1, 0, 0]} length={0.8} color={PALETTE.positive} scale={k} />;
};

export const GanchoScene: SceneModule = { Overlay: GanchoOverlay };
export const SolucaoScene: SceneModule = { Stage: SolucaoStage };
