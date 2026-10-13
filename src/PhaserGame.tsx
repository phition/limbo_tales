import React, { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import { BackgroundScene } from './phaser/scenes/BackgroundScene';
import { BattleEffectScene } from './phaser/scenes/BattleEffectScene';
import { ExplorationBgScene } from './phaser/scenes/ExplorationBgScene';
import { ArenaBgScene } from './phaser/scenes/ArenaBgScene';
import { InvasionBgScene } from './phaser/scenes/InvasionBgScene';
import { GameManager } from './managers/GameManager';

interface Props {
  activeScene?: string;
}

/**
 * PhaserGame — Phaser 캔버스를 마운트하는 React 컴포넌트
 * UI는 React(TypeScript)가 전담하고, Phaser는 배경 그라데이션 + 파티클 + 타격 이펙트 엔진 레이어(z-index 0)를 렌더링
 */
export const PhaserGame: React.FC<Props> = ({ activeScene }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const switchBgScene = useCallback((targetSceneKey: string) => {
    const game = gameRef.current;
    if (!game || !game.scene) return;

    const allBgScenes = ['BackgroundScene', 'ExplorationBgScene', 'ArenaBgScene', 'InvasionBgScene'];
    allBgScenes.forEach(key => {
      if (key !== targetSceneKey && game.scene.isActive(key)) {
        game.scene.stop(key);
      }
    });

    if (!game.scene.isActive(targetSceneKey)) {
      game.scene.start(targetSceneKey);
    }

    // BattleEffectScene은 항상 최상단 이펙트 오버레이로 활성화
    if (!game.scene.isActive('BattleEffectScene')) {
      game.scene.start('BattleEffectScene');
    }
    game.scene.bringToTop('BattleEffectScene');
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: '100%',
      height: '100%',
      transparent: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: { touch: { capture: true } },
      audio: { noAudio: true },
      scene: [BackgroundScene, BattleEffectScene, ExplorationBgScene, ArenaBgScene, InvasionBgScene],
    };

    gameRef.current = new Phaser.Game(config);

    // 초기 활성 씬 전환
    setTimeout(() => {
      if (activeScene === 'arena') switchBgScene('ArenaBgScene');
      else if (activeScene === 'exploration' || activeScene === 'battle') switchBgScene('ExplorationBgScene');
      else switchBgScene('BackgroundScene');
    }, 100);

    const gm = GameManager.getInstance();
    const handlePhaserChange = (key: unknown) => {
      const s = String(key);
      if (s === 'arena' || s === 'arena_battle') switchBgScene('ArenaBgScene');
      else if (s === 'invasion' || s === 'invasion_battle') switchBgScene('InvasionBgScene');
      else if (s === 'exploration' || s === 'battle') switchBgScene('ExplorationBgScene');
      else switchBgScene('BackgroundScene');
    };

    const handleScreenChange = (screen: unknown) => {
      const s = String(screen);
      if (s === 'arena') switchBgScene('ArenaBgScene');
      else if (s === 'exploration' || s === 'battle') switchBgScene('ExplorationBgScene');
      else switchBgScene('BackgroundScene');
    };

    gm.on('phaserSceneChange', handlePhaserChange);
    gm.on('screenChanged', handleScreenChange);

    return () => {
      gm.off('phaserSceneChange', handlePhaserChange);
      gm.off('screenChanged', handleScreenChange);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [switchBgScene, activeScene]);

  // Props activeScene 변경 시 반응
  useEffect(() => {
    if (!gameRef.current) return;
    if (activeScene === 'arena') switchBgScene('ArenaBgScene');
    else if (activeScene === 'exploration' || activeScene === 'battle') switchBgScene('ExplorationBgScene');
    else switchBgScene('BackgroundScene');
  }, [activeScene, switchBgScene]);

  return (
    <div
      ref={containerRef}
      id="phaser-canvas-layer"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
