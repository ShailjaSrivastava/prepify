# PrepChef AI - Personal Cooking To-Do List & Meal Planner

PrepChef AI is a premium, interactive web-based micro-app designed to help users generate a personalized cooking to-do list based on the flow of their day. By combining daily schedule constraints with dietary preferences, allergies, and budget tiers, the app generates a tailored Breakfast, Lunch, and Dinner lineup alongside an itemized grocery list, ingredient substitutions, and a live budget feasibility calculator.

To encourage consistency and turn daily cooking into a habit, the app implements interactive gamification elements: an interactive cooking task checklist, daily streak counters, unlockable cooking achievement badges, and real-time coaching feedback from an animated "Virtual Chef" mascot (Chef Pierre).

---

## 🌟 Core Features

### 1. Day-Synced Meal Planning Flow
- **Daily Pace Adaptation**: Analyzes the description of the user's day (e.g. "packed with back-to-back meetings" or "relaxing Sunday") to select appropriate dishes. Busy days receive speed-focused meals (10–15 min prep), while relaxed schedules allow for gourmet selections.
- **Dietary & Safety Profiling**: Explicit options for Veg, Vegan, and Non-Veg diets, with text inputs for specific allergies (e.g. peanuts, dairy) or dislikes (e.g. no cilantro).
- **Budget Tier Selection**: Supports Low, Standard, and Gourmet budget limits to scope the generated list.

### 2. Interactive Cooking To-Do Lists
- **Checklist Syncing**: Step-by-step instructions for each meal with checkboxes. Checking steps automatically updates the meal state, and checking the main meal tags checks off its child steps.
- **Visual Progress Bar**: A live percentage progress bar tracking daily meal completion. Completing all 3 meals unlocks daily streak rewards.

### 3. Dynamic Budget Feasibility Calculator
- **Interactive Prices**: The shopping list displays estimated item costs in input fields. Users can edit these prices on-the-fly to match their actual store prices.
- **In-Stock Checkoff**: Checking off ingredients that are already in the user's pantry removes them from the "Total Cook Cost" total.
- **Color-Coded Budget Gauge**: A progress bar showing current expenses against the budget cap (Green = Safe, Yellow = Near limit, Red = Over budget).
- **Dietary & Budget Substitutes**: Alternative options based on allergies or to save money.

### 4. Gamified Consistency Builder
- **Daily Streak Counter**: Tracks consecutive cooking days using local storage calendar calculations.
- **Milestone Achievements**: Unlockable badges like **First Chef** (first meal completed), **Streak Fire** (3-day streak), **Budget Star** (plan completed within budget), and **Safety First** (allergy-safe generation).
- **Chef Pierre Commentary**: Dynamic bubbles from the virtual chef reacting to inputs, completions, settings changes, and budget updates.

---

## 🤖 Gen AI Services Utilized

PrepChef AI utilizes the **Google Gemini 2.5 Flash** model via the official Google Generative Language API endpoint.

### Where Gen AI is Utilized in the Code:
- **Location**: Found in [`app.js:callGeminiAPI()`](file:///c:/Users/Mohan/OneDrive/Desktop/Shailja/ShailjaAI/AntiGravity/h2spw1/app.js).
- **Input Variables**: Takes the user's day schedule, dietary preference, allergies list, and selected budget ceiling.
- **Dynamic Decision Making**: Gemini analyzes the user's day's schedule intensity to balance cooking times, filters out all specified allergens from the recipe ingredients, structures matching grocery items, and suggests logical substitutions (e.g., swapping flour for almond meal if gluten-free is entered, or swapping steak for pork/tofu to meet a low-budget cap).
- **Structured JSON Integration**: Calls the API using `generationConfig: { responseMimeType: "application/json" }` to guarantee a clean JSON payload parsing.
- **Virtual Persona Creation**: Generates contextual encouragement comments for Chef Pierre tailored to the user's day description.

---

## 🛠️ How to Run & Test Locally

PrepChef AI is built as a client-side single-page application using **HTML5, Vanilla CSS3 (custom variables + animations), and Vanilla ES6 JavaScript**.

1. Clone or download this project folder.
2. Double-click [index.html](file:///c:/Users/Mohan/OneDrive/Desktop/Shailja/ShailjaAI/AntiGravity/h2spw1/index.html) to launch it in any web browser, or serve it using a local server (e.g. `npx serve .` or VS Code Live Server).
3. Click the **Settings Icon (⚙️)** in the top-right header:
   - **Real API Calls**: Paste your Google Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/)) and click **Save Changes**.
   - **Sandbox/Demo Mode**: If you do not have an API key, check the **Allow Fallback to Demo Data** toggle. This lets you test the app's budget calculations, checkboxes, streaks, and achievements using rich, high-fidelity sample plans.
4. Input details about your day, choose your parameters, and click **Generate Meal Plan**!
