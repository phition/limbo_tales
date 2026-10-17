import Phaser from 'phaser';

export class InvasionBgScene extends Phaser.Scene {
  private particles: Phaser.GameObjects.Arc[] = [];
  private bgGfx: Phaser.GameObjects.Graphics | null = null;
  private riftGfx: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super('InvasionBgScene');
  }

  create(): void {
    if (!this.sys || !this.sys.settings || !this.add) return;
    this.drawBackground();
    this.createPlunderAtmosphere();

    const onResize = () => {
      if (!this.sys || !this.sys.settings || !this.add) return;
      this.drawBackground();
    };
    this.scale.on('resize', onResize);

    const cleanup = () => {
      this.scale.off('resize', onResize);
      this.particles.forEach(p => {
        try { p.destroy(); } catch (_) {}
      });
      this.particles = [];
      if (this.bgGfx) {
        try { this.bgGfx.destroy(); } catch (_) {}
        this.bgGfx = null;
      }
      if (this.riftGfx) {
        try { this.riftGfx.destroy(); } catch (_) {}
        this.riftGfx = null;
      }
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  private drawBackground(): void {
    const { width, height } = this.scale;
    if (this.bgGfx) {
      try { this.bgGfx.destroy(); } catch (_) {}
    }
    this.bgGfx = this.add.graphics();
    // 🌌 차원 침공 암흑 성채 & 보라빛 공허 균열 그라데이션
    this.bgGfx.fillGradientStyle(0x060912, 0x060912, 0x1b0a24, 0x14061a, 1);
    this.bgGfx.fillRect(0, 0, width, height);

    // 공허 균열 중심 발광원
    if (this.riftGfx) {
      try { this.riftGfx.destroy(); } catch (_) {}
    }
    this.riftGfx = this.add.graphics();
    this.riftGfx.fillStyle(0x7c3aed, 0.08);
    this.riftGfx.fillCircle(width / 2, height * 0.45, Math.min(width, height) * 0.45);
    this.riftGfx.fillStyle(0xff416c, 0.05);
    this.riftGfx.fillCircle(width / 2, height * 0.45, Math.min(width, height) * 0.3);

    this.tweens.add({
      targets: this.riftGfx,
      alpha: { from: 0.7, to: 1.0 },
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createPlunderAtmosphere(): void {
    const { width, height } = this.scale;

    // 🔥 1. 공성전 화염 불씨 파티클 (Ember)
    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(height * 0.3, height);
      const color = Phaser.Math.RND.pick([0xff416c, 0xff7043, 0xffab40]);
      const size = Phaser.Math.FloatBetween(1.2, 2.8);
      const dot = this.add.circle(x, y, size, color, Phaser.Math.FloatBetween(0.15, 0.45));
      this.particles.push(dot);

      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(60, 160),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: { from: dot.alpha, to: 0 },
        duration: Phaser.Math.Between(2500, 5500),
        repeat: -1,
        repeatDelay: Phaser.Math.Between(200, 2000),
        onRepeat: () => {
          if (!dot || !dot.active) return;
          dot.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(height * 0.6, height));
          dot.setAlpha(Phaser.Math.FloatBetween(0.15, 0.45));
        }
      });
    }

    // ✨ 2. 약탈 전리품 골드/에테르 반짝임 파티클 (Gold / Ether Plunder Shards)
    for (let j = 0; j < 16; j++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(height * 0.2, height * 0.85);
      const color = Phaser.Math.RND.pick([0xffd54f, 0xc8aa6e, 0xc084fc]);
      const star = this.add.circle(x, y, Phaser.Math.FloatBetween(1.0, 2.2), color, Phaser.Math.FloatBetween(0.1, 0.4));
      this.particles.push(star);

      this.tweens.add({
        targets: star,
        scaleX: { from: 0.6, to: 1.5 },
        scaleY: { from: 0.6, to: 1.5 },
        alpha: { from: star.alpha, to: 0.05 },
        duration: Phaser.Math.Between(1800, 3800),
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeInOut'
      });
    }
  }
}
