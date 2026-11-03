import { useMemo } from "react";
import { DoubleSide, ExtrudeGeometry, Shape } from "three";
import { MATTE, METAL, PALETTE } from "../theme";
import { pulse } from "../utils/animation";
import { WELL } from "../utils/geology";

// Esquema construtivo do poço, cortado ao meio no plano frontal (só a metade de trás aparece):
// revestimento metálico, filtro ranhurado na altura do aquífero, pré-filtro de cascalho,
// cimentação do espaço anelar (selo sanitário) e laje de proteção na boca do poço.

export type WellSpec = {
  x: number;
  z: number;
  boreR: number;
  casingR: number;
  casingInner: number;
  top: number;
  sealBottom: number;
  filterTop: number;
  filterBottom: number;
  bottom: number;
};

export const MAIN_WELL: WellSpec = { ...WELL };

/** Meio anel (metade de trás, z ≤ eixo) extrudado para cima a partir de y = 0. */
export const halfRing = (rIn: number, rOut: number, height: number, segments = 12) => {
  const s = new Shape();
  s.absarc(0, 0, rOut, 0, Math.PI, false);
  s.lineTo(-rIn, 0);
  if (rIn > 0) s.absarc(0, 0, rIn, Math.PI, 0, true);
  s.lineTo(rOut, 0);
  const g = new ExtrudeGeometry(s, { depth: Math.max(height, 0.001), bevelEnabled: false, curveSegments: segments });
  g.rotateX(-Math.PI / 2);
  return g;
};

const useHalfRing = (rIn: number, rOut: number, height: number) => useMemo(() => halfRing(rIn, rOut, height), [rIn, rOut, height]);

export type WellState = {
  install: number;
  seal: number;
  cap: number;
  casingGlow: number;
  protectionGlow: number;
};

const FILTER_SLOT = 0.11;
const FILTER_GAP = 0.05;

export const ArtesianWell: React.FC<{ spec: WellSpec; state: WellState; frame: number }> = ({ spec, state, frame }) => {
  const { x, z, casingR, casingInner, boreR, top, sealBottom, filterTop, filterBottom, bottom } = spec;
  const casing = useHalfRing(casingInner, casingR, -filterTop);
  const sump = useHalfRing(casingInner, casingR, filterBottom - bottom);
  const filterRing = useHalfRing(casingInner, casingR, FILTER_SLOT);
  const plate = useHalfRing(0, casingR, 0.03);
  const seal = useHalfRing(casingR, boreR, -sealBottom);
  const gravelTop = filterTop + 0.35;
  const gravel = useHalfRing(casingR + 0.002, boreR - 0.004, gravelTop - bottom);
  const nRings = Math.floor((filterTop - filterBottom) / (FILTER_SLOT + FILTER_GAP));
  const drop = (1 - state.install) * 4.6;
  const cg = state.casingGlow * (0.35 + 0.25 * pulse(frame, 20));
  const pg = state.protectionGlow * (0.35 + 0.25 * pulse(frame, 20, 6));
  if (state.install <= 0.001) return null;
  return (
    <group position={[x, 0, z]}>
      {/* coluna de revestimento + filtro (desce para dentro do furo na instalação) */}
      <group position={[0, -drop, 0]}>
        <mesh geometry={casing} position={[0, filterTop, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...METAL} color={PALETTE.pipe} side={DoubleSide} emissive="#fff1b0" emissiveIntensity={cg} />
        </mesh>
        {Array.from({ length: nRings }, (_, i) => (
          <mesh key={i} geometry={filterRing} position={[0, filterBottom + i * (FILTER_SLOT + FILTER_GAP) + FILTER_GAP, 0]}>
            <meshStandardMaterial {...METAL} color="#8e98a3" side={DoubleSide} emissive="#fff1b0" emissiveIntensity={cg} />
          </mesh>
        ))}
        <mesh geometry={sump} position={[0, bottom, 0]}>
          <meshStandardMaterial {...METAL} color={PALETTE.pipe} side={DoubleSide} />
        </mesh>
        <mesh geometry={plate} position={[0, bottom - 0.03, 0]}>
          <meshStandardMaterial {...METAL} color={PALETTE.pipeDark} />
        </mesh>
        {/* trecho acima do solo: tubo inteiro */}
        <mesh position={[0, top / 2 - 0.01, 0]} castShadow>
          <cylinderGeometry args={[casingR, casingR, top + 0.02, 14, 1, true]} />
          <meshStandardMaterial {...METAL} color={PALETTE.pipe} side={DoubleSide} emissive="#fff1b0" emissiveIntensity={cg} />
        </mesh>
        <mesh position={[0, top - 0.025, 0]}>
          <cylinderGeometry args={[casingInner, casingInner, 0.01, 14]} />
          <meshBasicMaterial color="#1b2a3a" />
        </mesh>
      </group>
      {/* pré-filtro de cascalho em volta do filtro */}
      {state.seal > 0.001 ? (
        <mesh geometry={gravel} position={[0, bottom, 0]} scale={[1, state.seal, 1]}>
          <meshStandardMaterial {...MATTE} color={PALETTE.gravel} />
        </mesh>
      ) : null}
      {/* cimentação do espaço anelar = selo sanitário */}
      {state.seal > 0.001 ? (
        <mesh geometry={seal} position={[0, sealBottom * state.seal, 0]} scale={[1, state.seal, 1]}>
          <meshStandardMaterial {...MATTE} color={PALETTE.seal} emissive="#fff1b0" emissiveIntensity={pg} />
        </mesh>
      ) : null}
      {/* laje de proteção (cortada junto com o terreno) */}
      {state.seal > 0.001 ? (
        <mesh position={[0, 0.055, -0.27]} scale={[state.seal, 1, 1]} castShadow receiveShadow>
          <boxGeometry args={[0.95, 0.11, 0.54]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.concrete} emissive="#fff1b0" emissiveIntensity={pg} />
        </mesh>
      ) : null}
      {/* tampa, tê de saída e registro (quando o poço passa a abastecer) */}
      {state.cap > 0.001 ? (
        <group scale={Math.min(state.cap, 1.2)} position={[0, top, 0]}>
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[casingR + 0.03, casingR + 0.03, 0.08, 14]} />
            <meshStandardMaterial {...METAL} color={PALETTE.pipeDark} emissive="#fff1b0" emissiveIntensity={pg} />
          </mesh>
          <mesh position={[casingR + 0.15, -0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.32, 10]} />
            <meshStandardMaterial {...METAL} color={PALETTE.pipe} />
          </mesh>
          <mesh position={[casingR + 0.2, -0.08, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.12]} />
            <meshStandardMaterial {...METAL} color={PALETTE.pipeDark} />
          </mesh>
          <mesh position={[casingR + 0.2, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.07, 0.016, 6, 12]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.rig} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/** Ponto onde a tubulação de captação sai do registro (coordenadas do mundo). */
export const outletPoint = (spec: WellSpec): [number, number, number] => [spec.x + spec.casingR + 0.31, spec.top - 0.08, spec.z];
