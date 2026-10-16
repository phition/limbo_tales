/**
 * ═════════════════════════════════════════════════════════════════════════
 *  👑 EPIC STORY NPCS DEFINITION & METADATA
 * ═════════════════════════════════════════════════════════════════════════
 *  에픽 퀘스트 및 시나리오 서사창(EpicQuestDialogueModal)에 등장하는
 *  모든 주요 NPC들의 목록 및 메타데이터 정의
 */

export interface NpcDefinition {
  id: string;
  name: string;
  role: string;
  defaultAvatar: string;
  description: string;
  category: 'citadel' | 'scenario' | 'abyss';
  categoryLabel: string;
  questSource?: string;
}

export const EPIC_STORY_NPCS: NpcDefinition[] = [
  // ── 🏰 방주 성채 핵심 인물 (Citadel Leaders & Staff) ──
  {
    id: 'npc_elaine_normal',
    name: '수석 오퍼레이터 일레인 (기본)',
    role: '방주 수석 오퍼레이터',
    defaultAvatar: 'assets/portraits/portrait_t1_scholar.png',
    description: '방주 통제실을 총괄하며 사령관의 탐사와 방주 재건을 전폭 보좌하는 냉철하고 헌신적인 수석 오퍼레이터 (기본 표정)',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '초반 튜토리얼 & 방주 전술 브리핑'
  },
  {
    id: 'npc_elaine_serious',
    name: '수석 오퍼레이터 일레인 (진지)',
    role: '방주 수석 오퍼레이터',
    defaultAvatar: 'assets/portraits/portrait_t1_scholar.png',
    description: '심연 마물의 위협과 전장의 긴박한 전황을 냉철히 분석하고 지휘를 보좌하는 진지한 표정',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '초반 튜토리얼 & 실전 전투 가이드'
  },
  {
    id: 'npc_elaine_smile',
    name: '수석 오퍼레이터 일레인 (미소)',
    role: '방주 수석 오퍼레이터',
    defaultAvatar: 'assets/portraits/portrait_t1_scholar.png',
    description: '작전 성공, 퀘스트 완수 및 대원들의 무사 귀환을 환영하며 안도하는 부드러운 미소',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '초반 튜토리얼 & 승전 보고 및 야영'
  },
  {
    id: 'npc_elaine_worry',
    name: '수석 오퍼레이터 일레인 (걱정)',
    role: '방주 수석 오퍼레이터',
    defaultAvatar: 'assets/portraits/portrait_t1_scholar.png',
    description: '물자 부족, 무구 미지원, 대원 부상 등 예기치 못한 위기 상황을 염려하는 표정',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '초반 튜토리얼 & 무구 부족 브리핑'
  },
  {
    id: 'npc_lloyd',
    name: '선봉대장 로이드',
    role: '방주 수호대장',
    defaultAvatar: '🛡️',
    description: '방주 성채를 굳건히 수호하며 선봉대를 지휘하는 믿음직한 수호대장',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '1차 영지 재건 & 심층 진입 에픽'
  },
  {
    id: 'npc_valkyria',
    name: '성녀 발키리아',
    role: '성화의 수호성녀',
    defaultAvatar: '✨',
    description: '원정대의 영혼과 상처를 어루만지며 성화의 온기를 불어넣는 성녀',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '1차 영지 재건 & 심층 진입 에픽'
  },
  {
    id: 'npc_chief_advisor',
    name: '방주 총괄 참모',
    role: '전략 참모부',
    defaultAvatar: '📜',
    description: '방주 거점 인프라 증축 및 군사 전략 작전을 보좌하는 수석 전략 참모',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '1차 영지 재건 완료 에픽'
  },
  {
    id: 'npc_vulcanus',
    name: '수석 대장장이 불카누스',
    role: '방주 병기창장',
    defaultAvatar: '⚒️',
    description: '방주 병기창의 무구 단조와 에테르 공명을 총괄하는 불꽃의 거장',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '장비 단조 & 고대 렐릭 에픽'
  },
  {
    id: 'npc_alyssa',
    name: '수석 연금술사 알리샤',
    role: '에테르 연금공방장',
    defaultAvatar: '🧪',
    description: '마도서 연성과 스킬 비전 강화, 포션 정제를 지휘하는 천재 연금술사',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '에테르 공방 & 스킬 강화 에픽'
  },
  {
    id: 'npc_ark_ai',
    name: '고대 방주의 잔류 사념',
    role: '방주 제어 인공지능',
    defaultAvatar: '🔮',
    description: '선조들의 시공간 방주 제어 코어에 깃든 고대 홀로그램 인공지능',
    category: 'citadel',
    categoryLabel: '방주 성채',
    questSource: '방주 핵심 제어실 기동 에픽'
  },

  // ── ⚔️ 시나리오 인물 (Scenario Characters) ──
  {
    id: 'npc_bernhard',
    name: '기사단장 베른하르트',
    role: '타락한 성기사단장',
    defaultAvatar: '⛓️',
    description: '단죄의 성채를 수호하다 심연의 마기에 침식된 비운의 성기사단장',
    category: 'scenario',
    categoryLabel: '시나리오',
    questSource: '단죄의 성채의 결말 에픽'
  },
  {
    id: 'npc_elrik',
    name: '보급관 엘릭',
    role: '성기사단 부관',
    defaultAvatar: '🛡️',
    description: '베른하르트 단장의 곁을 지키며 기사단의 긍지를 잃지 않은 충직한 부관',
    category: 'scenario',
    categoryLabel: '시나리오',
    questSource: '단죄의 성채의 결말 에픽'
  },
  {
    id: 'npc_ian',
    name: '연금술사 이안',
    role: '방랑 연금술사',
    defaultAvatar: '🧪',
    description: '만화경의 저주로 기억을 잃고 심연을 떠돌던 비운의 천재 연금술사',
    category: 'scenario',
    categoryLabel: '시나리오',
    questSource: '연금술사와 만화경의 저주 에픽'
  },
  {
    id: 'npc_sylvia_virgin',
    name: '성혈의 처녀 실비아',
    role: '해방된 성녀',
    defaultAvatar: '🕊️',
    description: '심연 군주의 흡혈 저주를 극복하고 진정한 자유를 되찾은 성혈의 성녀',
    category: 'scenario',
    categoryLabel: '시나리오',
    questSource: '성혈의 서약과 발키리의 구원 에픽'
  },
  {
    id: 'npc_knights_soul',
    name: '타락에서 해방된 기사단장의 영혼',
    role: '고대 성기사단장',
    defaultAvatar: '🎖️',
    description: '심연 8층의 저주에서 풀려나 비로소 안식을 찾은 고대 기사단장의 거룩한 영혼',
    category: 'scenario',
    categoryLabel: '시나리오',
    questSource: '단죄의 성채 해방 에픽'
  },

  // ── 🌌 심연 및 초월적 존재 (Abyssal & Transcendent Entities) ──
  {
    id: 'npc_void_overlord_echo',
    name: '공허 지배자의 마지막 사념',
    role: '심연의 원초 군주',
    defaultAvatar: '👑',
    description: '심연 5층 원초의 제단에서 토벌된 공허 거신의 마지막 에코 잔류 사념',
    category: 'abyss',
    categoryLabel: '심연/초월',
    questSource: '5층 원초의 제단 결전 에픽'
  },
  {
    id: 'npc_asmodeus',
    name: '심연의 군주 아스모데우스',
    role: '태초의 심연 군주',
    defaultAvatar: '👑',
    description: '심연 10층 심장부 옥좌에서 군림하는 원초의 공허 군주',
    category: 'abyss',
    categoryLabel: '심연/초월',
    questSource: '10층 심연의 심장부 정복 에픽'
  },
  {
    id: 'npc_arkeos',
    name: '무간의 지배자 아르케오스',
    role: '태초의 공허 창조주',
    defaultAvatar: '🌌',
    description: '11층 무간지옥(Avici)의 시공간을 일그러뜨리는 태초의 공허 절대자',
    category: 'abyss',
    categoryLabel: '심연/초월',
    questSource: '무간지옥 아비치 정복 에픽'
  },
  {
    id: 'npc_arkeos_transcendent',
    name: '시공간 초월자 아르케오스',
    role: '무간도의 인도자',
    defaultAvatar: '🌌',
    description: '윤회의 끝자락 시간 종착역에서 [시공간의 나침반]을 각성시키는 초월자',
    category: 'abyss',
    categoryLabel: '심연/초월',
    questSource: '크로노스와 시공간의 나침반 에픽'
  }
];

export const NPC_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  EPIC_STORY_NPCS.map(n => [n.name, n.id])
);

export const NPC_ID_TO_NAME: Record<string, string> = Object.fromEntries(
  EPIC_STORY_NPCS.map(n => [n.id, n.name])
);
