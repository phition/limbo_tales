import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const CUSTOM_DIR = path.join(ROOT_DIR, 'custom_assets');
const PUBLIC_ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');
const PRESET_PATH = path.join(PUBLIC_ASSETS_DIR, 'custom_assets_preset.json');

console.log('🔄 [sync-custom-assets] Starting auto-sync for custom assets...');

// Ensure target directories exist
const subdirs = [
  'icons/skills', 'icons/resources', 'icons/equipment', 'icons/buildings',
  'icons/supplies', 'icons/status', 'icons/books', 'dungeons', 'monsters',
  'mercenaries', 'vfx', 'bgm', 'sfx',
  'custom_uploaded/icons', 'custom_uploaded/dungeons', 'custom_uploaded/monsters',
  'custom_uploaded/monster_videos', 'custom_uploaded/mercenaries', 'custom_uploaded/vfx',
  'custom_uploaded/bgm', 'custom_uploaded/sfx'
];
subdirs.forEach(sd => fs.mkdirSync(path.join(PUBLIC_ASSETS_DIR, sd), { recursive: true }));

let existingPreset = {
  pureEmojiMode: false,
  syntheticAudioOnly: false,
  iconOverrides: {},
  bgmOverrides: {},
  sfxOverrides: {},
  vfxOverrides: {},
  vfxConfigs: {},
  dungeonFloorOverrides: {},
  monsterOverrides: {},
  monsterVideoOverrides: {},
  mercenaryOverrides: {},
  version: 1
};

// 1. 기존 custom_assets_preset.json 로드
if (fs.existsSync(PRESET_PATH)) {
  try {
    const raw = fs.readFileSync(PRESET_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const key of Object.keys(existingPreset)) {
      if (typeof existingPreset[key] === 'object' && existingPreset[key] !== null) {
        existingPreset[key] = { ...existingPreset[key], ...(parsed[key] || {}) };
      }
    }
    existingPreset.pureEmojiMode = false; // 기본값은 항상 고해상도 그래픽 모드
    existingPreset.syntheticAudioOnly = !!parsed.syntheticAudioOnly;
    existingPreset.version = (parsed.version || 1) + 1;
  } catch (e) {
    console.warn('⚠️ Could not parse existing custom_assets_preset.json, initializing fresh.');
  }
}

// 2. 🌟 public/assets 및 루트에 있는 모든 limbo_custom_assets_*.json 파일을 탐색하여 완전 병합!
const scanDirsForJson = [PUBLIC_ASSETS_DIR, ROOT_DIR];
for (const dir of scanDirsForJson) {
  if (fs.existsSync(dir)) {
    const jsonFiles = fs.readdirSync(dir).filter(f => f.startsWith('limbo_custom_assets_') && f.endsWith('.json')).sort();
    for (const jf of jsonFiles) {
      try {
        const fullP = path.join(dir, jf);
        const raw = fs.readFileSync(fullP, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log(`✨ [sync-custom-assets] Merging custom export: ${jf}`);
        const overrideKeys = [
          'iconOverrides', 'bgmOverrides', 'sfxOverrides', 'vfxOverrides', 'vfxConfigs',
          'dungeonFloorOverrides', 'monsterOverrides', 'monsterVideoOverrides', 'mercenaryOverrides'
        ];
        for (const ok of overrideKeys) {
          if (parsed[ok] && typeof parsed[ok] === 'object') {
            existingPreset[ok] = { ...existingPreset[ok], ...parsed[ok] };
            const count = Object.keys(parsed[ok]).length;
            if (count > 0) console.log(`   └─ ${ok}: ${count} items merged`);
          }
        }
      } catch (err) {
        console.warn(`⚠️ Failed to parse ${jf}:`, err);
      }
    }
  }
}

// Copy files recursively from custom_assets to public/assets
function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log('  📋 Copied asset:', entry.name, '->', path.relative(ROOT_DIR, destPath));
    }
  }
}
copyRecursive(CUSTOM_DIR, PUBLIC_ASSETS_DIR);

// Auto-index assets in public/assets into preset
function scanAndIndex(dir, baseRel = 'assets') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = (baseRel + '/' + entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      scanAndIndex(fullPath, relPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const baseName = path.basename(entry.name, ext);
      
      // 1. Icons
      if (relPath.includes('/icons/')) {
        if (!existingPreset.iconOverrides[baseName]) {
          existingPreset.iconOverrides[baseName] = relPath;
        }
      }
      // 2. VFX Sprites (🌟 MUST take precedence over monster/boss matching!)
      else if (relPath.includes('/vfx/') && (ext === '.png' || ext === '.gif' || ext === '.webp' || ext === '.apng')) {
        existingPreset.vfxOverrides[baseName] = relPath;
        if (existingPreset.monsterOverrides && existingPreset.monsterOverrides[baseName]) {
          delete existingPreset.monsterOverrides[baseName];
        }
      }
      // 3. Dungeons
      else if (baseName.startsWith('dungeon_') && (ext === '.jpg' || ext === '.png' || ext === '.webp' || ext === '.gif' || ext === '.mp4')) {
        const floorKey = baseName.replace('dungeon_', '');
        existingPreset.dungeonFloorOverrides[baseName] = relPath;
        existingPreset.dungeonFloorOverrides[floorKey] = relPath;
      }
      // 4. Boss cutscene videos
      else if ((baseName.startsWith('boss_') || baseName.startsWith('boss_floor_')) && (ext === '.mp4' || ext === '.webm')) {
        existingPreset.monsterVideoOverrides[baseName] = relPath;
      }
      // 5. Monster / Boss images (Excluding VFX and icons)
      else if ((baseName.startsWith('monster_') || baseName.startsWith('boss_')) && (ext === '.jpg' || ext === '.png' || ext === '.webp' || ext === '.gif')) {
        if (!relPath.includes('/vfx/') && !relPath.includes('/icons/')) {
          existingPreset.monsterOverrides[baseName] = relPath;
        }
      }
      // 6. Mercenary / Hero portraits
      else if ((baseName.startsWith('hero_') || baseName.startsWith('mercenary_') || baseName.startsWith('valk_')) && (ext === '.jpg' || ext === '.png' || ext === '.webp' || ext === '.gif')) {
        existingPreset.mercenaryOverrides[baseName] = relPath;
      }
      // 7. BGM
      else if (relPath.includes('/bgm/') && (ext === '.mp3' || ext === '.ogg' || ext === '.wav')) {
        const trackKey = baseName.replace('bgm_', '');
        existingPreset.bgmOverrides[trackKey] = relPath;
      }
      // 8. SFX
      else if (relPath.includes('/sfx/') && (ext === '.mp3' || ext === '.ogg' || ext === '.wav')) {
        const sfxKey = baseName.replace('sfx_', '');
        existingPreset.sfxOverrides[sfxKey] = relPath;
      }
    }
  }
}

scanAndIndex(PUBLIC_ASSETS_DIR);

// 🛡️ 보스 결전기 VFX 키가 monsterOverrides에 잔류하지 않도록 완전 정화 및 vfxOverrides 보장
const BOSS_VFX_KEYS = ['boss_apocalypse', 'boss_cataclysm', 'boss_dragon_breath', 'boss_abyss_vortex'];
for (const bvk of BOSS_VFX_KEYS) {
  if (existingPreset.monsterOverrides) {
    delete existingPreset.monsterOverrides[bvk];
  }
  const vfxFile = `assets/custom_uploaded/vfx/${bvk}.png`;
  if (fs.existsSync(path.join(PUBLIC_ASSETS_DIR, `custom_uploaded/vfx/${bvk}.png`))) {
    existingPreset.vfxOverrides[bvk] = vfxFile;
  }
}

fs.writeFileSync(PRESET_PATH, JSON.stringify(existingPreset, null, 2), 'utf-8');
const backupPresetPath = path.join(CUSTOM_DIR, 'custom_assets_preset.json');
if (fs.existsSync(CUSTOM_DIR)) {
  fs.writeFileSync(backupPresetPath, JSON.stringify(existingPreset, null, 2), 'utf-8');
}
console.log('✅ [sync-custom-assets] Asset preset generated at public/assets/custom_assets_preset.json and custom_assets/custom_assets_preset.json');
