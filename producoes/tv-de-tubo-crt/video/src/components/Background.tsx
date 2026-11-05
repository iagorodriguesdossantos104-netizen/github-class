import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { track } from "../data/scenes";
import { SKY } from "../theme";
import { clamp } from "../utils/animation";

// Fundo: sala retrô em tons quentes; azul-petróleo profundo quando a câmera "entra" no tubo (bg.inside).
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = clamp(track("bg.inside", frame), 0, 1);
  const c = SKY.room.map((top, i) => interpolateColors(t, [0, 1], [top, SKY.inside[i]]));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 55%, ${c[2]} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 48%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0) 55%, rgba(2,6,12,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};
