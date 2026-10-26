import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import DishCard from "../components/DishCard";
import { ErrorBox, Loading, Missing } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";

export default function DinnerOptions() {
  const { state, apiContext, setDinnerOptions, chooseDinner } = usePlan();
  const navigate = useNavigate();
  const { loading, error, run } = useAction();
  const lunch = state.lunch;

  async function generate() {
    if (!lunch) return;
    const res = await run(() => api.dinnerOptions(apiContext, lunch));
    if (res) setDinnerOptions(res);
  }

  return (
    <section className="stack">
      <div>
        <h2>Elige tu cena</h2>
        <p className="muted">Tres opciones de cena que complementan la comida que has elegido.</p>
      </div>

      {!lunch ? (
        <Missing text="Primero elige una comida." to="/comida" cta="Ir a la comida" />
      ) : (
        <div className="notice info">
          Comida elegida: <strong>{lunch.name}</strong> · {lunch.kcal_per_serving} kcal
        </div>
      )}

      <div className="row">
        <button className="primary" onClick={generate} disabled={loading || !lunch}>
          {state.dinnerOptions ? "Generar otras opciones" : "Generar opciones de cena"}
        </button>
      </div>

      {loading && <Loading text="La IA está preparando las cenas…" />}
      <ErrorBox message={error} />

      {state.dinnerOptions && (
        <div className="grid cols-3">
          {state.dinnerOptions.options.map((d) => (
            <DishCard
              key={d.name}
              dish={d}
              selected={state.dinner?.name === d.name}
              onChoose={() => chooseDinner(d)}
            />
          ))}
        </div>
      )}

      <div className="row spread">
        <button onClick={() => navigate("/comida")}>← Comida</button>
        <button className="primary" disabled={!state.dinner} onClick={() => navigate("/semana")}>
          Siguiente: menú semanal →
        </button>
      </div>
    </section>
  );
}
