import type { ScenePlan } from "../data/scenes";

/** Cada cena fornece extras 3D (dentro do canvas do diorama) e/ou uma camada 2D. */
export type SceneProps = { scene: ScenePlan };

export type SceneModule = {
  Stage?: React.FC<SceneProps>;
  Overlay?: React.FC<SceneProps>;
};
