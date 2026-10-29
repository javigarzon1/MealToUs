import { useState, useEffect } from "react";
import { api, type PantryItem } from "../api";
import { useNavigate } from "react-router-dom";

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [newItem, setNewItem] = useState<{ name: string; quantity?: string }>({ name: "" });
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    cargarDespensa();
  }, []);

  const cargarDespensa = async () => {
    try {
      const data = await api.listPantry();
      setItems(data);
    } catch (error) {
      console.error("Error al cargar la despensa:", error);
    }
  };

  const manejarCambio = (e: React.ChangeEvent) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const creado = await api.addPantryItem(newItem);
      setItems(prev => [creado, ...prev]);
      setNewItem({ name: "" });
    } catch (error) {
      console.error("Error al añadir item:", error);
    }
  };

  const confirmarEliminar = (id: number) => setShowDeleteConfirm(id);

  const manejarEliminar = async (id: number) => {
    if (showDeleteConfirm !== id) return;
    setShowDeleteConfirm(null);
    try {
      await api.deletePantryItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar item:", error);
      setShowDeleteConfirm(id); // Re-mostrar si falla
    }
  };

  return (
    <section>
      <h2>Despensa y nevera</h2>

      {/* Formulario para añadir nuevo alimento */}
      <form onSubmit={manejarSubmit} className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={manejarCambio}
              required
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="text"
              name="quantity"
              value={newItem.quantity || ""}
              onChange={manejarCambio}
              placeholder="ej: 6 huevos, 500 g"
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-2 rounded bg-primary px-4 py-1 text-white"
        >
          Añadir a la despensa
        </button>
      </form>

      {/* Lista de items de la despensa */}
      <div>
        {items.length === 0 && (
          <p className="text-muted-foreground">La despensa está vacía</p>
        )}
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between p-2 border rounded">
              <span>
                {item.name}{item.quantity ? ` • {item.quantity}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => confirmarEliminar(item.id)}
                  className="text-red-500 hover:text-red-800 text-sm"
                  title="Eliminar"
                >
                  🗑️
                </button>
                <span className="text-xs text-muted-foreground">
                  {item.id}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}