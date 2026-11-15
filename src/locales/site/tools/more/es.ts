import type { MoreTools } from "./types";

// TDEE, macros, Wilks y DOTS en español (tú). Mismas partes que las páginas inglesas (src/app/tools/).
export const ES_MORE: MoreTools = {
  "tdee-calculator": {
    page: {
      title: "Calculadora de TDEE: calorías al día para mantener, definir o ganar",
      description:
        "Calcula tu gasto energético diario total con tu edad, sexo, altura, peso y actividad: metabolismo basal, IMC, calorías para definir o ganar músculo y un rango de proteína para quien entrena.",
      name: "Calculadora de TDEE",
      intro:
        "Cuántas calorías quemas al día y qué comer para mantener, perder o ganar peso. Toca + y − para poner tus números; mantén pulsado para ir más rápido.",
      sticky: "Calorías que siguen a tus pesajes",
      mid: {
        title: "Mantenlo al día sin pensarlo",
        body: "Tu TDEE cambia con tu peso y tu entrenamiento. {app} lo recalcula solo con tus pesajes y los días que de verdad entrenas, y te muestra cómo cambia con el tiempo.",
        button: "Abre {app}",
      },
      end: {
        title: "Tu TDEE, siempre al día",
        body: "{app} lo recalcula con tus pesajes y los días que entrenas, y además planifica tus entrenamientos.",
      },
      faq: [
        [
          "¿Qué es el TDEE?",
          "El gasto energético diario total: las calorías que quemas en un día, sumando tu metabolismo en reposo (BMR), la digestión, el movimiento diario y el ejercicio. Si comes más o menos eso, tu peso se mantiene.",
        ],
        [
          "¿Qué fórmula usa?",
          "Mifflin-St Jeor para el gasto en reposo, la más precisa de las ecuaciones comunes para la mayoría. Si añades tu grasa corporal, pasa a Katch-McArdle, que parte de la masa magra y encaja mejor con quien tiene músculo. Después el BMR se multiplica por un factor de actividad de 1,2 (sedentario) a 1,9 (atleta).",
        ],
        [
          "¿Cuántas calorías para perder o ganar peso?",
          "Unas 500 por debajo del TDEE hacen perder alrededor de 0,5 kg a la semana. Para ganar músculo con poca grasa, unas 250 por encima. Pésate unas cuantas veces por semana y ajusta si la tendencia no cuadra.",
        ],
        [
          "¿Qué precisión tiene?",
          "Cualquier fórmula es una estimación, a menudo con un margen del 10 % para la mayoría de la gente. La báscula manda: si tu tendencia de dos o tres semanas no cuadra, sube o baja 100 a 200 calorías.",
        ],
        [
          "¿{app} mantiene mi TDEE al día?",
          "Sí. En {app} tu TDEE se recalcula solo cuando cambian tu peso, tu edad o tu entrenamiento, lee peso, altura y grasa corporal de Health Connect o Apple Health si lo permites, pone tu nivel de actividad según los días que de verdad entrenas y te muestra su evolución.",
        ],
      ],
      reading: [
        { href: "/es/tools/macro-calculator/", label: "la calculadora de macros" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "cuánta proteína para ganar músculo" },
        { href: "/blog/body-recomposition/", label: "la recomposición corporal" },
      ],
    },
    ui: {
      units: "Unidades",
      metric: "Métrico",
      imperial: "Imperial",
      sex: "Sexo",
      female: "Mujer",
      male: "Hombre",
      age: "Edad",
      weightKg: "Peso (kg)",
      weightLb: "Peso (lb)",
      heightCm: "Altura (cm)",
      heightIn: "Altura (in)",
      fat: "Grasa corporal (opcional)",
      skip: "Omitir",
      add: "Añadir",
      fatPct: "Grasa corporal (%)",
      activity: "Actividad",
    },
  },
  "macro-calculator": {
    page: {
      title: "Calculadora de macros para quien entrena: proteína, grasa y carbohidratos",
      description:
        "Calcula calorías y macros para perder grasa, mantener o ganar músculo según tu edad, sexo, altura, peso y actividad, con la proteína pensada para quien levanta pesas.",
      name: "Calculadora de macros",
      intro:
        "Las calorías para tu objetivo a partir de tu TDEE, repartidas en proteína, grasa y carbohidratos para alguien que entrena fuerza, con el porqué de cada número.",
      sticky: "Macros que siguen a tus pesajes",
      mid: {
        title: "Macros que van a tu ritmo",
        body: "En {app} tus calorías y macros siguen a tus pesajes y a tus días de entrenamiento, y el entrenador te avisa cuando te falta proteína.",
        button: "Empieza gratis",
      },
      end: {
        title: "Entrena para el objetivo por el que comes",
        body: "{app} planifica cada entrenamiento según tu recuperación y tu bloque, para que en definición no pierdas fuerza y en volumen ganes músculo.",
      },
      faq: [
        [
          "¿Cuánta proteína necesito para ganar músculo?",
          "La mayoría de los estudios con gente que entrena fuerza dan entre 1,6 y 2,2 g por kg de peso al día. Esta calculadora usa 1,8 g para mantener o ganar y 2,2 g en definición, donde más proteína ayuda a conservar el músculo.",
        ],
        [
          "¿Cómo se fijan la grasa y los carbohidratos?",
          "La grasa se lleva una cuarta parte de las calorías, pero nunca menos de 0,6 g por kg, para cuidar las hormonas. Los carbohidratos llenan el resto, porque son el combustible de las series duras. Si prefieres más grasa y menos carbohidratos, cámbialos por calorías: 1 g de grasa son 9 calorías y 1 g de carbohidratos, 4.",
        ],
        [
          "¿Cuántas calorías para perder grasa o ganar músculo?",
          "Unas 500 por debajo del TDEE hacen perder alrededor de 0,5 kg a la semana, sin bajar nunca del metabolismo basal. Unas 250 por encima construyen músculo con poca grasa. Pésate unas cuantas veces por semana y ajusta si la tendencia no cuadra.",
        ],
        [
          "¿Tengo que clavar los macros?",
          "No. Llega a tu proteína y quédate cerca de tus calorías casi todos los días; el reparto entre grasa y carbohidratos importa mucho menos.",
        ],
      ],
      more: {
        heading: "Cómo se calcula",
        paragraphs: [
          "El TDEE sale de la ecuación de Mifflin-St Jeor por un factor de actividad, igual que en la calculadora de TDEE. Tu objetivo fija las calorías: 500 menos (nunca por debajo del metabolismo basal), lo mismo o 250 más. Primero se fija la proteína por kilo de peso, después la grasa, y los carbohidratos se quedan con el resto.",
        ],
      },
      reading: [
        { href: "/es/tools/tdee-calculator/", label: "la calculadora de TDEE" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "cuánta proteína para ganar músculo" },
        { href: "/blog/lean-bulk/", label: "el volumen limpio" },
      ],
    },
    ui: {
      units: "Unidades",
      metric: "Métrico",
      imperial: "Imperial",
      goal: "Objetivo",
      cut: "Perder grasa",
      maintain: "Mantener",
      bulk: "Ganar músculo",
      sex: "Sexo",
      female: "Mujer",
      male: "Hombre",
      age: "Edad",
      weightKg: "Peso (kg)",
      weightLb: "Peso (lb)",
      heightCm: "Altura (cm)",
      heightIn: "Altura (pulgadas)",
      activity: "Actividad",
      kcalDay: "calorías al día",
      protein: "Proteína",
      fat: "Grasa",
      carbs: "Carbohidratos",
      proteinCut: "{perKg} g por kg de peso: lo alto del rango, para conservar el músculo mientras pierdes grasa.",
      proteinMaintain: "{perKg} g por kg de peso: el centro del rango que necesita quien entrena.",
      proteinBulk: "{perKg} g por kg de peso: suficiente para ganar músculo, con las calorías extra en carbohidratos.",
      fatWhy: "Una cuarta parte de tus calorías, y nunca menos de 0,6 g por kg, por las hormonas.",
      carbsWhy: "El resto de tus calorías, para dar energía a las series duras.",
      kcalFloor: "Tu metabolismo basal de {bmr}: un recorte mayor quedaría por debajo, y eso cuesta músculo.",
      kcalCut: "500 por debajo de tu TDEE de {tdee}: unos {pace} menos a la semana.",
      kcalMaintain: "Tu TDEE: lo que quemas en un día normal.",
      kcalBulk: "250 por encima de tu TDEE de {tdee}: unos {pace} más a la semana, sobre todo músculo.",
      meals: "Reparte la proteína en {meals} comidas; se aprovecha mejor en raciones de 30 a 40 g.",
    },
  },
  "wilks-calculator": {
    page: {
      title: "Calculadora de Wilks, con puntos IPF GL y DOTS",
      description:
        "Puntúa tu total de sentadilla, press de banca y peso muerto según tu peso corporal con la fórmula de Wilks, los puntos IPF GL (clásico o equipado) y DOTS, en kg o lb.",
      name: "Calculadora de Wilks",
      intro:
        "Tu total de powerlifting puntuado según tu peso de tres maneras, Wilks, IPF GL y DOTS, para comparar levantadores de cualquier tamaño y ver cuánto falta para el siguiente nivel.",
      sticky: "Tu puntuación de fuerza, siempre al día",
      mid: {
        title: "Las tres puntuaciones, con cada serie que registras",
        body: "{app} estima tu mejor sentadilla, press de banca y peso muerto con tu entrenamiento y mantiene al día Wilks, IPF GL y DOTS, junto con el levantamiento que más se queda atrás.",
        button: "Empieza gratis",
      },
      end: {
        title: "Construye un total más grande",
        body: "{app} planifica cada entrenamiento con repeticiones en reserva, hace una descarga cuando se acumula la fatiga y sube cada levantamiento cuando te lo has ganado.",
      },
      faq: [
        [
          "¿Qué es la puntuación Wilks?",
          "Un número que compara totales de powerlifting entre pesos corporales. Tu total se multiplica por un coeficiente de una fórmula publicada por Robert Wilks, así que un levantador ligero y uno pesado pueden clasificarse juntos. Fue el estándar durante décadas y mucha gente aún la usa.",
        ],
        [
          "¿Qué son los puntos IPF GL?",
          "La fórmula propia de la Federación Internacional de Powerlifting desde 2020, a veces llamada puntos Goodlift. Tiene versiones distintas para clásico (sin equipo) y equipado, y para press de banca solo. Unos 100 puntos son un total de nivel mundial.",
        ],
        [
          "¿Qué puntuación debo usar?",
          "Si compites, la que use tu federación. Para seguir tu propio progreso, DOTS e IPF GL son las fórmulas más nuevas, ajustadas con resultados recientes de competición. Compara una puntuación solo con la misma fórmula.",
        ],
        [
          "¿Qué es una buena puntuación Wilks?",
          "A grandes rasgos, unos 300 son un total intermedio sólido, 400 avanzado y 450 o más élite en hombres; las puntuaciones de las mujeres van en la misma escala. Son guías aproximadas, no niveles oficiales.",
        ],
      ],
      more: {
        heading: "Cómo se calculan las puntuaciones",
        paragraphs: [
          "Wilks divide 500 entre un polinomio de quinto grado del peso corporal en kilos, con coeficientes distintos para hombres y mujeres, y multiplica tu total por el resultado. IPF GL divide 100 entre A − B·e^(−C·peso corporal), con los A, B y C que publica la IPF para cada sexo, equipo y prueba. DOTS usa un polinomio de cuarto grado. Las libras se pasan primero a kilos. Los coeficientes están comprobados con un proyecto abierto de resultados de powerlifting.",
        ],
      },
      reading: [
        { href: "/es/tools/dots-calculator/", label: "la calculadora de DOTS" },
        { href: "/es/tools/one-rep-max-calculator/", label: "la calculadora de 1RM" },
        { href: "/blog/how-to-increase-your-squat/", label: "cómo subir tu sentadilla" },
      ],
    },
    ui: {
      units: "Unidades",
      formula: "Fórmula",
      men: "Fórmula de hombres",
      women: "Fórmula de mujeres",
      gear: "Equipo",
      classic: "Clásico (sin equipo)",
      equipped: "Equipado",
      bw: "Peso corporal ({unit})",
      squat: "Sentadilla",
      bench: "Press de banca",
      deadlift: "Peso muerto",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      level: "Nivel DOTS: {level}.",
      next: "Suma unos {weight} {unit} a tu total para llegar a {level} (DOTS {score}).",
      elite: "Es un total de élite.",
      note: "Wilks y DOTS no cambian con el equipo. IPF GL tiene fórmulas distintas para clásico y equipado, así que elige la de tu modalidad.",
      levels: { beginner: "Principiante", novice: "Novato", intermediate: "Intermedio", advanced: "Avanzado", elite: "Élite" },
    },
  },
  "dots-calculator": {
    page: {
      title: "Calculadora de DOTS: puntúa tu total de powerlifting",
      description:
        "Calcula tu puntuación DOTS con tu sentadilla, press de banca, peso muerto y peso corporal, en kg o lb, para comparar levantadores de cualquier tamaño.",
      name: "Calculadora de DOTS",
      intro:
        "Tu total de sentadilla, banca y peso muerto puntuado según tu peso, para que un levantador ligero y uno pesado vean quién es más fuerte para su tamaño.",
      sticky: "Tu DOTS, siempre al día",
      mid: {
        title: "Tu DOTS, con cada serie",
        body: "{app} estima tu mejor sentadilla, banca y peso muerto con las series que registras y mantiene al día tu DOTS, sin día de máximos.",
        button: "Empieza gratis",
      },
      end: {
        title: "Construye un total más grande",
        body: "{app} planifica tu entrenamiento en bloques con objetivos de repeticiones en reserva y descargas, y sube cada levantamiento cuando te lo has ganado.",
      },
      faq: [
        [
          "¿Qué es la puntuación DOTS?",
          "Una forma de comparar totales de powerlifting entre pesos corporales. Tu total se multiplica por un coeficiente que depende de tu peso, así que alguien de 60 kg y alguien de 110 kg se pueden clasificar en la misma escala. Muchas federaciones la usan.",
        ],
        [
          "¿Qué es una buena puntuación DOTS?",
          "A grandes rasgos: 200 es un total de novato, 300 intermedio, 400 avanzado y 500 o más élite. Son los niveles que se suelen usar, no una escala oficial.",
        ],
        [
          "¿DOTS o Wilks?",
          "DOTS se publicó en 2019 como un sustituto más justo de la antigua fórmula de Wilks, con un conjunto mayor de resultados recientes de competición. Las puntuaciones no son intercambiables, así que compara DOTS con DOTS.",
        ],
        [
          "¿Puedo usar máximos estimados en vez de un total de competición?",
          "Para seguir tu propio progreso, sí. Las clasificaciones oficiales usan levantamientos hechos en competición, con las reglas de la federación.",
        ],
      ],
      more: {
        heading: "Cómo se calcula DOTS",
        paragraphs: [
          "DOTS divide 500 entre un polinomio de cuarto grado de tu peso corporal en kilos, con coeficientes distintos para hombres y mujeres, y multiplica tu total por el resultado. El peso corporal se limita a 40-210 kg en hombres y 40-150 kg en mujeres. Los coeficientes son los publicados, comprobados con un proyecto abierto de resultados de powerlifting. Las libras se pasan primero a kilos.",
        ],
      },
      reading: [
        { href: "/es/tools/one-rep-max-calculator/", label: "la calculadora de 1RM" },
        { href: "/blog/how-to-increase-your-squat/", label: "cómo subir tu sentadilla" },
        { href: "/blog/how-to-increase-your-deadlift/", label: "cómo subir tu peso muerto" },
      ],
    },
    ui: {
      unitsSex: "Unidades y sexo",
      men: "Fórmula de hombres",
      women: "Fórmula de mujeres",
      bw: "Peso corporal ({unit})",
      squat: "Sentadilla",
      bench: "Press de banca",
      deadlift: "Peso muerto",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      note: "Unos 200 son un total de novato, 300 intermedio, 400 avanzado y 500 o más élite. Son niveles aproximados, no una escala oficial.",
      levels: { beginner: "Principiante", novice: "Novato", intermediate: "Intermedio", advanced: "Avanzado", elite: "Élite" },
    },
  },
};
