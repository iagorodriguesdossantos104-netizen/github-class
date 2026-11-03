# Contrato de dados: VideoConfig / ScenePlan

O `scene-plan.ts` da Fase 1 usa exatamente os tipos de `assets/template/src/data/scenes.ts`. Na Fase 2
ele vira esse arquivo sem tradução: os componentes leem tudo daqui.

## Regras

- **Frames.** `startFrame` é global; `durationInFrames` é inteiro. Tudo dentro da cena (animações,
  badges, legendas, câmera, áudio) usa **frames locais**. Intervalos semiabertos [início, fim).
  As cenas são contíguas, começam em 0 e somam `VIDEO.durationInFrames` — o arquivo verifica isso ao
  ser importado e lança erro se não bater.
- **Cortes.** Antes do TTS: `PLANNED_SECONDS` em `utils/timing.ts` (vindos da tabela). Depois do TTS:
  derivados da duração real das falas (`SCENE_FRAMES`). Escreva os frames da cena com `sc(i).from` /
  `sc(i).durationInFrames` e os momentos com `s(segundos)` ou `W("s3", 9)` (frame local em que a 10ª
  palavra da fala s3 começa) — assim o plano continua válido quando a voz real chegar.
- **Uma fala por cena** (`voKey` = "s1", "s2"...), na ordem das cenas.
- **Objetos persistentes.** `objects` lista os ids estáveis do sistema (o mesmo id em todas as cenas
  em que aparece) com `visible` e o estado narrativo no início/fim do plano. O mundo 3D monta/desmonta
  pelo `visible`; o movimento vem das trilhas.
- **Trilhas de animação.** `target` = "objeto.propriedade" (ex.: `drill.depth`, `water.level`,
  `pump.on`; badges têm campo próprio). Para o mesmo alvo, as entradas de várias cenas
  formam uma trilha contínua: antes da 1ª vale o `from` dela; depois da última, o `to`; `from` omitido
  continua do `to` anterior. `type` é `interpolate` (com `easing`: linear | inOut | out | in | soft) ou
  `spring` (com `damping`; dê ≥ 30 frames de janela). Declare a `unit`: `u3d` (unidades do mundo),
  `px`, `deg`, `rad` ou `0-1`.
- **Badges.** `variant`: negative = problema (✖ vermelho), positive = solução (✔ verde), info = termo
  ou neutro, warning = pergunta/atenção (`icon: "?"` para interrogação). `appearAt`/`disappearAt`
  locais; `slot` left/right só em tela dividida; `size: "large"` para o título final.
- **Legendas.** `captions` são blocos provisórios; depois do TTS as legendas saem palavra a palavra
  de `vo.json`. `highlights` lista as palavras-chave em MAIÚSCULAS sem pontuação ("AQUÍFEROS").
- **Áudio.** `audioCues` com `kind` narration/sfx, `src` em `public/`, `at` local, `volume` e
  `status` planned/ready. Só "ready" toca — nunca afirme que um arquivo existe antes de gerá-lo.
- **Câmera.** `keys[0]` é a pose inicial; inclua uma chave no último frame igual à primeira da cena
  seguinte (continuidade). Escreva poses com `orbit(alvo, distância, azimute°, elevação°)`.

## Tipos

```ts
export type VideoConfig = { width: number; height: number; fps: number; durationInFrames: number; theme: string; language: string };
export type BadgeVariant = "positive" | "negative" | "info" | "warning";
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };
export type CameraPlan = {
  projection: "perspective" | "orthographic";
  movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split" | "hold";
  keys: CameraKey[];
};
export type SceneObject = { id: string; type: string; visible: boolean; state?: { start: string; end: string } };
export type TrackAnimation = {
  type: "interpolate" | "spring"; target: string; startFrame: number; endFrame: number;
  from?: number; to?: number; easing?: EaseName; damping?: number; unit?: "u3d" | "px" | "deg" | "rad" | "0-1";
};
export type SceneBadge = {
  text: string; variant: BadgeVariant; appearAt: number; disappearAt?: number;
  subtitle?: string; slot?: "center" | "left" | "right"; icon?: "?"; size?: "normal" | "large";
};
export type CaptionBlock = { text: string; from: number; to: number };
export type AudioCue = { kind: "narration" | "sfx"; src: string; at: number; volume: number; status: "planned" | "ready" };
export type ScenePlan = {
  id: string; startFrame: number; durationInFrames: number; voKey: VoKey; narration: string;
  camera: CameraPlan; objects: SceneObject[]; animations: TrackAnimation[]; badges: SceneBadge[];
  highlights: string[]; captions: CaptionBlock[]; audioCues: AudioCue[];
};
```

## Da tabela para os dados

| Coluna da tabela | Campo(s) |
| --- | --- |
| Timestamp / Quadro | `startFrame`, `durationInFrames` (via `PLANNED_SECONDS` → `SCENE_FRAMES`) |
| Narração | `narration` + `scripts/narration.json` (`voKey` → texto) |
| Descrição da Cena & Câmera | `camera` (movement + keys) |
| Props & Elementos 3D/2D | `objects` (ids estáveis, visible, estado início/fim) |
| Animações & Transições | `animations` (alvo.prop, from/to, frames locais, tipo, unit) |
| Badges & Textos | `badges`, `highlights`, `captions` |
| (Fase 1, seção 4) | `audioCues` |

## Exemplo de uma cena preenchida

Cena de perfuração do exemplo do poço (frames locais; `W` amarra ao momento da palavra):

```ts
{
  id: "scene-03-drilling",
  startFrame: sc(2).from,
  durationInFrames: sc(2).durationInFrames,
  voKey: "s3",
  narration: "Mas a água está lá embaixo! Então uma máquina perfura o solo até alcançar a camada certa.",
  camera: {
    projection: "perspective",
    movement: "vertical",
    keys: [
      key(0, P.aquiferClose),
      key(s(0.9), orbit([1.5, -1.0, 1.2], 21, 18, 10)),          // superfície + aquífero no mesmo quadro
      key(s(2.6), orbit([1.9, 0.5, 1.2], 15, 24, 16), "soft"),   // a máquina chega
      key(s(4.3), orbit([1.0, -1.6, 1.6], 12, 16, 6), "linear"), // acompanha a broca descendo
      key(end(2), P.drillBottom, "soft"),
    ],
  },
  objects: [
    { id: "terrain", type: "corte-geologico", visible: true },
    { id: "rig", type: "perfuratriz", visible: true, state: { start: "fora de cena", end: "perfurando" } },
    { id: "bore", type: "furo", visible: true, state: { start: "inexistente", end: "atinge o aquífero" } },
    { id: "depthGuide", type: "guia-2d3d", visible: true },
  ],
  animations: [
    { type: "spring", target: "rig.drop", startFrame: W("s3", 8) - s(0.55), endFrame: W("s3", 8) + s(0.9), from: 0, to: 1, damping: 10, unit: "0-1" },
    { type: "interpolate", target: "rig.mast", startFrame: W("s3", 8), endFrame: W("s3", 9) + 2, from: 0, to: 1, easing: "out", unit: "0-1" },
    { type: "interpolate", target: "drill.depth", startFrame: W("s3", 9) + 2, endFrame: s(4.65), from: 0, to: -2.55, easing: "linear", unit: "u3d" },
  ],
  badges: [
    { text: "ÁGUA INACESSÍVEL", variant: "negative", appearAt: W("s3", 4), disappearAt: W("s3", 9) - 3 },
    { text: "PERFURAÇÃO", variant: "positive", appearAt: W("s3", 9), disappearAt: end(2) - 4 },
  ],
  highlights: ["ÁGUA", "EMBAIXO", "MÁQUINA", "PERFURA", "CAMADA"],
  captions: [{ text: "Mas a água está lá embaixo!", from: voLocal("s3"), to: s(1.6) }],
  audioCues: [
    narration("s3", "planned"),
    sfx("thud", W("s3", 8) - s(0.3), 0.36),
    sfx("drill", W("s3", 9), 0.26),
  ],
}
```

O exemplo completo (8 cenas, formato anterior com `visibleObjects`/`audio` em vez de `objects`/
`audioCues`, mesma lógica) está em `examples/poco-artesiano/src/data/scenes.ts`.
