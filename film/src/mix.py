"""Lays the narration over the score. Each line is cut from voiceover.mp3 and
placed at its cue in the film; the score dips while the narrator speaks.
Usage: python3 mix.py score.wav voiceover.mp3 out.wav"""
import subprocess
import sys
import wave
import numpy as np

SR, DUR = 44100, 90.0
# (start in recording, end in recording, cue in film), all in seconds
LINES = [
    (0.00, 2.45, 1.2), (2.95, 5.93, 5.0), (5.95, 8.30, 9.1), (8.36, 10.65, 12.9), (10.80, 15.15, 16.0),
    (15.45, 18.25, 20.7), (18.46, 20.70, 24.6), (21.00, 23.95, 28.2), (24.18, 28.50, 32.7), (28.50, 30.72, 37.1),
    (30.90, 34.25, 40.1), (34.34, 37.24, 44.0), (37.32, 40.60, 48.2), (40.75, 44.35, 52.3), (44.38, 47.50, 57.0),
    (48.22, 50.45, 60.8), (50.66, 54.70, 65.0), (55.60, 63.30, 69.8), (63.74, 66.90, 79.0), (67.22, 69.64, 82.4),
]


def read_wav(path):
    with wave.open(path) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
        return a.reshape(-1, w.getnchannels())


score_path, vo_path, out_path = sys.argv[1:4]
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', vo_path, '-ac', '1', '-ar', str(SR),
                      '-af', 'highpass=f=70', '-f', 's16le', '-'], check=True, capture_output=True).stdout
voice_src = np.frombuffer(raw, '<i2').astype(np.float64) / 32768
voice_src /= np.max(np.abs(voice_src))

n = int(SR * DUR)
voice = np.zeros(n)
f = int(0.02 * SR)
for a, b, cue in LINES:
    clip = voice_src[int(a * SR):int(b * SR)].copy()
    clip[:f] *= np.linspace(0, 1, f)
    clip[-f:] *= np.linspace(1, 0, f)
    i = int(cue * SR)
    voice[i:i + len(clip)] += clip

# Duck the score under speech: follow the voice level, smoothed so it breathes.
win = int(0.25 * SR)
level = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode='same'))
speaking = np.clip(level / 0.03, 0, 1)
smooth = int(0.6 * SR)
speaking = np.convolve(speaking, np.ones(smooth) / smooth, mode='same')
duck = 1 - 0.62 * np.clip(speaking * 1.3, 0, 1)

score = read_wav(score_path)[:n]
out = score * duck[:, None] * 0.9 + (voice * 0.85)[:, None]
out = np.clip(out / max(1.0, np.max(np.abs(out)) / 0.97), -1, 1)
with wave.open(out_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
