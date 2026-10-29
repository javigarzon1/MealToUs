import { Link, Route, Routes } from "react-router-dom";
import Pantry from "./pages/Pantry";
import Preferences from "./pages/Preferences";
import LunchOptions from "./pages/LunchOptions";
import DinnerOptions from "./pages/DinnerOptions";
import WeeklyPlan from "./pages/WeeklyPlan";
import ShoppingList from "./pages/ShoppingList";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">🍽️</span>
          <h1>MealToUs</h1>
          <span className="brand-subtitle">Come sano ahorrando</span>
        </div>
        <nav className="app-nav">
          <Link to="/" className="nav-link">
            <span className="nav-icon">🧊</span>
            <span className="nav-text">Despensa</span>
          </Link>
          <Link to="/preferencias" className="nav-link">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Preferencias</span>
          </Link>
          <Link to="/comida" className="nav-link">
            <span className="nav-icon">🥗</span>
            <span className="nav-text">Comida</span>
          </Link>
          <Link to="/cena" className="nav-link">
            <span className="nav-icon">🍽️</span>
            <span className="nav-text">Cena</span>
          </Link>
          <Link to="/semana" className="nav-link">
            <span className="nav-icon">📅</span>
            <span className="nav-text">Semana</span>
          </Link>
          <Link to="/compra" className="nav-link">
            <span className="nav-icon">🛒</span>
            <span className="nav-text">Compra</span>
          </Link>
          <Link to="/chat" className="nav-link">
            <span className="nav-icon">💬</span>
            <span className="nav-text">Asistente</span>
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Pantry />} />
          <Route path="/preferencias" element={<Preferences />} />
          <Route path="/comida" element={<LunchOptions />} />
          <Route path="/cena" element={<DinnerOptions />} />
          <Route path="/semana" element={<WeeklyPlan />} />
          <Route path="/compra" element={<ShoppingList />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>MealToUs · Come sano ahorrando · Powered by IA</p>
      </footer>
    </div>
  );
}