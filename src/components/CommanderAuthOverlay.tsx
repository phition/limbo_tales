import React, { useState, useEffect } from 'react';

interface Props {
  statusMessage?: string;
  subMessage?: string;
  isCompleted?: boolean;
}

export const CommanderAuthOverlay: React.FC<Props> = ({
  subMessage = '방주 원정대 세션 및 성채 기록 동기화 중...',
  isCompleted = false,
}) => {
  const [dotCount, setDotCount] = useState(4);

  // '....' 애니메이션 틱 효과
  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount((prev) => (prev % 4) + 1);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const displayTitle = isCompleted
    ? '지휘관 인증 확인 완료'
    : `지휘관 확인 중${'.'.repeat(dotCount)}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07080d] select-none overflow-hidden animate-fade-in">
      {/* ── 1. 시네마틱 성화 비디오 & 배경 ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="assets/citadel_bonfire.jpg"
          className="w-full h-full object-cover scale-105 opacity-30 filter brightness-75 contrast-125 transition-transform duration-1000"
        >
          <source src="assets/citadel_bonfire.mp4" type="video/mp4" />
        </video>
        {/* 심연의 다크 비네트 & 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/85 to-[#07080d]/75" />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(14, 24, 42, 0.3) 0%, rgba(7, 8, 13, 0.95) 80%, #07080d 100%)',
          }}
        />
      </div>

      {/* ── 2. 성화 불씨(Embers) 파티클 ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { left: '15%', size: 3, dur: '4.8s', color: '#00d2ff' },
          { left: '30%', size: 4, dur: '5.2s', color: '#ffd54f' },
          { left: '50%', size: 3, dur: '4.4s', color: '#ff9800' },
          { left: '70%', size: 4, dur: '5.6s', color: '#00d2ff' },
          { left: '85%', size: 3, dur: '4.9s', color: '#ffb74d' },
        ].map((ember, idx) => (
          <div
            key={idx}
            className="absolute bottom-0 rounded-full animate-ember"
            style={{
              left: ember.left,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              backgroundColor: ember.color,
              boxShadow: `0 0 ${ember.size * 3}px ${ember.color}`,
              ['--ember-dur' as any]: ember.dur,
              ['--ember-delay' as any]: `${idx * 0.4}s`,
              ['--ember-drift' as any]: `${(idx % 2 === 0 ? 1 : -1) * 20}px`,
            }}
          />
        ))}
      </div>

      {/* ── 3. 지휘관 인증 HUD 카드 ── */}
      <div className="relative z-10 w-full max-w-[360px] mx-4 p-7 rounded-2xl bg-[#0c1220ee] border border-[#00d2ff44] shadow-[0_12px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,210,255,0.18)] backdrop-blur-xl flex flex-col items-center text-center">
        {/* 상단 사이버 엠블럼 */}
        <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
          {/* 외곽 회전 홀로그램 링 */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00d2ff55] animate-spin [animation-duration:9s]" />
          {/* 중간 펄스 링 */}
          <div className="absolute inset-2 rounded-full border border-[#38ef7d44] animate-pulse" />
          {/* 중앙 지휘관 훈장 */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0c1c2e] to-[#142940] border border-[#00d2ff88] flex items-center justify-center shadow-[0_0_20px_rgba(0,210,255,0.5)]">
            <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,213,79,0.8)]">
              {isCompleted ? '⚔️' : '⚜️'}
            </span>
          </div>
        </div>

        {/* 상단 관제 서브태그 */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00d2ff15] border border-[#00d2ff33] text-[10px] font-mono tracking-widest text-[#00d2ff] mb-2 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] animate-ping" />
          ARK COMMAND PROTOCOL
        </div>

        {/* 메인 타이틀: 지휘관 확인 중.... */}
        <h2 className="text-lg sm:text-xl font-bold tracking-wider text-white mb-2 min-h-[28px] flex items-center justify-center">
          <span className="bg-gradient-to-r from-[#e0f7fa] via-[#00d2ff] to-[#80deea] bg-clip-text text-transparent filter drop-shadow-[0_0_12px_rgba(0,210,255,0.4)]">
            {displayTitle}
          </span>
        </h2>

        {/* 상태 설명 서브메시지 */}
        <p className="text-xs text-[#8b9bb4] leading-relaxed mb-6 max-w-[280px]">
          {isCompleted ? '생체 인증 동기화 완료. 방주 성채로 진입합니다.' : subMessage}
        </p>

        {/* 사이버 게이지 / 에너지 바 */}
        <div className="w-full h-1.5 bg-[#101827] rounded-full overflow-hidden border border-[#1f2d45] relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? 'w-full bg-gradient-to-r from-[#00d2ff] to-[#38ef7d]'
                : 'w-2/3 bg-gradient-to-r from-[#00d2ff] via-[#80deea] to-[#38ef7d] animate-pulse'
            }`}
            style={{
              boxShadow: '0 0 10px rgba(0, 210, 255, 0.8)',
            }}
          />
        </div>

        {/* 하단 시스템 상태 안내 */}
        <div className="mt-4 flex items-center justify-between w-full text-[10px] font-mono text-[#546e7a]">
          <span>STATUS: VERIFYING</span>
          <span className="text-[#00d2ff88]">LINK ESTABLISHED</span>
        </div>
      </div>
    </div>
  );
};
