import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { PlanUse } from "../utils/match";

interface Props {
  uses: PlanUse[];
  /** Abre la receta de un plato, si existe. */
  onOpenRecipe: (dish: string) => void;
  children: ReactNode;
}

/**
 * Envuelve el nombre de un ingrediente y muestra, al pasar el ratón o al pulsar el botón ⓘ
 * (táctil y teclado), en qué comidas y días se usa.
 */
export default function ItemUses({ uses, onOpenRecipe, children }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (uses.length === 0) return <>{children}</>;
  return (
    <div className="uses" ref={box} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      <button type="button" className="uses__btn" aria-expanded={open} aria-label="¿Dónde se usa?"
        onClick={() => setOpen((o) => !o)}>
        ⓘ
      </button>
      {open && (
        <div className="uses__pop" role="dialog" aria-label="Dónde se usa">
          <strong>Se usa en</strong>
          <ul>
            {uses.map((u) => (
              <li key={`${u.day}-${u.meal}`}>
                <span className="uses__when">{u.day} · {u.meal}</span>
                <button type="button" className="uses__dish" onClick={() => onOpenRecipe(u.dish)}>{u.dish}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
