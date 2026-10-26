import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { api } from "../api/client";
import { ErrorBox } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";
import type { ChatMessage } from "../types";

const IDEAS = [
  "¿Qué puedo cocinar hoy con lo que tengo?",
  "Sustituye la leche en una receta sin lactosa",
  "Dame ideas de desayunos con muchas proteínas",
];

export default function Chat() {
  const { apiContext } = usePlan();
  const { loading, error, run } = useAction();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    const res = await run(() => api.chat(next, apiContext));
    if (res) setMessages([...next, { role: "assistant", content: res.reply }]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  }

  return (
    <section className="stack">
      <div>
        <h2>Asistente de dietas y recetas</h2>
        <p className="muted">
          Pregúntale lo que quieras: sustituciones, ideas con lo que hay en tu nevera, consejos de cocina.
          Conoce tu despensa y tus preferencias.
        </p>
      </div>

      <div className="card">
        <div className="chat-log" aria-live="polite">
          {messages.length === 0 && (
            <div className="stack">
              <p className="muted">Prueba con una de estas ideas:</p>
              <div className="chips">
                {IDEAS.map((i) => (
                  <button key={i} onClick={() => send(i)}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="bubble assistant">
              <span className="spinner" aria-hidden="true" /> Pensando…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-form" onSubmit={onSubmit}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu pregunta… (Enter envía, Shift+Enter nueva línea)"
            aria-label="Mensaje"
            rows={2}
          />
          <button className="primary" type="submit" disabled={loading || !draft.trim()}>
            Enviar
          </button>
        </form>
      </div>

      <ErrorBox message={error} />

      {messages.length > 0 && (
        <div className="row end">
          <button className="link" onClick={() => setMessages([])}>
            Nueva conversación
          </button>
        </div>
      )}
    </section>
  );
}
