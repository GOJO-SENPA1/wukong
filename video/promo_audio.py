"""Soundtrack for the promo: a 90 BPM beat (lo-fi intro, 808 drop on the icon
ring, breakdown under the ink, outro on the logo) plus effects on the promo's
cue list. Synthesized, like audio.py, whose effects it reuses.

  node render.mjs --page promo.html --size 1440x1080 --cues   → out/promo-cues.json
  python promo_audio.py                                        → out/promo-mix.wav
"""
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile

from audio import LEAD_IN, SFX, SR, add, bp, env, hp, lp, noise, norm, reverb, saw, sfx_riser, sweep_sine, t_

HERE = Path(__file__).parent
BEAT = 60 / 90
PHASE = 1.0  # bar lines land on 1.0, 3.667, 6.333 (the drop), ...


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def kick():
    body = sweep_sine(165, 46, 0.38) * env(0.38, 0.001, 0.11)
    click = norm(hp(noise(0.005), 2500)) * env(0.005, 0.0001, 0.0012)
    return add(body, 0.35 * click)


def clap():
    out = np.zeros(int(0.25 * SR))
    for k in range(4):
        b = norm(bp(noise(0.18), 900, 3200)) * env(0.18, 0.0005, 0.02 if k < 3 else 0.09)
        i = int(k * 0.009 * SR)
        out[i : i + len(b)] += b[: len(out) - i]
    return out


def hat(open_=False):
    d = 0.22 if open_ else 0.05
    return norm(hp(noise(d), 7500)) * env(d, 0.0005, 0.06 if open_ else 0.012)


def bass808(f, dur):
    t = t_(dur)
    glide = f * (1 + 0.6 * np.exp(-t / 0.03))
    tone = np.sin(2 * np.pi * np.cumsum(glide) / SR)
    return np.tanh(2.2 * tone) * env(dur, 0.003, 0.45)


def pluck(f, dur=0.22):
    tone = saw(f, dur) + 0.6 * np.sign(np.sin(2 * np.pi * f * t_(dur)))
    return lp(tone, 3200) * env(dur, 0.002, 0.06)


def pad(notes, dur):
    tone = sum(saw(midi(n), dur, d) for n in notes for d in (-0.004, 0.004))
    return lp(tone, 1100) * np.minimum(1, t_(dur) / 0.4) * np.minimum(1, (dur - t_(dur)) / 0.4)


def crackle(dur):
    out = np.zeros(int(dur * SR))
    rng = np.random.default_rng(3)
    for i in rng.integers(0, len(out) - 200, int(dur * 9)):
        out[i : i + 120] += rng.standard_normal(120) * np.exp(-np.arange(120) / 18) * rng.uniform(0.2, 1)
    return hp(out, 1500)


def music(duration):
    n = int((duration + 2) * SR)
    drums, low, keys, pads = (np.zeros(n) for _ in range(4))

    def put(buf, t, x, gain=1.0):
        i = int(t * SR)
        if 0 <= i < n:
            m = min(len(x), n - i)
            buf[i : i + m] += gain * x[:m]

    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am7 Fmaj7 Cmaj7 G7
    roots = [33, 29, 36, 31]
    K, C, HH, OH = kick(), clap(), hat(), hat(True)

    def section(t):
        if t < 3.667:
            return "intro"
        if t < 6.333:
            return "build"
        if t < 13.667:
            return "full"
        if t < 15.667:
            return "break"
        if t < 19.0:
            return "full"
        if t < 21.0:
            return "outro"
        return "end"

    beat_i = 0
    t = PHASE - 4 * BEAT
    while t < duration + 1:
        if t >= -0.01:
            sec = section(t)
            bar = int(np.floor((t - PHASE) / (4 * BEAT) + 1e-6))
            pos = int(round((t - PHASE) / BEAT)) % 4
            ch, root = chords[bar % 4], roots[bar % 4]
            if pos == 0 and sec != "end":
                put(pads, max(0, t), pad(ch, 4 * BEAT), 0.05 if sec in ("intro", "break", "outro") else 0.035)
            if sec == "build":
                if pos in (0, 2):
                    put(drums, t, K, 0.8)
                if pos in (1, 3):
                    put(drums, t, C, 0.25)
                put(drums, t + BEAT / 2, HH, 0.12)
            if sec == "full":
                if pos in (0, 2):
                    put(drums, t, K, 1.0)
                if pos == 2:
                    put(drums, t + 0.75 * BEAT, K, 0.7)
                if pos in (1, 3):
                    put(drums, t, C, 0.45)
                for s in range(2):
                    put(drums, t + s * BEAT / 2, HH, 0.16)
                if pos == 3:  # hat roll into the next bar
                    for s in range(4):
                        put(drums, t + BEAT / 2 + s * BEAT / 8, HH, 0.1)
                if pos == 0:
                    put(low, t, bass808(midi(root), 1.4 * BEAT), 0.55)
                if pos == 2:
                    put(low, t + 0.75 * BEAT, bass808(midi(root + 7 - 12 if root > 30 else root + 7), 0.9 * BEAT), 0.45)
                for s in range(4):
                    nn = ch[(pos * 2 + s) % 4] + 12
                    put(keys, t + s * BEAT / 4, pluck(midi(nn)), 0.07)
            if sec == "break":
                for s in range(2):
                    put(drums, t + s * BEAT / 2, HH, 0.09)
                if pos == 0:
                    put(low, t, bass808(midi(root), 2.2 * BEAT), 0.35)
            if sec == "outro":
                if pos == 0:
                    put(drums, t, K, 0.7)
                put(drums, t + BEAT / 2, HH, 0.08)
        t += BEAT
        beat_i += 1

    mix = drums + low + keys + pads
    # the intro and the break run through a low-pass
    filt = lp(mix, 900)
    tt = np.arange(n) / SR
    w = np.ones(n)
    w[tt < 3.667] = 0
    w[(tt >= 13.667) & (tt < 15.667)] = 0.35
    edge = int(0.12 * SR)
    for e in (3.667, 15.667):
        i = int(e * SR)
        w[max(0, i - edge) : i] = np.linspace(w[max(0, i - edge)], 1, min(edge, i))
    mix = w * mix + (1 - w) * filt
    cr = crackle(4.2)
    mix[: len(cr)] += 0.05 * cr * np.linspace(1, 0.2, len(cr))
    return mix[:n]


def main():
    cues = json.loads((HERE / "out" / "promo-cues.json").read_text())
    duration = cues["duration"]
    n = int((duration + 1.5) * SR)
    bed = norm(music(duration)[:n], 0.6)
    fx = np.zeros(n)
    kinds = cues["cues"]
    for i, c in enumerate(kinds):
        k = c["kind"]
        if k == "riser":
            nxt = next((d["t"] for d in kinds[i + 1 :] if d["kind"] in ("drop", "hit") and d["t"] > c["t"] + 0.3), c["t"] + 1.2)
            x, start = sfx_riser(c["gain"], min(2.6, max(0.4, nxt - c["t"]))), c["t"]
        else:
            x, start = SFX[k](c["gain"]), c["t"] - LEAD_IN.get(k, 0)
        j = int(start * SR)
        if j < 0:
            x, j = x[-j:], 0
        m = min(len(x), n - j)
        fx[j : j + m] += x[:m]
    fx *= 0.5
    rl, rr = reverb(fx * 0.5 + bed * 0.2, 1.4, 0.2)
    st = np.stack([bed + fx + rl, bed + fx + rr], axis=1)
    st = np.tanh(st * 1.15) / np.tanh(1.15)
    st = st[: int((duration + 0.3) * SR)]
    fade = int(0.35 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st = st / np.abs(st).max() * 0.9
    wavfile.write(HERE / "out" / "promo-mix.wav", SR, (st * 32767).astype(np.int16))
    print("wrote out/promo-mix.wav")


if __name__ == "__main__":
    main()
