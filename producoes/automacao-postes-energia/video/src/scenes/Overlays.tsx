import { useCurrentFrame } from "remotion";
import { cameraPoseAt, projectPoint } from "../components/CameraController";
import { HOUSES, POINTS, WIRE_Y } from "../components/World";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { FONT, PALETTE } from "../theme";
import { clamp, lerp, pop, progress, type Vec3 } from "../utils/animation";
import { FPS, s, wordLocal } from "../utils/timing";
import type { SceneModule, SceneProps } from "./types";

// Camadas 2D de cada cena. useCurrentFrame() é LOCAL; somamos scene.startFrame para ler trilhas.

const W = wordLocal;
const useFrames = (scene: SceneProps["scene"]) => {
  const local = useCurrentFrame();
  return { local, frame: local + scene.startFrame };
};

const Panel: React.FC<{ x: number; y: number; children: React.ReactNode; accent?: string; scale?: number; opacity?: number; center?: boolean }> = ({
  x,
  y,
  children,
  accent = PALETTE.accent,
  scale = 1,
  opacity = 1,
  center = true,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: center ? "-50% -50%" : undefined,
      scale: String(scale),
      opacity,
      padding: "14px 26px",
      borderRadius: 26,
      background: "rgba(10, 20, 32, 0.88)",
      border: `4px solid ${accent}`,
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 40,
      color: "#ffffff",
      whiteSpace: "pre",
      textAlign: "center",
      boxShadow: "0 12px 26px rgba(0,0,0,0.38)",
    }}
  >
    {children}
  </div>
);

const at = (p: Vec3, frame: number) => projectPoint(cameraPoseAt(frame), p);

// ---------------------------------------------------------------- 1. gancho
const GanchoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const press = progress(local, W("s1", 1), W("s1", 1) + 18);
  const sw = at(POINTS.house3Switch, frame);
  const ripple = press > 0 && press < 1 ? press : 0;
  return (
    <>
      {ripple > 0 && sw.visible ? (
        <div
          style={{
            position: "absolute",
            left: sw.x,
            top: sw.y,
            width: 60 + ripple * 160,
            height: 60 + ripple * 160,
            translate: "-50% -50%",
            borderRadius: "50%",
            border: `8px solid ${PALETTE.warning}`,
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      <WorldLabel pose={cameraPoseAt(frame)} point={POINTS.substation} text="SUBESTAÇÃO" appear={track("labels.street", frame)} offset={[140, -150]} />
    </>
  );
};

// ---------------------------------------------------------------- 3. disjuntor (medidor de corrente)
const Gauge: React.FC<{ value: number; appear: number }> = ({ value, appear }) => {
  const ang = lerp(-75, 75, clamp(value, 0, 1));
  return (
    <div style={{ position: "absolute", left: 90, top: 520, width: 330, height: 250, opacity: clamp(appear * 1.5, 0, 1), scale: String(0.7 + 0.3 * clamp(appear, 0, 1)), transformOrigin: "0 0" }}>
      <svg width={330} height={250} viewBox="0 0 330 250">
        <rect x={0} y={0} width={330} height={250} rx={28} fill="rgba(10,20,32,0.88)" stroke={PALETTE.accent} strokeWidth={4} />
        <path d="M 55 180 A 110 110 0 0 1 220 85" fill="none" stroke="#20b85a" strokeWidth={18} />
        <path d="M 220 85 A 110 110 0 0 1 275 180" fill="none" stroke="#e5383b" strokeWidth={18} />
        <g transform={`translate(165 180) rotate(${ang})`}>
          <path d="M -7 0 L 0 -100 L 7 0 Z" fill="#ffffff" />
        </g>
        <circle cx={165} cy={180} r={13} fill="#ffffff" />
        <text x={165} y={232} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={32} fill="#ffffff">
          CORRENTE
        </text>
      </svg>
    </div>
  );
};

const DisjuntorOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const appear = progress(local, W("s3", 8) - 8, W("s3", 8) + 6) * (1 - progress(local, W("s3", 18) + 6, W("s3", 18) + 14));
  return (
    <>
      {appear > 0.001 ? <Gauge value={track("meter.needle", frame, 0.3)} appear={appear} /> : null}
      <WorldLabel pose={cameraPoseAt(frame)} point={POINTS.breaker} text="DISJUNTOR" appear={progress(local, W("s3", 6), W("s3", 6) + 10)} offset={[150, 170]} accent={PALETTE.info} />
    </>
  );
};

// ---------------------------------------------------------------- 4. apagão (interrogações)
const ApagaoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { frame } = useFrames(scene);
  const q = clamp(track("houses.question", frame), 0, 1.2);
  if (q < 0.01) return null;
  return (
    <>
      {HOUSES.map((h, i) => {
        const p = at([h.x, 2.6, -2.4], frame);
        if (!p.visible) return null;
        return (
          <div
            key={h.x}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y - 10 * Math.sin(frame / 6 + i),
              translate: "-50% -50%",
              scale: String(q),
              width: 64,
              height: 64,
              borderRadius: 32,
              background: PALETTE.warning,
              border: "4px solid #1d1a0c",
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 44,
              lineHeight: "56px",
              textAlign: "center",
              color: "#1d1a0c",
            }}
          >
            ?
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- 5. religador (contador de espera)
const ReligadorOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const pose = cameraPoseAt(frame);
  const count = track("timer.count", frame);
  const show = progress(local, W("s5", 7) - 4, W("s5", 7) + 4) * (1 - progress(local, W("s5", 11) + 10, W("s5", 11) + 18));
  const p = projectPoint(pose, POINTS.recloser);
  return (
    <>
      <WorldLabel pose={pose} point={POINTS.recloser} text="RELIGADOR" appear={progress(local, W("s5", 3) + 8, W("s5", 3) + 18)} offset={[-210, 230]} accent={PALETTE.positive} />
      {show > 0.01 ? (
        <Panel x={p.x + 230} y={p.y - 200} accent={PALETTE.warning} opacity={show} scale={0.8 + 0.2 * show}>
          {`ESPERANDO\n${Math.min(2, Math.floor(count) + 1)} s…`}
        </Panel>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- 7. falha permanente (tentativas)
const PermanenteOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const count = track("attempts.count", frame);
  const show = progress(local, s(3.6), s(3.8));
  if (show < 0.01) return null;
  const p = at(POINTS.recloser, frame);
  const locked = count > 2.85;
  const text = locked ? "BLOQUEADO" : count < 1 ? "TENTATIVA 1" : "TENTATIVA 2";
  return (
    <Panel x={p.x + 40} y={p.y - 230} accent={locked ? PALETTE.negative : PALETTE.warning} opacity={show}>
      {text}
    </Panel>
  );
};

// ---------------------------------------------------------------- 8. sem luz (régua de distância)
const SemLuzOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const pose = cameraPoseAt(frame);
  const draw = clamp(track("ruler.draw", frame), 0, 1);
  const a = projectPoint(pose, [6, 0.2, -1.2]);
  const b = projectPoint(pose, [2, 0.2, 1.2]);
  const ex = lerp(a.x, b.x, draw);
  const ey = lerp(a.y, b.y, draw);
  return (
    <>
      {draw > 0.01 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={8} strokeDasharray="22 16" strokeLinecap="round" />
          <circle cx={a.x} cy={a.y} r={12} fill={PALETTE.warning} />
          <circle cx={ex} cy={ey} r={12} fill={PALETTE.negative} />
        </svg>
      ) : null}
      <WorldLabel pose={pose} point={POINTS.house7} text={"LONGE\nDO DEFEITO"} appear={progress(local, W("s8", 7), W("s8", 7) + 10)} offset={[60, -260]} accent={PALETTE.warning} />
    </>
  );
};

// ---------------------------------------------------------------- 9. chaves
const ChavesOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const pose = cameraPoseAt(frame);
  const appear = progress(local, W("s9", 2) + 10, W("s9", 2) + 20) * (1 - progress(local, W("s9", 9), W("s9", 9) + 8));
  return (
    <>
      <WorldLabel pose={pose} point={POINTS.switch1} text="CHAVE" appear={appear} offset={[-120, -150]} accent={PALETTE.positive} />
      <WorldLabel pose={pose} point={POINTS.switch2} text="CHAVE" appear={appear} offset={[120, -150]} accent={PALETTE.positive} />
    </>
  );
};

// ---------------------------------------------------------------- 10. fios inteiros
const EscuroOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { frame } = useFrames(scene);
  const ok = clamp(track("segD.okMarks", frame), 0, 1.2);
  const pose = cameraPoseAt(frame);
  return (
    <>
      {[4, 6].map((x, i) => (
        <WorldLabel key={x} pose={pose} point={[x, WIRE_Y - 0.15, 0]} text="FIO OK" appear={clamp(ok - i * 0.15, 0, 1.2)} offset={[i ? 90 : -90, -170]} accent={PALETTE.positive} size={34} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------- 11. chave NA
const ChaveNaOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const pose = cameraPoseAt(frame);
  return (
    <>
      <WorldLabel pose={pose} point={POINTS.tie} text="CHAVE NA" appear={progress(local, W("s11", 3) + 6, W("s11", 3) + 16) * (1 - progress(local, s(3.4), s(3.7)))} offset={[-200, -170]} accent={PALETTE.warning} />
      <WorldLabel pose={pose} point={POINTS.neighbor} text={"CIRCUITO\nVIZINHO"} appear={progress(local, W("s11", 12), W("s11", 12) + 10)} offset={[-230, 170]} accent={PALETTE.positive} />
    </>
  );
};

// ---------------------------------------------------------------- 12. comunicação
const ComunicacaoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  return <WorldLabel pose={cameraPoseAt(frame)} point={POINTS.cod} text={"CENTRO DE\nOPERAÇÃO"} appear={progress(local, W("s12", 15), W("s12", 15) + 10)} offset={[200, 160]} accent={PALETTE.radio} />;
};

// ---------------------------------------------------------------- 13. software no telão
const MapScreen: React.FC<{ frame: number; steps: number }> = ({ frame, steps }) => {
  const pose = cameraPoseAt(frame);
  const [cx, cy, cz] = POINTS.codScreen;
  const tl = projectPoint(pose, [cx - 1.2, cy + 0.6, cz]);
  const br = projectPoint(pose, [cx + 1.2, cy - 0.6, cz]);
  if (!tl.visible || !br.visible) return null;
  const w = br.x - tl.x;
  const h = br.y - tl.y;
  if (w < 80) return null;
  const xs = (x: number) => ((x + 9) / 17) * 100; // rua -9..8 → 0..100
  const seg = (a: number, b: number, color: string, on: boolean) => <line x1={xs(a)} y1={50} x2={xs(b)} y2={50} stroke={on ? color : "#3a4a5e"} strokeWidth={5} strokeLinecap="round" />;
  const sOpen = steps >= 2;
  const recOk = steps >= 3;
  const tieOn = steps >= 4;
  const node = (x: number, color: string, open: boolean) => (
    <g>
      <circle cx={xs(x)} cy={50} r={5} fill={color} stroke="#ffffff" strokeWidth={1.2} />
      {open ? <line x1={xs(x) - 3} y1={47} x2={xs(x) + 3} y2={53} stroke="#ffffff" strokeWidth={1.4} /> : null}
    </g>
  );
  return (
    <svg style={{ position: "absolute", left: tl.x, top: tl.y }} width={w} height={h} viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x={0} y={0} width={100} height={100} fill="#0c2238" />
      <text x={4} y={14} fontFamily={FONT} fontWeight={900} fontSize={8} fill="#7fd4ff">
        SELF-HEALING
      </text>
      {seg(-9, -3, PALETTE.segA, true)}
      {seg(-3, 1, PALETTE.segB, recOk)}
      {seg(1, 3, PALETTE.segC, false)}
      {seg(3, 7, PALETTE.segD, tieOn)}
      {seg(7, 8, PALETTE.radio, true)}
      {node(-3, recOk ? PALETTE.positive : PALETTE.negative, !recOk)}
      {node(1, steps >= 2 ? PALETTE.negative : PALETTE.positive, sOpen)}
      {node(3, steps >= 2 ? PALETTE.negative : PALETTE.positive, sOpen)}
      {node(7, tieOn ? PALETTE.positive : PALETTE.warning, !tieOn)}
      {steps >= 1 ? (
        <path d={`M ${xs(2) - 4} 32 L ${xs(2) + 4} 42 M ${xs(2) + 4} 32 L ${xs(2) - 4} 42`} stroke={PALETTE.negative} strokeWidth={2.6} strokeLinecap="round" />
      ) : null}
      {[1, 2, 3, 4].map((i) => (
        <rect key={i} x={6 + (i - 1) * 23} y={74} width={19} height={12} rx={3} fill={steps >= i ? PALETTE.positive : "#26384d"} />
      ))}
    </svg>
  );
};

const Clock: React.FC<{ spin: number; appear: number }> = ({ spin, appear }) => (
  <div style={{ position: "absolute", left: 1080 - 90 - 300, top: 1180, opacity: clamp(appear * 1.5, 0, 1), scale: String(0.7 + 0.3 * clamp(appear, 0, 1)) }}>
    <Panel x={0} y={0} center={false} accent={PALETTE.positive}>
      <span style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <svg width={56} height={56} viewBox="0 0 56 56">
          <circle cx={28} cy={28} r={24} fill="none" stroke="#ffffff" strokeWidth={5} />
          <line x1={28} y1={28} x2={28 + 15 * Math.sin(spin * Math.PI * 2)} y2={28 - 15 * Math.cos(spin * Math.PI * 2)} stroke={PALETTE.positive} strokeWidth={5} strokeLinecap="round" />
        </svg>
        {"MINUTOS"}
      </span>
    </Panel>
  </div>
);

const SoftwareOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const steps = Math.floor(track("cod.mapSteps", frame) + 0.001);
  const clockIn = progress(local, W("s13", 9) - 4, W("s13", 9) + 6) * (1 - progress(local, s(5.1), s(5.4)));
  return (
    <>
      <MapScreen frame={frame} steps={steps} />
      {clockIn > 0.01 ? <Clock spin={track("clock.spin", frame)} appear={clockIn} /> : null}
    </>
  );
};

// ---------------------------------------------------------------- 14. conclusão
const FINAL_LABELS: { p: Vec3; text: string; off: [number, number]; accent: string }[] = [
  { p: POINTS.breaker, text: "DISJUNTOR", off: [170, -110], accent: PALETTE.info },
  { p: POINTS.recloser, text: "RELIGADOR", off: [-150, -170], accent: PALETTE.positive },
  { p: [2, 4.75, 0], text: "CHAVES", off: [-60, -200], accent: PALETTE.positive },
  { p: POINTS.tie, text: "CHAVE NA", off: [80, -150], accent: PALETTE.warning },
  { p: POINTS.cod, text: "CENTRO DE\nOPERAÇÃO", off: [-150, 130], accent: PALETTE.radio },
];

const ConclusaoOverlay: React.FC<SceneProps> = ({ scene }) => {
  const { local, frame } = useFrames(scene);
  const pose = cameraPoseAt(frame);
  const fade = 1 - progress(local, scene.durationInFrames - 20, scene.durationInFrames - 6);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      {FINAL_LABELS.map((l, i) => (
        <WorldLabel key={l.text} pose={pose} point={l.p} text={l.text} appear={pop(local, FPS, W("s14", 7) + i * 4)} offset={l.off} accent={l.accent} size={30} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- camada global (cruza cenas)
/** Cadeado do religador bloqueado: aparece na cena 7 e some na 9. */
export const GlobalOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const lock = clamp(track("recloser.lock", frame), 0, 1.2);
  if (lock < 0.02) return null;
  const p = at(POINTS.recloser, frame);
  if (!p.visible) return null;
  return (
    <div style={{ position: "absolute", left: p.x - 120, top: p.y - 40, translate: "-50% -50%", scale: String(lock) }}>
      <svg width={84} height={100} viewBox="0 0 84 100">
        <path d="M 20 46 V 30 a 22 22 0 0 1 44 0 V 46" fill="none" stroke="#ffffff" strokeWidth={10} />
        <rect x={6} y={44} width={72} height={52} rx={10} fill={PALETTE.negative} stroke="#ffffff" strokeWidth={5} />
        <circle cx={42} cy={68} r={7} fill="#ffffff" />
      </svg>
    </div>
  );
};

export const MODULES: Record<string, SceneModule> = {
  "scene-01-gancho": { Overlay: GanchoOverlay },
  "scene-03-disjuntor": { Overlay: DisjuntorOverlay },
  "scene-04-apagao": { Overlay: ApagaoOverlay },
  "scene-05-religador": { Overlay: ReligadorOverlay },
  "scene-07-permanente": { Overlay: PermanenteOverlay },
  "scene-08-sem-luz": { Overlay: SemLuzOverlay },
  "scene-09-chaves": { Overlay: ChavesOverlay },
  "scene-10-escuro": { Overlay: EscuroOverlay },
  "scene-11-chave-na": { Overlay: ChaveNaOverlay },
  "scene-12-comunicacao": { Overlay: ComunicacaoOverlay },
  "scene-13-self-healing": { Overlay: SoftwareOverlay },
  "scene-14-conclusao": { Overlay: ConclusaoOverlay },
};
