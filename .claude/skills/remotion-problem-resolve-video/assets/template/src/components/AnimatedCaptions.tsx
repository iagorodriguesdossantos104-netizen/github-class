import { interpolate, useCurrentFrame } from "remotion";
import { scenes } from "../data/scenes";
import { FONT, KEYWORD_COLOR, KEYWORD_DEFAULT, PALETTE, SAFE } from "../theme";
import { clamp } from "../utils/animation";
import { f, VO_START, voWords } from "../utils/timing";

// Legendas dinâmicas. Com a narração medida (vo.json), sincroniza palavra a palavra e mostra blocos
// curtos estilo Shorts, destacando a palavra falada e colorindo as palavras-chave da cena.
// Antes do TTS, mostra os blocos provisórios `captions` do ScenePlan.

const clean = (w: string) => w.replace(/[.,!?:;]/g, "").toUpperCase();

/** `timed` = tempo real por palavra (vo.json); blocos provisórios não destacam palavra a palavra. */
type Word = { text: string; from: number; to: number; key: boolean; color: string; timed: boolean };
type Page = { words: Word[]; from: number; to: number };

const MAX_CHARS = 17;

const buildPages = (): Page[] => {
  const pages: Page[] = [];
  for (const scene of scenes) {
    const highlights = new Set(scene.highlights);
    const words = voWords(scene.voKey);
    if (words.length === 0) {
      // provisório: blocos do roteiro, sem tempo por palavra
      for (const c of scene.captions) {
        const ws = c.text.split(/\s+/).map((t) => {
          const key = highlights.has(clean(t));
          return { text: t.toUpperCase(), from: scene.startFrame + c.from, to: scene.startFrame + c.to, key, color: key ? (KEYWORD_COLOR[clean(t)] ?? KEYWORD_DEFAULT) : "#ffffff", timed: false };
        });
        pages.push({ words: ws, from: scene.startFrame + c.from, to: scene.startFrame + c.to });
      }
      continue;
    }
    let cur: Word[] = [];
    let chars = 0;
    const flush = () => {
      if (cur.length) pages.push({ words: cur, from: cur[0].from, to: cur[cur.length - 1].to });
      cur = [];
      chars = 0;
    };
    words.forEach((w, i) => {
      const text = w.text.toUpperCase();
      const c = clean(w.text);
      const key = highlights.has(c);
      if (chars + text.length > MAX_CHARS && cur.length) flush();
      const at = VO_START[scene.voKey];
      cur.push({ text, from: f(at + w.start), to: f(at + w.end), key, color: key ? (KEYWORD_COLOR[c] ?? KEYWORD_DEFAULT) : "#ffffff", timed: true });
      chars += text.length + 1;
      if (/[.,!?:]$/.test(w.text) && i < words.length - 1) flush();
    });
    flush();
  }
  // cada bloco fica até o próximo começar (ou um pouco depois da última palavra)
  return pages.map((p, i) => {
    const next = pages[i + 1];
    const hold = next && next.from - p.to < 12 ? next.from : p.to + 10;
    return { ...p, to: Math.max(hold, p.to) };
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
        columnGap: 22,
        opacity: enter * (1 - exit),
        scale: String(interpolate(enter, [0, 1], [0.86, 1])),
      }}
    >
      {page.words.map((w, i) => {
        const active = w.timed && frame >= w.from && frame < Math.max(w.to, w.from + 4);
        const spoken = !w.timed || frame >= w.from;
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
