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

  const total = shopping?.shopping_list.length ?? 0;
  const pct = total ? Math.round((checked.size / total) * 100) : 0;

  return (
    <section className="stack">
      <div className="page__head">
        <h2>Lista de la compra y recetas</h2>
        <p className="page__lede">
          Solo lo que te falta para tu menú, para {state.preferences.people}{" "}
          {state.preferences.people === 1 ? "persona" : "personas"}.
        </p>
      </div>

      {!plan && <Missing text="Primero genera tu menú semanal." to="/semana" cta="Ir al menú semanal" />}

      {plan && !shopping && (
        <div className="actions">
          <button className="btn btn--primary" onClick={generate} disabled={shopAction.loading}>
            Crear lista de la compra y recetas
          </button>
        </div>
      )}
      {shopAction.loading && <Loading text="Preparando la compra y las recetas… puede tardar hasta un minuto." />}
      <ErrorBox message={shopAction.error} />

      {shopping && (
        <>
          <div className="stack">
            <div className="actions actions--between">
              <h3>Tu compra</h3>
              <button className="btn btn--small" onClick={copyList}>{copied ? "Copiada" : "Copiar lista"}</button>
            </div>
            <div className="progress">
              <div className="bar" role="img" aria-label={`${pct}% comprado`}><span style={{ width: `${pct}%` }} /></div>
              <span className="progress__n">{checked.size} de {total}</span>
            </div>

            {byCategory.length === 0 && <p className="empty">No falta nada: ya lo tienes todo.</p>}

            <div className="shop-groups">
              {byCategory.map(([cat, items]) => (
                <div key={cat} className="shop-group">
                  <h3>{cat}</h3>
                  {items.map((it, idx) => {
                    const key = `${cat}-${it.name}-${idx}`;
                    const done = checked.has(key);
                    return (
                      <div key={key} className={`check-row${done ? " is-done" : ""}`}>
                        <input id={key} className="check" type="checkbox" checked={done} onChange={() => toggle(key)} />
                        <label htmlFor={key}>{it.name}</label>
                        <span className="leaders__qty">{fmt(it.quantity)} {it.unit}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="market">
            <h3>Comprar online</h3>
            <p className="muted small">
              Te generamos un enlace de búsqueda por producto en el supermercado que elijas. Los carritos
              automáticos no están disponibles porque las cadenas no ofrecen API pública.
            </p>
            <div className="actions">
              {SUPERMARKETS.map((s) => (
                <button key={s.id} className="btn btn--small" onClick={() => openSupermarket(s.id)} disabled={linkAction.loading}>
                  {s.label}
                </button>
              ))}
            </div>
            {linkAction.loading && <Loading text="Generando enlaces…" />}
            <ErrorBox message={linkAction.error} />
            {links && (
              <ul className="link-list">
                {links.links.map((l) => (
                  <li key={l.item}>
                    <span>{l.item}</span>
                    <a href={l.url} target="_blank" rel="noreferrer noopener">
                      Buscar en {links.supermarket}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="stack">
            <h3>Recetas ({shopping.recipes.length})</h3>
            <div className="recipes">
              {shopping.recipes.map((r, idx) => (
                <details className="recipe" key={`${r.dish_name}-${idx}`}>
                  <summary>
                    {r.dish_name}
                    <span className="recipe__meta">
                      {r.prep_minutes} min, {r.servings} {r.servings === 1 ? "ración" : "raciones"}
                    </span>
                  </summary>
                  <div className="recipe__body">
                    <div>
                      <h4>Ingredientes</h4>
                      <ul className="leaders">
                        {r.ingredients.map((i, k) => (
                          <li key={`${i.name}-${k}`}>
                            <span>{i.name}</span>
                            <span className="leaders__fill" aria-hidden="true" />
                            <span className="leaders__qty">{fmt(i.quantity)} {i.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Preparación</h4>
                      <ol className="steps">
                        {r.steps.map((st, k) => (
                          <li key={k}><span>{st}</span></li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="actions actions--between">
        <button className="btn btn--quiet" onClick={() => navigate("/semana")}>Volver al menú semanal</button>
        {shopping && plan && (
          <button className="btn" onClick={generate} disabled={shopAction.loading}>
            Regenerar compra y recetas
          </button>
        )}
      </div>
    </section>
  );
}
