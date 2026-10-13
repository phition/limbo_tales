// @ts-nocheck
import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { FirebaseService, LeaderboardEntry } from '../services/FirebaseService';
import { PROMPT_REGISTRY } from '../data/prompts';
import { ArenaOpponent } from '../types/game';

export class ArenaScene extends Phaser.Scene {
  private gm!: GameManager;
  private fb!: FirebaseService;

  private bgContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private resizeTimer?: number;
  private safeW: number = 430;
  private safeX: number = 0;
  private safeY: number = 0;
    
  private headerContainer!: Phaser.GameObjects.Container;
  private headerText!: Phaser.GameObjects.Text;
  private cardContainer!: Phaser.GameObjects.Container;
  private cardTitleText!: Phaser.GameObjects.Text;
  private cardDescText!: Phaser.GameObjects.Text;
  private cardPromptText!: Phaser.GameObjects.Text;
  private isPromptMode: boolean = false;

  private actionContainer!: Phaser.GameObjects.Container;
  private arenaInteractiveArea!: Phaser.GameObjects.Container;
  private currentTab: 'match' | 'ranking' | 'shop' = 'match';

  private opponents: ArenaOpponent[] = [];
  private leaderboard: LeaderboardEntry[] = [];

  constructor() {
    super('ArenaScene');
  }

  create(): void {
    this.gm = GameManager.getInstance();
    this.fb = FirebaseService.getInstance();
    this.gm.currentSceneContext = 'arena';
    this.opponents = [];
    this.leaderboard = [];
    this.isPromptMode = false;
    this.currentTab = 'match';

    this.bgContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);
    this.scale.on('resize', this.onResize, this);
    
    this.rebuildUI();
    
    this.loadDataAndRender();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const circle = this.add.circle(pointer.worldX, pointer.worldY, 8, 0xff416c, 0.6).setDepth(9999);
      this.tweens.add({
        targets: circle,
        radius: 22,
        alpha: 0,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => circle.destroy()
      });
    });
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
    
    this.createBackground(logicalW, logicalH, 0, 0);
    this.uiContainer.setPosition(safeX, safeY);

    this.createHeader(safeW);
    if (this.headerContainer) this.uiContainer.add(this.headerContainer);

    this.createMediumCardFrame(safeW);
    if (this.cardContainer) this.uiContainer.add(this.cardContainer);

    this.createExpandedActionPanel(safeW);
    if (this.actionContainer) this.uiContainer.add(this.actionContainer);
    
    this.updateCardDisplay('citadel_arena');
    if (this.opponents.length > 0 || this.leaderboard.length > 0) {
      this.renderSubTabContent();
    }
  }

  private createBackground(w: number, h: number, x: number = 0, y: number = 0): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0f1e, 0x1a0f1e, 0x0c0812, 0x0c0812, 1);
    bg.fillRect(x, y, w, h);
    this.bgContainer.add(bg);
  }

  private createHeader(w: number): void {
    this.headerContainer = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e111a, 0.95);
    bg.fillRect(0, 0, w, 50);
    bg.lineStyle(1, 0xff416c, 0.8);
    bg.lineBetween(0, 50, w, 50);
    this.headerContainer.add(bg);

    this.headerText = this.add.text(15, 8, '', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#f0f3f8'
    });
    this.headerContainer.add(this.headerText);

    const returnBtn = this.add.container(w - 75, 10);
    const rBg = this.add.graphics();
    rBg.fillStyle(0xff416c, 0.9);
    rBg.fillRoundedRect(0, 0, 65, 30, 6);
    rBg.lineStyle(1, 0xffffff, 0.9);
    rBg.strokeRoundedRect(0, 0, 65, 30, 6);

    const rLbl = this.add.text(32, 15, '✕ 귀환', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    returnBtn.add([rBg, rLbl]);
    returnBtn.setSize(65, 30);
    returnBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 65, 30), Phaser.Geom.Rectangle.Contains);
    returnBtn.input!.cursor = 'pointer';
    returnBtn.on('pointerdown', () => this.scene.start('CitadelScene'));
    this.headerContainer.add(returnBtn);

    this.updateHeader();
  }

  private updateHeader(): void {
    if (!this.headerText || !this.gm) return;
    const buff = this.gm.pveBuffActive ? ' [★Top10 PVE버프 발동중]' : '';
    this.headerText.setText(
      `🏆 [차원 아레나 Season 1] 순위: ${this.gm.currentArenaRank}위 (${this.gm.currentArenaRating}P)${buff}\n🪙 보유 골드: ${this.gm.resources.gold} | ✨ 에테르: ${this.gm.resources.ether}`
    );
  }

  private createMediumCardFrame(w: number): void {
    const cardW = w - 40;
    const cardH = 340;
    this.cardContainer = this.add.container(20, 55);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1118, 0.96);
    bg.fillRoundedRect(0, 0, cardW, cardH, 16);
    bg.lineStyle(2, 0xff416c, 0.9);
    bg.strokeRoundedRect(0, 0, cardW, cardH, 16);
    this.cardContainer.add(bg);

    this.cardTitleText = this.add.text(cardW / 2, 24, '', {
      fontFamily: 'Cinzel',
      fontSize: '18px',
      color: '#ff8a80',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.cardContainer.add(this.cardTitleText);

    this.cardDescText = this.add.text(cardW / 2, cardH / 2 + 10, '', {
      fontFamily: 'Noto Sans KR',
      fontSize: '13px',
      color: '#cfd8dc',
      align: 'center',
      wordWrap: { width: cardW - 36 },
      lineSpacing: 4
    }).setOrigin(0.5);
    this.cardContainer.add(this.cardDescText);

    this.cardPromptText = this.add.text(18, 55, '', {
      fontFamily: 'JetBrains Mono',
      fontSize: '11px',
      color: '#ff8a80',
      wordWrap: { width: cardW - 36 },
      lineSpacing: 3
    }).setVisible(false);
    this.cardContainer.add(this.cardPromptText);

    const toggleBtn = this.add.container(cardW - 135, 12);
    const tBg = this.add.graphics();
    tBg.fillStyle(0x000000, 0.6);
    tBg.fillRoundedRect(0, 0, 120, 24, 12);
    tBg.lineStyle(1, 0xff416c, 0.8);
    tBg.strokeRoundedRect(0, 0, 120, 24, 12);
    const tLbl = this.add.text(60, 12, '🎨 아레나 프롬프트', {
      fontFamily: 'Noto Sans KR',
      fontSize: '10px',
      color: '#ff8a80'
    }).setOrigin(0.5);

    toggleBtn.add([tBg, tLbl]);
    toggleBtn.setSize(120, 24);
    toggleBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 120, 24), Phaser.Geom.Rectangle.Contains);
    toggleBtn.input!.cursor = 'pointer';
    toggleBtn.on('pointerdown', () => {
      this.isPromptMode = !this.isPromptMode;
      tLbl.setText(this.isPromptMode ? '🖼️ 비주얼 뷰' : '🎨 아레나 프롬프트');
      this.cardDescText.setVisible(!this.isPromptMode);
      this.cardPromptText.setVisible(this.isPromptMode);
    });
    this.cardContainer.add(toggleBtn);
  }

  private updateCardDisplay(promptKey: string): void {
    if (!this.cardTitleText) return;
    const data = PROMPT_REGISTRY[promptKey] || PROMPT_REGISTRY['citadel_arena'];
    this.cardTitleText.setText(data.title);
    this.cardDescText.setText(data.description);
    this.cardPromptText.setText(`[ARENA IMAGE PROMPT]\n${data.prompt}\n\n[NEGATIVE PROMPT]\n${data.negativePrompt}`);
  }

  private createExpandedActionPanel(w: number): void {
    const drawerY = 405;
    const drawerW = w - 40;
    const drawerH = 485;

    this.actionContainer = this.add.container(20, drawerY);

    const bg = this.add.graphics();
    bg.fillStyle(0x131118, 0.98);
    bg.fillRoundedRect(0, 0, drawerW, drawerH, 16);
    bg.lineStyle(2, 0xff416c, 0.85);
    bg.strokeRoundedRect(0, 0, drawerW, drawerH, 16);
    this.actionContainer.add(bg);

    const headerGfx = this.add.graphics();
    headerGfx.fillStyle(0x22141e, 1);
    headerGfx.fillRoundedRect(4, 4, drawerW - 8, 44, { tl: 14, tr: 14, bl: 0, br: 0 });
    headerGfx.lineStyle(1, 0x3d2030, 1);
    headerGfx.lineBetween(4, 48, drawerW - 4, 48);
    this.actionContainer.add(headerGfx);

    const title = this.add.text(18, 24, '🏆 차원 아레나 대전 & 시즌 랭킹', {
      fontFamily: 'Noto Sans KR',
      fontSize: '14px',
      color: '#ff8a80',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.actionContainer.add(title);

    const closeBtn = this.add.container(drawerW - 65, 24);
    const cBg = this.add.graphics();
    cBg.fillStyle(0x37474f, 0.9);
    cBg.fillRoundedRect(-45, -14, 90, 28, 14);
    cBg.lineStyle(1.5, 0x78909c, 1);
    cBg.strokeRoundedRect(-45, -14, 90, 28, 14);

    const cLbl = this.add.text(0, 0, '✕ 성채 귀환', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.add([cBg, cLbl]);
    closeBtn.setSize(90, 28);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-45, -14, 90, 28), Phaser.Geom.Rectangle.Contains);
    closeBtn.input!.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.scene.start('CitadelScene'));
    this.actionContainer.add(closeBtn);

    this.arenaInteractiveArea = this.add.container(12, 54);
    this.actionContainer.add(this.arenaInteractiveArea);
  }

  private async loadDataAndRender(): Promise<void> {
    this.opponents = await this.fb.getArenaOpponents();
    this.leaderboard = await this.fb.getLeaderboard();
    this.renderSubTabContent();
  }

  private renderSubTabContent(): void {
    if (!this.arenaInteractiveArea) return;
    this.arenaInteractiveArea.removeAll(true);
    
    // Use the safeW width derived in rebuildUI if possible, or recalculate based on logicalW.
    // In rebuildUI, we have `const w = safeW - 40` for action panel width. The interactive area is inside it.
    // Let's get safeW back from camera or scale.
    const w = this.safeW - 40 - 24; // safeW - padding 40 from action panel - 24 (12 left padding + 12 right padding for interactive area)

    const tabs: { key: 'match' | 'ranking' | 'shop'; label: string }[] = [
      { key: 'match', label: '⚔️ 대전 매칭' },
      { key: 'ranking', label: '🏆 시즌 랭킹' },
      { key: 'shop', label: '💎 명예 상점' }
    ];

    const tabWidth = w / tabs.length;
    tabs.forEach((tab, index) => {
      const tabBtn = this.add.container(index * tabWidth, 0);
      const isSel = this.currentTab === tab.key;
      const tBg = this.add.graphics();
      tBg.fillStyle(isSel ? 0x2e1824 : 0x18121c, 1);
      tBg.fillRoundedRect(2, 0, tabWidth - 4, 38, 6);
      tBg.lineStyle(1.5, isSel ? 0xff416c : 0x3d2535, 1);
      tBg.strokeRoundedRect(2, 0, tabWidth - 4, 38, 6);

      const tLbl = this.add.text(tabWidth / 2, 19, tab.label, {
        fontFamily: 'Noto Sans KR',
        fontSize: '12px',
        color: isSel ? '#ffffff' : '#8b9bb4',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      tabBtn.add([tBg, tLbl]);
      tabBtn.setSize(tabWidth, 38);
      tabBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabWidth, 38), Phaser.Geom.Rectangle.Contains);
      tabBtn.input!.cursor = 'pointer';
      tabBtn.on('pointerdown', () => {
        this.currentTab = tab.key;
        this.renderSubTabContent();
      });
      this.arenaInteractiveArea.add(tabBtn);
    });

    const contentBox = this.add.container(0, 46);
    if (this.currentTab === 'match') {
      this.renderMatchView(contentBox, w);
    } else if (this.currentTab === 'ranking') {
      this.renderRankingView(contentBox, w);
    } else if (this.currentTab === 'shop') {
      this.renderShopView(contentBox, w);
    }
    this.arenaInteractiveArea.add(contentBox);
  }

  private renderMatchView(container: Phaser.GameObjects.Container, w: number): void {
    this.opponents.forEach((opp, idx) => {
      const yPos = idx * 115;
      const card = this.add.container(0, yPos);

      const bg = this.add.graphics();
      bg.fillStyle(0x1e1522, 1);
      bg.fillRoundedRect(0, 0, w, 105, 8);
      bg.lineStyle(1.5, 0xff416c, 0.8);
      bg.strokeRoundedRect(0, 0, w, 105, 8);

      const title = this.add.text(14, 14, `[Rank ${opp.rank}] ${opp.name}`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      const sub = this.add.text(14, 38, `소속: ${opp.guild} | 레이팅: ${opp.rating}P`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: '#8b9bb4'
      });

      const rewardInfo = this.add.text(14, 62, `승리 시: 레이팅 +45P, 🪙+300, ✨+10`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: '#38ef7d'
      });

      const fightBtn = this.createActionButton(w - 80, 25, 68, 50, '⚔️\n도전', 0xff416c, () => {
        this.simulateArenaBattle(opp);
      });

      card.add([bg, title, sub, rewardInfo, fightBtn]);
      container.add(card);
    });
  }

  private renderRankingView(container: Phaser.GameObjects.Container, w: number): void {
    const banner = this.add.text(w / 2, 4, '👑 Top 1~10위 랭커 한정: PVE 공격/체력 +15% 특수 버프', {
      fontFamily: 'Noto Sans KR',
      fontSize: '11px',
      color: '#ffeb3b',
      align: 'center'
    }).setOrigin(0.5, 0);
    container.add(banner);

    this.leaderboard.slice(0, 6).forEach((entry, idx) => {
      const yPos = 26 + idx * 56;
      const row = this.add.container(0, yPos);

      const bg = this.add.graphics();
      const isTop3 = entry.rank <= 3;
      bg.fillStyle(entry.isPlayer ? 0x2e2538 : (isTop3 ? 0x2c1822 : 0x18141e), 1);
      bg.fillRoundedRect(0, 0, w, 48, 6);
      bg.lineStyle(1, entry.isPlayer ? 0x00d2ff : (isTop3 ? 0xffd54f : 0x3d2838), 1);
      bg.strokeRoundedRect(0, 0, w, 48, 6);

      const rankBadge = this.add.text(14, 24, `#${entry.rank}`, {
        fontFamily: 'Cinzel',
        fontSize: '15px',
        color: isTop3 ? '#ffd54f' : '#8b9bb4',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const name = this.add.text(62, 11, `${entry.nickname} (Lv.${entry.level})`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      const leader = this.add.text(62, 27, `리더: ${entry.leaderTitle} | ${entry.rating}P`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '10px',
        color: '#8b9bb4'
      });

      row.add([bg, rankBadge, name, leader]);
      container.add(row);
    });
  }

  private renderShopView(container: Phaser.GameObjects.Container, w: number): void {
    const items = [
      { name: '고대 전직 촉매석', desc: '용병 2차 전직 시 에테르 소모량 50% 절감', cost: 1000, type: 'gold' },
      { name: '승리자의 룬 검도안', desc: '대장간 전설 장비 제작 레시피 해금', cost: 2500, type: 'gold' },
      { name: '발키리의 은총 (포션x5)', desc: '심연 탐험 시 파티 전원 즉시 완전 회복', cost: 20, type: 'ether' }
    ];

    items.forEach((item, idx) => {
      const yPos = idx * 95;
      const card = this.add.container(0, yPos);

      const bg = this.add.graphics();
      bg.fillStyle(0x1e1522, 1);
      bg.fillRoundedRect(0, 0, w, 85, 8);
      bg.lineStyle(1.5, 0x00d2ff, 0.8);
      bg.strokeRoundedRect(0, 0, w, 85, 8);

      const title = this.add.text(14, 14, item.name, {
        fontFamily: 'Noto Sans KR',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      const desc = this.add.text(14, 36, item.desc, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: '#8b9bb4',
        wordWrap: { width: w - 100 }
      });

      const price = this.add.text(14, 58, `가격: ${item.type === 'gold' ? `🪙 ${item.cost} 골드` : `✨ ${item.cost} 에테르`}`, {
        fontFamily: 'Noto Sans KR',
        fontSize: '11px',
        color: '#ffd54f'
      });

      const buyBtn = this.createActionButton(w - 75, 20, 65, 42, '구매', 0x00d2ff, () => {
        const canBuy = item.type === 'gold' ? this.gm.modifyResource('gold', -item.cost) : this.gm.modifyResource('ether', -item.cost);
        if (canBuy) {
          this.gm.addLog(`[명예 상점] [${item.name}]을(를) 성공적으로 구입했습니다!`, 'reward');
          this.updateHeader();
        } else {
          this.gm.addLog('재화가 부족하여 구입할 수 없습니다!', 'danger');
        }
      });

      card.add([bg, title, desc, price, buyBtn]);
      container.add(card);
    });
  }

  private simulateArenaBattle(opp: ArenaOpponent): void {
    const isWin = Math.random() > 0.25;
    if (isWin) {
      this.gm.updateArenaRating(45);
      this.gm.modifyResource('gold', 300);
      this.gm.modifyResource('ether', 10);
      this.gm.addLog(`★ [아레나 승리!] [${opp.name}]을(를) 꺾고 레이팅 +45P 상승! (🪙+300, ✨+10)`, 'reward');
    } else {
      this.gm.updateArenaRating(-15);
      this.gm.addLog(`[아레나 패배] [${opp.name}]의 치밀한 방어 진형에 패배했습니다. (레이팅 -15P)`, 'danger');
    }
    this.updateHeader();
    this.renderSubTabContent();
  }

  private createActionButton(x: number, y: number, w: number, h: number, text: string, color: number, callback: Function): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x241828, 1);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1.5, color, 0.9);
    bg.strokeRoundedRect(0, 0, w, h, 8);

    const lbl = this.add.text(w / 2, h / 2, text, {
      fontFamily: 'Noto Sans KR',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, lbl]);
    btn.setSize(w, h);
    btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    btn.input!.cursor = 'pointer';

    btn.on('pointerdown', () => {
      bg.setAlpha(1.4);
      callback();
    });
    btn.on('pointerout', () => { bg.setAlpha(1.0); });
    btn.on('pointerup', () => { bg.setAlpha(1.0); });
    return btn;
  }
}

