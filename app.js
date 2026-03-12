/* =============================================
   DESERT BLOOM — app.js
   All logic: tasks, streak, cactus, history
   ============================================= */

// ─── CONSTANTS ───────────────────────────────
const TASKS_KEY    = 'desertbloom_tasks';
const HISTORY_KEY  = 'desertbloom_history';
const STREAK_KEY   = 'desertbloom_streak';
const LASTDAY_KEY  = 'desertbloom_lastday';
const GROWTH_KEY   = 'desertbloom_growth';

// Tasks needed per growth level (levels 0–9)
const GROWTH_THRESHOLDS = [10, 10, 15, 15, 20, 20, 25, 25, 30, 30];

// ─── STARTER TASKS (added only on first run) ─
const STARTER_TASKS = [
  {
    id: uid(),
    name: 'Blood sugar check',
    time: '08:00',
    repeat: 'daily',
    status: 'pending',  // pending | done | snoozed
    createdAt: Date.now()
  },
  {
    id: uid(),
    name: 'Take Metformin',
    time: '08:30',
    repeat: 'daily',
    status: 'pending',
    createdAt: Date.now()
  }
];

// ─── STATE ────────────────────────────────────
let tasks   = [];
let history = [];
let streak  = 0;
let growth  = 0;   // total completions ever

// ─── UTILITIES ────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function timeLabel(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 2400);
}

// ─── PERSISTENCE ──────────────────────────────
function save() {
  localStorage.setItem(TASKS_KEY,   JSON.stringify(tasks));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  localStorage.setItem(STREAK_KEY,  String(streak));
  localStorage.setItem(GROWTH_KEY,  String(growth));
}

function load() {
  const t = localStorage.getItem(TASKS_KEY);
  const h = localStorage.getItem(HISTORY_KEY);
  const s = localStorage.getItem(STREAK_KEY);
  const g = localStorage.getItem(GROWTH_KEY);

  tasks   = t ? JSON.parse(t) : [...STARTER_TASKS];
  history = h ? JSON.parse(h) : [];
  streak  = s ? parseInt(s, 10) : 0;
  growth  = g ? parseInt(g, 10) : 0;

  // If no tasks existed before, save the starters
  if (!t) save();
}

// ─── STREAK LOGIC ─────────────────────────────
// Call this whenever a task is marked done.
// Streak increases once per calendar day.
function tickStreak() {
  const today = todayStr();
  const last  = localStorage.getItem(LASTDAY_KEY);

  if (last === today) return;           // already counted today
  if (last === getPreviousDay(today)) {
    streak++;                           // consecutive day
  } else {
    streak = 1;                         // reset / start fresh
  }
  localStorage.setItem(LASTDAY_KEY, today);
  save();
}

function getPreviousDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ─── GROWTH / LEVEL CALC ──────────────────────
function getLevel() {
  // One level per threshold block; max level = GROWTH_THRESHOLDS.length
  let remaining = growth;
  let level = 0;
  while (level < GROWTH_THRESHOLDS.length && remaining >= GROWTH_THRESHOLDS[level]) {
    remaining -= GROWTH_THRESHOLDS[level];
    level++;
  }
  return { level, remaining, threshold: GROWTH_THRESHOLDS[level] || 30 };
}

// ─── TASK HELPERS ─────────────────────────────
function pendingTasks()  { return tasks.filter(t => t.status === 'pending'); }
function doneTasks()     { return tasks.filter(t => t.status === 'done'); }
function snoozedTasks()  { return tasks.filter(t => t.status === 'snoozed'); }

function markDone(id) {
  const task = tasks.find(t => t.id === id);
  if (!task || task.status === 'done') return;

  task.status = 'done';
  growth++;
  tickStreak();

  // Add to history
  history.unshift({
    name: task.name,
    completedAt: new Date().toLocaleString(),
    repeat: task.repeat
  });
  // Keep history at 100 entries max
  if (history.length > 100) history.length = 100;

  // If the task is "once", remove it after completion
  if (task.repeat === 'once') {
    tasks = tasks.filter(t => t.id !== id);
  }

  save();
  renderAll();
  showToast('✅ Task done! Your cactus grew a little.');
}

function markSnooze(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = task.status === 'snoozed' ? 'pending' : 'snoozed';
  save();
  renderAll();
  showToast(task.status === 'snoozed' ? '💤 Snoozed.' : '🔔 Back to pending.');
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  renderAll();
  showToast('🗑 Task removed.');
}

function addTask() {
  const nameEl   = document.getElementById('task-name-input');
  const timeEl   = document.getElementById('task-time-input');
  const repeatEl = document.getElementById('task-repeat-input');

  const name = nameEl.value.trim();
  if (!name) { showToast('Give your task a name first.'); return; }

  tasks.push({
    id: uid(),
    name,
    time:   timeEl.value || '',
    repeat: repeatEl.value,
    status: 'pending',
    createdAt: Date.now()
  });

  nameEl.value  = '';
  timeEl.value  = '';
  repeatEl.value = 'daily';

  save();
  renderAll();
  showToast('🌱 New task added.');
}

// ─── RENDER HELPERS ───────────────────────────
function buildTaskItem(task, showDelete = true) {
  const li = document.createElement('li');
  li.className = `task-item ${task.status}`;
  li.dataset.id = task.id;

  const meta = [task.repeat];
  if (task.time) meta.unshift(timeLabel(task.time));

  li.innerHTML = `
    <div class="task-info">
      <div class="task-name">${escHtml(task.name)}</div>
      <div class="task-meta">${meta.join(' · ')}</div>
    </div>
    <div class="task-actions">
      ${task.status !== 'done' ? `<button class="btn-done" data-action="done" data-id="${task.id}">Done</button>` : ''}
      ${task.status !== 'done' ? `<button class="btn-snooze" data-action="snooze" data-id="${task.id}">${task.status === 'snoozed' ? 'Wake up' : 'Snooze'}</button>` : ''}
      ${showDelete ? `<button class="btn-delete" data-action="delete" data-id="${task.id}">✕</button>` : ''}
    </div>
  `;
  return li;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── RENDER ALL TABS ──────────────────────────
function renderAll() {
  renderHome();
  renderTasks();
  renderHistory();
  renderDesert();
  renderStreak();
}

function renderStreak() {
  document.getElementById('streak-count').textContent = streak;
}

function renderHome() {
  // Greeting
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.';
  document.getElementById('greeting-text').textContent = greet;

  // Summary counts
  document.getElementById('summary-pending').textContent = pendingTasks().length;
  document.getElementById('summary-done').textContent    = doneTasks().length;
  document.getElementById('summary-snoozed').textContent = snoozedTasks().length;

  // Quick task list — show pending first, max 4
  const list = document.getElementById('home-task-list');
  list.innerHTML = '';
  const show = [...pendingTasks(), ...snoozedTasks()].slice(0, 4);
  if (show.length === 0) {
    list.innerHTML = '<li class="empty-state">All done! Your cactus is proud. 🌵</li>';
  } else {
    show.forEach(t => list.appendChild(buildTaskItem(t, false)));
  }

  // Mini cactus
  drawCactus('mini-cactus', 120, 140, getLevel().level, streak, true);
  const { level } = getLevel();
  const labels = [
    'Just a sprout…', 'Getting there!', 'Looking good!',
    'In full bloom 🌸', 'Desert royalty 🌵'
  ];
  document.getElementById('home-cactus-label').textContent = labels[Math.min(level, 4)];
}

function renderTasks() {
  const list = document.getElementById('all-task-list');
  list.innerHTML = '';
  if (tasks.length === 0) {
    list.innerHTML = '<li class="empty-state">No tasks yet. Add one above.</li>';
    return;
  }
  // Sort: pending → snoozed → done
  const order = { pending: 0, snoozed: 1, done: 2 };
  const sorted = [...tasks].sort((a, b) => order[a.status] - order[b.status]);
  sorted.forEach(t => list.appendChild(buildTaskItem(t, true)));
}

function renderHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  if (history.length === 0) {
    list.innerHTML = '<li class="empty-state">Complete a task to see it here.</li>';
    return;
  }
  history.forEach(h => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div>
        <div class="history-name">${escHtml(h.name)}</div>
        <div class="history-time">${h.completedAt}</div>
      </div>
      <span class="history-badge">Done</span>
    `;
    list.appendChild(li);
  });
}

function renderDesert() {
  const { level, remaining, threshold } = getLevel();

  document.getElementById('growth-level').textContent    = level;
  document.getElementById('total-completed').textContent = growth;
  document.getElementById('desert-streak').textContent   = streak + ' day' + (streak !== 1 ? 's' : '');

  const pct = Math.round((remaining / threshold) * 100);
  document.getElementById('growth-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent =
    `${remaining} / ${threshold} completions to level ${level + 1}`;

  drawCactus('main-cactus', 300, 340, level, streak, false);
}

// ─── CACTUS DRAWING ───────────────────────────
// Draws a round cactus with arms, blooms, and spines on a canvas.
// level 0–9 controls height + arms; streak controls bloom count.
function drawCactus(canvasId, w, h, level, streakCount, mini) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const scale = mini ? 0.38 : 1;

  // Sky background (only on main canvas)
  if (!mini) {
    ctx.fillStyle = '#C8DDE8';
    ctx.fillRect(0, 0, w, h * 0.62);
    ctx.fillStyle = '#E8D3A8';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    // Sun
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.12, 28 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#F5C842';
    ctx.fill();
  }

  // Ground line (main only)
  if (!mini) {
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w, h * 0.62);
    ctx.strokeStyle = '#C1A570';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Center x and ground y
  const cx   = w / 2;
  const gndY = mini ? h * 0.82 : h * 0.62;

  // Cactus body dimensions grow with level
  const bodyH = (40 + level * 12) * scale;
  const bodyW = (18 + level * 2) * scale;
  const bodyTopY = gndY - bodyH;

  // ── Draw body (rounded rectangle) ──
  ctx.save();
  drawRoundRect(ctx, cx - bodyW, bodyTopY, bodyW * 2, bodyH, bodyW);
  ctx.fillStyle = '#4E7A52';
  ctx.fill();
  // Highlight stripe
  ctx.beginPath();
  ctx.moveTo(cx - bodyW * 0.2, bodyTopY + bodyH * 0.08);
  ctx.lineTo(cx - bodyW * 0.2, gndY - bodyH * 0.08);
  ctx.strokeStyle = 'rgba(120,200,120,0.35)';
  ctx.lineWidth = bodyW * 0.25;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // ── Spines on body ──
  drawSpines(ctx, cx, bodyTopY, bodyH, bodyW, scale);

  // ── Arms (appear at level 2+) ──
  if (level >= 2) {
    drawArm(ctx, cx, bodyTopY, bodyH, bodyW, scale, 'right', level);
  }
  if (level >= 4) {
    drawArm(ctx, cx, bodyTopY, bodyH, bodyW, scale, 'left', level);
  }

  // ── Blooms (appear based on streak) ──
  const blooms = Math.min(streakCount, 6);
  if (blooms > 0) {
    drawBlooms(ctx, cx, bodyTopY, bodyH, bodyW, scale, blooms, level);
  }

  // ── Buried base (ground integration) ──
  if (!mini) {
    ctx.beginPath();
    ctx.ellipse(cx, gndY, bodyW * 1.1, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#C1A570';
    ctx.fill();
  }
}

function drawRoundRect(ctx, x, y, width, height, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSpines(ctx, cx, topY, bodyH, bodyW, scale) {
  ctx.strokeStyle = 'rgba(255,255,220,0.7)';
  ctx.lineWidth = 0.8 * scale;
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const y = topY + bodyH * (0.2 + r * 0.2);
    for (let side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * bodyW, y);
      ctx.lineTo(cx + side * (bodyW + 6 * scale), y - 3 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + side * bodyW, y + 4 * scale);
      ctx.lineTo(cx + side * (bodyW + 6 * scale), y + 7 * scale);
      ctx.stroke();
    }
  }
}

function drawArm(ctx, cx, topY, bodyH, bodyW, scale, side, level) {
  const dir    = side === 'right' ? 1 : -1;
  const startY = topY + bodyH * (side === 'right' ? 0.35 : 0.5);
  const armLen = (20 + level * 3) * scale;
  const armW   = (9 + level) * scale;
  const elbowX = cx + dir * (bodyW + armLen);
  const elbowY = startY;
  const tipY   = elbowY - (12 + level * 2) * scale;

  // Horizontal segment
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + dir * bodyW, startY);
  ctx.lineTo(elbowX, elbowY);
  ctx.strokeStyle = '#4E7A52';
  ctx.lineWidth = armW;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Vertical segment
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(elbowX, tipY);
  ctx.stroke();
  ctx.restore();

  // Arm top cap
  ctx.beginPath();
  ctx.arc(elbowX, tipY, armW / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#4E7A52';
  ctx.fill();

  // Spines on arm
  ctx.strokeStyle = 'rgba(255,255,220,0.6)';
  ctx.lineWidth = 0.7 * scale;
  ctx.beginPath();
  ctx.moveTo(elbowX, tipY - armW / 2);
  ctx.lineTo(elbowX + dir * 5 * scale, tipY - armW / 2 - 4 * scale);
  ctx.stroke();
}

function drawBlooms(ctx, cx, topY, bodyH, bodyW, scale, count, level) {
  const positions = [
    { x: cx,             y: topY },
    { x: cx + bodyW,     y: topY + bodyH * 0.15 },
    { x: cx - bodyW,     y: topY + bodyH * 0.15 },
    { x: cx + bodyW * 1.5 + (20 + level * 3) * scale, y: topY + bodyH * (level >= 4 ? 0.4 : 0.35) - (12 + level * 2) * scale },
    { x: cx - bodyW * 1.5 - (20 + level * 3) * scale, y: topY + bodyH * 0.5 - (12 + level * 2) * scale },
    { x: cx,             y: topY + bodyH * 0.08 },
  ];

  const colors = ['#E85D75','#F2A65A','#F7E27A','#D966A0','#FF8FAB','#FBBF67'];

  for (let i = 0; i < count && i < positions.length; i++) {
    const p = positions[i];
    const r = (5 + i * 0.5) * scale;
    // Petals
    for (let a = 0; a < 5; a++) {
      const angle = (a / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        p.x + Math.cos(angle) * r * 1.4,
        p.y + Math.sin(angle) * r * 1.4,
        r * 0.9, r * 0.5, angle, 0, Math.PI * 2
      );
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    }
    // Center
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#FBECD0';
    ctx.fill();
  }
}

// ─── TAB SWITCHING ────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');

  // Re-draw canvas when switching to desert or home (canvas needs visible parent)
  if (name === 'desert') renderDesert();
  if (name === 'home')   renderHome();
}

// ─── EVENT DELEGATION FOR TASK BUTTONS ────────
function handleTaskAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'done')   markDone(id);
  if (action === 'snooze') markSnooze(id);
  if (action === 'delete') deleteTask(id);
}

// ─── DAILY RESET ──────────────────────────────
// Reset "done" status on daily tasks at the start of a new day.
function dailyReset() {
  const today = todayStr();
  const lastReset = localStorage.getItem('desertbloom_lastreset');
  if (lastReset === today) return;

  tasks.forEach(t => {
    if (t.repeat === 'daily' && t.status === 'done') {
      t.status = 'pending';
    }
    if (t.repeat === 'snoozed') {
      t.status = 'pending';   // wake up snoozed daily tasks each day
    }
  });
  localStorage.setItem('desertbloom_lastreset', today);
  save();
}

// ─── INIT ─────────────────────────────────────
function init() {
  load();
  dailyReset();
  renderAll();

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add task button
  document.getElementById('add-task-btn').addEventListener('click', addTask);

  // Enter key in task name input
  document.getElementById('task-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });

  // Task action buttons (delegation)
  document.getElementById('home-task-list').addEventListener('click', handleTaskAction);
  document.getElementById('all-task-list').addEventListener('click', handleTaskAction);
}

document.addEventListener('DOMContentLoaded', init);
