import React from "react";
import { Meal, MissingGrocery } from "../types";
import { formatCurrency, calculatePercentage, getBudgetStatus } from "../utils/budget";
import { isIngredientMatched } from "../utils/ingredients";
import { CheckCircle2, Clock, AlertCircle, Sparkles, BookOpen } from "lucide-react";

interface MealPlanViewerProps {
  meals: Meal[];
  missingGroceries: MissingGrocery[];
  inventory: string[];
  dailyBudget: number;
  simulatedCost: number;
  onSelectMeal: (meal: Meal) => void;
  selectedMeal: Meal | null;
  spendingRecommendation: string;
}

export default function MealPlanViewer({
  meals,
  missingGroceries,
  inventory,
  dailyBudget,
  simulatedCost,
  onSelectMeal,
  selectedMeal,
  spendingRecommendation
}: MealPlanViewerProps) {
  const percentage = calculatePercentage(simulatedCost, dailyBudget);
  const status = getBudgetStatus(simulatedCost, dailyBudget);

  // SVG Circular progress configurations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine theme colors based on under/over budget status
  const colorClass = status.theme === "success" ? "text-emerald-400" : "text-rose-400";
  const glowClass = status.theme === "success" ? "shadow-emerald-500/10 border-emerald-500/20" : "shadow-rose-500/10 border-rose-500/20";
  const labelColorClass = status.theme === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400";

  return (
    <div id="meal-plan-viewer" className="flex flex-col gap-6">
      {/* 1. Dynamic Budget Health Widget */}
      <div className={`p-6 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between glass-panel ${glowClass}`}>
        <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
          <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
            <span className={`text-[10px] uppercase font-mono tracking-wider font-bold px-2.5 py-1 rounded-full ${labelColorClass}`}>
              {status.label}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 py-1 rounded-full bg-slate-800">
              Coached Spending
            </span>
          </div>

          <h3 className="text-lg font-bold font-display text-white tracking-tight flex items-center justify-center md:justify-start gap-1.5 mt-1">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            BiteBudget Smart Coach Feedback
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md">
            {spendingRecommendation || "Review missing items substitution swaps below to bring meal prep out-of-pocket costs within dynamic boundaries."}
          </p>
          <p className="text-[11px] text-slate-455 italic mt-0.5">
            {status.message}
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div id="budget-circular-gauge" className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-slate-800 fill-none"
              strokeWidth="10"
            />
            {/* Dynamic Active Progress Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className={`fill-none transition-all duration-500 ${status.theme === "success" ? "stroke-emerald-400" : "stroke-rose-400"}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 font-mono">Out-of-Pocket</span>
            <span className={`text-md font-extrabold font-mono ${colorClass}`}>
              ${simulatedCost}
            </span>
            <span className="text-[10px] font-mono text-slate-550 font-semibold">of ${dailyBudget}</span>
          </div>
        </div>
      </div>

      {/* 2. Structured B/L/D Recipes View */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold font-display text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-400" />
          Daily Menu Draft
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {meals.map((meal) => {
            const isSelected = selectedMeal?.mealType === meal.mealType;
            return (
              <div
                key={meal.mealType}
                id={`meal-card-${meal.mealType}`}
                onClick={() => onSelectMeal(meal)}
                className={`p-5 rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col gap-4 glass-panel ${
                  isSelected
                    ? "active-meal-glow ring-1 ring-violet-500/20 bg-violet-950/10"
                    : ""
                }`}
              >
                {/* Meal header detail */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col select-none">
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-violet-400">
                      {meal.mealType}
                    </span>
                    <h4 className="text-md font-bold font-display text-white group-hover:text-violet-300 transition-colors mt-0.5">
                      {meal.recipeName}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-snug flex-1">
                  {meal.description}
                </p>

                {/* Cook times & prep values */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Prep: {meal.prepTime}m
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <span>Cook: {meal.cookTime}m</span>
                </div>

                {/* Ingredient Inventory Match Checker lists */}
                <div className="border-t border-white/5 pt-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                    Ingredients Check
                  </span>
                  <ul className="flex flex-col gap-1 max-h-[85px] overflow-y-auto pr-1">
                    {meal.ingredientsRequired.map((ing, i) => {
                      const simpleName = meal.simpleIngredients?.[i] || ing;
                      const hasStock = isIngredientMatched(simpleName, inventory);
                      return (
                        <li key={i} className="flex items-center gap-1.5 text-xs">
                          {hasStock ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className={`truncate ${hasStock ? "text-emerald-400/90 font-medium" : "text-slate-400"}`}>
                            {ing}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Selector visual footer */}
                <button
                  id={`select-meal-btn-${meal.mealType}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMeal(meal);
                  }}
                  aria-label={`Open cooking steps for ${meal.mealType}: ${meal.recipeName}`}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                      : "bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900/40 border border-white/5 active:scale-98"
                  }`}
                >
                  <span>{isSelected ? "Cooking Workspace Open" : "Check cooking steps"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
