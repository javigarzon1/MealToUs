import type { Dish, DietType } from "../types";

export const DIET_LABEL: Record<DietType, string> = {
  healthy: "Healthy",
  normal: "Normal",
  sport: "Deportista",
};

export const DIET_EMOJI: Record<DietType, string> = { healthy: "🥗", normal: "🍳", sport: "🍗" };

export function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}

interface Props {
  dish: Dish;
  selected?: boolean;
  index?: number;
  onChoose?: () => void;
}

/** La "ficha" del plato: banda del color de la dieta, kcal grandes e ingredientes con línea de puntos. */
export default function DishCard({ dish, selected, index = 0, onChoose }: Props) {
  return (
    <article
      className={`dish dish--${dish.diet_type}${selected ? " is-chosen" : ""}`}
      style={{ ["--i" as string]: index }}
    >
      <div className="dish__band">
        <div className="dish__emoji" aria-hidden="true">{DIET_EMOJI[dish.diet_type] ?? "🍽️"}</div>
        <div className="dish__kind">{DIET_LABEL[dish.diet_type] ?? dish.diet_type}</div>
        <h3 className="dish__name">{dish.name}</h3>
      </div>
      <div className="dish__body">
        <div className="dish__kcal">
          <strong>{dish.kcal_per_serving}</strong>
          <span>kcal por ración</span>
        </div>
        <div>
          <p className="dish__sub">Ingredientes por ración</p>
          <ul className="leaders">
            {dish.ingredients.map((i, idx) => (
              <li key={`${i.name}-${idx}`}>
                <span>{i.name}</span>
                <span className="leaders__fill" aria-hidden="true" />
                <span className="leaders__qty">{fmt(i.quantity)} {i.unit}</span>
              </li>
            ))}
          </ul>
        </div>
        {dish.uses_from_pantry.length > 0 && (
          <p className="dish__pantry">De tu despensa: {dish.uses_from_pantry.join(", ")}</p>
        )}
        {onChoose && (
          <div className="dish__foot">
            <button className={`btn ${selected ? "" : "btn--primary"}`} onClick={onChoose} aria-pressed={!!selected}>
              {selected ? "Elegida" : "Me la pido"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
