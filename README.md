# 🍔 BiteBudget: AI Cooking To-Do List & Fridge Scanner

BiteBudget is a premium, responsive, full-stack AI micro-app designed to help you plan your daily meals based on your schedule, check ingredient matches from your fridge using image recognition, keep track of daily out-of-pocket costs, and walk you through recipes with step-by-step cooking timers.

---

## ✨ Features

- **Fridge & Pantry Scanner**: Upload a picture or take a snapshot with your device's camera. BiteBudget uses the multimodal Gemini API (`gemini-2.0-flash` or `gemini-1.5-flash`) to detect ingredients in stock.
- **Schedule-Aligned Meal Planner**: Specify your daily budget, routine level (Relaxed, Active, or Busy Rush), dietary preferences, and allergens. BiteBudget generates custom Breakfast, Lunch, and Dinner plans.
- **Budget Feasibility Indicators**: Compares estimated grocery costs to your daily limit using a dynamic circular progress gauge.
- **Out-of-Pocket Grocery List & Substitutions**: View missing ingredients with estimated costs and toggle cheaper alternatives to bring your meal prep costs under budget.
- **Step-by-Step Cooking Checklist**: Follow interactive checkboxes with built-in countdown timers and Web Audio API audio chimes for timed steps.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (via `@tailwindcss/vite`), Lucide Icons.
- **Backend (API Proxy)**: Express.js (protects the Gemini API Key from client exposure).
- **AI Engine**: Google Gen AI SDK (`@google/genai` v2.4.0) connecting to Gemini models.

---

## 🚀 Run Locally

### Prerequisites
Make sure you have Node.js (v18+) installed.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aprameya-C-V/bitebudget.git
   cd bitebudget
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key"
   ```

4. **Launch development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Run the test suite**:
   ```bash
   npm run test
   ```

---

## 🌐 Deploy to the Web

Since this is a full-stack Express + React application, you can deploy it to any cloud host supporting Node.js.

### Option A: Render (Recommended & Free Tier)
1. Sign up on [Render.com](https://render.com) and link your GitHub account.
2. Click **New +** and select **Web Service**.
3. Link your `bitebudget` repository.
4. Set the following build settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
5. Click **Advanced**, add the environment variable:
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
6. Click **Deploy Web Service**. Render will compile the frontend and host the backend server.

### Option B: Railway
1. Go to [Railway.app](https://railway.app) and create a project.
2. Select **Deploy from GitHub repo** and choose `bitebudget`.
3. Go to **Variables** and add `GEMINI_API_KEY`.
4. Railway will automatically detect the `package.json` scripts and deploy the service.
