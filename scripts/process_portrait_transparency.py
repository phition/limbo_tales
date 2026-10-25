import os
import sys
from PIL import Image, ImageFilter
from collections import deque

def convert_to_transparent_png(src_path, dest_paths, white_thresh=235):
    im = Image.open(src_path).convert('RGB')
    w, h = im.size
    raw = im.tobytes()
    visited = bytearray(w * h)
    q = deque()
    
    def is_bg(r, g, b):
        if r >= white_thresh and g >= white_thresh and b >= white_thresh:
            return True
        avg = (r + g + b) / 3.0
        if avg >= 210 and min(r, g, b) >= 170:
            return True
        return False

    for x in range(w):
        r, g, b = raw[x*3], raw[x*3+1], raw[x*3+2]
        if is_bg(r, g, b):
            visited[x] = 1
            q.append((x, 0))
    for y in range(h):
        for x in [0, w - 1]:
            idx = y * w + x
            if not visited[idx]:
                r, g, b = raw[idx*3], raw[idx*3+1], raw[idx*3+2]
                if is_bg(r, g, b):
                    visited[idx] = 1
                    q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]:
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx]:
                    nr, ng, nb = raw[nidx*3], raw[nidx*3+1], raw[nidx*3+2]
                    if is_bg(nr, ng, nb):
                        visited[nidx] = 1
                        q.append((nx, ny))

    mask = Image.frombytes('L', (w, h), bytes([0 if v else 255 for v in visited]))
    mask_smooth = mask.filter(ImageFilter.GaussianBlur(radius=0.8))
    mask_bytes = mask_smooth.tobytes()

    new_rgba = bytearray(w * h * 4)
    for i in range(w * h):
        a = mask_bytes[i]
        if a == 0:
            continue
        r = raw[i * 3]
        g = raw[i * 3 + 1]
        b = raw[i * 3 + 2]
        if a < 255:
            af = a / 255.0
            r = max(0, min(255, int((r - (1.0 - af) * 255.0) / af)))
            g = max(0, min(255, int((g - (1.0 - af) * 255.0) / af)))
            b = max(0, min(255, int((b - (1.0 - af) * 255.0) / af)))
        idx4 = i * 4
        new_rgba[idx4] = r
        new_rgba[idx4+1] = g
        new_rgba[idx4+2] = b
        new_rgba[idx4+3] = a

    res = Image.frombytes('RGBA', (w, h), bytes(new_rgba))
    for dp in dest_paths:
        os.makedirs(os.path.dirname(dp), exist_ok=True)
        res.save(dp, 'PNG')
        print(f"Saved: {dp} (transparent: {visited.count(1)} pixels)")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python process_portrait_transparency.py <src_image> <dest1> [dest2 ...]")
        sys.exit(1)
    src = sys.argv[1]
    dests = sys.argv[2:]
    convert_to_transparent_png(src, dests)
