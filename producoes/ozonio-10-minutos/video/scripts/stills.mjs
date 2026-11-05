// Renderiza frames específicos como PNG para revisão (um único bundle, GPU via ANGLE).
// Rode a partir da raiz do projeto Remotion:
//   node scripts/stills.mjs 0 60 150 ...            -> out/stills/f0000.png ...
//   node scripts/stills.mjs 9999                     -> render COMPLETO (MP4) com log em logs/render-*.txt
// Variáveis opcionais: COMP=<id da composição> (padrão: a primeira), SCALE=0.5, ENTRY=src/index.ts
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import path from "node:path";

const args = process.argv.slice(2).map(Number);
const full = args.length === 1 && args[0] === 9999;
mkdirSync("logs", { recursive: true });
const log = (m) => appendFileSync("logs/render-log.txt", `${new Date().toISOString()} ${m}\n`);

try {
  const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY ?? "src/index.ts") });
  const port = Number(process.env.PORT ?? 3124);
  const chromiumOptions = { gl: "angle" };
  const comps = await getCompositions(serveUrl, { port, chromiumOptions });
  const composition = process.env.COMP ? comps.find((c) => c.id === process.env.COMP) : comps[0];
  if (!composition) throw new Error(`Composição não encontrada: ${process.env.COMP}`);

  if (full) {
    writeFileSync("logs/render-log.txt", "");
    mkdirSync("out", { recursive: true });
    log(`render ${composition.id} ${composition.durationInFrames} frames`);
    let last = -1;
    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      crf: 17,
      audioCodec: "aac",
      concurrency: Number(process.env.CONC ?? Math.max(1, Math.min(4, cpus().length))),
      outputLocation: path.resolve("out/ozonio-raw.mp4"),
      port,
      chromiumOptions,
      imageFormat: "jpeg",
      onProgress: ({ progress, renderedFrames, encodedFrames, stitchStage }) => {
        const pct = Math.floor(progress * 100);
        if (pct !== last) {
          last = pct;
          writeFileSync("logs/render-progress.txt", `${pct}% renderizados=${renderedFrames} codificados=${encodedFrames} etapa=${stitchStage}\n`);
        }
      },
    });
    log("render OK");
    let py = process.env.PY ?? "py";
    try {
      execFileSync(py, ["--version"]);
    } catch {
      py = "python";
    }
    execFileSync(py, ["scripts/loudnorm.py", "out/ozonio-raw.mp4", "out/ozonio.mp4"], { stdio: "inherit" });
    log("loudnorm OK");
    const probe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames", "-show_entries", "format=duration", "out/ozonio.mp4"]).toString();
    writeFileSync("logs/ffprobe.txt", probe);
    writeFileSync("logs/audiocheck.txt", execFileSync(py, ["scripts/audiocheck.py", "out/ozonio.mp4"]).toString());
    for (const t of [4, 20, 45, 70, 86]) {
      execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(t), "-i", "out/ozonio.mp4", "-frames:v", "1", "-vf", "scale=540:-1", `out/check-${t}.png`]);
    }
    log("FINAL OK");
  } else {
    const outDir = path.resolve("out/stills");
    mkdirSync(outDir, { recursive: true });
    // logs/comp.txt (ex.: "TvThumb,TvThumbWide") troca as composições e renderiza em escala 1 (thumbnails)
    const extra = existsSync("logs/comp.txt") ? readFileSync("logs/comp.txt", "utf8").trim() : "";
    const targets = extra ? extra.split(",").map((id) => comps.find((c) => c.id === id.trim())).filter(Boolean) : [composition];
    for (const comp of targets) {
      for (const fr of args) {
        const frame = Math.min(comp.durationInFrames - 1, fr);
        const name = extra ? `${comp.id}-f${String(frame).padStart(4, "0")}.png` : `f${String(frame).padStart(4, "0")}.png`;
        const output = path.join(outDir, name);
        await renderStill({ serveUrl, composition: comp, frame, output, scale: extra ? 1 : Number(process.env.SCALE ?? 0.5), port, chromiumOptions });
        console.log(output);
      }
    }
  }
} catch (e) {
  log(`ERRO: ${e?.stack ?? e}`);
  console.error(e);
  process.exit(1);
}
