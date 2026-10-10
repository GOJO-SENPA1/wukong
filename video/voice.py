"""Synthesize the voiceover with Piper and derive the film's timing from it.

Every line of script.json is spoken separately, trimmed, and laid on a
timeline; word times are estimated inside each line (pauses at punctuation
are detected in the audio, words in between are spread by length). Writes:
  timing.js   window.TIMING, read by film.html (committed, so a render works without Piper)
  vo/vo.wav   the voiceover track at 48 kHz (input to audio.py)

  python voice.py --model en-us-ryan-high.onnx [--piper path/to/piper]
"""
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = Path(__file__).parent
SR = 48000


def synth(piper, model, text, length_scale):
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        subprocess.run(
            [piper, "-m", model, "-f", f.name, "--length-scale", str(length_scale), "--sentence-silence", "0.18"],
            input=text.encode(), check=True, capture_output=True,
        )
        sr, a = wavfile.read(f.name)
    a = a.astype(np.float32) / 32768.0
    if a.ndim > 1:
        a = a.mean(axis=1)
    from math import gcd
    g = gcd(SR, sr)
    return resample_poly(a, SR // g, sr // g).astype(np.float32)


def envelope(a, hop=480):
    n = len(a) // hop
    frames = a[: n * hop].reshape(n, hop)
    return np.sqrt((frames ** 2).mean(axis=1) + 1e-12), hop


def trim(a):
    env, hop = envelope(a)
    on = np.where(env > env.max() * 0.03)[0]
    s = max(0, on[0] * hop - 960)
    e = min(len(a), (on[-1] + 1) * hop + 1920)
    return a[s:e]


def speech_segments(a):
    env, hop = envelope(a)
    voiced = env > env.max() * 0.04
    segs, start = [], None
    for i, v in enumerate(voiced):
        if v and start is None:
            start = i
        if not v and start is not None:
            segs.append([start, i])
            start = None
    if start is not None:
        segs.append([start, len(voiced)])
    return [(s * hop / SR, e * hop / SR) for s, e in segs]


def word_times(text, a):
    """Phrases split at punctuation map onto the widest silences; words share a phrase by length."""
    phrases = [p.strip() for p in re.split(r"(?<=[,.;:?!])\s+", text) if p.strip()]
    segs = speech_segments(a)
    dur = len(a) / SR
    if len(phrases) > 1 and len(segs) >= len(phrases):
        gaps = sorted(range(len(segs) - 1), key=lambda i: segs[i + 1][0] - segs[i][1], reverse=True)
        cuts = sorted(gaps[: len(phrases) - 1])
        bounds, s0 = [], segs[0][0]
        for c in cuts:
            bounds.append((s0, segs[c][1]))
            s0 = segs[c + 1][0]
        bounds.append((s0, segs[-1][1]))
    else:
        bounds = [(segs[0][0], segs[-1][1])] if len(phrases) == 1 else None
        if bounds is None:
            total = sum(len(p) for p in phrases)
            bounds, t = [], 0.0
            for p in phrases:
                bounds.append((t, t + dur * len(p) / total))
                t += dur * len(p) / total
    words = []
    for p, (b0, b1) in zip(phrases, bounds):
        ws = p.split()
        weights = [len(re.sub(r"[^\w]", "", w)) + 1.5 for w in ws]
        total, t = sum(weights), b0
        for w, k in zip(ws, weights):
            d = (b1 - b0) * k / total
            words.append({"w": w, "t0": round(t, 3), "t1": round(t + d, 3)})
            t += d
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--piper", default="piper")
    args = ap.parse_args()

    script = json.loads((HERE / "script.json").read_text())
    v = script["voice"]
    t = v["lead"]
    track, lines, scenes = [], {}, []
    for si, scene in enumerate(script["scenes"]):
        s_start = t
        for li, line in enumerate(scene["lines"]):
            a = trim(synth(args.piper, args.model, line.get("say", line["text"]), v["lengthScale"]))
            words = word_times(line["text"], a)
            lines[line["id"]] = {
                "scene": scene["id"], "text": line["text"],
                "start": round(t, 3), "end": round(t + len(a) / SR, 3),
                "words": [{**w, "t0": round(t + w["t0"], 3), "t1": round(t + w["t1"], 3)} for w in words],
            }
            track.append((t, a))
            t += len(a) / SR + v["gapAfterLine"] + line.get("hold", 0)
            print(f"{line['id']:>8}  {lines[line['id']]['start']:6.2f}–{lines[line['id']]['end']:6.2f}  {line['text']}")
        t += v["gapAfterScene"] - v["gapAfterLine"]
        scenes.append({"id": scene["id"], "start": round(s_start, 3)})
    duration = round(t + v["tail"], 3)
    for i, s in enumerate(scenes):
        s["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else duration

    out = np.zeros(int(duration * SR) + SR, dtype=np.float32)
    for start, a in track:
        i = int(start * SR)
        out[i : i + len(a)] += a
    out = out[: int(duration * SR)]
    out *= 0.89 / max(1e-6, np.abs(out).max())
    (HERE / "vo").mkdir(exist_ok=True)
    wavfile.write(HERE / "vo" / "vo.wav", SR, (out * 32767).astype(np.int16))

    timing = {"duration": duration, "scenes": scenes, "lines": lines}
    (HERE / "timing.js").write_text(
        "// Generated by voice.py from script.json: when each scene, line and word is spoken.\n"
        f"window.TIMING = {json.dumps(timing, indent=1)};\n"
    )
    print(f"duration {duration:.2f}s → timing.js, vo/vo.wav")


if __name__ == "__main__":
    main()
