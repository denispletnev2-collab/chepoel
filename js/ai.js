/* js/ai.js — Gemini Vision Cascade, Automatic Dish Weight Estimator & AI Custom Dish Assistant */
const DISH_TEMPLATES = [
  { keywords: ['куриц', 'грудк', 'филе', 'индейк'], name: 'Куриное филе с гарниром и овощами', kcal100: 138, p100: 16.5, f100: 3.8, c100: 9.2, defaultGrams: 320,
    baseComponents: [{name: 'Филе птицы', share: 0.44}, {name: 'Гарнир', share: 0.41}, {name: 'Овощи/соус', share: 0.15}] },
  { keywords: ['греч', 'каша', 'овсян', 'рис', 'плов'], name: 'Плов / Гарнир из крупы с мясом', kcal100: 158, p100: 8.4, f100: 5.6, c100: 19.2, defaultGrams: 310,
    baseComponents: [{name: 'Крупа отварная', share: 0.62}, {name: 'Мясо', share: 0.28}, {name: 'Подлива', share: 0.10}] },
  { keywords: ['салат', 'цезар', 'греческ', 'овощ', 'оливь'], name: 'Салат с заправкой', kcal100: 126, p100: 7.2, f100: 8.1, c100: 6.4, defaultGrams: 240,
    baseComponents: [{name: 'Овощи и зелень', share: 0.58}, {name: 'Белок / сыр', share: 0.29}, {name: 'Заправка', share: 0.13}] },
  { keywords: ['яйц', 'омлет', 'яичниц', 'шакшук', 'овсяноблин'], name: 'Яичница / Омлет с начинкой', kcal100: 164, p100: 12.2, f100: 11.8, c100: 2.4, defaultGrams: 230,
    baseComponents: [{name: 'Яйца (2–3 шт.)', share: 0.65}, {name: 'Сыр / ветчина / томаты', share: 0.25}, {name: 'Зелень / тост', share: 0.10}] },
  { keywords: ['рыб', 'лосос', 'семг', 'форел', 'треск', 'минтай'], name: 'Запечённая рыба с гарниром', kcal100: 156, p100: 16.8, f100: 6.9, c100: 6.5, defaultGrams: 290,
    baseComponents: [{name: 'Филе рыбы', share: 0.48}, {name: 'Гарнир / овощи', share: 0.42}, {name: 'Соус', share: 0.10}] },
  { keywords: ['паст', 'макарон', 'спагетт', 'карбонар'], name: 'Паста с соусом и сыром', kcal100: 188, p100: 8.4, f100: 6.8, c100: 23.6, defaultGrams: 300,
    baseComponents: [{name: 'Паста', share: 0.64}, {name: 'Соус', share: 0.26}, {name: 'Сыр', share: 0.10}] },
  { keywords: ['суп', 'борщ', 'щи', 'солянк', 'бульон', 'уха', 'том ям'], name: 'Домашний суп / Борщ', kcal100: 68, p100: 4.4, f100: 3.1, c100: 5.8, defaultGrams: 360,
    baseComponents: [{name: 'Бульон и овощи', share: 0.75}, {name: 'Мясо', share: 0.18}, {name: 'Сметана', share: 0.07}] },
  { keywords: ['пельмен', 'вареник', 'хинкал', 'манты'], name: 'Пельмени / Хинкали со сметаной', kcal100: 235, p100: 11.2, f100: 10.8, c100: 23.4, defaultGrams: 280,
    baseComponents: [{name: 'Пельмени', share: 0.88}, {name: 'Сметана', share: 0.12}] },
  { keywords: ['сырник', 'творог', 'запеканк', 'блин'], name: 'Сырники / Творожное блюдо', kcal100: 196, p100: 13.8, f100: 7.8, c100: 17.5, defaultGrams: 210,
    baseComponents: [{name: 'Сырники', share: 0.82}, {name: 'Сметана / ягоды', share: 0.18}] },
  { keywords: ['котлет', 'пюре', 'гуляш', 'бефстроган', 'тефтел'], name: 'Котлета с картофельным пюре', kcal100: 158, p100: 10.4, f100: 7.4, c100: 12.6, defaultGrams: 330,
    baseComponents: [{name: 'Пюре', share: 0.52}, {name: 'Котлета', share: 0.36}, {name: 'Подлива', share: 0.12}] },
  { keywords: ['пицц', 'бургер', 'шаурм', 'сэндвич', 'бутерброд', 'ролл'], name: 'Шаурма / Сэндвич / Пицца', kcal100: 224, p100: 11.2, f100: 9.8, c100: 23.0, defaultGrams: 260,
    baseComponents: [{name: 'Основа (тесто/лаваш)', share: 0.46}, {name: 'Начинка (мясо/сыр)', share: 0.40}, {name: 'Соус и овощи', share: 0.14}] }
];

async function callGeminiTextOrVision(apiKey, promptText, base64Jpeg) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr = null;
  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const parts = [{ text: promptText }];
      if (base64Jpeg) {
        parts.push({ inline_data: { mime_type: 'image/jpeg', data: base64Jpeg } });
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });
      const data = await res.json();
      if (!res.ok) {
        lastErr = data?.error?.message || `HTTP ${res.status}`;
        continue;
      }
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return { parsed: JSON.parse(match[0]), modelName };
    } catch (e) {
      lastErr = e.message || String(e);
    }
  }
  throw new Error(lastErr || 'Нет ответа от Gemini API');
}

/* Visual Plate Coverage & Portion Weight Estimator (<canvas>) */
function estimatePortionWeightFromImageCanvas(dataUrl, baseGrams) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const sz = 96;
        canvas.width = sz; canvas.height = sz;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, sz, sz);
        const data = ctx.getImageData(0, 0, sz, sz).data;

        let centerFood = 0, centerTotal = 0, satSum = 0, warmPixels = 0;
        for (let y = 0; y < sz; y++) {
          for (let x = 0; x < sz; x++) {
            const idx = (y * sz + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
            const lum = r * 0.299 + g * 0.587 + b * 0.114;
            const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
            const dx = (x - sz / 2) / (sz / 2);
            const dy = (y - sz / 2) / (sz / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.74) {
              centerTotal++;
              satSum += sat;
              if (r > b + 18) warmPixels++;
              if (sat > 0.16 || lum < 195) centerFood++;
            }
          }
        }
        const fillPct = Math.min(92, Math.max(42, Math.round((centerFood / Math.max(1, centerTotal)) * 100)));
        const avgSat = satSum / Math.max(1, centerTotal);
        const scale = 0.62 + (fillPct / 100) * 0.64 + (avgSat * 0.12);
        const estimatedGrams = Math.max(120, Math.min(650, Math.round(((baseGrams || 290) * scale) / 5) * 5));
        resolve({ estimatedGrams, plateFillPercent: fillPct, warmRatio: warmPixels / Math.max(1, centerTotal) });
      } catch (e) {
        resolve({ estimatedGrams: baseGrams || 290, plateFillPercent: 72, warmRatio: 0.5 });
      }
    };
    img.onerror = () => resolve({ estimatedGrams: baseGrams || 290, plateFillPercent: 72, warmRatio: 0.5 });
    img.src = dataUrl;
  });
}

/* AI Custom Dish Assistant: calculates Kcal/Macros/Portion from text description */
async function assistCustomDishWithAi() {
  const descInput = document.getElementById('customAiPrompt');
  const titleInput = document.getElementById('customDishName');
  const query = ((descInput && descInput.value) || (titleInput && titleInput.value) || '').trim();
  if (!query) {
    showToast('Напишите название или состав вашего блюда');
    return;
  }

  const btn = document.getElementById('aiAssistCustomBtn');
  const noteEl = document.getElementById('customAiBreakdownNote');
  btn.disabled = true;
  btn.textContent = '🤖 ИИ считает состав и КБЖУ...';

  const apiKey = (state.apiKey || '').trim();
  if (apiKey) {
    try {
      const prompt = `Ты — профессиональный диетолог-технолог. Пользователь описывает своё блюдо или рецепт: "${query}".
Рассчитай среднюю пищевую ценность этого готового блюда на 100 г и типичный вес одной порции (portionGrams).
Верни СТРОГО JSON без markdown:
{
  "name": "Красивое название блюда на русском",
  "kcal100": число_ккал_на_100г,
  "p100": белки_на_100г,
  "f100": жиры_на_100г,
  "c100": углеводы_на_100г,
  "portionGrams": вес_порции_в_граммах,
  "explanation": "Короткая раскладка ингредиентов и почему получилось такое КБЖУ"
}`;
      const { parsed, modelName } = await callGeminiTextOrVision(apiKey, prompt, null);
      document.getElementById('customDishName').value = parsed.name || query;
      document.getElementById('customDishPortion').value = Number(parsed.portionGrams) || 250;
      document.getElementById('customDishKcal100').value = Number(parsed.kcal100) || 160;
      document.getElementById('customDishP100').value = Number(parsed.p100) || 10;
      document.getElementById('customDishF100').value = Number(parsed.f100) || 7;
      document.getElementById('customDishC100').value = Number(parsed.c100) || 15;
      noteEl.style.display = 'block';
      noteEl.innerHTML = `✨ <strong>Рассчитано Gemini (${modelName}):</strong> ${escapeHtml(parsed.explanation || 'Состав автоматически разложен по ингредиентам.')}`;
      btn.disabled = false;
      btn.textContent = '✨ Пересчитать с ИИ';
      return;
    } catch (e) {
      console.warn('AI Assist fallback:', e);
    }
  }

  // Smart Offline Culinary Ingredient Parser
  const low = query.toLowerCase();
  const allDb = getAllProducts();
  const matchedIngs = [];
  const words = low.split(/[\s,+]+/).filter(w => w.length >= 3);

  for (const w of words) {
    const found = allDb.find(p => p.name.toLowerCase().includes(w));
    if (found && !matchedIngs.some(m => m.id === found.id)) {
      matchedIngs.push(found);
      if (matchedIngs.length >= 4) break;
    }
  }

  let kcal100 = 165, p100 = 11.5, f100 = 7.2, c100 = 14.0, portion = 260, expl = '';
  if (matchedIngs.length > 0) {
    kcal100 = Math.round(matchedIngs.reduce((s, x) => s + x.kcal100, 0) / matchedIngs.length);
    p100 = Math.round((matchedIngs.reduce((s, x) => s + x.p100, 0) / matchedIngs.length) * 10) / 10;
    f100 = Math.round((matchedIngs.reduce((s, x) => s + x.f100, 0) / matchedIngs.length) * 10) / 10;
    c100 = Math.round((matchedIngs.reduce((s, x) => s + x.c100, 0) / matchedIngs.length) * 10) / 10;
    expl = `Рассчитано по найденным ингредиентам: ${matchedIngs.map(x => x.name).join(' + ')}`;
  } else {
    const tpl = DISH_TEMPLATES.find(t => t.keywords.some(k => low.includes(k))) || DISH_TEMPLATES[0];
    kcal100 = tpl.kcal100; p100 = tpl.p100; f100 = tpl.f100; c100 = tpl.c100; portion = tpl.defaultGrams;
    expl = `Оценка ИИ по кулинарному профилю «${tpl.name}»`;
  }

  if (!document.getElementById('customDishName').value.trim()) {
    document.getElementById('customDishName').value = query.charAt(0).toUpperCase() + query.slice(1);
  }
  document.getElementById('customDishPortion').value = portion;
  document.getElementById('customDishKcal100').value = kcal100;
  document.getElementById('customDishP100').value = p100;
  document.getElementById('customDishF100').value = f100;
  document.getElementById('customDishC100').value = c100;
  noteEl.style.display = 'block';
  noteEl.innerHTML = `✨ <strong>ИИ-помощник:</strong> ${escapeHtml(expl)}. Вы можете подправить любое значение ниже.`;
  btn.disabled = false;
  btn.textContent = '✨ Пересчитать с ИИ';
}
