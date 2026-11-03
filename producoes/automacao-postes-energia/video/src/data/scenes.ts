// src/data/scenes.ts — derivado do scene-plan.ts aprovado (Roteiro v1) "Como funciona a automação dos postes de energia?" (Fase 1, AGUARDANDO APROVAÇÃO)
// Contrato de dados no formato de assets/template/src/data/scenes.ts: na Fase 2 este arquivo vira
// src/data/scenes.ts sem tradução. Frames de animações/badges/legendas/câmera/áudio são LOCAIS à cena.
//
// Em src/utils/timing.ts (Fase 2) configure:
//   export const SECONDS = 90;
//   export const VO_KEYS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14"] as const;
//   const PLANNED_SECONDS = [8.47, 6.27, 7.33, 6.63, 5.2, 4.13, 6.27, 4.5, 8.4, 5.57, 5.9, 6.97, 5.9, 8.46];
//   const GAPS = Array(13).fill(0.55);
// Cortes planejados (frames globais): 0,254,442,662,861,1017,1141,1329,1464,1716,1883,2060,2269,2446,2700.
// Mapa do mundo (u3d): rua ao longo de x; fios a y≈4,2; subestação x=−9,5; postes x=−7…7 (passo 2);
// religador no poste 3 (x=−3); chave 1 no poste 5 (x=1); árvore x=2; chave 2 no poste 6 (x=3);
// chave NA no poste 8 (x=7); circuito vizinho x=7→12; centro de operação (−1,0,−9).

import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };
export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-entardecer", language: "pt-BR" };

export type BadgeVariant = "positive" | "negative" | "info" | "warning";
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };
export type CameraPlan = {
  projection: "perspective" | "orthographic";
  movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split" | "hold";
  keys: CameraKey[];
};
export type SceneObject = { id: string; type: string; visible: boolean; state?: { start: string; end: string } };
export type SceneBadge = {
  text: string; variant: BadgeVariant; appearAt: number; disappearAt?: number;
  subtitle?: string; slot?: "center" | "left" | "right"; icon?: "?"; size?: "normal" | "large";
};
export type CaptionBlock = { text: string; from: number; to: number };
export type AudioCue = { kind: "narration" | "sfx"; src: string; at: number; volume: number; status: "planned" | "ready" };
export type ScenePlan = {
  id: string; startFrame: number; durationInFrames: number; voKey: VoKey; narration: string;
  camera: CameraPlan; objects: SceneObject[]; animations: TrackAnimation[]; badges: SceneBadge[];
  highlights: string[]; captions: CaptionBlock[]; audioCues: AudioCue[];
};

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey, status: AudioCue["status"]): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "ready" });
const cap = (k: VoKey, text: string, to: number): CaptionBlock => ({ text, from: voLocal(k), to });

// Poses compartilhadas (continuidade espacial): orbit(alvo, distância, azimute°, elevação°)
const P = {
  houseWindow: orbit([-2, 1.0, -1.75], 6, -15, 6),
  street: orbit([1, 2, -0.5], 36, -58, 22),
  branchSpan: orbit([-1.4, 3.8, 0.5], 11, -30, 8),
  substation: orbit([-9.6, 1.4, 0.6], 9, -35, 12),
  streetDark: orbit([1, 2, -0.5], 32, -52, 24),
  branchGround: orbit([-1.3, 0.4, 0.9], 8, -70, 38),
  recloser: orbit([-3, 3.6, 0.3], 7, -25, 8),
  lineRight: orbit([2, 2.5, 0], 24, -48, 18),
  treeSpan: orbit([2, 3.6, 0.6], 13, -30, 10),
  recloserMid: orbit([-3, 3.4, 0.3], 10, -20, 8),
  streetHigh: orbit([1, 2, -0.5], 34, -55, 26),
  house7: orbit([6, 1.4, -1.8], 10, -20, 10),
  sideHigh: orbit([1, 2.5, 0], 30, -50, 30),
  switches: orbit([2, 4.2, -0.3], 11, -155, 28),
  segD: orbit([5, 3, -0.5], 13, -30, 12),
  tie: orbit([7, 4.4, 0], 8, -30, 8),
  tieWide: orbit([8, 3, 0], 19, -42, 14),
  codWide: orbit([1, 2, -6], 42, -30, 30),
  codWide2: orbit([1, 2, -6], 42, -42, 27),
  codScreen: orbit([-1, 1.25, -10.8], 7.5, -8, 5),
  streetFix: orbit([1, 2, -0.5], 28, -45, 22),
  final: orbit([0.5, 1.5, -3], 52, -50, 30),
};

// Objetos persistentes (ids estáveis). Equipamentos aparecem na cena em que são instalados e ficam.
const base = (): SceneObject[] => [
  { id: "substation", type: "subestacao", visible: true },
  { id: "breaker", type: "disjuntor", visible: true },
  { id: "poles", type: "postes-1-a-8", visible: true },
  { id: "wires", type: "fios-media-tensao", visible: true },
  { id: "houses", type: "casas-1-a-7", visible: true },
  { id: "streetTree", type: "arvore-calcada", visible: true },
  { id: "sky", type: "fundo-entardecer", visible: true },
];
const o = (id: string, type: string, start?: string, endState?: string): SceneObject =>
  start ? { id, type, visible: true, state: { start, end: endState ?? start } } : { id, type, visible: true };

export const scenes: ScenePlan[] = [
  // 1 — gancho
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você aperta o interruptor e a luz acende. Parece que basta um fio, de poste em poste, até a sua casa.",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [key(0, P.houseWindow), key(s(3.3), orbit([-2, 1.1, -1.75], 7, -18, 7)), key(s(8.0), P.street, "soft"), key(end(0), P.street)],
    },
    objects: [...base(), o("house3Cut", "casa-em-corte", "luz apagada", "luz acesa"), o("lightSwitch", "interruptor")],
    animations: [
      { type: "interpolate", target: "segA.power", startFrame: 0, endFrame: 1, from: 1, to: 1, unit: "0-1" },
      { type: "interpolate", target: "segB.power", startFrame: 0, endFrame: 1, from: 1, to: 1, unit: "0-1" },
      { type: "interpolate", target: "segC.power", startFrame: 0, endFrame: 1, from: 1, to: 1, unit: "0-1" },
      { type: "interpolate", target: "segD.power", startFrame: 0, endFrame: 1, from: 1, to: 1, unit: "0-1" },
      { type: "spring", target: "switch.press", startFrame: W("s1", 1), endFrame: W("s1", 1) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "bulb.glow", startFrame: W("s1", 6) - 6, endFrame: W("s1", 6) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "house3Cut.cut", startFrame: s(5.5), endFrame: s(7), from: 1, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "labels.street", startFrame: s(6.7), endFrame: s(7.5), from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "REDE DE DISTRIBUIÇÃO", subtitle: "Da subestação até você", variant: "info", appearAt: W("s1", 13), disappearAt: end(0) - 4 }],
    highlights: ["INTERRUPTOR", "LUZ", "FIO", "POSTE", "CASA"],
    captions: [cap("s1", "Você aperta o interruptor e a luz acende.", W("s1", 8)), { text: "Parece que basta um fio, de poste em poste, até a sua casa.", from: W("s1", 8), to: end(0) }],
    audioCues: [narration("s1", "ready"), sfx("whoosh-soft", 0, 0.3), sfx("click", W("s1", 1) + 8, 0.4), sfx("hum-on", W("s1", 6), 0.18), sfx("badge", W("s1", 13), 0.28)],
  },
  // 2 — curto-circuito
  {
    id: "scene-02-curto",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que um galho encosta no fio: curto-circuito! A corrente dispara e pode queimar a rede.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.street), key(s(1.6), P.branchSpan, "soft"), key(end(1), orbit([-2.5, 3.6, 0.5], 12.5, -36, 9), "linear")] },
    objects: [...base(), o("branch", "galho", "na árvore", "encostado nos fios"), o("arcFault", "faiscas")],
    animations: [
      { type: "interpolate", target: "streetTree.sway", startFrame: 0, endFrame: s(1.8), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "branch.drop", startFrame: W("s2", 3) - 12, endFrame: W("s2", 4) + 2, from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "spring", target: "arc.fault", startFrame: W("s2", 7), endFrame: W("s2", 7) + 30, from: 0, to: 1, damping: 8, unit: "0-1" },
      { type: "interpolate", target: "cam.shake", startFrame: W("s2", 7), endFrame: W("s2", 7) + 21, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "wire.heat", startFrame: W("s2", 9) - 12, endFrame: W("s2", 15) - 7, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [{ text: "CURTO-CIRCUITO", variant: "negative", appearAt: W("s2", 7), disappearAt: end(1) }],
    highlights: ["GALHO", "CURTO-CIRCUITO", "CORRENTE", "QUEIMAR"],
    captions: [cap("s2", "Só que um galho encosta no fio: curto-circuito!", W("s2", 8)), { text: "A corrente dispara e pode queimar a rede.", from: W("s2", 8), to: end(1) }],
    audioCues: [narration("s2", "ready"), sfx("leaves", W("s2", 3) - 12, 0.2), sfx("zap", W("s2", 7) - 3, 0.42), sfx("buzz", W("s2", 9), 0.22), sfx("badge", W("s2", 7), 0.28)],
  },
  // 3 — disjuntor
  {
    id: "scene-03-disjuntor",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Por isso, a subestação tem um disjuntor, que sente o excesso de corrente e desliga a linha na hora.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [key(0, orbit([-2.5, 3.6, 0.5], 12.5, -36, 9)), key(s(2.3), P.substation, "soft"), key(s(5.4), orbit([-9.3, 0.95, 0.9], 6, -28, 10), "linear"), key(end(2), orbit([-6, 2.5, 0], 18, -40, 16), "soft")],
    },
    objects: [...base(), o("branch", "galho", "encostado nos fios"), o("arcFault", "faiscas"), o("currentMeter", "medidor-2d")],
    animations: [
      { type: "interpolate", target: "meter.needle", startFrame: W("s3", 10), endFrame: W("s3", 10) + 15, from: 0.3, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "breaker.open", startFrame: W("s3", 14), endFrame: W("s3", 14) + 30, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "arc.fault", startFrame: W("s3", 14), endFrame: W("s3", 14) + 6, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "wire.heat", startFrame: W("s3", 14), endFrame: W("s3", 14) + 20, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "segA.power", startFrame: W("s3", 14) + 2, endFrame: W("s3", 14) + 14, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "segB.power", startFrame: W("s3", 14) + 2, endFrame: W("s3", 14) + 14, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "segC.power", startFrame: W("s3", 14) + 2, endFrame: W("s3", 14) + 14, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "segD.power", startFrame: W("s3", 14) + 2, endFrame: W("s3", 14) + 14, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "sky.dark", startFrame: W("s3", 14) + 2, endFrame: W("s3", 14) + 30, from: 0, to: 0.7, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "DISJUNTOR", subtitle: "Protege a linha", variant: "info", appearAt: W("s3", 6), disappearAt: s(6.7) }],
    highlights: ["DISJUNTOR", "EXCESSO", "CORRENTE", "DESLIGA"],
    captions: [cap("s3", "Por isso, a subestação tem um disjuntor,", W("s3", 7)), { text: "que sente o excesso de corrente e desliga a linha na hora.", from: W("s3", 7), to: end(2) }],
    audioCues: [narration("s3", "ready"), sfx("whoosh-soft", 0, 0.2), sfx("badge", W("s3", 6), 0.28), sfx("clack", W("s3", 14), 0.45), sfx("power-down", W("s3", 14) + 2, 0.32)],
  },
  // 4 — apagão / falha passageira
  {
    id: "scene-04-apagao",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Mas o bairro inteiro apagou, e o galho já caiu! A maioria das falhas é passageira assim.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([-6, 2.5, 0], 18, -40, 16)), key(s(2.0), P.streetDark, "soft"), key(s(3.2), orbit([1, 2, -0.5], 31, -48, 23), "linear"), key(s(5.7), P.branchGround, "soft"), key(end(3), orbit([-1.3, 0.4, 0.9], 7.5, -78, 40), "linear")] },
    objects: [...base(), o("branch", "galho", "encostado nos fios", "caído na calçada"), o("questionMarks", "interrogacoes-2d")],
    animations: [
      { type: "spring", target: "houses.question", startFrame: s(1.0), endFrame: s(2.0), from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "houses.question", startFrame: s(4.0), endFrame: s(4.5), from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "branch.drop", startFrame: W("s4", 9) - 10, endFrame: W("s4", 9) + 2, from: 1, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "branch.fall", startFrame: W("s4", 9) - 10, endFrame: W("s4", 9) + 22, from: 0, to: 1, damping: 9, unit: "0-1" },
    ],
    badges: [
      { text: "BAIRRO SEM LUZ", variant: "negative", appearAt: W("s4", 2) - 6, disappearAt: W("s4", 10) - 6 },
      { text: "FALHA PASSAGEIRA", variant: "warning", icon: "?", appearAt: W("s4", 15), disappearAt: end(3) },
    ],
    highlights: ["BAIRRO", "APAGOU", "GALHO", "CAIU", "PASSAGEIRA"],
    captions: [cap("s4", "Mas o bairro inteiro apagou, e o galho já caiu!", W("s4", 10)), { text: "A maioria das falhas é passageira assim.", from: W("s4", 10), to: end(3) }],
    audioCues: [narration("s4", "ready"), sfx("badge", W("s4", 2) - 6, 0.26), sfx("thud", W("s4", 9) + 2, 0.34), sfx("badge", W("s4", 15), 0.26)],
  },
  // 5 — religador automático
  {
    id: "scene-05-religador",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Então entra o religador automático: ele desliga, espera uns segundos e religa sozinho.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([-1.3, 0.4, 0.9], 7.5, -78, 40)), key(s(1.2), P.recloser, "soft"), key(end(4), orbit([-3, 3.6, 0.3], 7.5, -42, 10), "linear")] },
    objects: [...base(), o("branch", "galho", "caído na calçada"), o("recloser", "religador", "ausente", "instalado, fechado"), o("branchGhost", "galho-translucido"), o("timer2d", "contador-2d")],
    animations: [
      { type: "interpolate", target: "breaker.open", startFrame: 0, endFrame: 10, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "segA.power", startFrame: 4, endFrame: 20, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "sky.dark", startFrame: 4, endFrame: 30, from: 0.7, to: 0.55, easing: "out", unit: "0-1" },
      { type: "spring", target: "recloser.install", startFrame: W("s5", 3) - 6, endFrame: W("s5", 3) + 26, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "branchGhost.touch", startFrame: W("s5", 6) - 12, endFrame: W("s5", 6), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "spring", target: "recloser.open", startFrame: W("s5", 6), endFrame: W("s5", 6) + 30, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "branchGhost.touch", startFrame: W("s5", 7), endFrame: W("s5", 7) + 10, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "timer.count", startFrame: W("s5", 7), endFrame: W("s5", 11), from: 0, to: 2, easing: "linear", unit: "0-1" },
      { type: "spring", target: "recloser.open", startFrame: W("s5", 11), endFrame: W("s5", 11) + 30, from: 1, to: 0, damping: 14, unit: "0-1" },
    ],
    badges: [{ text: "RELIGADOR AUTOMÁTICO", variant: "positive", appearAt: W("s5", 3), disappearAt: end(4) }],
    highlights: ["RELIGADOR", "AUTOMÁTICO", "DESLIGA", "ESPERA", "RELIGA"],
    captions: [cap("s5", "Então entra o religador automático:", W("s5", 5)), { text: "ele desliga, espera uns segundos e religa sozinho.", from: W("s5", 5), to: end(4) }],
    audioCues: [narration("s5", "ready"), sfx("power-up", 4, 0.22), sfx("thud", W("s5", 3) + 4, 0.3), sfx("badge", W("s5", 3), 0.28), sfx("clack", W("s5", 6), 0.4), sfx("tick", W("s5", 8), 0.2), sfx("clack", W("s5", 11), 0.4)],
  },
  // 6 — energia volta
  {
    id: "scene-06-volta",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Defeito sumiu, luz de volta, sem ninguém sair de casa.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([-3, 3.6, 0.3], 7.5, -42, 10)), key(s(1.6), orbit([-1, 2.5, 0], 18, -40, 16), "soft"), key(end(5), P.lineRight, "linear")] },
    objects: [...base(), o("branch", "galho", "caído na calçada"), o("recloser", "religador", "fechado")],
    animations: [
      { type: "interpolate", target: "segB.power", startFrame: 15, endFrame: 35, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "segC.power", startFrame: 25, endFrame: 45, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "segD.power", startFrame: 35, endFrame: 55, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "sky.dark", startFrame: 15, endFrame: 60, from: 0.55, to: 0, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "ENERGIA RESTABELECIDA", variant: "positive", appearAt: W("s6", 2), disappearAt: end(5) - 4 }],
    highlights: ["DEFEITO", "SUMIU", "LUZ", "VOLTA"],
    captions: [cap("s6", "Defeito sumiu, luz de volta, sem ninguém sair de casa.", end(5))],
    audioCues: [narration("s6", "ready"), sfx("power-up", 15, 0.28), sfx("badge", W("s6", 2), 0.28)],
  },
  // 7 — falha permanente
  {
    id: "scene-07-permanente",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Mas, se uma árvore cai sobre o fio, a falha é permanente, e o religador desiste.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, P.lineRight), key(s(1.4), P.treeSpan, "soft"), key(s(3.3), orbit([2, 3.6, 0.6], 12, -22, 9), "linear"), key(s(3.7), P.recloserMid, "soft"), key(end(6), orbit([-3, 3.4, 0.3], 9.5, -10, 8), "linear")] },
    objects: [...base(), o("recloser", "religador", "fechado", "bloqueado aberto"), o("tree", "arvore-grande", "em pé", "caída sobre os fios"), o("arcFault2", "faiscas"), o("attempts2d", "contador-tentativas-2d")],
    animations: [
      { type: "interpolate", target: "tree.fall", startFrame: W("s7", 3), endFrame: W("s7", 4) + 10, from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "spring", target: "arc.fault2", startFrame: W("s7", 4) + 10, endFrame: W("s7", 4) + 40, from: 0, to: 1, damping: 8, unit: "0-1" },
      { type: "interpolate", target: "arc.fault2", startFrame: s(5.6), endFrame: s(5.8), from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "recloser.open", startFrame: s(3.75), endFrame: s(3.85), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "recloser.open", startFrame: s(4.3), endFrame: s(4.4), from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "recloser.open", startFrame: s(4.65), endFrame: s(4.75), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "recloser.open", startFrame: s(5.2), endFrame: s(5.3), from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "recloser.open", startFrame: s(5.5), endFrame: s(5.6), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "segB.power", startFrame: s(3.75), endFrame: s(5.6), from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "segC.power", startFrame: s(3.75), endFrame: s(5.6), from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "segD.power", startFrame: s(3.75), endFrame: s(5.6), from: 1, to: 0, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "attempts.count", startFrame: s(3.75), endFrame: s(5.6), from: 0, to: 3, easing: "linear", unit: "0-1" },
      { type: "spring", target: "recloser.lock", startFrame: W("s7", 15), endFrame: W("s7", 15) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "sky.dark", startFrame: s(3.75), endFrame: s(5.8), from: 0, to: 0.45, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "FALHA PERMANENTE", variant: "negative", appearAt: W("s7", 11), disappearAt: end(6) }],
    highlights: ["ÁRVORE", "FIO", "PERMANENTE", "RELIGADOR", "DESISTE"],
    captions: [cap("s7", "Mas, se uma árvore cai sobre o fio,", W("s7", 8)), { text: "a falha é permanente, e o religador desiste.", from: W("s7", 8), to: end(6) }],
    audioCues: [narration("s7", "ready"), sfx("creak", W("s7", 3), 0.26), sfx("thud", W("s7", 4) + 10, 0.42), sfx("zap", W("s7", 4) + 10, 0.36), sfx("clack", s(3.75), 0.32), sfx("clack", s(4.65), 0.32), sfx("clack", s(5.5), 0.36), sfx("badge", W("s7", 11), 0.28)],
  },
  // 8 — todo mundo sem luz
  {
    id: "scene-08-sem-luz",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Todo mundo depois dele fica sem luz, mesmo longe da árvore.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([-3, 3.4, 0.3], 9.5, -10, 8)), key(s(1.5), P.streetHigh, "soft"), key(s(2.0), orbit([1, 2, -0.5], 33, -50, 25), "linear"), key(end(7), P.house7, "soft")] },
    objects: [...base(), o("recloser", "religador", "bloqueado aberto"), o("tree", "arvore-grande", "caída sobre os fios"), o("ruler2d", "regua-tracejada-2d")],
    animations: [
      { type: "interpolate", target: "segHighlight.dark", startFrame: 20, endFrame: 60, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "ruler.draw", startFrame: W("s8", 8), endFrame: W("s8", 8) + 18, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "TODO MUNDO SEM LUZ", variant: "negative", appearAt: 20, disappearAt: end(7) }],
    highlights: ["SEM", "LUZ", "LONGE", "ÁRVORE"],
    captions: [cap("s8", "Todo mundo depois dele fica sem luz, mesmo longe da árvore.", end(7))],
    audioCues: [narration("s8", "ready"), sfx("badge", 20, 0.26), sfx("whoosh-soft", s(2.0), 0.18)],
  },
  // 9 — chaves automáticas / seccionamento
  {
    id: "scene-09-chaves",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Por isso, chaves automáticas dividem a linha em trechos. Elas abrem dos dois lados do defeito, e o começo volta a ligar.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, P.house7), key(s(1.6), P.sideHigh, "soft"), key(s(3.6), orbit([1, 2.5, 0], 29, -40, 29), "linear"), key(s(4.4), P.switches, "soft"), key(s(6.3), orbit([2, 4.2, -0.3], 11, -168, 26), "linear"), key(end(8), P.sideHigh, "soft")],
    },
    objects: [...base(), o("recloser", "religador", "bloqueado aberto", "fechado"), o("tree", "arvore-grande", "caída sobre os fios"), o("switch1", "chave-automatica", "ausente", "aberta"), o("switch2", "chave-automatica", "ausente", "aberta"), o("segmentTint", "faixas-de-trecho-2d")],
    animations: [
      { type: "spring", target: "switch1.install", startFrame: W("s9", 2), endFrame: W("s9", 2) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "switch2.install", startFrame: W("s9", 2) + 4, endFrame: W("s9", 2) + 34, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "segments.tint", startFrame: W("s9", 8), endFrame: W("s9", 8) + 15, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "switch1.open", startFrame: W("s9", 10), endFrame: W("s9", 10) + 30, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "spring", target: "switch2.open", startFrame: W("s9", 10) + 3, endFrame: W("s9", 10) + 33, from: 0, to: 1, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "recloser.lock", startFrame: W("s9", 18) - 6, endFrame: W("s9", 18), from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "spring", target: "recloser.open", startFrame: W("s9", 18), endFrame: W("s9", 18) + 30, from: 1, to: 0, damping: 14, unit: "0-1" },
      { type: "interpolate", target: "segB.power", startFrame: W("s9", 18) + 4, endFrame: W("s9", 18) + 20, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "segHighlight.dark", startFrame: W("s9", 8), endFrame: W("s9", 8) + 15, from: 1, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "CHAVES AUTOMÁTICAS", variant: "positive", appearAt: W("s9", 2), disappearAt: W("s9", 10) - 4 },
      { text: "TRECHO ISOLADO", variant: "positive", appearAt: W("s9", 10), disappearAt: end(8) },
    ],
    highlights: ["CHAVES", "AUTOMÁTICAS", "TRECHOS", "ABREM", "DEFEITO", "COMEÇO"],
    captions: [cap("s9", "Por isso, chaves automáticas dividem a linha em trechos.", W("s9", 9)), { text: "Elas abrem dos dois lados do defeito, e o começo volta a ligar.", from: W("s9", 9), to: end(8) }],
    audioCues: [narration("s9", "ready"), sfx("badge", W("s9", 2), 0.28), sfx("thud", W("s9", 2) + 8, 0.24), sfx("clack", W("s9", 10), 0.38), sfx("clack", W("s9", 10) + 3, 0.34), sfx("badge", W("s9", 10), 0.26), sfx("power-up", W("s9", 18) + 4, 0.26)],
  },
  // 10 — casas sãs no escuro
  {
    id: "scene-10-escuro",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Só que as casas depois do trecho continuam no escuro, com os fios inteiros.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, P.sideHigh), key(s(2.0), P.segD, "soft"), key(end(9), orbit([5.5, 3, -0.5], 12, -40, 12), "linear")] },
    objects: [...base(), o("recloser", "religador", "fechado"), o("tree", "arvore-grande", "caída sobre os fios"), o("switch1", "chave-automatica", "aberta"), o("switch2", "chave-automatica", "aberta"), o("okMarks", "selos-ok-2d")],
    animations: [
      { type: "interpolate", target: "segD.scan", startFrame: W("s10", 12) - 20, endFrame: W("s10", 13) + 10, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "segD.okMarks", startFrame: W("s10", 12), endFrame: W("s10", 12) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [{ text: "SEM LUZ, MAS SEM DEFEITO", variant: "warning", appearAt: W("s10", 7), disappearAt: end(9) }],
    highlights: ["CASAS", "ESCURO", "FIOS", "INTEIROS"],
    captions: [cap("s10", "Só que as casas depois do trecho continuam no escuro,", W("s10", 10)), { text: "com os fios inteiros.", from: W("s10", 10), to: end(9) }],
    audioCues: [narration("s10", "ready"), sfx("badge", W("s10", 7), 0.26), sfx("scan", W("s10", 12) - 20, 0.18)],
  },
  // 11 — chave NA / circuito vizinho
  {
    id: "scene-11-chave-na",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Então, uma chave normalmente aberta se fecha e liga essas casas a um circuito vizinho.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([5.5, 3, -0.5], 12, -40, 12)), key(s(1.5), P.tie, "soft"), key(s(3.3), orbit([7, 4.4, 0], 8, -40, 9), "linear"), key(s(5.6), P.tieWide, "soft"), key(end(10), P.tieWide)] },
    objects: [...base(), o("recloser", "religador", "fechado"), o("tree", "arvore-grande", "caída sobre os fios"), o("switch1", "chave-automatica", "aberta"), o("switch2", "chave-automatica", "aberta"), o("tieSwitch", "chave-NA", "aberta", "fechada"), o("neighborLine", "circuito-vizinho"), o("neighborSub", "subestacao-vizinha-silhueta")],
    animations: [
      { type: "interpolate", target: "neighbor.power", startFrame: 0, endFrame: 1, from: 1, to: 1, unit: "0-1" },
      { type: "spring", target: "tieSwitch.ring", startFrame: W("s11", 3), endFrame: W("s11", 3) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "tieSwitch.closed", startFrame: W("s11", 6), endFrame: W("s11", 6) + 30, from: 0, to: 1, damping: 13, unit: "0-1" },
      { type: "interpolate", target: "segD.flowDir", startFrame: W("s11", 6), endFrame: W("s11", 6) + 1, from: 1, to: -1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "segD.power", startFrame: W("s11", 8), endFrame: W("s11", 8) + 20, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "sky.dark", startFrame: W("s11", 8), endFrame: W("s11", 8) + 30, from: 0.45, to: 0.15, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "CHAVE NA", subtitle: "Normalmente aberta", variant: "info", appearAt: W("s11", 3), disappearAt: s(3.7) },
      { text: "CIRCUITO VIZINHO", variant: "positive", appearAt: W("s11", 13), disappearAt: end(10) },
    ],
    highlights: ["CHAVE", "ABERTA", "FECHA", "CIRCUITO", "VIZINHO"],
    captions: [cap("s11", "Então, uma chave normalmente aberta se fecha", W("s11", 7)), { text: "e liga essas casas a um circuito vizinho.", from: W("s11", 7), to: end(10) }],
    audioCues: [narration("s11", "ready"), sfx("badge", W("s11", 3), 0.26), sfx("clack", W("s11", 6), 0.4), sfx("power-up", W("s11", 8), 0.26), sfx("badge", W("s11", 13), 0.26)],
  },
  // 12 — comunicação / centro de operação
  {
    id: "scene-12-comunicacao",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "E quem coordena tudo? Sensores medem a corrente e avisam, por rádio ou celular, o centro de operação.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.tieWide), key(s(1.6), P.codWide, "soft"), key(end(11), P.codWide2, "linear")] },
    objects: [...base(), o("recloser", "religador", "fechado"), o("tree", "arvore-grande", "caída sobre os fios"), o("switch1", "chave-automatica", "aberta"), o("switch2", "chave-automatica", "aberta"), o("tieSwitch", "chave-NA", "fechada"), o("neighborLine", "circuito-vizinho"), o("neighborSub", "subestacao-vizinha-silhueta"), o("cod", "centro-de-operacao", "telão apagado", "telão com mapa"), o("radioWaves", "ondas-de-radio"), o("sensorIcons", "icones-sensor-2d")],
    animations: [
      { type: "interpolate", target: "sensors.pulse", startFrame: W("s12", 4), endFrame: W("s12", 4) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "radio.waves", startFrame: W("s12", 11), endFrame: W("s12", 15), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "cod.screen", startFrame: W("s12", 15), endFrame: W("s12", 15) + 15, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "QUEM COORDENA?", variant: "warning", icon: "?", appearAt: 8, disappearAt: W("s12", 4) - 2 },
      { text: "COMUNICAÇÃO", subtitle: "Sensores + rádio", variant: "info", appearAt: W("s12", 4), disappearAt: end(11) },
    ],
    highlights: ["SENSORES", "CORRENTE", "RÁDIO", "CELULAR", "CENTRO", "OPERAÇÃO"],
    captions: [cap("s12", "E quem coordena tudo?", W("s12", 4)), { text: "Sensores medem a corrente e avisam, por rádio ou celular, o centro de operação.", from: W("s12", 4), to: end(11) }],
    audioCues: [narration("s12", "ready"), sfx("badge", 8, 0.26), sfx("beep", W("s12", 11), 0.2), sfx("beep", W("s12", 13), 0.2), sfx("badge", W("s12", 4), 0.26)],
  },
  // 13 — software / self-healing
  {
    id: "scene-13-self-healing",
    startFrame: sc(12).from,
    durationInFrames: sc(12).durationInFrames,
    voKey: "s13",
    narration: "Um software escolhe as manobras e devolve a energia em poucos minutos: é o self-healing.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.codWide2), key(s(1.3), P.codScreen, "soft"), key(s(4.0), orbit([-1, 1.25, -10.8], 7, 6, 5), "linear"), key(s(5.3), P.streetFix, "soft"), key(end(12), P.streetFix)] },
    objects: [...base(), o("recloser", "religador", "fechado"), o("tree", "arvore-grande", "caída sobre os fios"), o("switch1", "chave-automatica", "aberta"), o("switch2", "chave-automatica", "aberta"), o("tieSwitch", "chave-NA", "fechada"), o("neighborLine", "circuito-vizinho"), o("neighborSub", "subestacao-vizinha-silhueta"), o("cod", "centro-de-operacao", "telão com mapa"), o("codMap", "mapa-2d-telao"), o("clock2d", "relogio-2d")],
    animations: [
      { type: "interpolate", target: "cod.mapSteps", startFrame: W("s13", 2), endFrame: W("s13", 8), from: 0, to: 4, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "clock.spin", startFrame: W("s13", 9), endFrame: W("s13", 11) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "sky.dark", startFrame: W("s13", 8), endFrame: W("s13", 8) + 30, from: 0.15, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "SELF-HEALING", subtitle: "Rede autorregenerativa", variant: "info", appearAt: W("s13", 14), disappearAt: end(12) }],
    highlights: ["SOFTWARE", "MANOBRAS", "ENERGIA", "MINUTOS", "SELF-HEALING"],
    captions: [cap("s13", "Um software escolhe as manobras", W("s13", 5)), { text: "e devolve a energia em poucos minutos: é o self-healing.", from: W("s13", 5), to: end(12) }],
    audioCues: [narration("s13", "ready"), sfx("whoosh-soft", 0, 0.18), sfx("blip", W("s13", 3), 0.18), sfx("blip", W("s13", 5), 0.18), sfx("blip", W("s13", 7), 0.18), sfx("tick", W("s13", 10), 0.2), sfx("badge", W("s13", 14), 0.3)],
  },
  // 14 — conclusão
  {
    id: "scene-14-conclusao",
    startFrame: sc(13).from,
    durationInFrames: sc(13).durationInFrames,
    voKey: "s14",
    narration: "A equipe só vai até a árvore. Pronto: agora você entende como a rede dos postes se protege sozinha.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.streetFix), key(s(1.0), orbit([2, 2.4, 1.5], 16, -30, 14), "soft"), key(s(3.0), orbit([2.5, 2.6, 1.5], 15, -38, 15), "linear"), key(s(7.7), P.final, "soft"), key(end(13), P.final)] },
    objects: [...base(), o("recloser", "religador", "fechado"), o("tree", "arvore-grande", "caída sobre os fios"), o("switch1", "chave-automatica", "aberta"), o("switch2", "chave-automatica", "aberta"), o("tieSwitch", "chave-NA", "fechada"), o("neighborLine", "circuito-vizinho"), o("neighborSub", "subestacao-vizinha-silhueta"), o("cod", "centro-de-operacao", "telão com mapa"), o("truck", "caminhao-cesto", "fora de cena", "no trecho C, cesto erguido"), o("finalLabels", "rotulos-3d")],
    animations: [
      { type: "interpolate", target: "truck.x", startFrame: 5, endFrame: 70, from: 12, to: 2, easing: "out", unit: "u3d" },
      { type: "interpolate", target: "truck.boom", startFrame: 70, endFrame: 100, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "final.labels", startFrame: W("s14", 7), endFrame: W("s14", 7) + 40, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(13) - 18, endFrame: end(13), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [
      { text: "SÓ O TRECHO COM DEFEITO", variant: "positive", appearAt: 20, disappearAt: W("s14", 7) - 4 },
      { text: "AUTOMAÇÃO DA REDE", subtitle: "Esquema simplificado", variant: "info", size: "large", appearAt: W("s14", 7), disappearAt: end(13) },
    ],
    highlights: ["EQUIPE", "ÁRVORE", "PRONTO", "REDE", "POSTES", "PROTEGE"],
    captions: [cap("s14", "A equipe só vai até a árvore.", W("s14", 7)), { text: "Pronto: agora você entende como a rede dos postes se protege sozinha.", from: W("s14", 7), to: end(13) - 18 }],
    audioCues: [narration("s14", "ready"), sfx("engine", 5, 0.18), sfx("badge", 20, 0.26), sfx("badge-final", W("s14", 7), 0.32)],
  },
];

/** Valor de uma trilha de animação (ex.: "segB.power") no frame global. */
export const track = (target: string, frame: number, fallback = 0) => evaluateTrack(scenes, target, frame, FPS, fallback);

export const sceneAt = (frame: number) => {
  for (let i = scenes.length - 1; i >= 0; i--) if (frame >= scenes[i].startFrame) return scenes[i];
  return scenes[0];
};

export const isVisible = (id: string, frame: number) => sceneAt(frame).objects.some((ob) => ob.id === id && ob.visible);

// Integridade: cenas contíguas a partir de 0 e somando a duração total.
{
  let cursor = 0;
  for (const scn of scenes) {
    if (scn.startFrame !== cursor) throw new Error(`${scn.id}: começa em ${scn.startFrame}, esperado ${cursor}`);
    cursor += scn.durationInFrames;
  }
  if (cursor !== DURATION) throw new Error(`Soma das cenas = ${cursor}, esperado ${DURATION}`);
}
