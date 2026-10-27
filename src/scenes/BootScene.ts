import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, height / 2 - 40, 'PROJECT: LIMBO TALES', {
      fontFamily: 'Cinzel',
      fontSize: '24px',
      color: '#c8aa6e',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, '심연의 방주를 재건하는 중...', {
      fontFamily: 'Noto Sans KR',
      fontSize: '14px',
      color: '#8b9bb4'
    }).setOrigin(0.5);

    // 고품질 일러스트 에셋 로드
    this.load.image('art_citadel_bonfire', 'assets/citadel_bonfire.jpg');
    this.load.image('art_void_overlord', 'assets/void_overlord.jpg');

    this.createProceduralTextures();
  }

  create(): void {
    this.time.delayedCall(300, () => {
      this.scene.start('CitadelScene');
    });
  }

  private createProceduralTextures(): void {
    // 1. 메인 비주얼 카드 프레임 (390 x 340)
    const cardGfx = this.make.graphics({ x: 0, y: 0 });
    cardGfx.fillStyle(0x131722, 1);
    cardGfx.fillRoundedRect(0, 0, 390, 340, 16);
    cardGfx.lineStyle(2, 0x232a3b, 1);
    cardGfx.strokeRoundedRect(0, 0, 390, 340, 16);
    cardGfx.generateTexture('card_frame_medium', 390, 340);
    cardGfx.destroy();

    // 2. MUD 텍스트 로그 패널 배경 (390 x 270)
    const logGfx = this.make.graphics({ x: 0, y: 0 });
    logGfx.fillStyle(0x0e111a, 0.96);
    logGfx.fillRoundedRect(0, 0, 390, 270, 14);
    logGfx.lineStyle(1.5, 0x1f2738, 1);
    logGfx.strokeRoundedRect(0, 0, 390, 270, 14);
    logGfx.generateTexture('log_panel_tall', 390, 270);
    logGfx.destroy();

    // 3. 하단 휠(Wheel) 내비게이션 배경 (390 x 205)
    const wheelGfx = this.make.graphics({ x: 0, y: 0 });
    wheelGfx.fillStyle(0x0d1017, 0.98);
    wheelGfx.fillRoundedRect(0, 0, 390, 205, 16);
    wheelGfx.lineStyle(1.5, 0x232a3b, 1);
    wheelGfx.strokeRoundedRect(0, 0, 390, 205, 16);
    wheelGfx.generateTexture('wheel_nav_bg', 390, 205);
    wheelGfx.destroy();

    // 4. 합체 확장 인터랙션 패널 배경 (390 x 485)
    const drawerGfx = this.make.graphics({ x: 0, y: 0 });
    drawerGfx.fillStyle(0x111520, 0.99);
    drawerGfx.fillRoundedRect(0, 0, 390, 485, 16);
    drawerGfx.lineStyle(2, 0xc8aa6e, 0.8);
    drawerGfx.strokeRoundedRect(0, 0, 390, 485, 16);
    drawerGfx.generateTexture('expanded_drawer_bg', 390, 485);
    drawerGfx.destroy();

    // 5. 휠 카드 아이템 텍스처 (110 x 140)
    const itemGfx = this.make.graphics({ x: 0, y: 0 });
    itemGfx.fillStyle(0x181f2d, 1);
    itemGfx.fillRoundedRect(0, 0, 110, 140, 12);
    itemGfx.lineStyle(1.5, 0x2e3b52, 1);
    itemGfx.strokeRoundedRect(0, 0, 110, 140, 12);
    itemGfx.generateTexture('wheel_item_bg', 110, 140);
    itemGfx.destroy();

    // 6. 원형 파티클 텍스처
    const dotGfx = this.make.graphics({ x: 0, y: 0 });
    dotGfx.fillStyle(0xffffff, 1);
    dotGfx.fillCircle(4, 4, 4);
    dotGfx.generateTexture('particle_dot', 8, 8);
    dotGfx.destroy();
  }
}
