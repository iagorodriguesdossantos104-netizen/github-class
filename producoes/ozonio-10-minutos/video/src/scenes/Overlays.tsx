import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
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
const outFade = (local: number, dur: number) => 1 - progress(local, dur - 10, dur - 2);

const Panel: React.FC<{ x: number; y: number; children: React.ReactNode; accent?: string; scale?: number; opacity?: number; size?: number; rotate?: number }> = ({
  x,
  y,
  children,
  accent = PALETTE.accent,
  scale = 1,
  opacity = 1,
  size = 38,
  rotate = 0,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-50% -50%",
      scale: String(scale),
      rotate: `${rotate}deg`,
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
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    {children}
  </div>
);

const RayLabels: React.FC<{ frame: number; appear: number }> = ({ frame, appear }) => {
  const pose = cameraPoseAt(frame);
  return (
    <>
      <WorldLabel pose={pose} point={POINTS.uva} text="UV-A" appear={appear} offset={[-130, 60]} accent={PALETTE.uva} size={30} />
      <WorldLabel pose={pose} point={POINTS.uvb} text="UV-B" appear={appear} offset={[-120, -90]} accent={PALETTE.uvb} size={30} />
      <WorldLabel pose={pose} point={POINTS.uvc} text="UV-C" appear={appear} offset={[130, -80]} accent={PALETTE.uvc} size={30} />
    </>
  );
};

// ---------------------------------------------------------------- 2. régua "3 mm"
const EstratosferaOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const a = clamp(track("ruler.show", frame), 0, 1) * outFade(local, scene.durationInFrames);
  if (a < 0.01) return null;
  return (
    <Panel x={540} y={1180} scale={0.8 + 0.2 * a} opacity={a} accent={PALETTE.ozone}>
      <svg width={40} height={56} viewBox="0 0 40 56" aria-hidden="true">
        <path d="M20 4 V20 M12 12 L20 20 L28 12 M20 52 V36 M12 44 L20 36 L28 44" stroke={PALETTE.ozone} strokeWidth={5} fill="none" strokeLinecap="round" />
        <line x1={4} y1={28} x2={36} y2={28} stroke="#ffffff" strokeWidth={4} />
      </svg>
      {"COMPRIMIDA: ≈ 3 mm"}
    </Panel>
  );
};

// ---------------------------------------------------------------- 3. "ANTES" + rótulos dos raios
const FiltroOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const b = clamp(track("replay.before", frame), 0, 1);
  return (
    <>
      {b > 0.01 ? (
        <Panel x={250} y={520} rotate={-8} opacity={b} accent={PALETTE.warning} size={44}>
          ANTES
        </Panel>
      ) : null}
      <RayLabels frame={frame} appear={pop(local, FPS, 14) * outFade(local, scene.durationInFrames)} />
    </>
  );
};

// ---------------------------------------------------------------- 4. lâmpada germicida + rótulos
const UvcOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const lamp = clamp(track("lamp.show", frame), 0, 1.2) * outFade(local, scene.durationInFrames);
  return (
    <>
      <RayLabels frame={frame} appear={(1 - progress(local, W("s4", 18), W("s4", 20))) * pop(local, FPS, 0)} />
      {lamp > 0.01 ? (
        <Panel x={540} y={560} scale={lamp} accent={PALETTE.uvc} size={34}>
          <svg width={70} height={40} viewBox="0 0 70 40" aria-hidden="true">
            <rect x={4} y={12} width={62} height={16} rx={8} fill={PALETTE.uvc} stroke="#ffffff" strokeWidth={3} />
            <rect x={0} y={14} width={6} height={12} fill="#9aa3ad" />
            <rect x={64} y={14} width={6} height={12} fill="#9aa3ad" />
          </svg>
          {"LÂMPADA UV-C\nDE HOSPITAL"}
        </Panel>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- 6. "não esquenta"
const PeleOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { frame } = useFrames(scene);
  const h = clamp(track("heat.icon", frame), 0, 1);
  if (h < 0.01) return null;
  return (
    <Panel x={540} y={560} opacity={h} scale={0.85 + 0.15 * h} accent={PALETTE.info} size={36}>
      <svg width={30} height={64} viewBox="0 0 30 64" aria-hidden="true">
        <rect x={10} y={4} width={10} height={40} rx={5} fill="none" stroke="#ffffff" strokeWidth={3} />
        <circle cx={15} cy={50} r={10} fill={PALETTE.info} stroke="#ffffff" strokeWidth={3} />
        <rect x={13} y={30} width={4} height={18} fill={PALETTE.info} />
      </svg>
      NÃO ESQUENTA
    </Panel>
  );
};

// ---------------------------------------------------------------- 7. barra de dose + inserto "+6 h"
const QueimaduraOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const dose = clamp(track("dose.level", frame), 0, 1);
  const red = clamp(track("skin.redPreview", frame), 0, 1);
  const o = pop(local, FPS, 4) * outFade(local, scene.durationInFrames);
  const H = 420;
  return (
    <>
      <div style={{ position: "absolute", left: 120, top: 520, opacity: o, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 28, color: "#ffffff", WebkitTextStroke: `7px ${PALETTE.outline}`, paintOrder: "stroke fill" }}>DOSE DE UV</div>
        <div style={{ position: "relative", width: 70, height: H, borderRadius: 35, background: "rgba(10,20,32,0.85)", border: "4px solid #ffffff", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: H * dose, background: `linear-gradient(0deg, ${PALETTE.warning}, ${PALETTE.negative})` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.12, height: 5, background: "#ffffff" }} />
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 24, color: PALETTE.negative, WebkitTextStroke: `6px ${PALETTE.outline}`, paintOrder: "stroke fill", textAlign: "center" }}>{"NÍVEL DE\nQUEIMADURA".split("\n").map((l) => <div key={l}>{l}</div>)}</div>
      </div>
      {red > 0.01 ? (
        <div style={{ position: "absolute", left: 820, top: 700, translate: "-50% -50%", scale: String(0.8 + 0.2 * red), opacity: red * outFade(local, scene.durationInFrames) }}>
          <div style={{ width: 260, height: 300, borderRadius: 28, background: "rgba(10,20,32,0.9)", border: `5px solid ${PALETTE.negative}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width={150} height={190} viewBox="0 0 150 190" aria-hidden="true">
              <circle cx={75} cy={44} r={34} fill={PALETTE.skinRed} />
              <path d="M20 190 Q24 92 75 88 Q126 92 130 190 Z" fill={PALETTE.skinRed} />
              <path d="M60 40 L66 52 M88 40 L84 52" stroke="#7a1f14" strokeWidth={4} strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: "#ffffff" }}>+6 h</div>
          </div>
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- 8. soldador e lua
const OlhosOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const w = clamp(track("welder.show", frame), 0, 1.2);
  const m = clamp(track("moon.show", frame), 0, 1.2) * outFade(local, scene.durationInFrames);
  return (
    <>
      {w > 0.01 ? (
        <Panel x={540} y={560} scale={w} accent={PALETTE.warning} size={32}>
          <svg width={80} height={70} viewBox="0 0 80 70" aria-hidden="true">
            <circle cx={30} cy={26} r={16} fill={PALETTE.skin} />
            <path d="M10 70 Q12 44 30 42 Q48 44 50 70 Z" fill="#5d6670" />
            <path d="M50 50 L72 38" stroke="#9aa3ad" strokeWidth={6} strokeLinecap="round" />
            <circle cx={74} cy={36} r={6} fill="#ffffff" />
            <circle cx={74} cy={36} r={12} fill="none" stroke={PALETTE.uvb} strokeWidth={3} />
          </svg>
          {"SOLDADOR\nSEM MÁSCARA"}
        </Panel>
      ) : null}
      {m > 0.01 ? (
        <Panel x={540} y={560} scale={m} accent="#9aa7ff" size={34}>
          <svg width={54} height={54} viewBox="0 0 54 54" aria-hidden="true">
            <path d="M36 6 A22 22 0 1 0 48 38 A18 18 0 1 1 36 6 Z" fill="#ffe9a8" />
          </svg>
          DOR À NOITE
        </Panel>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- 12. calendário
const NoiteOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const d = clamp(track("calendar.days", frame), 0, 1);
  if (d < 0.01) return null;
  const day = Math.min(3, 1 + Math.floor(d * 3));
  return (
    <div style={{ position: "absolute", left: 540, top: 560, translate: "-50% -50%", opacity: outFade(local, scene.durationInFrames), scale: String(0.85 + 0.15 * clamp(d * 4, 0, 1)) }}>
      <div style={{ width: 220, borderRadius: 22, overflow: "hidden", border: "5px solid #ffffff", background: "#ffffff", boxShadow: "0 12px 26px rgba(0,0,0,0.38)" }}>
        <div style={{ background: PALETTE.positive, color: "#ffffff", fontFamily: FONT, fontWeight: 900, fontSize: 30, textAlign: "center", padding: "8px 0" }}>DIA</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, color: "#0a1420", textAlign: "center", lineHeight: 1.1 }}>{`+${day}`}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 13. gráfico de risco
const RiscoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const r = clamp(track("risk.chart", frame), 0, 1);
  if (r < 0.01) return null;
  const Wd = 560;
  const Hd = 260;
  const pts = Array.from({ length: 21 }, (_, i) => {
    const t = (i / 20) * r;
    return `${40 + t * (Wd - 80)},${Hd - 50 - (t * t * 0.5 + t * 0.35) * (Hd - 110)}`;
  }).join(" ");
  return (
    <div style={{ position: "absolute", left: 540, top: 590, translate: "-50% -50%", opacity: outFade(local, scene.durationInFrames) }}>
      <svg width={Wd} height={Hd} viewBox={`0 0 ${Wd} ${Hd}`} role="img" aria-label="Risco de câncer de pele aumenta ao longo dos anos">
        <rect x={0} y={0} width={Wd} height={Hd} rx={24} fill="rgba(10,20,32,0.88)" stroke={PALETTE.warning} strokeWidth={4} />
        <line x1={40} y1={Hd - 50} x2={Wd - 30} y2={Hd - 50} stroke="#ffffff" strokeWidth={4} />
        <line x1={40} y1={Hd - 50} x2={40} y2={30} stroke="#ffffff" strokeWidth={4} />
        <polyline points={pts} fill="none" stroke={PALETTE.negative} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <text x={Wd - 40} y={Hd - 18} fill="#ffffff" fontFamily={FONT} fontWeight={900} fontSize={26} textAnchor="end">ANOS →</text>
        <text x={56} y={44} fill="#ffffff" fontFamily={FONT} fontWeight={900} fontSize={26}>RISCO</text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- 14. CFC banido
const MontrealOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { frame } = useFrames(scene);
  const s = clamp(track("cfc.show", frame), 0, 1.2);
  const x = clamp(track("cfc.cross", frame), 0, 1.2);
  if (s < 0.01) return null;
  return (
    <div style={{ position: "absolute", left: 540, top: 600, translate: "-50% -50%", scale: String(s) }}>
      <svg width={220} height={240} viewBox="0 0 220 240" role="img" aria-label="Lata de spray com CFC proibida">
        <rect x={60} y={60} width={100} height={160} rx={18} fill="#d9e1e8" stroke="#0a1420" strokeWidth={6} />
        <rect x={85} y={30} width={50} height={34} rx={6} fill="#9aa3ad" stroke="#0a1420" strokeWidth={6} />
        <rect x={100} y={14} width={20} height={20} rx={4} fill="#0a1420" />
        <text x={110} y={150} fill="#0a1420" fontFamily={FONT} fontWeight={900} fontSize={38} textAnchor="middle">CFC</text>
        <g transform={`translate(110 130) scale(${x}) translate(-110 -130)`}>
          <path d="M30 50 L190 210 M190 50 L30 210" stroke={PALETTE.negative} strokeWidth={22} strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- 15. rótulos finais
const ConclusaoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const pose = cameraPoseAt(frame);
  const fadeOut = 1 - progress(local, scene.durationInFrames - 22, scene.durationInFrames - 8);
  const L: { p: Vec3; t: string; off: [number, number]; c: string }[] = [
    { p: POINTS.ozone, t: "OZÔNIO", off: [-150, -120], c: PALETTE.ozone },
    { p: POINTS.uva, t: "UV-A", off: [-140, 60], c: PALETTE.uva },
    { p: POINTS.uvb, t: "UV-B", off: [-130, -60], c: PALETTE.uvb },
    { p: POINTS.uvc, t: "UV-C", off: [140, -60], c: PALETTE.uvc },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
      {L.map((l, i) => (
        <WorldLabel key={l.t} pose={pose} point={l.p} text={l.t} appear={pop(local, FPS, Math.max(W("s15", 0), 20) + i * 4)} offset={l.off} accent={l.c} size={30} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- relógio 2D (cenas 1–11)
export const GlobalOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const show = clamp(track("timer.show", frame), 0, 1.2);
  if (show < 0.01) return null;
  const min = clamp(track("timer.min", frame), 0, 10);
  const mm = Math.floor(min);
  const ss = Math.floor((min - mm) * 60);
  const done = min >= 9.999;
  return (
    <div style={{ position: "absolute", left: 540, top: 196, translate: "-50% -50%", scale: String(show), display: "flex", alignItems: "center", gap: 12, padding: "8px 22px", borderRadius: 999, background: "rgba(10,20,32,0.88)", border: `4px solid ${done ? PALETTE.positive : PALETTE.warning}` }}>
      <svg width={34} height={34} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#ffffff" strokeWidth={2.4} strokeLinecap="round">
        <circle cx={12} cy={13} r={8} />
        <path d="M12 9v4l3 2M9 2h6" />
      </svg>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: "#ffffff", fontVariantNumeric: "tabular-nums" }}>{`${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`}</span>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: "#cfd8e3" }}>TEMPO ACELERADO</span>
    </div>
  );
};

export const MODULES: Record<string, SceneModule> = {
  "scene-02-estratosfera": { Overlay: EstratosferaOverlay },
  "scene-03-filtro": { Overlay: FiltroOverlay },
  "scene-04-uvc": { Overlay: UvcOverlay },
  "scene-06-pele": { Overlay: PeleOverlay },
  "scene-07-queimadura": { Overlay: QueimaduraOverlay },
  "scene-08-olhos": { Overlay: OlhosOverlay },
  "scene-12-noite": { Overlay: NoiteOverlay },
  "scene-13-risco": { Overlay: RiscoOverlay },
  "scene-14-montreal": { Overlay: MontrealOverlay },
  "scene-15-conclusao": { Overlay: ConclusaoOverlay },
};
