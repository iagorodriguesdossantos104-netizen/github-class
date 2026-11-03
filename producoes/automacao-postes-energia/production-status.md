# Status de produção — Automação dos postes de energia

- **Fase atual:** CONCLUÍDO (2026-11-03 16:30).
- **Roteiro:** v1, aprovado pelo usuário em 2026-11-03 14:42 ("eu aprovo").
- **Vídeo:** `C:\Users\not\Desktop\video-postes\out\automacao-postes.mp4` (render no PC do usuário; o ambiente na nuvem tinha npm/pip bloqueados).
- **Medido (ffprobe/ebur128):** H.264 1080×1920, 30 fps, 2700 frames, 90,0 s; AAC 48 kHz; −14,0 LUFS integrado, pico real −1,5 dBTP.
- **Narração:** edge-tts pt-BR-AntonioNeural (+8 %), 74,6 s de fala; cortes derivados da voz real.
- **Verificações feitas:** `tsc --noEmit`; 42 stills revisados em folhas de contato; correções de câmera (árvore, telão do centro de operação, caminhão), rótulos e espaçamento das legendas; frames extraídos do MP4 final conferidos.
- **Não verificado:** o áudio não foi ouvido (só medido).
- **Ajustes técnicos sem mudança de conteúdo:** poses de câmera reescritas para o mapa do diorama; faíscas da árvore apagam quando o religador abre; concorrência do render = nº de núcleos (2).
- **Renderizar de novo:** na pasta do projeto, `npx remotion render AutomacaoPostes out/automacao-postes-raw.mp4 --gl=angle --concurrency=2 --crf=17` e depois `py scripts/loudnorm.py out/automacao-postes-raw.mp4 out/automacao-postes.mp4`.
