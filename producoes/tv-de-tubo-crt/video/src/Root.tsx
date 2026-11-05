import { Composition } from "remotion";
import { MainSequence } from "./MainSequence";
import { DURATION } from "./utils/timing";

// durationInFrames = SECONDS × 30 (utils/timing.ts); scenes.ts valida a soma.
export const RemotionRoot: React.FC = () => {
  return <Composition id="TvDeTubo" component={MainSequence} durationInFrames={DURATION} fps={30} width={1080} height={1920} />;
};
