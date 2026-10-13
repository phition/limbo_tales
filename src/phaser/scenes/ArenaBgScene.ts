import Phaser from 'phaser';
import { GameManager } from '../../managers/GameManager';

export class ArenaBgScene extends Phaser.Scene {
  private particles: Phaser.GameObjects.Arc[] = [];
  private bgGfx: Phaser.GameObjects.Graphics | null = null;
  private arenaRingGfx: Phaser.GameObjects.Graphics | null = null;
  private isDuelActive = false;

  constructor() {
    super('ArenaBgScene');
  }

  create(): void {
    if (!this.sys || !this.sys.settings || !this.add) return;
    this.drawArena();
    this.createArenaParticles();

    const gm = GameManager.getInstance();
    const onBattleState = (active: unknown) => {
      this.isDuelActive = !!active;
      this.updateDuelAtmosphere();
    };
    gm.on('arenaBattleStateChanged', onBattleState);

    const onResize = () => {
      if (!this.sys || !this.sys.settings || !this.add) return;
      this.drawArena();
    };
    this.scale.on('resize', onResize);

    const cleanup = () => {
      gm.off('arenaBattleStateChanged', onBattleState);
      this.scale.off('resize', onResize);
      this.particles.forEach(p => {
        try { p.destroy(); } catch (_) {}
      });
      this.particles = [];
      if (this.bgGfx) {
        try { this.bgGfx.destroy(); } catch (_) {}
        this.bgGfx = null;
      }
      if (this.arenaRingGfx) {
        try { this.arenaRingGfx.destroy(); } catch (_) {}
        this.arenaRingGfx = null;
      }
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  private drawArena(): void {
    const { width, height } = this.scale;
    if (this.bgGfx) {
      try { this.bgGfx.destroy(); } catch (_) {}
    }
    this.bgGfx = this.add.graphics();
    // ⚔️ 결투장 진홍빛 암흑 그라데이션
    this.bgGfx.fillGradientStyle(0x0a050d, 0x0a050d, 0x220712, 0x160510, 1);
    this.bgGfx.fillRect(0, 0, width, height);

    // 결투장 중앙 원형 룬 링
    if (this.arenaRingGfx) {
      try { this.arenaRingGfx.destroy(); } catch (_) {}
    }
    this.arenaRingGfx = this.add.graphics();
    const cx = width / 2;
    const cy = height * 0.45;
    const radius = Math.min(width, height) * 0.38;

    this.arenaRingGfx.lineStyle(2, 0xff416c, 0.18);
    this.arenaRingGfx.strokeCircle(cx, cy, radius);
    this.arenaRingGfx.lineStyle(1, 0xffd54f, 0.12);
    this.arenaRingGfx.strokeCircle(cx, cy, radius * 0.7);
    this.arenaRingGfx.fillStyle(0xff416c, 0.04);
    this.arenaRingGfx.fillCircle(cx, cy, radius);

    this.tweens.add({
      targets: this.arenaRingGfx,
      alpha: { from: 0.6, to: 1.0 },
      scaleX: { from: 0.96, to: 1.04 },
      scaleY: { from: 0.96, to: 1.04 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createArenaParticles(): void {
    const { width, height } = this.scale;
    const particleCount = this.isDuelActive ? 30 : 18;

    for (let i = 0; i < particleCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(height * 0.15, height * 0.85);
      const color = Phaser.Math.RND.pick([0xff416c, 0xff80ab, 0xffd54f, 0xff6b4a]);
      const dot = this.add.circle(x, y, Phaser.Math.FloatBetween(1.2, 2.5), color, Phaser.Math.FloatBetween(0.12, 0.4));
      this.particles.push(dot);

      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(40, 100),
        x: x + Phaser.Math.Between(-25, 25),
        alpha: { from: dot.alpha, to: 0 },
        duration: Phaser.Math.Between(2200, 4800),
        repeat: -1,
        repeatDelay: Phaser.Math.Between(100, 1500),
        onRepeat: () => {
          if (!dot || !dot.active) return;
          dot.setPosition(Phaser.Math.Between(0, width), Phaser.Math.Between(height * 0.4, height * 0.9));
          dot.setAlpha(Phaser.Math.FloatBetween(0.12, 0.4));
        }
      });
    }
  }

  private updateDuelAtmosphere(): void {
    if (!this.arenaRingGfx) return;
    this.tweens.add({
      targets: this.arenaRingGfx,
      alpha: this.isDuelActive ? 1.0 : 0.6,
      duration: 500,
    });
  }
}
