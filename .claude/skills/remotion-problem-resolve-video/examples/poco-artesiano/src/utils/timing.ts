import vo from "../data/vo.json";

// Linha do tempo única do vídeo (30 fps, 45 s = 1350 frames).
// A narração (scripts/voiceover.py + prepare_vo.py -> src/data/vo.json) define os cortes:
// cada fala começa LEAD segundos depois do corte da sua cena, e as falas são encadeadas
// com as pausas de GAPS. Mudar um valor aqui mantém cenas, legendas, efeitos e trilha em sincronia.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const SECONDS = 45;
export const DURATION = SECONDS * FPS;

export const f = (seconds: number) => Math.round(seconds * FPS);

export type VoKey = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8";
export const VO_KEYS: readonly VoKey[] = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

/** Primeira fala entra depois do whoosh de abertura. */
const FIRST_VO = 0.45;
/** O corte de cada cena acontece este tanto antes da 1ª sílaba da sua fala. */
const LEAD = 0.25;
/** Pausa entre o fim de uma fala e o início da próxima (s1→s2, s2→s3, ...). */
const GAPS = [0.6, 0.55, 0.7, 0.6, 0.6, 0.55, 0.55] as const;

const voStart = {} as Record<VoKey, number>;
{
  let t = FIRST_VO;
  VO_KEYS.forEach((key, i) => {
    voStart[key] = t;
    t += vo[key].seconds + (GAPS[i] ?? 0);
  });
}

/** Segundo absoluto em que cada fala começa. */
export const VO_START: Readonly<Record<VoKey, number>> = voStart;

export const VO = VO_KEYS.map((id) => ({ id, at: VO_START[id], seconds: vo[id].seconds, text: vo[id].text }));

/** Cortes das 8 cenas em frames globais: [início, fim). Somam exatamente DURATION. */
export const SCENE_FRAMES = VO_KEYS.map((key, i) => {
  const from = i === 0 ? 0 : f(VO_START[key] - LEAD);
  const next = VO_KEYS[i + 1];
  const to = next ? f(VO_START[next] - LEAD) : DURATION;
  return { from, durationInFrames: to - from };
});

/** Frame (local à cena da fala) em que a palavra `index` da fala começa. */
export const wordLocal = (key: VoKey, index: number) => {
  const scene = SCENE_FRAMES[VO_KEYS.indexOf(key)];
  return f(VO_START[key] + vo[key].words[index].start) - scene.from;
};

/** Frame local em que a fala da cena começa. */
export const voLocal = (key: VoKey) => f(VO_START[key]) - SCENE_FRAMES[VO_KEYS.indexOf(key)].from;

/** Segundo local (dentro da cena) -> frame local. Atalho para dados de cena legíveis. */
export const s = (seconds: number) => Math.round(seconds * FPS);
