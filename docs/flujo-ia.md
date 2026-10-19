# Flujo del agente de IA

1. **Entrada**: el usuario indica lo que tiene en nevera/despensa y sus preferencias
   (nº de personas, alergias, intolerancias, alimentos que no le gustan).
2. **Comida (3 opciones)**: `POST /api/menus/lunch-options`.
   Healthy / Normal / Deportista. El usuario elige una y eso fija las kcal de referencia.
3. **Cena (3 opciones)**: `POST /api/menus/dinner-options`.
   Mismo esquema, coherente con la comida elegida.
4. **Menú semanal**: `POST /api/menus/weekly-plan`.
   7 días, un plato de comida y uno de cena por día, con kcal diarias ≈ comida + cena elegidas.
5. **Lista de la compra y recetas**: `POST /api/menus/shopping`.
   Solo lo que NO está ya en la despensa, escalado al nº de personas.
6. **(Opcional) Supermercados**: `POST /api/shopping/supermarket-links`.

## Garantías de seguridad alimentaria

- Alergias, intolerancias y aversiones se envían al LLM como restricciones duras.
- Además, `ai/validators.py` revisa los ingredientes de la respuesta. Si hay conflicto,
  el agente reintenta indicando el error (máximo 2 reintentos).
- Limitación: el validador compara texto (por ejemplo "cacahuete"). Para familias de
  alimentos ("lácteos") confía en el LLM; amplía `ALLERGEN_FAMILIES` según lo necesites.
- Las kcal son estimaciones. La app no sustituye a un dietista ni a un médico.
