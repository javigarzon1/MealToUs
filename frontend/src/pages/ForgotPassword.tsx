import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import AuthShell from "../components/AuthShell";
import { ErrorBox } from "../components/Feedback";
import { useAction } from "../hooks/useAction";

export default function ForgotPassword() {
  const { loading, error, run } = useAction();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await run(() => api.forgotPassword(email));
    if (res) setSent(res.message);
  }

  return (
    <AuthShell>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div>
          <h1>Recupera tu contraseña</h1>
          <p className="muted">Te enviaremos un enlace para elegir una nueva.</p>
        </div>

        {sent ? (
          <div className="note"><p>{sent} Revisa también la carpeta de spam.</p></div>
        ) : (
          <>
            <label className="field">
              Email
              <input className="input" type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </label>
            <ErrorBox message={error} />
            <button className="btn btn--primary" type="submit" disabled={loading || !email.trim()}>
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </>
        )}
      </form>
      <div className="auth__alt">
        <Link className="btn btn--quiet" to="/login">Volver a iniciar sesión</Link>
      </div>
    </AuthShell>
  );
}
