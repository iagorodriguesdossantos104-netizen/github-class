import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { track } from "../data/scenes";
import { SKY } from "../theme";
import { clamp } from "../utils/animation";

// Céu de entardecer que escurece para azul-noite quando a rede apaga (trilha "sky.dark").
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = clamp(track("sky.dark", frame), 0, 1);
  const c = SKY.dusk.map((top, i) => interpolateColors(t, [0, 1], [top, SKY.night[i]]));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 55%, ${c[2]} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 48%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 55%, rgba(4,10,22,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
