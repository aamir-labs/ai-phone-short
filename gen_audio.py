"""
Generates all audio for the video using only free tools:
  1. Narration  -> Piper (free open-source voice). Falls back to espeak-ng.
  2. Sound design (ambient bed, whooshes, hit, tick) -> synthesized here, no downloads.
  3. timing.json -> exact scene lengths, so captions and visuals match the voice.

Run:  python3 gen_audio.py          (real voice)
      python3 gen_audio.py --dry    (silent placeholder, for testing only)
"""
import json, math, os, random, shutil, struct, subprocess, sys, urllib.request, wave

FPS = 30
LEAD = 0.30   # seconds of silence before each scene's speech
TAIL = 0.40   # seconds of silence after each scene's speech
SR_OUT = 44100
DRY = "--dry" in sys.argv

SCENES = [
    ("hook",   "Your phone is quietly becoming an AI computer."),
    ("what",   "On-device AI runs the model on your phone's own chip, not only on a distant server."),
    ("npu",    "Phones now include a neural processor, hardware built for the parallel math behind AI."),
    ("speed",  "That can cut waiting, since some requests skip the network, and some features can work offline."),
    ("privacy","It can help privacy, since some data may stay on the device, but that depends on the app."),
    ("limits", "Now the limits. Phone models are much smaller than data-center models, so they're weaker at complex reasoning."),
    ("cost",   "They also cost battery, memory and heat, and phones throttle themselves to stay safe."),
    ("hybrid", "So the realistic future is hybrid: quick, personal tasks on your phone, heavy work in the cloud."),
    ("outro",  "Your phone isn't replacing the cloud. It's becoming part of it. Follow for more future tech."),
]

os.makedirs("public", exist_ok=True)
os.makedirs("work", exist_ok=True)

# ---------------------------------------------------------------- narration
def read_wav(path):
    with wave.open(path, "rb") as w:
        return w.getframerate(), w.getnchannels(), w.readframes(w.getnframes())

def make_voice_piper(text, out):
    model = "voices/en_US-lessac-medium.onnx"
    if not os.path.exists(model):
        os.makedirs("voices", exist_ok=True)
        base = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium"
        for ext in (".onnx", ".onnx.json"):
            urllib.request.urlretrieve(base + ext, "voices/en_US-lessac-medium" + ext)
    subprocess.run([sys.executable, "-m", "piper", "-m", model, "-f", out],
                   input=text.encode(), check=True)

def make_voice_espeak(text, out):
    subprocess.run(["espeak-ng", "-v", "en-us+f3", "-s", "158", "-w", out, text], check=True)

def make_voice_dry(text, out):
    secs = len(text.split()) / 2.6
    with wave.open(out, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050)
        w.writeframes(b"\x00\x00" * int(22050 * secs))

engine = make_voice_dry if DRY else make_voice_piper
if not DRY:
    try:
        make_voice_piper(SCENES[0][1], "work/_probe.wav")
        print("Voice engine: Piper")
    except Exception as e:
        print("Piper failed (%s) -> falling back to espeak-ng" % e)
        engine = make_voice_espeak

pcm = bytearray()
timing_scenes = []
cursor = 0  # in output samples
for sid, text in SCENES:
    path = "work/%s.wav" % sid
    engine(text, path)
    rate, ch, raw = read_wav(path)
    # convert to mono 44.1k 16-bit via ffmpeg for a uniform stream
    conv = "work/%s_44k.wav" % sid
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1",
                    "-ar", str(SR_OUT), "-sample_fmt", "s16", conv], check=True)
    _, _, raw = read_wav(conv)
    speech_samples = len(raw) // 2
    lead = int(LEAD * SR_OUT)
    tail = int(TAIL * SR_OUT)
    total_samples = lead + speech_samples + tail
    # round the scene up to a whole number of frames so everything stays aligned
    frames = math.ceil(total_samples / SR_OUT * FPS)
    scene_samples = int(round(frames / FPS * SR_OUT))
    block = b"\x00\x00" * lead + raw + b"\x00\x00" * (scene_samples - lead - speech_samples)
    pcm += block
    timing_scenes.append({
        "id": sid, "text": text,
        "start": round(cursor / SR_OUT * FPS),
        "dur": frames,
        "speechStart": round(LEAD * FPS),
        "speechFrames": round(speech_samples / SR_OUT * FPS),
    })
    cursor += scene_samples

total_frames = round(cursor / SR_OUT * FPS)
total_secs = total_frames / FPS
with wave.open("public/narration.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR_OUT)
    w.writeframes(bytes(pcm))

with open("timing.json", "w") as f:
    json.dump({"fps": FPS, "totalFrames": total_frames, "scenes": timing_scenes}, f, indent=1)
print("Total duration: %.2f s (%d frames)" % (total_secs, total_frames))

# ------------------------------------------------------------ sound design
random.seed(7)

def write_mono(path, samples, peak=0.9):
    m = max(1e-9, max(abs(s) for s in samples))
    g = peak / m
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR_OUT)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * g)) * 32767)) for s in samples))

def lowpass(x, a):
    y, prev = [], 0.0
    for s in x:
        prev += a * (s - prev)
        y.append(prev)
    return y

# Whoosh: filtered noise with a rising then falling envelope
n = int(0.9 * SR_OUT)
noise = [random.uniform(-1, 1) for _ in range(n)]
out = []
prev = 0.0
for i, s in enumerate(noise):
    t = i / n
    a = 0.02 + 0.5 * math.sin(math.pi * t) ** 2     # filter opens then closes
    prev += a * (s - prev)
    env = math.sin(math.pi * t) ** 1.6
    out.append(prev * env)
write_mono("public/whoosh.wav", out, 0.8)

# Hit: low sine thump + short noise burst
n = int(1.4 * SR_OUT)
out = []
for i in range(n):
    t = i / SR_OUT
    f = 70 * math.exp(-t * 3.0) + 38
    env = math.exp(-t * 3.2)
    thump = math.sin(2 * math.pi * f * t) * env
    click = random.uniform(-1, 1) * math.exp(-t * 60) * 0.3
    out.append(thump + click)
write_mono("public/hit.wav", out, 0.9)

# Tick / UI blip
n = int(0.18 * SR_OUT)
out = [math.sin(2 * math.pi * 1800 * (i / SR_OUT)) * math.exp(-(i / SR_OUT) * 38) for i in range(n)]
write_mono("public/tick.wav", out, 0.6)

# Riser: rising tone + noise swell (used before the hybrid reveal)
n = int(2.0 * SR_OUT)
out, ph = [], 0.0
for i in range(n):
    t = i / n
    f = 220 + 1400 * t * t
    ph += 2 * math.pi * f / SR_OUT
    out.append((math.sin(ph) * 0.5 + random.uniform(-1, 1) * 0.15) * t ** 2.2)
write_mono("public/riser.wav", out, 0.6)

# Ambient bed: slow detuned chord pad with a gentle pulse, a touch of air
bed_len = int((total_secs + 1.5) * SR_OUT)
freqs = [55.0, 82.41, 110.0, 164.81, 220.0, 329.63]   # A-minor-ish stack
amps  = [0.50, 0.35, 0.30, 0.18, 0.12, 0.07]
out = []
lp = 0.0
for i in range(bed_len):
    t = i / SR_OUT
    v = 0.0
    for k, (f, a) in enumerate(zip(freqs, amps)):
        lfo = 0.6 + 0.4 * math.sin(2 * math.pi * (0.05 + 0.013 * k) * t + k)
        v += a * lfo * (math.sin(2 * math.pi * f * t) + 0.5 * math.sin(2 * math.pi * (f * 1.004) * t))
    pulse = 0.85 + 0.15 * math.sin(2 * math.pi * 0.5 * t)
    lp += 0.25 * (random.uniform(-1, 1) - lp)
    out.append(v * pulse + lp * 0.05)
write_mono("public/bed.wav", out, 0.8)
print("Audio files written to public/:", sorted(os.listdir("public")))
