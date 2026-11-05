// scenes.ts — Roteiro v1 "Como funciona uma TV de tubo?" (aprovado em 2026-11-05).
// Ajustes técnicos da Fase 2: distâncias de câmera recalculadas para o quadro vertical (px/u ≈ 4516/d),
// trilhas extras de fundo/sala (bg.inside, screen.power) e status de áudio "ready".
// Contrato de dados no formato de assets/template/src/data/scenes.ts: na Fase 2 este arquivo vira
// src/data/scenes.ts sem tradução. Frames de animações/badges/legendas/câmera/áudio são LOCAIS à cena.
//
// Em src/utils/timing.ts (Fase 2) configure:
//   export const SECONDS = 90;
//   export const VO_KEYS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15"] as const;
//   const PLANNED_SECONDS = [8.17, 5.58, 5.58, 5.91, 6.58, 4.91, 6.25, 4.57, 4.24, 6.25, 6.58, 4.57, 6.92, 6.92, 6.97];
//   const GAPS = Array(14).fill(0.55);
// Cortes planejados (frames globais): 0,245,412,580,757,955,1102,1289,1427,1554,1741,1939,2076,2283,2491,2700.
//
// Mapa do mundo (u3d). Eixo do tubo ao longo de z; a tela olha para +z.
//   screen  : face de vidro 4 × 3 (4:3), centro (0,0,0); camada de fósforo em z=−0,05
//   mask    : máscara de sombra em z=−0,25 (só a partir da cena 14)
//   funnel  : cone de vidro de z=−0,1 (borda da tela) a z=−3,4 (raio 0,35)
//   anode   : botão + cabo vermelho em (0; 1,75; −2,0); revestimento interno condutor (azul ao energizar)
//   yoke    : bobinas de deflexão em volta de z=−3,9…−3,2 (par H laranja nas laterais; par V cobre em cima/baixo)
//   neck    : gargalo r=0,35 de z=−3,4 a z=−6,6; ponta de selagem em z=−6,6
//   gun     : cátodo (z=−6,2, aquecedor laranja) → grade de controle (z=−5,95) → anéis de foco/aceleração (z=−5,6…−5,2)
//   beam    : linha reta do canhão (0,0,−5,2) até o centro da bobina e depois até o ponto (beam.x·2; beam.y·1,5; −0,05)
//   cabinet : gabinete de madeira 5,2 × 4,2 × 7,5 com botões; `cabinet.cut` o torna transparente/em corte

import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HAS_VO, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };
export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-sala-retro", language: "pt-BR" };

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
const lin = (target: string, startFrame: number, endFrame: number, from: number | undefined, to: number, easing: EaseName = "inOut", unit: TrackAnimation["unit"] = "0-1"): TrackAnimation =>
  ({ type: "interpolate", target, startFrame, endFrame, from, to, easing, unit });
const spr = (target: string, startFrame: number, from: number | undefined, to: number, damping = 12, unit: TrackAnimation["unit"] = "0-1"): TrackAnimation =>
  ({ type: "spring", target, startFrame, endFrame: startFrame + 32, from, to, damping, unit });

// Poses compartilhadas (continuidade espacial): orbit(alvo, distância, azimute°, elevação°)
const P = {
  roomOpen: orbit([0, -0.2, 0], 20, 8, 4),            // TV desligada, de frente, quase preenchendo o quadro
  tvFront: orbit([0, -0.3, -1], 30, 18, 8),           // TV inteira na sala
  tvSide: orbit([0, -0.3, -3.2], 40, 62, 16),         // TV em corte, tubo inteiro
  screenInner: orbit([0.8, 0.4, -0.6], 7, 112, 14),   // por dentro do tubo: face interna do fósforo
  tubeAll: orbit([0, 0, -3.2], 34, 72, 16),           // do canhão à tela
  gunClose: orbit([0, 0, -5.9], 6.5, 75, 12),         // canhão no fundo do gargalo
  neckMid: orbit([0, 0, -4.6], 14, 80, 14),           // gargalo + começo do funil
  anodeView: orbit([0, 0.6, -2.6], 17, 60, 25),       // funil de cima/lado, botão do ânodo
  frontScreen: orbit([0, 0, 0], 19, 0, 0),            // tela inteira de frente
  yokeClose: orbit([0, 0, -3.6], 9, 60, 20),          // bobinas no gargalo
  behind: orbit([0, 0, -1.8], 30, 150, 12),           // por trás: leque do feixe até a tela
  screenWide: orbit([0, 0, 0], 19, 10, 4),
  triadClose: orbit([0.6, 0.4, -0.05], 1.6, 10, 5),   // pontinhos RGB
  maskClose: orbit([0.6, 0.4, -0.15], 1.7, 145, 18),  // por trás: máscara na frente do fósforo
  final: orbit([0, -0.2, -3], 38, 45, 18),
};
// Poses de passagem (fim de uma cena = início da próxima)
const C = {
  c1: orbit([0, -0.3, -3.2], 39, 68, 17),
  c2: orbit([0.8, 0.4, -0.6], 6.4, 104, 12),
  c3: orbit([0, 0, -5.9], 6, 85, 10),
  c4: orbit([0, 0, -5.3], 12.5, 100, 14),
  c5: orbit([0, 0, -3.2], 33, 70, 15),
  c6: orbit([0, 0, 0], 16.5, 4, 2),
  c7: orbit([0, 0, -1.8], 30, 160, 14),
  c8: orbit([0, 0, -1.6], 28, 24, 8),
  c9: orbit([0, 0, 0], 19, 8, 3),
  c10: orbit([0, 0, 0], 18, 10, 4),
  c11: orbit([0, -0.2, 0], 22, -10, 4),
  c13: orbit([0, 0, -5.9], 6.5, 70, 14),
  c14: orbit([0, 0, 0], 19, 14, 4),
};

const o = (id: string, type: string, start?: string, endState?: string): SceneObject =>
  start ? { id, type, visible: true, state: { start, end: endState ?? start } } : { id, type, visible: true };
// Objetos persistentes do tubo (ids estáveis). Peças "reveladas" ficam até o fim.
const tube = (): SceneObject[] => [
  o("cabinet", "gabinete-madeira"), o("screen", "tela-vidro-4x3"), o("funnel", "funil-de-vidro"),
  o("neck", "gargalo"), o("gun", "canhao-de-eletrons"), o("room", "sala-retro-fundo"),
];

export const scenes: ScenePlan[] = [
  // 1 — gancho
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você liga a TV de tubo e a imagem aparece. Mas lá dentro não tem pixel: só um feixe invisível desenhando tudo.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.roomOpen), key(s(3.2), P.tvFront, "soft"), key(W("s1", 10), P.tvFront), key(W("s1", 17), P.tvSide, "inOut"), key(end(0), C.c1, "linear")] },
    objects: [...tube(), o("knob", "botao-liga"), o("beam", "feixe", "invisível", "varrendo a tela")],
    animations: [
      spr("knob.turn", W("s1", 1), 0, 1, 12),
      lin("screen.power", W("s1", 1) + 10, W("s1", 1) + 28, 0, 1, "out"),       // linha horizontal que se abre
      lin("screen.image", W("s1", 1) + 18, W("s1", 1) + 36, 0, 1, "out"),
      lin("cabinet.cut", W("s1", 10), W("s1", 10) + 40, 0, 1, "inOut"),
      lin("bg.inside", W("s1", 10), W("s1", 10) + 40, 0, 1, "inOut"),
      lin("beam.visible", W("s1", 18), W("s1", 18) + 8, 0, 1, "out"),
      lin("scan.on", W("s1", 18), W("s1", 18) + 1, 0, 1, "linear"),
      lin("scan.speed", W("s1", 18), W("s1", 18) + 1, 1, 1, "linear"),
    ],
    badges: [{ text: "QUEM DESENHA A IMAGEM?", variant: "warning", icon: "?", appearAt: W("s1", 10), disappearAt: end(0) - 4 }],
    highlights: ["TV", "TUBO", "IMAGEM", "PIXEL", "FEIXE", "INVISÍVEL"],
    captions: [cap("s1", "Você liga a TV de tubo e a imagem aparece.", W("s1", 10)), { text: "Mas lá dentro não tem pixel: só um feixe invisível desenhando tudo.", from: W("s1", 10), to: end(0) }],
    audioCues: [narration("s1", HAS_VO ? "ready" : "planned"), sfx("whoosh-soft", 0, 0.3), sfx("knob-click", W("s1", 1) + 6, 0.4), sfx("crt-on", W("s1", 1) + 10, 0.3), sfx("whoosh-soft", W("s1", 10), 0.22), sfx("badge", W("s1", 10), 0.28)],
  },
  // 2 — fósforo
  {
    id: "scene-02-fosforo",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "A tela é pintada por dentro com fósforo, que brilha quando leva pancada de elétrons.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, C.c1), key(s(1.6), P.screenInner, "soft"), key(end(1), C.c2, "linear")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo", "oculta", "revelada em corte"), o("electronHits", "eletrons-de-teste")],
    animations: [
      lin("beam.visible", 0, 10, 1, 0, "out"),
      lin("scan.on", 0, 1, 1, 0, "linear"),
      lin("screen.power", 0, 15, 1, 0, "out"),
      lin("screen.image", 0, 15, 1, 0, "out"),
      lin("screen.cutaway", 10, 45, 0, 1, "inOut"),
      lin("phosphor.reveal", W("s2", 7) - 8, W("s2", 7) + 8, 0, 1, "out"),
      lin("electronHits.burst", W("s2", 12) - 4, W("s2", 14) + 10, 0, 1, "linear"), // 6 elétrons semeados → 6 lampejos
    ],
    badges: [{ text: "FÓSFORO", subtitle: "Brilha quando é atingido", variant: "info", appearAt: W("s2", 7), disappearAt: end(1) - 4 }],
    highlights: ["TELA", "FÓSFORO", "BRILHA", "PANCADA", "ELÉTRONS"],
    captions: [cap("s2", "A tela é pintada por dentro com fósforo,", W("s2", 8)), { text: "que brilha quando leva pancada de elétrons.", from: W("s2", 8), to: end(1) }],
    audioCues: [narration("s2", HAS_VO ? "ready" : "planned"), sfx("whoosh-soft", 0, 0.24), sfx("badge", W("s2", 7), 0.28), sfx("zap-small", W("s2", 12), 0.22), sfx("zap-small", W("s2", 13), 0.2)],
  },
  // 3 — canhão de elétrons
  {
    id: "scene-03-canhao",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Os elétrons saem de um cátodo aquecido, no fundo do tubo: o canhão de elétrons.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, C.c2), key(s(1.3), P.tubeAll, "soft"), key(s(2.6), P.gunClose, "soft"), key(end(2), C.c3, "linear")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo"), o("cathode", "catodo", "frio", "incandescente"), o("electronCloud", "nuvem-de-eletrons", "vazia", "cheia"), o("labels", "rotulos-3d")],
    animations: [
      lin("screen.cutaway", 0, 30, 1, 0, "inOut"),
      lin("cathode.heat", W("s3", 6) - 6, W("s3", 6) + 18, 0, 1, "out"),
      lin("electronCloud.amount", W("s3", 6) + 10, W("s3", 6) + 50, 0, 1, "out"),
      spr("label.cathode", W("s3", 5), 0, 1, 12),
      lin("gun.highlight", W("s3", 12) - 4, W("s3", 12) + 10, 0, 1, "out"),
    ],
    badges: [{ text: "CANHÃO DE ELÉTRONS", subtitle: "Cátodo aquecido solta elétrons", variant: "info", appearAt: W("s3", 12), disappearAt: end(2) - 4 }],
    highlights: ["ELÉTRONS", "CÁTODO", "AQUECIDO", "FUNDO", "CANHÃO"],
    captions: [cap("s3", "Os elétrons saem de um cátodo aquecido,", W("s3", 7)), { text: "no fundo do tubo: o canhão de elétrons.", from: W("s3", 7), to: end(2) }],
    audioCues: [narration("s3", HAS_VO ? "ready" : "planned"), sfx("whoosh-soft", 0, 0.24), sfx("heat-hum", W("s3", 6) - 6, 0.16), sfx("badge", W("s3", 12), 0.28)],
  },
  // 4 — vácuo
  {
    id: "scene-04-vacuo",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "No ar, eles batem em moléculas e se perdem. Por isso o tubo é a vácuo.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, C.c3), key(s(1.2), P.neckMid, "soft"), key(W("s4", 9), orbit([0, 0, -5.2], 13, 95, 16), "linear"), key(end(3), C.c4, "soft")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo"), o("cathode", "catodo", "incandescente"), o("air", "moleculas-de-ar", "tubo cheio", "removidas"), o("sealTip", "ponta-de-selagem", "aberta", "selada"), o("labels", "rotulos-3d")],
    animations: [
      lin("air.amount", 0, 1, 1, 1, "linear"),
      lin("electrons.fire", W("s4", 2), W("s4", 2) + 30, 0, 1, "linear"),
      lin("electrons.scatter", W("s4", 3), W("s4", 8) + 10, 0, 1, "out"),   // ricocheteiam e somem antes de chegar
      lin("air.amount", W("s4", 9), W("s4", 15), 1, 0, "in"),               // moléculas saem pela ponta
      spr("sealTip.sealed", W("s4", 15), 0, 1, 14),
      lin("electrons.scatter", W("s4", 15), W("s4", 15) + 10, 1, 0, "out"),
    ],
    badges: [
      { text: "AR NO CAMINHO", variant: "negative", appearAt: W("s4", 3), disappearAt: W("s4", 13) - 4 },
      { text: "VÁCUO", subtitle: "Ar retirado e tubo selado", variant: "positive", appearAt: W("s4", 14), disappearAt: end(3) - 4 },
    ],
    highlights: ["AR", "BATEM", "MOLÉCULAS", "PERDEM", "VÁCUO"],
    captions: [cap("s4", "No ar, eles batem em moléculas e se perdem.", W("s4", 9)), { text: "Por isso o tubo é a vácuo.", from: W("s4", 9), to: end(3) }],
    audioCues: [narration("s4", HAS_VO ? "ready" : "planned"), sfx("pings", W("s4", 3), 0.2), sfx("badge-neg", W("s4", 3), 0.26), sfx("vacuum-hiss", W("s4", 9), 0.22), sfx("seal-tick", W("s4", 15), 0.3), sfx("badge", W("s4", 14), 0.28)],
  },
  // 5 — ânodo / alta tensão
  {
    id: "scene-05-anodo",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "E saem lentos. Então o ânodo, com dezenas de milhares de volts, acelera o feixe até a tela.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, C.c4), key(W("s5", 4), P.anodeView, "soft"), key(W("s5", 11), P.anodeView), key(W("s5", 15), P.tubeAll, "soft"), key(end(4), C.c5, "linear")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo"), o("cathode", "catodo"), o("sealTip", "ponta-de-selagem", "selada"), o("anode", "anodo-alta-tensao", "desligado", "energizado"), o("beam", "feixe", "elétrons soltos e lentos", "feixe fino no centro da tela"), o("labels", "rotulos-3d")],
    animations: [
      lin("electrons.fire", 0, 1, 1, 1, "linear"),
      lin("electrons.speed", 0, 1, 0.15, 0.15, "linear"),
      lin("anode.on", W("s5", 5) - 4, W("s5", 5) + 14, 0, 1, "out"),
      spr("label.anode", W("s5", 5), 0, 1, 12),
      lin("electrons.speed", W("s5", 12) - 4, W("s5", 12) + 14, 0.15, 1, "in"),
      lin("beam.visible", W("s5", 12), W("s5", 12) + 10, 0, 1, "out"),
      lin("electrons.fire", W("s5", 12) + 10, W("s5", 12) + 16, 1, 0, "linear"), // nuvem solta vira feixe
      lin("beam.x", 0, 1, 0, 0, "linear", "u3d"),
      lin("beam.y", 0, 1, 0, 0, "linear", "u3d"),
      lin("screen.dot", W("s5", 16), W("s5", 16) + 8, 0, 1, "out"),
    ],
    badges: [
      { text: "ELÉTRONS LENTOS", variant: "negative", appearAt: W("s5", 1), disappearAt: W("s5", 5) - 4 },
      { text: "ÂNODO", subtitle: "~25 mil volts numa TV colorida", variant: "positive", appearAt: W("s5", 5), disappearAt: end(4) - 4 },
    ],
    highlights: ["LENTOS", "ÂNODO", "MILHARES", "VOLTS", "ACELERA", "FEIXE"],
    captions: [cap("s5", "E saem lentos.", W("s5", 3)), { text: "Então o ânodo, com dezenas de milhares de volts,", from: W("s5", 3), to: W("s5", 12) }, { text: "acelera o feixe até a tela.", from: W("s5", 12), to: end(4) }],
    audioCues: [narration("s5", HAS_VO ? "ready" : "planned"), sfx("badge-neg", W("s5", 1), 0.24), sfx("charge-up", W("s5", 5) - 4, 0.24), sfx("badge", W("s5", 5), 0.28), sfx("zap-beam", W("s5", 12), 0.26)],
  },
  // 6 — um ponto só
  {
    id: "scene-06-ponto",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Só que o feixe acerta sempre o meio da tela. Um pontinho só.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, C.c5), key(s(1.5), P.frontScreen, "soft"), key(end(5), C.c6, "linear")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo"), o("anode", "anodo-alta-tensao", "energizado"), o("beam", "feixe", "fixo no centro"), o("spot", "ponto-brilhante")],
    animations: [
      lin("screen.dot", 0, 1, 1, 1, "linear"),
      lin("spot.pulse", W("s6", 10), W("s6", 12) + 10, 0, 1, "linear"),
      lin("cabinet.cut", 0, s(1.5), 1, 0.35, "inOut"), // de frente, a moldura volta meio transparente
    ],
    badges: [{ text: "SÓ UM PONTO", variant: "negative", appearAt: W("s6", 4), disappearAt: end(5) - 4 }],
    highlights: ["FEIXE", "SEMPRE", "MEIO", "PONTINHO"],
    captions: [cap("s6", "Só que o feixe acerta sempre o meio da tela.", W("s6", 10)), { text: "Um pontinho só.", from: W("s6", 10), to: end(5) }],
    audioCues: [narration("s6", HAS_VO ? "ready" : "planned"), sfx("whoosh-soft", 0, 0.22), sfx("badge-neg", W("s6", 4), 0.26), sfx("blip", W("s6", 11), 0.2)],
  },
  // 7 — bobinas de deflexão
  {
    id: "scene-07-bobinas",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Então bobinas no gargalo criam um campo magnético que entorta o feixe na horizontal e na vertical.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, C.c6), key(s(1.2), P.yokeClose, "soft"), key(W("s7", 11), orbit([0, 0, -3.6], 10, 75, 22), "linear"), key(W("s7", 13), P.behind, "soft"), key(end(6), C.c7, "linear")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo"), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "fora do gargalo", "instaladas"), o("field", "linhas-de-campo"), o("beam", "feixe", "fixo no centro", "desviado"), o("labels", "rotulos-3d")],
    animations: [
      lin("cabinet.cut", 0, s(1), 0.35, 1, "inOut"),
      spr("yoke.install", W("s7", 1), 0, 1, 11),
      lin("field.show", W("s7", 6) - 4, W("s7", 7) + 10, 0, 1, "out"),
      lin("beam.x", W("s7", 13), W("s7", 13) + 10, 0, 0.9, "inOut", "u3d"),
      lin("beam.x", W("s7", 13) + 10, W("s7", 14) + 6, 0.9, -0.9, "inOut", "u3d"),
      lin("beam.y", W("s7", 16), W("s7", 16) + 10, 0, 0.8, "inOut", "u3d"),
      lin("beam.y", W("s7", 16) + 10, end(6) - 4, 0.8, -0.8, "inOut", "u3d"),
      spr("label.yoke", W("s7", 1), 0, 1, 12),
    ],
    badges: [{ text: "BOBINAS DE DEFLEXÃO", subtitle: "Ímã elétrico desvia o feixe", variant: "positive", appearAt: W("s7", 9), disappearAt: end(6) - 4 }],
    highlights: ["BOBINAS", "GARGALO", "CAMPO", "MAGNÉTICO", "ENTORTA", "HORIZONTAL", "VERTICAL"],
    captions: [cap("s7", "Então bobinas no gargalo criam um campo magnético", W("s7", 8)), { text: "que entorta o feixe na horizontal e na vertical.", from: W("s7", 8), to: end(6) }],
    audioCues: [narration("s7", HAS_VO ? "ready" : "planned"), sfx("clunk", W("s7", 1) + 8, 0.3), sfx("magnet-hum", W("s7", 6), 0.16), sfx("badge", W("s7", 9), 0.28), sfx("swish", W("s7", 13), 0.2), sfx("swish", W("s7", 16), 0.2)],
  },
  // 8 — varredura
  {
    id: "scene-08-varredura",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Agora ele varre a tela linha por linha, de cima para baixo.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, C.c7), key(s(1.2), orbit([0, 0, -1.6], 30, 38, 10), "soft"), key(end(7), C.c8, "linear")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo"), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("beam", "feixe", "desviado", "varrendo"), o("raster", "linhas-de-varredura", "nenhuma", "tela coberta")],
    animations: [
      lin("scan.on", W("s8", 2), W("s8", 2) + 1, 0, 1, "linear"),
      lin("scan.speed", W("s8", 2), W("s8", 2) + 1, 0.08, 0.08, "linear"),  // lento: 12 linhas esquemáticas visíveis
      lin("raster.fill", W("s8", 2), W("s8", 11) + 6, 0, 1, "linear"),
      lin("raster.arrows", W("s8", 5) - 4, W("s8", 5) + 10, 0, 1, "out"),    // setas → e ↓ em 2D sobre a tela
      lin("raster.arrows", end(7) - 10, end(7), 1, 0, "in"),
    ],
    badges: [{ text: "VARREDURA", subtitle: "Linha por linha", variant: "info", appearAt: W("s8", 2), disappearAt: end(7) - 4 }],
    highlights: ["VARRE", "LINHA", "CIMA", "BAIXO"],
    captions: [cap("s8", "Agora ele varre a tela linha por linha,", W("s8", 8)), { text: "de cima para baixo.", from: W("s8", 8), to: end(7) }],
    audioCues: [narration("s8", HAS_VO ? "ready" : "planned"), sfx("badge", W("s8", 2), 0.28), sfx("scan-tick", W("s8", 2), 0.14)],
  },
  // 9 — tela só branca
  {
    id: "scene-09-branca",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Mas, com o feixe sempre igual, a tela fica só branca.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, C.c8), key(end(8), C.c9, "soft")] },
    objects: [...tube(), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("beam", "feixe", "varrendo, intensidade fixa"), o("raster", "linhas-de-varredura", "tela coberta, branca")],
    animations: [
      lin("scan.speed", 0, s(1.2), 0.08, 1, "in"),
      lin("raster.fill", 0, 1, 1, 1, "linear"),
      lin("raster.flat", W("s9", 6), W("s9", 8), 0, 1, "out"),   // tela uniforme cinza-clara
      lin("cabinet.cut", 0, end(8), 1, 0.35, "inOut"),
    ],
    badges: [{ text: "SEM IMAGEM", variant: "negative", appearAt: W("s9", 8), disappearAt: end(8) - 4 }],
    highlights: ["FEIXE", "IGUAL", "TELA", "BRANCA"],
    captions: [cap("s9", "Mas, com o feixe sempre igual,", W("s9", 6)), { text: "a tela fica só branca.", from: W("s9", 6), to: end(8) }],
    audioCues: [narration("s9", HAS_VO ? "ready" : "planned"), sfx("badge-neg", W("s9", 8), 0.26)],
  },
  // 10 — grade de controle (brilho)
  {
    id: "scene-10-grade",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Então o sinal da TV controla uma grade no canhão: mais elétrons, ponto claro; menos, ponto escuro.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, C.c9), key(s(1.2), P.gunClose, "soft"), key(W("s10", 10), orbit([0, 0, -5.9], 5.5, 80, 12), "linear"), key(W("s10", 12), P.screenWide, "soft"), key(end(9), C.c10, "linear")] },
    objects: [...tube(), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("grid", "grade-de-controle", "aberta fixa", "abre e fecha com o sinal"), o("signal", "onda-de-sinal", "ausente", "chegando pelo cabo"), o("beam", "feixe", "intensidade fixa", "intensidade variável"), o("labels", "rotulos-3d")],
    animations: [
      lin("cabinet.cut", 0, s(1), 0.35, 1, "inOut"),
      lin("signal.on", W("s10", 2) - 4, W("s10", 2) + 12, 0, 1, "out"),
      lin("signal.amp", W("s10", 7) - 4, W("s10", 7) + 12, 0, 1, "out"),       // grade e espessura do feixe seguem a onda
      spr("label.grid", W("s10", 7), 0, 1, 12),
      lin("raster.flat", W("s10", 12), W("s10", 12) + 30, 1, 0, "inOut"),
      lin("screen.image", W("s10", 12), W("s10", 16) + 10, 0, 1, "linear"),   // imagem P&B surge linha a linha
      lin("brightness.tags", W("s10", 12) - 4, W("s10", 12) + 8, 0, 1, "out"), // "+ elétrons → claro" / "− elétrons → escuro"
    ],
    badges: [{ text: "GRADE DE CONTROLE", subtitle: "Dosa os elétrons: o brilho", variant: "positive", appearAt: W("s10", 7), disappearAt: end(9) - 4 }],
    highlights: ["SINAL", "GRADE", "CANHÃO", "MAIS", "CLARO", "MENOS", "ESCURO"],
    captions: [cap("s10", "Então o sinal da TV controla uma grade no canhão:", W("s10", 10)), { text: "mais elétrons, ponto claro; menos, ponto escuro.", from: W("s10", 10), to: end(9) }],
    audioCues: [narration("s10", HAS_VO ? "ready" : "planned"), sfx("signal-warble", W("s10", 2), 0.14), sfx("badge", W("s10", 7), 0.28), sfx("whoosh-soft", W("s10", 12), 0.2)],
  },
  // 11 — velocidade / entrelaçamento
  {
    id: "scene-11-velocidade",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Um ponto por vez, mas rápido: no Brasil, quinhentas e vinte e cinco linhas, sessenta meias-telas por segundo.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, C.c10), key(W("s11", 4), orbit([0, 0, 0], 17.5, 0, 2), "soft"), key(W("s11", 13), orbit([0, 0, 0], 19, -6, 3), "linear"), key(end(10), C.c11, "soft")] },
    objects: [...tube(), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("beam", "feixe"), o("interlace", "destaque-linhas-impares-pares"), o("counter2d", "contadores-2d")],
    animations: [
      lin("cabinet.cut", 0, s(1), 1, 0.35, "inOut"),
      lin("scan.speed", 0, 1, 0.03, 0.03, "linear"),                 // câmera lenta: ponto visível andando
      lin("scan.speed", W("s11", 4), W("s11", 5) + 20, 0.03, 1, "in"),
      lin("counter.lines", W("s11", 8), W("s11", 13), 0, 525, "out", "px"),
      lin("interlace.show", W("s11", 14) - 4, W("s11", 15) + 8, 0, 1, "out"), // ímpares (amarelo) depois pares (ciano), em loop
      lin("counter.fields", W("s11", 14), W("s11", 17), 0, 60, "out", "px"),
      lin("interlace.show", end(10) - 14, end(10), 1, 0, "in"),
    ],
    badges: [{ text: "PAL-M", subtitle: "525 linhas · 60 campos/s, entrelaçado", variant: "info", appearAt: W("s11", 7), disappearAt: end(10) - 4 }],
    highlights: ["PONTO", "RÁPIDO", "BRASIL", "LINHAS", "SESSENTA", "MEIAS-TELAS", "SEGUNDO"],
    captions: [cap("s11", "Um ponto por vez, mas rápido:", W("s11", 6)), { text: "no Brasil, 525 linhas,", from: W("s11", 6), to: W("s11", 14) }, { text: "sessenta meias-telas por segundo.", from: W("s11", 14), to: end(10) }],
    audioCues: [narration("s11", HAS_VO ? "ready" : "planned"), sfx("speed-rise", W("s11", 4), 0.22), sfx("badge", W("s11", 7), 0.28), sfx("tick-count", W("s11", 8), 0.14)],
  },
  // 12 — persistência
  {
    id: "scene-12-persistencia",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "O fósforo segura o brilho, e seu olho vê uma imagem inteira.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, C.c11), key(end(11), P.tvFront, "soft")] },
    objects: [...tube(), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("beam", "feixe", "varrendo rápido"), o("trail", "rastro-de-brilho"), o("eye2d", "icone-olho-2d")],
    animations: [
      lin("trail.show", W("s12", 2) - 4, W("s12", 4) + 6, 0, 1, "out"),   // inserto: rastro que esmaece atrás do ponto
      lin("cabinet.cut", 0, end(11), 0.35, 0, "inOut"),
      spr("eye.show", W("s12", 7), 0, 1, 11),
      lin("trail.show", W("s12", 10) - 4, W("s12", 10) + 8, 1, 0, "in"),
      lin("screen.image", 0, 1, 1, 1, "linear"),
      lin("bg.inside", 0, end(11), 1, 0, "inOut"),
    ],
    badges: [{ text: "IMAGEM INTEIRA", subtitle: "Fósforo + olho", variant: "positive", appearAt: W("s12", 10), disappearAt: end(11) - 4 }],
    highlights: ["FÓSFORO", "SEGURA", "BRILHO", "OLHO", "IMAGEM", "INTEIRA"],
    captions: [cap("s12", "O fósforo segura o brilho,", W("s12", 5)), { text: "e seu olho vê uma imagem inteira.", from: W("s12", 5), to: end(11) }],
    audioCues: [narration("s12", HAS_VO ? "ready" : "planned"), sfx("shimmer", W("s12", 2), 0.18), sfx("pop", W("s12", 7), 0.24), sfx("badge", W("s12", 10), 0.28)],
  },
  // 13 — cor: RGB e três feixes
  {
    id: "scene-13-cor",
    startFrame: sc(12).from,
    durationInFrames: sc(12).durationInFrames,
    voKey: "s13",
    narration: "Mas assim é tudo preto e branco. Para ter cor, são pontinhos vermelhos, verdes e azuis, e três feixes.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.tvFront), key(W("s13", 7), P.screenWide, "soft"), key(W("s13", 11), P.triadClose, "soft"), key(W("s13", 15) + 6, P.triadClose), key(W("s13", 17) - 4, P.gunClose, "soft"), key(end(12), C.c13, "linear")] },
    objects: [...tube(), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("triads", "fosforo-rgb", "camada branca", "pontos R G B"), o("gun", "canhao-de-eletrons", "1 cátodo", "3 cátodos"), o("beam", "feixe", "1 feixe", "3 feixes")],
    animations: [
      lin("cabinet.cut", W("s13", 7) - 10, W("s13", 7) + 10, 0, 1, "inOut"),
      lin("bg.inside", W("s13", 7) - 10, W("s13", 7) + 10, 0, 1, "inOut"),
      lin("triads.show", W("s13", 11) - 4, W("s13", 15) + 4, 0, 1, "linear"),   // R em "vermelhos", G em "verdes", B em "azuis"
      spr("gun.count", W("s13", 17), 1, 3, 12, "px"),
      lin("beam.colors", W("s13", 17), W("s13", 18) + 6, 0, 1, "out"),           // cores só de identificação (esquemático)
    ],
    badges: [
      { text: "PRETO E BRANCO", variant: "negative", appearAt: W("s13", 4), disappearAt: W("s13", 11) - 4 },
      { text: "RGB + 3 FEIXES", subtitle: "Vermelho, verde e azul", variant: "positive", appearAt: W("s13", 11), disappearAt: end(12) - 4 },
    ],
    highlights: ["PRETO", "BRANCO", "COR", "VERMELHOS", "VERDES", "AZUIS", "TRÊS", "FEIXES"],
    captions: [cap("s13", "Mas assim é tudo preto e branco.", W("s13", 7)), { text: "Para ter cor, são pontinhos vermelhos, verdes e azuis,", from: W("s13", 7), to: W("s13", 16) }, { text: "e três feixes.", from: W("s13", 16), to: end(12) }],
    audioCues: [narration("s13", HAS_VO ? "ready" : "planned"), sfx("badge-neg", W("s13", 4), 0.26), sfx("pop", W("s13", 11), 0.2), sfx("pop", W("s13", 13), 0.2), sfx("pop", W("s13", 15), 0.2), sfx("badge", W("s13", 11), 0.28), sfx("clunk", W("s13", 17), 0.26)],
  },
  // 14 — máscara de sombra
  {
    id: "scene-14-mascara",
    startFrame: sc(13).from,
    durationInFrames: sc(13).durationInFrames,
    voKey: "s14",
    narration: "Só que um feixe acertaria a cor errada. Então uma máscara furada faz cada um acertar só a sua.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, C.c13), key(s(1.3), P.maskClose, "soft"), key(W("s14", 15), orbit([0.6, 0.4, -0.15], 1.85, 135, 20), "linear"), key(end(13) - 20, orbit([0, 0, 0], 19.5, 12, 4), "soft"), key(end(13), C.c14, "linear")] },
    objects: [...tube(), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("triads", "fosforo-rgb"), o("gun", "canhao-de-eletrons", "3 cátodos"), o("beam", "feixe", "3 feixes"), o("mask", "mascara-de-sombra", "ausente", "instalada"), o("labels", "rotulos-3d")],
    animations: [
      lin("wrongHit.show", W("s14", 4) - 4, W("s14", 7) + 6, 0, 1, "out"),   // feixe "vermelho" acende ponto verde + ✖
      spr("mask.install", W("s14", 10), 0, 1, 12),
      lin("wrongHit.show", W("s14", 10) + 6, W("s14", 10) + 14, 1, 0, "in"),
      lin("rightHits.show", W("s14", 14), W("s14", 15) + 8, 0, 1, "out"),    // cada feixe passa pelo furo e acerta a sua cor
      spr("label.mask", W("s14", 10), 0, 1, 12),
      lin("screen.color", end(13) - 30, end(13) - 6, 0, 1, "out"),            // imagem ganha cor
    ],
    badges: [
      { text: "COR ERRADA", variant: "negative", appearAt: W("s14", 6), disappearAt: W("s14", 10) - 4 },
      { text: "MÁSCARA DE SOMBRA", subtitle: "Chapa cheia de furos", variant: "positive", appearAt: W("s14", 10), disappearAt: end(13) - 4 },
    ],
    highlights: ["FEIXE", "COR", "ERRADA", "MÁSCARA", "FURADA", "SUA"],
    captions: [cap("s14", "Só que um feixe acertaria a cor errada.", W("s14", 8)), { text: "Então uma máscara furada faz cada um acertar só a sua.", from: W("s14", 8), to: end(13) }],
    audioCues: [narration("s14", HAS_VO ? "ready" : "planned"), sfx("buzz-wrong", W("s14", 5), 0.22), sfx("badge-neg", W("s14", 6), 0.26), sfx("slide-clunk", W("s14", 10), 0.3), sfx("badge", W("s14", 10), 0.28), sfx("chime", W("s14", 15), 0.22)],
  },
  // 15 — sistema completo
  {
    id: "scene-15-conclusao",
    startFrame: sc(14).from,
    durationInFrames: sc(14).durationInFrames,
    voKey: "s15",
    narration: "Pronto: agora você sabe como a TV de tubo desenha cada imagem.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, C.c14), key(s(1.4), P.tvSide, "soft"), key(s(5.2), orbit([0, -0.2, -3], 39, 40, 17), "linear"), key(end(14), P.final, "soft")] },
    objects: [...tube(), o("phosphor", "camada-de-fosforo"), o("anode", "anodo-alta-tensao", "energizado"), o("yoke", "bobinas-de-deflexao", "instaladas"), o("mask", "mascara-de-sombra", "instalada"), o("beam", "feixe", "3 feixes varrendo"), o("finalLabels", "rotulos-3d")],
    animations: [
      lin("scan.speed", 0, 1, 1, 1, "linear"),
      lin("screen.color", 0, 1, 1, 1, "linear"),
      lin("cabinet.cut", 0, s(1.2), 1, 1, "inOut"),
      spr("final.labels", W("s15", 0), 0, 1, 12),  // CÁTODO, GRADE, ÂNODO, BOBINAS, MÁSCARA, FÓSFORO — 4 f entre cada
      lin("fade", end(14) - 18, end(14), 0, 1, "in"),
    ],
    badges: [{ text: "TUBO DE RAIOS CATÓDICOS", subtitle: "CRT · esquema simplificado", variant: "info", appearAt: W("s15", 9), disappearAt: end(14) }],
    highlights: ["PRONTO", "TV", "TUBO", "DESENHA", "IMAGEM"],
    captions: [cap("s15", "Pronto: agora você sabe como a TV de tubo desenha cada imagem.", end(14) - 18)],
    audioCues: [narration("s15", HAS_VO ? "ready" : "planned"), sfx("whoosh-soft", 0, 0.24), sfx("pop", W("s15", 0) + 4, 0.18), sfx("badge-final", W("s15", 9), 0.32)],
  },
];

/** Valor de uma trilha de animação (ex.: "beam.x") no frame global. */
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
