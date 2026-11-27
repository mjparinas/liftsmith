import type { GenUi, ToolPageText } from "../types";

// Il generatore di allenamenti in italiano (tu). Stesse parti della pagina inglese (./en.ts).
export const GEN_IT: { page: ToolPageText; ui: GenUi } = {
  page: {
    title: "Generatore di allenamenti: una scheda gratis per la tua attrezzatura e il tuo tempo",
    description:
      "Scegli l’attrezzatura, quanto tempo hai e cosa vuoi allenare, e ottieni un allenamento gratis con serie, ripetizioni, recupero e un breve motivo per ogni esercizio. Senza registrazione, e ogni allenamento ha il suo link.",
    name: "Generatore di allenamenti",
    intro:
      "Digli cosa hai e quanto tempo, e scrive l’allenamento: esercizi adatti alla tua attrezzatura, i grandi per primi, con serie, ripetizioni, recupero e il perché di ognuno.",
    sticky: "Un allenamento nuovo ogni giorno, fatto per te",
    mid: {
      title: "L’allenamento di domani segue quello di oggi",
      body: "Qui ogni allenamento parte da zero. {app} ricorda cosa hai sollevato, quali muscoli si stanno ancora recuperando e quante serie ha fatto ognuno questa settimana, così ogni giorno segue il precedente e i carichi salgono quando sei pronto.",
      button: "Pianifica i miei allenamenti",
    },
    end: {
      title: "Entra sapendo cosa fare",
      body: "{app} scrive ogni giorno un allenamento come questo in base alla tua palestra, al tuo recupero e al tuo blocco di allenamento, poi ti lascia sollevare.",
    },
    faq: [
      [
        "Come funziona il generatore di allenamenti?",
        "Usa lo stesso motore che pianifica gli allenamenti nell’app {app}. Tiene solo gli esercizi possibili con la tua attrezzatura, li indirizza a ciò che hai scelto di allenare, mette per primi i grandi esercizi multiarticolari mentre sei fresco e fa stare serie, recuperi e serie di riscaldamento nei minuti che hai.",
      ],
      [
        "È gratis? Serve un account?",
        "È gratis, senza registrazione. Le tue scelte (attrezzatura, minuti, zona, obiettivo ed esperienza) vengono inviate per creare l’allenamento e non viene salvato nulla. Sono tutte nel link, quindi lo stesso link dà sempre lo stesso allenamento.",
      ],
      [
        "Quanto carico devo usare?",
        "Ogni esercizio dice quante ripetizioni lasciare in riserva. Scegli un carico con cui potresti farne ancora altrettante a fine serie con una buona tecnica. Se l’ultima è stata facile, sali un po’ nella serie dopo. L’app impara i tuoi numeri reali dal primo allenamento e poi pianifica ogni carico.",
      ],
      [
        "Cosa sono le ripetizioni in riserva?",
        "Quante ripetizioni buone avresti ancora potuto fare quando ti fermi. Un nuovo blocco inizia a qualche ripetizione dal cedimento, per imparare gli esercizi e recuperare bene, e si avvicina al cedimento nelle settimane successive.",
      ],
      [
        "Perché il mio allenamento è più corto del tempo scelto?",
        "Con poca attrezzatura e una zona piccola, gli esercizi utili sono pochi. Invece di riempirlo, il generatore te lo dice. Aggiungi attrezzatura, scegli una zona più ampia o fai un secondo giro.",
      ],
      [
        "Posso salvare l’allenamento o seguirlo nell’app?",
        "Sì. Condividi questo allenamento copia il suo link. Inizia nell’app lo apre in {app} come routine: i tuoi carichi si compilano mentre sollevi, il timer di recupero parte da solo e ogni serie viene salvata.",
      ],
    ],
    more: {
      heading: "Come viene costruito l’allenamento",
      paragraphs: [
        "Il generatore parte da tutti gli esercizi della libreria di {app} che la tua attrezzatura permette. Se hai scelto una zona, restano solo gli esercizi i cui muscoli principali sono tutti lì. I muscoli grandi scelgono per primi, e la prima scelta di ognuno è un multiarticolare che allena più muscoli insieme; gli esercizi più piccoli seguono in un secondo giro finché resta tempo.",
        "Serie e ripetizioni seguono il tuo obiettivo. Per i muscoli, i multiarticolari vanno da 6 a 10 ripetizioni e i più piccoli da 10 a 15; per la forza le ripetizioni scendono e i recuperi si allungano; per la forma fisica stanno nel mezzo. Tenute e trasporti si contano in secondi. Gli esercizi principali hanno serie di riscaldamento, e il tempo avanzato diventa una serie in più sui primi esercizi.",
        "Abbina gli esercizi in superserie fa ciò che fanno le superserie automatiche dell’app: due esercizi per muscoli diversi, uno dopo l’altro, così ogni muscolo recupera mentre l’altro lavora e ci sta di più nello stesso tempo.",
      ],
    },
    reading: [
      { href: "/blog/how-to-build-a-workout-routine/", label: "come costruire una scheda" },
      { href: "/blog/how-long-to-rest-between-sets/", label: "quanto recuperare tra le serie" },
      { href: "/it/tools/warm-up-calculator/", label: "il calcolatore di riscaldamento" },
    ],
  },
  ui: {
    equipment: "Attrezzatura",
    kits: { commercial: "Palestra completa", home: "Palestra in casa", dumbbells: "Solo manubri", bodyweight: "Senza attrezzi" },
    custom: "Scegli l’attrezzatura",
    customHint: "Tocca ciò che hai. L’allenamento usa solo questo.",
    minutes: "Tempo",
    minutesValue: "{n} min",
    focus: "Cosa allenare",
    goal: "Obiettivo",
    goals: { muscle: "Mettere muscoli", strength: "Diventare più forte", general: "Restare in forma" },
    level: "Esperienza",
    levels: { new: "Ho appena iniziato", intermediate: "Un po’ di esperienza", advanced: "Esperto" },
    pairs: "Abbina gli esercizi in superserie",
    pairsHint: "Due esercizi per muscoli diversi uno dopo l’altro, con meno recupero, così ci sta di più.",
    make: "Crea il mio allenamento",
    another: "Un altro allenamento",
    working: "Sto scrivendo il tuo allenamento…",
    error: "Non è stato possibile creare l’allenamento ora. Controlla la connessione e riprova.",
    nothing: "Niente va bene con questa attrezzatura e questa zona. Aggiungi attrezzatura o scegli un’altra zona.",
    about: "Circa {n} min",
    short:
      "Circa {n} minuti è tutto ciò che questa attrezzatura permette per questa zona. Aggiungi attrezzatura o scegli una zona più ampia.",
    order: "Prima i grandi esercizi mentre sei fresco, poi i più piccoli. Ogni esercizio dice perché c’è.",
    setsReps: "{sets} × {reps}",
    setsSecs: "{sets} × {secs} s",
    rest: "Recupero {time}",
    tank: "Ripetizioni in riserva: {n}",
    holdForm: "Fermati quando la tecnica cede",
    warmups: "Prima, serie di riscaldamento: {n}",
    superset: "Superserie {letter}",
    whyFirst: "{muscle}: un multiarticolare per primo, mentre sei fresco",
    whyCompound: "{muscle}: un multiarticolare che allena più muscoli insieme",
    whyIsolation: "{muscle}: un esercizio più piccolo per finire il muscolo",
    whyBodyweight: "{muscle}: un multiarticolare a corpo libero, senza carico",
    whyHold: "{muscle}: una tenuta o un trasporto, in secondi",
    repsMuscle: "Da {lo} a {hi} ripetizioni per i muscoli: parti da {reps} e aggiungine quando diventa facile",
    repsStrength: "Serie più pesanti da {lo} a {hi} ripetizioni per la forza",
    repsGeneral: "Da {lo} a {hi} ripetizioni, la via di mezzo per la forma fisica",
    repsBodyweight: "Da {lo} a {hi} ripetizioni: parti da {reps} e aggiungi ripetizioni prima di tutto",
    repsHold: "Da {lo} a {hi} secondi: parti da {reps} e tieni un po’ di più ogni volta",
    mainSets: "{sets} serie per un esercizio principale, con il tempo per farle",
    moreSets: "{sets} serie, usando il tempo che hai",
    pair: "Subito dopo {other}: muscoli diversi, quindi il recupero è più corto",
    share: "Condividi questo allenamento",
    copied: "Link copiato",
    start: "Inizia nell’app",
    startHint: "Si apre in {app} come routine. I tuoi carichi si compilano mentre sollevi.",
    example: "Un esempio per iniziare. Cambia qualsiasi scelta qui sopra.",
    see: "Vedi il tuo allenamento",
  },
};
