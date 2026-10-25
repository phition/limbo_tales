import fs from 'fs';
import path from 'path';

const delta = JSON.parse(fs.readFileSync('scripts/i18n/out/delta_013.json', 'utf8'));
const dictPath = 'src/i18n/translationDictionary.ts';
let dictContent = fs.readFileSync(dictPath, 'utf8');

// Find insertion point for EN (before "  },\n  ja: {")
const enMarker = '  },\n  ja: {';
const enEntries = [];
for (const [k, v] of Object.entries(delta)) {
  if (v.en) {
    const keyStr = JSON.stringify(k);
    if (!dictContent.includes(`${keyStr}:`)) {
      enEntries.push(`    ${keyStr}: ${JSON.stringify(v.en)},`);
    }
  }
}

if (enEntries.length > 0) {
  const enBlock = enEntries.join('\n') + '\n';
  dictContent = dictContent.replace(enMarker, enBlock + enMarker);
}

// Find insertion point for JA (before "  }};\n\n// ============================================================================\n// 2. DYNAMIC LOG PATTERNS")
const jaMarker = '  }};\n\n// ============================================================================\n// 2. DYNAMIC LOG PATTERNS';
const jaEntries = [];
for (const [k, v] of Object.entries(delta)) {
  if (v.ja) {
    const keyStr = JSON.stringify(k);
    // check if this key was already added in ja
    // to be safe, search after "  ja: {"
    const jaIdx = dictContent.indexOf('  ja: {');
    const jaSub = dictContent.slice(jaIdx);
    if (!jaSub.includes(`${keyStr}:`)) {
      jaEntries.push(`    ${keyStr}: ${JSON.stringify(v.ja)},`);
    }
  }
}

if (jaEntries.length > 0) {
  const jaBlock = jaEntries.join('\n') + '\n';
  dictContent = dictContent.replace(jaMarker, jaBlock + jaMarker);
}

fs.writeFileSync(dictPath, dictContent, 'utf8');
console.log(`Injected ${enEntries.length} EN and ${jaEntries.length} JA entries into translationDictionary.ts`);
