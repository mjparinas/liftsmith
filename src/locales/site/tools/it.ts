import type { LocalTools } from "./types";

// I calcolatori in italiano (tu). Stesse parti delle pagine inglesi (src/app/tools/).
export const IT_TOOLS: LocalTools = {
  frame: {
    tools: "Strumenti",
    questions: "Domande",
    more: "Per saperne di più:",
    and: " e ",
    englishLinks: "Le guide e gli articoli collegati sono in inglese.",
  },
  "plate-calculator": {
    page: {
      title: "Calcolatore dei dischi: quali dischi mettere su ogni lato del bilanciere",
      description:
        "Inserisci un peso e vedi esattamente quali dischi caricare su ogni lato del bilanciere, in kg o lb, con i dischi che hai. Se non si può fare, trova il peso più vicino.",
      name: "Calcolatore dei dischi",
      intro:
        "Quali dischi vanno su ogni lato del bilanciere per qualsiasi peso. Tocca + e − per impostarlo; disattiva i dischi che non hai.",
      sticky: "Dischi disegnati per ogni serie",
      mid: {
        title: "Basta conti con i dischi tra una serie e l’altra",
        body: "{app} disegna i dischi di ogni serie e ti mostra cosa cambiare per la successiva mentre recuperi.",
        button: "Provalo gratis",
      },
      end: {
        title: "Ogni serie caricata per te",
        body: "Di’ una volta a {app} quali dischi ha la tua palestra. Ogni peso che pianifica è uno che puoi davvero caricare, con i dischi per ogni lato.",
      },
      faq: [
        [
          "Come calcolo i dischi per lato?",
          "Prendi il peso che vuoi, togli il bilanciere (20 kg o 45 lb per un bilanciere olimpico standard) e dividi per due. Quello va su ogni lato. Carica prima i dischi più pesanti.",
        ],
        [
          "E se i miei dischi non arrivano a quel peso?",
          "Il calcolatore trova i pesi più vicini che puoi fare, sopra e sotto. Scegli quello più leggero: è l’errore più sicuro.",
        ],
        [
          "Quanto pesa il bilanciere?",
          "Un bilanciere olimpico standard pesa 20 kg o 45 lb. Quelli da donna 15 kg o 35 lb. Barre EZ, trap bar e multipower variano, quindi controlla il tuo.",
        ],
        [
          "{app} lo fa per me?",
          "Sì. {app} propone solo pesi che i dischi della tua palestra possono fare, disegna i dischi di ogni serie e ti mostra cosa cambiare tra le serie mentre recuperi.",
        ],
      ],
      reading: [{ href: "/blog/how-to-load-a-barbell/", label: "come caricare un bilanciere" }],
    },
    ui: {
      units: "Unità",
      weight: "Peso sul bilanciere ({unit})",
      weightAria: "peso",
      bar: "Bilanciere",
      plates: "Dischi che hai",
      loadThis: "Carica questo",
      cantMake: "Non si possono fare {want} con questi dischi. Il più vicino:",
      eachSide: "Per lato: {plates}",
      justBar: "niente, solo il bilanciere",
      closestOne: "Il più vicino che puoi fare: {below}. Stare sotto è l’errore più sicuro.",
      closestTwo: "Il più vicino che puoi fare: {below} o {above}. Stare sotto è l’errore più sicuro.",
    },
  },
  "one-rep-max-calculator": {
    page: {
      title: "Calcolatore del massimale: stima il tuo 1RM da qualsiasi serie",
      description:
        "Stima il tuo massimale da peso, ripetizioni e ripetizioni in riserva, con una tabella peso per ripetizioni e i risultati di Epley, Brzycki e altre sei formule.",
      name: "Calcolatore del massimale",
      intro:
        "Il tuo massimale stimato da qualsiasi serie, senza doverlo testare. Tocca + e − per inserire una serie; tieni premuto per andare più veloce.",
      sticky: "Il tuo massimale, seguito in ogni serie",
      mid: {
        title: "Guarda salire il tuo massimale, serie dopo serie",
        body: "{app} aggiorna la stima con ogni serie che registri e ti mostra l’andamento di ogni esercizio.",
        button: "Inizia gratis",
      },
      end: {
        title: "Diventa più forte senza tirare a indovinare",
        body: "{app} trasforma il tuo massimale nel peso giusto per ogni serie e lo alza quando te lo sei guadagnato.",
      },
      faq: [
        [
          "Come si stima il massimale?",
          "Dal peso e dalle ripetizioni che avresti potuto fare fino al cedimento (le tue ripetizioni più quelle che ti restavano). Fino a 10 ripetizioni al cedimento fa la media di Brzycki, Epley e di un’equazione del 2026 che dipende dal peso; sopra le 10 usa Mayhew, Wathan e la stessa equazione, che reggono meglio con più ripetizioni.",
        ],
        [
          "Perché contare le ripetizioni che mi restavano?",
          "Le formule presumono che tu sia arrivato al cedimento. Una serie da 5 con 2 in riserva è in realtà uno sforzo da 7, quindi se non le conti la stima esce bassa.",
        ],
        [
          "Quanto è precisa?",
          "Più precisa con serie dure da 2 a 6 ripetizioni, ancora utile fino a circa 10 e approssimativa oltre le 15. Considerala un intervallo e guarda l’andamento nel tempo.",
        ],
        [
          "{app} lo segue per me?",
          "Sì. Ogni serie che registri aggiorna la stima di quell’esercizio, dando più peso alle serie recenti e più vicine al cedimento, e la mostra in un grafico nel tempo.",
        ],
      ],
      reading: [
        { href: "/blog/how-to-estimate-your-one-rep-max/", label: "come stimare il tuo massimale" },
        { href: "/guides/reps-in-reserve/", label: "le ripetizioni in riserva" },
      ],
    },
    ui: {
      units: "Unità",
      weight: "Peso sollevato ({unit})",
      weightAria: "peso",
      reps: "Ripetizioni",
      repsAria: "ripetizioni",
      left: "Ripetizioni che ti restavano",
      failure: "0 (cedimento)",
      leftNote: "Contare le ripetizioni che ti restavano rende la stima molto più precisa.",
      rough: "Oltre 10 ripetizioni al cedimento le stime sono più approssimative.",
      estimate: "Massimale stimato",
      tableCaption: "Peso per ogni numero di ripetizioni al cedimento",
      colReps: "Rip.",
      colWeight: "Peso",
      colPct: "% del max",
      formulas: "Cosa dice ogni formula",
      formulasNote: "La stima qui sopra è la media delle formule adatte a {n} ripetizioni al cedimento (segnate con ✓).",
    },
  },
  "warm-up-calculator": {
    page: {
      title: "Calcolatore del riscaldamento: serie di avvicinamento per qualsiasi peso di lavoro",
      description:
        "Inserisci il tuo peso di lavoro e ottieni le serie di riscaldamento per squat, panca piana, stacco, military press o rematore, con i dischi per ogni lato.",
      name: "Calcolatore del riscaldamento",
      intro:
        "Le serie di riscaldamento prima del tuo peso di lavoro: abbastanza per essere pronto, non tante da stancarti. Scegli un esercizio e inserisci il peso.",
      sticky: "Riscaldamenti pianificati per ogni esercizio",
      mid: {
        title: "Non calcolare mai più un riscaldamento",
        body: "{app} aggiunge le serie di riscaldamento a ogni allenamento, con i dischi disegnati, e le salta quando il muscolo è già caldo.",
        button: "Pianifica il mio allenamento",
      },
      end: {
        title: "Arrivi, ti scaldi, sollevi",
        body: "{app} pianifica i riscaldamenti, le serie di lavoro e il recupero tra una e l’altra, così tu devi solo sollevare.",
      },
      faq: [
        [
          "Quante serie di riscaldamento devo fare?",
          "Dopo il bilanciere vuoto: una serie più leggera se il tuo peso di lavoro è sotto i 50 kg circa (110 lb), due serie di avvicinamento da 50 kg e tre da 100 kg (220 lb), l’ultima una singola all’85% circa.",
        ],
        [
          "Quante ripetizioni in una serie di riscaldamento?",
          "Meno man mano che il peso sale: circa 5 a metà del peso di lavoro, 2 o 3 tra il 70 e l’80% e una singola vicino all’85%. Lo scopo è provare il movimento e abituarti al carico, non stancarti.",
        ],
        [
          "Quanto recuperare tra le serie di riscaldamento?",
          "Circa {rest} secondi bastano per quelle leggere. Prima della prima serie di lavoro recupera il tuo tempo normale.",
        ],
        [
          "Devo scaldarmi per ogni esercizio?",
          "No. Il primo esercizio pesante per un muscolo richiede un avvicinamento. Un esercizio successivo per gli stessi muscoli richiede al massimo una serie di prova, e il lavoro complementare leggero di solito niente.",
        ],
      ],
      more: {
        heading: "Come si calcola il riscaldamento",
        paragraphs: [
          "Si parte dal bilanciere vuoto per 10 ripetizioni facili (a meno che il tuo peso di lavoro superi di poco il bilanciere), poi si sale in pochi passi verso il peso di lavoro. Ogni passo è un peso che i tuoi dischi possono fare davvero, più pesante del precedente e più leggero del peso di lavoro. Più pesante è l’esercizio, più passi ci sono e meno ripetizioni in ciascuno, così il riscaldamento ti prepara senza togliere energie alle serie di lavoro.",
          "È lo stesso avvicinamento che usa l’app {app}. Nell’app sa anche quali muscoli sono già caldi da prima nell’allenamento, quindi un secondo esercizio di spinta riceve una sola serie di prova invece di un avvicinamento completo.",
        ],
      },
      reading: [
        { href: "/blog/how-to-warm-up-for-lifting/", label: "come scaldarsi per i pesi" },
        { href: "/it/tools/plate-calculator/", label: "il calcolatore dei dischi" },
        { href: "/blog/dynamic-vs-static-stretching/", label: "stretching dinamico o statico" },
      ],
    },
    ui: {
      units: "Unità",
      lift: "Esercizio",
      lifts: {
        "back-squat": "Squat",
        "bench-press": "Panca piana",
        deadlift: "Stacco da terra",
        "overhead-press": "Military press",
        "barbell-row": "Rematore",
      },
      work: "Peso di lavoro ({unit})",
      workAria: "peso di lavoro",
      setsOne: "{n} serie di riscaldamento, {rest} s di recupero dopo",
      setsMany: "{n} serie di riscaldamento, {rest} s di recupero dopo ognuna",
      none: "Con questo peso non servono serie di riscaldamento",
      working: "{weight}: le tue serie di lavoro",
      eachSide: "Per lato: {plates}",
      empty: "Bilanciere vuoto",
    },
  },
};
