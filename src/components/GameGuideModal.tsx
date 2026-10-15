import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

type GuideTab = 'lore' | 'citadel' | 'explore' | 'battle' | 'classes' | 'tips';

export const GameGuideModal: React.FC<Props> = ({ open, onClose }) => {
  const [tab, setTab] = useState<GuideTab>('lore');
  const { lang } = useI18n();

  if (!open) return null;

  const tabLabels: Record<GuideTab, { icon: string; ko: string; en: string; ja: string }> = {
    lore: { icon: '🌌', ko: '세계관 & 대서사', en: 'Lore & Grand Saga', ja: '世界観と大叙事詩' },
    citadel: { icon: '🏰', ko: '성채 거점 & 시설', en: 'Citadel & Facilities', ja: '城塞拠点と施設' },
    explore: { icon: '🎒', ko: '출정 & 탐험 시스템', en: 'Expedition & Exploration', ja: '出征と探検システム' },
    battle: { icon: '⚔️', ko: '전투 & 유대·인챈트', en: 'Combat & Enchantment', ja: '戦闘と絆・付魔' },
    classes: { icon: '👑', ko: '용병단 & 20종 전직', en: 'Mercenaries & 20 Classes', ja: '傭兵団と20種転職' },
    tips: { icon: '💡', ko: '지휘관 공략 & FAQ', en: 'Strategy & FAQ', ja: '指揮官攻略とFAQ' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2.5 sm:p-5 animate-fade-in backdrop-blur-md">
      <div
        className="relative w-full max-w-[860px] h-[94vh] max-h-[920px] bg-[#0c111d] border-2 border-[#00d2ff55] rounded-2xl flex flex-col shadow-2xl overflow-hidden shadow-[#00d2ff20]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── 📖 모달 최상단 헤더 ── */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#070b14] border-b border-[#1f2b42] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1.5 rounded-xl bg-[#00d2ff15] border border-[#00d2ff44]">📖</span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-[#00d2ff] font-cinzel tracking-wide">
                  {lang === 'en' ? 'Ark Survival Master Compendium' : lang === 'ja' ? '方舟生存公式マスター大百科' : '방주 생존 공식 마스터 대백과'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00d2ff22] text-[#00d2ff] font-mono font-bold border border-[#00d2ff44]">
                  v0.9.7 Master Edition
                </span>
              </div>
              <div className="text-xs sm:text-sm text-[#8b9bb4] mt-0.5 font-medium">
                {lang === 'en'
                  ? 'Project Limbo : Tales of the Ark • Lore Saga, Citadel Rebuilding, Exploration, Battle & Promotion Guide'
                  : lang === 'ja'
                  ? 'プロジェクト・リンボ : 方舟の物語 • 世界観大叙事詩・拠点再建・探検/戦闘/転職完全攻略'
                  : '프로젝트 림보 : 방주의 이야기 • 세계관 대서사 & 영지 재건 & 탐험/전투/전직 완벽 공략'}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost text-xs px-3 py-1.5 hover:bg-[#c560601f] font-bold rounded-lg flex items-center gap-1"
            style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
            onClick={onClose}
          >
            <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
            <span style={{ color: '#c56060' }}>{lang === 'en' ? 'Close' : lang === 'ja' ? '閉じる' : '닫기'}</span>
          </button>
        </div>

        {/* ── 📑 세분화된 6개 카테고리 탭 바 (고가시성 폰트 & 버튼) ── */}
        <div className="flex gap-1.5 p-2.5 bg-[#090e1a] border-b border-[#1f2b42] shrink-0 overflow-x-auto select-none">
          {(Object.keys(tabLabels) as GuideTab[]).map(k => {
            const t = tabLabels[k];
            const label = lang === 'en' ? t.en : lang === 'ja' ? t.ja : t.ko;
            return (
              <button
                key={k}
                className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  tab === k
                    ? 'bg-gradient-to-r from-[#00b4db] to-[#0083b0] text-white shadow-lg shadow-[#00d2ff33] border border-[#00e5ff88] scale-[1.02]'
                    : 'bg-[#111726] text-[#8b9bb4] hover:text-white hover:bg-[#182238] border border-[#1e2a40]'
                }`}
                onClick={() => setTab(k)}
              >
                <span>{t.icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 📜 메인 가이드 콘텐츠 뷰어 (가시성 최우선 폰트 & 넉넉한 줄간격) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 text-sm sm:text-base text-[#cfd8e8] leading-relaxed font-sans">

          {/* ══════════════════════════════════════════════════════════════
              탭 1: 🌌 세계관 & 방주의 대서사 (The Grand Saga - 풀페이지 서사)
             ══════════════════════════════════════════════════════════════ */}
          {tab === 'lore' && (
            <div className="flex flex-col gap-5 animate-fade-in">
              
              {/* 대서사 메인 배너 카드 */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#191428] via-[#120f20] to-[#0d0a17] border-2 border-[#a742f566] shadow-xl shadow-[#a742f515] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🌌</span>
                  <div>
                    <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#e0b0ff] tracking-wide">
                      침묵의 심연과 최후의 부유 요새, 방주 성채(Ark Citadel)
                    </h2>
                    <span className="text-xs text-[#ce93d8] font-mono font-semibold">
                      THE CHRONICLES OF LIMBO : THE SAGA OF HUMANITY\'S LAST DAWN
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#21183855] border-l-4 border-[#ce93d8] text-[#f3e5f5] text-sm sm:text-base italic leading-relaxed">
                  "태양이 영겁의 어둠 속에 삼켜지고, 대륙 전체가 광기와 침식의 검은 바다 [림보(Limbo)] 속으로 가라앉은 그날.<br />
                  멸망의 흑무(黑霧)를 뚫고 공중으로 날아오른 유일한 희망의 방주가 있었다.<br />
                  인류의 마지막 요람, <strong>방주 성채(Ark Citadel)</strong>.<br />
                  그러나 성채의 심장을 유지하던 여신의 성화는 꺼져가고, 심연의 바닥에서는 잠든 고대 군주들이 깨어나 성채를 끌어내리려 한다."
                </div>

                <div className="text-sm sm:text-base text-[#cfd8e8] leading-relaxed space-y-2">
                  <p>
                    지휘관님은 인류 최후의 생존자들을 이끌고 방주 성채를 총괄 지휘하는 <strong>결사대 최고 사령관</strong>입니다.
                  </p>
                  <p>
                    당신의 사명은 명확합니다. 심연의 마물들에게 잠식당해 마비된 <strong>13대 성채 영지 시설</strong>을 재건하고, 
                    생존자들의 안식처를 마련하며, 정예 결사대를 심연의 탑 밑바닥으로 급파하여 
                    <strong>잃어버린 에테르 동력핵과 태초의 모노리스</strong>를 되찾아 인류의 새로운 여명을 밝히는 것입니다.
                  </p>
                </div>
              </div>

              {/* 심연 10개 층계의 구조와 서사적 여정 */}
              <div className="p-5 rounded-2xl bg-[#0f1626] border border-[#00d2ff44] flex flex-col gap-3.5">
                <div className="flex items-center justify-between border-b border-[#1e2d48] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗺️</span>
                    <h3 className="text-base sm:text-lg font-bold text-[#00d2ff]">
                      심연의 탑 10개 층계와 2대 시나리오 챕터
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#00d2ff15] text-[#00d2ff] font-bold border border-[#00d2ff33]">
                    10 Floors Progression
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 챕터 1 */}
                  <div className="p-4 rounded-xl bg-[#131b2e] border border-[#233554] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base text-[#ffd54f]">👑 챕터 1: 심연의 태동 (1F ~ 5F)</span>
                      <span className="text-[11px] font-mono text-[#8b9bb4]">입문 ~ 중급</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#8b9bb4] leading-relaxed">
                      1층 침묵의 회랑부터 시작하여 3층 에테르 광맥을 거쳐, 5층 고대 제단에 도사린 <strong>[공허의 침식자]</strong>를 토벌하는 여정입니다.
                      승리 시 성채의 기본 동력이 되는 태초의 모노리스 핵을 회수하고 챕터 2 심층 구역으로 통하는 대균열이 개방됩니다.
                    </p>
                  </div>

                  {/* 챕터 2 */}
                  <div className="p-4 rounded-xl bg-[#19152b] border border-[#7c3aed44] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base text-[#ce93d8]">💀 챕터 2: 심연 심층부 (6F ~ 10F)</span>
                      <span className="text-[11px] font-mono text-[#8b9bb4]">상급 ~ 엔드게임</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#8b9bb4] leading-relaxed">
                      6층 핏빛 나락, 7층 망각의 묘지, 8층 기사단의 무덤을 지나 10층 심연의 옥좌에 안치된 <strong>[심연의 군주 아스모데우스]</strong>를 마주합니다.
                      심연의 정수와 전설 유물들이 잠들어 있는 극한의 무대입니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 지휘관과 함께하는 초기 결사대 영웅 */}
              <div className="p-5 rounded-2xl bg-[#0e1424] border border-[#22314d] flex flex-col gap-3">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>🛡️</span>
                  <span>방주를 수호하는 초기 2인의 결사대원</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#131d30] border border-[#223352] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-white">아이리스 (Iris)</div>
                        <div className="text-xs text-[#00d2ff] font-bold">견습 기사 • 전열 탱커</div>
                      </div>
                    </div>
                    <p className="text-xs text-[#8b9bb4] leading-relaxed mt-1">
                      새벽의 방패. 아군을 대신해 적의 맹공을 받아내며 보호막과 자가 치유로 전선을 결사 방어합니다.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#131d30] border border-[#223352] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🗡️</span>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-white">시안 (Cyan)</div>
                        <div className="text-xs text-[#66bb6a] font-bold">도적 • 중앙 척후/속도딜러</div>
                      </div>
                    </div>
                    <p className="text-xs text-[#8b9bb4] leading-relaxed mt-1">
                      그림자 추적자. 전광석화 같은 행동속도(SPD)로 선제권을 잡고 적의 급소를 찔러 치명타와 출혈을 유발합니다.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#131d30] border border-[#ffb30044] bg-gradient-to-br from-[#131d30] to-[#1f1a10] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🍸</span>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-[#ffd54f]">3번째 동료 영입</div>
                        <div className="text-xs text-[#ffd54f] font-bold">방랑자의 라운지 (고용)</div>
                      </div>
                    </div>
                    <p className="text-xs text-[#cfd8e8] leading-relaxed mt-1">
                      방랑자의 라운지를 건설하고 세 번째 용병을 계약 영입하여 3인 정규 원정대를 완성하고 첫 탐험을 출진하세요!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              탭 2: 🏰 성채 거점 & 13대 핵심 시설 (Citadel & Facilities)
             ══════════════════════════════════════════════════════════════ */}
          {tab === 'citadel' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="p-4 sm:p-5 rounded-xl bg-[#101728] border border-[#00d2ff44] flex flex-col gap-2">
                <div className="text-base sm:text-lg font-bold text-[#00d2ff] flex items-center justify-between">
                  <span>🏰 방주 성채(Citadel) 영지 발전 & 건물 해금 체계</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">13대 시설 완비</span>
                </div>
                <p className="text-sm text-[#cfd8dc]">
                  시설의 해금은 던전 층수에 종속되지 않고, <strong>기초 생산 시설 건설 및 레벨업, 시스템 1회 체험</strong> 등의 영지 발전 퀘스트를 통해 자연스럽게 순차적으로 개방됩니다.
                </p>
              </div>

              {/* 13대 건물 리스트 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  { icon: '🔥', name: '방주의 성화', role: '5단계 점화 온기 버프', desc: '영목을 공급해 5분간 생산량 +15%, 전투 EXP +20%, 영지 용병 지속 회복(6초당 HP/MP +1)을 부여합니다. (유지비 완전 면제)' },
                  { icon: '🏕️', name: '생존자 안식처', role: '골드 세금 정기 수급', desc: '피난민들이 거주하며 13초마다 방주 국고에 골드(세금)를 자동으로 납부합니다. (Lv.6 손익분기점, Lv.7+ 레벨당 30% 복리 증산, Lv.4+ 식량 유지비)' },
                  { icon: '🌲', name: '영목 벌채소', role: '목재 자동 생산', desc: '방주의 영목을 9초마다 벌채하여 목재를 공급합니다. (Lv.4+ 골드 유지비, Lv.5+ 점진 감면: Lv.5 -7% ~ Lv.10 -42%)' },
                  { icon: '⛏️', name: '에테르 광맥 시추소', role: '석재 & 철광 채굴', desc: '석재를 11초마다 정기 생산하며, Lv.3부터 철광석도 함께 채굴합니다. (Lv.5+ 골드 감면, Lv.7+ 30% 감축 및 식량 유지비 분담)' },
                  { icon: '⚗️', name: '심연 생체 정제소', role: '식량 & 가죽 정제', desc: '마물 사체를 정제하여 13초마다 식량을 생산하며, Lv.3부터 가죽을 추출합니다. (80% 증산 특화 & Lv.5 [대량 배급제] 전 식량 유지비 30%~35% 감면)' },
                  { icon: '🍺', name: '방랑자의 라운지', role: '용병 영입 & 서브 의뢰 & 식량', desc: '방랑 용병을 고용하고 레벨에 따라 강화되는 서브 의뢰를 수주하며, Lv.5부터 15초마다 식량을 자체 조달(Lv.5: 3, Lv.7: 7, Lv.9: 10)합니다. (Lv.4+ 골드 유지비)' },
                  { icon: '⚒️', name: '심연의 병기창', role: '장비 제조 & 인챈트', desc: '무기/방어구를 단조하고 +3강 접두석, +7강 접미석, +10강 순수 마도석을 부여합니다. (Lv.4+ 목재 2배, Lv.6+ 석재 2배, Lv.8+ 철제 3배, Lv.4+ 에테르 및 골드 보조 유지비)' },
                  { icon: '✨', name: '영혼의 제단', role: '1·2차 전직 & EXP 증폭', desc: '1·2차 상위 직업 승격을 수행하며, Lv.2~5는 기본 클래스 EXP(+20%~50%), Lv.6~10은 1차 각성 클래스 EXP(+10%~40%), Lv.10 전원 올스탯 +10%를 증폭합니다. (Lv.4+ 에테르 유지비)' },
                  { icon: '🧪', name: '에테르 연금 공방', role: '에테르 생산 & 마도서 제본', desc: '에테르를 15초마다 정기 생산하고 마도서를 제본/강화(+10강)하며, Lv.6 시 [에테르 환류관]으로 마도 에테르 유지비 25%를 영구 감면합니다. (Lv.4+ 골드/식량 유지비)' },
                  { icon: '🏥', name: '생체 복원 병동', role: '부상병 입원 및 치료', desc: '전투 중 부상당한 용병을 병상에 입원시켜 완치시킵니다. (1~3레벨 틱당 식량 2, 4레벨부터 식량 1 및 MP 충전(에테르 1) 해금, 병상 최대 7개)' },
                  { icon: '⚖️', name: '황혼의 블랙 마켓', role: '자원 환전 & 비전서 거래', desc: '15종 자원을 골드로 환전하고 15초마다 상업 골드를 수급하며, 유지비 주기를 +1초/Lv 연장하고 Lv.5 시 [상업 네트워크]로 전 골드 유지비 25%를 영구 감면합니다. (Lv.3+ 건설자원 50% 증가, Lv.5+ 석재 30% 감축)' },
                  { icon: '🏛️', name: '방주 중앙 병참고', role: '군수 물자 대용량 보관', desc: '27종의 모든 원자재와 무기, 방어구, 전리품을 안전하게 보관 및 적재 한도를 확장합니다. (Lv.1~10 소량의 골드 유지비 소모)' },
                  { icon: '🌀', name: '차원 앵커 게이트', role: '비동기 PVP & 월드 레이드', desc: '비동기 랭킹 결투, Lv.3 네메시스 월드 레이드, Lv.6 5인 영지 침공 및 명예 상점 1~10단계를 제공합니다. (Lv.4+ 에테르 유지비)' },
                ].map((b, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#0e1424] border border-[#1f2c42] flex items-start gap-3">
                    <span className="text-2xl p-1.5 rounded-lg bg-[#141c2e] border border-[#223350] shrink-0 mt-0.5">{b.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white flex items-center justify-between flex-wrap gap-1">
                        <span className="text-sm sm:text-base">{b.name}</span>
                        <span className="text-xs text-[#00d2ff] font-mono font-bold bg-[#00d2ff15] px-1.5 py-0.5 rounded">{b.role}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#8b9bb4] mt-1 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              탭 3: 🎒 출정 & 탐험 시스템 (Exploration & Preparation)
             ══════════════════════════════════════════════════════════════ */}
          {tab === 'explore' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              
              {/* 1. 출정 채비실과 배낭 시스템 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#111726] border border-[#00d2ff44] flex flex-col gap-3">
                <div className="text-base sm:text-lg font-bold text-[#00d2ff] flex items-center justify-between">
                  <span>🎒 1. 출정 채비실 & 던전 임시 보관함(배낭)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">Pre-Descent Prep</span>
                </div>
                <div className="text-sm sm:text-base text-[#cfd8e8] space-y-2">
                  <p>
                    • <strong>배낭 용량 선택</strong>: <strong>가벼운 백팩(12칸) / 표준 군장(16칸) / 완전 군장(20칸)</strong> 중 선택하여 출정합니다.
                  </p>
                  <p>
                    • <strong>필수 소모품 6종</strong>: <strong>🔥 횃불</strong>(시야/위험도 완화), <strong>🍖 식량</strong>(야영 체력/마나 35% 회복), <strong>⛏️ 곡괭이</strong>(광맥 정밀 채굴), <strong>🗝️ 던전 열쇠</strong>(석관/상자 안전 개방), <strong>🩹 붕대</strong>(함정 방호 및 야영 시 모든 디버프 치료), <strong>💧 정화의 성수</strong>(제단 완전 축성).
                  </p>
                  <p>
                    • <strong>심연 촉매 4종</strong>: <strong>🧭 차원의 나침반</strong>(용병 긴급 이송 1턴 단축 & 차원 포탈 발견↑), <strong>📜 피의 서약서</strong>(골드 전리품 2배 & 강적 출현↑), <strong>📯 차원의 호각</strong>(전멸 시 배낭 10~50% 회수), <strong>🐸 황금 두꺼비</strong>(자원 즉시 골드 환전).
                  </p>
                </div>
              </div>

              {/* 2. 3단계 상호작용 선택지 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#ffd54f44] flex flex-col gap-3">
                <div className="text-base sm:text-lg font-bold text-[#ffd54f] flex items-center justify-between">
                  <span>🎁 2. 던전 이벤트 3단계 상호작용 선택지</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold">Interactive Choices</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#38ef7d33]">
                    <div className="font-bold text-[#38ef7d] mb-1">① 🗝️ 도구 사용 (안전)</div>
                    <div className="text-[#8b9bb4]">
                      열쇠, 곡괭이, 성수, 붕대 등을 소모하여 <strong>100% 안전하게 2배의 보상과 에테르</strong>를 수급합니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#ef535033]">
                    <div className="font-bold text-[#ef5350] mb-1">② 🔨 맨손/강제 시도 (위험)</div>
                    <div className="text-[#8b9bb4]">
                      도구 없이 무력/마력으로 강행 돌파합니다. 일정 확률로 성공하지만 <strong>함정, 파편 반동, 위험도 상승</strong>을 감수합니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#9e9e9e33]">
                    <div className="font-bold text-[#cfd8dc] mb-1">③ 🚶 안전 포기 (지나침)</div>
                    <div className="text-[#8b9bb4]">
                      위험 오브젝트를 건드리지 않고 안전하게 통과하여 파티의 체력을 보존합니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 위험도 기반 3단계 확률 밸런스 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#171324] border border-[#a742f544] flex flex-col gap-2.5">
                <div className="text-base sm:text-lg font-bold text-[#ce93d8] flex items-center justify-between">
                  <span>🎲 3. 심연 위험도(Danger) 기반 3단계 탐색 확률</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#a742f522] text-[#ce93d8] font-bold">Dynamic Probability</span>
                </div>
                <div className="text-xs sm:text-sm text-[#cfd8dc] space-y-1.5">
                  <div>• <strong>🟢 저위험 구간 (0% ~ 35%)</strong>: <strong>아무 일 없음 50%</strong>, 몬스터 조우 25%, 오브젝트 이벤트 25% (모달 방해 없이 쾌적한 연속 탐색 진행)</div>
                  <div>• <strong>🟡 중위험 구간 (35% ~ 70%)</strong>: 아무 일 없음 34%, 몬스터 조우 33%, 오브젝트 이벤트 33% (1/3 균등 분배)</div>
                  <div>• <strong>🔴 고위험 구간 (70% ~ 100%)</strong>: <strong>몬스터 조우 50%</strong>, 아무 일 없음 25%, 오브젝트 이벤트 25% (위험도 100% 도달 시 확정보스 출현)</div>
                  <div>• <strong>🏰 전리품 귀환 정산</strong>: 성채 복귀 시 <strong>[원정 귀환 전리품 정산 보고서]</strong> 모달이 팝업되어 골드/자원/발굴 장비 전량을 안전 입고합니다.</div>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              탭 4: ⚔️ 전투 시스템 & 유대·인챈트 (Battle & Synergy)
             ══════════════════════════════════════════════════════════════ */}
          {tab === 'battle' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              
              {/* 전투 기본 메커니즘 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#131926] border border-[#00d2ff44] flex flex-col gap-2.5">
                <div className="text-base sm:text-lg font-bold text-[#00d2ff] flex items-center justify-between">
                  <span>⚔️ 1. 속도(SPD) 기반 턴제 배틀 & 3열 포지션</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">Speed-Turn Combat</span>
                </div>
                <div className="text-xs sm:text-sm text-[#cfd8dc] space-y-1.5">
                  <p>• <strong>속도(SPD) 선제권</strong>: 아군과 적군의 속도 수치에 따라 턴 큐가 자동 정렬되며, 행동속도가 빠른 영웅이 먼저 스킬을 시전합니다.</p>
                  <p>• <strong>3열 포지션 보너스</strong>: 
                    <br />&nbsp;&nbsp;• <strong>🛡️ 전열 (Front)</strong>: 받는 물리 피해 10% 감소 (탱커 최적)
                    <br />&nbsp;&nbsp;• <strong>🗡️ 중열 (Mid)</strong>: 치명타율 +5% 및 명중률 보정 (근접/원거리 딜러)
                    <br />&nbsp;&nbsp;• <strong>🪄 후열 (Back)</strong>: 스킬 위력 +10% 및 어그로 감소 (마법사/힐러/총사)
                  </p>
                </div>
              </div>

              {/* 영혼의 유대 5단계 시스템 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#1f1528] border border-[#e040fb44] flex flex-col gap-3">
                <div className="text-base sm:text-lg font-bold text-[#f06292] flex items-center justify-between">
                  <span>💖 2. 영혼의 유대(Bond) 5단계 특전 & 소외감 시스템</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#e040fb22] text-[#f06292] font-bold">Soul Bond Perks</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-lg bg-[#140e1f] border border-[#e040fb33]">
                    <div className="font-bold text-[#f48fb1] mb-0.5">Lv.1 유대 (Bond 30) : 동료애</div>
                    <div className="text-[#8b9bb4]">최대 HP +5% 및 야영 휴식 시 회복량 +5% 상승.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#140e1f] border border-[#e040fb33]">
                    <div className="font-bold text-[#f48fb1] mb-0.5">Lv.2 유대 (Bond 60) : 전술적 호흡</div>
                    <div className="text-[#8b9bb4]">공격/스킬 시전 시 25% 확률로 유대 동료가 원호 공격(80% 위력).</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#140e1f] border border-[#e040fb33]">
                    <div className="font-bold text-[#f48fb1] mb-0.5">Lv.3 유대 (Bond 90) : 굳건한 신뢰</div>
                    <div className="text-[#8b9bb4]">행운 +8 & 동료 빈사(HP 25% 이하) 시 즉시 [50 HP 보호막] 전개.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#140e1f] border border-[#e040fb33]">
                    <div className="font-bold text-[#f48fb1] mb-0.5">Lv.4 유대 (Bond 120) : 사선의 맹세</div>
                    <div className="text-[#8b9bb4]">모든 능력치 +10% & 치사 피해를 입었을 때 1회 [1 HP]로 생존(불굴).</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#140e1f] border border-[#e040fb33] sm:col-span-2">
                    <div className="font-bold text-[#f48fb1] mb-0.5">Lv.5 유대 (Bond 150) : 영혼의 결속</div>
                    <div className="text-[#8b9bb4]">공/방 +15% & 전투 개시 시 유대 150 달성자 마나(MP) 30% 회복 (파티 전원 상호 최대 유대 시 50% 회복).</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#ef535015] border border-[#ef535033] text-xs text-[#ff8a80]">
                  💔 <strong>소외감 페널티</strong>: 파티원 중 2명은 유대가 깊고 본인만 고립된 경우 소외 상태가 되어 <strong>모든 능력치 감소 페널티</strong>를 받습니다. 야영을 통해 유대를 골고루 쌓아주세요.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#38ef7d11] border border-[#38ef7d33] text-[#c8e6c9] space-y-1">
                    <div className="font-bold text-[#81c784] flex items-center gap-1">📈 유대감 상승 조건</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#a5d6a7]">
                      <li><strong>사선 생환 & 탐험 정산</strong>: 사선을 함께 넘고 성채로 생환 시 전우애 상승 (신입과 더욱 빠르게 성장)</li>
                      <li><strong>모닥불 야영과 교감</strong>: 야영 중 모닥불 앞에서 담소를 나누며 파티 전원 유대감 대폭 상승</li>
                      <li><strong>소외 대원 포용</strong>: 선임 대원들이 소외된 신입 대원을 따뜻하게 품어줄 때 유대감 급격 상승</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#e5393511] border border-[#e5393533] text-[#ffcdd2] space-y-1">
                    <div className="font-bold text-[#e57373] flex items-center gap-1">📉 유대감 하락 조건</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#ef9a9a]">
                      <li><strong>중간 위험도 탐색 피로</strong>: 주의 수준의 던전 위험도 탐색 시 피로와 스트레스로 확률적 하락</li>
                      <li><strong>위험 레벨의 공포 & 패닉</strong>: 위험 수준 초과 시 어둠의 압박과 의심, 패닉으로 확정적 지속 하락</li>
                      <li><strong>사경(Near-Death) 생환 트라우마</strong>: 치명상으로 죽음의 문턱을 넘나든 대원의 정신적 상흔으로 대폭 하락</li>
                      <li><strong>야영 중 소외와 고립</strong>: 결속에 끼지 못하고 겉돌며 느끼는 마음의 거리로 인한 하락</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 장비 단조 & +10강 인챈트 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#141b22] border border-[#ffd54f44] flex flex-col gap-2.5">
                <div className="text-base sm:text-lg font-bold text-[#ffd54f] flex items-center justify-between">
                  <span>⚒️ 3. 심연 장비 단조 & 3단계 인챈트 마도석</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#ffd54f22] text-[#ffd54f] font-bold">Equipment Enchanting</span>
                </div>
                <div className="text-xs sm:text-sm text-[#cfd8dc] space-y-1.5">
                  <p>• <strong>+3 강화 (접두석 부여)</strong>: 공격력/방어력 % 증폭 접두사 옵션 부여 (1~2F 파밍)</p>
                  <p>• <strong>+7 강화 (접미석 부여)</strong>: 치명타/속도/마나소모 감소 접미사 옵션 부여 (3~5F 파밍)</p>
                  <p>• <strong>+10 강화 (순수 마도석 결속)</strong>: 고유 신화 특수 옵션 각성 (보스 오버차지 전리품)</p>
                </div>
              </div>

              {/* 🏷️ 무기 6종 고유 특성 뱃지(Weapon Traits) 완전 해설 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#151c2e] border border-[#00d2ff55] flex flex-col gap-3">
                <div className="text-base sm:text-lg font-bold text-[#00d2ff] flex items-center justify-between">
                  <span>🏷️ 4. 무기 6종 고유 특성(Weapon Traits) & 전투 활용</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">Weapon Mastery</span>
                </div>
                <p className="text-xs text-[#90a4ae]">
                  착용한 무기 종류에 따라 고유한 특성 뱃지가 부여되며, 전투 시 차별화된 특수 메커니즘이 발동합니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#ff525244] flex flex-col gap-1">
                    <div className="font-bold text-[#ff5252] flex items-center justify-between">
                      <span>🗡️ [베기] 검 계열 (Sword)</span>
                      <span className="text-[10px] text-[#ff8a80]">상처 절개</span>
                    </div>
                    <div className="text-[#cfd8dc]">
                      <strong>기본 공격 시</strong> 대상이 [출혈] 상태라면 [상처 절개]가 발동하여 <strong>20% 추가 물리 피해</strong>를 입힙니다. 출혈 스킬을 지닌 도적/전사와 최고의 궁합을 자랑합니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#ff980044] flex flex-col gap-1">
                    <div className="font-bold text-[#ff9800] flex items-center justify-between">
                      <span>🔱 [방어 파쇄] 창 계열 (Spear)</span>
                      <span className="text-[10px] text-[#ffb74d]">보호막 붕괴</span>
                    </div>
                    <div className="text-[#cfd8dc]">
                      적의 단단한 <strong>보호막(Shield)에 50% 증폭 피해</strong>를 입힙니다. 두꺼운 보호막을 두르고 출현하는 골렘 및 정예 마물을 단숨에 무력화할 수 있습니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#69f0ae44] flex flex-col gap-1">
                    <div className="font-bold text-[#69f0ae] flex items-center justify-between">
                      <span>🏹 [급소] 활 계열 (Bow)</span>
                      <span className="text-[10px] text-[#a7ffeb]">정밀 사격</span>
                    </div>
                    <div className="text-[#cfd8dc]">
                      <strong>치명타율 +5% 및 치명타 피해 +5%</strong>가 상시 가산됩니다. 후열에서 적의 약점을 노려 일격필살의 치명 피해를 꽂아넣습니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#00e5ff44] flex flex-col gap-1">
                    <div className="font-bold text-[#00e5ff] flex items-center justify-between">
                      <span>🔫 [연사] 마총 계열 (Gun)</span>
                      <span className="text-[10px] text-[#80d8ff]">마도 점사</span>
                    </div>
                    <div className="text-[#cfd8dc]">
                      <strong>기본 15% 확률 + 영웅의 행운(🍀) 보정치</strong>로 45% 위력의 <strong>[추가 점사 탄환]</strong>을 연속 격발합니다. 행운 스탯이 높을수록 연사 빈도가 비약적으로 상승합니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#b388ff44] flex flex-col gap-1">
                    <div className="font-bold text-[#b388ff] flex items-center justify-between">
                      <span>⚡ [암습] 단검 계열 (Dagger)</span>
                      <span className="text-[10px] text-[#d1c4e9]">속도 우위</span>
                    </div>
                    <div className="text-[#cfd8dc]">
                      대상 마물보다 <strong>행동 속도가 빠를수록 피해량이 최대 20%까지 증폭</strong>됩니다. 민첩한 그림자 계열 영웅의 폭발적인 기습 딜링을 보장합니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0e1424] border border-[#e040fb44] flex flex-col gap-1">
                    <div className="font-bold text-[#e040fb] flex items-center justify-between">
                      <span>🪄 [공명] 지팡이 계열 (Staff)</span>
                      <span className="text-[10px] text-[#f8bbd0]">마나 절감</span>
                    </div>
                    <div className="text-[#cfd8dc]">
                      에테르 순환을 최적화하여 모든 액티브 전투 스킬의 <strong>마나(MP) 소모량을 5% 상시 절감</strong>합니다. 장기전에서 아군 마법사의 마나 유지력을 안정적으로 지켜줍니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* ⚡ 스마트 자동 전투 AI & 2.0배속 가속 */}
              <div className="p-4 rounded-xl bg-[#0f192a] border border-[#38ef7d44] flex flex-col gap-2">
                <div className="text-sm sm:text-base font-bold text-[#38ef7d] flex items-center justify-between">
                  <span>⚡ 5. 2.0배속 스마트 자동 전투 AI 가이드</span>
                  <span className="text-xs font-mono text-[#81c784] font-bold">Auto Combat 2.0x</span>
                </div>
                <div className="text-xs text-[#b0bec5] space-y-1">
                  <div>• <strong>2.0배속 전투 연출</strong>: 전투 진행 시 턴 진행 및 전투 애니메이션이 기본 2.0배속 고속으로 쾌적하게 재생됩니다.</div>
                  <div>• <strong>상태이상 폭발 연계 우선</strong>: 적에게 걸린 디버프를 분석하여 6대 상태이상 콤보 폭발이 가능한 스킬을 최우선으로 시전합니다.</div>
                  <div>• <strong>스마트 마무리(막타)</strong>: 일반 공격만으로 처치할 수 있는 잔여 체력의 적에게는 무의미한 스킬 마나 낭비를 방지하고 기본 공격으로 마무리합니다.</div>
                </div>
              </div>

              {/* ⚔️ 차원 아레나 5인 부대 & 피버 콜(Fever Call) 가이드 */}
              <div className="p-4 rounded-xl bg-[#141a2e] border border-[#00d2ff44] flex flex-col gap-2.5">
                <div className="text-sm sm:text-base font-bold text-[#00d2ff] flex items-center justify-between">
                  <span>⚔️ 6. 차원 아레나 5인 부대 & 피버 콜(Fever Call) 결투 가이드</span>
                  <span className="text-xs font-mono text-[#80d8ff] font-bold">Dimensional Arena & Fever Call</span>
                </div>
                <div className="text-xs text-[#b0bec5] space-y-1.5 leading-relaxed">
                  <div>• <strong>5인 차원 결투 부대</strong>: 3인의 선발(전열/중열/후열)과 1인의 전술 오퍼레이터(리더 가호 및 궁극기), 1인의 서포터(원호 공격 및 치유)로 출격하여 속도(SPD) 순서로 턴을 진행합니다 (기본 2.0배속).</div>
                  <div>• <strong>사경(Death's Door) 3턴 유예</strong>: 체력이 0이 된 영웅은 3턴간 사경 상태로 버티며, 힐러나 서포터의 치유로 부활할 수 있습니다. 단, 마지막 생존자가 사경에 돌입하면 즉시 패배합니다.</div>
                  <div>• <strong>피버 콜(Fever Call) 3턴 타임아웃</strong>: 배지 5개를 먼저 채운 쪽이 피버콜을 선언하며, 상대가 3턴 내에 피버를 완성하지 못하면 실격 패배로 선언 측이 부전승을 거둡니다.</div>
                  <div>• <strong>12대 전술 족보 & 주간 상성</strong>: 양측 피버콜 완성 시 전광판 쇼다운이 펼쳐지며, 족보 위계와 주간 차원율(돌파 &gt; 수호 &gt; 변칙 &gt; 돌파) 상성에 따라 승자 오퍼레이터의 궁극기가 폭발합니다.</div>
                  <div>• <strong>투사의 인장 & 명예 암시장</strong>: 승리 및 연승(Streak) 보너스로 투사의 인장을 모아 명예 암시장에서 고티어 장비 보급함을 교환할 수 있습니다.</div>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              탭 5: 👑 용병단 & 20종 상위 전직 (Classes & Promotions)
             ══════════════════════════════════════════════════════════════ */}
          {tab === 'classes' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#00d2ff44] flex flex-col gap-1.5">
                <div className="text-base sm:text-lg font-bold text-[#00d2ff] flex items-center justify-between">
                  <span>👑 7대 기본 직업군 및 20종 상위 전직 계보도</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">Soul Promotion Tree</span>
                </div>
                <p className="text-xs sm:text-sm text-[#8b9bb4]">
                  용병의 레벨과 영혼의 성소(Sanctuary) 퀘스트를 완료하면 상위 클래스로 영혼을 승격시켜 결전 오의 스킬을 해금합니다.
                </p>
              </div>

              {/* 7개 직업군 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                {[
                  {
                    icon: '🛡️', title: '1. 견습 기사 (Squire)', role: '전열 방어 탱커',
                    tree: '견습 기사 ➔ 성기사 / 중장 보병 ➔ 👑 발키리 (Aegis Valkyrie)',
                    desc: '높은 체력과 도발, 전체 신성 보호막, 2차 전직 시 [영원의 성역] 무적 결계를 구사합니다.'
                  },
                  {
                    icon: '🗡️', title: '2. 그림자 수련생 (Rogue)', role: '치명 암살 & 출혈',
                    tree: '그림자 수련생 ➔ 암살자 / 결투사 ➔ 👑 그림자 군주 (Shadow Lord)',
                    desc: '높은 행동속도와 100% 치명타 급습, 적 전체 연막탄 및 암영 난무로 보스를 순식간에 암살합니다.'
                  },
                  {
                    icon: '🪄', title: '3. 견습 마법사 (Mage)', role: '원소 광역 폭격',
                    tree: '견습 마법사 ➔ 원소술사 / 흑마도사 ➔ 👑 대마도사 (Archmage)',
                    desc: '화염/빙결/전격 3대 원소 마법과 메테오 스트라이크로 적 편대 전체를 일망타진합니다.'
                  },
                  {
                    icon: '🌿', title: '4. 견습 사제 (Cleric)', role: '파티 치유 & 성역',
                    tree: '견습 사제 ➔ 주교 / 심판관 ➔ 👑 천상 대주교 (Celestial Hierophant)',
                    desc: '아군 전체 HP 완전 회복, 디버프 정화, 턴당 지속 치유 및 전복 방지 부활의 기적을 행합니다.'
                  },
                  {
                    icon: '🏹', title: '5. 사냥꾼 (Hunter)', role: '원거리 저격 & 관통',
                    tree: '사냥꾼 ➔ 저격수 / 레인저 ➔ 👑 하이퍼 레인저 (Hyper Ranger)',
                    desc: '방어력 무시 정밀 저격과 폭풍 화살비로 적의 핵심 후열 딜러를 원거리에서 저격합니다.'
                  },
                  {
                    icon: '🔫', title: '6. 마도 총사 (Gunner)', role: '마도 중화기 포격',
                    tree: '마도 총사 ➔ 헤비 거너 / 에테르 메카닉 ➔ 👑 아포칼립스 캐논 (Apocalypse Cannon)',
                    desc: '에테르 레일건과 유도 드론 폭격으로 적진 전체의 방어력을 50% 분쇄하는 화력의 정점입니다.'
                  },
                  {
                    icon: '🪓', title: '7. 광전사 (Berserker)', role: '체력 비례 극딜러',
                    tree: '광전사 ➔ 검투사 / 피의 광전사 ➔ 👑 학살자 (Blood Slayer)',
                    desc: '자신의 체력이 낮아질수록 공격력이 기하급수적으로 폭증하며 흡혈 일격으로 자가 회복합니다.'
                  },
                ].map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0e1424] border border-[#1f2c42] flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-[#1f2c42] pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{c.icon}</span>
                        <span className="font-bold text-white text-sm sm:text-base">{c.title}</span>
                      </div>
                      <span className="text-xs text-[#00d2ff] font-bold font-mono">{c.role}</span>
                    </div>
                    <div className="text-xs font-mono text-[#ffd54f] font-semibold">{c.tree}</div>
                    <p className="text-xs text-[#8b9bb4] leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              탭 6: 💡 신임 지휘관 핵심 공략 & FAQ (Master Tips & FAQ)
             ══════════════════════════════════════════════════════════════ */}
          {tab === 'tips' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              
              {/* 6단계 초반 스노우볼링 가이드 */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#142218] border border-[#38ef7d44] flex flex-col gap-2.5">
                <div className="text-base sm:text-lg font-bold text-[#38ef7d] flex items-center justify-between">
                  <span>💡 신임 지휘관 초반 6단계 완벽 생존 & 번영 로드맵</span>
                  <span className="text-xs text-[#81c784] font-mono font-bold">초기 자본: 200G • 목재 50</span>
                </div>
                <p className="text-xs sm:text-sm text-[#a5d6a7]">
                  방주에 부임한 신임 지휘관이 자원 고갈이나 전멸 없이 가장 신속하게 전력을 갖추고 영지를 안정시키는 핵심 6단계 공략입니다.
                </p>
              </div>

              {[
                { step: '1', title: '🧬 기초 4대 채집 시설 건설 ➔ 퀘스트 [보상 수령] 즉시 터치', desc: '목재 20개로 [심연 생체 정제소]를 건설한 뒤 상단 퀘스트 메뉴(📜)에서 번쩍이는 [보상 수령]을 반드시 터치하세요! 연이어 [생존자 안식처](골드), [영목 벌채소](목재), [광맥 시추소](석재/철광)가 차례대로 해금되며 퀘스트 보상으로 넉넉한 초기 자금이 들어옵니다.' },
                { step: '2', title: '📖 초기 지급 비전서 전수 & 진형 세팅 (탱·딜·힐 배치)', desc: '용병단 메뉴에서 기본 지급된 마도 비전서를 전수하세요: 전열 아이리스에게 [강타], 중앙 시안에게 [출혈/암습]을 세팅합니다. 3열 포지션 효과로 전열은 피해 -10%, 중열은 치명타 +5%, 후열은 스킬 위력 +10% 보너스를 받습니다.' },
                { step: '3', title: '🍸 방랑자의 라운지 건설 & 3번째 용병 영입 (3인 정예 결사대 완성)', desc: '시추소 완공 후 [방랑자의 라운지]를 건설하고 성향에 맞는 3번째 용병(사제, 마법사, 총사 등)을 고용하세요. 3인 파티가 완성되어야 심연 회랑 출전이 가능해집니다.' },
                { step: '4', title: '🔥 성화 온기 활성화 & 🌌 침묵의 회랑 1구역 첫 척후 출정', desc: '성화에 목재를 공헌하여 [온기 버프]를 켜두면 생산량 +15% 증산과 거점 회복 효과를 누립니다. 보급품을 챙겨 심연 1구역으로 첫 척후를 파견하세요. 진입 즉시 첫 척후 퀘스트가 달성됩니다.' },
                { step: '5', title: '🏛️ 병기창 & 생체 복원 병동 동시 해금 (이중 테크 전개)', desc: '첫 척후 완료 보상으로 [심연의 병기창]과 [생체 복원 병동]이 동시에 해금됩니다! 병기창에서는 무기 6종의 고유 특성(검: 출혈절개, 창: 쉴드파쇄, 활: 급소치명, 총: 점사)에 맞춰 장비를 단조하고, 부상당한 대원은 생체 병동 병상에 입원시켜 안전하게 회복시키세요.' },
                { step: '6', title: '🏰 안전 귀환의 원칙 & 자원 유지비 체납 방지', desc: '탐험 중 획득한 전리품은 가방에 보관되므로 무리하게 전멸하지 말고 위험도 70% 이상이거나 체력이 부족하면 [성채 귀환]을 눌러 안전 입고하세요! 또한 시설 Lv.4부터는 골드/식량 유지비가 발생하므로 기초 생산량을 충분히 다지며 증축하는 것이 핵심입니다.' },
              ].map((tip, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#0e1424] border border-[#22314d] flex items-start gap-3.5">
                  <span className="w-8 h-8 rounded-xl bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff55] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {tip.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm sm:text-base text-white">{tip.title}</div>
                    <p className="text-xs sm:text-sm text-[#8b9bb4] mt-1 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}

              {/* 자주 묻는 질문 FAQ */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#111726] border border-[#00d2ff33] flex flex-col gap-3 mt-2">
                <h3 className="font-bold text-base text-[#00d2ff] flex items-center gap-2">
                  <span>❓</span>
                  <span>자주 묻는 질문 (FAQ)</span>
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="p-3 rounded-lg bg-[#0a0e1a] border border-[#1e2a40]">
                    <div className="font-bold text-[#ffd54f] mb-1">Q. 탐험 중 얻은 아이템이 성채 창고에 바로 안 들어와요!</div>
                    <div className="text-[#8b9bb4]">
                      A. 탐험 중 획득한 모든 전리품은 <strong>던전 배낭(임시 보관함)</strong>에 저장되며, <strong>[성채 귀환]</strong>을 누르거나 <strong>[귀환 포탈]</strong>을 타고 무사히 귀환했을 때 <strong>전리품 정산 보고서와 함께 성채 창고로 100% 입고</strong>됩니다.
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0e1a] border border-[#1e2a40]">
                    <div className="font-bold text-[#ffd54f] mb-1">Q. 몬스터 전투에서 전멸하면 어떻게 되나요?</div>
                    <div className="text-[#8b9bb4]">
                      A. 출정 시 <strong>[📯 차원의 호각]</strong> 촉매를 장착했다면 전멸 위기 시 구조 신호가 발동하여 배낭 전리품의 10~50%를 랜덤하게 회수하여 복귀합니다. 호각이 없이 전멸하면 배낭의 모든 전리품을 100% 잃어버립니다. (탐험 도중 안전 귀환을 원할 경우 소모품 <strong>[⚓ 균열의 닻]</strong>을 사용하세요)
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0e1a] border border-[#1e2a40]">
                    <div className="font-bold text-[#ffd54f] mb-1">Q. 2차 전직(발키리, 하이퍼레인저 등)은 어떻게 하나요?</div>
                    <div className="text-[#8b9bb4]">
                      A. 용병의 1차 전직 완료 후, 영혼의 성소(Sanctuary)에서 심연 5층 보스 격파 시 얻는 [공허의 파편]과 에테르를 봉헌하여 2차 상위 클래스로 영혼을 최종 승격시킬 수 있습니다.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ── 📌 모달 최하단 푸터 바 ── */}
        <div className="px-5 py-3.5 bg-[#070b14] border-t border-[#1f2b42] shrink-0 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-[#607d8b] font-mono">
            Limbo: Ark of the Abyss Official Master Guide • All Rights Reserved
          </div>
          <button
            className="btn btn-primary text-sm px-6 py-2.5 font-bold shadow-lg shadow-[#00d2ff33] rounded-xl hover:scale-105 transition-all"
            onClick={onClose}
          >
            지침 숙지 완료 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
