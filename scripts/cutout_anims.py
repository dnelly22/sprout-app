#!/usr/bin/env python3
"""
Background removal for the character/mascot GIFs.

The art is hostile to keying: clothes are near-background cream AND the GIF
backgrounds are dithered (noisy), so naive flood fill either leaks into
sweaters (high thresh) or leaves speckle islands (low thresh). Pipeline:

 1. ffmpeg extracts frames DOWNSCALED with area-averaging (kills dithering)
    and handles GIF disposal correctly.
 2. Slightly blurred working copy → flood-fill from many border seeds with a
    LOW threshold (can't cross the cloth/bg boundary).
 3. Keep only large connected alpha components (the figure) — any leftover
    background islands/speckle are disconnected and get dropped.
 4. 1px erode + gaussian feather → sharp but clean edges.

Chars encode loop=1 (play once, freeze on last frame); sprout idle loops.
Run: python3 scripts/cutout_anims.py   (from the repo root)
"""
import os, subprocess, tempfile, glob
from PIL import Image, ImageDraw, ImageChops, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.expanduser("~/Downloads/Sprout App Animations")
CHAR_OUT = os.path.join(ROOT, "public/assets/journey/characters")
MASCOT_OUT = os.path.join(ROOT, "public/assets/mascot")

CHARS = [
    ("boy - idle.gif", "boy-idle"), ("boy - laughing.gif", "boy-laughing"),
    ("boy - thinking.gif", "boy-thinking"), ("boy - mad.gif", "boy-mad"),
    ("Boy - big wave.gif", "boy-wave"),
    ("girl - idle.gif", "girl-idle"), ("girl - laughing.gif", "girl-laughing"),
    ("girl - thinking.gif", "girl-thinking"), ("girl - mean.gif", "girl-mean"),
    ("girl - snarky.gif", "girl-snarky"), ("Girl - big wave.gif", "girl-wave"),
]
SPROUT = [("Sprout - idle 1.gif", "sprout-idle", 0), ("Sprout Jump 1.gif", "sprout-jump1", 0)]

SENTINEL = (255, 0, 255)
THRESH = 10          # low: must not cross cloth/bg or shadow/pants boundaries
BLUR = 1.2           # smooths residual dither before flood fill
MIN_COMP = 0.15      # keep components >= 15% of the largest (figure + big parts)
MAX_FRAMES = 70
FPS = 10

def border_seeds(w, h):
    # Top edge + upper 60% of the sides ONLY. Characters stand on (or run off)
    # the bottom edge — bottom seeds would start INSIDE the figure and flood it
    # from within (that's what ate boy-wave's torso). Bottom background is still
    # reached by the fill flowing down the sides.
    pts = []
    for k in range(0, 21):
        pts.append((min(int(k * 0.05 * (w - 1)), w - 1), 0))
    for k in range(0, 13):
        t = min(int(k * 0.05 * (h - 1)), int(0.6 * h))
        pts += [(0, t), (w - 1, t)]
    return pts

def largest_components(alpha: Image.Image) -> Image.Image:
    """Binary mask keeping only large connected components of `alpha`."""
    from collections import Counter
    w, h = alpha.size
    small = alpha.resize((max(1, w // 4), max(1, h // 4)), Image.NEAREST).point(lambda v: 255 if v > 0 else 0)
    lab = small.convert("L")
    px = lab.load()
    next_label = 1
    for y in range(lab.height):
        for x in range(lab.width):
            if px[x, y] == 255 and next_label < 250:
                ImageDraw.floodfill(lab, (x, y), next_label)
                next_label += 1
    counts = Counter(v for v in lab.getdata() if 0 < v < 255)
    if not counts:
        return alpha.point(lambda v: 255)
    biggest = counts.most_common(1)[0][1]
    keep = {l for l, s in counts.items() if s >= biggest * MIN_COMP}
    mask_small = lab.point(lambda v: 255 if v in keep else 0)
    return mask_small.resize((w, h), Image.BILINEAR).point(lambda v: 255 if v > 127 else 0)

def cutout(rgb: Image.Image) -> Image.Image:
    w, h = rgb.size
    work = rgb.filter(ImageFilter.GaussianBlur(BLUR))
    for s in border_seeds(w, h):
        if work.getpixel(s) != SENTINEL:
            ImageDraw.floodfill(work, s, SENTINEL, thresh=THRESH)
    diff = ImageChops.difference(work, Image.new("RGB", (w, h), SENTINEL)).convert("L")
    alpha = diff.point(lambda v: 255 if v > 0 else 0)
    alpha = ImageChops.darker(alpha, largest_components(alpha))  # drop bg islands/speckle
    alpha = alpha.filter(ImageFilter.MinFilter(3))               # 1px erode: kills halo
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.1))          # slight feather
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out

def process(src_path, out_path, loop, height):
    with tempfile.TemporaryDirectory() as td:
        # area-averaged downscale at extraction kills most GIF dithering
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src_path,
                        "-vf", f"fps={FPS},scale=-2:{height}:flags=area",
                        os.path.join(td, "f%04d.png")], check=True)
        frames = sorted(glob.glob(os.path.join(td, "f*.png")))
        stride = max(1, (len(frames) + MAX_FRAMES - 1) // MAX_FRAMES)
        frames = frames[::stride]
        dur = int(1000 / FPS * stride)
        args = ["img2webp", "-loop", str(loop)]
        outs = []
        for k, fp in enumerate(frames):
            f = cutout(Image.open(fp).convert("RGB"))
            op = os.path.join(td, f"o{k:04d}.png")
            f.save(op)
            outs.append(f)
            args += ["-d", str(dur), "-lossy", "-q", "58", op]
        args += ["-o", out_path]
        subprocess.run(args, check=True, capture_output=True)
    print(f"{os.path.relpath(out_path, ROOT)}  {len(outs)}f  {os.path.getsize(out_path)//1024}KB", flush=True)
    return outs

if __name__ == "__main__":
    os.makedirs(CHAR_OUT, exist_ok=True)
    for f, name in CHARS:
        process(os.path.join(SRC, f), os.path.join(CHAR_OUT, f"{name}.webp"), loop=1, height=400)
    for f, name, loop in SPROUT:
        frames = process(os.path.join(SRC, f), os.path.join(MASCOT_OUT, f"{name}.webp"), loop=loop, height=320)
        gif = os.path.join(MASCOT_OUT, f"{name}.gif")
        frames[0].save(gif, save_all=True, append_images=frames[1:], duration=100, loop=0, disposal=2)
        print(f"{os.path.relpath(gif, ROOT)}  (fallback)", flush=True)
    print("done", flush=True)
