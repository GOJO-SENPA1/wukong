"""Soundtrack for the promo: a 90 BPM beat (a low-passed beat from the first
frame, the 808 and a lead hook on the icon ring's drop, breakdown under the ink,
outro on the logo) plus effects on the promo's cue list. Synthesized, like
audio.py, whose effects it reuses.

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


def lead(f, dur=0.3, decay=0.16):
    tone = 0.6 * np.sign(np.sin(2 * np.pi * f * t_(dur))) + saw(f, dur, 0.003) + 0.5 * saw(f, dur, -0.003)
    return lp(tone, 4200) * env(dur, 0.003, decay)


def snare():
    body = np.sin(2 * np.pi * np.cumsum(np.linspace(230, 170, int(0.12 * SR))) / SR) * env(0.12, 0.001, 0.04)
    rattle = norm(bp(noise(0.2), 1500, 7000)) * env(0.2, 0.001, 0.06)
    return add(0.7 * body, rattle)


def music(duration):
    n = int((duration + 2) * SR)
    drums, low, keys, pads, hook = (np.zeros(n) for _ in range(5))
    kicks = []

    def put(buf, t, x, gain=1.0):
        i = int(t * SR)
        if 0 <= i < n:
            m = min(len(x), n - i)
            buf[i : i + m] += gain * x[:m]

    def kick_at(t, gain):
        put(drums, t, K, gain)
        kicks.append((t, gain))

    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am7 Fmaj7 Cmaj7 G7
    roots = [33, 29, 36, 31]
    # the hook: five notes per bar on a syncopated eighth-note grid
    rhythm = [0, 2, 3, 5, 7]
    melody = [[76, 79, 81, 84, 81], [84, 81, 79, 76, 79], [76, 79, 84, 86, 88], [86, 84, 83, 79, 81]]
    K, C, S, HH, OH = kick(), clap(), snare(), hat(), hat(True)

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

    # pickup: the first frame lands on a kick, the 808 and a G7 pad, so the sound starts at 0s
    kick_at(0.0, 1.0)
    put(low, 0.0, bass808(midi(31), 1.4 * BEAT), 0.5)
    put(pads, 0.0, pad(chords[3], PHASE), 0.07)

    t = PHASE - 4 * BEAT
    while t < duration + 1:
        if t >= -0.01:
            sec = section(t)
            bar = int(np.floor((t - PHASE) / (4 * BEAT) + 1e-6))
            pos = int(round((t - PHASE) / BEAT)) % 4
            ch, root = chords[bar % 4], roots[bar % 4]
            if pos == 0 and sec != "end":
                put(pads, max(0, t), pad(ch, 4 * BEAT), 0.07 if sec in ("intro", "break", "outro") else 0.05)
            if sec == "intro":  # a lo-fi beat from the first frame (low-passed below)
                if pos in (0, 2):
                    kick_at(t, 0.95)
                if pos == 2:
                    kick_at(t + 0.75 * BEAT, 0.6)
                if pos in (1, 3):
                    put(drums, t, S, 0.45)
                for s in range(2):
                    put(drums, t + s * BEAT / 2, HH, 0.14)
                if pos == 0:
                    put(low, t, bass808(midi(root), 1.8 * BEAT), 0.5)
            if sec == "build":
                if pos in (0, 2):
                    kick_at(t, 1.0)
                if pos in (1, 3):
                    put(drums, t, C, 0.4)
                for s in range(2):
                    put(drums, t + s * BEAT / 2, HH, 0.16)
                if pos == 0:
                    put(low, t, bass808(midi(root), 1.8 * BEAT), 0.5)
                if t >= 5.0 - 0.01:  # snare roll into the drop
                    steps = 4 if pos == 2 else 8
                    for s in range(steps):
                        put(drums, t + s * BEAT / steps, S, 0.2 + 0.2 * (pos == 3) + 0.2 * s / steps)
                for s in range(2):
                    put(keys, t + s * BEAT / 2, pluck(midi(ch[(pos + s) % 4] + 12)), 0.09)
            if sec == "full":
                if pos in (0, 2):
                    kick_at(t, 1.0)
                if pos == 2:
                    kick_at(t + 0.75 * BEAT, 0.7)
                if pos in (1, 3):
                    put(drums, t, C, 0.55)
                    put(drums, t, S, 0.25)
                for s in range(2):
                    put(drums, t + s * BEAT / 2, HH, 0.2)
                put(drums, t + BEAT / 2, OH, 0.06)
                if pos == 3:  # hat roll into the next bar
                    for s in range(4):
                        put(drums, t + BEAT / 2 + s * BEAT / 8, HH, 0.13)
                if pos == 0:
                    put(low, t, bass808(midi(root), 1.4 * BEAT), 0.65)
                if pos == 2:
                    put(low, t + 0.75 * BEAT, bass808(midi(root + 7 - 12 if root > 30 else root + 7), 0.9 * BEAT), 0.55)
                for s in range(4):
                    nn = ch[(pos * 2 + s) % 4] + 12
                    put(keys, t + s * BEAT / 4, pluck(midi(nn)), 0.08)
                if pos == 0:
                    for r, nn in zip(rhythm, melody[bar % 4]):
                        put(hook, t + r * BEAT / 2, lead(midi(nn)), 0.16)
            if sec == "break":
                for s in range(2):
                    put(drums, t + s * BEAT / 2, HH, 0.12)
                if pos == 0:
                    put(low, t, bass808(midi(root), 2.2 * BEAT), 0.45)
                    for r, nn in zip(rhythm, melody[bar % 4]):
                        put(hook, t + r * BEAT / 2, lead(midi(nn)), 0.1)
            if sec == "outro":
                kick_at(t, 0.85 if pos in (0, 2) else 0.5)
                for s in range(2 if t < 20.3 else 4):
                    put(drums, t + s * BEAT / (2 if t < 20.3 else 4), HH, 0.15)
                if pos == 0:
                    put(low, t, bass808(midi(root), 2.0 * BEAT), 0.5)
        t += BEAT

    # the logo lands at 21.0: one last kick, the tonic on the bass and the hook's last note
    kick_at(21.0, 1.1)
    put(low, 21.0, bass808(midi(33), 2.4), 0.6)
    put(hook, 21.0, lead(midi(81), 1.6, 0.6), 0.12)
    put(pads, 21.0, pad([57, 60, 64, 67], 2.6), 0.08)

    # pump: the pads, keys and hook duck under each kick
    duck = np.ones(n)
    for kt, g in kicks:
        i = int(kt * SR)
        if 0 <= i < n:
            m = min(int(0.3 * SR), n - i)
            duck[i : i + m] = np.minimum(duck[i : i + m], 1 - 0.55 * min(g, 1) * np.exp(-np.arange(m) / (0.09 * SR)))
    # dotted-eighth echo on the hook
    d = int(0.75 * BEAT * SR)
    echo = np.zeros(n)
    echo[d:] += 0.35 * hook[:-d]
    echo[2 * d :] += 0.15 * hook[: -2 * d]
    mix = drums + 1.2 * low + duck * (keys + pads + hook + lp(echo, 2500))
    # the intro and the break run through a low-pass (lo-fi, but you still hear the beat)
    filt = lp(mix, 1600) * 1.4
    tt = np.arange(n) / SR
    w = np.ones(n)
    w[tt < 3.667] = 0
    w[(tt >= 13.667) & (tt < 15.667)] = 0.3
    edge = int(0.25 * SR)
    for e in (3.667, 15.667):
        i = int(e * SR)
        w[max(0, i - edge) : i] = np.linspace(w[max(0, i - edge)], 1, min(edge, i))
    mix = w * mix + (1 - w) * filt
    cr = crackle(4.2)
    mix[: len(cr)] += 0.12 * cr * np.linspace(1, 0.3, len(cr))
    return mix[:n]


def main():
    cues = json.loads((HERE / "out" / "promo-cues.json").read_text())
    duration = cues["duration"]
    n = int((duration + 1.5) * SR)
    bed = norm(music(duration)[:n], 0.8)
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
    fx *= 0.4
    rl, rr = reverb(fx * 0.5 + bed * 0.2, 1.4, 0.2)
    st = np.stack([bed + fx + rl, bed + fx + rr], axis=1)
    st = np.tanh(st * 1.6) / np.tanh(1.6)
    st = st[: int((duration + 0.3) * SR)]
    fade = int(0.35 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st = st / np.abs(st).max() * 0.9
    wavfile.write(HERE / "out" / "promo-mix.wav", SR, (st * 32767).astype(np.int16))
    print("wrote out/promo-mix.wav")


if __name__ == "__main__":
    main()
