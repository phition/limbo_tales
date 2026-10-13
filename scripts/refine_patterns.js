import fs from 'fs';

let content = fs.readFileSync('src/i18n/translationDictionary.ts', 'utf8');

// 1. [암흑 잠식] 🐾마물 처리
content = content.replace(
  `  // 🔮 암흑 잠식: 🔮 [암흑 잠식] 암흑 마법이 A(마물)에게 팩션 상성 추가 피해 +X (+20%)를 입힙니다!
  {
    pattern: /🔮\\s*\\[암흑 잠식\\]\\s*암흑 마법이\\s*(.+?)\\((.+?)\\)에게 팩션 상성 추가 피해\\s*\\+([0-9,]+)\\s*\\(\\+20%\\)를 입힙니다!/i,
    en: m => \`🔮 [Dark Encroachment] Dark magic dealt +\${m[3]} (+20%) faction advantage DMG to \${m[1]} (\${m[2]})!\`,
    ja: m => \`🔮 [暗黒浸食] 暗黒魔法が\${m[1]}（\${m[2]}）に陣営相性追加ダメージ +\${m[3]} (+20%) を与えました！\`
  },`,
  `  // 🔮 암흑 잠식: 🔮 [암흑 잠식] 암흑 마법이 A(마물)에게 팩션 상성 추가 피해 +X (+20%)를 입힙니다!
  {
    pattern: /🔮\\s*\\[암흑 잠식\\]\\s*암흑 마법이\\s*(.+?)\\((.+?)\\)에게 팩션 상성 추가 피해\\s*\\+([0-9,]+)\\s*\\(\\+20%\\)를 입힙니다!/i,
    en: m => \`🔮 [Dark Encroachment] Dark magic dealt +\${m[3]} (+20%) faction advantage DMG to \${m[1]} (\${m[2].replace('마물', 'Monster')})!\`,
    ja: m => \`🔮 [暗黒浸食] 暗黒魔法が\${m[1]}（\${m[2].replace('마물', '魔物')}）に陣営相性追加ダメージ +\${m[3]} (+20%) を与えました！\`
  },`
);

// 2. [후열 저격] 피해 증폭 처리
content = content.replace(
  `  // 🎯 후열 저격: 🎯 [후열 저격] A(후열) 약점 관통 저격! (...)
  {
    pattern: /🎯\\s*\\[후열 저격\\]\\s*(.+?)\\(후열\\)\\s*약점 관통 저격!(.*)/i,
    en: m => \`🎯 [Backline Snipe] Vulnerability snipe on \${m[1]} (Back)!\${m[2]}\`,
    ja: m => \`🎯 [後列狙撃] \${m[1]}（後列）の急所貫通狙撃！\${m[2]}\`
  },`,
  `  // 🎯 후열 저격: 🎯 [후열 저격] A(후열) 약점 관통 저격! (...)
  {
    pattern: /🎯\\s*\\[후열 저격\\]\\s*(.+?)\\(후열\\)\\s*약점 관통 저격!(.*)/i,
    en: m => \`🎯 [Backline Snipe] Vulnerability snipe on \${m[1]} (Back)!\${m[2].replace('피해 증폭', 'DMG Boost')}\`,
    ja: m => \`🎯 [後列狙撃] \${m[1]}（後列）の急所貫通狙撃！\${m[2].replace('피해 증폭', 'ダメージ増幅')}\`
  },`
);

// 3. [회피 / EVADE] 조사 캡처 버그 방지 (비탐욕 매칭 개선)
content = content.replace(
  `  // 💨 회피 / EVADE (일반/추가타): 💨 [회피 / EVADE] A이(가) B의 C 공격/추가 타격을 회피했습니다!
  {
    pattern: /💨\\s*\\[회피\\s*\\/\\s*EVADE\\]\\s*(.+?)(?:이\\(가\\)|이|가)\\s*(.+?)의\\s*(.+?)\\s*(?:추가 타격을|공격을)\\s*회피했습니다!/i,
    en: m => \`💨 [EVADE] \${m[1]} evaded \${m[2]}'s \${m[3]} strike!\`,
    ja: m => \`💨 [回避 / EVADE] \${m[1]}が\${m[2]}の\${m[3]}攻撃を回避しました！\`
  },`,
  `  // 💨 회피 / EVADE (일반/추가타): 💨 [회피 / EVADE] A이(가) B의 C 공격/추가 타격을 회피했습니다!
  {
    pattern: /💨\\s*\\[회피\\s*\\/\\s*EVADE\\]\\s*(.+?)(?:이\\(가\\)|\\s+이|\\s+가|이|가)\\s+(.+?)의\\s*(.+?)\\s*(?:추가 타격을|공격을)\\s*회피했습니다!/i,
    en: m => \`💨 [EVADE] \${m[1]} evaded \${m[2]}'s \${m[3]} strike!\`,
    ja: m => \`💨 [回避 / EVADE] \${m[1]}が\${m[2]}の\${m[3]}攻撃を回避しました！\`
  },`
);

// 4. [치명적 본능 회피] 조사 캡처 개선
content = content.replace(
  `  // 치명적 본능 회피
  {
    pattern: /💨\\s*\\[회피\\s*\\/\\s*EVADE\\]\\s*(.+?)(?:이\\(가\\)|이|가)\\s*(.+?)의\\s*\\[치명적 본능\\]\\s*추가 연격을 회피했습니다!/i,
    en: m => \`💨 [EVADE] \${m[1]} evaded \${m[2]}'s [Lethal Instinct] follow-up strike!\`,
    ja: m => \`💨 [回避 / EVADE] \${m[1]}が\${m[2]}の[致命的本能]追加追撃を回避しました！\`
  },`,
  `  // 치명적 본능 회피
  {
    pattern: /💨\\s*\\[회피\\s*\\/\\s*EVADE\\]\\s*(.+?)(?:이\\(가\\)|\\s+이|\\s+가|이|가)\\s+(.+?)의\\s*\\[치명적 본능\\]\\s*추가 연격을 회피했습니다!/i,
    en: m => \`💨 [EVADE] \${m[1]} evaded \${m[2]}'s [Lethal Instinct] follow-up strike!\`,
    ja: m => \`💨 [回避 / EVADE] \${m[1]}が\${m[2]}の[致命적본능]追加追撃を回避しました！\`.replace('致命적본능', '致命的本能')
  },`
);

// 5. [시전 요격 추가타] 대사 번역
content = content.replace(
  `  // 시전 요격 추가타
  {
    pattern: /▶\\s*💨🎯\\s*\\[시전 요격 추가타!\\]\\s*(.+?):\\s*"차징을 끊어라! 선제 사격!"\\s*(.+?)에게\\s*(\\d+)\\s*요격 피해 및 브레이크 요구치\\s*-(\\d+)\\s*선제 파쇄!/i,
    en: m => \`▶ 💨🎯 [Intercept Shot!] \${m[1]}: "Break the charge!" Dealt \${m[3]} intercept DMG to \${m[2]} & reduced break gauge by -\${m[4]}!\`,
    ja: m => \`▶ 💨🎯 [詠唱迎撃追撃!] \${m[1]}:「チャージを止めろ！先制射撃！」\${m[2]}に\${m[3]}迎撃ダメージ＆ブレイク要求値 -\${m[4]} 先制粉砕!\`
  },`,
  `  // 시전 요격 추가타
  {
    pattern: /▶\\s*💨🎯\\s*\\[시전 요격 추가타!\\]\\s*(.+?):\\s*"차징을 끊어라! 선제 사격!"\\s*(.+?)에게\\s*(\\d+)\\s*요격 피해 및 브레이크 요구치\\s*-(\\d+)\\s*선제 파쇄!/i,
    en: m => \`▶ 💨🎯 [Intercept Shot!] \${m[1]}: "Break the charge! Preemptive strike!" Dealt \${m[3]} intercept DMG to \${m[2]} & reduced break gauge by -\${m[4]}!\`,
    ja: m => \`▶ 💨🎯 [詠唱迎撃追撃!] \${m[1]}:「チャージを止めろ！先制射撃！」\${m[2]}に\${m[3]}迎撃ダメージ＆ブレイク要求値 -\${m[4]} 先制粉砕！\`
  },`
);

// 6. [진형 붕괴 위치 이동] 조사 캡처 개선
content = content.replace(
  `  // 진형 붕괴 위치 이동
  {
    pattern: /🌀\\s*\\[진형 붕괴\\]\\s*(.+?)(?:이\\(가\\)|이|가)\\s*(.+?)되어\\s*\\[(.+?)\\]로 이동했습니다!/i,
    en: m => \`🌀 [Formation Disrupted] \${m[1]} was \${m[2]} and moved to [\${m[3]}]!\`,
    ja: m => \`🌀 [陣形崩壊] \${m[1]}が\${m[2]}され[\${m[3]}]へ移動しました！\`
  },`,
  `  // 진형 붕괴 위치 이동
  {
    pattern: /🌀\\s*\\[진형 붕괴\\]\\s*(.+?)(?:이\\(가\\)|\\s+이|\\s+가|이|가)\\s+(.+?)되어\\s*\\[(.+?)\\]로 이동했습니다!/i,
    en: m => \`🌀 [Formation Disrupted] \${m[1]} was \${m[2]} and moved to [\${m[3]}]!\`,
    ja: m => \`🌀 [陣形崩壊] \${m[1]}が\${m[2]}され[\${m[3]}]へ移動しました！\`
  },`
);

// 7. [사선의 맹세] 패턴 잔여 한국어 정리
content = content.replace(
  `  // 사선의 맹세 불굴 버팀
  {
    pattern: /💖\\s*\\[사선의 맹세\\]\\s*(?:동료들과 맺은 굳건한 맹세의 결속이 빛을 발하며,\\s*)?(.+?)\\s*대원이 불굴의 투지로 (?:죽음의 턱밑에서|버텨냅니다!)(.*)/i,
    en: m => \`💖 [Oath of the Brink] Unyielding will shines! \${m[1]} perseveres through sheer tenacity!\${m[2]}\`,
    ja: m => \`💖 [死線の誓い] 仲間との誓いが輝き、\${m[1]}隊員が不屈の闘志で持ち堪えました！\${m[2]}\`
  },
  // 사선의 맹세 동료 수호
  {
    pattern: /💖\\s*\\[사선의 맹세\\]\\s*동료를 지키기 위해\\s*(.+?)\\s*대원이 불굴의 투지로 버텨냅니다!/i,
    en: m => \`💖 [Oath of the Brink] To protect companions, \${m[1]} endures with unyielding determination!\`,
    ja: m => \`💖 [死線の誓い] 仲間を守るため、\${m[1]}隊員が不屈の闘志で耐え抜きます！\`
  },`,
  `  // 사선의 맹세 불굴 버팀 및 동료 수호
  {
    pattern: /💖\\s*\\[사선의 맹세\\]\\s*(?:동료들과 맺은 굳건한 맹세의 결속이 빛을 발하며,\\s*|동료를 지키기 위해\\s*)?(.+?)\\s*대원이 불굴의 투지로 (?:죽음의 턱밑에서\\s*)?버텨냅니다!/i,
    en: m => \`💖 [Oath of the Brink] Unyielding bond shines! \${m[1]} endures through sheer tenacity!\`,
    ja: m => \`💖 [死線の誓い] 仲間との結束が輝き、\${m[1]}隊員が不屈の闘志で持ち堪えました！\`
  },`
);

// 8. [전투 철수 성공] 부가정보 번역
content = content.replace(
  `  // 🏃 탈출 성공 로그: 🏃 [전투 철수 성공!] 적의 추격을 뿌리치고 안전하게 후퇴했습니다. ...
  {
    pattern: /🏃\\s*\\[전투 철수 성공!\\]\\s*적의 추격을 뿌리치고 안전하게 후퇴했습니다\\.(.*)/i,
    en: m => \`🏃 [Retreat Success!] Safely shook off enemy pursuit and retreated.\${m[1]}\`,
    ja: m => \`🏃 [戦闘撤退成功!] 敵の追撃を振り切り無事に撤退しました。\${m[1]}\`
  },`,
  `  // 🏃 탈출 성공 로그: 🏃 [전투 철수 성공!] 적의 추격을 뿌리치고 안전하게 후퇴했습니다. ...
  {
    pattern: /🏃\\s*\\[전투 철수 성공!\\]\\s*적의 추격을 뿌리치고 안전하게 후퇴했습니다\\.(.*)/i,
    en: m => \`🏃 [Retreat Success!] Safely shook off enemy pursuit and retreated.\${m[1].replace('탈출 확률', 'Escape rate').replace('행운 보정', 'Luck bonus')}\`,
    ja: m => \`🏃 [戦闘撤退成功!] 敵の追撃を振り切り無事に撤退しました。\${m[1].replace('탈출 확률', '脱出確率').replace('행운 보정', '幸運補正')}\`
  },`
);

fs.writeFileSync('src/i18n/translationDictionary.ts', content, 'utf8');
console.log('Successfully refined translationDictionary.ts!');
