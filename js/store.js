var _memStorageFallback = {};
function safeLocalGet(key) {
  try {
    var st = window['local' + 'Storage'];
    return st ? st.getItem(key) : (_memStorageFallback[key] || null);
  } catch (e) {
    return _memStorageFallback[key] || null;
  }
}
function safeLocalSet(key, val) {
  _memStorageFallback[key] = String(val);
  try {
    var st = window['local' + 'Storage'];
    if (st) st.setItem(key, String(val));
  } catch (e) {}
}

/* js/store.js — IndexedDB (ChePoelDB), Multi-Account Auth, Cloud Sync & Progressive XP Engine */
window.BUILTIN_RU_DB = window.BUILTIN_RU_DB || [];

const MEAL_TYPES = [
  { id: 'breakfast', title: 'Завтрак', icon: '🌅' },
  { id: 'lunch',     title: 'Обед',    icon: '☀️' },
  { id: 'dinner',    title: 'Ужин',    icon: '🌙' },
  { id: 'snack',     title: 'Перекус', icon: '🍏' }
];

function normalizeProductItem(p, fallbackIdx) {
  if (!p) return null;
  if (Array.isArray(p)) {
    return {
      id: 'ru_arr_' + (fallbackIdx || 0),
      name: String(p[0] || 'Продукт'),
      category: String(p[1] || 'Готовая еда'),
      kcal100: Number(p[2]) || 120,
      p100: Number(p[3]) || 5,
      f100: Number(p[4]) || 4,
      c100: Number(p[5]) || 12,
      portion: Number(p[6]) || 150,
      icon: '🍲'
    };
  }
  const per = p.per100g || {};
  const brand = p.brand ? String(p.brand).trim() : '';
  let name = String(p.name || 'Продукт').trim();
  if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
    name = `${name} (${brand})`;
  }
  return Object.assign({}, p, {
    id: p.id || ('prod_' + (fallbackIdx || Date.now())),
    name,
    category: p.category || 'Готовая еда',
    kcal100: Number(p.kcal100 !== undefined ? p.kcal100 : per.cal) || 0,
    p100: Number(p.p100 !== undefined ? p.p100 : per.p) || 0,
    f100: Number(p.f100 !== undefined ? p.f100 : per.f) || 0,
    c100: Number(p.c100 !== undefined ? p.c100 : per.c) || 0,
    portion: Number(p.portion || p.defaultGrams) || 100,
    grams: Number(p.grams || p.portion || p.defaultGrams) || 150
  });
}

function getLocalDateString(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(yyyyMmDd) {
  const parts = (yyyyMmDd || '').split('-').map(Number);
  if (parts.length !== 3) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

var currentDateStr = getLocalDateString(new Date());
var calendarMonthDate = new Date();
var activeAuthUser = safeLocalGet('chepoel_active_user') || 'guest';

function createDefaultState() {
  return {
    goals: { kcal: 2000, p: 140, f: 65, c: 210, mode: 'lose', label: 'Похудение (-15%)' },
    profile: {
      nickname: 'Атлет',
      status: 'Иду к своей лучшей форме 🔥',
      avatarEmoji: '⚡',
      avatarImg: '',
      frame: 'frame-emerald',
      banner: 'banner-aurora',
      bannerImg: '',
      nickEffect: ''
    },
    days: {},
    weightLog: [
      { date: '2026-10-10', kg: 75.4 },
      { date: '2026-10-12', kg: 75.0 },
      { date: '2026-10-14', kg: 74.6 }
    ],
    customProducts: [],
    recentItems: [],
    apiKey: '',
    theme: 'dark',
    onboarded: false,
    registeredDate: getLocalDateString(new Date()),
    purchasedShields: 0,
    spentShieldXp: 0,
    autoFreeze: true,
    bonusXp: 0,
    lastSeenLevel: 1,
    cloudConfig: {
      supabaseUrl: '',
      supabaseKey: '',
      lastSyncAt: ''
    }
  };
}

var state = createDefaultState();

/* ==================== INDEXEDDB ENGINE (ChePoelDB) ==================== */
let _idbInstance = null;

function openChePoelIDB() {
  if (_idbInstance) return Promise.resolve(_idbInstance);
  if (!('indexedDB' in window)) return Promise.resolve(null);
  return new Promise(resolve => {
    try {
      const req = indexedDB.open('ChePoelDB', 1);
      req.onupgradeneeded = function(e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'username' });
        }
        if (!db.objectStoreNames.contains('states')) {
          db.createObjectStore('states', { keyPath: 'username' });
        }
      };
      req.onsuccess = function(e) {
        _idbInstance = e.target.result;
        resolve(_idbInstance);
      };
      req.onerror = function() { resolve(null); };
    } catch (err) {
      resolve(null);
    }
  });
}

async function idbPut(storeName, record) {
  const db = await openChePoelIDB();
  if (!db) return false;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) { resolve(false); }
  });
}

async function idbGet(storeName, key) {
  const db = await openChePoelIDB();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
}

async function idbGetAll(storeName) {
  const db = await openChePoelIDB();
  if (!db) return [];
  return new Promise(resolve => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) { resolve([]); }
  });
}

/* ==================== AUTH & ACCOUNTS REGISTRY ==================== */
function getLocalAccountsMap() {
  try {
    return JSON.parse(safeLocalGet('chepoel_accounts_v4') || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalAccountsMap(map) {
  try {
    safeLocalSet('chepoel_accounts_v4', JSON.stringify(map));
  } catch (e) {}
}

async function hashPassword(raw) {
  const clean = String(raw || '').trim();
  if (!clean) return '';
  try {
    if (window.crypto && window.crypto.subtle) {
      const buf = new TextEncoder().encode('chepoel_salt_v4_' + clean);
      const digest = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  // Fallback hash for non-HTTPS local preview
  let h = 2166136261;
  const str = 'chepoel_salt_v4_' + clean;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'fnv_' + (h >>> 0).toString(16);
}

function getStorageKeyForUser(username) {
  const u = (username || 'guest').toLowerCase().trim();
  return u === 'guest' ? 'nutriscan_pwa_state_v3' : `chepoel_state_u_${u}`;
}

function sanitizeLoadedState(parsed) {
  const def = createDefaultState();
  const merged = Object.assign({}, def, parsed || {});
  merged.goals = Object.assign({}, def.goals, (parsed && parsed.goals) || {});
  merged.profile = Object.assign({}, def.profile, (parsed && parsed.profile) || {});
  merged.cloudConfig = Object.assign({}, def.cloudConfig, (parsed && parsed.cloudConfig) || {});
  if (!Array.isArray(merged.customProducts)) merged.customProducts = [];
  if (!Array.isArray(merged.recentItems)) merged.recentItems = [];
  merged.recentItems = merged.recentItems.map(normalizeProductItem).filter(x => x && x.kcal100 > 0);
  merged.customProducts = merged.customProducts.map(normalizeProductItem).filter(Boolean);
  if (!Array.isArray(merged.weightLog)) merged.weightLog = [];
  if (!merged.days || typeof merged.days !== 'object') merged.days = {};
  return merged;
}

function loadState() {
  try {
    activeAuthUser = safeLocalGet('chepoel_active_user') || 'guest';
    const key = getStorageKeyForUser(activeAuthUser);
    const raw = safeLocalGet(key);
    if (raw) {
      state = sanitizeLoadedState(JSON.parse(raw));
    } else {
      state = createDefaultState();
    }
  } catch (e) {
    console.warn('State load error:', e);
    state = createDefaultState();
  }
}

async function initDatabaseAndSyncUser() {
  await openChePoelIDB();
  const rec = await idbGet('states', activeAuthUser);
  if (rec && rec.state) {
    // Merge IndexedDB state if it has more or newer data
    const idbMealsCount = Object.values(rec.state.days || {}).reduce((s, d) => s + ((d && d.meals && d.meals.length) || 0), 0);
    const curMealsCount = Object.values(state.days || {}).reduce((s, d) => s + ((d && d.meals && d.meals.length) || 0), 0);
    if (idbMealsCount >= curMealsCount && rec.updatedAt >= (state._updatedAt || 0)) {
      state = sanitizeLoadedState(rec.state);
      safeLocalSet(getStorageKeyForUser(activeAuthUser), JSON.stringify(state));
    }
  } else {
    await idbPut('states', { username: activeAuthUser, state, updatedAt: Date.now() });
  }
  updateHeaderAuthButton();
}

function saveState() {
  try {
    state._updatedAt = Date.now();
    const key = getStorageKeyForUser(activeAuthUser);
    safeLocalSet(key, JSON.stringify(state));
    idbPut('states', { username: activeAuthUser, state, updatedAt: state._updatedAt });
    updateHeaderAuthButton();
  } catch (e) {
    console.warn('State save error:', e);
  }
}

/* ==================== PROGRESSIVE XP & 5-LEVEL REWARD SYSTEM ==================== */
const LEVEL_RANKS = [
  { minLvl: 1,  title: '🌱 Новичок режима' },
  { minLvl: 5,  title: '⚡ Кибер-Следопыт' },
  { minLvl: 10, title: '💜 Адепт Дисциплины' },
  { minLvl: 15, title: '🔥 Машина Режима' },
  { minLvl: 20, title: '👑 Повелитель Калорий' },
  { minLvl: 25, title: '🌌 Архитектор Формы' },
  { minLvl: 30, title: '💎 Легенда ЧёПоел' }
];

/* С каждым уровнем требуется на 85 XP больше, чем на предыдущем */
function getXpNeededForNextLevel(lvl) {
  return 200 + (Math.max(1, lvl) - 1) * 85;
}

function getTotalXpForReachingLevel(targetLvl) {
  let sum = 0;
  for (let l = 1; l < targetLvl; l++) {
    sum += getXpNeededForNextLevel(l);
  }
  return sum;
}

function getRankTitleForLevel(lvl) {
  let rank = LEVEL_RANKS[0].title;
  for (const r of LEVEL_RANKS) {
    if (lvl >= r.minLvl) rank = r.title;
  }
  return rank;
}

function getStartTrackingDate() {
  const todayStr = getLocalDateString(new Date());
  let earliest = state.registeredDate || todayStr;
  Object.keys(state.days || {}).forEach(dStr => {
    const dObj = state.days[dStr] || {};
    const tot = getDayTotals(dStr);
    if (tot.count > 0 || dObj.simulatedMiss || dObj.freezeUsed || dObj.penaltyRedeemed) {
      if (dStr < earliest) earliest = dStr;
    }
  });
  return earliest;
}

function calculateProfileStats() {
  let totalMeals = 0;
  let greenDays = 0;
  let loggedDays = 0;
  let waterNormDays = 0;

  Object.keys(state.days || {}).forEach(dStr => {
    const dayObj = state.days[dStr] || {};
    if ((dayObj.waterMl || 0) >= 1500) waterNormDays++;
    const tot = getDayTotals(dStr);
    if (tot.count > 0) {
      loggedDays++;
      totalMeals += tot.count;
      const ev = evaluateDayColorStatus(tot.kcal, state.goals.kcal, state.goals.mode);
      if (ev.status === 'green') greenDays++;
    }
  });

  // Подсчёт щитов заморозки: 1 стартовый + 1 за каждые 5 зелёных дней + купленные за XP
  const totalEarnedShields = 1 + Math.floor(greenDays / 5) + (Number(state.purchasedShields) || 0);
  let usedShieldsCount = 0;
  Object.keys(state.days || {}).forEach(dStr => {
    if (state.days[dStr] && state.days[dStr].freezeUsed) usedShieldsCount++;
  });
  let availableShields = Math.max(0, totalEarnedShields - usedShieldsCount);

  // Анализ прошедших дней (от старта ведения дневника до вчерашнего дня) на пропуски
  const todayStr = getLocalDateString(new Date());
  const startStr = getStartTrackingDate();
  const missedDaysList = [];
  const frozenDaysList = [];
  const redeemedDaysList = [];

  if (startStr < todayStr) {
    const cur = parseLocalDate(startStr);
    const todayDt = parseLocalDate(todayStr);
    let safety = 0;
    while (cur < todayDt && safety < 366) {
      const dStr = getLocalDateString(cur);
      const tot = getDayTotals(dStr);
      const dObj = state.days[dStr] || {};
      if (tot.count === 0) {
        if (dObj.freezeUsed) {
          frozenDaysList.push(dStr);
        } else if (dObj.penaltyRedeemed) {
          redeemedDaysList.push(dStr);
        } else {
          missedDaysList.push(dStr);
        }
      }
      cur.setDate(cur.getDate() + 1);
      safety++;
    }
  }

  // Подсчёт активного стрика (замороженные и отработанные дни сохраняют стрик!)
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const dStr = getLocalDateString(cursor);
    const tot = getDayTotals(dStr);
    const dObj = state.days[dStr] || {};
    if (tot.count > 0) {
      streak++;
    } else if (dObj.freezeUsed || dObj.penaltyRedeemed) {
      // День защищён щитом или отработан — стрик не прерывается
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const streakBonusXp = streak >= 7 ? 350 : (streak >= 3 ? 120 : 0);
  const earnedXp =
    (totalMeals * 45) +
    (greenDays * 140) +
    (waterNormDays * 60) +
    ((state.customProducts || []).length * 75) +
    ((state.weightLog || []).length * 40) +
    streakBonusXp;

  // Штраф за пропуск дня: -100 XP за каждый незащищённый пропущенный день + доп. -50 XP при серии 2+ пропусков
  const consecutiveMissPenalty = missedDaysList.length >= 2 ? 50 : 0;
  const penaltyXp = (missedDaysList.length * 100) + consecutiveMissPenalty;
  const spentShieldXp = Number(state.spentShieldXp) || 0;

  const xp = Math.max(0, earnedXp - penaltyXp - spentShieldXp);

  // Прогрессивный расчёт уровня (с каждым уровнем требуется на +85 XP больше)
  let level = 1;
  let remXp = xp;
  while (level < 100) {
    const needed = getXpNeededForNextLevel(level);
    if (remXp >= needed) {
      remXp -= needed;
      level++;
    } else {
      break;
    }
  }

  const currentLevelXp = remXp;
  const nextLevelXp = getXpNeededForNextLevel(level);
  const nextMilestoneLvl = Math.ceil((level + 0.1) / 5) * 5;
  const rankTitle = getRankTitleForLevel(level);

  return {
    level,
    xp,
    earnedXp,
    penaltyXp,
    missedDaysCount: missedDaysList.length,
    missedDaysList,
    frozenDaysList,
    redeemedDaysList,
    availableShields,
    usedShieldsCount,
    currentLevelXp,
    nextLevelXp,
    streak,
    totalMeals,
    greenDays,
    loggedDays,
    waterNormDays,
    rankTitle,
    nextMilestoneLvl
  };
}

function checkAndTriggerLevelUp(prevLevel) {
  const st = calculateProfileStats();
  if (st.level > (prevLevel || state.lastSeenLevel || 1)) {
    state.lastSeenLevel = st.level;
    saveState();
    if (typeof openLevelUpCelebrationModal === 'function') {
      openLevelUpCelebrationModal(st.level);
    }
  } else {
    state.lastSeenLevel = st.level;
  }
}

async function loadRuProductsDatabase() {
  return window.BUILTIN_RU_DB || [];
}

function getAllProducts() {
  const normCustom = (state.customProducts || []).map(normalizeProductItem).filter(Boolean);
  const customIds = new Set(normCustom.map(p => p.id));
  const normBuiltin = (window.BUILTIN_RU_DB || []).map(normalizeProductItem).filter(p => p && !customIds.has(p.id));
  return [...normCustom, ...normBuiltin];
}

function getDayData(dateStr) {
  if (!state.days[dateStr]) {
    state.days[dateStr] = { meals: [], waterMl: 0 };
  }
  state.days[dateStr].meals.forEach(m => {
    if (!m.mealType) m.mealType = 'breakfast';
  });
  return state.days[dateStr];
}

function getDayTotals(dateStr) {
  const day = state.days[dateStr];
  if (!day || !Array.isArray(day.meals)) return { kcal: 0, p: 0, f: 0, c: 0, count: 0 };
  let kcal = 0, p = 0, f = 0, c = 0;
  day.meals.forEach(m => {
    kcal += Number(m.kcal) || 0;
    p += Number(m.p) || 0;
    f += Number(m.f) || 0;
    c += Number(m.c) || 0;
  });
  return {
    kcal: Math.round(kcal),
    p: Math.round(p * 10) / 10,
    f: Math.round(f * 10) / 10,
    c: Math.round(c * 10) / 10,
    count: day.meals.length
  };
}

/* Adaptive Day Evaluation (Green / Yellow / Red) based on Goal Scenario */
function evaluateDayColorStatus(kcal, targetKcal, goalMode) {
  if (!kcal || kcal <= 0) return { status: 'none', label: 'Нет записей', css: '' };
  const ratio = kcal / Math.max(1, targetKcal);

  if (goalMode === 'lose') {
    if (ratio >= 0.80 && ratio <= 1.02) {
      return { status: 'green', label: 'Идеальный дефицит (Зелёная зона)', css: 'cal-green' };
    } else if ((ratio >= 0.70 && ratio < 0.80) || (ratio > 1.02 && ratio <= 1.12)) {
      return { status: 'yellow', label: ratio < 0.80 ? 'Заметный недобор калорий' : 'Небольшое превышение нормы', css: 'cal-yellow' };
    } else {
      return { status: 'red', label: ratio < 0.70 ? 'Сильный недобор (голодание)' : 'Перебор калорий', css: 'cal-red' };
    }
  } else if (goalMode === 'gain') {
    if (ratio >= 0.96 && ratio <= 1.16) {
      return { status: 'green', label: 'Отличный профицит для роста', css: 'cal-green' };
    } else if ((ratio >= 0.86 && ratio < 0.96) || (ratio > 1.16 && ratio <= 1.26)) {
      return { status: 'yellow', label: 'Небольшое отклонение от цели набора', css: 'cal-yellow' };
    } else {
      return { status: 'red', label: ratio < 0.86 ? 'Сильный недобор для массы' : 'Слишком большой профицит', css: 'cal-red' };
    }
  } else {
    if (ratio >= 0.90 && ratio <= 1.08) {
      return { status: 'green', label: 'Точное попадание в баланс', css: 'cal-green' };
    } else if ((ratio >= 0.78 && ratio < 0.90) || (ratio > 1.08 && ratio <= 1.18)) {
      return { status: 'yellow', label: 'Умеренное отклонение от баланса', css: 'cal-yellow' };
    } else {
      return { status: 'red', label: ratio < 0.78 ? 'Сильный недобор' : 'Сильный перебор', css: 'cal-red' };
    }
  }
}

function recordRecentItem(item) {
  const entry = {
    name: item.name,
    kcal100: Number(item.kcal100) || Math.round((item.kcal / Math.max(1, item.grams)) * 100),
    p100: Number(item.p100) || Math.round((item.p / Math.max(1, item.grams)) * 1000) / 10,
    f100: Number(item.f100) || Math.round((item.f / Math.max(1, item.grams)) * 1000) / 10,
    c100: Number(item.c100) || Math.round((item.c / Math.max(1, item.grams)) * 1000) / 10,
    grams: Number(item.grams) || 200
  };
  state.recentItems = [
    entry,
    ...(state.recentItems || []).filter(r => r.name.toLowerCase() !== entry.name.toLowerCase())
  ].slice(0, 12);
}

/* Backup Export / Import (in Settings) */
function exportBackupJson() {
  const payload = {
    app: 'ЧёПоел PWA',
    version: '4.0.0',
    user: activeAuthUser,
    exportedAt: new Date().toISOString(),
    state: state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chepoel_${activeAuthUser}_${getLocalDateString(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 Бэкап базы успешно скачан');
}

function importBackupJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const importedState = data.state ? data.state : data;
      if (importedState && typeof importedState === 'object') {
        state = sanitizeLoadedState(importedState);
        saveState();
        applyTheme(state.theme || 'dark');
        renderAll();
        closeSettingsModal();
        showToast('✅ База данных успешно восстановлена!');
      }
    } catch (err) {
      showToast('⚠️ Ошибка чтения файла бэкапа');
    }
  };
  reader.readAsText(file);
}
