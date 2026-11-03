import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { SKY } from "../theme";
import { clamp } from "../utils/animation";
import { cameraPoseAt } from "./CameraController";

// Fundo atrás do diorama: céu claro com a câmera acima do solo, azul profundo quando ela mergulha.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const camY = cameraPoseAt(frame).position[1];
  const t = clamp((1.2 - camY) / 4.2, 0, 1);
  const c = SKY.surface.map((top, i) => interpolateColors(t, [0, 1], [top, SKY.underground[i]]));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 52%, ${c[2]} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 55%, rgba(4,10,22,0.32) 100%)" }} />
    </AbsoluteFill>
  );
};
