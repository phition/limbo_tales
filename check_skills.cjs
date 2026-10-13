const fs = require('fs');

const classes = fs.readFileSync('src/data/classes.ts', 'utf8');
const books = fs.readFileSync('src/data/skillBooks.ts', 'utf8');
const monsters = fs.readFileSync('src/data/monsters.ts', 'utf8');

function checkFile(name, content) {
  console.log('=== Checking', name, '===');
  // targetType 찾기
  const lines = content.split('\n');
  let currentSkill = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idM = line.match(/id:\s*['"]([^'"]+)['"]/);
    if (idM) currentSkill.id = idM[1];
    const nameM = line.match(/name:\s*['"]([^'"]+)['"]/);
    if (nameM) currentSkill.name = nameM[1];
    const ttM = line.match(/targetType:\s*['"]([^'"]+)['"]/);
    if (ttM) currentSkill.targetType = ttM[1];
    const effM = line.match(/effectType:\s*['"]([^'"]+)['"]/);
    if (effM) currentSkill.effectType = effM[1];

    if (currentSkill.id && currentSkill.name && (currentSkill.targetType || currentSkill.effectType)) {
      if (line.includes('}') || line.includes('},')) {
        if (currentSkill.targetType && currentSkill.effectType) {
          // print if odd
          const { id, name, targetType, effectType } = currentSkill;
          if ((effectType === 'damage' || effectType === 'bleed' || effectType === 'stun' || effectType === 'poison' || effectType === 'drain' || effectType === 'debuff') &&
              (targetType === 'all_allies' || targetType === 'single_ally' || targetType === 'self')) {
            console.log(`[ATTACK TARGET ALLY] ${id} (${name}) target=${targetType}, eff=${effectType}`);
          }
          if ((effectType === 'heal' || effectType === 'buff' || effectType === 'shield') &&
              (targetType === 'all_enemies' || targetType === 'single_enemy')) {
            console.log(`[BUFF TARGET ENEMY] ${id} (${name}) target=${targetType}, eff=${effectType}`);
          }
          if (id.includes('waltz') || id.includes('duel') || name.includes('왈츠') || name.includes('난무')) {
            console.log(`[WALTZ/DUEL/FLURRY] ${id} (${name}) target=${targetType}, eff=${effectType}`);
          }
        }
        currentSkill = {};
      }
    }
  }
}

checkFile('classes.ts', classes);
checkFile('skillBooks.ts', books);
