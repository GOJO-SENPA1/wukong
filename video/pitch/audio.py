"""Soundtrack for the pitch: a soft synth pad under the voiceover, ducked while the voice speaks.

  python audio.py        reads vo/vo.wav, writes ../out/pitch-mix.wav
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = Path(__file__).parent
SR = 48000

# Clean the voice first: cut rumble, a little less boxiness, a little more presence, gentle compression.
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-i", str(HERE / "vo" / "vo.wav"),
    "-af", "highpass=f=80,equalizer=f=280:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.4:g=2.5,equalizer=f=9000:t=q:w=1:g=1,"
           "acompressor=threshold=-21dB:ratio=2.5:attack=6:release=120:makeup=2",
    "-ar", str(SR), str(HERE / "vo" / "vo-clean.wav"),
], check=True)
sr, vo = wavfile.read(HERE / "vo" / "vo-clean.wav")
vo = vo.astype(np.float32) / 32768.0
n = len(vo)
t = np.arange(n) / SR
timing = json.loads(re.search(r"window\.TIMING = (.*);", (HERE / "timing.js").read_text(), re.S).group(1))

# A minor progression, four bars per chord at 84 BPM.
bpm = 84
beat = 60 / bpm
chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]
bar = 4 * beat
pad = np.zeros(n, np.float32)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
for k in range(int(t[-1] / (2 * bar)) + 1):
    start = k * 2 * bar
    chord = chords[k % len(chords)]
    i0, i1 = int(start * SR), min(n, int((start + 2 * bar + 1.2) * SR))
    if i0 >= n:
        break
    tt = t[i0:i1] - start
    env = np.minimum(1, tt / 1.4) * np.minimum(1, np.maximum(0, (2 * bar + 1.2 - tt) / 1.2))
    for j, m in enumerate(chord):
        f = hz(m)
        detune = 1 + 0.0025 * (j - 1.5)
        pad[i0:i1] += env * (np.sin(2 * np.pi * f * detune * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + j)) * 0.08
    # a low root note
    pad[i0:i1] += env * np.sin(2 * np.pi * hz(chord[0] - 12) * tt) * 0.10
pad = sosfilt(butter(2, 1800, "low", fs=SR, output="sos"), pad).astype(np.float32)

# a soft pulse on each beat
pulse = np.zeros(n, np.float32)
k = np.arange(int(0.18 * SR)) / SR
click = (np.sin(2 * np.pi * 55 * k) * np.exp(-k * 22)).astype(np.float32) * 0.22
for b in np.arange(0, t[-1], beat):
    i = int(b * SR)
    pulse[i : i + len(click)] += click[: max(0, min(len(click), n - i))]

bed = pad + pulse
# fade in and out; a short swell into the closing line
bed *= np.minimum(1, t / 2.5) * np.minimum(1, np.maximum(0, (t[-1] - t) / 2.5))

# duck under the voice
win = int(0.05 * SR)
env = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same"))
speaking = (env > 0.01).astype(np.float32)
smooth = np.convolve(speaking, np.ones(int(0.4 * SR)) / int(0.4 * SR), mode="same")
duck = 1 - 0.7 * np.clip(smooth, 0, 1)
mix = vo * 1.0 + bed * duck * 0.4
mix *= 0.9 / np.abs(mix).max()
out = HERE.parent / "out"
out.mkdir(exist_ok=True)
wavfile.write(out / "pitch-mix.wav", SR, (mix * 32767).astype(np.int16))
print(f"wrote out/pitch-mix.wav ({n / SR:.1f}s)")
