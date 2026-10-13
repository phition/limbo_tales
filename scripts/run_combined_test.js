import fs from 'fs';
import { NEW_PATTERNS } from './test_new_patterns.js';

const tsContent = fs.readFileSync('src/i18n/translationDictionary.ts', 'utf8');

// 기존 패턴 추출
const startIdx = tsContent.indexOf('export const LOG_PATTERNS');
const patternSlice = tsContent.slice(startIdx);

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

// 신규 패턴도 추가
for (const np of NEW_PATTERNS) {
  regexMatches.push(np.pattern);
}

// 기존 패턴 중 수정할 정규식 추가/치환
regexMatches.push(/⚰️\s*\[영면\]\s*차가운 심연의 바닥에서\s*(.+?)\s*(?:용병|대원)의 맥박이 완전히 멎었습니다\.\.\.?\s*동료의 영혼이 (?:칠흑|영겁)의 어둠 속으로 흩어집니다\./i);
regexMatches.push(/(?:💀|🛡️)\s*\[임종의 위기\]\s*(.+?)\s*(?:용병|대원)의 호흡이 (?:끊어지며|옅어지고)\s*심장 박동이 (?:멎어|희미해져)\s*갑니다!\s*남은 시간이 얼마 없습니다!/i);
regexMatches.push(/(?:🚩|🛡️)\s*\[(?:돌격|타격)\s*배수진\]\s*전투\s*(?:개시\s*1라운드가|첫\s*턴\(1라운드\)이)\s*종료되어\s*(?:돌격|타격)\s*보호막이 소멸했습니다\./i);

console.log(`Total pattern count to test: ${regexMatches.length}`);

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
    handled.push({ template: tpl, sample });
  } else {
    unhandled.push({ template: tpl, sample });
  }
}

console.log(`\n================ RESULT ================`);
console.log(`Matched: ${handled.length} / ${templates.length} (${Math.round(handled.length / templates.length * 100)}%)`);
console.log(`Unhandled: ${unhandled.length} / ${templates.length} (${Math.round(unhandled.length / templates.length * 100)}%)`);

if (unhandled.length > 0) {
  console.log('\nRemaining Unhandled:');
  unhandled.forEach((u, i) => console.log(`[${i+1}] Template: ${u.template}\n    Sample: ${u.sample}`));
}
