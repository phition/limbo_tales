import os
import shutil
import zipfile
from PIL import Image

def build_bundle():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ads_dir = os.path.join(base_dir, 'public', 'ads')
    bundle_dir = os.path.join(base_dir, 'dist', 'google_ads_bundle')
    os.makedirs(bundle_dir, exist_ok=True)
    bundle_assets_dir = os.path.join(bundle_dir, 'assets')
    os.makedirs(bundle_assets_dir, exist_ok=True)
    bundle_portraits_dir = os.path.join(bundle_assets_dir, 'portraits')
    os.makedirs(bundle_portraits_dir, exist_ok=True)

    # 1. Read HTML and make relative asset path adjustments if needed
    src_html = os.path.join(ads_dir, 'google_play_ad_floor5.html')
    with open(src_html, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # In bundle, assets are located at ./assets/ (or assets/)
    # Replace '../assets/' with './assets/'
    bundle_html_content = html_content.replace('../assets/', './assets/')

    dst_html = os.path.join(bundle_dir, 'index.html')
    with open(dst_html, 'w', encoding='utf-8') as f:
        f.write(bundle_html_content)

    print("Created bundle index.html")

    # 2. Assets to copy and optimize
    assets_to_copy = [
        ('public/assets/dungeon_5.jpg', os.path.join(bundle_assets_dir, 'dungeon_5.jpg'), (960, 540), 82),
        ('public/assets/boss_floor_5.jpg', os.path.join(bundle_assets_dir, 'boss_floor_5.jpg'), (600, 600), 84),
        ('public/assets/void_overlord.jpg', os.path.join(bundle_assets_dir, 'void_overlord.jpg'), (600, 600), 84),
        ('public/assets/monster_primordial_shaman.jpg', os.path.join(bundle_assets_dir, 'monster_primordial_shaman.jpg'), (500, 500), 84),
        ('public/assets/monster_void_beast.jpg', os.path.join(bundle_assets_dir, 'monster_void_beast.jpg'), (500, 500), 84),
        ('public/assets/icon_app.png', os.path.join(bundle_assets_dir, 'icon_app.png'), (256, 256), 88),
        ('public/assets/citadel_9x16_mobile.jpg', os.path.join(bundle_assets_dir, 'citadel_9x16_mobile.jpg'), (540, 960), 82),
        ('public/assets/portraits/portrait_paladin.png', os.path.join(bundle_portraits_dir, 'portrait_paladin.png'), (400, 400), None),
        ('public/assets/portraits/portrait_rogue.png', os.path.join(bundle_portraits_dir, 'portrait_rogue.png'), (400, 400), None),
        ('public/assets/portraits/portrait_mage.png', os.path.join(bundle_portraits_dir, 'portrait_mage.png'), (400, 400), None),
    ]

    for src_rel, dst_path, resize_box, quality in assets_to_copy:
        src_path = os.path.join(base_dir, src_rel)
        if not os.path.exists(src_path):
            print(f"Warning: {src_path} does not exist, skipping.")
            continue

        try:
            with Image.open(src_path) as img:
                if resize_box:
                    img.thumbnail(resize_box, Image.Resampling.LANCZOS)
                
                if dst_path.endswith('.jpg'):
                    img.convert('RGB').save(dst_path, 'JPEG', quality=quality or 85, optimize=True)
                elif dst_path.endswith('.png'):
                    img.save(dst_path, 'PNG', optimize=True)
            print(f"Optimized: {os.path.basename(dst_path)} (size: {os.path.getsize(dst_path)/1024:.1f} KB)")
        except Exception as e:
            print(f"Error optimizing {src_path}: {e}")
            shutil.copy2(src_path, dst_path)

    # 3. Create zip file in public/ads/google_ads_playable_floor5.zip
    zip_output = os.path.join(ads_dir, 'google_ads_playable_floor5.zip')
    with zipfile.ZipFile(zip_output, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(bundle_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, bundle_dir)
                zipf.write(file_path, arcname)

    zip_size = os.path.getsize(zip_output)
    print(f"[OK] Google Ads zip package created at: {zip_output}")
    print(f"[PKG] Total package size: {zip_size / 1024 / 1024:.2f} MB ({zip_size} bytes)")
    if zip_size < 5 * 1024 * 1024:
        print("[SUCCESS] Package is UNDER the Google Ads 5.0 MB limit!")
    else:
        print("[WARNING] Package exceeds 5MB limit.")

if __name__ == '__main__':
    build_bundle()
