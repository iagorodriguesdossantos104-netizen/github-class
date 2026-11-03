import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { aquiferBottomAt, aquiferTopAt, clayTopAt, SITE, surfaceAt, WELL, ZF } from "../utils/geology";
import type { SceneModule, SceneProps } from "./types";

// 00:41 — Dolly-out até o diorama completo, com cada parte identificada e o aquífero brilhando.

const LABELS: { point: Vec3; text: string; offset: [number, number]; accent: string }[] = [
  { point: [-4.4, surfaceAt(-4.4) + 0.05, ZF - 0.3], text: "RECARGA", offset: [60, -120], accent: PALETTE.waterBright },
  { point: [-1.4, (clayTopAt(-1.4) + aquiferTopAt(-1.4)) / 2, ZF], text: "POUCO PERMEÁVEL", offset: [-40, -170], accent: "#ffcf73" },
  { point: [-2.4, (aquiferTopAt(-2.4) + aquiferBottomAt(-2.4)) / 2, ZF], text: "AQUÍFERO CONFINADO", offset: [80, 250], accent: PALETTE.waterBright },
  { point: [WELL.x, -1.2, ZF], text: "POÇO", offset: [170, 180], accent: PALETTE.pipe },
  { point: [SITE.tank.x, SITE.tank.standH + SITE.tank.h + 0.2, SITE.tank.z], text: "RESERVATÓRIO", offset: [10, -150], accent: PALETTE.tank },
];

const Overlay: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const pose = cameraPoseAt(frame);
  const appear = track("final.labels", frame);
  return (
    <>
      {LABELS.map((l, i) => (
        <WorldLabel key={l.text} pose={pose} point={l.point} text={l.text} appear={clamp(appear * 2.2 - i * 0.3, 0, 1)} offset={l.offset} accent={l.accent} size={34} />
      ))}
    </>
  );
};

export const FinalScene: SceneModule = { Overlay };
