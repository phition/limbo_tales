import { SupportedLanguage } from './types';

export const CLASS_NAMES: Record<string, Record<SupportedLanguage, { name: string }>> = {
  warrior: { ko: { name: '전사' }, en: { name: 'Warrior' }, ja: { name: '戦士' } },
  paladin: { ko: { name: '성기사' }, en: { name: 'Paladin' }, ja: { name: '聖騎士' } },
  berserker: { ko: { name: '광전사' }, en: { name: 'Berserker' }, ja: { name: '狂戦士' } },
  rogue: { ko: { name: '도적' }, en: { name: 'Rogue' }, ja: { name: '盗賊' } },
  assassin: { ko: { name: '암살자' }, en: { name: 'Assassin' }, ja: { name: '暗殺者' } },
  knight: { ko: { name: '기사' }, en: { name: 'Knight' }, ja: { name: '騎士' } },
  sniper: { ko: { name: '저격수' }, en: { name: 'Sniper' }, ja: { name: '狙撃手' } },
  archmage: { ko: { name: '대마법사' }, en: { name: 'Archmage' }, ja: { name: '大魔導士' } },
  warlock: { ko: { name: '흑마법사' }, en: { name: 'Warlock' }, ja: { name: '黒魔術師' } },
  saintess: { ko: { name: '성녀' }, en: { name: 'Saintess' }, ja: { name: '聖女' } },
  elementalist: { ko: { name: '원소술사' }, en: { name: 'Elementalist' }, ja: { name: '元素術士' } },

  // 1차 / 2차 전직 클래스
  crusader: { ko: { name: '크루세이더' }, en: { name: 'Crusader' }, ja: { name: 'クルセイダー' } },
  templar_grandmaster: { ko: { name: '성전 기사단장' }, en: { name: 'Grandmaster Templar' }, ja: { name: 'テンプル総長' } },
  blade_lord: { ko: { name: '검성' }, en: { name: 'Blade Lord' }, ja: { name: '剣仙' } },
  heavenly_sword: { ko: { name: '천검 극의' }, en: { name: 'Heavenly Sword Saint' }, ja: { name: '天剣極意' } },
  blood_berserker: { ko: { name: '혈염 버서커' }, en: { name: 'Blood Berserker' }, ja: { name: '血炎バーサーカー' } },
  asura_warlord: { ko: { name: '아수라 군주' }, en: { name: 'Asura Warlord' }, ja: { name: '阿修羅軍主' } },
  shadow_phantom: { ko: { name: '그림자 망령' }, en: { name: 'Shadow Phantom' }, ja: { name: '影の亡霊' } },
  void_assassin: { ko: { name: '공허 처형자' }, en: { name: 'Void Executioner' }, ja: { name: '虚空処刑者' } },
  heavy_destroyer: { ko: { name: '중갑 파쇄자' }, en: { name: 'Heavy Destroyer' }, ja: { name: '重甲破砕者' } },
  champion: { ko: { name: '불패의 챔피언' }, en: { name: 'Invincible Champion' }, ja: { name: '不敗のチャンピオン' } },
  plasma_gunner: { ko: { name: '플라즈마 거너' }, en: { name: 'Plasma Gunner' }, ja: { name: 'プラズマガンナー' } },
  chronos_sniper: { ko: { name: '시공 저격사' }, en: { name: 'Chrono Marksman' }, ja: { name: '時空狙撃士' } },
  astral_sage: { ko: { name: '성운 현자' }, en: { name: 'Astral Sage' }, ja: { name: '星雲の賢者' } },
  genesis_wizard: { ko: { name: '창세 비전사' }, en: { name: 'Genesis Archon' }, ja: { name: '創世の秘術師' } },
  abyss_necromancer: { ko: { name: '심연 강령술사' }, en: { name: 'Abyssal Necromancer' }, ja: { name: '深淵の死霊術士' } },
  soul_ruler: { ko: { name: '영혼 지배자' }, en: { name: 'Soul Sovereign' }, ja: { name: '魂の支配者' } },
  divine_prophet: { ko: { name: '신성 선지자' }, en: { name: 'Divine Prophet' }, ja: { name: '神聖の預言者' } },
  valkyrie_saint: { ko: { name: '발키리 대천사' }, en: { name: 'Valkyrie Archangel' }, ja: { name: 'ヴァルキリー大天使' } },
  chaos_elementalist: { ko: { name: '혼돈 원소사' }, en: { name: 'Chaos Elementalist' }, ja: { name: '混沌元素士' } },
  primal_archon: { ko: { name: '원초 마신' }, en: { name: 'Primal Archon' }, ja: { name: '原初の魔神' } },

  // 🛡️ 성기사 계열 (Squire / Paladin / Guardian / Valkyrie / Fortress / Aegis Bastion)
  squire: { ko: { name: '견습 기사' }, en: { name: 'Squire' }, ja: { name: '見習い騎士' } },
  guardian: { ko: { name: '중장 보병' }, en: { name: 'Heavy Infantry' }, ja: { name: '重装歩兵' } },
  aegis_valkyrie: { ko: { name: '발키리' }, en: { name: 'Valkyrie' }, ja: { name: 'ヴァルキリー' } },
  fortress: { ko: { name: '포트리스' }, en: { name: 'Fortress' }, ja: { name: 'フォートレス' } },
  aegis_bastion: { ko: { name: '이지스 바스티온' }, en: { name: 'Aegis Bastion' }, ja: { name: 'イージス・バスティオン' } },

  // 🗡️ 암살자 계열 (Rogue / Assassin / Duelist / Shadow Phantom / Phantom Swordmaster / Void Strider)
  shadow_trainee: { ko: { name: '그림자 수련생' }, en: { name: 'Shadow Trainee' }, ja: { name: '影の見習い' } },
  duelist: { ko: { name: '그림자 결투사' }, en: { name: 'Shadow Duelist' }, ja: { name: '影の決闘士' } },
  blade_dancer: { ko: { name: '환영의 검성' }, en: { name: 'Phantom Swordmaster' }, ja: { name: '幻影の剣聖' } },
  void_strider: { ko: { name: '보이드 스트라이더' }, en: { name: 'Void Strider' }, ja: { name: 'ヴォイド・ストライダー' } },

  // 🔮 마법사 계열 (Apprentice / Archmage / Arcane Scholar / Chrono Tuner / Chrono Archon)
  apprentice: { ko: { name: '원소 학도' }, en: { name: 'Elemental Scholar' }, ja: { name: '元素の学徒' } },
  calamity_mage: { ko: { name: '아크 메이지' }, en: { name: 'Archmage' }, ja: { name: 'アークメイジ' } },
  arcane_scholar: { ko: { name: '비전 학자' }, en: { name: 'Arcane Scholar' }, ja: { name: '秘術の学者' } },
  chronomancer: { ko: { name: '시공의 조율사' }, en: { name: 'Spacetime Tuner' }, ja: { name: '時空の調律者' } },
  chrono_archon: { ko: { name: '크로노 아콘' }, en: { name: 'Chrono Archon' }, ja: { name: 'クロノ・アルコン' } },

  // 🕊️ 사제 / 성전사 계열 (Acolyte / Bishop / War Priest / Holy Savior / Crusader Lord / Seraphic Inquisitor)
  acolyte: { ko: { name: '견습 사제' }, en: { name: 'Acolyte' }, ja: { name: '見習い司祭' } },
  bishop: { ko: { name: '주교' }, en: { name: 'Bishop' }, ja: { name: '司教' } },
  war_priest: { ko: { name: '전투 사제' }, en: { name: 'War Priest' }, ja: { name: '戦闘司祭' } },
  high_saintess: { ko: { name: '성령의 구원자' }, en: { name: 'Holy Savior' }, ja: { name: '聖霊の救済者' } },
  crusader_lord: { ko: { name: '성전의 심판관' }, en: { name: 'Judge of Crusade' }, ja: { name: '聖戦の審判官' } },
  seraphic_inquisitor: { ko: { name: '세라픽 인퀴지터' }, en: { name: 'Seraphic Inquisitor' }, ja: { name: 'セラフィック・インクイジター' } },

  // 🪓 광전사 / 선봉 계열 (Vanguard / Berserker / Tactical Commander / Valhalla Blade / Ironblood Overlord / Valhalla Warlord)
  vanguard: { ko: { name: '용병 검사' }, en: { name: 'Mercenary Swordsman' }, ja: { name: '傭兵剣士' } },
  warlord: { ko: { name: '전술 지휘관' }, en: { name: 'Tactical Commander' }, ja: { name: '戦術指揮官' } },
  valhalla_blade: { ko: { name: '발할라 블레이드' }, en: { name: 'Valhalla Blade' }, ja: { name: 'ヴァルハラ・ブレード' } },
  iron_marshal: { ko: { name: '철혈의 패황' }, en: { name: 'Ironblood Overlord' }, ja: { name: '鉄血の覇皇' } },
  valhalla_warlord: { ko: { name: '발할라 워로드' }, en: { name: 'Valhalla Warlord' }, ja: { name: 'ヴァルハラ・ウォーロード' } },

  // 🎯 거너 / 저격 계열 (Gunner / Tactical Cannoneer / Abyssal Sniper / Hyper Ranger / Reaper Sharpshooter / Omega Deadeye)
  gunner: { ko: { name: '마총 수련생' }, en: { name: 'Gunner Trainee' }, ja: { name: '魔銃見習い' } },
  tactical_gunner: { ko: { name: '전술 포수' }, en: { name: 'Tactical Cannoneer' }, ja: { name: '戦術砲手' } },
  sharpshooter: { ko: { name: '심연의 저격수' }, en: { name: 'Abyssal Sniper' }, ja: { name: '深淵の狙撃手' } },
  aether_gun_meister: { ko: { name: '하이퍼 레인저' }, en: { name: 'Hyper Ranger' }, ja: { name: 'ハイパーレンジャー' } },
  ghost_sniper: { ko: { name: '사신 저격수' }, en: { name: 'Reaper Sharpshooter' }, ja: { name: '死神狙撃手' } },
  omega_deadeye: { ko: { name: '오메가 데드아이' }, en: { name: 'Omega Deadeye' }, ja: { name: 'オメガ・デッドアイ' } },
};

export const BUILDING_NAMES: Record<string, Record<SupportedLanguage, { name: string; desc: string }>> = {
  bonfire: {
    ko: { name: '방주의 성화', desc: '신성한 성화. 목재를 공헌하여 생산량 +15%, 전투 EXP +20%, 영지 용병 지속 재생 온기 버프를 활성화합니다.' },
    en: { name: 'Primal Bonfire', desc: 'Sacred flame. Offer wood to activate warmth buff for +15% production, +20% Combat EXP, and continuous regeneration for mercenaries.' },
    ja: { name: '方舟の聖火', desc: '神聖なる聖火。木材を捧げて生産量+15%、戦闘EXP+20%、領地傭兵持続再生の温もりバフを有効化します。' }
  },
  cabin: {
    ko: { name: '생존자 안식처', desc: '구출된 생존자 거주지. 방주에 세금(골드)을 13초마다 정기 납부합니다.' },
    en: { name: 'Survivor Haven', desc: 'Shelter for rescued survivors. Regularly pays taxes (Gold) to the Ark every 13s.' },
    ja: { name: '生存者の安息所', desc: '救出された生存者の居住区。13秒ごとに方舟へ税金（ゴールド）を定期納付します。' }
  },
  lumberCamp: {
    ko: { name: '영목 벌채소', desc: '방주 외곽 목재 벌채 시설. 영지 증축과 성화 유지에 필요한 목재를 9초마다 생산합니다.' },
    en: { name: 'Lumber Camp', desc: 'Ark outer timber mill. Harvests wood every 9s required for citadel expansion & bonfire maintenance.' },
    ja: { name: '霊木伐採所', desc: '方舟郊外の伐採施設。領地増築と聖火維持に必要な木材を9秒ごとに生産する。' }
  },
  quarry: {
    ko: { name: '에테르 광맥 시추소', desc: '부유성 지반 채굴 시설. 11초마다 석재를 생산하며 점차 철광석도 함께 발굴합니다.' },
    en: { name: 'Aether Quarry', desc: 'Floating citadel bedrock quarry. Produces stone every 11s and gradually excavates iron ore as well.' },
    ja: { name: 'エーテル鉱脈採掘所', desc: '浮遊城の地盤採掘施設。11秒ごとに石材を生産し、次第に鉄鉱石も発掘する。' }
  },
  butchery: {
    ko: { name: '심연 생체 정제소', desc: '식량 정제 시설. 13초마다 보급 식량을 생산하고 무두질 가죽을 가공합니다.' },
    en: { name: 'Abyssal Refinery', desc: 'Food refinery. Produces rations and processes tanned leather every 13s.' },
    ja: { name: '深淵生体精製所', desc: '食料精製施設。13秒ごとに補給食料を生産し、鞣し革を加工します。' }
  },
  tavern: {
    ko: { name: '방랑자의 라운지', desc: '용병 고용소. 방랑 용병을 계약 영입하고 서브 퀘스트를 수주하며 식량을 조달합니다.' },
    en: { name: 'Wanderer Lounge', desc: 'Mercenary guild. Recruits wandering mercenaries, accepts sub-quests, and procures food.' },
    ja: { name: '放浪者のラウンジ', desc: '傭兵雇用所。放浪傭兵を契約加入させ、サブクエストを受注し食糧を調達します。' }
  },
  blacksmith: {
    ko: { name: '심연의 병기창', desc: '장비 공방. 전술 무기 및 방어구 단조, 장비 강화 및 인챈트를 수행합니다.' },
    en: { name: 'Ark Armory & Forge', desc: 'Tactical armory. Forge weapons/armor, enhance equipment, and apply enchants.' },
    ja: { name: '深淵の兵器廠', desc: '装備工房。戦術武器・防具の鍛造、装備強化およびエンチャントを行います。' }
  },
  sanctuary: {
    ko: { name: '영혼의 제단', desc: '클래스 승격 시설. 용병들의 상위 클래스 전직과 초월 각성을 집전합니다.' },
    en: { name: 'Soul Sanctuary', desc: 'Class promotion facility. Conducts class promotions and transcendent awakenings for mercenaries.' },
    ja: { name: '魂の祭壇', desc: 'クラス昇格施設。傭兵の上位クラス転職と超越覚醒を執り行います。' }
  },
  alchemy: {
    ko: { name: '에테르 연금 공방', desc: '에테르 연금 및 마도 시설. 15초마다 에테르를 정기 생산하고 마도서를 제본합니다.' },
    en: { name: 'Aether Alchemy Lab', desc: 'Ether alchemy and magic facility. Regularly produces ether every 15s and crafts grimoires.' },
    ja: { name: 'エーテル錬金工房', desc: 'エーテル錬金および魔導施設。15秒ごとにエーテルを定期生産し魔導書を製本します。' }
  },
  arenaGate: {
    ko: { name: '차원 앵커 게이트', desc: '차원 관문. 비동기 랭킹 결투, 네메시스 레이드 및 차원 영지 침공을 지원합니다.' },
    en: { name: 'Dimensional Gate', desc: 'Dimensional Gate. Supports asynchronous ranking duels, Nemesis raids, and dimensional territory invasions.' },
    ja: { name: '次元アンカーゲート', desc: '次元関門。非同期ランキング決闘、ネメシスレイドおよび次元領地侵攻を支援します。' }
  },
  storage: {
    ko: { name: '방주 중앙 병참고', desc: '방주 중앙 물자 저장고. 레벨에 따라 27종 모든 자원의 최대 적재 용량을 확장합니다.' },
    en: { name: 'Central Logistics Depot', desc: 'Central logistics depot of the Ark. Expands maximum storage capacity for all 27 resources according to level.' },
    ja: { name: '方舟中央兵站庫', desc: '方舟中央物資保管庫。レベルに応じて全27種の全資源の最大積載容量を拡張する。' }
  },
  infirmary: {
    ko: { name: '생체 복원 병동', desc: '의료 시설. 부상당한 용병을 입원시켜 체력과 마나를 복원합니다.' },
    en: { name: 'Bio-Restoration Ward', desc: 'Medical ward. Hospitalizes wounded heroes to recover HP and MP.' },
    ja: { name: '生体復元病棟', desc: '医療施設。負傷した傭兵を入院させHPとMPを復元します。' }
  },
  market: {
    ko: { name: '황혼의 블랙 마켓', desc: '암시장 교역소. 15종 자원 거래 및 환전을 지원하며 상업 골드를 수급합니다.' },
    en: { name: 'Twilight Black Market', desc: 'Contraband trading post. Supports trading 15 types of resources, currency exchange, and earns commerce Gold.' },
    ja: { name: '黄昏のブラックマーケット', desc: '闇市交易所。15種の資源取引や換金をサポートし、商業ゴールドを調達します。' }
  },
  // 알리아스 호환
  forge: {
    ko: { name: '방주 병기창', desc: '장비 단조 및 마도 인챈트' },
    en: { name: 'Ark Armory & Forge', desc: 'Craft gear & apply arcane enchants' },
    ja: { name: '方舟兵器廠', desc: '装備製造と魔導エンチャント' }
  },
  black_market: {
    ko: { name: '심연 블랙 마켓', desc: '전리품 매각 및 암시장 거래' },
    en: { name: 'Abyssal Black Market', desc: 'Liquidate loot & trade contraband' },
    ja: { name: '深淵ブラックマーケット', desc: '戦利品売却と闇市取引' }
  },
  arena: {
    ko: { name: '영광의 결투장', desc: '지휘관 간 비동기 PVP 결투' },
    en: { name: 'Colosseum of Glory', desc: 'Asynchronous PVP expedition duels' },
    ja: { name: '栄光の闘技場', desc: '指揮官同士の非同期PVP決闘' }
  },
  dungeon_entry: {
    ko: { name: '심연 심층 탐험', desc: '심연의 어둠 속으로 강하합니다' },
    en: { name: 'Abyssal Descent', desc: 'Descend into the depths of the Abyss' },
    ja: { name: '深淵深層探検', desc: '深淵の深部へ降下します' }
  },
  barracks: {
    ko: { name: '원정대 병영', desc: '용병 고용 및 파티 편성' },
    en: { name: 'Expedition Barracks', desc: 'Recruit and organize mercenaries' },
    ja: { name: '遠征隊兵舎', desc: '傭兵雇用とパーティ編成' }
  },
  lounge: {
    ko: { name: '방랑자의 라운지', desc: 'NPC 의뢰 및 현상금 수락' },
    en: { name: 'Wanderer Lounge', desc: 'Accept contracts & bounty quests' },
    ja: { name: '放浪者のラウンジ', desc: 'NPC依頼や賞金首クエスト' }
  },
};

export const RESOURCE_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  gold: { ko: '골드', en: 'Gold', ja: 'ゴールド' },
  wood: { ko: '목재', en: 'Wood', ja: '木材' },
  stone: { ko: '석재', en: 'Stone', ja: '石材' },
  iron: { ko: '철광석', en: 'Iron Ore', ja: '鉄鉱石' },
  food: { ko: '식량', en: 'Food', ja: '食糧' },
  dungeon_food: { ko: '던전 식량', en: 'Dungeon Food', ja: 'ダンジョン食糧' },
  ether: { ko: '에테르', en: 'Ether', ja: 'エーテル' },
  leather: { ko: '가죽', en: 'Leather', ja: '革' },
  herb: { ko: '약초', en: 'Herb', ja: '薬草' },
  coal: { ko: '석탄', en: 'Coal', ja: '石炭' },
  silk: { ko: '실크', en: 'Silk', ja: 'シルク' },
  bone: { ko: '짐승 뼈', en: 'Bone', ja: '骨' },
  crystal: { ko: '마력수정', en: 'Magic Crystal', ja: '魔力結晶' },
  void_shard: { ko: '공허파편', en: 'Void Shard', ja: '虚無の欠片' },
  dark_essence: { ko: '암흑 정수', en: 'Dark Essence', ja: '暗黒エッセンス' },
  prefix_stone: { ko: '일반 접두석', en: 'Prefix Stone', ja: '一般接頭石' },
  suffix_stone: { ko: '일반 접미석', en: 'Suffix Stone', ja: '一般接尾石' },
  pure_prefix_stone: { ko: '순수 접두석', en: 'Pure Prefix Stone', ja: '純粋接頭石' },
  pure_suffix_stone: { ko: '순수 접미석', en: 'Pure Suffix Stone', ja: '純粋接尾石' },
  pure_mana_stone: { ko: '순수 마도석', en: 'Pure Mana Stone', ja: '純粋魔導石' },
  potion: { ko: '체력 포션', en: 'Health Potion', ja: '体力ポーション' },
  torch: { ko: '횃불', en: 'Torch', ja: '松明' },
  pickaxe: { ko: '곡괭이', en: 'Pickaxe', ja: 'ツルハシ' },
  bandage: { ko: '붕대', en: 'Bandage', ja: '包帯' },
  holy_water: { ko: '정화의 성수', en: 'Holy Water', ja: '浄化の聖水' },
  key: { ko: '던전 열쇠', en: 'Dungeon Key', ja: 'ダンジョンの鍵' },
  skeleton_key: { ko: '녹슨 만능열쇠', en: 'Skeleton Key', ja: '万能鍵' },
  rift_anchor: { ko: '균열의 닻', en: 'Rift Anchor', ja: '亀裂の錨' },
  golden_toad: { ko: '황금 두꺼비', en: 'Golden Toad', ja: '黄金のヒキガエル' },
  compass: { ko: '차원의 나침반', en: 'Dimensional Compass', ja: '次元の羅針盤' },
  blood_contract: { ko: '피의 서약서', en: 'Blood Contract', ja: '血の契約書' },
  dimensional_whistle: { ko: '차원의 호각', en: 'Dimensional Whistle', ja: '次元の角笛' },
  enhanced_torch: { ko: '에테르 횃불', en: 'Ether Torch', ja: 'エーテル松明' },
  enhanced_food: { ko: '던전 도시락', en: 'Dungeon Lunchbox', ja: 'ダンジョン弁当' },
  enhanced_pickaxe: { ko: '심연 곡괭이', en: 'Abyssal Pickaxe', ja: '深淵のツルハシ' },
  enhanced_bandage: { ko: '성유 붕대', en: 'Holy Oil Bandage', ja: '聖油の包帯' },
  enhanced_holy_water: { ko: '여신의 성수', en: 'Goddess Holy Water', ja: '女神の聖水' },
  enhanced_key: { ko: '황금 열쇠', en: 'Golden Key', ja: '黄金の鍵' },
  enhanced_rift_anchor: { ko: '심연의 닻', en: 'Abyssal Anchor', ja: '深淵の錨' },
  gold_bag: { ko: '골드 주머니', en: 'Gold Pouch', ja: 'ゴールドの袋' },

  // 🔮 층별 보스 성유물
  relic_floor_1: { ko: '침묵의 흑핵', en: 'Silent Black Core', ja: '沈黙の黒核' },
  relic_floor_2: { ko: '망령의 영혼수정', en: 'Phantom Soul Crystal', ja: '亡霊の魂結晶' },
  relic_floor_3: { ko: '원초의 광맥 심장', en: 'Primal Vein Heart', ja: '原初の鉱脈心臓' },
  relic_floor_4: { ko: '심연의 시공 닻', en: 'Chrono Anchor of Abyss', ja: '深淵の時空錨' },
  relic_floor_5: { ko: '공허 지배자의 모노리스 핵', en: 'Void Monolith Core', ja: '虚無のモノリス核' },
  relic_floor_6: { ko: '핏빛 대공의 진홍 성배', en: 'Blood Archduke Grail', ja: '深紅の大公聖杯' },
  relic_floor_7: { ko: '망각 묘지기의 영혼 나침반', en: 'Graveyard Soul Compass', ja: '忘却墓守の魂羅針盤' },
  relic_floor_8: { ko: '단죄의 기사단장 맹세 휘장', en: 'Order Commander Crest', ja: '断罪騎士団長の紋章' },
  relic_floor_9: { ko: '미궁 지배자의 진실 거울 파편', en: 'Mirror Shard of Truth', ja: '真実の鏡の破片' },
  relic_floor_10: { ko: '심연 군주의 옥새', en: 'Abyssal Overlord Seal', ja: '深淵覇王の玉璽' },

  // 📜 1F~10F 회고록 쪽지
  memoir_note_1: { ko: '1층 회고록 쪽지', en: '1F Memoir Note', ja: '1層の回顧録メモ' },
  memoir_note_2: { ko: '2층 회고록 쪽지', en: '2F Memoir Note', ja: '2層の回顧録メモ' },
  memoir_note_3: { ko: '3층 회고록 쪽지', en: '3F Memoir Note', ja: '3層の回顧録メモ' },
  memoir_note_4: { ko: '4층 회고록 쪽지', en: '4F Memoir Note', ja: '4層の回顧録メモ' },
  memoir_note_5: { ko: '5층 회고록 쪽지', en: '5F Memoir Note', ja: '5層の回顧録メモ' },
  memoir_note_6: { ko: '6층 회고록 쪽지', en: '6F Memoir Note', ja: '6層の回顧録メモ' },
  memoir_note_7: { ko: '7층 회고록 쪽지', en: '7F Memoir Note', ja: '7層の回顧録メモ' },
  memoir_note_8: { ko: '8층 회고록 쪽지', en: '8F Memoir Note', ja: '8層の回顧録メモ' },
  memoir_note_9: { ko: '9층 회고록 쪽지', en: '9F Memoir Note', ja: '9層の回顧録メモ' },
  memoir_note_10: { ko: '10층 회고록 쪽지', en: '10F Memoir Note', ja: '10層の回顧録メモ' },

  // 🏛️ 1F~10F 고대 오파츠 (구세계 유물)
  ooparts_1_1: { ko: '금이 간 스마트폰 액정', en: 'Cracked Smartphone Screen', ja: 'ヒビ入りのスマホ画面' },
  ooparts_1_2: { ko: '녹슨 스테인리스 텀블러', en: 'Rusted Stainless Tumbler', ja: '錆びたステンレスタンブラー' },
  ooparts_2_1: { ko: '빛바랜 플라스틱 신용카드', en: 'Faded Credit Card', ja: '色あせたクレジットカード' },
  ooparts_2_2: { ko: '먼지 쌓인 카세트 테이프', en: 'Dusty Cassette Tape', ja: '埃まみれのカセットテープ' },
  ooparts_3_1: { ko: '방전된 리튬 배터리', en: 'Depleted Lithium Battery', ja: '放電したリチウム電池' },
  ooparts_3_2: { ko: '금이 간 세라믹 머그잔', en: 'Cracked Ceramic Mug', ja: 'ヒビ入りのマグカップ' },
  ooparts_4_1: { ko: '찢겨진 지하철 노선도', en: 'Torn Subway Map', ja: '破れた地下鉄路線図' },
  ooparts_4_2: { ko: '멈춰버린 쿼츠 손목시계', en: 'Frozen Quartz Watch', ja: '止まったクォーツ時計' },
  ooparts_5_1: { ko: '부서진 헤드폰', en: 'Broken Headphones', ja: '壊れたヘッドホン' },
  ooparts_5_2: { ko: '비닐 코팅된 학생증', en: 'Laminated Student ID', ja: 'ラミネート学生証' },
  ooparts_6_1: { ko: '녹슨 와인 오프너', en: 'Rusted Wine Opener', ja: '錆びたワインオープナー' },
  ooparts_6_2: { ko: '말라붙은 립스틱 케이스', en: 'Dried Lipstick Case', ja: '乾いた口紅ケース' },
  ooparts_7_1: { ko: '빛바랜 폴라로이드 사진', en: 'Faded Polaroid Photo', ja: '色あせたポラロイド写真' },
  ooparts_7_2: { ko: '굳어버린 3색 볼펜', en: 'Dried 3-Color Pen', ja: '固まった3色ボールペン' },
  ooparts_8_1: { ko: '부서진 무전기 트랜시버', en: 'Broken Radio Transceiver', ja: '壊れたトランシーバー' },
  ooparts_8_2: { ko: '찌그러진 티타늄 안경테', en: 'Bent Titanium Glasses', ja: '歪んだチタン眼鏡' },
  ooparts_9_1: { ko: '홀로그램 디스플레이 큐브', en: 'Hologram Display Cube', ja: 'ホログラムキューブ' },
  ooparts_9_2: { ko: '녹아내린 카메라 렌즈', en: 'Melted Camera Lens', ja: '溶けたカメラレンズ' },
  ooparts_10_1: { ko: '양자 코어 칩셋', en: 'Quantum Core Chipset', ja: '量子コアチップセット' },
  ooparts_10_2: { ko: '타임캡슐 황동 열쇠', en: 'Time Capsule Brass Key', ja: 'タイムカプセル真鍮の鍵' },
};

/** 데이터 명칭/설명 로컬라이징 헬퍼 */
export function getLocalizedClassName(classId: string, lang: SupportedLanguage): string {
  return CLASS_NAMES[classId]?.[lang]?.name || classId;
}

export function getLocalizedBuildingName(buildingId: string, lang: SupportedLanguage): { name: string; desc: string } {
  return BUILDING_NAMES[buildingId]?.[lang] || { name: buildingId, desc: '' };
}

export function getLocalizedResourceName(resourceKey: string, lang: SupportedLanguage): string {
  return RESOURCE_NAMES[resourceKey]?.[lang] || resourceKey;
}
