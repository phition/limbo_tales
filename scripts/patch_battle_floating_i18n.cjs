const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- 1. Patching BattleVFXOverlay.tsx ---');
let vfxPath = 'src/components/BattleVFXOverlay.tsx';
let vfxContent = fs.readFileSync(vfxPath, 'utf8');

if (!vfxContent.includes("import { useI18n } from '../hooks/useI18n';")) {
  vfxContent = vfxContent.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { useI18n } from '../hooks/useI18n';"
  );
}

// In VFXInstance, inject const { tr, lang } = useI18n();
if (!vfxContent.includes('const { tr, lang } = useI18n();')) {
  vfxContent = vfxContent.replace(
    'const VFXInstance: React.FC<{',
    'const VFXInstance: React.FC<{'
  );
  vfxContent = vfxContent.replace(
    'const isBossVfx = vfx.sourceType === \'boss\' || vfx.tier === 3 || vfx.type.startsWith(\'boss_\');',
    'const { tr, lang } = useI18n();\n  const isBossVfx = vfx.sourceType === \'boss\' || vfx.tier === 3 || vfx.type.startsWith(\'boss_\');'
  );
}

// In floating text: replace CRITICAL! and BLOCK! with language-aware text, and wrap vfx.text in tr()
const oldVfxText = `{vfx.isCrit && <span className="block text-[10px] text-[#ff3d00] font-bold text-center -mb-1 animate-pulse">CRITICAL!</span>}
          {(vfx.isBlock || vfx.text === 'Block!') && <span className="block text-[10px] text-[#90caf9] font-bold text-center -mb-1">🛡️ BLOCK!</span>}
          {(() => {
            if (vfx.text) return vfx.text;
            if (vfx.isBlock) return 'Block!';
            if (vfx.damage !== undefined) {
              if (vfx.isHeal) return \`+\${vfx.damage} HP\`;
              if (vfx.isShield) return \`+\${vfx.damage} SHIELD\`;
              if (vfx.damage > 0) return \`-\${vfx.damage}\`;
              return 'Block!';
            }
            return '';
          })()}`;

const newVfxText = `{vfx.isCrit && (
            <span className="block text-[10px] text-[#ff3d00] font-bold text-center -mb-1 animate-pulse">
              {lang === 'ko' ? '💥 치명타!' : lang === 'ja' ? '💥 会心の一撃!' : 'CRITICAL!'}
            </span>
          )}
          {(vfx.isBlock || vfx.text === 'Block!' || vfx.text === '방어!' || vfx.text === 'ガード!') && (
            <span className="block text-[10px] text-[#90caf9] font-bold text-center -mb-1">
              {lang === 'ko' ? '🛡️ 방어!' : lang === 'ja' ? '🛡️ ガード!' : '🛡️ BLOCK!'}
            </span>
          )}
          {(() => {
            if (vfx.text) return tr(vfx.text);
            if (vfx.isBlock) return lang === 'ko' ? '방어!' : lang === 'ja' ? 'ガード!' : 'Block!';
            if (vfx.damage !== undefined) {
              if (vfx.isHeal) return \`+\${vfx.damage} HP\`;
              if (vfx.isShield) return \`+\${vfx.damage} SHIELD\`;
              if (vfx.damage > 0) return \`-\${vfx.damage}\`;
              return lang === 'ko' ? '방어!' : lang === 'ja' ? 'ガード!' : 'Block!';
            }
            return '';
          })()}`;

// Normalize CRLF
const norm = s => s.replace(/\r\n/g, '\n');
vfxContent = norm(vfxContent);
if (vfxContent.includes(norm(oldVfxText))) {
  vfxContent = vfxContent.replace(norm(oldVfxText), newVfxText);
  console.log('✅ BattleVFXOverlay.tsx floating text updated');
} else {
  console.log('⚠️ Could not find exact oldVfxText in BattleVFXOverlay.tsx');
}
fs.writeFileSync(vfxPath, vfxContent, 'utf8');

console.log('--- 2. Patching BattleScreen.tsx ---');
let bsPath = 'src/screens/BattleScreen.tsx';
let bsContent = fs.readFileSync(bsPath, 'utf8');
bsContent = norm(bsContent);

// Hero death UI
bsContent = bsContent.replace(
  '<span>⚠️ 사경 위기</span>',
  '<span>⚠️ {tr(\'사경 위기\')}</span>'
);
bsContent = bsContent.replace(
  '<span className="font-mono bg-black/40 px-1.5 py-0.2 rounded text-[#ffeb3b]">{hero.deathCountdown ?? 3}턴</span>',
  '<span className="font-mono bg-black/40 px-1.5 py-0.2 rounded text-[#ffeb3b]">{hero.deathCountdown ?? 3}{tr(\'턴\')}</span>'
);
bsContent = bsContent.replace(
  '⚰️ 영구 사망',
  '⚰️ {tr(\'영구 사망\')}'
);
bsContent = bsContent.replace(
  '<span>완전 사망 카운트다운</span>',
  '<span>{tr(\'완전 사망 카운트다운\')}</span>'
);
bsContent = bsContent.replace(
  '<span className="bg-[#ff1744] px-1.5 py-0.2 rounded text-white font-bold tracking-wider">{hero.deathCountdown ?? 3}턴 남음</span>',
  '<span className="bg-[#ff1744] px-1.5 py-0.2 rounded text-white font-bold tracking-wider">{hero.deathCountdown ?? 3}{tr(\'턴 남음\')}</span>'
);
bsContent = bsContent.replace(
  "{isDying ? `사경 (${hero.deathCountdown ?? 3}턴)` : `${Math.round(hero.currentHp)}/${Math.round(stats.maxHp)}`}",
  "{isDying ? `${tr('사경')} (${hero.deathCountdown ?? 3}${tr('턴')})` : `${Math.round(hero.currentHp)}/${Math.round(stats.maxHp)}`}"
);

// CutIns and VFX
bsContent = bsContent.replace(
  "skillName: `[영면] ${hero.name}`,",
  "skillName: `[${tr('영면')}] ${tr(hero.name)}`,"
);
bsContent = bsContent.replace(
  "subText: '3턴간의 사경 끝에 완전히 전사했습니다...'",
  "subText: tr('3턴간의 사경 끝에 완전히 전사했습니다...')"
);
bsContent = bsContent.replace(
  "text: '⚰️ 완전 사망'",
  "text: tr('⚰️ 완전 사망')"
);

bsContent = bsContent.replace(
  "skillName: `[사경 헤맴] ${hero.name}`,",
  "skillName: `[${tr('사경 헤맴')}] ${tr(hero.name)}`,"
);
bsContent = bsContent.replace(
  "subText: `완전 사망까지 남은 유예: ${remaining}턴!`",
  "subText: `${tr('완전 사망까지 남은 유예')}: ${remaining}${tr('턴')}!`"
);
bsContent = bsContent.replace(
  "text: `💀 사경 (${remaining}턴 남음)`",
  "text: `💀 ${tr('사경')} (${remaining}${tr('턴 남음')})`"
);

// other floating text triggerVFX
bsContent = bsContent.replace("text: '💨 MISS',", "text: tr('💨 MISS'),");
bsContent = bsContent.replace("text: '💨 EVADE',", "text: tr('💨 EVADE'),");
bsContent = bsContent.replace("text: '🩸출혈!'", "text: tr('🩸출혈!')");
bsContent = bsContent.replace("text: '🔫점사!'", "text: tr('🔫점사!')");
bsContent = bsContent.replace("text: 'BREAK!',", "text: tr('BREAK!'),");
bsContent = bsContent.replace("text: '💥총공격!',", "text: tr('💥총공격!'),");
bsContent = bsContent.replace("text: '연쇄충격!',", "text: tr('연쇄충격!'),");
bsContent = bsContent.replace("text: isBlock ? 'Block!' : undefined,", "text: isBlock ? tr('🛡️ Block!') : undefined,");
bsContent = bsContent.replace("text: '궤도폭격!',", "text: tr('궤도폭격!'),");
bsContent = bsContent.replace("text: `부활! +${revHp} 🕊️`", "text: `${tr('부활!')} +${revHp} 🕊️`");
bsContent = bsContent.replace("text: `신성심판! ✨`", "text: `${tr('신성심판!')} ✨`");
bsContent = bsContent.replace("text: 'REVIVE!',", "text: tr('REVIVE!'),");
bsContent = bsContent.replace("text: '성마강타!',", "text: tr('성마강타!'),");
bsContent = bsContent.replace("text: `부활! +${revHp} 🕊️`", "text: `${tr('부활!')} +${revHp} 🕊️`");
bsContent = bsContent.replace("text: `신성심판! ✨`", "text: `${tr('신성심판!')} ✨`");
bsContent = bsContent.replace("text: isBlock ? 'Block!' : `🎯약점 원호: ${weaknessAssistDef.skillName}`", "text: isBlock ? tr('🛡️ Block!') : `🎯${tr('약점 원호')}: ${tr(weaknessAssistDef.skillName)}`");
bsContent = bsContent.replace("text: 'CHARGING!',", "text: tr('CHARGING!'),");
bsContent = bsContent.replace("text: '🎯INTERCEPT!',", "text: tr('🎯INTERCEPT!'),");
bsContent = bsContent.replace("text: '💨 MISS'", "text: tr('💨 MISS')");
bsContent = bsContent.replace("text: '💨 EVADE'", "text: tr('💨 EVADE')");
bsContent = bsContent.replace("text: frontCalc.isBlock ? 'Block!' : `-${frontFinalDmg} 🛡️엄호 분담`,", "text: frontCalc.isBlock ? tr('🛡️ Block!') : `-${frontFinalDmg} 🛡️${tr('엄호 분담')}`,");
bsContent = bsContent.replace("text: `✨반사 -${holyReflectDmg}`,", "text: `✨${tr('반사')} -${holyReflectDmg}`,");
bsContent = bsContent.replace("text: `✨반사 -${holyReflectDmg}`,", "text: `✨${tr('반사')} -${holyReflectDmg}`,");

// CutIn Weakness pursuit text
bsContent = bsContent.replace(
  "{skillCutIn.isWeaknessPursuit ? '🎯 WEAKNESS PURSUIT ASSIST ⚡' : '★ ASSIST ATTACK ★'}",
  "{skillCutIn.isWeaknessPursuit ? (lang === 'ko' ? '🎯 약점 추격 원호 ⚡' : lang === 'ja' ? '🎯 弱点追撃援護 ⚡' : '🎯 WEAKNESS PURSUIT ASSIST ⚡') : (lang === 'ko' ? '★ 원호 공격 ★' : lang === 'ja' ? '★ 援護攻撃 ★' : '★ ASSIST ATTACK ★')}"
);
bsContent = bsContent.replace(
  "{skillCutIn.bannerType === 'fever' ? '🔥 TACTICAL FEVER' : skillCutIn.isWeaknessPursuit ? '🎯 WEAKNESS PURSUIT' : '🤝 ASSIST'}",
  "{skillCutIn.bannerType === 'fever' ? tr('🔥 전술 파동 FEVER') : skillCutIn.isWeaknessPursuit ? tr('🎯 약점 추격') : tr('🤝 원호 공격')}"
);

fs.writeFileSync(bsPath, bsContent, 'utf8');
console.log('✅ BattleScreen.tsx updated');

console.log('--- 3. Patching ArenaScreen.tsx ---');
let asPath = 'src/screens/ArenaScreen.tsx';
let asContent = fs.readFileSync(asPath, 'utf8');
asContent = norm(asContent);

asContent = asContent.replace(
  "text: '💀 사경 위기 (3턴)!',",
  "text: `💀 ${tr('사경 위기')} (3${tr('턴')})!`,"
);
asContent = asContent.replace(
  "text: '💀 사경 위기 (3턴)!',",
  "text: `💀 ${tr('사경 위기')} (3${tr('턴')})!`,"
);
asContent = asContent.replace(
  "text: `💀 사경 헤맴 (${remaining}턴)`,",
  "text: `💀 ${tr('사경 헤맴')} (${remaining}${tr('턴')})`,"
);

fs.writeFileSync(asPath, asContent, 'utf8');
console.log('✅ ArenaScreen.tsx updated');

console.log('--- 4. Creating delta_018.json ---');
const delta018 = {
  "사경 위기": {
    en: "Crisis: Death's Door",
    ja: "瀕死の危機"
  },
  "사경 헤맴": {
    en: "Wandering Death's Door",
    ja: "死線彷徨"
  },
  "완전 사망 카운트다운": {
    en: "Final Demise Countdown",
    ja: "完全死亡カウントダウン"
  },
  "완전 사망까지 남은 유예": {
    en: "Grace before Perishing",
    ja: "完全死亡までの猶予"
  },
  "⚰️ 완전 사망": {
    en: "⚰️ Perished",
    ja: "⚰️ 完全死亡"
  },
  "영구 사망": {
    en: "Permanently Dead",
    ja: "永久死亡"
  },
  "영면": {
    en: "Eternal Rest",
    ja: "永眠"
  },
  "턴 남음": {
    en: "T left",
    ja: "ターン残り"
  },
  "3턴간의 사경 끝에 완전히 전사했습니다...": {
    en: "Succumbed to fatal wounds and perished after 3 turns...",
    ja: "3ターンの死闘の末、完全に戦死しました..."
  },
  "치명타!": {
    en: "CRITICAL!",
    ja: "会心の一撃!"
  },
  "💥 치명타!": {
    en: "💥 CRITICAL!",
    ja: "💥 会心の一撃!"
  },
  "방어!": {
    en: "BLOCK!",
    ja: "ガード!"
  },
  "🛡️ 방어!": {
    en: "🛡️ BLOCK!",
    ja: "🛡️ ガード!"
  },
  "🛡️ Block!": {
    en: "🛡️ BLOCK!",
    ja: "🛡️ ガード!"
  },
  "💨 MISS": {
    en: "💨 MISS",
    ja: "💨 ミス"
  },
  "💨 EVADE": {
    en: "💨 EVADE",
    ja: "💨 回避"
  },
  "🩸출혈!": {
    en: "🩸 Bleed!",
    ja: "🩸 出血!"
  },
  "🔫점사!": {
    en: "🔫 Burst Shot!",
    ja: "🔫 連射!"
  },
  "💥총공격!": {
    en: "💥 All-Out Attack!",
    ja: "💥 総攻撃!"
  },
  "연쇄충격!": {
    en: "Chain Shock!",
    ja: "連鎖衝撃!"
  },
  "궤도폭격!": {
    en: "Orbital Strike!",
    ja: "軌道爆撃!"
  },
  "부활!": {
    en: "Revived!",
    ja: "復活!"
  },
  "신성심판!": {
    en: "Divine Judgment!",
    ja: "神聖審判!"
  },
  "성마강타!": {
    en: "Sacred Smite!",
    ja: "聖魔強打!"
  },
  "약점 원호": {
    en: "Weakness Assist",
    ja: "弱点援護"
  },
  "엄호 분담": {
    en: "Cover Guard",
    ja: "援護分担"
  },
  "반사": {
    en: "Reflect",
    ja: "反射"
  },
  "차징 붕괴!": {
    en: "Charge Shattered!",
    ja: "チャージ崩壊!"
  },
  "1턴간 그로기 (받는 피해 +50%)": {
    en: "Groggy for 1 Turn (+50% DMG taken)",
    ja: "1ターン行動不能（被ダメージ+50%）"
  },
  "불멸의 수호": {
    en: "Immortal Guardian",
    ja: "不滅の守護"
  },
  "기사회생!": {
    en: "Miraculous Revival!",
    ja: "起死回生!"
  },
  "파티 전원 체력 100% 회복 및 자동 부활": {
    en: "Party 100% HP Restoration & Auto Revive",
    ja: "パーティ全員HP 100%回復＆自動復活"
  },
  "영혼 등대의 불사의 등불로 1회 즉시 부활!": {
    en: "Instantly revived once by Soul Lighthouse lantern!",
    ja: "魂の灯台の不死の灯火で1回即時復活！"
  },
  "의 수호의 결속!": {
    en: "'s Guardian Bond!",
    ja: "の守護の結束！"
  },
  "의 환영 반격!": {
    en: "'s Phantom Riposte!",
    ja: "の幻影反撃！"
  },
  "약점 집중 사격": {
    en: "Focused Weakness Fire",
    ja: "弱点集中射撃"
  },
  "💥 치명타 작열!": {
    en: "💥 Critical Blast!",
    ja: "💥 会心炸裂！"
  },
  "🔥 전술 파동 FEVER": {
    en: "🔥 TACTICAL FEVER",
    ja: "🔥 戦術波動FEVER"
  },
  "🎯 약점 추격": {
    en: "🎯 WEAKNESS PURSUIT",
    ja: "🎯 弱点追撃"
  },
  "🤝 원호 공격": {
    en: "🤝 ASSIST ATTACK",
    ja: "🤝 援護攻撃"
  },
  "🎯 약점 추격 원호 ⚡": {
    en: "🎯 WEAKNESS PURSUIT ASSIST ⚡",
    ja: "🎯 弱点追撃援護 ⚡"
  },
  "★ 원호 공격 ★": {
    en: "★ ASSIST ATTACK ★",
    ja: "★ 援護攻撃 ★"
  }
};

fs.writeFileSync('scripts/i18n/out/delta_018.json', JSON.stringify(delta018, null, 2), 'utf8');
console.log(`Generated delta_018.json with ${Object.keys(delta018).length} entries.`);

console.log('--- 5. Updating ko-all.json & translationDictionary.ts ---');
const koAllPath = 'scripts/i18n/ko-all.json';
const koAll = JSON.parse(fs.readFileSync(koAllPath, 'utf8'));
const koSet = new Set(koAll);
let addedCount = 0;
for (const key of Object.keys(delta018)) {
  if (!koSet.has(key)) {
    koAll.push(key);
    koSet.add(key);
    addedCount++;
  }
}
fs.writeFileSync(koAllPath, JSON.stringify(koAll, null, 2), 'utf8');
console.log(`Added ${addedCount} new keys to ko-all.json`);

const dictPath = 'src/i18n/translationDictionary.ts';
let dictContent = fs.readFileSync(dictPath, 'utf8');

const enMarker = '  },\n  ja: {';
const enEntries = [];
const enIdx = dictContent.indexOf('  en: {');
const jaIdx = dictContent.indexOf('  ja: {');
const enSub = dictContent.slice(enIdx, jaIdx);

for (const [k, v] of Object.entries(delta018)) {
  if (v.en) {
    const keyStr = JSON.stringify(k);
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
const updatedJaIdx = dictContent.indexOf('  ja: {');
const jaSub = dictContent.slice(updatedJaIdx);

for (const [k, v] of Object.entries(delta018)) {
  if (v.ja) {
    const keyStr = JSON.stringify(k);
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

console.log('--- 6. Running merge.mjs ---');
execSync('node scripts/i18n/merge.mjs', { stdio: 'inherit' });
