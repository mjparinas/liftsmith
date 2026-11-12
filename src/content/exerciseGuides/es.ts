import type { ExerciseGuide } from "../exerciseGuides";

// Las guías de ejercicio en español (tú). Mismo orden y mismas partes que las guías en inglés (lower.ts, upper.ts).
export const ES_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "La sentadilla trasera es el gran ejercicio de fuerza para el tren inferior. Trabaja a fondo cuádriceps, glúteos y aductores, permite mover mucho peso y progresar durante años, y de paso fortalece el tronco.",
    mistakes: [
      [
        "Rodillas hacia dentro al subir",
        "Empuja las rodillas hacia fuera, sobre los pies, durante toda la repetición, y quita peso hasta que lo consigas.",
      ],
      [
        "Bajar menos a medida que sube el peso",
        "Baja a la misma profundidad en cada repetición, al menos con el pliegue de la cadera a la altura de la rodilla si tu cadera lo permite.",
      ],
      [
        "Perder la tensión abajo",
        "Toma una buena bocanada de aire hacia el abdomen antes de cada repetición y mantenla hasta pasar la parte más dura.",
      ],
      ["Talones que se levantan", "Mantén el peso en el centro del pie. Unas zapatillas con tacón o una postura algo más abierta ayudan."],
    ],
    sets: [
      "**Fuerza:** 3 a 5 series de 3 a 6, descansando de 3 a 5 minutos.",
      "**Músculo:** 3 a 4 series de 6 a 10, descansando de 2 a 3 minutos.",
      "**Si empiezas:** 3 series de 8 con un peso que podrías levantar 10 a 12 veces, sumando un poco en cada sesión.",
    ],
    variations: [
      ["front-squat", "Más erguida, más cuádriceps y menos carga en la zona lumbar."],
      ["box-squat", "Te enseña a sentarte atrás y a llegar a la misma profundidad cada vez."],
      ["pause-squat", "Da fuerza para salir del fondo, donde se atasca casi todo el mundo."],
      ["goblet-squat", "La mejor forma de aprender el movimiento antes de cargar una barra."],
    ],
    faq: [
      [
        "¿Cuánto debo bajar?",
        "Todo lo que puedas manteniendo la posición de la espalda y los talones en el suelo. Para la mayoría, en paralelo o un poco por debajo.",
      ],
      [
        "¿Barra alta o barra baja?",
        "La barra alta va sobre los hombros y te deja más erguido; la baja va más abajo y permite levantar algo más. Las dos funcionan.",
      ],
      [
        "¿Necesito cinturón?",
        "Para empezar, no. Aprende primero a fijar el tronco sin él; más adelante puede ayudarte en las series pesadas. Mira [lifting belt](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "La sentadilla frontal lleva la barra delante de los hombros, lo que mantiene el torso erguido y carga más los cuádriceps. Es más amable con la zona lumbar que la sentadilla trasera y enseña muy bien una buena postura.",
    mistakes: [
      ["Codos que caen", "Lleva los codos arriba y adelante toda la repetición. Si la barra rueda, es que los codos bajaron primero."],
      [
        "Sujetar la barra con las manos",
        "La barra descansa en los hombros; los dedos solo la mantienen en su sitio. Usa agarre cruzado o correas si tienes las muñecas rígidas.",
      ],
      [
        "Redondear la parte alta de la espalda",
        "Pecho arriba y abdomen firme. Mejor menos peso con el pecho alto que más peso doblándote.",
      ],
    ],
    sets: ["**Fuerza:** 3 a 5 series de 3 a 5.", "**Músculo:** 3 series de 6 a 10."],
    variations: [
      ["goblet-squat", "La misma postura erguida con una mancuerna, más fácil de aprender."],
      ["back-squat", "Permite levantar más peso en total."],
      ["db-front-squat", "Sin rack y sin estirar las muñecas."],
    ],
    faq: [
      [
        "¿Es mejor la sentadilla frontal que la trasera?",
        "Ninguna es mejor. La frontal carga más los cuádriceps y cuida la espalda; la trasera permite levantar más.",
      ],
      ["¿Por qué me duelen las muñecas?", "Muñecas y dorsales rígidos. Deja solo dos o tres dedos bajo la barra, o usa agarre cruzado."],
    ],
  },
  "goblet-squat": {
    intro:
      "La sentadilla goblet sostiene una mancuerna o una pesa rusa contra el pecho. El peso delante facilita mantenerte erguido y bajar mucho, así que es la mejor forma de aprender a hacer sentadillas y un gran ejercicio de piernas en casa.",
    mistakes: [
      ["Dejar que el peso te tire hacia delante", "Pega el peso al pecho y mantén los codos recogidos debajo."],
      ["Bajar poco", "Siéntate entre los talones e intenta que los codos rocen las rodillas abajo."],
      ["Ir con prisa", "Baja en dos o tres segundos. Así un peso ligero se vuelve mucho más duro."],
    ],
    sets: ["**Músculo:** 3 series de 8 a 15.", "**En casa con poco peso:** 3 series de 15 a 20, bajando despacio."],
    variations: [
      ["kb-goblet-squat", "El mismo movimiento con una pesa rusa cogida por el asa."],
      ["db-goblet-squat-heels", "Talones elevados para más cuádriceps y más profundidad."],
      ["back-squat", "El siguiente paso cuando las mancuernas se te queden cortas."],
    ],
    faq: [
      [
        "¿Sirve la sentadilla goblet para ganar pierna?",
        "Sí, hasta que tu mancuerna más pesada se vuelva fácil. Entonces baja más despacio, haz una pausa abajo o pasa a la sentadilla con barra.",
      ],
      ["¿Mancuerna o pesa rusa?", "Cualquiera. Sujeta la mancuerna en vertical por un extremo, o la pesa rusa por el asa."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "La sentadilla búlgara apoya el pie trasero en un banco para que la pierna de delante haga casi todo el trabajo. Construye cuádriceps y glúteos pierna a pierna con una fracción de la carga de una sentadilla trasera, por lo que cuida la zona lumbar.",
    mistakes: [
      [
        "Pie delantero demasiado cerca del banco",
        "Adelántalo lo suficiente para que la tibia quede casi vertical y la rodilla se doble libremente abajo.",
      ],
      [
        "Empujar con el pie trasero",
        "El pie de atrás solo da equilibrio. Lleva casi todo el peso sobre el talón y el centro del pie de delante.",
      ],
      ["Perder el equilibrio", "Agárrate a algo con una mano, o usa un banco más bajo, hasta sentirte estable."],
    ],
    sets: [
      "**Músculo:** 3 series de 8 a 12 por pierna, empezando por el lado más débil.",
      "**En casa:** 3 series de 12 a 20 por pierna con tu peso o mancuernas ligeras.",
    ],
    variations: [
      ["split-squat", "Los dos pies en el suelo: más fácil de equilibrar."],
      ["front-foot-elevated-split-squat", "Un estiramiento más profundo para la pierna delantera."],
      ["barbell-bulgarian-split-squat", "Más carga cuando las mancuernas se vuelven incómodas de sujetar."],
    ],
    faq: [
      [
        "¿Cuádriceps o glúteos?",
        "Los dos. Con el torso más erguido y el paso más corto trabajas más cuádriceps; inclinándote hacia delante con un paso más largo, más glúteos.",
      ],
      [
        "¿Por qué cuesta tanto?",
        "Una pierna hace el trabajo de dos, y además hay que mantener el equilibrio. Empieza ligero; verás qué rápido sube el peso.",
      ],
    ],
  },
  "leg-press": {
    intro:
      "La prensa de piernas trabaja cuádriceps y glúteos sin cargar la columna ni exigir equilibrio, así que puedes apretar las piernas a fondo y con seguridad, incluso cuando la espalda o la técnica limitarían una sentadilla.",
    mistakes: [
      ["La zona lumbar se despega del respaldo", "Baja solo hasta donde puedas mantener la cadera y la zona lumbar en el asiento."],
      ["Bloquear las rodillas con fuerza arriba", "Para justo antes de bloquear y encadena la siguiente repetición."],
      [
        "Recortar el recorrido para cargar más",
        "Un recorrido completo y controlado con menos peso construye más músculo que medias repeticiones con toda la pila.",
      ],
    ],
    sets: ["**Músculo:** 3 a 4 series de 8 a 15.", "**Para terminar:** 1 a 2 series de 15 a 25 después de las sentadillas."],
    variations: [
      ["narrow-leg-press", "Pies más abajo y más juntos: más cuádriceps."],
      ["wide-leg-press", "Pies más arriba y más abiertos: más glúteos y aductores."],
      ["single-leg-press", "Una pierna cada vez para igualar diferencias."],
    ],
    faq: [
      [
        "¿Es la prensa tan buena como la sentadilla?",
        "Para ganar músculo en las piernas, se acerca mucho. La sentadilla entrena también el equilibrio y el tronco; la prensa te deja apretar más las piernas con menos fatiga.",
      ],
      [
        "¿Dónde pongo los pies?",
        "En el centro de la plataforma y al ancho de hombros es un buen punto de partida. Súbelos para glúteos, bájalos para cuádriceps.",
      ],
    ],
  },
  "hack-squat": {
    intro:
      "La máquina de sentadilla hack te guía en una sentadilla sobre un carro, con la espalda apoyada. Es de lo mejor para los cuádriceps porque puedes bajar mucho y apretar sin tener que equilibrar una barra.",
    mistakes: [
      ["Pies demasiado altos en la plataforma", "Ponlos en el centro o un poco más abajo para más cuádriceps, con los talones apoyados."],
      ["Rebotar abajo", "Controla la bajada y haz una breve pausa antes de subir."],
      ["Repeticiones parciales", "Baja todo lo que permita tu cadera sin que la zona lumbar se despegue del respaldo."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 6 a 12.", "**Fuerza:** 3 series de 5 a 8, después de tu sentadilla principal."],
    variations: [
      ["pendulum-squat", "Una máquina parecida con un arco más profundo."],
      ["leg-press", "Sin ninguna carga en los hombros."],
      ["back-squat", "Peso libre: entrena el equilibrio y el tronco."],
    ],
    faq: [
      [
        "¿Es mala la sentadilla hack para las rodillas?",
        "No. Que las rodillas pasen por delante de los pies es normal. Sube el peso poco a poco y sin dolor.",
      ],
      [
        "¿Hack o prensa?",
        "La hack suele cargar un poco más los cuádriceps; la prensa es más cómoda para hombros y espalda. Las dos son buenas.",
      ],
    ],
  },
  deadlift: {
    intro:
      "El peso muerto levanta una barra cargada desde el suelo. Trabaja toda la parte trasera del cuerpo, glúteos, isquiotibiales, espalda y agarre, y suele ser el ejercicio en el que más peso se mueve.",
    mistakes: [
      [
        "La barra se aleja de las piernas",
        "Mantén la barra rozando tibias y muslos durante toda la subida. Empieza con ella sobre el centro del pie.",
      ],
      ["Redondear la zona lumbar", "Fija bien el tronco antes de tirar, y baja el peso si la espalda no aguanta la posición."],
      [
        "Arrancar la barra de golpe",
        "Quita primero la holgura: tensa hasta que la barra haga clic contra los discos y luego empuja el suelo.",
      ],
      ["Echarse muy atrás arriba", "Termina de pie, erguido y con los glúteos apretados. No hace falta inclinarse hacia atrás."],
    ],
    sets: [
      "**Fuerza:** 2 a 4 series de 2 a 5, descansando de 3 a 5 minutos.",
      "**Músculo:** 3 series de 5 a 8. El peso muerto cansa mucho, así que casi todo el mundo lo hace una vez por semana.",
    ],
    variations: [
      ["trap-bar-deadlift", "Más fácil de aprender, más erguido y más amable con la espalda."],
      ["sumo-deadlift", "Una postura abierta que encaja mejor con algunos cuerpos."],
      ["romanian-deadlift", "Empieza arriba y carga más los isquiotibiales."],
      ["paused-deadlift", "Da control justo al despegar del suelo."],
    ],
    faq: [
      [
        "¿Con qué frecuencia hago peso muerto?",
        "Una vez por semana basta para la mayoría, con una bisagra más ligera como el peso muerto rumano otro día.",
      ],
      [
        "¿Puedo soltar la barra arriba?",
        "Bájala con control. Soltarla desde arriba castiga los discos y el suelo, y te saltas media repetición.",
      ],
      [
        "¿Uso correas?",
        "En tus series más pesadas, si el agarre falla antes. Entrena el agarre en las series de calentamiento. Mira [grip strength](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "El peso muerto sumo usa una postura muy abierta con las manos por dentro de las rodillas. Acorta el recorrido de la barra y te deja ir más erguido, cargando más cadera, cuádriceps y aductores.",
    mistakes: [
      ["Postura demasiado abierta", "Ábrete solo hasta donde las tibias queden casi verticales y las rodillas sigan la línea de los pies."],
      ["La cadera sube primero", "Empuja las rodillas hacia fuera y separa el suelo, para que cadera y pecho suban a la vez."],
      ["Empezar con los brazos flojos", "Quita la holgura de la barra antes de que despegue del suelo."],
    ],
    sets: ["**Fuerza:** 3 a 5 series de 2 a 5.", "**Músculo:** 3 series de 5 a 8."],
    variations: [
      ["deadlift", "La postura convencional: más isquiotibiales y espalda."],
      ["kb-sumo-deadlift", "Una forma ligera de aprender la postura."],
      ["trap-bar-deadlift", "Erguido como el sumo, más sencillo de preparar."],
    ],
    faq: [
      [
        "¿El sumo es hacer trampa?",
        "No. Es un estilo reconocido en powerlifting. Elige la postura que encaje con tu cuerpo y te deje levantar bien.",
      ],
      ["¿Sumo o convencional?", "Prueba los dos unas semanas. Quienes tienen piernas largas y brazos cortos suelen preferir el sumo."],
    ],
  },
  "romanian-deadlift": {
    intro:
      "El peso muerto rumano empieza de pie y baja la barra llevando la cadera atrás con las piernas casi rectas. Es de lo mejor para isquiotibiales y glúteos porque los carga en un estiramiento largo.",
    mistakes: [
      [
        "Doblar demasiado las rodillas",
        "Mantén una ligera flexión que no cambie. Si las rodillas se doblan más al bajar, se convierte en una sentadilla.",
      ],
      ["Bajar demasiado", "Baja solo mientras la cadera siga yendo atrás y la espalda se mantenga recta, normalmente hasta media tibia."],
      ["Barra separada de las piernas", "Deslízala por los muslos. Cuanto más cerca, menos sufre la zona lumbar."],
    ],
    sets: ["**Músculo:** 3 series de 6 a 12, bajando despacio.", "**Después del peso muerto:** 2 a 3 series de 8 a 10, más ligero."],
    variations: [
      ["db-rdl", "Con mancuernas, genial en casa."],
      ["single-leg-rdl", "A una pierna: equilibrio y menos peso necesario."],
      ["stiff-leg-deadlift", "Empieza desde el suelo en cada repetición."],
    ],
    faq: [
      [
        "¿Peso muerto rumano o peso muerto?",
        "El rumano empieza arriba y carga más los isquiotibiales; el peso muerto empieza en el suelo y permite levantar más.",
      ],
      [
        "¿Dónde debo notarlo?",
        "En la parte trasera de los muslos y en los glúteos. Si lo notas sobre todo en la zona lumbar, quita peso y lleva la cadera más atrás.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "El peso muerto con barra hexagonal te coloca dentro de la barra con las asas a los lados. Puedes ir más erguido, lo que quita carga a la zona lumbar y lo convierte en el peso muerto más fácil de aprender y de cargar mucho.",
    mistakes: [
      ["Convertirlo en sentadilla", "Sigue siendo una bisagra. Lleva la cadera atrás para llegar a las asas y luego empuja el suelo."],
      ["Descentrado dentro de la barra", "Colócate de forma que las asas queden alineadas con el centro del pie."],
      ["Perder tensión abajo", "Recoloca entre repeticiones o toca y sube suave; no rebotes los discos."],
    ],
    sets: ["**Fuerza:** 3 a 5 series de 3 a 5.", "**Músculo o deporte:** 3 series de 5 a 8."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Asas altas: menos recorrido para principiantes o personas altas."],
      ["deadlift", "La barra recta: más espalda e isquiotibiales."],
      ["trap-bar-rdl", "Una versión centrada en los isquiotibiales."],
    ],
    faq: [
      ["¿Es más fácil con barra hexagonal?", "A la mayoría le resulta más fácil de aprender y levanta algo más, porque va más erguida."],
      ["¿Trabaja los mismos músculos?", "Casi. Usa un poco más de cuádriceps y un poco menos de zona lumbar que con barra recta."],
    ],
  },
  "hip-thrust": {
    intro:
      "El hip thrust apoya la parte alta de la espalda en un banco y sube una barra cargada con la cadera. Carga los glúteos en la extensión completa de cadera más que casi cualquier otro ejercicio.",
    mistakes: [
      ["Arquear la zona lumbar arriba", "Mete la barbilla y baja las costillas; termina apretando los glúteos, no arqueándote."],
      [
        "Pies mal colocados",
        "Arriba, las tibias deben quedar casi verticales. Muy cerca, mandan los cuádriceps; muy lejos, los isquiotibiales.",
      ],
      ["Pasar rápido por arriba", "Aguanta un segundo arriba en cada repetición."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 8 a 12.", "**Fuerza:** 3 series de 5 a 8 con una pausa arriba."],
    variations: [
      ["glute-bridge", "Desde el suelo: más fácil de preparar, menos recorrido."],
      ["db-hip-thrust", "Una mancuerna sobre la cadera, bueno en casa."],
      ["single-leg-hip-thrust", "A una pierna, sin carga."],
    ],
    faq: [
      ["¿Necesito una almohadilla?", "Una almohadilla para la barra o una esterilla doblada hacen mucho más cómodas las series pesadas."],
      [
        "¿Hip thrust o sentadilla para glúteos?",
        "Los dos. La sentadilla trabaja los glúteos en un estiramiento profundo; el hip thrust los trabaja más arriba. Mira [glute workout](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "El puente de glúteos levanta la cadera del suelo con la espalda apoyada. Es un ejercicio sencillo que puedes hacer en cualquier sitio, y una buena forma de aprender a usar los glúteos antes del hip thrust.",
    mistakes: [
      ["Empujar con las puntas", "Empuja con los talones para que trabajen los glúteos."],
      ["Arquear la espalda para subir más", "Para cuando cadera y muslos formen una línea recta. Aprieta los glúteos ahí."],
      ["Ir a toda prisa", "Haz una pausa de uno o dos segundos arriba."],
    ],
    sets: [
      "**En casa:** 3 series de 15 a 25, con una pausa arriba.",
      "**Con carga:** 3 series de 10 a 15 con una mancuerna o una barra sobre la cadera.",
    ],
    variations: [
      ["single-leg-glute-bridge", "El doble de trabajo para cada lado."],
      ["hip-thrust", "Espalda en un banco para más recorrido y más carga."],
      ["marching-glute-bridge", "Suma estabilidad de tronco y cadera."],
    ],
    faq: [
      ["¿Puente o hip thrust?", "El puente es más fácil y no necesita nada; el hip thrust tiene más recorrido y admite más peso."],
      ["¿Por qué lo noto en los isquiotibiales?", "Acerca un poco los pies a la cadera y empuja con los talones."],
    ],
  },
  "walking-lunge": {
    intro:
      "Las zancadas caminando dan un paso adelante hacia una zancada, una y otra vez. Trabajan cuádriceps y glúteos pierna a pierna, ponen a prueba el equilibrio y suben las pulsaciones.",
    mistakes: [
      ["Pasos demasiado cortos", "Da un paso lo bastante largo para que ambas rodillas se doblen unos 90 grados abajo."],
      ["Rodilla delantera hacia dentro", "Mantén la rodilla de delante alineada con los dedos del pie."],
      ["Golpear el suelo con la rodilla de atrás", "Baja con control hasta que la rodilla trasera casi toque el suelo."],
    ],
    sets: [
      "**Músculo:** 3 series de 10 a 12 pasos por pierna.",
      "**Acondicionamiento:** 2 a 3 series de 20 a 30 pasos en total, con descansos cortos.",
    ],
    variations: [
      ["reverse-lunge", "Dar el paso atrás es más amable con las rodillas y el equilibrio."],
      ["barbell-walking-lunge", "Más carga cuando las mancuernas pesan demasiado en las manos."],
      ["bulgarian-split-squat", "Sin desplazarte y aislando más cada pierna."],
    ],
    faq: [
      [
        "¿Zancadas caminando o hacia atrás?",
        "Hacia atrás son más fáciles de controlar y cuidan las rodillas; caminando suman equilibrio y acondicionamiento.",
      ],
      ["¿Cuánto espacio necesito?", "Unos 10 metros por serie. Si no tienes sitio, da la vuelta o pasa a zancadas hacia atrás."],
    ],
  },
  "reverse-lunge": {
    intro:
      "La zancada hacia atrás da un paso atrás hasta la zancada. Al ir hacia atrás el peso se queda sobre el pie delantero, así que es más fácil de equilibrar y más amable con las rodillas que la zancada hacia delante.",
    mistakes: [
      ["Paso demasiado estrecho", "Da el paso como sobre raíles de tren, no sobre una cuerda floja, para mantener el equilibrio."],
      ["Empujar con el pie trasero", "Sube empujando con el talón de delante; la pierna de atrás solo ayuda a equilibrar."],
      ["Inclinarse mucho hacia delante", "Mantente bastante erguido, con una ligera inclinación si quieres más glúteos."],
    ],
    sets: ["**Con tu peso:** 3 series de 12 a 20 por pierna.", "**Con carga:** 3 series de 8 a 12 por pierna con mancuernas."],
    variations: [
      ["db-reverse-lunge", "Con mancuernas para más carga."],
      ["deficit-reverse-lunge", "Pie delantero en un escalón para más recorrido."],
      ["walking-lunge", "Suma equilibrio y acondicionamiento."],
    ],
    faq: [
      [
        "¿Son buenas las zancadas hacia atrás si me molestan las rodillas?",
        "Suelen ser la zancada más cómoda para rodillas sensibles. Quédate en un recorrido sin dolor.",
      ],
      ["¿Alterno piernas o hago un lado entero?", "Cualquiera. Un lado entero es más duro y mantiene las repeticiones iguales."],
    ],
  },
  "leg-extension": {
    intro:
      "La máquina de extensión de piernas estira la rodilla contra una resistencia. Aísla los cuádriceps, incluida la parte que las sentadillas apenas trabajan, y es fácil acercarla al fallo con seguridad.",
    mistakes: [
      [
        "Rodilla desalineada con el eje",
        "Ajusta el asiento para que la articulación de la rodilla quede alineada con el eje de la máquina.",
      ],
      ["Subir el peso a tirones", "Levanta con control y haz una breve pausa arriba."],
      ["Despegar la cadera del asiento", "Agarra las asas y mantén la cadera abajo."],
    ],
    sets: [
      "**Músculo:** 2 a 3 series de 10 a 15, después de sentadillas o prensas.",
      "**Para terminar:** 1 serie de 15 a 20 cerca del fallo.",
    ],
    variations: [
      ["single-leg-extension", "Una pierna cada vez para igualar diferencias."],
      ["sissy-squat", "Aislamiento de cuádriceps con tu propio peso."],
      ["leg-press", "Un ejercicio compuesto para cuádriceps."],
    ],
    faq: [
      [
        "¿Son malas las extensiones para las rodillas?",
        "No con un peso sensato. Se usan a menudo en rehabilitación de rodilla. Para si notas dolor en la articulación.",
      ],
      [
        "¿Necesito extensiones si hago sentadillas?",
        "No es imprescindible, pero suman trabajo de cuádriceps con poca fatiga y entrenan el recto femoral, que la sentadilla apenas estira.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "El curl femoral tumbado dobla las rodillas contra un rodillo mientras estás boca abajo. Aísla los isquiotibiales, que las bisagras como el peso muerto trabajan sobre todo desde la cadera.",
    mistakes: [
      ["Cadera que se levanta del banco", "Aprieta la cadera contra el banco y mantenla ahí."],
      ["Usar impulso", "Sube de forma fluida y baja despacio, en dos o tres segundos."],
      ["Recorrido corto", "Baja hasta que las piernas estén casi rectas antes de la siguiente repetición."],
    ],
    sets: ["**Músculo:** 3 series de 8 a 15."],
    variations: [
      ["seated-leg-curl", "Con la cadera doblada, los isquiotibiales trabajan desde un estiramiento mayor."],
      ["nordic-curl", "Con tu peso y muy duro; ideal para velocistas."],
      ["slider-leg-curl", "En casa con una toalla o deslizadores."],
    ],
    faq: [
      [
        "¿Curl tumbado o sentado?",
        "El sentado estira más los isquiotibiales y puede construir algo más de músculo. Usa el que tenga tu gimnasio.",
      ],
      [
        "¿Necesito curl femoral si hago peso muerto?",
        "Trabaja la función de doblar la rodilla de los isquiotibiales, que el peso muerto no entrena. Un ejercicio de curl a la semana ayuda.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "El curl femoral sentado dobla las rodillas contra un rodillo mientras estás sentado. Al estar sentado, los isquiotibiales quedan en un estiramiento largo, lo que lo convierte en uno de los mejores ejercicios para ganar músculo en ellos.",
    mistakes: [
      ["Rodillo de muslos flojo", "Ajusta firme el rodillo de los muslos para que las piernas no se levanten."],
      ["Echarse atrás para hacer trampa", "Siéntate erguido o inclínate un poco hacia delante para mantener el estiramiento."],
      ["Bajar con prisa", "Controla la bajada durante dos o tres segundos."],
    ],
    sets: ["**Músculo:** 3 series de 8 a 15."],
    variations: [
      ["lying-leg-curl", "Con la cadera estirada, si la máquina sentada está ocupada."],
      ["single-leg-curl", "Una pierna cada vez."],
      ["romanian-deadlift", "Trabaja los isquiotibiales desde la cadera en vez de la rodilla."],
    ],
    faq: [
      [
        "¿Es mejor el curl sentado que el tumbado?",
        "Trabaja los isquiotibiales desde un estiramiento mayor, lo que puede dar algo más de músculo. Los dos son buenos.",
      ],
      [
        "¿Cuánto peso en el curl femoral?",
        "El suficiente para que las dos últimas repeticiones de cada serie cuesten, sin perder el control al bajar.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "La elevación de gemelos de pie sube de puntillas contra una resistencia, con las rodillas estiradas. Es la que mejor trabaja el gemelo más grande, el gastrocnemio.",
    mistakes: [
      ["Rebotar abajo", "Haz una pausa de un segundo en el estiramiento al final de cada repetición."],
      ["Medias repeticiones", "Ve de un estiramiento profundo a lo más alto de las puntas que puedas."],
      ["Doblar las rodillas", "Mantén las rodillas estiradas pero sin bloquear, para que suban los gemelos."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 8 a 15, despacio, dos o tres veces por semana."],
    variations: [
      ["seated-calf-raise", "Rodillas dobladas, para el sóleo de debajo."],
      ["single-leg-calf-raise", "En casa en un escalón, una pierna cada vez."],
      ["calf-press", "En la máquina de prensa."],
    ],
    faq: [
      [
        "¿Por qué no me crecen los gemelos?",
        "Casi todo el mundo rebota con repeticiones cortas. Usa todo el recorrido con pausa en el estiramiento y entrénalos más a menudo. Mira [calf workout](/blog/calf-workout/).",
      ],
      ["¿De pie o sentado?", "Los dos. De pie trabaja más el gastrocnemio; sentado, el sóleo."],
    ],
  },
  plank: {
    intro:
      "La plancha mantiene el cuerpo en línea recta sobre antebrazos y puntas de los pies. Entrena abdomen y tronco para no doblarse, algo que se nota al fijar el tronco bajo una barra pesada.",
    mistakes: [
      ["Cadera hundida", "Aprieta los glúteos y acerca las costillas a la cadera."],
      ["Cadera muy alta", "Bájala hasta que el cuerpo forme una línea recta de la cabeza a los talones."],
      ["Aguantar varios minutos", "Cuando aguantes 60 segundos, hazla más difícil en lugar de más larga."],
    ],
    sets: ["**Tronco:** 2 a 3 series de 20 a 60 segundos, dos o tres veces por semana."],
    variations: [
      ["side-plank", "Trabaja los oblicuos y los laterales de la cadera."],
      ["long-lever-plank", "Codos más adelantados: mucho más dura."],
      ["ab-wheel", "Una versión en movimiento cuando la plancha sea fácil."],
    ],
    faq: [
      [
        "¿Cuánto tiempo aguanto la plancha?",
        "De 20 a 60 segundos con una técnica perfecta. A partir de ahí, rinde más una versión más difícil.",
      ],
      [
        "¿La plancha quema grasa abdominal?",
        "Ningún ejercicio quema grasa de una zona concreta. Mira [how to lose belly fat](/blog/how-to-lose-belly-fat/).",
      ],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "La elevación de piernas colgado se cuelga de una barra y sube las piernas. Es de los ejercicios de abdomen más duros: trabaja el abdomen inferior y los flexores de cadera, y también el agarre.",
    mistakes: [
      ["Balancearse", "Empieza desde quieto y baja despacio. Haz una pausa abajo si empiezas a balancearte."],
      ["Solo subir las piernas", "Enrolla la pelvis hacia arriba al final para que trabaje el abdomen, no solo los flexores de cadera."],
      ["Que falle antes el agarre", "Usa correas para abdominales o entrena el agarre aparte."],
    ],
    sets: ["**Tronco:** 3 series de 6 a 15."],
    variations: [
      ["hanging-knee-raise", "Rodillas dobladas: el primer paso, más fácil."],
      ["parallel-bar-knee-raise", "En paralelas, sin necesidad de agarre."],
      ["lying-leg-raise", "En el suelo, más fácil todavía."],
    ],
    faq: [
      ["¿Cómo dejo de balancearme?", "Baja despacio, haz una pausa abajo y mantén los hombros activos."],
      ["¿Demasiado difícil?", "Empieza con elevaciones de rodillas colgado y pasa a piernas rectas cuando hagas 3 series de 12."],
    ],
  },
  "ab-wheel": {
    intro:
      "La rueda abdominal rueda hacia delante y vuelve. Es de los ejercicios de abdomen más exigentes: lo entrena para evitar que la espalda se arquee mientras los brazos se estiran por encima de la cabeza.",
    mistakes: [
      ["Zona lumbar hundida", "Rueda solo hasta donde puedas evitar que la espalda se arquee. Mete la pelvis y aprieta los glúteos."],
      ["Volver tirando de la cadera", "Vuelve con abdomen y brazos a la vez, no sacando la cadera hacia arriba."],
      ["Ir demasiado lejos demasiado pronto", "Rueda primero hasta una pared o una distancia corta, y alarga un poco cada semana."],
    ],
    sets: ["**Tronco:** 3 series de 5 a 12 de rodillas, y de pie cuando tengas fuerza."],
    variations: [
      ["plank", "La versión estática para llegar a ella."],
      ["plank-reach", "Una forma más suave de entrenar lo mismo."],
      ["dead-bug", "Boca arriba, para aprender a mantener la zona lumbar pegada."],
    ],
    faq: [
      [
        "¿Es mala la rueda para la espalda?",
        "No si te quedas en el recorrido en que la espalda no se arquea. Acorta si lo notas en la zona lumbar.",
      ],
      ["¿De rodillas o de pie?", "De rodillas para la mayoría. De pie es un objetivo avanzado."],
    ],
  },
  "kb-swing": {
    intro:
      "El swing con pesa rusa lanza la cadera hacia delante para balancear la pesa hasta la altura del pecho. Trabaja glúteos e isquiotibiales de forma explosiva y sirve también como acondicionamiento.",
    mistakes: [
      ["Hacer una sentadilla", "Es una bisagra: lleva la cadera atrás, con solo un poco de flexión de rodillas."],
      ["Subir con los brazos", "La cadera manda la pesa arriba; los brazos solo la sujetan."],
      ["Echarse atrás arriba", "Termina erguido con glúteos y abdomen firmes, como en una plancha."],
    ],
    sets: [
      "**Potencia:** 5 a 10 series de 10, descansando lo necesario.",
      "**Acondicionamiento:** 10 a 20 swings cada minuto durante 10 minutos.",
    ],
    variations: [
      ["kb-single-swing", "A una mano: suma un giro que el tronco debe resistir."],
      ["db-swing", "Con una mancuerna si no tienes pesa rusa."],
      ["kb-deadlift", "Aprende la bisagra antes de hacer swings."],
    ],
    faq: [
      [
        "¿Cuánto debe pesar mi pesa rusa?",
        "Lo bastante para que el swing sea rápido, no lento. Muchas mujeres empiezan con 12 kg y muchos hombres con 16 a 20 kg.",
      ],
      ["¿Hasta dónde subo?", "Hasta la altura del pecho, más o menos. Más arriba no aporta mucho."],
    ],
  },
  "farmers-carry": {
    intro:
      "El paseo del granjero levanta dos pesos pesados y camina. Trabaja agarre, trapecios, tronco y postura a la vez, y se traslada directamente a la vida diaria.",
    mistakes: [
      ["Inclinarse o girarse", "Camina erguido, con los hombros atrás y abajo, a pasos cortos y rápidos."],
      ["Pesos demasiado ligeros", "Debe costar terminar la distancia. El agarre tiene que ser el límite."],
      ["Levantarlos con la espalda redonda", "Súbelos como en un peso muerto y déjalos igual."],
    ],
    sets: ["**Fuerza:** 3 a 5 recorridos de 20 a 40 metros, descansando de 1 a 2 minutos."],
    variations: [
      ["db-suitcase-carry", "Solo un lado: trabaja los oblicuos."],
      ["trap-bar-carry", "Más carga en una sola barra."],
      ["kb-rack-carry", "Pesas a la altura de los hombros, para la parte alta de la espalda."],
    ],
    faq: [
      ["¿Cuánto peso en el paseo del granjero?", "Empieza con alrededor de un cuarto de tu peso corporal en cada mano y ve subiendo."],
      ["¿Cuánto camino?", "De 20 a 40 metros por recorrido, o de 30 a 60 segundos."],
    ],
  },
  "good-morning": {
    intro:
      "El buenos días sujeta una barra en la espalda y se inclina hacia delante desde la cadera. Fortalece isquiotibiales, glúteos y zona lumbar, y enseña una bisagra de cadera sólida.",
    mistakes: [
      ["Cargar demasiado", "Empieza ligero. Este ejercicio castiga la zona lumbar si se rompe la técnica."],
      ["Redondear la espalda", "Espalda recta y pecho fuera; baja solo hasta donde puedas mantenerlo."],
      ["Doblar demasiado las rodillas", "Mantén una ligera flexión y lleva la cadera recta hacia atrás."],
    ],
    sets: ["**Músculo:** 3 series de 8 a 12, ligero."],
    variations: [
      ["romanian-deadlift", "La misma bisagra con el peso en las manos."],
      ["band-good-morning", "Ligero y bueno para aprender."],
      ["seated-good-morning", "Sentado: sobre todo zona lumbar."],
    ],
    faq: [
      ["¿Es peligroso el buenos días?", "No con pesos sensatos y buena técnica. Empieza ligero y sube poco a poco."],
      ["¿Cuánto bajo?", "Hasta que el torso quede casi paralelo al suelo, o menos si la espalda empieza a redondearse."],
    ],
  },
  "step-up": {
    intro:
      "La subida al cajón te lleva arriba de un cajón o un banco con una pierna. Construye cuádriceps y glúteos lado a lado y se traslada directamente a escaleras, montaña y deporte.",
    mistakes: [
      ["Empujar con el pie de atrás", "Deja el pie trasero ligero; que te suba la pierna de delante."],
      ["Cajón demasiado alto", "Empieza con un cajón a la altura de la rodilla o algo más bajo."],
      ["Dejarse caer", "Baja despacio. La bajada también entrena la pierna."],
    ],
    sets: ["**Músculo:** 3 series de 8 a 12 por pierna.", "**Con tu peso:** 3 series de 15 a 20 por pierna."],
    variations: [
      ["db-step-up", "Con mancuernas para más carga."],
      ["db-lateral-step-up", "Subiendo de lado, para los glúteos."],
      ["box-step-down", "Bajadas lentas para controlar la rodilla."],
    ],
    faq: [
      [
        "¿Qué altura de cajón?",
        "A la altura de la rodilla o más bajo. Los cajones altos trabajan más glúteos pero son más difíciles de controlar.",
      ],
      [
        "¿Subidas o zancadas?",
        "Trabajan los mismos músculos. Las subidas son más fáciles de equilibrar; las zancadas tienen más recorrido.",
      ],
    ],
  },
  "bench-press": {
    intro:
      "El press de banca es el principal ejercicio de fuerza del tren superior. Trabaja pecho, parte delantera del hombro y tríceps, admite mucho peso y es de los más fáciles para seguir tu progreso.",
    mistakes: [
      ["Hombros sueltos", "Lleva las escápulas atrás y abajo antes de desenganchar la barra, y mantenlas fijas toda la serie."],
      ["Codos totalmente abiertos", "Recógelos a unos 45 a 70 grados del cuerpo. Es más fuerte y cuida los hombros."],
      ["Rebotar la barra en el pecho", "Toca suave en la parte baja del pecho y empuja. Una pausa corta enseña control."],
      ["Pies sueltos", "Planta los pies y empuja el suelo para mantener el cuerpo firme."],
    ],
    sets: [
      "**Fuerza:** 3 a 5 series de 3 a 6, descansando de 3 a 5 minutos.",
      "**Músculo:** 3 a 4 series de 6 a 10, descansando de 2 a 3 minutos.",
      "**Si empiezas:** 3 series de 8, sumando un poco de peso en cada sesión.",
    ],
    variations: [
      ["db-bench-press", "Más recorrido, y cada lado trabaja por su cuenta."],
      ["incline-bench-press", "Más pecho superior y hombro delantero."],
      ["close-grip-bench", "Lleva el trabajo hacia los tríceps."],
      ["spoto-press", "Pausa justo encima del pecho para ganar control."],
    ],
    faq: [
      [
        "¿Necesito a alguien que me ayude?",
        "En las series pesadas, usa un compañero o un rack con los seguros justo por debajo de la altura del pecho.",
      ],
      [
        "¿Qué anchura de agarre?",
        "La mayoría empuja mejor con los antebrazos verticales abajo, normalmente algo más abierto que los hombros.",
      ],
      ["¿Arqueo la espalda?", "Un pequeño arco al llevar las escápulas atrás es normal. Mantén los glúteos en el banco."],
    ],
  },
  "incline-bench-press": {
    intro:
      "El press inclinado empuja una barra en un banco a unos 30 grados. Lleva más trabajo al pecho superior y la parte delantera del hombro que el press plano.",
    mistakes: [
      ["Banco demasiado inclinado", "Unos 30 grados bastan. Más, y se convierte en un press de hombros."],
      ["Barra demasiado baja", "Baja la barra a la parte alta del pecho, justo debajo de las clavículas."],
      ["Hombros que se van hacia delante", "Escápulas atrás y abajo, como en el press plano."],
    ],
    sets: ["**Fuerza:** 3 a 4 series de 4 a 6.", "**Músculo:** 3 series de 6 a 12."],
    variations: [
      ["db-incline-press", "Mancuernas: más recorrido y más cómodo para los hombros."],
      ["smith-incline-press", "Una trayectoria fija para apretar con seguridad."],
      ["bench-press", "Plano: más peso en total."],
    ],
    faq: [
      ["¿Qué inclinación uso?", "Unos 30 grados. Muchos bancos regulables tienen una posición cercana."],
      [
        "¿Necesito plano e inclinado?",
        "No necesariamente, pero hacer los dos trabaja el pecho desde dos ángulos. Muchos planes usan uno como ejercicio principal y el otro como segundo press.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "El press de banca con mancuernas empuja dos mancuernas tumbado en un banco plano. Cada brazo trabaja por su cuenta y las mancuernas bajan más que una barra, así que es genial para el tamaño del pecho y para igualar lados.",
    mistakes: [
      ["Colocarse mal", "Siéntate con las mancuernas sobre los muslos, túmbate y súbelas con un empujón de rodillas."],
      ["Mancuernas demasiado abiertas", "Bájalas a los lados del pecho con los codos a unos 45 grados."],
      ["Chocarlas arriba", "Empuja hacia arriba y un poco hacia dentro, y para justo antes de que se toquen."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 6 a 12.", "**En casa:** 3 series de 10 a 20 bajando despacio si tus mancuernas son ligeras."],
    variations: [
      ["db-incline-press", "Enfocado en el pecho superior."],
      ["db-floor-press", "Sin banco; menos recorrido."],
      ["db-neutral-press", "Palmas enfrentadas: más cómodo para los hombros."],
    ],
    faq: [
      [
        "¿Mancuernas o barra?",
        "La barra permite levantar más; las mancuernas dan más recorrido e igualan lados. Las dos construyen pecho.",
      ],
      [
        "¿Cómo dejo las mancuernas con seguridad?",
        "Llévalas al pecho y bájalas a los muslos mientras te incorporas. No las sueltes hacia los lados.",
      ],
    ],
  },
  "db-incline-press": {
    intro:
      "El press inclinado con mancuernas empuja dos mancuernas en un banco inclinado. Es de los mejores ejercicios para el pecho superior y más amable con los hombros que el inclinado con barra.",
    mistakes: [
      ["Demasiada inclinación", "Usa unos 30 grados para que mande el pecho."],
      ["Recortar el recorrido", "Deja que las mancuernas bajen a la altura del pecho para estirar del todo, con control."],
      ["Arquearse sobre el banco", "Cadera abajo y parte alta de la espalda pegada al respaldo."],
    ],
    sets: ["**Músculo:** 3 series de 8 a 12."],
    variations: [
      ["db-low-incline-press", "Un ángulo más bajo, entre plano e inclinado."],
      ["incline-bench-press", "La versión con barra para más carga."],
      ["incline-machine-press", "Una máquina para apretar sin tener que equilibrar."],
    ],
    faq: [
      ["¿El press inclinado construye pecho superior?", "Sí. La inclinación lleva más trabajo a las fibras superiores del pecho."],
      ["¿Cuánto peso respecto al plano?", "Normalmente entre un 10 y un 20 % menos que tu press plano con mancuernas."],
    ],
  },
  "push-up": {
    intro:
      "La flexión empuja tu cuerpo desde el suelo. Trabaja pecho, hombros y tríceps en cualquier sitio, y con versiones más difíciles puede llevarte muy lejos.",
    mistakes: [
      ["Cadera hundida", "Aprieta glúteos y abdomen para que el cuerpo forme una sola línea."],
      ["Codos abiertos", "Mantén los codos a unos 45 grados del cuerpo."],
      ["Medias repeticiones", "Baja hasta que el pecho quede a un puño del suelo y empuja hasta arriba del todo."],
    ],
    sets: [
      "**Músculo:** 3 series, parando una o dos repeticiones antes del fallo.",
      "**¿Demasiado fácil?** Eleva los pies, baja más despacio o ponte una mochila.",
    ],
    variations: [
      ["incline-push-up", "Manos en un banco: más fácil, el primer paso."],
      ["decline-push-up", "Pies elevados: más difícil, más pecho superior."],
      ["archer-push-up", "Lleva el trabajo a un brazo."],
      ["deficit-push-up", "Manos sobre bloques para estirar más."],
    ],
    faq: [
      ["¿Cuántas flexiones hago?", "Tantas buenas como puedas menos una o dos, en 3 series. Hazlas más difíciles cuando pases de unas 20."],
      [
        "¿Las flexiones construyen músculo?",
        "Sí, siempre que las series sean duras. Usa versiones más difíciles a medida que ganes fuerza. Mira [calisthenics progressions](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro:
      "Los fondos bajan y empujan tu cuerpo entre dos barras paralelas. Son de los mejores ejercicios con tu peso para pecho y tríceps.",
    mistakes: [
      ["Bajar demasiado", "Baja hasta que los brazos queden casi paralelos al suelo, o menos si los hombros se quejan."],
      ["Encoger los hombros", "Mantén los hombros abajo, lejos de las orejas."],
      ["Balancearse", "Cruza los tobillos y mantén el cuerpo quieto."],
    ],
    sets: ["**Músculo:** 3 series de 6 a 12.", "**¿Demasiado fácil?** Añade peso con un cinturón o una mancuerna entre los pies."],
    variations: [
      ["negative-dip", "Solo la bajada lenta, el primer paso."],
      ["band-assisted-dip", "Una banda te quita parte del peso."],
      ["ring-dip", "Mucho más difícil: las anillas se mueven."],
    ],
    faq: [
      ["¿Pecho o tríceps?", "Inclínate hacia delante para más pecho; quédate erguido para más tríceps."],
      ["¿Son malos los fondos para los hombros?", "No para la mayoría, si controlas la profundidad. Para antes del recorrido que duele."],
    ],
  },
  "cable-fly": {
    intro:
      "El cruce de poleas junta las manos en un arco, como un abrazo, contra dos poleas. Aísla el pecho y mantiene la tensión en toda la repetición, sobre todo en el estiramiento.",
    mistakes: [
      ["Convertirlo en un press", "Mantén una ligera flexión fija en los codos. Muévete solo desde los hombros."],
      ["Demasiado peso", "Elige un peso que controles en todo el estiramiento."],
      ["Hombros hacia delante", "Pecho arriba y escápulas atrás."],
    ],
    sets: ["**Músculo:** 2 a 3 series de 10 a 15, después de los press."],
    variations: [
      ["low-cable-fly", "De abajo arriba: pecho superior."],
      ["pec-deck", "Una máquina con trayectoria fija."],
      ["db-fly", "Con mancuernas, sin poleas."],
    ],
    faq: [
      ["¿Polea alta o baja?", "De arriba abajo trabaja más el pecho inferior; de abajo arriba, el superior. Los dos son buenos."],
      [
        "¿Poleas o aperturas con mancuernas?",
        "Las poleas mantienen la tensión arriba; las mancuernas pesan más en el estiramiento. Cualquiera sirve.",
      ],
    ],
  },
  "overhead-press": {
    intro:
      "El press militar empuja una barra desde los hombros hasta por encima de la cabeza, de pie. Construye hombros y tríceps, y todo el cuerpo tiene que fijarse para aguantarlo.",
    mistakes: [
      ["Echarse muy atrás", "Aprieta los glúteos y fija el tronco para mantener el cuerpo alineado."],
      ["La barra rodea la cara", "Lleva la barbilla atrás, empuja recto hacia arriba y mete la cabeza cuando la barra pase."],
      ["Codos abiertos al empezar", "Empieza con los codos un poco por delante de la barra."],
    ],
    sets: ["**Fuerza:** 3 a 5 series de 3 a 6.", "**Músculo:** 3 series de 6 a 10."],
    variations: [
      ["db-shoulder-press", "Sentado, con mancuernas: más amable con la zona lumbar."],
      ["push-press", "Un poco de impulso de piernas para mover más peso."],
      ["landmine-press", "Un press en ángulo para hombros delicados."],
    ],
    faq: [
      [
        "¿Por qué se me estanca tanto el press militar?",
        "Es un ejercicio más pequeño, así que los saltos de peso son relativamente grandes. Usa discos pequeños o suma repeticiones antes que peso. Mira [linear vs double progression](/blog/linear-vs-double-progression/).",
      ],
      ["¿De pie o sentado?", "De pie entrena también el tronco; sentado deja empujar más a los hombros. Los dos funcionan."],
    ],
  },
  "db-shoulder-press": {
    intro:
      "El press de hombros con mancuernas empuja dos mancuernas por encima de la cabeza, normalmente sentado y con respaldo. Construye la parte delantera y lateral del hombro con menos carga lumbar que el press de pie con barra.",
    mistakes: [
      ["Respaldo totalmente vertical", "Ponlo justo antes de la vertical para que la espalda quede apoyada."],
      ["Bajar demasiado poco", "Lleva las mancuernas a la altura de las orejas o la barbilla."],
      ["Chocar las mancuernas", "Empuja hacia arriba y un poco hacia dentro, y para antes de que se toquen."],
    ],
    sets: ["**Músculo:** 3 series de 6 a 12."],
    variations: [
      ["db-arnold-press", "Girando las palmas para más hombro delantero."],
      ["machine-shoulder-press", "Una trayectoria fija para apretar con seguridad."],
      ["overhead-press", "Con barra, de pie."],
    ],
    faq: [
      ["¿Sentado o de pie?", "Sentado permite empujar más; de pie entrena equilibrio y tronco."],
      ["¿Palmas al frente o hacia dentro?", "Un poco hacia dentro resulta más cómodo para muchos hombros. Usa lo que mejor te siente."],
    ],
  },
  "lateral-raise": {
    intro:
      "Las elevaciones laterales suben dos mancuernas hacia los lados. Aíslan el hombro lateral, que da anchura a los hombros y que los press apenas trabajan.",
    mistakes: [
      ["Subir el peso a tirones", "Usa un peso que puedas subir sin inclinarte ni encoger los hombros."],
      ["Encoger los hombros", "Piensa en empujar las mancuernas hacia fuera, lejos de ti, no hacia arriba."],
      ["Cargar demasiado", "Pesos ligeros para 12 a 20 buenas repeticiones superan a repeticiones pesadas a tirones."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 12 a 20, dos o tres veces por semana."],
    variations: [
      ["cable-lateral-raise", "Tensión constante, un brazo cada vez."],
      ["lean-away-lateral-raise", "Agarrado a un poste para más recorrido."],
      ["machine-lateral-raise", "Una trayectoria fija, fácil de llevar al fallo."],
    ],
    faq: [
      ["¿Cuánto peso en las elevaciones laterales?", "Poco. La mayoría usa mancuernas de 4 a 10 kg para hacer buenas repeticiones."],
      ["¿Hasta dónde subo?", "Hasta la altura de los hombros, más o menos. Más arriba entran los trapecios."],
    ],
  },
  "face-pull": {
    intro:
      "El face pull tira de una cuerda en una polea alta hacia la cara, con las manos separadas. Trabaja el hombro posterior y la parte alta de la espalda, que equilibran los empujes y ayudan a la postura.",
    mistakes: [
      ["Tirar con la zona lumbar", "Quédate erguido y firme; inclínate atrás solo un poco."],
      ["Manos demasiado bajas", "Tira hacia la frente o los ojos, con las manos terminando junto a las orejas."],
      ["Demasiado peso", "Usa un peso con el que puedas hacer una pausa al final de cada repetición."],
    ],
    sets: ["**Músculo y salud del hombro:** 2 a 3 series de 12 a 20."],
    variations: [
      ["band-face-pull", "Con una banda, en casa."],
      ["rear-delt-fly", "Con mancuernas, inclinado."],
      ["reverse-pec-deck", "Una máquina con trayectoria fija."],
    ],
    faq: [
      [
        "¿Son buenos los face pulls para los hombros?",
        "Trabajan el hombro posterior y la parte alta de la espalda, que equilibran los empujes. Mucha gente los hace en cada sesión de tren superior.",
      ],
      ["¿Cuerda o barra?", "La cuerda deja separar las manos al final, lo que trabaja más el hombro posterior."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "Los pájaros se inclinan hacia delante y suben dos mancuernas hacia los lados. Aíslan el hombro posterior, que ni los press ni casi los remos trabajan mucho.",
    mistakes: [
      ["Convertirlo en un remo", "Mantén una ligera flexión fija del codo y muévete desde los hombros."],
      ["Juntar las escápulas", "Que lo hagan los hombros; las escápulas se quedan bastante quietas."],
      ["Demasiado peso", "Pesos muy ligeros y con control funcionan mejor."],
    ],
    sets: ["**Músculo:** 3 series de 12 a 20."],
    variations: [
      ["reverse-pec-deck", "Una máquina, más fácil de hacer estricto."],
      ["cable-rear-delt-fly", "Con poleas para tensión constante."],
      ["face-pull", "Un tirón que además trabaja la parte alta de la espalda."],
    ],
    faq: [
      ["¿Sentado o de pie?", "Sentado con el pecho sobre las rodillas, o boca abajo en un banco inclinado, hace más fácil ser estricto."],
      ["¿Por qué entrenar el hombro posterior?", "Completa el hombro y equilibra todos los empujes que hacen casi todos los programas."],
    ],
  },
  "pull-up": {
    intro:
      "La dominada prona se cuelga de una barra con las palmas hacia fuera y sube la barbilla por encima. Es el clásico ejercicio de espalda con tu peso: trabaja dorsales, parte alta de la espalda y bíceps.",
    mistakes: [
      ["Kipping o balanceo", "Empieza cada repetición colgado y quieto."],
      ["Medias repeticiones", "Ve de brazos estirados a barbilla por encima de la barra."],
      ["Encoger los hombros arriba", "Lleva los hombros abajo y atrás mientras tiras."],
    ],
    sets: [
      "**Músculo:** 3 a 4 series, parando una o dos repeticiones antes del fallo.",
      "**¿Demasiado fácil?** Añade peso con un cinturón o una mancuerna entre los pies.",
    ],
    variations: [
      ["negative-pull-up", "Salta arriba y baja despacio, el primer paso."],
      ["band-assisted-pull-up", "Una banda te quita parte del peso."],
      ["chin-up", "Palmas hacia ti: algo más fácil, más bíceps."],
      ["neutral-grip-pull-up", "Palmas enfrentadas, cómodo para los codos."],
    ],
    faq: [
      [
        "¿Cómo hago mi primera dominada?",
        "Negativas lentas, repeticiones asistidas con banda y jalones al pecho, tres veces por semana. La mayoría consigue la primera en un par de meses.",
      ],
      [
        "¿Dominada o jalón al pecho?",
        "Los dos trabajan los dorsales. Las dominadas trabajan también el tronco; el jalón permite elegir cualquier peso.",
      ],
    ],
  },
  "chin-up": {
    intro:
      "La dominada supina se cuelga de una barra con las palmas hacia ti y sube la barbilla por encima. Trabaja los dorsales y más los bíceps que la prona, y casi todo el mundo hace alguna más.",
    mistakes: [
      ["No estirar del todo abajo", "Estira los brazos al final de cada repetición."],
      ["Estirar el cuello", "Lleva el pecho hacia la barra en vez de estirar el cuello."],
      ["Balancearse", "Piernas quietas y tronco firme."],
    ],
    sets: ["**Músculo:** 3 a 4 series, parando una o dos repeticiones antes del fallo."],
    variations: [
      ["pull-up", "Palmas hacia fuera: más parte alta de la espalda."],
      ["reverse-grip-pulldown", "El mismo agarre en máquina."],
      ["negative-pull-up", "Bajada lenta para llegar a ella."],
    ],
    faq: [
      [
        "¿Supina o prona?",
        "La supina usa más bíceps y es algo más fácil; la prona usa más parte alta de la espalda. Las dos construyen dorsales.",
      ],
      ["¿Qué anchura de agarre?", "Al ancho de hombros, más o menos."],
    ],
  },
  "lat-pulldown": {
    intro:
      "El jalón al pecho baja una barra desde una polea alta hasta la parte alta del pecho. Trabaja los dorsales como una dominada pero te deja elegir el peso, así que lo puede hacer cualquiera.",
    mistakes: [
      ["Echarse muy atrás", "Inclínate solo un poco y mantén el pecho arriba."],
      ["Tirar con los brazos", "Piensa en llevar los codos abajo, hacia los costados."],
      ["Tirar por detrás de la nuca", "Tira hacia la parte alta del pecho."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 8 a 12."],
    variations: [
      ["close-grip-pulldown", "Un agarre estrecho, más recorrido."],
      ["one-arm-cable-pulldown", "Un lado cada vez."],
      ["pull-up", "Con tu propio peso."],
    ],
    faq: [
      [
        "¿Agarre abierto o cerrado?",
        "Los dos trabajan los dorsales. Un agarre medio, algo más abierto que los hombros, va bien a casi todo el mundo.",
      ],
      ["¿El jalón ayuda a conseguir dominadas?", "Sí, sobre todo con negativas lentas. Mira [back workout](/blog/back-workout/)."],
    ],
  },
  "barbell-row": {
    intro:
      "El remo con barra se inclina hacia delante y lleva una barra hasta el abdomen. Construye toda la parte alta de la espalda, los dorsales y el hombro posterior, y admite cargas pesadas.",
    mistakes: [
      ["Incorporarse al remar", "Mantén el torso en un ángulo fijo, a unos 30 a 45 grados del suelo."],
      ["Tirar de golpe", "Tira de forma fluida y baja con control."],
      ["Redondear la zona lumbar", "Fija el tronco y mantén la espalda recta. Quita peso si se redondea."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 6 a 12.", "**Fuerza:** 3 series de 5 a 8."],
    variations: [
      ["pendlay-row", "Desde el suelo en cada repetición, espalda plana."],
      ["chest-supported-row", "Sin ninguna carga en la zona lumbar."],
      ["db-row", "Un brazo cada vez, con apoyo."],
    ],
    faq: [
      ["¿Agarre prono o supino?", "Prono trabaja más la parte alta de la espalda; supino, más dorsales y bíceps. Los dos valen."],
      ["¿Por qué me duele la zona lumbar al remar?", "El torso va sin apoyo. Usa menos peso o pasa a un remo con apoyo en el pecho."],
    ],
  },
  "db-row": {
    intro:
      "El remo a una mano con mancuerna apoya una mano y una rodilla en un banco y lleva la mancuerna hacia la cadera. Trabaja dorsales y parte alta de la espalda lado a lado, con la espalda apoyada.",
    mistakes: [
      ["Girarse para subir", "Mantén hombros y cadera paralelos al suelo."],
      ["Tirar hacia el pecho", "Tira hacia la cadera para trabajar los dorsales."],
      ["Recorrido corto", "Deja colgar la mancuerna del todo para estirar en cada repetición."],
    ],
    sets: ["**Músculo:** 3 series de 8 a 12 por brazo."],
    variations: [
      ["db-chest-supported-row", "Los dos brazos, con el pecho en un banco inclinado."],
      ["kb-row", "Con una pesa rusa."],
      ["seal-row", "Tumbado en un banco alto: muy estricto."],
    ],
    faq: [
      ["¿Necesito un banco?", "Con banco es más fácil. Sin él, apoya una mano en una silla firme o en la rodilla."],
      ["¿Cuánto peso en el remo con mancuerna?", "El suficiente para que las dos últimas repeticiones cuesten sin girarte."],
    ],
  },
  "seated-cable-row": {
    intro:
      "El remo sentado en polea tira de un agarre hacia el abdomen desde una polea baja, sentado. Trabaja la parte alta de la espalda y los dorsales con tensión constante y sin carga lumbar.",
    mistakes: [
      ["Balancearse adelante y atrás", "Mantén el torso quieto, inclinándote atrás solo un poco al final."],
      ["Encoger los hombros", "Lleva las escápulas atrás y abajo, no arriba."],
      ["Volver con prisa", "Deja que los brazos se estiren con control y nota el estiramiento."],
    ],
    sets: ["**Músculo:** 3 a 4 series de 8 a 15."],
    variations: [
      ["cable-row-wide", "Una barra ancha: más parte alta de la espalda."],
      ["single-arm-cable-row", "Un lado cada vez."],
      ["machine-row", "Una máquina con apoyo en el pecho."],
    ],
    faq: [
      [
        "¿Qué agarre es mejor?",
        "El triángulo estrecho trabaja más dorsales; la barra ancha, más parte alta de la espalda. Usa los dos con el tiempo.",
      ],
      ["¿Me inclino hacia delante?", "Un poco al empezar para estirar, y luego siéntate erguido al tirar."],
    ],
  },
  "barbell-curl": {
    intro:
      "El curl con barra sube una barra desde los muslos hasta los hombros. Es el ejercicio clásico de bíceps y el curl con el que más peso se puede mover.",
    mistakes: [
      ["Balancearse con la espalda", "Quédate erguido con los codos pegados a los costados. Quita peso si necesitas balancearte."],
      ["Codos que se adelantan", "Mantenlos cerca del cuerpo toda la repetición."],
      ["Dejar caer la barra", "Bájala con control en dos o tres segundos."],
    ],
    sets: ["**Músculo:** 2 a 4 series de 8 a 12."],
    variations: [
      ["ez-curl", "Una barra angulada, más cómoda para las muñecas."],
      ["db-curl", "Cada brazo por su cuenta."],
      ["drag-curl", "Sube la barra pegada al cuerpo para trabajar más el pico del bíceps."],
    ],
    faq: [
      ["¿Barra recta o barra EZ?", "La EZ es más cómoda para las muñecas. La recta trabaja un poco más los bíceps."],
      [
        "¿Cuántos curls hago?",
        "Unas 6 a 12 series duras de bíceps a la semana, contando dominadas y remos. Mira [arm workout](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "El curl con mancuernas sube una mancuerna en cada mano. Cada brazo trabaja por su cuenta y puedes girar las palmas hacia arriba al subir, lo que trabaja el bíceps por completo.",
    mistakes: [
      ["Balancearse", "Codos junto a los costados y cuerpo quieto."],
      ["Girar demasiado tarde", "Empieza con las palmas hacia dentro y gíralas hacia arriba al subir."],
      ["Recorrido corto", "Estira del todo los brazos abajo."],
    ],
    sets: ["**Músculo:** 2 a 4 series de 8 a 15."],
    variations: [
      ["incline-db-curl", "En un banco inclinado para un estiramiento largo."],
      ["hammer-curl", "Palmas hacia dentro: más antebrazo y braquial."],
      ["db-preacher-curl", "Brazo apoyado para repeticiones estrictas."],
    ],
    faq: [
      ["¿Alterno o los dos brazos a la vez?", "Cualquiera. Alternar te deja concentrarte en cada brazo; a la vez ahorra tiempo."],
      ["¿De pie o sentado?", "Sentado es más difícil balancearse."],
    ],
  },
  "hammer-curl": {
    intro:
      "El curl martillo sube mancuernas con las palmas enfrentadas. Trabaja el braquial y los músculos del antebrazo más que un curl normal, lo que da grosor al brazo.",
    mistakes: [
      ["Balancear el peso", "Quédate erguido y con los codos quietos."],
      ["Girar las palmas", "Mantén las palmas enfrentadas toda la repetición."],
      ["Ir con prisa", "Baja con control."],
    ],
    sets: ["**Músculo:** 2 a 3 series de 8 a 15."],
    variations: [
      ["rope-hammer-curl", "En polea con cuerda."],
      ["incline-hammer-curl", "En un banco inclinado para estirar."],
      ["reverse-curl", "Palmas hacia abajo para los antebrazos."],
    ],
    faq: [
      ["¿Martillo o curl normal?", "Haz los dos: curl normal para el bíceps, martillo para el braquial y el antebrazo."],
      ["¿Cruzado o recto?", "Los dos funcionan. Cruzado sobre el cuerpo es una variante habitual que a algunos les resulta más cómoda."],
    ],
  },
  "cable-pushdown": {
    intro:
      "El jalón de tríceps empuja una barra o una cuerda hacia abajo desde una polea alta. Aísla el tríceps y es fácil de aprender, cómodo para los codos y fácil de progresar.",
    mistakes: [
      ["Mover los codos", "Pega los codos a los costados; solo se mueven los antebrazos."],
      ["Echarse sobre el peso", "Quédate erguido con una ligera inclinación, sin encorvarte."],
      ["Recorrido corto", "Estira del todo abajo y deja que los antebrazos suban más allá de la paralela."],
    ],
    sets: ["**Músculo:** 2 a 4 series de 10 a 15."],
    variations: [
      ["rope-pushdown", "La cuerda deja separar las manos abajo."],
      ["cable-overhead-extension", "Por encima de la cabeza: la cabeza larga del tríceps."],
      ["reverse-grip-pushdown", "Palmas hacia arriba, otra sensación."],
    ],
    faq: [
      ["¿Cuerda o barra?", "Con barra levantas más; con cuerda las manos se separan. Usa cualquiera."],
      [
        "¿Necesito también trabajo de tríceps por encima de la cabeza?",
        "Una extensión por encima de la cabeza trabaja la cabeza larga del tríceps en estiramiento, lo que puede construir más músculo.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "El press francés baja una barra EZ hacia la frente tumbado en un banco y luego estira los brazos. Trabaja las tres cabezas del tríceps con un buen estiramiento.",
    mistakes: [
      ["Codos abiertos", "Mantenlos apuntando al techo, al ancho de hombros."],
      ["Bajar a la frente", "Baja hacia lo alto de la cabeza o un poco por detrás, para más estiramiento y menos riesgo."],
      ["Demasiado peso", "Elige un peso que controles en toda la bajada."],
    ],
    sets: ["**Músculo:** 2 a 3 series de 8 a 12."],
    variations: [
      ["db-skull-crusher", "Con mancuernas, más cómodo para las muñecas."],
      ["incline-skull-crusher", "En un banco inclinado para un estiramiento más largo."],
      ["jm-press", "A medio camino entre press francés y press cerrado."],
    ],
    faq: [
      [
        "¿Es malo el press francés para los codos?",
        "A algunos codos les molesta. Baja el peso, prueba con mancuernas o pasa a poleas si duele.",
      ],
      ["¿Barra EZ o recta?", "La EZ es más cómoda para las muñecas."],
    ],
  },
  "close-grip-bench": {
    intro:
      "El press de banca con agarre cerrado es un press de banca con las manos al ancho de hombros. Lleva más trabajo al tríceps y aún te deja levantar pesado.",
    mistakes: [
      ["Agarre demasiado estrecho", "Al ancho de hombros, más o menos. Con las manos juntas sufren las muñecas."],
      ["Codos abiertos", "Mantenlos pegados a los costados."],
      ["Tocar demasiado arriba", "Baja a la parte baja del pecho."],
    ],
    sets: ["**Fuerza:** 3 a 4 series de 5 a 8.", "**Músculo:** 3 series de 8 a 12."],
    variations: [
      ["bench-press", "Un agarre más abierto, más pecho."],
      ["db-close-press", "Mancuernas juntas mientras empujas."],
      ["diamond-push-up", "La versión con tu peso."],
    ],
    faq: [
      ["¿Es de pecho o de tríceps?", "De los dos, con más tríceps que el press de banca normal."],
      ["¿Cuánto menos que mi press de banca?", "Normalmente entre un 10 y un 15 % menos."],
    ],
  },
  "preacher-curl": {
    intro:
      "El curl predicador apoya los brazos en un atril inclinado y sube una barra EZ. El atril impide balancearse y carga mucho el bíceps abajo, en el estiramiento.",
    mistakes: [
      ["No llegar al estiramiento", "Baja hasta que los brazos queden casi rectos, con control."],
      ["Despegar los codos del atril", "Mantén los brazos apoyados en el atril."],
      ["Dejarse caer abajo", "Frena el último tramo de la bajada, donde está el estiramiento."],
    ],
    sets: ["**Músculo:** 2 a 3 series de 8 a 12."],
    variations: [
      ["db-preacher-curl", "Un brazo cada vez con mancuerna."],
      ["machine-preacher-curl", "Una trayectoria fija, fácil de apretar."],
      ["cable-preacher-curl", "Con tensión también arriba."],
    ],
    faq: [
      [
        "¿Es mejor el curl predicador que el curl de pie?",
        "Es más estricto y carga más la posición de estiramiento. Los dos construyen bíceps.",
      ],
      ["¿Por qué me duele abajo?", "Baja el peso y ve más despacio. No estires del todo si los codos se quejan."],
    ],
  },
};
