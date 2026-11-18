import React, { useState } from 'react';
import { Modal } from '../Modal';
import { useI18n } from '../../hooks/useI18n';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: 'plunder' | 'cycle' | 'battle';
}

export const NemesisRulesModal: React.FC<Props> = ({
  open,
  onClose,
  initialTab = 'plunder',
}) => {
  const { tr } = useI18n();
  const [activeTab, setActiveTab] = useState<'plunder' | 'cycle' | 'battle'>(initialTab);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">📋</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm sm:text-base">{tr('차원 네메시스 작전 지침서')}</span>
            <span className="text-[10px] text-[#ff416c] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#ff416c1a] border border-[#ff416c44]">
              OPERATION MANUAL
            </span>
          </div>
        </div>
      }
      maxWidth="max-w-[95vw] sm:max-w-[580px]"
    >
      <div className="flex flex-col gap-3 text-xs text-[#cfd8e8]">
        {/* 브리핑 룸 테마 서브 탭 */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-[#0d121f] border border-[#1e2a40]">
          {[
            { key: 'plunder', icon: '⚠️', label: tr('영지 약탈 시스템') },
            { key: 'cycle', icon: '🔄', label: tr('7일 주기 & 재생') },
            { key: 'battle', icon: '⚔️', label: tr('출격 & 전투 규정') },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === t.key
                  ? 'bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] text-white shadow-md shadow-[#ff416c33]'
                  : 'text-[#8b9bb4] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 1: 영지 약탈 시스템 */}
        {activeTab === 'plunder' && (
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#140e1c] border border-[#ff416c33]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#ff416c] border-b border-[#ff416c22] pb-1.5">
              <span>⚠️</span>
              <span>{tr('6시간 주기 영지 약탈 (Plunder Cycle)')}</span>
            </div>

            <div className="flex flex-col gap-2 text-[11px] leading-relaxed text-[#cfd8dc]">
              <div className="p-2.5 rounded-lg bg-[#1f1022] border border-[#ff416c44] flex items-start gap-2">
                <span className="text-base shrink-0">🎯</span>
                <div>
                  <div className="font-bold text-white mb-0.5">{tr('1/24 요격 피해량 달성 의무')}</div>
                  <p className="text-[#8b9bb4]">
                    {tr('침공 활성화 중 6시간마다 네메시스 전체 체력의 1/24(약 4.167%, 약 52만 HP) 이상을 타격해야 합니다.')}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#2c1216] border border-[#ef535066] flex items-start gap-2">
                <span className="text-base shrink-0">🚨</span>
                <div>
                  <div className="font-bold text-[#ff80ab] mb-0.5">{tr('방어 실패 시 영지 자원 20% 약탈')}</div>
                  <p className="text-[#ffcdd2]">
                    {tr('6시간 마감 시점까지 목표 피해량을 채우지 못하면 성채 내 보유 목재, 석재, 가죽, 식량 등 핵심 영지 자원의 20%를 즉시 약탈당합니다.')}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e1626] border border-[#23334d] flex items-start gap-2">
                <span className="text-base shrink-0">🌐</span>
                <div>
                  <div className="font-bold text-[#90caf9] mb-0.5">{tr('전 지휘관 실시간 협동 방어')}</div>
                  <p className="text-[#8b9bb4]">
                    {tr('이 피해량은 전 서버 지휘관들의 누적 타격 피해로 합산되므로, 모든 지휘관이 힘을 합쳐 목표치를 달성하면 영지 자원이 100% 안전하게 보호됩니다.')}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#16120b] border border-[#ffd54f33] flex items-start gap-2">
                <span className="text-base shrink-0">🛡️</span>
                <div>
                  <div className="font-bold text-[#ffd54f] mb-0.5">{tr('차원 안커(Gate Lv.3+) 연동')}</div>
                  <p className="text-[#ffecb3]">
                    {tr('차원 안커가 닫혀있거나 게이트 레벨이 낮을 때는 침공이 발생하지 않으며, 안커가 개방되어 있을 때만 레이드와 약탈이 동시에 활성화됩니다.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 7일 주기 & 재생 */}
        {activeTab === 'cycle' && (
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#0f1422] border border-[#1e2a40]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#90caf9] border-b border-[#23334d] pb-1.5">
              <span>🔄</span>
              <span>{tr('7일 작전 주기 & 생존 부위 자가 재생')}</span>
            </div>

            <div className="flex flex-col gap-2 text-[11px] leading-relaxed text-[#cfd8dc]">
              <div className="p-2.5 rounded-lg bg-[#121a2c] border border-[#23334d]">
                <div className="font-bold text-white mb-1 flex items-center justify-between">
                  <span>📅 {tr('6일 레이드 활동 + 1일 리스폰 쿨다운')}</span>
                  <span className="text-[#ffd54f] font-mono text-[10px]">{tr('7일 총 주기')}</span>
                </div>
                <p className="text-[#8b9bb4]">
                  {tr('네메시스는 6일간 끊임없이 시공간을 침식하며, 6일이 경과하거나 완전 격퇴 시 다음 7일차 정기 리스폰 주기까지 평화 상태가 유지됩니다.')}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#121a2c] border border-[#23334d]">
                <div className="font-bold text-[#ce93d8] mb-1 flex items-center justify-between">
                  <span>🩸 {tr('분당 0.05% 자가 치유 (살아있는 부위)')}</span>
                  <span className="text-[#ce93d8] font-mono text-[10px]">0.05%/min</span>
                </div>
                <p className="text-[#8b9bb4]">
                  {tr('크로노스는 활동 중 매 분마다 생존해 있는 각 부위(머리, 몸통, 꼬리)의 최대 체력 대비 0.05%를 지속적으로 자가 수복합니다.')}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#1a0e1c] border border-[#ff416c44]">
                <div className="font-bold text-[#ff80ab] mb-1">
                  💀 {tr('부위 파괴 시 영구 기능 정지 (재생 불가)')}
                </div>
                <p className="text-[#8b9bb4]">
                  {tr('완전히 파괴되어 체력이 0이 된 부위는 해당 7일 주기가 끝날 때까지 영구적으로 재생이 중단되며, 해당 부위의 전용 특수 스킬 또한 봉인됩니다.')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: 출격 & 전투 규정 */}
        {activeTab === 'battle' && (
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#0e1620] border border-[#23334d]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#ffd54f] border-b border-[#ffd54f22] pb-1.5">
              <span>⚔️</span>
              <span>{tr('출격 편성 및 전투 규정')}</span>
            </div>

            <div className="flex flex-col gap-2 text-[11px] leading-relaxed text-[#cfd8dc]">
              <div className="p-2.5 rounded-lg bg-[#141d2e] border border-[#23334d]">
                <div className="font-bold text-white mb-1">
                  🛡️ {tr('4인 차원 원정대 (3선발 + 1오퍼레이터)')}
                </div>
                <p className="text-[#8b9bb4]">
                  {tr('선발 3인(전열/중열/후열)은 전투에 직접 참전하여 공격과 방어를 수행하며, 오퍼레이터 1인은 전술 지휘관으로서 아군 전체에 강력한 패시브 지원 및 궁극기 부스트를 제공합니다.')}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#141d2e] border border-[#23334d]">
                <div className="font-bold text-[#ffd54f] mb-1">
                  ⏱️ {tr('15턴 제한 턴제 전투')}
                </div>
                <p className="text-[#8b9bb4]">
                  {tr('각 출격은 최대 15턴 동안 진행됩니다. 15턴이 종료되거나 아군 전원이 쓰러질 때까지 입힌 총 피해량이 서버에 누적됩니다.')}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#141d2e] border border-[#23334d]">
                <div className="font-bold text-[#64b5f6] mb-1 flex items-center justify-between">
                  <span>🛡️ {tr('차원 왜곡 장벽 (상태이상 저항 90% & 피해 10% 감쇄)')}</span>
                  <span className="text-[#64b5f6] font-mono text-[10px]">RESIST 90% / DMG 10%</span>
                </div>
                <p className="text-[#8b9bb4]">
                  {tr('월드 레이드 보스 네메시스는 모든 상태이상(출혈, 화상, 중독, 빙결, 기절 등)에 대해 90% 고정 저항률을 가지며, 상태이상에 걸렸을 때의 지속 피해는 10%만 입습니다.')}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#141d2e] border border-[#23334d]">
                <div className="font-bold text-[#4caf50] mb-1">
                  🎟️ {tr('일일 출격 횟수 및 광고 충전')}
                </div>
                <p className="text-[#8b9bb4]">
                  {tr('매일 3회의 기본 도전권이 주어지며, 횟수를 모두 소진한 후에도 광고 시청을 통해 최대 3회까지 무료로 즉시 추가 충전할 수 있습니다.')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-[#1e2a40] flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-primary text-xs px-4 py-2 font-bold shadow-md shadow-[#c8aa6e22]"
          >
            {tr('확인 (지침 숙지 완료)')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
