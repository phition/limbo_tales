import { CHARACTER_CLASSES } from '../data/classes';
import { MONSTERS } from '../data/monsters';
import { INITIAL_BUILDINGS } from '../data/buildings';
import { BUILDING_NAMES } from '../i18n/dataLocales';
import { EQUIPMENT_RECIPES } from '../data/equipment';
import { ALL_SKILL_BOOKS, getSkillBookRarity } from '../data/skillBooks';
import { COMBO_RULES } from './skillComboUtils';
import { SupportedLanguage } from '../i18n/types';
import { MONSTER_FACTION_META } from '../types/game';
import { EncyclopediaDataService } from '../services/EncyclopediaDataService';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface ExportResult {
  success: boolean;
  filename: string;
  error?: string;
}

export function exportEncyclopediaToHtml(
  lang: SupportedLanguage,
  tr: (text: string) => string
): ExportResult {
  const isEn = lang === 'en';
  const isJa = lang === 'ja';

  const docTitle = isEn
    ? 'Project Limbo - Ark Master Encyclopedia'
    : isJa
    ? 'Project Limbo - 方舟マスター百科事典 (図鑑)'
    : 'Project Limbo - 방주 마스터 대백과사전 (종합 도감)';

  const generatedDate = new Date().toLocaleDateString(
    lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR',
    { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  );

  const navItems = [
    { id: 'sec-starter', label: tr('초반 공략 로드맵') },
    { id: 'sec-classes', label: tr('직업 & 전직') },
    { id: 'sec-monsters', label: tr('몬스터 & 보스') },
    { id: 'sec-buildings', label: tr('영지 시설') },
    { id: 'sec-equipment', label: tr('장비 & 인챈트') },
    { id: 'sec-skills', label: tr('스킬 & 콤보') },
    { id: 'sec-systems', label: tr('시스템 & 가이드') },
    { id: 'sec-faqs', label: tr('생존 FAQ') },
  ];

  const service = EncyclopediaDataService.getInstance();
  const starterSteps = service.getStarterSteps();
  const weaponTraits = service.getWeaponTraits();
  const classLineages = service.getClassLineages();
  const systemGuides = service.getSystemGuides();
  const faqsGuide = service.getFaqs();

  // 1. Starter steps
  const starterHtml = (starterSteps || []).map(s => `
    <div class="card">
      <div class="card-header">
        <span class="icon">${s.icon}</span>
        <div>
          <span class="badge badge-accent">${escapeHtml(s.step)}</span>
          <h3 class="card-title">${escapeHtml(tr(s.title))}</h3>
        </div>
      </div>
      <p class="desc">${escapeHtml(tr(s.desc))}</p>
      ${s.tip ? `<div class="tip-box">${escapeHtml(tr(s.tip))}</div>` : ''}
    </div>
  `).join('');

  // 2. Weapon traits
  const traitsHtml = (weaponTraits || []).map(t => `
    <div class="grid-card">
      <div class="grid-card-head">
        <span class="badge" style="background:${t.color}22; color:${t.color}; border:1px solid ${t.borderColor};">${escapeHtml(t.icon)} ${escapeHtml(tr(t.weapon))}</span>
        <strong style="color:${t.color}; font-size:14px;">${escapeHtml(tr(t.trait))}</strong>
      </div>
      <p class="desc-sm">${escapeHtml(tr(t.effect))}</p>
    </div>
  `).join('');

  // 3. Classes & Lineages
  const lineagesHtml = (classLineages || []).map(lineage => {
    const classCards = (lineage.classOrder || [])
      .map(id => CHARACTER_CLASSES[id])
      .filter(Boolean)
      .map(cls => {
        const skillsHtml = (cls.skills || []).map(sk => `
          <div class="skill-pill">
            <span class="skill-name">⚡ ${escapeHtml(tr(sk.name))} (MP ${sk.manaCost ?? 0})</span>
            <span class="skill-desc">${escapeHtml(tr(sk.description))}</span>
          </div>
        `).join('');

        const ultHtml = cls.specialSkill ? `
          <div class="ult-pill">
            <span class="ult-name">👑 [${escapeHtml(tr('궁극기'))}] ${escapeHtml(tr(cls.specialSkill.name))} (MP ${cls.specialSkill.manaCost ?? 0})</span>
            <span class="skill-desc">${escapeHtml(tr(cls.specialSkill.description))}</span>
          </div>
        ` : '';

        const classIcon = cls.skills?.[0]?.icon || lineage.icon;
        const hp = cls.baseStats?.hp ?? 0;
        const mp = cls.baseStats?.mp ?? 0;
        const atk = cls.baseStats?.atk ?? 0;
        const def = cls.baseStats?.def ?? 0;
        const spd = cls.baseStats?.spd ?? 0;
        const luck = cls.baseStats?.luck ?? 0;

        return `
          <div class="class-card" style="border-left: 4px solid ${lineage.theme.primary};">
            <div class="class-card-header">
              <span class="class-icon">${classIcon}</span>
              <div>
                <h4 class="class-title">${escapeHtml(tr(cls.name))}</h4>
                <div class="class-meta">
                  <span class="badge badge-subtle">${escapeHtml(tr(cls.role))}</span>
                  <span class="badge badge-subtle">Tier ${cls.tier}</span>
                </div>
              </div>
            </div>
            <div class="passive-box">
              <strong>✨ ${escapeHtml(tr('패시브'))}:</strong> ${escapeHtml(tr(cls.passiveDesc))}
            </div>
            <div class="stats-mini">
              <span>HP: ${hp}</span>
              <span>MP: ${mp}</span>
              <span>ATK: ${atk}</span>
              <span>DEF: ${def}</span>
              <span>SPD: ${spd}</span>
              <span>LUK: ${luck}</span>
            </div>
            <div class="skills-wrap">
              ${skillsHtml}
              ${ultHtml}
            </div>
          </div>
        `;
      }).join('');

    return `
      <div class="lineage-group" style="border-color:${lineage.theme.border}; background:${lineage.theme.bgTint};">
        <div class="lineage-header">
          <span class="lineage-icon">${lineage.icon}</span>
          <div>
            <h3 class="lineage-title" style="color:${lineage.theme.light};">${escapeHtml(tr(lineage.name))}</h3>
            <div class="lineage-sub">${escapeHtml(tr(lineage.roleTitle))}</div>
            <div class="lineage-summary">${escapeHtml(tr(lineage.summary))}</div>
          </div>
        </div>
        <div class="cards-grid">
          ${classCards}
        </div>
      </div>
    `;
  }).join('');

  // 4. Monsters
  const monstersHtml = Object.values(MONSTERS || {}).map(m => {
    const isBoss = m.type === 'boss';
    const hp = m.maxHp ?? 0;
    const atk = m.atk ?? 0;
    const def = m.def ?? 0;
    const spd = m.spd ?? 0;
    const exp = (m as any).expReward ?? 0;

    const factionMeta = MONSTER_FACTION_META[m.faction || 'beast'];
    const factionLabel = factionMeta ? `${factionMeta.icon} ${tr(factionMeta.label)}` : '';

    return `
      <div class="grid-card ${isBoss ? 'boss-card' : ''}">
        <div class="grid-card-head">
          <span class="icon-lg">${(m as any).icon || (isBoss ? '👑' : '👾')}</span>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <strong class="card-title">${escapeHtml(tr(m.name))}</strong>
              ${isBoss ? `<span class="badge badge-boss">BOSS</span>` : ''}
              ${factionMeta ? `<span class="badge" style="background:${factionMeta.color}22; color:${factionMeta.color}; border:1px solid ${factionMeta.color}55;">${escapeHtml(factionLabel)}</span>` : ''}
            </div>
            <span class="badge badge-subtle">${escapeHtml(tr(m.type || '심연 마물'))} · Lv.${m.level ?? 1}</span>
          </div>
        </div>
        <p class="desc-sm">${escapeHtml(tr((m as any).description || ''))}</p>
        <div class="stats-mini">
          <span>HP: ${hp}</span>
          <span>ATK: ${atk}</span>
          <span>DEF: ${def}</span>
          <span>SPD: ${spd}</span>
          <span>EXP: ${exp}</span>
        </div>
        ${m.skills && m.skills.length > 0 ? `
          <div class="monster-skills">
            <strong>👾 ${escapeHtml(tr('스킬/패턴'))}:</strong>
            ${m.skills.map(s => `<span class="tag">${escapeHtml(tr(s.name))}</span>`).join(' ')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // 5. Buildings
  const buildingsHtml = Object.entries(INITIAL_BUILDINGS || {}).map(([id, b]) => {
    const bLocale = BUILDING_NAMES[id]?.[lang] || BUILDING_NAMES[id]?.ko;
    const bName = bLocale?.name || tr(b.name);
    const bDesc = bLocale?.desc || tr(b.description || '');
    return `
    <div class="grid-card">
      <div class="grid-card-head">
        <span class="icon-lg">${b.icon || '🏛️'}</span>
        <div>
          <strong class="card-title">${escapeHtml(bName)}</strong>
          <span class="badge badge-subtle">Max Lv.${(b as any).maxLevel ?? 10}</span>
        </div>
      </div>
      <p class="desc-sm">${escapeHtml(bDesc)}</p>
      <div class="perks-list">
        ${(((b as any).perks || []) as Array<{ level: number; desc: string }>).map(p => `<div class="perk-item">✓ Lv.${p.level}: ${escapeHtml(tr(p.desc))}</div>`).join('')}
      </div>
    </div>
  `;
  }).join('');

  // 6. Equipment recipes
  const equipmentHtml = (EQUIPMENT_RECIPES || []).map(eq => {
    const stats = eq.baseStats || {};
    return `
      <div class="grid-card">
        <div class="grid-card-head">
          <span class="icon-lg">${(eq as any).icon || '⚔️'}</span>
          <div>
            <strong class="card-title">${escapeHtml(tr(eq.name))}</strong>
            <span class="badge badge-accent">${escapeHtml(tr(eq.slot || '장비'))} · Tier ${eq.tier ?? 1}</span>
          </div>
        </div>
        <p class="desc-sm">${escapeHtml(tr((eq as any).description || ''))}</p>
        <div class="stats-mini">
          ${stats.atk ? `<span>ATK +${stats.atk}</span>` : ''}
          ${stats.def ? `<span>DEF +${stats.def}</span>` : ''}
          ${stats.hp ? `<span>HP +${stats.hp}</span>` : ''}
          ${stats.mp ? `<span>MP +${stats.mp}</span>` : ''}
          ${stats.spd ? `<span>SPD +${stats.spd}</span>` : ''}
          ${(stats as any).critRate ? `<span>CRIT +${(stats as any).critRate}%</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // 7. Grimoires (Skill Books)
  const grimoiresHtml = (ALL_SKILL_BOOKS || []).map(bk => {
    const rarity = bk.rarity || getSkillBookRarity(bk.rank) || 'common';
    const rarityBadge = rarity.toUpperCase();
    const mpCost = bk.skill?.manaCost ?? 0;
    const desc = bk.description || bk.skill?.description || '';
    const originMonster = (bk as any).originMonsterName || '';

    return `
      <div class="grid-card">
        <div class="grid-card-head">
          <span class="icon-lg">${bk.icon || '📖'}</span>
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <strong class="card-title">${escapeHtml(tr(bk.name))}</strong>
              <span class="badge badge-accent">${escapeHtml(rarityBadge)}</span>
            </div>
            <span class="badge badge-subtle">MP ${mpCost} · 🪙 ${bk.costGold ?? 0}</span>
          </div>
        </div>
        <p class="desc-sm">${escapeHtml(tr(desc))}</p>
        ${originMonster ? `
          <div class="drop-banner">
            👾 <strong>${escapeHtml(tr('드랍 마물'))}:</strong> ${escapeHtml(tr(originMonster))}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // 8. Combo Rules
  const combosHtml = (COMBO_RULES || []).map(c => `
    <div class="grid-card">
      <div class="grid-card-head">
        <span class="icon-lg">${c.icon || '⚡'}</span>
        <div>
          <strong class="card-title">${escapeHtml(tr(c.comboName))}</strong>
          <div class="badge-row">
            <span class="badge badge-subtle">${escapeHtml(tr('상태'))}: ${escapeHtml(c.triggerStatus || '')}</span>
            <span class="badge badge-accent">${escapeHtml(tr('연계'))}: ${escapeHtml((c.requiredTagIds || []).join(', '))}</span>
          </div>
        </div>
      </div>
      <p class="desc-sm">${escapeHtml(tr(c.fullDesc || c.summary || ''))}</p>
    </div>
  `).join('');

  // 9. System Guides
  const systemsHtml = (systemGuides || []).map(g => `
    <div class="card">
      <div class="card-header">
        <span class="icon">${g.icon || '🗺️'}</span>
        <div>
          <span class="badge badge-subtle">${escapeHtml(tr(g.category))}</span>
          <h3 class="card-title">${escapeHtml(tr(g.title))}</h3>
        </div>
      </div>
      <p class="desc"><strong>${escapeHtml(tr(g.summary))}</strong></p>
      <ul class="details-list">
        ${(g.details || []).map(d => `<li>${escapeHtml(tr(d))}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  // 10. FAQs
  const faqsHtml = (faqsGuide || []).map(f => `
    <div class="faq-item">
      <h4 class="faq-q">❓ ${escapeHtml(tr(f.question))}</h4>
      <p class="faq-a">💡 ${escapeHtml(tr(f.answer))}</p>
    </div>
  `).join('');

  const fullHtml = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    :root {
      --bg: #0a0b10;
      --card-bg: #111827;
      --card-border: #1f293d;
      --accent: #c8aa6e;
      --accent-glow: rgba(200, 170, 110, 0.25);
      --gold: #f59e0b;
      --green: #10b981;
      --red: #ef4444;
      --purple: #a855f7;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", "Noto Sans JP", sans-serif;
      line-height: 1.6;
      padding: 0;
      margin: 0;
    }
    header {
      background: linear-gradient(135deg, #0e1726 0%, #0a0b10 100%);
      border-bottom: 1px solid #1f2d48;
      padding: 32px 20px;
      text-align: center;
      position: relative;
    }
    header h1 {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    header .subtitle {
      color: var(--text-muted);
      font-size: 13px;
      max-width: 650px;
      margin: 0 auto;
    }
    header .meta-bar {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 11px;
      color: var(--accent);
      font-family: monospace;
    }
    nav.toc {
      position: sticky;
      top: 0;
      background: rgba(14, 23, 38, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid #1f2d48;
      padding: 10px 20px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
      z-index: 100;
      scrollbar-width: thin;
    }
    nav.toc a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      white-space: nowrap;
      transition: all 0.2s;
    }
    nav.toc a:hover {
      color: var(--accent);
      background: rgba(200, 170, 110, 0.1);
      border-color: rgba(200, 170, 110, 0.4);
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }
    section {
      margin-bottom: 48px;
      scroll-margin-top: 60px;
    }
    .sec-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1e293b;
    }
    .sec-header h2 {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
    }
    .cards-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
    }
    .icon { font-size: 24px; }
    .icon-lg { font-size: 28px; }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      font-family: monospace;
      letter-spacing: 0.3px;
    }
    .badge-accent {
      background: rgba(200, 170, 110, 0.15);
      color: var(--accent);
      border: 1px solid rgba(200, 170, 110, 0.4);
    }
    .badge-subtle {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .badge-boss {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .desc {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 8px;
      line-height: 1.6;
    }
    .desc-sm {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 8px 0;
    }
    .tip-box {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
      font-size: 12px;
    }
    .grid-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .grid-card-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .boss-card {
      border-color: rgba(239, 68, 68, 0.4);
      background: linear-gradient(180deg, rgba(239, 68, 68, 0.06) 0%, var(--card-bg) 100%);
    }
    .lineage-group {
      border: 1px solid;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .lineage-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .lineage-icon { font-size: 32px; }
    .lineage-title { font-size: 17px; font-weight: 800; }
    .lineage-sub { font-size: 12px; color: var(--text-muted); font-weight: 600; }
    .lineage-summary { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
    .class-card {
      background: #0d1322;
      border-radius: 10px;
      padding: 12px;
      border: 1px solid #1e293b;
    }
    .class-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .class-icon { font-size: 24px; }
    .class-title { font-size: 14px; font-weight: 700; color: #fff; }
    .class-meta { display: flex; gap: 4px; margin-top: 2px; }
    .passive-box {
      font-size: 11px;
      color: #93c5fd;
      background: rgba(59, 130, 246, 0.1);
      padding: 6px 8px;
      border-radius: 6px;
      margin-bottom: 8px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .stats-mini {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 10px;
      font-family: monospace;
      color: #94a3b8;
      background: rgba(0, 0, 0, 0.25);
      padding: 4px 8px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .skills-wrap { display: flex; flex-direction: column; gap: 6px; }
    .skill-pill {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .skill-name { font-size: 11px; font-weight: 700; color: #dfc488; }
    .skill-desc { font-size: 11px; color: #94a3b8; }
    .ult-pill {
      background: rgba(234, 179, 8, 0.1);
      border: 1px solid rgba(234, 179, 8, 0.3);
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ult-name { font-size: 11px; font-weight: 800; color: #fbbf24; }
    .drop-banner {
      margin-top: 6px;
      padding: 4px 8px;
      background: rgba(168, 85, 247, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      font-size: 11px;
      color: #d8b4fe;
    }
    .perks-list {
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .perk-item {
      font-size: 11px;
      color: #93c5fd;
      background: rgba(255, 255, 255, 0.02);
      padding: 3px 6px;
      border-radius: 4px;
    }
    .details-list {
      list-style-type: none;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .details-list li {
      font-size: 12px;
      color: #cbd5e1;
      padding-left: 12px;
      position: relative;
    }
    .details-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--accent);
    }
    .faq-item {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 10px;
    }
    .faq-q {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .faq-a {
      font-size: 13px;
      color: #93c5fd;
      line-height: 1.5;
    }
    footer {
      border-top: 1px solid #1e293b;
      padding: 24px 20px;
      text-align: center;
      font-size: 12px;
      color: var(--text-dim);
      background: #08090d;
    }
    @media print {
      nav.toc { display: none; }
      body { background: #fff; color: #000; }
      .card, .grid-card { border-color: #ccc; box-shadow: none; }
    }
  </style>
</head>
<body>

  <header>
    <h1>📜 ${escapeHtml(docTitle)}</h1>
    <p class="subtitle">${escapeHtml(tr('방주 재건과 심연 11층 무간도 정복을 위한 지휘관 전술 공략 및 종합 데이터베이스'))}</p>
    <div class="meta-bar">
      <span>🌐 LANG: ${lang.toUpperCase()}</span>
      <span>📅 ${escapeHtml(generatedDate)}</span>
      <span>📦 VERSION: 1.1.3</span>
    </div>
  </header>

  <nav class="toc">
    ${navItems.map(n => `<a href="#${n.id}">${escapeHtml(n.label)}</a>`).join('')}
  </nav>

  <main>

    <!-- 초반 공략 -->
    <section id="sec-starter">
      <div class="sec-header">
        <span class="icon">💡</span>
        <h2>${escapeHtml(tr('초반 공략 로드맵 (Starter Roadmap)'))}</h2>
      </div>
      <div class="cards-stack">
        ${starterHtml}
      </div>
      <div style="margin-top:20px;">
        <h3 style="font-size:15px; margin-bottom:12px; color:#fff;">🏷️ ${escapeHtml(tr('무기 6종 고유 특성'))}</h3>
        <div class="cards-grid">
          ${traitsHtml}
        </div>
      </div>
    </section>

    <!-- 직업 & 전직 -->
    <section id="sec-classes">
      <div class="sec-header">
        <span class="icon">👑</span>
        <h2>${escapeHtml(tr('직업 & 전직 계통도 (Classes & Lineages)'))}</h2>
      </div>
      ${lineagesHtml}
    </section>

    <!-- 몬스터 & 보스 -->
    <section id="sec-monsters">
      <div class="sec-header">
        <span class="icon">👾</span>
        <h2>${escapeHtml(tr('심연 몬스터 & 보스 기믹 도감'))}</h2>
      </div>
      <div class="cards-grid">
        ${monstersHtml}
      </div>
    </section>

    <!-- 영지 시설 -->
    <section id="sec-buildings">
      <div class="sec-header">
        <span class="icon">🏰</span>
        <h2>${escapeHtml(tr('방주 13대 영지 시설 도감'))}</h2>
      </div>
      <div class="cards-grid">
        ${buildingsHtml}
      </div>
    </section>

    <!-- 장비 단조 -->
    <section id="sec-equipment">
      <div class="sec-header">
        <span class="icon">⚒️</span>
        <h2>${escapeHtml(tr('장비 단조 & 마도석 인챈트 도감'))}</h2>
      </div>
      <div class="cards-grid">
        ${equipmentHtml}
      </div>
    </section>

    <!-- 마도서 & 스킬 & 콤보 -->
    <section id="sec-skills">
      <div class="sec-header">
        <span class="icon">📜</span>
        <h2>${escapeHtml(tr('마도서(스킬북) & 상태이상 연계 콤보'))}</h2>
      </div>
      <h3 style="font-size:15px; margin-bottom:12px; color:#fff;">📖 ${escapeHtml(tr('보유 마도서 도감'))}</h3>
      <div class="cards-grid" style="margin-bottom:24px;">
        ${grimoiresHtml}
      </div>
      <h3 style="font-size:15px; margin-bottom:12px; color:#fff;">⚡ ${escapeHtml(tr('상태이상 스킬 연계(Combo) 메커니즘'))}</h3>
      <div class="cards-grid">
        ${combosHtml}
      </div>
    </section>

    <!-- 핵심 시스템 가이드 -->
    <section id="sec-systems">
      <div class="sec-header">
        <span class="icon">🗺️</span>
        <h2>${escapeHtml(tr('방주 핵심 시스템 & 전술 가이드'))}</h2>
      </div>
      <div class="cards-stack">
        ${systemsHtml}
      </div>
    </section>

    <!-- 생존 FAQ -->
    <section id="sec-faqs">
      <div class="sec-header">
        <span class="icon">❓</span>
        <h2>${escapeHtml(tr('신임 지휘관 생존 FAQ'))}</h2>
      </div>
      ${faqsHtml}
    </section>

  </main>

  <footer>
    <p>Project Limbo Ark Encyclopedia · Exported for Offline Reference</p>
    <p style="margin-top:4px;">© 2026 Project Limbo Tales. All rights reserved.</p>
  </footer>

  <!-- 
    ===================================================================
    👑 Project Limbo Ark Master Encyclopedia Data Package
    [마스터 계정 안내]
    이 HTML 문서는 오프라인 도감이자, 게임 내 [백과사전 업로드] 지원 파일입니다.
    아래 <script id="limbo-encyclopedia-data" type="application/json"> 내부의
    JSON 데이터를 텍스트 에디터로 수정한 뒤 이 파일(또는 JSON)을 업로드하면
    인게임 백과사전 내용이 실시간으로 업데이트 및 배포됩니다.
    ===================================================================
  -->
  <script id="limbo-encyclopedia-data" type="application/json">
${JSON.stringify(service.getCurrentPackage(lang), null, 2)}
  </script>

</body>
</html>`;

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `project_limbo_encyclopedia_${lang}_${dateStr}.html`;

  try {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });

    // 브라우저 지원 체크 (IE/옛 엣지 msSaveBlob 대비)
    if (typeof (window.navigator as any)?.msSaveBlob === 'function') {
      (window.navigator as any).msSaveBlob(blob, filename);
      return { success: true, filename };
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    // revokeObjectURL 지연 처리 (즉시 폐기 시 다운로드 취소 방지)
    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      } catch (_) {}
    }, 5000);

    return { success: true, filename };
  } catch (err: any) {
    console.error('[encyclopediaExporter] Download failed:', err);
    return {
      success: false,
      filename,
      error: err?.message || 'Download failed'
    };
  }
}

/** 👑 마스터 계정용 백과사전 JSON 단독 다운로드 */
export function exportEncyclopediaToJson(lang: SupportedLanguage = 'ko'): ExportResult {
  const service = EncyclopediaDataService.getInstance();
  const pkg = service.getCurrentPackage(lang);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `limbo_encyclopedia_data_${lang}_${dateStr}.json`;

  try {
    const jsonStr = JSON.stringify(pkg, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });

    if (typeof (window.navigator as any)?.msSaveBlob === 'function') {
      (window.navigator as any).msSaveBlob(blob, filename);
      return { success: true, filename };
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (a.parentNode) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (_) {}
    }, 5000);

    return { success: true, filename };
  } catch (err: any) {
    console.error('[encyclopediaExporter] JSON download failed:', err);
    return {
      success: false,
      filename,
      error: err?.message || 'JSON Download failed'
    };
  }
}
