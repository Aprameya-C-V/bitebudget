import React from "react";
import { UserSchedule } from "../types";
import { Clock, DollarSign, Dumbbell, ShieldAlert } from "lucide-react";

interface ScheduleInputProps {
  schedule: UserSchedule;
  onChange: (schedule: UserSchedule) => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasApiKey: boolean;
}

const DIET_OPTIONS = [
  "None",
  "Vegan",
  "Vegetarian",
  "Keto",
  "Gluten-Free",
  "Low-Carb",
  "Paleo",
  "Mediterranean"
];

export default function ScheduleInput({
  schedule,
  onChange,
  onGenerate,
  isLoading,
  hasApiKey
}: ScheduleInputProps) {
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    onChange({ ...schedule, dailyBudget: Math.max(0, val) });
  };

  const handleLevelChange = (level: "sedentary" | "moderate" | "busy") => {
    onChange({ ...schedule, activityLevel: level });
  };

  const handleDietChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...schedule, dietaryPreference: e.target.value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...schedule, notes: e.target.value });
  };

  return (
    <div
      id="schedule-panel"
      className="rounded-2xl p-6 flex flex-col gap-6 glass-panel"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
          <Clock className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight">
            Schedule & Plan Config
          </h2>
          <p className="text-xs text-slate-400">Specify your calorie, style, and budget preferences</p>
        </div>
      </div>

      {/* Daily Budget Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5" htmlFor="budget-slider">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Max Daily Budget
          </label>
          <span className="text-md font-bold text-emerald-400 font-mono">
            ${schedule.dailyBudget} USD
          </span>
        </div>
        <input
          id="budget-slider"
          type="range"
          min="5"
          max="120"
          step="5"
          value={schedule.dailyBudget}
          onChange={handleBudgetChange}
          aria-label="Max Daily Budget Limit"
          className="w-full accent-violet-500 cursor-pointer h-2 bg-slate-850 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>$5</span>
          <span>$60</span>
          <span>$120</span>
        </div>
      </div>

      {/* Activity / Schedule Level Option */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-violet-400" /> Daily Routine &amp; Schedule
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["sedentary", "moderate", "busy"] as const).map((level) => {
            const labels = { sedentary: "Relaxed", moderate: "Active Day", busy: "Busy Rush" };
            return (
              <button
                key={level}
                id={`routine-btn-${level}`}
                type="button"
                onClick={() => handleLevelChange(level)}
                aria-label={`Select ${labels[level]} routine`}
                className={`py-2 px-3 text-xs rounded-xl capitalize font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                  schedule.activityLevel === level
                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : "bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
              >
                {labels[level]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300" htmlFor="diet-selector">Dietary Boundary</label>
        <div className="relative">
          <select
            id="diet-selector"
            value={schedule.dietaryPreference}
            onChange={handleDietChange}
            aria-label="Dietary Boundary Preference"
            className="w-full p-2.5 text-sm bg-slate-950/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-sans cursor-pointer appearance-none"
          >
            {DIET_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-slate-900 text-slate-200">
                {opt}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dietary & Allergy notes */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300" htmlFor="custom-notes-input">Custom Requests / Excluded Allergens</label>
        <textarea
          id="custom-notes-input"
          value={schedule.notes}
          onChange={handleNotesChange}
          placeholder="e.g. Nut allergies, low carbon footprint, prefers hot breakfast..."
          rows={2}
          aria-label="Custom requests or excluded allergens"
          className="w-full p-3 text-sm bg-slate-950/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-sans resize-none"
        />
      </div>

      {/* Warning if API key check fails */}
      {!hasApiKey && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2 items-start leading-relaxed animate-pulse">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>
            <strong>Gemini API Key Missing</strong>: Make sure <code>GEMINI_API_KEY</code> is correctly set in your AI Studio secrets settings.
          </span>
        </div>
      )}

      {/* Generate Button Button */}
      <button
        id="generate-meal-plan-btn"
        type="button"
        disabled={isLoading}
        onClick={onGenerate}
        className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide text-white flex items-center justify-center gap-2 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
          isLoading
            ? "bg-slate-800 border-white/5 cursor-not-allowed opacity-75"
            : "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:opacity-90 active:scale-98 shadow-violet-500/10 cursor-pointer"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Curating Meal Plan...</span>
          </div>
        ) : (
          <span>Formulate Budget Meal Plan</span>
        )}
      </button>
    </div>
  );
}
