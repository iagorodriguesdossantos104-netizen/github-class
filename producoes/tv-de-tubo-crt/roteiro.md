# Roteiro v1 — Como funciona uma TV de tubo?

> Origem: gerado pela skill `remotion-problem-resolve-video` (Fase 1) a partir do pedido
> "vídeo sobre o funcionamento de uma TV de tubo". **AGUARDANDO APROVAÇÃO.**
> Convenção: timestamps MM:SS:FF a 30 fps (FF 00–29); frames em intervalo semiaberto [início, fim) —
> o frame final de uma linha é o primeiro da próxima. Total: 90 s = 2700 frames (0 a 2699).
> Momentos "≈ local N" são **estimativas** até existir a voz real; no código eles são `W("sN", i)`
> (palavra i da fala) e se realinham sozinhos.

## 1. Briefing de produção

- **Tema / recorte técnico:** o **tubo de raios catódicos (CRT)** de uma TV doméstica colorida com
  **máscara de sombra** (o tipo mais comum). Fora do recorte: circuitos de recepção/sintonia, fonte e
  flyback por dentro, som, Trinitron (grade de fios em vez de máscara — citado só nas notas).
- **Sistema construído diante do espectador:** uma mesma TV de tubo numa sala retrô, que o gabinete
  deixa ver em corte. Cada problema acrescenta ou revela uma peça que **fica no lugar**: fósforo →
  canhão (cátodo) → vácuo → ânodo → bobinas de deflexão → varredura → grade de controle → pontos RGB e
  três feixes → máscara de sombra.
- **Cadeia de problemas:** a tela precisa brilhar (fósforo) → de onde vêm os elétrons (cátodo
  aquecido) → o ar atrapalha (vácuo) → elétrons lentos (ânodo de alta tensão) → feixe só acerta o meio
  (bobinas) → varredura deixa a tela só branca (grade de controle dosa o brilho) → um ponto por vez
  (velocidade + entrelaçamento + persistência) → só preto e branco (RGB + 3 feixes) → feixe na cor
  errada (máscara).
- **Público / objetivo:** leigo; entender que a imagem da TV de tubo é **desenhada por um único ponto
  que varre a tela muito rápido**, e o papel de cada peça.
- **Formato:** 90 s, 1080 × 1920 (9:16), 30 fps, 2700 frames, pt-BR.
- **Tom:** narração didática, informal e ágil, segunda pessoa, frases curtas.
- **Voz / TTS planejado:** **edge-tts** (gratuito), voz `pt-BR-AntonioNeural`, rate +8 %. Nenhum
  serviço pago sem nova autorização.
- **Direção de arte:** low-poly fosco (`flatShading`). Abertura numa sala retrô à noite (fundo
  degradê âmbar → marrom); ao entrar no tubo o fundo vira azul-petróleo profundo (`bg.inside`).
  Gabinete de madeira com botões; vidro do tubo translúcido em corte longitudinal; **elétrons =
  partículas amarelas**, **feixe = linha ciano brilhante**, moléculas de ar = esferas cinza, campo
  magnético = arcos laranja, sinal = onda amarela num cabo. Na cena da cor, os três feixes ganham
  vermelho/verde/azul **só para identificação** (elétrons não têm cor — badge final diz "esquema
  simplificado").
- **Imagem na tela:** uma paisagem genérica desenhada por código (sol, morros, céu) — sem programa,
  marca ou personagem de terceiros. Aparece P&B até a cena 14 e colorida no final.
- **Representação esquemática:** 12 linhas visíveis em câmera lenta representam as 525; tamanhos e
  distâncias fora de escala; o cátodo de verdade é aquecido por um filamento interno (mostrado como
  brilho laranja).
- **Camadas:** 3D real com `@remotion/three` (R3F/Three.js) para a TV e o tubo; 2D (HTML/CSS) para
  badges, legendas, rótulos projetados, contadores, setas de varredura e ícone do olho. Nada de 2.5D.

### Mapa do tubo (coordenadas do mundo, u3d; eixo do tubo em z, tela olhando para +z)

| Id | Posição | Função |
| --- | --- | --- |
| `screen` (+ `phosphor`, `triads`) | face 4 × 3 centrada em (0,0,0); fósforo em z=−0,05 | onde a luz aparece |
| `mask` | chapa furada em z=−0,25 (entra na cena 14) | cada feixe na sua cor |
| `funnel` | cone de z=−0,1 a z=−3,4 | corpo do tubo |
| `anode` | botão + cabo vermelho em (0; 1,75; −2,0) + revestimento interno | acelera os elétrons |
| `yoke` | anel de bobinas em z=−3,9…−3,2 | desvia o feixe |
| `neck` + `sealTip` | gargalo r=0,35, z=−3,4…−6,6; ponta selada em z=−6,6 | — |
| `gun`: `cathode`, `grid` | cátodo z=−6,2; grade z=−5,95; anéis z=−5,6…−5,2 | gera e dosa o feixe |
| `beam` | canhão → centro da bobina → ponto (beam.x·2; beam.y·1,5) na tela | o "lápis" |
| `cabinet` | caixa 5,2 × 4,2 × 7,5 com botões; `cabinet.cut` 0 = madeira, 1 = em corte | — |

Trilhas principais: `beam.x`, `beam.y` (−1…1, u3d normalizado), `scan.on`, `scan.speed` (0,03 =
câmera lenta, 1 = rápido/borrado), `raster.fill`, `raster.flat`, `screen.image`, `screen.color`,
`cabinet.cut`, `bg.inside` (0–1).

## 2. Tabela cronológica completa

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:08:05 | 0 – 245 | Você liga a TV de tubo e a imagem aparece. Mas lá dentro não tem pixel: só um feixe invisível desenhando tudo. | Abre de frente para a TV desligada na sala (orbit [0;0,2;0], d=12, az 8°, el 4°) e recua levemente até a TV inteira (d=16, az 15°). O botão gira; a tela acende como na vida real: uma linha horizontal que se abre até a imagem. Em "Mas lá dentro", o gabinete fica transparente e a câmera orbita para o lado (orbit [0;0;−3], d=18, az 70°, el 15°): aparece o tubo inteiro. Em "feixe invisível", uma linha ciano sai do gargalo e varre a tela rápido. | `room` (parede, tapete, abajur low-poly), `cabinet`, `knob`, `screen` com imagem P&B, tubo (`funnel`, `neck`, `gun`), `beam`. | `knob.turn` spring 0→1 (≈ local 18, damping 12); `screen.power` 0→1 interpolate out (local 28→46, escala Y da linha 0,02→1); `screen.image` 0→1 (local 36→54); `cabinet.cut` 0→1 inOut (≈ local 108→148); `bg.inside` 0→0,5; câmera soft local 96→178; `beam.visible` 0→1 (≈ local 189→197); `scan.on`=1, `scan.speed`=1. | ⚠ **QUEM DESENHA A IMAGEM?** (warning, icon "?", ≈ local 108 → fim). Highlights: TV, TUBO, IMAGEM, PIXEL, FEIXE, INVISÍVEL. |
| 00:08:05 – 00:13:22 | 245 – 412 | A tela é pintada por dentro com fósforo, que brilha quando leva pancada de elétrons. | Dolly-in até a borda da tela vista de dentro (orbit [0,8;0,5;−0,3], d=3,2, az 55°, el 10°): o vidro em corte mostra a fina camada esbranquiçada colada por dentro. Seis elétrons de teste vêm do fundo e, a cada impacto, um pontinho da camada acende e apaga. Deriva lenta até d=2,8, az 45°. | `screen` em corte (vidro + `phosphor`), `electronHits` (6 partículas semeadas), feixe desligado. | `beam.visible` 1→0 (local 0→10); `screen.image` 1→0 (0→15); `screen.cutaway` 0→1 inOut (10→45); `phosphor.reveal` 0→1 out (≈ local 70→86, brilho de contorno); `electronHits.burst` 0→1 linear (≈ local 124→158), lampejo de 6 f por impacto. | ℹ **FÓSFORO** — "Brilha quando é atingido" (info, ≈ local 78 → fim). Rótulo 3D FÓSFORO. Highlights: TELA, FÓSFORO, BRILHA, PANCADA, ELÉTRONS. |
| 00:13:22 – 00:19:10 | 412 – 580 | Os elétrons saem de um cátodo aquecido, no fundo do tubo: o canhão de elétrons. | Tracking para trás ao longo do tubo (vista geral d=15, az 75°) até o fundo do gargalo (orbit [0;0;−5,8], d=4, az 75°, el 12°). O cátodo esquenta (laranja) e uma nuvem de partículas amarelas brota na frente dele. Deriva para az 85°. | `cathode`, `electronCloud`, anéis do `gun`, rótulo CÁTODO. | `screen.cutaway` 1→0 (0→30); `cathode.heat` 0→1 out (≈ local 62→86, emissivo laranja); `electronCloud.amount` 0→1 out (≈ local 78→118); `label.cathode` spring (≈ local 58); `gun.highlight` 0→1 (≈ local 124→138, contorno ciano). | ℹ **CANHÃO DE ELÉTRONS** — "Cátodo aquecido solta elétrons" (info, ≈ local 128 → fim). Highlights: ELÉTRONS, CÁTODO, AQUECIDO, FUNDO, CANHÃO. |
| 00:19:10 – 00:25:07 | 580 – 757 | No ar, eles batem em moléculas e se perdem. Por isso o tubo é a vácuo. | Recuo para o gargalo e o começo do funil (orbit [0;0;−4,5], d=7, az 80°, el 14°), cheios de esferas cinza. Os elétrons disparam, ricocheteiam nelas e somem antes de chegar à tela. Em "Por isso", as moléculas são sugadas para trás e saem pela ponta do gargalo; a ponta se fecha com um "tic" (câmera deriva para az 100°). | `air` (≈ 60 esferas semeadas), `sealTip`, partículas com desvio aleatório semeado. | `electrons.fire` 0→1 (≈ local 28→58); `electrons.scatter` 0→1 out (≈ local 38→98); `air.amount` 1→0 in (≈ local 98→158), cada esfera desliza para z=−6,6; `sealTip.sealed` spring 0→1 (≈ local 158, damping 14); `electrons.scatter` 1→0 (≈ local 158→168). | ✖ **AR NO CAMINHO** (negative, ≈ local 38 → 124). ✔ **VÁCUO** — "Ar retirado e tubo selado" (positive, ≈ local 148 → fim). Highlights: AR, BATEM, MOLÉCULAS, PERDEM, VÁCUO. |
| 00:25:07 – 00:31:25 | 757 – 955 | E saem lentos. Então o ânodo, com dezenas de milhares de volts, acelera o feixe até a tela. | Sem ar, os elétrons andam devagar, soltos. Câmera sobe para o funil visto de cima/lado (orbit [0;0,8;−2,5], d=9, az 60°, el 25°): o botão do ânodo e o cabo vermelho acendem; o revestimento interno ganha brilho azul. Os elétrons se juntam num feixe fino ciano que dispara até a tela; câmera recua para o tubo inteiro (d=15, az 75°) e vê o ponto aceso no centro. | `anode` (botão, cabo, revestimento), `beam`, `electrons` (velocidade variável). | `electrons.speed` = 0,15 (0→≈ 124); `anode.on` 0→1 out (≈ local 54→72); `label.anode` spring (≈ local 58); `electrons.speed` 0,15→1 in (≈ local 124→142); `beam.visible` 0→1 (≈ local 128→138); `electrons.fire` 1→0 (≈ 138→144); `beam.x`=`beam.y`=0; `screen.dot` 0→1 (≈ local 158→166). | ✖ **ELÉTRONS LENTOS** (negative, ≈ local 18 → 54). ✔ **ÂNODO** — "~25 mil volts numa TV colorida" (positive, ≈ local 58 → fim). Highlights: LENTOS, ÂNODO, MILHARES, VOLTS, ACELERA, FEIXE. |
| 00:31:25 – 00:36:22 | 955 – 1102 | Só que o feixe acerta sempre o meio da tela. Um pontinho só. | A câmera vem para a frente da tela (orbit [0;0;0], d=8,5, az 0°), gabinete meio transparente: tela escura com um único ponto brilhante no centro. Dolly-in lento até d=6,8; o ponto pulsa em "pontinho". | `spot` (sprite brilhante + halo), `beam` parado. | `screen.dot`=1; `cabinet.cut` 1→0,35 (0→45); `spot.pulse` 0→1 linear (≈ local 108→138), escala 1→1,3→1. | ✖ **SÓ UM PONTO** (negative, ≈ local 48 → fim). Highlights: FEIXE, SEMPRE, MEIO, PONTINHO. |
| 00:36:22 – 00:42:29 | 1102 – 1289 | Então bobinas no gargalo criam um campo magnético que entorta o feixe na horizontal e na vertical. | Câmera vai às costas do funil (orbit [0;0;−3,6], d=4,5, az 60°, el 20°): o anel de bobinas desliza pelo gargalo e encaixa; arcos laranja de campo aparecem. Em "horizontal", câmera passa para trás do canhão (orbit [0;0;−1,5], d=11, az 150°): o feixe dobra ao passar pelas bobinas e o ponto corre para a direita e para a esquerda; em "vertical", sobe e desce. | `yoke` (par H laranja nas laterais, par V cobre em cima/baixo), `field` (arcos), `beam` dobrado, rótulo BOBINAS. | `cabinet.cut` 0,35→1 (0→30); `yoke.install` spring 0→1 (≈ local 18, damping 11), z de −4,6→−3,6; `field.show` 0→1 (≈ local 64→88); `beam.x` 0→0,9→−0,9 inOut (≈ local 138→154); `beam.y` 0→0,8→−0,8 (≈ local 168→183). | ✔ **BOBINAS DE DEFLEXÃO** — "Ímã elétrico desvia o feixe" (positive, ≈ local 98 → fim). Highlights: BOBINAS, GARGALO, CAMPO, MAGNÉTICO, ENTORTA, HORIZONTAL, VERTICAL. |
| 00:42:29 – 00:47:17 | 1289 – 1427 | Agora ele varre a tela linha por linha, de cima para baixo. | Da vista por trás, a câmera orbita para a frente-direita (orbit [0;0;−1], d=12, az 35°, el 10°), vendo ao mesmo tempo o feixe e a tela. Em câmera lenta, o ponto anda da esquerda para a direita, volta apagado e desce: 12 linhas esquemáticas vão cobrindo a tela. Setas 2D → e ↓ aparecem sobre a tela. | `raster` (12 faixas que acendem atrás do ponto), setas 2D projetadas. | `scan.on` 0→1 (≈ local 28); `scan.speed` = 0,08; `raster.fill` 0→1 linear (≈ local 28→124); `raster.arrows` 0→1 (≈ local 54→68) e 1→0 nos 10 f finais; câmera soft (0→36) e linear até o fim. | ℹ **VARREDURA** — "Linha por linha" (info, ≈ local 28 → fim). Highlights: VARRE, LINHA, CIMA, BAIXO. |
| 00:47:17 – 00:51:24 | 1427 – 1554 | Mas, com o feixe sempre igual, a tela fica só branca. | Dolly-in para a frente da tela (orbit [0;0;0], d=7,5, az 8°); a varredura acelera até virar um brilho uniforme; a tela fica toda cinza-clara, sem desenho nenhum. Gabinete volta a meio transparente. | `raster` uniforme. | `scan.speed` 0,08→1 in (0→36); `raster.flat` 0→1 out (≈ local 68→88); `cabinet.cut` 1→0,35 (0→127). | ✖ **SEM IMAGEM** (negative, ≈ local 88 → fim). Highlights: FEIXE, IGUAL, TELA, BRANCA. |
| 00:51:24 – 00:58:01 | 1554 – 1741 | Então o sinal da TV controla uma grade no canhão: mais elétrons, ponto claro; menos, ponto escuro. | Câmera volta ao canhão (orbit [0;0;−5,8], d=4, az 75°): uma onda amarela chega por um cabo até a grade (disco com furo); conforme a onda sobe e desce, o furo abre e fecha e o feixe fica grosso/fino. Em "mais elétrons", corta para a tela (orbit [0;0;0], d=6,5, az 12°): a imagem P&B surge linha a linha, com etiquetas "+ elétrons → claro" e "− elétrons → escuro" apontando para o céu e um morro. | `signal` (onda + cabo), `grid` (abertura variável), `beam` (espessura = sinal), etiquetas 2D, `screen.image`. | `cabinet.cut` 0,35→1 (0→30); `signal.on` 0→1 (≈ local 24→40); `signal.amp` 0→1 (≈ local 74→90), abertura da grade = 0,3+0,7·onda(frame); `label.grid` spring (≈ local 78); `raster.flat` 1→0 (≈ local 128→158); `screen.image` 0→1 linear (≈ local 128→178); `brightness.tags` 0→1 (≈ local 124→136). | ✔ **GRADE DE CONTROLE** — "Dosa os elétrons: o brilho" (positive, ≈ local 78 → fim). Highlights: SINAL, GRADE, CANHÃO, MAIS, CLARO, MENOS, ESCURO. |
| 00:58:01 – 01:04:19 | 1741 – 1939 | Um ponto por vez, mas rápido: no Brasil, quinhentas e vinte e cinco linhas, sessenta meias-telas por segundo. | De frente para a tela (d=6,8, az 0°): em câmera lenta, o ponto desenha a imagem devagar; em "rápido", acelera até virar um borrão. Dolly-out leve para d=10 com órbita −10°. Contador 2D sobe até 525; depois, um destaque mostra as linhas ímpares (amarelo) e em seguida as pares (ciano), alternando, e o contador "60/s". | `interlace` (sobreposição 2D), `counter2d` (LINHAS / MEIAS-TELAS POR SEGUNDO). | `cabinet.cut` 1→0,35 (0→30); `scan.speed` 0,03→1 in (≈ local 48→78); `counter.lines` 0→525 out (≈ local 88→138); `interlace.show` 0→1 (≈ local 144→166), alternância a cada 8 f derivada do frame; `counter.fields` 0→60 (≈ local 148→178). | ℹ **PAL-M** — "525 linhas · 60 campos/s, entrelaçado" (info, ≈ local 78 → fim). Highlights: PONTO, RÁPIDO, BRASIL, LINHAS, SESSENTA, MEIAS-TELAS, SEGUNDO. |
| 01:04:19 – 01:09:06 | 1939 – 2076 | O fósforo segura o brilho, e seu olho vê uma imagem inteira. | Inserto 2D na tela: atrás do ponto fica um rastro que esmaece devagar. Dolly-out até a TV inteira na sala (orbit [0;0,2;0], d=16, az 15°), gabinete de madeira de volta; ícone de olho 2D aparece ao lado e a imagem fica firme e completa. | `trail` (rastro com decaimento), `eye2d`, `screen.image`=1. | `trail.show` 0→1 (≈ local 24→54) e 1→0 (≈ local 104→116); `cabinet.cut` 0,35→0 (0→137); `eye.show` spring (≈ local 78); câmera soft (0→137). | ✔ **IMAGEM INTEIRA** — "Fósforo + olho" (positive, ≈ local 108 → fim). Highlights: FÓSFORO, SEGURA, BRILHO, OLHO, IMAGEM, INTEIRA. |
| 01:09:06 – 01:16:03 | 2076 – 2283 | Mas assim é tudo preto e branco. Para ter cor, são pontinhos vermelhos, verdes e azuis, e três feixes. | A TV mostra a imagem cinza. Dolly-in até a tela (d=6,5) e depois macro na superfície (orbit [0,6;0,4;0], d=1,6, az 10°): a camada branca se divide em pontinhos que acendem vermelho, verde e azul, cada um na sua palavra. Em "três feixes", corte rápido para o canhão (orbit [0;0;−5,8], d=4, az 75°): o cátodo único se divide em três, e saem três feixes. | `triads` (instanced, padrão triangular), `gun.count` 1→3, três `beam`s com cor de identificação. | `cabinet.cut` 0→1 (≈ local 68→88); `triads.show` 0→1 linear (≈ local 114→152: R em 128, G em 138, B em 158); `gun.count` spring 1→3 (≈ local 178, damping 12); `beam.colors` 0→1 (≈ local 178→195). | ✖ **PRETO E BRANCO** (negative, ≈ local 48 → 114). ✔ **RGB + 3 FEIXES** — "Vermelho, verde e azul" (positive, ≈ local 118 → fim). Highlights: PRETO, BRANCO, COR, VERMELHOS, VERDES, AZUIS, TRÊS, FEIXES. |
| 01:16:03 – 01:23:01 | 2283 – 2491 | Só que um feixe acertaria a cor errada. Então uma máscara furada faz cada um acertar só a sua. | Vista lateral perto da tela (orbit [0,6;0,4;−0,15], d=2,2, az 70°, el 10°): os três feixes convergem; o "vermelho" acerta um ponto verde, que acende errado (✖ piscando). Em "máscara", uma chapa cheia de furos desliza para a frente da tela; agora cada feixe passa pelo furo com um ângulo diferente e acerta só a sua cor. Câmera recua para a tela de frente (d=7): a imagem ganha cor. | `mask` (chapa com furos instanced), `wrongHit`, `rightHits`, rótulo MÁSCARA. | `wrongHit.show` 0→1 (≈ local 44→84); `mask.install` spring 0→1 (≈ local 108, damping 12), y +1,5→0; `wrongHit.show` 1→0 (≈ local 114→122); `rightHits.show` 0→1 (≈ local 148→166); `screen.color` 0→1 out (local 178→202). | ✖ **COR ERRADA** (negative, ≈ local 68 → 104). ✔ **MÁSCARA DE SOMBRA** — "Chapa cheia de furos" (positive, ≈ local 108 → fim). Highlights: FEIXE, COR, ERRADA, MÁSCARA, FURADA, SUA. |
| 01:23:01 – 01:30:00 | 2491 – 2700 | Pronto: agora você sabe como a TV de tubo desenha cada imagem. | Da tela colorida, a câmera sai e orbita para o lado (d=18, az 70°) e depois para três-quartos (orbit [0;0;−2,6], d=19, az 48°, el 18°): TV em corte com tudo funcionando — cátodo aceso, ânodo, bobinas, máscara, três feixes varrendo, imagem colorida. Rótulos entram um a um. Fade final nos últimos 18 frames. | Todos os objetos; `finalLabels`: CÁTODO, GRADE, ÂNODO, BOBINAS, MÁSCARA, FÓSFORO. | `cabinet.cut` 0→1 (0→36); `scan.speed`=1; `screen.color`=1; `final.labels` spring escalonado 4 f (≈ local 8→); câmera soft (0→42), linear (42→156), soft até o fim; `fade` 0→1 in (local 191→209). | ℹ **TUBO DE RAIOS CATÓDICOS** — "CRT · esquema simplificado" (info, size large, ≈ local 98 → fim). Highlights: PRONTO, TV, TUBO, DESENHA, IMAGEM. |

Soma: 245 + 167 + 168 + 177 + 198 + 147 + 187 + 138 + 127 + 187 + 198 + 137 + 207 + 208 + 209 =
**2700 frames** (90 s), contíguos de 0 a 2700.

## 3. Estrutura de State / Props para Remotion

Contrato completo em [`scene-plan.ts`](./scene-plan.ts), no mesmo formato de
`assets/template/src/data/scenes.ts` (tipos `VideoConfig`, `ScenePlan`, `CameraPlan`, `SceneObject`,
`TrackAnimation`, `SceneBadge`, `CaptionBlock`, `AudioCue`), com as 15 cenas acima.

- **Linha do tempo determinística:** tudo é função do frame atual (`useCurrentFrame()`); sem timers,
  `Date.now`, estado incrementado em efeitos nem `Math.random` — moléculas, ricochetes, impactos e o
  sinal usam `random("seed-" + i)` do Remotion e funções senoidais do frame.
- **Frames:** `startFrame` global; animações, badges, legendas, câmera e áudio em frames **locais**
  da `<Sequence>` de cada cena. Cortes vêm de `PLANNED_SECONDS` agora e de `SCENE_FRAMES` (voz real) na
  Fase 2; momentos amarrados a palavras com `W("sN", i)`.
- **Mundo persistente:** `World.tsx` monta sala, gabinete, tubo e peças uma vez; cada objeto lê
  `track("alvo.prop", frameGlobal)`. Peças reveladas (ânodo, bobinas, máscara) ficam até o fim.
- **Varredura:** a posição do ponto vem de `scan.on`/`scan.speed`: com `scan.on`=0, valem `beam.x/y`;
  com `scan.on`=1, x e y são calculados de uma fase acumulada (integral de `scan.speed` por frame,
  calculada de forma pura somando a trilha até o frame atual), o que mantém qualquer frame
  renderizável isoladamente. A imagem na tela é uma textura de canvas gerada por código, revelada
  até a linha atual.
- **Camadas:** 3D em `<ThreeCanvas>` (`@remotion/three`, câmera perspectiva FOV 24°) + 2D por cima
  (badges, legendas, rótulos projetados, contadores, setas, olho).

## 4. Áudio e montagem

**Narração integral (236 palavras):**

Você liga a TV de tubo e a imagem aparece. Mas lá dentro não tem pixel: só um feixe invisível
desenhando tudo. A tela é pintada por dentro com fósforo, que brilha quando leva pancada de elétrons.
Os elétrons saem de um cátodo aquecido, no fundo do tubo: o canhão de elétrons. No ar, eles batem em
moléculas e se perdem. Por isso o tubo é a vácuo. E saem lentos. Então o ânodo, com dezenas de
milhares de volts, acelera o feixe até a tela. Só que o feixe acerta sempre o meio da tela. Um
pontinho só. Então bobinas no gargalo criam um campo magnético que entorta o feixe na horizontal e na
vertical. Agora ele varre a tela linha por linha, de cima para baixo. Mas, com o feixe sempre igual,
a tela fica só branca. Então o sinal da TV controla uma grade no canhão: mais elétrons, ponto claro;
menos, ponto escuro. Um ponto por vez, mas rápido: no Brasil, quinhentas e vinte e cinco linhas,
sessenta meias-telas por segundo. O fósforo segura o brilho, e seu olho vê uma imagem inteira. Mas
assim é tudo preto e branco. Para ter cor, são pontinhos vermelhos, verdes e azuis, e três feixes. Só
que um feixe acertaria a cor errada. Então uma máscara furada faz cada um acertar só a sua. Pronto:
agora você sabe como a TV de tubo desenha cada imagem.

- **Estimativa:** a voz usada no vídeo anterior (mesma voz e rate) falou ~179 palavras/min →
  ~79 s de fala + 14 pausas de 0,55 s ≈ 87,6 s, cabendo nos 90 s. Após o TTS, `utils/timing.ts`
  deriva os cortes da duração real; se não couber, **encurto o texto** (não acelero além de +12 %) e
  reapresento a mudança se ela alterar conteúdo.
- **Voz:** edge-tts `pt-BR-AntonioNeural`, curiosa e enérgica, rate +8 %. Legenda mostra "525" onde a
  voz diz "quinhentas e vinte e cinco".
- **Efeitos (sintetizados por código, `scripts/sfx.py`):** whoosh suave nas transições; clique do
  botão e "pop" de ligar a TV (s1); lampejos curtos (s2); zumbido de aquecimento (s3); "pings" de
  ricochete, chiado de vácuo e "tic" de selagem (s4); carga elétrica subindo e "zap" do feixe (s5);
  blip (s6); "clunk" do encaixe + zumbido magnético + swishes (s7); tique de varredura (s8);
  ondulação do sinal (s10); subida de velocidade e contador (s11); brilho (s12); pops das cores e
  clunk (s13); buzz de erro, deslizar da máscara e chime (s14); badge final (s15); "pop" discreto em
  cada badge. Sem o apito agudo real das TVs de tubo (incômodo).
- **Trilha (`scripts/music.py`):** synth retrô leve em 96 BPM, tensão nos problemas (s4, s5, s6, s9,
  s13, s14), abre em maior nas soluções e no final; ducking de −12 dB sob a voz.
- **Legendas:** blocos provisórios no `scene-plan.ts`; tempos finais palavra a palavra só depois do
  alinhamento com o áudio (`prepare_vo.py` → `vo.json`).
- **Mixagem final:** −14 LUFS integrado / −1,5 dBTP (`scripts/loudnorm.py`).

## 5. Critérios de aceite e notas de verificação

| Critério | Situação no roteiro |
| --- | --- |
| Gancho imediato (ação + promessa visual) | ✔ TV liga em 0–2 s; "não tem pixel: só um feixe" |
| Cadeia causal compreensível | ✔ brilho → elétrons → ar → lentidão → um ponto só → tela branca → velocidade → sem cor → cor errada |
| Explicação antes do nome técnico | ✔ badge do termo sai na palavra que o explica (ex.: BOBINAS em "entorta") |
| Sistema visual persistente | ✔ mesma TV/tubo; peças instaladas permanecem; ids estáveis |
| Conclusão mostrando o funcionamento | ✔ tubo em corte com tudo ligado e imagem colorida |
| Leitura em celular | ✔ peça em foco centrada entre badges (≥ 262 px) e legenda (~1418 px); feixe ciano sobre fundo escuro |
| Tabela completa e frames contíguos | ✔ 15 linhas, 0→2700 sem lacunas; soma 2700 |
| Narração compatível com o tempo | ✔ 236 palavras ≈ 87,6 s estimados com pausas — a confirmar com o TTS |
| Array consistente com a tabela | ✔ `scene-plan.ts` com as 15 cenas, mesma narração e mesmos cortes |
| Nenhum asset alegado como existente | ✔ áudio todo `status: "planned"`; nenhum render, build ou audição foi feito |

**Premissas e simplificações:** TV colorida com máscara de sombra e três canhões (a variante
Trinitron usa grade de fios verticais e não aparece). "Dezenas de milhares de volts" é a formulação
falada; o badge cita ~25 mil V como valor típico de TV colorida, não universal. "Fósforo" é o nome
usual do material luminescente da tela (não o elemento químico). A frase sobre o olho simplifica: a
persistência do fósforo somada à percepção visual faz a varredura parecer uma imagem contínua. O vídeo
não ensina a abrir uma TV: o tubo guarda alta tensão mesmo desligado — nenhuma instrução de
manutenção aparece.

**Fontes consultadas:**
- [How Does a CRT TV Work? — Science Insights](https://scienceinsights.org/how-does-a-crt-tv-work-from-electron-gun-to-screen/)
  (cátodo aquecido e emissão termiônica, ~25–30 kV no ânodo, grade de controle, bobinas H/V, fósforos
  RGB, três canhões, máscara de sombra vs. grade de abertura, entrelaçamento, vácuo).
- [A televisão CRT — Prepara Enem](https://www.preparaenem.com/fisica/a-televisao-crt.htm)
  (cátodo, ânodo, tubo a vácuo, bobinas, fósforo e três feixes, em linguagem escolar).
- [PAL-M — Wikipedia](https://en.wikipedia.org/wiki/PAL-M) (padrão analógico brasileiro: 525 linhas,
  ~59,94 campos e ~29,97 quadros por segundo; cor desde 1972).
