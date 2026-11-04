import type { ReactNode } from "react";
import Brand from "./Brand";

/** Marco de las pantallas de acceso: logo grande y una tarjeta con el formulario. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__card">
        <Brand large />
        {children}
      </div>
    </div>
  );
}
