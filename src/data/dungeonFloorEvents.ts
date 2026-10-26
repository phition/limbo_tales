import { GameManager } from '../managers/GameManager';
import { Mercenary, EventCardOption, EquipmentItem, MonsterData } from '../types/game';
import { ALL_SKILLS_MAP } from './skillBooks';
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
  arcane_mages: ['apprentice', 'elementalist', 'arcane_scholar', 'calamity_mage', 'void_scholar', 'chronomancer', 'chrono_archon'],
  warriors: ['squire', 'guardian', 'fortress', 'vanguard', 'berserker', 'warlord', 'abyssal_berserker', 'immortal_warlord'],
  heavy_guards: ['guardian', 'fortress'],
  berserkers: ['vanguard', 'berserker', 'warlord', 'abyssal_berserker', 'immortal_warlord'],
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
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const rogueHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.shadow_rogues);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 경보 룬 고의 격발 (위험도 +20 / 마물 토벌 시 공격력 +15% 가호 & 군번줄 수습)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('combat_start');
            const nextD = Math.min(maxDanger, danger + 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            // 🛡️ 경보를 듣고 몰려온 1층 심연 마물 편대
            const scoutAlarmSquad: MonsterData[] = [
              {
                id: `scout_alarm_revenant_${Date.now()}`,
                name: '경보에 이끌린 망령',
                type: 'elite',
                faction: 'undead',
                level: 8,
                hp: 240,
                maxHp: 240,
                atk: 25,
                def: 12,
                spd: 11,
                luck: 10,
                promptKey: 'monster_cursed_revenant',
                imagePath: 'assets/monster_cursed_revenant.jpg',
                skills: [
                  {
                    id: 'revenant_claw',
                    name: '원한의 할퀴기',
                    power: 1.2,
                    effectType: 'damage',
                    description: '차가운 손톱으로 대상을 할큅니다.'
                  }
                ],
                rewards: { gold: 25, ether: 10, exp: 90 }
              },
              {
                id: `scout_alarm_imp_${Date.now()}`,
                name: '회랑의 그림자 임프',
                type: 'normal',
                faction: 'demon',
                level: 7,
                hp: 160,
                maxHp: 160,
                atk: 20,
                def: 8,
                spd: 14,
                luck: 12,
                promptKey: 'monster_shadow_imp',
                imagePath: 'assets/monster_shadow_imp.jpg',
                skills: [
                  {
                    id: 'shadow_scratch',
                    name: '그림자 습격',
                    power: 1.1,
                    effectType: 'damage',
                    description: '그림자 속에서 불시에 습격합니다.'
                  }
                ],
                rewards: { gold: 15, ether: 8, exp: 60 }
              }
            ];

            gm.pendingEventBattleId = 'floor_1_a';
            gm.currentMonsters = scoutAlarmSquad;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('⚡ [경보 룬 격발!] 날카로운 경보음이 회랑에 울려 퍼지며 어둠 속 마물들이 떼지어 몰려듭니다! (토벌 시 공격력 +15% 가호 & 군번줄 획득)', 'danger');
            setEventCard(null);
            navigateTo('battle');
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
          label: '⚡ [진척도 가속] 포자 주머니를 터뜨리기 (위험도 +20 상승 / 이번 원정 동안 공격력 +15% & 치명타율 +15% 가호)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('fire');
            const nextD = Math.min(maxDanger, danger + 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_blood_spores',
              name: '핏빛 포자의 각성',
              icon: '🌿',
              category: 'ancestral',
              description: '이번 원정 동안 공격력 +15% & 치명타율 +15%',
              conditionText: '이번 원정 동안',
              buffs: { atkBonus: 1.15, critRateBonus: 15 }
            });
            gm.addToDungeonInventory('herb', '심연 약초', '🌿', 4);
            gm.addLog('⚡ [진척도 가속] 자극적인 마기 포자가 터져 원정대의 투기가 타오릅니다! (위험도 +20 상승, 이번 원정 동안 공격력 +15% & 치명타율 +15% 가호)', 'reward');
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
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const mageHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.arcane_mages);
      const paladinHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_knights);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 단지를 깨뜨려 원혼 해방 (위험도 +25 / 원혼 토벌 시 🪙 80G, 💎 마력 수정 ×2, 공격력 +20% 가호)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('combat_start');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            // 🕯️ 단지가 깨지며 쏟아져 나온 고대 원혼 편대
            const ossuarySquad: MonsterData[] = [
              {
                id: `ossuary_banshee_${Date.now()}`,
                name: '비명의 납골 밴시',
                type: 'elite',
                faction: 'undead',
                level: 15,
                hp: 480,
                maxHp: 480,
                atk: 42,
                def: 18,
                spd: 15,
                luck: 16,
                promptKey: 'monster_tomb_banshee',
                imagePath: 'assets/monster_tomb_banshee.jpg',
                skills: [
                  {
                    id: 'banshee_scream',
                    name: '비명의 원혼파',
                    power: 1.2,
                    effectType: 'damage',
                    description: '귀를 찢는 비명으로 정신을 타격합니다.'
                  }
                ],
                rewards: { gold: 45, ether: 20, exp: 160 }
              },
              {
                id: `crypt_ghoul_${Date.now()}`,
                name: '묘실의 굶주린 구울',
                type: 'normal',
                faction: 'undead',
                level: 14,
                hp: 360,
                maxHp: 360,
                atk: 35,
                def: 14,
                spd: 11,
                luck: 10,
                promptKey: 'monster_crypt_ghoul',
                imagePath: 'assets/monster_crypt_ghoul.jpg',
                skills: [
                  {
                    id: 'ghoul_bite',
                    name: '부식성 물어뜯기',
                    power: 1.15,
                    effectType: 'damage',
                    description: '부식성 이빨로 살점을 물어뜯습니다.'
                  }
                ],
                rewards: { gold: 35, ether: 15, exp: 120 }
              }
            ];

            gm.pendingEventBattleId = 'floor_2_a';
            gm.currentMonsters = ossuarySquad;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('🕯️⚔️ [원혼 해방 폭주!] 깨진 점토 항아리에서 한 맺힌 원혼 밴시와 구울들이 비명을 지르며 덮쳐옵니다! (토벌 시 보물 & 가호 획득)', 'danger');
            setEventCard(null);
            navigateTo('battle');
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
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const warriorHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.warriors);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 피로 룬을 적셔 결투 환영 소환 (위험도 +20 / 환영 격파 시 순교자의 제식 검 & EXP 200 수습)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('combat_start');
            const nextD = Math.min(maxDanger, danger + 20);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            // 🪦 순교자 기사의 결투 환영 구성
            const martyrPhantom: MonsterData[] = [
              {
                id: `martyr_phantom_${Date.now()}`,
                name: '순교자의 결투 환영',
                type: 'elite',
                faction: 'undead',
                level: 16,
                hp: 550,
                maxHp: 550,
                atk: 48,
                def: 22,
                spd: 12,
                luck: 14,
                promptKey: 'monster_dread_knight',
                imagePath: 'assets/monster_dread_knight.jpg',
                skills: [
                  {
                    id: 'martyr_strike',
                    name: '순교자의 단죄검',
                    power: 1.25,
                    effectType: 'damage',
                    description: '검에 영령의 한을 실어 내리칩니다.'
                  }
                ],
                rewards: { gold: 50, ether: 20, exp: 200 }
              }
            ];

            gm.pendingEventBattleId = 'floor_2_b';
            gm.currentMonsters = martyrPhantom;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('🪦⚔️ [순교자 결투 소환!] 피를 머금은 비문에서 검은 오라를 두른 고대 기사의 환영이 실체화되어 검을 뽑습니다! (승리 시 제식 검 & EXP 획득)', 'danger');
            setEventCard(null);
            navigateTo('battle');
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
          label: '⚡ [진척도 가속] 미래의 기억 동기화 (위험도 +25 / 이번 원정 동안 공격력 +30% & 치명타율 +25% 가호)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('portal');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_future_echo',
              name: '미래의 결전 기억',
              icon: '⏳',
              category: 'ancestral',
              description: '이번 원정 동안 공격력 +30% & 치명타율 +25%',
              conditionText: '이번 원정 동안',
              buffs: { atkBonus: 1.30, critRateBonus: 25 }
            });
            gm.activateQuest('Q_SCENARIO_04');
            gm.updateQuestObjective('Q_SCENARIO_04', 0, 1);
            gm.addLog('⚡ [진척도 가속] 미래의 결전 기억을 계승하여 전열의 전투 감각이 극대화되었습니다! (위험도 +25 상승, 이번 원정 동안 공격력 +30% & 치명타율 +25% 가호)', 'reward');
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
          label: `🌟 [${berserkerHero.name} 특기] 피의 광기 포효 (체력 소모 0 / 위험도 +35 폭증 / 이번 원정 동안 치명타 피해 +50% & 흡혈 10% 가호)`,
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 35);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_berserker_frenzy',
              name: '피의 광기 포효',
              icon: '🪓',
              category: 'ancestral',
              description: '이번 원정 동안 치명타 피해 +50% & 흡혈 +10%',
              conditionText: '이번 원정 동안',
              buffs: { critDmgBonus: 0.50, drainBonus: 10 }
            });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog(`🌟 [광전사 특기] [${berserkerHero.name}]이(가) 제단 앞에서 야수의 포효를 내질렀습니다! (위험도 +35 폭증, 이번 원정 동안 치명타 피해 +50% & 흡혈 10% 가호)`, 'reward');
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
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const paladinHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_knights);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 석상 이마의 붉은 마핵 강제 적출 (위험도 +25 / 각성한 거신 석상 파괴 시 🌌 공허 파편 ×4)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('combat_start');
            const nextD = Math.min(maxDanger, danger + 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            // 🗿 마핵 적출로 폭주한 거신 석상 골렘 구성
            const colossusSquad: MonsterData[] = [
              {
                id: `colossus_guardian_${Date.now()}`,
                name: '각성한 심연의 수호 거신',
                type: 'elite',
                faction: 'construct',
                level: 30,
                hp: 1100,
                maxHp: 1100,
                atk: 78,
                def: 45,
                spd: 9,
                luck: 10,
                promptKey: 'monster_monolith_guardian',
                imagePath: 'assets/monster_monolith_guardian.jpg',
                skills: [
                  {
                    id: 'colossus_slam',
                    name: '거신의 대지 파쇄',
                    power: 1.3,
                    effectType: 'damage',
                    description: '석상 대검으로 지면을 내리쳐 파편을 흩뿌립니다.'
                  }
                ],
                rewards: { gold: 100, ether: 40, exp: 500 }
              }
            ];

            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }

            gm.pendingEventBattleId = 'floor_5_b';
            gm.currentMonsters = colossusSquad;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('🗿⚔️ [수호 거신 각성!] 이마의 마핵을 뜯어내자 거신의 석상이 붉은 안광을 켜고 대검을 휘두릅니다! (파괴 시 공허 파편 4개 획득)', 'danger');
            setEventCard(null);
            navigateTo('battle');
          }
        },
        {
          label: '🛡️ [안전 파밍] 부서진 대검을 철광석으로 수리 (위험도 -25 / 이번 원정 동안 물리방어 +30% 가호)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            const nextD = Math.max(0, danger - 25);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_titan_guard',
              name: '거신의 수호 가호',
              icon: '🗿',
              category: 'ancestral',
              description: '이번 원정 동안 물리 방어력 +30%',
              conditionText: '이번 원정 동안',
              buffs: { defBonus: 1.30 }
            });
            const q4 = gm.quests.find(q => q.id === 'Q_SCENARIO_04');
            if (q4 && q4.status === 'active' && q4.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_04', 1, 1);
            }
            gm.addLog('🛡️ [안전 파밍] 거신의 대검을 보수하여 던전이 안정화되고 이번 원정 동안 물리 방어력 +30% 가호를 얻었습니다! (위험도 -25 감소)', 'reward');
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
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const priestHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_priests);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 참회실 문을 박차고 도발 (위험도 +30 / 흡혈 귀족 토벌 시 6티어 보구 강탈)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('combat_start');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            // 🍷 참회실의 숨어있던 흡혈 귀족 정예 편대 구성
            const vampireSquad: MonsterData[] = [
              {
                id: `elite_vampire_${Date.now()}`,
                name: '참회실의 흡혈 백작',
                type: 'elite',
                faction: 'undead',
                level: 35,
                hp: 1200,
                maxHp: 1200,
                atk: 90,
                def: 38,
                spd: 16,
                luck: 20,
                promptKey: 'monster_crimson_vampire',
                imagePath: 'assets/monster_crimson_vampire.jpg',
                skills: [
                  {
                    id: 'vampire_blood_drain',
                    name: '진홍의 생명 흡수',
                    power: 1.3,
                    effectType: 'damage',
                    drainPct: 35,
                    description: '대상의 생명력을 쥐어짜 체력을 회복합니다.'
                  }
                ],
                rewards: { gold: 120, ether: 45, exp: 650 }
              },
              {
                id: `cultist_priest_${Date.now()}`,
                name: '타락한 혈사제',
                type: 'normal',
                faction: 'cultist',
                level: 33,
                hp: 850,
                maxHp: 850,
                atk: 75,
                def: 28,
                spd: 14,
                luck: 15,
                promptKey: 'monster_fallen_priest',
                imagePath: 'assets/monster_fallen_priest.jpg',
                skills: [
                  {
                    id: 'dark_curse_strike',
                    name: '피의 저주',
                    power: 1.15,
                    effectType: 'damage',
                    description: '암흑의 저주를 담아 타격합니다.'
                  }
                ],
                rewards: { gold: 80, ether: 30, exp: 400 }
              }
            ];

            gm.pendingEventBattleId = 'floor_6_a';
            gm.currentMonsters = vampireSquad;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('🍷⚔️ [흡혈 귀족 기습 도발!] 참회실 문을 부수자 송곳니를 드러낸 흡혈 백작이 피의 마법을 흩뿌리며 덮쳐옵니다! (토벌 시 6티어 보구 획득)', 'danger');
            setEventCard(null);
            navigateTo('battle');
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
          label: '⚡ [진척도 가속] 온몸으로 가시밭을 부수며 혈로 돌파 (위험도 +25 / HP 10% 출혈 / 이번 원정 동안 공격력 +10% 가호)',
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
              description: '이번 원정 동안 전원 공격력 +10%',
              conditionText: '이번 원정 동안',
              buffs: { atkBonus: 1.10, flatAtkBonus: 5 }
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
          label: '⚡ [진척도 가속] 안개 속으로 살기 방출 (위험도 +30 / 이번 원정 동안 치명타율 +20% & 공격력 +20% 가호 / 사신의 낫 파편)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 3);
            gm.addExpeditionBuff({
              id: 'expedition_reaper_bloodlust',
              name: '사신의 살기',
              icon: '🌫️',
              category: 'ancestral',
              description: '이번 원정 동안 파티 치명타율 +20% & 공격력 +20%',
              conditionText: '이번 원정 동안',
              buffs: { critRateBonus: 20, atkBonus: 1.20 }
            });
            const q3 = gm.quests.find(q => q.id === 'Q_SCENARIO_03');
            if (q3 && q3.status === 'active' && q3.objectives[0]?.isCompleted) {
              gm.updateQuestObjective('Q_SCENARIO_03', 1, 1);
            }
            gm.addLog('⚡ [진척도 급가속] 살기를 방출하여 망각의 군주들을 불러 모았습니다! (위험도 +30 상승, 이번 원정 동안 치명타율 +20% & 공격력 +20% 가호)', 'reward');
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
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const warriorHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.warriors);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 간수실 경보를 울려 정예 유인 (위험도 +30 / 간수단 토벌 시 8티어 흑철 판금 갑옷 & 비밀 서신 노획)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('combat_start');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            // ⛓️ 고문실 정예 간수 편대 구성 (철혈 고문관 & 이단심문관)
            const torturerSquad: MonsterData[] = [
              {
                id: `elite_torturer_${Date.now()}`,
                name: '단죄의 흑철 고문관',
                type: 'elite',
                faction: 'cultist',
                level: 42,
                hp: 1650,
                maxHp: 1650,
                atk: 115,
                def: 55,
                spd: 13,
                luck: 10,
                promptKey: 'monster_iron_torturer',
                imagePath: 'assets/monster_iron_torturer.jpg',
                skills: [
                  {
                    id: 'torture_cleave',
                    name: '단죄의 쇠사슬 강타',
                    power: 1.35,
                    effectType: 'damage',
                    description: '무거운 쇠사슬을 휘둘러 뼈를 부숩니다.'
                  }
                ],
                rewards: { gold: 160, ether: 50, exp: 800 }
              },
              {
                id: `elite_inquisitor_${Date.now()}`,
                name: '심연의 심문집행관',
                type: 'normal',
                faction: 'cultist',
                level: 40,
                hp: 1100,
                maxHp: 1100,
                atk: 95,
                def: 35,
                spd: 15,
                luck: 12,
                promptKey: 'monster_inquisitor',
                imagePath: 'assets/monster_inquisitor.jpg',
                skills: [
                  {
                    id: 'inquisition_brand',
                    name: '이단의 낙인',
                    power: 1.2,
                    effectType: 'damage',
                    description: '달궈진 철인으로 죄를 심문합니다.'
                  }
                ],
                rewards: { gold: 100, ether: 35, exp: 500 }
              }
            ];

            gm.pendingEventBattleId = 'floor_8_a';
            gm.currentMonsters = torturerSquad;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('⛓️⚔️ [간수실 경보 발령!] 쇠사슬을 쩔렁이며 고문관과 심문집행관이 살기를 뿜으며 들이닥칩니다! (토벌 시 8티어 갑옷 & 비밀 서신 획득)', 'danger');
            setEventCard(null);
            navigateTo('battle');
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
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const priestHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.holy_priests);

      const options: EventCardOption[] = [
        {
          label: '⚡ [진척도 가속] 선제 결투 돌입 (위험도 +30 / 도플갱어 결투 승리 시 9티어 장비 복제 획득)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('combat_start');
            const nextD = Math.min(maxDanger, danger + 30);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            // 👥 플레이어 원정대 복제본 생성 (상단 몬스터 일러스트: 프리즘 방직사 monster_prism_weaver 기본 적용)
            const doppelgangers: MonsterData[] = gm.party.map((hero, idx) => {
              const heroStats = gm.getHeroEffectiveStats(hero);
              const maxHpVal = Math.round(heroStats.maxHp * 1.2);
              const baseSkills = (hero.equippedSkills && hero.equippedSkills.length > 0)
                ? hero.equippedSkills.map(sid => gm.resolveSkillData(sid, hero.level)).filter(Boolean)
                : [];

              const sanitizedSkills = (baseSkills as any[]).map((sk: any, skIdx: number) => ({
                id: sk.id || `doppel_sk_${idx}_${skIdx}`,
                name: sk.name || '거울의 암영격',
                description: sk.description || '대원의 기술을 흉내 낸 암영 일격',
                power: sk.power || 1.1,
                effectType: sk.effectType || 'damage',
                isCharge: false,
                piercePct: sk.piercePct || 0,
                drainPct: sk.drainPct || 0
              }));

              if (sanitizedSkills.length === 0) {
                sanitizedSkills.push({
                  id: `doppel_basic_${idx}`,
                  name: '거울의 암영격',
                  description: '자신의 원본을 겨누는 암영의 일격',
                  power: 1.1,
                  effectType: 'damage',
                  isCharge: false,
                  piercePct: 0,
                  drainPct: 0
                });
              }

              return {
                id: `doppelganger_9f_${hero.id || idx}_${Date.now()}`,
                name: `도플갱어 [${hero.name}]`,
                type: 'elite',
                faction: 'corrupt',
                level: Math.max(30, hero.level),
                hp: maxHpVal,
                maxHp: maxHpVal,
                atk: Math.max(1, Math.round(heroStats.atk * 1.05)),
                def: Math.max(10, Math.round(heroStats.def)),
                spd: Math.max(5, Math.round(heroStats.spd)),
                luck: Math.max(5, Math.round(heroStats.luck)),
                promptKey: 'monster_prism_weaver',
                imagePath: 'assets/monster_prism_weaver.jpg',
                skills: sanitizedSkills,
                rewards: {
                  gold: 150,
                  ether: 40,
                  exp: 1000
                }
              };
            });

            gm.pendingEventBattleId = 'floor_9_b';
            gm.currentMonsters = doppelgangers;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('⚡ [도플갱어 결투 돌입!] 거울 속에서 걸어나온 원정대 복제본들이 비릿한 미소를 지으며 무구를 겨눕니다! (승리 시 9티어 장비 복제 획득)', 'danger');
            setEventCard(null);
            navigateTo('battle');
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
  },
  // ================================================================
  // 🕯️ [11층 특별 조우: 영혼 등대]
  // ================================================================
  {
    id: 'floor_11_lighthouse',
    floor: 11,
    title: '🕯️ 영혼 등대와 망령의 제단',
    desc: '무간도의 짙은 암흑 속에서 푸른 도깨비불을 밝히고 있는 영혼 등대입니다. 등대 기단에는 무수한 원혼들의 속삭임이 서린 제단이 놓여 있습니다.',
    icon: '🕯️',
    iconKey: 'event_floor_11_lighthouse',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const berserkerHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.berserkers);

      const options: EventCardOption[] = [
        {
          label: '🩸 [사경의 제물] 영혼을 담보로 한 계약 (파티원 최대 HP -20% 페널티 / 보스 방어력 -30% 영구 분쇄 및 치명타율 +25% [공허의 붕괴 인] 획득)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('buff');
            gm.party.forEach(h => {
              h.currentHp = Math.max(1, Math.min(h.currentHp, Math.floor(h.maxHp * 0.8)));
            });
            gm.addExpeditionBuff({
              id: 'expedition_void_collapse_seal',
              name: '공허의 붕괴 인',
              icon: '🩸',
              category: 'curse',
              description: '파티원 최대 HP -20%, 보스 방어력 분쇄(관통 +30%), 치명타율 +25%',
              conditionText: '이번 원정 동안',
              buffs: {
                maxHpBonus: 0.80,
                critRateBonus: 0.25,
                defPenetrationBonus: 0.30
              }
            });
            gm.addLog('🩸 [사경의 제물] 원혼들에게 생명력을 바쳐 보스의 방어선을 무너뜨리는 붕괴 인을 획득했습니다! (파티원 최대 HP -20%, 치명타율 +25%, 방어 관통 30%)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🕯️ [망령의 결속] 불사의 등불 점화 (무간도 위험도 +100 증가 / 처음 사경에 빠진 아군 1회 즉시 50% HP로 부활 가호)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('buff');
            const nextD = Math.min(maxDanger, danger + 100);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.hasSoulLanternRevive = true;
            gm.addExpeditionBuff({
              id: 'expedition_soul_lantern',
              name: '망령의 결속 [불사의 등불]',
              icon: '🕯️',
              category: 'ancestral',
              description: '처음 사경(HP 0)에 도달한 아군 1회 즉시 50% HP로 부활',
              conditionText: '원정 1회 한정',
              buffs: {}
            });
            gm.addLog('🕯️ [망령의 결속] 망령의 불꽃과 영혼을 결속했습니다! 처음 사경에 도달한 아군이 1회 즉시 50% 생명력으로 부활합니다. (위험도 +100 증가)', 'reward');
            setEventCard(null);
          }
        },
        {
          label: '🕊️ [안식의 진혼곡] 진혼의 선율 연주 (무간도 위험도 -100 감소 / 전원 체력 및 마나 50% 즉시 회복)',
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('heal');
            const nextD = Math.max(0, danger - 100);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.party.forEach(h => {
              h.currentHp = Math.min(h.maxHp, Math.floor(h.currentHp + h.maxHp * 0.5));
              h.currentMp = Math.min(h.maxMp, Math.floor(h.currentMp + h.maxMp * 0.5));
            });
            gm.addLog('🕊️ [안식의 진혼곡] 무간도의 원혼들을 달래어 위험도를 낮추고 원정대 전원의 활력을 회복했습니다! (위험도 -100 감소, 전원 HP/MP 50% 회복)', 'reward');
            setEventCard(null);
          }
        }
      ];

      if (berserkerHero) {
        options.unshift({
          label: `⚔️ [${berserkerHero.name} 특기] 원혼의 행진곡 (위험도 +100 증가 / 아군 전체 공격력 +20% 증가, 방어력 -20%)`,
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            const nextD = Math.min(maxDanger, danger + 100);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;
            gm.addExpeditionBuff({
              id: 'expedition_vengeful_march',
              name: '원혼의 행진곡',
              icon: '⚔️',
              category: 'ancestral',
              description: '아군 전체 공격력 +20%, 방어력 -20%',
              conditionText: '이번 원정 동안',
              buffs: {
                atkBonus: 1.20,
                defBonus: 0.80
              }
            });
            gm.addLog(`⚔️ [원혼의 행진곡] [${berserkerHero.name}]이(가) 등대의 원혼들을 전투 함성으로 규합했습니다! (위험도 +100, 전원 공격력 +20%, 방어력 -20%)`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 등대를 지나쳐 전진한다',
        variant: 'ghost',
        action: () => {
          gm.addLog('영혼 등대의 푸른 불빛을 뒤로하고 어둠 속으로 전진합니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 🪞 [11층 특별 조우: 차원 거울]
  // ================================================================
  {
    id: 'floor_11_mirror',
    floor: 11,
    title: '🪞 차원 거울의 환영',
    desc: '공중에 떠 있는 거대한 균열 거울입니다. 거울 표면에는 심연의 탁류에 물든 원정대 자신의 모습이 기괴하게 비치고 있습니다.',
    icon: '🪞',
    iconKey: 'event_floor_11_mirror',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard, navigateTo } = ctx;
      const rogueHero = findPartyHeroByClasses(gm.party, CLASS_GROUPS.shadow_rogues);

      const options: EventCardOption[] = [
        {
          label: '⚔️ [미러전] 거울 속 타락한 결사대와 혈투 (승리 시 경험치 2배 & 🌌 공허 파편 ×10 획득)',
          variant: 'danger',
          action: () => {
            SoundManager.getInstance().play('heavy_hit');
            // 파티원 기반 도플갱어 편대 생성
            const doppelgangers: MonsterData[] = gm.party.map((hero, idx) => {
              const heroStats = gm.getHeroEffectiveStats(hero);
              const maxHpVal = Math.round(heroStats.maxHp * 1.5);
              return {
                id: `doppelganger_${hero.id || idx}_${Date.now()}`,
                name: `타락한 도플갱어 [${hero.name}]`,
                type: 'elite',
                faction: 'corrupt',
                level: Math.max(50, hero.level),
                promptKey: 'monster_mirror_phantom',
                imagePath: 'assets/monster_mirror_phantom.jpg',
                hp: maxHpVal,
                maxHp: maxHpVal,
                atk: Math.max(1, Math.round(heroStats.atk * 1.1)),
                def: Math.max(10, Math.round(heroStats.def * 1.0)),
                spd: Math.max(5, Math.round(heroStats.spd)),
                luck: Math.max(5, Math.round(heroStats.luck)),
                skills: [
                  {
                    id: `mirror_strike_${idx}`,
                    name: '거울의 암영격',
                    type: 'attack',
                    power: 1.2,
                    target: 'single',
                    cooldown: 0,
                    description: '자신의 원본을 겨누는 암영의 일격'
                  }
                ],
                rewards: {
                  gold: 500,
                  ether: 150,
                  exp: 3000
                }
              };
            });

            gm.isDoppelgangerBattle = true;
            gm.currentMonsters = doppelgangers;
            gm.clearBattleSnapshot();
            gm.saveGame();
            gm.addLog('⚔️ [도플갱어 출현!] 차원 거울을 깨고 나온 결사대의 거울 복제들과 사투가 시작됩니다! (승리 시 경험치 2배 & 공허 파편 ×10)', 'danger');
            setEventCard(null);
            navigateTo('battle');
          }
        },
        {
          label: '👁️ [비전 개안] 마도서 연구 즉시 완료 (무간도 위험도 +100 증가 / 연구 중인 마도서 습득률 100% 완전 개안)',
          variant: 'primary',
          action: () => {
            SoundManager.getInstance().play('forge_success');
            const nextD = Math.min(maxDanger, danger + 100);
            setDanger(nextD);
            gm.dungeonDangerLevel = nextD;

            let completedCount = 0;
            gm.party.forEach(hero => {
              if (hero.studyingSkills && hero.studyingSkills.length > 0) {
                const studying = [...hero.studyingSkills];
                studying.forEach(sid => {
                  if (!hero.skillMastery) hero.skillMastery = {};
                  if (!hero.learnedSkills) hero.learnedSkills = [];
                  if (!hero.skillLevels) hero.skillLevels = {};
                  hero.skillMastery[sid] = 100;
                  if (!hero.learnedSkills.includes(sid)) {
                    if (hero.learnedSkills.length < 6) {
                      hero.learnedSkills.push(sid);
                      hero.skillLevels[sid] = hero.skillLevels[sid] || 1;
                      if (hero.equippedSkills.length < 2 && !hero.equippedSkills.includes(sid)) {
                        hero.equippedSkills.push(sid);
                      }
                    }
                  }
                  hero.studyingSkills = (hero.studyingSkills || []).filter(s => s !== sid);
                  completedCount++;
                });
              }
            });

            if (completedCount > 0) {
              gm.addLog(`👁️ [비전 개안] 차원 거울의 지식을 흡수하여 연구 중이던 마도서 ${completedCount}개의 연구를 즉시 완료(습득률 100%)했습니다! (위험도 +100 증가)`, 'reward');
            } else {
              // 연구 중인 마도서가 없는 경우 전설급 비전서 제공 & 경험치 1,500 부여
              gm.addToDungeonInventory('void_shard', '공허의 파편', '🌌', 5);
              gm.party.forEach(h => gm.addExpToHero(h, 1500));
              gm.addLog('👁️ [비전 개안] 현재 연구 중인 마도서가 없어 거울의 마력을 전원 EXP +1,500 및 공허 파편 5개로 정제했습니다. (위험도 +100 증가)', 'reward');
            }
            gm.emit('partyUpdated', gm.party);
            gm.saveGame();
            setEventCard(null);
          }
        }
      ];

      if (rogueHero) {
        options.unshift({
          label: `🗡️ [${rogueHero.name} 특기] 거울 너머 암영 강탈 (10티어 전설 무기 ×1 & 💎 순수 마도석 ×5 탈취)`,
          variant: 'success',
          action: () => {
            SoundManager.getInstance().play('loot_open');
            const t10Weapon: EquipmentItem = {
              id: `eq_t10_shadow_dagger_${Date.now()}`,
              templateId: 'forge_t10_dagger',
              tier: 10,
              baseName: '공허 분쇄의 암영단도',
              name: '👑 [전설] 공허 분쇄의 암영단도 +5',
              slot: 'weapon',
              weaponType: 'dagger',
              level: 5,
              enhanceLevel: 5,
              rarity: 'legendary',
              baseStats: { atk: 185, spd: 16, critRate: 15, critDmg: 35 },
              stats: { atk: 235, spd: 20, critRate: 18, critDmg: 45 },
              description: '무간도의 차원 거울 금고에서 탈취한 전설의 10티어 암영 무기.',
              icon: '🗡️'
            };
            gm.addToDungeonInventory(t10Weapon.id, t10Weapon.name, t10Weapon.icon, 1, t10Weapon);
            gm.addToDungeonInventory('pure_mana_stone', '순수 마도석', '💎', 5);
            gm.addLog(`🗡️ [암영 강탈] [${rogueHero.name}]이(가) 차원 거울 너머의 공허 금고를 털어 [👑 10티어 공허 분쇄의 암영단도 +5]와 [💎 순수 마도석 ×5]를 탈취했습니다!`, 'reward');
            setEventCard(null);
          }
        });
      }

      options.push({
        label: '🚶 거울을 깨뜨리지 않고 우회한다',
        variant: 'ghost',
        action: () => {
          gm.addLog('차원 거울의 유혹을 뒤로하고 안전하게 우회했습니다.', 'normal');
          setEventCard(null);
        }
      });

      return options;
    }
  },

  // ================================================================
  // 💀 [11층 특별 조우: 사신 카론]
  // ================================================================
  {
    id: 'floor_11_charon',
    floor: 11,
    title: '💀 망각의 뱃사공 카론',
    desc: '침묵하는 망각의 강 위에서 낡은 나룻배를 젓는 사신 카론을 만났습니다. 그의 앙상한 손에는 영혼의 무게를 재는 저울이 쥐어져 있습니다.',
    icon: '💀',
    iconKey: 'event_floor_11_charon',
    generateOptions: (ctx) => {
      const { gm, danger, maxDanger, setDanger, setEventCard } = ctx;
      const mageHero = findPartyHeroByClasses(gm.party, [
        'apprentice', 'elementalist', 'arcane_scholar', 'calamity_mage', 'void_scholar', 'chronomancer', 'chrono_archon'
      ]);

      const generateMainOptions = (): EventCardOption[] => {
        const opts: EventCardOption[] = [
          {
            label: '🩸 [광전사의 영혼 계약] 카론의 유혈 서약 (행운 -50 페널티 / 치명타 확률 +25%, 치명타 피해 +25% 대폭 증가)',
            variant: 'danger',
            action: () => {
              SoundManager.getInstance().play('buff');
              gm.addExpeditionBuff({
                id: 'expedition_charon_covenant',
                name: '카론의 유혈 서약',
                icon: '💀',
                category: 'curse',
                description: '치명타율 +25%, 치명타 피해 +25%, 행운 -50',
                conditionText: '이번 원정 동안',
                buffs: {
                  critRateBonus: 0.25,
                  critDmgBonus: 0.25,
                  luckBonus: -50
                }
              });
              gm.addLog('💀 [카론의 유혈 서약] 행운을 망각의 강에 던지는 대가로 파멸적인 치명타 위력을 손에 넣었습니다! (행운 -50, 치명타율 +25%, 치명타 피해 +25%)', 'reward');
              setEventCard(null);
            }
          },
          {
            label: '📖 [비전 공양] 망각의 강에 스킬 헌납 (습득한 스킬 1개 망각 ➔ 주력 스킬 1개 레벨 영구히 +1레벨 상승)',
            variant: 'primary',
            action: () => {
              // 습득한 스킬이 있는 영웅 검색
              const eligibleHeroes = gm.party.filter(h => (h.learnedSkills || []).length > 0);

              if (eligibleHeroes.length === 0) {
                gm.addLog('카론이 고개를 젓습니다. "망각의 강에 바칠 습득 비전이 없구나."', 'danger');
                setEventCard(null);
                return;
              }

              // 서브 선택 카드 생성
              const subOptions: EventCardOption[] = [];
              eligibleHeroes.forEach(hero => {
                const learned = hero.learnedSkills || [];
                learned.forEach(sacSid => {
                  if (!hero.skillLevels) hero.skillLevels = {};
                  if (!hero.skillMastery) hero.skillMastery = {};
                  const targetSid = (hero.equippedSkills || []).find(sid => sid !== sacSid) ||
                                    learned.find(sid => sid !== sacSid) ||
                                    hero.classId;
                  const sacDef = ALL_SKILLS_MAP[sacSid] || { name: sacSid };
                  const targetDef = ALL_SKILLS_MAP[targetSid] || { name: targetSid };
                  const curTargetLv = hero.skillLevels[targetSid] || 1;

                  subOptions.push({
                    label: `📖 [${hero.name}] [${sacDef.name}] 망각 ➔ [${targetDef.name}] Lv.${curTargetLv + 1}로 영구 승화`,
                    variant: 'primary',
                    action: () => {
                      hero.learnedSkills = (hero.learnedSkills || []).filter(s => s !== sacSid);
                      hero.equippedSkills = (hero.equippedSkills || []).filter(s => s !== sacSid);
                      if (hero.skillLevels) delete hero.skillLevels[sacSid];
                      if (hero.skillMastery) delete hero.skillMastery[sacSid];
                      if (!hero.skillLevels) hero.skillLevels = {};
                      hero.skillLevels[targetSid] = curTargetLv + 1;

                      SoundManager.getInstance().play('forge_success');
                      gm.addLog(`📖✨ [비전 공양 완료] [${hero.name}]이(가) [${sacDef.name}]을(를) 카론에게 바쳐 [${targetDef.name}]의 레벨이 Lv.${curTargetLv + 1}(으)로 영구 상승했습니다!`, 'reward');
                      gm.emit('partyUpdated', gm.party);
                      gm.saveGame();
                      setEventCard(null);
                    }
                  });
                });
              });

              subOptions.push({
                label: '↩️ 뒤로 가기',
                variant: 'ghost',
                action: () => {
                  setEventCard({
                    title: '💀 망각의 뱃사공 카론',
                    desc: '침묵하는 망각의 강 위에서 낡은 나룻배를 젓는 사신 카론을 만났습니다. 그의 앙상한 손에는 영혼의 무게를 재는 저울이 쥐어져 있습니다.',
                    icon: '💀',
                    iconKey: 'event_floor_11_charon',
                    options: generateMainOptions()
                  });
                }
              });

              setEventCard({
                title: '📖 비전 공양: 망각과 승화',
                desc: '카론이 앙상한 손을 내밉니다. "어떤 비전을 망각의 강물에 던져 주력 기술을 영구히 승화시키겠는가?"',
                icon: '📖',
                iconKey: 'event_floor_11_charon_sacrifice',
                options: subOptions
              });
            }
          }
        ];

        if (mageHero) {
          opts.unshift({
            label: `🌀 [${mageHero.name} 특기] 차원 왜곡 지름길 포탈 (위험도 +100 증가 / 카론의 나룻배를 차원 도약시켜 심연 포탈 개방)`,
            variant: 'success',
            action: () => {
              SoundManager.getInstance().play('portal');
              const nextD = Math.min(maxDanger, danger + 100);
              setDanger(nextD);
              gm.dungeonDangerLevel = nextD;
              gm.portalAppeared = true;
              gm.party.forEach(h => gm.addExpToHero(h, 500));
              gm.addLog(`🌀 [마법사 특기] [${mageHero.name}]이(가) 카론의 나룻배를 차원 왜곡하여 심연 탈출/도약 지름길 포탈을 개방했습니다! (위험도 +100 증가, 전원 EXP +500, 차원 포탈 개방)`, 'reward');
              setEventCard(null);
            }
          });
        }

        opts.push({
          label: '🚶 카론에게 작별을 고하고 지나친다',
          variant: 'ghost',
          action: () => {
            gm.addLog('카론의 나룻배를 뒤로하고 강변을 따라 전진합니다.', 'normal');
            setEventCard(null);
          }
        });

        return opts;
      };

      return generateMainOptions();
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
    // 0. 이번 원정에서 이미 등장한 이벤트 배제 (1원정당 1회 제한)
    if (gm.expeditionTriggeredEventIds && gm.expeditionTriggeredEventIds.length > 0) {
      floorEvents = floorEvents.filter(e => !gm.expeditionTriggeredEventIds.includes(e.id));
    }
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
