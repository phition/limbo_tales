const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\phiti\\.gemini\\antigravity\\brain\\35ac76f6-c2bd-4b17-bb89-bfef5dbc328f\\.system_generated\\tasks\\task-3.log', 'utf8').split('\n');

let out = [];
// Skip first 3 lines of task-3.log which are metadata
for (let i = 3; i < lines.length; i++) {
    // lines are like "1: import Phaser from 'phaser';" or "234:     const a = 1;"
    const line = lines[i];
    const match = line.match(/^\d+:\s(.*)/);
    if (match) {
        out.push(match[1]);
    } else {
        out.push(line);
    }
}

let code = out.join('\n');
// We had only lines 1..1065 in task-3.log? Wait! 
// Let's write whatever we parsed to a temp file first.
fs.writeFileSync('temp.ts', code, 'utf8');
