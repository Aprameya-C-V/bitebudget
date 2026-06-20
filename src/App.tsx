import React, { useState, useEffect } from "react";
import { UserSchedule, Meal, MissingGrocery, MealPlanResponse } from "./types";
import ScheduleInput from "./components/ScheduleInput";
import FridgeScanner from "./components/FridgeScanner";
import MealPlanViewer from "./components/MealPlanViewer";
import SubstitutionsPanel from "./components/SubstitutionsPanel";
import CookTodo from "./components/CookTodo";
import { formatCurrency, calculateSimulatedSpent } from "./utils/budget";
import { ShieldAlert, Sparkles, ChefHat, Trash2, Sliders, PlayCircle, Loader2 } from "lucide-react";

export default function App() {
  // 1. Initial State Definitions
  const [schedule, setSchedule] = useState<UserSchedule>({
    activityLevel: "moderate",
    dietaryPreference: "None",
    dailyBudget: 40,
    notes: ""
  });

  const [inventory, setInventory] = useState<string[]>(["Eggs", "Avocado", "Spinach", "Bread"]);
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [activeSwaps, setActiveSwaps] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // 2. Local State Restoration from LocalStorage on mount
  useEffect(() => {
    try {
      const savedSchedule = localStorage.getItem("bb_schedule");
      const savedInventory = localStorage.getItem("bb_inventory");
      const savedMealPlan = localStorage.getItem("bb_mealplan");
      const savedSwaps = localStorage.getItem("bb_swaps");

      if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
      if (savedInventory) setInventory(JSON.parse(savedInventory));
      if (savedMealPlan) {
        const parsedPlan = JSON.parse(savedMealPlan) as MealPlanResponse;
        setMealPlan(parsedPlan);
        // Default to breakfast if loaded
        if (parsedPlan.meals && parsedPlan.meals.length > 0) {
          setSelectedMeal(parsedPlan.meals[0]);
        }
      }
      if (savedSwaps) setActiveSwaps(JSON.parse(savedSwaps));
    } catch (e) {
      console.warn("Unable to reconstruct localStorage entries:", e);
    }

    // Check secure background server connection key state
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(!!data.hasApiKey);
      })
      .catch((err) => {
        console.warn("Backend configuration endpoint unreachable:", err);
      });
  }, []);

  // 3. LocalState Sync Updates
  const saveSchedule = (newSchedule: UserSchedule) => {
    setSchedule(newSchedule);
    localStorage.setItem("bb_schedule", JSON.stringify(newSchedule));
  };

  const saveInventory = (newInventory: string[]) => {
    setInventory(newInventory);
    localStorage.setItem("bb_inventory", JSON.stringify(newInventory));
  };

  const handleToggleSwap = (name: string) => {
    const updated = {
      ...activeSwaps,
      [name]: !activeSwaps[name],
    };
    setActiveSwaps(updated);
    localStorage.setItem("bb_swaps", JSON.stringify(updated));
  };

  // 4. API Event: Call backend to suggest complete thifty custom plan
  const generateBudgetMealPlan = async () => {
    setIsLoading(true);
    setErrorStatus(null);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule,
          inventory
        }),
      });

      const outcome = await response.json();
      if (outcome.success && outcome.data) {
        const payload = outcome.data as MealPlanResponse;
        setMealPlan(payload);
        localStorage.setItem("bb_mealplan", JSON.stringify(payload));
        
        // Reset active swaps list
        const initialSwaps: Record<string, boolean> = {};
        payload.missingGroceries.forEach((item) => {
          initialSwaps[item.name] = false;
        });
        setActiveSwaps(initialSwaps);
        localStorage.setItem("bb_swaps", JSON.stringify(initialSwaps));

        // Select Breakfast meal as active workspace item by default
        if (payload.meals && payload.meals.length > 0) {
          setSelectedMeal(payload.meals[0]);
        }
      } else {
        throw new Error(outcome.error || "The model was unable to suggest a recipe set.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Failed to organize budget plan.");
      triggerFallbackMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Safe fallback mock generator if API key lacks credits on runtime
  const triggerFallbackMockData = () => {
    const mockData: MealPlanResponse = {
      meals: [
        {
          mealType: "Breakfast",
          recipeName: "Avocado Toast with Steamed Eggs",
          description: "Creamy avocado mash seasoned with salt and pepper over toasted artisanal bread, paired with half-sliced soft steamed eggs.",
          prepTime: 5,
          cookTime: 5,
          estimatedCost: 2.50,
          ingredientsRequired: ["1 slice Bread", "1/2 ripe Avocado", "2 medium Eggs", "Pinch of salt & pepper"],
          simpleIngredients: ["bread", "avocado", "egg", "salt"],
          instructions: [
            { step: 1, instruction: "Place bread inside toasting rack and warm to light crisp golden brown.", durationSeconds: 120 },
            { step: 2, instruction: "Boil water and steam the eggs on steam rack or pan fry as preferred.", durationSeconds: 300 },
            { step: 3, instruction: "Halve avocado, mash lightly, spread evenly on bread, top with eggs, and season.", durationSeconds: 0 }
          ],
          substitutions: [
            { original: "ripe Avocado", replacement: "Canned Butter beans mash", costDifference: 1.20 }
          ]
        },
        {
          mealType: "Lunch",
          recipeName: "Pantry Protein Chicken & Spinach Penne",
          description: "Fresh protein and antioxidant boost using tender chicken pan strips tossed on garlic oil pasta.",
          prepTime: 10,
          cookTime: 12,
          estimatedCost: 4.80,
          ingredientsRequired: ["150g Penne pasta", "100g Chicken breast strips", "1 cup packed Spinach", "1 clove minced Garlic"],
          simpleIngredients: ["pasta", "chicken breast", "spinach", "garlic"],
          instructions: [
            { step: 1, instruction: "Boil salted water in main pot and boil penne to tender al dente.", durationSeconds: 600 },
            { step: 2, instruction: "Pan sauté chicken breast strips with garlic in oil until internal meat turns fully cooked brown.", durationSeconds: 300 },
            { step: 3, instruction: "Toss pasta, spinach, and chicken together in low heat heat for 1 minute until spinach wilt.", durationSeconds: 60 }
          ],
          substitutions: [
            { original: "Chicken breast strips", replacement: "Pan-fried Extra Firm Tofu", costDifference: 1.80 }
          ]
        },
        {
          mealType: "Dinner",
          recipeName: "Antioxidant Roasted Tomato Rice Bowl",
          description: "Warm jasmine rice bed topped with charred sweet tomatoes, sweet onion glaze, and avocado garnish.",
          prepTime: 8,
          cookTime: 15,
          estimatedCost: 3.10,
          ingredientsRequired: ["1 cup Jasmine rice", "2 medium Tomatoes diced", "1/2 red Onion sliced", "1 Avocado slice"],
          simpleIngredients: ["rice", "tomato", "onion", "avocado"],
          instructions: [
            { step: 1, instruction: "Cook jasmine rice in small rice cooker or medium pot until soft fluffy rise.", durationSeconds: 900 },
            { step: 2, instruction: "Toss diced tomatoes and onions on cast iron pan over medium-high heat until caramelized skin.", durationSeconds: 300 },
            { step: 3, instruction: "Spoon roasted tomato toppings over warm rice bowl, finish with fresh avocado slices and greens.", durationSeconds: 0 }
          ],
          substitutions: [
            { original: "Jasmine rice", replacement: "Cracked Brown rice", costDifference: 0.50 }
          ]
        }
      ],
      missingGroceries: [
        { name: "Organic Penne Pasta", quantity: "1 box (450g)", estimatedCost: 1.99, substitutionSuggestion: "Store brand macaroni box", cheaperSubstitutionCost: 0.99 },
        { name: "Fresh Garlic head", quantity: "1 bulb", estimatedCost: 0.99 },
        { name: "Jasmine White Rice", quantity: "1 small sack (1kg)", estimatedCost: 3.49, substitutionSuggestion: "Bulk white rice bag", cheaperSubstitutionCost: 2.49 }
      ],
      totalEstimatedCost: 6.47,
      spendingRecommendation: "Excellent setup! You are fully leveraging your Eggs, Avocado, and Spinach. By choosing cheaper store brand dry goods alternative swaps, we shaved off $2.00 to keep you comfortably under limit."
    };

    setMealPlan(mockData);
    localStorage.setItem("bb_mealplan", JSON.stringify(mockData));
    
    const initialSwaps: Record<string, boolean> = {};
    mockData.missingGroceries.forEach((item) => {
      initialSwaps[item.name] = false;
    });
    setActiveSwaps(initialSwaps);
    localStorage.setItem("bb_swaps", JSON.stringify(initialSwaps));
    setSelectedMeal(mockData.meals[0]);
    setErrorStatus("Offline sandbox mode enabled with locally simulated meal recipes.");
    setTimeout(() => setErrorStatus(null), 8000);
  };

  // 5. Dynamic Math calculation for budget updates
  const baseCost = mealPlan?.totalEstimatedCost || 0;
  const missingItemsList = mealPlan?.missingGroceries || [];
  const simulatedCost = calculateSimulatedSpent(baseCost, missingItemsList, activeSwaps);

  return (
    <div
      id="app-container"
      className="min-h-screen text-slate-100 font-sans pb-16 selection:bg-violet-500/30"
      style={{
        background: "linear-gradient(135deg, #0b0f19 0%, #030712 100%)",
      }}
    >

      {/* Header section */}
      <header className="border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md sticky top-0 z-50 bg-slate-950/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black font-display text-xl shadow-lg shadow-violet-500/20 border border-violet-500/30">
              B
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
                BiteBudget
                <span className="text-[10px] uppercase font-mono bg-violet-600/20 border border-violet-500/30 text-violet-400 px-2 py-0.5 rounded-full font-bold">
                  AI Chef Coach
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">To-Do Cooking checklist, fridge image analyzer, &amp; thrifty planner</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Local Target Budget</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">${schedule.dailyBudget}.00 USD/day</span>
            </div>
            {mealPlan && (
              <button
                id="reset-plan-btn"
                onClick={() => {
                  setMealPlan(null);
                  setSelectedMeal(null);
                  setActiveSwaps({});
                  localStorage.removeItem("bb_mealplan");
                  localStorage.removeItem("bb_swaps");
                }}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 transition-colors cursor-pointer"
              >
                Reset Planner
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 flex flex-col gap-8">
        
        {/* Error notification banner if any */}
        {errorStatus && (
          <div
            id="error-banner"
            className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs flex gap-3 items-center leading-relaxed"
          >
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex-1">
              <strong>Offline Mode Activated</strong>: {errorStatus}
            </div>
            <button
              onClick={() => setErrorStatus(null)}
              className="text-[10px] uppercase tracking-wider font-mono px-2 py-1 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Desktop Split view or standard vertical sequence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Input Controls & Scan Module) - Takes 4 spans */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <ScheduleInput
              schedule={schedule}
              onChange={saveSchedule}
              onGenerate={generateBudgetMealPlan}
              isLoading={isLoading}
              hasApiKey={hasApiKey}
            />

            <FridgeScanner
              inventory={inventory}
              onChange={saveInventory}
            />
          </div>

          {/* Right Column (Meal Plan Results, Substitution Swap, Checkout, Cooking Workspace) - 8 spans */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {isLoading ? (
              <div
                id="loading-stage"
                className="h-96 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center bg-slate-900/10"
              >
                <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-4" />
                <h3 className="text-md font-bold text-white font-display">Tuning AI Chef Assistant</h3>
                <p className="text-xs text-slate-450 max-w-xs mt-1">
                  Synthesizing nutritional parameters, identifying ingredient matches, and evaluating grocery prices...
                </p>
                <div className="mt-4 flex gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            ) : mealPlan ? (
              <div className="flex flex-col gap-8 animate-fade-in">
                
                {/* Planned meal list and budget circular gage */}
                <MealPlanViewer
                  meals={mealPlan.meals}
                  missingGroceries={mealPlan.missingGroceries}
                  inventory={inventory}
                  dailyBudget={schedule.dailyBudget}
                  simulatedCost={simulatedCost}
                  onSelectMeal={setSelectedMeal}
                  selectedMeal={selectedMeal}
                  spendingRecommendation={mealPlan.spendingRecommendation}
                />

                {/* Substitutions swap selection panel & dynamic math indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SubstitutionsPanel
                    missingGroceries={mealPlan.missingGroceries}
                    activeSwaps={activeSwaps}
                    onToggleSwap={handleToggleSwap}
                    baseTotalCost={baseCost}
                    simulatedCost={simulatedCost}
                    dailyBudget={schedule.dailyBudget}
                  />

                  {/* Cooking todo list checklists and countdown step timer widgets */}
                  <CookTodo
                    meal={selectedMeal}
                  />
                </div>

              </div>
            ) : (
              <div
                id="welcome-dashboard"
                className="rounded-2xl p-8 border border-dashed border-white/10 bg-slate-900/20 text-center flex flex-col items-center justify-center py-20 gap-5"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/30">
                  <Sparkles className="w-8 h-8 text-violet-400" />
                </div>

                <div className="max-w-md">
                  <h3 className="text-xl font-bold font-display text-white tracking-tight">
                    Your Personalized Budget Culinary Command Center
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Set your target budget limit, scan items inside your fridge using your camera or uploader, and trigger our Gemini meal generation engine to outline Breakfast, Lunch, and Dinner.
                  </p>
                </div>

                <button
                  id="welcome-simulate-btn"
                  onClick={triggerFallbackMockData}
                  className="px-5 py-2.5 rounded-xl border border-violet-500/30 bg-violet-950/15 text-violet-300 hover:bg-violet-950/35 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-500/5 hover:-translate-y-0.5"
                >
                  <PlayCircle className="w-4 h-4" />
                  Explore with local meal simulator
                </button>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Decorative background visual ambient glows */}
      <div className="fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none animate-float-slow" />
      <div className="fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none animate-float-slow-reverse" />
      <div className="fixed top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-fuchsia-600/5 blur-[180px] pointer-events-none animate-float-slow" style={{ animationDelay: "-5s" }} />
    </div>
  );
}
