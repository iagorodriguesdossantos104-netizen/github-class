import { Composition } from "remotion";
import { MainSequence } from "./MainSequence";
import { DURATION } from "./utils/timing";

// durationInFrames = SECONDS × 30 (utils/timing.ts); scenes.ts valida a soma.
// TvThumb / TvThumbWide: mesmo vídeo sem legendas, badges e rótulos, só para gerar quadros de thumbnail.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Ozonio" component={MainSequence} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ ui: true }} />
      <Composition id="OzonioThumb" component={MainSequence} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ ui: false }} />
      <Composition id="OzonioThumbWide" component={MainSequence} durationInFrames={DURATION} fps={30} width={1920} height={1080} defaultProps={{ ui: false }} />
    </>
  );
};
