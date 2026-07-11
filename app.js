/* ==========================================================================
   PrepChef AI - Core Application Logic
   ========================================================================== */

// --- Application State ---
const state = {
  apiKey: localStorage.getItem('prepchef_api_key') || '',
  useMockData: localStorage.getItem('prepchef_use_mock') === 'true',
  streak: parseInt(localStorage.getItem('prepchef_streak_count') || '0'),
  lastStreakDate: localStorage.getItem('prepchef_last_streak_date') || '',
  achievements: JSON.parse(localStorage.getItem('prepchef_achievements') || '{}'),
  
  // Current active plan data
  currentPlan: null,
  completedMeals: {
    breakfast: false,
    lunch: false,
    dinner: false
  },
  groceryPrices: {},
  groceryOwned: {}
};

// Target budget limits in Indian Rupees (INR)
const BUDGET_LIMITS = {
  'Low': 250.00,
  'Medium': 600.00,
  'High': 1500.00
};

// --- DOM Elements ---
const elements = {
  plannerForm: document.getElementById('plannerForm'),
  dayDescription: document.getElementById('dayDescription'),
  dietaryPref: document.getElementById('dietaryPref'),
  budgetTier: document.getElementById('budgetTier'),
  allergies: document.getElementById('allergies'),
  generateBtn: document.getElementById('generateBtn'),
  btnText: document.querySelector('#generateBtn .btn-text'),
  spinner: document.querySelector('#generateBtn .spinner'),
  
  // Header / Streaks
  streakCount: document.getElementById('streakCount'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  apiWarning: document.getElementById('apiWarning'),
  setupKeyBtn: document.getElementById('setupKeyBtn'),
  
  // Settings Modal
  settingsModal: document.getElementById('settingsModal'),
  geminiApiKey: document.getElementById('geminiApiKey'),
  useMockDataCheckbox: document.getElementById('useMockData'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  
  // Results Layout
  emptyState: document.getElementById('emptyState'),
  plannerResults: document.getElementById('plannerResults'),
  
  // Progress Bar
  progressPercentage: document.getElementById('progressPercentage'),
  progressBarFill: document.getElementById('progressBarFill'),
  progressSummary: document.getElementById('progressSummary'),
  
  // Meals
  mealCards: {
    breakfast: document.getElementById('meal-breakfast-card'),
    lunch: document.getElementById('meal-lunch-card'),
    dinner: document.getElementById('meal-dinner-card')
  },
  mealCheckboxes: {
    breakfast: document.querySelector('.meal-status-checkbox[data-meal="breakfast"]'),
    lunch: document.querySelector('.meal-status-checkbox[data-meal="lunch"]'),
    dinner: document.querySelector('.meal-status-checkbox[data-meal="dinner"]')
  },
  mealNames: {
    breakfast: document.getElementById('bf-name'),
    lunch: document.getElementById('lh-name'),
    dinner: document.getElementById('dn-name')
  },
  mealDescs: {
    breakfast: document.getElementById('bf-desc'),
    lunch: document.getElementById('lh-desc'),
    dinner: document.getElementById('dn-desc')
  },
  mealTimes: {
    breakfast: document.getElementById('bf-time'),
    lunch: document.getElementById('lh-time'),
    dinner: document.getElementById('dn-time')
  },
  mealCosts: {
    breakfast: document.getElementById('bf-cost'),
    lunch: document.getElementById('lh-cost'),
    dinner: document.getElementById('dn-cost')
  },
  mealStepsLists: {
    breakfast: document.getElementById('bf-steps'),
    lunch: document.getElementById('lh-steps'),
    dinner: document.getElementById('dn-steps')
  },
  
  // Grocery list
  groceryList: document.getElementById('groceryList'),
  groceryCheckCount: document.getElementById('groceryCheckCount'),
  
  // Budget Feasibility elements
  budgetGaugeFill: document.getElementById('budgetGaugeFill'),
  budgetLimitLabel: document.getElementById('budgetLimitLabel'),
  targetBudgetVal: document.getElementById('targetBudgetVal'),
  totalCookCostVal: document.getElementById('totalCookCostVal'),
  budgetRemainingVal: document.getElementById('budgetRemainingVal'),
  feasibilityStatusBadge: document.getElementById('feasibilityStatusBadge'),
  budgetAdvice: document.getElementById('budgetAdvice'),
  
  // Substitutions
  subsContainer: document.getElementById('subsContainer'),
  
  // Achievements
  badges: {
    'first-meal': document.getElementById('badge-first-meal'),
    'streak-3': document.getElementById('badge-streak-3'),
    'budget-saver': document.getElementById('badge-budget-saver'),
    'allergy-safe': document.getElementById('badge-allergy-safe')
  },
  
  // Chef Pierre
  chefComment: document.getElementById('chefComment'),
  
  // Celebration overlay
  celebrationOverlay: document.getElementById('celebrationOverlay'),
  celebrationTitle: document.getElementById('celebrationTitle'),
  celebrationMessage: document.getElementById('celebrationMessage'),
  closeCelebrationBtn: document.getElementById('closeCelebrationBtn')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Load initial settings UI states
  elements.geminiApiKey.value = state.apiKey;
  elements.useMockDataCheckbox.checked = state.useMockData;
  elements.streakCount.textContent = state.streak;
  
  checkApiWarningState();
  renderAchievements();
  
  // Setup Event Listeners
  elements.openSettingsBtn.addEventListener('click', openSettings);
  elements.closeSettingsBtn.addEventListener('click', closeSettings);
  elements.cancelSettingsBtn.addEventListener('click', closeSettings);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.setupKeyBtn.addEventListener('click', openSettings);
  
  elements.plannerForm.addEventListener('submit', handleFormSubmit);
  
  // Meal completion toggles
  Object.keys(elements.mealCheckboxes).forEach(mealKey => {
    elements.mealCheckboxes[mealKey].addEventListener('change', (e) => {
      toggleMealCompletion(mealKey, e.target.checked);
    });
  });
  
  // Celebration close
  elements.closeCelebrationBtn.addEventListener('click', () => {
    elements.celebrationOverlay.classList.add('hidden');
  });
});

// --- Modal & API Key Warning Logic ---
function checkApiWarningState() {
  if (!state.apiKey && !state.useMockData) {
    elements.apiWarning.classList.remove('hidden');
  } else {
    elements.apiWarning.classList.add('hidden');
  }
}

function openSettings() {
  elements.settingsModal.classList.remove('hidden');
}

function closeSettings() {
  elements.settingsModal.classList.add('hidden');
}

function saveSettings() {
  state.apiKey = elements.geminiApiKey.value.trim();
  state.useMockData = elements.useMockDataCheckbox.checked;
  
  localStorage.setItem('prepchef_api_key', state.apiKey);
  localStorage.setItem('prepchef_use_mock', state.useMockData);
  
  closeSettings();
  checkApiWarningState();
  
  // Trigger virtual chef commentary when settings change
  if (state.apiKey) {
    speakChef("Ah! Excellent, your kitchen is now fully powered by Gen AI. Describe your day and let's start cooking!");
  } else if (state.useMockData) {
    speakChef("Running in Demo Mode! I'll serve you pre-crafted recipes so you can check out the streak tracking and budget tools.");
  }
}

// Chef speech balloon animator
function speakChef(message) {
  elements.chefComment.style.opacity = 0;
  setTimeout(() => {
    elements.chefComment.textContent = message;
    elements.chefComment.style.opacity = 1;
  }, 200);
}

// --- Gamification & Streak Logic ---
function updateStreak() {
  const today = new Date().toDateString();
  
  if (state.lastStreakDate === today) {
    // Already did it today, no change
    return;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  
  if (state.lastStreakDate === yesterdayString) {
    // Incremented consecutive day!
    state.streak += 1;
  } else {
    // Broken streak, start at 1
    state.streak = 1;
  }
  
  state.lastStreakDate = today;
  localStorage.setItem('prepchef_streak_count', state.streak.toString());
  localStorage.setItem('prepchef_last_streak_date', state.lastStreakDate);
  elements.streakCount.textContent = state.streak;
  
  // Achievements check
  if (state.streak >= 3) {
    unlockAchievement('streak-3');
  }
}

function unlockAchievement(id) {
  if (state.achievements[id]) return; // Already unlocked
  
  state.achievements[id] = true;
  localStorage.setItem('prepchef_achievements', JSON.stringify(state.achievements));
  renderAchievements();
  
  // Show special celebration
  const badgeNames = {
    'first-meal': 'First Chef 🍳',
    'streak-3': 'Streak Fire 🔥',
    'budget-saver': 'Budget Star 🪙',
    'allergy-safe': 'Safety First 🛡️'
  };
  
  elements.celebrationTitle.textContent = `Achievement Unlocked: ${badgeNames[id]}!`;
  elements.celebrationMessage.textContent = `Wonderful cooking! You've unlocked a new milestone badge. Keep building your consistency!`;
  elements.celebrationOverlay.classList.remove('hidden');
}

function renderAchievements() {
  Object.keys(elements.badges).forEach(key => {
    const badgeEl = elements.badges[key];
    if (state.achievements[key]) {
      badgeEl.classList.remove('locked');
      badgeEl.classList.add(`unlocked-${key.split('-')[0]}`);
    } else {
      badgeEl.classList.add('locked');
      badgeEl.classList.remove(`unlocked-${key.split('-')[0]}`);
    }
  });
}

// --- Plan Generation Handler ---
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const desc = elements.dayDescription.value.trim();
  const diet = elements.dietaryPref.value;
  const budget = elements.budgetTier.value;
  const allergies = elements.allergies.value.trim();
  
  if (!state.apiKey && !state.useMockData) {
    openSettings();
    speakChef("Wait! I need your Gemini API Key or permission to run in Fallback Demo Mode before I can generate a meal plan.");
    return;
  }
  
  // Set Loading UI
  elements.generateBtn.disabled = true;
  elements.btnText.textContent = "Crafting Meal Plan...";
  elements.spinner.classList.remove('hidden');
  speakChef("Let's see... Analyzing your schedule, dietary preferences, and budget constraints to formulate the perfect cooking checklist. One moment...");
  
  try {
    let resultJSON = null;
    
    if (state.useMockData && !state.apiKey) {
      // Simulate API lag
      await new Promise(resolve => setTimeout(resolve, 2000));
      resultJSON = getMockData(desc, diet, budget, allergies);
    } else {
      resultJSON = await callGeminiAPI(desc, diet, budget, allergies);
    }
    
    if (resultJSON) {
      renderPlannerResults(resultJSON, budget);
      
      // Check allergy achievement
      if (allergies.length > 0) {
        unlockAchievement('allergy-safe');
      }
    } else {
      throw new Error("Failed to receive data from Gemini.");
    }
    
  } catch (error) {
    console.error(error);
    speakChef(`Mon Dieu! I hit a snag in the kitchen: ${error.message}. Please check your API key in settings.`);
    alert(`Error: ${error.message}\nIf your API key is invalid, please update it under settings (top right).`);
  } finally {
    elements.generateBtn.disabled = false;
    elements.btnText.textContent = "Generate Meal Plan";
    elements.spinner.classList.add('hidden');
  }
}

// --- API Request to Google Gemini ---
async function callGeminiAPI(dayDesc, dietary, budgetTier, allergies) {
  const targetBudget = BUDGET_LIMITS[budgetTier];
  
  const prompt = `You are an Indian culinary assistant. Generate a cooking to-do list and meal plan for a user based on their day.
  
  USER PROFILE:
  - Day Description: "${dayDesc}"
  - Dietary Preference: ${dietary}
  - Allergies/Exclusions: "${allergies || 'None'}"
  - Daily Budget Limit: ₹${targetBudget} INR
  
  INSTRUCTIONS:
  You must output valid JSON data containing a Breakfast, Lunch, and Dinner plan. The meal selection must match their day's pace (e.g. if they are very busy, Breakfast and Lunch must be extremely fast to make, under 10-15 minutes).
  Each meal must have a specific cost in Indian Rupees (INR), name, cooking steps, and description.
  You must provide a full, structured grocery list of ingredients with estimated individual costs in INR.
  Provide alternative ingredients/substitutions for the dishes (both for allergies and budget-saving alternatives).
  The JSON structure must match this schema EXACTLY:
  {
    "chefComment": "A brief encouragement comment (under 3 sentences) from Chef Pierre speaking about how these meals fit their day's schedule, diet, and budget in India.",
    "meals": {
      "breakfast": {
        "name": "Name of breakfast dish",
        "desc": "Short description of the breakfast",
        "time": "e.g., 10 min",
        "cost": 80.00,
        "steps": ["Step 1...", "Step 2..."]
      },
      "lunch": {
        "name": "Name of lunch dish",
        "desc": "Short description of the lunch",
        "time": "e.g., 15 min",
        "cost": 150.00,
        "steps": ["Step 1...", "Step 2..."]
      },
      "dinner": {
        "name": "Name of dinner dish",
        "desc": "Short description of the dinner",
        "time": "e.g., 30 min",
        "cost": 250.00,
        "steps": ["Step 1...", "Step 2..."]
      }
    },
    "groceries": [
      {"name": "Ingredient name", "price": 45.00, "category": "Dairy/Produce/Pantry..."},
      ...
    ],
    "substitutions": [
      {
        "original": "Name of ingredient to substitute",
        "replacement": "Name of proposed replacement",
        "reason": "Clear explanation of why (e.g., to keep it gluten-free, or to save ₹40)",
        "type": "dietary" // 'dietary' or 'budget'
      }
    ],
    "budgetAdvice": "Brief advice (under 2 sentences) on how the user can stay within their INR budget or optimize ingredients."
  }
  
  Do not include any markdown markup like \`\`\`json outside the content. Output raw JSON string only.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
  }

  const responseData = await response.json();
  const rawText = responseData.candidates[0].content.parts[0].text;
  return JSON.parse(rawText.trim());
}

// --- Render Planning Results ---
function renderPlannerResults(plan, budgetTier) {
  state.currentPlan = plan;
  
  // Set Chef Pierre speech
  speakChef(plan.chefComment);
  
  // Reset completed states
  state.completedMeals = { breakfast: false, lunch: false, dinner: false };
  state.groceryPrices = {};
  state.groceryOwned = {};
  
  elements.mealCheckboxes.breakfast.checked = false;
  elements.mealCheckboxes.lunch.checked = false;
  elements.mealCheckboxes.dinner.checked = false;
  
  // Render Meals
  renderMeal('breakfast', plan.meals.breakfast);
  renderMeal('lunch', plan.meals.lunch);
  renderMeal('dinner', plan.meals.dinner);
  
  // Render Groceries
  renderGroceries(plan.groceries);
  
  // Render Substitutions
  renderSubstitutions(plan.substitutions);
  
  // Update budget calculations
  updateBudgetCalculation(budgetTier);
  
  // Update progress tracker
  updateProgressTracker();
  
  // Reveal Results Panel
  elements.emptyState.classList.add('hidden');
  elements.plannerResults.classList.remove('hidden');
  
  // Re-run Lucide
  lucide.createIcons();
  
  // Scroll to results
  elements.plannerResults.scrollIntoView({ behavior: 'smooth' });
}

function renderMeal(mealKey, mealData) {
  elements.mealNames[mealKey].textContent = mealData.name;
  elements.mealDescs[mealKey].textContent = mealData.desc;
  elements.mealTimes[mealKey].textContent = mealData.time;
  elements.mealCosts[mealKey].textContent = mealData.cost.toFixed(2);
  
  // Render checklist steps
  const stepsList = elements.mealStepsLists[mealKey];
  stepsList.innerHTML = '';
  
  mealData.steps.forEach((step, idx) => {
    const li = document.createElement('li');
    li.className = 'checklist-step-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${mealKey}-step-${idx}`;
    
    const label = document.createElement('label');
    label.htmlFor = `${mealKey}-step-${idx}`;
    label.textContent = step;
    
    li.appendChild(checkbox);
    li.appendChild(label);
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        li.classList.add('checked');
      } else {
        li.classList.remove('checked');
      }
      checkMealStepsStatus(mealKey);
    });
    
    stepsList.appendChild(li);
  });
  
  // Ensure card style is clean
  elements.mealCards[mealKey].classList.remove('completed-meal-card');
}

function renderGroceries(groceries) {
  elements.groceryList.innerHTML = '';
  
  groceries.forEach((item, idx) => {
    state.groceryPrices[idx] = item.price;
    state.groceryOwned[idx] = false;
    
    const li = document.createElement('li');
    li.className = 'grocery-item';
    li.id = `grocery-item-${idx}`;
    
    const leftDiv = document.createElement('div');
    leftDiv.className = 'grocery-item-left';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `grocery-check-${idx}`;
    checkbox.checked = false;
    
    checkbox.addEventListener('change', (e) => {
      state.groceryOwned[idx] = e.target.checked;
      if (e.target.checked) {
        li.classList.add('checked');
      } else {
        li.classList.remove('checked');
      }
      updateBudgetCalculation(elements.budgetTier.value);
      updateGroceryHeaderCount();
    });
    
    const nameWrapper = document.createElement('div');
    nameWrapper.className = 'grocery-name-wrapper';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'grocery-name';
    nameSpan.textContent = item.name;
    
    const catSpan = document.createElement('span');
    catSpan.className = 'grocery-cat';
    catSpan.textContent = item.category;
    
    nameWrapper.appendChild(nameSpan);
    nameWrapper.appendChild(catSpan);
    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(nameWrapper);
    
    const rightDiv = document.createElement('div');
    rightDiv.className = 'grocery-item-right';
    rightDiv.textContent = '₹';
    
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.step = '1';
    priceInput.min = '0';
    priceInput.className = 'grocery-price-input';
    priceInput.value = item.price.toFixed(2);
    
    priceInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      state.groceryPrices[idx] = val;
      updateBudgetCalculation(elements.budgetTier.value);
    });
    
    rightDiv.appendChild(priceInput);
    li.appendChild(leftDiv);
    li.appendChild(rightDiv);
    
    elements.groceryList.appendChild(li);
  });
  
  updateGroceryHeaderCount();
}

function updateGroceryHeaderCount() {
  const total = Object.keys(state.groceryOwned).length;
  const checked = Object.values(state.groceryOwned).filter(v => v).length;
  elements.groceryCheckCount.textContent = `${checked}/${total} owned`;
}

function renderSubstitutions(subs) {
  elements.subsContainer.innerHTML = '';
  
  if (!subs || subs.length === 0) {
    elements.subsContainer.innerHTML = '<p class="subtitle" style="text-align:center;">No substitutions needed for this plan.</p>';
    return;
  }
  
  subs.forEach(sub => {
    const item = document.createElement('div');
    item.className = 'sub-item';
    
    const header = document.createElement('div');
    header.className = 'sub-item-header';
    
    const original = document.createElement('span');
    original.className = 'sub-item-original';
    original.textContent = sub.original;
    
    const dir = document.createElement('span');
    dir.className = 'sub-item-direction';
    dir.innerHTML = `<i data-lucide="arrow-right"></i> ${sub.type === 'budget' ? 'Budget Choice' : 'Diet Choice'}`;
    
    header.appendChild(original);
    header.appendChild(dir);
    
    const replacement = document.createElement('span');
    replacement.className = 'sub-item-replacement';
    replacement.textContent = sub.replacement;
    
    const reason = document.createElement('p');
    reason.className = 'sub-item-reason';
    reason.textContent = sub.reason;
    
    item.appendChild(header);
    item.appendChild(replacement);
    item.appendChild(reason);
    
    elements.subsContainer.appendChild(item);
  });
}

// --- Dynamic Budget Feasibility Calculator ---
function updateBudgetCalculation(budgetTier) {
  const limit = BUDGET_LIMITS[budgetTier];
  
  // Calculate total cost: sum of grocery items NOT checked (meaning user needs to buy them)
  let totalCost = 0;
  Object.keys(state.groceryPrices).forEach(idx => {
    if (!state.groceryOwned[idx]) {
      totalCost += state.groceryPrices[idx];
    }
  });
  
  // Render limits and values
  elements.budgetLimitLabel.textContent = `Limit: ₹${limit.toFixed(2)}`;
  elements.targetBudgetVal.textContent = `₹${limit.toFixed(2)}`;
  elements.totalCookCostVal.textContent = `₹${totalCost.toFixed(2)}`;
  
  const diff = limit - totalCost;
  if (diff >= 0) {
    elements.budgetRemainingVal.textContent = `+₹${diff.toFixed(2)}`;
    elements.budgetRemainingVal.style.color = 'var(--success)';
    
    elements.feasibilityStatusBadge.className = 'feasibility-status-badge under-budget';
    elements.feasibilityStatusBadge.innerHTML = '<i data-lucide="check-circle-2"></i> Within Budget';
    
    if (state.currentPlan) {
      elements.budgetAdvice.textContent = state.currentPlan.budgetAdvice;
    }
  } else {
    elements.budgetRemainingVal.textContent = `-₹${Math.abs(diff).toFixed(2)}`;
    elements.budgetRemainingVal.style.color = 'var(--danger)';
    
    elements.feasibilityStatusBadge.className = 'feasibility-status-badge over-budget';
    elements.feasibilityStatusBadge.innerHTML = '<i data-lucide="alert-triangle"></i> Over Budget Limit';
    
    elements.budgetAdvice.textContent = "Tip: Check off ingredients you already have in stock, or select cheaper ingredient replacements from the Substitutes panel below.";
  }
  
  // Update gauge bar
  const ratio = Math.min(totalCost / limit, 1.2); // Cap gauge at 120%
  const pct = ratio * 100;
  elements.budgetGaugeFill.style.width = `${pct}%`;
  
  if (ratio <= 0.8) {
    elements.budgetGaugeFill.style.backgroundColor = 'var(--success)';
  } else if (ratio <= 1.0) {
    elements.budgetGaugeFill.style.backgroundColor = 'var(--accent-orange)';
  } else {
    elements.budgetGaugeFill.style.backgroundColor = 'var(--danger)';
  }
  
  lucide.createIcons();
}

// --- Meal & Checklist Completion Logic ---
function checkMealStepsStatus(mealKey) {
  const stepsList = elements.mealStepsLists[mealKey];
  const checkboxes = stepsList.querySelectorAll('input[type="checkbox"]');
  
  if (checkboxes.length === 0) return;
  
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  
  // Sync the main meal header checkbox
  if (allChecked !== elements.mealCheckboxes[mealKey].checked) {
    elements.mealCheckboxes[mealKey].checked = allChecked;
    toggleMealCompletion(mealKey, allChecked, false); // Don't re-trigger step sync
  }
}

function toggleMealCompletion(mealKey, isComplete, syncSteps = true) {
  state.completedMeals[mealKey] = isComplete;
  
  const card = elements.mealCards[mealKey];
  if (isComplete) {
    card.classList.add('completed-meal-card');
    card.style.borderColor = 'var(--success)';
    
    // Automatically check all step checkboxes if synced from header
    if (syncSteps) {
      const stepsList = elements.mealStepsLists[mealKey];
      stepsList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        cb.parentElement.classList.add('checked');
      });
    }
    
    // Show quick mini alert from Pierre
    speakChef(`Magnifique! You checked off cooking ${mealKey}. Smells delicious!`);
    
    // Check first meal achievement
    unlockAchievement('first-meal');
  } else {
    card.classList.remove('completed-meal-card');
    card.style.borderColor = 'var(--border-glass)';
    
    if (syncSteps) {
      const stepsList = elements.mealStepsLists[mealKey];
      stepsList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.parentElement.classList.remove('checked');
      });
    }
  }
  
  updateProgressTracker();
}

function updateProgressTracker() {
  const meals = Object.values(state.completedMeals);
  const completedCount = meals.filter(v => v).length;
  const pct = Math.round((completedCount / 3) * 100);
  
  elements.progressPercentage.textContent = `${pct}%`;
  elements.progressBarFill.style.width = `${pct}%`;
  elements.progressSummary.textContent = `${completedCount} out of 3 meals completed. Finish them to keep your streak alive!`;
  
  if (completedCount === 3) {
    // Lock in streak for today!
    updateStreak();
    
    // Check budget saver achievement
    const totalCost = parseFloat(elements.totalCookCostVal.textContent.replace('₹', ''));
    const limit = BUDGET_LIMITS[elements.budgetTier.value];
    if (totalCost <= limit) {
      unlockAchievement('budget-saver');
    }
    
    // Show full completion overlay
    elements.celebrationTitle.textContent = "Daily Cooking Goals Completed! 🎉";
    elements.celebrationMessage.textContent = `Magnificent kitchen work today! You completed Breakfast, Lunch, and Dinner. Your streak has been updated to ${state.streak} ${state.streak === 1 ? 'day' : 'days'}!`;
    elements.celebrationOverlay.classList.remove('hidden');
  }
}

// --- Sandbox Mock Data Generation in INR ---
function getMockData(dayDesc, dietary, budgetTier, allergies) {
  const isVegan = dietary === 'Vegan';
  const isVeg = dietary === 'Vegetarian' || isVegan;
  
  // Custom Indian mock data templates
  return {
    "chefComment": `Namaste! Chef Pierre here. I see your schedule is busy (${dayDesc.substring(0, 30)}...). I planned a fast, satisfying Indian ${dietary} meal plan that stays well within your ₹${budgetTier} budget. Chalo, let's cook!`,
    "meals": {
      "breakfast": {
        "name": isVeg ? "Masala Oats Poha with Peas" : "Double Egg Masala Omelette",
        "desc": isVeg ? "Quick flattened rice flakes cooked with steamed green peas, roasted peanuts, turmeric, and fresh curry leaves." : "Double eggs whisked with diced onions, tomatoes, green chillies, and Indian spices, pan-cooked to gold.",
        "time": "10 min",
        "cost": 60.00,
        "steps": [
          isVeg ? "Wash poha and set aside. Sauté mustard seeds, peanuts, and curry leaves." : "Whisk two eggs with chopped onions, green chillies, tomatoes, salt, and red chilli powder.",
          isVeg ? "Add onions, turmeric, peas, and poha; stir gently on low heat for 3 minutes." : "Pour egg batter onto a hot buttered tawa, cook both sides until golden brown.",
          "Garnish with chopped coriander and lemon juice. Serve hot."
        ]
      },
      "lunch": {
        "name": isVeg ? "Paneer Bhurji & Roti Wrap" : "Egg Bhurji & Wholewheat Wrap",
        "desc": isVeg ? "Spiced scrambled cottage cheese (paneer) cooked with green chillies, ginger, tomatoes, rolled in a fresh soft roti." : "Spiced scrambled eggs tossed with chopped onions and capsicum, rolled in a warm wholewheat wrap.",
        "time": "12 min",
        "cost": 120.00,
        "steps": [
          "Heat ghee in a pan; sauté chopped onions, ginger-garlic paste, and green chillies.",
          isVeg ? "Add tomatoes and turmeric, then crumble fresh paneer into the pan; cook for 4 minutes." : "Break eggs into the sautéed mixture, cook on medium heat until scrambled.",
          "Warm the roti/tortilla on tawa, stuff with the bhurji, wrap tightly and serve."
        ]
      },
      "dinner": {
        "name": isVeg ? "One-Pot Creamy Dal Khichdi" : "Quick Chicken Keema & Paratha",
        "desc": isVeg ? "Nutritious comfort bowl of yellow moong lentils and rice simmered with cumin, garlic, and ghee tempering." : "Fragrant minced chicken cooked with onions, tomatoes, peas, and spice blends, served with soft paratha.",
        "time": "20 min",
        "cost": 220.00,
        "steps": [
          "Wash rice and lentils. Pressure cook them together with turmeric and salt.",
          isVeg ? "In a pan, prepare tadka with ghee, cumin seeds, garlic cloves, and a pinch of asafoetida." : "Sauté minced chicken (keema) with chopped onions, tomato puree, ginger-garlic, and garam masala.",
          "Combine cooked grains with tadka or plate hot chicken keema alongside warm parathas."
        ]
      }
    },
    "groceries": [
      {"name": isVeg ? "Fresh Paneer (Cottage Cheese)" : "Farm Eggs (12 pcs)", "price": 90.00, "category": "Dairy"},
      {"name": "Whole Wheat Roti/Paratha Pack", "price": 60.00, "category": "Bakery"},
      {"name": "Poha (Flattened Rice)", "price": 40.00, "category": "Pantry"},
      {"name": isVeg ? "Yellow Moong Dal" : "Minced Chicken (Keema)", "price": 180.00, "category": isVeg ? "Pantry" : "Meat"},
      {"name": "Onions & Tomatoes Bunch", "price": 50.00, "category": "Produce"},
      {"name": "Green Peas & Coriander Leaves", "price": 40.00, "category": "Produce"},
      {"name": "Ghee (Clarified Butter)", "price": 80.00, "category": "Dairy"}
    ],
    "substitutions": [
      {
        "original": "Whole Wheat Roti",
        "replacement": "Gluten-Free Amaranth Roti",
        "reason": "Perfect swap to accommodate wheat or gluten allergies.",
        "type": "dietary"
      },
      {
        "original": "Paneer / Keema",
        "replacement": "Soya Chunks or Green Moong",
        "reason": "Swapping specialty protein for high-protein soya chunks saves ₹120.00.",
        "type": "budget"
      }
    ],
    "budgetAdvice": `Buying loose local vegetables and swapping packaged paneer for home-set chenna or tofu can trim ₹100 off your list today!`
  };
}
