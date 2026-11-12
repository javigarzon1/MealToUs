import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { fmt } from "../components/DishCard";
import { ErrorBox, Loading } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";
import type { ShoppingItem, ShoppingTemplate, SupermarketLinks } from "../types";
import { itemFor, normalize, recipesUsing, sameFood } from "../utils/match";
import { downloadPdf } from "../utils/pdf";
import { shoppingBlocks } from "../utils/pdfDocs";

const SUPERMARKETS = [
  { id: "mercadona", label: "Mercadona" },
  { id: "carrefour", label: "Carrefour" },
  { id: "hipercor", label: "Hipercor" },
];

const UNITS = ["ud", "g", "kg", "ml", "l", "paquete"];

/** Suma las cantidades si ya hay un alimento igual con la misma unidad. */
function mergeItems(current: ShoppingItem[], incoming: ShoppingItem[]): ShoppingItem[] {
  const out = current.map((i) => ({ ...i }));
  for (const it of incoming) {
    const same = out.find((o) => o.unit === it.unit && normalize(o.name) === normalize(it.name));
    if (same) same.quantity += it.quantity;
    else out.push({ ...it, category: it.category || "Otros" });
  }
  return out;
}

export default function ShoppingList() {
  const { state, apiContext, setShopping, setExtraItems, setChecked: saveChecked } = usePlan();
  const navigate = useNavigate();
  const shopAction = useAction();
  const linkAction = useAction();
  const tplAction = useAction();

  const [links, setLinks] = useState<SupermarketLinks | null>(null);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<ShoppingTemplate[]>([]);
  const [tplName, setTplName] = useState("");
  const [tplMsg, setTplMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState("ud");
  const [openRecipes, setOpenRecipes] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);

  const { plan, shopping, extraItems } = state;
  const checked = useMemo(() => new Set(state.checked), [state.checked]);
  const recipes = useMemo(() => shopping?.recipes ?? [], [shopping]);
  const menuItems = useMemo(() => shopping?.shopping_list ?? [], [shopping]);
  const allItems = useMemo(() => [...extraItems, ...menuItems], [extraItems, menuItems]);

  const byCategory = useMemo(() => {
    const groups = new Map<string, { it: ShoppingItem; key: string }[]>();
    menuItems.forEach((it, idx) => {
      const cat = it.category || "Otros";
      groups.set(cat, [...(groups.get(cat) ?? []), { it, key: `m-${idx}` }]);
    });
    return [...groups.entries()];
  }, [menuItems]);

  useEffect(() => {
    let cancelled = false;
    api.listTemplates().then((t) => !cancelled && setTemplates(t)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function generate() {
    if (!plan) return;
    const res = await shopAction.run(() => api.shopping(apiContext, plan));
    if (res) {
      setShopping(res);
      saveChecked([]);
      setLinks(null);
      setOpenRecipes(new Set());
    }
  }

  function toggle(key: string) {
    saveChecked(checked.has(key) ? state.checked.filter((k) => k !== key) : [...state.checked, key]);
  }

  // ----- lista propia -----
  function addItem(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    const quantity = Number(newQty.replace(",", "."));
    if (!name || !(quantity > 0)) return;
    setExtraItems(mergeItems(extraItems, [{ name, quantity, unit: newUnit, category: "Otros" }]));
    setNewName("");
    setNewQty("1");
  }

  function removeExtra(idx: number) {
    setExtraItems(extraItems.filter((_, i) => i !== idx));
    // Al quitar uno cambian los índices de los siguientes: se limpian las marcas de la lista propia
    saveChecked(state.checked.filter((k) => !k.startsWith("x-")));
  }

  // ----- plantillas -----
  async function saveTemplate() {
    const name = tplName.trim();
    if (!name || allItems.length === 0) return;
    const res = await tplAction.run(() => api.saveTemplate(name, allItems));
    if (res) {
      setTemplates((prev) => [...prev.filter((t) => t.id !== res.id), res].sort((a, b) => a.name.localeCompare(b.name)));
      setTplName("");
      setTplMsg(`Plantilla «${res.name}» guardada.`);
    }
  }

  function loadTemplate(t: ShoppingTemplate) {
    setExtraItems(mergeItems(extraItems, t.items));
    setTplMsg(`Añadidos ${t.items.length} productos de «${t.name}» a tu lista.`);
  }

  async function removeTemplate(t: ShoppingTemplate) {
    const ok = await tplAction.run(() => api.deleteTemplate(t.id).then(() => true));
    if (ok) setTemplates((prev) => prev.filter((x) => x.id !== t.id));
  }

  // ----- enlaces alimento <-> receta -----
  function goTo(id: string, key?: string) {
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    if (key) {
      setFlash(key);
      setTimeout(() => setFlash(null), 1800);
    }
  }

  function showRecipe(idx: number) {
    setOpenRecipes((prev) => new Set(prev).add(idx));
    goTo(`receta-${idx}`);
  }

  async function openSupermarket(id: string) {
    if (allItems.length === 0) return;
    const res = await linkAction.run(() => api.supermarketLinks(id, allItems));
    if (res) setLinks(res);
  }

  async function copyList() {
    const lines = (title: string, items: ShoppingItem[]) =>
      `${title}\n${items.map((i) => `- ${i.name}: ${fmt(i.quantity)} ${i.unit}`).join("\n")}`;
    const parts: string[] = [];
    if (extraItems.length) parts.push(lines("Mi lista", extraItems));
    for (const [cat, rows] of byCategory) parts.push(lines(cat, rows.map((r) => r.it)));
    try {
      await navigator.clipboard.writeText(parts.join("\n\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  }

  function savePdf() {
    downloadPdf("lista-de-la-compra.pdf", shoppingBlocks(extraItems, shopping, state.preferences.people));
  }

  const total = allItems.length;
  const pct = total ? Math.round((checked.size / total) * 100) : 0;

  const row = (it: ShoppingItem, key: string, extra?: { onRemove: () => void }) => {
    const done = checked.has(key);
    const uses = shopping ? recipesUsing(it.name, recipes) : [];
    return (
      <div key={key} id={`item-${key}`} className={`check-row${done ? " is-done" : ""}${flash === key ? " is-flash" : ""}`}>
        <input id={key} className="check" type="checkbox" checked={done} onChange={() => toggle(key)} />
        <label htmlFor={key}>{it.name}</label>
        <span className="leaders__qty">{fmt(it.quantity)} {it.unit}</span>
        {extra && (
          <button className="icon-btn" onClick={extra.onRemove} aria-label={`Quitar ${it.name}`} title="Quitar">×</button>
        )}
        {uses.length > 0 && (
          <div className="item-uses">
            <span className="muted small">Para:</span>
            {uses.slice(0, 3).map((r) => (
              <button key={r} className="link-chip" onClick={() => showRecipe(r)}>{recipes[r].dish_name}</button>
            ))}
            {uses.length > 3 && <span className="muted small">+{uses.length - 3}</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="stack">
      <div className="page__head">
        <h2>Lista de la compra y recetas</h2>
        <p className="page__lede">
          Apunta lo que necesitas, carga una de tus plantillas o añade lo que falta para tu menú
          ({state.preferences.people} {state.preferences.people === 1 ? "persona" : "personas"}).
        </p>
      </div>

      {/* ---------- Mi lista + plantillas ---------- */}
      <div className="form-block stack">
        <h3>Mi lista</h3>
        <form className="add-row" onSubmit={addItem}>
          <label className="field add-row__name">
            Producto
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="p. ej. leche" />
          </label>
          <label className="field add-row__qty">
            Cantidad
            <input className="input" inputMode="decimal" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
          </label>
          <label className="field add-row__unit">
            Unidad
            <select className="input" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <button className="btn btn--primary" type="submit" disabled={!newName.trim()}>Añadir</button>
        </form>

        {extraItems.length === 0 ? (
          <p className="empty">Todavía no has añadido nada. Escribe un producto o carga una plantilla.</p>
        ) : (
          <div className="shop-group">
            {extraItems.map((it, idx) => row(it, `x-${idx}`, { onRemove: () => removeExtra(idx) }))}
          </div>
        )}

        <div className="templates">
          <h4>Plantillas</h4>
          {templates.length === 0 && (
            <p className="muted small">Aún no tienes ninguna. Guarda la lista actual para reutilizarla la próxima vez.</p>
          )}
          {templates.map((t) => (
            <div key={t.id} className="template-row">
              <span className="template-row__name">{t.name} <small className="muted">({t.items.length})</small></span>
              <button className="btn btn--small" onClick={() => loadTemplate(t)}>Añadir a mi lista</button>
              <button className="btn btn--small btn--quiet btn--danger" onClick={() => void removeTemplate(t)} disabled={tplAction.loading}>
                Borrar
              </button>
            </div>
          ))}
          <div className="add-row">
            <label className="field add-row__name">
              Guardar la lista actual como plantilla
              <input
                className="input"
                value={tplName}
                maxLength={80}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="p. ej. Compra de la semana"
              />
            </label>
            <button className="btn" onClick={() => void saveTemplate()} disabled={!tplName.trim() || total === 0 || tplAction.loading}>
              Guardar plantilla
            </button>
          </div>
          {tplMsg && <div className="note" role="status"><p>{tplMsg}</p></div>}
          <ErrorBox message={tplAction.error} />
        </div>
      </div>

      {/* ---------- Compra del menú ---------- */}
      <div className="stack">
        <h3>Compra de tu menú</h3>
        {!plan && (
          <div className="note note--warn">
            <p>Genera tu menú semanal y aquí aparecerá lo que te falta, con sus recetas.</p>
            <button className="btn btn--small" onClick={() => navigate("/semana")}>Ir al menú semanal</button>
          </div>
        )}
        {plan && !shopping && (
          <div className="actions">
            <button className="btn btn--primary" onClick={generate} disabled={shopAction.loading}>
              Crear lista de la compra y recetas
            </button>
          </div>
        )}
        {shopAction.loading && <Loading text="Preparando la compra y las recetas… puede tardar hasta un minuto." quiz />}
        <ErrorBox message={shopAction.error} />

        {shopping && byCategory.length === 0 && <p className="empty">Para tu menú no falta nada: ya lo tienes todo.</p>}
        <div className="shop-groups">
          {byCategory.map(([cat, rows]) => (
            <div key={cat} className="shop-group">
              <h3>{cat}</h3>
              {rows.map(({ it, key }) => row(it, key))}
            </div>
          ))}
        </div>
      </div>

      {total > 0 && (
        <div className="stack">
          <div className="progress">
            <div className="bar" role="img" aria-label={`${pct}% comprado`}><span style={{ width: `${pct}%` }} /></div>
            <span className="progress__n">{checked.size} de {total}</span>
          </div>
          <div className="actions">
            <button className="btn btn--small" onClick={copyList}>{copied ? "Copiada" : "Copiar lista"}</button>
            <button className="btn btn--small" onClick={savePdf}>Descargar PDF</button>
          </div>
        </div>
      )}

      {total > 0 && (
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
      )}

      {shopping && (
        <div className="stack">
          <h3>Recetas ({recipes.length})</h3>
          <div className="recipes">
            {recipes.map((r, idx) => (
              <details
                className="recipe"
                id={`receta-${idx}`}
                key={`${r.dish_name}-${idx}`}
                open={openRecipes.has(idx)}
                onToggle={(e) => {
                  const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                  setOpenRecipes((prev) => {
                    if (prev.has(idx) === isOpen) return prev;
                    const next = new Set(prev);
                    if (isOpen) next.add(idx);
                    else next.delete(idx);
                    return next;
                  });
                }}
              >
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
                      {r.ingredients.map((i, k) => {
                        const m = itemFor(i.name, menuItems);
                        const x = m < 0 ? itemFor(i.name, extraItems) : -1;
                        const inPantry = m < 0 && x < 0 && state.pantry.some((p) => sameFood(p.name, i.name));
                        return (
                          <li key={`${i.name}-${k}`}>
                            <span>{i.name}</span>
                            <span className="leaders__fill" aria-hidden="true" />
                            <span className="leaders__qty">{fmt(i.quantity)} {i.unit}</span>
                            {m >= 0 && (
                              <button className="link-chip" onClick={() => goTo(`item-m-${m}`, `m-${m}`)}>En la compra</button>
                            )}
                            {x >= 0 && (
                              <button className="link-chip" onClick={() => goTo(`item-x-${x}`, `x-${x}`)}>En mi lista</button>
                            )}
                            {inPantry && <span className="tag">En tu despensa</span>}
                          </li>
                        );
                      })}
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
