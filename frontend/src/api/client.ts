import type {
  ChatMessage, Dish, DishOptions, PlanContext, ShoppingResult, WeeklyPlan,
  PantryItem, UserPreferences,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json() as T;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
}

// GET /api/pantry/
// POST /api/pantry/  body: { name: string, quantity?: string }
// DELETE /api/pantry/{item_id}

export const api = {
  // Pantry endpoints
  listPantry: () => get<PantryItem[]>("/pantry/"),
  addPantryItem: (item: { name: string; quantity?: string }) =>
    post<PantryItem>("/pantry/", item),
  deletePantryItem: (itemId: number) => del(`/pantry/${itemId}`),
  
  // Preferences endpoints
  getPreferences: () => get<UserPreferences>("/preferences/"),
  savePreferences: (prefs: UserPreferences) =>
    post<UserPreferences>("/preferences/", prefs),
  
  // Existing menu endpoints
  lunchOptions: (ctx: PlanContext) => post<DishOptions>("/menus/lunch-options", ctx),
  dinnerOptions: (ctx: PlanContext, chosen_lunch: Dish) =>
    post<DishOptions>("/menus/dinner-options", { ...ctx, chosen_lunch }),
  weeklyPlan: (ctx: PlanContext, chosen_lunch: Dish, chosen_dinner: Dish) =>
    post<WeeklyPlan>("/menus/weekly-plan", { ...ctx, chosen_lunch, chosen_dinner }),
  shopping: (ctx: PlanContext, plan: WeeklyPlan) =>
    post<ShoppingResult>("/menus/shopping", { ...ctx, plan }),
  chat: (messages: ChatMessage[], context?: PlanContext) =>
    post<{ reply: string }>("/menus/chat", { messages, context }),
};