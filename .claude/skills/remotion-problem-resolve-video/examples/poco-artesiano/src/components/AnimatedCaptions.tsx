import { interpolate, useCurrentFrame } from "remotion";
import vo from "../data/vo.json";
import { scenes } from "../data/scenes";
import { FONT, PALETTE, SAFE } from "../theme";
import { clamp } from "../utils/animation";
import { f, VO_KEYS, VO_START, type VoKey } from "../utils/timing";

// Legendas dinâmicas sincronizadas palavra a palavra com a narração (tempos da ElevenLabs).
// Mostra blocos curtos (estilo Shorts), destaca a palavra falada e colore as palavras-chave.

const KEYWORD_COLOR: Record<string, string> = {
  PERFURA: "#ffd23f",
  MÁQUINA: "#ffd23f",
  EMBAIXO: "#ffd23f",
  BOMBA: "#ffd23f",
  ATENÇÃO: "#ff6b6b",
  REVESTIMENTO: "#6ef09a",
  PROTEÇÃO: "#6ef09a",
  RESERVATÓRIO: "#6ef09a",
  CASA: "#6ef09a",
};
const DEFAULT_KEY = "#4fdcff";

const clean = (w: string) => w.replace(/[.,!?:;]/g, "").toUpperCase();

type Word = { text: string; from: number; to: number; key: boolean; color: string };
type Page = { words: Word[]; from: number; to: number };

const MAX_CHARS = 17;

const buildPages = (): Page[] => {
  const pages: Page[] = [];
  VO_KEYS.forEach((k: VoKey, si) => {
    const highlights = new Set(scenes[si].highlights);
    const line = vo[k];
    let cur: Word[] = [];
    let chars = 0;
    const flush = () => {
      if (cur.length) pages.push({ words: cur, from: cur[0].from, to: cur[cur.length - 1].to });
      cur = [];
      chars = 0;
    };
    line.words.forEach((w, i) => {
      const text = w.text.toUpperCase();
      const c = clean(w.text);
      const key = highlights.has(c);
      if (chars + text.length > MAX_CHARS && cur.length) flush();
      cur.push({ text, from: f(VO_START[k] + w.start), to: f(VO_START[k] + w.end), key, color: key ? (KEYWORD_COLOR[c] ?? DEFAULT_KEY) : "#ffffff" });
      chars += text.length + 1;
      if (/[.,!?:]$/.test(w.text) && i < line.words.length - 1) flush();
    });
    flush();
  });
  // cada bloco fica até o próximo começar (ou um pouco depois da última palavra)
  return pages.map((p, i) => {
    const next = pages[i + 1];
    const hold = next && next.from - p.to < 12 ? next.from : p.to + 10;
    return { ...p, to: hold };
  });
};

const PAGES = buildPages();

export const AnimatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const page = PAGES.find((p) => frame >= p.from - 1 && frame < p.to);
  if (!page) return null;
  const t = frame - (page.from - 1);
  const enter = interpolate(t, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = clamp((frame - (page.to - 4)) / 4, 0, 1);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.side,
        right: SAFE.side,
        top: SAFE.captionCenterY - 60,
        height: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        columnGap: 18,
        opacity: enter * (1 - exit),
        scale: String(interpolate(enter, [0, 1], [0.86, 1])),
      }}
    >
      {page.words.map((w, i) => {
        const active = frame >= w.from && frame < Math.max(w.to, w.from + 4);
        const spoken = frame >= w.from;
        const pop = active ? interpolate(frame - w.from, [0, 3, 7], [1, 1.14, 1.08], { extrapolateRight: "clamp" }) : 1;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 66,
              lineHeight: 1.1,
              color: w.key ? w.color : spoken ? "#ffffff" : "rgba(255,255,255,0.82)",
              WebkitTextStroke: `11px ${PALETTE.outline}`,
              paintOrder: "stroke fill",
              textShadow: "0 7px 14px rgba(0,0,0,0.45)",
              display: "inline-block",
              scale: String(pop),
              translate: active ? "0px -4px" : "0px 0px",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
