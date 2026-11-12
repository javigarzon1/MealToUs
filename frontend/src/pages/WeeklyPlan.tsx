import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { DIET_LABEL } from "../components/DishCard";
import { ErrorBox, Loading, Missing } from "../components/Feedback";
import FavoritesPanel from "../components/FavoritesPanel";
import { useAction } from "../hooks/useAction";
import { WIDE_QUERY, useMediaQuery } from "../hooks/useMediaQuery";
import { useChat } from "../state/ChatState";
import { usePlan } from "../state/PlanState";
import { WEEKDAYS_ES, dayEs, todayEs } from "../utils/days";
import DaySummary, { MealMacros } from "../components/DaySummary";
import NutritionSummary from "../components/NutritionSummary";
import { downloadPdf } from "../utils/pdf";
import { menuBlocks } from "../utils/pdfDocs";

export default function WeeklyPlan() {
  const { state, apiContext, setPlan, setShopping, setStartDay, setChecked } = usePlan();
  const navigate = useNavigate();
  const chat = useChat();
  const wide = useMediaQuery(WIDE_QUERY);
  const planAction = useAction();
  const shopAction = useAction();
  const { lunch, dinner, plan } = state;
  const ready = !!lunch && !!dinner;
  const busy = planAction.loading || shopAction.loading;

  async function generatePlan() {
    if (!lunch || !dinner) return;
    const res = await planAction.run(() => api.weeklyPlan(apiContext, lunch, dinner, state.startDay));
    if (res) setPlan(res);
  }

  function savePdf() {
    if (plan) downloadPdf("menu-semanal.pdf", menuBlocks(plan, state.preferences.max_kcal_per_day));
  }

  async function generateShopping() {
    if (!plan) return;
    const res = await shopAction.run(() => api.shopping(apiContext, plan));
    if (res) {
      setShopping(res);
      setChecked([]);
      navigate("/compra");
    }
  }

  const today = todayEs();
  const maxKcal = state.preferences.max_kcal_per_day;

  return (
    <section className="stack">
      <div className="page__head">
        <h2>Menú de los próximos 7 días</h2>
        <p className="page__lede">
          Una comida y una cena por día, siguiendo las calorías de las opciones que elegiste.
          La cena siempre es más ligera que la comida{maxKcal ? ` y ningún día pasa de ${maxKcal} kcal` : ""}.
        </p>
      </div>

      {!ready && !plan && (
        <Missing
          text="Necesitas elegir comida y cena antes de generar el menú."
          to={lunch ? "/cena" : "/comida"}
          cta={lunch ? "Elegir cena" : "Elegir comida"}
        />
      )}

      <fieldset className="daypicker">
        <legend>¿Qué día empiezas?</legend>
        <div className="daypicker__row" role="radiogroup" aria-label="Día de inicio del menú">
          {WEEKDAYS_ES.map((d) => (
            <label key={d} className={`daypicker__opt${state.startDay === d ? " is-on" : ""}`}>
              <input
                type="radio"
                name="startDay"
                value={d}
                checked={state.startDay === d}
                onChange={() => setStartDay(d)}
              />
              <span>{d}</span>
              {d === today && <small>hoy</small>}
            </label>
          ))}
        </div>
        {plan && <p className="muted small">El menú ya generado se reordena al instante con el día que elijas.</p>}
      </fieldset>

      <div className="actions">
        <button className="btn btn--primary" onClick={generatePlan} disabled={!ready || busy}>
          {plan ? "Generar otro menú" : "Generar menú semanal"}
        </button>
        {plan && (
          <button className="btn" onClick={savePdf} disabled={busy}>Descargar PDF</button>
        )}
      </div>

      {planAction.loading && <Loading text="Diseñando tu semana… puede tardar hasta un minuto." quiz />}
      <ErrorBox message={planAction.error} />

      {plan && (
        <>
          <div className="week-head">
            <span className={`badge badge--${plan.diet_type}`}>{DIET_LABEL[plan.diet_type] ?? plan.diet_type}</span>
            <span className="muted">Objetivo: unas {plan.target_kcal_per_day} kcal al día</span>
            {maxKcal && <span className="muted">Tope: {maxKcal} kcal</span>}
          </div>

          <div className="week">
            {plan.days.map((d) => {
              const total = d.lunch.kcal_per_serving + d.dinner.kcal_per_serving;
              const pct = Math.min(100, Math.round((total / Math.max(1, plan.target_kcal_per_day)) * 100));
              const isToday = dayEs(d.day) === today;
              return (
                <article key={d.day} className={`day day--${plan.diet_type}${isToday ? " day--today" : ""}`}>
                  <h3 className="day__name">
                    {dayEs(d.day)}
                    {isToday && <span className="day__today">hoy</span>}
                  </h3>
                  <div>
                    <div className="meal__when">Comida</div>
                    <div className="meal__name">{d.lunch.name}</div>
                    <div className="meal__kcal">{d.lunch.kcal_per_serving} kcal</div>
                    <MealMacros dish={d.lunch} />
                  </div>
                  <div>
                    <div className="meal__when">Cena</div>
                    <div className="meal__name">{d.dinner.name}</div>
                    <div className="meal__kcal">{d.dinner.kcal_per_serving} kcal</div>
                    <MealMacros dish={d.dinner} />
                  </div>
                  <div className="day__total">
                    <div className="day__total-row"><span>Total del día</span><span>{total} kcal</span></div>
                    <div className="bar" role="img" aria-label={`${pct}% del objetivo diario`}><span style={{ width: `${pct}%` }} /></div>
                  </div>
                  <DaySummary day={d} />
                  {isToday && (
                    <button
                      className="btn btn--small"
                      onClick={chat.askToday}
                    >
                      Cocinar hoy con el asistente
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <NutritionSummary days={plan.days} />

          <div className="cta-panel">
            <h3>¿Te gusta este menú?</h3>
            <p>
              Genera la lista de la compra (solo lo que te falta, para {state.preferences.people}{" "}
              {state.preferences.people === 1 ? "persona" : "personas"}) y las recetas.
            </p>
            {shopAction.loading && <Loading text="Preparando la compra y las recetas… puede tardar hasta un minuto." quiz />}
            <ErrorBox message={shopAction.error} />
            <div className="actions">
              <button className="btn btn--primary" onClick={generateShopping} disabled={busy}>
                Crear lista de la compra y recetas
              </button>
            </div>
          </div>
        </>
      )}

      {!wide && <FavoritesPanel />}

      <div className="actions actions--between">
        <button className="btn btn--quiet" onClick={() => navigate("/cena")}>Volver a cena</button>
        {state.shopping && (
          <button className="btn" onClick={() => navigate("/compra")}>Ver la compra ya generada</button>
        )}
      </div>
    </section>
  );
}
