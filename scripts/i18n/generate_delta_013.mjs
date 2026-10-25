import fs from 'fs';
import path from 'path';

const delta = {
  // ── CombatMeterTable & 전투 리포트 UI ──
  "전투 리포트": {
    "en": "Combat Report",
    "ja": "戦闘レポート"
  },
  "📊 전투 리포트": {
    "en": "📊 Combat Report",
    "ja": "📊 戦闘レポート"
  },
  "⚔️ 3v3 아레나 전투 리포트": {
    "en": "⚔️ 3v3 Arena Combat Report",
    "ja": "⚔️ 3v3アリーナ戦闘レポート"
  },
  "⚔️ 3인 결사대 + 오퍼레이터 공성전투 리포트": {
    "en": "⚔️ 3-Vanguard + Operator Siege Combat Report",
    "ja": "⚔️ 3人決死隊＋オペレーター攻城戦レポート"
  },
  "실시간 분석": {
    "en": "Live Analysis",
    "ja": "リアルタイム分析"
  },
  "전체": {
    "en": "All",
    "ja": "全体"
  },
  "아군": {
    "en": "Allies",
    "ja": "味方"
  },
  "적군": {
    "en": "Enemies",
    "ja": "敵軍"
  },
  "최고 딜러": {
    "en": "Top Dealer",
    "ja": "最高ディーラー"
  },
  "💥 최고 딜러": {
    "en": "💥 Top Dealer",
    "ja": "💥 最高ディーラー"
  },
  "최고 치유": {
    "en": "Top Healer",
    "ja": "最高治癒"
  },
  "💚 최고 치유": {
    "en": "💚 Top Healer",
    "ja": "💚 最高治癒"
  },
  "최고 방어": {
    "en": "Top Tank",
    "ja": "最高防御"
  },
  "🛡️ 최고 방어": {
    "en": "🛡️ Top Tank",
    "ja": "🛡️ 最高防御"
  },
  "전투원": {
    "en": "Combatant",
    "ja": "戦闘員"
  },
  "딜량": {
    "en": "DMG",
    "ja": "ダメージ"
  },
  "💥 딜량": {
    "en": "💥 DMG",
    "ja": "💥 ダメージ"
  },
  "치유": {
    "en": "Heal",
    "ja": "治癒"
  },
  "💚 치유": {
    "en": "💚 Heal",
    "ja": "💚 治癒"
  },
  "피해": {
    "en": "Damage Taken",
    "ja": "被ダメージ"
  },
  "🛡️ 피해": {
    "en": "🛡️ Damage Taken",
    "ja": "🛡️ 被ダメージ"
  },

  // ── 철수 확인 모달 (handleRetreat) ──
  "퇴각": {
    "en": "Retreat",
    "ja": "撤退"
  },
  "자동 ON": {
    "en": "Auto ON",
    "ja": "自動 ON"
  },
  "자동 OFF": {
    "en": "Auto OFF",
    "ja": "自動 OFF"
  },
  "전술 궁극기": {
    "en": "Tactical Ultimate",
    "ja": "戦術必殺技"
  },
  "누적": {
    "en": "Cumulative",
    "ja": "累積"
  },
  "타겟": {
    "en": "Target",
    "ja": "ターゲット"
  },
  "전투 철수": {
    "en": "Retreat from Battle",
    "ja": "戦闘撤退"
  },
  "🏃 전투 철수": {
    "en": "🏃 Retreat from Battle",
    "ja": "🏃 戦闘撤退"
  },
  "지금까지 가한 피해를 저장하고 전장에서 안전하게 철수하시겠습니까?": {
    "en": "Would you like to save all dealt damage and safely retreat from the battlefield?",
    "ja": "これまで与えたダメージを保存し、戦場から安全に撤退しますか？"
  },
  "철수하기": {
    "en": "Retreat",
    "ja": "撤退する"
  },
  "계속 전투": {
    "en": "Continue Battle",
    "ja": "戦闘続行"
  },

  // ── 네메시스 전투 HUD 및 액션 ──
  "내 턴": {
    "en": "My Turn",
    "ja": "自ターン"
  },
  "전투불능": {
    "en": "Incapacitated",
    "ja": "戦闘不能"
  },
  "일반 공격": {
    "en": "Basic Attack",
    "ja": "通常攻撃"
  },
  "궁극기": {
    "en": "Ultimate",
    "ja": "必殺技"
  },
  "지원/마법": {
    "en": "Support/Magic",
    "ja": "支援/魔法"
  },
  "집중 타겟:": {
    "en": "Focused Target:",
    "ja": "集中ターゲット:"
  },
  "보스 잔여": {
    "en": "Boss Remaining",
    "ja": "ボス残量"
  },
  "절멸 차징": {
    "en": "Cataclysm Charge",
    "ja": "絶滅チャージ"
  },
  "그로기": {
    "en": "Groggy",
    "ja": "気絶"
  },
  "연계!": {
    "en": "Combo!",
    "ja": "連携！"
  },
  "궁극 연계!": {
    "en": "Ultimate Combo!",
    "ja": "究極連携！"
  },
  "턴 대기": {
    "en": "Turn Wait",
    "ja": "ターン待機"
  },
  "기록된 전투 로그가 없습니다.": {
    "en": "No combat logs recorded.",
    "ja": "記録された戦闘ログがありません。"
  },
  "전체 전투 상세 기록 모달 열기": {
    "en": "Open Full Battle Log Modal",
    "ja": "全戦闘詳細ログを開く"
  },
  "전투 상세 기록 (전체 로그)": {
    "en": "Full Combat Record (All Logs)",
    "ja": "戦闘詳細記録（全ログ）"
  },
  "건의 전투 기록": {
    "en": "combat records",
    "ja": "件の戦闘記録"
  },
  "스크롤하여 이전 기록을 확인할 수 있습니다.": {
    "en": "Scroll to view previous combat entries.",
    "ja": "スクロールして過去の記録を確認できます。"
  },
  "대원별 피해 및 기여도": {
    "en": "Squad Damage & Contribution",
    "ja": "隊員別ダメージ＆貢献度"
  },
  "상세 로그 보기": {
    "en": "View Detailed Logs",
    "ja": "詳細ログを見る"
  },
  "로비로 복귀": {
    "en": "Return to Lobby",
    "ja": "ロビーへ帰還"
  },
  "영지 복귀": {
    "en": "Return to Citadel",
    "ja": "領地へ帰還"
  },

  // ── 전투 정산 모달 ──
  "네메시스 토벌전 정산 리포트": {
    "en": "Nemesis Subjugation Settlement Report",
    "ja": "ネメシス討伐戦精算レポート"
  },
  "🎉 단일 전투 최고 피해 기록 갱신!": {
    "en": "🎉 New Single Battle Max Damage Record!",
    "ja": "🎉 単一戦闘最高ダメージ記録更新！"
  },
  "총 누적 피해": {
    "en": "Total Cumulative Damage",
    "ja": "総累積ダメージ"
  },
  "획득 골드": {
    "en": "Gold Earned",
    "ja": "獲得ゴールド"
  },
  "획득 에테르": {
    "en": "Aether Earned",
    "ja": "獲得エーテル"
  },
  "부위별 타격 피해 정산": {
    "en": "Damage Dealt by Part",
    "ja": "部位別打撃ダメージ精算"
  },
  "영구 누적 저장": {
    "en": "Permanently Saved",
    "ja": "永久累積保存"
  },
  "머리": {
    "en": "Head",
    "ja": "頭部"
  },
  "몸통": {
    "en": "Body",
    "ja": "胴体"
  },
  "꼬리": {
    "en": "Tail",
    "ja": "尾部"
  },

  // ── 네메시스 로비 및 원정대 UI ──
  "차원 네메시스": {
    "en": "Dimensional Nemesis",
    "ja": "次元ネメシス"
  },
  "🟢 토벌 진행 중": {
    "en": "🟢 Subjugation in Progress",
    "ja": "🟢 討伐進行中"
  },
  "👑 토벌 완료": {
    "en": "👑 Subjugation Complete",
    "ja": "👑 討伐完了"
  },
  "💤 재소환 대기": {
    "en": "💤 Respawn Waiting",
    "ja": "💤 再召喚待機"
  },
  "주기": {
    "en": "Cycle",
    "ja": "周期"
  },
  "🌐 전 지휘관 실시간 공유 월드 보스": {
    "en": "🌐 Shared Real-time World Boss for All Commanders",
    "ja": "🌐 全指揮官リアルタイム共有ワールドボス"
  },
  "보스 전체 잔여 체력": {
    "en": "Boss Total Remaining HP",
    "ja": "ボス全体残り体力"
  },
  "(전 지휘관 공유)": {
    "en": "(Shared Across All Commanders)",
    "ja": "（全指揮官共有）"
  },
  "전 지휘관 요격 목표치": {
    "en": "Server Interception Objective",
    "ja": "全指揮官迎撃目標値"
  },
  "(6시간 체력 1/24 저지)": {
    "en": "(6-hour 1/24 HP Interception)",
    "ja": "（6時間体力1/24阻止）"
  },
  "잔여 목표:": {
    "en": "Remaining Goal:",
    "ja": "残り目標:"
  },
  "✅ 요격 달성": {
    "en": "✅ Interception Achieved",
    "ja": "✅ 迎撃達成"
  },
  "다음 요격 주기 갱신": {
    "en": "Next Interception Refresh",
    "ja": "次回迎撃周期更新"
  },
  "전 지휘관 누적 피해": {
    "en": "Server Cumulative Damage",
    "ja": "全指揮官累積ダメージ"
  },
  "(방어 성공)": {
    "en": "(Defense Succeeded)",
    "ja": "（防衛成功）"
  },
  "💀패퇴": {
    "en": "💀Defeated",
    "ja": "💀敗退"
  },
  "회복 불가": {
    "en": "Unrecoverable",
    "ja": "回復不可"
  },
  "나의 누적 피해량": {
    "en": "My Cumulative Damage",
    "ja": "累積ダメージ"
  },
  "단일 최고 기록": {
    "en": "Single Battle Record",
    "ja": "単一最高記録"
  },
  "일일 도전 횟수": {
    "en": "Daily Attempts",
    "ja": "デイリー挑戦回数"
  },
  "에테르 50개로 +1회 충전": {
    "en": "Recharge +1 with 50 Aether",
    "ja": "エーテル50個で+1回チャージ"
  },
  "충전": {
    "en": "Recharge",
    "ja": "チャージ"
  },
  "회": {
    "en": "time(s)",
    "ja": "回"
  },
  "⚔️ 토벌전 출격": {
    "en": "⚔️ Raid Sortie",
    "ja": "⚔️ 討伐戦出撃"
  },
  "🎁 마일스톤": {
    "en": "🎁 Milestones",
    "ja": "🎁 マイルストーン"
  },
  "🏆 토벌 랭킹": {
    "en": "🏆 Raid Ranking",
    "ja": "🏆 討伐ランキング"
  },
  "인 편성됨": {
    "en": "assigned",
    "ja": "名編成済み"
  },
  "부대 자동 편성": {
    "en": "Auto-form Squad",
    "ja": "部隊自動編成"
  },
  "🍻 주점에서 영입": {
    "en": "🍻 Recruit at Tavern",
    "ja": "🍻 酒場で雇用"
  },
  "🏛️ 직접 편성": {
    "en": "🏛️ Custom Setup",
    "ja": "🏛️ 直接編成"
  },
  "출전 원정대 (3선발 + 1오퍼레이터)": {
    "en": "Expedition Squad (3 Frontline + 1 Tactical Operator)",
    "ja": "出撃遠征隊（先発3名＋オペレーター1名）"
  },
  "차원 덱 연동": {
    "en": "Dimensional Deck Linked",
    "ja": "次元デッキ連動"
  },
  "선발": {
    "en": "Frontline",
    "ja": "先発"
  },
  "지휘 가호": {
    "en": "Command Blessing",
    "ja": "指揮加護"
  },
  "선발 3인이 전투에 직접 참전하며, 오퍼레이터가 파티 전체에 전술 지휘를 제공합니다.": {
    "en": "3 Frontline heroes engage in direct combat, while the Operator provides party-wide tactical command.",
    "ja": "先発3名が直接戦闘に参加し、オペレーターがパーティ全体に戦術指揮を提供します。"
  },
  "원정대 변경 ➔": {
    "en": "Change Squad ➔",
    "ja": "遠征隊変更 ➔"
  },

  // ── 네메시스 침식 및 약탈 규칙 ──
  "⚠️ 차원 네메시스 침식 & 약탈 규칙": {
    "en": "⚠️ Dimensional Nemesis Erosion & Plunder Rules",
    "ja": "⚠️ 次元ネメシス侵食＆略奪規則"
  },
  "차원 앵커 연동 침공": {
    "en": "Dimensional Anchor Linked Invasion",
    "ja": "次元アンカー連動侵攻"
  },
  "차원 앵커 게이트(Lv.3+)가 개방되어 활성화된 상태에서만 침식과 약탈이 발생합니다. 차원 앵커가 닫혀 있는 동안에는 네메시스 침공과 자원 약탈이 전면 중단되어 영지 자원이 100% 안전하게 보호됩니다.": {
    "en": "Erosion and plundering only occur when the Dimensional Anchor Gate (Lv.3+) is opened and active. While the Anchor is closed, Nemesis incursions and resource looting are completely halted, ensuring 100% security for citadel resources.",
    "ja": "次元アンカーゲート（Lv.3+）が開放され活性化している状態でのみ侵食と略奪が発生します。アンカーが閉じている間はネメシス侵攻と資源略奪が全面停止し、領地資源は100%安全に保護されます。"
  },
  "6일 활동 & 1일 재소환 주기": {
    "en": "6-Day Active & 1-Day Respawn Cycle",
    "ja": "6日活動＆1日再召喚周期"
  },
  "6일 동안 활동하며 완전 토벌 시 다음 7일차 재소환 주기까지 평화 상태가 유지됩니다.": {
    "en": "Nemesis remains active for 6 days. When completely defeated, peace is maintained until the next 7th-day respawn cycle.",
    "ja": "6日間活動し、完全討伐時は次回7日目の再召喚周期まで平和状態が維持されます。"
  },
  "6시간 주기 20% 약탈": {
    "en": "6-Hour 20% Plunder Window",
    "ja": "6時間周期 20%略奪"
  },
  "침공 활성화 중 6시간마다 네메시스 체력의 1/24 이상을 깎지 못하면 영지 전 자원의 20%를 약탈당합니다.": {
    "en": "While the invasion is active, if commanders fail to deplete at least 1/24 of Nemesis's HP every 6 hours, 20% of all territory resources will be plundered.",
    "ja": "侵攻活性化中、6時間ごとにネメシスの体力を1/24以上削れなかった場合、領地の全資源の20%が略奪されます。"
  },
  "체력 자연 회복": {
    "en": "Natural HP Regeneration",
    "ja": "体力自然回復"
  },
  "네메시스는 활동 중 매 분마다 생존 부위 체력을 지속 회복합니다. (파괴된 부위는 영구 회복 불가)": {
    "en": "Nemesis continuously regenerates surviving parts' HP every minute during its active period. (Destroyed parts can never regenerate)",
    "ja": "ネメシスは活動中、毎分ごとに生存部位の体力を継続回復します。（破壊された部位は永久回復不可）"
  },
  "최대 15턴 전투 & 마일스톤": {
    "en": "Max 15-Turn Battle & Milestones",
    "ja": "最大15ターン戦闘＆マイルストーン"
  },
  "매 전투마다 피해량을 누적하여 마일스톤 장비와 대량의 인장을 수령하십시오.": {
    "en": "Accumulate damage with each battle to claim milestone armaments and massive quantities of insignias.",
    "ja": "毎回の戦闘でダメージを蓄積し、マイルストーン装備と大量の闘士の印章を獲得してください。"
  },
  "네메시스 토벌전 출격 (전투 시작)": {
    "en": "Sortie to Nemesis Raid (Start Battle)",
    "ja": "ネメシス討伐戦出撃（戦闘開始）"
  },
  "일일 도전 횟수 소진 (에테르 충전 필요)": {
    "en": "Daily Attempts Depleted (Aether Recharge Required)",
    "ja": "デイリー挑戦回数消費（エーテルチャージが必要）"
  },
  "네메시스는 이미 이번 주기에 토벌되었습니다. 다음 주기에 다시 도전할 수 있습니다.": {
    "en": "Nemesis has already been defeated in this cycle. You may challenge it again next cycle.",
    "ja": "ネメシスは今期すでに討伐されました。次の周期に再度挑戦できます。"
  },
  "현재 네메시스는 심연 재소환 준비 중입니다.": {
    "en": "Nemesis is currently preparing to respawn from the abyss.",
    "ja": "現在ネメシスは深淵からの再召喚準備中です。"
  },
  "차원 원정대 편성 필요": {
    "en": "Dimensional Squad Required",
    "ja": "次元遠征隊の編成が必要"
  },
  "차원 네메시스 레이드는 선발 3인과 전술 오퍼레이터 1인이 모두 편성되어야 출전할 수 있습니다.": {
    "en": "To enter the Dimensional Nemesis Raid, all 3 Frontline heroes and 1 Tactical Operator must be assigned.",
    "ja": "次元ネメシスレイドは先発3名と戦術オペレーター1名が全員編成されている必要があります。"
  },
  "차원 네메시스는 차원 앵커 게이트 Lv.3 이상에 개방됩니다.": {
    "en": "Dimensional Nemesis unlocks at Dimensional Anchor Gate Lv.3+.",
    "ja": "次元ネメシスは次元アンカーゲートLv.3以上で開放されます。"
  },
  "토벌 대기 중": {
    "en": "Awaiting Subjugation",
    "ja": "討伐待機中"
  },
  "후": {
    "en": "later",
    "ja": "後"
  },
  "남음": {
    "en": "left",
    "ja": "残り"
  },

  // ── 마일스톤 및 랭킹 ──
  "네메시스에게 누적 피해를 입혀 단계별 특별 무구와 마도석을 획득하십시오.": {
    "en": "Deal cumulative damage to Nemesis to claim specialized armaments and magic stones by tier.",
    "ja": "ネメシスに累積ダメージを与え、段階別の特別な武具や魔導石を獲得してください。"
  },
  "수령 완료": {
    "en": "Claimed",
    "ja": "受取済み"
  },
  "수령 가능!": {
    "en": "Claimable!",
    "ja": "受取可能！"
  },
  "잠김": {
    "en": "Locked",
    "ja": "ロック中"
  },
  "전 서버 지휘관 토벌 랭킹 (시즌 누적)": {
    "en": "All Commanders Subjugation Rankings (Season Cumulative)",
    "ja": "全サーバー指揮官討伐ランキング（シーズン累積）"
  },
  "나의 순위": {
    "en": "My Rank",
    "ja": "私の順位"
  },
  "기여도 보상 획득": {
    "en": "Contribution Reward Claimed",
    "ja": "貢献度報酬獲得"
  },
  "1단계: 차원의 균열 타격자": {
    "en": "Tier 1: Dimensional Rift Striker",
    "ja": "第1段階：次元の亀裂打撃者"
  },
  "2단계: 시공의 균열 분쇄자": {
    "en": "Tier 2: Spacetime Rift Crusher",
    "ja": "第2段階：時空の亀裂粉砕者"
  },
  "3단계: 차원의 왜곡 억제자": {
    "en": "Tier 3: Dimensional Distortion Suppressor",
    "ja": "第3段階：次元の歪曲抑制者"
  },
  "4단계: 공허의 폭풍 파쇄자": {
    "en": "Tier 4: Void Tempest Breaker",
    "ja": "第4段階：虚無の嵐破砕者"
  },
  "5단계: 시공의 심판관": {
    "en": "Tier 5: Judge of Spacetime",
    "ja": "第5段階：時空の審判官"
  },
  "6단계: 차원의 절대 지배자": {
    "en": "Tier 6: Absolute Sovereign of Dimensions",
    "ja": "第6段階：次元の絶対支配者"
  },
  "누적 5만 피해 달성 — 투사의 인장 150개 + 에테르 60개": {
    "en": "50k Cumulative DMG — 150 Champion Insignias + 60 Aether",
    "ja": "累積5万ダメージ達成 — 闘士の印章150個 ＋ エーテル60個"
  },
  "누적 15만 피해 달성 — 투사의 인장 350개 + 순수 접두 마도석 2개": {
    "en": "150k Cumulative DMG — 350 Champion Insignias + 2 Pure Prefix Magic Stones",
    "ja": "累積15万ダメージ達成 — 闘士の印章350個 ＋ 純粋な接頭魔導石2個"
  },
  "누적 35만 피해 달성 — 희귀 [시공의 왜곡 펜던트 (+3)] + 인장 600개": {
    "en": "350k Cumulative DMG — Rare [Spacetime Warp Pendant (+3)] + 600 Insignias",
    "ja": "累積35万ダメージ達成 — 希少 [時空の歪曲ペンダント (+3)] ＋ 印章600個"
  },
  "누적 75만 피해 달성 — 투사의 인장 900개 + 순수 접미 마도석 3개": {
    "en": "750k Cumulative DMG — 900 Champion Insignias + 3 Pure Suffix Magic Stones",
    "ja": "累積75万ダメージ達成 — 闘士の印章900個 ＋ 純粋な接尾魔導石3個"
  },
  "누적 150만 피해 달성 — 에픽 [네메시스 종말 성핵 (+5)] + 인장 1,500개": {
    "en": "1.5M Cumulative DMG — Epic [Nemesis Doom Core (+5)] + 1,500 Insignias",
    "ja": "累積150万ダメージ達成 — エピック [ネメシス終末星核 (+5)] ＋ 印章1,500個"
  },
  "누적 300만 피해 달성 — 전설 [패왕 네메시스 파멸 관 (+7)] + 인장 3,000개": {
    "en": "3.0M Cumulative DMG — Legendary [Overlord Nemesis Crown of Ruin (+7)] + 3,000 Insignias",
    "ja": "累積300万ダメージ達成 — 伝説 [覇王ネメシス破滅冠 (+7)] ＋ 印章3,000個"
  },

  // ── 네메시스 보스 및 부위 스킬 & 설명 ──
  "차원 꼬리 휩쓸기": {
    "en": "Dimensional Tail Sweep",
    "ja": "次元テールスワイプ"
  },
  "절멸의 종말 침": {
    "en": "Extinction Doom Stinger",
    "ja": "絶滅の終末針"
  },
  "시공 분열 연타": {
    "en": "Spacetime Fissure Barrage",
    "ja": "時空分裂連打"
  },
  "시공의 균열타": {
    "en": "Spacetime Rift Strike",
    "ja": "時空の亀裂打"
  },
  "중력 왜곡파": {
    "en": "Gravity Distortion Wave",
    "ja": "重力歪曲波"
  },
  "공허의 폭풍": {
    "en": "Void Tempest",
    "ja": "虚無の嵐"
  },
  "차원 소멸선 (Cataclysm)": {
    "en": "Dimensional Cataclysm Ray",
    "ja": "次元消滅線 (Cataclysm)"
  },
  "차원 소멸선": {
    "en": "Dimensional Cataclysm Ray",
    "ja": "次元消滅線"
  },
  "부위가 파괴되어 더 이상 재생하거나 행동하지 않습니다!": {
    "en": "Part destroyed and will no longer regenerate or act!",
    "ja": "部位が破壊され、これ以上再生や行動を行いません！"
  },
  "압도적인 물리 강타와 진동 파쇄를 시전하는 전열의 파멸 머리": {
    "en": "Frontline head of ruin unleashing overwhelming physical smashes and sonic tremors",
    "ja": "圧倒的な物理強打と振動破砕を繰り出す前列の破滅の頭部"
  },
  "전열 대상에게 145% 물리 충격 관통 피해": {
    "en": "145% Physical Impact Piercing DMG to frontline targets",
    "ja": "前列対象に145%物理衝撃貫通ダメージ"
  },
  "아군 전체에게 125% 광역 물리 피해 및 2턴간 방어력 25% 파쇄": {
    "en": "125% AoE Physical DMG to all allies & shreds DEF by 25% for 2 turns",
    "ja": "味方全体に125%全体物理ダメージ＆2ターンの間防御力25%粉砕"
  },
  "아군 전체에게 160% 궤멸 피해 및 2턴간 치명적인 출혈 부여": {
    "en": "160% Devastation DMG to all allies & inflicts lethal Bleed for 2 turns",
    "ja": "味方全体に160%壊滅ダメージ＆2ターンの間致命的出血付与"
  },
  "시공간 조작과 광역 군중 제어(CC)를 담당하는 중심 몸통": {
    "en": "Central body controlling spacetime manipulation and wide-area CC",
    "ja": "時空間操作と広域CCを担当する中核の胴体"
  },
  "아군 전체에게 110% 마법 피해 및 2턴간 행동 속도 30% 감속": {
    "en": "110% Magic DMG to all allies & slows SPD by 30% for 2 turns",
    "ja": "味方全体に110%魔法ダメージ＆2ターンの間行動速度30%減速"
  },
  "단일 대상에게 130% 마법 피해 및 1턴간 행동 불능(스턴) 부여": {
    "en": "130% Magic DMG to single target & inflicts 1-turn Stun",
    "ja": "単一対象に130%魔法ダメージ＆1ターンの間気絶付与"
  },
  "아군 전체에게 120% 마법 피해 및 마나 20 강탈": {
    "en": "120% Magic DMG to all allies & drains 20 Mana",
    "ja": "味方全体に120%魔法ダメージ＆マナ20強奪"
  },
  "신속한 광역 휩쓸기와 급소 원샷원킬을 노리는 후열의 치명 꼬리": {
    "en": "Backline lethal tail executing swift sweeps and fatal one-shot snipes",
    "ja": "迅速な広域一掃と急所一撃必殺を狙う後列の致命的な尾部"
  },
  "아군 전열/중열을 쓸어버리는 135% 광역 물리 피해": {
    "en": "135% AoE Physical DMG sweeping allied frontline and midline",
    "ja": "味方前列・中列を一掃する135%広域物理ダメージ"
  },
  "단일 대상을 궤도 저격하여 280% 초치명타 관통 피해 (원샷원킬)": {
    "en": "Orbital snipes a single target for 280% Ultra-Crit Piercing DMG (One-Shot Kill)",
    "ja": "単一対象を軌道狙撃し280%超会心貫通ダメージ（一撃必殺）"
  },
  "아군 전체에게 140% 방어 무시 광역 관통타": {
    "en": "140% Defense-ignoring AoE Piercing Strike to all allies",
    "ja": "味方全体に140%防御無視広域貫通打"
  },
  "단일 대상에게 130% 물리/암흑 관통 피해": {
    "en": "130% Physical/Dark Piercing DMG to single target",
    "ja": "単一対象に130%物理/暗黒貫通ダメージ"
  },
  "전열/중열 아군에게 115% 암흑 피해": {
    "en": "115% Dark DMG to frontline/midline allies",
    "ja": "前列/中列の味方に115%暗黒ダメージ"
  },
  "아군 전체에게 140% 마법 피해 및 마나 15 강탈": {
    "en": "140% Magic DMG to all allies & drains 15 Mana",
    "ja": "味方全体に140%魔法ダメージ＆マナ15強奪"
  },
  "3턴 충전 후 아군 전체에게 350% 궤멸적 전멸 피해!": {
    "en": "Charges for 3 turns, then deals 350% catastrophic annihilation damage to all allies!",
    "ja": "3ターン充電後、味方全体に350%の壊滅的殲滅ダメージ！"
  },
  "차원의 균열을 뚫고 강림한 파멸의 화신": {
    "en": "Incarnation of ruin descending through dimensional rifts",
    "ja": "次元の亀裂を突き抜けて降臨した破滅の化身"
  },
  "시공간의 균열을 열어 불안정한 중력 파동을 아군에게 방출합니다.": {
    "en": "Opens spacetime rifts, unleashing unstable gravitational waves on allies.",
    "ja": "時空間の亀裂を開き、不安定な重力波動を味方に放出します。"
  },
  "공간이 붕괴하며 아군 전체를 집어삼키는 공허의 폭풍이 몰아칩니다.": {
    "en": "Space collapses into a void tempest that engulfs all allies.",
    "ja": "空間が崩壊し、味方全体を飲み込む虚無の嵐が吹き荒れます。"
  },
  "모든 차원을 단숨에 소멸시킬 절대 절멸기를 충전하기 시작합니다!": {
    "en": "Begins charging the ultimate cataclysm capable of annihilating all dimensions!",
    "ja": "全次元を一撃で消滅させる絶対絶滅技の充電を開始します！"
  },
  "Phase 1: 차원의 균열 (Dimensional Rift)": {
    "en": "Phase 1: Dimensional Rift",
    "ja": "フェーズ1：次元の亀裂 (Dimensional Rift)"
  },
  "Phase 2: 시공 붕괴 (Spacetime Collapse)": {
    "en": "Phase 2: Spacetime Collapse",
    "ja": "フェーズ2：時空崩壊 (Spacetime Collapse)"
  },
  "Phase 3: 네메시스 각성 (Cataclysm Countdown)": {
    "en": "Phase 3: Cataclysm Countdown",
    "ja": "フェーズ3：ネメシス覚醒 (Cataclysm Countdown)"
  },

  // ── 보상 아이템 ──
  "[시공의] 왜곡 펜던트 (+3)": {
    "en": "[Spacetime] Distortion Pendant (+3)",
    "ja": "【時空の】歪曲ペンダント (+3)"
  },
  "시공의": {
    "en": "Spacetime",
    "ja": "時空の"
  },
  "[파멸의] 네메시스 종말 성핵 (+5) [차원]": {
    "en": "[Ruinous] Nemesis Doom Core (+5) [Dimensional]",
    "ja": "【破滅の】ネメシス終末星核 (+5) 【次元】"
  },
  "차원": {
    "en": "Dimensional",
    "ja": "次元"
  },
  "[절대의] 패왕 네메시스 파멸 관 (+7) [종결]": {
    "en": "[Absolute] Overlord Nemesis Crown of Ruin (+7) [Ultimate]",
    "ja": "【絶対の】覇王ネメシス破滅冠 (+7) 【終結】"
  },
  "절대의": {
    "en": "Absolute",
    "ja": "絶対の"
  },
  "종결": {
    "en": "Ultimate",
    "ja": "終結"
  },

  // ── 랭킹 모의 지휘관 & 길드 ──
  "흑야의 성자": {
    "en": "Saint of Dark Night",
    "ja": "黒夜の聖者"
  },
  "발할라 기사단": {
    "en": "Valhalla Knights",
    "ja": "ヴァルハラ騎士団"
  },
  "차원 방랑자 에단": {
    "en": "Dimensional Wanderer Ethan",
    "ja": "次元の放浪者イーサン"
  },
  "그림자 여단": {
    "en": "Shadow Brigade",
    "ja": "影の旅団"
  },
  "철혈의 세이라": {
    "en": "Iron-Blooded Seira",
    "ja": "鉄血のセイラ"
  },
  "붉은 창끝 길드": {
    "en": "Crimson Spearhead Guild",
    "ja": "紅の槍先ギルド"
  },
  "아케인 마스터": {
    "en": "Arcane Master",
    "ja": "アルケインマスター"
  },
  "비전의 탑": {
    "en": "Tower of Arcana",
    "ja": "秘術の塔"
  },
  "발키리의 인도자": {
    "en": "Guide of the Valkyrie",
    "ja": "ヴァルキリーの導き手"
  },
  "빛의 방주": {
    "en": "Ark of Light",
    "ja": "光の方舟"
  },
  "폭풍의 저격수": {
    "en": "Storm Sniper",
    "ja": "嵐の狙撃手"
  },
  "에테르 기동대": {
    "en": "Aether Strike Force",
    "ja": "エーテル機動隊"
  },
  "성기사 올리버": {
    "en": "Paladin Oliver",
    "ja": "聖騎士オリバー"
  },
  "은빛 수호단": {
    "en": "Silver Guardians",
    "ja": "白銀の守護団"
  },
  "섀도우 블레이드": {
    "en": "Shadow Blade",
    "ja": "シャドウブレード"
  },
  "어둠의 장막": {
    "en": "Veil of Darkness",
    "ja": "暗黒の帳"
  },
  "루미나스": {
    "en": "Luminous",
    "ja": "ルミナス"
  },
  "새벽의 눈동자": {
    "en": "Eyes of Dawn",
    "ja": "夜明けの瞳"
  },
  "크림슨 타이탄": {
    "en": "Crimson Titan",
    "ja": "クリムゾンタイタン"
  },
  "불사조 용병단": {
    "en": "Phoenix Mercenaries",
    "ja": "不死鳥傭兵団"
  }
};

const outDir = path.resolve('scripts/i18n/out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outDir, 'delta_013.json'),
  JSON.stringify(delta, null, 2),
  'utf-8'
);

// Also sync with ko-all.json to ensure merge.mjs verifies and compiles all of them
const koAllPath = path.resolve('scripts/i18n/ko-all.json');
const koAll = JSON.parse(fs.readFileSync(koAllPath, 'utf8'));
const koSet = new Set(koAll);
let addedCount = 0;
for (const key of Object.keys(delta)) {
  if (!koSet.has(key)) {
    koAll.push(key);
    koSet.add(key);
    addedCount++;
  }
}
fs.writeFileSync(koAllPath, JSON.stringify(koAll, null, 2), 'utf8');

console.log(`Generated delta_013.json with ${Object.keys(delta).length} entries.`);
console.log(`Updated ko-all.json with ${addedCount} new strings.`);
