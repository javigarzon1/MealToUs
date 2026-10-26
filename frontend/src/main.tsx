import { NavLink, Route, Routes } from "react-router-dom";
import Pantry from "./pages/Pantry";
import Preferences from "./pages/Preferences";
import LunchOptions from "./pages/LunchOptions";
import DinnerOptions from "./pages/DinnerOptions";
import WeeklyPlan from "./pages/WeeklyPlan";
import ShoppingList from "./pages/ShoppingList";
import Chat from "./pages/Chat";
import { usePlan } from "./state/PlanState";

export default function App() {
  const { state } = usePlan();

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
          <div className="brand">Meal<span>To</span>Us</div>
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
          <Route path="*" element={<Pantry />} />
        </Routes>
      </main>
    </>
  );
}
