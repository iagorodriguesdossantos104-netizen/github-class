import { useCurrentFrame } from "remotion";
import { GroundPlane } from "../components/TerrainCrossSection";
import { isVisible, track } from "../data/scenes";
import type { SceneModule, SceneProps } from "./types";

// 00:00 — Casa no terreno seco; a câmera mergulha abaixo do chão e revela o corte subterrâneo.
// O chão contínuo ao redor encolhe enquanto a câmera desce: o "mundo" vira o diorama.

const Stage: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  if (!isVisible("groundPlane", frame)) return null;
  return <GroundPlane reveal={track("ground.reveal", frame)} />;
};

export const IntroScene: SceneModule = { Stage };
