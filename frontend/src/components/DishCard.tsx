import type { Dish, DietType } from "../types";

export const DIET_LABEL: Record<DietType, string> = {
  healthy: "Healthy",
  normal: "Normal",
  sport: "Deportista",
};

export function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}

interface Props {
  dish: Dish;
  selected?: boolean;
  onChoose?: () => void;
}

export default function DishCard({ dish, selected, onChoose }: Props) {
  return (
    <article className={`card dish${selected ? " selected" : ""}`}>
      <span className={`badge ${dish.diet_type}`}>{DIET_LABEL[dish.diet_type] ?? dish.diet_type}</span>
      <h3>{dish.name}</h3>
      <div className="kcal">
        {dish.kcal_per_serving} <small>kcal / ración</small>
      </div>
      <p className="small muted" style={{ margin: ".6rem 0 .2rem" }}>Ingredientes (por ración)</p>
      <ul className="plain small">
        {dish.ingredients.map((i, idx) => (
          <li key={`${i.name}-${idx}`}>
            {i.name} · {fmt(i.quantity)} {i.unit}
          </li>
        ))}
      </ul>
      {dish.uses_from_pantry.length > 0 && (
        <p className="small" style={{ marginTop: ".6rem" }}>
          ✓ Aprovecha de tu despensa: {dish.uses_from_pantry.join(", ")}
        </p>
      )}
      {onChoose && (
        <div className="row end" style={{ marginTop: ".8rem" }}>
          <button className={selected ? "" : "primary"} onClick={onChoose}>
            {selected ? "✓ Elegida" : "Elegir esta"}
          </button>
        </div>
      )}
    </article>
  );
}
