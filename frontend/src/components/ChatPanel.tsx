import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { ASK_TODAY, useChat } from "../state/ChatState";
import { ErrorBox } from "./Feedback";

const IDEAS = [
  "¿Qué puedo cocinar con lo que tengo?",
  "Sustituye la leche en una receta sin lactosa",
  "Dame ideas de desayunos con muchas proteínas",
];

/** Asistente siempre a mano: conoce la despensa, las preferencias y el menú de la semana. */
export default function ChatPanel({ onClose }: { onClose?: () => void }) {
  const { messages, loading, error, today, send, clear } = useChat();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    if (onClose) inputRef.current?.focus(); // en el cajón, se puede escribir al abrirlo
  }, [onClose]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    setDraft("");
    void send(t);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(draft);
    }
  }

  return (
    <section className="chatpanel" aria-label="Asistente de cocina">
      <header className="chatpanel__head">
        <div>
          <h2 className="chatpanel__title">Asistente</h2>
          <p className="chatpanel__sub">Conoce tu despensa, tus preferencias y tu menú.</p>
        </div>
        <div className="chatpanel__tools">
          {messages.length > 0 && (
            <button className="btn btn--quiet btn--small" onClick={clear}>Nueva</button>
          )}
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Cerrar el asistente">×</button>
          )}
        </div>
      </header>

      <div className="chatpanel__log" aria-live="polite">
        {messages.length === 0 && (
          <div className="ideas">
            <p className="muted">Pregúntame lo que quieras. Por ejemplo:</p>
            {today ? (
              <button className="suggest suggest--today" onClick={() => submit(ASK_TODAY)}>
                ¿Qué me toca cocinar hoy? ({today.day})
              </button>
            ) : (
              <p className="small muted">
                Genera tu menú semanal y te diré la receta que te toca cada día.
              </p>
            )}
            {IDEAS.map((i) => (
              <button key={i} className="suggest" onClick={() => submit(i)}>{i}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`}>{m.content}</div>
        ))}
        {loading && (
          <div className="bubble bubble--assistant">
            <span className="spinner" aria-hidden="true" /> Pensando…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <ErrorBox message={error} />

      <form className="chatpanel__form" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe tu pregunta…"
          aria-label="Mensaje para el asistente"
          rows={2}
        />
        <button className="btn btn--primary" type="submit" disabled={loading || !draft.trim()}>
          Enviar
        </button>
      </form>
    </section>
  );
}
