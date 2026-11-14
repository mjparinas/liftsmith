import type { FeaturesText } from "./types";

// The features page in German (du). English is src/content/features.ts plus en.ts; keep the same ids and {placeholders}.
// Fixed terms as in the app: Satz eintragen, Bereitschaft, Deload, Erholungskarte, Pause, Studio.

export const de: FeaturesText = {
  chrome: {
    title: "{name}: alle Funktionen und womit es funktioniert",
    description:
      "Alle Funktionen von {name}, welche kostenlos sind, die neuesten und eine Tabelle der Uhren, Gesundheits-Apps, Waagen und Dienste, mit denen es auf Android, iPhone und im Web funktioniert.",
    crumb: "Funktionen",
    h1: "Alle Funktionen von {name}",
    intro:
      "Alle {count} Funktionen, welche kostenlos sind, was womit funktioniert und was neu ist. Das meiste ist kostenlos; was Pro dazu bringt, steht bei den {pricing}.",
    pricing: "Preisen",
    onThisPage: "Auf dieser Seite",
    newestNav: "Neu",
    worksWithNav: "Funktioniert mit",
    newestH: "Die neuesten Funktionen",
    newestIntro: "Vor Kurzem dazugekommen, nach Bereich. Jede Änderung, auch Fehlerbehebungen, steht unter {whatsNew}.",
    whatsNew: "Neuigkeiten",
    midTitle: "Probier es selbst",
    midBody: "Kostenlos, ohne Konto. Dein erstes Training ist in unter einer Minute geplant.",
    midButton: "Kostenlos starten",
    worksH: "Womit {name} funktioniert",
    worksIntro:
      "Apps, Uhren und Geräte, und wo jedes funktioniert. „Über Health“ heißt, die Daten kommen über Health Connect auf Android oder Apple Health auf dem iPhone zu {name}. „Chrome“ heißt die Web-App in Chrome, das Web Bluetooth kann.",
    tableLabel: "Kompatibilitätstabelle",
    cols: { connection: "Verbindung", does: "Was es macht", android: "Android", iphone: "iPhone", web: "Web", plan: "Tarif" },
    footnote:
      "„Bald verfügbar“ heißt, es ist fertig und wartet auf seinen Store-Eintrag. „In Prüfung“ heißt, wir arbeiten daran, können es aber noch nicht versprechen, weil es von der Zustimmung des anderen Unternehmens abhängt. Fitnessdienste verbindest du über ein kostenloses {name}-Konto. Labs sind Experimente in Pro, die du unter Einstellungen › Labs einschaltest. Produktnamen sind Marken ihrer Inhaber.",
    endTitle: "Kostenlos starten, ohne Konto",
    endBody: "Dein erstes Training ist in unter einer Minute geplant. Keine Werbung, niemals.",
  },
  tiers: { free: "Kostenlos", pro: "Pro", both: "Kostenlos + Pro", lab: "Labs (Pro)" },
  where: { all: "Android, iPhone und Web", phones: "Android- und iPhone-App" },
  support: { yes: "Ja", no: "Nein", soon: "Bald verfügbar", investigating: "In Prüfung", chrome: "Chrome", health: "Über Health" },
  groups: {
    plan: {
      title: "Ein Plan, der sich anpasst",
      intro: "Das heutige Training entsteht aus deinem Studio, deiner Erholung und deinem Trainingsblock, und jede Zahl sagt, warum.",
    },
    workout: { title: "Das Training", intro: "Ein Tippen trägt einen Satz wie geplant ein. Alles andere wartet, bis du Pause machst." },
    progress: {
      title: "Fortschritt und Coaching",
      intro: "Zuerst, was du als Nächstes tun solltest. Zahlen erscheinen, wenn du etwas mit ihnen anfangen kannst.",
    },
    body: {
      title: "Körper und Gesundheit",
      intro: "Gewicht, Körperfett und Gesundheitswerte kommen von selbst, wo es geht, und werden zu Ratschlägen.",
    },
    programs: {
      title: "Programme, Routinen und Übungen",
      intro: "Folge einem klassischen Programm, baue eigene Routinen oder lass die App planen. Alles aus einer Bibliothek.",
    },
    gyms: { title: "Studios und Geräte", intro: "Jeder Plan beginnt mit den Geräten, die du wirklich hast." },
    friends: { title: "Freunde und Teilen", intro: "Trainiere mit Menschen, nicht für ein Publikum. Freunde ist kostenlos." },
    coaches: { title: "Für Coaches", intro: "Kunde von jemandem zu sein ist für alle kostenlos." },
    fun: { title: "Belohnungen", intro: "Ein bisschen Spaß, der nie einem Satz im Weg steht." },
    phone: { title: "Auf dem Handy und am Handgelenk", intro: "Liftsmith nutzt, was jedes Handy am besten kann." },
    data: { title: "Deine Daten", intro: "Funktioniert offline, ohne Konto, und deine Daten bleiben deine." },
    access: {
      title: "Aussehen, Bedienung und Sprachen",
      intro: "Angenehm für alle, einhändig im Studio oder auf einem großen Bildschirm zu Hause.",
    },
    labs: {
      title: "Labs",
      intro: "Experimente, die du mit Pro unter Einstellungen › Labs einschalten kannst. Sie können sich ändern oder wegfallen.",
    },
  },
  features: {
    adaptive: {
      name: "Tägliche adaptive Trainings",
      body: "Wählt Übungen, die dein Studio hergibt und für die deine Muskeln bereit sind, und legt jedes Gewicht und jede Wiederholung anhand deiner letzten Trainings fest.",
      proPart: "Ohne Pro bekommst du ein adaptives Training pro Woche neben deinem kostenlosen Programm; Pro plant jeden Tag.",
    },
    "pick-weights": {
      name: "Lernt die Übungen, die du magst",
      body: "Beliebte Übungen werden am häufigsten gewählt. Markiere eine mit einem Stern und sie kommt viel öfter; tausche eine aus und sie kommt ein paar Monate lang seltener.",
    },
    splits: {
      name: "Adaptive Splits",
      body: "Push, Pull, Beine oder Ober- und Unterkörper, trotzdem jeden Tag an deine Erholung angepasst.",
    },
    readiness: {
      name: "Die heutige Ansage",
      body: "Gas geben, wie geplant oder locker, nach Erholung, verpassten Wiederholungen und wie schwer sich deine letzten Sätze angefühlt haben. Du kannst sie immer ändern.",
    },
    "health-readiness": {
      name: "Schlaf und HRV bewegen die Ansage",
      body: "Schlaf, Herzfrequenzvariabilität, Ruhepuls und Atemfrequenz aus der Gesundheits-App deines Handys schieben die heutige Ansage nach oben oder unten.",
    },
    blocks: {
      name: "Trainingsblöcke und Deloads",
      body: "Vierwöchige Blöcke mit einem Ziel für Wiederholungen in Reserve, die in eine leichtere Woche münden, damit du weiter Fortschritte machst, ohne auszubrennen.",
    },
    why: {
      name: "Jede Empfehlung sagt, warum",
      body: "Jede Übung, Satzzahl, Wiederholungsvorgabe und jedes Gewicht hat einen kurzen Grund, auf dem Bildschirm, nie hinter einem Tippen versteckt.",
    },
    "short-on-time": {
      name: "Wenig Zeit",
      body: "Sag dem Training, dass du weniger Zeit hast, und es kürzt, was am wenigsten zählt.",
      proPart: "Um eine Bank oder ein Rack herumzuplanen, die gerade jemand anderes nutzt, ist Pro.",
    },
    injury: {
      name: "Verletzungsmodus",
      body: "Sag, was wehtut, und es lässt weg, was es verschlimmern würde, warnt dich vor riskanten Übungen und verfolgt einen Schmerzwert von 0 bis 10 über die Zeit.",
    },
    cycle: {
      name: "Bereitschaft nach Zyklus",
      body: "Wenn du möchtest, trägst du deinen Zyklus ein, und die heutige Ansage berücksichtigt ihn.",
    },
    "goal-planner": {
      name: "Zielplaner",
      body: "Wähle eine Übung und ein Ziel, und es berechnet ein realistisches Datum und den Weg dorthin.",
    },
    logger: {
      name: "Sätze mit einem Tippen eintragen",
      body: "Der nächste Satz ist immer schon ausgefüllt. Tasten, die beim Halten wiederholen, ändern Gewicht und Wiederholungen; Tippen ist nur der Notfall.",
    },
    "rest-timer": {
      name: "Pausentimer auf dem Sperrbildschirm",
      body: "Startet nach jedem Satz von selbst und zählt auf dem Sperrbildschirm herunter, mit dem nächsten Satz, den Scheiben, dem Puls und Tasten für Satz eintragen und +30 s, die auch bei geschlossener App funktionieren.",
      note: "Android: eine dauerhafte Benachrichtigung, ein Live Update unter Android 16 und Samsungs Now Bar. iPhone: eine Live-Aktivität auf dem Sperrbildschirm und in der Dynamic Island. Web: eine Benachrichtigung, solange die Seite offen ist.",
    },
    plates: {
      name: "Scheibenrechner",
      body: "Zeigt, welche Scheiben auf jede Seite kommen, berechnet für die Scheiben deines Studios, jede Größe in ihrer eigenen Farbe.",
    },
    warmups: {
      name: "Aufwärmsätze",
      body: "Steigernde Sätze für jede schwere Übung, damit du bereit bei deinem Arbeitsgewicht ankommst.",
    },
    demos: {
      name: "3D-Übungsdemos",
      body: "Jede Übung hat eine 3D-Figur, die die Bewegung mit dem passenden Gerät zeigt, mit Schritten zum Aufbau und Hinweisen.",
    },
    "set-types": { name: "Dropsätze und Rest-Pause", body: "Füge zwischen den Sätzen einen Dropsatz oder einen Rest-Pause-Satz hinzu." },
    "timed-sets": {
      name: "Satztimer für Halten, Tragen und Cardio",
      body: "Übungen auf Zeit wie Planks, Tragen, Hängen und Cardio bekommen einen Satztimer, auch auf dem Sperrbildschirm und den Uhren.",
    },
    "each-side": {
      name: "Pro Seite und pro Hand",
      body: "Einseitige Übungen sagen das, und Kurzhantelgewichte werden pro Hand angezeigt.",
    },
    swaps: {
      name: "Übungen tauschen",
      body: "Tausche jede Übung gegen eine, die dieselben Muskeln mit den Geräten deines Studios trainiert.",
    },
    "heart-rate": {
      name: "Live-Puls",
      body: "Verbinde einen Bluetooth-Brustgurt oder deine Uhr und sieh deinen Puls bei jedem Satz und jeder Pause.",
      note: "Web: nur Chrome.",
    },
    breathing: {
      name: "Box-Atmung in der Pause",
      body: "Eine Atemhilfe auf dem Pausenbildschirm, mit Vorlagen oder deinem eigenen Rhythmus.",
    },
    "voice-coach": {
      name: "Sprachcoach",
      body: "Spricht während des Trainings, etwa wenn die Pause vorbei ist, damit du nicht aufs Handy schauen musst.",
      note: "Android sagt das Pausenende auch bei gesperrtem Bildschirm an; iPhone und Web, solange die App offen ist.",
    },
    stretching: {
      name: "Dehnen",
      body: "48 Dehnübungen mit 3D-Demos: ein optionales Aufwärmen vorher, ein Cool-down danach oder eine Dehnroutine an jedem Tag.",
    },
    "workout-parts": {
      name: "Training in Teilen",
      body: "Ein Training kann Aufwärmen, Krafttraining und Cool-down nacheinander ablaufen lassen, mit Überspringen dazwischen. Sperrbildschirm und Uhr zeigen, in welchem Teil du bist, der Verlauf zeigt jeden Teil, und Dehntage ab 10 Minuten halten deine Serie. Routinen können ihr eigenes Aufwärmen und Cool-down enthalten, auch in geteilten Links und von deinem Coach. Die Coach-Hinweise lesen jeden Teil: Schmerzen nach der Reha, die nachlassen oder zunehmen, und ein Puls, der im Cool-down hoch bleibt. Die Reha von deiner Physiotherapie kann an den fälligen Tagen neben dem Krafttraining im selben Training laufen, und Cardio kann danach folgen, Gerät und Minuten mit einem Tippen gewählt.",
    },
    "workout-length": {
      name: "Die Trainingsdauer umfasst alle Teile",
      body: "Der Dauer-Regler auf Heute legt das ganze Training fest. Aufwärmen, Cardio, Reha oder Cool-down nehmen ihre Minuten vom Krafttraining, und ein schmaler Balken unter dem Regler zeigt, wohin die Zeit geht. Krafttraining behält mindestens 15 Minuten: Zuerst wird das Cardio kürzer, mit einer Zeile, die sagt, warum. An einem Tag mit Cardio und Dehnen schaltest du das Krafttraining aus, und Cardio bekommt seine Zeit.",
    },
    notes: {
      name: "Coach-Notizen",
      body: "Weist auf wachsende Ermüdung, eine stagnierende Übung, einen Muskel mit zu wenigen Sätzen, ein gefährdetes Wochenziel oder steigendes Körperfett hin, jeweils mit einer Sache, die du tun kannst, oft mit einem Tippen.",
    },
    plateau: {
      name: "Plateau-Detektiv",
      body: "Wenn eine Übung stagniert, nennt er die wahrscheinliche Ursache und eine dreiwöchige Lösung mit einem Tippen und sagt dir danach, ob sie gewirkt hat.",
    },
    "recovery-map": {
      name: "Erholungskarte",
      body: "Deine Muskeln leuchten auf einer 3D-Figur je nachdem, wie erholt sie sind. Tippe auf einen, um zu sehen, was das für heute bedeutet.",
    },
    "advanced-stats": {
      name: "Erweiterte Statistiken",
      body: "Wöchentliche Sätze pro Muskel gegenüber dem Ziel, Verläufe des Einwiederholungsmaximums und in welche Richtung jede Übung geht.",
    },
    bests: {
      name: "Bestleistungen und Verlauf",
      body: "Jede Bestleistung, jedes geschätzte Einwiederholungsmaximum, dein Kraftwert und jedes vergangene Training, ohne Grenze beim Verlauf.",
    },
    "calendar-history": {
      name: "Trainingskalender",
      body: "Ein Monatskalender vergangener Trainings unter Fortschritt, jeder Tag mit Namen.",
    },
    "edit-history": {
      name: "Vergangene Trainings bearbeiten und wiederholen",
      body: "Korrigiere einen Satz, füge eine Notiz hinzu, benenne ein Training oder mach es noch einmal, und jede Übung hat ihre eigene Seite mit ihrem Verlauf.",
    },
    "exercise-stats": {
      name: "Werte für jede Übung",
      body: "Tippe in der Bibliothek auf eine Übung und sieh deine Sätze, das insgesamt bewegte Gewicht, dein geschätztes Maximum und deinen Vergleich mit Trainierten deines Gewichts, Alters und Geschlechts nach veröffentlichten Kraftstandards.",
      proPart: "Die Diagramme von einer Woche bis zu einem Jahr gehören zu den erweiterten Statistiken von Pro.",
    },
    "log-past": {
      name: "Vergangenes Training eintragen",
      body: "Handy vergessen? Trag das Training hinterher ein, und es zählt wie jedes andere.",
    },
    recap: { name: "Monatsrückblick", body: "Ein kurzer Blick zurück auf deinen Monat, bereit zum Teilen." },
    body: {
      name: "Gewicht, Körperfett und Fotos",
      body: "Trage Gewicht und Körperfett ein oder lass sie über die Gesundheits-App deines Handys von deiner Waage kommen, und behalte Fortschrittsfotos auf deinem Handy.",
    },
    measurements: {
      name: "Körpermaße",
      body: "Neun Stellen in Zentimetern oder Zoll. Ein wachsender oder schrumpfender Bauchumfang wird zur Coach-Notiz, wenn es keinen Körperfettwert gibt.",
    },
    "body-figure": {
      name: "Eine 3D-Figur in deiner Form",
      body: "Schalte sie ein, und die Figuren unter Gesundheit, in der Erholungskarte und in den Übungsvorführungen übernehmen deinen Körperbau aus Größe, Gewicht, Körperfett und Umfängen.",
    },
    "health-twin": {
      name: "Gesundheitszwilling und Fitnessalter",
      body: "Schlaf, HRV, Ruhepuls, Schritte, Atemfrequenz und VO₂max an einem Ort, mit deinem Trend und einem Fitnessalter aus deiner VO₂max.",
      note: "Gesundheitswerte kommen von Health Connect auf Android und Apple Health auf dem iPhone. Die Web-App zeigt Gewicht, Körperfett, BMI und Kalorien.",
    },
    "fitness-tests": {
      name: "Fitnesstests",
      body: "Toter Hang, Einbeinstand und 30-Sekunden-Aufstehtest vom Stuhl, jeweils mit Timer, einem typischen Bereich und dem, was hilft.",
    },
    food: {
      name: "Coach-Notizen aus deiner Ernährungs-App",
      body: "Kalorien und Eiweiß aus einer Ernährungs-App kommen über die Gesundheits-App deines Handys zu Liftsmith und werden zu Notizen wie „drei Tage in Folge zu wenig Eiweiß“. Die App selbst erfasst keine Ernährung.",
    },
    "your-stats": {
      name: "Deine Angaben",
      body: "Ein Ort für Geschlecht, Alter und Größe, den jedes Tool liest, auf dem iPhone aus Apple Health übernommen.",
    },
    "fixed-programs": {
      name: "Klassische Programme",
      body: "Klassisches 5×5, Einsteiger-3×5, 5×5 plus Arme, steigerndes 5×5, gestufte Progression, Trainingsmaximum-Wellen, Körpergewichts-Skills und Ganzkörper mit Kurzhanteln. Das kostenlose Programm passt zu deinem Studio.",
    },
    routines: {
      name: "Eigene Routinen",
      body: "Baue Routinen aus dem Übungskatalog, so viele du willst, und teile sie als Link.",
    },
    library: {
      name: "1.000 Übungen",
      body: "Kraft, Körpergewicht, Maschinen, Bänder, Kettlebells und Cardio, mit Suche, Muskel-Filtern und einem Filter für dieses Studio. Cardio speichert Zeit und Strecke.",
    },
    remix: { name: "Remix-Links", body: "Schick einem Freund ein Training als Link, das er selbst machen kann." },
    gyms: {
      name: "Deine Studios und ihre Geräte",
      body: "Richte jedes Studio einmal ein: Stangen, Scheiben, Kurzhanteln und Kettlebells, wie sie wirklich sind, Maschinen und ihre Einstellungen.",
    },
    "gym-location": { name: "Studio nach Standort", body: "Wählt das richtige Studio, wenn du ankommst." },
    "gym-share": {
      name: "Studio-Ausstattung teilen",
      body: "Schick die Geräte deines Studios als Link, damit dein Trainingspartner mit derselben Ausstattung startet.",
    },
    "gym-finder": {
      name: "Studiosuche und Studioseiten",
      body: "Finde Studios in deiner Nähe auf einer Karte mit der Liste darunter, offizielle zuerst, jedes mit eigener Seite: Geräte, Öffnungszeiten, Karte und Mitglieder. Inhaber können ihr Studio beanspruchen und Logo und Fotos hinzufügen. Ein Studio fehlt? Füge es hinzu. Betreiber sehen, wie viele Sportler es hinzugefügt oder das Plakat gescannt haben, und was als Nächstes zu tun ist. Offizielle Studios können einen Club mit wöchentlicher Rangliste führen.",
    },
    "gym-amenities": {
      name: "Ausstattung und Preise auf Studioseiten",
      body: "Betreiber zeigen, was es neben den Geräten gibt (Duschen, Parkplätze, Zugang rund um die Uhr, Frauenbereich und mehr) und was Tageskarte, Wochenkarte oder Mitgliedschaft kosten.",
    },
    "gym-news": {
      name: "Ankündigungen deines Studios",
      body: "Offizielle Studios veröffentlichen Feiertagszeiten, neue Geräte oder geänderte Kurse auf ihrer Seite, und die Mitglieder ihres Clubs bekommen eine Mitteilung.",
    },
    "gym-problems": {
      name: "Kaputte Geräte melden",
      body: "Sag deinem Studio, dass ein Gerät kaputt ist oder fehlt. Alle, die dort trainieren, bekommen einen Plan ohne es, und der Betreiber sieht es mit einem Knopf für Repariert.",
    },
    "gym-trainers": {
      name: "Trainer auf Studioseiten",
      body: "Coaches zeigen sich in den Studios, in denen sie ihre Kunden trainieren, mit einer Zeile über sich und einem Knopf, um mit ihnen zu trainieren. Bei einem offiziellen Studio gibt der Betreiber sie zuerst frei.",
    },
    "gym-staff": {
      name: "Teamkonten für Studios",
      body: "Der Inhaber eines offiziellen Studios lädt Leitung und Empfangsteam mit einem Einmal-Link ein. Alle halten mit ihrem eigenen Konto die Seite, Ankündigungen und gemeldete Probleme aktuell.",
    },
    "gym-starter": {
      name: "Einsteigerprogramme der Studios",
      body: "Offizielle Studios empfehlen neuen Mitgliedern ein Programm auf ihrer Seite in der App und im Web, mit einem Tippen gespeichert. Liftsmith setzt die eigenen Gewichte ein.",
    },
    "buy-next": {
      name: "Was du als Nächstes kaufst",
      body: "Für Heimstudios: das eine Gerät, das die meisten neuen Übungen ermöglichen würde.",
    },
    feed: {
      name: "Freunde-Feed",
      body: "Folge Leuten und sieh ihre Trainings, mit Likes, Kommentaren, Antworten und @Erwähnungen, und entscheide, wer jedes deiner Trainings sieht.",
    },
    cheers: {
      name: "Gerade am Trainieren und Anfeuern",
      body: "Sieh, wer gerade trainiert, und schick einen Anfeuerungsruf, der über den Trainingsbildschirm schwebt.",
    },
    challenges: {
      name: "Challenges, Clubs und Bestenlisten",
      body: "Fordere einen Freund heraus, tritt einem Club oder der Crew deines Studios mit Wochenrangliste bei und nimm mit allen die Monats-Challenge an.",
    },
    profiles: { name: "Öffentliche Profile", body: "Eine optionale öffentliche Seite mit deinen besten Lifts und Trainings." },
    safety: {
      name: "Blockieren, stummschalten und melden",
      body: "Blockiere oder schalte jeden stumm und melde einen Post, einen Kommentar oder ein Profil mit einem Tipp auf den Grund. Unser Team prüft jede Meldung und kann verwarnen, vorübergehend sperren oder ausschließen.",
    },
    share: {
      name: "Teilkarten und Links",
      body: "Teile ein Training, eine neue Bestleistung oder einen Meilenstein als Bild oder als öffentlichen Link mit Vorschau.",
    },
    coaching: {
      name: "Kunden coachen",
      body: "Verknüpfe Kunden, sieh ihre Ergebnisse und weise ihnen Routinen zu, am Handy oder auf einem großen Bildschirm.",
    },
    "coach-chat": {
      name: "Chat, Hinweise und Körperdaten",
      body: "Schreib jedem Kunden, erhalte eine Mitteilung, wenn er trainiert oder eine Woche pausiert, und sieh Wiegen, Umfänge und eine danach geformte 3D-Figur, wenn er sie teilt.",
      note: "Mitteilungen gibt es auf Android und iPhone. Die Web-App zeigt neue Nachrichten, wenn sie offen ist.",
    },
    physio: {
      name: "Für Physiotherapie und Reha",
      body: "Weise sanfte Reha-Programme mit Häufigkeit pro Woche zu, sieh, wie oft deine Klienten sie einhalten, und sieh Schmerzen und Verletzungen, die sie teilen, Übung für Übung, mit einer Benachrichtigung bei starken Schmerzen.",
      note: "Liftsmith zeigt, was Klienten eintragen. Es stellt keine Diagnosen und behandelt nichts.",
    },
    "coach-nutrition": {
      name: "Ernährungsziele für Kunden",
      body: "Lege für jeden Kunden Kalorien und Protein pro Tag fest. Die Coach-Hinweise prüfen die Ernährungswoche daran, und du siehst, wie er isst, wenn er es teilt.",
    },
    "school-teams": {
      name: "Kostenlos für Schulteams",
      body: "Trainer an weiterführenden Schulen, die eine Schul-E-Mail-Adresse bestätigen, bekommen Pro kostenlos, ebenso die 13- bis 18-jährigen Sportler ihrer Teams, mit einer wöchentlichen Teamtabelle. Körperfett und öffentliche Profile bleiben für unter 18-Jährige aus.",
    },
    "coach-checkins": {
      name: "Check-in-Formulare und Fragebögen",
      body: "Schick Kunden einen wöchentlichen Check-in, einen Aufnahmefragebogen oder dein eigenes Formular, einmal oder jede Woche. Sie antworten mit wenigen Tipps, und ein niedriger Wert oder eine fehlende Antwort steht oben in ihrem Bericht.",
    },
    "coach-roles": {
      name: "Für Personal Trainer und Coaches",
      body: "Sag, ob du als Personal Trainer einzeln arbeitest oder als Coach Gruppen und Teams betreust. Kunden sehen das richtige Wort, und deine wichtigsten Werkzeuge stehen vorn.",
    },
    "coach-booking": {
      name: "Termine buchen und planen",
      body: "Gib freie Zeiten frei, einmal oder jede Woche, und Kunden buchen sie in der App, oder buch sie selbst ein. Dein Plan ist ein Monatskalender: Tipp auf einen Tag und du siehst, wer gebucht hat und was noch frei ist. Beide bekommen eine Benachrichtigung, ein Termin am nächsten Tag steht auf Heute und landet mit einem Tipp im Kalender.",
    },
    "coach-payments": {
      name: "Kundenzahlungen über Stripe",
      body: "Verbinde dein eigenes Stripe-Konto und leg für jeden Kunden einen Preis fest, pro Einheit oder monatlich. Kunden zahlen auf der sicheren Seite von Stripe, das Geld geht direkt an dich, und eine fehlgeschlagene Monatszahlung steht oben in ihrem Bericht.",
    },
    "coach-sharing": {
      name: "Kunden wählen, was ihr Coach sieht",
      body: "Das Training wird immer geteilt. Herzfrequenz, Workout-Notizen, Form und Erholung, Körperdaten, Schmerzen und Verletzungen sowie der Zyklus sind je ein Schalter, den Kunden für jeden Coach umlegen, bei der Zustimmung oder jederzeit danach. Fotos und Studios bleiben immer privat.",
      proPart: "Kunde zu sein ist kostenlos; Kunden zu betreuen ist Pro.",
    },
    "coach-pages": {
      name: "Eine Seite für jede Seite",
      body: "Kunden sehen nur ihren Coach: mit einem Tippen schreiben, Check-ins beantworten, Termine buchen und selbst wählen, was sie teilen. Coaches bekommen eine Seite pro Aufgabe, mit Kunden, Nachrichten, Terminen, Check-ins und Zahlungen als Tabs, im Web und auf dem Handy.",
      proPart: "Kunde zu sein ist kostenlos; Kunden zu betreuen ist Pro.",
    },
    "coach-plans": {
      name: "Coach-Pläne, die mit deiner Kundenliste wachsen",
      body: "Pro deckt bis zu 3 Kunden ab. Coach bietet Platz für 25 und Coach Plus hat keine feste Grenze, mit jedem Coaching-Werkzeug in jedem Plan. Deine Kunden trainieren immer kostenlos, und Liftsmith behält nichts von dem ein, was sie dir zahlen.",
    },
    awards: {
      name: "Erfolge, Level und Serien",
      body: "Abzeichen in Stufen, 50 Level mit Belohnungen, Wochenaufgaben, Serienschutz und ehrliche Ligen.",
    },
    locker: {
      name: "Designs, Akzentfarben und App-Symbole",
      body: "Verdiene Designs und Akzentfarben und auf den Handys ein App-Symbol in den Farben deines Designs.",
      note: "Verdiente App-Symbole gibt es nur auf Android und iPhone.",
    },
    watch: {
      name: "Uhren-Apps",
      body: "Das Training auf Wear OS und der Apple Watch: der Satz oder der Pausen-Countdown, der Puls der Uhr, Satz eintragen und +30 s, und ein Vibrieren, wenn die Pause endet.",
    },
    widgets: {
      name: "Widget für den Startbildschirm",
      body: "Die heutige Ansage, dein Wochenziel, eine Coach-Notiz und Starten oder Satz eintragen auf dem Startbildschirm.",
      note: "Die Web-App hat stattdessen Kurzbefehle auf ihrem Startbildschirm-Symbol.",
    },
    shortcuts: {
      name: "Schnelleinstellungen, Siri und Kurzbefehle",
      body: "Starte ein Training über eine Kachel in den Schnelleinstellungen auf Android oder über das Kontrollzentrum und Siri auf dem iPhone.",
    },
    calendar: {
      name: "Kalender",
      body: "Trägt deine Trainingstage in deinen Kalender ein und kann ein Training kürzen, damit es vor deinen nächsten Termin passt.",
      note: "Die Web-App lädt stattdessen eine .ics-Datei herunter.",
    },
    reminders: {
      name: "Erinnerungen",
      body: "Sanfte Erinnerungen an Trainingstagen, als Benachrichtigung auf den Handys und per E-Mail.",
    },
    cloud: {
      name: "Verbindungen zu Fitnessdiensten",
      body: "Oura liefert Schlaf, HRV, Ruhepuls und Schritte, über ein kostenloses Konto. Strava, WHOOP, Withings, Polar und Concept2 prüfen wir gerade.",
    },
    "health-save": {
      name: "Trainings in deiner Gesundheits-App",
      body: "Jedes beendete Training wird als Krafttraining in Health Connect oder Apple Health gespeichert, mit Kalorien und Puls.",
    },
    offline: {
      name: "Funktioniert offline",
      body: "Alles läuft auf deinem Gerät und synchronisiert sich im Hintergrund, also ist kein Empfang im Kellerstudio kein Problem.",
    },
    sync: {
      name: "Konten und Synchronisierung",
      body: "Eine optionale Anmeldung mit Google, Apple oder einem Code per E-Mail hält Handy, Tablet und Web-App auf demselben Stand.",
    },
    backup: {
      name: "Sicherung und Export",
      body: "Speichere jederzeit eine Sicherungsdatei oder exportiere deine Trainings als Tabelle.",
    },
    import: {
      name: "Aus einer anderen App importieren",
      body: "Hol deinen Verlauf aus Strong, Hevy, Fitbod, StrongLifts, JEFIT oder FitNotes mit deren Exportdatei herüber, Cardio inklusive.",
    },
    importExtras: {
      name: "Routinen und Körperwerte aus einer anderen App",
      body: "Ein Import macht Trainings, die du unter demselben Namen wiederholt hast, zu Routinen und holt Körpergewicht, Körperfett und Maße aus Hevy, FitNotes oder einer Waagen-App.",
    },
    languages: {
      name: "Sechs Sprachen",
      body: "Englisch, Spanisch, Französisch, Deutsch, Italienisch und Japanisch, passend zur Sprache deines Handys.",
    },
    appearance: {
      name: "Dunkel, hell oder wie dein Handy",
      body: "Standardmäßig dunkel, hell oder so, wie dein Handy eingestellt ist.",
    },
    a11y: {
      name: "Barrierefreiheit",
      body: "Größere Schrift bis 150 %, farbenblindsichere Farben, mehr Kontrast, Screenreader-Unterstützung und volle Tastaturbedienung, geprüft nach WCAG 2.2 AA.",
    },
    "one-hand": {
      name: "Einhändige Bedienung",
      body: "Leg die Tasten für Gewicht und Wiederholungen neben Satz eintragen, unter deinen linken oder rechten Daumen.",
    },
    lean: {
      name: "Schlichter Modus, Töne und Vibration",
      body: "Schalte Animationen und Konfetti, Töne oder Vibration ab, jeweils mit einem Schalter.",
    },
    "lite-demos": {
      name: "Akkusparen bei 3D-Figuren",
      body: "Zeigt die Übungsdemos und die Erholungskarte mit geringerer Auflösung und Bildrate, für ältere Handys und mehr Akkulaufzeit.",
    },
    desktop: {
      name: "Desktop-Ansicht",
      body: "Am Computer hat die Web-App eine Seitenleiste, breite Seiten, Tastenkürzel während des Trainings (L trägt den Satz ein) und einen breiten Routinen-Editor.",
      note: "Web-App in einem breiten Fenster mit Maus; Handys und Tablets behalten die Handy-Ansicht.",
    },
    "lab-rep-count": {
      name: "Wiederholungen per Kamera zählen",
      body: "Stell dein Handy auf, und die Kamera zählt deine Wiederholungen, mit dem Skelett über dem Bild. Nichts verlässt dein Handy.",
    },
    "lab-bar-speed": {
      name: "Hantelgeschwindigkeit per Kamera",
      body: "Zeigt, wie schnell sich die Stange bewegt und wann sie langsam genug ist, um den Satz zu beenden.",
    },
    "lab-form": {
      name: "Technikcheck per Kamera",
      body: "Erkennt Kniebeugen über der Parallele, verkürzte Wiederholungen und seitliches Lehnen und gibt zwischen den Sätzen einen Tipp.",
    },
    "lab-speed-max": {
      name: "Tagesmaximum aus dem Aufwärmen",
      body: "Nutzt die Hantelgeschwindigkeit deiner Aufwärmsätze, um ein etwas schwereres oder leichteres erstes Arbeitsgewicht vorzuschlagen.",
    },
    "lab-bar-path": {
      name: "Hantelweg-Wiederholung",
      body: "Spielt eine Wiederholung von Kniebeuge, Kreuzheben oder Schulterdrücken mit dem eingezeichneten Weg der Stange ab, und einen Hinweis, falls sie abgewichen ist.",
    },
    "lab-motion": {
      name: "Wiederholungen per Handybewegung zählen",
      body: "Zählt Wiederholungen mit den Bewegungssensoren des Handys, wenn es sich mit dir bewegt.",
      note: "Handys und Tablets mit Bewegungssensoren.",
    },
    "lab-watch-reps": {
      name: "Wiederholungen per Uhr zählen",
      body: "Deine Wear-OS-Uhr oder Apple Watch zählt die Wiederholungen an deinem Handgelenk.",
    },
    "lab-hands-free": {
      name: "Freihändige Sätze",
      body: "Während ein Wiederholungszähler zählt, trägt sich der Satz ein paar Sekunden nach deiner letzten Wiederholung selbst ein.",
    },
    "lab-voice": {
      name: "Sätze per Sprache eintragen",
      body: "Sag „100 für 8“ oder „zu leicht“, um einen Satz einzutragen. Erkannt auf deinem Gerät; kein Ton verlässt es.",
      note: "Web: Chrome 139 oder neuer.",
    },
    "lab-volume": {
      name: "Lautstärketaste trägt einen Satz ein",
      body: "Drück Lauter am Handy oder an deinen Kopfhörern, um den Satz einzutragen.",
    },
    "lab-tempo": {
      name: "Tempo-Coach",
      body: "Bei Tempo- und Pausenübungen zählt er Absenken, Halten und Heben jeder Wiederholung mit Ton und Vibration.",
    },
    "lab-hr-rest": {
      name: "Pausentimer nach Puls",
      body: "Beendet die Pause früher, sobald dein Puls wieder unten ist, nie unter 60 % der geplanten Pause.",
    },
    "lab-machines": {
      name: "Bluetooth-Fitnessgeräte",
      body: "Räder, Rudergeräte, Laufbänder und Crosstrainer tragen Zeit, Strecke und Leistung eines Cardio-Satzes ein.",
      note: "Web: nur Chrome.",
    },
    "lab-scale": {
      name: "Bluetooth-Waage",
      body: "Stell dich auf eine kompatible Waage, und die Wiegung füllt Gewicht und Körperfett aus, damit du sie prüfst und einträgst.",
      note: "Web: nur Chrome.",
    },
    "lab-sonos": {
      name: "Sonos",
      body: "Steuere einen Sonos-Lautsprecher aus dem Training, mit einer Lautstärke für Sätze und einer anderen für Pausen.",
    },
    "now-playing": {
      name: "Musiksteuerung",
      body: "Spiele, pausiere und überspringe deine Musik auf Heute und während des Trainings, mit dem Song und der App, die ihn spielt. Du kannst sie in den Einstellungen ausschalten.",
      note: "iPhone: nur Apple Music, weil Apple Apps keine anderen Musik-Apps steuern lässt.",
    },
  },
  connectionGroups: {
    health: "Gesundheits-Apps",
    watches: "Uhren und Puls",
    bluetooth: "Bluetooth-Geräte (Labs)",
    services: "Fitnessdienste (kostenloses Konto nötig)",
    music: "Musik und Lautsprecher",
    other: "Kalender und andere Apps",
  },
  connections: {
    "health-connect": {
      does: "Gewicht, Körperfett, Schlaf, HRV, Puls, Schritte und Ernährung rein; beendete Trainings raus",
    },
    "apple-health": {
      does: "Gewicht, Körperfett, Schlaf, HRV, Puls, Schritte, Ernährung, Größe, Alter und Geschlecht rein; beendete Trainings raus",
    },
    "samsung-health": { does: "Seine Werte, sobald du sie mit Health Connect teilst" },
    "health-devices": {
      name: "Fitbit, Garmin Connect, smarte Waagen, Hume Body Pod",
      does: "Alles, was sie in die Gesundheits-App deines Handys schreiben",
    },
    "wear-os": { name: "Wear-OS-Uhren", does: "Das Training am Handgelenk, Puls, Satz eintragen und +30 s" },
    "apple-watch": { does: "Das Training am Handgelenk, Puls, Satz eintragen und +30 s" },
    garmin: { name: "Garmin-Uhren (Connect IQ)", does: "Das Training am Handgelenk mit der Liftsmith-Uhren-App" },
    "hr-strap": {
      name: "Bluetooth-Brustgurte",
      does: "Live-Puls bei Sätzen und Pausen (jeder Gurt oder jedes Armband, das Standard-Bluetooth-Herzfrequenz teilt)",
    },
    scale: {
      name: "Bluetooth-Waagen",
      does: "Gewicht und Körperfett bei der Wiegung (Waagen, die den Standarddienst Weight Scale oder Body Composition teilen)",
      link: "Kompatible Waagen",
    },
    machines: {
      name: "Bluetooth-Fitnessgeräte",
      does: "Zeit, Strecke und Leistung von Rädern, Rudergeräten, Laufbändern und Crosstrainern, die den Standarddienst Fitness Machine teilen",
    },
    oura: { does: "Schlaf, HRV, Ruhepuls und Schritte rein" },
    strava: { does: "Jedes beendete Training wird auf Strava gepostet" },
    whoop: { does: "Schlaf, Erholung, HRV und Ruhepuls rein" },
    withings: { does: "Gewicht, Körperfett, Schlaf und Schritte rein" },
    polar: { does: "Nightly Recharge, HRV und Schlaf rein" },
    concept2: { does: "RowErg-, SkiErg- und BikeErg-Einheiten als Cardio-Trainings rein" },
    "music-apps": {
      name: "Spotify, YouTube Music und andere Musik-Apps",
      does: "Abspielen, pausieren und überspringen auf Heute und im Training, mit dem Songtitel",
    },
    "apple-music": { does: "Abspielen, pausieren und überspringen auf Heute und im Training, mit dem Songtitel" },
    sonos: { does: "Abspielen, Pause, Überspringen und Lautstärke aus dem Training; die Musik folgt Sätzen und Pausen" },
    calendar: {
      name: "Handykalender (Google, iCloud, Outlook)",
      does: "Trainingstage in deinem Kalender und Trainings, die um belegte Zeiten herum passen",
    },
    ics: { name: "Jeder Kalender (.ics-Datei)", does: "Trainingstage als Kalenderdatei" },
    import: { does: "Dein Trainingsverlauf, importiert aus ihrer Exportdatei", link: "So wechselst du" },
  },
};
