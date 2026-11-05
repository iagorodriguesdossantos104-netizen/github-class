# Status de produção — E se a camada de ozônio sumisse por 10 minutos?

- **Fase atual:** CONCLUÍDO (2026-11-05 14:04).
- **Roteiro:** v1, aprovado pelo usuário em 2026-11-05 13:30 ("aprovado").
- **Vídeo:** `C:\Users\not\Desktop\videos\ozonio-10-minutos\out\ozonio.mp4` (render no PC do usuário).
- **Medido (ffprobe/ebur128):** H.264 1080×1920, 30 fps, 2700 frames, 90,0 s; AAC; −14,0 LUFS integrado, pico −1,5 dBTP.
- **Narração:** edge-tts pt-BR-AntonioNeural; a +8 % não coube (fim em 89,9 s), regerada a +12 %; fala termina em ~87,1 s.
- **Verificações feitas:** `tsc --noEmit` no PC; 45 + 18 stills revisados em folhas de contato; 14 quadros extraídos do MP4 final conferidos.
- **Correções durante a revisão:** raios somem nos closes (fade por distância de câmera), mais finos; cortes secos entre praia,
  planeta, pele e olho; núcleo/DNA à frente do bloco de pele; olho (íris, pupila, pálpebras); hospital realocado e banhistas
  somem à noite; relógio linear 00:00→10:00; rótulos UV ancorados em raios reais; rótulo "CAMADA DE OZÔNIO"; câmera da faixa
  vista de baixo; plâncton maior.
- **Limitações:** o áudio não foi ouvido (só medido); a voz está a +12 % (limite recomendado).
- **Renderizar de novo:** no `1-PREPARAR` aberto, gravar `render` em `logs/pedido.txt`, ou `node scripts/stills.mjs 9999` na pasta.
