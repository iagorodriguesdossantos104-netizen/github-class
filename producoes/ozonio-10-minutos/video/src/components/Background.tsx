import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { sceneAt, track } from "../data/scenes";
import { SKY } from "../theme";
import { clamp, rand } from "../utils/animation";

// Céu: azul de meio-dia; azul-arroxeado "cru" enquanto a faixa de ozônio está fora; noite na cena 12;
// espaço com estrelas na cena do planeta.
const STARS = Array.from({ length: 90 }, (_, i) => ({ x: rand(`sx${i}`) * 100, y: rand(`sy${i}`) * 100, r: 1 + rand(`sr${i}`) * 2.2 }));

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const space = sceneAt(frame).id === "scene-05-dia-noite";
  const raw = 1 - clamp(track("ozone.amount", frame, 1), 0, 1);
  const night = clamp(track("sky.night", frame), 0, 1);
  const c = SKY.day.map((d, i) => {
    const r = interpolateColors(raw, [0, 1], [d, SKY.raw[i]]);
    return interpolateColors(night, [0, 1], [r, SKY.night[i]]);
  });
  const cols = space ? SKY.space : c;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${cols[0]} 0%, ${cols[1]} 55%, ${cols[2]} 100%)` }} />
      {space || night > 0.3
        ? STARS.map((s, i) => (
            <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y * (space ? 1 : 0.6)}%`, width: s.r * 2, height: s.r * 2, borderRadius: s.r, background: "#ffffff", opacity: space ? 0.8 : (night - 0.3) * 0.9 }} />
          ))
        : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 48%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 55%, rgba(2,6,20,0.25) 100%)" }} />
    </AbsoluteFill>
  );
};
