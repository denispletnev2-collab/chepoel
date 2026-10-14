
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

/* js/store.js — State Management, Async RU Database Loader, XP/Streak Engine & JSON Backup */
window.BUILTIN_RU_DB = window.BUILTIN_RU_DB || [];

const MEAL_TYPES = [
  { id: 'breakfast', title: 'Завтрак', icon: '🌅' },
  { id: 'lunch',     title: 'Обед',    icon: '☀️' },
  { id: 'dinner',    title: 'Ужин',    icon: '🌙' },
  { id: 'snack',     title: 'Перекус', icon: '🍏' }
];

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

let currentDateStr = getLocalDateString(new Date());
let calendarMonthDate = new Date();

let state = {
  goals: { kcal: 2000, p: 140, f: 65, c: 210, mode: 'lose', label: 'Похудение (-15%)' },
  profile: {
    nickname: 'CyberAthlete',
    status: 'На сушке • Иду к цели 🔥',
    avatarEmoji: '⚡',
    avatarImg: '',
    frame: 'frame-cyber',
    banner: 'banner-cyber',
    bannerImg: ''
  },
  days: {},
  weightLog: [
    { date: '2026-10-08', kg: 75.4 },
    { date: '2026-10-10', kg: 75.0 },
    { date: '2026-10-12', kg: 74.6 },
    { date: '2026-10-14', kg: 74.2 }
  ],
  customProducts: [],
  recentItems: [],
  apiKey: '',
  theme: 'dark',
  onboarded: false
};

function loadState() {
  try {
    const raw = localStorage.getItem('nutriscan_pwa_state_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign({}, state, parsed);
      state.goals = Object.assign({ kcal: 2000, p: 140, f: 65, c: 210, mode: 'lose', label: 'Похудение (-15%)' }, parsed.goals || {});
      state.profile = Object.assign({
        nickname: 'CyberAthlete',
        status: 'На сушке • Иду к цели 🔥',
        avatarEmoji: '⚡',
        avatarImg: '',
        frame: 'frame-cyber',
        banner: 'banner-cyber',
        bannerImg: ''
      }, parsed.profile || {});
      if (!Array.isArray(state.customProducts)) state.customProducts = [];
      if (!Array.isArray(state.recentItems)) state.recentItems = [];
      state.recentItems = state.recentItems.map(normalizeProductItem).filter(x => x && x.kcal100 > 0);
      state.customProducts = (state.customProducts || []).map(normalizeProductItem).filter(Boolean);
      if (!Array.isArray(state.weightLog)) state.weightLog = [];
    }
  } catch (e) {
    console.warn('State load error:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem('nutriscan_pwa_state_v3', JSON.stringify(state));
  } catch (e) {
    console.warn('State save error:', e);
  }
}

async function loadRuProductsDatabase() {
  if (window.BUILTIN_RU_DB && window.BUILTIN_RU_DB.length > 0) return window.BUILTIN_RU_DB;
  try {
    const res = await fetch('./assets/data/ru-products.json');
    if (res.ok) {
      window.BUILTIN_RU_DB = await res.json();
    }
  } catch (e) {
    console.warn('Offline or local file mode, using embedded DB if available');
  }
  return window.BUILTIN_RU_DB;
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
  // Ensure legacy meals without mealType default to 'breakfast'
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
    // Похудение: умеренный дефицит или норма (80%..102%) = отлично (зелёный)
    // Сильный недобор (<70%) или перебор (>112%) = плохо (красный)
    if (ratio >= 0.80 && ratio <= 1.02) {
      return { status: 'green', label: 'Идеальный дефицит (Зелёная зона)', css: 'cal-green' };
    } else if ((ratio >= 0.70 && ratio < 0.80) || (ratio > 1.02 && ratio <= 1.12)) {
      return { status: 'yellow', label: ratio < 0.80 ? 'Заметный недобор калорий' : 'Небольшое превышение нормы', css: 'cal-yellow' };
    } else {
      return { status: 'red', label: ratio < 0.70 ? 'Сильный недобор (голодание)' : 'Перебор калорий', css: 'cal-red' };
    }
  } else if (goalMode === 'gain') {
    // Набор массы: качественный профицит (96%..116%) = отлично (зелёный)
    if (ratio >= 0.96 && ratio <= 1.16) {
      return { status: 'green', label: 'Отличный профицит для роста', css: 'cal-green' };
    } else if ((ratio >= 0.86 && ratio < 0.96) || (ratio > 1.16 && ratio <= 1.26)) {
      return { status: 'yellow', label: 'Небольшое отклонение от цели набора', css: 'cal-yellow' };
    } else {
      return { status: 'red', label: ratio < 0.86 ? 'Сильный недобор для массы' : 'Слишком большой профицит', css: 'cal-red' };
    }
  } else {
    // Поддержание: 90%..108% = зелёный
    if (ratio >= 0.90 && ratio <= 1.08) {
      return { status: 'green', label: 'Точное попадание в баланс', css: 'cal-green' };
    } else if ((ratio >= 0.78 && ratio < 0.90) || (ratio > 1.08 && ratio <= 1.18)) {
      return { status: 'yellow', label: 'Умеренное отклонение от баланса', css: 'cal-yellow' };
    } else {
      return { status: 'red', label: ratio < 0.78 ? 'Сильный недобор' : 'Сильный перебор', css: 'cal-red' };
    }
  }
}

/* Gamification: Calculate XP, Level & Streak */
function calculateProfileStats() {
  let totalMeals = 0;
  let greenDays = 0;
  let loggedDays = 0;

  Object.keys(state.days).forEach(dStr => {
    const tot = getDayTotals(dStr);
    if (tot.count > 0) {
      loggedDays++;
      totalMeals += tot.count;
      const ev = evaluateDayColorStatus(tot.kcal, state.goals.kcal, state.goals.mode);
      if (ev.status === 'green') greenDays++;
    }
  });

  // Calculate active streak ending today or yesterday
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const dStr = getLocalDateString(cursor);
    const tot = getDayTotals(dStr);
    if (tot.count > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  const xp = (totalMeals * 40) + (greenDays * 150) + ((state.customProducts || []).length * 60);
  const level = Math.max(1, Math.floor(xp / 300) + 1);
  const currentLevelXp = xp % 300;
  const nextLevelXp = 300;

  return { level, xp, currentLevelXp, nextLevelXp, streak, totalMeals, greenDays, loggedDays };
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
    version: '3.0.0',
    exportedAt: new Date().toISOString(),
    state: state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chepoel_backup_${getLocalDateString(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 Бэкап успешно скачан');
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
        state = Object.assign({}, state, importedState);
        saveState();
        applyTheme(state.theme || 'dark');
        renderAll();
        closeSettingsModal();
        showToast('✅ Бэкап успешно восстановлен!');
      }
    } catch (err) {
      showToast('⚠️ Ошибка чтения файла бэкапа');
    }
  };
  reader.readAsText(file);
}
