"""Synthesises the film's score: soft pads, a plucked arpeggio, and cue sounds
timed to the picture. Usage: python3 score.py out.wav"""
import sys
import wave
import numpy as np

SR, DUR = 44100, 90.0
N = int(SR * DUR)
t = np.arange(N) / SR
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)


def hz(note):  # MIDI note number to frequency
    return 440.0 * 2 ** ((note - 69) / 12)


def add(sig, start, pan=0.5, gain=1.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.cos(pan * np.pi / 2)
    R[i:i + len(sig)] += sig * np.sin(pan * np.pi / 2)


def pad(notes, start, end, gain=1.0, bright=0.25):
    fade = 1.8
    n = int((end - start + fade) * SR)
    x = np.arange(n) / SR
    envl = np.minimum(np.clip(x / fade, 0, 1), np.clip((x[-1] - x) / fade, 0, 1)) ** 1.5
    for j, note in enumerate(notes):
        f = hz(note)
        for det, pan in ((-0.25, 0.25), (0.25, 0.75)):
            ff = f * 2 ** (det / 100 * 6)
            ph = rng.uniform(0, 6.28)
            trem = 1 + 0.12 * np.sin(2 * np.pi * (0.11 + 0.03 * j) * x + ph)
            s = np.sin(2 * np.pi * ff * x + ph) + bright * np.sin(4 * np.pi * ff * x) + bright * 0.4 * np.sin(6 * np.pi * ff * x)
            add(s * envl * trem, start - fade / 2 if start > 1 else start, pan, gain * 0.05)


def pluck(note, start, gain=1.0, pan=0.5, decay=0.9):
    n = int(decay * 3 * SR)
    x = np.arange(n) / SR
    f = hz(note)
    s = (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(4 * np.pi * f * x) * np.exp(-x * 6)) * np.exp(-x / decay * 3.2)
    s[: 200] *= np.linspace(0, 1, 200)
    for k, (dl, g) in enumerate(((0, 1.0), (0.375, 0.35), (0.75, 0.14))):
        add(s, start + dl, pan if k % 2 == 0 else 1 - pan, gain * g * 0.11)


def bell(note, start, gain=1.0):
    n = int(3.5 * SR)
    x = np.arange(n) / SR
    f = hz(note)
    s = (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 3) + 0.25 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 6)) * np.exp(-x * 1.6)
    s[: 100] *= np.linspace(0, 1, 100)
    add(s, start, 0.4, gain * 0.16)
    add(s, start + 0.31, 0.7, gain * 0.05)


# Chord plan, one entry per stretch of picture: (start, end, pad notes, arpeggio notes)
D2, F2, G2, A2, Bb2, C3, D3, E3, F3, G3, A3, Bb3, C4, D4, E4, F4, G4, A4, C5, D5, E5, F5, A5, C6, F6 = (
    38, 41, 43, 45, 46, 48, 50, 52, 53, 55, 57, 58, 60, 62, 64, 65, 67, 69, 72, 74, 76, 77, 81, 84, 89)
PLAN = [
    (0.0, 12.0, [D2, A2, F3, C4, E4], None),            # night
    (12.0, 20.0, [Bb2 - 12, Bb2, F3, A3, E4], None),    # noise
    (20.0, 26.0, [F2, C3, A3, C4, G4], None),           # work
    (26.0, 32.0, [C3 - 12, G2, E3, G3, D4], None),
    (32.0, 37.5, [D2, A2, F3, A3, E4], [D4, F4, A4, E5]),  # shift
    (37.5, 43.0, [Bb2 - 12, F2, D3, F3, C4], [D4, F4, Bb3 + 12, C5]),
    (43.0, 48.0, [D2, A2, F3, C4], [D4, A4, F4, C5]),    # leaks
    (48.0, 53.0, [Bb2 - 12, Bb2, F3, D4], [Bb3, D4, F4, A4]),
    (53.0, 56.5, [F2, C3, A3, F4], [F4, A4, C5, F5]),
    (56.5, 60.0, [C3 - 12, G2, E3, G3, C4], [E4, G4, C5, E5]),
    (60.0, 64.5, [Bb2 - 12, F2, D3, F3, A3, C4], [Bb3, F4, A4, D5]),  # years
    (64.5, 69.0, [C3 - 12, G2, E3, G3, D4], [C4, G4, E5, D5]),
    (69.0, 73.5, [D2, A2, F3, C4, E4], None),            # the job
    (73.5, 78.0, [Bb2 - 12, F2, D3, A3, C4], None),
    (78.0, 82.3, [F2 - 12, F2, C3, A3, C4, G4], [F4, A4, C5, G4 + 12]),  # morning
    (82.3, 85.5, [C3 - 12, G2, E3, G3, C4, E4], [E4, G4, C5, E5]),
    (85.5, 90.0, [F2 - 12, F2, C3, A3, C4, F4, A4], [F4, A4, C5, F5]),
]
STEP = 0.375  # eighth notes at 80 bpm
for a, b, notes, arp in PLAN:
    dark = 12.0 <= a < 20.0
    pad(notes, a, b, gain=1.0 if a < 78 else 1.25, bright=0.5 if dark else 0.22)
    if arp:
        steps = int(round((b - a) / STEP))
        for s in range(steps):
            when = a + s * STEP
            lvl = 0.55 if a < 43 else (1.0 if a < 78 else 0.9)
            lvl *= 1.0 if s % 4 == 0 else 0.6
            if when > 88:
                break
            pluck(arp[(s * 3) % len(arp)] if s % 8 < 6 else arp[s % len(arp)] + 12, when, lvl, 0.3 + 0.4 * ((s * 5) % 7) / 6)

# Cues
for i in range(7):  # searches rising from the night city
    bell([A5, C6, E5 + 12, D5 + 12, F6, C6, A5][i], 4.6 + i * 0.62, 0.3)
for i in range(10):  # noise cards popping in, slightly sour
    pluck([Bb3 + 12, E5, A4, E5 + 1, C5, F4 + 1, A4 + 12, E5, Bb3 + 13, D5][i], 12.3 + i * 0.42, 0.7, rng.uniform(0.1, 0.9), 0.35)
for i in range(4):  # work cards
    pluck([F4, A4, C5, F5][i], 24.3 + i * 1.15, 1.2, 0.5, 1.3)
for when, note in ((53.0, A5), (54.5, C6), (56.0, F6)):  # the three fixes
    bell(note, when, 1.0)
for i in range(4):  # stats
    bell([F5, A5, C6, D5 + 12][i], 60.8 + i * 0.5, 0.45)
for i in range(7):  # shops answering at dawn
    bell([F5, A5, C6, F6, A5, C6, F6][i], 82.7 + i * 0.32, 0.5)
bell(F5, 86.2, 0.9)

# Low rumble under the noise scene, and sea air under the city
x = t
rumble = np.sin(2 * np.pi * 43 * x) * (1 + 0.5 * np.sin(2 * np.pi * 0.7 * x))
gate = np.clip((x - 12) / 2, 0, 1) * np.clip((20.5 - x) / 1.5, 0, 1)
L += rumble * gate * 0.07
R += rumble * gate * 0.07
air = np.cumsum(rng.standard_normal(N)) * 0.0
white = rng.standard_normal(N)
air = np.convolve(white, np.ones(60) / 60, mode='same')
swell = (0.5 + 0.5 * np.sin(2 * np.pi * x / 7.0)) ** 2
gate = np.clip(1 - (x - 10) / 3, 0, 1) + np.clip((x - 77) / 3, 0, 1)
L += air * swell * gate * 0.12
R += np.roll(air, 900) * swell * gate * 0.12

# Simple room: a handful of feedback-free echoes
out = np.stack([L, R])
wet = np.zeros_like(out)
for dl, g in ((0.089, 0.28), (0.137, 0.22), (0.211, 0.18), (0.331, 0.13), (0.487, 0.09), (0.701, 0.06)):
    d = int(dl * SR)
    wet[0, d:] += out[1, :-d] * g
    wet[1, d:] += out[0, :-d] * g
out = out + wet * 0.8

master = np.clip(t / 2.0, 0, 1) * np.clip((DUR - 0.2 - t) / 3.0, 0, 1)
out *= master
out = np.tanh(out / np.max(np.abs(out)) * 1.0) / np.tanh(1.0) * 0.7
pcm = (out.T * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
