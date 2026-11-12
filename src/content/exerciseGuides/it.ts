import type { ExerciseGuide } from "../exerciseGuides";

// Le guide agli esercizi in italiano (tu). Stesso ordine e stesse parti delle guide inglesi (lower.ts, upper.ts).
export const IT_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "Lo squat con bilanciere dietro è il classico esercizio di forza per la parte inferiore del corpo. Allena a fondo quadricipiti, glutei e adduttori, permette di caricare molto peso e di progredire per anni, e nel frattempo costruisce un tronco forte.",
    mistakes: [
      [
        "Ginocchia che cedono verso l’interno in salita",
        "Spingi le ginocchia in fuori, sopra le punte dei piedi, per tutta la ripetizione, e alleggerisci il bilanciere finché non ci riesci.",
      ],
      [
        "Scendere meno quando il peso sale",
        "Scendi alla stessa profondità a ogni ripetizione, almeno con la piega dell’anca all’altezza del ginocchio se le anche lo permettono.",
      ],
      [
        "Perdere la tenuta in basso",
        "Prendi un bel respiro nella pancia prima di ogni ripetizione e trattienilo finché non hai superato il punto più duro.",
      ],
      [
        "Talloni che si sollevano",
        "Tieni il peso sul centro del piede. Scarpe con il tacco rialzato o una posizione un po’ più larga aiutano.",
      ],
    ],
    sets: [
      "**Forza:** da 3 a 5 serie da 3 a 6, con 3-5 minuti di recupero.",
      "**Muscoli:** da 3 a 4 serie da 6 a 10, con 2-3 minuti di recupero.",
      "**Se sei alle prime armi:** 3 serie da 8 con un peso che potresti sollevare 10-12 volte, aggiungendo un po’ a ogni allenamento.",
    ],
    variations: [
      ["front-squat", "Più dritto, più quadricipiti, più delicato per la zona lombare."],
      ["box-squat", "Insegna a sedersi indietro e a raggiungere la stessa profondità a ogni ripetizione."],
      ["pause-squat", "Costruisce forza in uscita dal basso, dove quasi tutti si bloccano."],
      ["goblet-squat", "Il modo migliore per imparare il movimento prima di caricare un bilanciere."],
    ],
    faq: [
      [
        "Quanto devo scendere?",
        "Il più in basso possibile mantenendo la posizione della schiena e i talloni a terra. Per la maggior parte delle persone è al parallelo o appena sotto.",
      ],
      [
        "Bilanciere alto o basso?",
        "Con il bilanciere alto la barra sta sopra le spalle e resti più dritto; con quello basso sta più in basso e sollevi un po’ di più. Funzionano entrambi.",
      ],
      [
        "Mi serve una cintura?",
        "Non per iniziare. Impara prima a creare tenuta senza; più avanti una cintura può aiutare nelle serie pesanti. Vedi [lifting belt](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "Nel front squat il bilanciere sta sulla parte anteriore delle spalle, così il busto resta dritto e i quadricipiti lavorano di più. È più delicato per la zona lombare rispetto allo squat dietro e insegna molto bene la postura giusta.",
    mistakes: [
      [
        "Gomiti che scendono",
        "Spingi i gomiti in alto e in avanti per tutta la ripetizione. Se il bilanciere rotola, i gomiti sono scesi per primi.",
      ],
      [
        "Tenere il bilanciere con le mani",
        "Il bilanciere poggia sulle spalle; le dita lo tengono solo in posizione. Usa la presa incrociata o le fasce se i polsi sono rigidi.",
      ],
      [
        "Parte alta della schiena che si incurva",
        "Tieni il petto alto e crea molta tenuta. Meno peso con il petto alto è meglio di più peso piegandosi in avanti.",
      ],
    ],
    sets: ["**Forza:** da 3 a 5 serie da 3 a 5.", "**Muscoli:** 3 serie da 6 a 10."],
    variations: [
      ["goblet-squat", "La stessa posizione dritta con un manubrio, più facile da imparare."],
      ["back-squat", "Permette di sollevare più peso in generale."],
      ["db-front-squat", "Niente rack e nessuno stiramento ai polsi."],
    ],
    faq: [
      [
        "Il front squat è meglio dello squat dietro?",
        "Nessuno dei due è meglio. Il front squat punta sui quadricipiti ed è più gentile con la schiena; lo squat dietro permette di sollevare di più.",
      ],
      [
        "Perché il front squat mi fa male ai polsi?",
        "Polsi e dorsali rigidi. Tieni solo due o tre dita sotto il bilanciere, oppure usa la presa incrociata.",
      ],
    ],
  },
  "goblet-squat": {
    intro:
      "Nel goblet squat tieni un manubrio o un kettlebell davanti al petto. Il peso davanti rende facile restare dritto e scendere in profondità, quindi è il modo migliore per imparare lo squat e un ottimo esercizio per le gambe a casa.",
    mistakes: [
      ["Lasciare che il peso ti tiri in avanti", "Tieni il peso contro il petto, con i gomiti stretti sotto di esso."],
      ["Scendere troppo poco", "Siediti tra i talloni, cercando di sfiorare le ginocchia con i gomiti in basso."],
      ["Ripetizioni troppo veloci", "Scendi in due o tre secondi. Un peso leggero diventa molto più duro."],
    ],
    sets: ["**Muscoli:** 3 serie da 8 a 15.", "**A casa con pesi leggeri:** 3 serie da 15 a 20, con una discesa lenta."],
    variations: [
      ["kb-goblet-squat", "Lo stesso movimento con un kettlebell tenuto per le corna."],
      ["db-goblet-squat-heels", "Talloni rialzati per più quadricipiti e uno squat più profondo."],
      ["back-squat", "Il passo successivo quando i manubri non bastano più."],
    ],
    faq: [
      [
        "Il goblet squat serve a costruire le gambe?",
        "Sì, finché il manubrio più pesante che hai non diventa facile. Poi rallenta le ripetizioni, fai una pausa in basso o passa allo squat con bilanciere.",
      ],
      ["Manubrio o kettlebell?", "Va bene tutto. Tieni il manubrio in verticale da un’estremità, o il kettlebell per le corna."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "Nello split squat bulgaro il piede dietro poggia su una panca, così la gamba davanti fa quasi tutto il lavoro. Costruisce quadricipiti e glutei una gamba alla volta con una frazione del carico di uno squat, ed è quindi gentile con la zona lombare.",
    mistakes: [
      [
        "Piede davanti troppo vicino alla panca",
        "Fai un passo abbastanza lungo perché lo stinco davanti resti quasi verticale e il ginocchio possa piegarsi liberamente in basso.",
      ],
      [
        "Spingere con il piede dietro",
        "Il piede dietro serve solo per l’equilibrio. Tieni la maggior parte del peso su tallone e centro del piede davanti.",
      ],
      ["Perdere l’equilibrio", "Reggiti con una mano a qualcosa, o usa una panca più bassa, finché non sei stabile."],
    ],
    sets: [
      "**Muscoli:** 3 serie da 8 a 12 per gamba, iniziando dal lato più debole.",
      "**A casa:** 3 serie da 12 a 20 per gamba a corpo libero o con manubri leggeri.",
    ],
    variations: [
      ["split-squat", "Entrambi i piedi a terra: più facile da bilanciare."],
      ["front-foot-elevated-split-squat", "Un allungamento più profondo per la gamba davanti."],
      ["barbell-bulgarian-split-squat", "Più carico quando i manubri diventano scomodi da tenere."],
    ],
    faq: [
      [
        "Quadricipiti o glutei?",
        "Entrambi. Un busto più dritto e una posizione più corta puntano sui quadricipiti; inclinarsi in avanti con una posizione più lunga fa lavorare di più i glutei.",
      ],
      [
        "Perché è così duro?",
        "Una gamba fa il lavoro di due, e in più c’è l’equilibrio. Inizia leggero; ti stupirai di quanto in fretta sale il peso.",
      ],
    ],
  },
  "leg-press": {
    intro:
      "La leg press allena quadricipiti e glutei senza caricare la colonna e senza bisogno di equilibrio, così puoi spingere le gambe forte e in sicurezza, anche quando schiena o tecnica limiterebbero uno squat.",
    mistakes: [
      ["Zona lombare che si stacca dallo schienale", "Scendi solo finché anche e zona lombare restano sul sedile."],
      ["Bloccare forte le ginocchia in alto", "Fermati appena prima di bloccare, poi passa subito alla ripetizione successiva."],
      [
        "Accorciare il movimento per usare più peso",
        "Un movimento completo e controllato con meno peso costruisce più muscolo di mezze ripetizioni con tutto il pacco pesi.",
      ],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 8 a 15.", "**Per finire:** 1-2 serie da 15 a 25 dopo lo squat."],
    variations: [
      ["narrow-leg-press", "Piedi più bassi e più vicini: più quadricipiti."],
      ["wide-leg-press", "Piedi più alti e più larghi: più glutei e adduttori."],
      ["single-leg-press", "Una gamba alla volta per pareggiare le differenze."],
    ],
    faq: [
      [
        "La leg press vale quanto lo squat?",
        "Per costruire muscolo alle gambe ci si avvicina. Lo squat allena anche equilibrio e tronco; la leg press ti fa spingere di più le gambe con meno fatica.",
      ],
      [
        "Dove metto i piedi?",
        "A metà pedana, circa alla larghezza delle spalle, è una buona base. Più in alto per i glutei, più in basso per i quadricipiti.",
      ],
    ],
  },
  "hack-squat": {
    intro:
      "La macchina hack squat ti guida nello squat su una slitta, con la schiena appoggiata. È uno dei migliori esercizi per i quadricipiti perché puoi scendere in profondità e spingere forte senza bilanciare un bilanciere.",
    mistakes: [
      [
        "Piedi troppo alti sulla pedana",
        "Metti i piedi al centro o un po’ più in basso per far lavorare di più i quadricipiti, con i talloni piatti.",
      ],
      ["Rimbalzare in basso", "Controlla la discesa e fai una breve pausa prima di spingere su."],
      ["Ripetizioni parziali", "Scendi quanto le anche permettono senza che la zona lombare si stacchi dallo schienale."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 6 a 12.", "**Forza:** 3 serie da 5 a 8, dopo lo squat principale."],
    variations: [
      ["pendulum-squat", "Una macchina simile con un arco più profondo."],
      ["leg-press", "Nessun carico sulle spalle."],
      ["back-squat", "Peso libero, allena equilibrio e tronco."],
    ],
    faq: [
      [
        "L’hack squat fa male alle ginocchia?",
        "No. È normale che le ginocchia vadano in avanti oltre le punte. Aumenta il peso gradualmente e resta senza dolore.",
      ],
      [
        "Hack squat o leg press?",
        "L’hack squat di solito colpisce un po’ di più i quadricipiti; la leg press è più gentile con spalle e schiena. Sono buoni entrambi.",
      ],
    ],
  },
  deadlift: {
    intro:
      "Lo stacco da terra solleva un bilanciere carico dal pavimento. Allena tutta la parte posteriore del corpo, glutei, femorali, schiena e presa, ed è di solito l’esercizio in cui si gestisce più peso.",
    mistakes: [
      [
        "Bilanciere che si allontana dalle gambe",
        "Tieni il bilanciere a contatto con stinchi e cosce per tutta la salita. Parti con la barra sopra il centro del piede.",
      ],
      ["Zona lombare che si incurva", "Crea molta tenuta prima di tirare, e abbassa il peso se la schiena non tiene la posizione."],
      [
        "Strappare il bilanciere da terra",
        "Prima togli il gioco: mettiti in tensione finché il bilanciere non fa clic contro i dischi, poi spingi via il pavimento.",
      ],
      ["Inclinarsi molto indietro in alto", "Finisci in piedi, dritto, con i glutei contratti. Non serve inclinarsi indietro."],
    ],
    sets: [
      "**Forza:** da 2 a 4 serie da 2 a 5, con 3-5 minuti di recupero.",
      "**Muscoli:** 3 serie da 5 a 8. Lo stacco stanca molto, quindi la maggior parte delle persone lo fa una volta a settimana.",
    ],
    variations: [
      ["trap-bar-deadlift", "Più facile da imparare, più dritto, più gentile con la schiena."],
      ["sumo-deadlift", "Una posizione larga che si adatta meglio ad alcune corporature."],
      ["romanian-deadlift", "Parte dall’alto e carica di più i femorali."],
      ["paused-deadlift", "Costruisce controllo appena sopra il pavimento."],
    ],
    faq: [
      [
        "Quanto spesso devo fare lo stacco?",
        "Una volta a settimana basta alla maggior parte delle persone, con un piegamento d’anca più leggero, come lo stacco rumeno, in un altro giorno.",
      ],
      [
        "Posso lasciar cadere il bilanciere in alto?",
        "Riportalo giù con controllo. Lasciarlo cadere dall’alto rovina dischi e pavimento, e salta metà della ripetizione.",
      ],
      [
        "Devo usare le fasce?",
        "Nelle serie più pesanti, se cede prima la presa. Allena la presa nelle serie di riscaldamento. Vedi [grip strength](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "Lo stacco sumo usa una posizione larga con le mani all’interno delle ginocchia. Accorcia il percorso del bilanciere e ti fa restare più dritto, spostando più lavoro su anche, quadricipiti e adduttori.",
    mistakes: [
      ["Posizione troppo larga", "Allargati solo finché gli stinchi restano quasi verticali e le ginocchia seguono le punte dei piedi."],
      ["Anche che salgono per prime", "Spingi le ginocchia in fuori e il pavimento in là, così anche e petto salgono insieme."],
      ["Partire con le braccia molli", "Togli il gioco al bilanciere prima che si stacchi da terra."],
    ],
    sets: ["**Forza:** da 3 a 5 serie da 2 a 5.", "**Muscoli:** 3 serie da 5 a 8."],
    variations: [
      ["deadlift", "La posizione classica, più femorali e schiena."],
      ["kb-sumo-deadlift", "Un modo leggero per imparare la posizione."],
      ["trap-bar-deadlift", "Dritto come il sumo, più semplice da preparare."],
    ],
    faq: [
      [
        "Il sumo è barare?",
        "No. È uno stile riconosciuto nel powerlifting. Scegli la posizione che si adatta al tuo corpo e con cui sollevi bene.",
      ],
      ["Sumo o classico?", "Prova entrambi per qualche settimana. Chi ha gambe più lunghe e braccia più corte spesso preferisce il sumo."],
    ],
  },
  "romanian-deadlift": {
    intro:
      "Lo stacco rumeno parte in piedi e abbassa il bilanciere spingendo le anche indietro con le gambe quasi tese. È uno dei migliori esercizi per femorali e glutei perché li carica in un lungo allungamento.",
    mistakes: [
      [
        "Piegare troppo le ginocchia",
        "Tieni una leggera flessione che non cambia. Se le ginocchia si piegano di più scendendo, diventa uno squat.",
      ],
      ["Scendere troppo", "Scendi solo finché le anche vanno indietro e la schiena resta piatta, di solito a metà stinco."],
      ["Bilanciere lontano dalle gambe", "Fallo scivolare lungo le cosce. Più resta vicino, più è gentile con la zona lombare."],
    ],
    sets: ["**Muscoli:** 3 serie da 6 a 12, con una discesa lenta.", "**Dopo lo stacco:** 2-3 serie da 8 a 10, più leggere."],
    variations: [
      ["db-rdl", "Con i manubri, ottimo a casa."],
      ["single-leg-rdl", "Una gamba: equilibrio e meno peso necessario."],
      ["stiff-leg-deadlift", "Parte da terra a ogni ripetizione."],
    ],
    faq: [
      [
        "Stacco rumeno o stacco da terra?",
        "Il rumeno parte dall’alto e carica di più i femorali; lo stacco da terra parte dal pavimento e permette di sollevare di più.",
      ],
      [
        "Dove dovrei sentirlo?",
        "Dietro le cosce e nei glutei. Se lo senti soprattutto nella zona lombare, alleggerisci e spingi le anche più indietro.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "Nello stacco con trap bar stai dentro una barra esagonale con le maniglie ai lati. Puoi restare più dritto, il che toglie stress alla zona lombare e lo rende lo stacco più facile da imparare e da caricare pesante.",
    mistakes: [
      [
        "Trasformarlo in uno squat",
        "Resta un piegamento d’anca. Spingi le anche indietro per arrivare alle maniglie, poi spingi via il pavimento.",
      ],
      ["Non centrato nella barra", "Mettiti in modo che le maniglie siano allineate con il centro del piede."],
      ["Perdere tensione in basso", "Riparti da fermo tra una ripetizione e l’altra o tocca leggermente; non far rimbalzare i dischi."],
    ],
    sets: ["**Forza:** da 3 a 5 serie da 3 a 5.", "**Muscoli o sport:** 3 serie da 5 a 8."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Maniglie alte: un percorso più corto per principianti o persone alte."],
      ["deadlift", "La barra dritta, più schiena e femorali."],
      ["trap-bar-rdl", "Una versione che punta sui femorali."],
    ],
    faq: [
      [
        "Lo stacco con trap bar è più facile?",
        "La maggior parte delle persone lo impara più facilmente e ci solleva un po’ di più, perché si resta più dritti.",
      ],
      [
        "Lavora gli stessi muscoli?",
        "Quasi. Usa un po’ più quadricipiti e un po’ meno zona lombare rispetto allo stacco con barra dritta.",
      ],
    ],
  },
  "hip-thrust": {
    intro:
      "Nell’hip thrust appoggi la parte alta della schiena su una panca e spingi su un bilanciere carico con le anche. Mette più carico sui glutei a anca completamente estesa di quasi qualsiasi altro esercizio.",
    mistakes: [
      ["Inarcare la zona lombare in alto", "Abbassa il mento e tieni giù le costole; finisci contraendo i glutei, non inarcandoti."],
      [
        "Piedi nel posto sbagliato",
        "In alto gli stinchi devono essere circa verticali. Troppo vicini e lavorano i quadricipiti; troppo lontani e lavorano i femorali.",
      ],
      ["Andare di fretta in alto", "Tieni la posizione alta per un secondo a ogni ripetizione."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 8 a 12.", "**Forza:** 3 serie da 5 a 8 con una pausa in alto."],
    variations: [
      ["glute-bridge", "Da terra: più facile da preparare, percorso più corto."],
      ["db-hip-thrust", "Un manubrio sulle anche, ottimo a casa."],
      ["single-leg-hip-thrust", "Una gamba alla volta, senza carico."],
    ],
    faq: [
      ["Mi serve un cuscinetto?", "Un paracolpi per bilanciere o un tappetino piegato rendono le serie pesanti molto più comode."],
      [
        "Hip thrust o squat per i glutei?",
        "Entrambi. Lo squat lavora i glutei in un allungamento profondo; l’hip thrust li lavora di più in alto. Vedi [glute workout](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "Il ponte per i glutei solleva le anche da terra con la schiena distesa sul pavimento. È un esercizio semplice per i glutei da fare ovunque, e un buon modo per imparare a usarli prima dell’hip thrust.",
    mistakes: [
      ["Spingere sulle punte", "Spingi sui talloni per tenere il lavoro sui glutei."],
      ["Inarcare la schiena per salire di più", "Fermati quando anche e cosce formano una linea retta. Lì contrai i glutei."],
      ["Correre nelle ripetizioni", "Fai una pausa di uno o due secondi in alto."],
    ],
    sets: [
      "**A casa:** 3 serie da 15 a 25, con una pausa in alto.",
      "**Con carico:** 3 serie da 10 a 15 con un manubrio o un bilanciere sulle anche.",
    ],
    variations: [
      ["single-leg-glute-bridge", "Il doppio del lavoro per ogni lato."],
      ["hip-thrust", "Schiena su una panca per un percorso più lungo e carichi più pesanti."],
      ["marching-glute-bridge", "Aggiunge stabilità a core e anche."],
    ],
    faq: [
      ["Ponte o hip thrust?", "Il ponte è più facile e non serve nulla; l’hip thrust ha un percorso più lungo e regge più peso."],
      ["Perché lo sento nei femorali?", "Avvicina un po’ i piedi alle anche e spingi sui talloni."],
    ],
  },
  "walking-lunge": {
    intro:
      "Gli affondi camminati sono un affondo in avanti dopo l’altro. Allenano quadricipiti e glutei una gamba alla volta, mettono alla prova l’equilibrio e alzano il battito.",
    mistakes: [
      ["Passi troppo corti", "Fai un passo abbastanza lungo perché entrambe le ginocchia arrivino a circa 90 gradi in basso."],
      ["Ginocchio davanti che cede verso l’interno", "Tieni il ginocchio davanti in linea con le punte dei piedi."],
      ["Sbattere il ginocchio dietro", "Scendi con controllo finché il ginocchio dietro quasi tocca terra."],
    ],
    sets: [
      "**Muscoli:** 3 serie da 10 a 12 passi per gamba.",
      "**Condizionamento:** 2-3 serie da 20 a 30 passi in totale, con recuperi brevi.",
    ],
    variations: [
      ["reverse-lunge", "Il passo indietro è più gentile con ginocchia ed equilibrio."],
      ["barbell-walking-lunge", "Più carico quando i manubri diventano pesanti da tenere."],
      ["bulgarian-split-squat", "Resta sul posto e isola di più ogni gamba."],
    ],
    faq: [
      [
        "Affondi camminati o affondi indietro?",
        "Gli affondi indietro sono più facili da controllare e più gentili con le ginocchia; quelli camminati aggiungono equilibrio e condizionamento.",
      ],
      ["Quanto spazio mi serve?", "Circa 10 metri per serie. Se non hai spazio, giri su te stesso o passi agli affondi indietro."],
    ],
  },
  "reverse-lunge": {
    intro:
      "L’affondo indietro fa un passo all’indietro verso l’affondo. Andando indietro il peso resta sul piede davanti, il che rende l’equilibrio più facile ed è più gentile con le ginocchia rispetto all’affondo in avanti.",
    mistakes: [
      ["Passo troppo stretto", "Fai il passo indietro come su dei binari, non su una fune, per restare in equilibrio."],
      ["Spingere con il piede dietro", "Spingi su con il tallone davanti; la gamba dietro aiuta solo l’equilibrio."],
      ["Inclinarsi molto in avanti", "Resta abbastanza dritto, con una leggera inclinazione in avanti per più glutei."],
    ],
    sets: ["**A corpo libero:** 3 serie da 12 a 20 per gamba.", "**Con carico:** 3 serie da 8 a 12 per gamba con i manubri."],
    variations: [
      ["db-reverse-lunge", "Manubri per più carico."],
      ["deficit-reverse-lunge", "Piede davanti su un gradino per un percorso più profondo."],
      ["walking-lunge", "Aggiunge equilibrio e condizionamento."],
    ],
    faq: [
      [
        "Gli affondi indietro vanno bene con le ginocchia delicate?",
        "Di solito sono l’affondo più comodo per ginocchia sensibili. Resta in un movimento senza dolore.",
      ],
      ["Alternare le gambe o fare un lato alla volta?", "Va bene tutto. Un lato alla volta è più duro e mantiene le ripetizioni uguali."],
    ],
  },
  "leg-extension": {
    intro:
      "La leg extension distende il ginocchio contro una resistenza. Isola i quadricipiti, compresa la parte che lo squat allena poco, ed è facile da spingere vicino al cedimento in sicurezza.",
    mistakes: [
      [
        "Ginocchio non allineato con il perno",
        "Regola il sedile in modo che l’articolazione del ginocchio sia allineata con l’asse della macchina.",
      ],
      ["Lanciare il peso su", "Solleva con controllo e fai una breve pausa in alto."],
      ["Sollevare le anche dal sedile", "Tieni le maniglie e le anche giù."],
    ],
    sets: ["**Muscoli:** 2-3 serie da 10 a 15, dopo squat o leg press.", "**Per finire:** 1 serie da 15 a 20 vicino al cedimento."],
    variations: [
      ["single-leg-extension", "Una gamba alla volta per pareggiare le differenze."],
      ["sissy-squat", "Isolamento dei quadricipiti a corpo libero."],
      ["leg-press", "Un esercizio multiarticolare per i quadricipiti."],
    ],
    faq: [
      [
        "La leg extension fa male alle ginocchia?",
        "Non con un peso ragionevole. Si usa spesso nella riabilitazione del ginocchio. Fermati se senti dolore all’articolazione.",
      ],
      [
        "Mi serve la leg extension se faccio squat?",
        "Non per forza, ma aggiunge lavoro ai quadricipiti senza molta fatica e allena il retto femorale, che lo squat allunga poco.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "Il leg curl sdraiato piega le ginocchia contro un cuscinetto mentre sei a pancia in giù. Isola i femorali, che i piegamenti d’anca come lo stacco allenano soprattutto all’anca.",
    mistakes: [
      ["Anche che si sollevano dalla panca", "Premi le anche sul cuscinetto e tienile lì."],
      ["Usare lo slancio", "Piega in modo fluido e scendi lentamente, due o tre secondi."],
      ["Movimento corto", "Scendi finché le gambe sono quasi tese prima della ripetizione successiva."],
    ],
    sets: ["**Muscoli:** 3 serie da 8 a 15."],
    variations: [
      ["seated-leg-curl", "Anche piegate, così i femorali lavorano da un allungamento più lungo."],
      ["nordic-curl", "A corpo libero e molto duro; ottimo per i velocisti."],
      ["slider-leg-curl", "A casa con un asciugamano o dei dischi scorrevoli."],
    ],
    faq: [
      [
        "Leg curl sdraiato o seduto?",
        "Quello seduto allunga di più i femorali e forse costruisce un po’ più di muscolo. Usa quello che ha la tua palestra.",
      ],
      [
        "Mi serve il leg curl se faccio lo stacco?",
        "Allena la flessione del ginocchio dei femorali, che lo stacco non fa. Un esercizio di curl a settimana aiuta.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "Il leg curl seduto piega le ginocchia contro un cuscinetto mentre sei seduto. Da seduto i femorali sono in un lungo allungamento, e questo lo rende uno dei migliori esercizi per far crescere i femorali.",
    mistakes: [
      ["Cuscinetto delle cosce troppo lento", "Blocca bene il cuscinetto sulle cosce così le gambe non si sollevano."],
      ["Inclinarsi indietro per barare", "Siediti dritto o leggermente in avanti per mantenere l’allungamento."],
      ["Scendere di fretta", "Controlla la discesa per due o tre secondi."],
    ],
    sets: ["**Muscoli:** 3 serie da 8 a 15."],
    variations: [
      ["lying-leg-curl", "Anche distese, se la macchina seduta è occupata."],
      ["single-leg-curl", "Una gamba alla volta."],
      ["romanian-deadlift", "Allena i femorali all’anca invece che al ginocchio."],
    ],
    faq: [
      [
        "Il leg curl seduto è meglio di quello sdraiato?",
        "Lavora i femorali da un allungamento più lungo, il che forse costruisce un po’ più di muscolo. Sono buoni entrambi.",
      ],
      [
        "Quanto pesante deve essere il leg curl?",
        "Abbastanza perché le ultime ripetizioni di ogni serie siano dure, mentre controlli ancora la discesa.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "Il calf raise in piedi sale sulle punte contro una resistenza, con le ginocchia tese. Allena al meglio il muscolo più grande del polpaccio, il gastrocnemio.",
    mistakes: [
      ["Rimbalzare in basso", "Fai una pausa di un secondo nell’allungamento in basso a ogni ripetizione."],
      ["Mezze ripetizioni", "Vai da un allungamento profondo il più in alto possibile sulle punte."],
      ["Piegare le ginocchia", "Tieni le ginocchia tese ma non bloccate, così sollevano i polpacci."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 8 a 15, lente, due o tre volte a settimana."],
    variations: [
      ["seated-calf-raise", "Ginocchia piegate, per il soleo sotto."],
      ["single-leg-calf-raise", "A casa su un gradino, una gamba alla volta."],
      ["calf-press", "Sulla leg press."],
    ],
    faq: [
      [
        "Perché i miei polpacci non crescono?",
        "Quasi tutti rimbalzano con ripetizioni corte. Usa tutto il movimento con una pausa nell’allungamento e allenali più spesso. Vedi [calf workout](/blog/calf-workout/).",
      ],
      ["Calf raise in piedi o seduto?", "Entrambi. In piedi lavora di più il gastrocnemio; seduto il soleo."],
    ],
  },
  plank: {
    intro:
      "Il plank tiene il corpo in linea retta su avambracci e punte dei piedi. Allena addominali e tronco a resistere alla flessione, e questo aiuta a creare tenuta sotto un bilanciere pesante.",
    mistakes: [
      ["Anche che cedono", "Contrai i glutei e porta le costole verso le anche."],
      ["Anche troppo alte", "Abbassale finché il corpo non è una linea retta dalla testa ai talloni."],
      ["Tenere per minuti", "Quando riesci a tenere 60 secondi, rendilo più difficile invece che più lungo."],
    ],
    sets: ["**Core:** 2-3 tenute da 20 a 60 secondi, due o tre volte a settimana."],
    variations: [
      ["side-plank", "Allena gli obliqui e i lati delle anche."],
      ["long-lever-plank", "Gomiti più avanti: molto più duro."],
      ["ab-wheel", "Una versione in movimento quando il plank diventa facile."],
    ],
    faq: [
      ["Quanto devo tenere il plank?", "Da 20 a 60 secondi con una forma perfetta. Oltre, una versione più difficile rende di più."],
      [
        "Il plank brucia il grasso sulla pancia?",
        "Nessun esercizio brucia il grasso in un punto preciso. Vedi [how to lose belly fat](/blog/how-to-lose-belly-fat/).",
      ],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "L’alzata delle gambe alla sbarra si fa appesi a una sbarra sollevando le gambe. È uno degli esercizi per addominali più duri e allena la parte bassa degli addominali, i flessori dell’anca e la presa.",
    mistakes: [
      ["Dondolare", "Parti da fermo e scendi lentamente. Fai una pausa in basso se inizi a dondolare."],
      ["Sollevare solo le gambe", "In alto arrotola il bacino verso l’alto così lavorano gli addominali, non solo i flessori dell’anca."],
      ["La presa cede per prima", "Usa le fasce per addominali, o allena la presa a parte."],
    ],
    sets: ["**Core:** 3 serie da 6 a 15."],
    variations: [
      ["hanging-knee-raise", "Ginocchia piegate: il primo passo più facile."],
      ["parallel-bar-knee-raise", "Sulle parallele, senza bisogno di presa."],
      ["lying-leg-raise", "A terra, ancora più facile."],
    ],
    faq: [
      ["Come smetto di dondolare?", "Scendi lentamente, fai una pausa in basso e tieni le spalle attive."],
      ["Troppo difficile?", "Inizia con le alzate delle ginocchia alla sbarra e passa alle gambe tese quando riesci a fare 3 serie da 12."],
    ],
  },
  "ab-wheel": {
    intro:
      "La ruota per addominali si spinge in avanti e si riporta indietro. È uno degli esercizi per addominali più impegnativi e li allena a impedire che la schiena si inarchi mentre le braccia vanno sopra la testa.",
    mistakes: [
      ["Zona lombare che cede", "Spingi solo fin dove la schiena non si inarca. Retroverti il bacino e contrai i glutei."],
      ["Le anche guidano il ritorno", "Torna indietro con addominali e braccia insieme, non alzando le anche."],
      [
        "Andare troppo lontano troppo presto",
        "Spingi prima fino a un muro o per un breve tratto, poi vai un po’ più lontano ogni settimana.",
      ],
    ],
    sets: ["**Core:** 3 serie da 5 a 12 in ginocchio, poi in piedi quando sei forte."],
    variations: [
      ["plank", "La versione statica per arrivarci."],
      ["plank-reach", "Un modo più gentile per allenare la stessa abilità."],
      ["dead-bug", "Sulla schiena, per imparare a tenere giù la zona lombare."],
    ],
    faq: [
      [
        "La ruota per addominali fa male alla schiena?",
        "No, se resti nel tratto in cui la schiena non si inarca. Accorcia il movimento se la senti nella zona lombare.",
      ],
      ["In ginocchio o in piedi?", "In ginocchio per la maggior parte delle persone. In piedi è un obiettivo avanzato."],
    ],
  },
  "kb-swing": {
    intro:
      "Lo swing con kettlebell porta le anche in avanti con uno scatto per far oscillare il kettlebell all’altezza del petto. Allena glutei e femorali in modo esplosivo e fa anche da condizionamento.",
    mistakes: [
      ["Fare lo swing accosciandosi", "È un piegamento d’anca: spingi le anche indietro, con le ginocchia solo un po’ piegate."],
      ["Sollevare con le braccia", "Sono le anche a mandare su il kettlebell; le braccia lo tengono soltanto."],
      ["Inclinarsi indietro in alto", "Finisci in piedi, dritto, con glutei e addominali contratti, come in un plank."],
    ],
    sets: [
      "**Potenza:** da 5 a 10 serie da 10, con il recupero che ti serve.",
      "**Condizionamento:** da 10 a 20 swing all’inizio di ogni minuto per 10 minuti.",
    ],
    variations: [
      ["kb-single-swing", "Una mano: aggiunge una torsione a cui il tronco deve resistere."],
      ["db-swing", "Con un manubrio se non hai un kettlebell."],
      ["kb-deadlift", "Impara il piegamento d’anca prima dello swing."],
    ],
    faq: [
      [
        "Quanto deve pesare il kettlebell?",
        "Abbastanza perché lo swing sia scattante, non lento. Molte donne iniziano con 12 kg e molti uomini con 16-20 kg.",
      ],
      ["Quanto in alto devo portarlo?", "Più o meno all’altezza del petto. Più in alto non aggiunge molto."],
    ],
  },
  "farmers-carry": {
    intro:
      "La camminata del contadino prende due pesi pesanti e cammina. Allena presa, trapezi, core e postura insieme, e si trasferisce direttamente nella vita di tutti i giorni.",
    mistakes: [
      ["Piegarsi o ruotare", "Cammina dritto, spalle indietro e in basso, con passi corti e rapidi."],
      ["Pesi troppo leggeri", "Dovrebbe essere difficile completare la distanza. Il limite deve essere la presa."],
      ["Sollevare con la schiena curva", "Solleva i pesi come in uno stacco e posali nello stesso modo."],
    ],
    sets: ["**Forza:** da 3 a 5 tratti da 20 a 40 metri, con 1-2 minuti di recupero."],
    variations: [
      ["db-suitcase-carry", "Un solo lato: allena gli obliqui."],
      ["trap-bar-carry", "Carichi più pesanti in una sola barra."],
      ["kb-rack-carry", "Kettlebell sulle spalle, per la parte alta della schiena."],
    ],
    faq: [
      ["Quanto pesante per la camminata del contadino?", "Inizia con circa un quarto del tuo peso corporeo in ogni mano e aumenta."],
      ["Quanto devo camminare?", "Da 20 a 40 metri per tratto, o da 30 a 60 secondi."],
    ],
  },
  "good-morning": {
    intro:
      "Nel good morning tieni un bilanciere sulla schiena e ti pieghi in avanti dalle anche. Rinforza femorali, glutei e zona lombare, e insegna un piegamento d’anca solido.",
    mistakes: [
      ["Troppo pesante", "Inizia leggero. Questo esercizio è duro per la zona lombare se la tecnica cede."],
      ["Schiena che si incurva", "Tieni la schiena piatta e il petto fiero; scendi solo fin dove riesci a mantenerli."],
      ["Piegare troppo le ginocchia", "Tieni le ginocchia leggermente piegate e spingi le anche dritte indietro."],
    ],
    sets: ["**Muscoli:** 3 serie da 8 a 12, leggere."],
    variations: [
      ["romanian-deadlift", "Lo stesso piegamento d’anca con il peso in mano."],
      ["band-good-morning", "Leggero e utile per imparare."],
      ["seated-good-morning", "Da seduto: soprattutto la zona lombare."],
    ],
    faq: [
      ["Il good morning è pericoloso?", "Non con pesi ragionevoli e una buona tecnica. Inizia leggero e aumenta piano."],
      ["Quanto devo scendere?", "Finché il busto è circa parallelo al pavimento, o meno se la schiena inizia a incurvarsi."],
    ],
  },
  "step-up": {
    intro:
      "Lo step-up ti porta su un box o una panca con una gamba. Costruisce quadricipiti e glutei un lato alla volta e si trasferisce direttamente a scale, escursioni e sport.",
    mistakes: [
      ["Spingere con il piede dietro", "Tieni leggero il piede dietro; lascia che sia la gamba davanti a sollevarti."],
      ["Box troppo alto", "Inizia con un box all’altezza del ginocchio o un po’ più basso."],
      ["Lasciarsi cadere", "Scendi lentamente. Anche la discesa allena la gamba."],
    ],
    sets: ["**Muscoli:** 3 serie da 8 a 12 per gamba.", "**A corpo libero:** 3 serie da 15 a 20 per gamba."],
    variations: [
      ["db-step-up", "Manubri per più carico."],
      ["db-lateral-step-up", "Salita laterale, per i glutei."],
      ["box-step-down", "Discese lente per il controllo del ginocchio."],
    ],
    faq: [
      [
        "Quanto deve essere alto il box?",
        "All’altezza del ginocchio o più basso. I box più alti lavorano di più i glutei ma sono più difficili da controllare.",
      ],
      [
        "Step-up o affondi?",
        "Lavorano gli stessi muscoli. Lo step-up è più facile da bilanciare; gli affondi hanno un movimento più lungo.",
      ],
    ],
  },
  "bench-press": {
    intro:
      "La panca piana è il principale esercizio di forza per la parte superiore del corpo. Allena petto, spalle anteriori e tricipiti, regge molto peso ed è uno degli esercizi in cui è più facile seguire i progressi.",
    mistakes: [
      ["Spalle piatte e molli", "Porta le scapole indietro e in basso prima di staccare il bilanciere e tienile ferme per tutta la serie."],
      ["Gomiti aperti del tutto", "Tienili a circa 45-70 gradi dal corpo. Sei più forte e le spalle ringraziano."],
      [
        "Far rimbalzare il bilanciere sul petto",
        "Tocca leggermente la parte bassa del petto, poi spingi. Una breve pausa insegna il controllo.",
      ],
      ["Piedi che galleggiano", "Pianta i piedi e spingi nel pavimento per tenere il corpo in tensione."],
    ],
    sets: [
      "**Forza:** da 3 a 5 serie da 3 a 6, con 3-5 minuti di recupero.",
      "**Muscoli:** da 3 a 4 serie da 6 a 10, con 2-3 minuti di recupero.",
      "**Se sei alle prime armi:** 3 serie da 8, aggiungendo un po’ di peso a ogni allenamento.",
    ],
    variations: [
      ["db-bench-press", "Più movimento e ogni lato lavora da solo."],
      ["incline-bench-press", "Più petto alto e spalla anteriore."],
      ["close-grip-bench", "Sposta il lavoro sui tricipiti."],
      ["spoto-press", "Pausa appena sopra il petto per costruire controllo."],
    ],
    faq: [
      [
        "Mi serve qualcuno che mi assista?",
        "Per le serie pesanti, fatti assistere o usa un rack con le sicure appena sotto l’altezza del petto.",
      ],
      [
        "Quanto larga deve essere la presa?",
        "Quasi tutti spingono meglio con gli avambracci verticali in basso, di solito un po’ più larga delle spalle.",
      ],
      ["Devo inarcare la schiena?", "Un piccolo arco dato dal portare indietro le scapole è normale. Tieni i glutei sulla panca."],
    ],
  },
  "incline-bench-press": {
    intro:
      "La panca inclinata spinge un bilanciere su una panca inclinata a circa 30 gradi. Sposta più lavoro su petto alto e spalle anteriori rispetto alla panca piana.",
    mistakes: [
      ["Panca troppo inclinata", "Circa 30 gradi bastano. Più ripida diventa una spinta per le spalle."],
      ["Traiettoria troppo bassa", "Porta il bilanciere alla parte alta del petto, appena sotto le clavicole."],
      ["Spalle che ruotano in avanti", "Tieni le scapole indietro e in basso, come sulla panca piana."],
    ],
    sets: ["**Forza:** da 3 a 4 serie da 4 a 6.", "**Muscoli:** 3 serie da 6 a 12."],
    variations: [
      ["db-incline-press", "Manubri: più movimento, più gentile con le spalle."],
      ["smith-incline-press", "Una traiettoria fissa per spingere forte in sicurezza."],
      ["bench-press", "Piana: più peso in generale."],
    ],
    faq: [
      ["Che angolo per la panca inclinata?", "Circa 30 gradi. Molte panche regolabili hanno una tacca vicina a quel valore."],
      [
        "Mi servono sia la piana sia l’inclinata?",
        "Non per forza, ma entrambe allenano il petto da due angoli. Molti programmi usano una come esercizio principale e l’altra come seconda spinta.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "La panca piana con manubri spinge due manubri da sdraiato su una panca piana. Ogni braccio lavora da solo e i manubri possono scendere più di un bilanciere, quindi è ottima per far crescere il petto e pareggiare i lati.",
    mistakes: [
      ["Mettersi in posizione male", "Siediti con i manubri sulle cosce, poi sdraiati e portali su con una spinta delle ginocchia."],
      ["Manubri che si allargano troppo", "Portali ai lati del petto con i gomiti a circa 45 gradi."],
      ["Farli sbattere in alto", "Spingi in alto e leggermente verso l’interno, fermandoti appena prima che si tocchino."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 6 a 12.", "**A casa:** 3 serie da 10 a 20 con una discesa lenta se i manubri sono leggeri."],
    variations: [
      ["db-incline-press", "Focus sul petto alto."],
      ["db-floor-press", "Niente panca; movimento più corto."],
      ["db-neutral-press", "Palmi uno verso l’altro: più gentile con le spalle."],
    ],
    faq: [
      [
        "Manubri o bilanciere?",
        "Con il bilanciere sollevi di più; i manubri danno più movimento e pareggiano i lati. Entrambi costruiscono il petto.",
      ],
      [
        "Come appoggio i manubri in sicurezza?",
        "Portali al petto, poi abbassali sulle cosce mentre ti metti seduto. Non lasciarli cadere ai lati.",
      ],
    ],
  },
  "db-incline-press": {
    intro:
      "La panca inclinata con manubri spinge due manubri su una panca inclinata. È uno dei migliori esercizi per il petto alto e più gentile con le spalle della panca inclinata con bilanciere.",
    mistakes: [
      ["Inclinazione eccessiva", "Usa circa 30 gradi perché lavori soprattutto il petto."],
      ["Accorciare il movimento", "Lascia scendere i manubri all’altezza del petto per un allungamento completo, con controllo."],
      ["Staccarsi dalla panca", "Tieni giù le anche e la parte alta della schiena premuta sullo schienale."],
    ],
    sets: ["**Muscoli:** 3 serie da 8 a 12."],
    variations: [
      ["db-low-incline-press", "Un angolo più basso, tra piana e inclinata."],
      ["incline-bench-press", "La versione con bilanciere per carichi più pesanti."],
      ["incline-machine-press", "Una macchina per spingere forte senza bilanciare."],
    ],
    faq: [
      ["La panca inclinata costruisce il petto alto?", "Sì. L’inclinazione sposta più lavoro sulle fibre alte del petto."],
      ["Quanto pesante rispetto alla piana?", "Di solito il 10-20% in meno della tua panca piana con manubri."],
    ],
  },
  "push-up": {
    intro:
      "Il piegamento sulle braccia spinge il corpo su dal pavimento. Allena petto, spalle e tricipiti ovunque, e con le versioni più difficili può portarti lontano.",
    mistakes: [
      ["Anche che cedono", "Contrai i glutei e gli addominali, così il corpo resta in linea."],
      ["Gomiti aperti", "Tieni i gomiti a circa 45 gradi dal corpo."],
      ["Mezze ripetizioni", "Scendi finché il petto è a un pugno dal pavimento, poi spingi fino in cima."],
    ],
    sets: [
      "**Muscoli:** 3 serie, fermandoti una o due ripetizioni prima del cedimento.",
      "**Troppo facile?** Alza i piedi, rallenta la discesa o aggiungi uno zaino.",
    ],
    variations: [
      ["incline-push-up", "Mani su una panca: più facile, il primo passo."],
      ["decline-push-up", "Piedi rialzati: più difficile, più petto alto."],
      ["archer-push-up", "Sposta il lavoro su un braccio."],
      ["deficit-push-up", "Mani su dei rialzi per un allungamento più profondo."],
    ],
    faq: [
      [
        "Quanti piegamenti devo fare?",
        "Tutte le ripetizioni pulite che riesci meno una o due, per 3 serie. Rendili più difficili quando superi circa 20.",
      ],
      [
        "I piegamenti costruiscono muscolo?",
        "Sì, purché le serie siano dure. Usa versioni più difficili man mano che diventi più forte. Vedi [calisthenics progressions](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro: "Il dip abbassa e spinge il corpo tra due parallele. È uno dei migliori esercizi a corpo libero per petto e tricipiti.",
    mistakes: [
      ["Scendere troppo", "Scendi finché le braccia sono circa parallele al pavimento, o meno se le spalle protestano."],
      ["Alzare le spalle", "Tieni le spalle spinte in basso, lontano dalle orecchie."],
      ["Dondolare", "Incrocia le caviglie e tieni il corpo fermo."],
    ],
    sets: ["**Muscoli:** 3 serie da 6 a 12.", "**Troppo facile?** Aggiungi peso con una cintura o un manubrio tra i piedi."],
    variations: [
      ["negative-dip", "Solo la discesa lenta, il primo passo."],
      ["band-assisted-dip", "Un elastico ti toglie parte del peso."],
      ["ring-dip", "Molto più difficile: gli anelli si muovono."],
    ],
    faq: [
      ["Petto o tricipiti?", "Inclinati in avanti per più petto; resta dritto per più tricipiti."],
      [
        "I dip fanno male alle spalle?",
        "Non alla maggior parte delle persone, se controlli la profondità. Fermati prima del tratto che fa male.",
      ],
    ],
  },
  "cable-fly": {
    intro:
      "Le croci ai cavi portano le mani insieme in un arco, come in un abbraccio, contro due cavi. Isolano il petto e mantengono la tensione per tutta la ripetizione, soprattutto in allungamento.",
    mistakes: [
      ["Trasformarle in una spinta", "Tieni una leggera flessione fissa dei gomiti. Muoviti solo dalle spalle."],
      ["Troppo pesante", "Scegli un peso che controlli per tutto l’allungamento."],
      ["Spalle che ruotano in avanti", "Tieni il petto alto e le scapole indietro."],
    ],
    sets: ["**Muscoli:** 2-3 serie da 10 a 15, dopo le spinte."],
    variations: [
      ["low-cable-fly", "Dal basso verso l’alto: petto alto."],
      ["pec-deck", "Una macchina con traiettoria fissa."],
      ["db-fly", "Con i manubri, senza cavi."],
    ],
    faq: [
      [
        "Cavi dall’alto o dal basso?",
        "Dall’alto verso il basso lavora di più il petto basso; dal basso verso l’alto il petto alto. Vanno bene entrambi.",
      ],
      [
        "Croci ai cavi o con manubri?",
        "I cavi mantengono la tensione in cima alla ripetizione; i manubri pesano di più in allungamento. Funzionano entrambi.",
      ],
    ],
  },
  "overhead-press": {
    intro:
      "Il military press spinge un bilanciere dalle spalle sopra la testa, in piedi. Costruisce spalle e tricipiti, e tutto il corpo deve creare tenuta per reggerlo.",
    mistakes: [
      ["Inclinarsi molto indietro", "Contrai glutei e addominali, così il corpo resta allineato."],
      [
        "Bilanciere che gira attorno al viso",
        "Porta indietro il mento, spingi dritto in alto, poi porta la testa avanti appena il bilanciere è passato.",
      ],
      ["Gomiti aperti all’inizio", "Parti con i gomiti leggermente davanti al bilanciere."],
    ],
    sets: ["**Forza:** da 3 a 5 serie da 3 a 6.", "**Muscoli:** 3 serie da 6 a 10."],
    variations: [
      ["db-shoulder-press", "Seduto, con i manubri: più gentile con la zona lombare."],
      ["push-press", "Una piccola spinta delle gambe per muovere pesi maggiori."],
      ["landmine-press", "Una spinta inclinata per spalle delicate."],
    ],
    faq: [
      [
        "Perché il mio military press si blocca così spesso?",
        "È un esercizio più piccolo, quindi i salti di peso sono relativamente grandi. Usa dischi piccoli o aggiungi ripetizioni prima del peso. Vedi [linear vs double progression](/blog/linear-vs-double-progression/).",
      ],
      ["In piedi o seduto?", "In piedi allena anche il tronco; seduto le spalle spingono di più. Funzionano entrambi."],
    ],
  },
  "db-shoulder-press": {
    intro:
      "Lo shoulder press con manubri spinge due manubri sopra la testa, di solito seduto con lo schienale. Costruisce spalle anteriori e laterali con meno sforzo per la zona lombare rispetto al military press in piedi.",
    mistakes: [
      ["Panca del tutto verticale", "Regolala appena sotto la verticale così la schiena è sostenuta."],
      ["Scendere troppo poco", "Porta i manubri all’incirca all’altezza delle orecchie o del mento."],
      ["Far sbattere i manubri", "Spingi in alto e leggermente verso l’interno, fermandoti prima che si tocchino."],
    ],
    sets: ["**Muscoli:** 3 serie da 6 a 12."],
    variations: [
      ["db-arnold-press", "Palmi che ruotano per più spalla anteriore."],
      ["machine-shoulder-press", "Una traiettoria fissa per spingere forte in sicurezza."],
      ["overhead-press", "Bilanciere, in piedi."],
    ],
    faq: [
      ["Seduto o in piedi?", "Da seduto spingi di più; in piedi alleni equilibrio e tronco."],
      ["Palmi in avanti o verso l’interno?", "Un po’ verso l’interno è più comodo per le spalle di molti. Usa quello che senti meglio."],
    ],
  },
  "lateral-raise": {
    intro:
      "Le alzate laterali sollevano due manubri ai lati. Isolano le spalle laterali, che danno larghezza alle spalle e che le spinte allenano poco.",
    mistakes: [
      ["Lanciare il peso", "Usa un peso che sollevi senza inclinarti né alzare le spalle."],
      ["Alzare le spalle", "Pensa a spingere i manubri in fuori, lontano da te, non in su."],
      ["Troppo pesante", "Pesi leggeri per 12-20 ripetizioni pulite battono ripetizioni pesanti e lanciate."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 12 a 20, due o tre volte a settimana."],
    variations: [
      ["cable-lateral-raise", "Tensione costante, un braccio alla volta."],
      ["lean-away-lateral-raise", "Tenendosi a un palo per un movimento più lungo."],
      ["machine-lateral-raise", "Una traiettoria fissa, facile da spingere al cedimento."],
    ],
    faq: [
      ["Quanto pesanti le alzate laterali?", "Leggere. La maggior parte delle persone usa manubri da 4 a 10 kg per ripetizioni pulite."],
      ["Quanto in alto devo salire?", "Più o meno all’altezza delle spalle. Più in alto entrano i trapezi."],
    ],
  },
  "face-pull": {
    intro:
      "Il face pull tira una corda dal cavo alto verso il viso, con le mani che si allargano. Allena spalle posteriori e parte alta della schiena, che bilanciano le spinte e aiutano la postura.",
    mistakes: [
      ["Tirare con la zona lombare", "Stai dritto e crea tenuta; inclinati indietro solo un poco."],
      ["Mani troppo basse", "Tira verso la fronte o gli occhi, con le mani che finiscono accanto alle orecchie."],
      ["Troppo pesante", "Usa un peso con cui riesci a fare una pausa alla fine di ogni ripetizione."],
    ],
    sets: ["**Muscoli e salute delle spalle:** 2-3 serie da 12 a 20."],
    variations: [
      ["band-face-pull", "Con un elastico, a casa."],
      ["rear-delt-fly", "Con i manubri, busto piegato."],
      ["reverse-pec-deck", "Una macchina con traiettoria fissa."],
    ],
    faq: [
      [
        "I face pull fanno bene alle spalle?",
        "Allenano spalle posteriori e parte alta della schiena, che bilanciano le spinte. Molti li fanno in ogni allenamento della parte superiore.",
      ],
      ["Corda o barra?", "La corda lascia allargare le mani alla fine, e così le spalle posteriori lavorano di più."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "Le alzate posteriori si fanno piegati in avanti sollevando due manubri ai lati. Isolano le spalle posteriori, che la maggior parte delle spinte e persino dei rematori allena poco.",
    mistakes: [
      ["Trasformarle in un rematore", "Tieni i gomiti leggermente piegati e fissi e muoviti dalle spalle."],
      ["Stringere le scapole", "Lascia lavorare le spalle; le scapole restano abbastanza ferme."],
      ["Troppo pesante", "Pesi molto leggeri con controllo funzionano meglio."],
    ],
    sets: ["**Muscoli:** 3 serie da 12 a 20."],
    variations: [
      ["reverse-pec-deck", "Una macchina, più facile restare rigorosi."],
      ["cable-rear-delt-fly", "Cavi per una tensione costante."],
      ["face-pull", "Una tirata che allena anche la parte alta della schiena."],
    ],
    faq: [
      [
        "Seduto o in piedi?",
        "Seduto con il petto sulle ginocchia, o a pancia in giù su una panca inclinata, è più facile restare rigorosi.",
      ],
      [
        "Perché allenare le spalle posteriori?",
        "Completano le spalle e bilanciano tutte le spinte che fanno la maggior parte dei programmi.",
      ],
    ],
  },
  "pull-up": {
    intro:
      "Nelle trazioni sei appeso a una sbarra con i palmi in avanti e porti il mento sopra la sbarra. È il classico esercizio a corpo libero per la schiena e allena dorsali, parte alta della schiena e bicipiti.",
    mistakes: [
      ["Slancio o dondolio", "Inizia ogni ripetizione da appeso e fermo."],
      ["Mezze ripetizioni", "Vai dalle braccia tese al mento sopra la sbarra."],
      ["Alzare le spalle in alto", "Porta le spalle in basso e indietro mentre tiri."],
    ],
    sets: [
      "**Muscoli:** da 3 a 4 serie, fermandoti una o due ripetizioni prima del cedimento.",
      "**Troppo facile?** Aggiungi peso con una cintura o un manubrio tra i piedi.",
    ],
    variations: [
      ["negative-pull-up", "Salta su e scendi lentamente, il primo passo."],
      ["band-assisted-pull-up", "Un elastico ti toglie parte del peso."],
      ["chin-up", "Palmi verso di te: un po’ più facile, più bicipiti."],
      ["neutral-grip-pull-up", "Palmi uno verso l’altro, gentile con i gomiti."],
    ],
    faq: [
      [
        "Come faccio la mia prima trazione?",
        "Negative lente, ripetizioni con l’elastico e lat machine, tre volte a settimana. Quasi tutti arrivano alla prima in un paio di mesi.",
      ],
      [
        "Trazioni o lat machine?",
        "Entrambe allenano i dorsali. Le trazioni lavorano anche il tronco; la lat machine ti fa scegliere qualsiasi peso.",
      ],
    ],
  },
  "chin-up": {
    intro:
      "Nelle trazioni a presa supina sei appeso a una sbarra con i palmi verso di te e porti il mento sopra. Allenano i dorsali e lavorano i bicipiti più delle trazioni classiche, e quasi tutti ne fanno qualcuna in più.",
    mistakes: [
      ["Non distendersi del tutto", "Distendi le braccia in basso a ogni ripetizione."],
      ["Guidare con il mento", "Porta il petto verso la sbarra invece di allungare il collo."],
      ["Dondolare", "Tieni le gambe ferme e il tronco in tensione."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie, fermandoti una o due ripetizioni prima del cedimento."],
    variations: [
      ["pull-up", "Palmi in avanti: più parte alta della schiena."],
      ["reverse-grip-pulldown", "La stessa presa alla macchina."],
      ["negative-pull-up", "Discesa lenta per arrivarci."],
    ],
    faq: [
      [
        "Presa supina o prona?",
        "La supina usa di più i bicipiti ed è un po’ più facile; la prona usa di più la parte alta della schiena. Entrambe costruiscono i dorsali.",
      ],
      ["Quanto larga deve essere la presa?", "Circa alla larghezza delle spalle."],
    ],
  },
  "lat-pulldown": {
    intro:
      "La lat machine tira una barra dal cavo alto fino alla parte alta del petto. Allena i dorsali come una trazione ma ti fa scegliere il peso, quindi può farla chiunque.",
    mistakes: [
      ["Inclinarsi molto indietro", "Inclinati indietro solo un poco e tieni il petto alto."],
      ["Tirare con le braccia", "Pensa a portare i gomiti in basso verso i fianchi."],
      ["Tirare dietro la nuca", "Tira verso la parte alta del petto."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 8 a 12."],
    variations: [
      ["close-grip-pulldown", "Una maniglia stretta, un movimento più lungo."],
      ["one-arm-cable-pulldown", "Un lato alla volta."],
      ["pull-up", "Il tuo peso corporeo."],
    ],
    faq: [
      ["Presa larga o stretta?", "Entrambe lavorano i dorsali. Una presa media, un po’ più larga delle spalle, va bene per quasi tutti."],
      ["La lat machine mi aiuta a fare una trazione?", "Sì, soprattutto con negative lente. Vedi [back workout](/blog/back-workout/)."],
    ],
  },
  "barbell-row": {
    intro:
      "Il rematore con bilanciere si fa piegati in avanti tirando una barra verso la pancia. Costruisce tutta la parte alta della schiena, i dorsali e le spalle posteriori, e permette carichi pesanti.",
    mistakes: [
      ["Raddrizzarsi mentre si tira", "Tieni il busto a un angolo fisso, circa 30-45 gradi rispetto al pavimento."],
      ["Strappare il peso", "Tira in modo fluido e scendi con controllo."],
      ["Zona lombare che si incurva", "Crea tenuta e tieni la schiena piatta. Alleggerisci se si incurva."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 6 a 12.", "**Forza:** 3 serie da 5 a 8."],
    variations: [
      ["pendlay-row", "Da terra a ogni ripetizione, schiena piatta."],
      ["chest-supported-row", "Nessuno sforzo per la zona lombare."],
      ["db-row", "Un braccio alla volta con appoggio."],
    ],
    faq: [
      [
        "Presa prona o supina?",
        "La prona lavora di più la parte alta della schiena; la supina di più dorsali e bicipiti. Vanno bene entrambe.",
      ],
      [
        "Perché il rematore mi fa male alla zona lombare?",
        "Il busto non è sostenuto. Usa meno peso, o passa a un rematore con appoggio al petto.",
      ],
    ],
  },
  "db-row": {
    intro:
      "Il rematore con manubrio a un braccio appoggia una mano e un ginocchio su una panca e tira un manubrio verso l’anca. Allena dorsali e parte alta della schiena un lato alla volta, con la schiena sostenuta.",
    mistakes: [
      ["Ruotare per sollevare", "Tieni spalle e anche parallele al pavimento."],
      ["Tirare verso il petto", "Tira verso l’anca per lavorare i dorsali."],
      ["Movimento corto", "Lascia pendere il manubrio fino in fondo per un allungamento a ogni ripetizione."],
    ],
    sets: ["**Muscoli:** 3 serie da 8 a 12 per braccio."],
    variations: [
      ["db-chest-supported-row", "Due braccia, petto su una panca inclinata."],
      ["kb-row", "Con un kettlebell."],
      ["seal-row", "Sdraiato su una panca alta: molto rigoroso."],
    ],
    faq: [
      ["Mi serve una panca?", "Con una panca è più facile. Senza, appoggia una mano su una sedia robusta o sul ginocchio."],
      ["Quanto pesante il rematore con manubrio?", "Abbastanza perché le ultime ripetizioni siano dure senza ruotare."],
    ],
  },
  "seated-cable-row": {
    intro:
      "Il pulley basso tira una maniglia verso la pancia dal cavo basso, da seduto. Allena parte alta della schiena e dorsali con una tensione costante e senza carico sulla zona lombare.",
    mistakes: [
      ["Dondolare avanti e indietro", "Tieni il busto fermo, inclinandoti indietro solo un poco alla fine."],
      ["Alzare le spalle", "Porta le scapole indietro e in basso, non in su."],
      ["Tornare di fretta", "Lascia distendere le braccia con controllo e senti l’allungamento."],
    ],
    sets: ["**Muscoli:** da 3 a 4 serie da 8 a 15."],
    variations: [
      ["cable-row-wide", "Una barra larga: più parte alta della schiena."],
      ["single-arm-cable-row", "Un lato alla volta."],
      ["machine-row", "Una macchina con appoggio al petto."],
    ],
    faq: [
      [
        "Qual è la maniglia migliore?",
        "Una maniglia a V stretta lavora di più i dorsali; una barra larga di più la parte alta della schiena. Usale entrambe nel tempo.",
      ],
      ["Devo inclinarmi in avanti?", "Un po’ all’inizio per l’allungamento, poi siediti dritto mentre tiri."],
    ],
  },
  "barbell-curl": {
    intro:
      "Il curl con bilanciere porta una barra dalle cosce alle spalle. È il classico esercizio per i bicipiti e permette di usare più peso di qualsiasi altro curl.",
    mistakes: [
      ["Dondolare con la schiena", "Stai dritto con i gomiti ai fianchi. Alleggerisci se devi dondolare."],
      ["Gomiti che vanno in avanti", "Tienili vicini al corpo per tutta la ripetizione."],
      ["Lasciar cadere il bilanciere", "Scendi con controllo per due o tre secondi."],
    ],
    sets: ["**Muscoli:** da 2 a 4 serie da 8 a 12."],
    variations: [
      ["ez-curl", "Una barra sagomata più gentile con i polsi."],
      ["db-curl", "Ogni braccio da solo."],
      ["drag-curl", "Porta la barra su lungo il corpo, per il picco del bicipite."],
    ],
    faq: [
      ["Bilanciere dritto o EZ?", "La barra EZ è più gentile con i polsi. Quella dritta lavora i bicipiti un po’ di più."],
      [
        "Quanti curl devo fare?",
        "Circa 6-12 serie dure di lavoro per i bicipiti a settimana, contando trazioni e rematori. Vedi [arm workout](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "Il curl con manubri porta su un manubrio in ogni mano. Ogni braccio lavora da solo e puoi ruotare i palmi verso l’alto mentre sollevi, il che allena il bicipite in modo completo.",
    mistakes: [
      ["Dondolare", "Tieni i gomiti ai fianchi e il corpo fermo."],
      ["Ruotare troppo tardi", "Parti con i palmi verso l’interno e ruotali verso l’alto mentre sali."],
      ["Movimento corto", "Distendi del tutto le braccia in basso."],
    ],
    sets: ["**Muscoli:** da 2 a 4 serie da 8 a 15."],
    variations: [
      ["incline-db-curl", "Su una panca inclinata per un lungo allungamento."],
      ["hammer-curl", "Palmi verso l’interno: più avambraccio e brachiale."],
      ["db-preacher-curl", "Braccio su un cuscinetto per ripetizioni rigorose."],
    ],
    faq: [
      ["Alternati o entrambe le braccia insieme?", "Va bene tutto. Alternando ti concentri su ogni braccio; insieme risparmi tempo."],
      ["In piedi o seduto?", "Da seduto è più difficile dondolare."],
    ],
  },
  "hammer-curl": {
    intro:
      "Il curl a martello porta su i manubri con i palmi uno verso l’altro. Lavora il brachiale e gli avambracci più di un curl normale, e dà spessore al braccio.",
    mistakes: [
      ["Lanciare il peso", "Stai dritto e tieni fermi i gomiti."],
      ["Ruotare i palmi", "Tieni i palmi uno verso l’altro per tutta la ripetizione."],
      ["Andare di fretta", "Scendi con controllo."],
    ],
    sets: ["**Muscoli:** da 2 a 3 serie da 8 a 15."],
    variations: [
      ["rope-hammer-curl", "Al cavo con una corda."],
      ["incline-hammer-curl", "Su una panca inclinata per un allungamento."],
      ["reverse-curl", "Palmi in giù per gli avambracci."],
    ],
    faq: [
      ["Curl a martello o curl normale?", "Falli entrambi: il curl normale per i bicipiti, quello a martello per brachiale e avambracci."],
      ["Verso il corpo o dritto?", "Funzionano entrambi. Verso il corpo è una variante comune che alcuni trovano più comoda."],
    ],
  },
  "cable-pushdown": {
    intro:
      "Il pushdown ai cavi spinge una barra o una corda verso il basso dal cavo alto. Isola i tricipiti ed è facile da imparare, gentile con i gomiti e facile da far progredire.",
    mistakes: [
      ["Gomiti che si muovono", "Tieni i gomiti fermi ai fianchi; si muovono solo gli avambracci."],
      ["Chinarsi sopra il peso", "Stai dritto con una leggera inclinazione in avanti, non ingobbito."],
      ["Movimento corto", "Distendi del tutto in basso e lascia salire gli avambracci oltre il parallelo."],
    ],
    sets: ["**Muscoli:** da 2 a 4 serie da 10 a 15."],
    variations: [
      ["rope-pushdown", "La corda lascia allargare le mani in basso."],
      ["cable-overhead-extension", "Sopra la testa: il capo lungo del tricipite."],
      ["reverse-grip-pushdown", "Palmi in su, una sensazione diversa."],
    ],
    faq: [
      ["Corda o barra?", "Con la barra sollevi di più; con la corda le mani si allargano. Usa quella che vuoi."],
      [
        "Mi serve anche un lavoro per i tricipiti sopra la testa?",
        "Aggiungere un’estensione sopra la testa allena il capo lungo del tricipite in allungamento, il che forse costruisce più muscolo.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "Il French press abbassa una barra EZ verso la fronte da sdraiato su una panca, poi distende le braccia. Allena tutti e tre i capi del tricipite con un buon allungamento.",
    mistakes: [
      ["Gomiti che si aprono", "Tienili puntati verso il soffitto, circa alla larghezza delle spalle."],
      ["Scendere fino alla fronte", "Scendi verso la sommità della testa o appena dietro, per più allungamento e meno rischi."],
      ["Troppo pesante", "Scegli un peso che controlli fino in fondo."],
    ],
    sets: ["**Muscoli:** da 2 a 3 serie da 8 a 12."],
    variations: [
      ["db-skull-crusher", "Con i manubri, più gentile con i polsi."],
      ["incline-skull-crusher", "Su una panca inclinata per un allungamento più lungo."],
      ["jm-press", "A metà tra French press e panca a presa stretta."],
    ],
    faq: [
      [
        "Il French press fa male ai gomiti?",
        "Ad alcuni gomiti può dare fastidio. Abbassa il peso, prova i manubri o passa ai cavi se fa male.",
      ],
      ["Barra EZ o dritta?", "La barra EZ è più gentile con i polsi."],
    ],
  },
  "close-grip-bench": {
    intro:
      "La panca a presa stretta è una panca piana con le mani circa alla larghezza delle spalle. Sposta più lavoro sui tricipiti e ti permette comunque di sollevare pesante.",
    mistakes: [
      ["Presa troppo stretta", "Circa alla larghezza delle spalle. Con le mani che si toccano soffrono i polsi."],
      ["Gomiti che si aprono", "Tienili stretti ai fianchi."],
      ["Toccare troppo in alto", "Scendi alla parte bassa del petto."],
    ],
    sets: ["**Forza:** da 3 a 4 serie da 5 a 8.", "**Muscoli:** 3 serie da 8 a 12."],
    variations: [
      ["bench-press", "Una presa più larga, più petto."],
      ["db-close-press", "Manubri spinti uno contro l’altro."],
      ["diamond-push-up", "La versione a corpo libero."],
    ],
    faq: [
      ["È un esercizio per il petto o per i tricipiti?", "Per entrambi, con più tricipiti di una panca normale."],
      ["Quanto in meno della mia panca?", "Di solito circa il 10-15% in meno."],
    ],
  },
  "preacher-curl": {
    intro:
      "Nel curl alla panca Scott appoggi le braccia su un cuscinetto inclinato e porti su una barra EZ. Il cuscinetto impedisce di dondolare e carica molto i bicipiti in basso, in allungamento.",
    mistakes: [
      ["Non arrivare all’allungamento completo", "Scendi finché le braccia sono quasi tese, con controllo."],
      ["Staccare i gomiti dal cuscinetto", "Tieni le braccia ben appoggiate sul cuscinetto."],
      ["Lasciarsi cadere in basso", "Rallenta l’ultima parte della discesa, dove c’è l’allungamento."],
    ],
    sets: ["**Muscoli:** da 2 a 3 serie da 8 a 12."],
    variations: [
      ["db-preacher-curl", "Un braccio alla volta con un manubrio."],
      ["machine-preacher-curl", "Una traiettoria fissa, facile da spingere forte."],
      ["cable-preacher-curl", "Tensione anche in alto."],
    ],
    faq: [
      [
        "Il curl alla panca Scott è meglio del curl in piedi?",
        "È più rigoroso e carica di più la posizione in allungamento. Entrambi costruiscono i bicipiti.",
      ],
      ["Perché fa male in basso?", "Usa meno peso e rallenta. Fermati prima della distensione completa se i gomiti protestano."],
    ],
  },
};
