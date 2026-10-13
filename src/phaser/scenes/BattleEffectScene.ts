import Phaser from 'phaser';
import { GameManager } from '../../managers/GameManager';

export interface BattleHitEffectData {
  x?: number;
  y?: number;
  color?: number | string;
  isCrit?: boolean;
  side?: 'player' | 'enemy';
  type?: string;
}

export class BattleEffectScene extends Phaser.Scene {
  constructor() {
    super('BattleEffectScene');
  }

  create(): void {
    const gm = GameManager.getInstance();
    const onHitEffect = (data: unknown) => {
      if (!this.sys || !this.sys.settings || !this.add) return;
      const effectData = (data || {}) as BattleHitEffectData;
      this.showHitEffect(effectData);
    };
    gm.on('battleHitEffect', onHitEffect);

    const cleanup = () => {
      gm.off('battleHitEffect', onHitEffect);
    };
    this.events.once('shutdown', cleanup);
    this.events.once('destroy', cleanup);
  }

  showHitEffect(data: BattleHitEffectData): void {
    if (!this.sys || !this.sys.settings || !this.add) return;
    const { width, height } = this.scale;

    // 색상 파싱
    let numColor = 0xff4444;
    if (typeof data.color === 'number') {
      numColor = data.color;
    } else if (typeof data.color === 'string') {
      const hex = data.color.replace('#', '');
      numColor = parseInt(hex, 16) || 0xff4444;
    }

    // 좌표 파싱 (백분율 또는 중심 기준 오프셋 대응)
    let cx = width / 2;
    let cy = height * 0.45;

    if (data.x !== undefined) {
      if (data.x >= 0 && data.x <= 100) {
        cx = width * (data.x / 100);
      } else {
        cx = width / 2 + data.x;
      }
    }
    if (data.y !== undefined) {
      if (data.y >= 0 && data.y <= 100) {
        cy = height * (data.y / 100);
      } else {
        cy = height * 0.45 + data.y;
      }
    }

    const isCrit = !!data.isCrit;

    // 💥 1. 충격파 링 (Shockwave Ring)
    const baseRadius = isCrit ? 32 : 20;
    const ring = this.add.circle(cx, cy, baseRadius, isCrit ? 0xffd54f : numColor, 0.85);
    this.tweens.add({
      targets: ring,
      scaleX: isCrit ? 4.5 : 3.0,
      scaleY: isCrit ? 4.5 : 3.0,
      alpha: 0,
      duration: isCrit ? 420 : 320,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });

    // 🌟 2. 사방 폭발 파티클 (Explosion Sparks)
    const count = isCrit ? 12 : 7;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const dist = Phaser.Math.Between(isCrit ? 35 : 20, isCrit ? 90 : 55);
      const pColor = isCrit && (i % 2 === 0) ? 0xffd54f : numColor;
      const size = Phaser.Math.Between(isCrit ? 4 : 3, isCrit ? 8 : 5);
      const p = this.add.circle(cx, cy, size, pColor, 0.95);

      this.tweens.add({
        targets: p,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: Phaser.Math.Between(220, 450),
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }

    // ⚔️ 3. 크리티컬 히트일 경우 황금빛 섬광 십자선 (Crit Spark Cross)
    if (isCrit) {
      const flash = this.add.graphics();
      flash.lineStyle(3, 0xffffff, 0.9);
      flash.lineBetween(cx - 30, cy, cx + 30, cy);
      flash.lineBetween(cx, cy - 30, cx, cy + 30);
      this.tweens.add({
        targets: flash,
        scaleX: 2.0,
        scaleY: 2.0,
        alpha: 0,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => flash.destroy()
      });
    }
  }
}
