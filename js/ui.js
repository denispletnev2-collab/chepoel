/* js/ui.js — Clean Diary Renderer, Swipeable Bottom Sheet & Unified Add Menu */
let activeMealTarget = 'breakfast';
let activeSheetMode = 'photo'; // 'photo' | 'db' | 'custom_ai' | 'label'
let currentPhotoDataUrl = null;
let currentRecognizedDish = null;
let aiSuggestedGrams = 300;

function renderDiaryView() {
  const todayStr = getLocalDateString(new Date());
  document.getElementById('headerDateLabel').textContent =
    currentDateStr === todayStr ? 'Сегодня' : parseLocalDate(currentDateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  const day = getDayData(currentDateStr);
  const tot = getDayTotals(currentDateStr);
  const g = state.goals;
  const stats = calculateProfileStats();

  document.getElementById('ringKcalEaten').textContent = tot.kcal;
  document.getElementById('ringKcalTarget').textContent = g.kcal;
  document.getElementById('goalScenarioBadge').textContent = g.label || 'Похудение';

  const circ = 326.72;
  const pct = Math.min(1.15, tot.kcal / Math.max(1, g.kcal));
  const ring = document.getElementById('kcalRingFg');
  ring.style.strokeDashoffset = circ - (Math.min(1, pct) * circ);
  ring.style.stroke = tot.kcal > g.kcal * 1.08 ? 'var(--rose)' : 'var(--accent)';

  document.getElementById('pValText').textContent = `${tot.p} / ${g.p} г`;
  document.getElementById('fValText').textContent = `${tot.f} / ${g.f} г`;
  document.getElementById('cValText').textContent = `${tot.c} / ${g.c} г`;

  document.getElementById('pBarFill').style.width = Math.min(100, (tot.p / Math.max(1, g.p)) * 100) + '%';
  document.getElementById('fBarFill').style.width = Math.min(100, (tot.f / Math.max(1, g.f)) * 100) + '%';
  document.getElementById('cBarFill').style.width = Math.min(100, (tot.c / Math.max(1, g.c)) * 100) + '%';

  const rem = g.kcal - tot.kcal;
  const remEl = document.getElementById('statRemaining');
  remEl.textContent = rem >= 0 ? `${rem} ккал` : `+${Math.abs(rem)} ккал`;
  remEl.style.color = rem >= 0 ? 'var(--text)' : 'var(--rose)';

  document.getElementById('statStreak').textContent = `🔥 ${stats.streak} дн.`;
  document.getElementById('statWater').textContent = `💧 ${day.waterMl || 0} мл`;

  // Render Clean Meal Section Cards (Завтрак, Обед, Ужин, Перекус)
  const sectionsHtml = MEAL_TYPES.map(mt => {
    const items = day.meals
      .map((m, idx) => ({ m, idx }))
      .filter(x => (x.m.mealType || 'breakfast') === mt.id);

    const secKcal = Math.round(items.reduce((s, x) => s + (Number(x.m.kcal) || 0), 0));
    const secP = Math.round(items.reduce((s, x) => s + (Number(x.m.p) || 0), 0));
    const secF = Math.round(items.reduce((s, x) => s + (Number(x.m.f) || 0), 0));
    const secC = Math.round(items.reduce((s, x) => s + (Number(x.m.c) || 0), 0));

    const subText = items.length > 0
      ? `${secKcal} ккал • Б: ${secP}г • Ж: ${secF}г • У: ${secC}г`
      : 'Пока пусто';

    const listHtml = items.length === 0 ? '' : `
      <div class="meal-items-list">
        ${items.map(({ m, idx }) => `
          <div class="logged-row" onclick="openEditMealModal(${idx})" title="Нажмите, чтобы изменить граммовку, КБЖУ или приём пищи">
            <div class="logged-info">
              <div class="logged-name">${escapeHtml(m.name)}</div>
              <div class="logged-meta">${m.grams} г • Б: ${m.p}г • Ж: ${m.f}г • У: ${m.c}г ${m.time ? '• ' + m.time : ''}</div>
            </div>
            <div class="logged-right" onclick="event.stopPropagation()">
              <span class="logged-kcal">${Math.round(m.kcal)} ккал</span>
              <button type="button" class="row-del-btn" style="color:var(--blue); border-color:rgba(59,130,246,0.28);" onclick="openEditMealModal(${idx})" title="Редактировать запись">✏️</button>
              <button type="button" class="row-del-btn" onclick="deleteLoggedMeal(${idx})" title="Удалить">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    return `
      <div class="meal-section-card">
        <div class="meal-sec-header">
          <div class="meal-sec-left">
            <div class="meal-sec-icon">${mt.icon}</div>
            <div>
              <div class="meal-sec-title">${mt.title}</div>
              <div class="meal-sec-sub">${subText}</div>
            </div>
          </div>
          <button type="button" class="add-meal-pill" onclick="openAddSheet('${mt.id}', 'db')">
            <span>+ Добавить</span>
          </button>
        </div>
        ${listHtml}
      </div>
    `;
  }).join('');

  document.getElementById('mealSectionsContainer').innerHTML = sectionsHtml;
  renderDiaryDisciplineBar();
}

function addWaterMl() {
  const day = getDayData(currentDateStr);
  day.waterMl = ((day.waterMl || 0) + 250) % 4250;
  saveState();
  renderDiaryView();
}

function deleteLoggedMeal(idx) {
  const day = getDayData(currentDateStr);
  day.meals.splice(idx, 1);
  saveState();
  renderAll();
  showToast('Запись удалена');
}

/* UNIFIED ADD FOOD BOTTOM SHEET */
function openAddSheet(mealType, initialMode) {
  activeMealTarget = mealType || 'breakfast';
  activeSheetMode = initialMode || 'db';
  renderMealTargetPills();
  setSheetMode(activeSheetMode);
  document.getElementById('addFoodSheetBackdrop').classList.add('open'); if(typeof syncModalBodyClass==='function') syncModalBodyClass();
}

function closeAddSheet() {
  document.getElementById('addFoodSheetBackdrop').classList.remove('open'); if(typeof syncModalBodyClass==='function') syncModalBodyClass();
}

function renderMealTargetPills() {
  const wrap = document.getElementById('sheetMealTargetPills');
  wrap.innerHTML = MEAL_TYPES.map(mt => `
    <button type="button" class="freq-chip"
      style="${activeMealTarget === mt.id ? 'border-color:var(--accent); background:rgba(16,185,129,0.16); color:var(--accent);' : ''}"
      onclick="selectMealTarget('${mt.id}')">
      ${mt.icon} ${mt.title}
    </button>
  `).join('');
}

function selectMealTarget(mealId) {
  activeMealTarget = mealId;
  renderMealTargetPills();
}

function setSheetMode(mode, prefillQuery) {
  activeSheetMode = mode;
  ['photo', 'db', 'custom_ai', 'label'].forEach(m => {
    const btn = document.getElementById('smode-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
    const pane = document.getElementById('spane-' + m);
    if (pane) pane.style.display = (m === mode) ? 'block' : 'none';
  });

  if (mode === 'db') {
    renderSheetDbSearch();
  } else if (mode === 'custom_ai' && prefillQuery) {
    document.getElementById('customDishName').value = prefillQuery;
    document.getElementById('customAiPrompt').value = prefillQuery;
  }
}

/* Mode 2: Frequent Chips & Database Search inside Sheet */
function renderSheetDbSearch() {
  // Frequent / Recent chips
  const freqWrap = document.getElementById('sheetFrequentChips');
  const recents = (state.recentItems && state.recentItems.length > 0)
    ? state.recentItems
    : (window.BUILTIN_RU_DB || []).slice(0, 6).map(p => ({
        name: p.name, kcal100: p.kcal100, p100: p.p100, f100: p.f100, c100: p.c100, grams: p.portion || 150
      }));

  freqWrap.innerHTML = recents.map((r, i) => `
    <button type="button" class="freq-chip" onclick="quickLogRecentItem(${i})">
      ⚡ ${escapeHtml(r.name)} (${r.grams}г)
    </button>
  `).join('');

  window._currentRecentsList = recents;

  const q = (document.getElementById('sheetDbSearchInput').value || '').trim().toLowerCase();
  const all = getAllProducts();
  const matched = q
    ? all.filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
    : all.slice(0, 35);

  const listEl = document.getElementById('sheetDbResults');
  const customWeightsVal = Number(document.getElementById('sheetDbGramsInput').value) || 0;

  let html = matched.slice(0, 45).map(item => {
    const g = customWeightsVal > 0 ? customWeightsVal : (item.portion || 100);
    const kcal = Math.round(item.kcal100 * g / 100);
    return `
      <div class="db-row">
        <div style="min-width:0; flex:1;">
          <div class="db-row-title">${escapeHtml(item.name)}</div>
          <div class="db-row-sub">${kcal} ккал на ${g} г • Б:${item.p100} Ж:${item.f100} У:${item.c100} (на 100г)</div>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="logProductFromSheet('${item.id}')">+ ${g} г</button>
      </div>
    `;
  }).join('');

  // Always offer AI Custom Dish creation if dish isn't found or user wants custom
  const safeQ = escapeHtml(document.getElementById('sheetDbSearchInput').value.trim());
  html += `
    <div style="margin-top:10px; padding:12px; border-radius:14px; background:rgba(139,92,246,0.12); border:1px dashed rgba(139,92,246,0.45); text-align:center;">
      <div style="font-size:12px; font-weight:700; margin-bottom:6px;">
        ${matched.length === 0 ? `Блюдо «${safeQ}» не найдено в базе` : 'Нет нужного домашнего или ресторанного блюда?'}
      </div>
      <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
        <button type="button" class="btn btn-purple btn-sm" onclick="setSheetMode('custom_ai', '${safeQ}')">
          ✨ Создать блюдо с помощью ИИ
        </button>
        ${safeQ ? `<button type="button" class="btn btn-blue btn-sm" onclick="searchOnlineFromSheet()">🌐 Найти «${safeQ}» онлайн</button>` : ''}
      </div>
    </div>
  `;

  listEl.innerHTML = html;
}

function quickLogRecentItem(idx) {
  const r = (window._currentRecentsList || [])[idx];
  if (!r) return;
  const grams = r.grams || 150;
  const ratio = grams / 100;
  logMealEntry({
    name: r.name,
    grams,
    kcal: Math.round(r.kcal100 * ratio),
    p: Math.round(r.p100 * ratio * 10) / 10,
    f: Math.round(r.f100 * ratio * 10) / 10,
    c: Math.round(r.c100 * ratio * 10) / 10,
    kcal100: r.kcal100, p100: r.p100, f100: r.f100, c100: r.c100
  });
}

function logProductFromSheet(prodId) {
  const prod = getAllProducts().find(p => p.id === prodId);
  if (!prod) return;
  const customG = Number(document.getElementById('sheetDbGramsInput').value) || 0;
  const grams = customG > 0 ? customG : (Number(prod.portion) || 100);
  const ratio = grams / 100;
  logMealEntry({
    name: prod.name,
    grams,
    kcal: Math.round(prod.kcal100 * ratio),
    p: Math.round(prod.p100 * ratio * 10) / 10,
    f: Math.round(prod.f100 * ratio * 10) / 10,
    c: Math.round(prod.c100 * ratio * 10) / 10,
    kcal100: prod.kcal100, p100: prod.p100, f100: prod.f100, c100: prod.c100
  });
}

async function searchOnlineFromSheet() {
  const q = (document.getElementById('sheetDbSearchInput').value || '').trim();
  if (!q) return;
  showToast(`🌐 Ищем «${q}» в онлайн-каталоге...`);
  try {
    const url = `https://ru.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15`;
    const res = await fetch(url);
    const data = await res.json();
    let added = 0;
    ((data && data.products) || []).forEach((p, i) => {
      const name = (p.product_name_ru || p.product_name || '').trim();
      const nutr = p.nutriments || {};
      const kcal100 = Math.round(Number(nutr['energy-kcal_100g'] || 0));
      if (name && kcal100 > 0) {
        state.customProducts.unshift({
          id: 'off_' + Date.now() + '_' + i,
          name,
          category: 'Мои блюда',
          kcal100,
          p100: Math.round(Number(nutr.proteins_100g || 0) * 10) / 10,
          f100: Math.round(Number(nutr.fat_100g || 0) * 10) / 10,
          c100: Math.round(Number(nutr.carbohydrates_100g || 0) * 10) / 10,
          portion: 100,
          custom: true
        });
        added++;
      }
    });
    saveState();
    renderSheetDbSearch();
    showToast(added > 0 ? `✅ Найдено ${added} продуктов!` : 'В онлайн-базе не найдено, создайте через ИИ');
  } catch (e) {
    showToast('Офлайн-режим: используйте «Своё блюдо с ИИ»');
  }
}

/* Mode 3: Save & Log AI-Assisted Custom Dish */
function saveAndLogCustomDish() {
  const name = document.getElementById('customDishName').value.trim() || 'Моё блюдо';
  const portion = Math.max(10, Number(document.getElementById('customDishPortion').value) || 250);
  const p100 = Math.max(0, Number(document.getElementById('customDishP100').value) || 0);
  const f100 = Math.max(0, Number(document.getElementById('customDishF100').value) || 0);
  const c100 = Math.max(0, Number(document.getElementById('customDishC100').value) || 0);
  let kcal100 = Number(document.getElementById('customDishKcal100').value);
  if (!kcal100 && (p100 || f100 || c100)) kcal100 = Math.round(p100 * 4 + f100 * 9 + c100 * 4);

  const newProd = {
    id: 'custom_' + Date.now(),
    name,
    category: 'Мои блюда',
    kcal100: Math.round(kcal100 || 150),
    p100, f100, c100,
    portion,
    custom: true
  };
  state.customProducts.unshift(newProd);

  const ratio = portion / 100;
  logMealEntry({
    name,
    grams: portion,
    kcal: Math.round(newProd.kcal100 * ratio),
    p: Math.round(p100 * ratio * 10) / 10,
    f: Math.round(f100 * ratio * 10) / 10,
    c: Math.round(c100 * ratio * 10) / 10,
    kcal100: newProd.kcal100, p100, f100, c100
  });
}

/* Mode 1 & 4: Photo / Gallery Capture & AI Dish Weight / Label OCR */
function triggerCapture(source, targetMode) {
  if (targetMode) setSheetMode(targetMode);
  const isAndroidWv = /wv|Android.*Version\/[0-9]/i.test(navigator.userAgent);
  if (isAndroidWv) {
    window.location.href = source === 'camera' ? 'nutriscan://camera' : 'nutriscan://gallery';
    return;
  }
  const inp = document.getElementById(source === 'camera' ? 'hiddenCamInput' : 'hiddenGalInput');
  if (inp) { inp.value = ''; inp.click(); }
}

window.onNativePhotoResult = function(base64Jpeg) {
  if (!base64Jpeg) return;
  currentPhotoDataUrl = 'data:image/jpeg;base64,' + base64Jpeg;
  onPhotoReadyForAi();
};

function handleFileInputSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 960;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      currentPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.84);
      onPhotoReadyForAi();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function onPhotoReadyForAi() {
  if (!document.getElementById('addFoodSheetBackdrop').classList.contains('open')) {
    openAddSheet(activeMealTarget, activeSheetMode === 'label' ? 'label' : 'photo');
  }
  if (activeSheetMode === 'label') {
    await runLabelOcrAnalysis();
  } else {
    setSheetMode('photo');
    await runDishPhotoAnalysis();
  }
}

async function runDishPhotoAnalysis() {
  if (!currentPhotoDataUrl) return;
  const previewWrap = document.getElementById('photoAnalysisWrap');
  previewWrap.style.display = 'block';
  document.getElementById('sheetPhotoPreview').src = currentPhotoDataUrl;
  const statusEl = document.getElementById('photoAiStatusText');
  statusEl.textContent = '🔍 Нейросеть определяет состав и взвешивает порцию на тарелке...';

  const hint = (document.getElementById('photoUserHint').value || '').trim();
  const apiKey = (state.apiKey || '').trim();
  const b64 = currentPhotoDataUrl.split(',')[1];

  if (apiKey) {
    try {
      const prompt = `Ты — ИИ-диетолог и система компьютерного зрения для оценки веса еды.
Определи блюдо на фото${hint ? ' (подсказка: ' + hint + ')' : ''}, оцени заполнение тарелки и САМ определи общий вес порции в граммах (estimatedGrams) и вес каждого компонента.
Верни СТРОГО JSON без markdown:
{
  "name": "Название блюда на русском",
  "kcal100": число_ккал_на_100г,
  "p100": белки_на_100г,
  "f100": жиры_на_100г,
  "c100": углеводы_на_100г,
  "estimatedGrams": общий_вес_порции_в_граммах,
  "plateFillPercent": число_от_30_до_95,
  "weightReasoning": "Пояснение оценки веса по объёму на тарелке",
  "components": [{"name": "Компонент 1", "grams": число_грамм}]
}`;
      const { parsed, modelName } = await callGeminiTextOrVision(apiKey, prompt, b64);
      populateRecognizedDishUI({
        name: parsed.name || 'Распознанное блюдо',
        kcal100: Number(parsed.kcal100) || 150,
        p100: Number(parsed.p100) || 11,
        f100: Number(parsed.f100) || 6,
        c100: Number(parsed.c100) || 14,
        estimatedGrams: Number(parsed.estimatedGrams) || 310,
        plateFillPercent: Number(parsed.plateFillPercent) || 74,
        weightReasoning: parsed.weightReasoning || `Оценка Gemini (${modelName}) по объёму порции`,
        components: Array.isArray(parsed.components) ? parsed.components : []
      });
      return;
    } catch (e) {
      console.warn('Gemini photo fallback:', e);
    }
  }

  // Autonomous Canvas Plate Coverage & Weight Estimator
  const vision = await estimatePortionWeightFromImageCanvas(currentPhotoDataUrl, 300);
  const low = hint.toLowerCase();
  let tpl = DISH_TEMPLATES.find(t => t.keywords.some(k => low.includes(k)));
  if (!tpl) {
    const idx = Math.floor((vision.warmRatio * 100 + vision.plateFillPercent) % DISH_TEMPLATES.length);
    tpl = DISH_TEMPLATES[idx];
  }
  const vision2 = await estimatePortionWeightFromImageCanvas(currentPhotoDataUrl, tpl.defaultGrams);
  const estG = vision2.estimatedGrams;
  const comps = (tpl.baseComponents || [{name: tpl.name, share: 1}]).map(c => ({
    name: c.name,
    grams: Math.max(15, Math.round((estG * c.share) / 5) * 5)
  }));

  populateRecognizedDishUI({
    name: hint ? (hint.charAt(0).toUpperCase() + hint.slice(1)) : tpl.name,
    kcal100: tpl.kcal100,
    p100: tpl.p100,
    f100: tpl.f100,
    c100: tpl.c100,
    estimatedGrams: estG,
    plateFillPercent: vision2.plateFillPercent,
    weightReasoning: `Авто-оценка по фото: заполнение тарелки ~${vision2.plateFillPercent}%, расчётный вес ~${estG} г`,
    components: comps
  });
}

function populateRecognizedDishUI(dish) {
  currentRecognizedDish = dish;
  aiSuggestedGrams = Math.max(30, Math.round(dish.estimatedGrams || 300));
  document.getElementById('photoAiStatusText').textContent = `⚖️ Оценка веса ИИ: ~${aiSuggestedGrams} г`;
  document.getElementById('recDishNameInput').value = dish.name;
  document.getElementById('recDishGramsInput').value = aiSuggestedGrams;
  document.getElementById('recWeightReasoning').textContent = dish.weightReasoning;

  updateRecognizedDishCalculation();
}

function stepRecGrams(delta) {
  const inp = document.getElementById('recDishGramsInput');
  inp.value = Math.max(10, (Number(inp.value) || 250) + delta);
  updateRecognizedDishCalculation();
}

function applyRecPreset(scaleFactor) {
  if (!currentRecognizedDish) return;
  document.getElementById('recDishGramsInput').value = Math.max(50, Math.round((aiSuggestedGrams * scaleFactor) / 10) * 10);
  updateRecognizedDishCalculation();
}

function updateRecognizedDishCalculation() {
  if (!currentRecognizedDish) return;
  const grams = Math.max(1, Number(document.getElementById('recDishGramsInput').value) || 250);
  const ratio = grams / 100;
  const kcal = Math.round(currentRecognizedDish.kcal100 * ratio);
  const p = Math.round(currentRecognizedDish.p100 * ratio * 10) / 10;
  const f = Math.round(currentRecognizedDish.f100 * ratio * 10) / 10;
  const c = Math.round(currentRecognizedDish.c100 * ratio * 10) / 10;

  document.getElementById('recMacrosSummary').textContent = `${kcal} ккал • Б: ${p}г • Ж: ${f}г • У: ${c}г`;

  const scale = grams / Math.max(1, aiSuggestedGrams);
  const comps = currentRecognizedDish.components || [];
  document.getElementById('recComponentsChips').innerHTML = comps.map(comp =>
    `<span class="comp-chip">⚖️ ${escapeHtml(comp.name)}: <strong>~${Math.max(5, Math.round(comp.grams * scale))} г</strong></span>`
  ).join('');
}

function confirmPhotoDishToMeal() {
  if (!currentRecognizedDish) return;
  const name = document.getElementById('recDishNameInput').value.trim() || currentRecognizedDish.name;
  const grams = Math.max(1, Number(document.getElementById('recDishGramsInput').value) || 250);
  const ratio = grams / 100;
  logMealEntry({
    name,
    grams,
    kcal: Math.round(currentRecognizedDish.kcal100 * ratio),
    p: Math.round(currentRecognizedDish.p100 * ratio * 10) / 10,
    f: Math.round(currentRecognizedDish.f100 * ratio * 10) / 10,
    c: Math.round(currentRecognizedDish.c100 * ratio * 10) / 10,
    kcal100: currentRecognizedDish.kcal100,
    p100: currentRecognizedDish.p100,
    f100: currentRecognizedDish.f100,
    c100: currentRecognizedDish.c100
  });
}

async function runLabelOcrAnalysis() {
  if (!currentPhotoDataUrl) return;
  document.getElementById('labelPreviewBox').style.display = 'block';
  document.getElementById('sheetLabelPreview').src = currentPhotoDataUrl;
  const apiKey = (state.apiKey || '').trim();
  const b64 = currentPhotoDataUrl.split(',')[1];

  if (apiKey) {
    try {
      const prompt = `Прочитай этикетку продукта на фото и верни СТРОГО JSON без markdown: {"name":"Название и бренд","kcal100":число,"p100":число,"f100":число,"c100":число,"portion":100}`;
      const { parsed } = await callGeminiTextOrVision(apiKey, prompt, b64);
      document.getElementById('lblProdName').value = parsed.name || 'Продукт с этикетки';
      document.getElementById('lblProdKcal').value = Number(parsed.kcal100) || 120;
      document.getElementById('lblProdP').value = Number(parsed.p100) || 10;
      document.getElementById('lblProdF').value = Number(parsed.f100) || 5;
      document.getElementById('lblProdC').value = Number(parsed.c100) || 12;
      document.getElementById('lblProdPortion').value = Number(parsed.portion) || 100;
      showToast('🏷️ Этикетка распознана ИИ!');
      return;
    } catch (e) {}
  }
  document.getElementById('lblProdName').value = 'Новый продукт (с этикетки)';
  showToast('Проверьте данные с упаковки и нажмите «Сохранить»');
}

function saveAndLogLabelProduct() {
  const name = document.getElementById('lblProdName').value.trim() || 'Продукт с этикетки';
  const portion = Math.max(10, Number(document.getElementById('lblProdPortion').value) || 100);
  const kcal100 = Math.max(0, Number(document.getElementById('lblProdKcal').value) || 120);
  const p100 = Math.max(0, Number(document.getElementById('lblProdP').value) || 0);
  const f100 = Math.max(0, Number(document.getElementById('lblProdF').value) || 0);
  const c100 = Math.max(0, Number(document.getElementById('lblProdC').value) || 0);

  state.customProducts.unshift({
    id: 'lbl_' + Date.now(),
    name, category: 'Мои продукты', kcal100, p100, f100, c100, portion, custom: true
  });
  const ratio = portion / 100;
  logMealEntry({
    name, grams: portion,
    kcal: Math.round(kcal100 * ratio),
    p: Math.round(p100 * ratio * 10) / 10,
    f: Math.round(f100 * ratio * 10) / 10,
    c: Math.round(c100 * ratio * 10) / 10,
    kcal100, p100, f100, c100
  });
}

function logMealEntry(entry) {
  const prevLvl = calculateProfileStats().level;
  const day = getDayData(currentDateStr);
  const g = Math.max(1, Number(entry.grams) || 100);
  day.meals.push({
    name: entry.name,
    mealType: activeMealTarget,
    grams: g,
    kcal: Math.round(Number(entry.kcal) || 0),
    p: Math.round((Number(entry.p) || 0) * 10) / 10,
    f: Math.round((Number(entry.f) || 0) * 10) / 10,
    c: Math.round((Number(entry.c) || 0) * 10) / 10,
    kcal100: Number(entry.kcal100) || Math.round(((Number(entry.kcal) || 0) / g) * 100),
    p100: Number(entry.p100) || Math.round(((Number(entry.p) || 0) / g) * 1000) / 10,
    f100: Number(entry.f100) || Math.round(((Number(entry.f) || 0) / g) * 1000) / 10,
    c100: Number(entry.c100) || Math.round(((Number(entry.c) || 0) / g) * 1000) / 10,
    time: new Date().toTimeString().slice(0, 5)
  });
  recordRecentItem(entry);
  saveState();
  renderAll();
  closeAddSheet();
  const mealTitle = (MEAL_TYPES.find(m => m.id === activeMealTarget) || {}).title || 'Дневник';
  showToast(`✅ Добавлено в «${mealTitle}» (+45 XP)`);
  checkAndTriggerLevelUp(prevLvl);
}

/* ==================== EDIT LOGGED MEAL MODAL ==================== */
let editingMealIndex = -1;
let editingMealBase100 = { kcal100: 150, p100: 10, f100: 6, c100: 15 };

function openEditMealModal(idx) {
  const day = getDayData(currentDateStr);
  const m = day.meals[idx];
  if (!m) return;
  editingMealIndex = idx;

  const g = Math.max(1, Number(m.grams) || 100);
  editingMealBase100 = {
    kcal100: Number(m.kcal100) || ((Number(m.kcal) || 0) / g) * 100,
    p100: Number(m.p100) || ((Number(m.p) || 0) / g) * 100,
    f100: Number(m.f100) || ((Number(m.f) || 0) / g) * 100,
    c100: Number(m.c100) || ((Number(m.c) || 0) / g) * 100
  };

  document.getElementById('editMealNameInput').value = m.name || '';
  document.getElementById('editMealTypeSelect').value = m.mealType || 'breakfast';
  document.getElementById('editMealGramsInput').value = g;
  document.getElementById('editMealKcalInput').value = Math.round(Number(m.kcal) || 0);
  document.getElementById('editMealPInput').value = Math.round((Number(m.p) || 0) * 10) / 10;
  document.getElementById('editMealFInput').value = Math.round((Number(m.f) || 0) * 10) / 10;
  document.getElementById('editMealCInput').value = Math.round((Number(m.c) || 0) * 10) / 10;

  document.getElementById('editMealModalBackdrop').classList.add('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function closeEditMealModal() {
  document.getElementById('editMealModalBackdrop').classList.remove('open');
  if (typeof syncModalBodyClass === 'function') syncModalBodyClass();
}

function stepEditMealGrams(delta) {
  const inp = document.getElementById('editMealGramsInput');
  const nextG = Math.max(5, (Number(inp.value) || 100) + delta);
  inp.value = nextG;
  recalcEditMealFromGrams();
}

function recalcEditMealFromGrams() {
  const g = Math.max(1, Number(document.getElementById('editMealGramsInput').value) || 100);
  const ratio = g / 100;
  document.getElementById('editMealKcalInput').value = Math.round(editingMealBase100.kcal100 * ratio);
  document.getElementById('editMealPInput').value = Math.round(editingMealBase100.p100 * ratio * 10) / 10;
  document.getElementById('editMealFInput').value = Math.round(editingMealBase100.f100 * ratio * 10) / 10;
  document.getElementById('editMealCInput').value = Math.round(editingMealBase100.c100 * ratio * 10) / 10;
}

function saveEditedMeal() {
  const day = getDayData(currentDateStr);
  if (editingMealIndex < 0 || !day.meals[editingMealIndex]) return;

  const g = Math.max(1, Number(document.getElementById('editMealGramsInput').value) || 100);
  const kcal = Math.max(0, Math.round(Number(document.getElementById('editMealKcalInput').value) || 0));
  const p = Math.max(0, Math.round((Number(document.getElementById('editMealPInput').value) || 0) * 10) / 10);
  const f = Math.max(0, Math.round((Number(document.getElementById('editMealFInput').value) || 0) * 10) / 10);
  const c = Math.max(0, Math.round((Number(document.getElementById('editMealCInput').value) || 0) * 10) / 10);

  day.meals[editingMealIndex] = Object.assign({}, day.meals[editingMealIndex], {
    name: document.getElementById('editMealNameInput').value.trim() || 'Блюдо',
    mealType: document.getElementById('editMealTypeSelect').value || 'breakfast',
    grams: g,
    kcal, p, f, c,
    kcal100: Math.round((kcal / g) * 100),
    p100: Math.round((p / g) * 1000) / 10,
    f100: Math.round((f / g) * 1000) / 10,
    c100: Math.round((c / g) * 1000) / 10
  });

  saveState();
  renderAll();
  closeEditMealModal();
  showToast('✏️ Приём пищи обновлён');
}

function duplicateEditedMeal() {
  const day = getDayData(currentDateStr);
  if (editingMealIndex < 0 || !day.meals[editingMealIndex]) return;
  const prevLvl = calculateProfileStats().level;
  saveEditedMeal();
  const copy = Object.assign({}, day.meals[editingMealIndex], {
    time: new Date().toTimeString().slice(0, 5)
  });
  day.meals.push(copy);
  saveState();
  renderAll();
  showToast('📋 Блюдо продублировано (+45 XP)');
  checkAndTriggerLevelUp(prevLvl);
}

function deleteEditedMeal() {
  if (editingMealIndex < 0) return;
  deleteLoggedMeal(editingMealIndex);
  closeEditMealModal();
}



function syncModalBodyClass() {
  const anyOpen = document.querySelectorAll('.sheet-backdrop.open, .onb-overlay.open').length > 0;
  document.body.classList.toggle('modal-open', anyOpen);
}
