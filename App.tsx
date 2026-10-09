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
    <>
      <nav style={{ display: "flex", gap: 12, padding: 12 }}>
        <Link to="/">Despensa</Link>
        <Link to="/preferencias">Preferencias</Link>
        <Link to="/comida">Comida</Link>
        <Link to="/cena">Cena</Link>
        <Link to="/semana">Semana</Link>
        <Link to="/compra">Compra</Link>
        <Link to="/chat">Asistente</Link>
      </nav>
      <main style={{ padding: 16 }}>
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
    </>
  );
}
