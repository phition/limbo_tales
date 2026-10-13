import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CitadelScene } from './scenes/CitadelScene';
import { ExplorationScene } from './scenes/ExplorationScene';
import { BattleScene } from './scenes/BattleScene';
import { ArenaScene } from './scenes/ArenaScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 430,
  height: 932,
  scale: {
    mode: Phaser.Scale.RESIZE,
    // autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 430,
    height: 932
  },
  backgroundColor: '#0b0d13',
  input: {
    touch: {
      capture: true
    },
    activePointers: 1
  },
  scene: [BootScene, CitadelScene, ExplorationScene, BattleScene, ArenaScene]
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
