#!/bin/sh
# Put the soundtrack under each render (the mix is built at about -13 LUFS; -1 dB lands it at -14 for social video).
#   out/film.mp4 + out/mix.wav → ../docs/media/wukong-film.mp4   (16:9, with voiceover)
#   out/reel.mp4 + out/mix.wav → ../docs/media/wukong-reel.mp4   (9:16, with voiceover)
#   out/*.mp4    + out/bed.wav → out/*-novo.mp4                  (music + effects only, to voice it yourself)
#   sh mux.sh reel                                               (just one of them)
set -e
cd "$(dirname "$0")"
mkdir -p ../docs/media
for m in ${*:-film reel}; do
  [ -f "out/$m.mp4" ] || continue
  ffmpeg -y -loglevel error -i "out/$m.mp4" -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -crf 23 -preset slow -tune animation -pix_fmt yuv420p \
    -af volume=-1dB -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "../docs/media/wukong-$m.mp4"
  ffmpeg -y -loglevel error -i "out/$m.mp4" -i out/bed.wav -map 0:v -map 1:a -c:v libx264 -crf 23 -preset slow -tune animation -pix_fmt yuv420p \
    -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "out/$m-novo.mp4"
  echo "wrote docs/media/wukong-$m.mp4 and out/$m-novo.mp4"
done
