import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import Pantry from "./pages/Pantry";
import Preferences from "./pages/Preferences";
import LunchOptions from "./pages/LunchOptions";
import DinnerOptions from "./pages/DinnerOptions";
import WeeklyPlan from "./pages/WeeklyPlan";
import ShoppingList from "./pages/ShoppingList";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Brand from "./components/Brand";
import { Loading } from "./components/Feedback";
import { useAuth } from "./state/AuthState";
import { PlanProvider, usePlan } from "./state/PlanState";

/** Parte privada: solo se ve con sesión iniciada. */
function Shell() {
  const { state } = usePlan();
  const { user, logout } = useAuth();

  const steps = [
    { to: "/", label: "Despensa", done: state.pantry.length > 0 },
    { to: "/preferencias", label: "Preferencias", done: state.preferences.people > 0 && state.pantry.length > 0 },
    { to: "/comida", label: "Comida", done: !!state.lunch },
    { to: "/cena", label: "Cena", done: !!state.dinner },
    { to: "/semana", label: "Semana", done: !!state.plan },
  ];

  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__row">
            <Brand />
            <div className="userbar">
              <span className="userbar__who" title={user?.email}>{user?.email}</span>
              <button className="btn btn--quiet btn--small" onClick={() => void logout()}>Salir</button>
            </div>
          </div>
          <nav className="journey" aria-label="Pasos">
            <NavLink to="/compra" className={({ isActive }) => `step step--shop${isActive ? " is-active" : ""}`}>
              <span className="step__emoji" aria-hidden="true">🛒</span>
              <span className="step__label">Compra</span>
            </NavLink>
            <ol className="journey__list">
              {steps.map((s, i) => (
                <li key={s.to}>
                  <NavLink
                    to={s.to}
                    end
                    className={({ isActive }) => `step${isActive ? " is-active" : ""}${s.done ? " is-done" : ""}`}
                  >
                    <span className="step__dot">{s.done ? "✓" : i + 1}</span>
                    <span className="step__label">{s.label}</span>
                  </NavLink>
                </li>
              ))}
            </ol>
            <span className="journey__spacer" />
            <NavLink to="/chat" className={({ isActive }) => `step step--chat${isActive ? " is-active" : ""}`}>
              <span className="step__label">Asistente</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Pantry />} />
          <Route path="/preferencias" element={<Preferences />} />
          <Route path="/comida" element={<LunchOptions />} />
          <Route path="/cena" element={<DinnerOptions />} />
          <Route path="/semana" element={<WeeklyPlan />} />
          <Route path="/compra" element={<ShoppingList />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/registro" element={<Navigate to="/" replace />} />
          <Route path="/olvide-contrasena" element={<Navigate to="/" replace />} />
          <Route path="/restablecer" element={<ResetPassword />} />
          <Route path="*" element={<Pantry />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth__panel" style={{ minHeight: "100vh" }}>
        <Loading text="Comprobando tu sesión…" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/registro" element={<Register />} />
        <Route path="/olvide-contrasena" element={<ForgotPassword />} />
        <Route path="/restablecer" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // key={user.id}: al cambiar de usuario se descarta todo el estado del anterior
  return (
    <PlanProvider key={user.id} userId={user.id}>
      <Shell />
    </PlanProvider>
  );
}
