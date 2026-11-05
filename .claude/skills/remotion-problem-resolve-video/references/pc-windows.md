# Fase 2 no PC do usuário (sessão na nuvem ligada a um Windows)

Use quando a sessão roda na nuvem **e** o ambiente não consegue instalar pacotes (npm/pip bloqueados) ou
não tem GPU, mas está ligada ao computador do usuário pelo app desktop (ferramentas `device_*`).
Testado em 2026-11 num Windows 10, Intel UHD, 2 núcleos: render de 90 s em ~8 min.

## O que funciona e o que não funciona

- `device_commit_files` grava arquivos numa pasta conectada; `device_stage_files` lê de volta (logs,
  stills, MP4); `device_list_dir` acompanha o progresso.
- **Não há terminal**: o controle de tela só dá clique simples em terminais e no Explorador (sem duplo
  clique, teclado ou clique direito). Não tente contornar. O usuário precisa dar **um** duplo clique no
  `.bat` uma vez; a partir daí tudo vai por arquivos.
- `device_commit_files` pode reenviar uma cópia antiga se o mesmo `stagedPath` for reutilizado: **use uma
  pasta nova em `/mnt/user-data/outputs/` a cada envio** (`v1/`, `v2/`…) e confira com `device_stage_files`.

## Passo a passo

1. Peça acesso a uma pasta existente (ex.: `~/Desktop`) com `device_request_folder_access`. Pastas
   `~/.claude` são protegidas.
2. Pasta de produção no PC: `<Desktop>/videos/<tema>/`. Se já existir um projeto anterior com
   `node_modules` (ex.: `<Desktop>/video-postes`), reaproveite: copie só `src/`, `scripts/`, `public/` vazio,
   `package.json`, `tsconfig.json`, `remotion.config.ts` e rode o `npm install` (rápido, cache).
3. Escreva o projeto aqui (template + cenas), cheque sintaxe com `esbuild` se houver, e envie todos os
   arquivos com `device_commit_files` (≤ 50 por chamada). Inclua `assets/windows/1-preparar.ps1` e o `.bat`
   na raiz do projeto, mais `scripts/narration.json` (texto da legenda) e `scripts/narration_tts.json`
   (texto enviado ao TTS, com grafias fonéticas como "sélf rílin").
4. Peça ao usuário **um** duplo clique em `1-PREPARAR (duplo clique).bat`. O script:
   instala Node/Python/ffmpeg via winget se faltar → `npm install` → `pip install` → narração edge-tts →
   `prepare_vo.py` → `fix_vo.py` → `sfx.py` → `music.py` → `tsc` → stills de revisão → **PRONTO** →
   fica num laço lendo `logs/pedido.txt`. Etapas já feitas são puladas numa nova execução.
   Desliga o QuickEdit do console (um clique na janela não pausa mais).
5. Pedidos (grave `logs/pedido.txt` com `device_commit_files`):
   - `stills 27 125 209 …` → apaga `out/stills`, roda `tsc` e renderiza esses frames.
   - `render` → `node scripts/stills.mjs 9999`: render completo com `logs/render-progress.txt`,
     `logs/render-log.txt` (erros com stack), loudnorm, `logs/ffprobe.txt`, `logs/audiocheck.txt`,
     `out/check-*.png`. Saída: `out/$NAME.mp4` (`NAME` padrão `video`).
   - `sair` → encerra.
   Status em `logs/status.txt` (INICIANDO/OK/ERRO/PRONTO).
6. Revise stills aqui: `device_stage_files` dos PNG, monte folhas de contato com PIL e olhe.
   Corrija, reenvie os arquivos e peça `stills` de novo. Depois `render`.
7. Entregue: `device_stage_files` do MP4 → copie para `/mnt/user-data/outputs/` → `SendUserFile`.
   Meça com `ffprobe` e `ffmpeg -af ebur128=peak=true` antes de entregar.
8. Use `send_later` (5–15 min) para voltar e checar logs enquanto o PC trabalha.

## Armadilhas vistas

- `--concurrency` maior que o nº de núcleos derruba o render: `stills.mjs` usa `os.cpus().length`.
- `python` pode ser o alias da Microsoft Store: o script testa `py`, `python`, `python3`.
- `.ps1` precisa de BOM UTF-8 no PowerShell 5.1 (acentos).
- `tsc` com `noUnusedLocals` falha por variável não usada — rode o esbuild aqui antes de enviar.
- Duas sessões gravando a mesma pasta geram pedidos cruzados; mantenha uma só.
