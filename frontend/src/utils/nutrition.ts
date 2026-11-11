import type { DayPlan, Dish } from "../types";

export interface Macros { kcal: number; protein: number; fat: number; carbs: number; fiber: number }

/** Macros de un plato, o null si es un menú antiguo sin información nutricional. */
export function dishMacros(d: Dish): Macros | null {
  const n = d.nutrition;
  if (!n) return null;
  return { kcal: d.kcal_per_serving, protein: n.protein_g, fat: n.fat_g, carbs: n.carbs_g, fiber: n.fiber_g };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal, protein: a.protein + b.protein, fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs, fiber: a.fiber + b.fiber,
  };
}

/** Total del día (comida + cena); null si falta la nutrición de alguna de las dos. */
export function dayMacros(d: DayPlan): Macros | null {
  const l = dishMacros(d.lunch);
  const c = dishMacros(d.dinner);
  return l && c ? addMacros(l, c) : null;
}

/** Media diaria de los días que tienen datos. */
export function averageMacros(days: DayPlan[]): Macros | null {
  const all = days.map(dayMacros).filter((m): m is Macros => m !== null);
  if (all.length === 0) return null;
  const sum = all.reduce(addMacros);
  const k = all.length;
  return { kcal: sum.kcal / k, protein: sum.protein / k, fat: sum.fat / k, carbs: sum.carbs / k, fiber: sum.fiber / k };
}

export const r = (n: number) => Math.round(n);

/** Reparto de las calorías: % de proteína, hidratos y grasa (4-4-9 kcal/g). */
export function split(m: Macros): { protein: number; carbs: number; fat: number } {
  const total = m.protein * 4 + m.carbs * 4 + m.fat * 9;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((m.protein * 4 * 100) / total),
    carbs: Math.round((m.carbs * 4 * 100) / total),
    fat: Math.round((m.fat * 9 * 100) / total),
  };
}
