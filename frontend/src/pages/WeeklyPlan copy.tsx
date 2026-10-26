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
      <div>
        <h2>Menú de los próximos 7 días</h2>
        <p className="muted">
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

      <div className="row">
        <button className="primary" onClick={generatePlan} disabled={!ready || busy}>
          {plan ? "Generar otro menú" : "Generar menú semanal"}
        </button>
      </div>

      {planAction.loading && <Loading text="Diseñando tu semana… puede tardar hasta un minuto." />}
      <ErrorBox message={planAction.error} />

      {plan && (
        <>
          <div className="row">
            <span className={`badge ${plan.diet_type}`}>{DIET_LABEL[plan.diet_type] ?? plan.diet_type}</span>
            <span className="muted">Objetivo: ~{plan.target_kcal_per_day} kcal/día</span>
          </div>

          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Comida</th>
                  <th>Cena</th>
                  <th>kcal/día</th>
                </tr>
              </thead>
              <tbody>
                {plan.days.map((d) => (
                  <tr key={d.day}>
                    <td>
                      <strong>{d.day}</strong>
                    </td>
                    <td>
                      {d.lunch.name}
                      <div className="small muted">{d.lunch.kcal_per_serving} kcal</div>
                    </td>
                    <td>
                      {d.dinner.name}
                      <div className="small muted">{d.dinner.kcal_per_serving} kcal</div>
                    </td>
                    <td>{d.lunch.kcal_per_serving + d.dinner.kcal_per_serving}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card stack">
            <h3>¿Te gusta este menú?</h3>
            <p className="muted" style={{ margin: 0 }}>
              Genera la lista de la compra (solo lo que te falta, para {state.preferences.people}{" "}
              {state.preferences.people === 1 ? "persona" : "personas"}) y las recetas.
            </p>
            {shopAction.loading && <Loading text="Preparando la compra y las recetas… puede tardar hasta un minuto." />}
            <ErrorBox message={shopAction.error} />
            <div className="row">
              <button className="primary" onClick={generateShopping} disabled={busy}>
                Crear lista de la compra y recetas →
              </button>
            </div>
          </div>
        </>
      )}

      <div className="row spread">
        <button onClick={() => navigate("/cena")}>← Cena</button>
        {state.shopping && (
          <button onClick={() => navigate("/compra")}>Ver la compra ya generada →</button>
        )}
      </div>
    </section>
  );
}
