# Roteiro v1 — E se a camada de ozônio sumisse por 10 minutos?

> Origem: gerado pela skill `remotion-problem-resolve-video` (Fase 1) a partir do pedido
> "o que aconteceria se nós, seres humanos, ficássemos 10 minutos sem a camada de ozônio?". **AGUARDANDO APROVAÇÃO.**
> Convenção: timestamps MM:SS:FF a 30 fps (FF 00–29); frames em intervalo semiaberto [início, fim) —
> o frame final de uma linha é o primeiro da próxima. Total: 90 s = 2700 frames (0 a 2699).
> Momentos "≈ local N" são **estimativas** até existir a voz real; no código são `W("sN", i)` e se realinham.

## 1. Briefing de produção

- **Tema / recorte:** cenário **hipotético**: a camada de ozônio desaparece de uma vez por 10 minutos, ao
  meio-dia, e volta. O vídeo mostra o que muda na superfície nesses 10 minutos e o que fica depois.
  Fora do recorte: como isso aconteceria (não é fisicamente plausível sumir e voltar assim), clima,
  ozônio ao nível do solo (poluente) e números de UV para cada cidade.
- **Sistema persistente:** uma praia-maquete em corte (areia, mar com corte mostrando a água, banhistas,
  guarda-sol, casa em corte, coqueiro) com uma coluna de céu esquemática: Sol no alto e a faixa de ozônio
  como uma placa translúcida ciano. Os raios UV-A, UV-B e UV-C são setas coloridas; a faixa decide onde
  elas param. Estações de detalhe no mesmo mundo: planeta (dia/noite), bloco de pele com DNA e olho.
- **Cadeia:** a faixa some → onde ela fica e quão fina é → o que ela filtrava → UV-B mais forte e UV-C
  chegando ao chão → só o lado do dia → pele: sem dor, DNA quebrado → queimadura que aparece horas
  depois → olhos (fotoceratite) → quem está em casa escapa → micróbios e plâncton → a faixa volta →
  noite: hospitais, recuperação em dias → risco de câncer a longo prazo → por que o mundo protege a
  camada (Protocolo de Montreal).
- **Público / objetivo:** leigo; entender que o ozônio é um filtro fino e vital, e que o dano do UV é
  silencioso (não dói na hora).
- **Formato:** 90 s, 1080 × 1920 (9:16), 30 fps, 2700 frames, pt-BR.
- **Tom:** narração didática, informal e ágil, segunda pessoa, frases curtas; sem sensacionalismo.
- **Voz / TTS:** **edge-tts** (gratuito), `pt-BR-AntonioNeural`, rate +8 % (a mesma dos vídeos anteriores).
- **Direção de arte:** low-poly fosco (`flatShading`), meio-dia com céu azul-claro → azul mais "cru"
  e arroxeado enquanto a faixa está fora; noite azul-marinho na cena 12. UV-A = lilás, UV-B = magenta,
  UV-C = roxo-escuro com brilho (cores **só para identificação** — UV é invisível). Pele e olhos em
  estações de detalhe estilizadas (sem gore, sem imagem médica real).
- **Relógio 2D "00:00 → 10:00"** no canto do topo, da cena 1 à 11, com selo "tempo acelerado".
- **Camadas:** 3D real com `@remotion/three` para o mundo; 2D para badges, legendas, relógio, régua,
  barra de dose, ícones (soldador, lua, calendário, lata de spray) e o gráfico de risco.

### Mapa do mundo (u3d, esquemático)

| Id | Posição | Papel |
| --- | --- | --- |
| `beach` | areia x −9…2, mar x 2…9; corte frontal em z=+4 até y=−3 | cenário |
| `people` / `umbrella` | deitado (0,0,1.5), em pé (−2,0,2), criança (1,0,0.5); guarda-sol (−1,0,1) | quem se expõe |
| `house` | (−6.5,0,−1), parede frontal some (`house.cut`) | quem se protege |
| `palm` / `microbes` | coqueiro (−4,0,−2.5); pontinhos verdes nas folhas e no solo | natureza |
| `plankton` | partículas verdes nos 0,8 u de cima do corte do mar | oceano |
| `hospital` / `queue` | (−9.5,0,−6), só à noite | consequência |
| `sun` / `ozone` | Sol (10,22,−14); faixa y 14…15 | fonte e filtro |
| `globe` | (0,60,−80), raio 8 | dia/noite |
| `skin` / `dna` | (−30,0,0) | dano celular |
| `eye` | (−30,0,14) | fotoceratite |

## 2. Tabela cronológica completa

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:06:00 | 0 – 180 | Meio-dia, praia lotada. De repente, a camada de ozônio some por dez minutos. O que acontece? | Abre perto dos banhistas (orbit [0;1;1.5], d=12, az 20°, el 12°), ondas e guarda-sol; recua um pouco em "repente" (d=16) e sobe até a coluna inteira (orbit [2;10;−2], d=46): praia embaixo, faixa de ozônio e Sol em cima. Em "some", a faixa pisca e se desfaz em partículas que somem. | `beach`, `people`, `umbrella`, `house`, `palm`, `sun`, `ozone`, raios em repouso; relógio 2D. | `ozone.amount` 1→0 interpolate in (≈ local 95→109); `ozone.dissolve` 0→1 out (≈ local 95→119); `timer.show` spring (≈ local 115); câmera soft/inOut entre chaves. | ⚠ **SEM OZÔNIO POR 10 MIN** (warning, "?", ≈ local 95 → fim). Relógio 2D "00:00". Highlights: PRAIA, OZÔNIO, SOME, DEZ, MINUTOS. |
| 00:06:00 – 00:10:13 | 180 – 313 | Ela fica na estratosfera e é fininha: comprimida, teria uns três milímetros. | Câmera sobe até onde a faixa estava (orbit [2;14.5;−2], d=22, az 25°): só um contorno tracejado. Em "comprimida", uma faixa-fantasma grossa é "espremida" até virar uma linha, ao lado de uma régua 2D "3 mm". | `ghostBand` (contorno tracejado), `ruler2d`. | `ghostBand.show` 0→1 (local 0→12); `ruler.show` 0→1 (≈ local 66→80); `ruler.squash` 0→1 inOut (≈ local 70→126). | ℹ **ESTRATOSFERA** — "≈ 15 a 35 km de altura" (info, ≈ local 27 → fim). Régua "≈ 3 mm". Highlights: ESTRATOSFERA, FININHA, COMPRIMIDA, MILÍMETROS. |
| 00:10:13 – 00:14:26 | 313 – 446 | Mesmo assim, ela segura quase todo o ultravioleta mais perigoso do Sol. | Selo 2D "ANTES" (flashback): a faixa aparece inteira; dolly-out até ver Sol, faixa e chão (orbit [3;8;−2], d=40, az 30°). Setas UV saem do Sol: UV-A atravessa até o chão; UV-B quase toda e UV-C toda param na faixa com faíscas. | Raios: UV-A lilás, UV-B magenta, UV-C roxo; faíscas de bloqueio; selo "ANTES". | `replay.before` 0→1 (local 0→10) e 1→0 (últimos 10 f); `rays.show` 0→1; `rays.stopAtBand` = 1. | ℹ **FILTRO DE ULTRAVIOLETA** (info, ≈ local 76 → fim). Highlights: SEGURA, ULTRAVIOLETA, PERIGOSO, SOL. |
| 00:14:26 – 00:22:26 | 446 – 686 | Sem ela, o UV-B chega muito mais forte. E chega o UV-C, que hoje nem toca o chão: o mesmo que esteriliza hospitais. | Volta ao presente (sem faixa). As setas magenta ficam mais numerosas e grossas até o chão; em "UV-C", setas roxo-escuro descem e a areia ganha brilho roxo. Câmera desce acompanhando (orbit [1;3;0], d=22, az 30°). Em "esteriliza", ícone 2D de lâmpada germicida. | Raios mais densos; `ground.uvGlow`; ícone 2D de lâmpada. | `rays.stopAtBand` 1→0; `uvb.level` 0,25→1 out (≈ local 37→74); `uvc.level` 0→1 out (≈ local 111→129); `ground.uvGlow` 0→1 (≈ local 111→166); `lamp.show` spring (≈ local 203). | ✖ **UV-B MAIS FORTE** (negative, ≈ local 37 → 92); ✖ **UV-C NO CHÃO** — "O mesmo das lâmpadas germicidas" (negative, ≈ local 111 → fim). Highlights: UV-B, FORTE, UV-C, CHÃO, ESTERILIZA, HOSPITAIS. |
| 00:22:26 – 00:28:09 | 686 – 849 | Só a metade iluminada do planeta é atingida. Quem está na noite não percebe nada. | Corte em movimento para o espaço: o planeta (orbit [0;60;−80], d=34, az 30°) com o Sol de um lado; o lado do dia ganha brilho roxo de UV; órbita até o lado da noite, onde as luzes das cidades seguem tranquilas. | `globe`, `globeShell` ausente (contorno tracejado), luz direcional do Sol. | `globe.show` 0→1 (0→24); `globe.dayHighlight` 0→1 (≈ local 17→37); `globe.nightHighlight` 0→1 (≈ local 66→108); órbita az 10°→55°. | ℹ **SÓ O LADO DO DIA** (info, ≈ local 17 → fim). Highlights: METADE, ILUMINADA, NOITE, NADA. |
| 00:28:09 – 00:35:00 | 849 – 1050 | Na praia, ninguém sente dor. O ultravioleta não esquenta: ele atravessa a pele e quebra o DNA das células. | De volta aos banhistas, sorrindo, relaxados; termômetro 2D parado em "não esquenta". Em "atravessa", corte para o bloco de pele em corte (orbit [−30;1.2;0], d=11): fótons roxos entram pela epiderme; dolly-in no núcleo (d=4,5): três pontos da dupla-hélice viram "grampos" vermelhos. | `skin` (epiderme, derme, células), `dna`, termômetro 2D. | `timer.min` →3; `heat.icon` 0→1→0; `skin.uvPhotons` 0→1 (≈ local 83→120); `dna.breaks` 0→1 out (≈ local 129→157). | ⚠ **SEM DOR NA HORA** (warning, ≈ local 18 → 80); ✖ **DNA DANIFICADO** (negative, ≈ local 129 → fim). Highlights: DOR, NÃO, ESQUENTA, PELE, QUEBRA, DNA. |
| 00:35:00 – 00:41:02 | 1050 – 1232 | Em poucos minutos, a dose já é de queimadura forte. Mas a vermelhidão só aparece horas depois. | Close no banhista deitado (orbit [0;0.8;1.5], d=9, az 35°→50°). Barra 2D de dose enche até a marca "QUEIMADURA" enquanto a pele dele continua normal. Em "horas depois", inserto 2D "+6 h": o mesmo banhista vermelho. | Barra de dose 2D; inserto "+6 h" com o banhista avermelhado. | `timer.min` →5; `dose.level` 0→1 out (≈ local 9→83); `skin.redPreview` 0→1 inOut (≈ local 111→156). | ✖ **QUEIMADURA COM ATRASO** — "Vermelhidão surge horas depois" (negative, ≈ local 111 → fim). Highlights: MINUTOS, QUEIMADURA, FORTE, VERMELHIDÃO, HORAS. |
| 00:41:02 – 00:47:04 | 1232 – 1414 | Os olhos também queimam, como os de um soldador sem máscara. A dor costuma chegar à noite. | Estação do olho (orbit [−30;1.5;14], d=9→6): olho estilizado; a córnea fica avermelhada e embaçada. Ícone 2D de soldador sem máscara aparece e sai; depois uma lua 2D. | `eye`, ícone de soldador, lua 2D. | `timer.min` →7; `eye.cornea` 0→1 out (≈ local 28→48); `welder.show` spring (≈ local 83) e 1→0 (≈ local 96→106); `moon.show` spring (≈ local 140). | ✖ **FOTOCERATITE** — "Queimadura da córnea" (negative, ≈ local 28 → fim). Highlights: OLHOS, QUEIMAM, SOLDADOR, MÁSCARA, DOR, NOITE. |
| 00:47:04 – 00:51:17 | 1414 – 1547 | Quem estava dentro de casa escapa: telhado e paredes barram o ultravioleta. | Casa em corte (orbit [−6.5;2;−1], d=16): a parede frontal some e mostra o morador lendo; as setas UV batem no telhado e param com faíscas. Órbita 20°→35°. | `houseCut`, `insidePerson` com selo ✔. | `timer.min` →8; `house.cut` 0→1 (0→36); `insidePerson.check` spring (≈ local 46); `roof.block` 0→1 (≈ local 64→98). | ✔ **PROTEGIDO DENTRO DE CASA** (positive, ≈ local 46 → fim). Highlights: CASA, ESCAPA, TELHADO, PAREDES, BARRAM. |
| 00:51:17 – 00:58:08 | 1547 – 1748 | Lá fora, o UV-C mata micróbios nas folhas e no solo, e o plâncton da superfície do mar sofre. | Close no coqueiro e no chão (orbit [−4;1.5;−2], d=9): pontinhos verdes (micróbios) nas folhas e na terra ficam cinza. Tracking até o corte do mar (orbit [5.5;−1.2;4], d=10): o plâncton verde da camada de cima escurece; o de baixo continua verde. | `microbes`, `plankton` no corte do mar. | `timer.min` →9; `microbes.alive` 1→0,2 inOut (≈ local 46→103); `plankton.health` 1→0,45 (≈ local 129→175). | ✖ **MICRÓBIOS MORREM** (negative, ≈ local 46 → 106); ✖ **PLÂNCTON ATINGIDO** (negative, ≈ local 120 → fim). Highlights: UV-C, MATA, MICRÓBIOS, PLÂNCTON, MAR, SOFRE. |
| 00:58:08 – 01:03:01 | 1748 – 1891 | Aí os dez minutos acabam, e o ozônio volta a filtrar o Sol. | Relógio chega a 10:00 com um "ding". Dolly-out até a coluna inteira (d=44): a faixa se reconstrói a partir das partículas; setas UV-C somem, UV-B volta ao normal, o brilho roxo do chão apaga. | Faixa se recompondo; raios voltam ao estado "filtrado". | `timer.min` →10 (≈ local 37); `ozone.amount` 0→1 out (≈ local 65→105); `ozone.dissolve` 1→0; `rays.stopAtBand` 0→1; `uvc.level` 1→0; `uvb.level` 1→0,25; `ground.uvGlow` 1→0; `timer.show` 1→0 (últimos 10 f). | ✔ **OZÔNIO DE VOLTA** (positive, ≈ local 65 → fim). Highlights: DEZ, MINUTOS, ACABAM, OZÔNIO, VOLTA, FILTRAR. |
| 01:03:01 – 01:09:22 | 1891 – 2092 | À noite, filas no hospital: pele vermelha e olhos ardendo. Na maioria dos casos, tudo sara em poucos dias. | O céu escurece até a noite (orbit [−6;3;−2], d=30); o hospital acende ao fundo; uma fila de pessoas avermelhadas, algumas cobrindo os olhos. Dolly-in na porta (d=16). Calendário 2D vira 3 folhas e a fila diminui, a pele volta ao normal. | `hospital`, `queue` (8 pessoas low-poly), calendário 2D. | `sky.night` 0→1 (0→36); `hospital.show` spring (≈ local 18); `queue.count` 0→1 (≈ local 28→65); `queue.red` 0→1 (≈ local 65→102) e 1→0,2 (≈ local 157→fim); `calendar.days` 0→1 (≈ local 148→194). | ✖ **FILA NO HOSPITAL** (negative, ≈ local 28 → 102); ✔ **SARA EM POUCOS DIAS** (positive, ≈ local 139 → fim). Highlights: NOITE, HOSPITAL, VERMELHA, OLHOS, ARDENDO, SARA, DIAS. |
| 01:09:22 – 01:15:05 | 2092 – 2255 | Mas o DNA danificado deixa um risco maior de câncer de pele nos anos seguintes. | Volta ao núcleo da célula (d=4,5): a maior parte dos grampos vermelhos é consertada, alguns ficam. Gráfico 2D simples "risco × anos" com uma seta subindo levemente (sem números). Dia volta ao fundo. | `skin`, `dna`, gráfico 2D. | `sky.night` 1→0; `dna.repair` 0→0,7 out (≈ local 18→37); `risk.chart` 0→1 inOut (≈ local 64→138). | ⚠ **RISCO A LONGO PRAZO** — "Câncer de pele" (warning, ≈ local 64 → fim). Highlights: DNA, DANIFICADO, RISCO, CÂNCER, PELE, ANOS. |
| 01:15:05 – 01:21:16 | 2255 – 2446 | Por isso o mundo baniu os gases que destroem o ozônio: essa camada fininha te protege todo dia. | Sobe até a faixa de ozônio (d=22); ícone 2D de lata de spray "CFC" recebe um ✖ carimbado; a faixa brilha de leve e a câmera recua (d=30→40) mostrando a coluna protegida. | Lata de spray 2D "CFC", ✖; faixa com brilho. | `cfc.show` spring (≈ local 46) e 1→0 (≈ local 99→109); `cfc.cross` spring (≈ local 56); `ozone.glow` 0→1 (≈ local 105→142). | ✔ **PROTOCOLO DE MONTREAL** — "1987 · gases como os CFCs banidos" (positive, ≈ local 46 → fim). Highlights: MUNDO, BANIU, GASES, OZÔNIO, PROTEGE. |
| 01:21:16 – 01:30:00 | 2446 – 2700 | Pronto: agora você sabe o que dez minutos sem ozônio fariam com a gente. | Órbita lenta e recuo até o plano geral (orbit [1;9;−1], d=48, az 28°→35°): praia de dia, faixa no lugar, raios filtrados. Rótulos 3D entram um a um. Fade final nos últimos 18 frames. | Todos; `finalLabels`: OZÔNIO, SOL, UV-A, UV-B, UV-C. | `final.labels` spring escalonado 4 f (≈ local 8→); câmera soft; `fade` 0→1 in (local 236→254). | ℹ **10 MINUTOS SEM OZÔNIO** — "Cenário hipotético · esquema simplificado" (info, ≈ local 66 → fim). Highlights: PRONTO, DEZ, MINUTOS, OZÔNIO. |

Soma: 180 + 133 + 133 + 240 + 163 + 201 + 182 + 182 + 133 + 201 + 143 + 201 + 163 + 191 + 254 = **2700 frames**
(90 s), contíguos de 0 a 2700 (conferido no `scene-plan.ts`).

## 3. Estrutura de State / Props para Remotion

Contrato completo em [`scene-plan.ts`](./scene-plan.ts), no formato de `assets/template/src/data/scenes.ts`,
com as 15 cenas acima. Linha do tempo determinística (tudo função do frame; partículas com
`random(seed)`); frames das animações locais à cena; cortes por `PLANNED_SECONDS` agora e pela voz real
na Fase 2. Um mundo persistente (`World.tsx`) com a praia, a coluna de céu e as três estações de
detalhe; cada objeto lê `track("alvo.prop", frame)`. Camada 3D (`@remotion/three`) + camada 2D (badges,
legendas, relógio, régua, barra de dose, ícones, gráfico). Aproveita o pipeline do vídeo da TV
(composições limpas para thumbnail, materiais sempre `transparent` onde a opacidade varia).

## 4. Áudio e montagem

**Narração integral (241 palavras):**

Meio-dia, praia lotada. De repente, a camada de ozônio some por dez minutos. O que acontece? Ela fica na
estratosfera e é fininha: comprimida, teria uns três milímetros. Mesmo assim, ela segura quase todo o
ultravioleta mais perigoso do Sol. Sem ela, o UV-B chega muito mais forte. E chega o UV-C, que hoje nem
toca o chão: o mesmo que esteriliza hospitais. Só a metade iluminada do planeta é atingida. Quem está na
noite não percebe nada. Na praia, ninguém sente dor. O ultravioleta não esquenta: ele atravessa a pele e
quebra o DNA das células. Em poucos minutos, a dose já é de queimadura forte. Mas a vermelhidão só
aparece horas depois. Os olhos também queimam, como os de um soldador sem máscara. A dor costuma chegar
à noite. Quem estava dentro de casa escapa: telhado e paredes barram o ultravioleta. Lá fora, o UV-C mata
micróbios nas folhas e no solo, e o plâncton da superfície do mar sofre. Aí os dez minutos acabam, e o
ozônio volta a filtrar o Sol. À noite, filas no hospital: pele vermelha e olhos ardendo. Na maioria dos
casos, tudo sara em poucos dias. Mas o DNA danificado deixa um risco maior de câncer de pele nos anos
seguintes. Por isso o mundo baniu os gases que destroem o ozônio: essa camada fininha te protege todo
dia. Pronto: agora você sabe o que dez minutos sem ozônio fariam com a gente.

- **Estimativa:** a mesma voz falou 236 palavras em 74,9 s no vídeo da TV → ~76 s de fala + 14 pausas de
  0,55 s ≈ 84,5 s, cabendo nos 90 s. Se não couber, o preparo regera a +12 %; depois disso, encurto o
  texto e reapresento.
- **TTS:** "UV-B"/"UV-C" enviados como "u vê bê"/"u vê cê" e "DNA" como "dê ene á" (legenda mantém a grafia).
- **Efeitos (sintetizados):** ondas e gaivota leve (s1), "sumiço" granulado da faixa (s1), aperto (s2),
  brilho (s3), zumbido subindo e impacto de UV (s4), lâmpada germicida (s4), whoosh espacial (s5), estalo
  do DNA (s6), barra enchendo e tique rápido (s7), chiado (s8), bloqueio no telhado (s9), efervescência e
  som submerso (s10), "ding" do relógio e restauração (s11), noite e folhas de calendário (s12), tom grave
  (s13), carimbo (s14), badge final (s15).
- **Trilha:** synth leve 100 BPM; ensolarada no início, tensa de s4 a s10, alívio em s11, noite calma em
  s12, grave em s13, resolução em s14–s15; ducking −12 dB sob a voz. Mixagem final −14 LUFS / −1,5 dBTP.

## 5. Critérios de aceite e notas de verificação

| Critério | Situação no roteiro |
| --- | --- |
| Gancho imediato | ✔ praia ao meio-dia e a faixa sumindo em ~3 s; pergunta direta |
| Cadeia causal | ✔ filtro some → UV muda → pele/olhos/natureza → filtro volta → consequências → prevenção |
| Nome técnico depois da explicação | ✔ "fotoceratite" só depois de "olhos queimam"; Montreal depois de "baniu os gases" |
| Sistema persistente | ✔ mesma praia e coluna de céu; estações de detalhe no mesmo mundo |
| Conclusão | ✔ faixa de volta filtrando, plano geral rotulado |
| Leitura em celular | ✔ cores de UV com rótulo; badges ≥ 262 px; legenda ~1418 px |
| Tabela completa, frames contíguos | ✔ 15 linhas, 0→2700, soma 2700 |
| Narração × tempo | ✔ 241 palavras ≈ 84,5 s com pausas (estimativa pela voz real anterior) |
| Nada alegado como pronto | ✔ áudio `planned`; nenhum render ou audição |

**Premissas e simplificações (com o que as fontes sustentam):**
- Hoje o ozônio e o oxigênio absorvem praticamente todo o UV-C; sem ozônio, o UV-C chegaria à superfície
  junto com muito mais UV-B. O oxigênio sozinho ainda barraria o UV mais curto (até ~240 nm), então o
  "UV-C no chão" é a parte mais longa dessa faixa — o vídeo não entra nesse detalhe.
- Tempo até a queimadura: não há número oficial para "zero ozônio". O estudo da NASA "mundo evitado"
  estima queimadura em ~5 minutos em Washington com 67 % menos ozônio; com 100 % de perda e UV-C, o vídeo
  diz só "em poucos minutos". A vermelhidão da queimadura surge horas depois da exposição.
- Fotoceratite: sintomas aparecem de 30 min a 12 h depois e costumam passar em até ~2 dias.
- Vidro comum barra a maior parte do UV-B (não todo); por isso a narração fala de telhado e paredes.
- Ozônio "de volta em 10 minutos" é a premissa do cenário, não um tempo real de recuperação.
- O dano a micróbios e plâncton em 10 minutos é mostrado de forma qualitativa, sem números.
- Sem instruções médicas; o vídeo não diz que quem assistiu está protegido.

**Fontes consultadas:**
- [What Happens If the Ozone Layer Is Destroyed? — Science Insights](https://scienceinsights.org/what-happens-if-the-ozone-layer-is-destroyed/)
  (UV-C absorvido hoje; queimadura grave em poucos minutos sem ozônio; fotoceratite; dímeros no DNA;
  plâncton e plantas; camada ≈ 3 mm comprimida).
- [Simulação "mundo evitado" da NASA — Phys.org (2009)](https://phys.org/news/2009-03-simulation-consequences-world-earth-natural.pdf)
  (67 % menos ozônio em 2065 → queimadura em ~5 min; UV mais curto até 10 000× maior).
- [Photokeratitis — All About Vision](https://www.allaboutvision.com/conditions/keratitis/photokeratitis/)
  (início 30 min–12 h; dura 6–24 h; resolve em ~2 dias).
- [Solar UV and Ozone Layer — GoPhotonics](https://www.gophotonics.com/whitepapers/details/3490-solar-uv-and-ozone-layer)
  (O₂ absorve até ~242 nm; O₃ nas bandas de Hartley/Huggins).
- [Can you get sunburnt through glass? — IQ Glass](https://www.iqglassuk.com/technical-advice/can-you-get-sunburnt-through-glass/s178813/)
  (vidro comum filtra a maior parte do UV-B).
