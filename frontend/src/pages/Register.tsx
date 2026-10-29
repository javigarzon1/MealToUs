import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ErrorBox } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { useAuth } from "../state/AuthState";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function Register() {
  const { register } = useAuth();
  const { loading, error, run } = useAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setFormError("Introduce un email válido.");
    if (password.length < 8) return setFormError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== repeat) return setFormError("Las contraseñas no coinciden.");
    setFormError(null);
    await run(() => register(email, password));
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card stack" onSubmit={onSubmit} noValidate>
        <div>
          <div className="brand">Meal<span>To</span>Us</div>
          <h2>Crea tu cuenta</h2>
          <p className="muted">Solo necesitas un email y una contraseña.</p>
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
          <span>
            Contraseña <span className="hint">(mínimo 8 caracteres)</span>
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="field">
          Repite la contraseña
          <input
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            required
          />
        </label>

        <ErrorBox message={formError ?? error} />

        <button className="primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        <p className="small muted" style={{ margin: 0 }}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
