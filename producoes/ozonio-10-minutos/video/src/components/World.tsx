import { useMemo } from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { AdditiveBlending, BoxGeometry, Color, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, Quaternion, Vector3 } from "three";
import { isVisible, sceneAt, track } from "../data/scenes";
import { cameraPoseAt } from "./CameraController";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, pulse, rand, smoothstep, type Vec3 } from "../utils/animation";

// Cenário persistente (esquemático, fora de escala): praia em corte com banhistas, casa e coqueiro;
// coluna de céu com o Sol e a faixa de ozônio; raios UV-A/UV-B/UV-C; e três estações de detalhe no
// mesmo mundo: planeta (0,60,−80), pele com DNA (−30,0,0) e olho (−30,0,14). Tudo lê trilhas no frame GLOBAL.

// ------------------------------------------------------------------ geometria
export const OZONE_Y = 14.5;
const OZONE_H = 1;
export const SUN: Vec3 = [10, 22, -14];
const SUN_DIR = new Vector3(...SUN).normalize();
export const HOUSE: Vec3 = [-6.5, 0, -1];
export const HOSPITAL: Vec3 = [-1.5, 0, -4.2];
export const PALM: Vec3 = [-4, 0, -2.5];
export const GLOBE: Vec3 = [0, 60, -80];
export const SKIN: Vec3 = [-30, 0, 0];
export const EYE: Vec3 = [-30, 1.5, 14];
const SEA_X0 = 2;
const SEA_X1 = 9;
const FRONT_Z = 4;
const BACK_Z = -5;

export const POINTS = {
  ozone: [2.5, OZONE_Y + 0.5, 1] as Vec3,
  sun: SUN,
  uva: [-3.2, 7, 1.5] as Vec3,
  uvb: [0.4, 10, 1.0] as Vec3,
  uvc: [3.6, 11.5, 0.6] as Vec3,
  insidePerson: [HOUSE[0], 1.2, HOUSE[2]] as Vec3,
  wrongCheck: [HOUSE[0], 3.8, HOUSE[2]] as Vec3,
  bandLeft: [-6, OZONE_Y, 1] as Vec3,
  hospitalDoor: [HOSPITAL[0] + 1.2, 1, HOSPITAL[2] + 2] as Vec3,
};

const fade = (o: number) => ({ transparent: true, opacity: o, depthWrite: o >= 0.999 });

// ------------------------------------------------------------------ utilitários
const UP = new Vector3(0, 1, 0);
const Segment: React.FC<{ a: Vec3; b: Vec3; radius: number; color: string; opacity?: number; additive?: boolean }> = ({ a, b, radius, color, opacity = 1, additive = false }) => {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  if (len < 1e-4 || opacity <= 0.001) return null;
  const q = new Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  return (
    <mesh position={mid} quaternion={q} scale={[radius, len, radius]}>
      <cylinderGeometry args={[1, 1, 1, 6, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} blending={additive ? AdditiveBlending : undefined} depthWrite={false} />
    </mesh>
  );
};

// ------------------------------------------------------------------ pessoas low-poly
type Pose = "stand" | "lie" | "sit";
const Person: React.FC<{ p: Vec3; rot?: number; pose?: Pose; suit: string; red?: number; scale?: number; opacity?: number; coverEyes?: boolean }> = ({ p, rot = 0, pose = "stand", suit, red = 0, scale = 1, opacity = 1, coverEyes = false }) => {
  const skin = interpolateColors(clamp(red, 0, 1), [0, 1], [PALETTE.skin, PALETTE.skinRed]);
  const m = { ...MATTE, ...fade(opacity) };
  const armY = coverEyes ? 1.6 : 1.12;
  const armRot = coverEyes ? -2.4 : 0.15;
  const body = (
    <group>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, pose === "sit" ? 0.35 : 0.4, pose === "sit" ? 0.3 : 0]} rotation={[pose === "sit" ? Math.PI / 2 : 0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.8, 6]} />
          <meshStandardMaterial color={skin} {...m} />
        </mesh>
      ))}
      <mesh position={[0, pose === "sit" ? 0.75 : 1.12, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.72, 7]} />
        <meshStandardMaterial color={suit} {...m} />
      </mesh>
      <mesh position={[0, pose === "sit" ? 1.3 : 1.68, 0]} castShadow>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={skin} {...m} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.28, pose === "sit" ? 0.8 : armY, coverEyes ? 0.12 : 0]} rotation={[coverEyes ? armRot : 0, 0, sx * (coverEyes ? 0.5 : armRot)]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.62, 5]} />
          <meshStandardMaterial color={skin} {...m} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={p} rotation={[0, rot, 0]} scale={scale}>
      {pose === "lie" ? (
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0.85]}>
          {body}
        </group>
      ) : (
        body
      )}
    </group>
  );
};

// ------------------------------------------------------------------ praia
const PLANKTON = Array.from({ length: 90 }, (_, i) => ({
  x: SEA_X0 + 0.3 + rand(`pk-x-${i}`) * (SEA_X1 - SEA_X0 - 0.6),
  y: i < 45 ? -0.25 - rand(`pk-y-${i}`) * 0.8 : -1.1 - rand(`pk-y-${i}`) * 1.8,
  z: FRONT_Z - 0.08 - rand(`pk-z-${i}`) * 0.25,
  top: i < 45,
  ph: rand(`pk-ph-${i}`) * 60,
}));

const Beach: React.FC<{ frame: number }> = ({ frame }) => {
  const plankton = clamp(track("plankton.health", frame, 1), 0, 1);
  const glow = clamp(track("ground.uvGlow", frame), 0, 1);
  const wave = Math.sin(frame * 0.08) * 0.04;
  return (
    <group>
      {/* areia em corte */}
      <mesh position={[(-9 + SEA_X0) / 2, -1.7, (FRONT_Z + BACK_Z) / 2]} receiveShadow>
        <boxGeometry args={[SEA_X0 + 9, 3.4, FRONT_Z - BACK_Z]} />
        <meshStandardMaterial color={PALETTE.sand} {...MATTE} />
      </mesh>
      <mesh position={[(-9 + SEA_X0) / 2, -2.6, FRONT_Z + 0.001]}>
        <planeGeometry args={[SEA_X0 + 9, 1.6]} />
        <meshStandardMaterial color={PALETTE.sandDeep} {...MATTE} />
      </mesh>
      {/* mar: água em corte + fundo */}
      <mesh position={[(SEA_X0 + SEA_X1) / 2, -3.2, (FRONT_Z + BACK_Z) / 2]}>
        <boxGeometry args={[SEA_X1 - SEA_X0, 0.4, FRONT_Z - BACK_Z]} />
        <meshStandardMaterial color={PALETTE.seaFloor} {...MATTE} />
      </mesh>
      <mesh position={[(SEA_X0 + SEA_X1) / 2, -1.6 + wave / 2, (FRONT_Z + BACK_Z) / 2]}>
        <boxGeometry args={[SEA_X1 - SEA_X0, 2.8 + wave, FRONT_Z - BACK_Z]} />
        <meshStandardMaterial color={PALETTE.water} {...MATTE} transparent opacity={0.72} depthWrite={false} />
      </mesh>
      <mesh position={[(SEA_X0 + SEA_X1) / 2, -0.19 + wave, (FRONT_Z + BACK_Z) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SEA_X1 - SEA_X0, FRONT_Z - BACK_Z]} />
        <meshStandardMaterial color={PALETTE.water} emissive="#1b4f7a" emissiveIntensity={0.25} {...MATTE} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[SEA_X0 + 0.3 + k * 0.25, -0.17, BACK_Z + 0.5 + ((frame * 0.03 + k * 3) % 8.5)]}>
          <boxGeometry args={[0.18, 0.04, 0.9]} />
          <meshStandardMaterial color={PALETTE.foam} {...MATTE} />
        </mesh>
      ))}
      {PLANKTON.map((p, i) => {
        const h = p.top ? plankton : 1;
        const col = interpolateColors(h, [0, 1], [PALETTE.planktonDead, PALETTE.plankton]);
        return (
          <mesh key={i} position={[p.x + Math.sin((frame + p.ph) * 0.05) * 0.05, p.y + Math.cos((frame + p.ph) * 0.04) * 0.04, p.z]}>
            <icosahedronGeometry args={[0.09, 0]} />
            <meshBasicMaterial color={col} toneMapped={false} />
          </mesh>
        );
      })}
      {/* brilho roxo de UV na areia */}
      {glow > 0.01 ? (
        <mesh position={[(-9 + SEA_X0) / 2, 0.02, (FRONT_Z + BACK_Z) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SEA_X0 + 9, FRONT_Z - BACK_Z]} />
          <meshBasicMaterial color={PALETTE.uvc} transparent opacity={0.28 * glow * (0.8 + 0.2 * pulse(frame, 30))} toneMapped={false} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

const People: React.FC<{ frame: number }> = ({ frame }) => (
  <group visible={track("sky.night", frame) < 0.5}>
    {/* toalha + banhista deitado */}
    <mesh position={[0, 0.02, 1.9]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.9, 2.0]} />
      <meshStandardMaterial color={PALETTE.towel} {...MATTE} />
    </mesh>
    <Person p={[0, 0, 1.5]} pose="lie" suit={PALETTE.suit[0]} />
    <Person p={[-2, 0, 2]} rot={0.4} suit={PALETTE.suit[1]} />
    <Person p={[1.1, 0, 0.5]} rot={-0.5} suit={PALETTE.suit[2]} scale={0.7} />
    <Person p={[-3.2, 0, 0.6]} rot={0.9} pose="sit" suit={PALETTE.suit[3]} />
    {/* guarda-sol */}
    <group position={[-1, 0, 1]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 5]} />
        <meshStandardMaterial color={PALETTE.metal} {...MATTE} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <coneGeometry args={[1.3, 0.55, 10, 1, true]} />
        <meshStandardMaterial color={PALETTE.umbrella} side={DoubleSide} {...MATTE} />
      </mesh>
    </group>
  </group>
);

// ------------------------------------------------------------------ casa, coqueiro, micróbios, hospital
const House: React.FC<{ frame: number }> = ({ frame }) => {
  const cut = clamp(track("house.cut", frame), 0, 1);
  const check = clamp(track("insidePerson.check", frame), 0, 1.2);
  const W0 = 3;
  const D0 = 3;
  const H0 = 2.5;
  return (
    <group position={HOUSE}>
      {/* paredes: fundo, laterais, frente (some no corte) */}
      <mesh position={[0, H0 / 2, -D0 / 2]} castShadow receiveShadow>
        <boxGeometry args={[W0, H0, 0.15]} />
        <meshStandardMaterial color={PALETTE.wall} {...MATTE} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * W0) / 2, H0 / 2, 0]} castShadow>
          <boxGeometry args={[0.15, H0, D0]} />
          <meshStandardMaterial color={PALETTE.wall} {...MATTE} />
        </mesh>
      ))}
      <mesh position={[0, H0 / 2, D0 / 2]} castShadow>
        <boxGeometry args={[W0, H0, 0.15]} />
        <meshStandardMaterial color={PALETTE.wall} {...MATTE} {...fade(1 - 0.92 * cut)} />
      </mesh>
      {/* telhado */}
      <mesh position={[0, H0 + 0.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.6, 1.1, 4]} />
        <meshStandardMaterial color={PALETTE.roof} {...MATTE} />
      </mesh>
      {/* morador lendo */}
      <Person p={[0, 0, 0]} pose="sit" suit={PALETTE.suit[4]} rot={0.3} />
      <mesh position={[0.15, 0.95, 0.45]} rotation={[-0.6, 0.3, 0]}>
        <boxGeometry args={[0.35, 0.25, 0.04]} />
        <meshStandardMaterial color="#e5383b" {...MATTE} />
      </mesh>
      <mesh position={[0, 0.35, 0.1]}>
        <boxGeometry args={[0.9, 0.7, 0.9]} />
        <meshStandardMaterial color={PALETTE.wood} {...MATTE} />
      </mesh>
      {check > 0.02 ? (
        <mesh position={[0, 2.15, 0]} scale={check}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshBasicMaterial color="#20b85a" toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

const MICROBES = Array.from({ length: 70 }, (_, i) => {
  const onLeaf = i < 40;
  const a = rand(`mb-a-${i}`) * Math.PI * 2;
  const r = onLeaf ? 0.4 + rand(`mb-r-${i}`) * 1.1 : 0.3 + rand(`mb-r-${i}`) * 2.2;
  return { p: [PALM[0] + Math.cos(a) * r, onLeaf ? 3.4 + rand(`mb-y-${i}`) * 0.3 - r * 0.25 : 0.04, PALM[2] + Math.sin(a) * r] as Vec3, ph: rand(`mb-ph-${i}`) * 40 };
});

const Palm: React.FC<{ frame: number }> = ({ frame }) => {
  const alive = clamp(track("microbes.alive", frame, 1), 0, 1);
  const showMicrobes = isVisible("microbes", frame);
  const col = interpolateColors(alive, [0, 1], [PALETTE.microbeDead, PALETTE.microbe]);
  return (
    <group>
      <group position={PALM}>
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} position={[k * 0.06, 0.35 + k * 0.7, 0]} rotation={[0, 0, -0.06]} castShadow>
            <cylinderGeometry args={[0.16 - k * 0.012, 0.18 - k * 0.012, 0.72, 6]} />
            <meshStandardMaterial color={PALETTE.trunk} {...MATTE} />
          </mesh>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((k) => {
          const a = (k / 7) * Math.PI * 2;
          return (
            <mesh key={`l${k}`} position={[0.3 + Math.cos(a) * 0.75, 3.45, Math.sin(a) * 0.75]} rotation={[Math.sin(a) * 0.9, -a, Math.cos(a) * 0.9 + Math.PI / 2]} castShadow>
              <coneGeometry args={[0.32, 1.7, 4]} />
              <meshStandardMaterial color={PALETTE.leaf} {...MATTE} />
            </mesh>
          );
        })}
      </group>
      {showMicrobes
        ? MICROBES.map((m, i) => (
            <mesh key={i} position={[m.p[0] + Math.sin((frame + m.ph) * 0.1) * 0.02 * alive, m.p[1], m.p[2]]}>
              <icosahedronGeometry args={[0.06, 0]} />
              <meshBasicMaterial color={col} toneMapped={false} />
            </mesh>
          ))
        : null}
    </group>
  );
};

const Hospital: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("hospital", frame)) return null;
  const show = clamp(track("hospital.show", frame), 0, 1.2);
  const count = clamp(track("queue.count", frame), 0, 1);
  const red = clamp(track("queue.red", frame), 0, 1);
  const n = Math.round(8 * count);
  return (
    <group>
      <group position={HOSPITAL} scale={[1, Math.max(0.01, show), 1]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[4, 4, 3]} />
          <meshStandardMaterial color={PALETTE.hospital} {...MATTE} />
        </mesh>
        <mesh position={[0, 3.3, 1.52]}>
          <boxGeometry args={[0.9, 0.28, 0.04]} />
          <meshBasicMaterial color={PALETTE.cross} toneMapped={false} />
        </mesh>
        <mesh position={[0, 3.3, 1.53]}>
          <boxGeometry args={[0.28, 0.9, 0.04]} />
          <meshBasicMaterial color={PALETTE.cross} toneMapped={false} />
        </mesh>
        {[-1.3, 1.3].map((x) => (
          <mesh key={x} position={[x, 1.9, 1.52]}>
            <planeGeometry args={[0.8, 0.7]} />
            <meshBasicMaterial color={PALETTE.cityLight} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.7, 1.52]}>
          <planeGeometry args={[0.9, 1.4]} />
          <meshBasicMaterial color="#ffe9b0" toneMapped={false} />
        </mesh>
      </group>
      {Array.from({ length: n }, (_, i) => (
        <Person key={i} p={[HOSPITAL[0] + 0.2 + (i % 2) * 0.3, 0, HOSPITAL[2] + 2.0 + i * 0.7]} rot={Math.PI} suit={PALETTE.suit[i % 5]} red={red * (0.6 + 0.4 * rand(`q${i}`))} coverEyes={i % 3 === 1} />
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ Sol, faixa de ozônio e raios
const BAND_PARTS = Array.from({ length: 220 }, (_, i) => ({
  x: -13 + rand(`bp-x-${i}`) * 26,
  y: OZONE_Y + (rand(`bp-y-${i}`) - 0.5) * OZONE_H,
  z: -9 + rand(`bp-z-${i}`) * 14,
  vy: 0.5 + rand(`bp-v-${i}`) * 1.5,
  vx: (rand(`bp-vx-${i}`) - 0.5) * 2,
}));

const SkyColumn: React.FC<{ frame: number }> = ({ frame }) => {
  const amount = clamp(track("ozone.amount", frame, 1), 0, 1);
  const before = clamp(track("replay.before", frame), 0, 1);
  const dissolve = clamp(track("ozone.dissolve", frame), 0, 1);
  const glow = clamp(track("ozone.glow", frame), 0, 1);
  const ghost = isVisible("ghostBand", frame) ? Math.max(clamp(track("ghostBand.show", frame), 0, 1), 0.6) : 0;
  const squash = clamp(track("ruler.squash", frame), 0, 1);
  const band = Math.max(amount, before);
  const day = 1 - clamp(track("sky.night", frame), 0, 1);
  const bandH = lerp(OZONE_H, 0.06, squash * (isVisible("ruler2d", frame) ? 1 : 0));
  return (
    <group>
      {/* Sol */}
      <mesh position={SUN} scale={Math.max(0.001, day)}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshBasicMaterial color={PALETTE.sun} toneMapped={false} />
      </mesh>
      <mesh position={SUN} scale={Math.max(0.001, day)}>
        <sphereGeometry args={[3.2, 16, 12]} />
        <meshBasicMaterial color={PALETTE.sun} transparent opacity={0.25} toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      {/* faixa de ozônio */}
      {band > 0.01 ? (
        <mesh position={[0, OZONE_Y, -2]}>
          <boxGeometry args={[26, OZONE_H, 14]} />
          <meshStandardMaterial color={PALETTE.ozone} emissive={PALETTE.ozone} emissiveIntensity={0.35 + 0.6 * glow} {...MATTE} transparent opacity={0.55 * band} depthWrite={false} side={DoubleSide} />
        </mesh>
      ) : null}
      {/* contorno onde a faixa estava + faixa-fantasma "espremida" */}
      {ghost > 0.01 && band < 0.5 ? (
        <group>
          <lineSegments position={[0, OZONE_Y, -2]}>
            <edgesGeometry args={[BAND_BOX]} />
            <lineBasicMaterial color={PALETTE.ozone} transparent opacity={0.8 * ghost} />
          </lineSegments>
          {isVisible("ruler2d", frame) ? (
            <mesh position={[0, OZONE_Y, -2]} scale={[1, bandH / OZONE_H, 1]}>
              <boxGeometry args={[26, OZONE_H, 14]} />
              <meshBasicMaterial color={PALETTE.ozone} transparent opacity={0.45} toneMapped={false} depthWrite={false} />
            </mesh>
          ) : null}
        </group>
      ) : null}
      {/* partículas da faixa se desfazendo / voltando */}
      {dissolve > 0.01 && dissolve < 0.999
        ? BAND_PARTS.map((p, i) => {
            const d = smoothstep(dissolve);
            return (
              <mesh key={i} position={[p.x + p.vx * d, p.y + p.vy * d * 3, p.z]}>
                <icosahedronGeometry args={[0.12 * (1 - d * 0.6), 0]} />
                <meshBasicMaterial color={PALETTE.ozone} transparent opacity={1 - d} toneMapped={false} depthWrite={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

const BAND_BOX = new BoxGeometry(26, OZONE_H, 14);

export type RayFamily = "uva" | "uvb" | "uvc";
const RAY_COLOR: Record<RayFamily, string> = { uva: PALETTE.uva, uvb: PALETTE.uvb, uvc: PALETTE.uvc };
const GROUND_PTS = (fam: RayFamily, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    x: -7 + rand(`${fam}-gx-${i}`) * 13,
    z: -3 + rand(`${fam}-gz-${i}`) * 6.5,
    ph: rand(`${fam}-ph-${i}`),
  }));
// o 1º raio de cada família cai sobre a casa (cena 9: o telhado barra)
const HOUSE_PT = (fam: RayFamily) => ({ x: HOUSE[0] + 0.4, z: HOUSE[2] - 0.2, ph: rand(`${fam}-house`) });
const RAYS = { uva: [HOUSE_PT("uva"), ...GROUND_PTS("uva", 4)], uvb: [HOUSE_PT("uvb"), ...GROUND_PTS("uvb", 8)], uvc: [HOUSE_PT("uvc"), ...GROUND_PTS("uvc", 8)] };
/** Ponto sobre um raio real (para rótulos 2D): raio `idx` da família, na altura `h`. */
export const rayLabelPoint = (fam: RayFamily, idx: number, h: number): Vec3 => {
  const g = RAYS[fam][idx];
  const k = h / SUN_DIR.y;
  return [g.x + SUN_DIR.x * k, h, g.z + SUN_DIR.z * k];
};
const inHouse = (x: number, z: number) => x > HOUSE[0] - 1.6 && x < HOUSE[0] + 1.6 && z > HOUSE[2] - 1.6 && z < HOUSE[2] + 1.6;

const Rays: React.FC<{ frame: number }> = ({ frame }) => {
  const pose = cameraPoseAt(frame);
  const camDist = Math.hypot(pose.position[0] - pose.target[0], pose.position[1] - pose.target[1], pose.position[2] - pose.target[2]);
  // nos closes os raios viram faixas gigantes: some quando a câmera está perto
  const near = clamp((camDist - 16) / 14, 0, 1);
  const show = clamp(track("rays.show", frame), 0, 1) * (1 - clamp(track("sky.night", frame), 0, 1)) * near;
  if (show < 0.01) return null;
  const stop = track("rays.stopAtBand", frame) > 0.5 || track("replay.before", frame) > 0.5;
  const uvb = clamp(track("uvb.level", frame, 0.25), 0, 1);
  const uvc = clamp(track("uvc.level", frame), 0, 1);
  const top = 21;
  const out: React.ReactNode[] = [];
  (["uva", "uvb", "uvc"] as RayFamily[]).forEach((fam) => {
    const list = RAYS[fam];
    const n = fam === "uva" ? list.length : fam === "uvb" ? Math.round(3 + 6 * uvb) : stop ? 6 : Math.round(9 * uvc);
    list.slice(0, n).forEach((g, i) => {
      const ground = new Vector3(g.x, 0, g.z);
      const tTop = top / SUN_DIR.y;
      const start = ground.clone().add(SUN_DIR.clone().multiplyScalar(tTop));
      let endY = 0;
      let blocked = false;
      if (stop && (fam === "uvc" || (fam === "uvb" && i > 0))) {
        endY = OZONE_Y + OZONE_H / 2;
        blocked = true;
      } else if (inHouse(g.x, g.z)) {
        endY = 3.6;
        blocked = true;
      }
      const end = ground.clone().add(SUN_DIR.clone().multiplyScalar(endY / SUN_DIR.y));
      const a: Vec3 = [start.x, start.y, start.z];
      const b: Vec3 = [end.x, end.y, end.z];
      const w = fam === "uvb" ? 0.035 + 0.03 * uvb : fam === "uvc" ? 0.05 : 0.03;
      const col = RAY_COLOR[fam];
      out.push(<Segment key={`${fam}${i}`} a={a} b={b} radius={w} color={col} opacity={0.85 * show} />);
      out.push(<Segment key={`${fam}${i}g`} a={a} b={b} radius={w * 2.4} color={col} opacity={0.16 * show} additive />);
      // fótons descendo
      for (let k = 0; k < 3; k++) {
        const u = (frame * 0.025 + g.ph + k / 3) % 1;
        out.push(
          <mesh key={`${fam}${i}p${k}`} position={[lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]}>
            <icosahedronGeometry args={[w * 1.5, 0]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9 * show} toneMapped={false} />
          </mesh>,
        );
      }
      if (blocked) {
        const s = 0.2 + 0.12 * Math.sin(frame * 0.5 + i);
        out.push(
          <mesh key={`${fam}${i}x`} position={b}>
            <icosahedronGeometry args={[s, 0]} />
            <meshBasicMaterial color={col} transparent opacity={0.8 * show} toneMapped={false} blending={AdditiveBlending} depthWrite={false} />
          </mesh>,
        );
      }
    });
  });
  return <group>{out}</group>;
};

// ------------------------------------------------------------------ planeta
const Globe: React.FC<{ frame: number }> = ({ frame }) => {
  const geo = useMemo(() => {
    const g = new IcosahedronGeometry(8, 3);
    const pos = g.getAttribute("position");
    const colors: number[] = [];
    const ocean = new Color(PALETTE.globeOcean);
    const land = new Color(PALETTE.globeLand);
    for (let i = 0; i < pos.count; i += 3) {
      const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
      const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
      const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      const n = Math.sin(cx * 0.55 + 1.3) * Math.cos(cy * 0.7) + Math.sin(cz * 0.45 + cy * 0.3);
      const c = n > 0.55 ? land : ocean;
      for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return g;
  }, []);
  if (!isVisible("globe", frame)) return null;
  const show = clamp(track("globe.show", frame), 0, 1);
  const day = clamp(track("globe.dayHighlight", frame), 0, 1);
  const night = clamp(track("globe.nightHighlight", frame), 0, 1);
  return (
    <group position={GLOBE} scale={0.6 + 0.4 * show}>
      <mesh geometry={geo}>
        <meshStandardMaterial vertexColors {...MATTE} />
      </mesh>
      {/* lado da noite (z < 0) */}
      <mesh rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[8.06, 32, 20, 0, Math.PI]} />
        <meshBasicMaterial color="#060c24" transparent opacity={0.82} depthWrite={false} />
      </mesh>
      {Array.from({ length: 70 }, (_, i) => {
        const th = rand(`cl-t-${i}`) * Math.PI * 0.8 + 0.3;
        const ph = Math.PI + rand(`cl-p-${i}`) * Math.PI;
        const r = 8.12;
        const p: Vec3 = [-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th)];
        if (p[2] > -0.5) return null;
        return (
          <mesh key={i} position={p}>
            <icosahedronGeometry args={[0.09 + 0.08 * night, 0]} />
            <meshBasicMaterial color={PALETTE.cityLight} transparent opacity={0.5 + 0.5 * night} toneMapped={false} />
          </mesh>
        );
      })}
      {/* lado do dia com brilho de UV */}
      {day > 0.01 ? (
        <mesh>
          <sphereGeometry args={[8.35, 32, 20, 0, Math.PI]} />
          <meshBasicMaterial color={PALETTE.uvc} transparent opacity={0.3 * day * (0.8 + 0.2 * pulse(frame, 24))} toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ) : null}
      {/* casca de ozônio: ausente (contorno) */}
      <mesh>
        <sphereGeometry args={[8.8, 24, 16]} />
        <meshBasicMaterial color={PALETTE.ozone} wireframe transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* luz do Sol vindo de +z */}
      {[-4, 0, 4].map((x) =>
        [-3, 3].map((y) => <Segment key={`${x}${y}`} a={[x, y, 30]} b={[x, y, 9]} radius={0.12} color={PALETTE.sun} opacity={0.5 * show} />),
      )}
    </group>
  );
};

// ------------------------------------------------------------------ pele e DNA
const CELLS = Array.from({ length: 9 }, (_, i) => ({ x: -2.6 + i * 0.65, y: 2.05 }));
const Skin: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("skin", frame)) return null;
  const photons = clamp(track("skin.uvPhotons", frame), 0, 1);
  const breaks = clamp(track("dna.breaks", frame), 0, 1);
  const repair = clamp(track("dna.repair", frame), 0, 1);
  const layers: [number, number, string][] = [
    [1.8, 2.4, PALETTE.epidermis],
    [0.6, 1.8, PALETTE.dermis],
    [0, 0.6, PALETTE.hypodermis],
  ];
  // DNA no núcleo da célula central
  const c: Vec3 = [SKIN[0], 1.6, SKIN[2] + 2.6];
  const N = 16;
  const helixLen = 0.9;
  const breakIdx = [4, 8, 12];
  return (
    <group>
      <group position={SKIN}>
        {layers.map(([y0, y1, col]) => (
          <mesh key={y0} position={[0, (y0 + y1) / 2, 0]} receiveShadow>
            <boxGeometry args={[6, y1 - y0, 3]} />
            <meshStandardMaterial color={col} {...MATTE} />
          </mesh>
        ))}
        {CELLS.map((cl, i) => (
          <group key={i} position={[cl.x, cl.y, 1.52]}>
            <mesh scale={[1, 0.7, 0.3]}>
              <sphereGeometry args={[0.28, 10, 8]} />
              <meshStandardMaterial color="#f6cda8" {...MATTE} />
            </mesh>
            <mesh position={[0, 0, 0.06]} scale={[1, 0.8, 0.4]}>
              <sphereGeometry args={[0.11, 8, 6]} />
              <meshStandardMaterial color="#b06a8f" {...MATTE} />
            </mesh>
          </group>
        ))}
      </group>
      {/* núcleo ampliado + dupla hélice, "puxado" para fora da célula central */}
      <Segment a={[SKIN[0], 2.05, SKIN[2] + 1.55]} b={[c[0], c[1] - 0.2, c[2] - 0.5]} radius={0.02} color="#ffffff" opacity={0.7} />
      <mesh position={c}>
        <sphereGeometry args={[0.62, 18, 14]} />
        <meshStandardMaterial color="#b06a8f" {...MATTE} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {Array.from({ length: N }, (_, i) => {
        const t = i / (N - 1);
        const x = c[0] - helixLen / 2 + t * helixLen;
        const a = t * Math.PI * 3 + frame * 0.03;
        const r = 0.13;
        const p1: Vec3 = [x, c[1] + Math.cos(a) * r, c[2] + Math.sin(a) * r];
        const p2: Vec3 = [x, c[1] - Math.cos(a) * r, c[2] - Math.sin(a) * r];
        const bi = breakIdx.indexOf(i);
        const broken = bi >= 0 && breaks > (bi + 0.5) / 3.5 && repair < (bi === 1 ? 2 : (bi + 1) / 3.2);
        const col = broken ? PALETTE.dimer : PALETTE.dnaB;
        return (
          <group key={i}>
            <mesh position={p1}>
              <icosahedronGeometry args={[0.035, 0]} />
              <meshBasicMaterial color={PALETTE.dna} toneMapped={false} />
            </mesh>
            <mesh position={p2}>
              <icosahedronGeometry args={[0.035, 0]} />
              <meshBasicMaterial color={PALETTE.dna} toneMapped={false} />
            </mesh>
            <Segment a={p1} b={p2} radius={broken ? 0.03 : 0.012} color={col} />
            {broken ? (
              <mesh position={[(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2]}>
                <icosahedronGeometry args={[0.06 + 0.015 * Math.sin(frame * 0.4), 0]} />
                <meshBasicMaterial color={PALETTE.dimer} transparent opacity={0.85} toneMapped={false} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      {/* fótons de UV entrando */}
      {photons > 0.01
        ? Array.from({ length: 14 }, (_, i) => {
            const u = (frame * 0.03 + rand(`ph-${i}`)) % 1;
            const x = SKIN[0] - 2.5 + rand(`phx-${i}`) * 5;
            const y = lerp(5, 1.7, u);
            return (
              <mesh key={`p${i}`} position={[x, y, SKIN[2] + 1.6]}>
                <icosahedronGeometry args={[0.07, 0]} />
                <meshBasicMaterial color={i % 2 ? PALETTE.uvb : PALETTE.uvc} transparent opacity={photons * (1 - u * 0.4)} toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

// ------------------------------------------------------------------ olho
const Eye: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("eye", frame)) return null;
  const cornea = clamp(track("eye.cornea", frame), 0, 1);
  const blink = 1 - 0.15 * cornea * (0.5 + 0.5 * Math.sin(frame * 0.3));
  return (
    <group position={EYE}>
      <mesh>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color={interpolateColors(cornea, [0, 1], [PALETTE.sclera, "#f4b6ad"])} {...MATTE} flatShading={false} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <mesh key={k} position={[0, 0, 0]} rotation={[0.3 * (k - 2.5), (k % 2 ? 1 : -1) * 0.9, k]}>
          <torusGeometry args={[1.005, 0.008, 4, 24, 0.9]} />
          <meshBasicMaterial color="#d63a3a" transparent opacity={0.85 * cornea} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0, 1.003]}>
        <circleGeometry args={[0.42, 24]} />
        <meshStandardMaterial color={PALETTE.iris} {...MATTE} />
      </mesh>
      <mesh position={[0, 0, 1.006]}>
        <circleGeometry args={[0.17, 20]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      {/* córnea */}
      <mesh position={[0, 0, 0.55]}>
        <sphereGeometry args={[0.56, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial color={interpolateColors(cornea, [0, 1], ["#ffffff", "#ff8a7a"])} transparent opacity={0.15 + 0.4 * cornea} roughness={0.1} depthWrite={false} />
      </mesh>
      {/* pálpebras */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0, 0]} rotation={[s > 0 ? -0.15 * blink : Math.PI + 0.25 * blink, 0, 0]}>
          <sphereGeometry args={[1.06, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.6]} />
          <meshStandardMaterial color={PALETTE.skin} {...MATTE} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ mundo
export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = sceneAt(frame).id;
  const beachScene = sc !== "scene-05-dia-noite";
  return (
    <group>
      {beachScene ? (
        <>
          <Beach frame={frame} />
          <People frame={frame} />
          <House frame={frame} />
          <Palm frame={frame} />
          <Hospital frame={frame} />
          <SkyColumn frame={frame} />
          <Rays frame={frame} />
          <Skin frame={frame} />
          <Eye frame={frame} />
        </>
      ) : null}
      <Globe frame={frame} />
    </group>
  );
};
