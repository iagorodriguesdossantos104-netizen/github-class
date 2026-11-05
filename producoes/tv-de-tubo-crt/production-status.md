# Status de produção — Como funciona uma TV de tubo?

- **Fase atual:** CONCLUÍDO (2026-11-05 12:43).
- **Roteiro:** v1, aprovado pelo usuário em 2026-11-05 11:04 ("aprovado").
- **Vídeo:** `C:\Users\not\Desktop\videos\tv-de-tubo\out\tv-de-tubo.mp4` (render no PC do usuário; a nuvem tinha npm/pip bloqueados).
- **Medido (ffprobe/ebur128):** H.264 1080×1920, 30 fps, 2700 frames, 90,0 s; AAC; −14,0 LUFS integrado, pico real −1,4 dBTP.
- **Narração:** edge-tts pt-BR-AntonioNeural (+8 %), 74,9 s de fala; cortes derivados da voz real.
- **Verificações feitas:** `tsc --noEmit`; 45 + 14 + 8 stills revisados em folhas de contato; 12 quadros extraídos do MP4 final conferidos.
- **Correções durante a revisão:** cabo do ânodo fora dos closes do canhão; cena 2 vista por dentro do tubo; máscara vista por trás;
  entrelaçamento desligado ao fim da cena 11; tríades somem antes do recuo da cena 14; rótulos finais e título reposicionados;
  materiais do gabinete/sala sempre `transparent` (no render contínuo o gabinete ficava opaco).
- **Ajustes técnicos sem mudança de conteúdo:** distâncias de câmera para o quadro vertical; fundo volta à sala na cena 12;
  "TV" enviado ao TTS como "tevê"; legenda mostra "quinhentas e vinte e cinco" por extenso.
- **Limitações:** o áudio não foi ouvido (só medido); a cena do fósforo (≈8–13 s) é a menos legível.
- **Renderizar de novo:** na pasta do projeto, `node scripts/stills.mjs 9999` (render + loudnorm + ffprobe), ou dentro do `1-PREPARAR` gravar `render` em `logs/pedido.txt`.
