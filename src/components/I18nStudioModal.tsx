import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import { I18nService } from '../i18n/I18nService';
import { EXACT_TRANSLATIONS } from '../i18n/translationDictionary';
import { SupportedLanguage } from '../i18n/types';
import { FirebaseService } from '../services/FirebaseService';

interface Props {
  open: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'custom' | 'core_presets';

// 🌟 특별 문자열 프리셋 (자주 감수되는 핵심 시스템 및 전투/로그 용어)
const CORE_PRESETS: { category: string; keys: string[] }[] = [
  {
    category: '시너지 (Synergy)',
    keys: ['시너지', '시너지 효과', '파티 시너지', '원정대 시너지', '원정대 활성 시너지', '시너지 도감', '시너지 상세', '시너지 조합', '발동 시너지', '활성 시너지', '시너지 목록']
  },
  {
    category: '마나 / MP 환급 (Mana Refund)',
    keys: ['mp환급', 'MP환급', 'MP 환급', '후열 MP환급', '후열 MP 환급', '후열 마나환급', '후열 마나 환급', '마나 환급', '마나환급', '환급']
  },
  {
    category: '로그 시스템 (Log System)',
    keys: ['로그', '전체 로그', '전체 로그 보기', '로그 보기', '최신 로그', '최신 로그 보기', '상세 로그', '상세 로그 보기', '전투 로그', '원정 로그', '영지 로그', '시스템 로그', '전투 상세 기록 확인 (전체 로그)']
  },
  {
    category: '피격 및 함정 (Hit & Traps)',
    keys: ['피격', '피격!', '피격됨', '피격자', '피격 시', '피격 즉시', '함정 피격', '함정 피격!', '함정 발동', '전원 피격 — 긴급 상태이상 부여', '피격 환영 반격!']
  },
  {
    category: '몬스터 및 상태 (Monsters & Enrage)',
    keys: ['망각의 유령', '공허의 잠복자', '광폭화', '광폭', '호위', '정예', '우두머리', '광폭화 진 최종 보스 도전', '광폭화 결계']
  }
];

export const I18nStudioModal: React.FC<Props> = ({ open, onClose }) => {
  const isMaster = FirebaseService.getInstance().isMasterUser();
  const i18n = I18nService.getInstance();
  const currentLang = i18n.getLanguage();

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [targetLangFilter, setTargetLangFilter] = useState<'all' | 'en' | 'ja'>('all');

  // 편집 폼 상태
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [inputEn, setInputEn] = useState('');
  const [inputJa, setInputJa] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 알림 메시지 상태
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // 오버라이드 실시간 동기화용 트리거
  const [version, setVersion] = useState(0);

  // JSON 임포트 모달
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');

  // 페이징 (성능 최적화: 수천 개 단어 렌더링 부하 방지)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  // 현재 커스텀 오버라이드 목록
  const customOverrides = useMemo(() => {
    return i18n.getCustomOverrides();
  }, [i18n, version]);

  const showStatus = (text: string, type: 'success' | 'danger' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // 모든 고유 키 수집 (기본 사전 + 커스텀 오버라이드)
  const allEntries = useMemo(() => {
    const keyMap = new Map<string, { key: string; en: string; ja: string; isCustom: boolean }>();

    // 1. 커스텀 오버라이드 키 먼저 등록
    const customKeys = new Set([
      ...Object.keys(customOverrides.en),
      ...Object.keys(customOverrides.ja)
    ]);

    customKeys.forEach(k => {
      keyMap.set(k, {
        key: k,
        en: customOverrides.en[k] ?? EXACT_TRANSLATIONS.en[k] ?? '',
        ja: customOverrides.ja[k] ?? EXACT_TRANSLATIONS.ja[k] ?? '',
        isCustom: true
      });
    });

    // 2. 기본 내장 사전 키 등록 (이미 커스텀에 없으면 isCustom = false)
    if (activeTab !== 'custom') {
      const enKeys = Object.keys(EXACT_TRANSLATIONS.en || {});
      const jaKeys = Object.keys(EXACT_TRANSLATIONS.ja || {});
      const exactKeys = new Set([...enKeys, ...jaKeys]);

      exactKeys.forEach(k => {
        if (!keyMap.has(k)) {
          keyMap.set(k, {
            key: k,
            en: EXACT_TRANSLATIONS.en[k] ?? '',
            ja: EXACT_TRANSLATIONS.ja[k] ?? '',
            isCustom: false
          });
        }
      });
    }

    return Array.from(keyMap.values());
  }, [customOverrides, activeTab]);

  // 검색 및 탭 필터링
  const filteredEntries = useMemo(() => {
    let result = allEntries;

    if (activeTab === 'custom') {
      result = result.filter(e => e.isCustom);
    } else if (activeTab === 'core_presets') {
      const presetKeys = new Set(CORE_PRESETS.flatMap(p => p.keys));
      result = result.filter(e => presetKeys.has(e.key));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(e =>
        e.key.toLowerCase().includes(q) ||
        (e.en && e.en.toLowerCase().includes(q)) ||
        (e.ja && e.ja.toLowerCase().includes(q))
      );
    }

    // 커스텀 감수 항목이 항상 최상단에 오도록 정렬
    result.sort((a, b) => {
      if (a.isCustom !== b.isCustom) return a.isCustom ? -1 : 1;
      return a.key.localeCompare(b.key, 'ko');
    });

    return result;
  }, [allEntries, activeTab, searchTerm]);

  // 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeTab, targetLangFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredEntries.slice(start, start + PAGE_SIZE);
  }, [filteredEntries, page]);

  // 편집 시작
  const handleStartEdit = (entry?: { key: string; en: string; ja: string }) => {
    if (entry) {
      setEditingKey(entry.key);
      setInputKey(entry.key);
      setInputEn(entry.en || '');
      setInputJa(entry.ja || '');
    } else {
      setEditingKey(null);
      setInputKey('');
      setInputEn('');
      setInputJa('');
    }
    setIsFormOpen(true);
  };

  // 편집 저장
  const handleSaveOverride = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      showStatus('한국어 원문 키를 입력해 주세요.', 'danger');
      return;
    }

    i18n.setCustomOverride(trimmed, {
      en: inputEn,
      ja: inputJa,
    });

    setVersion(v => v + 1);
    setIsFormOpen(false);
    showStatus(`✅ [${trimmed}] 번역이 성공적으로 저장 및 실시간 적용되었습니다!`);
  };

  // 오버라이드 삭제 (기본값 복원)
  const handleDeleteOverride = (key: string) => {
    if (!window.confirm(`[${key}] 커스텀 감수 번역을 삭제하고 기본 내장 사전으로 되돌리시겠습니까?`)) {
      return;
    }
    i18n.deleteCustomOverride(key);
    setVersion(v => v + 1);
    showStatus(`🗑️ [${key}] 커스텀 감수가 삭제되었습니다. (기본 번역 복원)`);
  };

  // 전체 초기화
  const handleClearAll = () => {
    if (!window.confirm('⚠️ 등록된 모든 커스텀 번역 감수 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    i18n.clearAllCustomOverrides();
    setVersion(v => v + 1);
    showStatus('🧹 모든 커스텀 번역 감수가 초기화되었습니다.');
  };

  // JSON 클립보드 복사 (내보내기)
  const handleExportJson = () => {
    const jsonStr = i18n.exportCustomOverridesJson();
    navigator.clipboard.writeText(jsonStr).then(() => {
      showStatus('📋 JSON 감수 데이터가 클립보드에 복사되었습니다!');
    }).catch(() => {
      showStatus('클립보드 복사 실패', 'danger');
    });
  };

  // JSON 가져오기
  const handleImportJson = () => {
    if (!jsonInputText.trim()) return;
    const res = i18n.importCustomOverridesJson(jsonInputText);
    if (res.success) {
      setVersion(v => v + 1);
      setJsonImportOpen(false);
      setJsonInputText('');
      showStatus(`🎉 총 ${res.count}개의 감수 항목을 성공적으로 복원했습니다!`);
    } else {
      showStatus(`❌ 복원 실패: ${res.error}`, 'danger');
    }
  };

  if (!open) return null;

  if (!isMaster) {
    return (
      <Modal
        title={
          <div className="flex items-center gap-2 text-[#ef5350] font-bold text-sm">
            <span>⛔</span>
            <span>마스터 계정 전용 (Access Denied)</span>
          </div>
        }
        open={open}
        onClose={onClose}
      >
        <div className="p-6 text-center flex flex-col items-center gap-3">
          <span className="text-4xl">👑</span>
          <div className="text-sm font-bold text-white">
            마스터 계정만 접근할 수 있는 스튜디오입니다.
          </div>
          <div className="text-xs text-[#8b9bb4]">
            i18n 사전 편집 스튜디오는 승인된 마스터(관리자) 계정으로 로그인한 상태에서만 접근할 수 있습니다.
          </div>
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 rounded-lg bg-[#142238] border border-[#1f3557] hover:border-[#ffd54f] text-xs font-bold text-white cursor-pointer"
          >
            확인
          </button>
        </div>
      </Modal>
    );
  }

  const totalCustomCount = Object.keys(customOverrides.en).length + Object.keys(customOverrides.ja).length;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="text-xl">🌐</span>
          <span className="text-sm font-bold text-[#00e5ff]">i18n 사전 편집 & 번역 감수 스튜디오</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00bcd422] text-[#00e5ff] border border-[#00bcd455]">
            MASTER ONLY
          </span>
        </div>
      }
      open={open}
      onClose={onClose}
      maxWidth="max-w-[96vw] sm:max-w-[780px] md:max-w-[880px]"
      maxHeight="max-h-[92dvh]"
      zIndex="z-[80]"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2 text-xs">
          <div className="text-[11px] text-[#8b9bb4] flex items-center gap-2">
            <span>현재 설정 언어:</span>
            <span className="font-bold text-[#f3e5c8] uppercase px-1.5 py-0.5 rounded bg-[#1f2738]">
              {currentLang === 'ko' ? '🇰🇷 한국어' : currentLang === 'en' ? '🇺🇸 English' : '🇯🇵 日本語'}
            </span>
            <span className="text-gray-500">•</span>
            <span>커스텀 감수: <strong className="text-[#00e5ff]">{totalCustomCount}</strong>개</span>
          </div>
          <button className="btn btn-ghost text-xs px-4 py-1.5" onClick={onClose}>
            닫기
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 min-h-0 flex-1">
        {/* 상단 알림 배너 */}
        {statusMsg && (
          <div
            className={`p-2 rounded-lg text-xs flex items-center justify-between animate-fade-in ${
              statusMsg.type === 'danger'
                ? 'bg-[#ff525222] text-[#ff5252] border border-[#ff525255]'
                : 'bg-[#00bcd422] text-[#00e5ff] border border-[#00bcd455]'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button className="text-xs px-1 hover:opacity-80" onClick={() => setStatusMsg(null)}>✕</button>
          </div>
        )}

        {/* 상단 탭 및 도구 모음 */}
        <div className="flex flex-col gap-2 bg-[#10141f] p-2.5 rounded-xl border border-[#1f2738]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* 필터 탭 */}
            <div className="flex items-center gap-1">
              <button
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#00bcd4] text-black shadow-sm'
                    : 'bg-[#182030] text-[#8b9bb4] hover:text-white'
                }`}
                onClick={() => setActiveTab('all')}
              >
                전체 사전 ({allEntries.length})
              </button>
              <button
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'custom'
                    ? 'bg-[#00bcd4] text-black shadow-sm'
                    : 'bg-[#182030] text-[#8b9bb4] hover:text-white'
                }`}
                onClick={() => setActiveTab('custom')}
              >
                <span>⭐ 감수 목록</span>
                <span className={`text-[10px] px-1 rounded-full ${activeTab === 'custom' ? 'bg-black text-cyan-300' : 'bg-[#00bcd433] text-[#00e5ff]'}`}>
                  {allEntries.filter(e => e.isCustom).length}
                </span>
              </button>
              <button
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'core_presets'
                    ? 'bg-[#00bcd4] text-black shadow-sm'
                    : 'bg-[#182030] text-[#8b9bb4] hover:text-white'
                }`}
                onClick={() => setActiveTab('core_presets')}
              >
                🎯 핵심 단어 프리셋
              </button>
            </div>

            {/* 도구 버튼들 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                className="px-2.5 py-1 rounded-lg bg-[#00bcd422] text-[#00e5ff] border border-[#00bcd455] hover:bg-[#00bcd444] text-xs font-bold flex items-center gap-1 cursor-pointer"
                onClick={() => handleStartEdit()}
              >
                <span>➕</span>
                <span>신규 등록</span>
              </button>
              <button
                className="px-2 py-1 rounded-lg bg-[#182030] text-[#8b9bb4] hover:text-white text-xs border border-[#2b3548] cursor-pointer"
                title="감수 데이터 JSON 클립보드 복사"
                onClick={handleExportJson}
              >
                📤 백업
              </button>
              <button
                className="px-2 py-1 rounded-lg bg-[#182030] text-[#8b9bb4] hover:text-white text-xs border border-[#2b3548] cursor-pointer"
                title="JSON 가져오기"
                onClick={() => setJsonImportOpen(true)}
              >
                📥 복원
              </button>
              {totalCustomCount > 0 && (
                <button
                  className="px-2 py-1 rounded-lg bg-[#ff525222] text-[#ff5252] hover:bg-[#ff525244] text-xs border border-[#ff525244] cursor-pointer"
                  title="모든 커스텀 감수 초기화"
                  onClick={handleClearAll}
                >
                  🧹 초기화
                </button>
              )}
            </div>
          </div>

          {/* 검색 바 & 언어 필터 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8b9bb4]">🔍</span>
              <input
                type="text"
                className="w-full bg-[#0a0d14] border border-[#2b3548] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#50607b] focus:outline-hidden focus:border-[#00bcd4]"
                placeholder="한국어 키, 영문 번역, 일문 번역 실시간 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center bg-[#0a0d14] rounded-lg border border-[#2b3548] p-0.5 shrink-0 text-xs">
              <button
                className={`px-2 py-1 rounded text-[11px] font-bold ${targetLangFilter === 'all' ? 'bg-[#1f2738] text-white' : 'text-[#8b9bb4]'}`}
                onClick={() => setTargetLangFilter('all')}
              >
                전체
              </button>
              <button
                className={`px-2 py-1 rounded text-[11px] font-bold ${targetLangFilter === 'en' ? 'bg-[#1f2738] text-[#00bcd4]' : 'text-[#8b9bb4]'}`}
                onClick={() => setTargetLangFilter('en')}
              >
                EN
              </button>
              <button
                className={`px-2 py-1 rounded text-[11px] font-bold ${targetLangFilter === 'ja' ? 'bg-[#1f2738] text-[#ff80ab]' : 'text-[#8b9bb4]'}`}
                onClick={() => setTargetLangFilter('ja')}
              >
                JA
              </button>
            </div>
          </div>
        </div>

        {/* 핵심 단어 프리셋 카테고리 칩 (activeTab === 'core_presets' 일 때 상단 표시) */}
        {activeTab === 'core_presets' && (
          <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-[#0d1522] border border-[#1f2d44]">
            <div className="text-[11px] font-bold text-[#c8aa6e]">🎯 추천 핵심 감수 키워드</div>
            <div className="flex flex-wrap gap-1.5">
              {CORE_PRESETS.map(cat => (
                <div key={cat.category} className="flex items-center gap-1 bg-[#141d2e] px-2 py-1 rounded-lg border border-[#263750] text-xs">
                  <span className="font-bold text-[#00e5ff] text-[11px]">{cat.category}:</span>
                  <div className="flex flex-wrap gap-1">
                    {cat.keys.map(k => (
                      <button
                        key={k}
                        className="px-1.5 py-0.5 rounded bg-[#1e2a3f] hover:bg-[#00bcd433] text-[10px] text-gray-200 hover:text-white transition-colors cursor-pointer"
                        onClick={() => {
                          setSearchTerm(k);
                        }}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 신규 등록 및 수정 편집 패널 (Drawer/Form) */}
        {isFormOpen && (
          <div className="p-3 rounded-xl bg-[#131b29] border border-[#00bcd488] shadow-lg flex flex-col gap-2.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#223147] pb-1.5">
              <div className="font-bold text-xs text-[#00e5ff] flex items-center gap-1.5">
                <span>{editingKey ? '✏️ 감수 번역 수정' : '➕ 신규 특수 번역 등록'}</span>
                {editingKey && <span className="text-[10px] text-gray-400 font-normal font-mono">({editingKey})</span>}
              </div>
              <button
                className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5"
                onClick={() => setIsFormOpen(false)}
              >
                ✕ 닫기
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* 한국어 키 */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#f3e5c8]">
                  한국어 원문 Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="bg-[#0a0d14] border border-[#2b3548] rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#00bcd4]"
                  placeholder="예: 시너지, mp환급, 망각의 유령"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  disabled={!!editingKey}
                />
              </div>

              {/* 영문 번역 */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#00bcd4]">영어 번역 (EN)</label>
                <input
                  type="text"
                  className="bg-[#0a0d14] border border-[#2b3548] rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#00bcd4]"
                  placeholder="예: Synergy, MP Refund, Oblivion Ghost"
                  value={inputEn}
                  onChange={e => setInputEn(e.target.value)}
                />
              </div>

              {/* 일문 번역 */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#ff80ab]">일본어 번역 (JA)</label>
                <input
                  type="text"
                  className="bg-[#0a0d14] border border-[#2b3548] rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#ff80ab]"
                  placeholder="예: シナジー, MP還元, 忘却の幽霊"
                  value={inputJa}
                  onChange={e => setInputJa(e.target.value)}
                />
              </div>
            </div>

            {/* 실시간 미리보기 */}
            {inputKey && (
              <div className="bg-[#0a0d14] p-2 rounded border border-[#1f2738] flex items-center justify-between text-[11px] text-[#8b9bb4]">
                <span className="truncate max-w-[50%]">미리보기: <strong className="text-white">{inputKey}</strong></span>
                <span className="text-[#00bcd4]">EN: {inputEn || '(공백)'}</span>
                <span className="text-[#ff80ab]">JA: {inputJa || '(공백)'}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                className="px-3 py-1 rounded bg-[#1f2738] hover:bg-[#2a364e] text-xs text-gray-300 cursor-pointer"
                onClick={() => setIsFormOpen(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-1 rounded bg-[#00bcd4] hover:bg-[#00acc1] text-xs font-bold text-black cursor-pointer shadow-md"
                onClick={handleSaveOverride}
              >
                저장 및 실시간 적용
              </button>
            </div>
          </div>
        )}

        {/* 사전 목록 테이블 */}
        <div className="flex-1 min-h-[300px] overflow-y-auto flex flex-col gap-1.5 pr-1">
          {paginatedEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8b9bb4] flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🔍</span>
              <span>검색 결과가 없습니다.</span>
              {searchTerm && (
                <button
                  className="text-[#00e5ff] text-xs hover:underline cursor-pointer"
                  onClick={() => handleStartEdit({ key: searchTerm, en: '', ja: '' })}
                >
                  "<strong>{searchTerm}</strong>" 키로 새 번역 직접 등록하기 ➔
                </button>
              )}
            </div>
          ) : (
            paginatedEntries.map(entry => (
              <div
                key={entry.key}
                className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  entry.isCustom
                    ? 'bg-[#0f1b29] border-[#00bcd466] hover:border-[#00bcd4]'
                    : 'bg-[#0e121a] border-[#1c2333] hover:border-[#2e3b55]'
                }`}
              >
                {/* 좌측: 한국어 원문 키 */}
                <div className="flex items-center gap-2 min-w-0 sm:w-1/3">
                  {entry.isCustom ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00bcd422] text-[#00e5ff] border border-[#00bcd455] shrink-0 font-bold">
                      감수
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1f2738] text-gray-400 shrink-0">
                      기본
                    </span>
                  )}
                  <span
                    className="font-bold text-xs text-white truncate cursor-pointer hover:text-[#00e5ff] transition-colors"
                    title={`${entry.key} (클릭하여 편집)`}
                    onClick={() => handleStartEdit(entry)}
                  >
                    {entry.key}
                  </span>
                </div>

                {/* 중앙: 번역 값 (EN / JA) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0 text-xs">
                  {(targetLangFilter === 'all' || targetLangFilter === 'en') && (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1" title={entry.en}>
                      <span className="text-[10px] font-mono text-[#00bcd4] shrink-0 font-bold">EN:</span>
                      <span className={`truncate text-xs ${entry.en ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                        {entry.en || '(미번역)'}
                      </span>
                    </div>
                  )}

                  {(targetLangFilter === 'all' || targetLangFilter === 'ja') && (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1" title={entry.ja}>
                      <span className="text-[10px] font-mono text-[#ff80ab] shrink-0 font-bold">JA:</span>
                      <span className={`truncate text-xs ${entry.ja ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                        {entry.ja || '(미번역)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 우측: 수정 및 복원/삭제 액션 */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    className="px-2 py-1 rounded bg-[#1f2738] hover:bg-[#00bcd433] hover:text-[#00e5ff] text-xs text-gray-300 font-bold transition-all cursor-pointer"
                    onClick={() => handleStartEdit(entry)}
                  >
                    ✏️ 편집
                  </button>
                  {entry.isCustom && (
                    <button
                      className="px-2 py-1 rounded bg-[#ff525222] hover:bg-[#ff525244] text-xs text-[#ff5252] font-bold transition-all cursor-pointer"
                      title="감수 삭제 및 기본 사전 복원"
                      onClick={() => handleDeleteOverride(entry.key)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 페이징 컨트롤 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2 border-t border-[#1f2738] text-xs text-[#8b9bb4]">
            <span>
              총 <strong className="text-white">{filteredEntries.length}</strong>개 항목 중 {((page - 1) * PAGE_SIZE) + 1}~{Math.min(page * PAGE_SIZE, filteredEntries.length)}
            </span>

            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 disabled:pointer-events-none text-xs"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                «
              </button>
              <button
                className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 disabled:pointer-events-none text-xs"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ‹ 이전
              </button>
              <span className="px-2 text-xs font-mono text-white">
                {page} / {totalPages}
              </span>
              <button
                className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 disabled:pointer-events-none text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                다음 ›
              </button>
              <button
                className="px-2 py-1 rounded bg-[#182030] hover:bg-[#202b40] disabled:opacity-40 disabled:pointer-events-none text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON 가져오기 팝업 모달 */}
      {jsonImportOpen && (
        <Modal
          title="📥 i18n 감수 사전 JSON 복원"
          open={jsonImportOpen}
          onClose={() => setJsonImportOpen(false)}
          maxWidth="max-w-[500px]"
          zIndex="z-[90]"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button className="btn btn-ghost text-xs px-3 py-1.5" onClick={() => setJsonImportOpen(false)}>
                취소
              </button>
              <button
                className="btn btn-primary text-xs px-4 py-1.5 font-bold"
                onClick={handleImportJson}
              >
                데이터 복원 적용
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-2 text-xs">
            <p className="text-[#8b9bb4]">
              이전에 백업(Export)한 JSON 텍스트를 아래에 붙여넣으면 기존 감수 사전과 병합하여 저장합니다.
            </p>
            <textarea
              className="w-full h-40 bg-[#0a0d14] border border-[#2b3548] rounded-lg p-2.5 font-mono text-[11px] text-gray-200 focus:outline-hidden focus:border-[#00bcd4]"
              placeholder='{"en": {"시너지": "Synergy"}, "ja": {"시너지": "シナジー"}}'
              value={jsonInputText}
              onChange={e => setJsonInputText(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </Modal>
  );
};
