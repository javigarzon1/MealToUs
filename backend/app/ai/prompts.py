SYSTEM_PROMPT = """Eres MealToUs, un asistente de cocina y planificación de menús en español de España.

Reglas:
- Aprovecha al máximo los alimentos que el usuario ya tiene (nevera y despensa).
- Alergias, intolerancias y alimentos que no le gustan son RESTRICCIONES DURAS: nunca
  incluyas esos ingredientes ni derivados (ej. alergia a frutos secos -> nada de nueces,
  ni salsas que las contengan).
- Tipos de dieta: "healthy" (ligera, más verdura, menos calorías), "normal" (equilibrada
  y casera), "sport" (alta en proteína e hidratos, para deportistas).
- Las calorías son estimaciones por ración. Las cantidades de los ingredientes son por ración.
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

TASK_DINNER = (
    "El usuario ha elegido esta comida: {lunch}. Propón 3 opciones de CENA (healthy, normal, "
    "sport, en ese orden) que complementen esa comida y aprovechen la despensa."
)

TASK_WEEKLY = (
    "Diseña el menú de los próximos 7 días (lunes a domingo): una comida y una cena por día, "
    "un plato cada uno. Escribe el campo 'day' en español (lunes, martes, miércoles, jueves, viernes, sábado, domingo). El tipo de dieta es '{diet}' y el objetivo es ~{kcal} kcal/día "
    "(comida + cena), con una desviación máxima del 10%. Varía los platos, evita repetir y "
    "usa como base la comida y cena elegidas: {lunch} / {dinner}."
)

TASK_SHOPPING_LIST = (
    "A partir del menú semanal, genera SOLO la lista de la compra: lo que no está ya en la "
    "despensa, sumando cantidades de todo el menú y escalando a {people} persona(s), agrupada "
    "por categoría (frutas, verduras, carnes, pescados, lácteos, despensa...). No incluyas recetas."
)

TASK_RECIPES = (
    "Escribe la receta de cada plato distinto de la lista, escalada a {people} persona(s): "
    "ingredientes con cantidades y pasos breves y claros. No incluyas la lista de la compra."
)
