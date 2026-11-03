import { useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";
import { MATTE, PALETTE } from "../theme";
import { SITE } from "../utils/geology";

// Casa low-poly que recebe a água no fim do vídeo (janelas acendem quando é abastecida).

const H = SITE.house;

const useRoof = () =>
  useMemo(() => {
    const half = H.d / 2 + 0.14;
    const s = new Shape();
    s.moveTo(-half, 0);
    s.lineTo(half, 0);
    s.lineTo(0, 0.62);
    s.lineTo(-half, 0);
    const g = new ExtrudeGeometry(s, { depth: H.w + 0.22, bevelEnabled: false });
    g.rotateY(Math.PI / 2);
    g.translate(-(H.w + 0.22) / 2, 0, 0);
    return g;
  }, []);

const Window: React.FC<{ position: [number, number, number]; rotationY?: number; glow: number }> = ({ position, rotationY = 0, glow }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh>
      <boxGeometry args={[0.3, 0.28, 0.03]} />
      <meshStandardMaterial {...MATTE} color="#ffffff" />
    </mesh>
    <mesh position={[0, 0, 0.012]}>
      <boxGeometry args={[0.24, 0.22, 0.02]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.window} emissive={PALETTE.waterBright} emissiveIntensity={0.05 + 0.9 * glow} />
    </mesh>
    <mesh position={[0, 0, 0.026]}>
      <boxGeometry args={[0.02, 0.22, 0.01]} />
      <meshStandardMaterial {...MATTE} color="#ffffff" />
    </mesh>
  </group>
);

export const House: React.FC<{ scale: number; supplied: number }> = ({ scale, supplied }) => {
  const roof = useRoof();
  if (scale <= 0.001) return null;
  return (
    <group position={[H.x, 0, H.z]} scale={[scale, scale, scale]}>
      <mesh position={[0, H.wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[H.w, H.wallH, H.d]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.wall} />
      </mesh>
      {/* rodapé */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[H.w + 0.04, 0.1, H.d + 0.04]} />
        <meshStandardMaterial {...MATTE} color="#d9c9ad" />
      </mesh>
      <mesh geometry={roof} position={[0, H.wallH, 0]} castShadow>
        <meshStandardMaterial {...MATTE} color={PALETTE.roof} />
      </mesh>
      {/* cumeeira */}
      <mesh position={[0, H.wallH + 0.62, 0]}>
        <boxGeometry args={[H.w + 0.26, 0.05, 0.08]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.roofDark} />
      </mesh>
      {/* porta */}
      <mesh position={[-0.28, 0.25, H.d / 2 + 0.012]}>
        <boxGeometry args={[0.26, 0.46, 0.03]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.door} />
      </mesh>
      <Window position={[0.2, 0.47, H.d / 2 + 0.015]} glow={supplied} />
      <Window position={[H.w / 2 + 0.015, 0.47, -0.15]} rotationY={Math.PI / 2} glow={supplied} />
      <Window position={[H.w / 2 + 0.015, 0.47, 0.28]} rotationY={Math.PI / 2} glow={supplied} />
    </group>
  );
};

/** Gota que "brota" sobre a casa quando a água chega. */
export const SupplyDrop: React.FC<{ value: number; frame: number }> = ({ value, frame }) => {
  if (value <= 0.001) return null;
  const bob = Math.sin(frame / 7) * 0.05;
  return (
    <group position={[H.x, H.wallH + 1.05 + bob, H.z + 0.2]} scale={0.22 * value}>
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.water} emissive={PALETTE.waterBright} emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <coneGeometry args={[0.72, 1.3, 8]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.water} emissive={PALETTE.waterBright} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
};
