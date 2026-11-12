import type { FeaturesText } from "./types";

// The features page in Italian (tu). English is src/content/features.ts plus en.ts; keep the same ids and {placeholders}.
// Fixed terms as in the app: Registra serie, prontezza, scarico, mappa del recupero, riposo, palestra.

export const it: FeaturesText = {
  chrome: {
    title: "Funzioni di {name} e compatibilità",
    description:
      "Tutte le funzioni di {name}, quali sono gratis, le più nuove e una tabella di orologi, app di salute, bilance e servizi con cui funziona su Android, iPhone e web.",
    crumb: "Funzioni",
    h1: "Tutte le funzioni di {name}",
    intro:
      "Tutte le {count} funzioni, quali sono gratis, cosa funziona con cosa e le novità. Quasi tutto è gratis; guarda i {pricing} per sapere cosa aggiunge Pro.",
    pricing: "prezzi",
    onThisPage: "In questa pagina",
    newestNav: "Novità",
    worksWithNav: "Compatibilità",
    newestH: "Le funzioni più nuove",
    newestIntro: "Aggiunte di recente, per categoria. Ogni modifica, correzioni comprese, è in {whatsNew}.",
    whatsNew: "Novità",
    midTitle: "Provalo tu stesso",
    midBody: "Gratis e senza account. Il tuo primo allenamento è pronto in meno di un minuto.",
    midButton: "Inizia gratis",
    worksH: "Con cosa funziona {name}",
    worksIntro:
      "App, orologi e dispositivi, e dove funziona ciascuno. «Tramite Salute» significa che arriva a {name} tramite Health Connect su Android o Apple Salute su iPhone. «Chrome» indica la web app in Chrome, che ha il Web Bluetooth.",
    tableLabel: "Tabella di compatibilità",
    cols: { connection: "Connessione", does: "Cosa fa", android: "Android", iphone: "iPhone", web: "Web", plan: "Piano" },
    footnote:
      "«In arrivo» significa che è pronto e aspetta la sua scheda nello store. «In valutazione» significa che ci stiamo lavorando ma non possiamo ancora prometterlo, perché dipende dall’approvazione dell’altra azienda. I servizi fitness si collegano con un account {name} gratuito. I Labs sono esperimenti di Pro che attivi in Impostazioni › Labs. I nomi dei prodotti sono marchi dei rispettivi proprietari.",
    endTitle: "Inizia gratis, senza account",
    endBody: "Il tuo primo allenamento è pronto in meno di un minuto. Niente pubblicità, mai.",
  },
  tiers: { free: "Gratis", pro: "Pro", both: "Gratis + Pro", lab: "Labs (Pro)" },
  where: { all: "Android, iPhone e web", phones: "App Android e iPhone" },
  support: { yes: "Sì", no: "No", soon: "In arrivo", investigating: "In valutazione", chrome: "Chrome", health: "Tramite Salute" },
  groups: {
    plan: {
      title: "Un piano che si adatta",
      intro: "L’allenamento di oggi nasce dalla tua palestra, dal tuo recupero e dal tuo blocco di allenamento, e ogni numero dice perché.",
    },
    workout: { title: "L’allenamento", intro: "Un tocco registra una serie come previsto. Tutto il resto aspetta il riposo." },
    progress: { title: "Progressi e coaching", intro: "Prima cosa fare dopo. I numeri compaiono quando puoi agire su di essi." },
    body: {
      title: "Corpo e salute",
      intro: "Peso, massa grassa e dati di salute arrivano da soli dove possibile, e diventano consigli.",
    },
    programs: {
      title: "Programmi, routine ed esercizi",
      intro: "Segui un programma classico, crea le tue routine o lascia pianificare l’app. Tutto da un’unica libreria.",
    },
    gyms: { title: "Palestre e attrezzatura", intro: "Ogni piano parte dall’attrezzatura che hai davvero." },
    friends: { title: "Amici e condivisione", intro: "Allenati con le persone, non per un pubblico. Amici è gratis." },
    coaches: { title: "Per i coach", intro: "Essere cliente di qualcuno è gratis per tutti." },
    fun: { title: "Ricompense", intro: "Un po’ di divertimento che non intralcia mai una serie." },
    phone: { title: "Sul telefono e al polso", intro: "Liftsmith sfrutta il meglio di ogni telefono." },
    data: { title: "I tuoi dati", intro: "Funziona offline, senza account, e i tuoi dati restano tuoi." },
    access: {
      title: "Aspetto, comodità e lingue",
      intro: "Comodo per tutti, con una mano in palestra o su un grande schermo a casa.",
    },
    labs: {
      title: "Labs",
      intro: "Esperimenti che chi ha Pro può attivare in Impostazioni › Labs. Possono cambiare o sparire.",
    },
  },
  features: {
    adaptive: {
      name: "Allenamenti adattivi ogni giorno",
      body: "Sceglie esercizi che la tua palestra permette e per cui i tuoi muscoli sono pronti, poi fissa ogni peso e ripetizione in base ai tuoi ultimi allenamenti.",
      proPart: "Senza Pro hai un allenamento adattivo a settimana accanto al programma gratuito; Pro pianifica ogni giorno.",
    },
    splits: {
      name: "Split adattivi",
      body: "Spinta, tirata e gambe o parte alta e bassa, comunque adattati al tuo recupero ogni giorno.",
    },
    readiness: {
      name: "La scelta di oggi",
      body: "Spingi, come previsto o vai leggero, in base a recupero, ripetizioni mancate e a quanto ti sono sembrate dure le ultime serie. Puoi sempre cambiarla.",
    },
    "health-readiness": {
      name: "Sonno e HRV spostano la scelta",
      body: "Sonno, variabilità della frequenza cardiaca, battito a riposo e frequenza respiratoria dall’app di salute del telefono spostano la scelta di oggi in su o in giù.",
    },
    blocks: {
      name: "Blocchi di allenamento e scarichi",
      body: "Blocchi di quattro settimane con un obiettivo di ripetizioni di riserva che portano a una settimana più leggera, così continui a progredire senza esaurirti.",
    },
    why: {
      name: "Ogni consiglio dice perché",
      body: "Ogni esercizio, numero di serie, obiettivo di ripetizioni e peso ha un breve motivo, mostrato sullo schermo, mai nascosto dietro un tocco.",
    },
    "short-on-time": {
      name: "Poco tempo",
      body: "Di’ all’allenamento che hai meno tempo e taglia ciò che conta meno.",
      proPart: "Aggirare una panca o un rack occupato da qualcun altro è Pro.",
    },
    injury: {
      name: "Modalità infortunio",
      body: "Dille cosa fa male: lascia fuori ciò che lo peggiorerebbe, ti avvisa degli esercizi a rischio e segue un livello di dolore da 0 a 10 nel tempo.",
    },
    cycle: { name: "Prontezza secondo il ciclo", body: "Se vuoi, registra il tuo ciclo e la scelta di oggi ne tiene conto." },
    "goal-planner": {
      name: "Pianificatore di obiettivi",
      body: "Scegli un esercizio e un obiettivo: calcola una data realistica e la strada per arrivarci.",
    },
    logger: {
      name: "Registra una serie con un tocco",
      body: "La serie successiva è sempre già compilata. Pulsanti che si ripetono tenendoli premuti cambiano peso e ripetizioni; scrivere è solo un ripiego.",
    },
    "rest-timer": {
      name: "Timer di riposo sulla schermata di blocco",
      body: "Parte da solo dopo ogni serie e fa il conto alla rovescia sulla schermata di blocco con la serie successiva, i dischi, il battito e i pulsanti Registra serie e +30 s che funzionano ad app chiusa.",
      note: "Android: una notifica fissa, un Live Update su Android 16 e la Now Bar di Samsung. iPhone: un’Attività dal vivo sulla schermata di blocco e nella Dynamic Island. Web: una notifica finché la pagina è aperta.",
    },
    plates: {
      name: "Calcolo dei dischi",
      body: "Mostra quali dischi vanno su ogni lato, calcolati con i dischi della tua palestra, ogni misura nel suo colore.",
    },
    warmups: {
      name: "Serie di riscaldamento",
      body: "Serie di avvicinamento calcolate per ogni esercizio pesante, così arrivi pronto al tuo peso di lavoro.",
    },
    demos: {
      name: "Dimostrazioni degli esercizi in 3D",
      body: "Ogni esercizio ha una figura 3D che mostra il movimento con la sua attrezzatura, con i passi di preparazione e i consigli.",
    },
    "set-types": { name: "Drop set e rest-pause", body: "Aggiungi un drop set o una serie rest-pause tra le serie." },
    "timed-sets": {
      name: "Timer per tenute, trasporti e cardio",
      body: "Gli esercizi a tempo come plank, trasporti, sospensioni e cardio hanno un timer di serie, anche sulla schermata di blocco e sugli orologi.",
    },
    "each-side": {
      name: "Per lato e per mano",
      body: "Gli esercizi fatti un lato alla volta lo indicano, e il peso dei manubri è mostrato per mano.",
    },
    swaps: {
      name: "Sostituisci esercizi",
      body: "Sostituisci qualsiasi esercizio con uno che lavora gli stessi muscoli con quello che ha la tua palestra.",
    },
    "heart-rate": {
      name: "Battito in tempo reale",
      body: "Collega una fascia cardio Bluetooth o il tuo orologio e vedi il battito in ogni serie e in ogni riposo.",
      note: "Web: solo Chrome.",
    },
    breathing: {
      name: "Respirazione quadrata durante il riposo",
      body: "Una guida alla respirazione nella schermata di riposo, con preimpostazioni o il tuo schema.",
    },
    "voice-coach": {
      name: "Coach vocale",
      body: "Parla durante l’allenamento, per esempio quando finisce il riposo, così non devi guardare il telefono.",
      note: "Android avvisa della fine del riposo anche a schermo bloccato; iPhone e web finché l’app è aperta.",
    },
    stretching: {
      name: "Stretching",
      body: "48 allungamenti con dimostrazioni in 3D: un riscaldamento facoltativo prima, un defaticamento dopo o una routine di stretching in qualsiasi giorno.",
    },
    notes: {
      name: "Note del coach",
      body: "Segnala fatica che si accumula, un esercizio fermo, un muscolo con poche serie, un obiettivo settimanale a rischio o massa grassa in aumento, ognuno con una cosa da fare, spesso con un solo tocco.",
    },
    plateau: {
      name: "Detective degli stalli",
      body: "Quando un esercizio si blocca, indica la causa probabile e una soluzione di tre settimane con un tocco, poi ti dice se ha funzionato.",
    },
    "recovery-map": {
      name: "Mappa del recupero",
      body: "I tuoi muscoli si illuminano su una figura 3D in base a quanto sono recuperati. Toccane uno per vedere cosa significa per oggi.",
    },
    "advanced-stats": {
      name: "Statistiche avanzate",
      body: "Serie settimanali per muscolo rispetto all’obiettivo, andamento del massimale e la direzione di ogni esercizio.",
    },
    bests: {
      name: "Record personali e cronologia",
      body: "Ogni record, massimale stimato, punteggio di forza e allenamento passato, senza limiti di cronologia.",
    },
    "calendar-history": {
      name: "Calendario degli allenamenti",
      body: "Un calendario mensile degli allenamenti passati in Progressi, con il nome di ogni giorno.",
    },
    "edit-history": {
      name: "Modifica e ripeti gli allenamenti passati",
      body: "Correggi una serie, aggiungi una nota, dai un nome a un allenamento o ripetilo, e ogni esercizio ha la sua pagina con la sua cronologia.",
    },
    "log-past": {
      name: "Registra un allenamento passato",
      body: "Hai dimenticato il telefono? Registra l’allenamento dopo e conta come tutti gli altri.",
    },
    recap: { name: "Riepilogo mensile", body: "Un breve sguardo al tuo mese, pronto da condividere." },
    body: {
      name: "Peso, massa grassa e foto",
      body: "Registra peso e massa grassa, o lasciali arrivare dalla bilancia tramite l’app di salute del telefono, e tieni le foto dei progressi sul telefono.",
    },
    measurements: {
      name: "Misure con il metro",
      body: "Nove punti in centimetri o pollici. Un girovita che cresce o cala diventa una nota del coach quando manca la massa grassa.",
    },
    "health-twin": {
      name: "Gemello della salute ed età fitness",
      body: "Sonno, HRV, battito a riposo, passi, frequenza respiratoria e VO₂ max in un unico posto, con il tuo andamento e un’età fitness dal tuo VO₂ max.",
      note: "I dati di salute arrivano da Health Connect su Android e da Apple Salute su iPhone. La web app mostra peso, massa grassa, IMC e calorie.",
    },
    "fitness-tests": {
      name: "Test di forma fisica",
      body: "Sospensione alla sbarra, equilibrio su una gamba e alzate dalla sedia in 30 secondi, ciascuno con timer, un intervallo tipico e cosa aiuta.",
    },
    food: {
      name: "Note del coach dalla tua app di alimentazione",
      body: "Calorie e proteine registrate in un’app di alimentazione arrivano a Liftsmith tramite l’app di salute del telefono e diventano note come «poche proteine tre giorni di fila». L’app non registra il cibo.",
    },
    "your-stats": {
      name: "I tuoi dati",
      body: "Un solo posto per sesso, età e altezza che ogni strumento legge, compilato da Apple Salute su iPhone.",
    },
    "fixed-programs": {
      name: "Programmi classici",
      body: "5×5 classico, 3×5 per principianti, 5×5 con braccia, 5×5 progressivo, progressione a livelli, onde sul massimale di allenamento, abilità a corpo libero e total body con manubri. Il programma gratuito si adatta alla tua palestra.",
    },
    routines: {
      name: "Le tue routine",
      body: "Crea routine dal catalogo esercizi, senza limiti di numero, e condividile con un link.",
    },
    library: {
      name: "1.000 esercizi",
      body: "Forza, corpo libero, macchine, elastici, kettlebell e cardio, con ricerca, filtri per muscolo e un filtro per questa palestra. Il cardio registra tempo e distanza.",
    },
    remix: { name: "Link di allenamento", body: "Manda un allenamento a un amico come link che può fare da sé." },
    gyms: {
      name: "Le tue palestre e la loro attrezzatura",
      body: "Configura ogni palestra una volta: bilancieri, dischi, manubri e kettlebell come sono davvero, macchine e loro regolazioni.",
    },
    "gym-location": { name: "Palestra in base al luogo", body: "Sceglie la palestra giusta quando arrivi." },
    "gym-share": {
      name: "Condividi l’attrezzatura di una palestra",
      body: "Manda l’attrezzatura della tua palestra come link, così il tuo compagno di allenamento parte con la stessa.",
    },
    "gym-finder": {
      name: "Ricerca palestre e pagine delle palestre",
      body: "Trova palestre vicino a te, prima quelle ufficiali, ciascuna con la sua pagina: attrezzatura, orari, mappa e membri. I titolari possono rivendicare la loro palestra. Manca una palestra? Aggiungila.",
    },
    "buy-next": {
      name: "Cosa comprare dopo",
      body: "Per le palestre in casa: l’attrezzo che aprirebbe più esercizi.",
    },
    feed: {
      name: "Bacheca degli amici",
      body: "Segui persone e vedi i loro allenamenti, con mi piace, commenti, risposte e @menzioni, e scegli chi vede ognuno dei tuoi.",
    },
    cheers: {
      name: "In allenamento ora e incitamenti",
      body: "Vedi chi si sta allenando adesso e manda un incitamento che sale fluttuando sulla sua schermata di allenamento.",
    },
    challenges: {
      name: "Sfide, club e classifiche",
      body: "Sfida un amico, entra in un club o nel gruppo della tua palestra con una classifica settimanale e affronta la sfida del mese con tutti.",
    },
    profiles: { name: "Profili pubblici", body: "Una pagina pubblica facoltativa con i tuoi migliori sollevamenti e allenamenti." },
    share: {
      name: "Card e link da condividere",
      body: "Condividi un allenamento, un nuovo record o un traguardo come immagine, o come link pubblico con anteprima.",
    },
    coaching: {
      name: "Segui i clienti",
      body: "Collega i clienti, vedi i loro risultati e assegna loro routine, sul telefono o su un grande schermo.",
    },
    awards: {
      name: "Obiettivi, livelli e serie di giorni",
      body: "Badge a livelli, 50 livelli con ricompense, missioni settimanali, protezioni della serie e leghe oneste.",
    },
    locker: {
      name: "Temi, colori e icone dell’app",
      body: "Guadagna temi e colori d’accento e, sui telefoni, un’icona dell’app nei colori del tuo tema.",
      note: "Le icone dell’app guadagnate sono solo su Android e iPhone.",
    },
    watch: {
      name: "App per orologi",
      body: "L’allenamento su Wear OS e Apple Watch: la serie o il conto alla rovescia del riposo, il battito dall’orologio, Registra serie e +30 s, e una vibrazione a fine riposo.",
    },
    widgets: {
      name: "Widget della schermata Home",
      body: "La scelta di oggi, il tuo obiettivo settimanale, una nota del coach e Inizia o Registra serie nella schermata Home.",
      note: "La web app ha invece scorciatoie sulla sua icona nella schermata Home.",
    },
    shortcuts: {
      name: "Impostazioni rapide, Siri e Comandi",
      body: "Inizia un allenamento da un riquadro delle Impostazioni rapide su Android o dal Centro di Controllo e Siri su iPhone.",
    },
    calendar: {
      name: "Calendario",
      body: "Mette i tuoi giorni di allenamento nel calendario e può accorciare un allenamento perché stia prima della tua prossima riunione.",
      note: "La web app scarica invece un file .ics.",
    },
    reminders: {
      name: "Promemoria",
      body: "Promemoria gentili nei giorni di allenamento, come notifiche sui telefoni e via email.",
    },
    cloud: {
      name: "Collegamenti ai servizi fitness",
      body: "Oura invia sonno, HRV, battito a riposo e passi, con un account gratuito. Stiamo valutando Strava, WHOOP, Withings, Polar e Concept2.",
    },
    "health-save": {
      name: "Allenamenti salvati nella tua app di salute",
      body: "Ogni allenamento finito viene salvato in Health Connect o Apple Salute come allenamento di forza, con calorie e battito.",
    },
    offline: {
      name: "Funziona offline",
      body: "Tutto gira sul tuo dispositivo, quindi nessun problema se in palestra nel seminterrato non c’è campo.",
    },
    sync: {
      name: "Account e sincronizzazione",
      body: "L’accesso facoltativo con Google, Apple o un codice via email tiene allineati telefono, tablet e web app.",
    },
    backup: {
      name: "Backup ed esportazione",
      body: "Salva un file di backup o esporta i tuoi allenamenti come foglio di calcolo quando vuoi.",
    },
    import: {
      name: "Importa da un’altra app",
      body: "Porta la tua cronologia da Strong, Hevy, Fitbod, StrongLifts o JEFIT con il loro file di esportazione.",
    },
    languages: {
      name: "Sei lingue",
      body: "Inglese, spagnolo, francese, tedesco, italiano e giapponese, secondo la lingua del telefono.",
    },
    appearance: {
      name: "Scuro, chiaro o come il telefono",
      body: "Un aspetto scuro di base, uno chiaro, o quello che usa il tuo telefono.",
    },
    a11y: {
      name: "Accessibilità",
      body: "Testo più grande fino al 150%, colori adatti al daltonismo, più contrasto, lettore di schermo e uso completo da tastiera, verificati secondo WCAG 2.2 AA.",
    },
    "one-hand": {
      name: "Comandi a una mano",
      body: "Sposta i pulsanti di peso e ripetizioni accanto a Registra serie, sotto il pollice sinistro o destro.",
    },
    lean: {
      name: "Modalità essenziale, suoni e vibrazione",
      body: "Spegni animazioni e coriandoli, suoni o vibrazione, ognuno con un interruttore.",
    },
    desktop: {
      name: "Layout per computer",
      body: "Sul computer la web app ha una barra laterale, pagine larghe, scorciatoie da tastiera durante l’allenamento (L registra la serie) e un editor di routine ampio.",
      note: "Web app in una finestra larga con mouse; telefoni e tablet mantengono il layout da telefono.",
    },
    "lab-rep-count": {
      name: "Conteggio ripetizioni con la fotocamera",
      body: "Appoggia il telefono e la fotocamera conta le ripetizioni, con lo scheletro disegnato sull’immagine. Niente esce dal telefono.",
    },
    "lab-bar-speed": {
      name: "Velocità del bilanciere con la fotocamera",
      body: "Mostra quanto velocemente si muove il bilanciere e quando ha rallentato abbastanza da chiudere la serie.",
    },
    "lab-form": {
      name: "Controllo della tecnica con la fotocamera",
      body: "Riconosce squat sopra il parallelo, ripetizioni accorciate e inclinazioni da un lato, e dà un consiglio tra le serie.",
    },
    "lab-speed-max": {
      name: "Il massimale di oggi dal riscaldamento",
      body: "Usa la velocità del bilanciere nel riscaldamento per suggerire un primo peso di lavoro un po’ più alto o più basso.",
    },
    "lab-bar-path": {
      name: "Replay della traiettoria del bilanciere",
      body: "Ripropone una ripetizione di squat, stacco o lento avanti con la traiettoria del bilanciere disegnata, e un consiglio se è andata fuori linea.",
    },
    "lab-motion": {
      name: "Conteggio con i sensori del telefono",
      body: "Conta le ripetizioni con i sensori di movimento del telefono quando si muove con te.",
      note: "Telefoni e tablet con sensori di movimento.",
    },
    "lab-watch-reps": {
      name: "Conteggio ripetizioni con l’orologio",
      body: "Il tuo orologio Wear OS o Apple Watch conta le ripetizioni dal polso.",
    },
    "lab-hands-free": {
      name: "Serie a mani libere",
      body: "Mentre un contatore di ripetizioni conta, la serie si registra da sola pochi secondi dopo l’ultima ripetizione.",
    },
    "lab-voice": {
      name: "Registra le serie con la voce",
      body: "Di’ «100 per 8» o «troppo facile» per registrare una serie. Riconosciuto sul dispositivo; nessun audio ne esce.",
      note: "Web: Chrome 139 o successivo.",
    },
    "lab-volume": {
      name: "Il tasto del volume registra una serie",
      body: "Premi volume su sul telefono o sugli auricolari per registrare la serie.",
    },
    "lab-tempo": {
      name: "Coach del tempo",
      body: "Negli esercizi con tempo o pausa, conta discesa, fermo e salita di ogni ripetizione con suono e vibrazione.",
    },
    "lab-hr-rest": {
      name: "Riposo in base al battito",
      body: "Chiude il riposo prima quando il battito è sceso, mai sotto il 60% del riposo previsto.",
    },
    "lab-machines": {
      name: "Macchine da palestra Bluetooth",
      body: "Bici, vogatori, tapis roulant ed ellittiche compilano tempo, distanza e potenza di una serie di cardio.",
      note: "Web: solo Chrome.",
    },
    "lab-scale": {
      name: "Bilancia smart Bluetooth",
      body: "Sali su una bilancia compatibile e la pesata si compila con peso e massa grassa, da controllare e registrare.",
      note: "Web: solo Chrome.",
    },
    "lab-sonos": {
      name: "Sonos",
      body: "Controlla un altoparlante Sonos dall’allenamento, con un volume per le serie e uno per il riposo.",
    },
  },
  connectionGroups: {
    health: "App di salute",
    watches: "Orologi e battito",
    bluetooth: "Dispositivi Bluetooth (Labs)",
    services: "Servizi fitness (serve un account gratuito)",
    music: "Musica e altoparlanti",
    other: "Calendari e altre app",
  },
  connections: {
    "health-connect": {
      does: "In entrata peso, massa grassa, sonno, HRV, battito, passi e alimentazione; in uscita gli allenamenti finiti",
    },
    "apple-health": {
      name: "Apple Salute",
      does: "In entrata peso, massa grassa, sonno, HRV, battito, passi, alimentazione, altezza, età e sesso; in uscita gli allenamenti finiti",
    },
    "samsung-health": { does: "I suoi dati, quando li condividi con Health Connect" },
    "health-devices": {
      name: "Fitbit, Garmin Connect, bilance smart, Hume Body Pod",
      does: "Quello che scrivono nell’app di salute del telefono",
    },
    "wear-os": { name: "Orologi Wear OS", does: "L’allenamento al polso, battito, Registra serie e +30 s" },
    "apple-watch": { does: "L’allenamento al polso, battito, Registra serie e +30 s" },
    garmin: { name: "Orologi Garmin (Connect IQ)", does: "L’allenamento al polso con l’app per orologio di Liftsmith" },
    "hr-strap": {
      name: "Fasce cardio Bluetooth",
      does: "Battito in tempo reale durante serie e riposo (qualsiasi fascia o bracciale che condivide il battito Bluetooth standard)",
    },
    scale: {
      name: "Bilance smart Bluetooth",
      does: "Peso e massa grassa nella pesata (bilance che condividono il servizio standard Weight Scale o Body Composition)",
      link: "Bilance compatibili",
    },
    machines: {
      name: "Macchine da palestra Bluetooth",
      does: "Tempo, distanza e potenza da bici, vogatori, tapis roulant ed ellittiche che condividono il servizio standard Fitness Machine",
    },
    oura: { does: "In entrata sonno, HRV, battito a riposo e passi" },
    strava: { does: "Ogni allenamento finito pubblicato su Strava" },
    whoop: { does: "In entrata sonno, recupero, HRV e battito a riposo" },
    withings: { does: "In entrata peso, massa grassa, sonno e passi" },
    polar: { does: "In entrata Nightly Recharge, HRV e sonno" },
    concept2: { does: "Sessioni RowErg, SkiErg e BikeErg in entrata come allenamenti cardio" },
    music: { does: "Apre musica adatta alla scelta di oggi" },
    sonos: { does: "Riproduci, pausa, salta e volume dall’allenamento; la musica segue serie e riposo" },
    calendar: {
      name: "Calendario del telefono (Google, iCloud, Outlook)",
      does: "Giorni di allenamento nel calendario e allenamenti adattati agli orari occupati",
    },
    ics: { name: "Qualsiasi calendario (file .ics)", does: "Giorni di allenamento come file di calendario" },
    import: { does: "La tua cronologia di allenamenti importata dal loro file di esportazione", link: "Come passare a Liftsmith" },
  },
};
