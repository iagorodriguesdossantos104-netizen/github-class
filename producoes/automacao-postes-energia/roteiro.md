# Roteiro v1 — Como funciona a automação dos postes de energia?

> Origem: gerado pela skill `remotion-problem-resolve-video` (Fase 1) a partir do pedido
> "como funciona automatização dos postes de energia". **AGUARDANDO APROVAÇÃO.**
> Convenção: timestamps MM:SS:FF a 30 fps (FF 00–29); frames em intervalo semiaberto [início, fim) —
> o frame final de uma linha é o primeiro da próxima. Total: 90 s = 2700 frames (0 a 2699).
> Tempos e frames locais de palavras são **estimativas** (~155 palavras/min) até existir o áudio real.

## 1. Briefing de produção

- **Tema / recorte técnico:** automação da **rede aérea de distribuição de média tensão** (os fios dos
  postes de rua): disjuntor na subestação → religador automático no poste → chaves automáticas que
  seccionam a linha em trechos → chave normalmente aberta (NA) de interligação com um circuito vizinho →
  sensores + comunicação + centro de operação → lógica *self-healing* (rede autorregenerativa).
  Fora do recorte: iluminação pública (relé fotoelétrico), medição inteligente e transmissão em alta tensão.
- **Sistema construído diante do espectador:** uma mesma rua-maquete com subestação à esquerda, 8 postes,
  7 casas e um circuito vizinho à direita. Cada problema acrescenta um equipamento que **fica instalado**.
- **Cadeia de problemas:** curto por galho → disjuntor apaga tudo → falha era passageira (religador) →
  falha permanente apaga todo o resto da linha (chaves de seccionamento) → casas sãs depois do defeito
  ainda sem luz (chave NA / circuito vizinho) → quem coordena? (sensores, rádio, centro de operação,
  software = self-healing) → equipe vai só ao ponto do defeito.
- **Público / objetivo:** leigo; entender por que a luz às vezes "pisca e volta" e como a rede isola um
  defeito e devolve energia ao resto sem esperar a equipe chegar.
- **Formato:** 90 s, 1080 × 1920 (9:16), 30 fps, 2700 frames, pt-BR.
- **Tom:** narração didática, informal e ágil, segunda pessoa, frases curtas.
- **Voz / TTS planejado:** **edge-tts** (gratuito), voz `pt-BR-AntonioNeural`, rate +8 %. Nenhum serviço
  pago será usado sem nova autorização (ElevenLabs só se você pedir explicitamente).
- **Direção de arte:** diorama low-poly fosco (`flatShading`) ao **entardecer**: céu degradê
  laranja→lilás; quando a rede apaga, o fundo escurece para azul-noite e as janelas apagadas ficam
  cinza-azuladas, o que torna "com luz / sem luz" legível no celular. Postes de concreto cinza, cruzetas,
  3 fios de média tensão; **energia = partículas amarelas** correndo pelos fios; **defeito = faíscas
  vermelhas**; equipamentos: disjuntor (caixa cinza na subestação), religador (cilindro cinza com
  "olho" LED verde/vermelho), chaves (lâmina articulada), chave NA (lâmina aberta com anel amarelo).
  Ondas de rádio = arcos ciano. Centro de operação = prédio baixo com antena e telão.
- **Representação esquemática:** a rede é simplificada (um alimentador, 3 fios, poucos postes);
  distâncias e tempos não estão em escala. O disjuntor da subestação, na prática, também costuma ter
  função de religamento; aqui ele aparece só "desligando" para mostrar a necessidade do religador no
  meio da linha. Indicamos isso com o subtítulo "Esquema simplificado" no badge final.
- **Camadas:** 3D real com `@remotion/three` (R3F/Three.js) para o diorama; 2D (HTML/CSS no Remotion)
  para badges, legendas e rótulos ancorados em pontos 3D. Nada de 2.5D.

### Mapa do diorama (coordenadas do mundo, u3d; rua ao longo de x, fios a y≈4,2)

| Id | Posição | Trecho |
| --- | --- | --- |
| `substation` (+ `breaker`) | x=−9,5 | origem |
| `pole1`…`pole8` | x = −7, −5, −3, −1, 1, 3, 5, 7 | — |
| `house1`, `house2` | x=−6, −4 | **segA** (subestação → religador) |
| `recloser` | no `pole3` (x=−3) | divisa A/B |
| `branch` (galho) | entre x=−2,4 e −1,6 | segB |
| `house3`, `house4` | x=−2, 0 | **segB** (religador → chave 1) |
| `switch1` | no `pole5` (x=1) | divisa B/C |
| `tree` + `house5` | árvore em x=2, casa em x=2,2 (z=+2,5) | **segC** (trecho defeituoso) |
| `switch2` | no `pole6` (x=3) | divisa C/D |
| `house6`, `house7` | x=4, 6 | **segD** |
| `tieSwitch` (NA) | no `pole8` (x=7) | divisa D / vizinho |
| `neighborLine` + `neighborSub` | x=7 → 12 | circuito vizinho |
| `cod` (centro de operação) | (−1, 0, −9) | fundo |
| `truck` (equipe) | entra pela rua em z=+3 | — |

Trilhas de energia: `segA.power`, `segB.power`, `segC.power`, `segD.power`, `neighbor.power` (0–1)
controlam ao mesmo tempo partículas nos fios, janelas das casas e o "olho" dos equipamentos.

## 2. Tabela cronológica completa

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:08:14 | 0 – 254 | Você aperta o interruptor e a luz acende. Parece que basta um fio, de poste em poste, até a sua casa. | Abre num close da janela da `house3` em corte (orbit alvo [−2;1,2;1,8], d=7, az 20°, el 8°): mão/interruptor 2D-3D aciona e a lâmpada acende. Dolly-out com subida (local 100→240) até a rua inteira (orbit [0;2;0], d=34, az 35°, el 20°), seguindo as partículas de volta, de poste em poste, até a subestação. | Casa `house3` com parede frontal recortada, interruptor e lâmpada; rua, 8 postes, fios, subestação, demais casas acesas; fundo entardecer. | `switch.press` spring 0→1 (local 30–60, damping 12); `bulb.glow` 0→1 interpolate out (local 48–62); `segA/B/C/D.power` já = 1; `wire.flowDir` = 1 (partículas subestação→casas); câmera interpolate soft entre as chaves (local 100→240); `labels.street` 0→1 (local 200–225). | Sem badge até local 150. ℹ **REDE DE DISTRIBUIÇÃO** — "Da subestação até você" (info, local 150→250). Rótulo 3D SUBESTAÇÃO. Highlights: INTERRUPTOR, LUZ, FIO, POSTE, CASA. |
| 00:08:14 – 00:14:22 | 254 – 442 | Só que um galho encosta no fio: curto-circuito! A corrente dispara e pode queimar a rede. | Câmera se aproxima do vão entre `pole3` e `pole4` (orbit [−2;4;0], d=12, az 25°, el 10°); vento balança a árvore da calçada; o galho desce e toca os fios; faíscas; os fios ficam vermelhos e "esquentam" em direção à subestação. Leve tremida de câmera (±0,05 u3d, semeada) no curto. | Árvore de calçada com `branch` articulado; faíscas (partículas vermelhas semeadas); fios com material emissivo. | `branch.drop` interpolate in 0→1 (local 30–55); `arc.fault` spring 0→1 em "curto-circuito" (W("s2",7), damping 8); `wire.heat` 0→1 interpolate linear (local 100–175) propagando de x=−2 até x=−9,5; `cam.shake` 0→1→0 (local 89–110). | ✖ **CURTO-CIRCUITO** (negative, em W("s2",7) ≈ local 89 → fim). Highlights: GALHO, CURTO-CIRCUITO, CORRENTE, QUEIMAR. |
| 00:14:22 – 00:22:02 | 442 – 662 | Por isso, a subestação tem um disjuntor, que sente o excesso de corrente e desliga a linha na hora. | Tracking para a esquerda ao longo dos fios vermelhos até a subestação (orbit [−9,5;2,5;0], d=10, az 30°, el 14°); close do `breaker` em corte mostrando o contato; o contato abre com estalo; câmera recua um pouco e mostra a rua: partículas param, todas as casas apagam. | Subestação com transformador e `breaker` (caixa com tampa transparente e contato móvel), medidor 2D de corrente "ponteiro no vermelho". | Câmera tracking soft (local 0–70); `meter.needle` 0,3→1 interpolate out em "excesso" (W("s3",10)→+15); `breaker.open` spring 0→1 em "desliga" (W("s3",14), damping 14); `arc.fault` 1→0 (W("s3",14)→+6); `wire.heat` 1→0 (W("s3",14)→+20); `segA/B/C/D.power` 1→0 interpolate in (W("s3",14)+2→+14); fundo `sky.dark` 0→0,7. | ℹ **DISJUNTOR** — "Protege a linha" (info, em W("s3",6) ≈ local 77 → local 200). Highlights: DISJUNTOR, EXCESSO, CORRENTE, DESLIGA. |
| 00:22:02 – 00:28:21 | 662 – 861 | Mas o bairro inteiro apagou, e o galho já caiu! A maioria das falhas é passageira assim. | Dolly-out até a rua toda escura (orbit [0;2;0], d=30, az 40°, el 22°), janelas apagadas; câmera desce e se aproxima do `branch`, que escorrega dos fios e cai na calçada (orbit [−2;3;1], d=11, az 20°, el 8°). Os fios ficam intactos. | Rua apagada (fundo azul-noite), `branch` no chão, ponto de interrogação 2D sobre as casas. | Câmera dolly-out (local 0–60) e dolly-in soft (local 95–170); `branch.fall` 0→1 interpolate in em "caiu" (W("s4",9)-10 → +12) com quique spring; `houses.question` spring 0→1 (local 30–60) e 1→0 (local 120–135). | ✖ **BAIRRO SEM LUZ** (negative, local 25→118). ⚠ **FALHA PASSAGEIRA** (warning, icon "?", em W("s4",15) ≈ local 182 → fim). Highlights: BAIRRO, APAGOU, GALHO, CAIU, PASSAGEIRA. |
| 00:28:21 – 00:33:27 | 861 – 1017 | Então entra o religador automático: ele desliga, espera uns segundos e religa sozinho. | Com o disjuntor já refechado (energia volta ao `segA`), o `recloser` sobe e se encaixa no `pole3` (close orbit [−3;4;0,3], d=8, az 30°, el 10°). Replay esquemático: um novo toque do galho (fantasma translúcido) → olho do religador fica vermelho, contato abre; contador 2D "1…2…" de segundos; contato fecha, olho verde. Órbita de 15°. | `recloser` (cilindro com LED), contador 2D, `branchGhost` translúcido, `breaker` fechado. | `breaker.open` 1→0 (local 0–10); `segA.power` 0→1 (local 4–20); `recloser.install` spring 0→1 em "religador" (W("s5",3)-6, damping 11); `branchGhost.touch` 0→1→0 (local 66–80); `recloser.open` 0→1 em "desliga" (W("s5",6), spring damping 14) e 1→0 em "religa" (W("s5",11)); `timer.count` 0→2 interpolate linear (W("s5",7)→W("s5",11)). | ✔ **RELIGADOR AUTOMÁTICO** (positive, em W("s5",3) ≈ local 42 → fim). Highlights: RELIGADOR, AUTOMÁTICO, DESLIGA, ESPERA, RELIGA. |
| 00:33:27 – 00:38:01 | 1017 – 1141 | Defeito sumiu, luz de volta, sem ninguém sair de casa. | Do religador, a câmera recua e acompanha as partículas voltando pela linha (tracking para a direita, orbit [2;2;0], d=24, az 35°, el 18°); janelas acendem casa por casa, em sequência; fundo volta ao entardecer. | Todas as casas, fios, `recloser` com olho verde. | `segB.power` 0→1 (local 15–35), `segC.power` (local 25–45), `segD.power` (local 35–55), todas interpolate out; `windows.stagger` 2 f por casa; `sky.dark` 0,7→0 (local 15–60). | ✔ **ENERGIA RESTABELECIDA** (positive, em W("s6",2) ≈ local 31 → local 120). Highlights: DEFEITO, SUMIU, LUZ, VOLTA. |
| 00:38:01 – 00:44:09 | 1141 – 1329 | Mas, se uma árvore cai sobre o fio, a falha é permanente, e o religador desiste. | Câmera vai ao trecho entre `pole5` e `pole6` (orbit [2;3;0], d=14, az 30°, el 12°); a `tree` tomba sobre os fios (pivô na base), faíscas. Corte para o `recloser` em plano médio: olho vermelho, abre/fecha duas vezes (piscadas de luz nas casas depois dele) e trava aberto com cadeado 2D. | `tree` grande (tronco + copa low-poly), fios afundados, faíscas, `recloser` com contador de tentativas 2D "1 / 2 / BLOQUEADO". | `tree.fall` interpolate in 0→1 (rotação 0→−72°, W("s7",3)→W("s7",4)+10); `arc.fault2` spring 0→1 (W("s7",4)+10); `recloser.open` 0→1 (local 112), 1→0 (local 130), 0→1 (local 140), 1→0 (local 156), 0→1 trava (local 165); `segB/C/D.power` piscam 1→0→0,6→0 acompanhando; `recloser.lock` spring 0→1 em "desiste" (W("s7",15)). | ✖ **FALHA PERMANENTE** (negative, em W("s7",11) ≈ local 135 → fim). Highlights: ÁRVORE, FIO, PERMANENTE, RELIGADOR, DESISTE. |
| 00:44:09 – 00:48:24 | 1329 – 1464 | Todo mundo depois dele fica sem luz, mesmo longe da árvore. | Dolly-out para a rua inteira (orbit [0;2;0], d=32, az 35°, el 24°): `segA` aceso, de `pole3` em diante tudo escuro. Câmera desliza até a `house7` (a mais distante, x=6) e mostra a distância até a árvore com régua 2D tracejada. | Rua, `recloser` travado, árvore caída, régua tracejada 2D entre `house7` e `tree`. | Câmera dolly-out (local 0–45) e tracking soft até [5;1,5;1] (local 60–125); `segHighlight.dark` pulsa nos trechos B/C/D (local 20–60); `ruler.draw` 0→1 em "longe" (W("s8",8)→+18). | ✖ **TODO MUNDO SEM LUZ** (negative, local 20→fim). Rótulo 3D "LONGE DO DEFEITO" na `house7`. Highlights: SEM, LUZ, LONGE, ÁRVORE. |
| 00:48:24 – 00:57:06 | 1464 – 1716 | Por isso, chaves automáticas dividem a linha em trechos. Elas abrem dos dois lados do defeito, e o começo volta a ligar. | Vista lateral elevada da rua (orbit [0;3;0], d=30, az 10°, el 30°): `switch1` e `switch2` surgem nos postes; a linha se pinta em 4 cores de trecho (A/B/C/D). Close rápido (orbit [2;4;0], d=10) nas duas lâminas abrindo ao redor da árvore; volta ao plano geral: o religador destrava e fecha; partículas enchem o `segB`. | `switch1`, `switch2` (lâminas articuladas), faixas de cor por trecho (2D projetado sobre os fios), cadeado some. | `switch1.install`/`switch2.install` spring (W("s9",2), +4 f entre eles, damping 11); `segments.tint` 0→1 em "trechos" (W("s9",8)→+15); câmera dolly-in (local 110–135); `switch1.open` e `switch2.open` spring 0→1 em "abrem" (W("s9",10), damping 14); `recloser.lock` 1→0 e `recloser.open` 1→0 em "começo" (W("s9",18)); `segB.power` 0→1 (W("s9",18)+4→+20); câmera dolly-out (local 190–240). | ✔ **CHAVES AUTOMÁTICAS** (positive, em W("s9",2) ≈ local 31 → local 120); ✔ **TRECHO ISOLADO** (positive, em W("s9",10) ≈ local 124 → fim). Highlights: CHAVES, AUTOMÁTICAS, TRECHOS, ABREM, DEFEITO, COMEÇO. |
| 00:57:06 – 01:02:23 | 1716 – 1883 | Só que as casas depois do trecho continuam no escuro, com os fios inteiros. | Câmera avança para o `segD` (orbit [5;3;0,5], d=13, az 30°, el 12°): `house6` e `house7` escuras; um scanner 2D percorre os fios do trecho e marca "OK" verde, contrastando com as janelas apagadas. | `house6`, `house7`, fios do `segD` com selos 2D "OK". | Câmera tracking soft (local 0–60); `segD.scan` 0→1 interpolate linear (W("s10",12)-20 → W("s10",13)+10); `segD.okMarks` spring escalonado (2 f). | ⚠ **SEM LUZ, MAS SEM DEFEITO** (warning, em W("s10",7) ≈ local 89 → fim). Highlights: CASAS, ESCURO, FIOS, INTEIROS. |
| 01:02:23 – 01:08:20 | 1883 – 2060 | Então, uma chave normalmente aberta se fecha e liga essas casas a um circuito vizinho. | Câmera vai ao `pole8` (orbit [7;4;0], d=9, az 35°, el 10°): a `tieSwitch` aberta, com anel amarelo; à direita, o `neighborLine` aceso vindo do `neighborSub`. A lâmina fecha; câmera recua (d=20) e mostra as partículas entrando **da direita para a esquerda** no `segD`; `house6`/`house7` acendem. | `tieSwitch`, `neighborLine`, `neighborSub` (silhueta), partículas com direção invertida no segD. | `neighbor.power` = 1 desde o início; `tieSwitch.closed` spring 0→1 em "fecha" (W("s11",6), damping 13); `segD.flowDir` −1; `segD.power` 0→1 (W("s11",8)→+20); câmera dolly-out soft (local 100–170). | ℹ **CHAVE NA** — "Normalmente aberta" (info, em W("s11",3) ≈ local 42 → local 110); ✔ **CIRCUITO VIZINHO** (positive, em W("s11",13) ≈ local 158 → fim). Highlights: CHAVE, ABERTA, FECHA, CIRCUITO, VIZINHO. |
| 01:08:20 – 01:15:19 | 2060 – 2269 | E quem coordena tudo? Sensores medem a corrente e avisam, por rádio ou celular, o centro de operação. | Câmera sobe e gira (orbit [0;3;−3], d=30, az 50°, el 28°) até enquadrar a rua e o `cod` ao fundo. Ícones de sensor pulsam no religador e nas chaves; arcos de rádio ciano saem de cada equipamento e convergem na antena do `cod`; o telão do prédio acende com o mapa da rua. | `cod` (prédio + antena + telão), ondas de rádio (anéis ciano), ícones de sensor 2D. | Câmera orbit soft 50°→35° (local 0–200); `sensors.pulse` 0→1 em "Sensores" (W("s12",4)→+12), loop senoidal derivado do frame; `radio.waves` 0→1 interpolate linear (W("s12",11)→W("s12",15)), anéis com fase `frame*0,15`; `cod.screen` 0→1 em "centro" (W("s12",15)→+15). | ⚠ **QUEM COORDENA?** (warning, icon "?", local 8→W("s12",4)); ℹ **COMUNICAÇÃO** — "Sensores + rádio" (info, em W("s12",4) ≈ local 54 → fim). Highlights: SENSORES, CORRENTE, RÁDIO, CELULAR, CENTRO, OPERAÇÃO. |
| 01:15:19 – 01:21:16 | 2269 – 2446 | Um software escolhe as manobras e devolve a energia em poucos minutos: é o self-healing. | Dolly-in no telão do `cod` (orbit [−1;2;−9], d=8, az 20°, el 6°): mapa 2D da rua com os 4 trechos; a sequência de manobras roda acelerada (religador ✖, chaves abrem, religador ✔, chave NA fecha). Corte de volta para a rua (d=26) com tudo aceso exceto o `segC`. | Telão com mapa vetorial 2D (Overlay sincronizado), relógio 2D "poucos minutos". | `cod.mapSteps` 0→4 interpolate linear (W("s13",2)→W("s13",8)), cada passo acende um ícone; `clock.spin` 0→1 (W("s13",9)→W("s13",11)); câmera dolly-out soft (local 120–160). | ℹ **SELF-HEALING** — "Rede autorregenerativa" (info, em W("s13",14) ≈ local 170 → fim). Highlights: SOFTWARE, MANOBRAS, ENERGIA, MINUTOS, SELF-HEALING. |
| 01:21:16 – 01:30:00 | 2446 – 2700 | A equipe só vai até a árvore. Pronto: agora você entende como a rede dos postes se protege sozinha. | O `truck` entra pela rua e para no `segC`; cesto eleva um técnico até os fios (low-poly, sem detalhes operacionais). Dolly-out e órbita 30°→42° até o diorama completo (d=40, el 26°), com rótulos de todos os equipamentos. Fade final nos últimos 18 frames. | `truck` com cesto, técnico, todos os rótulos 3D: DISJUNTOR, RELIGADOR, CHAVE, CHAVE NA, CENTRO DE OPERAÇÃO; rede acesa exceto segC. | `truck.x` 12→2 interpolate out (local 5–70); `truck.boom` 0→1 (local 70–100); câmera dolly-out + orbit soft (local 90–230); `final.labels` spring escalonado 4 f (W("s14",7)→); `fade` 0→1 interpolate in (local 236–254). | ✔ **SÓ O TRECHO COM DEFEITO** (positive, local 20→85); ℹ **AUTOMAÇÃO DA REDE** — "Esquema simplificado" (info, size large, em W("s14",7) ≈ local 89 → fim). Highlights: EQUIPE, ÁRVORE, PRONTO, REDE, POSTES, PROTEGE. |

Soma: 254 + 188 + 220 + 199 + 156 + 124 + 188 + 135 + 252 + 167 + 177 + 209 + 177 + 254 = **2700 frames** (90 s), contíguos de 0 a 2700.

## 3. Estrutura de State / Props para Remotion

Contrato completo em [`scene-plan.ts`](./scene-plan.ts), no mesmo formato de
`assets/template/src/data/scenes.ts` (tipos `VideoConfig`, `ScenePlan`, `CameraPlan`, `SceneObject`,
`TrackAnimation`, `SceneBadge`, `CaptionBlock`, `AudioCue`), com as 14 cenas acima.

- **Linha do tempo determinística:** tudo é função do frame atual (`useCurrentFrame()`); sem timers,
  `Date.now`, estado incrementado em efeitos nem `Math.random` — faíscas, vento e tremida usam
  `random("seed-" + i)` do Remotion.
- **Frames:** `startFrame` global; animações, badges, legendas, câmera e áudio em frames **locais**
  da `<Sequence>` de cada cena. Cortes vêm de `PLANNED_SECONDS` agora e de `SCENE_FRAMES` (voz real) na
  Fase 2; momentos amarrados a palavras com `W("sN", i)`.
- **Mundo persistente:** `World.tsx` monta subestação, postes, fios, casas e equipamentos uma vez; cada
  objeto lê `track("alvo.prop", frameGlobal)`. Equipamentos instalados continuam visíveis até o fim.
- **Camadas:** 3D em `<ThreeCanvas>` (`@remotion/three`, câmera perspectiva FOV 24°) + 2D por cima
  (badges, legendas, rótulos projetados, contador, régua, telão do centro de operação).

## 4. Áudio e montagem

**Narração integral (226 palavras ≈ 151 palavras/min em 90 s):**

Você aperta o interruptor e a luz acende. Parece que basta um fio, de poste em poste, até a sua casa.
Só que um galho encosta no fio: curto-circuito! A corrente dispara e pode queimar a rede. Por isso, a
subestação tem um disjuntor, que sente o excesso de corrente e desliga a linha na hora. Mas o bairro
inteiro apagou, e o galho já caiu! A maioria das falhas é passageira assim. Então entra o religador
automático: ele desliga, espera uns segundos e religa sozinho. Defeito sumiu, luz de volta, sem ninguém
sair de casa. Mas, se uma árvore cai sobre o fio, a falha é permanente, e o religador desiste. Todo mundo
depois dele fica sem luz, mesmo longe da árvore. Por isso, chaves automáticas dividem a linha em
trechos. Elas abrem dos dois lados do defeito, e o começo volta a ligar. Só que as casas depois do
trecho continuam no escuro, com os fios inteiros. Então, uma chave normalmente aberta se fecha e liga
essas casas a um circuito vizinho. E quem coordena tudo? Sensores medem a corrente e avisam, por rádio ou
celular, o centro de operação. Um software escolhe as manobras e devolve a energia em poucos minutos: é o
self-healing. A equipe só vai até a árvore. Pronto: agora você entende como a rede dos postes se protege
sozinha.

- **Estimativa:** ~80 s de fala a ~2,7 palavras/s + 13 pausas de 0,55 s ≈ 87 s, cabendo nos 90 s.
  Após o TTS, `utils/timing.ts` deriva os cortes da duração real; se não couber, **encurto o texto**
  (não acelero a voz além de +12 %) e reapresento a mudança se ela alterar conteúdo.
- **Voz:** edge-tts `pt-BR-AntonioNeural`, curiosa e enérgica, rate +8 %; "self-healing" com pronúncia
  inglesa (forçar grafia fonética "sélf rílin" no texto enviado ao TTS, mantendo a legenda original).
- **Efeitos (sintetizados por código, `scripts/sfx.py`):** whoosh suave (s1, local 0); clique do
  interruptor (s1, ~local 45); zumbido elétrico + estalo (s2, curto); "clack" de contato abrindo
  (s3 disjuntor; s5, s7 religador; s9 chaves; s11 chave NA fechando); queda de energia "power-down"
  (s3); "power-up" ascendente (s5/s6, s9, s11); rangido + baque da árvore (s7); bipes de rádio (s12);
  tique de relógio (s13); motor do caminhão (s14); badge "pop" discreto em cada badge.
- **Trilha (`scripts/music.py`):** pulso eletrônico leve em 100 BPM, tensão nos blocos de problema
  (s2, s4, s7–s8, s10), abre em maior nas soluções e no final; ducking de −12 dB sob a voz.
- **Legendas:** blocos provisórios no `scene-plan.ts`; tempos finais palavra a palavra só depois do
  alinhamento com o áudio (`prepare_vo.py` → `vo.json`).
- **Mixagem final:** −14 LUFS integrado / −1,5 dBTP (`scripts/loudnorm.py`).

## 5. Critérios de aceite e notas de verificação

| Critério | Situação no roteiro |
| --- | --- |
| Gancho imediato (ação + promessa visual) | ✔ interruptor e luz em 0–3 s; "parece que basta um fio" |
| Cadeia causal compreensível | ✔ curto → disjuntor → apagão → religador → falha permanente → chaves → casas sãs no escuro → chave NA → coordenação → self-healing |
| Explicação antes do nome técnico | ✔ cada termo surge depois de o problema estar visível (badge na palavra do termo) |
| Sistema visual persistente | ✔ mesma rua; equipamentos instalados permanecem; ids estáveis |
| Conclusão mostrando o funcionamento | ✔ rede acesa exceto o trecho com a árvore, equipe só no ponto do defeito |
| Leitura em celular | ✔ aceso/apagado por janelas + fundo; badges ≥ 262 px; legenda em ~1418 px |
| Tabela completa e frames contíguos | ✔ 14 linhas, 0→2700 sem lacunas; soma 2700 |
| Narração compatível com o tempo | ✔ 226 palavras ≈ 151 ppm (faixa 145–170) — a confirmar com o TTS |
| Array consistente com a tabela | ✔ `scene-plan.ts` com as 14 cenas, mesma narração e mesmos cortes |
| Nenhum asset alegado como existente | ✔ áudio todo `status: "planned"`; nenhum render, build ou audição foi feito |

**Premissas:** rede aérea de média tensão urbana genérica, sem jurisdição específica; nenhuma norma
citada. Não são dados números universais (tempo de religamento = "uns segundos"; restauração = "poucos
minutos"; nº de tentativas = "algumas"). Sem instruções operacionais: o técnico aparece só como
personagem.

**Fontes consultadas:**
- [Self healing e o sistema elétrico de distribuição — O Setor Elétrico](https://www.osetoreletrico.com.br/?p=127375)
  (religadores e chaves com comando remoto, chaves NF/NA de interligação, IEDs + SCADA, maioria das
  faltas transitórias eliminadas pelo religamento).
- [Copel moderniza rede com tecnologia self-healing — Cenário Energia (jun/2025)](https://cenarioenergia.com.br/2025/06/04/copel-moderniza-rede-com-tecnologia-self-healing-e-reduz-tempo-de-interrupcao-de-energia-no-parana/)
  (religadores automáticos isolam o trecho e restauram o resto em até ~3 minutos no caso descrito).
