import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { api } from "../api/client";
import type { PantryItem, PantryItemOut, ScanItem } from "../types";
import { prepareImage } from "../utils/image";
import { ErrorBox, Loading } from "./Feedback";

const UNITS = ["ud", "g", "kg", "ml", "l", "paquete"];

interface Row {
  key: number;
  include: boolean;
  name: string;
  quantity: string;
  unit: string;
  flagged: boolean;
  confirmed: boolean;
  owned: boolean;
}

type Phase =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "retake"; message: string }
  | { kind: "review"; rows: Row[] };

const TIPS = "Una balda cada vez, de frente, con buena luz y sin movimiento.";

function toRows(items: ScanItem[], pantry: PantryItemOut[]): Row[] {
  return items.map((it, key) => {
    const owned = pantry.some((p) => p.name.trim().toLowerCase() === it.name.trim().toLowerCase());
    return {
      key, include: !owned, name: it.name, quantity: it.quantity != null ? String(it.quantity) : "",
      unit: it.unit ?? "", flagged: it.needs_confirmation, confirmed: false, owned,
    };
  });
}

const complete = (r: Row) => r.name.trim() !== "" && Number(r.quantity.replace(",", ".")) > 0 && r.unit !== "";
const ready = (r: Row) => !r.include || (complete(r) && (!r.flagged || r.confirmed));

interface Props {
  pantry: PantryItemOut[];
  onAdd: (items: PantryItem[]) => Promise<boolean>;
}

/** Foto de la nevera o la despensa: la IA propone una lista y el usuario la confirma antes de añadirla. */
export default function PhotoScan({ pantry, onAdd }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function analyze(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPhase({ kind: "scanning" });
    try {
      const img = await prepareImage(file);
      const res = await api.scanPantry(img.base64, img.mime);
      if (res.status === "retake") {
        setPhase({ kind: "retake", message: res.message || "Repite la foto." });
      } else {
        setPhase({ kind: "review", rows: toRows(res.items, pantry) });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase({ kind: "idle" });
    }
  }

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite repetir la misma foto
    void analyze(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void analyze(e.dataTransfer.files?.[0]);
  };

  const patch = (key: number, change: Partial<Row>) => {
    if (phase.kind !== "review") return;
    setPhase({
      kind: "review",
      rows: phase.rows.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...change };
        // al corregir cantidad o unidad el usuario ya la está confirmando
        if (("quantity" in change || "unit" in change) && complete(next)) next.confirmed = true;
        return next;
      }),
    });
  };

  async function add() {
    if (phase.kind !== "review") return;
    const chosen = phase.rows.filter((r) => r.include);
    const ok = await onAdd(chosen.map((r) => ({
      name: r.name.trim(), quantity: `${r.quantity.replace(",", ".")} ${r.unit}`,
    })));
    if (ok) setPhase({ kind: "idle" });
  }

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
    </>
  );
  const buttons = (
    <div className="actions">
      <button type="button" className="btn btn--primary" onClick={() => cameraRef.current?.click()}>
        <span aria-hidden="true">📷</span> Hacer foto
      </button>
      <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Subir foto</button>
    </div>
  );

  if (phase.kind === "scanning") return <Loading text="Mirando tu foto y buscando alimentos…" />;

  if (phase.kind === "retake") {
    return (
      <div className="scan stack stack--tight" role="alert">
        {inputs}
        <h3>Repite la foto</h3>
        <p>{phase.message}</p>
        <p className="small muted">{TIPS}</p>
        {buttons}
      </div>
    );
  }

  if (phase.kind === "review") {
    const chosen = phase.rows.filter((r) => r.include);
    const pending = chosen.filter((r) => !ready(r)).length;
    return (
      <div className="scan stack">
        {inputs}
        <h3>Esto es lo que veo ({phase.rows.length})</h3>
        <p className="small muted">
          Revisa cada alimento. Los marcados necesitan que confirmes la cantidad y la unidad antes de añadirlos.
        </p>
        <ul className="scan__rows">
          {phase.rows.map((r) => (
            <li key={r.key} className={`scan__row${r.flagged && !r.confirmed && r.include ? " scan__row--ask" : ""}`}>
              <label className="scan__include">
                <input type="checkbox" checked={r.include} onChange={(e) => patch(r.key, { include: e.target.checked })} />
                <span className="sr-only">Añadir {r.name}</span>
              </label>
              <input className="input scan__name" value={r.name} aria-label="Alimento"
                onChange={(e) => patch(r.key, { name: e.target.value })} />
              <input className="input scan__qty" inputMode="decimal" value={r.quantity} aria-label={`Cantidad de ${r.name}`}
                placeholder="Cant." onChange={(e) => patch(r.key, { quantity: e.target.value })} />
              <select className="input scan__unit" value={r.unit} aria-label={`Unidad de ${r.name}`}
                onChange={(e) => patch(r.key, { unit: e.target.value })}>
                <option value="">Unidad</option>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {r.owned ? (
                <span className="scan__note">Ya la tienes</span>
              ) : r.include && r.flagged && !r.confirmed ? (
                <span className="scan__note scan__note--ask">
                  {complete(r) ? (
                    <button type="button" className="btn btn--quiet btn--small" onClick={() => patch(r.key, { confirmed: true })}>
                      Confirmar
                    </button>
                  ) : "Falta cantidad o unidad"}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="actions">
          <button type="button" className="btn btn--primary" disabled={chosen.length === 0 || pending > 0}
            onClick={() => void add()}>
            {pending > 0 ? `Confirma ${pending} más` : `Añadir ${chosen.length} a la despensa`}
          </button>
          <button type="button" className="btn" onClick={() => cameraRef.current?.click()}>Repetir foto</button>
          <button type="button" className="btn btn--quiet" onClick={() => setPhase({ kind: "idle" })}>Descartar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`scan scan--drop stack stack--tight${dragging ? " is-dragging" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)} onDrop={onDrop}>
      {inputs}
      <h3>Añadir con una foto</h3>
      <p className="small muted">Fotografía la nevera o la despensa y la IA reconoce los alimentos. En el ordenador, sube o arrastra una foto.</p>
      <ErrorBox message={error} />
      {buttons}
    </div>
  );
}
