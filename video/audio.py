"""Sound for the film: a synthesized music bed plus sound effects on the
animation's cue list, ducked under the voiceover. Everything is generated
here (no samples), so the soundtrack is ours to publish.

  python audio.py            → out/mix.wav (voice + music + sfx), out/bed.wav (music + sfx, no voice)

Reads out/cues.json (node render.mjs --cues) and vo/vo.wav (python voice.py).
"""
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

HERE = Path(__file__).parent
SR = 48000
rng = np.random.default_rng(7)


# ---------- building blocks
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(dur, attack=0.002, decay=0.2, curve=1.0):
    t = t_(dur)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-4) * curve)
    return a * d


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def sweep_sine(f0, f1, dur, curve="exp"):
    t = t_(dur)
    f = f0 * (f1 / f0) ** (t / dur) if curve == "exp" else f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def swept_bp(x, f0, f1, q=1.2, block=256):
    """Band-pass whose centre glides from f0 to f1 (log), block by block."""
    out = np.zeros_like(x)
    n = len(x)
    zi = None
    for i in range(0, n, block):
        k = i / max(1, n - 1)
        fc = f0 * (f1 / f0) ** k
        lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 - 100)
        b, a = butter(2, [lo, hi], btype="band", fs=SR)
        if zi is None:
            zi = np.zeros(max(len(a), len(b)) - 1)
        out[i : i + block], zi = lfilter(b, a, x[i : i + block], zi=zi)
    return out


def saw(freq, dur, detune=0.0):
    t = t_(dur)
    ph = (t * freq * (1 + detune)) % 1.0
    return 2 * ph - 1


def add(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[: len(x)] += x
    return out


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


# ---------- sound effects
def sfx_hit(g=1.0):
    body = sweep_sine(110, 42, 0.6) * env(0.6, 0.001, 0.22)
    crack = lp(noise(0.08), 3500) * env(0.08, 0.0005, 0.02)
    thwack = bp(noise(0.12), 700, 2200) * env(0.12, 0.001, 0.035)
    return g * add(0.9 * body, 0.5 * norm(crack), 0.35 * norm(thwack))


def sfx_thud(g=1.0):
    return g * 0.7 * sweep_sine(90, 50, 0.35) * env(0.35, 0.001, 0.09)


def sfx_drop(g=1.0):
    x = sfx_hit(1.0)
    sub = np.sin(2 * np.pi * 44 * t_(1.6)) * env(1.6, 0.005, 0.5)
    out = np.zeros(len(sub))
    out[: len(x)] += x
    return g * (out + 0.8 * sub)


def sfx_whoosh(g=1.0, dur=0.42, f0=350, f1=4200):
    x = swept_bp(noise(dur), f0, f1, q=1.5)
    t = t_(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    return g * 0.5 * norm(x * shape)


def sfx_swish(g=1.0):
    return sfx_whoosh(g * 0.8, 0.22, 1500, 7000)


def sfx_riser(g=1.0, dur=1.5):
    x = swept_bp(noise(dur), 300, 6000, q=2.0)
    tone = sweep_sine(180, 1400, dur) * 0.25
    t = t_(dur)
    shape = (t / dur) ** 2.2
    return g * 0.55 * norm((norm(x) + tone) * shape)


def sfx_tick(g=1.0):
    return g * 0.35 * norm(hp(noise(0.012), 3000)) * env(0.012, 0.0002, 0.0025)


def sfx_type(g=1.0):
    out = np.zeros(int(0.16 * SR))
    for k in range(rng.integers(2, 4)):
        c = hp(noise(0.01), 1800 + rng.random() * 1500) * env(0.01, 0.0002, 0.0018)
        i = int((k * 0.045 + rng.random() * 0.012) * SR)
        out[i : i + len(c)] += norm(c) * (0.6 + 0.4 * rng.random())
    return g * 0.22 * out


def sfx_pop(g=1.0):
    return g * 0.45 * sweep_sine(520, 1150, 0.07) * env(0.07, 0.001, 0.025)


def sfx_click(g=1.0):
    out = np.zeros(int(0.1 * SR))
    for i0 in (0, int(0.055 * SR)):
        c = bp(noise(0.006), 2000, 6000) * env(0.006, 0.0002, 0.0012)
        out[i0 : i0 + len(c)] += norm(c)
    return g * 0.4 * out


def sfx_lock(g=1.0):
    t = t_(0.3)
    metal = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1180, 1), (1870, 0.7), (2650, 0.5), (3420, 0.35)])
    return g * (0.25 * metal * env(0.3, 0.0005, 0.045) + 0.5 * sfx_thud(1.0)[: len(t)])


def bell(freqs, dur=1.1, decay=0.35):
    t = t_(dur)
    return sum(np.sin(2 * np.pi * f * t) * a for f, a in freqs) * env(dur, 0.002, decay)


def sfx_ding(g=1.0):
    return g * 0.22 * bell([(1046.5, 1), (2093, 0.4), (3140, 0.18), (1568, 0.25)])


def sfx_coin(g=1.0):
    a = bell([(1318.5, 1), (2637, 0.35)], 0.5, 0.12)
    b = bell([(1975.5, 1), (3951, 0.3)], 0.9, 0.3)
    out = np.zeros(int(0.07 * SR) + len(b))
    out[: len(a)] += a
    out[int(0.07 * SR) :] += b
    return g * 0.2 * out


def sfx_buzz(g=1.0):
    t = t_(0.24)
    sq = np.sign(np.sin(2 * np.pi * 98 * t)) + np.sign(np.sin(2 * np.pi * 103.5 * t))
    return g * 0.16 * lp(sq, 1600) * env(0.24, 0.004, 0.12)


def sfx_glitch(g=1.0):
    dur = 0.42
    n = int(dur * SR)
    out = np.zeros(n)
    sl = int(0.021 * SR)
    for i in range(0, n, sl):
        r = rng.random()
        if r < 0.55:
            seg = noise(sl / SR) if r < 0.3 else np.sign(np.sin(2 * np.pi * (200 + rng.random() * 1600) * t_(sl / SR)))
            seg = np.round(seg * 4) / 4  # crush
            out[i : i + sl] = seg[: len(out[i : i + sl])] * (0.4 + rng.random() * 0.6)
    return g * 0.32 * lp(out, 7000) * np.linspace(1, 0.3, n)


def sfx_swell(g=1.0):
    dur = 0.55
    x = swept_bp(noise(dur), 200, 3000, q=1.2)
    return g * 0.45 * norm(x) * (t_(dur) / dur) ** 2


SFX = {
    "hit": sfx_hit, "thud": sfx_thud, "drop": sfx_drop, "whoosh": sfx_whoosh, "swish": sfx_swish, "tick": sfx_tick,
    "type": sfx_type, "pop": sfx_pop, "click": sfx_click, "lock": sfx_lock, "ding": sfx_ding, "coin": sfx_coin,
    "buzz": sfx_buzz, "glitch": sfx_glitch, "swell": sfx_swell,
}
# Sounds that should *arrive* at the cue (they build up to it) are placed ending there.
LEAD_IN = {"swell": 0.55, "whoosh": 0.22, "swish": 0.11}


# ---------- music
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def music(duration, drops):
    """120 BPM bed in A minor (Am F C G). drops: {'in': t, 'break': (t0, t1), 'outro': t, 'end': t}."""
    bpm = 120
    beat = 60 / bpm
    phase = drops["in"] % (4 * beat)  # bar lines land on the first drop
    n = int(duration * SR) + SR * 3
    drums = np.zeros(n)
    bass = np.zeros(n)
    keys = np.zeros(n)
    pad = np.zeros(n)
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
    roots = [33, 29, 36, 31]

    kick = sweep_sine(150, 48, 0.32) * env(0.32, 0.001, 0.09)
    click = norm(hp(noise(0.004), 2000)) * env(0.004, 0.0001, 0.001)
    kick[: len(click)] += 0.3 * click
    hat = norm(hp(noise(0.05), 8000)) * env(0.05, 0.0005, 0.012)
    clap = np.zeros(int(0.2 * SR))
    for k in range(3):
        b = norm(bp(noise(0.15), 1100, 2600)) * env(0.15, 0.0005, 0.03 if k < 2 else 0.07)
        i = int(k * 0.011 * SR)
        clap[i : i + len(b)] += b[: len(clap) - i]

    def put(buf, t, x, g=1.0):
        i = int(t * SR)
        if 0 <= i < len(buf):
            m = min(len(x), len(buf) - i)
            buf[i : i + m] += g * x[:m]

    t_end = drops["end"]
    b0, b1 = drops["break"]
    full = lambda t: drops["in"] <= t < b0 or b1 <= t < t_end  # noqa: E731
    t = phase - 4 * beat * 2
    while t < duration + 2:
        if t >= 0:
            bar = int(round((t - phase) / beat)) // 4
            ch = chords[bar % 4]
            pos = int(round((t - phase) / beat)) % 4
            if full(t):
                put(drums, t, kick, 1.0)
                put(drums, t + beat / 2, hat, 0.22)
                if pos in (1, 3) and t >= b1:
                    put(drums, t, clap, 0.32)
                for e in range(2):
                    tb = t + e * beat / 2
                    f = midi(roots[bar % 4])
                    note = lp(saw(f, beat / 2 * 0.95) + 0.5 * saw(f, beat / 2 * 0.95, 0.004), 380) * env(beat / 2 * 0.95, 0.004, 0.16)
                    put(bass, tb, note, 0.55)
            if t >= drops["in"] - 4 * beat * 2 and t < t_end + beat * 2:
                for s in range(4):
                    ts = t + s * beat / 4
                    nn = ch[(pos * 4 + s) % 3] + 12 * (1 + (s % 2))
                    pl = (np.sign(np.sin(2 * np.pi * midi(nn) * t_(0.16))) * 0.5 + saw(midi(nn), 0.16)) * env(0.16, 0.002, 0.05)
                    put(keys, ts, lp(pl, 2600), 0.09)
            if pos == 0:
                dur = 4 * beat
                tone = sum(saw(midi(nn), dur, d) for nn in ch for d in (-0.003, 0.003))
                tone = lp(tone, 1300) * np.minimum(1, t_(dur) / 0.35) * np.minimum(1, (dur - t_(dur)) / 0.3)
                put(pad, t, tone, 0.035)
        t += beat

    # sidechain the bass and pad to the kick
    pump = np.ones(n)
    t = phase
    while t < duration + 2:
        if full(t):
            i = int(t * SR)
            seg = 1 - 0.6 * np.exp(-t_(beat) / 0.07)
            m = min(len(seg), n - i)
            if i >= 0:
                pump[i : i + m] *= seg[:m]
        t += beat
    bass *= pump
    pad *= 0.5 + 0.5 * pump

    mix = drums + bass + keys + pad
    # intro and breakdown run through a low-pass that opens into each drop
    filt = lp(mix, 650)
    w = np.ones(n)
    tt = np.arange(n) / SR
    w[tt < drops["in"]] = 0
    w[(tt >= b0) & (tt < b1)] = 0
    ramp = int(0.25 * SR)
    for edge in (drops["in"], b1):
        i = int(edge * SR)
        w[max(0, i - ramp) : i] = np.linspace(0, 1, min(ramp, i))
    mix = w * mix + (1 - w) * filt * 1.3
    return mix[: int(duration * SR) + SR * 3], keys


def reverb(x, secs=1.8, mix=0.25):
    ir_l = rng.standard_normal(int(secs * SR)) * np.exp(-t_(secs) / (secs / 5))
    ir_r = rng.standard_normal(int(secs * SR)) * np.exp(-t_(secs) / (secs / 5))
    ir_l, ir_r = lp(ir_l, 6000), lp(ir_r, 6000)
    l = fftconvolve(x, ir_l)[: len(x)]
    r = fftconvolve(x, ir_r)[: len(x)]
    s = np.abs(x).max() / max(1e-9, max(np.abs(l).max(), np.abs(r).max()))
    return mix * l * s, mix * r * s


def main():
    cues = json.loads((HERE / "out" / "cues.json").read_text())
    duration = cues["duration"]
    sc = cues["scenes"]
    drop_in = next(c["t"] for c in cues["cues"] if c["kind"] == "drop")
    drops = {"in": drop_in, "break": (sc["crazy"][0], sc["caught"][0]), "end": sc["cta"][1] - 1.2}

    n = int(duration * SR) + SR * 3
    bed, _ = music(duration, drops)
    bed = bed[:n]

    fx = np.zeros(n)
    kinds = [c for c in cues["cues"]]
    for i, c in enumerate(kinds):
        k = c["kind"]
        if k == "riser":
            nxt = next((d["t"] for d in kinds[i + 1 :] if d["kind"] in ("drop", "glitch", "hit") and d["t"] > c["t"] + 0.2), c["t"] + 1.5)
            x = sfx_riser(c["gain"], min(3.4, max(0.3, nxt - c["t"])))
            start = c["t"]
        else:
            x = SFX[k](c["gain"])
            start = c["t"] - LEAD_IN.get(k, 0)
        j = int(start * SR)
        if j < 0:
            x, j = x[-j:], 0
        m = min(len(x), n - j)
        fx[j : j + m] += x[:m]

    # voice
    voice = np.zeros(n)
    if (HERE / "vo" / "vo.wav").exists():
        _, vo = wavfile.read(HERE / "vo" / "vo.wav")
        vo = vo.astype(np.float64) / 32768
        voice[: min(n, len(vo))] = vo[:n]
    else:
        print("no vo/vo.wav (run voice.py): writing the bed without a voice")
    # duck the bed under the voice
    rms = np.sqrt(lp(voice ** 2, 12, order=1).clip(0))
    duck = 1 - 0.55 * np.clip(rms / (rms.max() * 0.35 + 1e-9), 0, 1) if rms.max() > 0 else np.ones(n)
    duck = lp(duck, 8, order=1)

    bed = norm(bed, 0.30)
    fx = fx * 0.55
    rl, rr = reverb(fx * 0.6 + bed * 0.3, 1.6, 0.22)
    pan = np.sin(np.arange(n) / SR * 0.9) * 0.08
    left_bed = bed * duck * (1 - pan) + fx * 0.95 + rl
    right_bed = bed * duck * (1 + pan) + fx * 0.95 + rr
    for name, with_voice in (("mix", True), ("bed", False)):
        l = left_bed + (voice * 0.95 if with_voice else 0)
        r = right_bed + (voice * 0.95 if with_voice else 0)
        st = np.stack([l, r], axis=1)
        st = np.tanh(st * 1.1) / np.tanh(1.1)  # soft limit
        st = st[: int((duration + 0.4) * SR)]
        fade = int(0.4 * SR)
        st[-fade:] *= np.linspace(1, 0, fade)[:, None]
        st = st / np.abs(st).max() * 0.9
        wavfile.write(HERE / "out" / f"{name}.wav", SR, (st * 32767).astype(np.int16))
        print(f"wrote out/{name}.wav")


if __name__ == "__main__":
    main()
