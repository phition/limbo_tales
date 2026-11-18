import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from PIL import Image

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIRS = [
    os.path.join(ROOT_DIR, 'custom_assets'),
    os.path.join(ROOT_DIR, 'public', 'assets')
]

SUPPORTED_EXTENSIONS = ('.png', '.jpg', '.jpeg')

def process_file(img_path, quality=86):
    norm_path = img_path.replace('\\', '/')
    # VFX 스프라이트 시트는 렌더링 성능(0ms 디코딩)을 위해 원본 PNG 유지
    if '/vfx/' in norm_path:
        return ('skip', os.path.getsize(img_path), 0)

    base, _ = os.path.splitext(img_path)
    webp_path = base + '.webp'
    orig_size = os.path.getsize(img_path)

    # 이미 최신 webp가 있으면 스킵
    if os.path.exists(webp_path) and os.path.getmtime(webp_path) >= os.path.getmtime(img_path):
        return ('skip', orig_size, os.path.getsize(webp_path))

    try:
        with Image.open(img_path) as img:
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                converted = img.convert('RGBA')
            else:
                converted = img.convert('RGB')
            # method=4는 method=6과 압축률이 99% 유사하면서 속도는 3~4배 빠름
            converted.save(webp_path, 'WEBP', quality=quality, method=4)
        
        webp_size = os.path.getsize(webp_path)
        return ('success', orig_size, webp_size)
    except Exception as e:
        return ('error', orig_size, 0)

def main():
    print("[START] Fast Multi-core Image to WebP Conversion (PNG/JPG/JPEG)...")
    source_files = []
    seen = set()

    for base_dir in TARGET_DIRS:
        if not os.path.exists(base_dir):
            continue
        for root, _, files in os.walk(base_dir):
            for f in files:
                f_lower = f.lower()
                if f_lower.endswith(SUPPORTED_EXTENSIONS):
                    fp = os.path.normpath(os.path.join(root, f))
                    if fp not in seen:
                        seen.add(fp)
                        source_files.append(fp)

    total_files = len(source_files)
    print(f"Total source images to verify/convert: {total_files}")

    total_orig = 0
    total_webp = 0
    converted = 0
    skipped = 0
    errors = 0

    cpu_count = min(os.cpu_count() or 4, 8)
    print(f"Running on {cpu_count} CPU worker processes...")

    with ProcessPoolExecutor(max_workers=cpu_count) as executor:
        futures = {executor.submit(process_file, p): p for p in source_files}
        done_count = 0
        for future in as_completed(futures):
            status, orig_sz, webp_sz = future.result()
            total_orig += orig_sz
            total_webp += webp_sz
            if status == 'success':
                converted += 1
            elif status == 'skip':
                skipped += 1
            else:
                errors += 1

            done_count += 1
            if done_count % 100 == 0 or done_count == total_files:
                print(f"  [{done_count}/{total_files}] Converted: {converted}, Skipped: {skipped}, Errors: {errors}")

    print("\n" + "="*50)
    print("🎉 Fast Conversion to WebP Finished!")
    print(f"  - Total files checked: {total_files}")
    print(f"  - Newly Converted: {converted}")
    print(f"  - Skipped (already existed): {skipped}")
    print(f"  - Errors: {errors}")
    print(f"  - Original Image Total: {total_orig / (1024*1024):.2f} MB")
    print(f"  - WebP Total          : {total_webp / (1024*1024):.2f} MB")
    saved = total_orig - total_webp
    pct = (saved / total_orig * 100) if total_orig > 0 else 0
    print(f"  - Space Saved         : {saved / (1024*1024):.2f} MB ({pct:.1f}% reduction!)")
    print("="*50)

if __name__ == '__main__':
    main()
