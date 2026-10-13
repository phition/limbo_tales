import fs from 'fs';

// 142개 및 신규 패턴들을 테스트하고 최적화하기 위한 스크립트
// translationDictionary.ts에 들어갈 패턴 정의들을 구성합니다.

export const NEW_PATTERNS = [
  // ── 1. 전투 흐름 & 결과 ──
  {
    name: '전투 재개',
    pattern: /🔄\s*\[전투 재개\]\s*중단되었던 전투 세션\(턴\s*(\d+)\)을 이어서 진행합니다\./i,
    en: m => `🔄 [Resume Battle] Resuming suspended combat session (Turn ${m[1]}).`,
    ja: m => `🔄 [戦闘再開] 中断されていた戦闘セッション（ターン${m[1]}）を再開します。`
  },
  {
    name: '전투 승리',
    pattern: /🎉\s*전투 승리!\s*\(획득:\s*🪙\s*([0-9,]+)\s*G,\s*(.*?),\s*⚔️\s*([0-9,]+)\s*EXP\)/i,
    en: m => `🎉 Victory! (Obtained: 🪙 ${m[1]}G, ${m[2]}, ⚔️ ${m[3]} EXP)`,
    ja: m => `🎉 勝利！（獲得: 🪙 ${m[1]}G, ${m[2]}, ⚔️ ${m[3]} EXP）`
  },
  {
    name: '전투 패배',
    pattern: /💀\s*전투 패배\.\.\./i,
    en: () => `💀 Defeat...`,
    ja: () => `💀 敗北…`
  },
  {
    name: '라운드 표시',
    pattern: /🚩\s*(\d+)라운드/i,
    en: m => `🚩 Round ${m[1]}`,
    ja: m => `🚩 ラウンド ${m[1]}`
  },
  {
    name: '턴 행동자 표시',
    pattern: /⏳\s*\[(.+?)\]\s*\((\d+)턴\)/i,
    en: m => `⏳ [${m[1]}] (Turn ${m[2]})`,
    ja: m => `⏳ [${m[1]}] (${m[2]}ターン)`
  },
  {
    name: '도주/철수 실패',
    pattern: /⚠️\s*\[전투 철수 실패!\]\s*퇴로가 막혀 도주에 실패했습니다!\s*\(성공률:\s*(\d+)%\s*실패,\s*적 반격 턴\)/i,
    en: m => `⚠️ [Retreat Failed!] Retreat path blocked! (${m[1]}% failure rate, enemy counter turn)`,
    ja: m => `⚠️ [戦闘撤退失敗!] 退路を塞がれ逃走に失敗しました！（成功率: ${m[1]}% 失敗、敵反撃ターン）`
  },
  {
    name: '철수 불가 결계',
    pattern: /⚠️\s*광폭화된 심연 결계로 인해 전투에서 철수할 수 없습니다!/i,
    en: () => `⚠️ Frenzied Abyssal Barrier prevents retreat!`,
    ja: () => `⚠️ 暴走した深淵の結界により戦闘から撤退できません！`
  },

  // ── 2. 생사 & 위기 & 부활 ──
  {
    name: '사경의 위기',
    pattern: /💀\s*\[사경의 위기\]\s*치명상을 입은\s*(.+?)\s*대원이 의식을 잃고 차가운 바닥에 쓰러졌습니다!\s*숨결이 완전히 멎기 전에 마물을 베어 넘기거나 성스러운 구원의 손길을 뻗어야 합니다!/i,
    en: m => `💀 [Near Death] Severely wounded ${m[1]} lost consciousness and collapsed! Defeat the fiend or cast holy salvation before breath ceases!`,
    ja: m => `💀 [死線の危機] 致命傷を負った${m[1]}隊員が意識を失い倒れました！息絶える前に魔物を倒すか聖なる救いを届けなければなりません！`
  },
  {
    name: '사선의 맹세 불굴 버팀',
    pattern: /💖\s*\[사선의 맹세\]\s*(?:동료들과 맺은 굳건한 맹세의 결속이 빛을 발하며,\s*)?(.+?)\s*대원이 불굴의 투지로 (?:죽음의 턱밑에서|버텨냅니다!)(.*)/i,
    en: m => `💖 [Oath of the Brink] Unyielding will shines! ${m[1]} perseveres through sheer tenacity!${m[2]}`,
    ja: m => `💖 [死線の誓い] 仲間との誓いが輝き、${m[1]}隊員が不屈の闘志で持ち堪えました！${m[2]}`
  },
  {
    name: '사선의 맹세 동료 수호',
    pattern: /💖\s*\[사선의 맹세\]\s*동료를 지키기 위해\s*(.+?)\s*대원이 불굴의 투지로 버텨냅니다!/i,
    en: m => `💖 [Oath of the Brink] To protect companions, ${m[1]} endures with unyielding determination!`,
    ja: m => `💖 [死線の誓い] 仲間を守るため、${m[1]}隊員が不屈の闘志で耐え抜きます！`
  },
  {
    name: '발키리 불멸의 수호 부활',
    pattern: /🕊️👑\s*\[불멸의 수호\]\s*발키리\s*(.+?)(?:이\(가\)|이|가)\s*쓰러지는 순간 기적의 빛으로 부활하며 생존 파티원의 상처를 치유했습니다!/i,
    en: m => `🕊️👑 [Immortal Aegis] Valkyrie ${m[1]} resurrected with miraculous radiance and healed surviving companions!`,
    ja: m => `🕊️👑 [不滅の守護] ワルキューレ${m[1]}が倒れた瞬間、奇跡の光で蘇生し生存した仲間の傷を癒やしました！`
  },
  {
    name: '피버 부활',
    pattern: /🩸🕊️\s*\[(.+?)\]\s*쓰러졌던\s*(.+?)(?:이\(가\)|이|가)\s*기적처럼 HP\s*(\d+)로 부활했습니다!/i,
    en: m => `🩸🕊️ [${m[1]}] Fallen ${m[2]} miraculously revived with ${m[3]} HP!`,
    ja: m => `🩸🕊️ [${m[1]}] 倒れていた${m[2]}が奇跡のようにHP ${m[3]}で復活しました！`
  },
  {
    name: '사경 소생 스킬 강림',
    pattern: /🕊️✨\s*(.+?)\s*\[(.+?)\]\s*강림!\s*기적의 기도로 사경을 헤매던\s*(.+?)(?:을\(를\)|을|를)\s*체력 1로 극적 소생시켰습니다!\s*➔\s*\[(.*?)\]/i,
    en: m => `🕊️✨ ${m[1]} [${m[2]}] Advent! Miraculous prayer revived perilously injured ${m[3]} with 1 HP! ➔ [${m[4]}]`,
    ja: m => `🕊️✨ ${m[1]} [${m[2]}] 降臨！奇跡の祈りで死線を彷徨っていた${m[3]}をHP 1で劇的に蘇生させました！ ➔ [${m[4]}]`
  },
  {
    name: '부활 및 완전 치유 스킬 강림',
    pattern: /🕊️✨\s*(.+?)\s*\[(.+?)\]\s*강림!\s*기적의 권능으로 사망한 동료를 부활시키고 파티를 완전 치유했습니다!\s*➔\s*\[(.*?)\]/i,
    en: m => `🕊️✨ ${m[1]} [${m[2]}] Advent! Divine authority revived fallen allies and fully restored the squad! ➔ [${m[3]}]`,
    ja: m => `🕊️✨ ${m[1]} [${m[2]}] 降臨！奇跡の権能で倒れた仲間を復活させ、部隊を全快させました！ ➔ [${m[3]}]`
  },

  // ── 3. 마나 회복, 쿨다운, 유틸 ──
  {
    name: '후열 전술 사격 마나 환급',
    pattern: /✨\s*\[후열 전술 사격\]\s*(.+?)(?:이\(가\)|이|가)\s*후열 연계로 마나\s*\+(\d+)\s*MP를 환급받았습니다!/i,
    en: m => `✨ [Backline Tactical Fire] ${m[1]} refunded +${m[2]} MP via backline link!`,
    ja: m => `✨ [後列戦術射撃] ${m[1]}が後列連携によりマナ +${m[2]} MPを還元されました！`
  },
  {
    name: '에테르 과충전',
    pattern: /✨🔋\s*\[에테르 과충전\]\s*마나\s*\+(\d+)\s*MP를 회복하고 다음 공격력이\s*(\d+)%\s*폭풍 증폭되었습니다!/i,
    en: m => `✨🔋 [Ether Overcharge] Restored +${m[1]} MP, next attack DMG amplified by +${m[2]}%!`,
    ja: m => `✨🔋 [エーテル過充電] マナ +${m[1]} MPを回復し、次攻撃の威力が+${m[2]}%大増幅！`
  },
  {
    name: '전사의 함성',
    pattern: /🚩🔋\s*\[전사의 함성\]\s*사기를 북돋아 마나\s*\+(\d+)\s*MP를 충전했습니다!/i,
    en: m => `🚩🔋 [Warrior's Roar] Morale boosted! Charged +${m[1]} MP!`,
    ja: m => `🚩🔋 [戦士の咆哮] 士気を鼓舞しマナ +${m[1]} MPをチャージしました！`
  },
  {
    name: '시공 왜곡 쿨다운 단축',
    pattern: /⏳✨\s*\[시공 왜곡\]\s*아군 전체 마나\s*\+(\d+)\s*MP 회복 및 모든 스킬 쿨다운을\s*(\d+)턴 즉시 단축했습니다!/i,
    en: m => `⏳✨ [Chrono Warp] Restored +${m[1]} MP to all allies and reduced all skill cooldowns by ${m[2]} turn(s)!`,
    ja: m => `⏳✨ [時空歪曲] 味方全員のマナ +${m[1]} MP回復＆全スキルのクールダウンを${m[2]}ターン短縮！`
  },
  {
    name: '오버클럭 리로드',
    pattern: /⚙️🎯\s*\[오버클럭 리로드\]\s*아군 전체 스킬 쿨다운\s*(\d+)턴 단축 및\s*(\d+)턴간 치명 공격력\s*(\d+)%\s*증폭!/i,
    en: m => `⚙️🎯 [Overclock Reload] Reduced squad skill cooldowns by ${m[1]} turn(s) & boosted CRIT DMG by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `⚙️🎯 [オーバークロックリロード] 味方全体のクールダウンを${m[1]}ターン短縮＆${m[2]}ターン間会心ダメージ+${m[3]}%！`
  },
  {
    name: '시공 역류 완전 초기화',
    pattern: /⌛💫\s*\[시공 역류\]\s*시간의 흐름을 되돌려 파티 전원의 체력과 마나를 회복하고 모든 스킬 쿨다운을 완전 초기화했습니다!/i,
    en: () => `⌛💫 [Time Reversal] Rewound time, restored party HP/MP and reset all skill cooldowns!`,
    ja: () => `⌛💫 [時空逆流] 時の流れを巻き戻し、味方全体のHP/MPを回復＆全クールダウンを完全初期化！`
  },
  {
    name: '파티 마나 회복',
    pattern: /💧\s*\[마나 회복\]\s*파티 전원의 마나가\s*\+(\d+)\s*MP 회복되었습니다\./i,
    en: m => `💧 [Mana Recovery] Party recovered +${m[1]} MP.`,
    ja: m => `💧 [マナ回復] パーティ全員のマナが +${m[1]} MP 回復しました。`
  },
  {
    name: '개인 마나 회복',
    pattern: /💧\s*\[마나 회복\]\s*(.+?)의\s*마나가\s*\+(\d+)\s*MP 회복되었습니다\./i,
    en: m => `💧 [Mana Recovery] ${m[1]} recovered +${m[2]} MP.`,
    ja: m => `💧 [マナ回復] ${m[1]}のマナが +${m[2]} MP 回復しました。`
  },
  {
    name: 'FEVER 마나 완충',
    pattern: /🔋👑\s*\[(.+?)\]\s*파티 전원의 마나\(MP\)를 100% 즉시 완충했습니다!/i,
    en: m => `🔋👑 [${m[1]}] Instantly fully charged 100% MP for all party members!`,
    ja: m => `🔋👑 [${m[1]}] パーティ全員のマナ(MP)を100%即時満充填しました！`
  },
  {
    name: 'FEVER 마나 퍼센트 회복',
    pattern: /🔋👑\s*\[(.+?)\]\s*파티 전원의 마나\(MP\)를\s*(\d+)%\s*회복했습니다!/i,
    en: m => `🔋👑 [${m[1]}] Restored ${m[2]}% MP to all party members!`,
    ja: m => `🔋👑 [${m[1]}] パーティ全員のマナ(MP)を${m[2]}%回復しました！`
  },

  // ── 4. 치유 & 체력 회복 ──
  {
    name: '사령의 영혼 수확 파티 치유',
    pattern: /💀✨\s*\[사령의 영혼 수확\]\s*가한 총 피해\((.+?)\)의\s*(\d+)%인\s*\+(\d+)\s*HP를 파티 전원에게 치유로 환원했습니다!/i,
    en: m => `💀✨ [Soul Harvest] Restored +${m[3]} HP (${m[2]}% of ${m[1]} total damage) to all party members!`,
    ja: m => `💀✨ [死霊の魂収穫] 与えた総ダメージ(${m[1]})の${m[2]}%である +${m[3]} HPを味方全員に回復還元！`
  },
  {
    name: '진홍의 피의 지배 흡혈/출혈',
    pattern: /🍷\s*\[진홍의 피의 지배\]\s*흡혈로 HP\s*\+(\d+)\s*자가 회복 및 적 전체에게\s*(\d+)턴간 치명 출혈을 확산시켰습니다!/i,
    en: m => `🍷 [Crimson Blood Dominion] Drained +${m[1]} HP and spread deadly Bleed to all enemies for ${m[2]} turn(s)!`,
    ja: m => `🍷 [真紅の血の支配] 吸血でHP +${m[1]} 自家回復＆敵全体に${m[2]}ターンの致命的出血を拡散！`
  },
  {
    name: '성전 타격 치유',
    pattern: /✝️✨\s*\[성전 타격 치유\]\s*공격의 신성력으로\s*(.+?)의\s*체력이\s*\+(\d+)\((\d+)%\)\s*회복되었습니다!/i,
    en: m => `✝️✨ [Crusade Strike Heal] Divine strike healed ${m[1]}'s HP by +${m[2]} (${m[3]}%)!`,
    ja: m => `✝️✨ [聖戦打撃治癒] 攻撃の神聖力で${m[1]}のHPが +${m[2]} (${m[3]}%) 回復しました！`
  },
  {
    name: '심판관의 성전 파티 환원 치유',
    pattern: /⚖️✨\s*\[심판관의 성전\]\s*가한 총 피해의\s*(\d+)%인\s*\+(\d+)\s*HP를 파티 전원에게 치유로 환원했습니다!/i,
    en: m => `⚖️✨ [Inquisitor's Crusade] Converted ${m[1]}% of total damage dealt (+${m[2]} HP) into healing for all allies!`,
    ja: m => `⚖️✨ [審判官の聖戦] 与えた総ダメージの${m[1]}%にあたる +${m[2]} HPを味方全員に回復還元！`
  },
  {
    name: '천벌의 성십자가 아군 전원 치유',
    pattern: /✝️✨\s*\[천벌의 성십자가\]\s*신성 성광의 은총으로 생존 아군 전원의 체력이\s*\+(\d+)%\s*치유되었습니다!/i,
    en: m => `✝️✨ [Cross of Retribution] Holy radiance healed all surviving allies by +${m[1]}%!`,
    ja: m => `✝️✨ [天罰の聖十字架] 聖なる光の恩寵により生存味方全員のHPが +${m[1]}% 回復しました！`
  },
  {
    name: '생명력 흡수',
    pattern: /🩸\s*\[생명력 흡수\]\s*가한 피해의\s*(\d+)%를 흡혈하여 체력\s*\+(\d+)\s*회복!/i,
    en: m => `🩸 [Life Drain] Absorbed ${m[1]}% of dealt damage to restore +${m[2]} HP!`,
    ja: m => `🩸 [生命力吸収] 与えたダメージの${m[1]}%を吸血しHP +${m[2]} 回復！`
  },
  {
    name: 'FEVER 생존 전원 100% 완전 회복',
    pattern: /💖✨\s*\[(.+?)\]\s*생존 아군 전원의 체력이 100% 완전 회복되었습니다!/i,
    en: m => `💖✨ [${m[1]}] Fully restored 100% HP to all surviving allies!`,
    ja: m => `💖✨ [${m[1]}] 生存味方全員のHPが100%完全回復しました！`
  },
  {
    name: 'FEVER 생존 전원 퍼센트 회복',
    pattern: /💖✨\s*\[(.+?)\]\s*생존 아군 전원의 체력을\s*(\d+)%\s*회복했습니다!/i,
    en: m => `💖✨ [${m[1]}] Restored ${m[2]}% HP to all surviving allies!`,
    ja: m => `💖✨ [${m[1]}] 生存味方全員のHPを${m[2]}%回復しました！`
  },
  {
    name: 'FEVER 흡혈 파티 치유 환원',
    pattern: /🍷✨\s*\[(.+?)\s*흡혈\]\s*가한 피해의\s*(\d+)%\(\+(\d+)\s*HP\)를 파티 전원에게 치유로 환원했습니다!/i,
    en: m => `🍷✨ [${m[1]} Drain] Converted ${m[2]}% of damage (+${m[3]} HP) to party-wide healing!`,
    ja: m => `🍷✨ [${m[1]} 吸血] 与えたダメージの${m[2]}%(+${m[3]} HP)を味方全員に回復還元！`
  },
  {
    name: '성지 정화 결계 지속 재생',
    pattern: /💚✨\s*\[성지 정화 결계\]\s*(\d+)턴간 파티 전체에 매 턴 체력\s*(\d+)%\s*지속 재생을 부여했습니다!/i,
    en: m => `💚✨ [Sanctuary Barrier] Granted party-wide +${m[2]}% HP regen per turn for ${m[1]} turn(s)!`,
    ja: m => `💚✨ [聖地浄化結界] ${m[1]}ターンの間味方全体に毎ターンHP ${m[2]}%の継続リジェネを付与！`
  },
  {
    name: '스킬 시전 파티 전원 치유 리포트',
    pattern: /✨\s*(.+?)\s*\[(.+?)\]\s*→\s*파티 전원 치유!\s*\[(.*?)\]/i,
    en: m => `✨ ${m[1]} [${m[2]}] → Healed entire party! [${m[3]}]`,
    ja: m => `✨ ${m[1]} [${m[2]}] → 味方全員回復！ [${m[3]}]`
  },
  {
    name: '스킬 시전 대상 치유 리포트',
    pattern: /✨\s*(.+?)\s*\[(.+?)\]\s*→\s*([^보호막]+?(?:치유|회복|HP|\+\d+).*)/i,
    en: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`,
    ja: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`
  },
  {
    name: '생명의 샘',
    pattern: /💖\s*\[생명의 샘\]\s*성령의 은총으로\s*(.+?)\s*체력\s*\+(\d+)\s*회복!/i,
    en: m => `💖 [Font of Life] Holy grace restored +${m[2]} HP to ${m[1]}!`,
    ja: m => `💖 [生命の泉] 聖霊の恩寵で${m[1]}のHP +${m[2]} 回復！`
  },
  {
    name: '축복의 은혜',
    pattern: /✝️✨\s*\[축복의 은혜\]\s*(.+?)(?:이\(가\)|이|가)\s*스킬 시전에 공명하여 체력\s*\+(\d+)\s*회복!/i,
    en: m => `✝️✨ [Grace of Blessing] ${m[1]} resonated with skill cast and restored +${m[2]} HP!`,
    ja: m => `✝️✨ [祝福の恵み] ${m[1]}がスキル詠唱に共鳴してHP +${m[2]} 回復！`
  },
  {
    name: '전투 신앙 기적 자가 치유',
    pattern: /✝️\s*\[전투 신앙 기적\]\s*(.+?)의\s*신앙으로 체력\s*\+(\d+)\s*즉시 치유!/i,
    en: m => `✝️ [Miracle of Faith] Devout faith restored +${m[2]} HP to ${m[1]}!`,
    ja: m => `✝️ [戦闘信仰の奇跡] ${m[1]}の信仰によりHP +${m[2]} 即時回復！`
  },
  {
    name: '몬스터 자가 치유',
    pattern: /💚\s*(.+?)\s*\[(.+?)\]\s*→\s*자신 체력\s*\+(\d+)\s*회복!/i,
    en: m => `💚 ${m[1]} [${m[2]}] → Restored +${m[3]} HP to self!`,
    ja: m => `💚 ${m[1]} [${m[2]}] → 自身のHP +${m[3]} 回復！`
  },
  {
    name: '몬스터 아군 치유',
    pattern: /💚\s*(.+?)\s*\[(.+?)\]\s*→\s*부상당한 아군\s*(.+?)\s*체력\s*\+(\d+)\s*치유!/i,
    en: m => `💚 ${m[1]} [${m[2]}] → Healed ally ${m[3]} by +${m[4]} HP!`,
    ja: m => `💚 ${m[1]} [${m[2]}] → 負傷した味方${m[3]}のHPを+${m[4]}回復！`
  },

  // ── 5. 방어막 / 결계 / 보호 ──
  {
    name: '방어 파쇄 창끝 증폭',
    pattern: /🔱\s*\[방어 파쇄\]\s*(.+?)의\s*창끝이\s*(.+?)의\s*보호막에\s*(\d+)%\s*증폭 피해를 입혔습니다!/i,
    en: m => `🔱 [Shield Break] ${m[1]}'s spearhead dealt ${m[3]}% amplified damage to ${m[2]}'s barrier!`,
    ja: m => `🔱 [防御破砕] ${m[1]}の槍先が${m[2]}のシールドに${m[3]}%増幅ダメージを与えました！`
  },
  {
    name: '전열 압도',
    pattern: /🚩🛡️\s*\[전열 압도\]\s*적 전체의 공격력을\s*(\d+)%\s*약화시키고 아군 전원에게 최대 HP\s*(\d+)%\s*보호막을 부여했습니다!/i,
    en: m => `🚩🛡️ [Frontline Overwhelm] Reduced all enemies' ATK by ${m[1]}% and granted ${m[2]}% Max HP barrier to all allies!`,
    ja: m => `🚩🛡️ [前列圧倒] 敵全体の攻撃力を${m[1]}%弱体化させ、味方全員に最大HP ${m[2]}%のシールドを付与！`
  },
  {
    name: '흑핵 방벽',
    pattern: /❄️🛡️\s*\[흑핵 방벽\]\s*절대 영도의 에너지로 전열 아군에게 보호막\((\d+)\)을 부여했습니다!/i,
    en: m => `❄️🛡️ [Black Core Barrier] Absolute zero energy granted a barrier (${m[1]}) to frontline allies!`,
    ja: m => `❄️🛡️ [黒核防壁] 絶対零度のエネルギーで前列味方にシールド(${m[1]})を付与しました！`
  },
  {
    name: '공허 묵시록 디버프 정화 및 절대 무적',
    pattern: /🔮✨\s*\[공허 묵시록\]\s*아군 전원의 모든 디버프를 완전 정화하고\s*(\d+)턴간 절대 무적 결계를 전개했습니다!/i,
    en: m => `🔮✨ [Void Apocalypse] Cleansed all debuffs from squad and activated Absolute Invulnerability for ${m[1]} turn(s)!`,
    ja: m => `🔮✨ [虚無の黙示録] 味方全員の全デバフを完全浄化し、${m[1]}ターンの絶対無敵結界を展開！`
  },
  {
    name: '군단 총진격 흡수 방벽',
    pattern: /🚩🛡️\s*\[군단 총진격\]\s*무적의 군세 보호막으로 파티 전원에게 최대 HP\s*(\d+)%\s*흡수 방벽을 전개했습니다!/i,
    en: m => `🚩🛡️ [Legion Advance] Deployed a ${m[1]}% Max HP absorption barrier to all party members!`,
    ja: m => `🚩🛡️ [軍団総進撃] 無敵の軍勢シールドで味方全員に最大HP ${m[1]}%の吸収防壁を展開！`
  },
  {
    name: 'FEVER 파티 에테르 방벽',
    pattern: /🛡️✨\s*\[(.+?)\]\s*파티 전원에게 최대 HP\s*(\d+)%\s*에테르 방벽을 전개했습니다!/i,
    en: m => `🛡️✨ [${m[1]}] Deployed a ${m[2]}% Max HP Ether Barrier to all party members!`,
    ja: m => `🛡️✨ [${m[1]}] 味方全員に最大HP ${m[2]}%のエーテル防壁を展開！`
  },
  {
    name: 'FEVER 절대 면역 결계',
    pattern: /🛡️✨\s*\[(.+?)\]\s*파티 전원에게\s*(\d+)턴간 절대 면역 결계를 부여했습니다!/i,
    en: m => `🛡️✨ [${m[1]}] Granted Absolute Immunity Barrier to all party members for ${m[2]} turn(s)!`,
    ja: m => `🛡️✨ [${m[1]}] 味方全員に${m[2]}ターンの絶対免疫結界を付与！`
  },
  {
    name: 'FEVER 환영 반격 결계',
    pattern: /⚔️💨\s*\[(.+?)\]\s*파티 전원에게\s*(\d+)턴간 100% 환영 반격 결계를 전개했습니다!/i,
    en: m => `⚔️💨 [${m[1]}] Deployed 100% Illusion Counter Barrier to all allies for ${m[2]} turn(s)!`,
    ja: m => `⚔️💨 [${m[1]}] 味方全員に${m[2]}ターンの100%幻影反撃結界を展開！`
  },
  {
    name: '신성 집결 피해 경감',
    pattern: /🛡️✨\s*\[신성 집결\]\s*(\d+)턴간 파티 전체가 받는 피해를\s*(\d+)%\s*경감합니다!/i,
    en: m => `🛡️✨ [Holy Rally] Reduced party damage taken by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🛡️✨ [神聖結集] ${m[1]}ターンの間味方全体の被ダメージを${m[2]}%軽減！`
  },
  {
    name: '방어 태세',
    pattern: /🏰\s*\[방어 태세\]\s*(.+?)(?:이\(가\)|이|가)\s*(\d+)턴간 방어 태세\(방어력\s*\+(\d+)%\)를 취합니다!/i,
    en: m => `🏰 [Defensive Stance] ${m[1]} assumed Defensive Stance (DEF +${m[3]}%) for ${m[2]} turn(s)!`,
    ja: m => `🏰 [防御態勢] ${m[1]}が${m[2]}ターン間防御態勢(防御力+${m[3]}%)をとります！`
  },
  {
    name: '성전 결계 전개 공방 증폭',
    pattern: /⚔️🔰\s*\[성전 결계 전개\]\s*(\d+)턴간 아군 전체의 공격력과 방어력이\s*(\d+)%\s*증폭되었습니다!/i,
    en: m => `⚔️🔰 [Crusade Barrier] Boosted entire squad's ATK and DEF by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `⚔️🔰 [聖戦結界展開] ${m[1]}ターン間味方全体の攻撃力と防御力が${m[2]}%増幅！`
  },
  {
    name: '스킬 시전 파티 전원 보호막 리포트',
    pattern: /🛡️\s*(.+?)\s*\[(.+?)\]\s*→\s*파티 전원 보호막 전개!\s*\[(.*?)\]/i,
    en: m => `🛡️ ${m[1]} [${m[2]}] → Deployed barrier on all allies! [${m[3]}]`,
    ja: m => `🛡️ ${m[1]} [${m[2]}] → 味方全員にシールド展開！ [${m[3]}]`
  },
  {
    name: '절대 요새의 성역',
    pattern: /🏰🌟\s*\[절대 요새의 성역\]\s*아군 전원\s*(\d+)턴 완전 무적 및\s*(\d+)턴간 받는 피해\s*(\d+)%\s*절대 경감 결계를 전개했습니다!/i,
    en: m => `🏰🌟 [Sanctuary of Bastion] Granted ${m[1]} turn(s) Invincibility and deployed ${m[3]}% Damage Reduction for ${m[2]} turn(s)!`,
    ja: m => `🏰🌟 [絶対要塞の聖域] 味方全員${m[1]}ターン完全無敵＆${m[2]}ターン被ダメージ${m[3]}%軽減結界を展開！`
  },
  {
    name: '스킬 시전 개별 보호막 부여 리포트',
    pattern: /🛡️\s*(.+?)\s*\[(.+?)\]\s*→\s*(.+?)\s*보호막 부여/i,
    en: m => `🛡️ ${m[1]} [${m[2]}] → Granted barrier to ${m[3]}`,
    ja: m => `🛡️ ${m[1]} [${m[2]}] → ${m[3]}にシールド付与`
  },
  {
    name: '수호의 결속',
    pattern: /🛡️\s*\[수호의 결속\]\s*(.+?)(?:이\(가\)|이|가)\s*빈사의\s*(.+?)(?:을\(를\)|을|를)\s*지키기 위해\s*\[보호막\s*(\d+)\]을 전개했습니다!/i,
    en: m => `🛡️ [Bond of Protection] ${m[1]} deployed [Barrier ${m[3]}] to safeguard critical ally ${m[2]}!`,
    ja: m => `🛡️ [守護の結束] ${m[1]}が瀕死の${m[2]}を守るため[シールド ${m[3]}]を展開しました！`
  },
  {
    name: '전열 엄호 피해 대리',
    pattern: /🛡️\s*\[전열 엄호\]\s*(.+?)(?:이\(가\)|이|가)\s*후열\s*(.+?)의\s*피해를\s*(\d+)%\s*대신 받아\s*(\d+)의 피해를 감내했습니다!/i,
    en: m => `🛡️ [Frontline Cover] ${m[1]} intercepted ${m[3]}% of backline ${m[2]}'s damage, taking ${m[4]} DMG!`,
    ja: m => `🛡️ [前列援護] ${m[1]}が後列${m[2]}のダメージを${m[3]}%身代わりとなり、${m[4]}のダメージを受け止めました！`
  },
  {
    name: '면역 결계 효과 차단',
    pattern: /✨🛡️\s*\[면역 결계\]\s*(.+?)의\s*성스러운 정화 결계가\s*\[(.+?)\]\s*효과를 완전히 차단했습니다!/i,
    en: m => `✨🛡️ [Immunity Barrier] ${m[1]}'s holy purifying barrier completely blocked [${m[2]}]!`,
    ja: m => `✨🛡️ [免疫結界] ${m[1]}の聖なる浄化結界が[${m[2]}]効果を完全に遮断しました！`
  },
  {
    name: '몬스터 보호막 전개',
    pattern: /🛡️\s*(.+?)\s*\[(.+?)\]\s*→\s*보호막\((\d+)\)\s*전개!/i,
    en: m => `🛡️ ${m[1]} [${m[2]}] → Deployed barrier (${m[3]})!`,
    ja: m => `🛡️ ${m[1]} [${m[2]}] → シールド(${m[3]})展開！`
  },

  // ── 6. 공격 특수 효과 / 상태이상 부여 / 디버프 ──
  {
    name: '신성 마법 치명타 상승',
    pattern: /✨\s*\[신성 마법\]\s*성광의 축복으로 치명타 확률이\s*\+(\d+)%\s*상승합니다!\s*\(치명타율:\s*(\d+)%\)/i,
    en: m => `✨ [Holy Magic] Holy Blessing increased CRIT rate by +${m[1]}%! (Crit: ${m[2]}%)`,
    ja: m => `✨ [神聖魔法] 聖光の祝福により会心率が +${m[1]}% 上昇！（会心率: ${m[2]}%）`
  },
  {
    name: '마도 탄도학 관통/충전',
    pattern: /🔋\s*\[마도 탄도학\]\s*치명타 적중으로\s*(.+?)의\s*방어력을\s*(\d+)%\s*추가 관통하고 마나\s*\+(\d+)\s*MP를 충전합니다\./i,
    en: m => `🔋 [Arcane Ballistics] CRIT hit pierced ${m[2]}% more DEF of ${m[1]} and restored +${m[3]} MP.`,
    ja: m => `🔋 [魔導弾道学] 会心命中により${m[1]}の防御力を${m[2]}%追加貫通し、マナ +${m[3]} MPを充填！`
  },
  {
    name: '순수 피해 방어 무시',
    pattern: /🗡️✨\s*\[\+(\d+)강 순수 피해\]\s*방어 무시\s*(\d+)\s*피해 직격!/i,
    en: m => `🗡️✨ [+${m[1]} Pure Damage] Direct hit dealing ${m[2]} True Damage ignoring defense!`,
    ja: m => `🗡️✨ [+${m[1]} 純粋ダメージ] 防御無視 ${m[2]} の直撃ダメージ！`
  },
  {
    name: '베기 출혈 부여',
    pattern: /🗡️\s*\[베기\]\s*(.+?)의\s*예리한 검격이\s*(.+?)에게\s*(\d+)턴간\s*\[출혈\]\s*상태이상을 부여했습니다!/i,
    en: m => `🗡️ [Slash] ${m[1]}'s sharp slash inflicted [Bleed] on ${m[2]} for ${m[3]} turn(s)!`,
    ja: m => `🗡️ [斬撃] ${m[1]}の鋭い斬撃が${m[2]}に${m[3]}ターンの[出血]を付与しました！`
  },
  {
    name: '마도 연사 추가 피해',
    pattern: /🔫\s*\[마도 연사\]\s*기본\s*(\d+)%와 행운\(🍀(\d+)\)의 가호로 추가 점사 탄환\(공격력\s*(\d+)%\s*위력\)이 격발되어\s*(.+?)에게\s*(\d+)\s*추가 피해!/i,
    en: m => `🔫 [Arcane Burst] Luck (🍀${m[2]}) triggered extra burst fire (${m[3]}% ATK), dealing ${m[5]} bonus DMG to ${m[4]}!`,
    ja: m => `🔫 [魔導連射] 基本${m[1]}%と幸運(🍀${m[2]})の加護で追加連射弾(${m[3]}%攻撃力)が発射され、${m[4]}に${m[5]}の追加ダメージ！`
  },
  {
    name: '원혼의 속박 빙결',
    pattern: /⛓️\s*\[(.+?)\]\s*원혼의 속박 발동:\s*(.+?)\s*(\d+)턴간\s*\[빙결\]\s*행동 불능!/i,
    en: m => `⛓️ [${m[1]}] Soul Shackle: ${m[2]} is [Frozen] for ${m[3]} turn(s)!`,
    ja: m => `⛓️ [${m[1]}] 怨念の束縛発動: ${m[2]}が${m[3]}ターンの間[凍結]行動不能！`
  },
  {
    name: '약점 분석 방어력 분쇄',
    pattern: /🎯\s*\[약점 분석\]\s*(.+?)의\s*사격으로\s*(.+?)의\s*방어력이\s*(\d+)%\s*분쇄되었습니다!/i,
    en: m => `🎯 [Weakness Analysis] ${m[1]}'s shot shredded ${m[2]}'s DEF by ${m[3]}%!`,
    ja: m => `🎯 [急所分析] ${m[1]}の狙撃により${m[2]}の防御力が${m[3]}%粉砕されました！`
  },
  {
    name: '광전사의 화신 치명타 강화',
    pattern: /🔥\s*\[광전사의 화신\]\s*(.+?)의\s*치명타로 파티 전원 공격력\s*(\d+)%\s*강화!/i,
    en: m => `🔥 [Berserker Incarnation] ${m[1]}'s CRIT hit boosted squad ATK by ${m[2]}%!`,
    ja: m => `🔥 [バーサーカーの化身] ${m[1]}の会心打撃で味方全員の攻撃力 +${m[2]}% 強化！`
  },
  {
    name: '장비 마도 공명 추가 마도 피해',
    pattern: /📜✨\s*\[장비 마도 공명!\]\s*(.+?)의\s*(.+?)\s*→\s*(.+?)에게\s*(\d+)\s*추가 마도 피해!/i,
    en: m => `📜✨ [Gear Resonance!] ${m[1]}'s ${m[2]} → dealt ${m[4]} bonus magic DMG to ${m[3]}!`,
    ja: m => `📜✨ [装備魔導共鳴!] ${m[1]}の${m[2]} → ${m[3]}に${m[4]}の追加魔法ダメージ！`
  },
  {
    name: '피의 축제 처치 공격력 상승',
    pattern: /🩸\s*\[피의 축제\]\s*(.+?)(?:이\(가\)|이|가)\s*적을 처치하여 공격력\s*\+(\d+)%\s*상승!/i,
    en: m => `🩸 [Blood Feast] ${m[1]} killed an enemy: ATK increased by +${m[2]}%!`,
    ja: m => `🩸 [血の祝祭] ${m[1]}が敵を討伐し攻撃力 +${m[2]}% 上昇！`
  },
  {
    name: '행운 저항',
    pattern: /🛡️\s*\[저항\(RESIST\)\]\s*(.+?)(?:이\(가\)|이|가)\s*높은 행운\(🍀(\d+)\)으로\s*\[(.+?)\]\s*효과를 완전히 저항해냈습니다!/i,
    en: m => `🛡️ [RESIST] ${m[1]} completely resisted [${m[3]}] with high luck (🍀${m[2]})!`,
    ja: m => `🛡️ [抵抗(RESIST)] ${m[1]}が高い幸運(🍀${m[2]})で[${m[3]}]効果を完全に抵抗しました！`
  },
  {
    name: '실명/명중저하 부여',
    pattern: /👁️‍🗨️\s*\[실명\/명중저하\]\s*(.+?)에게\s*(\d+)턴간 명중률\s*(\d+)%\s*저하를 부여했습니다!/i,
    en: m => `👁️‍🗨️ [Blind/Accuracy Down] Inflicted ${m[3]}% Accuracy Down on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `👁️‍🗨️ [暗闇/命中低下] ${m[1]}に${m[2]}ターンの間命中率${m[3]}%低下を付与！`
  },
  {
    name: '화상 부여 상세',
    pattern: /🔥\s*\[화상 부여\]\s*(.+?)에게\s*(\d+)턴간 화상\(매 턴\s*(\d+)%\s*지속 피해\)을 부여했습니다!/i,
    en: m => `🔥 [Inflict Burn] Inflicted Burn (${m[3]}% DoT per turn) on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `🔥 [火傷付与] ${m[1]}に${m[2]}ターンの間火傷（毎ターン${m[3]}%継続ダメージ）を付与！`
  },
  {
    name: '출혈 유발 상세',
    pattern: /🩸\s*\[출혈 유발\]\s*(.+?)에게\s*(\d+)턴간 출혈 효과를 부여했습니다!/i,
    en: m => `🩸 [Inflict Bleed] Inflicted Bleed on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `🩸 [出血誘発] ${m[1]}に${m[2]}ターンの間出血効果を付与！`
  },
  {
    name: '맹독 주입 상세',
    pattern: /☠️\s*\[맹독 주입\]\s*(.+?)에게\s*(\d+)턴간 맹독\(매 턴 최대 HP\s*(\d+)%\s*치명 피해\)을 주입했습니다!/i,
    en: m => `☠️ [Inject Poison] Injected Deadly Poison (${m[3]}% Max HP lethal DoT) into ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `☠️ [猛毒注入] ${m[1]}に${m[2]}ターンの間猛毒（毎ターン最大HP ${m[3]}%致命傷）を注入！`
  },
  {
    name: '빙결/냉각 부여 상세',
    pattern: /❄️\s*\[빙결\/냉각\]\s*(.+?)에게\s*(\d+)턴간 빙결\(행동 불가 & (\d+)% 동상 피해\)을 부여했습니다!/i,
    en: m => `❄️ [Freeze/Chill] Inflicted Freeze (Immobilized & ${m[3]}% Frostbite DoT) on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `❄️ [凍結/冷却] ${m[1]}に${m[2]}ターンの間凍結（行動不能＆${m[3]}%凍傷ダメージ）を付与！`
  },
  {
    name: '기절 부여 상세',
    pattern: /💫\s*\[기절 부여\]\s*(.+?)에게\s*(\d+)턴간 기절을 부여했습니다!/i,
    en: m => `💫 [Inflict Stun] Stunned ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `💫 [気絶付与] ${m[1]}に${m[2]}ターンの間気絶を付与！`
  },
  {
    name: '공격력 약화 상세',
    pattern: /⚔️⬇️\s*\[공격력 약화\]\s*(.+?)의\s*공격력을\s*(\d+)턴간\s*(\d+)%\s*감소시켰습니다!/i,
    en: m => `⚔️⬇️ [ATK Weakened] Reduced ${m[1]}'s ATK by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `⚔️⬇️ [攻撃力弱化] ${m[1]}の攻撃力を${m[2]}ターンの間${m[3]}%減少させました！`
  },
  {
    name: '방어력 분쇄 상세',
    pattern: /🛡️⬇️\s*\[방어력 분쇄\]\s*(.+?)의\s*방어력을\s*(\d+)턴간\s*(\d+)%\s*감소시켰습니다!/i,
    en: m => `🛡️⬇️ [DEF Shredded] Reduced ${m[1]}'s DEF by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `🛡️⬇️ [防御力粉砕] ${m[1]}の防御力を${m[2]}ターンの間${m[3]}%減少させました！`
  },
  {
    name: '원소 마법 화상',
    pattern: /🔥\s*\[원소 마법:\s*화상\]\s*(.+?)에게\s*(\d+)턴간 원소 화상(?:\(매 턴\s*(\d+)%\s*피해\))?을 추가 부여했습니다!/i,
    en: m => `🔥 [Elemental: Burn] Inflicted Elemental Burn on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `🔥 [元素魔法: 火傷] ${m[1]}に${m[2]}ターンの間元素火傷を追加付与！`
  },
  {
    name: '원소 마법 빙결',
    pattern: /❄️\s*\[원소 마법:\s*빙결\]\s*(.+?)에게\s*(\d+)턴간 원소 빙결\(행동 불가\)을 추가 부여했습니다!/i,
    en: m => `❄️ [Elemental: Freeze] Inflicted Elemental Freeze (Immobilized) on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `❄️ [元素魔法: 凍結] ${m[1]}に${m[2]}ターンの間元素凍結(行動不能)を追加付与！`
  },
  {
    name: '원소 마법 감전',
    pattern: /⚡\s*\[원소 마법:\s*감전\]\s*(.+?)에게\s*(\d+)턴간 원소 감전 기절을 추가 부여했습니다!/i,
    en: m => `⚡ [Elemental: Shock] Inflicted Shock Stun on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `⚡ [元素魔法: 感電] ${m[1]}に${m[2]}ターンの間元素感電気絶を追加付与！`
  },
  {
    name: '환영 반격 태세 전개',
    pattern: /⚔️💨\s*\[환영 반격 태세\]\s*(.+?)(?:이\(가\)|이|가)\s*(\d+)턴간 회피율\s*(\d+)%\s*상승 및 피격 시 즉시\s*(\d+)%\s*환영 반격 태세를 전개했습니다!/i,
    en: m => `⚔️💨 [Illusion Riposte] ${m[1]} gained +${m[3]}% EVA and entered ${m[4]}% counter stance for ${m[2]} turn(s)!`,
    ja: m => `⚔️💨 [幻影反撃態勢] ${m[1]}が${m[2]}ターン間回避率+${m[3]}%＆被弾時即座に${m[4]}%幻影反撃態勢を展開！`
  },
  {
    name: '환영 난무 왈츠',
    pattern: /🌪️⚔️\s*\[환영 난무 왈츠\]\s*(.+?)의\s*화려한 분신 검무가 적 전체를 난도질하고 공격력을\s*(\d+)턴간\s*(\d+)%\s*약화시켰습니다!/i,
    en: m => `🌪️⚔️ [Illusion Dance Waltz] ${m[1]}'s clones sliced through all enemies, reducing ATK by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `🌪️⚔️ [幻影乱舞ワルツ] ${m[1]}の分身剣舞が敵全体を切り刻み、攻撃力を${m[2]}ターンの間${m[3]}%弱体化！`
  },
  {
    name: '연막 회피 태세',
    pattern: /💨👤\s*\[연막 회피 태세\]\s*(.+?)(?:이\(가\)|이|가)\s*연막 속으로 몸을 숨겨\s*(\d+)턴간 회피율\s*(\d+)%\s*상승 상태에 들어갔습니다!/i,
    en: m => `💨👤 [Smokescreen Stance] ${m[1]} hid in smokescreen, gaining +${m[3]}% EVA for ${m[2]} turn(s)!`,
    ja: m => `💨👤 [煙幕回避態勢] ${m[1]}が煙幕に身を隠し、${m[2]}ターンの間回避率+${m[3]}%状態に突入！`
  },
  {
    name: '철갑 방진 돌파 방어 분쇄',
    pattern: /🛡️⚡\s*\[철갑 방진 돌파\]\s*적 전열의 방어력을\s*(\d+)턴간\s*(\d+)%\s*분쇄했습니다!/i,
    en: m => `🛡️⚡ [Iron Phalanx Breach] Shredded enemy frontline DEF by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🛡️⚡ [鉄甲方陣突破] 敵前列の防御力を${m[1]}ターンの間${m[2]}%粉砕！`
  },
  {
    name: '전술 드론 폭격 화상',
    pattern: /🛰️🔥\s*\[전술 드론 폭격\]\s*드론 폭격으로 적 전체에\s*(\d+)턴간 지속 화상을 부여했습니다!/i,
    en: m => `🛰️🔥 [Tactical Drone Strike] Drone barrage inflicted Burn on all enemies for ${m[1]} turn(s)!`,
    ja: m => `🛰️🔥 [戦術ドローン爆撃] ドローン爆撃により敵全体に${m[1]}ターンの継続火傷を付与！`
  },
  {
    name: '광맥 분출 방어 분쇄/화상',
    pattern: /🌋🔥\s*\[광맥 분출\]\s*고열 폭발로 대상의 방어력을\s*(\d+)%\s*분쇄하고\s*(\d+)턴간 화상을 부여했습니다!/i,
    en: m => `🌋🔥 [Ore Eruption] Thermal explosion shredded target's DEF by ${m[1]}% and inflicted Burn for ${m[2]} turn(s)!`,
    ja: m => `🌋🔥 [鉱脈噴出] 高熱爆発で対象の防御力を${m[1]}%粉砕し、${m[2]}ターンの間火傷を付与！`
  },
  {
    name: '시공간 차원 붕괴 행동력 저하',
    pattern: /⏳🌀\s*\[시공간 차원 붕괴\]\s*적 전체의 시간 축을 왜곡하여\s*(\d+)턴간 행동력을\s*(\d+)%\s*저하시켰습니다!/i,
    en: m => `⏳🌀 [Dimensional Collapse] Warped temporal axis, slowing all enemies' action by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `⏳🌀 [時空間次元崩壊] 敵全体の時間軸を歪め、${m[1]}ターンの間行動力を${m[2]}%低下させました！`
  },
  {
    name: '망각의 사슬 침묵/기절',
    pattern: /⛓️💫\s*\[망각의 사슬\]\s*적 전열 마물들에게\s*(\d+)턴간 사신의 침묵과 완전 기절을 부여했습니다!/i,
    en: m => `⛓️💫 [Chains of Oblivion] Inflicted Reaper's Silence and Stun on front row enemies for ${m[1]} turn(s)!`,
    ja: m => `⛓️💫 [忘却の鎖] 敵前列の魔物に${m[1]}ターンの間死神の沈黙と完全気絶を付与！`
  },
  {
    name: '만화경 환영 방어/회피 상승',
    pattern: /🪞✨\s*\[만화경 환영\]\s*수억 개의 거울 환영을 펼쳐 아군 전체 방어\/회피력을\s*(\d+)%\s*상승시켰습니다!/i,
    en: m => `🪞✨ [Kaleidoscope Illusion] Unfolded mirror clones, increasing squad DEF and EVA by ${m[1]}%!`,
    ja: m => `🪞✨ [万華鏡幻影] 幾億もの鏡の幻影を展開し、味方全体の防御・回避力を${m[1]}%上昇！`
  },
  {
    name: '아마게돈 종말 기절/공허 침식',
    pattern: /🪐💥\s*\[아마게돈 종말\]\s*적 전체\s*(\d+)턴 기절 및\s*(\d+)턴간 공허 침식\(공격력\/방어력\s*(\d+)%\s*대폭 감소\)을 부여했습니다!/i,
    en: m => `🪐💥 [Armageddon Doom] Stunned all enemies for ${m[1]} turn(s) and inflicted Void Erosion (ATK/DEF -${m[3]}%) for ${m[2]} turn(s)!`,
    ja: m => `🪐💥 [ハルマゲドン終末] 敵全体${m[1]}ターン気絶＆${m[2]}ターン虚無浸食（攻防 -${m[3]}%）を付与！`
  },
  {
    name: '그림자 은신 기본',
    pattern: /👥\s*\[그림자 은신\]\s*(.+?)(?:이\(가\)|이|가)\s*공격 직후 그림자 속으로 은신했습니다!/i,
    en: m => `👥 [Shadow Stealth] ${m[1]} vanished into the shadows immediately after attacking!`,
    ja: m => `👥 [影の潜伏] ${m[1]}が攻撃直後、影の中に身を潜めました！`
  },
  {
    name: '그림자 은신 위력 강화',
    pattern: /👥\s*\[그림자 은신\]\s*(.+?)(?:이\(가\)|이|가)\s*그림자 속으로 숨어들어 은신했습니다!\s*\(다음 공격 위력\s*\+(\d+)%\)/i,
    en: m => `👥 [Shadow Stealth] ${m[1]} melted into the shadows! (Next attack power +${m[2]}%)`,
    ja: m => `👥 [影の潜伏] ${m[1]}が影の中に隠れて潜伏しました！（次回攻撃威力 +${m[2]}%）`
  },
  {
    name: '만화경 환영검무 적 전체 공격력 약화',
    pattern: /🪞⚔️\s*\[만화경 환영검무\]\s*적 전체의 공격력을\s*(\d+)턴간\s*(\d+)%\s*약화시켰습니다!/i,
    en: m => `🪞⚔️ [Kaleidoscope Sword Dance] Weakened all enemies' ATK by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🪞⚔️ [万華鏡幻影剣舞] 敵全体の攻撃力を${m[1]}ターンの間${m[2]}%弱体化！`
  },
  {
    name: 'FEVER 상태이상 정화',
    pattern: /🕊️✨\s*\[(.+?)\]\s*파티 전원의 모든 해로운 상태이상을 완전히 정화했습니다!/i,
    en: m => `🕊️✨ [${m[1]}] Completely cleansed all debuffs and ailments from the entire party!`,
    ja: m => `🕊️✨ [${m[1]}] パーティ全員の有害な状態異常を完全に浄化しました！`
  },
  {
    name: 'FEVER 적 전체 그로기 기절',
    pattern: /💫👑\s*\[(.+?)\]\s*적 전체에게\s*(\d+)턴간 완전 그로기\(기절\)를 부여했습니다!/i,
    en: m => `💫👑 [${m[1]}] Inflicted Groggy (Stun) on all enemies for ${m[2]} turn(s)!`,
    ja: m => `💫👑 [${m[1]}] 敵全体に${m[2]}ターンの間完全グロッキー（気絶）を付与！`
  },
  {
    name: 'FEVER 명중력 증가',
    pattern: /🎯🌀\s*\[(.+?)\]\s*파티 전원의 명중력이\s*(\d+)턴간\s*\+(\d+)%\s*증가했습니다!/i,
    en: m => `🎯🌀 [${m[1]}] Increased party Accuracy by +${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `🎯🌀 [${m[1]}] パーティ全員の命中力が${m[2]}ターンの間 +${m[3]}% 増加！`
  },
  {
    name: '칠흑 성역 파티 공격력 상승',
    pattern: /🏰⚔️\s*\[칠흑 성역\]\s*파티 전원의 공격력이\s*(\d+)턴간\s*(\d+)%\s*상승했습니다!/i,
    en: m => `🏰⚔️ [Abyssal Sanctuary] Squad ATK increased by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🏰⚔️ [漆黒の聖域] 味方全員の攻撃力が${m[1]}ターンの間${m[2]}%上昇！`
  },
  {
    name: '신기루 검무 회피/반격',
    pattern: /⚡💨\s*\[신기루 검무\]\s*(\d+)턴간 회피율\s*(\d+)%\s*증폭 및 회피 성공 시마다\s*(\d+)%\s*환영 반격 태세를 전개했습니다!/i,
    en: m => `⚡💨 [Mirage Sword Dance] Gained +${m[2]}% EVA and ${m[3]}% counter on dodge for ${m[1]} turn(s)!`,
    ja: m => `⚡💨 [蜃気楼の剣舞] ${m[1]}ターン間回避率+${m[2]}%＆回避成功時に${m[3]}%幻影反撃を展開！`
  },
  {
    name: '성전 선포 봉헌 버프',
    pattern: /✝️🔥\s*\[성전 선포\]\s*자신의 체력\s*-\s*(\d+)\((\d+)%\)를 봉헌하여 아군을 강화합니다!/i,
    en: m => `✝️🔥 [Crusade Declaration] Sacrificed -${m[1]} (${m[2]}%) HP to empower allies!`,
    ja: m => `✝️🔥 [聖戦布告] 自身のHP -${m[1]} (${m[2]}%) を奉げて味方を強化！`
  },
  {
    name: '철혈의 패황 공격력 증폭',
    pattern: /🚩⚔️\s*\[철혈의 패황\]\s*파티 전체의 공격력을\s*(\d+)턴간\s*(\d+)%\s*증폭했습니다!/i,
    en: m => `🚩⚔️ [Iron Sovereign] Boosted entire party ATK by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🚩⚔️ [鉄血の覇皇] 味方全体の攻撃力を${m[1]}ターンの間${m[2]}%増幅！`
  },
  {
    name: '스킬 시전 파티 전원 증폭 효과 부여',
    pattern: /⚡\s*(.+?)\s*\[(.+?)\]\s*→\s*파티 전원\s*\[(.*?)\]\s*증폭 효과 부여!/i,
    en: m => `⚡ ${m[1]} [${m[2]}] → Granted [${m[3]}] buff to all allies!`,
    ja: m => `⚡ ${m[1]} [${m[2]}] → 味方全員に[${m[3]}]増幅効果を付与！`
  },
  {
    name: '스킬 시전 개별 증폭 효과 부여',
    pattern: /⚡\s*(.+?)\s*\[(.+?)\]\s*→\s*(.+?)에게\s*\[(.*?)\]\s*증폭 효과 부여/i,
    en: m => `⚡ ${m[1]} [${m[2]}] → Granted [${m[4]}] buff to ${m[3]}`,
    ja: m => `⚡ ${m[1]} [${m[2]}] → ${m[3]}に[${m[4]}]増幅効果を付与`
  },
  {
    name: 'FEVER 위력 증폭',
    pattern: /🔥⚡\s*\[FEVER 위력 증폭\]\s*【(.+?)】\s*시너지로 지원\/치유\/버프 효과가\s*\+(\d+)%\s*대폭 강화되었습니다!/i,
    en: m => `🔥⚡ [FEVER Power Boost] 【${m[1]}】 synergy enhanced support/heal/buffs by +${m[2]}%!`,
    ja: m => `🔥⚡ [FEVER威力増幅] 【${m[1]}】シナジーで支援/回復/バフ効果が +${m[2]}% 大幅強化！`
  },
  {
    name: '치명적 본능 발동 알림',
    pattern: /⚡🗡️\s*\[치명적 본능\]\s*(.+?)\(암살자\)의 치명타 적중으로 그림자 추가 연격이 발동했습니다!\s*\(발동 확률:\s*(\d+)%.*?\)/i,
    en: m => `⚡🗡️ [Lethal Instinct] ${m[1]}'s CRIT hit triggered shadow follow-up! (${m[2]}% chance)`,
    ja: m => `⚡🗡️ [致命的本能] ${m[1]}（暗殺者）の会心命中により影追撃が発動！（発動確率: ${m[2]}%）`
  },
  {
    name: '치명적 본능 회피',
    pattern: /💨\s*\[회피\s*\/\s*EVADE\]\s*(.+?)(?:이\(가\)|이|가)\s*(.+?)의\s*\[치명적 본능\]\s*추가 연격을 회피했습니다!/i,
    en: m => `💨 [EVADE] ${m[1]} evaded ${m[2]}'s [Lethal Instinct] follow-up strike!`,
    ja: m => `💨 [回避 / EVADE] ${m[1]}が${m[2]}の[致命的本能]追加追撃を回避しました！`
  },
  {
    name: '치명적 본능 피해 직격',
    pattern: /▶\s*⚡🗡️\s*\[치명적 본능\]\s*(.+?)의\s*그림자 추가 연격(.*?)\s*→\s*(.+?)에게\s*(\d+)\s*치명 피해!(.*)/i,
    en: m => `▶ ⚡🗡️ [Lethal Instinct] ${m[1]}'s shadow follow-up${m[2]} → dealt ${m[4]} CRIT DMG to ${m[3]}!${m[5]}`,
    ja: m => `▶ ⚡🗡️ [致命的本能] ${m[1]}の影追撃${m[2]} → ${m[3]}に${m[4]}の会心ダメージ！${m[5]}`
  },
  {
    name: '환영 굴절 완전 투영 회피',
    pattern: /🪞\s*\[(.+?)\]\s*환영 굴절 발동!\s*(.+?)(?:이\(가\)|이|가)\s*적의 공격을 완전히 투영 회피했습니다!/i,
    en: m => `🪞 [${m[1]}] Mirage Refraction! ${m[2]} completely projected and evaded enemy attacks!`,
    ja: m => `🪞 [${m[1]}] 幻影屈折発動！${m[2]}が敵の攻撃を完全に投影回避しました！`
  },

  // ── 7. 몬스터 차징 & 브레이크 & 피격 상태이상 ──
  {
    name: '차징 파쇄 그로기',
    pattern: /💥⚡\s*\[차징 파쇄\]\s*(.+?)의\s*맹공으로\s*(.+?)의\s*차징이 분쇄되었습니다!\s*\((\d+)턴간 받는 피해\s*\+(\d+)%\s*그로기 돌입\)/i,
    en: m => `💥⚡ [Charge Shattered] ${m[1]}'s onslaught shattered ${m[2]}'s charge! (${m[3]} turn(s) Groggy, +${m[4]}% damage taken)`,
    ja: m => `💥⚡ [チャージ粉砕] ${m[1]}の猛攻で${m[2]}のチャージが粉砕されました！（${m[3]}ターン被ダメージ+${m[4]}%グロッキー突入）`
  },
  {
    name: '차징 저지 중 잔여 브레이크',
    pattern: /⚠️\s*\[차징 저지 중\]\s*(.+?)\s*남은 브레이크 요구치:\s*(\d+)\s*\/\s*(\d+)/i,
    en: m => `⚠️ [Interrupting Charge] ${m[1]} Remaining Break Gauge: ${m[2]} / ${m[3]}`,
    ja: m => `⚠️ [チャージ阻止中] ${m[1]} 残りブレイクゲージ: ${m[2]} / ${m[3]}`
  },
  {
    name: '그로기 상태 회복',
    pattern: /💫\s*(.+?)(?:이\(가\)|이|가)\s*그로기 상태에서 회복했습니다\./i,
    en: m => `💫 ${m[1]} recovered from groggy state.`,
    ja: m => `💫 ${m[1]}がグロッキー状態から回復しました。`
  },
  {
    name: '차징 취소 붕괴',
    pattern: /💥\s*\[차징 취소\]\s*결빙\/기절로 인해\s*(.+?)의\s*차징이 붕괴되었습니다!/i,
    en: m => `💥 [Charge Cancelled] Due to Freeze/Stun, ${m[1]}'s charge collapsed!`,
    ja: m => `💥 [チャージ中断] 凍結/気絶により${m[1]}のチャージが中断されました！`
  },
  {
    name: '차징 완료 방출',
    pattern: /💥⚠️\s*\[차징 완료!\]\s*(.+?)(?:이\(가\)|이|가)\s*응축된 힘을 폭발시키며\s*\[(.+?)\](?:을\(를\)|을|를)\s*방출합니다!\s*\(확정 치명타 & 방어 관통\s*(\d+)%\)/i,
    en: m => `💥⚠️ [Charge Complete!] ${m[1]} unleashed condensed power with [${m[2]}]! (Guaranteed CRIT & ${m[3]}% DEF Pierce)`,
    ja: m => `💥⚠️ [チャージ完了!] ${m[1]}が凝縮された力を爆発させ[${m[2]}]を放ちます！（確定会心＆防御貫通${m[3]}%）`
  },
  {
    name: '차징 위기 경고',
    pattern: /⚠️\s*\[위기 경고\]\s*(.+?)(?:이\(가\)|이|가)\s*강력한 일격\s*\[(.+?)\]\s*시전을 위해 힘을 모으기 시작합니다!\s*\(브레이크 저지 요구치:\s*(\d+)\s*피해 또는 기절\/빙결\)/i,
    en: m => `⚠️ [Threat Alert] ${m[1]} is channeling for [${m[2]}]! (Break requirement: ${m[3]} DMG or Stun/Freeze)`,
    ja: m => `⚠️ [危機警告] ${m[1]}が強力な一撃[${m[2]}]詠唱のため力を溜め始めました！（阻止条件: ${m[3]}ダメージまたは気絶/凍結）`
  },
  {
    name: '시전 요격 추가타',
    pattern: /▶\s*💨🎯\s*\[시전 요격 추가타!\]\s*(.+?):\s*"차징을 끊어라! 선제 사격!"\s*(.+?)에게\s*(\d+)\s*요격 피해 및 브레이크 요구치\s*-(\d+)\s*선제 파쇄!/i,
    en: m => `▶ 💨🎯 [Intercept Shot!] ${m[1]}: "Break the charge!" Dealt ${m[3]} intercept DMG to ${m[2]} & reduced break gauge by -${m[4]}!`,
    ja: m => `▶ 💨🎯 [詠唱迎撃追撃!] ${m[1]}:「チャージを止めろ！先制射撃！」${m[2]}に${m[3]}迎撃ダメージ＆ブレイク要求値 -${m[4]} 先制粉砕！`
  },
  {
    name: '피격 화상 지속턴',
    pattern: /🔥\s*\[화상\]\s*(.+?)에게\s*(\d+)턴간 화상이 부여되었습니다!\s*\(매 턴\s*(\d+)%\s*피해,\s*방어력\s*(\d+)%\s*분쇄\)/i,
    en: m => `🔥 [Burn] Inflicted Burn on ${m[1]} for ${m[2]} turn(s)! (${m[3]}% DoT, DEF -${m[4]}%)`,
    ja: m => `🔥 [火傷] ${m[1]}に${m[2]}ターンの間火傷を付与！（毎ターン${m[3]}%ダメージ、防御力${m[4]}%粉砕）`
  },
  {
    name: '피격 출혈 지속턴',
    pattern: /🩸\s*\[출혈\]\s*(.+?)에게\s*(\d+)턴간 출혈이 발생했습니다!\s*\(매 턴\s*(\d+)%\s*지속 피해,\s*공격력\s*-(\d+)%\)/i,
    en: m => `🩸 [Bleed] Inflicted Bleed on ${m[1]} for ${m[2]} turn(s)! (${m[3]}% DoT, ATK -${m[4]}%)`,
    ja: m => `🩸 [出血] ${m[1]}に${m[2]}ターンの間出血が発生！（毎ターン${m[3]}%継続ダメージ、攻撃力-${m[4]}%）`
  },
  {
    name: '피격 냉각 동결',
    pattern: /❄️\s*\[냉각 동결\]\s*(.+?)에게 빙결\/냉각이 부여되었습니다!\s*\((\d+)턴 행동불가,\s*지속 중 외피 동결 방어력\s*\+(\d+)%\)/i,
    en: m => `❄️ [Freeze/Frost] Inflicted Freeze on ${m[1]}! (${m[2]} turn(s) immobilized, frozen rind DEF +${m[3]}%)`,
    ja: m => `❄️ [冷却凍結] ${m[1]}に凍結/冷却が付与されました！（${m[2]}ターン行動不能、外皮凍結防御力+${m[3]}%）`
  },
  {
    name: '피격 화상 턴 미표기',
    pattern: /🔥\s*\[화상\]\s*(.+?)에게 화상이 부여되었습니다!\s*\(매 턴\s*(\d+)%\s*피해,\s*방어력\s*(\d+)%\s*분쇄\)/i,
    en: m => `🔥 [Burn] Inflicted Burn on ${m[1]}! (${m[2]}% DoT per turn, DEF -${m[3]}%)`,
    ja: m => `🔥 [火傷] ${m[1]}に火傷が付与されました！（毎ターン${m[2]}%ダメージ、防御力${m[3]}%粉砕）`
  },
  {
    name: '피격 맹독',
    pattern: /☠️\s*\[맹독\]\s*(.+?)에게 맹독이 중독되었습니다!\s*\(매 턴\s*(\d+)%\s*치명적 독 피해\)/i,
    en: m => `☠️ [Poison] Poisoned ${m[1]}! (${m[2]}% lethal poison DoT per turn)`,
    ja: m => `☠️ [猛毒] ${m[1]}が猛毒に侵されました！（毎ターン${m[2]}%致命的毒ダメージ）`
  },
  {
    name: '피격 출혈 턴 미표기',
    pattern: /🩸\s*\[출혈\]\s*(.+?)에게 출혈이 발생했습니다!\s*\(매 턴\s*(\d+)%\s*지속 피해,\s*공격력\s*-(\d+)%\)/i,
    en: m => `🩸 [Bleed] Inflicted Bleed on ${m[1]}! (${m[2]}% DoT per turn, ATK -${m[3]}%)`,
    ja: m => `🩸 [出血] ${m[1]}に出血が発生！（毎ターン${m[2]}%継続ダメージ、攻撃力-${m[3]}%）`
  },
  {
    name: '피격 방어력 약화 퍼센트',
    pattern: /🛡️⬇️\s*\[방어력 약화\]\s*(.+?)의\s*방어력이\s*(\d+)%\s*감소했습니다!/i,
    en: m => `🛡️⬇️ [DEF Weakened] ${m[1]}'s DEF decreased by ${m[2]}%!`,
    ja: m => `🛡️⬇️ [防御力弱化] ${m[1]}の防御力が${m[2]}%減少しました！`
  },
  {
    name: '피격 공격력 약화 퍼센트',
    pattern: /⚔️⬇️\s*\[공격력 약화\]\s*(.+?)의\s*공격력이\s*(\d+)%\s*감소했습니다!/i,
    en: m => `⚔️⬇️ [ATK Weakened] ${m[1]}'s ATK decreased by ${m[2]}%!`,
    ja: m => `⚔️⬇️ [攻撃力弱化] ${m[1]}の攻撃力が${m[2]}%減少しました！`
  },
  {
    name: '피격 실명 급감',
    pattern: /👁️❌\s*\[실명\]\s*(.+?)의\s*시야가 가려져 명중률이\s*(\d+)%\s*급감했습니다!/i,
    en: m => `👁️❌ [Blinded] ${m[1]}'s vision obscured; Accuracy dropped sharply by ${m[2]}%!`,
    ja: m => `👁️❌ [暗闇] ${m[1]}の視界が遮られ命中率が${m[2]}%急減しました！`
  },
  {
    name: '피격 기절 행동 불가',
    pattern: /💫\s*\[기절\]\s*(.+?)(?:이\(가\)|이|가)\s*충격으로 기절했습니다!\s*\((\d+)턴 행동 불가\)/i,
    en: m => `💫 [Stun] ${m[1]} was stunned by the shock! (${m[2]} turn(s) immobilized)`,
    ja: m => `💫 [気絶] ${m[1]}が衝撃で気絶しました！（${m[2]}ターン行動不能）`
  },

  // ── 8. 진형 & 시너지 ──
  {
    name: '진형 붕괴 위치 이동',
    pattern: /🌀\s*\[진형 붕괴\]\s*(.+?)(?:이\(가\)|이|가)\s*(.+?)되어\s*\[(.+?)\]로 이동했습니다!/i,
    en: m => `🌀 [Formation Disrupted] ${m[1]} was ${m[2]} and moved to [${m[3]}]!`,
    ja: m => `🌀 [陣形崩壊] ${m[1]}が${m[2]}され[${m[3]}]へ移動しました！`
  },
  {
    name: '진형 시너지 활성화',
    pattern: /⚡\s*\[진형 시너지 변경\]\s*진형 변동으로\s*\[(.+?)\]\s*\((.+?)\)\s*시너지가 즉시 활성화되었습니다!\s*\((.*?)\)/i,
    en: m => `⚡ [Formation Shift] Formation altered: [${m[1]}] (${m[2]}) activated! (${m[3]})`,
    ja: m => `⚡ [陣形シナジー変更] 陣形変動により[${m[1]}] (${m[2]}) シナジーが即時発動！（${m[3]}）`
  },
  {
    name: '진형 시너지 해제',
    pattern: /⚠️\s*\[진형 시너지 해제\]\s*진형이 무너져\s*\[(.+?)\]\s*시너지가 해제되었습니다!/i,
    en: m => `⚠️ [Synergy Lost] Formation broken: [${m[1]}] synergy dissolved!`,
    ja: m => `⚠️ [陣形シナジー解除] 陣形が崩れ[${m[1]}]シナジーが解除されました！`
  },
  // ── 9. 계열 부조화 (지원/치유 효율 & 위기 경고 등 추가) ──
  {
    name: '계열 부조화 위력/효율 반감',
    pattern: /⚠️\s*\[계열 부조화\]\s*(.+?)의\s*클래스와 맞지 않는\s*\[(.+?)\]\s*스킬로 인해\s*(?:지원\/치유 효율이|위력이)\s*50%\s*반감됩니다!/i,
    en: m => `⚠️ [Affinity Mismatch] [${m[2]}] does not match ${m[1]}'s class; effectiveness reduced by 50%!`,
    ja: m => `⚠️ [系統不調和] ${m[1]}のクラスと一致しない[${m[2]}]スキルのため効果が50%半減します！`
  },
  // ── 10. 스킬 시전 일반 리포트 (치유/보호막 외) ──
  {
    name: '스킬 시전 일반 리포트',
    pattern: /✨\s*(.+?)\s*\[(.+?)\]\s*→\s*(.+)/i,
    en: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`,
    ja: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`
  }
];
