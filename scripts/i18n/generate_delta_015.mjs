import fs from 'fs';
import path from 'path';

const outPath = './scripts/i18n/out/delta_015.json';

const translations = {
  // ── 시간 단위 및 복합 시간 표현 ──
  '초': { en: 's', ja: '秒' },
  '분': { en: 'm', ja: '分' },
  '시간': { en: 'h', ja: '時間' },
  '일': { en: 'd', ja: '日' },
  '남음': { en: 'left', ja: '残り' },
  '남은 시간': { en: 'Time Remaining', ja: '残り時間' },
  '남은 온기': { en: 'Remaining Warmth', ja: '残りの温もり' },
  '온기': { en: 'Warmth', ja: '温もり' },
  '생산량 +15%': { en: 'Production +15%', ja: '生産量 +15%' },
  '쿨타임': { en: 'Cooldown', ja: 'クールタイム' },
  '10분 쿨타임': { en: '10m Cooldown', ja: '10分クールタイム' },
  '10분 쿨다운': { en: '10m Cooldown', ja: '10分クールダウン' },
  '1시간 쿨다운': { en: '1h Cooldown', ja: '1時間クールダウン' },
  '5분간 유지': { en: 'Lasts for 5m', ja: '5分間持続' },
  '정화 후 5분간 유지': { en: 'Maintained for 5m after purification', ja: '浄化後5分間維持' },
  '+ 3시간 보호막 전개': { en: '+ Deploy 3h Shield', ja: '+ 3時間シールド展開' },
  '3시간 자동 보호막': { en: '3-hour automatic shield', ja: '3時間自動シールド' },
  '차원 왜곡 평화 보호막': { en: 'Dimensional Peace Shield', ja: '次元歪曲平和シールド' },
  '침공당해 패배 시 3시간 자동 보호막이 전개되며, 수동으로 즉시 3시간 전개할 수도 있습니다.': {
    en: 'A 3-hour automatic shield deploys upon defeat in invasion, or you can manually deploy 3 hours immediately.',
    ja: '侵攻を受け敗北した場合3時間自動シールドが展開され、手動で即座に3時間展開することもできます。'
  },
  '내 영지 보호막': { en: 'Territory Shield', ja: '領地シールド' },
  '비활성': { en: 'Inactive', ja: '非アクティブ' },
  '확인 (2초 후 자동 닫힘)': { en: 'Confirm (Auto-closes in 2s)', ja: '確認 (2秒後自動終了)' },
  '{0}초 남음': { en: '{0}s left', ja: '残り{0}秒' },
  '{0}분 남음': { en: '{0}m left', ja: '残り{0}分' },
  '{0}시간 남음': { en: '{0}h left', ja: '残り{0}時間' },
  '{0}초': { en: '{0}s', ja: '{0}秒' },
  '{0}분': { en: '{0}m', ja: '{0}分' },
  '{0}시간': { en: '{0}h', ja: '{0}時間' },
  '{0}일': { en: '{0}d', ja: '{0}日' },
  '{0}분 {1}초': { en: '{0}m {1}s', ja: '{0}分 {1}秒' },
  '{0}시간 {1}분': { en: '{0}h {1}m', ja: '{0}時間 {1}分' },
  '{0}일 {1}시간': { en: '{0}d {1}h', ja: '{0}日 {1}時間' },
  '{0}일 {1}시간 {2}분': { en: '{0}d {1}h {2}m', ja: '{0}日 {1}時間 {2}分' },
  '{0}분 {1}초 남음': { en: '{0}m {1}s left', ja: '残り{0}分{1}秒' },
  '{0}초마다': { en: 'every {0}s', ja: '{0}秒ごと' },
  '{0}분마다': { en: 'every {0}m', ja: '{0}分ごと' },
  '{0}시간마다': { en: 'every {0}h', ja: '{0}時間ごと' },
  '{0}초당': { en: 'per {0}s', ja: '{0}秒ごと' },
  '유지비 주기: {0}초': { en: 'Upkeep Cycle: {0}s', ja: '維持費周期: {0}秒' },
  '유지비 주기: {0}': { en: 'Upkeep Cycle: {0}', ja: '維持費周期: {0}' },
  '다음 주민/길드 의뢰 도착까지': { en: 'Until next quest arrives', ja: '次の住民/ギルド依頼到着まで' },
  '다음 주민/길드 의뢰 도착까지: {0}': { en: 'Until next quest arrives: {0}', ja: '次の住民/ギルド依頼到着まで: {0}' },
  '남은 온기: {0}': { en: 'Remaining Warmth: {0}', ja: '残りの温もり: {0}' },

  // ── 재료 명칭 (마력 수정, 접미석, 접두석 등) ──
  '마력 수정': { en: 'Magic Crystal', ja: '魔力水晶' },
  '마력수정': { en: 'Magic Crystal', ja: '魔力水晶' },
  '일반 접두석': { en: 'Prefix Stone', ja: '一般接頭石' },
  '일반 접미석': { en: 'Suffix Stone', ja: '一般接尾石' },
  '순수 접두석': { en: 'Pure Prefix Stone', ja: '純粋接頭石' },
  '순수 접미석': { en: 'Pure Suffix Stone', ja: '純粋接尾石' },
  '접두석': { en: 'Prefix Stone', ja: '接頭石' },
  '접미석': { en: 'Suffix Stone', ja: '接尾石' },
  '순수접두석': { en: 'Pure Prefix Stone', ja: '純粋接頭石' },
  '순수접미석': { en: 'Pure Suffix Stone', ja: '純粋接尾石' },
  '순수 마도석': { en: 'Pure Mana Stone', ja: '純粋魔導石' },
  '고급 접두석': { en: 'Greater Prefix Stone', ja: '高級接頭石' },
  '고급 접미석': { en: 'Greater Suffix Stone', ja: '高級接尾石' },
  '공허 파편': { en: 'Void Shard', ja: '虚無の欠片' },
  '공허파편': { en: 'Void Shard', ja: '虚無の欠片' },
  '암흑정수': { en: 'Dark Essence', ja: '暗黒エッセンス' },
  '암흑 정수': { en: 'Dark Essence', ja: '暗黒エッセンス' },
  '고순도 에테르': { en: 'High-purity Ether', ja: '高純度エーテル' },
  '농축 수정': { en: 'Concentrated Crystal', ja: '濃縮水晶' },
  '룬 철광': { en: 'Runic Iron Ore', ja: 'ルーン鉄鉱' },
  '망각의 유골': { en: 'Oblivion Bones', ja: '忘却の遺骨' },
  '고대 마력 수정': { en: 'Ancient Magic Crystal', ja: '古代の魔力水晶' },
  '저주 정화수': { en: 'Curse Purification Water', ja: '呪い浄化水' },
  '환영의 거울 파편': { en: 'Mirror Phantom Shard', ja: '幻影の鏡の破片' },
  '시공간 공허정수': { en: 'Spacetime Void Essence', ja: '時空虚無のエッセンス' },
  '핏빛 에센스': { en: 'Crimson Essence', ja: '深紅のエッセンス' },
  '농축 약초': { en: 'Concentrated Herb', ja: '濃縮薬草' },
  '마수의 가죽': { en: 'Beast Leather', ja: '魔獣の革' },
  '단죄의 강철': { en: 'Condemnation Steel', ja: '断罪の鋼鉄' },
  '신성 에테르 룬': { en: 'Holy Ether Rune', ja: '神聖エーテルルーン' },

  // ── 이모지 포함 자원 뱃지/로그 ──
  '🔮 마력 수정': { en: '🔮 Magic Crystal', ja: '🔮 魔力水晶' },
  '💠 공허 파편': { en: '💠 Void Shard', ja: '💠 虚無の欠片' },
  '✨ 일반 접두석': { en: '✨ Prefix Stone', ja: '✨ 一般接頭石' },
  '🔮 일반 접미석': { en: '🔮 Suffix Stone', ja: '🔮 一般接尾石' },
  '⭐ 순수 접두석': { en: '⭐ Pure Prefix Stone', ja: '⭐ 純粋接頭石' },
  '🌌 순수 접미석': { en: '🌌 Pure Suffix Stone', ja: '🌌 純粋接尾石' },
  '🪵 목재': { en: '🪵 Wood', ja: '🪵 木材' },
  '🪨 석재': { en: '🪨 Stone', ja: '🪨 石材' },
  '⚙️ 철광': { en: '⚙️ Iron Ore', ja: '⚙️ 鉄鉱' },
  '⚙️ 철광석': { en: '⚙️ Iron Ore', ja: '⚙️ 鉄鉱石' },
  '🍖 식량': { en: '🍖 Food', ja: '🍖 食糧' },
  '🌿 약초': { en: '🌿 Herb', ja: '🌿 薬草' },
  '🧱 가죽': { en: '🧱 Leather', ja: '🧱 革' },
  '🧵 실크': { en: '🧵 Silk', ja: '🧵 シルク' },
  '⚫ 석탄': { en: '⚫ Coal', ja: '⚫ 石炭' },
  '✨ 에테르': { en: '✨ Ether', ja: '✨ エーテル' },
  '🪙 골드': { en: '🪙 Gold', ja: '🪙 ゴールド' },

  // ── 퀘스트 보상 & 서브 퀘스트 UI ──
  '퀘스트 목표 달성!': { en: 'Quest Objective Completed!', ja: 'クエスト目標達成！' },
  '신규 의뢰 접수 대기 중': { en: 'Awaiting New Contracts', ja: '新規依頼受付待機中' },
  '방랑자의 라운지 (주점) 건설 필요': { en: 'Requires Wanderer Lounge (Tavern)', ja: '放浪者のラウンジ（酒場）の建設が必要' },
  '영지에 <strong>방랑자의 라운지</strong>를 건설하면 방주 생존자들의 구호 의뢰 및 마물 토벌 서브 퀘스트가 해금됩니다.': {
    en: 'Building the <strong>Wanderer Lounge</strong> in the citadel unlocks relief requests from Ark survivors and monster subjugation subquests.',
    ja: '領地に<strong>放浪者のラウンジ</strong>を建設すると、方舟生存者たちの救護依頼や魔物討伐サブクエストが解放されます。'
  },
  '건설 비용: 🪵 목재 80, 🪨 석재 50, 🪙 300G': { en: 'Cost: 🪵 Wood 80, 🪨 Stone 50, 🪙 300G', ja: '建設費用: 🪵 木材 80, 🪨 石材 50, 🪙 300G' },
  '영지에서 주점 건설하러 가기 ▶': { en: 'Go to Citadel to Build Tavern ▶', ja: '領地で酒場を建設しに行く ▶' },
  '영혼의 제단 건설 필요': { en: 'Requires Soul Sanctuary', ja: '魂の祭壇の建設が必要' },
  '영지에 <strong>영혼의 제단</strong>을 완공하면 각 층 광폭화 보스 토벌 및 고대 방주의 기원을 추적하는 <strong>3부작 에픽 시나리오</strong>가 해금됩니다.': {
    en: 'Completing the <strong>Soul Sanctuary</strong> unlocks the 3-part epic storyline to conquer berserk bosses on each floor and uncover the origins of the ancient Ark.',
    ja: '領地に<strong>魂の祭壇</strong>を完成させると、各層の狂暴化ボス討伐と古代方舟の起源を追う<strong>3部作エピックシナリオ</strong>が解放されます。'
  },
  '건설 비용: 🪨 석재 120, ⚙️ 철광 50, ✨ 에테르 30, 🪙 1,000G': { en: 'Cost: 🪨 Stone 120, ⚙️ Iron 50, ✨ Ether 30, 🪙 1,000G', ja: '建設費用: 🪨 石材 120, ⚙️ 鉄鉱 50, ✨ エーテル 30, 🪙 1,000G' },
  '영지에서 제단 건설하러 가기 ▶': { en: 'Go to Citadel to Build Sanctuary ▶', ja: '領地で祭壇を建設しに行く ▶' },
  '아직 완료된 퀘스트가 없습니다.': { en: 'No completed quests yet.', ja: 'まだ完了したクエストがありません。' },
  '현재 해당 탭의 진행 가능한 퀘스트가 없습니다.': { en: 'No available quests in this tab.', ja: '現在このタブで進行可能なクエストはありません。' },
  '서브 퀘스트는 해결 시 새로운 의뢰가 계속 생성됩니다.': { en: 'New subquests will continuously generate as you complete them.', ja: 'サブクエストを解決すると新しい依頼が継続して生成されます。' },
  '영지 시설을 확장하거나 심연을 탐험하세요.': { en: 'Expand citadel facilities or explore the Abyss.', ja: '領地施設を拡張するか、深淵を探検してください。' },
  '슬롯 {0}/3': { en: 'Slot {0}/3', ja: 'スロット {0}/3' },
  '슬롯': { en: 'Slot', ja: 'スロット' },
  '소모/재고:': { en: 'Cost/Stock:', ja: '消費/在庫:' },
  '무료': { en: 'Free', ja: '無料' },
  '★ 최고 레벨 도달': { en: '★ Max Level Reached', ja: '★ 最大レベル到達' },

  // ── 블랙 마켓 & 교역 UI ──
  '영지 생산품': { en: 'Citadel Products', ja: '領地生産品' },
  '파밍 재료': { en: 'Farming Materials', ja: 'ファーミング材料' },
  '심연 재료': { en: 'Abyssal Materials', ja: '深淵材料' },
  '전직 승급 및 마도 연구/유지비': { en: 'Class promotion & arcane research/upkeep', ja: 'クラス昇格および魔導研究/維持費' },
  '무기 및 중갑 방어구 단조 (+30% 매입가)': { en: 'Forge weapons & heavy armor (+30% buy price)', ja: '武器および重甲防具の鍛造 (+30% 買取価格)' },
  '붕대 및 가죽 방어구 제작 (+30% 매입가)': { en: 'Craft bandages & leather armor (+30% buy price)', ja: '包帯および革防具の製作 (+30% 買取価格)' },
  '특수 결속 및 마도 보조 장비 가공 (+30% 매입가)': { en: 'Craft special bindings & arcane accessories (+30% buy price)', ja: '特殊結束および魔導補助装備の加工 (+30% 買取価格)' },
  '치유 물약 및 정화 성수 (+30% 매입가)': { en: 'Healing potions & purifying holy water (+30% buy price)', ja: '回復ポーションおよび浄化聖水 (+30% 買取価格)' },
  '마도 로브 및 부적 직조 (+30% 매입가)': { en: 'Weave arcane robes & talismans (+30% buy price)', ja: '魔導ローブおよびお守り織造 (+30% 買取価格)' },
  '상위 장비 단조 및 나침반 (+50% 매입가)': { en: 'High-tier forge & compass (+50% buy price)', ja: '上位装備鍛造および羅針盤 (+50% 買取価格)' },
  '+3강 이상 공격 옵션 부여 (+50% 매입가)': { en: 'Apply +3 or higher ATK options (+50% buy price)', ja: '+3強化以上の攻撃オプション付与 (+50% 買取価格)' },
  '+7강 이상 보조 옵션 부여 (+50% 매입가)': { en: 'Apply +7 or higher sub options (+50% buy price)', ja: '+7強化以上の補助オプション付与 (+50% 買取価格)' },
  '에픽 장비 및 2차 전설 승급 (+50% 매입가)': { en: 'Epic gear & 2nd legendary promotion (+50% buy price)', ja: 'エピック装備および2次伝説昇格 (+50% 買取価格)' },
  '+10강 전용 최고급 접두 옵션 (+50% 매입가)': { en: '+10 exclusive supreme prefix option (+50% buy price)', ja: '+10強化専用最高級接頭オプション (+50% 買取価格)' },
  '+10강 전용 최고급 접미 옵션 (+50% 매입가)': { en: '+10 exclusive supreme suffix option (+50% buy price)', ja: '+10強化専用最高級接尾オプション (+50% 買取価格)' },
  '신화급 각성 및 차원 왜곡 (+50% 매입가)': { en: 'Mythic awakening & dimensional warping (+50% buy price)', ja: '神話級覚醒および次元歪曲 (+50% 買取価格)' },
  '매진': { en: 'Sold Out', ja: '売り切れ' },
  '매입 재고': { en: 'Store Stock', ja: '仕入れ在庫' },
  '창고': { en: 'Storage', ja: '倉庫' },
  '상점 재고': { en: 'Shop Stock', ja: '商店在庫' },
  '재입고까지 {0}': { en: '{0} until restock', ja: '再入荷まで{0}' },
  '상점의 매입 물량이 전량 매진되었습니다.': { en: 'The store stock is completely sold out.', ja: '商店の仕入れ在庫が完売しました。' },
  '자원 일괄 거래 — {0}': { en: 'Bulk Resource Trade — {0}', ja: '資源一括取引 — {0}' },

  // ── 보상 요약 문구 ──
  '신규 시설 해금': { en: 'Unlock New Facility', ja: '新規施設解放' },
  '무장 보급': { en: 'Equipment Supply', ja: '武装補給' },
  '탐험 보급품': { en: 'Expedition Supplies', ja: '探検補給品' },
  '영지 재건 자원': { en: 'Citadel Rebuild Resources', ja: '領地再建資源' },
  '영지 보상': { en: 'Citadel Reward', ja: '領地報酬' },
  '🏛️ 신규 시설 해금': { en: '🏛️ Unlock New Facility', ja: '🏛️ 新規施設解放' },
  '⚔️ 무장 보급': { en: '⚔️ Equipment Supply', ja: '⚔️ 武装補給' },
  '🎒 탐험 보급품': { en: '🎒 Expedition Supplies', ja: '🎒 探検補給品' },
  '📦 영지 재건 자원': { en: '📦 Citadel Rebuild Resources', ja: '📦 領地再建資源' },
  '🏛️ [{0}] 건설 해금': { en: '🏛️ [{0}] Construction Unlocked', ja: '🏛️ [{0}] 建設解放' },
  '🎉 [퀘스트 보상 수령 완료!] \'{0}\'': { en: '🎉 [Quest Reward Claimed!] \'{0}\'', ja: '🎉 [クエスト報酬受取完了！] \'{0}\'' },
  '➔ 수령 보상: {0}': { en: '➔ Rewards: {0}', ja: '➔ 受取報酬: {0}' },
  '📦 [자원 총 생산] {0}': { en: '📦 [Total Production] {0}', ja: '📦 [資源総生産] {0}' },
  '📉 [시설 유지비] {0} 지출 (생산량으로 지속 충당 및 창고 상한 보전)': {
    en: '📉 [Facility Upkeep] Expended {0} (Continuously covered by production & capacity protected)',
    ja: '📉 [施設維持費] {0} 支出 (生産量で継続充当＆保管上限保全)'
  },
  '🌙 [오프라인 정산 ({0} 경과)] 부재 중 영지 활동이 정산되었습니다.': {
    en: '🌙 [Offline Settlement ({0} elapsed)] Citadel activities during absence have been settled.',
    ja: '🌙 [オフライン精算 ({0} 経過)] 不在中の領地活動が精算されました。'
  },
  '구매 실패: [{0}] 품목이 매진되었습니다! (재입고까지 {1}분 {2}초 남음)': {
    en: 'Purchase Failed: [{0}] is sold out! ({1}m {2}s until restock)',
    ja: '購入失敗: [{0}] は品切れです！ (再入荷まで残り {1}分 {2}秒)'
  },
  '구매 실패: [{0}] 품목이 매진되었습니다! (재입고까지 {1} 남음)': {
    en: 'Purchase Failed: [{0}] is sold out! ({1} until restock)',
    ja: '購入失敗: [{0}] は品切れです！ (再入荷まで残り {1})'
  },
  '구매 실패: 구매 요청 수량({0}개)이 현재 상점 매입 재고({1}개)를 초과합니다!': {
    en: 'Purchase Failed: Requested quantity ({0}) exceeds current shop stock ({1})!',
    ja: '購入失敗: 購入希望数量（{0}個）が現在の商店在庫（{1}個）を超過しています！'
  },
  '🕵️‍♂️ [블랙 마켓 매각] [{0}] {1}개를 판매하여 🪙 {2}G를 획득했습니다.': {
    en: '🕵️‍♂️ [Black Market Sale] Sold {1} [{0}] and gained 🪙 {2}G.',
    ja: '🕵️‍♂️ [ブラックマーケット売却] [{0}] を{1}個販売し、🪙 {2}Gを獲得しました。'
  },
  '⭐ [정예 마물 전리품] [{0}] {1}개를 획득했습니다!': {
    en: '⭐ [Elite Demon Spoils] Acquired {1} [{0}]!',
    ja: '⭐ [エリート魔物戦利品] [{0}] を{1}個獲得しました！'
  }
};

fs.mkdirSync('./scripts/i18n/out', { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(translations, null, 2), 'utf8');
console.log(`Generated delta_015.json with ${Object.keys(translations).length} entries.`);
