import { useState, useEffect } from "react";
import { api, type UserPreferences } from "../api";

export default function Preferences() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    people: 1,
    allergies: [],
    intolerances: [],
    dislikes: [],
  });
  const [newAllergy, setNewAllergy] = useState("");
  const [newIntolerance, setNewIntolerance] = useState("");
  const [newDislike, setNewDislike] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState<{ open: boolean; message: string; type: "success" | "error" }>({ open: false, message: "", type: "success" });

  useEffect(() => {
    cargarPreferencias();
  }, []);

  const cargarPreferencias = async () => {
    setLoading(true);
    try {
      const data = await api.getPreferences();
      setPrefs(data);
    } catch (error) {
      console.error("Error al cargar preferencias:", error);
      setShowAlert({ open: true, message: "Error al cargar preferencias", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const guardarPreferencias = async () => {
    try {
      const actualizado = await api.savePreferences(prefs);
      setPrefs(actualizado);
      setShowAlert({ open: true, message: "Preferencias guardadas correctamente", type: "success" });
      setTimeout(() => setShowAlert({ open: false, message: "", type: "success" }), 3000);
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      setShowAlert({ open: true, message: "Error al guardar preferencias", type: "error" });
    }
  };

  const addAllergy = () => {
    const term = newAllergy.trim();
    if (term) {
      setPrefs({ ...prefs, allergies: [...prefs.allergies, term] });
      setNewAllergy("");
    }
  };

  const addIntolerance = () => {
    const term = newIntolerance.trim();
    if (term) {
      setPrefs({ ...prefs, intolerances: [...prefs.intolerances, term] });
      setNewIntolerance("");
    }
  };

  const addDislike = () => {
    const term = newDislike.trim();
    if (term) {
      setPrefs({ ...prefs, dislikes: [...prefs.dislikes, term] });
      setNewDislike("");
    }
  };

  const removeAllergy = (index: number) => {
    setPrefs({ ...prefs, allergies: prefs.allergies.filter((_, i) => i !== index) });
  };

  const removeIntolerance = (index: number) => {
    setPrefs({ ...prefs, intolerances: prefs.intolerances.filter((_, i) => i !== index) });
  };

  const removeDislike = (index: number) => {
    setPrefs({ ...prefs, dislikes: prefs.dislikes.filter((_, i) => i !== index) });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Preferencias</h1>
        <p className="page-subtitle">Configura tus preferencias para personalizar los menús</p>
      </div>

      {showAlert.open && (
        <div className={`alert alert-${showAlert.type}`}>
          {showAlert.message}
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando preferencias...</div>
      ) : (
        <>
          {/* Número de personas */}
          <div className="card">
            <h2 className="card-title">👥 Personas</h2>
            <div className="form-group">
              <label>Número de comensales</label>
              <input
                type="number"
                min="1"
                max="20"
                value={prefs.people}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= 20) {
                    setPrefs({ ...prefs, people: value });
                  }
                }}
              />
              <p className="text-muted" style={{ marginTop: 4, fontSize: "0.8rem" }}>
                Entre 1 y 20 personas
              </p>
            </div>
          </div>

          {/* Alergias */}
          <div className="card">
            <h2 className="card-title">⚠️ Alergias</h2>
            <div className="form-group">
              <label>Añadir alergia</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAllergy()}
                  placeholder="Ej: nuez, marisco, lácteos..."
                />
                <button type="button" className="btn btn-primary" onClick={addAllergy}>
                  Añadir
                </button>
              </div>
            </div>
            <div className="tag-list">
              {prefs.allergies.map((allergy, index) => (
                <span key={index} className="tag">
                  {allergy}
                  <span className="tag-remove" onClick={() => removeAllergy(index)}>×</span>
                </span>
              ))}
              {prefs.allergies.length === 0 && (
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>Sin alergias registradas</span>
              )}
            </div>
          </div>

          {/* Intolerancias */}
          <div className="card">
            <h2 className="card-title">🚫 Intolerancias</h2>
            <div className="form-group">
              <label>Añadir intolerancia</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newIntolerance}
                  onChange={(e) => setNewIntolerance(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addIntolerance()}
                  placeholder="Ej: gluten, lactosa..."
                />
                <button type="button" className="btn btn-primary" onClick={addIntolerance}>
                  Añadir
                </button>
              </div>
            </div>
            <div className="tag-list">
              {prefs.intolerances.map((intolerance, index) => (
                <span key={index} className="tag">
                  {intolerance}
                  <span className="tag-remove" onClick={() => removeIntolerance(index)}>×</span>
                </span>
              ))}
              {prefs.intolerances.length === 0 && (
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>Sin intolerancias registradas</span>
              )}
            </div>
          </div>

          {/* Dislikes */}
          <div className="card">
            <h2 className="card-title">👎 No me gusta</h2>
            <div className="form-group">
              <label>Añadir alimento que no te gusta</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newDislike}
                  onChange={(e) => setNewDislike(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDislike()}
                  placeholder="Ej: espinacas, cebolla..."
                />
                <button type="button" className="btn btn-primary" onClick={addDislike}>
                  Añadir
                </button>
              </div>
            </div>
            <div className="tag-list">
              {prefs.dislikes.map((dislike, index) => (
                <span key={index} className="tag">
                  {dislike}
                  <span className="tag-remove" onClick={() => removeDislike(index)}>×</span>
                </span>
              ))}
              {prefs.dislikes.length === 0 && (
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>Sin alimentos marcados como "no me gusta"</span>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button className="btn btn-primary" onClick={guardarPreferencias}>
              💾 Guardar preferencias
            </button>
          </div>
        </>
      )}
    </div>
  );
}