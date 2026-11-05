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
  // Mundo: praia ao meio-dia + coluna de céu
  sand: "#e9cf94",
  sandSide: "#c9a86a",
  sandDeep: "#a9864f",
  water: "#2f8fd0",
  waterDeep: "#1a5b8f",
  seaFloor: "#8a7350",
  foam: "#e8f6ff",
  plankton: "#5fe08a",
  planktonDead: "#4f5a52",
  microbe: "#7ee36a",
  microbeDead: "#8a8f86",
  skin: "#e2a77d",
  skinDark: "#9b6a48",
  skinRed: "#e0533d",
  suit: ["#2f7df6", "#ff8a3d", "#20b85a", "#c94bd1", "#f8c815"],
  umbrella: "#ff5d5d",
  umbrellaB: "#ffffff",
  towel: "#3fb6c9",
  wall: "#f3e6cf",
  roof: "#b5523b",
  wood: "#8a5a36",
  trunk: "#8b6b45",
  leaf: "#3f8f45",
  hospital: "#e9eef2",
  cross: "#e5383b",
  sun: "#ffd84a",
  ozone: "#7fe6ff",
  uva: "#b79cff",
  uvb: "#ff4fd8",
  uvc: "#9b3cff",
  globeOcean: "#2b6fd0",
  globeLand: "#4fa25a",
  cityLight: "#ffd27a",
  epidermis: "#e8b48a",
  dermis: "#f0b9a0",
  hypodermis: "#f4e0a6",
  dna: "#4fe3ff",
  dnaB: "#ffd23f",
  dimer: "#ff3b30",
  sclera: "#f7f4ef",
  iris: "#3f86c9",
  metal: "#9aa3ad",
} as const;

/** Acabamento levemente fosco para todo o diorama. */
export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.38, metalness: 0.55, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.6,
  hemisphere: { sky: "#e6f4ff", ground: "#c9a86a", intensity: 1.0 },
  key: { position: [10, 22, -6] as [number, number, number], intensity: 2.6, color: "#fff2d6" },
  fill: { position: [-14, 8, 14] as [number, number, number], intensity: 0.7, color: "#b9d4ff" },
  rim: { position: [-6, 10, -18] as [number, number, number], intensity: 0.5, color: "#ffd6b0" },
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
  day: ["#4fa6e8", "#8fd0f5", "#d8f1ff"],
  raw: ["#3d4fc4", "#8b7be0", "#e6d7ff"],
  night: ["#060c24", "#0f1d45", "#1e2c5c"],
  space: ["#01030a", "#050b1c", "#0a1430"],
} as const;

/** Cores das palavras-chave nas legendas (as demais palavras ficam brancas). */
export const KEYWORD_COLOR: Record<string, string> = {
  SOME: "#ff6b5e", QUEBRA: "#ff6b5e", QUEIMADURA: "#ff6b5e", QUEIMAM: "#ff6b5e", MATA: "#ff6b5e", SOFRE: "#ff6b5e", RISCO: "#ff6b5e", CÂNCER: "#ff6b5e", VERMELHA: "#ff6b5e", ARDENDO: "#ff6b5e",
  "UV-B": "#ff6fe0", "UV-C": "#b98cff", ULTRAVIOLETA: "#c9a8ff",
  OZÔNIO: "#7fe6ff", ESTRATOSFERA: "#7fe6ff", FININHA: "#7fe6ff",
  ESCAPA: "#3ee07a", BARRAM: "#3ee07a", VOLTA: "#3ee07a", SARA: "#3ee07a", BANIU: "#3ee07a", PROTEGE: "#3ee07a", PRONTO: "#3ee07a",
  DEZ: "#ffd23f", MINUTOS: "#ffd23f", HORAS: "#ffd23f", NOITE: "#ffd23f", DOR: "#ffd23f",
};
export const KEYWORD_DEFAULT = "#4fdcff";
