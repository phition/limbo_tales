export interface CampDialogueLine {
  speakerName: string;
  text: string;
  icon: string;
}

export type CampBanterGenerator = (
  h1: { name: string },
  h2: { name: string },
  h3?: { name: string }
) => CampDialogueLine[];

export type WelcomeDialogueGenerator = (
  vet1: { name: string },
  vet2: { name: string },
  isolated: { name: string }
) => CampDialogueLine[];

export type FrictionDialogueGenerator = (
  vet1: { name: string },
  vet2: { name: string },
  isolated: { name: string }
) => CampDialogueLine[];

// ═════════════════════════════════════════════════════════════════════
// 🌟 1. 신입 대원 환영 & 결속 대화 템플릿 (6종)
// ═════════════════════════════════════════════════════════════════════
export const WELCOME_DIALOGUE_GENERATORS: WelcomeDialogueGenerator[] = [
  // 1-1. 따뜻한 스튜 한 그릇
  (v1, v2, iso) => [
    { speakerName: v1.name, text: `${iso.name}, 모닥불 옆으로 더 가까이 와. 여기 따뜻한 스튜 한 그릇 들게.`, icon: '🍲' },
    { speakerName: iso.name, text: `아... 감사합니다. 두 분이 워낙 손발이 잘 맞으셔서 제가 방해가 되진 않을까 걱정했어요.`, icon: '😳' },
    { speakerName: v2.name, text: `무슨 소릴! 심연에선 한 배를 탄 전우야. 등이 든든해졌으니 이제 우리와 호흡을 맞추면 돼!`, icon: '😄' },
    { speakerName: '방주 원정대', text: `기존 대원들의 따뜻한 배려로 [${iso.name}]이(가) 마음의 벽을 허물고 빠르게 녹아듭니다!`, icon: '🤝' },
  ],
  // 1-2. 전투 지원 감사 & 신뢰
  (v1, v2, iso) => [
    { speakerName: v2.name, text: `${iso.name}, 아까 전투에서 뒤를 든든하게 받쳐줘서 고마웠어.`, icon: '✨' },
    { speakerName: iso.name, text: `제가 제 몫을 했는지 모르겠네요... 아직 두 분의 움직임에 따라가기가 벅찹니다.`, icon: '🙇' },
    { speakerName: v1.name, text: `처음엔 누구나 그래. 우린 서로 지켜주며 여기까지 온 거야. 이제 넌 우리의 소중한 동료야.`, icon: '🛡️' },
    { speakerName: '방주 원정대', text: `진솔한 격려와 조언 속에서 [${iso.name}]과의 신뢰와 전우애가 싹틉니다!`, icon: '💖' },
  ],
  // 1-3. 털외투 양보와 온기
  (v1, v2, iso) => [
    { speakerName: v1.name, text: `${iso.name}, 심연의 바닥은 지상보다 훨씬 차가워. 내 털외투를 모포 삼아 어깨에 둘러둬.`, icon: '🧥' },
    { speakerName: iso.name, text: `선배님의 외투를 제가 받아도 될까요...? 정말 따뜻합니다, 감사합니다.`, icon: '🥹' },
    { speakerName: v2.name, text: `사양할 필요 없어! 몸이 얼면 칼자루를 놓치는 법이니까. 푹 쉬고 내일 힘내자!`, icon: '😄' },
    { speakerName: '방주 원정대', text: `세심한 온정 속에서 [${iso.name}]이(가) 원정대의 일원으로서 깊은 안정감을 얻습니다.`, icon: '🔥' },
  ],
  // 1-4. 방패 뒤의 안전한 자리
  (v1, v2, iso) => [
    { speakerName: v2.name, text: `불빛이 가장 잘 드는 안쪽 자리에 앉아. 바깥쪽 바람은 우리가 막아설 테니까.`, icon: '🛡️' },
    { speakerName: iso.name, text: `처음 편성되었을 땐 무서웠는데... 두 분 곁에 있으니 어떤 마물이 나타나도 두렵지 않아요.`, icon: '✨' },
    { speakerName: v1.name, text: `하하! 든든한 각오로군. 네 용기라면 이미 우리 원정대의 훌륭한 날개야.`, icon: '🦅' },
    { speakerName: '방주 원정대', text: `신입 대원의 긴장이 누그러지며 원정대 전체에 끈끈한 유대감이 퍼져나갑니다.`, icon: '🤝' },
  ],
  // 1-5. 첫 탐험의 공포 공감
  (v1, v2, iso) => [
    { speakerName: v1.name, text: `처음 심연에 발을 들였을 땐 나도 칼자루를 쥔 손이 덜덜 떨렸었지.`, icon: '💭' },
    { speakerName: iso.name, text: `정말요? 두 분은 언제나 침착하셔서 태어날 때부터 영웅이신 줄 알았습니다.`, icon: '😳' },
    { speakerName: v2.name, text: `영웅은 무슨! 등을 기댈 동료가 있었기에 두려움을 이겨낸 것뿐이야. 이제 너도 우리와 같아.`, icon: '🌟' },
    { speakerName: '방주 원정대', text: `솔직한 고백과 공감 속에서 세 대원의 마음이 하나로 엮입니다.`, icon: '❤️' },
  ],
  // 1-6. 따뜻한 허브차와 긴장 완화
  (v1, v2, iso) => [
    { speakerName: v2.name, text: `${iso.name}, 모닥불에 진정 효과가 있는 야생 허브차를 우렸어. 한 잔 마셔봐.`, icon: '🍵' },
    { speakerName: iso.name, text: `은은한 향이 너무 좋네요... 곤두섰던 신경이 차분하게 가라앉는 기분입니다.`, icon: '♨️' },
    { speakerName: v1.name, text: `심연에선 몸보다 마음이 먼저 지치는 법이지. 언제든 힘들면 우리에게 말해줘.`, icon: '🤝' },
    { speakerName: '방주 원정대', text: `차 한 잔에 담긴 따스한 배려가 [${iso.name}]의 긴장된 어깨를 포근하게 감싸줍니다.`, icon: '💖' },
  ],
];

// ═════════════════════════════════════════════════════════════════════
// 💔 2. 소외/배척 대화 템플릿 (인덱스별 심리 묘사 다변화)
// ═════════════════════════════════════════════════════════════════════
export const FRICTION_DIALOGUE_GENERATORS: Record<number, FrictionDialogueGenerator[]> = {
  // isolatedIdx === 2 (후열/3번째 대원 소외)
  2: [
    (v1, v2, iso) => [
      { speakerName: v1.name, text: `${v2.name}, 아까 전투에서 그 타이밍은 정말 완벽했어. 손발이 척척 맞는군!`, icon: '🗣️' },
      { speakerName: v2.name, text: `너와 함께 싸울 땐 등을 맡겨도 안심이 되니까. 하하!`, icon: '😄' },
      { speakerName: iso.name, text: `...(둘의 화기애애한 대화에 끼어들지 못하고 조용히 모닥불만 응시한다)`, icon: '😔' },
    ],
    (v1, v2, iso) => [
      { speakerName: v2.name, text: `역시 구관이 명관이야. 지난번 원정 때 호흡 맞췄던 패턴대로 가니 수월하네.`, icon: '💬' },
      { speakerName: v1.name, text: `맞아, 눈빛만 봐도 척이지. 다음 방도 우리 둘이 먼저 치고 들어가자.`, icon: '🗡️' },
      { speakerName: iso.name, text: `...(자신의 칼자루를 어색하게 만지작거리며 깊은 한숨을 내쉰다)`, icon: '🥺' },
    ],
  ],
  // isolatedIdx === 1 (중열/2번째 대원 소외)
  1: [
    (v1, v2, iso) => [
      { speakerName: v1.name, text: `${v2.name}, 오늘 네 활약이 없었다면 위험했을 거야. 역시 믿음직해.`, icon: '🗣️' },
      { speakerName: v2.name, text: `별말씀을요. 우린 수많은 사선을 함께 넘나들었잖아요.`, icon: '✨' },
      { speakerName: iso.name, text: `...(어색한 침묵 속에 찌그러진 투구를 두드리며 말없이 시선을 피한다)`, icon: '😔' },
    ],
    (v1, v2, iso) => [
      { speakerName: v2.name, text: `${v1.name}, 성채 주점에 맡겨둔 술독, 이번 원정 끝나면 개봉해야겠어요!`, icon: '🍻' },
      { speakerName: v1.name, text: `좋지! 그때의 추억을 이야기하며 밤새도록 마셔보자고!`, icon: '😄' },
      { speakerName: iso.name, text: `...(두 사람만의 옛 추억에 소외감을 느끼며 홀로 붕대를 고쳐 맨다)`, icon: '🩹' },
    ],
  ],
  // isolatedIdx === 0 (전열/1번째 대원 소외)
  0: [
    (v1, v2, iso) => [
      { speakerName: v1.name, text: `${v2.name}, 심연을 다 건너면 성채 주점에서 맛있는 술이나 한잔하자고!`, icon: '🍻' },
      { speakerName: v2.name, text: `좋아요! 그때까지 살아남기만 한다면요!`, icon: '😄' },
      { speakerName: iso.name, text: `...(말없이 굳은 표정으로 심연의 어둠만을 경계하고 있다)`, icon: '😔' },
    ],
    (v1, v2, iso) => [
      { speakerName: v2.name, text: `오늘 전리품 정리는 우리 둘이 알아서 맞출 테니 신경 쓰지 마세요.`, icon: '🎒' },
      { speakerName: v1.name, text: `그래, 손발이 맞으니 금방 끝나겠어.`, icon: '✨' },
      { speakerName: iso.name, text: `...(동료들의 대화에서 겉돌며 홀로 모닥불의 타오르는 불씨만 쑤신다)`, icon: '🪵' },
    ],
  ],
};

// ═════════════════════════════════════════════════════════════════════
// 👥 3. 3인 파티 전원 참여 모닥불 앙상블 대화 템플릿 (15종)
// ═════════════════════════════════════════════════════════════════════
export const TRIO_BANTER_GENERATORS: CampBanterGenerator[] = [
  // 3-1. 훈제 고기 꼬치구이 만찬
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `오늘 배급받은 훈제 고기를 나뭇가지에 꿰어 구웠어. 자, 다들 한 꼬치씩 받아.`, icon: '🍖' },
    { speakerName: h2.name, text: `와, 겉은 바삭하고 속은 촉촉하네! 심연에서 먹는 고기 맛이 성채 만찬 부럽지 않아.`, icon: '😋' },
    { speakerName: h3!.name, text: `후후, 불 조절을 제법 잘했군. 든든하게 먹어둬야 다음 층에서도 힘을 쓸 테니까.`, icon: '😄' },
    { speakerName: '방주 원정대', text: `타닥거리는 장작 소리와 함께 따스한 식사를 나누며 화기애애한 온기가 돕니다.`, icon: '🍲' },
  ],
  // 3-2. 숫돌과 무구 정비
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `슥- 슥-... 아까 마물 투구를 내리쳤더니 날이 살짝 나갔네. 숫돌 좀 건네줄래?`, icon: '⚔️' },
    { speakerName: h2.name, text: `여기 있어. 내 방패도 찌그러진 곳을 두드려 펴야겠군. 묵직한 망치 소리가 꽤 경쾌하지?`, icon: '🛡️' },
    { speakerName: h3!.name, text: `장비 손질은 목숨과 직결되는 법이지. 다 끝나면 내 마도 정제유도 덧발라주겠네.`, icon: '✨' },
    { speakerName: '방주 원정대', text: `서로의 무구 상태를 꼼꼼히 살펴주며 빈틈없는 신뢰를 다집니다.`, icon: '🔧' },
  ],
  // 3-3. 고향의 밤하늘과 별
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `심연의 천장은 언제 봐도 먹구름투성이야. 지상에 있을 땐 별이 쏟아지는 밤하늘을 보곤 했는데.`, icon: '🌌' },
    { speakerName: h2.name, text: `내 고향 바닷가에서도 밤바람이 참 시원했지... 파도 소리가 가끔 그립기도 해.`, icon: '🌊' },
    { speakerName: h3!.name, text: `우리가 심연의 끝에 닿아 방주를 지켜낸다면, 언젠가 다 함께 그 푸른 하늘을 볼 수 있을 거야.`, icon: '🌟' },
    { speakerName: '방주 원정대', text: `마음속에 품은 고향의 기억을 나누며, 반드시 살아서 돌아가겠다는 의지를 다집니다.`, icon: '🤝' },
  ],
  // 3-4. 심연의 기이한 소리와 불침번
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `쉿, 방금 모닥불 바깥 어둠 속에서 바스락거리는 소리 들었어?`, icon: '👂' },
    { speakerName: h2.name, text: `돌멩이가 구르는 소리 같았는데... 긴장을 늦추면 안 되겠군. 오늘 첫 불침번은 내가 설게.`, icon: '🗡️' },
    { speakerName: h3!.name, text: `무리하지 마, 두 번째는 내가 이어받을 테니까. 다들 한숨 푹 자둬.`, icon: '🕯️' },
    { speakerName: '방주 원정대', text: `서로의 잠자리를 지켜주는 든든한 등 뒤에서 안도감을 느끼며 눈을 붙입니다.`, icon: '🌙' },
  ],
  // 3-5. 성채로 귀환하면 하고 싶은 일
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `이번 원정 끝나고 성채로 귀환하면 주점 특제 에일 맥주부터 세 잔 들이켤 거야.`, icon: '🍻' },
    { speakerName: h2.name, text: `난 침대에 쓰러져서 사흘 밤낮으로 잠만 잘 거야. 방주의 성화 온기도 쐬면서 말이지.`, icon: '🛏️' },
    { speakerName: h3!.name, text: `하하, 둘 다 소박하네. 난 대장간에 들러서 번쩍이는 투구부터 새로 맞출 거라구!`, icon: '⚒️' },
    { speakerName: '방주 원정대', text: `귀환 후의 유쾌한 계획을 늘어놓으며 지친 마음을 웃음으로 채웁니다.`, icon: '😄' },
  ],
  // 3-6. 환상적인 3인 연계 칭찬
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `아까 몬스터 무리를 단숨에 몰아세운 우리 셋의 연계는 정말 예술이었어!`, icon: '⚡' },
    { speakerName: h2.name, text: `네가 전열에서 어그로를 완벽하게 끌어준 덕분이지. 타이밍이 한 치의 오차도 없었어.`, icon: '🎯' },
    { speakerName: h3!.name, text: `후열에서 지켜보면서도 소름이 돋았다니까. 이제 눈빛만 봐도 서로 무슨 생각을 하는지 알겠어.`, icon: '👁️' },
    { speakerName: '방주 원정대', text: `거듭된 사투 속에서 하나로 완성되어 가는 팀워크에 뿌듯한 자부심을 느낍니다.`, icon: '🏆' },
  ],
  // 3-7. 약초차와 모닥불 휴식
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `약초 잎을 덖어서 모닥불 위에 찻물을 올렸어. 향이 아주 그윽하군.`, icon: '🍵' },
    { speakerName: h2.name, text: `따뜻한 김이 올라오니까 얼어붙었던 손가락이 사르르 녹아내리는 기분이야.`, icon: '♨️' },
    { speakerName: h3!.name, text: `진정 효과가 있는 허브로군. 마시고 나면 오늘 밤은 악몽을 꾸지 않을 것 같아. 고마워.`, icon: '🍃' },
    { speakerName: '방주 원정대', text: `은은한 약초 향 속에서 피로와 긴장을 씻어내며 평온한 휴식을 만끽합니다.`, icon: '💖' },
  ],
  // 3-8. 부상 치료와 붕대
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `가만히 있어봐. 어깨 쪽 찢어진 상처에 소독약을 바르고 붕대를 단단히 감아줄게.`, icon: '🩹' },
    { speakerName: h2.name, text: `으윽... 조금 쓰리지만 견딜 만해. 아까 날 밀쳐내지 않았다면 더 크게 다쳤을 텐데.`, icon: '😣' },
    { speakerName: h3!.name, text: `흉터는 전사의 훈장이라지만, 무리하지는 마. 내일은 내가 더 앞에서 칼을 휘두를 테니.`, icon: '🛡️' },
    { speakerName: '방주 원정대', text: `피를 나눈 전우들의 헌신적인 돌봄 속에서 상처와 마음이 함께 아물어 갑니다.`, icon: '❤️' },
  ],
  // 3-9. 전리품 보물 상자 감상
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `오늘 석관에서 건져 올린 유물, 불빛에 비추어보니 신비로운 푸른 광채가 도는걸.`, icon: '💎' },
    { speakerName: h2.name, text: `성채 대장간의 마르텔 씨에게 보여주면 깜짝 놀라면서 눈이 휘둥그레질 거야.`, icon: '🤩' },
    { speakerName: h3!.name, text: `보물도 보물이지만, 다들 무사히 여기까지 온 게 가장 값진 수확이지.`, icon: '👑' },
    { speakerName: '방주 원정대', text: `작은 전리품을 둘러보며 다가올 내일의 여정에도 행운이 깃들기를 기도합니다.`, icon: '✨' },
  ],
  // 3-10. 건빵을 수프에 적셔 먹기
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `돌덩이처럼 딱딱한 보존용 건빵도 뜨거운 고기 수프에 불려 먹으니 훌륭한 별미야.`, icon: '🍞' },
    { speakerName: h2.name, text: `크크, 이가 부러질 뻔했던 지난번 야영의 끔찍한 기억이 떠오르는군.`, icon: '😆' },
    { speakerName: h3!.name, text: `심연에선 배부르고 따뜻하게 잘 수 있다는 것 자체가 축복이지. 다들 든든히 먹어둬.`, icon: '🥣' },
    { speakerName: '방주 원정대', text: `소박한 식사 한 끼에도 감사하며, 서로를 향한 유쾌한 미소가 모닥불에 번집니다.`, icon: '😊' },
  ],
  // 3-11. 모닥불 앞에서 꾸벅꾸벅 졸기
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `어라... ${h2.name}, 고개를 떨구고 모닥불에 코를 박을 뻔했잖아! 하하!`, icon: '😂' },
    { speakerName: h2.name, text: `헛! 아... 아냐, 눈을 감고 다음 층 공략 루트를 명상하고 있었을 뿐이라구!`, icon: '😳' },
    { speakerName: h3!.name, text: `코까지 골면서 명상하는 재주는 처음 보는군. 피곤할 텐데 얼른 누워 자게.`, icon: '😴' },
    { speakerName: '방주 원정대', text: `유쾌한 웃음소리가 심연의 긴장된 침묵을 몰아내고 따뜻한 온기로 가득 채웁니다.`, icon: '🤣' },
  ],
  // 3-12. 마법과 검과 신앙의 조화
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `강철의 칼끝이 길을 열고, 비전의 불꽃이 어둠을 태우며, 성스러운 기도가 영혼을 지킨다.`, icon: '⚔️' },
    { speakerName: h2.name, text: `우리 셋의 역할이 퍼즐처럼 딱 들어맞아. 각자의 결점을 서로가 완벽히 메워주고 있어.`, icon: '🔮' },
    { speakerName: h3!.name, text: `혼자였다면 결코 도달하지 못했을 심연이야. 너희와 함께라 진심으로 영광이야.`, icon: '🕊️' },
    { speakerName: '방주 원정대', text: `서로 다른 신념과 재능이 하나로 융합되어 난공불락의 결속을 이룹니다.`, icon: '🌟' },
  ],
  // 3-13. 깊어지는 심연의 한기와 성화
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `아래층으로 내려갈수록 공기 중에 서린 냉기가 살갗을 파고드는 것 같아.`, icon: '❄️' },
    { speakerName: h2.name, text: `방주에서 가져온 성화의 잉걸불 덕분에 겨우 온기를 유지하고 있어. 참 신비로운 불꽃이야.`, icon: '🔥' },
    { speakerName: h3!.name, text: `성채의 불꽃이 꺼지지 않는 한, 우리 심장 속의 투혼도 결코 꺼지지 않을 걸세.`, icon: '❤️' },
    { speakerName: '방주 원정대', text: `가슴에 품은 방주의 성화를 되새기며, 한 치의 흔들림 없는 결의를 나눕니다.`, icon: '✨' },
  ],
  // 3-14. 장작 보충과 밤의 경계
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `마른 장작을 조금 더 얹었어. 연기가 너무 높게 치솟지 않도록 불길을 다듬자.`, icon: '🪵' },
    { speakerName: h2.name, text: `심연의 포식자들은 빛을 두려워하지만, 지나친 연기는 사냥꾼을 부를 수도 있으니 조심해야지.`, icon: '👁️' },
    { speakerName: h3!.name, text: `좋아, 준비는 끝났다. 푹 쉬고 내일 새벽 첫 타격으로 심연을 뒤흔들자.`, icon: '⚡' },
    { speakerName: '방주 원정대', text: `조용하고 치밀한 야영 준비 속에서 원정대의 노련함과 단결력이 빛을 발합니다.`, icon: '🌙' },
  ],
  // 3-15. 내일의 보스전을 향한 맹세
  (h1, h2, h3) => [
    { speakerName: h1.name, text: `다음 관문에는 이 구역의 수문장 보스가 도사리고 있다. 다들 마음의 준비는 됐나?`, icon: '💀' },
    { speakerName: h2.name, text: `내 방패는 이미 어떤 괴수의 강타도 튕겨낼 준비가 끝났어. 넌 뒤에서 확실하게 끝장내기만 해!`, icon: '🛡️' },
    { speakerName: h3!.name, text: `모든 마나를 쏟아부어 퇴로를 열 테니, 다 함께 무사히 방주로 귀환하는 거다!`, icon: '🔥' },
    { speakerName: '방주 원정대', text: `굳게 맞잡은 세 손에서 뜨거운 전우애와 승리를 향한 결전의 의지가 타오릅니다.`, icon: '✊' },
  ],
];

// ═════════════════════════════════════════════════════════════════════
// 👫 4. 2인 파티 및 범용 모닥불 담소 템플릿 (16종)
// ═════════════════════════════════════════════════════════════════════
export const DUET_BANTER_GENERATORS: CampBanterGenerator[] = [
  // 4-1. 심연의 한기와 모닥불 불꽃
  (h1, h2) => [
    { speakerName: h1.name, text: `${h2.name}, 오늘 밤은 유난히 한기가 심하군... 따뜻한 수프라도 더 들겠나?`, icon: '🍲' },
    { speakerName: h2.name, text: `고마워. 네가 곁에 있어 준 덕분에 이 끔찍한 심연에서도 버틸 수 있어.`, icon: '🔥' },
    { speakerName: '원정대', text: '모닥불의 온기 속에서 동료들과 깊은 교감을 나눕니다.', icon: '💖' },
  ],
  // 4-2. 심연의 끝과 두려움 극복
  (h1, h2) => [
    { speakerName: h2.name, text: `심연의 끝에는 정말 구원이 기다리고 있을까? 가끔은 덜컥 두려워져.`, icon: '💭' },
    { speakerName: h1.name, text: `우리가 함께하는 한, 어떤 어둠도 우리를 무너뜨릴 수 없어. 내가 널 지킬게.`, icon: '🛡️' },
    { speakerName: '원정대', text: '굳은 신뢰의 눈빛을 주고받으며 결속을 다집니다.', icon: '✨' },
  ],
  // 4-3. 상처 치료와 전우애
  (h1, h2) => [
    { speakerName: h1.name, text: `상처는 좀 어때? 아까 무리해서 날 감싸지 않아도 됐는데...`, icon: '🩹' },
    { speakerName: h2.name, text: `동료를 위해 방패가 되는 건 당연한 일이야. 내일도 함께 나아가자.`, icon: '🤝' },
    { speakerName: '원정대', text: '서로의 상처를 보듬으며 끈끈한 전우애를 형성합니다.', icon: '❤️' },
  ],
  // 4-4. 악몽과 불면증 위로
  (h1, h2) => [
    { speakerName: h1.name, text: `방금 악몽이라도 꾼 거야? 식은땀을 흘리며 깨어나던데...`, icon: '😰' },
    { speakerName: h2.name, text: `예전 전장에서 동료를 잃었던 꿈을 꿨어... 하지만 눈을 뜨니 네가 있어서 안심했어.`, icon: '🥺' },
    { speakerName: h1.name, text: `난 어디 가지 않아. 안심하고 다시 눈을 감아. 내가 깰 때까지 불침번을 서줄 테니.`, icon: '🛡️' },
    { speakerName: '원정대', text: '따스한 위로의 손길이 어두운 공포를 밀어내고 평온을 가져다줍니다.', icon: '🕯️' },
  ],
  // 4-5. 전리품과 앞으로의 희망
  (h1, h2) => [
    { speakerName: h1.name, text: `아까 석관에서 건진 고대 마도석, 불빛에 비춰보니 영롱한 푸른빛을 내네.`, icon: '💎' },
    { speakerName: h2.name, text: `성채 연구소에 가져가면 엄청난 가치를 인정받겠군. 우리 원정의 수확이 쏠쏠해!`, icon: '🤩' },
    { speakerName: '원정대', text: '함께 거둔 전리품을 살펴보며 앞으로의 여정에 희망을 품습니다.', icon: '💰' },
  ],
  // 4-6. 전투 습관과 비전 보법 전수
  (h1, h2) => [
    { speakerName: h1.name, text: `아까 괴물이 덤벼들 때 반박자 빠르게 몸을 비트는 동작, 정말 인상적이었어.`, icon: '⚡' },
    { speakerName: h2.name, text: `예전에 사부님께 호되게 맞아가며 배운 보법이지. 원한다면 내일 아침에 요령을 알려줄까?`, icon: '🥋' },
    { speakerName: '원정대', text: '전투 비결을 아낌없이 나누며 서로의 실력을 함께 끌어올립니다.', icon: '📈' },
  ],
  // 4-7. 사소한 농담과 웃음
  (h1, h2) => [
    { speakerName: h1.name, text: `풉... 너 방금 침 흘리면서 졸고 있었던 거 알아?`, icon: '😆' },
    { speakerName: h2.name, text: `크흠! 침이 아니라 피곤해서 눈물이 잠깐 뺨에 흐른 거라구!`, icon: '😳' },
    { speakerName: '원정대', text: '유쾌한 장난과 웃음소리가 심연의 침묵을 따뜻하게 물들입니다.', icon: '🤣' },
  ],
  // 4-8. 마른 나뭇가지와 성화의 맹세
  (h1, h2) => [
    { speakerName: h1.name, text: `모닥불이 꺼지지 않도록 마른 나뭇가지를 더 넣어야겠어. 온기가 줄어들면 위험해.`, icon: '🪵' },
    { speakerName: h2.name, text: `방주의 성화처럼, 우리 가슴속의 불꽃도 절대로 꺼뜨리지 말자.`, icon: '🔥' },
    { speakerName: '원정대', text: '타오르는 붉은 불꽃 속에서 꺾이지 않는 용기를 되찾습니다.', icon: '✨' },
  ],
  // 4-9. 마법사와 기사의 교류
  (h1, h2) => [
    { speakerName: h1.name, text: `마법 문양을 허공에 새기는 집중력이 놀라워. 머릿속이 복잡하지는 않아?`, icon: '📜' },
    { speakerName: h2.name, text: `익숙해지면 숨 쉬는 것과 같아. 하지만 네 단단한 검술이 방패막이가 되어주지 않으면 주문을 완성할 수 없지.`, icon: '🔮' },
    { speakerName: '원정대', text: '강철의 육체와 비전의 지혜가 조화롭게 어우러지며 깊은 신뢰를 형성합니다.', icon: '🤝' },
  ],
  // 4-10. 성서와 간절한 기도
  (h1, h2) => [
    { speakerName: h1.name, text: `두 손을 모으고 조용히 기도를 올리는 네 모습은 성스럽기까지 하군.`, icon: '🕊️' },
    { speakerName: h2.name, text: `우리 원정대원 모두가 무사히 성채로 돌아갈 수 있도록 신성한 가호를 비는 중이야.`, icon: '✨' },
    { speakerName: '원정대', text: '모닥불 너머로 번지는 간절한 기도 속에서 마음의 안식을 찾습니다.', icon: '🕯️' },
  ],
  // 4-11. 화살깃 다듬기와 민첩한 점검
  (h1, h2) => [
    { speakerName: h1.name, text: `화살깃이 흐트러지면 바람을 타고 빗나가기 십상이지. 한 올 한 올 정성스레 펴줘야 해.`, icon: '🏹' },
    { speakerName: h2.name, text: `네 한 발의 화살이 아까 내 목숨을 구했어. 깃 하나에도 생명이 걸려 있는 셈이군.`, icon: '🎯' },
    { speakerName: '원정대', text: '섬세한 무구 정비 속에서 서로를 지켜주는 책임감을 깊이 새깁니다.', icon: '💖' },
  ],
  // 4-12. 굳은살 박인 손과 맞잡기
  (h1, h2) => [
    { speakerName: h1.name, text: `손에 굳은살이 단단히 박였네. 얼마나 수많은 전장을 헤쳐 온 거야?`, icon: '✋' },
    { speakerName: h2.name, text: `손잡이를 쥐어 잡은 수만큼 상처가 남았지. 하지만 이 손으로 널 지킬 수 있다면 가치 있는 흉터야.`, icon: '🤝' },
    { speakerName: '원정대', text: '굳은살 박인 손을 맞잡으며 말보다 깊은 신뢰를 나눕니다.', icon: '❤️' },
  ],
  // 4-13. 기지개와 원기 회복
  (h1, h2) => [
    { speakerName: h1.name, text: `크으- 모닥불 곁에서 몸을 녹였더니 굳었던 근육이 시원하게 풀리는군!`, icon: '💪' },
    { speakerName: h2.name, text: `한결 가벼워진 몸으로 다시 출발할 수 있겠어. 다음 층도 단숨에 돌파하자!`, icon: '🔥' },
    { speakerName: '원정대', text: '원기 충만한 기합과 함께 새로운 탐험을 향한 투지를 불태웁니다.', icon: '🚀' },
  ],
  // 4-14. 심연의 끝없는 계단
  (h1, h2) => [
    { speakerName: h1.name, text: `끝도 없이 이어지는 어두운 나선 계단... 가끔은 아래로 굴러떨어질 것만 같아.`, icon: '🧭' },
    { speakerName: h2.name, text: `비틀거릴 땐 내 팔을 잡아. 우리가 함께라면 굴러떨어질 일은 없어.`, icon: '🤝' },
    { speakerName: '원정대', text: '서로를 지탱해 주는 단단한 팔뚝에서 무한한 용기를 얻습니다.', icon: '✨' },
  ],
  // 4-15. 과거의 고향과 돌아갈 곳
  (h1, h2) => [
    { speakerName: h1.name, text: `심연을 헤매다 보면 가끔 고향 마을의 굴뚝 연기 냄새가 떠오르곤 해.`, icon: '🏡' },
    { speakerName: h2.name, text: `우리가 방주를 지키는 이유가 바로 그 굴뚝 연기를 다시 보기 위해서지. 꼭 살아서 돌아가자.`, icon: '🌟' },
    { speakerName: '원정대', text: '소중한 이들이 기다리는 지상을 떠올리며 가슴속 결의를 다시 한번 굳힙니다.', icon: '💖' },
  ],
  // 4-16. 어떤 어둠도 가를 수 없는 맹세
  (h1, h2) => [
    { speakerName: h1.name, text: `네 칼날이 향하는 곳이라면 심연의 가장 깊은 구렁텅이라도 따라갈게.`, icon: '⚔️' },
    { speakerName: h2.name, text: `나 역시 마찬가지야. 어떤 어둠도 우리 사이를 가를 수는 없어.`, icon: '🛡️' },
    { speakerName: '원정대', text: '붉게 타오르는 모닥불 앞에서 흔들림 없는 맹세를 나눕니다.', icon: '🔥' },
  ],
];
