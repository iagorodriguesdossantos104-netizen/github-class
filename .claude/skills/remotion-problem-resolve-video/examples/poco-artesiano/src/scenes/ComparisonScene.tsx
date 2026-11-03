import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { AquiferGrains, AquiferWater, Fractures } from "../components/Aquifer";
import { ArtesianWell, type WellSpec } from "../components/ArtesianWell";
import { sphericalToPosition, usePose, type CameraPose } from "../components/CameraController";
import { GeologicalLayers } from "../components/GeologicalLayers";
import { Lighting } from "../components/Lighting";
import { SubmersiblePump } from "../components/SubmersiblePump";
import { HeadLevelLine, Jet, RisingParticles, WaterColumn } from "../components/WaterFlow";
import { WorldLabel } from "../components/WorldLabel";
import { RIGHT_HEAD, track } from "../data/scenes";
import { CAMERA, MATTE, PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { headAt, WELL, ZF } from "../utils/geology";
import { HEIGHT, WIDTH } from "../utils/timing";
import type { SceneModule, SceneProps } from "./types";

// 00:29 — Tela dividida em dois cortes com as MESMAS camadas:
// à esquerda o nível de pressão fica acima do solo (a água jorra sozinha);
// à direita ele fica abaixo do solo — a água para no meio do caminho e uma bomba submersa a eleva.

const GAP = 16;
const PW = (WIDTH - GAP) / 2;
const XA = WELL.x - 1.0;
const XB = WELL.x + 1.0;
const YLO = -4.6;
const SPEC: WellSpec = { ...WELL, boreR: 0.34, casingR: 0.23, casingInner: 0.185 };
const PUMP_Y = -2.15;
const SLOT = { x: SPEC.x, r: SPEC.boreR, recess: SPEC.boreR, depthY: SPEC.bottom };
const FULL = { install: 1, seal: 1, cap: 0, casingGlow: 0, protectionGlow: 0 };

type Side = "left" | "right";

/** Câmera de cada painel: frontal, com dolly-in lento e leve deriva (`local` = frame da cena). */
const panelPose = (frame: number, local: number, side: Side): CameraPose => {
  const target: Vec3 = [WELL.x, -1.32, ZF - 0.5];
  const az = ((side === "left" ? -9 : 9) + 2.2 * Math.sin(frame / 50)) * (Math.PI / 180);
  const el = (7 + 1.2 * Math.sin(frame / 61)) * (Math.PI / 180);
  const dist = 30.5 - 0.008 * local;
  return { position: sphericalToPosition(target, dist, az, el), target, fov: CAMERA.fov };
};

const flatHead = () => RIGHT_HEAD;

const PanelWorld: React.FC<{ side: Side; frame: number; pose: CameraPose; level: number; pumpOn: number; pumpFlow: number }> = ({ side, frame, pose, level, pumpOn, pumpFlow }) => {
  usePose(pose);
  const left = side === "left";
  const details = useMemo(
    () => ({
      aquifer: <AquiferGrains xa={XA} xb={XB} ylo={YLO} boreY={SPEC.bottom} slotR={SPEC.boreR} />,
      bedrock: <Fractures glow={0.6} xa={XA} xb={XB} />,
    }),
    [],
  );
  return (
    <>
      <Lighting shadowExtent={5} />
      <GeologicalLayers frame={frame} xa={XA} xb={XB} zBack={ZF - 1.3} ylo={YLO} slot={SLOT} glow={{ aquifer: 0.5, flash: 0, pressure: 0.3, confining: 0 }} details={details} />
      <AquiferWater frame={frame} intensity={1} inflow={left ? 1 : pumpFlow} glow={0.4} xa={XA} xb={XB} filterGap={SPEC.casingR + 0.02} />
      <mesh position={[WELL.x, YLO - 0.2, ZF - 0.65]}>
        <boxGeometry args={[XB - XA + 0.3, 0.4, 1.6]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.pedestal} />
      </mesh>
      <ArtesianWell spec={SPEC} state={FULL} frame={frame} />
      <WaterColumn spec={SPEC} level={level} />
      <RisingParticles spec={SPEC} level={level} frame={frame} amount={left ? 0.6 : clamp((level - SPEC.bottom) / 0.3, 0, 1)} />
      {left ? <Jet spec={SPEC} amount={1} frame={frame} height={0.75} /> : <SubmersiblePump spec={SPEC} pumpY={PUMP_Y} on={pumpOn} flow={pumpFlow} frame={frame} />}
      <HeadLevelLine from={XA + 0.05} to={XB - 0.05} yAt={left ? headAt : flatHead} z={ZF + 0.4} opacity={1} frame={frame} color={left ? PALETTE.pressure : "#ffb3b3"} />
    </>
  );
};

const Panel: React.FC<{ side: Side; frame: number; local: number; slide: number; dim: number }> = ({ side, frame, local, slide, dim }) => {
  const left = side === "left";
  const level = left ? SPEC.top : track("right.level", frame, SPEC.bottom);
  const pumpOn = left ? 0 : track("pump.on", frame);
  const pumpFlow = left ? 0 : track("pump.flow", frame);
  const miss = left ? 0 : track("right.miss", frame);
  const pose = panelPose(frame, local, side);
  const vp = { width: PW, height: HEIGHT };
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: left ? 0 : PW + GAP,
        width: PW,
        height: HEIGHT,
        overflow: "hidden",
        translate: `${(left ? -1 : 1) * (1 - slide) * (PW + 40)}px 0px`,
        background: "linear-gradient(180deg, #2a5f8f 0%, #1a3d63 45%, #0e2138 100%)",
      }}
    >
      <ThreeCanvas width={PW} height={HEIGHT} gl={{ antialias: true }} shadows="percentage" flat camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: pose.position }}>
        <PanelWorld side={side} frame={frame} pose={pose} level={level} pumpOn={pumpOn} pumpFlow={pumpFlow} />
      </ThreeCanvas>
      <WorldLabel pose={pose} point={[XA + 0.3, left ? headAt(XA + 0.3) : RIGHT_HEAD, ZF + 0.4]} text={"NÍVEL DA\nPRESSÃO"} appear={1} offset={[-38, left ? 48 : 62]} accent={left ? PALETTE.pressure : "#ffb3b3"} size={24} viewport={vp} />
      {left ? null : (
        <>
          <WorldLabel pose={pose} point={[WELL.x, -0.45, ZF + 0.2]} text="NÃO CHEGA AO SOLO" appear={miss} offset={[0, -150]} accent={PALETTE.negative} size={25} viewport={vp} />
          <WorldLabel pose={pose} point={[WELL.x + 0.12, PUMP_Y, ZF]} text="BOMBA" appear={pumpOn} offset={[150, 70]} accent={PALETTE.positive} size={32} viewport={vp} />
        </>
      )}
      <div style={{ position: "absolute", inset: 0, background: "#07111f", opacity: dim }} />
    </div>
  );
};

const Overlay: React.FC<SceneProps> = ({ scene }) => {
  const local = useCurrentFrame();
  const frame = local + scene.startFrame;
  const slide = track("split", frame);
  if (slide <= 0.001) return null;
  const focus = track("compare.focus", frame);
  return (
    <>
      <Panel side="left" frame={frame} local={local} slide={slide} dim={0.5 * focus} />
      <Panel side="right" frame={frame} local={local} slide={slide} dim={0.5 * (1 - focus)} />
      <div style={{ position: "absolute", top: 0, left: PW, width: GAP, height: HEIGHT, background: "#0a1420", opacity: clamp(slide, 0, 1) }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: GAP / 2 - 3, width: 6, background: "#ffffff", opacity: 0.9 }} />
      </div>
    </>
  );
};

export const ComparisonScene: SceneModule = { Overlay };
