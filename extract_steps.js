
const fs = require('fs');
const content = fs.readFileSync('I:/workshop/newProjectVive/src/data/tutorialSteps.ts', 'utf8');

// evaluate TUTORIAL_STEPS
const stepMatch = content.match(/export const TUTORIAL_STEPS: TutorialStep\[\] = ([\s\S]+?\n\];)/);
if (!stepMatch) {
  console.error('Could not find TUTORIAL_STEPS');
  process.exit(1);
}
// Clean type annotations and eval
let arrStr = stepMatch[1].replace(/\n\];/, '\n]');
const steps = eval(arrStr);
console.log(JSON.stringify(steps));
