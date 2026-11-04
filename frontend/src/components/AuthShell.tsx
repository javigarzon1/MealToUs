import type { ReactNode } from "react";

/** Marco de las pantallas de acceso: el logo grande y el formulario, nada más. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__card">
        <img className="auth__logo" src="/logo.svg" alt="MealToUs" width={220} height={220} />
        {children}
      </div>
    </div>
  );
}
