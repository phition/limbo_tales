import React, { useState, useMemo, useEffect } from 'react';
import { CHARACTER_CLASSES } from '../data/classes';
import { MONSTERS } from '../data/monsters';
import { INITIAL_BUILDINGS, BUILDING_LORE_AND_TIPS } from '../data/buildings';
import { BUILDING_NAMES } from '../i18n/dataLocales';
import { EQUIPMENT_RECIPES, PREFIX_ENCHANT_OPTIONS, SUFFIX_ENCHANT_OPTIONS, getEquipmentTemplateId } from '../data/equipment';
import { ALL_SKILL_BOOKS, getSkillAffinityMeta } from '../data/skillBooks';
import { STATUS_EFFECT_META, StatusEffectType, MonsterData, EnchantOption, CharacterClass, MONSTER_FACTION_META } from '../types/game';
import { SYSTEM_GUIDES } from '../data/systemGuides';
import { GameIcon } from './GameIcon';
import { GameDataService } from '../services/GameDataService';
import { COMBO_RULES, ComboRule, getTagMeta } from '../utils/skillComboUtils';
import { FEVER_BADGE_META, evaluateFeverSynergy } from '../utils/feverUtils';
import { FeverBadgeType, FeverBadgeMeta } from '../types/fever';
import { GameManager } from '../managers/GameManager';
import { useI18n } from '../hooks/useI18n';
import { exportEncyclopediaToHtml } from '../utils/encyclopediaExporter';

import {
  EncyclopediaCategory,
  StarterStepGuide,
  WeaponTraitGuide,
  FaqGuide,
  ClassLineageTheme,
  ClassLineageDef,
  STARTER_STEPS,
  WEAPON_TRAITS_GUIDE,
  FAQS_GUIDE,
  CATEGORY_TABS,
  CLASS_LINEAGES
} from '../data/encyclopediaData';

export type {
  EncyclopediaCategory,
  StarterStepGuide,
  WeaponTraitGuide,
  FaqGuide,
  ClassLineageTheme,
  ClassLineageDef
};
export {
  STARTER_STEPS,
  WEAPON_TRAITS_GUIDE,
  FAQS_GUIDE,
  CATEGORY_TABS,
  CLASS_LINEAGES
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: EncyclopediaCategory;
  initialSearchQuery?: string;
}

export interface DetailModalData {
  title: string;
  subtitle?: string;
  categoryBadge?: { label: string; bg?: string; color?: string; border?: string };
  icon?: React.ReactNode;
  content: React.ReactNode;
  footerInfo?: string;
}

export const EncyclopediaModal: React.FC<Props> = ({ open, onClose, initialTab = 'all', initialSearchQuery }) => {
  const { tr, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<EncyclopediaCategory>(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery || '');
  const [detailData, setDetailData] = useState<DetailModalData | null>(null);
  const [dataRevision, setDataRevision] = useState(0);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialTab) setActiveTab(initialTab);
      if (initialSearchQuery !== undefined) setSearchTerm(initialSearchQuery);
    }
  }, [open, initialTab, initialSearchQuery]);

  useEffect(() => {
    return GameDataService.getInstance().onUpdate(() => {
      setDataRevision(v => v + 1);
    });
  }, []);

  const cleanSearch = searchTerm.trim().toLowerCase();

  // 0. 초반 생존 공략 & 무기 특성 & FAQ 필터링
  const filteredStarterGuide = useMemo(() => {
    const steps = STARTER_STEPS.filter(s => {
      if (!cleanSearch) return true;
      const str = (s.step + ' ' + s.title + ' ' + s.desc + ' ' + (s.tip || '')).toLowerCase();
      return str.includes(cleanSearch);
    });
    const traits = WEAPON_TRAITS_GUIDE.filter(t => {
      if (!cleanSearch) return true;
      const str = (t.weapon + ' ' + t.trait + ' ' + t.effect).toLowerCase();
      return str.includes(cleanSearch);
    });
    const faqs = FAQS_GUIDE.filter(f => {
      if (!cleanSearch) return true;
      const str = (f.question + ' ' + f.answer).toLowerCase();
      return str.includes(cleanSearch);
    });
    return { steps, traits, faqs };
  }, [cleanSearch]);

  // 1. 계통별 직업 목록 그룹화 & 필터링 (같은 시작 클래스와 1,2차 전직을 같은 색상과 섹션으로 묶음)
  const filteredLineageGroups = useMemo(() => {
    const handledClassIds = new Set<string>();
    CLASS_LINEAGES.forEach(l => l.classOrder.forEach(id => handledClassIds.add(id)));

    const result = CLASS_LINEAGES.map(lineage => {
      const lineageMatch = cleanSearch ? (
        lineage.name.toLowerCase().includes(cleanSearch) ||
        lineage.roleTitle.toLowerCase().includes(cleanSearch) ||
        lineage.summary.toLowerCase().includes(cleanSearch)
      ) : false;

      const classes = lineage.classOrder
        .map(id => CHARACTER_CLASSES[id])
        .filter((cls): cls is CharacterClass => Boolean(cls))
        .filter(cls => {
          if (!cleanSearch || lineageMatch) return true;
          const str = (
            cls.id + ' ' +
            cls.name + ' ' + tr(cls.name) + ' ' +
            cls.role + ' ' + tr(cls.role) + ' ' +
            cls.passiveDesc + ' ' + tr(cls.passiveDesc) + ' ' +
            cls.skills.map(s => s.name + ' ' + tr(s.name) + ' ' + s.description + ' ' + tr(s.description)).join(' ') + ' ' +
            (cls.specialSkill ? cls.specialSkill.name + ' ' + tr(cls.specialSkill.name) + ' ' + cls.specialSkill.description + ' ' + tr(cls.specialSkill.description) : '')
          ).toLowerCase();
          return str.includes(cleanSearch);
        });

      return {
        ...lineage,
        classes
      };
    }).filter(group => group.classes.length > 0);

    // 혹시 누락된 기타 클래스 처리
    const unhandledClasses = Object.values(CHARACTER_CLASSES)
      .filter(cls => !handledClassIds.has(cls.id))
      .filter(cls => {
        if (!cleanSearch) return true;
        const str = (cls.id + ' ' + cls.name + ' ' + cls.role + ' ' + cls.passiveDesc).toLowerCase();
        return str.includes(cleanSearch);
      });

    if (unhandledClasses.length > 0) {
      result.push({
        id: 'other',
        name: tr('특수 및 기타 클래스'),
        roleTitle: tr('기타 전직 및 특수 역할군'),
        icon: '✨',
        summary: tr('기타 특수 직업'),
        theme: {
          primary: '#8b9bb4',
          light: '#cbd5e1',
          bgTint: 'rgba(74, 85, 104, 0.16)',
          border: 'rgba(139, 155, 180, 0.45)',
          cardBg: '#121722',
          cardBorder: 'rgba(139, 155, 180, 0.35)',
          tagBg: 'rgba(139, 155, 180, 0.2)',
          tagBorder: 'rgba(139, 155, 180, 0.5)',
          tagText: '#e2e8f0',
          glow: 'rgba(139, 155, 180, 0.12)',
          accentBar: '#8b9bb4'
        },
        classOrder: unhandledClasses.map(c => c.id),
        classes: unhandledClasses
      });
    }

    return result;
  }, [cleanSearch]);

  const totalClassesCount = useMemo(() => {
    return filteredLineageGroups.reduce((acc, g) => acc + g.classes.length, 0);
  }, [filteredLineageGroups]);

  // 기존 호환용 filteredClasses
  const filteredClasses = useMemo(() => {
    return filteredLineageGroups.flatMap(g => g.classes);
  }, [filteredLineageGroups]);

  // 2. 몬스터 목록 필터링
  const filteredMonsters = useMemo(() => {
    return Object.values(MONSTERS).filter((mon: MonsterData) => {
      if (!cleanSearch) return true;
      const str = (mon.id + ' ' + mon.name + ' ' + tr(mon.name) + ' ' + mon.type + ' ' + mon.description + ' ' + tr(mon.description) + ' ' + mon.skills.map(s => s.name + ' ' + tr(s.name) + ' ' + s.description + ' ' + tr(s.description)).join(' ')).toLowerCase();
      return str.includes(cleanSearch);
    });
  }, [cleanSearch, dataRevision]);

  // 3. 건물 목록 필터링
  const filteredBuildings = useMemo(() => {
    return Object.values(INITIAL_BUILDINGS).filter(b => {
      if (!cleanSearch) return true;
      const bLocale = BUILDING_NAMES[b.id]?.[lang] || BUILDING_NAMES[b.id]?.ko;
      const bName = bLocale?.name || b.name;
      const bDesc = bLocale?.desc || b.description;
      const str = (b.id + ' ' + bName + ' ' + tr(bName) + ' ' + bDesc + ' ' + tr(bDesc) + ' ' + b.description).toLowerCase();
      return str.includes(cleanSearch);
    });
  }, [cleanSearch, dataRevision, lang]);

  // 4. 장비 & 인챈트 필터링
  const filteredEquipment = useMemo(() => {
    const recipes = EQUIPMENT_RECIPES.filter(eq => {
      if (!cleanSearch) return true;
      const str = (eq.id + ' ' + eq.name + ' ' + tr(eq.name) + ' ' + eq.slot + ' ' + eq.rarity + ' ' + eq.description + ' ' + tr(eq.description)).toLowerCase();
      return str.includes(cleanSearch);
    });
    const allEnchants: EnchantOption[] = [
      ...Object.values(PREFIX_ENCHANT_OPTIONS),
      ...Object.values(SUFFIX_ENCHANT_OPTIONS)
    ];
    const enchants = allEnchants.filter((enc: EnchantOption) => {
      if (!cleanSearch) return true;
      const str = (enc.id + ' ' + enc.name + ' ' + tr(enc.name) + ' ' + enc.type + ' ' + enc.rarity + ' ' + enc.description + ' ' + tr(enc.description)).toLowerCase();
      return str.includes(cleanSearch);
    });
    return { recipes, enchants };
  }, [cleanSearch]);

  // 5. 스킬북 & 상태이상 & 스킬 연계 필터링
  const filteredSkills = useMemo(() => {
    const books = ALL_SKILL_BOOKS.filter(sb => {
      if (!cleanSearch) return true;
      const str = (sb.id + ' ' + sb.name + ' ' + tr(sb.name) + ' ' + sb.skill.name + ' ' + tr(sb.skill.name) + ' ' + sb.skill.description + ' ' + tr(sb.skill.description) + ' ' + sb.rank + ' ' + sb.description + ' ' + tr(sb.description)).toLowerCase();
      return str.includes(cleanSearch);
    });
    const statuses = (Object.entries(STATUS_EFFECT_META) as [StatusEffectType, typeof STATUS_EFFECT_META[StatusEffectType]][]).filter(([type, meta]) => {
      if (!cleanSearch) return true;
      const str = (type + ' ' + meta.label + ' ' + tr(meta.label) + ' ' + meta.desc + ' ' + tr(meta.desc)).toLowerCase();
      return str.includes(cleanSearch);
    });
    const combos = COMBO_RULES.filter((c: ComboRule) => {
      if (!cleanSearch) return true;
      const str = (c.comboName + ' ' + tr(c.comboName) + ' ' + c.triggerStatus + ' ' + tr(c.triggerStatus) + ' ' + c.summary + ' ' + tr(c.summary) + ' ' + c.fullDesc + ' ' + tr(c.fullDesc) + ' ' + c.requiredTagIds.map(t => getTagMeta(t).label + ' ' + tr(getTagMeta(t).label)).join(' ') + ' 연계 콤보 스킬 상태이상 combo synergy').toLowerCase();
      return str.includes(cleanSearch);
    });
    const feverBadges = (Object.values(FEVER_BADGE_META) as FeverBadgeMeta[]).filter((b: FeverBadgeMeta) => {
      if (!cleanSearch) return true;
      const str = (b.type + ' ' + b.label + ' ' + tr(b.label) + ' ' + b.shortLabel + ' ' + tr(b.shortLabel) + ' ' + b.description + ' ' + tr(b.description) + ' 피버 모멘텀 뱃지 전술 궁극기 fever badge momentum tactic').toLowerCase();
      return str.includes(cleanSearch);
    });
    return { books, statuses, combos, feverBadges };
  }, [cleanSearch]);

  // 6. 시스템 가이드 필터링
  const filteredSystems = useMemo(() => {
    return SYSTEM_GUIDES.filter(sys => {
      if (!cleanSearch) return true;
      const str = (sys.id + ' ' + sys.title + ' ' + sys.category + ' ' + sys.summary + ' ' + sys.details.join(' ')).toLowerCase();
      return str.includes(cleanSearch);
    });
  }, [cleanSearch]);

  const totalResultsCount =
    filteredStarterGuide.steps.length +
    filteredStarterGuide.traits.length +
    filteredStarterGuide.faqs.length +
    filteredClasses.length +
    filteredMonsters.length +
    filteredBuildings.length +
    filteredEquipment.recipes.length +
    filteredEquipment.enchants.length +
    filteredSkills.books.length +
    filteredSkills.statuses.length +
    filteredSkills.combos.length +
    filteredSkills.feverBadges.length +
    filteredSystems.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* 모달 본체 */}
      <div className="relative w-full max-w-4xl max-h-[92dvh] bg-[#0c101d] border border-[#1f2d48] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-[#cfd8e8]">

        {/* 상단 헤더: 타이틀 & 검색창 & 닫기 */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#111728] border-b border-[#1f2d48] flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">
                📖
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <span>{tr('방주 종합 백과사전 & 도감')}</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">
                    Total {totalResultsCount}
                  </span>
                </h2>
                <p className="text-[11px] text-[#8b9bb4]">
                  {tr('직업, 전직 계통, 몬스터 기믹, 영지 시설, 장비 인챈트, 상태이상 및 주요 시스템 가이드')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#192238] hover:bg-[#233150] text-[#8b9bb4] hover:text-white transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {/* 통합 실시간 검색 입력창 */}
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8b9bb4]">
              🔍
            </span>
            <input
              type="text"
              placeholder={tr('명칭, 스킬, 상태이상, 보스 기믹, 옵션 검색... (예: 성기사, 실명, 접두, 흑익박쥐, 유지비)')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-[#0a0b10] border border-[#22334f] focus:border-[#c8aa6e] text-white text-xs sm:text-sm placeholder:text-[#5a6a85] outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b9bb4] hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* 카테고리 탭 네비게이션 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {CATEGORY_TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer " + (
                    active
                      ? "bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e88] shadow-[0_0_12px_rgba(200, 170, 110,0.25)]"
                      : "bg-[#151c2e] text-[#8b9bb4] hover:text-white border border-[#222f47] hover:border-[#33466a]"
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tr(tab.label)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 메인 컨텐츠 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* 0. 💡 신임 지휘관 초반 생존 가이드 & 무기 특성 & FAQ */}
          {(activeTab === 'all' || activeTab === 'starter') && (filteredStarterGuide.steps.length > 0 || filteredStarterGuide.traits.length > 0 || filteredStarterGuide.faqs.length > 0) && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <span className="font-bold text-sm sm:text-base text-[#38ef7d] flex items-center gap-2">
                  <span>💡</span>
                  <span>{tr('신임 지휘관 초반 생존 & 육성 가이드')}</span>
                </span>
                <span className="text-[10px] text-[#81c784] bg-[#38ef7d18] border border-[#38ef7d33] px-2 py-0.5 rounded-full font-bold">
                  Starter Guide
                </span>
              </div>

              {/* 6단계 초반 스노우볼링 로드맵 */}
              {filteredStarterGuide.steps.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-b from-[#101e15] to-[#0a140e] border border-[#38ef7d44] flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#38ef7d28] pb-2">
                    <span className="font-bold text-sm text-[#38ef7d] flex items-center gap-2">
                      <span>🗺️</span>
                      <span>{tr('초반 6단계 완벽 생존 & 번영 로드맵')}</span>
                    </span>
                    <span className="text-[10px] text-[#a5d6a7]">
                      {tr('단계별 핵심 미션 완수 가이드')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {filteredStarterGuide.steps.map((st) => (
                      <div
                        key={st.step}
                        onClick={() => setDetailData({
                          title: `[${st.step}] ${tr(st.title)}`,
                          subtitle: tr('신임 지휘관 초반 생존 & 번영 로드맵'),
                          categoryBadge: { label: tr('초반 공략 로드맵'), bg: '#38ef7d22', color: '#38ef7d', border: '#38ef7d55' },
                          icon: <span className="text-3xl">{st.icon}</span>,
                          content: (
                            <div className="flex flex-col gap-4">
                              <div className="text-base sm:text-lg text-white font-medium leading-relaxed bg-[#0c1811] p-5 rounded-2xl border border-[#1d3824] shadow-inner">
                                {tr(st.desc)}
                              </div>
                              {st.tip && (
                                <div className="text-sm sm:text-base text-[#ffd54f] bg-[#ffd54f15] p-4 rounded-xl border border-[#ffd54f33] font-bold">
                                  {tr(st.tip)}
                                </div>
                              )}
                            </div>
                          ),
                          footerInfo: `${tr('초반 가이드')} • ${st.step}`
                        })}
                        className="p-3 rounded-lg bg-[#0c1811] border border-[#1d3824] flex flex-col gap-1.5 hover:border-[#38ef7d66] transition-all cursor-pointer hover:scale-[1.01] group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#81c784] flex items-center gap-1.5 group-hover:text-[#38ef7d] transition-colors">
                            <span>{st.icon}</span>
                            <span>[{st.step}] {tr(st.title)}</span>
                          </span>
                          <span className="text-[10px] text-[#4a7250] group-hover:text-[#81c784] transition-colors font-mono">🔍 {tr('확대')}</span>
                        </div>
                        <div className="text-[11px] text-[#c8e6c9] leading-relaxed">
                          {tr(st.desc)}
                        </div>
                        {st.tip && (
                          <div className="text-[10px] text-[#ffd54f] bg-[#ffd54f10] p-1.5 rounded border border-[#ffd54f28]">
                            {tr(st.tip)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 무기 6종 고유 특성 뱃지 해설 */}
              {filteredStarterGuide.traits.length > 0 && (
                <div className="p-4 rounded-xl bg-[#13151b] border border-[#c8aa6e44] flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#c8aa6e28] pb-2">
                    <span className="font-bold text-sm text-[#c8aa6e] flex items-center gap-2">
                      <span>🏷️</span>
                      <span>{tr('무기 6종 고유 특성 뱃지 (Weapon Traits) 완전 해설')}</span>
                    </span>
                    <span className="text-[10px] text-[#80deea]">
                      {tr('병기창 단조 시 무기별 고유 메커니즘')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {filteredStarterGuide.traits.map((wt) => (
                      <div
                        key={wt.weapon}
                        onClick={() => setDetailData({
                          title: `${tr(wt.trait)} (${tr(wt.weapon)})`,
                          subtitle: tr('병기창 무기 계열 고유 특성 뱃지'),
                          categoryBadge: { label: tr('무기 고유 특성'), bg: `${wt.color}22`, color: wt.color, border: `${wt.color}55` },
                          icon: <span className="text-3xl">{wt.icon}</span>,
                          content: (
                            <div className="flex flex-col gap-4">
                              <div className="text-base sm:text-lg text-white font-bold leading-relaxed bg-[#0e1626] p-5 rounded-2xl border shadow-inner" style={{ borderColor: wt.borderColor }}>
                                {tr(wt.effect)}
                              </div>
                              <div className="text-sm sm:text-base text-[#cfd8e8] bg-[#14161c] p-4 rounded-xl border border-[#22334f] leading-relaxed">
                                <span className="font-bold text-[#c8aa6e]">💡 {tr('전술 운용 팁:')}</span> {tr('{0}을 착용한 영웅은 기본 공격 및 관련 전투 행동 시 위 고유 메커니즘이 상시 적용됩니다. 시너지 효과를 가진 클래스와 조합하면 전투 효율이 극대화됩니다.').replace('{0}', tr(wt.weapon))}
                              </div>
                            </div>
                          ),
                          footerInfo: `${tr('무기 특성')} • ${tr(wt.weapon)}`
                        })}
                        className="p-3 rounded-lg bg-[#0b111e] border flex flex-col gap-1.5 hover:scale-[1.01] transition-all cursor-pointer group"
                        style={{ borderColor: wt.borderColor }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs" style={{ color: wt.color }}>
                            {tr(wt.trait)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-[#8b9bb4]">
                              {tr(wt.weapon)}
                            </span>
                            <span className="text-[10px] text-[#556987] group-hover:text-white transition-colors">🔍</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
                          {tr(wt.effect)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 자주 묻는 질문 FAQ */}
              {filteredStarterGuide.faqs.length > 0 && (
                <div className="p-4 rounded-xl bg-[#161226] border border-[#ce93d844] flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#ce93d828] pb-2">
                    <span className="font-bold text-sm text-[#ce93d8] flex items-center gap-2">
                      <span>❓</span>
                      <span>{tr('자주 묻는 질문 (FAQ) & 방주 생존 수칙')}</span>
                    </span>
                    <span className="text-[10px] text-[#e1bee7]">
                      {tr('전멸 방지 & 보관 수칙')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {filteredStarterGuide.faqs.map((faq, idx) => (
                      <div
                        key={idx}
                        onClick={() => setDetailData({
                          title: tr(faq.question),
                          subtitle: tr('자주 묻는 질문 (FAQ) & 방주 생존 수칙'),
                          categoryBadge: { label: tr('생존 FAQ'), bg: '#ce93d822', color: '#ce93d8', border: '#ce93d855' },
                          icon: <span className="text-3xl">❓</span>,
                          content: (
                            <div className="flex flex-col gap-4">
                              <div className="text-base sm:text-lg font-bold text-[#ffd54f] bg-[#1a1226] p-4 rounded-xl border border-[#392454]">
                                Q. {tr(faq.question)}
                              </div>
                              <div className="text-base sm:text-lg text-[#e2e8f0] leading-relaxed bg-[#100c1c] p-5 rounded-2xl border border-[#26173a] shadow-inner">
                                A. {tr(faq.answer)}
                              </div>
                            </div>
                          ),
                          footerInfo: `${tr('방주 백과사전')} • FAQ`
                        })}
                        className="p-3 rounded-lg bg-[#0e0c19] border border-[#2b2144] flex flex-col gap-1 hover:border-[#ce93d866] transition-all cursor-pointer hover:scale-[1.01] group"
                      >
                        <div className="font-bold text-xs text-[#ce93d8] flex items-start justify-between gap-1.5">
                          <span className="flex items-start gap-1">
                            <span className="text-[#ffd54f]">Q.</span>
                            <span>{tr(faq.question)}</span>
                          </span>
                          <span className="text-[10px] text-[#634e7a] group-hover:text-[#ce93d8] shrink-0 font-mono">🔍 {tr('확대')}</span>
                        </div>
                        <div className="text-[11px] text-[#cfd8e8] leading-relaxed pl-3.5 border-l border-[#ce93d833] mt-1">
                          {tr(faq.answer)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1. 👑 직업 & 전직 계통도 (시작 클래스와 1,2차 전직을 계통별 섹션과 고유 색상으로 묶음) */}
          {(activeTab === 'all' || activeTab === 'classes') && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <span className="font-bold text-sm sm:text-base text-[#c8aa6e] flex items-center gap-2">
                  <span>👑</span>
                  <span>{tr('직업 & 전직 계통 도감')} ({totalClassesCount}{tr('클래스')} · {filteredLineageGroups.length}{tr('개 계통')})</span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  {tr('시작 클래스(Tier 0) ➔ 1차 전직(Tier 1) ➔ 2차 각성(Tier 2) ➔ 👑 3차 초월(Tier 3)')}
                </span>
              </div>

              {/* 계통별 그룹 섹션 목록 */}
              {filteredLineageGroups.map(lineage => (
                <div
                  key={lineage.id}
                  className="rounded-2xl p-3.5 sm:p-4.5 flex flex-col gap-3.5 border transition-all"
                  style={{
                    backgroundColor: lineage.theme.bgTint,
                    borderColor: lineage.theme.border,
                    boxShadow: `0 4px 20px ${lineage.theme.glow}`
                  }}
                >
                  {/* 계통 헤더 (동일 계열의 시작 클래스와 전직 계통을 한눈에 표시) */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b"
                    style={{ borderColor: lineage.theme.border }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="text-2xl sm:text-3xl p-2 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{
                          backgroundColor: lineage.theme.tagBg,
                          border: `1px solid ${lineage.theme.tagBorder}`
                        }}
                      >
                        {lineage.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-extrabold text-sm sm:text-base"
                            style={{ color: lineage.theme.light }}
                          >
                            {tr(lineage.name)}
                          </span>
                          <span
                            className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                            style={{
                              backgroundColor: lineage.theme.tagBg,
                              color: lineage.theme.tagText,
                              border: `1px solid ${lineage.theme.tagBorder}`
                            }}
                          >
                            {tr(lineage.roleTitle)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-1">
                          <span className="text-[#64748b]">{tr('전직 흐름')}:</span>
                          <span className="text-[#cbd5e1] font-medium">{tr(lineage.summary)}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="text-[11px] font-mono shrink-0 self-end sm:self-center px-2.5 py-1 rounded-lg font-bold"
                      style={{
                        backgroundColor: lineage.theme.tagBg,
                        color: lineage.theme.light,
                        border: `1px solid ${lineage.theme.tagBorder}`
                      }}
                    >
                      {tr('계통 직업')} {lineage.classes.length}{tr('개')}
                    </div>
                  </div>

                  {/* 계통 내부 클래스 카드 그리드 (동일한 테마 색상으로 통일) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lineage.classes.map(cls => {
                      const tierBadgeText = cls.tier === 0
                        ? tr('기본 클래스 (Tier 0)')
                        : cls.tier === 1
                        ? tr('1차 전직 (Tier 1)')
                        : cls.tier === 2
                        ? tr('★ 2차 각성 (Tier 2)')
                        : tr('👑 3차 초월 (Tier 3)');
                      const parentClass = cls.parentClassId ? CHARACTER_CLASSES[cls.parentClassId] : null;
                      const parentText = parentClass ? ` • ${tr('상위 전직')} [${tr(parentClass.name)}]` : '';

                      // 티어별 뱃지 스타일
                      const tierBadgeStyle = cls.tier === 0
                        ? { bg: lineage.theme.tagBg, color: lineage.theme.light, border: lineage.theme.tagBorder }
                        : cls.tier === 1
                        ? { bg: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0', border: 'rgba(255, 255, 255, 0.22)' }
                        : cls.tier === 2
                        ? { bg: 'rgba(255, 215, 0, 0.18)', color: '#ffd700', border: 'rgba(255, 215, 0, 0.5)' }
                        : { bg: 'rgba(200, 170, 110, 0.22)', color: '#c8aa6e', border: 'rgba(200, 170, 110, 0.6)' };

                      return (
                        <div
                          key={cls.id}
                          onClick={() => setDetailData({
                            title: tr(cls.name),
                            subtitle: `${tr('계통')}: ${tr(lineage.name)} • ${tr('역할군')}: ${tr(cls.role)}${parentText} • ${tierBadgeText}`,
                            categoryBadge: {
                              label: tierBadgeText,
                              bg: tierBadgeStyle.bg,
                              color: tierBadgeStyle.color,
                              border: tierBadgeStyle.border
                            },
                            icon: <span className="text-3xl">{cls.skills[0]?.icon || lineage.icon}</span>,
                            content: (
                              <div className="flex flex-col gap-4">
                                {/* 기본 스탯 그리드 */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#0a101d] rounded-xl border border-[#1e2f4c]">
                                  <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('체력 (HP)')}</span><span className="text-base font-bold text-[#66bb6a]">{cls.baseStats.hp}</span></div>
                                  <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('마나 (MP)')}</span><span className="text-base font-bold text-[#42a5f5]">{cls.baseStats.mp}</span></div>
                                  <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('공격력 (ATK)')}</span><span className="text-base font-bold text-[#ef5350]">{cls.baseStats.atk}</span></div>
                                  <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('방어력 (DEF)')}</span><span className="text-base font-bold text-[#ffd54f]">{cls.baseStats.def}</span></div>
                                </div>

                                {/* 고유 패시브 */}
                                <div
                                  className="p-4 rounded-xl border flex flex-col gap-1.5"
                                  style={{
                                    backgroundColor: lineage.theme.cardBg,
                                    borderColor: lineage.theme.tagBorder
                                  }}
                                >
                                  <span className="font-bold text-sm text-[#ffd54f] flex items-center gap-1.5">
                                    <span>🌟</span>
                                    <span>{tr('고유 패시브 능력')}</span>
                                  </span>
                                  <div className="text-sm sm:text-base text-white leading-relaxed">
                                    {tr(cls.passiveDesc)}
                                  </div>
                                </div>

                                {/* 전투 스킬 목록 */}
                                <div className="flex flex-col gap-2.5">
                                  <span className="font-bold text-sm flex items-center gap-1.5" style={{ color: lineage.theme.light }}>
                                    <span>⚔️</span>
                                    <span>{tr('전투 스킬')} ({cls.skills.length + (cls.specialSkill ? 1 : 0)}{tr('개')})</span>
                                  </span>
                                  <div className="flex flex-col gap-2">
                                    {cls.skills.map(sk => {
                                      const gm = GameManager.getInstance();
                                      const heroesWithSkill = [...(gm.barracks || []), ...(gm.party || [])].filter(h => h.classId === cls.id);
                                      const maxLv = heroesWithSkill.reduce((max, h) => Math.max(max, h.skillLevels?.[sk.id] || 1), 1);
                                      const resSk = maxLv > 1 ? (gm.resolveSkillData(sk.id, maxLv) || sk) : sk;
                                      const curP = Math.round((resSk.power || 1.0) * 100);
                                      return (
                                        <div
                                          key={sk.id}
                                          className="p-3.5 rounded-xl border flex flex-col gap-1"
                                          style={{
                                            backgroundColor: '#0a101d',
                                            borderColor: lineage.theme.cardBorder
                                          }}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5 flex-wrap">
                                              <span>{sk.icon}</span>
                                              <span>{tr(sk.name)}</span>
                                              {maxLv > 1 && (
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55] font-bold">
                                                  Lv.{maxLv} ({tr('위력')} {curP}%)
                                                </span>
                                              )}
                                            </span>
                                            <span
                                              className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
                                              style={{
                                                backgroundColor: lineage.theme.tagBg,
                                                color: lineage.theme.light,
                                                borderColor: lineage.theme.tagBorder
                                              }}
                                            >
                                              {resSk.manaCost} MP
                                            </span>
                                          </div>
                                          <div className="text-sm text-[#cfd8dc] leading-relaxed">
                                            {tr(resSk.description)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {cls.specialSkill && (() => {
                                      const gm = GameManager.getInstance();
                                      const heroesWithSpecial = [...(gm.barracks || []), ...(gm.party || [])].filter(h => h.classId === cls.id);
                                      const maxLv = heroesWithSpecial.reduce((max, h) => Math.max(max, h.skillLevels?.[cls.specialSkill!.id] || 1), 1);
                                      const resSpec = maxLv > 1 ? (gm.resolveSkillData(cls.specialSkill.id, maxLv) || cls.specialSkill) : cls.specialSkill;
                                      const curP = Math.round((resSpec.power || 1.0) * 100);
                                      return (
                                        <div className="p-3.5 rounded-xl bg-[#1b1928] border border-[#ffd54f55] flex flex-col gap-1 shadow-md">
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm sm:text-base text-[#ffd54f] flex items-center gap-1.5 flex-wrap">
                                              <span>{cls.specialSkill.icon || '⚡'}</span>
                                              <span>★ {tr(cls.specialSkill.name)} ({tr('특수 각성기')})</span>
                                              {maxLv > 1 && (
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55] font-bold">
                                                  Lv.{maxLv} ({tr('위력')} {curP}%)
                                                </span>
                                              )}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-[#ffd54f] bg-[#ffd54f22] px-2 py-0.5 rounded border border-[#ffd54f44]">
                                              {resSpec.manaCost} MP
                                            </span>
                                          </div>
                                          <div className="text-sm text-[#ffd54f] leading-relaxed">
                                            {tr(resSpec.description)}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            ),
                            footerInfo: `${tr(lineage.name)} • ${tr(cls.name)}`
                          })}
                          className="p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all cursor-pointer hover:scale-[1.01] group shadow-sm"
                          style={{
                            backgroundColor: lineage.theme.cardBg,
                            borderColor: lineage.theme.cardBorder
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-2xl p-1.5 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: lineage.theme.tagBg,
                                  border: `1px solid ${lineage.theme.tagBorder}`
                                }}
                              >
                                {cls.skills[0]?.icon || lineage.icon}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className="font-bold text-sm text-white group-hover:underline transition-colors"
                                    style={{ color: cls.tier === 2 ? '#ffd700' : 'white' }}
                                  >
                                    {cls.name}
                                  </span>
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border"
                                    style={{
                                      backgroundColor: tierBadgeStyle.bg,
                                      color: tierBadgeStyle.color,
                                      borderColor: tierBadgeStyle.border
                                    }}
                                  >
                                    {tierBadgeText}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#8b9bb4]">
                                  {tr('역할군')}: {tr(cls.role)}{parentText}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-[10px] font-mono text-[#8b9bb4]">
                              <div>HP {cls.baseStats.hp} • MP {cls.baseStats.mp}</div>
                              <div>ATK {cls.baseStats.atk} • DEF {cls.baseStats.def}</div>
                            </div>
                          </div>

                          {/* 직업 패시브 */}
                          <div
                            className="text-[11px] p-2 rounded-lg border text-[#cfd8e8]"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.25)',
                              borderColor: lineage.theme.cardBorder
                            }}
                          >
                            <span className="font-bold text-[#ffd54f]">
                              🌟 {tr('고유 패시브')}:{' '}
                            </span>
                            {tr(cls.passiveDesc)}
                          </div>

                          {/* 기본/전직 스킬 목록 */}
                          <div className="flex flex-col gap-1">
                            <div className="text-[10px] font-bold text-[#8b9bb4]">
                              {tr('전투 스킬')} ({cls.skills.length + (cls.specialSkill ? 1 : 0)}{tr('개')}):
                            </div>
                            {cls.skills.map(sk => {
                              const gm = GameManager.getInstance();
                              const heroesWithSkill = [...(gm.barracks || []), ...(gm.party || [])].filter(h => h.classId === cls.id);
                              const maxLv = heroesWithSkill.reduce((max, h) => Math.max(max, h.skillLevels?.[sk.id] || 1), 1);
                              const resSk = maxLv > 1 ? (gm.resolveSkillData(sk.id, maxLv) || sk) : sk;
                              const curP = Math.round((resSk.power || 1.0) * 100);
                              return (
                              <div
                                key={sk.id}
                                className="flex items-start justify-between text-[11px] text-[#cfd8e8] pl-2 border-l-2"
                                style={{ borderLeftColor: lineage.theme.accentBar }}
                              >
                                <div>
                                  <span className="mr-1">{sk.icon}</span>
                                  <span className="font-bold text-white mr-1">{tr(sk.name)}</span>
                                  {maxLv > 1 && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55] font-bold mr-1">
                                      Lv.{maxLv} ({curP}%)
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[#8b9bb4]">({tr(resSk.description)})</span>
                                </div>
                                <span
                                  className="text-[10px] font-mono shrink-0 font-bold ml-1"
                                  style={{ color: lineage.theme.light }}
                                >
                                  {resSk.manaCost} MP
                                </span>
                              </div>
                            );})}
                            {cls.specialSkill && (() => {
                              const gm = GameManager.getInstance();
                              const heroesWithSpecial = [...(gm.barracks || []), ...(gm.party || [])].filter(h => h.classId === cls.id);
                              const maxLv = heroesWithSpecial.reduce((max, h) => Math.max(max, h.skillLevels?.[cls.specialSkill!.id] || 1), 1);
                              const resSpec = maxLv > 1 ? (gm.resolveSkillData(cls.specialSkill.id, maxLv) || cls.specialSkill) : cls.specialSkill;
                              const curP = Math.round((resSpec.power || 1.0) * 100);
                              return (
                              <div className="flex items-start justify-between text-[11px] text-[#ffd54f] pl-2 border-l-2 border-[#ffd54f66]">
                                <div>
                                  <span className="mr-1">{cls.specialSkill.icon || '⚡'}</span>
                                  <span className="font-bold mr-1">★ {tr(cls.specialSkill.name)}</span>
                                  {maxLv > 1 && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55] font-bold mr-1">
                                      Lv.{maxLv} ({curP}%)
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[#cfd8e8]">({tr(resSpec.description)})</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#ffd54f] shrink-0 font-bold ml-1">{resSpec.manaCost} MP</span>
                              </div>
                            );})()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. 👾 몬스터 & 보스 도감 */}
          {(activeTab === 'all' || activeTab === 'monsters') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <span className="font-bold text-sm sm:text-base text-[#ff7043] flex items-center gap-2">
                  <span>👾</span>
                  <span>{tr('심연 몬스터 & 보스 기믹 도감')} ({filteredMonsters.length}{tr('종')})</span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  {tr('1층 ~ 10층 심연의 탑 서식 마물')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMonsters.map(mon => {
                  const typeBadge: Record<string, { label: string; bg: string; color: string; border: string }> = {
                    boss: { label: '👑 BOSS', bg: '#ffd54f22', color: '#ffd54f', border: '#ffd54f55' },
                    elite: { label: '⭐ ELITE', bg: '#ff416c22', color: '#ff416c', border: '#ff416c55' },
                    normal: {
                      label: tr('👾 일반'),
                      bg: '#c8aa6e22',
                      color: '#c8aa6e',
                      border: '#c8aa6e55'
                    }
                  };
                  const badge = typeBadge[mon.type] || { label: mon.type, bg: '#222d42', color: '#cfd8e8', border: '#334460' };

                  return (
                    <div
                      key={mon.id}
                      onClick={() => setDetailData({
                        title: tr(mon.name),
                        subtitle: `Lv.${mon.level} • [${tr(MONSTER_FACTION_META[mon.faction]?.label || '마물')}] ${tr(mon.description)}`,
                        categoryBadge: { label: tr(badge.label), bg: badge.bg, color: badge.color, border: badge.border },
                        icon: <span className="text-3xl">{mon.type === 'boss' ? '👑' : mon.type === 'elite' ? '⭐' : '👾'}</span>,
                        content: (
                          <div className="flex flex-col gap-4">
                            {/* 마물 기본 능력치 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#0a101d] rounded-xl border border-[#1e2f4c]">
                              <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('최대 HP')}</span><span className="text-base font-bold text-[#ef5350]">{mon.maxHp.toLocaleString()}</span></div>
                              <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('공격력 (ATK)')}</span><span className="text-base font-bold text-[#ff7043]">{mon.atk}</span></div>
                              <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('방어력 (DEF)')}</span><span className="text-base font-bold text-[#ffd54f]">{mon.def}</span></div>
                              <div className="flex flex-col"><span className="text-[11px] text-[#8b9bb4]">{tr('속도 (SPD)')}</span><span className="text-base font-bold text-[#c8aa6e]">{mon.spd}</span></div>
                            </div>

                            {/* 사용 스킬 및 기믹 패턴 */}
                            {mon.skills && mon.skills.length > 0 && (
                              <div className="flex flex-col gap-2.5">
                                <span className="font-bold text-sm text-[#ff7043] flex items-center gap-1.5">
                                  <span>⚔️</span>
                                  <span>{tr('사용 스킬 & 특수 공격 패턴')} ({mon.skills.length}{tr('개')})</span>
                                </span>
                                <div className="flex flex-col gap-2">
                                  {mon.skills.map((sk, idx) => (
                                    <div key={idx} className="p-3.5 rounded-xl bg-[#14161c] border border-[#22334f] flex flex-col gap-1">
                                      <div className="font-bold text-sm sm:text-base text-white">
                                        {tr(sk.name)}
                                      </div>
                                      <div className="text-sm text-[#cfd8e8] leading-relaxed">
                                        {tr(sk.description)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 격파 보상 */}
                            {mon.rewards && (
                              <div className="p-4 rounded-xl bg-[#0e1913] border border-[#1b3d22] flex flex-col gap-1.5">
                                <span className="font-bold text-sm text-[#38ef7d] flex items-center gap-1.5">
                                  <span>🎁</span>
                                  <span>{tr('토벌 전리품 보상')}</span>
                                </span>
                                <div className="text-sm sm:text-base text-[#cfd8e8] font-mono flex items-center justify-between">
                                  <span>🪙 {mon.rewards.gold.toLocaleString()}G • ✨ {mon.rewards.ether.toLocaleString()} {tr('에테르')}</span>
                                  <span className="text-[#38ef7d] font-bold">{tr('경험치')} +{mon.rewards.exp} EXP</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ),
                        footerInfo: `${tr('심연 몬스터 도감')} • ${tr(mon.name)}`
                      })}
                      className="p-3.5 rounded-xl bg-[#111828] border border-[#22334f] flex flex-col gap-2 hover:border-[#ff704388] transition-all cursor-pointer hover:scale-[1.01] group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {mon.type === 'boss' ? '👑' : mon.type === 'elite' ? '⭐' : '👾'}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white group-hover:text-[#ff7043] transition-colors">{tr(mon.name)}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono border"
                                style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                              >
                                {tr(badge.label)}
                              </span>
                              {mon.faction && MONSTER_FACTION_META[mon.faction] && (
                                <span
                                  className="text-[9px] px-1.5 py-0.2 rounded font-bold font-mono border"
                                  style={{
                                    background: `${MONSTER_FACTION_META[mon.faction].color}22`,
                                    color: MONSTER_FACTION_META[mon.faction].color,
                                    borderColor: `${MONSTER_FACTION_META[mon.faction].color}55`
                                  }}
                                >
                                  {MONSTER_FACTION_META[mon.faction].icon} {tr(MONSTER_FACTION_META[mon.faction].label)}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#8b9bb4]">
                              Lv.{mon.level} • {tr(mon.description)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-mono text-[#8b9bb4]">
                          <div>HP {mon.maxHp.toLocaleString()}</div>
                          <div>ATK {mon.atk} • DEF {mon.def} • SPD {mon.spd}</div>
                        </div>
                      </div>

                      {/* 스킬 & 공격 패턴 */}
                      {mon.skills && mon.skills.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-bold text-[#ffd54f]">
                            ⚔️ {tr('사용 스킬 및 기믹:')}
                          </div>
                          {mon.skills.map((sk, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-[#162035] border border-[#233554] text-[10px]">
                              <span className="font-bold text-white mr-1.5">{tr(sk.name)}</span>
                              <span className="text-[#8b9bb4]">{tr(sk.description)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 처치 보상 */}
                      {mon.rewards && (
                        <div className="text-[10px] text-[#cfd8e8] pt-1 border-t border-[#1b2a44] flex items-center justify-between font-mono">
                          <span>🪙 {mon.rewards.gold}G • ✨ {mon.rewards.ether} {tr('에테르')}</span>
                          <span className="text-[#38ef7d]">{tr('경험치')} +{mon.rewards.exp}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. 🏰 영지 시설 도감 */}
          {(activeTab === 'all' || activeTab === 'buildings') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <span className="font-bold text-sm sm:text-base text-[#38ef7d] flex items-center gap-2">
                  <span>🏰</span>
                  <span>{tr('방주 13대 영지 시설 도감')} ({filteredBuildings.length}{tr('동')})</span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  {tr('핵심 기능 및 증축 혜택')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredBuildings.map(b => {
                  const maxLevel = (b as any).maxLevel || 10;
                  const loreTips = BUILDING_LORE_AND_TIPS[b.id as keyof typeof BUILDING_LORE_AND_TIPS];
                  const bLocale = BUILDING_NAMES[b.id]?.[lang] || BUILDING_NAMES[b.id]?.ko;
                  const bName = bLocale?.name || tr(b.name);
                  const bDesc = bLocale?.desc || tr(b.description);
                  return (
                    <div
                      key={b.id}
                      onClick={() => setDetailData({
                        title: bName,
                        subtitle: `${tr('식별자')}: ${b.id} • ${tr('최대 증축')} Lv.${maxLevel}`,
                        categoryBadge: { label: tr('영지 시설'), bg: '#38ef7d22', color: '#38ef7d', border: '#38ef7d55' },
                        icon: <GameIcon name={b.id} icon={b.icon || '🏰'} size={36} />,
                        content: (
                          <div className="flex flex-col gap-4">
                            <div className="text-base sm:text-lg text-white font-medium leading-relaxed bg-[#0d0f14] p-5 rounded-2xl border border-[#1e2c45] shadow-inner">
                              {bDesc}
                            </div>
                            {loreTips?.lore && (
                              <div className="p-4 rounded-xl bg-[#140e1e] border border-[#a855f744] flex flex-col gap-2">
                                <span className="font-bold text-sm text-[#c084fc] flex items-center gap-1.5">
                                  <span>📜</span>
                                  <span>{tr('방주 비사 및 시설 뒷이야기')}</span>
                                </span>
                                <div className="text-sm text-[#e9d5ff] leading-relaxed whitespace-pre-line">
                                  {tr(loreTips.lore)}
                                </div>
                              </div>
                            )}
                            <div className="p-4 rounded-xl bg-[#13151b] border border-[#38ef7d44] flex flex-col gap-2">
                              <span className="font-bold text-sm text-[#38ef7d] flex items-center gap-1.5">
                                <span>💡</span>
                                <span>{tr('시설 증축 및 전략 운영 방안')}</span>
                              </span>
                              <div className="text-sm text-[#cfd8e8] leading-relaxed whitespace-pre-line">
                                {loreTips?.strategy ? tr(loreTips.strategy) : tr('최대 {0}단계까지 증축 가능하며, 레벨이 상승함에 따라 생산량이 비약적으로 증가하거나 새로운 제작 레시피 및 특수 기능이 해금됩니다. 시설 Lv.4부터는 골드 또는 식량 등의 유지비가 부과될 수 있습니다.').replace('{0}', String(maxLevel))}
                              </div>
                            </div>
                          </div>
                        ),
                        footerInfo: `${tr('영지 시설')} • ${bName}`
                      })}
                      className="p-3.5 rounded-xl bg-[#111828] border border-[#22334f] flex flex-col gap-1.5 hover:border-[#38ef7d66] transition-all cursor-pointer hover:scale-[1.01] group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-[#38ef7d18] flex items-center justify-center">
                            <GameIcon name={b.id} icon={b.icon || '🏰'} size={24} />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white group-hover:text-[#38ef7d] transition-colors">{bName}</div>
                            <div className="text-[10px] text-[#8b9bb4]">
                              {tr('최대 증축')}: Lv.{maxLevel}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-[#162035] text-[#38ef7d] border border-[#233554]">
                            {b.id}
                          </span>
                          <span className="text-xs text-[#556987] group-hover:text-white transition-colors">🔍</span>
                        </div>
                      </div>
                      <div className="text-xs text-[#cfd8e8] leading-relaxed bg-[#0d0f14] p-2.5 rounded-lg border border-[#1e2c45]">
                        {bDesc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. ⚒️ 장비 & 인챈트 마도석 */}
          {(activeTab === 'all' || activeTab === 'equipment') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <span className="font-bold text-sm sm:text-base text-[#ffd54f] flex items-center gap-2">
                  <span>⚒️</span>
                  <span>{tr('장비 단조 & 마도석 인챈트 도감')}</span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  {tr('단조 레시피')} {filteredEquipment.recipes.length}{tr('종')} • {tr('마도석')} {filteredEquipment.enchants.length}{tr('종')}
                </span>
              </div>

              {/* 장비 레시피 */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-[#ffd54f]">
                  🗡️ {tr('기본 단조 장비')} ({filteredEquipment.recipes.length}{tr('종')})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredEquipment.recipes.map(eq => (
                    <div
                      key={eq.id}
                      onClick={() => setDetailData({
                        title: tr(eq.name),
                        subtitle: `${tr('장비 부위')}: ${eq.slot.toUpperCase()} • ${tr('등급')}: ${tr(eq.rarity)}`,
                        categoryBadge: { label: eq.slot.toUpperCase(), bg: '#c8aa6e22', color: '#c8aa6e', border: '#c8aa6e55' },
                        icon: <GameIcon name={(eq as any).templateId || getEquipmentTemplateId(eq as any) || eq.id} icon={eq.icon || '🛡️'} size={48} />,
                        content: (
                          <div className="flex flex-col gap-4">
                            <div className="text-base sm:text-lg text-white font-medium leading-relaxed bg-[#0d0f14] p-4 rounded-xl border border-[#1e2c45]">
                              {tr(eq.description)}
                            </div>
                            {/* 능력치 보정 */}
                            <div className="p-4 rounded-xl bg-[#13151b] border border-[#22334f] flex flex-col gap-2">
                              <span className="font-bold text-sm text-[#38ef7d] flex items-center gap-1.5">
                                <span>📊</span>
                                <span>{tr('장비 기본 능력치 보정')}</span>
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-mono">
                                {eq.baseStats.atk ? <div className="p-2 rounded bg-[#0a101d] text-[#ef5350] font-bold">ATK +{eq.baseStats.atk}</div> : null}
                                {eq.baseStats.def ? <div className="p-2 rounded bg-[#0a101d] text-[#ffd54f] font-bold">DEF +{eq.baseStats.def}</div> : null}
                                {eq.baseStats.hp ? <div className="p-2 rounded bg-[#0a101d] text-[#66bb6a] font-bold">HP +{eq.baseStats.hp}</div> : null}
                                {eq.baseStats.mp ? <div className="p-2 rounded bg-[#0a101d] text-[#42a5f5] font-bold">MP +{eq.baseStats.mp}</div> : null}
                              </div>
                            </div>
                            {/* 단조 소모 재료 */}
                            {(eq.cost || (eq as any).craftCost) && (
                              <div className="p-4 rounded-xl bg-[#161226] border border-[#3b275e] flex flex-col gap-2">
                                <span className="font-bold text-sm text-[#ce93d8] flex items-center gap-1.5">
                                  <span>⚒️</span>
                                  <span>{tr('단조 필요 재료')}</span>
                                </span>
                                <div className="flex flex-wrap gap-2 text-xs font-mono text-[#cfd8e8]">
                                  {Object.entries(eq.cost || (eq as any).craftCost || {}).map(([mat, count]) => (
                                    <span key={mat} className="px-2.5 py-1 rounded bg-[#0e0c19] border border-[#2b2144]">
                                      {tr(mat)}: {String(count)}{tr('개')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ),
                        footerInfo: `${tr('장비 단조')} • ${tr(eq.name)}`
                      })}
                      className="p-2.5 rounded-lg bg-[#111828] border border-[#22334f] text-[11px] flex flex-col gap-1 hover:border-[#c8aa6e66] transition-all cursor-pointer hover:scale-[1.01] group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5 group-hover:text-[#c8aa6e] transition-colors">
                          <span className="p-0.5 rounded-md bg-[#323d4e] border border-[#4a576d] shrink-0 flex items-center justify-center">
                            <GameIcon name={(eq as any).templateId || getEquipmentTemplateId(eq as any) || eq.id} icon={eq.icon || '🛡️'} size={20} />
                          </span>
                          <span>{tr(eq.name)}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-[#c8aa6e] uppercase">{eq.slot}</span>
                          <span className="text-[9px] text-[#556987] group-hover:text-white transition-colors">🔍</span>
                        </div>
                      </div>
                      <div className="text-[#8b9bb4] text-[10px]">{tr(eq.description)}</div>
                      <div className="text-[10px] font-mono text-[#38ef7d]">
                        ATK +{eq.baseStats.atk || 0} • DEF +{eq.baseStats.def || 0} • HP +{eq.baseStats.hp || 0} • MP +{eq.baseStats.mp || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 인챈트 마도석 */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="text-xs font-bold text-[#ce93d8]">
                  ✨ {tr('인챈트 마도석 옵션')} ({filteredEquipment.enchants.length}{tr('종')})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredEquipment.enchants.map((enc: EnchantOption) => {
                    const slotLabel = enc.targetSlot === 'weapon'
                      ? tr('🗡️ 무기')
                      : enc.targetSlot === 'armor'
                      ? tr('🛡️ 방어구')
                      : enc.targetSlot === 'accessory'
                      ? tr('💍 장신구')
                      : tr('🌐 공용');

                    const slotBg = enc.targetSlot === 'weapon'
                      ? '#ef444422' : enc.targetSlot === 'armor' ? '#3b82f622' : enc.targetSlot === 'accessory' ? '#ec489922' : '#6b728022';
                    const slotColor = enc.targetSlot === 'weapon'
                      ? '#f87171' : enc.targetSlot === 'armor' ? '#60a5fa' : enc.targetSlot === 'accessory' ? '#f472b6' : '#9ca3af';
                    const slotBorder = enc.targetSlot === 'weapon'
                      ? '#ef444444' : enc.targetSlot === 'armor' ? '#3b82f644' : enc.targetSlot === 'accessory' ? '#ec489944' : '#6b728044';

                    const typeLabel = enc.type === 'prefix' ? tr('접두어') : tr('접미어');

                    return (
                      <div
                        key={enc.id}
                        onClick={() => setDetailData({
                          title: `[${tr(enc.name)}] ${tr('인챈트')}`,
                          subtitle: `${tr('부위')}: ${slotLabel} • ${tr('유형')}: ${typeLabel} • ${tr('등급')}: ${enc.rarity.toUpperCase()}`,
                          categoryBadge: { label: typeLabel, bg: '#ce93d822', color: '#ce93d8', border: '#ce93d855' },
                          icon: <span className="text-3xl">✨</span>,
                          content: (
                            <div className="flex flex-col gap-4">
                              <div className="text-base sm:text-lg text-white font-medium leading-relaxed bg-[#161226] p-5 rounded-2xl border border-[#3b275e] shadow-inner">
                                {tr(enc.description)}
                              </div>
                              {enc.grantedSkill && (
                                <div className="p-4 rounded-xl bg-[#0f172a] border border-[#c8aa6e44] flex flex-col gap-2">
                                  <span className="font-bold text-sm text-[#c8aa6e] flex items-center gap-1.5">
                                    <span>⚔️</span>
                                    <span>{tr('인챈트 부여 고유 스킬')}: [{tr(enc.grantedSkill.name)}]</span>
                                  </span>
                                  <div className="text-sm text-[#cfd8e8] leading-relaxed">
                                    {tr(enc.grantedSkill.description)}
                                  </div>
                                </div>
                              )}
                              <div className="p-3.5 rounded-xl bg-[#0e1626] border border-[#1e2f4c] text-xs text-[#8b9bb4]">
                                💡 {tr('병기창에서 마도석을 소비하여 해당 부위의 장비 슬롯에 각인할 수 있습니다.')}
                              </div>
                            </div>
                          ),
                          footerInfo: `${tr('인챈트 마도석')} • ${tr(enc.name)}`
                        })}
                        className="p-2.5 rounded-lg bg-[#161226] border border-[#3b275e] text-[11px] flex flex-col gap-1 hover:border-[#ce93d888] transition-all cursor-pointer hover:scale-[1.01] group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#ce93d8] group-hover:text-white transition-colors">[{tr(enc.name)}]</span>
                            <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold border" style={{ background: slotBg, color: slotColor, borderColor: slotBorder }}>
                              {slotLabel}
                            </span>
                            <span className="text-[10px] text-[#8b9bb4]">({typeLabel})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-[#ffd54f] uppercase">{enc.rarity}</span>
                            <span className="text-[9px] text-[#556987] group-hover:text-white transition-colors">🔍</span>
                          </div>
                        </div>
                        <div className="text-[#cfd8e8]">{tr(enc.description)}</div>
                        {enc.grantedSkill && (
                          <div className="text-[10px] text-[#c8aa6e]">
                            ⚔️ {tr('고유 스킬')}: [{tr(enc.grantedSkill.name)}] {tr(enc.grantedSkill.description)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. 📜 스킬북 & 상태이상 도감 */}
          {(activeTab === 'all' || activeTab === 'skills') && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <span className="font-bold text-sm sm:text-base text-[#c8aa6e] flex items-center gap-2">
                  <span>📜</span>
                  <span>{tr('10대 상태이상 메커니즘 & 마도 비전서 스킬')}</span>
                </span>
              </div>

              {/* 상태이상 목록 */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-[#ffd54f]">
                  💫 {tr('전투 상태이상')} (Status Effects)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSkills.statuses.map(([type, meta]) => (
                    <div
                      key={type}
                      onClick={() => setDetailData({
                        title: `${tr(meta.label)} (${type.toUpperCase()})`,
                        subtitle: tr('전투 상태이상 메커니즘'),
                        categoryBadge: { label: tr('상태이상'), bg: `${meta.color}22`, color: meta.color, border: `${meta.color}55` },
                        icon: <GameIcon name={type} icon={meta.icon} size={32} />,
                        content: (
                          <div className="flex flex-col gap-4">
                            <div className="text-base sm:text-lg text-white font-bold leading-relaxed bg-[#111828] p-5 rounded-2xl border border-[#22334f] shadow-inner">
                              {tr(meta.desc)}
                            </div>
                            <div className="text-sm text-[#cfd8e8] bg-[#0d0f14] p-4 rounded-xl border border-[#1e2c45] leading-relaxed">
                              💡 {tr('전투 중 마물의 스킬이나 아군 장비/스킬의 효과로 해당 상태이상이 부여됩니다. 상태이상 지속 턴 수 동안 해당 패널티 또는 이로운 효과가 틱마다 적용됩니다.')}
                            </div>
                          </div>
                        ),
                        footerInfo: `${tr('상태이상')} • ${tr(meta.label)}`
                      })}
                      className="p-2.5 rounded-lg bg-[#111828] border border-[#22334f] flex items-center justify-between text-[11px] hover:border-[#c8aa6e66] transition-all cursor-pointer hover:scale-[1.01] group"
                    >
                      <div className="flex items-center gap-2.5">
                        <GameIcon name={type} icon={meta.icon} size={22} className="shrink-0" />
                        <div>
                          <span className="font-bold group-hover:text-white transition-colors" style={{ color: meta.color }}>{tr(meta.label)}</span>
                          <div className="text-[10px] text-[#8b9bb4]">{tr(meta.desc)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-[#5a6a85] uppercase">{type}</span>
                        <span className="text-[9px] text-[#556987] group-hover:text-white transition-colors">🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ⚡ 상태이상 스킬 연계 콤보 */}
              {filteredSkills.combos.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="text-xs font-bold text-[#38ef7d] flex items-center justify-between">
                    <span>⚡ {tr('상태이상 스킬 연계 콤보 메커니즘')} ({filteredSkills.combos.length}{tr('종')})</span>
                    <span className="text-[10px] text-[#8b9bb4]">{tr('상태이상 대상에게 일치 태그 스킬로 공격 시 폭발')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredSkills.combos.map((c) => (
                      <div
                        key={c.comboName}
                        onClick={() => setDetailData({
                          title: `${c.icon} ${tr(c.comboName)}`,
                          subtitle: `${tr('발동 조건')}: ${tr('적')} [${tr(c.triggerStatus)}] ${tr('상태')}`,
                          categoryBadge: { label: tr('스킬 연계 콤보'), bg: `${c.bannerColor}22`, color: c.bannerColor, border: `${c.bannerColor}55` },
                          icon: <span className="text-3xl">{c.icon}</span>,
                          content: (
                            <div className="flex flex-col gap-4">
                              <div className="text-base sm:text-lg text-white font-bold leading-relaxed bg-[#111828] p-5 rounded-2xl border border-[#22334f] shadow-inner">
                                {tr(c.fullDesc)}
                              </div>
                              <div className="p-4 rounded-xl bg-[#0e1626] border border-[#1e2f4c] flex flex-col gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#8b9bb4]">{tr('필요 적 상태이상')}:</span>
                                  <span className="font-bold text-[#ffd54f] px-2 py-0.5 rounded bg-[#ffd54f22] border border-[#ffd54f44]">
                                    {tr(c.triggerStatus)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  <span className="text-[#8b9bb4]">{tr('필요 스킬 태그')}:</span>
                                  {c.requiredTagIds.map(tId => {
                                    const tMeta = getTagMeta(tId);
                                    return (
                                      <span
                                        key={tId}
                                        className="px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[11px]"
                                        style={{ backgroundColor: tMeta.bg, color: tMeta.text, border: `1px solid ${tMeta.border}` }}
                                      >
                                        <span>{tMeta.icon}</span>
                                        <span>{tMeta.label}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="text-xs text-[#cfd8dc] bg-[#0a1220] p-3.5 rounded-xl border border-[#1e2c45] leading-relaxed">
                                {tr('적에게 {0} 상태가 부여되어 있을 때, 해당 태그가 부여된 스킬이나 기본 공격을 가하면 즉시 연계 콤보가 폭발합니다.').replace('{0}', tr(c.triggerStatus))}
                              </div>
                            </div>
                          ),
                          footerInfo: `${tr('스킬 연계 콤보')} • ${tr(c.comboName)}`
                        })}
                        className="p-2.5 rounded-lg bg-[#111828] border border-[#22334f] flex flex-col justify-between gap-1.5 text-[11px] hover:border-[#c8aa6e66] transition-all cursor-pointer hover:scale-[1.01] group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-base">{c.icon}</span>
                            <span className="text-white group-hover:text-[#c8aa6e] transition-colors">{tr(c.comboName)}</span>
                          </div>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                            style={{ backgroundColor: `${c.bannerColor}18`, color: c.bannerColor, border: `1px solid ${c.bannerColor}44` }}
                          >
                            {tr(c.triggerStatus)}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#cfd8dc] leading-tight">
                          {tr(c.summary)}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {c.requiredTagIds.map(tId => {
                            const tMeta = getTagMeta(tId);
                            return (
                              <span
                                key={tId}
                                className="text-[9px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5"
                                style={{ backgroundColor: tMeta.bg, color: tMeta.text, border: `1px solid ${tMeta.border}` }}
                              >
                                <span>{tMeta.icon}</span>
                                <span>{tr(tMeta.label)}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🔥 전술 모멘텀 & FEVER 뱃지 시스템 */}
              {filteredSkills.feverBadges.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="text-xs font-bold text-[#ffd54f] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>🔥</span>
                      <span>{tr('전술 모멘텀 FEVER 뱃지')} ({filteredSkills.feverBadges.length}{tr('종')})</span>
                    </span>
                    <span className="text-[10px] text-[#8b9bb4]">{tr('전투 중 특정 전술 행동 시 획득, 5개 완충 시 궁극기로 FEVER 폭발')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredSkills.feverBadges.map((b) => (
                      <div
                        key={b.type}
                        onClick={() => setDetailData({
                          title: `${b.icon} ${tr(b.label)} (${tr(b.shortLabel)})`,
                          subtitle: tr('전술 모멘텀 FEVER 뱃지'),
                          categoryBadge: { label: tr('FEVER 뱃지'), bg: b.bg, color: b.color, border: b.borderColor },
                          icon: <span className="text-3xl">{b.icon}</span>,
                          content: (
                            <div className="flex flex-col gap-4">
                              <div className="text-base sm:text-lg text-white font-bold leading-relaxed bg-[#111828] p-5 rounded-2xl border border-[#22334f] shadow-inner">
                                {tr(b.description)}
                              </div>
                              <div className="p-4 rounded-xl bg-[#0e1626] border border-[#1e2f4c] flex flex-col gap-2.5 text-xs text-[#cfd8e8]">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#8b9bb4]">{tr('뱃지 종류')}:</span>
                                  <span className="font-bold px-2 py-0.5 rounded font-mono" style={{ backgroundColor: b.bg, color: b.color, border: `1px solid ${b.borderColor}` }}>
                                    {tr(b.label)} ({tr(b.shortLabel)})
                                  </span>
                                </div>
                                <div className="leading-relaxed">
                                  {tr('전투 중 해당 조건이 달성되면 파티 공용 FEVER 게이지 슬롯에 뱃지가 즉시 적립됩니다.')}
                                </div>
                                <div className="leading-relaxed text-[#ffd54f]">
                                  {tr('★ 뱃지가 5개 가득 찼을 때 영웅이 궁극기를 발동하면 조합에 따른 강력한 시너지가 폭발합니다.')}
                                </div>
                                <div className="leading-relaxed text-[#80d8ff]">
                                  {tr('🔄 5개가 채워진 상태에서 새 뱃지를 얻으면 맨 앞의 오래된 뱃지가 밀려나며 실시간으로 최종 시너지가 갱신됩니다.')}
                                </div>
                              </div>
                            </div>
                          ),
                          footerInfo: `${tr('전술 모멘텀')} • ${tr(b.label)}`
                        })}
                        className="p-2.5 rounded-lg bg-[#111828] border border-[#22334f] flex flex-col justify-between gap-1.5 text-[11px] hover:border-[#ffd54f66] transition-all cursor-pointer hover:scale-[1.01] group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-2 font-bold">
                            <span className="text-base">{b.icon}</span>
                            <span className="text-white group-hover:text-[#ffd54f] transition-colors">{tr(b.label)}</span>
                          </div>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                            style={{ backgroundColor: b.bg, color: b.color, border: `1px solid ${b.borderColor}` }}
                          >
                            {tr(b.shortLabel)}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#cfd8dc] leading-tight">
                          {tr(b.description)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 전술 비전서 스킬북 */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="text-xs font-bold text-[#c8aa6e]">
                  📖 {tr('전술 마도 비전서')} ({filteredSkills.books.length}{tr('종')})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSkills.books.map(sb => {
                    const affMeta = getSkillAffinityMeta(sb.affinity);
                    const gm = GameManager.getInstance();
                    const heroesWithSkill = [...(gm.barracks || []), ...(gm.party || [])];
                    const maxHeroLv = heroesWithSkill.reduce((max, h) => Math.max(max, h.skillLevels?.[sb.skill.id] || 1), 1);
                    const maxBookLv = (gm.skillBookInventory || []).filter(b => b.id === sb.id).reduce((max, b) => Math.max(max, b.level || 1), 1);
                    const currentLv = Math.max(maxHeroLv, maxBookLv);
                    const resSk = currentLv > 1 ? (gm.resolveSkillData(sb.skill.id, currentLv) || sb.skill) : sb.skill;
                    const baseP = Math.round((sb.skill.power || 1.0) * 100);
                    const curP = Math.round((resSk.power || 1.0) * 100);
                    return (
                    <div
                      key={sb.id}
                      onClick={() => setDetailData({
                        title: tr(sb.name),
                        subtitle: `${tr('등급')}: ${sb.rank.toUpperCase()} • ${tr('전수 스킬')}: ${tr(resSk.name)}${currentLv > 1 ? ` (Lv.${currentLv})` : ''}`,
                        categoryBadge: { label: sb.rank.toUpperCase(), bg: '#c8aa6e22', color: '#c8aa6e', border: '#c8aa6e55' },
                        icon: <GameIcon name={sb.id || sb.skill.id} icon={sb.icon} size={36} />,
                        content: (
                          <div className="flex flex-col gap-4">
                            <div className="text-base sm:text-lg text-white font-medium leading-relaxed bg-[#10192e] p-5 rounded-2xl border border-[#1d3557] shadow-inner">
                              {tr(sb.description)}
                            </div>
                            {/* ⚔️ 계열 적합도 안내 배너 */}
                            <div
                              className="p-3 rounded-xl border flex flex-col gap-1 text-xs"
                              style={{ backgroundColor: affMeta.bg, borderColor: affMeta.borderColor }}
                            >
                              <div className="flex items-center gap-1.5 font-bold" style={{ color: affMeta.color }}>
                                <span className="text-base">{affMeta.icon}</span>
                                <span>{tr(affMeta.name)}</span>
                              </div>
                              <div className="text-[11px] text-[#cfd8dc] leading-relaxed">
                                {tr(affMeta.description)}
                              </div>
                              {affMeta.id !== 'universal' && (
                                <div className="text-[10px] text-[#ff8a80] font-bold mt-0.5">
                                  {tr('⚠️ 비적합 클래스가 장착/사용 시 전투 중 위력이 50% 반감됩니다.')}
                                </div>
                              )}
                            </div>
                            <div className="p-4 rounded-xl bg-[#131f38] border border-[#243e6d] flex flex-col gap-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-bold text-sm sm:text-base text-[#ffd54f] flex items-center gap-1.5 flex-wrap">
                                  <span>📖</span>
                                  <span>{tr('전수 스킬')}: [{tr(resSk.name)}]</span>
                                  {currentLv > 1 && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55] font-bold">
                                      Lv.{currentLv} ({tr('위력')} {curP}%{curP !== baseP ? ` / ${tr('초기')} ${baseP}%` : ''})
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs font-mono font-bold text-[#c8aa6e] bg-[#c8aa6e18] px-2.5 py-1 rounded border border-[#c8aa6e44]">
                                  {resSk.manaCost} MP • {tr('쿨타임')} {resSk.cooldown}{tr('턴')}
                                </span>
                              </div>
                              <div className="text-sm text-white leading-relaxed">
                                {tr(resSk.description)}
                              </div>
                            </div>
                            <div className="text-xs text-[#8b9bb4] p-3 rounded-lg bg-[#0d0f14] border border-[#1e2c45]">
                              {tr('💡 성채 용병 관리 창에서 용병에게 전수하여 새로운 액티브 스킬 슬롯을 개방할 수 있습니다.')}
                            </div>
                          </div>
                        ),
                        footerInfo: `${tr('마도 비전서')} • ${tr(sb.name)}`
                      })}
                      className="p-2.5 rounded-lg bg-[#10192e] border border-[#1d3557] flex flex-col gap-1 text-[11px] hover:border-[#c8aa6e66] transition-all cursor-pointer hover:scale-[1.01] group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-[#c8aa6e] transition-colors">
                          <GameIcon name={sb.id || sb.skill.id} icon={sb.icon} size={18} />
                          <span>{tr(sb.name)}</span>
                          {currentLv > 1 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d55] font-bold">
                              Lv.{currentLv}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ backgroundColor: affMeta.bg, color: affMeta.color, border: `1px solid ${affMeta.borderColor}` }}
                          >
                            {tr(affMeta.shortName)}
                          </span>
                          <span className={"text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border " + (
                            sb.rank === 'epic'
                              ? 'bg-[#ce93d822] text-[#ce93d8] border-[#ce93d855]'
                              : sb.rank === 'mythic'
                              ? 'bg-[#ffd54f22] text-[#ffd54f] border-[#ffd54f55]'
                              : sb.rank === 'rare'
                              ? 'bg-[#c8aa6e22] text-[#c8aa6e] border-[#c8aa6e44]'
                              : sb.rank === 'enhanced'
                              ? 'bg-[#66bb6a22] text-[#66bb6a] border-[#66bb6a44]'
                              : 'bg-[#9e9e9e22] text-[#9e9e9e] border-[#9e9e9e44]'
                          )}>
                            {sb.rank}
                          </span>
                          <span className="text-[9px] text-[#556987] group-hover:text-white transition-colors">🔍</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#8b9bb4]">{tr(sb.description)}</div>
                      <div className="text-[10px] text-[#ffd54f] font-mono flex items-center justify-between pt-0.5 border-t border-[#1d3557]">
                        <span className="flex items-center gap-1">
                          <span>{tr('전수')}: {tr(resSk.name)}</span>
                          {currentLv > 1 && <span className="text-[#38ef7d] font-bold">[{curP}%]</span>}
                        </span>
                        <span>{resSk.manaCost} MP • {resSk.cooldown}{tr('턴')}</span>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            </div>
          )}

          {/* 6. 🗺️ 시스템 & 핵심 가이드 */}
          {(activeTab === 'all' || activeTab === 'systems') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <span className="font-bold text-sm sm:text-base text-[#ffd54f] flex items-center gap-2">
                  <span>🗺️</span>
                  <span>{tr('핵심 룰 & 시스템 가이드')} ({filteredSystems.length}{tr('건')})</span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">
                  {tr('전투 상성, 전열/후열, 유대, 위험도, 유지비')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredSystems.map(sys => (
                  <div
                    key={sys.id}
                    onClick={() => setDetailData({
                      title: tr(sys.title),
                      subtitle: `${tr('카테고리')}: ${tr(sys.category)}`,
                      categoryBadge: { label: tr(sys.category), bg: '#ffd54f22', color: '#ffd54f', border: '#ffd54f55' },
                      icon: <span className="text-3xl">{sys.icon}</span>,
                      content: (
                        <div className="flex flex-col gap-4">
                          <div className="text-base sm:text-lg text-[#ffd54f] font-bold leading-relaxed bg-[#1b172a] p-5 rounded-2xl border border-[#3b2d56] shadow-inner">
                            {tr(sys.summary)}
                          </div>
                          <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#0c101c] border border-[#1e2a40]">
                            <span className="font-bold text-sm text-[#c8aa6e]">
                              {tr('세부 가이드 & 룰 설명:')}
                            </span>
                            {sys.details.map((dt, idx) => (
                              <div key={idx} className="text-sm sm:text-base text-[#cfd8e8] flex items-start gap-2 leading-relaxed">
                                <span className="text-[#c8aa6e] shrink-0 font-bold">•</span>
                                <span>{tr(dt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                      footerInfo: `${tr('시스템 가이드')} • ${tr(sys.title)}`
                    })}
                    className="p-4 rounded-xl bg-[#111828] border border-[#22334f] flex flex-col gap-2 hover:border-[#ffd54f66] transition-all cursor-pointer hover:scale-[1.01] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white flex items-center gap-2 group-hover:text-[#ffd54f] transition-colors">
                        <span>{sys.icon}</span>
                        <span>{tr(sys.title)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffd54f18] text-[#ffd54f] border border-[#ffd54f44]">
                          {tr(sys.category)}
                        </span>
                        <span className="text-xs text-[#556987] group-hover:text-white transition-colors">🔍 {tr('확대')}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#ffd54f] font-medium">
                      {tr(sys.summary)}
                    </div>
                    <div className="flex flex-col gap-1 pt-1 border-t border-[#1b2a44]">
                      {sys.details.map((dt, idx) => (
                        <div key={idx} className="text-[11px] text-[#cfd8e8] flex items-start gap-1.5">
                          <span className="text-[#c8aa6e] shrink-0">•</span>
                          <span>{tr(dt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색 결과가 없을 때 */}
          {totalResultsCount === 0 && (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">🔎</span>
              <div className="text-sm font-bold text-white">
                {tr("'{0}'에 대한 검색 결과가 없습니다.").replace('{0}', searchTerm)}
              </div>
              <div className="text-xs text-[#8b9bb4]">
                {tr('다른 키워드나 명칭을 입력해 보세요.')}
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#1d273d] hover:bg-[#2c3b5c] text-xs text-[#c8aa6e] transition-colors"
              >
                {tr('검색어 초기화')}
              </button>
            </div>
          )}

        </div>

        {/* 하단 닫기 & 다운로드 푸터 */}
        <div className="px-4 py-2.5 sm:px-6 bg-[#111728] border-t border-[#1f2d48] flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                try {
                  const res = exportEncyclopediaToHtml(lang, tr);
                  if (res.success) {
                    setDownloadFeedback(tr('다운로드 완료!'));
                    setTimeout(() => setDownloadFeedback(null), 3000);
                  } else {
                    alert(`${tr('다운로드 실패')}: ${res.error || 'Unknown error'}`);
                  }
                } catch (e: any) {
                  console.error('Failed to export encyclopedia HTML:', e);
                  alert(`${tr('다운로드 중 오류가 발생했습니다.')}: ${e?.message || ''}`);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                downloadFeedback
                  ? 'bg-[#10b98144] text-[#a7f3d0] border border-[#10b981]'
                  : 'bg-gradient-to-r from-[#10b98122] to-[#c8aa6e22] hover:from-[#10b98133] hover:to-[#c8aa6e33] text-[#38ef7d] hover:text-[#5ef599] border border-[#10b98166] hover:shadow-[0_0_12px_rgba(56,239,125,0.25)]'
              }`}
              title={tr('현재 설정된 언어의 독립형 HTML 백과사전 문서를 로컬 파일로 다운로드합니다.')}
            >
              <span>{downloadFeedback ? '✓' : '📥'}</span>
              <span>{downloadFeedback || tr('백과사전 HTML 다운로드')}</span>
            </button>
            <div className="text-[11px] text-[#8b9bb4] font-mono hidden md:block">
              Limbo Ark Encyclopedia v0.9.9-rc10
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#c8aa6e22] hover:bg-[#c8aa6e33] text-[#c8aa6e] border border-[#c8aa6e66] text-xs font-bold transition-all cursor-pointer"
          >
            {tr('닫기 (ESC)')}
          </button>
        </div>

      </div>

      {/* 개별 패널 상세 확대 모달 */}
      {detailData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 animate-fade-in">
          {/* 오버레이 백드롭 */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setDetailData(null)}
          />

          {/* 상세 팝업 컨테이너 */}
          <div className="relative w-full max-w-xl max-h-[88dvh] bg-[#0d0f14] border-2 border-[#c8aa6e88] rounded-2xl shadow-[0_15px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-[#e2e8f0]">
            
            {/* 상단 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#131d33] via-[#0f172a] to-[#0a101d] border-b border-[#223554] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {detailData.icon && (
                  <div className="p-2 rounded-xl bg-[#323d4e] border border-[#4a576d] flex items-center justify-center shrink-0 shadow-md">
                    {detailData.icon}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      {tr(detailData.title)}
                    </h3>
                    {detailData.categoryBadge && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border"
                        style={{
                          background: detailData.categoryBadge.bg || '#c8aa6e22',
                          color: detailData.categoryBadge.color || '#c8aa6e',
                          borderColor: detailData.categoryBadge.border || '#c8aa6e44'
                        }}
                      >
                        {tr(detailData.categoryBadge.label)}
                      </span>
                    )}
                  </div>
                  {detailData.subtitle && (
                    <p className="text-xs text-[#8b9bb4] mt-0.5 font-medium">
                      {tr(detailData.subtitle)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setDetailData(null)}
                className="p-2 rounded-xl bg-[#1b263b] hover:bg-[#253552] text-[#8b9bb4] hover:text-white transition-colors cursor-pointer text-sm shrink-0"
              >
                ✕
              </button>
            </div>

            {/* 본문 내용 (큰 폰트 & 가독성 최적화 스크롤) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm sm:text-base leading-relaxed">
              {detailData.content}
            </div>

            {/* 하단 푸터 */}
            <div className="px-5 py-3 bg-[#090e18] border-t border-[#1e2e4a] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#8b9bb4] font-mono">
                {tr(detailData.footerInfo || '방주 백과사전 상세 열람')}
              </span>
              <button
                onClick={() => setDetailData(null)}
                className="px-5 py-1.5 rounded-xl bg-[#c8aa6e22] hover:bg-[#c8aa6e33] text-[#c8aa6e] border border-[#c8aa6e66] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
              >
                {tr('확인 (닫기)')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
