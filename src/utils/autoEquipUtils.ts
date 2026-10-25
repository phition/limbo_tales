import { EquipmentItem, EquipmentSlot, Mercenary } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { GameManager } from '../managers/GameManager';
import { getEquipmentTier } from '../data/equipment';

export interface ClassStatWeights {
  atk: number;
  def: number;
  hp: number;
  mp: number;
  spd: number;
  luck: number;
}

/**
 * 클래스 및 역할별 중요 스탯 가중치 반환
 */
export function getClassStatWeights(classId: string): ClassStatWeights {
  const c = CHARACTER_CLASSES[classId];
  const role = c?.role || 'tank';

  // 1. 특정 하이브리드 클래스 특화 가중치
  if (['war_priest', 'crusader_lord', 'seraphic_inquisitor'].includes(classId)) {
    // 전투 사제/성전사: 딜탱 + 신성 마나
    return { atk: 3.2, def: 3.2, hp: 0.35, mp: 1.5, spd: 1.0, luck: 0.8 };
  }
  if (['paladin', 'aegis_valkyrie', 'aegis_bastion'].includes(classId)) {
    // 성기사/발키리: 방어 최우선 + 신성 공격/마나
    return { def: 4.2, hp: 0.4, atk: 2.0, mp: 1.0, spd: 0.8, luck: 0.6 };
  }

  // 2. 역할군(role)별 기본 가중치
  switch (role) {
    case 'tank':
      // 방어력(DEF)과 체력(HP) 극대화, 그 다음 ATK/SPD
      return { def: 4.5, hp: 0.45, atk: 1.0, spd: 0.8, luck: 0.5, mp: 0.3 };

    case 'dealer_phy':
      // 물리 공격력(ATK), 속도(SPD), 행운/치명타(LUCK) 극대화
      return { atk: 3.8, spd: 2.6, luck: 2.4, hp: 0.15, def: 0.8, mp: 0.3 };

    case 'berserker':
      // 공격력(ATK) 극대화, 체력(HP), 방어력(DEF), 속도
      return { atk: 4.0, hp: 0.35, def: 1.5, spd: 1.6, luck: 1.2, mp: 0.2 };

    case 'gunner':
      // 공격력(ATK), 속도(SPD), 행운(LUCK), 약간의 MP
      return { atk: 3.6, spd: 2.8, luck: 2.6, hp: 0.15, def: 0.7, mp: 0.6 };

    case 'dealer_mag':
      // 마법 공격력(ATK), 마나(MP), 속도(SPD), 행운(LUCK)
      return { atk: 3.8, mp: 2.2, spd: 2.0, luck: 1.8, hp: 0.15, def: 0.7 };

    case 'healer':
      // 마나(MP), 치유력/마공(ATK), 체력(HP), 방어력(DEF), 속도
      return { mp: 3.0, atk: 2.4, hp: 0.35, def: 2.2, spd: 1.5, luck: 0.8 };

    default:
      return { atk: 2.0, def: 2.0, hp: 0.2, mp: 1.0, spd: 1.0, luck: 1.0 };
  }
}

/**
 * 장비의 종합 가치 점수 계산 (클래스 가중치 적용)
 */
export function evaluateEquipmentScore(item: EquipmentItem, weights: ClassStatWeights): number {
  if (!item) return 0;
  
  const stats = item.stats || {};
  let score = 0;
  score += (stats.atk || 0) * weights.atk;
  score += (stats.def || 0) * weights.def;
  score += (stats.hp || 0) * weights.hp;
  score += (stats.mp || 0) * weights.mp;
  score += (stats.spd || 0) * weights.spd;
  score += (stats.luck || 0) * weights.luck;

  // 희귀도(Rarity) 가산점
  const rarityBonus: Record<string, number> = {
    common: 0,
    rare: 15,
    unique: 35,
    epic: 55,
    legendary: 85,
  };
  score += rarityBonus[item.rarity] || 0;

  // 장비 티어(Tier) 가산점
  const tier = item.tier || getEquipmentTier(item) || 1;
  score += tier * 10;

  // 강화 레벨 가산점
  score += (item.level || 0) * 8;

  // 각성 단계 가산점
  if (item.awakeningLevel) {
    score += item.awakeningLevel * 25;
  }

  // 인챈트(접두/접미) 가산점
  if (item.prefix) score += 20;
  if (item.suffix) score += 20;

  return score;
}

/**
 * 특정 영웅에게 최적인 미장착 장비들을 슬롯별로 찾아서 일괄 장착 추천 목록 계산
 */
export function findBestUnassignedEquipment(
  hero: Mercenary,
  inventory: EquipmentItem[],
  allHeroes: Mercenary[],
  gm: GameManager
): {
  equippedCount: number;
  changedSlots: EquipmentSlot[];
  chosenItems: { slot: EquipmentSlot; item: EquipmentItem; prevItem?: EquipmentItem }[];
} {
  const weights = getClassStatWeights(hero.classId);
  const slots: EquipmentSlot[] = ['weapon', 'armor', 'accessory'];

  // 현재 누군가에게 장착되어 있는 장비 ID 집합 (현재 영웅이 장착 중인 것은 제외 - 현재 영웅의 것은 교체 비교 대상)
  const equippedByOtherIds = new Set<string>();
  allHeroes.forEach(h => {
    if (h.id === hero.id) return;
    if (h.equipment) {
      Object.values(h.equipment).forEach(eq => {
        if (eq?.id) equippedByOtherIds.add(eq.id);
      });
    }
  });

  // 보관함의 장비들 중 다른 영웅에게 착용되지 않았고, 침식/저주/미정화되지 않은 순수 미장착 장비 풀
  const availablePool = inventory.filter(item => {
    if (!item || !item.id) return false;
    // 다른 영웅 착용 여부
    if (equippedByOtherIds.has(item.id)) return false;
    if (item.equippedHeroId && item.equippedHeroId !== hero.id) return false;
    // 💀 침식/저주/미정화 장비는 착용 불가
    if (item.isCorrupted || item.isUnpurified || item.isCursed || item.name.startsWith('[침식된]')) {
      return false;
    }
    // 클래스 호환성 검사
    if (!gm.isEquipmentCompatible(hero.classId, item)) {
      return false;
    }
    return true;
  });

  const chosenItems: { slot: EquipmentSlot; item: EquipmentItem; prevItem?: EquipmentItem }[] = [];
  const changedSlots: EquipmentSlot[] = [];

  slots.forEach(slot => {
    const curEquip = hero.equipment?.[slot];
    const curScore = curEquip ? evaluateEquipmentScore(curEquip, weights) : -1;

    // 해당 슬롯에 맞는 미장착 장비 후보군 (현재 착용 중인 장비 제외)
    const slotCandidates = availablePool.filter(item => item.slot === slot && item.id !== curEquip?.id);
    if (slotCandidates.length === 0) return;

    // 점수 내림차순 정렬
    slotCandidates.sort((a, b) => {
      const scoreA = evaluateEquipmentScore(a, weights);
      const scoreB = evaluateEquipmentScore(b, weights);
      return scoreB - scoreA;
    });

    const bestCandidate = slotCandidates[0];
    const bestScore = evaluateEquipmentScore(bestCandidate, weights);

    // 미장착 후보의 점수가 현재 장착 중인 장비보다 우수할 때만 교체 (또는 현재 미장착 슬롯일 때)
    if (bestScore > curScore) {
      chosenItems.push({ slot, item: bestCandidate, prevItem: curEquip });
      changedSlots.push(slot);
    }
  });

  return {
    equippedCount: changedSlots.length,
    changedSlots,
    chosenItems,
  };
}
