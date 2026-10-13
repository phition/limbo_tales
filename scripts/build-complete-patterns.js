import fs from 'fs';

const unhandled = JSON.parse(fs.readFileSync('scripts/unhandled_battle_logs.json', 'utf8'));

console.log(`Analyzing all ${unhandled.length} unhandled templates...`);

// 각 템플릿의 패턴과 번역 규칙을 작성
// 템플릿들을 패턴화하기 위한 헬퍼
const patternDefs = [];

for (const item of unhandled) {
  const tpl = item.template;
  patternDefs.push(tpl);
}

fs.writeFileSync('scripts/all_unhandled_raw.txt', patternDefs.join('\n'), 'utf8');
console.log('Saved all unhandled templates to scripts/all_unhandled_raw.txt');
