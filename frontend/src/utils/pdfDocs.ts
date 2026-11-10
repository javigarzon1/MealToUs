import { DIET_LABEL, fmt } from "../components/DishCard";
import type { ShoppingItem, ShoppingResult, WeeklyPlan } from "../types";
import { dayEs } from "./days";
import type { PdfBlock } from "./pdf";

const CORAL: [number, number, number] = [1, 0.42, 0.24];
const GREY: [number, number, number] = [0.48, 0.39, 0.31];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function today(): string {
  return new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

/** Menú de 7 días: comida, cena y total de cada día. */
export function menuBlocks(plan: WeeklyPlan, maxKcal: number | null): PdfBlock[] {
  const blocks: PdfBlock[] = [
    { text: "Mi menú semanal", size: 22, bold: true, color: CORAL },
    {
      text: `Dieta ${DIET_LABEL[plan.diet_type] ?? plan.diet_type} · objetivo de unas ${plan.target_kcal_per_day} kcal al día` +
        (maxKcal ? ` · tope ${maxKcal} kcal` : ""),
      size: 10, color: GREY, gapBefore: 2,
    },
    { text: `Generado el ${today()}`, size: 9, color: GREY },
    { rule: true, gapBefore: 4 },
  ];
  for (const d of plan.days) {
    const total = d.lunch.kcal_per_serving + d.dinner.kcal_per_serving;
    blocks.push({ text: cap(dayEs(d.day)), size: 14, bold: true, gapBefore: 10 });
    blocks.push({ text: `Comida: ${d.lunch.name} (${d.lunch.kcal_per_serving} kcal)`, indent: 12, gapBefore: 2 });
    blocks.push({ text: `Cena: ${d.dinner.name} (${d.dinner.kcal_per_serving} kcal)`, indent: 12 });
    blocks.push({ text: `Total del día: ${total} kcal`, size: 9, color: GREY, indent: 12 });
  }
  blocks.push({ text: "Las calorías son estimaciones generadas por IA y no sustituyen el consejo de un dietista.", size: 8, color: GREY, gapBefore: 18 });
  return blocks;
}

/** Lista de la compra (propia + del menú) y, si las hay, las recetas. */
export function shoppingBlocks(extra: ShoppingItem[], shopping: ShoppingResult | null, people: number): PdfBlock[] {
  const blocks: PdfBlock[] = [
    { text: "Lista de la compra", size: 22, bold: true, color: CORAL },
    { text: `Para ${people} ${people === 1 ? "persona" : "personas"} · ${today()}`, size: 10, color: GREY, gapBefore: 2 },
    { rule: true, gapBefore: 4 },
  ];
  const groups = new Map<string, ShoppingItem[]>();
  const all = [...extra.map((i) => ({ ...i, category: "Mi lista" })), ...(shopping?.shopping_list ?? [])];
  for (const it of all) {
    const cat = it.category || "Otros";
    groups.set(cat, [...(groups.get(cat) ?? []), it]);
  }
  if (groups.size === 0) blocks.push({ text: "No falta nada: ya lo tienes todo.", gapBefore: 8 });
  for (const [cat, items] of groups) {
    blocks.push({ text: cap(cat), size: 13, bold: true, gapBefore: 10 });
    for (const it of items) {
      blocks.push({ text: `[  ]  ${it.name} — ${fmt(it.quantity)} ${it.unit}`, indent: 10, gapBefore: 1 });
    }
  }
  if (shopping?.recipes.length) {
    blocks.push({ text: "Recetas", size: 18, bold: true, color: CORAL, gapBefore: 22 });
    blocks.push({ rule: true });
    for (const r of shopping.recipes) {
      blocks.push({ text: r.dish_name, size: 14, bold: true, gapBefore: 12 });
      blocks.push({ text: `${r.prep_minutes} min · ${r.servings} ${r.servings === 1 ? "ración" : "raciones"}`, size: 9, color: GREY });
      blocks.push({ text: "Ingredientes", bold: true, gapBefore: 5 });
      for (const i of r.ingredients) blocks.push({ text: `• ${i.name}: ${fmt(i.quantity)} ${i.unit}`, indent: 10 });
      blocks.push({ text: "Preparación", bold: true, gapBefore: 5 });
      r.steps.forEach((s, k) => blocks.push({ text: `${k + 1}. ${s}`, indent: 10, gapBefore: 1 }));
    }
  }
  return blocks;
}
