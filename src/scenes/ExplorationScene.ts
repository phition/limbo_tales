// @ts-nocheck
import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { PROMPT_REGISTRY } from '../data/prompts';
import { MONSTERS, FLOOR_MONSTER_POOL, FLOOR_BOSS_MAP } from '../data/monsters';

// ─── 던전 이벤트 타입 ────────────────────────────────────────
type ExploreEvent = 'monster' | 'loot' | 'special' | 'nothing' | 'trap' | 'buff' | 'portal';

interface SpecialEvent {
  id: string;
  title: string;
  desc: string;
  options: {
    label: string;
    color: number;
    action: () => void;
  }[];
}

// ─── 층 이름 테이블 ────────────────────────────────────────────
const FLOOR_NAMES: string[] = [
  '침묵의 회랑',
  '망령의 납골당',
  '에테르 광맥',
  '심연의 균열',
  '★ 원초의 제단',
  '핏빛 성역',
  '망각의 묘지',
  '단죄의 성채',
  '환영의 미궁',
  '★ 심연의 심장부'
];

// ─── 층별 색상 액센트 ──────────────────────────────────────────
const FLOOR_COLORS: number[] = [0x5c6bc0, 0x78909c, 0x00bcd4, 0xab47bc, 0xff416c, 0xd32f2f, 0x5c6bc0, 0x37474f, 0x0288d1, 0xb71c1c];

export class ExplorationScene extends Phaser.Scene {
  private gm!: GameManager;

  // 탐험 상태
  private currentFloor: number = 1;
  private maxFloor: number = 10;
  private dangerLevel: number = 0;        // 0~100: 위험도
  private isTorchLit: boolean = false;     // 횃불 ON 여부
  private dungeonGoldFound: number = 0;
  private dungeonEtherFound: number = 0;
  private dungeonItemFound: number = 0;
  private totalExploreSteps: number = 0;

  // UI refs
  private headerContainer!: Phaser.GameObjects.Container;
  private headerText!: Phaser.GameObjects.Text;
  private dangerBarFill!: Phaser.GameObjects.Graphics;
  private torchStatusText!: Phaser.GameObjects.Text;

  private cardContainer!: Phaser.GameObjects.Container;
  private cardTitleText!: Phaser.GameObjects.Text;
  private cardDescText!: Phaser.GameObjects.Text;
  private cardPromptText!: Phaser.GameObjects.Text;
  private isPromptMode: boolean = false;

  private logContainer!: Phaser.GameObjects.Container;
  private logLines: Phaser.GameObjects.Text[] = [];
  private LOG_MAX = 5;

  // ── 던전 인벤토리 ──────────────────────────────────────
  private readonly INV_SLOTS = 12;  // 6칸 × 2줄
  private invContainer!: Phaser.GameObjects.Container;

  private bottomPanel!: Phaser.GameObjects.Container;
  private exploreBtn!: Phaser.GameObjects.Container;
  private torchBtn!: Phaser.GameObjects.Container;

  private isAnimating: boolean = false;   // 탐색 중 중복 입력 방지
  private activeEventCard: Phaser.GameObjects.Container | null = null;

  private bgContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private resizeTimer?: number;
  private safeW: number = 430;
  private safeX: number = 0;
  private safeY: number = 0;
  
  constructor() {
    super('ExplorationScene');
  }

  create(): void {
    this.gm = GameManager.getInstance();
    this.gm.currentSceneContext = 'exploration';
    this.currentFloor = this.gm.dungeonFloor || 1;
    this.dangerLevel = this.gm.dungeonDangerLevel || 0;
    this.logLines = [];
    this.isPromptMode = false;
    this.isAnimating = false;
    this.activeEventCard = null;
    
    // 던전 시작 시, 첫 층(1층)에서만 인벤토리 초기화 후 기본 지급
    if (this.currentFloor === 1 && this.gm.dungeonInventory.length === 0) {
      this.gm.dungeonInventory = [];
      this.gm.addToDungeonInventory('torch', '횃불', '🔥', 99);
      this.gm.addToDungeonInventory('food',  '식량', '🍖', 99);
    }

    this.bgContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    this.scale.on('resize', this.onResize, this);
    this.rebuildUI();

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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.isAnimating = false;
    });

    if (this.gm.portalAppeared) {
      this.time.delayedCall(500, () => {
        this.triggerPortalEvent();
      });
    }
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

    // Recreate background
    const bgGfx = this.add.graphics();
    bgGfx.fillGradientStyle(0x090b10, 0x090b10, 0x10141f, 0x10141f, 1);
    bgGfx.fillRect(0, 0, logicalW, logicalH);
    this.bgContainer.add(bgGfx);

    const particles = this.add.particles(0, 0, 'particle_dot', {
      x: { min: 0, max: logicalW }, y: { min: 55, max: 400 },
      speedY: { min: -8, max: -2 }, alpha: { start: 0.25, end: 0 },
      scale: { start: 0.6, end: 0 }, lifespan: { min: 2000, max: 4000 },
      quantity: 1, frequency: 400
    });
    this.bgContainer.add(particles);
    this.uiContainer.setPosition(safeX, safeY);
    
    // Create UI with safeW
    this.createHeader(safeW);
    if (this.headerContainer) this.uiContainer.add(this.headerContainer);

    this.createCardFrame(safeW);
    if (this.cardContainer) this.uiContainer.add(this.cardContainer);

    this.createLogPanel(safeW);
    if (this.logContainer) this.uiContainer.add(this.logContainer);

    this.createInventoryPanel(safeW);
    if (this.invContainer) this.uiContainer.add(this.invContainer);

    this.createBottomPanel(safeW);
    if (this.bottomPanel) this.uiContainer.add(this.bottomPanel);

    this.updateFloorCard();
    this.updateHeader();
    
    if (this.activeEventCard) {
      // you may need to recreate or bring event card to top, but adding it to uiContainer is fine
      this.uiContainer.add(this.activeEventCard);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HEADER — 상태 표시 바
  // ═══════════════════════════════════════════════════════════
  private createHeader(w: number): void {
    this.headerContainer = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0d16, 0.98);
    bg.fillRect(0, 0, w, 54);
    bg.lineStyle(1, FLOOR_COLORS[this.currentFloor - 1], 0.6);
    bg.lineBetween(0, 54, w, 54);
    this.headerContainer.add(bg);

    // 귀환 버튼
    const returnBtn = this.add.container(w - 70, 12);
    const rBg = this.add.graphics();
    rBg.fillStyle(0xff416c, 0.9);
    rBg.fillRoundedRect(0, 0, 60, 30, 6);
    rBg.lineStyle(1, 0xffffff, 0.7);
    rBg.strokeRoundedRect(0, 0, 60, 30, 6);
    const rLbl = this.add.text(30, 15, '✕ 귀환', {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    returnBtn.add([rBg, rLbl]);
    returnBtn.setSize(60, 30);
    returnBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 30), Phaser.Geom.Rectangle.Contains);
    returnBtn.input!.cursor = 'pointer';
    returnBtn.on('pointerdown', () => this.returnToCitadel());
    this.headerContainer.add(returnBtn);

    // 텍스트
    this.headerText = this.add.text(14, 8, '', {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#cfd8dc'
    });
    this.headerContainer.add(this.headerText);

    // 횃불 상태
    this.torchStatusText = this.add.text(14, 36, '', {
      fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#ff7b25'
    });
    this.headerContainer.add(this.torchStatusText);

    // 위험도 바 배경
    const dangerBg = this.add.graphics();
    dangerBg.fillStyle(0x1a2030, 1);
    dangerBg.fillRoundedRect(w - 190, 36, 112, 12, 4);
    this.headerContainer.add(dangerBg);

    this.dangerBarFill = this.add.graphics();
    this.headerContainer.add(this.dangerBarFill);
  }

  private updateHeader(): void {
    const fName = FLOOR_NAMES[this.currentFloor - 1] || '심연 깊은 곳';
    const buff = this.gm.pveBuffActive ? ' [PVE+15%]' : '';
    const partyHp = this.gm.party.map(h => `${h.name.substring(0, 3)}:${h.currentHp}`).join(' / ');

    this.headerText.setText(
      `📍 [${fName}] ${this.currentFloor}F | ${buff}` +
      `  🎒🪙+${this.dungeonGoldFound} ✨+${this.dungeonEtherFound} 📦+${this.dungeonItemFound}  |  ⚔️${partyHp}`
    );

    this.torchStatusText.setText(
      this.isTorchLit
        ? '🔥 횃불 점등 중 — 조우 확률 ↓ 파밍 확률 ↑ 위험도 +30%/탐색'
        : '🕯️ 횃불 꺼짐 — 시야 제한, 조우 확률 높음'
    );

    // 위험도 바
    const w = this.safeW;
    const maxDanger = this.getMaxDanger();
    const ratio = Math.min(this.dangerLevel / maxDanger, 1.0);
    let barW = Math.floor(112 * ratio);
    let dangerPct = Math.floor(ratio * 100);
    
    let barColor = dangerPct >= 80 ? 0xff416c : dangerPct >= 50 ? 0xffd54f : 0x38ef7d;
    let dangerTextStr = dangerPct >= 70 ? `⚠️ 보스전조 ${dangerPct}%` : `위험도 ${dangerPct}%`;
    
    if (this.gm.isOvercharged) {
      barW = 112;
      dangerPct = 100;
      barColor = 0xff2a2a; // 불타오르는 붉은색
      dangerTextStr = `🔥 OVERCHARGE 🔥`;
    }

    this.dangerBarFill.clear();
    if (barW > 0) {
      this.dangerBarFill.fillStyle(barColor, 1);
      this.dangerBarFill.fillRoundedRect(w - 190, 36, barW, 12, 4);
    }
    // 위험도 텍스트
    if (!this.headerContainer.getByName('dangerText')) {
      const dt = this.add.text(w - 74, 34, '', {
        fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#ffffff', fontStyle: 'bold'
      }).setName('dangerText');
      this.headerContainer.add(dt);
    }
    const dtEl = this.headerContainer.getByName('dangerText') as Phaser.GameObjects.Text;
    if (dtEl) dtEl.setText(dangerTextStr);
    
    if (this.gm.isOvercharged || dangerPct >= 70) {
      dtEl.setColor('#ff8a80');
    } else {
      dtEl.setColor('#ffffff');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CARD — 상단 비주얼 카드 (Y: 55, H: 240)
  // ═══════════════════════════════════════════════════════════
  private createCardFrame(w: number): void {
    const cardW = w - 40;
    const cardH = 425;  // 230 -> 425 화면 꽉 채우기
    this.cardContainer = this.add.container(20, 55);

    const bg = this.add.graphics();
    bg.fillStyle(0x111722, 0.97);
    bg.fillRoundedRect(0, 0, cardW, cardH, 14);
    bg.lineStyle(2, FLOOR_COLORS[this.currentFloor - 1], 0.85);
    bg.strokeRoundedRect(0, 0, cardW, cardH, 14);
    this.cardContainer.add(bg);

    this.cardTitleText = this.add.text(cardW / 2, 22, '', {
      fontFamily: 'Cinzel', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.cardContainer.add(this.cardTitleText);

    this.cardDescText = this.add.text(cardW / 2, cardH / 2 + 16, '', {
      fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#b0bec5',
      align: 'center', wordWrap: { width: cardW - 32 }, lineSpacing: 4
    }).setOrigin(0.5);
    this.cardContainer.add(this.cardDescText);

    this.cardPromptText = this.add.text(16, 50, '', {
      fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#80e5ff',
      wordWrap: { width: cardW - 32 }, lineSpacing: 3
    }).setVisible(false);
    this.cardContainer.add(this.cardPromptText);

    // 프롬프트 토글
    const toggleBtn = this.add.container(cardW - 130, 11);
    const tBg = this.add.graphics();
    tBg.fillStyle(0x000000, 0.5);
    tBg.fillRoundedRect(0, 0, 116, 22, 11);
    tBg.lineStyle(1, 0x5c6bc0, 0.7);
    tBg.strokeRoundedRect(0, 0, 116, 22, 11);
    const tLbl = this.add.text(58, 11, '🎨 던전 프롬프트', {
      fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#9fa8da'
    }).setOrigin(0.5);
    toggleBtn.add([tBg, tLbl]);
    toggleBtn.setSize(116, 22);
    toggleBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 116, 22), Phaser.Geom.Rectangle.Contains);
    toggleBtn.input!.cursor = 'pointer';
    toggleBtn.on('pointerdown', () => {
      this.isPromptMode = !this.isPromptMode;
      tLbl.setText(this.isPromptMode ? '🖼️ 비주얼 뷰' : '🎨 던전 프롬프트');
      this.cardDescText.setVisible(!this.isPromptMode);
      this.cardPromptText.setVisible(this.isPromptMode);
    });
    this.cardContainer.add(toggleBtn);
  }

  private updateFloorCard(): void {
    if (this.currentFloor === 5 || this.currentFloor === 10) {
      this.cardTitleText.setText('원초의 제단 — Altar of Genesis');
      this.cardDescText.setText(
        '붕괴된 제단 중앙에서 공허의 에너지가 소용돌이칩니다.\n' +
        '[공허의 침식자]가 눈을 뜨며 심연이 반응합니다.\n\n' +
        '위험도가 100%에 달하면 최종 보스가 출현합니다!'
      );
      this.cardPromptText.setText(
        '[BOSS FLOOR PROMPT]\n' +
        'cataclysmic altar in purple space void, colossal shadow boss with glowing eye, dark fantasy anime style, epic 8k'
      );
    } else {
      const floorDescs: string[] = [
        '짙은 흑무가 내려앉은 고대 회랑.\n돌 틈새로 차가운 바람이 휘몰아친다.\n어둠 속에 무언가가 숨을 고르고 있다.',
        '부서진 석관들이 늘어선 납골당.\n망령의 기척이 공기 중에 배어 있다.\n발을 잘못 디디면 불귀의 객이 될 것이다.',
        '에테르 결정이 벽면을 뒤덮은 광맥 지대.\n마력의 기운이 강렬하게 피부를 찌른다.\n채굴의 기회와 위험이 공존하는 구역이다.',
        '심연의 에너지가 공간 자체를 갈라놓은 균열지.\n발밑이 허공으로 무너질 수 있다.\n이곳을 지나면 최심부와 마주한다.'
      ];
      const data = PROMPT_REGISTRY['dungeon_limbo_gate'];
      this.cardTitleText.setText(`심연 ${this.currentFloor}구역 — ${FLOOR_NAMES[this.currentFloor - 1]}`);
      this.cardDescText.setText(floorDescs[this.currentFloor - 1] || '심연을 탐험하라.');
      this.cardPromptText.setText(`[DUNGEON PROMPT F${this.currentFloor}]\n${data.prompt}`);
    }
  }

  // ── LOG PANEL (Y:490, H:140) ────────────────────────────────────
  private createLogPanel(w: number): void {
    const panelW = w - 40;
    const panelH = 140;
    const panelY = 490;
    this.logContainer = this.add.container(20, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1018, 0.97);
    bg.fillRoundedRect(0, 0, panelW, panelH, 12);
    bg.lineStyle(1.5, 0x2a3350, 0.9);
    bg.strokeRoundedRect(0, 0, panelW, panelH, 12);
    this.logContainer.add(bg);

    const logHeader = this.add.text(14, 10, '📋 탐험 기록', {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#546e7a', fontStyle: 'bold'
    });
    this.logContainer.add(logHeader);

    this.logLines = [];
    for (let i = 0; i < this.LOG_MAX; i++) {
      const lt = this.add.text(14, 26 + i * 26, '-', {
        fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#8b9bb4'
      });
      this.logLines.push(lt);
      this.logContainer.add(lt);
    }

    this.refreshLogPanel();
  }

  private refreshLogPanel(): void {
    if (!this.logLines || this.logLines.length === 0) return;
    const logs = this.gm.logs.slice(-this.LOG_MAX).reverse();
    this.logLines.forEach((line, i) => {
      if (!line || !line.scene || !line.active) return;
      const entry = logs[i];
      if (entry) {
        const colorMap: Record<string, string> = {
          danger: '#ff6b6b', reward: '#38ef7d', story: '#80e5ff',
          normal: '#b0bec5', system: '#ffd54f'
        };
        const safeText = entry.text ? entry.text.trim() : '';
        if (safeText.length > 0) {
          line.setText(`> ${safeText}`);
        } else {
          line.setText('-');
        }
        line.setColor(colorMap[entry.type] || '#8b9bb4');
      } else {
        line.setText('-');
      }
    });
  }

  private addLog(msg: string, type: 'danger' | 'reward' | 'story' | 'normal' | 'system' = 'normal'): void {
    this.gm.addLog(msg, type);
    this.refreshLogPanel();
  }
  // ── INVENTORY PANEL (Y:640, H:110, 6×2) ────────────────────────────
  private createInventoryPanel(w: number): void {
    const panelW = w - 40;
    const panelH = 110;
    const panelY = 640;
    this.invContainer = this.add.container(20, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0c1220, 0.98);
    bg.fillRoundedRect(0, 0, panelW, panelH, 10);
    bg.lineStyle(1.5, 0x1e3a5f, 0.9);
    bg.strokeRoundedRect(0, 0, panelW, panelH, 10);
    this.invContainer.add(bg);

    this.invContainer.add(this.add.text(14, 8, '🎒 던전 인벤토리 (12칸 | 귀환 시 정산 / 사망 시 소실)', {
      fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#5c7a9f', fontStyle: 'bold'
    }));

    this.refreshInventoryUI();
  }

  private refreshInventoryUI(): void {
    if (!this.invContainer) return;
    // 슬롯 아이콘만 제거 (bg와 header는 유지)
    const toRemove = this.invContainer.getAll().filter((_obj, i) => i >= 2);
    toRemove.forEach(o => o.destroy());

    const panelW = this.safeW - 40;
    const slotW = Math.floor((panelW - 16) / 6);
    const slotH = 40;

    for (let slot = 0; slot < this.INV_SLOTS; slot++) {
      const col = slot % 6;
      const row = Math.floor(slot / 6);
      const sx = 8 + col * (slotW + 2);
      const sy = 22 + row * (slotH + 4);

      const item = this.gm.dungeonInventory[slot];

      const slotGfx = this.add.graphics();
      slotGfx.fillStyle(item ? 0x162030 : 0x0c1520, 1);
      slotGfx.fillRoundedRect(sx, sy, slotW, slotH, 5);
      slotGfx.lineStyle(1, item ? 0x3a6090 : 0x1a2a40, 0.9);
      slotGfx.strokeRoundedRect(sx, sy, slotW, slotH, 5);
      this.invContainer.add(slotGfx);

      if (item) {
        const iconT = this.add.text(sx + slotW / 2, sy + 8, item.icon, {
          fontSize: '14px'
        }).setOrigin(0.5, 0);
        const qtyT = this.add.text(sx + slotW - 4, sy + slotH - 4, `×${item.qty}`, {
          fontFamily: 'JetBrains Mono', fontSize: '8px', color: '#38ef7d'
        }).setOrigin(1, 1);
        const lblT = this.add.text(sx + slotW / 2, sy + 24, item.label.substring(0, 3), {
          fontFamily: 'Noto Sans KR', fontSize: '8px', color: '#90a4ae'
        }).setOrigin(0.5, 0);
        this.invContainer.add([iconT, qtyT, lblT]);

        // 클릭 사용
        const hitArea = this.add.zone(sx, sy, slotW, slotH).setOrigin(0);
        hitArea.setInteractive(new Phaser.Geom.Rectangle(0, 0, slotW, slotH), Phaser.Geom.Rectangle.Contains);
        hitArea.input!.cursor = 'pointer';
        const capturedItem = item;
        hitArea.on('pointerdown', () => this.useInventoryItem(capturedItem));
        this.invContainer.add(hitArea);
      }
    }
  }

  private useInventoryItem(item: { key: string; label: string; icon: string; qty: number }): void {
    if (item.qty <= 0) return;

    if (item.key === 'torch') {
      if (this.isTorchLit) {
        this.addLog('횃불이 이미 켜져 있습니다.', 'system');
        return;
      }
      item.qty -= 1;
      this.isTorchLit = true;
      this.addLog('🔥 횃불 소모! 탐색 환경 개선 (몬스터 조우↓, 파밍↑)', 'story');
      this.updateTorchButton();
    } else if (item.key === 'food') {
      item.qty -= 1;
      this.gm.party.forEach(h => {
        if (h.currentHp > 0) h.currentHp = Math.min(h.maxHp, h.currentHp + 30);
      });
      this.addLog('🍖 [식량] 파티 HP +30 회복!', 'reward');
      const panelW = this.safeW - 40;
      this.buildPartyStatusBar(panelW);
    } else {
      this.addLog(`${item.icon} [${item.label}] 던전 내에서는 직접 사용할 수 없습니다. (귀환 시 영지로 이동)`, 'system');
      return;
    }
    this.refreshInventoryUI();
  }

  private updateTorchButton(): void {
    // 전체 재생없이 횃불 버튼의 라벨만 업데이트 (torchBtn 내부 Text에 접근)
    this.torchBtn.getAll().forEach(obj => {
      if (obj instanceof Phaser.GameObjects.Text) {
        obj.setText(this.isTorchLit ? '🕯️ 횃불 끄기' : '🔥 횃불 켜기\n(조우↓ 파밍↑ 위험도+30%)');
      }
    });
  }

  // ── BOTTOM PANEL (Y:760) ─────────────────────────────────────────
  private createBottomPanel(w: number): void {
    const panelW = w - 40;
    const panelY = 760;  // 인벤토리 아래
    this.bottomPanel = this.add.container(20, panelY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f131e, 0.99);
    bg.fillRoundedRect(0, 0, panelW, 162, 14);
    bg.lineStyle(2, FLOOR_COLORS[this.currentFloor - 1], 0.7);
    bg.strokeRoundedRect(0, 0, panelW, 162, 14);
    this.bottomPanel.add(bg);

    // 파티 HP/MP 바 상태 표시
    this.buildPartyStatusBar(panelW);

    // 탐색 버튼
    this.exploreBtn = this.createLargeActionButton(
      6, 66, (panelW - 18) / 2, 50,
      '🔍 탐색\n(위험도 1~5 증가)', 0xc8aa6e,
      () => this.doExplore()
    );
    this.bottomPanel.add(this.exploreBtn);

    // 횃불 버튼
    this.torchBtn = this.createLargeActionButton(
      12 + (panelW - 18) / 2, 66, (panelW - 18) / 2, 50,
      this.isTorchLit ? '🕯️ 횃불 끄기' : '🔥 횃불 켜기\n(조우↓ 파밍↑ 위험도+30%)',
      this.isTorchLit ? 0x78909c : 0xff7b25,
      () => this.toggleTorch()
    );
    this.bottomPanel.add(this.torchBtn);

    // 야영 / 귀환 보조 버튼 (위험도 기반 실패 확률 적용)
    const campBtn = this.createSmallActionButton(
      6, 126, (panelW - 18) / 2 - 2, 28,
      '⛺ 야영 (HP/MP 50% 회복)', 0xab47bc,
      () => {
        const failChance = this.gm.isOvercharged ? 1.0 : (this.dangerLevel / this.getMaxDanger()) * 0.5; // 오버차지 시 무조건 실패
        if (Math.random() < failChance) {
          this.addLog(this.gm.isOvercharged ? '⚠️ 오버차지 상태라 야영이 불가능합니다! 몬스터가 기습합니다!' : '⚠️ 야영 준비 중 몬스터의 기습을 받았습니다!', 'danger');
          this.triggerMonsterEncounter();
          return;
        }

        this.gm.party.forEach(h => {
          h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * 0.5));
          h.currentMp = Math.min(h.maxMp, h.currentMp + Math.floor(h.maxMp * 0.5));
        });
        this.addLog('간이 야영으로 파티 전원의 체력/마나를 50% 회복했습니다.', 'story');
        this.buildPartyStatusBar(panelW);
      }
    );
    this.bottomPanel.add(campBtn);

    const returnBtn = this.createSmallActionButton(
      12 + (panelW - 18) / 2, 126, (panelW - 18) / 2, 28,
      '🏃 영지로 귀환 (전리품 정산)', 0x4caf50,
      () => {
        const failChance = this.gm.isOvercharged ? 1.0 : (this.dangerLevel / this.getMaxDanger()) * 0.5;
        if (Math.random() < failChance) {
          this.addLog(this.gm.isOvercharged ? '⚠️ 오버차지 상태라 귀환이 불가능합니다! 던전의 마력이 길을 막습니다!' : '⚠️ 귀환 시도 중 몬스터에게 발각되었습니다!', 'danger');
          this.triggerMonsterEncounter();
          return;
        }

        this.addLog('탐험을 마치고 영지로 귀환합니다.', 'story');
        this.time.delayedCall(500, () => this.returnToCitadel());
      }
    );
    this.bottomPanel.add(returnBtn);
  }

  private buildPartyStatusBar(panelW: number): void {
    // 기존 파티 상태 컨테이너 제거
    const old = this.bottomPanel.getByName('partyBar');
    if (old) { (old as Phaser.GameObjects.Container).destroy(); }

    const partyBar = this.add.container(6, 6).setName('partyBar');
    const barW = (panelW - 18) / Math.max(this.gm.party.length, 1);

    this.gm.party.forEach((hero, idx) => {
      const x = idx * (barW + 3);
      const hpRatio = hero.currentHp / hero.maxHp;
      const mpRatio = hero.currentMp / hero.maxMp;

      const hBg = this.add.graphics();
      hBg.fillStyle(0x1a2133, 1);
      hBg.fillRoundedRect(x, 0, barW, 56, 6);
      hBg.lineStyle(1, hpRatio < 0.3 ? 0xff416c : 0x2e3d55, 1);
      hBg.strokeRoundedRect(x, 0, barW, 56, 6);

      const nameLbl = this.add.text(x + barW / 2, 10, `${hero.name}`, {
        fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#cfd8dc', fontStyle: 'bold'
      }).setOrigin(0.5, 0);

      // HP 바
      const hpBg = this.add.graphics();
      hpBg.fillStyle(0x2e1515, 1);
      hpBg.fillRoundedRect(x + 6, 24, barW - 12, 10, 3);
      const hpFill = this.add.graphics();
      const hpColor = hpRatio > 0.5 ? 0x38ef7d : hpRatio > 0.25 ? 0xffd54f : 0xff416c;
      hpFill.fillStyle(hpColor, 1);
      hpFill.fillRoundedRect(x + 6, 24, Math.max(2, Math.floor((barW - 12) * hpRatio)), 10, 3);

      // MP 바
      const mpBg = this.add.graphics();
      mpBg.fillStyle(0x0f1b2e, 1);
      mpBg.fillRoundedRect(x + 6, 38, barW - 12, 8, 3);
      const mpFill = this.add.graphics();
      mpFill.fillStyle(0xc8aa6e, 0.8);
      mpFill.fillRoundedRect(x + 6, 38, Math.max(1, Math.floor((barW - 12) * mpRatio)), 8, 3);

      const hpLbl = this.add.text(x + barW / 2, 48, `${hero.currentHp}/${hero.maxHp}`, {
        fontFamily: 'JetBrains Mono', fontSize: '8px', color: '#8b9bb4'
      }).setOrigin(0.5, 0);

      partyBar.add([hBg, nameLbl, hpBg, hpFill, mpBg, mpFill, hpLbl]);
    });

    if (this.gm.party.length === 0) {
      const noParty = this.add.text(panelW / 2 - 10, 20, '⚠️ 원정대가 편성되지 않았습니다!', {
        fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#ff6b6b', fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      partyBar.add(noParty);
    }

    this.bottomPanel.add(partyBar);
  }

  // ═══════════════════════════════════════════════════════════
  // 핵심 탐색 알고리즘
  // ═══════════════════════════════════════════════════════════
  private getMaxDanger(): number {
    return this.currentFloor * 20; // 1층 20, 2층 40, ... 5층 100
  }

  private doExplore(): void {
    if (this.isAnimating) return;
    if (this.activeEventCard) return;  // 이벤트 처리 중 탐색 불가
    if (this.gm.party.length === 0) {
      this.addLog('원정대가 편성되지 않아 탐험할 수 없습니다!', 'danger');
      return;
    }

    this.isAnimating = true;
    this.totalExploreSteps += 1;

    // 1) 위험도 증가 (1~5, 횃불 켜면 +30% 추가)
    const baseDanger = Phaser.Math.Between(1, 5);
    const torchBonus = this.isTorchLit ? Math.ceil(baseDanger * 0.3) : 0;
    const dangerIncrease = baseDanger + torchBonus;
    const maxDanger = this.getMaxDanger();
    this.dangerLevel = Math.min(maxDanger, this.dangerLevel + dangerIncrease);
    this.gm.dungeonDangerLevel = this.dangerLevel;

    this.addLog(
      `🔍 [탐색 #${this.totalExploreSteps}] 위험도 +${dangerIncrease} → ${this.dangerLevel} / ${maxDanger}` +
      (torchBonus > 0 ? ` (횃불: +${torchBonus})` : ''),
      'normal'
    );

    // 70% 이상 위험도 도달 시 보스 전조 경고
    const dangerRatio = this.dangerLevel / maxDanger;
    if (dangerRatio >= 0.7 && dangerRatio < 1.0 && !this.gm.isOvercharged) {
      const isBossFloor = (this.currentFloor === 5 || this.currentFloor === 10);
      const omenMsg = isBossFloor
        ? '⚠️ [공허의 전조] 시공간이 일그러지며 공허의 침식자의 살기가 감지됩니다! (위험도 100% 임박!)'
        : '⚠️ [심연의 전조] 깊은 어둠 속에서 강력한 마력과 군주의 포효가 울려 퍼집니다! (보스 출현 임박!)';
      this.addLog(omenMsg, 'danger');
    }

    this.updateHeader();

    // 2) 최대 위험도 도달 → 보스 강제 출현 (오버차지 상태가 아닐 때만)
    if (this.dangerLevel >= maxDanger && !this.gm.isOvercharged) {
      this.time.delayedCall(400, () => {
        this.triggerBossEvent();
        this.isAnimating = false;
      });
      return;
    }

    // 3) 이벤트 결정 (횃불 여부에 따라 확률 변동)
    const eventType = this.rollExploreEvent();

    this.time.delayedCall(300, () => {
      switch (eventType) {
        case 'monster': this.triggerMonsterEncounter(); break;
        case 'loot':    this.triggerLootEvent();        break;
        case 'special': this.triggerSpecialEvent();     break;
        case 'nothing': this.triggerNothingEvent();     break;
        case 'trap':    this.triggerTrapEvent();        break;
        case 'buff':    this.triggerBuffEvent();        break;
        case 'portal':  this.triggerPortalEvent();      break;
      }
      this.isAnimating = false;
    });
  }

  /** 횃불 상태에 따른 이벤트 가중치 결정 */
  private rollExploreEvent(): ExploreEvent {
    let weights: Record<ExploreEvent, number>;
    
    if (this.gm.isOvercharged) {
      // 오버차지 상태: 몬스터 40 / 포탈 20 / 함정 25 / 특별 15
      weights = { monster: 40, loot: 0, special: 15, nothing: 0, trap: 25, buff: 0, portal: 20 };
    } else {
      // 일반 상태
      if (this.isTorchLit) {
        weights = { monster: 20, loot: 40, special: 15, nothing: 10, trap: 5, buff: 10, portal: 0 };
      } else {
        weights = { monster: 30, loot: 25, special: 15, nothing: 10, trap: 15, buff: 5, portal: 0 };
      }
    }

    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const roll = Math.random() * total;
    let cumul = 0;
    for (const [key, w] of Object.entries(weights) as [ExploreEvent, number][]) {
      cumul += w;
      if (roll < cumul) return key;
    }
    return 'nothing';
  }

  // ── 이벤트: 몬스터 조우 ─────────────────────────────────────
  private triggerMonsterEncounter(): void {
    const maxDanger = this.getMaxDanger();
    const dangerPct = this.dangerLevel / maxDanger;

    let monsterCount = 1;
    if (dangerPct >= 0.6) {
      monsterCount = Phaser.Math.Between(1, 3);
    } else if (dangerPct >= 0.3) {
      monsterCount = Phaser.Math.Between(1, 2);
    }

    const pool = FLOOR_MONSTER_POOL[this.currentFloor] ?? FLOOR_MONSTER_POOL[1];
    
    this.gm.currentMonsters = [];
    for (let i = 0; i < monsterCount; i++) {
      const monsterId = Phaser.Utils.Array.GetRandom(pool);
      const monster = MONSTERS[monsterId];
      if (monster) {
        const monCopy = JSON.parse(JSON.stringify(monster));
        const countLevelDown = Math.max(0, monsterCount - 1);
        monCopy.level = Math.max(1, monCopy.level - countLevelDown);
        const floorStatMult = 1 + (this.currentFloor - 1) * 0.20; // 🌟 B안: 층당 20% 누적 가산
        const nonBossMult = this.currentFloor >= 3 ? 1.10 : 1.0; // 🌟 3층 이상 보스 외 마물 스탯 10% 증가
        const eliteMult = monCopy.type === 'elite' ? 1.50 : 1.0;
        monCopy.maxHp = Math.round(monCopy.maxHp * floorStatMult * eliteMult * nonBossMult);
        monCopy.atk = Math.round(monCopy.atk * floorStatMult * nonBossMult);
        monCopy.def = Math.round(monCopy.def * floorStatMult * eliteMult * nonBossMult);
        monCopy.spd = Math.round((monCopy.spd || 10) * floorStatMult * eliteMult * nonBossMult);
        monCopy.luck = Math.round((monCopy.luck || 10) * floorStatMult * nonBossMult);
        this.gm.currentMonsters.push(monCopy);
      }
    }

    if (this.gm.currentMonsters.length > 0) {
      const mNames = this.gm.currentMonsters.map(m => m.name).join(', ');
      this.addLog(`⚠️ [적 조우] 어둠 속에서 [${mNames}]이(가) 나타났습니다! (총 ${monsterCount}마리)`, 'danger');
      this.time.delayedCall(600, () => this.scene.start('BattleScene'));
    }
  }

  // ── 이벤트: 파밍 ────────────────────────────────────────────
  private triggerLootEvent(): void {
    const panelW = this.safeW - 64;
    // 층수에 따라 보상 스케일
    const scale = 0.8 + this.currentFloor * 0.2;
    const lootTable = [
      {
        label: '🪙 고대 골드 주머니',
        roll: () => {
          const g = Math.floor((Phaser.Math.Between(50, 120)) * scale);
          this.gm.addToDungeonInventory('gold', '골드', '🪙', g);
          this.dungeonGoldFound += g;
          this.addLog(`고대 골드 발견! 🪙 +${g} (인벤토리 보관)`, 'reward');
        }
      },
      {
        label: '✨ 에테르 결정',
        roll: () => {
          const e = Math.floor(Phaser.Math.Between(5, 15) * scale);
          this.gm.addToDungeonInventory('ether', '에테르', '✨', e);
          this.dungeonEtherFound += e;
          this.addLog(`에테르 결정 발견! ✨ +${e} (인벤토리 보관)`, 'reward');
        }
      },
      {
        label: '⛏️ 철광석 광맥',
        roll: () => {
          const i = Math.floor(Phaser.Math.Between(10, 25) * scale);
          this.gm.addToDungeonInventory('iron', '철광석', '⛏️', i);
          this.dungeonItemFound += i;
          this.addLog(`철광석 발견! ⛏️ +${i} (인벤토리 보관)`, 'reward');
        }
      },
      {
        label: '🪵 정제 목재 더미',
        roll: () => {
          const w = Math.floor(Phaser.Math.Between(20, 40) * scale);
          this.gm.addToDungeonInventory('wood', '목재', '🪵', w);
          this.addLog(`정제 목재 더미 발견! 🪵 +${w} (인벤토리 보관)`, 'reward');
        }
      },
      {
        label: '✨ 마도 인챈트석 발견',
        roll: () => {
          const isPure = this.currentFloor >= 3 && Math.random() < 0.4;
          const isPrefix = Math.random() < 0.5;
          if (isPrefix) {
            const k = isPure ? 'pure_prefix_stone' : 'prefix_stone';
            const name = isPure ? '순수한 접두석' : '접두석';
            this.gm.addToDungeonInventory(k, name, '✨', 1);
            this.addLog(`신비로운 마도석 발견! ✨ ${name} +1 (인벤토리 보관)`, 'reward');
          } else {
            const k = isPure ? 'pure_suffix_stone' : 'suffix_stone';
            const name = isPure ? '순수한 접미석' : '접미석';
            this.gm.addToDungeonInventory(k, name, '🔮', 1);
            this.addLog(`신비로운 마도석 발견! 🔮 ${name} +1 (인벤토리 보관)`, 'reward');
          }
        }
      }
    ];

    // 1~2개 랜덤 획득
    const count = Phaser.Math.Between(1, 2);
    const shuffled = Phaser.Utils.Array.Shuffle([...lootTable]).slice(0, count);
    shuffled.forEach(item => item.roll());
    this.updateHeader();
    this.buildPartyStatusBar(panelW);
  }

  // ── 이벤트: 특별 이벤트 ─────────────────────────────────────
  private triggerSpecialEvent(): void {
    const panelW = this.safeW - 64;

    const eventPool: SpecialEvent[] = [
      {
        id: 'ether_vein',
        title: '📜 고대 에테르 광맥 발견',
        desc: '푸른 빛을 내뿜는 거대한 에테르 결정 광맥을 발견했습니다.\n어떤 방식으로 채굴하시겠습니까?',
        options: [
          {
            label: '1. 정밀하게 채굴한다 (에테르 +15, 철광 +10)',
            color: 0xc8aa6e,
            action: () => {
              this.gm.addToDungeonInventory('ether', '에테르', '✨', 15);
              this.gm.addToDungeonInventory('iron', '철광석', '⛏️', 10);
              this.addLog('정밀 채굴 성공. ✨+15, ⛏️+10 (인벤토리 보관)', 'reward');
              this.dungeonEtherFound += 15;
            }
          },
          {
            label: '2. 광맥을 폭파 채취 (에테르 +35, 파티 피해 15%)',
            color: 0xff7b25,
            action: () => {
              this.gm.addToDungeonInventory('ether', '에테르', '✨', 35);
              this.gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.85)); });
              this.addLog('폭파 채굴! ✨+35 (인벤토리 보관), 파티 HP -15%', 'danger');
              this.dungeonEtherFound += 35;
            }
          },
          { label: '3. 통과한다', color: 0x78909c, action: () => this.addLog('광맥을 뒤로하고 탐험을 계속합니다.', 'normal') }
        ]
      },
      {
        id: 'cursed_shrine',
        title: '⛩️ 저주받은 성소',
        desc: '불길한 기운이 감도는 고대 제단이 있습니다.\n봉인된 힘을 깨우시겠습니까?',
        options: [
          {
            label: '1. 제단에 피를 바친다 (에테르 +20, HP -20%)',
            color: 0xab47bc,
            action: () => {
              this.gm.addToDungeonInventory('ether', '에테르', '✨', 20);
              this.gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.8)); });
              this.addLog('피의 계약! ✨+20 (인벤토리 보관). 파티 HP -20%.', 'danger');
              this.dungeonEtherFound += 20;
            }
          },
          {
            label: '2. 신성한 물로 정화 (MP +30 전원 회복)',
            color: 0xc8aa6e,
            action: () => {
              this.gm.party.forEach(h => { h.currentMp = Math.min(h.maxMp, h.currentMp + 30); });
              this.addLog('성소의 성수로 파티 전원 MP +30 회복!', 'reward');
            }
          },
          { label: '3. 위험을 피해 지나친다', color: 0x78909c, action: () => this.addLog('성소를 경계하며 통과합니다.', 'normal') }
        ]
      },
      {
        id: 'lost_merchant',
        title: '🧙 길 잃은 상인',
        desc: '심연에서 살아남은 떠돌이 상인을 만났습니다.\n골드로 귀한 물자를 거래할 수 있습니다.',
        options: [
          {
            label: '1. 회복 물약 구매 (골드 -100, HP 전원 완전 회복)',
            color: 0x38ef7d,
            action: () => {
              if (this.gm.resources.gold >= 100) {
                this.gm.modifyResource('gold', -100);
                this.gm.party.forEach(h => { h.currentHp = h.maxHp; h.currentMp = h.maxMp; });
                this.addLog('회복 물약 구매! 🪙-100. 파티 HP/MP 완전 회복.', 'reward');
              } else {
                this.addLog('골드가 부족합니다!', 'danger');
              }
            }
          },
          {
            label: '2. 에테르 구매 (골드 -200, 에테르 +30)',
            color: 0x5c6bc0,
            action: () => {
              if (this.gm.resources.gold >= 200) {
                this.gm.modifyResource('gold', -200); 
                this.gm.addToDungeonInventory('ether', '에테르', '✨', 30);
                this.addLog('에테르 구매! 🪙-200, ✨+30 (인벤토리 보관).', 'reward');
                this.dungeonEtherFound += 30;
              } else {
                this.addLog('골드가 부족합니다!', 'danger');
              }
            }
          },
          { label: '3. 그냥 지나친다', color: 0x78909c, action: () => this.addLog('상인과 작별하고 탐험을 계속합니다.', 'normal') }
        ]
      },
      {
        id: 'floor_up',
        title: '🚪 고대 석문 발견',
        desc: '다음 층으로 이어지는 고대 석문이 보입니다.\n지금 진입하시겠습니까?',
        options: [
          {
            label: '1. 다음 층으로 진입한다 (위험도 초기화)',
            color: 0x38ef7d,
            action: () => {
              if (this.currentFloor < this.maxFloor) {
                this.currentFloor = Math.min(this.maxFloor, this.currentFloor + 1);
                this.gm.dungeonFloor = this.currentFloor;
                this.dangerLevel = 0;
                this.gm.dungeonDangerLevel = 0; // 위험도 확실히 초기화
                this.gm.isOvercharged = false; // 오버차지 해제
                this.addLog(`★ 심연 ${this.currentFloor}층으로 진입! 위험도 초기화.`, 'story');
                this.updateHeader(); // UI 업데이트
                this.updateFloorCard();
              } else {
                this.addLog('이미 최심부 층입니다.', 'normal');
              }
            }
          },
          {
            label: '2. 현재 층을 더 탐색한다',
            color: 0x78909c,
            action: () => this.addLog('석문을 뒤로하고 현재 층을 계속 탐색합니다.', 'normal')
          }
        ]
      }
    ];

    const event = Phaser.Utils.Array.GetRandom(eventPool);
    this.addLog(`📜 [특별 이벤트] ${event.title} 발생!`, 'story');
    this.showEventCard(event, panelW);
  }

  // ── 이벤트: 함정 ─────────────────────────────────────
  private triggerTrapEvent(): void {
    if (this.gm.party.length === 0) return;
    const trapNames = ['가시 함정', '독침 발사기', '낙석 함정', '폭발 룬 트랩', '맹독 가스 누출'];
    const trap = Phaser.Utils.Array.GetRandom(trapNames);
    
    const floor = this.gm.dungeonFloor || 1;
    const danger = this.gm.dungeonDangerLevel || 0;
    const floorBonus = (floor - 1) * 1.5;
    const dangerBonus = (danger / 100) * 4.0;
    const minPct = Math.min(13.0, 3.0 + floorBonus + dangerBonus);
    const maxPct = 15.0;

    const dmgList: string[] = [];
    this.gm.party.forEach(h => {
      if (h.currentHp > 0) {
        const randPct = minPct + Math.random() * (maxPct - minPct);
        const dmg = Math.max(1, Math.round(h.maxHp * (randPct / 100)));
        h.currentHp = Math.max(1, h.currentHp - dmg);
        dmgList.push(`${h.name} -${dmg}(${(Math.round(randPct * 10) / 10)}%)`);
      }
    });
    
    this.addLog(`⚠️ [함정 발동] ${trap}에 걸려 파티 피해! [${dmgList.join(', ')}]`, 'danger');
    const panelW = this.safeW - 40;
    this.buildPartyStatusBar(panelW);
  }

  // ── 이벤트: 버프 ─────────────────────────────────────
  private triggerBuffEvent(): void {
    if (this.gm.party.length === 0) return;
    const buffNames = ['신비한 샘물', '고대의 축복', '에테르 파동'];
    const buff = Phaser.Utils.Array.GetRandom(buffNames);
    
    let totalHeal = 0;
    this.gm.party.forEach(h => {
      if (h.currentHp > 0) {
        const heal = Math.floor(h.maxHp * 0.2); // 20% 회복
        h.currentHp = Math.min(h.maxHp, h.currentHp + heal);
        totalHeal += heal;
      }
    });
    
    this.addLog(`✨ [버프 발견] ${buff}의 효과로 파티가 총 ${totalHeal}의 체력을 회복했습니다!`, 'reward');
    const panelW = this.safeW - 40;
    this.buildPartyStatusBar(panelW); // HP바 갱신
  }

  // ── 이벤트: 아무 일도 없음 ──────────────────────────────────
  private triggerNothingEvent(): void {
    const descs = [
      '아무 일도 일어나지 않았습니다.',
      '음산한 바람만 스쳐 지나갑니다.',
      '벽에 새겨진 기괴한 문양을 지나칩니다.',
      '멀리서 정체불명의 비명소리가 들립니다.'
    ];
    this.addLog(`💭 ${Phaser.Utils.Array.GetRandom(descs)}`, 'normal');
  }

  // ── 이벤트: 다음 층 포탈 ─────────────────────────────────────
  private triggerPortalEvent(): void {
    this.gm.portalAppeared = false;
    this.activeEventCard = this.add.container(0, 0).setDepth(100);

    const sw = this.scale.width;
    const sh = this.scale.height;
    const zoom = Math.min(1.0, sh / 932);
    const logicalW = sw / zoom;
    const logicalH = sh / zoom;

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x000000, 0.85);
    modalBg.fillRect(0, 0, logicalW, logicalH);
    modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, logicalW, logicalH), Phaser.Geom.Rectangle.Contains);
    this.activeEventCard.add(modalBg);

    const w = this.safeW;
    const h = 932;
    const cardW = 310;
    const cardH = 270;
    const card = this.add.graphics();
    card.fillStyle(0x180f24, 1);
    card.fillRoundedRect(w / 2 - cardW / 2, h / 2 - cardH / 2, cardW, cardH, 16);
    card.lineStyle(2, 0xa742f5, 1);
    card.strokeRoundedRect(w / 2 - cardW / 2, h / 2 - cardH / 2, cardW, cardH, 16);
    this.activeEventCard.add(card);

    const title = this.add.text(w / 2, h / 2 - 100, '🌀 차원 포탈 & 심연 오버차지', {
      fontFamily: 'Noto Sans KR', fontSize: '15px', color: '#e0b0ff', fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const desc = this.add.text(w / 2, h / 2 - 68, '보스를 물리치고 차원 포탈을 확보했습니다.\n다음 여정을 선택하세요.', {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#cfd8dc', align: 'center', lineSpacing: 3
    }).setOrigin(0.5);
    
    this.activeEventCard.add([title, desc]);

    // 1. 다음 층 이동
    const enterBtn = this.createSmallActionButton(w / 2 - 140, h / 2 - 35, 280, 36, '🌀 다음 층으로 이동 (안전 진행)', 0xa742f5, () => {
      if (this.activeEventCard) {
        this.activeEventCard.destroy();
        this.activeEventCard = null;
      }
      this.gm.dungeonFloor += 1;
      this.gm.unlockedDungeonFloor = Math.max(this.gm.unlockedDungeonFloor, this.gm.dungeonFloor);
      this.gm.dungeonDangerLevel = 0; // 다음 층 진입 시 위험도 리셋
      this.gm.isOvercharged = false;  // 오버차지 해제
      this.addLog(`포탈을 통해 심연 ${this.gm.dungeonFloor}층으로 진입합니다!`, 'story');
      this.scene.restart();
    });

    // 2. 오버차지: 광폭화 보스 결전
    const overchargeBtn = this.createSmallActionButton(w / 2 - 140, h / 2 + 10, 280, 44, '⚡ 오버차지: 광폭화 보스 도전!\n(EXP+30% / 전리품+50% / 철수불가)', 0xff416c, () => {
      if (this.activeEventCard) {
        this.activeEventCard.destroy();
        this.activeEventCard = null;
      }
      this.gm.isOvercharged = true;
      const isBossFloor = (this.currentFloor === 5 || this.currentFloor === 10);
      const bossKey = FLOOR_BOSS_MAP[this.currentFloor] || 'boss_floor_1';
      const bossData = JSON.parse(JSON.stringify(MONSTERS[bossKey]));
      bossData.type = 'boss';
      this.gm.currentMonsters = [bossData];
      this.addLog('⚡ [심연 오버차지] 심연의 마력이 증폭되며 광폭화된 보스가 소환되었습니다! (철수 불가)', 'danger');
      this.scene.start('BattleScene');
    });

    // 3. 성채 귀환
    const returnBtn = this.createSmallActionButton(w / 2 - 140, h / 2 + 65, 280, 36, '🏰 성채로 안전 귀환 (전리품 정산)', 0x4caf50, () => {
      if (this.activeEventCard) {
        this.activeEventCard.destroy();
        this.activeEventCard = null;
      }
      this.returnToCitadel();
    });

    this.activeEventCard.add([enterBtn, overchargeBtn, returnBtn]);
  }

  // ── 보스 강제 출현 ──────────────────────────────────────────
  private triggerBossEvent(): void {
    this.addLog('💀 [위험도 100%] 심연의 위기가 극한에 달했습니다! 강력한 적이 출현합니다!', 'danger');

    const panelW = this.safeW - 64;
    const eventCard = this.add.container(20, 515 + 6);
    this.activeEventCard = eventCard;

    const bg = this.add.graphics();
    bg.fillStyle(0x200812, 1);
    bg.fillRoundedRect(0, 0, panelW, 148, 10);
    bg.lineStyle(2.5, 0xff416c, 1);
    bg.strokeRoundedRect(0, 0, panelW, 148, 10);

    const isBossFloor = (this.currentFloor === 5 || this.currentFloor === 10);
    const bossData = MONSTERS[FLOOR_BOSS_MAP[this.currentFloor] || 'boss_floor_1'];
    const bossName = bossData ? bossData.name : `[${this.currentFloor}층 보스]`;
    const bossKey = FLOOR_BOSS_MAP[this.currentFloor] || 'boss_floor_1';

    const title = this.add.text(panelW / 2, 22, `👑 ${bossName} 출현!`, {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#ff416c', fontStyle: 'bold'
    }).setOrigin(0.5);

    const fightBtn = this.createSmallActionButton(8, 50, panelW / 2 - 12, 38,
      '⚔️ 즉시 결전 돌입!', 0xff416c,
      () => {
        const bossData = JSON.parse(JSON.stringify(MONSTERS[bossKey]));
        bossData.type = 'boss'; // 강제로 보스 타입 지정 (BattleScene에서 승리 시 오버차지/포탈 판정용)
        this.gm.currentMonsters = [bossData];
        this.scene.start('BattleScene');
      }
    );

    const retreatBtn = this.createSmallActionButton(panelW / 2 + 4, 50, panelW / 2 - 12, 38,
      '🏃 위험 감수하며 퇴각\n(파티 HP -25%)', 0x78909c,
      () => {
        this.gm.party.forEach(h => { h.currentHp = Math.max(1, Math.floor(h.currentHp * 0.75)); });
        this.dangerLevel = 50;
        this.addLog('아슬아슬하게 퇴각했습니다. 파티 HP -25%, 위험도 50%로 재설정.', 'danger');
        eventCard.destroy();
        this.activeEventCard = null;
        this.bottomPanel.setVisible(true);
        this.updateHeader();
        this.buildPartyStatusBar(panelW);
      }
    );

    const campBtn = this.createSmallActionButton(8, 98, panelW - 16, 38,
      '⛺ 결전 전 야영 (HP/MP 완전 회복) → 즉시 결전',
      0xab47bc,
      () => {
        this.gm.party.forEach(h => { h.currentHp = h.maxHp; h.currentMp = h.maxMp; });
        this.addLog('✨ 운명적 회복! 파티 전원 HP/MP 전면 회복!', 'reward');
        const bossData = JSON.parse(JSON.stringify(MONSTERS[bossKey]));
        bossData.type = 'boss'; // 강제로 보스 타입 지정
        this.gm.currentMonsters = [bossData];
        this.scene.start('BattleScene');
      }
    );

    eventCard.add([bg, title, fightBtn, retreatBtn, campBtn]);
    this.add.existing(eventCard);
    this.bottomPanel.setVisible(false);
  }

  // ═══════════════════════════════════════════════════════════
  // 특별 이벤트 카드 표시 (하단 패널 위치에 오버레이)
  // ═══════════════════════════════════════════════════════════
  private showEventCard(event: SpecialEvent, panelW: number): void {
    const cardH = 80 + event.options.length * 52 + 10;
    const eventCard = this.add.container(20, 500);
    eventCard.setDepth(50);
    this.activeEventCard = eventCard;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1030, 1);
    bg.fillRoundedRect(0, 0, panelW, cardH, 12);
    bg.lineStyle(2, 0xab47bc, 0.9);
    bg.strokeRoundedRect(0, 0, panelW, cardH, 12);

    const title = this.add.text(panelW / 2, 20, event.title, {
      fontFamily: 'Noto Sans KR', fontSize: '13px', color: '#ffd54f', fontStyle: 'bold'
    }).setOrigin(0.5);

    const desc = this.add.text(panelW / 2, 38, event.desc, {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#b0bec5',
      align: 'center', wordWrap: { width: panelW - 28 }
    }).setOrigin(0.5, 0);

    eventCard.add([bg, title, desc]);

    const optY = 76;
    event.options.forEach((opt, i) => {
      const optAction = opt.action; // 클로저 캡처 시점 고정
      const btn = this.createSmallActionButton(
        8, optY + i * 52, panelW - 16, 44,
        opt.label, opt.color,
        () => {
          optAction();
          eventCard.destroy();
          this.activeEventCard = null;
          this.bottomPanel.setVisible(true);
          this.updateHeader();
          const pw = this.safeW - 64;
          this.buildPartyStatusBar(pw);
        }
      );
      eventCard.add(btn);
    });

    this.add.existing(eventCard);
    this.bottomPanel.setVisible(false);
  }

  // ── 횃불 토글 ──────────────────────────────────────────────
  private toggleTorch(): void {
    this.isTorchLit = !this.isTorchLit;
    const panelW = this.safeW - 40;

    // 토치 버튼 레이블 갱신
    const lblEl = this.torchBtn.getAt(1) as Phaser.GameObjects.Text;
    if (lblEl) {
      lblEl.setText(this.isTorchLit ? '🕯️ 횃불 끄기' : '🔥 횃불 켜기\n(조우↓ 파밍↑ 위험도+30%)');
    }
    const bgEl = this.torchBtn.getAt(0) as Phaser.GameObjects.Graphics;
    if (bgEl) {
      bgEl.clear();
      const bW = (panelW - 18) / 2;
      bgEl.fillStyle(0x1a2130, 1);
      bgEl.fillRoundedRect(0, 0, bW, 50, 8);
      bgEl.lineStyle(1.5, this.isTorchLit ? 0x78909c : 0xff7b25, 0.9);
      bgEl.strokeRoundedRect(0, 0, bW, 50, 8);
    }

    if (this.isTorchLit) {
      this.addLog('🔥 횃불을 켰습니다. 시야 확보 — 몬스터 조우↓, 파밍↑, 탐색당 위험도+30%.', 'story');
    } else {
      this.addLog('🕯️ 횃불을 껐습니다. 어둠 속에 잠깁니다.', 'normal');
    }
    this.updateHeader();
  }

  // ═══════════════════════════════════════════════════════════
  // 귀환
  // ═══════════════════════════════════════════════════════════
  private returnToCitadel(): void {
    // 성공 귀환: 던전 인벤토리를 전역 자원으로 정산
    let returnLog = '✨ 교역 성공! ';
    let itemsCount = 0;
    this.gm.dungeonInventory.forEach(item => {
      if (item.key === 'torch' || item.key === 'food') {
        // 소모품은 전역 자원으로 반환 안 함
        return;
      }
      if (item.qty > 0) {
        this.gm.modifyResource(item.key as Parameters<typeof this.gm.modifyResource>[0], item.qty);
        returnLog += `${item.icon}+${item.qty} `;
        itemsCount++;
      }
    });

    if (itemsCount === 0) returnLog += '전리품 없음';

    this.addLog(
      `성채로 귀환. (${returnLog}) | 탐색 ${this.totalExploreSteps}회`,
      'story'
    );

    // 귀환 완료 후 인벤토리 비우기
    this.gm.dungeonInventory = [];
    this.gm.saveGame();
    this.scene.start('CitadelScene');
  }

  // ═══════════════════════════════════════════════════════════
  // 버튼 생성 헬퍼
  // ═══════════════════════════════════════════════════════════
  private createLargeActionButton(
    x: number, y: number, w: number, h: number,
    text: string, color: number, callback: () => void
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a2130, 1);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1.5, color, 0.9);
    bg.strokeRoundedRect(0, 0, w, h, 8);

    const lbl = this.add.text(w / 2, h / 2, text, {
      fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#ffffff',
      fontStyle: 'bold', align: 'center', lineSpacing: 2
    }).setOrigin(0.5);

    btn.add([bg, lbl]);
    btn.setSize(w, h);
    btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    btn.input!.cursor = 'pointer';

    btn.on('pointerdown', () => {
      bg.clear();
      bg.fillStyle(color, 0.35);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.lineStyle(2, color, 1);
      bg.strokeRoundedRect(0, 0, w, h, 8);
      callback();
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a2130, 1);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.lineStyle(1.5, color, 0.9);
      bg.strokeRoundedRect(0, 0, w, h, 8);
    });
    btn.on('pointerup', () => {
      bg.clear();
      bg.fillStyle(0x1a2130, 1);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.lineStyle(1.5, color, 0.9);
      bg.strokeRoundedRect(0, 0, w, h, 8);
    });
    return btn;
  }

  private createSmallActionButton(
    x: number, y: number, w: number, h: number,
    text: string, color: number, callback: () => void
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x141b28, 1);
    bg.fillRoundedRect(0, 0, w, h, 6);
    bg.lineStyle(1.5, color, 0.8);
    bg.strokeRoundedRect(0, 0, w, h, 6);

    const lbl = this.add.text(w / 2, h / 2, text, {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#e0e0e0',
      fontStyle: 'bold', align: 'center', lineSpacing: 2,
      wordWrap: { width: w - 16 }
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
