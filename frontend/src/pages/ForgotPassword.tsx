import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
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
    <div className="auth-wrap">
      <form className="card auth-card stack" onSubmit={onSubmit} noValidate>
        <div>
          <div className="brand">Meal<span>To</span>Us</div>
          <h2>Recupera tu contraseña</h2>
          <p className="muted">Te enviaremos un enlace para elegir una nueva.</p>
        </div>

        {sent ? (
          <p className="notice info">{sent} Revisa también la carpeta de spam.</p>
        ) : (
          <>
            <label className="field">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <ErrorBox message={error} />
            <button className="primary" type="submit" disabled={loading || !email.trim()}
              style={{ justifyContent: "center" }}>
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </>
        )}

        <p className="small muted" style={{ margin: 0 }}>
          <Link to="/login">← Volver a iniciar sesión</Link>
        </p>
      </form>
    </div>
  );
}
