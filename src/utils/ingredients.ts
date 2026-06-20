export function isIngredientMatched(requiredIngredient: string, inventory: string[]): boolean {
  if (!requiredIngredient || !inventory || inventory.length === 0) return false;
  const req = requiredIngredient.toLowerCase().trim();
  
  return inventory.some(item => {
    const inv = item.toLowerCase().trim();
    if (inv === "") return false;
    
    // Check direct substring rules or common singular/plural variations
    return (
      req === inv ||
      req.includes(inv) ||
      inv.includes(req) ||
      (req.endsWith("s") && req.slice(0, -1) === inv) ||
      (inv.endsWith("s") && inv.slice(0, -1) === req) ||
      (req.endsWith("es") && req.slice(0, -2) === inv) ||
      (inv.endsWith("es") && inv.slice(0, -2) === req)
    );
  });
}

/**
 * Filter dynamic items out-of-stock from requested recipe items list.
 */
export function getUnavailableIngredients(requiredSimpleIngredients: string[], inventory: string[]): string[] {
  return requiredSimpleIngredients.filter(reqIng => !isIngredientMatched(reqIng, inventory));
}
