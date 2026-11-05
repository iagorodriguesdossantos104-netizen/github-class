// scenes.ts — Roteiro v1 "E se a camada de ozônio sumisse por 10 minutos?" (aprovado em 2026-11-05 13:30).
// Ajustes técnicos da Fase 2: distâncias do planeta, da pele e do olho para caberem no quadro; status de áudio "ready".
// Contrato de dados no formato de assets/template/src/data/scenes.ts: na Fase 2 este arquivo vira
// src/data/scenes.ts sem tradução. Frames de animações/badges/legendas/câmera/áudio são LOCAIS à cena.
//
// Em src/utils/timing.ts (Fase 2) configure:
//   export const SECONDS = 90;
//   export const VO_KEYS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15"] as const;
//   const PLANNED_SECONDS = [5.99, 4.44, 4.44, 8.01, 5.41, 6.71, 6.06, 6.06, 4.44, 6.71, 4.77, 6.71, 5.41, 6.39, 8.45];
//   const GAPS = Array(14).fill(0.55);
// Cortes planejados (frames globais): 0,180,313,446,686,849,1050,1232,1414,1547,1748,1891,2092,2255,2446,2700.
//
// Mapa do mundo (u3d, ESQUEMÁTICO — alturas fora de escala). Praia ao longo de x; chão y=0; frente do corte em z=+4.
//   beach   : areia x −9…2; mar x 2…9 com corte frontal mostrando a coluna d'água até y=−3 (plâncton perto da superfície)
//   people  : banhista deitado (0,0,1.5), banhista em pé (−2,0,2), criança (1,0,0.5), guarda-sol (−1,0,1)
//   house   : casa em corte (−6.5,0,−1) com uma pessoa dentro; coqueiro (−4,0,−2.5); hospital (−9.5,0,−6), visível só à noite
//   sky     : Sol em (10,22,−14); faixa de ozônio = placa translúcida ciano em y 14…15 (rótulo ESTRATOSFERA)
//   rays    : feixes de setas do Sol ao chão — UV-A (lilás), UV-B (magenta), UV-C (roxo-escuro); `ozone.amount` decide onde param
//   globe   : estação "planeta" em (0,60,−80), raio 8, metade iluminada, casca de ozônio
//   skin    : estação "pele" em (−30,0,0): bloco de pele em corte (epiderme/derme) com núcleo e DNA
//   eye     : estação "olho" em (−30,0,14): olho low-poly com córnea destacada

import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HAS_VO, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };
export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-praia", language: "pt-BR" };

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
const narration = (k: VoKey): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status: HAS_VO ? "ready" : "planned" });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "ready" });
const cap = (k: VoKey, text: string, to: number): CaptionBlock => ({ text, from: voLocal(k), to });
const lin = (target: string, startFrame: number, endFrame: number, from: number | undefined, to: number, easing: EaseName = "inOut", unit: TrackAnimation["unit"] = "0-1"): TrackAnimation =>
  ({ type: "interpolate", target, startFrame, endFrame, from, to, easing, unit });
const spr = (target: string, startFrame: number, from: number | undefined, to: number, damping = 12, unit: TrackAnimation["unit"] = "0-1"): TrackAnimation =>
  ({ type: "spring", target, startFrame, endFrame: startFrame + 32, from, to, damping, unit });

// Poses (orbit(alvo, distância, azimute°, elevação°)); distâncias já pensadas para o quadro vertical (px/u ≈ 4516/d)
const P = {
  beachClose: orbit([0, 1, 1.5], 12, 20, 12),        // banhistas ao meio-dia
  beachWide: orbit([0, 4, 0], 34, 25, 14),           // praia + céu (sem o ozônio no quadro)
  skyColumn: orbit([2, 10, -2], 46, 18, 8),          // praia embaixo, faixa de ozônio em cima: a coluna inteira
  ozoneBand: orbit([2, 14.5, -2], 26, 25, -14),      // a faixa vista de baixo, como um teto
  rays: orbit([3, 8, -2], 40, 30, 10),               // raios descendo do Sol
  globe: orbit([0, 60, -80], 75, 40, 12),            // planeta com dia e noite
  skin: orbit([-30, 1.2, 0], 15, 25, 18),            // bloco de pele em corte
  skinDNA: orbit([-30, 1.6, 2.6], 4.5, 20, 10),      // núcleo ampliado + DNA (na frente do bloco)
  beachBurn: orbit([0, 0.8, 1.5], 9, 35, 18),        // banhista deitado
  eye: orbit([-30, 1.5, 14], 8.5, 15, 6),            // olho de frente
  house: orbit([-6.5, 2, -1], 16, 20, 12),           // casa em corte
  nature: orbit([3, 0, 1], 18, 35, 14),              // folhas, solo e o corte do mar
  seaCut: orbit([5.5, -1.2, 4], 10, 5, 6),           // plâncton no corte do mar
  night: orbit([-1.5, 2, -2], 26, 15, 12),           // praia à noite + hospital
  final: orbit([1, 9, -1], 48, 28, 12),
};

const o = (id: string, type: string, start?: string, endState?: string): SceneObject =>
  start ? { id, type, visible: true, state: { start, end: endState ?? start } } : { id, type, visible: true };
const world = (): SceneObject[] => [
  o("beach", "praia-em-corte"), o("people", "banhistas"), o("umbrella", "guarda-sol"), o("house", "casa-em-corte"),
  o("palm", "coqueiro"), o("sun", "sol"), o("ozone", "faixa-de-ozonio"), o("rays", "raios-uv"), o("sky", "fundo-ceu"),
];

export const scenes: ScenePlan[] = [
  // 1 — gancho
  {
    id: "scene-01-gancho",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Meio-dia, praia lotada. De repente, a camada de ozônio some por dez minutos. O que acontece?",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.beachClose), key(W("s1", 4), orbit([0, 2, 1], 16, 22, 12), "soft"), key(W("s1", 9), P.skyColumn, "inOut"), key(end(0), orbit([2, 10, -2], 45, 20, 8), "linear")] },
    objects: [...world(), o("timer2d", "relogio-2d", "oculto", "00:00")],
    animations: [
      lin("ozone.amount", 0, 1, 1, 1, "linear"),
      lin("ozone.amount", W("s1", 9), W("s1", 9) + 14, 1, 0, "in"),                 // a faixa pisca e se desfaz em partículas
      lin("ozone.dissolve", W("s1", 9), W("s1", 9) + 24, 0, 1, "out"),
      spr("timer.show", W("s1", 11), 0, 1, 12),
      lin("label.band", W("s1", 4), W("s1", 4) + 12, 0, 1, "out"),
      lin("label.band", W("s1", 9) - 4, W("s1", 9) + 4, 1, 0, "in"),
    ],
    badges: [{ text: "SEM OZÔNIO POR 10 MIN", variant: "warning", icon: "?", appearAt: W("s1", 9), disappearAt: end(0) - 4 }],
    highlights: ["PRAIA", "OZÔNIO", "SOME", "DEZ", "MINUTOS"],
    captions: [cap("s1", "Meio-dia, praia lotada.", W("s1", 3)), { text: "De repente, a camada de ozônio some por dez minutos. O que acontece?", from: W("s1", 3), to: end(0) }],
    audioCues: [narration("s1"), sfx("waves", 0, 0.22), sfx("whoosh-soft", W("s1", 4), 0.25), sfx("vanish", W("s1", 9), 0.3), sfx("badge", W("s1", 9), 0.28)],
  },
  // 2 — onde fica e quão fina é
  {
    id: "scene-02-estratosfera",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Ela fica na estratosfera e é fininha: comprimida, teria uns três milímetros.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([2, 10, -2], 45, 20, 8)), key(s(1.4), P.ozoneBand, "soft"), key(end(1), orbit([2, 14.5, -2], 24, 30, -12), "linear")] },
    objects: [...world(), o("ghostBand", "contorno-da-faixa"), o("ruler2d", "regua-3mm")],
    animations: [
      lin("ghostBand.show", 0, 12, 0, 1, "out"),                                       // contorno tracejado onde a faixa estava
      lin("ruler.show", W("s2", 7) - 4, W("s2", 7) + 10, 0, 1, "out"),
      lin("ruler.squash", W("s2", 7), W("s2", 11) + 8, 0, 1, "inOut"),                  // faixa grossa "espremida" até 3 mm
    ],
    badges: [{ text: "ESTRATOSFERA", subtitle: "≈ 15 a 35 km de altura", variant: "info", appearAt: W("s2", 3), disappearAt: end(1) - 4 }],
    highlights: ["ESTRATOSFERA", "FININHA", "COMPRIMIDA", "MILÍMETROS"],
    captions: [cap("s2", "Ela fica na estratosfera e é fininha:", W("s2", 7)), { text: "comprimida, teria uns três milímetros.", from: W("s2", 7), to: end(1) }],
    audioCues: [narration("s2"), sfx("whoosh-soft", 0, 0.22), sfx("badge", W("s2", 3), 0.28), sfx("squeeze", W("s2", 7), 0.22)],
  },
  // 3 — o que ela faz
  {
    id: "scene-03-filtro",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Mesmo assim, ela segura quase todo o ultravioleta mais perigoso do Sol.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([2, 14.5, -2], 24, 30, -12)), key(s(1.2), P.rays, "soft"), key(end(2), orbit([3, 8, -2], 40, 26, 10), "linear")] },
    objects: [...world(), o("ghostBand", "contorno-da-faixa"), o("replay2d", "selo-ANTES")],
    animations: [
      lin("replay.before", 0, 10, 0, 1, "out"),                                        // flashback: a faixa aparece "ANTES", filtrando
      lin("rays.show", 0, 12, 0, 1, "out"),
      lin("rays.stopAtBand", 0, 1, 1, 1, "linear"),                                    // UV-B e UV-C param na faixa (flashback)
      lin("replay.before", end(2) - 10, end(2), 1, 0, "in"),
    ],
    badges: [{ text: "FILTRO DE ULTRAVIOLETA", variant: "info", appearAt: W("s3", 7), disappearAt: end(2) - 4 }],
    highlights: ["SEGURA", "ULTRAVIOLETA", "PERIGOSO", "SOL"],
    captions: [cap("s3", "Mesmo assim, ela segura quase todo", W("s3", 6)), { text: "o ultravioleta mais perigoso do Sol.", from: W("s3", 6), to: end(2) }],
    audioCues: [narration("s3"), sfx("shimmer", 0, 0.2), sfx("badge", W("s3", 7), 0.28)],
  },
  // 4 — UV-B forte e UV-C chegando
  {
    id: "scene-04-uvc",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Sem ela, o UV-B chega muito mais forte. E chega o UV-C, que hoje nem toca o chão: o mesmo que esteriliza hospitais.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([3, 8, -2], 40, 26, 10)), key(W("s4", 8), P.rays, "soft"), key(W("s4", 11), orbit([1, 3, 0], 22, 30, 14), "soft"), key(end(3), orbit([1, 2, 0.5], 18, 34, 14), "linear")] },
    objects: [...world(), o("ghostBand", "contorno-da-faixa"), o("lamp2d", "lampada-germicida-2d")],
    animations: [
      lin("rays.stopAtBand", 0, 1, 1, 0, "linear"),
      lin("uvb.level", W("s4", 3), W("s4", 7), 0.25, 1, "out"),                         // mais setas magenta, mais grossas
      lin("uvc.level", W("s4", 11), W("s4", 11) + 18, 0, 1, "out"),                     // setas roxo-escuro chegam ao chão
      lin("ground.uvGlow", W("s4", 11), W("s4", 17), 0, 1, "out"),
      spr("lamp.show", W("s4", 21), 0, 1, 12),
    ],
    badges: [
      { text: "UV-B MAIS FORTE", variant: "negative", appearAt: W("s4", 3), disappearAt: W("s4", 10) - 4 },
      { text: "UV-C NO CHÃO", subtitle: "O mesmo das lâmpadas germicidas", variant: "negative", appearAt: W("s4", 11), disappearAt: end(3) - 4 },
    ],
    highlights: ["UV-B", "FORTE", "UV-C", "CHÃO", "ESTERILIZA", "HOSPITAIS"],
    captions: [cap("s4", "Sem ela, o UV-B chega muito mais forte.", W("s4", 8)), { text: "E chega o UV-C, que hoje nem toca o chão:", from: W("s4", 8), to: W("s4", 18) }, { text: "o mesmo que esteriliza hospitais.", from: W("s4", 18), to: end(3) }],
    audioCues: [narration("s4"), sfx("badge-neg", W("s4", 3), 0.26), sfx("uv-rise", W("s4", 3), 0.22), sfx("uv-hit", W("s4", 11), 0.28), sfx("badge-neg", W("s4", 11), 0.26), sfx("lamp-buzz", W("s4", 21), 0.16)],
  },
  // 5 — só o lado iluminado
  {
    id: "scene-05-dia-noite",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Só a metade iluminada do planeta é atingida. Quem está na noite não percebe nada.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([1, 2, 0.5], 18, 34, 14)), key(1, orbit([0, 60, -80], 85, 10, 10)), key(W("s5", 8), P.globe, "soft"), key(end(4), orbit([0, 60, -80], 75, 100, 12), "linear")] },
    objects: [o("globe", "planeta", "dia/noite", "lado noturno destacado"), o("globeShell", "casca-de-ozonio", "ausente", "ausente"), o("sunlight", "luz-do-sol")],
    animations: [
      lin("globe.show", 0, s(0.8), 0, 1, "out"),
      lin("globe.dayHighlight", W("s5", 2), W("s5", 3) + 10, 0, 1, "out"),              // lado do dia com brilho roxo de UV
      lin("globe.nightHighlight", W("s5", 8), W("s5", 11) + 6, 0, 1, "out"),            // luzes das cidades no lado da noite
    ],
    badges: [{ text: "SÓ O LADO DO DIA", variant: "info", appearAt: W("s5", 2), disappearAt: end(4) - 4 }],
    highlights: ["METADE", "ILUMINADA", "NOITE", "NADA"],
    captions: [cap("s5", "Só a metade iluminada do planeta é atingida.", W("s5", 8)), { text: "Quem está na noite não percebe nada.", from: W("s5", 8), to: end(4) }],
    audioCues: [narration("s5"), sfx("whoosh-big", 0, 0.28), sfx("badge", W("s5", 2), 0.28)],
  },
  // 6 — UV na pele: sem dor, DNA quebrado
  {
    id: "scene-06-pele",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Na praia, ninguém sente dor. O ultravioleta não esquenta: ele atravessa a pele e quebra o DNA das células.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 60, -80], 75, 100, 12)), key(1, orbit([0, 1, 1.5], 13, 15, 12)), key(W("s6", 8), P.beachClose, "soft"), key(W("s6", 9) - 1, P.beachClose), key(W("s6", 9), P.skin), key(W("s6", 14), P.skinDNA, "soft"), key(end(5), orbit([-30, 1.6, 2.6], 4.2, 28, 10), "linear")] },
    objects: [...world(), o("skin", "bloco-de-pele", "intacto", "DNA com quebras"), o("dna", "dupla-helice")],
    animations: [
      lin("skin.uvPhotons", W("s6", 9), W("s6", 13), 0, 1, "linear"),                   // fótons roxos entram na pele
      lin("dna.breaks", W("s6", 14), W("s6", 16) + 10, 0, 1, "out"),                     // 3 pontos da hélice viram "dímeros" vermelhos
      lin("heat.icon", W("s6", 6), W("s6", 8), 0, 1, "out"),                             // termômetro 2D parado ("não esquenta")
      lin("heat.icon", W("s6", 9), W("s6", 9) + 8, 1, 0, "in"),
    ],
    badges: [
      { text: "SEM DOR NA HORA", variant: "warning", appearAt: W("s6", 2), disappearAt: W("s6", 9) - 4 },
      { text: "DNA DANIFICADO", variant: "negative", appearAt: W("s6", 14), disappearAt: end(5) - 4 },
    ],
    highlights: ["DOR", "NÃO", "ESQUENTA", "PELE", "QUEBRA", "DNA"],
    captions: [cap("s6", "Na praia, ninguém sente dor.", W("s6", 5)), { text: "O ultravioleta não esquenta:", from: W("s6", 5), to: W("s6", 9) }, { text: "ele atravessa a pele e quebra o DNA das células.", from: W("s6", 9), to: end(5) }],
    audioCues: [narration("s6"), sfx("whoosh-soft", 0, 0.24), sfx("dive", W("s6", 9), 0.22), sfx("crack", W("s6", 15), 0.26), sfx("badge-neg", W("s6", 14), 0.26)],
  },
  // 7 — queimadura: dose rápida, sinais depois
  {
    id: "scene-07-queimadura",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Em poucos minutos, a dose já é de queimadura forte. Mas a vermelhidão só aparece horas depois.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([-30, 1.6, 2.6], 4.2, 28, 10)), key(1, orbit([0, 0.8, 1.5], 10, 30, 18)), key(end(6), orbit([0, 0.8, 1.5], 8.5, 50, 20), "soft")] },
    objects: [...world(), o("doseBar2d", "barra-de-dose"), o("clockAhead2d", "relogio-horas-depois")],
    animations: [
      lin("dose.level", W("s7", 1), W("s7", 9), 0, 1, "out"),                            // barra 2D enche até "QUEIMADURA"
      lin("skin.redPreview", W("s7", 12), W("s7", 16) + 8, 0, 1, "inOut"),               // prévia "+6 h": banhista fica vermelho num inserto
    ],
    badges: [{ text: "QUEIMADURA COM ATRASO", subtitle: "Vermelhidão surge horas depois", variant: "negative", appearAt: W("s7", 12), disappearAt: end(6) - 4 }],
    highlights: ["MINUTOS", "QUEIMADURA", "FORTE", "VERMELHIDÃO", "HORAS"],
    captions: [cap("s7", "Em poucos minutos, a dose já é de queimadura forte.", W("s7", 10)), { text: "Mas a vermelhidão só aparece horas depois.", from: W("s7", 10), to: end(6) }],
    audioCues: [narration("s7"), sfx("fill-rise", W("s7", 1), 0.2), sfx("tick-fast", W("s7", 12), 0.16), sfx("badge-neg", W("s7", 12), 0.26)],
  },
  // 8 — olhos
  {
    id: "scene-08-olhos",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Os olhos também queimam, como os de um soldador sem máscara. A dor costuma chegar à noite.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 0.8, 1.5], 8.5, 50, 20)), key(1, orbit([-30, 1.5, 14], 12, 25, 8)), key(end(7), P.eye, "soft")] },
    objects: [o("eye", "olho-low-poly", "normal", "córnea irritada"), o("welder2d", "icone-soldador"), o("moon2d", "lua-2d")],
    animations: [
      lin("eye.cornea", W("s8", 3), W("s8", 3) + 20, 0, 1, "out"),                       // córnea fica vermelha/opaca
      spr("welder.show", W("s8", 8), 0, 1, 12),
      lin("welder.show", W("s8", 11) - 6, W("s8", 11) + 4, 1, 0, "in"),
      spr("moon.show", W("s8", 15), 0, 1, 12),
    ],
    badges: [{ text: "FOTOCERATITE", subtitle: "Queimadura da córnea", variant: "negative", appearAt: W("s8", 3), disappearAt: end(7) - 4 }],
    highlights: ["OLHOS", "QUEIMAM", "SOLDADOR", "MÁSCARA", "DOR", "NOITE"],
    captions: [cap("s8", "Os olhos também queimam, como os de um soldador sem máscara.", W("s8", 11)), { text: "A dor costuma chegar à noite.", from: W("s8", 11), to: end(7) }],
    audioCues: [narration("s8"), sfx("whoosh-soft", 0, 0.24), sfx("sizzle", W("s8", 3), 0.18), sfx("badge-neg", W("s8", 3), 0.26), sfx("pop", W("s8", 15), 0.2)],
  },
  // 9 — quem estava dentro de casa
  {
    id: "scene-09-casa",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Quem estava dentro de casa escapa: telhado e paredes barram o ultravioleta.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.eye), key(1, orbit([-6.5, 2, -1], 18, 10, 12)), key(s(1.2), P.house, "soft"), key(end(8), orbit([-6.5, 2, -1], 15, 35, 14), "linear")] },
    objects: [...world(), o("houseCut", "casa-em-corte", "fechada", "parede frontal aberta"), o("insidePerson", "morador")],
    animations: [
      lin("house.cut", 0, s(1.2), 0, 1, "inOut"),
      lin("roof.block", W("s9", 6), W("s9", 9) + 6, 0, 1, "out"),                        // setas param no telhado com faísca de bloqueio
      spr("insidePerson.check", W("s9", 4), 0, 1, 12),
    ],
    badges: [{ text: "PROTEGIDO DENTRO DE CASA", variant: "positive", appearAt: W("s9", 4), disappearAt: end(8) - 4 }],
    highlights: ["CASA", "ESCAPA", "TELHADO", "PAREDES", "BARRAM"],
    captions: [cap("s9", "Quem estava dentro de casa escapa:", W("s9", 6)), { text: "telhado e paredes barram o ultravioleta.", from: W("s9", 6), to: end(8) }],
    audioCues: [narration("s9"), sfx("whoosh-soft", 0, 0.24), sfx("block", W("s9", 6), 0.24), sfx("badge", W("s9", 4), 0.28)],
  },
  // 10 — natureza: micróbios e plâncton
  {
    id: "scene-10-natureza",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Lá fora, o UV-C mata micróbios nas folhas e no solo, e o plâncton da superfície do mar sofre.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([-6.5, 2, -1], 15, 35, 14)), key(s(1.0), orbit([-4, 2.6, -2.5], 9, -35, 22), "inOut"), key(W("s10", 12), orbit([-3.8, 2.2, -2.5], 8.5, -20, 18), "linear"), key(W("s10", 13), P.seaCut, "inOut"), key(end(9), orbit([5.5, -1.2, 4], 9.5, 0, 4), "linear")] },
    objects: [...world(), o("microbes", "microbios-nas-folhas", "vivos", "apagados"), o("plankton", "plancton", "verde", "parte apagada perto da superfície")],
    animations: [
      lin("microbes.alive", W("s10", 4), W("s10", 10) + 6, 1, 0.2, "inOut"),             // pontinhos verdes nas folhas ficam cinza
      lin("plankton.health", W("s10", 13), W("s10", 18) + 8, 1, 0.45, "inOut"),          // só a camada de cima escurece
    ],
    badges: [
      { text: "MICRÓBIOS MORREM", variant: "negative", appearAt: W("s10", 4), disappearAt: W("s10", 12) - 4 },
      { text: "PLÂNCTON ATINGIDO", variant: "negative", appearAt: W("s10", 13), disappearAt: end(9) - 4 },
    ],
    highlights: ["UV-C", "MATA", "MICRÓBIOS", "PLÂNCTON", "MAR", "SOFRE"],
    captions: [cap("s10", "Lá fora, o UV-C mata micróbios nas folhas e no solo,", W("s10", 11)), { text: "e o plâncton da superfície do mar sofre.", from: W("s10", 11), to: end(9) }],
    audioCues: [narration("s10"), sfx("fizz", W("s10", 4), 0.18), sfx("badge-neg", W("s10", 4), 0.24), sfx("underwater", W("s10", 13), 0.2), sfx("badge-neg", W("s10", 13), 0.24)],
  },
  // 11 — o ozônio volta
  {
    id: "scene-11-volta",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Aí os dez minutos acabam, e o ozônio volta a filtrar o Sol.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([5.5, -1.2, 4], 9.5, 0, 4)), key(s(1.2), P.skyColumn, "inOut"), key(end(10), orbit([2, 10, -2], 44, 24, 9), "linear")] },
    objects: [...world()],
    animations: [
      lin("ozone.amount", W("s11", 6), W("s11", 8) + 10, 0, 1, "out"),
      lin("label.band", W("s11", 8), W("s11", 8) + 12, 0, 1, "out"),
      lin("ozone.dissolve", W("s11", 6), W("s11", 8) + 10, 1, 0, "out"),
      lin("rays.stopAtBand", W("s11", 8), W("s11", 8) + 6, 0, 1, "linear"),
      lin("uvc.level", W("s11", 8), W("s11", 8) + 10, 1, 0, "in"),
      lin("uvb.level", W("s11", 8), W("s11", 8) + 10, 1, 0.25, "in"),
      lin("ground.uvGlow", W("s11", 8), W("s11", 8) + 14, 1, 0, "in"),
      lin("timer.show", end(10) - 10, end(10), 1, 0, "in"),
    ],
    badges: [{ text: "OZÔNIO DE VOLTA", variant: "positive", appearAt: W("s11", 6), disappearAt: end(10) - 4 }],
    highlights: ["DEZ", "MINUTOS", "ACABAM", "OZÔNIO", "VOLTA", "FILTRAR"],
    captions: [cap("s11", "Aí os dez minutos acabam,", W("s11", 5)), { text: "e o ozônio volta a filtrar o Sol.", from: W("s11", 5), to: end(10) }],
    audioCues: [narration("s11"), sfx("ding", W("s11", 3), 0.24), sfx("restore", W("s11", 6), 0.28), sfx("badge", W("s11", 6), 0.28)],
  },
  // 12 — à noite: hospitais
  {
    id: "scene-12-noite",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "À noite, filas no hospital: pele vermelha e olhos ardendo. Na maioria dos casos, tudo sara em poucos dias.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([2, 10, -2], 44, 24, 9)), key(s(1.2), P.night, "inOut"), key(W("s12", 10), orbit([-1.4, 1.6, -1.5], 15, 20, 10), "soft"), key(end(11), orbit([-1.4, 1.6, -1.5], 14, 30, 10), "linear")] },
    objects: [...world(), o("hospital", "hospital", "oculto", "fila na porta"), o("queue", "fila-de-pessoas"), o("calendar2d", "calendario-dias")],
    animations: [
      lin("sky.night", 0, s(1.2), 0, 1, "inOut"),
      spr("hospital.show", s(0.6), 0, 1, 12),
      lin("queue.count", W("s12", 2), W("s12", 4) + 10, 0, 1, "out"),
      lin("queue.red", W("s12", 5), W("s12", 9), 0, 1, "out"),
      lin("calendar.days", W("s12", 14), W("s12", 18) + 8, 0, 1, "linear"),              // 3 folhas de calendário; a fila some
      lin("queue.red", W("s12", 15), end(11) - 6, 1, 0.2, "inOut"),
    ],
    badges: [
      { text: "FILA NO HOSPITAL", variant: "negative", appearAt: W("s12", 2), disappearAt: W("s12", 10) - 4 },
      { text: "SARA EM POUCOS DIAS", variant: "positive", appearAt: W("s12", 14), disappearAt: end(11) - 4 },
    ],
    highlights: ["NOITE", "HOSPITAL", "VERMELHA", "OLHOS", "ARDENDO", "SARA", "DIAS"],
    captions: [cap("s12", "À noite, filas no hospital: pele vermelha e olhos ardendo.", W("s12", 10)), { text: "Na maioria dos casos, tudo sara em poucos dias.", from: W("s12", 10), to: end(11) }],
    audioCues: [narration("s12"), sfx("night", 0, 0.18), sfx("badge-neg", W("s12", 2), 0.24), sfx("pages", W("s12", 14), 0.2), sfx("badge", W("s12", 14), 0.28)],
  },
  // 13 — risco que fica
  {
    id: "scene-13-risco",
    startFrame: sc(12).from,
    durationInFrames: sc(12).durationInFrames,
    voKey: "s13",
    narration: "Mas o DNA danificado deixa um risco maior de câncer de pele nos anos seguintes.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([-1.4, 1.6, -1.5], 14, 30, 10)), key(1, orbit([-30, 1.6, 2.6], 5.5, 10, 10)), key(end(12), orbit([-30, 1.6, 2.6], 4.0, 25, 8), "soft")] },
    objects: [o("skin", "bloco-de-pele", "DNA com quebras", "algumas quebras ficam"), o("dna", "dupla-helice"), o("riskChart2d", "grafico-risco-anos")],
    animations: [
      lin("sky.night", 0, s(1.0), 1, 0, "inOut"),
      lin("dna.repair", s(0.6), W("s13", 3), 0, 0.7, "out"),                              // a maioria das quebras é consertada; algumas ficam
      lin("risk.chart", W("s13", 6), W("s13", 14) + 8, 0, 1, "inOut"),                    // seta 2D subindo levemente ao longo de "anos"
    ],
    badges: [{ text: "RISCO A LONGO PRAZO", subtitle: "Câncer de pele", variant: "warning", appearAt: W("s13", 6), disappearAt: end(12) - 4 }],
    highlights: ["DNA", "DANIFICADO", "RISCO", "CÂNCER", "PELE", "ANOS"],
    captions: [cap("s13", "Mas o DNA danificado deixa um risco maior", W("s13", 8)), { text: "de câncer de pele nos anos seguintes.", from: W("s13", 8), to: end(12) }],
    audioCues: [narration("s13"), sfx("whoosh-soft", 0, 0.24), sfx("low-tone", W("s13", 6), 0.2), sfx("badge-neg", W("s13", 6), 0.24)],
  },
  // 14 — Protocolo de Montreal
  {
    id: "scene-14-montreal",
    startFrame: sc(13).from,
    durationInFrames: sc(13).durationInFrames,
    voKey: "s14",
    narration: "Por isso o mundo baniu os gases que destroem o ozônio: essa camada fininha te protege todo dia.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([-30, 1.6, 2.6], 4.0, 25, 8)), key(1, orbit([2, 14.5, -2], 24, 30, -12)), key(W("s14", 11), orbit([2, 12, -2], 34, 22, 6), "soft"), key(end(13), orbit([2, 10, -2], 40, 25, 9), "linear")] },
    objects: [...world(), o("cfc2d", "lata-de-spray-com-X")],
    animations: [
      spr("cfc.show", W("s14", 4), 0, 1, 12),
      spr("cfc.cross", W("s14", 4) + 10, 0, 1, 10),
      lin("cfc.show", W("s14", 11) - 6, W("s14", 11) + 4, 1, 0, "in"),
      lin("ozone.glow", W("s14", 11), W("s14", 14) + 8, 0, 1, "out"),
    ],
    badges: [{ text: "PROTOCOLO DE MONTREAL", subtitle: "1987 · gases como os CFCs banidos", variant: "positive", appearAt: W("s14", 4), disappearAt: end(13) - 4 }],
    highlights: ["MUNDO", "BANIU", "GASES", "OZÔNIO", "PROTEGE"],
    captions: [cap("s14", "Por isso o mundo baniu os gases que destroem o ozônio:", W("s14", 11)), { text: "essa camada fininha te protege todo dia.", from: W("s14", 11), to: end(13) }],
    audioCues: [narration("s14"), sfx("whoosh-big", 0, 0.26), sfx("stamp", W("s14", 4) + 10, 0.26), sfx("badge", W("s14", 4), 0.28), sfx("shimmer", W("s14", 11), 0.2)],
  },
  // 15 — encerramento
  {
    id: "scene-15-conclusao",
    startFrame: sc(14).from,
    durationInFrames: sc(14).durationInFrames,
    voKey: "s15",
    narration: "Pronto: agora você sabe o que dez minutos sem ozônio fariam com a gente.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([2, 10, -2], 40, 25, 9)), key(s(2.5), orbit([1, 9, -1], 46, 35, 11), "soft"), key(end(14), P.final, "soft")] },
    objects: [...world(), o("finalLabels", "rotulos-3d")],
    animations: [
      spr("final.labels", W("s15", 0), 0, 1, 12),                                       // OZÔNIO, UV-A, UV-B, UV-C, SOL
      lin("fade", end(14) - 18, end(14), 0, 1, "in"),
    ],
    badges: [{ text: "10 MINUTOS SEM OZÔNIO", subtitle: "Cenário hipotético · esquema simplificado", variant: "info", appearAt: W("s15", 6), disappearAt: end(14) }],
    highlights: ["PRONTO", "DEZ", "MINUTOS", "OZÔNIO"],
    captions: [cap("s15", "Pronto: agora você sabe o que dez minutos sem ozônio fariam com a gente.", end(14) - 18)],
    audioCues: [narration("s15"), sfx("whoosh-soft", 0, 0.24), sfx("badge-final", W("s15", 6), 0.32)],
  },
];

/** Valor de uma trilha de animação (ex.: "ozone.amount") no frame global. */
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
