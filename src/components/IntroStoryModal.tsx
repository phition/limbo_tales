import React from 'react';
import { PrologueCinematicModal } from './PrologueCinematicModal';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenQuests?: () => void;
}

/**
 * 🎬 IntroStoryModal: 방주 성채 프롤로그 시네마틱 모달 래퍼
 * 게임의 서사와 다크 판타지 세계관을 4막 구성의 고화질 시네마틱 컷씬으로 연출합니다.
 */
export const IntroStoryModal: React.FC<Props> = (props) => {
  return <PrologueCinematicModal {...props} />;
};

export default IntroStoryModal;
