# Técnicas de diorama 3D low-poly (R3F dentro do Remotion)

Padrões extraídos do exemplo `examples/poco-artesiano/` (arquivos citados entre parênteses).
Tudo é geometria procedural — sem modelos ou imagens externas — e função pura do frame.

## Sumário
1. Bloco em corte transversal com camadas
2. Rasgo no plano de corte (objeto "cortado ao meio")
3. Peças em corte: meio-anel extrudado
4. Textura de material: grãos/pedriscos instanciados
5. Fluidos e partículas
6. Tubulações com fluxo
7. Reservatórios e recipientes com janela de corte
8. Máquinas que entram e saem
9. Vista explodida e destaques
10. Rótulos, setas e linhas de referência
11. Tela dividida (comparação)
12. Abertura com mergulho e fundo

---

## 1. Bloco em corte transversal com camadas (`utils/geology.ts`, `GeologicalLayers.tsx`)

- Defina o perfil 2D (plano XY) por polilinhas amostradas em x (passo 0,25), uma por fronteira de
  camada, com jitter determinístico (`random("seed-i")`) para o ar low-poly.
- Garanta a ordem com `min()`: `fronteira_k(x) = min(bruta_k(x), fronteira_{k-1}(x))`. Camadas que se
  afinam até zero (afloramentos) viram trechos separados: ache onde a espessura cruza ~0 e gere uma
  `Shape` por trecho com espessura (evita polígonos degenerados no earcut).
- Extruda cada `Shape` em z (`ExtrudeGeometry`, `bevelEnabled: false`) do fundo `Z0` até o plano de
  corte `ZF`. A face frontal (z = ZF) é o corte; topo e laterais mostram as camadas no diorama.
- Base escura ("pedestal") e uma sombra-blob (textura radial) dão cara de maquete.
- Geologia didática que explica a física: camadas inclinadas que afloram num morro (recarga em cota
  alta) + camadas pouco permeáveis acima e abaixo = aquífero confinado sob pressão.

## 2. Rasgo no plano de corte (`GeologicalLayers.tsx` → `LayerSolid`)

Para mostrar algo "cortado ao meio" dentro de um sólido (poço, tubo enterrado, raiz, cabo):
- divida cada camada em x: esquerda `[X0, x−r]`, direita `[x+r, X1]` (profundidade total) e a faixa do
  meio `[x−r, x+r]` em duas partes: acima da profundidade atual (rebaixada até `ZF − r`) e abaixo
  (profundidade total). A faixa do meio é regenerada quando a profundidade muda (perfuração animada).
- Um plano escuro semitransparente no fundo do rebaixo faz o rasgo ler como "buraco".
- Detalhes colados na face (grãos, pedriscos, fraturas) devem evitar ou sumir na faixa do rasgo.

## 3. Peças em corte: meio-anel extrudado (`ArtesianWell.tsx` → `halfRing`)

```ts
const s = new Shape();
s.absarc(0, 0, rOut, 0, Math.PI, false); // metade de trás (y da shape ≥ 0 → z ≤ 0 após rotacionar)
s.lineTo(-rIn, 0);
s.absarc(0, 0, rIn, Math.PI, 0, true);
s.lineTo(rOut, 0);
const g = new ExtrudeGeometry(s, { depth: altura, bevelEnabled: false, curveSegments: 12 });
g.rotateX(-Math.PI / 2); // extrusão vira +y
```

Com `rIn = 0` vira meio-cilindro sólido (coluna de água vista em corte). Empilhe anéis curtos com
vãos para um filtro ranhurado; use anéis de cores diferentes para revestimento, cimentação (selo),
pré-filtro. Acima do solo, troque pela peça inteira (cilindro completo).

## 4. Textura de material: instâncias (`GeologicalLayers.tsx` → `Scatter`, `Aquifer.tsx`)

- `InstancedMesh` de `IcosahedronGeometry(1, 0)` com escala/rotação/cor por instância (setado num
  `useLayoutEffect` quando a lista muda). Centenas de grãos num draw call.
- "Água nos poros": a face da camada em ciano + grãos bege por cima numa grade hexagonal com jitter;
  o azul que sobra entre os grãos é a água. Fraturas: faixas finas cianas sobre contorno escuro.

## 5. Fluidos e partículas (`Aquifer.tsx`, `WaterFlow.tsx`, `DrillingMachine.tsx`)

- **Fluxo contínuo**: `u = (semente + frame × velocidade) % 1`, posição ao longo de um caminho;
  escala zero perto de u=0/1 para não "piscar" no retorno. Convergência para um ponto (ex.: filtro):
  `lerp(pos, alvo, peso)` com peso gaussiano pela distância.
- **Nível subindo**: geometria de altura 1 escalada em y por `track("water.level")`.
- **Emitidas** (cascalho, gotas de jorro): para cada frame de nascimento `sf` em `[frame−N, frame]`,
  calcule `idade = frame − sf` e `p = p0 + v·idade + ½·g·idade²` com `v` semeado por `sf`; desenhe só
  se viva. Cor do cascalho = cor da camada na profundidade da broca no nascimento.
- **Jorro**: coluna (cilindro afunilado) + coroa + gotas em parábola para trás/lados (a frente do
  diorama é o corte) + poça em meio-disco. Use só quando o roteiro disser que a pressão basta.
- **Chuva/recarga**: riscos finos caindo em loop sobre a área de recarga + gotas descendo pela face
  até a camada que recarrega; nuvem = 5 icosaedros brancos.

## 6. Tubulações com fluxo (`WaterFlow.tsx` → `PipeRun`)

- `CatmullRomCurve3(pontos, false, "catmullrom", 0.08)` (cantos levemente arredondados) →
  `TubeGeometry(curva, 180, raio, 8)`. **Crescimento**: `geometry.setDrawRange(0, floor(grow·180)·8·6)`
  (índices do tubo são ordenados ao longo do caminho) — sem recriar geometria.
- Água correndo: esferas brilhantes em `curve.getPointAt(u)` dentro de um tubo metálico semitransparente
  (`opacity ~0.5`, `depthWrite: false`); só até a frente de fluxo `u ≤ track("pipe.flow")`.
- Roteie tubos para não passarem na frente do que precisa ser visto (ex.: janela da caixa d'água) e
  eleve um tubo sobre o outro onde se cruzam.

## 7. Reservatórios com janela de corte (`WaterReservoir.tsx`)

`cylinderGeometry` aberto com `thetaStart/thetaLength` deixando uma abertura voltada para a câmera
(`side: DoubleSide`) + cilindro de água com altura `nível × h`. Mostra o enchimento sem transparência
complexa.

## 8. Máquinas que entram e saem (`DrillingMachine.tsx`)

- Entrada "caindo" com spring (`damping ~10`): offset y = `(1 − drop)·3,2`, escala ramp nos primeiros
  instantes; overshoot (> 1) vira squash (achata y, alarga xz) em vez de afundar no chão.
- Partes articuladas por pivô (torre que se ergue: `rotation.z = −(1 − mast)·π/2`), cabeça que desce
  pela torre conforme a profundidade, broca girando por ângulo acumulado (integral de `drill.active`).
- Saída: inverta a trilha (`drop` 1→0, easing "in") — sobe e encolhe.

## 9. Vista explodida e destaques

- Cada camada num `group` com offset `[0, e·dy, e·dz]` (a de interesse avança em z); objetos da
  superfície acompanham a camada de cima. Volte a fechar antes de a narração mudar de assunto.
- Destaque de componente citado: `emissive` pulsando (`pulse(frame, período)`) no material; para
  camadas "pouco permeáveis", amarelo quente; para água, o próprio ciano.

## 10. Rótulos, setas e linhas de referência

- `WorldLabel` (2D nítido) ancorado por projeção da pose do frame — nunca texto 3D para informação.
- `Arrow3D` (haste + cone, orientado por quaternion) para força/pressão/fluxo, entrando com spring
  escalonado e "respirando" (±6–8%).
- Linhas de referência tracejadas (ex.: nível potenciométrico) com caixas finas ao longo de `y(x)`,
  revelação da esquerda para a direita; rotular com `WorldLabel`.

## 11. Tela dividida (`scenes/ComparisonScene.tsx`)

- Dois `ThreeCanvas` de 532×1920 com câmeras próprias (`usePose(pose)`), cada um com uma fatia do
  MESMO perfil (mesmas camadas, só muda a variável comparada). Slide-in/out com spring sobre o canvas
  principal, divisória branca, "destaque alternado" escurecendo o painel inativo (overlay ~0,5).
- Em 9:16 os painéis são estreitos: fatia de ~2 unidades, câmera a ~30 u, peças do poço um pouco
  maiores que no mundo principal, rótulos de duas linhas ao lado da peça central.

## 12. Abertura com mergulho e fundo (`TerrainCrossSection.tsx` → `GroundPlane`, `Background.tsx`)

- Chão contínuo grande ao redor do bloco (alfa radial) dá a sensação de "mundo"; a câmera desce abaixo
  do nível do solo, o chão some (face de trás não é desenhada) e o corte aparece; o chão encolhe
  durante a descida e é desmontado na cena seguinte.
- Fundo CSS atrás do canvas transparente: degradê interpolado pela altura da câmera
  (céu → azul profundo), com vinheta leve.
