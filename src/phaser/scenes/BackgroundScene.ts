import Phaser from 'phaser';
import { GameManager } from '../../managers/GameManager';

export class BackgroundScene extends Phaser.Scene {
  private backgroundGfx: Phaser.GameObjects.Graphics | null = null;

  constructor() { super('BackgroundScene'); }

  preload(): void {
    this.load.image('art_citadel_bonfire', 'assets/citadel_bonfire.jpg');
    this.load.image('art_valkyrie_saintess', 'assets/valkyrie_saintess.jpg');
    this.load.image('art_void_overlord', 'assets/void_overlord.jpg');
  }

  create(): void {
    this.createBackground();
    this.createParticles();
    const gm = GameManager.getInstance();
    const onScreenChanged = (_screen: unknown) => {
      if (!this.sys || !this.sys.settings || !this.sys.settings.active || !this.add) return;
      this.createBackground();
    };
    gm.on('screenChanged', onScreenChanged);

    const onResize = () => {
      if (!this.sys || !this.sys.settings || !this.sys.settings.active || !this.add) return;
      this.createBackground();
    };
    this.scale.on('resize', onResize);

    const cleanup = () => {
      this.scale.off('resize', onResize);
      gm.off('screenChanged', onScreenChanged);
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  private createBackground(): void {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active || !this.add) return;
    if (this.backgroundGfx) {
      try { this.backgroundGfx.destroy(); } catch (_) {}
      this.backgroundGfx = null;
    }
    const { width, height } = this.scale;
    this.backgroundGfx = this.add.graphics();
    this.backgroundGfx.fillGradientStyle(0x0b0d13, 0x0b0d13, 0x131722, 0x131722, 1);
    this.backgroundGfx.fillRect(0, 0, width, height);
  }

  private createParticles(): void {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active || !this.add) return;
    const { width, height } = this.scale;
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const dot = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2.5), 0xc8aa6e, Phaser.Math.FloatBetween(0.1, 0.35));
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(30, 80),
        alpha: { from: dot.alpha, to: 0 },
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        repeatDelay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          if (!dot || !dot.active) return;
          dot.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(height / 2, height));
          dot.setAlpha(Phaser.Math.FloatBetween(0.1, 0.35));
        }
      });
    }
  }
}
