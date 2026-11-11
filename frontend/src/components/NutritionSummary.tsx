import type { DayPlan, Dish } from "../types";
import { dayEs } from "../utils/days";
import { averageMacros, dayMacros, dishMacros, r, split } from "../utils/nutrition";
import type { Macros } from "../utils/nutrition";

function cells(m: Macros | null) {
  return m ? (
    <>
      <td>{r(m.kcal)}</td><td>{r(m.protein)} g</td><td>{r(m.fat)} g</td><td>{r(m.carbs)} g</td><td>{r(m.fiber)} g</td>
    </>
  ) : (
    <td colSpan={5} className="muted">Sin datos (menú generado antes de añadir la nutrición)</td>
  );
}

function mealRow(label: string, d: Dish) {
  const micros = d.nutrition?.micros ?? [];
  return (
    <tr className="nutri__meal">
      <th scope="row">
        <span className="nutri__when">{label}</span> {d.name}
        {micros.length > 0 && <small className="nutri__micros">{micros.join(" · ")}</small>}
      </th>
      {cells(dishMacros(d))}
    </tr>
  );
}

/** Resumen al final del menú: calorías, proteínas, grasas, hidratos, fibra y vitaminas de cada comida. */
export default function NutritionSummary({ days }: { days: DayPlan[] }) {
  const avg = averageMacros(days);
  const pct = avg ? split(avg) : null;
  return (
    <section className="nutri" aria-labelledby="nutri-title">
      <h3 id="nutri-title">Resumen nutricional</h3>
      <p className="muted small">
        Valores por ración, estimados por la IA: orientativos, no sustituyen el consejo de un dietista.
      </p>

      {avg && pct && (
        <div className="nutri__avg">
          <strong>Media diaria</strong>
          <span>{r(avg.kcal)} kcal</span>
          <span>Proteínas {r(avg.protein)} g ({pct.protein} %)</span>
          <span>Grasas {r(avg.fat)} g ({pct.fat} %)</span>
          <span>Hidratos {r(avg.carbs)} g ({pct.carbs} %)</span>
          <span>Fibra {r(avg.fiber)} g</span>
        </div>
      )}

      <div className="nutri__scroll">
        <table className="nutri__table">
          <thead>
            <tr>
              <th scope="col">Comida</th>
              <th scope="col">kcal</th>
              <th scope="col">Proteínas</th>
              <th scope="col">Grasas</th>
              <th scope="col">Hidratos</th>
              <th scope="col">Fibra</th>
            </tr>
          </thead>
          {days.map((d) => (
            <tbody key={d.day}>
              <tr className="nutri__day"><th colSpan={6} scope="colgroup">{dayEs(d.day)}</th></tr>
              {mealRow("Comida", d.lunch)}
              {mealRow("Cena", d.dinner)}
              <tr className="nutri__total">
                <th scope="row">Total del día</th>
                {cells(dayMacros(d))}
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
