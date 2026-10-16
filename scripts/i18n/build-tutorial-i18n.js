// scripts/i18n/build-tutorial-i18n.js
import fs from 'fs';
import path from 'path';

const TUTORIAL_I18N = {
  // ── Speaker & Roles ──
  "수석 오퍼레이터 일레인": {
    en: "Chief Operator Elaine",
    ja: "首席オペレーター エレイン"
  },
  "방주 통제실": {
    en: "Ark Control Room",
    ja: "方舟管制室"
  },
  "방주 중앙 통제실": {
    en: "Ark Central Control Room",
    ja: "方舟中央管制室"
  },
  "통제실": {
    en: "Control",
    ja: "管制室"
  },
  "전술 보고": {
    en: "Tactical Brief",
    ja: "戦術報告"
  },
  "중요 조언": {
    en: "Crucial Advice",
    ja: "重要助言"
  },
  "격려 및 승리": {
    en: "Victory & Praise",
    ja: "激励・勝利"
  },
  "상황 보고": {
    en: "Status Report",
    ja: "状況報告"
  },
  "대화 다시보기": {
    en: "Replay Dialogue",
    ja: "対話を再確認"
  },
  "건너뛰기 ✕": {
    en: "Skip ✕",
    ja: "スキップ ✕"
  },
  "여기를 터치하세요": {
    en: "Tap here",
    ja: "ここをタップ"
  },
  "튜토리얼 STEP": {
    en: "Tutorial STEP",
    ja: "チュートリアル STEP"
  },
  "▶ 화면을 터치하여 다음 단계로 이동": {
    en: "▶ Tap screen to proceed to next step",
    ja: "▶ 画面をタップして次の段階へ"
  },
  "▶ 계속하려면 터치하세요": {
    en: "▶ Tap to continue",
    ja: "▶ 続けるにはタップしてください"
  },
  "다음 단계로 ▶": {
    en: "Next Step ▶",
    ja: "次の段階へ ▶"
  },
  "터치 시 대화창이 닫히며 화면의 [{0}]이 강조됩니다.": {
    en: "Tapping closes dialogue and highlights [{0}] on screen.",
    ja: "タップすると対話が閉じ、画面の【{0}】が強調されます。"
  },
  "화면에 강조된 [{0}]를 터치하여 진행하세요.": {
    en: "Tap the highlighted [{0}] on screen to proceed.",
    ja: "画面に強調された【{0}】をタップして進めてください。"
  },
  "터치 시 대화창이 닫히며 자유롭게 용병 후보들을 검토하고 고용하실 수 있습니다.": {
    en: "Tapping closes dialogue, allowing you to freely review and hire candidates.",
    ja: "タップすると対話が閉じ、自由に候補を検討して雇用できます。"
  },
  "👑 [튜토리얼 완수] 첫 심연 정찰을 완벽히 마치고 정식 지휘관으로 임명되었습니다! 영지 시설을 발전시켜 심연을 정복하십시오!": {
    en: "👑 [Tutorial Complete] You have thoroughly completed your first abyssal recon and have been officially appointed Commander! Develop your citadel facilities and conquer the Abyss!",
    ja: "👑 [チュートリアル完了] 初の深淵偵察を見事に終え、正式な指揮官に任命されました！ 領地施設を発展させ深淵を征服してください！"
  },
  "3인 원정대 편성 완료!": {
    en: "3-Hero Squad Ready!",
    ja: "3人遠征隊編成完了！"
  },
  "출정 채비실로 이동하여 진형과 보급품을 점검하세요.": {
    en: "Go to Prep Room to inspect formations and supplies.",
    ja: "出撃準備室へ移動して陣形と補給品を点検してください。"
  },
  "출정 채비실로 이동": {
    en: "Go to Prep Room",
    ja: "出撃準備室へ移動"
  },
  "출정 채비실로 이동 ▶": {
    en: "Go to Prep Room ▶",
    ja: "出撃準備室へ移動 ▶"
  },
  "심연 채비실 바로가기 (강하 준비)": {
    en: "Go to Abyss Prep Room (Prepare Descent)",
    ja: "深淵準備室へ (降下準備)"
  },
  "3인 원정대 편성 완료! 채비실에서 보급품을 챙기고 침식 회랑 1층 강하를 시작하세요!": {
    en: "3-Hero Squad Formed! Pack supplies in the Prep Room and begin descending into Silent Cloister Floor 1!",
    ja: "3人遠征隊の編成完了！ 準備室で補給品を整え、浸食の回廊1階への降下を開始してください！"
  },
  "3인 원정대 편성이 완료되었습니다. 채비실에서 진형과 보급품을 점검하세요!": {
    en: "3-Hero Squad has been formed. Check formations and supplies in the Prep Room!",
    ja: "3人遠征隊の編成が完了しました。準備室で陣形と補給品を点検してください！"
  },
  "원정단 편성 이동": {
    en: "Go to Squad Formation",
    ja: "遠征隊編成へ移動"
  },
  "다음: 시너지 확인 ▶": {
    en: "Next: Check Synergy ▶",
    ja: "次へ: シナジー確認 ▶"
  },
  "다음: 배낭 확인 ▶": {
    en: "Next: Check Backpack ▶",
    ja: "次へ: リュック確認 ▶"
  },
  "다음: 보급품 점검 ▶": {
    en: "Next: Check Supplies ▶",
    ja: "次へ: 補給品点検 ▶"
  },
  "강하 구역(층) 선택 ▶": {
    en: "Select Descent Floor ▶",
    ja: "降下フロア選択 ▶"
  },
  "강하 구역 선택 ▶": {
    en: "Select Descent Floor ▶",
    ja: "降下フロア選択 ▶"
  },
  "배낭 및 보급품 채비하기 ▶": {
    en: "Prepare Backpack & Supplies ▶",
    ja: "リュックと補給品を準備 ▶"
  },
  "탐색 시작하기 (대화창 닫기) ▶": {
    en: "Start Exploration (Close) ▶",
    ja: "探検開始 (閉じる) ▶"
  },
  "타깃 지정하기 (대화창 닫기) ▶": {
    en: "Designate Target (Close) ▶",
    ja: "ターゲット指定 (閉じる) ▶"
  },
  "작전 개시 (전투 진행) ▶": {
    en: "Commence Operation (Fight) ▶",
    ja: "作戦開始 (戦闘進行) ▶"
  },
  "전황 살피기 (대화창 닫기) ▶": {
    en: "Analyze Battlefield (Close) ▶",
    ja: "戦況確認 (閉じる) ▶"
  },
  "전투 속개 (마물 소탕하기) ▶": {
    en: "Resume Battle (Clear Monsters) ▶",
    ja: "戦闘続行 (魔物掃討) ▶"
  },
  "포지션 설정하기 (대화창 닫기) ▶": {
    en: "Set Positions (Close) ▶",
    ja: "ポジション設定 (閉じる) ▶"
  },
  "출전 버튼 확인하기 (대화창 닫기) ▶": {
    en: "Check Deploy Button (Close) ▶",
    ja: "出撃ボタンを確認 (閉じる) ▶"
  },
  "용병 후보 검토 및 고용하기 (대화창 닫기) ▶": {
    en: "Review Candidates & Recruit (Close) ▶",
    ja: "候補を確認して雇用 (閉じる) ▶"
  },
  "원정단 지휘 시작하기 (튜토리얼 완수) ⚔️": {
    en: "Begin Expedition Command (Tutorial Complete) ⚔️",
    ja: "遠征隊の指揮を開始 (チュートリアル完了) ⚔️"
  },
  "🛡️ 대원들의 포지션을 자유롭게 설정한 후, 화면 하단의 [다음: 시너지 확인 ▶] 플로팅 버튼을 터치하세요!": {
    en: "🛡️ Adjust squad positions freely, then tap [Next: Check Synergy ▶] floating button at the bottom!",
    ja: "🛡️ 隊員のポジションを自由に設定後、画面下の【次へ: シナジー確認 ▶】ボタンをタップしてください！"
  },
  "🎒 12칸 배낭 선택 후 필수 보급품(횃불, 식량, 붕대, 곡괭이, 균열의 닻)을 1개씩 담고 하단 [강하 구역 선택 ▶]을 터치하세요!": {
    en: "🎒 Select 12-slot backpack, pack 1 of each vital supply (Torch, Food, Bandage, Pickaxe, Rift Anchor), then tap [Select Descent Floor ▶] below!",
    ja: "🎒 12枠リュック選択後、必須補給品(松明、食糧、包帯、ツルハシ、亀裂の錨)を各1個詰め、画面下の【降下フロア選択 ▶】をタップしてください！"
  },
  "⚔️ 하단의 [다음: 배낭 확인 ▶] 플로팅 버튼을 터치하세요!": {
    en: "⚔️ Tap the [Next: Check Backpack ▶] button at the bottom!",
    ja: "⚔️ 画面下の【次へ: リュック確認 ▶】ボタンをタップしてください！"
  },
  "🎒 하단의 [다음: 보급품 점검 ▶] 플로팅 버튼을 터치하세요!": {
    en: "🎒 Tap the [Next: Check Supplies ▶] button at the bottom!",
    ja: "🎒 画面下の【次へ: 補給品点検 ▶】ボタンをタップしてください！"
  },

  // ── Step 1 ──
  "방주 통제실 연결": {
    en: "Ark Control Room Link",
    ja: "方舟管制室接続"
  },
  "의식이 무사히 돌아오셨군요, 사령관님! 방주 통제실의 수석 오퍼레이터 일레인입니다.": {
    en: "Commander, you've regained consciousness! I am Elaine, Chief Operator of the Ark Control Room.",
    ja: "無事に意識を取り戻されたのですね、指揮官！ 方舟管制室の首席オペレーター、エレインです。"
  },
  "현재 방주는 동력이 끊기고 저장된 물자가 바닥난 위기 상태입니다. 생존자들을 지키려면 거점의 핵심 시설부터 순서대로 재건해야 합니다.": {
    en: "The Ark has lost power, and our reserves are depleted. To protect the survivors, we must rebuild the citadel's core facilities step by step.",
    ja: "現在、方舟は動力を失い、備蓄物資も底をついた危機的状況です。生存者を守るため、拠点の重要施設を順次再建する必要があります。"
  },

  // ── Step 2 ──
  "자원 생산 기지 복원": {
    en: "Restore Resource Base",
    ja: "資源生産基地の復元"
  },
  "화면 좌측의 퀘스트를 확인해 주십시오. 첫 번째 과업은 마물의 잔해를 자원으로 환원할 [심연 생체 정제소]의 복원입니다.": {
    en: "Please check the quest on the left. Our first task is restoring the [Abyssal Refinery] to convert monster remains into vital resources.",
    ja: "画面左のクエストをご確認ください。最初の任務は魔物の残骸を資源に還元する【深淵生体精製所】の復元です。"
  },
  "지정된 건설 구역을 선택하여 정제소를 완공하십시오.": {
    en: "Select the designated construction site to complete the refinery.",
    ja: "指定された建設区域を選択し、精製所を完工してください。"
  },
  "심연 생체 정제소 건설": {
    en: "Build Abyssal Refinery",
    ja: "深淵生体精製所建設"
  },

  // ── Step 3 ──
  "보상 수령 및 거점 확장 안내": {
    en: "Claim Reward & Base Expansion",
    ja: "報酬受取と拠点拡張案内"
  },
  "정제소가 성공적으로 복원되어 퀘스트를 완수했습니다! 공적에 대한 [보상]을 수령하십시오.": {
    en: "The refinery is restored, completing the quest! Please claim your well-deserved [Reward].",
    ja: "精製所の復元に成功し、クエストを達成しました！ 功績に対する【報酬】を受け取ってください。"
  },
  "수령하신 보상 자재로 퀘스트 라인을 따라 생존자 안식처, 벌채소, 광석 시추소를 순서대로 복원해 주십시오. 광석 시추소까지 완공하고 [방랑자의 라운지] 건설로 이어질 때 다시 찾아뵙겠습니다!": {
    en: "Use these materials along the questline to restore Survivor Haven, Lumber Camp, and Aether Quarry in sequence. I will return once you finish the quarry and reach [Wanderer Lounge] construction!",
    ja: "受取った資材でクエストに沿って生存者の安息所、伐採所、採掘所を順に復元してください。採掘所を完工し【放浪者のラウンジ】建設に進む際、再びご案内いたします！"
  },
  "퀘스트 보상 받기": {
    en: "Claim Quest Reward",
    ja: "クエスト報酬受取"
  },

  // ── Step 4 ──
  "방랑자의 라운지 건설 승인": {
    en: "Approve Lounge Construction",
    ja: "放浪者のラウンジ建設承認"
  },
  "사령관님, 방주의 기초 인프라가 훌륭하게 복원되었습니다! 이제 마물을 조사하고 심연을 정찰할 탐사대를 모집할 때입니다.": {
    en: "Commander, our basic infrastructure is wonderfully restored! Now is the time to recruit an expedition squad to scout the Abyss and investigate monsters.",
    ja: "指揮官、方舟の基礎インフラが見事に復元されました！ 次は深淵を偵察し魔物を調査する探検隊を募集する番です。"
  },
  "외곽의 유능한 방랑자들을 영입할 수 있도록 성채 영지에 [방랑자의 라운지]를 건설해 주십시오.": {
    en: "Please construct the [Wanderer Lounge] in the citadel to recruit skilled wanderers from the outskirts.",
    ja: "外郭の有能な放浪者たちを雇い入れるため、城塞領地に【放浪者のラウンジ】を建設してください。"
  },
  "방랑자의 라운지 건설": {
    en: "Build Wanderer Lounge",
    ja: "放浪者のラウンジ建設"
  },

  // ── Step 5 ──
  "방랑자의 라운지 방문": {
    en: "Visit Wanderer Lounge",
    ja: "放浪者のラウンジ訪問"
  },
  "라운지가 완공되었습니다! 안으로 들어가 대기 중인 용병들을 살펴보겠습니다.": {
    en: "The lounge is complete! Let's head inside and inspect the waiting mercenaries.",
    ja: "ラウンジが完成しました！ 中に入って待機中の傭兵たちを確認しましょう。"
  },
  "방랑자의 라운지 입장": {
    en: "Enter Wanderer Lounge",
    ja: "放浪者のラウンジ入場"
  },

  // ── Step 6 ──
  "용병 후보 상세 점검 및 영입": {
    en: "Inspect & Recruit Mercenary",
    ja: "傭兵候補の詳細確認と雇用"
  },
  "방주의 부름에 응하여 세 명의 방랑 용병(용병 검사, 마총 수련생, 원소 학도)이 라운지에 도착했습니다.": {
    en: "Answering the Ark's call, three wandering mercenaries (Swordsman, Gunner Apprentice, Element Student) have arrived at the lounge.",
    ja: "方舟の招集に応じ、3名の放浪傭兵(傭兵剣士、魔銃練習生、元素学徒)がラウンジに到着しました。"
  },
  "용병마다 개인 성향(특성)과 스탯, 고유 스킬이 모두 다릅니다. [🔍 상세] 창을 열어 꼼꼼히 확인하신 후 마음에 드는 대원을 고용해 주십시오.": {
    en: "Each mercenary has distinct traits, stats, and unique skills. Open the [🔍 Details] window to examine them and hire the one you prefer.",
    ja: "傭兵ごとに性格(特性)、ステータス、固有スキルが異なります。【🔍詳細】を開いて入念に確認し、お気に入りの隊員を雇用してください。"
  },
  "(확인 시 대화창이 닫히며 자유롭게 후보들을 검토하고 고용하실 수 있습니다)": {
    en: "(Confirming closes the dialogue, allowing you to freely review and hire candidates)",
    ja: "(確認すると対話が閉じ、自由に候補を検討して雇用できます)"
  },
  "용병 후보 상세 확인 및 고용": {
    en: "Inspect Candidates & Recruit",
    ja: "傭兵候補詳細確認と雇用"
  },

  // ── Step 7 ──
  "원정단 편성 이동": {
    en: "Open Squad Formation",
    ja: "遠征隊編成へ移動"
  },
  "훌륭한 대원을 영입하셨군요, 사령관님!": {
    en: "An excellent recruit, Commander!",
    ja: "素晴らしい隊員を迎え入れましたね、指揮官！"
  },
  "새로 합류한 대원을 실전에 투입하려면 원정대에 등록해야 합니다. 상단의 [원정단 편성 이동]을 눌러 편성 화면으로 이동하십시오.": {
    en: "To deploy your new recruit into battle, register them into the expedition squad. Tap [Open Squad Formation] at the top to proceed.",
    ja: "合流した隊員を実戦に投入するには遠征隊に登録する必要があります。上部の【遠征隊編成へ移動】を押して編成画面へ進んでください。"
  },
  "원정단 편성 이동 ▶": {
    en: "Open Squad Formation ▶",
    ja: "遠征隊編成へ移動 ▶"
  },

  // ── Step 8 ──
  "원정대 출전 배치": {
    en: "Deploy Hero to Party",
    ja: "遠征隊出撃配置"
  },
  "방금 영입한 대원을 실전 탐사대에 배치할 차례입니다.": {
    en: "It's time to assign your newly recruited hero to the active expedition squad.",
    ja: "先ほど雇用した隊員を実戦探検隊に配備する番です。"
  },
  "대기 중인 용병 카드의 [⚔️ 파티에 출전] 버튼을 눌러 3인 원정대를 완성하십시오. (확인 시 대화창이 닫히며 출전 버튼이 강조됩니다)": {
    en: "Tap [⚔️ Deploy to Party] on the standby mercenary card to complete your 3-hero squad. (Confirming closes dialogue and highlights the button)",
    ja: "待機中の傭兵カードの【⚔️ パーティに出撃】を押し、3人遠征隊を完成させてください。(確認すると対話が閉じ、出撃ボタンが強調されます)"
  },
  "파티에 출전 ⚔️": {
    en: "Deploy to Party ⚔️",
    ja: "パーティに出撃 ⚔️"
  },

  // ── Step 9 ──
  "전술 무구 부족 현황 보고": {
    en: "Tactical Arms Shortage Report",
    ja: "戦術武具不足の現況報告"
  },
  "…사령관님, 솔직히 보고드려야 할 현안이 있습니다.": {
    en: "...Commander, there is an urgent matter I must report honestly.",
    ja: "…指揮官、正直にご報告すべき懸案があります。"
  },
  "원래대로라면 영입한 대원에게 제식 무구를 지급해야 하지만, 현재 방주는 병기창이 파손되고 가공 자원이 없어 지원해 드릴 수 있는 무구가 전혀 없습니다.": {
    en: "Normally, we would supply standard tactical arms to recruits, but with our armory ruined and raw materials lacking, we have no gear to provide.",
    ja: "本来なら隊員に制式武具を支給すべきですが、兵器廠が損壊し加工資材もないため、支援できる武具が一切ありません。"
  },
  "하지만 이번 작전은 무리한 결전이 아닌 [침묵의 회랑 1구역]을 살피는 [1층 정찰 강하]입니다. 사전 채비를 철저히 갖추면 충분히 돌파할 수 있습니다. 강조된 [출정 채비실로 이동] 버튼을 눌러 채비실로 이동하십시오.": {
    en: "However, this operation is a [Floor 1 Recon Descent] into [Silent Cloister Sector 1], not a reckless showdown. Thorough preparation will see us through. Tap [Go to Prep Room] to proceed.",
    ja: "ですが今回の作戦は決戦ではなく【沈黙の回廊1区域】を偵察する【1階偵察降下】です。入念に準備すれば十分に突破できます。強調された【出撃準備室へ移動】を押して進んでください。"
  },

  // ── Step 10 ──
  "원정대 진형 및 포지션 설정": {
    en: "Squad Formation & Position Setup",
    ja: "遠征隊陣形・ポジション設定"
  },
  "출정 채비실에 오셨습니다. 무구가 부족한 상황일수록 대원들의 포지션 배치가 생사를 결정합니다.": {
    en: "Welcome to the Expedition Prep Room. When arms are scarce, tactical positioning dictates life or death.",
    ja: "出撃準備室へようこそ。武具が不足している時ほど、隊員の配置ポジションが生死を分けます。"
  },
  "전방의 공격을 받아낼 대원은 [전열(피해-10%)]에, 원거리 및 지원 대원은 [중열] 또는 [후열]에 배치하도록 권장합니다.": {
    en: "We recommend placing a defender in the [Front row (-10% DMG)] to absorb enemy attacks, and ranged or support allies in the [Mid] or [Back row].",
    ja: "前方の攻撃を受け止める隊員は【前衛(被ダメ-10%)】に、遠距離・支援隊員は【中衛】または【後衛】に配置することを推奨します。"
  },
  "하단의 [포지션 설정하기]를 누르면 대화창이 닫히며 자유롭게 대원들의 포지션을 변경할 수 있습니다. 설정을 마친 후 화면 하단의 [다음: 시너지 확인 ▶] 플로팅 버튼을 눌러주십시오.": {
    en: "Tap [Set Positions] below to close the dialogue and freely adjust formations. Once done, tap [Next: Check Synergy ▶] at the bottom.",
    ja: "下部の【ポジション設定】を押すと対話が閉じ、自由に陣形を調整できます。設定完了後、画面下の【次へ: シナジー確認 ▶】を押してください。"
  },

  // ── Step 11 ──
  "파티 시너지 효과 확인": {
    en: "Check Party Synergy",
    ja: "パーティシナジー効果確認"
  },
  "대원들의 직업 조합에 따라 파티 전체에 강력한 전투 버프를 주는 [파티 시너지]가 상시 발동됩니다.": {
    en: "Depending on your class combinations, [Party Synergies] grant potent combat buffs to the entire team at all times.",
    ja: "隊員の職業の組み合わせに応じ、パーティ全体へ強力な戦闘バフを与える【パーティシナジー】が常時発動します。"
  },
  "원정대의 현재 활성 시너지 조합과 효과를 확인하신 후 [다음] 버튼을 눌러주십시오.": {
    en: "Inspect your squad's active synergy bonuses, then tap [Next].",
    ja: "現在の発動シナジーと効果を確認し、【次へ】ボタンを押してください。"
  },
  "파티 시너지 패널": {
    en: "Party Synergy Panel",
    ja: "パーティシナジーパネル"
  },

  // ── Step 12 ──
  "원정 배낭 규격 확인": {
    en: "Check Expedition Backpack",
    ja: "遠征リュック規格確認"
  },
  "심연에서 획득할 전리품과 소모품을 보관할 [배낭] 규격입니다.": {
    en: "This is your [Backpack], where spoils and consumables gathered from the Abyss will be stored.",
    ja: "深淵で獲得した戦利品や消費アイテムを保管する【リュック】の規格です。"
  },
  "배낭 용량이 클수록 더 많은 전리품을 가져올 수 있지만 추가 준비 비용이 발생합니다. 규격을 확인하신 후 [다음]을 눌러주십시오.": {
    en: "A larger backpack brings home more loot, but incurs extra preparation costs. Review the capacity, then tap [Next].",
    ja: "容量が大きいほど多くの戦利品を持ち帰れますが、追加準備費用が発生します。規格を確認後、【次へ】を押してください。"
  },
  "배낭 규격 선택 구역": {
    en: "Backpack Selection Area",
    ja: "リュック規格選択エリア"
  },

  // ── Step 13 ──
  "필수 생존 보급품 및 균열의 닻 점검": {
    en: "Survival Supplies & Rift Anchor",
    ja: "必須生存補給品と亀裂の錨点検"
  },
  "심연으로 진입하기 전, 배낭의 필수 소모품을 점검합니다. 시야를 밝힐 🔥 횃불, 야영 시 체력을 회복할 🍖 식량, 부상을 치료할 🩹 붕대, 광맥을 캘 ⛏️ 곡괭이가 필요합니다.": {
    en: "Before descending into the Abyss, check vital supplies: 🔥 Torches for vision, 🍖 Food for camp recovery, 🩹 Bandages for wounds, and ⛏️ Pickaxes for ore veins.",
    ja: "深淵へ降下する前に必需品を点検します。視界を灯す🔥松明、野営でHPを回復する🍖食糧、負傷を癒す🩹包帯、鉱脈を掘る⛏️ツルハシが必要です。"
  },
  "그리고 가장 중요한 [⚓ 균열의 닻]을 반드시 챙기셔야 합니다! 심연 탐사 중 전멸 위기 시 전리품 손실 없이 [즉각 안전 귀환]하거나, 대기 용병과 [현장 교체]할 때 소모되는 절대적인 생명선입니다.": {
    en: "And most importantly, you must carry the [⚓ Rift Anchor]! It is an absolute lifeline to [Safely Evacuate] without losing spoils during crisis, or [Swap Allies] in the field.",
    ja: "そして最も重要な【⚓亀裂の錨】を必ず携帯してください！ 全滅の危機時に戦利品を失わず【即時安全帰還】したり、待機傭兵と【現場交代】する命綱です。"
  },
  "이번 1층 정찰에는 추가 자원 소모가 전혀 없는 무료 [가벼운 백팩(12칸)]을 선택하고, 보급품을 각 1개씩 담아주십시오.": {
    en: "For this 1st floor recon, choose the free [Light Backpack (12 slots)] and pack 1 of each supply item.",
    ja: "今回の1階偵察では追加資材消費のない無料の【軽装リュック(12枠)】を選び、補給品を各1個ずつ詰め込んでください。"
  },

  // ── Step 14 ──
  "침묵의 회랑 1구역 강하 개시": {
    en: "Silent Cloister Sector 1 Descent",
    ja: "沈黙の回廊1区域 降下開始"
  },
  "심연 1계층, 침묵의 회랑 1구역입니다.": {
    en: "Stratum 1 of the Abyss: Silent Cloister Sector 1.",
    ja: "深淵第1階層、沈黙の回廊1区域です。"
  },
  "방주의 통제실에서 사령관님의 원정대를 끝까지 지원하겠습니다. 1층의 [강하 개시]를 눌러 심연으로 출격하십시오. 무운을 빕니다!": {
    en: "The Ark Control Room stands with you to the end. Tap [Begin Descent] on Floor 1 to deploy. May fortune favor your blade!",
    ja: "方舟管制室より指揮官の遠征隊を最後まで支援いたします。1階の【降下開始】を押して出撃してください。ご武運を！"
  },
  "강하 개시 ⚔️": {
    en: "Begin Descent ⚔️",
    ja: "降下開始 ⚔️"
  },

  // ── Step 15 ──
  "심연 1구역 탐색 개시": {
    en: "Begin Sector 1 Exploration",
    ja: "深淵1区域探検開始"
  },
  "심연 1계층 회랑에 무사히 진입했습니다! 이제 전방을 탐색하며 자원을 수집하고 숨겨진 마물의 기척을 경계해야 합니다.": {
    en: "We have safely breached the Stratum 1 Cloister! Explore ahead, gather resources, and remain vigilant for lurking monsters.",
    ja: "深淵第1階層の回廊に無事進入しました！ 前方を探索して資源を収集し、潜む魔物の気配を警戒してください。"
  },
  "화면 하단의 [탐색 진행] 버튼을 눌러 회랑 안쪽으로 발걸음을 옮겨 주십시오. 마물이 출현하면 즉시 전술 브리핑을 지원하겠습니다!": {
    en: "Tap [Proceed Exploration] below to advance deeper. I will provide immediate tactical briefing upon monster encounter!",
    ja: "画面下の【探検進行】を押し、回廊の奥へと足を進めてください。魔物が出現次第、直ちに戦術ブリーフィングを行います！"
  },
  "탐색 진행 ▶": {
    en: "Proceed Exploration ▶",
    ja: "探検進行 ▶"
  },

  // ── Step 16 ──
  "적 전력 분석 및 타깃 지정": {
    en: "Enemy Analysis & Target Lock",
    ja: "敵戦力分析とターゲット指定"
  },
  "전방에 마물 무리가 나타났습니다! 전열의 [부패 슬라임] 뒤에 숨어있는 후열의 [그림자 임프]를 주목하십시오.": {
    en: "A pack of monsters has appeared ahead! Notice the [Shadow Imp] in the back row lurking behind the [Rot Slime].",
    ja: "前方に魔物の群れが出現しました！ 前衛の【腐敗スライム】の後ろに隠れている後衛の【シャドウインプ】にご注目ください。"
  },
  "후열의 적은 강력한 기습과 광역 공격을 가해오므로 최우선으로 제압해야 합니다. 상단의 [그림자 임프] 카드를 탭하여 [타깃]을 지정하십시오!": {
    en: "Back-row enemies unleash ambush and AoE strikes, making them top priority. Tap the [Shadow Imp] card above to lock your [Target]!",
    ja: "後衛の敵は強力な急襲や範囲攻撃を仕掛けてくるため最優先で制圧すべきです。上の【シャドウインプ】カードをタップして【ターゲット】を指定してください！"
  },
  "후열 마물(그림자 임프) 타깃 지정": {
    en: "Target Back-row Monster (Shadow Imp)",
    ja: "後衛魔物(シャドウインプ)ターゲット指定"
  },

  // ── Step 17 ──
  "스킬 연계와 FEVER 게이지 충전": {
    en: "Skill Combos & FEVER Gauge",
    ja: "スキル連携とFEVERゲージ充填"
  },
  "훌륭한 판단입니다, 사령관님! 목표가 확실하게 고정되었습니다.": {
    en: "Superb decision, Commander! Target locked tight.",
    ja: "見事なご判断です、指揮官！ 標的を確実に捕捉しました。"
  },
  "전투 중 대원들이 스킬을 사용하거나 치명타, 상태이상 연계(콤보)를 성공시키면 화면 상단의 [FEVER 게이지]에 전술 뱃지가 충전됩니다.": {
    en: "When allies use skills, land critical hits, or trigger status combos in battle, tactical badges charge the [FEVER Gauge] above.",
    ja: "戦闘中に隊員がスキルを使用したり会心、状態異常連携(コンボ)を成功させると、画面上の【FEVERゲージ】に戦術バッジが充填されます。"
  },
  "뱃지 5개가 모두 모이면 강력한 파티 전술 시너지가 활성화됩니다. 아군의 스킬을 연계하며 마물들과 공방을 주고받아 보십시오!": {
    en: "Collecting all 5 badges unleashes powerful party tactical synergies. Chain allied skills and engage the monsters!",
    ja: "バッジが5個集まると強力な戦術シナジーが発動します。味方のスキルを連携させ、魔物と攻防を繰り広げてください！"
  },
  "FEVER 게이지 & 전술 뱃지": {
    en: "FEVER Gauge & Tactical Badges",
    ja: "FEVERゲージ＆戦術バッジ"
  },

  // ── Step 18 ──
  "FEVER 시너지 활성화 및 궁극기 전술 지휘": {
    en: "FEVER Synergy & Ultimate Command",
    ja: "FEVERシナジー発動とアルティメット戦術指揮"
  },
  "사령관님, FEVER 게이지가 최대로 충전되었습니다! 게이지 하단에 활성화된 【전술 시너지 효과】를 확인해 주십시오.": {
    en: "Commander, FEVER Gauge is at maximum! Inspect the active 【Tactical Synergy Effect】 below the gauge.",
    ja: "指揮官、FEVERゲージが最大まで充填されました！ ゲージ下に発動した【戦術シナジー効果】をご確認ください。"
  },
  "피버가 충전되었다고 즉시 궁극기를 낭비하기보다는, 시너지 효과가 아군의 상황이나 적의 패턴과 맞아떨어지는 결정적인 순간에 발동하는 것이 전술의 핵심입니다.": {
    en: "Rather than unleashing ultimates blindly upon fever charge, the key is timing them when synergy aligns with allied status and enemy patterns.",
    ja: "フィーバー充填直後に無駄撃ちするより、味方の状況や敵のパターンとシナジーが合致する決定打の瞬間に放つのが戦術の要です。"
  },
  "전황을 냉철하게 살피며 가장 적절한 순간에 대원의 [궁극기]를 발동하여 시너지를 폭발시키십시오!": {
    en: "Watch the flow of battle and unleash an ally's [Ultimate] at the peak moment to trigger the synergy burst!",
    ja: "戦況を冷静に見極め、最も適切な瞬間に隊員の【アルティメット】を発動してシナジーを炸裂させてください！"
  },
  "FEVER 시너지 효과 확인": {
    en: "Check FEVER Synergy Effect",
    ja: "FEVERシナジー効果確認"
  },

  // ── Step 19 ──
  "전술 시너지 폭발!": {
    en: "Tactical Synergy Burst!",
    ja: "戦術シナジー爆発！"
  },
  "탁월한 지휘입니다, 사령관님! 결정적인 타이밍에 폭발한 궁극기와 전술 시너지가 마물들을 완전히 압도했습니다!": {
    en: "Brilliant command, Commander! The tactical synergy and ultimate burst at that crucial timing completely overwhelmed the fiends!",
    ja: "卓越した采配です、指揮官！ 決定的なタイミングで炸裂した究極技と戦術シナジーが魔物を完全に圧倒しました！"
  },
  "이 기세를 몰아 남은 마물들을 모두 소탕하고 이번 심연 정찰을 완벽한 승리로 이끄십시오!": {
    en: "Ride this momentum, mop up the remaining monsters, and claim total victory in this abyssal reconnaissance!",
    ja: "この勢いに乗り残党をすべて掃討し、今回の深淵偵察を完全勝利で飾りましょう！"
  },

  // ── Step 20 ──
  "전투 후 모닥불 야영과 유대감 다지기": {
    en: "Post-Battle Camp & Bonds",
    ja: "戦闘後の焚火野営と絆の深化"
  },
  "마물 무리를 훌륭히 격퇴하셨습니다, 사령관님! 격전을 치른 대원들의 체력과 마나가 많이 소모되었습니다.": {
    en: "Splendid victory over the fiends, Commander! Your battle-weary squad has drained much HP and MP.",
    ja: "魔物の群れを見事撃退しましたね、指揮官！ 激闘を終えた隊員のHPとMPが大きく消耗しています。"
  },
  "화면 좌측 하단의 [야영] 버튼을 눌러 모닥불을 피우고 대원들을 쉬게 하십시오. 야영 중 나누는 모닥불 대화를 통해 대원 간의 [유대감]이 상승하여 전투력이 한층 더 강화됩니다!": {
    en: "Tap [Camp] at the bottom-left to light a campfire and rest your troops. Bonfire chats deepen [Bonds], bolstering their combat strength even further!",
    ja: "画面左下の【野営】をタップして焚火を灯し、隊員たちを休ませてください。焚火の団欒を通じて【絆】が深まり、戦闘力が一段と強化されます！"
  },
  "야영 (체력 회복 & 유대감 상승)": {
    en: "Camp (Recover HP & Boost Bonds)",
    ja: "野営 (HP回復＆絆上昇)"
  },

  // ── Step 21 ──
  "횃불 점등과 심연 위험도 가속": {
    en: "Light Torch & Hazard Surge",
    ja: "松明点灯と深淵危険度加速"
  },
  "심연의 어둠은 위험하지만, [횃불]을 켜면 시야가 확보되어 전방의 마기와 숨겨진 길을 더 빠르게 탐색할 수 있습니다.": {
    en: "The abyssal dark is perilous, but lighting a [Torch] secures vision to spot demonic mists and hidden paths much faster.",
    ja: "深淵の闇は危険ですが、【松明】を灯せば視界が確保され、前方の魔気や隠し通路を素早く発見できます。"
  },
  "횃불이 켜진 상태에서는 [탐색 진행] 시 심연 위험도가 더 신속하게 상승하여 보스 방이나 다음 층으로 가는 심연의 문을 빠르게 열 수 있습니다.": {
    en: "While the torch burns, [Proceed Exploration] accelerates Abyss Hazard gain, swiftly opening the doors to the boss room and lower floors.",
    ja: "松明が灯っている間は【探検進行】時の深淵危険度が急速に上昇し、ボス部屋や次層への扉を素早く解き放てます。"
  },
  "화면 우측 하단의 [횃불] 버튼을 탭하여 불을 밝혀 보십시오!": {
    en: "Tap the [Torch] button at the bottom-right to ignite the flames!",
    ja: "画面右下の【松明】ボタンをタップして火を灯してみましょう！"
  },
  "횃불 점등 🔥": {
    en: "Light Torch 🔥",
    ja: "松明点灯 🔥"
  },

  // ── Step 22 ──
  "원정대 관리 및 안전 귀환 지휘": {
    en: "Manage Squad & Safe Return",
    ja: "遠征隊管理と安全帰還指揮"
  },
  "횃불 옆의 [용병 관리] 버튼을 누르면 대기실의 예비 용병과 파티원을 즉석에서 교체하거나 전/중/후열 포지션을 재배열할 수 있습니다.": {
    en: "The [Manage Heroes] button next to the torch lets you swap party members with reserve mercenaries or rearrange positions on the spot.",
    ja: "松明の隣の【傭兵管理】を押すと、待機中の傭兵と即座に交代したり前衛・中衛・後衛の陣形を再配置できます。"
  },
  "하지만 이번 강하는 지형과 전투 메커니즘을 파악하기 위한 [1차 기본 정찰]이므로, 용병 교체나 재배치 없이 안전하게 방주로 귀환하겠습니다.": {
    en: "However, as this expedition is a [1st Basic Recon] to grasp terrain and combat flow, we shall safely withdraw to the Ark without swaps.",
    ja: "ですが今回の降下は地形と戦闘の感覚を掴むための【第1次基本偵察】ですので、交代や再編は行わず安全に方舟へ帰還します。"
  },
  "좌측 하단의 [귀환(균열의 닻)] 버튼을 눌러 지금까지 모은 전리품을 가지고 영지로 무사히 귀환하십시오!": {
    en: "Tap [Return (Rift Anchor)] at the bottom-left to safely return to the citadel with all the spoils you've amassed!",
    ja: "左下の【帰還(亀裂の錨)】を押し、集めた戦利品を携えて城塞領地へ無事に帰還してください！"
  },
  "귀환 ⚓ (방주로 안전 귀환)": {
    en: "Return ⚓ (Safe Return to Ark)",
    ja: "帰還 ⚓ (方舟へ安全帰還)"
  },

  // ── Step 23 ──
  "첫 원정 정찰 완수 및 방주 지휘 개시": {
    en: "First Recon Complete & Ark Command",
    ja: "初遠征偵察完了と方舟指揮開始"
  },
  "원정대의 안전 귀환을 환영합니다, 사령관님! 심연에서 수집한 모든 전리품과 자원들이 [영지 창고]에 안전하게 보관되었습니다.": {
    en: "Welcome back, Commander! All spoils and resources collected from the Abyss are safely secured in the [Citadel Storage].",
    ja: "遠征隊の安全帰還を歓迎します、指揮官！ 深淵で収集した全ての戦利品と資源が【領地倉庫】に安全に保管されました。"
  },
  "방주 원정은 항상 이와 같은 흐름으로 진행됩니다: [출정 채비 ➔ 심연 강하 및 탐색·전투·야영 ➔ 전리품 수확 후 안전 귀환].": {
    en: "Ark expeditions always follow this rhythm: [Expedition Prep ➔ Descent, Exploration, Battle & Camp ➔ Harvest Spoils & Safe Return].",
    ja: "方舟遠征は常にこの流れで進行します:【出撃準備 ➔ 深淵降下・探索・戦闘・野営 ➔ 戦利品収穫後の安全帰還】。"
  },
  "귀환하여 비축한 자원으로 대장간을 승급시켜 더 강력한 장비를 제작하고, 성화와 묘지를 복구하며 계속해서 열리는 영지 시설들을 발전시키십시오.": {
    en: "Upgrade your Forge with returned resources to craft stronger gear, restore the Bonfire and Graveyard, and expand newly unlocked facilities.",
    ja: "蓄積した資源で鍛冶場を昇格させて強力な武具を作り、聖火や墓地を復旧しながら続々と解放される領地施設を発展させましょう。"
  },
  "이제부터 사령관님만의 원정단을 이끌고 심연 11층 무간도의 최심부까지 정복해 나가십시오. 통제실은 언제나 사령관님의 곁에 있습니다!": {
    en: "From here on, lead your own expedition squad to conquer the deepest pits of Floor 11 Avici. The Control Room will always stand by you!",
    ja: "ここからは指揮官ご自身の遠征隊を率い、深淵第11層・無間道の最深部を征服してください。管制室は常に指揮官と共にあります！"
  }
};

// 1. Write delta_004.json
const outDir = path.resolve('scripts/i18n/out');
const delta004Path = path.join(outDir, 'delta_004.json');
fs.writeFileSync(delta004Path, JSON.stringify(TUTORIAL_I18N, null, 2), 'utf8');
console.log('Saved delta_004.json with', Object.keys(TUTORIAL_I18N).length, 'entries.');

// 2. Append new keys to ko-all.json if missing
const koAllPath = path.resolve('scripts/i18n/ko-all.json');
const koAll = JSON.parse(fs.readFileSync(koAllPath, 'utf8'));
const koSet = new Set(koAll);
let addedCount = 0;
for (const key of Object.keys(TUTORIAL_I18N)) {
  if (!koSet.has(key)) {
    koAll.push(key);
    koSet.add(key);
    addedCount++;
  }
}
fs.writeFileSync(koAllPath, JSON.stringify(koAll, null, 2), 'utf8');
console.log('Updated ko-all.json with', addedCount, 'new keys. Total keys:', koAll.length);
