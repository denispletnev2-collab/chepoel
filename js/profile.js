/* js/profile.js — 3 Base Themes, Every-5-Levels Progression Rewards, Heatmap Calendar & Weight Chart */
const AVATAR_FRAMES = [
  // 3 Базовые рамки (доступны сразу с 1 уровня)
  { id: 'frame-minimal', name: 'Obsidian Glass',     reqLvl: 1,  tier: 'Базовая' },
  { id: 'frame-emerald', name: 'Emerald Base',       reqLvl: 1,  tier: 'Базовая' },
  { id: 'frame-ocean',   name: 'Cobalt Pulse',       reqLvl: 1,  tier: 'Базовая' },
  // Наградные рамки каждые 5 уровней по нарастанию крутости
  { id: 'frame-cyber',   name: 'Cyberpunk Neon',     reqLvl: 5,  tier: 'Награда 5 ур.' },
  { id: 'frame-discord', name: 'Nitro Plasma',       reqLvl: 10, tier: 'Награда 10 ур.' },
  { id: 'frame-fire',    name: 'Hellfire Blaze',     reqLvl: 15, tier: 'Награда 15 ур.' },
  { id: 'frame-gold',    name: 'Dragon Lore Gold',   reqLvl: 20, tier: 'Награда 20 ур.' },
  { id: 'frame-quantum', name: 'Quantum Singularity',reqLvl: 25, tier: 'Награда 25 ур.' },
  { id: 'frame-chroma',  name: 'Chroma RGB Godlike', reqLvl: 30, tier: 'Награда 30 ур.' }
];

const PROFILE_BANNERS = [
  // 3 Базовые расцветки профиля (доступны сразу с 1 уровня)
  { id: 'banner-obsidian', name: 'Obsidian Slate',      reqLvl: 1,  tier: 'Базовая расцветка' },
  { id: 'banner-aurora',   name: 'Emerald Aurora',      reqLvl: 1,  tier: 'Базовая расцветка' },
  { id: 'banner-ocean',    name: 'Deep Ocean',          reqLvl: 1,  tier: 'Базовая расцветка' },
  // Наградные расцветки каждые 5 уровней по нарастанию крутости
  { id: 'banner-cyber',    name: 'Synthwave Cyber Grid',reqLvl: 5,  tier: 'Награда 5 ур.' },
  { id: 'banner-nebula',   name: 'Galactic Nitro Nebula',reqLvl: 10, tier: 'Награда 10 ур.' },
  { id: 'banner-tokyo',    name: 'Crimson Inferno',     reqLvl: 15, tier: 'Награда 15 ур.' },
  { id: 'banner-gold',     name: 'Golden Imperial',     reqLvl: 20, tier: 'Награда 20 ур.' },
  { id: 'banner-quantum',  name: 'Quantum Matrix (Аним.)', reqLvl: 25, tier: 'Награда 25 ур.' },
  { id: 'banner-chroma',   name: 'Chroma RGB Godlike',  reqLvl: 30, tier: 'Награда 30 ур.' }
];

const NICK_EFFECTS = [
  { id: '',             name: 'Классический белый', reqLvl: 1,  tier: 'Базовый' },
  { id: 'nick-cyber',   name: 'Кибер-Неон',         reqLvl: 5,  tier: 'Награда 5 ур.' },
  { id: 'nick-nitro',   name: 'Ультрафиолет Nitro', reqLvl: 10, tier: 'Награда 10 ур.' },
  { id: 'nick-fire',    name: 'Пламенный Инферно',  reqLvl: 15, tier: 'Награда 15 ур.' },
  { id: 'nick-gold',    name: 'Золотой Металлик',   reqLvl: 20, tier: 'Награда 20 ур.' },
  { id: 'nick-quantum', name: 'Квантовый Изумруд',  reqLvl: 25, tier: 'Награда 25 ур.' },
  { id: 'nick-chroma',  name: 'Радужный RGB Босс',  reqLvl: 30, tier: 'Награда 30 ур.' }
];

const LEVEL_MILESTONE_REWARDS = [
  {
    lvl: 1,
    title: '🌱 Стартовый набор (База)',
    desc: '3 базовые расцветки профиля (Obsidian Slate, Emerald Aurora, Deep Ocean) и 3 базовые рамки аватара.',
    banner: 'banner-aurora',
    frame: 'frame-emerald',
    nickEffect: ''
  },
  {
    lvl: 5,
    title: '⚡ Кибер-Следопыт (Тир 1)',
    desc: 'Неоновая расцветка Synthwave Cyber Grid, вращающаяся рамка Cyberpunk Neon и неоновый градиент никнейма.',
    banner: 'banner-cyber',
    frame: 'frame-cyber',
    nickEffect: 'nick-cyber'
  },
  {
    lvl: 10,
    title: '💜 Адепт Дисциплины (Тир 2)',
    desc: 'Космическая расцветка Galactic Nitro Nebula, ультрафиолетовая рамка Nitro Plasma и свечение ника Nitro.',
    banner: 'banner-nebula',
    frame: 'frame-discord',
    nickEffect: 'nick-nitro'
  },
  {
    lvl: 15,
    title: '🔥 Машина Режима (Тир 3)',
    desc: 'Огненная расцветка Crimson Inferno, пульсирующая рамка Hellfire Blaze и пламенный градиент никнейма.',
    banner: 'banner-tokyo',
    frame: 'frame-fire',
    nickEffect: 'nick-fire'
  },
  {
    lvl: 20,
    title: '👑 Повелитель Калорий (Тир 4)',
    desc: 'Королевская расцветка Golden Imperial, золотая рамка Dragon Lore Gold с ореолом и золотой никнейм.',
    banner: 'banner-gold',
    frame: 'frame-gold',
    nickEffect: 'nick-gold'
  },
  {
    lvl: 25,
    title: '🌌 Архитектор Формы (Тир 5)',
    desc: 'Живой анимированный баннер Quantum Matrix, плазменная рамка Quantum Singularity и голографический ник.',
    banner: 'banner-quantum',
    frame: 'frame-quantum',
    nickEffect: 'nick-quantum'
  },
  {
    lvl: 30,
    title: '💎 Легенда ЧёПоел (Godlike Тир 6)',
    desc: 'Полноцветный переливающийся RGB-баннер Chroma Godlike, радужная рамка 360° и легендарный перелив ника.',
    banner: 'banner-chroma',
    frame: 'frame-chroma',
    nickEffect: 'nick-chroma'
  }
];

function ensureUnlockedCosmetics(stats) {
  const p = state.profile;
  const fObj = AVATAR_FRAMES.find(x => x.id === p.frame);
  if (!fObj || stats.level < fObj.reqLvl) {
    p.frame = 'frame-emerald';
  }
  const bObj = PROFILE_BANNERS.find(x => x.id === p.banner);
  if (!bObj || stats.level < bObj.reqLvl) {
    p.banner = 'banner-aurora';
  }
  const nObj = NICK_EFFECTS.find(x => x.id === (p.nickEffect || ''));
  if (!nObj || stats.level < nObj.reqLvl) {
    p.nickEffect = '';
  }
}

function renderProfileView() {
  const stats = calculateProfileStats();
  ensureUnlockedCosmetics(stats);
  const p = state.profile;

  // Banner & Avatar
  const bannerEl = document.getElementById('profBannerEl');
  if (bannerEl) {
    bannerEl.className = 'profile-banner ' + (p.banner || 'banner-aurora');
    bannerEl.style.backgroundImage = p.bannerImg ? `url(${p.bannerImg})` : '';
  }

  const avatarEl = document.getElementById('profAvatarEl');
  if (avatarEl) {
    avatarEl.className = 'profile-avatar ' + (p.frame || 'frame-emerald');
    if (p.avatarImg) {
      avatarEl.innerHTML = `<img src="${p.avatarImg}" alt="avatar">`;
    } else {
      avatarEl.textContent = p.avatarEmoji || '⚡';
    }
  }

  const nickEl = document.getElementById('profNicknameEl');
  if (nickEl) {
    nickEl.textContent = p.nickname || 'Атлет';
    nickEl.className = p.nickEffect || '';
  }

  const rankBadgeEl = document.getElementById('profRankBadgeEl');
  if (rankBadgeEl) {
    rankBadgeEl.textContent = stats.rankTitle;
  }

  const greetEl = document.getElementById('headerUserGreeting');
  if (greetEl) {
    const accLabel = activeAuthUser === 'guest' ? 'Локальная БД' : `@${activeAuthUser}`;
    greetEl.textContent = `${p.nickname || 'Атлет'} (${accLabel}) • Ур. ${stats.level}`;
  }

  const statusEl = document.getElementById('profStatusEl');
  if (statusEl) statusEl.textContent = p.status || 'На сушке • Иду к цели';

  const lvlPill = document.getElementById('profLvlPill');
  if (lvlPill) lvlPill.textContent = `LVL ${stats.level} • 🔥 ${stats.streak} дн.`;

  const xpText = document.getElementById('profXpText');
  if (xpText) {
    xpText.textContent = `${stats.currentLevelXp} / ${stats.nextLevelXp} XP до ур. ${stats.level + 1} (Всего: ${stats.xp} XP)`;
  }

  const xpFill = document.getElementById('profXpFill');
  if (xpFill) {
    xpFill.style.width = Math.min(100, Math.round((stats.currentLevelXp / Math.max(1, stats.nextLevelXp)) * 100)) + '%';
  }

  const nextMilestoneHint = document.getElementById('profNextRewardHint');
  if (nextMilestoneHint) {
    const nextTier = LEVEL_MILESTONE_REWARDS.find(r => r.lvl > stats.level);
    if (nextTier) {
      const needTotalXp = getTotalXpForReachingLevel(nextTier.lvl);
      const leftXp = Math.max(0, needTotalXp - stats.xp);
      nextMilestoneHint.innerHTML = `🎁 Следующая награда на <strong>${nextTier.lvl} уровне</strong> («${nextTier.title}») — осталось <strong>${leftXp} XP</strong>`;
    } else {
      nextMilestoneHint.innerHTML = `💎 Вы открыли все максимальные награды 30 уровня!`;
    }
  }

  // Badges Showcase
  const badges = [
    { icon: '📸', title: 'ИИ-Сканер', unlocked: stats.totalMeals >= 1 },
    { icon: '🎯', title: 'Снайпер КБЖУ', unlocked: stats.greenDays >= 1 },
    { icon: '🔥', title: 'Стрик 3+ дня', unlocked: stats.streak >= 3 },
    { icon: '👨‍🍳', title: 'Шеф своих блюд', unlocked: (state.customProducts || []).length >= 1 },
    { icon: '⚡', title: 'Тир 5 LVL', unlocked: stats.level >= 5 },
    { icon: '👑', title: `Уровень ${stats.level}`, unlocked: true }
  ];
  const badgesWrap = document.getElementById('profBadgesWrap');
  if (badgesWrap) {
    badgesWrap.innerHTML = badges.map(b => `
      <span class="ach-badge ${b.unlocked ? 'unlocked' : ''}">
        <span>${b.icon}</span><span>${b.title}</span>
      </span>
    `).join('');
  }

  renderAdaptiveCalendar();
  renderWeightChart();
}

function changeCalendarMonth(delta) {
  calendarMonthDate.setMonth(calendarMonthDate.getMonth() + delta);
  renderAdaptiveCalendar();
}

function renderAdaptiveCalendar() {
  const y = calendarMonthDate.getFullYear();
  const m = calendarMonthDate.getMonth();
  const monthTitle = calendarMonthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const lbl = document.getElementById('calMonthLabel');
  if (lbl) lbl.textContent = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  const modeLabels = {
    lose: 'Сценарий: Похудение (зелёный = лёгкий дефицит 80–102%, красный = голод <70% или перебор >112%)',
    maintain: 'Сценарий: Поддержание (зелёный = баланс 90–108%, красный = сильное отклонение)',
    gain: 'Сценарий: Набор массы (зелёный = профицит 96–116%, красный = недобор <86% или перебор)'
  };
  const hintEl = document.getElementById('calScenarioHint');
  if (hintEl) hintEl.textContent = modeLabels[state.goals.mode] || modeLabels.lose;

  const firstDay = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const todayStr = getLocalDateString(new Date());
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(`<div class="cal-cell empty"></div>`);
  }

  const startTrackStr = getStartTrackingDate();
  const stats = calculateProfileStats();
  const calPenEl = document.getElementById('calPenaltySummaryText');
  if (calPenEl) {
    calPenEl.innerHTML = stats.missedDaysCount > 0
      ? `<span style="color:var(--rose); font-weight:800;">⚠️ Пропусков: ${stats.missedDaysCount} дн. (-${stats.penaltyXp} XP)</span> • 🛡️ Щитов: ${stats.availableShields}`
      : `<span style="color:var(--accent); font-weight:700;">🟢 Без пропусков</span> • 🛡️ Щитов заморозки: <strong>${stats.availableShields} шт.</strong>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const tot = getDayTotals(dStr);
    const dayObj = state.days[dStr] || {};
    let ev = evaluateDayColorStatus(tot.kcal, state.goals.kcal, state.goals.mode);
    const isToday = dStr === todayStr ? 'cal-today' : '';
    let subLabel = tot.kcal > 0 ? `${tot.kcal}` : '—';
    let cellClass = ev.css;
    let titleTip = `${dStr}: ${tot.kcal} ккал (${ev.label})`;

    if (tot.count === 0 && dStr >= startTrackStr && dStr < todayStr) {
      if (dayObj.freezeUsed) {
        cellClass = 'cal-frozen';
        subLabel = '🛡️ Щит';
        titleTip = `${dStr}: День защищён Щитом заморозки (штраф 0 XP)`;
      } else if (dayObj.penaltyRedeemed) {
        cellClass = 'cal-redeemed';
        subLabel = '⚡ Отраб.';
        titleTip = `${dStr}: Пропуск отработан квестом дисциплины (штраф списан)`;
      } else {
        cellClass = 'cal-missed';
        subLabel = '⚠️ -100';
        titleTip = `${dStr}: Пропуск дня! Штраф -100 XP (нажмите, чтобы исправить)`;
      }
    }

    cells.push(`
      <div class="cal-cell ${cellClass} ${isToday}" onclick="inspectCalendarDay('${dStr}')" title="${titleTip}">
        <span>${d}</span>
        <span class="cal-sub">${subLabel}</span>
      </div>
    `);
  }

  const gridEl = document.getElementById('calGridEl');
  if (gridEl) gridEl.innerHTML = cells.join('');
}

function inspectCalendarDay(dateStr) {
  const tot = getDayTotals(dateStr);
  const dayObj = state.days[dateStr] || {};
  const todayStr = getLocalDateString(new Date());
  const startTrackStr = getStartTrackingDate();
  const stats = calculateProfileStats();
  const ev = evaluateDayColorStatus(tot.kcal, state.goals.kcal, state.goals.mode);
  const box = document.getElementById('calDayInspector');
  if (!box) return;
  box.style.display = 'block';

  const isMissed = tot.count === 0 && dateStr >= startTrackStr && dateStr < todayStr && !dayObj.freezeUsed && !dayObj.penaltyRedeemed;
  if (isMissed) {
    box.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div>
          <div style="font-size:13px; font-weight:800; color:var(--rose);">⚠️ ${dateStr} — Пропуск дня (Штраф -100 XP)</div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px;">
            В этот день не было записей. Вы можете заполнить рацион задним числом, применить 🛡️ Щит заморозки (доступно: ${stats.availableShields} шт.) или отработать штраф квестом!
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="jumpToDiaryDate('${dateStr}')">✍️ Внести еду за ${dateStr}</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="useFreezeShieldOnDay('${dateStr}')">🛡️ Применить щит (${stats.availableShields})</button>
          <button type="button" class="btn btn-purple btn-sm" onclick="openDisciplineModal('${dateStr}')">💪 Отработать штраф</button>
        </div>
      </div>
    `;
    return;
  }

  const statusNote = dayObj.freezeUsed
    ? '🛡️ Защищён Щитом заморозки (штраф 0 XP)'
    : (dayObj.penaltyRedeemed ? '⚡ Штраф отработан квестом дисциплины' : `${ev.label} • Б: ${tot.p}г • Ж: ${tot.f}г • У: ${tot.c}г`);

  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <div>
        <div style="font-size:13px; font-weight:800;">📅 ${dateStr} — ${tot.kcal} из ${state.goals.kcal} ккал</div>
        <div style="font-size:11px; color:var(--muted); margin-top:2px;">${statusNote}</div>
      </div>
      <button type="button" class="btn btn-primary btn-sm" onclick="jumpToDiaryDate('${dateStr}')">Открыть день →</button>
    </div>
  `;
}

function jumpToDiaryDate(dateStr) {
  currentDateStr = dateStr;
  renderDiaryView();
  switchMainTab('diary');
}

/* Body Weight Tracker & SVG Line Chart */
function addBodyWeightEntry() {
  const inp = document.getElementById('newWeightInput');
  const val = parseFloat(inp.value);
  if (!val || val < 30 || val > 250) {
    showToast('Введите корректный вес в кг');
    return;
  }
  const prevLvl = calculateProfileStats().level;
  const dStr = getLocalDateString(new Date());
  const existingIdx = state.weightLog.findIndex(w => w.date === dStr);
  if (existingIdx >= 0) {
    state.weightLog[existingIdx].kg = val;
  } else {
    state.weightLog.push({ date: dStr, kg: val });
  }
  state.weightLog.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  renderProfileView();
  checkAndTriggerLevelUp(prevLvl);
  showToast(`⚖️ Вес ${val} кг сохранён (+40 XP)`);
}

function renderWeightChart() {
  const svg = document.getElementById('weightChartSvg');
  if (!svg) return;
  const log = (state.weightLog || []).slice(-10);
  if (log.length === 0) {
    svg.innerHTML = '';
    return;
  }
  const weights = log.map(x => x.kg);
  const minW = Math.min(...weights) - 0.8;
  const maxW = Math.max(...weights) + 0.8;
  const w = 320, h = 100, padX = 24, padY = 18;

  const pts = log.map((item, i) => {
    const x = log.length === 1 ? w / 2 : padX + (i / (log.length - 1)) * (w - padX * 2);
    const y = h - padY - ((item.kg - minW) / Math.max(0.5, maxW - minW)) * (h - padY * 2);
    return { x, y, kg: item.kg, date: item.date.slice(5) };
  });

  const polyPoints = pts.map(p => `${p.x},${p.y}`).join(' ');
  svg.innerHTML = `
    <polyline fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${polyPoints}" />
    ${pts.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="var(--bg)" stroke="var(--accent)" stroke-width="2.5" />
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" fill="var(--text)" font-size="10" font-weight="700">${p.kg}</text>
      <text x="${p.x}" y="${h - 3}" text-anchor="middle" fill="var(--muted)" font-size="9">${p.date}</text>
    `).join('')}
  `;
}

/* ==================== PROFILE CUSTOMIZER MODAL (WITH LEVEL LOCKS) ==================== */
function openProfileCustomizer() {
  const stats = calculateProfileStats();
  const p = state.profile;
  document.getElementById('custNickInput').value = p.nickname || '';
  document.getElementById('custStatusInput').value = p.status || '';
  document.getElementById('custEmojiInput').value = p.avatarEmoji || '⚡';

  document.getElementById('frameSelectorGrid').innerHTML = AVATAR_FRAMES.map(f => {
    const unlocked = stats.level >= f.reqLvl;
    const isActive = p.frame === f.id;
    return `
      <button type="button" class="cosmetic-pick-btn ${isActive ? 'active' : ''} ${unlocked ? '' : 'locked'}"
        onclick="selectProfileFrame('${f.id}', ${f.reqLvl})">
        <div style="font-size:12px; font-weight:800;">${unlocked ? '✨' : '🔒'} ${f.name}</div>
        <span class="cosmetic-lvl-tag ${unlocked ? 'unlocked' : 'locked'}">
          ${unlocked ? `Открыто (${f.tier})` : `Требуется ${f.reqLvl} ур.`}
        </span>
      </button>
    `;
  }).join('');

  document.getElementById('bannerSelectorGrid').innerHTML = PROFILE_BANNERS.map(b => {
    const unlocked = stats.level >= b.reqLvl;
    const isActive = p.banner === b.id && !p.bannerImg;
    return `
      <button type="button" class="cosmetic-pick-btn ${isActive ? 'active' : ''} ${unlocked ? '' : 'locked'}"
        onclick="selectProfileBanner('${b.id}', ${b.reqLvl})">
        <div style="display:flex; align-items:center; gap:7px; width:100%;">
          <span class="${b.id}" style="width:22px; height:22px; border-radius:6px; border:1px solid rgba(255,255,255,0.25); flex-shrink:0;"></span>
          <span style="font-size:12px; font-weight:800;">${unlocked ? '' : '🔒 '}${b.name}</span>
        </div>
        <span class="cosmetic-lvl-tag ${unlocked ? 'unlocked' : 'locked'}">
          ${unlocked ? `Открыто (${b.tier})` : `Требуется ${b.reqLvl} ур.`}
        </span>
      </button>
    `;
  }).join('');

  const nickGrid = document.getElementById('nickEffectSelectorGrid');
  if (nickGrid) {
    nickGrid.innerHTML = NICK_EFFECTS.map(ne => {
      const unlocked = stats.level >= ne.reqLvl;
      const isActive = (p.nickEffect || '') === ne.id;
      return `
        <button type="button" class="cosmetic-pick-btn ${isActive ? 'active' : ''} ${unlocked ? '' : 'locked'}"
          onclick="selectProfileNickEffect('${ne.id}', ${ne.reqLvl})">
          <div style="font-size:12px; font-weight:800;" class="${ne.id}">${unlocked ? '' : '🔒 '}${ne.name}</div>
          <span class="cosmetic-lvl-tag ${unlocked ? 'unlocked' : 'locked'}">
            ${unlocked ? `Открыто (${ne.tier})` : `Требуется ${ne.reqLvl} ур.`}
          </span>
        </button>
      `;
    }).join('');
  }

  document.getElementById('profileCustomizerModal').classList.add('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function closeProfileCustomizer() {
  document.getElementById('profileCustomizerModal').classList.remove('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function selectProfileFrame(frameId, reqLvl) {
  const stats = calculateProfileStats();
  if (stats.level < reqLvl) {
    showToast(`🔒 Эта рамка откроется в награду на ${reqLvl} уровне! (Сейчас у вас ${stats.level} ур.)`);
    return;
  }
  state.profile.frame = frameId;
  saveState();
  openProfileCustomizer();
  renderProfileView();
}

function selectProfileBanner(bannerId, reqLvl) {
  const stats = calculateProfileStats();
  if (stats.level < reqLvl) {
    showToast(`🔒 Эта расцветка профиля откроется на ${reqLvl} уровне! (Сейчас у вас ${stats.level} ур.)`);
    return;
  }
  state.profile.banner = bannerId;
  state.profile.bannerImg = '';
  saveState();
  openProfileCustomizer();
  renderProfileView();
}

function selectProfileNickEffect(effectId, reqLvl) {
  const stats = calculateProfileStats();
  if (stats.level < reqLvl) {
    showToast(`🔒 Этот спецэффект ника откроется на ${reqLvl} уровне!`);
    return;
  }
  state.profile.nickEffect = effectId;
  saveState();
  openProfileCustomizer();
  renderProfileView();
}

/* ==================== LEVEL REWARDS ROADMAP MODAL (EVERY 5 LEVELS) ==================== */
function openLevelRewardsModal() {
  const stats = calculateProfileStats();
  const hdrEl = document.getElementById('rewardsModalStatsHeader');
  if (hdrEl) {
    hdrEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-size:15px; font-weight:900; color:var(--accent);">Ваш уровень: ${stats.level} (${stats.rankTitle})</div>
          <div style="font-size:11.5px; color:var(--muted); margin-top:2px;">
            Чистый опыт: <strong>${stats.xp} XP</strong> (Заработано: +${stats.earnedXp} XP${stats.penaltyXp > 0 ? ` • <span style="color:var(--rose);">Штрафы: -${stats.penaltyXp} XP</span>` : ''})
          </div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px;">
            До ${stats.level + 1} ур. осталось: <strong>${stats.nextLevelXp - stats.currentLevelXp} XP</strong> • 🛡️ Щитов заморозки: <strong>${stats.availableShields} шт.</strong>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="closeLevelRewardsModal(); openDisciplineModal();">⚖️ Штрафы и Щиты</button>
      </div>
    `;
  }

  const listEl = document.getElementById('rewardsRoadmapList');
  if (listEl) {
    listEl.innerHTML = LEVEL_MILESTONE_REWARDS.map(tier => {
      const unlocked = stats.level >= tier.lvl;
      const reqTotalXp = getTotalXpForReachingLevel(tier.lvl);
      const isEquipped = state.profile.banner === tier.banner && state.profile.frame === tier.frame;
      return `
        <div class="reward-tier-card ${unlocked ? 'unlocked' : ''}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:13.5px; font-weight:800;">${tier.title}</span>
            <span class="cosmetic-lvl-tag ${unlocked ? 'unlocked' : 'locked'}" style="font-size:10.5px; padding:3px 9px;">
              ${unlocked ? `✅ Открыто (Ур. ${tier.lvl})` : `🔒 Награда ${tier.lvl} ур. (${reqTotalXp} XP)`}
            </span>
          </div>
          <div class=" ${tier.banner}" style="border-radius:12px; padding:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; border:1px solid rgba(255,255,255,0.16); margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="profile-avatar ${tier.frame}" style="width:46px; height:46px; font-size:20px; margin:0; position:static;">${state.profile.avatarEmoji || '⚡'}</div>
              <div>
                <div style="font-size:14px; font-weight:900;" class="${tier.nickEffect}">${escapeHtml(state.profile.nickname || 'Атлет')}</div>
                <div style="font-size:10.5px; color:#cbd5e1;">Превью расцветки и рамки ${tier.lvl} LVL</div>
              </div>
            </div>
            ${unlocked ? `
              <button type="button" class="btn ${isEquipped ? 'btn-secondary' : 'btn-primary'} btn-sm"
                onclick="equipMilestoneRewardSet(${tier.lvl})">
                ${isEquipped ? '✓ Надето' : 'Надеть сет'}
              </button>
            ` : `
              <span style="font-size:11px; font-weight:800; color:#fda4af;">Ещё ${Math.max(0, reqTotalXp - stats.xp)} XP</span>
            `}
          </div>
          <div style="font-size:11.5px; color:var(--muted); line-height:1.4;">${tier.desc}</div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('levelRewardsModalBackdrop').classList.add('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function closeLevelRewardsModal() {
  document.getElementById('levelRewardsModalBackdrop').classList.remove('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function equipMilestoneRewardSet(lvl) {
  const stats = calculateProfileStats();
  const tier = LEVEL_MILESTONE_REWARDS.find(t => t.lvl === lvl);
  if (!tier || stats.level < tier.lvl) return;
  state.profile.banner = tier.banner;
  state.profile.bannerImg = '';
  state.profile.frame = tier.frame;
  state.profile.nickEffect = tier.nickEffect;
  saveState();
  renderProfileView();
  openLevelRewardsModal();
  showToast(`🎨 Надет наградной комплект ${lvl} уровня!`);
}

/* ==================== УПРАВЛЕНИЕ ШТРАФАМИ ЗА ПРОПУСК ДНЕЙ, ЩИТАМИ И ОТРАБОТКОЙ ==================== */
function renderDiaryDisciplineBar() {
  const barEl = document.getElementById('diaryDisciplineBar');
  if (!barEl) return;
  const stats = calculateProfileStats();

  if (stats.missedDaysCount > 0) {
    const lastMissed = stats.missedDaysList[stats.missedDaysList.length - 1];
    barEl.innerHTML = `
      <div class="discipline-alert-bar penalty">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <div style="font-size:12.5px; font-weight:800; color:#fda4af;">
              ⚠️ Штраф за пропуск режима: -${stats.penaltyXp} XP (пропущено дн.: ${stats.missedDaysCount})
            </div>
            <div style="font-size:11px; color:var(--muted); margin-top:2px;">
              Последний пропуск: <strong>${lastMissed}</strong>. Заполните день, используйте 🛡️ Щит заморозки (${stats.availableShields} шт.) или отработайте квестом!
            </div>
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="jumpToDiaryDate('${lastMissed}')">✍️ Заполнить ${lastMissed}</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="useFreezeShieldOnDay('${lastMissed}')">🛡️ Защитить щитом (${stats.availableShields})</button>
          <button type="button" class="btn btn-purple btn-sm" onclick="openDisciplineModal('${lastMissed}')">💪 Отработать штраф</button>
        </div>
      </div>
    `;
  } else {
    barEl.innerHTML = `
      <div class="discipline-alert-bar clean" style="cursor:pointer; flex-direction:row; justify-content:space-between; align-items:center;" onclick="openDisciplineModal()">
        <div style="font-size:11.5px; font-weight:700;">
          🛡️ <span style="color:var(--accent);">Дисциплина 100%</span> • Щитов заморозки: <strong>${stats.availableShields} шт.</strong> • Штрафов: <strong>0 XP</strong>
        </div>
        <span style="font-size:11px; color:var(--accent); font-weight:800;">Правила →</span>
      </div>
    `;
  }
}

function useFreezeShieldOnDay(dateStr) {
  const stats = calculateProfileStats();
  const targetDate = dateStr || (stats.missedDaysList[stats.missedDaysList.length - 1]);
  if (!targetDate) {
    showToast('🟢 У вас нет пропущенных дней для заморозки!');
    return;
  }
  if (stats.availableShields <= 0) {
    showToast('⚠️ Нет доступных щитов! Вы можете приобрести щит за 150 XP или пройти квест отработки.');
    openDisciplineModal(targetDate);
    return;
  }
  const day = getDayData(targetDate);
  day.freezeUsed = true;
  saveState();
  renderAll();
  if (document.getElementById('disciplineModalBackdrop').classList.contains('open')) {
    openDisciplineModal();
  }
  showToast(`🛡️ День ${targetDate} защищён Щитом! Штраф -100 XP отменён и стрик сохранён.`);
}

function buyFreezeShieldWithXp() {
  const stats = calculateProfileStats();
  if (stats.xp < 150) {
    showToast('⚠️ Недостаточно опыта (нужно 150 XP для покупки щита заморозки)');
    return;
  }
  state.purchasedShields = (Number(state.purchasedShields) || 0) + 1;
  state.spentShieldXp = (Number(state.spentShieldXp) || 0) + 150;
  saveState();
  renderAll();
  openDisciplineModal();
  showToast('🛡️ Приобретён +1 Щит заморозки стрика (-150 XP)');
}

function redeemMissedDayByQuest(dateStr) {
  const stats = calculateProfileStats();
  const targetDate = dateStr || (stats.missedDaysList[stats.missedDaysList.length - 1]);
  if (!targetDate) {
    showToast('🟢 Нет пропущенных дней для отработки!');
    return;
  }
  const todayStr = getLocalDateString(new Date());
  const todayData = getDayData(todayStr);
  const todayTot = getDayTotals(todayStr);

  if (todayTot.count < 2 || (todayData.waterMl || 0) < 1000) {
    showToast(`💪 Для отработки пропуска запишите сегодня минимум 2 приёма пищи (сейчас: ${todayTot.count}/2) и выпейте 1000 мл воды (сейчас: ${todayData.waterMl || 0}/1000 мл)!`);
    return;
  }

  const missedDay = getDayData(targetDate);
  missedDay.penaltyRedeemed = true;
  saveState();
  renderAll();
  if (document.getElementById('disciplineModalBackdrop').classList.contains('open')) {
    openDisciplineModal();
  }
  showToast(`🔥 Квест выполнен! Штраф -100 XP за ${targetDate} полностью списан!`);
}

function toggleSimulateYesterdayMiss() {
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestStr = getLocalDateString(yest);
  const dObj = getDayData(yestStr);

  if (dObj.simulatedMiss) {
    delete dObj.simulatedMiss;
    delete dObj.freezeUsed;
    delete dObj.penaltyRedeemed;
    state.registeredDate = getLocalDateString(new Date());
    saveState();
    renderAll();
    openDisciplineModal();
    showToast('🟢 Тестовый пропуск сброшен');
  } else {
    dObj.meals = [];
    dObj.simulatedMiss = true;
    delete dObj.freezeUsed;
    delete dObj.penaltyRedeemed;
    if (!state.registeredDate || state.registeredDate > yestStr) {
      state.registeredDate = yestStr;
    }
    saveState();
    renderAll();
    openDisciplineModal(yestStr);
    showToast(`⚠️ Симулирован пропуск дня (${yestStr}): начислен штраф -100 XP!`);
  }
}

function openDisciplineModal(focusDateStr) {
  const stats = calculateProfileStats();
  const todayStr = getLocalDateString(new Date());
  const todayData = getDayData(todayStr);
  const todayTot = getDayTotals(todayStr);
  const questReady = todayTot.count >= 2 && (todayData.waterMl || 0) >= 1000;
  const targetMiss = focusDateStr || stats.missedDaysList[stats.missedDaysList.length - 1] || '';

  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestStr = getLocalDateString(yest);
  const isSimulating = !!(state.days[yestStr] && state.days[yestStr].simulatedMiss);

  const bodyEl = document.getElementById('disciplineModalBody');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="padding:12px; border-radius:14px; background:${stats.missedDaysCount > 0 ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)'}; border:1px solid ${stats.missedDaysCount > 0 ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.35)'}; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:14px; font-weight:900; color:${stats.missedDaysCount > 0 ? '#fda4af' : 'var(--accent)'};">
              ${stats.missedDaysCount > 0 ? `⚠️ Обнаружено пропусков: ${stats.missedDaysCount} дн. (Штраф: -${stats.penaltyXp} XP)` : '🟢 Идеальная дисциплина: пропусков нет (Штраф: 0 XP)'}
            </div>
            <div style="font-size:11.5px; color:var(--muted); margin-top:3px;">
              Начислено за активность: <strong>+${stats.earnedXp} XP</strong> • Потрачено на щиты: <strong>-${ Number(state.spentShieldXp) || 0 } XP</strong> • Итоговый опыт: <strong>${stats.xp} XP</strong>
            </div>
          </div>
          <span class="profile-lvl-pill">🛡️ Щитов: ${stats.availableShields} шт.</span>
        </div>
      </div>

      <div style="font-size:12px; font-weight:800; margin-bottom:6px;">📜 Как работает система штрафов за пропуск дня:</div>
      <div style="display:flex; flex-direction:column; gap:7px; font-size:11.5px; color:var(--muted); margin-bottom:12px; line-height:1.4;">
        <div style="padding:8px 10px; border-radius:10px; background:var(--input-bg); border:1px solid var(--border);">
          🔻 <strong>Штраф опыта (-100 XP / день):</strong> за каждый прошедший день без единой записи в дневнике списывается <strong>100 XP</strong>, а при серии из 2+ пропусков подряд — дополнительно <strong>-50 XP</strong> за срыв режима.
        </div>
        <div style="padding:8px 10px; border-radius:10px; background:var(--input-bg); border:1px solid var(--border);">
          🛡️ <strong>Щит заморозки стрика:</strong> замораживает пропущенный день, отменяет штраф <strong>-100 XP</strong> и спасает ваш стрик 🔥. Вы получаете 1 щит при регистрации и по +1 щиту за каждые 5 зелёных дней!
        </div>
        <div style="padding:8px 10px; border-radius:10px; background:var(--input-bg); border:1px solid var(--border);">
          💪 <strong>Квест отработки штрафа (бесплатно):</strong> если записать сегодня минимум <strong>2 приёма пищи</strong> (${todayTot.count}/2) и выпить <strong>1000 мл воды</strong> (${todayData.waterMl || 0}/1000 мл), вы можете бесплатно аннулировать штраф за пропущенный день!
        </div>
      </div>

      ${stats.missedDaysCount > 0 ? `
        <div style="padding:12px; border-radius:14px; background:rgba(244,63,94,0.1); border:1px dashed rgba(244,63,94,0.5); margin-bottom:12px;">
          <div style="font-size:12px; font-weight:800; color:#fda4af; margin-bottom:6px;">
            🚨 Пропущенные дни (${stats.missedDaysList.join(', ')}):
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:7px;">
            <button type="button" class="btn btn-primary btn-sm" onclick="closeDisciplineModal(); jumpToDiaryDate('${targetMiss}')">✍️ Заполнить ${targetMiss}</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="useFreezeShieldOnDay('${targetMiss}')">🛡️ Потратить Щит (${stats.availableShields} шт.)</button>
          </div>
          <button type="button" class="btn btn-purple btn-sm" style="width:100%; opacity:${questReady ? '1' : '0.75'};" onclick="redeemMissedDayByQuest('${targetMiss}')">
            💪 ${questReady ? `Зачесть квест отработки и вернуть +100 XP за ${targetMiss}!` : `Квест отработки: еда ${todayTot.count}/2, вода ${todayData.waterMl || 0}/1000 мл`}
          </button>
        </div>
      ` : ''}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="buyFreezeShieldWithXp()">🛡️ Купить Щит за 150 XP</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="toggleSimulateYesterdayMiss()">
          ${isSimulating ? '🔄 Сбросить тест пропуска' : '🧪 Тест штрафа за вчера'}
        </button>
      </div>
    `;
  }

  document.getElementById('disciplineModalBackdrop').classList.add('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function closeDisciplineModal() {
  const modal = document.getElementById('disciplineModalBackdrop');
  if (modal) modal.classList.remove('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function openLevelUpCelebrationModal(newLevel) {
  const modal = document.getElementById('levelUpCelebrationModal');
  if (!modal) return;
  const milestone = LEVEL_MILESTONE_REWARDS.find(m => m.lvl === newLevel);
  const bodyEl = document.getElementById('levelUpCelebrationBody');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:44px; margin-bottom:6px;">🎉</div>
        <div style="font-size:12px; font-weight:800; color:var(--accent); text-transform:uppercase;">Новый уровень достигнут!</div>
        <h2 style="font-size:26px; font-weight:900; margin:4px 0 8px;">УРОВЕНЬ ${newLevel}</h2>
        <div style="font-size:13px; color:var(--muted); margin-bottom:14px;">
          Ваше звание: <strong style="color:var(--text);">${getRankTitleForLevel(newLevel)}</strong>
        </div>
        ${milestone ? `
          <div style="padding:12px; border-radius:14px; background:rgba(16,185,129,0.14); border:1px solid var(--accent); margin-bottom:14px;">
            <div style="font-size:12px; font-weight:800; color:var(--accent); margin-bottom:4px;">🎁 РАЗБЛОКИРОВАНА ЮБИЛЕЙНАЯ НАГРАДА ${newLevel} УРОВНЯ!</div>
            <div style="font-size:13px; font-weight:800; margin-bottom:4px;">${milestone.title}</div>
            <div style="font-size:11.5px; color:var(--muted); margin-bottom:10px;">${milestone.desc}</div>
            <button type="button" class="btn btn-primary btn-sm" onclick="equipMilestoneRewardSet(${newLevel}); closeLevelUpCelebrationModal();">✨ Сразу примерить новую расцветку!</button>
          </div>
        ` : `
          <div style="padding:10px; border-radius:12px; background:var(--input-bg); border:1px solid var(--border); font-size:12px; color:var(--muted); margin-bottom:14px;">
            Продолжайте в том же духе! Новые эксклюзивные расцветки и рамки открываются каждые 5 уровней (следующий рубеж: <strong>${Math.ceil((newLevel + 0.1) / 5) * 5} LVL</strong>).
          </div>
        `}
      </div>
    `;
  }
  modal.classList.add('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function closeLevelUpCelebrationModal() {
  const modal = document.getElementById('levelUpCelebrationModal');
  if (modal) modal.classList.remove('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function handleProfileImageUpload(event, targetField) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = targetField === 'avatarImg' ? 256 : 720;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      state.profile[targetField] = canvas.toDataURL('image/jpeg', 0.82);
      saveState();
      renderProfileView();
      if (typeof updateOnbPreview === 'function') updateOnbPreview();
      showToast('Изображение профиля сохранено в БД!');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveProfileCustomization() {
  state.profile.nickname = document.getElementById('custNickInput').value.trim() || 'Атлет';
  state.profile.status = document.getElementById('custStatusInput').value.trim() || 'На сушке 🔥';
  state.profile.avatarEmoji = document.getElementById('custEmojiInput').value.trim() || '⚡';
  saveState();
  renderProfileView();
  closeProfileCustomizer();
  showToast('🎨 Профиль обновлён!');
}
