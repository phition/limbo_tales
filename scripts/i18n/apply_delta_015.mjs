import fs from 'fs';
import path from 'path';

const delta = JSON.parse(fs.readFileSync('scripts/i18n/out/delta_015.json', 'utf8'));

// 1. Update ko-all.json
const koAllPath = 'scripts/i18n/ko-all.json';
const koAll = JSON.parse(fs.readFileSync(koAllPath, 'utf8'));
const koSet = new Set(koAll);
let addedCount = 0;
for (const key of Object.keys(delta)) {
  if (!koSet.has(key)) {
    koAll.push(key);
    koSet.add(key);
    addedCount++;
  }
}
fs.writeFileSync(koAllPath, JSON.stringify(koAll, null, 2), 'utf8');
console.log(`Added ${addedCount} new keys to ko-all.json`);

// 2. Inject into src/i18n/translationDictionary.ts
const dictPath = 'src/i18n/translationDictionary.ts';
let dictContent = fs.readFileSync(dictPath, 'utf8');

const enMarker = '  },\n  ja: {';
const enEntries = [];
for (const [k, v] of Object.entries(delta)) {
  if (v.en) {
    const keyStr = JSON.stringify(k);
    const enIdx = dictContent.indexOf('  en: {');
    const jaIdx = dictContent.indexOf('  ja: {');
    const enSub = dictContent.slice(enIdx, jaIdx);
    if (!enSub.includes(`${keyStr}:`)) {
      enEntries.push(`    ${keyStr}: ${JSON.stringify(v.en)},`);
    }
  }
}

if (enEntries.length > 0) {
  const enBlock = enEntries.join('\n') + '\n';
  dictContent = dictContent.replace(enMarker, enBlock + enMarker);
}

const jaMarker = '  }};\n\n// ============================================================================\n// 2. DYNAMIC LOG PATTERNS';
const jaEntries = [];
for (const [k, v] of Object.entries(delta)) {
  if (v.ja) {
    const keyStr = JSON.stringify(k);
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
