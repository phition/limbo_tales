// @ts-nocheck  
import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { CHARACTER_CLASSES } from '../data/classes';
import { Mercenary, Skill, MonsterData, MonsterState, StatusEffect, StatusEffectType, STATUS_EFFECT_META } from '../types/game';

// ─── 전투 참여자 턴 순서 엔트리 ──────────────────────────────────────────────
interface TurnEntry {
  type: 'hero' | 'monster';
  heroId?: string;
  monsterId?: string;
}

export class BattleScene extends Phaser.Scene {
  private gm!: GameManager;
  private monsters: MonsterState[] = [];

  // SPD 기반 턴 순서 테이블
  private turnQueue: TurnEntry[] = [];
  private turnQueueIndex: number = 0;
  private roundCount: number = 0;

  private isAutoBattle: boolean = false;
  private battleEnded: boolean = false;
  private isProcessingTurn: boolean = false;

  // ── 로그 ───────────────────────────────────────────────
  private logContainer!: Phaser.GameObjects.Container;
  private logLines: Phaser.GameObjects.Text[] = [];
  private LOG_MAX = 3;

  // UI
  private enemyHpBarGfxs: Phaser.GameObjects.Graphics[] = [];
  private enemyHpTexts: Phaser.GameObjects.Text[] = [];
  private enemyStatusLabels: Phaser.GameObjects.Text[] = [];
  private battleInteractiveArea!: Phaser.GameObjects.Container;

  private bgContainer!: Phaser.GameObjects.Container;
  private uiContainer!: Phaser.GameObjects.Container;
  private resizeTimer?: number;
  private safeW: number = 430;
  private safeX: number = 0;
  private safeY: number = 0;
  
  private headerContainer?: Phaser.GameObjects.Container;
  private cardContainer?: Phaser.GameObjects.Container;
  private actionContainer?: Phaser.GameObjects.Container;

  constructor() { super('BattleScene'); }

  create(): void {
    this.gm = GameManager.getInstance();
    this.gm.currentSceneContext = 'battle';
    this.monsters = this.gm.currentMonsters.map((md, idx) => {
      const isOvc = this.gm.isOvercharged;
      const mult = isOvc ? 1.3 : 1.0;
      const modName = isOvc ? `[광폭화] ${md.name}` : md.name;
      return {
        id: `mon_${idx}_${Date.now()}`,
        data: { ...md, name: modName },
        maxHp: Math.floor(md.maxHp * mult),
        currentHp: Math.floor(md.maxHp * mult),
        atk: Math.floor(md.atk * mult),
        def: Math.floor(md.def * mult),
        spd: Math.floor(md.spd * mult),
        status: { bleedTurns: 0, bleedMag: 0, stunTurns: 0, defDebuffTurns: 0, defDebuffMag: 0, shieldAmount: 0 },
        isEnraged: isOvc
      };
    });

    this.battleEnded  = false;
    this.isProcessingTurn = false;
    this.isAutoBattle = false;
    this.roundCount   = 0;
    this.turnQueue    = [];
    this.turnQueueIndex = 0;
    this.logLines     = [];

    // 파티원 상태이상 초기화 (이전 전투 잔여 제거)
    this.gm.party.forEach(h => { h.statusEffects = []; });

    // SPD 기반 턴 순서 생성
    this.buildTurnQueue();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.battleEnded = true;
      this.isAutoBattle = false;
      if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
      this.time.removeAllEvents();
    });

    this.bgContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);
    this.scale.on('resize', this.onResize, this);

    this.rebuildUI();

    const synergies = this.gm.getActiveSynergies();
    const synNames = synergies.map(s => s.name).join(', ');
    const mNames = this.monsters.map(m => m.data.name).join(', ');
    this.addLog(`[전투 개시] ${mNames}! (시너지: ${synNames || '없음'}) ↑SPD순 턴 시작`, 'danger');
    if (this.gm.isOvercharged) {
      this.addLog('💀⚡ [심연 오버차지] 광폭화 결계 발동! 결전 중 철수할 수 없습니다! (EXP +30%, 전리품 +50%)', 'danger');
    }

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
    

    if (this.cameras.main) {
        this.cameras.main.setOrigin(0, 0);
    this.cameras.main.setZoom(zoom);
        this.cameras.main.setScroll(0, 0);
    }

    this.createBackground(logicalW, logicalH, 0, 0);
    this.uiContainer.setPosition(safeX, safeY);
    
    this.createHeader(safeW);
    if (this.headerContainer) this.uiContainer.add(this.headerContainer);

    this.createMediumCardFrame(safeW);
    if (this.cardContainer) this.uiContainer.add(this.cardContainer);

    this.createLogPanel(safeW);
    if (this.logContainer) this.uiContainer.add(this.logContainer);

    this.createExpandedActionPanel(safeW);
    if (this.actionContainer) this.uiContainer.add(this.actionContainer);
    
    this.updateEnemyHpBar(safeW - 40);
    this.renderBattleInterface();
  }

  private createBackground(w: number, h: number, x: number = 0, y: number = 0): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0d18, 0x1a0d18, 0x0c0812, 0x0c0812, 1);
    bg.fillRect(x, y, w, h);
    this.bgContainer.add(bg);
  }

  // ═══════════════════════════════════════════════════════════
  // SPD 기반 턴 큐 생성
  // ═══════════════════════════════════════════════════════════
  private buildTurnQueue(): void {
    // 1라운드 분량의 행동 순서 결정 (hero SPD vs monster SPD 비교)
    interface SpdEntry { spd: number; entry: TurnEntry; }
    const entries: SpdEntry[] = [];

    this.gm.party.filter(h => h.currentHp > 0).forEach(hero => {
      const totalSpd = hero.stats.spd + (hero.equipment.armor?.stats.spd ?? 0);
      entries.push({ spd: totalSpd, entry: { type: 'hero', heroId: hero.id } });
    });
    this.monsters.filter(m => m.currentHp > 0).forEach(m => {
      entries.push({ spd: m.spd, entry: { type: 'monster', monsterId: m.id } });
    });

    // SPD 내림차순 정렬 (동점이면 hero 우선)
    entries.sort((a, b) => b.spd - a.spd);
    this.turnQueue = entries.map(e => e.entry);
    this.turnQueueIndex = 0;
    this.roundCount += 1;
  }

  private getCurrentTurnEntry(): TurnEntry {
    if (this.turnQueueIndex >= this.turnQueue.length) {
      this.buildTurnQueue();
    }
    return this.turnQueue[this.turnQueueIndex];
  }

  private advanceTurn(): void {
    if (this.battleEnded) return;   // ← 전투 종료 후 호출 차단
    this.turnQueueIndex += 1;
    if (this.turnQueueIndex >= this.turnQueue.length) {
      this.buildTurnQueue();
    }
    // 사망한 영웅이 현재 턴이면 스킵
    const entry = this.getCurrentTurnEntry();
    if (entry.type === 'hero') {
      const hero = this.gm.party.find(h => h.id === entry.heroId);
      if (!hero || hero.currentHp <= 0) {
        this.turnQueueIndex += 1;
        if (this.turnQueueIndex >= this.turnQueue.length) this.buildTurnQueue();
      }
    } else if (entry.type === 'monster') {
      const mon = this.monsters.find(m => m.id === entry.monsterId);
      if (!mon || mon.currentHp <= 0) {
        this.turnQueueIndex += 1;
        if (this.turnQueueIndex >= this.turnQueue.length) this.buildTurnQueue();
      }
    }
    if (this.battleEnded) return;   // 상태이상 틱 처리 중 전멸할 수 있으므로 재확인
    this.renderBattleInterface();
  }

  // ═══════════════════════════════════════════════════════════
  // Header
  // ═══════════════════════════════════════════════════════════
  private createHeader(w: number): void {
    this.headerContainer = this.add.container(0, 0);

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0e111a, 0.95);
    headerBg.fillRect(0, 0, w, 50);
    headerBg.lineStyle(1, 0xef5350, 0.8);
    headerBg.lineBetween(0, 50, w, 50);
    this.headerContainer.add(headerBg);

    const firstMon = this.monsters[0]?.data;
    const headerTitle = this.monsters.length > 1 
      ? `⚔️ 결전: ${firstMon.name} (Lv.${firstMon.level}) 외 ${this.monsters.length - 1}체`
      : `⚔️ 결전: ${firstMon.name} (Lv.${firstMon.level})`;

    const titleText = this.add.text(15, 14, headerTitle, {
      fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#ff8a80', fontStyle: 'bold'
    });
    this.headerContainer.add(titleText);

    const autoBtn = this.add.container(w - 75, 10);
    const aBg = this.add.graphics();
    aBg.fillStyle(0x37474f, 0.9);
    aBg.fillRoundedRect(0, 0, 65, 30, 6);
    aBg.lineStyle(1, 0xc8aa6e, 1);
    aBg.strokeRoundedRect(0, 0, 65, 30, 6);
    const aLbl = this.add.text(32, 15, 'AUTO: OFF', {
      fontFamily: 'Noto Sans KR', fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5);
    autoBtn.add([aBg, aLbl]);
    autoBtn.setSize(65, 30);
    autoBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 65, 30), Phaser.Geom.Rectangle.Contains);
    autoBtn.input!.cursor = 'pointer';
    autoBtn.on('pointerdown', () => {
      this.isAutoBattle = !this.isAutoBattle;
      aLbl.setText(this.isAutoBattle ? 'AUTO: ON' : 'AUTO: OFF');
      aBg.clear();
      aBg.fillStyle(this.isAutoBattle ? 0xc8aa6e : 0x37474f, 0.9);
      aBg.fillRoundedRect(0, 0, 65, 30, 6);
      if (this.isAutoBattle && !this.battleEnded) this.runAutoTurn();
    });
    this.headerContainer.add(autoBtn);
  }

  // ═══════════════════════════════════════════════════════════
  // 상단 카드 — 적 비주얼 + HP 바
  // ═══════════════════════════════════════════════════════════
  private createMediumCardFrame(w: number): void {
    const cardW = w - 40;
    const cardH = 280;
    this.cardContainer = this.add.container(20, 55);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a121d, 0.96);
    bg.fillRoundedRect(0, 0, cardW, cardH, 16);
    
    // 첫번째 몬스터의 테마색 또는 기본색 사용
    const themeColor = this.monsters[0]?.data.themeColor ?? 0xff8a80;
    bg.lineStyle(2, themeColor, 0.9);
    bg.strokeRoundedRect(0, 0, cardW, cardH, 16);
    this.cardContainer.add(bg);

    this.enemyHpBarGfxs = [];
    this.enemyHpTexts = [];
    this.enemyStatusLabels = [];

    const slotH = 260 / this.monsters.length;

    this.monsters.forEach((mon, idx) => {
      const yBase = 10 + idx * slotH;

      let posText = '';
      if (this.monsters.length > 1) {
        if (idx === 0) posText = '[전열] ';
        else if (idx === 1) posText = '[중열] ';
        else if (idx === 2) posText = '[후열] ';
      }

      const monTitle = this.add.text(cardW / 2, yBase + 10, `${posText}${mon.data.name}`, {
        fontFamily: 'Cinzel', fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.cardContainer!.add(monTitle);

      if (this.monsters.length === 1) {
        const monDesc = this.add.text(cardW / 2, yBase + 30, mon.data.description, {
          fontFamily: 'Noto Sans KR', fontSize: '10.5px', color: '#b0bec5',
          align: 'center', wordWrap: { width: cardW - 32 }, lineSpacing: 2
        }).setOrigin(0.5, 0);
        this.cardContainer!.add(monDesc);
        
        // 1마리일 경우 스킬 목록도 표시
        const skillsText = mon.data.skills.map(s => `• ${s.name}: ${s.description}`).join('\n');
        const skLbl = this.add.text(20, yBase + 120, skillsText, {
          fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#78909c',
          wordWrap: { width: cardW - 40 }, lineSpacing: 2
        });
        this.cardContainer!.add(skLbl);
      }

      // 적 HP 바 배경
      const barY = this.monsters.length === 1 ? yBase + 95 : yBase + 30;
      const hpBarBg = this.add.graphics();
      hpBarBg.fillStyle(0x3b0a0a, 1);
      hpBarBg.fillRoundedRect(20, barY, cardW - 40, 16, 6);
      this.cardContainer!.add(hpBarBg);

      const hpFillGfx = this.add.graphics();
      this.enemyHpBarGfxs.push(hpFillGfx);
      this.cardContainer!.add(hpFillGfx);

      const hpText = this.add.text(cardW / 2, barY + 8, '', {
        fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.enemyHpTexts.push(hpText);
      this.cardContainer!.add(hpText);

      // 몬스터 상태이상 표시 줄
      const statusLabel = this.add.text(cardW / 2, barY + 24, '', {
        fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#546e7a'
      }).setOrigin(0.5);
      this.enemyStatusLabels.push(statusLabel);
      this.cardContainer!.add(statusLabel);
    });

    this.updateEnemyHpBar(cardW);
  }

  private updateEnemyHpBar(cardW?: number): void {
    const cw = cardW ?? (this.safeW - 40);
    const slotH = 260 / this.monsters.length;

    this.monsters.forEach((mon, idx) => {
      const yBase = 10 + idx * slotH;
      const barY = this.monsters.length === 1 ? yBase + 95 : yBase + 30;

      const ratio = Math.max(0, mon.currentHp / mon.maxHp);
      const barW = Math.floor((cw - 40) * ratio);
      const barColor = ratio > 0.5 ? 0x38ef7d : ratio > 0.25 ? 0xffd54f : 0xff416c;

      const gfx = this.enemyHpBarGfxs[idx];
      gfx.clear();
      if (barW > 0) {
        gfx.fillStyle(barColor, 1);
        gfx.fillRoundedRect(20, barY, barW, 16, 6);
      }
      this.enemyHpTexts[idx].setText(`HP ${mon.currentHp} / ${mon.maxHp}${mon.isEnraged ? ' 🔥' : ''}`);
      
      const st = mon.status;
      const statusArr: string[] = [];
      if (st.bleedTurns > 0) statusArr.push(`🩸출혈(${st.bleedTurns}T)`);
      if (st.stunTurns > 0) statusArr.push(`💫기절(${st.stunTurns}T)`);
      if (st.defDebuffTurns > 0) statusArr.push(`⬇️약화(${st.defDebuffTurns}T)`);
      if (st.shieldAmount > 0) statusArr.push(`🛡️보호막(${st.shieldAmount})`);
      
      this.enemyStatusLabels[idx].setText(statusArr.length > 0 ? `상태이상: ${statusArr.join(' ')}` : '');
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 로그 패널 (Y:345)
  // ═══════════════════════════════════════════════════════════
  private createLogPanel(w: number): void {
    const panelW = w - 40;
    const panelH = 75;
    const panelY = 345;
    this.logContainer = this.add.container(20, panelY);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1018, 0.97);
    bg.fillRoundedRect(0, 0, panelW, panelH, 8);
    bg.lineStyle(1.5, 0x2a3350, 0.9);
    bg.strokeRoundedRect(0, 0, panelW, panelH, 8);
    this.logContainer.add(bg);

    this.logLines = [];
    for (let i = 0; i < this.LOG_MAX; i++) {
      const lt = this.add.text(14, 10 + i * 20, '-', {
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

  private addLog(msg: string, type: 'danger'|'reward'|'story'|'normal'|'system' = 'normal'): void {
    this.gm.addLog(msg, type);
    if (this.logContainer) this.refreshLogPanel();
  }

  // ═══════════════════════════════════════════════════════════
  // 하단 액션 패널
  // ═══════════════════════════════════════════════════════════
  private createExpandedActionPanel(w: number): void {
    const drawerY = 430; // 로그 패널 아래
    const drawerW = w - 40;
    const drawerH = 460;
    this.actionContainer = this.add.container(20, drawerY);

    const bg = this.add.graphics();
    bg.fillStyle(0x100a14, 0.99);
    bg.fillRoundedRect(0, 0, drawerW, drawerH, 16);
    bg.lineStyle(2, 0x8b1c1c, 0.85);
    bg.strokeRoundedRect(0, 0, drawerW, drawerH, 16);
    this.actionContainer.add(bg);

    const headerGfx = this.add.graphics();
    headerGfx.fillStyle(0x1a0e1c, 1);
    headerGfx.fillRoundedRect(4, 4, drawerW - 8, 44, { tl: 14, tr: 14, bl: 0, br: 0 });
    headerGfx.lineStyle(1, 0x3d2530, 1);
    headerGfx.lineBetween(4, 48, drawerW - 4, 48);
    this.actionContainer.add(headerGfx);

    const title = this.add.text(18, 24, '⚔️ 3인 진형 전술 전투', {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#ff8a80', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.actionContainer.add(title);

    const isOvc = this.gm.isOvercharged;
    const closeBtn = this.add.container(drawerW - 105, 10);
    const cBg = this.add.graphics();
    cBg.fillStyle(isOvc ? 0x4a0e17 : 0x37474f, 0.9);
    cBg.fillRoundedRect(0, 0, 90, 28, 14);
    cBg.lineStyle(1.5, isOvc ? 0xff416c : 0x78909c, 1);
    cBg.strokeRoundedRect(0, 0, 90, 28, 14);
    const cLbl = this.add.text(45, 14, isOvc ? '🔒 후퇴 불가' : '✕ 전장 후퇴', {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: isOvc ? '#ff8a80' : '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    closeBtn.add([cBg, cLbl]);
    closeBtn.setSize(90, 28);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      if (this.gm.isOvercharged) {
        this.addLog('⚠️ 광폭화된 심연의 결계가 퇴로를 막아 후퇴할 수 없습니다!', 'danger');
        return;
      }
      this.addLog('전투에서 후퇴하여 성채로 퇴각합니다.', 'normal');
      this.scene.start('CitadelScene');
    });
    this.actionContainer.add(closeBtn);

    this.battleInteractiveArea = this.add.container(12, 54);
    this.actionContainer.add(this.battleInteractiveArea);
  }

  // ═══════════════════════════════════════════════════════════
  // 전투 인터페이스 렌더링 (파티 상태 + 현재 턴 커맨드)
  // ═══════════════════════════════════════════════════════════
  private renderBattleInterface(): void {
    if (this.battleEnded) return;
    this.battleInteractiveArea.removeAll(true);
    
    const safeW = this.safeW;
    const w = safeW - 64;

    const currentEntry = this.getCurrentTurnEntry();
    const currentHero = currentEntry.type === 'hero'
      ? this.gm.party.find(h => h.id === currentEntry.heroId)
      : null;

    // ── 1) 3인 파티 상태 카드 ──────────────────────────────
    const partyBox = this.add.container(0, 0);
    const pBg = this.add.graphics();
    pBg.fillStyle(0x161b26, 1);
    pBg.fillRoundedRect(0, 0, w, 110, 8);
    pBg.lineStyle(1.5, 0x2e384d, 1);
    pBg.strokeRoundedRect(0, 0, w, 110, 8);
    partyBox.add(pBg);

    const pTitle = this.add.text(14, 6, `🛡️ 원정대 현황  [Round ${this.roundCount}]`, {
      fontFamily: 'Noto Sans KR', fontSize: '10.5px', color: '#c8aa6e', fontStyle: 'bold'
    });
    partyBox.add(pTitle);

    this.gm.party.forEach((hero, idx) => {
      const isTurn = currentHero?.id === hero.id;
      const posTag = hero.position === 'front' ? '[전]' : hero.position === 'mid' ? '[중]' : '[후]';
      const yBase = 22 + idx * 28;

      // HP/MP 바
      const hpRatio = hero.currentHp / hero.maxHp;
      const hpColor = hpRatio > 0.5 ? 0x38ef7d : hpRatio > 0.25 ? 0xffd54f : 0xff416c;

      const barBg = this.add.graphics();
      barBg.fillStyle(0x1a2133, 1);
      barBg.fillRoundedRect(14, yBase + 14, w - 28, 6, 3);
      const hpFill = this.add.graphics();
      hpFill.fillStyle(hpColor, 1);
      hpFill.fillRoundedRect(14, yBase + 14, Math.max(2, Math.floor((w - 28) * hpRatio)), 6, 3);
      partyBox.add([barBg, hpFill]);

      // 상태이상 아이콘 문자열
      const statusIcons = (hero.statusEffects ?? [])
        .map(se => `${STATUS_EFFECT_META[se.type]?.icon ?? '?'}×${se.turnsLeft}`)
        .join(' ');

      const hText = this.add.text(14, yBase,
        `${isTurn ? '▶ ' : '  '}${posTag} ${hero.name} Lv.${hero.level}  HP ${hero.currentHp}/${hero.maxHp}  MP ${hero.currentMp}/${hero.maxMp}` +
        (statusIcons ? `  ${statusIcons}` : ''), {
        fontFamily: 'Noto Sans KR', fontSize: '9.5px',
        color: hero.currentHp <= 0 ? '#ff416c' : (isTurn ? '#ffd54f' : '#cfd8dc'),
        fontStyle: isTurn ? 'bold' : 'normal'
      });
      partyBox.add(hText);
    });

    this.battleInteractiveArea.add(partyBox);

    // 적 순서이면 자동 처리
    if (currentEntry.type === 'monster') {
      const mon = this.monsters.find(m => m.id === currentEntry.monsterId);
      const monName = mon ? mon.data.name : '알 수 없는 적';
      const waitLbl = this.add.text(w / 2, 130, `⚠️ [${monName}]의 행동 차례...`, {
        fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#ff8a80', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.battleInteractiveArea.add(waitLbl);

      if (!this.isProcessingTurn && !this.battleEnded) {
        this.isProcessingTurn = true;
        this.time.delayedCall(800, () => {
          this.isProcessingTurn = false;
          if (mon) this.enemyTurn(mon);
        });
      }
      return;
    }

    if (!currentHero || currentHero.currentHp <= 0) {
      this.advanceTurn(); return;
    }

    const heroClass = CHARACTER_CLASSES[currentHero.classId];

    // 영웅 직업 스킬 + 무기 접두사 인챈트로 획득한 고유 스킬 목록 병합
    const allSkills = [...heroClass.skills];
    const weaponSkill = currentHero.equipment?.weapon?.prefix?.grantedSkill;
    if (weaponSkill) allSkills.push(weaponSkill);

    const rows = Math.ceil(allSkills.length / 2);
    const cmdBoxHeight = 72 + rows * 44 + 36 + 10;

    // ── 2) 현재 턴 용병 커맨드 패널 ────────────────────────
    const cmdBox = this.add.container(0, 116);
    const cBg = this.add.graphics();
    cBg.fillStyle(0x181e2b, 1);
    cBg.fillRoundedRect(0, 0, w, cmdBoxHeight, 8);
    cBg.lineStyle(1.5, heroClass.themeColor, 0.9);
    cBg.strokeRoundedRect(0, 0, w, cmdBoxHeight, 8);
    cmdBox.add(cBg);

    const cmdHeader = this.add.text(12, 6,
      `👑 ${currentHero.name} (${heroClass.name} Lv.${currentHero.level})  EXP ${currentHero.exp}/${currentHero.expToNext}`, {
      fontFamily: 'Noto Sans KR', fontSize: '10.5px', color: '#ffffff', fontStyle: 'bold'
    });
    cmdBox.add(cmdHeader);

    // 현재 용병의 상태이상 상세 표시
    if ((currentHero.statusEffects ?? []).length > 0) {
      const stLine = (currentHero.statusEffects ?? [])
        .map(se => `${STATUS_EFFECT_META[se.type]?.icon} ${STATUS_EFFECT_META[se.type]?.label}(${se.turnsLeft}턴)`)
        .join('  ');
      const stText = this.add.text(12, 18, `状 ${stLine}`, {
        fontFamily: 'Noto Sans KR', fontSize: '9px', color: '#ff7043'
      });
      cmdBox.add(stText);
    }

    // 기절 상태면 행동 불가
    const isStunned = (currentHero.statusEffects ?? []).some(se => se.type === 'stun');
    if (isStunned) {
      const stunMsg = this.add.text(w / 2, 120, `💫 [기절] ${currentHero.name}이(가) 행동할 수 없습니다!`, {
        fontFamily: 'Noto Sans KR', fontSize: '12px', color: '#ffd54f', fontStyle: 'bold'
      }).setOrigin(0.5);
      cmdBox.add(stunMsg);

      const skipBtn = this.createActionButton(12, 150, w - 24, 38, '💫 기절 → 턴 넘기기', 0xffd54f, () => {
        this.processHeroStatusEffects(currentHero);
        this.addLog(`💫 [기절] ${currentHero.name}이(가) 기절로 행동 불능! 턴 소비.`, 'danger');
        this.advanceTurn();
      });
      cmdBox.add(skipBtn);
      this.battleInteractiveArea.add(cmdBox);
      return;
    }

    // 특수 스킬 버튼
    const specBtn = this.createSkillButton(8, 24, w - 16, 42, heroClass.specialSkill, () => {
      this.executeSkill(currentHero, heroClass.specialSkill);
    }, true);
    cmdBox.add(specBtn);

    // 일반 및 인챈트 스킬 버튼들 (2열 배치)
    const colWidth = Math.floor((w - 16 - 6) / 2);
    allSkills.forEach((skill, idx) => {
      const isEnchantSkill = !!skill.id.startsWith('skill_enc_');
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPos = 8 + col * (colWidth + 6);
      const yPos = 70 + row * 44;
      const btn = this.createSkillButton(xPos, yPos, colWidth, 40, skill, () => {
        this.executeSkill(currentHero, skill);
      }, isEnchantSkill);
      cmdBox.add(btn);
    });

    // 기본 공격
    const basicAtkBtn = this.createActionButton(8, 70 + rows * 44, w - 16, 36,
      '⚔️ 기본 물리 공격', 0x4a90e2, () => this.executeBasicAttack(currentHero)
    );
    cmdBox.add(basicAtkBtn);

    this.battleInteractiveArea.add(cmdBox);

    if (this.isAutoBattle && !this.battleEnded && !this.isProcessingTurn) {
      this.isProcessingTurn = true;
      this.time.delayedCall(800, () => {
        this.isProcessingTurn = false;
        this.runAutoTurn();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 영웅 상태이상 틱 처리 (턴 시작 시 호출)
  // ═══════════════════════════════════════════════════════════
  private processHeroStatusEffects(hero: Mercenary): void {
    if (!hero.statusEffects) hero.statusEffects = [];
    const expired: StatusEffect[] = [];

    hero.statusEffects.forEach(se => {
      switch (se.type) {
        case 'bleed':
          const bleedDmg = Math.max(1, Math.floor(hero.stats.atk * se.magnitude));
          hero.currentHp = Math.max(1, hero.currentHp - bleedDmg);
          this.addLog(`🩸 [출혈] ${hero.name}이(가) ${bleedDmg} 출혈 피해! (${se.turnsLeft}턴 남음)`, 'danger');
          break;
        case 'regen':
          const regenAmt = Math.floor(hero.maxHp * se.magnitude);
          hero.currentHp = Math.min(hero.maxHp, hero.currentHp + regenAmt);
          this.addLog(`💚 [재생] ${hero.name} HP +${regenAmt}`, 'reward');
          break;
      }
      se.turnsLeft -= 1;
      if (se.turnsLeft <= 0) expired.push(se);
    });

    // 만료된 상태이상 해제
    expired.forEach(se => {
      hero.statusEffects = hero.statusEffects.filter(x => x !== se);
      this.addLog(`✅ [해제] ${hero.name}의 [${STATUS_EFFECT_META[se.type]?.label}] 상태이상이 해제되었습니다.`, 'system');
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 상태이상 부여 (영웅에게)
  // ═══════════════════════════════════════════════════════════
  private applyStatusToHero(hero: Mercenary, type: StatusEffectType, turns: number, magnitude: number, source: string): void {
    if (!hero.statusEffects) hero.statusEffects = [];
    // 같은 타입 이미 있으면 지속 턴 합산 연장 (스택 미적용, 지속 시간 누적)
    const existing = hero.statusEffects.find(se => se.type === type);
    if (existing) {
      existing.turnsLeft = Math.min(9, existing.turnsLeft + turns);
      existing.totalTurns = Math.max(existing.totalTurns, existing.turnsLeft);
      if (type === 'shield') {
        existing.magnitude = (existing.magnitude || 0) + magnitude;
      } else {
        existing.magnitude = Math.max(existing.magnitude || 0, magnitude);
      }
      this.addLog(`🔄 ${hero.name}의 [${STATUS_EFFECT_META[type]?.label}] 지속 시간 연장 (총 ${existing.turnsLeft}턴).`, 'danger');
    } else {
      hero.statusEffects.push({ type, turnsLeft: turns, totalTurns: turns, magnitude, source });
      this.addLog(`${STATUS_EFFECT_META[type]?.icon} [${STATUS_EFFECT_META[type]?.label}] ${hero.name}에게 ${turns}턴 부여! (출처: ${source})`, 'danger');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 상태이상 해제 (Cleanse — 스킬/아이템)
  // ═══════════════════════════════════════════════════════════
  private cleanse(hero: Mercenary, source: string): void {
    if (!hero.statusEffects || hero.statusEffects.length === 0) {
      this.addLog(`${hero.name}에게 해제할 상태이상이 없습니다.`, 'normal');
      return;
    }
    const removed = hero.statusEffects.map(se => STATUS_EFFECT_META[se.type]?.label ?? se.type);
    hero.statusEffects = [];
    this.addLog(`✨ [정화] ${source}으로 ${hero.name}의 [${removed.join(', ')}] 상태이상을 전부 해제했습니다!`, 'reward');
  }

  // ═══════════════════════════════════════════════════════════
  // 스킬 실행
  // ═══════════════════════════════════════════════════════════
  private executeSkill(hero: Mercenary, skill: Skill): void {
    if (this.battleEnded) return;

    let mpCost = this.gm.getSkillManaCost(skill.manaCost);
    if (hero.position === 'back') mpCost = Math.max(0, Math.floor(mpCost * 0.85));

    if (hero.currentMp < mpCost) {
      this.addLog(`MP 부족! [${skill.name}] 시전 불가 (필요 MP: ${mpCost}, 보유: ${hero.currentMp})`, 'danger');
      return;
    }

    hero.currentMp -= mpCost;

    // 턴 시작 시 출혈 등 상태이상 틱
    this.processHeroStatusEffects(hero);

    const effectType = skill.effectType ?? 'damage';
    const specialMark = skill.isSpecial ? (skill.name.includes('[궁극기]') ? '★[궁극기] ' : '★[고유기] ') : '';

    // ── cleanse ───────────────────────────────────────────
    if (effectType === 'cleanse') {
      const targets = skill.targetType === 'all_allies'
        ? this.gm.party.filter(h => h.currentHp > 0)
        : [hero];
      targets.forEach(t => this.cleanse(t, `${hero.name}의 ${skill.name}`));
      this.addLog(`${specialMark}${hero.name}의 [${skill.name}]!`, 'reward');
      this.afterHeroAction();
      return;
    }

    // ── heal ─────────────────────────────────────────────
    if (effectType === 'heal') {
      const targets = skill.targetType === 'all_allies'
        ? this.gm.party.filter(h => h.currentHp > 0)
        : [this.gm.party.filter(h => h.currentHp > 0).sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp))[0] ?? hero];
      const healAmt = Math.floor(hero.stats.atk * skill.power + hero.maxMp * 0.15);
      targets.forEach(t => { t.currentHp = Math.min(t.maxHp, t.currentHp + healAmt); });
      this.addLog(`${specialMark}${hero.name}의 [${skill.name}]! ${targets.map(t => t.name).join(', ')}에게 ${healAmt} 회복!`, 'reward');
      this.afterHeroAction();
      return;
    }

    // ── shield / buff ──────────────────────────────────────
    if (effectType === 'shield') {
      const shAmt = Math.floor(hero.stats.def * skill.power * 40);
      this.applyStatusToHero(hero, 'shield', skill.statusDuration ?? 2, shAmt, skill.name);
      this.addLog(`${specialMark}${hero.name}의 [${skill.name}]! 보호막 ${shAmt} 생성.`, 'story');
      this.afterHeroAction();
      return;
    }

    if (effectType === 'buff') {
      const targets = skill.targetType === 'all_allies'
        ? this.gm.party.filter(h => h.currentHp > 0)
        : [hero];
      targets.forEach(t => this.applyStatusToHero(t, 'buff_atk', skill.statusDuration ?? 2, skill.power, skill.name));
      this.addLog(`${specialMark}${hero.name}의 [${skill.name}]! 아군 공격력 강화.`, 'story');
      this.afterHeroAction();
      return;
    }

    // ── regen (자가 재생) ──────────────────────────────────
    if (effectType === 'drain') {
      // drain = 공격 + 자가 회복
      const { dmg } = this.calcDamageToMonster(hero, skill.power);
      this.dealDamageToMonster(dmg, skill);
      const healBack = Math.floor(dmg * 0.3);
      hero.currentHp = Math.min(hero.maxHp, hero.currentHp + healBack);
      this.addLog(`${specialMark}${hero.name}의 [${skill.name}]! ${dmg} 피해 + HP ${healBack} 흡수!`, 'story');
      if (this.checkBattleOutcome()) return;
      this.afterHeroAction();
      return;
    }

    // ── damage / bleed / stun / debuff ─────────────────────
    const aliveMonsters = this.monsters.filter(m => m.currentHp > 0);
    const targets = skill.targetType === 'all_enemies' ? aliveMonsters : (aliveMonsters.length > 0 ? [aliveMonsters[0]] : []);
    
    targets.forEach(target => {
      const { dmg, isCrit } = this.calcDamageToMonster(hero, skill.power, target);
      this.dealDamageToMonster(dmg, skill, target);
      const critText = isCrit ? ' [치명타!]' : '';
      this.addLog(`${specialMark}${hero.name}의 [${skill.name}]! ${target.data.name}에게 ${dmg}${critText} 피해`, 'story');

      // 상태이상 부여 (몬스터에게)
      if (effectType === 'bleed') {
        const duration = skill.statusDuration ?? 2;
        target.status.bleedTurns = Math.max(target.status.bleedTurns, duration);
        target.status.bleedMag   = Math.floor(dmg * 0.15);
        this.addLog(`🩸 [출혈] ${target.data.name}에게 출혈 ${duration}턴 부여!`, 'danger');
      }
      if (effectType === 'stun') {
        const duration = skill.statusDuration ?? 1;
        target.status.stunTurns = Math.max(target.status.stunTurns, duration);
        this.addLog(`💫 [기절] ${target.data.name}이(가) ${duration}턴 기절!`, 'danger');
      }
      if (effectType === 'debuff') {
        const duration = skill.statusDuration ?? 2;
        target.status.defDebuffTurns = Math.max(target.status.defDebuffTurns, duration);
        target.status.defDebuffMag   = skill.power;
        this.addLog(`⬇️ [약화] ${target.data.name}의 방어력 ${Math.floor(skill.power * 100)}% 감소 ${duration}턴!`, 'danger');
      }

      if (skill.id === 'duel_riposte') {
        this.applyStatusToHero(hero, 'riposte', 2, 0.60, skill.name);
        this.addLog(`⚔️💨 [환영의 반격] ${hero.name}이(가) 2턴간 회피율 60% 상승 및 피격 시 즉시 반격 태세를 전개했습니다!`, 'reward');
      }
    });

    if (this.checkBattleOutcome()) return;
    this.afterHeroAction();
  }

  /** 영웅 → 몬스터 데미지 계산 */
  private calcDamageToMonster(hero: Mercenary, skillPower: number, target: MonsterState): { dmg: number; isCrit: boolean } {
    const eff = this.gm.getHeroEffectiveStats(hero);
    let totalAtk = eff.atk;

    // buff_atk 상태이상 반영
    const buffMult = (hero.statusEffects ?? []).filter(se => se.type === 'buff_atk')
      .reduce((acc, se) => acc + se.magnitude, 0);
    totalAtk = Math.floor(totalAtk * (1 + buffMult));

    let dmgMult = 1.0 + (eff.damageBonus / 100);
    if (hero.position === 'mid')  dmgMult += 0.12;
    if (hero.position === 'back') dmgMult += 0.08;
    if (this.gm.pveBuffActive)    dmgMult += 0.15;

    const synergies = this.gm.getActiveSynergies();

    // 몬스터 방어 (debuff 및 방어관통 반영)
    let effectiveDef = target.def;
    if (target.status.defDebuffTurns > 0) {
      effectiveDef = Math.floor(effectiveDef * (1 - target.status.defDebuffMag));
    }
    if (eff.defPenetration > 0) {
      effectiveDef = Math.floor(effectiveDef * (1 - eff.defPenetration / 100));
    }

    let dmg = Math.max(1, Math.floor(totalAtk * skillPower * dmgMult - effectiveDef * 0.6));

    let critRate = eff.crit;
    if (hero.position === 'mid') critRate += 8;

    const isCrit = Math.random() * 100 < critRate;
    if (isCrit) {
      let critMult = 1.75;
      for (const syn of synergies) {
        if (syn.buffs.critDmgBonus) critMult += syn.buffs.critDmgBonus;
      }
      dmg = Math.floor(dmg * critMult);
    }

    // 흡혈 옵션 반영
    if (eff.drainPercent > 0) {
      const drainAmt = Math.floor(dmg * (eff.drainPercent / 100));
      hero.currentHp = Math.min(hero.maxHp, hero.currentHp + drainAmt);
    }

    return { dmg, isCrit };
  }

  private dealDamageToMonster(dmg: number, skill: Skill, target: MonsterState): void {
    // 몬스터 보호막 먼저 소모
    if (target.status.shieldAmount > 0) {
      const absorbed = Math.min(target.status.shieldAmount, dmg);
      target.status.shieldAmount -= absorbed;
      dmg -= absorbed;
      this.addLog(`🛡️ 몬스터 보호막이 ${absorbed} 피해 흡수!`, 'system');
    }
    target.currentHp = Math.max(0, target.currentHp - dmg);

    const synergies = this.gm.getActiveSynergies();
    if (synergies.some(s => s.id === 'syn_shadow') && Math.random() < 0.25) {
      target.status.bleedTurns = Math.max(target.status.bleedTurns, 2);
      target.status.bleedMag = Math.floor(dmg * 0.15);
      this.addLog(`🩸 [암영 출혈] ${target.data.name}에게 깊은 출혈 유발!`, 'danger');
    }


    // 광폭화 체크
    if (target.data.type === 'boss' && !target.isEnraged && target.currentHp <= target.maxHp * 0.4) {
      target.isEnraged = true;
      target.atk = Math.floor(target.atk * 1.6);
      target.spd = Math.floor(target.spd * 1.3);
      this.addLog(`🔥 [보스 광폭화!] ${target.data.name}의 공격력 +60%, 속도 +30%!`, 'danger');
    }
    this.updateEnemyHpBar();
    void skill;
  }

  private executeBasicAttack(hero: Mercenary): void {
    if (this.battleEnded) return;
    this.processHeroStatusEffects(hero);

    const weaponEnchantSkill = hero.equipment?.weapon?.prefix?.grantedSkill;
    if (weaponEnchantSkill) {
      if (hero.currentMp >= weaponEnchantSkill.manaCost) {
        this.executeSkill(hero, weaponEnchantSkill);
        return;
      } else {
        this.addLog(`💧 [마나 부족] ${hero.name}의 마나가 부족하여 [${weaponEnchantSkill.name}] 대신 기본 공격을 시전합니다.`, 'normal');
      }
    }

    const target = this.monsters.find(m => m.currentHp > 0);
    if (!target) return;

    const { dmg, isCrit } = this.calcDamageToMonster(hero, 1.0, target);
    this.dealDamageToMonster(dmg, { id: '', name: '기본공격', description: '', manaCost: 0, cooldown: 0, targetType: 'single_enemy', power: 1, icon: '⚔️' }, target);
    const critText = isCrit ? ' [치명타!]' : '';
    this.addLog(`${hero.name}의 기본 타격! ${target.data.name}에게 ${dmg}${critText} 피해.`, 'normal');

    if (this.checkBattleOutcome()) return;
    this.afterHeroAction();
  }

  private afterHeroAction(): void {
    this.time.delayedCall(400, () => {
      if (!this.battleEnded) this.advanceTurn();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 적 턴 처리
  // ═══════════════════════════════════════════════════════════
  private enemyTurn(mon: MonsterState): void {
    if (this.battleEnded) return;

    // 출혈 데미지
    if (mon.status.bleedTurns > 0) {
      const bleedDmg = Math.max(1, mon.status.bleedMag);
      mon.currentHp = Math.max(0, mon.currentHp - bleedDmg);
      mon.status.bleedTurns -= 1;
      this.addLog(`🩸 [출혈] ${mon.data.name}이(가) ${bleedDmg} 출혈 피해!${mon.status.bleedTurns <= 0 ? ' (출혈 해제)' : ''}`, 'reward');
      this.updateEnemyHpBar();
      if (this.checkBattleOutcome()) return;
    }

    // 기절이면 스킵
    if (mon.status.stunTurns > 0) {
      mon.status.stunTurns -= 1;
      this.addLog(`💫 [기절] ${mon.data.name}이(가) 기절로 행동 불능!${mon.status.stunTurns <= 0 ? ' (기절 해제)' : ''}`, 'reward');
      this.advanceTurn();
      return;
    }

    // 방어 debuff 턴 감소
    if (mon.status.defDebuffTurns > 0) {
      mon.status.defDebuffTurns -= 1;
      if (mon.status.defDebuffTurns <= 0) {
        this.addLog(`✅ [해제] ${mon.data.name}의 방어력 약화가 해제되었습니다.`, 'system');
      }
    }

    // 대상 선택 (전열 우선)
    const liveHeroes = this.gm.party.filter(h => h.currentHp > 0);
    if (liveHeroes.length === 0) return;

    let targetHero = liveHeroes.find(h => h.position === 'front');
    if (!targetHero) targetHero = liveHeroes.find(h => h.position === 'mid');
    if (!targetHero) targetHero = liveHeroes[Math.floor(Math.random() * liveHeroes.length)];

    // HP 비율에 따른 적 행동 패턴
    const hpRatio = mon.currentHp / mon.maxHp;
    let skillIdx = 0;
    if (hpRatio < 0.4 && mon.data.skills.length > 2) {
      skillIdx = mon.data.skills.length - 1; // 광폭화: 마지막(가장 강한) 스킬
    } else if (hpRatio < 0.7 && mon.data.skills.length > 1) {
      skillIdx = Math.floor(Math.random() * (mon.data.skills.length - 1)) + 1;
    }
    const monsterSkill = mon.data.skills[skillIdx];

    // 피해 계산
    let totalDef = targetHero.stats.def;
    if (targetHero.equipment.armor?.stats.def) totalDef += targetHero.equipment.armor.stats.def;
    let defBonus = totalDef * 0.6;
    if (targetHero.position === 'front') defBonus *= 1.2;

    const synergies = this.gm.getActiveSynergies();
    let dmgReduction = 1.0;
    for (const syn of synergies) {
      if (syn.buffs.damageReductionPct) {
        dmgReduction *= (1.0 - syn.buffs.damageReductionPct);
      }
    }

    // 보호막 (hero shield) 확인
    const heroShield = (targetHero.statusEffects ?? []).find(se => se.type === 'shield');
    let dmg = Math.max(1, Math.floor(mon.atk * monsterSkill.power * dmgReduction - defBonus));
    if (heroShield) {
      const absorbed = Math.min(heroShield.magnitude, dmg);
      heroShield.magnitude -= absorbed;
      dmg -= absorbed;
      if (heroShield.magnitude <= 0) {
        targetHero.statusEffects = (targetHero.statusEffects ?? []).filter(se => se !== heroShield);
        this.addLog(`🛡️ ${targetHero.name}의 보호막이 파괴되었습니다!`, 'system');
      } else {
        this.addLog(`🛡️ 보호막이 ${absorbed} 피해 흡수!`, 'system');
      }
    }

    // 전체 광역 스킬 처리
    if (monsterSkill.effectType === 'damage' && monsterSkill.power >= 2.0) {
      liveHeroes.forEach(h => {
        const hDef = (h.stats.def + (h.equipment.armor?.stats.def ?? 0)) * 0.6;
        const hDmg = Math.max(1, Math.floor(mon.atk * monsterSkill.power * 0.7 * dmgReduction - hDef));
        h.currentHp = Math.max(0, h.currentHp - hDmg);
      });
      this.addLog(`💥 ${mon.data.name}의 [${monsterSkill.name}]! 전원에게 광역 피해!`, 'danger');
    } else {
      targetHero.currentHp = Math.max(0, targetHero.currentHp - dmg);
      this.addLog(`[적 턴] ${mon.data.name}의 [${monsterSkill.name}]! ${targetHero.name}에게 ${dmg} 피해!`, 'danger');

      const riposteEffect = (targetHero.statusEffects ?? []).find(se => se.type === 'riposte');
      if (riposteEffect && targetHero.currentHp > 0) {
        const { dmg: counterDmg } = this.calcDamageToMonster(targetHero, 1.3, mon);
        this.dealDamageToMonster(counterDmg, { id: 'duel_riposte', name: '환영의 반격', description: '', manaCost: 0, cooldown: 0, targetType: 'single_enemy', power: 1.3, icon: '⚔️' }, mon);
        this.addLog(`⚔️⚡ [환영 반격 발동!] ${targetHero.name}이(가) 피격 즉시 ${mon.data.name}에게 ${counterDmg} 반격 피해!`, 'reward');
      }
    }

    // 적 스킬 상태이상 부여 (영웅에게)
    const sEff = monsterSkill.effectType;
    const sDur = monsterSkill.statusDuration ?? 2;
    if (sEff === 'bleed')  this.applyStatusToHero(targetHero, 'bleed',      sDur, 0.15, mon.data.name);
    if (sEff === 'stun')   this.applyStatusToHero(targetHero, 'stun',       sDur, 0,    mon.data.name);
    if (sEff === 'debuff') this.applyStatusToHero(targetHero, 'debuff_def', sDur, 0.2,  mon.data.name);
    if (sEff === 'drain') {
      const drainHeal = Math.floor(dmg * 0.3);
      mon.currentHp = Math.min(mon.maxHp, mon.currentHp + drainHeal);
      this.addLog(`🔴 [흡수] ${mon.data.name}이(가) HP ${drainHeal} 흡수!`, 'danger');
      this.updateEnemyHpBar();
    }

    // 시너지 턴 회복
    let totalRegenPct = 0;
    let regenSynergyNames = [];
    for (const syn of synergies) {
      if (syn.buffs.hpRegenPct) {
        totalRegenPct += syn.buffs.hpRegenPct;
        regenSynergyNames.push(syn.name);
      }
    }
    
    if (totalRegenPct > 0) {
      this.gm.party.filter(h => h.currentHp > 0).forEach(h => {
        h.currentHp = Math.min(h.maxHp, h.currentHp + Math.floor(h.maxHp * totalRegenPct));
      });
      this.addLog(`✨ [${regenSynergyNames.join(', ')}] 아군 전체 체력 ${Math.floor(totalRegenPct * 100)}% 자동 회복!`, 'reward');
    }

    // 전멸 체크
    if (this.gm.party.every(h => h.currentHp <= 0)) {
      this.battleEnded = true;
      this.time.removeAllEvents();    // ← 모든 타이머 즉시 취소
      this.gm.party.forEach(h => { h.currentHp = Math.floor(h.maxHp * 0.3); h.statusEffects = []; });
      
      // 전멸: 던전 인벤토리 아이템 전소실
      this.gm.dungeonInventory = [];
      
      this.addLog('💀 3인 원정대가 전멸... 인벤토리 소실 후 성채로 구출되었습니다.', 'danger');
      this.showBattleResult(false);
      return;
    }

    this.time.delayedCall(500, () => {
      if (!this.battleEnded) this.advanceTurn();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 전투 결과 체크
  // ═══════════════════════════════════════════════════════════
  private checkBattleOutcome(): boolean {
    if (this.monsters.every(m => m.currentHp <= 0)) {
      this.battleEnded = true;
      this.time.removeAllEvents();    // ← 모든 지연 타이머 즉시 취소
      this.gm.party.forEach(h => { h.statusEffects = []; });
      
      this.monsters.forEach(m => this.gm.claimBattleRewards(m.data));
      
      const goldSum = this.monsters.reduce((acc, m) => acc + (m.data.rewards.gold || 0), 0);
      const expSum = this.monsters.reduce((acc, m) => acc + (m.data.rewards.exp || 0), 0);
      const resSum = this.monsters.reduce((acc, m) => acc + (m.data.rewards.ether || 0), 0);
      const gRes = GameManager.getGuaranteedBattleResource(this.gm.dungeonFloor);
      
      this.addLog(
        `🏆 [승리!] 적을 물리쳤습니다! 🪙+${goldSum} ${gRes.icon}+${resSum} (${gRes.name}) EXP+${expSum}`,
        'reward'
      );

      const isBoss = this.monsters.some(m => m.data.type === 'boss');
      if (isBoss && this.gm.dungeonFloor < 5) {
        this.gm.portalAppeared = true;
        this.addLog('🌀 [포탈 생성] 보스를 쓰러뜨린 공간에 차원의 문이 열렸습니다!', 'reward');
      }

      // 승리 시 결과 카드 표시 후 탐험씬 귀환
      this.showBattleResult(true);
      return true;
    }
    return false;
  }

  /** 승리/패배 결과 오버레이 — 씬 전환 전 명확한 결과 피드백 */
  private showBattleResult(victory: boolean): void {
    const sw = this.scale.width;
    const sh = this.scale.height;
    const zoom = Math.min(1.0, sh / 932);
    const logicalW = sw / zoom;
    const logicalH = sh / zoom;
    

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, logicalW, logicalH);

    const resultText = victory ? '🏆 전투 승리!' : '💀 원정대 전멸';
    const subText = victory ? '탐험으로 귀환합니다...' : '성채로 귀환합니다...';
    const textColor = victory ? '#38ef7d' : '#ff416c';

    this.add.text(this.safeX + this.safeW / 2, this.safeY + 466 - 30, resultText, {
      fontFamily: 'Cinzel', fontSize: '28px', color: textColor, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(this.safeX + this.safeW / 2, this.safeY + 466 + 20, subText, {
      fontFamily: 'Noto Sans KR', fontSize: '14px', color: '#b0bec5'
    }).setOrigin(0.5);

    this.time.delayedCall(1000, () => {
      if (victory) {
        this.scene.start('ExplorationScene');
      } else {
        this.scene.start('CitadelScene');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AUTO 턴
  // ═══════════════════════════════════════════════════════════
  private runAutoTurn(): void {
    if (this.battleEnded || this.isProcessingTurn || !this.isAutoBattle) return;
    const entry = this.getCurrentTurnEntry();
    if (entry.type !== 'hero') return;

    const hero = this.gm.party.find(h => h.id === entry.heroId);
    if (!hero || hero.currentHp <= 0) { this.advanceTurn(); return; }

    const heroClass = CHARACTER_CLASSES[hero.classId];
    if (hero.currentMp >= this.gm.getSkillManaCost(heroClass.specialSkill.manaCost)) {
      this.executeSkill(hero, heroClass.specialSkill);
    } else {
      const usable = heroClass.skills.find(s => hero.currentMp >= this.gm.getSkillManaCost(s.manaCost));
      if (usable) this.executeSkill(hero, usable);
      else this.executeBasicAttack(hero);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 버튼 헬퍼
  // ═══════════════════════════════════════════════════════════
  private createSkillButton(x: number, y: number, w: number, h: number, skill: Skill, callback: () => void, isSpecial = false): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(isSpecial ? 0x331422 : 0x212a3d, 1);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1.5, isSpecial ? 0xffd54f : 0xc8aa6e, 0.9);
    bg.strokeRoundedRect(0, 0, w, h, 8);

    const nameLbl = this.add.text(8, 6, `${skill.icon} ${skill.name}`, {
      fontFamily: 'Noto Sans KR', fontSize: isSpecial ? '11px' : '9.5px',
      color: isSpecial ? '#ffd54f' : '#ffffff', fontStyle: 'bold',
      wordWrap: { width: w - 16 }
    });
    const costText = `MP ${this.gm.getSkillManaCost(skill.manaCost)}`;
    const costLbl = this.add.text(w - 8, 6, costText, {
      fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#80e5ff', fontStyle: 'bold'
    }).setOrigin(1, 0);

    const descLbl = this.add.text(8, 22, skill.description, {
      fontFamily: 'Noto Sans KR', fontSize: '8.5px',
      color: isSpecial ? '#ffecb3' : '#8b9bb4',
      wordWrap: { width: w - 16 }, lineSpacing: 1
    });

    btn.add([bg, nameLbl, costLbl, descLbl]);
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

  private createActionButton(x: number, y: number, w: number, h: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a2130, 1);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(1.5, color, 0.9);
    bg.strokeRoundedRect(0, 0, w, h, 8);
    const lbl = this.add.text(w / 2, h / 2, text, {
      fontFamily: 'Noto Sans KR', fontSize: '11px', color: '#ffffff', fontStyle: 'bold', align: 'center'
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
