/** Banco de preguntas para entretener la espera. [pregunta, [opciones], índice correcto, explicación]. */
export type Quiz = { q: string; options: string[]; answer: number; why: string };

const RAW: [string, string[], number, string][] = [
  // Proteínas
  ["¿Cuántas kcal aporta 1 g de proteína?", ["4", "7", "9"], 0, "Proteínas e hidratos aportan 4 kcal/g; las grasas, 9."],
  ["¿Cuántas kcal aporta 1 g de grasa?", ["4", "9", "12"], 1, "La grasa es el nutriente más calórico: 9 kcal por gramo."],
  ["¿Cuántas kcal aporta 1 g de hidratos de carbono?", ["2", "4", "9"], 1, "Los hidratos aportan 4 kcal/g, igual que las proteínas."],
  ["¿Cuál de estos alimentos tiene más proteína por 100 g?", ["Pechuga de pollo", "Arroz cocido", "Plátano"], 0, "La pechuga de pollo ronda los 22-30 g de proteína por 100 g."],
  ["¿Qué legumbre es famosa por su alto contenido en proteína?", ["Lenteja", "Judía verde", "Guisante fresco"], 0, "La lenteja seca aporta unos 24 g de proteína por 100 g."],
  ["¿Cuántos aminoácidos esenciales debemos obtener de la dieta?", ["3", "9", "20"], 1, "Son 9: el cuerpo no puede fabricarlos."],
  ["¿Qué alimento es una fuente completa de proteína vegetal?", ["Soja", "Lechuga", "Pepino"], 0, "La soja contiene todos los aminoácidos esenciales."],
  ["¿Cuál de estos pescados es azul?", ["Salmón", "Merluza", "Lenguado"], 0, "El salmón es azul: más grasa, rica en omega-3."],
  ["¿Qué huevo aporta más proteína, la clara o la yema, en total por unidad?", ["La clara", "La yema", "Igual"], 0, "La clara aporta unos 3,5 g y la yema unos 2,7 g."],
  ["¿Qué frutos secos aportan más proteína?", ["Cacahuetes", "Nueces de macadamia", "Castañas"], 0, "El cacahuete (en realidad una legumbre) ronda los 25 g por 100 g."],
  // Vitaminas
  ["¿Qué vitamina abunda en los cítricos?", ["Vitamina C", "Vitamina D", "Vitamina K"], 0, "Naranja, limón y pomelo son ricos en vitamina C."],
  ["¿Qué vitamina sintetiza la piel con el sol?", ["Vitamina D", "Vitamina C", "Vitamina B12"], 0, "La piel produce vitamina D al recibir radiación UVB."],
  ["¿Qué vitamina es clave para la visión y abunda en la zanahoria?", ["Vitamina A", "Vitamina B1", "Vitamina E"], 0, "La zanahoria aporta betacaroteno, que el cuerpo convierte en vitamina A."],
  ["¿Qué vitamina se encuentra casi solo en alimentos de origen animal?", ["B12", "C", "K"], 0, "La B12 solo está de forma fiable en productos animales; los veganos deben suplementarla."],
  ["¿Qué vitamina es esencial para la coagulación de la sangre?", ["Vitamina K", "Vitamina C", "Vitamina B6"], 0, "La vitamina K abunda en espinacas, brócoli y otras verduras de hoja."],
  ["¿Qué vitamina es importante antes y durante el embarazo para prevenir defectos del tubo neural?", ["Ácido fólico", "Vitamina E", "Vitamina A"], 0, "El ácido fólico (B9) se encuentra en legumbres y verduras de hoja."],
  ["¿Qué vitamina ayuda a absorber mejor el hierro de origen vegetal?", ["Vitamina C", "Vitamina D", "Vitamina K"], 0, "Una lenteja con un chorrito de limón absorbe mejor su hierro."],
  ["¿En qué alimento abunda la vitamina E?", ["Aceite de girasol", "Arroz blanco", "Pasta"], 0, "El aceite de girasol y los frutos secos son ricos en vitamina E."],
  ["¿Qué vitaminas son liposolubles?", ["A, D, E y K", "C y B", "Solo la C"], 0, "Se disuelven en grasa, por eso conviene tomarlas con algo de grasa."],
  ["¿Qué vitamina se pierde más fácilmente al hervir las verduras?", ["Vitamina C", "Vitamina K", "Vitamina A"], 0, "La vitamina C es hidrosoluble y sensible al calor: mejor al vapor."],
  // Minerales
  ["¿Qué mineral es clave para los huesos y abunda en los lácteos?", ["Calcio", "Hierro", "Yodo"], 0, "El calcio también está en sardinas con espinas, almendras y brócoli."],
  ["¿Qué mineral transporta el oxígeno en la sangre?", ["Hierro", "Sodio", "Calcio"], 0, "El hierro forma parte de la hemoglobina."],
  ["¿Qué mineral abunda en el plátano?", ["Potasio", "Zinc", "Flúor"], 0, "El potasio ayuda al músculo y a regular la tensión arterial."],
  ["¿Qué mineral es necesario para la tiroides?", ["Yodo", "Magnesio", "Cobre"], 0, "El yodo está en pescado, marisco y sal yodada."],
  ["¿Qué mineral relaja los músculos y está en las almendras?", ["Magnesio", "Sodio", "Selenio"], 0, "El magnesio también abunda en cacao, legumbres y semillas."],
  ["¿Qué mineral se asocia con un exceso de sal en la dieta?", ["Sodio", "Potasio", "Fósforo"], 0, "Demasiado sodio puede elevar la tensión arterial."],
  ["¿Cuál es el máximo de sal diaria que recomienda la OMS para un adulto?", ["5 g", "10 g", "15 g"], 0, "La OMS recomienda menos de 5 g de sal al día (unos 2 g de sodio)."],
  ["¿Qué mineral abunda en las ostras y las semillas de calabaza?", ["Zinc", "Calcio", "Yodo"], 0, "El zinc apoya el sistema inmune y la cicatrización."],
  ["¿Qué alimento es mejor fuente de hierro?", ["Lentejas", "Manzana", "Pan blanco"], 0, "Las legumbres aportan hierro no hemo, que mejora con vitamina C."],
  // Fibra
  ["¿Qué es la fibra?", ["Parte de los vegetales que no se digiere del todo", "Un tipo de grasa", "Una vitamina"], 0, "Alimenta la microbiota y mejora el tránsito intestinal."],
  ["¿Cuánta fibra se recomienda al día a un adulto, aproximadamente?", ["25-30 g", "5 g", "80 g"], 0, "Entre 25 y 30 g diarios; la mayoría de la gente toma menos."],
  ["¿Qué alimento tiene más fibra?", ["Lentejas cocidas", "Zumo de naranja", "Pan blanco"], 0, "Las legumbres son de las mejores fuentes de fibra."],
  ["¿Cuál es mejor para la fibra, la fruta entera o el zumo?", ["Fruta entera", "Zumo", "Igual"], 0, "Al exprimir se pierde casi toda la fibra y suben más los azúcares libres."],
  ["¿Qué cereal integral tiene más fibra?", ["Avena", "Arroz blanco", "Cuscús refinado"], 0, "La avena contiene betaglucanos, un tipo de fibra soluble."],
  ["¿Qué fruta tiene la piel rica en fibra?", ["Pera", "Sandía", "Melón"], 0, "Comer la pera con piel multiplica su fibra."],
  ["Si aumentas la fibra de golpe, ¿qué conviene hacer a la vez?", ["Beber más agua", "Beber menos", "Tomar solo líquidos"], 0, "La fibra necesita agua para funcionar bien."],
  // Hidratos
  ["¿Qué tiene menor índice glucémico?", ["Lentejas", "Pan blanco", "Patata cocida"], 0, "Las legumbres elevan la glucosa más despacio."],
  ["¿Qué son los hidratos complejos?", ["Almidones y fibra", "Azúcares simples", "Grasas saturadas"], 0, "Se digieren más lento y sacian más que los azúcares simples."],
  ["¿Qué contiene azúcar de forma natural?", ["La fruta", "El aceite de oliva", "La sal"], 0, "La fruta tiene fructosa, pero también fibra, agua y vitaminas."],
  ["¿Qué pasta o arroz sacia más?", ["Integral", "Refinado", "Es igual"], 0, "La versión integral conserva fibra y sacia más."],
  ["¿Qué ocurre al enfriar patata o arroz cocidos y recalentarlos?", ["Se forma almidón resistente", "Pierden toda la proteína", "Se vuelven más calóricos"], 0, "El almidón resistente actúa casi como fibra y eleva menos la glucosa."],
  ["¿Cuál es la fuente de energía preferida del cerebro?", ["Glucosa", "Colesterol", "Sodio"], 0, "El cerebro usa sobre todo glucosa, aunque también puede usar cetonas."],
  ["¿Qué cantidad máxima de azúcares libres recomienda la OMS?", ["Menos del 10 % de las kcal", "Menos del 40 % de las kcal", "Ninguna"], 0, "Y mejor aún por debajo del 5 %."],
  // Grasas
  ["¿Qué tipo de grasa predomina en el aceite de oliva?", ["Monoinsaturada", "Saturada", "Trans"], 0, "El ácido oleico es la grasa monoinsaturada típica de la dieta mediterránea."],
  ["¿Qué pescado es rico en omega-3?", ["Sardina", "Merluza", "Bacalao"], 0, "Los pescados azules (sardina, caballa, salmón) son la mejor fuente."],
  ["¿Qué grasas conviene limitar al máximo?", ["Las trans", "Las monoinsaturadas", "Las omega-3"], 0, "Las trans industriales empeoran el colesterol."],
  ["¿Qué fruto seco es especialmente rico en omega-3 vegetal?", ["Nuez", "Anacardo", "Pistacho"], 0, "La nuez aporta ácido alfa-linolénico."],
  ["¿Qué alimento tiene más grasa saturada?", ["Mantequilla", "Aguacate", "Aceite de oliva"], 0, "La mantequilla es mayoritariamente grasa saturada."],
  ["¿El colesterol de la dieta es el principal responsable del colesterol en sangre?", ["No, pesan más las grasas saturadas", "Sí, siempre", "No influye nada"], 0, "El hígado fabrica la mayor parte; las saturadas y trans influyen más."],
  ["¿Qué fruta es rica en grasa saludable?", ["Aguacate", "Fresa", "Manzana"], 0, "El aguacate aporta grasa monoinsaturada."],
  // Hidratación
  ["¿Qué porcentaje aproximado del cuerpo adulto es agua?", ["60 %", "20 %", "90 %"], 0, "Alrededor del 55-60 % del peso corporal."],
  ["¿Cuánto líquido se aconseja beber al día, aproximadamente?", ["1,5-2 litros", "5 litros", "300 ml"], 0, "Contando también el agua de los alimentos, sobre 2 litros."],
  ["¿Qué fruta tiene más agua?", ["Sandía", "Plátano", "Uva pasa"], 0, "La sandía ronda el 92 % de agua."],
  ["¿Cuál es la mejor bebida para hidratarse a diario?", ["Agua", "Refresco", "Zumo envasado"], 0, "El agua hidrata sin azúcares ni calorías añadidas."],
  ["¿Qué signo indica que puedes estar deshidratado?", ["Orina oscura", "Orina clara", "Mucha energía"], 0, "La orina muy oscura suele indicar que falta agua."],
  ["¿La sed aparece antes o después de empezar la deshidratación?", ["Después", "Antes", "Nunca"], 0, "Cuando notas sed ya hay una ligera deshidratación, sobre todo en mayores."],
  // Hábitos
  ["¿Cuántas raciones de fruta y verdura se recomiendan al día?", ["Al menos 5", "1", "10 solo de fruta"], 0, "El lema «5 al día» sigue siendo una buena referencia mínima."],
  ["¿Cuánto tarda el cerebro en recibir la señal de saciedad, aproximadamente?", ["Unos 20 minutos", "2 minutos", "2 horas"], 0, "Comer despacio ayuda a no pasarse."],
  ["¿Qué ayuda a saciarse más con las mismas kcal?", ["Proteína y fibra", "Azúcar", "Bebidas azucaradas"], 0, "Ambas aumentan la sensación de saciedad."],
  ["¿Qué es el plato saludable de Harvard?", ["Mitad verduras y fruta, un cuarto proteína, un cuarto cereal integral", "Mitad pasta", "Mitad carne"], 0, "Una guía visual para repartir cada comida."],
  ["¿Cuándo es mejor hacer la compra?", ["Con la lista y sin hambre", "Con mucha hambre", "Sin lista"], 0, "Comprar con hambre favorece los ultraprocesados."],
  ["¿Qué alimentos conviene limitar?", ["Ultraprocesados", "Legumbres", "Verduras"], 0, "Suelen tener mucho azúcar, sal y grasas de baja calidad."],
  ["¿Es mejor cenar más ligero que comer?", ["Suele sentar mejor", "Cenar el doble", "No importa nunca"], 0, "Una cena ligera facilita el descanso para muchas personas."],
  // Cocina y conservación
  ["¿Qué método conserva mejor las vitaminas de las verduras?", ["Al vapor", "Hervir mucho tiempo", "Freír"], 0, "Menos agua y menos tiempo, menos pérdidas."],
  ["¿A qué temperatura debe estar la nevera?", ["Entre 0 y 5 °C", "10 °C", "15 °C"], 0, "A 4 °C o menos se frena el crecimiento de bacterias."],
  ["¿Cuánto tiempo máximo se puede dejar comida cocinada a temperatura ambiente?", ["2 horas", "8 horas", "1 día"], 0, "Pasado ese tiempo crecen bacterias con rapidez."],
  ["¿Cómo se descongela mejor la carne?", ["En la nevera", "En la encimera", "Con agua tibia varias horas"], 0, "Es la forma más segura."],
  ["¿Qué hay que hacer con las tablas tras cortar pollo crudo?", ["Lavarlas bien con agua caliente y jabón", "Nada", "Pasar un trapo seco"], 0, "Evita la contaminación cruzada."],
  ["¿Hasta qué temperatura interior debe cocinarse el pollo?", ["74 °C", "40 °C", "55 °C"], 0, "A 74 °C se eliminan los patógenos habituales."],
  ["¿Qué ocurre si lavas el pollo crudo bajo el grifo?", ["Salpica bacterias por la cocina", "Lo deja más limpio", "Nada"], 0, "No se recomienda: mejor cocinarlo bien."],
  ["¿Cuál es una buena forma de dar sabor sin añadir sal?", ["Especias y hierbas", "Más azúcar", "Más aceite"], 0, "Ajo, pimentón, comino, perejil o limón dan mucho sabor."],
  ["¿Qué sucede al cocinar el tomate con aceite?", ["Se absorbe mejor el licopeno", "Se destruye todo", "Pierde sabor"], 0, "El licopeno es liposoluble y el calor lo hace más disponible."],
  ["¿Qué verdura llora al cortarla por su compuesto sulfurado?", ["Cebolla", "Zanahoria", "Calabacín"], 0, "Al cortarla se libera un gas que irrita los ojos."],
  ["¿Cuál es la mejor forma de guardar el pan para que dure más?", ["Congelado en rebanadas", "En la nevera", "Al aire libre"], 0, "La nevera lo reseca antes; el congelador lo conserva bien."],
  ["¿Qué hay que hacer con las legumbres secas antes de cocerlas?", ["Ponerlas en remojo", "Freírlas", "Nada, siempre se echan en seco"], 0, "El remojo acorta la cocción y las hace más digestivas."],
  // Mitos
  ["¿Engorda más comer pan por la noche que por la mañana?", ["No, importa el total del día", "Sí, mucho más", "Solo el pan integral"], 0, "El balance calórico total pesa más que la hora."],
  ["¿Las dietas «detox» son necesarias?", ["No, el hígado y los riñones ya depuran", "Sí, cada mes", "Solo en verano"], 0, "No hay evidencia de que limpien más que tu propio organismo."],
  ["¿El apio tiene calorías negativas?", ["No, es un mito", "Sí", "Solo cocido"], 0, "Digerirlo gasta muy poca energía, no más de la que aporta."],
  ["¿El huevo es perjudicial por el colesterol?", ["En general, no en personas sanas", "Siempre", "Solo la clara"], 0, "Un consumo moderado suele ser compatible con una dieta saludable."],
  ["¿La fruta por la noche engorda?", ["No por la hora", "Sí", "Solo la manzana"], 0, "Lo que cuenta es el total diario de calorías."],
  ["¿Los productos «light» siempre son más saludables?", ["No necesariamente", "Sí siempre", "Solo los lácteos"], 0, "Pueden llevar más azúcar o aditivos para compensar el sabor."],
  ["¿Hace falta cenar solo ensalada para adelgazar?", ["No", "Sí", "Solo en invierno"], 0, "Una cena ligera pero completa es mejor que pasar hambre."],
  ["¿El azúcar moreno es más sano que el blanco?", ["Casi igual", "Mucho más", "Es mejor sin límite"], 0, "Nutricionalmente se parecen mucho: ambos son azúcar."],
  ["¿Se pueden perder grasa de una zona concreta del cuerpo haciendo ejercicio local?", ["No", "Sí", "Solo en el abdomen"], 0, "La grasa se pierde de forma general, no localizada."],
  ["¿Beber agua con las comidas engorda?", ["No", "Sí", "Solo fría"], 0, "El agua no tiene calorías."],
  // Calorías y energía
  ["Un puñado de frutos secos (30 g) aporta aproximadamente…", ["180 kcal", "20 kcal", "500 kcal"], 0, "Son saludables pero calóricos: ojo con las cantidades."],
  ["¿Cuántas kcal tiene un huevo mediano, más o menos?", ["70-80", "200", "10"], 0, "Cerca de 75 kcal, con unos 6 g de proteína."],
  ["¿Qué aporta más energía por cucharada?", ["Aceite de oliva", "Azúcar", "Harina"], 0, "Una cucharada de aceite son unas 90-110 kcal."],
  // Alimentos y curiosidades
  ["¿Qué verdura de la familia de las crucíferas es rica en vitamina C y K?", ["Brócoli", "Calabaza", "Patata"], 0, "El brócoli es de los más completos."],
  ["¿Qué alimento fermentado contiene probióticos?", ["Yogur natural", "Pan de molde", "Galletas"], 0, "Los fermentos del yogur apoyan la microbiota."],
  ["¿Qué es la quinoa?", ["Una semilla (pseudocereal)", "Un tubérculo", "Una fruta"], 0, "No contiene gluten y aporta proteína completa."],
  ["¿Qué especia tiene como compuesto activo la curcumina?", ["Cúrcuma", "Pimienta", "Canela"], 0, "La pimienta negra ayuda a absorberla."],
  ["¿Qué alimento es rico en calcio y vegetal?", ["Tofu con calcio", "Arroz", "Pasta"], 0, "El tofu preparado con sales de calcio es buena fuente."],
  ["¿Qué fruta es muy rica en vitamina C, más que la naranja?", ["Kiwi", "Plátano", "Manzana"], 0, "Un kiwi cubre buena parte de las necesidades diarias."],
  ["¿Cuál de estos es un cereal sin gluten?", ["Arroz", "Trigo", "Cebada"], 0, "El arroz y el maíz no contienen gluten."],
  ["¿Qué proteína vegetal se obtiene del trigo?", ["Seitán", "Tempeh", "Tofu"], 0, "El seitán es gluten de trigo; el tofu y el tempeh son de soja."],
  ["¿Qué aporta el pimiento rojo en comparación con el verde?", ["Más vitamina C", "Menos vitaminas", "Más grasa"], 0, "El rojo está más maduro y suele tener más vitamina C y carotenos."],
  ["¿Qué aporta el color naranja de la zanahoria y la calabaza?", ["Betacaroteno", "Hierro", "Calcio"], 0, "El betacaroteno es un precursor de la vitamina A."],
  ["¿Qué nutriente es especialmente importante para la recuperación tras el deporte?", ["Proteína e hidratos", "Solo sal", "Solo grasa"], 0, "Los hidratos reponen glucógeno y la proteína repara músculo."],
  ["¿Cuánta proteína por kilo de peso necesita un adulto sedentario, aproximadamente?", ["0,8 g", "3 g", "0,1 g"], 0, "Los deportistas pueden necesitar entre 1,2 y 2 g/kg."],
];

export const QUESTIONS: Quiz[] = RAW.map(([q, options, answer, why]) => ({ q, options, answer, why }));

/** Baraja una copia con Fisher-Yates. */
export function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
