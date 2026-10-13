import { CHARACTER_CLASSES } from './src/data/classes.ts';
import { ALL_SKILL_BOOKS } from './src/data/skillBooks.ts';
import { GRIMOIRE_CRAFT_RECIPES } from './src/data/classSkillRecipes.ts';
import { getSkillTags, resolveCombatVfxAndSfx } from './src/utils/skillComboUtils.ts';

const allSkills = [];

// 1. classes.ts
for (const cls of Object.values(CHARACTER_CLASSES)) {
  for (const s of cls.skills) {
    allSkills.push({ source: `class:${cls.id}`, skill: s });
  }
  if (cls.specialSkill) {
    allSkills.push({ source: `class:${cls.id}:special`, skill: cls.specialSkill });
  }
}

// 2. skillBooks.ts
for (const b of ALL_SKILL_BOOKS) {
  if (b.skill) {
    allSkills.push({ source: `book:${b.id}`, skill: b.skill });
  }
}

// 3. classSkillRecipes.ts
for (const r of GRIMOIRE_CRAFT_RECIPES) {
  if (r.skill) {
    allSkills.push({ source: `recipe:${r.id}`, skill: r.skill });
  }
}

console.log(`Total skills gathered: ${allSkills.length}`);

// Check 1: TargetType mismatch with description
console.log('\n=== [CHECK 1: targetType vs description mismatch] ===');
for (const { source, skill } of allSkills) {
  const desc = skill.description || '';
  const name = skill.name || '';
  const isAoeDesc = desc.includes('적 전체') || desc.includes('모든 적') || desc.includes('적 일렬') || desc.includes('광역') || desc.includes('전체 적');
  const isSingleDesc = desc.includes('적 1체') || desc.includes('단일 적') || desc.includes('단일 대상') || desc.includes('대상 1체');
  
  if (isAoeDesc && skill.targetType === 'single_enemy') {
    console.log(`[AOE described but single_enemy] ${source} | ${skill.id} (${name}): "${desc}" [targetType: ${skill.targetType}]`);
  }
  if (isSingleDesc && skill.targetType === 'all_enemies') {
    console.log(`[Single described but all_enemies] ${source} | ${skill.id} (${name}): "${desc}" [targetType: ${skill.targetType}]`);
  }

  const isAllyAllDesc = desc.includes('아군 전체') || desc.includes('모든 아군') || desc.includes('전체 아군');
  const isAllySingleDesc = desc.includes('아군 1') || desc.includes('단일 아군');
  if (isAllyAllDesc && skill.targetType === 'single_ally') {
    console.log(`[All-allies described but single_ally] ${source} | ${skill.id} (${name}): "${desc}" [targetType: ${skill.targetType}]`);
  }
  if (isAllySingleDesc && skill.targetType === 'all_allies') {
    console.log(`[Single-ally described but all_allies] ${source} | ${skill.id} (${name}): "${desc}" [targetType: ${skill.targetType}]`);
  }
}

// Check 2: Skill Tags Check
console.log('\n=== [CHECK 2: Skill tags check (empty or only generic attack)] ===');
for (const { source, skill } of allSkills) {
  const tags = getSkillTags(skill);
  if (tags.length === 0 || (tags.length === 1 && tags[0].id === 'attack')) {
    console.log(`[Generic 'attack' tag only] ${source} | ${skill.id} (${skill.name}): "${skill.description}"`);
  }
}

// Check 3: SFX and VFX resolution check
console.log('\n=== [CHECK 3: SFX / VFX resolution check] ===');
for (const { source, skill } of allSkills) {
  const resolved = resolveCombatVfxAndSfx(skill);
  if (!resolved.sfx) {
    console.log(`[Missing SFX] ${source} | ${skill.id} (${skill.name})`);
  }
}
