import { useNavigate } from "react-router-dom";
import TagInput from "../components/TagInput";
import { usePlan } from "../state/PlanState";

export default function Preferences() {
  const { state, setPreferences } = usePlan();
  const navigate = useNavigate();
  const prefs = state.preferences;

  return (
    <section className="stack">
      <div>
        <h2>Preferencias</h2>
        <p className="muted">
          Cuántas personas comen y qué debe evitar la IA. Alergias e intolerancias se tratan como
          restricciones estrictas.
        </p>
      </div>

      <div className="card stack">
        <label className="field" style={{ maxWidth: 220 }}>
          Número de personas
          <input
            type="number"
            min={1}
            max={20}
            value={prefs.people}
            onChange={(e) => {
              const n = Math.min(20, Math.max(1, Number(e.target.value) || 1));
              setPreferences({ ...prefs, people: n });
            }}
          />
        </label>

        <TagInput
          label="Alergias"
          hint="(Enter o coma para añadir)"
          placeholder="p. ej. cacahuete"
          values={prefs.allergies}
          onChange={(allergies) => setPreferences({ ...prefs, allergies })}
        />
        <TagInput
          label="Intolerancias"
          placeholder="p. ej. lactosa, gluten"
          values={prefs.intolerances}
          onChange={(intolerances) => setPreferences({ ...prefs, intolerances })}
        />
        <TagInput
          label="Alimentos que no te gustan"
          placeholder="p. ej. coliflor"
          values={prefs.dislikes}
          onChange={(dislikes) => setPreferences({ ...prefs, dislikes })}
        />
      </div>

      <p className="small muted">
        Aviso: las calorías son estimaciones generadas por IA y no sustituyen el consejo de un dietista o
        médico. Revisa siempre las etiquetas de los productos si tienes alergias.
      </p>

      <div className="row spread">
        <button onClick={() => navigate("/")}>← Despensa</button>
        <button className="primary" onClick={() => navigate("/comida")}>
          Siguiente: comida →
        </button>
      </div>
    </section>
  );
}
