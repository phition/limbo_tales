import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const CUSTOM_DIR = path.join(ROOT_DIR, 'custom_assets');
const PUBLIC_ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');
const PRESET_PATH = path.join(PUBLIC_ASSETS_DIR, 'custom_assets_preset.json');
const BACKUP_PRESET_PATH = path.join(CUSTOM_DIR, 'custom_assets_preset.json');

console.log('🔄 [sync-custom-assets] Starting auto-sync for custom assets...');

// Ensure target directories exist (일원화된 custom_uploaded 구조)
const subdirs = [
  'custom_uploaded/icons', 'custom_uploaded/dungeons', 'custom_uploaded/monsters',
  'custom_uploaded/monster_videos', 'custom_uploaded/mercenaries', 'custom_uploaded/vfx',
  'custom_uploaded/bgm', 'custom_uploaded/sfx', 'custom_uploaded/npcs',
  'dungeons', 'bgm', 'portraits'
];
subdirs.forEach(sd => fs.mkdirSync(path.join(PUBLIC_ASSETS_DIR, sd), { recursive: true }));
subdirs.forEach(sd => fs.mkdirSync(path.join(CUSTOM_DIR, sd), { recursive: true }));

// 불필요한 구형 빈 icons 폴더 정리
const obsoletePublicIcons = path.join(PUBLIC_ASSETS_DIR, 'icons');
if (fs.existsSync(obsoletePublicIcons)) {
  try {
    fs.rmSync(obsoletePublicIcons, { recursive: true, force: true });
  } catch (_) {}
}
const obsoleteCustomIcons = path.join(CUSTOM_DIR, 'icons');
if (fs.existsSync(obsoleteCustomIcons)) {
  try {
    fs.rmSync(obsoleteCustomIcons, { recursive: true, force: true });
  } catch (_) {}
}

// 🧹 배포 및 빌드에 불필요한 마케팅 배너 및 미참조 파일 정리
const obsoleteFiles = [
  'feature_graphic_1024x500.png',
  'feature_graphic_1024x500.jpg',
  'feature_graphic_medieval_1024x500.png',
  'feature_graphic_medieval_1024x500.jpg',
  'feature_graphic_new_1024x500.png',
  'feature_graphic_new_1024x500.jpg',
  'feature_graphic_cinzel_1024x500.png',
  'feature_graphic_cinzel_1024x500.jpg',
  'feature_graphic_blackletter_1024x500.png',
  'feature_graphic_blackletter_1024x500.jpg',
  'feature_graphic_final_cinzel.png',
  'feature_graphic_final_cinzel.jpg',
  'feature_graphic_final_blackletter.png',
  'feature_graphic_final_blackletter.jpg',
  'store_cover_1024x500.png',
  'store_cover_1024x500.jpg',
  'valkyrie_saintess.jpg',
  'boss_f.jpg',
  'boss_floor_11.png',
];
for (const ofile of obsoleteFiles) {
  for (const base of [PUBLIC_ASSETS_DIR, CUSTOM_DIR]) {
    const fPath = path.join(base, ofile);
    if (fs.existsSync(fPath)) {
      try {
        fs.unlinkSync(fPath);
        console.log(`🧹 [sync-custom-assets] Removed obsolete unreferenced asset: ${ofile}`);
      } catch (_) {}
    }
  }
}

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
  npcOverrides: {},
  version: 1
};

// 1. 기존 custom_assets_preset.json 로드 (public과 custom_assets 양쪽 탐색하여 최신/병합 데이터 유지)
const candidatePresets = [PRESET_PATH, BACKUP_PRESET_PATH];
let maxVersionFound = 1;

for (const pPath of candidatePresets) {
  if (fs.existsSync(pPath)) {
    try {
      const raw = fs.readFileSync(pPath, 'utf-8');
      const parsed = JSON.parse(raw);
      for (const key of Object.keys(existingPreset)) {
        if (typeof existingPreset[key] === 'object' && existingPreset[key] !== null) {
          existingPreset[key] = { ...existingPreset[key], ...(parsed[key] || {}) };
        }
      }
      if (parsed.syntheticAudioOnly !== undefined) {
        existingPreset.syntheticAudioOnly = !!parsed.syntheticAudioOnly;
      }
      if (parsed.version && parsed.version > maxVersionFound) {
        maxVersionFound = parsed.version;
      }
    } catch (e) {
      console.warn(`⚠️ Could not parse ${pPath}:`, e.message);
    }
  }
}
existingPreset.pureEmojiMode = false; // 기본값은 항상 고해상도 그래픽 모드
existingPreset.version = maxVersionFound + 1;

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
          'dungeonFloorOverrides', 'monsterOverrides', 'monsterVideoOverrides', 'mercenaryOverrides', 'npcOverrides'
        ];
        for (const ok of overrideKeys) {
          if (parsed[ok] && typeof parsed[ok] === 'object') {
            for (const [k, v] of Object.entries(parsed[ok])) {
              // Real asset paths ('assets/...') must NEVER be overwritten by base64 or emoji
              const currentVal = existingPreset[ok]?.[k];
              if (!currentVal || (typeof currentVal === 'string' && currentVal.startsWith('data:') && typeof v === 'string' && !v.startsWith('data:'))) {
                existingPreset[ok][k] = v;
              }
            }
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

// Copy files recursively
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
      try {
        if (fs.existsSync(destPath)) {
          const srcStat = fs.statSync(srcPath);
          const destStat = fs.statSync(destPath);
          if (srcStat.size === destStat.size && Math.abs(srcStat.mtimeMs - destStat.mtimeMs) < 1000) {
            continue; // Already identical, avoid locked overwrite in OneDrive
          }
        }
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        console.warn(`[sync-custom-assets] Warning: Could not copy ${srcPath} -> ${destPath}:`, err.message);
      }
    }
  }
}

// Two-way sync: Ensure public/assets/custom_uploaded is backed up to custom_assets/custom_uploaded and vice versa
const publicCustomUploaded = path.join(PUBLIC_ASSETS_DIR, 'custom_uploaded');
const customCustomUploaded = path.join(CUSTOM_DIR, 'custom_uploaded');
copyRecursive(publicCustomUploaded, customCustomUploaded);
copyRecursive(customCustomUploaded, publicCustomUploaded);
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
      
      // 1. Icons: Real file paths index, but PRESERVE explicit 'emoji' choices!
      if (relPath.includes('/icons/')) {
        const currentVal = existingPreset.iconOverrides[baseName];
        const isExplicitEmoji = currentVal === 'emoji' || (typeof currentVal === 'string' && !currentVal.startsWith('assets/') && !currentVal.startsWith('data:') && !currentVal.startsWith('/'));
        if (!isExplicitEmoji) {
          existingPreset.iconOverrides[baseName] = relPath;
          if (baseName === 'blacksmith' && existingPreset.iconOverrides['forge'] !== 'emoji') existingPreset.iconOverrides['forge'] = relPath;
          else if (baseName === 'forge' && existingPreset.iconOverrides['blacksmith'] !== 'emoji' && !existingPreset.iconOverrides['blacksmith']) existingPreset.iconOverrides['blacksmith'] = relPath;
          else if (baseName === 'arenaGate' && existingPreset.iconOverrides['arena'] !== 'emoji') existingPreset.iconOverrides['arena'] = relPath;
          else if (baseName === 'arena' && existingPreset.iconOverrides['arenaGate'] !== 'emoji' && !existingPreset.iconOverrides['arenaGate']) existingPreset.iconOverrides['arenaGate'] = relPath;
          else if (baseName === 'bonfire' && existingPreset.iconOverrides['citadel'] !== 'emoji' && !existingPreset.iconOverrides['citadel']) existingPreset.iconOverrides['citadel'] = relPath;
          else if (baseName === 'citadel' && existingPreset.iconOverrides['bonfire'] !== 'emoji' && !existingPreset.iconOverrides['bonfire']) existingPreset.iconOverrides['bonfire'] = relPath;
        } else {
          // 시설 및 휠 키 상호 동기화 (이모지 동기화)
          if (baseName === 'blacksmith' && existingPreset.iconOverrides['forge'] !== 'emoji') existingPreset.iconOverrides['forge'] = currentVal;
          else if (baseName === 'forge' && existingPreset.iconOverrides['blacksmith'] !== 'emoji') existingPreset.iconOverrides['blacksmith'] = currentVal;
          else if (baseName === 'arenaGate' && existingPreset.iconOverrides['arena'] !== 'emoji') existingPreset.iconOverrides['arena'] = currentVal;
          else if (baseName === 'arena' && existingPreset.iconOverrides['arenaGate'] !== 'emoji') existingPreset.iconOverrides['arenaGate'] = currentVal;
          else if (baseName === 'bonfire' && existingPreset.iconOverrides['citadel'] !== 'emoji') existingPreset.iconOverrides['citadel'] = currentVal;
          else if (baseName === 'citadel' && existingPreset.iconOverrides['bonfire'] !== 'emoji') existingPreset.iconOverrides['bonfire'] = currentVal;
        }
      }
      // 2. VFX Sprites
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
      // 5. Monster / Boss images
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
      // 9. NPC Portraits
      else if ((baseName.startsWith('npc_') || relPath.includes('/npcs/')) && (ext === '.jpg' || ext === '.png' || ext === '.webp' || ext === '.gif')) {
        if (!existingPreset.npcOverrides) existingPreset.npcOverrides = {};
        if (baseName.startsWith('npc_')) {
          existingPreset.npcOverrides[baseName] = relPath;
        }
      }
    }
  }
}

scanAndIndex(PUBLIC_ASSETS_DIR);

// 🛡️ 누락되거나 레거시 base64인 경우에만 실제 파일 경로로 인덱싱 (명시적 'emoji' 설정은 영구 보존)
const iconsDir = path.join(PUBLIC_ASSETS_DIR, 'custom_uploaded', 'icons');
if (fs.existsSync(iconsDir)) {
  const iconFiles = fs.readdirSync(iconsDir);
  for (const f of iconFiles) {
    const ext = path.extname(f).toLowerCase();
    if (ext === '.png' || ext === '.webp' || ext === '.svg' || ext === '.jpg') {
      const bName = path.basename(f, ext);
      const relPath = `assets/custom_uploaded/icons/${f}`;
      const currentVal = existingPreset.iconOverrides[bName];
      const isExplicitEmoji = currentVal === 'emoji' || (typeof currentVal === 'string' && !currentVal.startsWith('assets/') && !currentVal.startsWith('data:') && !currentVal.startsWith('/'));
      if (!currentVal || (!isExplicitEmoji && currentVal.startsWith('data:'))) {
        existingPreset.iconOverrides[bName] = relPath;
      }
    }
  }
}

// 🛡️ 보스 마도서/스킬 별칭 매핑 (book_boss_* <-> book_m_boss_floor_*, skill_boss_* <-> skill_m_boss_floor_*)
const BOSS_BOOK_ALIAS_MAP = {
  book_boss_colossus_core: 'book_m_boss_floor_1',
  book_m_boss_floor_1: 'book_boss_colossus_core',
  skill_boss_colossus_core: 'skill_m_boss_floor_1',
  skill_m_boss_floor_1: 'skill_boss_colossus_core',

  book_boss_deathknight_reap: 'book_m_boss_floor_2',
  book_m_boss_floor_2: 'book_boss_deathknight_reap',
  skill_boss_deathknight_reap: 'skill_m_boss_floor_2',
  skill_m_boss_floor_2: 'skill_boss_deathknight_reap',

  book_boss_behemoth_eruption: 'book_m_boss_floor_3',
  book_m_boss_floor_3: 'book_boss_behemoth_eruption',
  skill_boss_behemoth_eruption: 'skill_m_boss_floor_3',
  skill_m_boss_floor_3: 'skill_boss_behemoth_eruption',

  book_boss_chrono_warp: 'book_m_boss_floor_4',
  book_m_boss_floor_4: 'book_boss_chrono_warp',
  skill_boss_chrono_warp: 'skill_m_boss_floor_4',
  skill_m_boss_floor_4: 'skill_boss_chrono_warp',

  book_boss_void_cataclysm: 'book_m_boss_floor_5',
  book_m_boss_floor_5: 'book_boss_void_cataclysm',
  book_m_monster_void_overlord: 'book_boss_void_cataclysm',
  skill_boss_void_cataclysm: 'skill_m_boss_floor_5',
  skill_m_boss_floor_5: 'skill_boss_void_cataclysm',
  skill_m_monster_void_overlord: 'skill_boss_void_cataclysm',

  book_boss_blood_monarch: 'book_m_boss_floor_6',
  book_m_boss_floor_6: 'book_boss_blood_monarch',
  skill_boss_blood_monarch: 'skill_m_boss_floor_6',
  skill_m_boss_floor_6: 'skill_boss_blood_monarch',

  book_boss_oblivion_scythe: 'book_m_boss_floor_7',
  book_m_boss_floor_7: 'book_boss_oblivion_scythe',
  skill_boss_oblivion_scythe: 'skill_m_boss_floor_7',
  skill_m_boss_floor_7: 'skill_boss_oblivion_scythe',

  book_boss_judgment_sanctum: 'book_m_boss_floor_8',
  book_m_boss_floor_8: 'book_boss_judgment_sanctum',
  skill_boss_judgment_sanctum: 'skill_m_boss_floor_8',
  skill_m_boss_floor_8: 'skill_boss_judgment_sanctum',

  book_boss_mirror_kaleidoscope: 'book_m_boss_floor_9',
  book_m_boss_floor_9: 'book_boss_mirror_kaleidoscope',
  skill_boss_mirror_kaleidoscope: 'skill_m_boss_floor_9',
  skill_m_boss_floor_9: 'skill_boss_mirror_kaleidoscope',

  book_boss_asmodeus_armageddon: 'book_m_boss_floor_10',
  book_m_boss_floor_10: 'book_boss_asmodeus_armageddon',
  skill_boss_asmodeus_armageddon: 'skill_m_boss_floor_10',
  skill_m_boss_floor_10: 'skill_boss_asmodeus_armageddon',
};
for (const [k, alias] of Object.entries(BOSS_BOOK_ALIAS_MAP)) {
  if (existingPreset.iconOverrides[k] && !existingPreset.iconOverrides[alias]) {
    existingPreset.iconOverrides[alias] = existingPreset.iconOverrides[k];
  }
}

// 🛡️ 마도서(book_) <-> 스킬(skill_) 상호 보완 자동 매핑
for (const [k, v] of Object.entries({ ...existingPreset.iconOverrides })) {
  if (k.startsWith('book_')) {
    const skillKey = k.replace(/^book_/, 'skill_');
    if (!existingPreset.iconOverrides[skillKey]) {
      existingPreset.iconOverrides[skillKey] = v;
    }
  } else if (k.startsWith('skill_')) {
    const bookKey = k.replace(/^skill_/, 'book_');
    if (!existingPreset.iconOverrides[bookKey]) {
      existingPreset.iconOverrides[bookKey] = v;
    }
  }
}

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

// 🛡️ 존재하지 않는 레거시 경로('assets/icons/...') 자동 정화
const checkCategories = ['iconOverrides', 'vfxOverrides', 'dungeonFloorOverrides', 'monsterOverrides', 'mercenaryOverrides', 'npcOverrides'];
for (const cat of checkCategories) {
  if (existingPreset[cat] && typeof existingPreset[cat] === 'object') {
    for (const [k, v] of Object.entries(existingPreset[cat])) {
      if (typeof v === 'string' && v.startsWith('assets/')) {
        const checkPath = path.join(PUBLIC_ASSETS_DIR, v.replace(/^assets\//, ''));
        if (!fs.existsSync(checkPath)) {
          console.log(`🧹 [sync-custom-assets] Removing obsolete missing asset path: ${cat}.${k} -> ${v}`);
          delete existingPreset[cat][k];
        }
      }
    }
  }
}

// Safe write function with retries for OneDrive file locks
function safeWriteFileSync(filePath, content, retries = 10, delayMs = 300) {
  if (fs.existsSync(filePath)) {
    try {
      const existing = fs.readFileSync(filePath, 'utf-8');
      if (existing === content) return; // 동일하면 쓰지 않음 (OneDrive 락 회피)
    } catch (_) {}
  }
  for (let i = 0; i < retries; i++) {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return;
    } catch (err) {
      if (i === retries - 1) {
        console.warn(`[sync-custom-assets] Warning: Could not write ${filePath} (OneDrive lock):`, err.message);
        return;
      }
      const start = Date.now();
      while (Date.now() - start < delayMs) {} // synchronous wait
    }
  }
}

// Save preset to public and backup to custom_assets
safeWriteFileSync(PRESET_PATH, JSON.stringify(existingPreset, null, 2));
if (fs.existsSync(CUSTOM_DIR)) {
  safeWriteFileSync(BACKUP_PRESET_PATH, JSON.stringify(existingPreset, null, 2));
}

// 빌드 산출물 폴더가 있는 경우 함께 동기화 (배포 보장)
const distAssetsDir = path.join(ROOT_DIR, 'dist', 'assets');
if (fs.existsSync(distAssetsDir)) {
  safeWriteFileSync(path.join(distAssetsDir, 'custom_assets_preset.json'), JSON.stringify(existingPreset, null, 2));
}

console.log('✅ [sync-custom-assets] Asset preset generated at public/assets/custom_assets_preset.json and custom_assets/custom_assets_preset.json');
