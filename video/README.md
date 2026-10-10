# Wukong film

A 60-second motion-graphics film, written as code. `film.html` is a deterministic timeline: `renderAt(t)` draws the frame at time `t`, and `render.mjs` screenshots every frame in headless Chromium and pipes it into ffmpeg. The voiceover drives the edit: `voice.py` speaks `script.json`, measures when each line and word lands, and writes `timing.js`, so every word on screen appears when it is said.

| File | What it does |
|---|---|
| `script.json` | The voiceover script, scene by scene, with spoken variants (`say`) and pauses (`hold`) |
| `voice.py` | Speaks the script with [Piper](https://github.com/rhasspy/piper) → `vo/vo.wav` + `timing.js` (scene, line and word times) |
| `timing.js` | Generated, committed: the film renders without Piper installed |
| `film.html` | 16 scenes, HUD, typography; `?mode=reel` frames it on a laptop for 9:16 |
| `render.mjs` | Stills, cue export, and full renders (1920×1080 or 1080×1920, 30 fps) |
| `audio.py` | Music bed (120 BPM, A minor) and sound effects synthesized from the film's cue list, ducked under the voice |
| `mux.sh` | Puts the soundtrack under the renders, at about −14 LUFS → `docs/media/` |

## Build

Needs Node 20+, Python 3 with `numpy` and `scipy`, ffmpeg, and a Chromium (`CHROME_PATH=...` if it isn't the Playwright one).

```bash
cd video && npm install
npm run stills            # review frames → stills/
npm run build             # cues → audio → film + reel renders → docs/media/wukong-{film,reel}.mp4
```

To change the words, edit `script.json` and re-run the voice (it rewrites `timing.js`, and the animations follow):

```bash
pip install piper-tts
curl -LO https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz && tar xzf voice-en-us-ryan-high.tar.gz
python voice.py --model en-us-ryan-high.onnx
```

To use your own voice instead: run `npm run build`, then record over `out/film-novo.mp4` or `out/reel-novo.mp4` (music and effects only) reading `script.json` at the same pace.
