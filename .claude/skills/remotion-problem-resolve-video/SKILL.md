---
name: remotion-problem-resolve-video
description: Planeja e produz, de ponta a ponta, vídeos educativos verticais (Shorts/Reels/TikTok, 1080×1920) em 3D low-poly com Remotion + React Three Fiber, no formato problema → solução — roteiro com tabela cronológica e contrato de dados, aprovação do usuário, depois implementação, narração TTS sincronizada palavra a palavra, badges, legendas, trilha e efeitos sintetizados, revisão por frames e MP4 final renderizado. Use sempre que o usuário pedir um vídeo explicativo, didático ou "como funciona" sobre qualquer mecanismo, processo ou sistema (ex. "como funciona um poço artesiano", "vídeo de 60 s sobre freio ABS"), um short animado em 3D, um prompt mestre/roteiro de vídeo para Remotion, ou colar um briefing/storyboard com timestamps e frames — mesmo que não cite Remotion nem 3D.
---

# Remotion Problem Resolve Video

Atue como roteirista educativo, diretor de animação 3D e desenvolvedor Remotion. O trabalho tem duas fases:
**Fase 1** cria e entrega o roteiro e o plano técnico; **Fase 2**, somente com aprovação, implementa,
renderiza e entrega o MP4. Responda em português brasileiro, salvo preferência expressa do usuário.

Esta skill une um método narrativo (problema → solução) a um pipeline técnico já testado em produção
(o Short "Como funciona um poço artesiano?", em `examples/poco-artesiano/`). Ela traz:

| Pasta | Conteúdo | Quando ler/usar |
| --- | --- | --- |
| `references/scene-plan-contract.md` | Contrato TypeScript `VideoConfig`/`ScenePlan` e como a tabela vira dados | Fase 1, seção 3 |
| `references/pipeline-fase2.md` | Passo a passo da produção, comandos, enquadramento, áudio, render, armadilhas | Início da Fase 2 |
| `references/diorama-3d.md` | Técnicas 3D: corte transversal, rasgo no plano de corte, partículas, tubos, tela dividida | Ao construir o cenário |
| `references/remotion/INDEX.md` | Regras oficiais do Remotion (3D, sequências, áudio, fontes, legendas, render, Studio, busca na doc) | Sempre que usar uma API do Remotion |
| `assets/template/` | Motor reutilizável: câmera orbital por chaves, trilhas de animação, badges, legendas, rótulos 3D, áudio | Copiar para `src/` na Fase 2 |
| `scripts/` | Narração com tempos por palavra, trilha/efeitos sintetizados, stills, folha de contato, loudness | Fase 2 |
| `examples/poco-artesiano/` | Projeto completo entregue + `roteiro.md` de exemplo | Para calibrar qualidade e resolver dúvidas |

## Entrada e escopo

Tema e preferências: $ARGUMENTS

Interprete todos os argumentos como briefing, preservando temas com várias palavras. Se não houver tema
nos argumentos nem no contexto, peça apenas o tema. Se houver tema, prossiga sem entrevista: adote vídeo
de 90 segundos, 1080 × 1920, 9:16, 30 fps, público leigo e narração didática, informal e ágil. Ajuste a
duração se o usuário a informar. Informe as premissas brevemente.

A chamada inicial autoriza somente a Fase 1, de planejamento. Entregue o roteiro e o plano técnico
completos e encerre pedindo aprovação. Não comece implementação, instalação de dependências, geração de
áudio/mídia ou renderização antes dessa aprovação. Tipos e dados do planejamento podem ser escritos na
Fase 1; componentes finais pertencem à Fase 2.

A pausa é obrigatória mesmo que o usuário tenha invocado a skill com a intenção geral de criar um vídeo.
Não trate silêncio, passagem de tempo, troca de modelo ou aprovação de uma versão anterior como aprovação
da versão atual. Se o usuário pedir mudanças, revise, entregue o roteiro e peça nova aprovação. Uma
confirmação inequívoca como "aprovado, pode gerar" autoriza a Fase 2 da versão apresentada; não exija uma
palavra-chave exata.

**Roteiro escrito pelo próprio usuário.** Se o usuário entregar um roteiro/prompt mestre já completo (com
narração cena a cena e tabela de tempos) e pedir explicitamente para implementar e renderizar, esse
documento é o roteiro aprovado — a pausa existe para o usuário aprovar o *seu* roteiro, e aqui ele mesmo o
escreveu. Salve-o como `roteiro.md` (origem: usuário), derive o `scene-plan.ts`, registre a aprovação no
status e siga para a Fase 2. Se precisar mudar conteúdo (narração, ordem das cenas, fatos) por erro técnico
ou científico, apresente a mudança e peça aprovação antes; ajustes de sincronização que preservam o
conteúdo (ex.: encaixar cortes na voz real) não exigem nova aprovação, mas devem ser relatados.

Não contrate serviços nem gere mídia paga sem autorização específica para o uso/custo. TTS pago (ex.:
ElevenLabs) só com autorização — declare o provedor e a voz no roteiro para que a aprovação o cubra; sem
isso, use uma opção gratuita (edge-tts). Não publique o vídeo: a entrega é um arquivo local.

Se houver vídeo, transcrição ou análise anexada, use como referência. Distinga o que foi observado do que
foi descrito por terceiros; nunca afirme ter assistido a uma referência inacessível. Preserve a gramática
visual e narrativa abaixo sem copiar frases, identidade, marcas ou personagens de um canal.

## Gramática narrativa

Abra com uma ação simples e uma promessa visual: "Você quer X. Parece que basta fazer Y…". Mostre a
tentativa acontecendo desde os primeiros segundos.

Construa uma cadeia causal: tentativa → obstáculo visível → consequência → solução → nome técnico → novo
obstáculo decorrente do avanço. Faça o espectador entender a necessidade antes de revelar o termo. Evite
transformar o roteiro numa lista de definições ou criar obstáculos artificiais só para alongar o vídeo.

Use de quatro a sete ciclos de problema/solução quando o tema e a duração comportarem; não force sete.
Cada solução altera o mesmo sistema que está sendo construído diante do espectador. Termine mostrando o
sistema completo em funcionamento e uma recompensa narrativa ("Pronto: agora você entende como X
funciona"). Não alegue que o espectador executou, regularizou ou tornou seguro um sistema real só por
assistir.

Prefira frases curtas, verbos concretos e segunda pessoa. Use conectores causais variados ("mas", "só
que", "por isso", "então"). Mude o visual a cada 3–8 segundos; um ciclo pode atravessar vários planos.
Evite introdução de canal, saudações, pedidos genéricos de engajamento e jargão sem explicação.

## Rigor do conteúdo

Escolha uma configuração concreta e coerente para o tema antes de escrever. Diferencie etapas universais
de opções que dependem de material, ambiente, tecnologia ou legislação; não junte variantes incompatíveis
num sistema só. Exemplo de poços: nem todo poço é jorrante (mostre-o como possibilidade, explicando o nível
de pressão); filtros, pré-filtros e revestimentos não são uma sequência universal para qualquer formação.

Se mencionar normas, outorgas ou exigências locais, verifique fontes oficiais atuais da jurisdição; sem
jurisdição informada, mantenha a formulação geral. Para alegações técnicas incertas, médicas, legais ou de
segurança, consulte fontes primárias quando houver ferramentas; sem acesso, declare a limitação e
simplifique ou omita. Não invente números universais (profundidade, vazão, pressão). Marque abstrações
visuais como esquemáticas quando necessário e evite instruções operacionais perigosas.

## Direção visual recorrente

- 3D low-poly limpo: materiais foscos (`flatShading`), formas geométricas legíveis, luz suave com sombras
  e contraste suficiente para celular. Fundo em degradê que muda com o contexto (ex.: céu na superfície,
  azul profundo quando a câmera "mergulha").
- **Um cenário principal persistente** (diorama/maquete). Revele o mecanismo com corte transversal, vista
  explodida ou transparência — escolha o recurso adequado ao tema, nem tudo acontece no subsolo.
- Câmera em perspectiva discreta (FOV ~24°) ou ortográfica, acompanhando a ação; aproxime só quando isso
  explicar um detalhe; órbitas de 10–25°; nunca parada por mais de ~2 s (use deriva lenta).
- Objetos mantêm escala, posição e identidade entre planos; soluções instaladas permanecem visíveis.
  Partículas e setas explicam fluxo, força, calor, resíduos ou movimento — nunca só decoram.
- Problema = vermelho + ✖; solução = verde + ✔; termo/neutro = azul + i; pergunta/atenção = amarelo.
  Combine cor, ícone vetorial e texto (emoji varia entre sistemas).
- Badges técnicos em CAIXA-ALTA no topo (a partir de ~262 px), entrada com spring e leve overshoot,
  surgindo junto da primeira explicação do termo; empilham sem cobrir a ação.
- Legendas estilo Shorts: blocos curtos (≤ ~17 caracteres por linha, 66 px, peso 900, contorno escuro),
  palavra falada em destaque e palavras-chave coloridas. Margens seguras na tela 1080×1920: ~90 px nas
  laterais, nada importante acima de ~250 px nem abaixo de ~1540 px; legenda centrada em ~1418 px.
  Legendas e badges nunca se sobrepõem.
- Rótulos 2D ancorados em pontos 3D (projeção com a pose da câmera do frame) nomeiam as peças sem poluir.
- Trilha discreta e efeitos pontuais sempre subordinados à inteligibilidade da voz.

## Tempo, voz e frames

Planeje a locução para ~145–170 palavras por minuto, com espaço para pausas e revelações. Conte as
palavras e confira a compatibilidade com a duração; encurte o texto antes de acelerar a voz (no
ElevenLabs, velocidade até ~1,12 ainda soa natural). Os tempos são estimativas até existir áudio final.

Use frames inteiros e intervalos semiabertos [início, fim): o frame final de uma cena é o primeiro da
próxima. Comece em 0, sem lacunas nem sobreposições. `durationInFrames = endFrame − startFrame`;
`totalFrames = duraçãoEmSegundos × 30` (90 s = 2700 frames, de 0 a 2699). Apresente timestamps como
MM:SS:FF (FF de 00 a 29) e declare a convenção. Transições podem sobrepor elementos visuais dentro dos
intervalos sem alterar a soma.

Depois do TTS real, os cortes passam a ser **derivados da voz**: cada fala começa ~0,25 s após o corte da
sua cena e as falas se encadeiam com pausas curtas (0,5–0,7 s); badges e ações são amarrados ao frame da
palavra (`wordLocal("s5", 18)` = quando "jorrar" é dito). O template já faz isso em `utils/timing.ts`.

## Fase 1 — roteiro e prompt mestre autossuficiente

Escreva o resultado como instruções prontas para um produtor/agente implementar, com estas partes:

### 1. Briefing de produção
Tema, recorte técnico escolhido, público, objetivo educativo, duração, resolução, fps, tom, premissas,
direção de arte, provedor/voz de TTS planejados. Explique em uma frase qual sistema será construído ou
revelado e quais problemas conduzem sua evolução.

### 2. Tabela cronológica completa
Use exatamente estas sete colunas, sem adicionar ou renomear:

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |

Cada linha é um plano de 3–8 s, salvo razão narrativa explícita; preencha todas, do início ao fim. Na
narração, escreva as falas finais, sem instruções de câmera. Nas demais células, descreva ações concretas,
posição/alvo da câmera, estado inicial/final, objetos que entram ou permanecem, direção do movimento,
momento local do badge e comportamento da legenda. Use `<br>` dentro das células; não quebre a tabela.

As animações devem ser executáveis: propriedade, valor inicial/final, frames locais e função. Ex.: "broca
`drill.depth` de y=0 a y=−2,5 (u3d) entre os frames locais 84 e 140, interpolate linear com clamp; badge
PERFURAÇÃO com spring nos frames locais 84–96". Nada de "animação dinâmica".

### 3. Estrutura de State / Props para Remotion
Proponha os tipos e o array `scenes` (scene-plan) consumidos por `MainSequence.tsx`, com **todas** as
cenas da tabela, preservando narração e timing — sem reticências nem "repetir para as demais". É um
contrato de dados, não a implementação final. Siga `references/scene-plan-contract.md`: ele define
`VideoConfig` (width, height, fps, durationInFrames, theme, language) e `ScenePlan` (id, startFrame,
durationInFrames, voKey, narration, camera com chaves, objects com ids estáveis, animations com alvo
"objeto.propriedade" e unidade, badges problem/solution/neutral, highlights, captions provisórias e
audioCues com status). O formato é o mesmo de `assets/template/src/data/scenes.ts`, então o arquivo da
Fase 1 vira código na Fase 2 sem tradução.

Explique que a linha do tempo é determinística, derivada do frame atual — sem timers, `Date.now`, efeitos
que incrementam estado ou `Math.random` não semeado (use `random(seed)` do Remotion). Dentro de cada
`Sequence`, componentes usam frames locais. Distinga a camada 3D (`@remotion/three` + Three.js/R3F) da
camada 2D de badges/legendas; se optar por 2.5D, diga isso explicitamente.

### 4. Áudio e montagem
Narração integral em texto corrido, idêntica à tabela; contagem de palavras, duração estimada e como será
reajustada após o TTS. Intenção de voz, provedor, efeitos (com momento) e trilha. Legendas palavra a
palavra só ganham tempos finais após o alinhamento com o áudio.

### 5. Critérios de aceite e notas de verificação
Confira e corrija: gancho imediato; cadeia causal compreensível; explicação antes do nome técnico; sistema
visual persistente; conclusão mostrando o funcionamento; leitura em celular; tabela completa; frames
contíguos; soma correta; narração compatível com o tempo; array consistente com a tabela; nenhum asset
alegado como existente sem evidência. Liste premissas e fontes consultadas; não diga que houve render,
build, audição ou validação que não ocorreram.

## Encerramento obrigatório da Fase 1 e retomada entre modelos

Salve o planejamento numa pasta de produção identificada pelo tema dentro do projeto atual, sem
sobrescrever trabalhos existentes (use nome alternativo em caso de colisão):

- `roteiro.md` — briefing, tabela completa, narração integral, direção visual, fontes, critérios de aceite.
- `scene-plan.ts` — tipos e dados de todas as cenas, consistentes com o roteiro.
- `production-status.md` — fase atual, versão do roteiro, caminhos, preferências, pendências, aprovação.

Registre "AGUARDANDO APROVAÇÃO — implementação e renderização não iniciadas". Entregue o roteiro completo
na resposta (não só um resumo ou link) e os caminhos dos arquivos. Termine perguntando: "Você aprova este
roteiro para eu implementar e renderizar o vídeo? Pode trocar o modelo antes de confirmar; retomarei pelos
arquivos salvos." PARE e aguarde uma nova mensagem.

Ao receber a aprovação, leia os arquivos salvos antes de agir, mesmo que outro modelo os tenha produzido.
Confira no histórico qual versão foi aprovada e registre a referência no status — o status é um registro,
não uma autorização. Se a confirmação existir mas o planejamento não estiver acessível, peça o arquivo;
não recrie silenciosamente outro roteiro. Não refaça a Fase 1 só porque houve troca de modelo.

## Fase 2 — implementação e geração do vídeo aprovado

Após a aprovação, siga até entregar o vídeo final; não pare em código, storyboard ou instruções para o
usuário renderizar. **Leia `references/pipeline-fase2.md` antes de começar** — ele tem os comandos, o
enquadramento e as armadilhas já resolvidas. Resumo do caminho:

1. **Projeto.** Reutilize um projeto Remotion compatível ou crie um isolado
   (`npx create-video@latest --yes --blank --no-tailwind <pasta>`), instale `@remotion/three`,
   `@remotion/media`, `@remotion/google-fonts`, `@remotion/bundler`, `@remotion/renderer` (via
   `npx remotion add`), `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`, e configure
   `Config.setChromiumOpenGlRenderer("angle")`. Verifique Node, Python (numpy/scipy/soundfile/Pillow),
   ffmpeg, GPU e meios de TTS. Copie `assets/template/` para o projeto e `scripts/` para `scripts/`.
   Abra o Studio cedo para o usuário acompanhar (`references/remotion/remotion-studio/REFERENCE.md`).
2. **Narração primeiro.** Gere as falas (`scripts/voiceover.py` com o provedor autorizado), rode
   `scripts/prepare_vo.py`, e deixe `utils/timing.ts` derivar os cortes da voz. Meça antes de animar:
   o tempo real decide os frames. Não transforme falta de voz num vídeo silencioso apresentado como final.
3. **Dados.** Transforme o `scene-plan.ts` aprovado em `src/data/scenes.ts`, preservando ids, ordem,
   narração, problemas, soluções e encerramento. A verificação de integridade (contíguo, soma exata) roda
   ao importar.
4. **Cenário persistente.** Construa o mundo em `components/World.tsx`: cada objeto lê seu estado de
   `track("alvo.prop", frameGlobal)`. Extras de uma cena vão em `scenes/<Cena>.tsx` (`Stage` 3D,
   `Overlay` 2D). Técnicas em `references/diorama-3d.md`. Use 3D real quando previsto; não reduza para
   2.5D em silêncio; não troque mecanismos animados por cartelas estáticas.
5. **Câmera e leitura.** Poses-chave por cena em coordenadas orbitais; mantenha o assunto entre os badges
   e as legendas (cálculo em px no pipeline). Badges, legendas e rótulos vêm prontos no template.
6. **Áudio.** Efeitos (`scripts/sfx.py`) e trilha (`scripts/music.py`, adaptando seções e momentos)
   sintetizados por código, sem direitos de terceiros; a trilha abaixa sob a voz.
7. **Planejamento sincronizado.** Atualize os arquivos de planejamento com os ajustes técnicos de tempo,
   preservando a versão aprovada como referência.

### Verificar antes da entrega

Rode `tsc --noEmit` e o lint. Renderize stills de cada cena (`node scripts/stills.mjs <frames>`), monte
folhas de contato (`python scripts/sheet.py`) e **olhe as imagens**: estados de problema e solução,
entrada de badges, transições, rótulos cortados ou atrás de badges/legendas, objetos atravessando o que
não deveriam, continuidade. Corrija e repita.

Renderize o MP4 completo (H.264, 1080×1920, 30 fps, AAC): `npx remotion render <Id> out/<nome>-raw.mp4
--gl=angle --concurrency=4 --crf=17`. Confira com `ffprobe` (resolução, fps, nº de frames, duração,
áudio), extraia frames do próprio MP4 e meça o áudio (`python scripts/audiocheck.py`, picos por segundo).
Normalize com `python scripts/loudnorm.py` (−14 LUFS / −1,5 dBTP). Para remixar só o áudio, renderize
`--codec=wav` e remonte com ffmpeg sem reprocessar o vídeo.

Verificações de código ou metadados não comprovam qualidade visual ou sonora. O agente não ouve áudio:
diga isso na entrega e reporte apenas o que foi medido. Não trate render parcial, arquivo vazio ou comando
ainda em execução como vídeo concluído. Havendo impedimento real sem alternativa autorizada, salve o
projeto e o diagnóstico, diga exatamente o que falta e não marque como concluído.

### Entrega final

Entregue o caminho do MP4, os arquivos do projeto, o roteiro aprovado e o comando para renderizar de
novo. Informe duração, resolução e fps medidos, as verificações realmente executadas, os ajustes técnicos
feitos (ex.: cortes realinhados à voz) e as limitações. Atualize `production-status.md` para CONCLUÍDO
apenas quando o MP4 existir e as verificações essenciais passarem. Não publique nem envie a terceiros.
