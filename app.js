"use strict";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TWO_NOTE_NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const DUAL_NOTE_NAMES = { 1: "C#/Db", 3: "D#/Eb", 6: "F#/Gb", 8: "G#/Ab", 10: "A#/Bb" };
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const ADDITION_ORDER = [5, 4, 6, 3, 7, 2, 8, 1, 9, 0, 10, 11];
const SECTION_COUNT = 5;
const QUESTIONS_PER_SECTION = 60;
const DAILY_TOTAL = 300;
const RECENT_PAIR_WINDOW = 6;
const RECENT_NOTE_WINDOW = 3;

const SINGLE_NOTE_OCTAVES = [4, 5, 6];
const SINGLE_NOTE_TIMBRES = 5;

const SINGLE_NOTE_DAY_PROFILES = [
  {
    level: "記憶",
    focus: "新しい音の輪郭を、5つの音色で結びつける",
    sectionMixes: [
      { count: 60, newNote: 0.85, recentNotes: 0.00, oldNotes: 0.00, oob: 0.10, feedback: true },
      { count: 60, newNote: 0.80, recentNotes: 0.05, oldNotes: 0.00, oob: 0.10, feedback: true },
      { count: 60, newNote: 0.75, recentNotes: 0.05, oldNotes: 0.00, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.70, recentNotes: 0.10, oldNotes: 0.00, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.75, recentNotes: 0.10, oldNotes: 0.00, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  },
  {
    level: "境界",
    focus: "対象外音と隣接音の境界を聞き分ける",
    sectionMixes: [
      { count: 60, newNote: 0.70, recentNotes: 0.20, oldNotes: 0.00, oob: 0.10, feedback: true },
      { count: 60, newNote: 0.65, recentNotes: 0.20, oldNotes: 0.00, oob: 0.15, feedback: true },
      { count: 60, newNote: 0.60, recentNotes: 0.25, oldNotes: 0.00, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.55, recentNotes: 0.25, oldNotes: 0.05, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.55, recentNotes: 0.25, oldNotes: 0.05, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  },
  {
    level: "速度",
    focus: "考えて比較する前に音名を選ぶ",
    sectionMixes: [
      { count: 60, newNote: 0.55, recentNotes: 0.25, oldNotes: 0.05, oob: 0.15, feedback: true },
      { count: 60, newNote: 0.50, recentNotes: 0.25, oldNotes: 0.10, oob: 0.15, feedback: true },
      { count: 60, newNote: 0.45, recentNotes: 0.25, oldNotes: 0.15, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.40, recentNotes: 0.25, oldNotes: 0.20, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.40, recentNotes: 0.25, oldNotes: 0.20, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  },
  {
    level: "定着",
    focus: "フィードバックなしで90%を目指す",
    sectionMixes: [
      { count: 60, newNote: 0.40, recentNotes: 0.25, oldNotes: 0.20, oob: 0.15, feedback: true },
      { count: 60, newNote: 0.35, recentNotes: 0.25, oldNotes: 0.25, oob: 0.15, feedback: true },
      { count: 60, newNote: 0.30, recentNotes: 0.25, oldNotes: 0.30, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.25, recentNotes: 0.25, oldNotes: 0.35, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newNote: 0.25, recentNotes: 0.25, oldNotes: 0.35, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  }
];

const FINAL_LEVELS = [
  ["全音統合", "全12音のカテゴリーをひとつに統合する"],
  ["音色汎化", "5つの音色が変わっても同じ音名を捉える"],
  ["音域汎化", "3オクターブを越えてクロマを捉える"],
  ["近接音", "半音隣の取り違えを減らす"],
  ["高速判断", "全12音を2秒前後で判断する"],
  ["無参照", "正解音を手がかりにせず判断する"],
  ["最終リハーサル", "精度と速度を同時に整える"],
  ["FINAL CHECK", "全12音の最終確認"]
];

const DAYS = [];
ADDITION_ORDER.forEach((pitchClass, pitchIndex) => {
  SINGLE_NOTE_DAY_PROFILES.forEach((profile, levelIndex) => {
    const day = pitchIndex * 4 + levelIndex + 1;
    const prefix = pitchIndex === 0 ? NOTE_NAMES[pitchClass] : `+ ${NOTE_NAMES[pitchClass]}`;
    DAYS.push({
      day,
      noteCount: pitchIndex + 1,
      label: `${prefix} · ${profile.level}`,
      focus: profile.focus,
      sectionMixes: profile.sectionMixes,
      level: profile.level,
      dayInCycle: levelIndex + 1
    });
  });
});
FINAL_LEVELS.forEach((item, index) => DAYS.push({
  day: 49 + index,
  noteCount: 12,
  label: item[0],
  focus: item[1],
  sectionMixes: SINGLE_NOTE_DAY_PROFILES[3].sectionMixes,
  level: item[0],
  dayInCycle: 4
}));

// Pair order from the 264-day curriculum: every new pitch is connected to
// each previously learned pitch before the next pitch is introduced.
const TWO_NOTE_ADDITION_ORDER = [4, 5, 9, 10, 2, 1, 7, 8, 11, 0, 3, 6]; // E F A Bb D Db G Ab B C Eb Gb
const TWO_NOTE_PAIR_STAGES = TWO_NOTE_ADDITION_ORDER.flatMap((newNote, newIndex) =>
  TWO_NOTE_ADDITION_ORDER.slice(0, newIndex).map((knownNote) => [knownNote, newNote])
);
const TWO_NOTE_TIMBRES = 5;
const ALL_PLACEMENTS = [3, 4, 5].flatMap((first) => [3, 4, 5].map((second) => [first, second]));
const pairName = (pair) => pair.map((note) => TWO_NOTE_NOTE_NAMES[note]).join(" + ");
const TWO_NOTE_DAY_PROFILES = [
  {
    name: "固定",
    focus: "新しいペアを中心に固定します。",
    placements: [[4, 4]],
    sectionMixes: [
      { count: 60, newPair: 0.90, recentPairs: 0.00, oldPairs: 0.00, oob: 0.10, feedback: true },
      { count: 60, newPair: 0.85, recentPairs: 0.05, oldPairs: 0.00, oob: 0.10, feedback: true },
      { count: 60, newPair: 0.80, recentPairs: 0.05, oldPairs: 0.00, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.75, recentPairs: 0.10, oldPairs: 0.00, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.75, recentPairs: 0.10, oldPairs: 0.00, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  },
  {
    name: "比較",
    focus: "新しいペアと直近ペアを比較します。",
    placements: [[4, 4], [3, 4], [4, 3]],
    sectionMixes: [
      { count: 60, newPair: 0.70, recentPairs: 0.20, oldPairs: 0.00, oob: 0.10, feedback: true },
      { count: 60, newPair: 0.65, recentPairs: 0.20, oldPairs: 0.00, oob: 0.15, feedback: true },
      { count: 60, newPair: 0.60, recentPairs: 0.25, oldPairs: 0.00, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.55, recentPairs: 0.25, oldPairs: 0.05, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.55, recentPairs: 0.25, oldPairs: 0.05, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  },
  {
    name: "汎化",
    focus: "音域・上下・音色を変えて汎化します。",
    placements: ALL_PLACEMENTS,
    sectionMixes: [
      { count: 60, newPair: 0.55, recentPairs: 0.25, oldPairs: 0.05, oob: 0.15, feedback: true },
      { count: 60, newPair: 0.50, recentPairs: 0.25, oldPairs: 0.10, oob: 0.15, feedback: true },
      { count: 60, newPair: 0.45, recentPairs: 0.25, oldPairs: 0.15, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.40, recentPairs: 0.25, oldPairs: 0.20, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.40, recentPairs: 0.25, oldPairs: 0.20, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  },
  {
    name: "確認",
    focus: "累積ペアの中で確認します。",
    placements: ALL_PLACEMENTS,
    isTestDay: true,
    sectionMixes: [
      { count: 60, newPair: 0.40, recentPairs: 0.25, oldPairs: 0.20, oob: 0.15, feedback: true },
      { count: 60, newPair: 0.35, recentPairs: 0.25, oldPairs: 0.25, oob: 0.15, feedback: true },
      { count: 60, newPair: 0.30, recentPairs: 0.25, oldPairs: 0.30, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.25, recentPairs: 0.25, oldPairs: 0.35, oob: 0.15, feedback: true, shepardBefore: true },
      { count: 60, newPair: 0.25, recentPairs: 0.25, oldPairs: 0.35, oob: 0.15, feedback: false, shepardBefore: true }
    ]
  }
];

const DOUBLE_DAYS = TWO_NOTE_PAIR_STAGES.flatMap((newPair, stageIndex) =>
  TWO_NOTE_DAY_PROFILES.map((profile, dayIndex) => {
    const enabledPairs = TWO_NOTE_PAIR_STAGES.slice(0, stageIndex + 1);
    const active = [...new Set(enabledPairs.flat())];
    return {
      day: stageIndex * 4 + dayIndex + 1,
      stage: stageIndex + 1,
      dayInStage: dayIndex + 1,
      active,
      noteCount: active.length,
      newPair,
      enabledPairs,
      pairs: enabledPairs,
      placements: profile.placements,
      sectionMixes: profile.sectionMixes,
      isTestDay: Boolean(profile.isTestDay),
      label: `${pairName(newPair)} · ${profile.name}`,
      focus: `ペア ${stageIndex + 1}/66。${profile.focus}`,
      level: profile.name
    };
  })
);

const TIMBRE_NAMES = ["sine", "triangle", "sawtooth", "square", "FM"];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.35;
    this.activeNodes = new Set();
  }

  async init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("このブラウザはWeb Audio APIに対応していません。");
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;
      this.master.gain.value = this.volume;
      this.master.connect(compressor).connect(this.ctx.destination);
    }
    // Some embedded browsers leave resume() pending until the next gesture.
    // Do not block the UI; every play button is itself another valid gesture.
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setVolume(value) {
    this.volume = value;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
  }

  stopAll() {
    for (const node of this.activeNodes) {
      try { node.stop(); } catch (_) { /* already stopped */ }
    }
    this.activeNodes.clear();
  }

  async pause() {
    if (this.ctx?.state === "running") await this.ctx.suspend();
  }

  async resume() {
    if (this.ctx?.state === "suspended") await this.ctx.resume();
  }

  track(node) {
    this.activeNodes.add(node);
    node.addEventListener("ended", () => this.activeNodes.delete(node), { once: true });
  }

  envelope(gain, now, duration, peak) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.1);
    gain.gain.setValueAtTime(peak, now + Math.max(0.11, duration - 0.1));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  }

  async playTone(midi, timbre) {
    await this.init();
    this.stopAll();
    const now = this.ctx.currentTime + 0.015;
    const duration = 0.8;
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = Math.min(7000, Math.max(1500, frequency * 8));
    filter.Q.value = 0.5;
    this.envelope(gain, now, duration, timbre === 4 ? 0.16 : 0.2);
    gain.connect(filter).connect(this.master);

    if (timbre < 4) {
      const oscillator = this.ctx.createOscillator();
      oscillator.type = ["sine", "triangle", "sawtooth", "square"][timbre];
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime((Math.random() - 0.5) * 2, now);
      oscillator.connect(gain);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
      this.track(oscillator);
    } else {
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modulation = this.ctx.createGain();
      carrier.type = "sine";
      modulator.type = "sine";
      carrier.frequency.setValueAtTime(frequency, now);
      modulator.frequency.setValueAtTime(frequency * 2, now);
      modulation.gain.setValueAtTime(frequency * 1.25, now);
      modulation.gain.exponentialRampToValueAtTime(0.1, now + duration);
      modulator.connect(modulation).connect(carrier.frequency);
      carrier.connect(gain);
      carrier.start(now);
      modulator.start(now);
      carrier.stop(now + duration + 0.03);
      modulator.stop(now + duration + 0.03);
      this.track(carrier);
      this.track(modulator);
    }
  }

  async playChord(midis, timbre) {
    await this.init();
    this.stopAll();
    const now = this.ctx.currentTime + 0.015;
    const duration = 0.9;
    midis.forEach((midi) => {
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      const gain = this.ctx.createGain();
      const oscillator = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      oscillator.type = ["sine", "triangle", "sawtooth", "square", "triangle"][timbre];
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime((Math.random() - 0.5) * 2, now);
      filter.type = "lowpass";
      filter.frequency.value = Math.min(6500, Math.max(1400, frequency * 8));
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.105, now + 0.08);
      gain.gain.setValueAtTime(0.105, now + duration - 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(filter).connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
      this.track(oscillator);
    });
  }

  async playShepard(duration = 20) {
    await this.init();
    this.stopAll();
    const now = this.ctx.currentTime + 0.03;
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.linearRampToValueAtTime(0.16, now + 0.7);
    bus.gain.setValueAtTime(0.16, now + duration - 0.7);
    bus.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    bus.connect(this.master);

    // Repeating one-octave downward glissandi, staggered to remove a clear endpoint.
    for (let voice = 0; voice < 6; voice += 1) {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = "sine";
      oscillator.connect(gain).connect(bus);
      const phase = voice / 6;
      const base = 110 * 2 ** voice;
      oscillator.frequency.setValueAtTime(base, now);
      let segmentStart = now - phase * 2;
      while (segmentStart < now + duration) {
        const start = Math.max(now, segmentStart);
        const relative = Math.max(0, (start - segmentStart) / 2);
        oscillator.frequency.setValueAtTime(base * 2 ** (-relative), start);
        const end = Math.min(now + duration, segmentStart + 2);
        oscillator.frequency.exponentialRampToValueAtTime(base * 0.5, end);
        segmentStart += 2;
        if (segmentStart < now + duration) oscillator.frequency.setValueAtTime(base, segmentStart);
      }
      const centerWeight = Math.exp(-0.5 * ((voice - 2.5) / 1.45) ** 2);
      gain.gain.value = 0.18 * centerWeight;
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
      this.track(oscillator);
    }
  }
}

const audio = new AudioEngine();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const screens = $$(".screen");
let selectedMode = "single";
let selectedDay = DAYS[0];
let selectedWeek = 1;
let session = null;
let completedExport = null;
let timerId = null;
let countdownId = null;

function displayNote(note) {
  return selectedMode === "double" ? TWO_NOTE_NOTE_NAMES[note] : (DUAL_NOTE_NAMES[note] || NOTE_NAMES[note]);
}

function sortChromaticallyFromC(notes) {
  return [...notes].sort((first, second) => first - second);
}

function partitionByKeyColor(notes) {
  const sorted = sortChromaticallyFromC(notes);
  return {
    black: sorted.filter((note) => BLACK_KEYS.has(note)),
    white: sorted.filter((note) => !BLACK_KEYS.has(note))
  };
}

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function activeNotesFor(day) {
  return selectedMode === "double" ? day.active : ADDITION_ORDER.slice(0, day.noteCount);
}

function oobNotesFor(active, newNote) {
  if (selectedMode === "double") return [];
  if (active.length >= 12) return [];
  const activeSet = new Set(active);
  const targetNote = newNote ?? active[active.length - 1];
  const candidates = [];
  for (const offset of [-2, -1, 1, 2]) {
    const note = (targetNote + offset + 12) % 12;
    if (!activeSet.has(note)) candidates.push(note);
  }
  const activeInOrder = ADDITION_ORDER.filter((note) => activeSet.has(note));
  if (activeInOrder.length) {
    const boundaryNotes = [activeInOrder[0], activeInOrder[activeInOrder.length - 1]];
    for (const boundary of boundaryNotes) {
      for (const offset of [-2, -1, 1, 2]) {
        const note = (boundary + offset + 12) % 12;
        if (!activeSet.has(note) && !candidates.includes(note)) candidates.push(note);
      }
    }
  }
  return candidates;
}

function splitReviewPairs(enabledPairs, newPair) {
  const review = enabledPairs.filter((pair) => normalizedPairKey(pair) !== normalizedPairKey(newPair));
  return {
    recentPairs: review.slice(-RECENT_PAIR_WINDOW),
    oldPairs: review.slice(0, -RECENT_PAIR_WINDOW)
  };
}

function splitActiveNotes(active) {
  const newNote = active[active.length - 1];
  const prior = active.slice(0, -1);
  return {
    newNote,
    recentNotes: prior.slice(-RECENT_NOTE_WINDOW),
    oldNotes: prior.slice(0, -RECENT_NOTE_WINDOW)
  };
}

function mixRate(mix, key) {
  if (key === "new") return mix.newPair ?? mix.newNote ?? 0;
  if (key === "recent") return mix.recentPairs ?? mix.recentNotes ?? 0;
  return mix.oldPairs ?? mix.oldNotes ?? 0;
}

function allocateSectionTargets(targetCount, mix, pools) {
  const categories = [
    { key: "new", items: pools.new, rate: mixRate(mix, "new") },
    { key: "recent", items: pools.recent, rate: mixRate(mix, "recent") },
    { key: "old", items: pools.old, rate: mixRate(mix, "old") }
  ].filter((category) => category.items.length > 0 && category.rate > 0);
  if (!categories.length || targetCount <= 0) return [];
  return allocateByWeight(categories, targetCount, (category) => category.rate);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function sectionProgramSummary(mix) {
  const parts = [
    `新規${formatPercent(mixRate(mix, "new"))}`,
    mixRate(mix, "recent") ? `直近${formatPercent(mixRate(mix, "recent"))}` : "",
    mixRate(mix, "old") ? `累積${formatPercent(mixRate(mix, "old"))}` : "",
    mix.oob ? `OOB ${formatPercent(mix.oob)}` : "",
    mix.feedback === false ? "FBなし" : "FBあり",
    mix.shepardBefore ? "Shepard前" : ""
  ].filter(Boolean);
  return `${mix.count}問 · ${parts.join(" · ")}`;
}

function renderSectionProgram(day) {
  $("#sectionProgram").innerHTML = day.sectionMixes.map((mix, index) => `
    <div><b>${String(index + 1).padStart(2, "0")}</b><span>セクション ${index + 1}</span><small>${sectionProgramSummary(mix)}</small></div>
  `).join("");
}

function renderDays() {
  const start = (selectedWeek - 1) * 7;
  const days = (selectedMode === "double" ? DOUBLE_DAYS : DAYS).slice(start, start + 7);
  $("#dayGrid").innerHTML = days.map((day, index) => `
    <button class="day-card ${index === 0 ? "featured" : ""}" type="button" data-day="${day.day}">
      <span class="day-number">DAY ${String(day.day).padStart(2, "0")}</span>
      <strong>${day.label}</strong>
      <small>${day.focus}</small>
    </button>
  `).join("");
  $$(".day-card").forEach((button) => button.addEventListener("click", () => openDay(Number(button.dataset.day))));
}

function renderWeekTabs() {
  const totalDays = selectedMode === "double" ? DOUBLE_DAYS.length : DAYS.length;
  const weekCount = Math.ceil(totalDays / 7);
  $("#weekTabs").innerHTML = Array.from({ length: weekCount }, (_, index) => {
    const week = index + 1;
    return `<button class="week-tab ${week === selectedWeek ? "selected" : ""}" type="button" role="tab" aria-selected="${week === selectedWeek}" data-week="${week}">WEEK ${week}</button>`;
  }).join("");
  $$(".week-tab").forEach((button) => button.addEventListener("click", () => {
    selectedWeek = Number(button.dataset.week);
    $$(".week-tab").forEach((tab) => {
      const selected = tab === button;
      tab.classList.toggle("selected", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    renderDays();
  }));
}

function openDay(dayNumber) {
  selectedDay = (selectedMode === "double" ? DOUBLE_DAYS : DAYS)[dayNumber - 1];
  const active = activeNotesFor(selectedDay);
  const { newNote } = splitActiveNotes(active);
  const oob = oobNotesFor(active, newNote);
  $("#introDay").textContent = `DAY ${String(selectedDay.day).padStart(2, "0")} · ${selectedMode === "double" ? "TWO NOTES" : `${selectedDay.noteCount} PITCH${selectedDay.noteCount === 1 ? "" : "ES"}`} · ${DAILY_TOTAL}問`;
  $("#introTitle").textContent = selectedDay.label;
  $("#introFocus").textContent = selectedDay.focus;
  const { black, white } = partitionByKeyColor(active);
  const introRows = [
    black.length ? `<div class="pitch-row pitch-row-sharps">${black.map((note) => `<span class="pitch-chip">${displayNote(note)}</span>`).join("")}</div>` : "",
    `<div class="pitch-row pitch-row-naturals">${white.map((note) => `<span class="pitch-chip">${displayNote(note)}</span>`).join("")}</div>`
  ].join("");
  $("#introNotes").innerHTML = introRows;
  const sortedActive = sortChromaticallyFromC(active);
  const sortedOob = sortChromaticallyFromC(oob);
  const firstMix = selectedDay.sectionMixes[0];
  $("#introOob").textContent = selectedMode === "double"
    ? selectedDay.enabledPairs.length < 66
      ? `解禁済み：${selectedDay.enabledPairs.length}/66ペア ／ 新規：${pairName(selectedDay.newPair)} ／ 1セクション目：新規${formatPercent(mixRate(firstMix, "new"))}・OOB ${formatPercent(firstMix.oob)} ／ 今日のHard OOB：${sameIntervalHardOobPairsFor(selectedDay).map(pairName).join(" / ") || "なし"}`
      : `解禁済み：66/66ペア ／ 新規：${pairName(selectedDay.newPair)} ／ 全ペア解禁済みのためOOBなし`
    : oob.length
    ? `選択肢：${sortedActive.map(displayNote).join("・")}・OOB ／ OOB候補：${sortedOob.map(displayNote).join("・")}`
    : `選択肢：${sortedActive.map(displayNote).join("・")} ／ 全12音のためOOBはありません。`;
  renderSectionProgram(selectedDay);
  showScreen("introScreen");
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function circularPitchDistance(first, second) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 12 - distance);
}

function allocateByWeight(items, total, weightFor) {
  if (!items.length || total <= 0) return [];
  const weighted = items.map((item) => ({ item, weight: weightFor(item) }));
  const weightTotal = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const allocations = weighted.map((entry) => {
    const exact = total * entry.weight / weightTotal;
    return { ...entry, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = total - allocations.reduce((sum, entry) => sum + entry.count, 0);
  allocations.sort((first, second) => second.remainder - first.remainder);
  for (let index = 0; index < remaining; index += 1) allocations[index % allocations.length].count += 1;
  return allocations;
}

function balancedPitchDeck(pitchClass, count, isOob) {
  const cells = SINGLE_NOTE_OCTAVES.flatMap((octave) =>
    Array.from({ length: SINGLE_NOTE_TIMBRES }, (_, timbre) => ({
      pitchClass,
      midi: (octave + 1) * 12 + pitchClass,
      timbre,
      expected: isOob ? "OOB" : displayNote(pitchClass),
      isOob
    }))
  );
  const deck = [];
  while (deck.length < count) deck.push(...shuffle(cells));
  return deck.slice(0, count);
}

function buildSingleNoteSectionDeck(day, mix, active, oob) {
  const count = mix.count;
  const oobCount = oob.length ? Math.round(count * mix.oob) : 0;
  const targetCount = count - oobCount;
  const { newNote, recentNotes, oldNotes } = splitActiveNotes(active);
  const allocations = allocateSectionTargets(targetCount, mix, {
    new: [newNote],
    recent: recentNotes,
    old: oldNotes
  });
  const targetDeck = allocations.flatMap(({ item, count: allocationCount }) => {
    if (item.key === "new") return balancedPitchDeck(newNote, allocationCount, false);
    if (item.key === "recent") {
      return allocateByWeight(item.items, allocationCount, () => 1)
        .flatMap(({ item: note, count: noteCount }) => balancedPitchDeck(note, noteCount, false));
    }
    return allocateByWeight(item.items, allocationCount, () => 1)
      .flatMap(({ item: note, count: noteCount }) => balancedPitchDeck(note, noteCount, false));
  });
  const oobAllocations = allocateByWeight(oob, oobCount, (pitchClass) => {
    const nearest = Math.min(...active.map((target) => circularPitchDistance(pitchClass, target)));
    return nearest === 1 ? 4 : 1;
  });
  const oobDeck = oobAllocations.flatMap(({ item, count: allocationCount }) => balancedPitchDeck(item, allocationCount, true));
  return shuffle([...targetDeck, ...oobDeck]);
}

function buildTwoNoteSectionDeck(day, mix) {
  const count = mix.count;
  const { recentPairs, oldPairs } = splitReviewPairs(day.enabledPairs, day.newPair);
  const hardOobPairs = sameIntervalHardOobPairsFor(day);
  const oobCount = hardOobPairs.length ? Math.round(count * mix.oob) : 0;
  const targetCount = count - oobCount;
  const allocations = allocateSectionTargets(targetCount, mix, {
    new: [day.newPair],
    recent: recentPairs,
    old: oldPairs
  });
  const trials = allocations.flatMap(({ item, count: allocationCount }) => {
    if (item.key === "new") return buildPairTrials(allocationCount, [day.newPair], day.placements, day.enabledPairs, "newPair");
    if (item.key === "recent") return buildPairTrials(allocationCount, item.items, day.placements, day.enabledPairs, "recentPair");
    return buildPairTrials(allocationCount, item.items, day.placements, day.enabledPairs, "oldPair");
  });
  if (oobCount > 0) {
    trials.push(...buildOobPairTrials(oobCount, hardOobPairs, day, "sameIntervalHardOob"));
  }
  return shuffle(trials);
}

function buildSessionDecks(day, active, oob) {
  return day.sectionMixes.map((mix, index) => {
    let deck = selectedMode === "double"
      ? buildTwoNoteSectionDeck(day, mix)
      : buildSingleNoteSectionDeck(day, mix, active, oob);
    if (selectedMode === "single" && mix.feedback === false) deck = orderWithLargeJumps(deck);
    return deck.map((trial) => ({ ...trial, sectionIndex: index }));
  });
}

function orderWithLargeJumps(deck) {
  const remaining = [...deck];
  const ordered = [];

  while (remaining.length) {
    const previous = ordered[ordered.length - 1];
    let candidates = previous
      ? remaining.filter((trial) => Math.abs(trial.midi - previous.midi) > 12)
      : remaining;

    if (!candidates.length && previous) {
      candidates = remaining.filter((trial) => Math.abs(trial.midi - previous.midi) >= 12);
    }
    if (!candidates.length) candidates = remaining;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    ordered.push(chosen);
    remaining.splice(remaining.indexOf(chosen), 1);
  }

  return ordered;
}

function sortPitchClassesBassOrder(pitchClasses, octaves) {
  const indexed = pitchClasses.map((pitchClass, index) => ({
    pitchClass,
    octave: octaves[index],
    midi: (octaves[index] + 1) * 12 + pitchClass
  }));
  indexed.sort((first, second) => first.midi - second.midi);
  return {
    pitchClasses: indexed.map((entry) => entry.pitchClass),
    octaves: indexed.map((entry) => entry.octave),
    midis: indexed.map((entry) => entry.midi)
  };
}

function normalizedPairKey(pair) {
  return [...pair].sort((first, second) => first - second).join(":");
}

function classifyTwoNotePair(pair, enabledPairs) {
  const enabledPairKeys = new Set(enabledPairs.map(normalizedPairKey));
  return enabledPairKeys.has(normalizedPairKey(pair)) ? "TARGET_PAIR" : "OOB";
}

function makeTwoNoteTrial(pitchClasses, octaves, enabledPairs, trialType) {
  const sorted = sortPitchClassesBassOrder(pitchClasses, octaves);
  const isOob = classifyTwoNotePair(pitchClasses, enabledPairs) === "OOB";
  return {
    pitchClasses: sorted.pitchClasses,
    octaves: sorted.octaves,
    midis: sorted.midis,
    expected: isOob ? ["OOB"] : sorted.pitchClasses.map(displayNote).sort(),
    isOob,
    trialType
  };
}

const PAIR_RANGE_PATTERNS = {
  close: { extraOctaves: 0 },
  octavePlus: { extraOctaves: 1 },
  wide: { extraOctaves: 2 }
};

function rangePatternsForPlacements(placements) {
  if (placements.length <= 1) return ["close"];
  if (placements.length < ALL_PLACEMENTS.length) return ["close", "octavePlus"];
  return Object.keys(PAIR_RANGE_PATTERNS);
}

function orderedPairRangeVariants(pair, placements) {
  const patterns = rangePatternsForPlacements(placements);
  return [0, 1].flatMap((bassIndex) => patterns.map((rangePattern) => {
    const bassPitch = pair[bassIndex];
    const upperPitch = pair[1 - bassIndex];
    const extraOctaves = PAIR_RANGE_PATTERNS[rangePattern].extraOctaves;
    const bassOctave = 4 - extraOctaves;
    let upperOctave = bassOctave;
    while ((upperOctave + 1) * 12 + upperPitch <= (bassOctave + 1) * 12 + bassPitch) {
      upperOctave += 1;
    }
    upperOctave += extraOctaves;
    return {
      pair: [bassPitch, upperPitch],
      octaves: [bassOctave, upperOctave],
      rangePattern
    };
  }));
}

function buildPairTrials(count, pairs, placements, enabledPairs, trialType) {
  if (!pairs.length || count <= 0) return [];
  const pairAllocations = allocateByWeight(pairs, count, () => 1);
  const trials = pairAllocations.flatMap(({ item: pair, count: pairCount }) => {
    const cells = orderedPairRangeVariants(pair, placements);
    const deck = [];
    while (deck.length < pairCount) deck.push(...shuffle(cells));
    return deck.slice(0, pairCount).map(({ pair: orderedPair, octaves, rangePattern }) => ({
      ...makeTwoNoteTrial([...orderedPair], [...octaves], enabledPairs, trialType),
      orderedPair: orderedPair.map(displayNote),
      rangePattern
    }));
  });
  return shuffle(trials);
}

function transposePair(pair, semitones) {
  return pair.map((pitchClass) => (pitchClass + semitones + 12) % 12);
}

function uniquePairs(pairs) {
  const seen = new Set();
  return pairs.filter((pair) => {
    const key = normalizedPairKey(pair);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sameIntervalSharedNotePairs(pair) {
  const distance = circularPitchDistance(pair[0], pair[1]);
  if (distance === 6) return [];
  return uniquePairs(pair.flatMap((fixedNote, fixedIndex) => {
    const targetOther = pair[1 - fixedIndex];
    return [-distance, distance]
      .map((offset) => (fixedNote + offset + 12) % 12)
      .filter((otherNote) => otherNote !== targetOther && otherNote !== fixedNote)
      .map((otherNote) => [fixedNote, otherNote]);
  }));
}

function sameIntervalHardOobPairsFor(day) {
  return uniquePairs([
    ...sameIntervalSharedNotePairs(day.newPair),
    transposePair(day.newPair, -1),
    transposePair(day.newPair, 1)
  ]).filter((pair) => classifyTwoNotePair(pair, day.enabledPairs) === "OOB");
}

function buildOobPairTrials(count, pairs, day, trialType) {
  return buildPairTrials(count, pairs, day.placements, day.enabledPairs, trialType);
}

function researchLimit(noteCount) {
  return Math.round(1183 + ((noteCount - 1) * (2028 - 1183)) / 11);
}

function sectionsFor(day) {
  return day.sectionMixes.map((mix, index) => ({
    id: `section-${index + 1}`,
    index,
    count: mix.count,
    feedback: mix.feedback !== false,
    shepardBefore: Boolean(mix.shepardBefore),
    limit: selectedMode === "double"
      ? null
      : (index >= 4 ? researchLimit(day.noteCount) : index >= 2 ? 3000 : 5000),
    mix
  }));
}

function createSession() {
  const active = activeNotesFor(selectedDay);
  const { newNote } = splitActiveNotes(active);
  const oob = oobNotesFor(active, newNote);
  const sections = sectionsFor(selectedDay);
  const sectionDecks = buildSessionDecks(selectedDay, active, oob);
  session = {
    mode: selectedMode,
    active,
    oob,
    hasOob: selectedMode === "double" ? sameIntervalHardOobPairsFor(selectedDay).length > 0 : oob.length > 0,
    sections,
    sectionIndex: 0,
    pendingSectionIndex: null,
    skippedSections: [],
    trialIndex: 0,
    current: null,
    sectionResults: [],
    results: [],
    accepting: false,
    startedAt: 0,
    selectedAnswers: [],
    sectionDecks,
    sessionStartedAt: new Date().toISOString()
  };
}

async function startSession() {
  try {
    await audio.init();
  } catch (error) {
    alert(error.message);
    return;
  }
  createSession();
  showScreen("trainingScreen");
  renderSection();
}

function currentSection() { return session.sections[session.sectionIndex]; }

function currentSectionDeck() { return session.sectionDecks[session.sectionIndex]; }

function renderSection() {
  const section = currentSection();
  session.trialIndex = 0;
  session.sectionResults = [];
  $("#phaseKicker").textContent = `${String(section.index + 1).padStart(2, "0")} · SECTION`;
  $("#phaseTitle").textContent = section.feedback
    ? `セクション ${section.index + 1}：音を聴き分ける`
    : `セクション ${section.index + 1}：表示なしで確かめる`;
  $("#instructionText").textContent = selectedMode === "double"
    ? (section.feedback ? "解禁済みペアなら音名を2つ、それ以外のペアならOOBを1回押してください。" : "音名を2つ、またはOOBを選んでください。正解は最後まで表示されません。")
    : (section.feedback ? "音を聴き、音名またはOOBを選んでください。" : "このセクションでは、正解は最後まで表示されません。");
  renderAnswers();
  prepareTrial();
}

function answerButtonMarkup(label) {
  return `<button class="answer-button ${label === "OOB" ? "oob" : ""}" type="button" data-answer="${label}" disabled>${label}</button>`;
}

function renderAnswers() {
  const answerNotes = session.active;
  const { black, white } = partitionByKeyColor(answerNotes);
  const whiteLabels = white.map(displayNote);
  if (selectedMode === "double" && session.hasOob) whiteLabels.push("OOB");
  else if (session.oob.length) whiteLabels.push("OOB");
  const blackRow = black.length
    ? `<div class="answer-row answer-row-sharps">${black.map(displayNote).map(answerButtonMarkup).join("")}</div>`
    : "";
  const whiteRow = `<div class="answer-row answer-row-naturals">${whiteLabels.map(answerButtonMarkup).join("")}</div>`;
  const submit = selectedMode === "double"
    ? '<button id="submitAnswerButton" class="answer-submit" type="button" aria-keyshortcuts="Space" disabled>回答する <span>0 / 2</span><kbd>Space</kbd></button>'
    : "";
  $("#answerGrid").innerHTML = blackRow + whiteRow + submit;
  $$(".answer-button").forEach((button) => button.addEventListener("click", () => {
    if (selectedMode === "double" && button.dataset.answer === "OOB") answerTrial(["OOB"]);
    else if (selectedMode === "double") toggleAnswer(button.dataset.answer);
    else answerTrial(button.dataset.answer);
  }));
  $("#submitAnswerButton")?.addEventListener("click", () => answerTrial([...session.selectedAnswers]));
}

function toggleAnswer(answer) {
  if (!session?.accepting) return;
  const index = session.selectedAnswers.indexOf(answer);
  if (index >= 0) {
    session.selectedAnswers.splice(index, 1);
  } else if (session.selectedAnswers.length < 2) {
    session.selectedAnswers.push(answer);
  }

  const counts = session.selectedAnswers.reduce((map, item) => {
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});

  $$(".answer-button").forEach((button) => {
    const count = counts[button.dataset.answer] || 0;
    button.classList.toggle("selected", count > 0);
    button.textContent = button.dataset.answer;
  });

  const submit = $("#submitAnswerButton");
  submit.disabled = session.selectedAnswers.length !== 2;
  submit.querySelector("span").textContent = `${session.selectedAnswers.length} / 2`;
}

function setAnswersEnabled(enabled) {
  $$(".answer-button").forEach((button) => { button.disabled = !enabled; });
  const submit = $("#submitAnswerButton");
  if (submit) submit.disabled = !enabled || session.selectedAnswers.length !== 2;
}

function submitTwoNoteAnswerWithSpace(event) {
  if (event.code !== "Space" || event.repeat || selectedMode !== "double") return;
  if (event.target instanceof Element && event.target.closest("input, textarea, select, dialog")) return;
  const submit = $("#submitAnswerButton");
  if (!session?.accepting || session.paused || !submit || submit.disabled) return;
  event.preventDefault();
  submit.click();
}

function updateProgress() {
  const section = currentSection();
  const total = session.sections.reduce((sum, item) => sum + item.count, 0);
  const completedBefore = session.sections.slice(0, session.sectionIndex).reduce((sum, item) => sum + item.count, 0);
  const overall = ((completedBefore + session.trialIndex) / total) * 100;
  $("#progressText").textContent = `DAY ${String(selectedDay.day).padStart(2, "0")} · SECTION ${section.index + 1}/${session.sections.length}`;
  $("#phaseCounter").textContent = `${Math.min(session.trialIndex + 1, section.count)} / ${section.count}`;
  $("#progressBar").style.width = `${overall}%`;
}

function updatePlaybackControls() {
  const pauseButton = $("#pauseTrialButton");
  if (!pauseButton) return;
  const canPause = Boolean(session?.accepting && !session.paused);
  if (session?.paused) {
    pauseButton.disabled = false;
    pauseButton.innerHTML = '<span class="pause-symbol" aria-hidden="true">▶</span><span>再開</span>';
    pauseButton.setAttribute("aria-label", "再開");
  } else {
    pauseButton.disabled = !canPause;
    pauseButton.innerHTML = '<span class="pause-symbol" aria-hidden="true">⏸</span><span>一時停止</span>';
    pauseButton.setAttribute("aria-label", "一時停止");
  }
}

async function togglePause() {
  if (!session) return;
  if (session.paused) await resumeSession();
  else await pauseSession();
}

async function pauseSession() {
  if (!session?.accepting || session.paused) return;
  clearInterval(timerId);
  session.paused = true;
  session.pauseStartedAt = performance.now();
  setAnswersEnabled(false);
  await audio.pause();
  updatePlaybackControls();
}

async function resumeSession() {
  if (!session?.paused) return;
  session.startedAt += performance.now() - session.pauseStartedAt;
  session.paused = false;
  await audio.resume();
  setAnswersEnabled(true);
  const deadline = currentSection().limit;
  if (deadline) {
    updateTimer(deadline);
    timerId = setInterval(() => updateTimer(deadline), 50);
  }
  updatePlaybackControls();
}

function prepareTrial() {
  clearInterval(timerId);
  session.accepting = false;
  session.paused = false;
  session.current = null;
  session.selectedAnswers = [];
  setAnswersEnabled(false);
  $$(".answer-button").forEach((button) => {
    button.classList.remove("correct", "wrong", "selected");
    button.textContent = button.dataset.answer;
  });
  const submit = $("#submitAnswerButton");
  if (submit) submit.querySelector("span").textContent = "0 / 2";
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#timerValue").textContent = "—";
  $("#timerRing").classList.remove("urgent");
  $("#playTrialButton").disabled = false;
  $("#playTrialButton").innerHTML = '<span class="play-symbol" aria-hidden="true">▶</span><span>音を聴く</span>';
  void audio.resume();
  updatePlaybackControls();
  updateProgress();
}

async function playTrial() {
  if (!session || session.accepting || session.current) return;
  const section = currentSection();
  const trial = currentSectionDeck()[session.trialIndex];
  if (!trial) return;
  if (selectedMode === "double") {
    // The two-note curriculum specifies exact octave placements. Do not pull
    // wide intervals back toward the center: those placements are the lesson.
    trial.timbre = Math.floor(Math.random() * TWO_NOTE_TIMBRES);
  }
  session.current = trial;
  $("#playTrialButton").disabled = true;
  $("#playTrialButton").innerHTML = '<span>再生中…</span>';
  if (selectedMode === "double") await audio.playChord(trial.midis, trial.timbre);
  else await audio.playTone(trial.midi, trial.timbre);
  session.startedAt = performance.now();
  session.accepting = true;
  setAnswersEnabled(true);
  const deadline = section.limit;
  if (deadline) {
    updateTimer(deadline);
    timerId = setInterval(() => updateTimer(deadline), 50);
  } else {
    $("#timerValue").textContent = "∞";
  }
  updatePlaybackControls();
}

function updateTimer(limit) {
  if (!session?.accepting || session.paused) return;
  const left = Math.max(0, limit - (performance.now() - session.startedAt));
  $("#timerValue").textContent = (left / 1000).toFixed(1);
  $("#timerRing").classList.toggle("urgent", left < 800);
  if (left <= 0) answerTrial(null);
}

function answerTrial(answer) {
  if (!session?.accepting || session.paused) return;
  const section = currentSection();
  session.accepting = false;
  session.paused = false;
  clearInterval(timerId);
  void audio.resume();
  setAnswersEnabled(false);
  updatePlaybackControls();
  const rt = Math.round(performance.now() - session.startedAt);
  const normalizedAnswer = selectedMode === "double" && Array.isArray(answer) ? [...answer].sort() : answer;
  const correct = selectedMode === "double"
    ? Array.isArray(normalizedAnswer) && JSON.stringify(normalizedAnswer) === JSON.stringify(session.current.expected)
    : answer === session.current.expected;
  const result = {
    trial: session.results.length + 1,
    section: section.id,
    sectionIndex: section.index,
    question: {
      pitchClasses: selectedMode === "double" ? session.current.pitchClasses.map(displayNote) : [NOTE_NAMES[session.current.pitchClass]],
      midi: selectedMode === "double" ? session.current.midis : [session.current.midi],
      timbre: TIMBRE_NAMES[session.current.timbre],
      ...(selectedMode === "double" ? {
        trialType: session.current.trialType,
        orderedPair: session.current.orderedPair,
        rangePattern: session.current.rangePattern
      } : {})
    },
    answer: normalizedAnswer === null ? null : (Array.isArray(normalizedAnswer) ? normalizedAnswer : [normalizedAnswer]),
    expected: Array.isArray(session.current.expected) ? session.current.expected : [session.current.expected],
    correct,
    outcome: correct ? "correct" : "incorrect",
    reactionTimeMs: rt
  };
  session.sectionResults.push(result);
  session.results.push(result);

  if (section.feedback) {
    const expectedText = selectedMode === "double" && session.current.isOob
      ? `OOB（${session.current.pitchClasses.map(displayNote).join(" + ")}）`
      : Array.isArray(session.current.expected) ? session.current.expected.join(" + ") : session.current.expected;
    const expectedAnswers = Array.isArray(session.current.expected) ? session.current.expected : [session.current.expected];
    const chosenAnswers = answer === null ? [] : (Array.isArray(answer) ? answer : [answer]);
    expectedAnswers.forEach((expected) => {
      $(`.answer-button[data-answer="${expected}"]`)?.classList.add("correct");
    });
    if (!correct) chosenAnswers
      .filter((chosen) => !expectedAnswers.includes(chosen))
      .forEach((chosen) => $(`.answer-button[data-answer="${chosen}"]`)?.classList.add("wrong"));
    $("#feedback").textContent = correct
      ? selectedMode === "double" ? `正解は ${expectedText} · ${rt} ms` : `正解 · ${rt} ms`
      : answer === null ? `時間切れ · 正解は ${expectedText}` : `正解は ${expectedText}`;
    $("#feedback").className = `feedback ${correct ? "good" : "bad"}`;
  } else {
    $("#feedback").textContent = answer === null ? "時間切れ" : "回答を受け付けました";
  }

  session.trialIndex += 1;
  const delay = section.feedback ? 300 : 350;
  window.setTimeout(() => {
    session.current = null;
    if (session.trialIndex >= section.count) finishSection();
    else {
      prepareTrial();
      if (session.results.length >= 1) void playTrial();
    }
  }, delay);
}

function advanceToNextSection() {
  const nextIndex = session.sectionIndex + 1;
  if (nextIndex >= session.sections.length) {
    finishSession();
    return;
  }
  const nextSection = session.sections[nextIndex];
  if (nextSection.shepardBefore) {
    session.pendingSectionIndex = nextIndex;
    startInterference();
    return;
  }
  session.sectionIndex = nextIndex;
  renderSection();
}

function finishSection() {
  advanceToNextSection();
}

function skipCurrentSection() {
  if (!session) return;
  if (!window.confirm(`セクション ${session.sectionIndex + 1} をスキップしますか？このセクションの問題は記録されません。`)) return;
  clearInterval(timerId);
  audio.stopAll();
  session.accepting = false;
  session.current = null;
  session.skippedSections.push({
    section: session.sectionIndex + 1,
    skipped: true,
    skippedAt: new Date().toISOString()
  });
  advanceToNextSection();
}

async function startInterference() {
  showScreen("interferenceScreen");
  let remaining = 20;
  $("#interferenceCountdown").textContent = remaining;
  try { await audio.playShepard(20); } catch (_) { /* Audio was already initialized. */ }
  clearInterval(countdownId);
  countdownId = setInterval(() => {
    remaining -= 1;
    $("#interferenceCountdown").textContent = Math.max(0, remaining);
    if (remaining <= 0) {
      clearInterval(countdownId);
      session.sectionIndex = session.pendingSectionIndex;
      session.pendingSectionIndex = null;
      showScreen("trainingScreen");
      renderSection();
    }
  }, 1000);
}

function buildExportPayload({ partial = false } = {}) {
  const answered = session.results.filter((result) => result.answer !== null);
  const correct = session.results.filter((result) => result.correct);
  const checkSections = session.sections.filter((section) => !section.feedback);
  const checkResults = session.results.filter((result) => checkSections.some((section) => section.id === result.section));
  const checkCorrect = checkResults.filter((result) => result.correct);
  const avgRt = correct.length ? Math.round(correct.reduce((sum, result) => sum + result.reactionTimeMs, 0) / correct.length) : 0;
  const accuracy = session.results.length ? Math.round((correct.length / session.results.length) * 100) : 0;
  const checkAccuracy = checkResults.length ? Math.round((checkCorrect.length / checkResults.length) * 100) : 0;

  return {
    schemaVersion: 2,
    app: "Chroma 56",
    exportedAt: new Date().toISOString(),
    session: {
      version: selectedMode === "double" ? "two-note" : "single-note",
      startedAt: session.sessionStartedAt,
      completedAt: partial ? null : new Date().toISOString(),
      partial,
      day: selectedDay.day,
      currentSection: session.sectionIndex + 1,
      completedSections: partial
        ? session.sectionIndex + (session.trialIndex >= currentSection().count ? 1 : 0)
        : session.sections.length
    },
    task: {
      title: selectedDay.label,
      focus: selectedDay.focus,
      targetPitches: session.active.map(displayNote),
      choices: selectedMode === "double"
        ? [...session.active.map(displayNote), ...(session.hasOob ? ["OOB"] : [])]
        : [...session.active.map(displayNote), ...(session.oob.length ? ["OOB"] : [])],
      oobPitches: selectedMode === "double"
        ? [...new Set(sameIntervalHardOobPairsFor(selectedDay).flat())].map(displayNote)
        : session.oob.map(displayNote),
      tonesPerQuestion: selectedMode === "double" ? 2 : 1,
      oobRule: selectedMode === "double"
        ? "新規ペアと同じインターバルクラスの片音共有型、および新規ペアを半音上下へ平行移動したペアのみをHard OOBとして出題"
        : "新規音の±1/±2未習音を優先し、不足時は既習集合の境界から補充",
      ...(selectedMode === "double" ? {
        pairStage: selectedDay.stage,
        dayInPairStage: selectedDay.dayInStage,
        newPair: selectedDay.newPair.map(displayNote),
        enabledPairs: selectedDay.enabledPairs.map((pair) => pair.map(displayNote)),
        sameIntervalHardOobPairs: sameIntervalHardOobPairsFor(selectedDay)
          .map((pair) => pair.map(displayNote))
      } : {}),
      sections: session.sections.map(({ id, index, count, limit, feedback, shepardBefore, mix }) => ({
        id,
        index,
        count,
        responseLimitMs: limit,
        feedback,
        shepardBefore,
        mix: {
          new: mixRate(mix, "new"),
          recent: mixRate(mix, "recent"),
          old: mixRate(mix, "old"),
          oob: mix.oob ?? 0
        }
      })),
      skippedSections: [...session.skippedSections]
    },
    summary: {
      total: session.results.length,
      accuracyPercent: accuracy,
      checkAccuracyPercent: checkAccuracy,
      meanCorrectReactionTimeMs: avgRt
    },
    trials: session.results
  };
}

function finishSession() {
  audio.stopAll();
  const answered = session.results.filter((result) => result.answer !== null);
  const correct = session.results.filter((result) => result.correct);
  const checkSections = session.sections.filter((section) => !section.feedback);
  const checkResults = session.results.filter((result) => checkSections.some((section) => section.id === result.section));
  const checkCorrect = checkResults.filter((result) => result.correct);
  const avgRt = correct.length ? Math.round(correct.reduce((sum, result) => sum + result.reactionTimeMs, 0) / correct.length) : 0;
  const accuracy = session.results.length ? Math.round((correct.length / session.results.length) * 100) : 0;
  const checkAccuracy = checkResults.length ? Math.round((checkCorrect.length / checkResults.length) * 100) : 0;
  const misses = session.results.filter((result) => !result.correct);
  const missedCounts = misses.reduce((map, result) => {
    result.expected.filter((note) => note !== "OOB").forEach((note) => map.set(note, (map.get(note) || 0) + 1));
    return map;
  }, new Map());
  const weakest = [...missedCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([note]) => note);

  $("#resultSubtitle").textContent = `DAY ${String(selectedDay.day).padStart(2, "0")} · ${session.results.length}問を完了`;
  $("#accuracyResult").textContent = `${accuracy}%`;
  $("#rtResult").textContent = avgRt ? `${(avgRt / 1000).toFixed(2)}秒` : "—";
  $("#testResult").textContent = checkResults.length ? `${checkAccuracy}%` : "—";
  $("#confusionResult").textContent = weakest.length
    ? `今日、輪郭が曖昧だった音：${weakest.join("・")}。次回は最初の試聴で、この音だけ少し丁寧に聴いてみてください。`
    : answered.length ? "今日は特定の音に偏った間違いがありませんでした。" : "回答された問題がありませんでした。";
  completedExport = buildExportPayload({ partial: false });
  showScreen("resultScreen");
}

function saveJson({ partial = false } = {}) {
  const payload = partial && session ? buildExportPayload({ partial: true }) : completedExport;
  if (!payload) return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const version = payload.session.version;
  const suffix = partial ? "-partial" : "";
  link.href = url;
  link.download = `chroma56-${version}-day-${String(selectedDay.day).padStart(2, "0")}${suffix}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function quitSession() {
  clearInterval(timerId);
  clearInterval(countdownId);
  audio.stopAll();
  void audio.resume();
  session = null;
  showScreen("homeScreen");
}

function goHome() {
  if (session) quitSession();
  session = null;
  showScreen("modeScreen");
}

function showDays() {
  if (session) {
    clearInterval(timerId);
    clearInterval(countdownId);
    audio.stopAll();
    void audio.resume();
    session = null;
  }
  showScreen("homeScreen");
}

function selectMode(mode) {
  selectedMode = mode;
  selectedWeek = 1;
  selectedDay = (mode === "double" ? DOUBLE_DAYS : DAYS)[0];
  $("#versionEyebrow").textContent = mode === "double" ? "264 DAYS · 66-PAIR / TWO-NOTE TRAINING" : "8 WEEKS · SINGLE-NOTE TRAINING";
  $("#versionCopy").textContent = mode === "double"
    ? "12音から作る66個の無順序ペアを、1ペア4日ずつ積み上げる264日間です。"
    : "成人の絶対音感学習研究をもとに、Fから全12音へ段階的に広げる8週間。";
  $("#trainingAbout").textContent = mode === "double"
    ? "E–Fから始め、毎ステージ1ペアだけ解禁します。1日300問（60×5セクション）で、Dayごとに新規・直近・累積の配分が変わります。"
    : "各音を「記憶・境界・速度・定着」の4段階で学びます。1日300問（60×5セクション）で、新規音を焼き付けてから累積復習へ進みます。";
  renderWeekTabs();
  renderDays();
  showScreen("homeScreen");
}

$$('[data-action="modes"]').forEach((button) => button.addEventListener("click", goHome));
$$('[data-action="days"]').forEach((button) => button.addEventListener("click", showDays));
$$('[data-mode]').forEach((button) => button.addEventListener("click", () => selectMode(button.dataset.mode)));
$$('[data-action="quit"]').forEach((button) => button.addEventListener("click", quitSession));
$("#homeButton").addEventListener("click", goHome);
$("#startSessionButton").addEventListener("click", startSession);
$("#playTrialButton").addEventListener("click", playTrial);
$("#pauseTrialButton").addEventListener("click", () => { void togglePause(); });
$("#retryButton").addEventListener("click", startSession);
$("#saveJsonButton").addEventListener("click", () => saveJson());
$("#exportPartialButton")?.addEventListener("click", () => saveJson({ partial: true }));
$("#skipSectionButton")?.addEventListener("click", skipCurrentSection);
$("#soundButton").addEventListener("click", () => $("#volumeDialog").showModal());
$("#volumeSlider").addEventListener("input", (event) => {
  const percent = Number(event.target.value);
  $("#volumeOutput").textContent = `${percent}%`;
  audio.setVolume(percent / 100);
});
document.addEventListener("keydown", submitTwoNoteAnswerWithSpace);

selectMode("single");
showScreen("modeScreen");
