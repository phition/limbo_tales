# -*- coding: utf-8 -*-
import json
import os
import re

# Base paths
ROOT = 'I:/workshop/newProjectVive'
OUT_DIR = os.path.join(ROOT, 'scripts/i18n/out')
os.makedirs(OUT_DIR, exist_ok=True)

# Translation mappings dictionary
TRANSLATIONS = {
  # === 1. Navigation, Drawers & UI Labels ===
  "유지비 체납": {"en": "Upkeep Delinquent", "ja": "維持費滞納"},
  "시설 복구": {"en": "Restore Facility", "ja": "施設復旧"},
  "퀘스트 보상 수령": {"en": "Claim Quest Rewards", "ja": "クエスト報酬受取"},
  "진동 피드백 (햅틱)": {"en": "Vibration Feedback (Haptic)", "ja": "振動フィードバック（触覚）"},
  "진동 켜짐 (ON)": {"en": "Vibration ON", "ja": "振動 ON"},
  "진동 꺼짐 (OFF)": {"en": "Vibration OFF", "ja": "振動 OFF"},
  "${claimableQuestCount}건 완료": {"en": "${claimableQuestCount} Completed", "ja": "${claimableQuestCount}件完了"},
  "{0}건 완료": {"en": "{0} Completed", "ja": "{0}件完了"},
  "침묵의 회랑 1~5층 MUD 던전 출격 및 전술 보급품 편성": {"en": "Silent Corridor 1-5F MUD dungeon sortie & tactical supplies", "ja": "沈黙の回廊 1〜5階 MUDダンジョン出撃＆戦術補給品編成"},
  "출격 가능": {"en": "Ready for Sortie", "ja": "出撃可能"},
  "${state.infirmaryPatients.length}인": {"en": "${state.infirmaryPatients.length} Heroes", "ja": "${state.infirmaryPatients.length}人"},
  "{0}인": {"en": "{0} Heroes", "ja": "{0}人"},
  "${state.cemetery.length}위": {"en": "#${state.cemetery.length}", "ja": "${state.cemetery.length}位"},
  "{0}위": {"en": "#{0}", "ja": "{0}位"},
  "차원 아레나 & 게이트": {"en": "Dimensional Arena & Gate", "ja": "次元アリーナ＆ゲート"},
  "차원 아레나 결투 및 네메시스 침공전": {"en": "Dimensional Arena Duels & Nemesis Invasions", "ja": "次元アリーナ決闘＆ネメシス侵攻戦"},
  "지름길": {"en": "Shortcut", "ja": "ショートカット"},
  "(시설 진입 휠에서 등록한 빠른 바로가기)": {"en": "(Quick shortcut registered from facility entry wheel)", "ja": "（施設進入ホイールで登録したクイックショートカット）"},
  "3인 원정대 파티 편성, 출격 대원 교체 및 진형 배치를 관리합니다.": {"en": "Manage 3-hero expedition party, roster rotation, and formations.", "ja": "3人遠征隊パーティ編成、出撃隊員の入替および陣形配置を管理します。"},
  "전투 중 전사한 영령들의 묘비 안치 현황 및 영령의 가호·추모 버프를 확인합니다.": {"en": "Check memorials of fallen heroes, ancestral blessings, and memorial buffs.", "ja": "戦死した英霊の墓標安置状況および英霊の加護・追悼バフを確認します。"},
  "${state.party.length}/3인 편성": {"en": "${state.party.length}/3 Assigned", "ja": "${state.party.length}/3人編成"},
  "{0}/3인 편성": {"en": "{0}/3 Assigned", "ja": "{0}/3人編成"},
  "안치자 없음": {"en": "No Memorials", "ja": "安置者なし"},
  "${cemeteryCount}위 안치": {"en": "${cemeteryCount} Memorialized", "ja": "${cemeteryCount}柱安置"},
  "{0}위 안치": {"en": "{0} Memorialized", "ja": "{0}柱安置"},
  "대원 교체 & 진형 배치": {"en": "Roster Swap & Formation", "ja": "隊員入替＆陣形配置"},
  "전사 영령 안치 & 추모": {"en": "Hero Memorial & Tribute", "ja": "戦死英霊安置＆追悼"},
  "거점 바로가기": {"en": "Citadel Shortcut", "ja": "拠点ショートカット"},
  "시설 건설 필요": {"en": "Construction Required", "ja": "施設建設が必要"},
  "바로가기": {"en": "Shortcut", "ja": "ショートカット"},
  "우선 나머지 생산 시설 건설을 완료해 주십시오.": {"en": "Please complete constructing remaining production facilities first.", "ja": "先に残りの生産施設の建設を完了してください。"},
  "목표 시설 [${tutorialRestriction.target.targetName}] 건설로 이동": {"en": "Go to target facility [${tutorialRestriction.target.targetName}] construction", "ja": "目標施設【${tutorialRestriction.target.targetName}】の建設へ移動"},
  "목표 시설 [{0}] 건설로 이동": {"en": "Go to target facility [{0}] construction", "ja": "目標施設【{0}】の建設へ移動"},
  "현재 Lv.${selectedBuildingData.level}": {"en": "Current Lv.${selectedBuildingData.level}", "ja": "現在 Lv.${selectedBuildingData.level}"},
  "현재 Lv.{0}": {"en": "Current Lv.{0}", "ja": "現在 Lv.{0}"},
  "사령부 지름길 슬롯": {"en": "Command Shortcut Slot", "ja": "司令部ショートカットスロット"},
  "(사령부 패널 지름길 배너로 표시)": {"en": "(Displayed as Command Panel shortcut banner)", "ja": "（司令部パネルのショートカットバナーに表示）"},
  "현재 카드": {"en": "Current Card", "ja": "現在のカード"},
  "{0} 카드로 휠 이동": {"en": "Rotate wheel to {0} card", "ja": "{0}カードへホイール移動"},
  "✓ 현재 선택": {"en": "✓ Currently Selected", "ja": "✓ 現在選択中"},
  "클릭 시 이동": {"en": "Click to Navigate", "ja": "クリックで移動"},
  "현재 표시된 [{0}] 카드로 저장": {"en": "Save currently displayed [{0}] card", "ja": "現在表示中の【{0}】カードに保存"},
  "슬롯 비우기": {"en": "Clear Slot", "ja": "スロットを空ける"},
  "현재 표시된 [{0}] 카드를 #{1} 슬롯에 저장": {"en": "Save displayed [{0}] card to Slot #{1}", "ja": "表示中の【{0}】カードをスロット#{1}に保存"},
  "빈 슬롯": {"en": "Empty Slot", "ja": "空きスロット"},
  "현재 카드 저장": {"en": "Save Current Card", "ja": "現在のカードを保存"},
  "최근": {"en": "Recent", "ja": "最近"},
  "클릭하여 로그 접기": {"en": "Click to collapse log", "ja": "クリックしてログを折りたたむ"},
  "클릭하여 전체 로그 펼치기": {"en": "Click to expand full log", "ja": "クリックして全ログを展開"},
  "최근 로그": {"en": "Recent Log", "ja": "最新ログ"},
  "클릭하여 이전 화면으로 돌아가기": {"en": "Click to return to previous screen", "ja": "クリックして前の画面に戻る"},
  "돌아가기 (창 닫기)": {"en": "Return (Close)", "ja": "戻る（閉じる）"},
  "확인 완료": {"en": "Confirmed", "ja": "確認完了"},
  "최대 MP": {"en": "Max MP", "ja": "最大MP"},
  "기록됨 ✓": {"en": "Recorded ✓", "ja": "記録済み ✓"},
  "행운(치명타)": {"en": "LUCK (Crit)", "ja": "幸運（会心）"},
  "※ 방주 성채로 귀환 시 즉시 착용 및 강화/인챈트 가능": {"en": "※ Can be equipped, enhanced, or enchanted upon returning to Citadel.", "ja": "※ 方舟城塞への帰還時に即時着用および強化/エンチャント可能"},
  "터치하여 결투 바로 시작": {"en": "Tap to start duel immediately", "ja": "タップして決闘を即時開始"},
  "상자 개봉 무구 획득 확인": {"en": "Open Chest Equipment Confirmation", "ja": "宝箱開封・武具獲得確認"},
  "명예 암시장 무구 구매 확인": {"en": "Honor Black Market Purchase Confirmation", "ja": "名誉闇市場・武具購入確認"},
  "영지 로그 및 장비함 등록 완료": {"en": "Territory log & armory registration complete", "ja": "領地ログおよび装備箱への登録完了"},
  "차원의 상자 속에서 미지의 무구가 출현했습니다!": {"en": "An unknown weapon emerged from the dimensional chest!", "ja": "次元の宝箱から未知の武具が出現しました！"},
  "차원 투사의 무구가 성채 장비함으로 인도되었습니다.": {"en": "Dimensional Fighter's gear transferred to Citadel armory.", "ja": "次元闘士の武具が城塞の装備箱へ送られました。"},

  # === 2. Battle Screen, Combat Text, Combos & VFX ===
  "⚰️ 완전 사망": {"en": "⚰️ Permanent Death", "ja": "⚰️ 完全死亡"},
  "⚡ 전자기 기절": {"en": "⚡ EMP Stun", "ja": "⚡ 電磁気絶"},
  "약점이 노출된 적의 급소를 정확히 저격하여 60% 추가 처형 피해를 꽂아넣었습니다!": {
    "en": "Targeted the exposed weak point with precision, inflicting +60% execution damage!",
    "ja": "弱点が露出した急所を的確に狙撃し、+60%の追加処刑ダメージを与えました！"
  },
  "출혈 중인 상처에서 피의 마력을 강탈하여 아군 전체의 체력을 즉시 회복시켰습니다!": {
    "en": "Siphoned blood mana from bleeding wounds, immediately healing all allies!",
    "ja": "出血中の傷口から血の魔力を強奪し、味方全体のHPを即座に回復しました！"
  },
  "🩸 [피의 흡혈 공명] 아군 전체 체력 +${healVal} 즉시 치유!": {
    "en": "🩸 [Blood Siphon Resonance] Restored +${healVal} HP to all allies!",
    "ja": "🩸【吸血の血脈共鳴】味方全員のHPを +${healVal} 即時回復！"
  },
  "🩸 [피의 흡혈 공명] 아군 전체 체력 +{0} 즉시 치유!": {
    "en": "🩸 [Blood Siphon Resonance] Restored +{0} HP to all allies!",
    "ja": "🩸【吸血の血脈共鳴】味方全員のHPを +{0} 即時回復！"
  },
  "👥 [그림자 은신] ${attacker.name}이(가) 1턴간 은신(회피율 +60%) 태세에 돌입했습니다!": {
    "en": "👥 [Shadow Stealth] ${attacker.name} entered stealth (+60% Evasion) for 1 turn!",
    "ja": "👥【影の隠密】${attacker.name}が1ターンの間、隠密（回避率+60%）の態勢に入りました！"
  },
  "👥 [그림자 은신] {0}이(가) 1턴간 은신(회피율 +60%) 태세에 돌입했습니다!": {
    "en": "👥 [Shadow Stealth] {0} entered stealth (+60% Evasion) for 1 turn!",
    "ja": "👥【影の隠密】{0}が1ターンの間、隠密（回避率+60%）の態勢に入りました！"
  },
  "단죄 35% 추가 피해 & 아군 전체 치유/마나": {
    "en": "Judgment: +35% Extra DMG & Ally Heal/Mana",
    "ja": "断罪: +35%追加ダメージ＆味方全体回復/マナ"
  },
  "공격 약화 상태의 적에게 신성 일격 적중 시 35% 신성 추가 피해 및 아군 전원 HP(시전자 공격력의 25%) 치유 + MP 10 회복": {
    "en": "Hitting ATK-weakened enemies with Holy Strike deals +35% Holy DMG, heals all allies for 25% of ATK, and restores 10 MP.",
    "ja": "攻撃弱化状態の敵に神聖攻撃を命中させると、+35%の神聖追加ダメージを与え、味方全体のHP（攻撃力の25%）を回復＋MPを10回復。"
  },
  "약점 저격 +60% 추가 처형 피해": {
    "en": "Weak Point Snipe: +60% Execution DMG",
    "ja": "弱点狙撃: +60%追加処刑ダメージ"
  },
  "실명·표적 또는 출혈·방어 약화 상태의 적을 저격/관통으로 타격 시 노출된 급소를 꿰뚫어 +60% 추가 처형 피해를 입힙니다.": {
    "en": "Piercing/sniping enemies with Blind, Targeted, Bleed, or DEF Down strikes vitals for +60% execution DMG.",
    "ja": "盲目・標的または出血・防御弱化状態の敵を狙撃/貫通で攻撃時、露出した急所を射抜いて+60%の追加処刑ダメージを与えます。"
  },
  "+35% 암흑 피해 & 아군 전체 체력 즉시 치유": {
    "en": "+35% Dark DMG & Immediate Party Heal",
    "ja": "+35%暗黒ダメージ＆味方全体HP即時回復"
  },
  "출혈 중인 적의 상처에서 피의 마력을 강탈하여 35% 암흑 추가 피해를 입히고 추가 피해의 30%만큼 아군 전원 HP를 즉시 치유(흡혈 공명)합니다.": {
    "en": "Siphons blood mana from bleeding foes, dealing +35% Dark DMG and healing all allies for 30% of the damage (Vampiric Resonance).",
    "ja": "出血中の敵から血の魔力を奪い、+35%の暗黒追加ダメージを与え、その30%分味方全員のHPを回復（吸血共鳴）します。"
  },
  "실명/표적/출혈/방어약화": {"en": "Blind/Mark/Bleed/DEF-Down", "ja": "盲目/標的/出血/防御弱化"},
  "💧✨ [여신의 성수 공양] 성상 축성 (전원 HP 80% / MP 80% 회복 + 모든 디버프 해제 + 3턴간 디버프 면역 + ✨에테르 +50)": {
    "en": "💧✨ [Goddess Holy Water Offering] Consecrate Statue (All HP 80% / MP 80% restored + cleanse all debuffs + 3-turn debuff immunity + ✨50 Ether)",
    "ja": "💧✨【女神の聖水供養】像の聖別（全員HP80%/MP80%回復＋全デバフ解除＋3ターンデバフ免疫＋✨エーテル+50）"
  },
  "💧✨ [여신의 성수 축성 대성공] 여신의 성수로 성상을 축성하여 생존 대원 전원 HP 80% / MP 80% 회복, 모든 디버프 해제, 3턴간 [상태이상 면역] 부여 및 ✨ 에테르 +50 획득!": {
    "en": "💧✨ [Goddess Holy Water Success] Consecrated statue! Restored 80% HP/MP to all surviving heroes, cleansed all debuffs, granted 3-turn [Status Immunity], and gained ✨50 Ether!",
    "ja": "💧✨【女神の聖水聖別大成功】女神の聖水で聖像を清め、生存隊員全員のHP80%/MP80%回復、全デバフ解除、3ターンの【状態異常免疫】付与および✨エーテル+50を獲得！"
  },
  "⚡ 16대 상태이상 스킬 연계(Combo) 메커니즘": {
    "en": "⚡ 16 Status Effect Skill Combo Mechanics",
    "ja": "⚡ 16大状態異常スキル連携（Combo）メカニズム"
  },
  "적에게 특정 상태이상이 걸려 있을 때, 일치하는 고유 태그(강타, 베기, 관통, 마법, 원소, 신성, 저격, 암흑 등) 스킬로 공격하면 16종의 강력한 연계 콤보가 폭발합니다.": {
    "en": "Striking afflicted enemies with matching skill tags (Strike, Slash, Pierce, Magic, Elemental, Holy, Snipe, Dark) detonates 16 devastating combo synergies.",
    "ja": "敵が特定状態異常の際、対応する固有タグ（強打、斬撃、貫通、魔法、元素、神聖、狙撃、暗黒等）スキルで攻撃すると16種の強力な連携コンボが炸裂します。"
  },
  "❄️💥 [빙결 분쇄]: 빙결/기절 상태의 적에게 [강타/베기] 적중 시 45% 광역 얼음 파편 폭풍 피해": {
    "en": "❄️💥 [Ice Shatter]: Hitting Frozen/Stunned targets with [Strike/Slash] inflicts 45% AOE ice shrapnel damage.",
    "ja": "❄️💥【凍結粉砕】: 凍結/気絶状態の敵に【強打/斬撃】命中時、45%の広域氷破片嵐ダメージ。"
  },
  "🩸💥 [과출혈 기폭]: 출혈 상태의 적에게 [베기/관통/저격] 적중 시 누적 출혈 즉발 폭발 및 2턴간 공격력 -25% 감소": {
    "en": "🩸💥 [Hemorrhage Burst]: Hitting Bleeding targets with [Slash/Pierce/Snipe] detonates bleeds and reduces ATK by 25% for 2 turns.",
    "ja": "🩸💥【過出血起爆】: 出血状態の敵に【斬撃/貫通/狙撃】命中時、累積出血が即時爆発＆2ターン攻撃力-25%減少。"
  },
  "☣️💥 [독성 기화 폭발]: 중독 상태의 적에게 [마법/원소] 적중 시 최대 HP 12% 독성 폭발 및 적 전체 맹독 전이": {
    "en": "☣️💥 [Toxic Vaporize]: Hitting Poisoned targets with [Magic/Elemental] triggers a 12% Max HP toxic burst and spreads deadly poison.",
    "ja": "☣️💥【毒性気化爆発】: 中毒状態の敵に【魔法/元素】命中時、最大HP12%の毒爆発＆敵全体へ猛毒拡散。"
  },
  "🛡️💔 [자세 붕괴]: 방어 약화 상태의 적에게 [강타/방패 파쇄] 적중 시 1턴 기절 부여 및 차징 브레이크 150 파쇄": {
    "en": "🛡️💔 [Stance Break]: Hitting DEF-Weakened targets with [Strike/Shield Bash] inflicts 1-turn Stun and breaks 150 Charge Gauge.",
    "ja": "🛡️💔【体勢崩壊】: 防御弱化の敵に【強打/盾粉砕】命中時、1ターン気絶を付与＆チャージブレイク150粉砕。"
  },
  "✨⚖️ [신성 정벌]: 공격 약화 상태의 적에게 [신성] 일격 적중 시 +35% 신성 추가 피해 및 아군 전원 HP(공격력의 25%) 치유 + MP 10 회복": {
    "en": "✨⚖️ [Divine Crusade]: Hitting ATK-Weakened targets with [Holy] deals +35% Holy DMG, heals all allies for 25% of ATK, and restores 10 MP.",
    "ja": "✨⚖️【神聖征伐】: 攻撃弱化の敵に【神聖】命中時、+35%神聖追加ダメージ＆味方全体HP（攻撃力25%）回復＋MP10回復。"
  },
  "🔥🌪️ [화염 폭풍]: 화상 상태의 적에게 [폭풍] 공격 적중 시 45% 화염 소용돌이 폭발 및 적 전체 화상 확산": {
    "en": "🔥🌪️ [Firestorm]: Hitting Burning targets with [Tempest] deals 45% fire vortex damage and spreads Burn to all foes.",
    "ja": "🔥🌪️【火炎嵐】: 火傷状態の敵に【嵐】攻撃命中時、45%の火炎渦爆発＆敵全体へ火傷拡散。"
  },
  "⚡❄️ [초전도 감전]: 빙결/기절 상태의 적에게 [뇌격/마법] 적중 시 2턴간 방어력 -50% 분쇄 및 40% 연쇄 전격 피해": {
    "en": "⚡❄️ [Superconduct Shock]: Hitting Frozen/Stunned targets with [Lightning/Magic] shreds DEF by 50% for 2 turns and deals 40% chain lightning.",
    "ja": "⚡❄️【超電導感電】: 凍結/気絶の敵に【雷撃/魔法】命中時、2ターン防御力-50%粉砕＆40%の連鎖雷撃ダメージ。"
  },
  "🎯🩸 [급소 처형 낙인]: 실명/표적(또는 출혈/방어약화) 상태의 적에게 [저격/관통] 적중 시 +60% 추가 처형 피해": {
    "en": "🎯🩸 [Execution Brand]: Hitting Blind/Marked/Bleeding/DEF-Down targets with [Snipe/Pierce] inflicts +60% execution damage.",
    "ja": "🎯🩸【急所処刑烙印】: 盲目/標的/出血/防御弱化の敵に【狙撃/貫通】命中時、+60%の追加処刑ダメージ。"
  },
  "🔮🩸 [암흑 피의 섭취]: 출혈/맹독 상태의 적에게 [흡혈/암흑] 적중 시 +35% 암흑 추가 피해 및 추가 피해의 30%만큼 아군 전체 체력 즉시 치유": {
    "en": "🔮🩸 [Dark Blood Consumption]: Hitting Bleeding/Poisoned targets with [Lifesteal/Dark] deals +35% Dark DMG and heals all allies for 30% of damage dealt.",
    "ja": "🔮🩸【暗黒吸血摂取】: 出血/猛毒の敵に【吸血/暗黒】命中時、+35%暗黒追加ダメージ＆与ダメ30%分味方全体HP即時回復。"
  },
  "☀️🔥 [성염 융화]: 화상 상태의 적에게 [신성] 적중 시 +40% 신성 화염 폭발 및 아군 전체 디버프 1종 정화": {
    "en": "☀️🔥 [Holy Flame Fusion]: Hitting Burning targets with [Holy] deals +40% Holy-Fire burst DMG and cleanses 1 debuff from all allies.",
    "ja": "☀️🔥【聖炎融合】: 火傷の敵に【神聖】命中時、+40%の神聖火炎爆発＆味方全体のデバフを1種浄化。"
  },
  "⚡🩸 [신경 마비 충격]: 출혈 상태의 적에게 [뇌격] 적중 시 +35% 전격 피해 및 2턴간 행동 속도(SPD) 30% 감속": {
    "en": "⚡🩸 [Neuro-Paralysis Shock]: Hitting Bleeding targets with [Lightning] deals +35% lightning DMG and reduces SPD by 30% for 2 turns.",
    "ja": "⚡🩸【神経麻痺衝撃】: 出血の敵に【雷撃】命中時、+35%雷撃ダメージ＆2ターン行動速度（SPD）30%低下。"
  },
  "🌩️🌪️ [뇌폭 폭풍]: 기절 상태의 적에게 [폭풍] 적중 시 적 전체에 공격력 35% 광역 뇌풍 충격파": {
    "en": "🌩️🌪️ [Thunderstorm]: Hitting Stunned targets with [Tempest] deals 35% ATK shockwave damage to all enemies.",
    "ja": "🌩️🌪️【雷爆暴風】: 気絶の敵に【嵐】命中時、敵全体へ攻撃力35%の広域雷嵐衝撃波。"
  },
  "🧪🛡️ [산성 외골격 융해]: 중독 상태의 적에게 [강타/방패 파쇄] 적중 시 +40% 산성 파쇄 피해 및 2턴간 방어력 35% 약화": {
    "en": "🧪🛡️ [Acidic Carapace Melt]: Hitting Poisoned targets with [Strike/Shield Bash] deals +40% acid damage and weakens DEF by 35% for 2 turns.",
    "ja": "🧪🛡️【酸性外骨格融解】: 中毒の敵に【強打/盾粉砕】命中時、+40%の酸性破砕ダメージ＆2ターン防御力35%弱化。"
  },
  "🌑🗡️ [그림자 처형 기습]: 실명/기절 상태의 적에게 [암흑/베기] 적중 시 +50% 암영 참격 피해 및 시전자 1턴간 은신(회피율 +60%) 돌입": {
    "en": "🌑🗡️ [Shadow Execution]: Hitting Blind/Stunned targets with [Dark/Slash] deals +50% shadow slash DMG and grants caster 1 turn of Stealth (+60% Evasion).",
    "ja": "🌑🗡️【影の処刑奇襲】: 盲目/気絶の敵に【暗黒/斬撃】命中時、+50%暗影斬撃ダメージ＆術者が1ターン隠密（回避率+60%）突入。"
  },
  "💀🔮 [영혼 분리 흡수]: 공격 약화/방어 약화 상태의 적에게 [암흑/흡혈] 적중 시 +35% 영혼 침식 피해 및 시전자 MP 15 흡수 회복": {
    "en": "💀🔮 [Soul Sever Siphon]: Hitting ATK/DEF-Weakened targets with [Dark/Lifesteal] deals +35% soul DMG and restores 15 MP to the caster.",
    "ja": "💀🔮【魂魄分離吸収】: 攻撃弱化/防御弱化の敵に【暗黒/吸血】命中時、+35%魂侵食ダメージ＆術者MP15吸収回復。"
  },
  "🔥💥 [열압력 열폭]: 화상 상태의 적에게 [강타/마법] 적중 시 +45% 열압력 폭발 피해 및 차징 브레이크 게이지 100 추가 파쇄": {
    "en": "🔥💥 [Thermal Pressure Blast]: Hitting Burning targets with [Strike/Magic] deals +45% blast damage and breaks an additional 100 Charge Gauge.",
    "ja": "🔥💥【熱圧力熱爆】: 火傷の敵に【強打/魔法】命中時、+45%熱圧力爆発ダメージ＆チャージブレイクゲージ100追加粉砕。"
  },

  # === 3. 2nd Awakening Class Ultimates (Awakening Skills) ===
  "🛡️ 이지스 발키리: [궁극기] 천공의 수호방벽 — 아군 전체에 280% 신성 보호막을 치고 3턴간 피격 피해 30% 감소": {
    "en": "🛡️ Aegis Valkyrie: [Ultimate] Sky Bulwark — Grants 280% Holy Shield to all allies and reduces damage taken by 30% for 3 turns.",
    "ja": "🛡️ イージス・ヴァルキリー: 【究極技】天空の守護防壁 — 味方全体に280%の神聖シールドを展開し、3ターン被ダメージ30%軽減。"
  },
  "🗡️ 영혼의 검성: [궁극기] 비검 만화경 — 적 전체에 220% 광역 쾌검 난무를 펼치고 2턴간 환영 반격 태세 돌입": {
    "en": "🗡️ Soul Blade Master: [Ultimate] Kaleidoscope Sword — Strikes all foes for 220% AOE rapid slashes and enters Phantom Counter for 2 turns.",
    "ja": "🗡️ 魂の剣聖: 【究極技】飛剣万華鏡 — 敵全体に220%の広域乱舞を繰り出し、2ターン幻影反撃態勢へ突入。"
  },
  "☄️ 아크 메이지: [궁극기] 종말의 메테오 — 거대 천체 유성 낙하로 적 전체에 253% 파멸 마법 피해 및 화상 부여": {
    "en": "☄️ Archmage: [Ultimate] Doomsday Meteor — Summons a celestial meteor dealing 253% catastrophic magic DMG to all foes and inflicting Burn.",
    "ja": "☄️ アークメイジ: 【究極技】終末のメテオ — 巨大隕石を落下させ、敵全体に253%の破滅魔法ダメージ＆火傷付与。"
  },
  "⏳ 시공의 조율사: [궁극기] 크로노 판타즈마 — 적 전체에 180% 시공 붕괴 피해 및 1턴간 행동 정지, 아군 전체 스킬 쿨타임 1턴 단축": {
    "en": "⏳ Chronomancer: [Ultimate] Chrono Phantasma — Deals 180% space-time collapse DMG to all foes, freezes action for 1 turn, and reduces all ally cooldowns by 1 turn.",
    "ja": "⏳ 時空の調律師: 【究極技】クロノ・ファンタズマ — 敵全体に180%の時空崩壊ダメージ＆1ターン行動停止、味方全体のクールダウン1ターン短縮。"
  },
  "🕊️ 성령의 구원자: [궁극기] 부활의 성가 — 사망 아군을 58% 체력으로 부활시키고 생존 아군 전원 HP 288% 대량 치유": {
    "en": "🕊️ Holy Spirit Savior: [Ultimate] Resurrection Hymn — Revives a fallen ally with 58% HP and massively heals all surviving allies for 288% HP.",
    "ja": "🕊️ 聖霊の救済者: 【究極技】復活の聖歌 — 死亡した仲間をHP58%で蘇生し、生存中の味方全員のHPを288%大量回復。"
  },
  "⚖️ 성전의 심판관: [궁극기] 단죄의 성십자 — 적 전체에 210% 신성 심판 피해를 가하고 가한 피해의 40%만큼 아군 전체 체력 치유": {
    "en": "⚖️ Crusade Arbiter: [Ultimate] Cross of Condemnation — Deals 210% Holy Judgment damage to all foes and heals all allies for 40% of damage dealt.",
    "ja": "⚖️ 聖戦の審判官: 【究極技】断罪の聖十字 — 敵全体に210%の神聖審判ダメージを与え、与えたダメージの40%分味方全体HPを回復。"
  },
  "🌋 발할라 블레이드: [궁극기] 불멸의 결전분노 — 잃은 체력 비례 최대 450% 적 전체 행성 파괴급 일격": {
    "en": "🌋 Valhalla Blade: [Ultimate] Immortal Battle Rage — Unleashes a planetary-strike dealing up to 450% damage scaling with missing HP.",
    "ja": "🌋 ヴァルハラ・ブレード: 【究極技】不滅の決戦憤怒 — 喪失HPに比例し最大450%の敵全体惑星破壊級の一撃。"
  },
  "🚩 철혈의 패황: [궁극기] 패왕의 진격령 — 적 전체에 230% 파쇄 일격을 가하고 아군 전체 공격력·속도 +35% 고양(3턴)": {
    "en": "🚩 Ironblood Overlord: [Ultimate] Sovereign's Advance — Strikes all foes for 230% crushing damage and inspires all allies with +35% ATK/SPD for 3 turns.",
    "ja": "🚩 鉄血の覇皇: 【究極技】覇王の進撃令 — 敵全体に230%の破砕一撃を与え、味方全体の攻撃力・速度+35%鼓舞（3ターン）。"
  },
  "⚡ 하이퍼 레인저: [궁극기] 궤도 에테르 버스터 — 방주 위성 융합 빔 폭격으로 적 전체에 240% 방어 관통 포격": {
    "en": "⚡ Hyper Ranger: [Ultimate] Orbital Ether Buster — Fires an orbital satellite fusion beam dealing 240% DEF-piercing bombardment to all enemies.",
    "ja": "⚡ ハイパー・レンジャー: 【究極技】軌道エーテルバスター — 方舟衛星融合ビーム砲撃で敵全体に240%の防御貫通攻撃。"
  },
  "💥 사신 저격수: [궁극기] 종말의 탄환 (갓 킬러) — 후열 저격으로 방어력을 100% 관통하는 280% 치명 일격 (체력 40% 이하 처형)": {
    "en": "💥 Death Sniper: [Ultimate] Doomsday Bullet (God Killer) — Backline snipe dealing 280% Crit DMG ignoring 100% DEF (executes targets below 40% HP).",
    "ja": "💥 死神狙撃手: 【究極技】終末の弾丸（ゴッドキラー） — 後衛狙撃で防御力を100%貫通する280%会心一撃（HP40%以下即時処刑）。"
  },

  # === 4. Avici 11F, End Game & Mechanics ===
  "10층 보스를 토벌하거나 10층 심연 포탈을 발견하면 영구 개방되는 최고난도 엔드 컨텐츠입니다 (10층 광폭화 보스가 드랍하는 [👑 심연 군주의 옥새]는 10티어 신화 장비 정화 및 퀘스트 핵심 유물).": {
    "en": "Highest-tier endgame content unlocked permanently upon defeating the 10F boss or finding the 10F Portal. (10F Enraged Boss drops the [👑 Abyss Lord's Seal], an essential relic for Tier 10 mythic equipment purification).",
    "ja": "10階ボス討伐またはポータル発見で永久解禁される最高難易度エンドコンテンツ。（10階狂暴化ボスが落とす【👑 深淵君主の玉璽】はT10神話装備浄化とクエストの核心遺物）。"
  },
  "최대 위험도 10,000: 1~10층의 정예 마물들이 무간도 변이 스탯으로 출현하며, 11층 고유 이벤트 [🪞 무간도의 검은 거울]에서 도플갱어 미러전이 등장합니다.": {
    "en": "Max Hazard 10,000: Elite fiends from 1-10F appear with Avici mutant stats, and the unique 11F event [🪞 Avici Black Mirror] triggers a Doppelganger mirror duel.",
    "ja": "最大危険度10,000: 1〜10階の精鋭魔物が無間道変異ステータスで出現。11階固有イベント【🪞 無間道の黒鏡】ではドッペルゲンガーとのミラー戦が展開。"
  },
  "레벨 스케일링: 마물 시작 Lv.40에서 출발하여 심연 위험도에 비례해 최대 Lv.499까지 지속적으로 상승합니다.": {
    "en": "Level Scaling: Fiends start at Lv.40 and scale continuously up to Lv.499 based on Abyssal Hazard.",
    "ja": "レベルスケーリング: 魔物はLv.40から開始し、深淵危険度に比例して最大Lv.499まで継続的に上昇します。"
  },
  "보스 출현 주기: 각 계층(1,000 위험도)마다 X350, X700 구간에서 중간 보스가 출현(처치 시 생존 파티원 HP/MP 50% 회복)하며, X000 구간마다 계층 수호 보스가 강림합니다.": {
    "en": "Boss Interval: Mid-bosses appear at X350 and X700 of each 1,000-hazard tier (restores 50% HP/MP on kill), and Floor Guardians descend at X000.",
    "ja": "ボス出現周期: 1,000危険度階層ごとにX350、X700で中ボス出現（撃破時HP/MP50%回復）、X000で階層守護ボスが降臨します。"
  },
  "진 최종 보스 아르케오스: 위험도 10,000 도달 시 강림하며, 토벌 후 광폭화 보스 격파 시 최종 심연 봉인 엔딩을 달성합니다.": {
    "en": "True Final Boss Archeos: Descends at Hazard 10,000; defeating the subsequent Enraged Boss achieves the True Abyssal Seal Ending.",
    "ja": "真・最終ボス アルケオス: 危険度10,000到達時に降臨。討伐後の狂暴化ボス撃破で最終深淵封印エンディングに到達します。"
  },
  "후열 저격: 후열 적 타격 시 피해 +20% 증폭 및 치명타 확률 +20%p 가산, 시전자가 후열에 배치되어 있을 때 소모 마나의 35% 즉시 환급": {
    "en": "Backline Snipe: Hitting backline foes amplifies DMG by +20% with +20% Crit Rate; if the caster is in the backline, refunds 35% of MP cost.",
    "ja": "後衛狙撃: 後衛の敵攻撃時にダメージ+20%増幅＆会心率+20%加算。術者が後衛配置の場合は消費マナの35%を即時還元。"
  },
  "🛡️ 상태이상 완전 저항 (마물 50% / 아군 최대 80%): 피격자의 행운에 비례하여 빙결, 기절, 실명, 출혈, 맹독, 화상 및 디버프를 무효화합니다 (적 마물 저항 상한: min(50%, 행운 × 0.35%) / 아군 영웅은 장비 상태이상 저항 합산 시 최대 80%까지 적용, 실명 빗나감 상쇄는 아군 영웅 전용).": {
    "en": "🛡️ Status Immunity (Fiends 50% / Allies up to 80%): Nullifies freeze, stun, blind, bleed, poison, burn, and debuffs scaled with LUCK. (Fiend cap: min(50%, LUK × 0.35%); Allies reach up to 80% with gear; blind miss counter is ally-exclusive).",
    "ja": "🛡️ 状態異常完全抵抗（魔物50%/味方最大80%）: 幸運に比例して凍結、気絶、盲目、出血、猛毒、火傷、デバフを無効化（魔物上限50%、味方は装備合算で最大80%まで適用）。"
  },

  # === 5. Assist Attacks, Frontline Cover & Bonds ===
  "🤝 원호 공격 & 전열 수호 엄호 분담 피해 (Assist & Guard Mechanism)": {
    "en": "🤝 Assist Attacks & Frontline Cover Mechanism",
    "ja": "🤝 援護攻撃＆前衛守護援護ダメージ分担メカニズム"
  },
  "전열 수호 엄호는 중·후열 아군의 피격 피해를 50% 분담하여 대신 처리하며, 유대(Lv.2+) 및 직업군 시너지로 강력한 후방 원호 타격을 발동합니다.": {
    "en": "Frontline Cover absorbs 50% of damage dealt to mid/backline allies, while Bonds (Lv.2+) and synergies trigger powerful rear assist strikes.",
    "ja": "前衛守護援護は中・後衛の被ダメージを50%肩代わりし、絆（Lv.2+）やシナジーによって強力な後方援護攻撃を発動します。"
  },
  "🛡️ 전열 수호 엄호 (Frontline Cover): 중·후열 아군 피격 시 발동된 시너지의 전열 엄호 확률(25%~50%, 3차 이지스 바스티온은 상시 100%)에 따라 생존한 전열 영웅이 개입하여 피해를 50% 경감시키고, 분담받은 50%의 피해를 전열 영웅 자신이 직접 입은 피해로 정밀 계산하여 처리": {
    "en": "🛡️ Frontline Cover: When mid/backline allies take damage, surviving frontline heroes intercept with a 25-50% chance (100% for Aegis Bastion), mitigating 50% damage and absorbing it directly.",
    "ja": "🛡️ 前衛守護援護: 中・後衛被弾時、シナジー確率（25%〜50%、3次イージスは常時100%）で前衛が生還介入し、ダメージを50%軽減して自身が肩代わり計算。"
  },
  "🤝 유대 원호 공격 (Bond 60+ / Lv.2): 유대 60(Lv.2 전술적 호흡) 이상인 동료와 함께 출전 시 기본 공격 후 25% 확률로 개입하여 적에게 강력한 원호 타격 (공격력 80% + 치명타 독립 판정)": {
    "en": "🤝 Bond Assist Attack (Bond 60+ / Lv.2): When deployed alongside companions with Bond 60+, basic attacks have a 25% chance to trigger an assist strike (80% ATK + independent Crit roll).",
    "ja": "🤝 絆援護攻撃（絆60+/Lv.2）: 絆60以上の仲間と共に出撃時、基本攻撃後に25%確率で介入し強力な援護攻撃（攻撃力80%＋独立会心判定）。"
  },
  "🔫 거너 원호 사격: 거너 시너지 활성 시 30% 확률로 지원 사격 발동 (총탄 VFX)": {
    "en": "🔫 Gunner Assist Fire: Gunner synergy grants a 30% chance to trigger supporting gunfire (bullet VFX).",
    "ja": "🔫 ガンナー援護射撃: ガンナーシナジー発動時、30%確率で支援射撃を発動（銃弾VFX）。"
  },
  "⚔️ 근접/마도 추가 연격: 암영/비전 시너지 활성 시 25% 확률로 참격/번개 원호 타격 발동": {
    "en": "⚔️ Melee/Arcane Follow-up: Shadow/Arcane synergy grants a 25% chance to trigger slash or lightning assist strikes.",
    "ja": "⚔️ 近接/魔導追加連撃: 暗影/秘術シナジー発動時、25%確率で斬撃/雷撃の援護攻撃を発動。"
  },
  "화면 컷인 오버레이: 발동 시 화면을 가로지르는 고유 테마 컷인 배너(★ ASSIST ATTACK ★, 🛡️ 수호 엄호! 🛡️) 및 VFX 연출 출력": {
    "en": "Cut-in Overlay: Displays unique thematic cut-in banners (★ ASSIST ATTACK ★, 🛡️ COVER! 🛡️) and dynamic VFX on trigger.",
    "ja": "カットイン演出: 発動時に画面を横切る固有テーマカットインバナー（★ ASSIST ATTACK ★、🛡️ 守護援護！ 🛡️）およびVFXを出力。"
  },
  "함께 출정하고 캠프에서 담소를 나누면 유대 수치가 상승하여 강력한 결속 효과를 얻습니다 (상위 유대 달성 시 기본 스탯 보너스는 상위 단계 수치로 교체됩니다).": {
    "en": "Sortieing together and chatting at camps raises Bonds, unlocking formidable solidarity perks. (Higher tiers replace previous stat bonuses).",
    "ja": "共に出撃しキャンプで歓談すると絆が上昇し強力な結束効果を獲得。（上位達成時、ステータス補正は上位値に置き換わります）。"
  },
  "Lv.2 (Bond 60): 전술적 호흡 — 일반 공격 시 25% 확률로 유대 동료의 원호 공격(Assist Attack, 공격력 80%)": {
    "en": "Lv.2 (Bond 60): Tactical Accord — Basic attacks have a 25% chance to trigger companion Assist Attacks (80% ATK).",
    "ja": "Lv.2（絆60）: 戦術的呼吸 — 通常攻撃時、25%確率で絆仲間の援護攻撃（攻撃力80%）が発動。"
  },
  "Lv.3 (Bond 90): 굳건한 신뢰 — 행운 +8 (치명타/회피/상태이상 저항 보정) & 아군 빈사(HP 25% 이하) 시 [수호의 결속] 50 HP 보호막 전개": {
    "en": "Lv.3 (Bond 90): Firm Trust — LUK +8 (boosts Crit/Evasion/Resist) & deploys a 50 HP [Guardian Bond] shield when an ally drops below 25% HP.",
    "ja": "Lv.3（絆90）: 堅固な信頼 — 幸運+8（会心/回避/抵抗補正）＆仲間瀕死（HP25%以下）時に【守護の結束】50 HPシールド展開。"
  },
  "Lv.4 (Bond 120): 사선의 맹세 — 치명상 피격 시 1회 체력 1로 생존 (불굴) & HP/MP/SPD +10% (Lv.1 스탯 보너스 교체)": {
    "en": "Lv.4 (Bond 120): Oath of the Brink — Survive lethal damage once with 1 HP (Tenacity) & HP/MP/SPD +10% (replaces Lv.1 bonus).",
    "ja": "Lv.4（絆120）: 死線の誓い — 致命傷時に1度だけHP1で耐える（不屈）＆HP/MP/SPD+10%（Lv.1補正と置換）。"
  },
  "Lv.5 (Bond 150): 영혼의 결속 — 전투 시작 시 유대 150 달성자 마나(MP) 30% 회복 (전원 최대 유대 시 50% 회복) & 공/방 +15% (상위 스탯 보너스 교체)": {
    "en": "Lv.5 (Bond 150): Soul Bond — Start battles with +30% MP (+50% if all party members at max bond) & ATK/DEF +15% (replaces previous bonus).",
    "ja": "Lv.5（絆150）: 魂の結束 — 戦闘開始時にMP30%回復（全員最大時は50%回復）＆攻防+15%（上位補正と置換）。"
  },

  # === 6. Forging, Purification, Cemetery & Economy ===
  "⚒️ 단조 스탯 편차(±8% × 등급 배율) & [침식된 장비] 정화 의식": {
    "en": "⚒️ Forging Variance (±8% × Quality) & [Eroded Gear] Purification",
    "ja": "⚒️ 鍛造ステータス偏差（±8%×品質倍率）＆【侵食装備】浄化の儀式"
  },
  "단조 시 기본 스탯 ±8%(92%~108%) 편차에 장비 등급 배율(일반 1.0x, 희귀 1.3x, 영웅 1.6x, 전설 2.0x, 고유 2.5x)이 곱해져 최종 스탯이 결정됩니다.": {
    "en": "Final crafted stats are calculated by multiplying base ±8% variance (92-108%) with quality multipliers (Common 1.0x, Rare 1.3x, Epic 1.6x, Legendary 2.0x, Unique 2.5x).",
    "ja": "鍛造時の基本ステ±8%（92%〜108%）偏差に装備品質倍率（一般1.0x、希少1.3x、英雄1.6x、伝説2.0x、固有2.5x）が乗算され最終値が決定。"
  },
  "침식된 장비 정화 성공 확률: 던전에서 획득한 오염 장비는 병기창에서 정화할 수 있으며, 성공 확률은 기본 30% + (병기창 레벨 × 5%)로 Lv.1(35%) ~ Lv.10(최대 80%)까지 상승합니다.": {
    "en": "Eroded Gear Purification: Purify dungeon-dropped corrupted gear at the Armory. Success rate starts at 30% + (Armory Lv × 5%), ranging from Lv.1 (35%) to Lv.10 (80%).",
    "ja": "侵食装備の浄化成功率: ダンジョンで得た汚染装備は兵器廠で浄化可能。成功率は基本30%＋（兵器廠Lv×5%）で、Lv.1（35%）〜Lv.10（最大80%）まで上昇。"
  },
  "에테르 연금 공방에서는 어떤 기능을 제공하나요?": {
    "en": "What functions does the Ether Alchemy Workshop provide?",
    "ja": "エーテル錬金工房ではどのような機能が提供されますか？"
  },
  "에테르 연금 공방은 15초마다 마도 에테르를 정기 생산하며, 용병이 습득한 스킬의 위력을 강화하는 [습득 스킬 강화](강화당 위력 +12%, 소모 MP +12%)와 장비에 접두/접미 마도석을 각인하는 [마도 인챈트](공방 Lv.3 해금, 성공 확률 기본 20% ~ Lv.10 최대 34%)를 전담합니다. 마도서는 던전 탐험, 퀘스트 보상 및 황혼의 블랙 마켓에서 획득할 수 있습니다.": {
    "en": "The Workshop produces Ether every 15s, upgrades acquired skills (+12% power, +12% MP cost per level), and applies prefix/suffix Sorcery Enchants (Lv.3 unlock, 20% to 34% success). Grimoires are obtained from dungeons, quests, and the Black Market.",
    "ja": "工房は15秒ごとにエーテルを生産し、【習得スキル強化】（威力+12%、消費MP+12%/Lv）と装備への【魔導エンチャント】（Lv.3解禁、成功率20%〜最大34%）を担当。魔導書は探検やクエスト、闇市場で獲得できます。"
  },
  "침식된(저주받은) 장비 드랍과 정화 확률은 어떻게 되나요?": {
    "en": "How do eroded (cursed) equipment drops and purification rates work?",
    "ja": "侵食（呪われた）装備のドロップと浄化確率はどうなっていますか？"
  },
  "던전 전 층(1~11층)에서 드랍되는 장비는 심연의 독기에 오염된 [침식된] 상태로 획득됩니다. 성채 병기창의 정화 탭에서 정화를 시도할 수 있으며, 정화 성공 확률은 기본 30% + (병기창 레벨 × 5%)로 적용되어 Lv.1(35%)부터 Lv.10(최대 80%)까지 상승합니다. 또한 정화 진행 시 컷인 연출과 실제 성공/파괴 판정 결과는 100% 일치합니다.": {
    "en": "All equipment dropped across 1-11F arrives in an [Eroded] state polluted by abyssal miasma. Purify them at the Armory with a 30% + (Armory Lv × 5%) success rate (35% at Lv.1 up to 80% at Lv.10). Cutscenes perfectly match actual success or destruction outcomes.",
    "ja": "1〜11階でドロップする装備は全て【侵食された】状態で獲得。兵器廠で浄化でき、成功率は基本30%＋（Lv×5%）でLv.1（35%）からLv.10（最大80%）まで上昇。演出と判定結果は完全に一致します。"
  },
  "방주 중앙 병참고(전 레벨 유지비 면제)를 제외한 영지 시설은 Lv.4부터 골드/식량/에테르 유지비가 차감됩니다. 유지비가 체납되면 해당 시설이 자동으로 가동 중단(일시 정지)되거나 단계가 일시 하향되므로 벌채소/시추소/안식처/정제소 생산량을 균형 있게 성장시키세요.": {
    "en": "Except Central Storage, facilities incur Gold/Food/Ether upkeep starting at Lv.4. Delinquency halts or downgrades facilities, so maintain balanced resource production.",
    "ja": "中央兵站庫を除き、施設はLv.4から維持費が発生。滞納時は自動停止または一時降格となるため、伐採所・採掘所・安息所・精製所を均等に発展させてください。"
  },
  "전사한 영웅이 남긴 단 1점의 [유품(Memento)]을 성채 보관함으로 회수하고, 묘지 헌화(광고 시청 무료)로 전투 경험치 버프와 촉매 충전권을 얻으며, 30종 전 클래스 영령의 가호를 결속하여 다음 원정 1회 동안 강력한 시너지를 누리는 계승 시스템입니다.": {
    "en": "Recover a single [Memento] from fallen heroes, offer flowers at the cemetery (free via ads) for EXP buffs and catalyst charges, and bind blessings from 30 classes for the next sortie.",
    "ja": "戦死者の【遺品（Memento）】を1点回収し、墓参り（広告視聴無料）でEXPバフや触媒補充を獲得。30クラス全英霊の加護を結束して次回の遠征を有利に進める継承システムです。"
  },
  "유품 무구 1점 회수: 결사대원이 사경 카운트다운 소진 또는 전멸로 전사하여 묘지에 안장될 때, 착용 중이던 장비 중 무작위 단 1점만 영혼이 깃든 [유품(Memento)]으로 성채 보관함에 회수되며, 나머지 착용 장비는 심연에 유실(영구 소멸)됩니다.": {
    "en": "One Memento Recovered: When a hero dies and is interred, only a single random equipped item is preserved as a soul-imbued [Memento] in storage; all other equipped gear is lost forever.",
    "ja": "遺品1点回収: 隊員が死境カウント切れ等で埋葬される際、装備中の無作為1点のみが【遺品（Memento）】として回収され、残りは深淵で永久消失します。"
  },
  "성채 묘지 헌화 (전체 추모): 광고 시청(무료)으로 안장된 영웅들을 추모하면 5분(300초)간 안장 인원에 비례해 전투 획득 경험치 +10% ~ +30%(1인 +10%, 추가 1인당 +5% 가산) 가호와 함께 [심연 촉매 슬롯 1회 충전권]을 즉시 지급받습니다.": {
    "en": "Cemetery Flower Tribute: Offering tribute (free via ads) grants +10% to +30% combat EXP based on memorialized heroes (+10% for 1st, +5% each additional) for 5 mins, plus an [Abyssal Catalyst Charge].",
    "ja": "城塞墓地献花（全体追悼）: 広告視聴（無料）で英雄を追悼すると、5分間（300秒）埋葬人数に応じて戦闘EXP+10%〜+30%の加護と【触媒1回充電券】を獲得。"
  },
  "30개 전 클래스 영령의 가호: 기본(Tier 0) 및 1차·2차·3차 초월 클래스를 포함한 30종 전 클래스에 특화된 고유 시너지가 존재합니다 (방어, 재생, 보호막, 치명타, 방어 관통, 흡혈, 마나 회복 등).": {
    "en": "30 Ancestral Blessings: All 30 classes across Tier 0 to Tier 3 feature specialized synergies (Defense, Regen, Shields, Crit, Armor Piercing, Lifesteal, MP recovery).",
    "ja": "30クラス全英霊の加護: T0からT3超越クラスまでの全30クラスに特化した固有シナジーが存在（防御、再生、シールド、会心、貫通、吸血、マナ回復等）。"
  },
  "장비 & 마도 라인: 심연의 병기창 ➔ 첫 장비 단조 ➔ 에테르 연금 공방(습득 스킬 강화 & 마도 인챈트) ➔ 황혼의 블랙 마켓으로 이어지는 제작 및 무역 테크": {
    "en": "Equipment & Sorcery Tech: Armory ➔ First Craft ➔ Alchemy Workshop (Skill Boosts & Enchants) ➔ Twilight Black Market crafting and trade tree.",
    "ja": "装備＆魔導ルート: 深淵の兵器廠 ➔ 初鍛造 ➔ エーテル錬金工房（スキル強化＆エンチャ）➔ 黄昏のブラックマーケットへ続く製作・貿易技術。"
  },
  "의료 & 영혼 승격 라인: 생체 복원 병동 완공 ➔ 영혼의 제단 해금(Lv.1/5/8) ➔ [원정단 편성]에서 상위 클래스 전직으로 이어지는 부대원 육성 및 승격 테크": {
    "en": "Medical & Soul Ascension Tech: Bio-Restoration Ward ➔ Soul Altar (Lv.1/5/8) ➔ [Expedition Roster] class promotion development tree.",
    "ja": "医療＆霊魂昇格ルート: 生体復元病棟 ➔ 魂の祭壇解禁（Lv.1/5/8）➔【遠征団編成】での上位転職へと続く育成・昇格技術。"
  },
  "계단식 유지비: 방주 중앙 병참고(전 레벨 유지비 면제)를 제외한 모든 시설은 Lv.1~3 전면 무료(Tier 0), Lv.4~6 완만한 유지비(Tier 1), Lv.7~10 계단식 점증(Tier 2)으로 부과됩니다.": {
    "en": "Tiered Upkeep: Except Central Storage, facilities are completely free at Lv.1-3 (Tier 0), low upkeep at Lv.4-6 (Tier 1), and scaled upkeep at Lv.7-10 (Tier 2).",
    "ja": "段階的維持費: 中央兵站庫を除き、Lv.1〜3は完全無料（T0）、Lv.4〜6は緩やかな維持費（T1）、Lv.7〜10は段階的に増加（T2）します。"
  },
  "블랙 마켓 주기 연장: 마켓 Lv.1부터 기본 20초 주기에서 레벨당 +1초씩 연장되어 Lv.10 시 30초마다 유지비를 지불 (지출 빈도 완화).": {
    "en": "Market Interval Extension: Upkeep interval starts at 20s at Lv.1, adding +1s per level up to 30s at Lv.10, easing spending frequency.",
    "ja": "闇市場周期延長: マーケットLv.1の基本20秒からLvごとに+1秒延長され、Lv.10では30秒ごとに維持費支払い（支出頻度緩和）。"
  },
  "건설 자원 가중 규칙: 병원을 제외한 전 건물의 목재 외 강화 재료 전 구간 2.1배(병원은 Lv.7+ 증축부터 2.1배), 생존자 안식처(Lv.4+ 목재 2배, Lv.8+ 3배), 광맥시추소(Lv.5+ 목재 3배), 심연의 병기창(Lv.4+ 목재 2배, Lv.6+ 석재 2배, Lv.8+ 철제 3배), 영혼 제단(Lv.5+ 에테르 2배), 연금 공방(Lv.4+ 철광석 2배), 병참고(Lv.4+ 전 자원 2배), 병원(Lv.4+ 목재 1.5배, 철광석·에테르 2배), 블랙 마켓(전 구간 골드 2배, Lv.4+ 건설 자원 1.5배, Lv.5+ 증축부터 석재 30% 감축) 특수 밸런싱이 적용됩니다.": {
    "en": "Building Scaling Rules: Materials scaled 2.1x across buildings except infirmary (infirmary scaled 2.1x from Lv.7+), with specialized wood/stone/iron multipliers for cabins, quarries, armories, altars, workshops, and market stone reductions.",
    "ja": "建築資材スケーリング: 病院以外の全施設で木材以外の強化材2.1倍（病院はLv.7+から）、安息所・採掘所・兵器廠・祭壇等の各資材への特化倍率および市場の石材30%削減が適用。"
  },
  "병동 치료 식량: 생체 복원 병동에서 부상 용병 치료 시 1~3레벨은 틱당 식량 2, 4레벨부터는 고효율 집중 치료를 위해 틱당 식량 3(MP는 에테르 1)을 소모합니다.": {
    "en": "Ward Treatment Food: Healing wounded heroes costs 2 food per tick at Lv.1-3, and 3 food + 1 ether per tick from Lv.4+ for intensive care.",
    "ja": "病棟治療食料: 負傷兵治療時、Lv.1〜3は毎tick食料2、Lv.4以降は高効率集中治療のため食料3（MPはエーテル1）を消費します。"
  },
  "2. 초기 보급 & 비전서 전수: 신규 부임 시 지급되는 초기 자원(골드 250G, 목재 80개, 석재 100개, 식량 100개)과 초기 비전서 3종([강타], [응급처치], [화염 가르기] 각 2권)을 영웅에게 연독시키고, 전열(탱커), 중열(근접딜러), 후열(원거리/힐러)로 배치하여 진형 보너스를 챙기세요.": {
    "en": "2. Initial Supplies & Grimoires: Study initial resources (250G, 80 Wood, 100 Stone, 100 Food) and starter grimoires (Heavy Strike, First Aid, Flame Cleave x2 each), arranging front/mid/backlines for formation bonuses.",
    "ja": "2. 初期補給＆秘伝書伝承: 初期物資（250G、木80、石100、食料100）と初期秘伝書3種（強打、応急処置、火炎斬り各2冊）を習得させ、前中後衛の陣形ボーナスを確保。"
  },
  "6. 유지비 주의: 병참고(유지비 면제)를 제외한 시설 레벨 4부터는 골드/식량/에테르 유지비가 발생하므로, 기초 생산 시설이 탄탄해지기 전에는 무리한 고레벨 증축을 자제하세요.": {
    "en": "6. Upkeep Caution: Facilities incur Gold/Food/Ether upkeep starting at Lv.4 (except storage); avoid over-upgrading before securing reliable production.",
    "ja": "6. 維持費の注意: 兵站庫を除く施設はLv.4から維持費が発生するため、基礎生産が整う前の過度な高レベル増築は自制してください。"
  },
  "마도 인챈트 수행처 & 성공 확률: 인챈트는 [에테르 연금 공방(Lv.3+)]에서 수행하며(슬롯 해금은 병기창 Lv.3/5/7 연동), 성공 확률은 연금 공방 Lv.1~3 기본 20%, Lv.4부터 레벨당 +2%씩 증가하여 Lv.10 최대 34%(순수 마도석은 절반인 10%~17%)입니다. 실패 시 장비 파괴 페널티가 없습니다.": {
    "en": "Sorcery Enchants: Performed at Alchemy Workshop Lv.3+ (slots unlock via Armory Lv.3/5/7). Success rate starts at 20% (Lv.1-3), rising +2% per level up to 34% at Lv.10 (Pure stones are half: 10-17%). No gear destruction on failure.",
    "ja": "魔導エンチャント場所＆成功率: 錬金工房（Lv.3+）で実施（枠解放は兵器廠Lv.3/5/7）。成功率はLv.1〜3で20%、Lv.4以降+2%/LvでLv.10最大34%（純粋石は10〜17%）。失敗時破壊なし。"
  },
  "인챈트석 소모량: 장비 등급에 비례하여 소모 (일반: 2개, 희귀: 4개, 에픽: 6개, 고유: 8개, 전설: 10개 / 순수석 사용 시 1.5배). 접두/접미석은 오직 장비 인챈트에만 소모됩니다.": {
    "en": "Enchant Stone Cost: Scales with gear tier (Common 2, Rare 4, Epic 6, Unique 8, Legendary 10; 1.5x for Pure stones). Prefix/suffix stones are exclusively used for gear enchanting.",
    "ja": "エンチャント石消費量: 装備等級に比例（一般2、希少4、エピック6、固有8、伝説10／純粋石は1.5倍）。接頭/接尾石は装備エンチャント専用です。"
  },
  "💠 순수 마도석 파밍 및 사용처: 심연 10층 및 11층(무간도)에서 산출되는 핵심 마도 촉매입니다. 장비 및 스킬이 +7강 이상으로 강화될 때, 에픽 이상 등급의 장비를 강화하거나 인챈트할 때 필수 소모됩니다.": {
    "en": "💠 Pure Sorcery Stones: Key catalysts harvested from Abyss 10F and 11F (Avici). Required when enhancing gear or skills past +7, or when upgrading and enchanting Epic-tier or higher items.",
    "ja": "💠 純粋な魔導石: 深淵10階および11階（無間道）で産出する核心触媒。装備やスキルを+7以上へ強化、またはエピック以上の装備を強化・エンチャントする際に必須。"
  },
  "⏸️ 영지 시설 유지비 체납 자동 일시 정지 & 재가동 시스템": {
    "en": "⏸️ Territory Facility Upkeep Auto-Pause & Resume System",
    "ja": "⏸️ 領地施設維持費滞納による自動一時停止＆再稼働システム"
  },
  "유지비 자원이 고갈되어 체납이 발생하면 시설이 자동으로 가동 중단(일시 정지) 상태가 되며, 자원을 보충한 뒤 즉시 재가동할 수 있습니다.": {
    "en": "When upkeep resources run dry, affected facilities automatically enter a paused state and can be immediately resumed once resources are replenished.",
    "ja": "維持費が枯渇し滞納が発生すると施設は自動で稼働停止（一時停止）となり、資源補充後に即座に再稼働できます。"
  },
  "체납 시 자동 일시 정지: 정기 유지비 지불 주기에 식량, 골드, 에테르가 부족할 경우 해당 시설이 일시 정지(⏸️)되거나 단계가 일시 하향되어 추가 소모를 멈춥니다.": {
    "en": "Auto-Pause on Delinquency: Insufficient Food, Gold, or Ether during payment cycles pauses (⏸️) or temporarily downgrades facilities, halting drain.",
    "ja": "滞納時の自動停止: 支払い時に食料・ゴールド・エーテルが不足した場合、施設が一時停止（⏸️）または一時降格し消費を停止。"
  },
  "주점 정지 연계: 방랑자의 라운지(주점)가 정지 상태일 때는 신규 서브 퀘스트의 자동 갱신 및 신규 모험가 도착이 일시 중단됩니다.": {
    "en": "Tavern Pause Effect: While Wanderer's Lounge is paused, new subquest refreshes and new adventurer arrivals are temporarily suspended.",
    "ja": "酒場停止の連動: 放浪者のラウンジ（酒場）停止中は、新規サブクエストの自動更新および冒険者の来訪が一時中断。"
  },
  "진입 안내 및 즉시 재가동: 정지된 건물 클릭 시 안내 모달이 출력되며, 부족한 자원을 확보한 후 [▶️ 가동 재개 및 입장]으로 즉시 정상 복구할 수 있습니다.": {
    "en": "Prompt & Instant Resume: Clicking a paused facility displays an alert modal; secure needed resources and tap [▶️ Resume & Enter] to restore it.",
    "ja": "案内＆即時再稼働: 停止中の建物をクリックすると案内が表示され、不足資源を確保して【▶️ 再稼働して入場】で即座に復旧可能。"
  },
  "영구 레벨 보존: 유지비 부족으로 일시 하향되더라도 건물의 영구 증축 레벨(maxLevel)은 100% 보존되어 자원 확보 시 재건축 비용 없이 자동 복구됩니다.": {
    "en": "Permanent Level Preservation: Even if temporarily downgraded, a facility's permanent max level is preserved and restored without rebuilding costs.",
    "ja": "恒久レベル保持: 維持費不足で一時降格しても建物の恒久レベル（maxLevel）は100%保持され、資源確保時に再建費なしで自動復旧。"
  },

  # === 7. Specialized Equipment Items ===
  "ATK+24, SPD+7, LUK+7, 관통+30% [도적 특화] 기습 단도": {
    "en": "ATK+24, SPD+7, LUK+7, Piercing+30% [Rogue] Ambush Dagger",
    "ja": "ATK+24, SPD+7, LUK+7, 貫通+30% [盗賊特化] 奇襲短刀"
  },
  "ATK+40, SPD+11, LUK+11, HP+95, 관통+30% [도적 특화] 사신의 비도": {
    "en": "ATK+40, SPD+11, LUK+11, HP+95, Piercing+30% [Rogue] Reaper's Dagger",
    "ja": "ATK+40, SPD+11, LUK+11, HP+95, 貫通+30% [盗賊特化] 死神の飛刀"
  },
  "DEF+27, HP+150, ATK+6, 저항+10% [기사 특화] 결전 방패": {
    "en": "DEF+27, HP+150, ATK+6, RES+10% [Knight] Showdown Shield",
    "ja": "DEF+27, HP+150, ATK+6, 抵抗+10% [騎士特化] 決戦盾"
  },
  "DEF+46, HP+260, ATK+10, 저항+10% [기사 특화] 영광 판금갑": {
    "en": "DEF+46, HP+260, ATK+10, RES+10% [Knight] Glory Plate",
    "ja": "DEF+46, HP+260, ATK+10, 抵抗+10% [騎士特化] 栄光板金鎧"
  },
  "ATK+22, MP+90, DEF+6, 관통+30% [마법사 특화] 원소 완드": {
    "en": "ATK+22, MP+90, DEF+6, Piercing+30% [Mage] Elemental Wand",
    "ja": "ATK+22, MP+90, DEF+6, 貫通+30% [魔術師特化] 元素の杖"
  },
  "마법사 계열을 위해 가공된 에테르 완드. 마법 공격력과 최대 마나를 균형 있게 상승시킵니다. [투사 특성: 방어 관통 30% / 마력 공명]": {
    "en": "Ether wand crafted for Mage classes, balancing magical power and max mana. [Fighter: 30% DEF Piercing / Mana Resonance]",
    "ja": "魔術師系のために加工されたエーテル杖。魔法攻撃力と最大マナを均衡良く上昇。【闘士特性: 防御貫通30% / 魔力共鳴】"
  },
  "공격력 +10, 마나 +35": {"en": "ATK +10, MP +35", "ja": "攻撃力 +10, マナ +35"},
  "ATK+35, MP+160, DEF+10, LUK+7, 관통+30% [마법사 특화] 재앙 지팡이": {
    "en": "ATK+35, MP+160, DEF+10, LUK+7, Piercing+30% [Mage] Calamity Staff",
    "ja": "ATK+35, MP+160, DEF+10, LUK+7, 貫通+30% [魔術師特化] 災厄の大杖"
  },
  "광범위 마법 폭격에 필요한 압도적인 마력을 품은 마법사 계열의 결전 대지팡이. [투사 특성: 방어 관통 30% / 마력 공명]": {
    "en": "Supreme staff harboring immense mana for wide-area bombardment. [Fighter: 30% DEF Piercing / Mana Resonance]",
    "ja": "広範囲魔法爆撃に必要な圧倒的魔力を秘めた魔術師の決戦大杖。【闘士特性: 防御貫通30% / 魔力共鳴】"
  },
  "공격력 +22, 마나 +60": {"en": "ATK +22, MP +60", "ja": "攻撃力 +22, マナ +60"},
  "공격력 +14, 마나 +45, 행운 +6": {"en": "ATK +14, MP +45, LUK +6", "ja": "攻撃力 +14, マナ +45, 幸運 +6"},
  "DEF+16, HP+80, MP+110, 저항+10% [사제 특화] 축복 로브": {
    "en": "DEF+16, HP+80, MP+110, RES+10% [Cleric] Blessed Robe",
    "ja": "DEF+16, HP+80, MP+110, 抵抗+10% [司祭特化] 祝福のローブ"
  },
  "사제 계열의 숭고한 성의. 높은 생존력과 아군 치유를 위한 지속적인 마나 흐름을 제공합니다. [투사 특성: 저항 10%]": {
    "en": "Sacred vestment for Clerics, offering survivability and mana flow for party healing. [Fighter: +10% Resistance]",
    "ja": "司祭系の崇高な聖衣。高い生存力と味方治癒のための持続的なマナ循環を提供。【闘士特性: 抵抗+10%】"
  },
  "방어력 +8, HP +45, 마나 +30": {"en": "DEF +8, HP +45, MP +30", "ja": "防御力 +8, HP +45, マナ +30"},
  "ATK+32, DEF+12, HP+120, MP+140, 관통+30% [사제 특화] 기적 성홀": {
    "en": "ATK+32, DEF+12, HP+120, MP+140, Piercing+30% [Cleric] Miracle Scepter",
    "ja": "ATK+32, DEF+12, HP+120, MP+140, 貫通+30% [司祭特化] 奇跡の聖笏"
  },
  "파티원 전체의 생명력을 수호하고 기적의 치유를 베푸는 사제 계열 최고위 성홀. [투사 특성: 방어 관통 30% / 마력 공명]": {
    "en": "Supreme scepter bestowing miraculous healing and party protection. [Fighter: 30% DEF Piercing / Mana Resonance]",
    "ja": "仲間全体の生命を守護し奇跡の癒しをもたらす司祭最高位の聖笏。【闘士特性: 防御貫通30% / 魔力共鳴】"
  },
  "공격력 +14, 방어력 +10, 마나 +50": {"en": "ATK +14, DEF +10, MP +50", "ja": "攻撃力 +14, 防御力 +10, マナ +50"},
  "HP +90, 마나 +40": {"en": "HP +90, MP +40", "ja": "HP +90, マナ +40"},
  "ATK+26, HP+65, DEF+7, 관통+30% [전사 특화] 처형도끼": {
    "en": "ATK+26, HP+65, DEF+7, Piercing+30% [Warrior] Execution Axe",
    "ja": "ATK+26, HP+65, DEF+7, 貫通+30% [戦士特化] 処刑斧"
  },
  "전열에서 적진을 분쇄하는 전사 계열의 처형도끼. 강력한 타격과 생존 체력을 제공합니다. [투사 특성: 방어 관통 30%]": {
    "en": "Warrior execution axe designed to crush frontlines with immense strikes and HP. [Fighter: 30% DEF Piercing]",
    "ja": "前衛で敵陣を粉砕する戦士の処刑斧。強力な打撃と生存体力を提供。【闘士特性: 防御貫通30%】"
  },
  "공격력 +12, HP +40": {"en": "ATK +12, HP +40", "ja": "攻撃力 +12, HP +40"},
  "ATK+44, HP+130, DEF+12, LUK+7, 관통+30% [전사 특화] 학살검": {
    "en": "ATK+44, HP+130, DEF+12, LUK+7, Piercing+30% [Warrior] Slaughter Greatsword",
    "ja": "ATK+44, HP+130, DEF+12, LUK+7, 貫通+30% [戦士特化] 虐殺の大剣"
  },
  "피와 전투에 굶주린 전사 계열 최고위 결전 대검. 전열을 일격에 휩쓰는 광란의 공격력을 뿜어냅니다. [투사 특성: 방어 관통 30%]": {
    "en": "Bloodthirsty greatsword sweeping the battlefield with frenzied power. [Fighter: 30% DEF Piercing]",
    "ja": "血と戦いに飢えた戦士最高位の決戦大剣。前衛を一撃で薙ぎ払う狂乱の攻撃力。【闘士特性: 防御貫通30%】"
  },
  "공격력 +22, 행운 +7": {"en": "ATK +22, LUK +7", "ja": "攻撃力 +22, 幸運 +7"},
  "공격력 +12, HP +80, 속도 +3": {"en": "ATK +12, HP +80, SPD +3", "ja": "攻撃力 +12, HP +80, 速度 +3"},
  "ATK+20, SPD+5, LUK+5, MP+20, 관통+30% [마총사 특화] 전술 리볼버": {
    "en": "ATK+20, SPD+5, LUK+5, MP+20, Piercing+30% [Gunner] Tactical Revolver",
    "ja": "ATK+20, SPD+5, LUK+5, MP+20, 貫通+30% [銃士特化] 戦術リボルバー"
  },
  "마총사 계열의 전술 기동 사격용 리볼버. 빠른 연사력과 안정적인 치명타를 자랑합니다. [투사 특성: 방어 관통 30%]": {
    "en": "Tactical sidearm for Gunners, boasting high fire rate and steady Crits. [Fighter: 30% DEF Piercing]",
    "ja": "魔銃士の戦術機動射撃用リボルバー。素早い連射力と安定した会心を誇る。【闘士特性: 防御貫通30%】"
  },
  "공격력 +10, 속도 +4, 행운 +5": {"en": "ATK +10, SPD +4, LUK +5", "ja": "攻撃力 +10, 速度 +4, 幸運 +5"},
  "ATK+33, SPD+8, LUK+9, MP+35, 관통+30% [마총사 특화] 레일 버스터": {
    "en": "ATK+33, SPD+8, LUK+9, MP+35, Piercing+30% [Gunner] Rail Buster",
    "ja": "ATK+33, SPD+8, LUK+9, MP+35, 貫通+30% [銃士特化] レールバスター"
  },
  "고출력 에테르 레일을 형성하여 적의 방어선을 일격에 꿰뚫어버리는 마총사 계열의 결전 중화기. [투사 특성: 방어 관통 30%]": {
    "en": "High-output heavy rail weapon penetrating enemy lines in a single blast. [Fighter: 30% DEF Piercing]",
    "ja": "高出力エーテルレールを形成し、敵の防衛線を一撃で貫く決戦重火器。【闘士特性: 防御貫通30%】"
  },
  "공격력 +21, 속도 +6, 행운 +7": {"en": "ATK +21, SPD +6, LUK +7", "ja": "攻撃力 +21, 速度 +6, 幸運 +7"},
  "공격력 +14, 마나 +30, 행운 +7": {"en": "ATK +14, MP +30, LUK +7", "ja": "攻撃力 +14, マナ +30, 幸運 +7"},
  "차원 투기장에서 승리를 거듭한 지휘관에게 수여되는 결전 명검. [투사 특성: 방어 관통 30%]": {
    "en": "Celebrated blade awarded to commanders triumphant in the dimensional arena. [Fighter: 30% DEF Piercing]",
    "ja": "次元闘技場で勝利を重ねた指揮官に授与される決戦名剣。【闘士特性: 防御貫通30%】"
  },
  "공격력 +14, 속도 +5, 행운 +6": {"en": "ATK +14, SPD +5, LUK +6", "ja": "攻撃力 +14, 速度 +5, 幸運 +6"},
  "고열 에테르 탄환을 고속 연사하는 차원 아레나 제식 마총. [투사 특성: 방어 관통 30%]": {
    "en": "Arena service firearm rapidly discharging superheated ether rounds. [Fighter: 30% DEF Piercing]",
    "ja": "高熱エーテル弾を高速連射する次元アリーナ制式魔銃。【闘士特性: 防御貫通30%】"
  },
  "방어력 +16, HP +90": {"en": "DEF +16, HP +90", "ja": "防御力 +16, HP +90"},
  "차원 투기장에서 용맹을 증명한 투사에게 수여되는 펜던트. [투사 특성: 턴당 체력 재생 5%]": {
    "en": "Pendant bestowed upon warriors proving valor in the arena. [Fighter: +5% HP Regen/Turn]",
    "ja": "次元闘技場で勇気を示した闘士に授与されるペンダント。【闘士特性: 毎ターンHP再生+5%】"
  },
  "차원 투기장에서 승리를 거듭한 지휘관에게 수여되는 전설의 반지. [투사 특성: 턴당 체력 재생 5%]": {
    "en": "Legendary ring awarded to commanders triumphant in the arena. [Fighter: +5% HP Regen/Turn]",
    "ja": "次元闘技場で勝利を重ねた指揮官に授与される伝説の指輪。【闘士特性: 毎ターンHP再生+5%】"
  },
  "차원 게이트 10레벨의 극한을 뚫고 모든 차원을 평정한 절대 패왕의 신화 보관. [투사 패왕 특성: 관통 30% / 저항 10% / 체력 재생 5%]": {
    "en": "Mythic crown of the absolute sovereign who conquered Gate Lv.10 and unified all dimensions. [Overlord: 30% Piercing / 10% RES / 5% Regen]",
    "ja": "次元ゲート10の極限を超え全次元を平定した絶対覇王の神話宝冠。【覇王特性: 貫通30% / 抵抗10% / 再生5%】"
  },
  "HP+180, DEF+18, LUK+9, SPD+6, [투사] 재생+5%": {
    "en": "HP+180, DEF+18, LUK+9, SPD+6, [Fighter] Regen+5%",
    "ja": "HP+180, DEF+18, LUK+9, SPD+6, [闘士] 再生+5%"
  },
  "ATK+28, DEF+18, LUK+16, SPD+7, MP+50, [투사] 재생+5%": {
    "en": "ATK+28, DEF+18, LUK+16, SPD+7, MP+50, [Fighter] Regen+5%",
    "ja": "ATK+28, DEF+18, LUK+16, SPD+7, MP+50, [闘士] 再生+5%"
  },
  "ATK+75, DEF+60, CRIT+30%, SPD+14, HP+380, MP+160, 관통+30%, 저항+10%, 재생+5%": {
    "en": "ATK+75, DEF+60, CRIT+30%, SPD+14, HP+380, MP+160, Piercing+30%, RES+10%, Regen+5%",
    "ja": "ATK+75, DEF+60, CRIT+30%, SPD+14, HP+380, MP+160, 貫通+30%, 抵抗+10%, 再生+5%"
  },
  "공격력 +22, 속도 +6, 행운 +7": {"en": "ATK +22, SPD +6, LUK +7", "ja": "攻撃力 +22, 速度 +6, 幸運 +7"},
  "공격력 +14, 행운 +12": {"en": "ATK +14, LUK +12", "ja": "攻撃力 +14, 幸運 +12"}
}

# 1. Output delta_018.json
delta_path = os.path.join(OUT_DIR, 'delta_018.json')
with open(delta_path, 'w', encoding='utf-8') as f:
  json.dump(TRANSLATIONS, f, ensure_ascii=False, indent=2)

print(f"Generated delta_018.json with {len(TRANSLATIONS)} entries.")

# 2. Update ko-all.json
ko_all_path = os.path.join(ROOT, 'scripts/i18n/ko-all.json')
with open(ko_all_path, 'r', encoding='utf-8') as f:
  ko_all = json.load(f)

ko_set = set(ko_all)
added_count = 0
for k in TRANSLATIONS.keys():
  if k not in ko_set:
    ko_all.append(k)
    ko_set.add(k)
    added_count += 1

with open(ko_all_path, 'w', encoding='utf-8') as f:
  json.dump(ko_all, f, ensure_ascii=False, indent=2)

print(f"Added {added_count} new keys to ko-all.json")

# 3. Inject into translationDictionary.ts
dict_path = os.path.join(ROOT, 'src/i18n/translationDictionary.ts')
with open(dict_path, 'r', encoding='utf-8') as f:
  dict_content = f.read()

en_marker = '  },\n  ja: {'
en_idx = dict_content.find('  en: {')
ja_idx = dict_content.find('  ja: {')
en_sub = dict_content[en_idx:ja_idx]

en_entries = []
for k, v in TRANSLATIONS.items():
  key_str = json.dumps(k, ensure_ascii=False)
  if f"{key_str}:" not in en_sub:
    val_str = json.dumps(v['en'], ensure_ascii=False)
    en_entries.append(f"    {key_str}: {val_str},")

if en_entries:
  en_block = '\n'.join(en_entries) + '\n'
  dict_content = dict_content.replace(en_marker, en_block + en_marker, 1)

ja_marker = '  }};\n\n// ============================================================================\n// 2. DYNAMIC LOG PATTERNS'
ja_idx2 = dict_content.find('  ja: {')
ja_sub = dict_content[ja_idx2:]

ja_entries = []
for k, v in TRANSLATIONS.items():
  key_str = json.dumps(k, ensure_ascii=False)
  if f"{key_str}:" not in ja_sub:
    val_str = json.dumps(v['ja'], ensure_ascii=False)
    ja_entries.append(f"    {key_str}: {val_str},")

if ja_entries:
  ja_block = '\n'.join(ja_entries) + '\n'
  dict_content = dict_content.replace(ja_marker, ja_block + ja_marker, 1)

with open(dict_path, 'w', encoding='utf-8') as f:
  f.write(dict_content)

print(f"Injected {len(en_entries)} EN and {len(ja_entries)} JA entries into translationDictionary.ts")

# 4. Update generated/en.json and generated/ja.json
gen_en_path = os.path.join(ROOT, 'src/i18n/generated/en.json')
gen_ja_path = os.path.join(ROOT, 'src/i18n/generated/ja.json')

with open(gen_en_path, 'r', encoding='utf-8') as f:
  gen_en = json.load(f)
with open(gen_ja_path, 'r', encoding='utf-8') as f:
  gen_ja = json.load(f)

for k, v in TRANSLATIONS.items():
  gen_en[k] = v['en']
  gen_ja[k] = v['ja']

with open(gen_en_path, 'w', encoding='utf-8') as f:
  json.dump(gen_en, f, ensure_ascii=False, indent=2)
with open(gen_ja_path, 'w', encoding='utf-8') as f:
  json.dump(gen_ja, f, ensure_ascii=False, indent=2)

print(f"Updated generated/en.json ({len(gen_en)} keys) and generated/ja.json ({len(gen_ja)} keys)")
