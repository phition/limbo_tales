import { GameManager } from '../managers/GameManager';
import { Mercenary, EventCardOption } from '../types/game';
import { SoundManager } from '../managers/SoundManager';

export interface FloorEventContext {
  gm: GameManager;
  danger: number;
  maxDanger: number;
  floor: number;
  setDanger: (val: number) => void;
  setEventCard: (card: any) => void;
  navigateTo: (screen: any) => void;
  returnToCitadel: () => void;
}

export interface FloorEventDefinition {
  id: string;
  floor: number;
  title: string;
  desc: string;
  icon: string;
  iconKey: string;
  generateOptions: (ctx: FloorEventContext) => EventCardOption[];
}

/** 파티 내 특정 직업군 포함 여부 판별 헬퍼 */
export function findPartyHeroByClasses(party: Mercenary[], classIds: string[]): Mercenary | undefined {
  return party.find(h => classIds.includes(h.classId));
}

// ─── 직업군 그룹 매핑 ───
export const CLASS_GROUPS = {
  holy_knights: ['paladin', 'aegis_valkyrie'],
  holy_priests: ['acolyte', 'bishop', 'war_priest', 'high_saintess', 'inquisitor'],
  shadow_rogues: ['rogue', 'assassin', 'shadow_phantom', 'duelist', 'blade_dancer'],
  arcane_mages: ['apprentice', 'elementalist', 'arcane_scholar', 'calamity_mage', 'void_scholar'],
  warriors: ['squire', 'guardian', 'fortress', 'vanguard', 'berserker', 'warlord', 'abyssal_berserker', 'immortal_warlord'],
  heavy_guards: ['guardian', 'fortress'],
  berserkers: ['vanguard', 'berserker', 'abyssal_berserker', 'immortal_warlord'],
};

/** 층별 고유 이벤트 22종 (1~11층 각 2종) */
export const FLOOR_UNIQUE_EVENTS: FloorEventDefinition[] = [
  // ================================================================
  // 🏛️ [1층: 침묵의 회랑]
  // ================================================================
  {
    id: 'floor_1_a',
    floor: 1,
    title: '🛡️ 쓰러진 척후병의 유해와 경보 장치',
    desc: '이끼 낀 석벽 구석에 성채 선발대 척후병의 유골이 놓여 있습니다. 주변에는 마물을 유인하는 심연 경보 룬이 설치되어 있습니다.',
    icon: '🛡️',
    iconKey: 'event_floor_1_scout',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const rogueHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.shadow_rogues);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 경보 룬 고의 격발 (위험도 +20 상승 / 3턴간 공격력 +20% / 군번줄 수습)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'buff_atk', turnsLeft: 3, totalTurns: 3, magnitude: 0.20, source: '척후병의 유언' });
            });
            gm.addToDungeonInventory('memoir_1', '낡은 척후병의 군번줄', '📜', 1);
            gm.activateQuest('Q_SCENARIO_01');
            gm.updateQuestObjective('Q_SCENARIO_01', 0, 1);
            gm.addLog('⚡ [진척도 급가속] 경보 룬을 격발하여 마물들을 유인했습니다! (위험도 +20, 파티 3턴간 공격력 +20% 사기 진작, 낡은 군번줄 수습)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 은밀하게 유해 수습 (위험도 -15 감소 / 붕대 ×2, 골드 15G 수습)',
          variant: 'primary',
          action: () => {
            const nextD = Math.max(0, danger - 15);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('bandage', '단단한 붕대', '🩹', 2);
            gm.addToDungeonInventory('gold', '골드', '🪙', 15);
            gm.addToDungeonInventory('memoir_1', '낡은 척후병의 군번줄', '📜', 1);
            gm.activateQuest('Q_SCENARIO_01');
            gm.updateQuestObjective('Q_SCENARIO_01', 0, 1);
            gm.addLog('🛡️ [안전 파밍] 경보를 건드리지 않고 조용히 척후병의 유해를 수습했습니다. (위험도 -15 감소, 붕대 ×2, 🪙 15G 수습)', 'normal');
            setEventCard(null);
          }
        }
      ];

      if (rogueHero) {
        options.unshift({
          label: `🌟 [${rogueHero.name} 특기] 트랩 해체 및 위험도 조율 (100% 무소음 / 마력 수정 +1, 제식 단검 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            // 플레이어 선택 대신 최적의 안전 파밍(-20) 또는 마력 수정 탈취
            const nextD = Math.max(0, danger - 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('crystal', '마력 수정', '💎', 1);
            const dropWeapon = gm.generateForgeEquipmentDrop(1);
            gm.addToDungeonInventory(dropWeapon.id, dropWeapon.name, dropWeapon.icon, 1, dropWeapon, undefined, 'equipment');
            gm.addToDungeonInventory('memoir_1', '낡은 척후병의 군번줄', '📜', 1);
            gm.activateQuest('Q_SCENARIO_01');
            gm.updateQuestObjective('Q_SCENARIO_01', 0, 1);
            gm.addLog(`🌟 [암살자 특기 발동] [${rogueHero.name}]이(가) 완벽하게 경보 룬을 해체하여 마력 수정과 제식 무기를 노획했습니다! (위험도 -20 감소)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 묵념 후 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('경건히 묵념한 뒤 지나쳤습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_1_b',
    floor: 1,
    title: '🌿 석벽의 발광 핏빛 이끼 군락',
    desc: '심연 마기와 마물의 피를 머금고 붉은빛으로 박동하는 기괴한 이끼 군락입니다. 공기 중에 자극적인 마기 포자가 떠다닙니다.',
    icon: '🌿',
    iconKey: 'event_floor_1_moss',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const priestHero = findPartyHeroByClasses(gm.party, [...CLASS_GROUPS.holy_priests, ...CLASS_GROUPS.holy_knights]);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 포자 주머니를 터뜨리기 (위험도 +20 상승 / 5턴간 공속·치명타 +15% 각성)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('fire');
            const nextD = Math.min(maxDanger, danger + 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'buff_atk', turnsLeft: 5, totalTurns: 5, magnitude: 0.15, source: '핏빛 포자' });
            });
            gm.addToDungeonInventory('herb', '심연 약초', '🌿', 4);
            gm.addLog('⚡ [진척도 가속] 자극적인 마기 포자가 터져 원정대의 투기가 타오릅니다! (위험도 +20 상승, 5턴간 치명타/공격력 +15%)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 횃불로 이끼 소각 정화 (위험도 -15 감소 / 심연 약초 ×5, 에테르 +15)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('fire');
            const nextD = Math.max(0, danger - 15);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('herb', '심연 약초', '🌿', 5);
            gm.addToDungeonInventory('ether', '에테르', '✨', 15);
            gm.addLog('🛡️ [안전 파밍] 불길로 이끼를 태워 마기 방출을 차단했습니다. (위험도 -15 감소, 심연 약초 ×5, ✨에테르 +15 수습)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (priestHero) {
        options.unshift({
          label: `🌟 [${priestHero.name} 특기] 신성 정화의 찬가 (위험도 -25 대폭 감소 / 전원 HP 25% 회복 / 신성 약초 정수 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              if (h.currentHp > 0) h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.25));
            });
            gm.addToDungeonInventory('herb', '심연 약초', '🌿', 8);
            gm.addToDungeonInventory('ether', '에테르', '✨', 25);
            gm.addLog(`🌟 [신성 특기 발동] [${priestHero.name}]의 신성 찬가로 마기가 완전 정화되었습니다! (위험도 -25 대폭 감소, 전원 체력 25% 회복)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 그냥 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('발광 이끼를 건드리지 않고 지나쳤습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 💀 [2층: 망령의 납골당]
  // ================================================================
  {
    id: 'floor_2_a',
    floor: 2,
    title: '🕯️ 속삭이는 고대 납골단지 (Ossuary)',
    desc: '수백 명의 유골이 담긴 거대한 점토 항아리에서 갇힌 원혼들의 애달픈 속삭임이 귓가를 맴돕니다.',
    icon: '🕯️',
    iconKey: 'event_floor_2_ossuary',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const mageHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.arcane_mages);
      const paladinHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_knights);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 단지를 깨뜨려 원혼 해방 (위험도 +25 상승 / 🪙 80G, 💎 마력 수정 ×2, 3턴 공격력 +25%)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('gold', '골드', '🪙', 80);
            gm.addToDungeonInventory('crystal', '마력 수정', '💎', 2);
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'buff_atk', turnsLeft: 3, totalTurns: 3, magnitude: 0.25, source: '원혼의 격노' });
            });
            gm.addLog('⚡ [진척도 가속] 단지가 깨지며 분출된 원혼의 마기가 던전을 뒤흔듭니다! (위험도 +25 급상승, 🪙 80G, 마력 수정 ×2, 파티 공격력 +25%)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 성수로 영면 기원 (위험도 -20 감소 / 🦴 짐승 뼈 ×8, ✨ 에테르 +30, 방어막 획득)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('bone', '짐승 뼈', '🦴', 8);
            gm.addToDungeonInventory('ether', '에테르', '✨', 30);
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'shield', turnsLeft: 3, totalTurns: 3, magnitude: Math.floor(h.maxHp * 0.20), source: '영혼의 가호' });
            });
            gm.addLog('🛡️ [안전 파밍] 원혼들이 성불하며 납골당이 평온을 되찾았습니다. (위험도 -20 감소, 뼈 ×8, 에테르 +30, 20% 보호막)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (mageHero) {
        options.unshift({
          label: `🌟 [${mageHero.name} 특기] 사념 마력 구속 (위험도 +25 또는 -20 자유 선택 / 접두석 연성)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            // 유리한 파밍(-20)과 접두석 연성
            const nextD = Math.max(0, danger - 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('prefix_stone', '일반 접두석', '📜', 1);
            gm.addToDungeonInventory('ether', '에테르', '✨', 40);
            gm.addLog(`🌟 [대마도사 특기] [${mageHero.name}]이(가) 사념 에너지를 정제하여 접두석을 연성했습니다! (위험도 -20 감소)`, 'reward');
            setEventCard(null);
          }
        });
      } else if (paladinHero) {
        options.unshift({
          label: `🌟 [${paladinHero.name} 특기] 안식의 성역 (위험도 -30 대폭 감소 / 영혼의 잔재 오파츠 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('ooparts_2_1', '영혼의 잔재', '🕯️', 1);
            gm.addToDungeonInventory('bone', '짐승 뼈', '🦴', 10);
            gm.addLog(`🌟 [성기사 특기] [${paladinHero.name}]의 성스러운 기도로 납골당 전역에 안식이 깃들었습니다! (위험도 -30 대폭 감소, 오파츠 발굴)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 조용히 물러선다',
        variant: 'ghost',
        action: () => {
          gm.addLog('원혼들의 항아리를 건드리지 않고 지나쳤습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_2_b',
    floor: 2,
    title: '🪦 이름이 지워진 순교자의 비문',
    desc: '마기에 풍화되어 비문이 깎여나간 거대한 순교자의 묘비입니다. 주변에 기사들의 부러진 검들이 꽂혀 있습니다.',
    icon: '🪦',
    iconKey: 'event_floor_2_martyr',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const warriorHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.warriors);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 피로 룬을 적셔 결투 환영 소환 (위험도 +20 / 순교자의 제식 검 + EXP 200)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('level_up');
            const nextD = Math.min(maxDanger, danger + 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => gm.addExpToHero(h, 200));
            const rewardWeapon = gm.generateForgeEquipmentDrop(2);
            gm.addToDungeonInventory(rewardWeapon.id, rewardWeapon.name, rewardWeapon.icon, 1, rewardWeapon, undefined, 'equipment');
            gm.addLog('⚡ [진척도 가속] 순교자의 결투 환영을 극복하여 귀중한 검술 경험과 유품 검을 계승했습니다! (위험도 +20, 전원 EXP +200)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 성화 온기를 되새기며 묵념 (위험도 -15 감소 / 온기 스택 +1, MP +30 회복)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 15);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => { h.currentMp = Math.min(h.maxMp, h.currentMp + 30); });
            gm.bonfireWarmthTime = (gm.bonfireWarmthTime || 0) + 120;
            gm.addLog('🛡️ [안전 파밍] 순교자의 비문 앞에서 전열을 가다듬었습니다. (위험도 -15 감소, 전원 MP +30, 온기 충전)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (warriorHero) {
        options.unshift({
          label: `🌟 [${warriorHero.name} 특기] 기사도의 맹세 계승 (이번 원정 동안 물리 방어력 +5 가호 & 비전서 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            gm.addExpeditionBuff({
              id: 'expedition_warrior_oath',
              name: '기사도의 맹세',
              icon: '🛡️',
              category: 'ancestral',
              description: '이번 원정 동안 물리 방어력 +5',
              conditionText: '이번 원정 동안',
              buffs: { flatDefBonus: 5 }
            });
            gm.addToDungeonInventory('skillBook', '기사의 비전서', '📜', 1);
            gm.addLog(`🌟 [기사 특기] [${warriorHero.name}]이(가) 비문의 고대 검술을 계승하여 이번 원정 동안 물리 방어력 +5 가호를 얻었습니다! (기사의 비전서 획득)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 묘비를 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('순교자의 묘비를 뒤로하고 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // ⛏️ [3층: 에테르 광맥]
  // ================================================================
  {
    id: 'floor_3_a',
    floor: 3,
    title: '💎 공명하는 거대 에테르 수정 기둥',
    desc: '방 전체를 채울 정도로 거대한 순수 에테르 수정이 웅웅거리며 주변 광맥과 강력하게 공명하고 있습니다.',
    icon: '💎',
    iconKey: 'event_floor_3_crystal',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const mageHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.arcane_mages);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 수정에 충격을 가해 과부하 유도 (위험도 +30 상승 / 순수 인챈트석 획득 / HP 8% 반동)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.92)); });
            const isPrefix = Math.random() < 0.5;
            const stoneKey = isPrefix ? 'pure_prefix_stone' : 'pure_suffix_stone';
            const stoneName = isPrefix ? '순수한 접두석' : '순수한 접미석';
            gm.addToDungeonInventory(stoneKey, stoneName, '💎', 1);
            gm.updateQuestObjective('Q_SCENARIO_1_2', 0, 1);
            gm.activateQuest('Q_SCENARIO_1_3');
            gm.updateQuestObjective('Q_SCENARIO_2_1', 0, 1);
            gm.activateQuest('Q_SCENARIO_2_2');
            gm.addLog(`⚡ [진척도 급가속] 수정 과부하 폭발로 광맥 파편에서 [${stoneName}]을(를) 추출했습니다! (위험도 +30, 파티 HP 8% 반동)`, 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 외곽의 안정 광맥만 정밀 채굴 (위험도 -20 감소 / ⚙️ 철광석 ×15, 🪨 석탄 ×10, ✨ 에테르 +40)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('loot_open');
            const nextD = Math.max(0, danger - 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('iron', '철광석', '⚙️', 15);
            gm.addToDungeonInventory('coal', '석탄', '🪨', 10);
            gm.addToDungeonInventory('ether', '에테르', '✨', 40);
            gm.updateQuestObjective('Q_SCENARIO_1_2', 0, 1);
            gm.activateQuest('Q_SCENARIO_1_3');
            gm.updateQuestObjective('Q_SCENARIO_2_1', 0, 1);
            gm.activateQuest('Q_SCENARIO_2_2');
            gm.addLog('🛡️ [안전 파밍] 충격을 최소화하며 안전하게 광석을 수급했습니다. (위험도 -20 감소, 철광석 ×15, 석탄 ×10, 에테르 +40)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (mageHero) {
        options.unshift({
          label: `🌟 [${mageHero.name} 특기] 마력 수정 정제 (파티 전원 MP +100 회복 / 위험도 -25 안전화 / 💎 마력 수정 ×3)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              if (h.currentHp > 0) {
                h.currentMp = Math.min(h.maxMp, h.currentMp + 100);
              }
            });
            gm.addToDungeonInventory('crystal', '마력 수정', '💎', 3);
            gm.addToDungeonInventory('ether', '에테르', '✨', 50);
            gm.updateQuestObjective('Q_SCENARIO_1_2', 0, 1);
            gm.activateQuest('Q_SCENARIO_1_3');
            gm.updateQuestObjective('Q_SCENARIO_2_1', 0, 1);
            gm.activateQuest('Q_SCENARIO_2_2');
            gm.addLog(`🌟 [마도사 특기] [${mageHero.name}]이(가) 수정의 마력을 정제했습니다! (전원 MP +100 회복, 위험도 -25, 마력 수정 ×3)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 수정을 건드리지 않고 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('거대 수정 기둥을 뒤로하고 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_3_b',
    floor: 3,
    title: '⚠️ 무너져 내리는 폐광의 버팀목',
    desc: '갱도 천장을 받치던 통나무 지지대가 삐걱거리며 거대한 낙석이 쏟아져 내리기 직전입니다.',
    icon: '⚠️',
    iconKey: 'event_floor_3_mine',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const guardHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.heavy_guards);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 버팀목을 폭파하여 단축로 개척 (위험도 +30 / 광부 보물함 🪙 120G, ✨ 50 발굴)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('gold', '골드', '🪙', 120);
            gm.addToDungeonInventory('ether', '에테르', '✨', 50);
            gm.addToDungeonInventory('iron', '철광석', '⚙️', 10);
            gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.90)); });
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_02');
            gm.updateQuestObjective('Q_SCENARIO_02', 0, 1);
            gm.addLog('⚡ [진척도 가속] 폭파로 낙석을 뚫고 지름길을 뚫어 숨겨진 광부의 수납함을 발굴했습니다! (위험도 +30, 🪙 120G, 에테르 +50)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 갱도 지지 보강 (위험도 -25 감소 / ⚙️ 철광석 ×10, 🪨 석탄 ×8 안전 채굴)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('loot_open');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('iron', '철광석', '⚙️', 10);
            gm.addToDungeonInventory('coal', '석탄', '🪨', 8);
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_02');
            gm.updateQuestObjective('Q_SCENARIO_02', 0, 1);
            gm.addLog('🛡️ [안전 파밍] 갱도를 단단히 보강하여 안전 채굴 구역을 확보했습니다. (위험도 -25 감소, 철광석 ×10, 석탄 ×8 수급)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (guardHero) {
        options.unshift({
          label: `🌟 [${guardHero.name} 특기] 절대 방패 지지 (피해 0 / 위험도 -30 감소 / 🪨 석재 +15, ⚙️ 철광석 +10)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('shield');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('stone', '석재', '🪨', 15);
            gm.addToDungeonInventory('iron', '철광석', '⚙️', 10);
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_02');
            gm.updateQuestObjective('Q_SCENARIO_02', 0, 1);
            gm.addLog(`🌟 [가디언 특기] [${guardHero.name}]이(가) 거대한 방패로 낙석을 완벽히 막아냈습니다! (피해 0, 위험도 -30 대폭 감소)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🏃 전력 질주로 낙석 구간 통과',
        variant: 'ghost',
        action: () => {
          gm.addLog('낙석 구간을 재빨리 빠져나갔습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 🌀 [4층: 심연의 균열]
  // ================================================================
  {
    id: 'floor_4_a',
    floor: 4,
    title: '⏳ 뒤틀린 시간의 잔향 (미래의 잔영)',
    desc: '시공간의 틈새에서 피투성이가 된 아군 파티의 미래 환영이 무언가를 경고하듯 서성입니다.',
    icon: '⏳',
    iconKey: 'event_floor_4_echo',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const rogueHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.shadow_rogues);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 미래의 기억 동기화 (위험도 +25 / 다음 3회 전투 선제공격 및 치명타 100%)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('portal');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'buff_atk', turnsLeft: 6, totalTurns: 6, magnitude: 0.35, source: '미래의 결전 기억' });
            });
            gm.activateQuest('Q_SCENARIO_04');
            gm.updateQuestObjective('Q_SCENARIO_04', 0, 1);
            gm.addLog('⚡ [진척도 가속] 미래의 결전 기억을 계승하여 전열의 전투 감각이 극대화되었습니다! (위험도 +25 상승, 공격력 +35%)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 시간 왜곡 봉인 (위험도 -25 감소 / 야영 쿨다운 즉시 리셋 / HP/MP 40% 회복)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.campCooldown = 0;
            gm.party.forEach(h => {
              if (h.currentHp > 0) {
                h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.40));
                h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * 0.40));
              }
            });
            gm.activateQuest('Q_SCENARIO_04');
            gm.updateQuestObjective('Q_SCENARIO_04', 0, 1);
            gm.addLog('🛡️ [안전 파밍] 불안정한 시간 균열을 닫아 안전지대를 형성했습니다. (위험도 -25, 야영 쿨다운 리셋, HP/MP 40% 회복)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (rogueHero) {
        options.unshift({
          label: `🌟 [${rogueHero.name} 특기] 시간 틈새 도약 (미래의 전리품 탈취 / 4티어 무기 복제 / 위험도 0)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('loot_open');
            const dropWeapon = gm.generateForgeEquipmentDrop(4);
            gm.addToDungeonInventory(dropWeapon.id, dropWeapon.name, dropWeapon.icon, 1, dropWeapon, undefined, 'equipment');
            gm.addToDungeonInventory('ether', '에테르', '✨', 35);
            gm.activateQuest('Q_SCENARIO_04');
            gm.updateQuestObjective('Q_SCENARIO_04', 0, 1);
            gm.addLog(`🌟 [암살자 특기] [${rogueHero.name}]이(가) 시간 틈새에서 미래의 4티어 무구를 낚아챘습니다! (위험도 변동 없음)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 잔향을 뒤로하고 전진',
        variant: 'ghost',
        action: () => {
          gm.addLog('시간의 잔영을 스쳐 지나갔습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_4_b',
    floor: 4,
    title: '🌌 무중력 공허 포켓',
    desc: '중력 붕괴로 암석 파편과 보물 상자가 허공에 둥둥 떠다니고 있습니다. 중심부에는 공허의 흡인구가 입을 벌리고 있습니다.',
    icon: '🌌',
    iconKey: 'event_floor_4_gravity',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 중력 흡인구 자극 (위험도 +25 / 🌌 공허 파편 ×3, 💎 마력 수정 ×2, 🪙 150G)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('portal');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 3);
            gm.addToDungeonInventory('crystal', '마력 수정', '💎', 2);
            gm.addToDungeonInventory('gold', '골드', '🪙', 150);
            gm.activateQuest('Q_SCENARIO_04');
            gm.updateQuestObjective('Q_SCENARIO_04', 0, 1);
            gm.addLog('⚡ [진척도 가속] 중력 폭풍이 몰아치며 떠다니던 심연 희귀 보물들이 쏟아졌습니다! (위험도 +25, 공허 파편 ×3, 마력 수정 ×2, 🪙 150G)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 안전선 내에서 유실물만 인양 (위험도 -20 감소 / 🧶 실크 ×8, ✨ 에테르 +30)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('loot_open');
            const nextD = Math.max(0, danger - 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('silk', '실크', '🧶', 8);
            gm.addToDungeonInventory('ether', '에테르', '✨', 30);
            gm.activateQuest('Q_SCENARIO_04');
            gm.updateQuestObjective('Q_SCENARIO_04', 0, 1);
            gm.addLog('🛡️ [안전 파밍] 무리하지 않고 안전하게 공중의 자원만 건져 올렸습니다. (위험도 -20 감소, 실크 ×8, 에테르 +30)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🚶 무중력 구역을 우회한다',
          variant: 'ghost',
          action: () => {
            gm.addLog('무중력 구역을 우회하여 통과했습니다.', 'normal');
            setEventCard(null);
          }
        }
      ];

      return options;
    }
  },

  // ================================================================
  // 🩸 [5층: 원초의 제단]
  // ================================================================
  {
    id: 'floor_5_a',
    floor: 5,
    title: '🩸 진홍의 피 웅덩이와 공양대',
    desc: '붉은 달빛이 스며드는 제단 중앙의 석조 대야에 신선한 핏물이 고동치며 생명력을 갈구합니다.',
    icon: '🩸',
    iconKey: 'event_floor_5_altar',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const berserkerHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.berserkers);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 대원의 피를 바쳐 제단 각성 (HP 20% 소모 / 위험도 +30 / 이번 원정 동안 공격력 +20% & 흡혈 15% 가호)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.80));
            });
            gm.addExpeditionBuff({
              id: 'expedition_blood_altar',
              name: '피의 제단 각성',
              icon: '🩸',
              category: 'ancestral',
              description: '이번 원정 동안 공격력 +20% & 흡혈 15%',
              conditionText: '이번 원정 동안',
              buffs: { atkBonus: 1.20, drainBonus: 15 }
            });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog('⚡ [진척도 급가속] 제단이 붉게 타오르며 5층 수호 거신의 시선이 쏠립니다! (위험도 +30 급상승, 이번 원정 동안 공격력 +20% & 흡혈 15% 가호)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 성수로 피 웅덩이 중화 정화 (위험도 -30 감소 / 5층 보스 방어력 -20% 약화 서판)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('relic_floor_5', '원초의 제단 서판', '📜', 1);
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 성수로 피의 갈증을 씻어내어 거신의 분노를 가라앉혔습니다! (위험도 -30 대폭 감소, 5층 보스 약화 서판 획득)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (berserkerHero) {
        options.unshift({
          label: `🌟 [${berserkerHero.name} 특기] 피의 광기 포효 (체력 소모 0 / 위험도 +35 폭증 / 치명타 피해 +50%)`,
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.applyStatusEffectToHero(berserkerHero, { type: 'buff_atk', turnsLeft: 99, totalTurns: 99, magnitude: 0.40, source: '버서커의 광기' });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog(`🌟 [광전사 특기] [${berserkerHero.name}]이(가) 제단 앞에서 야수의 포효를 내질렀습니다! (위험도 +35 폭증, 보스 조우 임박!)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 제단을 건드리지 않는다',
        variant: 'ghost',
        action: () => {
          gm.addLog('피의 공양대를 지나쳤습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_5_b',
    floor: 5,
    title: '🗿 침묵하는 거신의 석상',
    desc: '제단 입구를 지키는 거대한 석상이 손에 부서진 대검을 쥔 채 눈을 감고 서 있습니다.',
    icon: '🗿',
    iconKey: 'event_floor_5_statue',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const paladinHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_knights);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 석상 이마의 붉은 마핵 강제 적출 (위험도 +25 / 🌌 공허 파편 ×4)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 4);
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog('⚡ [진척도 가속] 거신의 핵을 뜯어내어 던전 전체의 마기가 흉포해졌습니다! (위험도 +25 상승, 공허의 파편 ×4)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 부서진 대검을 철광석으로 수리 (위험도 -25 / 거신의 가호: 물리방어 +30%)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'buff_def', turnsLeft: 99, totalTurns: 99, magnitude: 0.30, source: '거신의 가호' });
            });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 거신의 대검을 보수하여 던전이 안정화되고 가호를 얻었습니다. (위험도 -25 감소, 물리 방어력 +30%)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (paladinHero) {
        options.unshift({
          label: `🌟 [${paladinHero.name} 특기] 영혼의 축복 안식 (위험도 -30 / 이번 원정 동안 전원 최대 HP +10% 가호)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_titan_soul_blessing',
              name: '거신의 안식 가호',
              icon: '🛡️',
              category: 'ancestral',
              description: '이번 원정 동안 최대 HP +10%',
              conditionText: '이번 원정 동안',
              buffs: { maxHpBonus: 1.10 }
            });
            gm.party.forEach(h => {
              h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.20));
            });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog(`🌟 [성기사 특기] [${paladinHero.name}]의 축복으로 거신의 영혼이 정화되었습니다! (위험도 -30, 이번 원정 동안 전원 최대 HP +10% 가호)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 석상을 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('거신의 석상을 뒤로하고 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 🍷 [6층: 핏빛 성역]
  // ================================================================
  {
    id: 'floor_6_a',
    floor: 6,
    title: '🍷 고딕 참회실의 은밀한 고해',
    desc: '핏빛 스테인드글라스 너머 오래된 고해성사실에서 정체불명의 귀족적인 목소리가 참회를 권유합니다.',
    icon: '🍷',
    iconKey: 'event_floor_6_confess',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const priestHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_priests);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 참회실 문을 박차고 도발 (위험도 +30 / 6티어 희귀 무기 드랍 / 정예 전투)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const dropWeapon = gm.generateForgeEquipmentDrop(6);
            gm.addToDungeonInventory(dropWeapon.id, dropWeapon.name, dropWeapon.icon, 1, dropWeapon, undefined, 'equipment');
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_03');
            gm.updateQuestObjective('Q_SCENARIO_03', 0, 1);
            gm.addLog('⚡ [진척도 급가속] 숨어있던 흡혈 귀족을 제압하고 6티어 보구를 강탈했습니다! (위험도 +30 급상승, 보스 출현 가속)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 경건한 참회 (위험도 -25 감소 / 모든 디버프 즉시 정화 & 25% 신성 방벽)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              h.statusEffects = [];
              gm.applyStatusEffectToHero(h, { type: 'shield', turnsLeft: 4, totalTurns: 4, magnitude: Math.floor(h.maxHp * 0.25), source: '참회의 은총' });
            });
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_03');
            gm.updateQuestObjective('Q_SCENARIO_03', 0, 1);
            gm.addLog('🛡️ [안전 파밍] 성역의 살기가 누그러지며 대원들이 가호를 얻었습니다. (위험도 -25 감소, 디버프 완치, 25% 방벽)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (priestHero) {
        options.unshift({
          label: `🌟 [${priestHero.name} 특기] 이단 축출의 성언 (위험도 -30 / 성자의 유골함 오파츠 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('ooparts_6_1', '성자의 유골함', '⚱️', 1);
            gm.addToDungeonInventory('ether', '에테르', '✨', 50);
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_03');
            gm.updateQuestObjective('Q_SCENARIO_03', 0, 1);
            gm.addLog(`🌟 [사제 특기] [${priestHero.name}]의 성언으로 흡혈귀가 자멸하며 [성자의 유골함]을 남겼습니다! (위험도 -30)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 고해실을 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('고해실을 지나쳐 예배당 안쪽으로 향합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_6_b',
    floor: 6,
    title: '🌹 가시 돋친 피의 장미 덤불',
    desc: '예배당 중앙 회랑 전체를 핏빛 가시 장미 덤불이 가로막고 있습니다. 꽃잎마다 마력이 서려 있습니다.',
    icon: '🌹',
    iconKey: 'event_floor_6_rose',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const rogueHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.shadow_rogues);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 온몸으로 가시밭을 부수며 혈로 돌파 (위험도 +25 / HP 10% 출혈 / 이번 원정 동안 공격력 +5 가호)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('hero_hurt');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.90));
            });
            gm.addExpeditionBuff({
              id: 'expedition_rose_essence',
              name: '진홍 장미 정수',
              icon: '🥀',
              category: 'ancestral',
              description: '이번 원정 동안 전원 공격력 +5',
              conditionText: '이번 원정 동안',
              buffs: { flatAtkBonus: 5 }
            });
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_03');
            gm.updateQuestObjective('Q_SCENARIO_03', 0, 1);
            gm.addLog('⚡ [진척도 가속] 가시덤불을 돌파하며 진홍 장미 정수를 흡수했습니다! (위험도 +25, 이번 원정 동안 전원 공격력 +5 가호)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 에테르 화염으로 안전 소각 (위험도 -20 / 🧶 실크 ×10, 🌿 약초 ×8 수급)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('fire');
            const nextD = Math.max(0, danger - 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('silk', '실크', '🧶', 10);
            gm.addToDungeonInventory('herb', '심연 약초', '🌿', 8);
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_03');
            gm.updateQuestObjective('Q_SCENARIO_03', 0, 1);
            gm.addLog('🛡️ [안전 파밍] 가시를 안전하게 불태워 최고급 실크와 약초를 수확했습니다. (위험도 -20 감소, 실크 ×10, 약초 ×8)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (rogueHero) {
        options.unshift({
          label: `🌟 [${rogueHero.name} 특기] 그림자 가시 걷기 (출혈 0 / 위험도 변동 없음 / 💎 진홍 루비 보석 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('loot_open');
            gm.addToDungeonInventory('pure_prefix_stone', '순수한 접두석', '💎', 1);
            gm.addToDungeonInventory('silk', '실크', '🧶', 12);
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 1, 1);
            }
            gm.activateQuest('Q_SCENARIO_03');
            gm.updateQuestObjective('Q_SCENARIO_03', 0, 1);
            gm.addLog(`🌟 [암살자 특기] [${rogueHero.name}]이(가) 가시덤불 깊숙한 곳에서 진홍 보석을 완벽히 건져냈습니다!`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 덤불을 우회한다',
        variant: 'ghost',
        action: () => {
          gm.addLog('가시덤불을 우회하여 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 👻 [7층: 망각의 묘지]
  // ================================================================
  {
    id: 'floor_7_a',
    floor: 7,
    title: '🌫️ 망각의 안개와 잃어버린 기억의 등불',
    desc: '짙은 보랏빛 안개가 대원들의 뇌리를 흐리며 가장 소중한 기억들을 지워가기 시작합니다.',
    icon: '🌫️',
    iconKey: 'event_floor_7_fog',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const mageHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.arcane_mages);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 안개 속으로 살기 방출 (위험도 +30 / 파티 치명타율 +20% / 사신의 낫 파편)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 3);
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'buff_atk', turnsLeft: 6, totalTurns: 6, magnitude: 0.30, source: '사신의 살기' });
            });
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 1, 1);
            }
            gm.addLog('⚡ [진척도 급가속] 살기를 방출하여 망각의 군주들을 불러 모았습니다! (위험도 +30 상승, 6턴간 치명타/공격력 +30%)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 성화 불씨로 안개 소산 (위험도 -30 / 온기 버프 충전 / 영혼 나침반의 바늘)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('fire');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.bonfireWarmthTime = (gm.bonfireWarmthTime || 0) + 180;
            gm.addToDungeonInventory('relic_floor_7', '영혼 나침반 바늘', '🧭', 1);
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 1, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 성화의 온기로 망각의 안개를 완전히 몰아냈습니다! (위험도 -30 대폭 감소, 7층 안전 파밍 연장)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (mageHero) {
        options.unshift({
          label: `🌟 [${mageHero.name} 특기] 비전 등대 결계 (위험도 -35 감소 / 7층 전역 시야 개방 / ✨ 50)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('ether', '에테르', '✨', 50);
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 1, 1);
            }
            gm.addLog(`🌟 [아크메이지 특기] [${mageHero.name}]의 비전 등대로 망각의 안개가 순식간에 증발했습니다! (위험도 -35 감소)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 안개를 피해 전진',
        variant: 'ghost',
        action: () => {
          gm.addLog('안개 지대를 조심스럽게 빠져나왔습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_7_b',
    floor: 7,
    title: '⚖️ 영혼의 무게를 재는 사신의 저울',
    desc: '묘지 한가운데 떠 있는 거대한 청동 저울입니다. 한쪽 접시에 깃털이 놓여 있습니다.',
    icon: '⚖️',
    iconKey: 'event_floor_7_scale',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const paladinHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_knights);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 저울을 무력으로 내리치기 (위험도 +35 / 💎 순수 접미석 1개, 🪙 200G 강탈)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('pure_suffix_stone', '순수한 접미석', '💎', 1);
            gm.addToDungeonInventory('gold', '골드', '🪙', 200);
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 1, 1);
            }
            gm.addLog('⚡ [진척도 급가속] 사신의 저울추를 강제로 뜯어내어 귀중한 마도석을 강탈했습니다! (위험도 +35 폭증, 보스 출현 임박)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 전리품 공양 (골드 100G 소모 / 위험도 -25 / 사신의 가호: 사망 1회 방지 방벽)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'shield', turnsLeft: 99, totalTurns: 99, magnitude: Math.floor(h.maxHp * 0.50), source: '사신의 안식' });
            });
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 1, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 저울이 완벽한 수평을 이루며 사신의 절대 가호를 얻었습니다. (위험도 -25 감소, 사망 방지 방벽)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (paladinHero) {
        options.unshift({
          label: `🌟 [${paladinHero.name} 특기] 신성한 영혼의 증명 (골드 소모 0 / 위험도 -30 / 사신의 가호 무료 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'shield', turnsLeft: 99, totalTurns: 99, magnitude: Math.floor(h.maxHp * 0.50), source: '사신의 가호' });
            });
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 1, 1);
            }
            gm.addLog(`🌟 [성기사 특기] [${paladinHero.name}]의 순결한 맹세로 저울이 스스로 기울어졌습니다! (위험도 -30 대폭 감소, 가호 획득)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 저울을 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('사신의 저울을 뒤로하고 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 🛡️ [8층: 단죄의 성채]
  // ================================================================
  {
    id: 'floor_8_a',
    floor: 8,
    title: '⛓️ 흑철 족쇄에 묶인 배교자 성기사',
    desc: '차가운 벽면에 쇠사슬로 결박된 채 고문받아 빈사 상태에 이른 전직 기사단원이 신음하고 있습니다.',
    icon: '⛓️',
    iconKey: 'event_floor_8_knight',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const warriorHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.warriors);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 간수실 경보를 울려 정예 유인 (위험도 +30 / 8티어 흑철 판금 갑옷 / 군사 열쇠)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const dropArmor = gm.generateForgeEquipmentDrop(8);
            gm.addToDungeonInventory(dropArmor.id, dropArmor.name, dropArmor.icon, 1, dropArmor, undefined, 'equipment');
            gm.addToDungeonInventory('memoir_8', '기사단장의 비밀 서신', '📜', 1);
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 2, 1);
            }
            gm.addLog('⚡ [진척도 가속] 고문실 정예 간수들을 제압하고 8티어 중갑을 노획했습니다! (위험도 +30, 비밀 서신 획득)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 은밀히 족쇄를 풀고 치료 (위험도 -25 / 8층 모든 함정 해제 암호 획득)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('memoir_8', '기사단장의 비밀 서신', '📜', 1);
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 조용히 성기사를 구출하여 8층 성채의 전 함정 위치를 파악했습니다! (위험도 -25 감소)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (warriorHero) {
        options.unshift({
          label: `🌟 [${warriorHero.name} 특기] 완력 흑철 파괴 (경보 0 / 위험도 -25 감소 / 단죄의 서약 검 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const dropWeapon = gm.generateForgeEquipmentDrop(8);
            gm.addToDungeonInventory(dropWeapon.id, dropWeapon.name, dropWeapon.icon, 1, dropWeapon, undefined, 'equipment');
            gm.addToDungeonInventory('memoir_8', '기사단장의 비밀 서신', '📜', 1);
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 2, 1);
            }
            gm.addLog(`🌟 [전사 특기] [${warriorHero.name}]이(가) 맨손으로 흑철 족쇄를 뜯어내고 성기사를 무사히 구출했습니다!`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 조용히 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('고문실을 뒤로하고 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_8_b',
    floor: 8,
    title: '⚔️ 전설의 무구 보관실 금고',
    desc: '삼중 룬 잠금장치로 봉인된 무기고 철문 너머로 서늘한 명검의 기운이 뿜어져 나옵니다.',
    icon: '⚔️',
    iconKey: 'event_floor_8_vault',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const rogueHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.shadow_rogues);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 마력 폭탄으로 철문 폭파 (위험도 +35 폭증 / 8티어 단죄의 무기 / ⚙️ 철광석 ×25)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const dropWeapon = gm.generateForgeEquipmentDrop(8);
            gm.addToDungeonInventory(dropWeapon.id, dropWeapon.name, dropWeapon.icon, 1, dropWeapon, undefined, 'equipment');
            gm.addToDungeonInventory('iron', '철광석', '⚙️', 25);
            gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.88)); });
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 2, 1);
            }
            gm.addLog('⚡ [진척도 급가속] 굉음과 함께 철문이 날아가며 8티어 무구를 강탈했습니다! (위험도 +35, 보스 강림 임박)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 우회 통로로 폐기 무기 수습 (위험도 -20 감소 / ⚙️ 철광석 ×15, 🪙 150G)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('loot_open');
            const nextD = Math.max(0, danger - 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('iron', '철광석', '⚙️', 15);
            gm.addToDungeonInventory('gold', '골드', '🪙', 150);
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 소음 없이 안전하게 보관실 외곽의 군수 자원을 수습했습니다. (위험도 -20 감소, 철광석 ×15, 🪙 150G)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (rogueHero) {
        options.unshift({
          label: `🌟 [${rogueHero.name} 특기] 마스터 픽링 (100% 무소음 해제 / 8티어 무구 + 💎 순수 접두석)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            const dropWeapon = gm.generateForgeEquipmentDrop(8);
            gm.addToDungeonInventory(dropWeapon.id, dropWeapon.name, dropWeapon.icon, 1, dropWeapon, undefined, 'equipment');
            gm.addToDungeonInventory('pure_prefix_stone', '순수한 접두석', '💎', 1);
            const q1 = gm.quests.find(q => q.id === 'Q_SCENARIO_01');
            if (q1 && q1.status === 'active' && q1.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_01', 2, 1);
            }
            gm.addLog(`🌟 [암살자 특기] [${rogueHero.name}]이(가) 완벽한 정숙 속에 봉인을 해제하여 8티어 무구와 순수 접두석을 탈취했습니다!`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 무기고를 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('무기고를 건드리지 않고 지나쳤습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 🪞 [9층: 환영의 미궁]
  // ================================================================
  {
    id: 'floor_9_a',
    floor: 9,
    title: '🪞 진실을 비추는 고대 만화경 거울',
    desc: '공중에 부유하는 거대한 만화경 거울 표면에 대원들의 내면과 숨겨진 약점이 투영됩니다.',
    icon: '🪞',
    iconKey: 'event_floor_9_mirror',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const mageHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.arcane_mages);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 거울을 박살내어 미궁 결계 파괴 (위험도 +35 급상승 / 🪞 거울 파편 유물 선취)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('relic_floor_9', '만화경 거울 파편', '🪞', 1);
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 2, 1);
            }
            gm.addLog('⚡ [진척도 급가속] 거울 결계가 깨지며 미궁 중심부 직통로가 열렸습니다! (위험도 +35 급상승, 거울 파편 유물 선취)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 거울을 천으로 덮고 마음 정화 (위험도 -30 대폭 감소 / 전원 MP 100% 회복)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => { h.currentMp = h.maxMp; });
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 환영의 미궁을 차분히 진정시켜 9층 안전 파밍 구간을 확보했습니다. (위험도 -30 감소, 전원 마나 완치)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (mageHero) {
        options.unshift({
          label: `🌟 [${mageHero.name} 특기] 만화경 굴절 제어 (위험도 -35 감소 / 이번 원정 동안 전원 올스탯 +5 가호)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('level_up');
            const nextD = Math.max(0, danger - 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_kaleidoscope_awakening',
              name: '만화경의 초월 각성',
              icon: '🔮',
              category: 'ancestral',
              description: '이번 원정 동안 전원 올스탯 +5',
              conditionText: '이번 원정 동안',
              buffs: { allStatsBonus: 5 }
            });
            gm.addToDungeonInventory('relic_floor_9', '만화경 거울 파편', '🪞', 1);
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 2, 1);
            }
            gm.addLog(`🌟 [아크메이지 특기] [${mageHero.name}]이(가) 환영의 굴절을 흡수하여 이번 원정 동안 파티 전원 올스탯 +5 가호를 얻었습니다! (위험도 -35)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 거울을 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('거울의 환영을 뒤로하고 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_9_b',
    floor: 9,
    title: '👥 거울에서 걸어나온 가짜 도플갱어',
    desc: '거울에서 아군 리더와 완벽히 동일한 장비와 기술을 갖춘 도플갱어가 오만한 미소를 지으며 걸어 나옵니다.',
    icon: '👥',
    iconKey: 'event_floor_9_clone',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const priestHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_priests);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 선제 결투 돌입 (위험도 +30 / 리더 무기와 동일한 9티어 장비 복제 획득)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const cloneWeapon = gm.generateForgeEquipmentDrop(9);
            gm.addToDungeonInventory(cloneWeapon.id, cloneWeapon.name, cloneWeapon.icon, 1, cloneWeapon, undefined, 'equipment');
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 2, 1);
            }
            gm.addLog('⚡ [진척도 가속] 가짜를 일격에 쓰러뜨리고 복제된 9티어 보구를 강탈했습니다! (위험도 +30, 9티어 장비 복제)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 논리적 모순을 지적 (위험도 -25 / 스킬 경험치 +500 비전서 드랍)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => gm.addExpToHero(h, 500));
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 도플갱어가 논리적 모순으로 자멸하며 귀중한 경험을 남겼습니다. (위험도 -25 감소, 전원 경험치 +500)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (priestHero) {
        options.unshift({
          label: `🌟 [${priestHero.name} 특기] 진실의 성광 투사 (위험도 -30 대폭 감소 / 도플갱어 즉시 소멸 / 9티어 장비 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const cloneWeapon = gm.generateForgeEquipmentDrop(9);
            gm.addToDungeonInventory(cloneWeapon.id, cloneWeapon.name, cloneWeapon.icon, 1, cloneWeapon, undefined, 'equipment');
            const q2 = gm.quests.find(q => q.id === 'Q_SCENARIO_02');
            if (q2 && q2.status === 'active' && q2.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_02', 2, 1);
            }
            gm.addLog(`🌟 [성직자 특기] [${priestHero.name}]의 성광 앞에 가짜가 비명을 지르며 소멸했습니다! (위험도 -30, 9티어 장비 획득)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 도플갱어를 무시하고 전진',
        variant: 'ghost',
        action: () => {
          gm.addLog('가짜의 환영을 무시하고 갈 길을 재촉합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 👑 [10층: 심연의 심장부]
  // ================================================================
  {
    id: 'floor_10_a',
    floor: 10,
    title: '🖤 심연의 핵 박동 챔버',
    desc: '거대한 고치 형태의 심연 심장이 쿵, 쿵 고동치며 던전 전체로 암흑 마기를 뿜어내고 있습니다.',
    icon: '🖤',
    iconKey: 'event_floor_10_heart',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const valkHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_knights);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 마핵 액체 강제 추출 (위험도 +40 폭증 / 🖤 심연 군주 마핵 유물 선취 / HP -100)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 40);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => { h.currentHp = Math.max(1, h.currentHp - 100); });
            gm.addToDungeonInventory('relic_floor_10', '심연 군주의 마핵', '🖤', 1);
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 2, 1);
            }
            gm.addLog('⚡ [진척도 급가속] 심연의 핵을 강탈하여 최종 군주의 격노를 샀습니다! (위험도 +40 폭증, 보스 강림 임박, 마핵 유물 획득)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 성수 살포로 심장 진정 (위험도 -35 대폭 감소 / 이번 원정 최종 보스 공·방 20% 약화)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('relic_floor_10', '심연 군주의 마핵', '🖤', 1);
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 정화의 성수로 심장의 맥동을 억제하여 최종 군주의 힘을 크게 약화시켰습니다! (위험도 -35 대폭 감소, 보스 약화)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (valkHero) {
        options.unshift({
          label: `🌟 [${valkHero.name} 특기] 영원의 성역 봉인 (위험도 -40 대폭 감소 / 결전 1회 무적 방벽 부여)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 40);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'immunity', turnsLeft: 99, totalTurns: 99, magnitude: 1, source: '발키리의 결계' });
            });
            gm.addToDungeonInventory('relic_floor_10', '심연 군주의 마핵', '🖤', 1);
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 2, 1);
            }
            gm.addLog(`🌟 [발키리 특기] [${valkHero.name}]이(가) 심연의 심장을 신성 결계로 봉인했습니다! (위험도 -40 감소, 최종 결전 1회 무적)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 챔버를 우회한다',
        variant: 'ghost',
        action: () => {
          gm.addLog('심연의 심장을 뒤로하고 결전의 장으로 향합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_10_b',
    floor: 10,
    title: '📜 최초의 방주 지휘관의 유서',
    desc: '옥좌 바로 앞, 검은 수정에 박힌 채 부식된 최초 탐험대장의 갑주와 피로 쓴 양피지가 놓여 있습니다.',
    icon: '📜',
    iconKey: 'event_floor_10_will',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const warlordHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.warriors);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 지휘관의 검을 뽑아 결전 맹세 (위험도 +30 / 10티어 종말 무기 / 이번 원정 동안 공격력 +25% 가호)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('level_up');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const mythicWeapon = gm.generateForgeEquipmentDrop(10);
            gm.addToDungeonInventory(mythicWeapon.id, mythicWeapon.name, mythicWeapon.icon, 1, mythicWeapon, undefined, 'equipment');
            gm.addExpeditionBuff({
              id: 'expedition_commander_sword',
              name: '선대의 결전 맹세',
              icon: '⚔️',
              category: 'ancestral',
              description: '이번 원정 동안 공격력 +25%',
              conditionText: '이번 원정 동안',
              buffs: { atkBonus: 1.25 }
            });
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 2, 1);
            }
            gm.addLog('⚡ [진척도 가속] 선대의 10티어 종말 무기를 계승하고 결전 의지를 불태웁니다! (위험도 +30, 이번 원정 동안 공격력 +25% 가호)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 유서를 정독하고 전열 재정비 (위험도 -30 / 최종전 1회 사망 완전 방지 불굴 가호)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('memoir_10', '최초 지휘관의 유서', '📜', 1);
            gm.party.forEach(h => {
              gm.applyStatusEffectToHero(h, { type: 'shield', turnsLeft: 99, totalTurns: 99, magnitude: Math.floor(h.maxHp * 0.50), source: '지휘관의 불굴' });
            });
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 선대의 전훈을 분석하여 아군 전원에게 불굴의 방벽을 부여했습니다. (위험도 -30 감소, 최종전 사망 방지)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (warlordHero) {
        options.unshift({
          label: `🌟 [${warlordHero.name} 특기] 지휘관의 전술 계승 (이번 원정 동안 파티 전체 방어력/공격력 +20% 가호)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            gm.addExpeditionBuff({
              id: 'expedition_tactics_inheritance',
              name: '지휘관의 전술 계승',
              icon: '🚩',
              category: 'ancestral',
              description: '이번 원정 동안 공격력/방어력 +20%',
              conditionText: '이번 원정 동안',
              buffs: { atkBonus: 1.20, defBonus: 1.20 }
            });
            gm.addToDungeonInventory('memoir_10', '최초 지휘관의 유서', '📜', 1);
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 2, 1);
            }
            gm.addLog(`🌟 [워로드 특기] [${warlordHero.name}]이(가) 선대 지휘관의 전술을 완벽히 계승하여 이번 원정 동안 전원 공격/방어 +20% 가호 획득!`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 묵념 후 최종 결전장으로',
        variant: 'ghost',
        action: () => {
          gm.addLog('선대 지휘관의 유지를 가슴에 품고 나아갑니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 🌌 [11층: 무간도 (Avici)]
  // ================================================================
  {
    id: 'floor_11_a',
    floor: 11,
    title: '🌌 억겁의 윤회 나선',
    desc: '끝이 보이지 않는 허공에 수만 개의 시간선이 꽈배기처럼 꼬여 있습니다. 한 걸음 내딛을 때마다 시공이 무너집니다.',
    icon: '🌌',
    iconKey: 'event_floor_11_spiral',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const phantomHero = findPartyHeroByClasses(gm.party, ['shadow_phantom', 'calamity_mage']);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 윤회의 고리 100 위험도 점프 (위험도 +100 / 📜 초월 비전서 ×3 획득)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('portal');
            const nextD = Math.min(maxDanger, danger + 100);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => gm.addExpToHero(h, 1000));
            gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 5);
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 2, 1);
            }
            gm.addLog('⚡ [진척도 극한 가속] 시간선을 강제로 뛰어넘어 상위 계층으로 직행했습니다! (무간도 위험도 +100 폭발적 도약, 전원 EXP +1,000)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 차원의 닻으로 시공간 안정화 (위험도 -50 감소 / 전리품 분실률 0% 보존)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 50);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 무간도의 난류를 잠재워 전리품을 안전하게 보존했습니다. (무간도 위험도 -50 감소, 배낭 분실률 0%)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (phantomHero) {
        options.unshift({
          label: `🌟 [${phantomHero.name} 특기] 시공간 위상 정밀 조율 (위험도 -60 감소 & 🌌 공허 파편 ×5 획득)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('portal');
            const nextD = Math.max(0, danger - 60);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 5);
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 2, 1);
            }
            gm.addLog(`🌟 [시공간 특기] [${phantomHero.name}]이(가) 무간도의 나선을 안정화하여 공허 파편을 다량 수습했습니다! (위험도 -60)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 나선을 우회한다',
        variant: 'ghost',
        action: () => {
          gm.addLog('시공간 나선을 우회하여 통과했습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },
  {
    id: 'floor_11_b',
    floor: 11,
    title: '🪐 태초의 공허 모놀리스',
    desc: '어떤 빛도 반사하지 않는 절대 암흑의 거석입니다. 손을 대면 차원 너머의 지식이 직접 쏟아집니다.',
    icon: '🪐',
    iconKey: 'event_floor_11_monolith',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const saintHero = findPartyHeroByClasses(gm.party, ['high_saintess', 'aegis_valkyrie']);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 모놀리스 과충전 공명 (위험도 +500 / 10티어 신화 제작 재료 획득)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 500);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 8);
            gm.addToDungeonInventory('crystal', '마력 수정', '💎', 5);
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 2, 1);
            }
            gm.addLog('⚡ [진척도 극한 가속] 거석을 깨워 무간도의 군주들을 소환했습니다! (위험도 +500 상승, 10티어 제작 재료 대량 획득)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🛡️ [안전 파밍] 모놀리스 에너지 명상 흡수 (위험도 -400 감소 / 이번 원정 동안 전원 공격력 +20% 가호)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 400);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_monolith_wisdom',
              name: '모놀리스의 지혜',
              icon: '🪐',
              category: 'ancestral',
              description: '이번 원정 동안 공격력 +20%',
              conditionText: '이번 원정 동안',
              buffs: { atkBonus: 1.20 }
            });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 2, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 거석의 순수 에너지만을 정제하여 이번 원정 동안 전원 공격력 +20% 가호를 얻었습니다! (위험도 -400 감소)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (saintHero) {
        options.unshift({
          label: `🌟 [${saintHero.name} 특기] 태초의 신성 각인 (이번 원정 동안 전원 HP/MP +20% 가호 / 위험도 -500)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 500);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_saint_monolith',
              name: '태초의 신성 각인',
              icon: '✨',
              category: 'ancestral',
              description: '이번 원정 동안 최대 HP +20%',
              conditionText: '이번 원정 동안',
              buffs: { maxHpBonus: 1.20 }
            });
            gm.party.forEach(h => {
              h.currentHp = h.maxHp;
              h.currentMp = h.maxMp;
            });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[1]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 2, 1);
            }
            gm.addLog(`🌟 [성녀 특기] [${saintHero.name}]이(가) 공허 거석을 신성 모놀리스로 정화했습니다! (위험도 -500, 이번 원정 동안 전원 HP/MP +20% 가호)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 거석을 지나친다',
        variant: 'ghost',
        action: () => {
          gm.addLog('모놀리스를 뒤로하고 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  }
];

/** ✨ 에픽 퀘스트 종료 또는 중복 방지 필터링 후 고유 이벤트가 없을 때 제공되는 안식처 대체 이벤트 */
const FALLBACK_FLOOR_EVENT: FloorEventDefinition = {
  id: 'floor_fallback_sanctuary',
  floor: 0,
  title: '✨ 정화된 심연의 고대 안식처',
  desc: '에픽 서사의 결말 이후 평온을 되찾은 심연의 성소입니다. 따뜻한 에테르 빛이 원정대의 피로를 씻어내고 고대의 보물 상자가 놓여 있습니다.',
  icon: '✨',
  iconKey: 'event_sanctuary',
  generateOptions: (ctx) => {
    const { gm, setDanger, danger, setEventCard } = ctx;
    return [
      {
        label: '🎁 [보물 수습] 고대의 보물 상자 개봉 (🪙 150G, ✨ 에테르 50, 순수 인챈트석 1개)',
        variant: 'success',
        action: () => {
          SoundManager.getInstance().play('loot_open');
          gm.addToDungeonInventory('gold', '골드', '🪙', 150);
          gm.addToDungeonInventory('ether', '에테르', '✨', 50);
          const stoneKey = Math.random() < 0.5 ? 'pure_prefix_stone' : 'pure_suffix_stone';
          const stoneName = stoneKey === 'pure_prefix_stone' ? '순수한 접두석' : '순수한 접미석';
          gm.addToDungeonInventory(stoneKey, stoneName, '💎', 1);
          gm.addLog('✨ [안식처] 고대의 보물 상자에서 150G, 에테르 50, 순수 인챈트석을 수습했습니다!', 'reward');
          setEventCard(null);
        }
      },
      {
        label: '🕯️ [원정 휴식] 성소에서 원정대 회복 (전원 HP/MP 40% 회복, 위험도 -30)',
        variant: 'primary',
        action: () => {
          SoundManager.getInstance().play('heal');
          gm.party.forEach(h => {
            h.currentHp = Math.min(h.maxHp, Math.floor(h.currentHp + h.maxHp * 0.4));
            h.currentMp = Math.min(h.maxMp, Math.floor(h.currentMp + h.maxMp * 0.4));
          });
          const nextD = Math.max(0, danger - 30);
          setDanger(nextD);
          gm.dungeonDangerLevel = nextD;
          gm.addLog('🕯️ [안식처 휴식] 성소의 빛으로 전원 HP/MP를 40% 회복하고 위험도가 30 감소했습니다.', 'reward');
          setEventCard(null);
        }
      }
    ];
  }
};

/** 현재 층에 해당하는 고유 이벤트(A 또는 B) 추첨 (대형 에픽 퀘스트 중복 등장 방지) */
export function getFloorUniqueEvent(floor: number, gm?: GameManager): FloorEventDefinition | null {
  const currentFloor = Math.min(11, Math.max(1, floor));
  let floorEvents = FLOOR_UNIQUE_EVENTS.filter(e => e.floor === currentFloor);

  if (gm) {
    // 퀘스트 상태 헬퍼 (수락/시작되었거나 이미 완료된 상태인지 확인)
    const isQuestStarted = (qId: string) => {
      const q = gm.quests.find(item => item.id === qId);
      return q ? q.status !== 'locked' : false;
    };
    const isQuestCompleted = (qId: string) => {
      const q = gm.quests.find(item => item.id === qId);
      return q ? q.status === 'completed' : false;
    };

    floorEvents = floorEvents.filter(e => {
      // 1. 대형 에픽퀘 1단계 시작 이벤트: 퀘스트가 한 번 시작(active 또는 completed)되면 다시 등장하지 않음
      if (e.id === 'floor_1_a' && isQuestStarted('Q_SCENARIO_01')) return false;
      if (e.id === 'floor_3_b' && isQuestStarted('Q_SCENARIO_02')) return false;
      if ((e.id === 'floor_4_a' || e.id === 'floor_4_b') && isQuestStarted('Q_SCENARIO_04')) return false;
      if ((e.id === 'floor_6_a' || e.id === 'floor_6_b') && isQuestStarted('Q_SCENARIO_03')) return false;

      // 2. 이미 최종 완료(completed)된 에픽 퀘스트의 후속 이벤트도 중복 등장 방지
      if ((e.id === 'floor_8_a' || e.id === 'floor_8_b') && isQuestCompleted('Q_SCENARIO_01')) return false;
      if ((e.id === 'floor_9_a' || e.id === 'floor_9_b') && isQuestCompleted('Q_SCENARIO_02')) return false;
      if ((e.id === 'floor_7_a' || e.id === 'floor_7_b' || e.id === 'floor_10_a' || e.id === 'floor_10_b') && isQuestCompleted('Q_SCENARIO_03')) return false;
      if ((e.id === 'floor_5_a' || e.id === 'floor_5_b' || e.id === 'floor_11_a' || e.id === 'floor_11_b') && isQuestCompleted('Q_SCENARIO_04')) return false;

      return true;
    });
  }

  if (floorEvents.length === 0) {
    return { ...FALLBACK_FLOOR_EVENT, floor: currentFloor };
  }
  return floorEvents[Math.floor(Math.random() * floorEvents.length)];
}
