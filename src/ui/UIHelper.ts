import Phaser from 'phaser';

/**
 * 공통 UI 유틸리티 — 모든 씬에서 공유하는 버튼/카드/드로어 생성 함수.
 * 씬별 중복 코드를 제거하고 색상 타입을 number로 통일합니다.
 */

export function createActionButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  accentColor: number,
  callback: () => void,
  disabled = false
): Phaser.GameObjects.Container {
  const btn = scene.add.container(x, y);

  const bg = scene.add.graphics();
  bg.fillStyle(disabled ? 0x1a1a22 : 0x1a2130, 1);
  bg.fillRoundedRect(0, 0, w, h, 8);
  bg.lineStyle(1.5, disabled ? 0x333344 : accentColor, disabled ? 0.3 : 0.9);
  bg.strokeRoundedRect(0, 0, w, h, 8);

  const lbl = scene.add.text(w / 2, h / 2, text, {
    fontFamily: 'Noto Sans KR',
    fontSize: '12px',
    color: disabled ? '#555566' : '#ffffff',
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5);

  btn.add([bg, lbl]);
  btn.setSize(w, h);

  if (!disabled) {
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(accentColor, 0.15);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.lineStyle(2, accentColor, 1);
      bg.strokeRoundedRect(0, 0, w, h, 8);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a2130, 1);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.lineStyle(1.5, accentColor, 0.9);
      bg.strokeRoundedRect(0, 0, w, h, 8);
    });
    btn.on('pointerdown', () => callback());
  }

  return btn;
}

export function createDirButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  callback: () => void
): Phaser.GameObjects.Container {
  const btn = scene.add.container(x, y);
  const r = 30;

  const bg = scene.add.graphics();
  bg.fillStyle(0x1a2434, 1);
  bg.fillCircle(0, 0, r);
  bg.lineStyle(1.5, 0xc8aa6e, 0.8);
  bg.strokeCircle(0, 0, r);

  const lbl = scene.add.text(0, 0, text, {
    fontFamily: 'Noto Sans KR',
    fontSize: '11px',
    color: '#ffffff',
    fontStyle: 'bold',
    align: 'center'
  }).setOrigin(0.5);

  btn.add([bg, lbl]);
  btn.setSize(r * 2, r * 2);
  btn.setInteractive({ useHandCursor: true });
  btn.on('pointerover', () => { bg.clear(); bg.fillStyle(0xc8aa6e, 0.25); bg.fillCircle(0, 0, r); bg.lineStyle(2, 0xc8aa6e, 1); bg.strokeCircle(0, 0, r); });
  btn.on('pointerout',  () => { bg.clear(); bg.fillStyle(0x1a2434, 1); bg.fillCircle(0, 0, r); bg.lineStyle(1.5, 0xc8aa6e, 0.8); bg.strokeCircle(0, 0, r); });
  btn.on('pointerdown', () => callback());
  return btn;
}

export function createSkillButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  skill: { name: string; description: string; manaCost: number; icon: string },
  callback: () => void,
  isSpecial = false
): Phaser.GameObjects.Container {
  const btn = scene.add.container(x, y);

  const bg = scene.add.graphics();
  bg.fillStyle(isSpecial ? 0x331422 : 0x212a3d, 1);
  bg.fillRoundedRect(0, 0, w, h, 8);
  bg.lineStyle(1.5, isSpecial ? 0xffd54f : 0xc8aa6e, 0.9);
  bg.strokeRoundedRect(0, 0, w, h, 8);

  const nameLbl = scene.add.text(14, 10,
    `${skill.icon} ${skill.name} (MP ${skill.manaCost})`, {
    fontFamily: 'Noto Sans KR',
    fontSize: '11px',
    color: isSpecial ? '#ffd54f' : '#ffffff',
    fontStyle: 'bold'
  });

  const descLbl = scene.add.text(14, 28, skill.description, {
    fontFamily: 'Noto Sans KR',
    fontSize: '10px',
    color: isSpecial ? '#ffecb3' : '#8b9bb4',
    wordWrap: { width: w - 28 }
  });

  btn.add([bg, nameLbl, descLbl]);
  btn.setSize(w, h);
  btn.setInteractive({ useHandCursor: true });
  btn.on('pointerdown', () => callback());
  return btn;
}

/**
 * 확장 드로어 패널 컨테이너를 생성합니다. (Y: 405 ~ 890)
 * 닫기 버튼 콜백을 받아 연결합니다.
 */
export function createDrawerPanel(
  scene: Phaser.Scene,
  w: number,
  title: string,
  accentColor: number,
  closeLabel: string,
  onClose: () => void
): {
  panelContainer: Phaser.GameObjects.Container;
  scrollArea: Phaser.GameObjects.Container;
} {
  const drawerW = w - 40;
  const drawerH = 485;
  const panelContainer = scene.add.container(20, 405);

  const bg = scene.add.graphics();
  bg.fillStyle(0x131722, 0.98);
  bg.fillRoundedRect(0, 0, drawerW, drawerH, 16);
  bg.lineStyle(2, accentColor, 0.85);
  bg.strokeRoundedRect(0, 0, drawerW, drawerH, 16);
  panelContainer.add(bg);

  const headerGfx = scene.add.graphics();
  headerGfx.fillStyle(0x1a1d28, 1);
  headerGfx.fillRoundedRect(4, 4, drawerW - 8, 44, { tl: 14, tr: 14, bl: 0, br: 0 });
  headerGfx.lineStyle(1, Phaser.Display.Color.IntegerToColor(accentColor).darken(20).color, 1);
  headerGfx.lineBetween(4, 48, drawerW - 4, 48);
  panelContainer.add(headerGfx);

  const titleText = scene.add.text(18, 24, title, {
    fontFamily: 'Noto Sans KR',
    fontSize: '14px',
    color: Phaser.Display.Color.IntegerToColor(accentColor).lighten(20).rgba,
    fontStyle: 'bold'
  }).setOrigin(0, 0.5);
  panelContainer.add(titleText);

  const closeBtn = createActionButton(scene, drawerW - 100, 10, 90, 28, closeLabel, 0x78909c, onClose);
  panelContainer.add(closeBtn);

  const scrollArea = scene.add.container(12, 54);
  panelContainer.add(scrollArea);

  return { panelContainer, scrollArea };
}
