import { useState } from "react";
import type { KeyboardEvent } from "react";

interface Props {
  label: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
}

/** Campo de etiquetas: escribe y pulsa Enter o coma para añadir. */
export default function TagInput({ label, hint, placeholder, values, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const v = raw.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="stack" style={{ gap: ".5rem" }}>
      <label className="field">
        <span>
          {label} {hint && <span className="hint">{hint}</span>}
        </span>
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
        />
      </label>
      {values.length > 0 && (
        <div className="chips">
          {values.map((v) => (
            <span className="chip" key={v}>
              {v}
              <button
                type="button"
                aria-label={`Quitar ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
