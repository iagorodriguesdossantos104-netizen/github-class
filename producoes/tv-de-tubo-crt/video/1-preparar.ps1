# Instala dependências, gera narração/efeitos/trilha, renderiza frames de revisão
# e depois fica aguardando pedidos simples em logs\pedido.txt ("stills 0 120 ...", "render", "sair").
$ErrorActionPreference = "Continue"
# Desliga o "modo de seleção" do console: um clique na janela não pausa mais o script.
Add-Type -Namespace W -Name C -MemberDefinition '[DllImport("kernel32.dll")] public static extern IntPtr GetStdHandle(int h); [DllImport("kernel32.dll")] public static extern bool GetConsoleMode(IntPtr h, out uint m); [DllImport("kernel32.dll")] public static extern bool SetConsoleMode(IntPtr h, uint m);' -ErrorAction SilentlyContinue
try { $h = [W.C]::GetStdHandle(-10); $m = 0; [void][W.C]::GetConsoleMode($h, [ref]$m); [void][W.C]::SetConsoleMode($h, (($m -band (-bnot 0x40)) -bor 0x80)) } catch {}
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force logs | Out-Null
"INICIO $(Get-Date -Format s)" | Set-Content -Encoding utf8 logs\status.txt
Start-Transcript -Path logs\1-preparar.txt -Force | Out-Null
$env:PYTHONUTF8 = "1"
function Mark($m) { $m | Add-Content -Encoding utf8 logs\status.txt; Write-Host "### $m" }
function RefreshPath { $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") }
function Has($c) { $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }
function Step($name, [scriptblock]$cmd, [bool]$fatal = $true) {
  Mark "INICIANDO $name"
  & $cmd
  if ($LASTEXITCODE -ne 0) {
    Mark "ERRO $name (codigo $LASTEXITCODE)"
    if ($fatal) { Stop-Transcript | Out-Null; Read-Host "Deu erro. Pode fechar esta janela"; exit 1 }
    return $false
  }
  Mark "OK $name"
  return $true
}

# ---- ferramentas
RefreshPath
if (-not (Has "node")) { Mark "instalando Node.js"; winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent; RefreshPath }
if (-not (Has "ffmpeg")) { Mark "instalando ffmpeg"; winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements --silent; RefreshPath }
$PY = $null
foreach ($cand in @("py", "python", "python3")) {
  if (Has $cand) { & $cand -c "import sys; assert sys.version_info >= (3, 10)" 2>$null; if ($LASTEXITCODE -eq 0) { $PY = $cand; break } }
}
if (-not $PY) { Mark "instalando Python"; winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements --silent; RefreshPath; $PY = "py"; if (-not (Has "py")) { $PY = "python" } }
Mark "node: $(node -v) | python: $(& $PY --version) | GPU: $((Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join '; ')"

if (-not (Test-Path "node_modules\remotion")) { $null = Step "npm install" { npm install --no-audit --no-fund } }
& $PY -c "import numpy, scipy, soundfile, PIL, edge_tts" 2>$null
if ($LASTEXITCODE -ne 0) { $null = Step "pip install" { & $PY -m pip install --user --disable-pip-version-check --no-warn-script-location numpy scipy soundfile pillow edge-tts } }
if ((Get-Item src\data\vo.json).Length -lt 100) {
  $null = Step "narracao (edge-tts)" { & $PY scripts/voiceover.py --lines scripts/narration_tts.json --provider edge --voice pt-BR-AntonioNeural --rate "+8%" }
  $null = Step "prepare_vo" { & $PY scripts/prepare_vo.py }
  $null = Step "fix_vo" { & $PY scripts/fix_vo.py }
  & $PY scripts/check_fit.py
  if ($LASTEXITCODE -ne 0) {
    Mark "narracao longa: regerando a +12%"
    $null = Step "narracao (edge-tts +12%)" { & $PY scripts/voiceover.py --lines scripts/narration_tts.json --provider edge --voice pt-BR-AntonioNeural --rate "+12%" }
    $null = Step "prepare_vo" { & $PY scripts/prepare_vo.py }
    $null = Step "fix_vo" { & $PY scripts/fix_vo.py }
    $null = Step "cabe em 90 s" { & $PY scripts/check_fit.py }
  }
}
if (-not (Test-Path "public\audio\sfx\chime.wav")) { $null = Step "efeitos" { & $PY scripts/sfx.py } }
if (-not (Test-Path "public\audio\music.wav")) { $null = Step "trilha" { & $PY scripts/music.py } }
$null = Step "typescript" { npx tsc --noEmit } $false
$frames = (& $PY scripts/review_frames.py).Trim().Split(" ")
Mark "frames: $($frames -join ' ')"
$null = Step "stills" { node scripts/stills.mjs @frames } $false
Mark "PRONTO"

# ---- aguarda pedidos (somente comandos fixos)
Write-Host ""
Write-Host "Aguardando pedidos de revisao/render do Claude. Deixe esta janela aberta (feche para encerrar)."
while ($true) {
  Start-Sleep -Seconds 4
  if (-not (Test-Path logs\pedido.txt)) { continue }
  $req = (Get-Content -Raw -Encoding utf8 logs\pedido.txt).Trim()
  Remove-Item logs\pedido.txt
  if ($req -eq "sair") { Mark "ENCERRADO"; break }
  elseif ($req -match '^stills( [0-9]{1,4})+$') {
    $fr = $req.Substring(7).Split(" ")
    Get-ChildItem out\stills\*.png -ErrorAction SilentlyContinue | Remove-Item
    $null = Step "typescript" { npx tsc --noEmit } $false
    $null = Step "stills" { node scripts/stills.mjs @fr } $false
    Mark "PRONTO"
  }
  elseif ($req -eq "render") {
    $ok = Step "render" { node scripts/stills.mjs 9999 } $false
    if ($ok) {
    }
    Mark "PRONTO"
  }
  else { Mark "PEDIDO IGNORADO: $req" }
}
Stop-Transcript | Out-Null
