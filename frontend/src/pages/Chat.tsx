import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ErrorBox } from "../components/Feedback";
import { useAction } from "../hooks/useAction";
import { usePlan } from "../state/PlanState";
import type { ChatMessage } from "../types";
import { todayMenu } from "../utils/today";

const ASK_TODAY = "¿Qué me toca cocinar hoy? Dime la receta paso a paso.";

const IDEAS = [
  "¿Qué puedo cocinar hoy con lo que tengo?",
  "Sustituye la leche en una receta sin lactosa",
  "Dame ideas de desayunos con muchas proteínas",
];

export default function Chat() {
  const { state, apiContext } = usePlan();
  const location = useLocation();
  const navigate = useNavigate();
  const today = useMemo(() => todayMenu(state.plan, state.shopping), [state.plan, state.shopping]);
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
    const res = await run(() => api.chat(next, apiContext, today));
    if (res) setMessages([...next, { role: "assistant", content: res.reply }]);
  }

  // Llegar desde "Cocinar hoy con el asistente" pregunta directamente por la receta de hoy
  const asked = useRef(false);
  useEffect(() => {
    const ask = (location.state as { ask?: boolean } | null)?.ask;
    if (ask && !asked.current) {
      asked.current = true;
      navigate(location.pathname, { replace: true, state: null });
      if (today) void send(ASK_TODAY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="page__head">
        <h2>Asistente de dietas y recetas</h2>
        <p className="page__lede">
          Pregúntale lo que quieras: sustituciones, ideas con lo que hay en tu nevera, consejos de cocina.
          Conoce tu despensa y tus preferencias.
        </p>
      </div>

      <div className="chat">
        <div className="chat__log" aria-live="polite">
          {messages.length === 0 && (
            <div className="ideas">
              <p className="muted">Prueba con una de estas ideas</p>
              {today ? (
                <button className="suggest suggest--today" onClick={() => send(ASK_TODAY)}>
                  ¿Qué me toca cocinar hoy? ({today.day})
                </button>
              ) : (
                <p className="small muted">
                  Genera tu menú semanal y el asistente podrá decirte la receta que te toca cada día.
                </p>
              )}
              {IDEAS.map((i) => (
                <button key={i} className="suggest" onClick={() => send(i)}>
                  {i}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble bubble--${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="bubble bubble--assistant">
              <span className="spinner" aria-hidden="true" /> Pensando…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat__form" onSubmit={onSubmit}>
          <textarea
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu pregunta (Enter envía, Shift+Enter nueva línea)"
            aria-label="Mensaje"
            rows={2}
          />
          <button className="btn btn--primary" type="submit" disabled={loading || !draft.trim()}>
            Enviar
          </button>
        </form>
      </div>

      <ErrorBox message={error} />

      {messages.length > 0 && (
        <div className="actions actions--end">
          <button className="btn btn--quiet btn--small" onClick={() => setMessages([])}>
            Nueva conversación
          </button>
        </div>
      )}
    </section>
  );
}
