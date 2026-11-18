# -*- coding: utf-8 -*-
import json
import os

ROOT = 'I:/workshop/newProjectVive'
OUT_DIR = os.path.join(ROOT, 'scripts/i18n/out')

# Full remaining translations dictionary
ALL_REMAINING = {
  # === Atmospheric Floor Descriptions ===
  "심연의 입구. 차가운 석재 회랑과 핏빛 이끼": {
    "en": "Abyss entrance. Cold stone corridors and bloodstained moss.",
    "ja": "深淵の入口。冷たい石造回廊と血色の苔。"
  },
  "원혼들이 떠도는 납골 묘지": {
    "en": "Ossuary graveyard where vengeful spirits wander.",
    "ja": "怨霊が彷徨う納骨墓地。"
  },
  "푸른빛 마나 수정이 자라나는 지하 광산": {
    "en": "Subterranean mines where azure mana crystals flourish.",
    "ja": "青いマナ水晶が群生する地下鉱山。"
  },
  "시공간이 일그러진 차원 틈새": {
    "en": "Dimensional rift distorted by space and time.",
    "ja": "時空間が歪んだ次元の裂け目。"
  },
  "고대 공허 거신이 잠든 결전의 제단": {
    "en": "Altar of destiny where the ancient void colossus sleeps.",
    "ja": "古代虚無の巨神が眠る決戦の祭壇。"
  },
  "진홍의 피가 흐르는 고딕 대성당": {
    "en": "Gothic cathedral flowing with crimson blood.",
    "ja": "深紅の血が流れるゴシック大聖堂。"
  },
  "사신이 지배하는 영혼의 나락": {
    "en": "Soul abyss ruled by the Grim Reaper.",
    "ja": "死神が支配する魂の奈落。"
  },
  "타락한 기사단장의 흑철 요새": {
    "en": "Black iron fortress of the corrupted Knight Commander.",
    "ja": "堕落した騎士団長の黒鉄要塞。"
  },
  "거울 파편이 떠다니는 만화경 미로": {
    "en": "Kaleidoscope labyrinth of drifting mirror shards.",
    "ja": "鏡の破片が漂う万華鏡の迷宮。"
  },
  "종말의 공허 군주가 자리한 옥좌": {
    "en": "Throne of the apocalyptic Void Overlord.",
    "ja": "終末の虚無君主が鎮座する玉座。"
  },
  "끝없는 심연의 무한 연옥": {
    "en": "Infinite purgatory of the endless abyss.",
    "ja": "終わりのない深淵の無限煉獄。"
  },

  # === Equipment Subtypes ===
  "석궁": {"en": "Crossbow", "ja": "クロスボウ"},
  "스태프": {"en": "Staff", "ja": "スタッフ"},
  "마법봉": {"en": "Wand", "ja": "魔法の杖"},
  "대지팡이": {"en": "Greatstaff", "ja": "大杖"},
  "리볼버": {"en": "Revolver", "ja": "リボルバー"},
  "심판궁": {"en": "Judgment Bow", "ja": "審判の弓"},
  "결전궁": {"en": "Decisive Bow", "ja": "決戦の弓"},
  "비도": {"en": "Throwing Knife", "ja": "飛刀"},
  "나이프": {"en": "Knife", "ja": "ナイフ"},
  "암기": {"en": "Concealed Weapon", "ja": "暗器"},
  "카타나": {"en": "Katana", "ja": "刀"},
  "환도": {"en": "Hwando", "ja": "環刀"},
  "성검": {"en": "Holy Sword", "ja": "聖剣"},
  "처형검": {"en": "Executioner Blade", "ja": "処刑剣"},
  "영혼검": {"en": "Soulblade", "ja": "ソウルブレード"},
  "사령검": {"en": "Necroblade", "ja": "死霊の剣"},
  "학살검": {"en": "Massacre Blade", "ja": "虐殺の剣"},
  "태도": {"en": "Nodachi", "ja": "太刀"},
  "일본도": {"en": "Katana", "ja": "日本刀"},
  "목도": {"en": "Wooden Sword", "ja": "木刀"},
  "성봉": {"en": "Holy Rod", "ja": "聖棒"},
  "대도": {"en": "Broadsword", "ja": "大刀"},
  "사경(Death)": {"en": "Death's Door", "ja": "死境"},

  # === 3rd Transcendence Blessings ===
  "불멸 성채의 방벽": {"en": "Immortal Citadel Bulwark", "ja": "不滅城塞の防壁"},
  "이지스 바스티온의 절대 방벽: 파티 방어력 +22%, 받는 피해 15% 감소, 개시 보호막 +20%(3턴), 전열 엄호율 +30%": {
    "en": "Aegis Bastion's Absolute Ward: Party DEF +22%, DMG Taken -15%, Initial Shield +20% (3 turns), Frontline Cover +30%.",
    "ja": "イージス・バスティオンの絶対防壁: パーティ防御力+22%、被ダメージ15%軽減、開幕シールド+20%（3ターン）、前衛援護率+30%。"
  },
  "보이드 군주의 잔영": {"en": "Void Sovereign's Echo", "ja": "ヴォイド君主の残影"},
  "보이드 스트라이더의 극의: 파티 속도 +15%, 중열 회피율 +20%, 치명타율 +12%, 치명타 피해 +35%, 방어 관통 +20%": {
    "en": "Void Strider's Pinnacle: Party SPD +15%, Mid-row Evasion +20%, Crit Rate +12%, Crit DMG +35%, DEF Piercing +20%.",
    "ja": "ヴォイド・ストライダーの極意: パーティ速度+15%、中衛回避率+20%、会心率+12%、会心ダメージ+35%、防御貫通+20%。"
  },
  "크로노 아콘의 섭리": {"en": "Chrono Archon's Providence", "ja": "クロノ・アルコンの摂理"},
  "크로노 아콘의 시공 마력핵: 파티 공격력 +18%, 전능력치 +10%, 속도 +12%, 매 턴 마나 +8 MP 회복": {
    "en": "Chrono Archon's Space-Time Core: Party ATK +18%, All Stats +10%, SPD +12%, MP Regen +8 per turn.",
    "ja": "クロノ・アルコンの時空魔力核: パーティ攻撃力+18%、全能力値+10%、速度+12%、毎ターンMP+8回復。"
  },
  "세라핌의 구원 심판": {"en": "Seraph's Salvation Judgment", "ja": "セラフィムの救済審判"},
  "세라픽 인퀴지터의 성광: 전능력치 +10%, 공격력 +15%, 매 턴 체력 4.5% 및 마나 +6 MP 재생, 흡혈 +10%": {
    "en": "Seraphic Inquisitor's Holy Light: All Stats +10%, ATK +15%, HP Regen +4.5% & MP +6 per turn, Lifesteal +10%.",
    "ja": "セラフィック・インクイジターの聖光: 全能力値+10%、攻撃力+15%、毎ターンHP4.5%＆MP+6回復、吸血+10%。"
  },
  "발할라 패황의 군세": {"en": "Valhalla Overlord's Legion", "ja": "ヴァルハラ覇皇の軍勢"},
  "발할라 워로드의 불멸 투혼: 파티 공격력 +20%, 방어력 +15%, 치명타 피해 +30%, 흡혈 +10%, 받는 피해 10% 감소": {
    "en": "Valhalla Warlord's Immortal Will: Party ATK +20%, DEF +15%, Crit DMG +30%, Lifesteal +10%, DMG Taken -10%.",
    "ja": "ヴァルハラ・ウォーロードの不滅闘魂: パーティ攻撃力+20%、防御力+15%、会心ダメージ+30%、吸血+10%、被ダメージ10%軽減。"
  },
  "오메가 데드아이의 조준": {"en": "Omega Deadeye's Crosshairs", "ja": "オメガ・デッドアイの照準"},
  "오메가 데드아이의 종말 탄환: 파티 치명타율 +18%, 치명타 피해 +45%, 방어 관통 +25%, 매 턴 마나 +5 MP 회복": {
    "en": "Omega Deadeye's Doomsday Round: Party Crit Rate +18%, Crit DMG +45%, DEF Piercing +25%, MP Regen +5 per turn.",
    "ja": "オメガ・デッドアイの終末弾丸: パーティ会心率+18%、会心ダメージ+45%、防御貫通+25%、毎ターンMP+5回復。"
  },
  "3차 초월 클래스": {"en": "Tier 3 Transcendence Class", "ja": "3次超越クラス"},

  # === Facility & Encyclopedia Guides ===
  "1층 ~ 11층 무간도 및 차원 레이드 마물": {
    "en": "1F to 11F Avici and Dimensional Raid Fiends",
    "ja": "1階〜11階無間道および次元レイド魔物"
  },
  "에테르 연금 공방(Lv.3+)에서 마도석을 소비하여 해당 부위의 장비 슬롯에 각인할 수 있습니다. (슬롯 해금은 병기창 Lv.3/5/7 연동)": {
    "en": "Consume sorcery stones at Alchemy Workshop (Lv.3+) to imprint gear slots. (Slots unlock via Armory Lv.3/5/7)",
    "ja": "エーテル錬金工房（Lv.3+）で魔導石を消費し、該当部位の装備枠に刻印できます。（枠解放は兵器廠Lv.3/5/7連動）"
  },
  "💡 [원정단 편성] ➔ [스킬 관리/서고]에서 마도서를 연독하여 개인 스킬 풀(최대 6종)에 습득하거나 마스터리(Lv.1~5)를 강화할 수 있습니다.": {
    "en": "💡 Study grimoires under [Expedition Roster] ➔ [Skill Archive] to acquire skills (up to 6) or enhance mastery (Lv.1-5).",
    "ja": "💡【遠征団編成】➔【スキル管理/書庫】で魔導書を精読し、個人スキル枠（最大6種）に習得または熟練度（Lv.1〜5）を強化できます。"
  },
  "병기창 레벨에 따라 단조 가능한 장비 등급 확률이 해금됩니다(Lv.1~2 일반, Lv.3~5 희귀, Lv.6~9 영웅, Lv.10 전설 10%). 또한 Lv.3(+5강), Lv.5(+8강), Lv.7(+10강) 단계별 장비 강화 한도 및 마도 인챈트 슬롯이 개방되고, Lv.6에서 에테르 횃불 등 강화 보급품이 해금되므로 최우선 증축해야 하는 핵심 시설입니다.": {
    "en": "Armory levels unlock gear crafting tiers (Lv.1-2 Normal, Lv.3-5 Rare, Lv.6-9 Epic, Lv.10 Legend 10%), enhancement limits (+5/+8/+10 at Lv.3/5/7), enchant slots, and advanced supplies at Lv.6.",
    "ja": "兵器廠レベルにより鍛造品質確率が解禁（Lv.1〜2一般、Lv.3〜5希少、Lv.6〜9英雄、Lv.10伝説10%）。またLv.3(+5強)、Lv.5(+8強)、Lv.7(+10強)の強化上限やエンチャ枠、Lv.6の上級補給品が解禁される最重要施設です。"
  },
  "용병의 1차 승격(Lv.1 해금), 2차 각성(Lv.5 해금), 그리고 3차 초월(Lv.8 해금) 전직 조건을 개방하는 성소입니다(실제 전직 및 각성 실행은 [원정단 편성] 영웅 카드에서 진행). 제단 증축에 따라 상위 전직 의식과 에픽 시나리오 퀘스트가 순차 개방되며, Lv.6 이상 제단은 후반부 9~10레벨 시설 증축의 선행 마일스톤 조건으로 요구됩니다.": {
    "en": "Sanctuary unlocking 1st Promotion (Lv.1), 2nd Awakening (Lv.5), and 3rd Transcendence (Lv.8) class requirements. Progression unlocks higher rituals and epic quests, serving as prerequisites for Lv.9-10 facility expansions.",
    "ja": "傭兵の1次昇格（Lv.1解禁）、2次覚醒（Lv.5解禁）、3次超越（Lv.8解禁）の転職条件を開放する聖所。祭壇増築により上位の儀式やエピッククエストが順次開放され、後半施設の先行条件となります。"
  },
  "15초마다 귀중한 마도 자원인 에테르를 정기 생산하며, [습득 스킬 강화] 및 장비 [마도 인챈트](Lv.3 해금, 최대 Lv.10 성공 확률 34%)를 담당합니다. 7레벨 이상 고급 설비 증축의 선행 인프라로 요구되므로 중반 이후 집중적인 투자가 필요합니다.": {
    "en": "Regularly produces precious Ether every 15s and handles [Skill Enhancement] and [Magic Enchanting] (Lv.3 unlock, max Lv.10 with 34% success). Essential prerequisite for Lv.7+ advanced facilities.",
    "ja": "15秒ごとに貴重な魔導資源エーテルを定期生産し、【習得スキル強化】および装備【魔導エンチャント】（Lv.3解禁、最大Lv.10成功率34%）を担当。Lv.7以上の上級施設の前提インフラです。"
  },
  "Lv.1에서 비동기 4인 편성(선발 3인 + 전술 리더 1인) [차원 결투장(아레나)], Lv.3에서 전 서버급 보스 [네메시스 월드 레이드], Lv.6에서 [차원 영지 침공 및 전술 타워 방어전]이 순차 개방됩니다. 최고 등급 투사의 인장과 명예 칭호, 대량의 에테르를 획득할 수 있는 엔드게임 멀티 컨텐츠 관문입니다.": {
    "en": "Unlocks async 4-hero [Dimensional Arena] at Lv.1, global boss [Nemesis World Raid] at Lv.3, and [Territory Invasions & Tactical Defense] at Lv.6. Endgame multi-content hub for Fighter Seals, honor titles, and massive Ether.",
    "ja": "Lv.1で4人編成【次元決闘場（アリーナ）】、Lv.3で全サーバーボス【ネメシスワールドレイド】、Lv.6で【次元領地侵攻＆防衛戦】が順次解禁。最高峰の闘士の印章と名誉称号を獲得するエンドコンテンツです。"
  },
  "성화에 목재를 공헌하여 [온기 버프]를 켜두면 생산량 +15% 증산과 거점 회복 효과를 얻습니다. 횃불과 붕대를 챙겨 심연 1구역으로 첫 척후를 파견하면 진입 즉시 퀘스트가 달성됩니다. (횃불 점화 시 마물 조우율·기습률이 감소하고 오브젝트 발견율이 증가하지만, 불빛에 마물이 반응하여 걸음당 위험도는 더 빠르게 상승합니다.)": {
    "en": "Contributing wood to the Sacred Bonfire grants the [Warmth Buff] (+15% production & HP recovery). Equip torches and bandages for Sector 1 scout missions. (Torches lower ambush rates and raise discoveries, but light attracts fiends, accelerating hazard gain per step.)",
    "ja": "聖火に木材を捧げて【温もりバフ】を維持すると生産量+15%増産と回復効果を獲得。松明と包帯を携え第1区域へ斥候を派遣すると即達成。（点火時は奇襲率減・発見率増ですが、危険度の上昇速度が増加します。）"
  },
  "💡 팁: 영혼의 제단을 건설해 해금 조건(Lv.1/5/8)을 달성한 뒤 [원정단 편성] 영웅 카드에서 상위 클래스 전직(1~3차)까지 연계할 수 있습니다.": {
    "en": "💡 Tip: Build the Soul Altar to meet tier requirements (Lv.1/5/8), then promote heroes up to 3rd Transcendence via [Expedition Roster] hero cards.",
    "ja": "💡 ヒント: 魂の祭壇を建設して解禁条件（Lv.1/5/8）を満たした後、【遠征団編成】の英雄カードから上位クラス転職（1〜3次）を行えます。"
  },
  "탐험 전리품은 던전 배낭에 임시 보관되므로 무리하게 전멸하지 말고 위험도 70% 이상이거나 위기 시 [성채 귀환]을 눌러 전리품을 안전 입고하세요. 시설 Lv.4부터는 골드/식량/에테르 유지비가 발생하므로 기초 생산량을 충분히 다지며 증축하는 것이 핵심입니다.": {
    "en": "Loot is temporarily held in dungeon backpacks; use [Return to Citadel] at 70%+ hazard to secure spoils safely. Facility upkeep starts at Lv.4, so build a strong production base before expanding.",
    "ja": "戦利品はリュックに一時保管されるため、危険度70%以上や危急時は【城塞帰還】で安全に搬入してください。施設Lv.4以降は維持費が発生するため、基礎生産を固めて増築することが肝要です。"
  },
  "기본 공격 시 대상에게 1턴간 출혈(Bleed, 최대 HP 8% 피해) 상태이상을 부여하여 지속 피해 유발 (도끼·배틀액스 포함)": {
    "en": "Basic attacks inflict [Bleed] (8% Max HP damage) for 1 turn, dealing damage over time (includes axes and battleaxes).",
    "ja": "基本攻撃時、対象に1ターンの【出血】（最大HP8%ダメージ）状態異常を付与し持続ダメージを誘発（斧・バトルアックスを含む）。"
  },
  "기본 공격 시 적의 보호막(Shield)에 50% 추가 피해를 입혀 방어선을 신속히 붕괴 (망치·해머·둔기 포함)": {
    "en": "Basic attacks deal +50% extra DMG against Shields, swiftly shattering defensive lines (includes maces, hammers, and bludgeons).",
    "ja": "基本攻撃時、敵のシールドへ+50%の追加ダメージを与えて防衛線を迅速に粉砕（槌・ハンマー・鈍器を含む）。"
  },
  "기본 공격 시 상대 마물보다 속도가 빠를수록 피해량 비례 증가 (최대 20% 증폭, 사신 낫·참살낫 포함)": {
    "en": "Basic attack damage increases proportionally to Speed advantage over the target fiend (up to +20%, includes scythes).",
    "ja": "基本攻撃時、魔物より速度が速いほどダメージが比例増加（最大+20%増幅、大鎌・死神の鎌を含む）。"
  },
  "사경 상태에서 사망한 영웅이 착용하고 있던 장비 중 무작위 단 1점만 영혼이 깃든 [유품(Memento)]으로 성채 보관함에 회수되며, 나머지 착용 장비는 심연에 유실(영구 소멸)됩니다.": {
    "en": "Only a single random piece of equipment from a permanently fallen hero is recovered to Citadel Storage as a soul-imbued [Memento]; all other gear is permanently lost in the abyss.",
    "ja": "死境で死亡した英雄の装備のうち、無作為の1点のみが魂の宿る【遺品（Memento）】として城塞保管庫へ回収され、残りは深淵で永久消失します。"
  },
  "영혼의 제단 해금 조건(1차: 제단 Lv.1 & 영웅 Lv.10 / 2차: 제단 Lv.5 & 영웅 Lv.30 / 3차: 제단 Lv.8 & 영웅 Lv.60) 달성 후 [원정단 편성] 영웅 카드에서 1차, 2차 또는 3차 전직 시, 이전 클래스의 고유 스킬과 기존에 습득했던 모든 스킬이 소멸되지 않고 [학습한 스킬] 목록(최대 6개)으로 100% 안전하게 이동 및 보존됩니다.": {
    "en": "Promoting classes at Soul Altar (T1: Altar Lv.1/Hero Lv.10, T2: Altar Lv.5/Hero Lv.30, T3: Altar Lv.8/Hero Lv.60) safely moves all previously learned skills to the [Learned Skills] pool (up to 6) without loss.",
    "ja": "魂の祭壇の条件達成後、【遠征団編成】で転職時、旧クラスの固有スキルや習得済みスキルは消失せず【習得スキル】一覧（最大6個）へ100%安全に保持・移行されます。"
  },
  "3차 초월 전직은 2차 각성 직업 Lv.60 달성 및 영혼의 제단 Lv.8 증축 후 [원정단 편성]에서 승급할 수 있는 최종 경지입니다. 3차 전직을 완료하면 모든 계열의 마도서를 페널티 없이 100% 위력으로 장착/시전하는 [만마도서] 패시브가 해금되며, 전장을 뒤흔드는 고유 초월 궁극기(오의)와 강력한 융합 패시브를 다룹니다.": {
    "en": "3rd Transcendence is the pinnacle achieved upon reaching 2nd Awakening Lv.60 and Altar Lv.8. It unlocks the [Omni-Grimoire] passive, allowing all magic grimoires to be wielded at 100% power without penalties, along with supreme transcendent ultimates and hybrid passives.",
    "ja": "3次超越転職は2次覚醒Lv.60到達および祭壇Lv.8増築後に到達できる最終境地。【万魔導書】パッシブが解禁され全系統の魔導書をペナルティなしで100%威力行使可能となり、固有超越奥義を操ります。"
  },
  "① 이지스 바스티온(절대수호/50% 반사/중·후열 피격 50% 분담 엄호, 초월기 [아발론]) ② 보이드 스트라이더(차원회피 시 회피·명중 +10% 및 공격력 +20%, 초월기 [차원참]) ③ 크로노 아콘(50% 더블캐스트, 초월기 [빅뱅 크로노스]) ④ 세라픽 인퀴지터(공격치유/치유반격, 초월기 [창공의 대심판]) ⑤ 발할라 워로드(상시흡혈/사경행동, 초월기 [피의 전술]) ⑥ 오메가 데드아이(방무50%/연쇄충격, 초월기 [궤도 섬멸])로 구성됩니다.": {
    "en": "Comprises ① Aegis Bastion (Absolute Guard/50% Reflect/Cover, Ultimate [Avalon]), ② Void Strider (Dimensional Evasion/Hit+10%/ATK+20%, Ultimate [Void Slash]), ③ Chrono Archon (50% Doublecast, Ultimate [Big Bang Chronos]), ④ Seraphic Inquisitor (Attack Heal/Counter Heal, Ultimate [Celestial Judgment]), ⑤ Valhalla Warlord (Permanent Lifesteal/Death Defiance, Ultimate [Blood Tactic]), ⑥ Omega Deadeye (50% Piercing/Chain Shock, Ultimate [Orbital Annihilation]).",
    "ja": "①イージス・バスティオン（絶対守護/反射/前衛援護、超越技【アヴァロン】）②ヴォイド・ストライダー（次元回避/命中+10%/攻撃+20%、超越技【次元斬】）③クロノ・アルコン（50%ダブルキャスト、超越技【ビッグバン・クロノス】）④セラフィック・インクイジター（攻撃回復/反撃、超越技【蒼穹の大審判】）⑤ヴァルハラ・ウォーロード（常時吸血/死境行動、超越技【血の戦術】）⑥オメガ・デッドアイ（防貫50%/連鎖、超越技【軌道殲滅】）で構成。"
  },
  "방주 의뢰소": {"en": "Ark Bounty Office", "ja": "方舟依頼所"},
  "마도서: 수호의 방패": {"en": "Grimoire: Shield of Protection", "ja": "魔導書: 守護の盾"},
  "마도서: 응급 회복": {"en": "Grimoire: Emergency Heal", "ja": "魔導書: 応急回復"},
  "마도서: 흡혈의 흉인": {"en": "Grimoire: Vampiric Blade", "ja": "魔導書: 吸血の凶刃"},
  "마도서: 아마겟돈": {"en": "Grimoire: Armageddon", "ja": "魔導書: ハルマゲドン"},
  "👤 그림자 망령: [궁극기] 무간암영참 — 시공 분신으로 적 전체 6연속 광역 난무 (총 200% 참격)": {
    "en": "👤 Shadow Wraith: [Ultimate] Avici Shadow Slash — Summons space-time clones for a 6-hit flurry across all foes (200% total slash damage).",
    "ja": "👤 影の亡霊: 【究極技】無間暗影斬 — 時空分身で敵全体に6連続乱舞（計200%斬撃）。"
  },
  "⚔️ 환영의 검성: [궁극기] 비검 만화경 — 적 전체에 220% 광역 쾌검 난무를 펼치고 2턴간 환영 반격 태세 돌입": {
    "en": "⚔️ Phantom Blademaster: [Ultimate] Flying Sword Kaleidoscope — Unleashes a 220% AOE rapid sword dance on all foes and enters Phantom Counter for 2 turns.",
    "ja": "⚔️ 幻影の剣聖: 【究極技】飛剣万華鏡 — 敵全体に220%の広域迅剣乱舞を放ち、2ターン幻影反撃態勢へ。"
  },
  "병기창 레벨에 따른 제작 장비 등급(일반~전설) 확률 해금, 5% 복리 강화 공식, 그리고 에테르 연금 공방의 장비 부위별 인챈트 시스템을 지원합니다.": {
    "en": "Supports gear tier crafting unlocks (Common to Legend), 5% compounding enhancement formulas, and slot enchantments via the Ether Alchemy Workshop.",
    "ja": "兵器廠レベルに応じた製作装備等級（一般〜伝説）確率解禁、5%複利強化式、および錬金工房の部位別エンチャントを支援。"
  },
  "병기창 단조 등급 해금: Lv.1~2 일반(Common) / Lv.3~5 희귀(Rare) / Lv.6~9 영웅(Epic) / Lv.10 전설(Legendary, 10%) 무기·방어구·장신구 단조 및 Lv.3(+5강), Lv.5(+8강), Lv.7(+10강) 강화 한도 개방": {
    "en": "Armory Crafting Tiers: Lv.1-2 Common / Lv.3-5 Rare / Lv.6-9 Epic / Lv.10 Legendary (10%) weapons, armor, accessories, and enhancement caps (+5/+8/+10 at Lv.3/5/7).",
    "ja": "兵器廠鍛造等級解禁: Lv.1〜2一般 / Lv.3〜5希少 / Lv.6〜9英雄 / Lv.10伝説（10%）の武具鍛造、およびLv.3(+5強)、Lv.5(+8強)、Lv.7(+10強)の強化上限開放。"
  },
  "3차 초월 & 2차 승격 & 1차 각성 클래스 EXP +40% 최대 (등급 상승 +27%)": {
    "en": "T3 Transcendence & T2/T1 Class EXP +40% Max (Promotion +27%)",
    "ja": "3次超越＆2次昇格＆1次覚醒クラスEXP+40%最大（昇格率+27%）"
  },
  "➔ 다음 Lv.8: ★ 3차 초월 클래스 전직 해금! & 1차 각성 EXP +30% (등급상승 24%)": {
    "en": "➔ Next Lv.8: ★ 3rd Transcendence Unlock! & T1 EXP +30% (Promotion 24%)",
    "ja": "➔ 次のLv.8: ★ 3次超越クラス転職解禁！＆1次覚醒EXP+30%（昇格率24%）"
  },
  "👑 3차초월 (1차EXP+${tier1ExpBonus}%)": {
    "en": "👑 3rd Transcendence (T1 EXP +${tier1ExpBonus}%)",
    "ja": "👑 3次超越（1次EXP+${tier1ExpBonus}%）"
  },
  "✨ 2차승격 (1차EXP+${tier1ExpBonus}%)": {
    "en": "✨ 2nd Promotion (T1 EXP +${tier1ExpBonus}%)",
    "ja": "✨ 2次昇格（1次EXP+${tier1ExpBonus}%）"
  },
  "★ ⚔️ [차원 영지 침공] 해금 (4인 결투 편성 약탈전) & 명예 상점 6단계 & PVE 치명타율 +5%": {
    "en": "★ ⚔️ [Territory Invasions] Unlock (4-Hero Plunder Sorties), Honor Shop Tier 6 & +5% PVE Crit",
    "ja": "★ ⚔️【次元領地侵攻】解禁（4人編成略奪戦）＆名誉ショップ第6段階＆PVE会心率+5%"
  }
}

# Load current delta_018
delta_path = os.path.join(OUT_DIR, 'delta_018.json')
with open(delta_path, 'r', encoding='utf-8') as f:
  current_delta = json.load(f)

# Update delta
current_delta.update(ALL_REMAINING)

with open(delta_path, 'w', encoding='utf-8') as f:
  json.dump(current_delta, f, ensure_ascii=False, indent=2)

print(f"Total entries in delta_018.json: {len(current_delta)}")

# Update ko-all.json
ko_all_path = os.path.join(ROOT, 'scripts/i18n/ko-all.json')
with open(ko_all_path, 'r', encoding='utf-8') as f:
  ko_all = json.load(f)

ko_set = set(ko_all)
added_count = 0
for k in current_delta.keys():
  if k not in ko_set:
    ko_all.append(k)
    ko_set.add(k)
    added_count += 1

with open(ko_all_path, 'w', encoding='utf-8') as f:
  json.dump(ko_all, f, ensure_ascii=False, indent=2)

print(f"Added {added_count} new keys to ko-all.json")

# Update translationDictionary.ts
dict_path = os.path.join(ROOT, 'src/i18n/translationDictionary.ts')
with open(dict_path, 'r', encoding='utf-8') as f:
  dict_content = f.read()

en_marker = '  },\n  ja: {'
en_idx = dict_content.find('  en: {')
ja_idx = dict_content.find('  ja: {')
en_sub = dict_content[en_idx:ja_idx]

en_entries = []
for k, v in current_delta.items():
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
for k, v in current_delta.items():
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

# Update generated/en.json and generated/ja.json
gen_en_path = os.path.join(ROOT, 'src/i18n/generated/en.json')
gen_ja_path = os.path.join(ROOT, 'src/i18n/generated/ja.json')

with open(gen_en_path, 'r', encoding='utf-8') as f:
  gen_en = json.load(f)
with open(gen_ja_path, 'r', encoding='utf-8') as f:
  gen_ja = json.load(f)

for k, v in current_delta.items():
  gen_en[k] = v['en']
  gen_ja[k] = v['ja']

with open(gen_en_path, 'w', encoding='utf-8') as f:
  json.dump(gen_en, f, ensure_ascii=False, indent=2)
with open(gen_ja_path, 'w', encoding='utf-8') as f:
  json.dump(gen_ja, f, ensure_ascii=False, indent=2)

print(f"Updated generated/en.json ({len(gen_en)} keys) and generated/ja.json ({len(gen_ja)} keys)")
