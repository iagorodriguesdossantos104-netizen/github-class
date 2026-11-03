import { useCurrentFrame } from "remotion";
import { isVisible, scenes, track } from "../data/scenes";
import { clamp } from "../utils/animation";
import { headAt, SITE, WELL, X0, X1, ZF } from "../utils/geology";
import { ArtesianWell, MAIN_WELL, outletPoint } from "./ArtesianWell";
import { PressureArrows } from "./Arrow3D";
import { DrillingMachine } from "./DrillingMachine";
import { House, SupplyDrop } from "./House";
import { TerrainCrossSection } from "./TerrainCrossSection";
import { Vegetation } from "./Vegetation";
import { HeadLevelLine, Jet, PipeRun, RisingParticles, WaterColumn } from "./WaterFlow";
import { TANK_INLET, TANK_OUTLET, WaterReservoir } from "./WaterReservoir";

// O diorama persistente: o mesmo modelo do começo ao fim. Cada objeto lê seu estado das
// trilhas de animação das cenas (src/data/scenes.ts) no frame global, então nada "pula"
// de lugar entre cortes — só a câmera se move.

const OUT = outletPoint(MAIN_WELL);
// Captação: do registro, rente ao chão, sobe pela lateral da caixa (longe da janela de corte) e entra pela tampa.
const RISER_X = SITE.tank.x + 0.55;
const PIPE_TO_TANK: [number, number, number][] = [
  OUT,
  [OUT[0] + 0.25, OUT[1], OUT[2] - 0.05],
  [OUT[0] + 0.45, 0.12, OUT[2] - 0.3],
  [RISER_X - 0.25, 0.12, OUT[2] - 0.4],
  [RISER_X, 0.12, OUT[2] - 0.65],
  [RISER_X, 0.12, SITE.tank.z + 0.35],
  [RISER_X, 0.35, SITE.tank.z + 0.12],
  [RISER_X, TANK_INLET[1] + 0.1, SITE.tank.z + 0.05],
  [RISER_X - 0.25, TANK_INLET[1] + 0.14, SITE.tank.z + 0.05],
  [TANK_INLET[0], TANK_INLET[1] - 0.02, TANK_INLET[2]],
];
// Distribuição: sai pelo fundo da caixa, passa elevada sobre a captação e entra na parede da casa.
const HOUSE_FRONT = SITE.house.z + SITE.house.d / 2;
const PIPE_TO_HOUSE: [number, number, number][] = [
  TANK_OUTLET,
  [TANK_OUTLET[0], 0.36, TANK_OUTLET[2] + 0.05],
  [TANK_OUTLET[0] + 0.15, 0.32, TANK_OUTLET[2] + 0.4],
  [TANK_OUTLET[0] + 0.3, 0.32, HOUSE_FRONT + 0.2],
  [SITE.house.x - 0.5, 0.32, HOUSE_FRONT + 0.2],
  [SITE.house.x - 0.45, 0.32, HOUSE_FRONT + 0.01],
];

const DRILL_SCENE = scenes[2];

/** Rotação acumulada da broca (integral de drill.active). */
const spinAt = (frame: number) => {
  let a = 0;
  const end = Math.min(frame, DRILL_SCENE.startFrame + DRILL_SCENE.durationInFrames);
  for (let g = DRILL_SCENE.startFrame; g <= end; g++) a += 0.6 * track("drill.active", g);
  return a;
};

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const v = (name: string) => isVisible(name, frame);
  const explode = track("layers.explode", frame);
  const depth = track("drill.depth", frame);
  const finalGlow = track("final.glow", frame);
  const level = track("water.level", frame, WELL.bottom);
  const jet = track("jet", frame);
  const rising = clamp((level - WELL.bottom) / 0.3, 0, 1) * (level < WELL.top - 0.05 ? 1 : 0.35);
  const lift = explode * 0.8;
  return (
    <group>
      <TerrainCrossSection
        frame={frame}
        state={{
          explode,
          boreY: v("bore") || v("well") ? depth : 0,
          glow: {
            aquifer: track("aquifer.glow", frame) + finalGlow * 0.8,
            flash: track("aquifer.flash", frame),
            pressure: track("aquifer.pressure", frame),
            confining: track("confining.highlight", frame),
          },
          water: {
            intensity: v("aquiferWater") ? track("aquifer.particles", frame) : 0,
            inflow: track("water.inflow", frame),
            glow: track("aquifer.glow", frame) * 0.4 + finalGlow,
          },
        }}
      />
      {/* tudo o que está na superfície acompanha a camada de cima na vista explodida */}
      <group position={[0, lift, 0]}>
        {v("house") ? <House scale={track("house.scale", frame)} supplied={track("house.supplied", frame)} /> : null}
        {v("house") ? <SupplyDrop value={track("house.supplied", frame)} frame={frame} /> : null}
        {v("vegetation") ? <Vegetation scaleAt={(i) => track("vegetation.scale", frame - i * 2)} /> : null}
        {v("tank") ? <WaterReservoir scale={track("tank.scale", frame)} level={track("tank.level", frame)} glow={finalGlow} /> : null}
        {v("rig") ? (
          <DrillingMachine
            state={{
              drop: track("rig.drop", frame),
              mast: track("rig.mast", frame),
              depth,
              retract: track("drill.retract", frame),
              spin: spinAt(frame),
            }}
          />
        ) : null}
      </group>
      {v("well") ? (
        <ArtesianWell
          spec={MAIN_WELL}
          frame={frame}
          state={{
            install: track("casing.install", frame),
            seal: track("seal.install", frame),
            cap: track("cap.install", frame),
            casingGlow: track("casing.highlight", frame),
            protectionGlow: track("protection.highlight", frame),
          }}
        />
      ) : null}
      {v("waterColumn") ? <WaterColumn spec={MAIN_WELL} level={level} glow={finalGlow} /> : null}
      {v("waterColumn") ? <RisingParticles spec={MAIN_WELL} level={level} frame={frame} amount={rising} /> : null}
      {v("jet") ? <Jet spec={MAIN_WELL} amount={jet} frame={frame} /> : null}
      <PressureArrows amount={track("pressure.arrows", frame)} frame={frame} />
      {v("headLine") ? <HeadLevelLine from={X0 + 0.2} to={X1 - 0.2} yAt={headAt} z={ZF + 0.3} opacity={track("headLine", frame)} frame={frame} /> : null}
      {v("pipes") ? (
        <>
          <PipeRun points={PIPE_TO_TANK} grow={track("pipe.grow", frame)} flow={track("pipe.flow", frame)} frame={frame} />
          <PipeRun points={PIPE_TO_HOUSE} grow={track("pipe.grow", frame)} flow={track("house.flow", frame)} frame={frame} />
        </>
      ) : null}
    </group>
  );
};
