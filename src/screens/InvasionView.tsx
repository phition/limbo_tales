import React, { useState, useEffect, useCallback } from 'react';
import { useGameManager } from '../hooks/useGameManager';
import {
  InvasionTarget,
  ResourceType,
  InvasionDefenseLog,
  TacticalTowerBranch,
  TacticalTowerState,
  GameResources,
} from '../types/game';
import { CHARACTER_CLASSES } from '../data/classes';
import { SoundManager } from '../managers/SoundManager';
import { InvasionBattleScreen } from './InvasionBattleScreen';
import { gameDialog } from '../services/DialogService';

type InvasionTab = 'scout' | 'defense' | 'tower';

interface TechDefinition {
  branch: TacticalTowerBranch;
  branchName: string;
  branchIcon: string;
  accentColor: string;
  tier: 1 | 2 | 3;
  name: string;
  icon: string;
  desc: string;
  effectText: (lv: number) => string;
  nextEffectText: (lv: number) => string;
}

const TECH_DEFINITIONS: TechDefinition[] = [
  // ⚔️ 공격 전술
  {
    branch: 'attack',
    branchName: '공격 전술',
    branchIcon: '⚔️',
    accentColor: '#ff416c',
    tier: 1,
    name: '전력 증폭 진지',
    icon: '⚔️',
    desc: '수비 진지에 마도 역장을 전개하여 모든 수비 아군의 기본 공격력을 증폭합니다.',
    effectText: (lv) => `아군 전체 공격력 +${lv * 1}%`,
    nextEffectText: (lv) => `아군 전체 공격력 +${(lv + 1) * 1}%`,
  },
  {
    branch: 'attack',
    branchName: '공격 전술',
    branchIcon: '⚔️',
    accentColor: '#ff416c',
    tier: 2,
    name: '자동 타워 포격',
    icon: '💥',
    desc: '매 라운드 시작 시, 방어 타워가 아군 평균 공격력에 비례한 고정 포격을 침입자 전체에 가합니다.',
    effectText: (lv) => `매 라운드 적 전체에 아군 평균 공격력의 ${lv * 1}% 포격`,
    nextEffectText: (lv) => `매 라운드 적 전체에 아군 평균 공격력의 ${(lv + 1) * 1}% 포격`,
  },
  {
    branch: 'attack',
    branchName: '공격 전술',
    branchIcon: '⚔️',
    accentColor: '#ff416c',
    tier: 3,
    name: '시공간 제어 (시들음)',
    icon: '⏳',
    desc: '침입자들의 시간축을 침식하여, 침입자의 행동 턴 시작 시마다 해당 적의 체력을 침식 감소시킵니다.',
    effectText: (lv) => `침입자 턴 시작마다 해당 적 체력 ${(lv * 0.5).toFixed(1)}% 감소`,
    nextEffectText: (lv) => `침입자 턴 시작마다 해당 적 체력 ${((lv + 1) * 0.5).toFixed(1)}% 감소`,
  },
  // 🛡️ 방어 전술
  {
    branch: 'defense',
    branchName: '방어 전술',
    branchIcon: '🛡️',
    accentColor: '#00d2ff',
    tier: 1,
    name: '차원 왜곡 결계',
    icon: '🛡️',
    desc: '전투 시작 시 아군 평균 방어력에 비례한 차원 보호막을 수비 부대에 전개합니다. (1턴 유지)',
    effectText: (lv) => `전투 시작 시 아군 평균 방어력의 ${lv * 1}% 보호막 획득 (1턴)`,
    nextEffectText: (lv) => `전투 시작 시 아군 평균 방어력의 ${(lv + 1) * 1}% 보호막 획득 (1턴)`,
  },
  {
    branch: 'defense',
    branchName: '방어 전술',
    branchIcon: '🛡️',
    accentColor: '#00d2ff',
    tier: 2,
    name: '성역 지속 재생',
    icon: '💚',
    desc: '매 라운드 시작 시 신성한 성역 나노 에너지를 방출하여 모든 수비 아군의 체력을 지속 회복합니다.',
    effectText: (lv) => `매 라운드 시작 시 수비 아군 전체 체력 ${lv * 1}% 회복`,
    nextEffectText: (lv) => `매 라운드 시작 시 수비 아군 전체 체력 ${(lv + 1) * 1}% 회복`,
  },
  {
    branch: 'defense',
    branchName: '방어 전술',
    branchIcon: '🛡️',
    accentColor: '#00d2ff',
    tier: 3,
    name: '방어 파쇄 역장',
    icon: '🌀',
    desc: '매 라운드 시작 시 침입자 전체의 방어력을 파쇄하며, 이 수치는 매 라운드마다 누적 감소됩니다.',
    effectText: (lv) => `매 라운드 시작 시 적 방어력 ${lv * 1}%씩 누적 감소`,
    nextEffectText: (lv) => `매 라운드 시작 시 적 방어력 ${(lv + 1) * 1}%씩 누적 감소`,
  },
  // ⚡ 유틸 전술
  {
    branch: 'utility',
    branchName: '유틸 전술',
    branchIcon: '⚡',
    accentColor: '#ffd54f',
    tier: 1,
    name: '중력 감속 역장',
    icon: '⚡',
    desc: '영지 전장에 중력 감속 왜곡장을 형성하여 침입자(적군) 전체의 속도(SPD)를 감속시킵니다.',
    effectText: (lv) => `침입자 전체 속도(SPD) -${lv * 1}`,
    nextEffectText: (lv) => `침입자 전체 속도(SPD) -${(lv + 1) * 1}`,
  },
  {
    branch: 'utility',
    branchName: '유틸 전술',
    branchIcon: '⚡',
    accentColor: '#ffd54f',
    tier: 2,
    name: '마나 누출 균열',
    icon: '🔮',
    desc: '차원의 에테르를 교란시켜 침입자가 스킬을 발동할 때마다 소모되는 MP 소모량을 추가 증가시킵니다.',
    effectText: (lv) => `침입자 스킬 MP 소모량 +${lv * 10}%`,
    nextEffectText: (lv) => `침입자 스킬 MP 소모량 +${(lv + 1) * 10}%`,
  },
  {
    branch: 'utility',
    branchName: '유틸 전술',
    branchIcon: '⚡',
    accentColor: '#ffd54f',
    tier: 3,
    name: '불운의 저주 안개',
    icon: '🌫️',
    desc: '침입자 부대를 에워싸는 저주의 안개를 피워 침입자 전체의 치명타 및 회피 판정 행운(LUCK)을 감소시킵니다.',
    effectText: (lv) => `침입자 전체 행운(LUCK) -${lv * 10}%`,
    nextEffectText: (lv) => `침입자 전체 행운(LUCK) -${(lv + 1) * 10}%`,
  },
];

export const InvasionView: React.FC = () => {
  const { state, gm } = useGameManager();
  const gateLevel = state.buildings['arenaGate']?.level || 0;
  const isUnlocked = gm.isMasterAccount || gateLevel >= 6;

  const [activeTab, setActiveTab] = useState<InvasionTab>('scout');
  const [targets, setTargets] = useState<InvasionTarget[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);

  // ── 🎯 상대 상세 정찰 모달 상태 ──
  const [inspectTarget, setInspectTarget] = useState<InvasionTarget | null>(null);

  // ── 🗼 전술 타워 테크 상세 연구 모달 상태 ──
  const [selectedTech, setSelectedTech] = useState<TechDefinition | null>(null);

  // ── ⚔️ 진행 중인 침공 전장 상태 ──
  const [activeBattleTarget, setActiveBattleTarget] = useState<InvasionTarget | null>(null);

  // 타워 상태 갱신 트리거
  const [towerVersion, setTowerVersion] = useState(0);

  // 타겟 목록 로드
  const loadTargets = useCallback(async () => {
    setIsLoadingTargets(true);
    const list = await gm.getInvasionTargets();
    setTargets(list);
    setIsLoadingTargets(false);
  }, [gm]);

  useEffect(() => {
    if (isUnlocked) {
      loadTargets();
    }
  }, [isUnlocked, loadTargets]);

  useEffect(() => {
    gm.emit('phaserSceneChange', 'invasion');
    return () => {
      gm.emit('phaserSceneChange', 'arena');
    };
  }, [gm]);

  // ── ⚔️ 침공 시작 핸들러 ──────────────────────────────────────────────
  const handleStartInvasion = (target: InvasionTarget) => {
    const squadCheck = gm.isDimensionalSquadReady();
    if (!squadCheck.isReady) {
      SoundManager.getInstance().play('debuff');
      gameDialog.alert({
        title: '⚔️ 차원 공성 부대 편성 필요',
        message: squadCheck.reason || '차원 영지 침공은 3인 결사대 + 1인 오퍼레이터가 모두 편성되어야 진행할 수 있습니다.',
        icon: '⚠️',
      });
      return;
    }
    setInspectTarget(null);
    setActiveBattleTarget(target);
  };

  // ── 🗼 방어 전술 타워 업그레이드 실행 ──────────────────────────────────
  const handleUpgradeTower = (branch: TacticalTowerBranch, tier: 1 | 2 | 3) => {
    const res = gm.upgradeTacticalTower(branch, tier);
    if (!res.success) {
      alert(res.message);
      return;
    }
    SoundManager.getInstance().play('build');
    setTowerVersion((v) => v + 1);
  };

  // ── 🔒 차원 게이트 Lv.6 미만 잠금 안내 화면 ──
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#0a0f1d] border border-[#1b253b] rounded-2xl text-center gap-4 animate-fade-in my-2">
        <div className="text-5xl p-4 bg-[#ff416c15] border border-[#ff416c33] rounded-3xl text-[#ff416c] animate-pulse">
          🏰
        </div>
        <div>
          <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
            <span>차원 영지 침공 & 자원 약탈</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]">
              Gate Lv.6 필요
            </span>
          </h3>
          <p className="text-xs text-[#8b9bb4] max-w-md mt-1.5 leading-relaxed">
            차원 앵커 게이트를 <span className="text-[#ffd54f] font-bold">6레벨</span> 이상으로 증축하면, 3인 결사대 + 1인 오퍼레이터 차원 공성 부대를 결성하여 다른 사령관의 영지를 침공하고 차원 보호막을 돌파하여 영지 자원의 <span className="text-[#ff416c] font-bold">30%를 약탈</span>하는 엔드 전략 컨텐츠가 영구 해금됩니다.
          </p>
        </div>
        <div className="text-xs text-[#546e7a] font-mono bg-[#060911] px-4 py-2 rounded-xl border border-[#151f33]">
          현재 차원 게이트 레벨: <span className="text-[#00d2ff] font-bold">Lv.{gateLevel}</span> / 6
        </div>
      </div>
    );
  }

  // ── ⚔️ 활성화된 5v5 전투 화면 ──
  if (activeBattleTarget) {
    return (
      <InvasionBattleScreen
        target={activeBattleTarget}
        onFinish={(isWin) => {
          setActiveBattleTarget(null);
          if (isWin) {
            loadTargets();
          }
        }}
        onRetreat={() => {
          setActiveBattleTarget(null);
        }}
      />
    );
  }

  const peaceShieldUntil = state.invasionState?.peaceShieldUntil || 0;
  const isShieldActive = peaceShieldUntil > Date.now();
  const shieldMinutesLeft = isShieldActive ? Math.ceil((peaceShieldUntil - Date.now()) / 60000) : 0;
  const tacticalTower: TacticalTowerState = gm.getTacticalTower();

  // 심연 연구 재료 보유량
  const curGold = state.resources.gold || 0;
  const curEther = state.resources.ether || 0;
  const curCrystal = state.resources.crystal || 0;
  const curVoidShard = state.resources.void_shard || 0;

  return (
    <div className="flex flex-col gap-3 animate-fade-in pb-12">
      {/* ── 상단 헤더 바 (간소화) ── */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#121b30] via-[#0d1424] to-[#181126] border border-[#223252] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 rounded-xl bg-[#ff416c22] border border-[#ff416c44] text-[#ff416c]">
            🏰
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">차원 영지 침공</h2>
            </div>
            <p className="text-[11px] text-[#8b9bb4] mt-0.5">
              상대 영지를 정찰하여 자원 30%를 약탈하고, 방어 전술 타워를 연구하여 내 영지를 결속하세요.
            </p>
          </div>
        </div>

        {/* 내 영지 보호막 현황 */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs ${
              isShieldActive
                ? 'bg-[#00d2ff15] border-[#00d2ff44] text-[#00d2ff]'
                : 'bg-[#141b2c] border-[#22324f] text-[#8b9bb4]'
            }`}
          >
            <span>🛡️</span>
            <div>
              <div className="text-[9px] text-[#8b9bb4]">내 영지 보호막</div>
              <div className="font-bold font-mono">
                {isShieldActive
                  ? `${Math.floor(shieldMinutesLeft / 60)}시간 ${shieldMinutesLeft % 60}분`
                  : '비활성'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 탭 네비게이션 (이모지 제거, 방어기록 표기) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { key: 'scout', label: '영지 정찰' },
          { key: 'defense', label: '방어기록' },
          { key: 'tower', label: '방어 전술 타워' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-[#ff416c] text-white shadow-lg shadow-[#ff416c33]'
                : 'bg-[#101728] border border-[#1f2d48] text-[#8b9bb4] hover:text-white hover:bg-[#18233c]'
            }`}
            onClick={() => setActiveTab(tab.key as InvasionTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════ 1. 🏰 상대 영지 정찰 (한 줄 반응형 가로 리스트) ════════ */}
      {activeTab === 'scout' && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between bg-[#0b101c] p-2.5 rounded-xl border border-[#1b263b] text-xs text-[#8b9bb4]">
            <span>🎯 정찰할 사령관을 선택하여 부대 편성을 확인하고 목표 자원(30%)을 약탈하세요.</span>
            <button
              className="btn btn-ghost text-xs px-3 py-1 border border-[#233554] text-[#00d2ff]"
              disabled={isLoadingTargets}
              onClick={loadTargets}
            >
              {isLoadingTargets ? '정찰 중...' : '🔄 새로고침'}
            </button>
          </div>

          {/* 한 줄 가로길이 반응형 리스트 */}
          <div className="flex flex-col gap-1.5 w-full">
            {targets.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setInspectTarget(t);
                }}
                className="w-full p-2.5 sm:p-3 rounded-xl bg-[#0e1424] border border-[#1f2d48] hover:border-[#00d2ff] cursor-pointer transition-all flex items-center justify-between shadow hover:shadow-cyan-950/30 group"
              >
                {/* 좌측: 아바타 + 사령관 닉네임 + 영지명 + 게이트 레벨 */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-[#141d30] border border-[#233454] shrink-0 group-hover:border-[#00d2ff66] transition-colors">
                    {t.avatarIcon || '🏰'}
                  </div>
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-white group-hover:text-[#00d2ff] transition-colors truncate">
                        {t.ownerNickname}
                      </span>
                      {t.isBot ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-mono shrink-0">
                          🤖 BOT
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44] font-mono shrink-0">
                          🌐 지휘관
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44] shrink-0">
                        Lv.{t.gateLevel}
                      </span>
                      {t.guildName && (
                        <span className="text-[10px] text-[#8b9bb4] hidden md:inline truncate">
                          ({t.guildName})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#8b9bb4] truncate mt-0.5">
                      영지: <span className="text-[#cfd8e8]">{t.name}</span>
                    </div>
                  </div>
                </div>

                {/* 우측: 방어 전투력 + 보호막/침공상태 + 화살표 */}
                <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[9px] sm:text-[10px] text-[#8b9bb4]">방어 전투력</div>
                    <div className="text-xs sm:text-sm font-black text-[#ffd54f] font-mono">
                      ⚡ {t.defensePower.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {t.isShielded ? (
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44]">
                        🛡️ 보호막
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]">
                        침공 가능
                      </span>
                    )}
                    <span className="text-[9px] sm:text-[10px] text-[#607d8b] group-hover:text-[#00d2ff] flex items-center gap-0.5">
                      상세 정찰 ➔
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ 2. 📜 방어 기록 & 복수전 탭 ════════ */}
      {activeTab === 'defense' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* 보호막 수동 전개 카드 */}
          <div className="p-3.5 rounded-xl bg-[#0e1526] border border-[#1f2d48] flex items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>🛡️</span>
                <span>차원 왜곡 평화 보호막</span>
              </div>
              <p className="text-[11px] text-[#8b9bb4] mt-0.5">
                침공당해 패배 시 3시간 자동 보호막이 전개되며, 수동으로 즉시 3시간 전개할 수도 있습니다.
              </p>
            </div>
            <button
              className="btn btn-ghost text-xs px-3 py-1.5 border border-[#243756] text-[#00d2ff]"
              onClick={() => {
                gm.activatePeaceShield(3);
              }}
            >
              + 3시간 보호막 전개
            </button>
          </div>

          {/* 방어 로그 목록 */}
          <div className="flex flex-col gap-2">
            {state.invasionState?.defenseLogs && state.invasionState.defenseLogs.length > 0 ? (
              state.invasionState.defenseLogs.map((log: InvasionDefenseLog) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs ${
                    log.isVictory ? 'bg-[#0b1726] border-[#1f3f38]' : 'bg-[#1a0f18] border-[#3f1f28]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{log.isVictory ? '🛡️' : '💀'}</span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className={log.isVictory ? 'text-[#38ef7d]' : 'text-[#ff416c]'}>
                          {log.isVictory ? '방어 성공!' : '영지 함락 (약탈당함)'}
                        </span>
                        <span className="text-[#8b9bb4] font-normal">침공자: {log.attackerName}</span>
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] mt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.plunderedResource && (
                          <span className="text-[#ff416c] font-bold ml-2">
                            약탈 손실: -{log.plunderedResource.amount.toLocaleString()} {log.plunderedResource.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {log.canRevenge && !log.revenged && (
                    <button
                      className="btn btn-danger text-xs px-3 py-1.5 font-bold flex items-center gap-1 shrink-0 self-end sm:self-center"
                      onClick={() => {
                        const revengeTarget: InvasionTarget = {
                          id: log.attackerUid || `rev_${log.id}`,
                          name: `${log.attackerName}의 침공 영지`,
                          ownerNickname: log.attackerName,
                          gateLevel: 6,
                          bonfireLevel: 7,
                          rating: 1400,
                          defensePower: 25000,
                          defenseSquad: log.targetSquadSnapshot || targets[0]?.defenseSquad || [],
                          estateResources: {
                            gold: 35000,
                            wood: 25000,
                            stone: 18000,
                            iron: 15000,
                            food: 12000,
                            ether: 2500,
                          },
                          isShielded: false,
                        };
                        setInspectTarget(revengeTarget);
                      }}
                    >
                      <span>⚔️</span>
                      <span>즉시 복수전</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#546e7a] bg-[#090d16] rounded-xl border border-[#172033]">
                🛡️ 아직 내 영지에 침공한 적 침략자가 없습니다. 평화로운 상태입니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ 3. 🗼 방어 전술 타워 탭 (아이콘/이름 미니멀 노드 + 클릭 시 상세 연구 모달) ════════ */}
      {activeTab === 'tower' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {/* 상단: 심연 연구 재료 보유 바 */}
          <div className="p-3 bg-[#0a101d] rounded-xl border border-[#1b273d] flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs">
            <div>
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <span>🗼</span>
                <span>영지 방어 전술 타워 연구소</span>
              </div>
              <p className="text-[11px] text-[#8b9bb4] mt-0.5">
                수비 시 발동되는 3대 전술 효과를 강화합니다. 각 테크를 눌러 상세 효과를 확인하고 심연 재료로 연구하세요.
              </p>
            </div>

            {/* 심연 자원 보유 현황 뱃지 */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono bg-[#060a14] px-3 py-1.5 rounded-xl border border-[#17243c]">
              <span className="text-[#ffd54f]">🪙 {(curGold >= 1000 ? `${(curGold / 1000).toFixed(1)}k` : curGold)}</span>
              <span className="text-[#81d4fa]">✨ {(curEther >= 1000 ? `${(curEther / 1000).toFixed(1)}k` : curEther)}</span>
              <span className="text-[#ce93d8]">🔮 {curCrystal.toLocaleString()}개</span>
              <span className="text-[#b39ddb]">🌌 {curVoidShard.toLocaleString()}개</span>
            </div>
          </div>

          {/* 3대 계통 카드 (이름과 아이콘 중심 미니멀 테크 버튼 배치) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['attack', 'defense', 'utility'] as TacticalTowerBranch[]).map((branch) => {
              const branchTechs = TECH_DEFINITIONS.filter((t) => t.branch === branch);
              const branchName = branchTechs[0]?.branchName || '';
              const branchIcon = branchTechs[0]?.branchIcon || '';
              const accentColor = branchTechs[0]?.accentColor || '#00d2ff';

              return (
                <div
                  key={branch}
                  className="p-3.5 rounded-2xl bg-[#0d1424] border flex flex-col gap-3 shadow-md"
                  style={{ borderColor: `${accentColor}33` }}
                >
                  {/* 계통 헤더 */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#1b263b]">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl p-1.5 rounded-lg"
                        style={{ backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}44` }}
                      >
                        {branchIcon}
                      </span>
                      <h3 className="font-extrabold text-sm text-white" style={{ color: accentColor }}>
                        {branchName}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#8b9bb4]">
                      Lv.
                      {(tacticalTower[branch]?.tier1 || 0) +
                        (tacticalTower[branch]?.tier2 || 0) +
                        (tacticalTower[branch]?.tier3 || 0)}{' '}
                      / 9
                    </span>
                  </div>

                  {/* 1차 / 2차 / 3차 테크 미니 버튼 (이름 + 아이콘 + 레벨) */}
                  <div className="flex flex-col gap-2">
                    {branchTechs.map((tech) => {
                      const key = `tier${tech.tier}` as 'tier1' | 'tier2' | 'tier3';
                      const currentLv = tacticalTower[tech.branch][key] || 0;
                      const prevLv =
                        tech.tier === 1
                          ? 1
                          : tacticalTower[tech.branch][`tier${(tech.tier - 1) as 1 | 2}`] || 0;
                      const isLocked = tech.tier > 1 && prevLv < 1;
                      const isMax = currentLv >= 3;

                      return (
                        <div
                          key={tech.tier}
                          onClick={() => setSelectedTech(tech)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isLocked
                              ? 'bg-[#090d16] border-[#151f30] opacity-50'
                              : isMax
                              ? 'bg-[#0f1f1d] border-[#38ef7d55] hover:border-[#38ef7d]'
                              : 'bg-[#101828] border-[#1d2c44] hover:border-[#00d2ff] hover:bg-[#142035]'
                          } shadow group`}
                        >
                          {/* 좌측: 티어 배지 + 아이콘 + 이름 */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl p-1 rounded-lg bg-[#080d17] border border-[#19263c] shrink-0">
                              {tech.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-[#172238] text-[#00d2ff] shrink-0">
                                  {tech.tier}차
                                </span>
                                <span className="font-bold text-xs text-white group-hover:text-[#00d2ff] transition-colors truncate">
                                  {tech.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5">
                                {isLocked ? (
                                  <span className="text-[#ff7043]">🔒 선행 {tech.tier - 1}차 Lv.1 필요</span>
                                ) : isMax ? (
                                  <span className="text-[#38ef7d]">★ 최고 연구 단계</span>
                                ) : (
                                  <span className="text-[#cfd8e8]">{tech.effectText(currentLv)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 우측: 레벨 뱃지 및 상태 화살표 */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex flex-col items-end">
                              <span
                                className="font-mono text-xs font-black"
                                style={{ color: currentLv > 0 ? accentColor : '#607d8b' }}
                              >
                                Lv.{currentLv}
                              </span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map((star) => (
                                  <span
                                    key={star}
                                    className="text-[8px]"
                                    style={{ color: star <= currentLv ? accentColor : '#37474f' }}
                                  >
                                    ◆
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-[#546e7a] group-hover:text-[#00d2ff] transition-colors">
                              ➔
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ 🎯 상대 영지 정찰 상세 모달 ════════ */}
      {inspectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#0d1424] border border-[#243554] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#141e33] to-[#0d1424] border-b border-[#1f2d48] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-1.5 rounded-lg bg-[#18233a] border border-[#273859]">
                  {inspectTarget.avatarIcon || '🏰'}
                </span>
                <div>
                  <div className="font-extrabold text-sm text-white flex items-center gap-1.5 flex-wrap">
                    <span>{inspectTarget.name}</span>
                    {inspectTarget.isBot ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff704322] text-[#ff7043] border border-[#ff704344] font-mono shrink-0">
                        🤖 BOT
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#00d2ff22] text-[#00d2ff] border border-[#00d2ff44] font-mono shrink-0">
                        🌐 지휘관
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ff416c22] text-[#ff416c] border border-[#ff416c44]">
                      게이트 Lv.{inspectTarget.gateLevel}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8b9bb4]">
                    사령관: <span className="text-white font-bold">{inspectTarget.ownerNickname}</span>
                    {inspectTarget.guildName ? ` (${inspectTarget.guildName})` : ''}
                  </div>
                </div>
              </div>

              <button
                className="text-gray-400 hover:text-white p-1 rounded-lg text-lg"
                onClick={() => setInspectTarget(null)}
              >
                ✕
              </button>
            </div>

            {/* 모달 바디 (스크롤) */}
            <div className="p-4 flex flex-col gap-3.5 overflow-y-auto">
              {/* 전투력 비교 바 */}
              <div className="bg-[#090e1a] p-3 rounded-xl border border-[#162238] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#8b9bb4]">상대 방어 총 전투력</div>
                  <div className="text-base font-black text-[#ffd54f] font-mono">
                    ⚡ {inspectTarget.defensePower.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#8b9bb4]">보호막 상태</div>
                  <div className="text-xs font-bold font-mono">
                    {inspectTarget.isShielded ? (
                      <span className="text-[#00d2ff]">🛡️ 보호막 작동 중 (침공 불가)</span>
                    ) : (
                      <span className="text-[#38ef7d]">⚡ 침공 가능</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 상대 부대 편성 (3인 수비대 + 1인 오퍼레이터) */}
              <div className="bg-[#090e1a] p-3 rounded-xl border border-[#162238] flex flex-col gap-2">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>🛡️ 상대 방어 부대 편성</span>
                  <span className="text-[10px] font-mono text-[#00d2ff]">3인 결사대 + 1인 오퍼레이터</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {inspectTarget.defenseSquad.slice(0, 4).map((h, i) => {
                    const isOperator = i === 3;
                    const cls = CHARACTER_CLASSES[h.classId];
                    return (
                      <div
                        key={i}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center relative ${
                          isOperator
                            ? 'bg-[#1f1220] border-[#ff416c66]'
                            : 'bg-[#101726] border-[#1e2a40]'
                        }`}
                      >
                        <span
                          className="text-[9px] font-black px-1.5 py-0.2 rounded mb-1"
                          style={{
                            color: isOperator ? '#ff80ab' : '#cfd8e8',
                            backgroundColor: isOperator ? '#381428' : '#18243c',
                          }}
                        >
                          {isOperator ? '🛡️ 오퍼레이터' : `수비대 ${i + 1}`}
                        </span>
                        <span className="text-3xl my-1.5">{cls?.skills[0]?.icon || '⚔️'}</span>
                        <span className="text-[11px] font-mono font-black text-[#ffd54f]">
                          Lv.{h.level}
                        </span>
                        <span className="text-[9px] text-[#8b9bb4] truncate w-full">
                          {cls?.name || '용병'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="p-2 rounded-lg bg-[#0d1726] border border-[#00d2ff33] flex items-center justify-between text-xs">
                  <span className="text-[#00d2ff] font-bold flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>차원 왜곡 보호막 & 2대 전술 타워 방호</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#ffd54f]">
                    예상 내구도 {Math.round(inspectTarget.defensePower * 1.5).toLocaleString()} HP
                  </span>
                </div>
              </div>

              {/* 🗼 상대 영지 방어 전술 타워 구축 현황 */}
              {(() => {
                const targetTower = inspectTarget.tacticalTower || {
                  attack: { tier1: Math.min(3, Math.max(1, inspectTarget.gateLevel - 5)), tier2: Math.min(3, Math.max(0, inspectTarget.gateLevel - 6)), tier3: 0 },
                  defense: { tier1: Math.min(3, Math.max(1, inspectTarget.gateLevel - 5)), tier2: Math.min(3, Math.max(0, inspectTarget.gateLevel - 6)), tier3: 0 },
                  utility: { tier1: Math.min(3, Math.max(1, inspectTarget.gateLevel - 5)), tier2: Math.min(3, Math.max(0, inspectTarget.gateLevel - 6)), tier3: 0 },
                };
                const totalTowerLv =
                  targetTower.attack.tier1 + targetTower.attack.tier2 + targetTower.attack.tier3 +
                  targetTower.defense.tier1 + targetTower.defense.tier2 + targetTower.defense.tier3 +
                  targetTower.utility.tier1 + targetTower.utility.tier2 + targetTower.utility.tier3;

                return (
                  <div className="bg-[#090e1a] p-3 rounded-xl border border-[#162238] flex flex-col gap-2">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#00d2ff]">🗼</span>
                        <span>상대 방어 전술 타워 구축 현황</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#ffd54f]">
                        총 Lv.{totalTowerLv} / 27
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {/* ⚔️ 공격 전술 */}
                      <div className="p-2 rounded-xl bg-[#121624] border border-[#ff416c33] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between border-b border-[#ff416c22] pb-1">
                          <span className="font-bold text-[#ff416c] flex items-center gap-1 text-[11px]">
                            <span>⚔️</span>
                            <span>공격 전술</span>
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] font-mono">
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">1차(진지)</span>
                            <span className="font-bold text-[#ff416c]">Lv.{targetTower.attack.tier1}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">2차(포격)</span>
                            <span className="font-bold text-[#ff416c]">Lv.{targetTower.attack.tier2}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">3차(시들음)</span>
                            <span className="font-bold text-[#ff416c]">Lv.{targetTower.attack.tier3}</span>
                          </div>
                        </div>
                      </div>

                      {/* 🛡️ 방어 전술 */}
                      <div className="p-2 rounded-xl bg-[#0f1926] border border-[#00d2ff33] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between border-b border-[#00d2ff22] pb-1">
                          <span className="font-bold text-[#00d2ff] flex items-center gap-1 text-[11px]">
                            <span>🛡️</span>
                            <span>방어 전술</span>
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] font-mono">
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">1차(결계)</span>
                            <span className="font-bold text-[#00d2ff]">Lv.{targetTower.defense.tier1}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">2차(재생)</span>
                            <span className="font-bold text-[#00d2ff]">Lv.{targetTower.defense.tier2}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">3차(파쇄)</span>
                            <span className="font-bold text-[#00d2ff]">Lv.{targetTower.defense.tier3}</span>
                          </div>
                        </div>
                      </div>

                      {/* ⚡ 유틸 전술 */}
                      <div className="p-2 rounded-xl bg-[#1c1a16] border border-[#ffd54f33] flex flex-col gap-1.5">
                        <div className="flex items-center justify-between border-b border-[#ffd54f22] pb-1">
                          <span className="font-bold text-[#ffd54f] flex items-center gap-1 text-[11px]">
                            <span>⚡</span>
                            <span>유틸 전술</span>
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] font-mono">
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">1차(감속)</span>
                            <span className="font-bold text-[#ffd54f]">Lv.{targetTower.utility.tier1}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">2차(누출)</span>
                            <span className="font-bold text-[#ffd54f]">Lv.{targetTower.utility.tier2}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#cfd8e8]">
                            <span className="text-[#8b9bb4]">3차(저주)</span>
                            <span className="font-bold text-[#ffd54f]">Lv.{targetTower.utility.tier3}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 약탈 전리품 안내 (고정 2종 + 카테고리별 랜덤 3종, 각 30% 약탈) */}
              <div className="bg-[#090e1a] p-3 rounded-xl border border-[#162238] flex flex-col gap-2">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>🪙 약탈 전리품 안내 (침공 승리 시 각 30% 약탈)</span>
                  <span className="text-[#38ef7d] font-mono font-bold text-xs">고정 2종 + 카테고리별 랜덤 3종</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#101728] border border-[#1e2d48] flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <div className="text-[10px] text-[#ffd54f] font-bold">고정 약탈 (30%)</div>
                      <div className="text-[11px] text-[#cfd8e8]">골드 🪙 · 에테르 ✨</div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#101728] border border-[#1e2d48] flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <div>
                      <div className="text-[10px] text-[#00d2ff] font-bold">영지 생산자원 1종 랜덤 (30%)</div>
                      <div className="text-[11px] text-[#cfd8e8]">목재🪵, 석재🪨, 철광⚙️, 식량🍖</div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#101728] border border-[#1e2d48] flex items-center gap-2">
                    <span className="text-xl">🌿</span>
                    <div>
                      <div className="text-[10px] text-[#38ef7d] font-bold">파밍 재료 1종 랜덤 (30%)</div>
                      <div className="text-[11px] text-[#cfd8e8]">약초🌿, 가죽🧱, 실크🧵, 석탄⚫, 뼈🦴</div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#101728] border border-[#1e2d48] flex items-center gap-2">
                    <span className="text-xl">🔮</span>
                    <div>
                      <div className="text-[10px] text-[#ce93d8] font-bold">심연 재료 1종 랜덤 (30%)</div>
                      <div className="text-[11px] text-[#cfd8e8]">마법수정🔮, 공허파편🌌, 접두석💎, 접미석💠</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 모달 풋터 */}
            <div className="px-4 py-3 bg-[#0a0f1d] border-t border-[#1f2d48] flex items-center justify-end gap-2">
              <button
                className="btn btn-ghost text-xs px-4 py-2 text-[#8b9bb4]"
                onClick={() => setInspectTarget(null)}
              >
                취소
              </button>
              <button
                className="btn btn-primary text-xs px-6 py-2.5 font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/40"
                disabled={inspectTarget.isShielded}
                onClick={() => handleStartInvasion(inspectTarget)}
              >
                <span>⚔️</span>
                <span>원정대 출격 및 침공 시작</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ 🗼 방어 전술 타워 테크 상세 연구 모달 ════════ */}
      {selectedTech && (() => {
        const key = `tier${selectedTech.tier}` as 'tier1' | 'tier2' | 'tier3';
        const currentLv = tacticalTower[selectedTech.branch][key] || 0;
        const prevLv =
          selectedTech.tier === 1
            ? 1
            : tacticalTower[selectedTech.branch][`tier${(selectedTech.tier - 1) as 1 | 2}`] || 0;
        const isLocked = selectedTech.tier > 1 && prevLv < 1;
        const isMax = currentLv >= 3;
        const cost = gm.getTacticalTowerUpgradeCost(selectedTech.branch, selectedTech.tier, currentLv);

        // 자원 충분 여부 체크
        let canAfford = true;
        for (const [rKey, amt] of Object.entries(cost)) {
          if ((state.resources[rKey as keyof GameResources] || 0) < (amt as number)) {
            canAfford = false;
            break;
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-[#0d1424] border border-[#243554] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              {/* 모달 헤더 */}
              <div
                className="px-4 py-3 bg-gradient-to-r from-[#141e33] to-[#0d1424] border-b border-[#1f2d48] flex items-center justify-between"
                style={{ borderTop: `3px solid ${selectedTech.accentColor}` }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-2xl p-1.5 rounded-xl border"
                    style={{
                      backgroundColor: `${selectedTech.accentColor}18`,
                      borderColor: `${selectedTech.accentColor}44`,
                    }}
                  >
                    {selectedTech.icon}
                  </span>
                  <div>
                    <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>{selectedTech.name}</span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold"
                        style={{
                          backgroundColor: `${selectedTech.accentColor}22`,
                          color: selectedTech.accentColor,
                          border: `1px solid ${selectedTech.accentColor}44`,
                        }}
                      >
                        {selectedTech.branchName} · {selectedTech.tier}차 테크
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8b9bb4] mt-0.5">
                      연구 단계: <span className="font-bold text-white">Lv.{currentLv}</span> / 3
                    </div>
                  </div>
                </div>

                <button
                  className="text-gray-400 hover:text-white p-1 rounded-lg text-lg"
                  onClick={() => setSelectedTech(null)}
                >
                  ✕
                </button>
              </div>

              {/* 모달 바디 */}
              <div className="p-4 flex flex-col gap-3.5 overflow-y-auto">
                {/* 레벨 표시기 */}
                <div className="bg-[#090e1a] p-3 rounded-xl border border-[#162238] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#8b9bb4]">현재 연구 상태</div>
                    <div
                      className="text-sm font-black font-mono mt-0.5"
                      style={{ color: currentLv > 0 ? selectedTech.accentColor : '#78909c' }}
                    >
                      {currentLv > 0 ? `Lv.${currentLv} 강화 활성` : '미연구 (Lv.0)'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((star) => (
                      <span
                        key={star}
                        className="text-lg"
                        style={{ color: star <= currentLv ? selectedTech.accentColor : '#263238' }}
                      >
                        ◆
                      </span>
                    ))}
                  </div>
                </div>

                {/* 기술 설명 */}
                <div className="p-3 bg-[#0a101d] rounded-xl border border-[#172338] text-xs text-[#cfd8e8] leading-relaxed">
                  {selectedTech.desc}
                </div>

                {/* 효과 비교 박스 */}
                <div className="bg-[#090e1a] p-3 rounded-xl border border-[#162238] flex flex-col gap-2 text-xs">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>전술 효과 수치</span>
                  </div>
                  <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between bg-[#101726] p-2 rounded-lg border border-[#1c2a40]">
                      <span className="text-[#8b9bb4]">현재 효과:</span>
                      <span className="text-[#38ef7d] font-bold">
                        {currentLv > 0 ? selectedTech.effectText(currentLv) : '미적용'}
                      </span>
                    </div>
                    {!isMax && (
                      <div className="flex items-center justify-between bg-[#141b2a] p-2 rounded-lg border border-[#233550]">
                        <span className="text-[#ffd54f]">다음 레벨 (Lv.{currentLv + 1}):</span>
                        <span className="text-[#ffd54f] font-bold">
                          {selectedTech.nextEffectText(currentLv)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 선행 기술 잠금 체크 */}
                {isLocked && (
                  <div className="p-3 bg-[#241316] rounded-xl border border-[#4d1f27] text-xs text-[#ff5252] flex items-center gap-2">
                    <span>🔒</span>
                    <span>선행 기술인 {selectedTech.tier - 1}차 테크를 1레벨 이상 먼저 연구해야 활성화됩니다.</span>
                  </div>
                )}

                {/* 소모 심연 연구 재료 */}
                {!isMax && (
                  <div className="bg-[#090e1a] p-3 rounded-xl border border-[#162238] flex flex-col gap-2">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>필요 심연 연구 재료</span>
                      <span className="text-[10px] text-[#8b9bb4]">소모 자원 / 보유량</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(cost).map(([rKey, amt]) => {
                        const curAmt = state.resources[rKey as keyof GameResources] || 0;
                        const hasEnough = curAmt >= (amt as number);
                        const icons: Record<string, { icon: string; name: string }> = {
                          gold: { icon: '🪙', name: '골드' },
                          ether: { icon: '✨', name: '에테르' },
                          crystal: { icon: '🔮', name: '마법 수정' },
                          void_shard: { icon: '🌌', name: '공허 파편' },
                        };
                        const meta = icons[rKey] || { icon: '📦', name: rKey };

                        return (
                          <div
                            key={rKey}
                            className={`p-2 rounded-lg border flex items-center justify-between ${
                              hasEnough
                                ? 'bg-[#101726] border-[#1d2a40] text-white'
                                : 'bg-[#261016] border-[#4a1c24] text-[#ff5252]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{meta.icon}</span>
                              <span className="text-[11px]">{meta.name}</span>
                            </div>
                            <div className="text-right text-[11px]">
                              <span className="font-bold">{(amt as number).toLocaleString()}</span>
                              <span className="text-[9px] opacity-70 ml-1">
                                / {curAmt >= 1000 ? `${(curAmt / 1000).toFixed(1)}k` : curAmt}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 모달 풋터 */}
              <div className="px-4 py-3 bg-[#0a0f1d] border-t border-[#1f2d48] flex items-center justify-end gap-2">
                <button
                  className="btn btn-ghost text-xs px-4 py-2 text-[#8b9bb4]"
                  onClick={() => setSelectedTech(null)}
                >
                  닫기
                </button>

                {isMax ? (
                  <div className="px-4 py-2 rounded-xl bg-[#122b22] text-[#38ef7d] font-bold text-xs border border-[#1e4e3b]">
                    ★ 최고 레벨 연구 완료
                  </div>
                ) : (
                  <button
                    className={`btn text-xs px-6 py-2.5 font-bold flex items-center gap-2 shadow-lg ${
                      !isLocked && canAfford
                        ? 'btn-primary shadow-cyan-900/40'
                        : 'btn-ghost opacity-50 cursor-not-allowed'
                    }`}
                    disabled={isLocked || !canAfford}
                    onClick={() => {
                      handleUpgradeTower(selectedTech.branch, selectedTech.tier);
                    }}
                  >
                    <span>⚡</span>
                    <span>연구 진행 (Lv.{currentLv + 1} 달성)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
