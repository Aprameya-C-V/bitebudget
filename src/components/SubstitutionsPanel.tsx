import React from "react";
import { MissingGrocery } from "../types";
import { formatCurrency } from "../utils/budget";
import { Sparkles, HelpCircle, ArrowRight, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

interface SubstitutionsPanelProps {
  missingGroceries: MissingGrocery[];
  activeSwaps: Record<string, boolean>; // key: grocery name, value: true if substituted
  onToggleSwap: (name: string) => void;
  baseTotalCost: number;
  simulatedCost: number;
  dailyBudget: number;
}

export default function SubstitutionsPanel({
  missingGroceries,
  activeSwaps,
  onToggleSwap,
  baseTotalCost,
  simulatedCost,
  dailyBudget
}: SubstitutionsPanelProps) {
  if (!missingGroceries || missingGroceries.length === 0) {
    return (
      <div
        id="substitutions-empty"
        className="p-6 rounded-2xl bg-emerald-950/15 border border-emerald-500/20 backdrop-blur-xl flex flex-col items-center justify-center text-center gap-2"
      >
        <span className="text-emerald-400 font-bold text-sm">Perfect Pantry Alignment!</span>
        <span className="text-xs text-slate-405">
          You already have everything needed in stock! Out-of-pocket budget: <strong className="text-emerald-400 font-mono">$0.00</strong>
        </span>
      </div>
    );
  }

  const activeSwapsCount = Object.values(activeSwaps).filter(Boolean).length;
  const potentialSavings = missingGroceries.reduce((sum, item) => {
    if (item.cheaperSubstitutionCost !== undefined) {
      return sum + (item.estimatedCost - item.cheaperSubstitutionCost);
    }
    return sum;
  }, 0);

  const realizedSavings = missingGroceries.reduce((sum, item) => {
    if (activeSwaps[item.name] && item.cheaperSubstitutionCost !== undefined) {
      return sum + (item.estimatedCost - item.cheaperSubstitutionCost);
    }
    return sum;
  }, 0);

  return (
    <div
      id="substitutions-panel"
      className="rounded-2xl p-6 flex flex-col gap-5 glass-panel"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold font-display text-white tracking-tight flex items-center gap-2">
            <ToggleRight className="w-5 h-5 text-violet-400" />
            Out-of-Pocket Grocery List
          </h3>
          <p className="text-xs text-slate-400">These items are missing from your fridge. Toggle cheaper swaps to fit your budget.</p>
        </div>
        {potentialSavings > 0 && realizedSavings === 0 && (
          <div className="animate-bounce p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center gap-1.5 select-none text-[10px] text-violet-300 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            Save up to {formatCurrency(potentialSavings)}!
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {missingGroceries.map((item) => {
          const isSwapped = !!activeSwaps[item.name];
          const hasSwap = item.cheaperSubstitutionCost !== undefined && item.substitutionSuggestion;
          const savings = hasSwap ? item.estimatedCost - (item.cheaperSubstitutionCost || 0) : 0;

          return (
            <div
              key={item.name}
              id={`grocery-item-${item.name.replace(/\s+/g, "-")}`}
              className={`p-4 rounded-xl transition-all border ${
                isSwapped
                  ? "bg-violet-950/20 border-violet-500/30 active-glow-violet"
                  : "bg-slate-950/30 border-white/5"
              } flex flex-col gap-2`}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{item.name}</h4>
                  <p className="text-xs text-slate-450 font-sans font-medium mt-0.5">Need quantity: <strong className="text-slate-200">{item.quantity}</strong></p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono text-white">
                    {isSwapped && item.cheaperSubstitutionCost ? formatCurrency(item.cheaperSubstitutionCost) : formatCurrency(item.estimatedCost)}
                  </div>
                  {isSwapped && (
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      Saved {formatCurrency(savings)}
                    </div>
                  )}
                </div>
              </div>

              {/* Cheaper option swap info if available */}
              {hasSwap && (
                <div className="mt-2 border-t border-white/5 pt-2 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <HelpCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-300 leading-normal">
                      <span className="font-semibold text-violet-400">Alternative swap:</span> {item.substitutionSuggestion}
                    </div>
                  </div>

                  <button
                    id={`toggle-swap-btn-${item.name.replace(/\s+/g, "-")}`}
                    type="button"
                    onClick={() => onToggleSwap(item.name)}
                    aria-label={`Toggle cheaper swap for ${item.name}`}
                    className={`shrink-0 py-1 px-2 text-[10px] font-bold uppercase rounded-lg tracking-wider border flex items-center gap-1 cursor-pointer transition-all focus:outline-none focus:ring-2 ${
                      isSwapped
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 focus:ring-emerald-500/50"
                        : "bg-violet-600 hover:bg-violet-500 text-white border-violet-500/30 active:scale-95 focus:ring-violet-500/50"
                    }`}
                  >
                    <span>{isSwapped ? "Using swap" : "Apply swap"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary calculations footer inside panel */}
      <div className="border-t border-white/5 pt-4 flex flex-col gap-2 text-xs font-mono text-slate-400">
        <div className="flex justify-between">
          <span>Standard Ingredients cost:</span>
          <span>{formatCurrency(baseTotalCost)}</span>
        </div>
        {activeSwapsCount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Swaps discount savings:</span>
            <span>-{formatCurrency(realizedSavings)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-extrabold text-white border-t border-white/5 pt-2">
          <span>Net Out-of-Pocket cost:</span>
          <span className={simulatedCost <= dailyBudget ? "text-emerald-400" : "text-rose-400"}>
            {formatCurrency(simulatedCost)}
          </span>
        </div>
      </div>
    </div>
  );
}
