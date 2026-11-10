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
  const kcal = prefs.max_kcal_per_day;
  const kcalInvalid = kcal !== null && (kcal < 1000 || kcal > 6000);

  function change(next: UserPreferences) {
    setDraft(next);
    setSaved(false);
  }

  async function save(): Promise<boolean> {
    if (!draft) return true;
    if (kcalInvalid) return false;
    const res = await run(() => api.savePreferences(draft));
    if (!res) return false;
    setPreferences(res);
    setDraft(null);
    setSaved(true);
    return true;
  }

  return (
    <section className="stack">
      <div className="page__head">
        <h2>Preferencias</h2>
        <p className="page__lede">
          Cuántas personas comen y qué debe evitar la IA. Alergias e intolerancias se tratan como
          restricciones estrictas.
        </p>
      </div>

      <div className="form-block stack">
        <label className="field" style={{ maxWidth: 220 }}>
          Número de personas
          <input
            className="input"
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

        <label className="field" style={{ maxWidth: 260 }}>
          <span>Tope de calorías al día <span className="field__hint">(opcional)</span></span>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min={1000}
            max={6000}
            step={50}
            placeholder="p. ej. 1800"
            value={kcal ?? ""}
            aria-invalid={kcalInvalid}
            onChange={(e) => change({ ...prefs, max_kcal_per_day: e.target.value === "" ? null : Number(e.target.value) })}
          />
          <span className="field__hint">
            Comida + cena nunca lo superan y la cena es siempre más ligera que la comida. Déjalo vacío si no quieres límite.
          </span>
          {kcalInvalid && <span className="field__error" role="alert">Escribe un valor entre 1000 y 6000 kcal.</span>}
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
      {saved && <div className="note" role="status"><p>Preferencias guardadas.</p></div>}

      <div className="actions actions--between">
        <button className="btn btn--quiet" onClick={() => navigate("/")}>Volver a despensa</button>
        <div className="actions">
          <button className="btn" disabled={loading || !draft || kcalInvalid} onClick={() => void save()}>
            Guardar
          </button>
          <button
            className="btn btn--primary"
            disabled={loading || kcalInvalid}
            onClick={async () => {
              // Si cambiaste algo, la comida se vuelve a generar aunque ya hubiera opciones
              const changed = !!draft;
              if (await save()) navigate("/comida", { state: { auto: true, force: changed } });
            }}
          >
            Siguiente: comida
          </button>
        </div>
      </div>
    </section>
  );
}
