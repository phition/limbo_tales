const fs = require('fs');

function inspectSkills() {
  const files = [
    'src/data/classes.ts',
    'src/data/skillBooks.ts',
    'src/data/monsters.ts'
  ];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // 객체 리터럴 내에서 id, name, targetType, effectType 추출
    const skillRegex = /id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"][\s\S]*?targetType:\s*['"]([^'"]+)['"][\s\S]*?effectType:\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = skillRegex.exec(content)) !== null) {
      const [full, id, name, targetType, effectType] = m;
      // 100줄 이내의 짧은 블록인지 확인
      if (full.length < 500) {
        if ((effectType === 'damage' || effectType === 'bleed' || effectType === 'stun' || effectType === 'poison' || effectType === 'drain') &&
            (targetType === 'all_allies' || targetType === 'single_ally' || targetType === 'self')) {
          console.log(`[ATTACK TARGETING ALLY] in ${file}: ${id} (${name}) target=${targetType}, effect=${effectType}`);
        }
        if ((effectType === 'heal' || effectType === 'buff' || effectType === 'shield') &&
            (targetType === 'all_enemies' || targetType === 'single_enemy')) {
          console.log(`[BUFF/HEAL TARGETING ENEMY] in ${file}: ${id} (${name}) target=${targetType}, effect=${effectType}`);
        }
      }
    }
  });
}

inspectSkills();
