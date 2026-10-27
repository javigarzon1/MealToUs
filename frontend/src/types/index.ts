export type DietType = "healthy" | "normal" | "sport";
export interface Ingredient { name: string; quantity: number; unit: string }
export interface Dish {
  name: string; diet_type: DietType; kcal_per_serving: number;
  ingredients: Ingredient[]; uses_from_pantry: string[];
}
export interface DishOptions { options: Dish[] }
export interface DayPlan { day: string; lunch: Dish; dinner: Dish }
export interface WeeklyPlan { diet_type: DietType; target_kcal_per_day: number; days: DayPlan[] }
export interface PantryItem { name: string; quantity?: string | null }
export interface UserPreferences {
  people: number; allergies: string[]; intolerances: string[]; dislikes: string[];
}
export interface PlanContext { pantry: PantryItem[]; preferences: UserPreferences }
export interface ShoppingItem { name: string; quantity: number; unit: string; category: string }
export interface Recipe {
  dish_name: string; servings: number; prep_minutes: number;
  ingredients: Ingredient[]; steps: string[];
}
export interface ShoppingResult { shopping_list: ShoppingItem[]; recipes: Recipe[] }
export interface ChatMessage { role: "user" | "assistant"; content: string }
