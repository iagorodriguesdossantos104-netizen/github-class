import { Composition } from "remotion";
import { MainSequence } from "./MainSequence";

// Troque o id e mantenha durationInFrames = SECONDS × 30 (utils/timing.ts); scenes.ts valida a soma.
export const RemotionRoot: React.FC = () => {
  return <Composition id="ProblemResolveVideo" component={MainSequence} durationInFrames={300} fps={30} width={1080} height={1920} />;
};
