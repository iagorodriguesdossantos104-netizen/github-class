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
import { GanchoScene, SolucaoScene } from "./scenes/ExampleScenes";
import type { SceneModule } from "./scenes/types";
import { CAMERA } from "./theme";

// Orquestra o vídeo a partir do array tipado de cenas (src/data/scenes.ts):
// um único canvas 3D com o cenário persistente + extras 3D de cada cena,
// e por cima as camadas 2D de cada cena (rótulos, tela dividida), badges, legendas e áudio.

const MODULES: Record<string, SceneModule> = {
  "scene-01-gancho": GanchoScene,
  "scene-02-solucao": SolucaoScene,
};

const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = track("fade", frame);
  if (fade <= 0.001) return null;
  return <AbsoluteFill style={{ background: "#050b14", opacity: fade }} />;
};

export const MainSequence: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0e2036" }}>
      <Background />
      <ThreeCanvas width={width} height={height} gl={{ antialias: true }} shadows="percentage" flat camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [8, 6, 30] }}>
        <CameraController />
        <Lighting />
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
      {scenes.map((sc) => {
        const Overlay = MODULES[sc.id]?.Overlay;
        return (
          <Sequence key={sc.id} name={sc.id} from={sc.startFrame} durationInFrames={sc.durationInFrames}>
            {Overlay ? <Overlay scene={sc} /> : null}
            <BadgeLayer badges={sc.badges} />
          </Sequence>
        );
      })}
      <AnimatedCaptions />
      <FadeOut />
      <Soundtrack />
    </AbsoluteFill>
  );
};
