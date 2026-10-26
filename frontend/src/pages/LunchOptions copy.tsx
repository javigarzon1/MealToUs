import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import DishCard from "../components/DishCard";
import { ErrorBox, Loading, Missing } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";

export default function LunchOptions() {
  const { state, apiContext, setLunchOptions, chooseLunch } = usePlan();
  const navigate = useNavigate();
  const { loading, error, run } = useAction();

  async function generate() {
    const res = await run(() => api.lunchOptions(apiContext));
    if (res) setLunchOptions(res);
  }

  return (
    <section className="stack">
      <div>
        <h2>Elige tu comida</h2>
        <p className="muted">
          La IA propone tres opciones con lo que tienes: Healthy, Normal y Deportista. La que elijas fija
          las calorías de referencia para el resto de la semana.
        </p>
      </div>

      {state.pantry.length === 0 && (
        <Missing text="Primero añade algo a tu despensa." to="/" cta="Ir a la despensa" />
      )}

      <div className="row">
        <button className="primary" onClick={generate} disabled={loading || state.pantry.length === 0}>
          {state.lunchOptions ? "Generar otras opciones" : "Generar opciones de comida"}
        </button>
      </div>

      {loading && <Loading text="La IA está preparando las opciones… puede tardar unos segundos." />}
      <ErrorBox message={error} />

      {state.lunchOptions && (
        <div className="grid cols-3">
          {state.lunchOptions.options.map((d) => (
            <DishCard
              key={d.name}
              dish={d}
              selected={state.lunch?.name === d.name}
              onChoose={() => chooseLunch(d)}
            />
          ))}
        </div>
      )}

      <div className="row spread">
        <button onClick={() => navigate("/preferencias")}>← Preferencias</button>
        <button className="primary" disabled={!state.lunch} onClick={() => navigate("/cena")}>
          Siguiente: cena →
        </button>
      </div>
    </section>
  );
}
