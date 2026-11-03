# Pipeline da Fase 2 — do roteiro aprovado ao MP4

Testado em Windows 11 + RTX (GPU) + Node 24 + Python 3.14 + ffmpeg, Remotion 4.0.5xx, three 0.186,
@react-three/fiber 9, React 19. Ajuste à versão instalada; na dúvida, consulte a doc oficial
(`references/remotion/remotion-docs/REFERENCE.md` explica a busca).

## Sumário
1. Preparar o projeto
2. Narração e tempos
3. Dados, mundo e cenas
4. Câmera e enquadramento vertical
5. Badges, legendas e rótulos
6. Efeitos e trilha
7. Ciclo de revisão por stills
8. Render, medição e entrega
9. Armadilhas já resolvidas

---

## 1. Preparar o projeto

```bash
npx create-video@latest --yes --blank --no-tailwind <pasta-do-tema>
cd <pasta-do-tema>
npm i
npx remotion add @remotion/three @remotion/media @remotion/google-fonts @remotion/renderer @remotion/bundler
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
```

- `remotion.config.ts`: acrescente `Config.setChromiumOpenGlRenderer("angle")` (Three.js não renderiza
  no GL padrão do Chrome headless; `angle` usa a GPU). O template já traz isso.
- Copie `assets/template/remotion.config.ts` e `assets/template/src/*` sobre o scaffold (apague o
  `Composition.tsx` do scaffold) e `scripts/*` para `<projeto>/scripts/`.
- `tsconfig.json` do scaffold já tem `resolveJsonModule` (o template importa `src/data/vo.json`).
- Python: `numpy scipy soundfile pillow` (+ `edge-tts` se for usar TTS gratuito). ffmpeg/ffprobe no PATH.
- Credenciais: ElevenLabs lê `ELEVENLABS_API_KEY` de `<projeto>/.env` (mantenha `.env` no `.gitignore`;
  nunca imprima a chave). Sem chave/autorização, use `--provider edge`.
- **Studio cedo**: `npx remotion studio --no-open --port <porta>` (ou via `.claude/launch.json` +
  preview do app) e abra `http://localhost:<porta>/<IdDaComposição>` para o usuário acompanhar.

Estrutura resultante (a pedida pelos briefings típicos):

```
src/
├── Root.tsx               registra a composição (1080×1920, 30 fps, SECONDS×30 frames)
├── MainSequence.tsx       orquestra pelo array de cenas
├── theme.ts               paleta, materiais, luz, câmera, áreas seguras, cores de palavras-chave
├── data/scenes.ts         contrato + 8 cenas + track()/isVisible() + checagem de integridade
├── data/vo.json           gerado por scripts/prepare_vo.py
├── components/            CameraController, World, TechnicalBadge, AnimatedCaptions, WorldLabel, Arrow3D,
│                          Lighting, Background + componentes do tema (TerrainCrossSection, ...)
├── scenes/                um módulo por cena: { Stage?: 3D extra, Overlay?: 2D }
├── audio/Soundtrack.tsx   narração + efeitos (status "ready") + trilha com ducking
└── utils/                 animation.ts (trilhas, easing, orbit, random), timing.ts (cortes pela voz)
```

## 2. Narração e tempos

1. No projeto, crie `scripts/narration.json` a partir de `scripts/narration.example.json`
   (`{"s1": "...", ...}`, uma fala por cena, texto aprovado, UTF-8).
2. Gere: `python scripts/voiceover.py --lines scripts/narration.json --voice <id>`
   (ElevenLabs `eleven_multilingual_v2` com `/with-timestamps`; voz masculina enérgica testada:
   "Liam" `TX3LPaxmHKxFdv7VOQHJ`; "Brian" `nPczCjzI2devNBz1zQrb` é mais grave/calma), ou
   `--provider edge --voice pt-BR-AntonioNeural` (masculina) / `pt-BR-ThalitaMultilingualNeural`.
3. `python scripts/prepare_vo.py` → normaliza (−17 dB RMS), apara silêncio, grava `public/audio/vo/sX.wav`
   e `src/data/vo.json` com duração e palavras (tempos relativos ao áudio aparado).
4. Some as durações: fala total + pausas (0,5–0,7 s entre falas) + ~0,45 s de abertura + ≥ 0,8 s de
   respiro final deve caber na duração. Se não couber: primeiro encurte o texto (exige aprovação se
   mudar conteúdo), depois suba a velocidade com moderação (ElevenLabs `--speed` ≤ ~1,12).
5. Em `utils/timing.ts`: preencha `VO_KEYS`, `SECONDS`, `PLANNED_SECONDS`, `GAPS`. Com `vo.json`
   completo, `SCENE_FRAMES` passa a vir da voz; mude o status dos cues de narração para `"ready"`.
6. Amarre ações à fala: `W("s5", 18)` = frame local de "jorrar". Liste as palavras com índices:
   `python -c "import json;d=json.load(open('src/data/vo.json',encoding='utf-8'));[print(k,[(i,w['text']) for i,w in enumerate(v['words'])]) for k,v in d.items()]"`.

## 3. Dados, mundo e cenas

- `data/scenes.ts`: as cenas aprovadas. `track("alvo.prop", frameGlobal)` avalia a trilha; o mesmo
  alvo pode ter entradas em várias cenas (ex.: `jet` sobe na cena 5 e é fechado na cena 7).
- `components/World.tsx`: **um** mundo persistente lendo trilhas no frame global → continuidade total
  entre cortes. Monte/desmonte por `isVisible(id, frame)`.
- `scenes/*.tsx`: `Stage` (dentro do canvas, via `<Sequence layout="none">`) para extras 3D só daquela
  cena (chuva, guias, cascalho); `Overlay` para rótulos 2D, telas divididas etc. Lá dentro
  `useCurrentFrame()` é local: some `scene.startFrame` para ler trilhas.
- Efeitos que precisam sumir *depois* do corte (fade-out que cruza a fronteira) devem morar no
  `World`, não no `Stage` da cena (que desmonta no corte).
- Regras do Remotion 3D (`references/remotion/remotion-markup/3d.md`): `<ThreeCanvas width height>`
  obrigatórios; nada de `useFrame`; animação só por frame; `<Sequence layout="none">` dentro do canvas.
- Aleatoriedade: `random("semente")` do Remotion (template: `rand`, `randRange`).
- Partículas: cada partícula é função pura do frame (fase = semente; posição = f(idade)). Para
  "emitidas" (cascalho, gotas), itere os frames de nascimento dos últimos N frames e calcule a parábola
  pela idade — não acumule estado.

## 4. Câmera e enquadramento vertical

- `CameraController` interpola chaves em coordenadas orbitais (alvo, distância em log, azimute,
  elevação) com easing por segmento e uma deriva lenta (nunca fica parada). Escreva poses com
  `orbit([x,y,z], distância, azimute°, elevação°)`; azimute 0° olha de frente (+z), positivo vem da direita.
- Matemática do quadro com FOV 24° em 1080×1920: altura visível = `0,425 × distância` unidades;
  largura = altura × 0,5625; **px por unidade ≈ 4516 / distância**. Use para posicionar o assunto
  entre os badges (~260–470 px) e as legendas (~1360–1480 px). Ex.: diorama de 10×11 unidades inteiro
  → distância ~54–56.
- Planos de detalhe num corte transversal: **mire o próprio plano de corte** (z do corte). Se o alvo
  ficar atrás do plano, o azimute desloca o objeto para a borda (erro visto: poço colado na lateral).
- Mergulho da abertura: comece acima do chão com um plano de chão contínuo (textura branca com alfa
  radial × cor do material) e desça a câmera abaixo do nível do solo — o plano some (face de trás) e
  o corte aparece; encolha o chão durante a descida. Fundo muda de céu para azul profundo pela altura
  da câmera (`Background.tsx`).
- Toda cena: pelo menos um movimento (dolly-in para descobertas, dolly-out para revelar o sistema,
  vertical acompanhando ação, órbita 10–25°, tracking lateral). A chave final de uma cena = chave
  inicial da próxima.

## 5. Badges, legendas e rótulos

- `BadgeLayer` empilha os badges da cena a partir de `SAFE.badgeTop` (262 px), com entrada spring e
  saída em 8 frames; `slot: left/right` posiciona nas metades da tela dividida (~370 px).
- Larguras: badge 44 px ~31 px/caractere + ~110 px de ícone/padding → até ~24 caracteres cabem em 900 px.
- `AnimatedCaptions`: blocos de até ~17 caracteres, 66 px, contorno 11 px; palavra falada com leve
  zoom; palavras de `highlights` coloridas (`KEYWORD_COLOR` no tema; amarelo para ação, verde para
  solução, vermelho para alerta, ciano padrão).
- `WorldLabel`: projeta um ponto 3D com a mesma pose da câmera do frame e desenha ponto + linha +
  etiqueta. Aceita `\n` para duas linhas (útil em painéis estreitos). Revise sempre: rótulos não podem
  cair atrás de badges, sobre as legendas nem sair da tela durante movimentos de câmera.

## 6. Efeitos e trilha

- `python scripts/sfx.py` → `public/audio/sfx/*.wav`: whoosh(-soft/-big), dive, pop(-high), badge, tick,
  click, buzz, ding, shimmer, glow, final, thud, hydraulic, drill, crumble, clunk, rumble-soft, pressure,
  bubbles, water-rise, gush, rain, flow, fill, pump. Edite/adicione funções para o tema.
- `scripts/music.py` é um **modelo**: troque `DUR`, `S` (início de cada cena = `SCENE_FRAMES/30`) e os
  momentos-chave; reescreva o arranjo com uma intenção por cena. Instrumentos e mixagem reaproveitáveis.
- Volumes de partida (narração = 1): badge 0,24–0,3; whoosh 0,2–0,35; máquinas/motores 0,25; graves
  (pressão, impacto) ≤ 0,3; água 0,2–0,32; trilha 0,5 com ducking para ~0,17 sob a voz.
- Cues com `status: "ready"` só depois que o arquivo existe; `HAS_MUSIC = true` no `Soundtrack` após
  gerar `music.wav`.

## 7. Ciclo de revisão por stills

```bash
node scripts/stills.mjs 0 60 123 200 ...      # out/stills/fNNNN.png (COMP=<Id> se houver várias)
python scripts/sheet.py out/sheet.png         # folha de contato (COLS=6 para mais colunas)
```

Escolha 2–4 frames por cena (início, ação principal, entrada de badge, fim) e frames de transição.
Olhe de fato as imagens e corrija: enquadramento, rótulos atrás de badges, legendas sobre o assunto,
texto cortado, objetos atravessando camadas, frame inicial vazio (comece a primeira spring em frame
negativo para o frame 0 já mostrar algo), continuidade entre cortes.

## 8. Render, medição e entrega

```bash
npx tsc --noEmit && npx eslint src
npx remotion render <Id> out/<nome>-raw.mp4 --gl=angle --concurrency=4 --crf=17
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -show_entries format=duration out/<nome>-raw.mp4
python scripts/audiocheck.py out/<nome>-raw.mp4      # pico e RMS por segundo
python scripts/loudnorm.py out/<nome>-raw.mp4 out/<nome>.mp4
```

- Render de 45 s em GPU (RTX, concurrency 4) leva poucos minutos; rode em segundo plano.
- Picos perto de 0 dBFS = efeitos fortes demais somados à voz: reduza volumes nos dados, renderize só
  o áudio (`npx remotion render <Id> out/audio.wav --codec=wav`) e remonte sem reprocessar o vídeo:
  `ffmpeg -i out/<nome>-raw.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest out/<nome>-raw2.mp4`.
- Extraia frames do MP4 final (`ffmpeg -ss <t> -i out/<nome>.mp4 -frames:v 1 ...`) e confira que
  bate com os stills (telas divididas com vários canvas, fades).
- Entregue: caminho do MP4, projeto, roteiro aprovado, comando de render; duração/resolução/fps medidos,
  loudness, verificações feitas e o que não pôde ser verificado (o agente não ouve o áudio).

## 9. Armadilhas já resolvidas

- **Acentos corrompidos no Windows**: `Get-Content`/`Set-Content` do PowerShell 5.1 leem UTF-8 como
  ANSI — o texto da narração virou "Ã©" e foi enviado assim ao TTS. Edite arquivos com a ferramenta de
  edição ou `[IO.File]::ReadAllText/WriteAllText` com UTF-8 sem BOM; Python com `encoding="utf-8"`;
  JSON lido com `utf-8-sig` tolera BOM. Em `python -c` dentro do PowerShell, chaves `{}` quebram — use
  um arquivo `.py`.
- **ThreeCanvas e câmera**: aplique a pose em `useLayoutEffect` (roda antes do `advance()` que o
  `ThreeCanvas` dispara no `useEffect`); a pose é função pura do frame, reutilizada para projetar rótulos.
- **Sombras**: three ≥ 0.18x removeu `PCFSoftShadowMap`; use `shadows="percentage"` no canvas.
- **Cores com `flat`** (sem tone mapping) ficam fiéis ao hex; luz-chave ~2,5, hemisfério ~1, ambiente ~0,5.
- **Textura × cor**: um `map` colorido multiplica a cor do material (fica escuro). Para máscaras de
  alfa use textura branca e a cor no material.
- **Rótulo/badge sobrepostos** e **assunto atrás da legenda**: calcule em px (seção 4) e confira em stills.
- **Grão/pedrisco na faixa do furo**: objetos colados no plano de corte precisam sumir quando o rasgo
  passa por eles (filtre pela profundidade atual).
- **`spring` no fim da janela**: a trilha assume `to` no `endFrame`; dê janela suficiente.
- **Tela dividida**: dois `ThreeCanvas` estreitos (532×1920) com câmeras próprias; o canvas principal
  continua por baixo para as transições de entrada/saída. Em 9:16 os painéis são estreitos: aproxime a
  câmera e use rótulos de duas linhas.
- **argparse**: `%` em `help=` precisa ser `%%`.
