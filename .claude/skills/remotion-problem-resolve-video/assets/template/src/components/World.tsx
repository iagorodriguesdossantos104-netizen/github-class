import { useCurrentFrame } from "remotion";
import { isVisible, track } from "../data/scenes";
import { MATTE, PALETTE } from "../theme";
import { pulse } from "../utils/animation";

// O cenário persistente: o MESMO modelo do começo ao fim. Cada objeto lê seu estado das trilhas
// de animação (track) no frame GLOBAL, então nada "pula" de lugar entre cortes — só a câmera se move.
// Substitua este exemplo (bloco + objeto) pelo sistema do tema: corte transversal, vista explodida,
// transparência... Para técnicas de diorama, veja references/diorama-3d.md.

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = track("subject.scale", frame);
  const glow = track("subject.glow", frame);
  return (
    <group>
      {isVisible("terrain", frame) ? (
        <group>
          <mesh position={[0, -1, 0]} receiveShadow castShadow>
            <boxGeometry args={[6, 2, 4]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.groundSide} />
          </mesh>
          <mesh position={[0, 0.025, 0]} receiveShadow>
            <boxGeometry args={[6, 0.05, 4]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.ground} />
          </mesh>
          <mesh position={[0, -2.2, 0]}>
            <boxGeometry args={[6.4, 0.4, 4.4]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.pedestal} />
          </mesh>
        </group>
      ) : null}
      {isVisible("subject", frame) && scale > 0.001 ? (
        <mesh position={[0, 0.75, 0.5]} scale={scale} rotation={[0, frame * 0.01, 0]} castShadow>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.subject} emissive={PALETTE.subject} emissiveIntensity={glow * (0.3 + 0.3 * pulse(frame, 20))} />
        </mesh>
      ) : null}
    </group>
  );
};
