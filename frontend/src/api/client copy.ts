import type {
  ChatMessage, Dish, DishOptions, PlanContext, ShoppingItem, ShoppingResult,
  SupermarketLinks, WeeklyPlan,
} from "../types";

// Por defecto usa el proxy de Vite (/api -> backend en :8000)
const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está el backend arrancado en el puerto 8000?");
  }
  if (!res.ok) {
    let detail = await res.text();
    try {
      const parsed = JSON.parse(detail);
      detail = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail ?? parsed);
    } catch {
      /* el cuerpo no era JSON: se deja el texto tal cual */
    }
    throw new Error(`Error ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
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
  supermarketLinks: (supermarket: string, items: ShoppingItem[]) =>
    post<SupermarketLinks>("/shopping/supermarket-links", { supermarket, items }),
};
