export type ElaineEmotion = 'normal' | 'serious' | 'smile' | 'worry';

export interface TutorialStep {
  id: string;
  order: number;
  emotion: ElaineEmotion;
  title: string;
  speaker: string;
  message: string[];
  targetSelector?: string;
  pointerPosition?: 'top' | 'bottom' | 'left' | 'right';
  targetLabel?: string;
  allowOverlayClickNext?: boolean; // 타깃이 없을 때 대화창 클릭으로 다음 진행
  autoAdvanceOnAction?: string;    // 특정 액션 발생 시 자동 전이
  hideDialogueOnAcknowledge?: boolean; // 대화 확인 시 대화창을 숨기고 타깃 스포트라이트만 강조
  acknowledgeButtonLabel?: string;    // 대화 확인/닫기 버튼 커스텀 라벨
  nextButtonLabel?: string;           // 다음 단계 버튼 커스텀 라벨
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ── Step 1: 환영 및 방주 상황 보고 ──
  {
    id: 'TUTORIAL_WELCOME',
    order: 1,
    emotion: 'normal',
    title: '방주 통제실 연결',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '의식이 무사히 돌아오셨군요, 사령관님! 방주 통제실의 수석 오퍼레이터 일레인입니다.',
      '현재 방주는 동력이 끊기고 저장된 물자가 바닥난 위기 상태입니다. 생존자들을 지키려면 거점의 핵심 시설부터 순서대로 재건해야 합니다.'
    ],
    allowOverlayClickNext: true
  },

  // ── Step 2: Q_MAIN_01 심연 생체 정제소 건설 ──
  {
    id: 'TUTORIAL_BUILD_REFINERY',
    order: 2,
    emotion: 'serious',
    title: '자원 생산 기지 복원',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '화면 좌측의 퀘스트를 확인해 주십시오. 첫 번째 과업은 마물의 잔해를 자원으로 환원할 [심연 생체 정제소]의 복원입니다.',
      '지정된 건설 구역을 선택하여 정제소를 완공하십시오.'
    ],
    targetSelector: '[data-tutorial-target="build-refinery"]',
    pointerPosition: 'bottom',
    targetLabel: '심연 생체 정제소 건설'
  },

  // ── Step 3: 퀘스트 보상 수령 체득 및 거점 확장 안내 ──
  {
    id: 'TUTORIAL_CLAIM_REWARD',
    order: 3,
    emotion: 'smile',
    title: '보상 수령 및 거점 확장 안내',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '정제소가 성공적으로 복원되어 퀘스트를 완수했습니다! 공적에 대한 [보상]을 수령하십시오.',
      '수령하신 보상 자재로 퀘스트 라인을 따라 생존자 안식처, 벌채소, 광석 시추소를 순서대로 복원해 주십시오. 광석 시추소까지 완공하고 [방랑자의 라운지] 건설로 이어질 때 다시 찾아뵙겠습니다!'
    ],
    targetSelector: '[data-tutorial-target="quest-reward"]',
    pointerPosition: 'right',
    targetLabel: '퀘스트 보상 받기'
  },

  // ── Step 4: 방랑자의 라운지 건설 ──
  {
    id: 'TUTORIAL_BUILD_TAVERN',
    order: 4,
    emotion: 'serious',
    title: '방랑자의 라운지 건설 승인',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '사령관님, 방주의 기초 인프라가 훌륭하게 복원되었습니다! 이제 마물을 조사하고 심연을 정찰할 탐사대를 모집할 때입니다.',
      '외곽의 유능한 방랑자들을 영입할 수 있도록 성채 영지에 [방랑자의 라운지]를 건설해 주십시오.'
    ],
    targetSelector: '[data-tutorial-target="build-tavern"]',
    pointerPosition: 'bottom',
    targetLabel: '방랑자의 라운지 건설'
  },

  // ── Step 5: 방랑자의 라운지 입장 ──
  {
    id: 'TUTORIAL_ENTER_TAVERN',
    order: 5,
    emotion: 'normal',
    title: '방랑자의 라운지 방문',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '라운지가 완공되었습니다! 안으로 들어가 대기 중인 용병들을 살펴보겠습니다.'
    ],
    targetSelector: '[data-tutorial-target="enter-tavern"]',
    pointerPosition: 'bottom',
    targetLabel: '방랑자의 라운지 입장'
  },

  // ── Step 6: 첫 용병 후보 점검 및 영입 ──
  {
    id: 'TUTORIAL_RECRUIT_MERCENARY',
    order: 6,
    emotion: 'smile',
    title: '용병 후보 상세 점검 및 영입',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '방주의 부름에 응하여 세 명의 방랑 용병(용병 검사, 마총 수련생, 원소 학도)이 라운지에 도착했습니다.',
      '용병마다 개인 성향(특성)과 스탯, 고유 스킬이 모두 다릅니다. [🔍 상세] 창을 열어 꼼꼼히 확인하신 후 마음에 드는 대원을 고용해 주십시오.',
      '(확인 시 대화창이 닫히며 자유롭게 후보들을 검토하고 고용하실 수 있습니다)'
    ],
    targetLabel: '용병 후보 상세 확인 및 고용',
    hideDialogueOnAcknowledge: true
  },

  // ── Step 7: 원정단 편성으로 이동 ──
  {
    id: 'TUTORIAL_NAVIGATE_BARRACKS',
    order: 7,
    emotion: 'smile',
    title: '원정단 편성 이동',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '훌륭한 대원을 영입하셨군요, 사령관님!',
      '새로 합류한 대원을 실전에 투입하려면 원정대에 등록해야 합니다. 상단의 [원정단 편성 이동]을 눌러 편성 화면으로 이동하십시오.'
    ],
    targetSelector: '[data-tutorial-target="open-barracks-btn"]',
    pointerPosition: 'bottom',
    targetLabel: '원정단 편성 이동 ▶'
  },

  // ── Step 8: 원정대 출전 배치 ──
  {
    id: 'TUTORIAL_DEPLOY_HERO',
    order: 8,
    emotion: 'serious',
    title: '원정대 출전 배치',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '방금 영입한 대원을 실전 탐사대에 배치할 차례입니다.',
      '대기 중인 용병 카드의 [⚔️ 파티에 출전] 버튼을 눌러 3인 원정대를 완성하십시오. (확인 시 대화창이 닫히며 출전 버튼이 강조됩니다)'
    ],
    targetSelector: '[data-tutorial-target="hero-deploy-btn"]',
    pointerPosition: 'top',
    targetLabel: '파티에 출전 ⚔️',
    hideDialogueOnAcknowledge: true
  },

  // ── Step 9: 무구 부족 상황 고지 & 채비실 이동 권유 ──
  {
    id: 'TUTORIAL_WEAPON_SHORTAGE',
    order: 9,
    emotion: 'worry',
    title: '전술 무구 부족 현황 보고',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '…사령관님, 솔직히 보고드려야 할 현안이 있습니다.',
      '원래대로라면 영입한 대원에게 제식 무구를 지급해야 하지만, 현재 방주는 병기창이 파손되고 가공 자원이 없어 지원해 드릴 수 있는 무구가 전혀 없습니다.',
      '하지만 이번 작전은 무리한 결전이 아닌 [침묵의 회랑 1구역]을 살피는 [1층 정찰 강하]입니다. 사전 채비를 철저히 갖추면 충분히 돌파할 수 있습니다. 강조된 [출정 채비실로 이동] 버튼을 눌러 채비실로 이동하십시오.'
    ],
    targetSelector: '[data-tutorial-target="open-explore-drawer"]',
    pointerPosition: 'top',
    targetLabel: '출정 채비실로 이동 ▶'
  },

  // ── Step 10: 채비실 - 포지션 배치 설명 및 자유 설정 ──
  {
    id: 'TUTORIAL_PREP_POSITION',
    order: 10,
    emotion: 'serious',
    title: '원정대 진형 및 포지션 설정',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '출정 채비실에 오셨습니다. 무구가 부족한 상황일수록 대원들의 포지션 배치가 생사를 결정합니다.',
      '전방의 공격을 받아낼 대원은 [전열(피해-10%)]에, 원거리 및 지원 대원은 [중열] 또는 [후열]에 배치하도록 권장합니다.',
      '하단의 [포지션 설정하기]를 누르면 대화창이 닫히며 자유롭게 대원들의 포지션을 변경할 수 있습니다. 설정을 마친 후 화면 하단의 [다음: 시너지 확인 ▶] 플로팅 버튼을 눌러주십시오.'
    ],
    hideDialogueOnAcknowledge: true,
    acknowledgeButtonLabel: '포지션 설정하기 (대화창 닫기) ▶'
  },

  // ── Step 11: 채비실 - 파티 시너지 확인 ──
  {
    id: 'TUTORIAL_PREP_SYNERGY',
    order: 11,
    emotion: 'normal',
    title: '파티 시너지 효과 확인',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '대원들의 직업 조합에 따라 파티 전체에 강력한 전투 버프를 주는 [파티 시너지]가 상시 발동됩니다.',
      '원정대의 현재 활성 시너지 조합과 효과를 확인하신 후 [다음] 버튼을 눌러주십시오.'
    ],
    targetSelector: '[data-tutorial-target="party-synergy-panel"]',
    pointerPosition: 'bottom',
    targetLabel: '파티 시너지 패널',
    allowOverlayClickNext: true,
    nextButtonLabel: '다음: 배낭 확인 ▶'
  },

  // ── Step 12: 채비실 - 배낭 규격 확인 ──
  {
    id: 'TUTORIAL_PREP_BACKPACK',
    order: 12,
    emotion: 'normal',
    title: '원정 배낭 규격 확인',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '심연에서 획득할 전리품과 소모품을 보관할 [배낭] 규격입니다.',
      '배낭 용량이 클수록 더 많은 전리품을 가져올 수 있지만 추가 준비 비용이 발생합니다. 규격을 확인하신 후 [다음]을 눌러주십시오.'
    ],
    targetSelector: '[data-tutorial-target="backpack-section"]',
    pointerPosition: 'top',
    targetLabel: '배낭 규격 선택 구역',
    allowOverlayClickNext: true,
    nextButtonLabel: '다음: 보급품 점검 ▶'
  },

  // ── Step 13: 채비실 - 필수 보급품 및 균열의 닻 설명 & 무료 배낭 및 보급품 1개씩 담기 ──
  {
    id: 'TUTORIAL_PREP_SUPPLIES',
    order: 13,
    emotion: 'serious',
    title: '필수 생존 보급품 및 균열의 닻 점검',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '심연으로 진입하기 전, 배낭의 필수 소모품을 점검합니다. 시야를 밝힐 🔥 횃불, 야영 시 체력을 회복할 🍖 던전 식량, 부상을 치료할 🩹 붕대, 광맥을 캘 ⛏️ 곡괭이가 필요합니다.',
      '그리고 가장 중요한 [⚓ 균열의 닻]을 반드시 챙기셔야 합니다! 심연 탐사 중 전멸 위기 시 전리품 손실 없이 [즉각 안전 귀환]하거나, 대기 용병과 [현장 교체]할 때 소모되는 절대적인 생명선입니다.',
      '이번 1층 정찰에는 추가 자원 소모가 전혀 없는 무료 [가벼운 백팩(12칸)]을 선택하고, 보급품을 각 1개씩 담아주십시오.'
    ],
    hideDialogueOnAcknowledge: true,
    acknowledgeButtonLabel: '배낭 및 보급품 채비하기 ▶'
  },

  // ── Step 14: 심연 1계층 강하 개시 ──
  {
    id: 'TUTORIAL_DESCENT_START',
    order: 14,
    emotion: 'serious',
    title: '침묵의 회랑 1구역 강하 개시',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '심연 1계층, 침묵의 회랑 1구역입니다.',
      '방주의 통제실에서 사령관님의 원정대를 끝까지 지원하겠습니다. 1층의 [강하 개시]를 눌러 심연으로 출격하십시오. 무운을 빕니다!'
    ],
    targetSelector: '[data-tutorial-target="btn-descent-floor-1"]',
    pointerPosition: 'left',
    targetLabel: '강하 개시 ⚔️'
  },

  // ── Step 15: 심연 1계층 탐색 및 마물 수색 ──
  {
    id: 'TUTORIAL_EXPLORE_SCOUT',
    order: 15,
    emotion: 'normal',
    title: '심연 1구역 탐색 개시',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '심연 1계층 회랑에 무사히 진입했습니다! 이제 전방을 탐색하며 자원을 수집하고 숨겨진 마물의 기척을 경계해야 합니다.',
      '화면 하단의 [탐색 진행] 버튼을 눌러 회랑 안쪽으로 발걸음을 옮겨 주십시오. 마물이 출현하면 즉시 전술 브리핑을 지원하겠습니다!'
    ],
    targetSelector: '[data-tutorial-target="btn-explore"]',
    pointerPosition: 'top',
    targetLabel: '탐색 진행 ▶',
    hideDialogueOnAcknowledge: true,
    acknowledgeButtonLabel: '탐색 시작하기 (대화창 닫기) ▶'
  },

  // ── Step 16: 전투 - 위험 적 타깃 지정 ──
  {
    id: 'TUTORIAL_BATTLE_TARGET',
    order: 16,
    emotion: 'serious',
    title: '적 전력 분석 및 타깃 지정',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '전방에 마물 무리가 나타났습니다! 전열의 [부패 슬라임] 뒤에 숨어있는 후열의 [그림자 임프]를 주목하십시오.',
      '후열의 적은 강력한 기습과 광역 공격을 가해오므로 최우선으로 제압해야 합니다. 상단의 [그림자 임프] 카드를 탭하여 [타깃]을 지정하십시오!'
    ],
    targetSelector: '[data-tutorial-target="monster-card-1"]',
    pointerPosition: 'bottom',
    targetLabel: '후열 마물(그림자 임프) 타깃 지정',
    hideDialogueOnAcknowledge: true,
    acknowledgeButtonLabel: '타깃 지정하기 (대화창 닫기) ▶'
  },

  // ── Step 17: 전투 - 스킬 연계 및 FEVER 게이지 충전 ──
  {
    id: 'TUTORIAL_BATTLE_COMBO',
    order: 17,
    emotion: 'smile',
    title: '스킬 연계와 FEVER 게이지 충전',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '훌륭한 판단입니다, 사령관님! 목표가 확실하게 고정되었습니다.',
      '전투 중 대원들이 스킬을 사용하거나 치명타, 상태이상 연계(콤보)를 성공시키면 화면 상단의 [FEVER 게이지]에 전술 뱃지가 충전됩니다.',
      '뱃지 5개가 모두 모이면 강력한 파티 전술 시너지가 활성화됩니다. 아군의 스킬을 연계하며 마물들과 공방을 주고받아 보십시오!'
    ],
    targetSelector: '[data-tutorial-target="fever-gauge-panel"]',
    pointerPosition: 'bottom',
    targetLabel: 'FEVER 게이지 & 전술 뱃지',
    hideDialogueOnAcknowledge: true,
    acknowledgeButtonLabel: '작전 개시 (전투 진행) ▶'
  },

  // ── Step 18: 전투 - FEVER 시너지 효과 확인 및 적절한 타이밍에 궁극기 발동 ──
  {
    id: 'TUTORIAL_BATTLE_FEVER_GUIDE',
    order: 18,
    emotion: 'serious',
    title: 'FEVER 시너지 활성화 및 궁극기 전술 지휘',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '사령관님, FEVER 게이지가 최대로 충전되었습니다! 게이지 하단에 활성화된 【전술 시너지 효과】를 확인해 주십시오.',
      '피버가 충전되었다고 즉시 궁극기를 낭비하기보다는, 시너지 효과가 아군의 상황이나 적의 패턴과 맞아떨어지는 결정적인 순간에 발동하는 것이 전술의 핵심입니다.',
      '전황을 냉철하게 살피며 가장 적절한 순간에 대원의 [궁극기]를 발동하여 시너지를 폭발시키십시오!'
    ],
    targetSelector: '[data-tutorial-target="fever-gauge-panel"]',
    pointerPosition: 'bottom',
    targetLabel: 'FEVER 시너지 효과 확인',
    hideDialogueOnAcknowledge: true,
    acknowledgeButtonLabel: '전황 살피기 (대화창 닫기) ▶'
  },

  // ── Step 19: 전투 - 궁극기 시너지 폭발 칭찬 및 전투 속개 ──
  {
    id: 'TUTORIAL_BATTLE_FEVER_PRAISE',
    order: 19,
    emotion: 'smile',
    title: '전술 시너지 폭발!',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '탁월한 지휘입니다, 사령관님! 결정적인 타이밍에 폭발한 궁극기와 전술 시너지가 마물들을 완전히 압도했습니다!',
      '이 기세를 몰아 남은 마물들을 모두 소탕하고 이번 심연 정찰을 완벽한 승리로 이끄십시오!'
    ],
    hideDialogueOnAcknowledge: true,
    acknowledgeButtonLabel: '전투 속개 (마물 소탕하기) ▶'
  },

  // ── Step 20: 탐험 - 전투 후 야영 및 대원 간 유대감 확인 ──
  {
    id: 'TUTORIAL_EXPLORE_CAMP',
    order: 20,
    emotion: 'smile',
    title: '전투 후 모닥불 야영과 유대감 다지기',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '마물 무리를 훌륭히 격퇴하셨습니다, 사령관님! 격전을 치른 대원들의 체력과 마나가 많이 소모되었습니다.',
      '화면 좌측 하단의 [야영] 버튼을 눌러 모닥불을 피우고 대원들을 쉬게 하십시오. 야영 중 나누는 모닥불 대화를 통해 대원 간의 [유대감]이 상승하여 전투력이 한층 더 강화됩니다!'
    ],
    targetSelector: '[data-tutorial-target="btn-camp"]',
    pointerPosition: 'top',
    targetLabel: '야영 (체력 회복 & 유대감 상승)'
  },

  // ── Step 21: 탐험 - 횃불 점등 및 심연 위험도 가속 ──
  {
    id: 'TUTORIAL_EXPLORE_TORCH',
    order: 21,
    emotion: 'normal',
    title: '횃불 점등과 심연 위험도 가속',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '심연의 어둠은 위험하지만, [횃불]을 켜면 시야가 확보되어 전방의 마기와 숨겨진 길을 더 빠르게 탐색할 수 있습니다.',
      '횃불이 켜진 상태에서는 [탐색 진행] 시 심연 위험도가 더 신속하게 상승하여 보스 방이나 다음 층으로 가는 심연의 문을 빠르게 열 수 있습니다.',
      '화면 우측 하단의 [횃불] 버튼을 탭하여 불을 밝혀 보십시오!'
    ],
    targetSelector: '[data-tutorial-target="btn-torch"]',
    pointerPosition: 'top',
    targetLabel: '횃불 점등 🔥'
  },

  // ── Step 22: 탐험 - 용병 관리 설명 및 방주 안전 귀환 ──
  {
    id: 'TUTORIAL_EXPLORE_RETURN',
    order: 22,
    emotion: 'serious',
    title: '원정대 관리 및 안전 귀환 지휘',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '횃불 옆의 [용병 관리] 버튼을 누르면 대기실의 예비 용병과 파티원을 즉석에서 교체하거나 전/중/후열 포지션을 재배열할 수 있습니다.',
      '하지만 이번 강하는 지형과 전투 메커니즘을 파악하기 위한 [1차 기본 정찰]이므로, 용병 교체나 재배치 없이 안전하게 방주로 귀환하겠습니다.',
      '좌측 하단의 [귀환(균열의 닻)] 버튼을 눌러 지금까지 모은 전리품을 가지고 영지로 무사히 귀환하십시오!'
    ],
    targetSelector: '[data-tutorial-target="btn-return"]',
    pointerPosition: 'top',
    targetLabel: '귀환 ⚓ (방주로 안전 귀환)'
  },

  // ── Step 23: 성채 - 첫 원정 정찰 완수 및 방주 지휘 개시 ──
  {
    id: 'TUTORIAL_CITADEL_FINISH',
    order: 23,
    emotion: 'smile',
    title: '첫 원정 정찰 완수 및 방주 지휘 개시',
    speaker: '수석 오퍼레이터 일레인',
    message: [
      '원정대의 안전 귀환을 환영합니다, 사령관님! 심연에서 수집한 모든 전리품과 자원들이 [영지 창고]에 안전하게 보관되었습니다.',
      '방주 원정은 항상 이와 같은 흐름으로 진행됩니다: [출정 채비 ➔ 심연 강하 및 탐색·전투·야영 ➔ 전리품 수확 후 안전 귀환].',
      '귀환하여 비축한 자원으로 대장간을 승급시켜 더 강력한 장비를 제작하고, 성화와 묘지를 복구하며 계속해서 열리는 영지 시설들을 발전시키십시오.',
      '이제부터 사령관님만의 원정단을 이끌고 심연 11층 무간도의 최심부까지 정복해 나가십시오. 통제실은 언제나 사령관님의 곁에 있습니다!'
    ],
    allowOverlayClickNext: true,
    nextButtonLabel: '원정단 지휘 시작하기 (튜토리얼 완수) ⚔️'
  }
];
