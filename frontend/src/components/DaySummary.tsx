import type { DayPlan } from "../types";
import { dayMacros, dishMacros, r, split } from "../utils/nutrition";

/** Línea corta con los macros de una comida: "Prot. 30 g · Grasas 12 g · Hidr. 45 g". */
export function MealMacros({ dish }: { dish: DayPlan["lunch"] }) {
  const m = dishMacros(dish);
  if (!m) return null;
  return <div className="meal__macros">Prot. {r(m.protein)} g · Grasas {r(m.fat)} g · Hidr. {r(m.carbs)} g</div>;
}

/** Resumen nutricional de un día: totales de comida + cena y vitaminas de cada una. */
export default function DaySummary({ day }: { day: DayPlan }) {
  const total = dayMacros(day);
  if (!total) {
    return (
      <p className="day__summary day__summary--empty">
        Sin datos nutricionales: genera otro menú para verlos.
      </p>
    );
  }
  const pct = split(total);
  const rows: [string, string][] = [
    ["Proteínas", `${r(total.protein)} g`],
    ["Grasas", `${r(total.fat)} g`],
    ["Hidratos", `${r(total.carbs)} g`],
    ["Fibra", `${r(total.fiber)} g`],
  ];
  const micros: [string, string[]][] = [
    ["Comida", day.lunch.nutrition?.micros ?? []],
    ["Cena", day.dinner.nutrition?.micros ?? []],
  ];
  return (
    <section className="day__summary" aria-label="Resumen nutricional del día">
      <h4>Resumen del día</h4>
      <dl className="day__macros">
        {rows.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      <p className="day__split">
        {pct.protein} % proteínas · {pct.carbs} % hidratos · {pct.fat} % grasas
      </p>
      {micros.some(([, list]) => list.length > 0) && (
        <div className="day__micros">
          <strong>Vitaminas y minerales</strong>
          {micros.map(([label, list]) =>
            list.length > 0 ? <p key={label}><span>{label}:</span> {list.join(", ")}</p> : null,
          )}
        </div>
      )}
    </section>
  );
}
