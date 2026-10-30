import { api } from "../api/client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  Dish, DishOptions, PantryItemOut, PlanContext, ShoppingResult, UserPreferences, WeeklyPlan,
} from "../types";

interface State {
  pantry: PantryItemOut[];
  preferences: UserPreferences;
  lunchOptions: DishOptions | null;
  lunch: Dish | null;
  dinnerOptions: DishOptions | null;
  dinner: Dish | null;
  plan: WeeklyPlan | null;
  shopping: ShoppingResult | null;
}

const INITIAL: State = {
  pantry: [],
  preferences: { people: 1, allergies: [], intolerances: [], dislikes: [] },
  lunchOptions: null,
  lunch: null,
  dinnerOptions: null,
  dinner: null,
  plan: null,
  shopping: null,
};

// Cada usuario guarda su progreso en su propia clave del navegador
const storageKey = (userId: number) => `mealtous-state-v1-user-${userId}`;

function load(key: string): State {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...INITIAL, ...JSON.parse(raw) };
  } catch {
    /* sin almacenamiento disponible: se parte de cero */
  }
  return INITIAL;
}

interface PlanStateValue {
  state: State;
  /** Datos que el backend necesita en cada petición */
  apiContext: PlanContext;
  setPantry: (pantry: PantryItemOut[]) => void;
  setPreferences: (preferences: UserPreferences) => void;
  setLunchOptions: (o: DishOptions) => void;
  chooseLunch: (d: Dish) => void;
  setDinnerOptions: (o: DishOptions) => void;
  chooseDinner: (d: Dish) => void;
  setPlan: (p: WeeklyPlan) => void;
  setShopping: (s: ShoppingResult) => void;
  reset: () => void;
}

const Ctx = createContext<PlanStateValue | null>(null);

export function PlanProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const key = storageKey(userId);
  const [state, setState] = useState<State>(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }, [key, state]);

  // La despensa y las preferencias viven en el servidor: se cargan al entrar
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listPantry(), api.getPreferences()])
      .then(([pantry, preferences]) => {
        if (!cancelled) setState((s) => ({ ...s, pantry, preferences }));
      })
      .catch(() => {
        /* sin conexión: se usa la copia local */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<PlanStateValue>(() => {
    const patch = (p: Partial<State>) => setState((s) => ({ ...s, ...p }));
    return {
      state,
      apiContext: {
        pantry: state.pantry.map(({ name, quantity }) => ({ name, quantity })),
        preferences: state.preferences,
      },
      setPantry: (pantry) => patch({ pantry }),
      setPreferences: (preferences) => patch({ preferences }),
      // Cambiar una elección invalida lo que dependía de ella
      setLunchOptions: (lunchOptions) =>
        patch({ lunchOptions, lunch: null, dinnerOptions: null, dinner: null, plan: null, shopping: null }),
      chooseLunch: (lunch) =>
        patch({ lunch, dinnerOptions: null, dinner: null, plan: null, shopping: null }),
      setDinnerOptions: (dinnerOptions) => patch({ dinnerOptions, dinner: null, plan: null, shopping: null }),
      chooseDinner: (dinner) => patch({ dinner, plan: null, shopping: null }),
      setPlan: (plan) => patch({ plan, shopping: null }),
      setShopping: (shopping) => patch({ shopping }),
      reset: () => setState(INITIAL),
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlan(): PlanStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlan debe usarse dentro de <PlanProvider>");
  return v;
}
