"""Assembles the cinematic cut of One Journey.

Usage: python3 build.py <workdir> <out.mp4> [en|ar]
<workdir> must hold the eight generated shots as s1.mp4 .. s8.mp4 and the end
card frames in card/c0000.jpg .. (card-ar/ for Arabic; from render-card.cjs). The narration and
music sit next to this script."""
import os
import subprocess
import sys
import wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
work, out_path = sys.argv[1], sys.argv[2]
LANG = sys.argv[3] if len(sys.argv) > 3 else 'en'
SR, FPS = 44100, 24
SHOTS = [8, 7, 7, 8, 7, 8, 7, 8]          # seconds used from each shot
CARD = 5.0
FILM = sum(SHOTS)
TOTAL = FILM + CARD
# (start in narration file, end in narration file, cue in film), seconds
LINES_AR = [
    (0.00, 4.85, 1.5), (5.00, 8.95, 9.2), (9.10, 12.75, 16.6), (13.05, 19.30, 22.6), (19.40, 26.75, 29.6),
    (26.85, 34.85, 37.2), (35.10, 42.35, 45.4), (42.50, 46.37, 52.9), (46.37, 49.50, 56.9),
]
LINES = [
    (0.10, 4.35, 1.8), (4.72, 8.40, 9.4), (8.55, 11.95, 17.0), (12.70, 17.40, 23.3), (17.55, 23.40, 30.5),
    (23.44, 30.15, 37.6), (30.74, 36.12, 45.7), (36.34, 39.10, 52.8), (39.58, 41.79, 56.4),
]


def decode(path, channels):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', str(channels), '-ar', str(SR),
                          '-f', 's16le', '-'], check=True, capture_output=True).stdout
    return np.frombuffer(raw, '<i2').astype(np.float64).reshape(-1, channels) / 32768


if LANG == 'ar':
    LINES = LINES_AR
VOICE = 'voiceover-ar.mp3' if LANG == 'ar' else 'voiceover.mp3'
CARD_DIR = 'card-ar' if LANG == 'ar' else 'card'

n = int(SR * TOTAL)
t = np.arange(n) / SR

# Narration, cut line by line and placed on its shot.
src = decode(os.path.join(HERE, VOICE), 1)[:, 0]
src /= np.max(np.abs(src))
voice = np.zeros(n)
f = int(0.02 * SR)
for a, b, cue in LINES:
    clip = src[int(a * SR):int(b * SR)].copy()
    clip[:f] *= np.linspace(0, 1, f)
    clip[-f:] *= np.linspace(1, 0, f)
    i = int(cue * SR)
    voice[i:i + len(clip)] += clip

# Location sound from the shots themselves, kept low, with short fades at each cut.
amb = np.zeros((n, 2))
pos = 0.0
for k, dur in enumerate(SHOTS, 1):
    a = decode(os.path.join(work, f's{k}.mp4'), 2)[:int(dur * SR)]
    e = int(0.15 * SR)
    a[:e] *= np.linspace(0, 1, e)[:, None]
    a[-e:] *= np.linspace(1, 0, e)[:, None]
    i = int(pos * SR)
    amb[i:i + len(a)] += a
    pos += dur
peak = np.max(np.abs(amb))
if peak > 0:
    amb *= 0.5 / peak

# Music dips while the narrator speaks.
music = decode(os.path.join(HERE, 'music.mp3'), 2)
music = np.pad(music, ((0, max(0, n - len(music))), (0, 0)))[:n]
music /= np.max(np.abs(music))
win = int(0.25 * SR)
level = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode='same'))
smooth = int(0.6 * SR)
speaking = np.convolve(np.clip(level / 0.03, 0, 1), np.ones(smooth) / smooth, mode='same')
duck = 1 - 0.55 * np.clip(speaking * 1.3, 0, 1)
fade = np.clip(t / 1.5, 0, 1) * np.clip((TOTAL - 0.1 - t) / 2.5, 0, 1)

mix = music * (duck * fade)[:, None] * 0.8 + amb * fade[:, None] * 0.5 + (voice * 0.9)[:, None]
mix = np.clip(mix / max(1.0, np.max(np.abs(mix)) / 0.97), -1, 1)
wav = os.path.join(work, 'mix.wav')
with wave.open(wav, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())

# Picture: shots cut together in 21:9 inside a 16:9 frame, then the end card.
cmd = ['ffmpeg', '-loglevel', 'error', '-y']
parts = []
for k, dur in enumerate(SHOTS, 1):
    cmd += ['-i', os.path.join(work, f's{k}.mp4')]
    parts.append(f'[{k - 1}:v]trim=0:{dur},setpts=PTS-STARTPTS,fps={FPS},scale=1920:824,setsar=1,'
                 f'pad=1920:1080:0:128,format=yuv420p[v{k}]')
cmd += ['-framerate', str(FPS), '-i', os.path.join(work, CARD_DIR, 'c%04d.jpg'), '-i', wav]
nshots = len(SHOTS)
parts.append(''.join(f'[v{k}]' for k in range(1, nshots + 1)) + f'concat=n={nshots}:v=1:a=0,'
             f'fade=t=in:st=0:d=1.2,fade=t=out:st={FILM - 0.6}:d=0.6[film]')
parts.append(f'[{nshots}:v]fps={FPS},crop=1920:824:0:128,pad=1920:1080:0:128:black,'
             f'format=yuv420p,setsar=1[card]')
parts.append('[film][card]concat=n=2:v=1:a=0[v]')
cmd += ['-filter_complex', ';'.join(parts), '-map', '[v]', '-map', f'{nshots + 1}:a',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-c:a', 'aac', '-b:a', '256k',
        '-movflags', '+faststart', '-t', str(TOTAL), out_path]
subprocess.run(cmd, check=True)
print('wrote', out_path)
