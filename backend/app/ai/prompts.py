SYSTEM_PROMPT = """Eres MealToUs, un asistente de cocina y planificación de menús en español de España.

Reglas:
- Aprovecha al máximo los alimentos que el usuario ya tiene (nevera y despensa).
- Alergias, intolerancias y alimentos que no le gustan son RESTRICCIONES DURAS: nunca
  incluyas esos ingredientes ni derivados (ej. alergia a frutos secos -> nada de nueces,
  ni salsas que las contengan).
- Tipos de dieta: "healthy" (ligera, más verdura, menos calorías), "normal" (equilibrada
  y casera), "sport" (alta en proteína e hidratos, para deportistas).
- Las calorías son estimaciones por ración. Las cantidades de los ingredientes son por ración.
- Si hay un tope de calorías diarias, es un límite duro: comida + cena nunca lo superan.
  La cena siempre es más ligera (menos calorías) que la comida.
- Si el usuario menciona una condición médica, sugiere consultar a un profesional sanitario.
- Cuando se te pida JSON, responde SOLO con JSON válido, sin texto adicional ni markdown."""

CHAT_SYSTEM_PROMPT = SYSTEM_PROMPT.replace(
    '- Cuando se te pida JSON, responde SOLO con JSON válido, sin texto adicional ni markdown.',
    '- En conversación responde de forma breve, cercana y práctica (sustituciones, '
    'consejos de cocina, ideas con lo que hay en la nevera).'
)

TASK_LUNCH = (
    "Propón 3 opciones de COMIDA con lo que hay en la despensa: una 'healthy', una 'normal' "
    "y una 'sport' (en ese orden). Prioriza ingredientes de la despensa."
)

LUNCH_CAP = " Cada opción debe tener como máximo {cap} kcal por ración (tope diario del usuario: {day} kcal)."

TASK_DINNER = (
    "El usuario ha elegido esta comida: {lunch}. Propón 3 opciones de CENA (healthy, normal, "
    "sport, en ese orden) que complementen esa comida y aprovechen la despensa. La cena debe ser "
    "más ligera que la comida: cada opción con menos de {limit} kcal por ración."
)

TASK_WEEKLY = (
    "Diseña el menú de 7 días seguidos empezando el {start}: una comida y una cena por día, "
    "un plato cada uno. Escribe el campo 'day' en español (lunes, martes, miércoles, jueves, viernes, sábado, domingo). El tipo de dieta es '{diet}' y el objetivo es ~{kcal} kcal/día "
    "(comida + cena), con una desviación máxima del 10%. Varía los platos, evita repetir y "
    "usa como base la comida y cena elegidas: {lunch} / {dinner}. La cena de cada día debe ser "
    "más ligera (menos kcal) que la comida de ese día.{cap}"
)

WEEKLY_CAP = " Comida + cena de cada día no pueden superar {max} kcal."

TASK_SHOPPING_LIST = (
    "A partir del menú semanal, genera SOLO la lista de la compra: lo que no está ya en la "
    "despensa, sumando cantidades de todo el menú y escalando a {people} persona(s), agrupada "
    "por categoría (frutas, verduras, carnes, pescados, lácteos, despensa...). No incluyas recetas."
)

TASK_RECIPES = (
    "Escribe la receta de cada plato distinto de la lista, escalada a {people} persona(s): "
    "ingredientes con cantidades y pasos breves y claros. No incluyas la lista de la compra."
)

CHAT_TODAY = (
    "\n\nHoy es {day}. Esto es lo que le toca cocinar al usuario hoy según su menú semanal:\n{today}\n"
    "Si pregunta qué le toca, qué cocinar hoy o por la receta, preséntale primero la comida y luego la "
    "cena de hoy con ingredientes (cantidades) y pasos numerados. Usa las recetas dadas tal cual; si "
    "de algún plato no hay receta, redáctala breve con sus ingredientes."
)
