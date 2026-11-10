import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";
import type { FavoriteMenu, HistoryEntry, WeeklyPlan } from "../types";
import { relabelDays } from "../utils/days";
import { DIET_LABEL } from "./DishCard";
import { ErrorBox } from "./Feedback";

/** Menús semanales guardados: se guardan con un nombre y se recuperan con un clic. */
export default function FavoritesPanel() {
  const { state, setPlan } = usePlan();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteMenu[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const action = useAction();
  const { plan, startDay } = state;

  useEffect(() => {
    let cancelled = false;
    api.listFavorites().then((f) => !cancelled && setFavorites(f)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // El historial lo anota el servidor al generar cada menú: se vuelve a leer cuando cambia el menú
  useEffect(() => {
    let cancelled = false;
    api.listHistory().then((h) => !cancelled && setHistory(h)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [plan]);

  async function save() {
    const n = name.trim();
    if (!plan || !n) return;
    const res = await action.run(() => api.saveFavorite(n, plan));
    if (res) {
      setFavorites((prev) => [...prev.filter((f) => f.id !== res.id), res].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setMsg(`Guardado «${res.name}».`);
    }
  }

  function load(menu: WeeklyPlan, label: string) {
    // El menú se ordena a partir del día de inicio que tengas elegido
    setPlan({ ...menu, days: relabelDays(menu.days, startDay) });
    setMsg(`Cargado «${label}».`);
    navigate("/semana");
  }

  const use = (f: FavoriteMenu) => load(f.plan, f.name);

  const when = (iso: string) =>
    new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  async function keep(h: HistoryEntry) {
    const day = new Date(h.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    const res = await action.run(() => api.saveFavorite(`Menú del ${day}`, h.plan));
    if (res) {
      setFavorites((prev) => [...prev.filter((f) => f.id !== res.id), res].sort((a, b) => a.name.localeCompare(b.name)));
      setMsg(`Guardado en favoritos como «${res.name}».`);
    }
  }

  async function removeEntry(h: HistoryEntry) {
    const ok = await action.run(() => api.deleteHistory(h.id).then(() => true));
    if (ok) setHistory((prev) => prev.filter((x) => x.id !== h.id));
  }

  async function remove(f: FavoriteMenu) {
    const ok = await action.run(() => api.deleteFavorite(f.id).then(() => true));
    if (ok) setFavorites((prev) => prev.filter((x) => x.id !== f.id));
  }

  return (
    <section className="favs" aria-label="Menús favoritos">
      <h2 className="favs__title"><span aria-hidden="true">⭐</span> Mis menús</h2>

      {plan ? (
        <form
          className="favs__save"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="field">
            Guardar el menú actual
            <input
              className="input"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. Semana ligera"
            />
          </label>
          <button className="btn btn--small" type="submit" disabled={!name.trim() || action.loading}>
            Guardar
          </button>
        </form>
      ) : (
        <p className="small muted">Genera un menú semanal para poder guardarlo aquí.</p>
      )}

      {msg && <div className="note" role="status"><p>{msg}</p></div>}
      <ErrorBox message={action.error} />

      {favorites.length === 0 ? (
        <p className="small muted">Aún no has guardado ninguno. Si repites el nombre, se sustituye.</p>
      ) : (
        <ul className="favs__list">
          {favorites.map((f) => (
            <li key={f.id} className="fav">
              <div className="fav__top">
                <strong className="fav__name">{f.name}</strong>
                <span className={`badge badge--${f.plan.diet_type}`}>{DIET_LABEL[f.plan.diet_type] ?? f.plan.diet_type}</span>
              </div>
              <div className="fav__meta">
                {f.plan.target_kcal_per_day} kcal/día · {f.plan.days[0]?.lunch.name}…
              </div>
              <div className="actions">
                <button className="btn btn--small btn--primary" onClick={() => use(f)}>Usar</button>
                <button className="btn btn--small btn--quiet btn--danger" onClick={() => void remove(f)} disabled={action.loading}>
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <details className="hist">
        <summary>Historial reciente ({history.length})</summary>
        {history.length === 0 ? (
          <p className="small muted">Aquí aparecerán los menús que vayas generando (se guardan los últimos 10).</p>
        ) : (
          <ul className="favs__list">
            {history.map((h) => (
              <li key={h.id} className="fav">
                <div className="fav__top">
                  <strong className="fav__name">{when(h.created_at)}</strong>
                  <span className={`badge badge--${h.plan.diet_type}`}>{DIET_LABEL[h.plan.diet_type] ?? h.plan.diet_type}</span>
                </div>
                <div className="fav__meta">
                  {h.plan.target_kcal_per_day} kcal/día · {h.plan.days[0]?.lunch.name}…
                </div>
                <div className="actions">
                  <button className="btn btn--small btn--primary" onClick={() => load(h.plan, when(h.created_at))}>Usar</button>
                  <button className="btn btn--small" onClick={() => void keep(h)} disabled={action.loading}>⭐ Guardar</button>
                  <button className="icon-btn" onClick={() => void removeEntry(h)} aria-label="Quitar del historial" title="Quitar">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
