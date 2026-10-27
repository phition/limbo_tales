import Phaser from 'phaser';

export class ExplorationBgScene extends Phaser.Scene {
  private bgGfx: Phaser.GameObjects.Graphics | null = null;
  constructor() { super('ExplorationBgScene'); }

  create(): void {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active || !this.add) return;
    this.drawBg();
    this.createParticles();

    const onResize = () => {
      this.drawBg();
    };
    this.scale.on('resize', onResize);
    const cleanup = () => {
      this.scale.off('resize', onResize);
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  private drawBg(): void {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active || !this.add) return;
    if (this.bgGfx) {
      try { this.bgGfx.destroy(); } catch (_) {}
      this.bgGfx = null;
    }
    const { width, height } = this.scale;
    this.bgGfx = this.add.graphics();
    this.bgGfx.fillGradientStyle(0x0b0d13, 0x0b0d13, 0x1a1030, 0x1a1030, 1);
    this.bgGfx.fillRect(0, 0, width, height);
  }

  private createParticles(): void {
    if (!this.sys || !this.sys.settings || !this.sys.settings.active || !this.add) return;
    const { width, height } = this.scale;
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const dot = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2), 0x7c3aed, Phaser.Math.FloatBetween(0.1, 0.3));
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(20, 60),
        alpha: { from: dot.alpha, to: 0 },
        duration: Phaser.Math.Between(2500, 6000),
        repeat: -1, repeatDelay: Phaser.Math.Between(0, 2000),
        onRepeat: () => {
          if (!dot || !dot.active) return;
          dot.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(height / 2, height));
          dot.setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));
        }
      });
    }
  }
}
