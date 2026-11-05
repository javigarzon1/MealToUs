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
