"use strict";

const fs = require("node:fs");
const vm = require("node:vm");

const appPath = require.resolve("../app.js");
const source = fs.readFileSync(appPath, "utf8");
const listenerMarker = "$$('[data-action=\"modes\"]')";
const executableSource = source.slice(0, source.indexOf(listenerMarker));

const audit = `
selectedMode = "double";
const failures = [];
const expectedCounts = { "固定": 30, "比較": 30, "汎化": 40, "確認": 50 };

for (const day of DOUBLE_DAYS) {
  for (const mix of day.sectionMixes) {
    if (mix.count !== expectedCounts[day.level]) {
      failures.push(\`Day \${day.day}: \${day.level} is \${mix.count} questions\`);
    }

    const deck = buildTwoNoteSectionDeck(day, mix);
    if (deck.length !== mix.count) {
      failures.push(\`Day \${day.day}: deck has \${deck.length}/\${mix.count} trials\`);
    }

    const pools = hardOobPoolsFor(day);
    const oobTrials = deck.filter((item) => item.isOob);
    if (pools.currentPairs.length && pools.pastPairs.length && oobTrials.length) {
      const currentCount = oobTrials.filter((item) => item.oobSource === "current").length;
      if (Math.abs(currentCount - (oobTrials.length * CURRENT_OOB_SHARE)) > 1) {
        failures.push(\`Day \${day.day}: current/past OOB split is \${currentCount}/\${oobTrials.length}\`);
      }
    }

    for (const trial of oobTrials) {
      const learnedCount = trial.pitchClasses.filter((note) => day.active.includes(note)).length;
      const topNote = trial.pitchClasses[trial.pitchClasses.length - 1];
      if (learnedCount !== 1) failures.push(\`Day \${day.day}: OOB does not contain exactly one learned note\`);
      if (!day.active.includes(topNote)) failures.push(\`Day \${day.day}: OOB top note is unlearned\`);
      if (classifyTwoNotePair(trial.pitchClasses, day.enabledPairs) !== "OOB") {
        failures.push(\`Day \${day.day}: enabled pair was labeled OOB\`);
      }
    }
  }
}

if (failures.length) throw new Error(failures.slice(0, 10).join("\\n"));
console.log(\`two-note OOB audit passed: \${DOUBLE_DAYS.length} days\`);
`;

const inertElement = {
  addEventListener() {},
  classList: { add() {}, remove() {}, toggle() {} },
  setAttribute() {}
};
const context = {
  console,
  document: {
    querySelector: () => inertElement,
    querySelectorAll: () => []
  },
  window: {}
};

vm.runInNewContext(`${executableSource}\n${audit}`, context, { filename: appPath });
