import fs from 'fs';
import path from 'path';

// Complete translation dictionary for delta_018
export const delta018 = {
  // =========================================================================
  // 1. UI, Navigation, Drawers & Shortcuts (Ark Citadel, Wheel Navigator, Logs)
  // =========================================================================
  "유지비 체납": {
    en: "Upkeep Delinquent",
    ja: "維持費滞納"
  },
  "시설 복구": {
    en: "Restore Facility",
    ja: "施設復旧"
  },
  "퀘스트 보상 수령": {
    en: "Claim Quest Rewards",
    ja: "クエスト報酬受取"
  },
  "진동 피드백 (햅틱)": {
    en: "Vibration Feedback (Haptic)",
    ja: "振動フィードバック（触覚）"
  },
  "진동 켜짐 (ON)": {
    en: "Vibration ON",
    ja: "振動 ON"
  },
  "진동 꺼짐 (OFF)": {
    en: "Vibration OFF",
    ja: "振動 OFF"
  },
  "{0}건 완료": {
    en: "{0} Completed",
    ja: "{0}件完了"
  },
  "침묵의 회랑 1~5층 MUD 던전 출격 및 전술 보급품 편성": {
    en: "Silent Corridor 1-5F MUD dungeon sortie & tactical supplies",
    ja: "沈黙の回廊 1〜5階 MUDダンジョン出撃＆戦術補給品編成"
  },
  "출격 가능": {
    en: "Ready for Sortie",
    ja: "出撃可能"
  },
  "{0}인": {
    en: "{0} Heroes",
    ja: "{0}人"
  },
  "{0}위": {
    en: "#{0}",
    ja: "{0}位"
  },
  "차원 아레나 & 게이트": {
    en: "Dimensional Arena & Gate",
    ja: "次元アリーナ＆ゲート"
  },
  "차원 아레나 결투 및 네메시스 침공전": {
    en: "Dimensional Arena Duels & Nemesis Invasions",
    ja: "次元アリーナ決闘＆ネメシス侵攻戦"
  },
  "지름길": {
    en: "Shortcut",
    ja: "ショートカット"
  },
  "(시설 진입 휠에서 등록한 빠른 바로가기)": {
    en: "(Quick shortcut registered from facility entry wheel)",
    ja: "（施設進入ホイールで登録したクイックショートカット）"
  },
  "3인 원정대 파티 편성, 출격 대원 교체 및 진형 배치를 관리합니다.": {
    en: "Manage 3-hero expedition party, roster rotation, and formations.",
    ja: "3人遠征隊パーティ編成、出撃隊員の入替および陣形配置を管理します。"
  },
  "전투 중 전사한 영령들의 묘비 안치 현황 및 영령의 가호·추모 버프를 확인합니다.": {
    en: "Check memorials of fallen heroes, ancestral blessings, and memorial buffs.",
    ja: "戦死した英霊の墓標安置状況および英霊の加護・追悼バフを確認します。"
  },
  "{0}/3인 편성": {
    en: "{0}/3 Assigned",
    ja: "{0}/3人編成"
  },
  "안치자 없음": {
    en: "No Memorials",
    ja: "安置者なし"
  },
  "{0}위 안치": {
    en: "{0} Memorialized",
    ja: "{0}柱安置"
  },
  "대원 교체 & 진형 배치": {
    en: "Roster Swap & Formation",
    ja: "隊員入替＆陣形配置"
  },
  "전사 영령 안치 & 추모": {
    en: "Hero Memorial & Tribute",
    ja: "戦死英霊安置＆追悼"
  },
  "거점 바로가기": {
    en: "Citadel Shortcut",
    ja: "拠点ショートカット"
  },
  "시설 건설 필요": {
    en: "Construction Required",
    ja: "施設建設が必要"
  },
  "바로가기": {
    en: "Shortcut",
    ja: "ショートカット"
  },
  "우선 나머지 생산 시설 건설을 완료해 주십시오.": {
    en: "Please complete constructing remaining production facilities first.",
    ja: "先に残りの生産施設の建設を完了してください。"
  },
  "목표 시설 [{0}] 건설로 이동": {
    en: "Go to target facility [{0}] construction",
    ja: "目標施設【{0}】の建設へ移動"
  },
  "현재 Lv.{0}": {
    en: "Current Lv.{0}",
    ja: "現在 Lv.{0}"
  },
  "사령부 지름길 슬롯": {
    en: "Command Shortcut Slot",
    ja: "司令部ショートカットスロット"
  },
  "(사령부 패널 지름길 배너로 표시)": {
    en: "(Displayed as Command Panel shortcut banner)",
    ja: "（司令部パネルのショートカットバナーに表示）"
  },
  "현재 카드": {
    en: "Current Card",
    ja: "現在のカード"
  },
  "{0} 카드로 휠 이동": {
    en: "Rotate wheel to {0} card",
    ja: "{0}カードへホイール移動"
  },
  "✓ 현재 선택": {
    en: "✓ Currently Selected",
    ja: "✓ 現在選択中"
  },
  "클릭 시 이동": {
    en: "Click to Navigate",
    ja: "クリックで移動"
  },
  "현재 표시된 [{0}] 카드로 저장": {
    en: "Save currently displayed [{0}] card",
    ja: "現在表示中の【{0}】カードに保存"
  },
  "슬롯 비우기": {
    en: "Clear Slot",
    ja: "スロットを空ける"
  },
  "현재 표시된 [{0}] 카드를 #{1} 슬롯에 저장": {
    en: "Save displayed [{0}] card to Slot #{1}",
    ja: "表示中の【{0}】カードをスロット#{1}に保存"
  },
  "빈 슬롯": {
    en: "Empty Slot",
    ja: "空きスロット"
  },
  "현재 카드 저장": {
    en: "Save Current Card",
    ja: "現在のカードを保存"
  },
  "최근": {
    en: "Recent",
    ja: "最近"
  },
  "클릭하여 로그 접기": {
    en: "Click to collapse log",
    ja: "クリックしてログを折りたたむ"
  },
  "클릭하여 전체 로그 펼치기": {
    en: "Click to expand full log",
    ja: "クリックして全ログを展開"
  },
  "최근 로그": {
    en: "Recent Log",
    ja: "最新ログ"
  },
  "클릭하여 이전 화면으로 돌아가기": {
    en: "Click to return to previous screen",
    ja: "クリックして前の画面に戻る"
  },
  "돌아가기 (창 닫기)": {
    en: "Return (Close)",
    ja: "戻る（閉じる）"
  },

  // =========================================================================
  // 2. Battle Screen, VFX & Combat Text
  // =========================================================================
  "⚰️ 완전 사망": {
    en: "⚰️ Permanent Death",
    ja: "⚰️ 完全死亡"
  },
  "⚡ 전자기 기절": {
    en: "⚡ EMP Stun",
    ja: "⚡ 電磁気絶"
  },
  "약점이 노출된 적의 급소를 정확히 저격하여 60% 추가 처형 피해를 꽂아넣었습니다!": {
    en: "Targeted the exposed weak point with precision, inflicting +60% execution damage!",
    ja: "弱点が露出した急所を的確に狙撃し、+60%の追加処刑ダメージを与えました！"
  },
  "출혈 중인 상처에서 피의 마력을 강탈하여 아군 전체의 체력을 즉시 회복시켰습니다!": {
    en: "Siphoned blood mana from bleeding wounds, immediately healing all allies!",
    ja: "出血中の傷口から血の魔力を強奪し、味方全体のHPを即座に回復しました！"
  },
  "🩸 [피의 흡혈 공명] 아군 전체 체력 +{0} 즉시 치유!": {
    en: "🩸 [Blood Siphon Resonance] Restored +{0} HP to all allies!",
    ja: "🩸【吸血の血脈共鳴】味方全員のHPを +{0} 即時回復！"
  },
  "👥 [그림자 은신] {0}이(가) 1턴간 은신(회피율 +60%) 태세에 돌입했습니다!": {
    en: "👥 [Shadow Stealth] {0} entered stealth (+60% Evasion) for 1 turn!",
    ja: "👥【影の隠密】{0}が1ターンの間、隠密（回避率+60%）の態勢に入りました！"
  },
  "단죄 35% 추가 피해 & 아군 전체 치유/마나": {
    en: "Judgment: +35% Extra DMG & Ally Heal/Mana",
    ja: "断罪: +35%追加ダメージ＆味方全体回復/マナ"
  },
  "공격 약화 상태의 적에게 신성 일격 적중 시 35% 신성 추가 피해 및 아군 전원 HP(시전자 공격력의 25%) 치유 + MP 10 회복": {
    en: "Hitting ATK-weakened enemies with Holy Strike deals +35% Holy DMG, heals all allies for 25% of ATK, and restores 10 MP.",
    ja: "攻撃弱化状態の敵に神聖攻撃を命中させると、+35%の神聖追加ダメージを与え、味方全体のHP（攻撃力の25%）を回復＋MPを10回復。"
  },
  "약점 저격 +60% 추가 처형 피해": {
    en: "Weak Point Snipe: +60% Execution DMG",
    ja: "弱点狙撃: +60%追加処刑ダメージ"
  },
  "실명·표적 또는 출혈·방어 약화 상태의 적을 저격/관통으로 타격 시 노출된 급소를 꿰뚫어 +60% 추가 처형 피해를 입힙니다.": {
    en: "Piercing/sniping enemies with Blind, Targeted, Bleed, or DEF Down strikes vitals for +60% execution DMG.",
    ja: "盲目・標的または出血・防御弱化状態の敵を狙撃/貫通で攻撃時、露出した急所を射抜いて+60%の追加処刑ダメージを与えます。"
  },
  "+35% 암흑 피해 & 아군 전체 체력 즉시 치유": {
    en: "+35% Dark DMG & Immediate Party Heal",
    ja: "+35%暗黒ダメージ＆味方全体HP即時回復"
  },
  "출혈 중인 적의 상처에서 피의 마력을 강탈하여 35% 암흑 추가 피해를 입히고 추가 피해의 30%만큼 아군 전원 HP를 즉시 치유(흡혈 공명)합니다.": {
    en: "Siphons blood mana from bleeding foes, dealing +35% Dark DMG and healing all allies for 30% of the damage (Vampiric Resonance).",
    ja: "出血中の敵から血の魔力を奪い、+35%の暗黒追加ダメージを与え、その30%分味方全員のHPを回復（吸血共鳴）します。"
  },
  "실명/표적/출혈/방어약화": {
    en: "Blind/Mark/Bleed/DEF-Down",
    ja: "盲目/標的/出血/防御弱化"
  },
  "💧✨ [여신의 성수 공양] 성상 축성 (전원 HP 80% / MP 80% 회복 + 모든 디버프 해제 + 3턴간 디버프 면역 + ✨에테르 +50)": {
    en: "💧✨ [Goddess Holy Water Offering] Consecrate Statue (All HP 80% / MP 80% restored + cleanse all debuffs + 3-turn debuff immunity + ✨50 Ether)",
    ja: "💧✨【女神の聖水供養】像の聖別（全員HP80%/MP80%回復＋全デバフ解除＋3ターンデバフ免疫＋✨エーテル+50）"
  },
  "💧✨ [여신의 성수 축성 대성공] 여신의 성수로 성상을 축성하여 생존 대원 전원 HP 80% / MP 80% 회복, 모든 디버프 해제, 3턴간 [상태이상 면역] 부여 및 ✨ 에테르 +50 획득!": {
    en: "💧✨ [Goddess Holy Water Success] Consecrated statue! Restored 80% HP/MP to all surviving heroes, cleansed all debuffs, granted 3-turn [Status Immunity], and gained ✨50 Ether!",
    ja: "💧✨【女神の聖水聖別大成功】女神の聖水で聖像を清め、生存隊員全員のHP80%/MP80%回復、全デバフ解除、3ターンの【状態異常免疫】付与および✨エーテル+50を獲得！"
  },

  // =========================================================================
  // 3. Dimensional Gate, Arena & Invasion
  // =========================================================================
  "차원 게이트 (Dimensional Gate)": {
    en: "Dimensional Gate",
    ja: "次元ゲート"
  },
  "차원 아레나 & 네메시스 침공의 문": {
    en: "Portal to Dimensional Arena & Nemesis Invasions",
    ja: "次元アリーナ＆ネメシス侵攻の門"
  },
  "심연의 백과 & 회고록 (Abyssal Codex)": {
    en: "Abyssal Codex & Chronicles",
    ja: "深淵の百科＆回顧録"
  },
  "방랑자의 라운지 (Wanderer's Lounge)": {
    en: "Wanderer's Lounge",
    ja: "放浪者のラウンジ"
  },
  "획득 투사의 인장": {
    en: "Fighter's Seals Gained",
    ja: "獲得闘士の印章"
  },
  "총 Lv.{0} / 45": {
    en: "Total Lv.{0} / 45",
    ja: "合計 Lv.{0} / 45"
  },
  "1차(화력증폭)": {
    en: "Tier 1 (Firepower Amp)",
    ja: "1段階（火力増幅）"
  },
  "2차(작열화상)": {
    en: "Tier 2 (Blazing Burn)",
    ja: "2段階（灼熱火傷）"
  },
  "3차(맹독부식)": {
    en: "Tier 3 (Venom Corrode)",
    ja: "3段階（猛毒腐食）"
  },
  "1차(결계복원)": {
    en: "Tier 1 (Barrier Restore)",
    ja: "1段階（結界復元）"
  },
  "2차(충격기절)": {
    en: "Tier 2 (Impact Stun)",
    ja: "2段階（衝撃気絶）"
  },
  "3차(동결역장)": {
    en: "Tier 3 (Freeze Field)",
    ja: "3段階（凍結力場）"
  },
  "1차(속도감속)": {
    en: "Tier 1 (Speed Slow)",
    ja: "1段階（速度減速）"
  },
  "2차(마나증가)": {
    en: "Tier 2 (Mana Drain)",
    ja: "2段階（マナ消費増）"
  },
  "3차(행운저주)": {
    en: "Tier 3 (Luck Curse)",
    ja: "3段階（幸運呪詛）"
  },
  "출전 인원": {
    en: "Combatants",
    ja: "出陣人員"
  },
  "파티 출전 중 ({0}번)": {
    en: "In Party (Slot {0})",
    ja: "パーティ出撃中（{0}番）"
  },
  "제작 예상 스탯 (±8% 편차 × 등급 배율)": {
    en: "Estimated Crafting Stats (±8% Variance × Quality Multiplier)",
    ja: "製作予想ステータス（±8%偏差 × 品質倍率）"
  },
  "원정단 편성 전직 각성 의식 (영혼의 제단 해금)": {
    en: "Party Roster Promotion/Awakening (Soul Altar Unlocked)",
    ja: "遠征団編成 クラス昇格・覚醒の儀式（魂の祭壇解禁）"
  },
  "완전 군장 & 고급 단조 및 차원의 호각": {
    en: "Full Gear, Master Forge & Dimensional Whistle",
    ja: "完全軍装＆高級鍛造および次元の角笛"
  },
  "차원의 틈이 찢어지며 떨어진 붕괴된 공간의 파편입니다. 대용량 완전 군장 배낭, 차원의 호각 유물, 최상위 장비 단조 및 시설 9~10레벨 증축에 필요한 최상급 유물입니다.": {
    en: "Fragments of collapsed space torn from dimensional rifts. Required for Full Gear Backpacks, Dimensional Whistles, pinnacle forging, and Facility Lv.9-10 upgrades.",
    ja: "次元の裂け目から零れ落ちた崩壊空間の破片。大容量完全軍装バックパック、次元の角笛の遺物、最高峰装備鍛造および施設Lv.9〜10増築に必要な至高の遺物です。"
  },
  "최상위 장비 단조 및 시설 Lv.9~10 증축": {
    en: "Pinnacle Forging & Facility Lv.9-10 Expansion",
    ja: "最高峰装備鍛造および施設Lv.9〜10増築"
  },
  "용병들이 습득한 스킬을 강화합니다. 강화 시 위력(+12%)과 소모 MP(+12%)가 증가합니다.": {
    en: "Enhance acquired hero skills. Each level increases power (+12%) and MP cost (+12%).",
    ja: "傭兵が習得したスキルを強化します。強化ごとに威力(+12%)と消費MP(+12%)が上昇します。"
  },
  "10층 및 무간도(11층)": {
    en: "10F & Avici (11F)",
    ja: "10階＆無間道（11階）"
  },
  "🔰저항": {
    en: "🔰 RES",
    ja: "🔰 抵抗"
  },
  "💖체력재생": {
    en: "💖 HP Regen",
    ja: "💖 HP再生"
  },
  "🗡️ 관통": {
    en: "🗡️ Piercing",
    ja: "🗡️ 貫通"
  },
  "🔰 저항": {
    en: "🔰 RES",
    ja: "🔰 抵抗"
  },
  "💖 재생": {
    en: "💖 Regen",
    ja: "💖 再生"
  },
  "스킬 비전 강화 및 장비 마도 인챈트": {
    en: "Skill Mastery & Equipment Sorcery Enchants",
    ja: "スキル秘伝強化＆装備魔導エンチャント"
  },
  "27종 군수 물자 적재 용량 관리 및 증축 (유지비 면제)": {
    en: "Manage storage capacity for 27 military resources (Maintenance Free)",
    ja: "27種軍需物資の積載容量管理＆増築（維持費免除）"
  },
  "에테르 룬 장비 단조, 강화 및 침식 장비 정화": {
    en: "Ether Rune equipment forging, enhancement, and erosion purification",
    ja: "エーテルルーン装備の鍛造、強化および侵食装備の浄化"
  },
  "심연 10층 및 무간도(11층) 탐험 채비 및 전술 보급품 편성": {
    en: "Expedition prep and tactical supplies for Abyss 10F & Avici (11F)",
    ja: "深淵10階および無間道（11階）探検準備＆戦術補給品編成"
  },
  "심연의 어둠 속 최후의 부유 요새 & 성채 시설 관리": {
    en: "The last floating fortress in the dark abyss & citadel management",
    ja: "深淵の闇に浮かぶ最後の浮遊要塞＆城塞施設管理"
  },

  // =========================================================================
  // 4. Dungeon Floors & Atmospheric Descriptions
  // =========================================================================
  "심연의 입구. 차가운 석재 회랑과 핏빛 이끼": {
    en: "Abyss entrance. Cold stone corridors and bloodstained moss.",
    ja: "深淵の入口。冷たい石造回廊と血色の苔。"
  },
  "원혼들이 떠도는 납골 묘지": {
    en: "Ossuary graveyard where vengeful spirits wander.",
    ja: "怨霊が彷徨う納骨墓地。"
  },
  "푸른빛 마나 수정이 자라나는 지하 광산": {
    en: "Subterranean mines where azure mana crystals flourish.",
    ja: "青いマナ水晶が群生する地下鉱山。"
  },
  "시공간이 일그러진 차원 틈새": {
    en: "Dimensional rift distorted by space and time.",
    ja: "時空間が歪んだ次元の裂け目。"
  },
  "고대 공허 거신이 잠든 결전의 제단": {
    en: "Altar of destiny where the ancient void colossus sleeps.",
    ja: "古代虚無の巨神が眠る決戦の祭壇。"
  },
  "진홍의 피가 흐르는 고딕 대성당": {
    en: "Gothic cathedral flowing with crimson blood.",
    ja: "深紅の血が流れるゴシック大聖堂。"
  },
  "사신이 지배하는 영혼의 나락": {
    en: "Soul abyss ruled by the Grim Reaper.",
    ja: "死神が支配する魂の奈落。"
  },
  "타락한 기사단장의 흑철 요새": {
    en: "Black iron fortress of the corrupted Knight Commander.",
    ja: "堕落した騎士団長の黒鉄要塞。"
  },
  "거울 파편이 떠다니는 만화경 미로": {
    en: "Kaleidoscope labyrinth of drifting mirror shards.",
    ja: "鏡の破片が漂う万華鏡の迷宮。"
  },
  "종말의 공허 군주가 자리한 옥좌": {
    en: "Throne of the apocalyptic Void Overlord.",
    ja: "終末の虚無君主が鎮座する玉座。"
  },
  "끝없는 심연의 무한 연옥": {
    en: "Infinite purgatory of the endless abyss.",
    ja: "終わりのない深淵の無限煉獄。"
  },

  // =========================================================================
  // 5. Ancestral Blessings (3rd Transcendence Classes)
  // =========================================================================
  "3차 초월 클래스": {
    en: "Tier 3 Transcendence Class",
    ja: "3次超越クラス"
  },
  "불멸 성채의 방벽": {
    en: "Immortal Citadel Bulwark",
    ja: "不滅城塞の防壁"
  },
  "이지스 바스티온의 절대 방벽: 파티 방어력 +22%, 받는 피해 15% 감소, 개시 보호막 +20%(3턴), 전열 엄호율 +30%": {
    en: "Aegis Bastion's Absolute Ward: Party DEF +22%, DMG Taken -15%, Initial Shield +20% (3 turns), Frontline Cover +30%.",
    ja: "イージス・バスティオンの絶対防壁: パーティ防御力+22%、被ダメージ15%軽減、開幕シールド+20%（3ターン）、前衛援護率+30%。"
  },
  "보이드 군주의 잔영": {
    en: "Void Sovereign's Echo",
    ja: "ヴォイド君主の残影"
  },
  "보이드 스트라이더의 극의: 파티 속도 +15%, 중열 회피율 +20%, 치명타율 +12%, 치명타 피해 +35%, 방어 관통 +20%": {
    en: "Void Strider's Pinnacle: Party SPD +15%, Mid-row Evasion +20%, Crit Rate +12%, Crit DMG +35%, DEF Piercing +20%.",
    ja: "ヴォイド・ストライダーの極意: パーティ速度+15%、中衛回避率+20%、会心率+12%、会心ダメージ+35%、防御貫通+20%。"
  },
  "크로노 아콘의 섭리": {
    en: "Chrono Archon's Providence",
    ja: "クロノ・アルコンの摂理"
  },
  "크로노 아콘의 시공 마력핵: 파티 공격력 +18%, 전능력치 +10%, 속도 +12%, 매 턴 마나 +8 MP 회복": {
    en: "Chrono Archon's Space-Time Core: Party ATK +18%, All Stats +10%, SPD +12%, MP Regen +8 per turn.",
    ja: "クロノ・アルコンの時空魔力核: パーティ攻撃力+18%、全能力値+10%、速度+12%、毎ターンMP+8回復。"
  },
  "세라핌의 구원 심판": {
    en: "Seraph's Salvation Judgment",
    ja: "セラフィムの救済審判"
  },
  "세라픽 인퀴지터의 성광: 전능력치 +10%, 공격력 +15%, 매 턴 체력 4.5% 및 마나 +6 MP 재생, 흡혈 +10%": {
    en: "Seraphic Inquisitor's Holy Light: All Stats +10%, ATK +15%, HP Regen +4.5% & MP +6 per turn, Lifesteal +10%.",
    ja: "セラフィック・インクイジターの聖光: 全能力値+10%、攻撃力+15%、毎ターンHP4.5%＆MP+6回復、吸血+10%。"
  },
  "발할라 패황의 군세": {
    en: "Valhalla Overlord's Legion",
    ja: "ヴァルハラ覇皇の軍勢"
  },
  "발할라 워로드의 불멸 투혼: 파티 공격력 +20%, 방어력 +15%, 치명타 피해 +30%, 흡혈 +10%, 받는 피해 10% 감소": {
    en: "Valhalla Warlord's Immortal Will: Party ATK +20%, DEF +15%, Crit DMG +30%, Lifesteal +10%, DMG Taken -10%.",
    ja: "ヴァルハラ・ウォーロードの不滅闘魂: パーティ攻撃力+20%、防御力+15%、会心ダメージ+30%、吸血+10%、被ダメージ10%軽減。"
  },
  "오메가 데드아이의 조준": {
    en: "Omega Deadeye's Crosshairs",
    ja: "オメガ・デッドアイの照準"
  },
  "오메가 데드아이의 종말 탄환: 파티 치명타율 +18%, 치명타 피해 +45%, 방어 관통 +25%, 매 턴 마나 +5 MP 회복": {
    en: "Omega Deadeye's Doomsday Round: Party Crit Rate +18%, Crit DMG +45%, DEF Piercing +25%, MP Regen +5 per turn.",
    ja: "オメガ・デッドアイの終末弾丸: パーティ会心率+18%、会心ダメージ+45%、防御貫通+25%、毎ターンMP+5回復。"
  },

  // =========================================================================
  // 6. Weapon Traits & Fighter Equipment
  // =========================================================================
  "기본 공격 시 보호막에 50% 추가 피해": {
    en: "Basic attacks deal +50% extra DMG to Shields",
    ja: "基本攻撃時、シールドへ+50%の追加ダメージ"
  },
  "단단한 보호막을 분쇄하는 창끝으로 기본 공격 시 적의 보호막(Shield)에 50%의 추가 피해를 입힙니다.": {
    en: "Piercing spear tip designed to shatter fortifications, dealing +50% DMG against enemy shields on basic attacks.",
    ja: "強固なシールドを粉砕する穂先。基本攻撃時に敵のシールドへ+50%の追加ダメージを与えます。"
  },
  "기본 공격 시 상대보다 속도가 빠를수록 피해량 최대 20% 증폭": {
    en: "Basic attacks deal up to +20% DMG based on Speed advantage",
    ja: "基本攻撃時、相手より速度が速いほどダメージ最大+20%増幅"
  },
  "민첩한 선제 공격으로 기본 공격 시 대상 마물보다 속도가 빠를수록 피해량이 최대 20%까지 증폭됩니다.": {
    en: "Agile initiative strike that amplifies basic attack damage by up to +20% when moving faster than the target.",
    ja: "素早い先制攻撃。基本攻撃時、対象の魔物より速度が速いほどダメージが最大20%まで増幅されます。"
  },
  "단단한 철광석을 석탄 열기로 벼려낸 기본 검. [🗡️ 베기] 특성으로 기본 공격 적중 시 대상에게 1턴간 [출혈](최대 체력의 8% 피해)을 부여합니다.": {
    en: "Standard blade forged from solid iron ore. [🗡️ Slash] inflicts [Bleed] (8% max HP damage) for 1 turn on hit.",
    ja: "硬質な鉄鉱石を鍛え上げた標準剣。【🗡️ 斬撃】により基本攻撃命中時、対象に1ターンの【出血】（最大HPの8%ダメージ）を付与します。"
  },
  "차원 결투장에서 수많은 강자를 쓰러뜨린 투사의 명검. [투사 특성: 방어 관통 30%]": {
    en: "Champion's renowned sword that felled countless arena rivals. [Fighter: 30% DEF Piercing]",
    ja: "次元闘技場で幾多の猛者を打ち倒した闘士の名剣。【闘士特性: 防御貫通30%】"
  },
  "적의 전열을 분쇄하는 거대한 투사의 전술 장창. [투사 특성: 방어 관통 30%]": {
    en: "Massive tactical lance designed to breach enemy frontlines. [Fighter: 30% DEF Piercing]",
    ja: "敵の前衛を粉砕する巨大な闘士の戦術槍。【闘士特性: 防御貫通30%】"
  },
  "에테르 탄환을 고속 연사하는 차원 아레나 제식 마총. [투사 특성: 방어 관통 30%]": {
    en: "Arena service magic gun firing rapid ether rounds. [Fighter: 30% DEF Piercing]",
    ja: "エーテル弾を高速連射する次元アリーナ制式魔銃。【闘士特性: 防御貫通30%】"
  },
  "후열의 적을 정확히 꿰뚫는 투사의 초장거리 강궁. [투사 특성: 방어 관통 30%]": {
    en: "Longbow snipes backline foes with lethal accuracy. [Fighter: 30% DEF Piercing]",
    ja: "後衛の敵を正確に射抜く闘士の超長距離強弓。【闘士特性: 防御貫通30%】"
  },
  "차원 마력을 벼려 만든 투사의 비전 지팡이. [투사 특성: 방어 관통 30% / 마력 공명]": {
    en: "Arcane staff forged of dimensional mana. [Fighter: 30% DEF Piercing / Mana Resonance]",
    ja: "次元の魔力を鍛造した闘士の秘術杖。【闘士特性: 防御貫通30% / 魔力共鳴】"
  },
  "급소를 기습하기 위해 정밀 연마된 투사의 비수. [투사 특성: 방어 관통 30%]": {
    en: "Finely honed dagger crafted for ambush strikes. [Fighter: 30% DEF Piercing]",
    ja: "急所奇襲のために研ぎ澄まされた闘士の短剣。【闘士特性: 防御貫通30%】"
  },
  "어떠한 맹공도 버텨내는 불패의 투사 중장갑주. [투사 특성: 저항 10%]": {
    en: "Invincible heavy plate capable of weathering any assault. [Fighter: +10% Resistance]",
    ja: "いかなる猛攻にも耐え抜く不敗の闘士重甲冑。【闘士特性: 抵抗+10%】"
  },
  "민첩한 기동과 회피를 극대화한 투사의 전투 경갑. [투사 특성: 저항 10%]": {
    en: "Battle light armor tuned for maximum mobility and evasion. [Fighter: +10% Resistance]",
    ja: "機動性と回避力を極限まで高めた闘士の戦闘軽甲。【闘士特性: 抵抗+10%】"
  },
  "마나 순환과 보호 결계를 증폭하는 투사의 마도 로브. [투사 특성: 저항 10%]": {
    en: "Sorcerer robe amplifying mana circulation and protective wards. [Fighter: +10% Resistance]",
    ja: "マナ循環と保護結界を増幅する闘士の魔導ローブ。【闘士特性: 抵抗+10%】"
  },
  "차원 투기장 승리자에게 주어지는 영예로운 반지. [투사 특성: 턴당 체력 재생 5%]": {
    en: "Honor ring bestowed upon victors of the dimensional arena. [Fighter: +5% HP Regen/Turn]",
    ja: "次元闘技場の覇者に授けられる栄誉の指輪。【闘士特性: 毎ターンHP再生+5%】"
  },
  "위기 순간 착용자의 생체 에너지를 지탱하는 결전 펜던트. [투사 특성: 턴당 체력 재생 5%]": {
    en: "Showdown pendant sustaining vital energy in dire perils. [Fighter: +5% HP Regen/Turn]",
    ja: "危急の瞬間に着用者の生命力を維持する決戦ペンダント。【闘士特性: 毎ターンHP再生+5%】"
  },
  "차원 투기장에서 맹활약하는 기사를 위한 결전 방패. [투사 특성: 저항 10%]": {
    en: "Showdown shield crafted for valiant arena knights. [Fighter: +10% Resistance]",
    ja: "次元闘技場で活躍する騎士のための決戦盾。【闘士特性: 抵抗+10%】"
  },
  "어떠한 맹공도 버텨내는 기사 계열 전용 판금갑. 최전선에서 파티원을 굳건하게 지켜냅니다. [투사 특성: 저항 10%]": {
    en: "Exclusive plate armor for Knight classes to withstand any assault. [Fighter: +10% Resistance]",
    ja: "いかなる猛攻にも耐える騎士専用板金鎧。最前線で仲間を堅守します。【闘士特性: 抵抗+10%】"
  },
  "도적 계열을 위한 예리한 결전 비수. 빠른 행동 속도와 날카로운 치명타율을 부여합니다. [투사 특성: 방어 관통 30%]": {
    en: "Razor-sharp showdown dagger for Rogue classes, granting high SPD and Crit. [Fighter: 30% DEF Piercing]",
    ja: "盗賊系専用の鋭利な決戦短剣。素早い行動速度と鋭い会心率を付与。【闘士特性: 防御貫通30%】"
  },
  "암흑 속에서 적의 심장을 겨누는 도적 계열 최고위 비도. 치명적인 암살 일격을 보장합니다. [투사 특성: 방어 관통 30%]": {
    en: "Supreme throwing daggers targeting the heart from shadows. [Fighter: 30% DEF Piercing]",
    ja: "暗闇から敵の心臓を狙う盗賊系最高位の飛刀。致命的な暗殺一撃を約束。【闘士特性: 防御貫通30%】"
  },

  // =========================================================================
  // 7. Tactical Momentum & Fever Codex Guides (System Guides)
  // =========================================================================
  "🔥 전술 모멘텀(Tactical Momentum) & 8대 모멘텀 뱃지 수집 메커니즘": {
    en: "🔥 Tactical Momentum & 8 Momentum Badges Collection Mechanism",
    ja: "🔥 戦術モメンタム（Tactical Momentum）＆8大モメンタムバッジ収集メカニズム"
  },
  "💖 신성 치유 (HEAL): 회복, 재생 또는 정화 스킬로 아군을 치료할 때 획득": {
    en: "💖 Holy Heal (HEAL): Acquired when healing allies with recovery, regen, or cleanse skills",
    ja: "💖 神聖治癒（HEAL）: 回復、再生、浄化スキルで味方を治療した時に獲得"
  },
  "⚡ 전술 파동 FEVER 폭발 & 궁극기 시너지 족보 12선": {
    en: "⚡ Tactical Wave FEVER Burst & 12 Ultimate Synergy Codex",
    ja: "⚡ 戦術波動 FEVER爆発＆究極シナジー譜12選"
  },
  "🕊️💖 [기적의 소생]: 가드 2개 이상 + 힐 3개 이상 모였을 때 발동. 사망 아군 1인 30% 체력으로 부활(사망자 부재 시 전원 30% 치유) 및 회복된 체력만큼 적 전체에 신성 공격 + 해로운 효과 정화 & 면역 1턴": {
    en: "🕊️💖 [Miraculous Revive]: Triggered with 2+ GUARD + 3+ HEAL. Revives 1 fallen ally with 30% HP (or heals all by 30% if none fallen), deals Holy DMG to all foes equal to healed amount, cleanses debuffs & grants 1-turn immunity.",
    ja: "🕊️💖【奇跡の蘇生】: ガード2個以上＋ヒール3個以上で発動。死亡した味方1人をHP30%で蘇生（死亡者不在時は全員30%回復）し、回復量分の神聖全体攻撃＋デバフ浄化＆1ターン免疫付与。"
  },
  "💖🕊️ [신성 성역]: 힐 3개 이상 모였을 때 발동. 파티 전원 체력 50% 대량 회복(사망 아군 존재 시 1인 10% 부활) + 최대 HP 15% 보호막 + 모든 해로운 효과 정화 및 1턴 면역": {
    en: "💖🕊️ [Divine Sanctuary]: Triggered with 3+ HEAL. Massive 50% HP heal to party (revives 1 fallen ally with 10% HP if any), +15% Max HP shield, cleanses all debuffs & grants 1-turn immunity.",
    ja: "💖🕊️【神聖サンクチュアリ】: ヒール3個以上で発動。パーティ全員のHPを50%大量回復（死亡者1人を10%蘇生）＋最大HP15%シールド＋全デバフ浄化＆1ターン免疫。"
  },
  "🩸🕊️ [기사회생]: 가드 3개 이상 또는 가드+힐 합산 3개 이상 모였을 때 발동. 사망 아군 1인 HP 10% 부활 (사망 아군 부재 시 생존 아군 전원 체력 50% 즉시 회복 및 해로운 상태이상 일괄 정화)": {
    en: "🩸🕊️ [Resurrection Surge]: Triggered with 3+ GUARD or 3+ GUARD+HEAL total. Revives 1 fallen ally with 10% HP (or restores 50% HP and cleanses debuffs for all survivors if none fallen).",
    ja: "🩸🕊️【起死回生】: ガード3個以上またはガード＋ヒール合計3個以上で発動。死亡者1人をHP10%で蘇生（不在時は生存者全員HP50%回復＆デバフ全浄化）。"
  },
  "⚡💥 [질풍노도]: 크리티컬 3개 이상 또는 크리티컬 2개 + 엑스트라 2개. 궁극기 위력 1.4배 + 방어력 50% 관통 + 확정 치명타 + 치명타 피해 +30% 증폭": {
    en: "⚡💥 [Tempest Rush]: 3+ CRIT or 2+ CRIT + 2+ EXTRA. Ultimate power x1.4, 50% DEF Piercing, Guaranteed Crit, and +30% Crit DMG.",
    ja: "⚡💥【疾風怒濤】: クリティカル3個以上またはクリティカル2個＋エクストラ2個。究極技威力1.4倍＋防御力50%貫通＋確定会心＋会心ダメージ+30%増幅。"
  },
  "🗡️ [베기] 검 계열: 기본 공격 적중 시 대상에게 1턴간 [출혈](최대 체력의 8% 피해) 상태이상을 부여합니다. 출혈 연계 스킬과 조합 시 막강한 시너지를 냅니다.": {
    en: "🗡️ [Slash] Swords: Basic attacks inflict [Bleed] (8% Max HP DMG) for 1 turn. Combines with Bleed-synergy skills for lethal combos.",
    ja: "🗡️【斬撃】剣系: 基本攻撃命中時、対象に1ターンの【出血】（最大HPの8%ダメージ）を付与。出血連動スキルとの強力なシナジーを発揮。"
  },
  "🔱 [방어 파쇄] 창 계열: 기본 공격 시 적의 보호막(Shield)에 50%의 추가 피해를 입힙니다. 단단한 쉴드를 두른 몬스터와 보스의 방호벽을 순식간에 분쇄합니다.": {
    en: "🔱 [Armor Shatter] Spears: Basic attacks deal +50% extra DMG against Shields, instantly demolishing fortified barriers.",
    ja: "🔱【防壁粉砕】槍系: 基本攻撃時、敵のシールドへ+50%の追加ダメージを与え、強固な防壁を瞬時に破壊します。"
  },
  "⚡ [암습] 단검 계열: 기본 공격 시 대상보다 속도가 빠를수록 피해량이 최대 20%까지 비례 증폭됩니다.": {
    en: "⚡ [Ambush] Daggers: Basic attack damage scales up to +20% based on Speed advantage over the target.",
    ja: "⚡【暗襲】短剣系: 基本攻撃時、対象より速度が速いほどダメージが最大20%まで比例増幅されます。"
  },

  // =========================================================================
  // 8. Infrastructure, Upkeep & Supply Guides
  // =========================================================================
  "🎒 심연 탐험 위험도(Hazard) & 일반·상급 전술 보급품 14종": {
    en: "🎒 Abyssal Exploration Hazard & 14 Standard/Advanced Tactical Supplies",
    ja: "🎒 深淵探検の危険度（Hazard）＆一般・上級戦術補給品14種"
  },
  "탐험 진행 시 위험도가 상승하며, 7종의 기본 전술 보급품과 병기창 Lv.6에서 해금되는 7종의 상급 보급품을 활용해 위기를 돌파할 수 있습니다.": {
    en: "Exploration Hazard rises as you advance; overcome perils with 7 standard supplies and 7 advanced supplies unlocked at Armory Lv.6.",
    ja: "探検進行に伴い危険度が上昇。7種の基本補給品と兵器廠Lv.6で解禁される7種の上級補給品を駆使して危機を突破できます。"
  },
  "🍖 던전 식량 / 🍱 던전 도시락(상급): 모닥불 야영 시 소모하여 파티 전원의 HP/MP를 회복하고 굶주림 페널티를 예방합니다.": {
    en: "🍖 Dungeon Rations / 🍱 Bento (Adv): Consumed at campfires to restore party HP/MP and prevent starvation penalties.",
    ja: "🍖 ダンジョン食料 / 🍱 ダンジョン弁当（上級）: 焚き火野営時に消費し、全員のHP/MPを回復して飢餓ペナルティを防ぎます。"
  },
  "🔥 횃불 / 🔮 에테르 횃불(상급): 점화 시 3걸음 동안 마물 조우율(-10%/-20%) 및 야영 기습률(-10%/-20%)이 감소하고 오브젝트 발견율(+10%/+20%)이 증가하지만, 불빛에 마물이 반응하여 걸음당 위험도는 기본(+8)보다 빠르게 상승(일반 +16 / 에테르 +32)합니다.": {
    en: "🔥 Torch / 🔮 Ether Torch (Adv): Reduces monster encounter/ambush rates and boosts discovery for 3 steps, but light draws fiends, raising hazard faster (+16 / +32 vs base +8).",
    ja: "🔥 松明 / 🔮 エーテル松明（上級）: 点火時3歩の間、遭遇率・奇襲率が低下し発見率が上昇しますが、光に魔物が反応して歩行危険度が通常より早く上昇します（通常+16/エーテル+32）。"
  },
  "🩹 치유 붕대 / ✨ 성유 붕대(상급): 모닥불 야영 시 자동으로 1개 소모되어 생존 대원 전원의 8종 상태이상·디버프를 일괄 해제합니다 (성유 붕대는 추가로 3턴 상태이상 면역 부여).": {
    en: "🩹 Healing Bandage / ✨ Holy Salve Bandage (Adv): Auto-consumed at campfires to cleanse 8 debuffs from all surviving heroes (Holy Salve also grants 3-turn immunity).",
    ja: "🩹 治癒包帯 / ✨ 聖油包帯（上級）: 野営時に自動消費され全員の8大デバフを一括解除（聖油包帯は追加で3ターン状態異常免疫を付与）。"
  },
  "💧 정화의 성수 / 💧✨ 여신의 성수(상급): 타락한 제단 및 오염 오브젝트를 정화합니다 (정화의 성수: 전원 HP/MP 50% 회복 + 전체 디버프 해제 + 3턴 면역 + 30 에테르 / 여신의 성수: 전원 HP/MP 80% 회복 + 전체 디버프 해제 + 3턴 면역 + 50 에테르).": {
    en: "💧 Holy Water / 💧✨ Goddess Water (Adv): Purifies defiled altars (Holy Water: 50% HP/MP + cleanse + 3-turn immunity + 30 Ether / Goddess Water: 80% HP/MP + cleanse + 3-turn immunity + 50 Ether).",
    ja: "💧 浄化の聖水 / 💧✨ 女神の聖水（上級）: 堕落した祭壇や汚染物を浄化（浄化の聖水: HP/MP50%回復＋全デバフ解除＋3ターン免疫＋30エーテル／女神の聖水: 80%回復＋免疫＋50エーテル）。"
  },
  "⛏️ 곡괭이 / 💎 미스릴 곡괭이(상급): 함몰된 낙석 통로 개척 및 광맥에서 대량의 광물·마력 수정·마도석을 채굴합니다.": {
    en: "⛏️ Pickaxe / 💎 Mithril Pickaxe (Adv): Clears rockfall blockages and mines large quantities of ore, mana crystals, and sorcery stones from veins.",
    ja: "⛏️ つるはし / 💎 ミスリルつるはし（上級）: 落石通路を開削し、鉱脈から大量の鉱石・魔力水晶・魔導石を採掘します。"
  },
  "🗝️ 던전 열쇠 / 🗝️✨ 마스터 키(상급): 잠긴 고대 보물 상자와 비밀 석관을 안전하게 개방하여 고급 장비와 희귀 유물을 획득합니다.": {
    en: "🗝️ Dungeon Key / 🗝️✨ Master Key (Adv): Safely unlocks ancient chests and secret sarcophagi for high-tier equipment and relics.",
    ja: "🗝️ ダンジョン鍵 / 🗝️✨ マスターキー（上級）: 施錠された古代の宝箱や秘密の石棺を安全に開錠し、高級装備や遺物を獲得します。"
  },
  "⚓ 균열의 닻 / ⚓✨ 심연의 닻(상급): 던전 어디서든 성채로 즉시 귀환합니다 (일반 균열의 닻은 차원 불안정으로 귀환 시 35%/고위험 시 55% 확률로 배낭 슬롯 1칸이 유실될 수 있으나, 상급 심연의 닻은 유실 확률 0%로 100% 완벽 보존 귀환합니다).": {
    en: "⚓ Rift Anchor / ⚓✨ Abyssal Anchor (Adv): Return instantly to Citadel from anywhere (Standard anchor risks losing 1 backpack slot by 35%/55%, Abyssal Anchor guarantees 100% loss-free safe return).",
    ja: "⚓ 亀裂のアンカー / ⚓✨ 深淵のアンカー（上級）: どこからでも城塞へ即時帰還（通常アンカーは35%〜55%で荷物1枠紛失リスクあり、上級アンカーは紛失率0%で100%完全帰還）。"
  },
  "🥩 대량 배급제 (심연 생체 정제소 Lv.5): 전 시설 식량 유지비 30% 일괄 감면 (Lv.7+ 시설은 35% 감면) 및 식량 증산": {
    en: "🥩 Mass Rationing (Bio-Refinery Lv.5): Reduces food upkeep by 30% across all facilities (35% for Lv.7+) and boosts production.",
    ja: "🥩 大量配給制（生体精製所 Lv.5）: 全施設の食料維持費を30%一括軽減（Lv.7+は35%軽減）および食料増産。"
  },
  "⚖️ 상인 네트워크 (황혼의 블랙 마켓 Lv.5): 전 시설 골드 유지비 25% 일괄 감면, 최대 골드 적재량 2배 확장 (기본 10만G → 20만G) 및 마켓 Lv.5+ 증축 석재 비용 30% 감축 (유지비 지불 주기는 마켓 Lv.1부터 레벨당 +1초씩 연장)": {
    en: "⚖️ Merchant Network (Black Market Lv.5): Reduces Gold upkeep by 25%, doubles max gold storage (100k → 200k), cuts Lv.5+ stone upgrade costs by 30%, and extends payment cycle by +1s per level.",
    ja: "⚖️ 商人ネットワーク（ブラックマーケット Lv.5）: 全施設ゴールド維持費25%軽減、ゴールド最大積載量2倍拡張（10万G→20万G）＆石材コスト30%削減（支払い周期+1秒/Lv）。"
  },
  "🧪 에테르 환류관 (에테르 연금 공방 Lv.6): 마도 시설(병기창·제단·게이트) 에테르 유지비 25% 일괄 감면": {
    en: "🧪 Ether Reflux (Alchemy Workshop Lv.6): Reduces Ether upkeep by 25% across magic facilities (Armory, Altar, Gate).",
    ja: "🧪 エーテル還流管（錬金工房 Lv.6）: 魔導施設（兵器廠・祭壇・ゲート）のエーテル維持費を25%一括軽減。"
  },
  "시설 레벨에 따라 정기 유지비가 발생하며, 체납 시 레벨이 일시 하향되나 자원 재확보 시 즉시 자동 복구됩니다.": {
    en: "Facilities incur regular upkeep by level. Delinquency temporarily reduces facility level, but recovering resources restores it automatically.",
    ja: "施設レベルに応じて定期維持費が発生。滞納時は一時的にレベル低下しますが、資源再確保時に即座に自動復旧します。"
  },
  "방주 중앙 병참고(storage): 전 레벨(Lv.1~10) 유지비 완전 면제": {
    en: "Ark Central Storage: Completely maintenance-free across all levels (Lv.1-10).",
    ja: "方舟中央兵站庫（storage）: 全レベル（Lv.1〜10）維持費完全免除。"
  },
  "Lv.1 ~ Lv.3: 초기 개척 지원으로 모든 시설 유지비 완전 무료": {
    en: "Lv.1 - Lv.3: All facility maintenance is completely free to support initial colonization.",
    ja: "Lv.1〜Lv.3: 初期開拓支援として全施設の維持費が完全無料。"
  },
  "체납 시 자동 휴면 & 복구: 유지비가 부족하면 시설이 일시 휴면(레벨 다운 또는 일시 정지) 상태가 되지만 영구 증축 레벨(maxLevel)은 보존되어 자원 재확보 시 즉시 복구됩니다.": {
    en: "Auto Dormancy & Recovery: Lacking upkeep puts facilities into dormancy, but permanent max level is preserved and restored upon acquiring resources.",
    ja: "滞納時の自動休眠＆復旧: 維持費不足時は一時休眠状態になりますが、恒久増築レベルは保持され資源確保時に即時復旧します。"
  }
};

const outPath = 'scripts/i18n/out/delta_018.json';
fs.writeFileSync(outPath, JSON.stringify(delta018, null, 2), 'utf8');
console.log(`Generated delta_018.json with ${Object.keys(delta018).length} entries.`);
