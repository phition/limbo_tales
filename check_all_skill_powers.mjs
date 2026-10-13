import { CHARACTER_CLASSES } from './src/data/classes.ts';
import { GRIMOIRE_CRAFT_RECIPES } from './src/data/classSkillRecipes.ts';
import { ALL_SKILL_BOOKS, getDroppableMonsterSkillBooks } from './src/data/skillBooks.ts';
import { MONSTERS } from './src/data/monsters.ts';

console.log('=== 1. Checking CHARACTER_CLASSES ===');
const classSkills = [];
for (const [cId, cls] of Object.entries(CHARACTER_CLASSES)) {
  if (cls.skills) {
    cls.skills.forEach(s => classSkills.push({ source: `class:${cId}`, skill: s }));
  }
  if (cls.specialSkill) {
    classSkills.push({ source: `class:${cId}:special`, skill: cls.specialSkill });
  }
}

classSkills.forEach(({ source, skill }) => {
  const pwrPct = Math.round(skill.power * 100);
  const pcts = (skill.description.match(/\d+%/g) || []).map(p => parseInt(p, 10));
  const match = pcts.includes(pwrPct);
  if (!match) {
    console.log(`[MISMATCH] ${source} | ${skill.id} (${skill.name}): power=${skill.power} (${pwrPct}%) vs desc="${skill.description}" [desc %: ${pcts.join(', ')}]`);
  }
});

console.log('\n=== 2. Checking GRIMOIRE_CRAFT_RECIPES ===');
GRIMOIRE_CRAFT_RECIPES.forEach(r => {
  const skill = r.skill;
  const pwrPct = Math.round(skill.power * 100);
  const pcts = (skill.description.match(/\d+%/g) || []).map(p => parseInt(p, 10));
  const match = pcts.includes(pwrPct);
  if (!match) {
    console.log(`[MISMATCH] recipe:${r.id} | ${skill.id} (${skill.name}): power=${skill.power} (${pwrPct}%) vs desc="${skill.description}" [desc %: ${pcts.join(', ')}]`);
  }
});

console.log('\n=== 3. Checking ALL_SKILL_BOOKS ===');
ALL_SKILL_BOOKS.forEach(b => {
  const skill = b.skill;
  const pwrPct = Math.round(skill.power * 100);
  const pcts = (skill.description.match(/\d+%/g) || []).map(p => parseInt(p, 10));
  const match = pcts.includes(pwrPct);
  if (!match) {
    console.log(`[MISMATCH] book:${b.id} | ${skill.id} (${skill.name}): power=${skill.power} (${pwrPct}%) vs desc="${skill.description}" [desc %: ${pcts.join(', ')}]`);
  }
});

// Check all droppable monster books
const monsterBooks = getDroppableMonsterSkillBooks(MONSTERS);
console.log(`\n=== 4. Checking Droppable Monster Skill Books (${monsterBooks.length}) ===`);
monsterBooks.forEach(mb => {
  const pwrPct = Math.round(mb.defaultPower * 100);
  const pcts = (mb.defaultDescription.match(/\d+%/g) || []).map(p => parseInt(p, 10));
  const match = pcts.includes(pwrPct);
  if (!match) {
    console.log(`[MISMATCH] monsterBook:${mb.bookId} (${mb.skillName}): defaultPower=${mb.defaultPower} (${pwrPct}%) vs desc="${mb.defaultDescription}" [desc %: ${pcts.join(', ')}]`);
  }
});
