import os
import sys
import cv2
import numpy as np
from PIL import Image

DIRS = [
    os.path.join('public', 'assets', 'portraits'),
    os.path.join('custom_assets', 'portraits')
]

TARGET_SIZE = (512, 512)

def process_and_save_portrait(src_path, output_filename):
    if not os.path.exists(src_path):
        print(f"[ERR] File not found: {src_path}")
        return False

    img_bgr = cv2.imread(src_path)
    if img_bgr is None:
        print(f"[ERR] Failed to load: {src_path}")
        return False

    h, w = img_bgr.shape[:2]
    mask = np.zeros((h+2, w+2), np.uint8)
    flags = 4 | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)
    diff = (15, 15, 15)

    # Floodfill from borders
    for x in range(0, w, 2):
        if np.all(img_bgr[0, x] >= 235) and mask[1, x+1] == 0:
            cv2.floodFill(img_bgr, mask, (x, 0), (0, 0, 0), diff, diff, flags)
        if np.all(img_bgr[h-1, x] >= 235) and mask[h, x+1] == 0:
            cv2.floodFill(img_bgr, mask, (x, h-1), (0, 0, 0), diff, diff, flags)
    for y in range(0, h, 2):
        if np.all(img_bgr[y, 0] >= 235) and mask[y+1, 1] == 0:
            cv2.floodFill(img_bgr, mask, (0, y), (0, 0, 0), diff, diff, flags)
        if np.all(img_bgr[y, w-1] >= 235) and mask[y+1, w] == 0:
            cv2.floodFill(img_bgr, mask, (w-1, y), (0, 0, 0), diff, diff, flags)

    bg_mask = (mask[1:-1, 1:-1] == 255).astype(np.uint8)
    char_mask = ((1 - bg_mask) * 255).astype(np.uint8)

    # Anti-alias mask
    char_mask_smooth = cv2.GaussianBlur(char_mask, (3, 3), 0.8)

    # Vectorized color unmatting
    alpha = char_mask_smooth.astype(np.float32) / 255.0
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    alpha_clamped = np.clip(alpha, 1e-4, 1.0)[:, :, None]
    unmatted = (img_rgb - 255.0 * (1.0 - alpha[:, :, None])) / alpha_clamped
    unmatted = np.clip(unmatted, 0, 255).astype(np.uint8)

    rgba = np.dstack((unmatted, char_mask_smooth))
    pil_img = Image.fromarray(rgba, 'RGBA')

    # Downscale cleanly to 512x512
    if pil_img.size != TARGET_SIZE:
        pil_img = pil_img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

    # Save as WebP
    for d in DIRS:
        os.makedirs(d, exist_ok=True)
        out_path = os.path.join(d, output_filename)
        pil_img.save(out_path, 'WEBP', quality=95, method=6)
        print(f"[OK] Saved {out_path} ({pil_img.size[0]}x{pil_img.size[1]} RGBA WebP)")

    return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python process_portrait_03.py <src_path> <output_filename.webp>")
        sys.exit(1)
    src = sys.argv[1]
    dest = sys.argv[2]
    process_and_save_portrait(src, dest)
