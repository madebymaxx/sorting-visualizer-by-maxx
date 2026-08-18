'use strict';

/* =========================================================
   SORTING VISUALIZER — block-based animation engine
   Each array value is rendered as one fixed-size block that
   keeps its own identity for the whole run. A "swap" step
   physically slides two blocks to each other's slot (CSS
   transition on `left`); an "overwrite" step (merge sort only,
   since it copies from an auxiliary buffer) flashes a new
   value into a slot instead of sliding.
   ========================================================= */

const BLOCK = 48;   // px, fixed block width/height
const GAP   = 10;   // px, gap between blocks

/* ---------- DOM references ---------- */

const blocksLayer     = document.getElementById('blocksLayer');
const indexLayer       = document.getElementById('indexLayer');
const algoSelect       = document.getElementById('algoSelect');
const sizeRange        = document.getElementById('sizeRange');
const speedRange       = document.getElementById('speedRange');
const sizeValue        = document.getElementById('sizeValue');
const speedValue       = document.getElementById('speedValue');
const customInput      = document.getElementById('customInput');
const setCustomBtn     = document.getElementById('setCustomBtn');
const datasetBtns      = document.querySelectorAll('.pill[data-shape]');
const playBtn          = document.getElementById('playBtn');
const stepBtn          = document.getElementById('stepBtn');
const resetBtn         = document.getElementById('resetBtn');
const algoTitle        = document.getElementById('algoTitle');
const algoComplexity   = document.getElementById('algoComplexity');
const algoDesc         = document.getElementById('algoDesc');
const statComparisons  = document.getElementById('statComparisons');
const statWrites       = document.getElementById('statWrites');
const statTime         = document.getElementById('statTime');
const statProgress     = document.getElementById('statProgress');
const progressFill     = document.getElementById('progressFill');
const statusDot        = document.getElementById('statusDot');
const statusText       = document.getElementById('statusText');

/* ---------- Algorithm metadata ---------- */

const ALGO_INFO = {
  bubble: {
    name: 'Bubble Sort',
    time: { best: 'O(n)', avg: 'O(n\u00B2)', worst: 'O(n\u00B2)' },
    space: 'O(1)',
    desc: 'Repeatedly walks the array comparing neighbors and swapping them if they\u2019re out of order. Each full pass bubbles the largest remaining value to the end, so the sorted region grows from the right.'
  },
  selection: {
    name: 'Selection Sort',
    time: { best: 'O(n\u00B2)', avg: 'O(n\u00B2)', worst: 'O(n\u00B2)' },
    space: 'O(1)',
    desc: 'On each pass, scans the unsorted region for the smallest value and swaps it into place at the front. The sorted region grows from the left, one confirmed minimum at a time.'
  },
  insertion: {
    name: 'Insertion Sort',
    time: { best: 'O(n)', avg: 'O(n\u00B2)', worst: 'O(n\u00B2)' },
    space: 'O(1)',
    desc: 'Builds the sorted region one element at a time by taking the next value and sliding it backward past any larger neighbors until it lands in its correct spot \u2014 similar to sorting cards in your hand.'
  },
  merge: {
    name: 'Merge Sort',
    time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' },
    space: 'O(n)',
    desc: 'Recursively splits the array in half until pieces are single elements, then merges pairs of sorted pieces back together in order. The overwrite flashes you see are values being copied in from that merge buffer.'
  },
  quick: {
    name: 'Quick Sort',
    time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n\u00B2)' },
    space: 'O(log n)',
    desc: 'Picks a pivot, then partitions the array so smaller values end up left of it and larger values end up right of it, and recurses into each side. The purple outline marks the current pivot.'
  },
  heap: {
    name: 'Heap Sort',
    time: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' },
    space: 'O(1)',
    desc: 'First arranges the array into a max-heap (biggest value at the root), then repeatedly swaps the root with the last unsorted slot and re-heapifies what remains, shrinking the heap by one each time.'
  }
};

/* ---------- State ---------- */

let array         = [];   // logical values, kept in sync with recorders
let originalArray = [];
let slotToBlock    = [];   // slotToBlock[slotIndex] = DOM element currently sitting there
let steps          = [];
let stepPtr        = 0;
let comparisons    = 0;
let writes         = 0;
let playing        = false;
let timerId        = null;
let elapsedId      = null;
let startTime      = 0;
let elapsedBefore  = 0;
let currentShape   = 'random';
let pivotEl        = null;

/* ---------- Speed mapping ---------- */

function speedToDelay(v) {
  const table = [900, 700, 550, 430, 330, 250, 180, 120, 70, 25];
  return table[v - 1] ?? 250;
}

/* ---------- Dataset generators ---------- */

function shapeRandom(size) {
  const arr = [];
  for (let i = 0; i < size; i++) arr.push(Math.floor(Math.random() * 96) + 4);
  return arr;
}
function shapeReversed(size) {
  return shapeRandom(size).sort((a, b) => b - a);
}
function shapeNearlySorted(size) {
  const arr = shapeRandom(size).sort((a, b) => a - b);
  const swaps = Math.max(1, Math.floor(size * 0.15));
  for (let k = 0; k < swaps; k++) {
    const i = Math.floor(Math.random() * size);
    const j = Math.floor(Math.random() * size);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function shapeFewUnique(size) {
  const pool = [10, 25, 40, 55, 70, 85];
  const arr = [];
  for (let i = 0; i < size; i++) arr.push(pool[Math.floor(Math.random() * pool.length)]);
  return arr;
}

const SHAPES = { random: shapeRandom, reversed: shapeReversed, nearly: shapeNearlySorted, fewunique: shapeFewUnique };

/* ---------- Rendering ---------- */

function slotLeft(i) { return i * (BLOCK + GAP); }

function renderBlocks(values) {
  blocksLayer.innerHTML = '';
  indexLayer.innerHTML = '';
  const width = values.length ? slotLeft(values.length - 1) + BLOCK : 0;
  blocksLayer.style.width = width + 'px';
  indexLayer.style.width = width + 'px';

  slotToBlock = values.map((v, i) => {
    const el = document.createElement('div');
    el.className = 'block';
    el.textContent = v;
    el.style.left = slotLeft(i) + 'px';
    blocksLayer.appendChild(el);
    return el;
  });

  for (let i = 0; i < values.length; i++) {
    const label = document.createElement('span');
    label.textContent = i;
    label.style.left = slotLeft(i) + 'px';
    indexLayer.appendChild(label);
  }
  pivotEl = null;
}

function flashBlock(el) {
  el.classList.remove('flash');
  void el.offsetWidth; // force reflow so the animation restarts
  el.classList.add('flash');
}

/* ---------- Recording: each fn returns a flat step list ---------- */

function recordBubble(src) {
  const a = src.slice();
  const s = [];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      s.push({ t: 'compare', i: j, j: j + 1 });
      if (a[j] > a[j + 1]) {
        s.push({ t: 'swap', i: j, j: j + 1 });
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    s.push({ t: 'sorted', i: n - 1 - i });
    if (!swapped) break;
  }
  for (let k = 0; k < n; k++) s.push({ t: 'sorted', i: k });
  return s;
}

function recordSelection(src) {
  const a = src.slice();
  const s = [];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      s.push({ t: 'compare', i: min, j });
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      s.push({ t: 'swap', i, j: min });
      [a[i], a[min]] = [a[min], a[i]];
    }
    s.push({ t: 'sorted', i });
  }
  return s;
}

function recordInsertion(src) {
  const a = src.slice();
  const s = [];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      s.push({ t: 'compare', i: j - 1, j });
      if (a[j - 1] > a[j]) {
        s.push({ t: 'swap', i: j - 1, j });
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        j--;
      } else break;
    }
  }
  for (let k = 0; k < n; k++) s.push({ t: 'sorted', i: k });
  return s;
}

function recordMerge(src) {
  const a = src.slice();
  const s = [];
  function mergeSort(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1;
    mergeSort(lo, mid);
    mergeSort(mid, hi);
    merge(lo, mid, hi);
  }
  function merge(lo, mid, hi) {
    const left = a.slice(lo, mid);
    const right = a.slice(mid, hi);
    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      s.push({ t: 'compare', i: lo + i, j: mid + j });
      if (left[i] <= right[j]) { s.push({ t: 'overwrite', i: k, val: left[i] }); a[k] = left[i]; i++; }
      else { s.push({ t: 'overwrite', i: k, val: right[j] }); a[k] = right[j]; j++; }
      k++;
    }
    while (i < left.length) { s.push({ t: 'overwrite', i: k, val: left[i] }); a[k] = left[i]; i++; k++; }
    while (j < right.length) { s.push({ t: 'overwrite', i: k, val: right[j] }); a[k] = right[j]; j++; k++; }
  }
  mergeSort(0, a.length);
  for (let k = 0; k < a.length; k++) s.push({ t: 'sorted', i: k });
  return s;
}

function recordQuick(src) {
  const a = src.slice();
  const s = [];
  function partition(lo, hi) {
    const pivotVal = a[hi];
    s.push({ t: 'pivot', i: hi });
    let i = lo;
    for (let j = lo; j < hi; j++) {
      s.push({ t: 'compare', i: j, j: hi });
      if (a[j] < pivotVal) {
        if (i !== j) { s.push({ t: 'swap', i, j }); [a[i], a[j]] = [a[j], a[i]]; }
        i++;
      }
    }
    if (i !== hi) { s.push({ t: 'swap', i, j: hi }); [a[i], a[hi]] = [a[hi], a[i]]; }
    return i;
  }
  function quickSort(lo, hi) {
    if (lo >= hi) return;
    const p = partition(lo, hi);
    s.push({ t: 'sorted', i: p });
    quickSort(lo, p - 1);
    quickSort(p + 1, hi);
  }
  quickSort(0, a.length - 1);
  for (let k = 0; k < a.length; k++) s.push({ t: 'sorted', i: k });
  return s;
}

function recordHeap(src) {
  const a = src.slice();
  const s = [];
  const n = a.length;
  function heapify(size, i) {
    let largest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < size) { s.push({ t: 'compare', i: l, j: largest }); if (a[l] > a[largest]) largest = l; }
    if (r < size) { s.push({ t: 'compare', i: r, j: largest }); if (a[r] > a[largest]) largest = r; }
    if (largest !== i) {
      s.push({ t: 'swap', i, j: largest });
      [a[i], a[largest]] = [a[largest], a[i]];
      heapify(size, largest);
    }
  }
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    s.push({ t: 'swap', i: 0, j: i });
    [a[0], a[i]] = [a[i], a[0]];
    s.push({ t: 'sorted', i });
    heapify(i, 0);
  }
  s.push({ t: 'sorted', i: 0 });
  return s;
}

const RECORDERS = { bubble: recordBubble, selection: recordSelection, insertion: recordInsertion, merge: recordMerge, quick: recordQuick, heap: recordHeap };

/* ---------- Playback ---------- */

function clearTransientClasses() {
  for (const b of slotToBlock) b.classList.remove('compare', 'swap');
}

function applyStep(step) {
  clearTransientClasses();
  switch (step.t) {
    case 'compare':
      comparisons++;
      slotToBlock[step.i].classList.add('compare');
      slotToBlock[step.j].classList.add('compare');
      break;
    case 'swap': {
      writes += 2;
      const a = slotToBlock[step.i];
      const b = slotToBlock[step.j];
      a.style.left = slotLeft(step.j) + 'px';
      b.style.left = slotLeft(step.i) + 'px';
      a.classList.add('swap');
      b.classList.add('swap');
      slotToBlock[step.i] = b;
      slotToBlock[step.j] = a;
      break;
    }
    case 'overwrite': {
      writes++;
      const el = slotToBlock[step.i];
      el.textContent = step.val;
      flashBlock(el);
      break;
    }
    case 'pivot':
      if (pivotEl) pivotEl.classList.remove('pivot');
      pivotEl = slotToBlock[step.i];
      pivotEl.classList.add('pivot');
      break;
    case 'sorted':
      slotToBlock[step.i].classList.add('sorted');
      if (slotToBlock[step.i] === pivotEl) pivotEl = null;
      break;
  }
  updateStats();
}

function updateStats() {
  statComparisons.textContent = comparisons;
  statWrites.textContent = writes;
  const pct = steps.length ? Math.round((stepPtr / steps.length) * 100) : 0;
  statProgress.textContent = pct + '%';
  progressFill.style.width = pct + '%';
}

function tickElapsed() {
  const now = (performance.now() - startTime) + elapsedBefore;
  statTime.textContent = (now / 1000).toFixed(1) + 's';
}

function ensureSteps() {
  if (steps.length === 0) {
    steps = RECORDERS[algoSelect.value](array);
    stepPtr = 0;
  }
}

function playLoop() {
  if (stepPtr >= steps.length) { finishRun(); return; }
  applyStep(steps[stepPtr]);
  stepPtr++;
  timerId = setTimeout(playLoop, speedToDelay(+speedRange.value));
}

function play() {
  ensureSteps();
  if (stepPtr >= steps.length) return;
  playing = true;
  setControlsForPlaying(true);
  startTime = performance.now();
  elapsedId = setInterval(tickElapsed, 100);
  statusDot.className = 'status-dot running';
  statusText.textContent = 'running';
  playLoop();
}

function pause() {
  playing = false;
  clearTimeout(timerId);
  clearInterval(elapsedId);
  elapsedBefore += performance.now() - startTime;
  setControlsForPlaying(false);
  statusDot.className = 'status-dot';
  statusText.textContent = 'paused';
}

function stepOnce() {
  if (playing) pause();
  ensureSteps();
  if (stepPtr >= steps.length) { finishRun(); return; }
  applyStep(steps[stepPtr]);
  stepPtr++;
  statusDot.className = 'status-dot';
  statusText.textContent = 'stepping';
  if (stepPtr >= steps.length) finishRun();
}

function finishRun() {
  playing = false;
  clearTimeout(timerId);
  clearInterval(elapsedId);
  for (const b of slotToBlock) { b.classList.remove('compare', 'swap', 'pivot'); b.classList.add('sorted'); }
  pivotEl = null;
  setControlsForPlaying(false);
  playBtn.textContent = 'Run';
  playBtn.disabled = true;
  stepBtn.disabled = true;
  statusDot.className = 'status-dot done';
  statusText.textContent = 'sorted';
  updateStats();
  statProgress.textContent = '100%';
  progressFill.style.width = '100%';
}

function setControlsForPlaying(isPlaying) {
  playBtn.textContent = isPlaying ? 'Pause' : 'Resume';
  playBtn.classList.toggle('is-running', isPlaying);
}

/* ---------- Reset / new array ---------- */

function resetVisualState(newArray) {
  clearTimeout(timerId);
  clearInterval(elapsedId);
  playing = false;
  steps = [];
  stepPtr = 0;
  comparisons = 0;
  writes = 0;
  elapsedBefore = 0;
  array = newArray;
  originalArray = newArray.slice();
  renderBlocks(array);
  statComparisons.textContent = '0';
  statWrites.textContent = '0';
  statTime.textContent = '0.0s';
  statProgress.textContent = '0%';
  progressFill.style.width = '0%';
  playBtn.textContent = 'Run';
  playBtn.disabled = false;
  playBtn.classList.remove('is-running');
  stepBtn.disabled = false;
  statusDot.className = 'status-dot';
  statusText.textContent = 'idle';
}

function generateShape(shape) {
  currentShape = shape;
  for (const b of datasetBtns) b.classList.toggle('active', b.dataset.shape === shape);
  resetVisualState(SHAPES[shape](+sizeRange.value));
}

function applyCustomArray() {
  const raw = customInput.value.trim();
  if (!raw) return;
  const parsed = raw.split(',').map(v => parseFloat(v.trim())).filter(v => !Number.isNaN(v));
  if (parsed.length < 2) { alert('Enter at least two valid comma-separated numbers.'); return; }
  const clamped = parsed.slice(0, 40).map(v => Math.max(1, Math.min(99, Math.round(v))));
  sizeRange.value = clamped.length;
  sizeValue.textContent = clamped.length;
  for (const b of datasetBtns) b.classList.remove('active');
  resetVisualState(clamped);
}

/* ---------- UI wiring ---------- */

function refreshAlgoPanel() {
  const info = ALGO_INFO[algoSelect.value];
  algoTitle.textContent = info.name;
  algoComplexity.textContent = `best ${info.time.best} · avg ${info.time.avg} · worst ${info.time.worst} · space ${info.space}`;
  if (algoDesc) algoDesc.textContent = info.desc;
}

algoSelect.addEventListener('change', () => {
  refreshAlgoPanel();
  resetVisualState(originalArray.length ? originalArray.slice() : shapeRandom(+sizeRange.value));
});

sizeRange.addEventListener('input', () => { sizeValue.textContent = sizeRange.value; });
sizeRange.addEventListener('change', () => { generateShape(currentShape); });

speedRange.addEventListener('input', () => { speedValue.textContent = speedRange.value; });

for (const b of datasetBtns) b.addEventListener('click', () => generateShape(b.dataset.shape));

setCustomBtn.addEventListener('click', applyCustomArray);
customInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyCustomArray(); });

playBtn.addEventListener('click', () => { if (playing) pause(); else play(); });
stepBtn.addEventListener('click', stepOnce);
resetBtn.addEventListener('click', () => resetVisualState(originalArray.slice()));

/* ---------- Init ---------- */

(function init() {
  refreshAlgoPanel();
  generateShape('random');
})();

/* =========================================================
   THEME TOGGLE — light / dark mode
   The <html> element's data-theme attribute is set as early
   as possible by an inline script in <head> (before CSS/DOM
   paint) to avoid a flash of the wrong theme. This block just
   wires up the toggle button and keeps localStorage in sync.
   ========================================================= */

(function () {
  const STORAGE_KEY = 'sortviz-theme';
  const root = document.documentElement;

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    const toggle = document.getElementById('themeToggle');
    const sun = document.getElementById('themeIconSun');
    const moon = document.getElementById('themeIconMoon');
    const label = document.getElementById('themeLabel');
    if (!toggle) return;
    const isDark = theme === 'dark';
    if (sun) sun.style.display = isDark ? 'none' : '';
    if (moon) moon.style.display = isDark ? '' : 'none';
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
    toggle.setAttribute('aria-pressed', String(isDark));
  }

  function initTheme() {
    applyTheme(currentTheme());
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      });
    }
    // Follow OS preference changes only if the user hasn't chosen manually.
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem(STORAGE_KEY) === null) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
