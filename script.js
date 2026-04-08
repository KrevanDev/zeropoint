import { THEMES, THEME_NAMES } from './modules/themes/themes.js';
import { BACKGROUNDS, BACKGROUND_NAMES } from './modules/backgrounds/backgroundRegistry.js';
import { loadSettingsFromStorage, saveSettingsToStorage, loadTodosFromStorage, saveTodosToStorage, loadWeatherCacheFromStorage, saveWeatherCacheToStorage, clearWeatherCacheFromStorage } from './modules/storage.js';


/**
 * ZeroPoint Start Page Logic
 * Refactored for modularity and clarity.
 */
// --- Global App State ---
let appSettings = {
  userName: 'User',
  timeFormat: '24',
  theme: 'toxic',
  bgEffect: 'classic',
  weatherUnit: 'C',
  shortcuts: [
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'YouTube', url: 'https://youtube.com' }
  ]
};

let todoData = [];
let isTimerMode = false;
let timerSecs = 25 * 60;
let timerInterval = null;
let isRunning = false;
let lastWeatherData = null;
let lastFocusedSubtaskId = null;
let wakeLock = null;
let lastSetTimerMinutes = 25;

// --- BACKGROUND CANVAS SYSTEM ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let matrixDrops = [];
const mouse = { x: null, y: null, radius: 150 };

/**
 * Particle Class
 */
class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.baseSize = this.size;
    this.density = (Math.random() * 30) + 1;
    this.speedX = Math.random() * 0.5 - 0.25;
    this.speedY = Math.random() * 0.5 - 0.25;
    this.angle = Math.random() * 360;
    this.spin = Math.random() < 0.5 ? 1 : -1;
    this.points = Math.floor(Math.random() * 3) + 3;
    this.rotation = Math.random() * Math.PI * 2;
    this.bubbleSpeed = Math.random() * 1 + 0.5;
  }
  draw() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#ffffff';
    const effect = appSettings.bgEffect;

    ctx.fillStyle = accent;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();

    if (effect === 'crystals') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.moveTo(this.size * 3, 0);
      for (let i = 1; i < this.points; i++) {
        ctx.lineTo(this.size * 3 * Math.cos(i * 2 * Math.PI / this.points), this.size * 3 * Math.sin(i * 2 * Math.PI / this.points));
      }
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.restore();
    } else if (effect === 'bubbles') {
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.05;
      ctx.fill();
    } else if (effect === 'stellar') {
      // Twinkling star effect with a subtle outer glow
      ctx.save();
      ctx.shadowBlur = this.size * 3;
      ctx.shadowColor = accent;
      // Random flicker logic: occasionally brightens
      ctx.globalAlpha = Math.random() > 0.98 ? 0.9 : 0.3;
      ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (effect === 'petals') {
      // Soft organic shapes (ellipses) that rotate
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.ellipse(0, 0, this.size * 2, this.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (effect === 'leaves') {
      // Diamond/Leaf shape for the forest theme
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.moveTo(0, -this.size * 2);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size * 2);
      ctx.lineTo(-this.size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // Default 'classic' / 'geometric' / 'magnetic' circle
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  update(effect) {
    let dx = mouse.x - this.x;
    let dy = mouse.y - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // --- INTERACTIVE PHYSICS TIER ---
    if (effect === 'magnetic' && distance < mouse.radius * 2) {
      let force = (mouse.radius * 2 - distance) / (mouse.radius * 2);
      this.x += (dx / distance) * force * 2;
      this.y += (dy / distance) * force * 2;
      this.size = this.baseSize + (force * 3);
    } else if (effect === 'classic' && distance < mouse.radius) {
      let force = (mouse.radius - distance) / mouse.radius;
      this.x += (dx / distance) * force * this.density * 0.4;
      this.y += (dy / distance) * force * this.density * 0.4;
    } else if (effect === 'stellar' && distance < mouse.radius) {
      // Subtle "gravity" pull for stars
      let force = (mouse.radius - distance) / mouse.radius;
      this.x += (dx / distance) * force * 0.5;
      this.y += (dy / distance) * force * 0.5;
    } else if (effect === 'leaves' && distance < mouse.radius) {
      // Repel effect: Leaves "flutter" away from the cursor
      let force = (mouse.radius - distance) / mouse.radius;
      this.x -= (dx / distance) * force * 3;
      this.y -= (dy / distance) * force * 3;
    }

    // --- MOVEMENT LOGIC TIER ---
    if (effect === 'geometric') {
      this.angle += 0.01 * this.spin;
      this.x += Math.cos(this.angle) * 0.2;
      this.y += Math.sin(this.angle) * 0.2;
    } else if (effect === 'crystals') {
      this.rotation += 0.01 * this.spin;
      this.x += this.speedX * 0.5;
      this.y += this.speedY * 0.5;
    } else if (effect === 'bubbles') {
      this.y -= this.bubbleSpeed;
      this.x += Math.sin(this.y / 50) * 0.5;
      if (this.y < -20) this.y = canvas.height + 20;
    } else if (effect === 'petals') {
      // Falling and swaying logic
      this.y += this.bubbleSpeed * 0.5;
      this.x += Math.sin(this.y / 100) * 0.8;
      this.rotation += 0.01 * this.spin;
      if (this.y > canvas.height + 20) this.y = -20;
    } else if (effect === 'leaves') {
      // Drifting upward like embers/light leaves
      this.y -= 0.3;
      this.x += Math.cos(this.y / 50) * 0.3;
      this.rotation += 0.005 * this.spin;
      if (this.y < -20) this.y = canvas.height + 20;
    }

    // --- BOUNDARY & VELOCITY TIER ---
    // Apply standard velocity to effects that aren't strictly vertical (bubbles/petals/leaves)
    const isVerticalEffect = ['bubbles', 'petals', 'leaves'].includes(effect);

    if (!isVerticalEffect) {
      this.x += this.speedX;
      this.y += this.speedY;

      // Bounce off walls
      if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
      if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
    }

    this.draw();
  }
}

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
  const count = (canvas.width * canvas.height) / 10000;
  for (let i = 0; i < count; i++) particles.push(new Particle());

  const columns = Math.floor(canvas.width / 20);
  matrixDrops = Array(columns).fill(1);
}


const currentBgMeta = BACKGROUNDS[appSettings.bgEffect];
function animateBg() {
  const effect = appSettings.bgEffect;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#ffffff';

  if (effect === 'matrix') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (effect === 'matrix') {
    ctx.fillStyle = accent;
    ctx.font = "15px monospace";
    matrixDrops.forEach((y, i) => {
      const text = String.fromCharCode(Math.random() * 128);
      const x = i * 20;
      ctx.fillText(text, x, y * 20);
      let dist = Math.abs(x - mouse.x);
      let speed = (dist < 100) ? 0.5 : 0.25;
      if (y * 20 > canvas.height && Math.random() > 0.975) matrixDrops[i] = 0;
      matrixDrops[i] += speed;
    });
  } else {
    ctx.strokeStyle = accent;
    for (let a = 0; a < particles.length; a++) {
      if (effect === 'classic' || effect === 'geometric') {
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let limit = effect === 'classic' ? 150 : 80;
          if (dist < limit) {
            ctx.globalAlpha = (1 - (dist / limit)) * 0.15;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
      particles[a].update(effect);
    }
  }
  requestAnimationFrame(animateBg);
}

// --- SETTINGS & THEME ENGINE ---
function loadSettings() {
  const saved = loadSettingsFromStorage();
  if (saved) {
    appSettings = { ...appSettings, ...saved };
  };

  const savedTodos = loadTodosFromStorage();
  if (savedTodos) {
    try { todoData = savedTodos; } catch (e) { todoData = []; }
  }

  document.getElementById('userNameInput').value = appSettings.userName;
  document.getElementById('timeFormatSelect').value = appSettings.timeFormat;
  document.getElementById('themeSelect').value = appSettings.theme;
  document.getElementById('bgEffectSelect').value = appSettings.bgEffect;

  applyTheme(appSettings.theme);
  renderLinks();
  renderEditor();
  renderTodos();
  getWeatherData();
  updateTimerDuration();
  initCanvas();
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('theme-iridescent');

  const selected = THEMES[theme] || THEMES['toxic'];
  if (theme === 'iridescent') root.classList.add('theme-iridescent');

  document.body.style.background = selected.bg;
  document.getElementById('mainCard').style.background = selected.card;
  root.style.setProperty('--timer-color', selected.timer);
  root.style.setProperty('--glow-color', selected.glow);
  root.style.setProperty('--accent-color', selected.accent);
  document.getElementById('mainCard').style.boxShadow = `0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 20px ${selected.glow}`;
}

// --- WEATHER SYSTEM WITH SMART CACHING ---
async function getWeatherData() {
  const locEl = document.getElementById('weatherLoc');
  const tempEl = document.getElementById('weatherTemp');
  const handleError = (msg) => { locEl.textContent = msg; tempEl.textContent = "--"; };

  const cached = loadWeatherCacheFromStorage();
  if (cached) {
    try {
      const cacheData = cached;
      const now = Date.now();
      const cacheAge = now - cacheData.timestamp;
      const oneHour = 3600000;

      if (cacheAge < oneHour) {
        console.log(`[SYS] Using cached weather data. (${Math.round(cacheAge / 3600000)}m old)`);
        lastWeatherData = cacheData;
        locEl.textContent = lastWeatherData.city;
        displayWeather();
        return; // Exit function early, no API calls needed
      }
    } catch (e) {
      console.warn("Weather cache corrupt, fetching fresh data...");
    }
  }

  // 2. If no cache or cache expired, proceed with standard fetch
  if (!navigator.geolocation) return handleError("Not Supported");

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude: lat, longitude: lon } = position.coords;
    locEl.textContent = "Updating...";

    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const weatherData = await weatherRes.json();
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
      const geoData = await geoRes.json();

      const city = geoData.address.city || geoData.address.town || geoData.address.village || "Nearby";
      lastWeatherData = {
        tempC: weatherData.current_weather.temperature,
        code: weatherData.current_weather.weathercode,
        city,
        timestamp: Date.now(),
      };

      // 3. Save the fresh data to cache with a timestamp
      saveWeatherCacheToStorage(lastWeatherData);
      locEl.textContent = city;
      displayWeather()

      locEl.textContent = city;
      displayWeather();
    } catch (e) { handleError("API Error"); }
  }, (err) => handleError("Loc. Error"), { timeout: 10000 });
}

function displayWeather() {
  if (!lastWeatherData) {
    console.warn("displayWeather called without data");
    return;
  }
  const tempEl = document.getElementById('weatherTemp');
  const { tempC, code } = lastWeatherData;
  let displayTemp = appSettings.weatherUnit === 'F' ? Math.round((tempC * 9 / 5) + 32) : Math.round(tempC);
  let icon = code <= 3 ? (code === 0 ? '☀️' : '☁️') : '🌧️';
  tempEl.textContent = `${icon} ${displayTemp}°${appSettings.weatherUnit}`;
}

function toggleWeatherUnit() {
  appSettings.weatherUnit = appSettings.weatherUnit === 'C' ? 'F' : 'C';
  saveToDisk();
  displayWeather();
}

// --- CLOCK & FOCUS TIMER ---
function updateClock() {
  const clockEl = document.getElementById('clock');
  const greetEl = document.getElementById('greeting');

  if (!isTimerMode) {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    if (appSettings.timeFormat === '12') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      clockEl.textContent = `${h}:${m} ${ampm}`;
    } else {
      clockEl.textContent = `${String(h).padStart(2, '0')}:${m}`;
    }
    greetEl.textContent = `ZeroPoint // ${appSettings.userName}`;
  } else {
    const m = String(Math.floor(timerSecs / 60)).padStart(2, '0');
    const s = String(timerSecs % 60).padStart(2, '0');
    clockEl.textContent = `${m}:${s}`;
    greetEl.textContent = "ZeroPoint // Focus";
  }
}

function updateTimerDuration() {
  if (!isRunning) {
    timerSecs = lastSetTimerMinutes * 60;
    updateClock();
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  document.getElementById('timerStartBtn').textContent = "Start";
  timerSecs = lastSetTimerMinutes * 60;
  updateClock();
}

// --- TASK SYSTEM ---
function renderTodos() {
  const area = document.getElementById('todoDisplayArea'); area.innerHTML = '';
  todoData.forEach((todo, idx) => {
    const div = document.createElement('div'); div.className = 'todo-item-box';
    div.innerHTML = `
            <div class="todo-main-line">
                <span class="todo-text-display ${todo.done ? 'done' : ''}" onclick="toggleTodo(${idx})">${todo.text}</span>
                <button class="del-btn" onclick="deleteTodo(${idx})">&times;</button>
            </div>
            <div class="subtask-area">
                ${todo.subtasks.map((sub, sIdx) => `
                    <div class="sub-item">
                        <input type="checkbox" ${sub.done ? 'checked' : ''} onchange="toggleSub(${idx},${sIdx})">
                        <span class="${sub.done ? 'sub-done' : ''}">${sub.text}</span>
                        <button class="del-btn" style="font-size:0.8rem" onclick="delSub(${idx},${sIdx})">&times;</button>
                    </div>`).join('')}
                <input type="text" class="sub-input-box" id="subInput-${idx}" placeholder="Add subtask..." onkeydown="handleSubKey(event, ${idx})">
            </div>`;
    area.appendChild(div);
  });
  saveTodosToStorage(todoData);
  if (lastFocusedSubtaskId) {
    const el = document.getElementById(lastFocusedSubtaskId);
    if (el) el.focus();
  }
}

function toggleTodo(i) { todoData[i].done = !todoData[i].done; renderTodos(); }
function deleteTodo(i) { todoData.splice(i, 1); renderTodos(); }
function toggleSub(i, si) { todoData[i].subtasks[si].done = !todoData[i].subtasks[si].done; renderTodos(); }
function delSub(i, si) { todoData[i].subtasks.splice(si, 1); renderTodos(); }
function handleSubKey(e, i) {
  if (e.key === 'Enter' && e.target.value.trim()) {
    todoData[i].subtasks.push({ text: e.target.value.trim(), done: false });
    lastFocusedSubtaskId = `subInput-${i}`;
    renderTodos();
  }
}

// --- SHORTCUTS SYSTEM ---
let dragSrcIndex = null;

function renderLinks() {
  const grid = document.getElementById('linksGrid');
  grid.innerHTML = '';
  appSettings.shortcuts.forEach((s, i) => {
    const a = document.createElement('a');
    a.href = s.url; a.className = 'link-item'; a.draggable = true; a.dataset.index = i;
    try {
      const domain = new URL(s.url).hostname;
      a.innerHTML = `<img src="https://www.google.com/s2/favicons?sz=64&domain=${domain}" class="link-favicon"><span>${s.label}</span>`;
    } catch (e) { a.innerHTML = `<span>${s.label}</span>`; }

    a.addEventListener('dragstart', handleDragStart);
    a.addEventListener('dragover', handleDragOver);
    a.addEventListener('dragleave', handleDragLeave);
    a.addEventListener('drop', handleDrop);
    a.addEventListener('dragend', handleDragEnd);
    grid.appendChild(a);
  });
}

function renderEditor() {
  const list = document.getElementById('shortcutEditorList');
  list.innerHTML = '';
  appSettings.shortcuts.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'shortcut-edit-item';
    const label = document.createElement('span');
    label.textContent = s.label;
    const btn = document.createElement('button');
    btn.className = 'del-btn';
    btn.innerHTML = `&times`;
    btn.addEventListener('click', () => removeShortcut(i));
    div.appendChild(label);
    div.appendChild(btn);
    list.appendChild(div);
  });
}

function removeShortcut(index) {
  appSettings.shortcuts.splice(index, 1);
  saveToDisk();
  renderLinks();
  renderEditor();
}

// Drag & Drop Handlers
function handleDragStart(e) { dragSrcIndex = this.dataset.index; this.classList.add('dragging'); }
function handleDragOver(e) { if (e.preventDefault) e.preventDefault(); this.classList.add('drag-over'); return false; }
function handleDragLeave() { this.classList.remove('drag-over'); }
function handleDrop(e) {
  e.stopPropagation(); e.preventDefault();
  const targetIndex = this.dataset.index;
  if (dragSrcIndex !== targetIndex) {
    const movedItem = appSettings.shortcuts.splice(dragSrcIndex, 1)[0];
    appSettings.shortcuts.splice(targetIndex, 0, movedItem);
    saveToDisk();
    renderLinks();
  }
  return false;
}
function handleDragEnd() {
  document.querySelectorAll('.link-item').forEach(item => {
    item.classList.remove('dragging'); item.classList.remove('drag-over');
  });
}

// --- UI & NAVIGATION ---
function switchView(v) {
  document.getElementById('dashboardView').classList.toggle('hidden', v !== 'dash');
  document.getElementById('todoView').classList.toggle('hidden', v !== 'todo');
  document.getElementById('navDashboardBtn').classList.toggle('active', v === 'dash');
  document.getElementById('navTodoBtn').classList.toggle('active', v === 'todo');
  if (v === 'todo') setTimeout(() => document.getElementById('todoInputMain').focus(), 100);
}

function toggleSettings(open) {
  const modal = document.getElementById('settingsModal');
  const backdrop = document.getElementById('modalBackdrop');
  const container = document.querySelector('.container');
  if (open) {
    modal.classList.add('active');
    backdrop.classList.add('active');
    container.classList.add('dimmed');
    renderEditor();
  } else {
    modal.classList.remove('active');
    backdrop.classList.remove('active');
    container.classList.remove('dimmed');
  }
}

function saveToDisk() {
  saveSettingsToStorage(appSettings);
}

// --- COMMAND PALETTE ENGINE ---
const themes = THEME_NAMES;
const backgrounds = BACKGROUND_NAMES;
const commands = ['/theme', '/bg', '/timer', '/zen'];

function handleCommand(query) {
  const parts = query.split(' ');
  const command = parts[0].toLowerCase();
  const value = parts[1] ? parts[1].toLowerCase() : null;

  switch (command) {
    case '/theme':
      if (value && themes.includes(value)) {
        appSettings.theme = value;
        applyTheme(value);
        document.getElementById('themeSelect').value = value;
        saveToDisk();
      }
      break;
    case '/bg':
      if (value && backgrounds.includes(value)) {
        appSettings.bgEffect = value;
        document.getElementById('bgEffectSelect').value = value;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (value === 'matrix') {
          const columns = Math.floor(canvas.width / 20);
          matrixDrops = Array(columns).fill(1);
        } else { initCanvas(); }
        saveToDisk();
      }
      break;
    case '/timer':
      if (value && !isNaN(value)) {
        lastSetTimerMinutes = parseInt(value);
        timerSecs = lastSetTimerMinutes * 60;
        isTimerMode = true;
        document.getElementById('mainCard').classList.add('timer-mode');
        updateClock();
      }
      break;
    case '/zen':
      document.body.classList.add('zen-active');
      const exitZen = () => {
        document.body.classList.remove('zen-active');
        document.removeEventListener('keydown', exitZen);
        document.removeEventListener('click', exitZen);
      };
      setTimeout(() => {
        document.addEventListener('keydown', exitZen);
        document.addEventListener('click', exitZen);
      }, 500);
      break;
  }
}

// --- EVENT LISTENERS ---

window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('resize', () => { initCanvas(); });

document.getElementById('timeWrapper').onclick = () => {
  isTimerMode = !isTimerMode;
  document.getElementById('mainCard').classList.toggle('timer-mode', isTimerMode);
  updateTimerDuration();
};

document.addEventListener('click', (e) => {
  const menu = document.getElementById('popoutMenu');
  if (!menu.contains(e.target)) {
    menu.classList.remove('active');
  }
});

document.getElementById('timerStartBtn').onclick = function () {
  if (Notification.permission === "default") Notification.requestPermission();
  if (isRunning) {
    clearInterval(timerInterval); this.textContent = "Start"; isRunning = false;
  } else {
    isRunning = true; this.textContent = "Pause";
    timerInterval = setInterval(() => {
      if (timerSecs > 0) { timerSecs--; updateClock(); }
      else {
        clearInterval(timerInterval);
        new Notification("Complete!", { body: "Take a break." });
        resetTimer();
      }
    }, 1000);
  }
};

document.getElementById('timerResetBtn').onclick = resetTimer;

document.getElementById('todoForm').onsubmit = (e) => {
  e.preventDefault();
  const inp = document.getElementById('todoInputMain');
  if (inp.value.trim()) {
    todoData.push({ text: inp.value.trim(), done: false, subtasks: [] });
    inp.value = ''; renderTodos();
  }
};

document.getElementById('navDashboardBtn').onclick = () => switchView('dash');
document.getElementById('navTodoBtn').onclick = () => switchView('todo');
document.getElementById('menuToggle').onclick = e => { e.stopPropagation(); document.getElementById('popoutMenu').classList.toggle('active'); };
document.getElementById('settingsBtn').onclick = () => toggleSettings(true);
document.getElementById('closeSettingsBtn').onclick = () => toggleSettings(false);
document.getElementById('modalBackdrop').onclick = () => toggleSettings(false);

document.getElementById('saveSettingsBtn').onclick = () => {
  appSettings.userName = document.getElementById('userNameInput').value;
  appSettings.timeFormat = document.getElementById('timeFormatSelect').value;
  appSettings.theme = document.getElementById('themeSelect').value;
  appSettings.bgEffect = document.getElementById('bgEffectSelect').value;
  saveToDisk();
  applyTheme(appSettings.theme);
  renderLinks();
  if (!isRunning) updateTimerDuration();
  toggleSettings(false);
};

function normalizeUrl(input) {
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input)) {
    return 'https://' + input;
  }
  return input;
}

document.getElementById('addShortcutBtn').onclick = () => {
  const label = document.getElementById('newLabel').value.trim();
  const url = document.getElementById('newUrl').value.trim();
  const rawUrl = document.getElementById('newUrl').value.trim();
  if (label && rawUrl) {
    const url = normalizeUrl(rawUrl);
    appSettings.shortcuts.push({ label, url });
    document.getElementById('newLabel').value = '';
    document.getElementById('newUrl').value = '';
    saveToDisk();
    renderLinks();
    renderEditor();
  }
};

document.getElementById('searchForm').onsubmit = (e) => {
  e.preventDefault();
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  if (query.startsWith('/')) {
    handleCommand(query);
  } else {
    window.open(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, '_blank');
  }
  document.getElementById('searchInput').value = '';
};

// --- SYSTEM TERMINAL ENGINE ---
const termDrawer = document.getElementById('terminalDrawer');
const termInput = document.getElementById('terminalInput');
const termOutput = document.getElementById('terminalOutput');



// --- TERMINAL INITIALIZATION & DISCLAIMER ---
let terminalInitialized = false; // Reset to false on every page load

function showTerminalDisclaimer() {
  const output = document.getElementById('terminalOutput');
  output.innerHTML = ''; // Clear any previous session logs

  const disclaimer = [
    "--------------------------------------------------",
    "SECURITY NOTICE: RESTRICTED ACCESS ENVIRONMENT",
    "--------------------------------------------------",
    "NOTE: This terminal is a sandboxed simulation designed",
    "for system monitoring and dashboard configuration.",
    "Internal commands only. No direct OS hooks enabled.",
    "--------------------------------------------------",
    "Type 'help' to begin.",
    " "
  ];

  disclaimer.forEach((line, i) => {
    setTimeout(() => {
      printLine(line, 'system');
    }, i * 80); // Slightly faster staggered typing
  });

  terminalInitialized = true;
}

// Update your toggle listener to trigger the disclaimer every fresh session
document.addEventListener('keydown', (e) => {
  if (e.key === '`') {
    e.preventDefault();
    const termDrawer = document.getElementById('terminalDrawer');
    const termInput = document.getElementById('terminalInput');

      termInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          // Only close if input is empty
          if (termInput.value.trim() === '') {
            termDrawer.classList.remove('open');
            e.preventDefault();
          }
        }
      });

    termDrawer.classList.toggle('open');

    if (termDrawer.classList.contains('open')) {
      termInput.focus();
      // Trigger the disclaimer if it hasn't run since the last refresh
      if (!terminalInitialized) {
        showTerminalDisclaimer();
      }
    }
  }
});

// --- CONSOLE INTERCEPTION ---
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  printLine(`[LOG] ${args.join(' ')}`, 'system');
};

console.warn = (...args) => {
  originalWarn(...args);
  printLine(`[WARN] ${args.join(' ')}`, 'warn');
};

console.error = (...args) => {
  originalError(...args);
  printLine(`[ERROR] ${args.join(' ')}`, 'error');
};

// --- NETWORK INTERCEPTION ---
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const url = args[0];
  const options = args[1] || {};
  const method = options.method || 'GET';

  // Log the outgoing request
  console.log(`[NET] FETCH ${method} -> ${url.substring(0, 50)}...`);

  try {
    const response = await originalFetch(...args);

    // Log the result
    if (response.ok) {
      console.log(`[NET] 200 OK: ${url.substring(0, 30)}...`);
    } else {
      console.warn(`[NET] ${response.status} Error: ${url.substring(0, 30)}...`);
    }

    return response;
  } catch (error) {
    console.error(`[NET] FAILED: ${url.substring(0, 30)}... | ${error.message}`);
    throw error;
  }
};

// 2. Command Processor
termInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const fullCmd = termInput.value.trim();
    termInput.value = '';
    if (!fullCmd) return;

    printLine(`> ${fullCmd}`, 'user');
    processTerminalCommand(fullCmd);
  }
});

function printLine(text, type = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;
  line.textContent = text;
  termOutput.appendChild(line);
  termOutput.scrollTop = termOutput.scrollHeight;
}

//ANCHOR - Terminal

// --- COMMAND REGISTRY ---
const terminalCommands = {
  theme: {
    set: (name) => {
      if (!THEMES[name]) {
        printLine(`Unknown theme: ${name}`, "error");
        return;
      }
      appSettings.theme = name;
      applyTheme(name);
      saveToDisk();
      printLine(`Theme set to ${name}`, "system");
    },
    list: () => {
      printLine("Available themes:", "system");
      THEME_NAMES.forEach(t => printLine(`- ${t}`));
    }
  },

  bg: {
    set: (name) => {
      if (!BACKGROUNDS[name]) {
        printLine(`Unknown background: ${name}`, "error");
        return;
      }
      appSettings.bgEffect = name;
      initCanvas();
      saveToDisk();
      printLine(`Background set to ${name}`, "system");
    },
    list: () => {
      printLine("Available backgrounds:", "system");
      BACKGROUND_NAMES.forEach(b => printLine(`- ${b}`));
    }
  },

  name: {
    set: (value) => {
      if (!value) {
        printLine("Usage: name set <value>", "warn");
        return;
      }
      appSettings.userName = value;
      saveToDisk();
      updateClock();
      printLine(`Username set to ${value}`, "system");
    }
  },

  timer: {
    set: (value) => {
      const minutes = parseInt(value, 10);
      if (isNaN(minutes) || minutes <= 0) {
        printLine("Usage: timer set <minutes>", "warn");
        return;
      }
      lastSetTimerMinutes = minutes;
      timerSecs = minutes * 60;
      updateClock();
      saveToDisk();
      printLine(`Timer duration set to ${minutes} minutes`, "system");
    },
  
    start: () => {
      if (isRunning) {
        printLine("Timer already running", "warn");
        return;
      }
      isTimerMode = true;
      document.getElementById('mainCard').classList.add('timer-mode');
      document.getElementById('timerStartBtn').click();
      printLine("Timer started", "system");
    },
  
    stop: () => {
      if (!isRunning) {
        printLine("Timer is not running", "warn");
        return;
      }
      document.getElementById('timerStartBtn').click();
      printLine("Timer paused", "system");
    },
  
    reset: () => {
      resetTimer();
      printLine("Timer reset", "system");
    },
  
    status: () => {
      const mins = Math.floor(timerSecs / 60);
      const secs = timerSecs % 60;
      printLine(
        `Timer: ${isRunning ? "RUNNING" : "STOPPED"} | ${mins}m ${secs}s`,
        "system"
      );
    }
  },

  zen: {
    on: () => {
      if (document.body.classList.contains('zen-active')) {
        printLine("Zen mode already active", "warn");
        return;
      }
      document.body.classList.add('zen-active');
      printLine("Zen mode enabled", "system");
    },
  
    off: () => {
      if (!document.body.classList.contains('zen-active')) {
        printLine("Zen mode is not active", "warn");
        return;
      }
      document.body.classList.remove('zen-active');
      printLine("Zen mode disabled", "system");
    },
  
    toggle: () => {
      document.body.classList.toggle('zen-active');
      printLine(
        `Zen mode ${document.body.classList.contains('zen-active') ? "enabled" : "disabled"}`,
        "system"
      );
    }
  },

  wake: {
    on: async () => {
      if (wakeLock) {
        printLine("Wake Lock already active", "warn");
        return;
      }
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        document.getElementById('wakeLockBtn').classList.add('wl-active');
        printLine("Wake Lock enabled", "system");
  
        wakeLock.addEventListener('release', () => {
          wakeLock = null;
          document.getElementById('wakeLockBtn').classList.remove('wl-active');
          printLine("Wake Lock released", "warn");
        });
      } catch (e) {
        printLine(`Wake Lock failed: ${e.message}`, "error");
      }
    },
  
    off: () => {
      if (!wakeLock) {
        printLine("Wake Lock is not active", "warn");
        return;
      }
      wakeLock.release();
      wakeLock = null;
      document.getElementById('wakeLockBtn').classList.remove('wl-active');
      printLine("Wake Lock disabled", "system");
    },
  
    status: () => {
      printLine(`Wake Lock: ${wakeLock ? "ACTIVE" : "INACTIVE"}`, "system");
    }
  },
};




function processTerminalCommand(input) {
  const [cmd, subcmd, ...args] = input.toLowerCase().split(' ');

  if (terminalCommands[cmd]) {
    const domain = terminalCommands[cmd];
  
    if (domain[subcmd]) {
      domain[subcmd](...args);
    } else {
      printLine(`Unknown subcommand: ${cmd} ${subcmd}`, "error");
    }
    return;
  }

  switch (cmd) {
    case 'help': {
      printLine("=== Terminal Commands ===", "system");
      printLine("Settings & Control:", "system");
      Object.entries(terminalCommands).forEach(([domain, actions]) => {
        printLine(
          `- ${domain}: ${Object.keys(actions).join(', ')}`,
          "system"
        );
      });
      printLine("Diagnostics & Utilities:", "system");
      printLine(
        "- help, clear, status, config, env, net, bench",
        "system"
      );
      printLine(
        "- weather, storage, uptime, locate, ls, reset, exit",
        "system"
      )
      break;
    }
    case 'status':
      const wc = loadWeatherCacheFromStorage();
      printLine(`Theme: ${appSettings.theme}`, "system");
      printLine(`Background: ${appSettings.bgEffect}`, "system");
      printLine(`Weather Cache: ${wc ? 'Active' : 'Empty'}`, "system");
      break;
    case 'config':
      printLine(JSON.stringify(appSettings, null, 2));
      break;
    case 'setname':
      if (args[0]) {
        appSettings.userName = args[0];
        saveToDisk();
        printLine(`Username updated to: ${args[0]}`, "system");
      }
      break;
    case 'reset':
      if (confirm("Wipe all settings and data?")) {
        clearWeatherCacheFromStorage();
        saveSettingsToStorage(null);
        saveTodosToStorage([]);
        location.reload();
      }
      break;
    case 'weather':
      printLine("Fetching fresh weather data (bypassing cache)...", "system");
      clearWeatherCacheFromStorage(); // Clear cache to force fetch
      getWeatherData();
      break;
    case 'ls':
      printLine("--- ACTIVE SHORTCUTS ---", "system");
      appSettings.shortcuts.forEach(s => printLine(`${s.label} -> ${s.url}`));
      break;
    case 'uptime':
      const seconds = Math.floor(performance.now() / 1000);
      const mins = Math.floor(seconds / 60);
      printLine(`Session Uptime: ${mins}m ${seconds % 60}s`, "system");
      break;
    case 'clear':
      termOutput.innerHTML = '';
      printLine("Terminal cleared.", "system");
      break;
    case 'wakelock':
      printLine(`Status: ${wakeLock ? "ACTIVE" : "INACTIVE"}`, "system");
      break;
    case 'storage':
      let totalBytes = 0;
      const settings = loadSettingsFromStorage();
      const todos = loadTodosFromStorage();
      const weather = loadWeatherCacheFromStorage();
      if (settings) totalBytes += JSON.stringify(settings).length;
      if (todos) totalBytes += JSON.stringify(todos).length;
      if (weather) totalBytes += JSON.stringify(weather).length;
      const kb = (totalBytes / 1024).toFixed(2);
      printLine(`Storage Used: ${kb} KB`, "system")
      break;
    case 'exit':
      termDrawer.classList.remove('open');
      break;
    case 'net':
      printLine("--- NETWORK DIAGNOSTICS ---", "system");
      printLine(`Online Status: ${navigator.onLine ? "ONLINE" : "OFFLINE"}`, "system");
      printLine(`User Agent: ${navigator.userAgent.substring(0, 50)}...`, "system");
      const cache = loadWeatherCacheFromStorage();
      if (cache && cache.timestamp) {
        const age = Math.round((Date.now() - cache.timestamp) / 3600000);
        printLine(`Last Weather API Call: ${age} mins ago`, "system");
      } else {
        printLine("No weather cache available", "system")
      }
      break;
    case 'bench':
      const start = performance.now();
      // We trigger one manual frame calculation
      if (appSettings.bgEffect === 'matrix') {
        matrixDrops.forEach(drop => drop.draw(ctx));
      } else {
        particles.forEach(p => p.update());
      }
      const end = performance.now();
      printLine(`Frame Calculation: ${(end - start).toFixed(4)}ms`, "system");
      printLine(`Target: < 16.67ms (60fps)`, "system");
      break;
    case 'env':
      printLine("--- ENVIRONMENT ---", "system");
      printLine(`OS: ${navigator.platform}`, "system");
      printLine(`Display: ${window.screen.width}x${window.screen.height}`, "system");
      printLine(`Language: ${navigator.language}`, "system");
      printLine(`Reduced Motion: ${window.matchMedia('(prefers-reduced-motion: reduce)').matches}`, "system");
      break;
    case 'locate':
      printLine("Accessing GPS...", "system");
      navigator.geolocation.getCurrentPosition(pos => {
        printLine(`LAT: ${pos.coords.latitude.toFixed(4)}`, "system");
        printLine(`LON: ${pos.coords.longitude.toFixed(4)}`, "system");
      }, err => printLine(`GPS Error: ${err.message}`, "error"));
      break;
    case 'about':
      printLine("ZeroPoint Terminal is a localized dashboard utility.", "system");
      printLine("It operates within a secure browser sandbox and cannot", "system");
      printLine("interact with your computer's file system or hardware.", "system");
      printLine("Created for system visualization and dev-mode toggles.", "system");
      break;
    default:
      printLine(`Command not found: ${cmd}`, "error");
  }
}

// Locate your wakeLockBtn.onclick and add these console.log points:
document.getElementById('wakeLockBtn').onclick = async () => {
  const btn = document.getElementById('wakeLockBtn');
  if (!wakeLock) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log("Wake Lock acquired successfully."); // This now appears in terminal
      btn.classList.add('wl-active');
      wakeLock.addEventListener('release', () => {
        if (wakeLock) {
          btn.classList.remove('wl-active');
          console.warn("Wake Lock was released."); // This now appears in terminal
          wakeLock = null;
          btn.classList.remove('wl-active');
        }
      });
    } catch (e) {
      console.error("Wake Lock request failed: " + e.message);
    }
  } else {
    wakeLock.release();
    wakeLock = null;
    btn.classList.remove('wl-active');
  }
};

// Initialize App
setInterval(() => { if (!isTimerMode) updateClock(); }, 1000);
initCanvas();
animateBg();
updateClock();
loadSettings();
