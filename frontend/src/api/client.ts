import type {
  ChatMessage, Dish, DishOptions, PlanContext, ShoppingResult, WeeklyPlan,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
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
