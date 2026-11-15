import type { MoreTools } from "./types";

// TDEE, macro, Wilks e DOTS in italiano (tu). Stesse parti delle pagine inglesi (src/app/tools/).
export const IT_MORE: MoreTools = {
  "tdee-calculator": {
    page: {
      title: "Calcolatore TDEE: calorie al giorno per mantenere, definire o crescere",
      description:
        "Calcola il tuo dispendio energetico giornaliero totale da età, sesso, altezza, peso e attività: metabolismo basale, IMC, calorie per definire o mettere massa e un intervallo di proteine per chi si allena.",
      name: "Calcolatore TDEE",
      intro:
        "Quante calorie bruci al giorno e cosa mangiare per mantenere, perdere o prendere peso. Tocca + e − per impostare i tuoi numeri; tieni premuto per andare più veloce.",
      sticky: "Calorie che seguono le tue pesate",
      mid: {
        title: "Sempre aggiornato, senza pensarci",
        body: "Il tuo TDEE cambia con il peso e l’allenamento. {app} lo ricalcola da solo dalle tue pesate e dai giorni in cui ti alleni davvero, e ne mostra l’andamento.",
        button: "Apri {app}",
      },
      end: {
        title: "Il tuo TDEE, sempre aggiornato",
        body: "{app} lo ricalcola dalle tue pesate e dai giorni in cui ti alleni, e pianifica anche i tuoi allenamenti.",
      },
      faq: [
        [
          "Che cos’è il TDEE?",
          "Il dispendio energetico giornaliero totale: le calorie che bruci in un giorno, contando il metabolismo a riposo (BMR), la digestione, il movimento quotidiano e l’esercizio. Se mangi più o meno così, il peso resta stabile.",
        ],
        [
          "Quale formula usa?",
          "Mifflin-St Jeor per il consumo a riposo, la più precisa delle equazioni comuni per la maggior parte delle persone. Se aggiungi la percentuale di grasso passa a Katch-McArdle, che parte dalla massa magra e si adatta meglio a chi ha muscoli. Poi il BMR viene moltiplicato per un fattore di attività da 1,2 (sedentario) a 1,9 (atleta).",
        ],
        [
          "Quante calorie per perdere o prendere peso?",
          "Circa 500 sotto il TDEE fanno perdere circa 0,5 kg a settimana. Per una massa pulita, circa 250 sopra tengono basso il grasso mentre costruisci muscolo. Pesati qualche volta a settimana e correggi se l’andamento non torna.",
        ],
        [
          "Quanto è preciso?",
          "Ogni formula è una stima, spesso entro il 10 % per la maggior parte delle persone. Conta la bilancia: se l’andamento di due o tre settimane non torna, alza o abbassa di 100-200 calorie.",
        ],
        [
          "{app} tiene aggiornato il mio TDEE?",
          "Sì. In {app} il TDEE si ricalcola quando cambiano peso, età o allenamento, legge peso, altezza e grasso corporeo da Health Connect o Apple Health se lo consenti, imposta il livello di attività in base ai giorni in cui ti alleni davvero e ne mostra l’andamento.",
        ],
      ],
      reading: [
        { href: "/it/tools/macro-calculator/", label: "il calcolatore di macro" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "quante proteine per mettere muscolo" },
        { href: "/blog/body-recomposition/", label: "la ricomposizione corporea" },
      ],
    },
    ui: {
      units: "Unità",
      metric: "Metrico",
      imperial: "Imperiale",
      sex: "Sesso",
      female: "Donna",
      male: "Uomo",
      age: "Età",
      weightKg: "Peso (kg)",
      weightLb: "Peso (lb)",
      heightCm: "Altezza (cm)",
      heightIn: "Altezza (in)",
      fat: "Grasso corporeo (facoltativo)",
      skip: "Salta",
      add: "Aggiungi",
      fatPct: "Grasso corporeo (%)",
      activity: "Attività",
    },
  },
  "macro-calculator": {
    page: {
      title: "Calcolatore di macro per chi si allena: proteine, grassi e carboidrati",
      description:
        "Calcola calorie e macro per perdere grasso, mantenere o mettere muscolo da età, sesso, altezza, peso e attività, con le proteine pensate per chi fa pesi.",
      name: "Calcolatore di macro",
      intro:
        "Le calorie per il tuo obiettivo dal tuo TDEE, divise in proteine, grassi e carboidrati per chi si allena con i pesi, con il motivo di ogni numero.",
      sticky: "Macro che seguono le tue pesate",
      mid: {
        title: "Macro che tengono il tuo passo",
        body: "In {app} calorie e macro seguono le tue pesate e i giorni di allenamento, e il coach ti avvisa quando le proteine sono poche.",
        button: "Inizia gratis",
      },
      end: {
        title: "Allenati per l’obiettivo per cui mangi",
        body: "{app} pianifica ogni allenamento in base al recupero e al blocco, così in definizione mantieni la forza e in massa costruisci muscolo.",
      },
      faq: [
        [
          "Quante proteine servono per mettere muscolo?",
          "La maggior parte degli studi su chi si allena con i pesi indica da 1,6 a 2,2 g per kg di peso al giorno. Questo calcolatore usa 1,8 g per mantenere o crescere e 2,2 g in definizione, dove più proteine aiutano a conservare il muscolo.",
        ],
        [
          "Come si fissano grassi e carboidrati?",
          "I grassi prendono un quarto delle calorie, ma mai meno di 0,6 g per kg, per gli ormoni. I carboidrati riempiono il resto, perché alimentano le serie dure. Se preferisci più grassi e meno carboidrati, scambiali a calorie: 1 g di grassi fa 9 calorie, 1 g di carboidrati 4.",
        ],
        [
          "Quante calorie per perdere grasso o mettere muscolo?",
          "Circa 500 sotto il TDEE fanno perdere circa 0,5 kg a settimana, senza mai scendere sotto il metabolismo basale. Circa 250 sopra costruiscono muscolo con poco grasso. Pesati qualche volta a settimana e correggi se l’andamento non torna.",
        ],
        [
          "Devo centrare i macro esattamente?",
          "No. Raggiungi le proteine e resta vicino alle calorie quasi tutti i giorni; la divisione tra grassi e carboidrati conta molto meno.",
        ],
      ],
      more: {
        heading: "Come si calcola",
        paragraphs: [
          "Il TDEE viene dall’equazione di Mifflin-St Jeor per un fattore di attività, come nel calcolatore TDEE. L’obiettivo fissa le calorie: 500 in meno (mai sotto il metabolismo basale), uguali o 250 in più. Prima si fissano le proteine per chilo di peso, poi i grassi, e ai carboidrati va il resto.",
        ],
      },
      reading: [
        { href: "/it/tools/tdee-calculator/", label: "il calcolatore TDEE" },
        { href: "/blog/how-much-protein-to-build-muscle/", label: "quante proteine per mettere muscolo" },
        { href: "/blog/lean-bulk/", label: "la massa pulita" },
      ],
    },
    ui: {
      units: "Unità",
      metric: "Metrico",
      imperial: "Imperiale",
      goal: "Obiettivo",
      cut: "Perdere grasso",
      maintain: "Mantenere",
      bulk: "Mettere muscolo",
      sex: "Sesso",
      female: "Donna",
      male: "Uomo",
      age: "Età",
      weightKg: "Peso (kg)",
      weightLb: "Peso (lb)",
      heightCm: "Altezza (cm)",
      heightIn: "Altezza (pollici)",
      activity: "Attività",
      kcalDay: "calorie al giorno",
      protein: "Proteine",
      fat: "Grassi",
      carbs: "Carboidrati",
      proteinCut: "{perKg} g per kg di peso: la parte alta dell’intervallo, per conservare il muscolo mentre perdi grasso.",
      proteinMaintain: "{perKg} g per kg di peso: il centro dell’intervallo che serve a chi si allena.",
      proteinBulk: "{perKg} g per kg di peso: abbastanza per mettere muscolo, con le calorie in più ai carboidrati.",
      fatWhy: "Un quarto delle tue calorie, e mai meno di 0,6 g per kg, per gli ormoni.",
      carbsWhy: "Il resto delle tue calorie, per alimentare le serie dure.",
      kcalFloor: "Il tuo metabolismo basale di {bmr}: un taglio più grande ci finirebbe sotto, e questo costa muscolo.",
      kcalCut: "500 sotto il tuo TDEE di {tdee}: circa {pace} in meno a settimana.",
      kcalMaintain: "Il tuo TDEE: quello che bruci in un giorno normale.",
      kcalBulk: "250 sopra il tuo TDEE di {tdee}: circa {pace} in più a settimana, soprattutto muscolo.",
      meals: "Dividi le proteine in {meals} pasti; si usano meglio in porzioni da 30 a 40 g.",
    },
  },
  "wilks-calculator": {
    page: {
      title: "Calcolatore Wilks, con punti IPF GL e DOTS",
      description:
        "Dai un punteggio al tuo totale di squat, panca piana e stacco da terra in base al peso corporeo con la formula di Wilks, i punti IPF GL (classico o equipaggiato) e DOTS, in kg o lb.",
      name: "Calcolatore Wilks",
      intro:
        "Il tuo totale di powerlifting valutato in base al peso in tre modi, Wilks, IPF GL e DOTS, per confrontare atleti di ogni taglia e vedere quanto manca al livello successivo.",
      sticky: "Il tuo punteggio di forza, sempre aggiornato",
      mid: {
        title: "Tutti e tre i punteggi, da ogni serie che registri",
        body: "{app} stima il tuo miglior squat, panca e stacco dal tuo allenamento e tiene aggiornati Wilks, IPF GL e DOTS, insieme all’alzata più indietro.",
        button: "Inizia gratis",
      },
      end: {
        title: "Costruisci un totale più grande",
        body: "{app} pianifica ogni allenamento con le ripetizioni in riserva, fa uno scarico quando la fatica si accumula e fa salire ogni alzata quando te lo sei guadagnato.",
      },
      faq: [
        [
          "Che cos’è il punteggio Wilks?",
          "Un numero che confronta i totali di powerlifting tra pesi corporei diversi. Il tuo totale viene moltiplicato per un coefficiente di una formula pubblicata da Robert Wilks, così un atleta leggero e uno pesante si possono classificare insieme. È stato lo standard per decenni e molti lo citano ancora.",
        ],
        [
          "Cosa sono i punti IPF GL?",
          "La formula della Federazione internazionale di powerlifting dal 2020, a volte chiamata punti Goodlift. Ha versioni separate per classico (senza attrezzatura) ed equipaggiato, e per la sola panca. Circa 100 punti sono un totale di livello mondiale.",
        ],
        [
          "Quale punteggio usare?",
          "Se gareggi, quello della tua federazione. Per seguire i tuoi progressi, DOTS e IPF GL sono le formule più recenti, tarate su risultati di gara recenti. Confronta un punteggio solo con la stessa formula.",
        ],
        [
          "Qual è un buon punteggio Wilks?",
          "A grandi linee, circa 300 è un totale intermedio solido, 400 avanzato e 450 o più élite per gli uomini; i punteggi delle donne sono sulla stessa scala. Sono riferimenti indicativi, non livelli ufficiali.",
        ],
      ],
      more: {
        heading: "Come si calcolano i punteggi",
        paragraphs: [
          "Wilks divide 500 per un polinomio di quinto grado del peso corporeo in chili, con coefficienti diversi per uomini e donne, e moltiplica il tuo totale per il risultato. IPF GL divide 100 per A − B·e^(−C·peso corporeo), con gli A, B e C pubblicati dall’IPF per ogni sesso, attrezzatura e gara. DOTS usa un polinomio di quarto grado. Le libbre vengono prima convertite in chili. I coefficienti sono verificati con un progetto aperto di risultati di powerlifting.",
        ],
      },
      reading: [
        { href: "/it/tools/dots-calculator/", label: "il calcolatore DOTS" },
        { href: "/it/tools/one-rep-max-calculator/", label: "il calcolatore di 1RM" },
        { href: "/blog/how-to-increase-your-squat/", label: "come migliorare lo squat" },
      ],
    },
    ui: {
      units: "Unità",
      formula: "Formula",
      men: "Formula maschile",
      women: "Formula femminile",
      gear: "Attrezzatura",
      classic: "Classico (senza attrezzatura)",
      equipped: "Equipaggiato",
      bw: "Peso corporeo ({unit})",
      squat: "Squat",
      bench: "Panca piana",
      deadlift: "Stacco da terra",
      liftLabel: "{lift} ({unit})",
      total: "Totale {total} {unit}",
      level: "Livello DOTS: {level}.",
      next: "Aggiungi circa {weight} {unit} al tuo totale per arrivare a {level} (DOTS {score}).",
      elite: "È un totale da élite.",
      note: "Wilks e DOTS non cambiano con l’attrezzatura. IPF GL ha formule separate per classico ed equipaggiato, quindi scegli quella in cui sollevi.",
      levels: { beginner: "Principiante", novice: "Novizio", intermediate: "Intermedio", advanced: "Avanzato", elite: "Élite" },
    },
  },
  "dots-calculator": {
    page: {
      title: "Calcolatore DOTS: il punteggio del tuo totale di powerlifting",
      description:
        "Calcola il tuo punteggio DOTS da squat, panca piana, stacco da terra e peso corporeo, in kg o lb, per confrontare atleti di ogni taglia.",
      name: "Calcolatore DOTS",
      intro:
        "Il tuo totale di squat, panca e stacco valutato in base al peso, così un atleta leggero e uno pesante vedono chi è più forte per la sua taglia.",
      sticky: "Il tuo DOTS, sempre aggiornato",
      mid: {
        title: "Il tuo DOTS, da ogni serie",
        body: "{app} stima il tuo miglior squat, panca e stacco dalle serie che registri e tiene aggiornato il tuo DOTS, senza giornate di massimali.",
        button: "Inizia gratis",
      },
      end: {
        title: "Costruisci un totale più grande",
        body: "{app} pianifica l’allenamento a blocchi con obiettivi di ripetizioni in riserva e scarichi, e fa salire ogni alzata quando te lo sei guadagnato.",
      },
      faq: [
        [
          "Che cos’è il punteggio DOTS?",
          "Un modo per confrontare i totali di powerlifting tra pesi corporei. Il tuo totale viene moltiplicato per un coefficiente che dipende dal tuo peso, così un atleta di 60 kg e uno di 110 kg stanno sulla stessa scala. Molte federazioni lo usano.",
        ],
        [
          "Qual è un buon punteggio DOTS?",
          "A grandi linee: 200 è un totale da novizio, 300 intermedio, 400 avanzato e 500 o più élite. Sono i livelli d’uso comune, non una scala ufficiale.",
        ],
        [
          "DOTS o Wilks?",
          "DOTS è stato pubblicato nel 2019 come sostituto più equo della vecchia formula di Wilks, con un insieme più ampio di risultati di gara recenti. I punteggi non sono intercambiabili, quindi confronta DOTS con DOTS.",
        ],
        [
          "Posso usare massimali stimati invece di un totale di gara?",
          "Per seguire i tuoi progressi, sì. Le classifiche ufficiali usano alzate fatte in gara, con le regole della federazione.",
        ],
      ],
      more: {
        heading: "Come si calcola DOTS",
        paragraphs: [
          "DOTS divide 500 per un polinomio di quarto grado del tuo peso corporeo in chili, con coefficienti diversi per uomini e donne, e moltiplica il tuo totale per il risultato. Il peso corporeo è limitato a 40-210 kg per gli uomini e 40-150 kg per le donne. I coefficienti sono quelli pubblicati, verificati con un progetto aperto di risultati di powerlifting. Le libbre vengono prima convertite in chili.",
        ],
      },
      reading: [
        { href: "/it/tools/one-rep-max-calculator/", label: "il calcolatore di 1RM" },
        { href: "/blog/how-to-increase-your-squat/", label: "come migliorare lo squat" },
        { href: "/blog/how-to-increase-your-deadlift/", label: "come migliorare lo stacco" },
      ],
    },
    ui: {
      unitsSex: "Unità e sesso",
      men: "Formula maschile",
      women: "Formula femminile",
      bw: "Peso corporeo ({unit})",
      squat: "Squat",
      bench: "Panca piana",
      deadlift: "Stacco da terra",
      liftLabel: "{lift} ({unit})",
      total: "Totale {total} {unit}",
      note: "Circa 200 è un totale da novizio, 300 intermedio, 400 avanzato e 500 o più élite. Sono livelli indicativi, non una scala ufficiale.",
      levels: { beginner: "Principiante", novice: "Novizio", intermediate: "Intermedio", advanced: "Avanzato", elite: "Élite" },
    },
  },
};
