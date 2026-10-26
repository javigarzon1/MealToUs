import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  Dish, DishOptions, PantryItem, PlanContext, ShoppingResult, UserPreferences, WeeklyPlan,
} from "../types";

interface State {
  pantry: PantryItem[];
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

const STORAGE_KEY = "mealtous-state-v1";

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
  setPantry: (pantry: PantryItem[]) => void;
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

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }, [state]);

  const value = useMemo<PlanStateValue>(() => {
    const patch = (p: Partial<State>) => setState((s) => ({ ...s, ...p }));
    return {
      state,
      apiContext: { pantry: state.pantry, preferences: state.preferences },
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
