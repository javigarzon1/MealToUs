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
    { to: "/compra", label: "Compra", done: !!state.shopping },
  ];

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-row">
            <div className="brand">Meal<span>To</span>Us</div>
            <div className="userbar">
              <span className="who muted small" title={user?.email}>{user?.email}</span>
              <button className="link" onClick={() => void logout()}>Salir</button>
            </div>
          </div>
          <nav className="steps" aria-label="Pasos">
            {steps.map((s, i) => (
              <NavLink
                key={s.to}
                to={s.to}
                end
                className={({ isActive }) => `step${isActive ? " active" : ""}${s.done ? " done" : ""}`}
              >
                <span className="dot">{s.done ? "✓" : i + 1}</span>
                <span className="label">{s.label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/chat"
              className={({ isActive }) => `step chat${isActive ? " active" : ""}`}
            >
              <span className="label">💬 Asistente</span>
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
      <div className="auth-wrap">
        <Loading text="Comprobando tu sesión…" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/registro" element={<Register />} />
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
