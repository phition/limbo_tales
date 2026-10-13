import fs from 'fs';

const unhandled = JSON.parse(fs.readFileSync('scripts/unhandled_battle_logs.json', 'utf8'));

// 그룹별 분류
const categories = {
  victory_defeat: [],
  crisis_death: [],
  buff_healing: [],
  shield_barrier: [],
  skill_cast_fever: [],
  monster_action: [],
  formation: [],
  combat_status_misc: []
};

for (const item of unhandled) {
  const t = item.template;
  if (/승리|패배|철수|재개|소멸/i.test(t)) {
    categories.victory_defeat.push(t);
  } else if (/영면|임종|사망|부활|소생/i.test(t)) {
    categories.crisis_death.push(t);
  } else if (/회복|치유|재생|마나|체력|생명의 샘|축복/i.test(t)) {
    categories.buff_healing.push(t);
  } else if (/보호막|방벽|결계|수호|면역|경감|방어 태세/i.test(t)) {
    categories.shield_barrier.push(t);
  } else if (/FEVER|궁극기|시너지|시전|비전|은신|과충전|함성|스킬/i.test(t)) {
    categories.skill_cast_fever.push(t);
  } else if (/차징|브레이크|요격|그로기|괴성|포효|도발/i.test(t)) {
    categories.monster_action.push(t);
  } else if (/진형|전열|중열|후열|이동|붕괴/i.test(t)) {
    categories.formation.push(t);
  } else {
    categories.combat_status_misc.push(t);
  }
}

for (const [k, v] of Object.entries(categories)) {
  console.log(`=== ${k} (${v.length}) ===`);
  v.slice(0, 5).forEach((t, i) => console.log(`  - ${t}`));
}
