import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox } from "../components/Feedback";
import TagInput from "../components/TagInput";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";
import type { UserPreferences } from "../types";

export default function Preferences() {
  const { state, setPreferences } = usePlan();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<UserPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const { loading, error, run } = useAction();
  // Se edita una copia y se guarda en el servidor con el botón
  const prefs = draft ?? state.preferences;

  function change(next: UserPreferences) {
    setDraft(next);
    setSaved(false);
  }

  async function save(): Promise<boolean> {
    if (!draft) return true;
    const res = await run(() => api.savePreferences(draft));
    if (!res) return false;
    setPreferences(res);
    setDraft(null);
    setSaved(true);
    return true;
  }

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
              change({ ...prefs, people: n });
            }}
          />
        </label>

        <TagInput
          label="Alergias"
          hint="(Enter o coma para añadir)"
          placeholder="p. ej. cacahuete"
          values={prefs.allergies}
          onChange={(allergies) => change({ ...prefs, allergies })}
        />
        <TagInput
          label="Intolerancias"
          placeholder="p. ej. lactosa, gluten"
          values={prefs.intolerances}
          onChange={(intolerances) => change({ ...prefs, intolerances })}
        />
        <TagInput
          label="Alimentos que no te gustan"
          placeholder="p. ej. coliflor"
          values={prefs.dislikes}
          onChange={(dislikes) => change({ ...prefs, dislikes })}
        />
      </div>

      <p className="small muted">
        Aviso: las calorías son estimaciones generadas por IA y no sustituyen el consejo de un dietista o
        médico. Revisa siempre las etiquetas de los productos si tienes alergias.
      </p>

      <ErrorBox message={error} />
      {saved && <p className="notice info">Preferencias guardadas.</p>}

      <div className="row spread">
        <button onClick={() => navigate("/")}>← Despensa</button>
        <button disabled={loading || !draft} onClick={() => void save()}>
          Guardar
        </button>
        <button
          className="primary"
          disabled={loading}
          onClick={async () => {
            if (await save()) navigate("/comida");
          }}
        >
          Siguiente: comida →
        </button>
      </div>
    </section>
  );
}
