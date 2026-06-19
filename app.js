"use strict";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const DUAL_NOTE_NAMES = { 1: "C#/Db", 3: "D#/Eb", 6: "F#/Gb", 8: "G#/Ab", 10: "A#/Bb" };
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const ADDITION_ORDER = [5, 4, 6, 3, 7, 2, 8, 1, 9, 0, 10, 11];
const LEVEL_BLUEPRINTS = [
  { level: "記憶", focus: "新しい音の輪郭を、5つの音色で結びつける", counts: [80, 40, 40] },
  { level: "境界", focus: "対象外音と隣接音の境界を聞き分ける", counts: [60, 50, 50] },
  { level: "速度", focus: "考えて比較する前に音名を選ぶ", counts: [50, 60, 50] },
  { level: "定着", focus: "フィードバックなしで90%を目指す", counts: [40, 40, 80] }
];

const OOB_RATES = { "記憶": 0.25, "境界": 0.5, "速度": 0.3, "定着": 0.25 };
const SINGLE_NOTE_OCTAVES = [4, 5, 6];
const SINGLE_NOTE_TIMBRES = 5;

const FINAL_LEVELS = [
  ["全音統合", "全12音のカテゴリーをひとつに統合する", [50, 40, 70]],
  ["音色汎化", "5つの音色が変わっても同じ音名を捉える", [50, 40, 70]],
  ["音域汎化", "3オクターブを越えてクロマを捉える", [40, 50, 70]],
  ["近接音", "半音隣の取り違えを減らす", [50, 50, 60]],
  ["高速判断", "全12音を2秒前後で判断する", [40, 60, 60]],
  ["無参照", "正解音を手がかりにせず判断する", [30, 40, 90]],
  ["最終リハーサル", "精度と速度を同時に整える", [30, 30, 100]],
  ["FINAL CHECK", "全12音の最終確認", [20, 20, 120]]
];

const DAYS = [];
ADDITION_ORDER.forEach((pitchClass, pitchIndex) => {
  LEVEL_BLUEPRINTS.forEach((blueprint, levelIndex) => {
    const day = pitchIndex * 4 + levelIndex + 1;
    const prefix = pitchIndex === 0 ? NOTE_NAMES[pitchClass] : `+ ${NOTE_NAMES[pitchClass]}`;
    DAYS.push({
      day,
      noteCount: pitchIndex + 1,
      label: `${prefix} · ${blueprint.level}`,
      focus: blueprint.focus,
      counts: blueprint.counts,
      level: blueprint.level
    });
  });
});
FINAL_LEVELS.forEach((item, index) => DAYS.push({
  day: 49 + index,
  noteCount: 12,
  label: item[0],
  focus: item[1],
  counts: item[2],
  level: item[0]
}));

const TWO_NOTE_ACTIVE = [4, 5, 9, 10]; // E, F, A, Bb
const TWO_NOTE_OOB_POOL = [3, 6, 8, 11]; // Eb, F#, Ab, B — just outside E/F/A/Bb
const TWO_NOTE_PAIRS = [[4, 5], [4, 9], [4, 10], [5, 9], [5, 10], [9, 10]];
const START_PLACEMENTS = [[4, 4], [3, 4], [4, 3]];
const TWO_NOTE_TIMBRES = 5;
const TWO_NOTE_OOB_RATES = {
  memory: { targetTarget: 0.70, oneOob: 0.25, twoOob: 0.05 },
  boundary: { targetTarget: 0.50, oneOob: 0.40, twoOob: 0.10 }
};
const SAME_OCTAVE = [[3, 3], [4, 4], [5, 5]];
const ONE_MOVES = [[4, 4], [3, 4], [5, 4], [4, 3], [4, 5]];
const ALL_PLACEMENTS = [3, 4, 5].flatMap((first) => [3, 4, 5].map((second) => [first, second]));
const pairName = (pair) => pair.map((note) => note === 10 ? "Bb" : NOTE_NAMES[note]).join(" + ");
const pairSet = (...indexes) => indexes.map((index) => TWO_NOTE_PAIRS[index]);
const doubleDay = (label, focus, pairs, placements, options = {}) => ({
  active: TWO_NOTE_ACTIVE,
  noteCount: 4,
  label,
  focus,
  pairs,
  placements,
  counts: options.counts || [18, 18, 18],
  timeLimit: options.timeLimit || null,
  level: options.level || "2音分離"
});

const DOUBLE_DAY_BLUEPRINTS = [
  // Week 1 — one pair at a time, with mild register contrast from day one.
  ...TWO_NOTE_PAIRS.map((pair) => doubleDay(`${pairName(pair)} · はじめの輪郭`, `中央の${pairName(pair)}だけを反復し、2音を別々の名前として結びます。`, [pair], START_PLACEMENTS)),
  doubleDay("中央6ペア · 初統合", "6種類を混ぜます。響きの名前ではなく、含まれる2音を選びます。", TWO_NOTE_PAIRS, START_PLACEMENTS),

  // Week 2 — contrast pairs sharing one pitch.
  doubleDay("Eを固定 · 相方3音", "Eは必ず含まれます。F・A・Bbのどれが相方かを切り分けます。", pairSet(0, 1, 2), [[4, 4]]),
  doubleDay("Fを固定 · 相方3音", "Fをアンカーにし、E・A・Bbの違いだけへ注意を向けます。", pairSet(0, 3, 4), [[4, 4]]),
  doubleDay("Aを固定 · 相方3音", "Aをアンカーにし、E・F・Bbを個別に検出します。", pairSet(1, 3, 5), [[4, 4]]),
  doubleDay("Bbを固定 · 相方3音", "Bbをアンカーにし、E・F・Aの取り違えを減らします。", pairSet(2, 4, 5), [[4, 4]]),
  doubleDay("半音ペア · 片方を落とさない", "E+FとA+Bbを比較し、濁りを1個の塊として処理しない練習です。", pairSet(0, 5), [[4, 4]]),
  doubleDay("特徴的な響き · 音名へ戻す", "E+Bb、F+A、E+A、F+Bbを響きの型だけで答えず、構成音へ戻します。", pairSet(1, 2, 3, 4), [[4, 4]]),
  doubleDay("中央6ペア · 再統合", "共通音ごとの聞き分けを、もう一度6ペア全体へ戻します。", TWO_NOTE_PAIRS, START_PLACEMENTS),

  // Week 3 — keep both notes in the same octave before crossing registers.
  doubleDay("低音域 · Eを含む3ペア", "両方を第3オクターブへ下げ、Eの音色を低域でも保ちます。", pairSet(0, 1, 2), [[3, 3]]),
  doubleDay("低音域 · E以外の3ペア", "低域のF・A・Bbを、塊にせず2音へ分けます。", pairSet(3, 4, 5), [[3, 3]]),
  doubleDay("高音域 · Eを含む3ペア", "両方を第5オクターブへ上げても、Eを同じ音名として拾います。", pairSet(0, 1, 2), [[5, 5]]),
  doubleDay("高音域 · E以外の3ペア", "高域でF・A・Bbの輪郭が細くなっても、2音を保ちます。", pairSet(3, 4, 5), [[5, 5]]),
  doubleDay("半音ペア · 3音域", "E+FとA+Bbを低・中・高の同一オクターブで比較します。", pairSet(0, 5), SAME_OCTAVE),
  doubleDay("安定ペア · 3音域", "E+A、F+Bb、F+Aを3音域で同じピッチクラス集合として捉えます。", pairSet(1, 3, 4), SAME_OCTAVE),
  doubleDay("同一オクターブ · 18配置", "6ペア×3音域を統合します。まだ上下を大きく離しません。", TWO_NOTE_PAIRS, SAME_OCTAVE),

  // Week 4 — introduce each direction of one-note octave movement separately.
  doubleDay("第1音を低く · E始まり", "E3+F/A/Bb4。Eが下声へ移っても存在を落とさない練習です。", pairSet(0, 1, 2), [[3, 4]]),
  doubleDay("第1音を低く · F/A始まり", "F3またはA3が下声になる配置だけを扱います。", pairSet(3, 4, 5), [[3, 4]]),
  doubleDay("第1音を高く · E始まり", "E5+F/A/Bb4。表記順と実際の上下を切り離します。", pairSet(0, 1, 2), [[5, 4]]),
  doubleDay("第1音を高く · F/A始まり", "F5またはA5が上声になる配置だけを扱います。", pairSet(3, 4, 5), [[5, 4]]),
  doubleDay("第2音を低く · E始まり", "E4の下にF/A/Bb3が来ても、答えの順番は変えません。", pairSet(0, 1, 2), [[4, 3]]),
  doubleDay("第2音を低く · F/A始まり", "F4・A4の下に相方を置き、低い音だけへ偏る癖を崩します。", pairSet(3, 4, 5), [[4, 3]]),
  doubleDay("片方移動 · 30配置", "中央と上下4方向を混ぜ、6ペア×5配置を統合します。", TWO_NOTE_PAIRS, ONE_MOVES),

  // Week 5 — exhaust all nine placements one pair at a time.
  ...TWO_NOTE_PAIRS.map((pair) => doubleDay(`${pairName(pair)} · 3×3全配置`, `${pairName(pair)}の9配置をすべて巡回し、上下順と音域への依存を外します。`, [pair], ALL_PLACEMENTS)),
  doubleDay("54配置 · はじめの全統合", "6ペア×9配置を1回ずつ巡回します。ここが4音2音版の全体像です。", TWO_NOTE_PAIRS, ALL_PLACEMENTS),

  // Week 6 — isolate positional listening biases.
  doubleDay("下声がターゲット · E/F", "EまたはFを必ず下声に置き、下側の音名を先に確保します。", pairSet(0, 1, 2, 3, 4), [[3, 4], [3, 5], [4, 5]]),
  doubleDay("上声がターゲット · E/F", "EまたはFを上声に回し、低い音だけで回答する癖を抑えます。", pairSet(0, 1, 2, 3, 4), [[4, 3], [5, 3], [5, 4]]),
  doubleDay("下声がターゲット · A/Bb", "AまたはBbが低い側に来る配置へ注意を集中します。", pairSet(1, 2, 3, 4, 5), [[3, 4], [3, 5], [4, 5]]),
  doubleDay("上声がターゲット · A/Bb", "AまたはBbが高い側へ回っても、その存在を落とさない練習です。", pairSet(1, 2, 3, 4, 5), [[4, 3], [5, 3], [5, 4]]),
  doubleDay("2オクターブ開離 · 上昇", "第3から第5オクターブへ開く配置だけを反復します。", TWO_NOTE_PAIRS, [[3, 5]]),
  doubleDay("2オクターブ開離 · 下降", "第5から第3オクターブへ反転した配置だけを反復します。", TWO_NOTE_PAIRS, [[5, 3]]),
  doubleDay("開離配置 · 双方向", "3→5と5→3を混ぜ、上下反転しても同じ答えへ戻します。", TWO_NOTE_PAIRS, [[3, 5], [5, 3]]),

  // Week 7 — difficult contrasts, now with all placements.
  doubleDay("半音2組 · 全配置", "E+FとA+Bbを9配置で反復し、片方だけ聞こえたつもりになる癖を減らします。", pairSet(0, 5), ALL_PLACEMENTS),
  doubleDay("Eの相方 · 全配置", "Eを含む3ペアを全配置で比較し、相方の取り違えを詰めます。", pairSet(0, 1, 2), ALL_PLACEMENTS),
  doubleDay("Fの相方 · 全配置", "Fを含む3ペアを全配置で比較します。", pairSet(0, 3, 4), ALL_PLACEMENTS),
  doubleDay("Aの相方 · 全配置", "Aを含む3ペアを全配置で比較します。", pairSet(1, 3, 5), ALL_PLACEMENTS),
  doubleDay("Bbの相方 · 全配置", "Bbを含む3ペアを全配置で比較します。", pairSet(2, 4, 5), ALL_PLACEMENTS),
  doubleDay("響きが強い3組 · 全配置", "E+Bb、F+A、F+Bbをテンプレートではなく構成音として答えます。", pairSet(2, 3, 4), ALL_PLACEMENTS),
  doubleDay("54配置 · 4秒", "全配置を巡回し、4秒以内で2音を決めます。時間切れでも翌日へ進めます。", TWO_NOTE_PAIRS, ALL_PLACEMENTS, { timeLimit: 4000 }),

  // Week 8 — repeated full passes; progression is by day, never by score.
  doubleDay("54配置 · 精度優先", "制限を外して全54配置をもう一巡し、聞き直さず2音を分けます。", TWO_NOTE_PAIRS, ALL_PLACEMENTS),
  doubleDay("54配置 · 4秒", "全54配置を4秒で巡回します。成績は次の日をロックしません。", TWO_NOTE_PAIRS, ALL_PLACEMENTS, { timeLimit: 4000 }),
  doubleDay("54配置 · 3.5秒", "判断時間を少しだけ縮め、配置ではなく音名へ直接つなぎます。", TWO_NOTE_PAIRS, ALL_PLACEMENTS, { timeLimit: 3500 }),
  doubleDay("54配置 · 3秒", "全54配置を3秒で巡回します。", TWO_NOTE_PAIRS, ALL_PLACEMENTS, { timeLimit: 3000 }),
  doubleDay("半音補強 + 全体", "前半は半音2組、後半は全54配置の感覚で弱点と全体を往復します。", [...pairSet(0, 5), ...TWO_NOTE_PAIRS], ALL_PLACEMENTS, { timeLimit: 3500 }),
  doubleDay("54配置 · 最終リハーサル", "音域・上下順を予測せず、E/F/A/Bbの存在だけを拾います。", TWO_NOTE_PAIRS, ALL_PLACEMENTS, { timeLimit: 3000 }),
  doubleDay("54配置 · 完走", "合否判定はありません。今日の54配置を終えたら、4音セットの1周完了です。", TWO_NOTE_PAIRS, ALL_PLACEMENTS, { timeLimit: 3000 })
];

const DOUBLE_DAYS = DOUBLE_DAY_BLUEPRINTS.map((day, index) => ({ ...day, day: index + 1 }));

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
  return DUAL_NOTE_NAMES[note] || NOTE_NAMES[note];
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

function oobNotesFor(active) {
  if (selectedMode === "double") return TWO_NOTE_OOB_POOL;
  if (active.length === 12) return [];
  const raw = [Math.min(...active) - 2, Math.min(...active) - 1, Math.max(...active) + 1, Math.max(...active) + 2];
  return [...new Set(raw.map((note) => (note + 12) % 12))].filter((note) => !active.includes(note));
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
  const weekCount = 8;
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
  const oob = oobNotesFor(active);
  $("#introDay").textContent = `DAY ${String(selectedDay.day).padStart(2, "0")} · ${selectedMode === "double" ? "TWO NOTES" : `${selectedDay.noteCount} PITCH${selectedDay.noteCount === 1 ? "" : "ES"}`}`;
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
  $("#introOob").textContent = selectedMode === "double"
    ? `選択肢：${sortedActive.map(displayNote).join("・")}・OOB ／ OOB候補：${sortedOob.map(displayNote).join("・")} ／ 未知音はOOBで答えます。`
    : oob.length
    ? `選択肢：${sortedActive.map(displayNote).join("・")}・OOB ／ OOB候補：${sortedOob.map(displayNote).join("・")}`
    : `選択肢：${sortedActive.map(displayNote).join("・")} ／ 全12音のためOOBはありません。`;
  $("#learnProgram").textContent = `${selectedDay.counts[0]}問 · フィードバックあり`;
  $("#speedProgramLabel").textContent = selectedMode === "double" && !selectedDay.timeLimit ? "反復" : "速度";
  $("#speedProgram").textContent = selectedMode === "double" && !selectedDay.timeLimit
    ? `${selectedDay.counts[1]}問 · 制限なし`
    : `${selectedDay.counts[1]}問 · ${((selectedDay.timeLimit || 3000) / 1000).toFixed(1)}秒以内`;
  $("#testProgram").textContent = `${selectedDay.counts[2]}問 · フィードバックなし`;
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

function buildSingleNoteDeck(day, active, oob) {
  const total = day.counts.reduce((sum, count) => sum + count, 0);
  const oobRate = oob.length ? (OOB_RATES[day.level] ?? 0.25) : 0;
  const oobCount = Math.round(total * oobRate);
  const targetCount = total - oobCount;

  const targetAllocations = allocateByWeight(active, targetCount, () => 1);
  const targetDeck = targetAllocations.flatMap(({ item, count }) => balancedPitchDeck(item, count, false));

  // Immediate neighbors receive four times the weight of two-semitone
  // neighbors. For F boundary day this produces F 50%, E/F# 20% each,
  // and D#/G 5% each across the complete session.
  const oobAllocations = allocateByWeight(oob, oobCount, (pitchClass) => {
    const nearest = Math.min(...active.map((target) => circularPitchDistance(pitchClass, target)));
    return nearest === 1 ? 4 : 1;
  });
  const oobDeck = oobAllocations.flatMap(({ item, count }) => balancedPitchDeck(item, count, true));
  return shuffle([...targetDeck, ...oobDeck]);
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

function orderSingleNoteTestTrials(deck, phases) {
  const testPhase = phases.find((phase) => phase.id === "test");
  if (!testPhase) return deck;

  const testStart = phases
    .slice(0, phases.indexOf(testPhase))
    .reduce((sum, phase) => sum + phase.count, 0);
  const testEnd = testStart + testPhase.count;
  return [
    ...deck.slice(0, testStart),
    ...orderWithLargeJumps(deck.slice(testStart, testEnd)),
    ...deck.slice(testEnd)
  ];
}

function twoNoteOobRatesFor(day) {
  return day.day <= 14 ? TWO_NOTE_OOB_RATES.memory : TWO_NOTE_OOB_RATES.boundary;
}

function expectedForTwoNote(pitchClasses, active) {
  return pitchClasses
    .map((pitchClass) => (active.includes(pitchClass) ? displayNote(pitchClass) : "OOB"))
    .sort();
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

function makeTwoNoteTrial(pitchClasses, octaves, active) {
  const sorted = sortPitchClassesBassOrder(pitchClasses, octaves);
  return {
    pitchClasses: sorted.pitchClasses,
    octaves: sorted.octaves,
    midis: sorted.midis,
    expected: expectedForTwoNote(sorted.pitchClasses, active),
    isOob: sorted.pitchClasses.some((pitchClass) => !active.includes(pitchClass))
  };
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildTargetTargetTrials(count, day, active) {
  const base = day.pairs.flatMap((pair) => day.placements.map((octaves) => ({ pair, octaves })));
  const deck = [];
  while (deck.length < count) deck.push(...shuffle(base));
  return deck.slice(0, count).map(({ pair, octaves }) => makeTwoNoteTrial([...pair], [...octaves], active));
}

function buildOneOobTrials(count, day, active, oob) {
  const dayActiveNotes = [...new Set(day.pairs.flat())];
  return Array.from({ length: count }, () => {
    const activeNote = pickRandom(dayActiveNotes);
    const oobNote = pickRandom(oob);
    const placement = pickRandom(day.placements);
    return makeTwoNoteTrial([activeNote, oobNote], [...placement], active);
  });
}

function buildTwoOobTrials(count, day, active, oob) {
  return Array.from({ length: count }, () => {
    const [oobNote1, oobNote2] = shuffle(oob).slice(0, 2);
    const placement = pickRandom(day.placements);
    return makeTwoNoteTrial([oobNote1, oobNote2], [...placement], active);
  });
}

function buildTwoNoteDeck(day, active, oob) {
  const total = day.counts.reduce((sum, count) => sum + count, 0);
  if (!oob.length) return buildTargetTargetTrials(total, day, active);

  const rates = twoNoteOobRatesFor(day);
  const targetTargetCount = Math.round(total * rates.targetTarget);
  const oneOobCount = Math.round(total * rates.oneOob);
  const twoOobCount = total - targetTargetCount - oneOobCount;

  return shuffle([
    ...buildTargetTargetTrials(targetTargetCount, day, active),
    ...buildOneOobTrials(oneOobCount, day, active, oob),
    ...buildTwoOobTrials(twoOobCount, day, active, oob)
  ]);
}

function researchLimit(noteCount) {
  return Math.round(1183 + ((noteCount - 1) * (2028 - 1183)) / 11);
}

function phasesFor(day) {
  const doubleLimit = selectedMode === "double" ? day.timeLimit : null;
  return [
    { id: "learn", title: "今日の配置を聴き分ける", kicker: "01 · LISTEN", count: day.counts[0], limit: doubleLimit || (selectedMode === "single" ? 5000 : null), feedback: true },
    { id: "speed", title: doubleLimit ? "時間内に2音を決める" : "同じ課題をもう一巡", kicker: "02 · REPEAT", count: day.counts[1], limit: doubleLimit || (selectedMode === "single" ? 3000 : null), feedback: true },
    { id: "test", title: "表示なしで確かめる", kicker: "04 · CHECK", count: day.counts[2], limit: doubleLimit || (selectedMode === "single" ? researchLimit(day.noteCount) : null), feedback: false }
  ];
}

function createSession() {
  const active = activeNotesFor(selectedDay);
  const oob = oobNotesFor(active);
  const phases = phasesFor(selectedDay);
  const trialDeck = selectedMode === "double"
    ? buildTwoNoteDeck(selectedDay, active, oob)
    : orderSingleNoteTestTrials(buildSingleNoteDeck(selectedDay, active, oob), phases);
  session = {
    mode: selectedMode,
    active,
    oob,
    phases,
    phaseIndex: 0,
    trialIndex: 0,
    current: null,
    phaseResults: [],
    results: [],
    accepting: false,
    startedAt: 0,
    selectedAnswers: [],
    trialDeck,
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
  renderPhase();
}

function currentPhase() { return session.phases[session.phaseIndex]; }

function renderPhase() {
  const phase = currentPhase();
  session.trialIndex = 0;
  session.phaseResults = [];
  $("#phaseKicker").textContent = phase.kicker;
  $("#phaseTitle").textContent = phase.title;
  $("#instructionText").textContent = selectedMode === "double"
    ? (phase.feedback ? "聴こえた2音をE・F・A・BbまたはOOBから選び、「回答する」を押してください。未知音はOOBを2回選べます。" : "2音を選んで回答してください。正解は最後まで表示されません。")
    : (phase.feedback ? "音を聴き、音名またはOOBを選んでください。" : "このセクションでは、正解は最後まで表示されません。");
  renderAnswers();
  prepareTrial();
}

function answerButtonMarkup(label) {
  return `<button class="answer-button ${label === "OOB" ? "oob" : ""}" type="button" data-answer="${label}" disabled>${label}</button>`;
}

function renderAnswers() {
  const { black, white } = partitionByKeyColor(session.active);
  const whiteLabels = white.map(displayNote);
  if (session.oob.length) whiteLabels.push("OOB");
  const blackRow = black.length
    ? `<div class="answer-row answer-row-sharps">${black.map(displayNote).map(answerButtonMarkup).join("")}</div>`
    : "";
  const whiteRow = `<div class="answer-row answer-row-naturals">${whiteLabels.map(answerButtonMarkup).join("")}</div>`;
  const submit = selectedMode === "double"
    ? '<button id="submitAnswerButton" class="answer-submit" type="button" disabled>回答する <span>0 / 2</span></button>'
    : "";
  $("#answerGrid").innerHTML = blackRow + whiteRow + submit;
  $$(".answer-button").forEach((button) => button.addEventListener("click", () => {
    if (selectedMode === "double") toggleAnswer(button.dataset.answer);
    else answerTrial(button.dataset.answer);
  }));
  $("#submitAnswerButton")?.addEventListener("click", () => answerTrial([...session.selectedAnswers]));
}

function toggleAnswer(answer) {
  if (!session?.accepting) return;
  const index = session.selectedAnswers.indexOf(answer);
  if (answer !== "OOB" && index >= 0) session.selectedAnswers.splice(index, 1);
  else if (session.selectedAnswers.length < 2) session.selectedAnswers.push(answer);
  else return;
  const counts = session.selectedAnswers.reduce((map, item) => ({ ...map, [item]: (map[item] || 0) + 1 }), {});
  $$(".answer-button").forEach((button) => {
    const count = counts[button.dataset.answer] || 0;
    button.classList.toggle("selected", count > 0);
    button.textContent = button.dataset.answer === "OOB" && count > 1 ? "OOB ×2" : button.dataset.answer;
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

function updateProgress() {
  const phase = currentPhase();
  const total = session.phases.reduce((sum, item) => sum + item.count, 0);
  const completedBefore = session.phases.slice(0, session.phaseIndex).reduce((sum, item) => sum + item.count, 0);
  const overall = ((completedBefore + session.trialIndex) / total) * 100;
  $("#progressText").textContent = `DAY ${String(selectedDay.day).padStart(2, "0")} · ${phase.id.toUpperCase()}`;
  $("#phaseCounter").textContent = `${Math.min(session.trialIndex + 1, phase.count)} / ${phase.count}`;
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
  const deadline = currentPhase().limit;
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
  const phase = currentPhase();
  const trial = session.trialDeck[session.results.length];
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
  const deadline = phase.limit;
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
  const phase = currentPhase();
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
    phase: phase.id,
    question: {
      pitchClasses: selectedMode === "double" ? session.current.pitchClasses.map(displayNote) : [NOTE_NAMES[session.current.pitchClass]],
      midi: selectedMode === "double" ? session.current.midis : [session.current.midi],
      timbre: TIMBRE_NAMES[session.current.timbre]
    },
    answer: normalizedAnswer === null ? null : (Array.isArray(normalizedAnswer) ? normalizedAnswer : [normalizedAnswer]),
    expected: Array.isArray(session.current.expected) ? session.current.expected : [session.current.expected],
    correct,
    outcome: correct ? "correct" : "incorrect",
    reactionTimeMs: rt
  };
  session.phaseResults.push(result);
  session.results.push(result);

  if (phase.feedback) {
    const expectedText = Array.isArray(session.current.expected) ? session.current.expected.join(" + ") : session.current.expected;
    if (selectedMode === "single") {
      const expectedButton = $(`.answer-button[data-answer="${session.current.expected}"]`);
      const chosenButton = answer ? $(`.answer-button[data-answer="${answer}"]`) : null;
      if (expectedButton) expectedButton.classList.add("correct");
      if (!correct && chosenButton) chosenButton.classList.add("wrong");
    }
    $("#feedback").textContent = correct ? `正解 · ${rt} ms` : answer === null ? `時間切れ · 正解は ${expectedText}` : `正解は ${expectedText}`;
    $("#feedback").className = `feedback ${correct ? "good" : "bad"}`;
  } else {
    $("#feedback").textContent = answer === null ? "時間切れ" : "回答を受け付けました";
  }

  session.trialIndex += 1;
  const delay = phase.feedback ? 900 : 350;
  window.setTimeout(() => {
    session.current = null;
    if (session.trialIndex >= phase.count) finishPhase();
    else {
      prepareTrial();
      if (session.results.length >= 1) void playTrial();
    }
  }, delay);
}

function finishPhase() {
  if (session.phaseIndex === 0) {
    session.phaseIndex = 1;
    renderPhase();
  } else if (session.phaseIndex === 1) {
    startInterference();
  } else {
    finishSession();
  }
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
      session.phaseIndex = 2;
      showScreen("trainingScreen");
      renderPhase();
    }
  }, 1000);
}

function finishSession() {
  audio.stopAll();
  const answered = session.results.filter((result) => result.answer !== null);
  const correct = session.results.filter((result) => result.correct);
  const test = session.results.filter((result) => result.phase === "test");
  const testCorrect = test.filter((result) => result.correct);
  const avgRt = correct.length ? Math.round(correct.reduce((sum, result) => sum + result.reactionTimeMs, 0) / correct.length) : 0;
  const accuracy = Math.round((correct.length / session.results.length) * 100);
  const testAccuracy = Math.round((testCorrect.length / test.length) * 100);
  const misses = session.results.filter((result) => !result.correct);
  const missedCounts = misses.reduce((map, result) => {
    result.expected.filter((note) => note !== "OOB").forEach((note) => map.set(note, (map.get(note) || 0) + 1));
    return map;
  }, new Map());
  const weakest = [...missedCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([note]) => note);

  $("#resultSubtitle").textContent = `DAY ${String(selectedDay.day).padStart(2, "0")} · ${session.results.length}問を完了`;
  $("#accuracyResult").textContent = `${accuracy}%`;
  $("#rtResult").textContent = avgRt ? `${(avgRt / 1000).toFixed(2)}秒` : "—";
  $("#testResult").textContent = `${testAccuracy}%`;
  $("#confusionResult").textContent = weakest.length
    ? `今日、輪郭が曖昧だった音：${weakest.join("・")}。次回は最初の試聴で、この音だけ少し丁寧に聴いてみてください。`
    : answered.length ? "今日は特定の音に偏った間違いがありませんでした。" : "回答された問題がありませんでした。";
  completedExport = {
    schemaVersion: 1,
    app: "Chroma 56",
    exportedAt: new Date().toISOString(),
    session: {
      version: selectedMode === "double" ? "two-note" : "single-note",
      startedAt: session.sessionStartedAt,
      completedAt: new Date().toISOString(),
      day: selectedDay.day
    },
    task: {
      title: selectedDay.label,
      focus: selectedDay.focus,
      targetPitches: session.active.map(displayNote),
      choices: [...session.active.map(displayNote), ...(session.oob.length ? ["OOB"] : [])],
      oobPitches: session.oob.map(displayNote),
      tonesPerQuestion: selectedMode === "double" ? 2 : 1,
      oobRule: selectedMode === "double" ? "未知音1音につきOOBを1回選択" : "対象外音はOOBを選択",
      phases: session.phases.map(({ id, count, limit, feedback }) => ({ id, count, responseLimitMs: limit, feedback }))
    },
    summary: { total: session.results.length, accuracyPercent: accuracy, testAccuracyPercent: testAccuracy, meanCorrectReactionTimeMs: avgRt },
    trials: session.results
  };
  showScreen("resultScreen");
}

function saveJson() {
  if (!completedExport) return;
  const blob = new Blob([JSON.stringify(completedExport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const version = completedExport.session.version;
  link.href = url;
  link.download = `chroma56-${version}-day-${String(selectedDay.day).padStart(2, "0")}-${new Date().toISOString().slice(0, 10)}.json`;
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
  $("#versionEyebrow").textContent = mode === "double" ? "56 DAYS · FOUR-PITCH / TWO-NOTE TRAINING" : "8 WEEKS · SINGLE-NOTE TRAINING";
  $("#versionCopy").textContent = mode === "double"
    ? "E・F・A・Bbだけを使い、6ペア×3オクターブの54配置を一段ずつほどいて身につける56日間です。"
    : "成人の絶対音感学習研究をもとに、Fから全12音へ段階的に広げる8週間。";
  $("#trainingAbout").textContent = mode === "double"
    ? "中央の1ペアから始め、境界音（OOB）・音域差・共通音・全54配置へ進みます。未知音はOOBで答え、成績によるロックはありません。"
    : "各音を「記憶・境界・速度・定着」の4段階で学びます。OOBとShepard toneによる聴覚干渉を含みます。";
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
$("#saveJsonButton").addEventListener("click", saveJson);
$("#soundButton").addEventListener("click", () => $("#volumeDialog").showModal());
$("#volumeSlider").addEventListener("input", (event) => {
  const percent = Number(event.target.value);
  $("#volumeOutput").textContent = `${percent}%`;
  audio.setVolume(percent / 100);
});

selectMode("single");
showScreen("modeScreen");
