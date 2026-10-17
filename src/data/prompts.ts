export interface PromptData {
  title: string;
  themeColor: number;
  themeColorHex: string;
  accentColorHex: string;
  prompt: string;
  negativePrompt: string;
  description: string;
}

export const MASTER_STYLE_MODIFIERS =
  'anime style, dark fantasy anime aesthetic, magitech style, highly detailed anime illustration, clean sharp lineart, soft cel shading, vibrant cinematic lighting, soft pastel color palette, high contrast highlights, masterpiece, 8k resolution';

export const MASTER_NEGATIVE_PROMPT =
  'lowres, bad anatomy, bad hands, blurry, dark messy shading, 3d render, photorealistic, deformed limbs, watermark, signature, ugly face, cropped';

export const PROMPT_REGISTRY: Record<string, PromptData> = {
  // --- 영지 건물 ---
  'citadel_bonfire': {
    title: '모닥불 (Ancient Bonfire)',
    themeColor: 0xff7b25,
    themeColorHex: '#ff7b25',
    accentColorHex: '#ffa94d',
    prompt: `a solitary warm bonfire burning softly on the stone terrace of a ruined floating ark fortress, gentle blue night sky with floating starlight particles in the background, anime background art, dark fantasy anime aesthetic, magitech style, cozy yet melancholic atmosphere, sharp cel shading, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 어둠 속에서 피어오른 마지막 인류의 불씨. 생존자들의 모임터.'
  },
  'citadel_cabin': {
    title: '피난민 오두막 (Refugee Shelters)',
    themeColor: 0x8d6e63,
    themeColorHex: '#8d6e63',
    accentColorHex: '#bcaaa4',
    prompt: `wooden modular refugee shelters and cozy illuminated tents built atop ancient citadel ruins, lanterns glowing warmly, anime scenery, dark fantasy anime aesthetic, magitech style, clean sci-fi fantasy architecture, calm twilight sky, detailed lineart, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '흑무를 피해 모여든 생존자들이 머무는 거처. 인구와 일꾼의 기반.'
  },
  'citadel_tavern': {
    title: '황혼의 주점 (Twilight Tavern)',
    themeColor: 0xffb74d,
    themeColorHex: '#ffb74d',
    accentColorHex: '#ffe082',
    prompt: `warm cozy fantasy pub interior with neon signs and glowing wooden bar, anime tavern scene, dark fantasy anime aesthetic, magitech style, mugs and tactical blueprint maps on counter, soft atmospheric lighting, highly detailed, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '방랑하는 실력파 용병들이 모여 정보를 나누고 계약을 맺는 주점.'
  },
  'citadel_blacksmith': {
    title: '마도 대장간 (Magitech Forge)',
    themeColor: 0xc8aa6e,
    themeColorHex: '#c8aa6e',
    accentColorHex: '#80e5ff',
    prompt: `sci-fi fantasy forge with blue glowing mana furnace, anvils and tactical weapon racks, floating holographic blueprints, anime style forge, dark fantasy anime aesthetic, magitech style, sparks flying, high contrast clean lighting, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '고대 에테르를 주입하여 전술 무기와 방어구를 단조하는 대장간.'
  },
  'citadel_sanctuary': {
    title: '영혼의 성소 (Sanctuary of Transcendence)',
    themeColor: 0xab47bc,
    themeColorHex: '#ab47bc',
    accentColorHex: '#e1bee7',
    prompt: `glorious ancient cathedral altar bathed in divine celestial beam of purple and gold light, floating stained-glass fragments, anime holy ground, dark fantasy anime aesthetic, magitech style, celestial light particles, breathtaking perspective, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '용병들이 내면의 한계를 깨고 1차, 2차 상위 직업으로 각성하는 성소.'
  },
  'citadel_arena': {
    title: '차원 아레나 (Dimensional Coliseum)',
    themeColor: 0xff416c,
    themeColorHex: '#ff416c',
    accentColorHex: '#ff8a80',
    prompt: `grand celestial coliseum floating above clouds with crimson holographic banners, floating battle arena podiums, anime tournament stage, dark fantasy anime aesthetic, magitech style, energetic epic mood, cinematic lighting, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '다른 세계선 지휘관들의 용병단과 무력을 겨루는 명예의 전당.'
  },

  // --- 6대 기본 직업 & 1·2차 전직 클래스 ---
  // 1. 기사 계열
  'hero_squire': {
    title: '견습 기사 (Squire)',
    themeColor: 0x4a90e2,
    themeColorHex: '#4a90e2',
    accentColorHex: '#90caf9',
    prompt: `1girl, solo, novice knight trainee in clean silver tactical light armor, short navy hair, determined bright blue eyes, holding training broadsword and buckler, anime portrait, dark fantasy anime aesthetic, magitech style, crisp cel shading, ethereal runic aura, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '단단한 결의로 최전선을 지키는 견습 수호자.'
  },
  'hero_paladin': {
    title: '1차-A: 성기사 (Paladin)',
    themeColor: 0xffd54f,
    themeColorHex: '#ffd54f',
    accentColorHex: '#fff59d',
    prompt: `1girl, solo, holy knight paladin in white and gold ceramic armor with glowing crosses, long blonde ponytail, blue eyes, carrying a massive holy shield and luminous warhammer, divine aura, anime style, dark fantasy anime aesthetic, magitech style, dynamic lighting, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '신성한 에테르 방벽으로 아군을 보호하고 언데드를 정화하는 성기사.'
  },
  'hero_guardian': {
    title: '1차-B: 중장 보병 (Guardian)',
    themeColor: 0x546e7a,
    themeColorHex: '#546e7a',
    accentColorHex: '#90a4ae',
    prompt: `1girl, solo, heavy armor guardian with colossal tower shield and heavy spear, reinforced visor helmet, stoic expression, metallic blue armor plates, anime style, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '어떤 충격도 흡수하는 최전방 결전 방벽.'
  },
  'hero_valkyrie': {
    title: '2차 최종: 발키리 (Aegis Valkyrie)',
    themeColor: 0xffeb3b,
    themeColorHex: '#ffeb3b',
    accentColorHex: '#ffffff',
    prompt: `1girl, solo, ultimate holy valkyrie commander, pristine high-tech radiant white plate armor with floating gold runic rings, luminous translucent light wings, holding divine crystal spear and massive prism tower shield, majestic pose, anime masterpiece, dark fantasy anime aesthetic, magitech style, sharp focus, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 어둠마저 꿰뚫는 불멸의 수호 성녀. 아군 전체 무적 결계 부여.'
  },

  // 2. 도적 계열
  'hero_rogue': {
    title: '그림자 수련생 (Rogue)',
    themeColor: 0x26a69a,
    themeColorHex: '#26a69a',
    accentColorHex: '#80cbc4',
    prompt: `1girl, solo, nimble assassin trainee in dark teal tactical jacket and scarf, twin daggers, short black bob hair with cyan mesh, sly smile, anime character portrait, dark fantasy anime aesthetic, magitech style, subtle neon accents, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '민첩한 몸놀림으로 적의 급소를 찌르고 함정을 해제하는 척후.'
  },
  'hero_assassin': {
    title: '1차-A: 암살자 (Assassin)',
    themeColor: 0x00897b,
    themeColorHex: '#00897b',
    accentColorHex: '#4db6ac',
    prompt: `1girl, solo, lethal shadow assassin in sleek midnight stealth bodysuit with glowing cyber daggers, glowing purple visor, dynamic combat pose, anime illustration, dark fantasy anime aesthetic, magitech style, clean lines, shadow particle effects, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '그림자 속에 숨어 치명적인 연속 공격을 가하는 암살 전문가.'
  },
  'hero_shadow_phantom': {
    title: '2차 최종: 그림자 망령 (Shadow Phantom)',
    themeColor: 0x1de9b6,
    themeColorHex: '#1de9b6',
    accentColorHex: '#a7ffeb',
    prompt: `1girl, solo, master phantom assassin surrounded by dark cyan spatial clones, dual plasma katanas, long flowing dual-tone hair, glowing tactical runic circle, extreme speed blur effects, anime masterpiece, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '시공간의 잔상을 남기며 후열의 적을 단숨에 베어 넘기는 전장의 유령.'
  },

  // 3. 원소 학도 계열
  'hero_apprentice': {
    title: '원소 학도 (Apprentice)',
    themeColor: 0xab47bc,
    themeColorHex: '#ab47bc',
    accentColorHex: '#ce93d8',
    prompt: `1girl, solo, cute mage academy student in oversized modern magic robe with school emblem, twin tails purple hair, holding antique staff with levitating blue crystal, curious expression, anime portrait, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '에테르의 원소 흐름을 조율하여 강력한 마법을 영창하는 마도 학도.'
  },
  'hero_elementalist': {
    title: '1차-A: 대마도사 (Elementalist)',
    themeColor: 0xba68c8,
    themeColorHex: '#ba68c8',
    accentColorHex: '#e1bee7',
    prompt: `1girl, solo, powerful elemental sorceress wielding swirling fire and ice runes simultaneously, modern sleek academy coat, floating geometric magic circle, confident gaze, anime style, dark fantasy anime aesthetic, magitech style, rich effects, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '화염과 빙결, 번개의 상호작용으로 적 진형을 초토화하는 광역 딜러.'
  },
  'hero_calamity_mage': {
    title: '2차 최종: 아크 메이지 (Calamity Mage)',
    themeColor: 0x7c4dff,
    themeColorHex: '#7c4dff',
    accentColorHex: '#b388ff',
    prompt: `1girl, solo, supreme archmage orchestrating a celestial meteor storm, cosmic purple robe with tactical straps, complex glowing mana circles orbiting hands, majestic arcane circle, anime masterpiece, dark fantasy anime aesthetic, magitech style, vibrant colors, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '차원의 붕괴 에너지를 응축시켜 전장을 소멸시키는 궁극의 마도 지배자.'
  },

  // 4. 사제 계열
  'hero_acolyte': {
    title: '견습 사제 (Acolyte)',
    themeColor: 0x42a5f5,
    themeColorHex: '#42a5f5',
    accentColorHex: '#90caf9',
    prompt: `1girl, solo, gentle young shrine maiden priestess with white beret and holy medical bag, holding a prayer bell, warm kind smile, green eyes, anime style portrait, dark fantasy anime aesthetic, magitech style, soft lighting, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '상처 입은 동료들의 체력을 회복시키고 정신을 안정시키는 사제.'
  },
  'hero_high_saintess': {
    title: '2차 최종: 성령의 구원자 (High Saintess)',
    themeColor: 0x29b6f6,
    themeColorHex: '#29b6f6',
    accentColorHex: '#e1f5fe',
    prompt: `1girl, solo, high grand saintess floating in divine celestial aurora, ornate white and cyan ceremonial robes, majestic triple celestial ring aura, holding an overflowing chalice of resurrection light, serene expression, anime masterpiece, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '전멸 위기의 파티를 부활시키고 끊임없는 생명력을 주입하는 성녀.'
  },

  // 5. [NEW] 용병 검사 계열
  'hero_vanguard': {
    title: '용병 검사 (Vanguard)',
    themeColor: 0xe65100,
    themeColorHex: '#e65100',
    accentColorHex: '#ffb74d',
    prompt: `1girl, solo, fierce mercenary vanguard swordswoman, sleeveless tactical armor, bandage wraps on arms, wielding a heavy buster greatsword on shoulder, spiky crimson-red ponytail, fierce golden eyes, confident grin, anime portrait, dark fantasy anime style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '전열을 단숨에 돌파하여 적의 진형을 부수는 강력한 근접 전사.'
  },
  'hero_berserker': {
    title: '1차-A: 광전사 (Berserker)',
    themeColor: 0xd84315,
    themeColorHex: '#d84315',
    accentColorHex: '#ff8a65',
    prompt: `1girl, solo, berserker warrior engulfed in dark red aura, dual heavy battle axes, battle scars, glowing crimson halo, blood-red eye glow, ferocious combat pose, anime style, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '자신의 피를 태워 상상을 초월하는 파괴력을 뿜어내는 광전사.'
  },
  'hero_valhalla_blade': {
    title: '2차 최종: 발할라 블레이드 (Valhalla Blade)',
    themeColor: 0xff3d00,
    themeColorHex: '#ff3d00',
    accentColorHex: '#ff9e80',
    prompt: `1girl, solo, supreme valhalla warlord wielding colossal flaming greatsword, divine crimson and black runic armor with burning wings of flame, majestic glowing crown, unyielding gaze, epic anime masterpiece, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '체력이 낮을수록 공격력이 최대 600% 증폭되는 불멸의 결전 전신.'
  },

  // 6. [NEW] 마총 수련생 계열
  'hero_gunner': {
    title: '마총 수련생 (Gunner)',
    themeColor: 0x00bcd4,
    themeColorHex: '#c8aa6e',
    accentColorHex: '#80deea',
    prompt: `1girl, solo, tactical aether gunslinger academy student, short silver hair, wearing high-tech visor and stylish trench coat, dual energy pistols, aiming forward with focused calm expression, cyan floating targeting reticle, dark fantasy anime style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '원거리에서 마도 탄환으로 적의 급소와 약점을 저격하는 원거리 사수.'
  },
  'hero_tactical_gunner': {
    title: '1차-A: 전술 포수 (Tactical Gunner)',
    themeColor: 0x0097a7,
    themeColorHex: '#0097a7',
    accentColorHex: '#4dd0e1',
    prompt: `1girl, solo, tactical heavy gunner with high-tech anti-materiel plasma rifle, tactical headset and holographic ammo HUD, kneeling sniper pose, anime illustration, dark fantasy anime aesthetic, magitech style, clean crisp lineart, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '적의 방어구를 관통하고 전술 폭격을 가하는 원거리 지원 전문가.'
  },
  'hero_aether_meister': {
    title: '2차 최종: 하이퍼 레인저 (Aether Gun Meister)',
    themeColor: 0xc8aa6e,
    themeColorHex: '#c8aa6e',
    accentColorHex: '#ffffff',
    prompt: `1girl, solo, legendary aether gun meister floating surrounded by multi-lock floating laser bit drones and massive orbital beam cannon, sleek white and cyan cybernetic suit, magnificent dual aether wings, anime masterpiece, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '시공간을 관통하는 궤도 빔 포격으로 적의 모든 방어를 분쇄하는 궁극의 사수.'
  },

  // 던전 및 몬스터
  'dungeon_limbo_gate': {
    title: '심연 1구역: 침묵의 회랑 (Silent Corridor)',
    themeColor: 0x5c6bc0,
    themeColorHex: '#5c6bc0',
    accentColorHex: '#9fa8da',
    prompt: `scenery, dark subterranean gothic cathedral hallway submerged in glowing cyan mist, ancient cracked stone statues, floating ominous sigils, anime dungeon concept art, dark fantasy anime aesthetic, magitech style background, eerie yet beautiful, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '버려진 고대 문명의 지하 통로. 짙은 안개 속에서 괴물들의 신음이 울린다.'
  },
  'monster_stalker': {
    title: '공허의 잠복자 (Void Stalker)',
    themeColor: 0xef5350,
    themeColorHex: '#ef5350',
    accentColorHex: '#ff8a80',
    prompt: `a menacing shadowy chimera beast with glowing violet crystalline horns and blade-like claws, anime monster illustration, dark fantasy boss style, dynamic battle stance, red eye trail, dark fantasy, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '흑무 속에서 태어난 변이체. 어둠 속에서 불시에 기습하여 치명타를 입힌다.'
  },
  'monster_dread_knight': {
    title: '심연의 망령 기사 (Phantom Dread Knight)',
    themeColor: 0xab47bc,
    themeColorHex: '#ab47bc',
    accentColorHex: '#e1bee7',
    prompt: `an imposing fallen ghostly dread knight in battered dark obsidian plate armor, glowing purple ethereal eyes behind iron visor, holding cursed greatsword and cracked tower shield, floating soul flames, anime illustration, dark fantasy boss aesthetic, epic dark fantasy, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '타락한 고대 성채 수호 기사. 단단한 판금 방벽과 저주받은 대검을 휘두른다.'
  },
  'monster_void_overlord': {
    title: '공허의 침식자 (Void Overlord)',
    themeColor: 0xff416c,
    themeColorHex: '#ff416c',
    accentColorHex: '#ff8a80',
    prompt: `colossal apocalyptic void overlord chimera towering over floating broken ancient gothic cathedral ruins, glowing multiple violet eye trails, dark energy crystal horns and obsidian tentacles, swirling crimson and purple spatial void storms, clean sharp anime lineart, cinematic dramatic lighting, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: 'Chapter 1 심연의 근원. 거대한 공허 촉수와 파멸의 에너지 폭풍을 조종하는 지배자.'
  },
  // --- 신규 마물 및 층별 고유 보스 ---
  'monster_tomb_banshee': {
    title: '납골당 묘지 밴시 (Tomb Banshee)',
    themeColor: 0x80deea,
    themeColorHex: '#80deea',
    accentColorHex: '#b2ebf2',
    prompt: `Dark fantasy anime style, eerie ghostly banshee spirit floating above ancient stone tombs in gothic crypt, glowing ethereal cyan aura, translucent veil, misty cemetery atmosphere, dark fantasy anime aesthetic, magitech style, highly detailed lineart, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '납골당의 묘비를 떠도는 원혼. 차가운 비탄의 절규로 파티의 마나를 메마르게 한다.'
  },
  'monster_crypt_ghoul': {
    title: '살점을 뜯는 구울 (Crypt Ghoul)',
    themeColor: 0x8d6e63,
    themeColorHex: '#8d6e63',
    accentColorHex: '#bcaaa4',
    prompt: `Dark fantasy anime style, ferocious feral crypt ghoul with sharp bone claws and glowing red eyes, crouching in dark dungeon catacombs, decayed tattered bandages, dark fantasy anime aesthetic, magitech style, high contrast shadows, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '어둠 속에서 시체를 파먹고 자란 흉폭한 구울. 강력한 턱과 출혈 공격을 가한다.'
  },
  'monster_crystal_scorpion': {
    title: '마도 수정 전갈 (Crystal Scorpion)',
    themeColor: 0x26c6da,
    themeColorHex: '#26c6da',
    accentColorHex: '#80deea',
    prompt: `Dark fantasy anime style, giant crystalline scorpion with glowing cyan gemstone carapace and sharp glowing mana stinger, underground crystal cavern setting, glowing mineral veins, dark fantasy anime aesthetic, magitech style, detailed digital art, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '광맥의 고농도 에테르가 응축된 푸른 수정 외피를 지닌 전갈. 강력한 독침으로 적을 마비시킨다.'
  },
  'monster_mana_gargoyle': {
    title: '마력 침식 가고일 (Mana Gargoyle)',
    themeColor: 0x4dd0e1,
    themeColorHex: '#4dd0e1',
    accentColorHex: '#b2ebf2',
    prompt: `Dark fantasy anime style, winged stone gargoyle infused with glowing blue aether lines on body, perched on cavern stalactite, sharp stone talons, cinematic dramatic lighting, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '석재 조각상에 에테르 마력이 스며들어 깨어난 비행 가고일. 고속으로 급강하하여 후열을 노린다.'
  },
  'monster_rift_stalker': {
    title: '균열의 차원 추적자 (Rift Stalker)',
    themeColor: 0xba68c8,
    themeColorHex: '#ba68c8',
    accentColorHex: '#e1bee7',
    prompt: `Dark fantasy anime style, sleek eldritch panther-like beast emerging from glowing purple spatial dimensional rifts, floating cosmic tentacles, glowing eyes, dark void background, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '시공간의 틈새를 자유자재로 넘나드는 차원 포식자. 방어력을 관통하는 기습 일격을 가한다.'
  },
  'monster_void_beast': {
    title: '공허의 하수인 촉수괴수 (Void Tendril Devourer)',
    themeColor: 0x7e57c2,
    themeColorHex: '#7e57c2',
    accentColorHex: '#d1c4e9',
    prompt: `Dark fantasy anime style, cosmic horror void beast with multiple glowing yellow eyes and massive writhing dark purple tentacles, abyssal mist, dark fantasy anime aesthetic, magitech style, cinematic framing, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 어둠 속에서 꿈틀거리는 다수의 촉수를 지닌 거대 마물. 광역 출혈과 자가 재생을 구사한다.'
  },
  'monster_altar_cultist': {
    title: '종언의 제단 광신도 (Altar Zealot Cultist)',
    themeColor: 0xe91e63,
    themeColorHex: '#e91e63',
    accentColorHex: '#f48fb1',
    prompt: `Dark fantasy anime style, sinister cultist priest in dark hooded robes adorned with glowing crimson sigils, holding an ornate dark staff, ritual altar under blood moon sky, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '공허의 침식자를 숭배하며 제단을 수호하는 타락한 사제. 파괴적인 흑염 마법을 퍼붓는다.'
  },
  'monster_monolith_guardian': {
    title: '모노리스 파멸 수호자 (Monolith Sentinel)',
    themeColor: 0xff7043,
    themeColorHex: '#ff7043',
    accentColorHex: '#ffab91',
    prompt: `Dark fantasy anime style, colossal monolith stone golem guardian carved with glowing red ancient runes, wielding a heavy stone mace, epic ancient arena background, dark fantasy anime aesthetic, magitech style, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '고대 모노리스의 파편으로 기동하는 거대한 골렘. 철벽의 방패와 무거운 석퇴로 침입자를 짓밟는다.'
  },
  'boss_floor_1': {
    title: '1F 보스: 침묵의 흑핵 거신 (Silent Colossus Golem)',
    themeColor: 0x5c6bc0,
    themeColorHex: '#5c6bc0',
    accentColorHex: '#9fa8da',
    prompt: `Dark fantasy anime boss concept art, towering ancient stone titan golem with a glowing dark blue core pulsing in chest, cold frost mist emanating from body, ruined silent corridor arena, dark fantasy anime aesthetic, magitech style, epic cinematic scale, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '침묵의 회랑 심부에 잠들어 있던 고대 석조 거신. 가슴의 흑핵에서 뿜어져 나오는 한기로 침입자를 얼어붙게 한다.'
  },
  'boss_floor_2': {
    title: '2F 보스: 망령 군주 데스나이트 (Wraith Lord Death Knight)',
    themeColor: 0x78909c,
    themeColorHex: '#78909c',
    accentColorHex: '#b0bec5',
    prompt: `Dark fantasy anime boss concept art, imposing undead death knight in gothic ornate silver and black armor, glowing spectral blue flame cape, holding a massive dark broadsword, misty crypt throne background, dark fantasy anime aesthetic, magitech style, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '납골당의 무수한 원혼을 통솔하는 망령들의 군주. 영혼을 베어넘기는 저주받은 대검을 휘두른다.'
  },
  'boss_floor_3': {
    title: '3F 보스: 태고의 광맥 베히모스 (Primeval Vein Behemoth)',
    themeColor: 0x00bcd4,
    themeColorHex: '#c8aa6e',
    accentColorHex: '#80deea',
    prompt: `Dark fantasy anime boss concept art, gigantic mythical crystal dragon behemoth with glowing magma and cyan aether veins across obsidian scales, underground glowing mineral cave, dark fantasy anime aesthetic, magitech style, epic perspective, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '에테르 광맥 깊은 곳에서 결정을 먹고 자란 태고의 마도 생명체. 폭발적인 광맥 에너지를 방출한다.'
  },
  'boss_floor_4': {
    title: '4F 보스: 심연의 시공 왜곡자 (Chrono Rift Weaver)',
    themeColor: 0xab47bc,
    themeColorHex: '#ab47bc',
    accentColorHex: '#ce93d8',
    prompt: `Dark fantasy anime boss concept art, floating eldritch dimensional sorcerer in cosmic robes surrounded by floating clockwork dimensional anchors and swirling purple spatial rifts, dark abyss background, dark fantasy anime aesthetic, magitech style, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 균열을 조작하여 시공간을 뒤틀어버리는 고대 차원 마도사. 시간의 흐름을 왜곡하여 공격을 무력화한다.'
  },

  // --- 6층 ~ 10층 마물 ---
  'monster_blood_wolf': {
    title: '핏빛 늑대',
    themeColor: 0xd32f2f,
    themeColorHex: '#d32f2f',
    accentColorHex: '#ff5252',
    prompt: `a terrifying large red wolf monster with glowing crimson eyes, sharp fangs dripping with blood, dark fantasy setting, shadowy forest background, anime style, highly detailed illustration, sharp cel shading`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '피에 굶주린 붉은 털의 늑대 마물.'
  },
  'monster_fallen_priest': {
    title: '타락한 사제',
    themeColor: 0x512da8,
    themeColorHex: '#512da8',
    accentColorHex: '#7e57c2',
    prompt: `a corrupted priest in tattered dark purple robes holding a twisted glowing staff, emitting dark aura, ruined church interior background, anime style, highly detailed, cinematic lighting`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 마력에 타락해버린 옛 성역의 사제.'
  },
  'monster_oblivion_ghost': {
    title: '망각의 악령',
    themeColor: 0x455a64,
    themeColorHex: '#455a64',
    accentColorHex: '#78909c',
    prompt: `a translucent terrifying ghost made of pale blue mist, floating in a dark graveyard, glowing hollow eyes, ethereal aura, anime style, dark fantasy, highly detailed`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '잊혀진 자들의 원념이 뭉쳐 만들어진 악령.'
  },
  'monster_bone_golem': {
    title: '뼈 골렘',
    themeColor: 0x8d6e63,
    themeColorHex: '#8d6e63',
    accentColorHex: '#bcaaa4',
    prompt: `a massive golem constructed entirely of human and monster bones, glowing purple core in its chest, towering and intimidating, catacombs background, dark fantasy anime style, highly detailed`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '수많은 뼈무더기가 거대한 마력으로 뭉쳐져 기동하는 골렘.'
  },
  'monster_fallen_paladin': {
    title: '타락한 기사',
    themeColor: 0x263238,
    themeColorHex: '#263238',
    accentColorHex: '#546e7a',
    prompt: `a corrupted paladin in heavy black and silver armor, wielding a massive dark greatsword, glowing red visor, standing in a ruined citadel, dark fantasy anime style, dynamic pose`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '신성한 맹세를 잃고 심연의 앞잡이가 된 중무장 기사.'
  },
  'monster_inquisitor': {
    title: '이단 심문관',
    themeColor: 0xb71c1c,
    themeColorHex: '#b71c1c',
    accentColorHex: '#e53935',
    prompt: `a sinister inquisitor wearing a red and gold executioner mask, wielding a flaming whip, dark dungeon background with chains, cruel and intimidating, anime style, masterpiece`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '비뚤어진 신앙심으로 무장한 이단 심문관.'
  },
  'monster_mirror_phantom': {
    title: '거울의 환영',
    themeColor: 0x00bcd4,
    themeColorHex: '#c8aa6e',
    accentColorHex: '#4dd0e1',
    prompt: `a surreal humanoid phantom made of shattered glass and mirrors, reflecting distorted light, floating in a surreal void space, ethereal and dangerous, anime style, highly detailed, masterpiece`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '미궁의 거울 속에서 튀어나온 환영.'
  },
  'monster_abyssal_fiend': {
    title: '심연의 악마',
    themeColor: 0xc62828,
    themeColorHex: '#c62828',
    accentColorHex: '#ef5350',
    prompt: `a terrifying abyssal demon with massive bat-like wings, curved horns, glowing magma-like skin, wielding a fiery whip, deep hellish cavern background, anime style, epic fantasy, 8k resolution`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 심층부에서 솟아난 악마.'
  },
  'monster_void_stalker': {
    title: '공허의 추적자',
    themeColor: 0x4a148c,
    themeColorHex: '#4a148c',
    accentColorHex: '#7b1fa2',
    prompt: `a sleek stealthy void monster with multiple glowing purple eyes, shadowy tendrils, lurking in absolute darkness, dark fantasy anime style, menacing atmosphere`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '어둠 속에서 먹잇감을 노리는 공허의 암살자.'
  },
  'monster_abyssal_behemoth': {
    title: '심연의 베헤모스',
    themeColor: 0x3e2723,
    themeColorHex: '#3e2723',
    accentColorHex: '#5d4037',
    prompt: `a colossal terrifying behemoth monster, muscular and hulking, rocky dark skin with glowing red cracks, roaring, destroying a cavern, dark fantasy anime style, epic scale`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 밑바닥을 배회하는 거대한 마수.'
  },

  // --- 6층 ~ 10층 고유 보스 ---
  'boss_floor_6': {
    title: '6F 보스: 핏빛 대공 (Blood Archduke)',
    themeColor: 0xd32f2f,
    themeColorHex: '#d32f2f',
    accentColorHex: '#ef5350',
    prompt: `imposing vampire blood archduke boss with massive leathery bat wings and ornate crimson noble armor, glowing crimson eyes, dark gothic cathedral throne room drenched in crimson moonlight, swirling blood magic orbs, anime style, dark fantasy anime aesthetic, magitech style, highly detailed anime illustration, clean sharp lineart, soft cel shading, vibrant cinematic lighting, masterpiece, 8k resolution`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '핏빛 성역의 지배자. 거대한 박쥐 날개와 피의 마법으로 침입자의 생명력을 흡수합니다.'
  },
  'boss_floor_7': {
    title: '7F 보스: 망각의 묘지기 (Oblivion Gravedigger)',
    themeColor: 0x5c6bc0,
    themeColorHex: '#5c6bc0',
    accentColorHex: '#7986cb',
    prompt: `imposing grim reaper oblivion gravedigger boss in dark hooded shroud and ornate indigo armor, wielding a colossal spectral soul-harvesting scythe that glows with ethereal cyan flame runes, standing atop an ancient ruined stone graveyard altar under eerie moon, anime style, dark fantasy anime aesthetic, magitech style, highly detailed anime illustration, clean sharp lineart, soft cel shading, vibrant cinematic lighting, masterpiece, 8k resolution`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '망각의 묘역을 수호하는 죽음의 묘지기. 거대한 영혼의 낫으로 산 자의 생명을 수확합니다.'
  },
  'boss_floor_8': {
    title: '8F 보스: 타락한 기사단장 (Fallen Grand Commander)',
    themeColor: 0x37474f,
    themeColorHex: '#37474f',
    accentColorHex: '#546e7a',
    prompt: `legendary corrupted grandmaster crusade commander boss in colossal gold-trimmed black gothic armor, long flowing crimson cape, holding a massive two-handed dark runic claymore planted into the ground, surrounded by a glowing dark holy sanctuary barrier, fiery fortress ramparts background, anime style, dark fantasy anime aesthetic, magitech style, highly detailed anime illustration, clean sharp lineart, soft cel shading, vibrant cinematic lighting, masterpiece, 8k resolution`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '단죄의 요새를 통솔하던 전설적인 기사단장. 타락한 성역 결계와 무자비한 심판의 검을 휘두릅니다.'
  },
  'boss_floor_9': {
    title: '9F 보스: 미궁의 지배자 (Labyrinth Master Archmage)',
    themeColor: 0x0288d1,
    themeColorHex: '#0288d1',
    accentColorHex: '#29b6f6',
    prompt: `an enigmatic archmage labyrinth master boss in iridescent starry celestial robes, surrounded by towering floating dimensional mirror portals reflecting cosmic galaxies, holding a glowing crystalline prism staff that distorts space-time, kaleidoscopic geometric dungeon background, anime style, dark fantasy anime aesthetic, magitech style, highly detailed anime illustration, clean sharp lineart, soft cel shading, vibrant cinematic lighting, masterpiece, 8k resolution`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '환영의 미궁 중심에서 차원 공간을 뒤틀어놓는 환각의 대마도사. 수많은 거울 파편으로 전장을 유린합니다.'
  },
  'boss_floor_10': {
    title: '10F 보스: 심연의 군주 아스모데우스 (Abyssal Overlord Asmodeus)',
    themeColor: 0xb71c1c,
    themeColorHex: '#b71c1c',
    accentColorHex: '#e53935',
    prompt: `supreme apocalyptic void demon lord Asmodeus boss towering at the core of the abyss, colossal dark draconic wings, crowned with jagged dark energy horns, glowing crimson cataclysmic aura, multiple floating dark matter orbs, swirling spatial vortex background, anime style, dark fantasy anime aesthetic, magitech style, highly detailed anime illustration, clean sharp lineart, soft cel shading, vibrant cinematic lighting, masterpiece, 8k resolution`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 심장부에 군림하는 궁극의 공허 군주. 차원 전체를 멸망시킬 종말의 숨결을 내뿜습니다.'
  },

  // --- 2층 ~ 10층 신규 특화 마물 (2F ~ 10F New Monsters) ---
  'monster_crypt_necromancer': {
    title: '납골당 사령술사 (Crypt Necromancer)',
    themeColor: 0x7e57c2,
    themeColorHex: '#7e57c2',
    accentColorHex: '#b39ddb',
    prompt: `Dark fantasy anime style, sinister undead crypt necromancer floating above ancient catacomb coffins, draped in tattered obsidian burial robes, skull mask glowing with eerie cyan ghostfire, holding a floating necrotic lantern summoning wailing spectral souls, atmospheric dim crypt lighting, magitech style, clean sharp lineart, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '납골당의 원혼들을 부리며 망자를 조종하는 사령술사. 저주와 사령 마법으로 아군을 괴롭힙니다.'
  },
  'monster_aether_basilisk': {
    title: '에테르 바실리스크 (Aether Basilisk)',
    themeColor: 0xc8aa6e,
    themeColorHex: '#c8aa6e',
    accentColorHex: '#84ffff',
    prompt: `Dark fantasy anime style, serpentine aether basilisk coiled around massive glowing cyan crystal spires, iridescent crystalline reptilian scales reflecting magical light, piercing glowing amber eyes with petrifying glare, subterranean crystal cavern filled with luminous mana fog, sharp cel shading, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '에테르 광맥의 결정을 흡수하여 자란 마수. 석화의 시선과 수정 비늘 파편으로 적을 압박합니다.'
  },
  'monster_dimension_eater': {
    title: '차원 포식체 (Dimension Devourer)',
    themeColor: 0x9c27b0,
    themeColorHex: '#9c27b0',
    accentColorHex: '#ce93d8',
    prompt: `Dark fantasy anime style, cosmic eldritch dimensional devourer floating in shattered purple spacetime rift, floating geometric clockwork plates and dark purple cosmic vortex body, glowing void core pulsing with dimensional anomalies, floating shattered debris, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 균열에서 시공간을 집어삼키는 차원 괴수. 공간을 왜곡하여 진형을 붕괴시킵니다.'
  },
  'monster_primordial_shaman': {
    title: '원초의 주술사 (Primordial Void Shaman)',
    themeColor: 0xd81b60,
    themeColorHex: '#d81b60',
    accentColorHex: '#f48fb1',
    prompt: `Dark fantasy anime style, primordial void shaman hovering before an ancient black basalt altar, ritual mask carved from demon bone, draped in crimson ceremonial robes, casting dark blood flame hexes from floating sacrificial totems, starry cosmic void sky background, sharp cel shading, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '원초의 제단에서 금단의 의식을 주재하는 고위 주술사. 혈염과 저주로 침입자를 제물로 바칩니다.'
  },
  'monster_crimson_vampire': {
    title: '진홍의 흡혈귀 (Crimson Vampire Noble)',
    themeColor: 0xb71c1c,
    themeColorHex: '#b71c1c',
    accentColorHex: '#ef5350',
    prompt: `Dark fantasy anime style, aristocratic crimson vampire noble standing in a gothic cathedral ruin bathed in blood-red moonlight, flowing dark crimson cape, sharp fangs and glowing ruby eyes, holding an ornate blood chalice, fluttering shadow bats in background, magitech style, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '핏빛 성역의 귀족 흡혈귀. 치명적인 흡혈과 박쥐 떼 환영으로 전장을 유린합니다.'
  },
  'monster_grave_specter': {
    title: '무덤의 망령 기사 (Grave Specter Knight)',
    themeColor: 0x5c6bc0,
    themeColorHex: '#5c6bc0',
    accentColorHex: '#9fa8da',
    prompt: `Dark fantasy anime style, haunting ghostly grave knight encased in rusted gothic plate armor with ethereal cyan flames bursting from visor, wielding a chipped rusted greatsword engulfed in soul fire, ruined foggy cemetery with cracked tombstones, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '망각의 묘지를 지키는 유령 기사. 원혼의 한기와 영혼을 베는 녹슨 대검을 휘두릅니다.'
  },
  'monster_iron_torturer': {
    title: '단죄의 고문관 (Iron Torturer)',
    themeColor: 0xd84315,
    themeColorHex: '#d84315',
    accentColorHex: '#ff8a65',
    prompt: `Dark fantasy anime style, menacing iron torturer executioner clad in spiked black iron armor and iron cage mask, wielding red-hot glowing torture chains and a barbed executioner flail, dark stone fortress torture chamber lit by burning braziers, cinematic lighting, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '단죄의 성채에서 죄인을 처형하던 잔혹한 집행자. 붉게 달아오른 사슬과 철퇴로 적을 파쇄합니다.'
  },
  'monster_prism_weaver': {
    title: '프리즘 방직사 (Prism Illusion Weaver)',
    themeColor: 0x00bcd4,
    themeColorHex: '#c8aa6e',
    accentColorHex: '#80deea',
    prompt: `Dark fantasy anime style, floating geometric prism weaver entity composed of crystalline mirrors and kaleidoscopic light ribbons, spinning sharp glass shards hovering around it, infinite mirrored labyrinth room refracting vibrant spectral light, surreal sci-fi fantasy, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '환영의 미궁에서 빛과 거울을 엮어내는 마도 생명체. 굴절된 광선과 만화경 환각을 구사합니다.'
  },
  'monster_abyssal_harbinger': {
    title: '심연의 전조자 (Abyssal Harbinger)',
    themeColor: 0x880e4f,
    themeColorHex: '#880e4f',
    accentColorHex: '#f06292',
    prompt: `Dark fantasy anime style, colossal abyssal harbinger demon hovering at the core of the abyss, massive obsidian horns crackling with dark lightning, six glowing crimson eyes, surrounded by orbiting black holes and floating dark matter runes, swirling apocalyptic vortex background, masterpiece, 8k`,
    negativePrompt: MASTER_NEGATIVE_PROMPT,
    description: '심연의 심장부에서 종말을 예고하는 고위 악마. 공허의 중력 특이점과 멸망의 파멸인을 펼칩니다.'
  }
};

