// Complete generator for delta_018 covering all remaining strings
import fs from 'fs';
import path from 'path';

// Load base delta_018
const deltaPath = 'scripts/i18n/out/delta_018.json';
const delta = JSON.parse(fs.readFileSync(deltaPath, 'utf8'));

// Additional translations
const moreTranslations = {
  // === Equipment Subtypes ===
  "석궁": { en: "Crossbow", ja: "クロスボウ" },
  "스태프": { en: "Staff", ja: "スタッフ" },
  "마법봉": { en: "Wand", ja: "魔法の杖" },
  "대지팡이": { en: "Greatstaff", ja: "大杖" },
  "리볼버": { en: "Revolver", ja: "リボルバー" },
  "심판궁": { en: "Judgment Bow", ja: "審判の弓" },
  "결전궁": { en: "Decisive Bow", ja: "決戦の弓" },
  "비도": { en: "Throwing Knife", ja: "飛刀" },
  "나이프": { en: "Knife", ja: "ナイフ" },
  "암기": { en: "Concealed Weapon", ja: "暗器" },
  "카타나": { en: "Katana", ja: "刀" },
  "환도": { en: "Hwando", ja: "環刀" },
  "성검": { en: "Holy Sword", ja: "聖剣" },
  "처형검": { en: "Executioner Blade", ja: "処刑剣" },
  "영혼검": { en: "Soulblade", ja: "ソウルブレード" },
  "사령검": { en: "Necroblade", ja: "死霊の剣" },
  "학살검": { en: "Massacre Blade", ja: "虐殺の剣" },
  "태도": { en: "Nodachi", ja: "太刀" },
  "일본도": { en: "Katana", ja: "日本刀" },
  "목도": { en: "Wooden Sword", ja: "木刀" },
  "성봉": { en: "Holy Rod", ja: "聖棒" },
  "대도": { en: "Broadsword", ja: "大刀" },
  "행동 속도": { en: "Action Speed", ja: "行動速度" },
  "방어력 +12, HP +65": { en: "DEF +12, HP +65", ja: "防御力 +12, HP +65" },
  "방어력 +20, HP +110": { en: "DEF +20, HP +110", ja: "防御力 +20, HP +110" },
  "방어력 +14, HP +70, 공격력 +8": { en: "DEF +14, HP +70, ATK +8", ja: "防御力 +14, HP +70, 攻撃力 +8" },
  "공격력 +11, 속도 +4, 행운 +6": { en: "ATK +11, SPD +4, LUK +6", ja: "攻撃力 +11, 速度 +4, 幸運 +6" },
  "확인 완료": { en: "Confirmed", ja: "確認完了" },
  "최대 MP": { en: "Max MP", ja: "最大MP" },

  // === Dynamic template patterns ===
  "{0}건 완료": { en: "{0} Completed", ja: "{0}件完了" },
  "{0}인": { en: "{0} Heroes", ja: "{0}人" },
  "{0}위": { en: "#{0}", ja: "{0}位" },
  "{0}/3인 편성": { en: "{0}/3 Assigned", ja: "{0}/3人編成" },
  "{0}위 안치": { en: "{0} Memorialized", ja: "{0}柱安置" },
  "목표 시설 [{0}] 건설로 이동": { en: "Go to target facility [{0}] construction", ja: "目標施設【{0}】の建設へ移動" },
  "현재 Lv.{0}": { en: "Current Lv.{0}", ja: "現在 Lv.{0}" },
  "👑 3차초월 (1차EXP+{0}%)": { en: "👑 3rd Transcendence (T1 EXP +{0}%)", ja: "👑 3次超越（1次EXP+{0}%）" },
  "✨ 2차승격 (1차EXP+{0}%)": { en: "✨ 2nd Promotion (T1 EXP +{0}%)", ja: "✨ 2次昇格（1次EXP+{0}%）" },

  // === System Guides & Encyclopedia Data ===
  "1층 ~ 11층 무간도 및 차원 레이드 마물": {
    en: "1F to 11F Avici and Dimensional Raid Fiends",
    ja: "1階〜11階無間道および次元レイド魔物"
  },
  "에테르 연금 공방(Lv.3+)에서 마도석을 소비하여 해당 부위의 장비 슬롯에 각인할 수 있습니다. (슬롯 해금은 병기창 Lv.3/5/7 연동)": {
    en: "Consume sorcery stones at Alchemy Workshop (Lv.3+) to imprint gear slots. (Slots unlock via Armory Lv.3/5/7)",
    ja: "エーテル錬金工房（Lv.3+）で魔導石を消費し、該当部位の装備枠に刻印できます。（枠解放は兵器廠Lv.3/5/7連動）"
  },
  "💡 [원정단 편성] ➔ [스킬 관리/서고]에서 마도서를 연독하여 개인 스킬 풀(최대 6종)에 습득하거나 마스터리(Lv.1~5)를 강화할 수 있습니다.": {
    en: "💡 Study grimoires under [Expedition Roster] ➔ [Skill Archive] to acquire skills (up to 6) or enhance mastery (Lv.1-5).",
    ja: "💡【遠征団編成】➔【スキル管理/書庫】で魔導書を精読し、個人スキル枠（最大6種）に習得または熟練度（Lv.1〜5）を強化できます。"
  },
  "병기창 레벨에 따라 단조 가능한 장비 등급 확률이 해금됩니다(Lv.1~2 일반, Lv.3~5 희귀, Lv.6~9 영웅, Lv.10 전설 10%). 또한 Lv.3(+5강), Lv.5(+8강), Lv.7(+10강) 단계별 장비 강화 한도 및 마도 인챈트 슬롯이 개방되고, Lv.6에서 에테르 횃불 등 강화 보급품이 해금되므로 최우선 증축해야 하는 핵심 시설입니다.": {
    en: "Armory levels unlock gear crafting tiers (Lv.1-2 Normal, Lv.3-5 Rare, Lv.6-9 Epic, Lv.10 Legend 10%), enhancement limits (+5/+8/+10 at Lv.3/5/7), enchant slots, and advanced supplies at Lv.6.",
    ja: "兵器廠レベルにより鍛造品質確率が解禁（Lv.1〜2一般、Lv.3〜5希少、Lv.6〜9英雄、Lv.10伝説10%）。またLv.3(+5強)、Lv.5(+8強)、Lv.7(+10強)の強化上限やエンチャ枠、Lv.6の上級補給品が解禁される最重要施設です。"
  },
  "용병의 1차 승격(Lv.1 해금), 2차 각성(Lv.5 해금), 그리고 3차 초월(Lv.8 해금) 전직 조건을 개방하는 성소입니다(실제 전직 및 각성 실행은 [원정단 편성] 영웅 카드에서 진행). 제단 증축에 따라 상위 전직 의식과 에픽 시나리오 퀘스트가 순차 개방되며, Lv.6 이상 제단은 후반부 9~10레벨 시설 증축의 선행 마일스톤 조건으로 요구됩니다.": {
    en: "Sanctuary unlocking 1st Promotion (Lv.1), 2nd Awakening (Lv.5), and 3rd Transcendence (Lv.8) class requirements. Progression unlocks higher rituals and epic quests, serving as prerequisites for Lv.9-10 facility expansions.",
    ja: "傭兵の1次昇格（Lv.1解禁）、2次覚醒（Lv.5解禁）、3次超越（Lv.8解禁）の転職条件を開放する聖所。祭壇増築により上位の儀式やエピッククエストが順次開放され、後半施設の先行条件となります。"
  },
  "15초마다 귀중한 마도 자원인 에테르를 정기 생산하며, [습득 스킬 강화] 및 장비 [마도 인챈트](Lv.3 해금, 최대 Lv.10 성공 확률 34%)를 담당합니다. 7레벨 이상 고급 설비 증축의 선행 인프라로 요구되므로 중반 이후 집중적인 투자가 필요합니다.": {
    en: "Regularly produces precious Ether every 15s and handles [Skill Enhancement] and [Magic Enchanting] (Lv.3 unlock, max Lv.10 with 34% success). Essential prerequisite for Lv.7+ advanced facilities.",
    ja: "15秒ごとに貴重な魔導資源エーテルを定期生産し、【習得スキル強化】および装備【魔導エンチャント】（Lv.3解禁、最大Lv.10成功率34%）を担当。Lv.7以上の上級施設の前提インフラです。"
  },
  "Lv.1에서 비동기 4인 편성(선발 3인 + 전술 리더 1인) [차원 결투장(아레나)], Lv.3에서 전 서버급 보스 [네메시스 월드 레이드], Lv.6에서 [차원 영지 침공 및 전술 타워 방어전]이 순차 개방됩니다. 최고 등급 투사의 인장과 명예 칭호, 대량의 에테르를 획득할 수 있는 엔드게임 멀티 컨텐츠 관문입니다.": {
    en: "Unlocks async 4-hero [Dimensional Arena] at Lv.1, global boss [Nemesis World Raid] at Lv.3, and [Territory Invasions & Tactical Defense] at Lv.6. Endgame multi-content hub for Fighter Seals, honor titles, and massive Ether.",
    ja: "Lv.1で4人編成【次元決闘場（アリーナ）】、Lv.3で全サーバーボス【ネメシスワールドレイド】、Lv.6で【次元領地侵攻＆防衛戦】が順次解禁。最高峰の闘士の印章と名誉称号を獲得するエンドコンテンツです。"
  },
  "성화에 목재를 공헌하여 [온기 버프]를 켜두면 생산량 +15% 증산과 거점 회복 효과를 얻습니다. 횃불과 붕대를 챙겨 심연 1구역으로 첫 척후를 파견하면 진입 즉시 퀘스트가 달성됩니다. (횃불 점화 시 마물 조우율·기습률이 감소하고 오브젝트 발견율이 증가하지만, 불빛에 마물이 반응하여 걸음당 위험도는 더 빠르게 상승합니다.)": {
    en: "Contributing wood to the Sacred Bonfire grants the [Warmth Buff] (+15% production & HP recovery). Equip torches and bandages for Sector 1 scout missions. (Torches lower ambush rates and raise discoveries, but light attracts fiends, accelerating hazard gain per step.)",
    ja: "聖火に木材を捧げて【温もりバフ】を維持すると生産量+15%増産と回復効果を獲得。松明と包帯を携え第1区域へ斥候を派遣すると即達成。（点火時は奇襲率減・発見率増ですが、危険度の上昇速度が増加します。）"
  },
  "💡 팁: 영혼의 제단을 건설해 해금 조건(Lv.1/5/8)을 달성한 뒤 [원정단 편성] 영웅 카드에서 상위 클래스 전직(1~3차)까지 연계할 수 있습니다.": {
    en: "💡 Tip: Build the Soul Altar to meet tier requirements (Lv.1/5/8), then promote heroes up to 3rd Transcendence via [Expedition Roster] hero cards.",
    ja: "💡 ヒント: 魂の祭壇を建設して解禁条件（Lv.1/5/8）を満たした後、【遠征団編成】の英雄カードから上位クラス転職（1〜3次）を行えます。"
  },
  "탐험 전리품은 던전 배낭에 임시 보관되므로 무리하게 전멸하지 말고 위험도 70% 이상이거나 위기 시 [성채 귀환]을 눌러 전리품을 안전 입고하세요. 시설 Lv.4부터는 골드/식량/에테르 유지비가 발생하므로 기초 생산량을 충분히 다지며 증축하는 것이 핵심입니다.": {
    en: "Loot is temporarily held in dungeon backpacks; use [Return to Citadel] at 70%+ hazard to secure spoils safely. Facility upkeep starts at Lv.4, so build a strong production base before expanding.",
    ja: "戦利品はリュックに一時保管されるため、危険度70%以上や危急時は【城塞帰還】で安全に搬入してください。施設Lv.4以降は維持費が発生するため、基礎生産を固めて増築することが肝要です。"
  },
  "기본 공격 시 대상에게 1턴간 출혈(Bleed, 최대 HP 8% 피해) 상태이상을 부여하여 지속 피해 유발 (도끼·배틀액스 포함)": {
    en: "Basic attacks inflict [Bleed] (8% Max HP damage) for 1 turn, dealing damage over time (includes axes and battleaxes).",
    ja: "基本攻撃時、対象に1ターンの【出血】（最大HP8%ダメージ）状態異常を付与し持続ダメージを誘発（斧・バトルアックスを含む）。"
  },
  "기본 공격 시 적의 보호막(Shield)에 50% 추가 피해를 입혀 방어선을 신속히 붕괴 (망치·해머·둔기 포함)": {
    en: "Basic attacks deal +50% extra DMG against Shields, swiftly shattering defensive lines (includes maces, hammers, and bludgeons).",
    ja: "基本攻撃時、敵のシールドへ+50%の追加ダメージを与えて防衛線を迅速に粉砕（槌・ハンマー・鈍器を含む）。"
  },
  "기본 공격 시 상대 마물보다 속도가 빠를수록 피해량 비례 증가 (최대 20% 증폭, 사신 낫·참살낫 포함)": {
    en: "Basic attack damage increases proportionally to Speed advantage over the target fiend (up to +20%, includes scythes).",
    ja: "基本攻撃時、魔物より速度が速いほどダメージが比例増加（最大+20%増幅、大鎌・死神の鎌を含む）。"
  },
  "사경 상태에서 사망한 영웅이 착용하고 있던 장비 중 무작위 단 1점만 영혼이 깃든 [유품(Memento)]으로 성채 보관함에 회수되며, 나머지 착용 장비는 심연에 유실(영구 소멸)됩니다.": {
    en: "Only a single random piece of equipment from a permanently fallen hero is recovered to Citadel Storage as a soul-imbued [Memento]; all other gear is permanently lost in the abyss.",
    ja: "死境で死亡した英雄の装備のうち、無作為の1点のみが魂の宿る【遺品（Memento）】として城塞保管庫へ回収され、残りは深淵で永久消失します。"
  },
  "영혼의 제단 해금 조건(1차: 제단 Lv.1 & 영웅 Lv.10 / 2차: 제단 Lv.5 & 영웅 Lv.30 / 3차: 제단 Lv.8 & 영웅 Lv.60) 달성 후 [원정단 편성] 영웅 카드에서 1차, 2차 또는 3차 전직 시, 이전 클래스의 고유 스킬과 기존에 습득했던 모든 스킬이 소멸되지 않고 [학습한 스킬] 목록(최대 6개)으로 100% 안전하게 이동 및 보존됩니다.": {
    en: "Promoting classes at Soul Altar (T1: Altar Lv.1/Hero Lv.10, T2: Altar Lv.5/Hero Lv.30, T3: Altar Lv.8/Hero Lv.60) safely moves all previously learned skills to the [Learned Skills] pool (up to 6) without loss.",
    ja: "魂の祭壇の条件達成後、【遠征団編成】で転職時、旧クラスの固有スキルや習得済みスキルは消失せず【習得スキル】一覧（最大6個）へ100%安全に保持・移行されます。"
  },
  "3차 초월 전직은 2차 각성 직업 Lv.60 달성 및 영혼의 제단 Lv.8 증축 후 [원정단 편성]에서 승급할 수 있는 최종 경지입니다. 3차 전직을 완료하면 모든 계열의 마도서를 페널티 없이 100% 위력으로 장착/시전하는 [만마도서] 패시브가 해금되며, 전장을 뒤흔드는 고유 초월 궁극기(오의)와 강력한 융합 패시브를 다룹니다.": {
    en: "3rd Transcendence is the pinnacle achieved upon reaching 2nd Awakening Lv.60 and Altar Lv.8. It unlocks the [Omni-Grimoire] passive, allowing all magic grimoires to be wielded at 100% power without penalties, along with supreme transcendent ultimates and hybrid passives.",
    ja: "3次超越転職は2次覚醒Lv.60到達および祭壇Lv.8増築後に到達できる最終境地。【万魔導書】パッシブが解禁され全系統の魔導書をペナルティなしで100%威力行使可能となり、固有超越奥義を操ります。"
  },
  "① 이지스 바스티온(절대수호/50% 반사/중·후열 피격 50% 분담 엄호, 초월기 [아발론]) ② 보이드 스트라이더(차원회피 시 회피·명중 +10% 및 공격력 +20%, 초월기 [차원참]) ③ 크로노 아콘(50% 더블캐스트, 초월기 [빅뱅 크로노스]) ④ 세라픽 인퀴지터(공격치유/치유반격, 초월기 [창공의 대심판]) ⑤ 발할라 워로드(상시흡혈/사경행동, 초월기 [피의 전술]) ⑥ 오메가 데드아이(방무50%/연쇄충격, 초월기 [궤도 섬멸])로 구성됩니다.": {
    en: "Comprises ① Aegis Bastion (Absolute Guard/50% Reflect/Cover, Ultimate [Avalon]), ② Void Strider (Dimensional Evasion/Hit+10%/ATK+20%, Ultimate [Void Slash]), ③ Chrono Archon (50% Doublecast, Ultimate [Big Bang Chronos]), ④ Seraphic Inquisitor (Attack Heal/Counter Heal, Ultimate [Celestial Judgment]), ⑤ Valhalla Warlord (Permanent Lifesteal/Death Defiance, Ultimate [Blood Tactic]), ⑥ Omega Deadeye (50% Piercing/Chain Shock, Ultimate [Orbital Annihilation]).",
    ja: "①イージス・バスティオン（絶対守護/反射/前衛援護、超越技【アヴァロン】）②ヴォイド・ストライダー（次元回避/命中+10%/攻撃+20%、超越技【次元斬】）③クロノ・アルコン（50%ダブルキャスト、超越技【ビッグバン・クロノス】）④セラフィック・インクイジター（攻撃回復/反撃、超越技【蒼穹の大審判】）⑤ヴァルハラ・ウォーロード（常時吸血/死境行動、超越技【血の戦術】）⑥オメガ・デッドアイ（防貫50%/連鎖、超越技【軌道殲滅】）で構成。"
  },
  "방주 중앙 병참고(유지비 전액 면제)를 제외한 영지 시설은 Lv.4부터 골드/식량/에테르 유지비가 차감됩니다. 유지비가 체납되면 해당 시설이 자동으로 가동 중단(일시 정지)되거나 단계가 일시 하향되므로 벌채소/시추소/안식처/정제소 생산량을 균형 있게 성장시키세요.": {
    en: "Except the Central Storage, all facilities incur Gold/Food/Ether upkeep starting at Lv.4. Delinquency halts or temporarily downgrades facilities, so maintain balanced production across lumber camps, quarries, cabins, and refineries.",
    ja: "中央兵站庫を除き、各施設はLv.4より維持費が発生。滞納時は自動停止または一時降格となるため、伐採所・採掘所・安息所・精製所の生産量を均衡に育ててください。"
  },
  "침공 승리 시 확정 2종(골드 30% + 에테르 30%)과 3대 카테고리(영지 생산자원 1종, 파밍 재료 1종, 심연 재료 1종)에서 각각 무작위로 추첨된 1종씩 총 5종의 자원을 상대 영지 보유량의 30%만큼 약탈합니다. 일일 침공 횟수 제한 없이 출전할 수 있으며, 기본 6시간 제공되는 수동 ON/OFF 토글형 [차원 왜곡 평화 보호막](광고 시청 시 +6시간 충전)과 방어 실패 시 자동 부여되는 3시간 긴급 보호막으로 영지를 보호할 수 있습니다.": {
    en: "Invasion victory loots 30% of target's Gold and Ether plus 1 random resource from each of 3 categories (production, dungeon, and abyss). Unlimited daily sorties; protect your territory with a 6-hour toggleable Peace Shield (+6h via ads) or auto 3-hour emergency shields.",
    ja: "侵攻勝利時、確定2種（ゴールド・エーテル各30%）と3大カテゴリから各1種（計5種）を相手保有量の30%略奪。出撃制限なし。手動切替の平和シールド（基本6時間）や敗北時の3時間緊急シールドで防衛可能です。"
  },
  "방어 전술 타워는 공격 전술(고출력 화력 증폭/작열 고열탄/맹독 부식탄), 방어 전술(나노 결계 복원/충격 전자기파/극저온 동결 역장), 유틸 전술(중력 감속 왜곡장/에테르 교란 균열/불운의 위상 저주)의 3계통 × 3단계(각 최대 Lv.5, 총합 45레벨)로 구성되며, 연구 레벨에 따라 수성전 시 포탑 화력 강화, 상태이상 부여, 보호막 재생 및 침입자 광역 약화를 지원합니다.": {
    en: "Defensive Tactical Towers feature 3 branches × 3 tiers (Attack, Defense, Utility; max Lv.5 each, total 45 levels) to augment turret firepower, inflict status debuffs, regenerate barriers, and weaken invaders.",
    ja: "防衛戦術タワーは攻撃戦術、防衛戦術、補助戦術の3系統×3段階（各最大Lv.5、計45レベル）で構成され、防衛戦時の砲塔火力強化や状態異常付与、シールド再生、侵入者弱化を担います。"
  },
  "전투 행동(치유, 수호, 치명타, 연계, 지원, 파쇄, 회피, 반격)에 따라 모멘텀 배지 5개를 먼저 채운 진영이 [피버 콜!]을 선언합니다. 선언 후 상대가 3턴 내에 피버 5개를 완성하지 못하면 시간 초과 실격으로 선언 측이 부전승을 거둡니다. 양측 모두 완성 시 피버콜 전광판이 열리고 12대 전술 족보 및 주간 차원율(💥돌파 > 🌀변칙 > 🛡️수호 > 💥돌파) 상성에 따라 승패를 판정하여 승자 진영의 오퍼레이터 궁극기가 전장에 작렬합니다 (3승 달성 시 즉시 승리).": {
    en: "Collecting 5 Momentum Badges via combat actions triggers [Fever Call!]. If the opponent fails to complete 5 within 3 turns, the caller wins by timeout. When both complete, the 12 Tactical Synergies and weekly affinity determine whose operator ultimate fires (first to 3 wins takes match).",
    ja: "戦闘行動でモメンタムバッジを5個集めた陣営が【フィーバーコール！】を宣言。相手が3ターン内に揃えられない場合不戦勝。双方が揃えた場合は12大戦術譜と週間次元律相性で勝敗を判定し、勝者の究極技が炸裂します。"
  },
  "결투 승리 시 레이팅 점수 상승과 함께 [투사의 인장]을 획득하며, 연승(Streak)이 길어질수록 추가 인장 보너스를 대량 획득합니다. 모은 투사의 인장은 명예 암시장에서 [실버]/[골드]/[플래티넘]/[다이아몬드]/[마스터] 무구 보급함 및 [신화 성유물 보관함], [차원 패왕의 금고] 등 최고급 장비와 마도석으로 교환할 수 있습니다.": {
    en: "Arena victories grant rating points and [Fighter's Seals], with scaling bonuses on winning streaks. Exchange seals at Honor Black Market for Silver/Gold/Platinum/Diamond/Master supply boxes, Mythic Relics, and Sovereign Safes.",
    ja: "決闘勝利でレート上昇と【闘士の印章】を獲得し、連勝ボーナスも大幅増加。集めた印章は闇市場でシルバー〜マスターの各種武具補給箱や神話の聖遺物箱と交換可能です。"
  },
  "네메시스는 모든 방주의 지휘관들이 실시간 공유(Firebase RTDB)하여 함께 토벌하는 총 체력 1,250만(머리 400만/몸통 500만/꼬리 350만)의 월드 보스입니다. 매주 수요일 자정(00:00)에 최대 체력으로 정기 초기화 및 재소환되며, 매 6시간마다 전체 체력의 1/24(약 520,833 DMG)이 전 서버 요격 목표치로 집계됩니다(현재 자율 레이드 모드로 영지 자원 실제 차감 페널티 없이 안전하게 참여 가능). 주기 내에 완전 토벌 시 전 지휘관에게 막대한 보상이 지급됩니다.": {
    en: "Nemesis is a shared 12.5M HP (Head 4M/Body 5M/Tail 3.5M) World Boss fought collaboratively by all Commanders (Firebase RTDB). Resets Wednesdays at midnight; every 6h requires 1/24 total HP (~520k DMG) global defense. Complete subjugation yields massive server rewards.",
    ja: "ネメシスは全指揮官がリアルタイム共有する総HP1250万（頭400万/胴500万/尾350万）のワールドボス。毎週水曜深夜リセット。6時間ごとに総HPの1/24（約52万DMG）迎撃目標が集計され、討伐達成で全員に巨額報酬が配布されます。"
  },
  "침공전은 총 7라운드 제한(기본 1.0x 배속, 1.5x ➔ 2.0x 전환 가능)으로 진행되며, 공격측은 7라운드 내에 적의 차원 보호막과 기본 2,500 HP의 성벽을 무너뜨려야 자원을 약탈할 수 있습니다. 수비측 좌/우 타워는 기본 400 HP를 가지며, 탑승한 영웅의 체력과 방어력에 따라 거점의 최종 스탯이 크게 강화됩니다. 7라운드 내에 돌파하지 못하면 수비측의 승리로 종료됩니다.": {
    en: "Invasions last 7 rounds (1.0x/1.5x/2.0x speed). Attackers must demolish the barrier and 2,500 HP wall within 7 rounds to loot resources. Defender left/right towers (base 400 HP) scale with stationed heroes' HP and DEF. Failing to breach within 7 rounds results in defense victory.",
    ja: "侵攻戦は7ラウンド制限（倍速切替可）。攻撃側は7ラウンド内にシールドと城壁（基本2500HP）を破壊せねばならず、防衛側タワーは駐留英雄の能力で大幅強化されます。突破できなければ防衛側の勝利。"
  },
  "차원 앵커 게이트 Lv.6 달성 시 병영에서 [수비부대] 탭이 해금됩니다. 보호막, 좌/우 타워, 오퍼레이터 슬롯에 용병을 선택하면 전술 모달이 열려, 영웅의 8종 성향(Trait)과 6종 역할군(Role) 조합에 따른 48가지 맞춤형 수성 전술과 거점 탑승 시 최종 방어 스탯을 미리 확인하고 최적의 방어 부대를 편성할 수 있습니다.": {
    en: "Dimensional Gate Lv.6 unlocks the Barracks [Defense Squad] tab. Assign mercenaries to the Barrier, Left/Right Turrets, and Operator slots to activate 48 custom siege tactics based on 8 Traits × 6 Roles and preview defensive combat stats.",
    ja: "次元ゲートLv.6で兵舎に【守備部隊】タブが解禁。防壁・左右タワー・オペレーター枠に傭兵を配置し、8種特性×6種役割による48通りの特化戦術と最終防衛ステータスをプレビュー可能です。"
  },
  "6시간 주기 방어 퀘스트: 전 서버 요격 목표치 (체력 1/24)": {
    en: "6-Hour Defense Quest: Global Interception Goal (1/24 HP)",
    ja: "6時間周期防衛クエスト: 全サーバー迎撃目標値（HP 1/24）"
  },
  "네메시스의 침식 파동은 매 6시간마다 전 서버의 요격 목표치를 시험합니다. 전 서버 지휘관들의 협동 누적 피해량으로 방어 목표치를 달성하세요.": {
    en: "Nemesis erosion waves test global defense thresholds every 6 hours. Cooperate with commanders worldwide to reach cumulative damage targets.",
    ja: "ネメシスの侵食波動は6時間ごとに迎撃目標を試練として課します。全指揮官の累積ダメージで防衛目標を達成しましょう。"
  },
  "6시간당 1/24 요격 컷: 매 6시간마다 전체 체력의 1/24(약 520,833 DMG) 이상의 누적 피해를 전 서버가 입히는 것이 주기별 방어 목표입니다.": {
    en: "6-Hour 1/24 Threshold: The server must deal at least 1/24 of total HP (~520,833 DMG) every 6 hours to fulfill defense goals.",
    ja: "6時間ごとの1/24迎撃ライン: 6時間あたり全HPの1/24（約520,833 DMG）以上の累積ダメージをサーバー全体で与えるのが目標です。"
  },
  "약탈 저지 성공: 6시간 요격 컷을 달성하면 방주 거점 방어 판정이 성공하며 토벌 공헌이 누적됩니다.": {
    en: "Pillage Averted: Reaching the 6-hour threshold confirms base defense and accumulates subjugation credit.",
    ja: "略奪阻止成功: 6時間迎撃ライン達成で拠点防衛成功と判定され、討伐貢献度が蓄積されます。"
  },
  "자율 레이드 모드 (자원 차감 페널티 면제): 현재 지휘관들의 부담 없는 레이드 참여를 위해, 6시간 저지선이 미달되더라도 실제 영지 자원이 차감되는 약탈 페널티는 비활성화되어 안전하게 보존됩니다.": {
    en: "Casual Raid Mode (Penalty Exempt): To ensure accessible participation, resource-loss penalties are disabled even if the 6-hour threshold is missed.",
    ja: "自律レイドモード（資源損失免除）: 指揮官が気軽に参加できるよう、6時間目標未達時でも領地資源の略奪ペナルティは無効化されています。"
  },
  "💡 팁: 하루 4번 주기마다 네메시스에 출격하여 부위 파괴 및 누적 딜량 마일스톤 보상을 챙기세요.": {
    en: "💡 Tip: Sortie against Nemesis during each of the 4 daily cycles to claim part-destruction and milestone damage rewards.",
    ja: "💡 ヒント: 1日4回の周期ごとにネメシスへ出撃し、部位破壊および累積ダメージ報酬を獲得しましょう。"
  },
  "개인 누적 딜량 마일스톤: 누적 데미지 구간마다 투사의 인장, 에테르 결정, 고대 유물 파편, 고급 장비 상자가 즉시 지급됩니다.": {
    en: "Personal Damage Milestones: Claim Fighter's Seals, Ether Crystals, Ancient Relics, and high-tier equipment chests at damage thresholds.",
    ja: "個人累積ダメージマイルストーン: ダメージ区画ごとに闘士の印章、エーテル結晶、古代遺物の破片、高級装備箱を即時支給。"
  },
  "7라운드 공격 제한 (기본 1.0x 배속): 공격측은 7라운드 이내에 적의 차원 보호막과 성벽(기본 2,500 HP)을 파괴해야 승리하며, 시간 초과 시 수비측이 승리합니다 (1.0x ➔ 1.5x ➔ 2.0x 배속 전환 지원).": {
    en: "7-Round Attack Limit (Base 1.0x): Attackers must destroy the barrier and wall (2,500 HP) within 7 rounds (1.0x/1.5x/2.0x speeds supported).",
    ja: "7ラウンド攻撃制限（基本1.0x）: 7ラウンド内に敵の防壁と城壁（2500HP）を破壊せねばならず、時間切れは防衛側勝利（倍速対応）。"
  },
  "차원 앵커 게이트 연동: 거점의 차원 게이트 레벨(Lv.6 해금)이 상승할수록 침공 보너스와 방어 전술 연구가 확장됩니다.": {
    en: "Dimensional Gate Link: Upgrading the Dimensional Gate (Lv.6 unlock) expands invasion bonuses and defense tactic research.",
    ja: "次元アンカーゲート連動: 拠点の次元ゲートレベル（Lv.6解禁）が上がるほど侵攻ボーナスと防衛戦術研究が拡張。"
  },
  "실시간 상대 영지 매칭: 비슷한 전력의 라이벌 영지가 추천되며, 방어 진형과 전술 타워를 정찰한 후 횟수 제한 없이 침공을 개시할 수 있습니다.": {
    en: "Real-time Territory Matchmaking: Recommended rivals with comparable power; scout defenses and launch unlimited sorties.",
    ja: "リアルタイム領地マッチング: 同等戦力のライバル領地が推薦され、防衛陣形とタワーを偵察後、無制限に出撃可能です。"
  },
  "확정 2종 + 카테고리별 랜덤 3종 약탈 (각 30%) & 평화 보호막": {
    en: "Loot 2 Fixed + 3 Random by Category (30% each) & Peace Shield",
    ja: "確定2種＋カテゴリ別ランダム3種略奪（各30%）＆平和シールド"
  },
  "침공 승리 시 상대 영지에서 확정 2종(골드·에테르)과 3대 카테고리별 랜덤 1종씩 총 5종의 자원을 각 30%씩 약탈하여 아군 방주 창고로 이송합니다.": {
    en: "Victory loots 30% of target Gold and Ether plus 1 random resource from 3 categories, transferring spoils to your storage.",
    ja: "侵攻勝利時、相手領地から確定2種（ゴールド・エーテル）と3カテゴリ各1種の計5種を30%ずつ略奪し保管庫へ輸送します。"
  },
  "확정 목표 자원 2종 (30%): 침공 성공 시 상대 영지의 골드(🪙)와 에테르(✨)를 보유량의 30%만큼 확정 약탈합니다.": {
    en: "2 Fixed Target Resources (30%): Victory guarantees pillaging 30% of the rival's Gold (🪙) and Ether (✨).",
    ja: "確定目標資源2種（30%）: 侵攻成功時、相手のゴールド(🪙)とエーテル(✨)を保有量の30%分確実に略奪します。"
  },
  "카테고리별 무작위 3종 약탈 (각 30%): ① 영지 기초 생산자원(목재·석재·철광·식량 중 1종), ② 던전 파밍 재료(약초·가죽·실크·석탄·뼈 중 1종), ③ 심연 희귀 재료(마력수정·공허파편·접두석·접미석 중 1종)를 각 30%씩 약탈합니다.": {
    en: "Random 3 Categories (30% each): Loots 30% of ① Production (Wood/Stone/Iron/Food), ② Dungeon farming (Herb/Leather/Silk/Coal/Bone), and ③ Abyss rare (Crystal/Void/Prefix/Suffix).",
    ja: "カテゴリ別ランダム3種略奪（各30%）: ①基礎生産（木材/石材/鉄鉱/食料）、②ダンジョン素材（薬草/革/絹/石炭/骨）、③深淵希少素材（魔力水晶/破片/接頭石/接尾石）を各30%略奪。"
  },
  "차원 왜곡 평화 보호막 (기본 6시간 수동 토글 & 피침공 3시간 자동): 기본 6시간 제공되는 평화 보호막을 원하는 때 수동으로 ON/OFF하여 시간을 보존하거나 영지를 지킬 수 있으며(소진 시 광고 시청으로 +6시간 충전), 방어 실패 시에는 3시간 긴급 보호막이 자동 활성화됩니다.": {
    en: "Peace Shield (6h Manual Toggle & 3h Auto-Emergency): Toggle the base 6h shield ON/OFF anytime (+6h via ads). Defensive failure automatically triggers a 3-hour emergency shield.",
    ja: "平和シールド（基本6時間手動切替＆被侵攻時3時間自動）: 基本6時間を手動でON/OFF可能（広告視聴で+6時間補充）。防衛失敗時は3時間の緊急シールドが自動発動。"
  },
  "💡 팁: 보호막이 켜져 있는 동안에는 다른 영지를 침공할 수 없으므로, 침공 출격 시 보호막을 잠시 끄고 귀환 후 다시 켜두세요.": {
    en: "💡 Tip: You cannot invade rivals while your Peace Shield is active; toggle it off before sorties and re-enable upon return.",
    ja: "💡 ヒント: シールド稼働中は他領地へ侵攻できないため、出撃時は一時OFFにし帰還後再点灯してください。"
  },
  "성벽 내구도 & 3계통 × 3단계 방어 전술 타워 연구소": {
    en: "Wall Durability & 3 Branches × 3 Tiers Defense Tower Lab",
    ja: "城壁耐久度＆3系統×3段階防衛戦術タワー研究所"
  },
  "수비측 방주는 중앙 성벽과 좌/우 방어 타워(기본 400 HP)를 배치하고, 3대 계통 총 9종(각 최대 Lv.5, 총합 45레벨)의 방어 전술 타워 테크를 연구하여 침입자를 요격합니다.": {
    en: "Defenders deploy a center wall and left/right turrets (400 HP) supported by 9 tech researches across 3 branches (max Lv.5 each, total 45 levels).",
    ja: "防衛側は中央城壁と左右タワー（400HP）を配備し、3系統計9種（各最大Lv.5、計45Lv）のタワー技術を研究して迎撃します。"
  },
  "⚔️ 공격 전술 (좌측 화력 포탑 특화): 1차 [고출력 화력 증폭](포탑 화력 +15%/Lv) ➔ 2차 [작열 고열탄](화상 부여 & 방어력 -50%) ➔ 3차 [맹독 부식탄](턴당 최대 HP 14% 맹독 부여)": {
    en: "⚔️ Attack Tactics (Left Turret): T1 [Firepower Amp] (+15% ATK/Lv) ➔ T2 [Blazing Rounds] (Burn & -50% DEF) ➔ T3 [Venom Rounds] (14% Max HP Toxic/turn).",
    ja: "⚔️ 攻撃戦術（左砲塔特化）: 1次【高出力火力増幅】（砲塔火力+15%/Lv）➔ 2次【灼熱高熱弾】（火傷付与＆防御-50%）➔ 3次【猛毒腐食弾】（毎ターン14%猛毒）。"
  },
  "🛡️ 방어 전술 (우측 지원 포탑 특화): 1차 [나노 결계 복원](성벽·포탑 수복량 +20%/Lv & 매 턴 재생) ➔ 2차 [충격 전자기파](침입자 1턴 기절) ➔ 3차 [극저온 동결 역장](침입자 냉각 & 동상 부여)": {
    en: "🛡️ Defense Tactics (Right Turret): T1 [Nano Barrier Restore] (+20% repair/Lv & regen) ➔ T2 [EMP Shockwave] (1-turn stun) ➔ T3 [Cryo Freeze Field] (Chill & Frostbite).",
    ja: "🛡️ 防衛戦術（右砲塔特化）: 1次【ナノ結界復元】（修復量+20%/Lv＆毎ターン再生）➔ 2次【衝撃電磁波】（侵入者1ターン気絶）➔ 3次【極低温凍結力場】（凍結付与）。"
  },
  "⚡ 유틸 전술 (전장 광역 약화): 1차 [중력 감속 왜곡장](침입자 전원 SPD -5%/Lv) ➔ 2차 [에테르 교란 균열](침입자 스킬 MP 소모 +15%/Lv) ➔ 3차 [불운의 위상 저주](침입자 전원 LUCK -10%/Lv)": {
    en: "⚡ Utility Tactics (Debuff Field): T1 [Gravity Slow Field] (-5% SPD/Lv) ➔ T2 [Ether Disruption Rift] (+15% MP Cost/Lv) ➔ T3 [Misfortune Phase Curse] (-10% LUCK/Lv).",
    ja: "⚡ 補助戦術（広域弱化）: 1次【重力減速歪曲場】（侵入者SPD-5%/Lv）➔ 2次【エーテル撹乱亀裂】（スキル消費MP+15%/Lv）➔ 3次【不運の位相呪詛】（侵入者LUK-10%/Lv）。"
  },
  "💡 팁: 좌/우 타워에 체력과 방어력이 높은 영웅을 배치하고 방어 전술 타워를 연구하면 성벽이 무너지기 전에 침공군을 완벽히 제압할 수 있습니다.": {
    en: "💡 Tip: Stationing sturdy heroes in left/right turrets and researching tactics allows repelling invaders before your wall collapses.",
    ja: "💡 ヒント: 左右タワーにHP・防御力の高い英雄を配置して戦術研究を進めれば、城壁崩壊前に侵入者を制圧できます。"
  },
  "병영 수비부대 편성 & 48가지 맞춤형 수성 전술 세팅": {
    en: "Barracks Defense Squad & 48 Custom Siege Tactics",
    ja: "兵舎守備部隊編成＆48種特化籠城戦術設定"
  },
  "48가지 수성 전술 발동 (8성향 × 6역할군): 배치된 영웅의 8종 성향(Trait)과 6종 역할군(Role) 조합에 따라 [성벽 수호], [반격 포격], [철벽 방진] 등 48가지 고유 수성 전술이 자동 활성화됩니다.": {
    en: "48 Siege Tactics (8 Traits × 6 Roles): Combining stationed heroes' Traits and Roles automatically activates tactics such as Wall Bastion, Counter-Bombardment, and Iron Phalanx.",
    ja: "48通りの籠城戦術（8特性×6役割）: 配置英雄の8種特性と6種役割の組合せで【城壁守護】【反撃砲撃】【鉄壁陣】等の固有戦術が発動。"
  },
  "방어 성공 및 복수전: 침공해 온 적을 7라운드 동안 막아내면 방어에 성공하며, 함락되더라도 방어 기록 탭에서 [즉시 복수전]으로 반격할 수 있습니다.": {
    en: "Defense Victory & Revenge: Holding off attackers for 7 rounds secures victory. If breached, launch immediate counterstrikes via [Instant Revenge].",
    ja: "防衛成功＆復讐戦: 7ラウンド持ちこたえれば防衛成功。陥落した場合でも防衛記録タブから【即時復讐戦】で反撃可能です。"
  },
  "고대 영웅들의 영혼 기억을 전수하여 ★ 3차 초월 클래스 전직을 해금하고 1차 각성 클래스의 경험치 획득량을 +30%로 증폭시키며 등급 승격률을 24%로 높입니다.": {
    en: "Transfers ancient hero soul memories to unlock ★ 3rd Transcendence classes, boosts 1st Tier class EXP by +30%, and raises rank promotion rate to 24%.",
    ja: "古代英霊の記憶を伝承して★3次超越クラスへの転職を解禁し、1次覚醒クラスのEXP獲得量を+30%増幅、昇格率を24%へ引き上げます。"
  },
  "차원 도약 터널을 열어 4인 결투 편성(선발 3 + 전술 리더 1)으로 타 영지를 습격해 자원을 약탈하는 [차원 영지 침공]을 해금하고 PVE 치명타율 +5%를 획득합니다.": {
    en: "Opens dimensional tunnels to unlock [Territory Invasions] with 4-hero squads (3 Vanguard + 1 Leader) to raid rival resources and gain +5% PVE Crit.",
    ja: "次元跳躍トンネルを開き、4人編成（先発3＋戦術リーダー1）で他領地を襲撃する【次元領地侵攻】を解禁し、PVE会心率+5%を獲得します。"
  },
  "★ 3차 초월 클래스 전직 해금 & 1차 각성 클래스 EXP +30% 증폭 (등급 상승 +24%)": {
    en: "★ 3rd Transcendence Class Unlock & T1 EXP +30% Boost (Promotion +24%)",
    ja: "★ 3次超越クラス転職解禁＆1次覚醒クラスEXP+30%増幅（昇格率+24%）"
  },
  "3차 초월 & 2차 승격 & 1차 각성 클래스 EXP +40% 최대 (등급 상승 +27%)": {
    en: "T3 Transcendence & T2/T1 Class EXP +40% Max (Promotion +27%)",
    ja: "3次超越＆2次昇格＆1次覚醒クラスEXP+40%最大（昇格率+27%）"
  },
  "➔ 다음 Lv.8: ★ 3차 초월 클래스 전직 해금! & 1차 각성 EXP +30% (등급상승 24%)": {
    en: "➔ Next Lv.8: ★ 3rd Transcendence Unlock! & T1 EXP +30% (Promotion 24%)",
    ja: "➔ 次のLv.8: ★ 3次超越クラス転職解禁！＆1次覚醒EXP+30%（昇格率24%）"
  },
  "★ ⚔️ [차원 영지 침공] 해금 (4인 결투 편성 약탈전) & 명예 상점 6단계 & PVE 치명타율 +5%": {
    en: "★ ⚔️ [Territory Invasions] Unlock (4-Hero Plunder Sorties), Honor Shop Tier 6 & +5% PVE Crit",
    ja: "★ ⚔️【次元領地侵攻】解禁（4人編成略奪戦）＆名誉ショップ第6段階＆PVE会心率+5%"
  },
  "기록됨 ✓": { en: "Recorded ✓", ja: "記録済み ✓" },
  "일반 접두석 묶음": { en: "Standard Prefix Stone Bundle", ja: "一般接頭石の束" },
  "일반 접미석 묶음": { en: "Standard Suffix Stone Bundle", ja: "一般接尾石の束" },
  "순수 접두석 묶음": { en: "Pure Prefix Stone Bundle", ja: "純粋な接頭石の束" },
  "순수 접미석 묶음": { en: "Pure Suffix Stone Bundle", ja: "純粋な接尾石の束" },
  "순수 마도석 세트": { en: "Pure Sorcery Stone Set", ja: "純粋な魔導石セット" },
  "공허 파편 세트": { en: "Void Shard Set", ja: "虚無の破片セット" },
  "에테르 횃불 세트": { en: "Ether Torch Set", ja: "エーテル松明セット" }
};

// Merge into delta
Object.assign(delta, moreTranslations);

fs.writeFileSync(deltaPath, JSON.stringify(delta, null, 2), 'utf8');
console.log(`Updated delta_018.json! Total entries: ${Object.keys(delta).length}`);
