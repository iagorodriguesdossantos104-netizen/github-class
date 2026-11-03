# Status de produção — Automação dos postes de energia

- **Fase atual:** Fase 2 em andamento — implementação escrita; instalação, narração e render serão feitos no PC do usuário (o ambiente na nuvem bloqueou npm/pip).
- **Versão do roteiro:** v1 (2026-11-03)
- **Arquivos:** `producoes/automacao-postes-energia/roteiro.md`, `scene-plan.ts`, `production-status.md`
- **Preferências / premissas:** 90 s, 1080×1920, 30 fps, pt-BR, público leigo, narração informal e ágil;
  recorte = automação da rede aérea de distribuição (religador, chaves, chave NA, self-healing).
- **TTS planejado:** edge-tts `pt-BR-AntonioNeural` (gratuito). Nenhum serviço pago autorizado.
- **Aprovação:** roteiro v1 aprovado pelo usuário em 2026-11-03 14:42 (mensagem "eu aprovo").
- **Pendências da Fase 2:** criar projeto Remotion, gerar narração, realinhar cortes à voz, construir o
  diorama, efeitos/trilha, stills + folhas de contato, render MP4, loudnorm, verificações com ffprobe.
- **Nada foi renderizado, compilado ou ouvido até agora.**

- **Projeto:** `producoes/automacao-postes-energia/video/` (composição `AutomacaoPostes`).
- **Ajuste técnico:** poses de câmera reescritas para o mapa do diorama (conteúdo e narração inalterados); faíscas da árvore apagam quando o religador abre.
