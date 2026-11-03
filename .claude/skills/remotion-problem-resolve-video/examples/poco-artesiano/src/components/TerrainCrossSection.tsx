import { useMemo } from "react";
import { CanvasTexture, DoubleSide } from "three";
import { MATTE, PALETTE } from "../theme";
import { BOTTOM, WELL, X0, X1, Z0, ZF } from "../utils/geology";
import { AquiferGrains, AquiferWater, Fractures } from "./Aquifer";
import { GeologicalLayers, type LayerGlow } from "./GeologicalLayers";

// O bloco de terreno em corte (maquete científica): base escura, camadas e água subterrânea.

const radialTexture = (inner: string, outer: string, solid = 0.55) => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, inner);
  grad.addColorStop(solid, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.needsUpdate = true;
  return t;
};

/** Chão contínuo da abertura: o "mundo" ao redor, que some quando a câmera mergulha. */
export const GroundPlane: React.FC<{ reveal: number }> = ({ reveal }) => {
  // textura branca só com o alfa (a cor vem do material, igual ao topo do bloco)
  const tex = useMemo(() => radialTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)", 0.42), []);
  const scale = 1 - 0.7 * reveal;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.012, 0]} scale={[scale, scale, 1]} receiveShadow>
      <planeGeometry args={[44, 44]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.grass} map={tex} transparent alphaTest={0.02} depthWrite={false} />
    </mesh>
  );
};

const ShadowBlob: React.FC = () => {
  const tex = useMemo(() => radialTexture("rgba(0,0,0,0.5)", "rgba(0,0,0,0)"), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BOTTOM - 0.62, 0]}>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} side={DoubleSide} />
    </mesh>
  );
};

const Pedestal: React.FC = () => (
  <group>
    <mesh position={[0, BOTTOM - 0.28, (Z0 + ZF) / 2]} receiveShadow>
      <boxGeometry args={[X1 - X0 + 0.5, 0.56, ZF - Z0 + 0.5]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.pedestal} />
    </mesh>
    <mesh position={[0, BOTTOM - 0.02, (Z0 + ZF) / 2]}>
      <boxGeometry args={[X1 - X0 + 0.56, 0.05, ZF - Z0 + 0.56]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.pedestalEdge} />
    </mesh>
  </group>
);

/** Rebaixo escuro dentro do furo, para o rasgo da perfuração ler como "buraco". */
const BoreShade: React.FC<{ depthY: number }> = ({ depthY }) => {
  if (depthY > -0.01) return null;
  return (
    <mesh position={[WELL.x, depthY / 2, ZF - 0.192]}>
      <planeGeometry args={[WELL.boreR * 2, -depthY]} />
      <meshBasicMaterial color="#1a0f08" transparent opacity={0.38} depthWrite={false} />
    </mesh>
  );
};

export type TerrainState = {
  explode: number;
  boreY: number;
  glow: LayerGlow;
  water: { intensity: number; inflow: number; glow: number };
};

export const TerrainCrossSection: React.FC<{ frame: number; state: TerrainState }> = ({ frame, state }) => {
  const slot = useMemo(() => ({ x: WELL.x, r: WELL.boreR, recess: WELL.boreR, depthY: state.boreY }), [state.boreY]);
  return (
    <group>
      <ShadowBlob />
      <Pedestal />
      <GeologicalLayers
        frame={frame}
        slot={slot}
        explode={state.explode}
        glow={state.glow}
        details={{
          aquifer: (
            <>
              <AquiferGrains boreY={state.boreY} />
              <AquiferWater frame={frame} intensity={state.water.intensity} inflow={state.water.inflow} glow={state.water.glow} />
            </>
          ),
          bedrock: <Fractures glow={state.water.glow} />,
          sediment: <BoreShade depthY={state.boreY} />,
        }}
      />
    </group>
  );
};
