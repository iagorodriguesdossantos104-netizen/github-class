# Instala dependências, gera narração/efeitos/trilha e renderiza frames de revisão.
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force logs | Out-Null
"INICIO $(Get-Date -Format s)" | Set-Content -Encoding utf8 logs\status.txt
Start-Transcript -Path logs\1-preparar.txt -Force | Out-Null
$env:PYTHONUTF8 = "1"
function Mark($m) { $m | Add-Content -Encoding utf8 logs\status.txt; Write-Host "### $m" }
function RefreshPath { $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") }
function Has($c) { $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }
function Step($name, [scriptblock]$cmd) {
  Mark "INICIANDO $name"
  & $cmd
  if ($LASTEXITCODE -ne 0) { Mark "ERRO $name (codigo $LASTEXITCODE)"; Stop-Transcript | Out-Null; Read-Host "Deu erro. Pode fechar esta janela"; exit 1 }
  Mark "OK $name"
}

# ---- ferramentas
if (-not (Has "node")) { Mark "instalando Node.js"; winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent; RefreshPath }
if (-not (Has "ffmpeg")) { Mark "instalando ffmpeg"; winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements --silent; RefreshPath }
$PY = $null
foreach ($cand in @("py", "python", "python3")) {
  if (Has $cand) { & $cand -c "import sys; assert sys.version_info >= (3, 10)" 2>$null; if ($LASTEXITCODE -eq 0) { $PY = $cand; break } }
}
if (-not $PY) { Mark "instalando Python"; winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements --silent; RefreshPath; $PY = "py"; if (-not (Has "py")) { $PY = "python" } }
Mark "node: $(node -v) | python: $(& $PY --version) | ffmpeg: $((ffmpeg -version | Select-Object -First 1))"
$gpu = (Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join "; "
Mark "GPU: $gpu"

Step "npm install" { npm install --no-audit --no-fund }
Step "pip install" { & $PY -m pip install --user --disable-pip-version-check numpy scipy soundfile pillow edge-tts }
Step "narracao (edge-tts)" { & $PY scripts/voiceover.py --lines scripts/narration_tts.json --provider edge --voice pt-BR-AntonioNeural --rate "+8%" }
Step "prepare_vo" { & $PY scripts/prepare_vo.py }
Step "fix_vo" { & $PY scripts/fix_vo.py }
Step "efeitos" { & $PY scripts/sfx.py }
Step "trilha" { & $PY scripts/music.py }
Step "typescript" { npx tsc --noEmit }
$frames = (& $PY scripts/review_frames.py).Trim().Split(" ")
Mark "frames: $($frames -join ' ')"
Step "stills" { node scripts/stills.mjs @frames }
Mark "PRONTO"
Stop-Transcript | Out-Null
Read-Host "Terminou! Pode fechar esta janela"
