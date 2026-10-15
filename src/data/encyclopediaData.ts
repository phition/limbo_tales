export type EncyclopediaCategory = 'all' | 'starter' | 'classes' | 'monsters' | 'buildings' | 'equipment' | 'skills' | 'systems';

export interface StarterStepGuide {
  step: string;
  title: string;
  icon: string;
  desc: string;
  tip?: string;
}

export interface WeaponTraitGuide {
  weapon: string;
  trait: string;
  icon: string;
  effect: string;
  color: string;
  borderColor: string;
}

export interface FaqGuide {
  question: string;
  answer: string;
}

export interface ClassLineageTheme {
  primary: string;
  light: string;
  bgTint: string;
  border: string;
  cardBg: string;
  cardBorder: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  glow: string;
  accentBar: string;
}

export interface ClassLineageDef {
  id: string;
  name: string;
  roleTitle: string;
  icon: string;
  summary: string;
  theme: ClassLineageTheme;
  classOrder: string[];
}

export const STARTER_STEPS: StarterStepGuide[] = [
  {
    step: 'STEP 1',
    icon: '🧬',
    title: '기초 4대 채집 시설 완공 & 퀘스트 [보상 수령]',
    desc: '목재 20개로 [심연 생체 정제소]를 건설한 뒤 상단 퀘스트 메뉴(📜)에서 깜빡이는 [보상 수령]을 반드시 터치하세요! 연이어 [생존자 안식처](골드), [영목 벌채소](목재), [광맥 시추소](석재/철광)가 순차 해금되며 초기 자본과 생산 라인이 확보됩니다.',
    tip: '💡 팁: 퀘스트 보상을 수령하지 않으면 다음 핵심 테크 시설이 해금되지 않습니다.'
  },
  {
    step: 'STEP 2',
    icon: '📖',
    title: '초기 마도서(2권씩 지급) 연독 & 진형 세팅 (탱·딜·힐 배치)',
    desc: '신임 지휘관에게 [강타], [응급처치], [화염 가르기] 마도서가 각 2권씩 기본 지급됩니다. 편성 화면 [스킬 서고]에서 마도서를 연독하여 스킬을 습득하세요. 최대 6개까지 스킬을 습득 및 보존할 수 있으며, 전직 후에도 모든 스킬이 안전하게 유지됩니다. 전열 아이리스에게 [강타], 중앙 시안에게 [화염 가르기/단검기술]을 세팅합니다.',
    tip: '💡 팁: 전열은 피해 -10% 감소, 중열은 치명타 +5%, 후열은 스킬 위력 +10% 진형 효과를 받습니다.'
  },
  {
    step: 'STEP 3',
    icon: '🍸',
    title: '방랑자의 라운지 건설 & 3번째 용병 영입',
    desc: '시추소 개척 후 [방랑자의 라운지]를 건설하고 마음에 드는 3번째 용병(사제, 마법사, 총사 등)을 고용하여 3인 정예 결사대를 완성해야 회랑 출정이 가능해집니다.',
    tip: '💡 팁: 사제(힐러)를 영입하면 탐험 중 체력 유지력이 비약적으로 상승합니다.'
  },
  {
    step: 'STEP 4',
    icon: '🔥',
    title: '성화 온기 활성화 & 침묵의 회랑 1구역 첫 척후',
    desc: '성화에 목재를 공헌하여 [온기 버프]를 켜두면 생산량 +15% 증산과 거점 회복 효과를 얻습니다. 횃불과 붕대를 챙겨 심연 1구역으로 첫 척후를 파견하면 진입 즉시 퀘스트가 달성됩니다.',
    tip: '💡 팁: 온기가 꺼지면 자원 생산 효율이 저하되므로 목재를 여유 있게 비축해 두세요.'
  },
  {
    step: 'STEP 5',
    icon: '🏛️',
    title: '병기창 & 생체 복원 병동 동시 해금 (이중 테크)',
    desc: '첫 척후 보상으로 병기창과 생체 복원 병동이 동시 개방됩니다. 무기 6종의 고유 특성(검: 출혈절개, 창: 쉴드파쇄, 활: 급소치명, 총: 점사)에 맞춰 장비를 단조하고, 부상 대원은 병동에 입원시켜 안전하게 완치시키세요.',
    tip: '💡 팁: 병기창 단조 후 영혼의 제단을 통해 상위 클래스 전직(1차 승격)까지 연계할 수 있습니다.'
  },
  {
    step: 'STEP 6',
    icon: '🏰',
    title: '안전 귀환의 원칙 & 자원 유지비 체납 방지',
    desc: '탐험 전리품은 던전 배낭에 임시 보관되므로 무리하게 전멸하지 말고 위험도 70% 이상이거나 위기 시 [성채 귀환]을 눌러 전리품을 안전 입고하세요. 시설 Lv.4부터는 골드/식량 유지비가 발생하므로 기초 생산량을 충분히 다지며 증축하는 것이 핵심입니다.',
    tip: '💡 팁: 심연 오버차지 경고가 뜨면 마물들이 대폭 강화되므로 즉시 귀환하는 것이 안전합니다.'
  },
  {
    step: 'STEP 7',
    icon: '🌀',
    title: '차원 앵커 게이트 완공 & 5인 차원 부대 출격 (아레나·네메시스·영지 침공)',
    desc: '성채에서 [차원 게이트]를 완공하면 5인 결투 부대(선발 3인 + 오퍼레이터 1인 + 서포터 1인)로 출격하는 [차원 아레나](실시간 속도제 결투 & 피버콜 대전), 주간 차원 네메시스 월드 레이드, 그리고 [차원 영지 침공]이 모두 개방됩니다. 아레나 승리 시 투사의 인장을 모아 명예 암시장에서 최고급 장비를 교환하세요!',
    tip: '💡 팁: 아레나에서는 기본 2.0배속 속도와 사경(Death\'s Door) 3턴 유예, 5개 배지 완성 후 상대 3턴 타임아웃을 유도하는 피버콜 선제 달성이 승리의 열쇠입니다.'
  }
];

export const WEAPON_TRAITS_GUIDE: WeaponTraitGuide[] = [
  { weapon: '검 계열', trait: '🗡️ 베기', icon: '🗡️', effect: '기본 공격 시 대상에게 1턴간 출혈(Bleed) 상태이상을 부여하여 지속 피해 유발', color: '#ff5252', borderColor: '#ff525244' },
  { weapon: '창 계열', trait: '🔱 방어 파쇄', icon: '🔱', effect: '적의 보호막(Shield)에 50% 추가 피해를 입혀 방어선을 신속히 붕괴', color: '#ff9800', borderColor: '#ff980044' },
  { weapon: '활 계열', trait: '🏹 급소 사격', icon: '🏹', effect: '원거리 치명타율 +5% 및 치명타 피해 +5% 증폭으로 저격 특화', color: '#69f0ae', borderColor: '#69f0ae44' },
  { weapon: '총 계열', trait: '🔫 연사', icon: '🔫', effect: '기본 15% 확률 + 행운(🍀) 보정으로 추가 점사(45% 피해) 격발', color: '#00e5ff', borderColor: '#00e5ff44' },
  { weapon: '단검 계열', trait: '⚡ 암습', icon: '⚡', effect: '상대 마물보다 속도가 빠를수록 피해량 비례 증가 (최대 20% 증폭)', color: '#b388ff', borderColor: '#b388ff44' },
  { weapon: '지팡이 계열', trait: '🪄 마력 공명', icon: '🪄', effect: '모든 액티브 마도 스킬 사용 시 마나(MP) 소모량 5% 상시 절감', color: '#e040fb', borderColor: '#e040fb44' },
];

export const FAQS_GUIDE: FaqGuide[] = [
  { question: '탐험 전리품은 어디로 가나요?', answer: '탐험 중 획득한 아이템과 자원은 던전 배낭에 임시 보관되며, [성채 귀환]을 누르거나 포탈을 타면 성채 창고로 100% 안전하게 입고됩니다.' },
  { question: '탐험 중 전멸하면 어떻게 되나요?', answer: '던전 배낭에 임시 보관 중이던 전리품을 잃어버리게 됩니다. 위험할 땐 무리하지 말고 [성채 귀환]을 누르거나, 전멸 위기 시 안전 귀환시켜주는 [차원의 호각]을 장착하세요.' },
  { question: '영웅이 전사하면 장비는 소멸되나요?', answer: '아닙니다. 사경 상태에서 지속 피해 등으로 전사한 영웅이 착용하고 있던 모든 무기와 방어구, 장신구는 100% 성채 보관함으로 안전하게 회수됩니다.' },
  { question: '전직 시 기존 스킬과 습득 스킬은 어떻게 되나요?', answer: '영혼의 제단에서 1차, 2차 또는 3차 전직 시, 이전 클래스의 고유 스킬과 기존에 습득했던 모든 스킬이 소멸되지 않고 [학습한 스킬] 목록(최대 6개)으로 100% 안전하게 이동 및 보존됩니다.' },
  { question: '3차 초월 전직(Tier 3)의 조건과 특징은 무엇인가요?', answer: '3차 초월 전직은 2차 각성 직업 Lv.60 달성 및 영혼의 제단 증축을 통해 승급할 수 있는 최종 경지입니다. 3차 전직을 완료하면 모든 계열의 마도서를 페널티 없이 100% 위력으로 장착/시전하는 [만마도서] 패시브가 해금되며, 전장을 뒤흔드는 고유 초월 궁극기(오의)와 강력한 융합 패시브를 다룹니다.' },
  { question: '3차 전직 클래스 6종의 고유 역할과 초월 궁극기는 무엇인가요?', answer: '① 이지스 바스티온(절대수호/반사, 초월오의 [아발론]) ② 보이드 스트라이더(차원회피/공격력증폭, 초월오의 [차원참]) ③ 크로노 아콘(50% 더블캐스트, 초월오의 [빅뱅 크로노스]) ④ 세라픽 인퀴지터(공격치유/치유반격, 초월오의 [창공의 대심판]) ⑤ 발할라 워로드(상시흡혈/사경행동, 초월오의 [피의 전술]) ⑥ 오메가 데드아이(방무50%/연쇄충격, 초월오의 [궤도 섬멸])로 구성됩니다.' },
  { question: '마도서 제작 확률과 에테르 공방 해금은 어떻게 되나요?', answer: '에테르 연금 공방의 레벨에 따라 기본(Lv.1, 80%), 희귀(Lv.3, 50%), 에픽(Lv.5, 30%), 전설(Lv.7, 10%) 마도서가 순차 해금되며, 실패 시 에테르 붕괴 연출이 발생합니다.' },
  { question: '마물이 차징(Charging) 중일 때 어떻게 대처해야 하나요?', answer: '마물이 차징을 완료하여 기술 시전에 성공하면 확정 치명타와 방어 관통 50%의 치명적인 피해를 입힙니다. 기절, 빙결, 침묵, 또는 차징 붕괴(BREAK) 스킬을 집중하여 반드시 시전 전에 차징을 캔슬해야 합니다.' },
  { question: '저주받은 장비 정화 시 연출과 결과는 일치하나요?', answer: '네, 병기창 정화 탭에서 정화 진행 시 드라마틱한 컷인 연출과 실제 성공/파괴 판정 결과가 100% 일치합니다. 또한 정화된 장비 목록은 정화 탭에 5분간 유지된 후 자동 정리됩니다.' },
  { question: '도감(심연의 백과) 목록은 어떤 순서로 표시되나요?', answer: '현재 보유한 재료로 즉시 등록 가능한 목록이 [✨ 등록 가능] 뱃지와 함께 최상단에 배치되며, 등록 가능한 항목이 없을 때는 가장 마지막에 등록 완료한 항목(최신 등록순)부터 순서대로 상단에 정렬됩니다.' },
  { question: '시설 유지비가 고갈되면 어떻게 되나요?', answer: '영지 시설 Lv.4부터 골드/식량 유지비가 차감됩니다. 유지비가 체납되면 생산이 멈추거나 패널티가 발생하므로 벌채소/시추소/안식처/정제소 생산량을 균형 있게 성장시키세요.' },
  { question: '오파츠(고대 아티팩트)는 어떻게 사용하나요?', answer: '심연 심층 보스 격파나 유적 탐사를 통해 발굴한 오파츠는 방주에 영구 귀속되어 파티 전역 스탯 증폭 및 특수 패시브 효과를 발휘합니다.' },
  { question: '영지 침공 자원 약탈 규칙은 어떻게 되나요?', answer: '침공 승리 시 기본 목표 자원 2종(골드/식량)과 4개 카테고리(영지 기초 자원, 심연 정제 자원, 심연 파밍 전리품, 소모품)에서 각각 무작위로 추첨된 3종의 자원을 상대 영지 보유량의 최대 30%까지 대량 약탈합니다. 단, 하루 3회 침공 제한 및 피침공 시 8시간 보호막이 적용됩니다.' },
  { question: '영지 방어 전술 타워의 효과는 어떻게 적용되나요?', answer: '방어 전술 타워는 공격형(포격 지원), 방어형(성역 재생), 유틸형(방어 파쇄/약화) 3대 테크로 나뉘며, 연구 레벨에 따라 매 라운드 시작 시 별도의 독립 턴으로 발동하여 아군 치료나 적 전체 광역 포격 및 디버프를 지원합니다.' },
  { question: '마법 속성과 몬스터 팩션 상성은 어떻게 작동하나요?', answer: '마법은 원소(화상/빙결/감전 상태이상 추가 부여), 암흑(방어 관통 20% 기본 + 마물 및 용병 대상 20% 추가 피해), 신성(치명타율 +30% + 언데드 및 타락 계열 20% 추가 피해) 3대 속성으로 나뉩니다. 몬스터는 마물(🐾), 구조체(🗿), 언데드(💀), 타락(👁️) 4대 팩션으로 구분되며 상성에 맞춰 전략적으로 스킬을 운용해야 합니다.' },
  { question: '전열 엄호와 서포터 원호 방어의 데미지 계산 방식은 어떻게 되나요?', answer: '후열 아군이나 본대가 피격될 때 전열 영웅이나 서포터가 대신 받는 데미지는 50%로 고정 감면(50% 분담)되며, 나눠받은 50% 데미지는 엄호/서포터 영웅 자신이 직접 받은 피해로 정밀 계산되어 본인의 체력과 보호막에서 차감됩니다.' },
  { question: '방랑자의 라운지(주점) 모험가 도착 쿨타임과 갱신 비용 규칙은 어떻게 되나요?', answer: '라운지에는 10분(600초)마다 새 모험가가 자동 도착하며, 쿨타임 옆 [📺 광고 시청 후 초기화] 버튼으로 즉시 대기 시간을 리셋하고 모험가를 영입할 수 있습니다. 수동 골드 갱신은 1회차 100G, 2회차 400G, 3회차 1,000G 이후 매번 +1,000G씩 증가하며, 10분 경과 또는 광고 시청 시 1단계(100G)로 초기화됩니다.' },
  { question: '차원 아레나(Dimensional Arena)의 기본 진행 규칙과 5인 부대 편성은 어떻게 되나요?', answer: '차원 아레나는 3인의 선발 돌격대(전열/중열/후열)와 1인의 전술 오퍼레이터(리더 가호 및 궁극기 연계), 1인의 서포터(원호 추가타 및 치유 지원)로 구성된 5인 차원 결투 부대로 출격합니다. 참가자 전원의 행동 속도(SPD)에 따라 실시간 턴 큐가 생성되며, 기본 2.0배속의 쾌적한 고속 전투로 결투가 진행됩니다.' },
  { question: '차원 아레나의 사경(Death\'s Door) 시스템과 서포터 원호는 어떻게 작동하나요?', answer: '전투 중 치명상을 입고 체력이 0 이하가 된 영웅은 즉시 전사하지 않고 3턴간 사경(Death\'s Door)을 헤매는 유예 상태에 돌입합니다. 3턴 내에 아군 힐러의 스킬이나 서포터 원호 치유로 체력을 1 이상 회복하면 즉시 부활하여 전선에 복귀할 수 있습니다. 단, 마지막 남은 영웅이 사경에 진입하면 즉시 결투에서 패배하며, 서포터는 40% 확률로 후방에서 원호 추가타 또는 원호 치유를 지원합니다.' },
  { question: '피버 콜(Fever Call) 3턴 타임아웃과 12대 피버 족보 대결 규칙은 무엇인가요?', answer: '전투 행동(치유, 수호, 치명타, 연계, 지원, 파쇄, 회피 등)에 따라 모멘텀 배지 5개를 먼저 채운 진영이 [피버 콜!]을 선언합니다. 선언 후 상대가 3턴 내에 피버 5개를 완성하지 못하면 시간 초과 실격으로 선언 측이 부전승을 거둡니다. 양측 모두 완성 시 피버콜 전광판이 열리고 12대 전술 족보 및 주간 차원율(돌파 > 수호 > 변칙 > 돌파) 상성에 따라 승패를 판정하여 승자 진영의 오퍼레이터 궁극기가 전장에 작렬합니다 (3승 달성 시 즉시 승리).' },
  { question: '차원 아레나 승리 보상과 명예 암시장 무구 교환은 어떻게 활용하나요?', answer: '결투 승리 시 레이팅 점수 상승과 함께 [투사의 인장]을 획득하며, 연승(Streak)이 길어질수록 추가 인장 보너스를 대량 획득합니다. 모은 투사의 인장은 명예 암시장에서 베테랑/엘리트/마스터 등급 무구 보급함과 최고급 장비로 교환할 수 있습니다.' },
];

export const CATEGORY_TABS: { key: EncyclopediaCategory; icon: string; label: string }[] = [
  { key: 'all',       icon: '🔍', label: '전체' },
  { key: 'starter',   icon: '💡', label: '초반 공략' },
  { key: 'classes',   icon: '👑', label: '직업 & 전직' },
  { key: 'monsters',  icon: '👾', label: '몬스터 & 보스' },
  { key: 'buildings', icon: '🏰', label: '영지 시설' },
  { key: 'equipment', icon: '⚒️', label: '장비 & 인챈트' },
  { key: 'skills',    icon: '📜', label: '스킬 & 상태이상' },
  { key: 'systems',   icon: '🗺️', label: '시스템 & 가이드' },
];

export const CLASS_LINEAGES: ClassLineageDef[] = [
  {
    id: 'squire',
    name: '견습 기사 계통',
    roleTitle: '🛡️ 전열 수호 & 신성 방벽 (탱커)',
    icon: '🛡️',
    summary: '견습 기사 ➔ [성기사 ➔ 이지스 발키리] / [중장 보병 ➔ 포트리스] ➔ 👑 이지스 바스티온',
    theme: {
      primary: '#3b82f6',
      light: '#93c5fd',
      bgTint: 'rgba(30, 58, 138, 0.16)',
      border: 'rgba(59, 130, 246, 0.45)',
      cardBg: '#0f172a',
      cardBorder: 'rgba(59, 130, 246, 0.35)',
      tagBg: 'rgba(59, 130, 246, 0.2)',
      tagBorder: 'rgba(59, 130, 246, 0.5)',
      tagText: '#bfdbfe',
      glow: 'rgba(59, 130, 246, 0.12)',
      accentBar: '#3b82f6'
    },
    classOrder: ['squire', 'paladin', 'guardian', 'aegis_valkyrie', 'fortress', 'aegis_bastion']
  },
  {
    id: 'rogue',
    name: '그림자 수련생 계통',
    roleTitle: '⚡ 초고속 암습 & 치명 암살 (물리 딜러)',
    icon: '⚡',
    summary: '그림자 수련생 ➔ [암살자 ➔ 그림자 망령] / [그림자 결투사 ➔ 환영의 검성] ➔ 👑 보이드 스트라이더',
    theme: {
      primary: '#10b981',
      light: '#6ee7b7',
      bgTint: 'rgba(6, 78, 59, 0.16)',
      border: 'rgba(16, 185, 129, 0.45)',
      cardBg: '#0c1a17',
      cardBorder: 'rgba(16, 185, 129, 0.35)',
      tagBg: 'rgba(16, 185, 129, 0.2)',
      tagBorder: 'rgba(16, 185, 129, 0.5)',
      tagText: '#a7f3d0',
      glow: 'rgba(16, 185, 129, 0.12)',
      accentBar: '#10b981'
    },
    classOrder: ['rogue', 'assassin', 'duelist', 'shadow_phantom', 'blade_dancer', 'void_strider']
  },
  {
    id: 'apprentice',
    name: '원소 학도 계통',
    roleTitle: '🔮 광역 마법 & 원소 폭발 (마법 딜러)',
    icon: '🔮',
    summary: '원소 학도 ➔ [대마도사 ➔ 아크 메이지] / [비전 학자 ➔ 시공의 조율사] ➔ 👑 크로노 아콘',
    theme: {
      primary: '#a855f7',
      light: '#d8b4fe',
      bgTint: 'rgba(88, 28, 135, 0.16)',
      border: 'rgba(168, 85, 247, 0.45)',
      cardBg: '#150f24',
      cardBorder: 'rgba(168, 85, 247, 0.35)',
      tagBg: 'rgba(168, 85, 247, 0.2)',
      tagBorder: 'rgba(168, 85, 247, 0.5)',
      tagText: '#e9d5ff',
      glow: 'rgba(168, 85, 247, 0.12)',
      accentBar: '#a855f7'
    },
    classOrder: ['apprentice', 'elementalist', 'arcane_scholar', 'calamity_mage', 'chronomancer', 'chrono_archon']
  },
  {
    id: 'acolyte',
    name: '견습 사제 계통',
    roleTitle: '🕊️ 광역 치유 & 디버프 정화 (신성 힐러)',
    icon: '🕊️',
    summary: '견습 사제 ➔ [주교 ➔ 성령의 구원자] / [전투 사제 ➔ 성전의 심판관] ➔ 👑 세라픽 인퀴지터',
    theme: {
      primary: '#eab308',
      light: '#fde047',
      bgTint: 'rgba(113, 63, 18, 0.16)',
      border: 'rgba(234, 179, 8, 0.45)',
      cardBg: '#1c170b',
      cardBorder: 'rgba(234, 179, 8, 0.35)',
      tagBg: 'rgba(234, 179, 8, 0.2)',
      tagBorder: 'rgba(234, 179, 8, 0.5)',
      tagText: '#fef08a',
      glow: 'rgba(234, 179, 8, 0.12)',
      accentBar: '#eab308'
    },
    classOrder: ['acolyte', 'bishop', 'war_priest', 'high_saintess', 'crusader_lord', 'seraphic_inquisitor']
  },
  {
    id: 'vanguard',
    name: '용병 검사 계통',
    roleTitle: '🌋 전열 분쇄 & 피의 폭주 (근접 딜탱)',
    icon: '🌋',
    summary: '용병 검사 ➔ [광전사 ➔ 발할라 블레이드] / [전술 지휘관 ➔ 철혈의 패황] ➔ 👑 발할라 워로드',
    theme: {
      primary: '#f97316',
      light: '#fdba74',
      bgTint: 'rgba(124, 45, 18, 0.16)',
      border: 'rgba(249, 115, 22, 0.45)',
      cardBg: '#1c100b',
      cardBorder: 'rgba(249, 115, 22, 0.35)',
      tagBg: 'rgba(249, 115, 22, 0.2)',
      tagBorder: 'rgba(249, 115, 22, 0.5)',
      tagText: '#fed7aa',
      glow: 'rgba(249, 115, 22, 0.12)',
      accentBar: '#f97316'
    },
    classOrder: ['vanguard', 'berserker', 'warlord', 'valhalla_blade', 'iron_marshal', 'valhalla_warlord']
  },
  {
    id: 'gunner',
    name: '마총 수련생 계통',
    roleTitle: '🎯 원거리 관통 & 전술 저격 (원거리 딜러)',
    icon: '🎯',
    summary: '마총 수련생 ➔ [전술 포수 ➔ 하이퍼 레인저] / [심연의 저격수 ➔ 사신 저격수] ➔ 👑 오메가 데드아이',
    theme: {
      primary: '#06b6d4',
      light: '#67e8f9',
      bgTint: 'rgba(22, 78, 99, 0.16)',
      border: 'rgba(6, 182, 212, 0.45)',
      cardBg: '#09181f',
      cardBorder: 'rgba(6, 182, 212, 0.35)',
      tagBg: 'rgba(6, 182, 212, 0.2)',
      tagBorder: 'rgba(6, 182, 212, 0.5)',
      tagText: '#a5f3fc',
      glow: 'rgba(6, 182, 212, 0.12)',
      accentBar: '#06b6d4'
    },
    classOrder: ['gunner', 'tactical_gunner', 'sharpshooter', 'aether_gun_meister', 'ghost_sniper', 'omega_deadeye']
  }
];
