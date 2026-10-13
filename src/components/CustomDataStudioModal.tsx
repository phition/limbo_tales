import React, { useState, useMemo } from 'react';
import { GameDataService, CustomGameDataPackage } from '../services/GameDataService';
import { MONSTERS } from '../data/monsters';
import { BUILDING_BASE_COSTS, INITIAL_BUILDINGS } from '../data/buildings';
import { FORGE_ITEM_BASE_COSTS } from '../data/equipment';
import { INITIAL_HEROES_CONFIG } from '../data/mercenaries';
import { ALL_SKILL_BOOKS, MARKET_SKILL_BOOKS, BOSS_EXCLUSIVE_SKILL_BOOKS, getDroppableMonsterSkillBooks, DroppableMonsterSkillBookDef } from '../data/skillBooks';
import { CHARACTER_CLASSES } from '../data/classes';
import { NEMESIS_BOSS_CONFIG, NemesisBossConfig, NemesisBossSkill } from '../data/nemesis';
import { BuildingId, GameResources } from '../types/game';
import { GameBalanceConfig } from '../services/GameDataService';
import { GameIcon } from './GameIcon';

interface Props {
  open: boolean;
  onClose: () => void;
}

type StudioTab = 'buildings' | 'forge' | 'monsters' | 'nemesis' | 'classes' | 'skills' | 'grimoires' | 'balance';

export const CustomDataStudioModal: React.FC<Props> = ({ open, onClose }) => {
  const gds = GameDataService.getInstance();
  const [activeTab, setActiveTab] = useState<StudioTab>('buildings');
  const [grimoireSubTab, setGrimoireSubTab] = useState<'all' | 'standard' | 'monster'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 로컬 편집 상태 복사본
  const [overrides, setOverrides] = useState<CustomGameDataPackage>(() => gds.getCustomOverrides());
  const droppableMonsterBooks = useMemo(() => getDroppableMonsterSkillBooks(MONSTERS), []);

  if (!open) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. 건물 건축/강화 소모재료 변경
  const handleBuildingCostChange = (bId: string, resKey: keyof GameResources, val: number) => {
    setOverrides(prev => {
      const nextBuildingCosts = { ...(prev.buildingBaseCosts || {}) };
      const currentObj = { ...(BUILDING_BASE_COSTS[bId as BuildingId] || {}), ...(nextBuildingCosts[bId] || {}) };
      currentObj[resKey] = Math.max(0, val);
      nextBuildingCosts[bId] = currentObj;
      return { ...prev, buildingBaseCosts: nextBuildingCosts };
    });
    setHasChanges(true);
  };

  // 2. 단조 장비 기초 자원 소모량 변경
  const handleForgeCostChange = (itemKey: string, resKey: keyof GameResources, val: number) => {
    setOverrides(prev => {
      const nextForgeCosts = { ...(prev.forgeItemBaseCosts || {}) };
      const currentObj = { ...(FORGE_ITEM_BASE_COSTS[itemKey] || {}), ...(nextForgeCosts[itemKey] || {}) };
      currentObj[resKey] = Math.max(0, val);
      nextForgeCosts[itemKey] = currentObj;
      return { ...prev, forgeItemBaseCosts: nextForgeCosts };
    });
    setHasChanges(true);
  };

  // 3. 몬스터 스탯 변경
  const handleMonsterStatChange = (monId: string, statKey: 'maxHp' | 'atk' | 'def' | 'spd' | 'luck', val: number) => {
    setOverrides(prev => {
      const nextMonsters = { ...(prev.monsters || {}) };
      const currentObj = { ...(MONSTERS[monId] || {}), ...(nextMonsters[monId] || {}) };
      currentObj[statKey] = Math.max(1, val);
      nextMonsters[monId] = currentObj;
      return { ...prev, monsters: nextMonsters };
    });
    setHasChanges(true);
  };

  // 4. 각 클래스 초기 스탯 변경
  const handleClassBaseStatChange = (classId: string, statKey: 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck', val: number) => {
    setOverrides(prev => {
      const nextClassStats = { ...(prev.classBaseStats || {}) };
      const cur = { ...(CHARACTER_CLASSES[classId]?.baseStats || {}), ...(nextClassStats[classId] || {}) };
      cur[statKey] = Math.max(1, val);
      nextClassStats[classId] = cur;
      return { ...prev, classBaseStats: nextClassStats };
    });
    setHasChanges(true);
  };

  // 5. 직업 스킬 수치 변경
  const handleClassSkillChange = (skillId: string, field: 'power' | 'manaCost' | 'cooldown', val: number) => {
    setOverrides(prev => {
      const nextSkills = { ...(prev.classSkills || {}) };
      const cur = nextSkills[skillId] || {};
      nextSkills[skillId] = { ...cur, [field]: Math.max(0, val) };
      return { ...prev, classSkills: nextSkills };
    });
    setHasChanges(true);
  };

  // 6. 마도서 수치 변경
  const handleSkillBookChange = (bookId: string, field: 'power' | 'manaCost' | 'cooldown' | 'costGold', val: number) => {
    setOverrides(prev => {
      const nextBooks = { ...(prev.skillBooks || {}) };
      const cur = nextBooks[bookId] || {};
      nextBooks[bookId] = { ...cur, [field]: Math.max(0, val) };
      return { ...prev, skillBooks: nextBooks };
    });
    setHasChanges(true);
  };

  // 6-1. 마도서/스킬 설명 변경
  const handleSkillBookDescChange = (bookId: string, desc: string) => {
    setOverrides(prev => {
      const nextBooks = { ...(prev.skillBooks || {}) };
      const cur = nextBooks[bookId] || {};
      nextBooks[bookId] = { ...cur, description: desc };
      return { ...prev, skillBooks: nextBooks };
    });
    setHasChanges(true);
  };

  // 6-2. 🌌 차원 네메시스 보스 기본 정보/스탯 변경
  const handleNemesisStatChange = (statKey: 'maxHp' | 'atk' | 'def' | 'spd' | 'luck', val: number) => {
    setOverrides(prev => {
      const nextNemesis = { ...(prev.nemesis || {}) };
      nextNemesis[statKey] = Math.max(1, val);
      return { ...prev, nemesis: nextNemesis };
    });
    setHasChanges(true);
  };

  const handleNemesisInfoChange = (field: 'name' | 'title', val: string) => {
    setOverrides(prev => {
      const nextNemesis = { ...(prev.nemesis || {}) };
      nextNemesis[field] = val;
      return { ...prev, nemesis: nextNemesis };
    });
    setHasChanges(true);
  };

  // 6-3. 🌌 네메시스 보유 스킬 변경
  const handleNemesisSkillChange = (skillId: string, field: 'power' | 'target' | 'name' | 'desc', val: any) => {
    setOverrides(prev => {
      const curNemesis = prev.nemesis || {};
      const currentSkills = [
        ...(curNemesis.skills || NEMESIS_BOSS_CONFIG.skills.map(s => ({ ...s })))
      ];
      const targetIdx = currentSkills.findIndex(s => s.id === skillId);
      if (targetIdx >= 0) {
        currentSkills[targetIdx] = {
          ...currentSkills[targetIdx],
          [field]: field === 'power' ? Math.max(0.1, Number(val)) : val
        };
      }
      return {
        ...prev,
        nemesis: { ...curNemesis, skills: currentSkills }
      };
    });
    setHasChanges(true);
  };

  // 6-4. 🌌 네메시스 페이즈 임계치 및 정보 변경
  const handleNemesisPhaseChange = (phaseNum: number, field: 'name' | 'threshold' | 'desc', val: any) => {
    setOverrides(prev => {
      const curNemesis = prev.nemesis || {};
      const currentPhases = [
        ...(curNemesis.phases || NEMESIS_BOSS_CONFIG.phases.map(p => ({ ...p })))
      ];
      const targetIdx = currentPhases.findIndex(p => p.phase === phaseNum);
      if (targetIdx >= 0) {
        currentPhases[targetIdx] = {
          ...currentPhases[targetIdx],
          [field]: field === 'threshold' ? Math.max(0.01, Math.min(1.0, Number(val))) : val
        };
      }
      return {
        ...prev,
        nemesis: { ...curNemesis, phases: currentPhases }
      };
    });
    setHasChanges(true);
  };

  // 6-5. ⚖️ 글로벌 밸런스 계수 변경
  const handleBalanceChange = (field: keyof GameBalanceConfig, val: number) => {
    setOverrides(prev => {
      const nextBalance = { ...(prev.balance || {}) };
      nextBalance[field] = Math.max(0.01, Number(val));
      return { ...prev, balance: nextBalance };
    });
    setHasChanges(true);
  };

  // 7. 배포 및 저장
  const handleSaveAndDeploy = async () => {
    setIsSaving(true);
    gds.applyCustomPackage(overrides, true);
    const res = await gds.saveCustomDataToServer();
    setIsSaving(false);
    setHasChanges(false);
    if (res.success) {
      showToast('🚀 데이터 스튜디오 설정이 배포 파일(custom_game_data.json)과 인게임에 성공적으로 적용되었습니다!');
    } else {
      showToast('💾 브라우저 및 인게임에 즉시 적용되었습니다! (배포 파일 미연결 시 로컬 보관)');
    }
  };

  // 8. 초기화
  const handleResetToDefault = () => {
    if (!window.confirm('모든 수치 편집 내역을 기본 상태로 초기화하시겠습니까?')) return;
    setOverrides({});
    gds.applyCustomPackage({}, true);
    setHasChanges(true);
    showToast('🔄 모든 수치가 원본 기본값으로 초기화되었습니다. [배포용 저장]을 누르면 영구 적용됩니다.');
  };

  // 9. JSON 내보내기/가져오기
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(overrides, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `limbo_game_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 밸런스 설정 JSON이 다운로드되었습니다.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setOverrides(parsed);
        setHasChanges(true);
        showToast('📂 밸런스 JSON 데이터를 불러왔습니다. 확인 후 [배포용 저장]을 눌러주세요.');
      } catch {
        showToast('⚠️ 유효하지 않은 JSON 파일 형식입니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-[#1a2936] text-[#00d2ff] border border-[#00d2ff88] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0c101d] border border-[#1f2d48] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[#cfd8e8] z-10">
        
        {/* 모달 헤더 */}
        <div className="px-4 py-3 bg-[#111728] border-b border-[#1f2d48] flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl p-1.5 rounded-xl bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] shrink-0">
              📊
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>마스터 데이터 스튜디오</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] font-bold">
                  MASTER DATA v1.0
                </span>
                {hasChanges && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff980025] text-[#ffb74d] border border-[#ff980055] animate-pulse">
                    ⚠️ 미반영 변경 사항 있음
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#8b9bb4] truncate">
                건물 소모 자원, 단조/강화 비용, 마물 스탯, 초기 용병, 스킬/마도서 위력을 실시간 편집하고 배포 파일에 적용합니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="btn btn-ghost text-xs px-2.5 py-1 text-[#8b9bb4] hover:text-white border border-[#273650]"
              onClick={handleExportJson}
              title="JSON 내보내기"
            >
              📥 내보내기
            </button>
            <label className="btn btn-ghost text-xs px-2.5 py-1 text-[#8b9bb4] hover:text-white border border-[#273650] cursor-pointer">
              📂 가져오기
              <input type="file" accept=".json" className="hidden" onChange={handleImportJson} />
            </label>
            <button
              className="btn btn-ghost text-xs px-2.5 py-1 text-[#ef5350] hover:text-red-300 border border-[#ef535044]"
              onClick={handleResetToDefault}
              title="기본값 복원"
            >
              🔄 초기화
            </button>
            <button
              className={`btn text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5 transition-all shadow-md ${
                hasChanges
                  ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white animate-pulse shadow-[#10b98155]'
                  : 'bg-[#1b263b] text-[#8b9bb4] hover:text-white border border-[#273650]'
              }`}
              onClick={handleSaveAndDeploy}
              disabled={isSaving}
            >
              <span>🚀</span>
              <span>{isSaving ? '배포 저장 중...' : '배포용 저장 & 적용'}</span>
            </button>
            <button
              className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg"
              style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
              onClick={onClose}
            >
              <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-1 px-4 pt-2 pb-2 bg-[#090d16] border-b border-[#1a2336] shrink-0 overflow-x-auto">
          {[
            { key: 'buildings', icon: '🏛️', label: '건물 건설/강화 자원' },
            { key: 'forge', icon: '⚒️', label: '단조 장비 소모 자원' },
            { key: 'monsters', icon: '👾', label: '마물/보스 능력치' },
            { key: 'nemesis', icon: '🌌', label: '차원 네메시스 보스' },
            { key: 'classes', icon: '🎖️', label: '클래스 초기 스탯' },
            { key: 'skills', icon: '⚡', label: '직업 고유 스킬' },
            { key: 'grimoires', icon: '📖', label: '마도서/비전서 위력' },
            { key: 'balance', icon: '⚖️', label: '글로벌 밸런스' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.key
                  ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff66]'
                  : 'bg-transparent text-[#8b9bb4] hover:text-white hover:bg-[#131b2e]'
              }`}
              onClick={() => setActiveTab(tab.key as StudioTab)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          <div className="ml-auto min-w-[160px] max-w-[220px]">
            <input
              type="text"
              placeholder="🔍 검색 (이름, ID)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#111728] border border-[#1f2d48] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#4a5568] focus:border-[#00d2ff] focus:outline-none"
            />
          </div>
        </div>

        {/* 탭 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* 1. 🏛️ 건물 건설/강화 소모 자원 */}
          {activeTab === 'buildings' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4]">
                💡 각 건물의 기초 건설/강화 베이스 요구 자원을 수정합니다. 레벨별 계수 공식이 이 기초값을 기준으로 계산됩니다.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(INITIAL_BUILDINGS)
                  .filter(([id, b]) => !searchQuery || b.name.includes(searchQuery) || id.includes(searchQuery))
                  .map(([bId, b]) => {
                    const currentCost = {
                      ...(BUILDING_BASE_COSTS[bId as BuildingId] || {}),
                      ...(overrides.buildingBaseCosts?.[bId] || {})
                    };
                    const resKeys: (keyof GameResources)[] = ['wood', 'stone', 'iron', 'gold', 'ether', 'herb'];
                    return (
                      <div key={bId} className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{b.icon}</span>
                            <span>{b.name}</span>
                            <span className="text-[10px] text-[#607d8b] font-mono">({bId})</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {resKeys.map(rk => {
                            const val = currentCost[rk] || 0;
                            const resLabels: Record<string, string> = {
                              wood: '🪵 목재', stone: '🪨 석재', iron: '⚙️ 철광석',
                              gold: '🪙 골드', ether: '✨ 에테르', herb: '🌿 약초'
                            };
                            return (
                              <div key={rk} className="bg-[#141c2c] p-1.5 rounded-lg border border-[#1a2438]">
                                <label className="text-[10px] text-[#8b9bb4] block mb-0.5">{resLabels[rk] || rk}</label>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={e => handleBuildingCostChange(bId, rk, Number(e.target.value))}
                                  className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 2. ⚒️ 단조 장비 소모 자원 */}
          {activeTab === 'forge' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4]">
                💡 대장간(병기창)에서 단조하는 무기/방어구/장신구의 베이스 자원 소모량을 편집합니다. (티어별 1배~11.5배 스케일링 기본 적용)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(FORGE_ITEM_BASE_COSTS)
                  .filter(([key]) => !searchQuery || key.includes(searchQuery))
                  .map(([itemKey, base]) => {
                    const currentCost = { ...base, ...(overrides.forgeItemBaseCosts?.[itemKey] || {}) };
                    const resKeys: (keyof GameResources)[] = ['gold', 'iron', 'wood', 'stone', 'leather', 'bone', 'coal', 'silk', 'ether', 'crystal', 'herb'];
                    return (
                      <div key={itemKey} className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#00d2ff] capitalize">
                            ⚔️ {itemKey}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {resKeys.map(rk => {
                            const val = currentCost[rk] || 0;
                            if (val === 0 && !base[rk]) return null;
                            const resLabels: Record<string, string> = {
                              gold: '🪙 골드', iron: '⚙️ 철광석', wood: '🪵 목재', stone: '🪨 석재',
                              leather: '🟫 가죽', bone: '🦴 뼈', coal: '⬛ 석탄', silk: '🕸️ 비단',
                              ether: '✨ 에테르', crystal: '🔮 수정', herb: '🌿 약초'
                            };
                            return (
                              <div key={rk} className="bg-[#141c2c] p-1.5 rounded-lg border border-[#1a2438]">
                                <label className="text-[10px] text-[#8b9bb4] block mb-0.5">{resLabels[rk] || rk}</label>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={e => handleForgeCostChange(itemKey, rk, Number(e.target.value))}
                                  className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 3. 👾 마물/보스 능력치 */}
          {activeTab === 'monsters' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4]">
                💡 심연 1~11층 마물 및 보스의 기본 체력, 공격력, 방어력, 속도, 행운 수치를 편집합니다.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(MONSTERS)
                  .filter(([id, m]) => !searchQuery || m.name.includes(searchQuery) || id.includes(searchQuery))
                  .map(([monId, m]) => {
                    const current = { ...m, ...(overrides.monsters?.[monId] || {}) };
                    return (
                      <div key={monId} className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{m.type === 'boss' ? '👑' : '👾'}</span>
                            <span>{current.name}</span>
                            <span className="text-[10px] text-[#607d8b]">Lv.{current.level}</span>
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${m.type === 'boss' ? 'bg-[#ff416c22] text-[#ff416c]' : 'bg-[#00d2ff22] text-[#00d2ff]'}`}>
                            {m.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {(['maxHp', 'atk', 'def', 'spd', 'luck'] as const).map(statKey => {
                            const statLabels: Record<string, string> = { maxHp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', luck: 'LUCK' };
                            return (
                              <div key={statKey} className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                                <label className="text-[9px] text-[#8b9bb4] block">{statLabels[statKey]}</label>
                                <input
                                  type="number"
                                  value={current[statKey] || 0}
                                  onChange={e => handleMonsterStatChange(monId, statKey, Number(e.target.value))}
                                  className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 3-2. 🌌 차원 네메시스 보스 설정 */}
          {activeTab === 'nemesis' && (() => {
            const curNemesis: NemesisBossConfig = {
              ...NEMESIS_BOSS_CONFIG,
              ...(overrides.nemesis || {}),
              phases: (overrides.nemesis?.phases || NEMESIS_BOSS_CONFIG.phases).map(p => ({ ...p })),
              skills: (overrides.nemesis?.skills || NEMESIS_BOSS_CONFIG.skills).map(s => ({ ...s }))
            };

            const formatHpKorean = (hp: number) => {
              if (hp >= 100000000) return `${(hp / 100000000).toFixed(1)}억`;
              if (hp >= 10000) return `${(hp / 10000).toLocaleString()}만`;
              return hp.toLocaleString();
            };

            return (
              <div className="space-y-4">
                <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌌</span>
                    <span>차원 앵커 게이트(Lv.3+)에서 등장하는 서버급 월드 레이드 보스 <strong>「시공의 침식자, 네메시스」</strong>의 기본 전투 스탯, 3단계 페이즈 전환 임계치, 4종 고유 스킬을 실시간 편집합니다.</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#9c27b022] text-[#ce93d8] border border-[#9c27b044] font-bold">
                    WORLD RAID BOSS
                  </span>
                </div>

                {/* 네메시스 헤더 요약 카드 */}
                <div className="p-4 bg-gradient-to-r from-[#170e28] via-[#101426] to-[#0d1624] border border-[#9c27b055] rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-xl">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#ce93d888] shadow-lg shrink-0 relative">
                    <img src="assets/void_overlord.jpg" alt="Nemesis" className="w-full h-full object-cover scale-110" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-center font-bold text-[#ce93d8] py-0.5">
                      BOSS
                    </span>
                  </div>
                  <div className="flex-1 space-y-1 text-center md:text-left min-w-0">
                    <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                      <span className="text-base font-extrabold text-white">{curNemesis.name}</span>
                      <span className="text-xs text-[#ce93d8] font-bold">[{curNemesis.title}]</span>
                    </div>
                    <div className="text-xs text-[#8b9bb4]">
                      기초 체력: <span className="text-[#00d2ff] font-bold font-mono">{curNemesis.maxHp.toLocaleString()} HP</span> ({formatHpKorean(curNemesis.maxHp)}) | 
                      공격력: <span className="text-[#ff7043] font-bold font-mono">{curNemesis.atk}</span> | 
                      방어력: <span className="text-[#66bb6a] font-bold font-mono">{curNemesis.def}</span> | 
                      속도: <span className="text-[#ffd54f] font-bold font-mono">{curNemesis.spd}</span> | 
                      행운: <span className="text-[#ce93d8] font-bold font-mono">{curNemesis.luck}</span>
                    </div>
                  </div>
                </div>

                {/* 1. 보스 기본 정보 & 스탯 편집 */}
                <div className="p-4 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-[#00d2ff] flex items-center gap-1.5">
                    <span>⚔️</span>
                    <span>1. 네메시스 기본 정보 & 전투 스탯 (Base Combat Stats)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#141c2c] p-2 rounded-lg border border-[#1a2438]">
                      <label className="text-[10px] text-[#8b9bb4] block mb-1">보스 명칭</label>
                      <input
                        type="text"
                        value={curNemesis.name}
                        onChange={e => handleNemesisInfoChange('name', e.target.value)}
                        className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-bold focus:border-[#00d2ff] focus:outline-none"
                      />
                    </div>
                    <div className="bg-[#141c2c] p-2 rounded-lg border border-[#1a2438]">
                      <label className="text-[10px] text-[#8b9bb4] block mb-1">보스 칭호</label>
                      <input
                        type="text"
                        value={curNemesis.title}
                        onChange={e => handleNemesisInfoChange('title', e.target.value)}
                        className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white focus:border-[#00d2ff] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="bg-[#141c2c] p-2 rounded-lg border border-[#1a2438] col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-[#8b9bb4]">최대 체력 (HP)</label>
                        <span className="text-[9px] text-[#00d2ff] font-mono font-bold">({formatHpKorean(curNemesis.maxHp)})</span>
                      </div>
                      <input
                        type="number"
                        step="100000"
                        value={curNemesis.maxHp}
                        onChange={e => handleNemesisStatChange('maxHp', Number(e.target.value))}
                        className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono font-bold focus:border-[#00d2ff] focus:outline-none"
                      />
                    </div>
                    <div className="bg-[#141c2c] p-2 rounded-lg border border-[#1a2438]">
                      <label className="text-[10px] text-[#8b9bb4] block mb-1">공격력 (ATK)</label>
                      <input
                        type="number"
                        value={curNemesis.atk}
                        onChange={e => handleNemesisStatChange('atk', Number(e.target.value))}
                        className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                      />
                    </div>
                    <div className="bg-[#141c2c] p-2 rounded-lg border border-[#1a2438]">
                      <label className="text-[10px] text-[#8b9bb4] block mb-1">방어력 (DEF)</label>
                      <input
                        type="number"
                        value={curNemesis.def}
                        onChange={e => handleNemesisStatChange('def', Number(e.target.value))}
                        className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                      />
                    </div>
                    <div className="bg-[#141c2c] p-2 rounded-lg border border-[#1a2438]">
                      <label className="text-[10px] text-[#8b9bb4] block mb-1">속도 (SPD)</label>
                      <input
                        type="number"
                        value={curNemesis.spd}
                        onChange={e => handleNemesisStatChange('spd', Number(e.target.value))}
                        className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                      />
                    </div>
                    <div className="bg-[#141c2c] p-2 rounded-lg border border-[#1a2438]">
                      <label className="text-[10px] text-[#8b9bb4] block mb-1">행운 (LUCK)</label>
                      <input
                        type="number"
                        value={curNemesis.luck}
                        onChange={e => handleNemesisStatChange('luck', Number(e.target.value))}
                        className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. 3단계 페이즈 전환 (Phases) */}
                <div className="p-4 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-[#ce93d8] flex items-center gap-1.5">
                    <span>🔮</span>
                    <span>2. 3단계 페이즈 전환 임계치 & 서사 (Phases Threshold)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {curNemesis.phases.map(ph => (
                      <div key={ph.phase} className="p-3 bg-[#141c2c] border border-[#1f2d48] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs" style={{ color: ph.badgeColor }}>
                            Phase {ph.phase}
                          </span>
                          <span className="text-[10px] font-mono text-[#8b9bb4]">
                            HP {(ph.threshold * 100).toFixed(0)}% 이하
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block">페이즈 명칭</label>
                            <input
                              type="text"
                              value={ph.name}
                              onChange={e => handleNemesisPhaseChange(ph.phase, 'name', e.target.value)}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white focus:border-[#ce93d8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block">전환 체력 비율 (0.1 ~ 1.0)</label>
                            <input
                              type="number"
                              step="0.05"
                              min="0.05"
                              max="1.0"
                              value={ph.threshold}
                              onChange={e => handleNemesisPhaseChange(ph.phase, 'threshold', Number(e.target.value))}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#ce93d8] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block">서사 설명</label>
                            <textarea
                              rows={2}
                              value={ph.desc}
                              onChange={e => handleNemesisPhaseChange(ph.phase, 'desc', e.target.value)}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-[11px] text-[#cfd8e8] focus:border-[#ce93d8] focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. 보스 고유 스킬 4종 (Skills) */}
                <div className="p-4 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-[#ffd54f] flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>3. 네메시스 고유 레이드 스킬 (Boss Skills 4종)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {curNemesis.skills.map(sk => (
                      <div key={sk.id} className="p-3 bg-[#141c2c] border border-[#1f2d48] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span className="text-base">{sk.icon}</span>
                            <span>{sk.name}</span>
                          </span>
                          <span className="text-[9px] font-mono text-[#607d8b]">({sk.id})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block">위력 배율 (1.0 = 100%)</label>
                            <input
                              type="number"
                              step="0.05"
                              value={sk.power}
                              onChange={e => handleNemesisSkillChange(sk.id, 'power', Number(e.target.value))}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white font-mono font-bold focus:border-[#ffd54f] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block">타겟 범위</label>
                            <select
                              value={sk.target}
                              onChange={e => handleNemesisSkillChange(sk.id, 'target', e.target.value)}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white focus:border-[#ffd54f] focus:outline-none"
                            >
                              <option value="single">단일 (single)</option>
                              <option value="front">전열/중열 (front)</option>
                              <option value="all">아군 전체 (all)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-[#8b9bb4] block">스킬 효과 설명</label>
                          <input
                            type="text"
                            value={sk.desc}
                            onChange={e => handleNemesisSkillChange(sk.id, 'desc', e.target.value)}
                            className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-[11px] text-white focus:border-[#ffd54f] focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* 4. 🎖️ 클래스 초기 스탯 (모든 기본/1차/2차 전직 클래스) */}
          {activeTab === 'classes' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4]">
                💡 게임 내 30개 전체 직업 클래스(기본 0티어, 1차 전직, 2차 최종 전직)의 기본 기초 능력치(HP, MP, ATK, DEF, SPD, LUCK)를 편집합니다.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(CHARACTER_CLASSES)
                  .filter(cls => !searchQuery || cls.name.includes(searchQuery) || cls.id.includes(searchQuery) || cls.role.includes(searchQuery))
                  .map(cls => {
                    const currentStats = {
                      ...cls.baseStats,
                      ...(overrides.classBaseStats?.[cls.id] || {})
                    };
                    const tierLabel = cls.tier === 0 ? '기본 (0티어)' : cls.tier === 1 ? '1차 전직' : '★ 2차 최종 전직';
                    const roleLabel: Record<string, string> = {
                      tank: '탱커/수호', dealer_phy: '물리 딜러', dealer_mag: '마법 딜러',
                      healer: '치유/지원', gunner: '마총/원거리', berserker: '광전사/딜탱'
                    };
                    return (
                      <div key={cls.id} className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span className="text-base">{cls.skills[0]?.icon || '🎖️'}</span>
                            <span>{cls.name}</span>
                            <span className="text-[10px] text-[#8b9bb4] font-mono">({cls.id})</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f2b42] text-[#8b9bb4]">
                              {roleLabel[cls.role] || cls.role}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              cls.tier === 2 ? 'bg-[#ffd54f22] text-[#ffd54f]' : cls.tier === 1 ? 'bg-[#00d2ff22] text-[#00d2ff]' : 'bg-[#78909c22] text-[#90a4ae]'
                            }`}>
                              {tierLabel}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {(['hp', 'mp', 'atk', 'def', 'spd', 'luck'] as const).map(statKey => {
                            const statLabels: Record<string, string> = { hp: 'HP', mp: 'MP', atk: 'ATK', def: 'DEF', spd: 'SPD', luck: 'LUCK' };
                            return (
                              <div key={statKey} className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                                <label className="text-[9px] text-[#8b9bb4] block font-mono">{statLabels[statKey]}</label>
                                <input
                                  type="number"
                                  value={currentStats[statKey] || 0}
                                  onChange={e => handleClassBaseStatChange(cls.id, statKey, Number(e.target.value))}
                                  className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 5. ⚡ 직업 고유 스킬 */}
          {activeTab === 'skills' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4]">
                💡 각 직업 클래스의 고유 액티브 스킬 및 궁극기의 피해 계수(Power), 소모 마나(MP), 쿨다운(턴)을 조정합니다.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(CHARACTER_CLASSES)
                  .flatMap(cls => [
                    ...cls.skills.map(sk => ({ ...sk, className: cls.name })),
                    ...(cls.specialSkill ? [{ ...cls.specialSkill, className: cls.name }] : [])
                  ])
                  .filter(sk => !searchQuery || sk.name.includes(searchQuery) || sk.className.includes(searchQuery) || sk.id.includes(searchQuery))
                  .map(sk => {
                    const override = overrides.classSkills?.[sk.id] || {};
                    const curPower = override.power !== undefined ? override.power : (sk.power || 1.0);
                    const curMp = override.manaCost !== undefined ? override.manaCost : (sk.manaCost || 0);
                    const curCd = override.cooldown !== undefined ? override.cooldown : (sk.cooldown || 1);
                    return (
                      <div key={sk.id} className="p-3 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>{sk.icon || '⚡'}</span>
                            <span>{sk.name}</span>
                            <span className="text-[10px] text-[#607d8b]">[{sk.className}]</span>
                          </span>
                          <span className="text-[9px] text-[#8b9bb4] font-mono">{sk.id}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                            <label className="text-[9px] text-[#8b9bb4] block">위력 배율(1.0=100%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={curPower}
                              onChange={e => handleClassSkillChange(sk.id, 'power', Number(e.target.value))}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                            />
                          </div>
                          <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                            <label className="text-[9px] text-[#8b9bb4] block">마나 소모(MP)</label>
                            <input
                              type="number"
                              value={curMp}
                              onChange={e => handleClassSkillChange(sk.id, 'manaCost', Number(e.target.value))}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                            />
                          </div>
                          <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                            <label className="text-[9px] text-[#8b9bb4] block">쿨다운(턴)</label>
                            <input
                              type="number"
                              value={curCd}
                              onChange={e => handleClassSkillChange(sk.id, 'cooldown', Number(e.target.value))}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 6. 📖 마도서/비전서 위력 및 마물 마도서 스펙 */}
          {activeTab === 'grimoires' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4] flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div>
                  💡 표준 연구 비전서 및 <strong>던전에서 드랍되는 모든 마물·보스 마도서</strong>의 위력 배율(Power), 소모 마나(MP), 쿨다운(턴), 효과 설명, 상점가를 실시간 편집합니다.
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-[#0c101d] p-1 rounded-lg border border-[#1e293b]">
                  <button
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      grimoireSubTab === 'all' ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff55]' : 'text-[#8b9bb4] hover:text-white'
                    }`}
                    onClick={() => setGrimoireSubTab('all')}
                  >
                    전체 ({MARKET_SKILL_BOOKS.length + BOSS_EXCLUSIVE_SKILL_BOOKS.length + droppableMonsterBooks.length})
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      grimoireSubTab === 'standard' ? 'bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff55]' : 'text-[#8b9bb4] hover:text-white'
                    }`}
                    onClick={() => setGrimoireSubTab('standard')}
                  >
                    📖 표준 비전서 ({MARKET_SKILL_BOOKS.length})
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      grimoireSubTab === 'monster' ? 'bg-[#ce93d822] text-[#ce93d8] border border-[#ce93d855]' : 'text-[#8b9bb4] hover:text-white'
                    }`}
                    onClick={() => setGrimoireSubTab('monster')}
                  >
                    👾 마물·보스 마도서 ({BOSS_EXCLUSIVE_SKILL_BOOKS.length + droppableMonsterBooks.length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. 표준 연구/상점 비전서 목록 (보스 드랍 비전서 제외) */}
                {(grimoireSubTab === 'all' || grimoireSubTab === 'standard') &&
                  MARKET_SKILL_BOOKS
                    .filter(b => !searchQuery || b.name.includes(searchQuery) || b.skill.name.includes(searchQuery) || b.id.includes(searchQuery) || b.description.includes(searchQuery))
                    .map(b => {
                      const override = overrides.skillBooks?.[b.id] || {};
                      const curPower = override.power !== undefined ? override.power : (b.skill.power || 1.0);
                      const curMp = override.manaCost !== undefined ? override.manaCost : (b.skill.manaCost || 0);
                      const curCd = override.cooldown !== undefined ? override.cooldown : (b.skill.cooldown || 1);
                      const curGold = override.costGold !== undefined ? override.costGold : (b.costGold || 100);
                      const curDesc = override.description !== undefined ? override.description : b.description;
                      return (
                        <div key={b.id} className="p-3 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5 min-w-0">
                              <GameIcon name={b.id} icon={b.icon} size={20} />
                              <span className="truncate">{b.name}</span>
                              <span className="text-[10px] text-[#00d2ff] font-mono shrink-0">[{b.skill.name}]</span>
                            </span>
                            <span className="text-[10px] text-[#ffd54f] font-mono shrink-0">🪙 {curGold}G</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">위력 배율</label>
                              <input
                                type="number"
                                step="0.05"
                                value={curPower}
                                onChange={e => handleSkillBookChange(b.id, 'power', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">MP 소모</label>
                              <input
                                type="number"
                                value={curMp}
                                onChange={e => handleSkillBookChange(b.id, 'manaCost', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">쿨다운(턴)</label>
                              <input
                                type="number"
                                value={curCd}
                                onChange={e => handleSkillBookChange(b.id, 'cooldown', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">상점가(G)</label>
                              <input
                                type="number"
                                value={curGold}
                                onChange={e => handleSkillBookChange(b.id, 'costGold', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block mb-0.5">스킬/비전서 설명</label>
                            <input
                              type="text"
                              value={curDesc}
                              onChange={e => handleSkillBookDescChange(b.id, e.target.value)}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-[11px] text-[#cfd8e8] focus:border-[#00d2ff] focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}

                {/* 2. 👑 1F~10F 심연 보스 고유 드랍 비전서 목록 */}
                {(grimoireSubTab === 'all' || grimoireSubTab === 'monster') &&
                  BOSS_EXCLUSIVE_SKILL_BOOKS
                    .filter(b => !searchQuery || b.name.includes(searchQuery) || b.skill.name.includes(searchQuery) || b.id.includes(searchQuery) || b.description.includes(searchQuery))
                    .map(b => {
                      const override = overrides.skillBooks?.[b.id] || {};
                      const curPower = override.power !== undefined ? override.power : (b.skill.power || 1.0);
                      const curMp = override.manaCost !== undefined ? override.manaCost : (b.skill.manaCost || 0);
                      const curCd = override.cooldown !== undefined ? override.cooldown : (b.skill.cooldown || 1);
                      const curGold = override.costGold !== undefined ? override.costGold : (b.costGold || 1000);
                      const curDesc = override.description !== undefined ? override.description : b.description;
                      return (
                        <div key={b.id} className="p-3 bg-[#130f24] border border-[#3b1f52] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5 min-w-0">
                              <GameIcon name={b.id} size={20} />
                              <span className="truncate">{b.name}</span>
                              <span className="text-[10px] text-[#ffd54f] font-mono shrink-0">[{b.skill.name}]</span>
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                                {b.bossFloor}F 보스 드랍
                              </span>
                              <span className="text-[10px] text-[#ffd54f] font-mono">🪙 {curGold}G</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">위력 배율</label>
                              <input
                                type="number"
                                step="0.05"
                                value={curPower}
                                onChange={e => handleSkillBookChange(b.id, 'power', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono font-bold focus:border-[#ffd54f] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">MP 소모</label>
                              <input
                                type="number"
                                value={curMp}
                                onChange={e => handleSkillBookChange(b.id, 'manaCost', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#ffd54f] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">쿨다운(턴)</label>
                              <input
                                type="number"
                                value={curCd}
                                onChange={e => handleSkillBookChange(b.id, 'cooldown', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#ffd54f] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">상점가(G)</label>
                              <input
                                type="number"
                                value={curGold}
                                onChange={e => handleSkillBookChange(b.id, 'costGold', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#ffd54f] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block mb-0.5">보스 비전서/스킬 설명</label>
                            <input
                              type="text"
                              value={curDesc}
                              onChange={e => handleSkillBookDescChange(b.id, e.target.value)}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-[11px] text-[#cfd8e8] focus:border-[#ffd54f] focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}

                {/* 3. 👾 드랍 일반/엘리트 마물 마도서 및 마물 스킬 목록 */}
                {(grimoireSubTab === 'all' || grimoireSubTab === 'monster') &&
                  droppableMonsterBooks
                    .filter(b => !searchQuery || b.name.includes(searchQuery) || b.skillName.includes(searchQuery) || b.originMonsterName.includes(searchQuery) || b.bookId.includes(searchQuery) || b.defaultDescription.includes(searchQuery))
                    .map(b => {
                      const override = overrides.skillBooks?.[b.bookId] || {};
                      const curPower = override.power !== undefined ? override.power : b.defaultPower;
                      const curMp = override.manaCost !== undefined ? override.manaCost : b.defaultManaCost;
                      const curCd = override.cooldown !== undefined ? override.cooldown : b.defaultCooldown;
                      const defaultGold = 150 + b.floor * 60;
                      const curGold = override.costGold !== undefined ? override.costGold : defaultGold;
                      const curDesc = override.description !== undefined ? override.description : b.defaultDescription;
                      return (
                        <div key={b.bookId} className="p-3 bg-[#0d1424] border border-[#233452] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5 min-w-0">
                              <GameIcon name={b.bookId} size={20} />
                              <span className="truncate">{b.name}</span>
                              <span className="text-[10px] text-[#ce93d8] font-mono shrink-0">[{b.skillName}]</span>
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                                style={{
                                  backgroundColor: b.affinityMeta.bg,
                                  color: b.affinityMeta.color,
                                  border: `1px solid ${b.affinityMeta.borderColor}`
                                }}
                              >
                                {b.affinityMeta.shortName}
                              </span>
                              <span className="text-[10px] text-[#ffd54f] font-mono">🪙 {curGold}G</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#8b9bb4]">
                            <span>👾 출처: <strong className="text-white">{b.originMonsterName}</strong> ({b.floor}F {b.monsterType === 'boss' ? '보스' : b.monsterType === 'elite' ? '엘리트' : '일반'})</span>
                            <span className="font-mono text-[9px] text-[#546e7a]">({b.bookId})</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">위력 배율</label>
                              <input
                                type="number"
                                step="0.05"
                                value={curPower}
                                onChange={e => handleSkillBookChange(b.bookId, 'power', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono font-bold focus:border-[#ce93d8] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">MP 소모</label>
                              <input
                                type="number"
                                value={curMp}
                                onChange={e => handleSkillBookChange(b.bookId, 'manaCost', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#ce93d8] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">쿨다운(턴)</label>
                              <input
                                type="number"
                                value={curCd}
                                onChange={e => handleSkillBookChange(b.bookId, 'cooldown', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#ce93d8] focus:outline-none"
                              />
                            </div>
                            <div className="bg-[#141c2c] p-1 rounded border border-[#1a2438]">
                              <label className="text-[9px] text-[#8b9bb4] block">상점가(G)</label>
                              <input
                                type="number"
                                value={curGold}
                                onChange={e => handleSkillBookChange(b.bookId, 'costGold', Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1 py-0.5 text-xs text-white font-mono focus:border-[#ce93d8] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8b9bb4] block mb-0.5">마물 마도서/스킬 설명</label>
                            <input
                              type="text"
                              value={curDesc}
                              onChange={e => handleSkillBookDescChange(b.bookId, e.target.value)}
                              className="w-full bg-[#0b0f19] border border-[#233148] rounded px-1.5 py-0.5 text-[11px] text-[#cfd8e8] focus:border-[#ce93d8] focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          )}

          {/* 7. ⚖️ 글로벌 게임 밸런스 계수 */}
          {activeTab === 'balance' && (() => {
            const curBalance: GameBalanceConfig = {
              expMultiplier: 1.0,
              goldMultiplier: 1.0,
              etherMultiplier: 1.0,
              itemDropRateMultiplier: 1.0,
              bossSkillBookDropRate: 0.04,
              ...(overrides.balance || {})
            };

            return (
              <div className="space-y-4">
                <div className="p-3 bg-[#131926] rounded-xl border border-[#1f2d48] text-xs text-[#8b9bb4]">
                  💡 인게임 전역에 적용되는 경험치, 재화 획득량 및 보스 비기 드랍 확률의 전역 승수(Multiplier)를 실시간 조율합니다.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>📈</span>
                        <span>전투 경험치(EXP) 획득 배율</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-[#00d2ff]">
                        {curBalance.expMultiplier}x ({Math.round(curBalance.expMultiplier * 100)}%)
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10.0"
                      value={curBalance.expMultiplier}
                      onChange={e => handleBalanceChange('expMultiplier', Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                    />
                    <div className="text-[10px] text-[#8b9bb4]">전투 승리 시 파티원이 획득하는 기본 경험치 배율 (기본 1.0)</div>
                  </div>

                  <div className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>💰</span>
                        <span>골드 획득 배율</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-[#ffd54f]">
                        {curBalance.goldMultiplier}x ({Math.round(curBalance.goldMultiplier * 100)}%)
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10.0"
                      value={curBalance.goldMultiplier}
                      onChange={e => handleBalanceChange('goldMultiplier', Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                    />
                    <div className="text-[10px] text-[#8b9bb4]">마물 토벌 및 던전 상자에서 획득하는 기본 골드 배율 (기본 1.0)</div>
                  </div>

                  <div className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>✨</span>
                        <span>에테르 획득 배율</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-[#ce93d8]">
                        {curBalance.etherMultiplier}x ({Math.round(curBalance.etherMultiplier * 100)}%)
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10.0"
                      value={curBalance.etherMultiplier}
                      onChange={e => handleBalanceChange('etherMultiplier', Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                    />
                    <div className="text-[10px] text-[#8b9bb4]">심연 탐사 및 이벤트에서 획득하는 에테르 배율 (기본 1.0)</div>
                  </div>

                  <div className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>🎁</span>
                        <span>아이템 드랍률 배율</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-[#66bb6a]">
                        {curBalance.itemDropRateMultiplier}x ({Math.round(curBalance.itemDropRateMultiplier * 100)}%)
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10.0"
                      value={curBalance.itemDropRateMultiplier}
                      onChange={e => handleBalanceChange('itemDropRateMultiplier', Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                    />
                    <div className="text-[10px] text-[#8b9bb4]">장비 레시피, 완제품 및 전리품 기본 드랍 확률 배율 (기본 1.0)</div>
                  </div>

                  <div className="p-3.5 bg-[#0f1422] border border-[#1c263c] rounded-xl space-y-2 col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>📖</span>
                        <span>보스 고유 마도서 기본 드랍 확률</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-[#ff416c]">
                        {(curBalance.bossSkillBookDropRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1.0"
                      value={curBalance.bossSkillBookDropRate}
                      onChange={e => handleBalanceChange('bossSkillBookDropRate', Number(e.target.value))}
                      className="w-full bg-[#0b0f19] border border-[#233148] rounded px-2 py-1 text-xs text-white font-mono focus:border-[#00d2ff] focus:outline-none"
                    />
                    <div className="text-[10px] text-[#8b9bb4]">층별 보스 처치 시 고유 비기 마도서가 드랍될 기본 확률 (기본 0.04 = 4.0%)</div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

      </div>
    </div>
  );
};
