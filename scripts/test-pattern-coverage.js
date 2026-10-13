import fs from 'fs';

const tsContent = fs.readFileSync('src/i18n/translationDictionary.ts', 'utf8');

// LOG_PATTERNS 부분 추출
const startIdx = tsContent.indexOf('export const LOG_PATTERNS');
const patternSlice = tsContent.slice(startIdx);

// 정규식 리터럴들 추출
const regexMatches = [];
const regexRegex = /pattern:\s*(\/[^\n\r]+\/[a-z]*)/g;
let rm;
while ((rm = regexRegex.exec(patternSlice)) !== null) {
  try {
    const r = eval(rm[1]);
    regexMatches.push(r);
  } catch (e) {
    console.error('Error evaluating regex:', rm[1]);
  }
}

console.log(`Found ${regexMatches.length} patterns in translationDictionary.ts`);

const templates = JSON.parse(fs.readFileSync('scripts/extracted_battle_logs.json', 'utf8'));

const unhandled = [];
const handled = [];

for (const tpl of templates) {
  const sample = tpl
    .replace(/\$\{[^}]*duration[^}]*\}/gi, '2')
    .replace(/\$\{[^}]*name[^}]*\}/gi, '아이리스')
    .replace(/\$\{[^}]*target[^}]*\}/gi, '타락한 사제')
    .replace(/\$\{[^}]*skill[^}]*\}/gi, '강타')
    .replace(/\$\{[^}]*(?:damage|dmg|amt|val|heal|dot|cost|mp|hp|pct|bonus|exp|gold|turns|count|level|enhance|rate|gauge|cut|shred|mag|shield|drain|mult|diff|left|luck|dur|turn|round|num|idx|absorbed|eff|gained|refund)[^}]*\}/gi, '120')
    .replace(/\$\{[^}]*\}/g, '테스트');

  let matched = false;
  for (const re of regexMatches) {
    if (re.test(sample) || re.test(tpl)) {
      matched = true;
      break;
    }
  }

  if (matched) {
    handled.push(tpl);
  } else {
    unhandled.push({ template: tpl, sample });
  }
}

console.log(`Matched: ${handled.length} / ${templates.length} (${Math.round(handled.length / templates.length * 100)}%)`);
console.log(`Unhandled: ${unhandled.length} / ${templates.length} (${Math.round(unhandled.length / templates.length * 100)}%)`);

if (unhandled.length > 0) {
  console.log('\nUnhandled templates:');
  unhandled.forEach(u => console.log(u.template));
}
