import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import AuthShell from "../components/AuthShell";
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
    <AuthShell>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <h1>Nueva contraseña</h1>

        {!token ? (
          <div className="note note--err">
            <p>Falta el enlace de recuperación. <Link to="/olvide-contrasena">Pide uno nuevo</Link>.</p>
          </div>
        ) : done ? (
          <div className="note">
            <p>Contraseña cambiada. Ya puedes <Link to="/login" reloadDocument>iniciar sesión</Link>.</p>
          </div>
        ) : (
          <>
            <label className="field">
              <span>Nueva contraseña <span className="field__hint">(mínimo 8 caracteres)</span></span>
              <input className="input" type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              Repite la contraseña
              <input className="input" type="password" autoComplete="new-password" value={repeat}
                onChange={(e) => setRepeat(e.target.value)} required />
            </label>
            <ErrorBox message={formError ?? error} />
            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Cambiar contraseña"}
            </button>
            <p className="small muted">
              ¿El enlace ha caducado? <Link to="/olvide-contrasena">Pide otro</Link>
            </p>
          </>
        )}
      </form>
    </AuthShell>
  );
}
