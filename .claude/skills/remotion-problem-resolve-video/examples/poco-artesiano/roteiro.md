# Roteiro — Como funciona um poço artesiano? (exemplo entregue)

> Origem: prompt mestre escrito pelo usuário (aprovado na própria solicitação). Esta versão já tem os
> cortes realinhados à narração real (ElevenLabs "Liam", speed 1.12, 39,3 s de fala). Convenção:
> timestamps MM:SS:FF a 30 fps; frames em intervalo semiaberto [início, fim).

## 1. Briefing de produção

- **Tema/recorte:** poço tubular que capta aquífero confinado (arenito) entre argila e rocha cristalina,
  com recarga num morro; caso jorrante como possibilidade e caso com bomba submersa.
- **Público/objetivo:** leigo; entender por que a água sobe sozinha às vezes e às vezes não.
- **Formato:** 45 s, 1080 × 1920, 30 fps (1350 frames), pt-BR, narração masculina curiosa e enérgica.
- **Direção de arte:** diorama low-poly em corte; solo marrom-claro, camadas marrom/bege/cinza, aquífero
  ciano com grãos, água em azul elétrico, tubos cinza-metálico, verde = solução, vermelho = alerta.
- **Sistema construído:** o mesmo bloco de terreno recebe perfuração → revestimento/filtro → água sob
  pressão → (jorro) → proteção sanitária → tubulação → reservatório → casa.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:04:03 | 0 – 123 | Como é possível tirar água do chão, mesmo sem ter um rio por perto? | Plano aberto da casa no terreno seco (orbit d=17, az 30°, el 22°); push-in; a câmera mergulha abaixo do solo e revela o corte (d=29, el −3°). | Casa, caixa d'água, árvores, mandacarus, chão contínuo, bloco estratificado. | `house.scale` spring 0→1 (local −3→45); vegetação spring escalonada (+2 f por item); `ground.reveal` 0→1 (78→102) encolhe o chão; fundo céu→azul pela altura da câmera. | ❓ ÁGUA DEBAIXO DA TERRA? (warning, local 17→115). Legenda: ÁGUA, CHÃO, RIO. |
| 00:04:03 – 00:09:03 | 123 – 273 | O segredo está nos aquíferos: camadas de rochas e sedimentos que armazenam água. | Câmera desce pelo corte; camadas se afastam (vista explodida) e voltam; dolly-in até os grãos do aquífero (d=8,5). | Solo, sedimentos, argila, aquífero (grãos + água nos poros), rocha com fraturas; rótulos de camada. | `layers.explode` 0→1 (27→57, out) e 1→0 (99→132); `aquifer.glow` 0→1 em "aquíferos"; partículas de água 0→1; rótulos SOLO/SEDIMENTOS/ARGILA/AQUÍFERO/ROCHA (≈60→97). | ✔ AQUÍFERO — Água nos poros e fraturas (positive, em "aquíferos"). |
| 00:09:03 – 00:14:25 | 273 – 445 | Mas a água está lá embaixo! Então uma máquina perfura o solo até alcançar a camada certa. | Plano médio superfície+aquífero (d=21); a perfuratriz cai e ergue a torre (d=15); câmera acompanha a broca descendo (vertical) até o aquífero. | Guia tracejado vermelho até o aquífero, anel-alvo, caminhão-perfuratriz, broca, cascalho, rasgo do furo. | `rig.drop` spring (damping 10) chegando em "máquina"; `rig.mast` 0→1; `drill.depth` 0→−2,55 u3d linear (85→140) e →−4,03 (140→167); `aquifer.flash` em 138–168; cascalho por idade. | ✖ ÁGUA INACESSÍVEL (negative, "lá"→"perfura") → ✔ PERFURAÇÃO (positive, "perfura"). |
| 00:14:25 – 00:19:23 | 445 – 593 | Em um aquífero confinado, a água fica sob pressão entre camadas pouco permeáveis. | Dolly-out até o aquífero inteiro e o morro (d=31) e órbita de 16° com leve dolly-in. | Chuva e nuvem sobre o morro (recarga), infiltração, setas de pressão, camadas confinantes destacadas. | `rain` 0→1; `pressure.arrows` spring (damping 9) em "pressão"; `confining.highlight` pulsando em "camadas"; `aquifer.pressure` pulso. Rótulos RECARGA e POUCO PERMEÁVEL ×2. | ✔ AQUÍFERO CONFINADO — Pressão natural (positive). |
| 00:19:23 – 00:25:25 | 593 – 775 | Quando o poço alcança esse aquífero, a pressão empurra a água para cima. Às vezes, ela chega a jorrar! | Coluna da broca sai; revestimento desce; câmera no filtro (d=8,5) e sobe com a água; abre para a superfície com o jorro (d=14). | Revestimento, filtro, pré-filtro, selo, laje, coluna de água, bolhas, linha "nível da pressão", jorro. | `casing.install` 0→1 (9→27); `water.level` −4,03→+0,3 u3d (≈75→137, soft); `headLine` 0→1 (138→152); `jet` 0→0,55 (135→146) e spring →1 em "jorrar". | ✔ PRESSÃO NATURAL; ℹ POÇO JORRANTE — Quando a pressão é suficiente. |
| 00:25:25 – 00:33:01 | 775 – 991 | Mas atenção: nem todo poço artesiano jorra! Se a água não chegar à superfície, uma bomba pode ser necessária. | Tela dividida com o mesmo perfil: esquerda nível acima do solo (jorra); direita nível abaixo — a água para no meio e a bomba submersa liga. Destaque alternado. | Dois painéis 3D, linhas de nível, bomba submersa, tubo edutor, bica, rótulos "NÃO CHEGA AO SOLO" e "BOMBA". | `split` spring in / out no fim; `compare.focus` 0→1 em "Se"; `right.level` → −1,05 u3d; `pump.on` em "bomba"; `pump.flow` 0→1. | ✖ NEM TODO POÇO JORRA; ✔ JORRANTE (esq.); ✔ COM BOMBA (dir.). |
| 00:33:01 – 00:39:23 | 991 – 1193 | Com revestimento e proteção adequados, a água captada pode seguir para um reservatório e abastecer a casa. | Close na boca do poço em corte (d=8,5); jorro fechado com tampa/registro; tracking pela tubulação até a caixa e a casa. | Tampa, registro, tubulação (cresce), fluxo, caixa d'água com janela de corte, casa, gota. | `jet` 1→0; `cap.install` spring; destaques de revestimento/selo/laje; `pipe.grow` 0→1; `pipe.flow` em "captada"; `tank.level` 0→0,82; `house.supplied` spring em "casa". | ✔ PROTEÇÃO SANITÁRIA → ℹ CAPTAÇÃO → ✔ RESERVATÓRIO. |
| 00:39:23 – 00:45:00 | 1193 – 1350 | E é assim que um poço artesiano aproveita a água escondida no subsolo! | Dolly-out até o diorama completo (d=56) e órbita 30°→40°; fade final. | Diorama completo com rótulos RECARGA, POUCO PERMEÁVEL, AQUÍFERO CONFINADO, POÇO, RESERVATÓRIO. | `final.labels` escalonados; `final.glow` no aquífero em "água"; `fade` 0→1 nos últimos ~19 frames. | ℹ POÇO ARTESIANO — Como funciona? ✔ (large). |

## 3. Narração integral (125 palavras ≈ 167 palavras/min sobre os 45 s; 39,3 s de fala medidos)

Como é possível tirar água do chão, mesmo sem ter um rio por perto? O segredo está nos aquíferos:
camadas de rochas e sedimentos que armazenam água. Mas a água está lá embaixo! Então uma máquina perfura
o solo até alcançar a camada certa. Em um aquífero confinado, a água fica sob pressão entre camadas pouco
permeáveis. Quando o poço alcança esse aquífero, a pressão empurra a água para cima. Às vezes, ela chega a
jorrar! Mas atenção: nem todo poço artesiano jorra! Se a água não chegar à superfície, uma bomba pode ser
necessária. Com revestimento e proteção adequados, a água captada pode seguir para um reservatório e
abastecer a casa. E é assim que um poço artesiano aproveita a água escondida no subsolo!

## 4. Notas

- Nenhuma profundidade ou vazão numérica é afirmada; o jorro é apresentado como possibilidade.
- Ajuste técnico registrado: os cortes do briefing (5/5/6/6/7/7/5/4 s) foram realinhados à voz real
  (4,1/5,0/5,7/4,9/6,1/7,2/6,7/5,2 s), mantendo a soma de 1350 frames e todo o conteúdo.
