import { Quest } from '../types/game';

export const INITIAL_QUESTS: Quest[] = [
  // === Chapter 1: 꺼져가는 불씨와 방주의 부활 ===
  {
    id: 'Q_MAIN_01',
    title: '제1장: 심연의 어둠 속에서',
    type: 'main',
    chapter: 1,
    summary: '방주의 생존자들을 먹여 살리기 위해 가장 먼저 심연 생체 정제소를 건설하세요.',
    flavorText: '세계는 침묵에 잠겼다. 생존자들의 허기를 달래려면 마물의 사체라도 정제해야 한다...',
    objectives: [
      { description: '심연 생체 정제소 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 200,
      resources: { food: 30, wood: 40, stone: 45 },
      unlockBuildingId: 'cabin'
    },
    status: 'active'
  },
  {
    id: 'Q_BUILD_CABIN',
    title: '연계 퀘스트: 안식의 보금자리',
    type: 'building',
    chapter: 1,
    summary: '생존자들이 쉴 수 있는 첫 번째 생존자 안식처를 건설하세요.',
    flavorText: '얼어붙은 몸을 녹일 지붕이 필요하다. 더 많은 손길이 모이면 거점은 번성할 것이다.',
    objectives: [
      { description: '생존자 안식처 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 250,
      resources: { herb: 25, leather: 20, wood: 60, stone: 50 },
      unlockBuildingId: 'lumberCamp'
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_LUMBER',
    title: '연계 퀘스트: 영목 벌채소 복원',
    type: 'building',
    chapter: 1,
    summary: '영목 벌채소를 건설하여 목재를 자동으로 수급하세요.',
    flavorText: '생존자들이 늘어날수록 성화의 연료가 필요하다. 흑무에 잠식되지 않은 고대 영목을 벌채하라.',
    objectives: [
      { description: '영목 벌채소 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 300,
      resources: { wood: 50, stone: 120, iron: 25 },
      unlockBuildingId: 'quarry'
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_QUARRY',
    title: '연계 퀘스트: 에테르 광맥 시추소 개척',
    type: 'building',
    chapter: 1,
    summary: '에테르 광맥 시추소를 건설하여 석재와 철광을 자동 발굴하세요.',
    flavorText: '강한 성벽과 제식 무기를 위해선 단단한 원석이 필요하다. 부유성 지반을 파헤쳐라.',
    objectives: [
      { description: '에테르 광맥 시추소 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 600,
      resources: { wood: 100, stone: 180, iron: 50, ether: 15 },
      unlockBuildingId: 'tavern'
    },
    status: 'locked'
  },
  {
    id: 'Q_MAIN_02',
    title: '제1장: 첫 번째 척후 파견',
    type: 'main',
    chapter: 1,
    summary: '방랑자의 라운지를 건설하여 첫 용병을 영입하고 성채 외곽 침묵의 회랑 1구역으로 첫 척후를 파견(진입)하세요.',
    flavorText: '흑무 속에서 붉게 번뜩이는 눈동자들이 방주 성채를 노리고 있다. 비록 전멸하더라도 심연의 지형을 확인하는 첫 진입 자체가 값진 경험이다. 진입 후 귀환한 부상자들을 치료할 생체 복원 병동과 심연의 병기창이 개방된다.',
    objectives: [
      { description: '방랑자의 라운지 건설', current: 0, required: 1, isCompleted: false },
      { description: '용병 1명 이상 고용', current: 0, required: 1, isCompleted: false },
      { description: '침묵의 회랑 1구역 진입', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 600,
      ether: 30,
      resources: { stone: 260, iron: 80, wood: 120, herb: 30 },
      supplies: [
        { key: 'torch', name: '탐험 횃불', icon: '🔥', qty: 3 },
        { key: 'bandage', name: '치유 붕대', icon: '🩹', qty: 2 }
      ],
      unlockBuildingIds: ['blacksmith', 'infirmary']
    },
    status: 'locked'
  },
  {
    id: 'Q_MEMORIAL_TRIBUTE',
    title: '연계 퀘스트: 쓰러진 자들을 위한 진혼곡 (묘지 헌화)',
    type: 'field',
    chapter: 1,
    summary: '심연에서 첫 귀환 후, 성채 묘지를 방문하여 쓰러진 전우들과 영령들의 묘비에 헌화하세요.',
    flavorText: '첫 번째 심연 강하에서 살아 돌아왔다. 하지만 차가운 흑무 속에서 끝내 방주로 돌아오지 못한 개척자들의 영혼이 성채 묘지에 잠들어 있다. 성채 묘지를 찾아가 영령의 묘비에 등불과 꽃을 바치고 넋을 위로하라. (헌화 시 5분간 전투 획득 경험치 증가 가호가 적용됩니다.)',
    objectives: [
      { description: '성채 묘지 방문 및 헌화 1회 완료', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 500,
      ether: 30,
      resources: { wood: 40, herb: 15 }
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_FORGE',
    title: '연계 퀘스트 (1/2): 심연의 병기창 복원',
    type: 'building',
    chapter: 1,
    summary: '심연의 병기창을 건설하여 전술 무구 단조 설비를 마련하세요.',
    flavorText: '일반적인 강철은 흑무의 산성에 녹아내린다. 심연의 마물에 맞설 전술 무구를 단조하기 위해 먼저 병기창을 복원하라.',
    objectives: [
      { description: '심연의 병기창 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 200,
      ether: 20,
      resources: { iron: 25, stone: 30 }
    },
    status: 'locked'
  },
  {
    id: 'Q_CRAFT_EQUIP',
    title: '연계 퀘스트 (2/2): 병기창 - 전술 장비 단조',
    type: 'building',
    chapter: 1,
    summary: '심연의 병기창에서 첫 번째 전술 장비를 1회 제작(단조)하여 무구 생산을 개시하세요.',
    flavorText: '고대 에테르를 주입한 마도 전술 장비가 필수적이다. 병기창의 모루를 달구어 첫 전술 장비를 단조하라.',
    objectives: [
      { description: '심연의 병기창에서 장비 1회 단조', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 250,
      ether: 35,
      resources: { prefix_stone: 1 },
      unlockBuildingId: 'alchemy'
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_ALCHEMY',
    title: '연계 퀘스트 (1/2): 에테르 연금 공방 재건',
    type: 'building',
    chapter: 1,
    summary: '에테르 연금 공방을 건설하여 마도 촉매와 비전 마도서 집필 설비를 구축하세요.',
    flavorText: '심연의 맹독과 상태이상을 극복하고 새로운 마도 스킬을 습득하려면 에테르 연금술이 필요하다. 연금 공방을 재건하라.',
    objectives: [
      { description: '에테르 연금 공방 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 250,
      ether: 30,
      resources: { herb: 20, wood: 40 }
    },
    status: 'locked'
  },
  {
    id: 'Q_CRAFT_GRIMOIRE',
    title: '연계 퀘스트 (2/2): 에테르 공방 - 스킬 비전 강화',
    type: 'building',
    chapter: 1,
    summary: '에테르 공방에서 용병의 스킬을 1회 강화하여 비전 전술 능력을 증폭하세요.',
    flavorText: '마도의 지혜가 응축된 에테르 연금술로 용병들의 스킬을 강화하여 심연의 적들에게 더욱 강력한 위력을 발휘하라.',
    objectives: [
      { description: '에테르 공방에서 스킬 강화 1회', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 300,
      ether: 40,
      resources: { crystal: 2 },
      supplies: [
        { key: 'holy_water', name: '축복의 성수', icon: '💧', qty: 2 }
      ],
      unlockBuildingId: 'market'
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_INFIRMARY',
    title: '연계 퀘스트: 생체 복원 병동 복구',
    type: 'building',
    chapter: 1,
    summary: '부상당한 원정 대원들의 집중 치료와 생체 에너지 복원을 위해 생체 복원 병동을 건설하세요. (완공 시 영혼의 제단 개방)',
    flavorText: '치명상을 입은 대원을 병동에 입원시키면 성화의 온기와 연금 용액으로 신속히 회복된다. 육신을 온전히 보전해야 영혼의 한계 돌파가 가능하다.',
    objectives: [
      { description: '생체 복원 병동 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 320,
      ether: 25,
      resources: { silk: 10, leather: 10 },
      supplies: [
        { key: 'bandage', name: '치유 붕대', icon: '🩹', qty: 3 }
      ],
      unlockBuildingId: 'sanctuary'
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_MARKET',
    title: '연계 퀘스트: 황혼의 블랙 마켓 개설',
    type: 'building',
    chapter: 1,
    summary: '방주에 상인과 암거래상들을 유치하여 15종 자원 거래와 마도 비전서 서고를 이용할 수 있는 블랙 마켓을 개설하세요.',
    flavorText: '방주가 거대해질수록 희귀 비전서와 잉여 물자의 원활한 유통이 필요하다. 암시장의 빗장을 열어라.',
    objectives: [
      { description: '황혼의 블랙 마켓 개설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 500,
      ether: 40,
      resources: { pure_prefix_stone: 1, pure_suffix_stone: 1 }
    },
    status: 'locked'
  },
  {
    id: 'Q_UPGRADE_STORAGE',
    title: '연계 퀘스트: 방주 중앙 병참고 증축',
    type: 'building',
    chapter: 1,
    summary: '급증하는 마도 광석과 장비를 수용하기 위해 방주 중앙 병참고를 Lv.2 이상으로 증축하세요.',
    flavorText: '제식 무기 단조와 심연 탐험으로 물자가 넘쳐난다. 중앙 병참고를 증축하여 전 자원 보관 한도를 500개로 확장하라.',
    objectives: [
      { description: '방주 중앙 병참고 Lv.2 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 300,
      resources: { wood: 40, stone: 30, iron: 15 }
    },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_01',
    title: '제1장: 침묵을 부수는 거신 (1F 보스 토벌 & 2F 해금)',
    type: 'main',
    chapter: 1,
    summary: '1층 침묵의 회랑 심부에 도달하여 수호 보스 [침묵의 흑핵 거신]을 토벌하고 2층 [망령의 납골당] 진입로를 개방하세요.',
    flavorText: '회랑 깊은 곳에서 고대 석조 거신이 냉기를 내뿜고 있다. 거신을 무너뜨리고 그 흑핵으로 영혼의 제단을 세우고 더 깊은 층으로 진격하라.',
    objectives: [
      { description: '1층 보스 [침묵의 흑핵 거신] 토벌 & 2층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 500,
      ether: 35,
      resources: { prefix_stone: 2, pure_prefix_stone: 1  },
          },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_02',
    title: '제1장: 망령의 군주를 잠재워라 (2F 보스 토벌 & 3F 해금)',
    type: 'main',
    chapter: 1,
    summary: '2층 망령의 납골당 최심부의 [망령의 사령 군주]를 토벌하고 3층 [에테르 광맥] 진입로를 개방하세요.',
    flavorText: '고대 납골당의 망령들이 사령 군주의 지휘 아래 방주를 위협하고 있다. 사령 군주를 토벌하고 영혼수정을 확보하라.',
    objectives: [
      { description: '2층 보스 [망령의 사령 군주] 토벌 & 3층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 800,
      ether: 50,
      resources: { suffix_stone: 2, crystal: 3  },
    },
    status: 'locked'
  },
  {
    id: 'Q_UPGRADE_FORGE_03',
    title: '연계 퀘스트: 심연의 병기창 개수 (병기창 Lv.3)',
    type: 'building',
    chapter: 1,
    summary: '2층 사령 군주의 잔재와 영혼 수정을 분석하여 심연의 병기창을 Lv.3으로 증축하세요.',
    flavorText: '2층 망령의 납골당 최심부를 평정했으나, 3층 에테르 광맥의 마수들은 한층 더 두터운 마도 장갑을 두르고 있다. 병기창을 3레벨로 증축하여 +7강 강화와 마도 인챈트 설비를 가동하라.',
    objectives: [
      { description: '심연의 병기창 Lv.3 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 600,
      ether: 50,
      resources: { iron: 40, wood: 40, stone: 50, prefix_stone: 2 }
    },
    status: 'locked'
  },
  {
    id: 'Q_ENHANCED_SUPPLY_TORCH',
    title: '연계 퀘스트: 심연을 밝히는 에테르 불꽃 (강화 보급품)',
    type: 'building',
    chapter: 1,
    summary: '병기창 Lv.6 달성으로 강화 보급품 제작이 해금되었습니다. 병기창에서 [에테르 횃불] 1개를 제작하여 심연 탐험을 준비하세요.',
    flavorText: '병기창이 6단계에 도달하여 마도 열기를 안정적으로 제어할 수 있게 되었다! 이제 일반 보급품이 전면 대체되어 [에테르 횃불], [던전 도시락], [심연 곡괭이] 등 월등한 7종의 강화 보급품을 제작할 수 있다. 병기창에서 첫 번째 [에테르 횃불]을 단조하라! (※ 채비실에서 즉석 추가하는 보급품은 일반 보급품이므로, 강화 보급품은 반드시 병기창에서 미리 생산해두어야 합니다.)',
    objectives: [
      { description: '병기창에서 [에테르 횃불] 1개 제작', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1500,
      ether: 80,
      resources: { wood: 30, coal: 15 },
      supplies: [
        { key: 'enhanced_torch', name: '에테르 횃불', icon: '✨🔥', qty: 2 }
      ]
    },
    status: 'locked'
  },
  {
    id: 'Q_EQUIPMENT_ENHANCE',
    title: '연계 퀘스트: 마도 제식 강화 (+3강 이상 달성)',
    type: 'field',
    chapter: 1,
    summary: '심연의 병기창에서 보유 장비 중 하나를 +3강 이상으로 강화하여 원정대의 화력을 증강하세요.',
    flavorText: '3레벨로 증축된 병기창 모루에 고순도 에테르와 철광을 주입하면 무구의 숨겨진 힘이 깨어난다. 장비를 3강 이상으로 단련하여 잠재된 위력을 개방하라.',
    objectives: [
      { description: '+3강 이상 장비 1개 달성 (또는 보유)', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 800,
      ether: 60,
      resources: { crystal: 3, pure_prefix_stone: 1 }
    },
    status: 'locked'
  },
  {
    id: 'Q_EQUIPMENT_ENHANCE_02',
    title: '연계 퀘스트: 정예의 결전 무구 (+5강 한계 돌파)',
    type: 'field',
    chapter: 1,
    summary: '장비를 +5강까지 한계 돌파하여 에테르 광맥의 거수들에 맞설 압도적인 무장을 완성하세요.',
    flavorText: '+5강에 도달한 무구는 심연의 탁기마저 튕겨내는 마도 방벽을 형성한다. 원정대의 핵심 장비를 5강까지 끌어올려 진정한 정예의 위용을 갖추어라.',
    objectives: [
      { description: '+5강 이상 장비 1개 달성 (또는 보유)', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1200,
      ether: 100,
      resources: { pure_prefix_stone: 2, pure_suffix_stone: 1 }
    },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_03',
    title: '제1장: 태고의 광맥을 깨우는 자 (3F 보스 토벌 & 4F 해금)',
    type: 'main',
    chapter: 1,
    summary: '3층 에테르 광맥의 수호 거수 [태고의 광맥 베히모스]를 토벌하고 4층 [심연의 균열] 진입로를 개방하세요.',
    flavorText: '원초의 에테르를 흡수하여 거대해진 베히모스가 광맥을 독점하고 있다. 녀석을 굴복시키고 시공간 균열로 향하는 길을 열어라.',
    objectives: [
      { description: '3층 보스 [태고의 광맥 베히모스] 토벌 & 4층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1200,
      ether: 80,
      resources: { pure_prefix_stone: 1, crystal: 5  },
          },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_04',
    title: '제1장: 시공간의 균열을 닫아라 (4F 보스 토벌 & 5F 해금)',
    type: 'main',
    chapter: 1,
    summary: '4층 심연의 균열 수호자 [심연의 시공 왜곡자]를 토벌하고 최심부 5층 [원초의 제단] 진입로를 개방하세요.',
    flavorText: '차원의 왜곡으로 인해 현실이 붕괴하고 있다. 시공 왜곡자를 처단하고 최종 제단으로 가는 포탈을 안정화하라.',
    objectives: [
      { description: '4층 보스 [심연의 시공 왜곡자] 토벌 & 5층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1800,
      ether: 120,
      resources: { pure_suffix_stone: 1, void_shard: 3  },
          },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_05',
    title: '제1장: 원초의 공허를 정복하라 (5F 최종 결전)',
    type: 'main',
    chapter: 1,
    summary: '5층 원초의 제단 최심부의 [공허의 침식자]를 토벌하고 태초의 모노리스 핵을 회수하여 인류의 방주를 완성하세요.',
    flavorText: '마침내 심연의 근원에 도달했다. 공허의 지배자를 쓰러뜨리고 세계를 파멸로부터 구원하라!',
    objectives: [
      { description: '5층 최종 보스 [공허의 침식자] 격파', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 3000,
      ether: 250,
      resources: { pure_prefix_stone: 2, pure_suffix_stone: 2, void_shard: 5  },
            equipment: {
        id: 'equip_quest_ring',
        baseName: '반지',
        name: '수호자의 은빛 반지 (+5강)',
        slot: 'accessory',
        level: 5,
        rarity: 'legendary',
        stats: { atk: 30, hp: 180, luck: 15, def: 20 },
        description: '공허의 침식자를 토벌한 영웅에게 주어지는 축복받은 고대 반지.',
        icon: '💍'
      }
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_SANCTUARY',
    title: '연계 퀘스트: 영혼의 각성 (영혼의 제단)',
    type: 'promotion',
    chapter: 1,
    summary: '침묵의 흑핵 거신을 토벌하고 획득한 정수로 [영혼의 제단]을 건설하고, 용병을 1차 상위 직업으로 승격시키세요.',
    flavorText: '한계에 다다른 육신에 영혼의 제단을 통한 세례를 내려 진정한 수호자로 거듭나게 하라.',
    objectives: [
      { description: '영혼의 제단 건설', current: 0, required: 1, isCompleted: false },
      { description: '1차 전직 용병 1명 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 400,
      ether: 50,
      resources: { silk: 15, crystal: 5, suffix_stone: 1 },
      unlockBuildingId: 'arenaGate'
    },
    status: 'locked'
  },
  {
    id: 'Q_BUILD_ARENA',
    title: '연계 퀘스트: 차원의 문을 열어라 (차원 앵커 게이트)',
    type: 'building',
    chapter: 1,
    summary: '영혼의 제단과 공명하는 [차원 앵커 게이트]를 건설하여 비동기 차원 아레나 및 차원 교신을 개방하세요.',
    flavorText: '방주 성채의 에테르 파동이 차원 경계를 두드리기 시작했다. 시공간을 가로지르는 차원 앵커를 세워 다른 세계선의 원정대와 교신하라.',
    objectives: [
      { description: '차원 앵커 게이트 건설', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1500,
      ether: 80,
      resources: { stone: 150, iron: 80, crystal: 5 }
    },
    status: 'locked'
  },
  {
    id: 'Q_ARENA_FIRST_BATTLE',
    title: '연계 퀘스트: 명예의 결투 (차원 아레나)',
    type: 'field',
    chapter: 1,
    summary: '차원 아레나 3v3 PvP 결투에 출전하여 다른 방주 원정대와의 시련을 완수하세요.',
    flavorText: '차원 앵커를 통해 마주한 다른 방주 원정대와의 결투. 당신의 전술과 용병단의 무용을 증명하라.',
    objectives: [
      { description: '차원 아레나 1회 결투 완수', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 2000,
      ether: 100,
      resources: { prefix_stone: 1, suffix_stone: 1 }
    },
    status: 'locked'
  },
  {
    id: 'Q_NEMESIS_AWAKEN',
    title: '연계 퀘스트: 시공의 균열과 네메시스',
    type: 'building',
    chapter: 1,
    summary: '차원 앵커 게이트를 Lv.3으로 증축하여 시공간 균열을 안정화하고 차원 네메시스 관문을 개방하세요.',
    flavorText: '차원 앵커 게이트의 출력이 증가하자, 시공간 왜곡 너머에서 모든 차원을 붕괴시키려는 파멸의 화신 [네메시스]의 파동이 감지되었다. 게이트를 3단계로 증축하여 균열을 통제하라.',
    objectives: [
      { description: '차원 앵커 게이트 Lv.3 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1500,
      ether: 80,
      resources: { pure_prefix_stone: 1 }
    },
    status: 'locked'
  },
  {
    id: 'Q_NEMESIS_FIRST_STRIKE',
    title: '연계 퀘스트: 차원 네메시스 요격 작전',
    type: 'field',
    chapter: 1,
    summary: '차원 네메시스 월드 레이드에 1회 출격하여 파멸의 보스에게 유효 타격을 입히세요.',
    flavorText: '시공의 침식자 네메시스가 차원 경계를 허물고 강림했다. 전 원정대를 소집하여 시공 붕괴를 저지하고 피해를 누적시켜라!',
    objectives: [
      { description: '차원 네메시스 월드 레이드 1회 출격', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 2500,
      ether: 120,
      resources: { pure_suffix_stone: 1 }
    },
    status: 'locked'
  },
  {
    id: 'Q_NEMESIS_MILESTONE',
    title: '연계 퀘스트: 시공의 억제자',
    type: 'field',
    chapter: 1,
    summary: '차원 네메시스에게 누적 100,000 이상의 피해를 입혀 시공 붕괴를 지연시키세요.',
    flavorText: '단 한 번의 공세로는 부족하다. 지속적인 포격과 일격으로 네메시스의 핵을 분쇄해야만 방주 세계선의 소멸을 막을 수 있다.',
    objectives: [
      { description: '차원 네메시스 누적 데미지 100,000 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 5000,
      ether: 200,
      resources: { pure_prefix_stone: 2, pure_suffix_stone: 2 }
    },
    status: 'locked'
  },
  {
    id: 'Q_GATE_UPGRADE_06',
    title: '연계 퀘스트: 차원 침공의 서막 (게이트 Lv.6 증축)',
    type: 'building',
    chapter: 1,
    summary: '차원 앵커 게이트를 Lv.6으로 증축하여 5인 부대 영지 침공 및 전술 타워 방어 시스템을 해금하세요.',
    flavorText: '차원 앵커의 출력이 임계치에 도달하며 다른 방주의 영지로 직접 침공할 수 있는 차원 통로가 열린다. 방어 타워를 확충하고 전면전에 대비하라.',
    objectives: [
      { description: '차원 앵커 게이트 Lv.6 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 3000,
      ether: 150,
      resources: { void_shard: 10, dark_essence: 10, crystal: 10 }
    },
    status: 'locked'
  },
  {
    id: 'Q_INVASION_FIRST_SIEGE',
    title: '연계 퀘스트: 차원 영지 침공 작전',
    type: 'field',
    chapter: 1,
    summary: '차원 영지 침공에 1회 출격하여 상대 방주 영지를 정찰하고 약탈을 감행하세요.',
    flavorText: '5인의 정예 부대가 차원 통로를 건넜다. 적의 방어 타워와 수비대를 격파하고 귀중한 심연 자원을 약탈하라!',
    objectives: [
      { description: '차원 영지 침공 1회 출격', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 4000,
      ether: 200,
      resources: { pure_prefix_stone: 1, pure_suffix_stone: 1, void_shard: 15 }
    },
    status: 'locked'
  },
  {
    id: 'Q_TACTICAL_TOWER_RESEARCH',
    title: '연계 퀘스트: 방어 전술 타워 연구',
    type: 'field',
    chapter: 1,
    summary: '영지 방어를 위한 전술 타워(공격/방어/유틸 전술 테크)를 1회 연구하여 강화하세요.',
    flavorText: '침공에만 치중해선 영지를 지킬 수 없다. 전술 타워에 에테르와 심연 재료를 공급하여 난공불락의 요새를 구축하라.',
    objectives: [
      { description: '방어 전술 타워 1회 연구 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 3500,
      ether: 180,
      resources: { crystal: 15, void_shard: 15 }
    },
    status: 'locked'
  },
  {
    id: 'Q_CAMP_EXPEDITION',
    title: '연계 퀘스트: 심연의 온기와 결속',
    type: 'field',
    chapter: 1,
    summary: '심연 던전 탐험 중 야영지에서 성화를 피우고 대원들과 대화를 나누세요.',
    flavorText: '칠흑 같은 어둠 속에서 타오르는 성화의 불씨는 공포를 씻어내고 전우들의 마음을 하나로 묶는다.',
    objectives: [
      { description: '던전 내 야영 성화 1회 피우기', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      resources: { food: 25 },
      supplies: [
        { key: 'holy_water', name: '축복의 성수', icon: '💧', qty: 2 },
        { key: 'pickaxe', name: '탐험 곡괭이', icon: '⛏️', qty: 2 }
      ]
    },
    status: 'locked'
  },
  {
    id: 'Q_CURSE_CLEANSE',
    title: '연계 퀘스트: 저주를 씻는 불꽃',
    type: 'field',
    chapter: 1,
    summary: '심연에서 획득한 저주받은 에픽 장비를 심연의 병기창에서 정화하세요.',
    flavorText: '심연의 독기는 강력하지만, 정결한 신성 에테르로 씻어내면 그 힘은 오롯이 우리의 칼날이 된다.',
    objectives: [
      { description: '저주받은 장비 1회 정화', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 500,
      ether: 40,
      resources: { pure_prefix_stone: 1, pure_suffix_stone: 1 }
    },
    status: 'locked'
  },





  // === 👑 에픽 시나리오: 고대 방주의 기원과 심연의 봉인 ===
  {
    id: 'Q_EPIC_CITADEL_REBUILD_01',
    title: '대서사 에픽: [방주의 새벽] 1차 영지 재건 완성',
    type: 'epic',
    chapter: 1,
    summary: '방주 거점의 핵심 11대 시설을 모두 1레벨 이상 건설하여, 황폐화된 방주를 완전한 자립형 작전 기지로 복원하세요.',
    flavorText: '칠흑 같은 심연의 안개 속에서 고대의 방주가 서서히 그 위용을 되찾고 있다. 모든 거점 시설의 불빛이 밝혀지는 순간, 방주는 단순한 피난처를 넘어 심연을 정복할 결사대의 기동 사령부로 깨어날 것이다.',
    objectives: [
      { description: '영지 내 11대 핵심 거점 시설 1레벨 이상 완공', current: 0, required: 11, isCompleted: false }
    ],
    rewards: {
      gold: 1200,
      ether: 80,
      resources: { wood: 100, stone: 100, iron: 50, food: 50, crystal: 5 }
    },
    epicStory: {
      epilogueTitle: '대서사 에픽: [방주의 새벽] 1차 영지 재건 완성',
      dialogues: [
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대장',
          speakerAvatar: '🛡️',
          text: '지휘관님! 보십시오! 방주 성채의 마지막 핵심 시설까지 가동을 시작했습니다!\n성화의 온기를 중심으로 정제소, 오두막, 벌채소, 광산, 병참고, 주점, 병기창, 연금공방, 병동, 블랙마켓, 그리고 영혼의 제단까지... 마침내 11개 모든 거점의 마나선이 온전히 이어졌습니다!'
        },
        {
          speakerName: '성녀 발키리아',
          speakerRole: '성화의 수호성녀',
          speakerAvatar: '✨',
          text: '방주 전역에 생명의 빛이 퍼져나가고 있어요. 절망에 떨던 생존자들은 이제 이곳을 진정한 안식처라 부르며 지휘관님을 우러러보고 있습니다. 방주의 기틀을 다지는 초반 생존 가이드와 1차 영지 재건이 눈부시게 완수된 것입니다.'
        },
        {
          speakerName: '방주 총괄 참모',
          speakerRole: '전략 참모부',
          speakerAvatar: '📜',
          text: '지휘관님, 이제 방주는 스스로 자원을 축적하고 원정대를 지원하는 "완전한 자립형 기동 사령부"로 승격되었습니다.\n\n앞으로 지휘관님께서 마주하실 거대한 3가지 게임 흐름에 대한 인사이트를 전해드립니다:\n\n1️⃣ [심연 심층 강하 & 고대 렐릭 회수]: 2층 이상의 심연으로 나아갈수록 원초적 저주와 광폭화 보스들이 도사립니다. 층별 보스를 토벌하고 고대 유물(렐릭)을 회수하여 방주의 봉인된 시공간 능력을 해방하십시오.\n\n2️⃣ [용병 승격 & 비전 마도서 시너지]: 영혼의 제단에서 베테랑 용병들을 1차 상위 및 2차 심연 클래스로 승격시키고, 연금 공방에서 마도서를 연성하여 독창적인 스킬 연계(체인 콤보)를 완성하십시오.\n\n3️⃣ [시설 증축 & 3대 인프라 시너지]: 거점을 4~6레벨 이상으로 증축하면 유지비가 발생하지만, [대량 배급제(정제소)], [상업 네트워크(블랙마켓)], [에테르 환류관(연금공방)]의 3대 시너지가 해금되어 유지비를 대폭 절감하고 방주를 번영의 대도시로 진화시킵니다.'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대장',
          speakerAvatar: '🛡️',
          text: '초반 기틀이 완성된 지금, 피난민들과 원정대 결사대가 지휘관님의 노고에 깊이 감사하며 특별한 진상품을 준비했습니다. 앞으로 방주가 나아갈 우선 방향을 선택해 주십시오!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 영지 번영 및 물자 축적 (내정 강화)',
          desc: '방주의 내실을 다지기 위해 대량의 금화와 마도 건자재, 마력 수정을 영지 창고에 대량 비축합니다.',
          flavorChoice: '💬 "튼튼한 기틀이 있어야 심연도 버텨낼 수 있다. 영지의 내정과 인프라를 우선하라."',
          rewards: {
            gold: 2000,
            ether: 120,
            resources: { wood: 200, stone: 200, iron: 100, food: 150, coal: 30, crystal: 8, prefix_stone: 3, suffix_stone: 3 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 심연 개척 및 결사대 무장 (원정 강화)',
          desc: '앞으로의 심층 강하를 위해 결사대에 대량의 군자금과 에테르, 심연 탐사 보급품 풀세트, 그리고 결사대 전용 무구를 전폭 하사합니다.',
          flavorChoice: '💬 "가장 날카로운 칼날만이 방주의 평화를 지킨다. 원정대의 무장을 극대화하라."',
          rewards: {
            gold: 3500,
            ether: 250,
            supplies: [
              { key: 'holy_water', name: '축복의 성수', icon: '💧', qty: 6 },
              { key: 'rift_anchor', name: '차원의 닻', icon: '⚓', qty: 4 },
              { key: 'bandage', name: '치유 붕대', icon: '🩹', qty: 8 },
              { key: 'torch', name: '탐험 횃불', icon: '🔥', qty: 8 }
            ],
            equipment: {
              id: 'equip_rare_expedition_dawn_blade',
              baseName: '여명검',
              name: '심연 결사대의 여명검',
              slot: 'weapon',
              level: 1,
              tier: 3,
              rarity: 'rare',
              description: '심연 회랑을 개척한 초기 결사대에게 하사된 영광의 여명검.',
              icon: '🗡️',
              stats: { atk: 36, critRate: 15, hp: 100 }
            }
          }
        }
      ]
    },
    status: 'active'
  },
  {
    id: 'Q_EPIC_LORE_01',
    title: '에픽: [고대 방주의 기원] 침묵과 망령의 잔재',
    type: 'epic',
    chapter: 1,
    summary: '1층과 2층의 광폭화 보스를 격파하고 [침묵의 흑핵]과 [망령의 영혼수정]을 회수하여 제1 기동 룬을 깨우세요.',
    flavorText: '방주는 단순한 피난처가 아니다. 고대인들이 심연의 붕괴를 막기 위해 건조한 차원 도약함이다. 1~2층 수호자들의 핵을 모아 시원의 기제를 복원하라.',
    objectives: [
      { description: '🔮 [침묵의 흑핵] (1F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false },
      { description: '💠 [망령의 영혼수정] (2F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false }
    ],
    requiredResources: { relic_floor_1: 1, relic_floor_2: 1 },
    rewards: {
      gold: 1000,
      ether: 60,
      resources: { pure_prefix_stone: 2, crystal: 5 }
    },
    epicStory: {
      epilogueTitle: '📜 에픽 서사: 방주의 고대 룬이 깨어나다',
      dialogues: [
        {
          speakerName: '고대 방주의 잔류 사념',
          speakerRole: '방주 제어 인공지능',
          speakerAvatar: '🔮',
          text: '…인식 완료. 방주 관리자 권한 부분 복구. 이 성채는 단순한 요새가 아닌, 붕괴하는 대륙을 떠나 하늘로 날아오르던 고대 비행 방주 [림보 아크]였느니라.'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대',
          speakerAvatar: '🛡️',
          text: '하늘을 날던 방주였다고…?! 1층 거신과 2층 망령 군주의 핵이 성화와 맞물리며 고대의 에테르 동력로가 다시 가동되고 있소!'
        },
        {
          speakerName: '성녀 발키리아',
          speakerRole: '성화의 대사제',
          speakerAvatar: '✨',
          text: '지휘관님, 보십시오! 두 보스의 유물이 제단에 바쳐지자, 심연 1층과 2층을 뒤덮고 있던 짙은 심연의 연무가 완전히 걷히고 정화되었습니다! 이제 해당 층의 마물들은 더 이상 연무로 인한 공격력과 방어력 강화(+5%, +10%)를 받지 않아 향후 반복 파밍이 한결 수월해질 것입니다. 나아가 두 군주의 정수에서 정제된 에테르를 영지 재건에 비축할 수도 있고, 결사대의 무구로 하사할 수도 있습니다. 결단을 내려주십시오.'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 영지 재건 및 인프라 축적 (영지 발전)',
          desc: '피난민들의 거주 환경을 개선하고 성채를 수호하기 위해 대량의 금화와 마도 건자재, 에테르를 영지 창고에 비축합니다.',
          flavorChoice: '💬 "피난민들의 지붕과 식량이 우선이다. 방주의 기초를 견고히 하라."',
          rewards: {
            gold: 1500,
            ether: 100,
            resources: { wood: 150, stone: 150, iron: 80, food: 100, prefix_stone: 3, suffix_stone: 3 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 최전선 결사대 전력 증강 (원정단 육성)',
          desc: '1~2층 수호자의 정수가 깃든 고유 에픽 장비 [흑핵의 고대 파쇄검]을 결사대에 하사합니다.',
          flavorChoice: '💬 "어둠을 가를 칼날이 없다면 방주의 내일도 없다. 원정대에게 고대 무구를 하사하라."',
          rewards: {
            gold: 800,
            ether: 50,
            resources: { pure_prefix_stone: 2, crystal: 5 },
            equipment: {
              id: 'equip_epic_colossus_blade',
              baseName: '대검',
              name: '[흑핵의 고대 파쇄검]',
              slot: 'weapon',
              level: 1,
              rarity: 'epic',
              stats: { atk: 32, def: 12, hp: 80, luck: 12 },
              description: '1층 흑핵 거신의 핵을 녹여 단조한 고대 대검. 묵직한 타격과 함께 방어력을 보강한다.',
              icon: '🗡️'
            }
          }
        }
      ]
    },
    status: 'locked'
  },
  {
    id: 'Q_EPIC_LORE_02',
    title: '에픽: [심연의 심장] 광맥과 시공의 닻',
    type: 'epic',
    chapter: 1,
    summary: '3층과 4층의 광폭화 지배자를 쓰러뜨리고 [원초의 광맥 심장]과 [심연의 시공 닻]을 회수하여 차원 축을 고정하세요.',
    flavorText: '심연 3~4층의 지배자들은 방주가 시공간의 심연 속으로 침몰하지 않도록 지탱하던 고대 닻이었다. 그들의 핵을 성화에 봉헌하여 성화의 화력을 극대화하라.',
    objectives: [
      { description: '🫀 [원초의 광맥 심장] (3F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false },
      { description: '⚓ [심연의 시공 닻] (4F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false }
    ],
    requiredResources: { relic_floor_3: 1, relic_floor_4: 1 },
    rewards: {
      gold: 2500,
      ether: 150,
      resources: { pure_suffix_stone: 2, void_shard: 3 }
    },
    epicStory: {
      epilogueTitle: '📜 에픽 서사: 시공간의 닻이 고정되다',
      dialogues: [
        {
          speakerName: '수석 대장장이 불카누스',
          speakerRole: '방주 병기창장',
          speakerAvatar: '⚒️',
          text: '믿을 수 없군… 베히모스의 광맥 심장에서 영원히 식지 않는 태고의 에테르 불꽃이 솟구치고 있어! 시공 왜곡자의 닻이 차원의 균열을 완전히 용접해냈네!'
        },
        {
          speakerName: '수석 연금술사 알리샤',
          speakerRole: '에테르 연금공방장',
          speakerAvatar: '🧪',
          text: '시공의 닻이 안정화되며 심연 3층과 4층의 연무가 걷히고 완벽히 정화되었습니다! 이제 3~4층 마물들의 연무 강화(공/방 +15%, +20%)가 해제되어 안전한 자원 채취가 가능해졌습니다. 또한 방주의 부유 기관이 공명하기 시작했습니다. 이 방대한 에너지를 방주의 생산 공방에 배급하여 번영을 이룰지, 최심부 결전에 나설 대원들에게 시공의 갑주를 하사할지 선택해주십시오.'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대',
          speakerAvatar: '🛡️',
          text: '지휘관님, 5층의 원초의 제단에서 뿜어져 나오는 공허의 살기가 성채에까지 닿고 있습니다. 우리의 칼날을 벼릴 때입니다!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 영지 발전 선택 [마도 광맥 완전 환류]',
          desc: '광맥의 심장을 성채의 노심에 연결하여 모든 생산 시설에 방대한 에테르와 고급 광물 자원을 비축합니다.',
          flavorChoice: '💬 "광맥의 심장을 성채의 노심에 연결하라. 모든 공방과 저장고를 에테르로 가득 채운다!"',
          rewards: {
            gold: 3500,
            ether: 250,
            resources: { iron: 200, stone: 250, crystal: 15, void_shard: 8, pure_prefix_stone: 3, pure_suffix_stone: 3 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 원정단 육성 선택 [시공의 성유물 장비 하사]',
          desc: '시공간의 굴절을 견디는 에픽 중장갑 [시공 굴절의 광맥 갑주]를 하사합니다.',
          flavorChoice: '💬 "5층 결전을 앞두고 있다. 전사들에게 시공을 가르는 결전 무구를 하사하라."',
          rewards: {
            gold: 1500,
            ether: 100,
            resources: { void_shard: 5, pure_suffix_stone: 2 },
            equipment: {
              id: 'equip_epic_behemoth_plate',
              baseName: '판금 갑옷',
              name: '[시공 굴절의 광맥 갑주]',
              slot: 'armor',
              level: 1,
              rarity: 'epic',
              stats: { def: 38, hp: 240, luck: 15 },
              description: '베히모스의 심장과 시공의 닻으로 담금질한 판금 갑주. 받는 피해를 10% 감소시킨다.',
              icon: '🛡️'
            }
          }
        }
      ]
    },
    status: 'locked'
  },
  {
    id: 'Q_EPIC_LORE_03',
    title: '에픽: [진정한 종언과 재탄생] 모노리스의 구원',
    type: 'epic',
    chapter: 1,
    summary: '5층 최심부의 [공허의 침식자]를 극한의 광폭화 상태에서 토벌하고 [공허 지배자의 모노리스 핵]을 회수하세요.',
    flavorText: '마침내 심연의 근원에 도달했다. 광폭화한 공허의 지배자를 쓰러뜨리고 모노리스 핵을 정화하면, 방주는 마침내 완전한 빛의 방주로 재탄생할 것이다!',
    objectives: [
      { description: '👑 [공허 지배자의 모노리스 핵] (5F 광폭화 최종보스 전리품) 회수', current: 0, required: 1, isCompleted: false }
    ],
    requiredResources: { relic_floor_5: 1 },
    rewards: {
      gold: 5000,
      ether: 300,
      resources: { pure_prefix_stone: 3, pure_suffix_stone: 3, void_shard: 5 }
    },
    epicStory: {
      epilogueTitle: '📜 에픽 서사: 모노리스 핵의 정화와 방주의 비상',
      dialogues: [
        {
          speakerName: '공허 지배자의 마지막 사념',
          speakerRole: '심연의 원초 군주',
          speakerAvatar: '👑',
          text: '…너희는 종언의 굴레를 끊어냈도다. 허나 이것은 끝이 아니니, 더 깊은 심연의 균열 너머로 진정한 시련이 입을 벌리고 있으리라…'
        },
        {
          speakerName: '성녀 발키리아',
          speakerRole: '성화의 대사제',
          speakerAvatar: '✨',
          text: '모노리스 핵이 제단에 안치되며 심연 5층 전체의 지독한 공허 연무가 걷히고 완전 정화되었습니다! 5층 마물들의 연무 강화(공/방 +25%)가 사라져 심층 파밍이 한결 편안해졌으며, 성화의 찬란한 황금빛 오라가 성채 전체를 감싸고 있습니다. 이제 방주는 절망의 무덤이 아니라, 인류를 구원할 기적의 비행 성채입니다!'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대',
          speakerAvatar: '🛡️',
          text: '지휘관님, 승리를 경축하며 모노리스의 태초 에너지를 영지의 완전한 번영을 위해 방주 전체에 공급할지, 제2장 심연 너머로 진격할 결사대에게 신화의 성휘를 하사할지 명을 내려주십시오!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 영지 발전 선택 [태초의 황금기 도래]',
          desc: '모노리스의 태초 에너지를 영지 전역에 방출하여 국고를 황금과 에테르로 가득 채우고 전설적인 이상향을 완성합니다.',
          flavorChoice: '💬 "방주의 모든 생존자들에게 풍요를! 영지를 불멸의 이상향으로 완성하라."',
          rewards: {
            gold: 8000,
            ether: 600,
            resources: { wood: 300, stone: 300, iron: 200, food: 300, crystal: 25, void_shard: 15, pure_prefix_stone: 5, pure_suffix_stone: 5 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 원정단 육성 선택 [신화의 성휘 수여]',
          desc: '모노리스 핵의 신성한 힘이 깃든 레전더리 장신구 [모노리스의 신성 성휘]를 수여합니다.',
          flavorChoice: '💬 "우리의 원정은 멈추지 않는다. 제2장의 어둠을 가를 신화의 무구를 하사하라!"',
          rewards: {
            gold: 3000,
            ether: 250,
            resources: { pure_prefix_stone: 3, pure_suffix_stone: 3, void_shard: 8 },
            equipment: {
              id: 'equip_legend_monolith_ring',
              baseName: '반지',
              name: '[모노리스의 신성 성휘]',
              slot: 'accessory',
              level: 1,
              rarity: 'legendary',
              stats: { atk: 38, def: 28, hp: 300, luck: 22 },
              description: '태초의 모노리스 핵을 가공하여 만든 전설의 반지. 파티 전체의 잠재력을 극한으로 일깨운다.',
              icon: '💍'
            }
          }
        }
      ]
    },
    status: 'locked'
  },
  // === 👑 Chapter 2 에픽 시나리오: 진홍의 성배와 망각의 영혼 ===
  {
    id: 'Q_EPIC_LORE_04',
    title: '에픽: [진홍과 망각의 맹세] 핏빛 성배와 영혼의 나침반',
    type: 'epic',
    chapter: 2,
    summary: '6층과 7층의 광폭화 보스를 격파하고 [핏빛 대공의 진홍 성배]와 [망각 묘지기의 영혼 나침반]을 회수하여 심연 중층부를 정화하세요.',
    flavorText: '6층의 핏빛 성역과 7층의 망각 묘역은 방주가 심연의 심장으로 진입하지 못하도록 막는 저주의 결계다. 두 군주의 성유물을 회수하여 심연의 길을 밝혀라.',
    objectives: [
      { description: '🍷 [진홍 성배] (6F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false },
      { description: '🧭 [영혼 나침반] (7F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false }
    ],
    requiredResources: { relic_floor_6: 1, relic_floor_7: 1 },
    rewards: {
      gold: 6000,
      ether: 400,
      resources: { pure_prefix_stone: 4, pure_suffix_stone: 4, void_shard: 10 }
    },
    epicStory: {
      epilogueTitle: '📜 에픽 서사: 피의 저주를 씻고 영혼의 길을 열다',
      dialogues: [
        {
          speakerName: '성녀 발키리아',
          speakerRole: '성화의 대사제',
          speakerAvatar: '✨',
          text: '지휘관님! 핏빛 대공의 성배에 깃든 피의 갈증을 성화의 불꽃으로 정화했습니다. 그와 동시에 심연 6층과 7층을 짓누르던 피와 망각의 연무가 걷히고 완벽히 정화되었습니다! 이제 6~7층 마물들의 연무 강화(공/방 +30%, +35%)가 해제되었습니다. 묘지기의 영혼 나침반이 심연의 어둠 속에서도 길을 잃지 않도록 은빛 광채를 뿜어내고 있습니다!'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대',
          speakerAvatar: '🛡️',
          text: '진홍의 성배에서 끝없이 솟구치는 생명 에너지는 부상자들의 육신을 완벽히 재생시킬 수 있으며, 정화된 혈맥의 힘으로 영웅들에게 전설의 진홍 장신구를 하사할 수도 있습니다.'
        },
        {
          speakerName: '수석 대장장이 불카누스',
          speakerRole: '방주 병기창장',
          speakerAvatar: '⚒️',
          text: '이 영혼 나침반의 금속을 녹여내면 어떤 어둠 속에서도 급소를 꿰뚫는 불멸의 성물이 탄생하네! 지휘관님의 영단을 기다리겠네!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 영지 발전 선택 [진홍 에테르 생명 환류]',
          desc: '성배의 무한한 생명 마력을 방주 의료소와 병참고에 환류하여 대량의 금화, 에테르, 희귀 마도 자원을 영지에 비축합니다.',
          flavorChoice: '💬 "성배의 마력을 방주 전역에 순환시켜라. 모든 대원과 피난민들에게 영원한 활력을 불어넣는다."',
          rewards: {
            gold: 10000,
            ether: 800,
            resources: { wood: 500, stone: 500, iron: 400, silk: 50, crystal: 30, void_shard: 20, pure_prefix_stone: 6, pure_suffix_stone: 6 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 원정단 육성 선택 [진홍 성배의 흡혈 성물 하사]',
          desc: '진홍 성배와 영혼 나침반의 힘이 깃든 전설 장신구 [진홍 성배의 불멸 성휘]를 하사합니다.',
          flavorChoice: '💬 "심연의 심장부로 나아갈 결사대에게 피의 권능을 다스리는 전설의 성유물을 하사하라."',
          rewards: {
            gold: 4000,
            ether: 350,
            resources: { pure_prefix_stone: 4, pure_suffix_stone: 4, void_shard: 12 },
            equipment: {
              id: 'equip_legend_blood_chalice_ring',
              baseName: '반지',
              name: '[진홍 성배의 불멸 성휘]',
              slot: 'accessory',
              level: 1,
              rarity: 'legendary',
              stats: { atk: 45, def: 35, hp: 550, luck: 28 },
              description: '6F 핏빛 대공의 성배와 7F 영혼 나침반을 결합해 정제한 전설 성유물. 공격 시 생명력을 흡수하고 치명타 확률을 대폭 상승시킨다.',
              icon: '🍷'
            }
          }
        }
      ]
    },
    status: 'locked'
  },
  {
    id: 'Q_EPIC_LORE_05',
    title: '에픽: [기사의 맹세와 진실의 거울] 단죄와 환영의 결속',
    type: 'epic',
    chapter: 2,
    summary: '8층과 9층의 광폭화 지배자를 쓰러뜨리고 [단죄의 기사단장 맹세 휘장]과 [미궁 지배자의 진실 거울 파편]을 회수하여 최종 결전의 문을 여세요.',
    flavorText: '한때 고결했던 기사단장의 맹세와 진실을 왜곡하는 거울의 미궁. 이 두 시련을 극복해야만 10층 심연의 군주에게 도달하는 진실의 문이 열린다.',
    objectives: [
      { description: '🎖️ [맹세 휘장] (8F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false },
      { description: '🪞 [진실 거울 파편] (9F 광폭화 보스 전리품) 회수', current: 0, required: 1, isCompleted: false }
    ],
    requiredResources: { relic_floor_8: 1, relic_floor_9: 1 },
    rewards: {
      gold: 8000,
      ether: 600,
      resources: { pure_prefix_stone: 6, pure_suffix_stone: 6, void_shard: 15 }
    },
    epicStory: {
      epilogueTitle: '📜 에픽 서사: 단죄의 맹세 복원과 진실의 거울 완성',
      dialogues: [
        {
          speakerName: '타락에서 해방된 기사단장의 영혼',
          speakerRole: '고대 성기사단장',
          speakerAvatar: '🎖️',
          text: '…감사하오, 방주의 수호자들이여. 억겁의 광기와 타락 속에서 마침내 명예로운 기사의 맹세를 되찾았소. 나의 휘장과 거울의 파편을 그대들에게 맡기겠소…'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대',
          speakerAvatar: '🛡️',
          text: '진실의 거울이 완성되자 심연 8층과 9층의 연무가 걷히고 완전히 정화되었습니다! 8~9층 마물들의 연무 강화(공/방 +40%, +45%)가 해제되었으며, 10층 심연의 심장부로 통하는 시공의 장벽이 열렸습니다! 눈앞에 아스모데우스의 옥좌가 보입니다!'
        },
        {
          speakerName: '성녀 발키리아',
          speakerRole: '성화의 대사제',
          speakerAvatar: '✨',
          text: '사령관님, 기사단의 고대 군자금과 마도 보물을 영지의 방벽과 성채에 축적할 수도 있고, 10층 최종 결전에 맞서 기사단장의 신성 결계가 깃든 전설 판금 갑주를 전열 영웅에게 수여할 수도 있습니다.'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 영지 발전 선택 [기사단의 고대 성채 요새화]',
          desc: '기사단의 마도 비축물자와 거울의 순수 마력을 영지에 투입하여 성채의 전 자원과 금화를 비약적으로 증축합니다.',
          flavorChoice: '💬 "기사단의 영광을 영지의 요새로 계승하라. 방주를 난공불락의 철벽 성채로 강화한다!"',
          rewards: {
            gold: 14000,
            ether: 1200,
            resources: { iron: 600, stone: 600, crystal: 40, void_shard: 30, pure_prefix_stone: 8, pure_suffix_stone: 8 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 원정단 육성 선택 [단죄 기사단의 성역 판금갑 수여]',
          desc: '기사단장의 맹세와 진실의 거울로 제련한 결전용 전설 중갑 [단죄 성역의 거울 판금갑]을 하사합니다.',
          flavorChoice: '💬 "10층 심연 군주와의 최종 결전이다. 기사단장의 불굴의 성역 갑주를 결사대에게 하사하라!"',
          rewards: {
            gold: 5000,
            ether: 500,
            resources: { pure_prefix_stone: 5, pure_suffix_stone: 5, void_shard: 15 },
            equipment: {
              id: 'equip_legend_paladin_mirror_plate',
              baseName: '판금 갑옷',
              name: '[단죄 성역의 거울 판금갑]',
              slot: 'armor',
              level: 1,
              rarity: 'legendary',
              stats: { def: 65, hp: 850, luck: 30 },
              description: '8F 기사단장의 맹세 휘장과 9F 진실의 거울 파편으로 담금질한 전설 갑주. 받는 모든 피해를 15% 감소시키고 치명타 공격을 굴절시킨다.',
              icon: '🛡️'
            }
          }
        }
      ]
    },
    status: 'locked'
  },
  // === Chapter 2: 태초의 공허, 그리고 균열의 심장 ===
  {
    id: 'Q_SLAY_BOSS_06',
    title: '제2장: 핏빛 대공 토벌 (6F 보스 토벌 & 7F 해금)',
    type: 'main',
    chapter: 2,
    summary: '6층 핏빛 성역의 지배자 [핏빛 대공]을 토벌하고 7층 [망각의 묘역] 진입로를 개방하세요.',
    flavorText: '공허 너머에 숨겨져 있던 핏빛의 회랑. 피에 굶주린 대공을 쓰러뜨려 심연 중층부 개척의 첫 발을 내딛어라.',
    objectives: [
      { description: '6층 보스 [핏빛 대공] 토벌 & 7층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1500,
      ether: 100,
      resources: { wood: 100, iron: 80, pure_prefix_stone: 2 }
    },
    status: 'locked'
  },
  {
    id: 'Q_EXPEDITION_6F',
    title: '연계 퀘스트: 핏빛 성역의 정화 작전',
    type: 'field',
    chapter: 2,
    summary: '6층 핏빛 성역을 탐험하며 핏빛 늑대와 타락한 사제 무리를 격퇴하세요.',
    flavorText: '성역을 배회하는 마수들이 방주 후방을 교란하고 있다. 척후대를 파견해 소탕하라.',
    objectives: [
      { description: '6층 심연 마물 3회 토벌', current: 0, required: 3, isCompleted: false }
    ],
    rewards: {
      gold: 800,
      ether: 60,
      resources: { leather: 40, herb: 30 }
    },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_07',
    title: '제2장: 망각의 묘지기 (7F 보스 토벌 & 8F 해금)',
    type: 'main',
    chapter: 2,
    summary: '7층 망각의 묘역 최심부의 [망각의 묘지기]를 토벌하고 8층 [단죄의 성채] 진입로를 개방하세요.',
    flavorText: '죽음조차 잊혀진 자들이 모이는 묘역. 사신의 낫을 휘두르는 묘지기를 잠재우고 억울한 영혼들을 성불시켜라.',
    objectives: [
      { description: '7층 보스 [망각의 묘지기] 토벌 & 8층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 2000,
      ether: 150,
      resources: { iron: 120, bone: 20, pure_suffix_stone: 2 }
    },
    status: 'locked'
  },
  {
    id: 'Q_BARRACKS_TRAIN_2ND',
    title: '연계 퀘스트: 영웅들의 한계 돌파 (2차 승급)',
    type: 'promotion',
    chapter: 2,
    summary: '영혼의 성소에서 용병 1명을 2차 상위 직업(마스터 티어)으로 승급시키세요.',
    flavorText: '더 깊은 심연의 압력을 견디기 위해선 한계를 초월한 궁극의 직업 각성이 필요하다.',
    objectives: [
      { description: '2차 전직 용병 1명 달성', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 2500,
      ether: 200,
      resources: { void_shard: 8, pure_prefix_stone: 3, pure_suffix_stone: 3 }
    },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_08',
    title: '제2장: 타락한 기사단장 (8F 보스 토벌 & 9F 해금)',
    type: 'main',
    chapter: 2,
    summary: '8층 단죄의 성채를 수호하는 [타락한 기사단장]을 처치하여 9층 [환영의 미궁] 진입로를 개방하세요.',
    flavorText: '한때 빛을 따르던 성기사단장이 심연의 저주에 굴복했다. 그에게 영원한 안식과 명예로운 최후를 안겨주어라.',
    objectives: [
      { description: '8층 보스 [타락한 기사단장] 토벌 & 9층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 2500,
      ether: 200,
      resources: { leather: 100, crystal: 15, pure_prefix_stone: 3 }
    },
    status: 'locked'
  },
  {
    id: 'Q_ENCHANT_MASTER',
    title: '연계 퀘스트: 심연 마도 인챈트 극의',
    type: 'field',
    chapter: 2,
    summary: '심연의 병기창에서 순수 접두석 또는 접미석을 사용하여 최고 등급 인챈트를 1회 완료하세요.',
    flavorText: '심연 9층과 10층의 괴수들에게 일격을 가하기 위해선 장비에 마도의 극의를 새겨넣어야 한다.',
    objectives: [
      { description: '순수 마도석 인챈트 1회 부여', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 1500,
      ether: 120,
      resources: { pure_prefix_stone: 2, pure_suffix_stone: 2 }
    },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_09',
    title: '제2장: 거울의 미궁 (9F 보스 토벌 & 10F 해금)',
    type: 'main',
    chapter: 2,
    summary: '9층 환영의 미궁 중심에서 [미궁의 지배자]를 물리치고 마침내 최종 10층 [심연의 심장]으로 진입하세요.',
    flavorText: '모든 진실이 왜곡되는 거울의 미궁. 거짓된 환영을 깨부수고 심연의 군주가 기다리는 옥좌의 문을 열어라.',
    objectives: [
      { description: '9층 보스 [미궁의 지배자] 토벌 & 10층 해금', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 3500,
      ether: 300,
      resources: { void_shard: 15, crystal: 20, pure_suffix_stone: 4 }
    },
    status: 'locked'
  },
  {
    id: 'Q_SLAY_BOSS_10',
    title: '제2장: 심연의 군주 (10F 최종 결전)',
    type: 'main',
    chapter: 2,
    summary: '10층 심연의 심장부에 군림하는 [심연의 군주 아스모데우스]를 토벌하고 제2장 심연의 종언을 선포하세요.',
    flavorText: '태초의 공허 깊은 곳, 마침내 모든 붕괴의 근원인 아스모데우스와 대면했다. 인류의 미래를 걸고 최후의 일격을 날려라!',
    objectives: [
      { description: '10층 보스 [심연의 군주 아스모데우스] 토벌', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 10000,
      ether: 1000,
      resources: { void_shard: 50, pure_prefix_stone: 8, pure_suffix_stone: 8 }
    },
    epicStory: {
      epilogueTitle: '📜 에픽 서사: 심연의 종언과 신세계의 개벽',
      dialogues: [
        {
          speakerName: '심연의 군주 아스모데우스',
          speakerRole: '태초의 심연 군주',
          speakerAvatar: '👑',
          text: '…나를 베어넘긴 필멸자들이여. 너희의 의지가 진정 심연의 억겁을 뛰어넘었도다. 방주여, 이제 빛의 대지 위로 날아오르라…'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대',
          speakerAvatar: '🛡️',
          text: '지휘관님! 아스모데우스의 흑관이 무너지며 심연의 균열이 닫히고 있습니다! 하늘 위로 태양의 빛이 비쳐듭니다!'
        },
        {
          speakerName: '성녀 발키리아',
          speakerRole: '성화의 대사제',
          speakerAvatar: '✨',
          text: '우리가 해냈습니다… 지휘관님의 지혜와 결사대의 헌신이 인류의 방주를 구원하였습니다. 최후의 전리품으로 영지의 영원한 태평성대를 선포할지, 결사대에게 군주의 신화 성관을 하사할지 명을 내려주십시오!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 영지 발전 선택 [영원한 태평성대와 지상 비상]',
          desc: '심연 군주의 모든 보물을 국고로 귀속시키고 방주를 지상 낙원으로 완성합니다.',
          flavorChoice: '💬 "우리는 살아남았다. 지상 위에서 영원한 번영을 누리리라."',
          rewards: {
            gold: 15000,
            ether: 1500,
            resources: { void_shard: 60, crystal: 40, pure_prefix_stone: 10, pure_suffix_stone: 10 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 원정단 육성 선택 [심연 군주의 절대 성관 수여]',
          desc: '심연 군주 아스모데우스의 권능이 깃든 신화 장비 [심연 군주의 절대 성관]을 하사합니다.',
          flavorChoice: '💬 "영웅들의 헌신에 최고의 경의를. 군주의 성관을 수호자에게 하사하라."',
          rewards: {
            gold: 5000,
            ether: 500,
            resources: { void_shard: 30, pure_prefix_stone: 5, pure_suffix_stone: 5 },
            equipment: {
              id: 'equip_legend_asmodeus_crown',
              baseName: '성관',
              name: '[심연 군주의 절대 성관]',
              slot: 'accessory',
              level: 1,
              rarity: 'legendary',
              stats: { atk: 50, def: 40, hp: 500, luck: 35 },
              description: '10층 심연의 군주 아스모데우스가 착용하던 절대 권능의 성관.',
              icon: '👑'
            }
          }
        }
      ]
    },
    status: 'locked'
  },
  // === Chapter 3: 초월 엔드 컨텐츠 — 무간도의 종언 ===
  {
    id: 'Q_EPIC_AVICI_ENDING',
    title: '에픽: [무간의 종언] 태초의 공허를 닫는 자',
    type: 'epic',
    chapter: 3,
    summary: '무간도 위험도 10,000에 도달하여 진 최종 보스 [무간의 지배자 아르케오스]의 광폭화를 잠재우고 모든 심연을 영구 봉인하세요.',
    flavorText: '끝없는 억겁의 지옥 무간도. 태초의 공허를 베어내면 비로소 인류의 방주는 영원한 여명의 빛으로 비상하리라.',
    objectives: [
      { description: '🌌 [무간도] 위험도 10,000 광폭화 진 최종 보스(아르케오스) 토벌', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 50000,
      ether: 5000,
      resources: { void_shard: 100, crystal: 100, pure_prefix_stone: 20, pure_suffix_stone: 20 }
    },
    epicStory: {
      epilogueTitle: '📜 전설의 대서사: 모든 심연의 영구 봉인과 여명의 방주',
      dialogues: [
        {
          speakerName: '무간의 지배자 아르케오스',
          speakerRole: '태초의 공허 창조주',
          speakerAvatar: '🌌',
          text: '…태초의 어둠조차 너희의 영혼이 뿜어내는 온기를 삼키지 못하였구나. 억겁의 시련을 통과한 자들이여, 이제 심연의 모든 균열을 영구히 봉인하노라… 인간들이여, 너희가 피워낸 빛의 세계로 돌아가라.'
        },
        {
          speakerName: '성녀 발키리아',
          speakerRole: '성화의 대사제',
          speakerAvatar: '✨',
          text: '성채의 성화가 전 우주로 뻗어나가는 성스러운 황금빛 날개가 되었습니다! 심연의 모든 균열이 닫히고, 방주가 대지 위로 찬란히 안착합니다! 사령관님, 우리가 세상을 구원했습니다!'
        },
        {
          speakerName: '선봉대장 로이드',
          speakerRole: '방주 수호대 총대장',
          speakerAvatar: '🛡️',
          text: '지휘관님… 우리가 마침내 심연의 억겁을 끝냈습니다! 방주의 모든 대원과 피난민들이 총사령관님께 승리의 경례를 올립니다! 영원히 빛날 우리의 승리입니다!'
        },
        {
          speakerName: '수석 대장장이 불카누스',
          speakerRole: '방주 병기창장',
          speakerAvatar: '⚒️',
          text: '크하하! 심연의 끝에서 건져 올린 태초의 빛으로 불멸의 창세 무구를 벼려냈네! 인류 역사상 가장 위대한 영웅에게 바치겠네!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 신세계의 개벽 [태양의 제국 건설 (영지 발전)]',
          desc: '심연의 모든 마력을 방주의 대지에 환류하여 끝없는 풍요와 번영의 지상 낙원을 완성합니다.',
          flavorChoice: '💬 "우리는 어둠을 이겨냈다. 이제 지상 위에 영원히 번영할 태양의 제국을 세우리라!"',
          rewards: {
            gold: 100000,
            ether: 10000,
            resources: { wood: 1000, stone: 1000, iron: 1000, food: 1000, crystal: 100, void_shard: 100, pure_prefix_stone: 50, pure_suffix_stone: 50 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 영원한 전설 [불멸의 수호 성단 (원정단 육성)]',
          desc: '태초의 창세 에너지가 깃든 궁극의 초월 무기 [태초의 창세 성검]을 결사대에 영구 하사합니다.',
          flavorChoice: '💬 "심연을 닫은 영웅들의 검은 영원히 빛나리라. 불멸의 성검을 수호자에게 하사하라!"',
          rewards: {
            gold: 50000,
            ether: 5000,
            resources: { pure_prefix_stone: 30, pure_suffix_stone: 30, void_shard: 50 },
            equipment: {
              id: 'equip_mythic_genesis_blade',
              baseName: '창세검',
              name: '[태초의 창세 성검]',
              slot: 'weapon',
              level: 1,
              rarity: 'legendary',
              stats: { atk: 100, def: 60, hp: 1000, luck: 50 },
              description: '무간도의 공허를 가르고 모든 심연을 봉인한 태초의 창세 성검. 신화적 권능이 깃들어 있다.',
              icon: '✨'
            }
          }
        }
      ]
    },
    status: 'locked'
  },

  // =========================================================================
  // ⚔️ [연계 시나리오 1] 몰락한 성기사단의 마지막 맹세 (1F ➔ 3F ➔ 8F)
  // =========================================================================
  {
    id: 'Q_SCENARIO_01',
    title: '⚔️ 대형 연계 에픽: 몰락한 성기사단의 맹세',
    type: 'epic',
    chapter: 1,
    summary: '1층 척후병의 유언 수습 ➔ 3층 보급관 엘릭 접선 ➔ 8층 기사단장 베른하르트 결판으로 이어지는 3단계 대형 연계 서사입니다.',
    flavorText: '심연의 어둠 속으로 먼저 뛰어들었던 성기사단 선발대. 그들의 꺾이지 않는 맹세와 타락한 단장을 구원하여 방주의 성스러운 유산을 되찾으세요.',
    objectives: [
      { description: '[1단계] 1층 침묵의 회랑: 쓰러진 척후병 루카스의 군번줄 수습', current: 0, required: 1, isCompleted: false },
      { description: '[2단계] 3층 에테르 광맥: 은신 중인 보급관 엘릭과 접선 및 유품 전달', current: 0, required: 1, isCompleted: false },
      { description: '[3단계] 8층 단죄의 성채: 마기에 잠식된 기사단장 베른하르트 결판', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 3000,
      ether: 200,
      supplies: [{ key: 'bandage', name: '치유 붕대', icon: '🩹', qty: 3 }]
    },
    epicStory: {
      epilogueTitle: '단죄의 성채의 결말',
      dialogues: [
        {
          speakerName: '기사단장 베른하르트',
          speakerRole: '타락한 성기사단장',
          speakerAvatar: '⛓️',
          text: '크윽... 지휘관인가... 내가 심연의 마기에 굴복하기 전에... 나를 끝내다오... 나의 성검이 더는 더럽혀져서는 안 된다!'
        },
        {
          speakerName: '보급관 엘릭',
          speakerRole: '성기사단 부관',
          speakerAvatar: '🛡️',
          text: '단장님! 저희는 지휘관님과 함께 성기사단의 맹세를 되찾으러 왔습니다!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 성기사단의 명예 복원 (영지 성유물 봉헌)',
          desc: '성기사단의 거룩한 맹세를 방주에 봉헌하여 전 대원의 신성 저항과 방어 결계를 강화합니다.',
          flavorChoice: '💬 "기사단의 명예는 꺾이지 않았다. 이 성스러운 유품을 방주의 제단에 영구 봉헌하노라!"',
          rewards: {
            gold: 3500,
            ether: 250,
            resources: { pure_prefix_stone: 2, pure_suffix_stone: 2 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 단죄의 성검 계승 (원정대 8티어 성검 하사)',
          desc: '기사단장 베른하르트의 의지가 담긴 8티어 신성 제식 성검 [단죄의 서약 검]을 결사대에 하사합니다.',
          flavorChoice: '💬 "단장님의 뜻을 이어받아 심연의 어둠을 가르리라. 단죄의 성검을 결사대에 부여하라!"',
          rewards: {
            gold: 2000,
            ether: 150,
            equipment: {
              id: 'equip_scenario_paladin_sword',
              baseName: '단죄의 성검',
              name: '[단죄의 서약 검]',
              slot: 'weapon',
              level: 1,
              rarity: 'epic',
              stats: { atk: 45, def: 25, hp: 300, luck: 20 },
              description: '타락을 이겨낸 기사단장 베른하르트의 유품. 신성한 단죄의 불꽃이 깃들어 있다.',
              icon: '⚔️'
            }
          }
        }
      ]
    },
    status: 'locked'
  },

  // =========================================================================
  // 🧪 [연계 시나리오 2] 기억을 잃은 연금술사와 만화경의 저주 (3F ➔ 6F ➔ 9F)
  // =========================================================================
  {
    id: 'Q_SCENARIO_02',
    title: '🧪 대형 연계 에픽: 연금술사와 만화경의 저주',
    type: 'epic',
    chapter: 1,
    summary: '3층 연금술사 이안 접선 ➔ 6층 자홍빛 시약 3병 회수 ➔ 9층 만화경 속 복제 자아와의 결판으로 이어지는 3단계 연계 서사입니다.',
    flavorText: '기억을 잃은 채 광맥을 헤매던 천재 연금술사 이안. 심연의 지식을 탐하다가 둘로 나뉜 그의 흩어진 자아와 현자의 비전을 하나로 통합하세요.',
    objectives: [
      { description: '[1단계] 3층 에테르 광맥: 방랑 연금술사 이안과 접선 및 플라스크 안정화', current: 0, required: 1, isCompleted: false },
      { description: '[2단계] 6층 통곡의 늪: 광기의 늪지대에서 잃어버린 자홍빛 시약 3병 회수', current: 0, required: 1, isCompleted: false },
      { description: '[3단계] 9층 환영의 미궁: 심연에 닿은 만화경 속 복제 기억체와 진실 통합', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 4000,
      ether: 250,
      resources: { crystal: 5, herb: 20 }
    },
    epicStory: {
      epilogueTitle: '만화경과 현자의 돌',
      dialogues: [
        {
          speakerName: '연금술사 이안',
          speakerRole: '방랑 연금술사',
          speakerAvatar: '🧪',
          text: '그렇군... 거울 속에 갇혀 있던 것은 내 오만함이었어. 지휘관님 덕분에 마침내 부서진 영혼이 하나로 완성되었습니다.'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 초월의 현자의 돌 연성 (영지 연금술 대폭 강화)',
          desc: '완성된 기억으로 전설의 오파츠 [초월의 현자의 돌]을 연성하여 방주 연금 공방에 영구 안치합니다.',
          flavorChoice: '💬 "현자의 돌을 방주에 안치하라! 모든 에테르와 마도 재화의 변환이 극대화되리라!"',
          rewards: {
            gold: 4500,
            ether: 350,
            resources: { pure_prefix_stone: 3, pure_suffix_stone: 3 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 만화경의 기억 비전서 (원정대 초월 마도서 수여)',
          desc: '시공간 굴절 비전이 담긴 9티어 전설 비전서 [만화경의 기억 비전서]를 결사대 마법사에게 수여합니다.',
          flavorChoice: '💬 "이 비전으로 차원을 굴절시켜라! 결사대에게 초월의 마도서를 하사하노라!"',
          rewards: {
            gold: 2500,
            ether: 200,
            resources: { pure_prefix_stone: 2, void_shard: 5 }
          }
        }
      ]
    },
    status: 'locked'
  },

  // =========================================================================
  // 🩸 [연계 시나리오 3] 성혈의 저주받은 서약과 발키리의 구원 (6F ➔ 7F ➔ 10F)
  // =========================================================================
  {
    id: 'Q_SCENARIO_03',
    title: '🩸 대형 연계 에픽: 성혈의 서약과 발키리의 구원',
    type: 'epic',
    chapter: 2,
    summary: '6층 발키리 실비아 구호 ➔ 7층 은둔사제 카엘 접선 ➔ 10층 심연의 옥좌 제단 정화로 이어지는 3단계 연계 서사입니다.',
    flavorText: '심연 군주의 피로 맺은 저주받은 서약에 고통받는 발키리 처형자 실비아. 거룩한 영혼 정화수로 제단을 정화하고 그녀를 영원한 안식으로 인도하세요.',
    objectives: [
      { description: '[1단계] 6층 통곡의 늪: 피를 흘리는 발키리 처형자 실비아 구호 및 저주 확인', current: 0, required: 1, isCompleted: false },
      { description: '[2단계] 7층 용암 심층: 붉은 용암 바다 속 은둔사제 카엘에게서 영혼 정화수 획득', current: 0, required: 1, isCompleted: false },
      { description: '[3단계] 10층 심연의 옥좌: 최종 제단 정화 및 성혈의 흡혈 저주 해방', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 5000,
      ether: 300,
      resources: { bone: 25, void_shard: 5 }
    },
    epicStory: {
      epilogueTitle: '성혈의 정화와 해방',
      dialogues: [
        {
          speakerName: '성혈의 처녀 실비아',
          speakerRole: '해방된 성녀',
          speakerAvatar: '🕊️',
          text: '마침내... 저주가 풀렸습니다. 제 피는 더는 마물의 먹이가 아니라, 방주를 지키는 거룩한 가호가 될 것입니다.'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🏛️ 순결한 성혈의 묵주 (영지 신성 가호 봉헌)',
          desc: '성혈의 정수가 담긴 10티어 전설 성유물 [순결한 성혈의 묵주]를 방주 중앙에 안치하여 전 대원 회복을 증폭합니다.',
          flavorChoice: '💬 "성혈의 묵주를 거점에 봉헌하라! 방주의 모든 대원에게 영구 안식과 재생의 축복을!"',
          rewards: {
            gold: 5500,
            ether: 400,
            resources: { pure_prefix_stone: 3, pure_suffix_stone: 3 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 진홍 혈염의 파멸 대검 (결사대 10티어 신화 대검)',
          desc: '흡혈의 저주를 역이용한 궁극의 10티어 무기 [진홍 혈염의 파멸 대검]을 결사대 전사에게 하사합니다.',
          flavorChoice: '💬 "적들의 피를 심판의 불꽃으로 바꾸어라! 결사대에게 진홍 혈염의 대검을 수여한다!"',
          rewards: {
            gold: 3000,
            ether: 200,
            equipment: {
              id: 'equip_scenario_blood_sword',
              baseName: '혈염 대검',
              name: '[진홍 혈염의 파멸 대검]',
              slot: 'weapon',
              level: 1,
              rarity: 'legendary',
              stats: { atk: 65, def: 30, hp: 450, luck: 25 },
              description: '심연의 흡혈 저주를 성스러운 불꽃으로 정화한 10티어 대검. 공격 시 적의 체력을 흡수한다.',
              icon: '🗡️'
            }
          }
        }
      ]
    },
    status: 'locked'
  },

  // =========================================================================
  // ⏳ [연계 시나리오 4] 시공간을 걷는 방랑자 크로노스 (4F ➔ 5F ➔ 11F)
  // =========================================================================
  {
    id: 'Q_SCENARIO_04',
    title: '⏳ 대형 연계 에픽: 크로노스와 시공간의 나침반',
    type: 'epic',
    chapter: 2,
    summary: '4층 크로노스 회중시계 조각 수습 ➔ 5층 시간 앵커 정렬 ➔ 11층 시간 종착역 아르케오스 대면으로 이어지는 3단계 연계 서사입니다.',
    flavorText: '왜곡된 시공간을 떠도는 방랑자 크로노스의 회중시계를 수리하여 차원의 나침반을 완전한 [시공간의 나침반]으로 각성시키세요.',
    objectives: [
      { description: '[1단계] 4층 거울의 미궁: 심연의 균열에서 차원의 태엽 부품 수습 및 크로노스 접선', current: 0, required: 1, isCompleted: false },
      { description: '[2단계] 5층 무너진 신전: 원초의 제단에서 시간 앵커와 회중시계 동기화', current: 0, required: 1, isCompleted: false },
      { description: '[3단계] 11층 무간지옥 아비치: 시간 종착역에서 아르케오스와 대면 및 시간 권능 수렴', current: 0, required: 1, isCompleted: false }
    ],
    rewards: {
      gold: 6000,
      ether: 400,
      resources: { void_shard: 8, crystal: 5 }
    },
    epicStory: {
      epilogueTitle: '시간의 종착역과 시공간 나침반 각성',
      dialogues: [
        {
          speakerName: '시공간 초월자 아르케오스',
          speakerRole: '무간도의 인도자',
          speakerAvatar: '🌌',
          text: '필멸자의 발걸음이 마침내 시간의 끝에 닿았구나. 윤회의 굴레를 넘은 자여, 네가 지닌 차원의 나침반에 영구한 시간의 숨결을 불어넣어 [시공간의 나침반]으로 각성시키노라!'
        }
      ],
      choices: [
        {
          id: 'domain',
          title: '🧭 [시공간의 나침반] 완전 각성 (용병 긴급 이송 0턴 즉시 합류)',
          desc: '차원의 나침반을 완전히 대체하는 [시공간의 나침반]을 각성하여, 전투 중 용병 긴급 이송 턴을 0턴으로 소멸시켜 즉시 합류시킵니다.',
          flavorChoice: '💬 "시공간의 나침반으로 방주의 모든 원정대를 시공간의 제약에서 해방하노라!"',
          rewards: {
            gold: 6000,
            ether: 500,
            resources: { pure_prefix_stone: 5, pure_suffix_stone: 5, void_shard: 10 }
          }
        },
        {
          id: 'expedition',
          title: '⚔️ 시간의 권능과 결사대 축복 ([시공간의 나침반] + 대량 자원)',
          desc: '[시공간의 나침반]을 각성하고 시간 초월의 공허 파편과 마도석을 결사대에 하사합니다.',
          flavorChoice: '💬 "시간의 지혜를 결사대의 검에 깃들이리라! 시공간의 나침반과 함께 무간도를 돌파하라!"',
          rewards: {
            gold: 4000,
            ether: 300,
            resources: { void_shard: 12, pure_prefix_stone: 4, pure_suffix_stone: 4 }
          }
        }
      ]
    },
    status: 'locked'
  }
];