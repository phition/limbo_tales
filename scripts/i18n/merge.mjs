// 번역 청크 병합 + 검증: scripts/i18n/out/*.json -> src/i18n/generated/{en,ja}.json
import fs from 'fs';
import path from 'path';

const DIR = path.resolve('scripts/i18n');
const all = JSON.parse(fs.readFileSync(path.join(DIR, 'ko-all.json'), 'utf8'));
const outDir = path.join(DIR, 'out');
const merged = {};
for (const f of fs.readdirSync(outDir).filter(f => f.endsWith('.json')).sort()) {
  try {
    Object.assign(merged, JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8')));
  } catch (e) { console.log('BAD JSON', f, e.message); }
}

const ph = s => (s.match(/\{\d+\}/g) || []).sort().join('');
const en = {}, ja = {};
const missing = [], badPh = [];
for (const ko of all) {
  const t = merged[ko];
  if (!t || !t.en || !t.ja) { missing.push(ko); continue; }
  if (ph(ko) !== ph(t.en) || ph(ko) !== ph(t.ja)) { badPh.push(ko); }
  en[ko] = t.en; ja[ko] = t.ja;
}
const genDir = path.resolve('src/i18n/generated');
fs.mkdirSync(genDir, { recursive: true });
fs.writeFileSync(path.join(genDir, 'en.json'), JSON.stringify(en));
fs.writeFileSync(path.join(genDir, 'ja.json'), JSON.stringify(ja));
fs.writeFileSync(path.join(DIR, 'missing.json'), JSON.stringify(missing, null, 1));
console.log(`total ${all.length} translated ${Object.keys(en).length} missing ${missing.length} placeholderMismatch ${badPh.length}`);
if (badPh.length) fs.writeFileSync(path.join(DIR, 'bad-placeholders.json'), JSON.stringify(badPh, null, 1));
