import React from 'react';
import { AppVersionService, RemoteVersionInfo } from '../services/AppVersionService';
import { SoundManager } from '../managers/SoundManager';
import { I18nService } from '../i18n/I18nService';

interface AppUpdateModalProps {
  open: boolean;
  isForceUpdate: boolean;
  currentVersion: string;
  remoteInfo: RemoteVersionInfo | null;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  open,
  isForceUpdate,
  currentVersion,
  remoteInfo,
  onClose,
}) => {
  if (!open || !remoteInfo) return null;

  const tr = (k: string) => I18nService.getInstance().tr(k);
  const sm = SoundManager.getInstance();
  const service = AppVersionService.getInstance();

  const handleUpdateClick = () => {
    sm.play('button_click');
    service.openPlayStore(remoteInfo.marketUrl, remoteInfo.webUrl);
  };

  const handleDismissToday = () => {
    sm.play('button_click');
    service.dismissForToday();
    onClose();
  };

  const handleClose = () => {
    if (isForceUpdate) return; // 강제 업데이트는 닫기 차단
    sm.play('button_click');
    onClose();
  };

  const latestVer = remoteInfo.latestVersion || '1.1.3';
  const releaseNotes = remoteInfo.releaseNotes || '• 시스템 안정화 및 버그 수정\n• 최적화 및 밸런스 개선';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={isForceUpdate ? undefined : handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0c121e] border-2 border-[#c8aa6e] shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(200,170,110,0.25)] overflow-hidden flex flex-col max-h-[85vh] text-[#cfd8dc]"
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isForceUpdate
              ? 'bg-gradient-to-r from-[#2c0e12] via-[#1a111a] to-[#2c0e12] border-[#ef535066]'
              : 'bg-gradient-to-r from-[#172238] via-[#101929] to-[#172238] border-[#c8aa6e44]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">
              {isForceUpdate ? '🚨' : '✨'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {isForceUpdate ? tr('필수 버전 업데이트 안내') : tr('신규 버전 업데이트 안내')}
                </h3>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isForceUpdate
                      ? 'bg-[#ef535033] text-[#ef5350] border border-[#ef535066]'
                      : 'bg-[#66bb6a33] text-[#66bb6a] border border-[#66bb6a66]'
                  }`}
                >
                  {isForceUpdate ? tr('필수 패치') : tr('권장')}
                </span>
              </div>
              <p className="text-[10px] text-[#8b9bb4]">
                {remoteInfo.title || 'Project: Limbo Tales'}
              </p>
            </div>
          </div>

          {!isForceUpdate && (
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg bg-[#141d2d] hover:bg-[#1f2d45] border border-[#2b3c58] text-[#8b9bb4] hover:text-white flex items-center justify-center text-sm transition-all cursor-pointer"
              title={tr('닫기')}
            >
              ✕
            </button>
          )}
        </div>

        {/* 본문 콘텐츠 */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* 버전 비교 카드 */}
          <div className="p-3 rounded-xl bg-[#101826] border border-[#1e2c44] flex items-center justify-around shadow-inner">
            <div className="text-center">
              <div className="text-[10px] text-[#8b9bb4] mb-0.5">{tr('현재 설치 버전')}</div>
              <div className="font-mono font-bold text-xs text-[#a0aec0]">
                v{currentVersion}
              </div>
            </div>
            <div className="text-[#c8aa6e] font-bold text-sm animate-pulse">➔</div>
            <div className="text-center">
              <div className="text-[10px] text-[#c8aa6e] mb-0.5 font-bold">{tr('최신 출시 버전')}</div>
              <div className="font-mono font-bold text-xs text-[#ffd54f]">
                v{latestVer}
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <p className="text-xs text-[#cfd8e8] leading-relaxed">
            {isForceUpdate
              ? tr('서버 데이터 구조 및 보안 시스템이 변경되어 원활한 게임 진행을 위해 최신 버전 업데이트가 필수적입니다. 플레이 스토어로 이동하여 업데이트를 진행해 주세요.')
              : tr('새로운 콘텐츠 추가 및 시스템 개선이 적용된 최신 버전이 구글 플레이 스토어에 출시되었습니다.')}
          </p>

          {/* 패치노트 / 변경사항 박스 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#c8aa6e]">
              <span>📜</span>
              <span>{tr('업데이트 주요 변경사항')}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#090d16] border border-[#1a253a] text-xs text-[#90a4ae] leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto font-sans shadow-inner">
              {releaseNotes}
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 바 */}
        <div className="p-3.5 bg-[#090d16] border-t border-[#1c283e] flex flex-col sm:flex-row gap-2">
          {!isForceUpdate && (
            <button
              onClick={handleDismissToday}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#141b2a] hover:bg-[#1a2336] border border-[#25344f] text-[#8b9bb4] hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              {tr('오늘 하루 보지 않기')}
            </button>
          )}

          <button
            onClick={handleUpdateClick}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              isForceUpdate
                ? 'bg-gradient-to-r from-[#d32f2f] to-[#b71c1c] hover:from-[#e53935] hover:to-[#c62828] text-white border border-[#ef5350] shadow-[#d32f2f44]'
                : 'bg-gradient-to-r from-[#c8aa6e] to-[#997b44] hover:from-[#dfbe7e] hover:to-[#aa8a4e] text-[#0a0f18] border border-[#dfbe7e] shadow-[#c8aa6e33]'
            }`}
          >
            <span>▶</span>
            <span>{tr('구글 플레이 스토어로 이동')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
