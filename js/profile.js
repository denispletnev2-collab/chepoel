/* js/profile.js — Steam/Discord Profile Cosmetics, Adaptive Heatmap Calendar & Weight Chart */
const AVATAR_FRAMES = [
  { id: 'frame-cyber',   name: 'Cyberpunk Neon' },
  { id: 'frame-gold',    name: 'Dragon Lore Gold' },
  { id: 'frame-discord', name: 'Discord Nitro' },
  { id: 'frame-emerald', name: 'Emerald Matrix' },
  { id: 'frame-fire',    name: 'Crimson Blaze' },
  { id: 'frame-minimal', name: 'Obsidian Glass' }
];

const PROFILE_BANNERS = [
  { id: 'banner-cyber',    name: 'Synthwave Grid' },
  { id: 'banner-aurora',   name: 'Aurora Borealis' },
  { id: 'banner-nebula',   name: 'Deep Space Nebula' },
  { id: 'banner-tokyo',    name: 'Tokyo Night' },
  { id: 'banner-gold',     name: 'Golden Imperial' },
  { id: 'banner-obsidian', name: 'Obsidian Minimal' }
];

function renderProfileView() {
  const p = state.profile;
  const stats = calculateProfileStats();

  // Banner & Avatar
  const bannerEl = document.getElementById('profBannerEl');
  bannerEl.className = 'profile-banner ' + (p.banner || 'banner-cyber');
  if (p.bannerImg) {
    bannerEl.style.backgroundImage = `url(${p.bannerImg})`;
  } else {
    bannerEl.style.backgroundImage = '';
  }

  const avatarEl = document.getElementById('profAvatarEl');
  avatarEl.className = 'profile-avatar ' + (p.frame || 'frame-cyber');
  if (p.avatarImg) {
    avatarEl.innerHTML = `<img src="${p.avatarImg}" alt="avatar">`;
  } else {
    avatarEl.textContent = p.avatarEmoji || '⚡';
  }

  document.getElementById('profNicknameEl').textContent = p.nickname || 'Атлет';
  const greetEl = document.getElementById('headerUserGreeting');
  if (greetEl) greetEl.textContent = (p.nickname && p.nickname !== 'CyberAthlete') ? `${p.nickname} • ${state.goals.label || 'Профиль'}` : 'Smart Nutrition & Profile';
  document.getElementById('profStatusEl').textContent = p.status || 'На сушке • Иду к цели';
  document.getElementById('profLvlPill').textContent = `LVL ${stats.level} • 🔥 ${stats.streak} дн.`;
  document.getElementById('profXpText').textContent = `${stats.currentLevelXp} / ${stats.nextLevelXp} XP до ур. ${stats.level + 1}`;
  document.getElementById('profXpFill').style.width = Math.min(100, Math.round((stats.currentLevelXp / stats.nextLevelXp) * 100)) + '%';

  // Badges Showcase
  const badges = [
    { icon: '📸', title: 'ИИ-Сканер', unlocked: stats.totalMeals >= 1 },
    { icon: '🎯', title: 'Снайпер КБЖУ', unlocked: stats.greenDays >= 1 },
    { icon: '🔥', title: 'Стрик 3+ дня', unlocked: stats.streak >= 3 },
    { icon: '👨‍🍳', title: 'Шеф своих блюд', unlocked: (state.customProducts || []).length >= 1 },
    { icon: '💎', title: `Уровень ${stats.level}`, unlocked: true }
  ];
  document.getElementById('profBadgesWrap').innerHTML = badges.map(b => `
    <span class="ach-badge ${b.unlocked ? 'unlocked' : ''}">
      <span>${b.icon}</span><span>${b.title}</span>
    </span>
  `).join('');

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
  document.getElementById('calMonthLabel').textContent = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  const modeLabels = {
    lose: 'Сценарий: Похудение (зелёный = лёгкий дефицит 80–102%, красный = голод <70% или перебор >112%)',
    maintain: 'Сценарий: Поддержание (зелёный = баланс 90–108%, красный = сильное отклонение)',
    gain: 'Сценарий: Набор массы (зелёный = профицит 96–116%, красный = недобор <86% или перебор)'
  };
  document.getElementById('calScenarioHint').textContent = modeLabels[state.goals.mode] || modeLabels.lose;

  const firstDay = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  // Monday-based weekday (0 = Mon ... 6 = Sun)
  const startOffset = (firstDay.getDay() + 6) % 7;

  const todayStr = getLocalDateString(new Date());
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(`<div class="cal-cell empty"></div>`);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const tot = getDayTotals(dStr);
    const ev = evaluateDayColorStatus(tot.kcal, state.goals.kcal, state.goals.mode);
    const isToday = dStr === todayStr ? 'cal-today' : '';
    const subLabel = tot.kcal > 0 ? `${tot.kcal}` : '—';
    cells.push(`
      <div class="cal-cell ${ev.css} ${isToday}" onclick="inspectCalendarDay('${dStr}')" title="${dStr}: ${tot.kcal} ккал (${ev.label})">
        <span>${d}</span>
        <span class="cal-sub">${subLabel}</span>
      </div>
    `);
  }

  document.getElementById('calGridEl').innerHTML = cells.join('');
}

function inspectCalendarDay(dateStr) {
  const tot = getDayTotals(dateStr);
  const ev = evaluateDayColorStatus(tot.kcal, state.goals.kcal, state.goals.mode);
  const box = document.getElementById('calDayInspector');
  box.style.display = 'block';
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <div>
        <div style="font-size:13px; font-weight:800;">📅 ${dateStr} — ${tot.kcal} из ${state.goals.kcal} ккал</div>
        <div style="font-size:11px; color:var(--muted); margin-top:2px;">${ev.label} • Б: ${tot.p}г • Ж: ${tot.f}г • У: ${tot.c}г</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="jumpToDiaryDate('${dateStr}')">Открыть день →</button>
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
  const dStr = getLocalDateString(new Date());
  const existingIdx = state.weightLog.findIndex(w => w.date === dStr);
  if (existingIdx >= 0) {
    state.weightLog[existingIdx].kg = val;
  } else {
    state.weightLog.push({ date: dStr, kg: val });
  }
  state.weightLog.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  renderWeightChart();
  showToast(`⚖️ Вес ${val} кг сохранён`);
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

/* Profile Customizer Modal */
function openProfileCustomizer() {
  const p = state.profile;
  document.getElementById('custNickInput').value = p.nickname || '';
  document.getElementById('custStatusInput').value = p.status || '';
  document.getElementById('custEmojiInput').value = p.avatarEmoji || '⚡';

  document.getElementById('frameSelectorGrid').innerHTML = AVATAR_FRAMES.map(f => `
    <button type="button" class="btn btn-secondary btn-sm ${p.frame === f.id ? 'active' : ''}"
      style="${p.frame === f.id ? 'border-color:var(--accent); color:var(--accent);' : ''}"
      onclick="selectProfileFrame('${f.id}')">${f.name}</button>
  `).join('');

  document.getElementById('bannerSelectorGrid').innerHTML = PROFILE_BANNERS.map(b => `
    <button type="button" class="btn btn-secondary btn-sm ${p.banner === b.id ? 'active' : ''}"
      style="${p.banner === b.id ? 'border-color:var(--accent); color:var(--accent);' : ''}"
      onclick="selectProfileBanner('${b.id}')">${b.name}</button>
  `).join('');

  document.getElementById('profileCustomizerModal').classList.add('open'); if(typeof syncModalBodyClass==='function') syncModalBodyClass();
}

function closeProfileCustomizer() {
  document.getElementById('profileCustomizerModal').classList.remove('open'); if(typeof syncModalBodyClass==='function') syncModalBodyClass();
}

function selectProfileFrame(frameId) {
  state.profile.frame = frameId;
  saveState();
  openProfileCustomizer();
  renderProfileView();
}

function selectProfileBanner(bannerId) {
  state.profile.banner = bannerId;
  state.profile.bannerImg = '';
  saveState();
  openProfileCustomizer();
  renderProfileView();
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
      showToast('Изображение профиля обновлено!');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveProfileCustomization() {
  state.profile.nickname = document.getElementById('custNickInput').value.trim() || 'CyberAthlete';
  state.profile.status = document.getElementById('custStatusInput').value.trim() || 'На сушке 🔥';
  state.profile.avatarEmoji = document.getElementById('custEmojiInput').value.trim() || '⚡';
  saveState();
  renderProfileView();
  closeProfileCustomizer();
  showToast('🎨 Профиль обновлён!');
}
