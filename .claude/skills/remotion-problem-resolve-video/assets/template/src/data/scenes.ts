import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Contrato de dados do vídeo (o scene-plan.ts da Fase 1 vira este arquivo na Fase 2).
// Frames de animações, badges, legendas, câmera e áudio são LOCAIS à cena; startFrame é global.
// Os cortes vêm de utils/timing.ts (planejados antes do TTS, medidos depois).

export type VideoConfig = {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  theme: string;
  language: string;
};

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d", language: "pt-BR" };

/** negative = problema (✖ vermelho), positive = solução (✔ verde), info = termo/neutro, warning = pergunta/atenção. */
export type BadgeVariant = "positive" | "negative" | "info" | "warning";

/** Pose de passagem da câmera (a câmera interpola em coordenadas orbitais entre as chaves). */
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };

export type CameraPlan = {
  projection: "perspective" | "orthographic";
  movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split" | "hold";
  /** keys[0] é a pose inicial do plano; inclua uma chave no último frame para continuidade. */
  keys: CameraKey[];
};

/** Objeto persistente do sistema: ids estáveis entre cenas; `visible` controla a montagem. */
export type SceneObject = { id: string; type: string; visible: boolean; state?: { start: string; end: string } };

export type SceneBadge = {
  text: string;
  variant: BadgeVariant;
  appearAt: number;
  disappearAt?: number;
  subtitle?: string;
  /** Coluna central (padrão) ou metade esquerda/direita de uma tela dividida. */
  slot?: "center" | "left" | "right";
  icon?: "?";
  size?: "normal" | "large";
};

/** Legenda provisória (antes do TTS). Depois do alinhamento, as legendas vêm palavra a palavra de vo.json. */
export type CaptionBlock = { text: string; from: number; to: number };

export type AudioCue = {
  kind: "narration" | "sfx";
  /** Caminho em public/ (ex.: "audio/vo/s1.wav", "audio/sfx/whoosh.wav"). */
  src: string;
  at: number;
  volume: number;
  /** "planned" ainda não existe em disco e não é tocado; "ready" foi gerado/medido. */
  status: "planned" | "ready";
};

export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: VoKey;
  narration: string;
  camera: CameraPlan;
  objects: SceneObject[];
  animations: TrackAnimation[];
  badges: SceneBadge[];
  /** Palavras-chave (MAIÚSCULAS, sem pontuação) coloridas na legenda. */
  highlights: string[];
  captions: CaptionBlock[];
  audioCues: AudioCue[];
};

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey, status: AudioCue["status"]): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "planned" });

// Poses compartilhadas entre cenas (continuidade espacial).
const P = {
  wide: orbit([0, 0.6, 0], 22, 28, 22),
  close: orbit([0, 0.9, 0.5], 11, 18, 12),
};

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você quer X. Parece que basta fazer Y...",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(end(0), P.close, "soft")] },
    objects: [
      { id: "terrain", type: "diorama", visible: true },
      { id: "subject", type: "mecanismo", visible: true, state: { start: "ausente", end: "montado" } },
    ],
    animations: [{ type: "spring", target: "subject.scale", startFrame: s(0.3), endFrame: s(1.5), from: 0, to: 1, unit: "0-1" }],
    badges: [{ text: "PROBLEMA", variant: "negative", appearAt: W("s1", 2), disappearAt: end(0) - 6 }],
    highlights: ["X", "Y"],
    captions: [{ text: "Você quer X. Parece que basta fazer Y...", from: voLocal("s1"), to: end(0) }],
    audioCues: [narration("s1", "planned"), sfx("whoosh-soft", 0, 0.3), sfx("badge", W("s1", 2), 0.28)],
  },
  {
    id: "scene-02-solucao",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que Z acontece. Por isso existe a SOLUÇÃO.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.close), key(end(1), orbit([0, 0.8, 0.5], 12, 2, 14), "soft")] },
    objects: [
      { id: "terrain", type: "diorama", visible: true },
      { id: "subject", type: "mecanismo", visible: true, state: { start: "montado", end: "funcionando" } },
    ],
    animations: [
      { type: "interpolate", target: "subject.glow", startFrame: W("s2", 6), endFrame: W("s2", 6) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(1) - 14, endFrame: end(1), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "SOLUÇÃO", variant: "positive", appearAt: W("s2", 6), disappearAt: end(1) }],
    highlights: ["SOLUÇÃO"],
    captions: [{ text: "Só que Z acontece. Por isso existe a SOLUÇÃO.", from: voLocal("s2"), to: end(1) }],
    audioCues: [narration("s2", "planned"), sfx("badge", W("s2", 6), 0.28)],
  },
];

/** Valor de uma trilha de animação (ex.: "subject.scale") no frame global. */
export const track = (target: string, frame: number, fallback = 0) => evaluateTrack(scenes, target, frame, FPS, fallback);

/** Cena ativa no frame global. */
export const sceneAt = (frame: number) => {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (frame >= scenes[i].startFrame) return scenes[i];
  }
  return scenes[0];
};

export const isVisible = (id: string, frame: number) => sceneAt(frame).objects.some((o) => o.id === id && o.visible);

// Verificação de integridade da timeline (executada ao importar): contígua, começa em 0, soma DURATION.
scenes.forEach((cur, i) => {
  const prev = scenes[i - 1];
  if (prev && prev.startFrame + prev.durationInFrames !== cur.startFrame) {
    throw new Error(`Buraco/sobreposição entre ${prev.id} e ${cur.id}`);
  }
});
const total = scenes.reduce((acc, cur) => acc + cur.durationInFrames, 0);
if (total !== DURATION || scenes[0].startFrame !== 0) {
  throw new Error(`As cenas somam ${total} frames (esperado ${DURATION})`);
}
