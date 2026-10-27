// @ts-nocheck
import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { PROMPT_REGISTRY, PromptData } from '../data/prompts';
import { BuildingId, PositionSlot, EquipmentSlot, Mercenary } from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { EQUIPMENT_RECIPES } from '../data/equipment';

interface WheelItem {
  key: string;
  label: string;
  sub: string;
  icon: string;
  promptKey: string;
  themeColor: number;
  isScene?: boolean;
  sceneKey?: string;
}

export class CitadelScene extends Phaser.Scene {
  private gm!: GameManager;

  // 상단 슬림 상태바
  private resText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;

  // 1. 상단 메인 비주얼 카드 (H: 340px)
  private cardContainer!: Phaser.GameObjects.Container;
  private cardBorderGfx!: Phaser.GameObjects.Graphics;
  private cardInnerGfx!: Phaser.GameObjects.Graphics;
  private cardTitleText!: Phaser.GameObjects.Text;
  private cardDescText!: Phaser.GameObjects.Text;
  private cardPromptText!: Phaser.GameObjects.Text;
  private isPromptMode: boolean = false;

  // 2. 기본 상태: 중단 MUD 로그 패널 (H: 270px)
  private logContainer!: Phaser.GameObjects.Container;
  private logLines: Phaser.GameObjects.Text[] = [];

  // 2-1. 합체 확장 상태: 1줄 실시간 피드백 로그 바 (H: 35px, Y: 405)
  private singleLogContainer!: Phaser.GameObjects.Container;
  private singleLogText!: Phaser.GameObjects.Text;

  // 3. 기본 상태: 하단 휠 내비게이션 (H: 205px, Y: 685)
  private wheelContainer!: Phaser.GameObjects.Container;
  private wheelItems: WheelItem[] = [
    { key: 'citadel', label: '방주 영지', sub: '건설 & 자원 관리', icon: '🏰', promptKey: 'citadel_bonfire', themeColor: 0xff7b25 },
    { key: 'barracks', label: '원정단 편성', sub: '진형 & 전직 & 장비 관리', icon: '⚔️', promptKey: 'hero_squire', themeColor: 0xc8aa6e },
    { key: 'quests', label: '퀘스트 & 연계', sub: '메인 스토리 & 시설', icon: '📜', promptKey: 'citadel_cabin', themeColor: 0x38ef7d },
    { key: 'explore', label: '심연 탐험', sub: 'MUD 던전 5층', icon: '🌌', promptKey: 'dungeon_limbo_gate', themeColor: 0x5c6bc0 },
    { key: 'arena', label: '차원 아레나', sub: '비동기 PVP 랭킹', icon: '🏆', promptKey: 'citadel_arena', themeColor: 0xff416c, isScene: true, sceneKey: 'ArenaScene' }
  ];
  private selectedWheelIndex: number = 0;
  private wheelItemContainers: Phaser.GameObjects.Container[] = [];

  // 4. 합체 확장 인터랙션 드로어 패널 (H: 445px, Y: 445)
  private drawerContainer!: Phaser.GameObjects.Container;
  private drawerTitleText!: Phaser.GameObjects.Text;
  private drawerContentScrollArea!: Phaser.GameObjects.Container;
  private isDrawerOpen: boolean = false;
  private currentDrawerTab: string = 'citadel';
  private forgeSubTab: 'craft' | 'enchant' = 'craft';
  private scrollOffsetY: number = 0;
  private maxScrollY: number = 0;
  private selectedHeroIndex: number = 0;

  // 상단 메인 카드 내 장비 선택 스크롤 오버레이 관련 변수
  private equipOverlayContainer?: Phaser.GameObjects.Container;
  private equipScrollArea?: Phaser.GameObjects.Container;
  private equipScrollOffsetY: number = 0;
  private equipMaxScrollY: number = 0;
  private isEquipDragging: boolean = false;
  private equipDragStartY: number = 0;
  private equipDragStartOffsetY: number = 0;
  private hasPassedEquipDragThreshold: boolean = false;

  // 스크롤 드래그 슬롭 판별 변수 (미세 흔들림으로 인한 버튼 터치 무시 방지)
  private isScrollTouching: boolean = false;
  private hasPassedScrollThreshold: boolean = false;
  private scrollTouchStartY: number = 0;
  private scrollTouchStartX: number = 0;
  private scrollStartOffsetY: number = 0;

  private resizeTimer?: number;
  private safeW: number = 430;
  private safeX: number = 0;
  private safeY: number = 0;
    private barContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private heroDetailFullscreenContainer!: Phaser.GameObjects.Container;
  private bgContainer!: Phaser.GameObjects.Container;
  constructor() {
    super('CitadelScene');
  }

  create(): void {
    this.gm = GameManager.getInstance();
    this.gm.currentSceneContext = 'citadel';
    this.logLines = [];
    this.wheelItemContainers = [];
    this.isPromptMode = false;
    this.isDrawerOpen = false;
    this.scrollOffsetY = 0;
    this.selectedWheelIndex = 0;
    this.isScrollTouching = false;
    this.hasPassedScrollThreshold = false;

    this.bgContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    this.setupScrollInput();
    this.bindEvents();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const circle = this.add.circle(pointer.worldX, pointer.worldY, 8, 0xc8aa6e, 0.6).setDepth(9999);
      this.tweens.add({
        targets: circle,
        radius: 22,
        alpha: 0,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => circle.destroy()
      });
    });

    this.scale.on('resize', this.onResize, this);
    this.rebuildUI();
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    if (this.cameras.main) {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
    }
    if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.rebuildUI(), 200);
  }

  private rebuildUI() {
    this.bgContainer.removeAll(true);
    this.uiContainer.removeAll(true);
    if ((this as any).heroDetailFullscreenContainer) (this as any).heroDetailFullscreenContainer.destroy(true);

    const sw = this.scale.width;
    const sh = this.scale.height;
    const DESIGN_WIDTH = 430;
    const DESIGN_HEIGHT = 932;
    const zoom = Math.min(sw / DESIGN_WIDTH, sh / DESIGN_HEIGHT);
    const logicalW = sw / zoom;
    const logicalH = sh / zoom;
    const safeW = DESIGN_WIDTH;
    const safeX = (logicalW - safeW) / 2;
    const safeY = (logicalH - DESIGN_HEIGHT) / 2;
    this.safeW = safeW;
    this.safeX = safeX;
    this.safeY = safeY;
    

    this.cameras.main.setOrigin(0, 0);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setScroll(0, 0);

    this.createAtmosphere(logicalW, logicalH, 0, 0);
    this.uiContainer.setPosition(safeX, safeY);
    
    this.createStatusBar(safeW);
    if (this.barContainer) this.uiContainer.add(this.barContainer);

    this.createMediumCardFrame(safeW);
    if (this.cardContainer) this.uiContainer.add(this.cardContainer);

    this.createLogPanel(safeW);
    if (this.logContainer) this.uiContainer.add(this.logContainer);

    this.createSingleLineLogBar(safeW);
    if (this.singleLogContainer) this.uiContainer.add(this.singleLogContainer);

    this.createWheelNavigation(safeW);
    if (this.wheelContainer) this.uiContainer.add(this.wheelContainer);

    this.createExpandedDrawer(safeW);
    if (this.drawerContainer) this.uiContainer.add(this.drawerContainer);

    this.heroDetailFullscreenContainer = this.add.container(20, 55).setDepth(2000).setVisible(false);
    this.uiContainer.add(this.heroDetailFullscreenContainer);

    this.updateCardDisplay((this as any).cardArtImage?.texture.key.replace('art_', '') || 'citadel_bonfire');
    this.updateLogs();

    if (this.isDrawerOpen) {
      this.drawerContainer.setVisible(true);
    }

    const resetBtn = this.add.text(safeW - 15, 15, '초기화', {
      fontSize: '12px', color: '#ff4444', fontFamily: 'Noto Sans KR', fontStyle: 'bold'
    }).setOrigin(1, 0).setInteractive().setDepth(100);
    resetBtn.on('pointerdown', () => {
      if (confirm('모든 데이터를 초기화하시겠습니까?')) {
        // this.gm.resetGame();
        location.reload();
      }
    });
    this.uiContainer.add(resetBtn);
  }

  private createAtmosphere(w: number, h: number, x: number = 0, y: number = 0): void {
    const bgGfx = this.add.graphics();
    bgGfx.setPosition(x, y);
    bgGfx.fillGradientStyle(0x0b0d13, 0x0b0d13, 0x141a29, 0x141a29, 1);
    bgGfx.fillRect(0, 0, w, h);
    this.bgContainer.add(bgGfx);

    const particles = this.add.particles(x, y, 'particle_dot', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      quantity: 1,
      frequency: 250,
      lifespan: 4000,
      speedY: { min: -15, max: -35 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 },
      tint: [0xc8aa6e, 0xff7b25, 0xab47bc]
    });
    this.bgContainer.add(particles);
  }

  private createStatusBar(w: number): void {
    this.barContainer = this.add.container(0, 0);
    const barContainer = this.barContainer;
    const barGfx = this.add.graphics();
    barGfx.fillStyle(0x0e111a, 0.95);
    barGfx.fillRect(0, 0, w, 50);
    barGfx.lineStyle(1, 0x232a3b, 1);
    barGfx.lineBetween(0, 50, w, 50);
    barContainer.add(barGfx);

    this.resText = this.add.text(15, 8, '', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#f0f3f8'
    });
    barContainer.add(this.resText);

    this.rankText = this.add.text(w - 15, 8, '', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#c8aa6e',
      align: 'right'
    }).setOrigin(1, 0);
    barContainer.add(this.rankText);

    this.updateStatusBar();
  }

  private updateStatusBar(): void {
    const r = this.gm.resources;
    
    const fmt = (key: keyof GameResources) => {
      if (key === 'gold') {
        const g = r[key] || 0;
        if (g >= 1_000_000_000) return `${(g / 1_000_000_000).toFixed(2)}B`;
        if (g >= 1_000_000) {
          const inM = g / 1_000_000;
          return `${inM >= 10 ? inM.toFixed(1) : inM.toFixed(2)}M`;
        }
        return `${g}`;
      }
      const max = this.gm.getMaxResourceCapacity(key);
      return `${r[key]}/${max}`;
    };

    this.resText.setText(
      `🪵 ${fmt('wood')}  🪨 ${fmt('stone')}  ⛓️ ${fmt('iron')} | 🍖 ${fmt('food')}  🪙 ${fmt('gold')}  ✨ ${fmt('ether')}`
    );

    const buffMark = this.gm.pveBuffActive ? ' [★TOP10 PVE버프]' : '';
    this.rankText.setText(
      `🏆 아레나 ${this.gm.currentArenaRank}위 (${this.gm.currentArenaRating}P)${buffMark}\n방주 성채 (Chapter 1)`
    );
    this.rankText.setColor(this.gm.pveBuffActive ? '#ffeb3b' : '#c8aa6e');
  }

  private cardArtImage!: Phaser.GameObjects.Image;

  private createMediumCardFrame(w: number): void {
    const cardY = 55;
    const cardW = w - 40;
    const cardH = 340;

    this.cardContainer = this.add.container(20, cardY);
    this.cardInnerGfx = this.add.graphics();

    // 실제 AI 생성 고해상도 일러스트 이미지
    this.cardArtImage = this.add.image(cardW / 2, cardH / 2 + 10, 'art_citadel_bonfire').setOrigin(0.5);
    this.cardArtImage.setDisplaySize(cardW - 16, cardH - 58);
    this.cardArtImage.setAlpha(0.7);

    // 이미지 마스크
    const artMaskShape = this.make.graphics({ x: 0, y: 0 });
    artMaskShape.fillStyle(0xffffff);
    artMaskShape.fillRoundedRect(28, cardY + 48, cardW - 16, cardH - 58, 12);
    this.cardArtImage.setMask(artMaskShape.createGeometryMask());

    this.cardBorderGfx = this.add.graphics();
    this.cardContainer.add([this.cardInnerGfx, this.cardArtImage, this.cardBorderGfx]);

    this.cardTitleText = this.add.text(cardW / 2, 24, '', {
      fontFamily: 'Cinzel',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.cardContainer.add(this.cardTitleText);

    this.cardDescText = this.add.text(cardW / 2, cardH - 35, '', {
      fontFamily: 'Noto Sans KR',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: cardW - 36 },
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
    this.cardContainer.add(this.cardDescText);

    this.cardPromptText = this.add.text(18, 55, '', {
      fontFamily: 'JetBrains Mono',
      fontSize: '11px',
      color: '#80e5ff',
      wordWrap: { width: cardW - 36 },
      lineSpacing: 3,
      backgroundColor: '#0a0d14ee',
      padding: { x: 8, y: 8 }
    }).setVisible(false);
    this.cardContainer.add(this.cardPromptText);

    const toggleBtn = this.add.container(cardW - 135, 12);
    const tBg = this.add.graphics();
    tBg.fillStyle(0x000000, 0.6);
    tBg.fillRoundedRect(0, 0, 120, 24, 12);
    tBg.lineStyle(1, 0xc8aa6e, 0.8);
    tBg.strokeRoundedRect(0, 0, 120, 24, 12);

    const tLbl = this.add.text(60, 12, '🎨 AI 프롬프트', {
      fontFamily: 'Noto Sans KR',
      fontSize: '10px',
      color: '#c8aa6e'
    }).setOrigin(0.5);

    toggleBtn.add([tBg, tLbl]);
    toggleBtn.setSize(120, 24);
    toggleBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 120, 24), Phaser.Geom.Rectangle.Contains);
    toggleBtn.input!.cursor = 'pointer';
    toggleBtn.on('pointerdown', () => {
      this.isPromptMode = !this.isPromptMode;
      tLbl.setText(this.isPromptMode ? '🖼️ 비주얼 뷰' : '🎨 AI 프롬프트');
      this.cardDescText.setVisible(!this.isPromptMode);
      this.cardArtImage.setVisible(!this.isPromptMode);
      this.cardPromptText.setVisible(this.isPromptMode);
    });

    this.cardContainer.add(toggleBtn);
  }

  public updateCardDisplay(promptKey: string): void {
    const data: PromptData = PROMPT_REGISTRY[promptKey] || PROMPT_REGISTRY['citadel_bonfire'];
    const cardW = this.safeW - 40;
    const cardH = 340;

    this.cardInnerGfx.clear();
    this.cardInnerGfx.fillStyle(0x131722, 0.96);
    this.cardInnerGfx.fillRoundedRect(0, 0, cardW, cardH, 16);

    this.cardInnerGfx.fillStyle(data.themeColor, 0.25);
    this.cardInnerGfx.fillRoundedRect(4, 4, cardW - 8, 44, { tl: 14, tr: 14, bl: 0, br: 0 });

    this.cardBorderGfx.clear();
    this.cardBorderGfx.lineStyle(2, data.themeColor, 0.9);
    this.cardBorderGfx.strokeRoundedRect(0, 0, cardW, cardH, 16);

    this.cardBorderGfx.lineStyle(3, 0xffffff, 0.8);
    this.cardBorderGfx.strokeCircle(10, 10, 3);
    this.cardBorderGfx.strokeCircle(cardW - 10, 10, 3);

    // 실제 이미지 텍스처 바인딩
    if (promptKey === 'citadel_bonfire' && this.textures.exists('art_citadel_bonfire')) {
      this.cardArtImage.setTexture('art_citadel_bonfire').setVisible(!this.isPromptMode);
    } else if ((promptKey === 'hero_valkyrie' || promptKey === 'hero_paladin') && this.textures.exists('art_citadel_bonfire')) {
      this.cardArtImage.setTexture('art_citadel_bonfire').setVisible(!this.isPromptMode);
    } else if (promptKey.includes('boss') && this.textures.exists('art_void_overlord')) {
      this.cardArtImage.setTexture('art_void_overlord').setVisible(!this.isPromptMode);
    } else if (this.textures.exists('art_citadel_bonfire')) {
      this.cardArtImage.setTexture('art_citadel_bonfire').setVisible(!this.isPromptMode);
    }

    this.cardTitleText.setText(data.title);
    this.cardDescText.setText(data.description);
    this.cardPromptText.setText(`[IMAGE PROMPT]\n${data.prompt}\n\n[NEGATIVE PROMPT]\n${data.negativePrompt}`);
  }

  private createLogPanel(w: number): void {
    const logY = 405;
    const logW = w - 40;
    this.logContainer = this.add.container(20, logY);

    const logBg = this.add.image(0, 0, 'log_panel_tall').setOrigin(0, 0);
    this.logContainer.add(logBg);

    const header = this.add.text(14, 12, '📜 [방주 실시간 텍스트 기록]', {
      fontFamily: 'Noto Sans KR',
      fontSize: '12px',
      color: '#c8aa6e',
      fontStyle: 'bold'
    });
    this.logContainer.add(header);

    this.logLines = [];
    for (let i = 0; i < 7; i++) {
      const lineText = this.add.text(14, 38 + i * 30, '', {
        fontFamily: 'Noto Sans KR',
        fontSize: '12px',
        color: '#8b9bb4',
        wordWrap: { width: logW - 28, useAdvancedWrap: true }
      });
      this.logLines.push(lineText);
      this.logContainer.add(lineText);
    }
  }

  private createSingleLineLogBar(w: number): void {
    const logY = 405;
    const logW = w - 40;
    this.singleLogContainer = this.add.container(20, logY).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e111a, 0.98);
    bg.fillRoundedRect(0, 0, logW, 35, 8);
    bg.lineStyle(1, 0xc8aa6e, 0.8);
    bg.strokeRoundedRect(0, 0, logW, 35, 8);
    this.singleLogContainer.add(bg);

    this.singleLogText = this.add.text(12, 10, '', {
      fontFamily: 'Noto Sans KR',
      fontSize: '12px',
      color: '#38ef7d',
      fontStyle: 'bold',
      wordWrap: { width: logW - 24, useAdvancedWrap: true }
    });
    this.singleLogContainer.add(this.singleLogText);
  }

  private updateLogs(): void {
    if (!this.logLines || this.logLines.length === 0) return;
    const cLogs = (this.gm.citadelLogs && this.gm.citadelLogs.length > 0 ? this.gm.citadelLogs : this.gm.logs).filter(l => !GameManager.isAnchorGateLog(l.text));
    const recent = cLogs.slice(-7);
    for (let i = 0; i < 7; i++) {
      const line = this.logLines[i];
      if (!line || !line.scene || !line.active) continue;
      if (i < recent.length) {
        const item = recent[i];
        let color = '#8b9bb4';
        let prefix = '• ';
        let fontSize = '11px';
        let fontStyle = 'normal';
        
        if (item.type === 'reward') { color = '#38ef7d'; prefix = '★ '; fontStyle = 'bold'; }
        if (item.type === 'danger') { color = '#ff416c'; prefix = '⚠️ '; fontStyle = 'bold'; }
        if (item.type === 'story') { color = '#c8aa6e'; prefix = '📜 '; fontStyle = 'bold'; }
        if (item.type === 'bonfire0') { color = '#5c6c8c'; prefix = '❄️ '; }
        if (item.type === 'bonfire1') { color = '#ffb347'; prefix = '🔥 '; fontSize = '11px'; fontStyle = 'bold'; }
        if (item.type === 'bonfire2') { color = '#ff9f00'; prefix = '🔥 '; fontSize = '12px'; fontStyle = 'bold'; }
        if (item.type === 'bonfire3') { color = '#ff7b00'; prefix = '🔥 '; fontSize = '12.5px'; fontStyle = 'bold'; }
        if (item.type === 'bonfire4') { color = '#ff5400'; prefix = '🔥 '; fontSize = '13px'; fontStyle = 'bold'; }
        if (item.type === 'bonfire5') { color = '#ff3300'; prefix = '🔥 [버프] '; fontSize = '13.5px'; fontStyle = 'bold'; }
        if (item.type === 'bonfire_extend') { color = '#ff9f00'; prefix = '🪵 '; fontSize = '12px'; fontStyle = 'bold'; }

        line.setColor(color);
        line.setFontSize(fontSize);
        line.setFontStyle(fontStyle);
        line.setText(`${prefix}${item.text}`);
      } else {
        line.setText('');
      }
    }

    if (cLogs.length > 0 && this.singleLogText && this.singleLogText.scene && this.singleLogText.active) {
      const latest = cLogs[cLogs.length - 1];
      let color = '#38ef7d';
      let prefix = '📢 [피드백] ';
      if (latest.type === 'danger') { color = '#ff416c'; prefix = '⚠️ [경고] '; }
      if (latest.type === 'story') { color = '#c8aa6e'; prefix = '📜 [스토리] '; }
      if (latest.type === 'normal') { color = '#cfd8dc'; prefix = '• [안내] '; }
      if (latest.type.startsWith('bonfire')) { color = '#ff7b00'; prefix = '🔥 [모닥불] '; }

      this.singleLogText.setColor(color);
      this.singleLogText.setText(`${prefix}${latest.text}`);
    }
  }

  private createWheelNavigation(w: number): void {
    const wheelY = 685;
    const wheelW = w - 40;
    this.wheelContainer = this.add.container(20, wheelY);

    const wheelBg = this.add.image(0, 0, 'wheel_nav_bg').setOrigin(0, 0);
    this.wheelContainer.add(wheelBg);

    const promptText = this.add.text(wheelW / 2, 16, '🎡 원하는 행동을 선택하세요 (탭하여 상세 열기)', {
      fontFamily: 'Noto Sans KR',
      fontSize: '12px',
      color: '#c8aa6e',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.wheelContainer.add(promptText);

    const itemsGroup = this.add.container(0, 36);
    this.wheelContainer.add(itemsGroup);

    const leftArrow = this.createArrowButton(22, 105, '◀', () => this.rotateWheel(-1));
    const rightArrow = this.createArrowButton(wheelW - 22, 105, '▶', () => this.rotateWheel(1));
    this.wheelContainer.add([leftArrow, rightArrow]);

    this.renderWheelItems(itemsGroup, wheelW);
  }

  private renderWheelItems(container: Phaser.GameObjects.Container, wheelW: number): void {
    container.removeAll(true);
    this.wheelItemContainers = [];

    const total = this.wheelItems.length;
    const centerX = wheelW / 2;

    for (let offset = -1; offset <= 1; offset++) {
      const idx = (this.selectedWheelIndex + offset + total) % total;
      const item = this.wheelItems[idx];
      const isCenter = offset === 0;

      const curW = isCenter ? 104 : 88;
      const curH = 120;
      const centerPosX = isCenter ? centerX : (offset === -1 ? 96 : 294);
      const leftX = Math.floor(centerPosX - curW / 2);
      const topY = 10;

      const itemCard = this.add.container(leftX, topY);

      const bg = this.add.graphics();
      bg.fillStyle(isCenter ? 0x1e273a : 0x141822, 1);
      bg.fillRoundedRect(0, 0, curW, curH, 10);
      bg.lineStyle(isCenter ? 2 : 1, isCenter ? item.themeColor : 0x2c384d, 1);
      bg.strokeRoundedRect(0, 0, curW, curH, 10);

      if (isCenter) {
        bg.fillStyle(item.themeColor, 0.2);
        bg.fillRoundedRect(3, 3, curW - 6, 32, { tl: 8, tr: 8, bl: 0, br: 0 });
      }

      const icon = this.add.text(curW / 2, 30, item.icon, { fontSize: isCenter ? '26px' : '20px' }).setOrigin(0.5);
      const label = this.add.text(curW / 2, 64, item.label, {
        fontFamily: 'Noto Sans KR',
        fontSize: isCenter ? '13px' : '11px',
        color: isCenter ? '#ffffff' : '#8b9bb4',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const sub = this.add.text(curW / 2, 88, item.sub, {
        fontFamily: 'Noto Sans KR',
        fontSize: '9px',
        color: isCenter ? '#c8aa6e' : '#505c73',
        align: 'center'
      }).setOrigin(0.5);

      itemCard.add([bg, icon, label, sub]);
      itemCard.setSize(curW, curH);
      itemCard.setAlpha(isCenter ? 1.0 : 0.65);
      itemCard.setInteractive(new Phaser.Geom.Rectangle(0, 0, curW, curH), Phaser.Geom.Rectangle.Contains);
      itemCard.input!.cursor = 'pointer';

      const targetIdx = idx;
      itemCard.on('pointerdown', (_pointer: any, _lx: number, _ly: number, event: any) => {
        if (event && event.stopPropagation) event.stopPropagation();
        if (targetIdx === this.selectedWheelIndex) {
          this.handleWheelItemSelect(item);
        } else {
          this.selectedWheelIndex = targetIdx;
          this.updateWheelHighlight();
        }
      });

      this.wheelItemContainers.push(itemCard);
      container.add(itemCard);
    }
  }

  private rotateWheel(dir: number): void {
    const total = this.wheelItems.length;
    this.selectedWheelIndex = (this.selectedWheelIndex + dir + total) % total;
    this.updateWheelHighlight();
  }

  private updateWheelHighlight(): void {
    const currentItem = this.wheelItems[this.selectedWheelIndex];
    let promptKey = currentItem.promptKey;
    if (currentItem.key === 'barracks') {
      const curHero = this.gm.barracks[this.selectedHeroIndex] || this.gm.barracks[0];
      if (curHero && CHARACTER_CLASSES[curHero.classId]) {
        promptKey = CHARACTER_CLASSES[curHero.classId].promptKey;
      }
    }
    this.updateCardDisplay(promptKey);
    const wheelW = this.safeW - 40;
    const itemsGroup = this.wheelContainer.list[2] as Phaser.GameObjects.Container;
    if (itemsGroup) {
      this.renderWheelItems(itemsGroup, wheelW);
    }
  }

  private handleWheelItemSelect(item: WheelItem): void {
    if (item.isScene && item.sceneKey) {
      this.scene.start(item.sceneKey);
    } else {
      this.openExpandedDrawer(item.key);
    }
  }

  private createArrowButton(x: number, y: number, text: string, callback: Function): Phaser.GameObjects.Container {
    // x, y를 중심 좌표로 전달받아 컨테이너 좌상단 (x - 20, y - 20)에 정확히 배치 (폭 40, 높이 40)
    const btn = this.add.container(x - 20, y - 20);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a2130, 0.95);
    bg.fillCircle(20, 20, 18);
    bg.lineStyle(1.5, 0xc8aa6e, 0.9);
    bg.strokeCircle(20, 20, 18);

    const lbl = this.add.text(20, 20, text, {
      fontFamily: 'Noto Sans KR',
      fontSize: '14px',
      color: '#c8aa6e',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, lbl]);
    btn.setSize(40, 40);
    btn.setDepth(20); // Z-Depth를 20으로 설정하여 항상 최상단에 배치
    btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 40, 40), Phaser.Geom.Rectangle.Contains);
    btn.input!.cursor = 'pointer';
    btn.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: any) => {
      if (event && event.stopPropagation) event.stopPropagation();
      bg.setAlpha(1.5);
      callback();
    });
    btn.on('pointerout', () => bg.setAlpha(1.0));
    btn.on('pointerup', () => bg.setAlpha(1.0));
    return btn;
  }

  private createExpandedDrawer(w: number): void {
    const drawerY = 445;
    const drawerW = w - 40;
    const drawerH = 445;

    this.drawerContainer = this.add.container(20, drawerY).setVisible(false);

    const drawerBg = this.add.graphics();
    drawerBg.fillStyle(0x111520, 0.99);
    drawerBg.fillRoundedRect(0, 0, drawerW, drawerH, 16);
    drawerBg.lineStyle(2, 0xc8aa6e, 0.8);
    drawerBg.strokeRoundedRect(0, 0, drawerW, drawerH, 16);
    this.drawerContainer.add(drawerBg);

    const headerGfx = this.add.graphics();
    headerGfx.fillStyle(0x182030, 1);
    headerGfx.fillRoundedRect(4, 4, drawerW - 8, 40, { tl: 14, tr: 14, bl: 0, br: 0 });
    headerGfx.lineStyle(1, 0x2e3d59, 1);
    headerGfx.lineBetween(4, 44, drawerW - 4, 44);
    this.drawerContainer.add(headerGfx);

    this.drawerTitleText = this.add.text(16, 22, '', {
      fontFamily: 'Noto Sans KR',
      fontSize: '13px',
      color: '#c8aa6e',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.drawerContainer.add(this.drawerTitleText);

    const closeBtn = this.add.container(drawerW - 95, 10);
    const cBg = this.add.graphics();
    cBg.fillStyle(0xff416c, 0.9);
    cBg.fillRoundedRect(0, 0, 80, 24, 12);
    cBg.lineStyle(1.5, 0xffffff, 0.9);
    cBg.strokeRoundedRect(0, 0, 80, 24, 12);

    const cLbl = this.add.text(40, 12, '✕ 닫기', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.add([cBg, cLbl]);
    closeBtn.setSize(80, 24);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 80, 24), Phaser.Geom.Rectangle.Contains);
    closeBtn.input!.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.closeExpandedDrawer());

    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(20, drawerY + 46, drawerW, 395, 10);
    const mask = maskShape.createGeometryMask();

    this.drawerContentScrollArea = this.add.container(12, 48);
    this.drawerContentScrollArea.setMask(mask);
    this.drawerContainer.add(this.drawerContentScrollArea);
    
    const headerBlocker = this.add.zone(0, 0, drawerW, 46).setOrigin(0);
    headerBlocker.setInteractive();
    this.drawerContainer.add(headerBlocker);
    this.drawerContainer.add(closeBtn);
  }

  public openExpandedDrawer(tabKey: string): void {
    this.isDrawerOpen = true;
    this.currentDrawerTab = tabKey;
    this.scrollOffsetY = 0;
    this.closeEquipmentOverlay();

    this.logContainer.setVisible(false);
    this.wheelContainer.setVisible(false);
    this.singleLogContainer.setVisible(true);
    this.drawerContainer.setVisible(true);

    const tabTitles: Record<string, string> = {
      citadel: '🏰 방주 영지 건설 및 자원 관리',
      forge: '⚒️ 마도 대장간 장비 단조 & 강화 & 마도 인챈트',
      tavern: '🍺 황혼의 주점 방랑 용병 영입',
      barracks: '⚔️ 원정단 편성 & 진형 & 장비 & 전직',
      quests: '📜 퀘스트 및 시설 해금 임무'
    };
    this.drawerTitleText.setText(tabTitles[tabKey] || '상세 인터랙션');

    if (tabKey === 'barracks') {
      const curHero = this.gm.barracks[this.selectedHeroIndex] || this.gm.barracks[0];
      if (curHero && CHARACTER_CLASSES[curHero.classId]) {
        this.updateCardDisplay(CHARACTER_CLASSES[curHero.classId].promptKey);
      }
    }

    this.renderDrawerContent();
  }

  public closeExpandedDrawer(): void {
    this.isDrawerOpen = false;
    this.closeEquipmentOverlay();
    this.singleLogContainer.setVisible(false);
    this.drawerContainer.setVisible(false);
    this.drawerContentScrollArea.removeAll(true); // 닫을 때 자식 버튼들을 완전히 제거하여 클릭 침범 원천 방지
    this.logContainer.setVisible(true);
    this.wheelContainer.setVisible(true);
    this.updateLogs();
  }

  private renderDrawerContent(): void {
    if (!this.isDrawerOpen) return;
    this.drawerContentScrollArea.removeAll(true);
    const w = this.safeW - 64;

    if (this.currentDrawerTab === 'citadel') {
      this.renderCitadelDrawer(w);
    } else if (this.currentDrawerTab === 'forge') {
      this.renderForgeDrawer(w);
    } else if (this.currentDrawerTab === 'tavern') {
      this.renderTavernDrawer(w);
    } else if (this.currentDrawerTab === 'barracks') {
      this.renderBarracksDrawer(w);
    } else if (this.currentDrawerTab === 'quests') {
      this.renderQuestsDrawer(w);
    } else if (this.currentDrawerTab === 'storage') {
      this.renderStorageDrawer(w);
    } else if (this.currentDrawerTab === 'infirmary') {
      this.renderInfirmaryDrawer(w);
    } else if (this.currentDrawerTab === 'market') {
      this.renderMarketDrawer(w);
    } else if (this.currentDrawerTab === 'explore') {
      this.renderExploreDrawer(w);
    }

    // 최대 스크롤 높이에 맞게 offset 클램핑 후 Y 적용 (스크롤 리셋 방지)
    this.scrollOffsetY = Phaser.Math.Clamp(this.scrollOffsetY, -this.maxScrollY, 0);
    this.drawerContentScrollArea.setY(48 + this.scrollOffsetY);
  }

  private renderExploreDrawer(w: number): void {
    const titleText = this.add.text(0, 0, '진입할 심연의 구역을 선택하십시오.', {
      fontFamily: 'Noto Sans KR', fontSize: '13px', color: '#cfd8dc'
    });
    this.drawerContentScrollArea.add(titleText);
    
    let yPos = 30;
    const floorNames = [
      '고대 회랑 (위험도 하)',
      '부서진 납골당 (위험도 중하)',
      '에테르 광맥 (위험도 중)',
      '공허의 균열 (위험도 중상)',
      '원초의 제단 (위험도 상, 최종 보스)'
    ];

    for (let f = 1; f <= 5; f++) {
      const isUnlocked = f <= this.gm.unlockedDungeonFloor;
      const fColor = isUnlocked ? '#a742f5' : '#455a64';
      const fText = isUnlocked ? `🌀 심연 ${f}층: ${floorNames[f - 1]}` : `🔒 심연 ${f}층 (미해금)`;
      
      const btn = this.createActionButton(0, yPos, w, 46, fText, fColor, () => {
        if (!isUnlocked) {
          this.gm.addLog(`심연 ${f}층은 아직 해금되지 않았습니다. 이전 층을 돌파하세요.`, 'danger');
          this.updateLogs();
          return;
        }
        this.gm.dungeonFloor = f;
        this.gm.dungeonDangerLevel = 0; // 위험도 초기화
        this.gm.isOvercharged = false; // 오버차지 해제
        this.gm.addLog(`심연 ${f}층으로 진입합니다!`, 'story');
        this.updateLogs();
        this.scene.start('ExplorationScene');
      });
      this.drawerContentScrollArea.add(btn);
      yPos += 56;
    }
    this.maxScrollY = Math.max(0, yPos - 395);
  }

  private renderCitadelDrawer(w: number): void {
    let yPos = 0;

    // 모닥불 메뉴 추가
    const warmthText = this.gm.bonfireWarmthTime > 0 
      ? `[🔥 온기 ${Math.floor(this.gm.bonfireWarmthTime / 60)}분 ${(this.gm.bonfireWarmthTime % 60).toString().padStart(2, '0')}초 남음]`
      : (this.gm.bonfireStacks > 0 ? `[점화 중: ${this.gm.bonfireStacks}/5 스택]` : '[모닥불 꺼짐]');
      
    const bonfireHeader = this.add.text(w / 2, yPos + 10, `방주의 모닥불 ${warmthText}`, {
      fontFamily: 'Noto Sans KR', fontSize: '13px', color: '#ffb347', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.drawerContentScrollArea.add(bonfireHeader);

    const btnGather = this.createActionButton(0, yPos + 35, w / 2 - 5, 42, '🪵 잔가지 줍기', '#8b9bb4', () => {
      this.gm.gatherWood();
      this.updateCardDisplay('citadel_bonfire');
    });
    
    const btnFire = this.createActionButton(w / 2 + 5, yPos + 35, w / 2 - 5, 42, '🔥 불씨 넣기 (-1 목재)', '#ffb347', () => {
      this.gm.stokeFire();
      this.updateCardDisplay('citadel_bonfire');
    });

    this.drawerContentScrollArea.add([btnGather, btnFire]);
    yPos += 95;

    const buildingsList: { id: BuildingId; prompt: string; autoRate?: string; drawerKey?: string }[] = [
      { id: 'cabin', prompt: 'citadel_cabin', autoRate: '🪙 +5/4초' },
      { id: 'lumberCamp', prompt: 'citadel_cabin', autoRate: '🪵 +2/2초' },
      { id: 'butchery', prompt: 'citadel_cabin', autoRate: '🍖 +1/4초' },
      { id: 'quarry', prompt: 'citadel_cabin', autoRate: '🪨 +2/3초' },
      { id: 'alchemy', prompt: 'citadel_blacksmith', autoRate: '✨ +1/5초' },
      { id: 'storage', prompt: 'citadel_cabin', drawerKey: 'storage' },
      { id: 'tavern', prompt: 'citadel_tavern', drawerKey: 'tavern' },
      { id: 'blacksmith', prompt: 'citadel_blacksmith', drawerKey: 'forge' },
      { id: 'infirmary', prompt: 'citadel_cabin', drawerKey: 'infirmary' },
      { id: 'market', prompt: 'citadel_tavern', drawerKey: 'market' },
      { id: 'sanctuary', prompt: 'citadel_sanctuary' }
    ];

    buildingsList.forEach((item, idx) => {
      const b = this.gm.buildings[item.id];
      if (!b) return; // 저장 데이터 병합 문제로 b가 undefined인 경우 보호

      const bCard = this.add.container(0, yPos);
      const startY = yPos;
      yPos += 76;

      const bg = this.add.graphics();
      const isBuilt = b.level > 0;
      bg.fillStyle(isBuilt ? 0x1a2333 : 0x141822, 1);
      bg.fillRoundedRect(0, 0, w, 68, 8);
      bg.lineStyle(1.5, isBuilt ? b.themeColor : 0x2e384d, 1);
      bg.strokeRoundedRect(0, 0, w, 68, 8);

      const icon = this.add.text(14, 34, b.icon, { fontSize: '24px' }).setOrigin(0, 0.5);
      
      let autoText = isBuilt && item.autoRate ? ` [${item.autoRate} 생산]` : '';
      let fontSize = '12px';
      if (isBuilt && item.id === 'butchery' && b.level >= 3) {
        autoText = ` [🍖 +1/4초, 🦌 +${Math.floor(b.level/3)}/4초 생산]`;
        fontSize = '10.5px';
      } else if (isBuilt && item.id === 'quarry' && b.level >= 3) {
        autoText = ` [🪨 +2/3초, ⛏️ +${Math.floor(b.level/3)}/3초 생산]`;
        fontSize = '10.5px';
      }
      
      const name = this.add.text(48, 14, `${b.name} ${isBuilt ? `(Lv.${b.level})${autoText}` : '(미건설)'}`, {
        fontFamily: 'Noto Sans KR',
        fontSize: fontSize,
        color: isBuilt ? '#ffffff' : '#8b9bb4',
        fontStyle: 'bold'
      });

      // 기능 입장 버튼과 건설/강화 버튼의 배치
      const hasDrawer = isBuilt && item.drawerKey;
      const actBtnX = hasDrawer ? w - 65 : w - 75;
      const actBtnW = hasDrawer ? 55 : 65;
      
      const isMaxLevel = b.level >= 10;
      const actBtnLbl = isBuilt ? (isMaxLevel ? 'MAX' : '강화') : '건설';
      const actBtnColor = (b.unlocked || !isBuilt) && !isMaxLevel ? '#c8aa6e' : '#546e7a';

      const actBtn = this.createActionButton(actBtnX, 17, actBtnW, 34, actBtnLbl, actBtnColor, () => {
        if (isMaxLevel) return;
        this.gm.buildBuilding(item.id);
        this.updateCardDisplay(item.prompt);
        this.renderDrawerContent();
      });

      let enterBtn: Phaser.GameObjects.Container | undefined;
      if (hasDrawer) {
        enterBtn = this.createActionButton(w - 125, 17, 55, 34, '입장', '#38ef7d', () => {
          this.updateCardDisplay(item.prompt);
          this.currentDrawerTab = item.drawerKey!;
          this.renderDrawerContent();
        });
      }

      const descW = hasDrawer ? w - 180 : w - 130;
      
      const formatCost = (costObj: Partial<GameResources>) => {
        return Object.entries(costObj).map(([k, v]) => `${GameManager.getResourceMeta(k as keyof GameResources)?.name || k} ${v}`).join(', ');
      };
      const costObj = this.gm.getBuildingUpgradeCost(item.id, b.level);
      const costStr = formatCost(costObj);
      
      const descText = isMaxLevel ? b.description : (isBuilt ? `강화: ${costStr}` : `건설: ${costStr}`);
      
      const desc = this.add.text(48, 32, descText, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: '#8b9bb4',
        wordWrap: { width: descW }
      });

      const infoZone = this.add.zone(0, 0, w - (hasDrawer ? 130 : 80), 68).setOrigin(0);
      infoZone.setInteractive(new Phaser.Geom.Rectangle(0, 0, w - (hasDrawer ? 130 : 80), 68), Phaser.Geom.Rectangle.Contains);
      infoZone.input!.cursor = 'pointer';
      infoZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.hasPassedScrollThreshold && pointer.worldY >= this.safeY + 445 && pointer.worldY <= this.safeY + 895) {
          this.updateCardDisplay(item.prompt);
        }
      });

      bCard.add([bg, icon, name, desc, infoZone, actBtn]);
      if (enterBtn) bCard.add(enterBtn);
      
      this.drawerContentScrollArea.add(bCard);
    });

    this.maxScrollY = Math.max(0, yPos - 395);
  }

  // ================= 마도 대장간 장비 제작 & 강화 드로어 =================
  // ================= 마도 대장간 장비 제작 & 강화 / 마도 인챈트 드로어 =================
  private renderForgeDrawer(w: number): void {
    // ── 상단 서브 탭 네비게이션 바 (제작/강화 vs 마도 인챈트) ──
    const subTabW = Math.floor((w - 6) / 2);
    const tabs: Array<{ key: 'craft' | 'enchant'; label: string; icon: string; color: number }> = [
      { key: 'craft',   label: '⚒️ 장비 제작 & 강화', icon: '⚒️', color: 0xc8aa6e },
      { key: 'enchant', label: '✨ 마도 인챈트 (+3/+7)', icon: '✨', color: 0xffd54f }
    ];

    tabs.forEach((tab, idx) => {
      const isCur = this.forgeSubTab === tab.key;
      const tabBtn = this.add.container(idx * (subTabW + 6), 0);

      const tBg = this.add.graphics();
      tBg.fillStyle(isCur ? 0x1e2f47 : 0x131924, 1);
      tBg.fillRoundedRect(0, 0, subTabW, 36, 6);
      tBg.lineStyle(1.5, isCur ? tab.color : 0x2e3d55, 1);
      tBg.strokeRoundedRect(0, 0, subTabW, 36, 6);

      const tLbl = this.add.text(subTabW / 2, 18, tab.label, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: isCur ? '#ffffff' : '#8b9bb4',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      tabBtn.add([tBg, tLbl]);
      tabBtn.setSize(subTabW, 36);
      tabBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, subTabW, 36), Phaser.Geom.Rectangle.Contains);
      tabBtn.input!.cursor = 'pointer';
      tabBtn.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.hasPassedScrollThreshold && pointer.worldY >= this.safeY + 445 && pointer.worldY <= this.safeY + 895) {
          this.forgeSubTab = tab.key;
          this.scrollOffsetY = 0;
          this.renderDrawerContent();
        }
      });
      this.drawerContentScrollArea.add(tabBtn);
    });

    let currentY = 46;

    // ─────────────────────────────────────────────────────────────
    // 1. [제작 & 기본 강화] 탭
    // ─────────────────────────────────────────────────────────────
    if (this.forgeSubTab === 'craft') {
      const banner = this.add.container(0, currentY);
      const bg = this.add.graphics();
      bg.fillStyle(0x162335, 1);
      bg.fillRoundedRect(0, 0, w, 40, 6);
      bg.lineStyle(1, 0xc8aa6e, 0.7);
      bg.strokeRoundedRect(0, 0, w, 40, 6);

      const bText = this.add.text(12, 20, '⚒️ 에테르 마도 단조대 (순수 기본 장비 단조 & +10강 강화)', {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#c8aa6e', fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      banner.add([bg, bText]);
      this.drawerContentScrollArea.add(banner);
      currentY += 48;

      // 1-1) 보유 장비 강화 목록
      if (this.gm.equipmentInventory.length > 0) {
        const invHeader = this.add.text(0, currentY, '📦 보유 장비 강화 (+10강 상한 / +3 접두, +7 접미 해금):', {
          fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#ffd54f', fontStyle: 'bold'
        });
        this.drawerContentScrollArea.add(invHeader);
        currentY += 22;

        this.gm.equipmentInventory.forEach(item => {
          const itemCard = this.add.container(0, currentY);
          const iBg = this.add.graphics();
          iBg.fillStyle(0x151b27, 1);
          iBg.fillRoundedRect(0, 0, w, 66, 6);
          iBg.lineStyle(1, item.level >= 10 ? 0xffd54f : (item.level >= 7 ? 0xc8aa6e : 0x2e3d55), 1);
          iBg.strokeRoundedRect(0, 0, w, 66, 6);

          const iTitle = this.add.text(12, 10, `${item.icon} ${item.name} (+${item.level}/10)`, {
            fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
          });

          const statStr = Object.entries(item.stats).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' ');
          const unlockInfo = item.level >= 10
            ? '★최고강화'
            : (item.level < 3 ? `(+3강 시 접두어 해금)` : (item.level < 7 ? `(+7강 시 접미어 해금)` : `(풀인챈트 가능)`));

          const iDesc = this.add.text(12, 28, `${statStr} | [${item.equippedHeroId ? '장착중' : '보관중'}]  ${unlockInfo}`, {
            fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#8b9bb4'
          });

          const cost = GameManager.getEquipmentEnhanceCost(item);
          const costStr = Object.entries(cost).map(([k, v]) => `${k} ${v}`).join(', ');
          const costDesc = this.add.text(12, 46, item.level >= 10 ? '강화 완료' : `강화 소모: ${costStr}`, {
            fontFamily: 'Noto Sans KR', fontSize: '9px', color: item.level >= 10 ? '#ffd54f' : '#607d8b'
          });

          const enhBtn = this.createActionButton(w - 75, 12, 65, 42, item.level >= 10 ? '최대\n강화' : `+강화\n(+${item.level + 1})`, item.level >= 10 ? '#546e7a' : '#ffd54f', () => {
            if (item.level < 10) {
              this.gm.enhanceEquipment(item.id);
              this.renderDrawerContent();
            }
          });

          itemCard.add([iBg, iTitle, iDesc, costDesc, enhBtn]);
          this.drawerContentScrollArea.add(itemCard);
          currentY += 72;
        });
      }

      // 1-2) 신규 기본 장비 12종 단조 레시피 목록
      const recHeader = this.add.text(0, currentY, '✨ 순수 기본 장비 단조 레시피 (12종):', {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#38ef7d', fontStyle: 'bold'
      });
      this.drawerContentScrollArea.add(recHeader);
      currentY += 22;

      EQUIPMENT_RECIPES.forEach(recipe => {
        const rCard = this.add.container(0, currentY);
        const rBg = this.add.graphics();
        rBg.fillStyle(0x141a24, 1);
        rBg.fillRoundedRect(0, 0, w, 68, 6);
        rBg.lineStyle(1, 0x38ef7d, 0.6);
        rBg.strokeRoundedRect(0, 0, w, 68, 6);

        const rTitle = this.add.text(12, 10, `${recipe.icon} [${recipe.slot.toUpperCase()}] ${recipe.name}`, {
          fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
        });

        const costStr = Object.entries(recipe.cost).map(([k, v]) => {
          const meta = GameManager.getResourceMeta(k);
          return `${meta?.icon || ''} ${meta?.name || k} ${v}`;
        }).join('  ');
        const rDesc = this.add.text(12, 30, `${recipe.description}\n소모: ${costStr}`, {
          fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#cfd8dc', wordWrap: { width: w - 90 }
        });

        const craftBtn = this.createActionButton(w - 75, 14, 65, 40, '단조\n제작', '#38ef7d', () => {
          this.gm.craftEquipment(recipe.id);
          this.renderDrawerContent();
        });

        rCard.add([rBg, rTitle, rDesc, craftBtn]);
        this.drawerContentScrollArea.add(rCard);
        currentY += 74;
      });

      this.maxScrollY = Math.max(0, currentY - 380);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. [✨ 마도 인챈트] 탭
    // ─────────────────────────────────────────────────────────────
    else {
      // 2-1) 보유 마도석 카운터 배너
      const stoneBanner = this.add.container(0, currentY);
      const sBg = this.add.graphics();
      sBg.fillStyle(0x221a30, 1);
      sBg.fillRoundedRect(0, 0, w, 48, 6);
      sBg.lineStyle(1.5, 0xffd54f, 0.9);
      sBg.strokeRoundedRect(0, 0, w, 48, 6);

      const sLine1 = this.add.text(10, 8,
        `✨ 접두석: ${this.gm.resources.prefix_stone || 0}개    🔮 접미석: ${this.gm.resources.suffix_stone || 0}개`, {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#ffd54f', fontStyle: 'bold'
      });
      const sLine2 = this.add.text(10, 26,
        `⭐ 순수 접두석: ${this.gm.resources.pure_prefix_stone || 0}개    🌌 순수 접미석: ${this.gm.resources.pure_suffix_stone || 0}개`, {
        fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#ce93d8'
      });
      stoneBanner.add([sBg, sLine1, sLine2]);
      this.drawerContentScrollArea.add(stoneBanner);
      currentY += 56;

      const ruleText = this.add.text(0, currentY, '💡 인챈트 규칙: +3강 이상(접두어), +7강 이상(접미어) 해금', {
        fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#8b9bb4'
      });
      this.drawerContentScrollArea.add(ruleText);
      currentY += 20;

      if (this.gm.equipmentInventory.length === 0) {
        const emptyMsg = this.add.text(w / 2, currentY + 40, '보유 중인 장비가 없습니다.\n[장비 제작] 탭에서 먼저 장비를 단조하세요!', {
          fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#8b9bb4', align: 'center', lineSpacing: 4
        }).setOrigin(0.5);
        this.drawerContentScrollArea.add(emptyMsg);
        currentY += 90;
      } else {
        this.gm.equipmentInventory.forEach(item => {
          const cardH = 104;
          const eCard = this.add.container(0, currentY);

          const bg = this.add.graphics();
          bg.fillStyle(0x131926, 1);
          bg.fillRoundedRect(0, 0, w, cardH, 8);
          bg.lineStyle(1.5, item.prefix || item.suffix ? 0xffd54f : 0x2e3d55, 1);
          bg.strokeRoundedRect(0, 0, w, cardH, 8);

          // 타이틀
          const title = this.add.text(12, 10, `${item.icon} ${item.name} (+${item.level}강)`, {
            fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
          });

          const sub = this.add.text(w - 14, 11, `[${item.equippedHeroId ? '장착중' : '보관중'}] | ${item.slot.toUpperCase()}`, {
            fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#8b9bb4', align: 'right'
          }).setOrigin(1, 0);

          // 접두어 현황
          const canPrefix = item.level >= 3;
          let prefixText = '';
          let prefixColor = '#607d8b';
          if (item.prefix) {
            prefixText = `✨ 접두: [${item.prefix.name}] ${item.prefix.description}`;
            prefixColor = '#ffd54f';
          } else if (canPrefix) {
            prefixText = `✨ 접두: 미부여 (+3강 해금 완료 / 인챈트 가능)`;
            prefixColor = '#38ef7d';
          } else {
            prefixText = `🔒 접두: +3강 시 해금 (현재 +${item.level})`;
            prefixColor = '#607d8b';
          }
          const pLbl = this.add.text(12, 32, prefixText, {
            fontFamily: 'Noto Sans KR', fontSize: '10px', color: prefixColor, fontStyle: 'bold'
          });

          // 접미어 현황
          const canSuffix = item.level >= 7;
          let suffixText = '';
          let suffixColor = '#607d8b';
          if (item.suffix) {
            suffixText = `🔮 접미: [${item.suffix.name}] ${item.suffix.description}`;
            suffixColor = '#c8aa6e';
          } else if (canSuffix) {
            suffixText = `🔮 접미: 미부여 (+7강 해금 완료 / 인챈트 가능)`;
            suffixColor = '#38ef7d';
          } else {
            suffixText = `🔒 접미: +7강 시 해금 (현재 +${item.level})`;
            suffixColor = '#607d8b';
          }
          const sLbl = this.add.text(12, 50, suffixText, {
            fontFamily: 'Noto Sans KR', fontSize: '10px', color: suffixColor, fontStyle: 'bold'
          });

          // 인챈트 액션 버튼들
          // 1) 접두어 인챈트 버튼
          const preBtnW = 100;
          const preBtn = this.createActionButton(12, 68, preBtnW, 28, canPrefix ? '✨ 접두어 부여' : '🔒 +3강 필요', canPrefix ? '#ffd54f' : '#37474f', () => {
            if (canPrefix) {
              const usePure = (this.gm.resources.pure_prefix_stone || 0) > 0;
              this.gm.enchantEquipment(item.id, 'prefix', usePure);
              this.renderDrawerContent();
            }
          });

          // 2) 접미어 인챈트 버튼
          const sufBtnW = 100;
          const sufBtn = this.createActionButton(12 + preBtnW + 8, 68, sufBtnW, 28, canSuffix ? '🔮 접미어 부여' : '🔒 +7강 필요', canSuffix ? '#c8aa6e' : '#37474f', () => {
            if (canSuffix) {
              const usePure = (this.gm.resources.pure_suffix_stone || 0) > 0;
              this.gm.enchantEquipment(item.id, 'suffix', usePure);
              this.renderDrawerContent();
            }
          });

          // 3) 초기화 버튼
          const hasAny = !!item.prefix || !!item.suffix;
          const clnBtnW = 60;
          const clnBtn = this.createActionButton(w - clnBtnW - 12, 68, clnBtnW, 28, '✕ 초기화', hasAny ? '#ff6b6b' : '#263238', () => {
            if (hasAny) {
              this.gm.cleanseEnchant(item.id);
              this.renderDrawerContent();
            }
          });

          eCard.add([bg, title, sub, pLbl, sLbl, preBtn, sufBtn, clnBtn]);
          this.drawerContentScrollArea.add(eCard);
          currentY += cardH + 10;
        });
      }

      this.maxScrollY = Math.max(0, currentY - 380);
    }
  }

  // ================= 황혼의 주점 용병 고용 드로어 =================
  private renderTavernDrawer(w: number): void {
    const banner = this.add.container(0, 0);
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1c18, 1);
    bg.fillRoundedRect(0, 0, w, 44, 6);
    bg.lineStyle(1.5, 0xffb74d, 0.8);
    bg.strokeRoundedRect(0, 0, w, 44, 6);

    const bText = this.add.text(12, 22, '🍺 황혼의 주점 (새로운 방랑 용병을 원정대로 영입)', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#ffb74d',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const refreshBtn = this.createActionButton(w - 75, 6, 65, 32, '🔄 갱신', '#ffb74d', () => {
      this.gm.refreshTavernPool();
      this.renderDrawerContent();
    });

    banner.add([bg, bText, refreshBtn]);
    this.drawerContentScrollArea.add(banner);

    let currentY = 52;

    this.gm.tavernCandidates.forEach(cand => {
      const cClass = CHARACTER_CLASSES[cand.classId];
      const card = this.add.container(0, currentY);

      const cBg = this.add.graphics();
      cBg.fillStyle(0x1b1820, 1);
      cBg.fillRoundedRect(0, 0, w, 82, 8);
      cBg.lineStyle(1.5, cClass.themeColor, 0.8);
      cBg.strokeRoundedRect(0, 0, w, 82, 8);

      const name = this.add.text(14, 12, `[${cClass.name}] ${cand.name}`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      const stats = this.add.text(14, 34, `스탯: ATK ${cand.stats.atk} | DEF ${cand.stats.def} | SPD ${cand.stats.spd} | CRIT ${cand.stats.crit}%`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '10px',
        color: '#8b9bb4'
      });

      const skill = this.add.text(14, 54, `고유기: [${cClass.specialSkill.name}] - 고용비: 🪙 ${cand.hiringCost}G`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '10px',
        color: '#ffd54f'
      });

      const hireBtn = this.createActionButton(w - 75, 20, 65, 42, '🤝\n고용', '#ffb74d', () => {
        if (this.gm.hireMercenary(cand.id)) {
          this.renderDrawerContent();
        }
      });

      card.add([cBg, name, stats, skill, hireBtn]);
      this.drawerContentScrollArea.add(card);
      currentY += 90;
    });

    this.maxScrollY = Math.max(0, currentY - 380);
  }

  // ================= 3인 원정단 관리 & 2지선다 전직 & 장비 장착 =================
  private renderBarracksDrawer(w: number): void {
    const synergies = this.gm.getActiveSynergies();

    // ── 상단 시너지 배너 ──────────────────────────────
    const synBanner = this.add.container(0, 0);
    const synBg = this.add.graphics();
    synBg.fillStyle(0x182436, 1);
    synBg.fillRoundedRect(0, 0, w, 44, 6);
    synBg.lineStyle(1.5, 0xc8aa6e, 0.8);
    synBg.strokeRoundedRect(0, 0, w, 44, 6);
    const synText = synergies.length > 0
      ? `✨ 활성 시너지: [${synergies.map(s => s.name).join(', ')}]`
      : '✨ 시너지: 3인 파티의 역할을 구성하세요. (전열/중앙/후방)';
    const sLbl = this.add.text(12, 22, synText, {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#c8aa6e', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    synBanner.add([synBg, sLbl]);
    this.drawerContentScrollArea.add(synBanner);

    // ── 용병 탭 (보관소 전체) ─────────────────────────
    const memberCount = Math.max(this.gm.barracks.length, 1);
    const tabW = Math.floor(w / memberCount);
    this.gm.barracks.forEach((hero, idx) => {
      const isSelected = idx === this.selectedHeroIndex;
      const isInParty = this.gm.party.some(p => p.id === hero.id);
      const tab = this.add.container(idx * tabW, 52);

      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0x22354d : 0x141a24, 1);
      bg.fillRoundedRect(2, 0, tabW - 4, 36, 6);
      bg.lineStyle(1.5, isSelected ? 0xc8aa6e : (isInParty ? 0x38ef7d : 0x2e384d), 1);
      bg.strokeRoundedRect(2, 0, tabW - 4, 36, 6);

      const lbl = this.add.text(tabW / 2, 11, hero.name, {
        fontFamily: 'Noto Sans KR', fontSize: '10px',
        color: isSelected ? '#ffffff' : '#8b9bb4', fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      const inPartyLbl = this.add.text(tabW / 2, 24, isInParty ? '★ 파티' : '대기', {
        fontFamily: 'Noto Sans KR', fontSize: '9px',
        color: isInParty ? '#38ef7d' : '#505c73'
      }).setOrigin(0.5, 0);

      tab.add([bg, lbl, inPartyLbl]);
      tab.setSize(tabW, 36);
      tab.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabW, 36), Phaser.Geom.Rectangle.Contains);
      tab.input!.cursor = 'pointer';
      tab.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.hasPassedScrollThreshold) {
          if (pointer.worldY >= this.safeY + 445 && pointer.worldY <= this.safeY + 895) {
            this.selectedHeroIndex = idx;
            const h = this.gm.barracks[idx];
            if (h && CHARACTER_CLASSES[h.classId]) {
              this.updateCardDisplay(CHARACTER_CLASSES[h.classId].promptKey);
            }
            this.closeEquipmentOverlay();
            this.renderDrawerContent();
          }
        }
      });
      this.drawerContentScrollArea.add(tab);
    });

    const currentHero = this.gm.barracks[this.selectedHeroIndex];
    if (!currentHero) return;
    const currentClass = CHARACTER_CLASSES[currentHero.classId];
    if (!currentClass) return;

    // ── 영웅 카드 컨테이너 (배경을 반드시 가장 먼저 add) ──
    const heroCard = this.add.container(0, 96);

    // [1] 배경 — 가장 먼저 추가해야 다른 UI 위를 덮지 않음
    const cBg = this.add.graphics();
    cBg.fillStyle(0x131b2a, 1);
    cBg.fillRoundedRect(0, 0, w, 640, 10);
    cBg.lineStyle(2, currentClass.themeColor, 0.9);
    cBg.strokeRoundedRect(0, 0, w, 640, 10);
    heroCard.add(cBg);

    // [2] 타이틀
    const isInParty = this.gm.party.some(p => p.id === currentHero.id);
    const title = this.add.text(14, 14,
      `[Tier ${currentClass.tier}] ${currentHero.name} — ${currentClass.name} ${isInParty ? '(★파티원)' : '(보관소)'}`, {
      fontFamily: 'Noto Sans KR', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      wordWrap: { width: w - 28 }
    });
    heroCard.add(title);

    // [3] 포지션 버튼 섹션
    const posHeader = this.add.text(14, 42, '📍 진형 배치 (클릭하여 변경):', {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#c8aa6e', fontStyle: 'bold'
    });
    heroCard.add(posHeader);

    const posBtnDefs: { pos: PositionSlot; label: string; color: number }[] = [
      { pos: 'front', label: '⚔️ 전열\n방어+20%', color: 0xff6b6b },
      { pos: 'mid',   label: '🗡️ 중앙\n공격+12%', color: 0xffd54f },
      { pos: 'back',  label: '🔮 후방\n마법+15%', color: 0xc8aa6e }
    ];
    const posBtnW = Math.floor((w - 42) / 3);

    posBtnDefs.forEach((p, pIdx) => {
      const isCur = currentHero.position === p.pos;
      const pBtn = this.add.container(14 + pIdx * (posBtnW + 7), 60);

      const pbBg = this.add.graphics();
      pbBg.fillStyle(isCur ? p.color : 0x1a2133, 1);
      pbBg.fillRoundedRect(0, 0, posBtnW, 40, 8);
      pbBg.lineStyle(2, p.color, isCur ? 1 : 0.5);
      pbBg.strokeRoundedRect(0, 0, posBtnW, 40, 8);

      const pbLbl = this.add.text(posBtnW / 2, 20, p.label, {
        fontFamily: 'Noto Sans KR', fontSize: '10px',
        color: isCur ? '#000000' : '#cfd8dc',
        fontStyle: 'bold', align: 'center', lineSpacing: 1
      }).setOrigin(0.5);

      pBtn.add([pbBg, pbLbl]);
      pBtn.setSize(posBtnW, 40);
      pBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, posBtnW, 40), Phaser.Geom.Rectangle.Contains);
      pBtn.input!.cursor = 'pointer';
      pBtn.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.hasPassedScrollThreshold) {
          if (pointer.worldY >= this.safeY + 445 && pointer.worldY <= this.safeY + 895) {
            this.gm.setHeroPosition(currentHero.id, p.pos);
            this.renderDrawerContent();
          }
        }
      });
      heroCard.add(pBtn);
    });

    // [4] 스탯 그리드
    const statsGrid = this.add.text(14, 110,
      `❤️ HP ${currentHero.currentHp}/${currentHero.maxHp}   💙 MP ${currentHero.currentMp}/${currentHero.maxMp}\n` +
      `⚔️ ATK ${currentHero.stats.atk}   🛡️ DEF ${currentHero.stats.def}   ⚡ SPD ${currentHero.stats.spd}   🎯 CRIT ${currentHero.stats.crit}%`, {
      fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#cfd8dc', lineSpacing: 4
    });
    heroCard.add(statsGrid);

    // [5] 장비 슬롯 섹션
    const eqHeader = this.add.text(14, 150, '🛡️ 장비 슬롯 (탭하여 장착/해제):', {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#38ef7d', fontStyle: 'bold'
    });
    heroCard.add(eqHeader);

    const eqSlots: { slot: EquipmentSlot; label: string; icon: string }[] = [
      { slot: 'weapon',    label: '무기',   icon: '⚔️' },
      { slot: 'armor',     label: '방어구', icon: '🛡️' },
      { slot: 'accessory', label: '장신구', icon: '💍' }
    ];
    const eqBtnW = Math.floor((w - 42) / 3);

    eqSlots.forEach(({ slot, label, icon }, sIdx) => {
      const curEquip = currentHero.equipment[slot];
      const eqBtn = this.add.container(14 + sIdx * (eqBtnW + 7), 170);

      const eBg = this.add.graphics();
      eBg.fillStyle(curEquip ? 0x1a3024 : 0x181e2c, 1);
      eBg.fillRoundedRect(0, 0, eqBtnW, 44, 8);
      eBg.lineStyle(1.5, curEquip ? 0x38ef7d : 0x2e384d, curEquip ? 1 : 0.6);
      eBg.strokeRoundedRect(0, 0, eqBtnW, 44, 8);

      const eTopLbl = this.add.text(eqBtnW / 2, 10, curEquip ? curEquip.icon : icon, {
        fontSize: '14px'
      }).setOrigin(0.5, 0);

      const eBotLbl = this.add.text(eqBtnW / 2, 28, curEquip
        ? `${curEquip.name.substring(0, 7)} +${curEquip.level}`
        : `[${label} 없음]`, {
        fontFamily: 'Noto Sans KR', fontSize: '9px',
        color: curEquip ? '#ffffff' : '#505c73',
        fontStyle: 'bold', align: 'center'
      }).setOrigin(0.5, 0);

      eqBtn.add([eBg, eTopLbl, eBotLbl]);
      eqBtn.setSize(eqBtnW, 44);
      eqBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, eqBtnW, 44), Phaser.Geom.Rectangle.Contains);
      eqBtn.input!.cursor = 'pointer';
      eqBtn.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.hasPassedScrollThreshold) {
          if (pointer.worldY >= this.safeY + 445 && pointer.worldY <= this.safeY + 895) {
            this.showEquipmentSelectOverlay(currentHero, slot);
          }
        }
      });
      heroCard.add(eqBtn);
    });

    // [6] 파티 편성/교체 버튼
    const swapPartyBtn = this.createActionButton(
      14, 224, w - 28, 38,
      isInParty
        ? `🔄 [${currentHero.name}] 파티 → 보관소로 교체`
        : `⚔️ [${currentHero.name}] 보관소 → 파티로 편성`,
      isInParty ? '#ff6b6b' : '#c8aa6e',
      () => { this.gm.swapPartyMember(currentHero.position, currentHero.id); this.renderDrawerContent(); }
    );
    heroCard.add(swapPartyBtn);

    // [7] 특수 스킬 배너
    const specSkillBox = this.add.container(14, 272);
    const specBg = this.add.graphics();
    specBg.fillStyle(0x281a30, 1);
    specBg.fillRoundedRect(0, 0, w - 28, 58, 8);
    specBg.lineStyle(2, 0xffd54f, 0.9);
    specBg.strokeRoundedRect(0, 0, w - 28, 58, 8);
    const specTitle = this.add.text(10, 9,
      `${currentClass.specialSkill.icon} [고유기] ${currentClass.specialSkill.name}  (MP ${currentClass.specialSkill.manaCost})`, {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#ffd54f', fontStyle: 'bold'
    });
    const specDesc = this.add.text(10, 28, currentClass.specialSkill.description, {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#ede0c8',
      wordWrap: { width: w - 48 }
    });
    specSkillBox.add([specBg, specTitle, specDesc]);
    heroCard.add(specSkillBox);

    // [8] 기본 스킬 목록
    const skillHeader = this.add.text(14, 340, '📖 보유 스킬:', {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#90a4ae', fontStyle: 'bold'
    });
    heroCard.add(skillHeader);

    currentClass.skills.forEach((skill, sIdx) => {
      const sY = 358 + sIdx * 50;
      const sBox = this.add.graphics();
      sBox.fillStyle(0x1b2537, 1);
      sBox.fillRoundedRect(14, sY, w - 28, 44, 6);
      sBox.lineStyle(1, 0x2e3d55, 1);
      sBox.strokeRoundedRect(14, sY, w - 28, 44, 6);
      const sIcon = this.add.text(24, sY + 10, skill.icon, { fontSize: '16px' });
      const sName = this.add.text(48, sY + 8, `${skill.name}  (MP ${skill.manaCost})`, {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#e0e0e0', fontStyle: 'bold'
      });
      const sDesc = this.add.text(48, sY + 24, skill.description, {
        fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#8b9bb4',
        wordWrap: { width: w - 70 }
      });
      heroCard.add([sBox, sIcon, sName, sDesc]);
    });

    const skillsEndY = 358 + currentClass.skills.length * 50;

    // [9] 전직 분기 버튼
    let branches: { id: string; name: string; desc: string; special: string }[] = [];
    if (currentClass.tier === 0) {
      if (currentHero.classId === 'squire') {
        branches = [
          { id: 'paladin',  name: '⭐ 1차-A: 성기사',    desc: '신성 방벽 & 아군 치유',    special: '홀리 오라' },
          { id: 'guardian', name: '🛡️ 1차-B: 중장 보병', desc: '철벽 방어 & 기절 강타',    special: '절대 방진' }
        ];
      } else if (currentHero.classId === 'rogue') {
        branches = [{ id: 'assassin', name: '⭐ 1차-A: 암살자', desc: '치명 처형 & 맹독', special: '심장 꿰뚫기' }];
      } else if (currentHero.classId === 'vanguard') {
        branches = [{ id: 'berserker', name: '⭐ 1차-A: 광전사', desc: '혈풍참 & 대지분쇄', special: '광란의 대지분쇄' }];
      } else if (currentHero.classId === 'gunner') {
        branches = [{ id: 'tactical_gunner', name: '⭐ 1차-A: 전술 포수', desc: '레일건 관통 & 드론 폭격', special: '궤도 조명 폭격' }];
      } else if (currentHero.classId === 'apprentice') {
        branches = [
          { id: 'elementalist',   name: '⭐ 1차-A: 원소술사',  desc: '원소 결합 & 핵폭풍',    special: '원소 초신성' },
          { id: 'arcane_scholar', name: '📚 1차-B: 비전 학자', desc: '중력장 & 시공 왜곡',    special: '아케인 오버로드' }
        ];
      } else if (currentHero.classId === 'acolyte') {
        branches = [
          { id: 'bishop',     name: '⭐ 1차-A: 주교',      desc: '광역 정화 & 방어 버프',   special: '신성 집결' },
          { id: 'war_priest', name: '⚔️ 1차-B: 전투 사제', desc: '신성 강타 & 자가 치유형', special: '성전 선포' }
        ];
      }
    } else if (currentClass.tier === 1) {
      if (currentHero.classId === 'paladin' || currentHero.classId === 'guardian') {
        branches = [{ id: 'aegis_valkyrie',    name: '👑 2차: 발키리',      desc: '완전 무적 결계 & 부활',    special: '영원의 성역' }];
      } else if (currentHero.classId === 'assassin') {
        branches = [{ id: 'shadow_phantom',    name: '👑 2차: 그림자 망령',      desc: '6연속 난무 & 방어무시',    special: '무간암영참' }];
      } else if (currentHero.classId === 'berserker') {
        branches = [{ id: 'valhalla_blade',    name: '👑 2차: 발할라 블레이드', desc: '체력 비례 600% 극딜',      special: '불멸의 결전분노' }];
      } else if (currentHero.classId === 'tactical_gunner') {
        branches = [{ id: 'aether_gun_meister', name: '👑 2차: 하이퍼 레인저', desc: '위성 궤도포 480% 폭격',    special: '궤도 에테르 버스터' }];
      } else if (currentHero.classId === 'elementalist' || currentHero.classId === 'arcane_scholar') {
        branches = [{ id: 'calamity_mage',     name: '👑 2차: 재앙의 대마도사', desc: '종말의 메테오 & 흑염 강타', special: '종말의 메테오' }];
      } else if (currentHero.classId === 'bishop' || currentHero.classId === 'war_priest') {
        branches = [{ id: 'high_saintess',     name: '👑 2차: 성령의 구원자',   desc: '부활 성가 & 전체 완전 치유', special: '부활의 성가' }];
      }
    } else if (currentClass.tier === 2) {
      if (currentHero.classId === 'aegis_valkyrie' || currentHero.classId === 'fortress') {
        branches = [{ id: 'aegis_bastion', name: '🛡️ 3차: 이지스 바스티온', desc: '절대 수호 융합 & 아발론 결계, 만마도서 해금', special: '아발론' }];
      } else if (currentHero.classId === 'shadow_phantom' || currentHero.classId === 'blade_dancer') {
        branches = [{ id: 'void_strider', name: '🌌 3차: 보이드 스트라이더', desc: '차원 회피 증폭 & 차원참 방어무시 난무, 만마도서 해금', special: '차원참' }];
      } else if (currentHero.classId === 'calamity_mage' || currentHero.classId === 'chronomancer') {
        branches = [{ id: 'chrono_archon', name: '⏳ 3차: 크로노 아콘', desc: '더블 캐스트 & 빅뱅 크로노스 시공 폭격, 만마도서 해금', special: '빅뱅 크로노스' }];
      } else if (currentHero.classId === 'high_saintess' || currentHero.classId === 'crusader_lord') {
        branches = [{ id: 'seraphic_inquisitor', name: '☀️ 3차: 세라픽 인퀴지터', desc: '신성 심판 & 창공의 대심판 전체 부활/치유, 만마도서 해금', special: '창공의 대심판' }];
      } else if (currentHero.classId === 'valhalla_blade' || currentHero.classId === 'iron_marshal') {
        branches = [{ id: 'valhalla_warlord', name: '🩸 3차: 발할라 워로드', desc: '상시 흡혈 & 사경 분전, 피의 전술 군단 파쇄, 만마도서 해금', special: '피의 전술' }];
      } else if (currentHero.classId === 'aether_gun_meister' || currentHero.classId === 'ghost_sniper') {
        branches = [{ id: 'omega_deadeye', name: '🛰️ 3차: 오메가 데드아이', desc: '방관 폭발 & 궤도 섬멸 광역 폭격, 만마도서 해금', special: '궤도 섬멸' }];
      }
    }

    if (branches.length > 0) {
      const bHeaderY = skillsEndY + 14;

      // ── 레벨 요구조건 계산 ────────────────────────────────
      const reqLevel = currentClass.tier === 0 ? 10 : (currentClass.tier === 1 ? 30 : 60);
      const meetsLevel = currentHero.level >= reqLevel;
      const sanctuaryLevel = this.gm.buildings['sanctuary']?.level || 0;
      const reqSanctuaryLevel = currentClass.tier === 0 ? 1 : (currentClass.tier === 1 ? 5 : 8);
      const sanctuaryBuilt = sanctuaryLevel >= reqSanctuaryLevel;
      const canPromote = meetsLevel && sanctuaryBuilt;

      const headerColor = canPromote ? '#ffd54f' : '#546e7a';
      const levelGateText = !meetsLevel
        ? `  ⛔ Lv.${currentHero.level}/${reqLevel} 레벨 부족`
        : (!sanctuaryBuilt ? `  ⛔ 성소 Lv.${reqSanctuaryLevel} 필요` : '  ✅ 전직 가능');

      const bHeader = this.add.text(14, bHeaderY,
        `🔮 전직 분기 선택 (에테르/골드 소모)${levelGateText}`, {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: headerColor, fontStyle: 'bold'
      });
      heroCard.add(bHeader);

      // 레벨 미달이면 EXP 진행도 표시
      if (!meetsLevel) {
        const expBar = this.add.graphics();
        const expRatio = currentHero.exp / currentHero.expToNext;
        expBar.fillStyle(0x1a2133, 1);
        expBar.fillRoundedRect(14, bHeaderY + 18, w - 28, 8, 3);
        expBar.fillStyle(0xffd54f, 1);
        expBar.fillRoundedRect(14, bHeaderY + 18, Math.floor((w - 28) * expRatio), 8, 3);
        const expLbl = this.add.text(14, bHeaderY + 28,
          `EXP ${currentHero.exp} / ${currentHero.expToNext}  (전직까지 Lv.${reqLevel - currentHero.level} 더 필요)`, {
          fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#78909c'
        });
        heroCard.add([expBar, expLbl]);
      }

      const btnOffsetY = meetsLevel ? bHeaderY + 20 : bHeaderY + 44;

      branches.forEach((bItem, bIdx) => {
        const eqCost = currentClass.tier === 0 ? 20 : (currentClass.tier === 1 ? 100 : 300);
        const goldCost = currentClass.tier === 0 ? 500 : (currentClass.tier === 1 ? 3000 : 10000);
        const costText = `에테르 ${eqCost} + 골드 ${goldCost}`;

        const btnLabel = canPromote
          ? `${bItem.name}  [${costText}]\n${bItem.desc}`
          : `🔒 ${bItem.name}  (Lv.${reqLevel} 필요)\n${bItem.desc}`;

        const bBtn = this.createActionButton(
          14, btnOffsetY + bIdx * 54,
          w - 28, 46,
          btnLabel,
          canPromote ? '#ffd54f' : '#37474f',
          () => {
            if (!canPromote) {
              this.gm.addLog(
                !meetsLevel
                  ? `전직하려면 Lv.${reqLevel}이 필요합니다. (현재 Lv.${currentHero.level})`
                  : `전직하려면 영지에 성소를 Lv.${reqSanctuaryLevel} 이상으로 증축해야 합니다!`,
                'danger'
              );
              return;
            }
            if (this.gm.promoteMercenary(currentHero.id, bItem.id)) {
              this.updateCardDisplay(CHARACTER_CLASSES[bItem.id].promptKey);
              this.renderDrawerContent();
            }
          }
        );
        heroCard.add(bBtn);
      });
    }

    this.drawerContentScrollArea.add(heroCard);
    const totalContentH = 96 + skillsEndY + (branches.length > 0 ? 80 + branches.length * 54 : 20);
    this.maxScrollY = Math.max(0, totalContentH - 360);
  }

  private renderQuestsDrawer(w: number): void {
    this.gm.quests.forEach((q, idx) => {
      const yPos = idx * 105;
      const qCard = this.add.container(0, yPos);

      const bg = this.add.graphics();
      let borderColor = 0x2e384d;
      if (q.status === 'active') borderColor = 0xc8aa6e;
      if (q.status === 'completed') borderColor = 0x38ef7d;

      bg.fillStyle(0x181f2c, 1);
      bg.fillRoundedRect(0, 0, w, 95, 8);
      bg.lineStyle(1.5, borderColor, 0.9);
      bg.strokeRoundedRect(0, 0, w, 95, 8);

      const title = this.add.text(14, 14, `[${q.type.toUpperCase()}] ${q.title}`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '13px',
        color: q.status === 'completed' ? '#38ef7d' : (q.status === 'active' ? '#ffffff' : '#505c73'),
        fontStyle: 'bold'
      });

      const summary = this.add.text(14, 36, q.summary, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: '#8b9bb4',
        wordWrap: { width: w - 28 }
      });

      const obj = q.objectives[0];
      const progressText = obj ? `${obj.description} (${obj.current}/${obj.required})` : '';
      const progress = this.add.text(14, 68, progressText, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: obj && obj.isCompleted ? '#38ef7d' : '#ffb74d'
      });

      const statusBadge = this.add.text(w - 14, 14, q.status === 'completed' ? '완료' : (q.status === 'active' ? '진행중' : '잠김'), {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: q.status === 'completed' ? '#38ef7d' : (q.status === 'active' ? '#c8aa6e' : '#505c73'),
        align: 'right'
      }).setOrigin(1, 0);

      qCard.add([bg, title, summary, progress, statusBadge]);
      this.drawerContentScrollArea.add(qCard);
    });

    this.maxScrollY = Math.max(0, this.gm.quests.length * 105 - 380);
  }

  // ═════════════════════════════════════════════════════════════════
  // 🛡️ 상단 메인 카드 내 장비 선택 스크롤 오버레이 시스템
  // ═════════════════════════════════════════════════════════════════
  public closeEquipmentOverlay(): void {
    if (this.equipOverlayContainer) {
      this.equipOverlayContainer.destroy();
      this.equipOverlayContainer = undefined;
      this.equipScrollArea = undefined;
    }
  }

  public showEquipmentSelectOverlay(hero: Mercenary, slot: EquipmentSlot): void {
    this.closeEquipmentOverlay();

    const cardW = this.safeW - 40;
    const cardH = 340;
    const slotNames: Record<EquipmentSlot, string> = {
      weapon: '무기',
      armor: '방어구',
      accessory: '장신구'
    };
    const slotName = slotNames[slot];

    this.equipOverlayContainer = this.add.container(0, 0);
    this.equipOverlayContainer.setDepth(30);

    // 반투명 다크 글래스 배경 (캐릭터 일러스트 배경이 은은히 비침)
    const bg = this.add.graphics();
    bg.fillStyle(0x0c1220, 0.92);
    bg.fillRoundedRect(0, 0, cardW, cardH, 16);
    bg.lineStyle(2, 0xc8aa6e, 0.9);
    bg.strokeRoundedRect(0, 0, cardW, cardH, 16);
    this.equipOverlayContainer.add(bg);

    // 헤더 바
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x162238, 1);
    headerBg.fillRoundedRect(4, 4, cardW - 8, 38, { tl: 14, tr: 14, bl: 0, br: 0 });
    headerBg.lineStyle(1, 0x2e4268, 1);
    headerBg.lineBetween(4, 42, cardW - 4, 42);
    this.equipOverlayContainer.add(headerBg);

    const title = this.add.text(14, 22, `🛡️ [${slotName} 장착] — ${hero.name}`, {
      fontFamily: 'Noto Sans KR',
      fontSize: '13px',
      color: '#c8aa6e',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.equipOverlayContainer.add(title);

    // ✕ 닫기 버튼
    const closeBtn = this.add.container(cardW - 65, 10);
    const cBg = this.add.graphics();
    cBg.fillStyle(0xff416c, 0.9);
    cBg.fillRoundedRect(0, 0, 55, 24, 6);
    cBg.lineStyle(1, 0xffffff, 0.9);
    cBg.strokeRoundedRect(0, 0, 55, 24, 6);
    const cLbl = this.add.text(27, 12, '✕ 닫기', {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    closeBtn.add([cBg, cLbl]);
    closeBtn.setSize(55, 24);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 55, 24), Phaser.Geom.Rectangle.Contains);
    closeBtn.input!.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.closeEquipmentOverlay());

    // 스크롤 마스크 영역
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(24, 55 + 44, cardW - 8, cardH - 50, 10);
    const mask = maskShape.createGeometryMask();

    this.equipScrollArea = this.add.container(10, 48);
    this.equipScrollArea.setMask(mask);
    this.equipOverlayContainer.add(this.equipScrollArea);
    
    const headerBlocker = this.add.zone(0, 0, cardW, 44).setOrigin(0);
    headerBlocker.setInteractive();
    this.equipOverlayContainer.add(headerBlocker);
    this.equipOverlayContainer.add(closeBtn);

    this.cardContainer.add(this.equipOverlayContainer);
    this.equipScrollOffsetY = 0;

    this.renderEquipOverlayContent(hero, slot, cardW);
  }

  private renderEquipOverlayContent(hero: Mercenary, slot: EquipmentSlot, cardW: number): void {
    if (!this.equipScrollArea) return;
    this.equipScrollArea.removeAll(true);
    const itemW = cardW - 20;
    let currentY = 4;

    const curEquip = hero.equipment[slot];
    const slotNames: Record<EquipmentSlot, string> = {
      weapon: '무기',
      armor: '방어구',
      accessory: '장신구'
    };
    const slotName = slotNames[slot];

    // 1. 현재 장착 중인 아이템 섹션
    if (curEquip) {
      const curCard = this.add.container(0, currentY);
      const curBg = this.add.graphics();
      curBg.fillStyle(0x182c22, 1);
      curBg.fillRoundedRect(0, 0, itemW, 52, 8);
      curBg.lineStyle(1.5, 0x38ef7d, 1);
      curBg.strokeRoundedRect(0, 0, itemW, 52, 8);

      const icon = this.add.text(20, 26, curEquip.icon, { fontSize: '20px' }).setOrigin(0.5);
      const name = this.add.text(42, 12, `${curEquip.name} +${curEquip.level}  [★현재 장착중]`, {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#38ef7d', fontStyle: 'bold'
      });
      const statsStr = [
        curEquip.stats.atk ? `ATK+${curEquip.stats.atk}` : '',
        curEquip.stats.def ? `DEF+${curEquip.stats.def}` : '',
        curEquip.stats.hp ? `HP+${curEquip.stats.hp}` : '',
        curEquip.stats.mp ? `MP+${curEquip.stats.mp}` : '',
        curEquip.stats.crit ? `CRIT+${curEquip.stats.crit}%` : ''
      ].filter(Boolean).join('  ');

      const encTag = [
        curEquip.prefix ? `✨${curEquip.prefix.name}` : '',
        curEquip.suffix ? `🔮${curEquip.suffix.name}` : ''
      ].filter(Boolean).join(' / ');

      const stats = this.add.text(42, 30, `${statsStr || '기본 능력치'}${encTag ? ` | [${encTag}]` : ''}`, {
        fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#cfd8dc'
      });

      const unequipBtn = this.add.container(itemW - 68, 12);
      const uBg = this.add.graphics();
      uBg.fillStyle(0x3a1820, 1);
      uBg.fillRoundedRect(0, 0, 60, 28, 6);
      uBg.lineStyle(1.5, 0xff416c, 0.9);
      uBg.strokeRoundedRect(0, 0, 60, 28, 6);
      const uLbl = this.add.text(30, 14, '장착 해제', {
        fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#ff6b6b', fontStyle: 'bold'
      }).setOrigin(0.5);
      unequipBtn.add([uBg, uLbl]);
      unequipBtn.setSize(60, 28);
      unequipBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 28), Phaser.Geom.Rectangle.Contains);
      unequipBtn.input!.cursor = 'pointer';
      unequipBtn.on('pointerdown', () => {
        if (!this.hasPassedEquipDragThreshold) {
          this.gm.unequipItem(hero.id, slot);
          this.renderEquipOverlayContent(hero, slot, cardW);
          this.renderDrawerContent();
        }
      });

      curCard.add([curBg, icon, name, stats, unequipBtn]);
      this.equipScrollArea.add(curCard);
      currentY += 60;
    }

    // 2. 인벤토리 내 착용 가능한 동일 슬롯 아이템 목록
    const availableItems = this.gm.equipmentInventory.filter(
      e => e.slot === slot && e.id !== curEquip?.id
    );

    const sectionHeader = this.add.text(4, currentY, `📦 보유 중인 [${slotName}] 목록 (${availableItems.length}개):`, {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#8b9bb4', fontStyle: 'bold'
    });
    this.equipScrollArea.add(sectionHeader);
    currentY += 20;

    if (availableItems.length === 0 && !curEquip) {
      const emptyMsg = this.add.text(itemW / 2, currentY + 30, `보유 중인 [${slotName}] 장비가 없습니다.\n마도 대장간에서 장비를 단조할 수 있습니다!`, {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#8b9bb4', align: 'center', lineSpacing: 4
      }).setOrigin(0.5);
      this.equipScrollArea.add(emptyMsg);
      currentY += 75;

      const goForgeBtn = this.add.container(itemW / 2 - 80, currentY);
      const fBg = this.add.graphics();
      fBg.fillStyle(0x182438, 1);
      fBg.fillRoundedRect(0, 0, 160, 32, 6);
      fBg.lineStyle(1.5, 0xc8aa6e, 0.9);
      fBg.strokeRoundedRect(0, 0, 160, 32, 6);
      const fLbl = this.add.text(80, 16, '⚒️ 마도 대장간으로 이동', {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#c8aa6e', fontStyle: 'bold'
      }).setOrigin(0.5);
      goForgeBtn.add([fBg, fLbl]);
      goForgeBtn.setSize(160, 32);
      goForgeBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 160, 32), Phaser.Geom.Rectangle.Contains);
      goForgeBtn.input!.cursor = 'pointer';
      goForgeBtn.on('pointerdown', () => {
        if (!this.hasPassedEquipDragThreshold) {
          this.closeEquipmentOverlay();
          this.openExpandedDrawer('forge');
        }
      });
      this.equipScrollArea.add(goForgeBtn);
      currentY += 45;
    } else {
      availableItems.forEach(item => {
        const itemCard = this.add.container(0, currentY);
        const equippedByOther = item.equippedHeroId
          ? this.gm.barracks.find(h => h.id === item.equippedHeroId)
          : null;

        const iBg = this.add.graphics();
        iBg.fillStyle(0x141a26, 1);
        iBg.fillRoundedRect(0, 0, itemW, 52, 8);
        iBg.lineStyle(1.5, equippedByOther ? 0xffb74d : (item.prefix || item.suffix ? 0xc8aa6e : 0x2c3b52), 1);
        iBg.strokeRoundedRect(0, 0, itemW, 52, 8);

        const icon = this.add.text(20, 26, item.icon, { fontSize: '20px' }).setOrigin(0.5);
        const name = this.add.text(42, 12, `${item.name} +${item.level} ${equippedByOther ? `(${equippedByOther.name} 장착중)` : '[보관함]'}`, {
          fontFamily: 'Noto Sans KR', fontSize: '11px',
          color: equippedByOther ? '#ffb74d' : '#ffffff', fontStyle: 'bold'
        });

        const statsStr = [
          item.stats.atk ? `ATK+${item.stats.atk}` : '',
          item.stats.def ? `DEF+${item.stats.def}` : '',
          item.stats.hp ? `HP+${item.stats.hp}` : '',
          item.stats.mp ? `MP+${item.stats.mp}` : '',
          item.stats.crit ? `CRIT+${item.stats.crit}%` : ''
        ].filter(Boolean).join('  ');

        const encTag = [
          item.prefix ? `✨${item.prefix.name}` : '',
          item.suffix ? `🔮${item.suffix.name}` : ''
        ].filter(Boolean).join(' / ');

        const stats = this.add.text(42, 30, `${statsStr || '기본 능력치'}${encTag ? ` | [${encTag}]` : ''}`, {
          fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#8b9bb4'
        });

        const equipBtn = this.add.container(itemW - 68, 12);
        const eBg = this.add.graphics();
        eBg.fillStyle(0x183040, 1);
        eBg.fillRoundedRect(0, 0, 60, 28, 6);
        eBg.lineStyle(1.5, 0xc8aa6e, 0.9);
        eBg.strokeRoundedRect(0, 0, 60, 28, 6);
        const eLbl = this.add.text(30, 14, '장착하기', {
          fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#c8aa6e', fontStyle: 'bold'
        }).setOrigin(0.5);
        equipBtn.add([eBg, eLbl]);
        equipBtn.setSize(60, 28);
        equipBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 28), Phaser.Geom.Rectangle.Contains);
        equipBtn.input!.cursor = 'pointer';
        equipBtn.on('pointerdown', () => {
          if (!this.hasPassedEquipDragThreshold) {
            this.gm.equipItem(hero.id, item.id);
            this.renderEquipOverlayContent(hero, slot, cardW);
            this.renderDrawerContent();
          }
        });

        itemCard.add([iBg, icon, name, stats, equipBtn]);
        this.equipScrollArea.add(itemCard);
        currentY += 60;
      });
    }

    this.equipMaxScrollY = Math.max(0, currentY - (340 - 58));
    this.equipScrollOffsetY = Phaser.Math.Clamp(this.equipScrollOffsetY, -this.equipMaxScrollY, 0);
    this.equipScrollArea.setY(48 + this.equipScrollOffsetY);
  }

  private setupScrollInput(): void {
    const onWheel = (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (this.equipOverlayContainer && this.equipMaxScrollY > 0) {
        this.equipScrollOffsetY = Phaser.Math.Clamp(this.equipScrollOffsetY - deltaY * 0.5, -this.equipMaxScrollY, 0);
        if (this.equipScrollArea) this.equipScrollArea.setY(48 + this.equipScrollOffsetY);
        return;
      }
      if (!this.isDrawerOpen || this.maxScrollY <= 0) return;
      this.scrollOffsetY = Phaser.Math.Clamp(this.scrollOffsetY - deltaY * 0.5, -this.maxScrollY, 0);
      this.drawerContentScrollArea.setY(48 + this.scrollOffsetY);
    };

    const onPointerDown = (pointer: Phaser.Input.Pointer) => {
      // 상단 장비 오버레이 스크롤 감지
      if (this.equipOverlayContainer && pointer.worldY >= this.safeY + 55 && pointer.worldY <= this.safeY + 395) {
        this.isEquipDragging = true;
        this.hasPassedEquipDragThreshold = false;
        this.equipDragStartY = pointer.worldY;
        this.equipDragStartOffsetY = this.equipScrollOffsetY;
      }

      // 하단 확장 드로어 스크롤 감지
      if (this.isDrawerOpen && pointer.worldY >= this.safeY + 445 && pointer.worldY <= this.safeY + 895) {
        this.isScrollTouching = true;
        this.hasPassedScrollThreshold = false;
        this.scrollTouchStartY = pointer.worldY;
        this.scrollTouchStartX = pointer.worldX;
        this.scrollStartOffsetY = this.scrollOffsetY;
      }
    };

    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      // 상단 장비 오버레이 스크롤 이동
      if (this.isEquipDragging && this.equipOverlayContainer && this.equipScrollArea && this.equipMaxScrollY > 0) {
        const deltaY = pointer.worldY - this.equipDragStartY;
        if (!this.hasPassedEquipDragThreshold) {
          if (Math.abs(deltaY) > 8) {
            this.hasPassedEquipDragThreshold = true;
          }
        }
        if (this.hasPassedEquipDragThreshold) {
          this.equipScrollOffsetY = Phaser.Math.Clamp(this.equipDragStartOffsetY + deltaY, -this.equipMaxScrollY, 0);
          this.equipScrollArea.setY(48 + this.equipScrollOffsetY);
        }
      }

      // 하단 확장 드로어 스크롤 이동
      if (this.isScrollTouching && this.isDrawerOpen && this.maxScrollY > 0) {
        const deltaY = pointer.worldY - this.scrollTouchStartY;
        const deltaX = pointer.worldX - this.scrollTouchStartX;
        if (!this.hasPassedScrollThreshold) {
          if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) {
            this.hasPassedScrollThreshold = true;
          }
        }
        if (this.hasPassedScrollThreshold) {
          this.scrollOffsetY = Phaser.Math.Clamp(this.scrollStartOffsetY + deltaY, -this.maxScrollY, 0);
          this.drawerContentScrollArea.setY(48 + this.scrollOffsetY);
        }
      }
    };

    const onPointerUp = () => {
      this.isEquipDragging = false;
      this.isScrollTouching = false;
    };

    this.input.on('wheel', onWheel);
    this.input.on('pointerdown', onPointerDown);
    this.input.on('pointermove', onPointerMove);
    this.input.on('pointerup', onPointerUp);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('wheel', onWheel);
      this.input.off('pointerdown', onPointerDown);
      this.input.off('pointermove', onPointerMove);
      this.input.off('pointerup', onPointerUp);
    });
  }

  private createActionButton(x: number, y: number, w: number, h: number, text: string, colorHex: string, callback: Function): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    const c = Phaser.Display.Color.HexStringToColor(colorHex).color;
    bg.fillStyle(0x1e2738, 1);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1.5, c, 0.9);
    bg.strokeRoundedRect(0, 0, w, h, 8);

    const lbl = this.add.text(w / 2, h / 2, text, {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, lbl]);
    btn.setSize(w, h);
    btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    btn.input!.cursor = 'pointer';

    btn.on('pointerdown', () => {
      bg.setAlpha(1.3);
    });
    btn.on('pointerout', () => bg.setAlpha(1.0));
    btn.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      bg.setAlpha(1.0);
      if (!this.hasPassedScrollThreshold) {
        if (this.isDrawerOpen && (pointer.worldY < this.safeY + 445 || pointer.worldY > this.safeY + 895)) {
          return;
        }
        callback();
      }
    });
    return btn;
  }

  // ================= 영지 창고 (Storage) =================
  private renderStorageDrawer(w: number): void {
    const title = this.add.text(10, 0, '보관된 재료 및 장비', {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#c8aa6e', fontStyle: 'bold'
    });
    this.drawerContentScrollArea.add(title);

    let yPos = 30;
    
    // 재료 목록 (목재, 석재 등)
    const resTypes: { key: keyof GameResources, icon: string, name: string }[] = [
      { key: 'wood', icon: '🪵', name: '목재' }, { key: 'stone', icon: '🪨', name: '석재' },
      { key: 'iron', icon: '⛏️', name: '철광석' }, { key: 'food', icon: '🍖', name: '식량' },
      { key: 'ether', icon: '✨', name: '에테르' }, { key: 'herb', icon: '🌿', name: '약초' },
      { key: 'bone', icon: '🦴', name: '짐승 뼈' }, { key: 'void_shard', icon: '🔮', name: '공허 파편' },
      { key: 'dark_essence', icon: '🌑', name: '암흑 정수' }, { key: 'crystal', icon: '💎', name: '마력 수정' },
      { key: 'leather', icon: '🦌', name: '가죽' }, { key: 'coal', icon: '⬛', name: '석탄' },
      { key: 'silk', icon: '🧶', name: '비단' },
      { key: 'prefix_stone', icon: '🔷', name: '접두석' }, { key: 'suffix_stone', icon: '🔶', name: '접미석' }
    ];

    let rowCount = 0;
    const colCount = 4;
    const itemW = (w - 15) / colCount;

    resTypes.forEach((res, idx) => {
      if (this.gm.resources[res.key] <= 0) return;
      const r = Math.floor(rowCount / colCount);
      const c = rowCount % colCount;
      const x = c * itemW;
      const y = yPos + r * 70;
      
      const bg = this.add.graphics();
      bg.fillStyle(0x1a2130, 1);
      bg.fillRoundedRect(x, y, itemW - 5, 65, 6);
      
      const icon = this.add.text(x + (itemW - 5) / 2, y + 16, res.icon, { fontSize: '18px' }).setOrigin(0.5);
      const qtyTxt = this.add.text(x + (itemW - 5) / 2, y + 36, `${this.gm.resources[res.key]}`, { fontSize: '12px', color: '#fff', fontFamily: 'JetBrains Mono' }).setOrigin(0.5);
      const nameTxt = this.add.text(x + (itemW - 5) / 2, y + 52, res.name, { fontSize: '10px', color: '#8b9bb4', fontFamily: 'Noto Sans KR' }).setOrigin(0.5);
      
      this.drawerContentScrollArea.add([bg, icon, qtyTxt, nameTxt]);
      rowCount++;
    });

    yPos += Math.ceil(rowCount / colCount) * 70 + 20;

    const eqTitle = this.add.text(10, yPos, '보관된 장비 (미착용)', {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#c8aa6e', fontStyle: 'bold'
    });
    this.drawerContentScrollArea.add(eqTitle);
    yPos += 30;

    const unequipped = this.gm.equipmentInventory.filter(eq => !eq.equippedHeroId);
    if (unequipped.length === 0) {
      this.drawerContentScrollArea.add(this.add.text(10, yPos, '보관 중인 장비가 없습니다.', { fontSize: '12px', color: '#8b9bb4' }));
    } else {
      unequipped.forEach((eq, idx) => {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a2130, 1);
        bg.fillRoundedRect(0, yPos, w, 40, 6);
        
        const txt = this.add.text(10, yPos + 12, `${eq.icon} ${eq.name}`, { fontSize: '12px', color: '#fff', fontFamily: 'Noto Sans KR' });
        this.drawerContentScrollArea.add([bg, txt]);
        yPos += 45;
      });
    }

    this.maxScrollY = Math.max(0, yPos - 380);
  }

  // ================= 의료소 (Infirmary) =================
  private renderInfirmaryDrawer(w: number): void {
    const inf = this.gm.buildings['infirmary'];
    const capacity = this.gm.getInfirmaryCapacity();
    const currentPatients = this.gm.infirmaryPatients;

    const title = this.add.text(10, 0, `입원 병동 (슬롯: ${currentPatients.length}/${capacity})`, {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#ef5350', fontStyle: 'bold'
    });
    this.drawerContentScrollArea.add(title);

    let yPos = 30;

    // 병동 슬롯 렌더링
    for (let i = 0; i < capacity; i++) {
      const patientId = currentPatients[i];
      const bg = this.add.graphics();
      bg.fillStyle(0x1a2130, 1);
      bg.fillRoundedRect(0, yPos, w, 60, 8);
      bg.lineStyle(1.5, 0xef5350, 0.8);
      bg.strokeRoundedRect(0, yPos, w, 60, 8);

      if (patientId) {
        const hero = this.gm.barracks.find(h => h.id === patientId)!;
        const icon = this.add.text(10, yPos + 18, '🛏️', { fontSize: '20px' });
        const name = this.add.text(45, yPos + 10, `${hero.name} (Lv.${hero.level})`, { fontSize: '13px', color: '#fff', fontStyle: 'bold', fontFamily: 'Noto Sans KR' });
        const mpStr = (inf?.level || 0) >= 4 ? ` | MP: ${hero.currentMp}/${hero.maxMp}` : '';
        const hpText = this.add.text(45, yPos + 32, `HP: ${hero.currentHp}/${hero.maxHp}${mpStr}`, { fontSize: '12px', color: hero.currentHp < hero.maxHp ? '#ef5350' : '#38ef7d', fontFamily: 'JetBrains Mono' });
        
        const dischargeBtn = this.createActionButton(w - 70, yPos + 13, 60, 34, '퇴원', '#38ef7d', () => {
          this.gm.dischargeFromInfirmary(hero.id);
          this.renderDrawerContent();
        });

        this.drawerContentScrollArea.add([bg, icon, name, hpText, dischargeBtn]);
      } else {
        const emptyTxt = this.add.text(w / 2, yPos + 30, '비어 있는 병상', { fontSize: '12px', color: '#8b9bb4', fontFamily: 'Noto Sans KR' }).setOrigin(0.5);
        this.drawerContentScrollArea.add([bg, emptyTxt]);
      }
      yPos += 70;
    }

    yPos += 10;
    const rosterTitle = this.add.text(10, yPos, '입원 가능한 대상 목록', {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#c8aa6e', fontStyle: 'bold'
    });
    this.drawerContentScrollArea.add(rosterTitle);
    yPos += 30;

    const wounded = this.gm.barracks.filter(h => (h.currentHp < h.maxHp || ((inf?.level || 0) >= 4 && h.currentMp < h.maxMp)) && !currentPatients.includes(h.id));
    if (wounded.length === 0) {
      this.drawerContentScrollArea.add(this.add.text(10, yPos, '치료 대상이 없습니다.', { fontSize: '12px', color: '#8b9bb4' }));
    } else {
      wounded.forEach(hero => {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a2333, 1);
        bg.fillRoundedRect(0, yPos, w, 50, 6);
        
        const name = this.add.text(10, yPos + 10, `${hero.name}`, { fontSize: '13px', color: '#fff', fontStyle: 'bold', fontFamily: 'Noto Sans KR' });
        const mpStr = (inf?.level || 0) >= 4 ? ` | MP: ${hero.currentMp}/${hero.maxMp}` : '';
        const hpTxt = this.add.text(10, yPos + 30, `HP: ${hero.currentHp}/${hero.maxHp}${mpStr}`, { fontSize: '11px', color: '#ef5350', fontFamily: 'JetBrains Mono' });
        
        const admitBtn = this.createActionButton(w - 70, yPos + 8, 60, 34, '입원', '#ef5350', () => {
          if (this.gm.admitToInfirmary(hero.id)) {
            this.renderDrawerContent();
          }
        });

        this.drawerContentScrollArea.add([bg, name, hpTxt, admitBtn]);
        yPos += 60;
      });
    }

    this.maxScrollY = Math.max(0, yPos - 380);
  }

  // ================= 시장 (Market) =================
  private renderMarketDrawer(w: number): void {
    const market = this.gm.buildings['market'];
    const title = this.add.text(10, 0, `암거래 시장 (Lv.${market.level})`, {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#ffca28', fontStyle: 'bold'
    });
    this.drawerContentScrollArea.add(title);
    
    let yPos = 30;

    const itemsToTrade: { key: keyof GameResources, icon: string, name: string, buyPrice: number, sellPrice: number, reqLevel: number }[] = [
      { key: 'wood', icon: '🪵', name: '목재', buyPrice: 10, sellPrice: 2, reqLevel: 1 },
      { key: 'stone', icon: '🪨', name: '석재', buyPrice: 15, sellPrice: 3, reqLevel: 1 },
      { key: 'iron', icon: '⛏️', name: '철광석', buyPrice: 30, sellPrice: 5, reqLevel: 2 },
      { key: 'herb', icon: '🌿', name: '약초', buyPrice: 50, sellPrice: 10, reqLevel: 3 },
      { key: 'coal', icon: '⬛', name: '석탄', buyPrice: 100, sellPrice: 20, reqLevel: 4 },
      { key: 'leather', icon: '🦌', name: '가죽', buyPrice: 120, sellPrice: 25, reqLevel: 5 },
      { key: 'crystal', icon: '💎', name: '마력 수정', buyPrice: 200, sellPrice: 40, reqLevel: 6 },
    ];

    itemsToTrade.forEach(item => {
      const bg = this.add.graphics();
      bg.fillStyle(0x1a2130, 1);
      bg.fillRoundedRect(0, yPos, w, 50, 6);
      
      const icon = this.add.text(10, yPos + 14, item.icon, { fontSize: '20px' });
      const name = this.add.text(40, yPos + 8, item.name, { fontSize: '13px', color: '#fff', fontStyle: 'bold', fontFamily: 'Noto Sans KR' });
      const qty = this.add.text(40, yPos + 28, `보유: ${this.gm.resources[item.key]}`, { fontSize: '11px', color: '#8b9bb4', fontFamily: 'JetBrains Mono' });
      
      // 판매 버튼
      const sellBtn = this.createActionButton(w - 135, yPos + 8, 60, 34, `판매 (+${item.sellPrice})`, '#38ef7d', () => {
        if (this.gm.sellResource(item.key, 1, item.sellPrice)) this.renderDrawerContent();
      });
      
      this.drawerContentScrollArea.add([bg, icon, name, qty, sellBtn]);

      // 구매 버튼 (레벨 제한)
      if (market.level >= item.reqLevel) {
        const buyBtn = this.createActionButton(w - 70, yPos + 8, 60, 34, `구매 (-${item.buyPrice})`, '#ff416c', () => {
          if (this.gm.buyResource(item.key, 1, item.buyPrice)) this.renderDrawerContent();
        });
        this.drawerContentScrollArea.add(buyBtn);
      } else {
        const lockText = this.add.text(w - 65, yPos + 18, `Lv.${item.reqLevel} 해금`, { fontSize: '10px', color: '#8b9bb4', fontFamily: 'Noto Sans KR' });
        this.drawerContentScrollArea.add(lockText);
      }

      yPos += 60;
    });

    this.maxScrollY = Math.max(0, yPos - 380);
  }

  private bindEvents(): void {
    // 각 리스너를 클래스 필드로 참조하여 씬 종료 시 off() 해제 가능하게 설계
    const onResources = () => {
      this.updateStatusBar();
      if (this.isDrawerOpen && (this.currentDrawerTab === 'citadel' || this.currentDrawerTab === 'forge')) this.renderDrawerContent();
    };
    const onLog = () => this.updateLogs();
    const onBuild = () => { this.updateStatusBar(); if (this.isDrawerOpen) this.renderDrawerContent(); };
    const onDrawer = () => { if (this.isDrawerOpen) this.renderDrawerContent(); };
    const onTavern = () => { if (this.isDrawerOpen && this.currentDrawerTab === 'tavern') this.renderDrawerContent(); };

    this.gm.on('resourcesChanged', onResources);
    this.gm.on('logAdded', onLog);
    this.gm.on('buildingUpdated', onBuild);
    this.gm.on('questUpdated', onDrawer);
    this.gm.on('heroPromoted', onDrawer);
    this.gm.on('partyUpdated', onDrawer);
    this.gm.on('inventoryUpdated', onDrawer);
    this.gm.on('tavernRefreshed', onTavern);

    // 씬 종료 시 리스너 해제 — 메모리 누수 방지
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.gm.off('resourcesChanged', onResources);
      this.gm.off('logAdded', onLog);
      this.gm.off('buildingUpdated', onBuild);
      this.gm.off('questUpdated', onDrawer);
      this.gm.off('heroPromoted', onDrawer);
      this.gm.off('partyUpdated', onDrawer);
      this.gm.off('inventoryUpdated', onDrawer);
      this.gm.off('tavernRefreshed', onTavern);
    });
  }
}
