export interface PatchNoteBullet {
  title?: string;
  desc: string;
}

export interface PatchNoteCategory {
  icon: string;
  title: string;
  color: string;
  bullets: PatchNoteBullet[];
}

export interface PatchNoteRelease {
  version: string;
  title: string;
  badge: string;
  isLatest?: boolean;
  categories: PatchNoteCategory[];
}

export const PATCH_NOTES_DATA: Record<'ko' | 'en' | 'ja', PatchNoteRelease[]> = {
  ko: [
    {
      version: 'v1.1.3',
      title: 'V.1.1.3 정식 업데이트 패치노트',
      badge: 'v1.1.3',
      isLatest: true,
      categories: [
        {
          icon: '🍖',
          title: '보급품 체계 개편 & 던전 보급 드랍 도입',
          color: '#ffd54f',
          bullets: [
            {
              title: "영지 자원 '식량'과 채비 보급품 '던전 식량' 완전 분리",
              desc: '탐험 중 획득하는 영지 식량 자원(resource, 최대 스택 30)과 채비실/야영 전용 보급품(supply, 최대 스택 3)을 분리하여, 던전 귀환 시 획득한 식량 자원이 방주 창고로 안전하게 영구 귀속됩니다.'
            },
            {
              title: '심연 내 비상 식량 드랍',
              desc: '마물 토벌 및 보물 상자/고대 석관 탐색 시 일정 확률로 긴급 야영에 쓰일 [던전 식량]을 노획할 수 있습니다.'
            },
            {
              title: '6층 이상 특수 보급 [던전 도시락] 드랍 해금',
              desc: '심연 6계층 이상 구역에서 마물 및 상자 개방 시 상위 보급품 [던전 도시락]이 드랍됩니다. (야영 시 HP/MP 45% 회복 및 마물 기습 위험 50% 억제, 보스 처치 시 100% 확정 지급)'
            }
          ]
        },
        {
          icon: '🏰',
          title: '영지 침공전(Invasion) 엔진 & 밸런스 정밀화',
          color: '#ff7043',
          bullets: [
            {
              title: 'PvE 던전 공식 일원화 & 10층 DR(K=500) 적용',
              desc: '비정상적인 전타 크리티컬 현상을 수정하고 정밀 치명타 확률·회피율 및 심연 10층 기준 피해 감소율(DR)을 적용하여 긴장감 있는 수성 전투로 완성했습니다.'
            },
            {
              title: '전투 배속 전환 지원 (1x / 1.5x / 2x)',
              desc: '영지 침공전 진행 속도를 1배속, 1.5배속, 2배속으로 자유롭게 스위칭할 수 있습니다.'
            },
            {
              title: '침공전 전용 실시간 반응형 VFX',
              desc: '아군 방어 진형과 적 침공군의 실제 위치를 추적하여 타격 이펙트가 정밀하게 투사됩니다.'
            }
          ]
        },
        {
          icon: '✨',
          title: '반응형 전투 연출 & 사운드 최적화',
          color: '#80deea',
          bullets: [
            {
              title: '화면 크기별 최적 비율 레이아웃',
              desc: '큰 화면 및 태블릿 환경에서 던전 탐험 및 네메시스(Nemesis) 토벌 시 상단 일러스트와 전투 로그의 비율을 최적화하고, 하단 패널 여백과 반응형 높이를 조절했습니다.'
            },
            {
              title: '전투 VFX 타겟 DOM 자동 추적',
              desc: '마물 슬롯 및 아군 위치를 DOM 실좌표 기반으로 추적하여 어떤 해상도에서도 스킬 이펙트가 정확한 위치에 적중합니다.'
            },
            {
              title: '차원 아레나 SFX 및 BGM 사운드 강화',
              desc: '아레나 및 주요 전투 모드에서 사운드 효과음과 배경음악의 밸런스를 개선하여 타격감을 강화했습니다.'
            }
          ]
        },
        {
          icon: '⚙️',
          title: '마스터 데이터 스튜디오 클라우드 배포 강화',
          color: '#69f0ae',
          bullets: [
            {
              title: '차원 칙령(Arena Edict) 실시간 배포',
              desc: '데이터 스튜디오에서 편집한 아레나 칙령의 저장 및 Firebase 클라우드 실시간 배포가 원활하게 동기화되도록 수정했습니다.'
            }
          ]
        }
      ]
    },
    {
      version: 'v1.1.2',
      title: 'V.1.1.2 업데이트 내역',
      badge: 'v1.1.2',
      categories: [
        {
          icon: '🧭',
          title: '탐험 & 이벤트 시스템 대폭 개편',
          color: '#ffd54f',
          bullets: [
            {
              title: "층별 고유 이벤트 '가속' 실제 전투 연동",
              desc: '9층 도플갱어(프리즘 방직사 일러스트 및 플레이어 원정대 복제본 결투), 6층 참회실 흡혈 귀족, 8층 고문실 간수 등 7종의 가속 선택지가 실제 전투로 연결되며, 승리 시 확정 보상을 획득합니다.'
            },
            {
              title: '비상 탈출(닻 부재) 추격전 메커니즘',
              desc: '균열의 닻 없이 시도하는 비상 탈출 실패 시 마물 추격대와의 사투가 벌어지며, 승리 또는 도주 성공 시 성채로 안전하게 귀환합니다.'
            },
            {
              title: '이전 지휘관 조우 이벤트 (PvP / 교류)',
              desc: '최근 1시간 내 던전을 방문한 타 지휘관의 잔영과 조우하여 정보 교류(행운 가호) 또는 기습 습격(경험치 2배 비동기 PvP 대결)을 펼칠 수 있습니다.'
            }
          ]
        },
        {
          icon: '⚔️',
          title: '전투 메커니즘 & 밸런스 정밀 조정',
          color: '#ff7043',
          bullets: [
            {
              title: '치명타 피해 계산식 개편',
              desc: '행운(Luck) 스탯의 치명타 피해 배율 보정을 제외하여 행운은 발생 확률과 회피에 집중되고, 피해 배율은 고유 장비 및 스킬에 온전히 비례하도록 조정되었습니다.'
            },
            {
              title: '적 차징(집중 공격) 스마트 알고리즘',
              desc: '마물이 3마리 이상 생존해 있을 때만 차징을 시도하며, 차징 공격 발동 시 100% 확정 치명타로 적중합니다.'
            }
          ]
        },
        {
          icon: '🏆',
          title: '차원 아레나 & 멀티플레이 기능 강화',
          color: '#80deea',
          bullets: [
            {
              title: '7단계 등급별 랭크 아이콘 & 에셋 스튜디오 연동',
              desc: '브론즈부터 그랜드마스터까지 7단계 고유 아이콘이 실시간 반영되며, 커스텀 에셋 스튜디오에서 자유롭게 커스텀할 수 있습니다.'
            },
            {
              title: "데이터 스튜디오 '차원 칙령' 실시간 배포",
              desc: '차원 칙령 규칙이 Firebase 클라우드를 통해 웹과 모바일에 즉시 동기화됩니다.'
            },
            {
              title: '명예 암시장 투사 무구 도감 등록',
              desc: '암시장 결투 장비 시리즈를 심연의 백과 컬렉션에 세트로 등록할 수 있습니다.'
            }
          ]
        },
        {
          icon: '✨',
          title: 'UI / UX 테마 & 시스템 안정화',
          color: '#69f0ae',
          bullets: [
            {
              title: '다크 판타지 골드 & 차콜 테마 리뉴얼',
              desc: '고채도 청록 톤을 배제하고 깊이 있는 저채도 골드와 차콜 블랙 테마로 전면 개편되었습니다.'
            },
            {
              title: '차원 메세지 티커 [D.M] 간소화 표기',
              desc: '영지 하단 내비게이션 상단 티커 뱃지를 모든 언어에서 컴팩트하게 [D.M]으로 통일했습니다.'
            },
            {
              title: '의무실 영웅 초상화 렌더링',
              desc: '입원실 침상 및 모달에 이모지 대신 영웅의 실제 포트레이트가 표시됩니다.'
            },
            {
              title: '다국어 및 레이아웃 안정화',
              desc: '런타임 캐시 참조 에러 해결, 텍스트 자동 축소/줄바꿈으로 UI 깨짐 현상을 완벽 방지했습니다.'
            }
          ]
        }
      ]
    },
    {
      version: 'v1.0.1',
      title: 'V.1.0.1 업데이트 내역',
      badge: 'v1.0.1',
      categories: [
        {
          icon: '⚔️',
          title: '차원 아레나 (Dimensional Arena) 룰 및 결투 메커니즘 정밀 개편',
          color: '#ffd54f',
          bullets: [
            {
              title: '3v3+1 차원 결투단 정규화',
              desc: '선발 3인(전열·중열·후열)과 전술 오퍼레이터 리더 1인 체제로 정식 개편되어, 리더의 상시 [영령의 가호] 및 피버 초월 궁극기 투사가 결투의 핵심 승부처가 됩니다.'
            },
            {
              title: '홀덤 블러핑 시스템 (2인 공개 + 1인 히든 실루엣)',
              desc: '상대의 3번 슬롯 히든 영웅과 노림수 족보를 예측하고 카운터 덱을 맞추는 고도의 심리전이 도입되었습니다.'
            },
            {
              title: '주간 차원율 가위바위보 상성 순환 (돌파 > 변칙 > 수호 > 돌파)',
              desc: '주간 차원율 상성 우위 시 +1단계 판정 계급 보너스를 획득하며, 5종 배지 [스트레이트] 조커는 상성을 초월해 절대 승리합니다.'
            },
            {
              title: '노페어 배지 가중치 총점제 & 피버 3선승 압승 룰',
              desc: '전술 파동 격돌 시 8대 배지 개별 가중치 총점으로 승패를 가르며, 피버 쇼다운 3승 선착 시 상대 잔여 체력과 무관하게 즉시 압승합니다.'
            }
          ]
        },
        {
          icon: '👾',
          title: '시공의 침식자 네메시스 & 차원 영지 침공전 수정 및 밸런스 고도화',
          color: '#ff416c',
          bullets: [
            {
              title: '네메시스 3부위 독립 타겟팅 공략',
              desc: '총 1,250만 HP 월드 보스의 3개 부위(머리, 몸통, 꼬리) 고유 패턴 및 절멸기 저지 시스템이 정밀 동기화되었습니다.'
            },
            {
              title: '6시간 주기 요격 목표치 & 수요일 자정(00:00) 정기 완전 초기화',
              desc: '6시간당 1/24 요격 컷을 통한 영지 자원 약탈 방어선 및 주간 정기 초기화 사이클이 백과사전과 인게임에 완벽히 정립되었습니다.'
            },
            {
              title: '차원 영지 침공전 7라운드 거점 공방전',
              desc: '성벽과 좌/우 방어 포탑, 4대 핵심 자원 최대 30% 약탈 & 8시간 보호막 메커니즘이 확립되었습니다.'
            }
          ]
        },
        {
          icon: '🌐',
          title: '방주 백과사전 전면 검증 & 다국어(EN/JA) 번역 품질 개선',
          color: '#80deea',
          bullets: [
            {
              title: '실제 게임 데이터와 100% 동기화',
              desc: '심연 생체 정제소 건설 비용, 전열 피격 가중치 및 스킬 보호막 진형 보너스, 무기 6종 고유 특성, 몬스터 구조체 팩션 등이 실제 구현에 맞게 수정되었습니다.'
            },
            {
              title: '다국어 번역 전수 보강',
              desc: '백과사전 공략, 무기 특성, 3v3+1 아레나 룰, 12대 피버 족보, 네메시스 레이드 등 핵심 전문 용어가 영어와 일본어로 정교하게 번역되었습니다.'
            }
          ]
        },
        {
          icon: '✨',
          title: '편의성(UX) & 시인성 혁신 업데이트',
          color: '#69f0ae',
          bullets: [
            {
              title: '원정대 편성 [스마트 일괄 장착]',
              desc: '각 클래스별 역할 핵심 스탯에 가중치를 두고 보유한 미장착 최상급 무구·방어구·장신구를 한 번의 탭으로 자동 장착하는 기능이 도입되었습니다.'
            },
            {
              title: '직관적인 거점 알림 뱃지 시스템',
              desc: '의뢰소 보상 수량 레드 뱃지, 병영 전직 가능 골드 뱃지, 미정화 저주 장비 수량 레드 뱃지가 실시간 연동됩니다.'
            }
          ]
        }
      ]
    },
    {
      version: 'v0.9.9-rc10',
      title: 'V.0.9.9-rc10 업데이트 내역',
      badge: 'v0.9.9-rc10',
      categories: [
        {
          icon: '⚔️',
          title: '차원 아레나 (Dimensional Arena) 전면 개편 & 정규 시즌 고도화',
          color: '#c8aa6e',
          bullets: [
            {
              title: '실시간 SPD 턴 큐 & 피버콜 족보 대결',
              desc: '행동 속도 기반 자동 연계 전투 및 모멘텀 배지 5개 선제 완성 시 발동하는 12대 전술 족보 상성 배틀이 펼쳐집니다.'
            },
            {
              title: "사경(Death's Door) 3턴 유예 & 서포터 전술 원호",
              desc: '치명상을 입은 영웅은 3턴간 사경 유예 상태에 머물며 아군 힐러의 구원이나 서포터(40% 확률)의 원호 치유로 전선 복귀가 가능합니다.'
            },
            {
              title: '명예 암시장 & 투사의 인장 교환',
              desc: '승리 및 연승 보너스로 획득한 투사의 인장을 통해 최고 등급 무구 보급함과 특화 장비로 교환할 수 있습니다.'
            }
          ]
        },
        {
          icon: '👾',
          title: '주간 월드 레이드 『차원 네메시스』 전면 개편',
          color: '#ff416c',
          bullets: [
            {
              title: '3개 독립 부위 공략 & 30,000 차징 브레이크',
              desc: '머리·몸통·꼬리의 고유 패턴에 맞서 절멸기 차징 시 요구치를 신속히 집중 타격해 파쇄하면 1턴간 그로기 상태로 무력화할 수 있습니다.'
            },
            {
              title: '용병 고유 스킬셋 & 궁극기 커맨드 패널',
              desc: 'PVE 탐험에서 육성한 영웅들의 고유 스킬과 화려한 VFX, 상태이상 연계 콤보 폭발을 네메시스 전장에서도 그대로 전술 지휘할 수 있습니다.'
            }
          ]
        },
        {
          icon: '🌌',
          title: '심연 11층 무간도(Avici) 레벨 스케일링 전면 개편',
          color: '#b388ff',
          bullets: [
            {
              desc: '최심층 무간도 던전의 난이도 곡선이 개선되어 11층 시작 몬스터가 Lv.50부터 시작하며, 최심부 최종 진 보스가 Lv.600까지 매끄럽게 레벨 스케일링되도록 밸런스를 조정했습니다.'
            }
          ]
        }
      ]
    }
  ],
  en: [
    {
      version: 'v1.1.3',
      title: 'V.1.1.3 Official Update Patch Notes',
      badge: 'v1.1.3',
      isLatest: true,
      categories: [
        {
          icon: '🍖',
          title: 'Provisions Overhaul & Dungeon Supply Drops',
          color: '#ffd54f',
          bullets: [
            {
              title: "Complete Separation of Citadel 'Food' & Expedition 'Dungeon Food'",
              desc: "Citadel food resources (inventory cap 30) obtained during exploration and camping-only supplies (supply cap 3) are now fully separated. Food resources earned upon dungeon return permanently store into citadel warehouses safely."
            },
            {
              title: 'Emergency Food Drops in the Abyss',
              desc: 'Defeating monsters and searching treasure chests/ancient sarcophagi now have a chance to yield emergency [Dungeon Food] for camping.'
            },
            {
              title: 'Special Supply [Dungeon Lunchbox] Drops on Floor 6+',
              desc: 'In Abyss Floor 6 and above, opening chests or defeating monsters drops high-grade [Dungeon Lunchbox] (recovers 45% HP/MP at camp and reduces monster ambush risk by 50%; guaranteed 100% drop on boss kill).'
            }
          ]
        },
        {
          icon: '🏰',
          title: 'Territory Invasion Engine & Balance Refinement',
          color: '#ff7043',
          bullets: [
            {
              title: 'Unified PvE Formulas & 10F Damage Reduction (K=500)',
              desc: 'Fixed unintended all-critical strike anomalies. Applied precise critical hit/evasion formulas and Abyss 10F standard Damage Reduction (DR) for thrilling defense battles.'
            },
            {
              title: 'Battle Speed Switching (1x / 1.5x / 2x)',
              desc: 'Toggle Territory Invasion battle speed dynamically between 1x, 1.5x, and 2x speeds.'
            },
            {
              title: 'Real-Time Responsive Invasion VFX',
              desc: 'Skill attack effects now dynamically project onto exact coordinates of ally defensive ranks and enemy invaders.'
            }
          ]
        },
        {
          icon: '✨',
          title: 'Responsive Battle Presentation & Sound Polish',
          color: '#80deea',
          bullets: [
            {
              title: 'Optimal Ratio Layout across Screen Sizes',
              desc: 'Optimized illustration-to-log ratios and expedition panel buffer headroom on larger screens and tablets for dungeon exploration and Nemesis raids.'
            },
            {
              title: 'Target DOM Auto-Tracking for Combat VFX',
              desc: 'Tracks enemy slots and ally coordinates directly from DOM bounding rectangles, ensuring pinpoint skill effect accuracy on any resolution.'
            },
            {
              title: 'Dimensional Arena SFX & BGM Balance',
              desc: 'Tuned sound effects and background music levels in Arena and high-intensity battle modes for punchy combat feel.'
            }
          ]
        },
        {
          icon: '⚙️',
          title: 'Master Data Studio Cloud Distribution',
          color: '#69f0ae',
          bullets: [
            {
              title: 'Real-Time Arena Edict Synchronization',
              desc: 'Arena Edicts configured in Data Studio now save and deploy in real time across web and mobile platforms via Firebase Cloud.'
            }
          ]
        }
      ]
    },
    {
      version: 'v1.1.2',
      title: 'V.1.1.2 Update History',
      badge: 'v1.1.2',
      categories: [
        {
          icon: '🧭',
          title: 'Exploration & Encounter Event Overhaul',
          color: '#ffd54f',
          bullets: [
            {
              title: "Floor Unique 'Accelerate' Event Linked to Combat",
              desc: 'Accelerated event choices such as 9F Doppelganger duel, 6F Confessional Vampire Noble, and 8F Torture Chamber Jailer now trigger real battles with guaranteed victory rewards.'
            },
            {
              title: 'Emergency Escape (No Rift Anchor) Pursuit Mechanic',
              desc: 'Failing an emergency escape without a Rift Anchor initiates a desperate ambush battle against monster pursuers; survive or flee to safely return.'
            },
            {
              title: 'Previous Commander Encounter (PvP / Exchange)',
              desc: 'Encounter echoes of other commanders who ventured into the abyss recently to exchange intelligence (Fortune Blessing) or ambush them (2x EXP asynchronous PvP).'
            }
          ]
        },
        {
          icon: '⚔️',
          title: 'Combat Mechanics & Balance Tuning',
          color: '#ff7043',
          bullets: [
            {
              title: 'Critical Damage Formula Overhaul',
              desc: 'Removed Luck modifier from critical damage multiplier so Luck focuses purely on Crit Rate and Evasion, letting damage scale directly with gear and skills.'
            },
            {
              title: 'Smart Enemy Charging Algorithm',
              desc: 'Monsters only initiate charging attacks when 3 or more monsters are alive, and unleashing a charge attack guarantees a 100% Critical Hit.'
            }
          ]
        },
        {
          icon: '🏆',
          title: 'Dimensional Arena & Multiplayer Enhancements',
          color: '#80deea',
          bullets: [
            {
              title: '7-Tier Rank Icons & Asset Studio Integration',
              desc: 'Distinct icons from Bronze to Grandmaster reflect in real-time and can be fully customized in Custom Asset Studio.'
            },
            {
              title: "Real-Time Arena Edict Cloud Deployment",
              desc: 'Arena Edicts deploy instantly across web and mobile via Firebase Realtime Database.'
            },
            {
              title: 'Honor Black Market Gladiator Gear Codex Registration',
              desc: 'Gladiator series equipment can now be registered as complete sets in the Abyssal Codex.'
            }
          ]
        },
        {
          icon: '✨',
          title: 'UI / UX Theme & System Stability',
          color: '#69f0ae',
          bullets: [
            {
              title: 'Dark Fantasy Gold & Charcoal Theme Renewal',
              desc: 'Replaced high-saturation cyan accents with a sophisticated dark gold and charcoal aesthetic.'
            },
            {
              title: 'Compact Dimension Message Ticker [D.M]',
              desc: 'Unified the citadel navigation ticker badge cleanly to [D.M] across all supported languages.'
            },
            {
              title: 'Infirmary Hero Portrait Rendering',
              desc: 'Displays actual hero portraits on infirmary beds and modal cards instead of placeholders.'
            },
            {
              title: 'Multilingual & Layout Stabilization',
              desc: 'Fixed runtime cache references and added auto-wrapping/shrinking to prevent UI clipping in English and Japanese.'
            }
          ]
        }
      ]
    },
    {
      version: 'v1.0.1',
      title: 'V.1.0.1 Update History',
      badge: 'v1.0.1',
      categories: [
        {
          icon: '⚔️',
          title: 'Dimensional Arena Rules & Duel Overhaul',
          color: '#ffd54f',
          bullets: [
            {
              title: '3v3+1 Dimensional Battle Squad Standard',
              desc: 'Revamped into 3 starting frontline/midline/backline heroes plus 1 Tactical Operator Leader whose Ancestral Blessing and Fever Transcendence Ultimates turn the tide.'
            },
            {
              title: 'Holdem Bluffing (2 Revealed + 1 Hidden Silhouette)',
              desc: 'Introduced deep mind games by concealing the 3rd slot hero and tactic intentions to counter opponent lineups.'
            },
            {
              title: 'Weekly Dimensional Law Rock-Paper-Scissors Affinity',
              desc: 'Breakthrough > Anomaly > Guardian > Breakthrough cycle grants +1 tier advantage, while 5-badge Straight Jokers win regardless of affinity.'
            },
            {
              title: 'No-Pair Badge Weight Scoring & Fever 3-Win Overwhelm',
              desc: 'Tactic clashes resolve via weighted badge scores (Assist 35, Counter 30, Crit 25, Break 20), and taking 3 Fever Showdown wins claims immediate victory.'
            }
          ]
        },
        {
          icon: '👾',
          title: 'Nemesis Raid & Territory Invasion Balance',
          color: '#ff416c',
          bullets: [
            {
              title: '3-Part Independent Target Strategy for Nemesis',
              desc: 'Synchronized unique attack patterns and wipe-skill interrupts across Head (4M), Body (5M), and Tail (3.5M) of the 12.5M HP world boss.'
            },
            {
              title: '6-Hour Target Intercepts & Wednesday Reset (00:00)',
              desc: 'Established 6-hour 1/24 intercept thresholds to prevent territory pillaging, fully reset every Wednesday.'
            },
            {
              title: 'Territory Invasion 7-Round Fortress Battle',
              desc: 'Established defensive walls, defense turrets, 30% resource plunder, 8-hour shields, and hero affinity siege tactics.'
            }
          ]
        },
        {
          icon: '🌐',
          title: 'Encyclopedia Verification & Multilingual (EN/JA) Polish',
          color: '#80deea',
          bullets: [
            {
              title: '100% Synchronization with Live Data',
              desc: 'Accurately updated refinery costs, frontline targeting weights, weapon traits, monster construct factions, and job promotions.'
            },
            {
              title: 'Comprehensive Translation Coverage',
              desc: 'Accurately translated 175+ core terms across encyclopedia lore, weapon traits, 3v3+1 rules, and 12 Fever synergies into English and Japanese.'
            }
          ]
        }
      ]
    },
    {
      version: 'v0.9.9-rc10',
      title: 'V.0.9.9-rc10 Update History',
      badge: 'v0.9.9-rc10',
      categories: [
        {
          icon: '⚔️',
          title: 'Dimensional Arena Revamp & Regular Season',
          color: '#c8aa6e',
          bullets: [
            {
              title: 'Real-Time Turn Queue & Fever Call Clashes',
              desc: 'Automated chain battles governed by action speed and 12 tactical Fever synergies unlocked by collecting 5 momentum badges.'
            },
            {
              title: "Death's Door 3-Turn Grace & Supporter Assist",
              desc: "Mortally wounded heroes enter a 3-turn Death's Door grace period with chances for clutch healer or supporter rescues."
            },
            {
              title: "Gladiator's Token & Honor Black Market",
              desc: 'Exchange victory tokens earned in ranked arena for top-tier supply boxes and specialized gear.'
            }
          ]
        },
        {
          icon: '👾',
          title: 'Weekly World Raid: Dimensional Nemesis',
          color: '#ff416c',
          bullets: [
            {
              title: '3 Independent Parts & 30,000 Charge Break',
              desc: 'Concentrate burst attacks on charging parts to stagger the boss into a 1-turn groggy state.'
            },
            {
              title: 'Hero Skills & Ultimate Command Panel',
              desc: 'Command trained hero skills, VFX, and status effect combos directly in Nemesis raids.'
            }
          ]
        },
        {
          icon: '🌌',
          title: 'Abyss 11F Avici Level Scaling Overhaul',
          color: '#b388ff',
          bullets: [
            {
              desc: 'Smoothed infinite scaling difficulty from Lv.50 starting monsters up to Lv.600 deep abyss bosses.'
            }
          ]
        }
      ]
    }
  ],
  ja: [
    {
      version: 'v1.1.3',
      title: 'V.1.1.3 正式アップデート パッチノート',
      badge: 'v1.1.3',
      isLatest: true,
      categories: [
        {
          icon: '🍖',
          title: '補給品体系の再編 & ダンジョン補給ドロップ導入',
          color: '#ffd54f',
          bullets: [
            {
              title: "領地資源「食糧」と準備補給品「ダンジョン食糧」の完全分離",
              desc: '探索中に獲得する領地食糧資源（resource、最大スタック30）と野営専用補給品（supply、最大スタック3）を分離し、ダンジョン帰還時に獲得した食糧が方舟倉庫へ安全に永久帰属されます。'
            },
            {
              title: '深淵内の緊急食糧ドロップ',
              desc: '魔物討伐や宝箱・古代石棺の探索時に一定確率で緊急野営用「ダンジョン食糧」を鹵獲できます。'
            },
            {
              title: '6層以上の特殊補給「ダンジョン弁当」ドロップ解禁',
              desc: '深淵6層以上の区画で上位補給品「ダンジョン弁当」がドロップします（野営時HP/MP 45%回復＆奇襲リスク50%抑制、ボス撃破時は100%確定支給）。'
            }
          ]
        },
        {
          icon: '🏰',
          title: '領地侵攻戦(Invasion)エンジン & バランス精密化',
          color: '#ff7043',
          bullets: [
            {
              title: 'PvEダンジョン公式の一元化 & 10層DR(K=500)適用',
              desc: '不自然な全段クリティカル現象を修正し、精密な会心率・回避率および深淵10層基準の被ダメージ軽減率(DR)を適用して緊張感ある防衛戦に仕上げました。'
            },
            {
              title: '戦闘倍速切り替え対応 (1x / 1.5x / 2x)',
              desc: '領地侵攻戦の進行速度を1倍速、1.5倍速、2倍速へ自由にスイッチできます。'
            },
            {
              title: '侵攻戦専用リアルタイム反応型VFX',
              desc: '味方防衛陣形と敵侵攻軍の実座標を追跡し、打撃エフェクトが精密に投射されます。'
            }
          ]
        },
        {
          icon: '✨',
          title: 'レスポンシブ戦闘演出 & サウンド最適化',
          color: '#80deea',
          bullets: [
            {
              title: '画面サイズ別最適比率レイアウト',
              desc: '大画面およびタブレット環境でダンジョン探索やネメシス討伐時の上部イラストと戦闘ログの比率を最適化し、下部パネルの余白と高さを調整しました。'
            },
            {
              title: '戦闘VFXターゲットDOM自動追跡',
              desc: '魔物スロットと味方位置をDOM実座標ベースで追跡し、あらゆる解像度で正確な位置にスキルエフェクトが命中します。'
            },
            {
              title: '次元アリーナSFX & BGMサウンド強化',
              desc: 'アリーナおよび主要戦闘モードの打撃効果音とBGMバランスを改善しました。'
            }
          ]
        },
        {
          icon: '⚙️',
          title: 'マスターデータスタジオ クラウド配信強化',
          color: '#69f0ae',
          bullets: [
            {
              title: '次元勅令(Arena Edict)のリアルタイム配信',
              desc: 'データスタジオで編集したアリーナ勅令の保存およびFirebaseクラウドリアルタイム配信が円滑に同期されるよう修正しました。'
            }
          ]
        }
      ]
    },
    {
      version: 'v1.1.2',
      title: 'V.1.1.2 アップデート履歴',
      badge: 'v1.1.2',
      categories: [
        {
          icon: '🧭',
          title: '探索 & イベントシステムの大幅刷新',
          color: '#ffd54f',
          bullets: [
            {
              title: "階層固有イベント「加速」の実戦闘連動",
              desc: '9層ドッペルゲンガー、6層懺悔室の吸血貴族、8層拷問室の看守など7種の加速選択肢が実際の戦闘へ繋がり、勝利時に確定報酬を獲得します。'
            },
            {
              title: '緊急脱出（錨なし）追撃戦メカニズム',
              desc: '裂け目の錨なしで試みる緊急脱出に失敗した場合、魔物追撃隊との死闘が発生し、勝利または逃走成功で城塞へ安全に帰還します。'
            },
            {
              title: '先代指揮官との遭遇イベント (PvP / 交流)',
              desc: '直近1時間以内にダンジョンを訪れた他指揮官の残影と遭遇し、情報交流（幸運の加護）または奇襲（経験値2倍非同期PvP）を選択できます。'
            }
          ]
        },
        {
          icon: '⚔️',
          title: '戦闘メカニズム & バランス精密調整',
          color: '#ff7043',
          bullets: [
            {
              title: '会心ダメージ計算式の改定',
              desc: '幸運(Luck)ステータスによる会心倍率補正を除外し、幸運は発生率と回避に特化させ、会心倍率は装備やスキルに直接比例するよう調整しました。'
            },
            {
              title: '敵チャージ（集中攻撃）スマートAI',
              desc: '魔物が3体以上生存している時のみチャージを試み、チャージ攻撃発動時は100%確定会心の一撃となります。'
            }
          ]
        },
        {
          icon: '🏆',
          title: '次元アリーナ & マルチプレイ機能強化',
          color: '#80deea',
          bullets: [
            {
              title: '7段階ランク別アイコン & アセットスタジオ連動',
              desc: 'ブロンズからグランドマスターまでの固有アイコンがリアルタイムに反映され、カスタムアセットスタジオでカスタマイズ可能です。'
            },
            {
              title: "データスタジオ「次元勅令」リアルタイム配信",
              desc: '次元勅令ルールがFirebaseクラウドを通じてウェブおよびモバイルに即座に同期されます。'
            },
            {
              title: '名誉闇市 闘士武具の図鑑登録',
              desc: '闇市決闘装備シリーズを深淵の図鑑コレクションにセットとして登録できます。'
            }
          ]
        },
        {
          icon: '✨',
          title: 'UI / UXテーマ & システム安定化',
          color: '#69f0ae',
          bullets: [
            {
              title: 'ダークファンタジー ゴールド＆チャコール テーマ刷新',
              desc: '高彩度シアンを排し、深みのある低彩度ゴールドとチャコールブラックテーマへ全面改修しました。'
            },
            {
              title: '次元メッセージティッカー [D.M] 簡素表記',
              desc: '領地下部ナビ上部のティッカーバッジを全言語でコンパクトに [D.M] に統一しました。'
            },
            {
              title: '医務室の英雄肖像画レンダリング',
              desc: '入院室ベッドおよびモーダルに絵文字の代わりに実際の英雄ポートレートが表示されます。'
            },
            {
              title: '多言語およびレイアウト安定化',
              desc: '実行時キャッシュ参照エラーの解消、テキスト自動縮小・改行処理によりUI崩れを防止しました。'
            }
          ]
        }
      ]
    },
    {
      version: 'v1.0.1',
      title: 'V.1.0.1 アップデート履歴',
      badge: 'v1.0.1',
      categories: [
        {
          icon: '⚔️',
          title: '次元アリーナ ルール & 決闘メカニズム精密改定',
          color: '#ffd54f',
          bullets: [
            {
              title: '3v3+1 次元決闘団の正規化',
              desc: '先発3名（前列・中列・後列）と戦術オペレーターリーダー1名体制に改編され、リーダーの常時加護とフィーバー超越究極技が決闘の勝敗を握ります。'
            },
            {
              title: 'テキサスホールデム風ブラフシステム (2名公開 + 1名隠匿)',
              desc: '相手の3番スロットの隠匿英雄と狙い目を予測してカウンターデッキを組む高度な心理戦が導入されました。'
            },
            {
              title: '週間次元率じゃんけん相性循環 (突破 > 変則 > 守護 > 突破)',
              desc: '相性優位時に判定ランク+1ボーナスを獲得し、5種バッジ［ストレート］ジョーカーは相性を超越して完全勝利します。'
            },
            {
              title: 'ノーペア個別重み付け総点制 & フィーバー3先勝ルール',
              desc: '戦術波動衝突時に8大バッジの重み付け総点で勝敗を決め、フィーバーショーダウンで3勝先取した側が即座に完全勝利します。'
            }
          ]
        },
        {
          icon: '👾',
          title: '時空の侵食者ネメシス & 領地侵攻戦バランス高度化',
          color: '#ff416c',
          bullets: [
            {
              title: 'ネメシス3部位独立ターゲット攻略',
              desc: '総HP1,250万のワールドボスの3部位（頭・胴・尾）固有パターンおよび絶滅技阻止システムが精密同期されました。'
            },
            {
              title: '6時間周期迎撃目標値 & 水曜深夜(00:00)定期完全初期化',
              desc: '6時間ごとの迎撃ラインによる領地資源略奪防衛線および週間リセットサイクルが確立されました。'
            },
            {
              title: '次元領地侵攻戦 7ラウンド拠点攻防戦',
              desc: '城壁と防衛砲塔、4大主要資源の最大30%略奪＆8時間シールドメカニズムが導入されました。'
            }
          ]
        },
        {
          icon: '🌐',
          title: '方舟図鑑全面検証 & 多言語(EN/JA)翻訳品質改善',
          color: '#80deea',
          bullets: [
            {
              title: '実ゲームデータと100%同期',
              desc: '深淵生体精製所の建設コスト、前列被弾重み、武器6種固有特性、魔物構造体ファクションなどが実機に合わせて修正されました。'
            },
            {
              title: '多言語翻訳の全面補強',
              desc: '図鑑攻略、武器特性、3v3+1アリーナルール、12大フィーバー役など175件以上の専門用語が英語・日本語へ高精度に翻訳されました。'
            }
          ]
        }
      ]
    },
    {
      version: 'v0.9.9-rc10',
      title: 'V.0.9.9-rc10 アップデート履歴',
      badge: 'v0.9.9-rc10',
      categories: [
        {
          icon: '⚔️',
          title: '次元アリーナ全面刷新 & レギュラーシーズン高度化',
          color: '#c8aa6e',
          bullets: [
            {
              title: 'リアルタイムSPDターンキュー & フィーバー役バトル',
              desc: '行動速度に合わせた自動連係戦闘と、モメンタムバッジ5個先取で発動する12大戦術役バトルが繰り広げられます。'
            },
            {
              title: '死線(Death\'s Door) 3ターン猶予 & サポーター戦術援護',
              desc: '致命傷を負った英雄は3ターンの死線猶予状態に留まり、味方ヒーラーの救護やサポーターの救援で劇的な戦線復帰が可能です。'
            },
            {
              title: '名誉闇市 & 闘士の印章交換',
              desc: '勝利・連勝ボーナスで獲得した闘士の印章で最高級武具補給箱や特化装備と交換できます。'
            }
          ]
        },
        {
          icon: '👾',
          title: '週間ワールドレイド『次元ネメシス』全面改修',
          color: '#ff416c',
          bullets: [
            {
              title: '3部位独立攻略 & 30,000チャージブレイク',
              desc: '絶滅技チャージ時に要求数値を集中攻撃して粉砕すると、1ターン間グロッキー状態に追い込めます。'
            },
            {
              title: '英雄固有スキルセット & 究極技コマンドパネル',
              desc: 'PVE探索で育成した英雄たちの固有スキルや状態異常コンボ爆発をネメシス戦場でも直接指揮できます。'
            }
          ]
        },
        {
          icon: '🌌',
          title: '深淵11層無間道(Avici)レベルスケーリング全面改修',
          color: '#b388ff',
          bullets: [
            {
              desc: '最深層ダンジョンの難易度曲線が改善され、11層開始モンスターLv.50から最深部最終真ボスLv.600まで滑らかにスケーリングされます。'
            }
          ]
        }
      ]
    }
  ]
};
