"""Voiceover for the promo: Piper reads the typed lines, each placed on its
scene and sped up until it fits before the next one. Reuses voice.py's
synthesis and trimming. Writes:
  vo/promo-vo.wav    the voice track at 48 kHz (input to promo_audio.py)
  out/promo-vo.json  where each line landed, for checking

  python promo_voice.py --model en-us-ryan-high.onnx [--piper path/to/piper]
"""
import argparse
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile

from voice import SR, synth, trim

HERE = Path(__file__).parent

# (start, must end by, what is said[, slowest pace]); starts sit just after each line starts typing
LINES = [
    (0.45, 3.4, "Who do you hire, when you can't tell who's good?", 1.08),
    (3.75, 4.98, "You don't pick one."),
    (5.05, 6.3, "You summon a hundred."),
    (8.4, 9.65, "Built on Solana."),
    (9.75, 10.65, "Any task."),
    (10.7, 11.68, "Judged by AI."),
    (11.75, 13.6, "Paid in U.S.D.C."),
    (13.8, 15.6, "Copycats get eaten."),
    (15.75, 17.4, "From a brief, to the best work."),
    (18.2, 21.0, "Post a task, summon the crowd, pay the best."),
    (21.15, 23.6, "Wukong H Q, dot x y z."),  # the wordmark lands at 21.0
]
SLOWEST, FASTEST = 0.95, 0.72


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--piper", default="piper")
    args = ap.parse_args()

    track = np.zeros(int(24.5 * SR), dtype=np.float32)
    placed = []
    for start, end, text, *slow in LINES:
        scale = slow[0] if slow else SLOWEST
        while True:
            a = trim(synth(args.piper, args.model, text, scale))
            if start + len(a) / SR <= end or scale <= FASTEST:
                break
            scale = round(scale - 0.03, 2)
        i = int(start * SR)
        track[i : i + len(a)] += a[: len(track) - i]
        placed.append({"t": start, "end": round(start + len(a) / SR, 3), "deadline": end, "lengthScale": scale, "text": text})
        late = " LATE" if start + len(a) / SR > end else ""
        print(f"{start:6.2f}-{start + len(a) / SR:6.2f} (by {end:5.2f}) x{scale:.2f}{late}  {text}")

    (HERE / "vo").mkdir(exist_ok=True)
    track = track / np.abs(track).max() * 0.95
    wavfile.write(HERE / "vo" / "promo-vo.wav", SR, (track * 32767).astype(np.int16))
    (HERE / "out").mkdir(exist_ok=True)
    (HERE / "out" / "promo-vo.json").write_text(json.dumps(placed, indent=1))
    print("wrote vo/promo-vo.wav")


if __name__ == "__main__":
    main()
