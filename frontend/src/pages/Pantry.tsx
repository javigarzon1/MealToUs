import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox } from "../components/Feedback";
import PhotoScan from "../components/PhotoScan";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";
import type { PantryItem, PantryItemOut } from "../types";

const SUGGESTIONS: [string, string][] = [
  ["Huevos", "🥚"], ["Leche", "🥛"], ["Arroz", "🍚"], ["Pasta", "🍝"], ["Pollo", "🍗"],
  ["Tomate", "🍅"], ["Cebolla", "🧅"], ["Patatas", "🥔"], ["Atún", "🐟"], ["Yogur", "🍶"],
];

export default function Pantry() {
  const { state, setPantry } = usePlan();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const { error, run } = useAction();

  async function addItem(n: string, q?: string) {
    const clean = n.trim();
    if (!clean) return;
    if (state.pantry.some((p) => p.name.toLowerCase() === clean.toLowerCase())) return;
    const created = await run(() => api.addPantryItem({ name: clean, quantity: q?.trim() || null }));
    if (created) setPantry([...state.pantry, created]);
  }

  async function addMany(items: PantryItem[]): Promise<boolean> {
    const added = await run(async () => {
      const out: PantryItemOut[] = [];
      for (const it of items) out.push(await api.addPantryItem(it));
      return out;
    });
    if (added) setPantry([...state.pantry, ...added]);
    return Boolean(added);
  }

  async function removeItem(id: number) {
    const ok = await run(() => api.deletePantryItem(id).then(() => true));
    if (ok) setPantry(state.pantry.filter((x) => x.id !== id));
  }

  async function clearAll() {
    const ids = state.pantry.map((p) => p.id);
    const ok = await run(() => Promise.all(ids.map((id) => api.deletePantryItem(id))).then(() => true));
    if (ok) setPantry([]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await addItem(name, quantity);
    setName("");
    setQuantity("");
  }

  const missing = SUGGESTIONS.filter(([n]) => !state.pantry.some((p) => p.name.toLowerCase() === n.toLowerCase()));

  return (
    <section className="stack">
      <div className="page__head">
        <h2>¿Qué tienes en la nevera y la despensa?</h2>
        <p className="page__lede">
          Añade lo que ya tienes. La IA lo aprovechará al máximo para proponerte menús.
        </p>
      </div>

      <div className="pantry">
        <div className="stack">
          <PhotoScan pantry={state.pantry} onAdd={addMany} />
          <form className="form-block stack" onSubmit={onSubmit}>
            <label className="field">
              Alimento
              <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="p. ej. Huevos" />
            </label>
            <label className="field">
              <span>Cantidad <span className="field__hint">(opcional)</span></span>
              <input className="input" type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                placeholder="p. ej. 6 unidades" />
            </label>
            <button className="btn btn--primary" type="submit" disabled={!name.trim()}>Añadir a la despensa</button>
          </form>

          {missing.length > 0 && (
            <div className="stack stack--tight">
              <p className="small muted">Añadir rápido</p>
              <div className="chips">
                {missing.map(([n, e]) => (
                  <button key={n} type="button" className="suggest" onClick={() => void addItem(n)}>
                    <span aria-hidden="true">{e}</span> {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          <ErrorBox message={error} />
          <div className="pantry__list">
            <div className="pantry__list-head">
              <h3>Tu despensa ({state.pantry.length})</h3>
              {state.pantry.length > 0 && (
                <button className="btn btn--quiet btn--small btn--danger" onClick={() => void clearAll()}>Vaciar</button>
              )}
            </div>
            {state.pantry.length === 0 ? (
              <p className="empty">Todavía no has añadido nada. Empieza con lo que tengas a mano.</p>
            ) : (
              <div>
                {state.pantry.map((p) => (
                  <div className="pantry__row" key={p.id}>
                    <span className="grow">
                      <span className="pantry__name">{p.name}</span>
                      {p.quantity && <span className="pantry__qty"> {p.quantity}</span>}
                    </span>
                    <button className="btn btn--quiet btn--small btn--danger" aria-label={`Quitar ${p.name}`}
                      onClick={() => void removeItem(p.id)}>Quitar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="actions actions--end">
        <button className="btn btn--primary" disabled={state.pantry.length === 0} onClick={() => navigate("/preferencias")}>
          Siguiente: preferencias
        </button>
      </div>
    </section>
  );
}
