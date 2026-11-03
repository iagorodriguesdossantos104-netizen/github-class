# Renderiza o MP4 final, mede e normaliza o áudio.
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force logs | Out-Null
"INICIO RENDER $(Get-Date -Format s)" | Set-Content -Encoding utf8 logs\status-render.txt
Start-Transcript -Path logs\2-renderizar.txt -Force | Out-Null
$env:PYTHONUTF8 = "1"
function Mark($m) { $m | Add-Content -Encoding utf8 logs\status-render.txt; Write-Host "### $m" }
function Has($c) { $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }
$PY = "python"; if (Has "py") { $PY = "py" }
function Step($name, [scriptblock]$cmd) {
  Mark "INICIANDO $name"
  & $cmd
  if ($LASTEXITCODE -ne 0) { Mark "ERRO $name (codigo $LASTEXITCODE)"; Stop-Transcript | Out-Null; Read-Host "Deu erro. Pode fechar esta janela"; exit 1 }
  Mark "OK $name"
}
Step "render" { npx remotion render AutomacaoPostes out/automacao-postes-raw.mp4 --gl=angle --concurrency=2 --crf=17 }
Step "loudnorm" { & $PY scripts/loudnorm.py out/automacao-postes-raw.mp4 out/automacao-postes.mp4 }
Step "ffprobe" { ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -show_entries format=duration out/automacao-postes.mp4 | Tee-Object -FilePath logs\ffprobe.txt }
Step "audiocheck" { & $PY scripts/audiocheck.py out/automacao-postes.mp4 | Tee-Object -FilePath logs\audiocheck.txt }
foreach ($t in @(4, 20, 45, 70, 88)) { ffmpeg -v error -y -ss $t -i out/automacao-postes.mp4 -frames:v 1 -vf scale=540:-1 "out/check-$t.png" }
Mark "PRONTO"
Stop-Transcript | Out-Null
Read-Host "Terminou! Pode fechar esta janela"
