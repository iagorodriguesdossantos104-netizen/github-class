import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { clamp } from "../utils/animation";
import { layer, ZF, type LayerId } from "../utils/geology";
import type { SceneModule, SceneProps } from "./types";

// 00:05 — A câmera desce pelo corte; as camadas se afastam um pouco e o aquífero se destaca.
// Rótulos nomeiam cada camada enquanto a vista está "explodida".

const LABELS: { id: LayerId; y: number; text: string; color: string }[] = [
  { id: "topsoil", y: -0.18, text: "SOLO", color: layer("topsoil").color },
  { id: "sediment", y: -0.8, text: "SEDIMENTOS", color: layer("sediment").color },
  { id: "clay", y: -1.9, text: "ARGILA", color: layer("clay").color },
  { id: "aquifer", y: -3.15, text: "AQUÍFERO", color: "#53d6ff" },
  { id: "bedrock", y: -5.0, text: "ROCHA", color: "#b9c1cb" },
];

const Overlay: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const appear = track("layers.labels", frame);
  const explode = track("layers.explode", frame);
  if (appear <= 0.001) return null;
  const pose = cameraPoseAt(frame);
  return (
    <>
      {LABELS.map((l, i) => {
        const off = layer(l.id).explode;
        return (
          <WorldLabel
            key={l.id}
            pose={pose}
            point={[0.05, l.y + explode * off[0], ZF + explode * off[1]]}
            text={l.text}
            appear={clamp(appear * 1.6 - i * 0.15, 0, 1)}
            offset={[-230, 0]}
            accent={l.color}
            size={l.id === "aquifer" ? 38 : 32}
          />
        );
      })}
    </>
  );
};

export const AquiferScene: SceneModule = { Overlay };
