import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ErrorBox } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { useAuth } from "../state/AuthState";

export default function Login() {
  const { login } = useAuth();
  const { loading, error, run } = useAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError("Escribe tu email y tu contraseña.");
      return;
    }
    setFormError(null);
    await run(() => login(email, password));
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card stack" onSubmit={onSubmit} noValidate>
        <div>
          <div className="brand">Meal<span>To</span>Us</div>
          <h2>Inicia sesión</h2>
          <p className="muted">Entra para planificar tus menús y tu compra.</p>
        </div>

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

        <label className="field">
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="hint">
            <Link to="/olvide-contrasena">¿Has olvidado tu contraseña?</Link>
          </span>
        </label>

        <ErrorBox message={formError ?? error} />

        <button className="primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <div className="stack" style={{ borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
          <p className="small muted" style={{ margin: 0 }}>¿Todavía no tienes cuenta?</p>
          <Link className="btn" to="/registro" style={{ justifyContent: "center" }}>
            Crear cuenta
          </Link>
        </div>
      </form>
    </div>
  );
}
