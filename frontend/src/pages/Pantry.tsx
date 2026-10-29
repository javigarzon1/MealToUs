import { useState, useEffect } from "react";
import { api } from "../api";
import type { PantryItem } from "../types";

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [newItem, setNewItem] = useState<{ name: string; quantity?: string }>({ name: "" });
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState<{ open: boolean; message: string; type: "success" | "error" }>({ open: false, message: "", type: "success" });

  useEffect(() => {
    cargarDespensa();
  }, []);

  const cargarDespensa = async () => {
    setLoading(true);
    try {
      const data = await api.listPantry();
      setItems(data);
    } catch (error) {
      console.error("Error al cargar la despensa:", error);
      setShowAlert({ open: true, message: "Error al cargar la despensa", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    try {
      const creado = await api.addPantryItem(newItem);
      setItems(prev => [creado, ...prev]);
      setNewItem({ name: "" });
      setShowAlert({ open: true, message: "Alimento añadido correctamente", type: "success" });
      setTimeout(() => setShowAlert({ open: false, message: "", type: "success" }), 3000);
    } catch (error) {
      console.error("Error al añadir item:", error);
      setShowAlert({ open: true, message: "Error al añadir el alimento", type: "error" });
    }
  };

  const manejarEliminar = async (id: number) => {
    try {
      await api.deletePantryItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setShowAlert({ open: true, message: "Alimento eliminado", type: "success" });
      setTimeout(() => setShowAlert({ open: false, message: "", type: "success" }), 2000);
    } catch (error) {
      console.error("Error al eliminar item:", error);
      setShowAlert({ open: true, message: "Error al eliminar el alimento", type: "error" });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🧊 Despensa y nevera</h1>
        <p className="page-subtitle">Gestiona los alimentos que tienes disponibles</p>
      </div>

      {showAlert.open && (
        <div className={`alert alert-${showAlert.type}`}>
          {showAlert.message}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">➕ Añadir nuevo alimento</h2>
        <form onSubmit={manejarSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre del alimento</label>
              <input
                type="text"
                name="name"
                value={newItem.name}
                onChange={manejarCambio}
                placeholder="Ej: huevos, tomates, leche..."
                required
              />
            </div>
            <div className="form-group">
              <label>Cantidad (texto libre)</label>
              <input
                type="text"
                name="quantity"
                value={newItem.quantity || ""}
                onChange={manejarCambio}
                placeholder="Ej: 6 huevos, 500 g, 1 paquete"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Añadir a la despensa
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">📋 Tu despensa ({items.length} items)</h2>
        {loading ? (
          <div className="loading">Cargando despensa...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧊</div>
            <p>Tu despensa está vacía</p>
            <p className="text-muted">Añade algunos alimentos para empezar</p>
          </div>
        ) : (
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.id} className="item-card">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  {item.quantity && (
                    <span className="item-quantity">{item.quantity}</span>
                  )}
                </div>
                <div className="item-actions">
                  <button
                    onClick={() => item.id && manejarEliminar(item.id)}
                    className="btn btn-danger btn-sm"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}