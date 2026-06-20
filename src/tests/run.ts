import { formatCurrency, calculatePercentage, getBudgetStatus, calculateSimulatedSpent } from "../utils/budget";
import { isIngredientMatched } from "../utils/ingredients";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("🚀 Running BiteBudget Unit Tests...");

  try {
    // 1. Currency formatting checks
    assert(formatCurrency(10.5) === "$10.50", "formatCurrency fraction failed");
    assert(formatCurrency(0) === "$0.00", "formatCurrency zero failed");
    console.log("✓ Currency formatting checks passed");

    // 2. Proportional budget percentage checks
    assert(calculatePercentage(15, 30) === 50, "calculatePercentage middle value failed");
    assert(calculatePercentage(45, 30) === 100, "calculatePercentage over 100% cap failed");
    console.log("✓ Percentage metrics passed");

    // 3. Under/Over budget classification
    const underStatus = getBudgetStatus(8.5, 10);
    assert(underStatus.theme === "success", "getBudgetStatus expected success under budget");
    const overStatus = getBudgetStatus(12.5, 10);
    assert(overStatus.theme === "danger", "getBudgetStatus expected danger over budget");
    console.log("✓ Budget categories passed");

    // 4. Ingredient swaps simulation math
    const mockMissingItems = [
      { name: "Organic Avocado", quantity: "1 piece", estimatedCost: 3.50, cheaperSubstitutionCost: 1.50 },
      { name: "Fresh Strawberries", quantity: "1 container", estimatedCost: 5.00, cheaperSubstitutionCost: 2.20 }
    ];
    
    // Switch on avocado swap (saves 2.0) and keep strawberry normal (no savings)
    const activeSwaps: Record<string, boolean> = {
      "Organic Avocado": true,
      "Fresh Strawberries": false
    };
    
    const baseTotalCost = 15.00;
    const finalCost = calculateSimulatedSpent(baseTotalCost, mockMissingItems, activeSwaps);
    // Base cost: 15.00. Savings on avocado: 3.50 - 1.50 = 2.00. Expected final: 13.00.
    assert(finalCost === 13.00, `Simulation calculation failed. Expected 13.0, got ${finalCost}`);
    console.log("✓ Budget substitution simulation passed");

    // 5. Ingredient matching accuracy
    assert(isIngredientMatched("3 large eggs", ["egg"]), "egg singular/plural check failed");
    assert(isIngredientMatched("ripe spinach", ["Spinach"]), "case insensitive check failed");
    assert(isIngredientMatched("Whole chicken milk", ["chicken"]), "broad substring check failed");
    assert(!isIngredientMatched("Cilantro", ["Beef", "Salt"]), "negative match failed");
    console.log("✓ Ingredient comparisons passed");

    console.log("✨ All BiteBudget Unit Tests Passed Successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Test suite encountered an error:");
    console.error(error.message || error);
    process.exit(1);
  }
}

runTests();
