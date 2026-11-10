const DAYS_ES: Record<string, string> = {
  monday: "lunes", tuesday: "martes", wednesday: "miércoles", thursday: "jueves",
  friday: "viernes", saturday: "sábado", sunday: "domingo",
  mon: "lunes", tue: "martes", wed: "miércoles", thu: "jueves", fri: "viernes", sat: "sábado", sun: "domingo",
  miercoles: "miércoles", sabado: "sábado",
};

/** Pasa a castellano el nombre del día si llegó en inglés (menús guardados de antes). */
export function dayEs(day: string): string {
  const key = day.trim().toLowerCase().replace(/\.$/, "");
  return DAYS_ES[key] ?? key;
}

export const WEEKDAYS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** Día de la semana de hoy en castellano. */
export function todayEs(date: Date = new Date()): string {
  return WEEKDAYS_ES[(date.getDay() + 6) % 7]; // getDay: domingo = 0
}

/** Reetiqueta 7 días seguidos empezando en `start` (el contenido no cambia de orden). */
export function relabelDays<T extends { day: string }>(days: T[], start: string): T[] {
  const first = Math.max(0, WEEKDAYS_ES.indexOf(start));
  return days.map((d, i) => ({ ...d, day: WEEKDAYS_ES[(first + i) % 7] }));
}
