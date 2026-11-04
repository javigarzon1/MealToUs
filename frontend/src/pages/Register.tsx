import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { ErrorBox } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { useAuth } from "../state/AuthState";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function Register() {
  const { register } = useAuth();
  const { loading, error, run } = useAction();
  const [name, setName] = useState("");
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
    await run(() => register(email, password, name.trim()));
  }

  return (
    <AuthShell>
      <form className="stack" onSubmit={onSubmit} noValidate>
        <div>
          <h1>Crea tu cuenta</h1>
          <p className="muted">Solo necesitas un email y una contraseña.</p>
        </div>

        <label className="field">
          <span>Nombre <span className="field__hint">(opcional)</span></span>
          <input className="input" type="text" autoComplete="name" maxLength={100} value={name}
            onChange={(e) => setName(e.target.value)} autoFocus />
        </label>

        <label className="field">
          Email
          <input className="input" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label className="field">
          <span>Contraseña <span className="field__hint">(mínimo 8 caracteres)</span></span>
          <input className="input" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <label className="field">
          Repite la contraseña
          <input className="input" type="password" autoComplete="new-password" value={repeat}
            onChange={(e) => setRepeat(e.target.value)} required />
        </label>

        <ErrorBox message={formError ?? error} />

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <div className="auth__alt">
        <p className="small muted">¿Ya tienes cuenta?</p>
        <Link className="btn" to="/login">Iniciar sesión</Link>
      </div>
    </AuthShell>
  );
}
