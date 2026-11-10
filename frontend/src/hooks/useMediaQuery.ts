import { useEffect, useState } from "react";

/** Tres columnas (favoritos | página | asistente) a partir de este ancho. */
export const WIDE_QUERY = "(min-width: 1400px)";
/** Asistente fijo a la derecha a partir de este ancho; por debajo, cajón desplegable. */
export const CHAT_QUERY = "(min-width: 960px)";

export function useMediaQuery(query: string): boolean {
  const get = () => typeof window !== "undefined" && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
