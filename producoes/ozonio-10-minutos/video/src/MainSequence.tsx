import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Soundtrack } from "./audio/Soundtrack";
import { AnimatedCaptions } from "./components/AnimatedCaptions";
import { Background } from "./components/Background";
import { CameraController } from "./components/CameraController";
import { Lighting } from "./components/Lighting";
import { BadgeLayer } from "./components/TechnicalBadge";
import { World } from "./components/World";
import { scenes, track } from "./data/scenes";
import { GlobalOverlay, MODULES } from "./scenes/Overlays";
import { CAMERA } from "./theme";

// Orquestra o vídeo a partir do array tipado de cenas (src/data/scenes.ts):
// um único canvas 3D com o cenário persistente + extras 3D de cada cena,
// e por cima as camadas 2D de cada cena (rótulos, tela dividida), badges, legendas e áudio.

const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = track("fade", frame);
  if (fade <= 0.001) return null;
  return <AbsoluteFill style={{ background: "#050b14", opacity: fade }} />;
};

const DimLighting: React.FC = () => {
  const frame = useCurrentFrame();
  return <Lighting dim={track("sky.night", frame)} />;
};

/** `ui: false` tira legendas, badges, rótulos, fade e áudio (composições de thumbnail). */
export type MainProps = { ui?: boolean };

export const MainSequence: React.FC<MainProps> = ({ ui = true }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0e2036" }}>
      <Background />
      <ThreeCanvas width={width} height={height} gl={{ antialias: true }} shadows="percentage" flat camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [-20, 12, 20] }}>
        <CameraController />
        <DimLighting />
        <World />
        {scenes.map((sc) => {
          const Stage = MODULES[sc.id]?.Stage;
          return Stage ? (
            <Sequence key={sc.id} name={`3D · ${sc.id}`} from={sc.startFrame} durationInFrames={sc.durationInFrames} layout="none">
              <Stage scene={sc} />
            </Sequence>
          ) : null;
        })}
      </ThreeCanvas>
      {ui
        ? scenes.map((sc) => {
            const Overlay = MODULES[sc.id]?.Overlay;
            return (
              <Sequence key={sc.id} name={sc.id} from={sc.startFrame} durationInFrames={sc.durationInFrames}>
                {Overlay ? <Overlay scene={sc} /> : null}
                <BadgeLayer badges={sc.badges} />
              </Sequence>
            );
          })
        : null}
      {ui ? <GlobalOverlay /> : null}
      {ui ? <AnimatedCaptions /> : null}
      {ui ? <FadeOut /> : null}
      {ui ? <Soundtrack /> : null}
    </AbsoluteFill>
  );
};
