const fs = require('fs');

const file = 'src/screens/CitadelScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

// 1. SkillBookDetailModal props & buttons
const oldDetailModalHeader = `const SkillBookDetailModal: React.FC<{
  skill: Skill;
  bookItem?: SkillBookItem;
  hero: Mercenary;
  isLearned: boolean;
  slotIndex: number;
  bookLv: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  onClose: () => void;
}> = ({ skill, bookItem, hero, isLearned, slotIndex, bookLv, rarity, onClose }) => {`;

const newDetailModalHeader = `const SkillBookDetailModal: React.FC<{
  skill: Skill;
  bookItem?: SkillBookItem;
  hero: Mercenary;
  isLearned: boolean;
  slotIndex: number;
  bookLv: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  onClose: () => void;
  onUnlearn?: (skill: Skill) => void;
  onAbandon?: (skill: Skill, mastery: number) => void;
}> = ({ skill, bookItem, hero, isLearned, slotIndex, bookLv, rarity, onClose, onUnlearn, onAbandon }) => {`;

if (norm.includes(oldDetailModalHeader)) {
  norm = norm.replace(oldDetailModalHeader, newDetailModalHeader);
  console.log('SkillBookDetailModal header updated!');
} else {
  console.log('oldDetailModalHeader not found');
}

// Update detail modal footer buttons (replace unlearn button and add abandon button)
const oldDetailButtons = `                <button
                  className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033]"
                  onClick={() => {
                    gm.unlearnSkill(hero.id, skill.id);
                    onClose();
                  }}
                >
                  🗑️ 스킬 망각
                </button>
              </>
            ) : (
              <>
                {bookItem && (
                  <ActionButton
                    label={
                      isFullLearned
                        ? '슬롯 가득 참'
                        : \`📖 마도서 연독 (\${currentMastery}% / +\${gainPerBook}%)\`
                    }
                    variant={canLearn ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={!canLearn}
                    onClick={() => {
                      gm.learnSkillFromBook(hero.id, bookItem.id);
                      onClose();
                    }}
                  />
                )}
              </>`;

const newDetailButtons = `                <button
                  className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033]"
                  onClick={() => {
                    if (onUnlearn) onUnlearn(skill);
                    else gm.unlearnSkill(hero.id, skill.id);
                    onClose();
                  }}
                >
                  🗑️ 스킬 망각
                </button>
              </>
            ) : (
              <>
                {currentMastery > 0 && (
                  <button
                    className="btn btn-ghost text-xs px-2.5 py-1.5 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033]"
                    onClick={() => {
                      if (onAbandon) onAbandon(skill, currentMastery);
                      else gm.abandonStudyingSkill(hero.id, skill.id);
                      onClose();
                    }}
                  >
                    🚫 중도 포기
                  </button>
                )}
                {bookItem && (
                  <ActionButton
                    label={
                      isFullLearned
                        ? '슬롯 가득 참'
                        : \`📖 마도서 연독 (\${currentMastery}% / +\${gainPerBook}%)\`
                    }
                    variant={canLearn ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={!canLearn}
                    onClick={() => {
                      gm.learnSkillFromBook(hero.id, bookItem.id);
                      onClose();
                    }}
                  />
                )}
              </>`;

if (norm.includes(oldDetailButtons)) {
  norm = norm.replace(oldDetailButtons, newDetailButtons);
  console.log('detailButtons updated!');
} else {
  console.log('oldDetailButtons not found');
}

// 2. SkillManagerOverlay logic & rendering
const oldOverlayTop = `  const cClass = hero.classId ? CHARACTER_CLASSES[hero.classId] : null;
  const specialId = cClass?.specialSkill?.id;
  const learnedSkills = (hero.learnedSkills || [])
    .filter(sid => sid !== specialId)
    .map(sid => gm.resolveSkillData(sid, hero))
    .filter((s): s is Skill => !!s && !s.isSpecial);
  const equipped = hero.equippedSkills || [];
  const isFullLearned = learnedSkills.length >= 4;`;

const newOverlayTop = `  const [confirmModal, setConfirmModal] = useState<{
    type: 'unlearn' | 'abandon';
    skill: Skill;
    mastery?: number;
  } | null>(null);

  const cClass = hero.classId ? CHARACTER_CLASSES[hero.classId] : null;
  const specialId = cClass?.specialSkill?.id;
  const learnedSkills = (hero.learnedSkills || [])
    .filter(sid => sid !== specialId)
    .map(sid => gm.resolveSkillData(sid, hero))
    .filter((s): s is Skill => !!s && !s.isSpecial);
  const equipped = hero.equippedSkills || [];
  const isFullLearned = learnedSkills.length >= 4;

  // 📖 학습(연독) 중인 스킬 목록 (0 < mastery < 100, 미습득)
  const studyingSkillIds: string[] = [...(hero.studyingSkills || [])]
    .filter(sid => sid !== specialId && !(hero.learnedSkills || []).includes(sid));
  if (hero.skillMastery) {
    Object.keys(hero.skillMastery).forEach(sid => {
      const m = hero.skillMastery?.[sid] || 0;
      if (m > 0 && m < 100 && sid !== specialId && !(hero.learnedSkills || []).includes(sid) && !studyingSkillIds.includes(sid)) {
        studyingSkillIds.push(sid);
      }
    });
  }

  const studyingSkills = studyingSkillIds
    .map(sid => ({
      skill: gm.resolveSkillData(sid, hero),
      mastery: hero.skillMastery?.[sid] || 0,
    }))
    .filter((item): item is { skill: Skill; mastery: number } => !!item.skill && !item.skill.isSpecial);`;

if (norm.includes(oldOverlayTop)) {
  norm = norm.replace(oldOverlayTop, newOverlayTop);
  console.log('SkillManagerOverlay top updated!');
} else {
  console.log('oldOverlayTop not found');
}

// 3. Update learned tab content to include section 1 & section 2
const oldLearnedContent = `        {/* 탭 1: 습득한 스킬 목록 */}
        {tab === 'learned' && (
          <>
            {learnedSkills.length === 0 && (
              <div className="panel p-8 text-center text-[#8b9bb4] text-sm">
                습득한 스킬이 없습니다.<br />
                <span className="text-xs text-[#00d2ff] mt-1 block">[보유 스킬북] 탭에서 새 스킬을 전수받으세요.</span>
              </div>
            )}

            {learnedSkills.map(sk => {
              const bookDef = ALL_SKILL_BOOKS.find(b => b.skill.id === sk.id);
              const matchingBookItem = (skillBooks || []).find(b => b.skill.id === sk.id);
              const bookLv = hero.skillLevels?.[sk.id] || matchingBookItem?.level || 1;
              const rawRarity = matchingBookItem?.rarity || (bookDef ? getSkillBookRarity(bookDef.rank) : 'common');
              const rMeta = GRIMOIRE_RARITY_META[rawRarity] || GRIMOIRE_RARITY_META.common;

              const isEquippedSlot1 = equipped[0] === sk.id;
              const isEquippedSlot2 = equipped[1] === sk.id;
              const isEquippedAny = isEquippedSlot1 || isEquippedSlot2;

              return (
                <div
                  key={sk.id}
                  className={\`panel p-3 rounded-xl flex flex-col gap-2 transition-all cursor-pointer hover:border-[#00d2ff88] group \${
                    isEquippedAny ? 'border-[#00d2ff] bg-[#121c2c]' : 'border-[#222d42] bg-[#131926]'
                  }\`}
                  onClick={() => {
                    setDetailModalItem({
                      skill: sk,
                      bookItem: matchingBookItem,
                      isLearned: true,
                      slotIndex: isEquippedSlot1 ? 0 : isEquippedSlot2 ? 1 : -1,
                      bookLv,
                      rarity: rawRarity,
                    });
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1.5 rounded-lg bg-[#1a2234] border border-[#2b3952] group-hover:scale-105 transition-transform">
                        {sk.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white group-hover:text-[#00d2ff] transition-colors">{sk.name}</span>
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                            style={{ color: rMeta.color, background: rMeta.bg, border: \`1px solid \${rMeta.borderColor}\` }}
                          >
                            {rMeta.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#ffd54f]">
                            Lv.\${bookLv}
                          </span>
                          {isEquippedSlot1 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                              ★ 1번 슬롯
                            </span>
                          )}
                          {isEquippedSlot2 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                              ★ 2번 슬롯
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#cfd8dc] mt-0.5">{sk.description}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-[#64b5f6] font-mono font-bold">{sk.manaCost} MP</span>
                      <span className="text-[9px] text-[#8b9bb4] group-hover:text-[#00d2ff] flex items-center gap-0.5 font-medium">
                        🔍 상세 보기
                      </span>
                    </div>
                  </div>

                  {/* 장착, 강화 & 망각 액션 버튼 그룹 */}
                  <div className="pt-2 border-t border-[#1f2738] flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <button
                        className={\`btn text-xs px-2.5 py-1 font-bold \${isEquippedSlot1 ? 'btn-primary' : 'btn-ghost'}\`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEquippedSlot1) gm.unequipSkillSlot(hero.id, 0);
                          else gm.equipSkillToSlot(hero.id, sk.id, 0);
                        }}
                      >
                        {isEquippedSlot1 ? '✓ 1번 해제' : '1번 장착'}
                      </button>
                      <button
                        className={\`btn text-xs px-2.5 py-1 font-bold \${isEquippedSlot2 ? 'btn-primary' : 'btn-ghost'}\`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEquippedSlot2) gm.unequipSkillSlot(hero.id, 1);
                          else gm.equipSkillToSlot(hero.id, sk.id, 1);
                        }}
                      >
                        {isEquippedSlot2 ? '✓ 2번 해제' : '2번 장착'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn btn-ghost text-xs px-2.5 py-1 text-[#26a69a] hover:bg-[#26a69a22] border border-[#26a69a55] font-bold flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEnhanceTargetSkill(sk);
                        }}
                        title="에테르 연금 공방에서 스킬을 비전 강화합니다"
                      >
                        <span>⚡ 강화</span>
                      </button>
                      <button
                        className="btn btn-ghost text-xs px-2.5 py-1 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033]"
                        onClick={(e) => {
                          e.stopPropagation();
                          gm.unlearnSkill(hero.id, sk.id);
                        }}
                        title="스킬을 망각하여 슬롯을 비웁니다"
                      >
                        🗑️ 망각
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}`;

const newLearnedContent = `        {/* 탭 1: 습득한 스킬 목록 및 학습 중인 스킬 구분 섹션 */}
        {tab === 'learned' && (
          <>
            {/* ── 구분된 섹션 1: ⚔️ 정식 습득 스킬 ── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1 text-xs font-bold text-[#00d2ff]">
                <span className="flex items-center gap-1.5">
                  <span>⚔️ 정식 습득 스킬</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-mono">
                    {learnedSkills.length}/4
                  </span>
                </span>
                <span className="text-[10px] text-[#8b9bb4]">전투 장착 슬롯 2개 지원</span>
              </div>

              {learnedSkills.length === 0 ? (
                <div className="panel p-6 bg-[#0d131f] border border-[#1b2537] rounded-xl text-center text-[#8b9bb4] text-xs">
                  정식 습득 완료된 스킬이 없습니다.<br />
                  <span className="text-[11px] text-[#00d2ff] mt-1 block">아래 [학습 중인 스킬] 또는 [보유 스킬북]에서 연독을 진행하세요.</span>
                </div>
              ) : (
                learnedSkills.map(sk => {
                  const bookDef = ALL_SKILL_BOOKS.find(b => b.skill.id === sk.id);
                  const matchingBookItem = (skillBooks || []).find(b => b.skill.id === sk.id);
                  const bookLv = hero.skillLevels?.[sk.id] || matchingBookItem?.level || 1;
                  const rawRarity = matchingBookItem?.rarity || (bookDef ? getSkillBookRarity(bookDef.rank) : 'common');
                  const rMeta = GRIMOIRE_RARITY_META[rawRarity] || GRIMOIRE_RARITY_META.common;

                  const isEquippedSlot1 = equipped[0] === sk.id;
                  const isEquippedSlot2 = equipped[1] === sk.id;
                  const isEquippedAny = isEquippedSlot1 || isEquippedSlot2;

                  return (
                    <div
                      key={sk.id}
                      className={\`panel p-3 rounded-xl flex flex-col gap-2 transition-all cursor-pointer hover:border-[#00d2ff88] group \${
                        isEquippedAny ? 'border-[#00d2ff] bg-[#121c2c]' : 'border-[#222d42] bg-[#131926]'
                      }\`}
                      onClick={() => {
                        setDetailModalItem({
                          skill: sk,
                          bookItem: matchingBookItem,
                          isLearned: true,
                          slotIndex: isEquippedSlot1 ? 0 : isEquippedSlot2 ? 1 : -1,
                          bookLv,
                          rarity: rawRarity,
                        });
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl p-1.5 rounded-lg bg-[#1a2234] border border-[#2b3952] group-hover:scale-105 transition-transform">
                            {sk.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-white group-hover:text-[#00d2ff] transition-colors">{sk.name}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                                style={{ color: rMeta.color, background: rMeta.bg, border: \`1px solid \${rMeta.borderColor}\` }}
                              >
                                {rMeta.label}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[#ffd54f]">
                                Lv.\${bookLv}
                              </span>
                              {isEquippedSlot1 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                                  ★ 1번 슬롯
                                </span>
                              )}
                              {isEquippedSlot2 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00d2ff22] text-[#00d2ff] font-bold">
                                  ★ 2번 슬롯
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#cfd8dc] mt-0.5">{sk.description}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-[#64b5f6] font-mono font-bold">{sk.manaCost} MP</span>
                          <span className="text-[9px] text-[#8b9bb4] group-hover:text-[#00d2ff] flex items-center gap-0.5 font-medium">
                            🔍 상세 보기
                          </span>
                        </div>
                      </div>

                      {/* 장착, 강화 & 망각 액션 버튼 그룹 */}
                      <div className="pt-2 border-t border-[#1f2738] flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <button
                            className={\`btn text-xs px-2.5 py-1 font-bold \${isEquippedSlot1 ? 'btn-primary' : 'btn-ghost'}\`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEquippedSlot1) gm.unequipSkillSlot(hero.id, 0);
                              else gm.equipSkillToSlot(hero.id, sk.id, 0);
                            }}
                          >
                            {isEquippedSlot1 ? '✓ 1번 해제' : '1번 장착'}
                          </button>
                          <button
                            className={\`btn text-xs px-2.5 py-1 font-bold \${isEquippedSlot2 ? 'btn-primary' : 'btn-ghost'}\`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEquippedSlot2) gm.unequipSkillSlot(hero.id, 1);
                              else gm.equipSkillToSlot(hero.id, sk.id, 1);
                            }}
                          >
                            {isEquippedSlot2 ? '✓ 2번 해제' : '2번 장착'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            className="btn btn-ghost text-xs px-2.5 py-1 text-[#26a69a] hover:bg-[#26a69a22] border border-[#26a69a55] font-bold flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnhanceTargetSkill(sk);
                            }}
                            title="에테르 연금 공방에서 스킬을 비전 강화합니다"
                          >
                            <span>⚡ 강화</span>
                          </button>
                          <button
                            className="btn btn-ghost text-xs px-2.5 py-1 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535033] font-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({ type: 'unlearn', skill: sk });
                            }}
                            title="스킬을 망각하여 슬롯을 비웁니다"
                          >
                            🗑️ 망각
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── 구분된 섹션 2: 📖 학습(연독) 중인 마도서 스킬 ── */}
            <div className="mt-3 pt-3 border-t border-[#1f2738] flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#ffd54f]">📖 학습(연독) 중인 스킬</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold font-mono bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                    {studyingSkills.length}/4
                  </span>
                </div>
                <span className="text-[10px] text-[#8b9bb4]">
                  최대 4권까지 동시 학습 가능
                </span>
              </div>

              {studyingSkills.length === 0 ? (
                <div className="panel p-4 bg-[#0d131f] border border-[#1b2537] rounded-xl text-center text-[#8b9bb4] text-xs">
                  현재 연독(학습) 진행 중인 마도서가 없습니다.<br />
                  <span className="text-[11px] text-[#ffd54f] mt-1 block">
                    [보유 스킬북] 탭에서 마도서를 읽어 새로운 기술 연구를 시작하세요.
                  </span>
                </div>
              ) : (
                studyingSkills.map(({ skill: sk, mastery }) => {
                  const bookDef = ALL_SKILL_BOOKS.find(b => b.skill.id === sk.id);
                  const matchingBookItem = (skillBooks || []).find(b => b.skill.id === sk.id);
                  const rawRarity = matchingBookItem?.rarity || (bookDef ? getSkillBookRarity(bookDef.rank) : 'common');
                  const rMeta = GRIMOIRE_RARITY_META[rawRarity] || GRIMOIRE_RARITY_META.common;
                  const gain = getMasteryGainPerBook(rawRarity);
                  const remainingBooks = Math.ceil((100 - mastery) / gain);
                  const bookCount = matchingBookItem?.count || 0;

                  return (
                    <div
                      key={sk.id}
                      className="panel p-3 bg-[#111724] border border-[#ffd54f44] rounded-xl flex flex-col gap-2.5 relative shadow-md cursor-pointer hover:border-[#ffd54f88] transition-all"
                      onClick={() => {
                        setDetailModalItem({
                          skill: sk,
                          bookItem: matchingBookItem,
                          isLearned: false,
                          slotIndex: -1,
                          bookLv: 1,
                          rarity: rawRarity,
                        });
                      }}
                    >
                      {/* 상단 스킬 정보 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl p-1.5 rounded-lg bg-[#1a2234] border border-[#2b3952]">
                            {sk.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-white">{sk.name}</span>
                              <span
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                                style={{ color: rMeta.color, background: rMeta.bg, border: \`1px solid \${rMeta.borderColor}\` }}
                              >
                                {rMeta.label}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                                학습 진행 중
                              </span>
                            </div>
                            <div className="text-[11px] text-[#cfd8dc] mt-0.5">{sk.description}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-xs text-[#64b5f6] font-mono font-bold">{sk.manaCost} MP</span>
                          <span className="text-[10px] text-[#ffd54f] font-mono font-bold">{mastery}%</span>
                        </div>
                      </div>

                      {/* 연독률 게이지 바 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#8b9bb4]">
                          <span>연독 습득률: <strong className="text-[#ffd54f]">{mastery}%</strong> / 100%</span>
                          <span>완전 습득까지: <strong className="text-[#00d2ff]">약 {remainingBooks}권</strong> (권당 +{gain}%)</span>
                        </div>
                        <div className="w-full bg-[#0a0f1d] rounded-full h-2 overflow-hidden border border-[#1e2a3f]">
                          <div
                            className="bg-gradient-to-r from-[#ffd54f] to-[#ffb300] h-full transition-all duration-300"
                            style={{ width: \`\${mastery}%\` }}
                          />
                        </div>
                      </div>

                      {/* 하단 액션 버튼 바: 이어서 연독하기 & 중도 포기 */}
                      <div className="pt-2 border-t border-[#1f2738] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="text-[11px] text-[#8b9bb4] flex items-center gap-1">
                          <span>📚 서고 보유:</span>
                          <span className={\`font-mono font-bold \${bookCount > 0 ? 'text-[#38ef7d]' : 'text-[#8b9bb4]'}\`}>
                            {bookCount}권
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            className={\`btn text-xs px-3 py-1 font-bold flex items-center gap-1 \${
                              bookCount > 0 ? 'btn-primary' : 'btn-ghost opacity-40 cursor-not-allowed'
                            }\`}
                            disabled={bookCount <= 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (matchingBookItem) {
                                gm.learnSkillFromBook(hero.id, matchingBookItem.id);
                              }
                            }}
                            title={bookCount > 0 ? \`마도서를 1권 정독하여 습득률을 +\${gain}% 올립니다\` : '서고에 마도서가 부족합니다'}
                          >
                            <span>📖</span>
                            <span>{bookCount > 0 ? \`연독하기 (+\${gain}%)\` : '보유 책 없음'}</span>
                          </button>

                          <button
                            className="btn btn-ghost text-xs px-2.5 py-1 text-[#ef5350] hover:bg-[#ef535022] border border-[#ef535044] font-bold flex items-center gap-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({
                                type: 'abandon',
                                skill: sk,
                                mastery,
                              });
                            }}
                            title="학습을 중도 포기하여 슬롯을 비웁니다 (연독률 초기화)"
                          >
                            <span>🚫</span>
                            <span>중도 포기</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}`;

if (norm.includes(oldLearnedContent)) {
  norm = norm.replace(oldLearnedContent, newLearnedContent);
  console.log('learnedContent updated!');
} else {
  console.log('oldLearnedContent not found');
}

// 4. Update Tab 2 books mapping
const oldBooksMap = `            {skillBooks.map(item => {
              const alreadyKnows = (hero.learnedSkills || []).includes(item.skill.id);
              const canLearn = !isFullLearned && !alreadyKnows;`;

const newBooksMap = `            {skillBooks.map(item => {
              const alreadyKnows = (hero.learnedSkills || []).includes(item.skill.id);
              const isStudying = studyingSkillIds.includes(item.skill.id);
              const isStudyingFull = studyingSkills.length >= 4 && !isStudying;
              const canLearn = !isFullLearned && !alreadyKnows && !isStudyingFull;`;

if (norm.includes(oldBooksMap)) {
  norm = norm.replace(oldBooksMap, newBooksMap);
  console.log('booksMap logic updated!');
} else {
  console.log('oldBooksMap not found');
}

// 5. Update DetailModal invocation and render confirmation modal at the bottom of SkillManagerOverlay
const oldDetailModalRender = `      {/* 상세 모달 */}
      {detailModalItem && (
        <SkillBookDetailModal
          skill={detailModalItem.skill}
          bookItem={detailModalItem.bookItem}
          hero={hero}
          isLearned={detailModalItem.isLearned}
          slotIndex={detailModalItem.slotIndex}
          bookLv={detailModalItem.bookLv}
          rarity={detailModalItem.rarity}
          onClose={() => setDetailModalItem(null)}
        />
      )}`;

const newDetailModalRender = `      {/* 상세 모달 */}
      {detailModalItem && (
        <SkillBookDetailModal
          skill={detailModalItem.skill}
          bookItem={detailModalItem.bookItem}
          hero={hero}
          isLearned={detailModalItem.isLearned}
          slotIndex={detailModalItem.slotIndex}
          bookLv={detailModalItem.bookLv}
          rarity={detailModalItem.rarity}
          onClose={() => setDetailModalItem(null)}
          onUnlearn={(sk) => setConfirmModal({ type: 'unlearn', skill: sk })}
          onAbandon={(sk, m) => setConfirmModal({ type: 'abandon', skill: sk, mastery: m })}
        />
      )}

      {/* ⚠️ 스킬 망각 / 학습 중도 포기 재확인 모달 */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setConfirmModal(null)}>
          <div
            className="panel-accent w-full max-w-[360px] p-4 bg-[#0d1424] border border-[#ef535066] rounded-2xl shadow-2xl flex flex-col gap-3 text-left animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[#1f2738] pb-2 text-[#ef5350] font-bold text-sm">
              <span>⚠️</span>
              <span>
                {confirmModal.type === 'unlearn' ? '스킬 망각 확인' : '학습 중도 포기 확인'}
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs leading-relaxed text-[#cfd8dc]">
              <div className="p-2.5 rounded-lg bg-[#141b2b] border border-[#222f47] flex items-center gap-2.5">
                <span className="text-2xl p-1 bg-[#1a2234] rounded border border-[#2b3952]">
                  {confirmModal.skill.icon || '📖'}
                </span>
                <div>
                  <div className="font-bold text-white text-sm">{confirmModal.skill.name}</div>
                  <div className="text-[11px] text-[#8b9bb4]">
                    {confirmModal.type === 'unlearn' ? '습득 상태: 완전 습득 (100%)' : \`현재 연독률: \${confirmModal.mastery || 0}%\`}
                  </div>
                </div>
              </div>

              <p className="text-[#ff8a80]">
                {confirmModal.type === 'unlearn'
                  ? \`정말로 [\${confirmModal.skill.name}] 스킬을 망각하시겠습니까? 습득한 기술이 영구적으로 제거되며, 장착 중인 슬롯이 해제되고 비전 강화 레벨 및 습득률이 0%로 초기화됩니다.\`
                  : \`정말로 [\${confirmModal.skill.name}] 마도서 학습을 중도 포기하시겠습니까? 현재까지 진행된 연독률(\${confirmModal.mastery || 0}%)이 완전히 초기화되고 학습 슬롯이 비워집니다. (이미 소모된 마도서는 반환되지 않습니다)\`}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2738]">
              <button
                className="btn btn-ghost text-xs px-3 py-1.5 font-bold text-[#8b9bb4] hover:text-white"
                onClick={() => setConfirmModal(null)}
              >
                취소
              </button>
              <button
                className="btn btn-danger text-xs px-3.5 py-1.5 font-bold shadow-md flex items-center gap-1"
                onClick={() => {
                  if (confirmModal.type === 'unlearn') {
                    gm.unlearnSkill(hero.id, confirmModal.skill.id);
                  } else {
                    gm.abandonStudyingSkill(hero.id, confirmModal.skill.id);
                  }
                  setConfirmModal(null);
                }}
              >
                <span>{confirmModal.type === 'unlearn' ? '🗑️ 스킬 망각' : '🚫 중도 포기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}`;

if (norm.includes(oldDetailModalRender)) {
  norm = norm.replace(oldDetailModalRender, newDetailModalRender);
  console.log('detailModalRender updated!');
} else {
  console.log('oldDetailModalRender not found');
}

const finalContent = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(file, finalContent, 'utf8');
console.log('CitadelScreen.tsx written!');
