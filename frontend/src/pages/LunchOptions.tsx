import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import DishCard from "../components/DishCard";
import { ErrorBox, Loading, Missing } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";

export default function LunchOptions() {
  const { state, apiContext, setLunchOptions, chooseLunch } = usePlan();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, run } = useAction();
  const autoDone = useRef(false);

  async function generate() {
    const res = await run(() => api.lunchOptions(apiContext));
    if (res) setLunchOptions(res);
  }

  // Al llegar desde "Siguiente: comida" se generan solas las tres opciones
  useEffect(() => {
    const nav = location.state as { auto?: boolean; force?: boolean } | null;
    if (!nav?.auto || autoDone.current) return;
    autoDone.current = true;
    navigate(location.pathname, { replace: true, state: null }); // recargar no vuelve a generar
    if (state.pantry.length > 0 && (nav.force || !state.lunchOptions)) void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="stack">
      <div className="page__head">
        <h2>¿Qué comemos hoy?</h2>
        <p className="page__lede">
          La IA propone tres opciones con lo que tienes: Healthy, Normal y Deportista. La que elijas fija
          las calorías de referencia para el resto de la semana.
        </p>
      </div>

      {state.pantry.length === 0 && (
        <Missing text="Primero añade algo a tu despensa." to="/" cta="Ir a la despensa" />
      )}

      <div className="actions">
        <button className="btn btn--primary" onClick={generate} disabled={loading || state.pantry.length === 0}>
          {state.lunchOptions ? "Generar otras opciones" : "Generar opciones de comida"}
        </button>
      </div>

      {loading && <Loading text="La IA está preparando las opciones… puede tardar unos segundos." />}
      <ErrorBox message={error} />

      {state.lunchOptions && (
        <div className="dishes">
          {state.lunchOptions.options.map((d, i) => (
            <DishCard
              key={d.name}
              dish={d}
              index={i}
              selected={state.lunch?.name === d.name}
              onChoose={() => chooseLunch(d)}
            />
          ))}
        </div>
      )}

      <div className="actions actions--between">
        <button className="btn btn--quiet" onClick={() => navigate("/preferencias")}>Volver a preferencias</button>
        <button className="btn btn--primary" disabled={!state.lunch} onClick={() => navigate("/cena")}>
          Siguiente: cena
        </button>
      </div>
    </section>
  );
}
