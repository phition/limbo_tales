import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';

export interface CombatantMetrics {
  id: string;
  name: string;
  className: string;
  classId?: string;
  grade?: string;
  level?: number;
  icon?: string;
  isPlayer: boolean;
  damageDealt: number;       // 총 딜량 (피해량)
  healingDone: number;       // 총 힐량 (치유 / 실드)
  damageTaken: number;       // 받은 피해량 (방어)
  dodges: number;            // 회피 횟수
  combosTriggered: number;   // 상태 이상 연계 / 시너지 발동 횟수
  critCount: number;         // 치명타 발생 횟수
  kills: number;             // 처치(K.O.) 수
  actionsCount?: number;     // 총 행동/스킬 시전 횟수
}

interface Props {
  metrics: CombatantMetrics[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const GRADE_COLOR: Record<string, string> = {
  rookie: '#9e9e9e',
  veteran: '#4caf50',
  hero: '#00d2ff',
  elite: '#00d2ff',
  epic: '#ab47bc',
  legend: '#ffd54f',
};

export const CombatMeterTable: React.FC<Props> = ({
  metrics,
  title = '📊 전투 리포트',
  subtitle,
  className = '',
}) => {
  const { tr } = useI18n();
  const [filter, setFilter] = useState<'all' | 'player' | 'enemy'>('all');

  const filtered = metrics.filter(m => {
    if (filter === 'player') return m.isPlayer;
    if (filter === 'enemy') return !m.isPlayer;
    return true;
  });

  // 팀별 총 딜량 / 힐량 계산 (비율 바 표시용)
  const playerDmg = metrics.filter(m => m.isPlayer).reduce((sum, m) => sum + m.damageDealt, 0);
  const enemyDmg = metrics.filter(m => !m.isPlayer).reduce((sum, m) => sum + m.damageDealt, 0);
  const maxDmg = Math.max(...metrics.map(m => m.damageDealt), 1);
  const maxHeal = Math.max(...metrics.map(m => m.healingDone), 1);
  const maxTaken = Math.max(...metrics.map(m => m.damageTaken), 1);

  // 최고 기록자 (MVP 계산)
  const topDealer = [...metrics].sort((a, b) => b.damageDealt - a.damageDealt)[0];
  const topHealer = [...metrics].filter(m => m.healingDone > 0).sort((a, b) => b.healingDone - a.healingDone)[0];
  const topTank = [...metrics].sort((a, b) => b.damageTaken - a.damageTaken)[0];

  return (
    <div className={`flex flex-col gap-2 p-2.5 rounded-2xl bg-[#0a0f1d] border border-[#1e2a44] text-[#cfd8e8] shadow-2xl ${className}`}>
      {/* 헤더 및 하이라이트 요약 */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#1b253b] pb-2">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>{tr(title)}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#c8aa6e15] text-[#c8aa6e] border border-[#c8aa6e33] font-mono">
              {tr('실시간 분석')}
            </span>
          </div>
          {subtitle && <div className="text-[10px] text-[#8b9bb4] mt-0.5">{tr(subtitle)}</div>}
        </div>

        {/* 필터 탭 (적군 메트릭스가 존재할 때만 표시) */}
        {metrics.some(m => !m.isPlayer) && (
          <div className="flex items-center gap-1 bg-[#12141a] p-0.5 rounded-lg border border-[#212f4d] text-[10px] font-bold">
            <button
              type="button"
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filter === 'all' ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]' : 'text-[#8b9bb4] hover:text-white'
              }`}
              onClick={() => setFilter('all')}
            >
              {tr('전체')} ({metrics.length})
            </button>
            <button
              type="button"
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filter === 'player' ? 'bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]' : 'text-[#8b9bb4] hover:text-white'
              }`}
              onClick={() => setFilter('player')}
            >
              {tr('아군')}
            </button>
            <button
              type="button"
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filter === 'enemy' ? 'bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]' : 'text-[#8b9bb4] hover:text-white'
              }`}
              onClick={() => setFilter('enemy')}
            >
              {tr('적군')}
            </button>
          </div>
        )}
      </div>

      {/* 🏆 MVP 및 최고 기여자 하이라이트 뱃지 */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
        {topDealer && (
          <div className="p-1 rounded-lg bg-[#ff416c10] border border-[#ff416c33] flex flex-col items-center">
            <span className="text-[8.5px] text-[#ff416c] font-bold flex items-center gap-0.5">
              <span>💥</span> <span>{tr('최고 딜러')}</span>
            </span>
            <span className="text-white font-bold truncate max-w-full text-[9px] sm:text-[10px] mt-0.5">{tr(topDealer.name)}</span>
            <span className="font-mono text-[#ffd54f] text-[8.5px]">{topDealer.damageDealt.toLocaleString()} DMG</span>
          </div>
        )}
        {topHealer ? (
          <div className="p-1 rounded-lg bg-[#38ef7d10] border border-[#38ef7d33] flex flex-col items-center">
            <span className="text-[8.5px] text-[#38ef7d] font-bold flex items-center gap-0.5">
              <span>💚</span> <span>{tr('최고 치유')}</span>
            </span>
            <span className="text-white font-bold truncate max-w-full text-[9px] sm:text-[10px] mt-0.5">{tr(topHealer.name)}</span>
            <span className="font-mono text-[#38ef7d] text-[8.5px]">{topHealer.healingDone.toLocaleString()} HEAL</span>
          </div>
        ) : (
          <div className="p-1 rounded-lg bg-[#14161c] border border-[#212f4d] flex flex-col items-center opacity-60">
            <span className="text-[8.5px] text-[#8b9bb4] font-bold flex items-center gap-0.5">
              <span>💚</span> <span>{tr('최고 치유')}</span>
            </span>
            <span className="text-[#8b9bb4] text-[8.5px] mt-0.5">-</span>
          </div>
        )}
        {topTank && (
          <div className="p-1 rounded-lg bg-[#42a5f510] border border-[#42a5f533] flex flex-col items-center">
            <span className="text-[8.5px] text-[#42a5f5] font-bold flex items-center gap-0.5">
              <span>🛡️</span> <span>{tr('최고 방어')}</span>
            </span>
            <span className="text-white font-bold truncate max-w-full text-[9px] sm:text-[10px] mt-0.5">{tr(topTank.name)}</span>
            <span className="font-mono text-[#90caf9] text-[8.5px]">{topTank.damageTaken.toLocaleString()} GUARD</span>
          </div>
        )}
      </div>

      {/* 📋 상세 전투 리포트 표 */}
      <div className="max-h-[300px] overflow-y-auto rounded-xl border border-[#1b253b] bg-[#070b14]">
        <table className="w-full table-fixed text-left border-collapse text-[10px] sm:text-[11px]">
          <thead className="bg-[#0e1016] text-[#8b9bb4] sticky top-0 border-b border-[#1b253b] z-10 font-mono text-[9px] sm:text-[10px]">
            <tr>
              <th className="w-[28%] py-1.5 px-1 font-bold text-left truncate">{tr('전투원')}</th>
              <th className="w-[24%] py-1.5 px-1 text-right font-bold text-[#ff80ab] truncate">💥 {tr('딜량')}</th>
              <th className="w-[13%] py-1.5 px-1 text-right font-bold text-[#38ef7d] truncate">💚 {tr('치유')}</th>
              <th className="w-[13%] py-1.5 px-1 text-right font-bold text-[#90caf9] truncate">🛡️ {tr('피해')}</th>
              <th className="w-[7.3%] py-1.5 px-0.5 text-center font-bold text-[#ffd54f]">💨</th>
              <th className="w-[7.3%] py-1.5 px-0.5 text-center font-bold text-[#ce93d8]">⚡</th>
              <th className="w-[7.3%] py-1.5 px-0.5 text-center font-bold text-[#ffb74d]">🎯</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#151e30]">
            {filtered.map((item) => {
              const dmgPct = Math.min(100, Math.round((item.damageDealt / maxDmg) * 100));
              const gradeColor = (item.grade && GRADE_COLOR[item.grade]) || '#9e9e9e';
              const teamTotal = item.isPlayer ? playerDmg : enemyDmg;
              const sharePct = teamTotal > 0 ? Math.round((item.damageDealt / teamTotal) * 100) : 0;

              return (
                <tr key={item.id} className="hover:bg-[#121a2c] transition-colors">
                  {/* 전투원 정보 */}
                  <td className="py-1.5 px-1 overflow-hidden">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs sm:text-sm select-none shrink-0">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate flex items-center gap-0.5 text-[9px] sm:text-[10px] leading-tight">
                          <span className="truncate">{tr(item.name)}</span>
                          <span className="text-[7.5px] font-mono font-bold px-0.5 rounded shrink-0" style={{ color: gradeColor, backgroundColor: `${gradeColor}22` }}>
                            {item.grade?.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[7.5px] sm:text-[8.5px] text-[#8b9bb4] truncate leading-tight">
                          {tr(item.className)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 💥 딜량 + 비주얼 프로그레스 바 */}
                  <td className="py-1.5 px-1 text-right overflow-hidden">
                    <div className="font-mono font-bold text-white text-[9px] sm:text-[10px] truncate leading-tight">
                      {item.damageDealt.toLocaleString()}
                      <span className="text-[7.5px] text-[#ff80ab] ml-0.5">({sharePct}%)</span>
                    </div>
                    <div className="w-full bg-[#1e273a] h-1 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] transition-all duration-500"
                        style={{ width: `${dmgPct}%` }}
                      />
                    </div>
                  </td>

                  {/* 💚 치유량 */}
                  <td className="py-1.5 px-1 text-right font-mono font-bold text-[8.5px] sm:text-[9.5px] overflow-hidden truncate">
                    {item.healingDone > 0 ? (
                      <span className="text-[#38ef7d]">+{item.healingDone.toLocaleString()}</span>
                    ) : (
                      <span className="text-[#546e7a] font-normal">-</span>
                    )}
                  </td>

                  {/* 🛡️ 받은 피해 (방어) */}
                  <td className="py-1.5 px-1 text-right font-mono text-[#90caf9] text-[8.5px] sm:text-[9.5px] overflow-hidden truncate">
                    {item.damageTaken > 0 ? item.damageTaken.toLocaleString() : '-'}
                  </td>

                  {/* 💨 회피 횟수 */}
                  <td className="py-1.5 px-0.5 text-center font-mono font-bold text-[#ffd54f] text-[8.5px] sm:text-[9.5px]">
                    {item.dodges > 0 ? item.dodges : '-'}
                  </td>

                  {/* ⚡ 상태이상 연계 횟수 */}
                  <td className="py-1.5 px-0.5 text-center font-mono font-bold text-[#ce93d8] text-[8.5px] sm:text-[9.5px]">
                    {item.combosTriggered > 0 ? item.combosTriggered : '-'}
                  </td>

                  {/* 🎯 치명타 횟수 */}
                  <td className="py-1.5 px-0.5 text-center font-mono font-bold text-[#ffb74d] text-[8.5px] sm:text-[9.5px]">
                    {item.critCount > 0 ? item.critCount : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
