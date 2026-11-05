import subprocess
import sys

import numpy as np

SR = 48000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
peak = np.max(np.abs(x))
print(f"peak {20*np.log10(peak):.2f} dBFS, samples >= -0.1dBFS: {int(np.sum(np.abs(x) >= 0.989))}")
for s in range(0, int(len(x) / SR)):
    seg = x[s * SR : (s + 1) * SR]
    rms = np.sqrt(np.mean(seg**2))
    pk = np.max(np.abs(seg))
    print(f"{s:2d}s rms {20*np.log10(rms+1e-9):6.1f}  peak {20*np.log10(pk+1e-9):6.1f}")
