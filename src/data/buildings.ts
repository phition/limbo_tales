import { BuildingState, BuildingId, GameResources } from '../types/game';

export const BUILDING_BASE_COSTS: Record<BuildingId, Partial<GameResources>> = {
  bonfire: { wood: 10 },
  butchery: { wood: 10, stone: 5 },
  cabin: { wood: 30, stone: 10 },
  lumberCamp: { wood: 50, gold: 100 },
  quarry: { wood: 40, stone: 30, gold: 150 },
  tavern: { wood: 80, stone: 50, gold: 300 },
  blacksmith: { wood: 100, stone: 80, iron: 25, gold: 500 },
  sanctuary: { stone: 120, iron: 50, ether: 30, gold: 1000 },
  alchemy: { stone: 80, ether: 40, gold: 600 },
  arenaGate: { stone: 150, iron: 80, ether: 50, gold: 1500 },
  storage: { wood: 100, stone: 50, gold: 200 },
  infirmary: { wood: 120, herb: 20, ether: 10 },
  market: { wood: 150, stone: 150, gold: 500 }
};

export const INITIAL_BUILDINGS: Record<BuildingId, BuildingState> = {
  'bonfire': {
    id: 'bonfire',
    name: '방주의 성화',
    level: 1,
    unlocked: true,
    description: '신성한 성화. 목재를 공헌하여 생산량 +15%, 전투 EXP +20%, 영지 용병 지속 재생 온기 버프를 활성화합니다.',
    icon: '🔥',
    promptKey: 'citadel_bonfire',
    themeColor: 0xff6d00
  },
  'cabin': {
    id: 'cabin',
    name: '생존자 안식처',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_CABIN',
    description: '구출된 생존자 거주지. 방주에 세금(골드)을 13초마다 정기 납부합니다.',
    icon: '🏕️',
    promptKey: 'citadel_cabin',
    themeColor: 0x8d6e63
  },
  'lumberCamp': {
    id: 'lumberCamp',
    name: '영목 벌채소',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_LUMBER',
    description: '방주 외곽 목재 벌채 시설. 영지 증축과 성화 유지에 필요한 목재를 9초마다 생산합니다.',
    icon: '🌲',
    promptKey: 'citadel_cabin',
    themeColor: 0x43a047
  },
  'quarry': {
    id: 'quarry',
    name: '에테르 광맥 시추소',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_QUARRY',
    description: '부유성 지반 채굴 시설. 11초마다 석재를 생산하며 점차 철광석도 함께 발굴합니다.',
    icon: '⛏️',
    promptKey: 'citadel_cabin',
    themeColor: 0x039be5
  },
  'butchery': {
    id: 'butchery',
    name: '심연 생체 정제소',
    level: 0,
    unlocked: true,
    description: '식량 정제 시설. 13초마다 보급 식량을 생산하고 무두질 가죽을 가공합니다.',
    icon: '⚗️',
    promptKey: 'citadel_cabin',
    themeColor: 0xe91e63
  },
  'tavern': {
    id: 'tavern',
    name: '방랑자의 라운지',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_MAIN_02',
    description: '용병 고용소. 방랑 용병을 계약 영입하고 서브 퀘스트를 수주하며 식량을 조달합니다.',
    icon: '🍺',
    promptKey: 'citadel_tavern',
    themeColor: 0xffb300
  },
  'blacksmith': {
    id: 'blacksmith',
    name: '심연의 병기창',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_FORGE',
    description: '장비 공방. 전술 무기 및 방어구 단조, 장비 강화 및 인챈트를 수행합니다.',
    icon: '⚒️',
    promptKey: 'citadel_blacksmith',
    themeColor: 0x00e5ff
  },
  'sanctuary': {
    id: 'sanctuary',
    name: '영혼의 제단',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_SLAY_BOSS_01',
    description: '클래스 승격 시설. 용병들의 상위 클래스 전직과 초월 각성을 집전합니다.',
    icon: '✨',
    promptKey: 'citadel_sanctuary',
    themeColor: 0xba68c8
  },
  'alchemy': {
    id: 'alchemy',
    name: '에테르 연금 공방',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_ALCHEMY',
    description: '에테르 연금 및 마도 시설. 15초마다 에테르를 정기 생산하고 마도서를 제본합니다.',
    icon: '🧪',
    promptKey: 'citadel_blacksmith',
    themeColor: 0x26a69a
  },
  'arenaGate': {
    id: 'arenaGate',
    name: '차원 앵커 게이트',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_ARENA',
    description: '차원 관문. 비동기 랭킹 결투, 네메시스 레이드 및 차원 영지 침공을 지원합니다.',
    icon: '🌀',
    promptKey: 'citadel_arena',
    themeColor: 0x7c4dff
  },
  'storage': {
    id: 'storage',
    name: '방주 중앙 병참고',
    level: 1,
    unlocked: true,
    description: '방주 중앙 물자 저장고. 레벨에 따라 27종 모든 자원의 최대 적재 용량을 확장합니다.',
    icon: '🏛️',
    promptKey: 'citadel_cabin',
    themeColor: 0xb0bec5
  },
  'infirmary': {
    id: 'infirmary',
    name: '생체 복원 병동',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_INFIRMARY',
    description: '의료 시설. 부상당한 용병을 입원시켜 체력과 마나를 복원합니다.',
    icon: '🏥',
    promptKey: 'citadel_cabin',
    themeColor: 0x4caf50
  },
  'market': {
    id: 'market',
    name: '황혼의 블랙 마켓',
    level: 0,
    unlocked: false,
    requiredQuestId: 'Q_BUILD_MARKET',
    description: '암시장 교역소. 15종 자원 거래 및 환전을 지원하며 상업 골드를 수급합니다.',
    icon: '⚖️',
    promptKey: 'citadel_tavern',
    themeColor: 0xffd54f
  }
};

export interface BuildingPrereqRule {
  prereqId: BuildingId;
  prereqName: string;
  calcReqLevel: (targetLevel: number) => number;
  reason: string;
}

/** 초반 퀘스트 해금 순서와 1:1 일치하는 기본 테크트리 체인 (최초 Lv.1 건설 시에만 선행 시설 필요) */
export const BUILDING_TECH_TREE: Partial<Record<BuildingId, BuildingPrereqRule>> = {
  cabin: {
    prereqId: 'butchery',
    prereqName: '심연 생체 정제소',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '생존자들이 굶주리지 않고 거주할 수 있도록 심연 생체 정제소(Lv.1 이상)의 식량 배급망이 선행되어야 합니다.'
  },
  lumberCamp: {
    prereqId: 'cabin',
    prereqName: '생존자 안식처',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '벌채 작업을 담당할 생존자 거주 시설(Lv.1 이상)이 선행되어야 합니다.'
  },
  quarry: {
    prereqId: 'lumberCamp',
    prereqName: '영목 벌채소',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '지하 갱도를 지탱할 영목 벌채소(Lv.1 이상) 기반이 필요합니다.'
  },
  storage: {
    prereqId: 'quarry',
    prereqName: '에테르 광맥 시추소',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '대용량 군수 물자를 적재할 석재 지반 기반 시설(Lv.1 이상)이 필요합니다.'
  },
  tavern: {
    prereqId: 'quarry',
    prereqName: '에테르 광맥 시추소',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '방랑 모험가들을 맞이할 석재 토대와 시추 기반 시설(Lv.1 이상)이 갖춰져야 합니다.'
  },
  blacksmith: {
    prereqId: 'tavern',
    prereqName: '방랑자의 라운지',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '모험가와 용병들의 수요가 발생하는 방랑자의 라운지(Lv.1 이상)가 선행되어야 합니다.'
  },
  alchemy: {
    prereqId: 'blacksmith',
    prereqName: '심연의 병기창',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '에테르 정제 도구와 도가니를 제작할 심연의 병기창(Lv.1 이상)이 필요합니다.'
  },
  infirmary: {
    prereqId: 'tavern',
    prereqName: '방랑자의 라운지',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '전투에 나서는 용병들을 수용하고 부상자를 즉시 치료하기 위해 방랑자의 라운지(Lv.1 이상)가 선행되어야 합니다.'
  },
  market: {
    prereqId: 'alchemy',
    prereqName: '에테르 연금 공방',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '에테르 연금 시약과 가공 물자가 원활히 유통되어야 암시장이 형성됩니다.'
  },
  sanctuary: {
    prereqId: 'infirmary',
    prereqName: '생체 복원 병동',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '영혼의 한계를 돌파하고 승격 의식을 치르기 위해 용병들의 육체를 완치할 생체 복원 병동(Lv.1 이상)이 선행되어야 합니다.'
  },
  arenaGate: {
    prereqId: 'sanctuary',
    prereqName: '영혼의 제단',
    calcReqLevel: (targetLv: number) => (targetLv === 1 ? 1 : 0),
    reason: '차원 너머와 공명할 영혼의 제단(Lv.1 이상) 파동 증폭이 선행되어야 합니다.'
  }
};

/** 🏛️ 중반 및 후반 세 번에 걸쳐 적용되는 핵심 인프라 마일스톤 관문 */
export interface BuildingMilestoneTier {
  phase: number;
  name: string;
  minLevel: number;        // 이 단계에 도달하기 위한 최소 증축 레벨 (4, 7, 9)
  reqBuildingId: BuildingId;
  reqBuildingName: string;
  reqLevel: number;        // 요구하는 해당 핵심 시설의 레벨
  reason: string;
}

export const BUILDING_MILESTONE_TIERS: BuildingMilestoneTier[] = [
  {
    phase: 1,
    name: '중반 1차: 물류 확장 인프라',
    minLevel: 4,
    reqBuildingId: 'storage',
    reqBuildingName: '방주 중앙 병참고',
    reqLevel: 3,
    reason: '4레벨 이상 중반 설비 증축을 수용하기 위해선 방주 중앙 병참고(Lv.3 이상)의 물류 적재 용량이 선행되어야 합니다.'
  },
  {
    phase: 2,
    name: '중반 2차: 마도 공학 인프라',
    minLevel: 7,
    reqBuildingId: 'alchemy',
    reqBuildingName: '에테르 연금 공방',
    reqLevel: 5,
    reason: '7레벨 이상 고급 설비에 주입할 고밀도 에테르 촉매 공급을 위해 에테르 연금 공방(Lv.5 이상)이 선행되어야 합니다.'
  },
  {
    phase: 3,
    name: '후반 3차: 영혼 결계 인프라',
    minLevel: 9,
    reqBuildingId: 'sanctuary',
    reqBuildingName: '영혼의 제단',
    reqLevel: 6,
    reason: '9레벨 이상 심층부 심연 침식을 원천 차단하고 영구 결계를 유지하기 위해 영혼의 제단(Lv.6 이상)이 선행되어야 합니다.'
  }
];

/**
 * ⏳ 건물 건설 및 증축 소요 시간 (초 단위)
 * - 상위 레벨로 갈수록 점진적으로 시간이 증가하되, 최고 단계(10레벨)도 60초(1분)로 쾌적하게 유지
 */
export const getBuildingConstructionDurationSec = (targetLevel: number): number => {
  const durations: Record<number, number> = {
    1: 3,
    2: 5,
    3: 8,
    4: 12,
    5: 16,
    6: 22,
    7: 28,
    8: 36,
    9: 45,
    10: 60,
  };
  return durations[targetLevel] || Math.min(60, Math.max(3, targetLevel * 6));
};

/**
 * 📜 13대 영지 시설 백과사전 비사(뒷이야기/사설) 및 전략 운영 팁
 */
export const BUILDING_LORE_AND_TIPS: Record<BuildingId, { lore: string; strategy: string }> = {
  bonfire: {
    lore: '끝없는 심연의 칠흑 속에서 방주를 지탱해 온 태초의 불씨입니다. 과거 방주가 건조되던 날, 초대 고위 사제들이 빛의 정수를 모아 봉인해 둔 신성한 에테르 핵으로, 방주의 거주민들은 이 성화 주변에 모여 절망과 광기를 견뎌냈습니다. 심연 깊은 곳으로 진입할수록 마기가 거세져 불꽃이 약해지며, 성화가 꺼지면 방주 전체가 동결과 암흑에 삼켜진다고 전해집니다.',
    strategy: '목재를 주기적으로 봉헌하여 [방주의 성화] 버프를 유지해야 영지 생산량 +15%, 전투 EXP +20%, 영지 내 용병 체력 지속 재생 효과가 활성화됩니다. 영목 벌채소와 수급 연계를 이루어 성화가 꺼지지 않도록 관리하는 것이 탐험 원정대 육성의 기본 바탕입니다.'
  },
  cabin: {
    lore: '심연의 어둠 속에서 구조된 생존자들과 방랑 피난민들이 모여 형성한 판자촌 거주 구역입니다. 본래 방주의 비상 화물 적재 구역이었으나, 갈 곳 잃은 이들이 널빤지와 천막을 덧대어 작은 정착지를 일구었습니다. 밤마다 고향의 민요를 부르며 서로의 상처를 보듬고, 방주 지휘관의 영도력에 깊은 감사를 표하고 있습니다.',
    strategy: '안식처의 생존자들은 방주의 수호에 보답하여 13초마다 정기적으로 세금(골드)을 납부합니다. 증축할수록 인구 수용량과 세수 규모가 비약적으로 증가하여, 상위 던전 진입 시 심각해지는 골드 부족을 해결해 주는 가장 안정적인 패시브 재정 원천입니다.'
  },
  lumberCamp: {
    lore: '방주 외곽 부유 지반에 뿌리내린 고대 "에테르 영목"을 벌채하는 거친 인부들의 작업장입니다. 심연의 농축된 마력을 빨아먹고 자란 이 목재는 일반 목재와 달리 강철에 필적하는 경도와 불길을 오래 품는 특성을 지녔습니다. 거목의 나이테 사이에서는 종종 미지의 심연 수액이 흘러나와 목수들의 감탄을 자아냅니다.',
    strategy: '성화 유지 연료와 영지 시설 증축 공사의 핵심 뼈대로 사용되는 목재를 9초마다 대량 생산합니다. 중반부 4~6레벨 시설 증축 시 막대한 목재가 일시에 소모되므로, 초반에 벌채소를 미리 3~4레벨 이상으로 증축해 두어야 자원 병목을 방지할 수 있습니다.'
  },
  quarry: {
    lore: '부유성 지반 하부의 단단한 암반층을 수직 관통하여 마력 광맥을 채굴하는 거대한 기계 시추소입니다. 방주가 처음 심연에 정박했을 때 버려져 있던 고대 문명의 시추 설비를 공학자들이 수리하여 재가동했습니다. 드릴이 깊숙한 암반을 타격할 때마다 청백색 에테르 불꽃과 함께 진귀한 광석 파편이 쏟아져 나옵니다.',
    strategy: '11초마다 기본 석재를 생산하며, 시설 레벨이 올라갈수록 장비 단조에 필수적인 [철광석]이 복합 발굴됩니다. 7레벨 이상 병기창의 고급 무구 단조와 성벽 방진 강화를 위해 반드시 시추소 증축을 병행해야 합니다.'
  },
  butchery: {
    lore: '탐험 원정대가 던전에서 사냥해 온 심연 마물의 사체와 가죽을 분해·정제하는 다소 기괴하지만 방주의 생존에 필수불가결한 시설입니다. 마물의 근육과 내장은 본래 치명적인 오염물질이지만, 특수 에테르 가마솥에서 고열 중화 처리를 거치면 영양가 풍부한 보급 식량과 방어구용 무두질 가죽으로 환골탈태합니다.',
    strategy: '13초마다 탐험용 보급 식량을 생산하고 가죽을 부산물로 획득합니다. 던전에서 굶주림(Hunger)으로 인한 파티 전멸을 방지하고 상위 시설 유지비를 충당하기 위해 필수적이므로, 탐험 층수가 깊어질수록 최우선으로 생산량을 확보해야 합니다.'
  },
  tavern: {
    lore: '심연의 차가운 돌풍을 피해 모여든 주정뱅이, 탈영병, 전설적인 은퇴 용병들이 뒤섞인 왁자지껄한 주점입니다. 텁텁하지만 향긋한 에일 맥주 한 잔에 방주의 온갖 소문과 던전 깊은 곳의 숨겨진 보물 위치가 오가며, 지휘관의 부름을 기다리는 일류 용병들이 저마다의 사연을 품고 잔을 기울입니다.',
    strategy: '라운지 레벨이 오를수록 고용소에 희귀/영웅 등급의 상위 용병이 등장할 확률이 상승하며, 영지 주민들의 서브 의뢰(퀘스트) 게시판이 확장됩니다. 파티의 부족한 포지션(탱커/딜러/힐러)을 보강하고 영지 퀘스트 보상을 수급하는 핵심 전략 거점입니다.'
  },
  blacksmith: {
    lore: '새빨간 용암열과 모루를 내려치는 망치 소리가 쉼 없이 진동하는 방주의 무기고입니다. 대장장이들은 심연의 마기에 찌든 저주받은 쇳덩이를 정화하고 고대 룬을 새겨 넣어 전설적인 무구를 벼려냅니다. 심연의 광기와 맹독 속에서 용병들의 목숨을 지켜주는 것은 신의 기도가 아닌 견고한 갑옷과 날카로운 칼날뿐이라는 것이 이곳 장인들의 자부심입니다.',
    strategy: '병기창 레벨이 곧 단조 가능한 장비의 티어(1~10티어)를 결정합니다. Lv.3에서 장비 강화 한계 돌파(+7강 이상), Lv.6에서 에테르 횃불 등 7종 강화 보급품 전면 해금, Lv.10에서 전설 신화 장비 단조 및 3단계 장비 각성이 열리므로, 최우선적으로 증축해야 하는 1순위 핵심 시설입니다.'
  },
  sanctuary: {
    lore: '은빛 성광과 조상신들의 잔류 사념이 깃든 신성한 제단입니다. 침묵을 지키는 고위 사제들이 고대 방주의 신성 기도문을 집전하며 용병들의 영혼 속에 잠든 잠재력의 벽을 깨뜨립니다. 심연의 타락과 공허의 침식에 영혼이 침식되지 않도록 방주 전체를 영적으로 결속하는 거룩한 성역입니다.',
    strategy: '용병의 1차 승격, 2차 각성, 그리고 3차 초월(Tier 3) 전직을 집전하는 성소입니다. 제단 증축에 따라 상위 전직 의식과 에픽 시나리오 퀘스트가 순차적으로 개방되며, Lv.6 이상 제단은 후반부 9~10레벨 시설 증축의 선행 마일스톤 조건으로 요구됩니다.'
  },
  alchemy: {
    lore: '복잡한 유리 플라스크와 자수정 도가니에서 푸른빛 에테르 증기가 끊임없이 피어오르는 연금술사들의 마도 연구소입니다. 방주 최고의 현자들이 모여 고대 비전서의 결손된 페이지를 복원하고 물질의 원소 전이를 실험합니다. 연구소 구석에서는 실패한 마나 폭발의 그을음 자국이 지워질 날이 없습니다.',
    strategy: '15초마다 귀중한 마도 자원인 에테르를 정기 생산하며, 용병들에게 강력한 액티브 전술 스킬을 장착시키는 [마도서 제본]을 담당합니다. 7레벨 이상 고급 설비 증축의 선행 인프라로 요구되므로 중반 이후 집중적인 투자가 필요합니다.'
  },
  arenaGate: {
    lore: '차원 경계면의 왜곡된 균열을 안정화하여 다른 평행 세계의 방주들과 시공간으로 연결한 거대한 아치형 관문입니다. 지휘관들은 이 문을 통해 다른 세계의 방주 원정대와 무예를 겨루거나, 전 우주를 파멸로 몰고 가는 시공의 포식자 "네메시스"를 요격하기 위해 결사대를 파견합니다.',
    strategy: 'Lv.1에서 비동기 3v3 차원 결투장(아레나), Lv.3에서 전 서버급 보스 [네메시스 월드 레이드], Lv.6에서 5인 부대 [차원 영지 침공 및 전술 타워 방어전]이 순차 개방됩니다. 최고 등급 훈장과 명예 칭호, 대량의 에테르를 획득할 수 있는 엔드게임 멀티 컨텐츠 관문입니다.'
  },
  storage: {
    lore: '두꺼운 강철 격벽과 고대 방어 마법 룬으로 밀폐된 방주의 거대 지하 물류 창고입니다. 수백 년간 심연을 표류하며 모아 온 곡식 자루와 광석 더미, 미지의 고대 유물들이 선반마다 가득 메워져 있습니다. 수석 보급관들은 한 톨의 식량과 철광석도 유실되지 않도록 밤낮없이 장부를 대조합니다.',
    strategy: '27종 모든 자원의 최대 보관 적재량을 일괄 확장합니다. 병참고 레벨이 낮으면 자원 상한에 도달해 영지 자동 생산과 던전 전리품이 증발해 버리므로, 4레벨 및 상위 설비 증축을 위해 주기적으로 가장 먼저 올려두어야 하는 필수 기반 시설입니다.'
  },
  infirmary: {
    lore: '심연 던전의 맹독과 끔찍한 치명상을 입고 들것에 실려 온 용병들이 누워 있는 야전 병동입니다. 톡 쏘는 약초 냄새와 소독용 에테르 증기가 가득하며, 멸균 치료 캡슐 안에서 용병들은 부러진 뼈를 맞추고 찢긴 살점을 재생하며 전장으로 돌아갈 채비를 마칩니다.',
    strategy: '던전 탐험에서 빈사 상태가 되거나 마나가 고갈된 용병을 입원시켜 단시간 내에 체력과 마나를 100% 완전 복원합니다. 시설 레벨이 올라갈수록 치료 대기 시간이 단축되어 고난도 던전 연속 공략 시 전선 복귀율을 극대화해 줍니다.'
  },
  market: {
    lore: '방주 외곽의 으슥한 그늘막 아래, 그림자 상인들과 밀수꾼들이 은밀히 판을 벌이는 암시장입니다. 심연의 미궁 깊은 곳에서 몰래 빼돌린 진귀한 인챈트 마도석과 희귀 보물들이 거래되며, 위험하지만 매력적인 거래 제안이 지휘관의 주머니를 유혹합니다.',
    strategy: '잉여 자원을 골드로 환전하거나, 구하기 힘든 인챈트 접두/접미 마도석을 급히 조달할 수 있는 유동성 교환 창구입니다. 증축할수록 일일 특별 상품 목록이 다양해지고 환전 거래 수수료가 절감되어 자원 운용의 유연성을 극대화합니다.'
  }
};


