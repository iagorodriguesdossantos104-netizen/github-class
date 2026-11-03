import { loadFont } from "@remotion/google-fonts/Montserrat";

// Configuração visual central: paleta, materiais, luz, câmera e áreas seguras.

export const { fontFamily: FONT } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const PALETTE = {
  // Superfície (terreno seco)
  grass: "#c9b46c",
  grassDark: "#a89752",
  foliage: "#8ea24c",
  foliageDark: "#6f8a3c",
  trunk: "#7a5236",
  rock: "#9b958c",
  // Camadas do corte
  topsoil: "#b98a5d",
  sediment: "#dcc497",
  pebble: "#b9a07a",
  clay: "#8c5d3f",
  clayDark: "#734a31",
  aquifer: "#25b4dc",
  grain: "#e7d2a3",
  grainDark: "#cdb582",
  bedrock: "#7e8793",
  bedrockDark: "#666e79",
  fracture: "#3fd0ff",
  pedestal: "#232c38",
  pedestalEdge: "#34404f",
  // Água
  water: "#1e8fff",
  waterBright: "#53d6ff",
  waterFoam: "#d9f6ff",
  // Construção
  pipe: "#a2abb5",
  pipeDark: "#6d7781",
  concrete: "#c9ccd0",
  seal: "#b3b8bf",
  gravel: "#d6c9a8",
  rig: "#f2b136",
  rigDark: "#2f3640",
  wall: "#f3e8d4",
  roof: "#c5653d",
  roofDark: "#a3512f",
  window: "#7fc8ef",
  door: "#8a5a3a",
  tank: "#3a9fd8",
  // Interface
  positive: "#20b85a",
  negative: "#e5383b",
  info: "#2f7df6",
  warning: "#f8c815",
  text: "#ffffff",
  outline: "#0a1420",
  pressure: "#8fe9ff",
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

/** Faixas seguras para Shorts/Reels (px na tela 1080x1920). */
export const SAFE = {
  top: 250,
  bottom: 1540,
  side: 90,
  badgeTop: 262,
  captionCenterY: 1418,
} as const;

/** Fundo: céu na superfície, azul profundo no subsolo. */
export const SKY = {
  surface: ["#86c9ef", "#c5e7f6", "#eef3ea"],
  underground: ["#16304f", "#1d3f63", "#0e2036"],
} as const;
