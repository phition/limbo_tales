import React, { useEffect, useState } from 'react';
import { useGameManager } from '../../hooks/useGameManager';
import { useI18n } from '../../hooks/useI18n';
import { SoundManager } from '../../managers/SoundManager';
import { formatTimeLeft } from '../../utils/timeUtils';

interface TerritoryDioramaViewProps {
  onOpenFacility: (facilityKey: string) => void;
  onOpenExplore: () => void;
}

export const TerritoryDioramaView: React.FC<TerritoryDioramaViewProps> = ({
  onOpenFacility,
  onOpenExplore,
}) => {
  const { state, gm } = useGameManager();
  const { tr, lang } = useI18n();

  // 0.5초마다 갱신
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(timer);
  }, []);

  const handleCardClick = (key: string) => {
    try {
      SoundManager.getInstance().play('click');
    } catch {}
    onOpenFacility(key);
  };

  // 주요 상태 및 알림 뱃지
  const hasWarmth = gm.bonfireWarmthTime > 0 && gm.bonfireStacks >= 5;
  const warmthTimeStr = gm.bonfireWarmthTime > 0
    ? formatTimeLeft(gm.bonfireWarmthTime, lang)
    : `${gm.bonfireStacks || 0}/5`;

  const tavernNew = (state.tavernCandidates || []).length > 0;
  const patientsCount = (state.infirmaryPatients || []).length;
  const fallenCount = (state.cemetery || []).length;
  const claimableQuestsCount = (state.quests || []).filter(q => q.status === 'active' && q.objectives?.every(o => o.isCompleted)).length;
  const registerableCodexCount = gm.getRegisterableCodexCount ? gm.getRegisterableCodexCount() : 0;

  return (
    <div className="relative w-full h-full bg-[#0c0e14] overflow-hidden select-none flex flex-col">
      {/* ── 1. 다크 고딕 부유 성채 2.5D 디오라마 배경 아트 ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08090b] via-[#10131a] to-[#08090b]">
        {/* 원경 성채 실루엣 및 흑무 안개 오버레이 */}
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a2418] via-transparent to-transparent" />
        
        {/* 거점 배경 이미지 */}
        <img
          src="assets/citadel_bonfire.jpg"
          alt="Ark Citadel"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-25 filter contrast-125 brightness-75"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* 스모키 다크 비네팅 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090b] via-transparent to-[#08090b]/85 pointer-events-none" />
      </div>

      {/* ── 2. 위/아래(세로) 스크롤 가능한 시설 카드 뷰포트 ── */}
      <div className="relative z-10 flex-1 overflow-y-auto tg-scrollbar px-3 py-3 space-y-4 max-w-3xl mx-auto w-full">
        
        {/* 🔥 상단 배너 카드: 방주의 성화 (온기 관리) */}
        <div
          onClick={() => handleCardClick('bonfire')}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
            hasWarmth
              ? 'bg-[#1c1811]/90 border border-[#b89758] shadow-[0_0_16px_rgba(184,151,88,0.25)] hover:border-[#dcc496]'
              : 'bg-[#14161f]/90 border border-[#3d372e] hover:border-[#5a4b35]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none drop-shadow">🔥</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#ededed] tracking-tight">
                  {tr('방주의 성화')}
                </h3>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  hasWarmth ? 'bg-[#b89758]/20 text-[#dcc496] border border-[#b89758]/40' : 'bg-[#242732] text-[#9da3af]'
                }`}>
                  {hasWarmth ? `온기 ON (${warmthTimeStr})` : `점화 대기 (${warmthTimeStr})`}
                </span>
              </div>
              <p className="text-[11px] text-[#9da3af] mt-0.5">
                {hasWarmth ? tr('생산량 +15%, 전투 EXP +20%, 영지 용병 지속 재생 가동 중') : tr('영목(목재)을 투입하여 온기 3대 버프를 활성화하십시오.')}
              </p>
            </div>
          </div>

          <span className="text-xs text-[#b89758] font-bold shrink-0 ml-2">
            관리 ▶
          </span>
        </div>

        {/* ── ⚒️ 섹션 1: 핵심 군비 & 물류 거점 ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-bold text-[#b89758] tracking-wider uppercase">
            <span>⚒️</span>
            <span>{tr('핵심 군비 & 물류 거점')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 심연의 병기창 */}
            <FacilityDetailCard
              name={tr('심연의 병기창')}
              subTitle={tr('무기·방어구 단조, 장비 강화, 침식 정화')}
              icon="⚒️"
              level={state.buildings['blacksmith']?.level || 0}
              onClick={() => handleCardClick('forge')}
              isBuilt={(state.buildings['blacksmith']?.level || 0) >= 1}
            />

            {/* 방랑자의 라운지 */}
            <FacilityDetailCard
              name={tr('방랑자의 라운지')}
              subTitle={tr('방랑 용병 모집 계약 및 고용 풀 갱신')}
              icon="🍺"
              level={state.buildings['tavern']?.level || 0}
              badge={tavernNew ? 'NEW' : null}
              badgeType="gold"
              onClick={() => handleCardClick('tavern')}
              isBuilt={(state.buildings['tavern']?.level || 0) >= 1}
            />

            {/* 생체 복원 병동 */}
            <FacilityDetailCard
              name={tr('생체 복원 병동')}
              subTitle={tr('전투 부상 대원 입원 치료 및 완치')}
              icon="🏥"
              level={state.buildings['infirmary']?.level || 0}
              badge={patientsCount > 0 ? `${patientsCount}인 치료중` : null}
              badgeType="gold"
              onClick={() => handleCardClick('infirmary')}
              isBuilt={(state.buildings['infirmary']?.level || 0) >= 1}
            />

            {/* 방주 중앙 병참고 */}
            <FacilityDetailCard
              name={tr('방주 중앙 병참고')}
              subTitle={tr('16~27종 전 군수 물자 및 장비·보급품 보관')}
              icon="🏛️"
              level={state.buildings['storage']?.level || 0}
              onClick={() => handleCardClick('storage')}
              isBuilt={(state.buildings['storage']?.level || 0) >= 0}
            />
          </div>
        </div>

        {/* ── 🧪 섹션 2: 비전 연구 & 대외 교역 ── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-bold text-[#b89758] tracking-wider uppercase">
            <span>🧪</span>
            <span>{tr('비전 연구 & 대외 교역')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 에테르 연금 공방 */}
            <FacilityDetailCard
              name={tr('에테르 연금 공방')}
              subTitle={tr('마도 스킬 비전서 강화 및 장비 룬 인챈트')}
              icon="🧪"
              level={state.buildings['alchemy']?.level || 0}
              onClick={() => handleCardClick('alchemy')}
              isBuilt={(state.buildings['alchemy']?.level || 0) >= 1}
            />

            {/* 황혼의 블랙 마켓 */}
            <FacilityDetailCard
              name={tr('황혼의 블랙 마켓')}
              subTitle={tr('17종 군수물자 거래 및 유지비 주기 연장')}
              icon="⚖️"
              level={state.buildings['market']?.level || 0}
              onClick={() => handleCardClick('market')}
              isBuilt={(state.buildings['market']?.level || 0) >= 1}
            />

            {/* 영혼의 제단 */}
            <FacilityDetailCard
              name={tr('영혼의 제단')}
              subTitle={tr('1차·2차 클래스 승격 전직 및 상시 올스탯 버프')}
              icon="✨"
              level={state.buildings['sanctuary']?.level || 0}
              onClick={() => handleCardClick('sanctuary')}
              isBuilt={(state.buildings['sanctuary']?.level || 0) >= 1}
            />
          </div>
        </div>

        {/* ── ⚔️ 섹션 3: 전략 지휘 & 전사자 기록 ── */}
        <div className="pb-4">
          <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-bold text-[#b89758] tracking-wider uppercase">
            <span>⚔️</span>
            <span>{tr('전략 지휘 & 전사자 기록')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 원정단 병영 */}
            <FacilityDetailCard
              name={tr('원정단 병영 & 작전실')}
              subTitle={tr('4인 파티 편성, 진형 배치, 전직 및 장비 관리')}
              icon="⚔️"
              onClick={() => handleCardClick('barracks')}
              isBuilt={true}
            />

            {/* 성채 묘지 */}
            <FacilityDetailCard
              name={tr('성채 묘지')}
              subTitle={tr('전사한 영령 안치, 추모 EXP 버프 및 가호 결속')}
              icon="🪦"
              badge={fallenCount > 0 ? `${fallenCount}위 안치` : null}
              badgeType="gold"
              onClick={() => handleCardClick('cemetery')}
              isBuilt={true}
            />

            {/* 심연 도감 & 서고 */}
            <FacilityDetailCard
              name={tr('심연 도감 & 서고')}
              subTitle={tr('오파츠, 고대 유물 등록 및 영구적 패시브 연구')}
              icon="📜"
              badge={registerableCodexCount > 0 ? `${registerableCodexCount}건 등록가능` : null}
              badgeType="gold"
              onClick={() => handleCardClick('codex')}
              isBuilt={true}
            />

            {/* 지휘관 퀘스트 본부 */}
            <FacilityDetailCard
              name={tr('지휘관 퀘스트 본부')}
              subTitle={tr('메인 시나리오 연계 임무 및 서브 토벌 의뢰')}
              icon="📜"
              badge={claimableQuestsCount > 0 ? `${claimableQuestsCount}건 완료` : null}
              badgeType="gold"
              onClick={() => handleCardClick('quests')}
              isBuilt={true}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

// ── 상세 시설 가로형 카드 컴포넌트 ──
interface FacilityDetailCardProps {
  name: string;
  subTitle: string;
  icon: string;
  level?: number;
  badge?: string | number | null;
  badgeType?: 'gold' | 'warning' | 'danger';
  isBuilt?: boolean;
  onClick: () => void;
}

const FacilityDetailCard: React.FC<FacilityDetailCardProps> = ({
  name,
  subTitle,
  icon,
  level,
  badge,
  badgeType = 'gold',
  isBuilt = true,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all select-none ${
        isBuilt
          ? 'bg-[#151821]/95 border border-[#3d372e] hover:border-[#b89758] hover:bg-[#1c202d] shadow-[0_2px_8px_rgba(0,0,0,0.6)] active:scale-[0.98]'
          : 'bg-[#101217]/60 border border-[#262933] opacity-60 hover:opacity-100'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <span className="text-2xl leading-none drop-shadow shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-bold text-[#ededed] tracking-tight truncate">
              {name}
            </h4>
            {level !== undefined && level > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#b89758]/15 text-[#dcc496] border border-[#b89758]/30">
                Lv.{level}
              </span>
            )}
            {badge && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-black leading-none ${
                  badgeType === 'danger'
                    ? 'bg-[#8c2d2d] text-white'
                    : badgeType === 'warning'
                    ? 'bg-[#a67c38] text-white'
                    : 'bg-[#b89758] text-[#08090b]'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#9da3af] line-clamp-1 mt-0.5">
            {subTitle}
          </p>
        </div>
      </div>

      <span className="text-xs text-[#87724d] font-bold shrink-0">
        입장 ▶
      </span>
    </div>
  );
};
