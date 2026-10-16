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
  const gateLevel = state.buildings['arenaGate']?.level || 0;
  const isUnlocked = gm.isMasterAccount || gateLevel >= 6;

  // 수비 세팅 데이터 로드
  const { mainHeroes, operatorHero, leftTurretMode, rightTurretMode, deck } = gm.getDefenseDeck();
  const tacticalTower: TacticalTowerState = gm.getTacticalTower();

  // 상세 모달 상태
  const [modalType, setModalType] = useState<'squad' | 'operator' | 'tower' | null>(null);

  // 모달 내부 임시 선택 상태
  const [tempMainIds, setTempMainIds] = useState<string[]>([]);
  const [tempOperatorId, setTempOperatorId] = useState<string>('');
  const [tempLeftMode, setTempLeftMode] = useState<'focus_bombard' | 'slow_field' | 'balanced'>('balanced');
  const [tempRightMode, setTempRightMode] = useState<'barrier_regen' | 'sanctuary_heal' | 'fortress_guard'>('barrier_regen');

  // 오퍼레이터의 수성 전술 산출
  const activeTactic: SiegeTacticDefinition = operatorHero
    ? resolveSiegeTactic(operatorHero.trait, CHARACTER_CLASSES[operatorHero.classId]?.role)
    : resolveSiegeTactic('강철의 수호자', 'tank');

  // 타워 연구 총합 레벨 계산
  const totalTowerLv =
    (tacticalTower.attack?.tier1 || 0) + (tacticalTower.attack?.tier2 || 0) + (tacticalTower.attack?.tier3 || 0) +
    (tacticalTower.defense?.tier1 || 0) + (tacticalTower.defense?.tier2 || 0) + (tacticalTower.defense?.tier3 || 0) +
    (tacticalTower.utility?.tier1 || 0) + (tacticalTower.utility?.tier2 || 0) + (tacticalTower.utility?.tier3 || 0);

  // 차원 보호막 및 2대 타워 예상 내구도 계산
  const calcBarrierHp = Math.max(50000, 35000 + gateLevel * 8000 + totalTowerLv * 3000);
  const calcTurretHp = Math.max(15000, 10000 + gateLevel * 2200 + totalTowerLv * 1200);
  const barrierDef = Math.max(35, 20 + gateLevel * 4 + (tacticalTower.defense?.tier1 || 0) * 8);

  // 모달 열기 핸들러
  const handleOpenModal = (type: 'squad' | 'operator' | 'tower') => {
    setTempMainIds(deck.mainHeroIds);
    setTempOperatorId(deck.operatorHeroId);
    setTempLeftMode(deck.leftTurretMode || 'balanced');
    setTempRightMode(deck.rightTurretMode || 'barrier_regen');
    setModalType(type);
    SoundManager.getInstance().play('click');
  };

  // 모달 저장 핸들러
  const handleSaveModal = () => {
    gm.setDefenseDeck({
      mainHeroIds: tempMainIds.slice(0, 3),
      operatorHeroId: tempOperatorId,
      leftTurretMode: tempLeftMode,
      rightTurretMode: tempRightMode,
    });
    setModalType(null);
    SoundManager.getInstance().play('equip');
  };

  // 자동 편성
  const handleAutoAssign = () => {
    const success = gm.autoAssignDefenseDeck();
    if (success) {
      SoundManager.getInstance().play('equip');
    }
  };

  // 🔒 게이트 미달성 잠금 안내
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0f1d] border border-[#1b253b] rounded-2xl text-center gap-4 animate-fade-in my-3 mx-2">
        <div className="text-5xl p-4 bg-[#ff416c15] border border-[#ff416c33] rounded-3xl text-[#ff416c] animate-pulse">
          🔒
        </div>
        <div>
          <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
            <span>영지 수비 부대 & 방어 타워 셋팅</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]">
              Gate Lv.6 필요
            </span>
          </h3>
          <p className="text-xs text-[#8b9bb4] max-w-md mt-1.5 leading-relaxed">
            차원 앵커 게이트를 <span className="text-[#ffd54f] font-bold">6레벨</span> 이상으로 증축하여 <span className="text-[#00d2ff] font-bold">영지 침공</span>이 개방되면, 내 영지를 적 침략자로부터 수호하는 3인 결사대, 수성 오퍼레이터 및 방어 전술 타워를 조율할 수 있습니다.
          </p>
        </div>
        <div className="text-xs text-[#546e7a] font-mono bg-[#060911] px-4 py-2 rounded-xl border border-[#151f33]">
          현재 차원 게이트: <span className="text-[#00d2ff] font-bold">Lv.{gateLevel}</span> / 6
        </div>
      </div>
    );
  }

  const allAvailableHeroes = [...state.barracks, ...state.party].filter(
    (h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx
  );

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto custom-scrollbar animate-fade-in">
      {/* ── 상단 헤더 & 자동 편성 바 ── */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#121c2e] via-[#0e1626] to-[#1a1124] border border-[#233554] flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-1.5 rounded-xl bg-[#00d2ff18] border border-[#00d2ff44] text-[#00d2ff]">
            🛡️
          </span>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>영지 수비 프로토콜</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]">
                차원 게이트 Lv.{gateLevel}
              </span>
            </div>
            <div className="text-[11px] text-[#8b9bb4]">
              적 침공 시 영지를 수호할 3인 수비대, 수성 오퍼레이터 및 전술 타워를 설정합니다.
            </div>
          </div>
        </div>

        <button
          onClick={handleAutoAssign}
          className="btn btn-ghost text-xs px-3 py-1.5 border border-[#2a3f64] text-[#ffd54f] hover:bg-[#ffd54f15] flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <span>⚡</span>
          <span>자동 최적 수비 셋팅</span>
        </button>
      </div>

      {/* ════════ 1. 🛡️ 수비 결사대 (3인) 설정 요약 카드 ════════ */}
      <div
        onClick={() => handleOpenModal('squad')}
        className="p-3 rounded-2xl bg-[#0d1424] border border-[#1f2d48] hover:border-[#00d2ff] cursor-pointer transition-all flex flex-col gap-2.5 shadow hover:shadow-cyan-950/40 group relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#1b263b] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <span className="font-extrabold text-xs text-white group-hover:text-[#00d2ff] transition-colors">
                수비 결사대 (3인)
              </span>
              <span className="text-[10px] text-[#8b9bb4] ml-2">
                보호막 뒤에서 침입자 요격 사격
              </span>
            </div>
          </div>
          <span className="text-xs text-[#00d2ff] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>편성 변경</span>
            <span>➔</span>
          </span>
        </div>

        {/* 3개 슬롯 미리보기 */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((slotIdx) => {
            const h = mainHeroes[slotIdx];
            const cls = h ? CHARACTER_CLASSES[h.classId] : null;
            const slotPos = slotIdx < 2 ? '전열' : '후열';

            return (
              <div
                key={slotIdx}
                className={`p-2 rounded-xl border flex items-center gap-2 relative ${
                  h
                    ? 'bg-[#121a2c] border-[#223352]'
                    : 'bg-[#090d18] border-dashed border-[#1a253a] opacity-60'
                }`}
              >
                <span className="absolute top-1 right-1.5 text-[8px] font-mono font-bold text-[#8b9bb4]">
                  {slotPos} {slotIdx + 1}
                </span>

                <div className="w-10 h-10 rounded-lg bg-[#0c1220] border border-[#23334d] flex items-center justify-center shrink-0 overflow-hidden text-lg">
                  {h ? (
                    cls?.skills[0]?.icon || '🛡️'
                  ) : (
                    <span className="text-[#3a4d6e] text-xs font-bold">+</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {h ? h.name : '미배치'}
                  </div>
                  <div className="text-[10px] text-[#80deea] font-mono truncate">
                    {h ? `${cls?.name} Lv.${h.level}` : '슬롯을 눌러 배치'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════ 2. 📡 수성 오퍼레이터 & 수성 전술 요약 카드 ════════ */}
      <div
        onClick={() => handleOpenModal('operator')}
        className="p-3 rounded-2xl bg-[#140d1a] border border-[#341b38] hover:border-[#ff416c] cursor-pointer transition-all flex flex-col gap-2.5 shadow hover:shadow-pink-950/40 group relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#2d1730] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <div>
              <span className="font-extrabold text-xs text-white group-hover:text-[#ff80ab] transition-colors">
                수성 오퍼레이터 & 수성 전술
              </span>
              <span className="text-[10px] text-[#8b9bb4] ml-2">
                성향과 클래스 역할로 결정되는 영지 수성 전술
              </span>
            </div>
          </div>
          <span className="text-xs text-[#ff80ab] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>전술 조율</span>
            <span>➔</span>
          </span>
        </div>

        {/* 오퍼레이터 정보 & 전술 배너 */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-[#0e0712] border-2 border-[#ff416c66] flex items-center justify-center shrink-0 overflow-hidden text-2xl shadow">
            {operatorHero ? (
              CHARACTER_CLASSES[operatorHero.classId]?.skills[0]?.icon || '👑'
            ) : (
              <span className="text-[#5b2944] text-xs font-bold">+</span>
            )}
            <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono font-bold bg-black/80 px-1 py-0.1 rounded text-[#ffd54f]">
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
                  <span className="text-[9px] font-bold text-[#ffd54f] px-1.5 py-0.2 rounded bg-[#ffd54f15] border border-[#ffd54f33] font-mono">
                    {activeTactic.trait}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#ce93d8] font-mono shrink-0">
                {operatorHero ? CHARACTER_CLASSES[operatorHero.classId]?.name : '선택 필요'}
              </span>
            </div>

            {/* 발동되는 수성 전술 박스 */}
            <div className="p-1.5 rounded-lg bg-[#0c0510] border border-[#ff416c33] flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm shrink-0">{activeTactic.defenseIcon}</span>
                <span className="font-bold text-[#ff80ab] shrink-0">[{activeTactic.defenseSkillName}]</span>
                <span className="text-[#cfd8e8] truncate">{activeTactic.defenseDesc}</span>
              </div>
              <span className="font-mono font-bold text-[#ffd54f] shrink-0">
                수성 계수 {Math.round(activeTactic.defensePower * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ 3. 🗼 차원 보호막 & 2대 전술 타워 설정 요약 카드 ════════ */}
      <div
        onClick={() => handleOpenModal('tower')}
        className="p-3 rounded-2xl bg-[#0e1828] border border-[#1d2f4d] hover:border-[#ffd54f] cursor-pointer transition-all flex flex-col gap-2.5 shadow hover:shadow-amber-950/40 group relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#1b2b46] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗼</span>
            <div>
              <span className="font-extrabold text-xs text-white group-hover:text-[#ffd54f] transition-colors">
                차원 왜곡 보호막 & 방어 전술 타워
              </span>
              <span className="text-[10px] text-[#ffd54f] ml-2 font-mono">
                총 연구 Lv.{totalTowerLv} / 27
              </span>
            </div>
          </div>
          <span className="text-xs text-[#ffd54f] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>타워 전술 설정</span>
            <span>➔</span>
          </span>
        </div>

        {/* 3대 전술 요소 요약 (보호막 + 좌측 타워 + 우측 타워) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 차원 왜곡 보호막 */}
          <div className="p-2 rounded-xl bg-[#09111c] border border-[#00d2ff33] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#00d2ff]">
              <span className="flex items-center gap-1">
                <span>🛡️</span>
                <span>차원 보호막</span>
              </span>
              <span className="font-mono text-[9px] text-[#cfd8e8]">방어 {barrierDef}</span>
            </div>
            <div className="text-xs font-black text-white font-mono">
              {calcBarrierHp.toLocaleString()} HP
            </div>
            <div className="text-[9px] text-[#8b9bb4] truncate">
              게이트 Lv.{gateLevel} 증폭 가동
            </div>
          </div>

          {/* 좌측 전술 타워 (공격/유틸 계통 연동) */}
          <div className="p-2 rounded-xl bg-[#140e16] border border-[#ff416c33] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#ff7043]">
              <span className="flex items-center gap-1">
                <span>🗼</span>
                <span>좌측 포탑 (공격/유틸)</span>
              </span>
              <span className="font-mono text-[9px]">
                {deck.leftTurretMode === 'focus_bombard' ? '포격 특화' : deck.leftTurretMode === 'slow_field' ? '감속 특화' : '균형 모드'}
              </span>
            </div>
            <div className="text-xs font-black text-white font-mono">
              {calcTurretHp.toLocaleString()} HP
            </div>
            <div className="text-[9px] text-[#8b9bb4] truncate">
              공격 Lv.{(tacticalTower.attack?.tier1 || 0) + (tacticalTower.attack?.tier2 || 0)} · 유틸 Lv.{tacticalTower.utility?.tier1 || 0}
            </div>
          </div>

          {/* 우측 전술 타워 (방어/재생 계통 연동) */}
          <div className="p-2 rounded-xl bg-[#0c1822] border border-[#00d2ff33] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#00d2ff]">
              <span className="flex items-center gap-1">
                <span>🗼</span>
                <span>우측 포탑 (방어/재생)</span>
              </span>
              <span className="font-mono text-[9px]">
                {deck.rightTurretMode === 'barrier_regen' ? '결계 수복' : deck.rightTurretMode === 'sanctuary_heal' ? '성역 치유' : '철벽 수호'}
              </span>
            </div>
            <div className="text-xs font-black text-white font-mono">
              {calcTurretHp.toLocaleString()} HP
            </div>
            <div className="text-[9px] text-[#8b9bb4] truncate">
              방어 Lv.{(tacticalTower.defense?.tier1 || 0) + (tacticalTower.defense?.tier2 || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* ════════ 4. 상세 모달: 수비 결사대 3인 편성 ════════ */}
      {modalType === 'squad' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0d1424] border border-[#243554] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-[#141e33] to-[#0d1424] border-b border-[#1f2d48] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <span className="font-extrabold text-sm text-white">수비 결사대 (3인) 상세 편성</span>
              </div>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white p-1 text-lg">✕</button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
              <div className="text-xs text-[#8b9bb4]">
                차원 왜곡 보호막 뒤에서 침입자를 요격할 3인의 수비 용병을 선택하세요.
              </div>

              {/* 현재 슬롯 3개 */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => {
                  const heroId = tempMainIds[idx];
                  const hero = allAvailableHeroes.find(h => h.id === heroId);
                  const cls = hero ? CHARACTER_CLASSES[hero.classId] : null;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[#223352] bg-[#101726] flex flex-col items-center text-center relative"
                    >
                      <span className="text-[9px] font-mono text-[#00d2ff] mb-1">
                        {idx < 2 ? '전열' : '후열'} {idx + 1}
                      </span>
                      <div className="text-3xl my-1">
                        {cls?.skills[0]?.icon || '🛡️'}
                      </div>
                      <div className="text-xs font-bold text-white truncate w-full">
                        {hero ? hero.name : '미배치'}
                      </div>
                      {hero && (
                        <button
                          onClick={() => setTempMainIds(prev => prev.filter((_, i) => i !== idx))}
                          className="mt-1 text-[8.5px] px-2 py-0.5 rounded bg-red-900/30 text-red-300 border border-red-700/40 hover:bg-red-900/50"
                        >
                          해제
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 보유 용병 리스트에서 선택 */}
              <div className="text-xs font-bold text-white mt-2">보유 용병 목록 (클릭하여 슬롯 배치)</div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {allAvailableHeroes.map(h => {
                  const isAssigned = tempMainIds.includes(h.id);
                  const isOp = tempOperatorId === h.id;
                  const cls = CHARACTER_CLASSES[h.classId];

                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        if (isOp) return;
                        if (isAssigned) {
                          setTempMainIds(prev => prev.filter(id => id !== h.id));
                        } else if (tempMainIds.length < 3) {
                          setTempMainIds(prev => [...prev, h.id]);
                        }
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isOp
                          ? 'bg-[#180e1a] border-[#381c34] opacity-50 cursor-not-allowed'
                          : isAssigned
                          ? 'bg-[#0e243c] border-[#00d2ff]'
                          : 'bg-[#101726] border-[#1e2a40] hover:border-[#00d2ff]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cls?.skills[0]?.icon || '⚔️'}</span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{h.name}</span>
                            <span className="text-[9px] font-mono text-[#ffd54f]">Lv.{h.level}</span>
                            {isOp && <span className="text-[8px] px-1 py-0.2 rounded bg-pink-900/30 text-pink-300">오퍼레이터</span>}
                          </div>
                          <div className="text-[10px] text-[#8b9bb4]">
                            {cls?.name} · 방어 {h.stats.def} · 체력 {h.maxHp}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono">
                        {isAssigned ? '선택됨' : tempMainIds.length < 3 ? '+ 배치' : '슬롯 가득참'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-4 py-3 bg-[#0a0f1d] border-t border-[#1f2d48] flex items-center justify-end gap-2">
              <button onClick={() => setModalType(null)} className="btn btn-ghost text-xs px-4 py-2 text-[#8b9bb4]">취소</button>
              <button onClick={handleSaveModal} className="btn btn-primary text-xs px-6 py-2.5 font-bold">수비대 설정 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ 5. 상세 모달: 수성 오퍼레이터 & 수성 전술 조율 ════════ */}
      {modalType === 'operator' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0d1424] border border-[#243554] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-[#24101e] to-[#0d1424] border-b border-[#2d1828] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <span className="font-extrabold text-sm text-white">수성 오퍼레이터 & 수성 전술 조율</span>
              </div>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white p-1 text-lg">✕</button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
              <div className="text-xs text-[#8b9bb4]">
                수성 오퍼레이터로 임명된 용병의 <span className="text-[#ffd54f] font-bold">개인 성향(8종)</span>과 <span className="text-[#00d2ff] font-bold">클래스 역할(6종)</span>이 조합되어 영지의 핵심 수성 전술이 발동됩니다.
              </div>

              {/* 현재 선택된 오퍼레이터 전술 프리뷰 */}
              {(() => {
                const currentOp = allAvailableHeroes.find(h => h.id === tempOperatorId);
                const tactic = currentOp
                  ? resolveSiegeTactic(currentOp.trait, CHARACTER_CLASSES[currentOp.classId]?.role)
                  : resolveSiegeTactic('강철의 수호자', 'tank');

                return (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#200c19] via-[#170812] to-[#0d040a] border-2 border-[#ff416c88] shadow-lg flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{tactic.defenseIcon}</span>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>수성 전술: [{tactic.defenseSkillName}]</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ff416c22] text-[#ff80ab] border border-[#ff416c44]">
                              {tactic.trait}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#ce93d8]">
                            {currentOp ? `${currentOp.name} (${CHARACTER_CLASSES[currentOp.classId]?.name})` : '오퍼레이터를 선택해주세요'}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#ffd54f]">
                        수성 계수 {Math.round(tactic.defensePower * 100)}%
                      </span>
                    </div>

                    <p className="text-[11px] text-[#cfd8e8] bg-black/40 p-2 rounded-xl border border-white/10 leading-relaxed">
                      {tactic.defenseDesc}
                    </p>
                  </div>
                );
              })()}

              {/* 보유 용병 중 오퍼레이터 선택 리스트 */}
              <div className="text-xs font-bold text-white mt-1">오퍼레이터 후보 용병 선택</div>
              <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                {allAvailableHeroes.map(h => {
                  const isSelected = tempOperatorId === h.id;
                  const isMain = tempMainIds.includes(h.id);
                  const cls = CHARACTER_CLASSES[h.classId];
                  const previewTactic = resolveSiegeTactic(h.trait, cls?.role);

                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        if (isMain) return;
                        setTempOperatorId(h.id);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isMain
                          ? 'bg-[#101726]/40 border-[#1e2a40] opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#2b1022] border-[#ff416c] shadow-[0_0_12px_rgba(255,65,108,0.5)]'
                          : 'bg-[#120914] border-[#291726] hover:border-[#ff416c]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">{previewTactic.defenseIcon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-black text-white truncate">{h.name}</span>
                            <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-amber-900/30 text-amber-300 border border-amber-700/40">
                              {h.trait || '균형잡힌 정예'}
                            </span>
                            {isMain && <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-900/30 text-cyan-300">수비대 참여 중</span>}
                          </div>
                          <div className="text-[10px] text-[#ff80ab] truncate mt-0.5">
                            전술: [{previewTactic.defenseSkillName}] - {previewTactic.name}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold shrink-0">
                        {isSelected ? '✓ 지정됨' : isMain ? '수비대 중복' : '선택'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-4 py-3 bg-[#0a0f1d] border-t border-[#1f2d48] flex items-center justify-end gap-2">
              <button onClick={() => setModalType(null)} className="btn btn-ghost text-xs px-4 py-2 text-[#8b9bb4]">취소</button>
              <button onClick={handleSaveModal} className="btn btn-primary text-xs px-6 py-2.5 font-bold">오퍼레이터 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ 6. 상세 모달: 차원 보호막 & 2대 전술 타워 조율 ════════ */}
      {modalType === 'tower' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0d1424] border border-[#243554] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-[#172238] to-[#0d1424] border-b border-[#213454] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗼</span>
                <span className="font-extrabold text-sm text-white">차원 보호막 & 전술 타워 작전 설정</span>
              </div>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white p-1 text-lg">✕</button>
            </div>

            <div className="p-4 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar">
              {/* 차원 보호막 개요 */}
              <div className="p-3 rounded-2xl bg-[#091424] border border-[#00d2ff44] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#00d2ff]">
                  <span className="flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>차원 왜곡 보호막 기본 제원</span>
                  </span>
                  <span className="text-white font-mono">{calcBarrierHp.toLocaleString()} HP</span>
                </div>
                <div className="text-[11px] text-[#8b9bb4] leading-relaxed">
                  차원 게이트 <span className="text-white font-bold">Lv.{gateLevel}</span> 및 방어 전술 타워 연구치(<span className="text-[#ffd54f] font-bold">총 Lv.{totalTowerLv}</span>)와 연동되어 방어력 {barrierDef}의 에너지 역장을 형성합니다.
                </div>
              </div>

              {/* 좌측 전술 타워 (공격/유틸 계통) 작전 모드 */}
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold text-[#ff7043] flex items-center justify-between">
                  <span>🗼 좌측 전술 포탑 작전 모드 (공격/유틸 연동)</span>
                  <span className="text-[10px] font-mono text-[#8b9bb4]">
                    공격 Lv.{(tacticalTower.attack?.tier1 || 0) + (tacticalTower.attack?.tier2 || 0)} · 유틸 Lv.{tacticalTower.utility?.tier1 || 0}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'balanced', label: '균형 모드', icon: '⚖️', desc: '자동 포격과 감속 역장을 고르게 가동' },
                    { key: 'focus_bombard', label: '포격 특화', icon: '💥', desc: '매 라운드 자동 포격 위력 25% 추가 증폭' },
                    { key: 'slow_field', label: '감속 역장', icon: '⚡', desc: '침입자 전체 속도(SPD) 추가 2 감속' },
                  ].map(m => (
                    <div
                      key={m.key}
                      onClick={() => setTempLeftMode(m.key as any)}
                      className={`p-2 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                        tempLeftMode === m.key
                          ? 'bg-[#2b1414] border-[#ff7043] shadow-[0_0_10px_rgba(255,112,67,0.4)]'
                          : 'bg-[#10141d] border-[#1e2636] hover:border-[#ff7043]/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </div>
                      <div className="text-[9.5px] text-[#8b9bb4] leading-tight">
                        {m.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 우측 전술 타워 (방어/재생 계통) 작전 모드 */}
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold text-[#00d2ff] flex items-center justify-between">
                  <span>🗼 우측 전술 포탑 작전 모드 (방어/재생 연동)</span>
                  <span className="text-[10px] font-mono text-[#8b9bb4]">
                    방어 Lv.{(tacticalTower.defense?.tier1 || 0) + (tacticalTower.defense?.tier2 || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'barrier_regen', label: '결계 수복', icon: '🛡️', desc: '매 라운드 보호막 내구도 지속 복원' },
                    { key: 'sanctuary_heal', label: '성역 치유', icon: '💚', desc: '수비대 전체 체력 매 턴 3% 재생' },
                    { key: 'fortress_guard', label: '철벽 수호', icon: '🏰', desc: '차원 보호막 기본 방어력 15 증가' },
                  ].map(m => (
                    <div
                      key={m.key}
                      onClick={() => setTempRightMode(m.key as any)}
                      className={`p-2 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                        tempRightMode === m.key
                          ? 'bg-[#0f2334] border-[#00d2ff] shadow-[0_0_10px_rgba(0,210,255,0.4)]'
                          : 'bg-[#10141d] border-[#1e2636] hover:border-[#00d2ff]/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </div>
                      <div className="text-[9.5px] text-[#8b9bb4] leading-tight">
                        {m.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 영지 침공 연구소 바로가기 안내 */}
              {onNavigateToTowerResearch && (
                <div className="p-2.5 rounded-xl bg-[#0b101c] border border-[#1b273d] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>🔬</span>
                      <span>방어 전술 타워 테크 연구소</span>
                    </div>
                    <div className="text-[10px] text-[#8b9bb4]">
                      심연 자원을 소모하여 3대 전술(공격/방어/유틸)을 영구 강화합니다.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setModalType(null);
                      onNavigateToTowerResearch();
                    }}
                    className="btn btn-ghost text-xs px-3 py-1.5 border border-[#293d62] text-[#00d2ff]"
                  >
                    연구소로 이동 ➔
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-[#0a0f1d] border-t border-[#1f2d48] flex items-center justify-end gap-2">
              <button onClick={() => setModalType(null)} className="btn btn-ghost text-xs px-4 py-2 text-[#8b9bb4]">취소</button>
              <button onClick={handleSaveModal} className="btn btn-primary text-xs px-6 py-2.5 font-bold">타워 전술 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
