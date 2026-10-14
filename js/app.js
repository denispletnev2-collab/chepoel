
function syncModalBodyClass() {
  const anyOpen = document.querySelectorAll('.sheet-backdrop.open, .onb-overlay.open').length > 0;
  document.body.classList.toggle('modal-open', anyOpen);
}

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
let onbSelectedFrame = 'frame-cyber';

function openOnboardingWizard() {
  document.getElementById('onbNickname').value = (state.profile.nickname && state.profile.nickname !== 'CyberAthlete') ? state.profile.nickname : '';
  document.getElementById('onbEmoji').value = state.profile.avatarEmoji || '⚡';
  document.getElementById('onbStatus').value = state.profile.status || 'Иду к своей лучшей форме 🔥';
  onbSelectedFrame = state.profile.frame || 'frame-cyber';
  onbSelectedGoal = state.goals.mode || 'lose';
  updateOnbPreview();
  recalcOnbPreview();
  goToOnbStep(1);
  document.getElementById('onboardingOverlay').classList.add('open'); syncModalBodyClass();
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
}

function pickOnbFrame(frameId) {
  onbSelectedFrame = frameId;
  state.profile.frame = frameId;
  document.querySelectorAll('#onbFrameGrid .frame-pick-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-frame') === frameId);
  });
  updateOnbPreview();
}

function goToOnbStep(stepNum) {
  if (stepNum === 2) {
    const nick = document.getElementById('onbNickname').value.trim();
    if (!nick) {
      document.getElementById('onbNickname').focus();
      showToast('Как к вам обращаться? Введите имя или ник');
      return;
    }
  }
  [1, 2, 3].forEach(n => {
    const pane = document.getElementById('onbStep' + n);
    if (pane) pane.classList.toggle('active', n === stepNum);
    const dot = document.getElementById('onbDot' + n);
    if (dot) dot.classList.toggle('active', n <= stepNum);
  });
  if (stepNum === 3) recalcOnbPreview();
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
