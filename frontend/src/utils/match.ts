import type { Recipe, ShoppingItem, WeeklyPlan } from "../types";
import { dayEs } from "./days";

const STOP = new Set(["de", "del", "la", "el", "los", "las", "en", "con", "al", "y", "o", "para", "un", "una"]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Raíz sencilla para igualar singular y plural: tomates = tomate, cebollas = cebolla. */
function stem(word: string): string {
  // Plural en -es tras consonante (limones, panes); en el resto basta quitar la -s (tomates, cebollas)
  if (word.length > 4 && /[lnrdz]es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function words(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

/**
 * ¿Es el mismo alimento? Todas las palabras del nombre más corto deben estar en el otro:
 * "tomate" ~ "tomate triturado", "aceite de oliva" ~ "aceite de oliva virgen",
 * pero "aceite de oliva" no es "aceite de girasol".
 */
export function sameFood(a: string, b: string): boolean {
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) return false;
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  return short.every((w) => long.includes(w));
}

/** Índices de las recetas que llevan este alimento. */
export function recipesUsing(itemName: string, recipes: Recipe[]): number[] {
  const found: number[] = [];
  recipes.forEach((r, idx) => {
    if (r.ingredients.some((i) => sameFood(i.name, itemName))) found.push(idx);
  });
  return found;
}

/** Índice del alimento de la lista que corresponde a un ingrediente, o -1. */
export function itemFor(ingredientName: string, items: ShoppingItem[]): number {
  return items.findIndex((it) => sameFood(it.name, ingredientName));
}

/** Receta de un plato del menú (nombres iguales o uno dentro del otro). */
export function recipeFor(dishName: string, recipes: Recipe[]): Recipe | undefined {
  const n = normalize(dishName);
  return recipes.find((r) => {
    const m = normalize(r.dish_name);
    return m === n || m.includes(n) || n.includes(m);
  });
}

export interface PlanUse { day: string; meal: "Comida" | "Cena"; dish: string }

/** Comidas y días del menú que llevan este alimento. */
export function usesInPlan(itemName: string, plan: WeeklyPlan | null): PlanUse[] {
  if (!plan) return [];
  const out: PlanUse[] = [];
  for (const d of plan.days) {
    for (const [meal, dish] of [["Comida", d.lunch], ["Cena", d.dinner]] as const) {
      if (dish.ingredients.some((i) => sameFood(i.name, itemName))) {
        out.push({ day: dayEs(d.day), meal, dish: dish.name });
      }
    }
  }
  return out;
}
