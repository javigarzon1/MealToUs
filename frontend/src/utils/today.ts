import type { ShoppingResult, TodayMenu, WeeklyPlan } from "../types";
import { dayEs, todayEs } from "./days";
import { recipeFor } from "./match";

/** Lo que toca cocinar hoy según el menú (y sus recetas si ya se generaron). */
export function todayMenu(plan: WeeklyPlan | null, shopping: ShoppingResult | null): TodayMenu | undefined {
  if (!plan) return undefined;
  const today = todayEs();
  const d = plan.days.find((x) => dayEs(x.day) === today) ?? plan.days[0];
  const recipes = shopping
    ? [d.lunch, d.dinner].flatMap((m) => {
        const r = recipeFor(m.name, shopping.recipes);
        return r ? [r] : [];
      })
    : [];
  return { day: dayEs(d.day), lunch: d.lunch, dinner: d.dinner, recipes };
}
