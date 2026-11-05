import React, { useState } from 'react';
import { useGameManager } from '../../hooks/useGameManager';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';

export interface DockFacilityItem {
  key: string;
  name: string;
  icon: string;
  badge?: string | number | null;
  badgeType?: 'danger' | 'warning' | 'success' | 'gold';
  isBuilt?: boolean;
}

interface QuickFacilityDockProps {
  activeKey: string | null;
  onSelectFacility: (key: string) => void;
}

export const QuickFacilityDock: React.FC<QuickFacilityDockProps> = ({
  activeKey,
  onSelectFacility,
}) => {
  const { state, gm } = useGameManager();
  const { tr } = useI18n();

  // 상태 뱃지 계산
  const claimableQuestsCount = (state.quests || []).filter(q => q.status === 'active' && q.objectives?.every(o => o.isCompleted)).length;
  const tavernNewBadge = (state.tavernCandidates || []).length > 0 ? 'NEW' : null;
  const fallenHeroesCount = (state.cemetery || []).length;
  const patientsCount = (state.infirmaryPatients || []).length;

  // 슬라이드 스트립에 표시될 시설 리스트 (실제 패널이 있는 핵심 시설들)
  const SLIDE_FACILITIES: DockFacilityItem[] = [
    { key: 'forge',     name: tr('심연 병기창'), icon: '⚒️', isBuilt: (state.buildings['blacksmith']?.level || 0) >= 1 },
    { key: 'tavern',    name: tr('방랑 라운지'), icon: '🍺', isBuilt: (state.buildings['tavern']?.level || 0) >= 1, badge: tavernNewBadge, badgeType: 'gold' },
    { key: 'infirmary', name: tr('복원 병동'),   icon: '🏥', isBuilt: (state.buildings['infirmary']?.level || 0) >= 1, badge: patientsCount > 0 ? patientsCount : null, badgeType: 'gold' },
    { key: 'storage',   name: tr('중앙 창고'),   icon: '🏛️', isBuilt: (state.buildings['storage']?.level || 0) >= 0 },
    { key: 'alchemy',   name: tr('연금 공방'),   icon: '🧪', isBuilt: (state.buildings['alchemy']?.level || 0) >= 1 },
    { key: 'market',    name: tr('블랙 마켓'),   icon: '⚖️', isBuilt: (state.buildings['market']?.level || 0) >= 1 },
    { key: 'barracks',  name: tr('원정 병영'),   icon: '⚔️', isBuilt: true },
    { key: 'cemetery',  name: tr('성채 묘지'),   icon: '🪦', isBuilt: true, badge: fallenHeroesCount > 0 ? fallenHeroesCount : null, badgeType: 'gold' },
    { key: 'codex',     name: tr('심연 도감'),   icon: '📜', isBuilt: true },
    { key: 'quests',    name: tr('지휘 퀘스트'), icon: '📜', isBuilt: true, badge: claimableQuestsCount > 0 ? claimableQuestsCount : null, badgeType: 'gold' },
    { key: 'sanctuary', name: tr('영혼 제단'),   icon: '✨', isBuilt: (state.buildings['sanctuary']?.level || 0) >= 1 },
    { key: 'bonfire',   name: tr('방주 성화'),   icon: '🔥', isBuilt: true, badge: (gm.bonfireWarmthTime <= 0) ? 'OFF' : null, badgeType: 'warning' },
  ];

  const handleClick = (key: string) => {
    try {
      SoundManager.getInstance().play('click');
    } catch {}
    onSelectFacility(key);
  };

  return (
    <div className="relative z-20 flex flex-col bg-[#08090b]/95 border-t border-[#3d372e] select-none shadow-[0_-8px_24px_rgba(0,0,0,0.85)]">
      
      {/* ── 1. 상단 가로 슬라이드 뷰 (보조 거점 시설들) ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto tg-scrollbar border-b border-[#1c1f28]">
        {SLIDE_FACILITIES.map(f => {
          const isActive = activeKey === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => handleClick(f.key)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#2a261c] border border-[#b89758] text-[#dcc496] shadow-[0_0_10px_rgba(184,151,88,0.3)]'
                  : 'bg-[#12141a] border border-[#262933] text-[#9da3af] hover:text-white hover:border-[#5a4b35]'
              }`}
            >
              {f.badge && (
                <span
                  className={`px-1 py-0.2 rounded text-[9px] font-black leading-none ${
                    f.badgeType === 'warning'
                      ? 'bg-[#a67c38] text-white'
                      : 'bg-[#b89758] text-[#08090b]'
                  }`}
                >
                  {f.badge}
                </span>
              )}
              <span className="text-sm leading-none">{f.icon}</span>
              <span className="text-[11px] font-bold whitespace-nowrap">{f.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. 하단 3대 마스터 내비게이션 앵커 바 (심연 강하 ↔ 방주 영지 ↔ 차원 게이트) ── */}
      <div className="grid grid-cols-3 items-center gap-2 px-3 py-2 bg-[#0c0e14]">
        {/* [좌측]: 🌌 심연 강하 (Explore) */}
        <button
          type="button"
          onClick={() => handleClick('explore')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all cursor-pointer ${
            activeKey === 'explore'
              ? 'bg-[#1c2333] border-2 border-[#5c7cbd] text-white shadow-[0_0_12px_rgba(92,124,189,0.4)]'
              : 'bg-[#121620] border border-[#2f394d] hover:border-[#5c7cbd] text-[#cfd8e8] active:scale-95'
          }`}
          title={tr('심연 1~5층 강하 출격')}
        >
          <span className="text-xl leading-none">🌌</span>
          <div className="text-left">
            <div className="text-[11px] font-black leading-tight text-white">
              {tr('심연 강하')}
            </div>
            <div className="text-[9px] text-[#8b9bb4] hidden sm:block">
              {tr('원정 출격')}
            </div>
          </div>
        </button>

        {/* [중심]: 🏰 방주 영지 (Citadel - 가장 돋보이는 센터 랜드마크 버튼) */}
        <button
          type="button"
          onClick={() => handleClick('citadel')}
          className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeKey === 'citadel'
              ? 'bg-gradient-to-b from-[#382f1f] to-[#1f1a11] border-2 border-[#dcc496] shadow-[0_0_20px_rgba(184,151,88,0.5)] scale-105'
              : 'bg-gradient-to-b from-[#241e14] to-[#13110d] border-2 border-[#b89758] shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:brightness-115 active:scale-95'
          }`}
          title={tr('전체 시설 건설 및 증축 관리')}
        >
          <span className="text-2xl leading-none drop-shadow">🏰</span>
          <div className="text-left">
            <div className="text-xs font-black tracking-tight text-[#fff] leading-tight">
              {tr('방주 영지')}
            </div>
            <div className="text-[9px] font-bold text-[#b89758]">
              {tr('건설 & 증축')}
            </div>
          </div>
        </button>

        {/* [우측]: 🌀 차원 게이트 (Arena) */}
        <button
          type="button"
          onClick={() => handleClick('arena')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all cursor-pointer ${
            activeKey === 'arena'
              ? 'bg-[#291b22] border-2 border-[#d45070] text-white shadow-[0_0_12px_rgba(212,80,112,0.4)]'
              : 'bg-[#1a1218] border border-[#442838] hover:border-[#d45070] text-[#e8cfdb] active:scale-95'
          }`}
          title={tr('차원 아레나 & 침공전')}
        >
          <span className="text-xl leading-none">🌀</span>
          <div className="text-left">
            <div className="text-[11px] font-black leading-tight text-white">
              {tr('차원 게이트')}
            </div>
            <div className="text-[9px] text-[#b48b9f] hidden sm:block">
              {tr('아레나 PVP')}
            </div>
          </div>
        </button>
      </div>

    </div>
  );
};
