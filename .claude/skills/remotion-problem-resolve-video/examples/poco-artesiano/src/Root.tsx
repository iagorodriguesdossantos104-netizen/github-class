import { Composition } from "remotion";
import { MainSequence } from "./MainSequence";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="PocoArtesiano" component={MainSequence} durationInFrames={1350} fps={30} width={1080} height={1920} />
  );
};
