import { useNavigate } from "react-router-dom";
import { useChat } from "../state/ChatState";
import { usePlan } from "../state/PlanState";
import type { Dish } from "../types";
import { DIET_EMOJI } from "./DishCard";

function Meal({ label, dish }: { label: string; dish: Dish | null }) {
  if (!dish) return null;
  return (
    <li className="today__meal">
      <span className="today__emoji" aria-hidden="true">{DIET_EMOJI[dish.diet_type] ?? "🍽️"}</span>
      <div>
        <span className="today__label">{label}</span>
        <strong className="today__dish">{dish.name}</strong>
      </div>
      <span className="today__kcal">{dish.kcal_per_serving} kcal</span>
    </li>
  );
}

/** Qué toca hoy: comida, cena y calorías del día frente al tope. */
export default function TodayPanel() {
  const { state } = usePlan();
  const { today, askToday } = useChat();
  const navigate = useNavigate();
  const max = state.preferences.max_kcal_per_day;
  // Lo comprado: se cuentan solo las marcas que siguen correspondiendo a un producto de la lista
  const shopTotal = state.extraItems.length + (state.shopping?.shopping_list.length ?? 0);
  const shopDone = state.checked.filter((k) => {
    const n = Number(k.slice(2));
    return k.startsWith("x-") ? n < state.extraItems.length : n < (state.shopping?.shopping_list.length ?? 0);
  }).length;
  const shopPct = shopTotal ? Math.round((shopDone / shopTotal) * 100) : null;

  const shop = shopPct !== null && (
    <div className="today__shop">
      <div className="today__sum">
        <strong>Compra</strong>
        <span className="muted small">{shopDone} de {shopTotal} productos</span>
      </div>
      <div className="bar" role="img" aria-label={`${shopPct}% de la compra hecha`}><span style={{ width: `${shopPct}%` }} /></div>
      <button className="btn btn--small" onClick={() => navigate("/compra")}>
        {shopDone === shopTotal ? "Compra completa" : "Seguir con la compra"}
      </button>
    </div>
  );

  if (!today) {
    const next = state.pantry.length === 0 ? "/" : !state.lunch ? "/comida" : !state.dinner ? "/cena" : "/semana";
    return (
      <section className="today" aria-label="Hoy">
        <h2 className="today__title">Hoy</h2>
        <p className="small muted">
          Todavía no tienes menú. Genera el de la semana y aquí verás qué te toca cocinar cada día.
        </p>
        <button className="btn btn--small btn--primary" onClick={() => navigate(next)}>
          {next === "/semana" ? "Generar el menú" : "Empezar"}
        </button>
        {shop}
      </section>
    );
  }

  const kcal = (today.lunch?.kcal_per_serving ?? 0) + (today.dinner?.kcal_per_serving ?? 0);
  const pct = max ? Math.min(100, Math.round((kcal / max) * 100)) : null;

  return (
    <section className="today" aria-label="Hoy">
      <h2 className="today__title">Hoy, <span className="today__day">{today.day}</span></h2>
      <ul className="today__list">
        <Meal label="Comida" dish={today.lunch} />
        <Meal label="Cena" dish={today.dinner} />
      </ul>
      <div className="today__total">
        <div className="today__sum">
          <strong>{kcal} kcal</strong>
          <span className="muted small">{max ? `de ${max} kcal` : "en total"}</span>
        </div>
        {pct !== null && (
          <div className="bar" role="img" aria-label={`${pct}% del tope diario`}><span style={{ width: `${pct}%` }} /></div>
        )}
      </div>
      <div className="actions">
        <button className="btn btn--small btn--primary" onClick={askToday}>Receta de hoy</button>
        <button className="btn btn--small" onClick={() => navigate("/semana")}>Ver semana</button>
      </div>
      {shop}
    </section>
  );
}
