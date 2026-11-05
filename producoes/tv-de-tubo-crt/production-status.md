# Status de produção — Como funciona uma TV de tubo?

- **Fase atual:** FASE 2 EM ANDAMENTO — projeto escrito; falta rodar no PC (narração, efeitos, trilha, stills, render).
- **Roteiro:** v1, aprovado pelo usuário em 2026-11-05 11:04 ("aprovado").
- **Projeto:** `producoes/tv-de-tubo-crt/video/` (cópia do que vai para `C:\Users\not\Desktop\videos\tv-de-tubo\`).
- **Ambiente:** a nuvem tem npm/pip bloqueados → render no PC Windows do usuário (2 núcleos, Intel UHD).
- **Ajustes técnicos sem mudança de conteúdo:** distâncias de câmera recalculadas para o quadro vertical
  (TV inteira a d≈30, tela inteira a d≈19); `bg.inside` volta a 0 na cena 12 (TV na sala) e a 1 na 13;
  `screen.power` desliga a tela na cena 2; botão do ânodo no topo do funil do modelo (y≈1,1);
  "TV" enviado ao TTS como "tevê"; a legenda mostra "quinhentas e vinte e cinco" por extenso.
- **Verificado até aqui:** sintaxe (esbuild) e integridade das cenas (15 cenas contíguas, soma 2700).
- **Pendências:** TTS edge-tts → cortes pela voz; `tsc`; stills e folhas de contato; render; loudnorm; ffprobe.
