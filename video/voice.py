"""Synthesize the voiceover with edge-tts and derive the film's timing from it.

Every line of script.json is spoken separately; word-level timestamps come
directly from the TTS engine (no guessing from audio energy). Writes:
  timing.js   window.TIMING, read by film.html (committed so render works without TTS)
  vo/vo.wav   the voiceover track at 48 kHz (input to audio.py)

  python voice.py [--voice en-US-AndrewNeural] [--rate +0%] [--pitch +0Hz]

Voices: en-US-AndrewNeural (warm/confident, default), en-US-BrianNeural (casual),
        en-US-GuyNeural (passionate), en-US-ChristopherNeural (authoritative)
"""
import argparse
import asyncio
import io
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = Path(__file__).parent
SR = 48000


async def synth_line(text, voice, rate, pitch):
    """Speak one line, return (audio_f32_48k, word_boundaries)."""
    import edge_tts

    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    audio_chunks = []
    words = []

    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({
                "text": chunk["text"],
                "offset": chunk["offset"] / 10_000_000,
                "duration": chunk["duration"] / 10_000_000,
            })

    mp3_data = b"".join(audio_chunks)
    with tempfile.NamedTemporaryFile(suffix=".mp3") as tmp_mp3, \
         tempfile.NamedTemporaryFile(suffix=".wav") as tmp_wav:
        tmp_mp3.write(mp3_data)
        tmp_mp3.flush()
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp_mp3.name,
             "-ar", str(SR), "-ac", "1", "-f", "wav", tmp_wav.name],
            check=True, capture_output=True,
        )
        sr, a = wavfile.read(tmp_wav.name)

    a = a.astype(np.float32) / 32768.0
    if a.ndim > 1:
        a = a.mean(axis=1)
    if sr != SR:
        from math import gcd
        g = gcd(SR, sr)
        a = resample_poly(a, SR // g, sr // g).astype(np.float32)

    a = trim(a)
    return a, words


def envelope(a, hop=480):
    n = len(a) // hop
    frames = a[: n * hop].reshape(n, hop)
    return np.sqrt((frames ** 2).mean(axis=1) + 1e-12), hop


def trim(a):
    env, hop = envelope(a)
    on = np.where(env > env.max() * 0.03)[0]
    if len(on) == 0:
        return a
    s = max(0, on[0] * hop - 960)
    e = min(len(a), (on[-1] + 1) * hop + 1920)
    return a[s:e]


def map_words(display_text, tts_words, timeline_offset, audio_duration):
    """Map TTS word boundaries onto display text words, adjusted to timeline position."""
    display_words = display_text.split()
    if not tts_words:
        total = sum(len(w) + 1 for w in display_words)
        t = 0.0
        result = []
        for w in display_words:
            d = audio_duration * (len(w) + 1) / total
            result.append({"w": w, "t0": round(timeline_offset + t, 3), "t1": round(timeline_offset + t + d, 3)})
            t += d
        return result

    tts_audio_end = max(w["offset"] + w["duration"] for w in tts_words) if tts_words else audio_duration
    scale = audio_duration / tts_audio_end if tts_audio_end > 0 else 1.0

    result = []
    ti = 0
    for dw in display_words:
        dw_clean = dw.strip(".,;:?!\"'()-")
        if ti < len(tts_words):
            tw = tts_words[ti]
            t0 = tw["offset"] * scale
            t1 = (tw["offset"] + tw["duration"]) * scale
            result.append({"w": dw, "t0": round(timeline_offset + t0, 3), "t1": round(timeline_offset + t1, 3)})
            ti += 1
        else:
            prev = result[-1] if result else {"t1": 0}
            result.append({"w": dw, "t0": round(prev["t1"], 3), "t1": round(prev["t1"] + 0.15, 3)})

    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="en-US-AndrewNeural")
    ap.add_argument("--rate", default="+0%")
    ap.add_argument("--pitch", default="+0Hz")
    args = ap.parse_args()

    script = json.loads((HERE / "script.json").read_text())
    v = script["voice"]
    t = v["lead"]
    track, lines, scenes = [], {}, []

    for scene in script["scenes"]:
        s_start = t
        for line in scene["lines"]:
            speak_text = line.get("say", line["text"])
            a, tts_words = asyncio.run(synth_line(speak_text, args.voice, args.rate, args.pitch))
            audio_dur = len(a) / SR

            words = map_words(line["text"], tts_words, t, audio_dur)

            lines[line["id"]] = {
                "scene": scene["id"], "text": line["text"],
                "start": round(t, 3), "end": round(t + audio_dur, 3),
                "words": words,
            }
            track.append((t, a))
            t += audio_dur + v["gapAfterLine"] + line.get("hold", 0)
            print(f"{line['id']:>8}  {lines[line['id']]['start']:6.2f}-{lines[line['id']]['end']:6.2f}  {line['text']}")

        t += v["gapAfterScene"] - v["gapAfterLine"]
        scenes.append({"id": scene["id"], "start": round(s_start, 3)})

    duration = round(t + v["tail"], 3)
    for i, s in enumerate(scenes):
        s["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else duration

    out = np.zeros(int(duration * SR) + SR, dtype=np.float32)
    for start, a in track:
        i = int(start * SR)
        out[i: i + len(a)] += a
    out = out[: int(duration * SR)]
    out *= 0.89 / max(1e-6, np.abs(out).max())
    (HERE / "vo").mkdir(exist_ok=True)
    wavfile.write(HERE / "vo" / "vo.wav", SR, (out * 32767).astype(np.int16))

    timing = {"duration": duration, "scenes": scenes, "lines": lines}
    (HERE / "timing.js").write_text(
        "// Generated by voice.py from script.json: when each scene, line and word is spoken.\n"
        f"window.TIMING = {json.dumps(timing, indent=1)};\n"
    )
    print(f"duration {duration:.2f}s -> timing.js, vo/vo.wav")


if __name__ == "__main__":
    main()
