import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox } from "../components/Feedback";
import { useAction } from "../hooks/useAction";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { loading, error, run } = useAction();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setFormError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== repeat) return setFormError("Las contraseñas no coinciden.");
    setFormError(null);
    const ok = await run(() => api.resetPassword(token, password).then(() => true));
    if (ok) setDone(true);
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card stack" onSubmit={onSubmit} noValidate>
        <div>
          <div className="brand">Meal<span>To</span>Us</div>
          <h2>Nueva contraseña</h2>
        </div>

        {!token ? (
          <p className="notice err">
            Falta el enlace de recuperación. <Link to="/olvide-contrasena">Pide uno nuevo</Link>.
          </p>
        ) : done ? (
          <p className="notice info">
            Contraseña cambiada. Ya puedes <Link to="/login" reloadDocument>iniciar sesión</Link>.
          </p>
        ) : (
          <>
            <label className="field">
              <span>
                Nueva contraseña <span className="hint">(mínimo 8 caracteres)</span>
              </span>
              <input type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              Repite la contraseña
              <input type="password" autoComplete="new-password" value={repeat}
                onChange={(e) => setRepeat(e.target.value)} required />
            </label>
            <ErrorBox message={formError ?? error} />
            <button className="primary" type="submit" disabled={loading}
              style={{ justifyContent: "center" }}>
              {loading ? "Guardando…" : "Cambiar contraseña"}
            </button>
            <p className="small muted" style={{ margin: 0 }}>
              ¿El enlace ha caducado? <Link to="/olvide-contrasena">Pide otro</Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
}
