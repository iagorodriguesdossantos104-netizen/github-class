import { DoubleSide } from "three";
import { MATTE, METAL, PALETTE } from "../theme";
import { SITE } from "../utils/geology";

// Caixa d'água elevada com uma janela de corte voltada para a câmera, para ver o nível subir.

const T = SITE.tank;
const OPEN_CENTER = 0.42; // direção (rad) da janela, alinhada com a câmera
const OPEN_WIDTH = 1.9;

export const WaterReservoir: React.FC<{ scale: number; level: number; glow?: number }> = ({ scale, level, glow = 0 }) => {
  if (scale <= 0.001) return null;
  const waterH = Math.max(0.001, level * (T.h - 0.06));
  return (
    <group position={[T.x, 0, T.z]} scale={scale}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.27, T.standH / 2, sz * 0.27]} castShadow>
            <boxGeometry args={[0.06, T.standH, 0.06]} />
            <meshStandardMaterial {...METAL} color={PALETTE.pipeDark} />
          </mesh>
        )),
      )}
      <mesh position={[0, T.standH / 2, 0.27]} rotation={[0, 0, 0.9]}>
        <boxGeometry args={[0.03, 0.72, 0.03]} />
        <meshStandardMaterial {...METAL} color={PALETTE.pipeDark} />
      </mesh>
      <mesh position={[0, T.standH, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.05, 0.72]} />
        <meshStandardMaterial {...METAL} color={PALETTE.pipeDark} />
      </mesh>
      <group position={[0, T.standH + 0.025, 0]}>
        {/* parede com janela de corte */}
        <mesh position={[0, T.h / 2, 0]} castShadow>
          <cylinderGeometry args={[T.r, T.r, T.h, 18, 1, true, OPEN_CENTER + OPEN_WIDTH / 2, Math.PI * 2 - OPEN_WIDTH]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.tank} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[T.r, T.r, 0.03, 18]} />
          <meshStandardMaterial {...MATTE} color="#2f86b8" />
        </mesh>
        <mesh position={[0, T.h + 0.08, 0]} castShadow>
          <coneGeometry args={[T.r + 0.04, 0.18, 18]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.tank} />
        </mesh>
        {/* água */}
        <mesh position={[0, 0.03 + waterH / 2, 0]}>
          <cylinderGeometry args={[T.r - 0.015, T.r - 0.015, waterH, 18]} />
          <meshStandardMaterial color={PALETTE.water} emissive={PALETTE.waterBright} emissiveIntensity={0.3 + 0.3 * glow} transparent opacity={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

/** Ponto de entrada (tampa) e de saída (lateral baixa) da caixa, em coordenadas do mundo. */
export const TANK_INLET: [number, number, number] = [T.x + 0.08, T.standH + T.h + 0.1, T.z + 0.1];
export const TANK_OUTLET: [number, number, number] = [T.x, T.standH + 0.02, T.z];
