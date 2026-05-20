"""
Extract frames from soccer_scene_build_2.mp4 into WebP images for scroll animation.
Output: sports-manager-workspace/frontend-react/public/frames/
"""
import cv2
import os
import json

VIDEO   = r"C:\Users\Sebas\OneDrive - UNIANDES\Documentos\Canchas\soccer_scene_build_2.mp4"
OUT_DIR = r"C:\Users\Sebas\OneDrive - UNIANDES\Documentos\Canchas\sports-manager-workspace\frontend-react\public\frames"
TARGET  = 96    # frames to extract
RESIZE_W = 1280  # resize width (height auto)
QUALITY  = 72   # WebP quality (0-100)

os.makedirs(OUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO)
total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps    = cap.get(cv2.CAP_PROP_FPS)
dur    = total / fps if fps else 0
step   = max(1, total // TARGET)

print(f"Video: {total} frames @ {fps:.1f}fps = {dur:.2f}s")
print(f"Extracting every {step}th frame -> ~{total // step} frames at {RESIZE_W}px wide")

extracted = 0
idx = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    if idx % step == 0:
        # Resize preserving aspect ratio
        h, w = frame.shape[:2]
        scale = RESIZE_W / w
        new_w, new_h = RESIZE_W, int(h * scale)
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

        out = os.path.join(OUT_DIR, f"frame_{extracted:04d}.webp")
        cv2.imwrite(out, resized, [cv2.IMWRITE_WEBP_QUALITY, QUALITY])
        extracted += 1
        if extracted % 20 == 0:
            print(f"  {extracted} frames...")
    idx += 1

cap.release()

meta = {"frameCount": extracted, "duration": dur, "fps": fps}
with open(os.path.join(OUT_DIR, "meta.json"), "w") as f:
    json.dump(meta, f)

total_kb = sum(
    os.path.getsize(os.path.join(OUT_DIR, fn))
    for fn in os.listdir(OUT_DIR) if fn.endswith(".webp")
) // 1024

print(f"\nDone: {extracted} frames -> {total_kb} KB total ({total_kb//1024:.1f} MB)")
print(f"Meta: {OUT_DIR}/meta.json")
