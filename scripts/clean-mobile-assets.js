import fs from 'fs';
import path from 'path';

/**
 * 📱 clean-mobile-assets.js
 * 모바일(Capacitor Android) 동기화 시 마스터 계정 전용 도구, 워터마크 제거기,
 * 독립형 사전 편집 HTML 및 외부 개발자 유틸리티를 빌드 산출물과 모바일 에셋에서 배제하는 스크립트
 */

const ROOT_DIR = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT_DIR, 'dist'),
  path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'public'),
];

console.log('🧹 [clean-mobile-assets] Sanitizing mobile assets & excluding external master tools...');

let removedCount = 0;

for (const baseDir of TARGET_DIRS) {
  if (!fs.existsSync(baseDir)) continue;

  // 1. tools 폴더 배제 (워터마크 제거기 등 외부 웹 도구)
  const toolsDir = path.join(baseDir, 'tools');
  if (fs.existsSync(toolsDir)) {
    try {
      fs.rmSync(toolsDir, { recursive: true, force: true });
      console.log(`  🗑️ Removed external tools folder: ${path.relative(ROOT_DIR, toolsDir)}`);
      removedCount++;
    } catch (e) {
      console.warn(`  ⚠️ Could not remove ${toolsDir}:`, e.message);
    }
  }

  // 2. 루트 레벨의 불필요한 외부/개발자 HTML 파일 정리 (index.html, privacy.html 제외)
  try {
    const rootFiles = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const f of rootFiles) {
      if (f.isFile() && f.name.endsWith('.html')) {
        const allowed = ['index.html', 'privacy.html'];
        if (!allowed.includes(f.name.toLowerCase())) {
          const fPath = path.join(baseDir, f.name);
          fs.unlinkSync(fPath);
          console.log(`  🗑️ Removed external HTML document: ${path.relative(ROOT_DIR, fPath)}`);
          removedCount++;
        }
      }
    }
  } catch (_) {}

  // 3. 백업/임시 export JSON 배제 (limbo_custom_assets_*.json 등)
  const assetsDir = path.join(baseDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    try {
      const assetFiles = fs.readdirSync(assetsDir, { withFileTypes: true });
      for (const f of assetFiles) {
        if (f.isFile() && f.name.startsWith('limbo_custom_assets_') && f.name.endsWith('.json')) {
          const fPath = path.join(assetsDir, f.name);
          fs.unlinkSync(fPath);
          console.log(`  🗑️ Removed custom asset export dump: ${path.relative(ROOT_DIR, fPath)}`);
          removedCount++;
        }
      }
    } catch (_) {}
  }
}

console.log(`✨ [clean-mobile-assets] Mobile asset sanitization finished. (${removedCount} external items excluded)`);
