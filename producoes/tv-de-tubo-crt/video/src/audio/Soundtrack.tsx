import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { scenes } from "../data/scenes";
import { DURATION, f, VO } from "../utils/timing";

// Áudio: narração (prioridade), efeitos de cada cena e trilha instrumental discreta.
// A trilha abaixa sempre que a voz entra (sidechain simples por volume).
// Só toca o que está com status "ready" — cues "planned" ainda não existem em disco.

/** Mude para true depois de gerar public/audio/music.wav (scripts/music.py). */
const HAS_MUSIC = true;
const MUSIC = { base: 0.5, ducked: 0.17, ramp: 8 };

const musicVolume = (frame: number) => {
  let duck = 0;
  for (const seg of VO) {
    const start = f(seg.at);
    const end = f(seg.at + seg.seconds);
    const d = Math.min(Math.max(0, (frame - (start - MUSIC.ramp)) / MUSIC.ramp), Math.max(0, (end + MUSIC.ramp * 2 - frame) / (MUSIC.ramp * 2)), 1);
    duck = Math.max(duck, d);
  }
  const fadeOut = Math.min(1, Math.max(0, (DURATION - frame) / 24));
  return (MUSIC.base - (MUSIC.base - MUSIC.ducked) * duck) * fadeOut;
};

export const Soundtrack: React.FC = () => (
  <>
    {HAS_MUSIC ? <Audio name="Trilha instrumental" src={staticFile("audio/music.wav")} volume={musicVolume} /> : null}
    {scenes.map((sc) => (
      <Sequence key={sc.id} name={`Áudio · ${sc.id}`} from={sc.startFrame} durationInFrames={sc.durationInFrames + 120} layout="none">
        {sc.audioCues
          .filter((cue) => cue.status === "ready")
          .map((cue, i) => (
            <Audio key={`${cue.src}-${i}`} name={`${cue.kind} · ${cue.src}`} src={staticFile(cue.src)} from={Math.max(0, cue.at)} volume={cue.volume} />
          ))}
      </Sequence>
    ))}
  </>
);
