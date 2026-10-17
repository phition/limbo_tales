import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { useI18n } from '../hooks/useI18n';
import { ResourceBar } from '../components/ResourceBar';
import { LogPanel } from '../components/LogPanel';
import { ActionButton } from '../components/ActionButton';
import { Modal } from '../components/Modal';
import { LootSelectionModal } from '../components/LootSelectionModal';
import { HeroDetailModal } from '../components/HeroDetailModal';
import { MercenaryManageModal } from '../components/MercenaryManageModal';
import { MONSTERS, FLOOR_MONSTER_POOL, FLOOR_BOSS_MAP } from '../data/monsters';
import { CampBanterResult, MonsterData, MonsterType, DungeonItemSlot, STATUS_EFFECT_META, Mercenary } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { SoundManager } from '../managers/SoundManager';
import { GameManager } from '../managers/GameManager';
import { GameIcon } from '../components/GameIcon';
import { CustomAssetService } from '../services/CustomAssetService';
import { useCustomAssetVersion } from '../hooks/useCustomAssetVersion';
import { getFloorUniqueEvent, CLASS_GROUPS, findPartyHeroByClasses } from '../data/dungeonFloorEvents';
import { TutorialGuideOverlay } from '../components/TutorialGuideOverlay';

const FLOOR_NAMES_I18N: Record<string, string[]> = {
  ko: [
    '침묵의 회랑',
    '망령의 납골당',
    '에테르 광맥',
    '심연의 균열',
    '★ 원초의 제단',
    '핏빛 성역',
    '망각의 묘지',
    '단죄의 성채',
    '환영의 미궁',
    '★ 심연의 심장부',
    '★ 🌌 무간도 (Avici) [위험도 10,000]'
  ],
  en: [
    'Silent Cloister',
    'Ossuary of Phantoms',
    'Ether Vein',
    'Abyssal Rift',
    '★ Primordial Altar',
    'Crimson Sanctuary',
    'Graveyard of Oblivion',
    'Citadel of Condemnation',
    'Labyrinth of Illusions',
    '★ Heart of the Abyss',
    '★ 🌌 Avici [Danger 10,000]'
  ],
  ja: [
    '沈黙の回廊',
    '亡霊の納骨堂',
    'エーテル鉱脈',
    '深淵の亀裂',
    '★ 原初の祭壇',
    '血塗られた聖域',
    '忘却の墓地',
    '断罪の城塞',
    '幻影の迷宮',
    '★ 深淵の心臓部',
    '★ 🌌 無間道 (Avici) [危険度 10,000]'
  ]
};

export const FLOOR_NAMES = FLOOR_NAMES_I18N.ko;

interface DungeonTrapDef {
  id: string;
  name: string;
  icon: string;
  statusType: 'bleed' | 'poison' | 'burn' | 'freeze' | 'stun';
  statusLabel: string;
  statusIcon: string;
  duration: number;
  magnitude: number;
  desc: string;
  evadeVerb: string;
  hitVerb: string;
}

const DUNGEON_TRAPS: DungeonTrapDef[] = [
  {
    id: 'trap_spike',
    name: '흑철 가시 덫',
    icon: '🩸',
    statusType: 'bleed',
    statusLabel: '출혈',
    statusIcon: '🩸',
    duration: 3,
    magnitude: 0.07,
    desc: '바닥의 석판이 꺼지며 날카로운 흑철 가시가 솟구칩니다!',
    evadeVerb: '도약하여 가시를 회피',
    hitVerb: '가시에 찔려 자상 발생'
  },
  {
    id: 'trap_poison',
    name: '부식성 맹독 분출구',
    icon: '☠️',
    statusType: 'poison',
    statusLabel: '중독',
    statusIcon: '☠️',
    duration: 3,
    magnitude: 0.14,
    desc: '석벽 틈새에서 치명적인 부식성 독안개가 뿜어져 나옵니다!',
    evadeVerb: '바람을 타고 독안개 탈출',
    hitVerb: '독안개에 노출되어 맹독 감염'
  },
  {
    id: 'trap_flame',
    name: '화염 폭발 룬',
    icon: '🔥',
    statusType: 'burn',
    statusLabel: '화상',
    statusIcon: '🔥',
    duration: 3,
    magnitude: 0.08,
    desc: '바닥에 잠들어 있던 고대 화염 룬이 폭쇄하며 불길이 번집니다!',
    evadeVerb: '뒤로 굴러 폭염을 회피',
    hitVerb: '폭발에 휘말려 화상 발생'
  },
  {
    id: 'trap_frost',
    name: '극저온 서리 룬',
    icon: '❄️',
    statusType: 'freeze',
    statusLabel: '냉각',
    statusIcon: '❄️',
    duration: 2,
    magnitude: 0.04,
    desc: '순간적인 극저온 마력이 방출되며 주변 공기가 얼어붙습니다!',
    evadeVerb: '기민하게 서리 영역 이탈',
    hitVerb: '냉기에 노출되어 신체 동결'
  },
  {
    id: 'trap_stun',
    name: '낙석 충격 트랩',
    icon: '💫',
    statusType: 'stun',
    statusLabel: '기절',
    statusIcon: '💫',
    duration: 1,
    magnitude: 0,
    desc: '천장의 고대 암석이 굉음과 함께 머리 위로 쏟아져 내립니다!',
    evadeVerb: '낙석을 가볍게 회피',
    hitVerb: '파편 충격으로 휘청임'
  }
];

/** 층별 1~5인 마물 편대 생성기 */
function generateMonsterSquad(floor: number, isOvercharged: boolean = false, currentDanger: number = 0): MonsterData[] {
  if (floor === 11) {
    // 🌌 무간도: 1~10층의 모든 몬스터가 정예 + 광폭화 상태로 출현, 시작 레벨 50, 100위험도마다 레벨 +5.5 (최대 Lv.600)
    const pool = FLOOR_MONSTER_POOL[11] || FLOOR_MONSTER_POOL[10];
    const dangerBracket = Math.floor(currentDanger / 100);
    const scaledLevel = Math.min(600, Math.round(50 + dangerBracket * 5.5));
    const statMult = 2.4 * (1 + dangerBracket * 0.05);
    const count = Math.floor(Math.random() * 3) + 3; // 3~5마리

    const squad: MonsterData[] = [];
    const nameCountMap: Record<string, number> = {};

    const gmInstance = GameManager.getInstance();
    const isPurified = gmInstance.isFloorPurified(11);
    const miasmaMult = isPurified ? 1.0 : (1 + 10 * 0.05); // 🌫️ 심연의 연무 강화 (공/방 +50%)

    for (let i = 0; i < count; i++) {
      const monId = pool[Math.floor(Math.random() * pool.length)];
      const baseMon = MONSTERS[monId] || MONSTERS['monster_stalker'];
      nameCountMap[baseMon.name] = (nameCountMap[baseMon.name] || 0) + 1;

      const monData: MonsterData = {
        ...baseMon,
        name: baseMon.name.replace(/\[\s*(정예|광폭화?|호위)\s*\]/g, '').trim(),
        type: 'elite',
        level: scaledLevel,
        // 🌟 3층 이상(11층 무간도 포함) 보스 외 적 스탯 10% 증가 + 심연의 연무 강화 (11층은 전 스탯 확장 적용)
        maxHp: Math.max(100, Math.round(baseMon.maxHp * statMult * 0.8 * 1.10 * miasmaMult)),
        atk: Math.max(20, Math.round(baseMon.atk * statMult * 1.10 * 1.15 * miasmaMult)),
        def: Math.round(baseMon.def * statMult * 1.10 * miasmaMult),
        spd: Math.round((baseMon.spd + 15 + (Math.random() * 4 - 2)) * 1.10 * miasmaMult),
        luck: Math.round((baseMon.luck || 10) * statMult * 1.10 * miasmaMult),
        rewards: {
          ...baseMon.rewards,
          gold: Math.max(50, Math.floor(baseMon.rewards.gold * 3 * (1 + dangerBracket * 0.1))),
          ether: Math.max(10, Math.floor(baseMon.rewards.ether * 3 * (1 + dangerBracket * 0.1))),
          exp: Math.max(
            Math.floor(100 * (1 + Math.floor(currentDanger / 1000) * 0.10)),
            Math.floor(baseMon.rewards.exp * 2 * (1 + Math.floor(currentDanger / 1000) * 0.10))
          ),
        }
      };
      squad.push(monData);
    }

    const letterMap: Record<string, number> = {};
    squad.forEach(m => {
      if (nameCountMap[m.name] > 1) {
        const idx = (letterMap[m.name] || 0);
        letterMap[m.name] = idx + 1;
        const letter = String.fromCharCode(65 + idx);
        m.name = `${m.name} ${letter}`;
      }
    });
    return squad;
  }

  const pool = FLOOR_MONSTER_POOL[Math.min(floor, 10)] || FLOOR_MONSTER_POOL[1];
  if (!pool || pool.length === 0) return [JSON.parse(JSON.stringify(MONSTERS['monster_stalker']))];

  let count = 1;
  const rand = Math.random();
  if (floor === 1) {
    count = rand < 0.4 ? 1 : rand < 0.85 ? 2 : 3;
  } else if (floor === 2) {
    count = rand < 0.3 ? 2 : rand < 0.75 ? 3 : 4;
  } else if (floor === 3 || floor === 4) {
    count = rand < 0.25 ? 3 : rand < 0.7 ? 4 : 5;
  } else {
    count = rand < 0.3 ? 3 : rand < 0.7 ? 4 : 5;
  }

  // 🌟 [층별 레벨 3배수 보정 & 출현 마리수 비례 레벨 다운]
  // 1) 층별 레벨 가산치: (floor - 1) * 3 (1F: +0, 2F: +3, 3F: +6, 4F: +9, 5F: +12...)
  const floorLevelAdd = (floor - 1) * 3;
  // 2) 출현 마리수가 많을수록 몬스터 레벨 다운 (1마리: 0, 2마리: -1, 3마리: -2, 4마리: -3, 5마리: -4)
  const countLevelDown = Math.max(0, count - 1);

  const squad: MonsterData[] = [];
  const nameCountMap: Record<string, number> = {};
  const floorStatMult = 1 + (floor - 1) * 0.20; // 🌟 B안: 층당 20% 누적 가산 (1층 1.0x ~ 10층 2.8x)
  const nonBossMult = floor >= 3 ? 1.10 : 1.0; // 🌟 3층 이상 등장하는 보스 외 적 스탯 10% 증가

  // 🌫️ 심연의 연무 강화: 정화되지 않은 층은 층수 * 5%만큼 공격력과 방어력 강화 (정화 시 1.0)
  const gmInstance = GameManager.getInstance();
  const isPurified = gmInstance.isFloorPurified(floor);
  const miasmaMult = isPurified ? 1.0 : (1 + floor * 0.05);

  // 🌟 위험도(Danger)에 따른 정예 출현 규칙:
  // - 낮은 위험도 (위험도 < 35%): 정예 출현 없음 (0마리)
  // - 중간 위험도 (35% <= 위험도 < 70%): 정예 1마리만 출현
  // - 높은 위험도 (위험도 >= 70%): 최소 1마리 보장 + 각 몬스터 독립 판정으로 여러 마리 출현 가능 (지금처럼)
  const maxDanger = floor === 11 ? 10000 : (100 + (floor - 1) * 30);
  const actualDanger = currentDanger !== undefined && currentDanger > 0
    ? currentDanger
    : (GameManager.getInstance().dungeonDangerLevel || 0);
  const dangerRatio = actualDanger / maxDanger;

  const isLowDanger = dangerRatio < 0.35;
  const isMidDanger = dangerRatio >= 0.35 && dangerRatio < 0.70;
  // 중간 위험도에서는 편대 내 무작위 1마리만 정예로 지정
  const midEliteTargetIdx = isMidDanger ? Math.floor(Math.random() * count) : -1;

  for (let i = 0; i < count; i++) {
    const monId = pool[Math.floor(Math.random() * pool.length)];
    const baseMon = MONSTERS[monId] || MONSTERS['monster_stalker'];

    // 🌟 위험도에 따른 정예 마물(Elite) 판정
    let isElite = false;
    if (isLowDanger) {
      isElite = false; // 낮은 위험도: 정예 출현 없음
    } else if (isMidDanger) {
      isElite = (i === midEliteTargetIdx); // 중간 위험도: 1마리만 출현
    } else {
      // 높은 위험도: 최소 1마리 기본 보장 + 각 몬스터 기본 20% 확률 또는 원본이 elite (지금처럼 복수 출현 가능)
      isElite = (i === 0) || baseMon.type === 'elite' || Math.random() < 0.20;
    }

    const type: MonsterType = isElite ? 'elite' : (baseMon.type === 'boss' ? 'boss' : 'normal');
    const eliteMult = type === 'elite' ? 1.50 : 1.0; // 🌟 정예 마물 시 체력, 방어력, 속도 50% 상향
    const eliteAtkMult = type === 'elite' ? 1.15 : 1.0; // 🌟 정예 마물 시 공격력 15% 상향

    const cleanBaseName = baseMon.name.replace(/\[\s*(정예|광폭화?|호위)\s*\]/g, '').trim();
    const displayName = cleanBaseName; // 🌟 ELITE 뱃지로 표시되므로 [정예] 텍스트 생략

    nameCountMap[displayName] = (nameCountMap[displayName] || 0) + 1;
    const scaledLevel = Math.max(1, baseMon.level + floorLevelAdd - countLevelDown);

    const monData: MonsterData = {
      ...baseMon,
      name: displayName,
      type: type,
      level: scaledLevel,
      maxHp: Math.max(10, Math.round(baseMon.maxHp * floorStatMult * eliteMult * nonBossMult)),
      atk: Math.max(1, Math.round(baseMon.atk * floorStatMult * eliteAtkMult * nonBossMult * miasmaMult)),
      def: Math.round(baseMon.def * floorStatMult * eliteMult * nonBossMult * miasmaMult),
      spd: Math.round((baseMon.spd || 10) * floorStatMult * eliteMult * nonBossMult),
      luck: Math.round((baseMon.luck || 10) * floorStatMult * nonBossMult),
      rewards: {
        ...baseMon.rewards,
        gold: Math.max(5, Math.floor((baseMon.rewards.gold * (type === 'elite' ? 1.8 : 1.0)) / Math.sqrt(count))),
        ether: Math.max(1, Math.floor((baseMon.rewards.ether * (type === 'elite' ? 1.8 : 1.0)) / Math.sqrt(count))),
        exp: Math.max(10, Math.floor(((baseMon.rewards.exp * (type === 'elite' ? 1.8 : 1.0)) / Math.sqrt(count)) * (floor >= 6 && floor <= 10 ? 0.70 : 1.0))),
      }
    };
    squad.push(monData);
  }

  const letterMap: Record<string, number> = {};
  squad.forEach(m => {
    if (nameCountMap[m.name] > 1) {
      const idx = (letterMap[m.name] || 0);
      letterMap[m.name] = idx + 1;
      const letter = String.fromCharCode(65 + idx);
      m.name = `${m.name} ${letter}`;
    }
  });

  return squad;
}

/** 층별 고유 보스 및 호위 하수인 편대 생성 (1F~11F 무간도 보스 매핑) */
function generateBossSquad(floor: number, isOvercharged: boolean = false, currentDanger: number = 0): MonsterData[] {
  const gmInstance = GameManager.getInstance();

  if (floor === 11) {
    const isPurified = gmInstance.isFloorPurified(11);
    const miasmaMult = isPurified ? 1.0 : (1 + 10 * 0.05); // 🌫️ 심연의 연무 강화 (공/방 +50%)

    const dangerBracket = Math.floor(currentDanger / 100);
    const isTrueFinalBoss = currentDanger >= 10000;
    const bossKey = isTrueFinalBoss ? 'boss_avici_final' : (FLOOR_BOSS_MAP[1 + Math.floor(Math.random() * 10)] || 'boss_floor_10');
    const baseBoss = MONSTERS[bossKey] || MONSTERS['boss_floor_10'];
    const bossData: MonsterData = JSON.parse(JSON.stringify(baseBoss));
    bossData.type = 'boss';
    bossData.level = isTrueFinalBoss ? 600 : Math.min(600, Math.round(50 + dangerBracket * 5.5));
    const bossStatMult = isTrueFinalBoss ? (isOvercharged ? 2.0 : 1.0) : (2.8 * (1 + dangerBracket * 0.06));
    const floorStatMult = 1 + (11 - 1) * 0.20; // 🌟 B안: 11층 3.0x 누적 가산

    // 🌟 보스 이름에서 광폭화 텍스트 중복 방지 (광폭화는 전투 화면에서 뱃지로 표시)
    bossData.name = baseBoss.name.replace(/\[\s*(광폭화?|무간의\s*광폭\s*보스)\s*\]/g, '').trim();

    // 11층 심연의 연무: 모든 스탯(HP, ATK, DEF, SPD, LUCK)에 연무 강화 배율 전면 적용
    bossData.maxHp = Math.round(bossData.maxHp * bossStatMult * floorStatMult * miasmaMult);
    bossData.atk = Math.round(bossData.atk * bossStatMult * floorStatMult * miasmaMult);
    bossData.def = Math.round(bossData.def * bossStatMult * floorStatMult * miasmaMult);
    bossData.spd = Math.round((bossData.spd || 10) * floorStatMult * miasmaMult);
    bossData.luck = Math.round((bossData.luck || 10) * floorStatMult * miasmaMult);

    const pool = FLOOR_MONSTER_POOL[11] || FLOOR_MONSTER_POOL[10];
    const minions: MonsterData[] = [];
    const eliteMult = 1.50; // 정예 50% HP/DEF/SPD 상향

    for (let i = 0; i < 3; i++) {
      const mId = pool[Math.floor(Math.random() * pool.length)] || 'monster_stalker';
      const baseMinion: MonsterData = JSON.parse(JSON.stringify(MONSTERS[mId] || MONSTERS['monster_stalker']));
      const cleanMinionName = baseMinion.name.replace(/\[\s*(정예|광폭화?|호위)\s*\]/g, '').trim();
      baseMinion.name = `[호위] ${cleanMinionName} ${String.fromCharCode(65 + i)}`;
      baseMinion.level = Math.max(1, bossData.level - 2);
      baseMinion.type = 'elite';
      // 🌟 3층 이상(11층 포함) 보스 외 적(호위 하수인) 스탯 10% 증가 + 연무 전 스탯 강화
      baseMinion.maxHp = Math.max(200, Math.round(baseMinion.maxHp * bossStatMult * floorStatMult * eliteMult * 0.6 * 1.10 * miasmaMult));
      baseMinion.atk = Math.max(30, Math.round(baseMinion.atk * bossStatMult * floorStatMult * 0.7 * 1.10 * 1.15 * miasmaMult));
      baseMinion.def = Math.round(baseMinion.def * bossStatMult * floorStatMult * eliteMult * 0.7 * 1.10 * miasmaMult);
      baseMinion.spd = Math.round((baseMinion.spd || 10) * floorStatMult * eliteMult * 1.10 * miasmaMult);
      baseMinion.luck = Math.round((baseMinion.luck || 10) * floorStatMult * 1.10 * miasmaMult);
      const danger1000Bracket = Math.floor(currentDanger / 1000);
      const danger1000ExpMult = 1 + danger1000Bracket * 0.10;
      baseMinion.rewards = {
        ...baseMinion.rewards,
        exp: Math.max(
          Math.floor(100 * danger1000ExpMult),
          Math.floor(baseMinion.rewards.exp * 2 * danger1000ExpMult)
        )
      };
      minions.push(baseMinion);
    }

    return [...minions, bossData];
  }

  const f = Math.min(10, Math.max(1, floor));
  const isPurified = gmInstance.isFloorPurified(f);
  const miasmaMult = isPurified ? 1.0 : (1 + f * 0.05); // 🌫️ 심연의 연무 강화 (공/방 +f*5%)

  const bossKey = FLOOR_BOSS_MAP[f] || 'boss_floor_1';
  const baseBoss = MONSTERS[bossKey] || MONSTERS['boss_floor_1'];
  const bossData: MonsterData = JSON.parse(JSON.stringify(baseBoss));
  bossData.type = 'boss';
  // 🌟 광폭화 텍스트는 이름에 추가하지 않음 (전투 화면에서 뱃지로 표시)
  bossData.name = baseBoss.name.replace(/\[\s*(광폭화?)\s*\]/g, '').trim();

  const pool = FLOOR_MONSTER_POOL[f] || FLOOR_MONSTER_POOL[1];
  const minionPool = pool.filter(id => id !== bossKey);
  const minionCount = f >= 4 ? 3 : 2;
  const minions: MonsterData[] = [];

  const floorStatMult = 1 + (f - 1) * 0.20; // 🌟 B안: 층당 20% 누적 가산

  bossData.maxHp = Math.round(baseBoss.maxHp * floorStatMult);
  bossData.atk = Math.round(baseBoss.atk * floorStatMult * miasmaMult);
  bossData.def = Math.round(baseBoss.def * floorStatMult * miasmaMult);
  bossData.spd = Math.round((baseBoss.spd || 10) * floorStatMult);
  bossData.luck = Math.round((baseBoss.luck || 10) * floorStatMult);

  if (f >= 6 && f <= 10) {
    bossData.rewards = {
      ...baseBoss.rewards,
      exp: Math.floor(baseBoss.rewards.exp * 0.70)
    };
  }

  for (let i = 0; i < minionCount; i++) {
    const mId = minionPool[Math.floor(Math.random() * minionPool.length)] || 'monster_stalker';
    const baseMinion: MonsterData = JSON.parse(JSON.stringify(MONSTERS[mId] || MONSTERS['monster_stalker']));
    const cleanMinionName = baseMinion.name.replace(/\[\s*(정예|광폭화?|호위)\s*\]/g, '').trim();
    baseMinion.name = `[호위] ${cleanMinionName} ${String.fromCharCode(65 + i)}`;
    baseMinion.level = Math.max(1, baseMinion.level - 1);
    baseMinion.type = 'elite';
    const minionEliteMult = 1.50; // 호위 정예 50% HP/DEF/SPD 상향
    const minionEliteAtkMult = 1.15; // 🌟 호위 정예 15% 공격력 상향
    const minionNonBossMult = f >= 3 ? 1.10 : 1.0; // 🌟 3층 이상 호위 하수인 스탯 10% 증가

    baseMinion.maxHp = Math.round(baseMinion.maxHp * floorStatMult * minionEliteMult * minionNonBossMult);
    baseMinion.atk = Math.round(baseMinion.atk * floorStatMult * minionEliteAtkMult * minionNonBossMult * miasmaMult);
    baseMinion.def = Math.round(baseMinion.def * floorStatMult * minionEliteMult * minionNonBossMult * miasmaMult);
    baseMinion.spd = Math.round((baseMinion.spd || 10) * floorStatMult * minionEliteMult * minionNonBossMult);
    baseMinion.luck = Math.round((baseMinion.luck || 10) * floorStatMult * minionNonBossMult);
    if (f >= 6 && f <= 10) {
      baseMinion.rewards = {
        ...baseMinion.rewards,
        exp: Math.max(10, Math.floor(baseMinion.rewards.exp * 0.70))
      };
    }
    minions.push(baseMinion);
  }

  return [...minions, bossData];
}
const FLOOR_ACCENT = [
  '#5c6bc0', '#78909c', '#00bcd4', '#ab47bc', '#ff416c',
  '#d32f2f', '#5c6bc0', '#37474f', '#0288d1', '#b71c1c',
  '#9c27b0'
];
const FLOOR_PROMPTS = [
  '[AI 이미지 프롬프트 — assets/dungeon_1.jpg]\n"Dark fantasy RPG concept art, silent dark stone corridor, dungeon entrance, glowing moss, gloomy atmosphere"',
  '[AI 이미지 프롬프트 — assets/dungeon_2.jpg]\n"Dark fantasy crypt, skulls and bones, ethereal blue flames, ruined tombs, eerie atmosphere"',
  '[AI 이미지 프롬프트 — assets/dungeon_3.jpg]\n"Underground glowing crystal cave, blue and cyan magical aether veins, fantasy environment"',
  '[AI 이미지 프롬프트 — assets/dungeon_4.jpg]\n"Deep dark void, abyss, glowing purple spatial cracks, ominous dark fantasy setting"',
  '[AI 이미지 프롬프트 — assets/dungeon_5.jpg]\n"Ancient ruined altar, blood moon sky, epic boss arena, corrupted dark fantasy landscape"',
  '[AI 이미지 프롬프트 — assets/dungeon_6.jpg]\n"Dark fantasy blood sanctuary, gothic cathedral hall submerged in crimson moonlight, stained glass, rose vines, misty red reflections"',
  '[AI 이미지 프롬프트 — assets/dungeon_7.jpg]\n"Dark fantasy oblivion catacombs, ancient stone crypts and gravestones, ethereal cyan soul flames, chilly mist"',
  '[AI 이미지 프롬프트 — assets/dungeon_8.jpg]\n"Dark fantasy hall of condemnation, ruined fortress of fallen knights, hanging iron chains, ghostly blue braziers, paladin statues"',
  '[AI 이미지 프롬프트 — assets/dungeon_9.jpg]\n"Dark fantasy mirror labyrinth, floating shattered crystal mirrors, glowing neon cyan and violet light beams, surreal maze"',
  '[AI 이미지 프롬프트 — assets/dungeon_10.jpg]\n"Dark fantasy heart of the abyss, cosmic void rift, obsidian rune monoliths, apocalyptic demonic throne room, final battle arena"',
  '[AI 이미지 프롬프트 — assets/dungeon_11.jpg]\n"Dark fantasy infinite abyss of Avici, cosmic void purgatory, glowing purple dimensional tears, endless monolith spires, ultimate purgatory arena"'
];

interface EventCard {
  title: string;
  desc: string;
  icon: string;
  iconKey?: string;
  options?: { label: string; variant?: 'primary' | 'danger' | 'success' | 'ghost'; disabled?: boolean; action: () => void }[];
}

export const ExplorationScreen: React.FC = () => {
  const { state, gm, navigateTo } = useGameManager();
  const { lang, dict, tr } = useI18n();
  useCustomAssetVersion();
    const [floor, setFloor] = useState(gm.dungeonFloor || 1);
  const [danger, setDanger] = useState(gm.dungeonDangerLevel || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [torchTurns, setTorchTurns] = useState<number>(0);
  const [isEtherTorch, setIsEtherTorch] = useState<boolean>(false);
  const isTorchLit = torchTurns > 0;
  const [eventCard, setEventCard] = useState<EventCard | null>(null);
  const [bossWarning, setBossWarning] = useState<string | null>(null);
  const [banterResult, setBanterResult] = useState<CampBanterResult | null>(null);
  const [campCooldown, setCampCooldown] = useState<number>(gm.campCooldown || 0);
  // 🏃 균열의 닻 없는 긴급 탈출 쿨다운 (1턴) 및 확인 모달 상태
  const [escapeCooldown, setEscapeCooldown] = useState<number>(0);
  const [showEmergencyEscapeModal, setShowEmergencyEscapeModal] = useState<boolean>(false);
  
  // 배낭 드로어 및 아이템 버리기 상태
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [isMercenaryManageOpen, setIsMercenaryManageOpen] = useState(false);
  const [pendingLoot, setPendingLoot] = useState<any[]>(gm.pendingLoot || []);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [discardTarget, setDiscardTarget] = useState<{ index: number; slot: DungeonItemSlot } | null>(null);
  // 이미지 로드 에러 상태
  const [imgError, setImgError] = useState(false);
  // 영웅 상세 정보 모달
  const [inspectedHero, setInspectedHero] = useState<Mercenary | null>(null);

  // ── 튜토리얼 상태 관리 ──
  const [tutorialStepId, setTutorialStepId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ark_tutorial_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isCompleted || parsed.isSkipped) return '';
        return parsed.currentStepId || '';
      }
    } catch {}
    return '';
  });
  const [isExplorationGuideDismissed, setIsExplorationGuideDismissed] = useState(false);
  const tutorialExploreCountRef = useRef<number>(0);

  const handleAdvanceTutorial = (nextId?: string) => {
    if (!nextId) {
      setTutorialStepId('');
      try {
        localStorage.setItem('ark_tutorial_state', JSON.stringify({ currentStepId: '', isCompleted: true, isSkipped: false }));
      } catch {}
      return;
    }
    setTutorialStepId(nextId);
    try {
      localStorage.setItem('ark_tutorial_state', JSON.stringify({ currentStepId: nextId, isCompleted: false, isSkipped: false }));
    } catch {}
  };

  const handleSkipTutorial = () => {
    setTutorialStepId('');
    try {
      localStorage.setItem('ark_tutorial_state', JSON.stringify({ currentStepId: '', isCompleted: false, isSkipped: true }));
    } catch {}
  };

  // 🛡️ [탐색 애니메이션 데드락 방지 와치독 타이머]: 1.2초 이상 isAnimating이 유지되면 강제 해제
  useEffect(() => {
    if (isAnimating) {
      const watchdog = setTimeout(() => {
        setIsAnimating(false);
      }, 1200);
      return () => clearTimeout(watchdog);
    }
  }, [isAnimating]);

  // 던전 진입 시 모든 파티원 스탯 완벽 동기화
  useEffect(() => {
    gm.syncAllHeroesStats();
  }, [gm]);

  useEffect(() => {
    const handlePendingLoot = (items: any) => {
      setPendingLoot([...(items || [])]);
    };
    gm.on('pendingLootUpdated', handlePendingLoot);
    return () => {
      gm.off('pendingLootUpdated', handlePendingLoot);
    };
  }, [gm]);

  useEffect(() => {
    if (pendingLoot.length > 0) {
      setShowPendingModal(true);
    } else {
      setShowPendingModal(false);
    }
  }, [pendingLoot.length, eventCard, bossWarning]);

  // 📜 제1장 퀘스트: 1층 진입 시 즉시 척후 파견 퀘스트 목표 달성 (최초 1회)
  useEffect(() => {
    if (floor >= 1 && !gm.hasEnteredDungeon) {
      gm.hasEnteredDungeon = true;
      gm.updateQuestObjective('Q_MAIN_02', 2, 1);
    }
  }, [floor, gm]);

  // 🌌 무간도(11층) 1,000 단위 위험도 돌파 시 세부 진입 계층(1~10계층) 자동 영구 해금
  useEffect(() => {
    if (floor === 11 && danger >= 1000) {
      const unlockedTier = Math.min(10, Math.floor(danger / 1000) + 1);
      if (unlockedTier > (gm.unlockedAviciTier || 1)) {
        gm.unlockedAviciTier = unlockedTier;
        const reachedDanger = (unlockedTier - 1) * 1000;
        const startDanger = unlockedTier === 1 ? 0 : reachedDanger + 1;
        gm.addLog(`🌌 [무간도 진입로 개방] 위험도 ${reachedDanger.toLocaleString()} 보스 격파 돌파! 성채 채비실에 [무간도 ${unlockedTier}계층 (시작 위험도 ${startDanger.toLocaleString()})] 진입로가 영구 해금되었습니다!`, 'reward');
        gm.saveGame();
      }
    }
  }, [danger, floor, gm]);

  // 🌀 던전 세션 실시간 저장
  useEffect(() => {
    if (gm.currentScreen === 'exploration') {
      gm.dungeonFloor = floor;
      gm.dungeonDangerLevel = danger;
      gm.campCooldown = campCooldown;
      gm.saveDungeonSession('exploration');
    }
  }, [floor, danger, campCooldown, gm]);

  const floorIdx = Math.min(Math.max(0, floor - 1), 10);
  const floorColor = FLOOR_ACCENT[floorIdx] || '#ab47bc';
  const currentLang = (typeof lang === 'string' && ['ko', 'en', 'ja'].includes(lang)) ? lang : 'ko';
  const floorName = (FLOOR_NAMES_I18N[currentLang] || FLOOR_NAMES_I18N.ko)[floorIdx] || '무간도 (Avici)';

  const floorPrompt = FLOOR_PROMPTS[floorIdx] || FLOOR_PROMPTS[9];
  const customFloorImg = CustomAssetService.getInstance().getDungeonFloorOverride(floor)
    || CustomAssetService.getInstance().getDungeonFloorOverride(`dungeon_${floor}`);
  const imageSrc = customFloorImg || (floor === 11 ? 'assets/boss_floor_10.jpg' : `assets/dungeon_${floorIdx + 1}.jpg`);
  
  // 🌟 [층수 비례 위험도 게이지 확장 시스템]: 1F(100) -> 2F(130) ... 10F(370) -> 11F 무간도(10000)
  const maxDanger = floor === 11 ? 10000 : (100 + (floor - 1) * 30);
  const dangerPct = Math.min(100, (danger / maxDanger) * 100);

  const lastLoggedFloorRef = useRef<number>(-1);

  // 성채로 복귀 (닻 종류 및 고위험 시 위험 탈출 페널티, 전리품 자동 정산)
  const returnToCitadel = useCallback((method?: 'portal' | 'enhanced_rift_anchor' | 'rift_anchor' | 'retreat') => {
    if (method === 'enhanced_rift_anchor') {
      // ⚓✨ 심연의 닻: 시공간 왜곡을 제어하여 귀환 시 배낭 물품 분실 확률을 완벽 차단!
    } else if (method === 'rift_anchor') {
      // ⚓ 일반 균열의 닻: 귀환 시 보급품을 잃어버리는 확률 상향 (기본 35%, 위험도 50%+ 시 55%)
      const dropChance = dangerPct >= 50 ? 0.55 : 0.35;
      if (Math.random() < dropChance && gm.dungeonInventory.length > 2) {
        const dropIdx = Math.floor(Math.random() * gm.dungeonInventory.length);
        const dropped = gm.dungeonInventory.splice(dropIdx, 1)[0];
        gm.addLog(`⚠️ [차원 균열 귀환 손실] 일반 균열의 닻을 통한 시공간 이동 중 차원 불안정으로 배낭에서 [${dropped.label} ×${dropped.qty}]을(를) 떨어뜨려 분실했습니다! (심연의 닻 사용 시 방지 가능)`, 'danger');
      }
    } else if (dangerPct >= 60 && Math.random() < 0.40) {
      // 위험도가 60% 이상일 때 40% 확률로 험로 탈출 페널티 (배낭 자원 일부 소실)
      if (gm.dungeonInventory.length > 2) {
        const dropIdx = Math.floor(Math.random() * gm.dungeonInventory.length);
        const dropped = gm.dungeonInventory.splice(dropIdx, 1)[0];
        gm.addLog(`⚠️ [긴급 탈출 난항] 마물들의 포위망을 뚫고 도주하던 중 배낭에서 [${dropped.label} ×${dropped.qty}]을(를) 떨어뜨렸습니다!`, 'danger');
      }
    }
    setTorchTurns(0);
    setIsEtherTorch(false);
    setCampCooldown(0);
    gm.campCooldown = 0;
    gm.clearPartyStatusEffects();
    gm.hasEnteredDungeon = true;
    gm.updateQuestObjective('Q_MAIN_02', 2, 1);
    gm.settleDungeonInventory(floor);
    gm.clearDungeonSession();
    if (tutorialStepId === 'TUTORIAL_EXPLORE_RETURN') {
      handleAdvanceTutorial('TUTORIAL_CITADEL_FINISH');
    }
    navigateTo('citadel');
    gm.saveGame();
  }, [dangerPct, floor, gm, navigateTo, tutorialStepId]);

  // 🏃 닻 없는 비상 탈출 감행 (성공 30% / 전리품 80% 유실, 실패 70% / 마물 기습)
  const executeEmergencyEscape = useCallback(() => {
    setEscapeCooldown(1);
    setShowEmergencyEscapeModal(false);

    const isSuccess = Math.random() < 0.30;
    if (isSuccess) {
      const { lostCount, keptCount } = gm.settleEmergencyEscapeLoot();
      gm.addLog(`🏃💨 [사투 끝의 비상 탈출 성공!] 마물들의 포위망을 뚫고 가까스로 탈출했습니다! (전리품 80% [${lostCount}개] 유실, ${keptCount}개 보존)`, 'reward');
      returnToCitadel();
    } else {
      SoundManager.getInstance().play('heavy_hit');
      gm.addLog('⚠️💥 [비상 탈출 실패!] 도주로가 차단되고 마물들에게 기습 습격을 당했습니다!', 'danger');
      // 파티원 기습 피해 (HP 10% 감소)
      gm.party.forEach(h => {
        if (h.currentHp > 0) {
          h.currentHp = Math.max(1, Math.round(h.currentHp * 0.9));
        }
      });
      const squad = generateMonsterSquad(floor, false, danger);
      if (squad && squad.length > 0) {
        gm.currentMonsters = squad;
        gm.clearBattleSnapshot();
        gm.saveGame();
        navigateTo('battle');
      }
    }
  }, [floor, danger, gm, returnToCitadel, navigateTo]);

  // 🌀 보스전 승리 후 포탈 & 오버차지 선택 모달 자동 활성화
  useEffect(() => {
    if (gm.portalAppeared) {
      gm.portalAppeared = false;
      // 🌟 보스 격파 시 다음 층 진입 포인트 영구 해금 보장
      const nextUnlocked = Math.min(11, floor + 1);
      if (nextUnlocked > gm.unlockedDungeonFloor) {
        gm.unlockedDungeonFloor = nextUnlocked;
        gm.addLog(`🌀 [심연 진입로 개방] ${floor}층 보스를 토벌하여 심연 ${nextUnlocked}층 진입 포인트가 성채 채비실에 영구 해금되었습니다!`, 'reward');
        gm.saveGame();
      }

      // 🌟 포탈 및 여정 선택지 구성
      const portalOptions: { label: string; variant: 'primary' | 'danger' | 'success' | 'ghost'; action: () => void }[] = [];

      if (floor === 11) {
        // 🌌 11층 무간도: 다음 층이 없으므로 '무간도 심연 탐험 계속하기' 선택지 제공
        portalOptions.push({
          label: '🌌 무간도 심연 계속 탐험 (다음 마일스톤 도전)',
          variant: 'primary',
          action: () => {
            setEventCard(null);
            gm.addLog(`🌌 [무간도 탐험 지속] 중간 보스를 격파하고 위험도 ${danger}의 심연 탐색을 계속 진행합니다!`, 'story');
          },
        });
      } else {
        // 1~10층 일반 층: 다음 층으로 이동
        portalOptions.push({
          label: '🌀 다음 층으로 이동 (안전 진행)',
          variant: 'primary',
          action: () => {
            const nextFloor = Math.min(11, floor + 1);
            setFloor(nextFloor);
            gm.dungeonFloor = nextFloor;
            setDanger(0);
            gm.dungeonDangerLevel = 0;
            gm.isOvercharged = false;
            setCampCooldown(0);
            gm.campCooldown = 0;
            gm.saveGame();
            gm.addLog(`🌀 [이동] ${FLOOR_NAMES[nextFloor - 1]}(${nextFloor}층)에 도착했습니다.`, 'story');
            setEventCard(null);
          },
        });
      }

      // ⚡ 오버차지 광폭화 보스 도전 선택지
      const isOverchargedDefeatedOnThisFloor = gm.defeatedOverchargedFloorsThisRun?.includes(floor) || gm.overchargedBossDefeatedOnFloor === floor;
      if (!isOverchargedDefeatedOnThisFloor) {
        portalOptions.unshift({
          label: floor === 11 ? '💀⚡ [심연 오버차지] 광폭화 진 최종 보스 도전' : '💀⚡ [심연 오버차지] 광폭화 보스 토벌 도전',
          variant: 'danger',
          action: () => {
            gm.isOvercharged = true;
            gm.currentMonsters = generateBossSquad(floor, true, danger);
            gm.clearBattleSnapshot();
            gm.saveGame();
            setEventCard(null);
            navigateTo('battle');
          },
        });
      }

      portalOptions.push({
        label: '🏰 성채로 안전 귀환 (전리품 정산)',
        variant: 'success',
        action: () => {
          setEventCard(null);
          returnToCitadel();
        },
      });

      setEventCard({
        title: floor === 11 ? '🌌 무간도 중간 보스 토벌 완료!' : '🌀 차원 포탈 & 심연 오버차지',
        desc: floor === 11
          ? `무간도 중간 군주를 토벌했습니다! (현재 위험도: ${danger}) 심연을 계속 개척할지, 전리품을 정산하고 성채로 안전 귀환할지 선택하세요.`
          : (isOverchargedDefeatedOnThisFloor
            ? '광폭화 보스를 토벌하여 차원 포탈이 완전히 안정화되었습니다. 다음 행동을 선택하세요.'
            : '보스를 물리치고 차원 포탈을 확보했습니다. 다음 행동을 선택하세요.'),
        icon: floor === 11 ? '👑' : '🌀',
        options: portalOptions,
      });
    }
  }, [floor, danger, gm, navigateTo, returnToCitadel]);

  // ⏱️ 단순 자원 획득, 함정 피해 등의 알림 모달은 2초 후 자동 닫힘
  useEffect(() => {
    if (eventCard && (!eventCard.options || eventCard.options.length === 0)) {
      const timer = setTimeout(() => {
        setEventCard(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [eventCard]);

  // 던전 입장 초기화
  useEffect(() => {
    if (lastLoggedFloorRef.current !== floor) {
      lastLoggedFloorRef.current = floor;
      gm.addLog(`[${floorName}] 던전 탐험을 시작합니다.`, 'story');
      if (gm.activeCatalysts.length > 0) {
        const catMap: Record<string, string> = {
          compass: '🧭 차원의 나침반',
          blood_contract: '📜 피의 서약서',
          dimensional_whistle: '📯 차원의 호각',
          golden_toad: '🐸 황금 두꺼비',
        };
        const catNames = gm.activeCatalysts.map(c => catMap[c] || c).join(', ');
        gm.addLog(`🔮 활성화된 심연 촉매: ${catNames}`, 'system');
      }
    }
    setImgError(false);
  }, [floor, floorName, gm]);

  // 탐험 이벤트 롤 (위험도 기반 3단계 다이내믹 밸런스: 아무 일도 없음 / 몬스터 조우 / 오브젝트 이벤트)
  const rollEvent = useCallback((): 'monster' | 'loot' | 'ore_vein' | 'altar' | 'sarcophagus' | 'branching' | 'merchant' | 'nothing' | 'trap' | 'buff' | 'portal' | 'return_portal' | 'floor_unique' => {
    const hasCompass = gm.activeCatalysts.includes('compass');
    const hasBlood = gm.activeCatalysts.includes('blood_contract');

    // 🧭 심연의 나침반 촉매: 10% 확률로 차원 포탈 발견
    if (hasCompass && Math.random() < 0.10) {
      return 'portal';
    }

    const dangerRatio = danger / maxDanger; // 0.0 ~ 1.0

    // 1. 위험도 3구간별 기본 확률 설정 (nothingPct, monsterPct, eventPct)
    let nothingPct = 50;
    let monsterPct = 25;
    let eventPct = 25;

    if (dangerRatio >= 0.70) {
      monsterPct = 50;
      nothingPct = 25;
      eventPct = 25;
    } else if (dangerRatio >= 0.35) {
      nothingPct = 34;
      monsterPct = 33;
      eventPct = 33;
    } else {
      nothingPct = 50;
      monsterPct = 25;
      eventPct = 25;
    }

    // 2. 횃불 및 피의 서약 촉매 보정치 적용
    if (hasBlood) {
      // 피의 서약: 몬스터 조우율 +10% (아무일 없음에서 차감)
      monsterPct += 10;
      nothingPct = Math.max(10, nothingPct - 10);
    }

    if (torchTurns > 0) {
      if (isEtherTorch) {
        // 🔥✨ 에테르 횃불: 몬스터 조우율 -20% 감소 (최소 5%), 이벤트 발견율 +20% 대폭 증가!
        monsterPct = Math.max(5, monsterPct - 20);
        eventPct += 20;
      } else {
        // 🔥 일반 횃불: 몬스터 조우율 -10% 감소 (최소 10%), 이벤트 발견율 +10% 증가
        monsterPct = Math.max(10, monsterPct - 10);
        eventPct += 10;
      }
    }

    // 3. 1차 카테고리 롤
    const roll = Math.random() * 100;
    if (roll < nothingPct) {
      return 'nothing';
    }
    if (roll < nothingPct + monsterPct) {
      return 'monster';
    }

    // 4. 2차 오브젝트 상호작용 세부 이벤트 롤
    // 🌟 위험도가 높을수록 함정(trap) 발생 확률 대폭 상승 (위험도 0%: 6% ~ 위험도 100%: 30%)
    const trapChance = Math.min(30, Math.max(6, Math.round(6 + dangerRatio * 24)));
    const subRoll = Math.random() * 100;
    if (subRoll < trapChance) {
      return 'trap';
    }

    // 일반 오브젝트 이벤트 배분 (🌟 층별 고유 이벤트 30% 확률 배치)
    const otherRoll = Math.random() * 100;
    if (otherRoll < 30) return 'floor_unique';
    if (otherRoll < 48) return 'loot';
    if (otherRoll < 66) return 'ore_vein';
    if (otherRoll < 76) return 'sarcophagus';
    if (otherRoll < 86) return 'altar';
    if (otherRoll < 93) return 'branching';
    if (otherRoll < 97) return 'merchant';
    if (otherRoll < 99) return 'buff';
    return 'return_portal';
  }, [danger, maxDanger, gm, torchTurns, isEtherTorch]);

  // 탐험 실행
  const doExplore = useCallback(() => {
    if (isAnimating || eventCard || bossWarning) return;
    setIsAnimating(true);

    // 횃불 점등 시 심연의 이목이 집중되어 위험도 상승 폭이 커짐 (에테르 횃불: 기존 16의 2배인 +32, 일반 횃불: +16, 소등: +8)
    const dangerIncrement = isTorchLit ? (isEtherTorch ? 32 : 16) : 8;
    const newDanger = Math.min(maxDanger, danger + dangerIncrement);
    setDanger(newDanger);
    gm.dungeonDangerLevel = newDanger;

    // 🏕️ 야영 쿨다운 카운트다운 (탐색 1회마다 1회씩 정상 차감)
    if (campCooldown > 0) {
      const nextCampCooldown = Math.max(0, campCooldown - 1);
      setCampCooldown(nextCampCooldown);
      gm.campCooldown = nextCampCooldown;
    }
    // 🏃 긴급 탈출 쿨다운 카운트다운
    setEscapeCooldown(prev => Math.max(0, prev - 1));

    // 🛡️ 탐색 1회 = 1턴 진행! 파티 버프/디버프 상태이상 틱 적용 및 턴수 차감/해제
    const statusLogs = gm.advancePartyStatusEffects();
    if (statusLogs.length > 0) {
      statusLogs.forEach(msg => gm.addLog(msg, 'system'));
    }

    // 🚚 긴급 이송 대기 카운트다운 (탐색 1스텝 = 1턴 진행)
    gm.advanceEmergencyTransport();

    gm.saveGame();

    // 횃불 지속 턴 카운트다운 (3회 탐색 동안 유지)
    if (torchTurns > 0) {
      const nextTurns = torchTurns - 1;
      setTorchTurns(nextTurns);
      if (nextTurns === 0) {
        setIsEtherTorch(false);
        gm.addLog('🔥 [횃불 소진] 횃불의 불씨가 완전히 사그라들고 다시 깊은 어둠이 깔렸습니다.', 'bonfire0');
      } else {
        gm.addLog(`🔥 [${isEtherTorch ? '에테르 횃불' : '횃불'} 조명] 밝은 불빛으로 탐색을 진행합니다. (남은 지속: ${nextTurns}회, 위험도 +${dangerIncrement})`, 'normal');
      }
    }

    // 70% 이상 위험도 도달 시 보스 전조 경고 (무간도 제외 일반층)
    const dangerRatio = newDanger / maxDanger;

    // 💔 던전 위험도에 따른 유대감 마찰/감소 (중간 레벨: 확률적 -1, 위험 레벨: 확정적 -1)
    gm.applyDungeonHazardBondFriction(dangerRatio);

    if (floor !== 11 && dangerRatio >= 0.7 && dangerRatio < 1.0 && !gm.isOvercharged) {
      const isBossFloor = (floor === 5 || floor === 10);
      const omenMsg = isBossFloor
        ? '⚠️ [공허의 전조] 시공간이 일그러지며 공허의 침식자의 살기가 감지됩니다! (위험도 100% 임박!)'
        : '⚠️ [심연의 전조] 깊은 어둠 속에서 강력한 마력과 군주의 포효가 울려 퍼집니다! (보스 출현 임박!)';
      gm.addLog(omenMsg, 'danger');
    }

    // 👑 보스 출현 트리거 (무간도는 100 단위 및 10,000 최종 도달, 일반층은 maxDanger 도달)
    const isAvici = floor === 11;
    const isAviciMilestoneBoss = isAvici && (Math.floor(newDanger / 100) > Math.floor(danger / 100) || newDanger >= 10000);
    const isStandardBoss = !isAvici && newDanger >= maxDanger;

    if ((isAviciMilestoneBoss || isStandardBoss) && !gm.isOvercharged) {
      const isTrueFinal = isAvici && newDanger >= 10000;
      const bossSquad = generateBossSquad(floor, isAvici && !isTrueFinal, newDanger);
      const mainBoss = bossSquad.find(m => m.type === 'boss') || bossSquad[bossSquad.length - 1];

      SoundManager.getInstance().play('heavy_hit');
      SoundManager.getInstance().play('debuff');
      setBossWarning(mainBoss.name);

      if (isTrueFinal) {
        gm.addLog(`👑 [위험도 10,000 극한 도달!] 무간도의 심연 속에서 진 최종 보스 [${mainBoss.name}]이(가) 강림했습니다! (Lv.600)`, 'danger');
      } else if (isAvici) {
        gm.addLog(`💀 [무간도 위험도 ${Math.floor(newDanger / 100) * 100} 돌파!] 심연의 억겁이 심화되며 [${mainBoss.name}] 편대가 출현했습니다! (몬스터 Lv.${Math.min(600, Math.round(50 + Math.floor(newDanger / 100) * 5.5))})`, 'danger');
      } else {
        gm.addLog(`💀 [위험도 100.00%] 심연의 위기가 극한에 달했습니다! [${mainBoss.name}]과 호위군 출현!`, 'danger');
      }

      setTimeout(() => {
        setBossWarning(null);
        setIsAnimating(false);

        setEventCard({
          title: `👑 ${mainBoss.name} 편대 출현!`,
          desc: isTrueFinal
            ? '태초의 공허를 다스리는 무간의 절대자 [아르케오스]가 강림했습니다! 모든 심연을 닫기 위한 최후의 결전입니다!'
            : isAvici
            ? `무간도 위험도 ${Math.floor(newDanger / 100) * 100} 돌파! 광폭화 군주 [${mainBoss.name}]와 정예 호위대가 길을 가로막습니다!`
            : (floor === 5 || floor === 10) 
            ? '심연의 근원 [공허의 침식자]와 공허의 군단이 모습을 드러냈습니다! 최후의 결전이 시작됩니다!'
            : `심연 ${floor}층의 수호 군주 [${mainBoss.name}]와 호위대가 앞을 가로막습니다!`,
          icon: '💀',
          iconKey: 'event_boss_encounter',
          options: [
            {
              label: '⚔️ 즉시 결전 돌입!',
              variant: 'danger',
              action: () => {
                gm.currentMonsters = bossSquad;
                gm.clearBattleSnapshot();
                gm.saveGame();
                setEventCard(null);
                navigateTo('battle');
              }
            },
            {
              label: '🏃 보스의 살기를 피해 물러서기 (위험도 -10 감소)',
              variant: 'ghost',
              action: () => {
                const nextD = Math.max(0, newDanger - 10);
                setDanger(nextD);
                gm.dungeonDangerLevel = nextD;
                gm.saveGame();
                gm.addLog('🏃 보스의 살기를 피해 침착하게 뒤로 물러섰습니다. (위험도 -10 감소)', 'system');
                setEventCard(null);
              }
            }
          ]
        });
      }, 1400);
      return;
    }

    let event = rollEvent();
    if (floor === 1 && tutorialStepId === 'TUTORIAL_EXPLORE_SCOUT') {
      setIsExplorationGuideDismissed(true);
      const stepIdx = tutorialExploreCountRef.current;
      if (stepIdx === 0) {
        event = 'loot';
        tutorialExploreCountRef.current = 1;
      } else if (stepIdx === 1) {
        event = 'ore_vein';
        tutorialExploreCountRef.current = 2;
      } else {
        event = 'monster';
        tutorialExploreCountRef.current = 3;
      }
    }

    setTimeout(() => {
      switch (event) {
        case 'monster': {
          let squad: MonsterData[];
          if (floor === 1 && tutorialStepId === 'TUTORIAL_EXPLORE_SCOUT') {
            // 🌟 튜토리얼 강제 2마리 편대 (전열 부패 슬라임 + 후열 그림자 임프)
            const slime = JSON.parse(JSON.stringify(MONSTERS['monster_rot_slime'])) as MonsterData;
            const imp = JSON.parse(JSON.stringify(MONSTERS['monster_shadow_imp'])) as MonsterData;
            slime.level = 1;
            imp.level = 1;
            squad = [slime, imp];
            handleAdvanceTutorial('TUTORIAL_BATTLE_TARGET');
          } else {
            squad = generateMonsterSquad(floor, newDanger >= maxDanger, newDanger);
          }
          if (squad && squad.length > 0) {
            gm.currentMonsters = squad;
            gm.isOvercharged = newDanger >= maxDanger;
            gm.clearBattleSnapshot();
            gm.saveGame();
            setIsAnimating(false);
            navigateTo('battle');
            return;
          }
          break;
        }

        case 'loot': {
          SoundManager.getInstance().play('loot_open');
          const isBlood = gm.activeCatalysts.includes('blood_contract');
          const enhancedKeyCount = gm.getDungeonItemCount('enhanced_key');
          const normalKeyCount = gm.getDungeonItemCount('key');
          const hasEnhancedKey = enhancedKeyCount > 0;
          const hasKey = hasEnhancedKey || normalKeyCount > 0;
          const multiplier = isBlood ? 2 : 1;
          const goldAmt = Math.max(5, Math.floor((Math.random() * 15 + 10) * floor * multiplier * 0.5));
          const generalPool = [
            { key: 'wood', name: '목재', icon: '🪵', qty: Math.floor(Math.random() * 4 + 3) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'stone', name: '석재', icon: '🪨', qty: Math.floor(Math.random() * 4 + 3) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'iron', name: '철광석', icon: '⚙️', qty: Math.floor(Math.random() * 3 + 2) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'food', name: '식량', icon: '🍖', qty: Math.floor(Math.random() * 3 + 2) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'bone', name: '짐승 뼈', icon: '🦴', qty: Math.floor(Math.random() * 3 + 2) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'ether', name: '에테르', icon: '✨', qty: Math.floor(Math.random() * 5 + 4) * Math.min(4, Math.ceil(floor / 2)) },
          ];
          const dropItem = generalPool[Math.floor(Math.random() * generalPool.length)];

          const checkForgeEquipDrop = (chance = 0.5) => {
            if (Math.random() < chance) {
              const fEquip = gm.generateForgeEquipmentDrop(floor);
              gm.addToDungeonInventory(fEquip.id, fEquip.name, fEquip.icon, 1, fEquip, undefined, 'equipment');
              const enchantBadge = (fEquip.prefix || fEquip.suffix) ? '✨인챈트 ' : '';
              gm.addLog(`📦 [제식 장비 발굴] 상자에서 ${enchantBadge}[${fEquip.name}] (T${fEquip.tier || 1}, [${fEquip.rarity.toUpperCase()}])을(를) 획득했습니다! (도감 등록 가능)`, 'reward');
            }
          };

          const checkOopartsDrop = (chance = 0.25) => {
            if (floor <= 10 && Math.random() < chance) {
              const subIdx = Math.random() < 0.5 ? 1 : 2;
              const oKey = `ooparts_${floor}_${subIdx}`;
              const oMeta = GameManager.getResourceMeta(oKey);
              gm.addToDungeonInventory(oKey, oMeta.name, oMeta.icon, 1);
              gm.addLog(`🏛️✨ [멸망 이전 유물 발굴] 상자 밑바닥에서 구세계의 오파츠 [${oMeta.name}]을(를) 발굴했습니다! (심연의 백과 등록용)`, 'reward');
            }
          };

          setEventCard({
            title: isBlood ? '🎁 대형 보물 상자 (피의 서약)' : '🎁 버려진 고대 보물 상자',
            desc: '심연의 어둠 속에서 마도 결계로 잠긴 보물 상자를 발견했습니다.\n어떻게 개방하시겠습니까?',
            icon: '🎁',
            iconKey: 'event_chest',
            options: [
              {
                label: hasKey
                  ? (hasEnhancedKey
                    ? `🗝️✨ [황금 열쇠 사용] 정밀 안전 개방 (제식장비 100% + 자원 2배: 골드 ${goldAmt * 2}G + ${dropItem.icon}${dropItem.name} ×${dropItem.qty * 2} + ✨에테르 +25 + 💀저주장비 확률 +50%)`
                    : `🗝️ [열쇠 사용] 정밀 안전 개방 (제식장비 100% + 자원 2배: 골드 ${goldAmt * 2}G + ${dropItem.icon}${dropItem.name} ×${dropItem.qty * 2} + ✨에테르 +15)`)
                  : '🗝️ [열쇠 필요] 잠금 해제 도구 없음 (던전 열쇠 필요 - 선택 불가)',
                variant: hasKey ? 'success' : 'ghost',
                disabled: !hasKey,
                action: () => {
                  if (!hasKey) return;
                  const usedEnhanced = hasEnhancedKey;
                  if (usedEnhanced) {
                    gm.consumeDungeonItem('enhanced_key', 1);
                  } else {
                    gm.consumeDungeonItem('key', 1);
                  }
                  const checkCursedDrop = () => {
                    const baseChance = floor >= 6 ? 0.40 : 0.0;
                    const cursedChance = usedEnhanced ? (baseChance + 0.50) : baseChance;
                    if (Math.random() < cursedChance) {
                      const cursedEquip = gm.generateCursedEquipment(Math.max(6, floor));
                      gm.addToDungeonInventory(cursedEquip.id, cursedEquip.name, cursedEquip.icon, 1, cursedEquip, undefined, 'equipment');
                      gm.addLog(`💀✨ [저주받은 보구 발견] ${usedEnhanced ? '황금 열쇠의 신비한 공명으로' : '보물 상자 속에서'} 저주에 잠식된 [${cursedEquip.name}]을(를) 발굴했습니다! (정화 전 착용 불가)`, 'danger');
                    }
                  };
                  const etherAmt = usedEnhanced ? 25 : 15;
                  gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt * 2);
                  gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty * 2);
                  gm.addToDungeonInventory('ether', '에테르', '✨', etherAmt);
                  checkForgeEquipDrop(1.0); // 100% 확률로 병기창 장비 드랍
                  checkCursedDrop();
                  checkOopartsDrop(0.35);
                  gm.addLog(`🗝️ [${usedEnhanced ? '황금 열쇠' : '열쇠'} 개방 대성공] 열쇠로 마도 잠금을 해제하여 골드 ${goldAmt * 2}G, [${dropItem.name} ×${dropItem.qty * 2}], ✨에테르 +${etherAmt}를 완벽히 획득했습니다!${usedEnhanced ? ' (저주장비 확률 +50%)' : ''}`, 'reward');
                  setEventCard(null);
                }
              },
              {
                label: `🖐️ [맨손 개방] 조심스럽게 개방 (골드 ${goldAmt}G + ${dropItem.icon}${dropItem.name} ×${dropItem.qty} + 50% 장비)`,
                variant: 'primary',
                action: () => {
                  const checkCursedDrop = () => {
                    if (floor >= 6 && Math.random() < 0.40) {
                      const cursedEquip = gm.generateCursedEquipment(floor);
                      gm.addToDungeonInventory(cursedEquip.id, cursedEquip.name, cursedEquip.icon, 1, cursedEquip, undefined, 'equipment');
                      gm.addLog(`💀 [저주받은 보구 발견] 보물 상자 속에서 저주에 잠식된 [${cursedEquip.name}]을(를) 발굴했습니다! (정화 전 착용 불가)`, 'danger');
                    }
                  };
                  gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt);
                  gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty);
                  checkForgeEquipDrop(0.50); // 50% 확률로 병기창 장비 드랍
                  checkCursedDrop();
                  checkOopartsDrop(0.18);
                  gm.addLog(`🪙 [보물 획득] 골드 ${goldAmt}G 및 [${dropItem.name} ×${dropItem.qty}] 획득!`, 'reward');
                  setEventCard(null);
                }
              },
              {
                label: '🔍 [강제 수색] 샅샅이 파헤치기 (70% 장비 및 에테르 추가 / 35% 독침 트랩 피해)',
                variant: 'danger',
                action: () => {
                  const roll = Math.random();
                  if (roll < 0.65) {
                    const checkCursedDrop = () => {
                      if (floor >= 6 && Math.random() < 0.40) {
                        const cursedEquip = gm.generateCursedEquipment(floor);
                        gm.addToDungeonInventory(cursedEquip.id, cursedEquip.name, cursedEquip.icon, 1, cursedEquip, undefined, 'equipment');
                        gm.addLog(`💀 [저주받은 보구 발견] 보물 상자 속에서 저주에 잠식된 [${cursedEquip.name}]을(를) 발굴했습니다! (정화 전 착용 불가)`, 'danger');
                      }
                    };
                    const extraEther = Math.floor(Math.random() * 6 + 5) * Math.min(3, Math.ceil(floor / 2));
                    gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt);
                    gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty);
                    gm.addToDungeonInventory('ether', '에테르', '✨', extraEther);
                    checkForgeEquipDrop(0.70); // 70% 확률로 병기창 장비 드랍
                    checkCursedDrop();
                    checkOopartsDrop(0.25);
                    gm.addLog(`✨ [심층 수색 대성공] 골드 ${goldAmt}G, [${dropItem.name} ×${dropItem.qty}], ✨ 에테르 +${extraEther} 추가 발굴!`, 'reward');
                  } else {
                    SoundManager.getInstance().play('hero_hurt');
                    gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.92)); });
                    gm.emit('partyUpdated');
                    gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt);
                    gm.addLog(`⚠️ [상자 함정] 숨겨진 독침 트랩 발동! 파티 전원 HP 8% 피해 (🪙 ${goldAmt}G 회수)`, 'danger');
                  }
                  setEventCard(null);
                }
              },
              {
                label: '🏃 [포기] 건드리지 않고 지나친다',
                variant: 'ghost',
                action: () => {
                  gm.addLog('불안정한 상자를 건드리지 않고 안전하게 지나쳤습니다.', 'normal');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'ore_vein': {
          SoundManager.getInstance().play('loot_open');
          const isBlood = gm.activeCatalysts.includes('blood_contract');
          const enhancedPickCount = gm.getDungeonItemCount('enhanced_pickaxe');
          const normalPickCount = gm.getDungeonItemCount('pickaxe');
          const hasEnhancedPick = enhancedPickCount > 0;
          const hasPickaxe = hasEnhancedPick || normalPickCount > 0;
          const multiplier = isBlood ? 2 : 1;
          const orePool = [
            { key: 'stone', name: '석재', icon: '🪨', qty: Math.floor(Math.random() * 5 + 4) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'iron', name: '철광석', icon: '⚙️', qty: Math.floor(Math.random() * 4 + 3) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'ether', name: '에테르', icon: '✨', qty: Math.floor(Math.random() * 6 + 5) * Math.min(4, Math.ceil(floor / 2)) },
          ];
          const dropItem = orePool[Math.floor(Math.random() * orePool.length)];
          const goldAmt = Math.max(3, Math.floor((Math.random() * 10 + 6) * floor * multiplier * 0.5));

          setEventCard({
            title: '⛏️ 에테르 광맥 발견',
            desc: '벽면을 따라 영롱한 빛을 내뿜는 마도 광맥이 노출되어 있습니다.\n어떻게 채굴하시겠습니까?',
            icon: '⛏️',
            iconKey: 'event_ore_vein',
            options: [
              {
                label: hasPickaxe
                  ? (hasEnhancedPick
                    ? `⛏️✨ [심연 곡괭이 사용] 초정밀 폭격 채굴 (채굴량 2배: ${dropItem.icon}${dropItem.name} ×${dropItem.qty * 4} + ⚙️철광석 +10 + 🪙${goldAmt * 4}G)`
                    : `⛏️ [곡괭이 사용] 정밀 안전 채굴 (자원 2배: ${dropItem.icon}${dropItem.name} ×${dropItem.qty * 2} + ⚙️철광석 +5 + 🪙${goldAmt * 2}G)`)
                  : '⛏️ [곡괭이 필요] 채굴 도구 없음 (곡괭이 필요 - 선택 불가)',
                variant: hasPickaxe ? 'success' : 'ghost',
                disabled: !hasPickaxe,
                action: () => {
                  if (!hasPickaxe) return;
                  const usedEnhanced = hasEnhancedPick;
                  if (usedEnhanced) {
                    if (gm.consumeDungeonItem('enhanced_pickaxe', 1)) {
                      gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt * 4);
                      gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty * 4);
                      gm.addToDungeonInventory('iron', '철광석', '⚙️', 10);
                      gm.addLog(`⛏️✨ [심연 곡괭이 대성공] 심연 곡괭이의 마력으로 채굴량 2배 극대화(골드 ${goldAmt * 4}G, [${dropItem.name} ×${dropItem.qty * 4}], ⚙️철광석 +10)를 완벽하게 채굴했습니다!`, 'reward');
                    }
                  } else {
                    if (gm.consumeDungeonItem('pickaxe', 1)) {
                      gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt * 2);
                      gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty * 2);
                      gm.addToDungeonInventory('iron', '철광석', '⚙️', 5);
                      gm.addLog(`⛏️ [곡괭이 정밀 채굴 대성공] 곡괭이로 암반을 정밀 파쇄하여 골드 ${goldAmt * 2}G, [${dropItem.name} ×${dropItem.qty * 2}], ⚙️철광석 +5를 100% 안전하게 채굴했습니다!`, 'reward');
                    }
                  }
                  setEventCard(null);
                }
              },
              {
                label: `🖐️ [맨손 채굴] 무기와 맨손으로 채굴 (${dropItem.icon}${dropItem.name} ×${dropItem.qty} / 40% 반동 피해)`,
                variant: 'primary',
                action: () => {
                  const roll = Math.random();
                  gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt);
                  gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty);
                  if (roll < 0.40) {
                    SoundManager.getInstance().play('hero_hurt');
                    gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.92)); });
                    gm.emit('partyUpdated');
                    gm.addLog(`⛏️ [맨손 채굴] 골드 ${goldAmt}G 및 [${dropItem.name} ×${dropItem.qty}] 수습 (파편 반동으로 파티원 HP 8% 피해)`, 'danger');
                  } else {
                    gm.addLog(`⛏️ [맨손 채굴 완료] 골드 ${goldAmt}G 및 [${dropItem.name} ×${dropItem.qty}] 채굴 완료!`, 'reward');
                  }
                  setEventCard(null);
                }
              },
              {
                label: '💣 [과부하 발파] 마력 폭파 채굴 (자원 2배 / 위험도 +10 / HP 10% 반동)',
                variant: 'danger',
                action: () => {
                  SoundManager.getInstance().play('heavy_hit');
                  const nextD = Math.min(maxDanger, danger + 10);
                  setDanger(nextD);
                  gm.dungeonDangerLevel = nextD;
                  gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.90)); });
                  gm.emit('partyUpdated');
                  gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt * 2);
                  gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty * 2);
                  gm.addToDungeonInventory('iron', '철광석', '⚙️', 5);
                  gm.addLog(`💥 [과부하 발파] 굉음과 함께 자원 2배(골드 ${goldAmt * 2}G, ${dropItem.name} ×${dropItem.qty * 2}, 철광석 +5) 수급! (위험도 +10, HP -10%)`, 'danger');
                  setEventCard(null);
                }
              },
              {
                label: '🚶 [포기] 광맥을 지나친다',
                variant: 'ghost',
                action: () => {
                  gm.addLog('광맥을 뒤로하고 계속 전진합니다.', 'normal');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'sarcophagus': {
          SoundManager.getInstance().play('loot_open');
          const isBlood = gm.activeCatalysts.includes('blood_contract');
          const enhancedKeyCount = gm.getDungeonItemCount('enhanced_key');
          const normalKeyCount = gm.getDungeonItemCount('key');
          const hasEnhancedKey = enhancedKeyCount > 0;
          const hasKey = hasEnhancedKey || normalKeyCount > 0;
          const multiplier = isBlood ? 2 : 1;
          const sarcPool = [
            { key: 'wood', name: '목재', icon: '🪵', qty: Math.floor(Math.random() * 5 + 4) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'food', name: '식량', icon: '🍖', qty: Math.floor(Math.random() * 4 + 3) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'iron', name: '철광석', icon: '⚙️', qty: Math.floor(Math.random() * 3 + 2) * Math.min(3, Math.ceil(floor / 2)) },
            { key: 'bone', name: '짐승 뼈', icon: '🦴', qty: Math.floor(Math.random() * 4 + 3) * Math.min(3, Math.ceil(floor / 2)) },
          ];
          const dropItem = sarcPool[Math.floor(Math.random() * sarcPool.length)];
          const goldAmt = Math.max(5, Math.floor((Math.random() * 14 + 10) * floor * multiplier * 0.5));

          const checkForgeEquipDrop = (chance = 0.7) => {
            if (Math.random() < chance) {
              const fEquip = gm.generateForgeEquipmentDrop(floor);
              gm.addToDungeonInventory(fEquip.id, fEquip.name, fEquip.icon, 1, fEquip, undefined, 'equipment');
              const enchantBadge = (fEquip.prefix || fEquip.suffix) ? '✨인챈트 ' : '';
              gm.addLog(`⚰️ [고대 석관 무구 안치] 석관 속에서 ${enchantBadge}[${fEquip.name}] (T${fEquip.tier || 1}, [${fEquip.rarity.toUpperCase()}])을(를) 발굴했습니다! (도감 등록 가능)`, 'reward');
            }
          };

          const checkOopartsDrop = (chance = 0.35) => {
            if (floor <= 10 && Math.random() < chance) {
              const subIdx = Math.random() < 0.5 ? 1 : 2;
              const oKey = `ooparts_${floor}_${subIdx}`;
              const oMeta = GameManager.getResourceMeta(oKey);
              gm.addToDungeonInventory(oKey, oMeta.name, oMeta.icon, 1);
              gm.addLog(`🏛️✨ [멸망 이전 유물 발굴] 고대 석관 안치대에서 구세계의 오파츠 [${oMeta.name}]을(를) 발굴했습니다! (심연의 백과 등록용)`, 'reward');
            }
          };

          setEventCard({
            title: '⚰️ 잠긴 고대 영웅의 석관',
            desc: '심연의 결계 룬으로 단단히 잠긴 석관이 안치되어 있습니다.\n어떻게 개방하시겠습니까?',
            icon: '⚰️',
            iconKey: 'event_sarcophagus',
            options: [
              {
                label: hasKey
                  ? (hasEnhancedKey
                    ? `🗝️✨ [황금 열쇠 사용] 석관 봉인 정밀 해제 (제식장비 100% + 자원 2배: ${dropItem.icon}${dropItem.name} ×${dropItem.qty * 2} + ✨에테르 +30 + 🪙${goldAmt * 2}G + 💀저주장비 확률 +50%)`
                    : `🗝️ [열쇠 사용] 석관 봉인 정밀 해제 (제식장비 100% + 자원 2배: ${dropItem.icon}${dropItem.name} ×${dropItem.qty * 2} + ✨에테르 +20 + 🪙${goldAmt * 2}G)`)
                  : '🗝️ [열쇠 필요] 해제 도구 없음 (던전 열쇠 필요 - 선택 불가)',
                variant: hasKey ? 'success' : 'ghost',
                disabled: !hasKey,
                action: () => {
                  if (!hasKey) return;
                  const usedEnhanced = hasEnhancedKey;
                  if (usedEnhanced) {
                    gm.consumeDungeonItem('enhanced_key', 1);
                  } else {
                    gm.consumeDungeonItem('key', 1);
                  }
                  const checkCursedDrop = () => {
                    const baseChance = floor >= 6 ? 0.40 : 0.0;
                    const cursedChance = usedEnhanced ? (baseChance + 0.50) : baseChance;
                    if (Math.random() < cursedChance) {
                      const cursedEquip = gm.generateCursedEquipment(Math.max(6, floor));
                      gm.addToDungeonInventory(cursedEquip.id, cursedEquip.name, cursedEquip.icon, 1, cursedEquip, undefined, 'equipment');
                      gm.addLog(`💀✨ [저주받은 보구 발견] ${usedEnhanced ? '황금 열쇠의 신비한 공명으로' : '고대 석관 안치대에서'} 저주에 침식된 [${cursedEquip.name}]을(를) 발굴했습니다! (정화 전 착용 불가)`, 'danger');
                    }
                  };
                  const etherAmt = usedEnhanced ? 30 : 20;
                  gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt * 2);
                  gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty * 2);
                  gm.addToDungeonInventory('ether', '에테르', '✨', etherAmt);
                  checkForgeEquipDrop(1.0); // 100% 확률로 병기창 장비 드랍
                  checkCursedDrop();
                  checkOopartsDrop(0.40);
                  gm.addLog(`🗝️ [${usedEnhanced ? '황금 열쇠' : '석관 열쇠'} 개방 대성공] 열쇠로 심연의 봉인을 해제하여 골드 ${goldAmt * 2}G, [${dropItem.name} ×${dropItem.qty * 2}], ✨에테르 +${etherAmt}를 안전하게 회수했습니다!${usedEnhanced ? ' (저주장비 확률 +50%)' : ''}`, 'reward');
                  setEventCard(null);
                }
              },
              {
                label: `🔨 [강제 파괴] 무력으로 덮개 부수기 (70% 성공: 장비 및 ${dropItem.icon}${dropItem.name} ×${dropItem.qty} / 30% 독가스 트랩)`,
                variant: 'primary',
                action: () => {
                  const roll = Math.random();
                  if (roll < 0.70) {
                    const checkCursedDrop = () => {
                      if (floor >= 6 && Math.random() < 0.40) {
                        const cursedEquip = gm.generateCursedEquipment(floor);
                        gm.addToDungeonInventory(cursedEquip.id, cursedEquip.name, cursedEquip.icon, 1, cursedEquip, undefined, 'equipment');
                        gm.addLog(`💀 [저주받은 보구 발견] 고대 석관 안치대에서 저주에 침식된 [${cursedEquip.name}]을(를) 발굴했습니다! (정화 전 착용 불가)`, 'danger');
                      }
                    };
                    gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt);
                    gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty);
                    checkForgeEquipDrop(0.70); // 70% 확률로 병기창 장비 드랍
                    checkCursedDrop();
                    checkOopartsDrop(0.20);
                    gm.addLog(`🗝️ [석관 강제 개방] 골드 ${goldAmt}G 및 [${dropItem.name} ×${dropItem.qty}] 획득!`, 'reward');
                  } else {
                    SoundManager.getInstance().play('hero_hurt');
                    gm.party.forEach(h => {
                      h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.85));
                      gm.applyStatusEffectToHero(h, { type: 'bleed', turnsLeft: 3, totalTurns: 3, magnitude: Math.floor(h.maxHp * 0.05), source: '고대 석관 독가스' });
                    });
                    gm.emit('partyUpdated');
                    gm.addLog('☠️ [석관 함정] 봉인 독가스 폭발! 파티 전원 HP 15% 피해 및 🩸 출혈 부여', 'danger');
                  }
                  setEventCard(null);
                }
              },
              {
                label: '✨ [마력 해제] 마력 공명 해제 (파티 전원 MP 20 소모 ➔ 80% 장비 및 100% 안전)',
                variant: 'primary',
                action: () => {
                  const checkCursedDrop = () => {
                    if (floor >= 6 && Math.random() < 0.40) {
                      const cursedEquip = gm.generateCursedEquipment(floor);
                      gm.addToDungeonInventory(cursedEquip.id, cursedEquip.name, cursedEquip.icon, 1, cursedEquip, undefined, 'equipment');
                      gm.addLog(`💀 [저주받은 보구 발견] 고대 석관 안치대에서 저주에 침식된 [${cursedEquip.name}]을(를) 발굴했습니다! (정화 전 착용 불가)`, 'danger');
                    }
                  };
                  gm.party.forEach(h => { h.currentMp = Math.max(0, h.currentMp - 20); });
                  gm.emit('partyUpdated');
                  gm.addToDungeonInventory('gold', '골드', '🪙', goldAmt);
                  gm.addToDungeonInventory(dropItem.key, dropItem.name, dropItem.icon, dropItem.qty);
                  gm.addToDungeonInventory('ether', '에테르', '✨', 10);
                  checkForgeEquipDrop(0.80); // 80% 확률로 병기창 장비 드랍
                  checkCursedDrop();
                  checkOopartsDrop(0.30);
                  gm.addLog(`✨ [마력 해제 성공] MP 20을 소모하여 안전하게 골드 ${goldAmt}G, [${dropItem.name} ×${dropItem.qty}], ✨에테르 +10 획득!`, 'reward');
                  setEventCard(null);
                }
              },
              {
                label: '🙏 [포기] 건드리지 않고 지나친다',
                variant: 'ghost',
                action: () => {
                  gm.addLog('고대 영웅의 안식을 방해하지 않고 지나쳤습니다.', 'normal');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'altar': {
          SoundManager.getInstance().play('heal');
          const enhancedHolyCount = gm.getDungeonItemCount('enhanced_holy_water');
          const normalHolyCount = gm.getDungeonItemCount('holy_water');
          const hasEnhancedHoly = enhancedHolyCount > 0;
          const hasHolyWater = hasEnhancedHoly || normalHolyCount > 0;
          const etherAmt = Math.floor(Math.random() * 8 + 6) * Math.min(4, Math.ceil(floor / 2));
          const holyHero = findPartyHeroByClasses(gm.party, [...CLASS_GROUPS.holy_priests, ...CLASS_GROUPS.holy_knights]);

          setEventCard({
            title: '🏛️ 타락한 여신의 제단',
            desc: '심연의 어둠 속에서도 미약한 성스러운 기운을 내뿜는 여신상이 서 있습니다.\n어떻게 행동하시겠습니까?',
            icon: '🏛️',
            iconKey: 'event_altar',
            options: [
              ...(holyHero ? (() => {
                const dungeonEther = gm.getDungeonItemCount('ether');
                const citadelEther = gm.resources.ether || 0;
                const totalEther = dungeonEther + citadelEther;
                const canAffordEther = totalEther >= 100;
                return [{
                  label: canAffordEther
                    ? `🌟 [${holyHero.name} 특기] 신성 축성 기도 (✨ 에테르 100 소모 ➔ 전원 HP/MP 35% 회복 & 디버프 해제)`
                    : `🌟 [${holyHero.name} 특기] 신성 축성 기도 (✨ 에테르 100 필요 - 보유 에테르 부족: ${totalEther}/100)`,
                  variant: canAffordEther ? ('success' as const) : ('ghost' as const),
                  disabled: !canAffordEther,
                  action: () => {
                    if (!canAffordEther) return;
                    // 배낭 에테르 우선 소모 후 부족분은 성채 에테르에서 소모
                    let needed = 100;
                    if (dungeonEther > 0) {
                      const fromDungeon = Math.min(dungeonEther, needed);
                      gm.consumeDungeonItem('ether', fromDungeon);
                      needed -= fromDungeon;
                    }
                    if (needed > 0) {
                      gm.modifyResource('ether', -needed);
                    }

                    SoundManager.getInstance().play('heal');
                    const nextD = Math.max(0, danger - 20);
                    setDanger(nextD);
                    gm.dungeonDangerLevel = nextD;
                    gm.party.forEach(h => {
                      if (h.currentHp > 0) {
                        h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.35));
                        h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * 0.35));
                        h.statusEffects = [];
                      }
                    });
                    gm.emit('partyUpdated');
                    gm.addLog(`🌟 [신성 특기] [${holyHero.name}]의 경건한 기도로 여신의 제단이 성결해졌습니다! (✨ 에테르 100 소모, 위험도 -20 감소, 생존 대원 전원 HP/MP 35% 회복 및 디버프 해제)`, 'reward');
                    setEventCard(null);
                  }
                }];
              })() : []),
              {
                label: hasHolyWater
                  ? (hasEnhancedHoly
                    ? '💧✨ [여신의 성수 공양] 성상 축성 (전원 HP 30% / MP 40% 회복 + 모든 디버프 해제 + ✨에테르 +50)'
                    : '💧 [정화의 성수 공양] 성상 완전 축성 (전원 HP 50% / MP 50% 회복 + 모든 디버프 해제 + 3턴간 디버프 면역 + ✨에테르 +30)')
                  : '💧 [성수 필요] 축성 도구 없음 (정화/여신의 성수 필요 - 선택 불가)',
                variant: hasHolyWater ? 'success' : 'ghost',
                disabled: !hasHolyWater,
                action: () => {
                  if (!hasHolyWater) return;
                  const usedEnhanced = hasEnhancedHoly;
                  if (usedEnhanced) {
                    if (gm.consumeDungeonItem('enhanced_holy_water', 1)) {
                      gm.party.forEach(h => {
                        if (h.currentHp > 0) {
                          h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.30));
                          h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * 0.40));
                          h.statusEffects = [];
                        }
                      });
                      gm.emit('partyUpdated');
                      gm.addToDungeonInventory('ether', '에테르', '✨', 50);
                      gm.addLog('💧✨ [여신의 성수 축성 성공] 여신의 성수로 성상을 축성하여 생존 대원 전원 HP 30% / MP 40% 회복, 모든 디버프 해제 및 ✨ 에테르 +50 획득!', 'reward');
                    }
                  } else {
                    if (gm.consumeDungeonItem('holy_water', 1)) {
                      gm.party.forEach(h => {
                        if (h.currentHp > 0) {
                          h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.50));
                          h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * 0.50));
                          h.statusEffects = [];
                          // 🌟 3턴간 상태이상 면역 결계 부여!
                          gm.applyStatusEffectToHero(h, { type: 'immunity', turnsLeft: 3, totalTurns: 3, magnitude: 1, source: '정화의 성수' });
                        }
                      });
                      gm.emit('partyUpdated');
                      gm.addToDungeonInventory('ether', '에테르', '✨', 30);
                      gm.addLog('💧 [정화의 성수 축성 대성공] 정화의 성수로 성상을 축성하여 생존 대원 HP 50% / MP 50% 회복, 모든 디버프 해제, 3턴간 [상태이상 면역] 부여 및 ✨ 에테르 +30 획득!', 'reward');
                    }
                  }
                  setEventCard(null);
                }
              },
              {
                label: '🙏 [맨손 기도] 제단에 경건한 기도 올리기 (생존 대원 HP 25% / MP 25 회복)',
                variant: 'primary',
                action: () => {
                  gm.party.forEach(h => {
                    if (h.currentHp > 0) {
                      h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.25));
                      h.currentMp = Math.min(h.maxMp, h.currentMp + 25);
                      h.statusEffects = [];
                    }
                  });
                  gm.emit('partyUpdated');
                  gm.addLog('💧 [성수 정화] 성스러운 기운으로 생존 대원 HP 25%/MP +25 회복 및 모든 디버프 정화 완료!', 'reward');
                  setEventCard(null);
                }
              },
              {
                label: `🔮 [강제 추출] 제단의 에테르 핵 강제 추출 (✨ 에테르 +${etherAmt + 10} / 위험도 +15)`,
                variant: 'danger',
                action: () => {
                  const nextD = Math.min(maxDanger, danger + 15);
                  setDanger(nextD);
                  gm.dungeonDangerLevel = nextD;
                  gm.addToDungeonInventory('ether', '에테르', '✨', etherAmt + 10);
                  gm.addLog(`🔮 [에테르 추출] 성상에서 ✨ 에테르 ${etherAmt + 10}개를 추출했습니다. (심연의 이목 집중, 위험도 +15)`, 'danger');
                  setEventCard(null);
                }
              },
              {
                label: '🚶 [포기] 묵념만 하고 지나친다 (MP +10 회복)',
                variant: 'ghost',
                action: () => {
                  gm.party.forEach(h => { h.currentMp = Math.min(h.maxMp, h.currentMp + 10); });
                  gm.emit('partyUpdated');
                  gm.addLog('🙏 [묵념] 경건한 기도 후 MP +10 회복을 얻고 지나쳤습니다.', 'normal');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'branching': {
          SoundManager.getInstance().play('click');
          const enhancedPickCount = gm.getDungeonItemCount('enhanced_pickaxe');
          const normalPickCount = gm.getDungeonItemCount('pickaxe');
          const hasEnhancedPick = enhancedPickCount > 0;
          const hasPickaxe = hasEnhancedPick || normalPickCount > 0;
          const woodAmt = Math.floor(Math.random() * 4 + 3);
          const stoneAmt = Math.floor(Math.random() * 4 + 3);

          setEventCard({
            title: '🧭 갈림길 & 미궁의 샛길',
            desc: '두 갈래로 뻗은 심연의 통로가 나타났습니다.\n어느 방향으로 원정대를 지휘하시겠습니까?',
            icon: '🧭',
            iconKey: 'event_branching',
            options: [
              {
                label: '⚡ [심연 급행로] 보스 방으로 직행하는 위험한 급행로 (위험도 +25 상승 / 진척도 대폭 가속 & ✨ 에테르 +30)',
                variant: 'danger',
                action: () => {
                  SoundManager.getInstance().play('heavy_hit');
                  const nextD = Math.min(maxDanger, danger + 25);
                  setDanger(nextD);
                  gm.dungeonDangerLevel = nextD;
                  gm.addToDungeonInventory('ether', '에테르', '✨', 30);
                  gm.addLog('⚡ [진척도 급가속] 마물들이 우글거리는 심연의 최단 급행로로 과감히 돌파했습니다! (위험도 +25 급상승, 보스 출현 게이지 가속, ✨에테르 +30 획득)', 'reward');
                  setEventCard(null);
                }
              },
              {
                label: hasPickaxe
                  ? (hasEnhancedPick
                    ? '⛏️✨ [심연 곡괭이 사용] 초고속 낙석 돌파 (위험도 -50 대폭 감소 + 🪨석재 +20 + ⚙️철광석 +10)'
                    : '⛏️ [곡괭이 사용] 낙석 통로 개척 (100% 안전 / 위험도 -25 대폭 감소 + 🪨석재 +10)')
                  : '⛏️ [곡괭이 필요] 숏컷 개척 도구 없음 (곡괭이 필요 - 선택 불가)',
                variant: hasPickaxe ? 'success' : 'ghost',
                disabled: !hasPickaxe,
                action: () => {
                  if (!hasPickaxe) return;
                  if (hasEnhancedPick) {
                    if (gm.consumeDungeonItem('enhanced_pickaxe', 1)) {
                      const nextD = Math.max(0, danger - 50);
                      setDanger(nextD);
                      gm.dungeonDangerLevel = nextD;
                      gm.addToDungeonInventory('stone', '석재', '🪨', 20);
                      gm.addToDungeonInventory('iron', '철광석', '⚙️', 10);
                      gm.addLog('⛏️✨ [심연 곡괭이 숏컷 개척 대성공] 심연 곡괭이의 마력으로 암반을 한순간에 파쇄하여 최단거리 숏컷을 개척했습니다! (위험도 -50 감소, 🪨석재 +20, ⚙️철광석 +10 획득)', 'reward');
                    }
                  } else {
                    if (gm.consumeDungeonItem('pickaxe', 1)) {
                      const nextD = Math.max(0, danger - 25);
                      setDanger(nextD);
                      gm.dungeonDangerLevel = nextD;
                      gm.addToDungeonInventory('stone', '석재', '🪨', 10);
                      gm.addLog('⛏️ [곡괭이 숏컷 개척 대성공] 곡괭이로 낙석을 뚫고 안전한 비밀 숏컷을 개척했습니다! (위험도 -25 감소, 석재 +10 획득)', 'reward');
                    }
                  }
                  setEventCard(null);
                }
              },
              {
                label: '👟 [강행 돌파] 위험한 비밀 숏컷 진입 (위험도 -15 감소 / 20% 마물 기습)',
                variant: 'primary',
                action: () => {
                  const roll = Math.random();
                  if (roll < 0.80) {
                    const nextD = Math.max(0, danger - 15);
                    setDanger(nextD);
                    gm.dungeonDangerLevel = nextD;
                    gm.addLog('👟 [숏컷 개척 성공] 지름길을 통해 어둠 속 마물들의 추적을 따돌렸습니다! (위험도 -15 감소)', 'reward');
                    setEventCard(null);
                  } else {
                    gm.addLog('⚠️ [숏컷 기습] 샛길 안쪽에 잠복해 있던 마물과 마주쳤습니다!', 'danger');
                    setEventCard(null);
                    const squad = generateMonsterSquad(floor, false, danger);
                    if (squad && squad.length > 0) {
                      gm.currentMonsters = squad;
                      gm.clearBattleSnapshot();
                      gm.saveGame();
                      navigateTo('battle');
                    }
                  }
                }
              },
              {
                label: `🪵 [우회로 탐색] 안전한 자원 우회로 (🪵 영목 +${woodAmt}, 🪨 석재 +${stoneAmt} 수급)`,
                variant: 'success',
                action: () => {
                  gm.addToDungeonInventory('wood', '목재', '🪵', woodAmt);
                  gm.addToDungeonInventory('stone', '석재', '🪨', stoneAmt);
                  gm.addLog(`🪵 [우회로 정비] 안전한 통로에서 🪵 영목 ${woodAmt}개, 🪨 석재 ${stoneAmt}개를 수습했습니다.`, 'system');
                  setEventCard(null);
                }
              },
              {
                label: '🚶 [포기] 원래 길로 계속 전진',
                variant: 'ghost',
                action: () => {
                  gm.addLog('샛길을 피하고 본래 탐험로를 유지합니다.', 'normal');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'merchant': {
          SoundManager.getInstance().play('coin');
          const potionGoldCost = 200;
          const potionEtherCost = 200;
          const supplyEtherCost = 80;
          const currentGold = gm.resources.gold;
          const currentEther = gm.resources.ether;
          const canAffordPotion = currentGold >= potionGoldCost && currentEther >= potionEtherCost;

          setEventCard({
            title: '🧳 길 잃은 방랑 보급관',
            desc: '심연 한구석에 은신해 있던 방랑 상인이 원정대를 반갑게 맞이합니다.\n"지휘관님, 생존을 위한 비축 보급품이 필요하십니까?"',
            icon: '🧳',
            iconKey: 'event_merchant',
            options: [
              {
                label: canAffordPotion
                  ? `🧪 응급 생체 회복약 구매 (${potionGoldCost}G + ✨${potionEtherCost} 소모 ➔ 전원 HP/MP 50% 회복)`
                  : `🧪 응급 생체 회복약 구매 (${potionGoldCost}G & ✨${potionEtherCost} 필요 - ${currentGold < potionGoldCost ? '골드 부족' : '에테르 부족'})`,
                variant: 'primary',
                disabled: !canAffordPotion,
                action: () => {
                  if (!canAffordPotion) return;
                  gm.modifyResource('gold', -potionGoldCost);
                  gm.modifyResource('ether', -potionEtherCost);
                  gm.party.forEach(h => {
                    if (h.currentHp > 0) {
                      h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.5));
                      h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * 0.5));
                    }
                  });
                  gm.emit('partyUpdated');
                  gm.addLog(`🧪 [상인 거래] 200G와 에테르 200개로 생존 대원 전원 HP/MP 50% 회복 완료!`, 'reward');
                  setEventCard(null);
                }
              },
              {
                label: currentGold >= supplyEtherCost
                  ? `✨ 에테르 보급팩 구매 (${supplyEtherCost}G 소모 ➔ ✨ 에테르 +25)`
                  : `✨ 에테르 보급팩 구매 (${supplyEtherCost}G 필요 - 골드 부족)`,
                variant: 'success',
                disabled: currentGold < supplyEtherCost,
                action: () => {
                  if (currentGold < supplyEtherCost) return;
                  gm.modifyResource('gold', -supplyEtherCost);
                  gm.addToDungeonInventory('ether', '에테르', '✨', 25);
                  gm.addLog(`✨ [상인 거래] 골드 ${supplyEtherCost}G로 ✨ 에테르 25개를 보급받았습니다!`, 'reward');
                  setEventCard(null);
                }
              },
              {
                label: '👋 인사만 나누고 지나친다',
                variant: 'ghost',
                action: () => {
                  gm.addLog('방랑 보급관에게 다음 안녕을 기원하며 지나쳤습니다.', 'normal');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'trap': {
          const aliveHeroes = gm.party.filter(h => h.currentHp > 0);
          if (aliveHeroes.length === 0) break;

          const trap = DUNGEON_TRAPS[Math.floor(Math.random() * DUNGEON_TRAPS.length)];
          const resultLines: string[] = [];
          let hitCount = 0;
          let evadeCount = 0;

          aliveHeroes.forEach(hero => {
            const eff = gm.getHeroEffectiveStats(hero);
            const heroLuck = eff.luck ?? 10;
            // 🍀 행운 기반 개별 회피 판정: 기본 30% + (행운 * 1.5)% (최소 25% ~ 최대 70%)
            const evadeChance = Math.min(70, Math.max(25, Math.round(30 + heroLuck * 1.5)));
            const isEvaded = Math.random() * 100 < evadeChance;

            if (isEvaded) {
              evadeCount++;
              resultLines.push(`  💨 ${hero.name}: 회피 성공 (${trap.evadeVerb})`);
            } else {
              hitCount++;
              gm.applyStatusEffectToHero(hero, {
                type: trap.statusType,
                turnsLeft: trap.duration,
                totalTurns: trap.duration,
                magnitude: trap.magnitude,
                source: trap.name
              });
              resultLines.push(`  💥 ${hero.name}: 피격! ➔ ${trap.statusIcon} ${trap.statusLabel} (${trap.duration}턴)`);
            }
          });

          if (hitCount > 0) {
            SoundManager.getInstance().play('hero_hurt');
          } else {
            SoundManager.getInstance().play('loot_open');
          }

          gm.emit('partyUpdated');
          gm.addLog(
            hitCount === 0
              ? `💨 [함정 회피] ${trap.name}의 기습을 전원 기민하게 회피했습니다!`
              : `💥 [함정 피격] ${trap.name} 발동! ${hitCount}명 피격 [${trap.statusIcon}${trap.statusLabel} 부여], ${evadeCount}명 회피`,
            hitCount > 0 ? 'danger' : 'reward'
          );

          const summaryBanner = hitCount === 0
            ? '✨ [전원 회피 완벽 성공!]'
            : hitCount === aliveHeroes.length
            ? '💥 [전원 피격 — 긴급 상태이상 부여]'
            : `⚠️ [피격 ${hitCount}명 / 회피 ${evadeCount}명]`;

          setEventCard({
            title: `⚠️ [함정 발동] ${trap.name}`,
            desc: `"${trap.desc}"\n\n${summaryBanner}\n━━━━━━━━━━━━━━━━━━\n${resultLines.join('\n')}`,
            icon: trap.icon,
            iconKey: trap.id || 'event_trap',
            options: [
              {
                label: hitCount > 0 ? '🩸 [피해 확인] 대열을 정비하고 전진' : '✨ [전원 무사] 대열을 유지하며 전진',
                variant: hitCount > 0 ? 'danger' : 'primary',
                action: () => {
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'buff': {
          SoundManager.getInstance().play('heal');
          setEventCard({
            title: '✨ 신비로운 에테르 기류',
            desc: '심연의 균열 사이로 영롱한 순수 에테르 기류가 흘러나옵니다.\n기류를 어떻게 활용하시겠습니까?',
            icon: '✨',
            iconKey: 'event_buff',
            options: [
              {
                label: '🧘 [영혼 명상] 에테르 기류 흡수 (생존 대원 MP 10% 회복)',
                variant: 'primary',
                action: () => {
                  gm.party.forEach(h => {
                    if (h.currentHp > 0) {
                      h.currentMp = Math.min(h.maxMp, h.currentMp + Math.max(1, Math.floor(h.maxMp * 0.10)));
                    }
                  });
                  gm.emit('partyUpdated');
                  gm.addLog('✨ [에테르 명상] 신비로운 기운을 흡수하여 생존 대원 MP 10% 회복!', 'reward');
                  setEventCard(null);
                }
              },
              {
                label: '🔮 [에테르 결정화] 기류를 마도석에 농축 (✨ 에테르 +15 수급)',
                variant: 'success',
                action: () => {
                  gm.addToDungeonInventory('ether', '에테르', '✨', 15);
                  gm.addLog('🔮 [에테르 결정화] 기류를 마도석에 농축하여 ✨ 에테르 +15 획득!', 'reward');
                  setEventCard(null);
                }
              },
              {
                label: '⚡ [기류 각인] 에테르 기류를 전신에 각인 (이번 원정 동안 치명타율 +10% & 공격력 +10% 가호)',
                variant: 'danger',
                action: () => {
                  gm.addExpeditionBuff({
                    id: 'expedition_aether_stream',
                    name: '에테르 기류 각인',
                    icon: '⚡',
                    category: 'ancestral',
                    description: '이번 원정 동안 치명타율 +10% & 공격력 +10%',
                    conditionText: '이번 원정 동안',
                    buffs: { critRateBonus: 10, atkBonus: 1.10 }
                  });
                  gm.addLog('⚡ [기류 각인] 순수 에테르 기류를 전신에 각인하여 이번 원정 동안 치명타율 +10% & 공격력 +10% 가호를 얻었습니다!', 'reward');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'return_portal': {
          SoundManager.getInstance().play('spell');
          gm.addLog('💠 [비밀 포탈] 영지로 안전하게 돌아갈 수 있는 차원 균열이 발견되었습니다.', 'system');
          setEventCard({
            title: '✨ 무작위 귀환 포탈 발견',
            desc: '어딘가로 통하는 불안정한 차원 균열이 보입니다.\n조사해보니 영지로 통하는 안전한 길입니다. 귀환하시겠습니까?',
            icon: '🌀',
            iconKey: 'event_portal',
            options: [
              {
                label: '🏕️ 영지로 안전 귀환 (전리품 정산)',
                variant: 'success',
                action: () => {
                  setEventCard(null);
                  returnToCitadel();
                }
              },
              {
                label: '무시하고 탐험 계속',
                variant: 'ghost',
                action: () => {
                  gm.addLog('귀환 기회를 포기하고 깊은 심연으로 발걸음을 옮깁니다.', 'normal');
                  setEventCard(null);
                }
              }
            ]
          });
          break;
        }

        case 'portal': {
          SoundManager.getInstance().play('spell');
          if (floor === 11) {
            gm.addLog('💠 [무간도 시공간 균열] 무간도의 공간을 굴절시키는 차원 왜곡 지름길이 발견되었습니다.', 'system');
            setEventCard({
              title: '🌌 무간도 시공간 균열 발견',
              desc: '무간도의 끝없는 공간을 단축하는 차원 왜곡 균열이 보입니다.\n균열을 타고 심연의 더 깊은 곳(위험도 +30~60 전진)으로 도약하시겠습니까?',
              icon: '🌀',
              iconKey: 'event_portal',
              options: [
                {
                  label: '▶ 시공간 도약 (위험도 +30~60 고속 전진)',
                  variant: 'primary',
                  action: () => {
                    const dangerJump = Math.floor(Math.random() * 31) + 30;
                    const nextD = Math.min(maxDanger, danger + dangerJump);
                    setDanger(nextD);
                    gm.dungeonDangerLevel = nextD;
                    gm.saveGame();
                    gm.addLog(`🌌 [시공간 도약] 차원 균열을 통해 위험도 +${dangerJump}만큼 심연 속으로 고속 전진했습니다! (현재 위험도: ${nextD.toLocaleString()})`, 'reward');
                    setEventCard(null);
                  }
                },
                {
                  label: '무시하고 탐험 계속',
                  variant: 'ghost',
                  action: () => {
                    gm.addLog('불안정한 균열을 무시하고 안전한 탐험로를 택했습니다.', 'normal');
                    setEventCard(null);
                  }
                }
              ]
            });
          } else {
            gm.addLog('💠 [차원 균열] 불안정한 차원 균열이 발견되었습니다.', 'system');
            setEventCard({
              title: '✨ 차원 지름길 발견',
              desc: '어딘가로 통하는 불안정한 차원 균열이 보입니다.\n과감히 뛰어드시겠습니까?',
              icon: '🌀',
              iconKey: 'event_portal',
              options: [
                {
                  label: '▶ 균열로 뛰어든다 (다음 층 즉시 이동)',
                  variant: 'primary',
                  action: () => {
                    const nextFloor = Math.min(11, floor + 1);
                    setFloor(nextFloor);
                    gm.dungeonFloor = nextFloor;
                    gm.unlockedDungeonFloor = Math.max(gm.unlockedDungeonFloor || 1, nextFloor);
                    setDanger(0);
                    gm.dungeonDangerLevel = 0;
                    gm.isOvercharged = false;
                    setCampCooldown(0);
                    gm.campCooldown = 0;
                    gm.saveGame();
                    gm.addLog(`👟 [심연의 이끌림] 차원 지름길을 통해 즉시 ${FLOOR_NAMES[nextFloor - 1] || nextFloor+'층'}(${nextFloor}층)으로 강하했습니다!`, 'reward');
                    setEventCard(null);
                  }
                },
                {
                  label: '무시하고 탐험 계속',
                  variant: 'ghost',
                  action: () => {
                    gm.addLog('불안정한 균열을 무시하고 안전한 탐험로를 택했습니다.', 'normal');
                    setEventCard(null);
                  }
                }
              ]
            });
          }
          break;
        }

        case 'floor_unique': {
          const uEvent = getFloorUniqueEvent(floor, gm);
          if (uEvent) {
            SoundManager.getInstance().play('portal');
            const opts = uEvent.generateOptions({
              gm,
              danger,
              maxDanger,
              floor,
              setDanger,
              setEventCard,
              navigateTo,
              returnToCitadel
            });
            setEventCard({
              title: uEvent.title,
              desc: uEvent.desc,
              icon: uEvent.icon,
              iconKey: uEvent.iconKey,
              options: opts
            });
          } else {
            SoundManager.getInstance().play('loot_open');
            gm.addToDungeonInventory('gold', '골드', '🪙', 50);
            gm.addLog('심연의 흔적 속에서 50골드를 수습했습니다.', 'reward');
          }
          break;
        }

        case 'nothing':
        default: {
          SoundManager.getInstance().play('click');
          const ambientMessages = [
            '🚶 [고요한 통로] 마물의 기척 없이 조용히 통로를 전진합니다.',
            '👣 [안전 탐색] 어둠 속을 조심스럽게 살피며 한 걸음 나아갑니다.',
            '🕯️ [탐사 지속] 주변에 큰 위협이 없어 침착하게 수색을 이어갑니다.',
            '💨 [스산한 바람] 폐허의 균열 사이로 차가운 바람이 스쳐 지나갑니다.',
            '👁️ [정적] 긴장된 정적 속에서 주변을 경계하며 발걸음을 옮깁니다.',
          ];
          const msg = ambientMessages[Math.floor(Math.random() * ambientMessages.length)];

          // 25% 확률로 바닥에 떨어진 소량의 기본 자원 자동 줍기
          const forageRoll = Math.random();
          if (forageRoll < 0.25) {
            const foragePool = [
              { key: 'wood', desc: '영목 파편', icon: '🪵', qty: Math.floor(Math.random() * 2 + 1) },
              { key: 'stone', desc: '석재 조각', icon: '🪨', qty: Math.floor(Math.random() * 2 + 1) },
              { key: 'iron', desc: '녹슨 철조각', icon: '⚙️', qty: 1 },
              { key: 'gold', desc: '떨어진 골드', icon: '🪙', qty: Math.floor(Math.random() * 6 + 4) },
            ];
            const item = foragePool[Math.floor(Math.random() * foragePool.length)];
            const meta = GameManager.getResourceMeta(item.key);
            gm.addToDungeonInventory(item.key, meta.name, meta.icon, item.qty);
            gm.addLog(`${msg} (${item.desc}을(를) 주워 [${meta.icon} ${meta.name} +${item.qty}] 수습)`, 'normal');
          } else {
            gm.addLog(msg, 'normal');
          }
          setEventCard(null);
          break;
        }
      }
      setIsAnimating(false);
    }, 400);
  }, [isAnimating, eventCard, danger, floor, isTorchLit, torchTurns, gm, maxDanger, navigateTo, rollEvent, campCooldown]);

    const toggleTorch = useCallback(() => {
    const hasEtherTorch = gm.getDungeonItemCount('enhanced_torch') > 0;
    const hasNormalTorch = gm.getDungeonItemCount('torch') > 0;

    if (torchTurns > 0) {
      if (hasEtherTorch && gm.consumeDungeonItem('enhanced_torch', 1)) {
        setTorchTurns(prev => prev + 3);
        setIsEtherTorch(true);
        SoundManager.getInstance().play('torch_light');
        gm.addLog(`🔥✨ [에테르 횃불 연장] 에테르 횃불을 추가 점등하여 시야 확보를 3회 연장했습니다! (남은 탐색: ${torchTurns + 3}회, 위험도 상승 2배 가속)`, 'reward');
        gm.emit('dungeonUpdated');
      } else if (hasNormalTorch && gm.consumeDungeonItem('torch', 1)) {
        setTorchTurns(prev => prev + 3);
        SoundManager.getInstance().play('torch_light');
        gm.addLog(`🔥 [횃불 추가] 횃불을 더 피워 시야 확보 시간을 3회 연장했습니다! (남은 탐색: ${torchTurns + 3}회)`, 'reward');
        gm.emit('dungeonUpdated');
      } else {
        gm.addLog(`🔥 이미 횃불이 켜져 있습니다. (남은 탐색: ${torchTurns}회)`, 'system');
      }
      return;
    }

    if (tutorialStepId === 'TUTORIAL_EXPLORE_TORCH' && gm.getDungeonItemCount('torch') === 0 && gm.getDungeonItemCount('enhanced_torch') === 0) {
      gm.addToDungeonInventory('torch', '횃불', '🔥', 1, undefined, undefined, 'supply');
    }

    if (hasEtherTorch && gm.consumeDungeonItem('enhanced_torch', 1)) {
      setTorchTurns(3);
      setIsEtherTorch(true);
      SoundManager.getInstance().play('torch_light');
      gm.addLog('🔥✨ [에테르 횃불 점등] 강력한 에테르 불꽃으로 심연을 환히 밝힙니다! (탐험 시 위험도 상승 2배, 이벤트 발견율 2배↑, 몬스터 조우율 대폭 억제)', 'reward');
      gm.emit('dungeonUpdated');
      if (tutorialStepId === 'TUTORIAL_EXPLORE_TORCH') {
        handleAdvanceTutorial('TUTORIAL_EXPLORE_RETURN');
      }
    } else if (hasNormalTorch && gm.consumeDungeonItem('torch', 1)) {
      setTorchTurns(3);
      setIsEtherTorch(false);
      SoundManager.getInstance().play('torch_light');
      gm.addLog('🔥 [횃불 점등] 주위가 환해졌습니다! (3회 탐색 동안 자원/광맥/보물 발견율↑, 몬스터 조우율↓, 위험도 축적 속도↑)', 'reward');
      gm.emit('dungeonUpdated');
      if (tutorialStepId === 'TUTORIAL_EXPLORE_TORCH') {
        handleAdvanceTutorial('TUTORIAL_EXPLORE_RETURN');
      }
    } else {
      gm.addLog('🔥 횃불이 부족합니다! 채비실에서 미리 횃불을 구비해야 합니다.', 'danger');
    }
  }, [torchTurns, gm, tutorialStepId]);

  // 야영 (어둠 속 마물 기습 위험 & 모닥불 토크 & 탐색 3회 쿨다운)
  const doCamp = useCallback(() => {
    if (campCooldown > 0 && tutorialStepId !== 'TUTORIAL_EXPLORE_CAMP') {
      gm.addLog(`🏕️ [야영 쿨다운] 던전을 ${campCooldown}회 더 탐색해야 안전한 야영지를 확보할 수 있습니다! (탐색 3회당 1회 가능)`, 'danger');
      return;
    }

    if (tutorialStepId === 'TUTORIAL_EXPLORE_CAMP' && gm.getDungeonItemCount('food') === 0 && gm.getDungeonItemCount('enhanced_food') === 0) {
      gm.addToDungeonInventory('food', '식량', '🍖', 1, undefined, undefined, 'supply');
    }

    const hasEnhancedFood = gm.getDungeonItemCount('enhanced_food') > 0;
    const hasNormalFood = gm.getDungeonItemCount('food') > 0;

    let isEnhancedFood = false;
    if (hasEnhancedFood && gm.consumeDungeonItem('enhanced_food', 1)) {
      isEnhancedFood = true;
    } else if (hasNormalFood && gm.consumeDungeonItem('food', 1)) {
      isEnhancedFood = false;
    } else {
      gm.addLog('🏕️ 식량이 없어 야영을 할 수 없습니다! 채비실에서 식량을 준비해야 합니다.', 'danger');
      return;
    }

    setCampCooldown(3);
    gm.campCooldown = 3;
    SoundManager.getInstance().play('camp_fire');

    // 🌟 야영 기습 확률: 던전 도시락 섭취 시 기습 위협 절반(-50%) 완화!
    const baseAmbushRate = (dangerPct >= 50 ? 0.45 : 0.30) - (isTorchLit ? (isEtherTorch ? 0.20 : 0.10) : 0);
    const ambushRate = Math.max(0.05, baseAmbushRate * (isEnhancedFood ? 0.5 : 1));
    const isAmbushed = Math.random() < ambushRate;

    // 🌟 회복 비율: 던전 도시락 섭취 시 추가 회복량 10% 증가! (안전 야영 35%->45%, 기습 15%->25%)
    const safeHealPct = isEnhancedFood ? 0.45 : 0.35;
    const ambushHealPct = isEnhancedFood ? 0.25 : 0.15;

    if (isAmbushed) {
      SoundManager.getInstance().play('hero_hurt');
      gm.party.forEach(h => {
        if (h.currentHp > 0) {
          const heal = Math.floor(h.maxHp * ambushHealPct);
          const dmg = Math.floor(h.maxHp * (isEnhancedFood ? 0.08 : 0.12));
          h.currentHp = Math.max(1, Math.min(h.maxHp, h.currentHp + heal - dmg));
          h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * ambushHealPct));
        }
      });
      const nextD = Math.min(maxDanger, danger + (isEnhancedFood ? 5 : 10));
      setDanger(nextD);
      gm.dungeonDangerLevel = nextD;
      gm.addLog(`⚠️ [야영지 기습!] 휴식 도중 어둠 속 마물들에게 기습당했습니다! (생존 대원 HP/MP ${Math.round(ambushHealPct * 100)}% 회복${isEnhancedFood ? ' [도시락 회복량 +10%]' : ''}, 기습 피해 발생, 위험도 +${isEnhancedFood ? 5 : 10})`, 'danger');
    } else {
      gm.party.forEach(h => {
        if (h.currentHp > 0) {
          h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * safeHealPct));
          h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * safeHealPct));
        }
      });
      if (isEnhancedFood) {
        gm.addLog('🍱✨ [던전 도시락 안전 야영] 영양 가득한 던전 도시락을 섭취하며 안전하게 휴식했습니다! (생존 대원 HP/MP 45% 회복 [추가 회복 +10%], 기습 위협 50% 억제)', 'reward');
      } else {
        gm.addLog('🏕️ [안전 야영] 모닥불 주위에서 식량을 섭취하며 휴식을 취했습니다. (생존 대원 HP/MP 35% 회복)', 'reward');
      }
    }

    // 🛡️ [야영 생환 보장] 모닥불 온기와 식량으로 체력이 확보된 대원의 사경/전사 플래그 즉시 해제
    gm.party.forEach(h => {
      if (h.currentHp > 0) {
        h.isPermanentlyDead = false;
        h.deathCountdown = undefined;
      }
    });

    // 붕대 치료: 강화된 [성유 붕대] 우선 사용 (디버프 정화 + 3턴간 디버프 면역!)
    const DEBUFF_TYPES = new Set(['bleed', 'poison', 'burn', 'freeze', 'stun', 'debuff_atk', 'debuff_def', 'blind']);
    const hasEnhancedBandage = gm.getDungeonItemCount('enhanced_bandage') > 0;
    const hasNormalBandage = gm.getDungeonItemCount('bandage') > 0;

    if (hasEnhancedBandage && gm.consumeDungeonItem('enhanced_bandage', 1)) {
      gm.party.forEach(h => {
        if (h.currentHp > 0) {
          if (Array.isArray(h.statusEffects)) {
            h.statusEffects = h.statusEffects.filter(s => !DEBUFF_TYPES.has(s.type));
          }
          // 🌟 3턴간 모든 디버프 완전 면역 결계 부여!
          gm.applyStatusEffectToHero(h, { type: 'immunity', turnsLeft: 3, totalTurns: 3, magnitude: 1, source: '성유 붕대' });
        }
      });
      gm.addLog('🩹✨ [성유 붕대 응급처치] 성유 붕대를 소모하여 생존 대원의 모든 디버프를 완전 치료하고, 3턴간 [디버프 면역] 결계를 부여했습니다!', 'reward');
    } else if (hasNormalBandage && gm.consumeDungeonItem('bandage', 1)) {
      gm.party.forEach(h => {
        if (h.currentHp > 0 && Array.isArray(h.statusEffects)) {
          h.statusEffects = h.statusEffects.filter(s => !DEBUFF_TYPES.has(s.type));
        }
      });
      gm.addLog('🩹 [치유 붕대 응급처치] 붕대를 소모하여 생존 대원의 모든 디버프(출혈·중독·화상·빙결·기절·약화·실명)를 완전히 치료했습니다!', 'reward');
    }

      // 🏕️ 모닥불 토크 & 유대/소외감 엔진 가동
      const banter = gm.triggerCampBanter();
      setBanterResult(banter);

      // 👥 용병 관리 횟수 1회 재충전 (누적 불가)
      gm.rechargeMercenaryManage();

      gm.emit('partyUpdated');
      gm.emit('dungeonUpdated');
      gm.saveGame();
  }, [danger, isTorchLit, isEtherTorch, gm, maxDanger, campCooldown]);

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col bg-transparent overflow-hidden relative">

      {/* ── 던전 이미지 창 ── */}
      <div className="px-3 pt-2 shrink-0">
        <div 
          className="relative w-full panel overflow-hidden flex items-center justify-center border transition-all duration-300"
          style={{ height: 'clamp(140px, 22vh, 220px)', borderColor: floorColor, background: 'linear-gradient(135deg, #0d1525 0%, #1a0a2e 50%, #0d1525 100%)' }}
        >
          {/* 배경 효과 */}
          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle, ${floorColor}44 0%, transparent 70%)` }} />
          
          {!imgError ? (
            <img 
              src={imageSrc} 
              alt={floorName}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              style={{ filter: 'brightness(0.7) saturate(1.2)' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center w-full px-4 text-center">
               <div className="text-4xl mb-2">⚔️</div>
               <div className="text-[11px] text-[#8b9bb4] font-mono whitespace-pre-line leading-relaxed">
                  {floorPrompt}
               </div>
            </div>
          )}
          
          {/* 이름 오버레이 */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-end justify-between"
               style={{ background: 'linear-gradient(to top, #0d1525ee, transparent)' }}>
             <div>
               <div className="flex items-center gap-2 flex-wrap">
                 <span className="font-bold text-lg" style={{ color: floorColor }}>{floor}F {floorName}</span>
                 {gm.isFloorPurified(floor) ? (
                   <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#10b98122] text-[#34d399] border border-[#10b98155] flex items-center gap-0.5 shadow-sm">
                     ✨ 성역 정화 (맑아진 심연)
                   </span>
                 ) : (
                   <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#7c3aed22] text-[#c4b5fd] border border-[#7c3aed55] flex items-center gap-0.5 shadow-sm">
                     🌫️ 원초의 연무 (마기 잠식 +{floor === 11 ? 50 : floor * 5}%)
                   </span>
                 )}
               </div>
               {torchTurns > 0 && <div className="text-xs text-[#ff7043] font-bold">🔥 횃불 조명 중 (남은 탐색: {torchTurns}회 / 자원 발견↑)</div>}
             </div>
             <div className="text-right">
                <div className="text-sm font-bold font-mono" style={{ color: gm.isOvercharged ? '#ff1744' : dangerPct >= 70 ? '#ff5252' : dangerPct > 50 ? '#ff7043' : '#ffd54f' }}>
                  {gm.isOvercharged ? '🔥 OVERCHARGE' : floor === 11 ? `위험도 ${danger.toLocaleString()} / 10,000 (${dangerPct.toFixed(1)}%)` : dangerPct >= 70 ? `⚠️ 보스전조 ${dangerPct.toFixed(2)}%` : `위험도 ${dangerPct.toFixed(2)}%`}
                </div>
              </div>
          </div>
          
          {/* 위험도 상단 바 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0b0d13]">
             <div className="h-full transition-all duration-500" style={{
                width: `${dangerPct}%`,
                background: dangerPct > 75 ? '#d32f2f' : dangerPct > 50 ? '#ff7043' : '#ffd54f'
             }} />
          </div>
        </div>
      </div>

      {/* ── 파티 상태 & 로그 창 (남은 공간 분할) ── */}
      <div className="px-3 pt-2 flex-1 min-h-0 flex flex-col gap-2">
        {/* 로그 창 (상단) */}
        <div className="min-h-0 relative flex flex-col" style={{ flex: '1 1 calc(50% - 20px)', maxHeight: 'calc(50% - 20px)' }}>
           <LogPanel logs={state.dungeonLogs || []} maxHeight={9999} emptyMessage="기록된 던전 탐험 로그가 없습니다." />
        </div>

        {/* 파티 요약 창 (하단) */}
        <div className="min-h-0 panel p-2.5 flex flex-col bg-[#0b0d13ee] border border-[#1f2738] rounded-xl" style={{ flex: '1 1 calc(50% + 20px)' }}>
          <div className="flex items-center justify-between text-xs text-[#00d2ff] font-bold mb-1.5 border-b border-[#00d2ff22] pb-1">
            <div className="flex items-center gap-1.5">
              <span>🛡️ 원정대 현황</span>
              <span className="text-[10px] text-[#8b9bb4] font-normal">({gm.party.length}/3명)</span>
            </div>
            <div className="flex items-center gap-2">
              {/* 🎒 배낭 빠른 열기 버튼 */}
              <button
                className="text-[10px] px-2 py-0.5 rounded bg-[#162235] border border-[#263750] text-[#00d2ff] hover:bg-[#20304a] flex items-center gap-1 transition-all"
                onClick={() => {
                  if (pendingLoot.length > 0) setShowPendingModal(true);
                  else setIsBackpackOpen(v => !v);
                }}
                title="던전 배낭 열기"
              >
                <span>🎒</span>
                <span>배낭 ({state.dungeonInventory.length}/{gm.backpackCapacity || 16})</span>
                {pendingLoot.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff416c] animate-pulse" />
                )}
              </button>
              {gm.activeCatalysts.length > 0 && (
                <div className="flex items-center gap-1">
                  {gm.activeCatalysts.map(c => {
                    const cMap: Record<string, { label: string; icon: string }> = {
                      compass: { label: '차원의 나침반', icon: '🧭' },
                      blood_contract: { label: '피의 서약서', icon: '📜' },
                      dimensional_whistle: { label: '차원의 호각', icon: '📯' },
                      golden_toad: { label: '황금 두꺼비', icon: '🐸' },
                    };
                    const meta = cMap[c] || { label: c, icon: '🔮' };
                    return (
                      <span 
                        key={c}
                        className="text-[10px] text-[#ce93d8] bg-[#ce93d820] border border-[#ce93d840] px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer hover:bg-[#ce93d835] transition-colors"
                        title={`심연 촉매: ${meta.label}`}
                        onClick={() => setIsBackpackOpen(true)}
                      >
                        <span>{meta.icon}</span>
                        <span className="hidden sm:inline font-bold">{meta.label}</span>
                      </span>
                    );
                  })}
                </div>
              )}
              {gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5 && (
                <span className="text-[10px] text-[#ffd54f] font-mono flex items-center gap-0.5">
                  🔥 온기 버프
                </span>
              )}
              {/* 🌟 원정대 가호/버프 뱃지 리스트 */}
              {gm.expeditionBuffs && gm.expeditionBuffs.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {gm.expeditionBuffs.map(eb => (
                    <span
                      key={eb.id}
                      className="text-[10px] text-[#ff7043] bg-[#ff704318] border border-[#ff704344] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold"
                      title={`${eb.name}: ${eb.description || ''}`}
                    >
                      <span>{eb.icon || '✨'}</span>
                      <span className="hidden sm:inline">{eb.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col gap-1.5">
            {gm.party.map(hero => {
              const cls = Object.values(CHARACTER_CLASSES).find(c => c.id === hero.classId);
              const classIcon = cls?.skills[0]?.icon ?? '⚔️';
              const eff = gm.getHeroEffectiveStats(hero);
              const hpPct = Math.max(0, Math.min(100, (hero.currentHp / eff.maxHp) * 100));
              const mpPct = Math.max(0, Math.min(100, (hero.currentMp / eff.maxMp) * 100));
              const posMeta = {
                front: { label: '전열', color: '#ef5350' },
                mid:   { label: '중열', color: '#ffd54f' },
                back:  { label: '후열', color: '#42a5f5' },
              }[hero.position || 'mid'];

              // 🛡️ 체력이 0보다 큰(생존) 대원은 절대 완전 전사/사망자로 취급되지 않도록 엄격한 정합성 보장
              const isPermanentlyDead = hero.currentHp <= 0 && (!!hero.isPermanentlyDead || (hero.deathCountdown !== undefined && hero.deathCountdown <= 0));
              const isDead = hero.currentHp <= 0;
              const heroPortrait = CustomAssetService.getInstance().getMercenaryOverride(hero.classId)
                || (cls?.promptKey ? CustomAssetService.getInstance().getMercenaryOverride(cls.promptKey) : undefined)
                || (hero.portraitPromptKey ? CustomAssetService.getInstance().getMercenaryOverride(hero.portraitPromptKey) : undefined)
                || CustomAssetService.getInstance().getMercenaryOverride(hero.id)
                || CustomAssetService.getInstance().getMercenaryOverride(hero.name);

              return (
                <div
                  key={hero.id}
                  className={`p-1.5 rounded-lg flex flex-col gap-1 cursor-pointer transition-all ${
                    isPermanentlyDead
                      ? 'bg-[#14151c] border border-[#4a3838] grayscale opacity-75 hover:border-[#ef5350]'
                      : 'bg-[#121722] border border-[#1e2738] hover:border-[#00d2ff66]'
                  }`}
                  onClick={() => setInspectedHero(hero)}
                  title={isPermanentlyDead ? '💀 완전 전사한 대원 (용병 관리에서 긴급 이송 필요)' : '탭하여 영웅 상세 스탯 및 장비 확인'}
                >
                  {/* 상단: 영웅 얼굴(초상화), 이름, 클래스 텍스트, 레벨, 포지션, HP/MP 수치 */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#00d2ff55] bg-[#1a2333] flex items-center justify-center relative shadow-xs">
                        {heroPortrait ? (
                          <img
                            src={heroPortrait}
                            alt={hero.name}
                            className={`w-full h-full object-cover ${isDead ? 'grayscale' : ''}`}
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-xs">{classIcon}</span>
                        )}
                        {isDead && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px]">
                            💀
                          </div>
                        )}
                      </div>
                      <span className={`font-bold truncate ${isDead ? 'line-through text-[#8b9bb4]' : 'text-white'}`}>
                        {hero.name}
                      </span>
                      <span className="text-[10px] text-[#00d2ff] font-medium shrink-0">
                        {cls?.name || hero.classId}
                      </span>
                      <span className="text-[10px] text-[#ffd54f] font-mono font-bold shrink-0">
                        Lv.{hero.level}
                      </span>
                      <span
                        className="text-[9px] px-1 py-0.2 rounded font-bold shrink-0"
                        style={{ color: posMeta.color, background: `${posMeta.color}18`, border: `1px solid ${posMeta.color}44` }}
                      >
                        [{posMeta.label}]
                      </span>
                      {isPermanentlyDead ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ef535033] text-[#ef5350] font-bold shrink-0 border border-[#ef535066] animate-pulse">
                          💀 전사 (긴급 이송 필요)
                        </span>
                      ) : isDead ? (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#ef535022] text-[#ef5350] font-bold shrink-0 border border-[#ef535044]">
                          💀 부상
                        </span>
                      ) : null}
                    </div>

                    <div className="text-[10px] font-mono shrink-0 ml-1 flex items-center gap-1">
                      <span className={hero.currentHp / eff.maxHp < 0.3 ? 'text-[#ef5350] font-bold' : 'text-[#38ef7d]'}>
                        {Math.round(hero.currentHp)}
                      </span>
                      <span className="text-[#607d8b]">/{Math.round(eff.maxHp)}</span>
                      <span className="text-[#607d8b] mx-0.5">|</span>
                      <span className="text-[#64b5f6]">{Math.round(hero.currentMp)}</span>
                      <span className="text-[#607d8b]">/{Math.round(eff.maxMp)}</span>
                      <span className="text-[#8b9bb4] hover:text-[#00d2ff] ml-0.5 text-[9px]">ℹ️</span>
                    </div>
                  </div>

                  {/* 중단: HP & MP 게이지 바 */}
                  <div className="flex gap-1">
                    <div className="bar-track flex-1" style={{ height: 4 }}>
                      <div className="bar-fill-hp h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                    </div>
                    <div className="bar-track flex-1" style={{ height: 4 }}>
                      <div className="bar-fill-mp h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                    </div>
                  </div>

                  {/* 하단: 버프 & 디버프 상태이상 뱃지 목록 */}
                  {hero.statusEffects && hero.statusEffects.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {hero.statusEffects.map((se, i) => {
                        const meta = STATUS_EFFECT_META[se.type] || { icon: '✨', label: se.type, color: '#00d2ff' };
                        return (
                          <span
                            key={i}
                            className="text-[9px] px-1 py-0.2 rounded font-bold flex items-center gap-0.5 border"
                            style={{
                              background: `${meta.color}22`,
                              color: meta.color,
                              borderColor: `${meta.color}44`
                            }}
                            title={`${meta.label}: 남은 지속 ${se.turnsLeft}턴`}
                          >
                            <GameIcon name={se.type} icon={meta.icon} size={11} />
                            <span>{meta.label}</span>
                            <span className="font-mono text-[9px] opacity-80">{se.turnsLeft}T</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 🚚 긴급 이송 대기 카드 */}
            {gm.inTransitHero && (
              <div className="p-2 rounded-lg bg-[#1e1528] border border-[#ff704366] flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">🌀</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#ff7043] truncate">
                      차원 이송 중: [{gm.inTransitHero.heroName}]
                    </div>
                    <div className="text-[9px] text-[#8b9bb4]">
                      방주에서 현장으로 소환 중
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#ffd54f] bg-[#ffd54f22] px-1.5 py-0.5 rounded border border-[#ffd54f44] shrink-0">
                  {gm.inTransitHero.turnsLeft}턴 후 합류
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 🎒 던전 배낭 슬라이드 패널 (토글형) ── */}
      <div 
        className={`absolute bottom-[116px] left-0 right-0 z-30 bg-[#0c1017f5] backdrop-blur-md border-t border-[#1f2738] p-3 transition-all duration-300 transform shadow-2xl ${
          isBackpackOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{
          maxHeight: '40%',
          overflowY: 'auto'
        }}
      >
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-[#2c384d]">
           <div className="text-sm font-bold text-[#00d2ff]">
             🎒 {lang === 'en' ? 'Dungeon Backpack' : lang === 'ja' ? 'ダンジョンリュック' : '던전 배낭'} <span className="text-xs font-mono font-normal text-[#8b9bb4]">({state.dungeonInventory.length}/{gm.backpackCapacity || 16}{lang === 'en' ? ' slots' : lang === 'ja' ? '枠' : '칸'})</span>
           </div>
           <button className="text-xs text-[#8b9bb4]" onClick={() => setIsBackpackOpen(false)}>{lang === 'en' ? 'Close ✕' : lang === 'ja' ? '閉じる ✕' : '닫기 ✕'}</button>
        </div>
        {gm.activeCatalysts.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-[#ce93d8] bg-[#ce93d815] p-1.5 rounded border border-[#ce93d833] flex-wrap">
            <span className="font-bold">{lang === 'en' ? '🔮 Active Catalysts:' : lang === 'ja' ? '🔮 活性触媒:' : '🔮 활성 심연 촉매:'}</span>
            {gm.activeCatalysts.map(c => {
              const rMeta = GameManager.getResourceMeta(c);
              return (
                <span key={c} className="bg-[#ce93d828] border border-[#ce93d855] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                  <span>{rMeta?.icon || '🔮'}</span>
                  <span>{rMeta?.name || c}</span>
                </span>
              );
            })}
          </div>
        )}
        {state.dungeonInventory.length > 0 ? (
          <div className="grid grid-cols-2 gap-1.5">
            {state.dungeonInventory.map((slot, i) => {
              const isFull = slot.qty >= slot.maxStack;
              const typeColor = slot.itemType === 'supply' ? '#66bb6a' : slot.itemType === 'equipment' ? '#ffd54f' : slot.itemType === 'skillBook' ? '#ce93d8' : '#00d2ff';
              const rMeta = GameManager.getResourceMeta(slot.key);
              const isEngOnly = slot.label && /^[a-zA-Z0-9_\-\s]+$/.test(slot.label);
              const displayLabel = lang !== 'ko' ? (rMeta?.name || slot.label || slot.key) : ((!isEngOnly && slot.label) || rMeta?.name || slot.label || slot.key);
              const displayIcon = rMeta?.icon || slot.icon;
              const typeLabel = slot.itemType === 'supply'
                ? (lang === 'en' ? 'Supply' : lang === 'ja' ? '消耗品' : '소모품')
                : slot.itemType === 'equipment'
                ? (lang === 'en' ? 'Gear' : lang === 'ja' ? '装備' : '장비')
                : slot.itemType === 'skillBook'
                ? (lang === 'en' ? 'Tome' : lang === 'ja' ? '秘伝書' : '비전서')
                : (lang === 'en' ? 'Resource' : lang === 'ja' ? '資源' : '자원');
              return (
                <div key={slot.slotId || i} className="panel-accent p-2 flex items-center justify-between border border-[#222d42] bg-[#141a29] rounded-lg">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="p-1 rounded-md bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center shadow-sm">
                      <GameIcon name={slot.key} icon={displayIcon} size={20} className="shrink-0" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{displayLabel}</div>
                      <div className="text-[9px] text-[#8b9bb4]">{typeLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <div className="text-right font-mono text-xs">
                      <span className="font-bold" style={{ color: typeColor }}>{slot.qty}</span>
                      <span className="text-[10px] text-[#8b9bb4]">/{slot.maxStack}</span>
                      {isFull && <div className="text-[9px] text-[#ffd54f] font-bold">MAX</div>}
                    </div>

                    <button
                      className="px-1.5 py-0.5 rounded bg-[#ef535018] text-[#ef5350] hover:bg-[#ef535033] border border-[#ef535033] text-[10px] transition-colors font-bold"
                      title={lang === 'en' ? 'Discard item' : lang === 'ja' ? 'アイテムを捨てる' : '아이템 버리기 (배낭 공간 확보)'}
                      onClick={() => setDiscardTarget({ index: i, slot })}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-xs text-[#8b9bb4] py-4">{lang === 'en' ? 'Backpack is empty.' : lang === 'ja' ? 'リュックは空です。' : '배낭이 비어있습니다.'}</div>
        )}
      </div>

      {/* ── 이벤트 카드 오버레이 ── */}
      {eventCard && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 animate-fade-in">
          <div className="panel-accent p-6 max-w-[340px] w-full mx-4 text-center animate-scale-up shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-[#141d2e] border border-[#223554] shadow-lg flex items-center justify-center">
                <GameIcon name={eventCard.iconKey || eventCard.icon} icon={eventCard.icon} size={44} className="drop-shadow-md" />
              </div>
            </div>
            <div className="font-bold text-xl text-[#00d2ff] mb-2">{tr(eventCard.title)}</div>
            <div className="text-sm text-[#cfd8e8] mb-6 leading-relaxed whitespace-pre-line">{tr(eventCard.desc)}</div>
            {eventCard.options ? (
              <div className="flex flex-col gap-2 w-full">
                {eventCard.options.map((opt, i) => (
                  <ActionButton key={i} label={tr(opt.label)} variant={opt.variant} disabled={opt.disabled} className="w-full text-xs py-2.5" onClick={opt.action} />
                ))}
              </div>
            ) : (
              <ActionButton label={tr("확인 (2초 후 자동 닫힘)")} size="md" className="w-full" onClick={() => setEventCard(null)} />
            )}
          </div>
        </div>
      )}

      {/* ── 👑 BOSS WARNING!! 오버레이 ── */}
      {bossWarning && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 pointer-events-auto animate-fade-in overflow-hidden">
          {/* 붉은색 방사형 비네트 & 스캔라인 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ff174455_0%,_transparent_75%)] animate-pulse" />
          <div className="relative z-10 flex flex-col items-center text-center px-4 animate-scale-up">
            <div className="text-sm font-mono tracking-[0.3em] text-[#ffd54f] font-black animate-bounce mb-1">
              ⚠️ WARNING ⚠️
            </div>
            <div 
              className="text-5xl md:text-6xl font-black font-cinzel text-[#ff1744] tracking-widest animate-pulse"
              style={{ textShadow: '0 0 25px #ff1744, 0 0 50px #b71c1c' }}
            >
              BOSS!!
            </div>
            <div className="mt-3 text-lg font-bold text-white tracking-wider border-y border-[#ff174488] py-1 px-6 bg-[#ff174422]">
              {tr(bossWarning)}
            </div>
            <div className="text-xs text-[#cfd8dc] mt-2 font-mono">
              {tr("심연의 수호 군주가 출현했습니다!")}
            </div>
          </div>
        </div>
      )}

      {/* ── 🗑️ 배낭 아이템 버리기 확인 모달 ── */}
      {discardTarget && (
        <Modal
          title={`🗑️ ${tr('배낭 아이템 버리기')}`}
          open={!!discardTarget}
          onClose={() => setDiscardTarget(null)}
          footer={
            <div className="flex gap-2 w-full justify-end">
              <ActionButton label={tr("취소")} variant="ghost" onClick={() => setDiscardTarget(null)} />
              {discardTarget.slot.qty > 1 && (
                <ActionButton
                  label={tr("1개만 버리기")}
                  variant="danger"
                  onClick={() => {
                    gm.discardDungeonSlot(discardTarget.index, 1);
                    setDiscardTarget(null);
                  }}
                />
              )}
              <ActionButton
                label={discardTarget.slot.qty > 1 ? `${tr('모두 버리기')} (${discardTarget.slot.qty}${tr('개')})` : tr('버리기')}
                variant="danger"
                onClick={() => {
                  gm.discardDungeonSlot(discardTarget.index);
                  setDiscardTarget(null);
                }}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-center items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#141a29] border border-[#222d42] flex items-center justify-center shadow-lg">
              <GameIcon
                name={discardTarget.slot.key}
                icon={GameManager.getResourceMeta(discardTarget.slot.key)?.icon || discardTarget.slot.icon}
                size={36}
              />
            </div>
            <div className="text-sm font-bold text-white">
              [{tr((!discardTarget.slot.label || /^[a-zA-Z0-9_\-\s]+$/.test(discardTarget.slot.label))
                ? (GameManager.getResourceMeta(discardTarget.slot.key)?.name || discardTarget.slot.label || discardTarget.slot.key)
                : discardTarget.slot.label)}] ×{discardTarget.slot.qty}{tr('개')}
            </div>
            <div className="text-xs text-[#cfd8e8] leading-relaxed bg-[#1e141a] p-3 rounded-lg border border-[#ef535033]">
              {tr('이 아이템을 배낭에서 버려 공간을 확보하시겠습니까?')}<br />
              <span className="text-[#ef5350] font-bold">⚠️ {tr('버린 아이템은 다시 회수할 수 없습니다.')}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 🏕️ 심연 던전 야영 모닥불 담소 모달 ── */}
      <Modal
        title={`🏕️ ${tr('심연 던전 야영 — 모닥불 담소 (Campfire Banter)')}`}
        open={!!banterResult}
        onClose={() => {
          setBanterResult(null);
          if (tutorialStepId === 'TUTORIAL_EXPLORE_CAMP') {
            handleAdvanceTutorial('TUTORIAL_EXPLORE_TORCH');
          }
        }}
        footer={
          <ActionButton
            label={tr("야영을 마치고 탐험 계속하기")}
            variant="primary"
            className="w-full"
            onClick={() => {
              setBanterResult(null);
              if (tutorialStepId === 'TUTORIAL_EXPLORE_CAMP') {
                handleAdvanceTutorial('TUTORIAL_EXPLORE_TORCH');
              }
            }}
          />
        }
      >
        <div className="flex flex-col gap-3 py-1">
          {/* 야영 회복 상태 배너 */}
          <div className="p-2.5 rounded-xl bg-[#091522] border border-[#00d2ff44] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <span className="text-xs font-bold text-[#00d2ff]">{tr('모닥불 휴식 완료')}</span>
                <span className="text-[10px] text-[#8b9bb4] block">{tr('전 파티원 HP 및 MP +35% 회복')}</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#38ef7d] bg-[#38ef7d15] px-2 py-0.5 rounded border border-[#38ef7d33]">
              🍖 {tr('식량')} -1
            </span>
          </div>

          {/* 대원들 간의 담소 대화창 */}
          <div className="panel p-2.5 flex flex-col gap-2 max-h-[220px] overflow-y-auto bg-[#070a12] border border-[#1a2338]">
            {banterResult?.dialogues.map((d, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-[#0d1424] border border-[#1e293b] flex items-start gap-2.5 animate-fade-in"
              >
                <span className="text-xl shrink-0">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-[#00d2ff]">{tr(d.speakerName)}</div>
                  <div className="text-xs text-[#cfd8e8] mt-0.5 leading-relaxed">{tr(d.text)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 유대도 변동 내역 (수치 은닉 & 캐릭터 간 아이콘 표시) */}
          {banterResult && banterResult.bondChanges.length > 0 && (
            <div className="p-2.5 rounded-xl bg-[#ff416c15] border border-[#ff416c44] flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-xs font-bold text-[#ff416c]">
                <span>💞</span>
                <span>{tr('대원 간 교감 & 결속 변화')}</span>
              </div>
              <div className="flex flex-col gap-1 mt-0.5">
                {banterResult.bondChanges.map((b, i) => {
                  const hA = state.barracks.find(h => h.id === b.heroAId)?.name || '대원A';
                  const hB = state.barracks.find(h => h.id === b.heroBId)?.name || '대원B';
                  const isPositive = b.delta > 0;
                  return (
                    <div key={i} className="text-[11px] flex items-center justify-between px-2 py-1 bg-[#0f1422] rounded-lg border border-[#1f2b40]">
                      <span className="flex items-center gap-1.5 text-white font-bold">
                        <span>{tr(hA)}</span>
                        <span className="text-xs">{isPositive ? '💖' : '💔'}</span>
                        <span>{tr(hB)}</span>
                      </span>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${isPositive ? 'text-[#38ef7d]' : 'text-[#ef5350]'}`}>
                        <span>{isPositive ? `✨ ${tr('유대 깊어짐')}` : `🌧️ ${tr('마음의 거리감')}`}</span>
                        <span className="text-[9px] text-[#8b9bb4]">({tr(b.reason)})</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── 🏃 균열의 닻 없는 비상 탈출 경고 및 확인 모달 ── */}
      {showEmergencyEscapeModal && (
        <Modal
          title={`⚠️ ${tr('비상 탈출 시도 (균열의 닻 부재)')}`}
          open={showEmergencyEscapeModal}
          onClose={() => setShowEmergencyEscapeModal(false)}
          footer={
            <div className="flex gap-2 w-full">
              <ActionButton
                label={tr("취소")}
                variant="ghost"
                className="flex-1"
                onClick={() => setShowEmergencyEscapeModal(false)}
              />
              <ActionButton
                label={tr("비상 탈출 감행")}
                variant="danger"
                className="flex-1 font-bold"
                onClick={executeEmergencyEscape}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2 text-center text-xs">
            <div className="text-4xl animate-bounce">🏃💨</div>
            <div className="text-sm font-bold text-[#ff7043]">
              {tr('현재 보급품 [균열의 닻]이 소진된 상태입니다!')}
            </div>
            <div className="bg-[#241315] border border-[#ff416c44] p-3 rounded-xl flex flex-col gap-2 text-left leading-relaxed text-[#cfd8e8]">
              <div className="text-[#ff5252] font-bold flex items-center gap-1">
                <span>⚠️</span> <span>{tr('비상 탈출 위험 수칙:')}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[#ffcdd2]">
                <li><strong className="text-[#38ef7d]">{tr('성공 확률 30%')}</strong>: {tr('포위망을 뚫고 성채로 탈출합니다.')}</li>
                <li><strong className="text-[#ffb74d]">{tr('전리품 80% 유실')}</strong>: {tr('성공하더라도 긴급 도주 중 배낭 자원의 80%를 잃어버립니다. (20%만 보존)')}</li>
                <li><strong className="text-[#ff5252]">{tr('실패 시 70% 마물 기습')}</strong>: {tr('퇴로가 차단되어 기습 피해를 입고 즉시 전투에 돌입합니다.')}</li>
                <li>{tr('시도 후')} <strong className="text-[#ffd54f]">{tr('1턴의 재탈출 준비 쿨다운')}</strong>{tr('이 소요됩니다.')}</li>
              </ul>
            </div>
            <div className="text-[11px] text-[#8b9bb4]">
              {tr('정말로 모든 위험을 감수하고 비상 탈출을 감행하시겠습니까?')}
            </div>
          </div>
        </Modal>
      )}

      {/* ── 하단 액션 네비게이션 영역 ── */}
      <div className="px-3 pb-3 pt-2 shrink-0 z-30 bg-[#0b0d13]">
        <div className="grid grid-cols-4 gap-2 h-24">
          {/* 왼쪽 날개: 야영 / 귀환 */}
          <div className="col-span-1 flex flex-col gap-2">
            {(() => {
              const enhancedFoodCount = gm.getDungeonItemCount('enhanced_food');
              const normalFoodCount = gm.getDungeonItemCount('food');
              return (
                <button 
                   data-tutorial-target="btn-camp"
                   className={`btn h-full flex-1 flex flex-col items-center justify-center text-xs border transition-all rounded-xl ${
                     campCooldown > 0
                       ? 'border-[#2c384d] text-[#607d8b] bg-[#0d1017] opacity-60'
                       : (enhancedFoodCount > 0 
                           ? 'border-[#00d2ff88] text-[#00d2ff] bg-[#0c1f2e] hover:bg-[#132d42]' 
                           : 'border-[#38ef7d66] text-[#38ef7d] bg-[#131f18] hover:bg-[#1a2d22]')
                   }`}
                   onClick={doCamp}
                   title={campCooldown > 0 ? `던전 탐색 ${campCooldown}회 후 야영 가능` : (enhancedFoodCount > 0 ? `던전 도시락으로 야영 (HP/MP 45% 회복, 기습 -50%)` : '야영하여 체력/마나 회복 (식량 1개 소모)')}
                >
                   <span className="mb-0.5 flex items-center justify-center">
                     <GameIcon name={enhancedFoodCount > 0 ? 'enhanced_food' : 'food'} icon={enhancedFoodCount > 0 ? '🍱✨' : '🏕️'} size={20} />
                   </span>
                   <span className="font-bold">
                     {campCooldown > 0 
                       ? `야영 (${campCooldown})` 
                       : (enhancedFoodCount > 0 ? `도시락 (${enhancedFoodCount})` : `야영 (${normalFoodCount})`)}
                   </span>
                </button>
              );
            })()}
            {(() => {
              const hasEnhancedAnchor = gm.getDungeonItemCount('enhanced_rift_anchor') > 0;
              const hasNormalAnchor = gm.getDungeonItemCount('rift_anchor') > 0;
              const hasAnchor = hasEnhancedAnchor || hasNormalAnchor || gm.portalAppeared;
              return (
                <button 
                   data-tutorial-target="btn-return"
                   className={`btn btn-danger h-full flex-1 flex flex-col items-center justify-center text-xs rounded-xl ${
                     !hasAnchor
                       ? (escapeCooldown > 0 ? 'opacity-40 border-[#ff416c33]' : 'border-[#ff704388] text-[#ff7043] animate-pulse')
                       : (hasEnhancedAnchor ? 'border-[#ffd54f88] text-[#ffd54f] bg-[#2a1e05]' : '')
                   }`}
                   onClick={() => {
                     if (tutorialStepId === 'TUTORIAL_EXPLORE_RETURN') {
                       if (gm.getDungeonItemCount('rift_anchor') === 0 && gm.getDungeonItemCount('enhanced_rift_anchor') === 0) {
                         gm.addToDungeonInventory('rift_anchor', '균열의 닻', '⚓', 1, undefined, undefined, 'supply');
                       }
                       gm.consumeDungeonItem('rift_anchor', 1);
                       gm.addLog('⚓ [균열의 닻 사용] 차원의 닻을 작동하여 성채로 안전하게 귀환합니다!', 'reward');
                       returnToCitadel('rift_anchor');
                       return;
                     }
                     if (gm.portalAppeared) {
                       returnToCitadel('portal');
                     } else if (hasEnhancedAnchor) {
                       if (gm.consumeDungeonItem('enhanced_rift_anchor', 1)) {
                         gm.addLog('⚓✨ [심연의 닻 사용] 심연의 닻을 작동하여 배낭 자원 분실 없이 완벽하게 성채로 안전 귀환합니다!', 'reward');
                         returnToCitadel('enhanced_rift_anchor');
                       }
                     } else if (hasNormalAnchor) {
                       if (gm.consumeDungeonItem('rift_anchor', 1)) {
                         gm.addLog('⚓ [균열의 닻 사용] 차원의 닻을 작동하여 성채로 귀환합니다! (일부 자원 분실 주의)', 'reward');
                         returnToCitadel('rift_anchor');
                       }
                     } else {
                       if (escapeCooldown > 0) {
                         gm.addLog(`⚠️ [비상 탈출 대기] 탈출로를 재탐색 중입니다. (탐색 ${escapeCooldown}회 후 시도 가능)`, 'danger');
                         return;
                       }
                       setShowEmergencyEscapeModal(true);
                     }
                   }}
                   title={
                     hasEnhancedAnchor
                       ? '심연의 닻을 사용하여 분실 없이 100% 안전하게 성채로 귀환'
                       : (hasNormalAnchor
                         ? '차원의 닻을 사용하여 성채로 귀환 (일부 물품 분실 확률 있음)'
                         : (escapeCooldown > 0 ? `비상 탈출 재시도 대기 (탐색 ${escapeCooldown}회 후)` : '⚠️ 닻 없이 위험을 무릅쓰고 비상 탈출 시도 (성공률 30%)'))
                   }
                >
                   <span className="mb-0.5 flex items-center justify-center">
                     <GameIcon name={hasEnhancedAnchor ? 'enhanced_rift_anchor' : (hasNormalAnchor ? 'rift_anchor' : 'escape')} icon={hasEnhancedAnchor ? '⚓✨' : '🏰'} size={20} />
                   </span>
                   <span className="font-bold">
                     {hasEnhancedAnchor
                       ? `심연닻 (${gm.getDungeonItemCount('enhanced_rift_anchor')})`
                       : (hasNormalAnchor || gm.portalAppeared 
                         ? `귀환 (${hasNormalAnchor ? gm.getDungeonItemCount('rift_anchor') : '포탈'})` 
                         : (escapeCooldown > 0 ? `탈출(${escapeCooldown})` : '비상탈출'))}
                   </span>
                </button>
              );
            })()}
          </div>

          {/* 중앙 몸통: 탐색 */}
          <div className="col-span-2 flex">
            <button 
               data-tutorial-target="btn-explore"
               className="btn w-full h-full text-base sm:text-lg font-bold transition-all flex flex-col items-center justify-center gap-1 rounded-xl shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
               disabled={isAnimating || !!eventCard}
               onClick={doExplore}
               style={{
                 background: 'linear-gradient(180deg, #1d273a 0%, #101624 100%)',
                 border: '1px solid #364966',
                 color: '#e2ecf8',
                 boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
               }}
            >
               <span className="text-xl sm:text-2xl">🧭</span>
               <span className="font-extrabold tracking-wide">{isAnimating ? '탐색 중...' : '탐색'}</span>
            </button>
          </div>

          {/* 오른쪽 날개: 횃불 / 배낭 */}
          <div className="col-span-1 flex flex-col gap-2">
            {(() => {
              const enhancedTorchCount = gm.getDungeonItemCount('enhanced_torch');
              const normalTorchCount = gm.getDungeonItemCount('torch');
              return (
                <button 
                   data-tutorial-target="btn-torch"
                   className={`btn h-full flex-1 flex flex-col items-center justify-center text-xs border rounded-xl ${
                     torchTurns > 0 
                       ? (isEtherTorch ? 'border-[#00d2ff] text-[#00d2ff] bg-[#00d2ff22] animate-pulse' : 'border-[#ff7043] text-[#ff7043] bg-[#ff704322]')
                       : (enhancedTorchCount > 0 ? 'border-[#00d2ff88] text-[#00d2ff] bg-[#0c1f2e]' : 'border-[#2c384d] text-[#cfd8e8] bg-[#131722]')
                   }`}
                   onClick={toggleTorch}
                   title={
                     torchTurns > 0 
                       ? `${isEtherTorch ? '에테르 횃불' : '횃불'} 조명 중 (${torchTurns}회 남음)` 
                       : (enhancedTorchCount > 0 
                         ? `에테르 횃불 점등 (보유: ${enhancedTorchCount}개)` 
                         : `횃불 점등 (보유: ${normalTorchCount}개)`)
                   }
                >
                   <span className="mb-0.5 flex items-center justify-center">
                     <GameIcon name={isEtherTorch || (torchTurns === 0 && enhancedTorchCount > 0) ? 'enhanced_torch' : 'torch'} icon={isEtherTorch || (torchTurns === 0 && enhancedTorchCount > 0) ? '✨🔥' : '🔥'} size={20} />
                   </span>
                   <span className="font-bold">
                     {torchTurns > 0 
                       ? (isEtherTorch ? `에테르(${torchTurns})` : `횃불(${torchTurns})`) 
                       : (enhancedTorchCount > 0 ? `에테르(${enhancedTorchCount})` : `횃불(${normalTorchCount})`)}
                   </span>
                </button>
              );
            })()}
            <button 
               className={`btn h-full flex-1 flex flex-col items-center justify-center text-xs relative border rounded-xl transition-all ${
                 (gm.mercenaryManageCharges ?? 1) > 0 
                   ? 'border-[#38ef7d66] text-[#38ef7d] bg-[#111e18] hover:bg-[#182d22]' 
                   : 'border-[#2c384d] text-[#8b9bb4] bg-[#131722]'
               }`}
               onClick={() => {
                 if ((gm.mercenaryManageCharges ?? 1) <= 0) {
                   gm.addLog('⛺ [용병 관리 불가] 현재 사용 횟수가 소진되었습니다. 야영(Camp)을 진행하면 재충전됩니다! (최대 1회)', 'danger');
                   return;
                 }
                 gm.consumeMercenaryManageCharge();
                 setIsMercenaryManageOpen(true);
               }}
               title={(gm.mercenaryManageCharges ?? 1) > 0 ? `원정대 용병 관리 (1회 사용 가능 - 야영 시 충전)` : '용병 관리 소진 (야영 시 1회 재충전)'}
            >
               <span className="text-base mb-0.5">👥</span>
               <div className="flex items-center gap-1 font-bold">
                 <span>용병 관리</span>
                 <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                   (gm.mercenaryManageCharges ?? 1) > 0 ? 'bg-[#38ef7d33] text-[#38ef7d]' : 'bg-[#2c384d] text-[#8b9bb4]'
                 }`}>
                   {gm.mercenaryManageCharges ?? 1}/1
                 </span>
               </div>
               {gm.inTransitHero && (
                 <span className="absolute -top-1 -right-1 bg-[#ff7043] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold animate-pulse shadow-md">
                   이송중
                 </span>
               )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 🎒 전리품 선별 및 배낭 공간 확보 2분할 모달 (배낭 목록 & 미수령 템 목록) ── */}
      <LootSelectionModal
        open={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        completeButtonText="✅ 정리 완료"
        onComplete={() => setShowPendingModal(false)}
      />

      {/* ── 👥 원정대 용병 관리 모달 (포지션/시너지, 스킬 변경, 긴급 이송) ── */}
      <MercenaryManageModal
        open={isMercenaryManageOpen}
        onClose={() => setIsMercenaryManageOpen(false)}
        charges={gm.mercenaryManageCharges ?? 1}
        inTransitHero={gm.inTransitHero}
      />

      {/* 영웅 상세 정보 모달 */}
      {inspectedHero && (
        <HeroDetailModal
          hero={inspectedHero}
          gm={gm}
          onClose={() => setInspectedHero(null)}
        />
      )}

      {/* 🧭 튜토리얼 가이드 오버레이 (심연 1층 탐색 가이드) */}
      <TutorialGuideOverlay
        currentStepId={tutorialStepId}
        onAdvanceStep={(nextId) => {
          setIsExplorationGuideDismissed(true);
          handleAdvanceTutorial(nextId);
        }}
        onSkipTutorial={handleSkipTutorial}
        isOpen={!!tutorialStepId && !banterResult && (
          (tutorialStepId === 'TUTORIAL_EXPLORE_SCOUT' && !isExplorationGuideDismissed) ||
          ['TUTORIAL_EXPLORE_CAMP', 'TUTORIAL_EXPLORE_TORCH', 'TUTORIAL_EXPLORE_RETURN'].includes(tutorialStepId)
        )}
      />
    </div>
  );
};
