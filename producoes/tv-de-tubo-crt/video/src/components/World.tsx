import { useLayoutEffect, useMemo, useRef } from "react";
import { interpolateColors, useCurrentFrame } from "remotion";
import { AdditiveBlending, CanvasTexture, CatmullRomCurve3, Color, DoubleSide, InstancedMesh, Object3D, Quaternion, RepeatWrapping, SRGBColorSpace, Vector3 } from "three";
import { isVisible, sceneAt, track } from "../data/scenes";
import { MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, pulse, rand, smoothstep, type Vec3 } from "../utils/animation";
import { DURATION } from "../utils/timing";

// Cenário persistente: sala retrô, gabinete de madeira e o tubo de raios catódicos em corte.
// Eixo do tubo em z; a tela (4 × 3) olha para +z com centro em (0,0,0). Tudo lê as trilhas no frame GLOBAL.

// ------------------------------------------------------------------ geometria
export const SCREEN_W = 4;
export const SCREEN_H = 3;
const PHOSPHOR_Z = -0.065;
const FUNNEL_FRONT_Z = -0.15;
const NECK_Z = -3.4;
const NECK_END_Z = -6.6;
const R_FRONT = 2.7;
const R_NECK = 0.35;
const Y_SCALE = 0.78;
const GUN_EXIT: Vec3 = [0, 0, -5.2];
const YOKE_Z = -3.55;

/** Raio do funil (em x) na profundidade z. */
export const funnelR = (z: number) => (z <= NECK_Z ? R_NECK : lerp(R_NECK, R_FRONT, clamp((z - NECK_Z) / (FUNNEL_FRONT_Z - NECK_Z), 0, 1)));

export const POINTS = {
  knob: [1.7, -2.05, 0.45] as Vec3,
  phosphor: [1.15, 0.75, PHOSPHOR_Z] as Vec3,
  cathode: [0, 0.05, -6.15] as Vec3,
  grid: [0, 0.18, -5.95] as Vec3,
  anode: [0, funnelR(-2.0) * Y_SCALE + 0.08, -2.0] as Vec3,
  yoke: [0, 0.78, YOKE_Z] as Vec3,
  mask: [0.95, 0.75, -0.25] as Vec3,
  screenSky: [0.9, 1.05, PHOSPHOR_Z] as Vec3,
  screenHill: [-0.9, -0.95, PHOSPHOR_Z] as Vec3,
  screenTopLeft: [-2, 1.5, PHOSPHOR_Z] as Vec3,
  screenBottomRight: [2, -1.5, PHOSPHOR_Z] as Vec3,
  screenCenter: [0, 0, PHOSPHOR_Z] as Vec3,
  wrongDot: [0.6 + 0.013, 0.4 - 0.0075, -0.06] as Vec3,
};

// ------------------------------------------------------------------ trilhas integradas (puras, em cache)
const integralCache = new Map<string, Float64Array>();
/** Soma de `target` × escala do frame 0 até `frame` (zera quando `resetTarget` < 0,5). */
const integral = (target: string, frame: number, scale: number, resetTarget?: string) => {
  const key = `${target}|${scale}|${resetTarget ?? ""}`;
  let arr = integralCache.get(key);
  if (!arr) {
    arr = new Float64Array(DURATION + 1);
    let acc = 0;
    for (let fr = 0; fr <= DURATION; fr++) {
      if (resetTarget && track(resetTarget, fr) < 0.5) acc = 0;
      else acc += track(target, fr) * scale;
      arr[fr] = acc;
    }
    integralCache.set(key, arr);
  }
  return arr[clamp(Math.floor(frame), 0, DURATION)];
};

export const SCAN_LINES = 12;
/** Estado da varredura: fase acumulada (campos), linha atual e posição do ponto (−1…1). */
export const scanState = (frame: number) => {
  const phase = integral("scan.speed", frame, 0.13, "scan.on");
  const field = phase % 1;
  const line = Math.min(SCAN_LINES - 1, Math.floor(field * SCAN_LINES));
  const xFrac = (field * SCAN_LINES) % 1;
  return { phase, line, xFrac, prev: phase >= 1, x: -1 + 2 * xFrac, y: 1 - (2 * (line + 0.5)) / SCAN_LINES };
};

/** Ponto onde o feixe acerta a tela, em coordenadas normalizadas (−1…1). */
export const beamTarget = (frame: number) => {
  if (track("scan.on", frame) > 0.5) {
    const st = scanState(frame);
    return { x: st.x, y: st.y };
  }
  return { x: track("beam.x", frame), y: track("beam.y", frame) };
};

const signalWave = (frame: number) => 0.5 + 0.5 * Math.sin(frame * 0.55) * Math.sin(frame * 0.13 + 1);

// ------------------------------------------------------------------ imagem da tela (gerada por código)
const TEX_W = 640;
const TEX_H = 480;

const drawLandscape = (ctx: CanvasRenderingContext2D) => {
  const sky = ctx.createLinearGradient(0, 0, 0, TEX_H * 0.62);
  sky.addColorStop(0, "#3f8fd8");
  sky.addColorStop(1, "#ffd3a0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = "#ffe066";
  ctx.beginPath();
  ctx.arc(470, 150, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  for (const [x, y, r] of [[120, 90, 30], [155, 80, 38], [195, 95, 28], [330, 60, 22], [358, 54, 28]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#5aa860";
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.bezierCurveTo(160, 210, 300, 260, 400, 250);
  ctx.bezierCurveTo(500, 240, 580, 200, 640, 230);
  ctx.lineTo(640, 480);
  ctx.lineTo(0, 480);
  ctx.fill();
  ctx.fillStyle = "#2e6b3a";
  ctx.beginPath();
  ctx.moveTo(0, 370);
  ctx.bezierCurveTo(140, 320, 320, 400, 640, 340);
  ctx.lineTo(640, 480);
  ctx.lineTo(0, 480);
  ctx.fill();
  // casinha
  ctx.fillStyle = "#f2e6c9";
  ctx.fillRect(150, 300, 90, 64);
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.moveTo(138, 302);
  ctx.lineTo(195, 255);
  ctx.lineTo(252, 302);
  ctx.fill();
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(184, 330, 22, 34);
  ctx.fillStyle = "#7fc8f0";
  ctx.fillRect(160, 316, 18, 16);
  // árvore
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(520, 300, 14, 50);
  ctx.fillStyle = "#3f8f45";
  ctx.beginPath();
  ctx.arc(527, 290, 36, 0, Math.PI * 2);
  ctx.fill();
};

type ScreenCanvases = { out: HTMLCanvasElement; color: HTMLCanvasElement; gray: HTMLCanvasElement; content: HTMLCanvasElement; texture: CanvasTexture };

const makeCanvas = () => {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  return c;
};

const useScreenCanvases = (): ScreenCanvases =>
  useMemo(() => {
    const color = makeCanvas();
    drawLandscape(color.getContext("2d")!);
    const gray = makeCanvas();
    const g = gray.getContext("2d")!;
    g.filter = "grayscale(1) contrast(1.1)";
    g.drawImage(color, 0, 0);
    const out = makeCanvas();
    const texture = new CanvasTexture(out);
    texture.colorSpace = SRGBColorSpace;
    return { out, color, gray, content: makeCanvas(), texture };
  }, []);

const glowDot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, color = "255,255,255") => {
  if (alpha <= 0.001) return;
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${color},${alpha})`);
  gr.addColorStop(0.35, `rgba(${color},${alpha * 0.8})`);
  gr.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = gr;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

const HITS = Array.from({ length: 6 }, (_, i) => ({ x: 0.8 + (rand(`hit-x-${i}`) - 0.5) * 0.7, y: 0.55 + (rand(`hit-y-${i}`) - 0.5) * 0.5 }));
const toTex = (x: number, y: number) => ({ u: ((x + SCREEN_W / 2) / SCREEN_W) * TEX_W, v: ((SCREEN_H / 2 - y) / SCREEN_H) * TEX_H });

const paintScreen = (cv: ScreenCanvases, frame: number) => {
  const ctx = cv.out.getContext("2d")!;
  const reveal = isVisible("electronHits", frame) ? track("phosphor.reveal", frame) : 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = interpolateColors(reveal, [0, 1], [PALETTE.screenOff, "#7f948a"]);
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // conteúdo: tela clara uniforme → imagem P&B revelada de cima para baixo → cor
  const img = clamp(track("screen.image", frame), 0, 1);
  const col = clamp(track("screen.color", frame), 0, 1);
  const c = cv.content.getContext("2d")!;
  c.globalAlpha = 1;
  c.fillStyle = "#dfe7e3";
  c.fillRect(0, 0, TEX_W, TEX_H);
  if (img > 0.001) {
    const h = Math.round(TEX_H * img);
    c.drawImage(cv.gray, 0, 0, TEX_W, h, 0, 0, TEX_W, h);
    if (col > 0.001) {
      c.globalAlpha = col;
      c.drawImage(cv.color, 0, 0, TEX_W, h, 0, 0, TEX_W, h);
      c.globalAlpha = 1;
    }
  }

  if (track("scan.on", frame) > 0.5) {
    const speed = track("scan.speed", frame);
    const fast = clamp((speed - 0.15) / 0.35, 0, 1);
    if (fast > 0.001) {
      ctx.globalAlpha = fast;
      ctx.drawImage(cv.content, 0, 0);
    }
    const slow = 1 - fast;
    if (slow > 0.001) {
      const st = scanState(frame);
      const lh = TEX_H / SCAN_LINES;
      for (let j = 0; j < SCAN_LINES; j++) {
        const y0 = j * lh;
        const hh = lh * 0.8;
        const draw = (x0: number, w: number, a: number) => {
          if (w <= 0 || a <= 0.001) return;
          ctx.globalAlpha = a * slow;
          ctx.drawImage(cv.content, x0, y0, w, hh, x0, y0, w, hh);
        };
        if (j < st.line) draw(0, TEX_W, 1);
        else if (j === st.line) {
          draw(0, TEX_W * st.xFrac, 1);
          if (st.prev) draw(TEX_W * st.xFrac, TEX_W * (1 - st.xFrac), 0.3);
        } else if (st.prev) draw(0, TEX_W, 0.3);
      }
      ctx.globalAlpha = 1;
      const d = toTex((st.x * SCREEN_W) / 2, (st.y * SCREEN_H) / 2);
      glowDot(ctx, d.u, d.v + lh * 0.4, 26, slow);
    }
  } else {
    const p = clamp(track("screen.power", frame), 0, 1);
    if (p > 0.001) {
      const h = Math.max(3, TEX_H * smoothstep(p));
      ctx.globalAlpha = 1;
      ctx.drawImage(cv.content, 0, 0, TEX_W, TEX_H, 0, (TEX_H - h) / 2, TEX_W, h);
      if (p < 0.6) {
        ctx.globalAlpha = 1 - p / 0.6;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, TEX_H / 2 - h / 2, TEX_W, h);
      }
    }
    const dot = clamp(track("screen.dot", frame), 0, 1);
    if (dot > 0.001) {
      const pos = beamTarget(frame);
      const d = toTex((pos.x * SCREEN_W) / 2, (pos.y * SCREEN_H) / 2);
      const pul = track("spot.pulse", frame);
      const r = 30 * (1 + 0.35 * Math.sin(pul * Math.PI));
      glowDot(ctx, d.u, d.v, r * 2.2, 0.35 * dot, "120,255,240");
      glowDot(ctx, d.u, d.v, r, dot);
    }
  }

  // impactos de teste (cena 2)
  if (isVisible("electronHits", frame)) {
    const b = track("electronHits.burst", frame) * HITS.length;
    HITS.forEach((h, i) => {
      const q = b - i;
      if (q < 1 || q > 1.6) return;
      const a = 1 - (q - 1) / 0.6;
      const d = toTex(h.x, h.y);
      glowDot(ctx, d.u, d.v, 34, a, "200,255,220");
    });
  }

  // entrelaçamento: linhas ímpares (amarelo) e pares (ciano) alternando
  const il = clamp(track("interlace.show", frame), 0, 1);
  if (il > 0.001) {
    const parity = Math.floor(frame / 8) % 2;
    const n = 24;
    const lh = TEX_H / n;
    for (let j = 0; j < n; j++) {
      const active = j % 2 === parity;
      ctx.globalAlpha = (active ? 0.42 : 0.5) * il;
      ctx.fillStyle = active ? (parity === 0 ? "#ffd23f" : "#4fe3ff") : "#0b1014";
      ctx.fillRect(0, j * lh, TEX_W, lh * 0.82);
    }
  }
  ctx.globalAlpha = 1;
  cv.texture.needsUpdate = true;
};

// ------------------------------------------------------------------ peças utilitárias
const UP = new Vector3(0, 1, 0);
/** Cilindro entre dois pontos (feixes, cabos retos, linhas de campo). */
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
      <cylinderGeometry args={[1, 1, 1, 8, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} blending={additive ? AdditiveBlending : undefined} depthWrite={!additive && opacity >= 1} />
    </mesh>
  );
};

const Glass: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => (
  <meshStandardMaterial color={PALETTE.glass} transparent opacity={opacity} roughness={0.15} metalness={0} side={DoubleSide} depthWrite={false} />
);

const fade = (o: number) => ({ transparent: o < 0.999, opacity: o, depthWrite: o >= 0.999 });

// ------------------------------------------------------------------ sala
const Room: React.FC<{ frame: number }> = ({ frame }) => {
  const o = 1 - clamp(track("bg.inside", frame), 0, 1);
  if (o < 0.01) return null;
  return (
    <group>
      <mesh position={[0, -3.2, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={PALETTE.floor} {...MATTE} {...fade(o)} />
      </mesh>
      <mesh position={[0, -3.18, 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 8]} />
        <meshStandardMaterial color={PALETTE.rug} {...MATTE} {...fade(o)} />
      </mesh>
      <mesh position={[0, 8, -16]} receiveShadow>
        <planeGeometry args={[60, 24]} />
        <meshStandardMaterial color={PALETTE.wall} {...MATTE} {...fade(o)} />
      </mesh>
      {/* mesinha com abajur */}
      <group position={[-6.2, -3.2, -2.5]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[1.6, 0.15, 1.6]} />
          <meshStandardMaterial color={PALETTE.woodDark} {...MATTE} {...fade(o)} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 1.4, 6]} />
          <meshStandardMaterial color={PALETTE.woodDark} {...MATTE} {...fade(o)} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
          <meshStandardMaterial color={PALETTE.metalDark} {...METAL} {...fade(o)} />
        </mesh>
        <mesh position={[0, 3.1, 0]}>
          <cylinderGeometry args={[0.45, 0.75, 0.8, 8, 1, true]} />
          <meshStandardMaterial color={PALETTE.lamp} emissive={PALETTE.lamp} emissiveIntensity={0.6} {...MATTE} side={DoubleSide} {...fade(o)} />
        </mesh>
      </group>
      {/* vaso com planta */}
      <group position={[5.6, -3.2, -3]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.45, 0.35, 1, 7]} />
          <meshStandardMaterial color="#c56b45" {...MATTE} {...fade(o)} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.3) * 0.3, 1.5 + (i % 2) * 0.3, Math.sin(i * 1.3) * 0.3]} rotation={[Math.sin(i) * 0.5, i, Math.cos(i) * 0.5]}>
            <coneGeometry args={[0.28, 1.6, 4]} />
            <meshStandardMaterial color="#4f8f3c" {...MATTE} {...fade(o)} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ gabinete
const CAB = { x: 2.7, yTop: 2.0, yBot: -2.5, zFront: 0.38, zBack: -7.3, openX: 2.15, openY: 1.6 };

const Cabinet: React.FC<{ frame: number }> = ({ frame }) => {
  const cut = clamp(track("cabinet.cut", frame), 0, 1);
  const shell = 1 - 0.9 * cut;
  const frontO = 1 - 0.55 * cut;
  const fz = (CAB.zFront + 0.08) / 2;
  const fd = CAB.zFront - 0.08;
  const depth = 0.08 - CAB.zBack;
  const cz = (0.08 + CAB.zBack) / 2;
  const turn = track("knob.turn", frame);
  const on = track("scan.on", frame) > 0.5 || track("screen.power", frame) > 0.5;
  const wood = { color: PALETTE.wood, ...MATTE };
  return (
    <group>
      {/* moldura frontal com a abertura da tela */}
      <mesh position={[0, (CAB.yTop + CAB.openY) / 2, fz]} castShadow>
        <boxGeometry args={[CAB.x * 2, CAB.yTop - CAB.openY, fd]} />
        <meshStandardMaterial {...wood} {...fade(frontO)} />
      </mesh>
      <mesh position={[0, (CAB.yBot - CAB.openY) / 2, fz]} castShadow>
        <boxGeometry args={[CAB.x * 2, -CAB.openY - CAB.yBot, fd]} />
        <meshStandardMaterial {...wood} {...fade(frontO)} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (CAB.x + CAB.openX) / 2, 0, fz]} castShadow>
          <boxGeometry args={[CAB.x - CAB.openX, CAB.openY * 2, fd]} />
          <meshStandardMaterial {...wood} {...fade(frontO)} />
        </mesh>
      ))}
      {/* laterais, tampo, fundo e base */}
      {[-1, 1].map((sx) => (
        <mesh key={`s${sx}`} position={[sx * (CAB.x - 0.05), (CAB.yTop + CAB.yBot) / 2, cz]} castShadow={cut < 0.5}>
          <boxGeometry args={[0.1, CAB.yTop - CAB.yBot, depth]} />
          <meshStandardMaterial {...wood} color={PALETTE.woodLight} {...fade(shell)} />
        </mesh>
      ))}
      <mesh position={[0, CAB.yTop - 0.05, cz]} castShadow={cut < 0.5}>
        <boxGeometry args={[CAB.x * 2, 0.1, depth]} />
        <meshStandardMaterial {...wood} color={PALETTE.woodLight} {...fade(shell)} />
      </mesh>
      <mesh position={[0, CAB.yBot + 0.05, cz]}>
        <boxGeometry args={[CAB.x * 2, 0.1, depth]} />
        <meshStandardMaterial {...wood} color={PALETTE.woodDark} {...fade(Math.max(shell, 0.5))} />
      </mesh>
      <mesh position={[0, (CAB.yTop + CAB.yBot) / 2, CAB.zBack + 0.05]}>
        <boxGeometry args={[CAB.x * 2, CAB.yTop - CAB.yBot, 0.1]} />
        <meshStandardMaterial {...wood} color={PALETTE.woodDark} {...fade(shell)} />
      </mesh>
      {/* pés */}
      {[
        [-2.2, -2.2],
        [2.2, -2.2],
        [-2.2, -6.6],
        [2.2, -6.6],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -2.85, z]} castShadow>
          <cylinderGeometry args={[0.1, 0.07, 0.7, 6]} />
          <meshStandardMaterial color={PALETTE.woodDark} {...MATTE} />
        </mesh>
      ))}
      {/* botões, grade do alto-falante e LED */}
      {[POINTS.knob, [0.9, -2.05, 0.45] as Vec3].map((p, i) => (
        <group key={i} position={p} rotation={[Math.PI / 2, i === 0 ? -turn * 1.6 : 0.4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.24, 0.26, 0.16, 12]} />
            <meshStandardMaterial color={PALETTE.knob} {...MATTE} {...fade(frontO)} />
          </mesh>
          <mesh position={[0, 0.09, 0.15]}>
            <boxGeometry args={[0.05, 0.04, 0.16]} />
            <meshStandardMaterial color={PALETTE.bezel} {...MATTE} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`g${i}`} position={[-1.4, -1.82 - i * 0.12, 0.4]}>
          <boxGeometry args={[1.6, 0.05, 0.02]} />
          <meshStandardMaterial color={PALETTE.woodDark} {...MATTE} {...fade(frontO)} />
        </mesh>
      ))}
      <mesh position={[2.25, -2.05, 0.42]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial color={on ? "#ff4b3e" : "#4a1d1a"} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ tubo
const Tube: React.FC<{ frame: number; cv: ScreenCanvases }> = ({ frame, cv }) => {
  const anode = clamp(track("anode.on", frame), 0, 1);
  const sealed = clamp(track("sealTip.sealed", frame), 0, 1.3);
  const cutaway = clamp(track("screen.cutaway", frame), 0, 1);
  const len = FUNNEL_FRONT_Z - NECK_Z;
  const coatLen = 2.5;
  const coatZ = -0.6 - coatLen / 2;
  const cable = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(...POINTS.anode),
        new Vector3(0, POINTS.anode[1] + 0.5, -2.5),
        new Vector3(0.7, 1.6, -4.2),
        new Vector3(1.5, 0.6, -5.6),
        new Vector3(1.6, -0.2, -5.9),
      ]),
    [],
  );
  return (
    <group>
      {/* tela: fósforo (textura animada) + vidro frontal */}
      <mesh position={[0, 0, PHOSPHOR_Z]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial map={cv.texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[SCREEN_W + 0.5, SCREEN_H + 0.4, 0.12]} />
        <Glass opacity={0.14 * (1 - 0.6 * cutaway)} />
      </mesh>
      {/* saia entre o vidro e o funil */}
      <group position={[0, 0, -0.17]}>
        {[
          [0, 1.72, SCREEN_W + 0.5, 0.04],
          [0, -1.72, SCREEN_W + 0.5, 0.04],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[w, h, 0.22]} />
            <Glass opacity={0.3} />
          </mesh>
        ))}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * (SCREEN_W / 2 + 0.25), 0, 0]}>
            <boxGeometry args={[0.04, SCREEN_H + 0.4, 0.22]} />
            <Glass opacity={0.3} />
          </mesh>
        ))}
      </group>
      {/* funil + revestimento interno do ânodo */}
      <group scale={[1, Y_SCALE, 1]}>
        <mesh position={[0, 0, (FUNNEL_FRONT_Z + NECK_Z) / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R_FRONT, R_NECK, len, 20, 1, true]} />
          <Glass opacity={0.2} />
        </mesh>
        <mesh position={[0, 0, coatZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[funnelR(-0.6) * 0.96, funnelR(-0.6 - coatLen) * 0.96, coatLen, 20, 1, true]} />
          <meshStandardMaterial color={PALETTE.coating} emissive="#2f7df6" emissiveIntensity={anode * (0.55 + 0.25 * pulse(frame, 24))} transparent opacity={0.28 + 0.2 * anode} side={DoubleSide} depthWrite={false} {...MATTE} />
        </mesh>
      </group>
      {/* gargalo, soquete e ponta de selagem */}
      <mesh position={[0, 0, (NECK_Z + NECK_END_Z) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[R_NECK, R_NECK, NECK_Z - NECK_END_Z, 16, 1, true]} />
        <Glass opacity={0.22} />
      </mesh>
      <mesh position={[0, 0, NECK_END_Z - 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.3, 12]} />
        <meshStandardMaterial color={PALETTE.bezel} {...MATTE} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos(i) * 0.22, Math.sin(i) * 0.22, NECK_END_Z - 0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.18, 5]} />
          <meshStandardMaterial color={PALETTE.metal} {...METAL} />
        </mesh>
      ))}
      <mesh position={[0, 0, NECK_END_Z - 0.42]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1 - 0.45 * Math.min(1, sealed), 1]}>
        <coneGeometry args={[0.07, 0.3, 8]} />
        <meshStandardMaterial color={PALETTE.glass} emissive="#ffffff" emissiveIntensity={sealed > 0.05 && sealed < 1.02 ? 0.8 * (1 - sealed) : 0} {...MATTE} />
      </mesh>
      {/* ânodo: botão, cabo e caixa de alta tensão */}
      <mesh position={POINTS.anode}>
        <cylinderGeometry args={[0.14, 0.16, 0.12, 10]} />
        <meshStandardMaterial color={PALETTE.metal} emissive={PALETTE.cable} emissiveIntensity={anode * 0.9} {...METAL} />
      </mesh>
      <mesh>
        <tubeGeometry args={[cable, 40, 0.05, 6, false]} />
        <meshStandardMaterial color={PALETTE.cable} emissive={PALETTE.cable} emissiveIntensity={anode * (0.5 + 0.4 * pulse(frame, 18))} {...MATTE} />
      </mesh>
      <mesh position={[1.6, -0.6, -5.9]} castShadow>
        <boxGeometry args={[0.8, 0.9, 0.7]} />
        <meshStandardMaterial color="#24262b" {...MATTE} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ canhão de elétrons
const CATHODE_OFF: Vec3[] = [
  [0, 0.09, 0],
  [-0.078, -0.045, 0],
  [0.078, -0.045, 0],
];
const BEAM_COLORS = [PALETTE.red, PALETTE.green, PALETTE.blue];

const Gun: React.FC<{ frame: number }> = ({ frame }) => {
  const heat = clamp(track("cathode.heat", frame), 0, 1);
  const count = track("gun.count", frame, 1);
  const split = clamp(count - 1, 0, 2) / 2;
  const colors = clamp(track("beam.colors", frame), 0, 1);
  const hl = clamp(track("gun.highlight", frame), 0, 1) * (isVisible("labels", frame) ? 1 : 0);
  const sig = isVisible("signal", frame) ? clamp(track("signal.amp", frame), 0, 1) : 0;
  const open = lerp(0.65, 0.25 + 0.75 * signalWave(frame), sig);
  const hot = interpolateColors(heat, [0, 1], [PALETTE.metalDark, PALETTE.cathodeHot]);
  return (
    <group>
      {CATHODE_OFF.map((o, i) => {
        const visible = i === 0 ? 1 : split;
        if (visible < 0.01) return null;
        const pos: Vec3 = [o[0] * split, i === 0 ? o[1] * split : o[1], -6.13];
        const tip = interpolateColors(colors, [0, 1], [hot, BEAM_COLORS[i]]);
        return (
          <group key={i} position={pos} scale={i === 0 ? 1 : visible}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.26, 8]} />
              <meshStandardMaterial color={PALETTE.metal} emissive={PALETTE.cathodeHot} emissiveIntensity={heat * 0.7} {...METAL} />
            </mesh>
            <mesh position={[0, 0, 0.135]}>
              <circleGeometry args={[0.05, 10]} />
              <meshBasicMaterial color={tip} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {/* grade de controle */}
      <mesh position={[0, 0, -5.95]}>
        <ringGeometry args={[0.03 + 0.07 * open, 0.24, 20]} />
        <meshStandardMaterial color={PALETTE.metal} emissive={PALETTE.signal} emissiveIntensity={sig * 0.5 + hl * 0.4} side={DoubleSide} {...METAL} />
      </mesh>
      {/* anéis de foco/aceleração */}
      {[-5.7, -5.47, -5.27].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.14, 14, 1, true]} />
          <meshStandardMaterial color={PALETTE.metal} emissive={PALETTE.beam} emissiveIntensity={hl * 0.8} side={DoubleSide} {...METAL} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={`r${i}`} position={[Math.cos(i * 2.1 + 0.5) * 0.26, Math.sin(i * 2.1 + 0.5) * 0.26, -5.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 1.2, 5]} />
          <meshStandardMaterial color="#e8eef2" {...MATTE} />
        </mesh>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ partículas: elétrons e ar
const CLOUD = Array.from({ length: 28 }, (_, i) => ({ a: rand(`cl-a-${i}`) * Math.PI * 2, r: rand(`cl-r-${i}`) * 0.12, z: rand(`cl-z-${i}`) * 0.18, ph: rand(`cl-p-${i}`) * 50 }));
const STREAM = Array.from({ length: 46 }, (_, i) => ({
  ph: rand(`st-p-${i}`),
  a: rand(`st-a-${i}`) * Math.PI * 2,
  r: 0.3 + rand(`st-r-${i}`) * 0.7,
  sa: rand(`st-sa-${i}`) * Math.PI * 2,
  lose: 0.08 + rand(`st-l-${i}`) * 0.3,
}));
const AIR = Array.from({ length: 70 }, (_, i) => {
  const z = -6.3 + rand(`air-z-${i}`) * 5.5;
  const rr = funnelR(z) * 0.8 * Math.sqrt(rand(`air-r-${i}`));
  const a = rand(`air-a-${i}`) * Math.PI * 2;
  return { p: [Math.cos(a) * rr, Math.sin(a) * rr * Y_SCALE, z] as Vec3, out: rand(`air-o-${i}`), ph: rand(`air-ph-${i}`) * 40 };
});
const ELECTRON_R = 0.035;

const Electrons: React.FC<{ frame: number }> = ({ frame }) => {
  const cloud = clamp(track("electronCloud.amount", frame), 0, 1) * (isVisible("electronCloud", frame) ? 1 : 0);
  const fire = clamp(track("electrons.fire", frame), 0, 1);
  const speed = track("electrons.speed", frame, 1);
  const scatter = clamp(track("electrons.scatter", frame), 0, 1);
  const travel = integral("electrons.speed", frame, 0.028);
  const air = isVisible("air", frame) ? clamp(track("air.amount", frame), 0, 1) : 0;
  const focus = clamp((speed - 0.15) / 0.85, 0, 1);
  const showHits = isVisible("electronHits", frame);
  const burst = track("electronHits.burst", frame) * HITS.length;
  return (
    <group>
      {cloud > 0.01
        ? CLOUD.map((c, i) => {
            if (i / CLOUD.length > cloud) return null;
            const w = Math.sin((frame + c.ph) * 0.2) * 0.02;
            return (
              <mesh key={`c${i}`} position={[Math.cos(c.a) * c.r + w, Math.sin(c.a) * c.r - w, -5.98 + c.z]}>
                <sphereGeometry args={[ELECTRON_R * 0.8, 6, 5]} />
                <meshBasicMaterial color={PALETTE.electron} toneMapped={false} />
              </mesh>
            );
          })
        : null}
      {fire > 0.01
        ? STREAM.map((e, i) => {
            if (i / STREAM.length > fire) return null;
            const u = (e.ph + travel) % 1;
            const z = -5.85 + u * 5.75;
            const spread = (0.05 + 0.25 * (1 - focus)) * e.r * Math.min(1, u * 4);
            let x = Math.cos(e.a) * spread;
            let y = Math.sin(e.a) * spread;
            let o = 1;
            if (scatter > 0.01 && u > e.lose) {
              const k = (u - e.lose) * 3.2 * scatter;
              x += Math.cos(e.sa) * k;
              y += Math.sin(e.sa) * k * Y_SCALE;
              o = clamp(1 - (u - e.lose) * 5 * scatter, 0, 1);
            }
            const lim = funnelR(z) * 0.95;
            if (o < 0.02 || Math.hypot(x, y / Y_SCALE) > lim) return null;
            return (
              <mesh key={`s${i}`} position={[x, y, z]}>
                <sphereGeometry args={[ELECTRON_R, 6, 5]} />
                <meshBasicMaterial color={PALETTE.electron} transparent opacity={o} toneMapped={false} />
              </mesh>
            );
          })
        : null}
      {isVisible("air", frame)
        ? AIR.map((m, i) => {
            const gone = clamp(((1 - air) * 1.4 - m.out * 0.4) / 0.6, 0, 1);
            if (gone >= 1) return null;
            const e = smoothstep(gone);
            const j = 0.05;
            const p: Vec3 = [
              lerp(m.p[0], 0, e) + Math.sin((frame + m.ph) * 0.11) * j,
              lerp(m.p[1], 0, e) + Math.cos((frame + m.ph) * 0.09) * j,
              lerp(m.p[2], NECK_END_Z - 0.4, e),
            ];
            return (
              <mesh key={`a${i}`} position={p}>
                <sphereGeometry args={[0.09 * (1 - 0.5 * e), 7, 5]} />
                <meshStandardMaterial color={PALETTE.air} {...MATTE} />
              </mesh>
            );
          })
        : null}
      {showHits
        ? HITS.map((h, i) => {
            const q = burst - i;
            if (q <= 0 || q >= 1) return null;
            const z = lerp(-2.2, PHOSPHOR_Z - 0.02, q);
            return (
              <mesh key={`h${i}`} position={[h.x, h.y, z]}>
                <sphereGeometry args={[ELECTRON_R * 1.2, 6, 5]} />
                <meshBasicMaterial color={PALETTE.electron} toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

// ------------------------------------------------------------------ feixe(s)
const Beams: React.FC<{ frame: number }> = ({ frame }) => {
  const vis = clamp(track("beam.visible", frame), 0, 1);
  if (vis < 0.01) return null;
  const pos = beamTarget(frame);
  const hit: Vec3 = [(pos.x * SCREEN_W) / 2, (pos.y * SCREEN_H) / 2, PHOSPHOR_Z - 0.01];
  const yoke = clamp(track("yoke.install", frame), 0, 1);
  const bend: Vec3 = [0, 0, YOKE_Z];
  const count = track("gun.count", frame, 1);
  const split = clamp(count - 1, 0, 2) / 2;
  const colors = clamp(track("beam.colors", frame), 0, 1);
  const sig = isVisible("signal", frame) ? clamp(track("signal.amp", frame), 0, 1) : 0;
  const width = 0.028 * lerp(1, 0.4 + 1.3 * signalWave(frame), sig);
  const n = split > 0.02 ? 3 : 1;
  const beams = Array.from({ length: n }, (_, i) => {
    const o = n === 1 ? ([0, 0, 0] as Vec3) : CATHODE_OFF[i];
    const start: Vec3 = [o[0] * split, o[1] * split, GUN_EXIT[2]];
    const color = n === 1 ? PALETTE.beam : interpolateColors(colors, [0, 1], [PALETTE.beam, BEAM_COLORS[i]]);
    const mid: Vec3 = [lerp(start[0], 0, 0.9), lerp(start[1], 0, 0.9), bend[2]];
    return { start, mid, color };
  });
  const flow = (frame * 0.06) % 1;
  return (
    <group>
      {beams.map((b, i) => {
        const pts: Vec3[] = yoke > 0.5 || (hit[0] === 0 && hit[1] === 0) ? [b.start, b.mid, hit] : [b.start, hit];
        return (
          <group key={i}>
            {pts.slice(1).map((p, k) => (
              <group key={k}>
                <Segment a={pts[k]} b={p} radius={width} color={b.color} opacity={vis} />
                <Segment a={pts[k]} b={p} radius={width * 4} color={b.color} opacity={0.22 * vis} additive />
              </group>
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => {
              const u = (flow + j / 8) % 1;
              const seg = pts.length === 3 ? (u < 0.32 ? 0 : 1) : 0;
              const lu = pts.length === 3 ? (seg === 0 ? u / 0.32 : (u - 0.32) / 0.68) : u;
              const a = pts[seg];
              const c = pts[seg + 1];
              return (
                <mesh key={`e${j}`} position={[lerp(a[0], c[0], lu), lerp(a[1], c[1], lu), lerp(a[2], c[2], lu)]}>
                  <sphereGeometry args={[width * 1.6, 6, 5]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={vis} toneMapped={false} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ bobinas de deflexão
const Yoke: React.FC<{ frame: number }> = ({ frame }) => {
  const inst = track("yoke.install", frame);
  if (inst < 0.01) return null;
  const z = YOKE_Z - (1 - Math.min(1, inst)) * 1.4;
  const field = isVisible("field", frame) ? clamp(track("field.show", frame), 0, 1) : 0;
  return (
    <group position={[0, 0, z]} scale={clamp(inst, 0, 1.2)}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.78, 0.46, 0.72, 16, 1, true]} />
        <meshStandardMaterial color="#2c2f35" side={DoubleSide} {...MATTE} />
      </mesh>
      {/* par horizontal (laranja) nas laterais e par vertical (cobre) em cima/embaixo */}
      {[0, Math.PI].map((r, i) => (
        <mesh key={`h${i}`} rotation={[0, 0, r - 0.6]}>
          <torusGeometry args={[0.66, 0.1, 6, 12, 1.2]} />
          <meshStandardMaterial color={PALETTE.copper} emissive={PALETTE.field} emissiveIntensity={field * 0.35} {...METAL} />
        </mesh>
      ))}
      {[Math.PI / 2, -Math.PI / 2].map((r, i) => (
        <mesh key={`v${i}`} rotation={[0, 0, r - 0.6]} position={[0, 0, -0.12]}>
          <torusGeometry args={[0.6, 0.09, 6, 12, 1.2]} />
          <meshStandardMaterial color={PALETTE.copperDark} emissive={PALETTE.field} emissiveIntensity={field * 0.25} {...METAL} />
        </mesh>
      ))}
      {field > 0.01
        ? [0, 1, 2].map((k) => {
            const p = ((frame * 0.03 + k / 3) % 1) * field;
            return (
              <mesh key={`f${k}`} scale={[1, 1, 1]}>
                <torusGeometry args={[0.4 + 0.9 * p, 0.015, 4, 32]} />
                <meshBasicMaterial color={PALETTE.field} transparent opacity={(1 - p) * 0.8 * field} toneMapped={false} depthWrite={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

// ------------------------------------------------------------------ sinal até a grade
const Signal: React.FC<{ frame: number }> = ({ frame }) => {
  if (!isVisible("signal", frame)) return null;
  const on = clamp(track("signal.on", frame), 0, 1);
  if (on < 0.01) return null;
  const amp = clamp(track("signal.amp", frame), 0, 1);
  const pts = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    const base = new Vector3(lerp(1.4, 0.24, t), lerp(-1.1, -0.05, Math.min(1, t * 1.3)), lerp(-7.0, -5.95, t));
    const w = Math.sin(t * 22 - frame * 0.5) * (0.04 + 0.08 * amp);
    return base.add(new Vector3(0, w, 0));
  });
  const curve = new CatmullRomCurve3(pts);
  return (
    <mesh>
      <tubeGeometry args={[curve, 80, 0.025, 5, false]} />
      <meshBasicMaterial color={PALETTE.signal} transparent opacity={on} toneMapped={false} />
    </mesh>
  );
};

// ------------------------------------------------------------------ fósforo RGB e máscara
const TRIAD_DX = 0.045;
const TRIAD_DY = 0.039;
const TRIAD_C: Vec3 = [0.6, 0.4, 0];
const DOT_OFF: [number, number][] = [
  [-0.013, -0.0075],
  [0.013, -0.0075],
  [0, 0.015],
];
const TRIADS = (() => {
  const out: { x: number; y: number; ch: number }[] = [];
  for (let r = -9; r <= 9; r++)
    for (let c = -11; c <= 11; c++) {
      const x = TRIAD_C[0] + c * TRIAD_DX + (r % 2 ? TRIAD_DX / 2 : 0);
      const y = TRIAD_C[1] + r * TRIAD_DY;
      DOT_OFF.forEach((d, ch) => out.push({ x: x + d[0], y: y + d[1], ch }));
    }
  return out;
})();
const CH_COLORS = [new Color(PALETTE.red), new Color(PALETTE.green), new Color(PALETTE.blue)];

const Triads: React.FC<{ frame: number }> = ({ frame }) => {
  const ref = useRef<InstancedMesh>(null);
  const show = isVisible("triads", frame) ? clamp(track("triads.show", frame), 0, 1) : 0;
  const fadeOut = 1 - clamp(track("screen.color", frame), 0, 1);
  const thr = [0.02, 0.4, 0.8];
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    const col = new Color();
    TRIADS.forEach((t, i) => {
      const a = clamp((show - thr[t.ch]) / 0.12, 0, 1) * fadeOut;
      o.position.set(t.x, t.y, PHOSPHOR_Z + 0.004);
      o.scale.setScalar(Math.max(1e-4, a));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      const tw = 0.55 + 0.45 * Math.sin(i * 1.7 + frame * 0.25);
      m.setColorAt(i, col.copy(CH_COLORS[t.ch]).multiplyScalar(tw));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  if (show < 0.01 || fadeOut < 0.01) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, TRIADS.length]}>
      <circleGeometry args={[0.0105, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

const useMaskTexture = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#8d949c";
    g.fillRect(0, 0, 64, 64);
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.arc(32, 32, 13, 0, Math.PI * 2);
    g.fill();
    const t = new CanvasTexture(c);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(SCREEN_W / TRIAD_DX, SCREEN_H / TRIAD_DY);
    // alinha um furo com a tríade central (0,6; 0,4)
    t.offset.set(0.5 - (((TRIAD_C[0] + SCREEN_W / 2) / TRIAD_DX) % 1), 0.5 - (((TRIAD_C[1] + SCREEN_H / 2) / TRIAD_DY) % 1));
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);

const Mask: React.FC<{ frame: number }> = ({ frame }) => {
  const tex = useMaskTexture();
  const inst = track("mask.install", frame);
  if (inst < 0.01) return null;
  return (
    <mesh position={[0, (1 - Math.min(1, inst)) * 3.6, -0.25]}>
      <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      <meshStandardMaterial map={tex} alphaTest={0.5} side={DoubleSide} {...METAL} />
    </mesh>
  );
};

/** Close da convergência (cena 14): três feixes, furo da máscara e a cor certa (ou errada). */
const Convergence: React.FC<{ frame: number }> = ({ frame }) => {
  const sc = sceneAt(frame);
  if (sc.id !== "scene-14-mascara") return null;
  const local = frame - sc.startFrame;
  const vis = 1 - clamp((local - (sc.durationInFrames - 34)) / 14, 0, 1);
  if (vis < 0.01) return null;
  const mask = clamp(track("mask.install", frame), 0, 1);
  const wrong = clamp(track("wrongHit.show", frame), 0, 1);
  const right = clamp(track("rightHits.show", frame), 0, 1);
  const hole: Vec3 = [TRIAD_C[0], TRIAD_C[1], -0.25];
  const dots: Vec3[] = DOT_OFF.map((d) => [TRIAD_C[0] + d[0], TRIAD_C[1] + d[1], PHOSPHOR_Z + 0.006]);
  const far = (-1.7 - hole[2]) / (dots[0][2] - hole[2]);
  const usingMask = mask > 0.5;
  return (
    <group>
      {DOT_OFF.map((_, i) => {
        const dot = dots[i];
        const src: Vec3 = [hole[0] + (dot[0] - hole[0]) * far, hole[1] + (dot[1] - hole[1]) * far, -1.7];
        let target = dot;
        if (!usingMask && i === 0) target = dots[1];
        const lit = usingMask ? right : i === 0 ? wrong : 0.6;
        return (
          <group key={i}>
            <Segment a={src} b={usingMask ? hole : target} radius={0.006} color={BEAM_COLORS[i]} opacity={vis} />
            {usingMask ? <Segment a={hole} b={target} radius={0.006} color={BEAM_COLORS[i]} opacity={vis} /> : null}
            <mesh position={target}>
              <sphereGeometry args={[0.016 * (0.6 + 0.8 * lit), 10, 8]} />
              <meshBasicMaterial color={!usingMask && i === 0 ? PALETTE.green : BEAM_COLORS[i]} transparent opacity={vis * (0.3 + 0.7 * lit)} toneMapped={false} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ mundo
export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const cv = useScreenCanvases();
  paintScreen(cv, frame);
  return (
    <group>
      <Room frame={frame} />
      <Cabinet frame={frame} />
      <Tube frame={frame} cv={cv} />
      <Gun frame={frame} />
      <Electrons frame={frame} />
      <Beams frame={frame} />
      <Yoke frame={frame} />
      <Signal frame={frame} />
      <Triads frame={frame} />
      <Mask frame={frame} />
      <Convergence frame={frame} />
    </group>
  );
};
