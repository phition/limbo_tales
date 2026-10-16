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

  return (
    <div className="flex flex-col gap-2.5 p-2 sm:p-3 overflow-y-auto custom-scrollbar animate-fade-in select-none">

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
              보호막에 탱커를 결속하고, 좌/우 타워에 사수를 탑승시키세요.
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

      {/* ════════ 1. 🛡️ 차원 왜곡 보호막 결속 (기본 10,000 HP + 탱커 체력/방어력 전량 합산) ════════ */}
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
            <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#00d2ff25] text-[#00d2ff] border border-[#00d2ff55] shrink-0">
              기본 10,000 HP
            </span>
          </div>
          <span className="text-[11px] text-[#00d2ff] font-bold flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>결속자 변경</span>
            <span>➔</span>
          </span>
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
                {barrierHero ? `용병 HP +${barrierHero.maxHp.toLocaleString()} 전량 합산` : '탱커 배치 권장'}
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

        {/* 🗼 좌측 전술 포탑 (공격 지원 / 기본 공격 버프 특화) */}
        <div
          onClick={() => handleOpenModal('left_turret')}
          className="p-2.5 rounded-2xl bg-[#140e18] border border-[#ff704355] hover:border-[#ff7043] cursor-pointer transition-all flex flex-col gap-2 shadow group relative"
        >
          <div className="flex items-center justify-between border-b border-[#ff704333] pb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-base">🗼</span>
              <span className="font-extrabold text-xs text-white group-hover:text-[#ff7043] transition-colors truncate">
                좌측 포탑 (공격 지원)
              </span>
            </div>
            <span className="text-[10px] text-[#ff7043] font-bold shrink-0">사수 변경 ➔</span>
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
                <span className="text-[9px] font-mono text-[#ff8a80]">
                  ATK {leftTurretHero ? leftTurretHero.stats.atk : 0}
                </span>
              </div>
              <div className="text-[9.5px] font-mono text-[#8b9bb4]">
                내구도: <span className="text-white font-bold">{fortressStats.leftTurretMaxHp.toLocaleString()} HP</span>
              </div>
              <div className="text-[8.5px] text-[#ffd54f] truncate">
                {leftTurretMode === 'focus_bombard' ? '💥 자동 포격 집중' : leftTurretMode === 'slow_field' ? '⚡ 감속 역장' : '⚖️ 공격 버프 (평타 특화)'}
              </div>
            </div>
          </div>
        </div>

        {/* 🗼 우측 전술 포탑 (전술 지원 / 스킬 버프 특화) */}
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
            </div>
            <span className="text-[10px] text-[#00d2ff] font-bold shrink-0">사수 변경 ➔</span>
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
                <span className="text-[9px] font-mono text-[#80deea]">
                  ATK {rightTurretHero ? rightTurretHero.stats.atk : 0}
                </span>
              </div>
              <div className="text-[9.5px] font-mono text-[#8b9bb4]">
                내구도: <span className="text-white font-bold">{fortressStats.rightTurretMaxHp.toLocaleString()} HP</span>
              </div>
              <div className="text-[8.5px] text-[#80deea] truncate">
                {rightTurretMode === 'barrier_regen' ? '🛡️ 결계 수복' : rightTurretMode === 'sanctuary_heal' ? '💚 성역 치유' : '✨ 전술 버프 (스킬 특화)'}
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
          <span className="text-[10px] sm:text-[11px] text-[#ff80ab] font-bold shrink-0">오퍼레이터 변경 ➔</span>
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
              <span className="text-[9px] font-mono text-[#ffd54f] shrink-0">총 Lv.{totalTowerLv} / 27</span>
            </div>
            <div className="text-[10px] text-[#8b9bb4] truncate">
              공격 1~3차(좌측 타워) · 방어 1~3차(보호막) · 유틸 1~3차(스킬 가속)
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
                        if (modalType === 'barrier') setTempBarrierHeroId(h.id);
                        else if (modalType === 'left_turret') setTempLeftTurretHeroId(h.id);
                        else if (modalType === 'right_turret') setTempRightTurretHeroId(h.id);
                        else if (modalType === 'operator') setTempOperatorId(h.id);
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
                            <span className="text-base">{cls?.skills[0]?.icon || '⚔️'}</span>
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

                      <span className="text-[11px] font-mono font-bold shrink-0">
                        {isSelectedForThis ? (
                          <span className="text-[#38ef7d]">✓ 선택됨</span>
                        ) : isOccupiedElsewhere ? (
                          <span className="text-[#607d8b]">배치 불가</span>
                        ) : (
                          <span className="text-[#00d2ff]">선택</span>
                        )}
                      </span>
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

    </div>
  );
};
