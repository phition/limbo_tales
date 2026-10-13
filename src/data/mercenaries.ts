import { Mercenary } from '../types/game';

export const INITIAL_HEROES_CONFIG: Mercenary[] = [
  {
    id: 'hero_01',
    name: '아이리스',
    title: '강철의 수호자',
    classId: 'squire',
    grade: 'rookie',
    level: 1,
    exp: 0,
    expToNext: 80,
    currentHp: 260,
    maxHp: 260,
    currentMp: 30,
    maxMp: 30,
    position: 'front',
    stats: { atk: 13, def: 17, spd: 7, luck: 10 },
    equippedSkills: ['squire_strike', 'squire_guard'],
    learnedSkills: ['squire_strike', 'squire_guard'],
    equipment: {},
    statusEffects: [],
    portraitPromptKey: 'hero_squire'
  },
  {
    id: 'hero_02',
    name: '시안',
    title: '신속한 그림자',
    classId: 'rogue',
    grade: 'rookie',
    level: 1,
    exp: 0,
    expToNext: 80,
    currentHp: 180,
    maxHp: 180,
    currentMp: 42,
    maxMp: 42,
    position: 'mid',
    stats: { atk: 19, def: 6, spd: 16, luck: 22 },
    equippedSkills: ['rogue_slash', 'rogue_smoke'],
    learnedSkills: ['rogue_slash', 'rogue_smoke'],
    equipment: {},
    statusEffects: [],
    portraitPromptKey: 'hero_rogue'
  }
];
