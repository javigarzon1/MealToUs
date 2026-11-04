import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
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
    <AuthShell>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <label className="field">
          Email
          <input className="input" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>

        <label className="field">
          Contraseña
          <input className="input" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <ErrorBox message={formError ?? error} />

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="auth__links small">
        <Link to="/olvide-contrasena">Olvidé mi contraseña</Link>
        <Link to="/registro">Crear cuenta</Link>
      </p>
    </AuthShell>
  );
}
