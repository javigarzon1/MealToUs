import type {
  AuthUser, ChatMessage, Dish, DishOptions, PantryItem, PantryItemOut, PlanContext, ShoppingItem,
  ShoppingResult, SupermarketLinks, UserPreferences, WeeklyPlan,
} from "../types";

// Por defecto usa el proxy de Vite (/api -> backend en :8000), así la cookie de sesión es del mismo origen
const BASE = import.meta.env.VITE_API_URL ?? "/api";

/** Se emite cuando el servidor responde 401 a una petición normal: la sesión ha caducado. */
export const UNAUTHORIZED_EVENT = "mealtous:unauthorized";

function describe(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => String(d?.msg ?? JSON.stringify(d)).replace(/^Value error, /, ""))
      .join(" ");
  }
  return JSON.stringify(detail);
}

async function request<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está el backend arrancado en el puerto 8000?");
  }

  if (res.status === 401 && !path.startsWith("/auth/")) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!res.ok) {
    let detail: string = await res.text();
    try {
      const parsed = JSON.parse(detail);
      detail = describe(parsed.detail ?? parsed);
    } catch {
      /* el cuerpo no era JSON: se deja el texto tal cual */
    }
    throw new Error(res.status >= 500 ? `Error ${res.status}: ${detail}` : detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const post = <T,>(path: string, body?: unknown) => request<T>("POST", path, body ?? {});

export const api = {
  // --- Cuenta ---
  register: (email: string, password: string) => post<AuthUser>("/auth/register", { email, password }),
  login: (email: string, password: string) => post<AuthUser>("/auth/login", { email, password }),
  logout: () => post<void>("/auth/logout"),
  me: () => request<AuthUser>("GET", "/auth/me"),

  // --- Despensa y preferencias (por usuario) ---
  listPantry: () => request<PantryItemOut[]>("GET", "/pantry"),
  addPantryItem: (item: PantryItem) => post<PantryItemOut>("/pantry", item),
  deletePantryItem: (id: number) => request<void>("DELETE", `/pantry/${id}`),
  getPreferences: () => request<UserPreferences>("GET", "/preferences"),
  savePreferences: (prefs: UserPreferences) => post<UserPreferences>("/preferences", prefs),

  // --- IA ---
  lunchOptions: (ctx: PlanContext) => post<DishOptions>("/menus/lunch-options", ctx),
  dinnerOptions: (ctx: PlanContext, chosen_lunch: Dish) =>
    post<DishOptions>("/menus/dinner-options", { ...ctx, chosen_lunch }),
  weeklyPlan: (ctx: PlanContext, chosen_lunch: Dish, chosen_dinner: Dish) =>
    post<WeeklyPlan>("/menus/weekly-plan", { ...ctx, chosen_lunch, chosen_dinner }),
  shopping: (ctx: PlanContext, plan: WeeklyPlan) =>
    post<ShoppingResult>("/menus/shopping", { ...ctx, plan }),
  chat: (messages: ChatMessage[], context?: PlanContext) =>
    post<{ reply: string }>("/menus/chat", { messages, context }),
  supermarketLinks: (supermarket: string, items: ShoppingItem[]) =>
    post<SupermarketLinks>("/shopping/supermarket-links", { supermarket, items }),
};
