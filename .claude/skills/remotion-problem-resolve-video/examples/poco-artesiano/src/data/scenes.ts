import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { AQUIFER_HIT, WELL } from "../utils/geology";
import { FPS, s, SCENE_FRAMES, voLocal, wordLocal, type VoKey } from "../utils/timing";

// Roteiro do vídeo como dados: as 8 cenas do storyboard, com câmera, objetos visíveis,
// trilhas de animação, badges, palavras-chave da legenda e áudio.
// Frames de animações, badges, câmera e efeitos são LOCAIS à cena; startFrame é global.
// Os cortes vêm de utils/timing.ts (derivados da duração real da narração).

export type BadgeVariant = "positive" | "negative" | "info" | "warning";

export type CameraPreset = {
  position: Vec3;
  target: Vec3;
  zoom: number;
  movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split";
};

/** Pontos de passagem da câmera dentro da cena (a câmera interpola em coordenadas orbitais). */
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };

export type SceneBadge = {
  text: string;
  variant: BadgeVariant;
  appearAt: number;
  disappearAt?: number;
  subtitle?: string;
  /** Coluna central (padrão) ou metade esquerda/direita da tela dividida. */
  slot?: "center" | "left" | "right";
  icon?: "?";
  size?: "normal" | "large";
};

export type SfxCue = { src: string; at: number; volume: number };

export type SceneConfig = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  narration: string;
  camera: CameraPreset;
  cameraKeys: CameraKey[];
  visibleObjects: string[];
  animations: TrackAnimation[];
  badges: SceneBadge[];
  highlights: string[];
  audio: { voKey: VoKey; narrationSrc: string; narrationAt: number; sfx: SfxCue[] };
};

const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const preset = (k: CameraKey, movement: CameraPreset["movement"]): CameraPreset => ({ position: k.position, target: k.target, zoom: k.zoom ?? 1, movement });

const W = wordLocal;
const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const vo = (k: VoKey) => ({ voKey: k, narrationSrc: `audio/vo/${k}.wav`, narrationAt: voLocal(k) });

/** Nível potenciométrico do poço da direita na comparação (abaixo do solo do painel). */
export const RIGHT_HEAD = -1.05;

const WORLD = ["terrain", "house", "vegetation", "tank"];

// Poses-chave reaproveitadas entre cenas (continuidade espacial).
// Enquadramento vertical: com FOV 24°, cada unidade do mundo ocupa ~4516/distância px de altura;
// o assunto de cada plano fica entre os badges (topo) e as legendas (~1360–1480 px).
// Planos do poço miram o próprio plano de corte (z ≈ ZF), senão o azimute desloca o poço para a borda.
const P = {
  house: orbit([3.0, 0.7, -0.2], 17, 30, 22),
  houseClose: orbit([3.2, 0.55, -0.1], 14.5, 26, 19),
  diveEnd: orbit([1.3, -2.5, 0], 28, 12, 0),
  layersWide: orbit([0.2, -2.1, 0], 27, 17, 3),
  layersHold: orbit([0.0, -2.2, 0], 26, 15, 3),
  aquiferClose: orbit([-0.9, -3.2, 1.8], 8.5, 8, 1.5),
  drillBottom: orbit([0.9, -3.2, 1.7], 10.5, 12, 3),
  confinedOrbit: orbit([-1.2, -1.5, 0.8], 27, 4, 6),
  jetWide: orbit([1.1, 0.7, 1.6], 14, 20, 13),
  wellheadCut: orbit([0.95, -0.55, 2.0], 8.5, 16, 8),
  houseSupply: orbit([3.4, 0.55, -0.2], 12, 18, 15),
  diorama: orbit([0.3, -2.4, 0], 54, 40, 23),
};

const k1 = [key(0, P.house), key(s(1.5), P.houseClose, "soft"), key(s(3.5), orbit([1.4, -2.3, 0], 29, 13, -3)), key(end(0), P.diveEnd, "soft")];
const k2 = [
  key(0, P.diveEnd),
  key(s(1.7), P.layersWide),
  key(s(3.0), P.layersHold, "linear"),
  key(s(4.2), orbit([-0.6, -3.25, 1.6], 13, 11, 2)),
  key(end(1), P.aquiferClose, "soft"),
];
const k3 = [
  key(0, P.aquiferClose),
  key(s(0.9), orbit([1.5, -1.0, 1.2], 21, 18, 10)),
  key(s(2.0), orbit([1.6, -0.9, 1.2], 20, 20, 11), "linear"),
  key(s(2.6), orbit([1.9, 0.5, 1.2], 15, 24, 16), "soft"),
  key(s(3.2), orbit([1.4, -0.2, 1.4], 13.5, 20, 12), "soft"),
  key(s(4.3), orbit([1.0, -1.6, 1.6], 12, 16, 6), "linear"),
  key(s(5.2), orbit([0.9, -2.8, 1.7], 11, 13, 4), "linear"),
  key(end(2), P.drillBottom, "soft"),
];
const k4 = [key(0, P.drillBottom), key(s(1.5), orbit([-1.6, -1.2, 0.8], 31, 20, 9)), key(end(3), P.confinedOrbit, "soft")];
const k5 = [
  key(0, P.confinedOrbit),
  key(s(0.9), orbit([0.9, -1.8, 2.0], 14, 12, 5)),
  key(s(2.2), orbit([0.9, -3.3, 2.0], 8.5, 9, 3)),
  key(s(4.0), orbit([0.9, -0.4, 2.0], 9.5, 13, 6)),
  key(s(5.0), orbit([1.1, 0.7, 1.6], 13.6, 18, 12), "soft"),
  key(end(4), P.jetWide, "linear"),
];
const k6 = [key(0, P.jetWide), key(s(5.4), P.jetWide), key(end(5), P.wellheadCut)];
const k7 = [
  key(0, P.wellheadCut),
  key(s(2.4), orbit([1.05, -0.4, 1.9], 8.8, 24, 11), "soft"),
  key(s(4.6), orbit([2.45, 0.55, 0.0], 11, 22, 15)),
  key(end(6), P.houseSupply, "soft"),
];
const k8 = [key(0, P.houseSupply), key(s(2.2), orbit([0.3, -2.4, 0], 56, 30, 22)), key(end(7), P.diorama, "soft")];

export const scenes: SceneConfig[] = [
  {
    id: "scene-01-intro",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    narration: "Como é possível tirar água do chão, mesmo sem ter um rio por perto?",
    camera: preset(k1[0], "dolly-in"),
    cameraKeys: k1,
    visibleObjects: [...WORLD, "groundPlane"],
    animations: [
      // começa um pouco antes do frame 0: o primeiro frame já mostra a casa brotando
      { type: "spring", target: "house.scale", startFrame: -3, endFrame: s(1.5), from: 0, to: 1 },
      { type: "spring", target: "vegetation.scale", startFrame: s(0.15), endFrame: s(1.9), from: 0, to: 1 },
      { type: "spring", target: "tank.scale", startFrame: s(0.3), endFrame: s(2.0), from: 0, to: 1 },
      { type: "interpolate", target: "ground.reveal", startFrame: s(2.6), endFrame: s(3.4), from: 0, to: 1 },
    ],
    badges: [{ text: "ÁGUA DEBAIXO DA TERRA?", variant: "warning", icon: "?", appearAt: s(0.55), disappearAt: end(0) - 8 }],
    highlights: ["ÁGUA", "CHÃO", "RIO"],
    audio: {
      ...vo("s1"),
      sfx: [
        { src: "whoosh-soft", at: 0, volume: 0.35 },
        { src: "pop", at: s(0.12), volume: 0.3 },
        { src: "pop-high", at: s(0.4), volume: 0.18 },
        { src: "pop-high", at: s(0.5), volume: 0.16 },
        { src: "pop", at: s(0.6), volume: 0.2 },
        { src: "badge", at: s(0.55), volume: 0.3 },
        { src: "dive", at: s(1.9), volume: 0.42 },
      ],
    },
  },
  {
    id: "scene-02-aquifer",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    narration: "O segredo está nos aquíferos: camadas de rochas e sedimentos que armazenam água.",
    camera: preset(k2[0], "vertical"),
    cameraKeys: k2,
    visibleObjects: [...WORLD, "aquiferWater", "layerLabels"],
    animations: [
      { type: "interpolate", target: "layers.explode", startFrame: s(0.9), endFrame: s(1.9), from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "layers.explode", startFrame: s(3.3), endFrame: s(4.4), from: 1, to: 0 },
      { type: "interpolate", target: "aquifer.glow", startFrame: W("s2", 4) - 4, endFrame: W("s2", 4) + 14, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "aquifer.particles", startFrame: W("s2", 4), endFrame: W("s2", 4) + s(1), from: 0, to: 1 },
      { type: "interpolate", target: "layers.labels", startFrame: W("s2", 5) - 4, endFrame: W("s2", 5) + 10, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "layers.labels", startFrame: s(2.95), endFrame: s(3.25), from: 1, to: 0 },
    ],
    badges: [{ text: "AQUÍFERO", subtitle: "Água nos poros e fraturas", variant: "positive", appearAt: W("s2", 4), disappearAt: end(1) - 6 }],
    highlights: ["AQUÍFEROS", "ROCHAS", "SEDIMENTOS", "ÁGUA"],
    audio: {
      ...vo("s2"),
      sfx: [
        { src: "whoosh-soft", at: s(0.05), volume: 0.22 },
        { src: "rumble-soft", at: s(0.9), volume: 0.3 },
        { src: "shimmer", at: W("s2", 4) - 2, volume: 0.32 },
        { src: "badge", at: W("s2", 4), volume: 0.28 },
        { src: "tick", at: W("s2", 5), volume: 0.18 },
        { src: "tick", at: W("s2", 5) + 4, volume: 0.16 },
        { src: "tick", at: W("s2", 5) + 8, volume: 0.16 },
        { src: "tick", at: W("s2", 5) + 12, volume: 0.16 },
        { src: "bubbles", at: s(2.2), volume: 0.2 },
        { src: "whoosh-soft", at: s(3.5), volume: 0.2 },
      ],
    },
  },
  {
    id: "scene-03-drilling",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    narration: "Mas a água está lá embaixo! Então uma máquina perfura o solo até alcançar a camada certa.",
    camera: preset(k3[0], "vertical"),
    cameraKeys: k3,
    visibleObjects: [...WORLD, "aquiferWater", "rig", "bore", "depthGuide"],
    animations: [
      { type: "interpolate", target: "depthGuide", startFrame: W("s3", 4) - 6, endFrame: W("s3", 4) + 8, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "depthGuide", startFrame: s(4.6), endFrame: s(5.0), from: 1, to: 0 },
      { type: "spring", target: "rig.drop", startFrame: W("s3", 8) - s(0.55), endFrame: W("s3", 8) + s(0.9), from: 0, to: 1, damping: 10 },
      { type: "interpolate", target: "rig.mast", startFrame: W("s3", 8) - s(0.05), endFrame: W("s3", 9) + 2, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "drill.active", startFrame: W("s3", 9), endFrame: W("s3", 9) + 4, from: 0, to: 1 },
      { type: "interpolate", target: "drill.depth", startFrame: W("s3", 9) + 2, endFrame: s(4.65), from: 0, to: AQUIFER_HIT, easing: "linear" },
      { type: "interpolate", target: "drill.depth", startFrame: s(4.65), endFrame: s(5.55), from: AQUIFER_HIT, to: WELL.bottom, easing: "out" },
      { type: "interpolate", target: "drill.active", startFrame: s(5.45), endFrame: s(5.7), from: 1, to: 0 },
      { type: "interpolate", target: "aquifer.flash", startFrame: s(4.6), endFrame: s(4.8), from: 0, to: 1 },
      { type: "interpolate", target: "aquifer.flash", startFrame: s(4.8), endFrame: s(5.6), from: 1, to: 0 },
    ],
    badges: [
      { text: "ÁGUA INACESSÍVEL", variant: "negative", appearAt: W("s3", 4), disappearAt: W("s3", 9) - 3 },
      { text: "PERFURAÇÃO", variant: "positive", appearAt: W("s3", 9), disappearAt: end(2) - 4 },
    ],
    highlights: ["ÁGUA", "EMBAIXO", "MÁQUINA", "PERFURA", "CAMADA"],
    audio: {
      ...vo("s3"),
      sfx: [
        { src: "whoosh", at: s(0.05), volume: 0.32 },
        { src: "buzz", at: W("s3", 4), volume: 0.26 },
        { src: "thud", at: W("s3", 8) - s(0.3), volume: 0.36 },
        { src: "hydraulic", at: W("s3", 8), volume: 0.3 },
        { src: "badge", at: W("s3", 9), volume: 0.28 },
        { src: "drill", at: W("s3", 9), volume: 0.26 },
        { src: "crumble", at: s(3.5), volume: 0.21 },
        { src: "crumble", at: s(4.25), volume: 0.2 },
        { src: "ding", at: s(4.62), volume: 0.22 },
      ],
    },
  },
  {
    id: "scene-04-pressure",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    narration: "Em um aquífero confinado, a água fica sob pressão entre camadas pouco permeáveis.",
    camera: preset(k4[0], "orbit"),
    cameraKeys: k4,
    visibleObjects: [...WORLD, "aquiferWater", "rig", "bore", "rain", "pressureArrows", "confiningHighlight"],
    animations: [
      { type: "interpolate", target: "rain", startFrame: s(0.2), endFrame: s(0.8), from: 0, to: 1 },
      { type: "interpolate", target: "rain", startFrame: s(4.3), endFrame: end(3), from: 1, to: 0 },
      { type: "interpolate", target: "recharge.label", startFrame: s(1.1), endFrame: s(1.5), from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "recharge.label", startFrame: s(4.4), endFrame: end(3), from: 1, to: 0 },
      { type: "spring", target: "pressure.arrows", startFrame: W("s4", 8) - s(0.45), endFrame: W("s4", 8) + s(1.2), from: 0, to: 1, damping: 9 },
      { type: "interpolate", target: "confining.highlight", startFrame: W("s4", 10) - 3, endFrame: W("s4", 10) + 9, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "aquifer.pressure", startFrame: W("s4", 8) - 6, endFrame: W("s4", 8) + 10, from: 0, to: 1 },
    ],
    badges: [{ text: "AQUÍFERO CONFINADO", subtitle: "Pressão natural", variant: "positive", appearAt: W("s4", 2), disappearAt: end(3) - 4 }],
    highlights: ["AQUÍFERO", "CONFINADO", "PRESSÃO", "PERMEÁVEIS"],
    audio: {
      ...vo("s4"),
      sfx: [
        { src: "whoosh-soft", at: s(0.1), volume: 0.24 },
        { src: "rain", at: s(0.2), volume: 0.16 },
        { src: "badge", at: W("s4", 2), volume: 0.28 },
        { src: "pressure", at: W("s4", 8) - s(0.5), volume: 0.28 },
        { src: "pop", at: W("s4", 8) - s(0.4), volume: 0.16 },
        { src: "pop-high", at: W("s4", 8) - s(0.3), volume: 0.14 },
        { src: "pop", at: W("s4", 8) - s(0.2), volume: 0.14 },
        { src: "glow", at: W("s4", 10) - 3, volume: 0.24 },
      ],
    },
  },
  {
    id: "scene-05-rising-water",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    narration: "Quando o poço alcança esse aquífero, a pressão empurra a água para cima. Às vezes, ela chega a jorrar!",
    camera: preset(k5[0], "vertical"),
    cameraKeys: k5,
    visibleObjects: [...WORLD, "aquiferWater", "rig", "bore", "well", "waterColumn", "jet", "headLine"],
    animations: [
      { type: "interpolate", target: "pressure.arrows", startFrame: 0, endFrame: s(0.35), from: 1, to: 0 },
      { type: "interpolate", target: "confining.highlight", startFrame: 0, endFrame: s(0.4), from: 1, to: 0 },
      { type: "interpolate", target: "aquifer.pressure", startFrame: s(0.2), endFrame: s(1.0), from: 1, to: 0.4 },
      { type: "interpolate", target: "drill.retract", startFrame: 0, endFrame: s(0.45), from: 0, to: 1, easing: "in" },
      { type: "interpolate", target: "rig.drop", startFrame: s(0.5), endFrame: s(1.25), from: 1, to: 0, easing: "in" },
      { type: "interpolate", target: "casing.install", startFrame: s(0.3), endFrame: s(0.9), from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "seal.install", startFrame: s(0.8), endFrame: s(1.25), from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "water.inflow", startFrame: s(1.0), endFrame: s(1.9), from: 0, to: 1 },
      { type: "interpolate", target: "water.level", startFrame: W("s5", 8) - s(0.2), endFrame: s(4.55), from: WELL.bottom, to: WELL.top, easing: "soft" },
      { type: "interpolate", target: "headLine", startFrame: s(4.6), endFrame: s(5.05), from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "jet", startFrame: s(4.5), endFrame: s(4.85), from: 0, to: 0.55, easing: "out" },
      { type: "spring", target: "jet", startFrame: W("s5", 18) - 3, endFrame: end(4), from: 0.55, to: 1, damping: 8 },
    ],
    badges: [
      { text: "PRESSÃO NATURAL", variant: "positive", appearAt: W("s5", 7), disappearAt: end(4) - 4 },
      { text: "POÇO JORRANTE", subtitle: "Quando a pressão é suficiente", variant: "info", appearAt: W("s5", 18) - 3, disappearAt: end(4) - 4 },
    ],
    highlights: ["POÇO", "AQUÍFERO", "PRESSÃO", "ÁGUA", "CIMA", "JORRAR"],
    audio: {
      ...vo("s5"),
      sfx: [
        { src: "whoosh-soft", at: 0, volume: 0.22 },
        { src: "hydraulic", at: s(0.05), volume: 0.18 },
        { src: "clunk", at: s(0.85), volume: 0.3 },
        { src: "whoosh-soft", at: s(0.6), volume: 0.18 },
        { src: "bubbles", at: s(1.1), volume: 0.22 },
        { src: "badge", at: W("s5", 7), volume: 0.28 },
        { src: "water-rise", at: W("s5", 8) - s(0.2), volume: 0.32 },
        { src: "gush", at: s(4.5), volume: 0.31 },
        { src: "badge", at: W("s5", 18) - 3, volume: 0.26 },
      ],
    },
  },
  {
    id: "scene-06-comparison",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    narration: "Mas atenção: nem todo poço artesiano jorra! Se a água não chegar à superfície, uma bomba pode ser necessária.",
    camera: preset(k6[0], "split"),
    cameraKeys: k6,
    visibleObjects: [...WORLD, "aquiferWater", "well", "waterColumn", "jet", "headLine", "comparison"],
    animations: [
      { type: "spring", target: "split", startFrame: 0, endFrame: s(1.0), from: 0, to: 1, damping: 14 },
      { type: "interpolate", target: "compare.focus", startFrame: W("s6", 7) - 4, endFrame: W("s6", 7) + 6, from: 0, to: 1 },
      { type: "interpolate", target: "right.level", startFrame: W("s6", 9), endFrame: W("s6", 13) + 4, from: WELL.bottom, to: RIGHT_HEAD, easing: "soft" },
      { type: "interpolate", target: "right.miss", startFrame: W("s6", 13) - 2, endFrame: W("s6", 13) + 8, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "pump.on", startFrame: W("s6", 15), endFrame: W("s6", 15) + 6, from: 0, to: 1 },
      { type: "interpolate", target: "pump.flow", startFrame: W("s6", 15) + 3, endFrame: W("s6", 15) + s(0.8), from: 0, to: 1, easing: "linear" },
      { type: "interpolate", target: "right.miss", startFrame: W("s6", 15) + s(0.5), endFrame: W("s6", 15) + s(0.8), from: 1, to: 0 },
      { type: "interpolate", target: "split", startFrame: end(5) - 11, endFrame: end(5), from: 1, to: 0, easing: "in" },
    ],
    badges: [
      { text: "NEM TODO POÇO JORRA", variant: "negative", appearAt: W("s6", 2), disappearAt: end(5) - 4 },
      { text: "JORRANTE", variant: "positive", slot: "left", appearAt: s(0.55), disappearAt: end(5) - 4 },
      { text: "COM BOMBA", variant: "positive", slot: "right", appearAt: W("s6", 15) + 2, disappearAt: end(5) - 4 },
    ],
    highlights: ["ATENÇÃO", "JORRA", "SUPERFÍCIE", "BOMBA"],
    audio: {
      ...vo("s6"),
      sfx: [
        { src: "whoosh", at: 0, volume: 0.32 },
        { src: "pop", at: s(0.25), volume: 0.26 },
        { src: "badge", at: s(0.55), volume: 0.24 },
        { src: "buzz", at: W("s6", 2), volume: 0.26 },
        { src: "water-rise", at: W("s6", 9), volume: 0.22 },
        { src: "tick", at: W("s6", 13), volume: 0.2 },
        { src: "click", at: W("s6", 15) - 1, volume: 0.22 },
        { src: "pump", at: W("s6", 15), volume: 0.26 },
        { src: "badge", at: W("s6", 15) + 2, volume: 0.26 },
        { src: "flow", at: W("s6", 15) + s(0.6), volume: 0.19 },
        { src: "whoosh", at: end(5) - 11, volume: 0.28 },
      ],
    },
  },
  {
    id: "scene-07-distribution",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    narration: "Com revestimento e proteção adequados, a água captada pode seguir para um reservatório e abastecer a casa.",
    camera: preset(k7[0], "tracking"),
    cameraKeys: k7,
    visibleObjects: [...WORLD, "aquiferWater", "well", "waterColumn", "jet", "headLine", "pipes"],
    animations: [
      { type: "interpolate", target: "headLine", startFrame: 0, endFrame: s(0.4), from: 1, to: 0 },
      { type: "interpolate", target: "jet", startFrame: s(0.35), endFrame: s(0.9), from: 1, to: 0, easing: "in" },
      { type: "spring", target: "cap.install", startFrame: s(0.6), endFrame: s(1.8), from: 0, to: 1 },
      { type: "interpolate", target: "casing.highlight", startFrame: W("s7", 1) - 2, endFrame: W("s7", 1) + 8, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "casing.highlight", startFrame: s(2.9), endFrame: s(3.3), from: 1, to: 0 },
      { type: "interpolate", target: "protection.highlight", startFrame: W("s7", 3) - 2, endFrame: W("s7", 3) + 8, from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "protection.highlight", startFrame: s(2.9), endFrame: s(3.3), from: 1, to: 0 },
      { type: "interpolate", target: "pipe.grow", startFrame: s(1.7), endFrame: s(2.8), from: 0, to: 1, easing: "soft" },
      { type: "interpolate", target: "pipe.flow", startFrame: W("s7", 7), endFrame: W("s7", 7) + s(0.5), from: 0, to: 1 },
      { type: "interpolate", target: "tank.level", startFrame: s(3.7), endFrame: s(5.7), from: 0, to: 0.82, easing: "soft" },
      { type: "interpolate", target: "house.flow", startFrame: s(5.0), endFrame: s(5.5), from: 0, to: 1 },
      { type: "spring", target: "house.supplied", startFrame: W("s7", 16) - 4, endFrame: end(6), from: 0, to: 1 },
    ],
    badges: [
      { text: "PROTEÇÃO SANITÁRIA", variant: "positive", appearAt: W("s7", 3), disappearAt: W("s7", 12) - 2 },
      { text: "CAPTAÇÃO", variant: "info", appearAt: W("s7", 7), disappearAt: end(6) - 4 },
      { text: "RESERVATÓRIO", variant: "positive", appearAt: W("s7", 12), disappearAt: end(6) - 4 },
    ],
    highlights: ["REVESTIMENTO", "PROTEÇÃO", "ÁGUA", "RESERVATÓRIO", "CASA"],
    audio: {
      ...vo("s7"),
      sfx: [
        { src: "whoosh-soft", at: 0, volume: 0.24 },
        { src: "click", at: s(0.62), volume: 0.26 },
        { src: "tick", at: W("s7", 1), volume: 0.2 },
        { src: "badge", at: W("s7", 3), volume: 0.28 },
        { src: "tick", at: W("s7", 3) + 3, volume: 0.18 },
        { src: "click", at: W("s7", 7) - 2, volume: 0.18 },
        { src: "flow", at: W("s7", 7), volume: 0.24 },
        { src: "badge", at: W("s7", 7), volume: 0.24 },
        { src: "fill", at: s(3.7), volume: 0.24 },
        { src: "badge", at: W("s7", 12), volume: 0.26 },
        { src: "ding", at: W("s7", 16) - 3, volume: 0.21 },
      ],
    },
  },
  {
    id: "scene-08-final",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    narration: "E é assim que um poço artesiano aproveita a água escondida no subsolo!",
    camera: preset(k8[0], "dolly-out"),
    cameraKeys: k8,
    visibleObjects: [...WORLD, "aquiferWater", "well", "waterColumn", "pipes", "finalLabels"],
    animations: [
      { type: "interpolate", target: "final.labels", startFrame: s(1.0), endFrame: s(2.6), from: 0, to: 1, easing: "linear" },
      { type: "interpolate", target: "final.glow", startFrame: W("s8", 9) - 4, endFrame: W("s8", 9) + s(0.6), from: 0, to: 1, easing: "out" },
      { type: "interpolate", target: "fade", startFrame: s(4.6), endFrame: end(7), from: 0, to: 1, easing: "in" },
    ],
    badges: [{ text: "POÇO ARTESIANO", subtitle: "Como funciona? ✔", variant: "info", size: "large", appearAt: W("s8", 5), disappearAt: end(7) }],
    highlights: ["POÇO", "ARTESIANO", "ÁGUA", "SUBSOLO"],
    audio: {
      ...vo("s8"),
      sfx: [
        { src: "whoosh-big", at: 0, volume: 0.31 },
        { src: "tick", at: s(1.05), volume: 0.18 },
        { src: "tick", at: s(1.45), volume: 0.18 },
        { src: "tick", at: s(1.85), volume: 0.18 },
        { src: "tick", at: s(2.25), volume: 0.18 },
        { src: "badge", at: W("s8", 5), volume: 0.3 },
        { src: "shimmer", at: W("s8", 9) - 4, volume: 0.34 },
        { src: "final", at: s(3.95), volume: 0.32 },
      ],
    },
  },
];

/** Valor de uma trilha de animação (ex.: "water.level") no frame global. */
export const track = (target: string, frame: number, fallback = 0) => evaluateTrack(scenes, target, frame, FPS, fallback);

/** Cena ativa no frame global. */
export const sceneAt = (frame: number) => {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (frame >= scenes[i].startFrame) return scenes[i];
  }
  return scenes[0];
};

export const isVisible = (name: string, frame: number) => sceneAt(frame).visibleObjects.includes(name);

/** Verificação de integridade da timeline (executada ao importar). */
const total = scenes.reduce((acc, sc2) => acc + sc2.durationInFrames, 0);
scenes.forEach((sc2, i) => {
  const prev = scenes[i - 1];
  if (prev && prev.startFrame + prev.durationInFrames !== sc2.startFrame) {
    throw new Error(`Buraco/sobreposição entre ${prev.id} e ${sc2.id}`);
  }
});
if (total !== 1350 || scenes[0].startFrame !== 0) {
  throw new Error(`As cenas somam ${total} frames (esperado 1350)`);
}
