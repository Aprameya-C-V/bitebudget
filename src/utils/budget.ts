import { MissingGrocery } from "../types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function calculatePercentage(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(Math.round((spent / limit) * 100), 100);
}

export function getBudgetStatus(spent: number, limit: number): {
  label: string;
  theme: "success" | "warning" | "danger";
  message: string;
} {
  if (limit <= 0) {
    return {
      label: "No Budget Set",
      theme: "warning",
      message: "Please specify a budget target."
    };
  }

  const diff = limit - spent;
  if (diff >= 0) {
    return {
      label: "Under Budget",
      theme: "success",
      message: `You saved ${formatCurrency(diff)} from your daily limit!`
    };
  } else {
    return {
      label: "Over Budget",
      theme: "danger",
      message: `You are exceeding your daily limit by ${formatCurrency(Math.abs(diff))}.`
    };
  }
}

/**
 * Calculates modified total budget spent based on which substitutions are actively chosen.
 */
export function calculateSimulatedSpent(
  baseCost: number,
  missingGroceries: MissingGrocery[],
  activeSwaps: Record<string, boolean>
): number {
  let finalCost = baseCost;
  missingGroceries.forEach((item) => {
    if (activeSwaps[item.name] && item.cheaperSubstitutionCost !== undefined) {
      const savings = item.estimatedCost - item.cheaperSubstitutionCost;
      if (savings > 0) {
        finalCost -= savings;
      }
    }
  });
  return Math.max(0, parseFloat(finalCost.toFixed(2)));
}
