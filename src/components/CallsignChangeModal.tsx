import React, { useState } from 'react';
import { Modal } from './Modal';
import { ActionButton } from './ActionButton';
import { FirebaseService, UserProfile } from '../services/FirebaseService';
import { SoundManager } from '../managers/SoundManager';
import { useGameManager } from '../hooks/useGameManager';

interface Props {
  open: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
  onSuccess?: (newCallsign: string) => void;
}

export const CallsignChangeModal: React.FC<Props> = ({
  open,
  onClose,
  currentProfile,
  onSuccess,
}) => {
  const { gm } = useGameManager();
  const [candidate, setCandidate] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  }>({
    checked: false,
    available: false,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  const currentNick = currentProfile?.nickname || '지휘관';
  const hasAlreadyChanged = !!currentProfile?.callsignChanged;

  const handleCandidateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCandidate(val);
    setCheckStatus({ checked: false, available: false, message: '' });
    setErrorMessage(null);
  };

  const handleCheckDuplicate = async () => {
    const clean = candidate.trim();
    if (!clean) {
      setCheckStatus({
        checked: true,
        available: false,
        message: '변경할 콜사인을 입력해 주세요.',
      });
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);
    try {
      const fb = FirebaseService.getInstance();
      const res = await fb.checkCallsignAvailable(clean);
      if (res.available) {
        setCheckStatus({
          checked: true,
          available: true,
          message: `✨ [${clean}]은(는) 사용 가능한 콜사인입니다!`,
        });
        SoundManager.getInstance().play('equip');
      } else {
        setCheckStatus({
          checked: true,
          available: false,
          message: res.reason || '이미 사용 중인 콜사인입니다.',
        });
        SoundManager.getInstance().play('click');
      }
    } catch (err: any) {
      setCheckStatus({
        checked: true,
        available: false,
        message: '검증 중 오류가 발생했습니다. 네트워크를 확인해 주세요.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!checkStatus.checked || !checkStatus.available) {
      setErrorMessage('먼저 콜사인 중복 확인을 통과해 주세요.');
      return;
    }

    const clean = candidate.trim();
    if (!window.confirm(`⚠️ [콜사인 최종 확정]\n\n지휘관 호출부호를 [${clean}](으)로 등록하시겠습니까?\n\n※ 지휘관 콜사인은 계정당 단 1회만 변경할 수 있으며 이후에는 다시 수정할 수 없습니다.`)) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const fb = FirebaseService.getInstance();
      const res = await fb.updateCommanderCallsign(clean);
      if (res.success) {
        SoundManager.getInstance().play('forge_success');
        gm.addLog(`🎖️ 지휘관 콜사인이 [${clean}]으로 성공적으로 변경되었습니다. (1회 변경 완료)`, 'reward');
        onSuccess?.(clean);
        onClose();
      } else {
        setErrorMessage(res.error || '콜사인 변경에 실패했습니다.');
        SoundManager.getInstance().play('click');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || '콜사인 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🎖️ 지휘관 콜사인(호출부호) 1회 변경"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <ActionButton
            label="취소"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          />
          <ActionButton
            label={isSubmitting ? '등록 처리 중...' : '🎖️ 콜사인 확정 등록 (1회)'}
            variant="primary"
            size="sm"
            disabled={!checkStatus.available || isSubmitting || hasAlreadyChanged}
            onClick={handleSubmit}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3 py-1 text-xs text-[#cfd8dc]">
        {/* 안내 카드 */}
        <div className="p-3 rounded-xl bg-[#14161c] border border-[#c8aa6e44] flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-[#c8aa6e]">
            <span>ℹ️</span>
            <span>지휘관 콜사인 등록 안내</span>
          </div>
          <div className="text-[11px] text-[#8b9bb4] leading-relaxed">
            방주 사령부에 등록되는 지휘관님의 공식 호출부호(Callsign)입니다.
            <br />• <strong>단 1회만</strong> 변경할 수 있으며 등록 후 추가 수정이 불가합니다.
            <br />• 전 서버에서 유일한 고유 명칭이어야 하며, <strong>중복 검증</strong>을 통과해야 합니다.
            <br />• 한글, 영문, 숫자, 밑줄(_) 2~12자까지 허용됩니다.
          </div>
        </div>

        {/* 현재 콜사인 상태 */}
        <div className="p-2.5 rounded-xl bg-[#0d1424] border border-[#1e2a3e] flex items-center justify-between">
          <span className="text-[#8b9bb4]">현재 지휘관 콜사인:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#c8aa6e] font-bold text-sm">🎖️ [{currentNick}]</span>
            {hasAlreadyChanged && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef535022] text-[#ef5350] border border-[#ef535044] font-bold">
                1회 변경 소진됨
              </span>
            )}
          </div>
        </div>

        {hasAlreadyChanged ? (
          <div className="p-3 rounded-xl bg-[#241318] border border-[#ef535055] text-center text-[#ef5350] font-bold text-xs">
            이미 콜사인을 1회 변경하셨습니다. 추가 변경은 불가능합니다.
          </div>
        ) : (
          /* 변경 입력 폼 */
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-white flex items-center gap-1">
              <span>새로운 지휘관 콜사인</span>
              <span className="text-[#8b9bb4] font-normal">(2 ~ 12자)</span>
            </label>

            <div className="flex gap-1.5">
              <input
                type="text"
                maxLength={12}
                value={candidate}
                onChange={handleCandidateChange}
                placeholder="새 콜사인 입력 (예: 발키리_01)"
                className="flex-1 px-3 py-2 rounded-xl bg-[#090d18] border border-[#23324d] text-white text-xs placeholder-[#50607d] focus:border-[#c8aa6e] focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isChecking
                    ? 'bg-[#15171e] text-[#8b9bb4]'
                    : 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55] hover:bg-[#c8aa6e33] active:scale-95'
                }`}
                onClick={handleCheckDuplicate}
                disabled={isChecking || !candidate.trim() || isSubmitting}
              >
                {isChecking ? '검증 중...' : '중복 확인'}
              </button>
            </div>

            {/* 검증 결과 피드백 */}
            {checkStatus.checked && (
              <div
                className={`p-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 animate-fade-in ${
                  checkStatus.available
                    ? 'bg-[#10b98122] text-[#34d399] border border-[#10b98144]'
                    : 'bg-[#ef535022] text-[#ef5350] border border-[#ef535044]'
                }`}
              >
                <span>{checkStatus.available ? '✅' : '❌'}</span>
                <span>{checkStatus.message}</span>
              </div>
            )}

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="p-2 rounded-lg bg-[#ef535022] text-[#ef5350] border border-[#ef535044] text-[11px] font-bold flex items-center gap-1.5 animate-fade-in">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
