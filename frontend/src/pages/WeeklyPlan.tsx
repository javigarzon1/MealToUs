import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { DIET_LABEL } from "../components/DishCard";
import { ErrorBox, Loading, Missing } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";

export default function WeeklyPlan() {
  const { state, apiContext, setPlan, setShopping } = usePlan();
  const navigate = useNavigate();
  const planAction = useAction();
  const shopAction = useAction();
  const { lunch, dinner, plan } = state;
  const ready = !!lunch && !!dinner;
  const busy = planAction.loading || shopAction.loading;

  async function generatePlan() {
    if (!lunch || !dinner) return;
    const res = await planAction.run(() => api.weeklyPlan(apiContext, lunch, dinner));
    if (res) setPlan(res);
  }

  async function generateShopping() {
    if (!plan) return;
    const res = await shopAction.run(() => api.shopping(apiContext, plan));
    if (res) {
      setShopping(res);
      navigate("/compra");
    }
  }

  return (
    <section className="stack">
      <div className="page__head">
        <h2>Menú de los próximos 7 días</h2>
        <p className="page__lede">
          Una comida y una cena por día, siguiendo las calorías de las opciones que elegiste.
        </p>
      </div>

      {!ready && (
        <Missing
          text="Necesitas elegir comida y cena antes de generar el menú."
          to={lunch ? "/cena" : "/comida"}
          cta={lunch ? "Elegir cena" : "Elegir comida"}
        />
      )}

      <div className="actions">
        <button className="btn btn--primary" onClick={generatePlan} disabled={!ready || busy}>
          {plan ? "Generar otro menú" : "Generar menú semanal"}
        </button>
      </div>

      {planAction.loading && <Loading text="Diseñando tu semana… puede tardar hasta un minuto." />}
      <ErrorBox message={planAction.error} />

      {plan && (
        <>
          <div className="week-head">
            <span className={`badge badge--${plan.diet_type}`}>{DIET_LABEL[plan.diet_type] ?? plan.diet_type}</span>
            <span className="muted">Objetivo: unas {plan.target_kcal_per_day} kcal al día</span>
          </div>

          <div className="week">
            {plan.days.map((d) => {
              const total = d.lunch.kcal_per_serving + d.dinner.kcal_per_serving;
              const pct = Math.min(100, Math.round((total / Math.max(1, plan.target_kcal_per_day)) * 100));
              return (
                <article key={d.day} className={`day day--${plan.diet_type}`}>
                  <h3 className="day__name">{d.day}</h3>
                  <div>
                    <div className="meal__when">Comida</div>
                    <div className="meal__name">{d.lunch.name}</div>
                    <div className="meal__kcal">{d.lunch.kcal_per_serving} kcal</div>
                  </div>
                  <div>
                    <div className="meal__when">Cena</div>
                    <div className="meal__name">{d.dinner.name}</div>
                    <div className="meal__kcal">{d.dinner.kcal_per_serving} kcal</div>
                  </div>
                  <div className="day__total">
                    <div className="day__total-row"><span>Total del día</span><span>{total} kcal</span></div>
                    <div className="bar" role="img" aria-label={`${pct}% del objetivo diario`}><span style={{ width: `${pct}%` }} /></div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="cta-panel">
            <h3>¿Te gusta este menú?</h3>
            <p>
              Genera la lista de la compra (solo lo que te falta, para {state.preferences.people}{" "}
              {state.preferences.people === 1 ? "persona" : "personas"}) y las recetas.
            </p>
            {shopAction.loading && <Loading text="Preparando la compra y las recetas… puede tardar hasta un minuto." />}
            <ErrorBox message={shopAction.error} />
            <div className="actions">
              <button className="btn btn--primary" onClick={generateShopping} disabled={busy}>
                Crear lista de la compra y recetas
              </button>
            </div>
          </div>
        </>
      )}

      <div className="actions actions--between">
        <button className="btn btn--quiet" onClick={() => navigate("/cena")}>Volver a cena</button>
        {state.shopping && (
          <button className="btn" onClick={() => navigate("/compra")}>Ver la compra ya generada</button>
        )}
      </div>
    </section>
  );
}
