import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { fmt } from "../components/DishCard";
import { ErrorBox, Loading, Missing } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";
import type { ShoppingItem, SupermarketLinks } from "../types";

const SUPERMARKETS = [
  { id: "mercadona", label: "Mercadona" },
  { id: "carrefour", label: "Carrefour" },
  { id: "hipercor", label: "Hipercor" },
];

export default function ShoppingList() {
  const { state, apiContext, setShopping } = usePlan();
  const navigate = useNavigate();
  const shopAction = useAction();
  const linkAction = useAction();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [links, setLinks] = useState<SupermarketLinks | null>(null);
  const [copied, setCopied] = useState(false);

  const { plan, shopping } = state;

  const byCategory = useMemo(() => {
    const groups = new Map<string, ShoppingItem[]>();
    for (const it of shopping?.shopping_list ?? []) {
      const cat = it.category || "Otros";
      groups.set(cat, [...(groups.get(cat) ?? []), it]);
    }
    return [...groups.entries()];
  }, [shopping]);

  async function generate() {
    if (!plan) return;
    const res = await shopAction.run(() => api.shopping(apiContext, plan));
    if (res) {
      setShopping(res);
      setChecked(new Set());
      setLinks(null);
    }
  }

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function openSupermarket(id: string) {
    if (!shopping) return;
    const res = await linkAction.run(() => api.supermarketLinks(id, shopping.shopping_list));
    if (res) setLinks(res);
  }

  async function copyList() {
    if (!shopping) return;
    const text = byCategory
      .map(([cat, items]) => `${cat}\n${items.map((i) => `- ${i.name}: ${fmt(i.quantity)} ${i.unit}`).join("\n")}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  }

  return (
    <section className="stack">
      <div>
        <h2>Lista de la compra y recetas</h2>
        <p className="muted">
          Solo lo que te falta para tu menú, para {state.preferences.people}{" "}
          {state.preferences.people === 1 ? "persona" : "personas"}.
        </p>
      </div>

      {!plan && <Missing text="Primero genera tu menú semanal." to="/semana" cta="Ir al menú semanal" />}

      {plan && !shopping && (
        <div className="row">
          <button className="primary" onClick={generate} disabled={shopAction.loading}>
            Crear lista de la compra y recetas
          </button>
        </div>
      )}
      {shopAction.loading && <Loading text="Preparando la compra y las recetas… puede tardar hasta un minuto." />}
      <ErrorBox message={shopAction.error} />

      {shopping && (
        <>
          <div className="card stack">
            <div className="row spread">
              <h3>
                Compra ({checked.size}/{shopping.shopping_list.length})
              </h3>
              <button onClick={copyList}>{copied ? "✓ Copiada" : "Copiar lista"}</button>
            </div>

            {byCategory.length === 0 && <p className="muted">No falta nada: ¡ya lo tienes todo!</p>}

            {byCategory.map(([cat, items]) => (
              <div key={cat}>
                <h3 style={{ textTransform: "capitalize" }}>{cat}</h3>
                <ul className="clean">
                  {items.map((it, idx) => {
                    const key = `${cat}-${it.name}-${idx}`;
                    const done = checked.has(key);
                    return (
                      <li key={key}>
                        <input
                          id={key}
                          type="checkbox"
                          checked={done}
                          onChange={() => toggle(key)}
                        />
                        <label htmlFor={key} className={`grow${done ? " checked" : ""}`}>
                          {it.name}
                        </label>
                        <span className="muted">
                          {fmt(it.quantity)} {it.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="card stack">
            <h3>Comprar online</h3>
            <p className="muted small" style={{ margin: 0 }}>
              Te generamos un enlace de búsqueda por producto en el supermercado que elijas. Los carritos
              automáticos no están disponibles porque las cadenas no ofrecen API pública.
            </p>
            <div className="row">
              {SUPERMARKETS.map((s) => (
                <button key={s.id} onClick={() => openSupermarket(s.id)} disabled={linkAction.loading}>
                  {s.label}
                </button>
              ))}
            </div>
            {linkAction.loading && <Loading text="Generando enlaces…" />}
            <ErrorBox message={linkAction.error} />
            {links && (
              <ul className="clean">
                {links.links.map((l) => (
                  <li key={l.item}>
                    <span className="grow">{l.item}</span>
                    <a href={l.url} target="_blank" rel="noreferrer noopener">
                      Buscar en {links.supermarket} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="stack">
            <h3>Recetas ({shopping.recipes.length})</h3>
            <div>
              {shopping.recipes.map((r, idx) => (
                <details className="recipe" key={`${r.dish_name}-${idx}`}>
                  <summary>
                    {r.dish_name}{" "}
                    <span className="muted small">
                      · {r.prep_minutes} min · {r.servings} {r.servings === 1 ? "ración" : "raciones"}
                    </span>
                  </summary>
                  <h3 style={{ marginTop: ".8rem" }}>Ingredientes</h3>
                  <ul className="plain">
                    {r.ingredients.map((i, k) => (
                      <li key={`${i.name}-${k}`}>
                        {i.name} · {fmt(i.quantity)} {i.unit}
                      </li>
                    ))}
                  </ul>
                  <h3 style={{ marginTop: ".8rem" }}>Preparación</h3>
                  <ol>
                    {r.steps.map((s, k) => (
                      <li key={k}>{s}</li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="row spread">
        <button onClick={() => navigate("/semana")}>← Menú semanal</button>
        {shopping && plan && (
          <button onClick={generate} disabled={shopAction.loading}>
            Regenerar compra y recetas
          </button>
        )}
      </div>
    </section>
  );
}
