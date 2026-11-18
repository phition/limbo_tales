import os
import cv2
import numpy as np
from PIL import Image

TARGET_FILES = [
    # Tier 0 (12)
    'portrait_squire_male_02.webp', 'portrait_squire_female_02.webp',
    'portrait_rogue_male_02.webp', 'portrait_rogue_female_02.webp',
    'portrait_mage_male_02.webp', 'portrait_mage_female_02.webp',
    'portrait_cleric_male_02.webp', 'portrait_cleric_female_02.webp',
    'portrait_berserker_male_02.webp', 'portrait_berserker_female_02.webp',
    'portrait_gunner_male_02.webp', 'portrait_gunner_female_02.webp',
    # Tier 2 (12)
    'portrait_t2_valkyrie_male_02.webp', 'portrait_t2_valkyrie_female_02.webp',
    'portrait_t2_shadow_phantom_male_02.webp', 'portrait_t2_shadow_phantom_female_02.webp',
    'portrait_t2_calamity_mage_male_02.webp', 'portrait_t2_calamity_mage_female_02.webp',
    'portrait_t2_high_saintess_male_02.webp', 'portrait_t2_high_saintess_female_02.webp',
    'portrait_t2_valhalla_blade_male_02.webp', 'portrait_t2_valhalla_blade_female_02.webp',
    'portrait_t2_gun_meister_male_02.webp', 'portrait_t2_gun_meister_female_02.webp',
    # Tier 3 (12)
    'portrait_t3_bastion_male_02.webp', 'portrait_t3_bastion_female_02.webp',
    'portrait_t3_void_strider_male_02.webp', 'portrait_t3_void_strider_female_02.webp',
    'portrait_t3_chrono_archon_male_02.webp', 'portrait_t3_chrono_archon_female_02.webp',
    'portrait_t3_seraphic_inquisitor_male_02.webp', 'portrait_t3_seraphic_inquisitor_female_02.webp',
    'portrait_t3_valhalla_warlord_male_02.webp', 'portrait_t3_valhalla_warlord_female_02.webp',
    'portrait_t3_omega_deadeye_male_02.webp', 'portrait_t3_omega_deadeye_female_02.webp'
]

DIRS = [
    os.path.join('public', 'assets', 'portraits'),
    os.path.join('custom_assets', 'portraits')
]

def make_transparent(img_bgr):
    h, w = img_bgr.shape[:2]
    mask = np.zeros((h+2, w+2), np.uint8)
    flags = 4 | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)
    diff = (15, 15, 15)

    # Floodfill from borders where pixels are close to solid white
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
    
    # Smooth edges with 0.8px Gaussian blur for clean anti-aliasing
    char_mask_smooth = cv2.GaussianBlur(char_mask, (3, 3), 0.8)
    
    # Vectorized color unmatting: removes white fringe/halo on border pixels
    alpha = char_mask_smooth.astype(np.float32) / 255.0
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    alpha_clamped = np.clip(alpha, 1e-4, 1.0)[:, :, None]
    unmatted = (img_rgb - 255.0 * (1.0 - alpha[:, :, None])) / alpha_clamped
    unmatted = np.clip(unmatted, 0, 255).astype(np.uint8)

    rgba = np.dstack((unmatted, char_mask_smooth))
    return Image.fromarray(rgba, 'RGBA')

def main():
    print(f"[START] Processing background transparency for {len(TARGET_FILES)} portraits...")
    success_count = 0

    for fname in TARGET_FILES:
        src_path = os.path.join('public', 'assets', 'portraits', fname)
        if not os.path.exists(src_path):
            print(f"[WARN] Source file not found: {src_path}")
            continue

        img_bgr = cv2.imread(src_path)
        if img_bgr is None:
            print(f"[WARN] Could not load image: {src_path}")
            continue

        transparent_img = make_transparent(img_bgr)

        # Save to all target directories
        for d in DIRS:
            out_path = os.path.join(d, fname)
            os.makedirs(d, exist_ok=True)
            transparent_img.save(out_path, 'WEBP', quality=95, method=6)
        
        success_count += 1
        print(f"[OK] [{success_count}/{len(TARGET_FILES)}] Transparent WebP saved: {fname}")

    print(f"\n[DONE] Successfully processed {success_count}/{len(TARGET_FILES)} portraits to transparent WebP!")

if __name__ == '__main__':
    main()
