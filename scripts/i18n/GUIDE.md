# 번역 가이드 (KO → EN / JA)

## 입력/출력
- 입력: `scripts/i18n/chunks/chunk_NNN.json` — 한국어 문자열 배열 (200개)
- 출력: `scripts/i18n/out/chunk_NNN.json` — 객체 `{ "<한국어 원문 그대로>": { "en": "...", "ja": "..." } }`
- **키는 입력 문자열과 한 글자도 다르지 않게 그대로** 사용. 모든 항목을 빠짐없이 번역. 유효한 JSON(UTF-8)이어야 함.
- 파일은 반드시 `write_to_file` 로 작성(Overwrite=true). 큰 JSON이므로 직접 손으로 번역해서 작성할 것(번역 API/스크립트 사용 금지).

## 절대 규칙
1. `{0}`, `{1}` … 플레이스홀더는 **개수·번호·형태 그대로** 유지 (순서는 어순에 맞게 바꿔도 됨).
2. 이모지, `[대괄호]`, `★`, `➔`, `·`, `%`, `+`, 숫자, 영문 약어(HP/MP/ATK/FEVER/BGM 등)는 유지.
3. 한국어 조사 흔적(`이(가)`, `을(를)`)은 영어/일본어에서 제거/자연스럽게 처리.
4. 원문이 단어 조각(예: `"턴"`, `" 개"`, 앞뒤 공백 필요)이어도 자연스러운 짧은 번역. 의미 없는 조각이면 원문과 동일하게 둘 것.
5. 게임 톤: 다크 판타지 RPG. EN은 간결·박력, JA는 `です/ます` 대신 게임체(常体/体言止め) 위주.
6. 줄바꿈 `\n` 은 유지.
7. 한국어 이외 문자열(이미 영어)은 그대로.

## 용어집 (일관성 필수)
| KO | EN | JA |
|---|---|---|
| 방주 | Ark | 方舟 |
| 성채 | Citadel | 城塞 |
| 심연 | Abyss | 深淵 |
| 지휘관 | Commander | 指揮官 |
| 용병 | Mercenary | 傭兵 |
| 원정대 / 파티 | Expedition / Party | 遠征隊 / パーティ |
| 던전 / 탐험 | Dungeon / Exploration | ダンジョン / 探検 |
| 전열/중열/후열 | Front/Mid/Back row | 前衛/中衛/後衛 |
| 마도서 / 비전서 | Grimoire | 魔導書 |
| 스킬북 | Skill Book | スキルブック |
| 마나(MP) / 체력(HP) | MP / HP | MP / HP |
| 공격력/방어력/속도/행운/치명타 | ATK/DEF/SPD/LUCK/Crit | 攻撃力/防御力/速度/幸運/会心 |
| 출혈/중독/화상/빙결/기절/실명 | Bleed/Poison/Burn/Freeze/Stun/Blind | 出血/中毒/火傷/凍結/気絶/盲目 |
| 보호막 | Shield (barrier) | シールド |
| 단조 / 강화 / 인챈트 | Forge / Enhance / Enchant | 鍛造 / 強化 / エンチャント |
| 접두어/접미어 | Prefix/Suffix | 接頭辞/接尾辞 |
| 전직 / 승격 / 각성 | Class change / Promotion / Awakening | 転職 / 昇格 / 覚醒 |
| 오파츠 | Ooparts | オーパーツ |
| 도감 / 백과사전 | Codex / Encyclopedia | 図鑑 / 百科事典 |
| 위험도 | Hazard | 危険度 |
| 오버차지 | Overcharge | オーバーチャージ |
| 모닥불/성화 | Bonfire / Sacred Flame | 焚火 / 聖火 |
| 전술 모멘텀 / 뱃지 | Tactical Momentum / Badge | 戦術モメンタム / バッジ |
| 원호 공격 | Assist Attack | 援護攻撃 |
| 무간도 | Avici | 無間道 |
| 차징 | Charging | チャージ |
| 광역 | AoE | 範囲攻撃 |
| 쿨다운 | Cooldown | クールダウン |
| 에테르 | Ether | エーテル |
| 골드 | Gold | ゴールド |
| 방랑자의 라운지 | Wanderer Lounge | 放浪者のラウンジ |
| 심연의 병기창 | Ark Armory & Forge | 深淵の兵器廠 |
| 영혼의 제단 | Soul Sanctuary | 魂の祭壇 |
| 생체 복원 병동 | Bio-Restoration Ward | 生体復元病棟 |
| 황혼의 블랙 마켓 | Twilight Black Market | 黄昏のブラックマーケット |
| 방주 중앙 병참고 | Central Logistics Depot | 方舟中央兵站庫 |
| 차원 앵커 게이트 | Dimensional Gate | 次元アンカーゲート |
| 에테르 연금 공방 | Aether Alchemy Lab | エーテル錬金工房 |
| 생존자 안식처 | Survivor Haven | 生存者の安息所 |
| 영목 벌채소 | Lumber Camp | 霊木伐採所 |
| 에테르 광맥 시추소 | Aether Quarry | エーテル鉱脈採掘所 |
| 심연 생체 정제소 | Abyssal Refinery | 深淵生体精製所 |
| 방주의 성화 | Primal Bonfire | 方舟の聖火 |

던전 층: 침묵의 회랑 Silent Cloister / 망령의 납골당 Ossuary of Phantoms / 에테르 광맥 Ether Vein / 심연의 균열 Abyssal Rift / 원초의 제단 Primordial Altar / 핏빛 성역 Crimson Sanctuary / 망각의 묘지 Graveyard of Oblivion / 단죄의 성채 Citadel of Condemnation / 환영의 미궁 Labyrinth of Illusions / 심연의 심장부 Heart of the Abyss
(JA: 沈黙の回廊 / 亡霊の納骨堂 / エーテル鉱脈 / 深淵の亀裂 / 原初の祭壇 / 血塗られた聖域 / 忘却の墓地 / 断罪の城塞 / 幻影の迷宮 / 深淵の心臓部)

그 외 고유명사(몬스터·장비·스킬·NPC 이름)는 기존 번역 파일 `src/i18n/dataLocales.ts` 를 우선 참고하고, 없으면 의미 번역(EN) / 한자·가타카나(JA)로 일관되게 작성. 같은 청크 안에서 같은 이름은 같게.
