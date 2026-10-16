import React, { useState } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import { Mercenary, DefenseDeck, TacticalTowerState } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { resolveSiegeTactic, SiegeTacticDefinition } from '../data/siegeTactics';
import { SoundManager } from '../managers/SoundManager';
import { CustomAssetService } from '../services/CustomAssetService';

const DEFAULT_CLASS_IMAGES: Record<string, string> = {
  aegis_valkyrie: 'assets/valkyrie_saintess.jpg',
  paladin: 'assets/valkyrie_saintess.jpg',
  high_saintess: 'assets/valkyrie_saintess.jpg',
  valhalla_blade: 'assets/valkyrie_saintess.jpg',
  tactical_tower: 'assets/citadel_bonfire.jpg',
};

interface DefenseSettingsViewProps {
  onNavigateToTowerResearch?: () => void;
}

export const DefenseSettingsView: React.FC<DefenseSettingsViewProps> = ({
  onNavigateToTowerResearch,
}) => {
  const { state, gm } = useGameManager();
  const customAssetService = CustomAssetService.getInstance();
  const gateLevel = state.buildings['arenaGate']?.level || 0;
  const isUnlocked = gm.isMasterAccount || gateLevel >= 6;

  // 수비 세팅 및 거점 정밀 스탯 조회
  const { barrierHero, leftTurretHero, rightTurretHero, operatorHero, leftTurretMode, rightTurretMode, deck } = gm.getDefenseDeck();
  const fortressStats = gm.getFortressStats();
  const tacticalTower: TacticalTowerState = gm.getTacticalTower();

  // 상세 모달 상태: 'barrier' | 'left_turret' | 'right_turret' | 'operator' | 'tower_mode'
  const [modalType, setModalType] = useState<'barrier' | 'left_turret' | 'right_turret' | 'operator' | 'tower_mode' | null>(null);

  // 🔍 거점 탑승 & 성향·클래스 전술 상세 분석 모달 상태
  const [inspectHero, setInspectHero] = useState<{
    hero: Mercenary;
    targetSlot: 'barrier' | 'left_turret' | 'right_turret' | 'operator';
  } | null>(null);

  // 모달 임시 상태
  const [tempBarrierHeroId, setTempBarrierHeroId] = useState<string>('');
  const [tempLeftTurretHeroId, setTempLeftTurretHeroId] = useState<string>('');
  const [tempRightTurretHeroId, setTempRightTurretHeroId] = useState<string>('');
  const [tempOperatorId, setTempOperatorId] = useState<string>('');
  const [tempLeftMode, setTempLeftMode] = useState<'focus_bombard' | 'slow_field' | 'balanced'>('balanced');
  const [tempRightMode, setTempRightMode] = useState<'barrier_regen' | 'sanctuary_heal' | 'fortress_guard'>('barrier_regen');

  // 오퍼레이터의 수성 전술 산출
  const activeTactic: SiegeTacticDefinition = operatorHero
    ? resolveSiegeTactic(operatorHero.trait, CHARACTER_CLASSES[operatorHero.classId]?.role)
    : resolveSiegeTactic('강철의 수호자', 'tank');

  // 타워 연구 총합 레벨
  const totalTowerLv =
    (tacticalTower.attack?.tier1 || 0) + (tacticalTower.attack?.tier2 || 0) + (tacticalTower.attack?.tier3 || 0) +
    (tacticalTower.defense?.tier1 || 0) + (tacticalTower.defense?.tier2 || 0) + (tacticalTower.defense?.tier3 || 0) +
    (tacticalTower.utility?.tier1 || 0) + (tacticalTower.utility?.tier2 || 0) + (tacticalTower.utility?.tier3 || 0);

  // 포트레이트 이미지 URL 헬퍼
  const getHeroPortraitUrl = (h: Mercenary | null) => {
    if (!h) return '';
    return customAssetService.getMercenaryOverride(h.classId) || DEFAULT_CLASS_IMAGES[h.classId] || '';
  };

  // 모달 열기 핸들러
  const handleOpenModal = (type: 'barrier' | 'left_turret' | 'right_turret' | 'operator' | 'tower_mode') => {
    setTempBarrierHeroId(deck.barrierHeroId || '');
    setTempLeftTurretHeroId(deck.leftTurretHeroId || '');
    setTempRightTurretHeroId(deck.rightTurretHeroId || '');
    setTempOperatorId(deck.operatorHeroId || '');
    setTempLeftMode(deck.leftTurretMode || 'balanced');
    setTempRightMode(deck.rightTurretMode || 'barrier_regen');
    setModalType(type);
    SoundManager.getInstance().play('click');
  };

  // 모달 저장 핸들러
  const handleSaveModal = () => {
    gm.setDefenseDeck({
      barrierHeroId: tempBarrierHeroId,
      leftTurretHeroId: tempLeftTurretHeroId,
      rightTurretHeroId: tempRightTurretHeroId,
      operatorHeroId: tempOperatorId,
      leftTurretMode: tempLeftMode,
      rightTurretMode: tempRightMode,
    });
    setModalType(null);
    SoundManager.getInstance().play('equip');
  };

  // 자동 최적 편성
  const handleAutoAssign = () => {
    const success = gm.autoAssignDefenseDeck();
    if (success) {
      SoundManager.getInstance().play('equip');
    }
  };

  // 🔒 게이트 미달성 잠금 안내
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-[#0a0f1d] border border-[#1b253b] rounded-2xl text-center gap-3 animate-fade-in my-2 mx-1">
        <div className="text-4xl p-3 bg-[#ff416c15] border border-[#ff416c33] rounded-2xl text-[#ff416c] animate-pulse">
          🔒
        </div>
        <div>
          <h3 className="text-base font-black text-white flex items-center justify-center gap-2">
            <span>영지 수비 부대 & 방어 타워 셋팅</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]">
              Gate Lv.6 필요
            </span>
          </h3>
          <p className="text-xs text-[#8b9bb4] max-w-sm mt-1 leading-relaxed">
            차원 앵커 게이트를 <span className="text-[#ffd54f] font-bold">6레벨</span> 이상으로 증축하여 <span className="text-[#00d2ff] font-bold">영지 침공</span>이 열리면, 3대 방어 거점(차원 보호막, 좌/우 포탑)에 용병을 탑승시켜 영지를 수호할 수 있습니다.
          </p>
        </div>
        <div className="text-[11px] text-[#546e7a] font-mono bg-[#060911] px-3 py-1 rounded-xl border border-[#151f33]">
          현재 차원 게이트: <span className="text-[#00d2ff] font-bold">Lv.{gateLevel}</span> / 6
        </div>
      </div>
    );
  }

  const allAvailableHeroes = [...state.barracks, ...state.party].filter(
    (h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx
  );

  const leftTurretBaseAtk = 100 + gateLevel * 15 + (tacticalTower.attack?.tier1 || 0) * 20;
  const leftTurretHeroAtk = leftTurretHero ? leftTurretHero.stats.atk : 0;
  const leftTurretTotalAtk = leftTurretBaseAtk + leftTurretHeroAtk;

  const rightTurretMaxMp = 100 + (rightTurretHero ? rightTurretHero.maxMp : 50);
  const rightTurretLuck = 10 + (tacticalTower.utility?.tier2 || 0) * 2 + (rightTurretHero ? rightTurretHero.stats.luck : 0);

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col gap-2.5 p-2 sm:p-3 overflow-y-auto custom-scrollbar animate-fade-in select-none pb-16">

      {/* ── 상단 헤더 & 자동 편성 바 (모바일 반응형 한 줄 압축) ── */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#121c2e] via-[#0e1626] to-[#1a1124] border border-[#233554] flex items-center justify-between shadow-lg gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl sm:text-2xl p-1 sm:p-1.5 rounded-xl bg-[#00d2ff18] border border-[#00d2ff44] text-[#00d2ff] shrink-0">
            🛡️
          </span>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
              <span>수비 거점 결속 프로토콜</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44] shrink-0">
                Gate Lv.{gateLevel}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#8b9bb4] truncate">
              전열 타워는 전열 특화 스킬 대상이 되며 성벽을 엄호하고, 후열 보호막은 후열 저격 대상이 됩니다.
            </div>
          </div>
        </div>

        <button
          onClick={handleAutoAssign}
          className="btn btn-ghost text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 border border-[#2a3f64] text-[#ffd54f] hover:bg-[#ffd54f15] flex items-center gap-1 font-bold cursor-pointer shrink-0"
        >
          <span>⚡</span>
          <span>자동 셋팅</span>
        </button>
      </div>

      {/* ════════ 1. 🛡️ 차원 왜곡 보호막 결속 (기본 7,000 HP + 탱커 체력/방어력 결속 합산) ════════ */}
      <div
        onClick={() => handleOpenModal('barrier')}
        className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#0a1e33] via-[#091b2e] to-[#061424] border-2 border-[#00d2ff77] hover:border-[#00d2ff] cursor-pointer transition-all flex flex-col gap-2 shadow-[0_0_15px_rgba(0,210,255,0.25)] relative overflow-hidden group"
      >
        {/* 상단 타이틀 바 */}
        <div className="flex items-center justify-between border-b border-[#00d2ff33] pb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base sm:text-lg">🛡️</span>
            <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-[#00d2ff] transition-colors truncate">
              차원 왜곡 보호막 결속
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#42a5f525] text-[#42a5f5] border border-[#42a5f555] shrink-0">
              후열 거점
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] shrink-0">
              기본 2,500 HP
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {barrierHero && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectHero({ hero: barrierHero, targetSlot: 'barrier' });
                  SoundManager.getInstance().play('click');
                }}
                className="text-[9.5px] px-2 py-0.5 rounded-lg bg-[#00d2ff22] border border-[#00d2ff66] text-[#00d2ff] hover:bg-[#00d2ff44] font-bold flex items-center gap-1 shrink-0"
              >
                <span>🔍</span>
                <span>전술/수치 상세</span>
              </button>
            )}
            <span className="text-[11px] text-[#00d2ff] font-bold flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>결속자 변경</span>
              <span>➔</span>
            </span>
          </div>
        </div>

        {/* 결속 용병 포트레이트 및 스탯 합산 미리보기 */}
        <div className="flex items-center gap-3">
          {/* 포트레이트 */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 border-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.5)] bg-[#0c1424] flex items-center justify-center">
            {barrierHero && getHeroPortraitUrl(barrierHero) ? (
              <img
                src={getHeroPortraitUrl(barrierHero)}
                alt={barrierHero.name}
                className="w-full h-full object-cover"
              />
            ) : barrierHero ? (
              <span className="text-2xl">{CHARACTER_CLASSES[barrierHero.classId]?.skills[0]?.icon || '🛡️'}</span>
            ) : (
              <span className="text-xs text-[#3a587e] font-bold">+ 결속</span>
            )}
            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-black bg-black/85 px-1 rounded text-[#ffd54f]">
              Lv.{barrierHero?.level || 1}
            </span>
            <span className="absolute top-0.5 left-0.5 text-[6.5px] font-bold bg-[#00d2ff] text-black px-1 rounded">
              WARDEN
            </span>
          </div>

          {/* 중앙 수치 및 역할 설명 */}
          <div className="min-w-0 flex-1 flex flex-col justify-between h-14 sm:h-16 py-0.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  {barrierHero ? barrierHero.name : '수호 결속자 미배치'}
                </span>
                {barrierHero && (
                  <span className="text-[9px] font-bold text-[#80deea] truncate">
                    ({CHARACTER_CLASSES[barrierHero.classId]?.name})
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono font-bold text-[#ffd54f] shrink-0">
                방어력 {fortressStats.barrierDef}
              </span>
            </div>

            {/* 총 내구도 및 결속 효과 요약 배너 */}
            <div className="p-1.5 rounded-lg bg-black/50 border border-[#00d2ff33] flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
              <span className="text-[#80deea] font-bold flex items-center gap-1">
                <span>총 내구도:</span>
                <span className="text-white font-black">{fortressStats.barrierMaxHp.toLocaleString()} HP</span>
              </span>
              <span className="text-[9px] text-[#ffd54f] truncate">
                {barrierHero ? `용병 HP +${Math.round(barrierHero.maxHp * 0.35).toLocaleString()} 합산 반영` : '탱커 배치 권장'}
              </span>
            </div>

            <div className="text-[8.5px] sm:text-[9px] text-[#8b9bb4] truncate">
              ※ 결속 용병은 직접 공격하지 않고 성벽 내구도와 방어력을 대폭 증폭시킵니다.
            </div>
          </div>
        </div>
      </div>

      {/* ════════ 2. 🗼 좌측 전술 타워 & 3. 🗼 우측 전술 타워 (모바일 2열 나란히 배치) ════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

        {/* 🗼 좌측 전술 포탑 (공격 지원 / 포탑 공격력 + 사수 공격력 합산) */}
        <div
          onClick={() => handleOpenModal('left_turret')}
          className="p-2.5 rounded-2xl bg-[#140e18] border border-[#ff704355] hover:border-[#ff7043] cursor-pointer transition-all flex flex-col gap-2 shadow group relative"
        >
          <div className="flex items-center justify-between border-b border-[#ff704333] pb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-base">🗼</span>
              <span className="font-extrabold text-xs text-white group-hover:text-[#ff7043] transition-colors truncate">
                좌측 포탑 (화력 공세)
              </span>
              <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-[#ef535025] text-[#ef5350] border border-[#ef535055] shrink-0">
                전열
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {leftTurretHero && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectHero({ hero: leftTurretHero, targetSlot: 'left_turret' });
                    SoundManager.getInstance().play('click');
                  }}
                  className="text-[8.5px] px-1.5 py-0.5 rounded bg-[#ff704322] border border-[#ff704366] text-[#ff7043] hover:bg-[#ff704344] font-bold flex items-center gap-1 shrink-0"
                >
                  <span>🔍</span>
                  <span>상세</span>
                </button>
              )}
              <span className="text-[10px] text-[#ff7043] font-bold shrink-0">사수 변경 ➔</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 사수 포트레이트 */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-[#ff7043] bg-[#1a0f12] flex items-center justify-center">
              {leftTurretHero && getHeroPortraitUrl(leftTurretHero) ? (
                <img
                  src={getHeroPortraitUrl(leftTurretHero)}
                  alt={leftTurretHero.name}
                  className="w-full h-full object-cover"
                />
              ) : leftTurretHero ? (
                <span className="text-xl">{CHARACTER_CLASSES[leftTurretHero.classId]?.skills[0]?.icon || '⚔️'}</span>
              ) : (
                <span className="text-[10px] text-[#6b3524] font-bold">+ 탑승</span>
              )}
              <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-black bg-black/85 px-1 rounded text-[#ffd54f]">
                Lv.{leftTurretHero?.level || 1}
              </span>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-white truncate">
                  {leftTurretHero ? leftTurretHero.name : '사수 미배치'}
                </span>
                <span className="text-[8.5px] font-mono text-[#ff8a80] font-bold">
                  총 ATK {leftTurretTotalAtk}
                </span>
              </div>
              <div className="text-[8.5px] font-mono text-[#8b9bb4]">
                기본 {leftTurretBaseAtk} + 사수 {leftTurretHeroAtk} · HP <span className="text-white font-bold">{fortressStats.leftTurretMaxHp.toLocaleString()}</span>
              </div>
              <div className="text-[8px] text-[#ffd54f] truncate">
                🎯 {leftTurretMode === 'focus_bombard' ? '타겟 집중 사격' : leftTurretMode === 'slow_field' ? '감속 억제탄' : '광역 폭격 / 집중 요격'}
              </div>
            </div>
          </div>
        </div>

        {/* 🗼 우측 전술 포탑 (전술 지원 / 마나 & 행운 기반 증폭) */}
        <div
          onClick={() => handleOpenModal('right_turret')}
          className="p-2.5 rounded-2xl bg-[#0c1824] border border-[#00d2ff55] hover:border-[#00d2ff] cursor-pointer transition-all flex flex-col gap-2 shadow group relative"
        >
          <div className="flex items-center justify-between border-b border-[#00d2ff33] pb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-base">🗼</span>
              <span className="font-extrabold text-xs text-white group-hover:text-[#00d2ff] transition-colors truncate">
                우측 포탑 (전술 지원)
              </span>
              <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-[#ef535025] text-[#ef5350] border border-[#ef535055] shrink-0">
                전열
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {rightTurretHero && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectHero({ hero: rightTurretHero, targetSlot: 'right_turret' });
                    SoundManager.getInstance().play('click');
                  }}
                  className="text-[8.5px] px-1.5 py-0.5 rounded bg-[#ffd54f22] border border-[#ffd54f66] text-[#ffd54f] hover:bg-[#ffd54f44] font-bold flex items-center gap-1 shrink-0"
                >
                  <span>🔍</span>
                  <span>상세</span>
                </button>
              )}
              <span className="text-[10px] text-[#00d2ff] font-bold shrink-0">사수 변경 ➔</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 사수 포트레이트 */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-[#00d2ff] bg-[#0c1422] flex items-center justify-center">
              {rightTurretHero && getHeroPortraitUrl(rightTurretHero) ? (
                <img
                  src={getHeroPortraitUrl(rightTurretHero)}
                  alt={rightTurretHero.name}
                  className="w-full h-full object-cover"
                />
              ) : rightTurretHero ? (
                <span className="text-xl">{CHARACTER_CLASSES[rightTurretHero.classId]?.skills[0]?.icon || '🔮'}</span>
              ) : (
                <span className="text-[10px] text-[#2c526d] font-bold">+ 탑승</span>
              )}
              <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-black bg-black/85 px-1 rounded text-[#ffd54f]">
                Lv.{rightTurretHero?.level || 1}
              </span>
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-white truncate">
                  {rightTurretHero ? rightTurretHero.name : '사수 미배치'}
                </span>
                <span className="text-[8.5px] font-mono text-[#80deea] font-bold">
                  MP {rightTurretMaxMp} · LUCK {rightTurretLuck}
                </span>
              </div>
              <div className="text-[8.5px] font-mono text-[#8b9bb4]">
                전술 스킬 증폭 · HP <span className="text-white font-bold">{fortressStats.rightTurretMaxHp.toLocaleString()}</span>
              </div>
              <div className="text-[8px] text-[#80deea] truncate">
                ✨ {rightTurretMode === 'barrier_regen' ? '성벽·포탑 긴급 수복' : rightTurretMode === 'sanctuary_heal' ? '결계 방어막 및 버프' : '디버프 및 어그로 교란'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ════════ 4. 📡 수성 오퍼레이터 & 수성 전술 요약 카드 ════════ */}
      <div
        onClick={() => handleOpenModal('operator')}
        className="p-2.5 sm:p-3 rounded-2xl bg-[#140d1a] border border-[#341b38] hover:border-[#ff416c] cursor-pointer transition-all flex flex-col gap-2 shadow group relative"
      >
        <div className="flex items-center justify-between border-b border-[#2d1730] pb-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-base">📡</span>
            <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-[#ff80ab] transition-colors truncate">
              수성 오퍼레이터 & 수성 전술
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {operatorHero && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectHero({ hero: operatorHero, targetSlot: 'operator' });
                  SoundManager.getInstance().play('click');
                }}
                className="text-[9.5px] px-2 py-0.5 rounded bg-[#ff416c22] border border-[#ff416c66] text-[#ff80ab] hover:bg-[#ff416c44] font-bold flex items-center gap-1 shrink-0"
              >
                <span>🔍</span>
                <span>전술 상세</span>
              </button>
            )}
            <span className="text-[10px] sm:text-[11px] text-[#ff80ab] font-bold shrink-0">오퍼레이터 변경 ➔</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* 오퍼레이터 포트레이트 */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 border-[#ff416c] bg-[#1a0815] flex items-center justify-center">
            {operatorHero && getHeroPortraitUrl(operatorHero) ? (
              <img
                src={getHeroPortraitUrl(operatorHero)}
                alt={operatorHero.name}
                className="w-full h-full object-cover"
              />
            ) : operatorHero ? (
              <span className="text-2xl">{CHARACTER_CLASSES[operatorHero.classId]?.skills[0]?.icon || '👑'}</span>
            ) : (
              <span className="text-xs text-[#6b2540] font-bold">+</span>
            )}
            <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-black bg-black/85 px-1 rounded text-[#ffd54f]">
              Lv.{operatorHero?.level || 1}
            </span>
          </div>

          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-black text-white truncate">
                  {operatorHero ? operatorHero.name : '수성 오퍼레이터 미지정'}
                </span>
                {operatorHero && (
                  <span className="text-[8.5px] font-bold text-[#ffd54f] px-1 py-0.2 rounded bg-[#ffd54f15] border border-[#ffd54f33] font-mono shrink-0">
                    {activeTactic.trait}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-[#ce93d8] font-mono shrink-0">
                {operatorHero ? CHARACTER_CLASSES[operatorHero.classId]?.name : '선택 필요'}
              </span>
            </div>

            {/* 수성 전술 배너 */}
            <div className="p-1.5 rounded-lg bg-black/45 border border-[#ff416c33] flex items-center justify-between gap-1.5 text-[9.5px] sm:text-[10px]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs shrink-0">{activeTactic.defenseIcon}</span>
                <span className="font-bold text-[#ff80ab] shrink-0">[{activeTactic.defenseSkillName}]</span>
                <span className="text-[#cfd8e8] truncate">{activeTactic.defenseDesc}</span>
              </div>
              <span className="font-mono font-bold text-[#ffd54f] shrink-0">
                {Math.round(activeTactic.defensePower * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ 5. 🔬 방어 전술 타워 연구 연동 배너 ════════ */}
      <div className="p-2.5 rounded-2xl bg-[#09111c] border border-[#1b2b46] flex items-center justify-between gap-2 shadow">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg text-[#ffd54f] shrink-0">🔬</span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>영지 침공 방어 전술 타워 연구 연동</span>
              <span className="text-[9px] font-mono text-[#ffd54f] shrink-0">총 Lv.{totalTowerLv} / 45</span>
            </div>
            <div className="text-[10px] text-[#8b9bb4] truncate">
              공격 1~3차(화력·화상·중독) · 방어 1~3차(수복·기절·결빙) · 유틸 1~3차(속도%·마나%·행운%)
            </div>
          </div>
        </div>

        {onNavigateToTowerResearch && (
          <button
            onClick={onNavigateToTowerResearch}
            className="btn btn-ghost text-[10px] sm:text-[11px] px-2.5 py-1 border border-[#2b4168] text-[#00d2ff] hover:bg-[#00d2ff15] shrink-0 font-bold"
          >
            연구소 ➔
          </button>
        )}
      </div>

      {/* ════════ 팝업 상세 모달: 거점 용병 선택 (보호막 / 좌측 타워 / 우측 타워 / 오퍼레이터) ════════ */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-[#0d1424] border border-[#243554] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#141e33] to-[#0d1424] border-b border-[#1f2d48] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {modalType === 'barrier' ? '🛡️' : modalType === 'left_turret' ? '🗼' : modalType === 'right_turret' ? '🗼' : '📡'}
                </span>
                <span className="font-extrabold text-xs sm:text-sm text-white">
                  {modalType === 'barrier' && '차원 보호막 결속자 지정 (탱커 권장)'}
                  {modalType === 'left_turret' && '좌측 전술 포탑 사수 지정 (물리 딜러 권장)'}
                  {modalType === 'right_turret' && '우측 전술 포탑 사수 지정 (마법/힐러 권장)'}
                  {modalType === 'operator' && '수성 오퍼레이터 임명 (전술 조율)'}
                </span>
              </div>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white p-1 text-base">✕</button>
            </div>

            {/* 모달 안내 및 설명 */}
            <div className="p-3 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
              <div className="text-[11px] text-[#8b9bb4] bg-[#070b14] p-2 rounded-xl border border-[#162238] leading-relaxed">
                {modalType === 'barrier' && (
                  <span>
                    🛡️ 결속 용병은 <strong className="text-[#ffd54f]">직접 공격하지 않고</strong>, 자신의 <strong className="text-[#00d2ff]">MaxHP와 DEF</strong>를 차원 보호막에 100% 가산 합산합니다. 탱커를 배치할수록 보호막이 극적으로 두터워집니다.
                  </span>
                )}
                {modalType === 'left_turret' && (
                  <span>
                    🗼 좌측 타워에 탑승한 사수는 타워의 생존/속도 스탯을 바탕으로 자신의 <strong className="text-[#ff7043]">공격력과 스킬</strong>로 공격합니다. <strong className="text-[#ffd54f]">기본 공격 버프(2연타 등)</strong>가 발동됩니다.
                  </span>
                )}
                {modalType === 'right_turret' && (
                  <span>
                    🗼 우측 타워에 탑승한 사수는 타워의 생존/속도 스탯을 바탕으로 자신의 <strong className="text-[#00d2ff]">공격력과 스킬</strong>로 공격합니다. <strong className="text-[#ffd54f]">전술 스킬 버프(쿨다운/계수)</strong>가 발동됩니다.
                  </span>
                )}
                {modalType === 'operator' && (
                  <span>
                    📡 오퍼레이터의 <strong className="text-[#ffd54f]">성향(8종)</strong>과 <strong className="text-[#ff80ab]">클래스(6종)</strong>에 따라 영지의 핵심 수성 전술이 발동됩니다.
                  </span>
                )}
              </div>

              {/* 보유 용병 리스트 */}
              <div className="text-xs font-bold text-white">보유 용병 선택 (포트레이트 클릭)</div>
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                {allAvailableHeroes.map(h => {
                  const isCurrentBarrier = tempBarrierHeroId === h.id;
                  const isCurrentLeft = tempLeftTurretHeroId === h.id;
                  const isCurrentRight = tempRightTurretHeroId === h.id;
                  const isCurrentOp = tempOperatorId === h.id;

                  const isOccupiedElsewhere =
                    (modalType === 'barrier' && (isCurrentLeft || isCurrentRight || isCurrentOp)) ||
                    (modalType === 'left_turret' && (isCurrentBarrier || isCurrentRight || isCurrentOp)) ||
                    (modalType === 'right_turret' && (isCurrentBarrier || isCurrentLeft || isCurrentOp)) ||
                    (modalType === 'operator' && (isCurrentBarrier || isCurrentLeft || isCurrentRight));

                  const isSelectedForThis =
                    (modalType === 'barrier' && isCurrentBarrier) ||
                    (modalType === 'left_turret' && isCurrentLeft) ||
                    (modalType === 'right_turret' && isCurrentRight) ||
                    (modalType === 'operator' && isCurrentOp);

                  const cls = CHARACTER_CLASSES[h.classId];
                  const imgUrl = getHeroPortraitUrl(h);

                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        if (isOccupiedElsewhere) return;
                        if (!modalType || modalType === 'tower_mode') return;
                        setInspectHero({ hero: h, targetSlot: modalType });
                        SoundManager.getInstance().play('click');
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isOccupiedElsewhere
                          ? 'bg-[#10141d]/50 border-[#1f2638] opacity-45 cursor-not-allowed'
                          : isSelectedForThis
                          ? 'bg-[#0f2a42] border-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                          : 'bg-[#101726] border-[#1e2a40] hover:border-[#00d2ff]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* 포트레이트 */}
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#2a3f64] bg-[#080d16] flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt={h.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base">{cls?.skills?.[0]?.icon || '⚔️'}</span>
                          )}
                          <span className="absolute bottom-0.2 right-0.5 text-[6.5px] font-mono font-bold bg-black/80 px-1 rounded text-[#ffd54f]">
                            Lv.{h.level}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-white truncate">{h.name}</span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33]">
                              {h.trait || '균형잡힌 정예'}
                            </span>
                            {isOccupiedElsewhere && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-red-950/40 text-red-300 border border-red-800/40">
                                타 거점 배치 중
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5">
                            {cls?.name} · ATK {h.stats.atk} · DEF {h.stats.def} · HP {h.maxHp.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!modalType || modalType === 'tower_mode') return;
                            setInspectHero({ hero: h, targetSlot: modalType });
                            SoundManager.getInstance().play('click');
                          }}
                          className="px-2 py-1 rounded-lg bg-[#00d2ff18] border border-[#00d2ff55] hover:bg-[#00d2ff33] text-[#00d2ff] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>🔍</span>
                          <span>상세/전술</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOccupiedElsewhere) return;
                            if (modalType === 'barrier') setTempBarrierHeroId(h.id);
                            else if (modalType === 'left_turret') setTempLeftTurretHeroId(h.id);
                            else if (modalType === 'right_turret') setTempRightTurretHeroId(h.id);
                            else if (modalType === 'operator') setTempOperatorId(h.id);
                            SoundManager.getInstance().play('equip');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            isSelectedForThis
                              ? 'bg-[#38ef7d22] border-[#38ef7d] text-[#38ef7d]'
                              : isOccupiedElsewhere
                              ? 'bg-[#10141d] border-[#1f2638] text-[#607d8b]'
                              : 'bg-[#00d2ff22] border-[#00d2ff88] text-white hover:bg-[#00d2ff44]'
                          }`}
                        >
                          {isSelectedForThis ? '✓ 선택됨' : isOccupiedElsewhere ? '배치불가' : '선택'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 모달 풋터 */}
            <div className="px-3.5 py-2.5 bg-[#0a0f1d] border-t border-[#1f2d48] flex items-center justify-end gap-2">
              <button onClick={() => setModalType(null)} className="btn btn-ghost text-xs px-3.5 py-1.5 text-[#8b9bb4]">
                취소
              </button>
              <button onClick={handleSaveModal} className="btn btn-primary text-xs px-5 py-2 font-bold">
                배치 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ 6. 🔍 거점 탑승 & 성향·클래스 전술 상세 분석 모달 ════════ */}
      {inspectHero && (() => {
        const h = inspectHero.hero;
        const targetSlot = inspectHero.targetSlot;
        const cls = CHARACTER_CLASSES[h.classId] || CHARACTER_CLASSES['sharpshooter'] || CHARACTER_CLASSES['squire'];
        const tactic = resolveSiegeTactic(h.trait, cls?.role);
        const imgUrl = getHeroPortraitUrl(h);

        const slotMeta = {
          barrier: {
            name: '차원 왜곡 보호막',
            roleLabel: '수호 결속자 (탱커 권장)',
            icon: '🛡️',
            color: '#00d2ff',
            bgColor: '#00d2ff18',
            borderColor: '#00d2ff77',
            badge: '후열 방어선 (내구&방어 대폭 증폭)'
          },
          left_turret: {
            name: '좌측 공격 포탑',
            roleLabel: '화력 공세 사수 (물리 딜러 권장)',
            icon: '🗼',
            color: '#ff7043',
            bgColor: '#ff704318',
            borderColor: '#ff704377',
            badge: '전열 거점 (포탑+사수 화력 합산 및 요격)'
          },
          right_turret: {
            name: '우측 전술 포탑',
            roleLabel: '전술 방호 사수 (마법/힐러 권장)',
            icon: '🗼',
            color: '#ffd54f',
            bgColor: '#ffd54f18',
            borderColor: '#ffd54f77',
            badge: '전열 거점 (마나&행운 전술 스킬 증폭)'
          },
          operator: {
            name: '수성 오퍼레이터',
            roleLabel: '전술 사령관 (전황 전략 지휘)',
            icon: '📡',
            color: '#ff416c',
            bgColor: '#ff416c18',
            borderColor: '#ff416c77',
            badge: '사령탑 (성향×클래스 고유 수성 전술)'
          }
        }[targetSlot];

        // 1. 차원 보호막 수치 계산
        const baseBarrierHp = 2500 + gateLevel * 250 + totalTowerLv * 175;
        const barrierHpBonus = Math.round(h.maxHp * 0.35 * (1.0 + (tacticalTower.defense?.tier1 || 0) * 0.20));
        const finalBarrierHp = baseBarrierHp + barrierHpBonus;

        const baseBarrierDef = 25 + gateLevel * 2 + (tacticalTower.defense?.tier3 || 0) * 7;
        const barrierDefBonus = Math.round(h.stats.def * 0.5);
        const finalBarrierDef = baseBarrierDef + barrierDefBonus;

        // 2. 좌측 포탑 수치 계산
        const baseTurretHp = 400 + gateLevel * 100 + totalTowerLv * 105;
        const baseTurretDef = 20 + gateLevel * 2 + (tacticalTower.defense?.tier1 || 0) * 4;
        const turretSpd = 12 + (tacticalTower.utility?.tier1 || 0) * 2;
        const leftTurretBaseAtk = 90 + gateLevel * 12 + (tacticalTower.attack?.tier1 || 0) * 15;
        const finalLeftTurretAtk = leftTurretBaseAtk + h.stats.atk;

        // 3. 우측 포탑 수치 계산
        const rightTurretBaseMp = 120;
        const finalRightTurretMp = rightTurretBaseMp + h.maxMp;
        const rightTurretBaseLuck = 10 + (tacticalTower.utility?.tier3 || 0) * 3;
        const finalRightTurretLuck = rightTurretBaseLuck + h.stats.luck;

        // 현재 이미 배정된 상태인지 판정
        const isCurrentBarrier = (modalType ? tempBarrierHeroId === h.id : deck.barrierHeroId === h.id);
        const isCurrentLeft = (modalType ? tempLeftTurretHeroId === h.id : deck.leftTurretHeroId === h.id);
        const isCurrentRight = (modalType ? tempRightTurretHeroId === h.id : deck.rightTurretHeroId === h.id);
        const isCurrentOp = (modalType ? tempOperatorId === h.id : deck.operatorHeroId === h.id);

        const isCurrentlyAssignedToThis =
          (targetSlot === 'barrier' && isCurrentBarrier) ||
          (targetSlot === 'left_turret' && isCurrentLeft) ||
          (targetSlot === 'right_turret' && isCurrentRight) ||
          (targetSlot === 'operator' && isCurrentOp);

        const handleConfirmDeploy = () => {
          if (modalType) {
            if (targetSlot === 'barrier') setTempBarrierHeroId(h.id);
            else if (targetSlot === 'left_turret') setTempLeftTurretHeroId(h.id);
            else if (targetSlot === 'right_turret') setTempRightTurretHeroId(h.id);
            else if (targetSlot === 'operator') setTempOperatorId(h.id);
          } else {
            gm.setDefenseDeck({
              ...deck,
              barrierHeroId: targetSlot === 'barrier' ? h.id : deck.barrierHeroId,
              leftTurretHeroId: targetSlot === 'left_turret' ? h.id : deck.leftTurretHeroId,
              rightTurretHeroId: targetSlot === 'right_turret' ? h.id : deck.rightTurretHeroId,
              operatorHeroId: targetSlot === 'operator' ? h.id : (deck.operatorHeroId || h.id),
            });
          }
          SoundManager.getInstance().play('equip');
          setInspectHero(null);
        };

        const roleKoreanMap: Record<string, string> = {
          tank: '탱커 (방어 수호)',
          dealer_phy: '물리 딜러 (근접 타격)',
          gunner: '사수 (원거리 사격)',
          dealer_mag: '마법 딜러 (비전 폭격)',
          healer: '힐러 (생명 치유)',
          berserker: '버서커 (광폭 공격)',
        };

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in select-none">
            <div
              className="relative w-full max-w-lg bg-[#0a0f1d] border-2 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
              style={{ borderColor: slotMeta.color }}
            >
              {/* 모달 상단 헤더 */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ backgroundColor: slotMeta.bgColor, borderColor: slotMeta.borderColor }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl">{slotMeta.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white flex items-center gap-2 truncate">
                      <span>[{slotMeta.name}] 결속 및 전술 상세 분석</span>
                    </div>
                    <div className="text-[10px] text-[#cfd8e8] truncate">
                      {slotMeta.roleLabel} · {slotMeta.badge}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectHero(null)}
                  className="text-gray-400 hover:text-white p-1 text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 모달 스크롤 바디 */}
              <div className="p-3.5 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">

                {/* 1. 용병 프로필 요약 카드 */}
                <div className="p-3 rounded-xl bg-[#0e1628] border border-[#1f2d48] flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-[#00d2ff] bg-[#070b14] flex items-center justify-center shadow-lg">
                    {imgUrl ? (
                      <img src={imgUrl} alt={h.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{cls?.skills?.[0]?.icon || '⚔️'}</span>
                    )}
                    <span className="absolute bottom-0 right-0 text-[8px] font-mono font-black bg-black/85 px-1 rounded text-[#ffd54f]">
                      Lv.{h.level}
                    </span>
                    <span className="absolute top-0 left-0 text-[7px] font-bold bg-[#ffd54f] text-black px-1 rounded uppercase">
                      {h.grade}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-sm font-black text-white truncate">{h.name}</span>
                        <span className="text-[10px] font-bold text-[#80deea]">({cls?.name})</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#ffd54f15] text-[#ffd54f] border border-[#ffd54f33] shrink-0">
                        {h.trait || '균형잡힌 정예'}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[#8b9bb4] mt-0.5">
                      직업 역할: <strong className="text-white">{roleKoreanMap[cls?.role || 'tank'] || cls?.role}</strong>
                    </div>

                    {/* 스탯 미니 바 */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2 bg-[#080d18] p-1.5 rounded-lg border border-[#162238] text-[9.5px] font-mono">
                      <div>HP <strong className="text-white">{h.maxHp.toLocaleString()}</strong></div>
                      <div>MP <strong className="text-[#64b5f6]">{h.maxMp}</strong></div>
                      <div>ATK <strong className="text-[#ff8a80]">{h.stats.atk}</strong></div>
                      <div>DEF <strong className="text-[#81c784]">{h.stats.def}</strong></div>
                      <div>SPD <strong className="text-[#ffd54f]">{h.stats.spd}</strong></div>
                      <div>LUCK <strong className="text-[#ce93d8]">{h.stats.luck}</strong></div>
                    </div>
                  </div>
                </div>

                {/* 2. 🌟 클래스 × 성향 고유 전술 시스템 (핵심!) */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1b1026] via-[#140c1e] to-[#0c0814] border border-[#ab47bc44] flex flex-col gap-2 shadow">
                  <div className="flex items-center justify-between border-b border-[#ab47bc33] pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🌟</span>
                      <span className="font-extrabold text-xs text-[#e1bee7]">
                        클래스({cls?.name}) × 성향({h.trait}) 고유 전술
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#ab47bc25] text-[#ce93d8] border border-[#ab47bc55] font-mono">
                      {tactic.name}
                    </span>
                  </div>

                  {/* 수성 전술 (방어 핵심) */}
                  <div className="p-2 rounded-lg bg-[#0b0712] border border-[#ff416c44] flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#ff80ab] flex items-center gap-1.5">
                        <span className="text-sm">{tactic.defenseIcon}</span>
                        <span>[수성 핵심 전술] {tactic.defenseSkillName}</span>
                      </span>
                      <span className="text-[9px] font-mono font-bold text-[#ffd54f] bg-[#ffd54f18] px-1.5 py-0.2 rounded border border-[#ffd54f33]">
                        계수 {Math.round(tactic.defensePower * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-[#cfd8e8] leading-relaxed">
                      {tactic.defenseDesc}
                    </p>
                  </div>

                  {/* 공성 침공 전술 (공격 시) */}
                  <div className="p-2 rounded-lg bg-[#080d16] border border-[#00d2ff33] flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#00d2ff] flex items-center gap-1.5">
                        <span className="text-sm">{tactic.siegeIcon}</span>
                        <span>[공성 침공 전술] {tactic.siegeSkillName}</span>
                      </span>
                      <span className="text-[9px] font-mono font-bold text-[#ffd54f] bg-[#ffd54f18] px-1.5 py-0.2 rounded border border-[#ffd54f33]">
                        계수 {Math.round(tactic.siegePower * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8b9bb4] leading-relaxed">
                      {tactic.siegeDesc}
                    </p>
                  </div>
                </div>

                {/* 3. 📊 거점 탑승 시 최종 스펙 비교 (Before ➔ After) */}
                <div
                  className="p-3 rounded-xl border flex flex-col gap-2.5 shadow"
                  style={{ backgroundColor: slotMeta.bgColor, borderColor: slotMeta.borderColor }}
                >
                  <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: slotMeta.borderColor }}>
                    <div className="flex items-center gap-1.5 font-black text-xs text-white">
                      <span>📊</span>
                      <span>[{slotMeta.name}] 탑승 시 최종 수치 변화</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono" style={{ color: slotMeta.color, backgroundColor: '#00000088' }}>
                      {targetSlot === 'barrier' ? '후열 엄호 수호' : targetSlot === 'left_turret' ? '전열 화력 포격' : targetSlot === 'right_turret' ? '전열 전술 지원' : '전황 총괄 지휘'}
                    </span>
                  </div>

                  {/* 세부 슬롯별 수치 비교표 */}
                  {targetSlot === 'barrier' && (
                    <div className="flex flex-col gap-2 text-[10.5px]">
                      <div className="text-[#80deea] text-[10px] leading-relaxed">
                        🛡️ 차원 보호막에 결속되어 후열에서 영지를 엄호합니다. 수호자는 직접 공격하지 않는 대신 자신의 <strong className="text-white">MaxHP(35% 증폭 반영)</strong>와 <strong className="text-white">방어력(50%)</strong>을 영지 전체 보호막에 가산하여 철벽을 형성합니다.
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-black/60 p-2.5 rounded-xl border border-[#00d2ff33]">
                        {/* HP 비교 */}
                        <div className="flex flex-col gap-1 border-r border-[#00d2ff22] pr-2">
                          <span className="text-[10px] font-bold text-[#8b9bb4]">보호막 총 내구도 (HP)</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] text-[#546e7a] line-through font-mono">{baseBarrierHp.toLocaleString()}</span>
                            <span className="text-sm font-black text-white font-mono">{finalBarrierHp.toLocaleString()}</span>
                          </div>
                          <span className="text-[9.5px] font-bold text-[#38ef7d] font-mono">
                            ▲ +{barrierHpBonus.toLocaleString()} HP 증폭!
                          </span>
                        </div>

                        {/* DEF 비교 */}
                        <div className="flex flex-col gap-1 pl-1">
                          <span className="text-[10px] font-bold text-[#8b9bb4]">보호막 방어력 (DEF)</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] text-[#546e7a] line-through font-mono">{baseBarrierDef}</span>
                            <span className="text-sm font-black text-white font-mono">{finalBarrierDef}</span>
                          </div>
                          <span className="text-[9.5px] font-bold text-[#38ef7d] font-mono">
                            ▲ +{barrierDefBonus} DEF 증폭!
                          </span>
                        </div>
                      </div>

                      <div className="text-[9px] text-[#8b9bb4] flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>성벽은 <strong>후열(Back Row)</strong> 판정으로, 전열 포탑들이 건재할 경우 전열 관통/후열 저격 스킬을 제외한 일반 공격으로부터 엄호받습니다.</span>
                      </div>
                    </div>
                  )}

                  {targetSlot === 'left_turret' && (
                    <div className="flex flex-col gap-2 text-[10.5px]">
                      <div className="text-[#ffab91] text-[10px] leading-relaxed">
                        🗼 좌측 전술 포탑에 탑승하여 전열 요격을 전담합니다. 포탑 기본 공격력에 사수의 <strong className="text-white">공격력(ATK 100%)</strong>이 합산되며, 매 턴 타워 요격 사격과 사수의 공격 스킬을 구사합니다.
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-black/60 p-2.5 rounded-xl border border-[#ff704333]">
                        {/* ATK 비교 */}
                        <div className="flex flex-col gap-1 border-r border-[#ff704322] pr-2">
                          <span className="text-[10px] font-bold text-[#8b9bb4]">포탑 총 공격력 (ATK)</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] text-[#546e7a] line-through font-mono">{leftTurretBaseAtk}</span>
                            <span className="text-sm font-black text-white font-mono">{finalLeftTurretAtk}</span>
                          </div>
                          <span className="text-[9.5px] font-bold text-[#ff7043] font-mono">
                            ▲ +{h.stats.atk} 사수 공격력 합산!
                          </span>
                        </div>

                        {/* 포탑 생존 스펙 */}
                        <div className="flex flex-col gap-1 pl-1 font-mono text-[10px]">
                          <span className="text-[#8b9bb4]">포탑 내구 & 속도</span>
                          <div>HP: <strong className="text-white">{baseTurretHp.toLocaleString()}</strong></div>
                          <div>DEF: <strong className="text-[#81c784]">{baseTurretDef}</strong> · SPD: <strong className="text-[#ffd54f]">{turretSpd}</strong></div>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-[#0e0a12] border border-[#ff704322] text-[9.5px]">
                        <strong className="text-[#ffd54f]">🗼 포탑 구사 스킬:</strong>
                        <div className="text-[#cfd8e8] mt-0.5">
                          · [기본 사격] 포탑 요격 사격 (화력 버프 적용)<br />
                          · [사수 스킬] {cls?.skills?.map(s => s.name).join(', ') || '기본 공격'}
                        </div>
                      </div>

                      <div className="text-[9px] text-[#8b9bb4] flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>포탑은 <strong>전열(Front Row)</strong> 판정으로, 적의 전열 특화 스킬 대상이 되며 후열의 성벽을 방패처럼 보호합니다.</span>
                      </div>
                    </div>
                  )}

                  {targetSlot === 'right_turret' && (
                    <div className="flex flex-col gap-2 text-[10.5px]">
                      <div className="text-[#fff59d] text-[10px] leading-relaxed">
                        🗼 우측 전술 포탑에 탑승하여 전열 지원 및 디버프를 전담합니다. 포탑에 사수의 <strong className="text-white">마나(MaxMP)</strong>와 <strong className="text-white">행운(LUCK)</strong>이 가산되어 성벽/포탑 긴급 수복 및 전술 스킬 발동을 극대화합니다.
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-black/60 p-2.5 rounded-xl border border-[#ffd54f33]">
                        {/* MP 비교 */}
                        <div className="flex flex-col gap-1 border-r border-[#ffd54f22] pr-2">
                          <span className="text-[10px] font-bold text-[#8b9bb4]">포탑 최대 마나 (MP)</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] text-[#546e7a] line-through font-mono">{rightTurretBaseMp}</span>
                            <span className="text-sm font-black text-[#64b5f6] font-mono">{finalRightTurretMp}</span>
                          </div>
                          <span className="text-[9.5px] font-bold text-[#64b5f6] font-mono">
                            ▲ +{h.maxMp} 사수 마나 합산!
                          </span>
                        </div>

                        {/* LUCK 비교 */}
                        <div className="flex flex-col gap-1 pl-1">
                          <span className="text-[10px] font-bold text-[#8b9bb4]">포탑 행운 (LUCK)</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[11px] text-[#546e7a] line-through font-mono">{rightTurretBaseLuck}</span>
                            <span className="text-sm font-black text-[#ce93d8] font-mono">{finalRightTurretLuck}</span>
                          </div>
                          <span className="text-[9.5px] font-bold text-[#ce93d8] font-mono">
                            ▲ +{h.stats.luck} 사수 행운 합산!
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-[#0a1018] border border-[#ffd54f22] text-[9.5px]">
                        <strong className="text-[#ffd54f]">🗼 포탑 구사 스킬:</strong>
                        <div className="text-[#cfd8e8] mt-0.5">
                          · [기본 사격] 성역 결계 사격 (방호 마력 방출)<br />
                          · [사수 스킬] {cls?.skills?.map(s => s.name).join(', ') || '전술 지원'}
                        </div>
                      </div>

                      <div className="text-[9px] text-[#8b9bb4] flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>우측 포탑은 <strong>전열(Front Row)</strong>에서 높은 마나와 행운으로 침입자에게 감속/결빙/기절 디버프를 가하고 성벽을 치유합니다.</span>
                      </div>
                    </div>
                  )}

                  {targetSlot === 'operator' && (
                    <div className="flex flex-col gap-2 text-[10.5px]">
                      <div className="text-[#f48fb1] text-[10px] leading-relaxed">
                        📡 수성 사령탑으로 임명되어 매 4턴마다 영지 전체 부대에 전술 명령을 하달합니다. 오퍼레이터의 성향과 클래스 역할이 영지의 방어 전략 성패를 결정짓습니다.
                      </div>

                      <div className="bg-black/60 p-2.5 rounded-xl border border-[#ff416c33] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>{tactic.defenseIcon}</span>
                            <span>{tactic.defenseSkillName}</span>
                          </span>
                          <span className="text-[9.5px] font-mono font-bold text-[#ffd54f]">
                            매 4턴 자동 하달
                          </span>
                        </div>
                        <p className="text-[10px] text-[#cfd8e8]">
                          {tactic.defenseDesc}
                        </p>
                      </div>

                      <div className="text-[9px] text-[#8b9bb4] flex items-center gap-1">
                        <span>ℹ️</span>
                        <span>오퍼레이터는 전장에 직접 전투원으로 서지 않으며, 안전한 사령실에서 아군 방어 부대 전체에 버프를 부여하고 적을 약화시킵니다.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. 용병 보유 스킬 목록 */}
                <div className="p-3 rounded-xl bg-[#0b101c] border border-[#1b273d] flex flex-col gap-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>⚔️</span>
                    <span>{h.name}의 고유 전투 스킬</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(cls?.skills || []).map((sk, idx) => (
                      <div key={`${sk.id}_${idx}`} className="p-2 rounded-lg bg-[#070b14] border border-[#162238] flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px] flex items-center gap-1">
                            <span>{sk.icon || '⚔️'}</span>
                            <span>{sk.name}</span>
                          </span>
                          <span className="text-[9px] font-mono text-[#64b5f6]">{sk.manaCost} MP</span>
                        </div>
                        <span className="text-[9.5px] text-[#8b9bb4] line-clamp-2 leading-relaxed">{sk.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 모달 하단 버튼 */}
              <div className="px-4 py-2.5 bg-[#070b14] border-t border-[#1a253a] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInspectHero(null)}
                  className="btn btn-ghost text-xs px-3.5 py-1.5 text-[#8b9bb4] cursor-pointer"
                >
                  닫기
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeploy}
                  className="btn btn-primary text-xs px-5 py-2 font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  style={{ backgroundColor: slotMeta.color, color: targetSlot === 'right_turret' ? '#000' : '#fff' }}
                >
                  <span>{slotMeta.icon}</span>
                  <span>{isCurrentlyAssignedToThis ? '현재 거점에 배치됨 (확정)' : `이 용병을 [${slotMeta.name}]에 배치`}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
