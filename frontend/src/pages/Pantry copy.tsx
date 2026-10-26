import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { usePlan } from "../state/PlanState";

const SUGGESTIONS = ["Huevos", "Leche", "Arroz", "Pasta", "Pollo", "Tomate", "Cebolla", "Patatas", "Atún", "Yogur"];

export default function Pantry() {
  const { state, setPantry } = usePlan();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  function addItem(n: string, q?: string) {
    const clean = n.trim();
    if (!clean) return;
    if (state.pantry.some((p) => p.name.toLowerCase() === clean.toLowerCase())) return;
    setPantry([...state.pantry, { name: clean, quantity: q?.trim() || null }]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    addItem(name, quantity);
    setName("");
    setQuantity("");
  }

  return (
    <section className="stack">
      <div>
        <h2>¿Qué tienes en la nevera y la despensa?</h2>
        <p className="muted">
          Añade los alimentos que ya tienes. La IA los aprovechará al máximo para proponerte menús.
        </p>
      </div>

      <form className="card row" onSubmit={onSubmit}>
        <label className="field" style={{ flex: "2 1 200px" }}>
          Alimento
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p. ej. Huevos"
          />
        </label>
        <label className="field" style={{ flex: "1 1 140px" }}>
          Cantidad <span className="hint">(opcional)</span>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="p. ej. 6 unidades"
          />
        </label>
        <button className="primary" type="submit" style={{ alignSelf: "end" }} disabled={!name.trim()}>
          Añadir
        </button>
      </form>

      <div>
        <p className="small muted">Añadir rápido:</p>
        <div className="chips">
          {SUGGESTIONS.filter((s) => !state.pantry.some((p) => p.name.toLowerCase() === s.toLowerCase())).map((s) => (
            <button key={s} type="button" onClick={() => addItem(s)}>
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row spread">
          <h3>Tu despensa ({state.pantry.length})</h3>
          {state.pantry.length > 0 && (
            <button className="link" onClick={() => setPantry([])}>
              Vaciar
            </button>
          )}
        </div>
        {state.pantry.length === 0 ? (
          <p className="muted">Todavía no has añadido nada.</p>
        ) : (
          <ul className="clean">
            {state.pantry.map((p) => (
              <li key={p.name}>
                <span className="grow">
                  <strong>{p.name}</strong>
                  {p.quantity && <span className="muted"> · {p.quantity}</span>}
                </span>
                <button
                  className="link"
                  aria-label={`Quitar ${p.name}`}
                  onClick={() => setPantry(state.pantry.filter((x) => x.name !== p.name))}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="row end">
        <button className="primary" disabled={state.pantry.length === 0} onClick={() => navigate("/preferencias")}>
          Siguiente: preferencias →
        </button>
      </div>
    </section>
  );
}
