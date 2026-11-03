import { Audio } from "@remotion/media";
import { Sequence, staticFile, Track } from "remotion";
import { scenes } from "../data/scenes";
import { f, VO } from "../utils/timing";

// Áudio: narração (prioridade), efeitos sincronizados de cada cena e trilha instrumental discreta.
// A trilha abaixa sempre que a voz entra (sidechain simples por volume).

const MUSIC = { base: 0.5, ducked: 0.17, ramp: 8 };

const musicVolume = (frame: number) => {
  let duck = 0;
  for (const seg of VO) {
    const start = f(seg.at);
    const end = f(seg.at + seg.seconds);
    const d = Math.min(Math.max(0, (frame - (start - MUSIC.ramp)) / MUSIC.ramp), Math.max(0, (end + MUSIC.ramp * 2 - frame) / (MUSIC.ramp * 2)), 1);
    duck = Math.max(duck, d);
  }
  const fadeOut = Math.min(1, Math.max(0, (1350 - frame) / 24));
  return (MUSIC.base - (MUSIC.base - MUSIC.ducked) * duck) * fadeOut;
};

export const Soundtrack: React.FC = () => (
  <>
    <Audio name="Trilha instrumental" src={staticFile("audio/music.wav")} volume={musicVolume} />
    <Track name="Narração">
      {scenes.map((sc) => (
        <Audio key={sc.id} name={`Narração ${sc.audio.voKey}`} src={staticFile(sc.audio.narrationSrc)} from={sc.startFrame + sc.audio.narrationAt} volume={1} />
      ))}
    </Track>
    {scenes.map((sc) => (
      <Sequence key={sc.id} name={`SFX · ${sc.id}`} from={sc.startFrame} durationInFrames={sc.durationInFrames + 120} layout="none">
        {sc.audio.sfx.map((cue, i) => (
          <Audio key={`${cue.src}-${i}`} name={`SFX · ${cue.src}`} src={staticFile(`audio/sfx/${cue.src}.wav`)} from={Math.max(0, cue.at)} volume={cue.volume} />
        ))}
      </Sequence>
    ))}
  </>
);
