# Pitch video

The 2:24 Colosseum pitch (`docs/media/wukong-pitch.mp4`, subtitles in `docs/media/wukong-pitch.srt`): problem, solution, a live demo of the real app (post → crowd → AI judge → automatic payout, plus an agent paying over x402), the WukongBench results with their limits, the business model, status and team.

Like the film, it's a deterministic HTML timeline (`pitch.html`) rendered frame by frame by `../render.mjs`. The voiceover drives the edit.

| File | What it does |
|---|---|
| `script.json` | Voiceover lines, scene by scene (`say` is the spoken variant) |
| `voice.py` | Speaks the script with Piper → `vo/vo.wav`, `timing.js` and the `.srt` |
| `record.mjs` | Drives the real app in Chromium and records it (needs the local demo running) |
| `clips.json` / `clips.py` | Which seconds of the recording go under each demo line; cuts them to frames, sped up to fit → `clips/`, `clips.js` |
| `agent.js` | The real output of `npm run agent -- --auto`, shown as the terminal |
| `team.js` | Names on the closing slide |
| `audio.py` | A soft pad under the voice, ducked while it speaks → `../out/pitch-mix.wav` |

## Rebuild

```bash
# 1. The app, locally, with the AI judge configured (WUKONG_JUDGE_* in the environment)
npm run validator &                   # or: npm run demo
npx tsx scripts/setup.ts --cluster localnet && npx tsx scripts/seed.ts
npm run build && npm start

# 2. Run the agent, then record the flow and the agent's task (from video/pitch)
WUKONG_URL=http://127.0.0.1:3000 npm run agent -- --auto   # put its output into agent.js; note the task URL
node record.mjs ./rec http://127.0.0.1:3000/tasks/<agent task>   # writes rec/*.webm and marks.json

# 3. Voice, clips, sound, render (Piper voice as in ../README.md)
python voice.py --model en-us-ryan-high.onnx
python clips.py rec/<recording>.webm  # adjust clips.json if the recording's timing differs
python audio.py
cd .. && node render.mjs --page pitch/pitch.html --fps 30
ffmpeg -i out/pitch.mp4 -i out/pitch-mix.wav -map 0:v -map 1:a -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -shortest -movflags +faststart ../docs/media/wukong-pitch.mp4
```

To change only the team names, edit `team.js` and re-run the last two commands. To change words, edit `script.json` and run everything from `voice.py` on.
