import type { LocalTools } from "./types";

// Las calculadoras en español (tú). Mismas partes que las páginas inglesas (src/app/tools/).
export const ES_TOOLS: LocalTools = {
  frame: {
    tools: "Herramientas",
    questions: "Preguntas",
    more: "Más:",
    and: " y ",
    englishLinks: "Las guías y artículos enlazados están en inglés.",
  },
  "plate-calculator": {
    page: {
      title: "Calculadora de discos: qué discos poner a cada lado de la barra",
      description:
        "Escribe un peso y mira exactamente qué discos cargar a cada lado de la barra, en kg o lb, con los discos que tienes. Si no se puede hacer, te da el peso más cercano.",
      name: "Calculadora de discos",
      intro: "Qué discos van a cada lado de la barra para cualquier peso. Toca + y − para ajustarlo; desactiva los discos que no tengas.",
      sticky: "Discos dibujados en cada serie",
      mid: {
        title: "Deja de hacer cuentas de discos entre series",
        body: "{app} dibuja los discos de cada serie y te muestra qué cambiar para la siguiente mientras descansas.",
        button: "Pruébalo gratis",
      },
      end: {
        title: "Cada serie cargada por ti",
        body: "Dile a {app} una vez qué discos tiene tu gimnasio. Cada peso que planifica es uno que de verdad puedes cargar, con los discos de cada lado.",
      },
      faq: [
        [
          "¿Cómo calculo los discos por lado?",
          "Toma el peso que quieres, réstale la barra (20 kg o 45 lb en una barra olímpica estándar) y divide entre dos. Eso va en cada lado. Pon primero los discos más pesados.",
        ],
        [
          "¿Y si mis discos no llegan a ese peso?",
          "La calculadora encuentra los pesos más cercanos que puedes hacer, por encima y por debajo. Quédate con el más ligero: es el error más seguro.",
        ],
        [
          "¿Cuánto pesa la barra?",
          "Una barra olímpica estándar pesa 20 kg o 45 lb. Las barras de mujer, 15 kg o 35 lb. Las barras EZ, hexagonales y las máquinas Smith varían, así que revisa la tuya.",
        ],
        [
          "¿{app} lo hace por mí?",
          "Sí. {app} solo propone pesos que los discos de tu gimnasio pueden hacer, dibuja los discos de cada serie y te muestra qué cambiar entre series mientras descansas.",
        ],
      ],
      reading: [{ href: "/blog/how-to-load-a-barbell/", label: "cómo cargar una barra" }],
    },
    ui: {
      units: "Unidades",
      weight: "Peso en la barra ({unit})",
      weightAria: "peso",
      bar: "Barra",
      plates: "Discos que tienes",
      loadThis: "Carga esto",
      cantMake: "No se pueden hacer {want} con estos discos. Lo más cercano:",
      eachSide: "En cada lado: {plates}",
      justBar: "nada, solo la barra",
      closestOne: "Lo más cercano que puedes hacer: {below}. Quedarte corto es el error más seguro.",
      closestTwo: "Lo más cercano que puedes hacer: {below} o {above}. Quedarte corto es el error más seguro.",
    },
  },
  "one-rep-max-calculator": {
    page: {
      title: "Calculadora de 1RM: calcula tu repetición máxima con cualquier serie",
      description:
        "Calcula tu repetición máxima a partir del peso, las repeticiones y las repeticiones en reserva, con una tabla de peso por repeticiones y el resultado de Epley, Brzycki y seis fórmulas más.",
      name: "Calculadora de 1RM",
      intro:
        "Tu máximo estimado con cualquier serie, sin tener que probarlo. Toca + y − para meter una serie; mantén pulsado para ir más rápido.",
      sticky: "Tu máximo, seguido en cada serie",
      mid: {
        title: "Mira cómo sube tu máximo, serie a serie",
        body: "{app} actualiza tu estimación con cada serie que registras y te muestra la tendencia de cada ejercicio.",
        button: "Empieza gratis",
      },
      end: {
        title: "Gana fuerza sin adivinar",
        body: "{app} convierte tu máximo en el peso correcto para cada serie y lo sube cuando te lo has ganado.",
      },
      faq: [
        [
          "¿Cómo se estima la repetición máxima?",
          "Con el peso y las repeticiones que podrías haber hecho hasta el fallo (tus repeticiones más las que te quedaban). Hasta 10 repeticiones al fallo promedia Brzycki, Epley y una ecuación de 2026 que depende del peso; por encima de 10 usa Mayhew, Wathan y esa misma ecuación, que aguantan mejor con más repeticiones.",
        ],
        [
          "¿Por qué contar las repeticiones que me quedaban?",
          "Las fórmulas suponen que llegaste al fallo. Una serie de 5 con 2 en reserva es en realidad un esfuerzo de 7, así que si no lo cuentas la estimación sale baja.",
        ],
        [
          "¿Qué tan precisa es?",
          "Lo más precisa con series duras de 2 a 6 repeticiones, todavía útil hasta unas 10 y aproximada a partir de 15. Tómala como un rango y fíjate en la tendencia con el tiempo.",
        ],
        [
          "¿{app} lo sigue por mí?",
          "Sí. Cada serie que registras actualiza la estimación de ese ejercicio, dando más peso a las series recientes y más cercanas al fallo, y la muestra en una gráfica con el tiempo.",
        ],
      ],
      reading: [
        { href: "/blog/how-to-estimate-your-one-rep-max/", label: "cómo estimar tu repetición máxima" },
        { href: "/guides/reps-in-reserve/", label: "repeticiones en reserva" },
      ],
    },
    ui: {
      units: "Unidades",
      weight: "Peso levantado ({unit})",
      weightAria: "peso",
      reps: "Repeticiones",
      repsAria: "repeticiones",
      left: "Repeticiones que te quedaban",
      failure: "0 (fallo)",
      leftNote: "Contar las repeticiones que te quedaban hace la estimación mucho más precisa.",
      rough: "Por encima de 10 repeticiones al fallo las estimaciones son más aproximadas.",
      estimate: "Repetición máxima estimada",
      tableCaption: "Peso para cada número de repeticiones al fallo",
      colReps: "Reps",
      colWeight: "Peso",
      colPct: "% del máximo",
      formulas: "Qué dice cada fórmula",
      formulasNote: "La estimación de arriba promedia las fórmulas que encajan con {n} repeticiones al fallo (marcadas con ✓).",
    },
  },
  "warm-up-calculator": {
    page: {
      title: "Calculadora de calentamiento: series de aproximación para cualquier peso",
      description:
        "Escribe tu peso de trabajo y obtén las series de calentamiento para la sentadilla, el press de banca, el peso muerto, el press militar o el remo, con los discos de cada lado.",
      name: "Calculadora de calentamiento",
      intro:
        "Las series de calentamiento antes de tu peso de trabajo: suficientes para estar listo, no tantas que te cansen. Elige un ejercicio y escribe el peso.",
      sticky: "Calentamientos planificados para cada ejercicio",
      mid: {
        title: "No vuelvas a calcular un calentamiento",
        body: "{app} añade las series de calentamiento a cada entrenamiento, con los discos dibujados, y se las salta cuando el músculo ya está caliente.",
        button: "Planifica mi entrenamiento",
      },
      end: {
        title: "Llega, calienta, levanta",
        body: "{app} planifica los calentamientos, las series de trabajo y el descanso entre ellas, así que tú solo levantas.",
      },
      faq: [
        [
          "¿Cuántas series de calentamiento debo hacer?",
          "Después de la barra vacía: una serie más ligera si tu peso de trabajo es menor de unos 50 kg (110 lb), dos series de aproximación desde 50 kg y tres desde 100 kg (220 lb), la última una sola repetición a cerca del 85%.",
        ],
        [
          "¿Cuántas repeticiones en una serie de calentamiento?",
          "Menos a medida que sube el peso: unas 5 a la mitad de tu peso de trabajo, 2 o 3 entre el 70 y el 80% y una sola cerca del 85%. La idea es practicar el movimiento y acostumbrarte a la carga, no cansarte.",
        ],
        [
          "¿Cuánto descansar entre series de calentamiento?",
          "Unos {rest} segundos bastan para las ligeras. Descansa tu tiempo normal antes de la primera serie de trabajo.",
        ],
        [
          "¿Tengo que calentar en cada ejercicio?",
          "No. El primer ejercicio pesado de un músculo necesita una aproximación. Uno posterior para los mismos músculos necesita como mucho una serie de tanteo, y el trabajo accesorio ligero casi nunca necesita nada.",
        ],
      ],
      more: {
        heading: "Cómo se calcula el calentamiento",
        paragraphs: [
          "Empieza con la barra vacía, 10 repeticiones fáciles (salvo que tu peso de trabajo apenas supere la barra), y luego sube en unos pocos pasos hacia tu peso de trabajo. Cada paso es un peso que tus discos pueden hacer de verdad, más pesado que el anterior y más ligero que tu peso de trabajo. Cuanto más pesado el ejercicio, más pasos y menos repeticiones en cada uno, para que el calentamiento te prepare sin quitarle fuerza a tus series de trabajo.",
          "Es la misma progresión que usa la app {app}. En la app también sabe qué músculos ya están calientes de antes en el entrenamiento, así que un segundo ejercicio de empuje recibe una sola serie de tanteo en lugar de una aproximación completa.",
        ],
      },
      reading: [
        { href: "/blog/how-to-warm-up-for-lifting/", label: "cómo calentar para levantar" },
        { href: "/es/tools/plate-calculator/", label: "la calculadora de discos" },
        { href: "/blog/dynamic-vs-static-stretching/", label: "estiramiento dinámico o estático" },
      ],
    },
    ui: {
      units: "Unidades",
      lift: "Ejercicio",
      lifts: {
        "back-squat": "Sentadilla",
        "bench-press": "Press de banca",
        deadlift: "Peso muerto",
        "overhead-press": "Press militar",
        "barbell-row": "Remo con barra",
      },
      work: "Peso de trabajo ({unit})",
      workAria: "peso de trabajo",
      setsOne: "{n} serie de calentamiento, {rest} s de descanso después",
      setsMany: "{n} series de calentamiento, {rest} s de descanso después de cada una",
      none: "No hacen falta series de calentamiento con este peso",
      working: "{weight}: tus series de trabajo",
      eachSide: "En cada lado: {plates}",
      empty: "Barra vacía",
    },
  },
};
