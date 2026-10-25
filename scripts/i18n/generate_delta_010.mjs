import fs from 'fs';
import path from 'path';

const delta = {
  // ── 1. 차원 칙령 프리셋 (GameDataService.ts & CustomDataStudioModal.tsx) ──
  "치명 금지의 칙령": {
    "en": "Edict of Crit Prohibition",
    "ja": "致命禁止の勅令"
  },
  "차원 결투장 전역에 치명타 불가 결계가 가동됩니다. (💥 CRIT 뱃지 획득 불가)": {
    "en": "A critical hit disabling barrier is active across the dimensional arena. (💥 CRIT badges cannot be obtained)",
    "ja": "次元決闘場全域に会心不可の結界が作動します。（💥 CRITバッジ獲得不可）"
  },
  "파쇄 금지의 칙령": {
    "en": "Edict of Break Prohibition",
    "ja": "破砕禁止の勅令"
  },
  "차원 결투장 전역에 파쇄 불가 결계가 가동됩니다. (💫 BREAK 뱃지 획득 불가)": {
    "en": "A guard break disabling barrier is active across the dimensional arena. (💫 BREAK badges cannot be obtained)",
    "ja": "次元決闘場全域に破砕不可の結界が作動します。（💫 BREAKバッジ獲得不可）"
  },
  "수호 금지의 칙령": {
    "en": "Edict of Guard Prohibition",
    "ja": "守護禁止の勅令"
  },
  "차원 결투장 전역에 수호 개입 불가 결계가 가동됩니다. (🛡️ GUARD 뱃지 획득 불가)": {
    "en": "A guard intervention disabling barrier is active across the dimensional arena. (🛡️ GUARD badges cannot be obtained)",
    "ja": "次元決闘場全域に守護介入不可の結界が作動します。（🛡️ GUARDバッジ獲得不可）"
  },
  "치유 금지의 칙령": {
    "en": "Edict of Heal Prohibition",
    "ja": "治癒禁止の勅令"
  },
  "차원 결투장 전역에 신성 치유 불가 결계가 가동됩니다. (✨ HEAL 뱃지 획득 불가)": {
    "en": "A divine healing disabling barrier is active across the dimensional arena. (✨ HEAL badges cannot be obtained)",
    "ja": "次元決闘場全域に神聖治癒不可の結界が作動します。（✨ HEALバッジ獲得不可）"
  },
  "자유 결투의 칙령": {
    "en": "Edict of Free Duel",
    "ja": "自由決闘の勅令"
  },
  "모든 피버 뱃지 획득이 자유롭게 허용되는 전술 칙령입니다. (🚫 금지 배지 없음)": {
    "en": "A tactical edict where all fever badges can be freely acquired. (🚫 No banned badges)",
    "ja": "すべてのフィーバーバッジ獲得が自由に許可される戦術勅令です。（🚫 禁止バッジなし）"
  },
  "차원 결투장 전역에 회피 불가 결계가 가동됩니다. (💨 EVADE 뱃지 획득 불가)": {
    "en": "An evasion disabling barrier is active across the dimensional arena. (💨 EVADE badges cannot be obtained)",
    "ja": "次元決闘場全域に回避不可の結界が作動します。（💨 EVADEバッジ獲得不可）"
  },

  // ── 2. 아레나 족보 도감 모달 (ArenaScreen.tsx) ──
  "차원 아레나: 피버 족보 & 상성 대도감": {
    "en": "Dimensional Arena: Fever Hands & Affinity Codex",
    "ja": "次元アリーナ：フィーバー役＆相性大図鑑"
  },
  "3인의 수호자가 엮어내는 전술 포커의 위계와 주간 차원율의 상성을 한눈에 확인하십시오.": {
    "en": "View the tactical poker hierarchy woven by 3 guardians and the weekly dimensional affinity cycle at a glance.",
    "ja": "3人の守護者が織りなす戦術ポーカーの序列と週間次元律の相性を一目でご確認ください。"
  },
  "상성 순환 구조": {
    "en": "Affinity Cycle Structure",
    "ja": "相性循環構造"
  },
  "상성 우위 특전": {
    "en": "Affinity Advantage Perk",
    "ja": "相性優位特典"
  },
  "족보 맞대결 시 판정 계급 +1단계 보너스": {
    "en": "Hand Rank +1 Tier Bonus in Hand Showdown",
    "ja": "役対決時の判定階級＋1段階ボーナス"
  },
  "🚫 이번 주 금기 배지": {
    "en": "🚫 This Week's Taboo Badge",
    "ja": "🚫 今週の禁忌バッジ"
  },
  "상성 판정 원리:": {
    "en": "Affinity Rule Principle:",
    "ja": "相性判定の原理："
  },
  "양측이 완성한 피버 족보의 계열(돌파/수호/변칙)을 대조하여 우위인 쪽은 족보 판정에서 1단계 높은 족보로 인정받습니다.": {
    "en": "By comparing the affinity categories (Burst/Guard/Trick) of completed fever hands, the favored side is recognized as one tier higher in hand adjudication.",
    "ja": "双方が完成させたフィーバー役の系列（突破/守護/変則）を照合し、優位な側は役判定で1段階上の役として認められます。"
  },
  "배지 가중치 총점표 (High Card Score)": {
    "en": "Badge Weight Score Table (High Card Score)",
    "ja": "バッジ加重総点表（High Card Score）"
  },
  "노페어(전술 파동) 발생 시 적용": {
    "en": "Applied on No-Pair (Tactical Wave)",
    "ja": "ノーペア（戦術波動）発生時に適用"
  },
  "양측 모두 유효한 족보를 완성하지 못해 [전술 파동(High Card)]으로 격돌할 경우, 게이지 5칸에 누적된 배지들의 개별 가중치 총점을 합산하여 승패를 결정합니다.": {
    "en": "When neither side completes a valid hand and clashes with [Tactical Wave (High Card)], victory is decided by summing the individual weight scores of badges accumulated across 5 gauges.",
    "ja": "双方が有効な役を完成できず［戦術波動（High Card）］で激突した場合、ゲージ5マスに蓄積されたバッジの個別加重総点を合算して勝敗を決定します。"
  },
  "연계 (Extra)": {
    "en": "Chain (Extra)",
    "ja": "連携（Extra）"
  },
  "스킬 콤보·추가타": {
    "en": "Skill Combo & Follow-up",
    "ja": "スキルコンボ・追撃"
  },
  "반격 (Counter)": {
    "en": "Counter (Counter)",
    "ja": "反撃（Counter）"
  },
  "적 턴 반격 반응": {
    "en": "Enemy Turn Riposte",
    "ja": "敵ターン反撃反応"
  },
  "치명 (Crit)": {
    "en": "Crit (Crit)",
    "ja": "致命（Crit）"
  },
  "회심의 일격": {
    "en": "Critical Strike",
    "ja": "会心の一撃"
  },
  "파쇄 (Break)": {
    "en": "Break (Break)",
    "ja": "破砕（Break）"
  },
  "방어 분쇄·실드 관통": {
    "en": "Shield Piercing & Break",
    "ja": "防御粉砕・シールド貫通"
  },
  "방어 (Guard)": {
    "en": "Guard (Guard)",
    "ja": "防御（Guard）"
  },
  "철벽 방어·막기": {
    "en": "Ironclad Block & Guard",
    "ja": "鉄壁防御・ガード"
  },
  "지원 (Assist)": {
    "en": "Assist (Assist)",
    "ja": "支援（Assist）"
  },
  "아군 버프·정화": {
    "en": "Ally Buff & Cleanse",
    "ja": "味方バフ・浄化"
  },
  "치유 (Heal)": {
    "en": "Heal (Heal)",
    "ja": "治癒（Heal）"
  },
  "생명력 회복": {
    "en": "HP Recovery",
    "ja": "生命力回復"
  },
  "회피 (Evade)": {
    "en": "Evade (Evade)",
    "ja": "回避（Evade）"
  },
  "완전 회피 기동": {
    "en": "Perfect Evasion",
    "ja": "完全回避機動"
  },
  "차원 피버 12대 전술 족보 (Synergy Rankings)": {
    "en": "Dimensional Fever 12 Tactical Hands (Synergy Rankings)",
    "ja": "次元フィーバー12大戦術役（Synergy Rankings）"
  },
  "위계 순위 높은 순 정렬": {
    "en": "Sorted by Highest Rank Order",
    "ja": "序列の高い順にソート"
  },
  "필요 배지 조건": {
    "en": "Required Badges",
    "ja": "必要バッジ条件"
  },
  "필요 배지": {
    "en": "Required Badges",
    "ja": "必要バッジ"
  },
  "확인 (닫기)": {
    "en": "Confirm (Close)",
    "ja": "確認（閉じる）"
  },

  // ── 3. 족보 이름, 계열, 위계, 필요 배지, 요약문 ──
  "돌파계": {
    "en": "Burst",
    "ja": "突破系"
  },
  "수호계": {
    "en": "Guard",
    "ja": "守護系"
  },
  "변칙계": {
    "en": "Trick",
    "ja": "変則系"
  },
  "전술의 극의": {
    "en": "Grand Maestro",
    "ja": "戦術の極意"
  },
  "철벽 수호": {
    "en": "Iron Bulwark",
    "ja": "鉄壁守護"
  },
  "연격 폭풍": {
    "en": "Chain Onslaught",
    "ja": "連撃嵐"
  },
  "기적의 소생": {
    "en": "Miracle Resurrection",
    "ja": "奇跡の蘇生"
  },
  "신성 성역": {
    "en": "Divine Sanctuary",
    "ja": "神聖聖域"
  },
  "질풍노도": {
    "en": "Flurry Overdrive",
    "ja": "疾風怒濤"
  },
  "총력 섬멸": {
    "en": "Total Assault",
    "ja": "総力殲滅"
  },
  "환영 신기루": {
    "en": "Mirage Step",
    "ja": "幻影蜃気楼"
  },
  "불멸의 요새": {
    "en": "Immortal Bastion",
    "ja": "不滅の要塞"
  },
  "흡혈 진혼곡": {
    "en": "Vampiric Requiem",
    "ja": "吸血鎮魂曲"
  },
  "기사회생": {
    "en": "Miracle Revive",
    "ja": "起死回生"
  },
  "전술 파동": {
    "en": "Tactical Burst",
    "ja": "戦術波動"
  },
  "스트레이트 (최상위)": {
    "en": "Straight (Supreme)",
    "ja": "ストレート（最上位）"
  },
  "포카드 (최상위 수호)": {
    "en": "Four of a Kind (Supreme Guard)",
    "ja": "フォーカード（最上位守護）"
  },
  "포카드 (최상위 돌파)": {
    "en": "Four of a Kind (Supreme Burst)",
    "ja": "フォーカード（最上位突破）"
  },
  "풀하우스": {
    "en": "Full House",
    "ja": "フルハウス"
  },
  "트리플 / 풀하우스급": {
    "en": "Three of a Kind / Full House Tier",
    "ja": "スリーカード／フルハウス級"
  },
  "트리플 / 투페어": {
    "en": "Three of a Kind / Two Pair",
    "ja": "スリーカード／ツーペア"
  },
  "트리플": {
    "en": "Three of a Kind",
    "ja": "スリーカード"
  },
  "투페어": {
    "en": "Two Pair",
    "ja": "ツーペア"
  },
  "원페어": {
    "en": "One Pair",
    "ja": "ワンペア"
  },
  "노페어 (하이카드)": {
    "en": "No Pair (High Card)",
    "ja": "ノーペア（ハイカード）"
  },
  "5종 서로 다른 배지 (무지개)": {
    "en": "5 Distinct Badges (Rainbow)",
    "ja": "5種の異なるバッジ（虹）"
  },
  "🛡️ 가드 4개 이상": {
    "en": "🛡️ 4+ Guard Badges",
    "ja": "🛡️ ガード4個以上"
  },
  "⚡ 엑스트라 4개 이상": {
    "en": "⚡ 4+ Extra Badges",
    "ja": "⚡ エクストラ4個以上"
  },
  "🛡️ 가드 2개 + 💖 힐 3개": {
    "en": "🛡️ 2 Guard + 💖 3 Heal",
    "ja": "🛡️ ガード2個＋💖 ヒール3個"
  },
  "💖 힐 3개 이상": {
    "en": "💖 3+ Heal Badges",
    "ja": "💖 ヒール3個以上"
  },
  "💥 크릿 3개 이상 (또는 크릿2 + 엑스트라2)": {
    "en": "💥 3+ Crit (or 2 Crit + 2 Extra)",
    "ja": "💥 クリティカル3個以上（またはクリ2＋エクストラ2）"
  },
  "🎯 어시스트 3개 이상 (또는 어시스트2 + 엑스트라2)": {
    "en": "🎯 3+ Assist (or 2 Assist + 2 Extra)",
    "ja": "🎯 アシスト3個以上（またはアシスト2＋エクストラ2）"
  },
  "🌀 회피 3개 이상": {
    "en": "🌀 3+ Evade Badges",
    "ja": "🌀 回避3個以上"
  },
  "🛡️ 가드 2개 + ⚔️ 카운터 2개": {
    "en": "🛡️ 2 Guard + ⚔️ 2 Counter",
    "ja": "🛡️ ガード2個＋⚔️ カウンター2個"
  },
  "⚔️ 카운터 2개 또는 💫 브레이크 2개": {
    "en": "⚔️ 2 Counter or 💫 2 Break",
    "ja": "⚔️ カウンター2個または💫 ブレイク2個"
  },
  "🛡️ 가드 3개 이상 또는 💖 힐 3개 이상": {
    "en": "🛡️ 3+ Guard or 💖 3+ Heal",
    "ja": "🛡️ ガード3個以上または💖 ヒール3個以上"
  },
  "임의의 배지 5개 (특수 조합 실패 시)": {
    "en": "Any 5 Badges (When special combo fails)",
    "ja": "任意のバッジ5個（特殊役不成立時）"
  },
  "상성 무관 절대 승리. 적 전체 1턴 기절, 위력 +80%, 파티 MP 30% 회복": {
    "en": "Absolute victory regardless of affinity. Stuns all enemies for 1 turn, power +80%, restores 30% party MP",
    "ja": "相性無関係の絶対勝利。敵全体を1ターン気絶、威力＋80％、パーティMP30％回復"
  },
  "파티 전원 최대 HP 25% 에테르 보호막(3턴) 즉시 전개": {
    "en": "Immediately deploys 25% Max HP Aether barrier (3 turns) to all allies",
    "ja": "味方全員に最大HP25％のエーテルバリア（3ターン）を即時展開"
  },
  "궁극기 범위 적 전체로 강제 확장 + 최종 위력 +50% + 치명타율 +50%": {
    "en": "Ultimate range forced to all enemies + final power +50% + crit rate +50%",
    "ja": "アルティメット範囲を敵全体に強制拡張＋最終威力＋50％＋会心率＋50％"
  },
  "사망 아군 1인 30% 체력으로 부활과 회복된 체력만큼 적 전체에 신성 공격": {
    "en": "Revives 1 fallen ally with 30% HP and deals divine damage to all enemies equal to recovered HP",
    "ja": "戦闘不能の味方1人をHP30％で蘇生、回復したHP量と同等の神聖ダメージを敵全体に与える"
  },
  "파티 전원 체력 50% 대량 회복 및 1턴간 모든 해로운 효과 면역": {
    "en": "Restores 50% HP to all allies and grants 1 turn immunity to all debuffs",
    "ja": "味方全員のHPを50％大幅回復＆1ターンの間すべての有害効果を無効化"
  },
  "방어력 50% 관통 + 확정 치명타 + 치명타 피해 +30%": {
    "en": "50% defense penetration + guaranteed critical hit + crit damage +30%",
    "ja": "防御力50％貫通＋確定会心＋会心ダメージ＋30％"
  },
  "궁극기 범위 적 전체 강제 확장 + 최종 위력 +60% + 방어 관통 40%": {
    "en": "Ultimate range forced to all enemies + final power +60% + armor penetration 40%",
    "ja": "アルティメット範囲を敵全体に強制拡張＋最終威力＋60％＋防御貫通40％"
  },
  "파티 전원 명중력 +50% 증가 & 2턴간 [환영 반격 결계] 전개": {
    "en": "All allies accuracy +50% & deploys [Mirage Counter Barrier] for 2 turns",
    "ja": "味方全員の命中力＋50％上昇＆2ターンの間［幻影反撃結界］を展開"
  },
  "전 파티원 최대 HP 30% 에테르 방벽 부여 + 2턴간 100% 환영 반격 결계": {
    "en": "Grants 30% Max HP Aether barrier to all allies + 100% Mirage Counter Barrier for 2 turns",
    "ja": "味方全員に最大HP30％のエーテル障壁付与＋2ターンの間100％幻影反撃結界"
  },
  "가한 피해 100% 균등 흡혈 파티 배분 + 초과분 에테르 방벽 전환": {
    "en": "Distributes 100% of damage dealt as lifesteal to party + converts excess to Aether barrier",
    "ja": "与えたダメージの100％を均等に味方に配分＋超過分をエーテル障壁に変換"
  },
  "사망 아군 1인 HP 10% 부활 & 생존 아군 HP 50% 회복 및 디버프 정화": {
    "en": "Revives 1 fallen ally with 10% HP & restores 50% HP to surviving allies and cleanses debuffs",
    "ja": "戦闘不能の味方1人をHP10％で蘇生＆生存中の味方HPを50％回復およびデバフ浄化"
  },
  "보유 배지 가중치 총점에 비례한 기본 스탯 증폭 및 피해량 가산": {
    "en": "Basic stat amplification and bonus damage proportional to total badge weight score",
    "ja": "所持バッジの加重総点に比例した基本ステータス増幅およびダメージ加算"
  },

  // ── 4. 주간 차원율 규칙 (feverUtils.ts) ──
  "정규 차원율 (Standard)": {
    "en": "Standard Dimensional Affinity",
    "ja": "正規次元律（Standard）"
  },
  "💥돌파 > 🌀변칙 > 🛡️수호 > 💥돌파": {
    "en": "💥Burst > 🌀Trick > 🛡️Guard > 💥Burst",
    "ja": "💥突破 > 🌀変則 > 🛡️守護 > 💥突破"
  },
  "돌파계가 변칙계를 부수고, 변칙계가 수호계를 뚫으며, 수호계가 돌파계를 받아냅니다.": {
    "en": "Burst crushes Trick, Trick pierces Guard, and Guard endures Burst.",
    "ja": "突破系が変則系を砕き、変則系が守護系を破り、守護系が突破系を受け止めます。"
  },
  "반전 차원율 (Inverted)": {
    "en": "Inverted Dimensional Affinity",
    "ja": "反転次元律（Inverted）"
  },
  "🛡️수호 > 🌀변칙 > 💥돌파 > 🛡️수호": {
    "en": "🛡️Guard > 🌀Trick > 💥Burst > 🛡️Guard",
    "ja": "🛡️守護 > 🌀変則 > 💥突破 > 🛡️守護"
  },
  "차원의 왜곡으로 상성이 정반대로 역전되어 수호계가 변칙계를, 변칙계가 돌파계를, 돌파계가 수호계를 격파합니다.": {
    "en": "Dimensional distortion inverts affinities: Guard defeats Trick, Trick defeats Burst, and Burst defeats Guard.",
    "ja": "次元の歪みにより相性が正反対に逆転し、守護系が変則系を、変則系が突破系を、突破系が守護系を撃破します。"
  },
  "혼돈 차원율 (Disruption)": {
    "en": "Disruption Dimensional Affinity",
    "ja": "混沌次元律（Disruption）"
  },
  "🌀변칙 > 💥돌파 > 🛡️수호 > 🌀변칙": {
    "en": "🌀Trick > 💥Burst > 🛡️Guard > 🌀Trick",
    "ja": "🌀変則 > 💥突破 > 🛡️守護 > 🌀変則"
  },
  "변칙계의 환영이 돌파계를 농락하고, 돌파계가 수호계를 분쇄하며, 수호계가 변칙계를 봉쇄합니다.": {
    "en": "Trick illusions outmaneuver Burst, Burst shatters Guard, and Guard locks down Trick.",
    "ja": "変則系の幻影が突破系を翻弄し、突破系が守護系を粉砕し、守護系が変則系を封殺します。"
  },

  // ── 5. 백과사전 아레나 탭 & 가이드 백과 텍스트 (EncyclopediaModal.tsx & encyclopediaData.ts) ──
  "차원 아레나": {
    "en": "Dimensional Arena",
    "ja": "次元アリーナ"
  },
  "차원 아레나 룰 & 피버 족보 가이드": {
    "en": "Dimensional Arena Rules & Fever Hand Guide",
    "ja": "次元アリーナルール＆フィーバー役ガイド"
  },
  "차원 결투 핵심 룰 & 전투 메커니즘": {
    "en": "Core Duel Rules & Combat Mechanics",
    "ja": "次元決闘の重要ルール＆戦闘メカニズム"
  },
  "3v3 편성 · 홀덤 블러핑 · 피버 3선승": {
    "en": "3v3 Setup · Hold'em Bluffing · Fever 3 Wins",
    "ja": "3v3編成・ホールデムブラッフィング・フィーバー3先勝"
  },
  "차원 아레나 핵심 결투 룰": {
    "en": "Dimensional Arena Core Duel Rules",
    "ja": "次元アリーナ重要決闘ルール"
  },
  "핵심 세부 가이드": {
    "en": "Key Detail Guide",
    "ja": "重要詳細ガイド"
  },
  "아레나 가이드": {
    "en": "Arena Guide",
    "ja": "アリーナガイド"
  },
  "족보 위계 (Hand Rank)": {
    "en": "Hand Rank",
    "ja": "役の序列（Hand Rank）"
  },
  "상성 계열 (Affinity)": {
    "en": "Affinity Category",
    "ja": "相性系列（Affinity）"
  },
  "전술 편성": {
    "en": "Tactical Setup",
    "ja": "戦術編成"
  },
  "홀덤 블러핑": {
    "en": "Hold'em Bluffing",
    "ja": "ホールデムブラッフィング"
  },
  "승패 룰": {
    "en": "Victory Rules",
    "ja": "勝敗ルール"
  },
  "차원 칙령": {
    "en": "Dimensional Edict",
    "ja": "次元勅令"
  },
  "상성 순환": {
    "en": "Affinity Cycle",
    "ja": "相性循環"
  },
  "하이 카드": {
    "en": "High Card",
    "ja": "ハイカード"
  },
  "3v3+1+1 차원 결투단 편성 (선발 3인 + 리더 1인 + 서포터 1인)": {
    "en": "3v3+1+1 Dimensional Squad Setup (3 Vanguard + 1 Leader + 1 Supporter)",
    "ja": "3v3+1+1 次元決闘団編成（先発3名＋リーダー1名＋サポーター1名）"
  },
  "아레나 결투단은 필드에서 직접 교전하는 선발 3인(전열·중열·후열)과 전장을 총괄하는 리더(영령 가호 & 피버 궁극기), 선발 결원 시 즉각 난입하는 서포터 1인으로 구성됩니다.": {
    "en": "The arena squad consists of 3 vanguards battling on the field (Front, Mid, Back), a leader overseeing the battle (Heroic Aegis & Fever Ultimate), and 1 supporter who immediately steps in upon casualty.",
    "ja": "アリーナ決闘団はフィールドで直接交戦する先発3名（前列・中列・後列）と、戦場を統括するリーダー（英霊の加護＆フィーバー必殺技）、先発離脱時に即時乱入するサポーター1名で構成されます。"
  },
  "전열 (1번 슬롯): 적의 집중 포화를 최우선으로 받아내며 진형을 사수하는 수호자 (수호기사, 성벽가디언 등)": {
    "en": "Front (Slot 1): Guardians who absorb enemy focus fire and protect the formation (Guardian Knight, Fortress, etc.)",
    "ja": "前列（1番枠）：敵の集中砲火を最優先で受け止め陣形を死守する守護者（守護騎士、城壁ガーディアンなど）"
  },
  "중열 (2번 슬롯): 전열과 후열 사이에서 스킬 연계 및 주력 딜링을 담당하는 핵심 전투원 (검사, 광전사, 암살자 등)": {
    "en": "Mid (Slot 2): Core combatants responsible for skill chains and primary DPS between front and back (Swordsman, Berserker, Assassin, etc.)",
    "ja": "中列（2番枠）：前列と後列の間でスキル連携および主戦力を担当する核心戦闘員（剣士、狂戦士、暗殺者など）"
  },
  "후열 (3번 슬롯): 후방에서 원거리 저격, 마법 폭격 또는 아군 치유를 전담하는 지원 사격수 (마도사, 사제, 마총사 등)": {
    "en": "Back (Slot 3): Support snipers providing ranged marksmanship, magic bombardment, or healing from the rear (Mage, Priest, Gunner, etc.)",
    "ja": "後列（3番枠）：後方から遠距離狙撃、魔法砲撃、または味方回復を担う支援射撃手（魔導士、司祭、魔銃士など）"
  },
  "오퍼레이터 리더: 직접 전투에는 참여하지 않으나 아군 전체에 상시 [영령의 가호] 버프를 부여하고, 피버 쇼다운 승리 시 자신의 궁극기를 전장에 투사합니다.": {
    "en": "Operator Leader: Does not fight directly, but grants a permanent [Heroic Aegis] buff to all allies and casts their ultimate skill upon winning a Fever Showdown.",
    "ja": "オペレーターリーダー：直接戦闘には参加しませんが、味方全体に常時［英霊の加護］バフを付与し、フィーバーショーダウン勝利時に自身の必殺技を放ちます。"
  },
  "서포터: 선발 용병 중 1인이 전사할 경우 즉시 해당 자리에 긴급 난입하며, 매 턴 아군 공격 시 확률적으로 [원호 사격]을 지원합니다.": {
    "en": "Supporter: Steps in immediately if a vanguard hero falls, and provides a chance of [Covering Fire] on every ally attack turn.",
    "ja": "サポーター：先発の傭兵が戦闘不能になった場合即座に参戦し、毎ターンの味方攻撃時に確率で［援護射撃］を支援します。"
  },
  "💡 팁: 리더의 영령 가호와 피버 궁극기 연계가 전투의 향방을 결정짓습니다. 성채 병영에서 아레나 부대를 미리 편성해 두세요.": {
    "en": "💡 Tip: The leader's heroic aegis and fever ultimate combo determine the outcome. Be sure to configure your arena squad in the Barracks beforehand.",
    "ja": "💡 ヒント：リーダーの英霊加護とフィーバー必殺技の連携が勝敗を左右します。城塞兵舎でアリーナ部隊を事前に編成しておきましょう。"
  },
  "홀덤 블러핑 앤 쇼다운 (2인 공개 + 1인 히든 실루엣)": {
    "en": "Hold'em Bluffing & Showdown (2 Revealed + 1 Hidden Silhouette)",
    "ja": "ホールデムブラッフィング＆ショーダウン（2人公開＋1人ヒドゥンシルエット）"
  },
  "상대방의 3인 중 2인만 사전에 공개되고 1인은 물음표 실루엣으로 감추어져 시작됩니다. 상대의 히든 용병과 주력 족보 노림수를 예측하여 카운터 편성을 맞추는 심리전입니다.": {
    "en": "Only 2 of the opponent's 3 heroes are revealed beforehand, with 1 concealed as a question mark silhouette. A mind game of predicting their hidden mercenary and hand tactics to set up counter squads.",
    "ja": "相手の3名のうち2名のみが事前公開され、1名はクエスチョンマークのシルエットで隠された状態で始まります。相手の隠された傭兵と主戦力役を予測し、カウンター編成を組む心理戦です。"
  },
  "공개된 2인의 클래스와 속성을 분석하여 숨겨진 3번째 용병의 정체(탱커/딜러/힐러)를 추론하십시오.": {
    "en": "Analyze the classes and affinities of the 2 revealed heroes to deduce the identity of the 3rd hidden mercenary (Tank/DPS/Healer).",
    "ja": "公開された2名のクラスと属性を分析し、隠された3人目の傭兵の役割（タンク／アタッカー／ヒーラー）を推理してください。"
  },
  "봇 및 상대 지휘관의 세팅 특성은 블라인드되어 있으므로, 덱의 상성과 피버 계열 유불리를 면밀히 계산해야 합니다.": {
    "en": "As bot and opponent traits are blinded, you must carefully calculate deck affinities and fever category advantages.",
    "ja": "ボットや対戦相手の特性設定はブラインドされているため、デッキの相性とフィーバー系列の有利不利を入念に計算する必要があります。"
  },
  "자신의 방어 덱 편성 시에도 3번 슬롯에 전략적 조커 영웅을 배치하여 도전자의 허를 찌를 수 있습니다.": {
    "en": "When configuring your own defense deck, placing a strategic joker hero in slot 3 can catch challengers off-guard.",
    "ja": "自身の防衛デッキ編成時にも3番枠に戦略的なジョーカー英雄を配置することで、挑戦者の意表を突くことができます。"
  },
  "💡 팁: 3번 슬롯의 히든 영웅은 피버 족보의 완성을 은폐하는 결정적 조커 카드가 됩니다.": {
    "en": "💡 Tip: The hidden hero in slot 3 serves as a decisive joker card concealing the completion of fever hands.",
    "ja": "💡 ヒント：3番枠のヒドゥン英雄は、フィーバー役の完成を秘匿する決定的なジョーカーカードとなります。"
  },
  "피버 3선승 선착 즉시 압승 룰 (Fever 3-Win Domination)": {
    "en": "Fever 3-Win Domination Rule",
    "ja": "フィーバー3先勝即時圧勝ルール（Fever 3-Win Domination）"
  },
  "치열한 공방전 중 피버콜 쇼다운에서 먼저 3승을 달성한 진영은 상대의 잔여 체력과 무관하게 즉시 전투에서 압승합니다.": {
    "en": "In fierce battles, the faction that achieves 3 wins first in Fever Call Showdown immediately wins, regardless of remaining HP.",
    "ja": "激しい攻防の中、フィーバーコールショーダウンで先に3勝を達成した陣営は、相手の残りHPに関わらず即座に戦闘で圧勝します。"
  },
  "피버 게이지 5칸이 먼저 충전된 진영이 [피버콜 선언]을 발동하며, 3턴의 유예 카운트다운이 시작됩니다.": {
    "en": "The faction that charges 5 fever gauges first triggers [Fever Call], initiating a 3-turn countdown grace period.",
    "ja": "フィーバーゲージ5マスを先に溜めた陣営が［フィーバーコール宣言］を発動し、3ターンの猶予カウントダウンが始まります。"
  },
  "3턴 유예 동안 상대도 피버를 완충하면 정면 [피버 쇼다운]이 벌어지며, 완충하지 못하면 선완성 진영이 타임아웃 판정승을 거둡니다.": {
    "en": "If the opponent also charges fever during the 3-turn grace period, a [Fever Showdown] occurs; otherwise, the first faction wins by timeout.",
    "ja": "3ターンの猶予中に相手もフィーバーを満たせば正面［フィーバーショーダウン］となり、満たせなければ先着側がタイムアウト判定勝ちとなります。"
  },
  "체력이 불리한 상황이라도 피버 족보 3승을 먼저 선착하면 극적인 역전 승리를 쟁취할 수 있습니다.": {
    "en": "Even if low on HP, securing 3 fever hand wins first leads to a dramatic comeback victory.",
    "ja": "HPで劣勢な状況でも、フィーバー役で先に3勝をもぎ取れば劇的な逆転勝利を掴み取ることができます。"
  },
  "💡 팁: 피버 뱃지는 아군 공격, 피격, 스킬 연계 시 축적됩니다. 빠른 뱃지 파밍이 피버 3선승의 핵심입니다.": {
    "en": "💡 Tip: Fever badges accumulate on ally attacks, hits taken, and skill chains. Fast badge acquisition is key to Fever 3-Win.",
    "ja": "💡 ヒント：フィーバーバッジは味方の攻撃、被弾、スキル連携時に蓄積されます。素早いバッジ収集がフィーバー3先勝の鍵です。"
  },
  "주간 차원 칙령 (Dimensional Edict) & 금기 뱃지": {
    "en": "Weekly Dimensional Edict & Taboo Badges",
    "ja": "週間次元勅令（Dimensional Edict）＆禁忌バッジ"
  },
  "차원 결투장에는 매주 강력한 차원 칙령이 발효되어 특정 피버 뱃지의 획득이 원천 차단됩니다.": {
    "en": "In the dimensional arena, a potent edict takes effect each week, completely banning the acquisition of specific fever badges.",
    "ja": "次元決闘場では毎週強力な次元勅令が発効し、特定のフィーバーバッジの獲得が根底から遮断されます。"
  },
  "회피 금지의 칙령: 💨 EVADE 뱃지 획득 불가 ➔ 회피 중심의 변칙 족보(환영 신기루 등) 완성이 봉인됩니다.": {
    "en": "Edict of Evade Prohibition: 💨 EVADE badges disabled ➔ Trick hands relying on evasion (Mirage Step, etc.) are sealed.",
    "ja": "回避禁止の勅令：💨 EVADEバッジ獲得不可 ➔ 回避主体の変則役（幻影蜃気楼など）の完成が封印されます。"
  },
  "치명 금지의 칙령: 💥 CRIT 뱃지 획득 불가 ➔ 질풍노도 등 극딜 족보 대신 수호나 연계 위주의 메타가 유리해집니다.": {
    "en": "Edict of Crit Prohibition: 💥 CRIT badges disabled ➔ High-burst hands like Flurry Overdrive give way to Guard and Chain metas.",
    "ja": "致命禁止の勅令：💥 CRITバッジ獲得不可 ➔ 疾風怒濤などの超火力役の代わりに、守護や連携主体のメタが有利になります。"
  },
  "파쇄 금지의 칙령: 💫 BREAK 뱃지 획득 불가 ➔ 적의 실드와 방어력을 뚫는 흡혈 진혼곡 및 파쇄 콤보가 제한됩니다.": {
    "en": "Edict of Break Prohibition: 💫 BREAK badges disabled ➔ Vampiric Requiem and break combos that bypass enemy shields are restricted.",
    "ja": "破砕禁止の勅令：💫 BREAKバッジ獲得不可 ➔ 敵のシールドと防御を貫く吸血鎮魂曲や破砕コンボが制限されます。"
  },
  "수호 금지의 칙령: 🛡️ GUARD 뱃지 획득 불가 ➔ 철벽 수호, 기적의 소생 등 방어형 족보가 봉인되어 극단적인 속도전이 펼쳐집니다.": {
    "en": "Edict of Guard Prohibition: 🛡️ GUARD badges disabled ➔ Defensive hands like Iron Bulwark and Miracle Resurrection are sealed, sparking rapid speed duels.",
    "ja": "守護禁止の勅令：🛡️ GUARDバッジ獲得不可 ➔ 鉄壁守護、奇跡の蘇生などの防御系役が封印され、極端なスピード戦が展開されます。"
  },
  "치유 금지의 칙령: ✨ HEAL 뱃지 획득 불가 ➔ 신성 성역 등의 회복 족보가 봉인되어 유지력보다 화력 집중이 중요해집니다.": {
    "en": "Edict of Heal Prohibition: ✨ HEAL badges disabled ➔ Healing hands like Divine Sanctuary are sealed, prioritizing burst damage over sustain.",
    "ja": "治癒禁止の勅令：✨ HEALバッジ獲得不可 ➔ 神聖聖域などの回復役が封印され、維持力よりも火力集中が重要になります。"
  },
  "💡 팁: 마스터 스튜디오에서 아레나 칙령을 실시간으로 설정하고 배포할 수 있습니다.": {
    "en": "💡 Tip: You can configure and deploy arena edicts in real-time within the Master Studio.",
    "ja": "💡 ヒント：マスタースタジオからアリーナ勅令をリアルタイムで設定・適用できます。"
  },
  "주간 차원율 가위바위보 상성 및 판정 계급 보너스": {
    "en": "Weekly Affinity Rock-Paper-Scissors & Rank Bonus",
    "ja": "週間次元律じゃんけん相性および判定階級ボーナス"
  },
  "피버 족보는 돌파(Burst), 수호(Guard), 변칙(Trick)의 3대 계열로 분류되며, 주간 차원율에 따라 상성 우위가 결정됩니다.": {
    "en": "Fever hands are classified into 3 categories: Burst, Guard, and Trick, with advantages determined by weekly dimensional affinity.",
    "ja": "フィーバー役は突破（Burst）、守護（Guard）、変則（Trick）の3大系列に分類され、週間次元律によって相性優位が決定されます。"
  },
  "기본 상성: 💥 돌파(Burst) > 🛡️ 수호(Guard) > 🌀 변칙(Trick) > 💥 돌파(Burst)": {
    "en": "Base Affinity: 💥 Burst > 🛡️ Guard > 🌀 Trick > 💥 Burst",
    "ja": "基本相性：💥 突破（Burst） > 🛡️ 守護（Guard） > 🌀 変則（Trick） > 💥 突破（Burst）"
  },
  "상성 우위 특전: 족보 맞대결 시 자신의 판정 계급이 +1단계 보너스를 받아 상대의 높은 족보를 무승부로 만들거나 역전할 수 있습니다.": {
    "en": "Affinity Perk: In hand showdowns, you receive a +1 rank bonus, enabling ties or upsets against higher enemy hands.",
    "ja": "相性優位特典：役対決時に自身の判定階級が＋1段階ボーナスを受け、相手のより高い役を引き分けに持ち込んだり逆転できます。"
  },
  "조커 (전술의 극의): 5종의 서로 다른 뱃지를 모은 [스트레이트] 족보는 상성을 완전히 초월하여 모든 계열에 절대 승리합니다.": {
    "en": "Joker (Grand Maestro): A [Straight] hand collecting 5 distinct badges transcends all affinities and achieves absolute victory.",
    "ja": "ジョーカー（戦術の極意）：5種の異なるバッジを集めた［ストレート］役は相性を完全に超越して全系列に絶対勝利します。"
  },
  "💡 팁: 차원율은 매주 월요일 00:00에 순환합니다. 상성 우위를 점하면 낮은 족보로도 역전이 가능합니다.": {
    "en": "💡 Tip: Affinity cycles every Monday at 00:00. Seizing the affinity advantage allows upsets even with lower-tier hands.",
    "ja": "💡 ヒント：次元律は毎週月曜00:00に循環します。相性の優位に立てば低い役でも逆転が可能です。"
  },
  "노페어 전술 파동 격돌: 배지 가중치 총점제": {
    "en": "No-Pair Tactical Wave Clash: Badge Weight Score System",
    "ja": "ノーペア戦術波動激突：バッジ加重総点制"
  },
  "양측 모두 유효한 족보를 완성하지 못해 노페어로 격돌할 경우, 게이지 5칸에 누적된 배지들의 개별 가중치 총합으로 승패를 가릅니다.": {
    "en": "When neither side completes a valid hand and clashes with No-Pair, the victor is decided by the sum of individual weights of accumulated badges.",
    "ja": "双方が有効な役を完成できずノーペアで激突した場合、ゲージ5マスに蓄積されたバッジの個別加重総計で勝敗を決定します。"
  },
  "⚡ 연계 (Extra): 35점 (스킬 콤보·추가타)": {
    "en": "⚡ Extra: 35 Pts (Skill combo & follow-up)",
    "ja": "⚡ 連携（Extra）：35点（スキルコンボ・追撃）"
  },
  "⚔️ 반격 (Counter): 30점 (적 턴 반격 반응)": {
    "en": "⚔️ Counter: 30 Pts (Enemy turn riposte)",
    "ja": "⚔️ 反撃（Counter）：30点（敵ターン反撃反応）"
  },
  "💥 치명 (Crit): 25점 (회심의 일격)": {
    "en": "💥 Crit: 25 Pts (Critical strike)",
    "ja": "💥 致命（Crit）：25点（会心の一撃）"
  },
  "💫 파쇄 (Break): 20점 (방어 분쇄·실드 관통)": {
    "en": "💫 Break: 20 Pts (Shield piercing & break)",
    "ja": "💫 破砕（Break）：20点（防御粉砕・シールド貫通）"
  },
  "🛡️ 방어 (Guard): 15점 (철벽 방어·막기)": {
    "en": "🛡️ Guard: 15 Pts (Ironclad block & guard)",
    "ja": "🛡️ 防御（Guard）：15点（鉄壁防御・ガード）"
  },
  "🎯 지원 (Assist): 15점 (아군 버프·정화)": {
    "en": "🎯 Assist: 15 Pts (Ally buff & cleanse)",
    "ja": "🎯 支援（Assist）：15点（味方バフ・浄化）"
  },
  "💖 치유 (Heal): 10점 (생명력 회복)": {
    "en": "💖 Heal: 10 Pts (HP recovery)",
    "ja": "💖 治癒（Heal）：10点（生命力回復）"
  },
  "🌀 회피 (Evade): 10점 (완전 회피 기동)": {
    "en": "🌀 Evade: 10 Pts (Perfect evasion)",
    "ja": "🌀 回避（Evade）：10点（完全回避機動）"
  },
  "💡 팁: 족보 완성이 어려울 때는 연계나 반격 등 고점수 배지를 최대한 모아 점수 우위를 확보하세요.": {
    "en": "💡 Tip: When completing a hand is difficult, gather high-point badges like Extra or Counter to secure a score lead.",
    "ja": "💡 ヒント：役の完成が難しい時は、連携や反撃など高得点バッジをできる限り集めてスコア優位を確保しましょう。"
  },

  // ── 6. 아레나 리포트 및 추가 번역 텍스트 ──
  "피버 콜 격돌 리포트": {
    "en": "Fever Call Showdown Report",
    "ja": "フィーバーコール激突レポート"
  },
  "클릭하여 리포트 접기": {
    "en": "Click to collapse report",
    "ja": "クリックしてレポートを折りたたむ"
  },
  "클릭하여 리포트 펼치기": {
    "en": "Click to expand report",
    "ja": "クリックしてレポートを展開"
  },
  "총": {
    "en": "Total",
    "ja": "計"
  },
  "회 격돌": {
    "en": " Showdowns",
    "ja": "回 激突"
  },
  "아군": {
    "en": "Allies",
    "ja": "味方"
  },
  "상대": {
    "en": "Enemy",
    "ja": "相手"
  },
  "▲ 접기": {
    "en": "▲ Collapse",
    "ja": "▲ 折りたたむ"
  },
  "▼ 펼치기": {
    "en": "▼ Expand",
    "ja": "▼ 展開"
  },
  "차 피버콜 격돌": {
    "en": "th Fever Call Showdown",
    "ja": "次フィーバーコール激突"
  },
  "3턴 유예 타임아웃": {
    "en": "3-Turn Grace Timeout",
    "ja": "3ターン猶予タイムアウト"
  },
  "👑 아군 승리": {
    "en": "👑 Ally Victory",
    "ja": "👑 味方勝利"
  },
  "💀 상대 승리": {
    "en": "💀 Enemy Victory",
    "ja": "💀 相手勝利"
  },
  "⚡ 전술 무승부": {
    "en": "⚡ Tactical Draw",
    "ja": "⚡ 戦術引き分け"
  },
  "아군 피버": {
    "en": "Ally Fever",
    "ja": "味方フィーバー"
  },
  "상대 피버": {
    "en": "Enemy Fever",
    "ja": "相手フィーバー"
  },
  "원호 추격": {
    "en": "Support Chase",
    "ja": "援護追撃"
  },
  "스킬 연계": {
    "en": "Skill Chain",
    "ja": "スキル連携"
  },
  "치명 일격": {
    "en": "Critical Strike",
    "ja": "会心の一撃"
  },
  "수호 개입": {
    "en": "Guard Intervention",
    "ja": "守護介入"
  },
  "신성 치유": {
    "en": "Holy Healing",
    "ja": "神聖治癒"
  },
  "환영 반격": {
    "en": "Illusion Counter",
    "ja": "幻影反撃"
  },
  "회피 기동": {
    "en": "Evade Maneuver",
    "ja": "回避機動"
  },
  "피버 3선승": {
    "en": "Fever 3-Win",
    "ja": "フィーバー3先勝"
  },
  "점": {
    "en": " Pts",
    "ja": "点"
  },
  "⚔️ FEVER SHOWDOWN!": {
    "en": "⚔️ FEVER SHOWDOWN!",
    "ja": "⚔️ FEVER SHOWDOWN!"
  },
  "양측의 차원 모멘텀이 전광판에서 격돌합니다!": {
    "en": "Both sides' dimensional momentums clash on the scoreboard!",
    "ja": "両陣営の次元モメンタムが電光掲示板で激突します！"
  },
  "🌐 DOUBLE GRAND MAESTRO!": {
    "en": "🌐 DOUBLE GRAND MAESTRO!",
    "ja": "🌐 DOUBLE GRAND MAESTRO!"
  },
  "양측 모두 전술의 극의를 완성하여 차원이 진동합니다!": {
    "en": "Both sides completed Grand Maestro, making the dimension tremble!",
    "ja": "両陣営が戦術の極意を完成させ、次元が振動します！"
  },
  "양측의 완전무결한 전술이 상쇄되며 피버 위력이 절반으로 억제됩니다.": {
    "en": "The flawless tactics of both sides cancel out, halving the fever potency.",
    "ja": "双方の完全無欠な戦術が相殺され、フィーバー威力が半分に抑制されます。"
  },
  "👑 GRAND MAESTRO OVERRIDE!": {
    "en": "👑 GRAND MAESTRO OVERRIDE!",
    "ja": "👑 GRAND MAESTRO OVERRIDE!"
  },
  "아군의 전술의 극의가 적의 모든 족보를 무력화했습니다!": {
    "en": "Ally Grand Maestro neutralized all enemy hands!",
    "ja": "味方の戦術の極意が敵のすべての役を無力化しました！"
  },
  "💀 OPPONENT GRAND MAESTRO!": {
    "en": "💀 OPPONENT GRAND MAESTRO!",
    "ja": "💀 OPPONENT GRAND MAESTRO!"
  },
  "적군의 전술의 극의가 아군의 전술을 제압했습니다!": {
    "en": "Enemy Grand Maestro overwhelmed our tactics!",
    "ja": "敵軍の戦術の極意が味方の戦術を制圧しました！"
  },
  "⚡ TACTICAL HIGH CARD!": {
    "en": "⚡ TACTICAL HIGH CARD!",
    "ja": "⚡ TACTICAL HIGH CARD!"
  },
  "💀 OPPONENT HIGH CARD!": {
    "en": "💀 OPPONENT HIGH CARD!",
    "ja": "💀 OPPONENT HIGH CARD!"
  },
  "⚔️ TACTICAL CLASH!": {
    "en": "⚔️ TACTICAL CLASH!",
    "ja": "⚔️ TACTICAL CLASH!"
  },
  "💀 SHATTERED FORMATION!": {
    "en": "💀 SHATTERED FORMATION!",
    "ja": "💀 SHATTERED FORMATION!"
  },
  "🏆 FLAWLESS STRIKE!": {
    "en": "🏆 FLAWLESS STRIKE!",
    "ja": "🏆 FLAWLESS STRIKE!"
  },
  "🛡️ COUNTER BREAK!!": {
    "en": "🛡️ COUNTER BREAK!!",
    "ja": "🛡️ COUNTER BREAK!!"
  }
};

const outPath = path.resolve('scripts/i18n/out/delta_010.json');
fs.writeFileSync(outPath, JSON.stringify(delta, null, 2), 'utf8');
console.log(`Successfully generated ${outPath} with ${Object.keys(delta).length} entries.`);
