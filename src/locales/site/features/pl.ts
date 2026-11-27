import type { FeaturesText } from "./types";

// The features page in Polish (ty). English is src/content/features.ts plus en.ts; keep the same ids and {placeholders}.

export const pl: FeaturesText = {
  chrome: {
    title: "Funkcje {name} i z czym współpracuje",
    description:
      "Wszystkie funkcje {name}: które są darmowe, co nowego i tabela zegarków, aplikacji zdrowotnych, wag i usług, z którymi działa na Androidzie, iPhonie i w przeglądarce.",
    crumb: "Funkcje",
    h1: "Wszystkie funkcje {name}",
    intro:
      "Wszystkie funkcje ({count}): które są darmowe, co z czym współpracuje i co nowego. Większość jest za darmo; co dodaje Pro, sprawdzisz w {pricing}.",
    pricing: "cenniku",
    onThisPage: "Na tej stronie",
    newestNav: "Nowości",
    worksWithNav: "Współpracuje z",
    newestH: "Najnowsze funkcje",
    newestIntro: "Dodane ostatnio, według kategorii. Każda zmiana, także poprawki, jest w zakładce {whatsNew}.",
    whatsNew: "Co nowego",
    midTitle: "Sprawdź sam",
    midBody: "Za darmo i bez konta. Twój pierwszy trening będzie zaplanowany w niecałą minutę.",
    midButton: "Zacznij za darmo",
    worksH: "Z czym współpracuje {name}",
    worksIntro:
      "Aplikacje, zegarki i urządzenia oraz gdzie każde z nich działa. „Przez Zdrowie” oznacza, że dane trafiają do {name} przez Health Connect na Androidzie lub Apple Zdrowie na iPhonie. „Chrome” oznacza aplikację webową w Chrome, która obsługuje Web Bluetooth.",
    tableLabel: "Tabela zgodności",
    cols: {
      connection: "Połączenie",
      does: "Co robi",
      android: "Android",
      iphone: "iPhone",
      web: "Przeglądarka",
      plan: "Plan",
    },
    footnote:
      "„Wkrótce” oznacza, że funkcja jest gotowa i czeka na wpis w sklepie. „Sprawdzamy” oznacza, że nad nią pracujemy, ale nie możemy jeszcze niczego obiecać, bo zależy od zgody drugiej firmy. Usługi fitness łączą się przez darmowe konto {name}. Laboratorium to eksperymenty w Pro, które włączasz w Ustawienia › Laboratorium. Nazwy produktów są znakami towarowymi ich właścicieli.",
    endTitle: "Zacznij za darmo, bez konta",
    endBody: "Twój pierwszy trening będzie zaplanowany w niecałą minutę. Bez reklam, nigdy.",
  },
  tiers: {
    free: "Darmowy",
    pro: "Pro",
    both: "Darmowy + Pro",
    lab: "Laboratorium (Pro)",
  },
  where: {
    all: "Android, iPhone i przeglądarka",
    phones: "Aplikacje na Androida i iPhone'a",
  },
  support: {
    yes: "Tak",
    no: "Nie",
    soon: "Wkrótce",
    investigating: "Sprawdzamy",
    chrome: "Chrome",
    health: "Przez Zdrowie",
  },
  groups: {
    plan: {
      title: "Plan, który się dopasowuje",
      intro: "Dzisiejszy trening powstaje z twojej siłowni, regeneracji i bloku treningowego, a każda liczba mówi, skąd się wzięła.",
    },
    workout: {
      title: "Trening",
      intro: "Jedno dotknięcie zapisuje serię zgodnie z planem. Cała reszta czeka na przerwę.",
    },
    progress: {
      title: "Postępy i wskazówki",
      intro: "Najpierw to, co zrobić dalej. Liczby pojawiają się wtedy, gdy możesz na ich podstawie działać.",
    },
    body: {
      title: "Ciało i zdrowie",
      intro: "Ważenia, tkanka tłuszczowa i odczyty zdrowotne trafiają do aplikacji same, gdzie to możliwe, i zamieniają się w rady.",
    },
    programs: {
      title: "Programy, rutyny i ćwiczenia",
      intro: "Trzymaj się klasycznego programu, buduj własne rutyny albo zostaw planowanie aplikacji. Wszystko z jednej biblioteki.",
    },
    gyms: {
      title: "Siłownie i sprzęt",
      intro: "Każdy plan zaczyna się od sprzętu, który naprawdę masz.",
    },
    friends: {
      title: "Znajomi i udostępnianie",
      intro: "Trenuj z ludźmi, nie dla publiczności. Znajomi są za darmo.",
    },
    coaches: {
      title: "Dla trenerów",
      intro: "Bycie czyimś podopiecznym jest darmowe dla każdego.",
    },
    fun: {
      title: "Nagrody",
      intro: "Trochę zabawy, która nigdy nie przeszkadza w serii.",
    },
    phone: {
      title: "Na telefonie i nadgarstku",
      intro: "Liftsmith korzysta z tego, co każdy telefon robi najlepiej.",
    },
    data: {
      title: "Twoje dane",
      intro: "Działa offline, bez konta, a twoje dane pozostają twoje.",
    },
    access: {
      title: "Wygląd, obsługa i języki",
      intro: "Wygodnie dla każdego: jedną ręką na siłowni albo na dużym ekranie w domu.",
    },
    labs: {
      title: "Laboratorium",
      intro: "Eksperymenty, które użytkownicy Pro mogą włączyć w Ustawienia › Laboratorium. Mogą się zmienić albo zniknąć.",
    },
  },
  features: {
    "gym-widgets": {
      name: "Widżety na stronę Twojej siłowni",
      body: "Oficjalne siłownie pokazują grafik zajęć, sprzęt albo odznakę „Znajdź nas w Liftsmith” na własnej stronie jedną linijką kodu. Aktualizują się same, w wybranym języku i wyglądzie, i prowadzą do strony siłowni.",
      note: "Żadnych skryptów, plików cookie ani śledzenia na stronie siłowni.",
    },
    "gym-insights": {
      name: "Statystyki dla właścicieli siłowni",
      body: "Właściciele i personel oficjalnych siłowni widzą, ile osób trenowało tam w ostatnich czterech tygodniach, godziny tłoku i spokoju, używany sprzęt i otwarte zgłoszenia, z jednym następnym krokiem.",
      note: "Tylko sumy i udziały, od osób, które liczą swoje wizyty, i dopiero gdy trenowało tam pięć osób.",
    },
    adaptive: {
      name: "Codzienne adaptacyjne treningi",
      body: "Wybiera ćwiczenia, które da się zrobić na twojej siłowni i na które twoje mięśnie są gotowe, a potem ustala każdy ciężar i liczbę powtórzeń na podstawie ostatnich treningów.",
      proPart: "W wersji darmowej masz jeden adaptacyjny trening tygodniowo obok darmowego programu; Pro planuje każdy dzień.",
    },
    "auto-supersets": {
      name: "Automatyczne superserie",
      body: "Włącz superserie, a plan adaptacyjny połączy ćwiczenia, które nie angażują tych samych mięśni, jak wyciskanie i wiosłowanie, z krótszą przerwą po każdej rundzie, więc w twoim czasie zmieści się więcej. Ciężkie przysiady i martwe ciągi zostają osobno, a serie rozgrzewkowe możesz też wyłączyć.",
    },
    "pick-weights": {
      name: "Uczy się ćwiczeń, które lubisz",
      body: "Popularne ćwiczenia wybiera najczęściej. Oznacz ćwiczenie gwiazdką, a będzie pojawiać się dużo częściej; zamień je na inne, a pojawi się rzadziej, i to stopniowo słabnie przez kilka miesięcy.",
    },
    splits: {
      name: "Adaptacyjne splity",
      body: "Push, pull, nogi albo góra i dół, a i tak każdego dnia dopasowane do twojej regeneracji.",
    },
    readiness: {
      name: "Decyzja na dziś",
      body: "Mocniej, zgodnie z planem albo lżej, na podstawie regeneracji, niezrobionych powtórzeń i tego, jak ciężkie były ostatnie serie. Zawsze możesz to zmienić.",
    },
    "health-readiness": {
      name: "Sen i HRV wpływają na decyzję",
      body: "Sen, zmienność rytmu serca, tętno spoczynkowe i częstość oddechu z aplikacji zdrowotnej w telefonie podnoszą albo obniżają decyzję na dziś.",
    },
    blocks: {
      name: "Bloki treningowe i deload",
      body: "Czterotygodniowe bloki z docelowym zapasem powtórzeń, które przechodzą w lżejszy tydzień, dzięki czemu robisz postępy bez wypalenia.",
    },
    why: {
      name: "Każda rekomendacja mówi dlaczego",
      body: "Każde ćwiczenie, liczba serii, docelowe powtórzenia i ciężar mają krótkie uzasadnienie, widoczne na ekranie, nigdy ukryte za dotknięciem.",
    },
    "short-on-time": {
      name: "Mało czasu",
      body: "Powiedz, że masz mniej czasu, a trening wytnie to, co najmniej ważne.",
      proPart: "Omijanie ławki czy klatki, którą zajął ktoś inny, jest w Pro.",
    },
    injury: {
      name: "Tryb kontuzji",
      body: "Powiedz, co boli, a aplikacja pominie to, co mogłoby to pogorszyć, ostrzeże przed ryzykownymi ćwiczeniami i będzie śledzić ból w skali od 0 do 10.",
    },
    "rehab-done": {
      name: "Rehabilitacja od fizjoterapeuty, odhaczona",
      body: "Program od fizjoterapeuty czeka na ekranie Dziś, zapisujesz go jednym dotknięciem i od razu notuje kontuzję, której dotyczy. Trzyma się zaleconej liczby razy w tygodniu, pokazuje się w dni wolne i pyta o ból tylko przy tej kontuzji.",
      note: "Przypomnienia o rehabilitacji i powiadomienie o nowym programie są na Androidzie i iPhonie.",
    },
    "rehab-self": {
      name: "Łagodna rehabilitacja bez fizjoterapeuty",
      body: "Zapisujesz kontuzję i nie masz fizjoterapeuty? Kontuzje i notatka coacha proponują krótką rutynę z ciężarem ciała do zrobienia w domu. To punkt wyjścia, nie leczenie.",
    },
    "rehab-end": {
      name: "Gdy fizjoterapeuta zabiera program",
      body: "Jeśli fizjoterapeuta zabiera program, Dziś pyta, czy go zatrzymać, czy ćwiczyć dalej na własną rękę. Zatrzymanie usuwa rutynę i jej przypomnienia.",
    },
    cycle: {
      name: "Gotowość z uwzględnieniem cyklu",
      body: "Jeśli chcesz, zapisuj cykl, a decyzja na dziś weźmie go pod uwagę.",
    },
    pregnancy: {
      name: "Tryb ciąży i połogu",
      body: "Powiedz, że jesteś w ciąży albo urodziłaś, a każdy trening dopasuje się do tygodnia: lżejsze ciężary, żadnych serii do upadku, w późnej ciąży nic na plecach i stopniowy powrót przez około 16 tygodni po porodzie.",
    },
    "goal-planner": {
      name: "Planer celów",
      body: "Wybierz ćwiczenie i cel, a aplikacja wyznaczy realną datę i drogę do niego.",
    },
    logger: {
      name: "Zapis serii jednym dotknięciem",
      body: "Następna seria jest zawsze wypełniona. Ciężar i powtórzenia zmieniasz przyciskami, które przytrzymane powtarzają krok; wpisywanie to tylko awaryjna opcja.",
    },
    "rest-timer": {
      name: "Minutnik przerwy na ekranie blokady",
      body: "Startuje sam po każdej serii i odlicza na ekranie blokady razem z następną serią, talerzami, tętnem i przyciskami Zapisz serię i +30 s, które działają przy zamkniętej aplikacji. Delikatna wibracja 10 sekund przed końcem daje czas, żeby się przygotować, na telefonie i na zegarku.",
      note: "Android: stałe powiadomienie, Live Update na Androidzie 16 i Now Bar Samsunga. iPhone: Live Activity na ekranie blokady i w Dynamic Island. Przeglądarka: powiadomienie, gdy strona jest otwarta.",
    },
    plates: {
      name: "Liczenie talerzy",
      body: "Pokazuje, które talerze założyć na każdą stronę, dobrane do talerzy z twojej siłowni, każdy rozmiar w swoim kolorze.",
    },
    warmups: {
      name: "Serie rozgrzewkowe",
      body: "Serie wprowadzające wyliczone dla każdego ciężkiego ćwiczenia, żebyś dochodził do ciężaru roboczego gotowy.",
    },
    demos: {
      name: "Demonstracje ćwiczeń w 3D",
      body: "Każde ćwiczenie ma postać 3D, która pokazuje ruch z odpowiednim sprzętem, wraz z krokami ustawienia i wskazówkami.",
    },
    "form-mistakes": {
      name: "Częste błędy i ich poprawki",
      body: "Każde ćwiczenie i rozciąganie pokazuje obok postaci 3D dwa lub trzy najczęstsze błędy techniki, każdy z poprawką i wyjaśnieniem, dlaczego to ważne, a licznik przerwy pokazuje jeden na następną serię. Działa offline.",
    },
    "set-types": {
      name: "Drop sety i rest-pause",
      body: "Dodaj drop set albo serię rest-pause między seriami.",
    },
    "timed-sets": {
      name: "Minutnik serii do utrzymań, spacerów i cardio",
      body: "Ćwiczenia na czas, jak deska, spacer farmera, zwisy i cardio, mają minutnik serii, także na ekranie blokady i na zegarkach.",
    },
    "each-side": {
      name: "Na każdą stronę i na rękę",
      body: "Ćwiczenia robione na jedną stronę naraz to zaznaczają, a ciężar hantli jest podany na jedną rękę.",
    },
    swaps: {
      name: "Zamiana ćwiczeń",
      body: "Zamień dowolne ćwiczenie na inne, które angażuje te same mięśnie, z tym, co ma twoja siłownia.",
    },
    "heart-rate": {
      name: "Tętno na żywo",
      body: "Podłącz pas na klatkę z Bluetooth albo zegarek i widź tętno w każdej serii i przerwie.",
      note: "Przeglądarka: tylko Chrome.",
    },
    breathing: {
      name: "Oddech pudełkowy w przerwie",
      body: "Przewodnik oddechu na ekranie przerwy, z gotowymi ustawieniami albo twoim własnym rytmem.",
    },
    "voice-coach": {
      name: "Trener głosowy",
      body: "Odzywa się w trakcie treningu, na przykład gdy kończy się przerwa, żebyś nie musiał patrzeć na telefon.",
      note: "Android mówi o końcu przerwy przy zablokowanym ekranie; iPhone i przeglądarka, gdy aplikacja jest otwarta.",
    },
    "voice-amy": {
      name: "Głos Amy",
      body: "Wyraźny angielski głos w aplikacji dla trenera głosowego. Wybierz Amy lub syntezę telefonu w Ustawieniach › Trening; Amy wraca do głosu telefonu, gdy nie załaduje się.",
    },
    stretching: {
      name: "Rozciąganie",
      body: "61 ćwiczeń rozciągających z demonstracjami 3D: opcjonalna rozgrzewka przed, wyciszenie po albo sesja rozciągania w dowolny dzień. Kilka sekund na przyjęcie pozycji przed każdym rozciąganiem i każdą stroną, a ekran nie gaśnie.",
    },
    "workout-parts": {
      name: "Treningi z częściami",
      body: "Trening może przejść po kolei przez rozgrzewkę, ćwiczenia siłowe i wyciszenie, z przyciskiem Pomiń między nimi. Ekran blokady i zegarek pokazują, na której części jesteś, Historia pokazuje każdą część, a dni rozciągania trwające 10 minut lub dłużej podtrzymują passę. Rutyny mogą mieć własną rozgrzewkę i wyciszenie, także w linkach i od trenera. Notatki trenera czytają każdą część: ból po rehabilitacji, który słabnie albo rośnie, i tętno, które nie spada w czasie wyciszenia. Rehabilitacja od fizjoterapeuty może iść obok ćwiczeń siłowych w tym samym treningu w dni, gdy wypada, a po ćwiczeniach siłowych może być cardio, z maszyną i minutami wybranymi dotknięciem.",
    },
    "workout-length": {
      name: "Długość treningu obejmuje każdą część",
      body: "Suwak długości na ekranie Dziś ustawia cały trening. Rozgrzewka, cardio, rehabilitacja czy wyciszenie zabierają swoje minuty z ćwiczeń siłowych, a cienki pasek pod suwakiem pokazuje, na co idzie czas. Ćwiczenia siłowe mają co najmniej 15 minut: najpierw skraca się cardio, z krótkim wyjaśnieniem dlaczego. W dzień cardio i rozciągania wyłącz ćwiczenia siłowe, a cardio dostanie swój czas.",
    },
    "now-playing": {
      name: "Sterowanie muzyką",
      body: "Odtwarzaj, wstrzymuj i przewijaj muzykę z ekranu Dziś i w trakcie treningu, z tytułem utworu i aplikacją, która go gra. Możesz to wyłączyć w Ustawieniach.",
      note: "iPhone: tylko Apple Music, bo Apple nie pozwala aplikacjom sterować innymi aplikacjami muzycznymi.",
    },
    notes: {
      name: "Notatki trenera",
      body: "Wskazują narastające zmęczenie, zastój w ćwiczeniu, mięsień z za małą liczbą serii, zagrożony cel tygodniowy albo rosnącą tkankę tłuszczową, każda z jedną rzeczą do zrobienia, często jednym dotknięciem.",
    },
    plateau: {
      name: "Detektyw zastoju",
      body: "Gdy jedno ćwiczenie stoi w miejscu, podaje prawdopodobną przyczynę i trzytygodniową poprawkę na jedno dotknięcie, a potem mówi, czy zadziałała.",
    },
    "recovery-map": {
      name: "Mapa regeneracji",
      body: "Twoje mięśnie świecą na postaci 3D według tego, jak bardzo są zregenerowane. Dotknij jednego, żeby zobaczyć, co to znaczy na dziś.",
    },
    "advanced-stats": {
      name: "Zaawansowane statystyki",
      body: "Tygodniowe serie na mięsień w porównaniu z celem, linie trendu 1RM i kierunek, w którym idzie każde ćwiczenie.",
    },
    bests: {
      name: "Rekordy życiowe i historia",
      body: "Każdy rekord, szacowany 1RM, wynik siłowy i dawny trening, bez limitu historii.",
    },
    "calendar-history": {
      name: "Kalendarz treningów",
      body: "Miesięczny kalendarz dawnych treningów na ekranie Postępy, z nazwą każdego dnia.",
    },
    "edit-history": {
      name: "Edytuj dawne treningi i powtarzaj je",
      body: "Popraw serię, dodaj notatkę, nazwij trening albo go powtórz, a każde ćwiczenie ma własną stronę z historią. Usuń trening z opcją Cofnij, a wszystkie statystyki zostaną przeliczone.",
    },
    "exercise-stats": {
      name: "Statystyki każdego ćwiczenia",
      body: "Dotknij dowolnego ćwiczenia w bibliotece, żeby zobaczyć swoje serie, łączny podniesiony ciężar, szacowane maksimum i porównanie z trenującymi osobami o twojej wadze, wieku i płci, według opublikowanych norm siłowych.",
      proPart:
        "Zaawansowane statystyki Pro dodają wykresy, od tygodnia po cały czas: dotknij treningu, aby zobaczyć jego wynik, z zaznaczonymi rekordami.",
    },
    "log-past": {
      name: "Zapisz dawny trening",
      body: "Zapomniałeś telefonu? Zapisz trening później, a liczy się jak każdy inny.",
    },
    recap: {
      name: "Podsumowanie miesiąca",
      body: "Krótkie spojrzenie wstecz na twój miesiąc, gotowe do udostępnienia.",
    },
    anniversary: {
      name: "Twoja rocznica treningów",
      body: "Co roku w dniu twojego pierwszego treningu ekran Dziś zestawia dzień pierwszy z dzisiejszym: treningi, serie, łączny ciężar i ćwiczenie, które urosło najbardziej, z kartą do udostępnienia. Zostaje przez tydzień.",
    },
    body: {
      name: "Ważenia, tkanka tłuszczowa i zdjęcia",
      body: "Zapisuj wagę i tkankę tłuszczową albo pozwól, by przychodziły z wagi przez aplikację zdrowotną w telefonie, i trzymaj zdjęcia postępów na telefonie.",
    },
    "photo-compare": {
      name: "Zdjęcia postępów, które się pokrywają",
      body: "Aparat pokazuje ostatnie zdjęcie jako blady kontur do dopasowania, z samowyzwalaczem, żebyś mógł się odsunąć. Porównaj dowolne dwie daty suwakiem albo obok siebie, każdą z wagą z tego dnia. Zdjęcia zostają w telefonie; plik kopii zapasowej przeniesie je na nowy.",
    },
    measurements: {
      name: "Pomiary taśmą",
      body: "Dziewięć miejsc pomiaru w centymetrach lub calach. Gdy brak odczytu tkanki tłuszczowej, rosnący lub malejący obwód talii staje się notatką trenera.",
    },
    "body-figure": {
      name: "Postać 3D w twoim kształcie",
      body: "Włącz to, a postacie na ekranie Zdrowie, na mapie regeneracji i w demonstracjach ćwiczeń przyjmą twoją budowę na podstawie wzrostu, wagi, tkanki tłuszczowej i pomiarów taśmą.",
    },
    "health-twin": {
      name: "Cyfrowy bliźniak zdrowia i wiek sprawnościowy",
      body: "Sen, HRV, tętno spoczynkowe, kroki, częstość oddechu i VO₂ max w jednym miejscu, z trendem i wiekiem sprawnościowym wyliczonym z VO₂ max.",
      note: "Odczyty zdrowotne pochodzą z Health Connect na Androidzie i Apple Zdrowie na iPhonie. Aplikacja webowa pokazuje ważenia, tkankę tłuszczową, BMI i kalorie.",
    },
    "fitness-tests": {
      name: "Testy sprawności",
      body: "Zwis na drążku, stanie na jednej nodze i 30-sekundowe wstawanie z krzesła, każdy z minutnikiem, typowym zakresem wyników i tym, co pomaga.",
    },
    food: {
      name: "Notatki trenera z aplikacji do liczenia kalorii",
      body: "Kalorie, białko, węglowodany i tłuszcz zapisane w aplikacji do liczenia kalorii trafiają do Liftsmith przez aplikację zdrowotną w telefonie i zamieniają się w notatki typu „za mało białka trzeci dzień z rzędu”, oceniane względem jednego zestawu celów dla twojego celu. Liczy się też samo zapisywanie białka. W aplikacji nie zapisujesz jedzenia.",
    },
    "measured-maintenance": {
      name: "Zapotrzebowanie zmierzone z tego, co jesz",
      body: "Dwa tygodnie jedzenia i ważeń mierzą twoje prawdziwe dzienne kalorie, które potem napędzają Makro, TDEE i notatki o jedzeniu. Karta Jedzenie na ekranie Ciało pokazuje twój tydzień na tle celów.",
      note: "Osoby poniżej 18 lat dostają tylko rady o białku: bez celu redukcji tłuszczu i bez notatek o kaloriach.",
    },
    "your-stats": {
      name: "Twoje dane",
      body: "Jedno miejsce na płeć, wiek i wzrost, z którego korzysta każde narzędzie, uzupełniane z Apple Zdrowie na iPhonie.",
    },
    "fixed-programs": {
      name: "Klasyczne programy",
      body: "Klasyczne 5×5, 3×5 dla początkujących, 5×5 z ramionami, narastające 5×5, progresja warstwowa, fale z maksimum treningowym, umiejętności z masą ciała i full body z hantlami. Darmowy program jest dopasowany do twojej siłowni.",
    },
    routines: {
      name: "Twoje własne rutyny",
      body: "Buduj rutyny z przeglądarki ćwiczeń, bez limitu liczby, i udostępniaj je jako link.",
    },
    "workout-generator": {
      name: "Darmowy generator treningu na stronie",
      body: "Wybierz sprzęt, minuty i co chcesz trenować, a ten sam silnik ułoży trening z seriami, powtórzeniami, przerwami i powodem przy każdym ćwiczeniu. Każdy trening ma własny link do udostępnienia, a Zacznij w aplikacji otwiera go jako rutynę.",
      note: "Zacznij w aplikacji otwiera aplikację na Androida; na iPhonie i komputerze otwiera aplikację webową.",
    },
    "routine-library": {
      name: "Biblioteka rutyn",
      body: "Szukaj rutyn opublikowanych przez innych według celu, słów i sprzętu na twojej siłowni, zapisz jedną jednym dotknięciem i oceń ją gwiazdkami. Opublikuj własną z jej edytora, z imieniem lub bez, a dostanie własną stronę w serwisie. Wychodzą tylko ćwiczenia i serie, nigdy twoje ciężary ani notatki.",
      note: "Publikowanie wymaga konta i ukończonych 18 lat. Przeglądać może każdy.",
    },
    "thirty-day": {
      name: "Wyzwania 30-dniowe",
      body: "Dwanaście 30-dniowych wyzwań, od przysiadów, pompek i deski po podciąganie i burpees, każde na trzech poziomach: jedno ćwiczenie dziennie, każdego dnia trochę więcej, z odpoczynkiem co czwarty dzień. Ekran Dziś pokazuje liczbę dnia z przyciskiem Zrobione, a opuszczony dzień na ciebie czeka. Każde wyzwanie ma stronę w serwisie z kalendarzem do druku.",
    },
    library: {
      name: "1000 ćwiczeń",
      body: "Siłowe, z masą ciała, na maszynach, z gumami, z kettlebellami i cardio, z wyszukiwarką, filtrami mięśni i filtrem „ta siłownia”. Cardio zapisuje czas i dystans.",
    },
    remix: {
      name: "Linki do remiksów",
      body: "Wyślij znajomemu trening jako link, który może zrobić sam.",
    },
    gyms: {
      name: "Twoje siłownie i ich sprzęt",
      body: "Skonfiguruj każdą siłownię raz: sztangi, talerze, hantle i kettlebelle takie, jakie naprawdę są, maszyny i ich ustawienia.",
    },
    "gym-location": {
      name: "Siłownia według lokalizacji",
      body: "Wybiera właściwą siłownię, gdy na nią przychodzisz.",
    },
    "gym-share": {
      name: "Udostępnij wyposażenie siłowni",
      body: "Wyślij sprzęt swojej siłowni jako link, żeby partner treningowy zaczynał z tym samym wyposażeniem.",
    },
    "gym-finder": {
      name: "Wyszukiwarka siłowni i strony siłowni",
      body: "Znajdź siłownie w pobliżu na dużej mapie, każdą na półprzezroczystej karcie nad nią, oficjalne na początku, każda z własną stroną: sprzęt, godziny otwarcia, mapa i członkowie. Właściciele mogą przejąć swoją siłownię i dodać logo oraz zdjęcia. Brakuje siłowni? Dodaj ją. Właściciele widzą, ile osób ją dodało i zeskanowało plakat, oraz co zrobić dalej. Oficjalne siłownie mogą prowadzić klub z cotygodniowym rankingiem. Coś jest nie tak na stronie? Zgłoś to, a nasz zespół to poprawi.",
    },
    "gym-amenities": {
      name: "Udogodnienia i ceny na stronach siłowni",
      body: "Właściciele siłowni podają, co jest na miejscu poza sprzętem (prysznice, parking, dostęp 24/7, strefa dla kobiet i więcej) oraz ile kosztuje wejście jednorazowe, karnet tygodniowy albo członkostwo.",
    },
    "gym-news": {
      name: "Ogłoszenia z twojej siłowni",
      body: "Oficjalne siłownie publikują na swojej stronie godziny w święta, nowy sprzęt czy zmiany w zajęciach, a członkowie klubu siłowni dostają powiadomienie.",
    },
    "gym-problems": {
      name: "Zgłoś zepsuty sprzęt",
      body: "Daj znać siłowni, że maszyna jest zepsuta albo jej brakuje. Każdy, kto tam trenuje, dostaje plan, który ją omija, a właściciel widzi zgłoszenie z przyciskiem Naprawione.",
    },
    "gym-trainers": {
      name: "Trenerzy na stronach siłowni",
      body: "Trenerzy dodają się do siłowni, w których prowadzą podopiecznych, z krótkim opisem siebie i przyciskiem, żeby zacząć z nimi trenować. W oficjalnej siłowni najpierw zatwierdza ich właściciel.",
    },
    "gym-staff": {
      name: "Konta personelu siłowni",
      body: "Właściciel oficjalnej siłowni zaprasza menedżerów i obsługę recepcji jednorazowym linkiem. Każdy korzysta z własnego konta, żeby dbać o aktualność strony siłowni, ogłoszeń i zgłoszeń usterek.",
    },
    "gym-classes": {
      name: "Grafiki zajęć na stronach siłowni",
      body: "Oficjalne siłownie publikują zajęcia, które prowadzą co tydzień, z instruktorem i salą, i zaznaczają dni bez zajęć. Bywalcy widzą cały tydzień na stronie siłowni w aplikacji i w sieci, a najbliższe zajęcia dodają do kalendarza jednym dotknięciem.",
    },
    "gym-chains": {
      name: "Wszystkie lokalizacje sieci siłowni",
      body: "Siłownie należące do sieci pokazują jej logo i prowadzą do strony ze wszystkimi lokalizacjami, w aplikacji od najbliższych. Na stronie internetowej każda sieć ma własną stronę.",
      note: "Sieci rozpoznajemy po marce na mapie albo po nazwie, którą noszą siłownie w kilku miastach. Przejęte siłownie zachowują własne logo.",
    },
    "gym-open-now": {
      name: "Otwarte teraz w wyszukiwarce siłowni",
      body: "Siłownie w pobliżu pokazują, czy są teraz otwarte i kiedy zamykają lub znów otwierają, a jedno dotknięcie Otwarte teraz zostawia tylko te, do których możesz wejść od razu.",
      note: "Liczone z godzin otwarcia każdej siłowni i Twojego zegara, dla siłowni w pobliżu.",
    },
    "gym-starter": {
      name: "Programy startowe siłowni",
      body: "Oficjalne siłownie polecają nowym członkom jeden program na swojej stronie w aplikacji i w sieci, a ćwiczący zapisują go jednym dotknięciem. Liftsmith wpisuje każdemu jego własne ciężary.",
    },
    "buy-next": {
      name: "Co kupić dalej",
      body: "Dla domowych siłowni: ten jeden sprzęt, który otworzy najwięcej nowych ćwiczeń.",
    },
    feed: {
      name: "Aktualności znajomych",
      body: "Obserwuj ludzi i oglądaj ich treningi, z polubieniami, komentarzami, odpowiedziami i @wzmiankami, i wybieraj, kto widzi każdy twój trening.",
    },
    cheers: {
      name: "Kto trenuje teraz i doping",
      body: "Zobacz, kto teraz trenuje, i wyślij doping, który przepłynie przez jego ekran treningu.",
    },
    "check-in": {
      name: "Zamelduj się na siłowni",
      body: "Jedno dotknięcie na ekranie Dziś informuje wybranych znajomych, że jesteś na siłowni. Dostają powiadomienie i notatkę w aplikacji, dopóki jej nie zamkną.",
      note: "Dla osób od 18 lat. Powiadomienia są na Androidzie i iPhonie; aplikacja webowa pokazuje notatkę, gdy jest otwarta.",
    },
    challenges: {
      name: "Wyzwania, kluby i rankingi",
      body: "Rzuć wyzwanie znajomemu, dołącz do klubu albo ekipy z siłowni z cotygodniowym rankingiem i podejmij miesięczne wyzwanie razem ze wszystkimi.",
    },
    "club-chat": {
      name: "Czat klubu i treningi ekipy",
      body: "Rozmawiaj z klubem między treningami, podaj godzinę i miejsce na wspólny trening i zobacz, kto idzie. Każdy, kto idzie, dostaje przypomnienie godzinę wcześniej, a gdy potem opublikujesz trening, pojawisz się jako po treningu, z oznaczonymi znajomymi, z którymi ćwiczysz.",
      note: "Dla osób, które mają co najmniej 18 lat. Powiadomienia działają na Androidzie i iPhonie; aplikacja webowa pokazuje nowe wiadomości, gdy czat jest otwarty.",
    },
    "campus-clubs": {
      name: "Pro dla liderów aktywnego klubu",
      body: "Prowadź klub, w którym 5 lub więcej członków, razem z Tobą, skończyło trening w ostatnich 14 dniach, a Pro jest dla Ciebie za darmo, dopóki tak zostaje.",
      note: "Dołączenie do cudzego klubu się nie liczy, a dwa kluby się nie sumują.",
    },
    profiles: {
      name: "Publiczne profile",
      body: "Opcjonalna publiczna strona z twoimi najlepszymi wynikami i treningami.",
    },
    "tagline-gym": {
      name: "Motto i macierzysta siłownia",
      body: "Dodaj krótki tekst pod swoim imieniem i wybierz swoją siłownię z wyszukiwarki siłowni, żeby znajomi wiedzieli, gdzie trenujesz. Widzą to osoby, które widzą twoje treningi, a także twoja publiczna strona.",
      note: "Macierzysta siłownia jest dla osób od 18 lat.",
    },
    safety: {
      name: "Blokuj, wyciszaj i zgłaszaj",
      body: "Zablokuj lub wycisz kogokolwiek i zgłoś post, komentarz albo profil jednym dotknięciem powodu. Nasz zespół sprawdza każde zgłoszenie i może ostrzec, zawiesić lub zbanować.",
    },
    "invite-friends": {
      name: "Zapraszaj znajomych, zdobywaj Pro",
      body: "Udostępnij swój link z zaproszeniem z ekranu Znajomi, z końca treningu albo z dowolnej karty do udostępnienia. Znajomy, który dołączy przez niego, zaczyna cię obserwować, a gdy skończy trzy treningi, oboje dostajecie miesiąc Pro. Sekcja Twoje zaproszenia pokazuje, ile brakuje każdemu znajomemu.",
      note: "Do 12 miesięcy w roku. Osoby poniżej 18 lat mogą zapraszać znajomych, ale nagroda nie jest im oferowana.",
    },
    share: {
      name: "Karty i linki do udostępniania",
      body: "Udostępnij trening, nowy rekord albo kamień milowy jako obrazek lub publiczny link z podglądem. Nowy rekord błyska na złoto i możesz go od razu udostępnić z ekranu przerwy.",
    },
    "screenshot-share": {
      name: "Karty po zrobieniu zrzutu ekranu",
      body: "Zrób zrzut ekranu, a wysunie się arkusz kart z twoim treningiem: ostatni miesiąc, trzy miesiące, sześć miesięcy, rok albo od początku, jako podsumowanie, podział serii albo najlepsze boje. Przesuwaj je, ukryj ciężary ikoną oka i udostępnij z linkiem z zaproszeniem na karcie. Te same karty są pod Udostępnij mój trening w Postępach. Każdy link, który udostępniasz, niesie teraz twoje zaproszenie, w linku, który o tym mówi.",
      note: "Zrzuty ekranu otwierają to na Androidzie 14 i nowszym oraz na iPhonie, i można to wyłączyć. Gdzie indziej otwórz to z Postępów. Osoby poniżej 18 lat udostępniają bez linku z zaproszeniem.",
    },
    "share-stats": {
      name: "Udostępnij każdy rekord i maks",
      body: "Obok szacowanych maksów, najcięższej serii, każdego rekordu dla liczby powtórzeń i ostatnich rekordów życiowych jest mały przycisk udostępniania. Jedno dotknięcie tworzy kartę z tą liczbą, logo Liftsmith i stroną, w wyglądzie aplikacji, gotową do opublikowania lub zapisania.",
    },
    coaching: {
      name: "Prowadź podopiecznych",
      body: "Połącz się z podopiecznymi, oglądaj ich wyniki i przydzielaj im rutyny, na telefonie albo dużym ekranie.",
    },
    "coach-chat": {
      name: "Czat, alerty i dane o ciele",
      body: "Pisz z każdym podopiecznym, dostawaj powiadomienie, gdy trenuje albo milknie na tydzień, i oglądaj jego ważenia, pomiary i postać 3D w jego kształcie, gdy zdecyduje się je udostępnić.",
      note: "Powiadomienia są na Androidzie i iPhonie. Aplikacja webowa pokazuje nowe wiadomości, gdy jest otwarta.",
    },
    physio: {
      name: "Dla fizjoterapeutów i rehabilitantów",
      body: "Przydzielaj łagodne programy rehabilitacyjne z liczbą razy w tygodniu, sprawdzaj, jak często pacjenci się ich trzymają, i oglądaj oceny bólu i kontuzje, które zdecydują się udostępnić, ćwiczenie po ćwiczeniu, z powiadomieniem, gdy ból jest wysoki.",
      note: "Liftsmith pokazuje to, co zapisują podopieczni. Niczego nie diagnozuje ani nie leczy.",
    },
    "rehab-phases": {
      name: "Protokoły rehabilitacji etapami, prowadzone przez ból",
      body: "Każdy program rehabilitacji ma trzy etapy, od wyciszenia okolicy do pełnej sprawności. Prosta reguła bólu czyta oceny po każdym ćwiczeniu i następnego dnia, mówi, kiedy podopieczny jest gotowy na następny etap albo powinien wrócić, a fizjoterapeuta wysyła go jednym dotknięciem.",
      note: "Podopieczni korzystają za darmo. Liftsmith pokazuje, co zapisują podopieczni. Nie diagnozuje ani nie leczy.",
    },
    "rehab-shape": {
      name: "Ułóż rutynę rehabilitacji",
      body: "Fizjoterapeuci ustawiają powtórzenia albo sekundy każdego ćwiczenia w rutynie rehabilitacji i dodają krótką wskazówkę, w edytorze rutyn. Podopieczni robią ją tak, jak jest zapisana.",
      note: "Podopieczni korzystają za darmo. Liftsmith pokazuje, co zapisują podopieczni. Nie diagnozuje ani nie leczy.",
    },
    "coach-nutrition": {
      name: "Cele żywieniowe dla podopiecznych",
      body: "Ustal każdemu podopiecznemu dzienne kalorie, białko, węglowodany i tłuszcz, jeśli chcesz z osobną liczbą kalorii na dni wolne, uzupełniane jednym dotknięciem z jego własnych danych. Jego notatki trenera sprawdzają z nimi tydzień jedzenia, a ty widzisz, jak się odżywia, gdy to udostępni.",
    },
    "school-teams": {
      name: "Za darmo dla drużyn szkolnych",
      body: "Trenerzy szkół średnich, którzy potwierdzą szkolny adres e-mail, dostają Pro za darmo, podobnie jak zawodnicy w wieku od 13 do 18 lat z ich drużyn, z cotygodniowym rankingiem drużyny. Tkanka tłuszczowa i publiczne profile pozostają wyłączone dla osób poniżej 18 lat.",
    },
    "my-team": {
      name: "Moja drużyna dla zawodników szkolnych",
      body: "Zawodnik drużyny szkolnej otwiera Coaching na stronie swojej drużyny: drużyna i trener, przydzielone programy z przyciskiem Rozpocznij, czat drużyny z trenerem, czat z trenerem i tydzień drużyny. Trener może dodać do drużyny zawodników, którzy dołączyli przez jego zaproszenie; każdy najpierw podaje wiek i wyraża zgodę.",
    },
    "team-session": {
      name: "Treningi drużyny na jednym tablecie",
      body: "Trener szkolny prowadzi jeden trening dla całej drużyny z jednego tabletu: każdy zawodnik stuka swoje imię i zapisuje swoje serie, ciężar zaczyna się tam, gdzie skończył, a tablica pokazuje, kto jeszcze nie zaczął. Na koniec serie każdego trafiają na jego konto. Działa bez zasięgu.",
    },
    "coach-checkins": {
      name: "Formularze kontrolne i ankiety",
      body: "Wysyłaj podopiecznym cotygodniową ankietę kontrolną, ankietę wstępną albo własny formularz, raz lub co tydzień. Odpowiadają kilkoma dotknięciami, a niski wynik albo spóźniona odpowiedź trafia na górę ich raportu.",
    },
    "coach-checkin-trends": {
      name: "Kontrole postępów z wagą, zdjęciami i trendami",
      body: "Dodaj do dowolnego formularza pytania o masę ciała i zdjęcia, i wysyłaj go co tydzień, co 2 lub co 4 tygodnie. Waga wypełnia się z ostatniego ważenia klienta, zdjęcia widzisz tylko Ty, a trend każdej odpowiedzi widać w raporcie. Osoby poniżej 18 lat nigdy nie są proszone o zdjęcia.",
    },
    "coach-form-videos": {
      name: "Nagrania techniki z notatkami w nagraniu",
      body: "Klienci nagrywają serię w aplikacji i wysyłają ją tobie. Obejrzyj ją w zwolnionym tempie, przypnij notatki do konkretnych momentów, a klienci odpowiedzą w tych samych notatkach. Widzicie je tylko wy dwoje; osoby poniżej 18 lat nie mogą ich wysyłać.",
      note: "Wysłanie nagrania jest dla klientów bezpłatne. Android, iPhone i przeglądarka.",
    },
    "coach-roles": {
      name: "Dla trenerów personalnych i trenerów",
      body: "Powiedz, czy jesteś trenerem personalnym, trenerem sportowym czy fizjo. Podopieczni widzą właściwe określenie, a tylko narzędzia tej roli są widoczne — wiadomości zostają dla wszystkich.",
    },
    "coach-booking": {
      name: "Rezerwacja i planowanie sesji",
      body: "Otwórz terminy, w których jesteś wolny, jednorazowo albo co tydzień, a podopieczni zarezerwują je w aplikacji, albo sam zapisz podopiecznego. Twój grafik to kalendarz miesięczny: dotknij dnia, żeby zobaczyć, kto jest zapisany i co jest jeszcze wolne. Obie strony dostają powiadomienie, sesja w ciągu najbliższej doby pokazuje się na ekranie Dziś i trafia do ich kalendarza jednym dotknięciem.",
    },
    "coach-payments": {
      name: "Płatności od podopiecznych przez Stripe",
      body: "Podłącz własne konto Stripe i ustal cenę dla każdego podopiecznego, za sesję albo miesięcznie. Podopieczni płacą na bezpiecznej stronie Stripe, pieniądze trafiają prosto do ciebie, a nieudana płatność miesięczna pokazuje się na górze ich raportu.",
    },
    "coach-pages": {
      name: "Osobne widoki dla trenera i podopiecznego",
      body: "Podopieczni widzą tylko swojego trenera: piszą do niego jednym dotknięciem, odpowiadają na ankiety, rezerwują sesje i wybierają, co udostępnić. Trenerzy mają stronę na każde zadanie, z podopiecznymi, wiadomościami, grafikiem, ankietami i płatnościami jako kartami w przeglądarce i na telefonach.",
      proPart: "Bycie podopiecznym jest darmowe; prowadzenie podopiecznych jest w Pro.",
    },
    "coach-sharing": {
      name: "Podopieczni wybierają, co widzi trener",
      body: "Trening jest zawsze udostępniany. Tętno, notatki z treningu, gotowość i regeneracja, dane o ciele, ból i kontuzje oraz cykl to osobne przełączniki, które podopieczny ustawia dla każdego trenera na ekranie zgody albo w dowolnym momencie później. Zdjęcia i siłownie nigdy nie wychodzą poza urządzenie.",
      proPart: "Bycie podopiecznym jest darmowe; prowadzenie podopiecznych jest w Pro.",
    },
    "trainer-directory": {
      name: "Wpis w katalogu trenerów",
      body: "Dodaj się jako trener personalny, trener albo fizjoterapeuta w swojej siłowni, a pojawisz się na jej stronie i w katalogu trenerów dla jej miasta na stronie internetowej, z opisem i linkiem, przez który nowi podopieczni zaczną z tobą trenować. Wpisywane są tylko osoby pełnoletnie.",
    },
    "coach-chat-dock": {
      name: "Panel czatu, statusy i naklejki",
      body: "Na komputerze czat z trenerem siedzi w panelu w prawym dolnym rogu, jak w komunikatorze: wszyscy, do których możesz pisać, do dwóch okien czatu, które się zwijają, oraz dźwięk i licznik na karcie, gdy przychodzi wiadomość. Obie strony ustawiają status (online, z podopiecznym, na treningu, zaraz wracam, nie przeszkadzać, na urlopie albo pokazuj jako offline), widzą, kiedy druga osoba pisze i kiedy wyświetliła wiadomość, i wysyłają emoji oraz siłowniane naklejki, także na telefonie.",
      proPart: "Bycie podopiecznym jest darmowe; prowadzenie podopiecznych jest w Pro.",
    },
    "coach-programs": {
      name: "Programy trenerów",
      body: "Trenerzy i trenerzy personalni zamieniają swoje rutyny w program z poziomem, celem i liczbą tygodni, darmowy lub płatny, i udostępniają link. Jednym dotknięciem zapisujesz jego dni w swoich rutynach, a ciężary dobiera twój własny postęp. Za płatne programy płacisz trenerowi przez jego własne konto Stripe. Widok tygodnia układa każdą rutynę na jej dni z odpoczynkiem, widok miesiąca pokazuje przebieg, a Ułóż automatycznie rozkłada rutyny za ciebie.",
      note: "Płatne programy kupuje się na stronie; aplikacje na Androida i iPhone'a pokazują programy darmowe i te, które już masz.",
      proPart: "Pobieranie programów jest darmowe; tworzenie ich to część coachingu, który jest w Pro.",
    },
    "program-phases": {
      name: "Fazy programu i powtórzenia od trenera",
      body: "Program trenera może iść fazami, a każda powtarza własny tydzień: Budowa, tydzień Odciążenia z mniejszą liczbą serii i lżejszymi ciężarami oraz Szczyt z mniejszą liczbą serii, żeby być wypoczętym. Dodaj odciążenie jednym dotknięciem, zobacz każdą fazę w miesiącu i ustal powtórzenia dla ćwiczenia (np. 8–12) albo zostaw Auto, żeby wybrała je historia każdej osoby. Osoby, które go realizują, widzą pod planem na Dziś, w której fazie i tygodniu są.",
      proPart: "Realizowanie programu jest bezpłatne; tworzenie go jest częścią coachingu, który jest w Pro.",
    },
    "client-program-copy": {
      name: "Dopasuj program do jednego klienta",
      body: "Zmień dzień w programie trenera tylko dla jednego klienta, np. ćwiczenie wymienione z powodu kontuzji. Dzień jest oznaczony jako zmieniony dla tej osoby, a jedno dotknięcie przywraca dzień z programu. Zmiany w programie nadal trafiają do wszystkich i do każdego dnia, którego nie zmieniłeś, a aplikacja każdej osoby pobiera je sama.",
      proPart: "Bycie klientem jest bezpłatne; prowadzenie klientów jest w Pro.",
    },
    "coach-program-today": {
      name: "Od trenera na ekranie Dziś",
      body: "Kto realizuje program trenera, widzi go na ekranie Dziś: od kogo jest, dzisiejszy dzień, tydzień i fazę oraz to, co następne, z dniem. Zawodnik drużyny szkolnej widzi też miesiąc w Mojej drużynie, z dniami zrobionymi, pominiętymi i nadchodzącymi.",
    },
    "program-in-order": {
      name: "Programy realizowane po kolei",
      body: "Trener może ustawić program, by dni szły po kolei: każdy robi następny dzień, kiedy tylko trenuje, zamiast w stałe dni tygodnia, a tydzień zostaje jako sugerowany rytm. Ekran Dziś pokazuje, co następne.",
      proPart: "Bycie klientem jest bezpłatne; prowadzenie klientów jest w Pro.",
    },
    "coach-calendar": {
      name: "Kalendarz treningów",
      body: "Planuj treningi i dni odpoczynku w kalendarzu miesięcznym. Zawodnicy widzą plan dnia na ekranie Dzisiaj. Zaproś asystentów do edycji kalendarza i sprawdzaj aktywność zawodników.",
    },
    "coach-assign-program": {
      name: "Przypisz program sezonowy klientom lub drużynie",
      body: "Trenerzy przypisują wielodniowy program (Upper/Lower, Push/Pull/Legs lub własny) jako plan przypięty do dni tygodnia na N tygodni. Sportowcy śledzą go raz; Dziś pokazuje trening tego dnia. Kalendarz programu pokazuje, kto zrobił każdy dzień, a kto jeszcze nie — tylko imiona w drużynach szkolnych, nigdy ciężary.",
      proPart: "Śledzenie programu jest darmowe; przypisywanie należy do coachingu, który jest Pro.",
    },
    "coach-reviews": {
      name: "Oceny i opinie od prawdziwych podopiecznych",
      body: "Podopieczni oceniają swojego trenera, trenera personalnego albo fizjoterapeutę gwiazdkami i krótką opinią po czterech tygodniach lub dwóch wspólnych sesjach. Ocena pojawia się, gdy trener ma trzy opinie, obok liczby jego podopiecznych, którzy trenowali w ostatnich dwóch tygodniach, w zaproszeniu i w katalogu trenerów. Trener może raz odpowiedzieć na każdą opinię, a każdy może opinię zgłosić. Opinie mogą wystawiać tylko osoby pełnoletnie.",
      proPart: "Wystawienie opinii jest darmowe; prowadzenie podopiecznych jest w Pro.",
    },
    "program-pages": {
      name: "Programy od trenerów na stronie, z ocenami",
      body: "Każdy opublikowany program trenera ma własną stronę w serwisie, z poziomem, celem, liczbą tygodni i dni oraz ćwiczeniami darmowych programów, więc można go znaleźć w wyszukiwarce. Osoby, które mają program od dwóch tygodni, oceniają go gwiazdkami i krótką opinią; oceny pojawiają się od trzech, a trener odpowiada raz na każdą.",
      proPart: "Ocenianie programu jest darmowe; tworzenie ich to część trenowania, które jest w Pro.",
    },
    "coach-plans": {
      name: "Plany dla trenerów, które rosną z listą podopiecznych",
      body: "Pro obejmuje do 3 podopiecznych. Coach mieści 25, a Coach Plus nie ma ustalonego limitu, z każdym narzędziem trenerskim w każdym planie. Twoi podopieczni zawsze trenują za darmo, a w planach Coach i Coach Plus Liftsmith nie bierze nic z tego, co ci płacą. W Pro zatrzymuje 2%.",
    },
    awards: {
      name: "Osiągnięcia, poziomy i passy",
      body: "Odznaki w stopniach, 50 poziomów z nagrodami, cotygodniowe zadania, zamrożenia passy i uczciwe ligi.",
    },
    seasons: {
      name: "Sezony treningowe",
      body: "Dziesięciotygodniowe sezony ze ścieżką 20 poziomów, którą pokonujesz, trenując w stronę własnego celu tygodniowego: dwa dni w tygodniu awansują tak szybko jak pięć, a dodatkowe dni nic nie dają. Poziomy dają odznaki, awatar, kolor akcentu i motyw z ikoną aplikacji dostępne tylko w tym sezonie, które zostają Twoje na zawsze. Wyzwania sezonu, rzadki łup za nowe rekordy, gwiazdki prestiżu, tydzień nadrabiania po potknięciu, finał z podwójnymi punktami i podsumowanie do udostępnienia. Do końca 2027 zaplanowano sześć sezonów jeden po drugim (Żar, Burza, Rozkwit, Przesilenie, Klon i Obsydian), każdy z własnym wyglądem i trzema własnymi wyzwaniami.",
      proPart: "Wszystkie poziomy i nagrody są darmowe; Pro dodaje nagrodę bonusową na trzech poziomach.",
      note: "Ikony sezonu są na Androidzie i iPhonie; w przeglądarce jest motyw. Sezony można wyłączyć w Ustawieniach.",
    },
    locker: {
      name: "Motywy, akcenty i ikony aplikacji",
      body: "Zdobywaj motywy i kolory akcentu, a na telefonach ikonę aplikacji w kolorach twojego motywu.",
      note: "Zdobyte ikony aplikacji są tylko na Androidzie i iPhonie.",
    },
    watch: {
      name: "Aplikacje na zegarki",
      body: "Trening na Wear OS i Apple Watch: seria albo odliczanie przerwy, tętno z zegarka, Zapisz serię i +30 s oraz wibracja na koniec przerwy.",
    },
    "watch-today": {
      name: "Dzisiejszy trening na zegarku",
      body: "Kafelek i komplikacja tarczy na Wear OS, komplikacja na Apple Watch i podgląd na Garminie pokazują dzisiejszą propozycję, jej czas i twoją gotowość, np. „Mocniej · 45 min · Gotowość 82”. Na Wear OS Zacznij na telefonie otwiera ją na telefonie.",
      note: "Apple Watch nie może otworzyć aplikacji na iPhonie, więc jego komplikacja otwiera aplikację na zegarku.",
    },
    "watch-adjust": {
      name: "Zmień i oceń serię na zegarku",
      body: "Obróć koronkę lub pierścień albo naciśnij − i +, aby zmienić ciężar i powtórzenia z nadgarstka, tymi samymi krokami co w telefonie: twoje talerze, hantle albo stos ciężarów maszyny. Po ostatniej serii ćwiczenia zegarek pyta, jak poszło, a twoja odpowiedź ustala kolejny ciężar.",
      note: "Wear OS, Apple Watch i Garmin (przyciski UP i DOWN).",
    },
    "machine-taken": {
      name: "Maszyna zajęta",
      body: "Ktoś na maszynie? Jedno dotknięcie na zegarku lub w Zmień plan wstawia najlepsze ćwiczenie w twojej siłowni, które jej nie potrzebuje, z ciężarem i powodem.",
      note: "Wear OS, Apple Watch i Garmin (przycisk UP), a na telefonie i w sieci Zmień plan.",
    },
    "watch-alone": {
      name: "Trening na zegarku, bez telefonu",
      body: "Dzisiejszy plan jest też na zegarku. Dotknij Zacznij na zegarku, zapisuj każdą serię z ciężarem i powtórzeniami na nadgarstku, a trening zapisze się razem z rekordami, gdy telefon znów będzie blisko.",
      note: "Wear OS, Apple Watch i Garmin.",
    },
    widgets: {
      name: "Widżety na ekranie głównym",
      body: "Trzy widżety: Dziś (decyzja na dziś, cel tygodniowy, notatka trenera oraz Start albo Zapisz serię), Ten tydzień (dni z treningiem, twoja passa i co ją podtrzyma) oraz Regeneracja (które mięśnie są gotowe do treningu i kiedy będą pozostałe).",
      note: "Aplikacja webowa ma zamiast tego skróty na ikonie ekranu głównego.",
    },
    shortcuts: {
      name: "Szybkie ustawienia, Siri i skróty",
      body: "Zacznij trening z kafelka Szybkich ustawień na Androidzie albo z Centrum sterowania i Siri na iPhonie.",
    },
    calendar: {
      name: "Kalendarz",
      body: "Wpisuje dni treningowe do twojego kalendarza i potrafi skrócić trening, żeby zmieścił się przed następnym spotkaniem.",
      note: "Aplikacja webowa pobiera zamiast tego plik .ics.",
    },
    reminders: {
      name: "Przypomnienia",
      body: "Delikatne przypomnienia w dni treningowe, jako powiadomienia na telefonach i e-mailem.",
    },
    emails: {
      name: "E-maile, które pomagają nie odpuszczać",
      body: "Osiem porad na start z prawdziwymi ekranami, podsumowanie tygodnia i miesiąca, nowe rekordy życiowe, którzy znajomi trenowali, zachęta do powrotu po przerwie, a potem cotygodniowa porada o funkcji, której może jeszcze nie znasz. Każdy rodzaj ma własny przełącznik.",
      note: "Włączone przy koncie, wyłączone dla osób poniżej 18 lat, chyba że same je włączą. Każdy e-mail ma wypisanie się jednym kliknięciem.",
    },
    cloud: {
      name: "Połączenia z usługami fitness",
      body: "Oura przesyła sen, HRV, tętno spoczynkowe i kroki, przez darmowe konto. Sprawdzamy Stravę, WHOOP, Withings, Polar i Concept2.",
    },
    "health-save": {
      name: "Treningi zapisywane w aplikacji zdrowotnej",
      body: "Każdy ukończony trening trafia do Health Connect albo Apple Zdrowie jako trening siłowy, z kaloriami i tętnem.",
    },
    "outside-workouts": {
      name: "Liczą się treningi z innych aplikacji",
      body: "Po włączeniu biegi, jazdy na rowerze, sporty i zajęcia, które inne aplikacje zapisują w aplikacji zdrowotnej, liczą się w mapie regeneracji i w planie na jutro. Długi mecz wczoraj zostawia nogi w regeneracji, a plan to uwzględnia.",
    },
    offline: {
      name: "Działa offline",
      body: "Wszystko działa na twoim urządzeniu i synchronizuje się w tle, więc brak zasięgu na siłowni w piwnicy to żaden problem.",
    },
    sync: {
      name: "Konta i synchronizacja",
      body: "Opcjonalne logowanie przez Google, Apple albo kod wysłany e-mailem utrzymuje telefon, tablet i aplikację webową w zgodzie.",
    },
    backup: {
      name: "Kopia zapasowa i eksport",
      body: "Zapisz plik kopii zapasowej albo wyeksportuj treningi jako arkusz kalkulacyjny, kiedy chcesz.",
    },
    import: {
      name: "Import z innej aplikacji",
      body: "Przenieś historię ze Strong, Hevy, Fitbod, StrongLifts, JEFIT albo FitNotes za pomocą ich pliku eksportu, łącznie z cardio.",
    },
    importExtras: {
      name: "Rutyny i dane o ciele z innej aplikacji",
      body: "Import zamienia treningi powtarzane pod tą samą nazwą w rutyny i przenosi masę ciała, tkankę tłuszczową i pomiary taśmą z Hevy, FitNotes albo aplikacji wagi.",
    },
    "strength-standards": {
      name: "Normy siłowe od prawdziwych ćwiczących",
      body: "Strona pokazuje, ile naprawdę przysiadają, wyciskają na ławce, ciągną w martwym ciągu i wyciskają nad głowę ćwiczący, według płci i masy ciała, liczone codziennie z osób, które biorą w tym udział. Pokazujemy tylko grupy liczące co najmniej 30 osób, jako percentyle, nigdy niczyje własne wyniki. Jeden przełącznik w Ustawienia › Twoje dane i prywatność decyduje, czy jesteś liczony; osoby poniżej 18 lat nigdy nie są.",
    },
    community: {
      name: "Społeczność: pomysły, błędy i plan rozwoju",
      body: "Zaproponuj, co Liftsmith ma robić dalej, głosuj na pomysły, które chcesz, zgłaszaj błędy ze zrzutem ekranu widocznym tylko dla zespołu, komentuj i oznaczaj innych przez @. Przy każdym widać, na jakim jest etapie, od analizy po wydanie, a gdy pomysł, na który głosujesz, trafi do aplikacji, dostaniesz powiadomienie. Plan rozwoju i lista zmian są też na stronie.",
    },
    whatsNew: {
      name: "Co nowego w aplikacji",
      body: "Ustawienia pokazują Twoją wersję z przyciskiem Co nowego: co jest nowe, lepsze i naprawione, prostymi słowami. Po aktualizacji ekran Dziś wspomina o tym raz i pokazuje tylko to, z czego już możesz korzystać.",
    },
    "icon-badge": {
      name: "Liczba na ikonie aplikacji",
      body: "Ikona aplikacji pokazuje, ile wiadomości, polubień, komentarzy i próśb o obserwowanie czeka. W aplikacji czerwone liczby przy Znajomych i Twoim trenerze pokazują, gdzie są, a liczba znika, gdy je zobaczysz. Wyłącza ją przełącznik w Ustawienia › Przypomnienia.",
      note: "Android i iPhone. Aplikacja internetowa pokazuje ją po instalacji z Chrome, Edge lub Safari.",
    },
    languages: {
      name: "Dziesięć języków",
      body: "Angielski, hiszpański, francuski, niemiecki, włoski, japoński, portugalski (Brazylia), koreański, polski i turecki, zgodnie z językiem telefonu lub przeglądarki albo do wyboru na ekranie powitalnym i w ustawieniach.",
    },
    "settings-search": {
      name: "Szukaj w ustawieniach",
      body: "Wpisz słowo na górze Ustawień, a pojawi się każde pasujące ustawienie z miejscem, gdzie jest. Dotknij, a otworzy się z tym ustawieniem na widoku.",
    },
    appearance: {
      name: "Ciemny, jasny albo jak w telefonie",
      body: "Domyślnie ciemny wygląd, do wyboru jasny albo taki, jakiego używa telefon.",
    },
    a11y: {
      name: "Dostępność",
      body: "Większy tekst do 150%, kolory bezpieczne dla daltonistów, wyższy kontrast, obsługa czytników ekranu i pełna obsługa z klawiatury, sprawdzane według WCAG 2.2 AA.",
    },
    "one-hand": {
      name: "Obsługa jedną ręką",
      body: "Przenieś przyciski ciężaru i powtórzeń obok Zapisz serię, pod lewy albo prawy kciuk.",
    },
    "big-numbers": {
      name: "Duże liczby",
      body: "W trakcie serii ciężar i powtórzenia są dużo większe, a przycisk Zapisz serię wyższy, zaś muzyka i to, co dalej, czekają na przerwę. Łatwo przeczytać z odległości ręki, w środku serii.",
    },
    lean: {
      name: "Tryb oszczędny, dźwięki i wibracje",
      body: "Wyłącz animacje i konfetti, dźwięki albo wibracje, każde jednym przełącznikiem.",
    },
    "lite-demos": {
      name: "Oszczędzanie baterii w postaciach 3D",
      body: "Rysuj demonstracje ćwiczeń i mapę regeneracji w niższej rozdzielczości i liczbie klatek, dla starszych telefonów i dłuższej pracy na baterii.",
    },
    desktop: {
      name: "Układ na komputer",
      body: "Na komputerze aplikacja webowa ma pasek boczny, szerokie strony, skróty klawiszowe w trakcie treningu (L zapisuje serię) i szeroki kreator rutyn.",
      note: "Aplikacja webowa w szerokim oknie z myszą; telefony i tablety zachowują układ telefonu.",
    },
    "lab-rep-count": {
      name: "Liczenie powtórzeń kamerą",
      body: "Postaw telefon, a kamera policzy twoje powtórzenia, rysując szkielet na obrazie. Nic nie opuszcza telefonu.",
    },
    "lab-bar-speed": {
      name: "Prędkość sztangi z kamery",
      body: "Pokazuje, jak szybko porusza się sztanga i kiedy zwolniła na tyle, żeby zakończyć serię.",
    },
    "lab-form": {
      name: "Kontrola techniki kamerą",
      body: "Wyłapuje przysiady powyżej równoległej, skrócone powtórzenia i przechylanie się na bok, i daje jedną wskazówkę między seriami.",
    },
    "lab-speed-max": {
      name: "Dzisiejsze maksimum z rozgrzewki",
      body: "Na podstawie prędkości sztangi w rozgrzewce proponuje nieco cięższy albo lżejszy pierwszy ciężar roboczy.",
    },
    "lab-bar-path": {
      name: "Powtórka toru sztangi",
      body: "Odtwarza powtórzenie przysiadu, martwego ciągu albo wyciskania nad głowę z narysowanym torem sztangi i jedną wskazówką, jeśli tor uciekł.",
    },
    "lab-motion": {
      name: "Liczenie powtórzeń czujnikami ruchu telefonu",
      body: "Liczy powtórzenia z czujników ruchu telefonu, gdy porusza się razem z tobą.",
      note: "Telefony i tablety z czujnikami ruchu.",
    },
    "lab-watch-reps": {
      name: "Liczenie powtórzeń zegarkiem",
      body: "Twój zegarek z Wear OS albo Apple Watch liczy powtórzenia z ruchu nadgarstka.",
    },
    "lab-hands-free": {
      name: "Serie bez użycia rąk",
      body: "Gdy licznik powtórzeń liczy, seria zapisuje się sama kilka sekund po ostatnim powtórzeniu.",
    },
    "lab-watch-auto": {
      name: "Serie bez rąk z zegarkiem",
      body: "Zacznij kolejną serię, a zegarek sam zakończy przerwę, policzy powtórzenia i zapisze serię, wibrując przy każdym kroku.",
      note: "Wear OS i Apple Watch, z włączonym liczeniem powtórzeń zegarkiem.",
    },
    "lab-watch-speed": {
      name: "Prędkość sztangi z nadgarstka",
      body: "Zegarek mierzy, jak szybko podnosisz każde powtórzenie, i wibruje, gdy seria zwolniła na tyle, że można ją zakończyć. Prędkości z rozgrzewki dopasowują pierwszy ciężar roboczy, bez kamery.",
      note: "Wear OS i Apple Watch, przy włączonym liczeniu powtórzeń zegarkiem.",
    },
    "lab-voice": {
      name: "Głosowy zapis serii",
      body: "Powiedz „100 na 8” albo „za lekko”, żeby zapisać serię. Rozpoznawane na urządzeniu; żaden dźwięk go nie opuszcza.",
      note: "Przeglądarka: Chrome 139 lub nowszy.",
    },
    "lab-volume": {
      name: "Przycisk głośności zapisuje serię",
      body: "Naciśnij głośniej na telefonie albo słuchawkach, żeby zapisać serię.",
    },
    "lab-tempo": {
      name: "Trener tempa",
      body: "W ćwiczeniach z tempem i pauzą odlicza dźwiękiem i wibracją opuszczanie, zatrzymanie i podnoszenie w każdym powtórzeniu.",
    },
    "lab-hr-rest": {
      name: "Przerwa sterowana tętnem",
      body: "Kończy przerwę wcześniej, gdy tętno spadnie, ale nigdy poniżej 60% zaplanowanej przerwy.",
    },
    "lab-machines": {
      name: "Maszyny na siłowni z Bluetooth",
      body: "Rowery, wioślarze, bieżnie i orbitreki wpisują czas, dystans i moc serii cardio.",
      note: "Przeglądarka: tylko Chrome.",
    },
    "lab-scale": {
      name: "Inteligentna waga z Bluetooth",
      body: "Stań na zgodnej wadze, a ważenie uzupełni twoją wagę i tkankę tłuszczową, żebyś mógł sprawdzić i zapisać.",
      note: "Przeglądarka: tylko Chrome.",
    },
    "lab-sonos": {
      name: "Sonos",
      body: "Steruj głośnikiem Sonos z poziomu treningu, z jedną głośnością na serie i inną na przerwy.",
    },
  },
  connectionGroups: {
    health: "Aplikacje zdrowotne",
    watches: "Zegarki i tętno",
    bluetooth: "Sprzęt Bluetooth (Laboratorium)",
    services: "Usługi fitness (wymagają darmowego konta)",
    music: "Muzyka i głośniki",
    other: "Kalendarze i inne aplikacje",
  },
  connections: {
    "health-connect": {
      name: "Health Connect",
      does: "Ważenia, tkanka tłuszczowa, sen, HRV, tętno, kroki i jedzenie do aplikacji; ukończone treningi na zewnątrz; po włączeniu także treningi z innych aplikacji do aplikacji",
    },
    "apple-health": {
      name: "Apple Zdrowie",
      does: "Ważenia, tkanka tłuszczowa, sen, HRV, tętno, kroki, jedzenie, wzrost, wiek i płeć do aplikacji; ukończone treningi na zewnątrz; po włączeniu także treningi z innych aplikacji do aplikacji",
    },
    "samsung-health": {
      name: "Samsung Health",
      does: "Jej odczyty, gdy udostępnisz je w Health Connect",
    },
    "health-devices": {
      name: "Fitbit, Garmin Connect, inteligentne wagi, Hume Body Pod",
      does: "Wszystko, co zapisują w aplikacji zdrowotnej telefonu",
    },
    "wear-os": {
      name: "Zegarki z Wear OS",
      does: "Trening na nadgarstku, tętno, Zapisz serię i +30 s",
    },
    "apple-watch": {
      name: "Apple Watch",
      does: "Trening na nadgarstku, tętno, Zapisz serię i +30 s",
    },
    garmin: {
      name: "Zegarki Garmin (Connect IQ)",
      does: "Trening na nadgarstku z aplikacją Liftsmith na zegarek",
    },
    "hr-strap": {
      name: "Pasy do pomiaru tętna z Bluetooth",
      does: "Tętno na żywo w seriach i przerwach (każdy pas lub opaska, która udostępnia standardowe tętno przez Bluetooth)",
    },
    scale: {
      name: "Inteligentne wagi z Bluetooth",
      does: "Waga i tkanka tłuszczowa przy ważeniu (wagi udostępniające standardową usługę Weight Scale lub Body Composition)",
      link: "Zgodne wagi",
    },
    machines: {
      name: "Maszyny na siłowni z Bluetooth",
      does: "Czas, dystans i moc z rowerów, wioślarzy, bieżni i orbitreków udostępniających standardową usługę Fitness Machine",
    },
    oura: {
      name: "Oura",
      does: "Sen, HRV, tętno spoczynkowe i kroki do aplikacji",
    },
    strava: {
      name: "Strava",
      does: "Każdy ukończony trening publikowany na Stravie",
    },
    "garmin-connect": {
      does: "Sen, HRV, tętno spoczynkowe, kroki i pomiary z wagi Index trafiają do aplikacji, a biegi, jazdy rowerem i wiosłowanie w pomieszczeniu jako treningi cardio",
    },
    whoop: {
      name: "WHOOP",
      does: "Sen, regeneracja, HRV i tętno spoczynkowe do aplikacji",
    },
    withings: {
      name: "Withings",
      does: "Ważenia, tkanka tłuszczowa, sen i kroki do aplikacji",
    },
    polar: {
      name: "Polar",
      does: "Nightly Recharge, HRV i sen do aplikacji",
    },
    concept2: {
      name: "Concept2 Logbook",
      does: "Sesje na RowErg, SkiErg i BikeErg jako treningi cardio",
    },
    "music-apps": {
      name: "Spotify, YouTube Music i inne aplikacje muzyczne",
      does: "Odtwarzanie, pauza i przewijanie z ekranu Dziś i z treningu, z tytułem utworu",
    },
    "apple-music": {
      name: "Apple Music",
      does: "Odtwarzanie, pauza i przewijanie z ekranu Dziś i z treningu, z tytułem utworu",
    },
    sonos: {
      name: "Sonos",
      does: "Odtwarzanie, pauza, przewijanie i głośność z treningu; muzyka podąża za seriami i przerwami",
    },
    calendar: {
      name: "Kalendarz w telefonie (Google, iCloud, Outlook)",
      does: "Dni treningowe w kalendarzu i treningi dopasowane do zajętych godzin",
    },
    ics: {
      name: "Dowolny kalendarz (plik .ics)",
      does: "Dni treningowe jako plik kalendarza",
    },
    import: {
      name: "Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes",
      does: "Twoja historia treningów zaimportowana z ich pliku eksportu",
      link: "Jak się przenieść",
    },
  },
};
