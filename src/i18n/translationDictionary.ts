import { SupportedLanguage } from './types';

// ============================================================================
// 1. EXACT STRING MATCHES (UI, Labels, Buttons, Facilities, Perks, Lore, Modals)
// ============================================================================
export const EXACT_TRANSLATIONS: Record<'en' | 'ja', Record<string, string>> = {
  en: {
    '로웰': 'Lowell',
    '단련된 일격': 'Tempered Strike',
    '방패 올리기': 'Raise Shield',
    '불굴의 결의': 'Indomitable Will',
    '단죄의 일격': 'Condemnation Strike',
    '신성 방벽': 'Holy Barrier',
    '홀리 오라': 'Holy Aura',
    '방패 강타': 'Shield Bash',
    '철벽의 태세': 'Iron Stance',
    '절대 방진': 'Absolute Formation',
    '심판의 빛창': 'Spear of Judgement',
    '신의 가호': 'Divine Grace',
    '영원의 성역': 'Sanctuary of Eternity',
    '[궁극기] 영원의 성역': '[Ultimate] Sanctuary of Eternity',
    '급소 찌르기': 'Vitals Thrust',
    '연막탄': 'Smoke Screen',
    '암영 난무': 'Shadow Flurry',
    '암영 연격': 'Shadow Combo',
    '독무 연격': 'Poison Mist Combo',
    '심장 꿰뚫기': 'Heart Piercer',
    '심연의 도약': 'Abyssal Leap',
    '분신 난무': 'Mirror Clone Dance',
    '무간암영참': 'Endless Shadow Slash',
    '[궁극기] 무간암영참': '[Ultimate] Endless Shadow Slash',
    '환영의 반격': 'Phantom Riposte',
    '질풍 4연참': 'Gale Quad Strike',
    '환영 난무 왈츠': 'Phantom Waltz',
    '에테르 볼트': 'Aether Bolt',
    '원소 폭발': 'Elemental Blast',
    '에테르 과충전': 'Aether Overcharge',
    '연쇄 번개': 'Chain Lightning',
    '혹한의 눈보라': 'Bitter Blizzard',
    '원소 초신성': 'Elemental Supernova',
    '공허의 특이점': 'Void Singularity',
    '비전 폭풍': 'Arcane Storm',
    '종말의 메테오': 'Meteor of the End',
    '[궁극기] 종말의 메테오': '[Ultimate] Meteor of the End',
    '치유의 기도': 'Prayer of Healing',
    '신성 광휘': 'Holy Radiance',
    '소생의 기도': 'Prayer of Revive',
    '[궁극기] 소생의 기도': '[Ultimate] Prayer of Revive',
    '대성녀의 축복': 'High Saintess Blessing',
    '구원의 빛': 'Light of Salvation',
    '[궁극기] 부활의 성가': '[Ultimate] Hymn of Resurrection',
    '대검 베어가르기': 'Greatsword Cleave',
    '전사의 함성': 'Warrior Shout',
    '분노의 일격': 'Furious Strike',
    '혈풍참': 'Blood Wind Slash',
    '피의 폭주': 'Blood Frenzy',
    '광란의 대지분쇄': 'Raging Earth Shatter',
    '라그나로크 슬래시': 'Ragnarok Slash',
    '불멸의 포효': 'Immortal Roar',
    '[궁극기] 불멸의 결전분노': '[Ultimate] Immortal Battle Fury',
    '진격의 지휘 함성': 'Command Shout of Advance',
    '파성추 강타': 'Battering Ram Slam',
    '전열 압도': 'Vanguard Overpower',
    '에테르 2점사': 'Aether Burst Shot',
    '섬광탄 사격': 'Flash Shot',
    '정밀 조준사격': 'Precision Aimed Shot',
    '레일건 관통포': 'Railgun Piercer',
    '전술 드론 호출': 'Call Tactical Drone',
    '궤도 조명 폭격': 'Orbital Bombardment',
    '치명적 헤드샷': 'Lethal Headshot',
    '그림자 위장술': 'Shadow Camouflage',
    '심연 관통탄': 'Abyssal Armor Piercer',
    '하이퍼 펄스 버스터': 'Hyper Pulse Buster',
    '오버클럭 리로드': 'Overclock Reload',
    '궤도 에테르 버스터': 'Orbital Aether Buster',
    '[궁극기] 궤도 에테르 버스터': '[Ultimate] Orbital Aether Buster',
    '중력장 소환': 'Gravity Field',
    '시공 왜곡': 'Spacetime Warp',
    '아케인 오버로드': 'Arcane Overload',
    '성스러운 파동': 'Sacred Wave',
    '성역의 광채': 'Sanctuary Radiance',
    '신성 집결': 'Holy Rally',
    '성전 강타': 'Crusade Smite',
    '성지 정화 결계': 'Purifying Barrier',
    '성전 선포': 'Declaration of Crusade',
    '성벽 전개': 'Deploy Bulwark',
    '지진 분쇄타': 'Earthquake Smash',
    '[궁극기] 절대 요새의 성역': '[Ultimate] Absolute Fortress Sanctuary',
    '환영의 안개': 'Phantom Mist',
    '유령의 일격': 'Ghostly Strike',
    '무한 환영무': 'Infinite Phantom Dance',
    '[궁극기] 무한 환영무': '[Ultimate] Infinite Phantom Dance',
    '폭풍우의 눈': 'Eye of the Storm',
    '번개 폭풍': 'Lightning Tempest',
    '천벌의 뇌우': 'Thunderstorm of Wrath',
    '[궁극기] 천벌의 뇌우': '[Ultimate] Thunderstorm of Wrath',
    '은총의 성역': 'Sanctuary of Grace',
    '생명의 숨결': 'Breath of Life',
    '기적의 성스러운 비': 'Sacred Rain of Miracles',
    '[궁극기] 기적의 성스러운 비': '[Ultimate] Sacred Rain of Miracles',
    '심연의 암흑탄': 'Abyssal Dark Bullet',
    '암흑 분열탄': 'Dark Cluster Shot',
    '종말의 검은 폭풍': 'Black Storm of the End',
    '[궁극기] 종말의 검은 폭풍': '[Ultimate] Black Storm of the End',
    '방패 방어': 'Shield Defense',
    '응급 처치': 'First Aid',
    '약점 찌르기': 'Weakness Pierce',
    '에테르 화살': 'Aether Arrow',
    '화염 강타': 'Flame Strike',
    '철벽의 방진': 'Iron Wall Formation',
    '전장의 포효': 'Battle Roar',
    '신성한 축복': 'Divine Blessing',
    '그림자 습격': 'Shadow Raid',
    '축복의 베일': 'Blessing Veil',
    '천둥의 벼락': 'Thunder Strike',
    '그림자 암살': 'Shadow Assassination',
    '[궁극기] 그림자 암살': '[Ultimate] Shadow Assassination',
    // ── 공통 UI & 버튼 ──
    '확인': 'Confirm',
    '취소': 'Cancel',
    '닫기': 'Close',
    '뒤로': 'Back',
    '뒤로가기': 'Back',
    '저장': 'Save',
    '삭제': 'Delete',
    '초기화': 'Reset',
    '적용': 'Apply',
    '수령': 'Claim',
    '보상 수령': 'Claim Reward',
    '보상 받기': 'Claim Reward',
    '완료': 'Complete',
    '진행 중': 'In Progress',
    '성공': 'Success',
    '실패': 'Failed',
    '레벨': 'Level',
    '골드': 'Gold',
    '에테르': 'Ether',
    '목재': 'Wood',
    '석재': 'Stone',
    '철광석': 'Iron Ore',
    '식량': 'Food',
    '체력': 'HP',
    '마나': 'MP',
    '공격력': 'ATK',
    '방어력': 'DEF',
    '속도': 'SPD',
    '행운': 'LUCK',
    '치명타율': 'CRIT',
    '전열': 'Front',
    '중열': 'Mid',
    '후열': 'Back',
    '장착': 'Equip',
    '해제': 'Unequip',
    '장착 해제': 'Unequip',
    '장착 중': 'Equipped',
    '보유': 'Owned',
    '수량': 'Qty',
    '강화': 'Enhance',
    '단조': 'Craft',
    '인챈트': 'Enchant',
    '승격': 'Promote',
    '전직': 'Class Change',
    '고용': 'Hire',
    '퇴원': 'Discharge',
    '입원': 'Hospitalize',
    '치료': 'Treat',
    '출전': 'Deploy',
    '편성': 'Form Party',
    '자동전투': 'Auto Battle',
    '자동전투 시작': 'Start Auto Battle',
    '자동전투 중지': 'Stop Auto Battle',
    '전투 철수': 'Retreat from Battle',
    '철수 불가': 'Cannot Retreat',
    '전투 승리': 'Battle Victory',
    '전투 패배': 'Battle Defeat',
    '보스 토벌 대승리': 'Boss Slain - Grand Victory',
    '상세 로그': 'Detailed Logs',
    '전투 상세 기록': 'Combat Detailed Record',
    '기본 공격': 'Basic Attack',
    'MP 부족': 'Not Enough MP',
    '쿨다운': 'Cooldown',
    '턴': 'Turn',
    '라운드': 'Round',
    '행동자': 'Actor',
    '최신 로그 보기': 'View Latest Logs',
    '❄️ 빙결': '❄️ Freeze',
    '💫 기절': '💫 Stun',
    '심연 전진 탐색': 'Advance into Abyss',
    '야영 및 모닥불 휴식': 'Camp & Rest at Bonfire',
    '성채로 안전 귀환': 'Safely Return to Citadel',
    '심연 위험도': 'Abyssal Hazard',
    '안정': 'Safe',
    '위험': 'Hazardous',
    '치명적 위험': 'Deadly Hazard',
    '귀환 포탈 발견': 'Return Portal Discovered',
    '포탈을 타고 성채로 귀환': 'Enter Portal to Citadel',
    '심연 탐험 계속하기': 'Continue Abyssal Expedition',
    '심연 오버차지 발동 중': 'Abyssal Overcharge Active',
    '영광의 결투장': 'Colosseum of Glory',
    '대전 상대 탐색': 'Search Opponent',
    '매칭 중...': 'Matching...',
    '결투 시작': 'Begin Duel',
    '최근 전적': 'Recent History',
    '현재 레이팅': 'Current Rating',

    // ── 시스템 메뉴 & 설정 ──
    '시스템 & 클라우드': 'System & Cloud',
    '지휘관 프로필': 'Commander Profile',
    '인증 완료': 'Linked',
    '게스트 계정': 'Guest Account',
    '오디오 & 사운드 설정': 'Audio & Sound Settings',
    '배경음악 (BGM)': 'Background Music (BGM)',
    '효과음 (SFX)': 'Sound Effects (SFX)',
    '사운드 테스트': 'Sound Test',
    '실시간 클라우드 동기화': 'Real-time Cloud Sync',
    '전체화면 모드': 'Fullscreen Mode',
    '언어 설정': 'Language Settings',
    '방주 백과사전 & 도감': 'Ark Encyclopedia & Compendium',
    '버전 정보 & 패치노트': 'Version & Patch Notes',
    '지휘관 로그아웃': 'Commander Logout',
    '게임 데이터 초기화': 'Reset Game Data',

    // ── 백과사전 카테고리 탭 ──
    '전체': 'All',
    '초반 공략': 'Starter Guide',
    '직업 & 전직': 'Classes & Trees',
    '몬스터 & 보스': 'Monsters & Bosses',
    '영지 시설': 'Facilities',
    '장비 & 인챈트': 'Gear & Enchants',
    '스킬 & 상태이상': 'Skills & Statuses',
    '시스템 & 가이드': 'Systems & Guides',

    // ── 초반 공략 단계 (Starter Steps) ──
    '기초 4대 채집 시설 완공 & 퀘스트 [보상 수령]': 'Construct 4 Basic Gathering Facilities & Claim Quest Rewards',
    '목재 20개로 [심연 생체 정제소]를 건설한 뒤 상단 퀘스트 메뉴(📜)에서 깜빡이는 [보상 수령]을 반드시 터치하세요! 연이어 [생존자 안식처](골드), [영목 벌채소](목재), [광맥 시추소](석재/철광)가 순차 해금되며 초기 자본과 생산 라인이 확보됩니다.': 'Build the [Abyssal Refinery] with 20 wood and claim the blinking reward in the Quest Menu (📜)! This unlocks [Survivor Haven] (Gold), [Lumber Camp] (Wood), and [Aether Quarry] (Stone/Iron) in sequence to establish baseline economy.',
    '💡 팁: 퀘스트 보상을 수령하지 않으면 다음 핵심 테크 시설이 해금되지 않습니다.': '💡 Tip: Core tech facilities will not unlock until you claim pending quest rewards.',
    '초기 비전서 전수 & 진형 세팅 (탱·딜·힐 배치)': 'Initial Grimoire Learning & Formation Setup (Tank/DPS/Healer)',
    '용병단 메뉴에서 기본 지급된 마도 비전서를 전수하세요. 전열 아이리스에게 [강타], 중앙 시안에게 [출혈/암습]을 세팅합니다. 진형 효과로 전열은 피해 -10%, 중열은 치명타 +5%, 후열은 스킬 위력 +10%를 받습니다.': 'Teach starting grimoires in the Barracks. Position Iris at Front with [Crush], Cyan in Mid with [Bleed/Ambush]. Front takes -10% damage, Mid gains +5% Crit, Back gains +10% Skill Power.',
    '💡 팁: 전열은 방어형(아이리스), 중열은 근접/원거리 딜러, 후열은 마법사/사제를 배치하는 것이 정석입니다.': '💡 Tip: Conventional formation is Tank at Front (Iris), Melee/Ranged DPS at Mid, Mage/Healer at Back.',
    '1층 침묵의 회랑 강하 & 기본 보급품(횃불/식량/곡괭이) 챙기기': 'Descend into 1F Silent Cloister with Supplies (Torch/Food/Pickaxe)',
    '탐험 준비 시 [가벼운 백팩] 또는 [표준 군장]을 선택하고 [횃불 2개], [식량 2개], [곡괭이 1개], [균열의 닻 1개]를 불출하세요. 횃불은 기습을 방지하고, 식량은 야영 시 전원 HP/MP를 50% 회복시킵니다.': 'Select [Light Backpack] or [Standard Pack] and provision 2 Torches, 2 Food, 1 Pickaxe, and 1 Rift Anchor. Torches prevent ambush; Food restores 50% HP/MP at camp.',
    '💡 팁: 횃불 없이 어둠 속에서 조우하면 몬스터에게 선공과 기습 치명타를 허용합니다.': '💡 Tip: Encountering monsters in darkness grants them ambush initiative and critical bonuses.',
    '상태이상 연계(콤보) 시스템 적극 활용': 'Leverage Status Synergies & Combo Breakdowns',
    '단순 타격 대신 상태이상을 연쇄 폭발시키세요. [출혈] 상태의 적에게 검사의 [베기]나 도적의 [관통]을 적중시키면 [과출혈 기폭]이 터져 100% 추가 피해와 공격력 감소가 발생합니다.': 'Trigger combo chain reactions. Attacking a [Bleed] target with [Slash] or [Pierce] triggers [Excess Bleed Detonation], dealing massive bonus damage and debuffing ATK.',
    '💡 팁: 적 머리 위에 [연계 가능] 뱃지가 반짝일 때 해당 스킬을 시전하면 극대화 피해가 들어갑니다.': '💡 Tip: Cast highlighted skills when [Combo Ready] blinks over an enemy for maximum burst.',
    '위험도 70% 초과 전 안전 귀환 & 전리품 창고 입고': 'Safe Return Before 70% Hazard to Bank Loot in Citadel',
    '심연 깊숙이 갈수록 위험도 게이지가 차오릅니다. 위험도가 80%를 넘기면 마물들이 광폭화하고 정예 복합 편대가 출현합니다. [성채 귀환]을 눌러 전리품을 안전하게 정산하세요.': 'Hazard rises as you explore deeper. At 80%+ hazard, monsters frenzy and elite squads spawn. Press [Return to Citadel] to bank spoils safely.',
    '💡 팁: 전멸하면 배낭 안의 전리품이 모두 소실됩니다. [차원의 호각]을 장착하면 전멸 시에도 전리품 30%를 보존합니다.': '💡 Tip: Wiping out loses all unbanked spoils. Equipping [Dimensional Whistle] rescues 30% on party wipe.',
    '시설 레벨 3 달성 & 2티어 장비 제작': 'Reach Facility Lv.3 & Forge Tier 2 Equipment',
    '성채로 복귀하여 정제소/벌채소/시추소를 Lv.3으로 증축하면 [가죽 무두질]과 [철광석 시추]가 활성화됩니다. 대장간에서 [단련된 강철 세트](2티어)를 단조하여 파티 전원의 생존력을 2배 이상 끌어올리세요.': 'Return to the citadel and upgrade gathering facilities to Lv.3 to unlock leather tanning and iron drilling. Forge Tier 2 Steel Gear to double squad survivability.',
    '💡 팁: 대장간 Lv.3에서 [접두어 인챈트] 슬롯이 개방되어 장비에 추가 옵션을 부여할 수 있습니다.': '💡 Tip: Blacksmith Lv.3 unlocks the [Prefix Enchant] slot to imbue bonus combat affixes.',

    // ── 무기 특성 가이드 ──
    '검 계열': 'Swords',
    '창 계열': 'Spears',
    '활 계열': 'Bows',
    '총 계열': 'Guns',
    '단검 계열': 'Daggers',
    '지팡이 계열': 'Staves',
    '🗡️ 베기': '🗡️ Slash',
    '🔱 방어 파쇄': '🔱 Shield Break',
    '🏹 급소 사격': '🏹 Vitals Snipe',
    '🔫 연사': '🔫 Rapid Fire',
    '⚡ 암습': '⚡ Shadow Ambush',
    '🪄 마력 공명': '🪄 Arcane Resonance',
    '기본 공격 시 대상에게 1턴간 출혈(Bleed) 상태이상을 부여하여 지속 피해 유발': 'Basic attacks inflict Bleed for 1 turn, dealing damage over time.',
    '적의 보호막(Shield)에 50% 추가 피해를 입혀 방어선을 신속히 붕괴': 'Deals +50% bonus damage against shields, crumbling enemy guard quickly.',
    '원거리 치명타율 +5% 및 치명타 피해 +5% 증폭으로 저격 특화': 'Grants +5% Crit Rate and +5% Crit Damage for single-target sniping.',
    '기본 15% 확률 + 행운(🍀) 보정으로 추가 점사(45% 피해) 격발': '15% base chance + Luck bonus to unleash an extra burst shot (45% damage).',
    '상대 마물보다 속도가 빠를수록 피해량 비례 증가 (최대 20% 증폭)': 'Deals bonus damage scaling with Speed advantage over target (up to +20%).',
    '모든 액티브 마도 스킬 사용 시 마나(MP) 소모량 5% 상시 절감': 'Reduces MP consumption of all active combat spells by 5%.',

    // ── 자주 묻는 질문 (FAQs) ──
    '탐험 전리품은 어디로 가나요?': 'Where do expedition spoils go?',
    '탐험 중 획득한 아이템과 자원은 던전 배낭에 임시 보관되며, [성채 귀환]을 누르거나 포탈을 타면 성채 창고로 100% 안전하게 입고됩니다.': 'Loot acquired during exploration is temporarily stored in your pack. Upon pressing [Return to Citadel] or entering a portal, 100% of spoils are safely deposited into citadel storage.',
    '탐험 중 전멸하면 어떻게 되나요?': 'What happens if the party wipes out during exploration?',
    '던전 배낭에 임시 보관 중이던 전리품을 잃어버리게 됩니다. 위험할 땐 무리하지 말고 [성채 귀환]을 누르거나, 전멸 위기 시 안전 귀환시켜주는 [차원의 호각]을 장착하세요.': 'Spoils held in the backpack are lost. Retreat safely when hazard is high, or equip a [Dimensional Whistle] to recover a portion of loot upon defeat.',
    '영웅이 전사하면 장비는 소멸되나요?': 'Are weapons and armor lost when a hero dies in battle?',
    '아닙니다. 사경 상태에서 지속 피해 등으로 전사한 영웅이 착용하고 있던 모든 무기와 방어구, 장신구는 100% 성채 보관함으로 안전하게 회수됩니다.': 'No. Weapons, armor, and accessories equipped on fallen heroes are 100% recovered back to citadel storage.',
    '시설 유지비가 고갈되면 어떻게 되나요?': 'What happens if facility upkeep runs out?',
    '영지 시설 Lv.4부터 골드/식량 유지비가 차감됩니다. 유지비가 체납되면 생산이 멈추거나 패널티가 발생하므로 벌채소/시추소/안식처/정제소 생산량을 균형 있게 성장시키세요.': 'Facilities Lv.4+ incur gold and food upkeep. Production pauses if upkeep cannot be met, so balance wood, quarry, haven, and refinery growth evenly.',
    '오파츠(고대 아티팩트)는 어떻게 사용하나요?': 'How do ancient Ooparts work?',
    '심연 심층 보스 격파나 유적 탐사를 통해 발굴한 오파츠는 방주에 영구 귀속되어 파티 전역 스탯 증폭 및 특수 패시브 효과를 발휘합니다.': 'Ooparts discovered from deep boss defeats permanently bind to the Ark, providing passive squad buffs and unique stat multipliers.',
    '전직 시 기존 스킬과 습득 스킬은 어떻게 되나요?': 'What happens to existing and learned skills upon class change?',
    '영혼의 제단에서 1차 또는 2차 전직 시, 이전 클래스의 고유 스킬과 기존에 습득했던 모든 스킬이 소멸되지 않고 [학습한 스킬] 목록(최대 6개)으로 100% 안전하게 이동 및 보존됩니다.': 'When changing to Tier 1 or Tier 2 classes at the Soul Sanctuary, all existing base skills and previously learned skills are 100% safely preserved and moved to your [Learned Skills] list (up to 6 slots).',
    '마도서 제작 확률과 에테르 공방 해금은 어떻게 되나요?': 'What are the grimoire crafting chances and Aether Workshop tier unlocks?',
    '에테르 연금 공방의 레벨에 따라 기본(Lv.1, 80%), 희귀(Lv.3, 50%), 에픽(Lv.5, 30%), 전설(Lv.7, 10%) 마도서가 순차 해금되며, 실패 시 에테르 붕괴 연출이 발생합니다.': 'Depending on Aether Alchemy Lab level, Common (Lv.1, 80%), Rare (Lv.3, 50%), Epic (Lv.5, 30%), and Legendary (Lv.7, 10%) grimoires unlock sequentially. Crafting failures trigger an ether collapse animation.',
    '마물이 차징(Charging) 중일 때 어떻게 대처해야 하나요?': 'How should we handle monsters while they are charging?',
    '마물이 차징을 완료하여 기술 시전에 성공하면 확정 치명타와 방어 관통 50%의 치명적인 피해를 입힙니다. 기절, 빙결, 침묵, 또는 차징 붕괴(BREAK) 스킬을 집중하여 반드시 시전 전에 차징을 캔슬해야 합니다.': 'If a monster completes charging, its spell triggers a guaranteed critical hit and 50% defense penetration. Focus Stun, Freeze, Silence, or Break skills to interrupt the charge before casting.',
    '저주받은 장비 정화 시 연출과 결과는 일치하나요?': 'Do the animation and actual result match when purifying cursed equipment?',
    '네, 병기창 정화 탭에서 정화 진행 시 드라마틱한 컷인 연출과 실제 성공/파괴 판정 결과가 100% 일치합니다. 또한 정화된 장비 목록은 정화 탭에 5분간 유지된 후 자동 정리됩니다.': 'Yes. The dramatic cutscene animation and actual success/destruction result are 100% synchronized in the Armory purification tab. Purified item history remains visible for 5 minutes before clearing.',
    '도감(심연의 백과) 목록은 어떤 순서로 표시되나요?': 'In what order are items displayed in the Abyssal Codex?',
    '현재 보유한 재료로 즉시 등록 가능한 목록이 [✨ 등록 가능] 뱃지와 함께 최상단에 배치되며, 등록 가능한 항목이 없을 때는 가장 마지막에 등록 완료한 항목(최신 등록순)부터 순서대로 상단에 정렬됩니다.': 'Items currently ready for registration appear at the very top with a [✨ Ready] badge. When none can be registered, the most recently completed collections are listed in descending order from the top.',
    '초기 마도서(2권씩 지급) 연독 & 진형 세팅 (탱·딜·힐 배치)': 'Initial Grimoires (2 Copies Each) Study & Formation Setup (Tank/DPS/Healer)',
    '신임 지휘관에게 [강타], [응급처치], [화염 가르기] 마도서가 각 2권씩 기본 지급됩니다. 편성 화면 [스킬 서고]에서 마도서를 연독하여 스킬을 습득하세요. 최대 6개까지 스킬을 습득 및 보존할 수 있으며, 전직 후에도 모든 스킬이 안전하게 유지됩니다. 전열 아이리스에게 [강타], 중앙 시안에게 [화염 가르기/단검기술]을 세팅합니다.': 'New commanders receive 2 copies each of [Heavy Strike], [First Aid], and [Flame Cleave] grimoires. Study them in the Grimoire Library to learn skills. You can preserve up to 6 skills, and all skills stay intact through class promotions. Equip [Heavy Strike] on frontliner Iris and [Flame Cleave/Dagger Arts] on midliner Cyan.',
    '백과사전 HTML 다운로드': 'Download Encyclopedia HTML',
    'HTML 다운로드': 'Download HTML',
    '백과사전 다운로드': 'Download Encyclopedia',
    '다운로드 완료!': 'Download Complete!',
    '다운로드 실패': 'Download Failed',
    '다운로드 중 오류가 발생했습니다.': 'An error occurred during download.',
    '🛒 견고한 짐수레 사용 안내': '🛒 Sturdy Wagon Guide',
    '광고 보고 1회 사용': 'Watch Ad to Use (1 Run)',
    '이 항목은 광고를 봐야 사용할 수 있습니다.': 'This option requires watching an ad to be unlocked.',
    '견고한 짐수레(30칸 & 자원 스택 99)는 광고 1회 시청 시 이번 원정(1회) 동안 사용하실 수 있습니다.': 'The Sturdy Wagon (30 slots & resource stack 99) becomes available for this expedition (1 run) upon watching 1 ad.',
    '광고를 시청하시겠습니까?': 'Would you like to watch the ad?',
    '인증 완료 (1회)': 'Authorized (1 Run)',
    '광고 시청 (1회)': 'Watch Ad (1 Run)',
    '광고 시청': 'Watch Ad',
    '견고한 짐수레 1회 사용': 'Sturdy Wagon 1 Run Access',
    '짐수레 1회 사용 & 심연 촉매 슬롯 개방': 'Wagon 1 Run & Unlock Catalyst Slot',
    '광고 보고 파밍 자원 2배 획득 (장비/오파츠 제외)': 'Watch Ad for 2x Farmed Resources (Excl. Gear/Ooparts)',
    '파밍 자원 2배 획득 완료!': '2x Farmed Resources Claimed!',
    '파밍 자원 2배 획득': '2x Farmed Resources',
    '⚒️ 단조 스탯 편차(±30%) & [저주받은 장비] 정화 의식 및 5분 보존': '⚒️ Forging Stat Variance (±30%) & Cursed Equipment Purification & 5-Minute Retention',
    '📖 마도서(스킬북) 연독 & 전직 스킬 100% 보존 & 에테르 공방 제작': '📖 Grimoire Study & 100% Skill Preservation on Class Change & Aether Workshop Crafting',
    '⚠️ 마물 차징(Charging) 메커니즘 & 브레이크(Break) 필수 수칙': '⚠️ Monster Charging Mechanism & Essential Break Protocols',
    '📜 심연의 백과(Codex) 컬렉션 봉헌 & 등록 우선순위 시스템': '📜 Abyssal Codex Collection Dedication & Registration Priority System',

    // ── 영지 시설 명칭 & 기본 설명 ──
    '방주의 성화': 'Primal Bonfire',
    '생존자 안식처': 'Survivor Haven',
    '영목 벌채소': 'Lumber Camp',
    '에테르 광맥 시추소': 'Aether Quarry',
    '심연 생체 정제소': 'Abyssal Refinery',
    '방랑자의 라운지': 'Wanderer Lounge',
    '심연의 병기창': 'Ark Armory & Forge',
    '영혼의 제단': 'Soul Sanctuary',
    '에테르 연금 공방': 'Aether Alchemy Lab',
    '차원 앵커 게이트': 'Dimensional Gate',
    '방주 중앙 병참고': 'Central Logistics Depot',
    '생체 복원 병동': 'Bio-Restoration Ward',
    '황혼의 블랙 마켓': 'Twilight Black Market',

    // ── 도감 컬렉션 (Codex Collections) ──
    '방주의 주춧돌': 'Foundations of the Ark',
    '방주 성채의 성벽과 기반을 보강하여 시설 유지 부담을 영구 경감합니다.': 'Reinforce Ark ramparts to permanently reduce facility upkeep costs.',
    '영지 시설 유지비 -5% 감면': 'Facility Upkeep -5%',
    '철혈의 보급선': 'Iron Supply Line',
    '고순도 철광석과 가공된 석탄으로 방어구를 단련합니다.': 'Forge heavy plates with refined coal and pure iron ore.',
    '파티 방어력 +10 영구 증가': 'Party DEF +10 Permanently',
    '심연의 비축식량': 'Abyssal Provisions Depot',
    '염장 식량과 가죽 배낭으로 원정대의 기초 생명력을 강화합니다.': 'Pack preserved rations and leather satchels to boost baseline vitality.',
    '파티 최대 HP +60 영구 증가': 'Party Max HP +60 Permanently',
    '에테르 마도 공명': 'Aether Resonance',
    '고밀도 에테르와 마력수정의 파동을 동기화하여 지혜의 마력을 각성합니다.': 'Synchronize ether flow with magic crystals to awaken arcane wisdom.',
    '파티 최대 MP +30 영구 증가': 'Party Max MP +30 Permanently',
    '공허의 면역 체계': 'Void Immunization',
    '공허 파편과 암흑 정수를 연구하여 심연의 치명적인 공격에 대비합니다.': 'Study void shards to insulate heroes from abyssal critical strikes.',
    '파티 받는 피해 -3% 영구 감소': 'Party Damage Taken -3%',
    '전설의 인챈트 비술': 'Legendary Enchanting Arcana',
    '순수한 마도석들을 조화롭게 공명시켜 장비의 잠재력을 극한으로 이끌어냅니다.': 'Resonate pure runestones to draw out peak equipment potential.',
    '모든 장비 스탯 +5% 증폭': 'All Equipment Stats +5%',

    // ── 던전 층 명칭 ──
    '침묵의 회랑': 'Silent Cloister',
    '망령의 납골당': 'Ossuary of Phantoms',
    '에테르 광맥': 'Ether Vein',
    '심연의 균열': 'Abyssal Rift',
    '원초의 제단': 'Primordial Altar',
    '핏빛 성역': 'Crimson Sanctuary',
    '망각의 묘지': 'Graveyard of Oblivion',
    '단죄의 성채': 'Citadel of Condemnation',
    '환영의 미궁': 'Labyrinth of Illusions',
    '심연의 심장부': 'Heart of the Abyss',
    '무간도': 'Avici',

    // ── 탐험 상황 & 선택지 ──
    '심연 전진': 'Advance',
    '야영 휴식': 'Rest at Camp',
    '성채 귀환': 'Return to Citadel',
    '상자 개방': 'Open Chest',
    '무시하고 전진': 'Ignore & Proceed',
    '전투 준비': 'Prepare for Battle',
    '도주 시도': 'Attempt Escape',
    '조사하기': 'Investigate',
    '제단에 기도': 'Pray at Altar',
    '자원 채굴': 'Mine Resources',
    '약초 채집': 'Gather Herbs',

    // ── 시설, 대장간, 병원, 주점, 연금, 제단 모달 용어 ──
    '접두어 인챈트': 'Prefix Enchant',
    '접미어 인챈트': 'Suffix Enchant',
    '순수 마도석': 'Pure Runestone',
    '강화 성공률': 'Success Rate',
    '단조 레시피': 'Forge Recipes',
    '제작 비용': 'Crafting Cost',
    '필요 재료': 'Required Materials',
    '보유 재료': 'Materials Owned',
    '재료 부족': 'Insufficient Materials',
    '골드 부족': 'Insufficient Gold',
    '강화 시도': 'Attempt Enhance',
    '병상': 'Beds',
    '입원 환자': 'Patients',
    '집중 치료': 'Intensive Care',
    '치료 중': 'Under Treatment',
    '퇴원시키기': 'Discharge',
    '전원 퇴원': 'Discharge All',
    '방랑 용병 계약': 'Mercenary Contract',
    '용병 영입': 'Recruit Hero',
    '새로고침': 'Refresh',
    '현상금 의뢰': 'Bounty Board',
    '서브 퀘스트': 'Side Quests',
    '의뢰 수락': 'Accept Quest',
    '에테르 연금': 'Aether Alchemy',
    '마도 비전서 제본': 'Craft Grimoire',
    '비전서 전수': 'Teach Grimoire',
    '클래스 승격': 'Class Promotion',
    '1차 전직': '1st Promotion',
    '2차 심연 승격': '2nd Abyssal Promotion',
    '2차 초월 각성': '2nd Transcendent Awakening',
    '승격 조건': 'Promotion Requirements',
    '승격 단행': 'Undergo Promotion',
    '적재 용량': 'Storage Capacity',
    '보관 한도': 'Storage Limit',
    '창고 확장': 'Expand Storage',
    '자원 매각': 'Sell Resources',
    '골드 환전': 'Exchange for Gold',
    '암시장 유물': 'Black Market Relics',
    '일괄 판매': 'Sell All',
    '원정대 편성': 'Party Formation',
    '용병 관리': 'Manage Mercenaries',
    '진형 배치': 'Formation Layout',
    '해고': 'Dismiss',
    '목재 투입': 'Contribute Wood',
    '온기 버프': 'Warmth Buff',
    '불씨 지피기': 'Stoke Fire',
    '성화 완전 점화': 'Ignite Bonfire Fully',
    '광고 충전': 'Ad Recharge',
    '탐험 채비실': 'Expedition Prep Room',
    '배낭 선택': 'Select Backpack',
    '보급품 챙기기': 'Pack Supplies',
    '심연 촉매': 'Abyssal Catalysts',
    '출전 불가': 'Cannot Deploy',
    '강하 구역 선택': 'Select Descent Floor',
    '전술 모멘텀': 'Tactical Momentum',
    '모멘텀 뱃지': 'Momentum Badges',
    'FEVER 폭발': 'FEVER Burst',
    '원호 공격': 'Assist Attack',
    '연계 콤보': 'Synergy Combo',
    '차징 브레이크': 'Charging Break',
    '수호 개입': 'Guard Intervention',
    '환영 반격': 'Phantom Riposte',
    '치명타': 'Critical Hit',
    '패치노트': 'Patch Notes',
    '백과사전': 'Encyclopedia',
    '도감': 'Codex',
    '계정 연동': 'Link Account',
    '클라우드 저장': 'Cloud Save',
    '클라우드 불러오기': 'Cloud Load',
    '저장 완료': 'Save Complete',
    '불러오기 완료': 'Load Complete',
    '방주 13대 영지 시설 도감': 'Ark 13 Citadel Facilities Codex',
    '핵심 기능 및 증축 혜택': 'Core Features & Expansion Perks',
    '식별자': 'ID',
    '최대 증축': 'Max Expansion',
    '시설 증축 및 운용 안내': 'Facility Expansion & Operation Guide',
    '동': ' Facilities',
    '종': ' Types',
    '건': ' Entries',
    '초반 공략 로드맵': 'Starter Strategy Roadmap',
    '초반 가이드': 'Starter Guide',
    '무기 고유 특성': 'Weapon Traits',
    '생존 FAQ': 'Survival FAQ',
    '방주 백과사전': 'Ark Encyclopedia',
    '방주 백과사전 상세 열람': 'Ark Encyclopedia Detailed View',
    '심연 몬스터 & 보스 기믹 도감': 'Abyss Monster & Boss Gimmick Codex',
    '1층 ~ 10층 심연의 탑 서식 마물': 'Monsters Inhabiting Floors 1 - 10 of Abyss Tower',
    '사용 스킬 & 특수 공격 패턴': 'Active Skills & Special Attack Patterns',
    '사용 스킬 및 기믹:': 'Active Skills & Gimmicks:',
    '토벌 전리품 보상': 'Conquest Loot Rewards',
    '심연 몬스터 도감': 'Abyss Monster Codex',
    '장비 단조 & 마도석 인챈트 도감': 'Equipment Craft & Magicite Enchant Codex',
    '마도석': 'Magicite',
    '기본 단조 장비': 'Basic Craftable Equipment',
    '장비 기본 능력치 보정': 'Equipment Base Stat Modifiers',
    '단조 필요 재료': 'Craft Materials Required',
    '장비 단조': 'Equipment Craft',
    '인챈트 마도석 옵션': 'Magicite Enchant Options',
    '인챈트 마도석': 'Enchant Magicite',
    '인챈트 부여 고유 스킬': 'Enchant Granted Unique Skill',
    '핵심 룰 & 시스템 가이드': 'Core Rules & System Guide',
    '시스템 가이드': 'System Guide',
    '세부 가이드 & 룰 설명:': 'Detailed Guide & Rule Explanation:',
    '전투 상성, 전열/후열, 유대, 위험도, 유지비': 'Combat Affinity, Formations, Bonds, Hazard & Upkeep',
    '확인 (닫기)': 'Confirm (Close)',
    '확대': 'Expand',
    '병기창 무기 계열 고유 특성 뱃지': 'Armory Weapon Trait Badges',
    '신임 지휘관 초반 생존 & 번영 로드맵': 'Commander Survival & Prosperity Roadmap',
    '단계별 핵심 미션 완수 가이드': 'Step-by-step Core Mission Guide',
    '초반 6단계 완벽 생존 & 번영 로드맵': 'Early 6-Step Survival & Prosperity Roadmap',
    '무기 6종 고유 특성 뱃지 (Weapon Traits) 완전 해설': 'Comprehensive Weapon Traits Guide (6 Types)',
    '병기창 단조 시 무기별 고유 메커니즘': 'Unique Mechanisms by Weapon Type at Forge',
    '자주 묻는 질문 (FAQ) & 방주 생존 수칙': 'Frequently Asked Questions (FAQ) & Survival Rules',
    '전멸 방지 & 보관 수칙': 'Wipe Prevention & Safe Storage Rules',
    '방주 종합 백과사전 & 도감': 'Ark Comprehensive Encyclopedia & Codex',
    '직업, 전직 계통, 몬스터 기믹, 영지 시설, 장비 인챈트, 상태이상 및 주요 시스템 가이드': 'Classes, Lineages, Monsters, Facilities, Equipment, Status Effects & System Guides',
    '신성한 성화. 목재를 공헌하여 생산량 +15%, 전투 EXP +20%, 영지 용병 지속 재생 온기 버프를 활성화합니다.': 'Sacred flame. Offer wood to activate warmth buff for +15% production, +20% Combat EXP, and continuous regeneration for mercenaries.',
    '구출된 생존자 거주지. 방주에 세금(골드)을 13초마다 정기 납부합니다.': 'Shelter for rescued survivors. Regularly pays taxes (Gold) to the Ark every 13s.',
    '방주 외곽 목재 벌채 시설. 영지 증축과 성화 유지에 필요한 목재를 9초마다 생산합니다.': 'Ark outer timber mill. Harvests wood every 9s required for citadel expansion & bonfire maintenance.',
    '부유성 지반 채굴 시설. 11초마다 석재를 생산하며 점차 철광석도 함께 발굴합니다.': 'Floating citadel bedrock quarry. Produces stone every 11s and gradually excavates iron ore as well.',
    '식량 정제 시설. 13초마다 보급 식량을 생산하고 무두질 가죽을 가공합니다.': 'Food refinery. Produces rations and processes tanned leather every 13s.',
    '용병 고용소. 방랑 용병을 계약 영입하고 서브 퀘스트를 수주하며 식량을 조달합니다.': 'Mercenary guild. Recruits wandering mercenaries, accepts sub-quests, and procures food.',
    '장비 공방. 전술 무기 및 방어구 단조, 장비 강화 및 인챈트를 수행합니다.': 'Tactical armory. Forge weapons/armor, enhance equipment, and apply enchants.',
    '클래스 승격 시설. 용병들의 상위 클래스 전직과 초월 각성을 집전합니다.': 'Class promotion facility. Conducts class promotions and transcendent awakenings for mercenaries.',
    '에테르 연금 및 마도 시설. 15초마다 에테르를 정기 생산하고 마도서를 제본합니다.': 'Ether alchemy and magic facility. Regularly produces ether every 15s and crafts grimoires.',
    '차원 관문. 비동기 랭킹 결투, 네메시스 레이드 및 차원 영지 침공을 지원합니다.': 'Dimensional Gate. Supports asynchronous ranking duels, Nemesis raids, and dimensional territory invasions.',
    '방주 중앙 물자 저장고. 레벨에 따라 27종 모든 자원의 최대 적재 용량을 확장합니다.': 'Central logistics depot of the Ark. Expands maximum storage capacity for all 27 resources according to level.',
    '의료 시설. 부상당한 용병을 입원시켜 체력과 마나를 복원합니다.': 'Medical ward. Hospitalizes wounded heroes to recover HP and MP.',
    '암시장 교역소. 15종 자원 거래 및 환전을 지원하며 상업 골드를 수급합니다.': 'Contraband trading post. Supports trading 15 types of resources, currency exchange, and earns commerce Gold.',

    // ── 영웅, 몬스터, 스킬, 전투 인라인 태그 ──
    '아이리스': 'Iris',
    '시안': 'Cyan',
    '바르톨': 'Bartol',
    '바르돌': 'Bartol',
    '세레나': 'Serena',
    '엘레나': 'Elena',
    '클라우드': 'Cloud',
    '루나': 'Luna',
    '카엘': 'Kael',
    '미아': 'Mia',
    '발렌타인': 'Valentine',
    '클로에': 'Chloe',
    '알렉스': 'Alex',
    '세린': 'Serin',
    '로건': 'Logan',
    '레이': 'Ray',
    '베아트리스': 'Beatrice',
    '다리우스': 'Darius',
    '일레인': 'Elaine',
    '트리스탄': 'Tristan',
    '실비아': 'Sylvia',
    '가웨인': 'Gawain',
    '오리온': 'Orion',
    '세실리아': 'Cecilia',
    '펠릭스': 'Felix',
    '발레리아': 'Valeria',
    '란슬롯': 'Lancelot',
    '카밀라': 'Camilla',
    '베르나르': 'Bernard',
    '로웨나': 'Rowena',
    '하비': 'Harvey',
    '아델라인': 'Adeline',
    '아서': 'Arthur',
    '모건': 'Morgan',
    '기드온': 'Gideon',
    '클레어': 'Claire',
    '로이드': 'Lloyd',
    '아우렐리아': 'Aurelia',
    '시그루드': 'Sigurd',
    '비비안': 'Vivian',
    '롤랑': 'Roland',
    '헥터': 'Hector',
    '헬레나': 'Helena',
    '에드워드': 'Edward',
    '에블린': 'Evelyn',
    '가브리엘': 'Gabriel',
    '빅터': 'Victor',
    '이사벨라': 'Isabella',
    '타리크': 'Tariq',
    '레오나': 'Leona',
    '카이엔': 'Cayenne',
    '디아나': 'Diana',
    '유리엘': 'Uriel',
    '오스카': 'Oscar',
    '제노': 'Zeno',
    '[궁극기]': '[Ultimate]',
    '[고유기]': '[Unique]',
    '★[궁극기]': '★[Ultimate]',
    '★[고유기]': '★[Unique]',
    '전직 궁극기': 'Class Ultimate',
    '전직 고유기': 'Class Unique',
    '[Block!]': '[Block!]',
    '🛡️[Block!]': '🛡️[Block!]',
    '[크리티컬!]': '💥[CRITICAL!]',
    '💥[크리티컬!]': '💥[CRITICAL!]',
    '[치명타]': '💥[CRITICAL!]',
    '💥[치명타]': '💥[CRITICAL!]',
    '[전열 수호]': '[Front Guard]',
    '[전열 엄호]': '[Frontline Cover]',
    '[면역 결계]': '[Immunity Barrier]',
    '[저항(RESIST)]': '[Resist]',
    '피격 환영 반격!': 'Phantom Counter!',
    '[피격 환영 반격!]': '[Phantom Counter!]',
    '환영 반격!': 'Phantom Counter!',
    '[환영 반격!]': '[Phantom Counter!]',
    '광역 강타!': 'AoE Smash!',
    '수호 엄호!': 'Guardian Cover!',
    '총건의 전투 기록': 'Total combat records',
    '공허의 잠복자': 'Void Lurker',
    '동굴 흑익박쥐': 'Cave Darkwing Bat',
    '부패 점액체': 'Rot Slime',
    '저주받은 망자': 'Cursed Undead',
    '폐허 철제 골렘': 'Ruin Iron Golem',
    '그림자 악귀': 'Shadow Fiend',
    '납골당 묘지 밴시': 'Crypt Banshee',
    '살점을 뜯는 구울': 'Flesh Tearer Ghoul',
    '마도 수정 전갈': 'Arcane Crystal Scorpion',
    '마력 침식 가고일': 'Mana Eroded Gargoyle',
    '균열의 차원 추적자': 'Rift Void Stalker',
    '공허의 하수인 촉수괴수': 'Void Tentacle Beast',
    '종언의 제단 광신도': 'Fanatic of the Altar of the End',
    '모노리스의 파멸 수호자': 'Monolith Ruin Guardian',
    '심연의 망령 기사': 'Abyssal Wraith Knight',
    '침묵의 흑핵 거신': 'Silent Black-Core Colossus',
    '망령 군주 데스나이트': 'Wraith Lord Death Knight',
    '태고의 광맥 베히모스': 'Primordial Vein Behemoth',
    '심연의 시공 왜곡자': 'Abyssal Chrono Distorter',
    '공허의 침식자': 'Void Corrupter',
    '핏빛 늑대': 'Blood Wolf',
    '타락한 사제': 'Fallen Priest',
    '핏빛 대공': 'Blood Archduke',
    '망각의 유령': 'Oblivion Ghost',
    '뼈 골렘': 'Bone Golem',
    '망각의 묘지기': 'Oblivion Gravedigger',
    '타락한 기사': 'Fallen Knight',
    '이단 심문관': 'Inquisitor',
    '타락한 기사단장': 'Fallen Grandmaster',
    '거울의 환영': 'Mirror Phantom',
    '미궁의 지배자': 'Labyrinth Master',
    '심연 군주': 'Abyss Lord',
    '무간의 지배자': 'Master of Avici',
    '종언의 메테오': 'Meteor of the End',
    '불멸의 결전분노': 'Immortal Battle Rage',
    '에테르 공명 탄막': 'Ether Resonance Barrage',
    '천벌의 성십자가': 'Holy Cross of Divine Wrath',
    '군단 총진격': 'Legion All-Out Charge',
    '만화경 환영검무': 'Kaleidoscope Mirage Dance',
    '부활의 성가': 'Hymn of Resurrection',
    '시공 역류': 'Chrono Surge',
    '절대 요새의 성역': 'Sanctuary of Absolute Fortress',
    '방주 결전포': 'Ark Decisive Cannon',
    '유령 탄환': 'Phantom Bullet',
    '사신 스나이프': 'Reaper Snipe',
    '성전의 천벌': 'Holy Crusade Wrath',
    '시간 역행': 'Time Reversal',
    '만화경 환영난무': 'Kaleidoscope Mirage Flurry',
    '절대 불락의 성채': 'Impregnable Citadel',
    '그림자 기습': 'Shadow Ambush',
    '출혈 발톱': 'Bleeding Claws',
    '초음파 강타': 'Ultrasonic Smash',
    '혼란의 울음': 'Cry of Confusion',
    '독성 분사': 'Toxic Spray',
    '점성 포획': 'Viscous Trap',
    '영혼 흡수': 'Soul Drain',
    '저주의 포옹': 'Curse Embrace',
    '철권 강타': 'Iron Fist Smash',
    '중력 압쇄': 'Gravity Crush',
    '암흑 할퀴기': 'Dark Claw',
    '군집 난무': 'Swarm Flurry',
    '비탄의 절규': 'Lamenting Wail',
    '영혼 침식': 'Soul Erosion',
    '썩은 송곳니': 'Rotten Fangs',
    '시체 섭취': 'Corpse Consume',
    '비전 침 찌르기': 'Arcane Sting',
    '수정 외골격': 'Crystal Exoskeleton',
    '에테르 파동포': 'Ether Wave Cannon',
    '비전 급강하': 'Arcane Dive',
    '차원 도약 습격': 'Rift Warp Raid',
    '공간 왜곡': 'Space Distortion',
    '심연의 촉수 난타': 'Abyssal Tentacle Bash',
    '흑무 흡수': 'Dark Mist Absorption',
    '묵시록의 흑염': 'Apocalypse Black Flame',
    '암흑 제물 공양': 'Dark Offering',
    '파멸의 모노리스 강타': 'Monolith Ruin Strike',
    '절대 성벽 방진': 'Absolute Wall Phalanx',
    '암흑의 일도양단': 'Dark Cleave',
    '망령의 방벽': 'Wraith Barrier',
    '공포의 사자후': 'Terrifying Roar',
    '침묵의 대지 분쇄': 'Silent Earth Shatter',
    '동결의 흑핵 방출': 'Frozen Black Core Burst',
    '고대 석벽 결계': 'Ancient Stone Barrier',
    '망령의 영혼 처형': 'Wraith Soul Execution',
    '원혼의 파멸 오라': 'Ruin Aura of Spite',
    '영겁의 불굴 방벽': 'Eternal Fortitude Wall',
    '광맥의 에테르 폭발': 'Vein Ether Burst',
    '마도 결정 쇄도': 'Arcane Crystal Surge',
    '대지의 고동': 'Pulse of the Earth',
    '시공간 균열 붕괴': 'Space-time Rift Collapse',
    '차원 닻 강타': 'Dimensional Anchor Strike',
    '시공 역행 결계': 'Chrono Reversal Barrier',
    '파멸의 공허 폭풍': 'Ruinous Void Storm',
    '시공간 붕괴격': 'Space-time Collapse Strike',
    '흑무의 잠식': 'Dark Mist Encroachment',
    '심연의 저주': 'Abyssal Curse',
    '물어뜯기': 'Bite',
    '광기의 울부짖음': 'Mad Howl',
    '검은 권능': 'Dark Authority',
    '피의 의식': 'Blood Ritual',
    '핏빛 파동': 'Crimson Wave',
    '흡혈의 일격': 'Vampiric Strike',
    '한기 서린 손아귀': 'Chilling Grasp',
    '뼈 분쇄': 'Bone Crush',
    '영혼 수확': 'Soul Harvest',
    '사신의 낫': 'Reaper\'s Scythe',
    '칠흑의 검': 'Pitch-Black Sword',
    '화형 선고': 'Pyre Sentence',
    '집행자의 심판': 'Executioner\'s Judgment',
    '타락한 성역': 'Corrupted Sanctuary',
    '일루전 스트라이크': 'Illusion Strike',
    // ── 원호 공격 계열/스킬/대사/효과 EN ──
    '수호 기사계': 'Guardian Knight',
    '그림자 암살계': 'Shadow Assassin',
    '원소 마도계': 'Elemental Mage',
    '신성 구원계': 'Holy Savior',
    '광전사 선봉계': 'Berserker Vanguard',
    '마총 저격계': 'Magic Gunner',
    '수호의 방패 원호': 'Guardian Shield Assist',
    '그림자 기습 비수': 'Shadow Ambush Dagger',
    '에테르 공명 탄막': 'Aether Resonant Barrage',
    '빛의 단죄와 가호': 'Light\'s Judgment & Aegis',
    '전장의 분노 추격타': 'Battlefield Rage Pursuit',
    '전술 마도 저격': 'Tactical Magic Snipe',
    '방어선은 내가 지킨다! 연계 돌파!': 'I\'ll hold the frontline! Linked breakthrough!',
    '빈틈이다. 급소 포착!': 'An opening. Vital point locked!',
    '마력 파동 증폭, 일제 방출!': 'Mana pulse amplified, unleashing all!',
    '빛의 정의가 함께하길! 정화하라!': 'May the light bring justice! Purify!',
    '지금이다! 뼈까지 부숴주마!': 'Now! I\'ll shatter you to the bone!',
    '사선 확보 완료. 격발!': 'Line of fire clear. Firing!',
    '원호 사격 개시!': 'Initiating covering fire!',
    '마력 지원 들어간다!': 'Mana support incoming!',
    '내가 엄호하마!': 'I\'ve got you covered!',
    '화망 전개! 일제 사격!': 'Deploying fire net! Open fire!',
    '틈을 놓칠 순 없지!': 'Can\'t miss this opening!',
    '비전의 빛이여, 꿰뚫어라!': 'Light of arcana, pierce through!',
    '적 차징 100 파쇄 및 아군 전체 최대 HP 12% 보호막 전개': 'Shreds 100 enemy charge & grants 12% max HP shield to all allies',
    '방어력을 100% 무시하는 확정 치명타 및 2턴 깊은 출혈 부여': 'Guaranteed critical ignoring 100% DEF & inflicts 2-turn deep Bleed',
    '마법 광역 탄막 연타 및 아군 파티 전원 MP 10 반환': 'Multi-hit magic barrage & restores 10 MP to all party members',
    '신성 단죄 타격 및 최저 체력 아군 1명 체력 30% 즉각 응급 치유': 'Holy judgment strike & immediately heals 30% HP for lowest ally',
    '묵직한 물리 파괴 일격 및 2턴간 대상의 공격력 30% 강제 억제': 'Heavy physical crushing blow & suppresses target ATK by 30% for 2 turns',
    '방어 관통 마도탄 저격 및 2턴간 대상 방어력 35% 추가 분쇄': 'DEF-piercing magic bullet snipe & shreds target DEF by 35% for 2 turns',
    '원호!': 'Assist!',
    '원호 사격!': 'Covering Fire!',
    '추가 공격!': 'Follow-up Attack!',
    '비전 원호!': 'Arcane Assist!',
    '약점 추격 원호!': 'Weakness Pursuit Assist!',
    // ── 시너지 패널 & 배지 EN ──
    '삼위일체 밸런스': 'Trinity Balance',
    '난공불락의 불멸성채': 'Impregnable Immortal Citadel',
    '강철의 철벽 방진': 'Ironclad Bastion Formation',
    '대파멸 비전 의식': 'Cataclysmic Arcane Ritual',
    '마도 폭주 결사단': 'Arcane Surge Legion',
    '융단 폭격 섬멸전': 'Carpet Bombing Annihilation',
    '전탄 일제 사격': 'Full Volley Salvo',
    '무간 피의 도살군단': 'Avici Blood Slaughter Corps',
    '광기의 피의 축제': 'Madness Blood Feast',
    '절대 암살 참수단': 'Absolute Assassination Unit',
    '그림자 암살 연대': 'Shadow Assassination Cohort',
    '불멸의 성역 결계': 'Immortal Sanctuary Barrier',
    '성스러운 구원의 빛': 'Holy Light of Salvation',
    '신성 성기사단': 'Holy Paladin Order',
    '마도 중화기 공학': 'Arcane Heavy Weaponry Engineering',
    '암영 광풍 연격단': 'Shadow Gale Combo Corps',
    '철혈의 돌격 선봉': 'Ironblood Assault Vanguard',
    '성전의 저격 지원': 'Crusade Sniper Support',
    '마도 성역 수호': 'Arcane Sanctuary Guardian',
    '그림자 성전단': 'Shadow Crusade Order',
    '전천후 초토화 폭격': 'All-Weather Scorched Earth Bombing',
    '비전 암살 결사': 'Arcane Assassination Coven',
    '표준 삼각 편대': 'Standard Triangle Formation',
    '돌격 배수진': 'Assault Last Stand',
    '후방 집중 화망': 'Rear Focused Crossfire',
    '신속 유격 진형': 'Rapid Skirmish Formation',
    '베테랑 정예 원정단': 'Veteran Elite Expedition',
    '전설의 영웅단': 'Legendary Heroes Legion',
    '각성한 신화의 군단': 'Awakened Mythic Legion',
    '심연의 악마': 'Abyssal Demon',
    '악마의 손톱': 'Demon Claws',
    '심연의 베헤모스': 'Abyssal Behemoth',
    '지각 변동': 'Tectonic Shift',
    '심연의 포효': 'Abyssal Roar',
    '심연의 군주 아스모데우스': 'Lord of the Abyss Asmodeus',
    '심연의 군주 아스모데우스 (10F 보스)': 'Lord of the Abyss Asmodeus (10F Boss)',
    '종말의 숨결': 'Breath of Doom',
    '절망의 장막': 'Veil of Despair',
    '파멸의 일격': 'Doom Strike',
    '무간의 지배자 아르케오스': 'Ruler of Avici Archeos',
    '무간의 지배자 아르케오스 (진 최종 보스)': 'Ruler of Avici Archeos (True Final Boss)',
    '무간의 태초 파동': 'Primordial Wave of Avici',
    '공허의 절대 침식': 'Absolute Void Erosion',
    '멸망의 창조 일격': 'Genesis Strike of Ruin',
    '종언의 광신도': 'End Zealot Cultist',
    '종언의 제단 광신도': 'Altar Zealot Cultist',
    '핏빛 대공 (6F 보스)': 'Blood Archduke (6F Boss)',
    '망각의 묘지기 (7F 보스)': 'Graveyard Keeper of Oblivion (7F Boss)',
    '타락한 기사단장 (8F 보스)': 'Fallen Knight Commander (8F Boss)',
    '미궁의 지배자 (9F 보스)': 'Ruler of the Labyrinth (9F Boss)',
    '공허의 추적자': 'Void Stalker',
    '공허의 일격': 'Void Strike',
    '파편의 폭풍': 'Shard Storm',
    '현혹의 거울': 'Mirror of Bewitchment',
    '차원 균열의 닻': 'Dimensional Rift Anchor',
    '차원 심연의 닻': 'Dimensional Abyssal Anchor',
    '균열의 닻': 'Rift Anchor',
    '심연의 닻': 'Abyssal Anchor',
    '차원의 닻': 'Dimensional Anchor',
    '차원의 나침반': 'Dimensional Compass',
    '시공간의 나침반': 'Spacetime Compass',
    '긴급 이송 & 유해 운구 시스템': 'Emergency Transport & Remains Evacuation System',
    '차원 균열의 닻 긴급 이송 & 유해 운구 시스템': 'Dimensional Rift Anchor Emergency Transport & Remains Evacuation System',
    '차원 심연의 닻 긴급 이송 & 유해 운구 시스템': 'Dimensional Abyssal Anchor Emergency Transport & Remains Evacuation System',
    '균열의 닻 적용': 'Rift Anchor Applied',
    '심연의 닻 적용': 'Abyssal Anchor Applied',
    '균열의 닻 적용 중': 'Rift Anchor Active',
    '심연의 닻 적용 중': 'Abyssal Anchor Active',
    '시공간의 나침반 활성화': 'Spacetime Compass Activated',
    '시공간의 나침반 활성화 중': 'Spacetime Compass Active',
    '차원의 나침반 활성화 중': 'Dimensional Compass Active',
    '차원의 나침반 촉매를 채비하면 이송 턴이 추가로 1턴 더 단축됩니다.': 'Equipping the Dimensional Compass catalyst reduces transport time by an additional 1 turn.',
    '💡 팁: 차원의 나침반 촉매를 채비하면 이송 턴이 추가로 1턴 더 단축됩니다.': '💡 Tip: Equipping the Dimensional Compass catalyst reduces transport time by an additional 1 turn.',
    '소환된 대원은 차원 균열을 통해 3턴 후 원정대에 도착하여 합류합니다.': 'The summoned mercenary arrives and joins the expedition through the dimensional rift after 3 turns.',
    '고대 시공간 안정화 권능으로 기본 이송 턴이 2턴으로 단축됩니다! (일반 균열의 닻 3턴 ➔ 2턴)': 'Ancient spacetime stabilization power reduces base transport time to 2 turns! (Standard Rift Anchor 3 turns ➔ 2 turns)',
    '초월 시공간 왜곡 권능으로 대기 턴 없이 즉시 합류(0턴)합니다!': 'Transcendent spacetime distortion allows immediate joining with 0 wait turns!',
    '시공간 왜곡 권능으로 소환 대원의 이송 턴이 추가 1턴 단축됩니다!': 'Spacetime distortion shortens summoned ally transport time by an additional 1 turn!',
    '현재 차원 이송 작전이 진행 중입니다!': 'Dimensional transport operation is currently underway!',
    '이송이 완료된 후 다음 긴급 이송을 요청할 수 있습니다.': 'You can request the next emergency transport after the current one completes.',
    '1단계: 방주로 복귀/운구할 원정대원 선택': 'Step 1: Select expedition member to return to Ark / evacuate',
    '2단계: 방주 대기소에서 호출할 후방 용병 선택': 'Step 2: Select reserve mercenary to call from Ark Staging Area',
    '호출 가능한 대기 용병이 없습니다 (성채 대기소에 다른 용병이 필요합니다).': 'No reserve mercenaries available to call (Requires other mercenaries in Citadel barracks).',
    '차원의 닻 부족 (균열의 닻 또는 심연의 닻 1개 필요)': 'Insufficient Dimensional Anchors (Requires 1 Rift Anchor or Abyssal Anchor)',
    '1단계: 귀환/운구 대상을 선택하세요': 'Step 1: Select a target to return or transport remains',
    '2단계: 호출할 후방 용병을 선택하세요': 'Step 2: Select a reserve mercenary to summon',
    '보유 닻 없음 (0개)': 'No Anchors Owned (0)',
    '원정대 활성 시너지': 'Active Expedition Synergies',
    '영혼 결속': 'Soul Link',
    '도감 완성': 'Codex Complete',
    '개 발동 중': ' Active',
    '심연의 백과 (도감 완성 종합 가호)': 'Abyssal Codex (Completion Blessing)',
    '현재 발동된 원정대 시너지가 없습니다.': 'No expedition synergies currently active.',
    '현재 파티 조합 시너지는 없으나, 심연의 백과 도감 가호가 상시 적용 중입니다.': 'No party synergies active, but Codex blessings are in effect.',
    '도감 확인 ➔': 'View Codex ➔',
    '조합 확인 ➔': 'View Combos ➔',
    '달성률': 'Progress',
    '심연의 백과 도감 열기': 'Open Abyssal Codex',
    '시너지 조합 도감 열기': 'Open Synergy Guide',
    '전능력치': 'All Stats',
    '턴당 체력': 'HP/turn',
    '턴당 마나': 'MP/turn',
    '전열 엄호': 'Frontline Guard',
    '중열 회피': 'Mid-row Evasion',
    '개시 보호막': 'Start Shield',
    '처형 피해': 'Execute DMG',
    '피해감소': 'DMG Reduction',
    '치명타': 'CRIT Rate',
    '치명피해': 'CRIT DMG',
    '관통': 'Penetration',
    '흡혈': 'Life Drain',
    '모든피해': 'All DMG',
    '경험치': 'EXP',
    '유지비': 'Upkeep',
    '생산': 'Production',
    '최대HP': 'Max HP',
    '최대MP': 'Max MP',
    '영구 패시브': 'Permanent Passive',
    '도감 열기 ➔': 'Open Codex ➔',
    '항목': 'entries',
    '종': 'types',
    '탱/딜/힐 역할군 조합, 진형 배치, 성채 묘지 영혼 결속, 또는 심연의 백과(도감) 수집을 통해 시너지를 발동할 수 있습니다.': 'Activate synergies through Tank/DPS/Healer roles, formation layout, Cemetery Soul Links, or Abyssal Codex collection.',
    '클릭하여 심연의 백과 도감 열기': 'Click to open Abyssal Codex',
    // ── 던전 조우 이벤트 모달 및 선택지 EN ──
    '버려진 고대 보물 상자': 'Abandoned Ancient Chest',
    '대형 보물 상자 (피의 서약)': 'Large Treasure Chest (Blood Pact)',
    '에테르 광맥 발견': 'Aether Vein Discovered',
    '잠긴 고대 영웅의 석관': 'Locked Sarcophagus of Ancient Hero',
    '타락한 여신의 제단': 'Altar of the Fallen Goddess',
    '갈림길 & 미궁의 샛길': 'Crossroads & Labyrinth Byway',
    '길 잃은 방랑 보급관': 'Lost Wandering Quartermaster',
    '신비로운 에테르 기류': 'Mysterious Aether Current',
    '무작위 귀환 포탈 발견': 'Random Return Portal Discovered',
    '무간도 시공간 균열 발견': 'Abyssal Space-Time Rift Discovered',
    '차원 지름길 발견': 'Dimensional Shortcut Discovered',
    '차원 포탈 & 심연 오버차지': 'Dimensional Portal & Abyssal Overcharge',
    '무간도 중간 보스 토벌 완료!': 'Abyssal Mid-Boss Defeated!',
    '확인 (2초 후 자동 닫힘)': 'Confirm (Auto-closing in 2s)',
    '무시하고 탐험 계속': 'Ignore and continue exploring',
    '심연의 어둠 속에서 마도 결계로 잠긴 보물 상자를 발견했습니다.\n어떻게 개방하시겠습니까?': 'Found a treasure chest sealed by a magical barrier in the abyssal dark.\nHow will you open it?',
    '벽면을 따라 영롱한 빛을 내뿜는 마도 광맥이 노출되어 있습니다.\n어떻게 채굴하시겠습니까?': 'An arcane vein emitting radiant light is exposed along the wall.\nHow will you mine it?',
    '심연의 결계 룬으로 단단히 잠긴 석관이 안치되어 있습니다.\n어떻게 개방하시겠습니까?': 'A sarcophagus tightly locked with abyssal barrier runes rests here.\nHow will you unseal it?',
    '심연의 어둠 속에서도 미약한 성스러운 기운을 내뿜는 여신상이 서 있습니다.\n어떻게 행동하시겠습니까?': 'A statue of a goddess radiates faint holy aura in the deep darkness.\nWhat will you do?',
    '광폭화 보스를 토벌하여 차원 포탈이 완전히 안정화되었습니다. 다음 행동을 선택하세요.': 'Defeated the enrage boss; the dimensional portal is stabilized. Choose your next move.',
    '보스를 물리치고 차원 포탈을 확보했습니다. 다음 행동을 선택하세요.': 'Defeated the boss and secured the dimensional portal. Choose your next move.',
  },
  ja: {
    '로웰': 'ローウェル',
    '단련된 일격': '鍛錬された一撃',
    '방패 올리기': '盾受け',
    '불굴의 결의': '不屈の決意',
    '단죄의 일격': '断罪の一撃',
    '신성 방벽': '神聖防壁',
    '홀리 오라': 'ホーリーオーラ',
    '방패 강타': 'シールドバッシュ',
    '철벽의 태세': '鉄壁の構え',
    '절대 방진': '絶対防陣',
    '심판의 빛창': '審判の光槍',
    '신의 가호': '神の加護',
    '영원의 성역': '永遠の聖域',
    '[궁극기] 영원의 성역': '[究極技] 永遠の聖域',
    '급소 찌르기': '急所突き',
    '연막탄': '煙幕弾',
    '암영 난무': '暗影乱舞',
    '암영 연격': '暗影連撃',
    '독무 연격': '毒霧連撃',
    '심장 꿰뚫기': 'ハートピアサー',
    '심연의 도약': '深淵の跳躍',
    '분신 난무': '分身乱舞',
    '무간암영참': '無間暗影斬',
    '[궁극기] 무간암영참': '[究極技] 無間暗影斬',
    '환영의 반격': '幻影の反撃',
    '질풍 4연참': '疾風4連斬',
    '환영 난무 왈츠': '幻影乱舞ワルツ',
    '에테르 볼트': 'エーテルボルト',
    '원소 폭발': '元素爆発',
    '에테르 과충전': 'エーテル過充電',
    '연쇄 번개': '連鎖稲妻',
    '혹한의 눈보라': '極寒の吹雪',
    '원소 초신성': '元素超新星',
    '공허의 특이점': '虚空の特異点',
    '비전 폭풍': '秘術の嵐',
    '종말의 메테오': '終末のメテオ',
    '[궁극기] 종말의 메테오': '[究極技] 終末のメテオ',
    '치유의 기도': '治癒の祈り',
    '신성 광휘': '神聖の輝き',
    '소생의 기도': '蘇生の祈り',
    '[궁극기] 소생의 기도': '[究極技] 蘇生の祈り',
    '대성녀의 축복': '大聖女の祝福',
    '구원의 빛': '救済の光',
    '[궁극기] 부활의 성가': '[究極技] 復活の聖歌',
    '대검 베어가르기': '大剣両断',
    '전사의 함성': '戦士の叫び',
    '분노의 일격': '憤怒の一撃',
    '혈풍참': '血風斬',
    '피의 폭주': '血の暴走',
    '광란의 대지분쇄': '狂乱の大地粉砕',
    '라그나로크 슬래시': 'ラグナロクスラッシュ',
    '불멸의 포효': '不滅の咆哮',
    '[궁극기] 불멸의 결전분노': '[究極技] 不滅の決戦憤怒',
    '진격의 지휘 함성': '進撃の指揮叫び',
    '파성추 강타': '破城槌の強打',
    '전열 압도': '前列圧倒',
    '에테르 2점사': 'エーテル2点射',
    '섬광탄 사격': '閃光弾射撃',
    '정밀 조준사격': '精密照準射撃',
    '레일건 관통포': 'レールガン貫通砲',
    '전술 드론 호출': '戦術ドローン呼出',
    '궤도 조명 폭격': '軌道照明爆撃',
    '치명적 헤드샷': 'リーサルヘッドショット',
    '그림자 위장술': '影の偽装術',
    '심연 관통탄': '深淵貫通弾',
    '하이퍼 펄스 버스터': 'ハイパーパルスバスター',
    '오버클럭 리로드': 'オーバークロックリロード',
    '궤도 에테르 버스터': '軌道エーテルバスター',
    '[궁극기] 궤도 에테르 버스터': '[究極技] 軌道エーテルバスター',
    '중력장 소환': '重力場召喚',
    '시공 왜곡': '時空歪曲',
    '아케인 오버로드': 'アーケインオーバーロード',
    '성스러운 파동': '聖なる波動',
    '성역의 광채': '聖域の輝き',
    '신성 집결': '神聖集結',
    '성전 강타': '聖戦強打',
    '성지 정화 결계': '聖地浄化結界',
    '성전 선포': '聖戦布告',
    '성벽 전개': '城壁展開',
    '지진 분쇄타': '地震粉砕打',
    '[궁극기] 절대 요새의 성역': '[究極技] 絶対要塞の聖域',
    '환영의 안개': '幻影の霧',
    '유령의 일격': '亡霊の一撃',
    '무한 환영무': '無限幻影舞',
    '[궁극기] 무한 환영무': '[究極技] 無限幻影舞',
    '폭풍우의 눈': '嵐の目',
    '번개 폭풍': '雷嵐',
    '천벌의 뇌우': '天罰の雷雨',
    '[궁극기] 천벌의 뇌우': '[究極技] 天罰の雷雨',
    '은총의 성역': '恩寵の聖域',
    '생명의 숨결': '生命の息吹',
    '기적의 성스러운 비': '奇跡の聖なる雨',
    '[궁극기] 기적의 성스러운 비': '[究極技] 奇跡の聖なる雨',
    '심연의 암흑탄': '深淵の暗黒弾',
    '암흑 분열탄': '暗黒分裂弾',
    '종말의 검은 폭풍': '終末の黒き嵐',
    '[궁극기] 종말의 검은 폭풍': '[究極技] 終末の黒き嵐',
    '방패 방어': '盾防御',
    '응급 처치': '応急処置',
    '약점 찌르기': '弱点突き',
    '에테르 화살': 'エーテルアロー',
    '화염 강타': '火炎強打',
    '철벽의 방진': '鉄壁の防陣',
    '전장의 포효': '戦場の咆哮',
    '신성한 축복': '神聖なる祝福',
    '그림자 습격': '影の襲撃',
    '축복의 베일': '祝福のヴェール',
    '천둥의 벼락': '雷鳴の落雷',
    '그림자 암살': '影の暗殺',
    '[궁극기] 그림자 암살': '[究極技] 影の暗殺',
    // ── 共通UI & ボタン ──
    '확인': '確認',
    '취소': 'キャンセル',
    '닫기': '閉じる',
    '뒤로': '戻る',
    '뒤로가기': '戻る',
    '저장': '保存',
    '삭제': '削除',
    '초기화': '初期化',
    '적용': '適用',
    '수령': '受取',
    '보상 수령': '報酬受取',
    '보상 받기': '報酬受取',
    '완료': '完了',
    '진행 중': '進行中',
    '성공': '成功',
    '실패': '失敗',
    '레벨': 'レベル',
    '골드': 'ゴールド',
    '에테르': 'エーテル',
    '목재': '木材',
    '석재': '石材',
    '철광석': '鉄鉱石',
    '식량': '食糧',
    '체력': 'HP',
    '마나': 'MP',
    '공격력': '攻撃力',
    '방어력': '防御力',
    '속도': '速度',
    '행운': '幸運',
    '치명타율': '会心率',
    '전열': '前衛',
    '중열': '中衛',
    '후열': '後衛',
    '장착': '装備',
    '해제': '解除',
    '장착 해제': '装備解除',
    '장착 중': '装備中',
    '보유': '所持',
    '수량': '数量',
    '강화': '強化',
    '단조': '鍛造',
    '인챈트': 'エンチャント',
    '승격': '昇格',
    '전직': '転職',
    '고용': '雇用',
    '퇴원': '退院',
    '입원': '入院',
    '치료': '治療',
    '출전': '出撃',
    '편성': '編成',
    '자동전투': 'オートバトル',
    '자동전투 시작': 'オート戦闘開始',
    '자동전투 중지': 'オート戦闘停止',
    '전투 철수': '戦闘から撤退',
    '철수 불가': '撤退不可',
    '전투 승리': '戦闘勝利',
    '전투 패배': '戦闘敗北',
    '보스 토벌 대승리': 'ボストヴァル大勝利',
    '상세 로그': '詳細ログ',
    '전투 상세 기록': '戦闘詳細記録',
    '기본 공격': '通常攻撃',
    'MP 부족': 'MP不足',
    '쿨다운': 'クールダウン',
    '턴': 'ターン',
    '라운드': 'ラウンド',
    '행동자': '行動者',
    '최신 로그 보기': '最新ログを表示',
    '❄️ 빙결': '❄️ 凍結',
    '💫 기절': '💫 気絶',
    '심연 전진 탐색': '深淵前進探索',
    '야영 및 모닥불 휴식': '野営と焚火休息',
    '성채로 안전 귀환': '城塞へ安全帰還',
    '심연 위험도': '深淵危険度',
    '안정': '安定',
    '위험': '危険',
    '치명적 위험': '致命的危険',
    '귀환 포탈 발견': '帰還ポータル発見',
    '포탈을 타고 성채로 귀환': 'ポータルで帰還',
    '심연 탐험 계속하기': '探検を続ける',
    '심연 오버차지 발동 중': '深淵オーバーチャージ発動中',
    '영광의 결투장': '栄光の闘技場',
    '대전 상대 탐색': '対戦相手検索',
    '매칭 중...': 'マッチング中...',
    '결투 시작': '決闘開始',
    '최근 전적': '最近の戦績',
    '현재 레이팅': '現在のレーティング',

    // ── システムメニュー & 設定 ──
    '시스템 & 클라우드': 'システム & クラウド',
    '지휘관 프로필': '指揮官プロフィール',
    '인증 완료': '連携完了',
    '게스트 계정': 'ゲストアカウント',
    '오디오 & 사운드 설정': 'オーディオ & サウンド設定',
    '배경음악 (BGM)': 'BGM',
    '효과음 (SFX)': 'SE (効果音)',
    '사운드 테스트': 'サウンドテスト',
    '실시간 클라우드 동기화': 'リアルタイムクラウド同期',
    '전체화면 모드': '全画面モード',
    '언어 설정': '言語設定',
    '방주 백과사전 & 도감': '方舟百科事典 & 図鑑',
    '버전 정보 & 패치노트': 'バージョン情報 & 更新履歴',
    '지휘관 로그아웃': '指揮官ログアウト',
    '게임 데이터 초기화': 'ゲームデータ初期化',

    // ── 百科事典タブ ──
    '전체': '全て',
    '초반 공략': '序盤攻略',
    '직업 & 전직': '職業 & 転職',
    '몬스터 & 보스': '魔物 & ボス',
    '영지 시설': '領地施設',
    '장비 & 인챈트': '装備 & 付呪',
    '스킬 & 상태이상': 'スキル & 状態異常',
    '시스템 & 가이드': 'システム & ガイド',

    // ── 영지 시설 명칭 ──
    '방주의 성화': '方舟の聖火',
    '생존자 안식처': '生存者の安息所',
    '영목 벌채소': '霊木伐採所',
    '에테르 광맥 시추소': 'エーテル鉱脈採掘所',
    '심연 생체 정제소': '深淵生体精製所',
    '방랑자의 라운지': '放浪者のラウンジ',
    '심연의 병기창': '深淵の兵器廠',
    '영혼의 제단': '魂の祭壇',
    '에테르 연금 공방': 'エーテル錬金工房',
    '차원 앵커 게이트': '次元アンカーゲート',
    '방주 중앙 병참고': '方舟中央兵站庫',
    '생체 복원 병동': '生体復元病棟',
    '황혼의 블랙 마켓': '黄昏のブラックマーケット',

    // ── ダンジョン階層名 ──
    '침묵의 회랑': '沈黙の回廊',
    '망령의 납골당': '亡霊の納骨堂',
    '에테르 광맥': 'エーテル鉱脈',
    '심연의 균열': '深淵の亀裂',
    '원초의 제단': '原初の祭壇',
    '핏빛 성역': '血塗られた聖域',
    '망각의 묘지': '忘却の墓地',
    '단죄의 성채': '断罪の城塞',
    '환영의 미궁': '幻影の迷宮',
    '심연의 심장부': '深淵の心臓部',
    '무간도': '無間道',

    // ── 施設、鍛冶屋、病院、酒場、錬金、祭壇用語 ──
    '접두어 인챈트': '接頭辞エンチャント',
    '접미어 인챈트': '接尾辞エンチャント',
    '순수 마도석': '純粋魔導石',
    '강화 성공률': '強化成功率',
    '단조 레시피': '鍛造レシピ',
    '제작 비용': '製造費用',
    '필요 재료': '必要素材',
    '보유 재료': '所持素材',
    '재료 부족': '素材不足',
    '골드 부족': 'ゴールド不足',
    '강화 시도': '強化を試みる',
    '병상': '病床',
    '입원 환자': '入院患者',
    '집중 치료': '集中治療',
    '치료 중': '治療中',
    '퇴원시키기': '退院させる',
    '전원 퇴원': '全員退院',
    '방랑 용병 계약': '放浪傭兵契約',
    '용병 영입': '傭兵雇用',
    '새로고침': '更新',
    '현상금 의뢰': '賞金首依頼',
    '서브 퀘스트': 'サブクエスト',
    '의뢰 수락': '依頼受諾',
    '에테르 연금': 'エーテル錬金',
    '마도 비전서 제본': '魔導秘伝書の製本',
    '비전서 전수': '秘伝書伝授',
    '클래스 승격': 'クラス昇格',
    '1차 전직': '1次転職',
    '2차 심연 승격': '2次深淵昇格',
    '2차 초월 각성': '2次超越覚醒',
    '승격 조건': '昇格条件',
    '승격 단행': '昇格断行',
    '적재 용량': '積載容量',
    '보관 한도': '保管上限',
    '창고 확장': '倉庫拡張',
    '자원 매각': '資源売却',
    '골드 환전': 'ゴールド換金',
    '암시장 유물': '闇市遺物',
    '일괄 판매': '一括売却',
    '원정대 편성': '遠征隊編成',
    '용병 관리': '傭兵管理',
    '진형 배치': '陣形配置',
    '해고': '解雇',
    '목재 투입': '木材投入',
    '온기 버프': '温もりバフ',
    '불씨 지피기': '火を焚く',
    '성화 완전 점화': '聖火完全点火',
    '광고 충전': '広告チャージ',
    '탐험 채비실': '探検準備室',
    '배낭 선택': 'バックパック選択',
    '보급품 챙기기': '補給品準備',
    '심연 촉매': '深淵触媒',
    '출전 불가': '出撃不可',
    '강하 구역 선택': '降下階層選択',
    '전술 모멘텀': '戦術モメンタム',
    '모멘텀 뱃지': 'モメンタムバッジ',
    'FEVER 폭발': 'FEVERバースト',
    '원호 공격': '援護攻撃',
    '연계 콤보': '連携コンボ',
    '차징 브레이크': 'チャージブレイク',
    '수호 개입': '守護介入',
    '환영 반격': '幻影反撃',
    '치명타': '会心の一撃',
    '패치노트': '更新履歴',
    '백과사전': '百科事典',
    '도감': '図鑑',
    '계정 연동': 'アカウント連携',
    '클라우드 저장': 'クラウド保存',
    '클라우드 불러오기': 'クラウド読込',
    '저장 완료': '保存完了',
    '불러오기 완료': '読込完了',
    '방주 13대 영지 시설 도감': '方舟13大領地施設図鑑',
    '핵심 기능 및 증축 혜택': '主要機能＆増築恩恵',
    '식별자': '識別子',
    '최대 증축': '最大増築',
    '시설 증축 및 운용 안내': '施設増築・運用案内',
    '동': '棟',
    '종': '種',
    '건': '件',
    '초반 공략 로드맵': '序盤攻略ロードマップ',
    '초반 가이드': '序盤ガイド',
    '무기 고유 특성': '武器固有特性',
    '생존 FAQ': '生存FAQ',
    '탐험 전리품은 어디로 가나요?': '探検の戦利品はどこへ行きますか？',
    '탐험 중 획득한 아이템과 자원은 던전 배낭에 임시 보관되며, [성채 귀환]을 누르거나 포탈을 타면 성채 창고로 100% 안전하게 입고됩니다.': '探検中に獲得したアイテムと資源はダンジョンバッグに一時保管され、「城塞帰還」を押すかポータルを通ることで城塞倉庫に100%安全に搬入されます。',
    '탐험 중 전멸하면 어떻게 되나요?': '探検中に全滅した場合はどうなりますか？',
    '던전 배낭에 임시 보관 중이던 전리품을 잃어버리게 됩니다. 위험할 땐 무리하지 말고 [성채 귀환]을 누르거나, 전멸 위기 시 안전 귀환시켜주는 [차원의 호각]을 장착하세요.': 'ダンジョンバッグに一時保管中の戦利品を失います。危険を感じたら無理をせず「城塞帰還」を選択するか、全滅時に安全帰還を可能にする「次元の角笛」を装備してください。',
    '영웅이 전사하면 장비는 소멸되나요?': '英雄が戦死した場合、装備は消失しますか？',
    '아닙니다. 사경 상태에서 지속 피해 등으로 전사한 영웅이 착용하고 있던 모든 무기와 방어구, 장신구는 100% 성채 보관함으로 안전하게 회수됩니다.': 'いいえ。死境状態などで戦死した英雄が身につけていたすべての武器・防具・装飾品は、100%城塞保管庫へ安全に回収されます。',
    '전직 시 기존 스킬과 습득 스킬은 어떻게 되나요?': '転職時に元のスキルや習得したスキルはどうなりますか？',
    '영혼의 제단에서 1차 또는 2차 전직 시, 이전 클래스의 고유 스킬과 기존에 습득했던 모든 스킬이 소멸되지 않고 [학습한 스킬] 목록(최대 6개)으로 100% 안전하게 이동 및 보존됩니다.': '魂の祭壇で1次または2次転職を行う際、旧クラスの固有スキルおよび習得済みスキルはすべて消失せず「学習済みスキル」枠(最大6個)へ100%安全に保持・移動されます。',
    '마도서 제작 확률과 에테르 공방 해금은 어떻게 되나요?': '魔導書の製作確率とエーテル工房の解放はどうなっていますか？',
    '에테르 연금 공방의 레벨에 따라 기본(Lv.1, 80%), 희귀(Lv.3, 50%), 에픽(Lv.5, 30%), 전설(Lv.7, 10%) 마도서가 순차 해금되며, 실패 시 에테르 붕괴 연출이 발생합니다.': 'エーテル錬金工房のレベルに応じて、一般(Lv.1, 80%)、希少(Lv.3, 50%)、英雄(Lv.5, 30%)、伝説(Lv.7, 10%)の魔導書が順次解放され、製作失敗時にはエーテル崩壊演出が発生します。',
    '마물이 차징(Charging) 중일 때 어떻게 대처해야 하나요?': '魔物がチャージング中の時はどのように対処すべきですか？',
    '마물이 차징을 완료하여 기술 시전에 성공하면 확정 치명타와 방어 관통 50%의 치명적인 피해를 입힙니다. 기절, 빙결, 침묵, 또는 차징 붕괴(BREAK) 스킬을 집중하여 반드시 시전 전에 차징을 캔슬해야 합니다.': '魔物がチャージを完了してスキル発動に成功すると、確定会心および防御貫通50%の壊滅的被害を受けます。気絶・氷結・沈黙やチャージ崩壊(BREAK)スキルを集中させ、必ず発動前にキャンセルしてください。',
    '저주받은 장비 정화 시 연출과 결과는 일치하나요?': '呪われた装備の浄化時、演出と実際の結果は一致しますか？',
    '네, 병기창 정화 탭에서 정화 진행 시 드라마틱한 컷인 연출과 실제 성공/파괴 판정 결과가 100% 일치합니다. 또한 정화된 장비 목록은 정화 탭에 5분간 유지된 후 자동 정리됩니다.': 'はい。兵器工廠の浄化タブでの進行時、ドラマチックなカットイン演出と実際の成功／破壊判定結果は100%一致します。また浄化された装備リストは浄化タブに5分間保持された後、自動整理されます。',
    '도감(심연의 백과) 목록은 어떤 순서로 표시되나요?': '図鑑(深淵の百科)のリストはどのような順序で表示されますか？',
    '현재 보유한 재료로 즉시 등록 가능한 목록이 [✨ 등록 가능] 뱃지와 함께 최상단에 배치되며, 등록 가능한 항목이 없을 때는 가장 마지막에 등록 완료한 항목(최신 등록순)부터 순서대로 상단에 정렬됩니다.': '現在所持している素材で即座に登録可能な項目が「✨ 登録可能」バッジと共に最上段に配置され、登録可能な項目がない場合は最後に登録を完了した項目(最新登録順)から順に上段へ並びます。',
    '초기 마도서(2권씩 지급) 연독 & 진형 세팅 (탱·딜·힐 배치)': '初期魔導書(各2冊支給)学習＆陣形編成(タンク・アタッカー・ヒーラー)',
    '신임 지휘관에게 [강타], [응급처치], [화염 가르기] 마도서가 각 2권씩 기본 지급됩니다. 편성 화면 [스킬 서고]에서 마도서를 연독하여 스킬을 습득하세요. 최대 6개까지 스킬을 습득 및 보존할 수 있으며, 전직 후에도 모든 스킬이 안전하게 유지됩니다. 전열 아이리스에게 [강타], 중앙 시안에게 [화염 가르기/단검기술]을 세팅합니다.': '新任指揮官には「強打」「応急処置」「火炎斬り」の魔導書が各2冊ずつ基本支給されます。編成画面の「スキル書庫」で魔導書を読み進めてスキルを習得しましょう。最大6個までスキルを習得・保持可能で、転職後もすべてのスキルが安全に維持されます。前列アイリスに「強打」、中列シアンに「火炎斬り/短剣技」をセットしてください。',
    '백과사전 HTML 다운로드': '図鑑HTMLダウンロード',
    'HTML 다운로드': 'HTMLダウンロード',
    '현재 설정된 언어의 독립형 HTML 백과사전 문서를 로컬 파일로 다운로드합니다.': '現在設定されている言語の単体HTML図鑑文書をローカルファイルにダウンロードします。',
    '백과사전 다운로드': '図鑑ダウンロード',
    '다운로드 완료!': 'ダウンロード完了！',
    '다운로드 실패': 'ダウンロード失敗',
    '다운로드 중 오류가 발생했습니다.': 'ダウンロード中にエラーが発生しました。',
    '🛒 견고한 짐수레 사용 안내': '🛒 頑丈な荷車の利用案内',
    '광고 보고 1회 사용': '広告視聴で1回利用',
    '이 항목은 광고를 봐야 사용할 수 있습니다.': 'この項目は広告を視聴すると利用可能になります。',
    '견고한 짐수레(30칸 & 자원 스택 99)는 광고 1회 시청 시 이번 원정(1회) 동안 사용하실 수 있습니다.': '頑丈な荷車(30枠＆資源スタック99)は広告を1回視聴すると今回の遠征(1回)中に利用できます。',
    '광고를 시청하시겠습니까?': '広告を視聴しますか？',
    '인증 완료 (1회)': '認証完了 (1回)',
    '광고 시청 (1회)': '広告視聴 (1回)',
    '광고 시청': '広告視聴',
    '견고한 짐수레 1회 사용': '頑丈な荷車 1回利用',
    '짐수레 1회 사용 & 심연 촉매 슬롯 개방': '荷車1回利用＆深淵触媒スロット開放',
    '광고 보고 파밍 자원 2배 획득 (장비/오파츠 제외)': '広告視聴で採取資源2倍獲得 (装備/オーパーツ除く)',
    '파밍 자원 2배 획득 완료!': '採取資源2倍獲得完了！',
    '파밍 자원 2배 획득': '採取資源2倍獲得',
    '⚒️ 단조 스탯 편차(±30%) & [저주받은 장비] 정화 의식 및 5분 보존': '⚒️ 鍛造ステータス偏差(±30%)＆呪われた装備の浄化儀式と5分間保持',
    '📖 마도서(스킬북) 연독 & 전직 스킬 100% 보존 & 에테르 공방 제작': '📖 魔導書学習＆転職時スキル100%保存＆エーテル工房製作',
    '⚠️ 마물 차징(Charging) 메커니즘 & 브레이크(Break) 필수 수칙': '⚠️ 魔物チャージングメカニズム＆ブレイク必須心得',
    '📜 심연의 백과(Codex) 컬렉션 봉헌 & 등록 우선순위 시스템': '📜 深淵の百科(コーデックス)奉納＆登録優先度システム',
    '방주 백과사전': '方舟百科事典',
    '방주 백과사전 상세 열람': '方舟百科事典 詳細閲覧',
    '심연 몬스터 & 보스 기믹 도감': '深淵モンスター＆ボスギミック図鑑',
    '1층 ~ 10층 심연의 탑 서식 마물': '1層〜10層 深淵の塔生息魔物',
    '사용 스킬 & 특수 공격 패턴': '使用スキル＆特殊攻撃パターン',
    '사용 스킬 및 기믹:': '使用スキルおよびギミック:',
    '토벌 전리품 보상': '討伐戦利品報酬',
    '심연 몬스터 도감': '深淵モンスター図鑑',
    '장비 단조 & 마도석 인챈트 도감': '装備鍛造＆魔導石エンチャント図鑑',
    '마도석': '魔導石',
    '기본 단조 장비': '基本鍛造装備',
    '장비 기본 능력치 보정': '装備基本能力値補正',
    '단조 필요 재료': '鍛造必要素材',
    '장비 단조': '装備鍛造',
    '인챈트 마도석 옵션': 'エンチャント魔導石オプション',
    '인챈트 마도석': 'エンチャント魔導石',
    '인챈트 부여 고유 스킬': '付与固有スキル',
    '핵심 룰 & 시스템 가이드': '核心ルール＆システムガイド',
    '시스템 가이드': 'システムガイド',
    '세부 가이드 & 룰 설명:': '詳細ガイド＆ルール説明:',
    '전투 상성, 전열/후열, 유대, 위험도, 유지비': '戦闘相性、前列/後列、絆、危険度、維持費',
    '확인 (닫기)': '確認（閉じる）',
    '확대': '拡大',
    '병기창 무기 계열 고유 특성 뱃지': '兵器廠 武器系統固有特性バッジ',
    '신임 지휘관 초반 생존 & 번영 로드맵': '新任指揮官 序盤生存＆繁栄ロードマップ',
    '단계별 핵심 미션 완수 가이드': '段階別主要ミッション達成ガイド',
    '초반 6단계 완벽 생존 & 번영 로드맵': '序盤6段階 完璧生存＆繁栄ロードマップ',
    '무기 6종 고유 특성 뱃지 (Weapon Traits) 완전 해설': '武器6種固有特性バッジ（Weapon Traits）完全解説',
    '병기창 단조 시 무기별 고유 메커니즘': '兵器廠鍛造時 武器別固有メカニズム',
    '자주 묻는 질문 (FAQ) & 방주 생존 수칙': 'よくある質問（FAQ）＆方舟生存規則',
    '전멸 방지 & 보관 수칙': '全滅防止＆保管規則',
    '방주 종합 백과사전 & 도감': '方舟総合百科事典＆図鑑',
    '직업, 전직 계통, 몬스터 기믹, 영지 시설, 장비 인챈트, 상태이상 및 주요 시스템 가이드': '職業、転職系統、魔物ギミック、領地施設、装備付与、状態異常および主要システムガイド',
    '신성한 성화. 목재를 공헌하여 생산량 +15%, 전투 EXP +20%, 영지 용병 지속 재생 온기 버프를 활성화합니다.': '神聖なる聖火。木材を捧げて生産量+15%、戦闘EXP+20%、領地傭兵持続再生の温もりバフを有効化します。',
    '구출된 생존자 거주지. 방주에 세금(골드)을 13초마다 정기 납부합니다.': '救出された生存者の居住区。13秒ごとに方舟へ税金（ゴールド）を定期納付します。',
    '방주 외곽 목재 벌채 시설. 영지 증축과 성화 유지에 필요한 목재를 9초마다 생산합니다.': '方舟郊外の伐採施設。領地増築と聖火維持に必要な木材を9秒ごとに生産する。',
    '부유성 지반 채굴 시설. 11초마다 석재를 생산하며 점차 철광석도 함께 발굴합니다.': '浮遊城の地盤採掘施設。11秒ごとに石材を生産し、次第に鉄鉱石も発掘する。',
    '식량 정제 시설. 13초마다 보급 식량을 생산하고 무두질 가죽을 가공합니다.': '食料精製施設。13秒ごとに補給食料を生産し、鞣し革を加工します。',
    '용병 고용소. 방랑 용병을 계약 영입하고 서브 퀘스트를 수주하며 식량을 조달합니다.': '傭兵雇用所。放浪傭兵を契約加入させ、サブクエストを受注し食糧を調達します。',
    '장비 공방. 전술 무기 및 방어구 단조, 장비 강화 및 인챈트를 수행합니다.': '装備工房。戦術武器・防具の鍛造、装備強化およびエンチャントを行います。',
    '클래스 승격 시설. 용병들의 상위 클래스 전직과 초월 각성을 집전합니다.': 'クラス昇格施設。傭兵の上位クラス転職と超越覚醒を執り行います。',
    '에테르 연금 및 마도 시설. 15초마다 에테르를 정기 생산하고 마도서를 제본합니다.': 'エーテル錬金および魔導施設。15秒ごとにエーテルを定期生産し魔導書を製本します。',
    '차원 관문. 비동기 랭킹 결투, 네메시스 레이드 및 차원 영지 침공을 지원합니다.': '次元関門。非同期ランキング決闘、ネメシスレイドおよび次元領地侵攻を支援します。',
    '방주 중앙 물자 저장고. 레벨에 따라 27종 모든 자원의 최대 적재 용량을 확장합니다.': '方舟中央物資保管庫。レベルに応じて全27種の全資源の最大積載容量を拡張する。',
    '의료 시설. 부상당한 용병을 입원시켜 체력과 마나를 복원합니다.': '医療施設。負傷した傭兵を入院させHPとMPを復元します。',
    '암시장 교역소. 15종 자원 거래 및 환전을 지원하며 상업 골드를 수급합니다.': '闇市交易所。15種の資源取引や換金をサポートし、商業ゴールドを調達します。',

    // ── 英雄、魔物、スキル、戦闘タグ ──
    '아이리스': 'アイリス',
    '시안': 'シアン',
    '바르톨': 'バルトール',
    '바르돌': 'バルトール',
    '세레나': 'セレナ',
    '엘레나': 'エレナ',
    '클라우드': 'クラウド',
    '루나': 'ルナ',
    '카엘': 'カエル',
    '미아': 'ミア',
    '발렌타인': 'バレンタイン',
    '클로에': 'クロエ',
    '알렉스': 'アレックス',
    '세린': 'セリン',
    '로건': 'ローガン',
    '레이': 'レイ',
    '베아트리스': 'ベアトリス',
    '다리우스': 'ダリウス',
    '일레인': 'エレイン',
    '트리스탄': 'トリスタン',
    '실비아': 'シルヴィア',
    '가웨인': 'ガウェイン',
    '오리온': 'オリオン',
    '세실리아': 'セシリア',
    '펠릭스': 'フェリックス',
    '발레리아': 'ヴァレリア',
    '란슬롯': 'ランスロット',
    '카밀라': 'カミラ',
    '베르나르': 'ベルナール',
    '로웨나': 'ロウェナ',
    '하비': 'ハーヴェイ',
    '아델라인': 'アデライン',
    '아서': 'アーサー',
    '모건': 'モーガン',
    '기드온': 'ギデ온',
    '클레어': 'クレア',
    '로이드': 'ロイド',
    '아우렐리아': 'アウレリア',
    '시그루드': 'シグルド',
    '비비안': 'ヴィヴィアン',
    '롤랑': 'ローランド',
    '헥터': 'ヘクター',
    '헬레나': 'ヘレナ',
    '에드워드': 'エドワード',
    '에블린': 'エヴリン',
    '가브리엘': 'ガブリエル',
    '빅터': 'ヴィクター',
    '이사벨라': 'イザベラ',
    '타리크': 'タリク',
    '레오나': 'レオナ',
    '카이엔': 'カイエン',
    '디아나': 'ディアナ',
    '유리엘': 'ウリエル',
    '오스카': 'オスカー',
    '제노': 'ゼノ',
    '[궁극기]': '[究極技]',
    '[고유기]': '[固有技]',
    '★[궁극기]': '★[究極技]',
    '★[고유기]': '★[固有技]',
    '전직 궁극기': '転職究極技',
    '전직 고유기': '転職固有技',
    '[Block!]': '[Block!]',
    '🛡️[Block!]': '🛡️[Block!]',
    '[크리티컬!]': '💥[会心!]',
    '💥[크리티컬!]': '💥[会心!]',
    '[치명타]': '💥[会心!]',
    '💥[치명타]': '💥[会心!]',
    '[전열 수호]': '[前列守護]',
    '[전열 엄호]': '[前列援護]',
    '[면역 결계]': '[免疫結界]',
    '[저항(RESIST)]': '[抵抗(RESIST)]',
    '피격 환영 반격!': '幻影反撃!',
    '[피격 환영 반격!]': '[幻影反撃!]',
    '환영 반격!': '幻影反撃!',
    '[환영 반격!]': '[幻影反撃!]',
    '광역 강타!': '全体強打！',
    '수호 엄호!': '守護援護！',
    '총건의 전투 기록': '合計戦闘記録',
    '공허의 잠복자': '虚空の潜伏者',
    '동굴 흑익박쥐': '洞窟の黒翼コウモリ',
    '부패 점액체': '腐敗のスライム',
    '저주받은 망자': '呪われた死者',
    '폐허 철제 골렘': '廃墟の鉄製ゴーレム',
    '그림자 악귀': '影の悪鬼',
    '납골당 묘지 밴시': '納骨堂の墓地バンシー',
    '살점을 뜯는 구울': '肉裂きグール',
    '마도 수정 전갈': '魔導水晶サソリ',
    '마력 침식 가고일': '魔力侵食ガーゴイル',
    '균열의 차원 추적자': '亀裂の次元追跡者',
    '공허의 하수인 촉수괴수': '虚空の眷属触手怪獣',
    '종언의 제단 광신도': '終焉の祭壇の狂信者',
    '모노리스의 파멸 수호자': 'モノリスの破滅守護者',
    '심연의 망령 기사': '深淵の亡霊騎士',
    '침묵의 흑핵 거신': '沈黙の黒核巨神',
    '망령 군주 데스나이트': '亡霊君主デスナイト',
    '태고의 광맥 베히모스': '太古の鉱脈ベヒモス',
    '심연의 시공 왜곡자': '深淵の時空歪曲者',
    '공허의 침식자': '虚空の侵食者',
    '핏빛 늑대': '深血の狼',
    '타락한 사제': '堕落した司祭',
    '핏빛 대공': '深血の大公',
    '망각의 유령': '忘却の幽霊',
    '뼈 골렘': 'ボーンゴーレム',
    '망각의 묘지기': '忘却の墓守',
    '타락한 기사': '堕落した騎士',
    '이단 심문관': '異端審問官',
    '타락한 기사단장': '堕落した騎士団長',
    '거울의 환영': '鏡の幻影',
    '미궁의 지배자': '迷宮の支配者',
    '심연 군주': '深淵の君主',
    '무간의 지배자': '無間道の支配者',
    '종언의 메테오': '終焉のメテオ',
    '불멸의 결전분노': '不滅の決戦憤怒',
    '에테르 공명 탄막': 'エーテル共鳴弾幕',
    '천벌의 성십자가': '天罰の聖十字架',
    '군단 총진격': '軍団総進撃',
    '만화경 환영검무': '万華鏡幻影剣舞',
    '부활의 성가': '復活の聖歌',
    '시공 역류': '時空逆流',
    '절대 요새의 성역': '絶対要塞の聖域',
    '방주 결전포': '方舟決戦砲',
    '유령 탄환': '幽霊弾丸',
    '사신 스나이프': '死神スナイプ',
    '성전의 천벌': '聖戦の天罰',
    '시간 역행': '時間逆行',
    '만화경 환영난무': '万華鏡幻影乱舞',
    '절대 불락의 성채': '絶対不落の要塞',
    '그림자 기습': '影の奇襲',
    '출혈 발톱': '出血の爪',
    '초음파 강타': '超音波強打',
    '혼란의 울음': '混乱の咆哮',
    '독성 분사': '毒性噴射',
    '점성 포획': '粘性捕獲',
    '영혼 흡수': '魂の吸収',
    '저주의 포옹': '呪いの抱擁',
    '철권 강타': '鉄拳強打',
    '중력 압쇄': '重力圧砕',
    '암흑 할퀴기': '暗黒の爪',
    '군집 난무': '群集乱舞',
    '비탄의 절규': '悲嘆の絶叫',
    '영혼 침식': '魂の浸食',
    '썩은 송곳니': '腐った牙',
    '시체 섭취': '死体摂取',
    '비전 침 찌르기': '秘術の針突き',
    '수정 외골격': '水晶外骨格',
    '에테르 파동포': 'エーテル波動砲',
    '비전 급강하': '秘術急降下',
    '차원 도약 습격': '次元跳躍襲撃',
    '공간 왜곡': '空間歪曲',
    '심연의 촉수 난타': '深淵の触手乱打',
    '흑무 흡수': '黒霧吸収',
    '묵시록의 흑염': '黙示録の黒炎',
    '암흑 제물 공양': '暗黒生贄供養',
    '파멸의 모노리스 강타': '破滅のモノリス強打',
    '절대 성벽 방진': '絶対城壁方陣',
    '암흑의 일도양단': '暗黒の一刀両断',
    '망령의 방벽': '亡霊の防壁',
    '공포의 사자후': '恐怖の獅子吼',
    '침묵의 대지 분쇄': '沈黙の大地粉砕',
    '동결의 흑핵 방출': '凍結の黒核放出',
    '고대 석벽 결계': '古代石壁結界',
    '망령의 영혼 처형': '亡霊の魂処刑',
    '원혼의 파멸 오라': '怨魂の破滅オーラ',
    '영겁의 불굴 방벽': '永劫の不屈防壁',
    '광맥의 에테르 폭발': '鉱脈のエーテル爆発',
    '마도 결정 쇄도': '魔導結晶の波動',
    '대지의 고동': '大地の鼓動',
    '시공간 균열 붕괴': '時空間亀裂崩壊',
    '차원 닻 강타': '次元錨強打',
    '시공 역행 결계': '時空逆行結界',
    '파멸의 공허 폭풍': '破滅の虚空嵐',
    '시공간 붕괴격': '時空間崩壊撃',
    '흑무의 잠식': '黒霧の浸食',
    '심연의 저주': '深淵の呪い',
    '물어뜯기': '噛みつき',
    '광기의 울부짖음': '狂気の遠吠え',
    '검은 권능': '黒き権能',
    '피의 의식': '血の儀式',
    '핏빛 파동': '深血の波動',
    '흡혈의 일격': '吸血の一撃',
    '한기 서린 손아귀': '冷気の爪痕',
    '뼈 분쇄': '骨粉砕',
    '영혼 수확': '魂の収穫',
    '사신의 낫': '死神の鎌',
    '칠흑의 검': '漆黒の剣',
    '화형 선고': '火刑宣告',
    '집행자의 심판': '執行者の審判',
    '타락한 성역': '堕落した聖域',
    '일루전 스트라이크': 'イリュージョンストライク',
    // ── 원호 공격 계열/스킬/대사/효과 JA ──
    '수호 기사계': '守護騎士系',
    '그림자 암살계': '影の暗殺系',
    '원소 마도계': '元素魔導系',
    '신성 구원계': '神聖救済系',
    '광전사 선봉계': '狂戦士先鋒系',
    '마총 저격계': '魔銃狙撃系',
    '수호의 방패 원호': '守護の盾援護',
    '그림자 기습 비수': '影の急襲短剣',
    '에테르 공명 탄막': 'エーテル共鳴弾幕',
    '빛의 단죄와 가호': '光の断罪と加護',
    '전장의 분노 추격타': '戦場の怒り追撃',
    '전술 마도 저격': '戦術魔導狙撃',
    '방어선은 내가 지킨다! 연계 돌파!': '防衛線は私が守る！連携突破！',
    '빈틈이다. 급소 포착!': '隙あり。急所を捉えた！',
    '마력 파동 증폭, 일제 방출!': '魔力波動増幅、一斉放出！',
    '빛의 정의가 함께하길! 정화하라!': '光の正義があらんことを！浄化せよ！',
    '지금이다! 뼈까지 부숴주마!': '今だ！骨まで砕いてやる！',
    '사선 확보 완료. 격발!': '射線確保完了。撃発！',
    '원호 사격 개시!': '援護射撃開始！',
    '마력 지원 들어간다!': '魔力支援入るぞ！',
    '내가 엄호하마!': '私が援護する！',
    '화망 전개! 일제 사격!': '弾幕展開！一斉射撃！',
    '틈을 놓칠 순 없지!': 'この隙は見逃さない！',
    '비전의 빛이여, 꿰뚫어라!': '秘術の光よ、貫け！',
    '적 차징 100 파쇄 및 아군 전체 최대 HP 12% 보호막 전개': '敵のチャージを100破砕＆味方全体に最大HPの12%シールド展開',
    '방어력을 100% 무시하는 확정 치명타 및 2턴 깊은 출혈 부여': '防御力100%無視の確定会心＆2ターンの重度出血を付与',
    '마법 광역 탄막 연타 및 아군 파티 전원 MP 10 반환': '魔法広域弾幕連打＆パーティ全員のMPを10還元',
    '신성 단죄 타격 및 최저 체력 아군 1명 체력 30% 즉각 응급 치유': '神聖断罪打撃＆最低体力味方1体の体力を30%即時応急回復',
    '묵직한 물리 파괴 일격 및 2턴간 대상의 공격력 30% 강제 억제': '重厚な物理破壊一撃＆2ターンの間対象の攻撃力を30%強制抑制',
    '방어 관통 마도탄 저격 및 2턴간 대상 방어력 35% 추가 분쇄': '防御貫通魔導弾狙撃＆2ターンの間対象の防御力を35%追加粉砕',
    '원호!': '援護！',
    '원호 사격!': '援護射撃！',
    '추가 공격!': '追加攻撃！',
    '비전 원호!': '秘術援護！',
    '약점 추격 원호!': '弱点追撃援護！',
    // ── 시너지 패널 & 배지 JA ──
    '원정대 활성 시너지': '遠征隊発動シナジー',
    '영혼 결속': '魂の結束',
    '도감 완성': '図鑑完成',
    '개 발동 중': '個発動中',
    '심연의 백과 (도감 완성 종합 가호)': '深淵の百科（図鑑完成総合加護）',
    '현재 발동된 원정대 시너지가 없습니다.': '現在発動中の遠征隊シナジーはありません。',
    '현재 파티 조합 시너지는 없으나, 심연의 백과 도감 가호가 상시 적용 중입니다.': 'パーティ組み合わせシナジーはありませんが、図鑑の加護が常時適用されています。',
    '도감 확인 ➔': '図鑑確認 ➔',
    '조합 확인 ➔': '組み合わせ確認 ➔',
    '달성률': '達成率',
    '심연의 백과 도감 열기': '深淵の百科図鑑を開く',
    '시너지 조합 도감 열기': 'シナジー図鑑を開く',
    '전능력치': '全能力値',
    '턴당 체력': '毎ターンHP',
    '턴당 마나': '毎ターンMP',
    '전열 엄호': '前列援護',
    '중열 회피': '中列回避',
    '개시 보호막': '開始シールド',
    '처형 피해': '処刑ダメージ',
    '피해감소': 'ダメージ減少',
    '치명타': '会心率',
    '치명피해': '会心ダメージ',
    '관통': '貫通',
    '흡혈': '吸血',
    '모든피해': '全ダメージ',
    '경험치': '経験値',
    '유지비': '維持費',
    '생산': '生産',
    '최대HP': '最大HP',
    '최대MP': '最大MP',
    '영구 패시브': '永久パッシブ',
    '도감 열기 ➔': '図鑑を開く ➔',
    '항목': '項目',
    '탱/딜/힐 역할군 조합, 진형 배치, 성채 묘지 영혼 결속, 또는 심연의 백과(도감) 수집을 통해 시너지를 발동할 수 있습니다.': 'タンク/アタッカー/ヒーラーの役割編成、陣形配置、城塞墓地の魂結束、または深淵の百科収集によってシナジーを発動できます。',
    '클릭하여 심연의 백과 도감 열기': 'クリックして深淵の百科図鑑を開く',
    // ── 던전 조우 이벤트 모달 및 선택지 JA ──
    '삼위일체 밸런스': '三位一体バランス',
    '난공불락의 불멸성채': '難攻不落の不滅城塞',
    '강철의 철벽 방진': '鋼鉄の鉄壁方陣',
    '대파멸 비전 의식': '大破滅の秘術儀式',
    '마도 폭주 결사단': '魔導暴走決死隊',
    '융단 폭격 섬멸전': '絨毯爆撃殲滅戦',
    '전탄 일제 사격': '全弾一斉射撃',
    '무간 피의 도살군단': '無間血の虐殺軍団',
    '광기의 피의 축제': '狂気の血の祝祭',
    '절대 암살 참수단': '絶対暗殺斬首団',
    '그림자 암살 연대': '影の暗殺連隊',
    '불멸의 성역 결계': '不滅の聖域結界',
    '성스러운 구원의 빛': '聖なる救済の光',
    '신성 성기사단': '神聖聖騎士団',
    '마도 중화기 공학': '魔導重火器工学',
    '암영 광풍 연격단': '暗影狂風連撃団',
    '철혈의 돌격 선봉': '鉄血の突撃先鋒',
    '성전의 저격 지원': '聖戦の狙撃支援',
    '마도 성역 수호': '魔導聖域守護',
    '그림자 성전단': '影の聖戦団',
    '전천후 초토화 폭격': '全天候焦土化爆撃',
    '비전 암살 결사': '秘術暗殺結社',
    '표준 삼각 편대': '標準三角編隊',
    '돌격 배수진': '突撃背水の陣',
    '후방 집중 화망': '後方集中火網',
    '신속 유격 진형': '迅速遊撃陣形',
    '베테랑 정예 원정단': 'ベテラン精鋭遠征団',
    '전설의 영웅단': '伝説の英雄団',
    '각성한 신화의 군단': '覚醒した神話の軍団',
    '심연의 악마': '深淵の悪魔',
    '악마의 손톱': '悪魔の爪',
    '심연의 베헤모스': '深淵のベヒーモス',
    '지각 변동': '地殻変動',
    '심연의 포효': '深淵の咆哮',
    '심연의 군주 아스모데우스': '深淵の君主アスモデウス',
    '심연의 군주 아스모데우스 (10F 보스)': '深淵の君主アスモデウス (10Fボス)',
    '종말의 숨결': '終末の息吹',
    '절망의 장막': '絶望の帳',
    '파멸의 일격': '破滅の一撃',
    '무간의 지배자 아르케오스': '無間の支配者アルケオス',
    '무간의 지배자 아르케오스 (진 최종 보스)': '無間の支配者アルケオス (真・最終ボス)',
    '무간의 태초 파동': '無間の原初の波動',
    '공허의 절대 침식': '虚無の絶対侵食',
    '멸망의 창조 일격': '滅亡の創造一撃',
    '종언의 광신도': '終焉の狂信者',
    '종언의 제단 광신도': '終焉の祭壇の狂信者',
    '핏빛 대공 (6F 보스)': '血の太公 (6Fボス)',
    '망각의 묘지기 (7F 보스)': '忘却の墓守 (7Fボス)',
    '타락한 기사단장 (8F 보스)': '堕落した騎士団長 (8Fボス)',
    '미궁의 지배자 (9F 보스)': '迷宮の支配者 (9Fボス)',
    '공허의 추적자': '虚無の追跡者',
    '공허의 일격': '虚無の一撃',
    '파편의 폭풍': '破片の嵐',
    '현혹의 거울': '幻惑の鏡',
    '차원 균열의 닻': '次元亀裂の錨',
    '차원 심연의 닻': '次元深淵の錨',
    '균열의 닻': '亀裂の錨',
    '심연의 닻': '深淵の錨',
    '차원의 닻': '次元の錨',
    '차원의 나침반': '次元の羅針盤',
    '시공간의 나침반': '時空間の羅針盤',
    '긴급 이송 & 유해 운구 시스템': '緊急移送＆遺骸運搬システム',
    '차원 균열의 닻 긴급 이송 & 유해 운구 시스템': '次元亀裂の錨緊急移送＆遺骸運搬システム',
    '차원 심연의 닻 긴급 이송 & 유해 운구 시스템': '次元深淵の錨緊急移送＆遺骸運搬システム',
    '균열의 닻 적용': '亀裂の錨適用',
    '심연의 닻 적용': '深淵の錨適用',
    '균열의 닻 적용 중': '亀裂の錨適用中',
    '심연의 닻 적용 중': '深淵の錨適用中',
    '시공간의 나침반 활성화': '時空間の羅針盤活性化',
    '시공간의 나침반 활성화 중': '時空間の羅針盤活性化中',
    '차원의 나침반 활성화 중': '次元の羅針盤活性化中',
    '차원의 나침반 촉매를 채비하면 이송 턴이 추가로 1턴 더 단축됩니다.': '次元の羅針盤触媒を準備すると移送ターンがさらに1ターン短縮されます。',
    '💡 팁: 차원의 나침반 촉매를 채비하면 이송 턴이 추가로 1턴 더 단축됩니다.': '💡 ヒント: 次元の羅針盤触媒を準備すると移送ターンがさらに1ターン短縮されます。',
    '소환된 대원은 차원 균열을 통해 3턴 후 원정대에 도착하여 합류합니다.': '召喚された隊員は次元の亀裂を通じて3ターン後に遠征隊に到着して合流します。',
    '고대 시공간 안정화 권능으로 기본 이송 턴이 2턴으로 단축됩니다! (일반 균열의 닻 3턴 ➔ 2턴)': '古代の時空間安定化権能により基本移送ターンが2ターンに短縮されます！（通常亀裂の錨 3ターン ➔ 2ターン）',
    '초월 시공간 왜곡 권능으로 대기 턴 없이 즉시 합류(0턴)합니다!': '超越時空間歪曲権能により待機ターンなしで即時合流（0ターン）します！',
    '시공간 왜곡 권능으로 소환 대원의 이송 턴이 추가 1턴 단축됩니다!': '時空間歪曲権能により召喚隊員の移送ターンが追加で1ターン短縮されます！',
    '현재 차원 이송 작전이 진행 중입니다!': '現在次元移送作戦が進行中です！',
    '이송이 완료된 후 다음 긴급 이송을 요청할 수 있습니다.': '移送が完了した後に次の緊急移送を要請できます。',
    '1단계: 방주로 복귀/운구할 원정대원 선택': 'ステップ1: 方舟へ帰還/運搬する遠征隊員を選択',
    '2단계: 방주 대기소에서 호출할 후방 용병 선택': 'ステップ2: 方舟待機所から招集する後方傭兵を選択',
    '호출 가능한 대기 용병이 없습니다 (성채 대기소에 다른 용병이 필요합니다).': '招集可能な待機傭兵がいません（城塞待機所に他の傭兵が必要です）。',
    '차원의 닻 부족 (균열의 닻 또는 심연의 닻 1개 필요)': '次元の錨不足（亀裂の錨または深淵の錨が1個必要）',
    '1단계: 귀환/운구 대상을 선택하세요': 'ステップ1: 帰還/遺体搬送の対象を選択してください',
    '2단계: 호출할 후방 용병을 선택하세요': 'ステップ2: 招集する後方傭兵を選択してください',
    '보유 닻 없음 (0개)': '保有の錨なし（0個）',
    '버려진 고대 보물 상자': '見捨てられた古代の宝箱',
    '대형 보물 상자 (피의 서약)': '大型宝箱（血の誓約）',
    '에테르 광맥 발견': 'エーテル鉱脈発見',
    '잠긴 고대 영웅의 석관': '封印された古代英雄の石棺',
    '타락한 여신의 제단': '堕ちた女神の祭壇',
    '갈림길 & 미궁의 샛길': '分かれ道＆迷宮の抜け道',
    '길 잃은 방랑 보급관': '道に迷った放浪補給官',
    '신비로운 에테르 기류': '神秘的なエーテル気流',
    '무작위 귀환 포탈 발견': 'ランダム帰還ポータル発見',
    '무간도 시공간 균열 발견': '無間道時空間亀裂発見',
    '차원 지름길 발견': '次元近道発見',
    '차원 포탈 & 심연 오버차지': '次元ポータル＆深淵オーバーチャージ',
    '무간도 중간 보스 토벌 완료!': '無間道中ボス討伐完了！',
    '확인 (2초 후 자동 닫힘)': '確認（2秒後自動で閉じる）',
    '무시하고 탐험 계속': '無視して探索を続ける',
    '심연의 어둠 속에서 마도 결계로 잠긴 보물 상자를 발견했습니다.\n어떻게 개방하시겠습니까?': '深淵の暗闇の中で魔導結界で施錠された宝箱を発見しました。\nどのように開放しますか？',
    '벽면을 따라 영롱한 빛을 내뿜는 마도 광맥이 노출되어 있습니다.\n어떻게 채굴하시겠습니까?': '壁面に沿って神秘的な輝きを放つ魔導鉱脈が露出しています。\nどのように採掘しますか？',
    '심연의 결계 룬으로 단단히 잠긴 석관이 안치되어 있습니다.\n어떻게 개방하시겠습니까?': '深淵の結界ルーンで固く閉ざされた石棺が安置されています。\nどのように開放しますか？',
    '심연의 어둠 속에서도 미약한 성스러운 기운을 내뿜는 여신상이 서 있습니다.\n어떻게 행동하시겠습니까?': '深淵の暗闇の中でも微かな聖なるオーラを放つ女神像が立っています。\nどのように行動しますか？',
    '광폭화 보스를 토벌하여 차원 포탈이 완전히 안정화되었습니다. 다음 행동을 선택하세요.': '暴走ボスを討伐し、次元ポータルが完全に安定しました。次の行動を選択してください。',
    '보스를 물리치고 차원 포탈을 확보했습니다. 다음 행동을 선택하세요.': 'ボスを撃破し、次元ポータルを確保しました。次の行動を選択してください。',
  }
};

// ============================================================================
// 2. DYNAMIC LOG PATTERNS (Regex -> Template replacement)
// ============================================================================
export interface LogPatternDef {
  pattern: RegExp;
  en: (match: RegExpMatchArray) => string;
  ja: (match: RegExpMatchArray) => string;
}

// ── 로그 내부 엔티티(영웅/몬스터/스킬) 안전 치환 헬퍼 ──
export const trEntity = (name: string, lang: 'en' | 'ja'): string => {
  if (!name) return '';
  let trimmed = name.trim();

  // 0. 중첩 대괄호 정리: "[[궁극기] ...]" -> "[궁극기] ..."
  if (trimmed.startsWith('[[') && trimmed.endsWith(']')) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // 1. 알파벳 접미사 (예: "종언의 제단 광신도 A")
  const alphaMatch = trimmed.match(/^(.+?)\s+([A-Z])$/);
  if (alphaMatch) {
    const base = alphaMatch[1].trim();
    const sfx = alphaMatch[2];
    const trBase = EXACT_TRANSLATIONS[lang]?.[base] || base;
    return `${trBase} ${sfx}`;
  }

  // 2. [궁극기] / ★[궁극기] / [고유기] 접두사 (예: "[궁극기] 종언의 메테오")
  const ultMatch = trimmed.match(/^(\★?\[(?:궁극기|고유기)\])\s*(.+)$/);
  if (ultMatch) {
    const tag = ultMatch[1];
    const skill = ultMatch[2].trim();
    const trTag = EXACT_TRANSLATIONS[lang]?.[tag] || (tag.includes('궁극기') ? (lang === 'ja' ? '[究極技]' : '[Ultimate]') : tag);
    const trSkill = EXACT_TRANSLATIONS[lang]?.[skill] || skill;
    return `${trTag} ${trSkill}`;
  }

  // 3. 단독 대괄호 태그 (예: "[아이리스]")
  const bracketMatch = trimmed.match(/^\[(.+?)\]$/);
  if (bracketMatch) {
    const inner = bracketMatch[1].trim();
    const trInner = EXACT_TRANSLATIONS[lang]?.[inner] || inner;
    return `[${trInner}]`;
  }

  // 4. 원호 타이틀 (예: "[아리아]의 원호!", "[로웰]의 원호 사격!", "[영웅]의 추가 공격!")
  const assistMatch = trimmed.match(/^\[(.+?)\]의\s*(.+)$/);
  if (assistMatch) {
    const hero = assistMatch[1].trim();
    const action = assistMatch[2].trim();
    const trHero = EXACT_TRANSLATIONS[lang]?.[hero] || hero;
    const trAction = EXACT_TRANSLATIONS[lang]?.[action] || action;
    return lang === 'ja' ? `[${trHero}]の${trAction}` : `[${trHero}]'s ${trAction}`;
  }

  return EXACT_TRANSLATIONS[lang]?.[trimmed] || trimmed;
};

export const LOG_PATTERNS: LogPatternDef[] = [
  // ── 👾 몬스터 및 영웅 공격 헤더/메인 패턴 ──
  // ▶ 👾 몬스터 [스킬] (광역 강타!)
  {
    pattern: /^▶\s*👾\s*(.+?)\s*\[(.+?)\](?:\s*(광역 강타!))?$/i,
    en: m => `▶ 👾 ${trEntity(m[1], 'en')} [${trEntity(m[2], 'en')}]${m[3] ? ' AoE Strike!' : ''}`,
    ja: m => `▶ 👾 ${trEntity(m[1], 'ja')} [${trEntity(m[2], 'ja')}]${m[3] ? ' 広域強打！' : ''}`
  },
  // ▶ ⚔️ 영웅 [스킬] (💥[크리티컬!]) → 몬스터 X 피해 (중첩 대괄호 [[궁극기] ...] 지원)
  {
    pattern: /^▶\s*⚔️\s*(.+?)\s*\[(\[.+?\]|.+?)\](\s*💥\[(?:치명타|크리티컬!)\])?\s*→\s*(.+?)\s*(\d+)\s*피해(.*)$/i,
    en: m => {
      let tail = m[6] || '';
      tail = tail.replace(/🛡️\(방어 감쇄: 최소 피해 1\)/g, ' 🛡️(DEF mitigation: min damage 1)')
                 .replace(/\(보호막\s*(\d+)\s*흡수\)/g, ' (Absorbed $1 Barrier)');
      return `▶ ⚔️ ${trEntity(m[1], 'en')} [${trEntity(m[2], 'en')}]${m[3] ? ' 💥[CRITICAL!]' : ''} → ${trEntity(m[4], 'en')} ${m[5]} DMG${tail}`;
    },
    ja: m => {
      let tail = m[6] || '';
      tail = tail.replace(/🛡️\(방어 감쇄: 최소 피해 1\)/g, ' 🛡️(防御減衰: 最小ダメージ1)')
                 .replace(/\(보호막\s*(\d+)\s*흡수\)/g, ' (シールド$1吸収)');
      return `▶ ⚔️ ${trEntity(m[1], 'ja')} [${trEntity(m[2], 'ja')}]${m[3] ? ' 💥[会心!]' : ''} → ${trEntity(m[4], 'ja')}に${m[5]}ダメージ${tail}`;
    }
  },
  // ▶ 🛡️ [보호막 방어 / Block!] 영웅 [스킬] → 몬스터의 보호막이 공격을 완전히 흡수했습니다!
  {
    pattern: /^▶\s*🛡️\s*\[보호막 방어\s*\/\s*Block!\]\s*(.+?)\s*\[(.+?)\]\s*→\s*(.+?)의\s*보호막이 공격을 완전히 흡수했습니다!\s*\(보호막\s*(\d+)\s*흡수\)$/i,
    en: m => `▶ 🛡️ [Barrier Block!] ${trEntity(m[1], 'en')} [${trEntity(m[2], 'en')}] → ${trEntity(m[3], 'en')}'s barrier completely absorbed the attack! (Absorbed ${m[4]} Barrier)`,
    ja: m => `▶ 🛡️ [シールド防御 / Block!] ${trEntity(m[1], 'ja')} [${trEntity(m[2], 'ja')}] → ${trEntity(m[3], 'ja')}のシールドが攻撃を完全に吸収しました！（シールド${m[4]}吸収）`
  },
  // 🛡️ [보호막 방어 / Block!] assistTitle → 몬스터의 보호막이 공격을 완전히 흡수했습니다!
  {
    pattern: /^🛡️\s*\[보호막 방어\s*\/\s*Block!\]\s*(.+?)\s*→\s*(.+?)의\s*보호막이 공격을 완전히 흡수했습니다!\s*\(보호막\s*(\d+)\s*흡수\)$/i,
    en: m => `🛡️ [Barrier Block!] ${trEntity(m[1], 'en')} → ${trEntity(m[2], 'en')}'s barrier completely absorbed the attack! (Absorbed ${m[3]} Barrier)`,
    ja: m => `🛡️ [シールド防御 / Block!] ${trEntity(m[1], 'ja')} → ${trEntity(m[2], 'ja')}のシールドが攻撃を完全に吸収しました！（シールド${m[3]}吸収）`
  },
  // [대상] 💨빗나감(MISS)
  {
    pattern: /^\[(.+?)\]\s*💨(?:빗나감\s*)?\(MISS\)$/i,
    en: m => `[${trEntity(m[1], 'en')}] 💨MISS`,
    ja: m => `[${trEntity(m[1], 'ja')}] 💨ミス(MISS)`
  },
  // [대상] 👥[은신 회피] 광역 피해 50% 경감
  {
    pattern: /^\[(.+?)\]\s*👥\[은신 회피\]\s*광역 피해\s*(\d+)%\s*경감$/i,
    en: m => `[${trEntity(m[1], 'en')}] 👥[Stealth Evade] AoE DMG reduced by ${m[2]}%`,
    ja: m => `[${trEntity(m[1], 'ja')}] 👥[隠密回避] 広域ダメージ${m[2]}%軽減`
  },
  // 🛡️[중장갑 방벽 70% 무효화]
  {
    pattern: /^🛡️\[중장갑 방벽\s*(\d+)%\s*무효화\]$/i,
    en: m => `🛡️[Heavy Armor Barrier: Negated ${m[1]}%]`,
    ja: m => `🛡️[重装甲防壁 ${m[1]}%無効化]`
  },
  // 💥⚠️[차징 방출: 확정 치명타 & 방어 관통 50%!]
  {
    pattern: /^💥⚠️\[차징 방출:\s*확정 치명타\s*&\s*방어 관통\s*(\d+)%!\]$/i,
    en: m => `💥⚠️[Charge Unleashed: Guaranteed CRIT & DEF Pierce ${m[1]}%!]`,
    ja: m => `💥⚠️[チャージ解放：確定会心＆防御貫通${m[1]}%!]`
  },
  // 🩸[흡혈 +X HP 회복]
  {
    pattern: /^🩸\[흡혈\s*\+(\d+)\s*HP\s*회복\]$/i,
    en: m => `🩸[Life Drain: Restored +${m[1]} HP]`,
    ja: m => `🩸[吸血 +${m[1]} HP回復]`
  },
  // 🌀[action! pos로 이동]
  {
    pattern: /^🌀\[(.+?)!\s*(.+?)로\s*이동\]$/i,
    en: m => `🌀[${m[1]}! Moved to ${trEntity(m[2], 'en')}]`,
    ja: m => `🌀[${m[1]}! ${trEntity(m[2], 'ja')}へ移動]`
  },
  // ⚠️💥[적 연계 폭발! icon name] -X
  {
    pattern: /^⚠️💥\[적 연계 폭발!\s*(.+?)\s*(.+?)\]\s*-(\d+)$/i,
    en: m => `⚠️💥[Enemy Combo Detonation! ${m[1]} ${m[2]}] -${m[3]}`,
    ja: m => `⚠️💥[敵連携爆発! ${m[1]} ${m[2]}] -${m[3]}`
  },
  // ☣️ [독액 비산] name에게 중독이 튀었습니다!
  {
    pattern: /^☣️\s*\[독액 비산\]\s*(.+?)에게\s*중독이 튀었습니다!$/i,
    en: m => `☣️ [Venom Splash] Poison splashed onto ${trEntity(m[1], 'en')}!`,
    ja: m => `☣️ [毒液飛散] ${trEntity(m[1], 'ja')}に猛毒が飛び散りました！`
  },
  // ✝️[전투 신앙 MP +X]
  {
    pattern: /^✝️\[전투 신앙 MP\s*\+(\d+)\]$/i,
    en: m => `✝️[Combat Faith MP +${m[1]}]`,
    ja: m => `✝️[戦闘信仰 MP +${m[1]}]`
  },
  // ✝️[심판자의 은총 파티 치유 +X]
  {
    pattern: /^✝️\[심판자의 은총 파티 치유\s*\+(\d+)\]$/i,
    en: m => `✝️[Judge's Grace: Party Heal +${m[1]}]`,
    ja: m => `✝️[審判者の恩寵 パーティ回復 +${m[1]}]`
  },
  // 🏃 [전투 철수 성공!]
  {
    pattern: /^🏃\s*\[전투 철수 성공!\]\s*적의 추격을 뿌리치고 안전하게 후퇴했습니다\.\s*\(탈출 확률:\s*(\d+)%,\s*행운 보정:\s*([+-]?\d+)%\)$/i,
    en: m => `🏃 [Retreat Success!] Safely escaped enemy pursuit and retreated. (Escape Rate: ${m[1]}%, Luck Bonus: ${m[2]}%)`,
    ja: m => `🏃 [戦闘撤退成功!] 敵の追撃を振り切り無事に撤退しました。（脱出確率: ${m[1]}%、幸運補正: ${m[2]}%）`
  },
  // ⚠️ [전투 철수 실패!]
  {
    pattern: /^⚠️\s*\[전투 철수 실패!\]\s*퇴로가 막혀 도주에 실패했습니다!\s*\(성공률:\s*(\d+)%\s*실패,\s*적 반격 턴\)$/i,
    en: m => `⚠️ [Retreat Failed!] Escape route was blocked; retreat failed! (${m[1]}% failure, enemy counter turn)`,
    ja: m => `⚠️ [戦闘撤退失敗!] 退路を塞がれ逃走に失敗しました！（成功率${m[1]}%失敗、敵反撃ターン）`
  },
  // ⚠️ 광폭화된 심연 결계로 인해 전투에서 철수할 수 없습니다!
  {
    pattern: /^⚠️\s*광폭화된 심연 결계로 인해 전투에서 철수할 수 없습니다!$/i,
    en: () => '⚠️ Frenzy abyssal barrier prevents retreat from battle!',
    ja: () => '⚠️ 暴走した深淵結界により戦闘から撤退できません！'
  },
  // ── 📊 전투 상세 모달 헤더 및 안내 문구 ──
  {
    pattern: /^총\s*(\d+)건의 전투 기록$/i,
    en: m => `Total ${m[1]} combat records`,
    ja: m => `合計${m[1]}件の戦闘記録`
  },
  {
    pattern: /^스크롤하여 이전 기록을 확인할 수 있습니다\.?$/i,
    en: () => 'Scroll to view previous battle records.',
    ja: () => 'スクロールして以前の戦闘記録を確認できます。'
  },
  {
    pattern: /^기록된 전투 로그가 없습니다\.?$/i,
    en: () => 'No battle logs recorded.',
    ja: () => '記録された戦闘ログはありません。'
  },

  // ── 🛡️ 전열 수호 엄호 및 분담 피해 ──
  {
    pattern: /🛡️\s*\[전열 수호\]\s*(.+?)(?:이\(가\)|이|가)\s*후열\s*(.+?)\s*엄호\s*\(-?(\d+)%\s*경감(?:,\s*분담 피해\s*-?(\d+))?\)/i,
    en: m => `🛡️ [Frontline Guard] ${trEntity(m[1], 'en')} covered backline ${trEntity(m[2], 'en')} (-${m[3]}% reduction${m[4] ? `, shared DMG -${m[4]}` : ''})`,
    ja: m => `🛡️ [前列守護] ${trEntity(m[1], 'ja')}が後列の${trEntity(m[2], 'ja')}を援護（-${m[3]}% 軽減${m[4] ? `、分担被害 -${m[4]}` : ''}）`
  },
  {
    pattern: /🛡️\s*\[전열 엄호\]\s*(.+?)(?:이\(가\)|이|가)\s*후열\s*(.+?)의\s*피해를\s*(\d+)%\s*대신 받아\s*(\d+)의 피해를 감내했습니다!/i,
    en: m => `🛡️ [Frontline Cover] ${trEntity(m[1], 'en')} intercepted ${m[3]}% DMG for ${trEntity(m[2], 'en')}, enduring ${m[4]} damage!`,
    ja: m => `🛡️ [前列援護] ${trEntity(m[1], 'ja')}が後列の${trEntity(m[2], 'ja')}の被害を${m[3]}%肩代わりし、${m[4]}のダメージを耐え忍びました！`
  },

  // ── 🛡️ 피격 결과 인라인 조각: [영웅] 🛡️[Block!] (보호막 N 흡수) (방어력 차단) ──
  {
    pattern: /^\[(.+?)\]\s*🛡️\[Block!\](?:\s*\(보호막\s*(\d+)\s*흡수\))?(?:\s*\(방어력 차단\))?$/i,
    en: m => `[${trEntity(m[1], 'en')}] 🛡️[Block!]${m[2] ? ` (Absorbed ${m[2]} Barrier)` : m[0].includes('방어력 차단') ? ' (Blocked by DEF)' : ''}`,
    ja: m => `[${trEntity(m[1], 'ja')}] 🛡️[Block!]${m[2] ? ` (シールド${m[2]}吸収)` : m[0].includes('방어력 차단') ? ' (防御力遮断)' : ''}`
  },
  {
    pattern: /^\[(.+?)\]\s*(💥\[(?:치명타|크리티컬!)\]\s*)?-(\d+)(?:\s*\(보호막\s*(\d+)\s*흡수\))?$/i,
    en: m => `[${trEntity(m[1], 'en')}] ${m[2] ? '💥[CRITICAL!] ' : ''}-${m[3]}${m[4] ? ` (Absorbed ${m[4]} Barrier)` : ''}`,
    ja: m => `[${trEntity(m[1], 'ja')}] ${m[2] ? '💥[会心!] ' : ''}-${m[3]}${m[4] ? ` (シールド${m[4]}吸収)` : ''}`
  },
  {
    pattern: /^\[(.+?)\]\s*⚔️⚡\[(?:피격\s*)?환영\s*반격!\]\s*-(\d+)$/i,
    en: m => `[${trEntity(m[1], 'en')}] ⚔️⚡[Phantom Counter!] -${m[2]}`,
    ja: m => `[${trEntity(m[1], 'ja')}] ⚔️⚡[幻影反撃!] -${m[2]}`
  },
  {
    pattern: /^\[(.+?)\]\s*💨회피\(EVADE\)\s*➔\s*⚔️⚡\[환영\s*반격!\]\s*-(\d+)$/i,
    en: m => `[${trEntity(m[1], 'en')}] 💨EVADE ➔ ⚔️⚡[Phantom Counter!] -${m[2]}`,
    ja: m => `[${trEntity(m[1], 'ja')}] 💨回避(EVADE) ➔ ⚔️⚡[幻影反撃!] -${m[2]}`
  },

  // ── 🔥 상태이상 8종 실시간 로그 ──
  {
    pattern: /🔥\s*\[화상\]\s*(.+?)에게\s*(\d+)턴간\s*화상이 부여되었습니다!\s*\(매 턴\s*(\d+)%\s*피해,\s*방어력\s*(\d+)%\s*분쇄\)/i,
    en: m => `🔥 [Burn] Inflicted Burn on ${trEntity(m[1], 'en')} for ${m[2]} turns! (${m[3]}% DMG/turn, DEF shredded by ${m[4]}%)`,
    ja: m => `🔥 [火傷] ${trEntity(m[1], 'ja')}に${m[2]}ターンの火傷が付与されました！（毎ターン${m[3]}%ダメージ、防御力${m[4]}%粉砕）`
  },
  {
    pattern: /🩸\s*\[출혈\]\s*(.+?)에게\s*(\d+)턴간\s*출혈이 발생했습니다!\s*\(매 턴\s*(\d+)%\s*지속 피해,\s*공격력\s*-(\d+)%\)/i,
    en: m => `🩸 [Bleed] Inflicted Bleed on ${trEntity(m[1], 'en')} for ${m[2]} turns! (${m[3]}% DoT/turn, ATK -${m[4]}%)`,
    ja: m => `🩸 [出血] ${trEntity(m[1], 'ja')}に${m[2]}ターンの出血が発生しました！（毎ターン${m[3]}%持続ダメージ、攻撃力-${m[4]}%）`
  },
  {
    pattern: /❄️\s*\[냉각 동결\]\s*(.+?)에게\s*빙결\/냉각이 부여되었습니다!\s*\(1턴 행동불가,\s*지속 중 외피 동결 방어력\s*\+(\d+)%\)/i,
    en: m => `❄️ [Freeze/Chill] Inflicted Freeze on ${trEntity(m[1], 'en')}! (1 turn immobilized, DEF +${m[2]}% while frozen)`,
    ja: m => `❄️ [冷却凍結] ${trEntity(m[1], 'ja')}に凍結/冷却が付与されました！（1ターン行動不能、凍結中防御力+${m[2]}%）`
  },
  {
    pattern: /☠️\s*\[맹독\]\s*(.+?)에게\s*맹독이 중독되었습니다!\s*\(매 턴\s*(\d+)%\s*치명적 독 피해\)/i,
    en: m => `☠️ [Deadly Poison] Poisoned ${trEntity(m[1], 'en')} with deadly toxin! (${m[2]}% lethal poison DMG/turn)`,
    ja: m => `☠️ [猛毒] ${trEntity(m[1], 'ja')}が猛毒に冒されました！（毎ターン${m[2]}%の致命的毒ダメージ）`
  },
  {
    pattern: /🛡️⬇️\s*\[방어력 약화\]\s*(.+?)의 방어력이\s*(\d+)%\s*감소했습니다!/i,
    en: m => `🛡️⬇️ [DEF Weakened] ${trEntity(m[1], 'en')}'s DEF reduced by ${m[2]}%!`,
    ja: m => `🛡️⬇️ [防御力低下] ${trEntity(m[1], 'ja')}の防御力が${m[2]}%減少しました！`
  },
  {
    pattern: /⚔️⬇️\s*\[공격력 약화\]\s*(.+?)의 공격력이\s*(\d+)%\s*감소했습니다!/i,
    en: m => `⚔️⬇️ [ATK Weakened] ${trEntity(m[1], 'en')}'s ATK reduced by ${m[2]}%!`,
    ja: m => `⚔️⬇️ [攻撃力低下] ${trEntity(m[1], 'ja')}の攻撃力が${m[2]}%減少しました！`
  },
  {
    pattern: /👁️❌\s*\[실명\]\s*(.+?)의 시야가 가려져 명중률이\s*(\d+)%\s*급감했습니다!/i,
    en: m => `👁️❌ [Blind] ${trEntity(m[1], 'en')}'s vision was clouded; Accuracy plummeted by ${m[2]}%!`,
    ja: m => `👁️❌ [暗闇] ${trEntity(m[1], 'ja')}の視界が遮られ命中率が${m[2]}%激減しました！`
  },
  {
    pattern: /💫\s*\[기절\]\s*(.+?)이\(가\) 충격으로 기절했습니다!\s*\(1턴 행동 불가\)/i,
    en: m => `💫 [Stun] ${trEntity(m[1], 'en')} was stunned by the impact! (1 turn immobilized)`,
    ja: m => `💫 [気絶] ${trEntity(m[1], 'ja')}が衝撃で気絶しました！（1ターン行動不能）`
  },

  // ── ✨🛡️ 저항 및 면역 ──
  {
    pattern: /✨🛡️\s*\[면역 결계\]\s*(.+?)의 성스러운 정화 결계가\s*\[(.+?)\]\s*효과를 완전히 차단했습니다!/i,
    en: m => `✨🛡️ [Immunity Barrier] ${trEntity(m[1], 'en')}'s holy barrier completely blocked [${trEntity(m[2], 'en')}]!`,
    ja: m => `✨🛡️ [免疫結界] ${trEntity(m[1], 'ja')}の聖なる浄化結界が[${trEntity(m[2], 'ja')}]効果を完全に遮断しました！`
  },
  {
    pattern: /🛡️\s*\[저항\(RESIST\)\]\s*(.+?)이\(가\) 높은 행운\(🍀(\d+)\)으로\s*\[(.+?)\]\s*효과를 완전히 저항해냈습니다!/i,
    en: m => `🛡️ [RESIST] ${trEntity(m[1], 'en')} completely resisted [${trEntity(m[3], 'en')}] with high Luck (🍀${m[2]})!`,
    ja: m => `🛡️ [抵抗(RESIST)] ${trEntity(m[1], 'ja')}が高い幸運（🍀${m[2]}）で[${trEntity(m[3], 'ja')}]効果を完全に抵抗しました！`
  },

  // ── 🕊️✨ 부활 및 소생 ──
  {
    pattern: /🕊️✨\s*(.+?)\s*\[(.+?)\]\s*강림!\s*기적의 기도로 사경을 헤매던\s*(.+?)을\(를\)\s*체력 1로 극적 소생시켰습니다!\s*➔\s*\[(.+?)\]/i,
    en: m => `🕊️✨ ${trEntity(m[1], 'en')} [${trEntity(m[2], 'en')}] Descends! Miraculously revived critical ally ${trEntity(m[3], 'en')} to 1 HP! ➔ [${m[4]}]`,
    ja: m => `🕊️✨ ${trEntity(m[1], 'ja')} [${trEntity(m[2], 'ja')}] 降臨！奇跡の祈りで死線を彷徨っていた${trEntity(m[3], 'ja')}をHP 1で劇的に蘇生！ ➔ [${m[4]}]`
  },
  {
    pattern: /🕊️✨\s*(.+?)\s*\[(.+?)\]\s*강림!\s*기적의 권능으로 사망한 동료를 부활시키고 파티를 완전 치유했습니다!\s*➔\s*\[(.+?)\]/i,
    en: m => `🕊️✨ ${trEntity(m[1], 'en')} [${trEntity(m[2], 'en')}] Descends! Revived fallen allies and fully healed party with miracle power! ➔ [${m[4]}]`,
    ja: m => `🕊️✨ ${trEntity(m[1], 'ja')} [${trEntity(m[2], 'ja')}] 降臨！奇跡の権能で倒れた仲間を復活させ、パーティを完全治癒！ ➔ [${m[4]}]`
  },
  // ⚔️ 피해 로그: [전투] A이(가) B에게 X의 물리/마법 피해를 입혔습니다!
  {
    pattern: /\[전투\]\s*(.+?)(?:이|가)\s*(.+?)(?:에게|을|를)\s*(\d+)(?:의)?\s*(물리|마법|화염|암흑|신성|관통)?\s*피해를 입혔습니다/i,
    en: m => `[Combat] ${m[1]} dealt ${m[3]} ${m[4] ? m[4] + ' ' : ''}damage to ${m[2]}!`,
    ja: m => `[戦闘] ${m[1]}が${m[2]}に${m[3]}の${m[4] || ''}ダメージを与えました！`
  },
  // ⚡ 치명타 로그
  {
    pattern: /\[치명타(?:!| 일격)?\]\s*(.+?)(?:이|가)?\s*(\d+)(?:의)?\s*치명타 피해/i,
    en: m => `[CRITICAL HIT!] ${m[1]} dealt ${m[2]} critical damage!`,
    ja: m => `[会心の一撃!] ${m[1]}が${m[2]}のクリティカルダメージ！`
  },
  // 💖 회복 로그: [회복] A의 HP가 X 회복되었습니다.
  {
    pattern: /\[회복\]\s*(.+?)의\s*(?:HP|체력)가?\s*(\+?\d+)\s*회복/i,
    en: m => `[Recovery] ${m[1]} restored +${m[2]} HP.`,
    ja: m => `[回復] ${m[1]}のHPが+${m[2]}回復しました。`
  },
  // 🛡️ 보호막 전개 로그
  {
    pattern: /\[보호막\]\s*(.+?)(?:이|가)\s*(\d+)의?\s*보호막을? 전개/i,
    en: m => `[Shield] ${m[1]} deployed a ${m[2]} HP barrier!`,
    ja: m => `[シールド] ${m[1]}が${m[2]}の障壁を展開！`
  },
  // 🔥 화상 지속 피해
  {
    pattern: /\[화상\]\s*(.+?)(?:이|가)?\s*(\d+)의?\s*화염 피해/i,
    en: m => `[Burn] ${m[1]} took ${m[2]} burn damage.`,
    ja: m => `[火傷] ${m[1]}が${m[2]}の火炎継続ダメージを受けました。`
  },
  // 🩸 출혈 지속 피해
  {
    pattern: /\[출혈\]\s*(.+?)(?:이|가)?\s*(\d+)의?\s*출혈 피해/i,
    en: m => `[Bleed] ${m[1]} took ${m[2]} bleed damage.`,
    ja: m => `[出血] ${m[1]}が${m[2]}の出血ダメージを受けました。`
  },
  // ☣️ 중독 지속 피해
  {
    pattern: /\[중독\]\s*(.+?)(?:이|가)?\s*(\d+)의?\s*독소 피해/i,
    en: m => `[Poison] ${m[1]} took ${m[2]} poison damage.`,
    ja: m => `[中毒] ${m[1]}が${m[2]}の毒ダメージを受けました。`
  },
  // 💫 기절 로그
  {
    pattern: /\[기절\]\s*(.+?)(?:이|가)\s*(?:정신을 잃고|기절하여)\s*행동할 수 없습니다/i,
    en: m => `[Stun] ${m[1]} is stunned and unable to act!`,
    ja: m => `[気絶] ${m[1]}は気絶して行動できません！`
  },
  // ❄️ 빙결 로그
  {
    pattern: /\[빙결\]\s*(.+?)(?:이|가)\s*얼어붙었습니다/i,
    en: m => `[Freeze] ${m[1]} is frozen in place!`,
    ja: m => `[凍結] ${m[1]}は凍りつきました！`
  },
  // 🏆 레벨업 로그: [레벨업] A의 레벨이 X로 상승했습니다!
  {
    pattern: /\[레벨업\]\s*(.+?)의\s*레벨이\s*(\d+)(?:로)?\s*상승했습니다/i,
    en: m => `[Level Up!] ${m[1]} reached Level ${m[2]}!`,
    ja: m => `[レベルアップ!] ${m[1]}のレベルが${m[2]}に上昇しました！`
  },
  // 💰 골드 획득 로그: 골드 X를 획득했습니다.
  {
    pattern: /골드\s*(\d+)(?:G|개)?를?\s*획득/i,
    en: m => `Acquired ${m[1]} Gold.`,
    ja: m => `${m[1]}ゴールドを獲得しました。`
  },
  // 📦 전리품 획득 로그: [전리품] A X개를 획득했습니다.
  {
    pattern: /\[전리품\]\s*(.+?)\s*(\d+)개를?\s*획득/i,
    en: m => `[Loot] Acquired ${m[1]} x${m[2]}.`,
    ja: m => `[戦利品] ${m[1]}を${m[2]}個獲得しました。`
  },
  // 👑 보스 출현 로그
  {
    pattern: /\[보스 출현\]\s*(.+?)(?:이|가)\s*전장에 모습을 드러냈습니다/i,
    en: m => `[Boss Encounter] ${m[1]} emerges onto the battlefield!`,
    ja: m => `[ボス出現] ${m[1]}が戦場に姿を現しました！`
  },
  // 👑 보스 토벌 로그
  {
    pattern: /\[보스 토벌\]\s*(.+?)(?:을|를)\s*완전히 격퇴했습니다/i,
    en: m => `[Boss Defeated] Completely vanquished ${m[1]}!`,
    ja: m => `[ボストヴァル] ${m[1]}を完全に撃破しました！`
  },
  // 🌀 층 이동 로그
  {
    pattern: /\[이동\]\s*(.+?)\((\d+)층\)(?:에)?\s*도착했습니다/i,
    en: m => `[Arrival] Arrived at ${m[1]} (Floor ${m[2]}).`,
    ja: m => `[移動] ${m[1]}（${m[2]}層）に到着しました。`
  },
  // 🏕️ 야영 휴식 로그
  {
    pattern: /\[야영(?: 휴식)?\]\s*파티 (?:전원의|모든) (?:체력과 마나가|HP\/MP가)\s*(\d+)%\s*회복/i,
    en: m => `[Camp Rest] Party HP & MP restored by ${m[1]}%.`,
    ja: m => `[野営休息] パーティ全員のHP・MPが${m[1]}%回復しました。`
  },
  // 🏰 성채 복귀 로그
  {
    pattern: /\[성채 귀환\]\s*(?:원정대가|탐험대가)\s*(?:성채로|방주로)\s*(?:안전하게|무사히)\s*귀환/i,
    en: () => `[Citadel Return] Expedition safely returned to the Ark Citadel.`,
    ja: () => `[城塞帰還] 遠征隊が無事に方舟城塞へ帰還しました。`
  },
  // 🪵 성화 장작 투입 로그
  {
    pattern: /\[성화\]\s*목재\s*(\d+)개를?\s*투입하여\s*(?:온기|불씨)/i,
    en: m => `[Bonfire] Contributed ${m[1]} wood to stoke the sacred flame.`,
    ja: m => `[聖火] 木材${m[1]}個を投入して聖火を維持しました。`
  },
  // 🔨 장비 강화 성공 로그
  {
    pattern: /\[장비 강화 성공\]\s*(.+?)(?:이|가)?\s*\+(\d+)강으로\s*강화/i,
    en: m => `[Enhance Success!] ${m[1]} enhanced to +${m[2]}!`,
    ja: m => `[強化成功!] ${m[1]}が+${m[2]}に強化されました！`
  },
  // 💥 장비 강화 실패 로그
  {
    pattern: /\[강화 실패\]\s*(.+?)(?:의)?\s*강화도가 하락/i,
    en: m => `[Enhance Failed] ${m[1]} enhancement rank decreased.`,
    ja: m => `[強化失敗] ${m[1]}の強化段階が低下しました。`
  },
  // ── 🎯⚡ 전투 연계기 / 엄호 / 원호 / 추가타 로그 패턴 ──
  // 🎯 약점 추격 원호: ▶ 🎯⚡ [약점 추격 원호!] A (직업): "대사" [스킬명] → B에게 X 치명 피해! (보너스)
  {
    pattern: /▶\s*🎯⚡\s*\[약점 추격 원호!\]\s*(.+?)\s*\((.+?)\):\s*"(.*?)"\s*\[(.+?)\]\s*→\s*(.+?)에게\s*(\d+)\s*치명 피해!\s*\((.+?)\)(.*)/i,
    en: m => `▶ 🎯⚡ [Weakness Pursuit Assist!] ${trEntity(m[1], 'en')} (${trEntity(m[2], 'en')}): "${trEntity(m[3], 'en')}" [${trEntity(m[4], 'en')}] → ${m[6]} CRIT DMG to ${trEntity(m[5], 'en')}! (${trEntity(m[7], 'en')})${m[8]}`,
    ja: m => `▶ 🎯⚡ [弱点追撃援護!] ${trEntity(m[1], 'ja')} (${trEntity(m[2], 'ja')}): 「${trEntity(m[3], 'ja')}」 [${trEntity(m[4], 'ja')}] → ${trEntity(m[5], 'ja')}に${m[6]}の会心ダメージ！ (${trEntity(m[7], 'ja')})${m[8]}`
  },
  // 💨 시전 요격 추가타: ▶ 💨🎯 [시전 요격 추가타!] A: "대사" B에게 X 요격 피해 및 브레이크 요구치 -Y 선제 파쇄!
  {
    pattern: /▶\s*💨🎯\s*\[시전 요격 추가타!\]\s*(.+?):\s*"(.*?)"\s*(.+?)에게\s*(\d+)\s*요격 피해 및 브레이크 요구치\s*-(\d+)\s*선제 파쇄!/i,
    en: m => `▶ 💨🎯 [Cast Intercept Strike!] ${trEntity(m[1], 'en')}: "${m[2].replace('차징을 끊어라! 선제 사격!', 'Break the charge! Fire!')}" Dealt ${m[4]} Intercept DMG to ${trEntity(m[3], 'en')} & Break Gauge -${m[5]}!`,
    ja: m => `▶ 💨🎯 [詠唱迎撃追撃!] ${trEntity(m[1], 'ja')}: 「${m[2].replace('차징을 끊어라! 선제 사격!', 'チャージを止めろ！先制射撃！')}」 ${trEntity(m[3], 'ja')}に${m[4]}の迎撃ダメージ＆ブレイク要求値 -${m[5]} 先制破砕！`
  },
  // 🤝 원호/추가 공격: ▶ 🤝 또는 ▶ ⚡ [원호/추가 공격] [A]의 원호! 💥[크리티컬!] → B에게 X 피해!
  {
    pattern: /▶\s*[🤝⚡]\s*\[원호\/추가 공격\]\s*(.+?)(\s*💥\[크리티컬!\])?\s*→\s*(.+?)에게\s*(\d+)\s*피해!(.*)/i,
    en: m => `▶ 🤝 [Assist / Follow-up Strike] ${trEntity(m[1], 'en')}${m[2] ? ' 💥[CRITICAL!]' : ''} → ${m[4]} DMG to ${trEntity(m[3], 'en')}!${m[5]}`,
    ja: m => `▶ 🤝 [援護/追加攻撃] ${trEntity(m[1], 'ja')}${m[2] ? ' 💥[会心!]' : ''} → ${trEntity(m[3], 'ja')}に${m[4]}ダメージ！${m[5]}`
  },
  // 🛡️ 원호 보호막: 🛡️ [원호 보호막] A의 엄호로 파티 전원 보호막 +X 부여!
  {
    pattern: /🛡️\s*\[원호 보호막\]\s*(.+?)의\s*엄호로\s*파티 전원 보호막\s*\+(\d+)\s*부여!/i,
    en: m => `🛡️ [Assist Barrier] ${trEntity(m[1], 'en')}'s cover granted +${m[2]} Barrier to all allies!`,
    ja: m => `🛡️ [援護バリア] ${trEntity(m[1], 'ja')}の援護によりパーティ全員にシールド +${m[2]} 付与！`
  },
  // 🩸 원호 출혈: 🩸 [원호 출혈] A에게 2턴간 출혈 효과를 부여했습니다!
  {
    pattern: /🩸\s*\[원호 출혈\]\s*(.+?)에게\s*(\d+)턴간\s*출혈 효과를 부여했습니다!/i,
    en: m => `🩸 [Assist Bleed] Inflicted Bleed on ${trEntity(m[1], 'en')} for ${m[2]} turns!`,
    ja: m => `🩸 [援護出血] ${trEntity(m[1], 'ja')}に${m[2]}ターンの出血効果を付与しました！`
  },
  // 🔮✨ 원호 마력 순환 / 마나 공급: 🔮 [원호 마력 순환] A의 마력 공명으로 파티 전원 +8 MP 회복!
  {
    pattern: /[🔮✨]\s*\[(?:원호 마력 순환|원호 마나 공급)\]\s*(.+?)의\s*(?:마력 공명|지원)으로\s*파티 전원(?:\s*마나)?\s*\+(\d+)\s*MP 회복!/i,
    en: m => `🔮 [Assist Mana Resonance] ${trEntity(m[1], 'en')}'s resonance restored +${m[2]} MP to all allies!`,
    ja: m => `🔮 [援護魔力循環] ${trEntity(m[1], 'ja')}の魔力共鳴によりパーティ全員のMP +${m[2]} 回復！`
  },
  // 🕊️💖 원호 응급치유: 🕊️ [원호 응급치유] A의 치유 기도로 B 체력 +X 회복!
  {
    pattern: /[🕊️💖]\s*\[원호 응급치유\]\s*(.+?)의\s*치유 기도로\s*(.+?)\s*체력\s*\+(\d+)\s*회복!/i,
    en: m => `🕊️ [Assist Emergency Heal] ${trEntity(m[1], 'en')}'s prayer restored +${m[3]} HP to ${trEntity(m[2], 'en')}!`,
    ja: m => `🕊️ [援護応急治療] ${trEntity(m[1], 'ja')}の祈りにより${trEntity(m[2], 'ja')}の体力が +${m[3]} 回復！`
  },
  // 🪓⚔️⬇️ 원호 공격력 약화: 🪓 [원호 공격력 약화] A의 공격력이 2턴간 25% 감소했습니다!
  {
    pattern: /(?:🪓|⚔️⬇️)\s*\[원호 공격력 약화\]\s*(.+?)의\s*공격력이\s*(\d+)턴간\s*(\d+)%\s*감소했습니다!/i,
    en: m => `🪓 [Assist ATK Weaken] ${trEntity(m[1], 'en')}'s ATK reduced by ${m[3]}% for ${m[2]} turns!`,
    ja: m => `🪓 [援護攻撃力低下] ${trEntity(m[1], 'ja')}の攻撃力が${m[2]}ターンの間${m[3]}%減少しました！`
  },
  // 🎯🛡️⬇️ 원호 방어력 분쇄: 🎯 [원호 방어력 분쇄] A의 방어력이 2턴간 30% 분쇄되었습니다!
  {
    pattern: /(?:🎯|🛡️⬇️)\s*\[원호 방어력 분쇄\]\s*(.+?)의\s*방어력이\s*(\d+)턴간\s*(\d+)%\s*(?:분쇄|감소)되었습니다!/i,
    en: m => `🎯 [Assist DEF Shred] ${trEntity(m[1], 'en')}'s DEF shredded by ${m[3]}% for ${m[2]} turns!`,
    ja: m => `🎯 [援護防御力粉砕] ${trEntity(m[1], 'ja')}の防御力が${m[2]}ターンの間${m[3]}%粉砕されました！`
  },
  // 🛡️ 전열 돌격 방벽: 🛡️ [전열 돌격 방벽] A이(가) 전열 연계로 X 보호막을 획득했습니다!
  {
    pattern: /🛡️\s*\[전열 돌격 방벽\]\s*(.+?)(?:이\(가\)|이|가)\s*전열 연계로\s*(\d+)\s*보호막을 획득했습니다!/i,
    en: m => `🛡️ [Frontline Assault Barrier] ${m[1]} gained a ${m[2]} HP barrier from Frontline Combo!`,
    ja: m => `🛡️ [前列突撃障壁] ${m[1]}が前列連携により${m[2]}のシールドを獲得しました！`
  },
  // ✨ 후열 전술 사격: ✨ [후열 전술 사격] A이(가) 후열 연계로 마나 +X MP를 환급받았습니다!
  {
    pattern: /✨\s*\[후열 전술 사격\]\s*(.+?)(?:이\(가\)|이|가)\s*후열 연계로 마나\s*\+(\d+)\s*MP를 환급받았습니다!/i,
    en: m => `✨ [Backline Tactical Fire] ${m[1]} refunded +${m[2]} MP from Backline Combo!`,
    ja: m => `✨ [後列戦術射撃] ${m[1]}が後列連携によりマナ +${m[2]} MP を還元されました！`
  },
  // 🛡️ 전열 수호 엄호: 🛡️ [전열 수호] A이(가) 후열 B 엄호 (-X% 경감)
  {
    pattern: /🛡️\s*\[전열 수호\]\s*(.+?)(?:이\(가\)|이|가)\s*후열\s*(.+?)\s*엄호\s*\(-?(\d+)%\s*경감\)/i,
    en: m => `🛡️ [Frontline Guard] ${m[1]} covered backline ${m[2]} (-${m[3]}% DMG reduction)`,
    ja: m => `🛡️ [前列守護] ${m[1]}が後列の${m[2]}を援護（-${m[3]}% 軽減）`
  },
  // 🛡️ 전열 방호선: 🛡️ [전열 방호선] 적 전열의 엄호로 인해 A(후열) 타격 피해가 X% 감소합니다.
  {
    pattern: /🛡️\s*\[전열 방호선\]\s*적 전열의 엄호로 인해\s*(.+?)\(후열\)\s*타격 피해가\s*(\d+)%\s*감소합니다\./i,
    en: m => `🛡️ [Frontline Defense] Enemy frontline cover reduced damage to ${m[1]} (Backline) by ${m[2]}%.`,
    ja: m => `🛡️ [前列防護線] 敵前列の援護により、${m[1]}（後列）へのダメージが${m[2]}%減少します。`
  },
  // 👑💥 총공격 추격타: 👑💥 [총공격 추격타!] 방어가 무너진 A에게 전 파티원이 일제히 쇄도하여 X의 궤멸적 그로기 추격타를 꽂아넣었습니다!
  {
    pattern: /👑💥\s*\[총공격 추격타!\]\s*방어가 무너진\s*(.+?)에게 전 파티원이 일제히 쇄도하여\s*(\d+)의 궤멸적 그로기 추격타를 꽂아넣었습니다!/i,
    en: m => `👑💥 [All-Out Pursuit Strike!] The whole party swarmed vulnerable ${m[1]}, dealing a crushing ${m[2]} Groggy Strike!`,
    ja: m => `👑💥 [総攻撃追撃打!] 防御が崩れた${m[1]}にパーティ全員が一斉に突撃し、${m[2]}の壊滅的グロッキー追撃を叩き込みました！`
  },
  // 🌟 신성 원호: 🌟 [신성 원호] 아군 전체 HP +X (시전자 공격력의 Y%) 치유 및 MP +Z 환원!
  {
    pattern: /🌟\s*\[신성 원호\]\s*아군 전체 HP\s*\+(\d+)\s*\(시전자 공격력의\s*(\d+)%\)\s*치유 및 MP\s*\+(\d+)\s*환원!/i,
    en: m => `🌟 [Divine Assist] All allies healed +${m[1]} HP (${m[2]}% ATK) & refunded +${m[3]} MP!`,
    ja: m => `🌟 [神聖援護] 味方全体のHP +${m[1]}（発動者攻撃力の${m[2]}%）回復＆MP +${m[3]} 還元！`
  },
  // 💥⚡ 연계 콤보 폭발: 💥⚡ [연계 콤보 폭발!] 아이콘 [콤보명] 발동! 설명
  {
    pattern: /💥⚡\s*\[연계 콤보 폭발!\]\s*(.+?)\s*\[(.+?)\]\s*발동!\s*(.*)/i,
    en: m => `💥⚡ [Combo Burst!] ${m[1]} [${m[2]}] triggered! ${m[3]}`,
    ja: m => `💥⚡ [連携コンボ炸裂!] ${m[1]} [${m[2]}] 発動！ ${m[3]}`
  },
  // ⚠️💥 적의 상태이상 연계: ⚠️💥 [적의 상태이상 연계!] A의 아이콘 [콤보명] 발동! 설명
  {
    pattern: /⚠️💥\s*\[적의 상태이상 연계!\]\s*(.+?)의\s*(\S+)\s*\[([^\]]+)\]\s*발동!\s*(.*)/i,
    en: m => `⚠️💥 [Enemy Status Detonation!] ${trEntity(m[1], 'en')}'s ${m[2]} [${trEntity(m[3], 'en')}] triggered! ${m[4]}`,
    ja: m => `⚠️💥 [敵の状態異常連携!] ${trEntity(m[1], 'ja')}の${m[2]} [${trEntity(m[3], 'ja')}] 発動！ ${m[4]}`
  },
  // ⚠️💥 적 연계 폭발 hitReport: ⚠️💥[적 연계 폭발! 아이콘 콤보명] -X
  {
    pattern: /⚠️💥\[적 연계 폭발!\s*(.+?)\s*(.+?)\]\s*(-?\d+)/i,
    en: m => `⚠️💥 [Enemy Combo Burst! ${m[1]} ${trEntity(m[2], 'en')}] ${m[3]} DMG`,
    ja: m => `⚠️💥 [敵連携爆発! ${m[1]} ${trEntity(m[2], 'ja')}] ${m[3]}`
  },
  // 🏃 탈출 성공 로그: 🏃 [전투 철수 성공!] 적의 추격을 뿌리치고 안전하게 후퇴했습니다. ...
  {
    pattern: /🏃\s*\[전투 철수 성공!\]\s*적의 추격을 뿌리치고 안전하게 후퇴했습니다\.(.*)/i,
    en: m => `🏃 [Retreat Success!] Safely shook off enemy pursuit and retreated.${m[1].replace('탈출 확률', 'Escape rate').replace('행운 보정', 'Luck bonus')}`,
    ja: m => `🏃 [戦闘撤退成功!] 敵の追撃を振り切り無事に撤退しました。${m[1].replace('탈출 확률', '脱出確率').replace('행운 보정', '幸運補正')}`
  },
  // ⚠️ [행동 불가] A이(가) [사유] 상태로 인해 아무 행동도 하지 못하고 턴을 넘깁니다.
  {
    pattern: /⚠️\s*\[행동 불가\]\s*(.+?)(?:이\(가\)|이|가)\s*\[(.+?)\]\s*상태로 인해 아무 행동도 하지 못하고 턴을 넘깁니다\./i,
    en: m => `⚠️ [Immobilized] ${m[1]} is unable to act due to [${m[2]}] and passes the turn.`,
    ja: m => `⚠️ [行動不能] ${m[1]}は[${m[2]}]状態のため行動できずターンをパスします。`
  },
  // ❄️ 동상 지속 피해: A ❄️[동상] 최대 HP 4% 결빙 동상 지속 피해 (-X) [방어력 +40%]
  {
    pattern: /(.+?)\s*❄️\[동상\]\s*최대 HP 4% 결빙 동상 (?:지속 )?피해\s*\(-(\d+)\)\s*\[방어력 \+40%\]/i,
    en: m => `${m[1]} ❄️[Frostbite] 4% Max HP Freeze DoT (-${m[2]}) [DEF +40%]`,
    ja: m => `${m[1]} ❄️[凍傷] 最大HP 4% 凍結継続ダメージ (-${m[2]}) [防御力 +40%]`
  },
  // 🩸 출혈 지속 피해: A 🩸[출혈] 최대 HP 7% 지속 피해 (-X) [공격력 -40%]
  {
    pattern: /(.+?)\s*🩸\[출혈\]\s*최대 HP 7% 지속 피해\s*\(-(\d+)\)\s*\[공격력 -40%\]/i,
    en: m => `${m[1]} 🩸[Bleed] 7% Max HP Bleed DoT (-${m[2]}) [ATK -40%]`,
    ja: m => `${m[1]} 🩸[出血] 最大HP 7% 出血継続ダメージ (-${m[2]}) [攻撃力 -40%]`
  },
  // ☠️ 맹독 지속 피해: A ☠️[맹독] 최대 HP 14% 치명적 중독 피해 (-X) [최대 DoT]
  {
    pattern: /(.+?)\s*☠️\[맹독\]\s*최대 HP 14% 치명적 중독 피해\s*\(-(\d+)\)\s*\[최대 DoT\]/i,
    en: m => `${m[1]} ☠️[Poison] 14% Max HP Lethal Poison DoT (-${m[2]}) [Max DoT]`,
    ja: m => `${m[1]} ☠️[猛毒] 最大HP 14% 致命的中毒ダメージ (-${m[2]}) [最大DoT]`
  },
  // 🔥 화상 지속 피해: A 🔥[화상] 최대 HP 8% 화염 피해 (-X) [방어력 -50%]
  {
    pattern: /(.+?)\s*🔥\[화상\]\s*최대 HP 8% 화염 피해\s*\(-(\d+)\)\s*\[방어력 -50%\]/i,
    en: m => `${m[1]} 🔥[Burn] 8% Max HP Burn DMG (-${m[2]}) [DEF -50%]`,
    ja: m => `${m[1]} 🔥[火傷] 最大HP 8% 火炎ダメージ (-${m[2]}) [防御力 -50%]`
  },
  // 💚 재생 지속 회복: A 💚[재생] 체력 회복 (+X)
  {
    pattern: /(.+?)\s*💚\[재생\]\s*체력 회복\s*\(\+(\d+)\)/i,
    en: m => `${m[1]} 💚[Regen] Restored HP (+${m[2]})`,
    ja: m => `${m[1]} 💚[再生] 体力回復 (+${m[2]})`
  },
  // 💀 DoT 사망: 💀 [사망] A이(가) 지속 피해로 쓰러졌습니다!
  {
    pattern: /💀\s*\[사망\]\s*(.+?)(?:이\(가\)|이|가)\s*지속 피해로 쓰러졌습니다!/i,
    en: m => `💀 [Death] ${m[1]} succumbed to damage over time!`,
    ja: m => `💀 [死亡] ${m[1]}が継続ダメージにより力尽きました！`
  },
  // ❄️ 결빙/기절 행동 불가 알림: A은(는) 결빙/기절 상태이므로 행동할 수 없습니다!
  {
    pattern: /(.+?)(?:은\(는\)|은|는)\s*결빙\/기절 상태이므로 행동할 수 없습니다!/i,
    en: m => `${m[1]} is frozen/stunned and cannot act!`,
    ja: m => `${m[1]}は凍結/気絶状態のため行動できません！`
  },
  // 💧 마나 부족 기본 공격 대체: 💧 [마나 부족] A의 마나가 부족하여 [B] 대신 기본 공격을 시전합니다.
  {
    pattern: /💧\s*\[마나 부족\]\s*(.+?)의\s*마나가 부족하여\s*\[(.+?)\]\s*대신 기본 공격을 시전합니다\./i,
    en: m => `💧 [Low Mana] ${m[1]} lacks MP, executing Basic Attack instead of [${m[2]}].`,
    ja: m => `💧 [マナ不足] ${m[1]}のマナが不足しているため、[${m[2]}]の代わりに基本攻撃を行います。`
  },
  // MP 부족 경고: MP가 부족합니다! (필요 MP: X, 보유 MP: Y)
  {
    pattern: /MP가 부족합니다!\s*\(필요 MP:\s*(\d+),\s*보유 MP:\s*(\d+)\)/i,
    en: m => `Insufficient MP! (Required: ${m[1]}, Current: ${m[2]})`,
    ja: m => `MPが不足しています！（必要MP: ${m[1]}, 所持MP: ${m[2]}）`
  },
  // 쿨다운 중 경고: [쿨다운 중] A은(는) 아직 재사용할 수 없습니다! (남은 쿨다운: X턴)
  {
    pattern: /\[쿨다운 중\]\s*(.+?)(?:은\(는\)|은|는)\s*아직 재사용할 수 없습니다!\s*\(남은 쿨다운:\s*(\d+)턴\)/i,
    en: m => `[Cooldown] ${m[1]} is on cooldown! (${m[2]} turns remaining)`,
    ja: m => `[クールダウン中] ${m[1]}はまだ再使用できません！（残りクールダウン: ${m[2]}ターン）`
  },
  // 📚✨ 지식의 힘: 📚✨ [지식의 힘] A의 비전 지식으로 마나 소모 없이 [B]을(를) 시전합니다! (소모 MP 0)
  {
    pattern: /📚✨\s*\[지식의 힘\]\s*(.+?)의\s*비전 지식으로 마나 소모 없이\s*\[(.+?)\](?:을\(를\)|을|를)\s*시전합니다!\s*\(소모 MP 0\)/i,
    en: m => `📚✨ [Arcane Mastery] ${m[1]}'s arcane insight casts [${m[2]}] without consuming MP! (0 MP)`,
    ja: m => `📚✨ [知識の力] ${m[1]}の秘術知識によりマナ消費なしで[${m[2]}]を詠唱します！（消費MP 0）`
  },
  // 🔥⚡ FEVER 궁극기 폭발
  {
    pattern: /🔥⚡\s*\[FEVER 궁극기 폭발\]\s*(.+?)의\s*궁극기에\s*【(.+?)】\s*시너지 방출!\s*-(.*)/i,
    en: m => `🔥⚡ [FEVER Ultimate Burst] ${m[1]}'s Ultimate unleashed [${m[2]}] synergy! -${m[3]}`,
    ja: m => `🔥⚡ [FEVER究極技炸裂] ${m[1]}の究極技に【${m[2]}】シナジー解放！ -${m[3]}`
  },
  // 💨 실명 빗나감: 💨 [빗나감 / MISS] 실명 상태인 A의 시야가 가려져 [B] 공격이 빗나갔습니다!
  {
    pattern: /💨\s*\[빗나감\s*\/\s*MISS\]\s*실명 상태인\s*(.+?)의\s*시야가 가려져\s*\[(.+?)\]\s*공격이 빗나갔습니다!/i,
    en: m => `💨 [MISS] Blinded ${m[1]}'s vision was obscured and [${m[2]}] missed!`,
    ja: m => `💨 [ミス / MISS] 暗闇状態の${m[1]}の視界が遮られ[${m[2]}]攻撃が外れました！`
  },
  // ⚠️ 계열 부조화: ⚠️ [계열 부조화] A의 클래스와 맞지 않는 [B] 스킬로 인해 위력이 50% 반감됩니다!
  {
    pattern: /⚠️\s*\[계열 부조화\]\s*(.+?)의\s*클래스와 맞지 않는\s*\[(.+?)\]\s*스킬로 인해 위력이 50% 반감됩니다!/i,
    en: m => `⚠️ [Affinity Mismatch] [${m[2]}] does not match ${m[1]}'s class; power reduced by 50%!`,
    ja: m => `⚠️ [系統不調和] ${m[1]}のクラスと一致しない[${m[2]}]スキルのため威力が50%半減します！`
  },
  // 👥⚡ 은신 기습 일격: 👥⚡ [은신 기습 일격] A이(가) 그림자 은신 상태에서 기습 공격을 감행하여 위력이 X% 폭증했습니다!
  {
    pattern: /👥⚡\s*\[은신 기습 일격\]\s*(.+?)(?:이\(가\)|이|가)\s*그림자 은신 상태에서 기습 공격을 감행하여 위력이\s*(\d+)%\s*폭증했습니다!/i,
    en: m => `👥⚡ [Stealth Ambush] ${m[1]} struck from the shadows, boosting power by ${m[2]}%!`,
    ja: m => `👥⚡ [潜伏奇襲一撃] ${m[1]}が影の潜伏状態から奇襲を仕掛け、威力が${m[2]}%跳ね上がりました！`
  },
  // 💨 회피 / EVADE (행운 기반): 💨 [회피 / EVADE] A이(가) 높은 행운(🍀X)으로 B의 [C] 공격을 회피했습니다!
  {
    pattern: /💨\s*\[회피\s*\/\s*EVADE\]\s*(.+?)(?:이\(가\)|이|가)\s*높은 행운\(🍀(\d+)\)으로\s*(.+?)의\s*\[(.+?)\]\s*공격을 회피했습니다!/i,
    en: m => `💨 [EVADE] ${m[1]} evaded ${m[3]}'s [${m[4]}] with high luck (🍀${m[2]})!`,
    ja: m => `💨 [回避 / EVADE] ${m[1]}が高い幸運(🍀${m[2]})で${m[3]}の[${m[4]}]攻撃を回避しました！`
  },
  // 💨 회피 / EVADE (일반/추가타): 💨 [회피 / EVADE] A이(가) B의 C 공격/추가 타격을 회피했습니다!
  {
    pattern: /💨\s*\[회피\s*\/\s*EVADE\]\s*(.+?)(?:이\(가\)|\s+이|\s+가|이|가)\s+(.+?)의\s*(.+?)\s*(?:추가 타격을|공격을)\s*회피했습니다!/i,
    en: m => `💨 [EVADE] ${m[1]} evaded ${m[2]}'s ${m[3]} strike!`,
    ja: m => `💨 [回避 / EVADE] ${m[1]}が${m[2]}の${m[3]}攻撃を回避しました！`
  },
  // ⚡ 암습: ⚡ [암습] A의 속도 우위(+ X)로 B에게 피해량이 Y% 증폭되었습니다!
  {
    pattern: /⚡\s*\[암습\]\s*(.+?)의\s*속도 우위\(\+\s*(\d+)\)로\s*(.+?)에게 피해량이\s*(\d+)%\s*증폭되었습니다!/i,
    en: m => `⚡ [Shadow Ambush] ${m[1]}'s speed advantage (+${m[2]}) amplified damage to ${m[3]} by ${m[4]}%!`,
    ja: m => `⚡ [暗襲] ${m[1]}の速度優位(+${m[2]})により${m[3]}へのダメージが${m[4]}%増幅されました！`
  },
  // ✨ 신성 정화: ✨ [신성 정화] 신성 마법이 A(언데드/타락)에게 팩션 상성 추가 피해 +X (+20%)를 입힙니다!
  {
    pattern: /✨\s*\[신성 정화\]\s*신성 마법이\s*(.+?)\((.+?)\)에게 팩션 상성 추가 피해\s*\+([0-9,]+)\s*\(\+20%\)를 입힙니다!/i,
    en: m => `✨ [Holy Purge] Holy magic dealt +${m[3]} (+20%) faction advantage DMG to ${m[1]} (${m[2]})!`,
    ja: m => `✨ [神聖浄化] 神聖魔法が${m[1]}（${m[2]}）に陣営相性追加ダメージ +${m[3]} (+20%) を与えました！`
  },
  // 🔮 암흑 잠식: 🔮 [암흑 잠식] 암흑 마법이 A(마물)에게 팩션 상성 추가 피해 +X (+20%)를 입힙니다!
  {
    pattern: /🔮\s*\[암흑 잠식\]\s*암흑 마법이\s*(.+?)\((.+?)\)에게 팩션 상성 추가 피해\s*\+([0-9,]+)\s*\(\+20%\)를 입힙니다!/i,
    en: m => `🔮 [Dark Encroachment] Dark magic dealt +${m[3]} (+20%) faction advantage DMG to ${m[1]} (${m[2].replace('마물', 'Monster')})!`,
    ja: m => `🔮 [暗黒浸食] 暗黒魔法が${m[1]}（${m[2].replace('마물', '魔物')}）に陣営相性追加ダメージ +${m[3]} (+20%) を与えました！`
  },
  // 💥 전열 분쇄: 💥 [전열 분쇄] A(전열)에게 25% 증폭 피해!
  {
    pattern: /💥\s*\[전열 분쇄\]\s*(.+?)\(전열\)에게\s*(\d+)%\s*증폭 피해!/i,
    en: m => `💥 [Frontline Crush] Dealt ${m[2]}% amplified damage to ${m[1]} (Front)!`,
    ja: m => `💥 [前列粉砕] ${m[1]}（前列）に${m[2]}%増幅ダメージ！`
  },
  // 🎯 후열 저격: 🎯 [후열 저격] A(후열) 약점 관통 저격! (...)
  {
    pattern: /🎯\s*\[후열 저격\]\s*(.+?)\(후열\)\s*약점 관통 저격!(.*)/i,
    en: m => `🎯 [Backline Snipe] Vulnerability snipe on ${m[1]} (Back)!${m[2].replace('피해 증폭', 'DMG Boost')}`,
    ja: m => `🎯 [後列狙撃] ${m[1]}（後列）の急所貫通狙撃！${m[2].replace('피해 증폭', 'ダメージ増幅')}`
  },
  // 🩸 처형 일격: 🩸 [처형 일격] 빈사의 A에게 +X% 처형 증폭 피해!
  {
    pattern: /🩸\s*\[처형 일격\]\s*빈사의\s*(.+?)에게\s*\+(\d+)%\s*처형 증폭 피해!/i,
    en: m => `🩸 [Execution Strike] Dealt +${m[2]}% execution damage to weakened ${m[1]}!`,
    ja: m => `🩸 [処刑一撃] 瀕死の${m[1]}に+${m[2]}%の処刑増幅ダメージ！`
  },
  // 🛡️ 보호막 방어: 🛡️ [보호막 방어 / Block!] A → B의 보호막이 공격을 완전히 흡수했습니다! (보호막 X 흡수)
  {
    pattern: /🛡️\s*\[보호막 방어\s*\/\s*Block!\]\s*(.+?)\s*→\s*(.+?)의 보호막이 공격을 완전히 흡수했습니다!\s*\(보호막\s*(\d+)\s*흡수\)/i,
    en: m => `🛡️ [Barrier Block!] ${m[1]} → ${m[2]}'s barrier absorbed all damage! (${m[3]} absorbed)`,
    ja: m => `🛡️ [シールド防御 / Block!] ${m[1]} → ${m[2]}のシールドが攻撃を完全に吸収しました！（シールド ${m[3]} 吸収）`
  },
  // 🗡️ 치명적 본능: 🗡️ [치명적 본능] A의 그림자 추가 타격 ... → B에게 X 치명 피해!
  {
    pattern: /🗡️\s*\[치명적 본능\]\s*(.+?)의\s*그림자 추가 타격(.*)\s*→\s*(.+?)에게\s*(\d+)\s*치명 피해!(.*)/i,
    en: m => `🗡️ [Lethal Instinct] ${m[1]}'s shadow follow-up${m[2]} → ${m[4]} CRIT DMG to ${m[3]}!${m[5]}`,
    ja: m => `🗡️ [致命的本能] ${m[1]}の影追撃${m[2]} → ${m[3]}に${m[4]}の会心ダメージ！${m[5]}`
  },
  // ✨ 영혼의 결속 (파티 전체)
  {
    pattern: /✨\s*\[영혼의 결속\]\s*파티 전원이 상호 최고조 유대\(Bond 100\)를 달성하여 특별 공명 보너스로 마나\(MP\)가\s*(\d+)%\s*회복된 상태로 전투를 시작합니다!/i,
    en: m => `✨ [Soulbond] Max Bond (100) resonance! Entire party starts battle with ${m[1]}% MP restored!`,
    ja: m => `✨ [魂の結束] 全員が最高潮の絆(Bond 100)に到達！共鳴ボーナスでMPが${m[1]}%回復した状態で戦闘を開始します！`
  },
  // ✨ 영혼의 결속 (일부 영웅)
  {
    pattern: /✨\s*\[영혼의 결속\]\s*최고조 유대를 맺은\s*\[(.+?)\]의\s*마나\(MP\)가\s*(\d+)%\s*회복된 상태로 전투를 시작합니다!/i,
    en: m => `✨ [Soulbond] Soulbound heroes [${m[1]}] start battle with ${m[2]}% MP restored!`,
    ja: m => `✨ [魂の結束] 最高潮の絆を結んだ[${m[1]}]のMPが${m[2]}%回復した状態で戦闘を開始します！`
  },
  // 🛡️ 전투 개시 시너지 보호막: 🛡️ [시너지명] 파티 전체에 최대 HP의 X% 전투 개시 보호막 전개!(옵션)
  {
    pattern: /🛡️\s*\[(.+?)\]\s*파티 전체에 최대 HP의\s*(\d+)%\s*전투 개시 보호막 전개!(.*)/i,
    en: m => `🛡️ [${m[1]}] Deployed a battle start barrier (${m[2]}% Max HP) to all allies!${m[3]}`,
    ja: m => `🛡️ [${m[1]}] 味方全体に最大HPの${m[2]}%の戦闘開始シールドを展開！${m[3]}`
  },
  // 👑 보스 거암 결계
  {
    pattern: /👑\s*\[(.+?)\]\s*(.+?)에게 최대 HP의\s*(\d+)%\(🛡️(\d+)\)\s*거암 결계 보호막 전개!/i,
    en: m => `👑 [${m[1]}] Deployed Stone Barrier (🛡️${m[4]}, ${m[3]}% Max HP) on ${m[2]}!`,
    ja: m => `👑 [${m[1]}] ${m[2]}に最大HPの${m[3]}%(🛡️${m[4]})の巨岩結界シールドを展開！`
  },
  // 👑 보스 침묵의 주시
  {
    pattern: /👑\s*\[(.+?)\]\s*(.+?)에게 침묵의 주시\(방어력\+15%, 행운\+10\) 상시 활성!/i,
    en: m => `👑 [${m[1]}] Silent Gaze (DEF +15%, LUCK +10) permanently active on ${m[2]}!`,
    ja: m => `👑 [${m[1]}] ${m[2]}に沈黙の注視(防御力+15%、幸運+10)が常時発動！`
  },
  // 👑 보스 심연 군주 권능
  {
    pattern: /👑\s*\[(.+?)\]\s*(.+?)에게 종말의 심연 군주 권능\(올스탯 \+30%\) 발현!/i,
    en: m => `👑 [${m[1]}] Abyssal Lord Authority (All Stats +30%) awakened on ${m[2]}!`,
    ja: m => `👑 [${m[1]}] ${m[2]}に終末の深淵君主の権能(全ステータス+30%)が発現！`
  },
  // 🛡️✨ 에테르 방벽 전개: 🛡️✨ [+X강 방어구] A에게 최대 HP의 Y%(🛡️Z) 에테르 방벽 전개!
  {
    pattern: /🛡️✨\s*\[\+(\d+)강 방어구\]\s*(.+?)에게 최대 HP의\s*(\d+)%\(🛡️(\d+)\)\s*에테르 방벽 전개!/i,
    en: m => `🛡️✨ [+${m[1]} Armor] Deployed Ether Barrier (${m[3]}% Max HP, 🛡️${m[4]}) on ${m[2]}!`,
    ja: m => `🛡️✨ [+${m[1]} 防具] ${m[2]}に最大HPの${m[3]}%(🛡️${m[4]})のエーテル障壁を展開！`
  },
  // ⚔️ [전투 개시] 속도순 턴 시작
  {
    pattern: /⚔️\s*\[전투 개시\]\s*속도순 턴 시작/i,
    en: () => `⚔️ [Battle Start] Turns begin in order of Speed`,
    ja: () => `⚔️ [戦闘開始] 速度順にターン開始`
  },
  // 💀⚡ 심연 오버차지 광폭화 결계
  {
    pattern: /💀⚡\s*\[심연 오버차지\]\s*광폭화 결계 발동! 결전 중 철수할 수 없습니다!\s*\(EXP \+30%, 전리품 \+50%\)/i,
    en: () => `💀⚡ [Abyssal Overcharge] Frenzy barrier active! Cannot retreat during battle! (EXP +30%, Loot +50%)`,
    ja: () => `💀⚡ [深淵オーバーチャージ] 狂暴化結界発動！決戦中の撤退は不可能です！（EXP +30%, 戦利品 +50%）`
  },
  // 🚩/🛡️ 돌격/타격 배수진 만료
  {
    pattern: /(?:🚩|🛡️)\s*\[(?:돌격|타격)\s*배수진\]\s*전투\s*(?:개시\s*1라운드가|첫\s*턴\(1라운드\)이)\s*종료되어\s*(?:돌격|타격)\s*보호막이 소멸했습니다\./i,
    en: () => `🚩 [Last Stand] Round 1 ended; vanguard barrier dissipated.`,
    ja: () => `🚩 [背水の陣] 第1ラウンドが終了し、突撃シールドが消滅しました。`
  },
  // 💧 시너지 마나 회복: 💧 [A] B 시너지 마나 회복 (+X MP)
  {
    pattern: /💧\s*\[(.+?)\]\s*(.+?)\s*시너지 마나 회복\s*\(\+(\d+)\s*MP\)/i,
    en: m => `💧 [${m[1]}] ${m[2]} Synergy MP Restored (+${m[3]} MP)`,
    ja: m => `💧 [${m[1]}] ${m[2]} シナジーマナ回復 (+${m[3]} MP)`
  },
  // ✨ 시너지 체력 회복: ✨ [A] B 시너지 체력 회복 (+X)
  {
    pattern: /✨\s*\[(.+?)\]\s*(.+?)\s*시너지 체력 회복\s*\(\+(\d+)\)/i,
    en: m => `✨ [${m[1]}] ${m[2]} Synergy HP Restored (+${m[3]})`,
    ja: m => `✨ [${m[1]}] ${m[2]} シナジー体力回復 (+${m[3]})`
  },
  // 🌀 마나 순환 패시브
  {
    pattern: /🌀\s*\[마나 순환\]\s*(.+?)\s*고유 패시브 마나 회복\s*\(\+(\d+)\s*MP\)/i,
    en: m => `🌀 [Mana Circulation] ${m[1]} Passive MP Restored (+${m[2]} MP)`,
    ja: m => `🌀 [マナ循環] ${m[1]} 固有パッシブマナ回復 (+${m[2]} MP)`
  },
  // ⏳ 차원 조율 패시브
  {
    pattern: /⏳\s*\[차원 조율\]\s*(.+?)\s*고유 패시브 마나 회복\s*\(\+(\d+)\s*MP\)/i,
    en: m => `⏳ [Chrono Tuning] ${m[1]} Passive MP Restored (+${m[2]} MP)`,
    ja: m => `⏳ [次元調律] ${m[1]} 固有パッシブマナ回復 (+${m[2]} MP)`
  },
  // ✝️✨ 전투 신앙 기적
  {
    pattern: /✝️✨\s*\[전투 신앙 기적\]\s*(.+?)의\s*신앙으로 파티 전원 체력\s*\+(\d+)\s*치유!/i,
    en: m => `✝️✨ [Miracle of Faith] ${m[1]}'s devout faith healed all allies +${m[2]} HP!`,
    ja: m => `✝️✨ [戦闘信仰の奇跡] ${m[1]}の信仰により味方全員の体力 +${m[2]} 回復！`
  },
  // 🌀 보스 시공 왜곡장
  {
    pattern: /🌀\s*\[(.+?)\]\s*시공 왜곡장 발동:\s*(.+?)\s*마나 즉시 회복\s*\(\+(\d+)\s*MP\)/i,
    en: m => `🌀 [${m[1]}] Chrono Distortion Field: Restored +${m[3]} MP to ${m[2]}`,
    ja: m => `🌀 [${m[1]}] 時空歪曲フィールド発動: ${m[2]}のマナ即時回復 (+${m[3]} MP)`
  },
  // 🪐 보스 종말의 심연 폭발
  {
    pattern: /🪐\s*\[(.+?)\]\s*종말의 심연 폭발! 모든 적에게 광역 파멸 피해!/i,
    en: m => `🪐 [${m[1]}] Cataclysmic Abyssal Burst! All enemies took devastating AOE damage!`,
    ja: m => `🪐 [${m[1]}] 終末の深淵爆発！敵全体に広域壊滅ダメージ！`
  },
  // 💥 심연 파멸타격
  {
    pattern: /💥\s*(.+?)\s*심연 파멸타격\s*\(-(\d+)\)/i,
    en: m => `💥 ${m[1]} Abyssal Ruin Strike (-${m[2]})`,
    ja: m => `💥 ${m[1]} 深淵破滅打撃 (-${m[2]})`
  },
  // ⚰️ 영면 로그
  {
    pattern: /⚰️\s*\[영면\]\s*차가운 심연의 바닥에서\s*(.+?)\s*(?:용병|대원)의 맥박이 완전히 멎었습니다\.\.\.?\s*동료의 영혼이 (?:칠흑|영겁)의 어둠 속으로 흩어집니다\./i,
    en: m => `⚰️ [Eternal Sleep] On the cold abyssal floor, ${m[1]}'s pulse ceased... A companion's soul disperses into the endless dark.`,
    ja: m => `⚰️ [永眠] 冷たい深淵の底で${m[1]}の脈拍が完全に停止しました…仲間の魂が永劫の闇へと散っていきます。`
  },
  // 💀/🛡️ 임종의 위기
  {
    pattern: /(?:💀|🛡️)\s*\[임종의 위기\]\s*(.+?)\s*(?:용병|대원)의 호흡이 (?:끊어지며|옅어지고)\s*심장 박동이 (?:멎어|희미해져)\s*갑니다!\s*남은 시간이 얼마 없습니다!/i,
    en: m => `💀 [Mortal Peril] ${m[1]}'s breath fades and heartbeat falters! Time is running out!`,
    ja: m => `💀 [臨終の危機] ${m[1]}の呼吸が途絶え、心拍が衰えていきます！残された時間はわずかです！`
  },
  // 전투 재개
  {
    pattern: /🔄\s*\[전투 재개\]\s*중단되었던 전투 세션\(턴\s*(\d+)\)을 이어서 진행합니다\./i,
    en: m => `🔄 [Resume Battle] Resuming suspended combat session (Turn ${m[1]}).`,
    ja: m => `🔄 [戦闘再開] 中断されていた戦闘セッション（ターン${m[1]}）を再開します。`
  },
  // 전투 승리
  {
    pattern: /🎉\s*전투 승리!\s*\(획득:\s*🪙\s*([0-9,]+)\s*G,\s*(.*?),\s*⚔️\s*([0-9,]+)\s*EXP\)/i,
    en: m => `🎉 Victory! (Obtained: 🪙 ${m[1]}G, ${m[2]}, ⚔️ ${m[3]} EXP)`,
    ja: m => `🎉 勝利！（獲得: 🪙 ${m[1]}G, ${m[2]}, ⚔️ ${m[3]} EXP）`
  },
  // 전투 패배
  {
    pattern: /💀\s*전투 패배\.\.\./i,
    en: () => `💀 Defeat...`,
    ja: () => `💀 敗北…`
  },
  // 라운드 표시
  {
    pattern: /🚩\s*(\d+)라운드/i,
    en: m => `🚩 Round ${m[1]}`,
    ja: m => `🚩 ラウンド ${m[1]}`
  },
  // 턴 행동자 표시
  {
    pattern: /⏳\s*\[(.+?)\]\s*\((\d+)턴\)/i,
    en: m => `⏳ [${m[1]}] (Turn ${m[2]})`,
    ja: m => `⏳ [${m[1]}] (${m[2]}ターン)`
  },
  // 도주/철수 실패
  {
    pattern: /⚠️\s*\[전투 철수 실패!\]\s*퇴로가 막혀 도주에 실패했습니다!\s*\(성공률:\s*(\d+)%\s*실패,\s*적 반격 턴\)/i,
    en: m => `⚠️ [Retreat Failed!] Retreat path blocked! (${m[1]}% failure rate, enemy counter turn)`,
    ja: m => `⚠️ [戦闘撤退失敗!] 退路を塞がれ逃走に失敗しました！（成功率: ${m[1]}% 失敗、敵反撃ターン）`
  },
  // 철수 불가 결계
  {
    pattern: /⚠️\s*광폭화된 심연 결계로 인해 전투에서 철수할 수 없습니다!/i,
    en: () => `⚠️ Frenzied Abyssal Barrier prevents retreat!`,
    ja: () => `⚠️ 暴走した深淵の結界により戦闘から撤退できません！`
  },
  // 사경의 위기
  {
    pattern: /💀\s*\[사경의 위기\]\s*치명상을 입은\s*(.+?)\s*대원이 의식을 잃고 차가운 바닥에 쓰러졌습니다!\s*숨결이 완전히 멎기 전에 마물을 베어 넘기거나 성스러운 구원의 손길을 뻗어야 합니다!/i,
    en: m => `💀 [Near Death] Severely wounded ${m[1]} lost consciousness and collapsed! Defeat the fiend or cast holy salvation before breath ceases!`,
    ja: m => `💀 [死線の危機] 致命傷を負った${m[1]}隊員が意識を失い倒れました！息絶える前に魔物を倒すか聖なる救いを届けなければなりません！`
  },
  // 사선의 맹세 불굴 버팀 및 동료 수호
  {
    pattern: /💖\s*\[사선의 맹세\]\s*(?:동료들과 맺은 굳건한 맹세의 결속이 빛을 발하며,\s*|동료를 지키기 위해\s*)?(.+?)\s*대원이 불굴의 투지로 (?:죽음의 턱밑에서\s*)?버텨냅니다!/i,
    en: m => `💖 [Oath of the Brink] Unyielding bond shines! ${m[1]} endures through sheer tenacity!`,
    ja: m => `💖 [死線の誓い] 仲間との結束が輝き、${m[1]}隊員が不屈の闘志で持ち堪えました！`
  },
  // 발키리 불멸의 수호 부활
  {
    pattern: /🕊️👑\s*\[불멸의 수호\]\s*발키리\s*(.+?)(?:이\(가\)|이|가)\s*쓰러지는 순간 기적의 빛으로 부활하며 생존 파티원의 상처를 치유했습니다!/i,
    en: m => `🕊️👑 [Immortal Aegis] Valkyrie ${m[1]} resurrected with miraculous radiance and healed surviving companions!`,
    ja: m => `🕊️👑 [不滅の守護] ワルキューレ${m[1]}が倒れた瞬間、奇跡の光で蘇生し生存した仲間の傷を癒やしました！`
  },
  // 피버 부활
  {
    pattern: /🩸🕊️\s*\[(.+?)\]\s*쓰러졌던\s*(.+?)(?:이\(가\)|이|가)\s*기적처럼 HP\s*(\d+)로 부활했습니다!/i,
    en: m => `🩸🕊️ [${m[1]}] Fallen ${m[2]} miraculously revived with ${m[3]} HP!`,
    ja: m => `🩸🕊️ [${m[1]}] 倒れていた${m[2]}が奇跡のようにHP ${m[3]}で復活しました！`
  },
  // 사경 소생 스킬 강림
  {
    pattern: /🕊️✨\s*(.+?)\s*\[(.+?)\]\s*강림!\s*기적의 기도로 사경을 헤매던\s*(.+?)(?:을\(를\)|을|를)\s*체력 1로 극적 소생시켰습니다!\s*➔\s*\[(.*?)\]/i,
    en: m => `🕊️✨ ${m[1]} [${m[2]}] Advent! Miraculous prayer revived perilously injured ${m[3]} with 1 HP! ➔ [${m[4]}]`,
    ja: m => `🕊️✨ ${m[1]} [${m[2]}] 降臨！奇跡の祈りで死線を彷徨っていた${m[3]}をHP 1で劇的に蘇生させました！ ➔ [${m[4]}]`
  },
  // 부활 및 완전 치유 스킬 강림
  {
    pattern: /🕊️✨\s*(.+?)\s*\[(.+?)\]\s*강림!\s*기적의 권능으로 사망한 동료를 부활시키고 파티를 완전 치유했습니다!\s*➔\s*\[(.*?)\]/i,
    en: m => `🕊️✨ ${m[1]} [${m[2]}] Advent! Divine authority revived fallen allies and fully restored the squad! ➔ [${m[3]}]`,
    ja: m => `🕊️✨ ${m[1]} [${m[2]}] 降臨！奇跡の権能で倒れた仲間を復活させ、部隊を全快させました！ ➔ [${m[3]}]`
  },
  // 후열 전술 사격 마나 환급
  {
    pattern: /✨\s*\[후열 전술 사격\]\s*(.+?)(?:이\(가\)|이|가)\s*후열 연계로 마나\s*\+(\d+)\s*MP를 환급받았습니다!/i,
    en: m => `✨ [Backline Tactical Fire] ${m[1]} refunded +${m[2]} MP via backline link!`,
    ja: m => `✨ [後列戦術射撃] ${m[1]}が後列連携によりマナ +${m[2]} MPを還元されました！`
  },
  // 에테르 과충전
  {
    pattern: /✨🔋\s*\[에테르 과충전\]\s*마나\s*\+(\d+)\s*MP를 회복하고 다음 공격력이\s*(\d+)%\s*폭풍 증폭되었습니다!/i,
    en: m => `✨🔋 [Ether Overcharge] Restored +${m[1]} MP, next attack DMG amplified by +${m[2]}%!`,
    ja: m => `✨🔋 [エーテル過充電] マナ +${m[1]} MPを回復し、次攻撃の威力が+${m[2]}%大増幅！`
  },
  // 전사의 함성
  {
    pattern: /🚩🔋\s*\[전사의 함성\]\s*사기를 북돋아 마나\s*\+(\d+)\s*MP를 충전했습니다!/i,
    en: m => `🚩🔋 [Warrior's Roar] Morale boosted! Charged +${m[1]} MP!`,
    ja: m => `🚩🔋 [戦士の咆哮] 士気を鼓舞しマナ +${m[1]} MPをチャージしました！`
  },
  // 시공 왜곡 쿨다운 단축
  {
    pattern: /⏳✨\s*\[시공 왜곡\]\s*아군 전체 마나\s*\+(\d+)\s*MP 회복 및 모든 스킬 쿨다운을\s*(\d+)턴 즉시 단축했습니다!/i,
    en: m => `⏳✨ [Chrono Warp] Restored +${m[1]} MP to all allies and reduced all skill cooldowns by ${m[2]} turn(s)!`,
    ja: m => `⏳✨ [時空歪曲] 味方全員のマナ +${m[1]} MP回復＆全スキルのクールダウンを${m[2]}ターン短縮！`
  },
  // 오버클럭 리로드
  {
    pattern: /⚙️🎯\s*\[오버클럭 리로드\]\s*아군 전체 스킬 쿨다운\s*(\d+)턴 단축 및\s*(\d+)턴간 치명 공격력\s*(\d+)%\s*증폭!/i,
    en: m => `⚙️🎯 [Overclock Reload] Reduced squad skill cooldowns by ${m[1]} turn(s) & boosted CRIT DMG by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `⚙️🎯 [オーバークロックリロード] 味方全体のクールダウンを${m[1]}ターン短縮＆${m[2]}ターン間会心ダメージ+${m[3]}%！`
  },
  // 시공 역류 완전 초기화
  {
    pattern: /⌛💫\s*\[시공 역류\]\s*시간의 흐름을 되돌려 파티 전원의 체력과 마나를 회복하고 모든 스킬 쿨다운을 완전 초기화했습니다!/i,
    en: () => `⌛💫 [Time Reversal] Rewound time, restored party HP/MP and reset all skill cooldowns!`,
    ja: () => `⌛💫 [時空逆流] 時の流れを巻き戻し、味方全体のHP/MPを回復＆全クールダウンを完全初期化！`
  },
  // 파티 마나 회복
  {
    pattern: /💧\s*\[마나 회복\]\s*파티 전원의 마나가\s*\+(\d+)\s*MP 회복되었습니다\./i,
    en: m => `💧 [Mana Recovery] Party recovered +${m[1]} MP.`,
    ja: m => `💧 [マナ回復] パーティ全員のマナが +${m[1]} MP 回復しました。`
  },
  // 개인 마나 회복
  {
    pattern: /💧\s*\[마나 회복\]\s*(.+?)의\s*마나가\s*\+(\d+)\s*MP 회복되었습니다\./i,
    en: m => `💧 [Mana Recovery] ${m[1]} recovered +${m[2]} MP.`,
    ja: m => `💧 [マナ回復] ${m[1]}のマナが +${m[2]} MP 回復しました。`
  },
  // FEVER 마나 완충
  {
    pattern: /🔋👑\s*\[(.+?)\]\s*파티 전원의 마나\(MP\)를 100% 즉시 완충했습니다!/i,
    en: m => `🔋👑 [${m[1]}] Instantly fully charged 100% MP for all party members!`,
    ja: m => `🔋👑 [${m[1]}] パーティ全員のマナ(MP)を100%即時満充填しました！`
  },
  // FEVER 마나 퍼센트 회복
  {
    pattern: /🔋👑\s*\[(.+?)\]\s*파티 전원의 마나\(MP\)를\s*(\d+)%\s*회복했습니다!/i,
    en: m => `🔋👑 [${m[1]}] Restored ${m[2]}% MP to all party members!`,
    ja: m => `🔋👑 [${m[1]}] パーティ全員のマナ(MP)を${m[2]}%回復しました！`
  },
  // 사령의 영혼 수확 파티 치유
  {
    pattern: /💀✨\s*\[사령의 영혼 수확\]\s*가한 총 피해\((.+?)\)의\s*(\d+)%인\s*\+(\d+)\s*HP를 파티 전원에게 치유로 환원했습니다!/i,
    en: m => `💀✨ [Soul Harvest] Restored +${m[3]} HP (${m[2]}% of ${m[1]} total damage) to all party members!`,
    ja: m => `💀✨ [死霊の魂収穫] 与えた総ダメージ(${m[1]})の${m[2]}%である +${m[3]} HPを味方全員に回復還元！`
  },
  // 진홍의 피의 지배 흡혈/출혈
  {
    pattern: /🍷\s*\[진홍의 피의 지배\]\s*흡혈로 HP\s*\+(\d+)\s*자가 회복 및 적 전체에게\s*(\d+)턴간 치명 출혈을 확산시켰습니다!/i,
    en: m => `🍷 [Crimson Blood Dominion] Drained +${m[1]} HP and spread deadly Bleed to all enemies for ${m[2]} turn(s)!`,
    ja: m => `🍷 [真紅の血の支配] 吸血でHP +${m[1]} 自家回復＆敵全体に${m[2]}ターンの致命的出血を拡散！`
  },
  // 성전 타격 치유
  {
    pattern: /✝️✨\s*\[성전 타격 치유\]\s*공격의 신성력으로\s*(.+?)의\s*체력이\s*\+(\d+)\((\d+)%\)\s*회복되었습니다!/i,
    en: m => `✝️✨ [Crusade Strike Heal] Divine strike healed ${m[1]}'s HP by +${m[2]} (${m[3]}%)!`,
    ja: m => `✝️✨ [聖戦打撃治癒] 攻撃の神聖力で${m[1]}のHPが +${m[2]} (${m[3]}%) 回復しました！`
  },
  // 심판관의 성전 파티 환원 치유
  {
    pattern: /⚖️✨\s*\[심판관의 성전\]\s*가한 총 피해의\s*(\d+)%인\s*\+(\d+)\s*HP를 파티 전원에게 치유로 환원했습니다!/i,
    en: m => `⚖️✨ [Inquisitor's Crusade] Converted ${m[1]}% of total damage dealt (+${m[2]} HP) into healing for all allies!`,
    ja: m => `⚖️✨ [審判官の聖戦] 与えた総ダメージの${m[1]}%にあたる +${m[2]} HPを味方全員に回復還元！`
  },
  // 천벌의 성십자가 아군 전원 치유
  {
    pattern: /✝️✨\s*\[천벌의 성십자가\]\s*신성 성광의 은총으로 생존 아군 전원의 체력이\s*\+(\d+)%\s*치유되었습니다!/i,
    en: m => `✝️✨ [Cross of Retribution] Holy radiance healed all surviving allies by +${m[1]}%!`,
    ja: m => `✝️✨ [天罰の聖十字架] 聖なる光の恩寵により生存味方全員のHPが +${m[1]}% 回復しました！`
  },
  // 생명력 흡수
  {
    pattern: /🩸\s*\[생명력 흡수\]\s*가한 피해의\s*(\d+)%를 흡혈하여 체력\s*\+(\d+)\s*회복!/i,
    en: m => `🩸 [Life Drain] Absorbed ${m[1]}% of dealt damage to restore +${m[2]} HP!`,
    ja: m => `🩸 [生命力吸収] 与えたダメージの${m[1]}%を吸血しHP +${m[2]} 回復！`
  },
  // FEVER 생존 전원 100% 완전 회복
  {
    pattern: /💖✨\s*\[(.+?)\]\s*생존 아군 전원의 체력이 100% 완전 회복되었습니다!/i,
    en: m => `💖✨ [${m[1]}] Fully restored 100% HP to all surviving allies!`,
    ja: m => `💖✨ [${m[1]}] 生存味方全員のHPが100%完全回復しました！`
  },
  // FEVER 생존 전원 퍼센트 회복
  {
    pattern: /💖✨\s*\[(.+?)\]\s*생존 아군 전원의 체력을\s*(\d+)%\s*회복했습니다!/i,
    en: m => `💖✨ [${m[1]}] Restored ${m[2]}% HP to all surviving allies!`,
    ja: m => `💖✨ [${m[1]}] 生存味方全員のHPを${m[2]}%回復しました！`
  },
  // FEVER 흡혈 파티 치유 환원
  {
    pattern: /🍷✨\s*\[(.+?)\s*흡혈\]\s*가한 피해의\s*(\d+)%\(\+(\d+)\s*HP\)를 파티 전원에게 치유로 환원했습니다!/i,
    en: m => `🍷✨ [${m[1]} Drain] Converted ${m[2]}% of damage (+${m[3]} HP) to party-wide healing!`,
    ja: m => `🍷✨ [${m[1]} 吸血] 与えたダメージの${m[2]}%(+${m[3]} HP)を味方全員に回復還元！`
  },
  // 성지 정화 결계 지속 재생
  {
    pattern: /💚✨\s*\[성지 정화 결계\]\s*(\d+)턴간 파티 전체에 매 턴 체력\s*(\d+)%\s*지속 재생을 부여했습니다!/i,
    en: m => `💚✨ [Sanctuary Barrier] Granted party-wide +${m[2]}% HP regen per turn for ${m[1]} turn(s)!`,
    ja: m => `💚✨ [聖地浄化結界] ${m[1]}ターンの間味方全体に毎ターンHP ${m[2]}%の継続リジェネを付与！`
  },
  // 스킬 시전 파티 전원 치유 리포트
  {
    pattern: /✨\s*(.+?)\s*\[(.+?)\]\s*→\s*파티 전원 치유!\s*\[(.*?)\]/i,
    en: m => `✨ ${m[1]} [${m[2]}] → Healed entire party! [${m[3]}]`,
    ja: m => `✨ ${m[1]} [${m[2]}] → 味方全員回復！ [${m[3]}]`
  },
  // 스킬 시전 대상 치유 리포트
  {
    pattern: /✨\s*(.+?)\s*\[(.+?)\]\s*→\s*([^보호막]+?(?:치유|회복|HP|\+\d+).*)/i,
    en: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`,
    ja: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`
  },
  // 생명의 샘
  {
    pattern: /💖\s*\[생명의 샘\]\s*성령의 은총으로\s*(.+?)\s*체력\s*\+(\d+)\s*회복!/i,
    en: m => `💖 [Font of Life] Holy grace restored +${m[2]} HP to ${m[1]}!`,
    ja: m => `💖 [生命の泉] 聖霊の恩寵で${m[1]}のHP +${m[2]} 回復！`
  },
  // 축복의 은혜
  {
    pattern: /✝️✨\s*\[축복의 은혜\]\s*(.+?)(?:이\(가\)|이|가)\s*스킬 시전에 공명하여 체력\s*\+(\d+)\s*회복!/i,
    en: m => `✝️✨ [Grace of Blessing] ${m[1]} resonated with skill cast and restored +${m[2]} HP!`,
    ja: m => `✝️✨ [祝福の恵み] ${m[1]}がスキル詠唱に共鳴してHP +${m[2]} 回復！`
  },
  // 전투 신앙 기적 자가 치유
  {
    pattern: /✝️\s*\[전투 신앙 기적\]\s*(.+?)의\s*신앙으로 체력\s*\+(\d+)\s*즉시 치유!/i,
    en: m => `✝️ [Miracle of Faith] Devout faith restored +${m[2]} HP to ${m[1]}!`,
    ja: m => `✝️ [戦闘信仰の奇跡] ${m[1]}の信仰によりHP +${m[2]} 即時回復！`
  },
  // 몬스터 자가 치유
  {
    pattern: /💚\s*(.+?)\s*\[(.+?)\]\s*→\s*자신 체력\s*\+(\d+)\s*회복!/i,
    en: m => `💚 ${m[1]} [${m[2]}] → Restored +${m[3]} HP to self!`,
    ja: m => `💚 ${m[1]} [${m[2]}] → 自身のHP +${m[3]} 回復！`
  },
  // 몬스터 아군 치유
  {
    pattern: /💚\s*(.+?)\s*\[(.+?)\]\s*→\s*부상당한 아군\s*(.+?)\s*체력\s*\+(\d+)\s*치유!/i,
    en: m => `💚 ${m[1]} [${m[2]}] → Healed ally ${m[3]} by +${m[4]} HP!`,
    ja: m => `💚 ${m[1]} [${m[2]}] → 負傷した味方${m[3]}のHPを+${m[4]}回復！`
  },
  // 방어 파쇄 창끝 증폭
  {
    pattern: /🔱\s*\[방어 파쇄\]\s*(.+?)의\s*창끝이\s*(.+?)의\s*보호막에\s*(\d+)%\s*증폭 피해를 입혔습니다!/i,
    en: m => `🔱 [Shield Break] ${m[1]}'s spearhead dealt ${m[3]}% amplified damage to ${m[2]}'s barrier!`,
    ja: m => `🔱 [防御破砕] ${m[1]}の槍先が${m[2]}のシールドに${m[3]}%増幅ダメージを与えました！`
  },
  // 전열 압도
  {
    pattern: /🚩🛡️\s*\[전열 압도\]\s*적 전체의 공격력을\s*(\d+)%\s*약화시키고 아군 전원에게 최대 HP\s*(\d+)%\s*보호막을 부여했습니다!/i,
    en: m => `🚩🛡️ [Frontline Overwhelm] Reduced all enemies' ATK by ${m[1]}% and granted ${m[2]}% Max HP barrier to all allies!`,
    ja: m => `🚩🛡️ [前列圧倒] 敵全体の攻撃力を${m[1]}%弱体化させ、味方全員に最大HP ${m[2]}%のシールドを付与！`
  },
  // 흑핵 방벽
  {
    pattern: /❄️🛡️\s*\[흑핵 방벽\]\s*절대 영도의 에너지로 전열 아군에게 보호막\((\d+)\)을 부여했습니다!/i,
    en: m => `❄️🛡️ [Black Core Barrier] Absolute zero energy granted a barrier (${m[1]}) to frontline allies!`,
    ja: m => `❄️🛡️ [黒核防壁] 絶対零度のエネルギーで前列味方にシールド(${m[1]})を付与しました！`
  },
  // 공허 묵시록 디버프 정화 및 절대 무적
  {
    pattern: /🔮✨\s*\[공허 묵시록\]\s*아군 전원의 모든 디버프를 완전 정화하고\s*(\d+)턴간 절대 무적 결계를 전개했습니다!/i,
    en: m => `🔮✨ [Void Apocalypse] Cleansed all debuffs from squad and activated Absolute Invulnerability for ${m[1]} turn(s)!`,
    ja: m => `🔮✨ [虚無の黙示録] 味方全員の全デバフを完全浄化し、${m[1]}ターンの絶対無敵結界を展開！`
  },
  // 군단 총진격 흡수 방벽
  {
    pattern: /🚩🛡️\s*\[군단 총진격\]\s*무적의 군세 보호막으로 파티 전원에게 최대 HP\s*(\d+)%\s*흡수 방벽을 전개했습니다!/i,
    en: m => `🚩🛡️ [Legion Advance] Deployed a ${m[1]}% Max HP absorption barrier to all party members!`,
    ja: m => `🚩🛡️ [軍団総進撃] 無敵の軍勢シールドで味方全員に最大HP ${m[1]}%の吸収防壁を展開！`
  },
  // FEVER 파티 에테르 방벽
  {
    pattern: /🛡️✨\s*\[(.+?)\]\s*파티 전원에게 최대 HP\s*(\d+)%\s*에테르 방벽을 전개했습니다!/i,
    en: m => `🛡️✨ [${m[1]}] Deployed a ${m[2]}% Max HP Ether Barrier to all party members!`,
    ja: m => `🛡️✨ [${m[1]}] 味方全員に最大HP ${m[2]}%のエーテル防壁を展開！`
  },
  // FEVER 절대 면역 결계
  {
    pattern: /🛡️✨\s*\[(.+?)\]\s*파티 전원에게\s*(\d+)턴간 절대 면역 결계를 부여했습니다!/i,
    en: m => `🛡️✨ [${m[1]}] Granted Absolute Immunity Barrier to all party members for ${m[2]} turn(s)!`,
    ja: m => `🛡️✨ [${m[1]}] 味方全員に${m[2]}ターンの絶対免疫結界を付与！`
  },
  // FEVER 환영 반격 결계
  {
    pattern: /⚔️💨\s*\[(.+?)\]\s*파티 전원에게\s*(\d+)턴간 100% 환영 반격 결계를 전개했습니다!/i,
    en: m => `⚔️💨 [${m[1]}] Deployed 100% Illusion Counter Barrier to all allies for ${m[2]} turn(s)!`,
    ja: m => `⚔️💨 [${m[1]}] 味方全員に${m[2]}ターンの100%幻影反撃結界を展開！`
  },
  // 신성 집결 피해 경감
  {
    pattern: /🛡️✨\s*\[신성 집결\]\s*(\d+)턴간 파티 전체가 받는 피해를\s*(\d+)%\s*경감합니다!/i,
    en: m => `🛡️✨ [Holy Rally] Reduced party damage taken by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🛡️✨ [神聖結集] ${m[1]}ターンの間味方全体の被ダメージを${m[2]}%軽減！`
  },
  // 방어 태세
  {
    pattern: /🏰\s*\[방어 태세\]\s*(.+?)(?:이\(가\)|이|가)\s*(\d+)턴간 방어 태세\(방어력\s*\+(\d+)%\)를 취합니다!/i,
    en: m => `🏰 [Defensive Stance] ${m[1]} assumed Defensive Stance (DEF +${m[3]}%) for ${m[2]} turn(s)!`,
    ja: m => `🏰 [防御態勢] ${m[1]}が${m[2]}ターン間防御態勢(防御力+${m[3]}%)をとります！`
  },
  // 성전 결계 전개 공방 증폭
  {
    pattern: /⚔️🔰\s*\[성전 결계 전개\]\s*(\d+)턴간 아군 전체의 공격력과 방어력이\s*(\d+)%\s*증폭되었습니다!/i,
    en: m => `⚔️🔰 [Crusade Barrier] Boosted entire squad's ATK and DEF by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `⚔️🔰 [聖戦結界展開] ${m[1]}ターン間味方全体の攻撃力と防御力が${m[2]}%増幅！`
  },
  // 스킬 시전 파티 전원 보호막 리포트
  {
    pattern: /🛡️\s*(.+?)\s*\[(.+?)\]\s*→\s*파티 전원 보호막 전개!\s*\[(.*?)\]/i,
    en: m => `🛡️ ${m[1]} [${m[2]}] → Deployed barrier on all allies! [${m[3]}]`,
    ja: m => `🛡️ ${m[1]} [${m[2]}] → 味方全員にシールド展開！ [${m[3]}]`
  },
  // 절대 요새의 성역
  {
    pattern: /🏰🌟\s*\[절대 요새의 성역\]\s*아군 전원\s*(\d+)턴 완전 무적 및\s*(\d+)턴간 받는 피해\s*(\d+)%\s*절대 경감 결계를 전개했습니다!/i,
    en: m => `🏰🌟 [Sanctuary of Bastion] Granted ${m[1]} turn(s) Invincibility and deployed ${m[3]}% Damage Reduction for ${m[2]} turn(s)!`,
    ja: m => `🏰🌟 [絶対要塞の聖域] 味方全員${m[1]}ターン完全無敵＆${m[2]}ターン被ダメージ${m[3]}%軽減結界を展開！`
  },
  // 스킬 시전 개별 보호막 부여 리포트
  {
    pattern: /🛡️\s*(.+?)\s*\[(.+?)\]\s*→\s*(.+?)\s*보호막 부여/i,
    en: m => `🛡️ ${m[1]} [${m[2]}] → Granted barrier to ${m[3]}`,
    ja: m => `🛡️ ${m[1]} [${m[2]}] → ${m[3]}にシールド付与`
  },
  // 수호의 결속
  {
    pattern: /🛡️\s*\[수호의 결속\]\s*(.+?)(?:이\(가\)|이|가)\s*빈사의\s*(.+?)(?:을\(를\)|을|를)\s*지키기 위해\s*\[보호막\s*(\d+)\]을 전개했습니다!/i,
    en: m => `🛡️ [Bond of Protection] ${m[1]} deployed [Barrier ${m[3]}] to safeguard critical ally ${m[2]}!`,
    ja: m => `🛡️ [守護の結束] ${m[1]}が瀕死の${m[2]}を守るため[シールド ${m[3]}]を展開しました！`
  },
  // 전열 엄호 피해 대리
  {
    pattern: /🛡️\s*\[전열 엄호\]\s*(.+?)(?:이\(가\)|이|가)\s*후열\s*(.+?)의\s*피해를\s*(\d+)%\s*대신 받아\s*(\d+)의 피해를 감내했습니다!/i,
    en: m => `🛡️ [Frontline Cover] ${m[1]} intercepted ${m[3]}% of backline ${m[2]}'s damage, taking ${m[4]} DMG!`,
    ja: m => `🛡️ [前列援護] ${m[1]}が後列${m[2]}のダメージを${m[3]}%身代わりとなり、${m[4]}のダメージを受け止めました！`
  },
  // 면역 결계 효과 차단
  {
    pattern: /✨🛡️\s*\[면역 결계\]\s*(.+?)의\s*성스러운 정화 결계가\s*\[(.+?)\]\s*효과를 완전히 차단했습니다!/i,
    en: m => `✨🛡️ [Immunity Barrier] ${m[1]}'s holy purifying barrier completely blocked [${m[2]}]!`,
    ja: m => `✨🛡️ [免疫結界] ${m[1]}の聖なる浄化結界が[${m[2]}]効果を完全に遮断しました！`
  },
  // 몬스터 보호막 전개
  {
    pattern: /🛡️\s*(.+?)\s*\[(.+?)\]\s*→\s*보호막\((\d+)\)\s*전개!/i,
    en: m => `🛡️ ${m[1]} [${m[2]}] → Deployed barrier (${m[3]})!`,
    ja: m => `🛡️ ${m[1]} [${m[2]}] → シールド(${m[3]})展開！`
  },
  // 신성 마법 치명타 상승
  {
    pattern: /✨\s*\[신성 마법\]\s*성광의 축복으로 치명타 확률이\s*\+(\d+)%\s*상승합니다!\s*\(치명타율:\s*(\d+)%\)/i,
    en: m => `✨ [Holy Magic] Holy Blessing increased CRIT rate by +${m[1]}%! (Crit: ${m[2]}%)`,
    ja: m => `✨ [神聖魔法] 聖光の祝福により会心率が +${m[1]}% 上昇！（会心率: ${m[2]}%）`
  },
  // 마도 탄도학 관통/충전
  {
    pattern: /🔋\s*\[마도 탄도학\]\s*치명타 적중으로\s*(.+?)의\s*방어력을\s*(\d+)%\s*추가 관통하고 마나\s*\+(\d+)\s*MP를 충전합니다\./i,
    en: m => `🔋 [Arcane Ballistics] CRIT hit pierced ${m[2]}% more DEF of ${m[1]} and restored +${m[3]} MP.`,
    ja: m => `🔋 [魔導弾道学] 会心命中により${m[1]}の防御力を${m[2]}%追加貫通し、マナ +${m[3]} MPを充填！`
  },
  // 순수 피해 방어 무시
  {
    pattern: /🗡️✨\s*\[\+(\d+)강 순수 피해\]\s*방어 무시\s*(\d+)\s*피해 직격!/i,
    en: m => `🗡️✨ [+${m[1]} Pure Damage] Direct hit dealing ${m[2]} True Damage ignoring defense!`,
    ja: m => `🗡️✨ [+${m[1]} 純粋ダメージ] 防御無視 ${m[2]} の直撃ダメージ！`
  },
  // 베기 출혈 부여
  {
    pattern: /🗡️\s*\[베기\]\s*(.+?)의\s*예리한 검격이\s*(.+?)에게\s*(\d+)턴간\s*\[출혈\]\s*상태이상을 부여했습니다!/i,
    en: m => `🗡️ [Slash] ${m[1]}'s sharp slash inflicted [Bleed] on ${m[2]} for ${m[3]} turn(s)!`,
    ja: m => `🗡️ [斬撃] ${m[1]}の鋭い斬撃が${m[2]}に${m[3]}ターンの[出血]を付与しました！`
  },
  // 마도 연사 추가 피해
  {
    pattern: /🔫\s*\[마도 연사\]\s*기본\s*(\d+)%와 행운\(🍀(\d+)\)의 가호로 추가 점사 탄환\(공격력\s*(\d+)%\s*위력\)이 격발되어\s*(.+?)에게\s*(\d+)\s*추가 피해!/i,
    en: m => `🔫 [Arcane Burst] Luck (🍀${m[2]}) triggered extra burst fire (${m[3]}% ATK), dealing ${m[5]} bonus DMG to ${m[4]}!`,
    ja: m => `🔫 [魔導連射] 基本${m[1]}%と幸運(🍀${m[2]})の加護で追加連射弾(${m[3]}%攻撃力)が発射され、${m[4]}に${m[5]}の追加ダメージ！`
  },
  // 원혼의 속박 빙결
  {
    pattern: /⛓️\s*\[(.+?)\]\s*원혼의 속박 발동:\s*(.+?)\s*(\d+)턴간\s*\[빙결\]\s*행동 불능!/i,
    en: m => `⛓️ [${m[1]}] Soul Shackle: ${m[2]} is [Frozen] for ${m[3]} turn(s)!`,
    ja: m => `⛓️ [${m[1]}] 怨念の束縛発動: ${m[2]}が${m[3]}ターンの間[凍結]行動不能！`
  },
  // 약점 분석 방어력 분쇄
  {
    pattern: /🎯\s*\[약점 분석\]\s*(.+?)의\s*사격으로\s*(.+?)의\s*방어력이\s*(\d+)%\s*분쇄되었습니다!/i,
    en: m => `🎯 [Weakness Analysis] ${m[1]}'s shot shredded ${m[2]}'s DEF by ${m[3]}%!`,
    ja: m => `🎯 [急所分析] ${m[1]}の狙撃により${m[2]}の防御力が${m[3]}%粉砕されました！`
  },
  // 광전사의 화신 치명타 강화
  {
    pattern: /🔥\s*\[광전사의 화신\]\s*(.+?)의\s*치명타로 파티 전원 공격력\s*(\d+)%\s*강화!/i,
    en: m => `🔥 [Berserker Incarnation] ${m[1]}'s CRIT hit boosted squad ATK by ${m[2]}%!`,
    ja: m => `🔥 [バーサーカーの化身] ${m[1]}の会心打撃で味方全員の攻撃力 +${m[2]}% 強化！`
  },
  // 장비 마도 공명 추가 마도 피해
  {
    pattern: /📜✨\s*\[장비 마도 공명!\]\s*(.+?)의\s*(.+?)\s*→\s*(.+?)에게\s*(\d+)\s*추가 마도 피해!/i,
    en: m => `📜✨ [Gear Resonance!] ${m[1]}'s ${m[2]} → dealt ${m[4]} bonus magic DMG to ${m[3]}!`,
    ja: m => `📜✨ [装備魔導共鳴!] ${m[1]}の${m[2]} → ${m[3]}に${m[4]}の追加魔法ダメージ！`
  },
  // 피의 축제 처치 공격력 상승
  {
    pattern: /🩸\s*\[피의 축제\]\s*(.+?)(?:이\(가\)|이|가)\s*적을 처치하여 공격력\s*\+(\d+)%\s*상승!/i,
    en: m => `🩸 [Blood Feast] ${m[1]} killed an enemy: ATK increased by +${m[2]}%!`,
    ja: m => `🩸 [血の祝祭] ${m[1]}が敵を討伐し攻撃力 +${m[2]}% 上昇！`
  },
  // 행운 저항
  {
    pattern: /🛡️\s*\[저항\(RESIST\)\]\s*(.+?)(?:이\(가\)|이|가)\s*높은 행운\(🍀(\d+)\)으로\s*\[(.+?)\]\s*효과를 완전히 저항해냈습니다!/i,
    en: m => `🛡️ [RESIST] ${m[1]} completely resisted [${m[3]}] with high luck (🍀${m[2]})!`,
    ja: m => `🛡️ [抵抗(RESIST)] ${m[1]}が高い幸運(🍀${m[2]})で[${m[3]}]効果を完全に抵抗しました！`
  },
  // 실명/명중저하 부여
  {
    pattern: /👁️‍🗨️\s*\[실명\/명중저하\]\s*(.+?)에게\s*(\d+)턴간 명중률\s*(\d+)%\s*저하를 부여했습니다!/i,
    en: m => `👁️‍🗨️ [Blind/Accuracy Down] Inflicted ${m[3]}% Accuracy Down on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `👁️‍🗨️ [暗闇/命中低下] ${m[1]}に${m[2]}ターンの間命中率${m[3]}%低下を付与！`
  },
  // 화상 부여 상세
  {
    pattern: /🔥\s*\[화상 부여\]\s*(.+?)에게\s*(\d+)턴간 화상\(매 턴\s*(\d+)%\s*지속 피해\)을 부여했습니다!/i,
    en: m => `🔥 [Inflict Burn] Inflicted Burn (${m[3]}% DoT per turn) on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `🔥 [火傷付与] ${m[1]}に${m[2]}ターンの間火傷（毎ターン${m[3]}%継続ダメージ）を付与！`
  },
  // 출혈 유발 상세
  {
    pattern: /🩸\s*\[출혈 유발\]\s*(.+?)에게\s*(\d+)턴간 출혈 효과를 부여했습니다!/i,
    en: m => `🩸 [Inflict Bleed] Inflicted Bleed on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `🩸 [出血誘発] ${m[1]}に${m[2]}ターンの間出血効果を付与！`
  },
  // 맹독 주입 상세
  {
    pattern: /☠️\s*\[맹독 주입\]\s*(.+?)에게\s*(\d+)턴간 맹독\(매 턴 최대 HP\s*(\d+)%\s*치명 피해\)을 주입했습니다!/i,
    en: m => `☠️ [Inject Poison] Injected Deadly Poison (${m[3]}% Max HP lethal DoT) into ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `☠️ [猛毒注入] ${m[1]}に${m[2]}ターンの間猛毒（毎ターン最大HP ${m[3]}%致命傷）を注入！`
  },
  // 빙결/냉각 부여 상세
  {
    pattern: /❄️\s*\[빙결\/냉각\]\s*(.+?)에게\s*(\d+)턴간 빙결\(행동 불가 & (\d+)% 동상 피해\)을 부여했습니다!/i,
    en: m => `❄️ [Freeze/Chill] Inflicted Freeze (Immobilized & ${m[3]}% Frostbite DoT) on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `❄️ [凍結/冷却] ${m[1]}に${m[2]}ターンの間凍結（行動不能＆${m[3]}%凍傷ダメージ）を付与！`
  },
  // 기절 부여 상세
  {
    pattern: /💫\s*\[기절 부여\]\s*(.+?)에게\s*(\d+)턴간 기절을 부여했습니다!/i,
    en: m => `💫 [Inflict Stun] Stunned ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `💫 [気絶付与] ${m[1]}に${m[2]}ターンの間気絶を付与！`
  },
  // 공격력 약화 상세
  {
    pattern: /⚔️⬇️\s*\[공격력 약화\]\s*(.+?)의\s*공격력을\s*(\d+)턴간\s*(\d+)%\s*감소시켰습니다!/i,
    en: m => `⚔️⬇️ [ATK Weakened] Reduced ${m[1]}'s ATK by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `⚔️⬇️ [攻撃力弱化] ${m[1]}の攻撃力を${m[2]}ターンの間${m[3]}%減少させました！`
  },
  // 방어력 분쇄 상세
  {
    pattern: /🛡️⬇️\s*\[방어력 분쇄\]\s*(.+?)의\s*방어력을\s*(\d+)턴간\s*(\d+)%\s*감소시켰습니다!/i,
    en: m => `🛡️⬇️ [DEF Shredded] Reduced ${m[1]}'s DEF by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `🛡️⬇️ [防御力粉砕] ${m[1]}の防御力を${m[2]}ターンの間${m[3]}%減少させました！`
  },
  // 원소 마법 화상
  {
    pattern: /🔥\s*\[원소 마법:\s*화상\]\s*(.+?)에게\s*(\d+)턴간 원소 화상(?:\(매 턴\s*(\d+)%\s*피해\))?을 추가 부여했습니다!/i,
    en: m => `🔥 [Elemental: Burn] Inflicted Elemental Burn on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `🔥 [元素魔法: 火傷] ${m[1]}に${m[2]}ターンの間元素火傷を追加付与！`
  },
  // 원소 마법 빙결
  {
    pattern: /❄️\s*\[원소 마법:\s*빙결\]\s*(.+?)에게\s*(\d+)턴간 원소 빙결\(행동 불가\)을 추가 부여했습니다!/i,
    en: m => `❄️ [Elemental: Freeze] Inflicted Elemental Freeze (Immobilized) on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `❄️ [元素魔法: 凍結] ${m[1]}に${m[2]}ターンの間元素凍結(行動不能)を追加付与！`
  },
  // 원소 마법 감전
  {
    pattern: /⚡\s*\[원소 마법:\s*감전\]\s*(.+?)에게\s*(\d+)턴간 원소 감전 기절을 추가 부여했습니다!/i,
    en: m => `⚡ [Elemental: Shock] Inflicted Shock Stun on ${m[1]} for ${m[2]} turn(s)!`,
    ja: m => `⚡ [元素魔法: 感電] ${m[1]}に${m[2]}ターンの間元素感電気絶を追加付与！`
  },
  // 환영 반격 태세 전개
  {
    pattern: /⚔️💨\s*\[환영 반격 태세\]\s*(.+?)(?:이\(가\)|이|가)\s*(\d+)턴간 회피율\s*(\d+)%\s*상승 및 피격 시 즉시\s*(\d+)%\s*환영 반격 태세를 전개했습니다!/i,
    en: m => `⚔️💨 [Illusion Riposte] ${m[1]} gained +${m[3]}% EVA and entered ${m[4]}% counter stance for ${m[2]} turn(s)!`,
    ja: m => `⚔️💨 [幻影反撃態勢] ${m[1]}が${m[2]}ターン間回避率+${m[3]}%＆被弾時即座に${m[4]}%幻影反撃態勢を展開！`
  },
  // 환영 난무 왈츠
  {
    pattern: /🌪️⚔️\s*\[환영 난무 왈츠\]\s*(.+?)의\s*화려한 분신 검무가 적 전체를 난도질하고 공격력을\s*(\d+)턴간\s*(\d+)%\s*약화시켰습니다!/i,
    en: m => `🌪️⚔️ [Illusion Dance Waltz] ${m[1]}'s clones sliced through all enemies, reducing ATK by ${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `🌪️⚔️ [幻影乱舞ワルツ] ${m[1]}の分身剣舞が敵全体を切り刻み、攻撃力を${m[2]}ターンの間${m[3]}%弱体化！`
  },
  // 연막 회피 태세
  {
    pattern: /💨👤\s*\[연막 회피 태세\]\s*(.+?)(?:이\(가\)|이|가)\s*연막 속으로 몸을 숨겨\s*(\d+)턴간 회피율\s*(\d+)%\s*상승 상태에 들어갔습니다!/i,
    en: m => `💨👤 [Smokescreen Stance] ${m[1]} hid in smokescreen, gaining +${m[3]}% EVA for ${m[2]} turn(s)!`,
    ja: m => `💨👤 [煙幕回避態勢] ${m[1]}が煙幕に身を隠し、${m[2]}ターンの間回避率+${m[3]}%状態に突入！`
  },
  // 철갑 방진 돌파 방어 분쇄
  {
    pattern: /🛡️⚡\s*\[철갑 방진 돌파\]\s*적 전열의 방어력을\s*(\d+)턴간\s*(\d+)%\s*분쇄했습니다!/i,
    en: m => `🛡️⚡ [Iron Phalanx Breach] Shredded enemy frontline DEF by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🛡️⚡ [鉄甲方陣突破] 敵前列の防御力を${m[1]}ターンの間${m[2]}%粉砕！`
  },
  // 전술 드론 폭격 화상
  {
    pattern: /🛰️🔥\s*\[전술 드론 폭격\]\s*드론 폭격으로 적 전체에\s*(\d+)턴간 지속 화상을 부여했습니다!/i,
    en: m => `🛰️🔥 [Tactical Drone Strike] Drone barrage inflicted Burn on all enemies for ${m[1]} turn(s)!`,
    ja: m => `🛰️🔥 [戦術ドローン爆撃] ドローン爆撃により敵全体に${m[1]}ターンの継続火傷を付与！`
  },
  // 광맥 분출 방어 분쇄/화상
  {
    pattern: /🌋🔥\s*\[광맥 분출\]\s*고열 폭발로 대상의 방어력을\s*(\d+)%\s*분쇄하고\s*(\d+)턴간 화상을 부여했습니다!/i,
    en: m => `🌋🔥 [Ore Eruption] Thermal explosion shredded target's DEF by ${m[1]}% and inflicted Burn for ${m[2]} turn(s)!`,
    ja: m => `🌋🔥 [鉱脈噴出] 高熱爆発で対象の防御力を${m[1]}%粉砕し、${m[2]}ターンの間火傷を付与！`
  },
  // 시공간 차원 붕괴 행동력 저하
  {
    pattern: /⏳🌀\s*\[시공간 차원 붕괴\]\s*적 전체의 시간 축을 왜곡하여\s*(\d+)턴간 행동력을\s*(\d+)%\s*저하시켰습니다!/i,
    en: m => `⏳🌀 [Dimensional Collapse] Warped temporal axis, slowing all enemies' action by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `⏳🌀 [時空間次元崩壊] 敵全体の時間軸を歪め、${m[1]}ターンの間行動力を${m[2]}%低下させました！`
  },
  // 망각의 사슬 침묵/기절
  {
    pattern: /⛓️💫\s*\[망각의 사슬\]\s*적 전열 마물들에게\s*(\d+)턴간 사신의 침묵과 완전 기절을 부여했습니다!/i,
    en: m => `⛓️💫 [Chains of Oblivion] Inflicted Reaper's Silence and Stun on front row enemies for ${m[1]} turn(s)!`,
    ja: m => `⛓️💫 [忘却の鎖] 敵前列の魔物に${m[1]}ターンの間死神の沈黙と完全気絶を付与！`
  },
  // 만화경 환영 방어/회피 상승
  {
    pattern: /🪞✨\s*\[만화경 환영\]\s*수억 개의 거울 환영을 펼쳐 아군 전체 방어\/회피력을\s*(\d+)%\s*상승시켰습니다!/i,
    en: m => `🪞✨ [Kaleidoscope Illusion] Unfolded mirror clones, increasing squad DEF and EVA by ${m[1]}%!`,
    ja: m => `🪞✨ [万華鏡幻影] 幾億もの鏡の幻影を展開し、味方全体の防御・回避力を${m[1]}%上昇！`
  },
  // 아마게돈 종말 기절/공허 침식
  {
    pattern: /🪐💥\s*\[아마게돈 종말\]\s*적 전체\s*(\d+)턴 기절 및\s*(\d+)턴간 공허 침식\(공격력\/방어력\s*(\d+)%\s*대폭 감소\)을 부여했습니다!/i,
    en: m => `🪐💥 [Armageddon Doom] Stunned all enemies for ${m[1]} turn(s) and inflicted Void Erosion (ATK/DEF -${m[3]}%) for ${m[2]} turn(s)!`,
    ja: m => `🪐💥 [ハルマゲドン終末] 敵全体${m[1]}ターン気絶＆${m[2]}ターン虚無浸食（攻防 -${m[3]}%）を付与！`
  },
  // 그림자 은신 기본
  {
    pattern: /👥\s*\[그림자 은신\]\s*(.+?)(?:이\(가\)|이|가)\s*공격 직후 그림자 속으로 은신했습니다!/i,
    en: m => `👥 [Shadow Stealth] ${m[1]} vanished into the shadows immediately after attacking!`,
    ja: m => `👥 [影の潜伏] ${m[1]}が攻撃直後、影の中に身を潜めました！`
  },
  // 그림자 은신 위력 강화
  {
    pattern: /👥\s*\[그림자 은신\]\s*(.+?)(?:이\(가\)|이|가)\s*그림자 속으로 숨어들어 은신했습니다!\s*\(다음 공격 위력\s*\+(\d+)%\)/i,
    en: m => `👥 [Shadow Stealth] ${m[1]} melted into the shadows! (Next attack power +${m[2]}%)`,
    ja: m => `👥 [影の潜伏] ${m[1]}が影の中に隠れて潜伏しました！（次回攻撃威力 +${m[2]}%）`
  },
  // 만화경 환영검무 적 전체 공격력 약화
  {
    pattern: /🪞⚔️\s*\[만화경 환영검무\]\s*적 전체의 공격력을\s*(\d+)턴간\s*(\d+)%\s*약화시켰습니다!/i,
    en: m => `🪞⚔️ [Kaleidoscope Sword Dance] Weakened all enemies' ATK by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🪞⚔️ [万華鏡幻影剣舞] 敵全体の攻撃力を${m[1]}ターンの間${m[2]}%弱体化！`
  },
  // FEVER 상태이상 정화
  {
    pattern: /🕊️✨\s*\[(.+?)\]\s*파티 전원의 모든 해로운 상태이상을 완전히 정화했습니다!/i,
    en: m => `🕊️✨ [${m[1]}] Completely cleansed all debuffs and ailments from the entire party!`,
    ja: m => `🕊️✨ [${m[1]}] パーティ全員の有害な状態異常を完全に浄化しました！`
  },
  // FEVER 적 전체 그로기 기절
  {
    pattern: /💫👑\s*\[(.+?)\]\s*적 전체에게\s*(\d+)턴간 완전 그로기\(기절\)를 부여했습니다!/i,
    en: m => `💫👑 [${m[1]}] Inflicted Groggy (Stun) on all enemies for ${m[2]} turn(s)!`,
    ja: m => `💫👑 [${m[1]}] 敵全体に${m[2]}ターンの間完全グロッキー（気絶）を付与！`
  },
  // FEVER 명중력 증가
  {
    pattern: /🎯🌀\s*\[(.+?)\]\s*파티 전원의 명중력이\s*(\d+)턴간\s*\+(\d+)%\s*증가했습니다!/i,
    en: m => `🎯🌀 [${m[1]}] Increased party Accuracy by +${m[3]}% for ${m[2]} turn(s)!`,
    ja: m => `🎯🌀 [${m[1]}] パーティ全員の命中力が${m[2]}ターンの間 +${m[3]}% 増加！`
  },
  // 칠흑 성역 파티 공격력 상승
  {
    pattern: /🏰⚔️\s*\[칠흑 성역\]\s*파티 전원의 공격력이\s*(\d+)턴간\s*(\d+)%\s*상승했습니다!/i,
    en: m => `🏰⚔️ [Abyssal Sanctuary] Squad ATK increased by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🏰⚔️ [漆黒の聖域] 味方全員の攻撃力が${m[1]}ターンの間${m[2]}%上昇！`
  },
  // 신기루 검무 회피/반격
  {
    pattern: /⚡💨\s*\[신기루 검무\]\s*(\d+)턴간 회피율\s*(\d+)%\s*증폭 및 회피 성공 시마다\s*(\d+)%\s*환영 반격 태세를 전개했습니다!/i,
    en: m => `⚡💨 [Mirage Sword Dance] Gained +${m[2]}% EVA and ${m[3]}% counter on dodge for ${m[1]} turn(s)!`,
    ja: m => `⚡💨 [蜃気楼の剣舞] ${m[1]}ターン間回避率+${m[2]}%＆回避成功時に${m[3]}%幻影反撃を展開！`
  },
  // 성전 선포 봉헌 버프
  {
    pattern: /✝️🔥\s*\[성전 선포\]\s*자신의 체력\s*-\s*(\d+)\((\d+)%\)를 봉헌하여 아군을 강화합니다!/i,
    en: m => `✝️🔥 [Crusade Declaration] Sacrificed -${m[1]} (${m[2]}%) HP to empower allies!`,
    ja: m => `✝️🔥 [聖戦布告] 自身のHP -${m[1]} (${m[2]}%) を奉げて味方を強化！`
  },
  // 철혈의 패황 공격력 증폭
  {
    pattern: /🚩⚔️\s*\[철혈의 패황\]\s*파티 전체의 공격력을\s*(\d+)턴간\s*(\d+)%\s*증폭했습니다!/i,
    en: m => `🚩⚔️ [Iron Sovereign] Boosted entire party ATK by ${m[2]}% for ${m[1]} turn(s)!`,
    ja: m => `🚩⚔️ [鉄血の覇皇] 味方全体の攻撃力を${m[1]}ターンの間${m[2]}%増幅！`
  },
  // 스킬 시전 파티 전원 증폭 효과 부여
  {
    pattern: /⚡\s*(.+?)\s*\[(.+?)\]\s*→\s*파티 전원\s*\[(.*?)\]\s*증폭 효과 부여!/i,
    en: m => `⚡ ${m[1]} [${m[2]}] → Granted [${m[3]}] buff to all allies!`,
    ja: m => `⚡ ${m[1]} [${m[2]}] → 味方全員に[${m[3]}]増幅効果を付与！`
  },
  // 스킬 시전 개별 증폭 효과 부여
  {
    pattern: /⚡\s*(.+?)\s*\[(.+?)\]\s*→\s*(.+?)에게\s*\[(.*?)\]\s*증폭 효과 부여/i,
    en: m => `⚡ ${m[1]} [${m[2]}] → Granted [${m[4]}] buff to ${m[3]}`,
    ja: m => `⚡ ${m[1]} [${m[2]}] → ${m[3]}に[${m[4]}]増幅効果を付与`
  },
  // FEVER 위력 증폭
  {
    pattern: /🔥⚡\s*\[FEVER 위력 증폭\]\s*【(.+?)】\s*시너지로 지원\/치유\/버프 효과가\s*\+(\d+)%\s*대폭 강화되었습니다!/i,
    en: m => `🔥⚡ [FEVER Power Boost] 【${m[1]}】 synergy enhanced support/heal/buffs by +${m[2]}%!`,
    ja: m => `🔥⚡ [FEVER威力増幅] 【${m[1]}】シナジーで支援/回復/バフ効果が +${m[2]}% 大幅強化！`
  },
  // 치명적 본능 발동 알림
  {
    pattern: /⚡🗡️\s*\[치명적 본능\]\s*(.+?)\(암살자\)의 치명타 적중으로 그림자 추가 연격이 발동했습니다!\s*\(발동 확률:\s*(\d+)%.*?\)/i,
    en: m => `⚡🗡️ [Lethal Instinct] ${m[1]}'s CRIT hit triggered shadow follow-up! (${m[2]}% chance)`,
    ja: m => `⚡🗡️ [致命的本能] ${m[1]}（暗殺者）の会心命中により影追撃が発動！（発動確率: ${m[2]}%）`
  },
  // 치명적 본능 회피
  {
    pattern: /💨\s*\[회피\s*\/\s*EVADE\]\s*(.+?)(?:이\(가\)|\s+이|\s+가|이|가)\s+(.+?)의\s*\[치명적 본능\]\s*추가 연격을 회피했습니다!/i,
    en: m => `💨 [EVADE] ${m[1]} evaded ${m[2]}'s [Lethal Instinct] follow-up strike!`,
    ja: m => `💨 [回避 / EVADE] ${m[1]}が${m[2]}の[致命적본능]追加追撃を回避しました！`.replace('致命적본능', '致命的本能')
  },
  // 치명적 본능 피해 직격
  {
    pattern: /▶\s*⚡🗡️\s*\[치명적 본능\]\s*(.+?)의\s*그림자 추가 연격(.*?)\s*→\s*(.+?)에게\s*(\d+)\s*치명 피해!(.*)/i,
    en: m => `▶ ⚡🗡️ [Lethal Instinct] ${m[1]}'s shadow follow-up${m[2]} → dealt ${m[4]} CRIT DMG to ${m[3]}!${m[5]}`,
    ja: m => `▶ ⚡🗡️ [致命的本能] ${m[1]}の影追撃${m[2]} → ${m[3]}に${m[4]}の会心ダメージ！${m[5]}`
  },
  // 환영 굴절 완전 투영 회피
  {
    pattern: /🪞\s*\[(.+?)\]\s*환영 굴절 발동!\s*(.+?)(?:이\(가\)|이|가)\s*적의 공격을 완전히 투영 회피했습니다!/i,
    en: m => `🪞 [${m[1]}] Mirage Refraction! ${m[2]} completely projected and evaded enemy attacks!`,
    ja: m => `🪞 [${m[1]}] 幻影屈折発動！${m[2]}が敵の攻撃を完全に投影回避しました！`
  },
  // 차징 파쇄 그로기
  {
    pattern: /💥⚡\s*\[차징 파쇄\]\s*(.+?)의\s*맹공으로\s*(.+?)의\s*차징이 분쇄되었습니다!\s*\((\d+)턴간 받는 피해\s*\+(\d+)%\s*그로기 돌입\)/i,
    en: m => `💥⚡ [Charge Shattered] ${m[1]}'s onslaught shattered ${m[2]}'s charge! (${m[3]} turn(s) Groggy, +${m[4]}% damage taken)`,
    ja: m => `💥⚡ [チャージ粉砕] ${m[1]}の猛攻で${m[2]}のチャージが粉砕されました！（${m[3]}ターン被ダメージ+${m[4]}%グロッキー突入）`
  },
  // 차징 저지 중 잔여 브레이크
  {
    pattern: /⚠️\s*\[차징 저지 중\]\s*(.+?)\s*남은 브레이크 요구치:\s*(\d+)\s*\/\s*(\d+)/i,
    en: m => `⚠️ [Interrupting Charge] ${m[1]} Remaining Break Gauge: ${m[2]} / ${m[3]}`,
    ja: m => `⚠️ [チャージ阻止中] ${m[1]} 残りブレイクゲージ: ${m[2]} / ${m[3]}`
  },
  // 그로기 상태 회복
  {
    pattern: /💫\s*(.+?)(?:이\(가\)|이|가)\s*그로기 상태에서 회복했습니다\./i,
    en: m => `💫 ${m[1]} recovered from groggy state.`,
    ja: m => `💫 ${m[1]}がグロッキー状態から回復しました。`
  },
  // 차징 취소 붕괴
  {
    pattern: /💥\s*\[차징 취소\]\s*결빙\/기절로 인해\s*(.+?)의\s*차징이 붕괴되었습니다!/i,
    en: m => `💥 [Charge Cancelled] Due to Freeze/Stun, ${m[1]}'s charge collapsed!`,
    ja: m => `💥 [チャージ中断] 凍結/気絶により${m[1]}のチャージが中断されました！`
  },
  // 차징 완료 방출
  {
    pattern: /💥⚠️\s*\[차징 완료!\]\s*(.+?)(?:이\(가\)|이|가)\s*응축된 힘을 폭발시키며\s*\[(.+?)\](?:을\(를\)|을|를)\s*방출합니다!\s*\(확정 치명타 & 방어 관통\s*(\d+)%\)/i,
    en: m => `💥⚠️ [Charge Complete!] ${m[1]} unleashed condensed power with [${m[2]}]! (Guaranteed CRIT & ${m[3]}% DEF Pierce)`,
    ja: m => `💥⚠️ [チャージ完了!] ${m[1]}が凝縮された力を爆発させ[${m[2]}]を放ちます！（確定会心＆防御貫通${m[3]}%）`
  },
  // 차징 위기 경고
  {
    pattern: /⚠️\s*\[위기 경고\]\s*(.+?)(?:이\(가\)|이|가)\s*강력한 일격\s*\[(.+?)\]\s*시전을 위해 힘을 모으기 시작합니다!\s*\(브레이크 저지 요구치:\s*(\d+)\s*피해 또는 기절\/빙결\)/i,
    en: m => `⚠️ [Threat Alert] ${m[1]} is channeling for [${m[2]}]! (Break requirement: ${m[3]} DMG or Stun/Freeze)`,
    ja: m => `⚠️ [危機警告] ${m[1]}が強力な一撃[${m[2]}]詠唱のため力を溜め始めました！（阻止条件: ${m[3]}ダメージまたは気絶/凍結）`
  },
  // 시전 요격 추가타
  {
    pattern: /▶\s*💨🎯\s*\[시전 요격 추가타!\]\s*(.+?):\s*"차징을 끊어라! 선제 사격!"\s*(.+?)에게\s*(\d+)\s*요격 피해 및 브레이크 요구치\s*-(\d+)\s*선제 파쇄!/i,
    en: m => `▶ 💨🎯 [Intercept Shot!] ${m[1]}: "Break the charge!" Dealt ${m[3]} intercept DMG to ${m[2]} & reduced break gauge by -${m[4]}!`,
    ja: m => `▶ 💨🎯 [詠唱迎撃追撃!] ${m[1]}:「チャージを止めろ！先制射撃！」${m[2]}に${m[3]}迎撃ダメージ＆ブレイク要求値 -${m[4]} 先制粉砕！`
  },
  // 피격 화상 지속턴
  {
    pattern: /🔥\s*\[화상\]\s*(.+?)에게\s*(\d+)턴간 화상이 부여되었습니다!\s*\(매 턴\s*(\d+)%\s*피해,\s*방어력\s*(\d+)%\s*분쇄\)/i,
    en: m => `🔥 [Burn] Inflicted Burn on ${m[1]} for ${m[2]} turn(s)! (${m[3]}% DoT, DEF -${m[4]}%)`,
    ja: m => `🔥 [火傷] ${m[1]}に${m[2]}ターンの間火傷を付与！（毎ターン${m[3]}%ダメージ、防御力${m[4]}%粉砕）`
  },
  // 피격 출혈 지속턴
  {
    pattern: /🩸\s*\[출혈\]\s*(.+?)에게\s*(\d+)턴간 출혈이 발생했습니다!\s*\(매 턴\s*(\d+)%\s*지속 피해,\s*공격력\s*-(\d+)%\)/i,
    en: m => `🩸 [Bleed] Inflicted Bleed on ${m[1]} for ${m[2]} turn(s)! (${m[3]}% DoT, ATK -${m[4]}%)`,
    ja: m => `🩸 [出血] ${m[1]}に${m[2]}ターンの間出血が発生！（毎ターン${m[3]}%継続ダメージ、攻撃力-${m[4]}%）`
  },
  // 피격 냉각 동결
  {
    pattern: /❄️\s*\[냉각 동결\]\s*(.+?)에게 빙결\/냉각이 부여되었습니다!\s*\((\d+)턴 행동불가,\s*지속 중 외피 동결 방어력\s*\+(\d+)%\)/i,
    en: m => `❄️ [Freeze/Frost] Inflicted Freeze on ${m[1]}! (${m[2]} turn(s) immobilized, frozen rind DEF +${m[3]}%)`,
    ja: m => `❄️ [冷却凍結] ${m[1]}に凍結/冷却が付与されました！（${m[2]}ターン行動不能、外皮凍結防御力+${m[3]}%）`
  },
  // 피격 화상 턴 미표기
  {
    pattern: /🔥\s*\[화상\]\s*(.+?)에게 화상이 부여되었습니다!\s*\(매 턴\s*(\d+)%\s*피해,\s*방어력\s*(\d+)%\s*분쇄\)/i,
    en: m => `🔥 [Burn] Inflicted Burn on ${m[1]}! (${m[2]}% DoT per turn, DEF -${m[3]}%)`,
    ja: m => `🔥 [火傷] ${m[1]}に火傷が付与されました！（毎ターン${m[2]}%ダメージ、防御力${m[3]}%粉砕）`
  },
  // 피격 맹독
  {
    pattern: /☠️\s*\[맹독\]\s*(.+?)에게 맹독이 중독되었습니다!\s*\(매 턴\s*(\d+)%\s*치명적 독 피해\)/i,
    en: m => `☠️ [Poison] Poisoned ${m[1]}! (${m[2]}% lethal poison DoT per turn)`,
    ja: m => `☠️ [猛毒] ${m[1]}が猛毒に侵されました！（毎ターン${m[2]}%致命的毒ダメージ）`
  },
  // 피격 출혈 턴 미표기
  {
    pattern: /🩸\s*\[출혈\]\s*(.+?)에게 출혈이 발생했습니다!\s*\(매 턴\s*(\d+)%\s*지속 피해,\s*공격력\s*-(\d+)%\)/i,
    en: m => `🩸 [Bleed] Inflicted Bleed on ${m[1]}! (${m[2]}% DoT per turn, ATK -${m[3]}%)`,
    ja: m => `🩸 [出血] ${m[1]}に出血が発生！（毎ターン${m[2]}%継続ダメージ、攻撃力-${m[3]}%）`
  },
  // 피격 방어력 약화 퍼센트
  {
    pattern: /🛡️⬇️\s*\[방어력 약화\]\s*(.+?)의\s*방어력이\s*(\d+)%\s*감소했습니다!/i,
    en: m => `🛡️⬇️ [DEF Weakened] ${m[1]}'s DEF decreased by ${m[2]}%!`,
    ja: m => `🛡️⬇️ [防御力弱化] ${m[1]}の防御力が${m[2]}%減少しました！`
  },
  // 피격 공격력 약화 퍼센트
  {
    pattern: /⚔️⬇️\s*\[공격력 약화\]\s*(.+?)의\s*공격력이\s*(\d+)%\s*감소했습니다!/i,
    en: m => `⚔️⬇️ [ATK Weakened] ${m[1]}'s ATK decreased by ${m[2]}%!`,
    ja: m => `⚔️⬇️ [攻撃力弱化] ${m[1]}の攻撃力が${m[2]}%減少しました！`
  },
  // 피격 실명 급감
  {
    pattern: /👁️❌\s*\[실명\]\s*(.+?)의\s*시야가 가려져 명중률이\s*(\d+)%\s*급감했습니다!/i,
    en: m => `👁️❌ [Blinded] ${m[1]}'s vision obscured; Accuracy dropped sharply by ${m[2]}%!`,
    ja: m => `👁️❌ [暗闇] ${m[1]}の視界が遮られ命中率が${m[2]}%急減しました！`
  },
  // 피격 기절 행동 불가
  {
    pattern: /💫\s*\[기절\]\s*(.+?)(?:이\(가\)|이|가)\s*충격으로 기절했습니다!\s*\((\d+)턴 행동 불가\)/i,
    en: m => `💫 [Stun] ${m[1]} was stunned by the shock! (${m[2]} turn(s) immobilized)`,
    ja: m => `💫 [気絶] ${m[1]}が衝撃で気絶しました！（${m[2]}ターン行動不能）`
  },
  // 진형 붕괴 위치 이동
  {
    pattern: /🌀\s*\[진형 붕괴\]\s*(.+?)(?:이\(가\)|\s+이|\s+가|이|가)\s+(.+?)되어\s*\[(.+?)\]로 이동했습니다!/i,
    en: m => `🌀 [Formation Disrupted] ${m[1]} was ${m[2]} and moved to [${m[3]}]!`,
    ja: m => `🌀 [陣形崩壊] ${m[1]}が${m[2]}され[${m[3]}]へ移動しました！`
  },
  // 진형 시너지 활성화
  {
    pattern: /⚡\s*\[진형 시너지 변경\]\s*진형 변동으로\s*\[(.+?)\]\s*\((.+?)\)\s*시너지가 즉시 활성화되었습니다!\s*\((.*?)\)/i,
    en: m => `⚡ [Formation Shift] Formation altered: [${m[1]}] (${m[2]}) activated! (${m[3]})`,
    ja: m => `⚡ [陣形シナジー変更] 陣形変動により[${m[1]}] (${m[2]}) シナジーが即時発動！（${m[3]}）`
  },
  // 진형 시너지 해제
  {
    pattern: /⚠️\s*\[진형 시너지 해제\]\s*진형이 무너져\s*\[(.+?)\]\s*시너지가 해제되었습니다!/i,
    en: m => `⚠️ [Synergy Lost] Formation broken: [${m[1]}] synergy dissolved!`,
    ja: m => `⚠️ [陣形シナジー解除] 陣形が崩れ[${m[1]}]シナジーが解除されました！`
  },
  // 계열 부조화 위력/효율 반감
  {
    pattern: /⚠️\s*\[계열 부조화\]\s*(.+?)의\s*클래스와 맞지 않는\s*\[(.+?)\]\s*스킬로 인해\s*(?:지원\/치유 효율이|위력이)\s*50%\s*반감됩니다!/i,
    en: m => `⚠️ [Affinity Mismatch] [${m[2]}] does not match ${m[1]}'s class; effectiveness reduced by 50%!`,
    ja: m => `⚠️ [系統不調和] ${m[1]}のクラスと一致しない[${m[2]}]スキルのため効果が50%半減します！`
  },
  // 스킬 시전 일반 리포트
  {
    pattern: /✨\s*(.+?)\s*\[(.+?)\]\s*→\s*(.+)/i,
    en: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`,
    ja: m => `✨ ${m[1]} [${m[2]}] → ${m[3]}`
  },

  // ⚔️ 일반 타격 / 데미지 로그 기본 패턴 지원: A이(가) B에게 X 피해를 입혔습니다!
  {
    pattern: /(.+?)(?:이\(가\)|이|가)\s*(.+?)에게\s*(\d+)\s*(?:치명 )?피해를 입혔습니다!(.*)/i,
    en: m => `${m[1]} dealt ${m[3]} damage to ${m[2]}!${m[4]}`,
    ja: m => `${m[1]}が${m[2]}に${m[3]}のダメージを与えました！${m[4]}`
  },
];
