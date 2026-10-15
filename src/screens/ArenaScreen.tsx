import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { ActionButton } from '../components/ActionButton';
import { ArenaOpponent, EquipmentItem, Mercenary, Skill, StatusEffect, STATUS_EFFECT_META } from '../types/game';
import { FirebaseService, LeaderboardEntry } from '../services/FirebaseService';
import { CHARACTER_CLASSES } from '../data/classes';
import { SoundManager } from '../managers/SoundManager';
import { GameManager } from '../managers/GameManager';
import { BattleVFXOverlay, VFXEvent } from '../components/BattleVFXOverlay';
import { generateArenaRewardEquipment, CLASS_HONOR_SHOP_DEFINITIONS, createClassHonorEquipment, recalculateEquipmentStats } from '../data/equipment';
import { NemesisView } from './NemesisView';
import { InvasionView } from './InvasionView';
import { AttackerVisualBox } from '../components/AttackerVisualBox';
import { calculatePartySynergies } from '../data/synergies';
import { FeverBadgeType, ShowdownResult, FeverShowdownOutcome } from '../types/fever';
import { FeverGaugeBar } from '../components/FeverGaugeBar';
import {
  evaluateFeverSynergy,
  resolveFeverShowdown,
  FEVER_AFFINITY_META,
  FEVER_BADGE_META,
  FEVER_BADGE_WEIGHT,
  getWeeklyAffinityConfig,
  ALL_FEVER_SYNERGIES_CODEX,
  predictTopSynergies,
  FeverCodexItem,
  PredictedSynergy
} from '../utils/feverUtils';
import { CombatMeterTable, CombatantMetrics } from '../components/CombatMeterTable';
import { CustomAssetService } from '../services/CustomAssetService';
import { GameDataService } from '../services/GameDataService';
import { gameDialog } from '../services/DialogService';
import { getSkillMagicSchool, getElementalSubtype } from '../utils/skillComboUtils';

const DEFAULT_CLASS_IMAGES: Record<string, string> = {
  aegis_valkyrie: 'assets/valkyrie_saintess.jpg',
  paladin: 'assets/valkyrie_saintess.jpg',
  high_saintess: 'assets/valkyrie_saintess.jpg',
  valhalla_blade: 'assets/valkyrie_saintess.jpg',
  tactical_tower: 'assets/citadel_bonfire.jpg',
};

// 🚫 주간 차원의 금기 (Weekly Banned Badge) - 이번 주 획득 불가 배지
export const WEEKLY_BANNED_BADGE: FeverBadgeType = 'crit';

// ⚔️ 차원 아레나 PVP 전투 스케일 밸런스 상수 (순수 3인 전투 정렬)
export const ARENA_ATK_SCALE = 1.0; 
export const ARENA_DEF_SCALE = 1.0;

export const getArenaDRConstant = (): number => {
  const baseDR = GameDataService.getInstance().getBalanceConfig().drConstant || 300;
  return Math.round(baseDR * (160 / 300));
};

interface LeaderInfoCardProps {
  leader: any | null;
  blessing: any | null;
  supporter: any | null;
  side: 'player' | 'enemy';
  isActing: boolean;
  isBot?: boolean;
}

const LeaderInfoCard: React.FC<LeaderInfoCardProps> = ({
  leader,
  blessing,
  supporter,
  side,
  isActing,
  isBot,
}) => {
  const isPlayer = side === 'player';
  const customAssetService = CustomAssetService.getInstance();
  const classId = leader?.classId || '';
  const imageUrl = customAssetService.getMercenaryOverride(classId) || DEFAULT_CLASS_IMAGES[classId];
  const clsInfo = CHARACTER_CLASSES[classId];
  const clsName = clsInfo?.name || leader?.className || (isPlayer ? '원정대 사령관' : '수비대 사령관');

  return (
    <div
      className={`w-full px-2.5 py-1.5 rounded-2xl border transition-all relative overflow-hidden shadow-lg ${
        isPlayer
          ? 'bg-gradient-to-r from-[#091424]/95 via-[#0d1c33]/95 to-[#07111e]/95 border-[#00d2ff55] shadow-[#00d2ff15]'
          : 'bg-gradient-to-r from-[#1c0c16]/95 via-[#270e1c]/95 to-[#140810]/95 border-[#ff416c55] shadow-[#ff416c15]'
      } ${isActing ? (isPlayer ? 'ring-2 ring-[#00d2ff] animate-pulse' : 'ring-2 ring-[#ff416c] animate-pulse') : ''}`}
    >
      <div className="flex items-center gap-2.5">
        {/* 좌측: 오퍼레이터 포트레이트 */}
        <div
          className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shrink-0 border-2 ${
            isPlayer
              ? 'border-[#00d2ff] shadow-[0_0_10px_rgba(0,210,255,0.4)]'
              : 'border-[#ff416c] shadow-[0_0_10px_rgba(255,65,108,0.4)]'
          } bg-[#0c1222] flex items-center justify-center`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={leader?.name || 'Operator'}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-xl">{clsInfo?.skills[0]?.icon || '👑'}</span>
          )}
          <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-black bg-black/85 px-1 py-0.2 rounded text-[#ffd54f] border border-[#ffd54f]/40 leading-none">
            Lv.{leader?.level || 1}
          </span>
          <span className="absolute top-0.5 left-0.5 text-[6px] font-bold bg-black/80 px-1 py-0.2 rounded text-[#ffd54f] leading-none">
            OP
          </span>
        </div>

        {/* 중앙: 오퍼레이터 이름 및 등급 정보 */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                  isPlayer
                    ? 'bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff66]'
                    : 'bg-[#ff416c25] text-[#ff80ab] border border-[#ff416c66]'
                }`}
              >
                {isPlayer ? '아군 오퍼레이터' : '상대 오퍼레이터'}
              </span>
              {!isPlayer && (
                isBot ? (
                  <span className="text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704325] text-[#ff7043] border border-[#ff704355] shrink-0 font-mono">
                    🤖 BOT
                  </span>
                ) : (
                  <span className="text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] shrink-0 font-mono">
                    🌐 지휘관
                  </span>
                )
              )}
              <span className="text-xs font-black text-white truncate">
                {leader?.name || (isPlayer ? '아군 오퍼레이터' : '상대 오퍼레이터')}
              </span>
              {leader?.grade && (
                <span className="text-[8px] font-bold text-[#ffd54f] shrink-0 font-mono">
                  [{leader.grade.toUpperCase()}]
                </span>
              )}
            </div>
            <span className="text-[9px] text-[#8b9bb4] shrink-0">
              {clsName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── 3v3 아레나 전투 참가자 인터페이스 ─────────────────────────────────────────
interface ArenaCombatant {
  id: string;
  name: string;
  classId: string;
  className: string;
  grade: string;
  level: number;
  position: 'front' | 'mid' | 'back';
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  luck: number;
  skills: Skill[];
  isPlayer: boolean;
  cooldowns: Record<string, number>;
  statusEffects: StatusEffect[];
  icon: string;
  deathCountdown?: number;
  isDead?: boolean;
  isPermanentlyDead?: boolean;
}

// ── 가짜 상대 생성 ─────────────────────────────────────────────────────────
// ── 🤖 프리시즌 전 등급 AI 지휘관 봇 로스터 (브론즈 ~ 그랜드마스터) ───────────────
export interface PreseasonBotConfig {
  id: string;
  name: string;
  guild: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';
  rating: number;
  classes: [string, string, string]; // 전열, 중열, 후열
  opClass: string; // 전술 오퍼레이터
  feverConcept: string; // 전술 특징
}

export const PRESEASON_BOT_ROSTER: PreseasonBotConfig[] = [
  // 🥉 브론즈 (Bronze: 700 ~ 990) - 기본기 훈련 및 피버 연습용
  {
    id: 'bot_bronze_1',
    name: '수습 검사 루키',
    guild: '모험가 초보자단',
    tier: 'bronze',
    rating: 760,
    classes: ['squire', 'vanguard', 'squire'],
    opClass: 'squire',
    feverConcept: '기본 돌격 및 연계 기초'
  },
  {
    id: 'bot_bronze_2',
    name: '견습 수녀 릴리',
    guild: '신록의 기도원',
    tier: 'bronze',
    rating: 810,
    classes: ['paladin', 'squire', 'novice_cleric'],
    opClass: 'novice_cleric',
    feverConcept: '수호 방어 및 지속 치유'
  },
  {
    id: 'bot_bronze_3',
    name: '훈련병 한스',
    guild: '성채 방위대 훈련소',
    tier: 'bronze',
    rating: 870,
    classes: ['guardian', 'squire', 'archer'],
    opClass: 'guardian',
    feverConcept: '전열 방벽 & 견제 사격'
  },
  {
    id: 'bot_bronze_4',
    name: '마도 실습생 핀',
    guild: '마법 학술원 초급반',
    tier: 'bronze',
    rating: 920,
    classes: ['squire', 'apprentice_mage', 'novice_cleric'],
    opClass: 'apprentice_mage',
    feverConcept: '마력 탄환 기초 연계'
  },
  {
    id: 'bot_bronze_5',
    name: '길거리 격투가 잭',
    guild: '뒷골목 자경단',
    tier: 'bronze',
    rating: 960,
    classes: ['rogue', 'vanguard', 'squire'],
    opClass: 'rogue',
    feverConcept: '연속 급소 찌르기'
  },

  // 🥈 실버 (Silver: 1000 ~ 1290) - 초중급 진형 훈련용
  {
    id: 'bot_silver_1',
    name: '창술사 볼트',
    guild: '붉은 창끝 길드',
    tier: 'silver',
    rating: 1050,
    classes: ['vanguard', 'tactical_gunner', 'bishop'],
    opClass: 'vanguard',
    feverConcept: '원거리 저격 및 전열 견제'
  },
  {
    id: 'bot_silver_2',
    name: '그림자 연습생',
    guild: '밤까마귀 도적단',
    tier: 'silver',
    rating: 1110,
    classes: ['assassin', 'duelist', 'rogue'],
    opClass: 'assassin',
    feverConcept: '회피 기동 및 치명타 노림수'
  },
  {
    id: 'bot_silver_3',
    name: '강철 수호병 바란',
    guild: '아이언 가드 연대',
    tier: 'silver',
    rating: 1160,
    classes: ['guardian', 'paladin', 'bishop'],
    opClass: 'paladin',
    feverConcept: '신성 방벽 & 철벽 수호'
  },
  {
    id: 'bot_silver_4',
    name: '성역의 순례자 엘렌',
    guild: '여명의 수도회',
    tier: 'silver',
    rating: 1210,
    classes: ['paladin', 'bishop', 'novice_cleric'],
    opClass: 'bishop',
    feverConcept: '이중 치유 & 성스러운 오라'
  },
  {
    id: 'bot_silver_5',
    name: '황야의 저격수 로빈',
    guild: '은빛 화살 용병단',
    tier: 'silver',
    rating: 1260,
    classes: ['guardian', 'sniper', 'archer'],
    opClass: 'sniper',
    feverConcept: '정밀 조준 관통 저격'
  },

  // 🏆 골드 (Gold: 1300 ~ 1590) - 정석 조합 대결용
  {
    id: 'bot_gold_1',
    name: '철혈의 바사라',
    guild: '붉은 창끝 길드',
    tier: 'gold',
    rating: 1350,
    classes: ['paladin', 'tactical_gunner', 'high_saintess'],
    opClass: 'aegis_valkyrie',
    feverConcept: '철벽 수호 & 원거리 화력 투사'
  },
  {
    id: 'bot_gold_2',
    name: '황금의 아라나',
    guild: '달빛 기사단',
    tier: 'gold',
    rating: 1410,
    classes: ['aegis_valkyrie', 'elementalist', 'arcane_scholar'],
    opClass: 'bishop',
    feverConcept: '마법 변칙계 & 에테르 증폭'
  },
  {
    id: 'bot_gold_3',
    name: '진홍의 저격수 레이첼',
    guild: '비호 용병단',
    tier: 'gold',
    rating: 1460,
    classes: ['vanguard', 'sniper', 'shadow_phantom'],
    opClass: 'sniper',
    feverConcept: '은신 기습 & 즉사 저격'
  },
  {
    id: 'bot_gold_4',
    name: '비전의 마도사 레온',
    guild: '상아탑 마도연맹',
    tier: 'gold',
    rating: 1510,
    classes: ['guardian', 'elementalist', 'calamity_mage'],
    opClass: 'elementalist',
    feverConcept: '원소 폭풍 & 마력 연쇄'
  },
  {
    id: 'bot_gold_5',
    name: '질풍의 검사 렌',
    guild: '일섬 유파',
    tier: 'gold',
    rating: 1560,
    classes: ['duelist', 'assassin', 'shadow_phantom'],
    opClass: 'duelist',
    feverConcept: '연속 난무 & 치명 반격'
  },

  // ⚔️ 플래티넘 (Platinum: 1600 ~ 1890) - 상급 연계 공략용
  {
    id: 'bot_plat_1',
    name: '심연의 루나',
    guild: '심연 탐험단',
    tier: 'platinum',
    rating: 1640,
    classes: ['assassin', 'shadow_phantom', 'calamity_mage'],
    opClass: 'valhalla_blade',
    feverConcept: '극딜 암살 & 돌파계 포카드 노림수'
  },
  {
    id: 'bot_plat_2',
    name: '폭풍의 제라드',
    guild: '황금 독수리단',
    tier: 'platinum',
    rating: 1700,
    classes: ['vanguard', 'valhalla_blade', 'bishop'],
    opClass: 'paladin',
    feverConcept: '연격 폭풍 & 성기사 가호 지속전'
  },
  {
    id: 'bot_plat_3',
    name: '철벽의 수호자 가렌',
    guild: '방주 방위사령부',
    tier: 'platinum',
    rating: 1760,
    classes: ['aegis_valkyrie', 'guardian', 'high_saintess'],
    opClass: 'aegis_valkyrie',
    feverConcept: '난공불락 요새 & 기적의 치유'
  },
  {
    id: 'bot_plat_4',
    name: '시공의 마탄사 카일',
    guild: '에테르 연금단',
    tier: 'platinum',
    rating: 1810,
    classes: ['tactical_gunner', 'arcane_scholar', 'calamity_mage'],
    opClass: 'tactical_gunner',
    feverConcept: '시공 탄환 난사 & 왜곡 결계'
  },
  {
    id: 'bot_plat_5',
    name: '성역의 수호희 세실리아',
    guild: '빛의 수호성당',
    tier: 'platinum',
    rating: 1860,
    classes: ['aegis_valkyrie', 'paladin', 'high_saintess'],
    opClass: 'high_saintess',
    feverConcept: '신성 축복 풀하우스 연계'
  },

  // 💠 다이아몬드 (Diamond: 1900 ~ 2190) - 최정예 고수 덱
  {
    id: 'bot_dia_1',
    name: '절대방벽 볼코프',
    guild: '아이언 가디언즈',
    tier: 'diamond',
    rating: 1940,
    classes: ['guardian', 'paladin', 'high_saintess'],
    opClass: 'aegis_valkyrie',
    feverConcept: '불멸의 방진 & 결계 반사'
  },
  {
    id: 'bot_dia_2',
    name: '환영술사 미라주',
    guild: '시공의 유랑단',
    tier: 'diamond',
    rating: 2000,
    classes: ['shadow_phantom', 'duelist', 'arcane_scholar'],
    opClass: 'calamity_mage',
    feverConcept: '변칙계 환영 회피 & 흡혈 진혼곡'
  },
  {
    id: 'bot_dia_3',
    name: '발할라 선봉장 지그프리트',
    guild: '발할라 기사단',
    tier: 'diamond',
    rating: 2060,
    classes: ['valhalla_blade', 'vanguard', 'aegis_valkyrie'],
    opClass: 'valhalla_blade',
    feverConcept: '투신 강림 & 파쇄 스트레이트'
  },
  {
    id: 'bot_dia_4',
    name: '여명의 대주교 세라핌',
    guild: '천상 성역 수도원',
    tier: 'diamond',
    rating: 2110,
    classes: ['high_saintess', 'paladin', 'bishop'],
    opClass: 'high_saintess',
    feverConcept: '영원한 부활 & 성스러운 기적'
  },
  {
    id: 'bot_dia_5',
    name: '심연의 마탄황 로이드',
    guild: '블랙 불릿 여단',
    tier: 'diamond',
    rating: 2160,
    classes: ['tactical_gunner', 'shadow_phantom', 'calamity_mage'],
    opClass: 'tactical_gunner',
    feverConcept: '암흑 탄환 탄막 & 파멸 광역기'
  },

  // 💎 마스터 (Master: 2200 ~ 2490) - 아레나 챔피언 덱
  {
    id: 'bot_master_1',
    name: '신벌의 발키리아',
    guild: '천상의 성역',
    tier: 'master',
    rating: 2240,
    classes: ['aegis_valkyrie', 'valhalla_blade', 'high_saintess'],
    opClass: 'paladin',
    feverConcept: '성역 결계 & 기적의 소생 풀하우스'
  },
  {
    id: 'bot_master_2',
    name: '재앙의 인도자 벨리알',
    guild: '흑사자 정예대',
    tier: 'master',
    rating: 2310,
    classes: ['calamity_mage', 'shadow_phantom', 'tactical_gunner'],
    opClass: 'duelist',
    feverConcept: '치명 타격 & 파쇄 스트레이트 극의'
  },
  {
    id: 'bot_master_3',
    name: '불멸의 검성 렌',
    guild: '심연의 무극관',
    tier: 'master',
    rating: 2380,
    classes: ['valhalla_blade', 'duelist', 'shadow_phantom'],
    opClass: 'valhalla_blade',
    feverConcept: '무한의 검막 & 신속 섬격'
  },
  {
    id: 'bot_master_4',
    name: '공허의 지배관 에레보스',
    guild: '공허 숭배단',
    tier: 'master',
    rating: 2450,
    classes: ['aegis_valkyrie', 'calamity_mage', 'arcane_scholar'],
    opClass: 'calamity_mage',
    feverConcept: '블랙홀 왜곡 & 심연 압살'
  },

  // 👑 그랜드마스터 (Grand Master: 2500+) - 전 서버 절대자 덱
  {
    id: 'bot_grand_1',
    name: '차원의 지배자 크로노스',
    guild: '시공간 최고평의회',
    tier: 'grandmaster',
    rating: 2560,
    classes: ['aegis_valkyrie', 'calamity_mage', 'high_saintess'],
    opClass: 'valhalla_blade',
    feverConcept: '5색 무지개 전술의 극의 (Grand Maestro)'
  },
  {
    id: 'bot_grand_2',
    name: '무한의 수호룡 테라',
    guild: '용혈의 성채',
    tier: 'grandmaster',
    rating: 2640,
    classes: ['aegis_valkyrie', 'guardian', 'paladin'],
    opClass: 'aegis_valkyrie',
    feverConcept: '절대 무적의 용린 결계'
  },
  {
    id: 'bot_grand_3',
    name: '황혼의 심판자 오리온',
    guild: '별빛 천구관',
    tier: 'grandmaster',
    rating: 2730,
    classes: ['valhalla_blade', 'calamity_mage', 'shadow_phantom'],
    opClass: 'tactical_gunner',
    feverConcept: '초신성 폭발 & 영혼 흡수'
  }
];

export function getTierFromRating(rating: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' {
  if (rating >= 2500) return 'grandmaster';
  if (rating >= 2200) return 'master';
  if (rating >= 1900) return 'diamond';
  if (rating >= 1600) return 'platinum';
  if (rating >= 1300) return 'gold';
  if (rating >= 1000) return 'silver';
  return 'bronze';
}

// ── 등급 사다리 기반 대진표 생성 (유저 등급 맞춤 대진 + 상위 승급 도전 배치) ─────────────
function generateOpponents(myRank: number, myRating: number, gateLevel: number = 1): ArenaOpponent[] {
  const userTier = getTierFromRating(myRating);
  const TIER_ORDER: PreseasonBotConfig['tier'][] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster'];
  const curTierIdx = TIER_ORDER.indexOf(userTier);
  const nextTierIdx = Math.min(TIER_ORDER.length - 1, curTierIdx + 1);
  const prevTierIdx = Math.max(0, curTierIdx - 1);

  const curPool = PRESEASON_BOT_ROSTER.filter(b => b.tier === userTier);
  const nextPool = PRESEASON_BOT_ROSTER.filter(b => b.tier === TIER_ORDER[nextTierIdx]);
  const prevPool = PRESEASON_BOT_ROSTER.filter(b => b.tier === TIER_ORDER[prevTierIdx]);

  function pickUnique<T extends { id: string }>(pool: T[], count: number, excludeIds: Set<string>): T[] {
    const available = pool.filter(item => !excludeIds.has(item.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    selected.forEach(item => excludeIds.add(item.id));
    return selected;
  }

  const pickedIds = new Set<string>();
  let selectedBots: PreseasonBotConfig[] = [];

  if (userTier === 'bronze') {
    // 🥉 브론즈: 동급 브론즈 3명 + 상위 실버 승급 도전 2명
    const bronzeBots = pickUnique(curPool, 3, pickedIds);
    const silverChallenges = pickUnique(nextPool, 2, pickedIds);
    selectedBots = [...bronzeBots, ...silverChallenges];
  } else if (userTier === 'grandmaster') {
    // 👑 그랜드마스터: 마스터 2명 + 그랜드마스터 3명
    const masterBots = pickUnique(prevPool, 2, pickedIds);
    const grandBots = pickUnique(curPool, 3, pickedIds);
    selectedBots = [...masterBots, ...grandBots];
  } else {
    // 🥈~💎 실버~마스터: 워밍업 1명 + 동급 2명 + 상위 티어 승급 도전 2명
    const warmupBots = pickUnique(prevPool.length > 0 ? prevPool : curPool, 1, pickedIds);
    const peerBots = pickUnique(curPool, 2, pickedIds);
    const promotionChallenges = pickUnique(nextPool, 2, pickedIds);
    selectedBots = [...warmupBots, ...peerBots, ...promotionChallenges];
  }

  // 예외 방어: 5명이 안 채워졌을 경우 전체 로스터에서 추가 보충
  if (selectedBots.length < 5) {
    const remaining = pickUnique(PRESEASON_BOT_ROSTER, 5 - selectedBots.length, pickedIds);
    selectedBots = [...selectedBots, ...remaining];
  }

  // 레이팅 오름차순 정렬 (1번: 가장 만만한/워밍업 상대 ~ 5번: 최고 승급 도전전)
  selectedBots.sort((a, b) => a.rating - b.rating);

  return selectedBots.map((cfg, i) => {
    // 랭크 추산 (레이팅 기반 자연스러운 순위 부여)
    let oppRank = 500;
    if (cfg.rating >= 2500) {
      oppRank = Math.max(1, Math.floor(5 - (cfg.rating - 2500) / 50 + (Math.random() * 2 - 1)));
    } else if (cfg.rating >= 2200) {
      oppRank = Math.max(6, Math.floor(30 - (cfg.rating - 2200) / 12.5 + (Math.random() * 4 - 2)));
    } else if (cfg.rating >= 1900) {
      oppRank = Math.max(31, Math.floor(80 - (cfg.rating - 1900) / 6 + (Math.random() * 6 - 3)));
    } else if (cfg.rating >= 1600) {
      oppRank = Math.max(81, Math.floor(180 - (cfg.rating - 1600) / 3 + (Math.random() * 10 - 5)));
    } else if (cfg.rating >= 1300) {
      oppRank = Math.max(181, Math.floor(320 - (cfg.rating - 1300) / 2.14 + (Math.random() * 14 - 7)));
    } else if (cfg.rating >= 1000) {
      oppRank = Math.max(321, Math.floor(500 - (cfg.rating - 1000) / 1.67 + (Math.random() * 20 - 10)));
    } else {
      oppRank = Math.max(501, Math.floor(1000 - (cfg.rating - 800) * 2.5 + (Math.random() * 20 - 10)));
    }

    const botGateLevel = Math.max(1, Math.min(10, gateLevel + (i % 2 === 0 ? 0 : 1)));
    const isPromotion = TIER_ORDER.indexOf(cfg.tier) > curTierIdx;

    // 3인 선발 + 1인 오퍼레이터 덱 생성
    const allRoleClasses = [...cfg.classes, cfg.opClass];
    const mockDeck: Mercenary[] = allRoleClasses.map((clsId, idx) => {
      const cls = CHARACTER_CLASSES[clsId] || CHARACTER_CLASSES['squire'];
      const pos: 'front' | 'mid' | 'back' = idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back';
      const isOp = idx === 3;

      return {
        id: `opp_hero_${cfg.id}_${idx}`,
        name: isOp ? `[OP] ${cfg.name}의 ${cls.name}` : `${cfg.name}의 ${cls.name}`,
        title: cls.name,
        classId: clsId,
        grade: cfg.tier === 'master' || cfg.tier === 'grandmaster' ? 'legend' : cfg.tier === 'diamond' ? 'epic' : cfg.tier === 'platinum' ? 'hero' : 'veteran',
        level: Math.max(1, Math.floor(cfg.rating / 75)),
        exp: 0,
        expToNext: 100,
        currentHp: Math.round(cls.baseStats.hp * 1.5),
        maxHp: Math.round(cls.baseStats.hp * 1.5),
        currentMp: cls.baseStats.mp,
        maxMp: cls.baseStats.mp,
        position: pos,
        stats: { ...cls.baseStats },
        equippedSkills: cls.skills.map(s => s.id),
        learnedSkills: cls.skills.map(s => s.id),
        equipment: {},
        statusEffects: [],
        portraitPromptKey: cls.promptKey,
      };
    });

    return {
      id: `opp_${cfg.id}_${Date.now()}_${i}`,
      name: `${cfg.name} [${cfg.feverConcept}]`,
      rank: oppRank,
      rating: cfg.rating,
      defenseDeck: mockDeck,
      guild: cfg.guild,
      gateLevel: botGateLevel,
      isBot: true,
      isPromotion,
    };
  });
}

// ── 7개 표준 랭크 뱃지 (브론즈 ~ 그랜드마스터) ──────────────────────────────
export function getRankBadge(rating: number): { label: string; color: string; border: string; bg: string; icon: string } {
  if (rating >= 2500) return { label: 'Grand Master', color: '#ff1744', border: '#ff174488', bg: '#ff174422', icon: '👑' };
  if (rating >= 2200) return { label: 'Master', color: '#e040fb', border: '#e040fb88', bg: '#e040fb22', icon: '💎' };
  if (rating >= 1900) return { label: 'Diamond', color: '#00d2ff', border: '#00d2ff88', bg: '#00d2ff22', icon: '💠' };
  if (rating >= 1600) return { label: 'Platinum', color: '#00e676', border: '#00e67688', bg: '#00e67622', icon: '⚔️' };
  if (rating >= 1300) return { label: 'Gold', color: '#ffd54f', border: '#ffd54f88', bg: '#ffd54f22', icon: '🏆' };
  if (rating >= 1000) return { label: 'Silver', color: '#b0bec5', border: '#b0bec588', bg: '#b0bec522', icon: '🛡️' };
  return { label: 'Bronze', color: '#cd7f32', border: '#cd7f3288', bg: '#cd7f3222', icon: '🥉' };
}

type Tab = 'match' | 'ranking' | 'shop';

interface CombatLogItem {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  skillName?: string;
  side: 'player' | 'enemy';
}

export const ArenaScreen: React.FC = () => {
  const { state, gm, navigateTo } = useGameManager();
  const gateLevel = gm.isMasterAccount ? 10 : (state.buildings['arenaGate']?.level || 0);
  const isGateBuilt = gateLevel >= 1;
  const isNemesisUnlocked = gateLevel >= 3;
  const isInvasionUnlocked = gateLevel >= 6;

  const [gateMode, setGateMode] = useState<'arena' | 'nemesis' | 'invasion'>('arena');
  const [tab, setTab] = useState<Tab>('match');
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLb, setIsLoadingLb] = useState(false);

  // 게이트 레벨에 따른 개방 모드 자동 보정
  useEffect(() => {
    if (gateMode === 'invasion' && !isInvasionUnlocked) {
      setGateMode(isNemesisUnlocked ? 'nemesis' : 'arena');
    } else if (gateMode === 'nemesis' && !isNemesisUnlocked) {
      setGateMode('arena');
    }
  }, [gateMode, isNemesisUnlocked, isInvasionUnlocked]);

  // ── ⚔️ 3v3+1+1 차원 아레나 몰입형 인터랙티브 전장 상태 ──
  const [activeBattleOpp, setActiveBattleOpp] = useState<ArenaOpponent | null>(null);
  const [playerTeam, setPlayerTeam] = useState<ArenaCombatant[]>([]);
  const [oppTeam, setOppTeam] = useState<ArenaCombatant[]>([]);
  const [activeCombatantId, setActiveCombatantId] = useState<string | null>(null);
  const [targetEnemyId, setTargetEnemyId] = useState<string | null>(null);
  const [isAuto] = useState(true);
  const [battleSpeed, setBattleSpeed] = useState<1.5 | 2>(2);
  const [battleRound, setBattleRound] = useState(1);
  const [vfxList, setVfxList] = useState<VFXEvent[]>([]);
  const [actionBanner, setActionBanner] = useState<{ text: string; sub: string; color: string } | null>(null);
  const [battleLogs, setBattleLogs] = useState<CombatLogItem[]>([]);
  const [turnTick, setTurnTick] = useState(0);
  const [combatMetrics, setCombatMetrics] = useState<CombatantMetrics[]>([]);
  const combatMetricsRef = useRef<Record<string, CombatantMetrics>>({});

  // 👑 리더 & 🛡️ 서포터 상태 (아군 및 적군)
  const [playerLeader, setPlayerLeader] = useState<Mercenary | null>(null);
  const [playerSupporter, setPlayerSupporter] = useState<Mercenary | null>(null);

  const [oppLeader, setOppLeader] = useState<Mercenary | null>(null);
  const [oppSupporter, setOppSupporter] = useState<Mercenary | null>(null);
  const [oppLeaderBlessing, setOppLeaderBlessing] = useState<any | null>(null);

  // 🔥 피버 게이지 (아군 및 적군)
  const [feverBadges, setFeverBadges] = useState<FeverBadgeType[]>([]);
  const [oppFeverBadges, setOppFeverBadges] = useState<FeverBadgeType[]>([]);
  const [isLeaderUltCutin, setIsLeaderUltCutin] = useState(false);
  const [isOppLeaderUltCutin, setIsOppLeaderUltCutin] = useState(false);
  const [isShowdownCutin, setIsShowdownCutin] = useState(false);
  const isShowdownCutinRef = useRef(false);
  const [showdownResult, setShowdownResult] = useState<ShowdownResult | null>(null);
  // 🃏 피버 쇼다운 순차 배지 오픈 & 승자 광채 연출 상태
  const [showdownPlayerBadges, setShowdownPlayerBadges] = useState<FeverBadgeType[]>([]);
  const [showdownOppBadges, setShowdownOppBadges] = useState<FeverBadgeType[]>([]);
  const [showdownRevealIndex, setShowdownRevealIndex] = useState(0); // 0 ~ 5 (오픈된 배지 수)
  const [isShowdownEvaluated, setIsShowdownEvaluated] = useState(false); // 족보 판정 및 승자 광채 발동
  const [isCodexModalOpen, setIsCodexModalOpen] = useState(false);
  const weeklyAffinity = useMemo(() => getWeeklyAffinityConfig(), []);

  // 🏆 피버콜 3회 승리 즉시 제압 카운터 (3-Win Domination)
  const [playerFeverWins, setPlayerFeverWins] = useState(0);
  const [oppFeverWins, setOppFeverWins] = useState(0);
  const playerFeverWinsRef = useRef(0);
  const oppFeverWinsRef = useRef(0);

  // ⚡ 피버콜 선언(선완성) 및 3턴 유예 타임아웃 관리
  const [feverCallLead, setFeverCallLead] = useState<'player' | 'opp' | null>(null);
  const feverCallLeadRef = useRef<'player' | 'opp' | null>(null);
  const [feverCallCountdown, setFeverCallCountdown] = useState<number>(3);
  const feverCallCountdownRef = useRef<number>(3);

  // 📜 전투 중 발생한 피버콜 대결 히스토리 (결투 종료 리포트 출력용)
  const [feverCallHistory, setFeverCallHistory] = useState<{
    round: number;
    playerSynergy: { id: string; name: string; icon: string; summary: string };
    oppSynergy: { id: string; name: string; icon: string; summary: string };
    playerBadges: FeverBadgeType[];
    oppBadges: FeverBadgeType[];
    playerScore: number;
    oppScore: number;
    outcome: FeverShowdownOutcome;
    isTimeout?: boolean;
    bannerTitle: string;
  }[]>([]);
  const feverCallHistoryRef = useRef<{
    round: number;
    playerSynergy: { id: string; name: string; icon: string; summary: string };
    oppSynergy: { id: string; name: string; icon: string; summary: string };
    playerBadges: FeverBadgeType[];
    oppBadges: FeverBadgeType[];
    playerScore: number;
    oppScore: number;
    outcome: FeverShowdownOutcome;
    isTimeout?: boolean;
    bannerTitle: string;
  }[]>([]);
  const [isFeverReportExpanded, setIsFeverReportExpanded] = useState(false);

  // 🏃 속도(SPD) 기반 턴 순서 큐
  const [roundQueue, setRoundQueue] = useState<string[]>([]);
  const roundQueueRef = useRef<string[]>([]);

  // ── 상/하단 공격자 비주얼 상태 ──
  const [lastPlayerAttacker, setLastPlayerAttacker] = useState<ArenaCombatant | null>(null);
  const [lastEnemyAttacker, setLastEnemyAttacker] = useState<ArenaCombatant | null>(null);

  // ── 대전 상태 동기화용 Refs ──
  const isProcessingRef = useRef(false);
  const playerTeamRef = useRef<ArenaCombatant[]>([]);
  const oppTeamRef = useRef<ArenaCombatant[]>([]);
  const targetEnemyIdRef = useRef<string | null>(null);
  const activeCombatantIdRef = useRef<string | null>(null);
  const isAutoRef = useRef(true);
  const activeBattleOppRef = useRef<ArenaOpponent | null>(null);
  const playerLeaderRef = useRef<Mercenary | null>(null);
  const playerSupporterRef = useRef<Mercenary | null>(null);
  const oppLeaderRef = useRef<Mercenary | null>(null);
  const oppSupporterRef = useRef<Mercenary | null>(null);
  const feverBadgesRef = useRef<FeverBadgeType[]>([]);
  const oppFeverBadgesRef = useRef<FeverBadgeType[]>([]);

  // 대전 최종 결과
  const [finalReward, setFinalReward] = useState<{
    win: boolean;
    ratingDelta: number;
    coins: number;
    equipment: EquipmentItem | null;
    streak: number;
    expGained: number;
    levelUps: string[];
  } | null>(null);
  const finalRewardRef = useRef<typeof finalReward>(null);
  const isBattleEndedRef = useRef(false);

  playerTeamRef.current = playerTeam;
  oppTeamRef.current = oppTeam;
  targetEnemyIdRef.current = targetEnemyId;
  activeCombatantIdRef.current = activeCombatantId;
  isAutoRef.current = isAuto;
  finalRewardRef.current = finalReward;
  activeBattleOppRef.current = activeBattleOpp;
  playerLeaderRef.current = playerLeader;
  playerSupporterRef.current = playerSupporter;
  oppLeaderRef.current = oppLeader;
  oppSupporterRef.current = oppSupporter;
  feverBadgesRef.current = feverBadges;
  oppFeverBadgesRef.current = oppFeverBadges;

  const fb = FirebaseService.getInstance();
  const badge = getRankBadge(state.currentArenaRating);
  const isTop10 = state.currentArenaRank <= 10 || state.pveBuffActive;
  const streak = state.arenaStreak || 0;

  // 🌌 5인 차원 부대 편성 검증 및 덱 정보
  const squadCheck = useMemo(() => {
    return gm.isDimensionalSquadReady();
  }, [state.invasionState, state.barracks, state.party, turnTick, gm]);

  const dimDeck = useMemo(() => {
    return gm.getDimensionalDeck();
  }, [state.invasionState, state.barracks, state.party, turnTick, gm]);

  // 🎯 3인 부대 기반 달성 가능성 높은 추천 족보 TOP 3 계산
  const predictedSynergies = useMemo(() => {
    return predictTopSynergies(dimDeck.mainHeroes);
  }, [dimDeck.mainHeroes]);

  const allAvailableHeroes = useMemo(() => {
    return [...state.barracks, ...state.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
  }, [state.barracks, state.party]);

  // 👑 리더의 가호 및 심연의 백과 도감 보너스, 3인 진형 시너지 계산
  const playerLeaderBlessing = useMemo(() => {
    return playerLeader ? gm.getLeaderBlessing(playerLeader) : null;
  }, [playerLeader, gm]);

  const codexBonus = useMemo(() => {
    return gm.getCodexBonus();
  }, [gm, state.codexUnlockedItems]);

  const activePartySynergies = useMemo(() => {
    const living = playerTeam.filter(c => c.currentHp > 0);
    return calculatePartySynergies(living.map(c => ({ classId: c.classId, position: c.position } as any)));
  }, [playerTeam]);

  // 상대 풀 로드 (차원 앵커 게이트 레벨 반영 + 실제 유저 데이터 우선 매칭 + 부족 시 봇 보충)
  // ── 🛡️ [프리시즌 고정] 유저풀 집계 전까지 전 등급 AI 봇 대진표 매칭 ──
  const refreshOpponents = useCallback(() => {
    setOpponents(generateOpponents(state.currentArenaRank, state.currentArenaRating, gateLevel));
  }, [state.currentArenaRank, state.currentArenaRating, gateLevel]);

  // 🏁 전투 완전 종료 처리 (승패 확정 시 백그라운드 전투/타이머/턴 즉시 중단)
  const finishBattle = useCallback((isWin: boolean) => {
    if (isBattleEndedRef.current || finalRewardRef.current) return;
    isBattleEndedRef.current = true;
    isProcessingRef.current = true; // 영구 잠금: 이후 어떤 턴이나 AI도 동작하지 않음
    activeCombatantIdRef.current = null;
    setActiveCombatantId(null);
    setIsShowdownCutin(false);
    isShowdownCutinRef.current = false;
    setIsLeaderUltCutin(false);
    setIsOppLeaderUltCutin(false);

    const opp = activeBattleOppRef.current;
    if (!opp) return;

    const rewardResult = gm.claimArenaMatchRewards(opp, isWin);
    const finalData = { ...rewardResult, win: isWin };
    finalRewardRef.current = finalData;
    setFinalReward(finalData);
    setCombatMetrics(Object.values(combatMetricsRef.current));
    try {
      SoundManager.getInstance().play(isWin ? 'victory' : 'defeat');
    } catch (_) {}
    refreshOpponents();
  }, [gm, refreshOpponents]);

  useEffect(() => {
    refreshOpponents();
  }, [refreshOpponents]);

  // ── 🏆 프리시즌 AI 전술 훈련 리그 순위표 로드 ──────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLb(true);
    // 플레이어 정보 생성
    const playerEntry: LeaderboardEntry = {
      rank: 0,
      nickname: '내 원정단 (지휘관)',
      rating: state.currentArenaRating,
      level: Math.max(1, Math.floor(state.currentArenaRating / 75)),
      leaderTitle: '방주 성채 수호단',
      gateLevel: gateLevel,
      isPlayer: true,
    };

    // 프리시즌 봇 로스터를 기반으로 순위표 엔트리 생성
    const botEntries: LeaderboardEntry[] = PRESEASON_BOT_ROSTER.map((b) => ({
      rank: 0,
      nickname: `${b.name} (${b.guild})`,
      rating: b.rating,
      level: Math.max(1, Math.floor(b.rating / 75)),
      leaderTitle: `[${b.feverConcept}]`,
      gateLevel: Math.max(1, Math.min(10, Math.floor(b.rating / 250))),
      isPlayer: false,
    }));

    // 레이팅 내림차순 정렬 후 순위 부여
    const combined = [playerEntry, ...botEntries].sort((a, b) => b.rating - a.rating);
    const rankedList: LeaderboardEntry[] = combined.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

    setLeaderboard(rankedList);
    setIsLoadingLb(false);
  }, [state.currentArenaRating, gateLevel]);

  useEffect(() => {
    if (tab === 'ranking') {
      fetchLeaderboard();
    }
  }, [tab, fetchLeaderboard]);

  // ── ⚔️ 3v3 아레나 전투 시작 (진영 초기화) ──────────────────────────────────
  const startPvpSimulation = (opp: ArenaOpponent) => {
    const check = gm.isDimensionalSquadReady();
    if (!check.isReady) {
      SoundManager.getInstance().play('debuff');
      gameDialog.alert({
        title: '⚔️ 차원 3인 부대 편성 필요',
        message: check.reason || '차원 아레나 결투는 3인 부대(전열/중열/후열)가 모두 편성되어야 진행할 수 있습니다.',
        icon: '⚠️',
      });
      return;
    }

    setActiveBattleOpp(opp);
    setBattleLogs([]);
    setFinalReward(null);
    finalRewardRef.current = null;
    isBattleEndedRef.current = false;
    setBattleRound(1);
    setActionBanner(null);
    setVfxList([]);
    setFeverBadges([]);
    setOppFeverBadges([]);
    setShowdownPlayerBadges([]);
    setShowdownOppBadges([]);
    setShowdownRevealIndex(0);
    setIsShowdownEvaluated(false);
    setIsShowdownCutin(false);
    isShowdownCutinRef.current = false;
    setPlayerFeverWins(0);
    playerFeverWinsRef.current = 0;
    setOppFeverWins(0);
    oppFeverWinsRef.current = 0;
    setFeverCallLead(null);
    feverCallLeadRef.current = null;
    setFeverCallCountdown(3);
    feverCallCountdownRef.current = 3;
    setFeverCallHistory([]);
    feverCallHistoryRef.current = [];
    setIsFeverReportExpanded(false);
    setIsLeaderUltCutin(false);
    setIsOppLeaderUltCutin(false);
    gm.emit('arenaBattleStateChanged', true);
    gm.emit('phaserSceneChange', 'arena_battle');

    // 1. 아군 3+1+1 덱 파싱
    const { mainHeroes, leaderHero, supporterHero } = gm.getDimensionalDeck();
    setPlayerLeader(leaderHero);
    setPlayerSupporter(supporterHero);

    // 2. 적군 3+1+1 덱 파싱 (opp.defenseDeck 기준 3선발 + 1리더 + 1서포터)
    const oDeck = opp.defenseDeck || [];
    const oppMainHeroes = oDeck.slice(0, 3);
    const oppLeaderHero = oDeck[3] || null;
    const oppSupporterHero = oDeck[4] || null;
    setOppLeader(oppLeaderHero);
    setOppSupporter(oppSupporterHero);

    // 적 리더 가호 보너스 계산 (동등한 전투 조건)
    const oppLeaderBlessing = oppLeaderHero ? gm.getLeaderBlessing(oppLeaderHero) : null;
    setOppLeaderBlessing(oppLeaderBlessing);

    // 3. 아군 3인 선발 전투원 빌드
    const pCombatants: ArenaCombatant[] = mainHeroes.map((h, idx) => {
      const eff = gm.getHeroEffectiveStats(h);
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '기본 공격',
          description: '단일 대상에게 100% 위력의 물리 기본 공격을 가합니다.',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '⚔️',
        },
        ...cls.skills,
        ...(cls.specialSkill ? [cls.specialSkill] : []),
      ];
      return {
        id: h.id,
        name: h.name,
        classId: h.classId,
        className: cls.name,
        grade: h.grade,
        level: h.level,
        position: idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back',
        currentHp: eff.maxHp,
        maxHp: eff.maxHp,
        currentMp: eff.maxMp,
        maxMp: eff.maxMp,
        atk: eff.atk,
        def: eff.def,
        spd: eff.spd,
        luck: eff.luck,
        skills: allSkills,
        isPlayer: true,
        cooldowns: {},
        statusEffects: [],
        icon: cls.skills[0]?.icon || '⚔️',
      };
    });

    // 4. 적군 3인 선발 전투원 빌드 (레벨 성장치, 레이팅 스케일, 리더 가호 반영)
    const oCombatants: ArenaCombatant[] = oppMainHeroes.map((h, idx) => {
      const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['squire'];
      const allSkills: Skill[] = [
        {
          id: 'basic_attack',
          name: '기본 공격',
          description: '단일 대상에게 100% 위력의 물리 기본 공격.',
          manaCost: 0,
          cooldown: 0,
          targetType: 'single_enemy',
          power: 1.0,
          effectType: 'damage',
          icon: '⚔️',
        },
        ...cls.skills,
        ...(cls.specialSkill ? [cls.specialSkill] : []),
      ];

      const lvlBonus = 1 + (h.level - 1) * 0.08;
      const ratingScale = Math.max(1.0, opp.rating / 1000);
      const oppAtkBonus = oppLeaderBlessing?.buffs?.atkBonus || 1.0;
      const oppDefBonus = oppLeaderBlessing?.buffs?.defBonus || 1.0;
      const oppHpBonus = oppLeaderBlessing?.buffs?.maxHpBonus || (oppLeaderBlessing?.buffs as any)?.hpBonus || 1.0;
      const oppAllBonus = oppLeaderBlessing?.buffs?.allStatsBonus || 1.0;

      const maxHp = Math.round((cls.baseStats.hp * lvlBonus * 2.3 + h.level * 25) * ratingScale * oppHpBonus * oppAllBonus);
      const maxMp = cls.baseStats.mp;
      const calcAtk = Math.round((cls.baseStats.atk * lvlBonus * 1.5 + h.level * 5) * ratingScale * oppAtkBonus * oppAllBonus);
      const calcDef = Math.round((cls.baseStats.def * lvlBonus * 1.3 + h.level * 3) * ratingScale * oppDefBonus * oppAllBonus);
      const calcSpd = Math.round(cls.baseStats.spd * (1 + (h.level - 1) * 0.03));

      return {
        id: `opp_${idx}_${h.classId}`,
        name: h.name,
        classId: h.classId,
        className: cls.name,
        grade: h.grade || 'veteran',
        level: h.level,
        position: idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back',
        currentHp: maxHp,
        maxHp: maxHp,
        currentMp: maxMp,
        maxMp: maxMp,
        atk: calcAtk,
        def: calcDef,
        spd: calcSpd,
        luck: cls.baseStats.luck,
        skills: allSkills,
        isPlayer: false,
        cooldowns: {},
        statusEffects: [],
        icon: cls.skills[0]?.icon || '👾',
      };
    });

    playerTeamRef.current = pCombatants;
    oppTeamRef.current = oCombatants;
    targetEnemyIdRef.current = oCombatants[0]?.id || null;
    setPlayerTeam(pCombatants);
    setOppTeam(oCombatants);
    setTargetEnemyId(oCombatants[0]?.id || null);
    if (pCombatants.length > 0) setLastPlayerAttacker(pCombatants[0]);
    if (oCombatants.length > 0) setLastEnemyAttacker(oCombatants[0]);

    // 📊 전투 딜미터기 메트릭스 초기화
    const initMetrics: Record<string, CombatantMetrics> = {};
    pCombatants.forEach(c => {
      initMetrics[c.id] = {
        id: c.id,
        name: c.name,
        className: c.className,
        isPlayer: true,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    });
    if (leaderHero) {
      initMetrics[leaderHero.id] = {
        id: leaderHero.id,
        name: `${leaderHero.name} (👑리더)`,
        className: CHARACTER_CLASSES[leaderHero.classId]?.name || '리더',
        isPlayer: true,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }
    if (supporterHero) {
      initMetrics[supporterHero.id] = {
        id: supporterHero.id,
        name: `${supporterHero.name} (🤝서포터)`,
        className: CHARACTER_CLASSES[supporterHero.classId]?.name || '서포터',
        isPlayer: true,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }
    oCombatants.forEach(c => {
      initMetrics[c.id] = {
        id: c.id,
        name: c.name,
        className: c.className,
        isPlayer: false,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    });
    if (oppLeaderHero) {
      initMetrics['opp_leader'] = {
        id: 'opp_leader',
        name: `${oppLeaderHero.name} (💀적 리더)`,
        className: CHARACTER_CLASSES[oppLeaderHero.classId]?.name || '리더',
        isPlayer: false,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }
    if (oppSupporterHero) {
      initMetrics['opp_supporter'] = {
        id: 'opp_supporter',
        name: `${oppSupporterHero.name} (🛡️적 서포터)`,
        className: CHARACTER_CLASSES[oppSupporterHero.classId]?.name || '서포터',
        isPlayer: false,
        damageDealt: 0,
        healingDone: 0,
        damageTaken: 0,
        dodges: 0,
        combosTriggered: 0,
        critCount: 0,
        kills: 0,
        actionsCount: 0,
      };
    }
    combatMetricsRef.current = initMetrics;
    setCombatMetrics(Object.values(initMetrics));

    // 🏃 속도(SPD) 내림차순으로 전체 턴 순서 큐 생성 (정통 속도 기반 턴제 진행)
    const allSorted = [...pCombatants, ...oCombatants].sort((a, b) => b.spd - a.spd || b.luck - a.luck);
    const queueIds = allSorted.map(c => c.id);
    roundQueueRef.current = queueIds;
    setRoundQueue(queueIds);
    activeCombatantIdRef.current = queueIds[0] || null;
    setActiveCombatantId(queueIds[0] || null);

    isProcessingRef.current = false;
    setTurnTick(0);
  };

  // 🔥 아군 피버 뱃지 추가 헬퍼 (주간 금지 배지 필터링)
  const addFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    if (badgeType === WEEKLY_BANNED_BADGE) return;
    let becameFull = false;
    setFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      feverBadgesRef.current = next;
      if (next.length >= 5) becameFull = true;
      return next;
    });
    if (becameFull && feverCallLeadRef.current === null && oppFeverBadgesRef.current.length < 5) {
      feverCallLeadRef.current = 'player';
      feverCallCountdownRef.current = 3;
      setFeverCallLead('player');
      setFeverCallCountdown(3);
    }
  }, []);

  // 💀 적군 피버 뱃지 추가 헬퍼 (주간 금지 배지 필터링)
  const addOppFeverBadge = useCallback((badgeType: FeverBadgeType) => {
    if (badgeType === WEEKLY_BANNED_BADGE) return;
    let becameFull = false;
    setOppFeverBadges(prev => {
      if (prev.length >= 5) return prev;
      const next = [...prev, badgeType];
      oppFeverBadgesRef.current = next;
      if (next.length >= 5) becameFull = true;
      return next;
    });
    if (becameFull && feverCallLeadRef.current === null && feverBadgesRef.current.length < 5) {
      feverCallLeadRef.current = 'opp';
      feverCallCountdownRef.current = 3;
      setFeverCallLead('opp');
      setFeverCallCountdown(3);
    }
  }, []);

  // 💥 2단계: 피버콜 승부 판정 연출이 사라진 후 궁극기 연출 폭발 및 전투 재개
  const executeFeverUltimateAfterShowdown = useCallback((
    showdown: ShowdownResult,
    isPlayerDomination: boolean,
    isOppDomination: boolean
  ) => {
    if (isBattleEndedRef.current || finalRewardRef.current) return;

    const isPlayerWin = showdown.outcome === 'player_win';
    const isOppWin = showdown.outcome === 'opp_win';
    const isClash = showdown.outcome === 'clash';

    const pCombatants = playerTeamRef.current;
    const oCombatants = oppTeamRef.current;

    // 👑 아군 전술 오퍼레이터 및 궁극기 파싱
    const dimDeck = gm.getDimensionalDeck();
    const activeOperator = playerLeaderRef.current || dimDeck.operatorHero || dimDeck.leaderHero;
    const opCls = activeOperator ? CHARACTER_CLASSES[activeOperator.classId] : null;
    const opSpecialSkill = opCls ? (opCls.specialSkill || opCls.skills[0]) : null;
    const opBonusDmg = activeOperator ? Math.round((activeOperator.stats.atk || 120) * (isClash ? 0.8 : 1.5)) : 0;

    // 배지 슬롯 정산 (쇼다운 종료 즉시 비움)
    setFeverBadges([]);
    feverBadgesRef.current = [];
    setOppFeverBadges([]);
    oppFeverBadgesRef.current = [];

    // 사운드 및 배너 연출
    try {
      SoundManager.getInstance().play(isPlayerDomination ? 'victory' : isPlayerWin ? 'boss_skill' : isOppWin ? 'heavy_hit' : 'slash');
    } catch (_) {}

    if (isPlayerDomination) {
      setActionBanner({
        text: '🏆 [피버 전술 압도 (FEVER DOMINATION)]',
        sub: `피버콜 3회 승리 달성! 오퍼레이터 [${activeOperator?.name || '지휘관'}]의 전술 폭격으로 적 결투 부대를 완전히 제압했습니다!`,
        color: '#ffd54f'
      });
    } else if (isOppDomination) {
      setActionBanner({
        text: '💀 [적군 피버 전술 압도]',
        sub: '적의 피버콜 3회 성공으로 결투에서 패배했습니다.',
        color: '#ff416c'
      });
    } else {
      setActionBanner({
        text: `${showdown.icon} ${showdown.bannerTitle}`,
        sub: isPlayerWin && opSpecialSkill
          ? `[오퍼레이터 궁극기] ${activeOperator?.name}의 [${opSpecialSkill.name}] 전탄 발사! (${showdown.playerSynergy.name})`
          : `${showdown.bannerSub} (${showdown.playerSynergy.name} vs ${showdown.oppSynergy.name})`,
        color: isPlayerWin ? '#00d2ff' : isOppWin ? '#ff416c' : '#ffd54f'
      });
    }

    // 컷인 배너 활성화
    if (isPlayerWin || isPlayerDomination) {
      setIsLeaderUltCutin(true);
    } else if (isOppWin || isOppDomination) {
      setIsOppLeaderUltCutin(true);
    }

    // 1. 아군 공격/효과 적용 (아군 승리 또는 동급 격돌)
    if (isPlayerWin || isClash) {
      const syn = showdown.playerSynergy;
      const pLeader = pCombatants.find(c => c.currentHp > 0) || pCombatants[0];
      const baseAtk = pLeader?.atk || 120;
      const mult = (syn.powerMult || 1.4) * (isClash ? 0.6 : 1.0);
      const critMult = syn.critRateBonus >= 0.5 ? 1.6 : 1.2;
      const finalDmg = isPlayerDomination ? 999999 : Math.round(baseAtk * mult * critMult) + opBonusDmg;

      const livingOpp = oCombatants.filter(c => c.currentHp > 0);
      const updatedOpp = oCombatants.map(c => {
        if (c.currentHp <= 0) return c;
        const newHp = isPlayerDomination ? 0 : Math.max(0, c.currentHp - finalDmg);
        return {
          ...c,
          currentHp: newHp,
          statusEffects: syn.stunTurns > 0 ? [
            ...c.statusEffects,
            { id: 'fever_stun', name: '그로기', type: 'stun', duration: syn.stunTurns, turnsLeft: syn.stunTurns, totalTurns: syn.stunTurns, magnitude: 1, source: 'fever', icon: '💫' } as unknown as StatusEffect
          ] : c.statusEffects
        };
      });

      // 전투 로그 기록
      setBattleLogs(prev => [
        ...prev,
        {
          round: battleRound,
          attacker: activeOperator ? `오퍼레이터 ${activeOperator.name}` : (pLeader?.name || '아군 리더'),
          defender: '적 전체',
          damage: finalDmg,
          isCrit: true,
          skillName: isPlayerDomination
            ? '🏆 피버 3승 즉시 제압 (Domination)'
            : opSpecialSkill
            ? `피버 연계 [${syn.name} + ${opSpecialSkill.name}]`
            : syn.name,
          side: 'player'
        }
      ]);

      // VFX 출력
      livingOpp.forEach((t, i) => {
        const idx = Math.max(0, oCombatants.findIndex(c => c.id === t.id));
        const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
        setTimeout(() => {
          setVfxList(prev => [...prev, {
            id: `vfx_showdown_p_${Date.now()}_${t.id}_${i}`,
            type: 'crit_slash',
            damage: finalDmg,
            isCrit: true,
            x: colX,
            y: 24,
            duration: 700
          }]);
          gm.emit('battleHitEffect', { x: colX, y: 24, color: 0x00d2ff, isCrit: true, type: 'crit_slash' });
        }, i * 70);
      });

      // 아군 부활 / 회복 효과 적용
      let updatedPTeam = [...pCombatants];
      if (syn.reviveFallen) {
        const deadIdx = updatedPTeam.findIndex(c => c.currentHp <= 0);
        if (deadIdx >= 0) {
          const targetHero = updatedPTeam[deadIdx];
          const reviveHp = Math.round(targetHero.maxHp * (syn.reviveHpPct || 0.5));
          updatedPTeam[deadIdx] = { ...targetHero, currentHp: reviveHp };
        }
      }
      if (syn.partyShieldPct > 0) {
        updatedPTeam = updatedPTeam.map(c => c.currentHp <= 0 ? c : {
          ...c,
          statusEffects: [
            ...c.statusEffects,
            { id: 'fever_shield', name: '에테르 방벽', type: 'shield', duration: 2, turnsLeft: 2, totalTurns: 2, magnitude: Math.round(c.maxHp * syn.partyShieldPct), source: 'fever', icon: '🛡️' } as unknown as StatusEffect
          ]
        });
      }

      oppTeamRef.current = updatedOpp;
      setOppTeam(updatedOpp);
      playerTeamRef.current = updatedPTeam;
      setPlayerTeam(updatedPTeam);
    }

    // 2. 적군 공격/효과 적용 (적군 승리 또는 동급 격돌)
    if (!isPlayerDomination && (isOppWin || isClash)) {
      const syn = showdown.oppSynergy;
      const oLeader = oCombatants.find(c => c.currentHp > 0) || oCombatants[0];
      const baseAtk = oLeader?.atk || 120;
      const mult = (syn.powerMult || 1.4) * (isClash ? 0.6 : 1.0);
      const critMult = syn.critRateBonus >= 0.5 ? 1.5 : 1.2;
      const finalDmg = isOppDomination ? 999999 : Math.round(baseAtk * mult * critMult);

      const livingP = playerTeamRef.current.filter(c => c.currentHp > 0);
      const updatedP = playerTeamRef.current.map(c => {
        if (c.currentHp <= 0) return c;
        const newHp = isOppDomination ? 0 : Math.max(0, c.currentHp - finalDmg);
        return { ...c, currentHp: newHp };
      });

      // VFX 출력
      livingP.forEach((t, i) => {
        const idx = Math.max(0, playerTeamRef.current.findIndex(c => c.id === t.id));
        const colX = idx === 0 ? 20 : idx === 1 ? 50 : 80;
        setTimeout(() => {
          setVfxList(prev => [...prev, {
            id: `vfx_showdown_o_${Date.now()}_${t.id}_${i}`,
            type: 'crit_slash',
            damage: finalDmg,
            isCrit: true,
            x: colX,
            y: 74,
            duration: 700
          }]);
          gm.emit('battleHitEffect', { x: colX, y: 74, color: 0xff416c, isCrit: true, type: 'crit_slash' });
        }, i * 70);
      });

      playerTeamRef.current = updatedP;
      setPlayerTeam(updatedP);
    }

    // 4. 궁극기 연출 지속(1.6초) 후 승패 체크 및 전투 재개
    setTimeout(() => {
      if (isBattleEndedRef.current || finalRewardRef.current) return;

      setIsLeaderUltCutin(false);
      setIsOppLeaderUltCutin(false);

      const oppRemains = oppTeamRef.current.filter(c => c.currentHp > 0);
      const pRemains = playerTeamRef.current.filter(c => c.currentHp > 0);

      if (oppRemains.length === 0 || isPlayerDomination) {
        finishBattle(true);
        return;
      } else if (pRemains.length === 0 || isOppDomination) {
        finishBattle(false);
        return;
      }

      // 🏃 전투 재개! 다음 턴 진행
      isProcessingRef.current = false;
      setTurnTick(t => t + 1);
    }, 1600);
  }, [gm, gateLevel, battleRound, finishBattle]);

  // ⚔️🔥 1단계: 피버 콜 (Fever Call) 대결 판정 및 컷인 개시 (필드 전투 일시 정지)
  const triggerFeverShowdown = useCallback((isTimeout = false, timeoutWinner?: 'player' | 'opp') => {
    if (isBattleEndedRef.current || finalRewardRef.current) return;
    const pCombatants = playerTeamRef.current;
    const oCombatants = oppTeamRef.current;
    if (pCombatants.length === 0 || oCombatants.length === 0) return;

    // ⚔️ [핵심 룰] 정상 발동 시 양측 모두 5개 완충 시에만 발동! (타임아웃 시에는 완성 측 승리로 발동)
    if (!isTimeout) {
      if (feverBadgesRef.current.length < 5 || oppFeverBadgesRef.current.length < 5) {
        return;
      }
    }

    if (isShowdownCutinRef.current) return;
    isShowdownCutinRef.current = true;

    // ⏸️ 필드 전투 즉시 일시 정지 (턴 및 AI 정지)
    isProcessingRef.current = true;

    // 피버콜 리드 및 카운트다운 초기화
    feverCallLeadRef.current = null;
    setFeverCallLead(null);
    feverCallCountdownRef.current = 3;
    setFeverCallCountdown(3);

    const playerParty = pCombatants.map(c => ({
      classId: c.classId,
      currentHp: c.currentHp,
      maxHp: c.maxHp
    } as any));
    const oppParty = oCombatants.map(c => ({
      classId: c.classId,
      currentHp: c.currentHp,
      maxHp: c.maxHp
    } as any));

    let showdown: ShowdownResult;
    if (isTimeout && timeoutWinner) {
      const isPlayerWin = timeoutWinner === 'player';
      const playerSynergy = evaluateFeverSynergy(feverBadgesRef.current, playerParty);
      const oppSynergy = evaluateFeverSynergy(oppFeverBadgesRef.current, oppParty);
      showdown = {
        outcome: isPlayerWin ? 'player_win' : 'opp_win',
        playerSynergy,
        oppSynergy,
        playerAffinity: 'neutral',
        oppAffinity: 'neutral',
        playerScore: isPlayerWin ? 100 : 0,
        oppScore: isPlayerWin ? 0 : 100,
        bannerTitle: isPlayerWin ? '상대 피버콜 시간 초과 (3턴 미완성) - 아군 부전승!' : '아군 피버콜 시간 초과 (3턴 미완성) - 상대 부전승!',
        bannerSub: isPlayerWin ? '상대가 3턴 내에 피버를 완성하지 못해 실격 처리되었습니다.' : '아군이 3턴 내에 피버를 완성하지 못해 실격 처리되었습니다.',
        narrative: isPlayerWin
          ? `상대가 3턴 내에 피버를 완성하지 못해 시간 초과로 실격 패배했습니다! 아군 [${playerSynergy.name}] 피버콜 완성에 따른 완승!`
          : `3턴 내에 아군 피버를 완성하지 못해 시간 초과로 실격 처리되었습니다. 상대 [${oppSynergy.name}] 피버콜 완성에 따른 패배...`,
        icon: isPlayerWin ? '🏆' : '💀'
      };
    } else {
      showdown = resolveFeverShowdown(
        feverBadgesRef.current,
        oppFeverBadgesRef.current,
        playerParty,
        oppParty
      );
    }

    // 🃏 쇼다운 배지 스냅샷 캡처 및 순차 오픈 시퀀스 시작
    const pBadgesSnapshot = [...feverBadgesRef.current];
    const oBadgesSnapshot = [...oppFeverBadgesRef.current];
    setShowdownPlayerBadges(pBadgesSnapshot);
    setShowdownOppBadges(oBadgesSnapshot);
    setShowdownRevealIndex(0);
    setIsShowdownEvaluated(false);

    setShowdownResult(showdown);
    setIsShowdownCutin(true);

    // 📜 피버콜 대결 히스토리 기록 (아레나 리포트 출력용)
    const historyEntry = {
      round: feverCallHistoryRef.current.length + 1,
      playerSynergy: {
        id: showdown.playerSynergy.id,
        name: showdown.playerSynergy.name,
        icon: showdown.playerSynergy.icon,
        summary: showdown.playerSynergy.summary,
      },
      oppSynergy: {
        id: showdown.oppSynergy.id,
        name: showdown.oppSynergy.name,
        icon: showdown.oppSynergy.icon,
        summary: showdown.oppSynergy.summary,
      },
      playerBadges: [...pBadgesSnapshot],
      oppBadges: [...oBadgesSnapshot],
      playerScore: showdown.playerScore,
      oppScore: showdown.oppScore,
      outcome: showdown.outcome,
      isTimeout,
      bannerTitle: showdown.bannerTitle,
    };
    feverCallHistoryRef.current = [...feverCallHistoryRef.current, historyEntry];
    setFeverCallHistory(feverCallHistoryRef.current);

    const isPlayerWin = showdown.outcome === 'player_win';
    const isOppWin = showdown.outcome === 'opp_win';

    // 🏆 피버콜 승리 카운트 갱신
    let newPlayerWins = playerFeverWinsRef.current;
    let newOppWins = oppFeverWinsRef.current;
    if (isPlayerWin) {
      newPlayerWins += 1;
      playerFeverWinsRef.current = newPlayerWins;
      setPlayerFeverWins(newPlayerWins);
    } else if (isOppWin) {
      newOppWins += 1;
      oppFeverWinsRef.current = newOppWins;
      setOppFeverWins(newOppWins);
    }

    const isPlayerDomination = newPlayerWins >= 3;
    const isOppDomination = newOppWins >= 3;

    // 🃏 5개 뱃지 순차적 오픈 타이머 (220ms 간격)
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => {
        if (isBattleEndedRef.current || finalRewardRef.current) return;
        setShowdownRevealIndex(i);
        try {
          SoundManager.getInstance().play(i === 5 ? 'heavy_hit' : 'equip');
        } catch (_) {}
      }, i * 220);
    }

    // ⚡ 5개 배지 전체 오픈 완료 후 1.35초 시점에 족보 확정 및 승자 광채 방출!
    setTimeout(() => {
      if (isBattleEndedRef.current || finalRewardRef.current) return;
      setIsShowdownEvaluated(true);
      try {
        if (isPlayerWin) {
          SoundManager.getInstance().play('boss_skill');
        } else if (isOppWin) {
          SoundManager.getInstance().play('heavy_hit');
        } else {
          SoundManager.getInstance().play('slash');
        }
      } catch (_) {}
    }, 1350);

    // 🎬 3.0초 후: 피버콜 연출 닫힘 ➔ 연출이 사라진 직후 궁극기 연출부터 전투 재개!
    setTimeout(() => {
      if (isBattleEndedRef.current || finalRewardRef.current) return;
      setIsShowdownCutin(false);
      isShowdownCutinRef.current = false;
      setShowdownResult(null);
      setShowdownRevealIndex(0);
      setIsShowdownEvaluated(false);

      // 💥 피버콜 연출이 사라진 직후 2단계 궁극기 연출 폭발 실행!
      executeFeverUltimateAfterShowdown(showdown, isPlayerDomination, isOppDomination);
    }, 3000);
  }, [executeFeverUltimateAfterShowdown]);

  const triggerLeaderUltimate = useCallback(() => {
    if (feverBadgesRef.current.length >= 5 && oppFeverBadgesRef.current.length >= 5) {
      triggerFeverShowdown();
    }
  }, [triggerFeverShowdown]);

  // 💀 적군 리더 궁극기 자동 발동 실행 함수 (피버 쇼다운 통합)
  const triggerOppLeaderUltimate = useCallback(() => {
    if (feverBadgesRef.current.length >= 5 && oppFeverBadgesRef.current.length >= 5) {
      triggerFeverShowdown();
    }
  }, [triggerFeverShowdown]);

  // ── 턴 액션 실행 (광역기 다중 타겟 및 정상 공방 처리) ──────────────────────
  const executeCombatMove = useCallback((attacker: ArenaCombatant, skill: Skill, target: ArenaCombatant) => {
    const opp = activeBattleOppRef.current;
    if (!opp || finalRewardRef.current || isBattleEndedRef.current) return;

    // 공격자 상태 기록
    if (attacker.isPlayer) {
      setLastPlayerAttacker(attacker);
    } else {
      setLastEnemyAttacker(attacker);
    }

    // 1. 쿨다운 1턴씩 감소 & 마나 및 쿨다운 적용
    const nextCooldowns = { ...attacker.cooldowns };
    Object.keys(nextCooldowns).forEach(sid => {
      if (nextCooldowns[sid] > 0) nextCooldowns[sid] -= 1;
    });

    let currentMp = attacker.currentMp;
    if (skill.manaCost > 0) {
      currentMp = Math.max(0, currentMp - skill.manaCost);
    }
    if (skill.cooldown && skill.cooldown > 0) {
      nextCooldowns[skill.id] = skill.cooldown;
    }
    if (skill.id === 'basic_attack') {
      currentMp = Math.min(attacker.maxMp, currentMp + 15);
    }

    // 상태이상 지속시간 감소
    const nextStatusEffects = (attacker.statusEffects || [])
      .map(eff => {
        const curDuration = eff.duration ?? eff.turnsLeft ?? 1;
        const nextDuration = curDuration - 1;
        return { ...eff, turnsLeft: nextDuration, duration: nextDuration };
      })
      .filter(eff => (eff.duration ?? eff.turnsLeft ?? 0) > 0);

    const updatedAttacker: ArenaCombatant = {
      ...attacker,
      currentMp,
      cooldowns: nextCooldowns,
      statusEffects: nextStatusEffects,
    };

    // 2. 광역기(AOE) 판별 및 대상 유닛 목록 선정
    const isAoeAllEnemies = skill.targetType === 'all_enemies';
    const isAoeAllAllies = skill.targetType === 'all_allies';
    const isAoe = isAoeAllEnemies || isAoeAllAllies;

    const currentP = playerTeamRef.current;
    const currentO = oppTeamRef.current;

    let targetUnits: ArenaCombatant[] = [];
    if (isAoeAllEnemies) {
      targetUnits = (attacker.isPlayer ? currentO : currentP).filter(c => c.currentHp > 0);
    } else if (isAoeAllAllies) {
      targetUnits = (attacker.isPlayer ? currentP : currentO).filter(c => c.currentHp > 0);
    } else {
      targetUnits = [target];
    }

    // 3. 데미지 또는 회복 계산
    const ARENA_ATK_SCALE = 0.70; // 긴장감 있는 상호 공방 계수
    const effectiveAtk = attacker.atk * ARENA_ATK_SCALE;
    const isHealing = skill.effectType === 'heal';
    const isShield = skill.effectType === 'shield';

    let totalDamageDealt = 0;
    let anyCrit = false;

    // 각 대상별 결과 계산
    const targetResults: { unitId: string; newHp: number; dmg: number; isCrit: boolean; isHeal: boolean; isShield: boolean; addedEffect?: any }[] = [];

    targetUnits.forEach((t) => {
      if (isHealing) {
        const healAmt = Math.round(effectiveAtk * (skill.power || 1.0) * 1.4);
        const addedEffect = skill.effectType === 'regen' ? {
          id: `eff_${Date.now()}_regen_${t.id}`,
          type: 'regen',
          name: '재생',
          icon: '🌱',
          duration: skill.statusDuration || 2,
          value: Math.round(healAmt * 0.3)
        } : undefined;
        targetResults.push({
          unitId: t.id,
          newHp: Math.min(t.maxHp, t.currentHp + healAmt),
          dmg: healAmt,
          isCrit: false,
          isHeal: true,
          isShield: false,
          addedEffect
        });
      } else if (isShield) {
        const shieldAmt = Math.round(effectiveAtk * 0.8);
        targetResults.push({
          unitId: t.id,
          newHp: t.currentHp,
          dmg: shieldAmt,
          isCrit: false,
          isHeal: false,
          isShield: true,
          addedEffect: {
            id: `eff_${Date.now()}_shield_${t.id}`,
            type: 'shield',
            name: '보호막',
            icon: '🛡️',
            duration: skill.statusDuration || 2,
            value: shieldAmt
          }
        });
      } else if (skill.effectType === 'buff') {
        const buffType = skill.name.includes('방어') ? 'buff_def' : 'buff_atk';
        targetResults.push({
          unitId: t.id,
          newHp: t.currentHp,
          dmg: 0,
          isCrit: false,
          isHeal: false,
          isShield: false,
          addedEffect: {
            id: `eff_${Date.now()}_buff_${t.id}`,
            type: buffType,
            name: skill.name,
            icon: buffType === 'buff_def' ? '🛡️' : '⚔️',
            duration: skill.statusDuration || 2,
            value: 0.25
          }
        });
      } else {
        // 💨 회피 (Dodge / Evade) 판정
        const evadeChance = Math.min(0.25, Math.max(0.04, (t.spd * 0.001) + (t.luck * 0.001)));
        const isEvaded = Math.random() < evadeChance;
        if (isEvaded) {
          if (combatMetricsRef.current[t.id]) {
            combatMetricsRef.current[t.id].dodges += 1;
          }
          targetResults.push({
            unitId: t.id,
            newHp: t.currentHp,
            dmg: 0,
            isCrit: false,
            isHeal: false,
            isShield: false,
            isEvade: true,
          } as any);
          return;
        }

        const magicSchool = getSkillMagicSchool(skill);
        let critChance = Math.min(0.75, (gm.getCritChance(attacker.luck, 1) / 100));
        if (magicSchool === 'holy') {
          critChance = Math.min(1.0, critChance + 0.30); // ✨ 신성: 치명타 확률 30% 상승
        }
        const isCrit = Math.random() < critChance;
        if (isCrit) anyCrit = true;

        let effectiveDef = t.def * ARENA_DEF_SCALE; // 🛡️ 방어력 50% 너프 적용
        if (magicSchool === 'dark') {
          effectiveDef = effectiveDef * 0.80; // 🔮 암흑: 기본 방어 관통 20%
        }
        const defFactor = 1 - (effectiveDef / (effectiveDef + getArenaDRConstant()));
        let rawDmg = effectiveAtk * (skill.power || 1.0) * defFactor * (0.95 + Math.random() * 0.12);
        if (magicSchool === 'dark') {
          rawDmg = rawDmg * 1.20; // 🔮 암흑: 용병(PvP) 대상 20% 추가 데미지
        }
        const minDmg = Math.max(15, Math.floor(effectiveAtk * 0.25));
        let dmg = Math.max(minDmg, Math.floor(rawDmg * (isCrit ? 1.5 : 1.0)));

        // 🛡️ [서포터 원호 방어 (Assist Guard)]
        // 방어자 측 후방 서포터가 원호 방어 전개 (치명타 피격 시 또는 35% 확률, 생존 시에만 발동)
        const defSupporter = t.isPlayer ? playerSupporterRef.current : oppSupporterRef.current;
        const isDefSupporterAlive = defSupporter && (defSupporter.currentHp === undefined || defSupporter.currentHp > 0) && !defSupporter.isDead;
        let isAssistGuarded = false;
        if (isDefSupporterAlive && (isCrit || Math.random() < 0.35)) {
          const guardReduction = 0.50; // 원호 데미지 50%로 조정 (50% 경감 및 50% 분담)
          const blockedDmg = Math.floor(dmg * guardReduction);
          dmg = Math.max(10, dmg - blockedDmg);
          isAssistGuarded = true;

          const defSuppId = t.isPlayer ? defSupporter.id : 'opp_supporter';
          if (combatMetricsRef.current[defSuppId]) {
            combatMetricsRef.current[defSuppId].actionsCount = (combatMetricsRef.current[defSuppId].actionsCount || 0) + 1;
            const suppDef = (defSupporter as any).def || 50;
            const suppTakenDmg = Math.max(1, Math.round(blockedDmg * (100 / (100 + suppDef * ARENA_DEF_SCALE))));
            combatMetricsRef.current[defSuppId].damageTaken = (combatMetricsRef.current[defSuppId].damageTaken || 0) + suppTakenDmg;
            if (defSupporter.currentHp !== undefined) {
              defSupporter.currentHp = Math.max(0, defSupporter.currentHp - suppTakenDmg);
              if (defSupporter.currentHp <= 0) {
                defSupporter.isDead = true;
              }
            }
          }
        }

        // 암살자 고유 추가타
        if (attacker.classId === 'assassin' && isCrit) {
          const extraRate = Math.min(0.80, 0.30 + (attacker.luck || 0) * 0.0025);
          if (Math.random() < extraRate) {
            const extraDmg = Math.max(10, Math.floor(effectiveAtk * 0.70 * defFactor));
            dmg += extraDmg;
          }
        }

        // 상태이상 부여 검사
        let addedEffect: any = undefined;
        if (skill.effectType === 'burn') {
          addedEffect = { id: `eff_${Date.now()}_burn_${t.id}`, type: 'burn', name: '화상', icon: '🔥', duration: skill.statusDuration || 2, value: Math.round(effectiveAtk * 0.2) };
        } else if (skill.effectType === 'bleed') {
          addedEffect = { id: `eff_${Date.now()}_bleed_${t.id}`, type: 'bleed', name: '출혈', icon: '🩸', duration: skill.statusDuration || 2, value: Math.round(effectiveAtk * 0.25) };
        } else if (skill.effectType === 'stun') {
          addedEffect = { id: `eff_${Date.now()}_stun_${t.id}`, type: 'stun', name: '기절', icon: '⚡', duration: skill.statusDuration || 1 };
        } else if (skill.effectType === 'freeze') {
          addedEffect = { id: `eff_${Date.now()}_freeze_${t.id}`, type: 'freeze', name: '빙결', icon: '❄️', duration: skill.statusDuration || 1 };
        } else if (skill.effectType === 'poison') {
          addedEffect = { id: `eff_${Date.now()}_poison_${t.id}`, type: 'poison', name: '중독', icon: '🧪', duration: skill.statusDuration || 2, value: Math.round(effectiveAtk * 0.2) };
        } else if (skill.effectType === 'blind') {
          addedEffect = { id: `eff_${Date.now()}_blind_${t.id}`, type: 'blind', name: '실명', icon: '👁️', duration: skill.statusDuration || 2 };
        } else if (skill.effectType === 'debuff_atk') {
          addedEffect = { id: `eff_${Date.now()}_datk_${t.id}`, type: 'debuff_atk', name: '공격력 약화', icon: '📉', duration: skill.statusDuration || 2 };
        } else if (skill.effectType === 'debuff_def') {
          addedEffect = { id: `eff_${Date.now()}_ddef_${t.id}`, type: 'debuff_def', name: '방어력 약화', icon: '💔', duration: skill.statusDuration || 2 };
        } else if (skill.effectType === 'debuff') {
          addedEffect = { id: `eff_${Date.now()}_debuff_${t.id}`, type: 'debuff', name: '약화', icon: '💀', duration: skill.statusDuration || 2 };
        } else if (magicSchool === 'elemental') {
          // 🔮 원소 마법: 해당 원소 상태 이상 추가 부여
          const elem = getElementalSubtype(skill);
          if (elem === 'fire') {
            addedEffect = { id: `eff_${Date.now()}_burn_${t.id}`, type: 'burn', name: '화상', icon: '🔥', duration: 2, value: Math.round(effectiveAtk * 0.2) };
          } else if (elem === 'ice') {
            addedEffect = { id: `eff_${Date.now()}_freeze_${t.id}`, type: 'freeze', name: '빙결', icon: '❄️', duration: 1 };
          } else if (elem === 'lightning') {
            addedEffect = { id: `eff_${Date.now()}_stun_${t.id}`, type: 'stun', name: '기절', icon: '⚡', duration: 1 };
          }
        }

        totalDamageDealt += dmg;
        targetResults.push({
          unitId: t.id,
          newHp: Math.max(0, t.currentHp - dmg),
          dmg,
          isCrit,
          isHeal: false,
          isShield: false,
          isAssistGuarded,
          addedEffect,
        } as any);
      }
    });

    // 📊 딜미터기 메트릭스 업데이트
    const mRef = combatMetricsRef.current;
    const mAttacker = mRef[attacker.id];
    if (mAttacker) {
      mAttacker.actionsCount = (mAttacker.actionsCount || 0) + 1;
      if (isHealing || isShield) {
        mAttacker.healingDone += totalDamageDealt;
      } else {
        mAttacker.damageDealt += totalDamageDealt;
      }
      if (anyCrit) mAttacker.critCount += 1;
      if (skill.effectType && ['burn', 'bleed', 'stun', 'freeze', 'debuff'].includes(skill.effectType)) {
        mRef[attacker.id].combosTriggered += 1;
      }
    }

    targetResults.forEach(res => {
      if (mRef[res.unitId]) {
        if (!res.isHeal && !res.isShield && !(res as any).isEvade) {
          mRef[res.unitId].damageTaken += res.dmg;
          if (res.newHp <= 0 && (currentP.find(c => c.id === res.unitId)?.currentHp! > 0 || currentO.find(c => c.id === res.unitId)?.currentHp! > 0)) {
            if (mRef[attacker.id]) mRef[attacker.id].kills += 1;
          }
        }
      }
    });

    // 4. 피버 뱃지 적립 (동등한 조건으로 아군 및 적군 모두 적립)
    const allySide = attacker.isPlayer ? currentP : currentO;
    const livingAlliesCount = allySide.filter(c => c.id !== attacker.id && c.currentHp > 0 && !c.isPermanentlyDead && c.deathCountdown === undefined).length;

    if (attacker.isPlayer) {
      if (isHealing) addFeverBadge('heal');
      else if (isShield) addFeverBadge('guard');
      else if (anyCrit) addFeverBadge('crit');
      else if (skill.id !== 'basic_attack') addFeverBadge('extra');
      else if (livingAlliesCount > 0) addFeverBadge('assist');
      else addFeverBadge('break');
    } else {
      if (isHealing) addOppFeverBadge('heal');
      else if (isShield) addOppFeverBadge('guard');
      else if (anyCrit) addOppFeverBadge('crit');
      else if (skill.id !== 'basic_attack') addOppFeverBadge('extra');
      else if (livingAlliesCount > 0) addOppFeverBadge('assist');
      else addOppFeverBadge('break');
    }

    // 5. 던전처럼 각 타겟의 패널 카드 위에 개별 VFX 동시/시차 폭발 연출
    targetResults.forEach((res, i) => {
      const tgt = targetUnits.find(u => u.id === res.unitId);
      if (!tgt) return;

      const sideTeam = tgt.isPlayer ? currentP : currentO;
      const tIdx = Math.max(0, sideTeam.findIndex(c => c.id === tgt.id));
      const colX = tIdx === 0 ? 20 : tIdx === 1 ? 50 : 80;
      const rowY = tgt.isPlayer ? 74 : 24;

      setTimeout(() => {
        const vfxId = `vfx_${Date.now()}_${tgt.id}_${i}`;
        if ((res as any).isEvade) {
          if (tgt.isPlayer) addFeverBadge('evade');
          else addOppFeverBadge('evade');
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: 'evade',
            text: '💨 EVADE',
            x: colX,
            y: rowY,
            duration: 450,
          }]);
          SoundManager.getInstance().play('evade');
        } else if (res.isHeal) {
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: 'holy_heal',
            damage: res.dmg,
            isHeal: true,
            x: colX,
            y: rowY,
            duration: 550,
          }]);
        } else if (res.isShield) {
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: 'shield',
            isShield: true,
            x: colX,
            y: rowY,
            duration: 550,
          }]);
        } else {
          const vfxType = res.isCrit ? 'crit_slash' : (skill.icon === '🔥' ? 'fire' : skill.icon === '❄️' ? 'ice' : 'slash');
          setVfxList(prev => [...prev, {
            id: vfxId,
            type: vfxType,
            damage: res.dmg,
            isCrit: res.isCrit,
            x: colX,
            y: rowY,
            duration: 550,
          }]);
          gm.emit('battleHitEffect', {
            x: colX,
            y: rowY,
            color: attacker.isPlayer ? 0x00d2ff : 0xff416c,
            isCrit: res.isCrit,
            type: vfxType,
          });
        }
      }, isAoe ? i * 70 : 0);
    });

    try {
      if (isHealing) SoundManager.getInstance().play('heal');
      else if (isShield) SoundManager.getInstance().play('shield');
      else SoundManager.getInstance().play(anyCrit ? 'crit' : 'slash');
    } catch (_) {}

    // 6. 전투 로그 및 배너 기록
    const targetNames = targetUnits.map(u => u.name).join(', ');
    const logItem: CombatLogItem = {
      round: battleRound,
      attacker: attacker.name,
      defender: isAoe ? `${targetUnits.length}명 전체` : target.name,
      damage: totalDamageDealt,
      isCrit: anyCrit,
      skillName: skill.name,
      side: attacker.isPlayer ? 'player' : 'enemy',
    };
    setBattleLogs(prev => [logItem, ...prev.slice(0, 19)]);

    setActionBanner({
      text: `${attacker.name} ➔ ${skill.name} ${isAoe ? '[광역 전체기]' : ''}`,
      sub: isHealing
        ? `❤️ ${targetNames} 회복!`
        : `💥 ${isAoe ? `${targetUnits.length}인에게 총 -${totalDamageDealt} 피해` : `${target.name}에게 -${totalDamageDealt} 피해`} ${anyCrit ? '[CRIT!]' : ''}`,
      color: attacker.isPlayer ? '#00d2ff' : '#ff416c',
    });

    // 7. 팀 상태 동기화 (최신 ref 기반)
    let nextP = currentP.map(c => {
      const res = targetResults.find(r => r.unitId === c.id);
      const isAttacker = c.id === updatedAttacker.id;
      const base = isAttacker ? updatedAttacker : c;
      if (res) {
        const effects = [...(base.statusEffects || [])];
        if (res.addedEffect) effects.push(res.addedEffect);
        let deathCountdown = base.deathCountdown;
        let isDead = base.isDead;
        let isPermanentlyDead = base.isPermanentlyDead;

        if (res.newHp <= 0) {
          if (deathCountdown === undefined && !isPermanentlyDead) {
            deathCountdown = 3;
            isDead = true;
            const tIdx = Math.max(0, currentP.findIndex(u => u.id === c.id));
            const colX = tIdx === 0 ? 20 : tIdx === 1 ? 50 : 80;
            const rowY = 74;
            setTimeout(() => {
              setVfxList(prev => [...prev, {
                id: `death_door_${Date.now()}_${c.id}`,
                type: 'status_bleed',
                damage: 0,
                text: '💀 사경 위기 (3턴)!',
                x: colX,
                y: rowY,
                duration: 750,
              }]);
              SoundManager.getInstance().play('defeat');
            }, 300);
            gm.addLog(`💀 [사경 위기] 아군 ${c.name} 대원이 치명상을 입고 쓰러져 사경을 헤맵니다! (3턴 유예)`, 'danger');
          }
        } else if (res.newHp > 0 && (deathCountdown !== undefined || isDead)) {
          deathCountdown = undefined;
          isDead = false;
        }

        return { ...base, currentHp: res.newHp, statusEffects: effects, deathCountdown, isDead, isPermanentlyDead };
      }
      return base;
    });

    let nextO = currentO.map(c => {
      const res = targetResults.find(r => r.unitId === c.id);
      const isAttacker = c.id === updatedAttacker.id;
      const base = isAttacker ? updatedAttacker : c;
      if (res) {
        const effects = [...(base.statusEffects || [])];
        if (res.addedEffect) effects.push(res.addedEffect);
        let deathCountdown = base.deathCountdown;
        let isDead = base.isDead;
        let isPermanentlyDead = base.isPermanentlyDead;

        if (res.newHp <= 0) {
          if (deathCountdown === undefined && !isPermanentlyDead) {
            deathCountdown = 3;
            isDead = true;
            const tIdx = Math.max(0, currentO.findIndex(u => u.id === c.id));
            const colX = tIdx === 0 ? 20 : tIdx === 1 ? 50 : 80;
            const rowY = 24;
            setTimeout(() => {
              setVfxList(prev => [...prev, {
                id: `death_door_${Date.now()}_${c.id}`,
                type: 'status_bleed',
                damage: 0,
                text: '💀 사경 위기 (3턴)!',
                x: colX,
                y: rowY,
                duration: 750,
              }]);
              SoundManager.getInstance().play('defeat');
            }, 300);
            gm.addLog(`💀 [사경 위기] 적군 ${c.name}이(가) 치명상을 입고 쓰러져 사경을 헤맵니다! (3턴 유예)`, 'normal');
          }
        } else if (res.newHp > 0 && (deathCountdown !== undefined || isDead)) {
          deathCountdown = undefined;
          isDead = false;
        }

        return { ...base, currentHp: res.newHp, statusEffects: effects, deathCountdown, isDead, isPermanentlyDead };
      }
      return base;
    });

    // ⚔️/💖 [서포터 전술 원호: 원호 추가타 or 원호 치유]
    // 공격자 측 서포터가 40% 확률로 후방 지원 발동 (생존 시에만 발동, 힐러는 아군 치유, 딜러/탱커는 추가타)
    const atkSupporter = attacker.isPlayer ? playerSupporterRef.current : oppSupporterRef.current;
    const isAtkSupporterAlive = atkSupporter && (atkSupporter.currentHp === undefined || atkSupporter.currentHp > 0) && !atkSupporter.isDead;
    if (!isBattleEndedRef.current && isAtkSupporterAlive && Math.random() < 0.40) {
      const suppCls = CHARACTER_CLASSES[atkSupporter.classId] || CHARACTER_CLASSES['squire'];
      const isHealer = suppCls.role === 'healer' || suppCls.skills.some(s => s.effectType === 'heal');
      const suppEff = attacker.isPlayer
        ? gm.getHeroEffectiveStats(atkSupporter)
        : {
            atk: Math.round(((suppCls.baseStats.atk * 1.5 + (atkSupporter.level || 10) * 5) * Math.max(1.0, (activeBattleOppRef.current?.rating || 1000) / 1000))),
            def: Math.round(suppCls.baseStats.def * 1.2),
            maxHp: Math.round(suppCls.baseStats.hp * 2.0)
          };

      const suppMetricId = attacker.isPlayer ? atkSupporter.id : 'opp_supporter';
      if (isHealer) {
        // 💖 원호 치유: 체력 비율 가장 낮은 아군 회복
        const allyTeam = attacker.isPlayer ? nextP : nextO;
        const livingAllies = allyTeam.filter(c => c.currentHp > 0);
        if (livingAllies.length > 0) {
          const sortedAllies = [...livingAllies].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
          const healTarget = sortedAllies[0];
          const healAmt = Math.round(suppEff.atk * 0.9 * 1.3);
          healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + healAmt);

          const aIdx = Math.max(0, allyTeam.findIndex(c => c.id === healTarget.id));
          const colX = aIdx === 0 ? 20 : aIdx === 1 ? 50 : 80;
          const rowY = healTarget.isPlayer ? 74 : 24;

          setTimeout(() => {
            if (isBattleEndedRef.current || finalRewardRef.current) return;
            setVfxList(prev => [...prev, {
              id: `supp_assist_heal_${Date.now()}`,
              type: 'holy_heal',
              text: `+${healAmt} 💖 원호 치유`,
              damage: 0,
              isHeal: true,
              x: colX,
              y: rowY,
              duration: 550,
            }]);
            SoundManager.getInstance().play('heal');
          }, 300);

          if (attacker.isPlayer) addFeverBadge('heal');
          else addOppFeverBadge('heal');

          if (mRef[suppMetricId]) {
            mRef[suppMetricId].healingDone += healAmt;
            mRef[suppMetricId].actionsCount = (mRef[suppMetricId].actionsCount || 0) + 1;
          }
        }
      } else {
        // ⚔️ 원호 추가타: 타겟에게 추가 타격
        const mainTarget = targetUnits.find(u => u.currentHp > 0) || target;
        const targetSide = mainTarget.isPlayer ? nextP : nextO;
        const liveTarget = targetSide.find(c => c.id === mainTarget.id);
        if (liveTarget && liveTarget.currentHp > 0) {
          const rawAssistDmg = Math.max(20, Math.round(suppEff.atk * 0.65));
          const effectiveDef = liveTarget.def * ARENA_DEF_SCALE; // 🛡️ 방어력 50% 너프 적용
          const assistDmg = Math.max(10, Math.floor(rawAssistDmg * (1 - (effectiveDef / (effectiveDef + getArenaDRConstant())))));
          liveTarget.currentHp = Math.max(0, liveTarget.currentHp - assistDmg);

          const tIdx = Math.max(0, targetSide.findIndex(c => c.id === liveTarget.id));
          const colX = tIdx === 0 ? 20 : tIdx === 1 ? 50 : 80;
          const rowY = liveTarget.isPlayer ? 74 : 24;

          setTimeout(() => {
            if (isBattleEndedRef.current || finalRewardRef.current) return;
            setVfxList(prev => [...prev, {
              id: `supp_assist_strike_${Date.now()}`,
              type: 'crit_slash',
              damage: assistDmg,
              text: `-${assistDmg} 💥 원호 추가타`,
              x: colX,
              y: rowY,
              duration: 500,
            }]);
            SoundManager.getInstance().play('heavy_hit');
          }, 300);

          if (attacker.isPlayer) addFeverBadge('assist');
          else addOppFeverBadge('assist');

          if (mRef[suppMetricId]) {
            mRef[suppMetricId].damageDealt += assistDmg;
            mRef[suppMetricId].actionsCount = (mRef[suppMetricId].actionsCount || 0) + 1;
            if (liveTarget.currentHp <= 0) mRef[suppMetricId].kills += 1;
          }
        }
      }
    }

    // 팀 상태 동기화 (난입 없이 3선발 그대로 유지)
    playerTeamRef.current = nextP;
    oppTeamRef.current = nextO;
    setPlayerTeam(nextP);
    setOppTeam(nextO);

    // 8. ⚔️ [핵심 룰] 피버콜(Fever Call) 발동 및 3턴 유예 타임아웃 검사:
    if (feverBadgesRef.current.length >= 5 && oppFeverBadgesRef.current.length >= 5) {
      setTimeout(() => {
        if (isBattleEndedRef.current || finalRewardRef.current) return;
        triggerFeverShowdown(false);
      }, 400);
    } else if (feverCallLeadRef.current !== null && !isShowdownCutinRef.current) {
      feverCallCountdownRef.current -= 1;
      const remainTurns = feverCallCountdownRef.current;
      setFeverCallCountdown(remainTurns);
      if (remainTurns <= 0) {
        // 3턴 타임아웃 만료! 미완성 측 실격 패배, 선언 측 부전승!
        const winner = feverCallLeadRef.current;
        feverCallLeadRef.current = null;
        setFeverCallLead(null);
        feverCallCountdownRef.current = 3;
        setFeverCallCountdown(3);
        setTimeout(() => {
          if (isBattleEndedRef.current || finalRewardRef.current) return;
          triggerFeverShowdown(true, winner);
        }, 400);
      }
    }

    // 9. 승패 검증 (즉시 결과창 팝업)
    // 💀 마지막 남은 용병이 사경에 돌입(currentHp <= 0)하면 그 즉시 패배!
    const pLiving = nextP.filter(c => c.currentHp > 0);
    const oLiving = nextO.filter(c => c.currentHp > 0);

    if (oLiving.length === 0 || pLiving.length === 0) {
      finishBattle(oLiving.length === 0);
      return;
    }

    // 타겟 사망 시 다음 적 자동 타겟팅
    const activeTargetDied = targetResults.some(r => r.unitId === targetEnemyIdRef.current && r.newHp <= 0);
    if (activeTargetDied) {
      const nextTarget = oLiving[0];
      if (nextTarget) {
        targetEnemyIdRef.current = nextTarget.id;
        setTargetEnemyId(nextTarget.id);
      }
    }

    // 10. 🏃 속도(SPD) 기반 정통 턴제 순서 전진
    // 현재 활성 유닛(생존자 + 사경 유예자)들로 큐 필터링
    const isUnitActive = (c: ArenaCombatant) => !c.isPermanentlyDead && (c.currentHp > 0 || (c.deathCountdown !== undefined && c.deathCountdown > 0));
    const currentQueue = roundQueueRef.current.filter(id => {
      const u = [...nextP, ...nextO].find(c => c.id === id);
      return u && isUnitActive(u);
    });

    const curIdx = currentQueue.indexOf(attacker.id);
    let nextId: string | null = null;

    if (curIdx >= 0 && curIdx < currentQueue.length - 1) {
      // 이번 라운드에 아직 행동하지 않은 다음 속도 순위 유닛
      nextId = currentQueue[curIdx + 1];
      roundQueueRef.current = currentQueue;
    } else {
      // 라운드 종료! 새 라운드 시작 -> 활성 참가자 전원을 spd 순으로 재정렬
      setBattleRound(r => r + 1);
      const allActive = [...nextP, ...nextO].filter(isUnitActive);
      const sortedNew = allActive.sort((a, b) => b.spd - a.spd || b.luck - a.luck);
      const newQueue = sortedNew.map(c => c.id);
      roundQueueRef.current = newQueue;
      setRoundQueue(newQueue);
      nextId = newQueue[0] || null;
    }

    activeCombatantIdRef.current = nextId;
    setActiveCombatantId(nextId);
    setTurnTick(t => t + 1);
  }, [battleRound, gm, addFeverBadge, addOppFeverBadge, triggerLeaderUltimate, triggerOppLeaderUltimate, finishBattle]);

  // ── 턴 자동 진행 루프 (스킬 연계 최우선 콤보 AI & Auto Battle) ──────────────────────────────
  useEffect(() => {
    // ⏸️ 피버콜 쇼다운 진행 중이거나 궁극기 컷인 연출 중일 때는 전투 완전 일시 정지!
    if (isBattleEndedRef.current || !activeBattleOpp || finalReward || !activeCombatantId || isShowdownCutin || isLeaderUltCutin || isOppLeaderUltCutin) return;
    if (isProcessingRef.current) return;

    const pTeam = playerTeamRef.current;
    const oTeam = oppTeamRef.current;
    const pLiving = pTeam.filter(c => c.currentHp > 0);
    const oLiving = oTeam.filter(c => c.currentHp > 0);
    if (pLiving.length === 0 || oLiving.length === 0) {
      finishBattle(oLiving.length === 0);
      return;
    }

    const isUnitActive = (c: ArenaCombatant) => !c.isPermanentlyDead && (c.currentHp > 0 || (c.deathCountdown !== undefined && c.deathCountdown > 0));
    const allActive = [...pTeam, ...oTeam].filter(isUnitActive);
    if (allActive.length === 0) return;

    const currentAttacker = allActive.find(c => c.id === activeCombatantId);
    if (!currentAttacker) {
      const fallback = allActive[0];
      if (fallback) {
        activeCombatantIdRef.current = fallback.id;
        setActiveCombatantId(fallback.id);
      }
      return;
    }

    // 💀 [사경(Death's Door) 턴 처리]: 체력이 0 이하인 영웅의 사경 헤맴 연출 및 카운트다운
    if (currentAttacker.currentHp <= 0 && currentAttacker.deathCountdown !== undefined && currentAttacker.deathCountdown > 0) {
      isProcessingRef.current = true;
      const delay = battleSpeed === 2 ? 400 : 750;

      const dyingTimer = setTimeout(() => {
        try {
          if (!activeBattleOppRef.current || finalRewardRef.current || isBattleEndedRef.current) return;
          const side = currentAttacker.isPlayer ? playerTeamRef.current : oppTeamRef.current;
          const me = side.find(c => c.id === currentAttacker.id);
          if (!me) return;

          me.deathCountdown = (me.deathCountdown || 1) - 1;
          const remaining = me.deathCountdown;
          const tIdx = Math.max(0, side.findIndex(c => c.id === me.id));
          const colX = tIdx === 0 ? 20 : tIdx === 1 ? 50 : 80;
          const rowY = me.isPlayer ? 74 : 24;

          if (remaining <= 0) {
            me.isPermanentlyDead = true;
            me.deathCountdown = 0;
            me.isDead = true;
            setVfxList(prev => [...prev, {
              id: `dead_vfx_${Date.now()}_${me.id}`,
              type: 'status_stun',
              damage: 0,
              text: '⚰️ 완전 사망',
              x: colX,
              y: rowY,
              duration: 900,
            }]);
            SoundManager.getInstance().play('defeat');
            gm.addLog(`⚰️ [영면] ${me.name}이(가) 3턴간의 사경 끝에 완전히 전사했습니다...`, me.isPlayer ? 'danger' : 'reward');
          } else {
            setVfxList(prev => [...prev, {
              id: `dying_vfx_${Date.now()}_${me.id}`,
              type: 'status_bleed',
              damage: 0,
              text: `💀 사경 헤맴 (${remaining}턴)`,
              x: colX,
              y: rowY,
              duration: 800,
            }]);
            SoundManager.getInstance().play('hero_hurt');
            gm.addLog(`💀 [사경 헤맴] ${me.name}이(가) 위독한 상태로 사경을 헤매고 있습니다! (완전 사망까지 ${remaining}턴)`, me.isPlayer ? 'danger' : 'normal');
          }

          if (currentAttacker.isPlayer) {
            setPlayerTeam([...playerTeamRef.current]);
          } else {
            setOppTeam([...oppTeamRef.current]);
          }

          // 턴 큐 전진
          const curQ = roundQueueRef.current.filter(id => {
            const u = [...playerTeamRef.current, ...oppTeamRef.current].find(c => c.id === id);
            return u && isUnitActive(u);
          });
          const cIdx = curQ.indexOf(me.id);
          let nxtId: string | null = null;
          if (cIdx >= 0 && cIdx < curQ.length - 1) {
            nxtId = curQ[cIdx + 1];
            roundQueueRef.current = curQ;
          } else {
            setBattleRound(r => r + 1);
            const allActiveAfter = [...playerTeamRef.current, ...oppTeamRef.current].filter(isUnitActive);
            const sortedNew = allActiveAfter.sort((a, b) => b.spd - a.spd || b.luck - a.luck);
            const newQ = sortedNew.map(c => c.id);
            roundQueueRef.current = newQ;
            setRoundQueue(newQ);
            nxtId = newQ[0] || null;
          }

          // 승패 확인 (생존자가 없는 팀 즉시 패배)
          const pLiving = playerTeamRef.current.filter(c => c.currentHp > 0);
          const oLiving = oppTeamRef.current.filter(c => c.currentHp > 0);
          if (oLiving.length === 0 || pLiving.length === 0) {
            finishBattle(oLiving.length === 0);
            return;
          }

          activeCombatantIdRef.current = nxtId;
          setActiveCombatantId(nxtId);
          setTurnTick(t => t + 1);
        } finally {
          if (!isBattleEndedRef.current) {
            isProcessingRef.current = false;
          }
        }
      }, delay);
      return () => clearTimeout(dyingTimer);
    }

    // 수동 모드이고 플레이어 턴인 경우: 플레이어 스킬 입력 대기
    if (currentAttacker.isPlayer && !isAuto) {
      return;
    }

    isProcessingRef.current = true;
    const delay = battleSpeed === 2 ? 320 : 600;

    const timer = setTimeout(() => {
      try {
        if (!activeBattleOppRef.current || finalRewardRef.current || isBattleEndedRef.current) return;

        const latestP = playerTeamRef.current;
        const latestO = oppTeamRef.current;
        const living = [...latestP, ...latestO].filter(c => c.currentHp > 0);
        const attacker = living.find(c => c.id === activeCombatantIdRef.current);
        if (!attacker) {
          const fallback = living[0];
          if (fallback) {
            activeCombatantIdRef.current = fallback.id;
            setActiveCombatantId(fallback.id);
          }
          return;
        }

        // 🧠 스킬 연계 최우선 알고리즘 (Combo Chain AI)
        // 1. 사용 가능한 스킬 목록 추출
        const availableSkills = attacker.skills.filter(s => {
          const cd = attacker.cooldowns[s.id] || 0;
          return cd <= 0 && attacker.currentMp >= s.manaCost;
        });

        // 2. 가중치 점수 평가
        const allyTeam = attacker.isPlayer ? latestP : latestO;
        const enemyTeam = attacker.isPlayer ? latestO : latestP;
        const allyLiving = allyTeam.filter(c => c.currentHp > 0);
        const enemyLiving = enemyTeam.filter(c => c.currentHp > 0);
        const lowestAllyHpRatio = allyLiving.length > 0
          ? Math.min(...allyLiving.map(c => c.currentHp / c.maxHp))
          : 1.0;

        let bestSkill = attacker.skills[0];
        let bestScore = -999;

        for (const s of availableSkills) {
          let score = (s.power || 1.0) * 10;

          // 치유/보호막 우선 판정 (아군 위급 시 가산점)
          if (s.effectType === 'heal' || s.effectType === 'shield') {
            if (lowestAllyHpRatio < 0.40) score += 60; // 초위급 시 힐 최우선
            else if (lowestAllyHpRatio < 0.70) score += 25;
            else score -= 15; // 체력 충분할 때 힐 낭비 방지
          }

          // 상태이상 연계 셋업 및 피니셔 가산점
          if (s.effectType === 'bleed' || s.effectType === 'stun' || s.effectType === 'burn' || s.effectType === 'freeze' || s.effectType === 'debuff') {
            score += 35; // 선제 디버프/셋업 유도
          }

          // 적 빈사 시 고위력 피니셔 스킬 우선
          const hasDyingEnemy = enemyLiving.some(e => (e.currentHp / e.maxHp) < 0.35);
          if (hasDyingEnemy && s.effectType === 'damage') {
            score += (s.power || 1.0) * 20;
          }

          // 기본 공격은 MP 없을 때만
          if (s.id === 'basic_attack') {
            score = 5;
          }

          if (score > bestScore) {
            bestScore = score;
            bestSkill = s;
          }
        }

        const selectedSkill = bestSkill;

        // 3. 타겟 선택 (스킬 목적에 따른 스마트 타겟팅)
        const isAllySkill = selectedSkill.effectType === 'heal' || selectedSkill.effectType === 'shield' || selectedSkill.effectType === 'buff';
        let selectedTarget: ArenaCombatant | undefined;

        if (attacker.isPlayer) {
          if (isAllySkill) {
            selectedTarget = [...allyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || attacker;
          } else {
            // 유저가 찍은 타겟이 있으면 우선, 없으면 적 중 가장 체력 비율이 낮은 적(점사 피니시)
            selectedTarget = enemyLiving.find(c => c.id === targetEnemyIdRef.current)
              || [...enemyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0];
          }
        } else {
          if (isAllySkill) {
            selectedTarget = [...allyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || attacker;
          } else {
            // 적 AI: 아군 중 가장 체력이 적은 대상을 집중 점사 (스킬 연계 마무리)
            selectedTarget = [...enemyLiving].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || enemyLiving[0];
          }
        }

        if (attacker && selectedSkill && selectedTarget) {
          executeCombatMove(attacker, selectedSkill, selectedTarget);
        }
      } finally {
        if (!isBattleEndedRef.current) {
          isProcessingRef.current = false;
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [activeBattleOpp, finalReward, activeCombatantId, isAuto, battleSpeed, turnTick, isShowdownCutin, isLeaderUltCutin, isOppLeaderUltCutin, executeCombatMove, finishBattle]);

  // 🛡️ [아레나 멈춤 방지 워치독]: 만약 2.5초 이상 턴이 멈춰 있으면 강제 복구 및 다음 턴 진행
  useEffect(() => {
    // ⏸️ 피버콜 쇼다운 진행 중이거나 궁극기 연출 중일 때는 워치독 개입 금지
    if (isBattleEndedRef.current || !activeBattleOpp || finalReward || !activeCombatantId || isShowdownCutin || isLeaderUltCutin || isOppLeaderUltCutin) return;
    const watchdog = setTimeout(() => {
      if (isBattleEndedRef.current || finalRewardRef.current) return;
      if (isProcessingRef.current) {
        console.warn('⚠️ [아레나 멈춤 방지 워치독] 2.5초간 응답 없음 감지 -> 강제 플래그 해제 및 턴 진행');
        isProcessingRef.current = false;
        const living = [...playerTeamRef.current, ...oppTeamRef.current].filter(c => c.currentHp > 0);
        if (living.length > 0) {
          const curIdx = living.findIndex(c => c.id === activeCombatantIdRef.current);
          const next = living[(curIdx + 1) % living.length];
          if (next) {
            activeCombatantIdRef.current = next.id;
            setActiveCombatantId(next.id);
            setTurnTick(t => t + 1);
          }
        }
      }
    }, 2500);
    return () => clearTimeout(watchdog);
  }, [activeBattleOpp, finalReward, activeCombatantId, turnTick, isShowdownCutin, isLeaderUltCutin, isOppLeaderUltCutin]);

  // ── ⏩ 즉시 결과 확인 (Skip) ──────────────────────────────────────────────
  const handleInstantSkip = () => {
    if (isBattleEndedRef.current || !activeBattleOpp || finalReward) return;
    isProcessingRef.current = false;

    let pTeam = [...playerTeamRef.current];
    let oTeam = [...oppTeamRef.current];
    let maxTurns = 40;

    while (maxTurns > 0 && pTeam.some(c => c.currentHp > 0) && oTeam.some(c => c.currentHp > 0)) {
      maxTurns--;
      const pAlive = pTeam.filter(c => c.currentHp > 0);
      const oAlive = oTeam.filter(c => c.currentHp > 0);
      if (pAlive.length === 0 || oAlive.length === 0) break;

      // 1. 플레이어 공격 (0.40x 너프 반영, 상대 방어력 50% 너프 적용)
      const pAttacker = pAlive[Math.floor(Math.random() * pAlive.length)];
      const oTarget = oAlive[0];
      const pDmg = Math.max(12, Math.floor((pAttacker.atk * 0.40) * 1.3 - (oTarget.def * ARENA_DEF_SCALE) * 0.3));
      oTarget.currentHp = Math.max(0, oTarget.currentHp - pDmg);

      if (oTeam.every(c => c.currentHp <= 0)) break;

      // 2. 적군 반격 (0.40x 너프 반영, 아군 방어력 50% 너프 적용)
      const oAttacker = oAlive[Math.floor(Math.random() * oAlive.length)];
      const pTarget = pAlive[0];
      const oDmg = Math.max(10, Math.floor((oAttacker.atk * 0.40) * 1.15 - (pTarget.def * ARENA_DEF_SCALE) * 0.3));
      pTarget.currentHp = Math.max(0, pTarget.currentHp - oDmg);
    }

    const isWin = oTeam.every(c => c.currentHp <= 0) || pTeam.reduce((sum, c) => sum + c.currentHp, 0) >= oTeam.reduce((sum, c) => sum + c.currentHp, 0);
    finishBattle(isWin);
  };

  // ── 수동 스킬 클릭 실행 ──────────────────────────────────────────────────
  const handleManualSkillClick = (skill: Skill) => {
    if (isBattleEndedRef.current || isProcessingRef.current || finalReward || isShowdownCutin || isLeaderUltCutin || isOppLeaderUltCutin) return;
    const attacker = playerTeamRef.current.find(c => c.id === activeCombatantIdRef.current);
    if (!attacker) return;

    const isAllySkill = skill.effectType === 'heal' || skill.effectType === 'shield' || skill.effectType === 'buff';
    let target: ArenaCombatant | undefined;
    if (isAllySkill) {
      const pAlive = playerTeamRef.current.filter(c => c.currentHp > 0);
      target = [...pAlive].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] || attacker;
    } else {
      const oAlive = oppTeamRef.current.filter(c => c.currentHp > 0);
      target = oAlive.find(c => c.id === targetEnemyIdRef.current) || oAlive[0];
    }

    if (attacker && target) {
      isProcessingRef.current = true;
      executeCombatMove(attacker, skill, target);
      setTimeout(() => {
        if (!isBattleEndedRef.current) {
          isProcessingRef.current = false;
        }
      }, 150);
    }
  };

  // ── 🎖️ 명예 상점 아이템 구매 ──────────────────────────────────────────
  const handleBuyShopItem = (itemKey: string, cost: number, name: string) => {
    if ((state.arenaCoins ?? 0) < cost) {
      gm.addLog('투사의 인장이 부족합니다!', 'danger');
      return;
    }

    gm.spendArenaCoins(cost);

    // 1. 티어별 장비 보급함
    if (itemKey === 'glory_chest_silver') {
      const equip = generateArenaRewardEquipment(900, 45, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🎁 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_gold') {
      const equip = generateArenaRewardEquipment(1150, 30, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🎁 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_platinum') {
      const equip = generateArenaRewardEquipment(1450, 15, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🎁 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_diamond') {
      const equip = generateArenaRewardEquipment(1750, 8, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`👑 [명예 상점] [${name}]을 개봉하여 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_chest_master') {
      const equip = generateArenaRewardEquipment(2050, 3, 0);
      gm.addEquipmentToInventory(equip);
      gm.addLog(`🌌 [명예 상점] [${name}]을 개봉하여 신화급 [${equip.rarity.toUpperCase()}] ${equip.name}을(를) 획득했습니다!`, 'reward');
    }
    // 2. 클래스별 전용 희귀/에픽 장비
    else if (CLASS_HONOR_SHOP_DEFINITIONS[itemKey]) {
      const equip = createClassHonorEquipment(itemKey);
      if (equip) {
        gm.addEquipmentToInventory(equip);
        gm.addLog(`🎖️ [명예 상점] [${CLASS_HONOR_SHOP_DEFINITIONS[itemKey].className}] ${equip.rarity.toUpperCase()} [${equip.name}]을(를) 획득하여 장비함에 보관했습니다!`, 'reward');
      }
    }
    // 3. 직군별 투사의 무기 & 판금갑 (호환성 유지)
    else if (itemKey === 'glory_sword') {
      const hasPrefix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_glory_fierce',
        name: '맹렬한',
        type: 'prefix' as const,
        rarity: 'epic' as const,
        stats: { atk: 6, luck: 3 },
        description: '공격력 +6, 행운 +3'
      } : undefined;
      const sword: EquipmentItem = {
        id: `equip_glory_sword_${Date.now()}`,
        name: prefix ? `[${prefix.name}] 투사의 처형검` : '투사의 처형검',
        baseName: '투사의 처형검',
        slot: 'weapon',
        level: 0,
        rarity: 'epic',
        baseStats: { atk: 22, def: 7, luck: 6 },
        stats: { atk: 22, def: 7, luck: 6 },
        prefix,
        description: '차원 투기장에서 승리를 거듭한 지휘관에게 수여되는 결전 명검.',
        icon: '🗡️'
      };
      sword.stats = recalculateEquipmentStats(sword, 0);
      gm.addEquipmentToInventory(sword);
      gm.addLog(`🎖️ [명예 상점] 에픽 무기 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'glory_gun') {
      const hasPrefix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_glory_precise',
        name: '정밀한',
        type: 'prefix' as const,
        rarity: 'epic' as const,
        stats: { atk: 6, spd: 2 },
        description: '공격력 +6, 속도 +2'
      } : undefined;
      const gun: EquipmentItem = {
        id: `equip_glory_gun_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: prefix ? `[${prefix.name}] 투사의 결전 마총` : '투사의 결전 마총',
        baseName: '투사의 결전 마총',
        slot: 'weapon',
        level: 0,
        rarity: 'epic',
        baseStats: { atk: 15, spd: 4, luck: 4 },
        stats: { atk: 15, spd: 4, luck: 4 },
        prefix,
        description: '고열 에테르 탄환을 고속 연사하는 차원 아레나 제식 마총.',
        icon: '🔫'
      };
      gun.stats = recalculateEquipmentStats(gun, 0);
      gm.addEquipmentToInventory(gun);
      gm.addLog(`🎖️ [명예 상점] 에픽 무기 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'glory_plate') {
      const hasSuffix = Math.random() < 0.20;
      const suffix = hasSuffix ? {
        id: 'suffix_glory_guard',
        name: '수호',
        type: 'suffix' as const,
        rarity: 'epic' as const,
        stats: { def: 8, hp: 42 },
        description: '방어력 +8, HP +42'
      } : undefined;
      const plate: EquipmentItem = {
        id: `equip_glory_plate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: suffix ? `투사의 불패 판금갑 [${suffix.name}]` : '투사의 불패 판금갑',
        baseName: '투사의 불패 판금갑',
        slot: 'armor',
        level: 0,
        rarity: 'epic',
        baseStats: { def: 27, hp: 98 },
        stats: { def: 27, hp: 98 },
        suffix,
        description: '어떠한 맹공도 버텨내는 불패의 투사 중장갑주.',
        icon: '🛡️'
      };
      plate.stats = recalculateEquipmentStats(plate, 0);
      gm.addEquipmentToInventory(plate);
      gm.addLog(`🎖️ [명예 상점] 에픽 방어구 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    }
    // 3. 기존 자원/악세서리/유물
    else if (itemKey === 'food_pack') {
      gm.modifyResource('food', 25);
      gm.addLog(`🎖️ [명예 상점] 특제 보급 식량 세트를 구매했습니다! (식량 +25)`, 'reward');
    } else if (itemKey === 'torch_pack') {
      gm.modifyResource('coal', 20);
      gm.addLog(`🎖️ [명예 상점] 에테르 횃불 세트를 구매했습니다! (석탄 +20)`, 'reward');
    } else if (itemKey === 'pure_prefix') {
      gm.modifyResource('pure_prefix_stone', 1);
      gm.addLog(`🎖️ [명예 상점] 순수 접두 마도석 1개를 획득했습니다!`, 'reward');
    } else if (itemKey === 'pure_suffix') {
      gm.modifyResource('pure_suffix_stone', 1);
      gm.addLog(`🎖️ [명예 상점] 순수 접미 마도석 1개를 획득했습니다!`, 'reward');
    } else if (itemKey === 'glory_amulet') {
      const amulet: EquipmentItem = {
        id: `equip_glory_amulet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: '투사의 용맹 목걸이',
        baseName: '투사의 용맹 목걸이',
        slot: 'accessory',
        level: 0,
        rarity: 'rare',
        baseStats: { hp: 84, def: 14, luck: 8, spd: 4 },
        stats: { hp: 84, def: 14, luck: 8, spd: 4 },
        description: '차원 투기장에서 용맹을 증명한 투사에게 수여되는 펜던트.',
        icon: '📿'
      };
      amulet.stats = recalculateEquipmentStats(amulet, 0);
      gm.addEquipmentToInventory(amulet);
      gm.addLog(`🎖️ [명예 상점] 희귀 장신구 [${name}]을(를) 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'glory_ring') {
      const hasPrefix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_glory',
        name: '투사의',
        type: 'prefix' as const,
        rarity: 'legendary' as const,
        stats: { atk: 10, luck: 6 },
        description: '공격력 +10, 행운 +6'
      } : undefined;
      const ring: EquipmentItem = {
        id: `equip_glory_ring_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: prefix ? `[${prefix.name}] 투사의 영광 반지` : '투사의 영광 반지',
        baseName: '투사의 영광 반지',
        slot: 'accessory',
        level: 0,
        rarity: 'legendary',
        baseStats: { atk: 25, def: 18, luck: 11, spd: 6, mp: 42 },
        stats: { atk: 25, def: 18, luck: 11, spd: 6, mp: 42 },
        prefix,
        description: '차원 투기장에서 승리를 거듭한 지휘관에게 수여되는 전설의 반지.',
        icon: '💍'
      };
      ring.stats = recalculateEquipmentStats(ring, 0);
      gm.addEquipmentToInventory(ring);
      gm.addLog(`🎖️ [명예 상점] 전설 아티팩트 [${name}]을(를) 획득하여 장비함에 보관했습니다!`, 'reward');
    } else if (itemKey === 'overlord_crown') {
      const hasPrefix = Math.random() < 0.25;
      const hasSuffix = Math.random() < 0.20;
      const prefix = hasPrefix ? {
        id: 'prefix_overlord',
        name: '패왕의',
        type: 'prefix' as const,
        rarity: 'legendary' as const,
        stats: { atk: 21, luck: 10 },
        description: '공격력 +21, 행운 +10'
      } : undefined;
      const suffix = hasSuffix ? {
        id: 'suffix_dimension',
        name: '차원의',
        type: 'suffix' as const,
        rarity: 'legendary' as const,
        stats: { def: 18, hp: 105 },
        description: '방어력 +18, 최대 HP +105'
      } : undefined;
      const prefixPart = prefix ? `[${prefix.name}] ` : '';
      const suffixPart = suffix ? ` [${suffix.name}]` : '';
      const crown: EquipmentItem = {
        id: `equip_overlord_crown_${Date.now()}`,
        name: `${prefixPart}차원 패왕의 주권 관${suffixPart}`,
        baseName: '차원 패왕의 주권 관',
        slot: 'accessory',
        level: 0,
        rarity: 'legendary',
        baseStats: { atk: 42, def: 35, luck: 20, spd: 8, hp: 210, mp: 84 },
        stats: { atk: 42, def: 35, luck: 20, spd: 8, hp: 210, mp: 84 },
        prefix,
        suffix,
        description: '차원 게이트 10레벨의 극한을 뚫고 모든 차원을 평정한 절대 패왕의 신화 보관.',
        icon: '👑'
      };
      crown.stats = recalculateEquipmentStats(crown, 0);
      gm.addEquipmentToInventory(crown);
      gm.addLog(`👑 [명예 상점] 최고위 신화 아티팩트 [${name}]을(를) 영구 획득했습니다!`, 'reward');
    }

    gm.saveGame();
  };

  const [shopCategory, setShopCategory] = useState<'all' | 'equip' | 'box' | 'material' | 'supply'>('all');

  const SHOP_ITEMS = [
    // ── 1. 티어별 확정 장비 보급 상자 ──
    {
      key: 'glory_chest_silver',
      name: '[실버] 투사의 장비 보급함',
      desc: '실버 등급 투사를 위한 희귀(Rare) 제식 무구 1종 확정',
      cost: 200,
      icon: '📦',
      tag: '실버 상자',
      category: 'box' as const,
      reqGateLv: 1,
    },
    {
      key: 'glory_chest_gold',
      name: '[골드] 투사의 결전 무구함',
      desc: '골드 등급 투사를 위한 희귀~에픽(Epic) 무구 1종 확정',
      cost: 450,
      icon: '🎁',
      tag: '골드 상자',
      category: 'box' as const,
      reqGateLv: 3,
    },
    {
      key: 'glory_chest_platinum',
      name: '[플래티넘] 사령관 아티팩트 상자',
      desc: '플래티넘 사령관을 위한 에픽(Epic) 무구 1종 확정',
      cost: 850,
      icon: '💎',
      tag: '플래티넘 상자',
      category: 'box' as const,
      reqGateLv: 5,
    },
    {
      key: 'glory_chest_diamond',
      name: '[다이아몬드] 지휘관 성유물함',
      desc: '다이아몬드 전사를 위한 에픽~전설(Legendary) 결전 무구 확정',
      cost: 1400,
      icon: '👑',
      tag: '다이아 상자',
      category: 'box' as const,
      reqGateLv: 7,
    },
    {
      key: 'glory_chest_master',
      name: '[마스터] 패왕의 신화 무기고',
      desc: '최상위 마스터를 위한 전설(Legendary) 무구 1종 확정',
      cost: 2500,
      icon: '🌌',
      tag: '신화 무기고',
      category: 'box' as const,
      reqGateLv: 9,
    },

    // ── 2. 클래스별 전용 명예 장비 (희귀 / 에픽 각 1종, 총 12종) ──
    ...Object.values(CLASS_HONOR_SHOP_DEFINITIONS).map(def => ({
      key: def.key,
      name: def.name,
      desc: def.desc,
      cost: def.cost,
      icon: def.icon,
      tag: `[${def.className}] ${def.grade === 'rare' ? '희귀' : '에픽'}`,
      category: 'equip' as const,
      reqGateLv: def.reqGateLv,
    })),
    {
      key: 'glory_amulet',
      name: '희귀 장신구: 투사의 용맹 목걸이',
      desc: 'HP+84, DEF+14, CRIT+6%, SPD+4',
      cost: 450,
      icon: '📿',
      tag: '희귀 장신구',
      category: 'equip' as const,
      reqGateLv: 4,
    },
    {
      key: 'glory_ring',
      name: '전설 장신구: 투사의 영광 반지',
      desc: 'ATK+25, DEF+18, CRIT+7%, SPD+6, MP+42',
      cost: 800,
      icon: '💍',
      tag: '전설 장비',
      category: 'equip' as const,
      reqGateLv: 5,
    },
    {
      key: 'overlord_crown',
      name: '신화 아티팩트: 차원 패왕의 주권 관',
      desc: 'ATK+42, DEF+35, CRIT+20%, SPD+8, HP+210, MP+84',
      cost: 3000,
      icon: '👑',
      tag: '신화 장비',
      category: 'equip' as const,
      reqGateLv: 10,
    },

    // ── 3. 재료 / 인챈트 ──
    {
      key: 'pure_prefix',
      name: '순수 접두 마도석 (Pure Prefix)',
      desc: '+7강 이상 장비에 파괴적 상위 접두어 마법 부여',
      cost: 250,
      icon: '🔮',
      tag: '인챈트',
      category: 'material' as const,
      reqGateLv: 2,
    },
    {
      key: 'pure_suffix',
      name: '순수 접미 마도석 (Pure Suffix)',
      desc: '+7강 이상 장비에 수호/생명 상위 접미어 부여',
      cost: 250,
      icon: '🔮',
      tag: '인챈트',
      category: 'material' as const,
      reqGateLv: 2,
    },

    // ── 4. 보급품 ──
    {
      key: 'food_pack',
      name: '특제 원정 보급 식량 세트',
      desc: '심연 탐험 시 허기를 달래주는 전술 보급 식량 +25개',
      cost: 100,
      icon: '🍖',
      tag: '보급품',
      category: 'supply' as const,
      reqGateLv: 1,
    },
    {
      key: 'torch_pack',
      name: '에테르 횃불 연료 세트',
      desc: '심연의 흑무를 밝혀주는 고열 제련 석탄 +20개',
      cost: 100,
      icon: '🔥',
      tag: '보급품',
      category: 'supply' as const,
      reqGateLv: 1,
    },
  ];

  const filteredShopItems = SHOP_ITEMS.filter(item => {
    if (shopCategory === 'all') return true;
    return item.category === shopCategory;
  });

  const activeAttacker = playerTeam.find(c => c.id === activeCombatantId);
  const isMyTurn = activeAttacker && activeAttacker.isPlayer && !finalReward;

  // 🔒 1. 차원 앵커 게이트 미건설 상태 진입 방어
  if (!isGateBuilt) {
    return (
      <div className="flex-1 min-h-0 w-full max-w-full flex flex-col items-center justify-center p-6 bg-[#080c16] text-center gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[#ff416c15] border border-[#ff416c44] flex items-center justify-center text-3xl shadow-lg shadow-[#ff416c15]">
          🏆
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-base font-bold text-white tracking-wide">차원 앵커 게이트 미건설</div>
          <div className="text-xs text-[#8b9bb4] max-w-[290px] leading-relaxed">
            차원의 관문이 아직 닫혀 있습니다.<br />
            성채(Citadel)에서 <span className="text-[#ffd54f] font-bold">영혼의 제단(Lv.1)</span>을 먼저 세운 후 <span className="text-[#00d2ff] font-bold">차원 앵커 게이트</span>를 건설하여 3v3 아레나, 네메시스, 영지 침공을 개방하십시오.
          </div>
        </div>
        <ActionButton
          label="🏰 방주 성채로 돌아가기"
          variant="primary"
          size="md"
          className="px-6 font-bold"
          onClick={() => navigateTo('citadel')}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 w-full max-w-full flex flex-col bg-transparent overflow-hidden overflow-x-hidden relative">

      {/* 🌌 차원 관문 게이트 전환 바 (PvP 결투장 <-> 차원 네메시스 월드 레이드 <-> 차원 영지 침공) */}
      <div className="px-3 pt-2 shrink-0 w-full max-w-full z-10">
        <div className="p-1 rounded-xl bg-[#090e1a] border border-[#1a2538] flex items-center gap-1.5 shadow-lg">
          {/* 1. 차원 아레나 (Lv.1 이상) */}
          <button
            className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              gateMode === 'arena'
                ? 'bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] text-white shadow-md shadow-[#ff416c33]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#131d30]'
            }`}
            onClick={() => {
              setGateMode('arena');
              gm.emit('phaserSceneChange', 'arena');
            }}
          >
            <span className="shrink-0">⚔️</span>
            <span className="truncate">차원 아레나</span>
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-black/40 text-[#ffd54f] font-mono shrink-0">PvP</span>
          </button>

          {/* 2. 네메시스 월드 레이드 (Lv.3 이상) */}
          <button
            className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 relative overflow-hidden ${
              !isNemesisUnlocked
                ? 'text-[#506078] hover:bg-[#0c1220] opacity-65 cursor-pointer'
                : gateMode === 'nemesis'
                ? 'bg-gradient-to-r from-[#8a2be2] to-[#4a0e78] text-white shadow-md shadow-[#8a2be244] border border-[#a855f766]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#131d30]'
            }`}
            onClick={() => {
              if (!isNemesisUnlocked) {
                gameDialog.alert({
                  title: '차원 관문 미개방',
                  message: `차원 네메시스 월드 레이드는 차원 앵커 게이트 Lv.3 이상부터 개방됩니다.\n(현재 게이트 레벨: Lv.${gateLevel})\n\n성채에서 차원 앵커 게이트를 증축해주세요.`,
                  icon: '🔒',
                });
                return;
              }
              setGateMode('nemesis');
              gm.emit('phaserSceneChange', 'arena');
            }}
          >
            <span className={`shrink-0 ${isNemesisUnlocked ? 'animate-pulse' : ''}`}>🌌</span>
            <span className="truncate">네메시스</span>
            {isNemesisUnlocked ? (
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/50 text-[#e0aaff] font-mono shrink-0">
                RAID
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#1e2538] border border-[#2d3a54] text-[#90a4ae] font-mono shrink-0">
                🔒Lv.3
              </span>
            )}
            {isNemesisUnlocked && (state.nemesisState?.dailyAttempts ?? 3) > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#38ef7d] animate-ping ml-0.5 shrink-0" />
            )}
          </button>

          {/* 3. 영지 침공 (Lv.6 이상) */}
          <button
            className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 relative overflow-hidden ${
              !isInvasionUnlocked
                ? 'text-[#506078] hover:bg-[#0c1220] opacity-65 cursor-pointer'
                : gateMode === 'invasion'
                ? 'bg-gradient-to-r from-[#e53e3e] via-[#dd6b20] to-[#d69e2e] text-white shadow-md shadow-[#e53e3e44] border border-[#f6ad5566]'
                : 'text-[#8b9bb4] hover:text-white hover:bg-[#131d30]'
            }`}
            onClick={() => {
              if (!isInvasionUnlocked) {
                gameDialog.alert({
                  title: '차원 관문 미개방',
                  message: `차원 영지 침공(5인 원정대 약탈전)은 차원 앵커 게이트 Lv.6 이상부터 개방됩니다.\n(현재 게이트 레벨: Lv.${gateLevel})\n\n성채에서 차원 앵커 게이트를 증축해주세요.`,
                  icon: '🔒',
                });
                return;
              }
              setGateMode('invasion');
              gm.emit('phaserSceneChange', 'invasion');
            }}
          >
            <span className={`shrink-0 ${isInvasionUnlocked ? 'animate-bounce' : ''}`}>🏰</span>
            <span className="truncate">영지 침공</span>
            {isInvasionUnlocked ? (
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-[#ffd54f] font-mono shrink-0">
                5v5
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#1e2538] border border-[#2d3a54] text-[#90a4ae] font-mono shrink-0">
                🔒Lv.6
              </span>
            )}
          </button>
        </div>
      </div>

      {gateMode === 'invasion' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
            <InvasionView />
          </div>
          <div className="px-3 py-1.5 shrink-0 w-full max-w-full border-t border-[#1a2333] bg-[#090e18]">
            <ActionButton
              label="🏰 방주 성채로 귀환"
              variant="ghost"
              className="w-full py-1.5 text-xs"
              onClick={() => navigateTo('citadel')}
            />
          </div>
        </div>
      ) : gateMode === 'nemesis' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <NemesisView />
        </div>
      ) : (
        <>
          {/* 👑 Top 10 랭커 PVE 버프 활성화 배너 */}
      {isTop10 && (
        <div className="px-3 pt-2 w-full max-w-full shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ffd54f33] via-[#ff416c33] to-[#ffd54f33] border border-[#ffd54f] flex items-center justify-between shadow-lg shadow-[#ffd54f22] animate-pulse">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-base shrink-0">👑</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#ffd54f] truncate block">Top 10 랭커 전용 PVE 버프 발동 중</span>
                <span className="text-[10px] text-[#ffdd88] truncate block">전 파티원 ATK/HP +15% · 식량 소모 -20% · 희귀 드랍률 +25%</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#ff416c] font-mono shrink-0 ml-2">Rank #{state.currentArenaRank}</span>
          </div>
        </div>
      )}

      {/* 지휘관 랭크 & 재화 헤더 카드 */}
      <div className="px-3 pt-2 w-full max-w-full shrink-0">
        <div className="panel-accent p-3 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md"
              style={{ background: badge.bg, border: `2px solid ${badge.border}` }}
            >
              {badge.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-cinzel text-sm font-bold truncate" style={{ color: badge.color }}>
                  {badge.label}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e293b] text-[#00d2ff] font-mono font-bold shrink-0">
                  Rank #{state.currentArenaRank}
                </span>
                {streak > 1 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff416c22] border border-[#ff416c88] text-[#ff416c] font-mono font-bold animate-pulse shrink-0">
                    🔥 {streak}연승
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-white leading-none">{state.currentArenaRating}</span>
                <span className="text-[10px] text-[#8b9bb4]">MMR</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 pl-2">
            <span className="text-[10px] text-[#8b9bb4]">'보유 투사의 인장'</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-sm">🪙</span>
              <span className="font-mono text-sm font-bold text-[#ffd54f]">{state.arenaCoins ?? 0}</span>
            </div>
            <span className="text-[9px] text-[#00d2ff]">'인장 획득 ➔ 명예 상점에서 장비 교환'</span>
          </div>
        </div>
      </div>

      {/* 탭 내비게이션 (3단 탭) */}
      <div className="px-3 pt-2 flex gap-1.5 shrink-0 w-full max-w-full">
        {[
          { key: 'match', label: '⚔️ 차원 매칭' },
          { key: 'ranking', label: '🏆 클라우드 랭킹' },
          { key: 'shop', label: '🎖️ 명예 암시장' },
        ].map(t => (
          <button
            key={t.key}
            className={`btn flex-1 text-xs py-2 transition-all ${tab === t.key ? 'btn-primary font-bold shadow-md shadow-[#42321955]' : 'btn-ghost text-[#8b9bb4]'}`}
            onClick={() => setTab(t.key as Tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 영역 */}
      <div className="flex-1 min-h-0 px-3 pt-2 pb-1 overflow-y-auto overflow-x-hidden w-full max-w-full">
        {/* ── 1. 매칭 탭 ── */}
        {tab === 'match' && (
          <div className="flex flex-col gap-2.5 w-full max-w-full">
            {/* 🌌 내 3인 차원 결투 부대 미편성 시에만 컴팩트 안내 배너 노출 */}
            {!squadCheck.isReady && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#2c1216] via-[#1f0f15] to-[#120d18] border border-[#ef535088] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl p-1.5 rounded-lg bg-black/40 border border-[#ef535044] shrink-0">⚠️</span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-[#ff8a80] flex items-center gap-1.5 flex-wrap">
                      <span>차원 3인 결투 부대 미편성</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/50 text-[#ffd54f] font-mono font-bold border border-[#ffd54f33]">
                        현재 {squadCheck.count}/3인 배치
                      </span>
                    </div>
                    <div className="text-[10px] text-[#cfd8dc] mt-0.5 leading-relaxed">
                      차원 아레나는 전열/중열/후열 3인 부대가 모두 배치되어야 결투를 치를 수 있습니다.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {allAvailableHeroes.length >= 3 ? (
                    <button
                      className="btn btn-primary text-xs px-3 py-1.5 font-bold flex items-center gap-1 shadow-md shadow-[#00d2ff33] cursor-pointer"
                      onClick={() => {
                        const ok = gm.autoAssignDimensionalDeck();
                        if (ok) {
                          SoundManager.getInstance().play('equip');
                          setTurnTick(t => t + 1);
                        }
                      }}
                    >
                      <span>⚡</span>
                      <span>3인 자동 편성</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost text-xs px-3 py-1.5 text-[#ffd54f] border border-[#ffd54f55] hover:bg-[#ffd54f15] font-bold cursor-pointer"
                      onClick={() => {
                        navigateTo('citadel');
                        gm.emit('openTavernDrawer');
                      }}
                    >
                      🍻 주점에서 영입
                    </button>
                  )}
                  <button
                    className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#00d2ff] border border-[#00d2ff44] hover:bg-[#00d2ff18] font-bold cursor-pointer"
                    onClick={() => {
                      navigateTo('citadel');
                      gm.emit('openDimensionalBarracks');
                    }}
                  >
                    🏛️ 부대 직접 편성
                  </button>
                </div>
              </div>
            )}

            {/* 연승 보너스 알림 카드 */}
            {streak > 0 && (
              <div className="p-2 rounded-xl bg-gradient-to-r from-[#ff416c15] via-[#ffd54f15] to-[#ff416c15] border border-[#ff416c55] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <span>🔥</span>
                  <span className="font-bold text-[#ffdd88]">투사의 연속 승리 특전:</span>
                  <span className="font-mono text-[#ff416c] font-bold">{streak}연승 진행 중!</span>
                </div>
                <span className="text-[10px] text-[#ffd54f] font-bold">장비 강화 보너스 & 추가 인장 획득</span>
              </div>
            )}

            {/* 🌱 프리시즌 AI 전술 훈련 리그 안내 배너 */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#00d2ff18] via-[#38ef7d15] to-[#00d2ff18] border border-[#00d2ff55] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">🌱</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white">프리시즌 AI 전술 훈련 리그 진행 중</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d66]">
                      PRE-SEASON
                    </span>
                  </div>
                  <span className="text-[10px] text-[#b0bec5] truncate block mt-0.5">
                    브론즈부터 마스터까지 전 등급 AI 봇이 균등 배치되어 3인 홀덤 & 피버 전략을 연습할 수 있습니다.
                  </span>
                </div>
              </div>
            </div>

            {/* 🚫 주간 차원의 금기 & 블러핑 앤 쇼다운 룰 배너 */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#170e28] via-[#24133b] to-[#120a21] border border-[#7e57c266] flex flex-col gap-2 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#d1c4e9]">
                  <span>🔮</span>
                  <span>이번 주의 차원 칙령:</span>
                  <span className="text-[#ffd54f] font-black">【블러핑 앤 쇼다운】</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-[#00d2ff18] hover:bg-[#00d2ff33] text-[#00d2ff] border border-[#00d2ff44] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    onClick={() => {
                      navigateTo('citadel');
                      gm.emit('openDimensionalBarracks');
                    }}
                    title="성채 병영의 차원 결투 부대 편성 화면으로 이동"
                  >
                    <span>🏛️</span>
                    <span>부대 편성</span>
                  </button>
                  <button
                    className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-[#7e57c233] hover:bg-[#7e57c255] text-[#ce93d8] border border-[#7e57c255] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    onClick={() => setIsCodexModalOpen(true)}
                  >
                    <span>📜 족보 도감 열람</span>
                  </button>
                </div>
              </div>

              {/* 주간 가위바위보 상성 순환 안내 */}
              <div className="flex items-center justify-between text-[10.5px] bg-black/40 rounded-lg px-2.5 py-1.5 border border-[#7e57c233]">
                <div className="flex items-center gap-1 text-[#ffd54f]">
                  <span>⚖️</span>
                  <span className="font-bold">{weeklyAffinity.title}:</span>
                </div>
                <span className="font-mono font-bold text-[#80d8ff] tracking-tight">
                  {weeklyAffinity.relationText}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#b0bec5] px-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[#ff5252] font-bold">🚫 금지 배지:</span>
                  <span className="font-mono font-bold text-[#ff8a80] bg-[#ff525222] px-1.5 py-0.2 rounded border border-[#ff525244]">
                    💥 CRIT (치명 일격 획득 불가)
                  </span>
                </div>
                <span className="text-[10px] text-[#80d8ff] font-medium">
                  🃏 3인 홀덤 실루엣 (2 공개 + 1 히든)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#8b9bb4] px-1">
              <span className="flex items-center gap-1.5">
                <span className="text-[#00d2ff]">⚔️</span>
                <span className="font-bold text-white">도전 가능한 AI 봇 대진표</span>
                <span className="text-[9.5px] text-[#8b9bb4]">
                  (내 등급 <strong className="text-white">[{getRankBadge(state.currentArenaRating).label}]</strong> 맞춤 대진 & 상위 승급전)
                </span>
              </span>
              <button
                className="text-[11px] text-[#00d2ff] hover:underline flex items-center gap-1 cursor-pointer"
                onClick={refreshOpponents}
              >
                🔄 새로고침
              </button>
            </div>

            {opponents.map(opp => {
              const oppBadge = getRankBadge(opp.rating);
              const ratingGainDelta = Math.max(15, Math.floor((opp.rating - state.currentArenaRating) / 25 + 30));
              return (
                <div key={opp.id} className="panel p-3 flex flex-col gap-2.5 border border-[#1f2738] hover:border-[#00d2ff44] transition-all bg-[#0e1320] rounded-xl w-full max-w-full overflow-hidden">
                  
                  {/* 카드 상단: 지휘관 정보 & 레이팅 & 도전 버튼 */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">{opp.name}</span>
                        {opp.isBot ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704325] text-[#ff7043] border border-[#ff704355] shrink-0 font-mono flex items-center gap-0.5">
                            🤖 BOT
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] shrink-0 font-mono flex items-center gap-0.5">
                            🌐 지휘관
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0" style={{ background: oppBadge.bg, color: oppBadge.color, border: `1px solid ${oppBadge.border}` }}>
                          {oppBadge.label}
                        </span>
                        {opp.isPromotion && (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff980025] text-[#ffd54f] border border-[#ff980066] shrink-0 font-mono flex items-center gap-0.5 animate-pulse">
                            🔥 승급 도전
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8b9bb4] mt-0.5 truncate">{opp.guild} · Rank #{opp.rank}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-[#ffd54f]">{opp.rating} P</div>
                        <span className="text-[9px] text-[#38ef7d] font-mono block">+{ratingGainDelta} P</span>
                      </div>
                      <ActionButton
                        label="⚔️ 결투 시작"
                        variant={squadCheck.isReady ? 'primary' : 'ghost'}
                        size="sm"
                        className={`px-3 py-1.5 text-xs font-bold shrink-0 ${
                          squadCheck.isReady ? 'shadow-md shadow-[#00d2ff22]' : 'opacity-80 border border-[#ef535044] text-[#ff8a80]'
                        }`}
                        onClick={() => startPvpSimulation(opp)}
                      />
                    </div>
                  </div>

                  {/* 카드 하단: 방어 진형 3인 덱 칩 (홀덤 실루엣: 2 공개 + 1 히든) */}
                  <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-lg bg-[#141b2b] border border-[#222d42] w-full">
                    {opp.defenseDeck.slice(0, 3).map((hero, idx) => {
                      const isHidden = idx === 2; // 후열 블라인드
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center justify-center gap-0.5 text-[9px] px-1 py-1.5 rounded border min-w-0 text-center ${
                            isHidden
                              ? 'bg-gradient-to-br from-[#211233] to-[#120a1c] border-[#7e57c266] text-[#ce93d8]'
                              : 'bg-[#1a2338] border-[#2c3b59] text-[#cfd8dc]'
                          }`}
                        >
                          <span className="text-[9px] font-bold text-[#00d2ff] shrink-0">
                            {idx === 0 ? '전열' : idx === 1 ? '중열' : '후열 ❓'}
                          </span>
                          <span className="font-semibold truncate w-full">
                            {isHidden ? '❓ [비공개]' : hero.title}
                          </span>
                          <span className="text-[8px] font-mono shrink-0 text-[#8b9bb4]">
                            {isHidden ? '히든 실루엣' : `Lv.${hero.level}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ── 2. 프리시즌 랭킹 탭 ── */}
        {tab === 'ranking' && (
          <div className="flex flex-col gap-2 w-full max-w-full">
            <div className="flex items-center justify-between text-xs text-[#8b9bb4] px-1">
              <span className="flex items-center gap-1.5 font-bold text-[#b0bec5]">
                <span className="text-[#38ef7d]">🌱</span>
                <span>프리시즌 AI 전술 훈련 리그 순위표</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55]">
                  AI LEAGUE
                </span>
              </span>
              <button
                className="text-[11px] text-[#00d2ff] hover:underline flex items-center gap-1 cursor-pointer"
                onClick={fetchLeaderboard}
                disabled={isLoadingLb}
              >
                {isLoadingLb ? '동기화 중...' : '🔄 갱신'}
              </button>
            </div>

            {/* 내 순위 핀 카드 */}
            <div className="panel-accent p-3 flex items-center gap-2.5 border-2 border-[#00d2ff] bg-[#0c1b29] w-full max-w-full">
              <div className="font-mono text-base font-bold w-8 text-center text-[#00d2ff] shrink-0">
                #{leaderboard.find(e => e.isPlayer)?.rank || state.currentArenaRank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white truncate">'내 원정단 (지휘관)'</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold shrink-0">ME</span>
                </div>
                <div className="text-[10px] text-[#8b9bb4] truncate">'방주 성채 수호단'</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-[#ffd54f]">{state.currentArenaRating} P</div>
                <div className="text-[9px]" style={{ color: badge.color }}>{badge.label}</div>
              </div>
            </div>

            {/* 글로벌 랭킹 목록 */}
            <div className="flex flex-col gap-1.5 mt-1 w-full max-w-full">
              {leaderboard.map((entry) => {
                const rankColor = entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : entry.rank <= 10 ? '#ff7b25' : '#8b9bb4';
                const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
                const entryBadge = getRankBadge(entry.rating);

                return (
                  <div
                    key={`${entry.rank}_${entry.nickname}`}
                    className={`panel p-2.5 flex items-center gap-2.5 transition-all w-full max-w-full ${entry.isPlayer ? 'border-[#00d2ff] bg-[#0d1f2d]' : 'border-[#1a2338] bg-[#0b101c]'}`}
                  >
                    <div className="font-mono text-sm font-bold w-7 text-center shrink-0" style={{ color: rankColor }}>
                      {rankIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{entry.nickname}</span>
                        {entry.isPlayer ? (
                          <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold bg-[#00d2ff22] text-[#00d2ff] font-mono shrink-0">
                            ME
                          </span>
                        ) : (
                          <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-mono shrink-0">
                            🤖 AI 봇
                          </span>
                        )}
                        <span className="text-[9px] text-[#8b9bb4] shrink-0">Lv.{entry.level}</span>
                      </div>
                      <div className="text-[10px] text-[#6e82a0] truncate">{entry.leaderTitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-[#ffd54f]">{entry.rating} P</div>
                      <div className="text-[9px]" style={{ color: entryBadge.color }}>{entryBadge.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. 명예의 암시장 상점 탭 ── */}
        {tab === 'shop' && (
          <div className="flex flex-col gap-2.5 w-full max-w-full">
            {/* 상점 헤더 */}
            <div className="p-2.5 rounded-xl bg-[#141d30] border border-[#23324d] flex items-center justify-between w-full">
              <div className="min-w-0 flex-1 mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#ffd54f] block truncate">'명예의 암시장'</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#7c4dff33] text-[#b388ff] border border-[#7c4dff66] font-mono font-bold shrink-0">
                    {`게이트 Lv.${gateLevel}`}
                  </span>
                </div>
                <span className="text-[10px] text-[#8b9bb4] block truncate">
                  '게이트 증축에 따라 상위 장비·보급함·마도석이 개방됩니다.'
                </span>
              </div>
              <div className="flex items-center gap-1 bg-[#0b101c] px-2 py-1 rounded-lg border border-[#ffd54f44] shrink-0">
                <span className="text-sm">🪙</span>
                <span className="font-mono text-xs font-bold text-[#ffd54f]">{state.arenaCoins ?? 0}</span>
              </div>
            </div>

            {/* 🏷️ 카테고리 필터 탭 */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {[
                { key: 'all', label: '전체' },
                { key: 'box', label: '🎁 장비 보급함' },
                { key: 'equip', label: '⚔️ 투사 무구' },
                { key: 'material', label: '💎 촉매/마도석' },
                { key: 'supply', label: '🍖 보급품' },
              ].map(cat => (
                <button
                  key={cat.key}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${shopCategory === cat.key ? 'bg-[#5c4524] text-[#f3e5c8] border border-[#876739] shadow-sm' : 'bg-[#141a29] text-[#8b9bb4] hover:text-white border border-[#1f2b42]'}`}
                  onClick={() => setShopCategory(cat.key as any)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 아이템 목록 */}
            <div className="flex flex-col gap-2 w-full max-w-full">
              {filteredShopItems.map(item => {
                const isUnlocked = gm.isMasterAccount || gateLevel >= item.reqGateLv;
                const canAfford = (state.arenaCoins ?? 0) >= item.cost && isUnlocked;

                return (
                  <div
                    key={item.key}
                    className={`panel p-2.5 flex items-center justify-between gap-2 w-full max-w-full transition-all ${isUnlocked ? 'bg-[#0d121f] border border-[#1e293b]' : 'bg-[#090d17] border border-[#161f30] opacity-60'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-[#141b2b] border border-[#25334d] flex items-center justify-center text-lg shrink-0">
                        {isUnlocked ? item.icon : '🔒'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs truncate ${isUnlocked ? 'text-white' : 'text-[#8b9bb4]'}`}>
                            {item.name}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold shrink-0">
                            {item.tag}
                          </span>
                          {!isUnlocked && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#ef535022] text-[#ef5350] border border-[#ef535044] font-mono font-bold shrink-0">
                              게이트 Lv.{item.reqGateLv} 필요
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5">{item.desc}</div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 pl-1">
                      <div className="flex items-center gap-0.5 font-mono text-xs font-bold text-[#ffd54f]">
                        <span>🪙</span>
                        <span>{item.cost}</span>
                      </div>
                      <ActionButton
                        label={isUnlocked ? '교환' : '잠김'}
                        variant={canAfford ? 'success' : 'ghost'}
                        size="sm"
                        disabled={!canAfford}
                        className="px-2.5 py-1 text-xs font-bold"
                        onClick={() => handleBuyShopItem(item.key, item.cost, item.name)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 성채 복귀 버튼 */}
      <div className="px-3 py-2 shrink-0 w-full max-w-full">
        <ActionButton
          label="🏰 방주 성채로 귀환"
          variant="ghost"
          className="w-full py-2 text-xs"
          onClick={() => navigateTo('citadel')}
        />
      </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ⚔️ 차원 아레나 3v3 실시간 몰입형 인터랙티브 전장 모달                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeBattleOpp && (
        <div className="fixed inset-0 z-50 bg-[#070a14]/85 backdrop-blur-[2px] flex flex-col items-center justify-between p-2 sm:p-3 animate-fade-in select-none">
          {/* 💥 최상위 VFX 오버레이 (패널과 카드 위에 완전히 노출) */}
          <BattleVFXOverlay
            vfxList={vfxList}
            onFinish={(id) => setVfxList(prev => prev.filter(v => v.id !== id))}
            className="fixed inset-0 pointer-events-none z-50"
          />

          {/* 전장 헤더 */}
          <div className="w-full max-w-[500px] flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0e1424] border border-[#1e2d48] shadow-lg shrink-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">⚔️</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>vs {activeBattleOpp.name}</span>
                  {activeBattleOpp.isBot ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704325] text-[#ff7043] border border-[#ff704355] font-mono shrink-0">
                      🤖 BOT
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] font-mono shrink-0">
                      🌐 지휘관
                    </span>
                  )}
                  <span className="text-[#ffd54f] font-mono font-normal">({activeBattleOpp.rating}P)</span>
                </div>
                <span className="text-[10px] text-[#8b9bb4] truncate block">
                  3v3 차원 아레나 제{battleRound}라운드 · 속도(SPD) 턴제 교전
                </span>
              </div>
            </div>

            {/* 전투 제어 컨트롤러 (1.5x / 2.0x 배속 전환 & 스킵, 수동 버튼 제거) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#141b2c] text-[#ffd54f] border border-[#212e48] hover:border-[#ffd54f]/50 transition-all cursor-pointer"
                onClick={() => setBattleSpeed(s => (s === 2 ? 1.5 : 2))}
              >
                ⚡ {battleSpeed}x
              </button>
              <button
                className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#ff416c22] text-[#ff416c] border border-[#ff416c66] hover:bg-[#ff416c44] cursor-pointer"
                onClick={handleInstantSkip}
              >
                ⏭️ 스킵
              </button>
            </div>
          </div>

          {/* 🏆 피버콜 3승 선착 스코어보드 (Fever 3-Win Domination) */}
          <div className="w-full max-w-[500px] flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#090d19]/90 border border-amber-500/40 shadow-lg text-xs mt-1 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-cyan-300 text-[11px] flex items-center gap-1">
                <span>🛡️</span>
                <span>아군 피버</span>
              </span>
              <div className="flex items-center gap-1 text-sm bg-black/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className={i < playerFeverWins ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(255,213,79,0.8)]' : 'text-stone-700'}
                  >
                    {i < playerFeverWins ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
            </div>

            <span className="text-[10px] font-black text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/50 font-mono tracking-wider shadow-inner">
              ⚡ 3승 선착 시 즉시 압승 ⚡
            </span>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-sm bg-black/40 px-1.5 py-0.5 rounded border border-red-500/30">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className={i < oppFeverWins ? 'text-red-400 drop-shadow-[0_0_6px_rgba(255,82,82,0.8)]' : 'text-stone-700'}
                  >
                    {i < oppFeverWins ? '🔴' : '⚪'}
                  </span>
                ))}
              </div>
              <span className="font-extrabold text-red-400 text-[11px] flex items-center gap-1">
                <span>적군 피버</span>
                <span>⚔️</span>
              </span>
            </div>
          </div>

          {/* ⚔️🔥 피버 쇼다운 (Fever Showdown) 몰입형 순차 뱃지 오픈 & 승자 광채 오버레이 */}
          {isShowdownCutin && showdownResult && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto cursor-pointer"
              onClick={() => {
                if (!isShowdownEvaluated) {
                  setShowdownRevealIndex(5);
                  setIsShowdownEvaluated(true);
                } else {
                  setIsShowdownCutin(false);
                  isShowdownCutinRef.current = false;
                  setShowdownResult(null);
                  setShowdownRevealIndex(0);
                  setIsShowdownEvaluated(false);
                  executeFeverUltimateAfterShowdown(showdownResult, playerFeverWins >= 3, oppFeverWins >= 3);
                }
              }}
              title="화면을 터치하면 궁극기 연출로 즉시 스킵됩니다"
            >
              <div
                className={`relative w-full max-w-md p-4 sm:p-5 rounded-3xl border-2 transition-all duration-500 flex flex-col gap-3 text-center shadow-2xl overflow-hidden ${
                  !isShowdownEvaluated
                    ? 'bg-[#0c1220] border-[#00d2ff66] shadow-[0_0_40px_rgba(0,210,255,0.25)]'
                    : showdownResult.outcome === 'player_win'
                    ? 'bg-gradient-to-b from-[#0a1e36] via-[#081526] to-[#040912] border-[#00d2ff] shadow-[0_0_60px_rgba(0,210,255,0.7)]'
                    : showdownResult.outcome === 'opp_win'
                    ? 'bg-gradient-to-b from-[#2e0911] via-[#1a050a] to-[#0d0205] border-[#ff1744] shadow-[0_0_60px_rgba(255,23,68,0.7)]'
                    : 'bg-gradient-to-b from-[#2a220a] via-[#171305] to-[#0c0902] border-[#ffd54f] shadow-[0_0_60px_rgba(255,213,79,0.7)]'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 승리 시 배경 방사형 광채 레이어 */}
                {isShowdownEvaluated && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen animate-pulse"
                    style={{
                      background: showdownResult.outcome === 'player_win'
                        ? 'radial-gradient(circle at center, #00d2ff 0%, transparent 70%)'
                        : showdownResult.outcome === 'opp_win'
                        ? 'radial-gradient(circle at center, #ff1744 0%, transparent 70%)'
                        : 'radial-gradient(circle at center, #ffd54f 0%, transparent 70%)'
                    }}
                  />
                )}

                {/* 1. 상단 헤더: FEVER CALL & 진행 인디케이터 */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl animate-spin">🔥</span>
                    <span className="font-black text-sm text-white tracking-widest uppercase font-cinzel">
                      FEVER CALL
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    {!isShowdownEvaluated ? (
                      <span className="text-[#00d2ff] font-bold animate-pulse flex items-center gap-1">
                        <span>🃏</span>
                        <span>배지 오픈 {showdownRevealIndex}/5</span>
                      </span>
                    ) : (
                      <span className={`font-extrabold px-2 py-0.5 rounded-full ${
                        showdownResult.outcome === 'player_win'
                          ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff88]'
                          : showdownResult.outcome === 'opp_win'
                          ? 'bg-[#ff174422] text-[#ff5252] border border-[#ff174488]'
                          : 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f88]'
                      }`}>
                        {showdownResult.outcome === 'player_win' ? '🎉 아군 승리' : showdownResult.outcome === 'opp_win' ? '💀 적군 승리' : '⚡ 전술 무승부'}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── 2. 적군 결투 부대 (ENEMY SIDE) ── */}
                <div className={`p-2.5 rounded-2xl border transition-all duration-500 flex flex-col gap-2 relative ${
                  isShowdownEvaluated && showdownResult.outcome === 'opp_win'
                    ? 'bg-gradient-to-r from-[#3b0d18] via-[#521322] to-[#3b0d18] border-[#ff1744] shadow-[0_0_35px_rgba(255,23,68,0.95)] ring-2 ring-[#ff5252]'
                    : isShowdownEvaluated && showdownResult.outcome === 'player_win'
                    ? 'bg-[#120a10]/60 border-[#2b1822] opacity-45 grayscale'
                    : 'bg-[#150d18] border-[#38203c]'
                }`}>
                  <div className="flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">💀</span>
                      <span className="font-bold text-[#ff80ab] text-[11px]">상대 결투 부대</span>
                    </div>
                    {isShowdownEvaluated && (
                      <span className="text-[10px] font-mono text-[#ff80ab]">
                        점수 {showdownResult.oppScore} P
                      </span>
                    )}
                  </div>

                  {/* 5개 뱃지 슬롯 (순차 오픈) */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const isRevealed = idx < showdownRevealIndex;
                      const badgeType = showdownOppBadges[idx];
                      const meta = badgeType ? FEVER_BADGE_META[badgeType] : null;

                      return (
                        <div
                          key={idx}
                          className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all duration-300 text-center ${
                            isRevealed && meta
                              ? 'scale-100 rotate-0 shadow-md animate-scale-up'
                              : 'scale-95 bg-[#1f1124] border-[#43234d] text-stone-600'
                          }`}
                          style={isRevealed && meta ? {
                            background: meta.bg,
                            borderColor: meta.borderColor,
                            color: meta.color
                          } : {}}
                        >
                          {isRevealed && meta ? (
                            <>
                              <span className="text-sm leading-none drop-shadow">{meta.icon}</span>
                              <span className="text-[7.5px] font-black tracking-tight">{meta.shortLabel}</span>
                            </>
                          ) : (
                            <span className="text-xs font-mono font-bold text-purple-400/50">🎴</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 적군 족보 배너 (승리 시 광채 연출) */}
                  <div className={`py-1.5 px-3 rounded-xl border flex items-center justify-between transition-all duration-500 ${
                    !isShowdownEvaluated
                      ? 'bg-black/40 border-stone-800 text-stone-500'
                      : showdownResult.outcome === 'opp_win'
                      ? 'bg-gradient-to-r from-[#ff174455] via-[#ff525244] to-[#ff174455] border-[#ff1744] text-white shadow-lg shadow-[#ff174488]'
                      : 'bg-black/50 border-stone-800 text-stone-400'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{isShowdownEvaluated ? showdownResult.oppSynergy.icon : '❓'}</span>
                      <span className="font-extrabold text-xs truncate">
                        {isShowdownEvaluated ? showdownResult.oppSynergy.name : '족보 분석 중...'}
                      </span>
                    </div>
                    {isShowdownEvaluated && showdownResult.outcome === 'opp_win' && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#ff1744] text-white font-mono animate-bounce shrink-0">
                        👑 WINNER
                      </span>
                    )}
                  </div>
                </div>

                {/* ── ⚡ VS 상성 판정 바 (중앙 격돌) ── */}
                <div className="flex items-center justify-center gap-2 py-0.5">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#ffd54f66]" />
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-[#ffd54f55] shadow-md">
                    <span className="text-xs">⚖️</span>
                    <span className="text-[10px] font-mono font-bold text-[#ffd54f] tracking-tight">
                      {showdownResult.bannerTitle}
                    </span>
                  </div>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#ffd54f66]" />
                </div>

                {/* ── 3. 아군 결투 부대 (PLAYER SIDE) ── */}
                <div className={`p-2.5 rounded-2xl border transition-all duration-500 flex flex-col gap-2 relative ${
                  isShowdownEvaluated && showdownResult.outcome === 'player_win'
                    ? 'bg-gradient-to-r from-[#0d2847] via-[#103a68] to-[#0d2847] border-[#00d2ff] shadow-[0_0_40px_rgba(0,210,255,0.95)] ring-2 ring-[#00e5ff]'
                    : isShowdownEvaluated && showdownResult.outcome === 'opp_win'
                    ? 'bg-[#0a121e]/60 border-[#14233a] opacity-45 grayscale'
                    : 'bg-[#0d1829] border-[#1d3558]'
                }`}>
                  <div className="flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🛡️</span>
                      <span className="font-bold text-[#80d8ff] text-[11px]">내 차원 결투 부대</span>
                    </div>
                    {isShowdownEvaluated && (
                      <span className="text-[10px] font-mono text-[#80d8ff]">
                        점수 {showdownResult.playerScore} P
                      </span>
                    )}
                  </div>

                  {/* 5개 뱃지 슬롯 (순차 오픈) */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const isRevealed = idx < showdownRevealIndex;
                      const badgeType = showdownPlayerBadges[idx];
                      const meta = badgeType ? FEVER_BADGE_META[badgeType] : null;

                      return (
                        <div
                          key={idx}
                          className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all duration-300 text-center ${
                            isRevealed && meta
                              ? 'scale-100 rotate-0 shadow-md animate-scale-up'
                              : 'scale-95 bg-[#0f1d33] border-[#1b355e] text-cyan-700/50'
                          }`}
                          style={isRevealed && meta ? {
                            background: meta.bg,
                            borderColor: meta.borderColor,
                            color: meta.color
                          } : {}}
                        >
                          {isRevealed && meta ? (
                            <>
                              <span className="text-sm leading-none drop-shadow">{meta.icon}</span>
                              <span className="text-[7.5px] font-black tracking-tight">{meta.shortLabel}</span>
                            </>
                          ) : (
                            <span className="text-xs font-mono font-bold text-cyan-400/50">🎴</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 아군 족보 배너 (승리 시 눈부신 황금/청록 광채) */}
                  <div className={`py-1.5 px-3 rounded-xl border flex items-center justify-between transition-all duration-500 ${
                    !isShowdownEvaluated
                      ? 'bg-black/40 border-stone-800 text-stone-500'
                      : showdownResult.outcome === 'player_win'
                      ? 'bg-gradient-to-r from-[#00d2ff44] via-[#ffd54f33] to-[#00d2ff44] border-[#00d2ff] text-white shadow-lg shadow-[#00d2ff99]'
                      : 'bg-black/50 border-stone-800 text-stone-400'
                  }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{isShowdownEvaluated ? showdownResult.playerSynergy.icon : '❓'}</span>
                      <span className={`font-extrabold text-xs truncate ${
                        isShowdownEvaluated && showdownResult.outcome === 'player_win' ? 'text-[#ffd54f] drop-shadow-[0_0_8px_rgba(255,213,79,0.8)]' : ''
                      }`}>
                        {isShowdownEvaluated ? showdownResult.playerSynergy.name : '족보 분석 중...'}
                      </span>
                    </div>
                    {isShowdownEvaluated && showdownResult.outcome === 'player_win' && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gradient-to-r from-[#00d2ff] to-[#ffd54f] text-black font-mono animate-bounce shrink-0 shadow-md">
                        👑 WINNER!
                      </span>
                    )}
                  </div>
                </div>

                {/* ── 4. 하단: 해설 및 오퍼레이터 궁극기 연계 ── */}
                {isShowdownEvaluated && (
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-1 text-center animate-fade-in">
                    <div className="text-[11px] text-white font-bold truncate">
                      {showdownResult.narrative}
                    </div>
                    {showdownResult.outcome === 'player_win' && (
                      <div className="text-[10px] text-[#ffd54f] font-mono flex items-center justify-center gap-1">
                        <span>💥</span>
                        <span>전술 오퍼레이터 궁극기 연계 발동!</span>
                      </div>
                    )}
                    <span className="text-[8.5px] text-stone-400 mt-0.5">화면을 터치하면 즉시 전장으로 이어집니다.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 👑 아군 리더 궁극기 컷인 배너 오버레이 */}
          {isLeaderUltCutin && (
            <div className="absolute inset-x-0 top-1/4 z-50 flex items-center justify-center p-3 animate-bounce pointer-events-none">
              <div className="bg-gradient-to-r from-[#b8860b] via-[#ffd700] to-[#b8860b] p-[2px] rounded-2xl shadow-[0_0_35px_rgba(255,215,0,0.8)]">
                <div className="bg-[#120e06] px-6 py-3 rounded-2xl flex items-center gap-3">
                  <span className="text-4xl animate-spin">👑</span>
                  <div>
                    <div className="text-xs font-bold text-[#ffe082]">DIMENSIONAL LEADER ULTIMATE</div>
                    <div className="text-lg font-black text-white">{playerLeader?.name || '차원 리더'}의 궁극기 폭발!</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 💀 적군 리더 궁극기 컷인 배너 오버레이 */}
          {isOppLeaderUltCutin && (
            <div className="absolute inset-x-0 top-1/4 z-50 flex items-center justify-center p-3 animate-bounce pointer-events-none">
              <div className="bg-gradient-to-r from-[#880e4f] via-[#ff1744] to-[#880e4f] p-[2px] rounded-2xl shadow-[0_0_35px_rgba(255,23,68,0.8)]">
                <div className="bg-[#1a050d] px-6 py-3 rounded-2xl flex items-center gap-3">
                  <span className="text-4xl animate-spin">💀</span>
                  <div>
                    <div className="text-xs font-bold text-[#ff80ab]">ENEMY LEADER ULTIMATE</div>
                    <div className="text-lg font-black text-white">{oppLeader?.name || '상대 리더'}의 심연 궁극기 발동!</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 1. 적 진영 (적 리더/서포터 + 적 공격자 이미지창 + 3인 필드 카드) ── */}
          <div className="w-full max-w-[500px] my-auto flex flex-col gap-1.5 relative">
            {/* 상단 적 리더 & 서포터 정보 패널 */}
            <LeaderInfoCard
              leader={oppLeader}
              blessing={oppLeaderBlessing}
              supporter={oppSupporter}
              side="enemy"
              isActing={activeCombatantId === oppLeader?.id}
              isBot={activeBattleOpp.isBot}
            />

            {/* 상단 적 공격자 이미지창 */}
            <AttackerVisualBox
              attacker={lastEnemyAttacker}
              side="enemy"
              title="상대 아레나 방어자"
              isActing={activeCombatantId === lastEnemyAttacker?.id}
            />

            {/* 적 3인 선발 필드 카드 */}
            <div className="grid grid-cols-3 gap-1.5">
              {oppTeam.map((c) => {
                const isDying = c.currentHp <= 0 && c.deathCountdown !== undefined && c.deathCountdown > 0 && !c.isPermanentlyDead;
                const isDead = c.isPermanentlyDead || (c.currentHp <= 0 && !isDying);
                const isAlive = c.currentHp > 0;
                const isTarget = c.id === targetEnemyId;
                const hpPct = Math.max(0, (c.currentHp / c.maxHp) * 100);
                const mpPct = Math.max(0, (c.currentMp / c.maxMp) * 100);
                const isTurn = c.id === activeCombatantId;

                return (
                  <div
                    key={c.id}
                    className={`panel p-2 flex flex-col gap-0.5 rounded-xl transition-all cursor-pointer relative ${
                      isTarget ? 'border-2 border-[#ff416c] shadow-lg shadow-[#ff416c33] bg-[#1a0f1c]' : 'border border-[#261f33] bg-[#120d1c]'
                    } ${isTurn ? 'ring-2 ring-[#ffd54f] animate-pulse' : ''} ${isDying ? 'border-2 border-[#ff9800] ring-1 ring-[#ff9800] bg-[#221010]' : ''} ${isDead ? 'opacity-40 grayscale' : ''}`}
                    onClick={() => isAlive && setTargetEnemyId(c.id)}
                  >
                    {isTarget && isAlive && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.1 rounded-full font-bold bg-[#ff416c] text-white shadow-md z-10">
                        TARGET
                      </span>
                    )}

                    {isDying && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff9800] text-black shadow-md z-10 animate-pulse border border-[#ffd54f]">
                        💀 사경 ({c.deathCountdown}T)
                      </span>
                    )}

                    {/* 버프 & 디버프 상태이상 배지 목록 */}
                    {c.statusEffects && c.statusEffects.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-0.5">
                        {c.statusEffects.map((eff, eIdx) => {
                          const meta = STATUS_EFFECT_META[eff.type];
                          const isBuff = eff.type.startsWith('buff_') || eff.type === 'shield' || eff.type === 'regen' || eff.type === 'riposte' || eff.type === 'immunity' || eff.type === 'stealth' || eff.type === 'buff';
                          const turns = eff.duration ?? eff.turnsLeft ?? 1;
                          const label = eff.name || meta?.label || eff.type;
                          const icon = eff.icon || meta?.icon || (isBuff ? '✨' : '💀');
                          return (
                            <span
                              key={eIdx}
                              className={`text-[8px] px-1 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                                isBuff
                                  ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]'
                                  : 'bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]'
                              }`}
                              title={`${label} (${turns}턴)`}
                            >
                              <span>{icon}</span>
                              <span className="font-mono text-[7px]">{turns}T</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-base">{c.icon}</span>
                      <span className="text-[8px] font-mono text-[#ff80ab] font-bold">
                        {c.position === 'front' ? '전열' : c.position === 'mid' ? '중열' : '후열'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{c.name.split('의 ')[1] || c.name}</div>
                      <div className="text-[9px] text-[#b39ddb] truncate">{c.className} Lv.{c.level}</div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full bg-[#26152a] rounded-full h-1.5 overflow-hidden mt-0.5">
                      <div className="bg-[#ff416c] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                    </div>
                    {/* MP Bar */}
                    <div className="w-full bg-[#151f33] rounded-full h-1 overflow-hidden">
                      <div className="bg-[#42a5f5] h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                    </div>

                    <div className="text-[8px] text-right font-mono text-[#8b9bb4]">
                      {isAlive ? `${c.currentHp}/${c.maxHp}` : isDying ? <span className="text-[#ffeb3b] font-bold">💀 사경 ({c.deathCountdown}턴)</span> : '⚰️ DEAD'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 💀 적군 피버 게이지 (적 진영 카드 바로 아래, 중앙 로그를 사이에 두고 아군 피버와 마주보도록 배치) */}
            <div className="flex flex-col gap-1 w-full mt-0.5">
              <FeverGaugeBar
                badges={oppFeverBadges}
                party={oppTeam.map(c => ({ classId: c.classId } as any))}
                label={
                  oppFeverBadges.length >= 5
                    ? "ENEMY FEVER [피버 콜!]"
                    : "ENEMY FEVER"
                }
                side="enemy"
                isBluffing={true}
                revealAll={isShowdownCutin}
              />
            </div>

            {/* ── 2. 중앙 배틀 아레나 (액션 배너 & 피버콜 3턴 유예 현황) ── */}
            <div className="h-10 w-full relative flex flex-col items-center justify-center pointer-events-none my-1">
              {actionBanner ? (
                <div className="px-4 py-1 rounded-full bg-[#0d1527ee] border border-[#00d2ff66] shadow-xl animate-scale-up text-center max-w-[90%] z-20">
                  <span className="text-xs font-bold block" style={{ color: actionBanner.color }}>
                    {actionBanner.text}
                  </span>
                  <span className="text-[10px] text-[#ffdd88] font-bold block mt-0.5">
                    {actionBanner.sub}
                  </span>
                </div>
              ) : feverCallLead === 'player' ? (
                <div className="px-3 py-1 rounded-full bg-[#ffd54f15] border border-[#ffd54f55] text-center z-10 animate-pulse">
                  <span className="text-[10px] font-bold text-[#ffd54f]">
                    ⚡ 아군 [피버 콜!] (상대 유예: {feverCallCountdown}턴 남음)
                  </span>
                </div>
              ) : feverCallLead === 'opp' ? (
                <div className="px-3 py-1 rounded-full bg-[#ff416c15] border border-[#ff416c55] text-center z-10 animate-pulse">
                  <span className="text-[10px] font-bold text-[#ff80ab]">
                    ⚠️ 상대 [피버 콜!] (아군 유예: {feverCallCountdown}턴 남음)
                  </span>
                </div>
              ) : null}
            </div>

            {/* ── 🔥 아군 피버 게이지 ── */}
            <div className="flex flex-col gap-1 w-full">
              <FeverGaugeBar
                badges={feverBadges}
                party={playerTeam.map(c => ({ classId: c.classId } as any))}
                label={
                  feverBadges.length >= 5
                    ? "PLAYER FEVER [피버 콜!]"
                    : "PLAYER FEVER"
                }
                side="player"
                isBluffing={true}
                revealAll={isShowdownCutin}
              />
            </div>

            {/* ── 3. 아군 진영 (3인 필드 카드) ── */}
            <div className="grid grid-cols-3 gap-1.5">
              {playerTeam.map((c) => {
                const isDying = c.currentHp <= 0 && c.deathCountdown !== undefined && c.deathCountdown > 0 && !c.isPermanentlyDead;
                const isDead = c.isPermanentlyDead || (c.currentHp <= 0 && !isDying);
                const isAlive = c.currentHp > 0;
                const isTurn = c.id === activeCombatantId;
                const hpPct = Math.max(0, (c.currentHp / c.maxHp) * 100);
                const mpPct = Math.max(0, (c.currentMp / c.maxMp) * 100);

                return (
                  <div
                    key={c.id}
                    className={`panel p-2 flex flex-col gap-0.5 rounded-xl transition-all relative ${
                      isTurn ? 'border-2 border-[#00d2ff] shadow-lg shadow-[#00d2ff33] bg-[#0c1e30]' : 'border border-[#1a2d48] bg-[#0d1726]'
                    } ${isDying ? 'border-2 border-[#ff9800] ring-1 ring-[#ff9800] bg-[#1c150c]' : ''} ${isDead ? 'opacity-40 grayscale' : ''}`}
                  >
                    {isTurn && isAlive && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.1 rounded-full font-bold bg-[#00d2ff] text-black shadow-md animate-bounce z-10">
                        TURN
                      </span>
                    )}

                    {isDying && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7.5px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff9800] text-black shadow-md z-10 animate-pulse border border-[#ffd54f]">
                        💀 사경 ({c.deathCountdown}T)
                      </span>
                    )}

                    {/* 버프 & 디버프 상태이상 배지 목록 */}
                    {c.statusEffects && c.statusEffects.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-0.5">
                        {c.statusEffects.map((eff, eIdx) => {
                          const meta = STATUS_EFFECT_META[eff.type];
                          const isBuff = eff.type.startsWith('buff_') || eff.type === 'shield' || eff.type === 'regen' || eff.type === 'riposte' || eff.type === 'immunity' || eff.type === 'stealth' || eff.type === 'buff';
                          const turns = eff.duration ?? eff.turnsLeft ?? 1;
                          const label = eff.name || meta?.label || eff.type;
                          const icon = eff.icon || meta?.icon || (isBuff ? '✨' : '💀');
                          return (
                            <span
                              key={eIdx}
                              className={`text-[8px] px-1 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                                isBuff
                                  ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]'
                                  : 'bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]'
                              }`}
                              title={`${label} (${turns}턴)`}
                            >
                              <span>{icon}</span>
                              <span className="font-mono text-[7px]">{turns}T</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-base">{c.icon}</span>
                      <span className="text-[8px] font-mono text-[#00d2ff] font-bold">
                        {c.position === 'front' ? '전열' : c.position === 'mid' ? '중열' : '후열'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{c.name}</div>
                      <div className="text-[9px] text-[#80deea] truncate">{c.className} Lv.{c.level}</div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full bg-[#102422] rounded-full h-1.5 overflow-hidden mt-0.5">
                      <div className="bg-[#38ef7d] h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                    </div>
                    {/* MP Bar */}
                    <div className="w-full bg-[#151f33] rounded-full h-1 overflow-hidden">
                      <div className="bg-[#00d2ff] h-full transition-all duration-300" style={{ width: `${mpPct}%` }} />
                    </div>

                    <div className="text-[8px] text-right font-mono text-[#8b9bb4]">
                      {isAlive ? `${c.currentHp}/${c.maxHp}` : isDying ? <span className="text-[#ffeb3b] font-bold">💀 사경 ({c.deathCountdown}턴)</span> : '⚰️ DEAD'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 아군 공격자 이미지창 */}
            <AttackerVisualBox
              attacker={lastPlayerAttacker}
              side="player"
              title="아군 차원 투사"
              isActing={activeCombatantId === lastPlayerAttacker?.id}
            />

            {/* 하단 아군 리더 & 서포터 정보 패널 */}
            <LeaderInfoCard
              leader={playerLeader}
              blessing={playerLeaderBlessing}
              supporter={playerSupporter}
              side="player"
              isActing={activeCombatantId === playerLeader?.id}
            />
          </div>

          {/* ── 4. 하단 액션 커맨드 바 (수동 플레이 시 스킬 직접 조작) ── */}
          <div className="w-full max-w-[500px] shrink-0">
            {isMyTurn && !isAuto ? (
              <div className="panel p-2.5 rounded-xl bg-[#0a1220] border border-[#00d2ff55] flex flex-col gap-2 animate-fade-in shadow-2xl">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{activeAttacker?.icon}</span>
                    <span className="font-bold text-[#00d2ff]">{activeAttacker?.name}의 행동 선택</span>
                    <span className="text-[10px] text-[#8b9bb4] font-mono">({activeAttacker?.currentMp} MP)</span>
                  </div>
                  <span className="text-[10px] text-[#ffd54f]">타겟: {oppTeam.find(c => c.id === targetEnemyId)?.name || '상대'}</span>
                </div>

                {/* 스킬 버튼 그리드 */}
                <div className="grid grid-cols-3 gap-1.5">
                  {activeAttacker?.skills.map((skill) => {
                    const cd = activeAttacker.cooldowns[skill.id] || 0;
                    const canAfford = activeAttacker.currentMp >= skill.manaCost && cd <= 0;

                    return (
                      <button
                        key={skill.id}
                        disabled={!canAfford}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all text-center ${
                          canAfford
                            ? 'bg-[#14233c] hover:bg-[#1a3154] border border-[#234272] text-white cursor-pointer active:scale-95'
                            : 'bg-[#0f1724] border border-[#182335] text-[#556987] opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => handleManualSkillClick(skill)}
                      >
                        <span className="text-base">{skill.icon || '⚔️'}</span>
                        <span className="text-xs font-bold truncate max-w-full">{skill.name}</span>
                        <span className="text-[9px] font-mono text-[#64b5f6]">
                          {cd > 0 ? `${cd}턴 대기` : skill.manaCost > 0 ? `${skill.manaCost} MP` : '0 MP'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="panel px-3 py-1.5 rounded-xl bg-[#090e1a]/85 border border-[#1a253a]/80 flex items-center justify-between text-[10px] shadow-md">
                <span className="text-[#8b9bb4] flex items-center gap-1.5 font-medium">
                  <span className="animate-spin">⚔️</span> <span>차원 결투 진행 중</span>
                </span>
                <span className="text-[#38ef7d] font-mono flex items-center gap-1 text-[9px] font-bold">
                  <span>{isAuto ? '▶️ 자동 전투 연계' : '⏸️ 상대 행동 중'}</span>
                </span>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 🏆 아레나 결투 결과 & 등급별 장비 전리품 획득 모달                 */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {finalReward && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
              <div className="relative panel-accent w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-4 bg-[#0c1424] border border-[#333d4e] rounded-2xl shadow-2xl flex flex-col gap-3 text-center animate-scale-up custom-scrollbar">
                
                {/* 헤더 승패 배너 */}
                <div className={`py-2 px-3 rounded-xl border-2 ${finalReward.win ? 'bg-[#38ef7d18] border-[#38ef7d] text-[#38ef7d]' : 'bg-[#ef535018] border-[#ef5350] text-[#ef5350]'}`}>
                  <div className="text-xl font-bold font-cinzel tracking-wide">
                    {finalReward.win ? '🎉 VICTORY' : '💀 DEFEAT'}
                  </div>
                  <div className="text-xs font-mono text-white mt-0.5">
                    {finalReward.win ? '차원 결투 대승리!' : '차원 결투 패배...'}
                  </div>
                </div>

                {/* 결과 요약 스탯 카드 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#131d30] p-2 rounded-lg border border-[#21314f]">
                    <span className="text-[10px] text-[#8b9bb4] block">레이팅 변화</span>
                    <span className={`text-sm font-bold font-mono ${finalReward.ratingDelta > 0 ? 'text-[#38ef7d]' : 'text-[#ef5350]'}`}>
                      {finalReward.ratingDelta > 0 ? `+${finalReward.ratingDelta}` : finalReward.ratingDelta} P
                    </span>
                  </div>
                  <div className="bg-[#131d30] p-2 rounded-lg border border-[#21314f]">
                    <span className="text-[10px] text-[#8b9bb4] block">투사의 인장</span>
                    <span className="text-sm font-bold font-mono text-[#ffd54f]">
                      +{finalReward.coins} 🪙
                    </span>
                  </div>
                  <div className="bg-[#131d30] p-2 rounded-lg border border-[#21314f]">
                    <span className="text-[10px] text-[#8b9bb4] block">연승 기록</span>
                    <span className="text-sm font-bold font-mono text-[#ff416c]">
                      {finalReward.streak}연승 🔥
                    </span>
                  </div>
                </div>

                {/* 🔥 피버 콜 대결 리포트 (Fever Call Report - 접기/펼치기 지원) */}
                <div className="p-3 rounded-2xl bg-[#090f1d] border border-amber-500/40 shadow-xl flex flex-col gap-2.5 text-left transition-all">
                  <div
                    onClick={() => setIsFeverReportExpanded(prev => !prev)}
                    className={`flex items-center justify-between cursor-pointer select-none hover:opacity-90 transition-all ${
                      isFeverReportExpanded ? 'border-b border-white/10 pb-1.5' : ''
                    }`}
                    title={isFeverReportExpanded ? '클릭하여 리포트 접기' : '클릭하여 리포트 펼치기'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔥</span>
                      <span className="font-bold text-xs text-white">피버 콜 격돌 리포트</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
                        총 {feverCallHistory.length}회 격돌
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-mono text-stone-400">
                        아군 <span className="text-cyan-400 font-bold">{playerFeverWins}승</span> : <span className="text-rose-400 font-bold">{oppFeverWins}승</span> 상대
                      </div>
                      <span className="text-[10px] font-bold text-amber-400/90 bg-black/50 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                        <span>{isFeverReportExpanded ? '▲ 접기' : '▼ 펼치기'}</span>
                      </span>
                    </div>
                  </div>

                  {isFeverReportExpanded && (
                    feverCallHistory.length > 0 ? (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        {feverCallHistory.map((entry, idx) => {
                          const isPlayerWin = entry.outcome === 'player_win';
                          const isOppWin = entry.outcome === 'opp_win';

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                                isPlayerWin
                                  ? 'bg-gradient-to-r from-[#0d2238] via-[#091726] to-[#0d2238] border-cyan-500/50'
                                  : isOppWin
                                  ? 'bg-gradient-to-r from-[#290d16] via-[#1a070e] to-[#290d16] border-rose-500/50'
                                  : 'bg-stone-900/80 border-stone-700'
                              }`}
                            >
                              {/* 회차 및 승패 뱃지 */}
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-stone-300 flex items-center gap-1.5">
                                  <span className="text-amber-400">⚡ #{entry.round}차 피버콜 격돌</span>
                                  {entry.isTimeout && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      ⏱️ 3턴 유예 타임아웃
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                                    isPlayerWin
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                                      : isOppWin
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                                  }`}
                                >
                                  {isPlayerWin ? '👑 아군 승리' : isOppWin ? '💀 상대 승리' : '⚡ 전술 무승부'}
                                </span>
                              </div>

                              {/* 양측 족보 및 배지 대조 */}
                              <div className="grid grid-cols-2 gap-2 text-xs mt-0.5">
                                {/* 아군 피버 */}
                                <div className={`p-2 rounded-lg border flex flex-col gap-1 ${
                                  isPlayerWin ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-black/30 border-stone-800'
                                }`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                                    <span>🛡️</span> <span>아군 피버</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-cyan-300 font-bold">
                                    {entry.playerScore} P
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0">{entry.playerSynergy.icon}</span>
                                  <span className="font-extrabold text-white text-xs truncate">
                                    {entry.playerSynergy.name}
                                  </span>
                                </div>
                                <div className="text-[9.5px] text-stone-400 truncate">
                                  {entry.playerSynergy.summary}
                                </div>
                                {/* 5개 배지 나열 */}
                                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                  {entry.playerBadges.map((b, bIdx) => {
                                    const bMeta = FEVER_BADGE_META[b];
                                    return (
                                      <span
                                        key={bIdx}
                                        className="text-[8px] px-1 py-0.2 rounded bg-black/60 border border-stone-700 text-stone-300 font-mono flex items-center gap-0.5"
                                        title={bMeta ? bMeta.label : b}
                                      >
                                        <span>{bMeta?.icon}</span>
                                        <span>{bMeta?.shortLabel}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 상대 피버 */}
                              <div className={`p-2 rounded-lg border flex flex-col gap-1 ${
                                isOppWin ? 'bg-rose-950/40 border-rose-500/30' : 'bg-black/30 border-stone-800'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                                    <span>💀</span> <span>상대 피버</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-rose-300 font-bold">
                                    {entry.oppScore} P
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0">{entry.oppSynergy.icon}</span>
                                  <span className="font-extrabold text-white text-xs truncate">
                                    {entry.oppSynergy.name}
                                  </span>
                                </div>
                                <div className="text-[9.5px] text-stone-400 truncate">
                                  {entry.oppSynergy.summary}
                                </div>
                                {/* 5개 배지 나열 */}
                                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                  {entry.oppBadges.map((b, bIdx) => {
                                    const bMeta = FEVER_BADGE_META[b];
                                    return (
                                      <span
                                        key={bIdx}
                                        className="text-[8px] px-1 py-0.2 rounded bg-black/60 border border-stone-700 text-stone-300 font-mono flex items-center gap-0.5"
                                        title={bMeta ? bMeta.label : b}
                                      >
                                        <span>{bMeta?.icon}</span>
                                        <span>{bMeta?.shortLabel}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* 대결 요약 배너 */}
                            <div className="text-[10px] text-stone-400 px-1 truncate">
                              💡 {entry.bannerTitle}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800 text-center text-xs text-stone-400 flex items-center justify-center gap-2 animate-fade-in">
                      <span>ℹ️</span>
                      <span>이번 결투에서는 피버 완충 전 승패가 결정되어 피버콜이 발생하지 않았습니다.</span>
                    </div>
                  )
                )}
              </div>

                {/* 📊 전투 상세 리포트 (MVP 배지, 딜량 점유율, 회복/방어/회피/연계) */}
                <div className="text-left">
                  <CombatMeterTable metrics={combatMetrics} title="⚔️ 3v3 아레나 전투 리포트" />
                </div>

                {/* 🎖️ 명예 암시장 안내 카드 (인장 모아서 장비 교환) */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#121b2d] to-[#172238] border border-[#26385a] flex items-center justify-between text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">🎖️</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        '명예 암시장 오픈'
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] truncate">
                        '획득한 인장으로 등급별 장비함 및 무구를 구매하세요'
                      </div>
                    </div>
                  </div>
                  <button
                    className="px-2.5 py-1.5 rounded-lg bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff66] text-xs font-bold hover:bg-[#00d2ff44] transition-all shrink-0 ml-2"
                    onClick={() => {
                      isBattleEndedRef.current = false;
                      finalRewardRef.current = null;
                      setActiveBattleOpp(null);
                      setFinalReward(null);
                      gm.emit('arenaBattleStateChanged', false);
                      gm.emit('phaserSceneChange', 'arena');
                      setTab('shop');
                    }}
                  >
                    '상점 이동 ➔'
                  </button>
                </div>

                {/* 레벨업 알림 */}
                {finalReward.levelUps && finalReward.levelUps.length > 0 && (
                  <div className="p-2 rounded-lg bg-[#38ef7d15] border border-[#38ef7d44] text-[11px] text-[#38ef7d] font-bold">
                    🎉 영웅 레벨업 달성: {finalReward.levelUps.join(', ')}
                  </div>
                )}

                {/* 확인 및 닫기 버튼 */}
                <ActionButton
                  label="🏆 결투 결과 확인 (아레나 로비 복귀)"
                  variant="primary"
                  className="w-full py-2.5 font-bold shadow-lg shadow-[#42321955]"
                  onClick={() => {
                    isBattleEndedRef.current = false;
                    finalRewardRef.current = null;
                    setActiveBattleOpp(null);
                    setFinalReward(null);
                    gm.emit('arenaBattleStateChanged', false);
                    gm.emit('phaserSceneChange', 'arena');
                  }}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* 📜 피버 족보 & 상성 대도감 (Grand Codex Modal) */}
      {isCodexModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#14161f] border-2 border-[#ffcc00]/50 rounded-2xl shadow-2xl overflow-hidden text-stone-200">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#241a10] via-[#1c2236] to-[#121624] border-b border-[#ffcc00]/30">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📜</span>
                <div>
                  <h2 className="text-xl font-bold text-[#ffdd66] tracking-wide flex items-center gap-2">
                    차원 아레나: 피버 족보 & 상성 대도감
                    <span className="text-xs px-2 py-0.5 rounded bg-[#ffcc00]/20 text-[#ffcc00] border border-[#ffcc00]/40 font-mono">
                      GRAND CODEX
                    </span>
                  </h2>
                  <p className="text-xs text-stone-400">
                    3인의 수호자가 엮어내는 전술 포커의 위계와 주간 차원율의 상성을 한눈에 확인하십시오.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCodexModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* 모달 본문 (스크롤) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
              {/* 섹션 1: 이번 주의 차원율 및 상성 규칙 */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#1a2035] to-[#121526] border border-cyan-500/30">
                <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌌</span>
                    <span className="font-bold text-cyan-300 text-base">이번 주의 차원율: {weeklyAffinity.title}</span>
                  </div>
                  <span className="text-xs text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    매주 월요일 00:00 순환
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
                  <div className="p-3 rounded-lg bg-black/40 border border-stone-800 flex flex-col items-center text-center">
                    <span className="text-xs text-stone-400 font-semibold mb-1">상성 순환 구조</span>
                    <span className="text-xs font-bold text-amber-300 tracking-wider">
                      {weeklyAffinity.relationText}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-stone-800 flex flex-col items-center text-center">
                    <span className="text-xs text-stone-400 font-semibold mb-1">상성 우위 특전</span>
                    <span className="text-xs text-emerald-400 font-bold">
                      족보 맞대결 시 판정 계급 +1단계 보너스
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-red-900/40 flex flex-col items-center text-center">
                    <span className="text-xs text-red-400 font-semibold mb-1">🚫 이번 주 금기 배지</span>
                    <span className="text-xs text-red-300 font-bold">
                      회심 배지(Crit) 발동 불가
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-400 bg-black/30 p-2.5 rounded border border-stone-800/80 leading-relaxed">
                  💡 <strong className="text-stone-300">상성 판정 원리:</strong> 양측이 완성한 피버 족보의 계열(돌파/수호/변칙)을 대조하여 우위인 쪽은 족보 판정에서 1단계 높은 족보로 인정받습니다. (예: 상대의 원페어 vs 나의 하이카드이나 상성 우위 시 무승부 또는 역전 가능!)
                </p>
              </div>

              {/* 섹션 2: 배지 가중치 총점제 (하이 카드 판정) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#241d14] to-[#171410] border border-amber-500/30">
                <div className="flex items-center justify-between mb-2 border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚖️</span>
                    <span className="font-bold text-amber-300 text-base">배지 가중치 총점표 (High Card Score)</span>
                  </div>
                  <span className="text-xs text-amber-400/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    노페어(전술 파동) 발생 시 적용
                  </span>
                </div>
                <p className="text-xs text-stone-400 mb-3">
                  양측 모두 유효한 족보를 완성하지 못해 <strong>[전술 파동(High Card)]</strong>으로 격돌할 경우, 게이지 5칸에 누적된 배지들의 개별 가중치 총점을 합산하여 승패를 결정합니다.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { badge: 'extra', label: '연계 (Extra)', score: 35, desc: '스킬 콤보·추가타', color: 'border-purple-500/40 bg-purple-950/30 text-purple-300' },
                    { badge: 'counter', label: '반격 (Counter)', score: 30, desc: '적 턴 반격 반응', color: 'border-orange-500/40 bg-orange-950/30 text-orange-300' },
                    { badge: 'crit', label: '치명 (Crit)', score: 25, desc: '회심의 일격', color: 'border-red-500/40 bg-red-950/30 text-red-300' },
                    { badge: 'break', label: '파쇄 (Break)', score: 20, desc: '방어 분쇄·실드 관통', color: 'border-yellow-500/40 bg-yellow-950/30 text-yellow-300' },
                    { badge: 'guard', label: '방어 (Guard)', score: 15, desc: '철벽 방어·막기', color: 'border-blue-500/40 bg-blue-950/30 text-blue-300' },
                    { badge: 'assist', label: '지원 (Assist)', score: 15, desc: '아군 버프·정화', color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300' },
                    { badge: 'heal', label: '치유 (Heal)', score: 10, desc: '생명력 회복', color: 'border-pink-500/40 bg-pink-950/30 text-pink-300' },
                    { badge: 'evade', label: '회피 (Evade)', score: 10, desc: '완전 회피 기동', color: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300' },
                  ].map((item) => (
                    <div key={item.badge} className={`p-2 rounded-lg border flex flex-col justify-between ${item.color}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{item.label}</span>
                        <span className="font-mono font-black text-amber-300 text-sm">{item.score}점</span>
                      </div>
                      <span className="text-[10px] text-stone-400">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 섹션 3: 12종 포커 피버 시너지 족보 전체 목록 */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🃏</span>
                    <span className="font-bold text-white text-base">차원 피버 12대 전술 족보 (Synergy Rankings)</span>
                  </div>
                  <span className="text-xs text-stone-400">위계 순위 높은 순 정렬</span>
                </div>

                <div className="space-y-2.5">
                  {ALL_FEVER_SYNERGIES_CODEX.map((synergy, idx) => {
                    const affinityMeta = FEVER_AFFINITY_META[synergy.affinity];
                    return (
                      <div
                        key={synergy.id}
                        className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-black/60 border border-stone-700 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] text-stone-400 font-mono">RANK</span>
                            <span className="text-xs font-black text-amber-400 font-mono">#{idx + 1}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-stone-100 text-sm">{synergy.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 font-mono">
                                {synergy.handRankLabel}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1"
                                style={{
                                  backgroundColor: `${affinityMeta.color}1a`,
                                  borderColor: `${affinityMeta.color}66`,
                                  color: affinityMeta.color
                                }}
                              >
                                {affinityMeta.icon} {affinityMeta.label}
                              </span>
                            </div>
                            <div className="text-xs text-stone-400 mt-0.5">
                              {synergy.summary}
                            </div>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0 bg-black/40 px-3 py-1.5 rounded-lg border border-stone-800/80 w-full sm:w-auto">
                          <div className="text-[10px] text-stone-500 font-semibold">필요 배지 조건</div>
                          <div className="text-xs text-amber-300/95 font-mono">{synergy.requiredBadges}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-3 bg-[#11131c] border-t border-stone-800 flex justify-end">
              <ActionButton
                label="확인 (닫기)"
                variant="secondary"
                className="px-6 py-1.5 text-xs font-bold"
                onClick={() => setIsCodexModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
