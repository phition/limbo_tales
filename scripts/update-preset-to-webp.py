import json
import os
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRESET_FILES = [
    os.path.join(ROOT_DIR, 'custom_assets', 'custom_assets_preset.json'),
    os.path.join(ROOT_DIR, 'public', 'assets', 'custom_assets_preset.json')
]

EXT_PATTERN = re.compile(r'\.(png|jpg|jpeg)$', re.IGNORECASE)

def update_val(val):
    if isinstance(val, str) and EXT_PATTERN.search(val):
        return EXT_PATTERN.sub('.webp', val), True
    return val, False

def update_preset():
    for p in PRESET_FILES:
        if not os.path.exists(p):
            continue
        with open(p, 'r', encoding='utf-8') as f:
            data = json.load(f)

        replaced_count = 0
        for k, v in data.items():
            if k == 'vfxOverrides':
                # VFX 스프라이트 시트는 렌더링 성능을 위해 항상 PNG 유지
                if isinstance(v, dict):
                    for vfx_k, vfx_v in v.items():
                        if isinstance(vfx_v, str) and vfx_v.endswith('.webp'):
                            data[k][vfx_k] = vfx_v.replace('.webp', '.png')
                            replaced_count += 1
                continue
            if isinstance(v, dict):
                for sub_k, sub_v in v.items():
                    new_sub_v, changed = update_val(sub_v)
                    if changed:
                        data[k][sub_k] = new_sub_v
                        replaced_count += 1
            elif isinstance(v, str):
                new_v, changed = update_val(v)
                if changed:
                    data[k] = new_v
                    replaced_count += 1

        if replaced_count > 0:
            temp_p = p + '.tmp'
            with open(temp_p, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(temp_p, p)
            print(f"Updated {p}: replaced {replaced_count} image references to .webp")
        else:
            print(f"{p}: already up-to-date")

if __name__ == '__main__':
    update_preset()
