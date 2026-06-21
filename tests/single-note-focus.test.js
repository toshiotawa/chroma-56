"use strict";

const fs = require("node:fs");
const vm = require("node:vm");

const appPath = require.resolve("../app.js");
const source = fs.readFileSync(appPath, "utf8");
const listenerMarker = "$$('[data-action=\"modes\"]')";
const executableSource = source.slice(0, source.indexOf(listenerMarker));

const audit = `
selectedMode = "single";
const failures = [];
const focusDays = DAYS.filter((day) => day.level === "集中");

if (DAYS.length !== 67) failures.push(\`Expected 67 days, got \${DAYS.length}\`);
if (focusDays.length !== 11) failures.push(\`Expected 11 focus days, got \${focusDays.length}\`);

for (let index = 0; index < focusDays.length; index += 1) {
  const day = focusDays[index];
  const expectedNote = ADDITION_ORDER[index + 1];
  const active = activeNotesFor(day);
  const oob = oobNotesFor(active, expectedNote);
  const nextDay = DAYS[day.day];

  if (active.length !== 1 || active[0] !== expectedNote) {
    failures.push(\`Day \${day.day}: focus choices are not limited to the new note\`);
  }
  if (!oob.length) failures.push(\`Day \${day.day}: focus day has no OOB choices\`);
  if (!nextDay || nextDay.level !== "記憶" || nextDay.noteCount !== day.noteCount) {
    failures.push(\`Day \${day.day}: focus day is not immediately before its memory day\`);
  }

  for (const mix of day.sectionMixes) {
    const deck = buildSingleNoteSectionDeck(day, mix, active, oob);
    if (deck.length !== mix.count) failures.push(\`Day \${day.day}: wrong deck size\`);
    if (deck.some((trial) => !trial.isOob && trial.pitchClass !== expectedNote)) {
      failures.push(\`Day \${day.day}: a prior note appears as a target\`);
    }
  }
}

if (failures.length) throw new Error(failures.join("\\n"));
console.log(\`single-note focus audit passed: \${focusDays.length} focus days across \${DAYS.length} days\`);
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
