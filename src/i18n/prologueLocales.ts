import { SupportedLanguage } from './types';

export interface PrologueSceneLocale {
  actNumber: string;
  actTitle: string;
  subTitle: string;
  paragraphs: string[];
}

export interface PrologueUiLocale {
  modalTitle: string;
  pause: string;
  autoPlay: string;
  play: string;
  fullNarrative: string;
  skip: string;
  prevAct: string;
  nextAct: string;
  enterCitadel: string;
  logHeader: string;
  soundOn: string;
  soundOff: string;
}

export const PROLOGUE_UI_LOCALES: Record<SupportedLanguage, PrologueUiLocale> = {
  ko: {
    modalTitle: 'LIMBO: PROLOGUE CINEMATIC',
    pause: '일시정지',
    autoPlay: '자동재생',
    play: '재생',
    fullNarrative: '전체 줄거리',
    skip: '스킵',
    prevAct: '이전 장',
    nextAct: '다음 장',
    enterCitadel: '정신을 차리고 방주로 진입',
    logHeader: '방주의 기록: 프롤로그 전체 서사',
    soundOn: '소리 켜짐',
    soundOff: '음소거'
  },
  en: {
    modalTitle: 'LIMBO: PROLOGUE CINEMATIC',
    pause: 'Pause',
    autoPlay: 'Auto Play',
    play: 'Play',
    fullNarrative: 'Full Script',
    skip: 'Skip',
    prevAct: 'Prev Act',
    nextAct: 'Next Act',
    enterCitadel: 'Awaken & Enter Citadel',
    logHeader: 'Ark Chronicles: Prologue Full Narrative',
    soundOn: 'Sound On',
    soundOff: 'Muted'
  },
  ja: {
    modalTitle: 'LIMBO: PROLOGUE CINEMATIC',
    pause: '一時停止',
    autoPlay: '自動再生',
    play: '再生',
    fullNarrative: '全編あらすじ',
    skip: 'スキップ',
    prevAct: '前の幕',
    nextAct: '次の幕',
    enterCitadel: '意識を取り戻し方舟へ進む',
    logHeader: '方舟の記録：プロローグ全編叙事詩',
    soundOn: '音声ON',
    soundOff: 'ミュート'
  }
};

export const PROLOGUE_SCENES_LOCALES: Record<SupportedLanguage, PrologueSceneLocale[]> = {
  ko: [
    {
      actNumber: 'ACT I',
      actTitle: '심연의 잠식과 세계의 몰락',
      subTitle: 'THE ABYSSAL CATACLYSM',
      paragraphs: [
        '아득한 태초부터 찬란히 번영했던 지상의 왕국들과 문명들은, 하늘을 찢고 솟구쳐 오른 정체불명의 [심연(Abyss)]과 칠흑 같은 흑무에 의해 모조리 삼켜졌습니다.',
        '흑무가 닿은 모든 생명은 이성을 잃고 기괴한 마물이 되었으며, 태양마저 빛을 잃고 세계는 돌이킬 수 없는 멸망의 나락으로 침몰했습니다.'
      ]
    },
    {
      actNumber: 'ACT II',
      actTitle: '선봉대의 비극과 사령관의 혼수',
      subTitle: 'THE FALLEN VANGUARD',
      paragraphs: [
        '간신히 살아남은 생존자들과 함께 심연의 첫 진입로를 수색하던 선봉 원정대... 그러나 지하 깊은 곳에 도사리던 미지의 마물들에게 참혹한 기습을 당하고 말았습니다.',
        '생사를 함께했던 소중한 전우 한 명이 목숨을 잃었고, 사령관 또한 치명적인 마기 중독과 부상으로 의식을 잃은 채 성채로 긴급 후송되었습니다.'
      ]
    },
    {
      actNumber: 'ACT III',
      actTitle: '최후의 안식처, 방주 성채',
      subTitle: 'THE FLOATING ARK & DYING BONFIRE',
      paragraphs: [
        '심연 밖으로 겨우 탈출해 도달한 최후의 피난처, [방주 성채(The Floating Ark)]만이 차가운 허공 위에 간신히 떠 있습니다.',
        '성채 중앙의 고대 모닥불만이 마기를 막아내는 유일한 결계이지만, 에테르 동력이 고갈되어 성화의 불씨는 시시각각 차갑게 식어가고 있습니다.'
      ]
    },
    {
      actNumber: 'ACT IV',
      actTitle: '사령관의 각성과 새로운 희망',
      subTitle: 'AWAKENING OF THE COMMANDER',
      paragraphs: [
        '쓰러진 전우의 희생을 결코 헛되이 할 수 없습니다. 방주의 동력로를 복구하고 심연 10개 층에 도사리는 군주들을 토벌하려면 사령관님의 단호한 지휘가 절실합니다.',
        '결의에 찬 영웅들이 마침내 눈을 뜬 사령관님의 첫 명령을 기다리고 있습니다. 이제 성화를 다시 지피고 심연을 향해 진군하십시오!'
      ]
    }
  ],
  en: [
    {
      actNumber: 'ACT I',
      actTitle: 'Encroachment of the Abyss and the Fall of the World',
      subTitle: 'THE ABYSSAL CATACLYSM',
      paragraphs: [
        'The prosperous kingdoms and radiant civilizations of old were torn asunder and consumed by the enigmatic Abyss and suffocating Black Mist that surged from the shattered skies.',
        'Every living creature touched by the Black Mist lost its sanity, mutated into grotesque abominations; even the sun lost its light, casting the world into an irrecoverable abyss of doom.'
      ]
    },
    {
      actNumber: 'ACT II',
      actTitle: "Tragedy of the Vanguard and the Commander's Coma",
      subTitle: 'THE FALLEN VANGUARD',
      paragraphs: [
        'A vanguard expedition ventured forth with the surviving souls to scout the initial breach of the Abyss... only to be brutally ambushed by eldritch horrors lurking in the subterranean depths.',
        'A cherished comrade-in-arms fell in battle, and the Commander was gravely injured and corrupted by demonic miasma, falling unconscious while being evacuated back to the sanctuary.'
      ]
    },
    {
      actNumber: 'ACT III',
      actTitle: 'The Last Sanctuary: The Floating Ark',
      subTitle: 'THE FLOATING ARK & DYING BONFIRE',
      paragraphs: [
        'Escaping beyond the maw of the Abyss, the last survivors reached the Floating Ark, an ancient citadel drifting perilously above the cold, empty void.',
        'The ancient bonfire at the heart of the Ark serves as the sole barrier fending off the abyssal miasma, yet its ether reserves are dwindling, and the sacred embers grow colder with each passing moment.'
      ]
    },
    {
      actNumber: 'ACT IV',
      actTitle: 'Awakening of the Commander & A Dawn of Hope',
      subTitle: 'AWAKENING OF THE COMMANDER',
      paragraphs: [
        "The sacrifice of our fallen comrade must not be in vain. To restore the Ark's core and vanquish the Abyssal Overlords ruling the 10 depths, the Commander's resolute leadership is urgently needed.",
        'Resolute heroes stand ready, awaiting their first order from the awakened Commander. Rekindle the sacred bonfire, and march forth into the Abyss!'
      ]
    }
  ],
  ja: [
    {
      actNumber: 'ACT I',
      actTitle: '深淵の浸食と世界の崩壊',
      subTitle: 'THE ABYSSAL CATACLYSM',
      paragraphs: [
        '太古より栄華を極めた地上の諸王国と文明は、天を裂き湧き上がった正体不明の【深淵（アビス）】と漆黒の黒霧にことごとく呑み込まれました。',
        '黒霧に触れたすべての生命は理性を失い異形の魔物と化し、太陽さえも光を失い、世界は取り返しのつかない破滅の奈落へと沈んでいきました。'
      ]
    },
    {
      actNumber: 'ACT II',
      actTitle: '先鋒隊の悲劇と司令官の昏睡',
      subTitle: 'THE FALLEN VANGUARD',
      paragraphs: [
        'かろうじて生き延びた生存者たちと共に深淵の最初の進入口を捜索していた先鋒遠征隊……しかし地下深くに潜んでいた未知の魔物による凄惨な奇襲を受けてしまいます。',
        '生死を共にした大切な戦友が命を落とし、司令官もまた致命的な魔気の中毒と重傷により、意識を失ったまま城塞へと緊急搬送されました。'
      ]
    },
    {
      actNumber: 'ACT III',
      actTitle: '最後の安息の地、方舟城塞',
      subTitle: 'THE FLOATING ARK & DYING BONFIRE',
      paragraphs: [
        '深淵の外へと命からがら脱出して辿り着いた最後の避難所、【方舟城塞（The Floating Ark）】だけが冷たい虚空の上に辛うじて浮かんでいます。',
        '城塞中央の古代の篝火だけが魔気を防ぎ止める唯一の結界ですが、エーテル動力が枯渇し、聖火の残り火は刻一刻と冷たく消えかけています。'
      ]
    },
    {
      actNumber: 'ACT IV',
      actTitle: '司令官の覚醒と新たな希望',
      subTitle: 'AWAKENING OF THE COMMANDER',
      paragraphs: [
        '倒れた戦友の犠牲を決して無駄にはできません。方舟の動力炉を復旧し、深淵の10階層に君臨する魔王たちを討伐するため、今こそ司令官の確固たる指揮が必要です。',
        '決意に満ちた英雄たちが、ついに目を覚ました司令官の最初の命令を待っています。聖火を再び灯し、深淵へと進軍せよ！'
      ]
    }
  ]
};
