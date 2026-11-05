import { LIGHTING } from "../theme";

// Iluminação central do diorama: céu/chão suave, luz-chave com sombras macias e preenchimento frio.
export const Lighting: React.FC<{ shadowExtent?: number; dim?: number }> = ({ shadowExtent = 16, dim = 0 }) => (
  <>
    <ambientLight intensity={LIGHTING.ambient * (1 - 0.35 * dim)} />
    <hemisphereLight args={[LIGHTING.hemisphere.sky, LIGHTING.hemisphere.ground, LIGHTING.hemisphere.intensity * (1 - 0.4 * dim)]} />
    <directionalLight
      position={LIGHTING.key.position}
      intensity={LIGHTING.key.intensity * (1 - 0.45 * dim)}
      color={LIGHTING.key.color}
      castShadow
      shadow-mapSize-width={LIGHTING.shadowMapSize}
      shadow-mapSize-height={LIGHTING.shadowMapSize}
      shadow-camera-left={-shadowExtent}
      shadow-camera-right={shadowExtent}
      shadow-camera-top={shadowExtent}
      shadow-camera-bottom={-shadowExtent}
      shadow-camera-near={1}
      shadow-camera-far={60}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
      shadow-radius={4}
    />
    <directionalLight position={LIGHTING.fill.position} intensity={LIGHTING.fill.intensity} color={LIGHTING.fill.color} />
    <directionalLight position={LIGHTING.rim.position} intensity={LIGHTING.rim.intensity} color={LIGHTING.rim.color} />
  </>
);
