import { loadFont } from "@remotion/google-fonts/Montserrat";

// Configuração visual central: paleta, materiais, luz, câmera e áreas seguras.
// Adapte a paleta ao tema; mantenha os papéis semânticos (positive/negative/info/warning).

export const { fontFamily: FONT } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const PALETTE = {
  // Estados didáticos (sempre com ícone + texto, nunca só cor)
  positive: "#20b85a",
  negative: "#e5383b",
  info: "#2f7df6",
  warning: "#f8c815",
  // Interface
  text: "#ffffff",
  outline: "#0a1420",
  accent: "#53d6ff",
  // Mundo: rua ao entardecer
  ground: "#7fa65a",
  groundSide: "#5b4636",
  pedestal: "#1c2533",
  asphalt: "#3d434d",
  sidewalk: "#b9b2a6",
  stripe: "#f2e3a0",
  concrete: "#a7a9ac",
  crossarm: "#7b6a58",
  insulator: "#d9e6ee",
  wire: "#2b2f36",
  metal: "#9aa3ad",
  metalDark: "#5d6670",
  energy: "#ffd23f",
  spark: "#ff5a2a",
  windowOn: "#ffd27a",
  windowOff: "#2f3a4c",
  wall: ["#f1e3c8", "#d9e9f2", "#f3d2c1", "#e2efd6", "#efe0f0", "#f6e7b6", "#d8dee8"],
  roof: ["#b5523b", "#4f6d8a", "#8c5a3c", "#5a7d4c", "#7b4f7a", "#b0772f", "#55606e"],
  trunk: "#7a5136",
  leaves: "#4f8f3c",
  leavesDark: "#3c7330",
  substation: "#8b939c",
  radio: "#53d6ff",
  segA: "#2f7df6",
  segB: "#20b85a",
  segC: "#e5383b",
  segD: "#a65ce8",
} as const;

/** Acabamento levemente fosco para todo o diorama. */
export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.38, metalness: 0.55, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.5,
  hemisphere: { sky: "#ffd9b8", ground: "#4a3f52", intensity: 1.0 },
  key: { position: [-14, 12, 14] as [number, number, number], intensity: 2.4, color: "#ffd2a1" },
  fill: { position: [14, 7, 10] as [number, number, number], intensity: 0.7, color: "#b9c8ff" },
  rim: { position: [4, 9, -14] as [number, number, number], intensity: 0.65, color: "#ffb3c8" },
  shadowMapSize: 2048,
} as const;

/** Perspectiva suave: FOV baixo e câmera afastada preservam a leitura do esquema. */
export const CAMERA = { fov: 24, near: 0.5, far: 400 } as const;

/** Faixas seguras para Shorts/Reels (px numa tela 1080x1920). */
export const SAFE = {
  top: 250,
  bottom: 1540,
  side: 90,
  badgeTop: 262,
  captionCenterY: 1418,
} as const;

/** Fundo: céu com a câmera acima do "chão", azul profundo quando ela desce (ver Background.tsx). */
export const SKY = {
  dusk: ["#4b5fa8", "#d98a8f", "#ffc58a"],
  night: ["#0b1430", "#172552", "#2b3566"],
} as const;

/** Cores das palavras-chave nas legendas (as demais palavras ficam brancas). */
export const KEYWORD_COLOR: Record<string, string> = {
  "CURTO-CIRCUITO": "#ff6b5e", QUEIMAR: "#ff6b5e", APAGOU: "#ff6b5e", PERMANENTE: "#ff6b5e", DESISTE: "#ff6b5e", ESCURO: "#ff6b5e",
  INTERRUPTOR: "#ffd23f", LUZ: "#ffd23f", ACENDE: "#ffd23f", DESLIGA: "#ffd23f", RELIGA: "#ffd23f", ABREM: "#ffd23f", FECHA: "#ffd23f",
  RELIGADOR: "#3ee07a", AUTOMÁTICO: "#3ee07a", CHAVES: "#3ee07a", AUTOMÁTICAS: "#3ee07a", VIZINHO: "#3ee07a", "SELF-HEALING": "#3ee07a", PROTEGE: "#3ee07a",
};
export const KEYWORD_DEFAULT = "#4fdcff";
