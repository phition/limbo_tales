import fs from 'fs';
import { NEW_PATTERNS } from './test_new_patterns.js';

let content = fs.readFileSync('src/i18n/translationDictionary.ts', 'utf8');

// 1. 기존 불일치 패턴 3건 수정
content = content.replace(
  `  // 🛡️ 타격 배수진 만료
  {
    pattern: /🛡️\\s*\\[타격 배수진\\]\\s*전투 개시 1라운드가 종료되어 타격 보호막이 소멸했습니다\\./i,
    en: () => \`🛡️ [Last Stand] Round 1 ended; strike barrier dissipated.\`,
    ja: () => \`🛡️ [背水の陣] 第1ラウンドが終了し、ストライクシールドが消滅しました。\`
  },`,
  `  // 🚩/🛡️ 돌격/타격 배수진 만료
  {
    pattern: /(?:🚩|🛡️)\\s*\\[(?:돌격|타격)\\s*배수진\\]\\s*전투\\s*(?:개시\\s*1라운드가|첫\\s*턴\\(1라운드\\)이)\\s*종료되어\\s*(?:돌격|타격)\\s*보호막이 소멸했습니다\\./i,
    en: () => \`🚩 [Last Stand] Round 1 ended; vanguard barrier dissipated.\`,
    ja: () => \`🚩 [背水の陣] 第1ラウンドが終了し、突撃シールドが消滅しました。\`
  },`
);

content = content.replace(
  `  // ⚰️ 영면 로그
  {
    pattern: /⚰️\\s*\\[영면\\]\\s*차가운 심연의 바닥에서\\s*(.+?)\\s*용병의 맥박이 완전히 멎었습니다\\.\\.\\s*동료의 영혼이 칠흑의 어둠 속으로 흩어집니다\\./i,
    en: m => \`⚰️ [Eternal Sleep] On the cold abyssal floor, mercenary \${m[1]}'s pulse ceased... A companion's soul disperses into the darkness.\`,
    ja: m => \`⚰️ [永眠] 冷たい深淵の底で傭兵\${m[1]}の脈拍が完全に停止しました…仲間の魂が漆黒の闇へと散っていきます。\`
  },`,
  `  // ⚰️ 영면 로그
  {
    pattern: /⚰️\\s*\\[영면\\]\\s*차가운 심연의 바닥에서\\s*(.+?)\\s*(?:용병|대원)의 맥박이 완전히 멎었습니다\\.\\.\\.?\\s*동료의 영혼이 (?:칠흑|영겁)의 어둠 속으로 흩어집니다\\./i,
    en: m => \`⚰️ [Eternal Sleep] On the cold abyssal floor, \${m[1]}'s pulse ceased... A companion's soul disperses into the endless dark.\`,
    ja: m => \`⚰️ [永眠] 冷たい深淵の底で\${m[1]}の脈拍が完全に停止しました…仲間の魂が永劫の闇へと散っていきます。\`
  },`
);

content = content.replace(
  `  // 🛡️ 임종의 위기
  {
    pattern: /🛡️\\s*\\[임종의 위기\\]\\s*(.+?)\\s*용병의 호흡이 끊어지며 심장 박동이 멎어 갑니다!\\s*남은 시간이 얼마 없습니다!/i,
    en: m => \`🛡️ [Mortal Peril] Mercenary \${m[1]}'s breath fades and heartbeat falters! Time is running out!\`,
    ja: m => \`🛡️ [臨終の危機] 傭兵\${m[1]}の呼吸が途絶え、心拍が衰えていきます！残された時間はわずかです！\`
  },`,
  `  // 💀/🛡️ 임종의 위기
  {
    pattern: /(?:💀|🛡️)\\s*\\[임종의 위기\\]\\s*(.+?)\\s*(?:용병|대원)의 호흡이 (?:끊어지며|옅어지고)\\s*심장 박동이 (?:멎어|희미해져)\\s*갑니다!\\s*남은 시간이 얼마 없습니다!/i,
    en: m => \`💀 [Mortal Peril] \${m[1]}'s breath fades and heartbeat falters! Time is running out!\`,
    ja: m => \`💀 [臨終の危機] \${m[1]}の呼吸が途絶え、心拍が衰えていきます！残された時間はわずかです！\`
  },`
);

// 2. NEW_PATTERNS를 문자열 코드로 변환
const patternStrings = NEW_PATTERNS.map(p => {
  return `  // ${p.name}\n  {\n    pattern: ${p.pattern.toString()},\n    en: ${p.en.toString()},\n    ja: ${p.ja.toString()}\n  },`;
}).join('\n');

// 3. LOG_PATTERNS 마지막에 삽입
const insertTarget = '  // ⚔️ 일반 타격 / 데미지 로그 기본 패턴 지원: A이(가) B에게 X 피해를 입혔습니다!\n  {';
if (!content.includes(insertTarget)) {
  console.error('Target not found in translationDictionary.ts!');
  process.exit(1);
}

content = content.replace(insertTarget, `${patternStrings}\n\n${insertTarget}`);

fs.writeFileSync('src/i18n/translationDictionary.ts', content, 'utf8');
console.log('Successfully updated src/i18n/translationDictionary.ts!');
