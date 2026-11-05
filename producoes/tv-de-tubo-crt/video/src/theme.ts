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
  // Mundo: sala retrô + TV de tubo em corte
  wood: "#8a5a36",
  woodDark: "#5e3b22",
  woodLight: "#b07a4c",
  bezel: "#2b2a2e",
  knob: "#c9c2b5",
  floor: "#6e4a32",
  wall: "#3f5560",
  rug: "#8e3b3b",
  lamp: "#e9c46a",
  glass: "#a9dcdc",
  coating: "#3a4048",
  metal: "#9aa3ad",
  metalDark: "#5d6670",
  copper: "#c46d2c",
  copperDark: "#8f4b1e",
  cable: "#d6342e",
  cathodeHot: "#ff8a2a",
  electron: "#ffd23f",
  beam: "#4fe3ff",
  air: "#a8b0ba",
  field: "#ff9a3d",
  signal: "#ffd23f",
  phosphor: "#e8f3ee",
  red: "#ff3b30",
  green: "#34e05a",
  blue: "#3c7dff",
  screenOff: "#1c2422",
} as const;

/** Acabamento levemente fosco para todo o diorama. */
export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.38, metalness: 0.55, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.55,
  hemisphere: { sky: "#ffe2c0", ground: "#3d3a4a", intensity: 1.0 },
  key: { position: [-12, 14, 16] as [number, number, number], intensity: 2.3, color: "#ffd9b0" },
  fill: { position: [16, 6, 6] as [number, number, number], intensity: 0.8, color: "#b9d4ff" },
  rim: { position: [6, 10, -18] as [number, number, number], intensity: 0.7, color: "#9fe8ff" },
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
  room: ["#2a1d1a", "#4a3226", "#6b4630"],
  inside: ["#06121c", "#0b2232", "#123247"],
} as const;

/** Cores das palavras-chave nas legendas (as demais palavras ficam brancas). */
export const KEYWORD_COLOR: Record<string, string> = {
  PIXEL: "#ff6b5e", PERDEM: "#ff6b5e", LENTOS: "#ff6b5e", BRANCA: "#ff6b5e", ERRADA: "#ff6b5e", PRETO: "#ff6b5e", PONTINHO: "#ff6b5e",
  FEIXE: "#ffd23f", BRILHA: "#ffd23f", ACELERA: "#ffd23f", ENTORTA: "#ffd23f", VARRE: "#ffd23f", RÁPIDO: "#ffd23f", CLARO: "#ffd23f",
  VÁCUO: "#3ee07a", ÂNODO: "#3ee07a", BOBINAS: "#3ee07a", GRADE: "#3ee07a", MÁSCARA: "#3ee07a", INTEIRA: "#3ee07a", DESENHA: "#3ee07a", PRONTO: "#3ee07a",
  VERMELHOS: "#ff5a52", VERDES: "#3ee07a", AZUIS: "#5c9bff", ESCURO: "#9aa7b4",
};
export const KEYWORD_DEFAULT = "#4fdcff";
