import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, ExtrudeGeometry, IcosahedronGeometry, InstancedMesh, Object3D, type Shape } from "three";
import { MATTE, PALETTE } from "../theme";
import { lerp, pulse, rand, randRange } from "../utils/animation";
import { evalPoly, LAYERS, layerShapes, X0, X1, Z0, ZF, type Layer, type LayerId } from "../utils/geology";

// Camadas geológicas extrudadas a partir do perfil 2D. Quando há perfuração, a faixa do furo
// é recortada no plano frontal (rebaixo de `recess`), formando o rasgo onde o poço aparece em corte.

export type BoreSlot = { x: number; r: number; recess: number; depthY: number };

export type LayerGlow = { aquifer: number; flash: number; pressure: number; confining: number };

const NO_GLOW: LayerGlow = { aquifer: 0, flash: 0, pressure: 0, confining: 0 };

const extrude = (shapes: Shape[], z0: number, z1: number): BufferGeometry | null => {
  if (shapes.length === 0) return null;
  const g = new ExtrudeGeometry(shapes, { depth: z1 - z0, bevelEnabled: false, steps: 1, curveSegments: 1 });
  g.translate(0, 0, z0);
  return g;
};

const useDisposable = (geos: (BufferGeometry | null)[]) => {
  useEffect(() => () => geos.forEach((g) => g?.dispose()), [geos]);
};

type ScatterItem = { position: [number, number, number]; scale: [number, number, number]; rotation: [number, number, number]; color: string };

/** Muitos sólidos low-poly iguais (pedriscos, grãos) num único draw call. */
export const Scatter: React.FC<{ items: ScatterItem[]; roughness?: number; emissive?: string; emissiveIntensity?: number }> = ({ items, roughness = 0.9, emissive = "#000000", emissiveIntensity = 0 }) => {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new IcosahedronGeometry(1, 0), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    const c = new Color();
    items.forEach((it, i) => {
      o.position.set(...it.position);
      o.rotation.set(...it.rotation);
      o.scale.set(...it.scale);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.set(it.color));
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={false} receiveShadow>
      <meshStandardMaterial {...MATTE} roughness={roughness} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    </instancedMesh>
  );
};

const PEBBLES: Partial<Record<LayerId, { count: number; r: [number, number]; colors: string[]; flat: number }>> = {
  topsoil: { count: 26, r: [0.03, 0.05], colors: [PALETTE.clayDark, PALETTE.pebble], flat: 0.7 },
  sediment: { count: 70, r: [0.035, 0.075], colors: [PALETTE.pebble, "#c9ad80", "#efdcb4"], flat: 0.75 },
  clay: { count: 34, r: [0.04, 0.09], colors: [PALETTE.clayDark, "#9b6b4b"], flat: 0.45 },
  bedrock: { count: 60, r: [0.07, 0.16], colors: [PALETTE.bedrockDark, "#8d96a1", "#737b86"], flat: 0.5 },
};

const pebblesFor = (l: Layer, xa: number, xb: number, avoidX: number | null, ylo: number): ScatterItem[] => {
  const spec = PEBBLES[l.id];
  if (!spec) return [];
  const out: ScatterItem[] = [];
  for (let i = 0; i < spec.count * 3 && out.length < Math.round((spec.count * (xb - xa)) / (X1 - X0)) + 2; i++) {
    const seed = `${l.id}-pb-${i}`;
    const x = randRange(`${seed}x`, X0 + 0.12, X1 - 0.12);
    if (x < xa + 0.08 || x > xb - 0.08) continue;
    if (avoidX !== null && Math.abs(x - avoidX) < 0.38) continue;
    const r = randRange(`${seed}r`, spec.r[0], spec.r[1]);
    const top = evalPoly(l.top, x) - r - 0.03;
    const bot = Math.max(evalPoly(l.bottom, x), ylo) + r + 0.03;
    if (top <= bot) continue;
    const y = lerp(bot, top, rand(`${seed}y`));
    out.push({
      position: [x, y, ZF + r * 0.05],
      scale: [r * 1.25, r * spec.flat, r * 0.6],
      rotation: [rand(`${seed}a`) * 3, rand(`${seed}b`) * 3, rand(`${seed}c`) * 3],
      color: spec.colors[Math.floor(rand(`${seed}k`) * spec.colors.length)],
    });
  }
  return out;
};

const LayerSolid: React.FC<{
  l: Layer;
  xa: number;
  xb: number;
  zBack: number;
  ylo: number;
  slot: BoreSlot | null;
  emissive: string;
  emissiveIntensity: number;
}> = ({ l, xa, xb, zBack, ylo, slot, emissive, emissiveIntensity }) => {
  const drilled = slot !== null && slot.depthY < -0.001 && slot.x > xa && slot.x < xb;
  const sx = slot?.x ?? 0;
  const sr = slot?.r ?? 0;
  const depthY = slot?.depthY ?? 0;
  const recess = slot?.recess ?? 0;
  const solid = useMemo(() => {
    if (!drilled) return [extrude(layerShapes(l, xa, xb, ylo), zBack, ZF)];
    return [extrude(layerShapes(l, xa, sx - sr, ylo), zBack, ZF), extrude(layerShapes(l, sx + sr, xb, ylo), zBack, ZF)];
  }, [l, xa, xb, ylo, zBack, drilled, sx, sr]);
  const middle = useMemo(() => {
    if (!drilled) return [];
    return [
      extrude(layerShapes(l, sx - sr, sx + sr, Math.max(depthY, ylo)), zBack, ZF - recess),
      extrude(layerShapes(l, sx - sr, sx + sr, ylo, depthY), zBack, ZF),
    ];
  }, [l, ylo, zBack, drilled, sx, sr, depthY, recess]);
  useDisposable(solid);
  useDisposable(middle);
  return (
    <>
      {[...solid, ...middle].map((g, i) =>
        g ? (
          <mesh key={`${l.id}-${i}`} geometry={g} castShadow receiveShadow>
            <meshStandardMaterial {...MATTE} color={l.color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        ) : null,
      )}
    </>
  );
};

export type GeologicalLayersProps = {
  frame: number;
  xa?: number;
  xb?: number;
  zBack?: number;
  ylo?: number;
  slot?: BoreSlot | null;
  explode?: number;
  glow?: LayerGlow;
  /** Detalhes extras desenhados junto de cada camada (acompanham a vista explodida). */
  details?: Partial<Record<LayerId, React.ReactNode>>;
};

export const GeologicalLayers: React.FC<GeologicalLayersProps> = ({ frame, xa = X0, xb = X1, zBack = Z0, ylo = -Infinity, slot = null, explode = 0, glow = NO_GLOW, details }) => {
  const avoid = slot ? slot.x : null;
  const pebbles = useMemo(() => Object.fromEntries(LAYERS.map((l) => [l.id, pebblesFor(l, xa, xb, avoid, ylo)])), [xa, xb, avoid, ylo]);
  const confiningPulse = glow.confining * (0.22 + 0.16 * pulse(frame, 26));
  return (
    <group>
      {LAYERS.map((l) => {
        let emissive = "#000000";
        let intensity = 0;
        if (l.id === "aquifer") {
          emissive = PALETTE.aquifer;
          intensity = 0.1 + 0.28 * glow.aquifer + 0.6 * glow.flash + glow.pressure * (0.12 + 0.14 * pulse(frame, 14));
        } else if (l.id === "clay" || l.id === "bedrock") {
          emissive = "#ffcf73";
          intensity = confiningPulse;
        }
        return (
          <group key={l.id} position={[0, explode * l.explode[0], explode * l.explode[1]]}>
            <LayerSolid l={l} xa={xa} xb={xb} zBack={zBack} ylo={ylo} slot={slot} emissive={emissive} emissiveIntensity={intensity} />
            <Scatter items={pebbles[l.id]} emissive={emissive} emissiveIntensity={intensity * 0.6} />
            {details?.[l.id]}
          </group>
        );
      })}
    </group>
  );
};
