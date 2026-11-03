# Como funciona um poço artesiano? — Short 3D low-poly

Vídeo educativo vertical (1080×1920, 30 fps, 45 s = 1350 frames) feito com Remotion + React Three Fiber.
Composição: `PocoArtesiano`. Saída final: `out/poco-artesiano.mp4`.

## Comandos

```console
npm i
npm run dev                                   # Studio (o launch.json da pasta-mãe usa a porta 3020)
node scripts/stills.mjs 0 300 900             # frames soltos em out/stills (GPU/ANGLE)
npx remotion render PocoArtesiano out/poco-artesiano-raw.mp4 --gl=angle --concurrency=4 --crf=17
python scripts/loudnorm.py out/poco-artesiano-raw.mp4 out/poco-artesiano.mp4
```

## Como está organizado

- `src/data/scenes.ts` — **o roteiro como dados**: as 8 cenas (`SceneConfig[]`) com câmera, objetos
  visíveis, trilhas de animação (`interpolate`/`spring`), badges, palavras-chave da legenda e áudio.
  Frames das animações/badges/efeitos são locais à cena; `startFrame` é global. Ao importar, o arquivo
  verifica que as cenas são contíguas e somam 1350 frames.
- `src/utils/timing.ts` — os cortes das cenas saem da duração real da narração (cada fala começa
  0,25 s depois do corte da sua cena). `wordLocal("s5", 18)` = frame em que "jorrar" é dito.
- `src/MainSequence.tsx` — monta tudo a partir do array: um único `ThreeCanvas` com o diorama
  persistente (`components/World.tsx`) + extras 3D de cada cena, e por cima as camadas 2D,
  badges (`TechnicalBadge`), legendas (`AnimatedCaptions`) e áudio.
- `src/utils/geology.ts` — modelo científico do corte: camadas inclinadas, aquífero aflorando no
  morro (recarga), confinado entre argila e rocha; nível potenciométrico; geometria do poço.
- `src/components/` — terreno, camadas, aquífero (grãos + água nos poros + fraturas), perfuratriz,
  poço (revestimento, filtro, pré-filtro, selo sanitário, laje, tampa), água (coluna, jorro, tubos),
  bomba submersa, caixa d'água, câmera, badges, legendas, rótulos ancorados no 3D.
- `src/scenes/` — o que é específico de cada cena (chuva/recarga, guia de profundidade, tela dividida...).
- `src/theme.ts` — paleta, materiais, luz, câmera e áreas seguras centralizados.

## Áudio

- Narração: ElevenLabs `eleven_multilingual_v2`, voz masculina "Liam" (`TX3LPaxmHKxFdv7VOQHJ`), speed 1.12.
  `python scripts/voiceover.py <voice_id>` → `python scripts/prepare_vo.py` (normaliza, apara e gera `src/data/vo.json`).
  A chave fica em `.env` (`ELEVENLABS_API_KEY`), fora do git.
- Trilha e efeitos sintetizados por código (`scripts/music.py`, `scripts/sfx.py`), sem samples.
  Se a narração mudar, atualize os tempos-chave no topo de `scripts/music.py` (vêm de `timing.ts`).

## Precisão científica (o que o vídeo mostra)

- Aquífero = arenito com água nos poros entre os grãos (e água nas fraturas da rocha cristalina), não um lago.
- A pressão vem do confinamento entre camadas pouco permeáveis + recarga em cota mais alta (morro).
- A água sobe até o nível de pressão; só jorra quando esse nível fica acima do solo ("poço jorrante",
  apresentado como possibilidade). Na comparação, o mesmo perfil com nível abaixo do solo precisa de bomba.
- Esquema construtivo com revestimento, filtro, pré-filtro, cimentação do espaço anelar (selo sanitário)
  e laje de proteção. Nenhuma profundidade ou vazão numérica é afirmada.
