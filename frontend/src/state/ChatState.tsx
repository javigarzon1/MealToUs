import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import type { ChatMessage, TodayMenu } from "../types";
import { todayMenu } from "../utils/today";
import { usePlan } from "./PlanState";

export const ASK_TODAY = "¿Qué me toca cocinar hoy? Dime la receta paso a paso.";

/** Mensajes que se envían al modelo como máximo (la conversación completa se sigue viendo). */
const HISTORY = 20;

interface ChatValue {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  /** Lo que toca hoy según el menú; undefined si aún no hay menú */
  today: TodayMenu | undefined;
  /** Cajón del asistente en pantallas estrechas */
  open: boolean;
  setOpen: (open: boolean) => void;
  send: (text: string) => Promise<void>;
  /** Abre el asistente y le pregunta por la receta de hoy */
  askToday: () => void;
  clear: () => void;
}

const Ctx = createContext<ChatValue | null>(null);

/** La conversación vive aquí para que no se pierda al cambiar de pantalla. */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { state, apiContext } = usePlan();
  const today = useMemo(() => todayMenu(state.plan, state.shopping), [state.plan, state.shopping]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const log = useRef<ChatMessage[]>([]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy.current) return;
      busy.current = true;
      const next: ChatMessage[] = [...log.current, { role: "user", content }];
      log.current = next;
      setMessages(next);
      setLoading(true);
      setError(null);
      try {
        const res = await api.chat(next.slice(-HISTORY), apiContext, today);
        const done: ChatMessage[] = [...next, { role: "assistant", content: res.reply }];
        log.current = done;
        setMessages(done);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [apiContext, today],
  );

  const value = useMemo<ChatValue>(
    () => ({
      messages, loading, error, today, open, setOpen, send,
      askToday: () => {
        setOpen(true);
        void send(ASK_TODAY);
      },
      clear: () => {
        log.current = [];
        setMessages([]);
        setError(null);
      },
    }),
    [messages, loading, error, today, open, send],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat(): ChatValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChat debe usarse dentro de <ChatProvider>");
  return v;
}
