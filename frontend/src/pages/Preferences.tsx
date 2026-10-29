import { useState, useEffect } from "react";
import { api, type UserPreferences } from "../api";

export default function Preferences() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    people: 1,
    allergies: [],
    intolerances: [],
    dislikes: [],
  });
  const [showAlert, setShowAlert] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  useEffect(() => {
    cargarPreferencias();
  }, []);

  const cargarPreferencias = async () => {
    try {
      const data = await api.getPreferences();
      setPrefs(data);
    } catch (error) {
      console.error("Error al cargar preferencias:", error);
      setShowAlert({ open: true, message: "Error al cargar preferencias" });
    }
  };

  const handlePeopleChange = (e: React.ChangeEvent) => {
    const value = Number(e.target.value);
    if (value >= 1 && value <= 20) {
      setPrefs({ ...prefs, people: value });
    }
  };

  const addAllergy = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const input = (e.target as HTMLInputElement);
    const term = input.value.trim();
    if (term) {
      setPrefs({ ...prefs, allergies: [...prefs.allergies, term] });
      input.value = "";
    }
  };

  const addIntolerance = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const input = (e.target as HTMLInputElement);
    const term = input.value.trim();
    if (term) {
      setPrefs({ ...prefs, intolerances: [...prefs.intolerances, term] });
      input.value = "";
    }
  };

  const addDislike = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const input = (e.target as HTMLInputElement);
    const term = input.value.trim();
    if (term) {
      setPrefs({ ...prefs, dislikes: [...prefs.dislikes, term] });
      input.value = "";
    }
  };

  const guardarPreferencias = async () => {
    try {
      const actualizado = await api.savePreferences(prefs);
      setPrefs(actualizado);
      setShowAlert({ open: true, message: "Preferencias guardadas correctamente" });
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      setShowAlert({ open: true, message: "Error al guardar preferencias" });
    }
  };

  return (
    <section>
      <h2>Preferencias (personas, alergias, intolerancias, no me gusta)</h2>

      {/* Formulario de preferencias */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Número de personas</label>
          <input
            type="number"
            min="1"
            max="20"
            value={prefs.people}
            onChange={handlePeopleChange}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alergias (separadas por coma)</label>
          <input
            type="text"
            value={prefs.allergies.join(", ")}
            onChange={(e) => {
              const values = e.target.value
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
              setPrefs({ ...prefs, allergies: values });
            }}
            className="border rounded px-2 py-1 w-full"
            placeholder="ej: nuez, marisco, lácteos"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Intolerancias</label>
          <input
            type="text"
            value={prefs.intolerances.join(", ")}
            onChange={(e) => {
              const values = e.target.value
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
              setPrefs({ ...prefs, intolerances: values });
            }}
            className="border rounded px-2 py-1 w-full"
            placeholder="ej: gluten, lacteos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">No me gusta</label>
          <input
            type="text"
            value={prefs.dislikes.join(", ")}
            onChange={(e) => {
              const values = e.target.value
                .split(",")
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
              setPrefs({ ...prefs, dislikes: values });
            }}
            className="border rounded px-2 py-1 w-full"
            placeholder="ej: espinacas, cebolla"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mt-6">
        <button
          onClick={guardarPreferencias}
          className="rounded bg-primary px-4 py-1 text-white mr-2"
        >
          Guardar preferencias
        </button>

        <button
          onClick={() => navigate("/")}
          className="rounded border px-4 py-1"
        >
          Cancelar
        </button>
      </div>

      {/* Alerta de éxito/error */}
      {showAlert.open && (
          <div className="mt-4 p-3 rounded bg-green-100 text-green-800">
            {showAlert.message}
          </div>
        )}
    </section>
  );
}