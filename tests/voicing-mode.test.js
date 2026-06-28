"use strict";

const fs = require("node:fs");
const vm = require("node:vm");

const appPath = require.resolve("../app.js");
const source = fs.readFileSync(appPath, "utf8");
const listenerMarker = "$$('[data-action=\"modes\"]')";
const executableSource = source.slice(0, source.indexOf(listenerMarker));

const audit = `
selectedMode = "voicing";
const failures = [];
const active = activeNotesFor(DAYS.at(-1));
const deck = buildSingleNoteSectionDeck(DAYS.at(-1), DAYS.at(-1).sectionMixes[0], active, []);
const bTopVoicings = VOICING_PATTERNS.map((pattern) => buildVoicing(11, 4, pattern));
const bTopNames = bTopVoicings.map((voicing) => voicing.chordName);
const bTopTypes = bTopVoicings.map((voicing) => voicing.chordType);
const fTopNames = VOICING_PATTERNS.map((pattern) => buildVoicing(5, 4, pattern).chordName);
const abTopNames = VOICING_PATTERNS.map((pattern) => buildVoicing(8, 4, pattern).chordName);

if (!bTopNames.includes("CM7")) failures.push("B top is missing CM7");
if (!bTopNames.includes("Am9")) failures.push("B top is missing Am9");
if (!bTopNames.includes("D13")) failures.push("B top is missing D13");
if (!bTopNames.includes("Bm6")) failures.push("B top is missing Bm6");
for (const expectedType of ["M7", "m7", "m9", "M9", "13", "7alt", "6", "m6"]) {
  if (!bTopTypes.includes(expectedType)) failures.push(\`B top is missing chord type \${expectedType}\`);
}
if (!fTopNames.includes("Ab13")) failures.push("F top should spell the 13 chord as Ab13");
if (fTopNames.includes("G#13")) failures.push("F top should not spell the 13 chord as G#13");
if (!abTopNames.includes("Bbm7")) failures.push("Ab top should spell the m7 chord as Bbm7");
if (abTopNames.includes("A#m7")) failures.push("Ab top should not spell the m7 chord as A#m7");

for (const trial of deck) {
  if (!trial.voicingMidis || trial.voicingMidis.length !== 4) failures.push("Trial does not have a 4-voice voicing");
  if (trial.rootMidi < 36 || trial.rootMidi > 47) failures.push("Root is not in C2-B2");
  if (trial.midi < 60) failures.push("Top note is below middle C");
  if (trial.voicingMidis.at(-1) !== trial.midi) failures.push("Top MIDI is not the top of the voicing");
  if (trial.voicingMidis.some((midi, index, midis) => index > 0 && midi <= midis[index - 1])) failures.push("Voicing is not strictly ascending");
  if (trial.voicingMidis.at(-1) - trial.voicingMidis[0] > 12) failures.push("Voicing is not closed within an octave");
  if (trial.expected !== displayNote(trial.pitchClass)) failures.push("Expected answer is not the top note");
}

if (failures.length) throw new Error(failures.slice(0, 10).join("\\n"));
console.log(\`voicing mode audit passed: \${deck.length} trials, \${VOICING_PATTERNS.length} voicing patterns\`);
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
