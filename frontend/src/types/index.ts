export type DietType = "healthy" | "normal" | "sport";
export interface Ingredient { name: string; quantity: number; unit: string }
/** Información nutricional estimada por ración (la calcula la IA) */
export interface Nutrition {
  protein_g: number; fat_g: number; carbs_g: number; fiber_g: number;
  /** Vitaminas y minerales destacados con su cantidad, p. ej. "Vitamina C 45 mg" */
  micros: string[];
}
export interface Dish {
  name: string; diet_type: DietType; kcal_per_serving: number;
  ingredients: Ingredient[]; uses_from_pantry: string[];
  /** Los menús guardados antes de existir este campo no lo traen */
  nutrition?: Nutrition | null;
}
export interface DishOptions { options: Dish[] }
export interface DayPlan { day: string; lunch: Dish; dinner: Dish }
export interface WeeklyPlan { diet_type: DietType; target_kcal_per_day: number; days: DayPlan[] }
export interface PantryItem { name: string; quantity?: string | null }
export interface PantryItemOut extends PantryItem { id: number }
export interface ScanItem {
  name: string; quantity: number | null; unit: string | null;
  confidence: "alta" | "media" | "baja"; needs_confirmation: boolean;
}
export interface ScanResult { status: "ok" | "retake"; message?: string | null; items: ScanItem[] }
export interface UserPreferences {
  people: number; allergies: string[]; intolerances: string[]; dislikes: string[];
  /** Tope de kcal al día (comida + cena); null = sin límite */
  max_kcal_per_day: number | null;
}
export interface PlanContext { pantry: PantryItem[]; preferences: UserPreferences }
export interface ShoppingItem { name: string; quantity: number; unit: string; category: string }
export interface Recipe {
  dish_name: string; servings: number; prep_minutes: number;
  ingredients: Ingredient[]; steps: string[];
}
export interface ShoppingResult { shopping_list: ShoppingItem[]; recipes: Recipe[] }
export interface ChatMessage { role: "user" | "assistant"; content: string }

export interface SupermarketLinks {
  supermarket: string;
  links: { item: string; url: string }[];
}
export interface AuthUser { id: number; email: string; full_name?: string | null }

export interface FavoriteMenu { id: number; name: string; plan: WeeklyPlan }
export interface HistoryEntry { id: number; created_at: string; plan: WeeklyPlan }
export interface ShoppingTemplate { id: number; name: string; items: ShoppingItem[] }
/** Lo que toca cocinar hoy, para el asistente */
export interface TodayMenu { day: string; lunch: Dish | null; dinner: Dish | null; recipes: Recipe[] }
