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
  // Mundo (exemplo — troque pelo tema)
  ground: "#c9b46c",
  groundSide: "#b98a5d",
  subject: "#25b4dc",
  metal: "#a2abb5",
  pedestal: "#232c38",
} as const;

/** Acabamento levemente fosco para todo o diorama. */
export const MATTE = { roughness: 0.88, metalness: 0, flatShading: true } as const;
export const METAL = { roughness: 0.38, metalness: 0.55, flatShading: true } as const;

export const LIGHTING = {
  ambient: 0.55,
  hemisphere: { sky: "#dff2ff", ground: "#6b5a48", intensity: 1.05 },
  key: { position: [9, 16, 12] as [number, number, number], intensity: 2.5, color: "#fff4e2" },
  fill: { position: [-12, 6, 8] as [number, number, number], intensity: 0.75, color: "#cfe6ff" },
  rim: { position: [-4, 8, -12] as [number, number, number], intensity: 0.6, color: "#ffffff" },
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
  surface: ["#86c9ef", "#c5e7f6", "#eef3ea"],
  underground: ["#16304f", "#1d3f63", "#0e2036"],
} as const;

/** Cores das palavras-chave nas legendas (as demais palavras ficam brancas). */
export const KEYWORD_COLOR: Record<string, string> = {};
export const KEYWORD_DEFAULT = "#4fdcff";
