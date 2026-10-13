/**
 * ═════════════════════════════════════════════════════════════════════════
 *  🛠️ Custom Asset & Media CLI Utility (Node.js CommonJS)
 * ═════════════════════════════════════════════════════════════════════════
 *  사용법:
 *    node scripts/custom_asset_tool.cjs status     : 현재 에셋 현황 및 통계 확인
 *    node scripts/custom_asset_tool.cjs verify     : 에셋 파일 존재 여부 및 누락 점검
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'icons');
const BGM_DIR = path.join(ROOT_DIR, 'public', 'assets', 'bgm');

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      count += countFiles(full);
    } else {
      count++;
    }
  }
  return count;
}

function showStatus() {
  console.log('\n🎨 ─── [Project: Limbo Tales] Custom Asset & Audio Status ─── 🎨');
  console.log(`📁 Icons Directory: ${ICONS_DIR}`);
  console.log(`   - Total Icon Files: ${countFiles(ICONS_DIR)} files`);
  console.log(`🎵 BGM Directory: ${BGM_DIR}`);
  console.log(`   - Total Audio Files: ${countFiles(BGM_DIR)} files\n`);
  
  const subdirs = ['resources', 'status', 'equipment', 'buildings', 'supplies', 'skills'];
  subdirs.forEach(sub => {
    const p = path.join(ICONS_DIR, sub);
    console.log(`   • ${sub.padEnd(12)}: ${countFiles(p)} icons`);
  });
  console.log('─────────────────────────────────────────────────────────────\n');
}

function verifyAssets() {
  console.log('\n🔍 Checking asset integrity...');
  const iconMapFile = path.join(ROOT_DIR, 'src', 'utils', 'iconMap.ts');
  if (fs.existsSync(iconMapFile)) {
    const content = fs.readFileSync(iconMapFile, 'utf8');
    const matches = content.match(/src:\s*'([^']+)'/g) || [];
    let missing = 0;
    matches.forEach(m => {
      const rel = m.replace(/src:\s*'/, '').replace(/'$/, '');
      const cleanRel = rel.startsWith('/') ? rel.slice(1) : rel;
      const targetPath = path.join(ROOT_DIR, 'public', cleanRel);
      if (!fs.existsSync(targetPath)) {
        console.warn(`⚠️ [MISSING] ${cleanRel}`);
        missing++;
      }
    });
    if (missing === 0) {
      console.log(`✅ All ${matches.length} mapped icon paths exist in public/!`);
    } else {
      console.warn(`⚠️ Total ${missing} missing files detected.`);
    }
  }
}

const action = process.argv[2] || 'status';
if (action === 'status') {
  showStatus();
} else if (action === 'verify') {
  verifyAssets();
} else {
  console.log(`Unknown command: ${action}`);
  console.log('Available: status, verify');
}
