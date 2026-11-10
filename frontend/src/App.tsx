import { useEffect, useRef } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import Pantry from "./pages/Pantry";
import Preferences from "./pages/Preferences";
import LunchOptions from "./pages/LunchOptions";
import DinnerOptions from "./pages/DinnerOptions";
import WeeklyPlan from "./pages/WeeklyPlan";
import ShoppingList from "./pages/ShoppingList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Brand from "./components/Brand";
import ChatPanel from "./components/ChatPanel";
import FavoritesPanel from "./components/FavoritesPanel";
import TodayPanel from "./components/TodayPanel";
import { Loading } from "./components/Feedback";
import { useAuth } from "./state/AuthState";
import { CHAT_QUERY, WIDE_QUERY, useMediaQuery } from "./hooks/useMediaQuery";
import { ChatProvider, useChat } from "./state/ChatState";
import { PlanProvider, usePlan } from "./state/PlanState";

/** Parte privada: solo se ve con sesión iniciada. */
function Shell() {
  const { state } = usePlan();
  const { user, logout } = useAuth();
  const { open, setOpen } = useChat();
  const wide = useMediaQuery(WIDE_QUERY);
  const chatDocked = useMediaQuery(CHAT_QUERY);
  const topbar = useRef<HTMLElement>(null);

  // Los paneles laterales se pegan justo debajo de la barra superior, mida lo que mida
  useEffect(() => {
    const el = topbar.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty("--topbar-h", `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape cierra el cajón del asistente
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const steps = [
    { to: "/", label: "Despensa", done: state.pantry.length > 0 },
    { to: "/preferencias", label: "Preferencias", done: state.preferences.people > 0 && state.pantry.length > 0 },
    { to: "/comida", label: "Comida", done: !!state.lunch },
    { to: "/cena", label: "Cena", done: !!state.dinner },
    { to: "/semana", label: "Semana", done: !!state.plan },
  ];

  return (
    <>
      <header className="topbar" ref={topbar}>
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
          </nav>
        </div>
      </header>
      <div className={`workspace${wide ? " workspace--wide" : ""}${chatDocked ? " workspace--chat" : ""}`}>
        {wide && (
          <aside className="workspace__left" aria-label="Hoy y mis menús">
            <TodayPanel />
            <FavoritesPanel />
          </aside>
        )}
        <main className="page workspace__main">
          <Routes>
            <Route path="/" element={<Pantry />} />
            <Route path="/preferencias" element={<Preferences />} />
            <Route path="/comida" element={<LunchOptions />} />
            <Route path="/cena" element={<DinnerOptions />} />
            <Route path="/semana" element={<WeeklyPlan />} />
            <Route path="/compra" element={<ShoppingList />} />
            <Route path="/chat" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/registro" element={<Navigate to="/" replace />} />
            <Route path="/olvide-contrasena" element={<Navigate to="/" replace />} />
            <Route path="/restablecer" element={<ResetPassword />} />
            <Route path="*" element={<Pantry />} />
          </Routes>
        </main>
        {chatDocked && (
          <aside className="workspace__right">
            <ChatPanel />
          </aside>
        )}
      </div>

      {!chatDocked && (
        <>
          <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Abrir el asistente">
            <span aria-hidden="true">💬</span> Asistente
          </button>
          {open && (
            <div className="drawer" role="dialog" aria-modal="true" aria-label="Asistente de cocina">
              <button className="drawer__backdrop" onClick={() => setOpen(false)} aria-label="Cerrar el asistente" tabIndex={-1} />
              <div className="drawer__sheet">
                <ChatPanel onClose={() => setOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}
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
      <ChatProvider>
        <Shell />
      </ChatProvider>
    </PlanProvider>
  );
}
