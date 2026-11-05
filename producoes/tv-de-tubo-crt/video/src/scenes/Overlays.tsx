import { useCurrentFrame } from "remotion";
import { cameraPoseAt, projectPoint } from "../components/CameraController";
import { POINTS } from "../components/World";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { FONT, PALETTE } from "../theme";
import { clamp, pop, progress, type Vec3 } from "../utils/animation";
import { FPS, wordLocal } from "../utils/timing";
import type { SceneModule, SceneProps } from "./types";

// Camadas 2D de cada cena. useCurrentFrame() é LOCAL; somamos scene.startFrame para ler trilhas.

const W = wordLocal;
const useFrames = (scene: SceneProps["scene"]) => {
  const local = useCurrentFrame();
  return { local, frame: local + scene.startFrame };
};
const at = (p: Vec3, frame: number) => projectPoint(cameraPoseAt(frame), p);
/** Some com a cena: rótulos não "pulam" no corte. */
const outFade = (local: number, dur: number) => 1 - progress(local, dur - 10, dur - 2);

const Panel: React.FC<{ x: number; y: number; children: React.ReactNode; accent?: string; scale?: number; opacity?: number; size?: number }> = ({
  x,
  y,
  children,
  accent = PALETTE.accent,
  scale = 1,
  opacity = 1,
  size = 40,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -50%",
      scale: String(scale),
      opacity,
      padding: "12px 24px",
      borderRadius: 24,
      background: "rgba(10, 20, 32, 0.88)",
      border: `4px solid ${accent}`,
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      color: "#ffffff",
      whiteSpace: "pre",
      textAlign: "center",
      boxShadow: "0 12px 26px rgba(0,0,0,0.38)",
    }}
  >
    {children}
  </div>
);

const Label: React.FC<{ frame: number; local: number; dur: number; point: Vec3; text: string; appear: number; offset: [number, number]; accent?: string }> = ({ frame, local, dur, point, text, appear, offset, accent }) => (
  <WorldLabel pose={cameraPoseAt(frame)} point={point} text={text} appear={appear * outFade(local, dur)} offset={offset} accent={accent} size={32} />
);

// ---------------------------------------------------------------- 1. gancho: clique no botão
const GanchoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const press = progress(local, W("s1", 1), W("s1", 1) + 18);
  const k = at(POINTS.knob, frame);
  if (!(press > 0 && press < 1) || !k.visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: k.x,
        top: k.y,
        width: 50 + press * 150,
        height: 50 + press * 150,
        translate: "-50% -50%",
        borderRadius: "50%",
        border: `8px solid ${PALETTE.warning}`,
        opacity: 1 - press,
      }}
    />
  );
};

// ---------------------------------------------------------------- rótulos simples
const FosforoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  return <Label frame={frame} local={local} dur={scene.durationInFrames} point={POINTS.phosphor} text="FÓSFORO" appear={track("phosphor.reveal", frame)} offset={[-170, -230]} />;
};

const CanhaoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  return <Label frame={frame} local={local} dur={scene.durationInFrames} point={POINTS.cathode} text="CÁTODO" appear={track("label.cathode", frame)} offset={[-150, -240]} accent={PALETTE.cathodeHot} />;
};

const AnodoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  return <Label frame={frame} local={local} dur={scene.durationInFrames} point={POINTS.anode} text="ÂNODO" appear={track("label.anode", frame)} offset={[150, -200]} accent={PALETTE.cable} />;
};

const BobinasOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  return <Label frame={frame} local={local} dur={scene.durationInFrames} point={POINTS.yoke} text="BOBINAS" appear={track("label.yoke", frame) * (1 - progress(local, W("s7", 12), W("s7", 13)))} offset={[-160, -210]} accent={PALETTE.copper} />;
};

// ---------------------------------------------------------------- 8. setas da varredura
const Arrow: React.FC<{ x: number; y: number; angle: number; length: number; opacity: number }> = ({ x, y, angle, length, opacity }) => (
  <svg style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity }} width={1} height={1}>
    <g transform={`rotate(${angle})`}>
      <line x1={0} y1={0} x2={length - 30} y2={0} stroke={PALETTE.outline} strokeWidth={22} strokeLinecap="round" />
      <line x1={0} y1={0} x2={length - 30} y2={0} stroke={PALETTE.warning} strokeWidth={12} strokeLinecap="round" />
      <polygon points={`${length},0 ${length - 44},-28 ${length - 44},28`} fill={PALETTE.warning} stroke={PALETTE.outline} strokeWidth={6} strokeLinejoin="round" />
    </g>
  </svg>
);

const VarreduraOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { frame } = useFrames(scene);
  const a = clamp(track("raster.arrows", frame), 0, 1);
  if (a < 0.01) return null;
  const tl = at(POINTS.screenTopLeft, frame);
  const br = at(POINTS.screenBottomRight, frame);
  if (!tl.visible || !br.visible) return null;
  const w = Math.abs(br.x - tl.x);
  const h = Math.abs(br.y - tl.y);
  const x0 = Math.min(tl.x, br.x);
  const y0 = Math.min(tl.y, br.y);
  return (
    <>
      <Arrow x={x0 + w * 0.15} y={y0 - 50} angle={0} length={w * 0.7 * a} opacity={a} />
      <Arrow x={x0 - 50} y={y0 + h * 0.12} angle={90} length={h * 0.76 * a} opacity={a} />
    </>
  );
};

// ---------------------------------------------------------------- 10. grade + claro/escuro
const GradeOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const tags = clamp(track("brightness.tags", frame), 0, 1);
  const pose = cameraPoseAt(frame);
  return (
    <>
      <Label frame={frame} local={local} dur={scene.durationInFrames} point={POINTS.grid} text="GRADE" appear={track("label.grid", frame) * (1 - progress(local, W("s10", 11), W("s10", 12)))} offset={[-120, -230]} accent={PALETTE.signal} />
      <WorldLabel pose={pose} point={POINTS.screenSky} text={"+ ELÉTRONS\nCLARO"} appear={tags * outFade(local, scene.durationInFrames)} offset={[-60, -300]} accent={PALETTE.warning} size={30} />
      <WorldLabel pose={pose} point={POINTS.screenHill} text={"− ELÉTRONS\nESCURO"} appear={pop(local, FPS, W("s10", 14)) * outFade(local, scene.durationInFrames)} offset={[60, 300]} accent="#9aa7b4" size={30} />
    </>
  );
};

// ---------------------------------------------------------------- 11. contadores
const VelocidadeOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const lines = Math.round(track("counter.lines", frame));
  const fields = Math.round(track("counter.fields", frame));
  const a = pop(local, FPS, W("s11", 8) - 4) * outFade(local, scene.durationInFrames);
  const b = pop(local, FPS, W("s11", 14) - 4) * outFade(local, scene.durationInFrames);
  const slow = 1 - progress(local, W("s11", 4), W("s11", 5) + 12);
  return (
    <>
      {slow > 0.01 ? (
        <Panel x={540} y={470} opacity={slow * pop(local, FPS, 0)} accent={PALETTE.info} size={34}>
          CÂMERA LENTA
        </Panel>
      ) : null}
      {a > 0.01 ? (
        <Panel x={300} y={480} scale={a} accent={PALETTE.accent} size={36}>
          {`${lines}\nLINHAS`}
        </Panel>
      ) : null}
      {b > 0.01 ? (
        <Panel x={780} y={480} scale={b} accent={PALETTE.warning} size={36}>
          {`${fields}\nMEIAS-TELAS/S`}
        </Panel>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- 12. rastro em câmera lenta + olho
const PersistenciaOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const tr = clamp(track("trail.show", frame), 0, 1);
  const eye = clamp(track("eye.show", frame), 0, 1.2) * outFade(local, scene.durationInFrames);
  const PW = 380;
  const PH = 200;
  const dots = Array.from({ length: 18 }, (_, i) => {
    const t = local * 0.012 - i * 0.012;
    const ph = ((t % 1) + 1) % 1;
    const line = Math.floor(ph * 6);
    const xf = (ph * 6) % 1;
    return { x: 20 + xf * (PW - 40), y: 22 + line * ((PH - 44) / 5), a: Math.exp(-i / 5) };
  });
  return (
    <>
      {tr > 0.01 ? (
        <div style={{ position: "absolute", left: 640, top: 480, translate: "-50% -50%", opacity: tr, scale: String(0.8 + 0.2 * tr) }}>
          <div style={{ width: PW, height: PH, borderRadius: 22, background: "#0c1412", border: `5px solid ${PALETTE.accent}`, position: "relative", overflow: "hidden", boxShadow: "0 12px 26px rgba(0,0,0,0.4)" }}>
            {dots.map((d, i) => (
              <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: i === 0 ? 22 : 16, height: i === 0 ? 22 : 16, translate: "-50% -50%", borderRadius: "50%", background: i === 0 ? "#ffffff" : "#b8fff0", opacity: d.a, boxShadow: i === 0 ? "0 0 18px #b8fff0" : "none" }} />
            ))}
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: "#ffffff", textAlign: "center", marginTop: 8, WebkitTextStroke: `7px ${PALETTE.outline}`, paintOrder: "stroke fill" }}>O BRILHO DEMORA A APAGAR</div>
        </div>
      ) : null}
      {eye > 0.01 ? (
        <div style={{ position: "absolute", left: 290, top: 470, translate: "-50% -50%", scale: String(eye) }}>
          <svg width={190} height={120} viewBox="0 0 190 120">
            <path d="M 8 60 Q 95 -20 182 60 Q 95 140 8 60 Z" fill="#ffffff" stroke={PALETTE.outline} strokeWidth={10} />
            <circle cx={95} cy={60} r={30} fill={PALETTE.info} stroke={PALETTE.outline} strokeWidth={6} />
            <circle cx={95} cy={60} r={13} fill={PALETTE.outline} />
            <circle cx={104} cy={50} r={6} fill="#ffffff" />
          </svg>
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- 14. máscara: ✖ e ✔
const Mark: React.FC<{ x: number; y: number; ok: boolean; scale: number }> = ({ x, y, ok, scale }) => (
  <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", scale: String(scale) }}>
    <svg width={96} height={96} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={44} fill={ok ? PALETTE.positive : PALETTE.negative} stroke="#ffffff" strokeWidth={8} />
      {ok ? <path d="M 28 52 L 44 68 L 74 34" fill="none" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M 32 32 L 68 68 M 68 32 L 32 68" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" />}
    </svg>
  </div>
);

const MascaraOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const wrong = clamp(track("wrongHit.show", frame), 0, 1);
  const right = clamp(track("rightHits.show", frame), 0, 1);
  const p = at(POINTS.wrongDot, frame);
  const blink = 0.85 + 0.15 * Math.sin(local * 0.6);
  const leave = 1 - progress(local, scene.durationInFrames - 34, scene.durationInFrames - 22);
  return (
    <>
      <Label frame={frame} local={local} dur={scene.durationInFrames} point={[0.62, 0.52, -0.25]} text="MÁSCARA" appear={track("label.mask", frame) * leave} offset={[-150, -260]} accent={PALETTE.metal} />
      {wrong > 0.02 && p.visible ? <Mark x={p.x + 120} y={p.y + 150} ok={false} scale={wrong * blink} /> : null}
      {right > 0.02 && p.visible ? <Mark x={p.x + 120} y={p.y + 150} ok scale={right * leave} /> : null}
    </>
  );
};

// ---------------------------------------------------------------- 15. rótulos finais
const FINAL_LABELS: { p: Vec3; text: string; off: [number, number]; accent: string }[] = [
  { p: POINTS.cathode, text: "CÁTODO", off: [-40, 200], accent: PALETTE.cathodeHot },
  { p: POINTS.grid, text: "GRADE", off: [-60, -190], accent: PALETTE.signal },
  { p: POINTS.yoke, text: "BOBINAS", off: [40, -230], accent: PALETTE.copper },
  { p: POINTS.anode, text: "ÂNODO", off: [60, -200], accent: PALETTE.cable },
  { p: [0.4, 1.3, -0.25], text: "MÁSCARA", off: [140, -170], accent: PALETTE.metal },
  { p: [-0.5, -1.3, -0.07], text: "FÓSFORO", off: [80, 200], accent: PALETTE.accent },
];

const ConclusaoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const pose = cameraPoseAt(frame);
  const fade = 1 - progress(local, scene.durationInFrames - 22, scene.durationInFrames - 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      {FINAL_LABELS.map((l, i) => (
        <WorldLabel key={l.text} pose={pose} point={l.p} text={l.text} appear={pop(local, FPS, Math.max(W("s15", 0), 30) + i * 4)} offset={l.off} accent={l.accent} size={28} />
      ))}
    </div>
  );
};

export const GlobalOverlay: React.FC = () => null;

export const MODULES: Record<string, SceneModule> = {
  "scene-01-gancho": { Overlay: GanchoOverlay },
  "scene-02-fosforo": { Overlay: FosforoOverlay },
  "scene-03-canhao": { Overlay: CanhaoOverlay },
  "scene-05-anodo": { Overlay: AnodoOverlay },
  "scene-07-bobinas": { Overlay: BobinasOverlay },
  "scene-08-varredura": { Overlay: VarreduraOverlay },
  "scene-10-grade": { Overlay: GradeOverlay },
  "scene-11-velocidade": { Overlay: VelocidadeOverlay },
  "scene-12-persistencia": { Overlay: PersistenciaOverlay },
  "scene-14-mascara": { Overlay: MascaraOverlay },
  "scene-15-conclusao": { Overlay: ConclusaoOverlay },
};
