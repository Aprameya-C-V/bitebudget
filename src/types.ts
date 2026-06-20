export type MealType = "Breakfast" | "Lunch" | "Dinner";

export interface Substitution {
  original: string;
  replacement: string;
  costDifference: number;
}

export interface CookingStep {
  step: number;
  instruction: string;
  durationSeconds: number; // 0 if no timer is needed for this step
}

export interface Meal {
  mealType: MealType;
  recipeName: string;
  description: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  estimatedCost: number; // in USD
  ingredientsRequired: string[]; // e.g., "3 eggs"
  simpleIngredients: string[]; // e.g., "egg"
  instructions: CookingStep[];
  substitutions: Substitution[];
}

export interface MissingGrocery {
  name: string;
  quantity: string;
  estimatedCost: number;
  substitutionSuggestion?: string;
  cheaperSubstitutionCost?: number;
}

export interface MealPlanResponse {
  meals: Meal[];
  missingGroceries: MissingGrocery[];
  totalEstimatedCost: number;
  spendingRecommendation: string;
}

export interface UserSchedule {
  activityLevel: "sedentary" | "moderate" | "busy";
  dietaryPreference: string; // "None" | "Vegan" | "Vegetarian" | "Keto" | "Gluten-Free" | "Low-Carb"
  dailyBudget: number;
  notes: string;
}
