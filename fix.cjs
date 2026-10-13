const fs = require('fs');

let code = fs.readFileSync('src/scenes/ExplorationScene.ts', 'utf8');
let lines = code.split('\n');

let errs = fs.readFileSync('C:\\Users\\phiti\\.gemini\\antigravity\\brain\\35ac76f6-c2bd-4b17-bb89-bfef5dbc328f\\.system_generated\\tasks\\task-58.log', 'utf8').split('\n');

for (let err of errs) {
    let m = err.match(/ExplorationScene\.ts\((\d+),\d+\): error TS1002/);
    if (m) {
        let l = parseInt(m[1]) - 1;
        if (lines[l]) lines[l] = lines[l] + "'";
    }
}

// Write it back
fs.writeFileSync('src/scenes/ExplorationScene.ts', lines.join('\n'), 'utf8');
console.log('Fixed TS1002');
