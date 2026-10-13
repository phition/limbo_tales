import fs from 'fs';
import { I18nService } from '../src/i18n/I18nService.ts';

const templates = JSON.parse(fs.readFileSync('scripts/extracted_battle_logs.json', 'utf8'));
const service = I18nService.getInstance();

let enPassed = 0;
let jaPassed = 0;

const enHangulRemain = [];
const jaHangulRemain = [];

for (const tpl of templates) {
  // 현실적인 전투 데이터 시뮬레이션
  const sample = tpl
    .replace(/\$\{[^}]*duration[^}]*\}/gi, '2')
    .replace(/\$\{[^}]*name[^}]*\}/gi, '아이리스')
    .replace(/\$\{[^}]*target[^}]*\}/gi, '타락한 사제')
    .replace(/\$\{[^}]*skill[^}]*\}/gi, '강타')
    .replace(/\$\{[^}]*(?:damage|dmg|amt|val|heal|dot|cost|mp|hp|pct|bonus|exp|gold|turns|count|level|enhance|rate|gauge|cut|shred|mag|shield|drain|mult|diff|left|luck|dur|turn|round|num|idx|absorbed|eff|gained|refund)[^}]*\}/gi, '120')
    .replace(/\$\{[^}]*\}/g, '테스트');

  const enResult = service.tr(sample, 'en');
  const jaResult = service.tr(sample, 'ja');

  // 조사나 고유명사 '아이리스', '타락한 사제' 등 주입된 샘플 제외하고 한글 술어가 남았는지 검사
  // 더미로 주입한 이름들을 영문/일문으로 치환하여 순수 전투 로그 문장이 번역되었는지 확인
  const enClean = enResult.replace(/아이리스/g, 'Iris').replace(/타락한 사제/g, 'Corrupt Priest').replace(/강타/g, 'Smash').replace(/테스트/g, 'Test');
  const jaClean = jaResult.replace(/아이리스/g, 'アイリス').replace(/타락한 사제/g, '堕落した司祭').replace(/강타/g, '強打').replace(/테스트/g, 'テスト');

  const hasHangulEn = /[\uac00-\ud7af]/.test(enClean);
  const hasHangulJa = /[\uac00-\ud7af]/.test(jaClean);

  if (!hasHangulEn) enPassed++;
  else enHangulRemain.push({ template: tpl, sample, result: enClean });

  if (!hasHangulJa) jaPassed++;
  else jaHangulRemain.push({ template: tpl, sample, result: jaClean });
}

console.log('============= RUNTIME TRANSLATION TEST =============');
console.log(`EN: ${enPassed} / ${templates.length} (${Math.round(enPassed / templates.length * 100)}%)`);
console.log(`JA: ${jaPassed} / ${templates.length} (${Math.round(jaPassed / templates.length * 100)}%)`);

if (enHangulRemain.length > 0) {
  console.log('\n[EN Remaining Hangul]:');
  enHangulRemain.forEach((r, i) => console.log(`[${i+1}] ${r.result}`));
}

if (jaHangulRemain.length > 0) {
  console.log('\n[JA Remaining Hangul]:');
  jaHangulRemain.forEach((r, i) => console.log(`[${i+1}] ${r.result}`));
}
