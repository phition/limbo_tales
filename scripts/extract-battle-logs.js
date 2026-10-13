import fs from 'fs';

const content = fs.readFileSync('src/screens/BattleScreen.tsx', 'utf8');
const lines = content.split('\n');
const logs = new Set();

for (const l of lines) {
  const m1 = l.match(/(?:gm\.addLog|logs\.push)\s*\(\s*`([^`]+)`/);
  if (m1) logs.add(m1[1]);
  const m2 = l.match(/(?:gm\.addLog|logs\.push)\s*\(\s*'([^']+)'/);
  if (m2) logs.add(m2[1]);
  const m3 = l.match(/(?:gm\.addLog|logs\.push)\s*\(\s*"([^"]+)"/);
  if (m3) logs.add(m3[1]);
}

console.log('Total unique battle log templates found in BattleScreen.tsx:', logs.size);
const arr = Array.from(logs);
fs.writeFileSync('scripts/extracted_battle_logs.json', JSON.stringify(arr, null, 2), 'utf8');
console.log('Sample templates:');
arr.slice(0, 10).forEach((t, i) => console.log(`[${i+1}] ${t}`));
