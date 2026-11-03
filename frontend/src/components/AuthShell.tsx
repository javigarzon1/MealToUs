import type { ReactNode } from "react";
import Brand from "./Brand";

/** Marco de las pantallas de acceso: portada a la izquierda (solo escritorio) y formulario a la derecha. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__hero">
        <Brand />
        <div className="stack">
          <h2>Tu semana de comidas, resuelta con lo que ya tienes.</h2>
          <p>Dinos qué hay en tu nevera y te proponemos menús, la cena, el plan de siete días y la lista de la compra.</p>
        </div>
        <div>
          <div className="tickets">
            <div className="ticket"><div><b>Healthy</b><span>Bowl de quinoa y verduras</span></div><em>420<small>kcal</small></em></div>
            <div className="ticket ticket--normal"><div><b>Normal</b><span>Tortilla de patata con ensalada</span></div><em>610<small>kcal</small></em></div>
            <div className="ticket ticket--sport"><div><b>Deportista</b><span>Arroz con pollo y aguacate</span></div><em>780<small>kcal</small></em></div>
          </div>
          <p className="tickets__note">Ejemplos de platos. Los tuyos dependen de tu despensa.</p>
        </div>
      </aside>
      <div className="auth__panel">
        <div className="auth__card">
          <div className="auth__brand-mobile"><Brand /></div>
          {children}
        </div>
      </div>
    </div>
  );
}
