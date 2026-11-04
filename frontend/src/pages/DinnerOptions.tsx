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
      <div className="page__head">
        <h2>Elige tu cena</h2>
        <p className="page__lede">Tres opciones de cena que complementan la comida que has elegido.</p>
      </div>

      {!lunch ? (
        <Missing text="Primero elige una comida." to="/comida" cta="Ir a la comida" />
      ) : (
        <div className="note">
          <p>Comida elegida: <strong>{lunch.name}</strong>, {lunch.kcal_per_serving} kcal</p>
        </div>
      )}

      <div className="actions">
        <button className="btn btn--primary" onClick={generate} disabled={loading || !lunch}>
          {state.dinnerOptions ? "Generar otras opciones" : "Generar opciones de cena"}
        </button>
      </div>

      {loading && <Loading text="La IA está preparando las cenas…" />}
      <ErrorBox message={error} />

      {state.dinnerOptions && (
        <div className="dishes">
          {state.dinnerOptions.options.map((d, i) => (
            <DishCard
              key={d.name}
              dish={d}
              index={i}
              selected={state.dinner?.name === d.name}
              onChoose={() => chooseDinner(d)}
            />
          ))}
        </div>
      )}

      <div className="actions actions--between">
        <button className="btn btn--quiet" onClick={() => navigate("/comida")}>Volver a comida</button>
        <button className="btn btn--primary" disabled={!state.dinner} onClick={() => navigate("/semana")}>
          Siguiente: menú semanal
        </button>
      </div>
    </section>
  );
}
