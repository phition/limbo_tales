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

