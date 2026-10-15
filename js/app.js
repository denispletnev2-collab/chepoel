/* js/app.js — Navigation, Top-Right Settings Modal (Goals + API Key + Backup) & Touch Swipe */
function switchMainTab(tab) {
  ['diary', 'profile'].forEach(t => {
    const view = document.getElementById('view-' + t);
    if (view) view.classList.toggle('active', t === tab);
    const btn = document.getElementById('bnav-' + t);
    if (btn) btn.classList.toggle('active', t === tab);
  });
  if (tab === 'profile') renderProfileView();
  if (tab === 'diary') renderDiaryView();
}

function changeDiaryDay(delta) {
  const dt = parseLocalDate(currentDateStr);
  dt.setDate(dt.getDate() + delta);
  currentDateStr = getLocalDateString(dt);
  renderDiaryView();
}

function resetDiaryToToday() {
  currentDateStr = getLocalDateString(new Date());
  renderDiaryView();
}

/* Settings Modal (Goals + API Key + Backup) */
function openSettingsModal() {
  document.getElementById('setGoalMode').value = state.goals.mode || 'lose';
  document.getElementById('setKcalInput').value = state.goals.kcal;
  document.getElementById('setPInput').value = state.goals.p;
  document.getElementById('setFInput').value = state.goals.f;
  document.getElementById('setCInput').value = state.goals.c;
  document.getElementById('setApiKeyInput').value = state.apiKey || '';
  const stBox = document.getElementById('apiKeyStatusBox');
  if (stBox) { if (state.apiKey) { stBox.style.display = 'block'; stBox.style.background = 'rgba(59, 130, 246, 0.10)'; stBox.style.color = '#93c5fd'; stBox.innerHTML = '🔑 Ключ установлен в памяти. Нажмите <strong>«⚡ Проверить ключ»</strong> для проверки связи.'; } else { stBox.style.display = 'none'; } }
  document.getElementById('settingsModalBackdrop').classList.add('open'); syncModalBodyClass();
}

function closeSettingsModal() {
  document.getElementById('settingsModalBackdrop').classList.remove('open'); syncModalBodyClass();
}

function autoCalculateNormsInSettings() {
  const gender = document.getElementById('calcGender').value;
  const age = Number(document.getElementById('calcAge').value) || 26;
  const h = Number(document.getElementById('calcHeight').value) || 176;
  const w = Number(document.getElementById('calcWeight').value) || 74;
  const act = Number(document.getElementById('calcActivity').value) || 1.375;
  const mode = document.getElementById('setGoalMode').value;

  const bmr = (10 * w) + (6.25 * h) - (5 * age) + (gender === 'm' ? 5 : -161);
  let tdee = bmr * act;
  let label = 'Поддержание';
  if (mode === 'lose') { tdee *= 0.85; label = 'Похудение (-15%)'; }
  if (mode === 'gain') { tdee *= 1.15; label = 'Набор массы (+15%)'; }

  const kcal = Math.round(tdee);
  const p = Math.round((kcal * 0.28) / 4);
  const f = Math.round((kcal * 0.28) / 9);
  const c = Math.round((kcal * 0.44) / 4);

  document.getElementById('setKcalInput').value = kcal;
  document.getElementById('setPInput').value = p;
  document.getElementById('setFInput').value = f;
  document.getElementById('setCInput').value = c;
  showToast(`Рассчитано: ${kcal} ккал (${label})`);
}

function saveSettingsAll() {
  const mode = document.getElementById('setGoalMode').value;
  const labels = { lose: 'Похудение', maintain: 'Поддержание', gain: 'Набор массы' };
  state.goals = {
    mode,
    label: labels[mode] || 'Похудение',
    kcal: Math.max(800, Number(document.getElementById('setKcalInput').value) || 2000),
    p: Math.max(20, Number(document.getElementById('setPInput').value) || 140),
    f: Math.max(20, Number(document.getElementById('setFInput').value) || 65),
    c: Math.max(20, Number(document.getElementById('setCInput').value) || 210)
  };
  state.apiKey = document.getElementById('setApiKeyInput').value.trim();
  saveState();
  renderAll();
  closeSettingsModal();
  showToast('⚙️ Настройки и нормы сохранены');
}

function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.body.classList.toggle('light-theme', state.theme === 'light');
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
  saveState();
}

function showToast(msg) {
  const el = document.getElementById('appToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* Swipe-down-to-close gesture for Bottom Sheets */
function initBottomSheetSwipe() {
  document.querySelectorAll('.bottom-sheet').forEach(sheet => {
    let startY = 0, currentY = 0, dragging = false;
    const handle = sheet.querySelector('.sheet-handle-area');
    if (!handle) return;

    handle.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      dragging = true;
      sheet.style.transition = 'none';
    }, { passive: true });

    handle.addEventListener('touchmove', e => {
      if (!dragging) return;
      currentY = e.touches[0].clientY;
      const dy = Math.max(0, currentY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: true });

    handle.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = '';
      if (currentY - startY > 90) {
        sheet.closest('.sheet-backdrop').classList.remove('open');
      }
      sheet.style.transform = '';
      startY = 0; currentY = 0;
    });
  });
}


/* ONBOARDING & REGISTRATION WIZARD LOGIC */
let onbSelectedGoal = 'lose';
let onbSelectedFrame = 'frame-emerald';
let onbSelectedBanner = 'banner-aurora';

function openOnboardingWizard(startAtWelcomeTour) {
  document.getElementById('onbNickname').value = (state.profile.nickname && state.profile.nickname !== 'CyberAthlete' && state.profile.nickname !== 'Атлет') ? state.profile.nickname : '';
  document.getElementById('onbEmoji').value = state.profile.avatarEmoji || '⚡';
  document.getElementById('onbStatus').value = state.profile.status || 'Иду к своей лучшей форме 🔥';
  onbSelectedFrame = state.profile.frame || 'frame-emerald';
  onbSelectedBanner = state.profile.banner || 'banner-aurora';
  onbSelectedGoal = state.goals.mode || 'lose';
  updateOnbPreview();
  recalcOnbPreview();
  renderOnbSavedAccountsQuickList();

  // Сначала всегда открывается Окно Регистрации (Step 0), а после регистрации — Приветственное сопровождение (Intro -> 1 -> 2 -> 3)
  if (startAtWelcomeTour) {
    goToOnbStep('intro');
  } else {
    goToOnbStep(0);
  }
  document.getElementById('onboardingOverlay').classList.add('open');
  syncModalBodyClass();
}

function switchOnbAuthMode(mode) {
  ['register', 'login'].forEach(m => {
    const tab = document.getElementById('onbAuthTab-' + m);
    if (tab) tab.classList.toggle('active', m === mode);
    const pane = document.getElementById('onbAuthPane-' + m);
    if (pane) pane.style.display = m === mode ? 'block' : 'none';
  });
  const errBox = document.getElementById('onbAuthErrorBox');
  if (errBox) errBox.style.display = 'none';
  if (mode === 'login') renderOnbSavedAccountsQuickList();
}

async function renderOnbSavedAccountsQuickList() {
  const wrap = document.getElementById('onbSavedAccountsQuickWrap');
  if (!wrap) return;
  const map = getLocalAccountsMap();
  const idbAccounts = await idbGetAll('accounts');
  idbAccounts.forEach(acc => {
    if (acc && acc.username && !map[acc.username]) map[acc.username] = acc;
  });
  const users = Object.keys(map);
  if (users.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = `
    <div style="font-size:10.5px; font-weight:800; color:var(--muted); margin-bottom:5px; text-transform:uppercase;">Сохранённые аккаунты на устройстве:</div>
    <div style="display:flex; flex-wrap:wrap; gap:6px;">
      ${users.map(u => `
        <button type="button" class="freq-chip" onclick="document.getElementById('onbLoginUsername').value='${escapeHtml(u)}'; document.getElementById('onbLoginPassword').focus();">
          👤 @${escapeHtml(u)}
        </button>
      `).join('')}
    </div>
  `;
}

async function submitOnbRegistration() {
  const rawUser = (document.getElementById('onbRegUsername').value || '').trim().toLowerCase().replace(/[^a-z0-9_а-яё-]/gi, '');
  const rawPass = (document.getElementById('onbRegPassword').value || '').trim();
  const dispName = (document.getElementById('onbRegDisplayName').value || '').trim() || rawUser;
  const errBox = document.getElementById('onbAuthErrorBox');

  if (rawUser.length < 3) {
    if (errBox) { errBox.style.display = 'block'; errBox.textContent = '⚠️ Логин должен содержать минимум 3 символа.'; }
    document.getElementById('onbRegUsername').focus();
    return;
  }
  if (rawPass.length < 4) {
    if (errBox) { errBox.style.display = 'block'; errBox.textContent = '⚠️ Пароль должен содержать минимум 4 символа.'; }
    document.getElementById('onbRegPassword').focus();
    return;
  }

  const map = getLocalAccountsMap();
  if (map[rawUser]) {
    if (errBox) { errBox.style.display = 'block'; errBox.textContent = `⚠️ Аккаунт @${rawUser} уже существует. Переключитесь на вкладку «Уже есть аккаунт».`; }
    return;
  }

  const passHash = await hashPassword(rawPass);
  const accountRecord = {
    username: rawUser,
    displayName: dispName,
    passHash,
    createdAt: new Date().toISOString()
  };

  map[rawUser] = accountRecord;
  saveLocalAccountsMap(map);
  await idbPut('accounts', accountRecord);

  // Инициализируем чистый профиль для нового аккаунта и запускаем приветственное сопровождение
  activeAuthUser = rawUser;
  safeLocalSet('chepoel_active_user', activeAuthUser);
  state = createDefaultState();
  state.profile.nickname = dispName;
  state.registeredDate = getLocalDateString(new Date());
  state.onboarded = false;
  saveState();

  document.getElementById('onbNickname').value = dispName;
  const welcomeTitle = document.getElementById('onbWelcomeUserTitle');
  if (welcomeTitle) welcomeTitle.textContent = `Добро пожаловать, ${dispName}!`;
  if (errBox) errBox.style.display = 'none';

  showToast(`🎉 Аккаунт @${rawUser} создан! Начинаем приветственное сопровождение.`);
  goToOnbStep('intro');
}

async function submitOnbLogin() {
  const rawUser = (document.getElementById('onbLoginUsername').value || '').trim().toLowerCase();
  const rawPass = (document.getElementById('onbLoginPassword').value || '').trim();
  const errBox = document.getElementById('onbAuthErrorBox');

  if (!rawUser || !rawPass) {
    if (errBox) { errBox.style.display = 'block'; errBox.textContent = '⚠️ Введите логин и пароль.'; }
    return;
  }

  const map = getLocalAccountsMap();
  const acc = map[rawUser] || (await idbGet('accounts', rawUser));
  if (!acc) {
    if (errBox) { errBox.style.display = 'block'; errBox.textContent = `❌ Аккаунт @${rawUser} не найден. Создайте новый аккаунт во вкладке «Новый аккаунт».`; }
    return;
  }

  const passHash = await hashPassword(rawPass);
  if (acc.passHash !== passHash) {
    if (errBox) { errBox.style.display = 'block'; errBox.textContent = '❌ Неверный пароль.'; }
    return;
  }

  if (errBox) errBox.style.display = 'none';
  await switchUserSession(rawUser);

  if (state.onboarded) {
    document.getElementById('onboardingOverlay').classList.remove('open');
    syncModalBodyClass();
    showToast(`🔑 С возвращением, ${state.profile.nickname || rawUser}!`);
  } else {
    document.getElementById('onbNickname').value = state.profile.nickname || acc.displayName || rawUser;
    const welcomeTitle = document.getElementById('onbWelcomeUserTitle');
    if (welcomeTitle) welcomeTitle.textContent = `Добро пожаловать, ${state.profile.nickname || rawUser}!`;
    goToOnbStep('intro');
  }
}

function continueAsGuestToTour() {
  activeAuthUser = 'guest';
  safeLocalSet('chepoel_active_user', 'guest');
  const welcomeTitle = document.getElementById('onbWelcomeUserTitle');
  if (welcomeTitle) welcomeTitle.textContent = 'Добро пожаловать в ЧёПоел!';
  goToOnbStep('intro');
}

function updateOnbPreview() {
  const prev = document.getElementById('onbAvatarPreview');
  if (!prev) return;
  prev.className = 'profile-avatar ' + onbSelectedFrame;
  if (state.profile.avatarImg) {
    prev.innerHTML = `<img src="${state.profile.avatarImg}" alt="avatar">`;
  } else {
    prev.textContent = document.getElementById('onbEmoji').value.trim() || '⚡';
  }
  const bPrev = document.getElementById('onbBannerPreview');
  if (bPrev) {
    bPrev.className = onbSelectedBanner;
  }
}

function pickOnbBanner(bannerId) {
  onbSelectedBanner = bannerId;
  state.profile.banner = bannerId;
  document.querySelectorAll('#onbBannerGrid .frame-pick-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-banner') === bannerId);
  });
  updateOnbPreview();
}

function pickOnbFrame(frameId) {
  onbSelectedFrame = frameId;
  state.profile.frame = frameId;
  document.querySelectorAll('#onbFrameGrid .frame-pick-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-frame') === frameId);
  });
  updateOnbPreview();
}

function goToOnbStep(stepKey) {
  if (stepKey === 2) {
    const nick = document.getElementById('onbNickname').value.trim();
    if (!nick) {
      document.getElementById('onbNickname').focus();
      showToast('Как к вам обращаться? Введите имя или ник');
      return;
    }
  }

  const order = [0, 'intro', 1, 2, 3];
  const targetIdx = order.indexOf(stepKey);
  const phaseTitles = {
    0: 'ШАГ 1 ИЗ 5 • РЕГИСТРАЦИЯ И ВХОД',
    'intro': 'ШАГ 2 ИЗ 5 • ПРИВЕТСТВЕННОЕ СОПРОВОЖДЕНИЕ',
    1: 'ШАГ 3 ИЗ 5 • ОФОРМЛЕНИЕ ПРОФИЛЯ',
    2: 'ШАГ 4 ИЗ 5 • ФИЗИОЛОГИЯ И ПАРАМЕТРЫ',
    3: 'ШАГ 5 ИЗ 5 • ЦЕЛЬ И НОРМА КБЖУ'
  };
  const hdrLbl = document.getElementById('onbHeaderPhaseLabel');
  if (hdrLbl && phaseTitles[stepKey]) hdrLbl.textContent = phaseTitles[stepKey];

  const paneMap = {
    0: 'onbStep0',
    'intro': 'onbStepIntro',
    1: 'onbStep1',
    2: 'onbStep2',
    3: 'onbStep3'
  };
  const dotMap = {
    0: 'onbDot0',
    'intro': 'onbDotIntro',
    1: 'onbDot1',
    2: 'onbDot2',
    3: 'onbDot3'
  };

  order.forEach((k, idx) => {
    const pane = document.getElementById(paneMap[k]);
    if (pane) pane.classList.toggle('active', k === stepKey);
    const dot = document.getElementById(dotMap[k]);
    if (dot) dot.classList.toggle('active', idx <= targetIdx);
  });

  if (stepKey === 3) recalcOnbPreview();
}

function selectOnbGoal(goalMode) {
  onbSelectedGoal = goalMode;
  ['lose', 'maintain', 'gain'].forEach(g => {
    const card = document.getElementById('onbGoalCard-' + g);
    if (card) card.classList.toggle('selected', g === goalMode);
  });
  const defaultStatuses = {
    lose: 'На сушке • Иду к цели 🔥',
    maintain: 'В идеальном балансе ⚖️',
    gain: 'На массе • Строю форму 💪'
  };
  const statusInp = document.getElementById('onbStatus');
  if (statusInp && (!statusInp.value || statusInp.value.includes('Иду к') || statusInp.value.includes('На '))) {
    statusInp.value = defaultStatuses[goalMode];
  }
  recalcOnbPreview();
}

function recalcOnbPreview() {
  const gender = document.getElementById('onbGender').value;
  const age = Number(document.getElementById('onbAge').value) || 24;
  const h = Number(document.getElementById('onbHeight').value) || 178;
  const w = Number(document.getElementById('onbWeight').value) || 75;
  const act = Number(document.getElementById('onbActivity').value) || 1.375;

  const bmr = (10 * w) + (6.25 * h) - (5 * age) + (gender === 'm' ? 5 : -161);
  let tdee = bmr * act;
  if (onbSelectedGoal === 'lose') tdee *= 0.85;
  if (onbSelectedGoal === 'gain') tdee *= 1.15;

  const kcal = Math.round(tdee);
  const p = Math.round((kcal * 0.28) / 4);
  const f = Math.round((kcal * 0.28) / 9);
  const c = Math.round((kcal * 0.44) / 4);

  document.getElementById('onbKcal').value = kcal;
  document.getElementById('onbP').value = p;
  document.getElementById('onbF').value = f;
  document.getElementById('onbC').value = c;
}

function finishOnboardingWizard() {
  const nick = document.getElementById('onbNickname').value.trim() || 'Атлет';
  const emoji = document.getElementById('onbEmoji').value.trim() || '⚡';
  const status = document.getElementById('onbStatus').value.trim() || 'Иду к цели 🔥';
  const weightKg = parseFloat(document.getElementById('onbWeight').value) || 75;

  const labels = { lose: 'Похудение (-15%)', maintain: 'Поддержание', gain: 'Набор массы (+15%)' };
  state.profile.nickname = nick;
  state.profile.avatarEmoji = emoji;
  state.profile.status = status;
  state.profile.frame = onbSelectedFrame;
  state.profile.banner = onbSelectedBanner;

  state.goals = {
    mode: onbSelectedGoal,
    label: labels[onbSelectedGoal] || 'Похудение',
    kcal: Math.max(800, Number(document.getElementById('onbKcal').value) || 2000),
    p: Math.max(20, Number(document.getElementById('onbP').value) || 140),
    f: Math.max(20, Number(document.getElementById('onbF').value) || 65),
    c: Math.max(20, Number(document.getElementById('onbC').value) || 210)
  };

  const keyVal = document.getElementById('onbApiKey').value.trim();
  if (keyVal) state.apiKey = keyVal;

  // Record initial body weight in weightLog
  const todayStr = getLocalDateString(new Date());
  state.weightLog = [{ date: todayStr, kg: weightKg }];
  state.onboarded = true;

  // Sync settings form inputs as well
  document.getElementById('calcGender').value = document.getElementById('onbGender').value;
  document.getElementById('calcAge').value = document.getElementById('onbAge').value;
  document.getElementById('calcHeight').value = document.getElementById('onbHeight').value;
  document.getElementById('calcWeight').value = weightKg;
  document.getElementById('calcActivity').value = document.getElementById('onbActivity').value;

  saveState();
  renderAll();
  document.getElementById('onboardingOverlay').classList.remove('open'); syncModalBodyClass();
  showToast(`🎉 Добро пожаловать, ${nick}! Ваша норма: ${state.goals.kcal} ккал`);
}

function renderAll() {
  renderDiaryView();
  renderProfileView();
}

window.addEventListener('DOMContentLoaded', async () => {
  loadState();
  await initDatabaseAndSyncUser();
  applyTheme(state.theme || 'dark');
  initBottomSheetSwipe();
  if (!state.onboarded) {
    openOnboardingWizard();
  }
  await loadRuProductsDatabase();
  renderAll();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});

function skipOnboardingWizard() {
  state.onboarded = true;
  saveState();
  document.getElementById('onboardingOverlay').classList.remove('open');
  syncModalBodyClass();
}


function toggleApiKeyVisibility(inputId, btnEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (btnEl) btnEl.textContent = '🙈';
  } else {
    inp.type = 'password';
    if (btnEl) btnEl.textContent = '👁️';
  }
}

function saveApiKeyOnly() {
  const inp = document.getElementById('setApiKeyInput');
  const key = (inp ? inp.value : '').trim().replace(/[\s"'`]+/g, '');
  if (inp) inp.value = key;
  state.apiKey = key;
  saveState();
  const box = document.getElementById('apiKeyStatusBox');
  if (box) {
    box.style.display = 'block';
    if (key) {
      box.style.background = 'rgba(16, 185, 129, 0.14)';
      box.style.color = '#6ee7b7';
      box.innerHTML = '💾 Ключ сохранён на устройстве. Нажмите <strong>«⚡ Проверить ключ»</strong> для теста связи с Gemini.';
    } else {
      box.style.background = 'rgba(148, 163, 184, 0.14)';
      box.style.color = '#cbd5e1';
      box.innerHTML = 'ℹ️ Ключ очищен — включён автономный режим оценки порции.';
    }
  }
  showToast(key ? '🔑 API ключ сохранён' : 'Включён автономный режим');
}

async function testApiKeyConnection(inputId = 'setApiKeyInput', statusBoxId = 'apiKeyStatusBox', btnId = 'testKeyBtn') {
  const inp = document.getElementById(inputId);
  const box = document.getElementById(statusBoxId);
  const btn = document.getElementById(btnId);
  if (!box) return;

  const key = (inp ? inp.value : '').trim().replace(/[\s"'`]+/g, '');
  if (inp) inp.value = key;
  box.style.display = 'block';

  if (!key) {
    box.style.background = 'rgba(244, 63, 94, 0.15)';
    box.style.color = '#fda4af';
    box.innerHTML = '⚠️ Введите API-ключ в поле выше перед проверкой.';
    return;
  }

  state.apiKey = key;
  const otherInputId = inputId === 'setApiKeyInput' ? 'onbApiKey' : 'setApiKeyInput';
  const otherInp = document.getElementById(otherInputId);
  if (otherInp) otherInp.value = key;
  saveState();

  const origBtnText = btn ? btn.textContent : '⚡ Проверить ключ';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Проверка...';
  }
  box.style.background = 'rgba(59, 130, 246, 0.15)';
  box.style.color = '#93c5fd';
  box.innerHTML = '⏳ Проверяем соединение с сервером Google Gemini API...';

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErrorMsg = '';
  let lastStatus = 0;

  for (const m of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ответь одним словом: ОК' }] }],
          generationConfig: { maxOutputTokens: 8 }
        })
      });
      lastStatus = r.status;
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.candidates) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = origBtnText;
        }
        box.style.background = 'rgba(16, 185, 129, 0.16)';
        box.style.color = '#6ee7b7';
        box.innerHTML = `✅ <strong>Ключ активен и работает!</strong> Подключена модель <code>${m}</code>. Ключ автоматически сохранён.`;
        showToast('✅ Ключ Gemini успешно проверен!');
        return;
      } else {
        lastErrorMsg = (data && data.error && data.error.message) ? data.error.message : `HTTP ${r.status}`;
        if (r.status === 400 && lastErrorMsg.toLowerCase().includes('key not valid')) {
          break; // Invalid key, no need to retry other models
        }
      }
    } catch (e) {
      lastErrorMsg = e.message || 'Ошибка сети';
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = origBtnText;
  }

  if (lastStatus === 400 || lastErrorMsg.toLowerCase().includes('key not valid') || lastErrorMsg.toLowerCase().includes('api_key_invalid')) {
    box.style.background = 'rgba(244, 63, 94, 0.16)';
    box.style.color = '#fda4af';
    box.innerHTML = `❌ <strong>Неверный ключ API:</strong> проверьте, что скопировали ключ из Google AI Studio целиком без пробелов. <br><span style="font-size:10.5px; opacity:0.85;">Ответ сервера: ${escapeHtml(lastErrorMsg)}</span>`;
  } else if (lastStatus === 403 || lastErrorMsg.toLowerCase().includes('location is not supported')) {
    box.style.background = 'rgba(245, 158, 11, 0.16)';
    box.style.color = '#fcd34d';
    box.innerHTML = `🌍 <strong>Ключ верный, но нужен VPN для запросов к Google AI:</strong> сервер Google ограничил доступ с вашего текущего региона (HTTP 403). Включите VPN при сканировании фото. <br><span style="font-size:10.5px; opacity:0.85;">Ответ: ${escapeHtml(lastErrorMsg)}</span>`;
  } else if (lastStatus === 429) {
    box.style.background = 'rgba(245, 158, 11, 0.16)';
    box.style.color = '#fcd34d';
    box.innerHTML = `⏳ <strong>Ключ рабочий, но превышен лимит запросов в минуту (HTTP 429).</strong> Подождите 30 секунд и попробуйте снова.`;
  } else {
    box.style.background = 'rgba(245, 158, 11, 0.16)';
    box.style.color = '#fcd34d';
    box.innerHTML = `⚠️ <strong>Не удалось связаться с сервером Gemini:</strong> ${escapeHtml(lastErrorMsg || 'проверьте подключение к интернету / VPN')}. Ключ сохранён, при отсутствии связи с API работает встроенный офлайн-анализатор тарелки.`;
  }
}


/* ==================== AUTHENTICATION & DATABASE MODAL LOGIC ==================== */
function updateHeaderAuthButton() {
  const btn = document.getElementById('headerAuthBtn');
  if (!btn) return;
  if (activeAuthUser && activeAuthUser !== 'guest') {
    btn.innerHTML = `<span style="color:var(--accent);">●</span> @${escapeHtml(activeAuthUser)}`;
    btn.title = `Аккаунт @${activeAuthUser} (База IndexedDB активна)`;
  } else {
    btn.innerHTML = `👤 Войти`;
    btn.title = 'Войти в аккаунт или создать профиль в БД';
  }
}

function setAuthModalTab(tab) {
  ['login', 'register', 'cloud'].forEach(t => {
    const b = document.getElementById('authTabBtn-' + t);
    if (b) b.classList.toggle('active', t === tab);
    const p = document.getElementById('authPane-' + t);
    if (p) p.style.display = t === tab ? 'block' : 'none';
  });
}

async function openAuthModal(defaultTab) {
  setAuthModalTab(defaultTab || (activeAuthUser === 'guest' ? 'register' : 'login'));
  await renderSavedAccountsList();

  const supUrlInp = document.getElementById('supUrlInput');
  const supKeyInp = document.getElementById('supKeyInput');
  if (supUrlInp && state.cloudConfig) supUrlInp.value = state.cloudConfig.supabaseUrl || '';
  if (supKeyInp && state.cloudConfig) supKeyInp.value = state.cloudConfig.supabaseKey || '';

  document.getElementById('authModalBackdrop').classList.add('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function closeAuthModal() {
  document.getElementById('authModalBackdrop').classList.remove('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

async function renderSavedAccountsList() {
  const box = document.getElementById('savedAccountsListWrap');
  const statusEl = document.getElementById('authCurrentDbStatus');
  if (!box) return;

  const map = getLocalAccountsMap();
  const idbAccounts = await idbGetAll('accounts');
  idbAccounts.forEach(acc => {
    if (acc && acc.username && !map[acc.username]) {
      map[acc.username] = acc;
    }
  });

  const stats = calculateProfileStats();
  if (statusEl) {
    statusEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div>
          <div style="font-size:12.5px; font-weight:800; color:var(--accent);">
            🗄️ Текущая сессия: ${activeAuthUser === 'guest' ? 'Гостевой профиль (local)' : '@' + escapeHtml(activeAuthUser)}
          </div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px;">
            Движок: <strong>IndexedDB (ChePoelDB)</strong> • Записей еды: <strong>${stats.totalMeals}</strong> • Уровень: <strong>${stats.level} LVL (${stats.xp} XP)</strong>
          </div>
        </div>
        ${activeAuthUser !== 'guest' ? `<button type="button" class="btn btn-secondary btn-sm" onclick="switchUserSession('guest')">Выйти</button>` : ''}
      </div>
    `;
  }

  const usernames = Object.keys(map);
  if (usernames.length === 0) {
    box.innerHTML = `<div style="font-size:11.5px; color:var(--muted);">На этом устройстве пока нет зарегистрированных аккаунтов. Создайте аккаунт ниже, чтобы закрепить свой дневник и уровень за логином и паролем.</div>`;
    return;
  }

  box.innerHTML = `
    <div style="font-size:11px; font-weight:800; color:var(--muted); margin-bottom:6px; text-transform:uppercase;">Сохранённые профили в базе устройства:</div>
    <div style="display:flex; flex-direction:column; gap:6px;">
      ${usernames.map(u => {
        const acc = map[u];
        const isCurrent = u === activeAuthUser;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 11px; border-radius:11px; background:rgba(15,23,42,0.65); border:1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'};">
            <div>
              <div style="font-size:13px; font-weight:800;">@${escapeHtml(u)} ${acc.displayName ? `(${escapeHtml(acc.displayName)})` : ''}</div>
              <div style="font-size:10.5px; color:var(--muted);">${isCurrent ? '🟢 Активный профиль' : 'Нажмите для быстрого переключения'}</div>
            </div>
            ${isCurrent
              ? `<span style="font-size:11px; font-weight:800; color:var(--accent);">Активен</span>`
              : `<button type="button" class="btn btn-secondary btn-sm" onclick="quickSelectAccountToLogin('${escapeHtml(u)}')">Выбрать</button>`
            }
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function quickSelectAccountToLogin(username) {
  setAuthModalTab('login');
  const inp = document.getElementById('authLoginUsername');
  if (inp) inp.value = username;
  const pInp = document.getElementById('authLoginPassword');
  if (pInp) pInp.focus();
}

async function handleRegisterSubmit() {
  const rawUser = (document.getElementById('authRegUsername').value || '').trim().toLowerCase().replace(/[^a-z0-9_а-яё-]/gi, '');
  const rawPass = (document.getElementById('authRegPassword').value || '').trim();
  const dispName = (document.getElementById('authRegDisplayName').value || '').trim() || rawUser;
  const msgEl = document.getElementById('authStatusMsg');

  if (rawUser.length < 3) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#fda4af';
    msgEl.textContent = '⚠️ Логин должен содержать минимум 3 символа.';
    return;
  }
  if (rawPass.length < 4) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#fda4af';
    msgEl.textContent = '⚠️ Пароль должен содержать минимум 4 символа.';
    return;
  }

  const map = getLocalAccountsMap();
  if (map[rawUser]) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#fda4af';
    msgEl.textContent = `⚠️ Аккаунт @${rawUser} уже существует. Перейдите во вкладку «Вход».`;
    return;
  }

  const passHash = await hashPassword(rawPass);
  const accountRecord = {
    username: rawUser,
    displayName: dispName,
    passHash,
    createdAt: new Date().toISOString()
  };

  map[rawUser] = accountRecord;
  saveLocalAccountsMap(map);
  await idbPut('accounts', accountRecord);

  // Создаём профиль для нового аккаунта и запускаем Приветственное сопровождение
  activeAuthUser = rawUser;
  safeLocalSet('chepoel_active_user', activeAuthUser);
  state = createDefaultState();
  state.profile.nickname = dispName;
  state.registeredDate = getLocalDateString(new Date());
  state.onboarded = false;
  saveState();

  renderAll();
  await renderSavedAccountsList();
  msgEl.style.display = 'block';
  msgEl.style.color = '#6ee7b7';
  msgEl.innerHTML = `✅ Аккаунт <strong>@${escapeHtml(rawUser)}</strong> создан! Запускаем приветственное сопровождение...`;
  showToast(`🎉 Аккаунт @${rawUser} создан!`);
  setTimeout(() => {
    closeAuthModal();
    const welcomeTitle = document.getElementById('onbWelcomeUserTitle');
    if (welcomeTitle) welcomeTitle.textContent = `Добро пожаловать, ${dispName}!`;
    openOnboardingWizard(true);
  }, 550);
}

async function handleLoginSubmit() {
  const rawUser = (document.getElementById('authLoginUsername').value || '').trim().toLowerCase();
  const rawPass = (document.getElementById('authLoginPassword').value || '').trim();
  const msgEl = document.getElementById('authStatusMsg');

  if (!rawUser || !rawPass) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#fda4af';
    msgEl.textContent = '⚠️ Введите логин и пароль.';
    return;
  }

  const map = getLocalAccountsMap();
  let acc = map[rawUser] || (await idbGet('accounts', rawUser));
  if (!acc) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#fda4af';
    msgEl.textContent = `❌ Пользователь @${rawUser} не найден на этом устройстве. Зарегистрируйтесь или синхронизируйте из облака.`;
    return;
  }

  const passHash = await hashPassword(rawPass);
  if (acc.passHash !== passHash) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#fda4af';
    msgEl.textContent = '❌ Неверный пароль.';
    return;
  }

  await switchUserSession(rawUser);
  msgEl.style.display = 'block';
  msgEl.style.color = '#6ee7b7';
  msgEl.innerHTML = `✅ Вход выполнен! Загружена база профиля <strong>@${escapeHtml(rawUser)}</strong>.`;
  setTimeout(() => closeAuthModal(), 700);
}

async function switchUserSession(username) {
  activeAuthUser = username || 'guest';
  safeLocalSet('chepoel_active_user', activeAuthUser);
  loadState();
  await initDatabaseAndSyncUser();
  applyTheme(state.theme || 'dark');
  renderAll();
  await renderSavedAccountsList();
  showToast(activeAuthUser === 'guest' ? 'Включён гостевой профиль' : `👤 Профиль @${activeAuthUser} загружен`);
}

/* ==================== SUPABASE CLOUD SYNC ==================== */
async function syncSupabaseCloud(direction) {
  const urlInp = document.getElementById('supUrlInput');
  const keyInp = document.getElementById('supKeyInput');
  const box = document.getElementById('cloudSyncStatusBox');
  const supUrl = (urlInp ? urlInp.value : '').trim().replace(/\/+$/, '');
  const supKey = (keyInp ? keyInp.value : '').trim();

  state.cloudConfig = { supabaseUrl: supUrl, supabaseKey: supKey, lastSyncAt: new Date().toISOString() };
  saveState();

  if (!box) return;
  box.style.display = 'block';

  if (!supUrl || !supKey) {
    box.style.background = 'rgba(244, 63, 94, 0.15)';
    box.style.color = '#fda4af';
    box.innerHTML = '⚠️ Укажите Project URL и Anon Key вашего проекта Supabase (раздел Settings → API в Supabase).';
    return;
  }

  const userKey = activeAuthUser || 'guest';
  box.style.background = 'rgba(59, 130, 246, 0.15)';
  box.style.color = '#93c5fd';
  box.innerHTML = '⏳ Соединение с облачной базой PostgreSQL (Supabase)...';

  try {
    const endpoint = `${supUrl}/rest/v1/chepoel_profiles`;
    const headers = {
      'apikey': supKey,
      'Authorization': `Bearer ${supKey}`,
      'Content-Type': 'application/json'
    };

    if (direction === 'push') {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: Object.assign({}, headers, { 'Prefer': 'resolution=merge-duplicates' }),
        body: JSON.stringify({
          username: userKey,
          state_json: state,
          updated_at: new Date().toISOString()
        })
      });
      if (res.ok) {
        box.style.background = 'rgba(16, 185, 129, 0.16)';
        box.style.color = '#6ee7b7';
        box.innerHTML = `☁️ <strong>Успешно выгружено в облако!</strong> Профиль <code>@${escapeHtml(userKey)}</code> синхронизирован с Supabase.`;
        showToast('☁️ Данные сохранены в облаке!');
      } else {
        const errText = await res.text();
        box.style.background = 'rgba(245, 158, 11, 0.16)';
        box.style.color = '#fcd34d';
        box.innerHTML = `⚠️ Ответ Supabase (${res.status}): убедитесь, что в SQL Editor создана таблица <code>chepoel_profiles (username text primary key, state_json jsonb, updated_at timestamptz)</code>.<br><span style="font-size:10px;">${escapeHtml(errText.slice(0, 140))}</span>`;
      }
    } else {
      const res = await window.fetch(endpoint + '?username=eq.' + encodeURIComponent(userKey) + '&select=*', { headers });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0 && rows[0].state_json) {
          state = sanitizeLoadedState(rows[0].state_json);
          saveState();
          renderAll();
          box.style.background = 'rgba(16, 185, 129, 0.16)';
          box.style.color = '#6ee7b7';
          box.innerHTML = `📥 <strong>Данные успешно загружены из облака!</strong> Профиль <code>@${escapeHtml(userKey)}</code> обновлён.`;
          showToast('📥 Профиль загружен из облака!');
        } else {
          box.style.background = 'rgba(245, 158, 11, 0.16)';
          box.style.color = '#fcd34d';
          box.innerHTML = `ℹ️ Запись для <code>@${escapeHtml(userKey)}</code> в облаке пока не найдена. Сначала нажмите «Выгрузить в облако».`;
        }
      } else {
        box.style.background = 'rgba(244, 63, 94, 0.16)';
        box.style.color = '#fda4af';
        box.innerHTML = `❌ Ошибка чтения из Supabase (HTTP ${res.status}). Проверьте URL и ключ.`;
      }
    }
  } catch (e) {
    box.style.background = 'rgba(244, 63, 94, 0.16)';
    box.style.color = '#fda4af';
    box.innerHTML = `❌ Сетевая ошибка при подключении к Supabase: ${escapeHtml(e.message || String(e))}`;
  }
}
