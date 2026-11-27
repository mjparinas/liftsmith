import type { ExerciseGuide } from "../exerciseGuides";

// The exercise guides in Polish (ty). Same order and parts as the English guides (lower.ts, upper.ts).
export const PL_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "Przysiad ze sztangą na plecach to klasyczne ćwiczenie siłowe na dolne partie ciała. Mocno angażuje czworogłowe, pośladki i przywodziciele, pozwala dźwigać duże ciężary i robić postępy latami, a przy okazji buduje silny tułów.",
    mistakes: [
      [
        "Kolana uciekają do środka przy wstawaniu",
        "Przez całe powtórzenie wypychaj kolana na zewnątrz, nad palce stóp, i zmniejsz ciężar, dopóki to nie wychodzi.",
      ],
      [
        "Coraz płytszy przysiad przy większym ciężarze",
        "Schodź w każdym powtórzeniu na tę samą głębokość, przynajmniej ze zgięciem biodra na wysokości kolana, jeśli biodra na to pozwalają.",
      ],
      [
        "Utrata napięcia tułowia na dole",
        "Przed każdym powtórzeniem weź głęboki wdech do brzucha i trzymaj go, aż miniesz najtrudniejszy moment.",
      ],
      [
        "Pięty odrywają się od podłogi",
        "Trzymaj ciężar nad środkiem stopy. Pomóc mogą buty z podwyższoną piętą albo nieco szersze ustawienie stóp.",
      ],
    ],
    sets: [
      "**Siła:** 3 do 5 serii po 3 do 6 powtórzeń, przerwa 3 do 5 minut.",
      "**Masa mięśniowa:** 3 do 4 serii po 6 do 10 powtórzeń, przerwa 2 do 3 minut.",
      "**Na początek:** 3 serie po 8 powtórzeń z ciężarem, który podniósłbyś 10 do 12 razy, dokładając trochę na każdym treningu.",
    ],
    variations: [
      ["front-squat", "Bardziej wyprostowana sylwetka, więcej pracy czworogłowych, mniejsze obciążenie dolnego odcinka pleców."],
      ["box-squat", "Uczy siadania w tył i schodzenia na tę samą głębokość w każdym powtórzeniu."],
      ["pause-squat", "Buduje siłę z dołu przysiadu, gdzie większość ludzi się zacina."],
      ["goblet-squat", "Najlepszy sposób, żeby nauczyć się ruchu, zanim weźmiesz sztangę."],
    ],
    faq: [
      [
        "Jak głęboko robić przysiad?",
        "Tak głęboko, jak możesz, utrzymując pozycję pleców i pięty na podłodze. U większości osób to poziom równoległy do podłogi albo odrobinę niżej.",
      ],
      [
        "Sztanga wysoko czy nisko?",
        "Sztanga wysoko leży na górze barków i sylwetka jest bardziej wyprostowana; sztanga nisko leży niżej i pozwala podnieść trochę więcej. Obie wersje działają.",
      ],
      [
        "Czy potrzebuję pasa?",
        "Na początek nie. Najpierw naucz się napinać tułów bez niego; pas może pomóc później przy ciężkich seriach. Zobacz [pas treningowy](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "W przysiadzie przednim sztanga leży z przodu na barkach, co utrzymuje tułów w pionie i przenosi więcej pracy na mięśnie czworogłowe. Mniej obciąża dolny odcinek pleców niż przysiad ze sztangą na plecach i świetnie uczy dobrej postawy w przysiadzie.",
    mistakes: [
      ["Opadające łokcie", "Przez całe powtórzenie pchaj łokcie w górę i do przodu. Jeśli sztanga się stacza, to łokcie opadły pierwsze."],
      [
        "Trzymanie sztangi dłońmi",
        "Sztanga leży na barkach, palce tylko ją przytrzymują. Przy sztywnych nadgarstkach użyj chwytu ze skrzyżowanymi rękami albo pasków.",
      ],
      [
        "Zaokrąglanie górnej części pleców",
        "Trzymaj klatkę wysoko i mocno napnij tułów. Lżejszy ciężar z wysoką klatką jest lepszy niż cięższy, przy którym się składasz.",
      ],
    ],
    sets: ["**Siła:** 3 do 5 serii po 3 do 5 powtórzeń.", "**Masa mięśniowa:** 3 serie po 6 do 10 powtórzeń."],
    variations: [
      ["goblet-squat", "Ta sama wyprostowana pozycja z hantlem, łatwiejsza do nauki."],
      ["back-squat", "Pozwala podnieść większy ciężar."],
      ["db-front-squat", "Bez stojaka i bez rozciągania nadgarstków."],
    ],
    faq: [
      [
        "Czy przysiad przedni jest lepszy od przysiadu ze sztangą na plecach?",
        "Żaden nie jest lepszy. Przysiad przedni bardziej angażuje czworogłowe i oszczędza plecy; przysiad ze sztangą na plecach pozwala podnieść więcej.",
      ],
      [
        "Dlaczego przy przysiadzie przednim bolą mnie nadgarstki?",
        "Przez sztywne nadgarstki i najszersze grzbietu. Trzymaj pod sztangą tylko dwa lub trzy palce albo użyj chwytu ze skrzyżowanymi rękami.",
      ],
    ],
  },
  "goblet-squat": {
    intro:
      "W przysiadzie goblet trzymasz jeden hantel albo kettlebell przy klatce. Ciężar z przodu ułatwia utrzymanie pionu i głęboki przysiad, dlatego to najlepszy sposób na naukę przysiadu i świetne ćwiczenie na nogi w domu.",
    mistakes: [
      ["Ciężar ciągnie cię do przodu", "Trzymaj ciężar przy klatce, a łokcie schowane pod nim."],
      ["Za płytki przysiad", "Siadaj między pięty, tak żeby na dole łokcie musnęły kolana."],
      ["Pośpiech w powtórzeniach", "Opuszczaj się przez dwie lub trzy sekundy. Lekki ciężar robi się wtedy dużo trudniejszy."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie po 8 do 15 powtórzeń.",
      "**W domu z lekkimi ciężarami:** 3 serie po 15 do 20 powtórzeń z wolnym opuszczaniem.",
    ],
    variations: [
      ["kb-goblet-squat", "Ten sam ruch z kettlebellem trzymanym za rączkę po bokach."],
      ["db-goblet-squat-heels", "Z podwyższonymi piętami: więcej czworogłowych i głębszy przysiad."],
      ["back-squat", "Kolejny krok, gdy zabraknie cięższych hantli."],
    ],
    faq: [
      [
        "Czy przysiad goblet dobrze buduje nogi?",
        "Tak, dopóki najcięższy hantel, jaki masz, nie zrobi się łatwy. Wtedy zwolnij powtórzenia, zatrzymuj się na dole albo przejdź na przysiad ze sztangą.",
      ],
      ["Hantel czy kettlebell?", "Obojętnie. Hantel trzymaj pionowo za jeden koniec, a kettlebell za rączkę po bokach."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "W przysiadzie bułgarskim tylna stopa leży na ławce, więc prawie całą pracę wykonuje przednia noga. Buduje czworogłowe i pośladki na każdą nogę osobno przy ułamku ciężaru z przysiadu ze sztangą, dlatego oszczędza dolny odcinek pleców.",
    mistakes: [
      [
        "Przednia stopa za blisko ławki",
        "Wykrocz na tyle daleko, żeby przednia goleń była mniej więcej pionowa, a kolano mogło swobodnie zgiąć się na dole.",
      ],
      ["Odpychanie się tylną stopą", "Tylna stopa służy tylko do równowagi. Trzymaj większość ciężaru na pięcie i środku przedniej stopy."],
      ["Utrata równowagi", "Przytrzymaj się czegoś jedną ręką albo użyj niższej ławki, dopóki nie złapiesz stabilności."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie po 8 do 12 powtórzeń na nogę, zaczynając od słabszej strony.",
      "**W domu:** 3 serie po 12 do 20 powtórzeń na nogę z masą ciała albo lekkimi hantlami.",
    ],
    variations: [
      ["split-squat", "Obie stopy na podłodze: łatwiej o równowagę."],
      ["front-foot-elevated-split-squat", "Głębsze rozciągnięcie przedniej nogi."],
      ["barbell-bulgarian-split-squat", "Większe obciążenie, gdy hantle robią się niewygodne do trzymania."],
    ],
    faq: [
      [
        "Czworogłowe czy pośladki?",
        "Jedno i drugie. Bardziej wyprostowany tułów i krótszy rozkrok angażują czworogłowe; pochylenie do przodu i dłuższy rozkrok bardziej pracują na pośladki.",
      ],
      [
        "Dlaczego to takie trudne?",
        "Jedna noga wykonuje pracę dwóch, a dochodzi jeszcze równowaga. Zacznij lekko; zdziwisz się, jak szybko rośnie ciężar.",
      ],
    ],
  },
  "leg-press": {
    intro:
      "Wypychanie na suwnicy trenuje czworogłowe i pośladki bez obciążania kręgosłupa i bez potrzeby utrzymywania równowagi, więc możesz mocno i bezpiecznie dociążyć nogi, nawet gdy plecy albo technika ograniczałyby przysiad.",
    mistakes: [
      ["Dolny odcinek pleców odrywa się od oparcia", "Schodź tylko tak nisko, jak możesz z biodrami i dolną częścią pleców na siedzisku."],
      ["Mocne blokowanie kolan na górze", "Zatrzymaj się tuż przed pełnym wyprostem i od razu przejdź do kolejnego powtórzenia."],
      [
        "Skracanie ruchu, żeby wziąć większy ciężar",
        "Pełny, kontrolowany zakres z mniejszym ciężarem buduje więcej mięśni niż połówki z całym stosem.",
      ],
    ],
    sets: [
      "**Masa mięśniowa:** 3 do 4 serii po 8 do 15 powtórzeń.",
      "**Na koniec treningu:** 1 do 2 serii po 15 do 25 powtórzeń po przysiadach.",
    ],
    variations: [
      ["narrow-leg-press", "Stopy niżej i bliżej siebie: więcej czworogłowych."],
      ["wide-leg-press", "Stopy wyżej i szerzej: więcej pośladków i przywodzicieli."],
      ["single-leg-press", "Po jednej nodze, żeby wyrównać różnice."],
    ],
    faq: [
      [
        "Czy suwnica jest tak samo dobra jak przysiady?",
        "Do budowy mięśni nóg jest blisko. Przysiady trenują też równowagę i tułów; suwnica pozwala mocniej dociążyć nogi przy mniejszym zmęczeniu.",
      ],
      [
        "Gdzie postawić stopy?",
        "Dobry punkt wyjścia to środek platformy, mniej więcej na szerokość barków. Wyżej dla pośladków, niżej dla czworogłowych.",
      ],
    ],
  },
  "hack-squat": {
    intro:
      "Maszyna do hack przysiadu prowadzi cię przez przysiad na saniach, z podpartymi plecami. To jedno z najlepszych ćwiczeń na czworogłowe, bo możesz zejść głęboko i mocno pchać bez balansowania sztangą.",
    mistakes: [
      ["Stopy za wysoko na platformie", "Postaw stopy na środku albo trochę niżej, żeby bardziej pracowały czworogłowe, z piętami płasko."],
      ["Odbijanie się z dołu", "Kontroluj opuszczanie i zatrzymaj się na chwilę, zanim wypchniesz w górę."],
      ["Niepełne powtórzenia", "Schodź tak głęboko, jak pozwalają biodra, bez odrywania dolnej części pleców od oparcia."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 6 do 12 powtórzeń.", "**Siła:** 3 serie po 5 do 8 powtórzeń, po głównym przysiadzie."],
    variations: [
      ["pendulum-squat", "Podobna maszyna z głębszym łukiem ruchu."],
      ["leg-press", "Zero obciążenia na barkach."],
      ["back-squat", "Wolny ciężar, trenuje równowagę i tułów."],
    ],
    faq: [
      [
        "Czy hack przysiad szkodzi kolanom?",
        "Nie. Kolana wychodzące przed palce stóp to coś normalnego. Zwiększaj ciężar stopniowo i ćwicz bez bólu.",
      ],
      [
        "Hack przysiad czy suwnica?",
        "Hack przysiad zwykle trochę mocniej angażuje czworogłowe; suwnica mniej obciąża barki i plecy. Oba są dobre.",
      ],
    ],
  },
  deadlift: {
    intro:
      "W martwym ciągu podnosisz obciążoną sztangę z podłogi. Trenuje całą tylną część ciała: pośladki, dwugłowe uda, plecy i chwyt, i zwykle to w nim ludzie podnoszą największe ciężary.",
    mistakes: [
      ["Sztanga odjeżdża od nóg", "Prowadź sztangę przy goleniach i udach przez cały ruch. Zacznij z nią nad środkiem stopy."],
      ["Zaokrąglanie dolnego odcinka pleców", "Mocno napnij tułów przed ciągnięciem i zmniejsz ciężar, jeśli plecy nie trzymają pozycji."],
      ["Szarpanie sztangi z podłogi", "Najpierw wybierz luz: napinaj się, aż sztanga stuknie o talerze, potem odepchnij podłogę."],
      ["Mocne odchylanie się na górze", "Skończ, stojąc prosto z napiętymi pośladkami. Nie ma potrzeby odchylać się do tyłu."],
    ],
    sets: [
      "**Siła:** 2 do 4 serii po 2 do 5 powtórzeń, przerwa 3 do 5 minut.",
      "**Masa mięśniowa:** 3 serie po 5 do 8 powtórzeń. Martwy ciąg mocno męczy, więc większość ludzi robi go raz w tygodniu.",
    ],
    variations: [
      ["trap-bar-deadlift", "Łatwiejszy do nauki, bardziej wyprostowany, oszczędza plecy."],
      ["sumo-deadlift", "Szerokie ustawienie, które niektórym sylwetkom pasuje lepiej."],
      ["romanian-deadlift", "Zaczyna się z góry i mocniej obciąża dwugłowe uda."],
      ["paused-deadlift", "Buduje kontrolę tuż nad podłogą."],
    ],
    faq: [
      [
        "Jak często robić martwy ciąg?",
        "Większości osób wystarczy raz w tygodniu, z lżejszym ruchem biodrowym, np. rumuńskim martwym ciągiem, innego dnia.",
      ],
      [
        "Czy można upuścić sztangę na górze?",
        "Opuszczaj ją pod kontrolą. Upuszczanie z góry niszczy talerze i podłogę, a do tego pomija połowę powtórzenia.",
      ],
      [
        "Czy używać pasków?",
        "W najcięższych seriach, jeśli pierwszy poddaje się chwyt. Chwyt trenuj w seriach rozgrzewkowych. Zobacz [siła chwytu](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "W martwym ciągu sumo stoisz szeroko, z dłońmi wewnątrz kolan. Skraca to drogę sztangi i pozwala utrzymać bardziej wyprostowaną sylwetkę, przenosząc więcej pracy na biodra, czworogłowe i przywodziciele.",
    mistakes: [
      ["Za szerokie ustawienie", "Stań tylko tak szeroko, żeby golenie były mniej więcej pionowe, a kolana szły nad palcami stóp."],
      ["Biodra wystrzeliwują w górę pierwsze", "Wypychaj kolana na zewnątrz i rozpychaj podłogę, żeby biodra i klatka szły w górę razem."],
      ["Start z luźnymi rękami", "Wybierz luz ze sztangi, zanim oderwie się od podłogi."],
    ],
    sets: ["**Siła:** 3 do 5 serii po 2 do 5 powtórzeń.", "**Masa mięśniowa:** 3 serie po 5 do 8 powtórzeń."],
    variations: [
      ["deadlift", "Klasyczne ustawienie, więcej dwugłowych ud i pleców."],
      ["kb-sumo-deadlift", "Lekki sposób na naukę ustawienia."],
      ["trap-bar-deadlift", "Wyprostowana sylwetka jak w sumo, prostsze ustawienie."],
    ],
    faq: [
      [
        "Czy sumo to oszukiwanie?",
        "Nie. To uznany styl w trójboju siłowym. Wybierz ustawienie, które pasuje do twojego ciała i pozwala dobrze dźwigać.",
      ],
      ["Sumo czy klasyczny?", "Spróbuj obu przez kilka tygodni. Osoby z dłuższymi nogami i krótszymi rękami często wolą sumo."],
    ],
  },
  "romanian-deadlift": {
    intro:
      "Rumuński martwy ciąg zaczynasz na stojąco i opuszczasz sztangę, cofając biodra przy prawie prostych nogach. To jedno z najlepszych ćwiczeń na dwugłowe uda i pośladki, bo obciąża je w długim rozciągnięciu.",
    mistakes: [
      [
        "Za mocne zginanie kolan",
        "Utrzymuj lekkie, stałe ugięcie. Jeśli kolana zginają się coraz bardziej przy opuszczaniu, robi się z tego przysiad.",
      ],
      ["Schodzenie za nisko", "Opuszczaj tylko tak długo, jak biodra idą do tyłu, a plecy są płaskie, zwykle do połowy goleni."],
      ["Sztanga daleko od nóg", "Prowadź ją po udach. Im bliżej, tym mniej obciąża dolny odcinek pleców."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie po 6 do 12 powtórzeń z wolnym opuszczaniem.",
      "**Po martwym ciągu:** 2 do 3 serii po 8 do 10 powtórzeń, lżej.",
    ],
    variations: [
      ["db-rdl", "Z hantlami, świetne w domu."],
      ["single-leg-rdl", "Na jednej nodze: równowaga i mniejszy ciężar."],
      ["stiff-leg-deadlift", "Każde powtórzenie zaczyna się od podłogi."],
    ],
    faq: [
      [
        "Rumuński martwy ciąg a martwy ciąg?",
        "Rumuński zaczyna się z góry i mocniej obciąża dwugłowe uda; klasyczny zaczyna się z podłogi i pozwala podnieść więcej.",
      ],
      [
        "Gdzie mam to czuć?",
        "Z tyłu ud i w pośladkach. Jeśli czujesz to głównie w dolnym odcinku pleców, zmniejsz ciężar i cofaj biodra dalej.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "W martwym ciągu na trap bar stoisz w środku sześciokątnej sztangi z uchwytami po bokach. Możesz utrzymać bardziej wyprostowaną sylwetkę, co odciąża dolny odcinek pleców, więc to najłatwiejszy martwy ciąg do nauki i do dźwigania dużych ciężarów.",
    mistakes: [
      ["Robienie z tego przysiadu", "To nadal ruch z bioder. Cofnij biodra, żeby sięgnąć uchwytów, potem odepchnij podłogę."],
      ["Stanie poza środkiem sztangi", "Stań tak, żeby uchwyty były na wysokości środka stopy."],
      ["Utrata napięcia na dole", "Ustawiaj się od nowa między powtórzeniami albo lekko dotykaj podłogi; nie odbijaj talerzy."],
    ],
    sets: ["**Siła:** 3 do 5 serii po 3 do 5 powtórzeń.", "**Masa mięśniowa lub sport:** 3 serie po 5 do 8 powtórzeń."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Wysokie uchwyty: krótszy zakres dla początkujących i wysokich osób."],
      ["deadlift", "Prosta sztanga, więcej pleców i dwugłowych ud."],
      ["trap-bar-rdl", "Wersja skupiona na dwugłowych udach."],
    ],
    faq: [
      [
        "Czy martwy ciąg na trap bar jest łatwiejszy?",
        "Większość ludzi łatwiej się go uczy i podnosi na nim trochę więcej, bo sylwetka jest bardziej wyprostowana.",
      ],
      [
        "Czy pracują te same mięśnie?",
        "W większości tak. Trochę więcej pracują czworogłowe, a trochę mniej dolny odcinek pleców niż przy prostej sztandze.",
      ],
    ],
  },
  "hip-thrust": {
    intro:
      "W hip thruście opierasz górną część pleców o ławkę i wypychasz biodrami obciążoną sztangę w górę. Obciąża pośladki w pełnym wyproście bioder mocniej niż prawie każde inne ćwiczenie.",
    mistakes: [
      [
        "Wyginanie dolnego odcinka pleców na górze",
        "Przyciągnij brodę i trzymaj żebra w dole; kończ ruch, napinając pośladki, a nie wyginając plecy.",
      ],
      [
        "Stopy w złym miejscu",
        "Na górze golenie powinny być mniej więcej pionowe. Za blisko i przejmują czworogłowe, za daleko i przejmują dwugłowe uda.",
      ],
      ["Pośpiech na górze", "W każdym powtórzeniu zatrzymaj się na górze na sekundę."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 8 do 12 powtórzeń.", "**Siła:** 3 serie po 5 do 8 powtórzeń z zatrzymaniem na górze."],
    variations: [
      ["glute-bridge", "Z podłogi: łatwiej się ustawić, krótszy zakres."],
      ["db-hip-thrust", "Jeden hantel na biodrach, dobre w domu."],
      ["single-leg-hip-thrust", "Na jednej nodze, bez obciążenia."],
    ],
    faq: [
      ["Czy potrzebuję nakładki na sztangę?", "Nakładka albo złożona mata sprawia, że cięższe serie są dużo wygodniejsze."],
      [
        "Hip thrust czy przysiad na pośladki?",
        "Jedno i drugie. Przysiady pracują na pośladki w głębokim rozciągnięciu; hip thrusty najmocniej na górze. Zobacz [trening pośladków](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "W mostku biodrowym unosisz biodra z podłogi, leżąc plecami na ziemi. To proste ćwiczenie na pośladki, które zrobisz wszędzie, i dobry sposób, żeby nauczyć się ich używać przed hip thrustami.",
    mistakes: [
      ["Pchanie przez palce stóp", "Wypychaj przez pięty, żeby pracowały pośladki."],
      ["Wyginanie pleców, żeby wejść wyżej", "Zatrzymaj się, gdy biodra i uda tworzą prostą linię. Tam napnij pośladki."],
      ["Pędzenie przez powtórzenia", "Zatrzymaj się na górze na jedną lub dwie sekundy."],
    ],
    sets: [
      "**W domu:** 3 serie po 15 do 25 powtórzeń z zatrzymaniem na górze.",
      "**Z obciążeniem:** 3 serie po 10 do 15 powtórzeń z hantlem albo sztangą na biodrach.",
    ],
    variations: [
      ["single-leg-glute-bridge", "Dwa razy więcej pracy na każdą stronę."],
      ["hip-thrust", "Plecy na ławce: dłuższy zakres i większe ciężary."],
      ["marching-glute-bridge", "Dodaje pracę na stabilizację tułowia i bioder."],
    ],
    faq: [
      [
        "Mostek biodrowy czy hip thrust?",
        "Mostek jest łatwiejszy i niczego nie wymaga; hip thrust ma dłuższy zakres i pozwala wziąć większy ciężar.",
      ],
      ["Dlaczego czuję to w dwugłowych udach?", "Przysuń stopy trochę bliżej bioder i wypychaj przez pięty."],
    ],
  },
  "walking-lunge": {
    intro:
      "Wykroki chodzone to krok za krokiem do przodu, raz za razem. Trenują czworogłowe i pośladki na każdą nogę osobno, sprawdzają równowagę i podnoszą tętno.",
    mistakes: [
      ["Za krótkie kroki", "Rób na tyle długi krok, żeby na dole oba kolana zgięły się mniej więcej do 90 stopni."],
      ["Przednie kolano ucieka do środka", "Trzymaj przednie kolano w linii z palcami stóp."],
      ["Uderzanie tylnym kolanem o podłogę", "Opuszczaj się pod kontrolą, aż tylne kolano prawie dotknie podłogi."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie po 10 do 12 kroków na nogę.",
      "**Kondycja:** 2 do 3 serii po 20 do 30 kroków łącznie, z krótkimi przerwami.",
    ],
    variations: [
      ["reverse-lunge", "Krok w tył jest łatwiejszy dla kolan i równowagi."],
      ["barbell-walking-lunge", "Większe obciążenie, gdy hantle robią się za ciężkie do trzymania."],
      ["bulgarian-split-squat", "W miejscu, mocniej izoluje każdą nogę."],
    ],
    faq: [
      [
        "Wykroki chodzone czy wykroki w tył?",
        "Wykroki w tył łatwiej kontrolować i mniej obciążają kolana; chodzone dodają równowagę i kondycję.",
      ],
      ["Ile miejsca potrzebuję?", "Około 10 metrów na serię. Jeśli nie masz miejsca, zawróć albo zrób wykroki w tył."],
    ],
  },
  "reverse-lunge": {
    intro:
      "W wykroku w tył robisz krok do tyłu. Dzięki temu ciężar zostaje nad przednią stopą, co ułatwia równowagę i mniej obciąża kolana niż wykrok do przodu.",
    mistakes: [
      ["Za wąski krok", "Rób krok w tył jak po torach kolejowych, a nie po linie, żeby zachować równowagę."],
      ["Odpychanie się tylną stopą", "Wstawaj przez piętę przedniej nogi; tylna noga tylko pomaga w równowadze."],
      ["Mocne pochylanie się do przodu", "Trzymaj się dość prosto, z lekkim pochyleniem do przodu dla większej pracy pośladków."],
    ],
    sets: [
      "**Z masą ciała:** 3 serie po 12 do 20 powtórzeń na nogę.",
      "**Z obciążeniem:** 3 serie po 8 do 12 powtórzeń na nogę z hantlami.",
    ],
    variations: [
      ["db-reverse-lunge", "Z hantlami dla większego obciążenia."],
      ["deficit-reverse-lunge", "Przednia stopa na stopniu dla głębszego zakresu."],
      ["walking-lunge", "Dodaje równowagę i kondycję."],
    ],
    faq: [
      [
        "Czy wykroki w tył są dobre przy problemach z kolanami?",
        "Zwykle to najwygodniejszy wykrok dla wrażliwych kolan. Ćwicz w zakresie bez bólu.",
      ],
      [
        "Naprzemiennie czy jedna strona naraz?",
        "Obojętnie. Jedna strona naraz jest trudniejsza i łatwiej utrzymać równą liczbę powtórzeń.",
      ],
    ],
  },
  "leg-extension": {
    intro:
      "Na maszynie do prostowania nóg prostujesz kolano pod oporem. To ćwiczenie izoluje czworogłowe, także tę ich część, której przysiady prawie nie trenują, i łatwo w nim bezpiecznie dojść blisko upadku mięśniowego.",
    mistakes: [
      ["Kolano nie w osi maszyny", "Ustaw siedzisko tak, żeby staw kolanowy był w jednej linii z osią obrotu maszyny."],
      ["Wyrzucanie ciężaru", "Podnoś pod kontrolą i zatrzymaj się na chwilę na górze."],
      ["Odrywanie bioder od siedziska", "Trzymaj się uchwytów i dociskaj biodra."],
    ],
    sets: [
      "**Masa mięśniowa:** 2 do 3 serii po 10 do 15 powtórzeń, po przysiadach albo suwnicy.",
      "**Na koniec treningu:** 1 seria 15 do 20 powtórzeń blisko upadku mięśniowego.",
    ],
    variations: [
      ["single-leg-extension", "Po jednej nodze, żeby wyrównać różnice."],
      ["sissy-squat", "Izolacja czworogłowych z masą ciała."],
      ["leg-press", "Ćwiczenie wielostawowe na czworogłowe."],
    ],
    faq: [
      [
        "Czy prostowanie nóg szkodzi kolanom?",
        "Nie przy rozsądnym ciężarze. Często używa się go w rehabilitacji kolan. Przerwij, jeśli czujesz ból stawu.",
      ],
      [
        "Czy potrzebuję prostowania nóg, jeśli robię przysiady?",
        "Niekoniecznie, ale dodaje pracy czworogłowym bez dużego zmęczenia i trenuje mięsień prosty uda, którego przysiady mocno nie rozciągają.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "W uginaniu nóg leżąc zginasz kolana przeciw wałkowi, leżąc twarzą w dół. To ćwiczenie izoluje dwugłowe uda, które ruchy z bioder, jak martwy ciąg, trenują głównie w stawie biodrowym.",
    mistakes: [
      ["Biodra odrywają się od ławki", "Dociśnij biodra do oparcia i trzymaj je tam."],
      ["Używanie rozpędu", "Uginaj płynnie i opuszczaj powoli, przez dwie lub trzy sekundy."],
      ["Krótki zakres", "Opuść nogi, aż będą prawie proste, zanim zaczniesz kolejne powtórzenie."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 8 do 15 powtórzeń."],
    variations: [
      ["seated-leg-curl", "Zgięte biodra, więc dwugłowe pracują z większego rozciągnięcia."],
      ["nordic-curl", "Z masą ciała i bardzo trudne; świetne dla sprinterów."],
      ["slider-leg-curl", "W domu, z ręcznikiem albo slajderami."],
    ],
    faq: [
      [
        "Uginanie nóg leżąc czy siedząc?",
        "Wersja na siedząco mocniej rozciąga dwugłowe uda i może zbudować trochę więcej mięśni. Używaj tej, którą ma twoja siłownia.",
      ],
      [
        "Czy potrzebuję uginania nóg, jeśli robię martwy ciąg?",
        "Uginanie trenuje dwugłowe uda w zginaniu kolana, czego martwy ciąg nie robi. Jedno takie ćwiczenie w tygodniu pomaga.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "W uginaniu nóg siedząc zginasz kolana przeciw wałkowi na siedząco. Pozycja siedząca mocno rozciąga dwugłowe uda, dlatego to jedno z najlepszych ćwiczeń na ich masę.",
    mistakes: [
      ["Za luźny wałek na udach", "Mocno dociśnij wałek na udach, żeby nogi nie mogły się unosić."],
      ["Odchylanie się, żeby sobie ułatwić", "Siedź prosto albo lekko pochyl się do przodu, żeby utrzymać rozciągnięcie."],
      ["Pośpiech przy opuszczaniu", "Kontroluj je przez dwie lub trzy sekundy."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 8 do 15 powtórzeń."],
    variations: [
      ["lying-leg-curl", "Proste biodra, gdy maszyna do siedzenia jest zajęta."],
      ["single-leg-curl", "Po jednej nodze."],
      ["romanian-deadlift", "Trenuje dwugłowe uda w stawie biodrowym zamiast kolanowym."],
    ],
    faq: [
      [
        "Czy uginanie nóg siedząc jest lepsze niż leżąc?",
        "Pracuje na dwugłowe uda z większego rozciągnięcia, co może zbudować trochę więcej mięśni. Oba są dobre.",
      ],
      [
        "Jak ciężko robić uginanie nóg?",
        "Na tyle ciężko, żeby ostatnie powtórzenia w każdej serii były trudne, a ty wciąż kontrolował opuszczanie.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "We wspięciach na palce stojąc wspinasz się na palce pod oporem, z prostymi kolanami. Najlepiej trenują większy mięsień łydki, czyli brzuchaty łydki.",
    mistakes: [
      ["Odbijanie się na dole", "W każdym powtórzeniu zatrzymaj się na sekundę w rozciągnięciu na dole."],
      ["Połówki powtórzeń", "Od głębokiego rozciągnięcia do jak najwyższego wspięcia na palce."],
      ["Zginanie kolan", "Trzymaj kolana proste, ale nie zablokowane, żeby pracowały łydki."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 8 do 15 powtórzeń, powoli, dwa lub trzy razy w tygodniu."],
    variations: [
      ["seated-calf-raise", "Zgięte kolana, dla mięśnia płaszczkowatego pod spodem."],
      ["single-leg-calf-raise", "W domu na stopniu, po jednej nodze."],
      ["calf-press", "Na suwnicy."],
    ],
    faq: [
      [
        "Dlaczego łydki mi nie rosną?",
        "Większość ludzi odbija się w krótkich powtórzeniach. Ćwicz w pełnym zakresie z zatrzymaniem w rozciągnięciu i trenuj je częściej. Zobacz [trening łydek](/blog/calf-workout/).",
      ],
      ["Wspięcia stojąc czy siedząc?", "Jedno i drugie. Na stojąco mocniej pracuje brzuchaty łydki, na siedząco płaszczkowaty."],
    ],
  },
  plank: {
    intro:
      "W desce utrzymujesz ciało w prostej linii na przedramionach i palcach stóp. Trenuje brzuch i tułów, żeby nie dawały się zgiąć, co przekłada się na napinanie tułowia pod ciężką sztangą.",
    mistakes: [
      ["Opadające biodra", "Napnij pośladki i przyciągnij żebra w stronę bioder."],
      ["Biodra za wysoko", "Opuść je, aż ciało będzie jedną prostą linią od głowy do pięt."],
      ["Trzymanie przez kilka minut", "Gdy wytrzymasz 60 sekund, utrudnij ćwiczenie, zamiast je wydłużać."],
    ],
    sets: ["**Brzuch:** 2 do 3 podejść po 20 do 60 sekund, dwa lub trzy razy w tygodniu."],
    variations: [
      ["side-plank", "Trenuje mięśnie skośne brzucha i boki bioder."],
      ["long-lever-plank", "Łokcie dalej z przodu: dużo trudniej."],
      ["ab-wheel", "Wersja w ruchu, gdy deska robi się łatwa."],
    ],
    faq: [
      ["Jak długo trzymać deskę?", "20 do 60 sekund w idealnej technice. Powyżej tego więcej da trudniejsza wersja."],
      [
        "Czy deska spala tłuszcz z brzucha?",
        "Żadne ćwiczenie nie spala tłuszczu z jednego miejsca. Zobacz [jak zgubić tłuszcz z brzucha](/blog/how-to-lose-belly-fat/).",
      ],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "W unoszeniu nóg w zwisie wisisz na drążku i unosisz nogi. To jedno z najtrudniejszych ćwiczeń na brzuch: trenuje dolną część brzucha i zginacze bioder, a do tego chwyt.",
    mistakes: [
      ["Bujanie się", "Zaczynaj z nieruchomego zwisu i opuszczaj powoli. Jeśli zaczynasz się bujać, zatrzymaj się na dole."],
      ["Samo unoszenie nóg", "Na górze podwiń miednicę, żeby pracował brzuch, a nie tylko zginacze bioder."],
      ["Chwyt poddaje się pierwszy", "Użyj pętli na ramiona albo trenuj chwyt osobno."],
    ],
    sets: ["**Brzuch:** 3 serie po 6 do 15 powtórzeń."],
    variations: [
      ["hanging-knee-raise", "Ugięte kolana: łatwiejszy pierwszy krok."],
      ["parallel-bar-knee-raise", "Na poręczach, bez pracy chwytu."],
      ["lying-leg-raise", "Na podłodze, jeszcze łatwiej."],
    ],
    faq: [
      ["Jak przestać się bujać?", "Opuszczaj powoli, zatrzymuj się na dole i trzymaj barki aktywne."],
      ["Za trudne?", "Zacznij od unoszenia kolan w zwisie i przejdź na proste nogi, gdy zrobisz 3 serie po 12."],
    ],
  },
  "ab-wheel": {
    intro:
      "Z kółkiem do brzucha wyjeżdżasz do przodu i wracasz. To jedno z najbardziej wymagających ćwiczeń na brzuch: uczy go powstrzymywać wyginanie pleców, gdy ręce sięgają nad głowę.",
    mistakes: [
      ["Opadający dolny odcinek pleców", "Wyjeżdżaj tylko tak daleko, jak możesz bez wyginania pleców. Podwiń miednicę i napnij pośladki."],
      ["Powrót z biodrami na przedzie", "Wracaj brzuchem i rękami razem, a nie wypychając biodra w górę."],
      ["Za daleko za szybko", "Najpierw wyjeżdżaj do ściany albo na krótki dystans, potem co tydzień trochę dalej."],
    ],
    sets: ["**Brzuch:** 3 serie po 5 do 12 powtórzeń z kolan, a gdy będziesz silny, z pozycji stojącej."],
    variations: [
      ["plank", "Wersja statyczna, od której warto zacząć."],
      ["plank-reach", "Łagodniejszy sposób na trening tej samej umiejętności."],
      ["dead-bug", "Na plecach, żeby nauczyć się dociskać dolny odcinek pleców."],
    ],
    faq: [
      [
        "Czy kółko do brzucha szkodzi plecom?",
        "Nie, jeśli zostajesz w zakresie, w którym plecy się nie wyginają. Skróć wyjazd, jeśli czujesz to w dolnym odcinku pleców.",
      ],
      ["Z kolan czy na stojąco?", "Dla większości osób z kolan. Wyjazdy na stojąco to cel dla zaawansowanych."],
    ],
  },
  "kb-swing": {
    intro:
      "W swingu kettlebell energicznie wypychasz biodra do przodu, wyrzucając kettlebell na wysokość klatki. Trenuje dynamicznie pośladki i dwugłowe uda, a przy okazji działa jak trening kondycyjny.",
    mistakes: [
      ["Robienie przysiadu zamiast swingu", "To ruch z bioder: cofnij biodra, tylko lekko zginając kolana."],
      ["Podnoszenie rękami", "To biodra wyrzucają kettlebell w górę; ręce tylko go trzymają."],
      ["Odchylanie się na górze", "Skończ, stojąc prosto z napiętymi pośladkami i brzuchem, jak w desce."],
    ],
    sets: [
      "**Moc:** 5 do 10 serii po 10 powtórzeń, z przerwami według potrzeby.",
      "**Kondycja:** 10 do 20 swingów co minutę przez 10 minut.",
    ],
    variations: [
      ["kb-single-swing", "Jedną ręką: dochodzi skręt, któremu tułów musi się opierać."],
      ["db-swing", "Z hantlem, jeśli nie masz kettlebella."],
      ["kb-deadlift", "Naucz się ruchu z bioder, zanim zaczniesz swingować."],
    ],
    faq: [
      [
        "Jak ciężki kettlebell wybrać?",
        "Na tyle ciężki, żeby swing był dynamiczny, a nie powolny. Wiele kobiet zaczyna od 12 kg, a wielu mężczyzn od 16 do 20 kg.",
      ],
      ["Jak wysoko wyrzucać?", "Mniej więcej na wysokość klatki. Wyżej niewiele dodaje."],
    ],
  },
  "farmers-carry": {
    intro:
      "W spacerze farmera podnosisz dwa ciężkie ciężary i idziesz. Trenuje naraz chwyt, czworoboczne, tułów i postawę, i przekłada się prosto na codzienne życie.",
    mistakes: [
      ["Przechylanie się lub skręcanie", "Idź wyprostowany, z barkami cofniętymi i opuszczonymi, krótkimi, szybkimi krokami."],
      ["Za lekkie ciężary", "Dokończenie dystansu powinno być trudne. To chwyt ma być ograniczeniem."],
      ["Podnoszenie z okrągłymi plecami", "Podnieś ciężary jak w martwym ciągu i odłóż je tak samo."],
    ],
    sets: ["**Siła:** 3 do 5 przejść po 20 do 40 metrów, przerwa 1 do 2 minut."],
    variations: [
      ["db-suitcase-carry", "Ciężar tylko z jednej strony: trenuje mięśnie skośne brzucha."],
      ["trap-bar-carry", "Większe ciężary na jednej sztandze."],
      ["kb-rack-carry", "Kettlebelle przy barkach, dla górnej części pleców."],
    ],
    faq: [
      ["Jaki ciężar do spaceru farmera?", "Zacznij od mniej więcej jednej czwartej masy ciała w każdej ręce i stopniowo zwiększaj."],
      ["Jak daleko iść?", "20 do 40 metrów na przejście albo 30 do 60 sekund."],
    ],
  },
  "good-morning": {
    intro:
      "W skłonie „dzień dobry” trzymasz sztangę na plecach i pochylasz się do przodu w biodrach. Wzmacnia dwugłowe uda, pośladki i dolny odcinek pleców oraz uczy mocnego ruchu z bioder.",
    mistakes: [
      ["Za duży ciężar", "Zacznij lekko. Przy złej technice to ćwiczenie mocno obciąża dolny odcinek pleców."],
      ["Zaokrąglanie pleców", "Trzymaj plecy płasko i klatkę wypiętą; schodź tylko tak nisko, jak to utrzymasz."],
      ["Za mocne zginanie kolan", "Utrzymuj lekkie ugięcie kolan i cofaj biodra prosto do tyłu."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 8 do 12 powtórzeń, lekko."],
    variations: [
      ["romanian-deadlift", "Ten sam ruch z bioder z ciężarem w rękach."],
      ["band-good-morning", "Lekko i dobrze do nauki."],
      ["seated-good-morning", "Na siedząco: głównie dolny odcinek pleców."],
    ],
    faq: [
      ["Czy skłony „dzień dobry” są niebezpieczne?", "Nie przy rozsądnym ciężarze i dobrej technice. Zacznij lekko i dokładaj powoli."],
      ["Jak nisko schodzić?", "Aż tułów będzie mniej więcej równoległy do podłogi, albo mniej, jeśli plecy zaczynają się zaokrąglać."],
    ],
  },
  "step-up": {
    intro:
      "We wejściach na skrzynię wchodzisz jedną nogą na skrzynię albo ławkę. Budują czworogłowe i pośladki na każdą stronę osobno i przekładają się prosto na schody, wędrówki i sport.",
    mistakes: [
      ["Odpychanie się tylną stopą", "Tylna stopa ma być lekka; niech podnosi cię przednia noga."],
      ["Za wysoka skrzynia", "Zacznij od skrzyni mniej więcej na wysokości kolana albo trochę niższej."],
      ["Zeskakiwanie", "Schodź powoli. Droga w dół też trenuje nogę."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 8 do 12 powtórzeń na nogę.", "**Z masą ciała:** 3 serie po 15 do 20 powtórzeń na nogę."],
    variations: [
      ["db-step-up", "Z hantlami dla większego obciążenia."],
      ["db-lateral-step-up", "Wejście bokiem, dla pośladków."],
      ["box-step-down", "Powolne zejścia dla kontroli kolana."],
    ],
    faq: [
      [
        "Jak wysoka powinna być skrzynia?",
        "Na wysokości kolana albo niżej. Wyższe skrzynie bardziej angażują pośladki, ale trudniej nad nimi zapanować.",
      ],
      [
        "Wejścia na skrzynię czy wykroki?",
        "Oba pracują na te same mięśnie. Przy wejściach łatwiej o równowagę; wykroki mają dłuższy zakres.",
      ],
    ],
  },
  "bench-press": {
    intro:
      "Wyciskanie sztangi na ławce to główne ćwiczenie siłowe na górę ciała. Trenuje klatkę, przód barków i tricepsy, pozwala wziąć duży ciężar i łatwo w nim śledzić postępy.",
    mistakes: [
      ["Płaskie, luźne barki", "Ściągnij łopatki do tyłu i w dół, zanim zdejmiesz sztangę, i trzymaj je tak przez całą serię."],
      [
        "Łokcie rozstawione na boki",
        "Trzymaj je pod kątem około 45 do 70 stopni od tułowia. Tak jesteś silniejszy, a barki mniej cierpią.",
      ],
      ["Odbijanie sztangi od klatki", "Dotknij lekko dolnej części klatki, potem wyciskaj. Krótka pauza uczy kontroli."],
      ["Stopy w powietrzu", "Postaw stopy pewnie i wpieraj się w podłogę, żeby całe ciało było napięte."],
    ],
    sets: [
      "**Siła:** 3 do 5 serii po 3 do 6 powtórzeń, przerwa 3 do 5 minut.",
      "**Masa mięśniowa:** 3 do 4 serii po 6 do 10 powtórzeń, przerwa 2 do 3 minut.",
      "**Na początek:** 3 serie po 8 powtórzeń, dokładając trochę ciężaru na każdym treningu.",
    ],
    variations: [
      ["db-bench-press", "Większy zakres, a każda strona pracuje osobno."],
      ["incline-bench-press", "Więcej górnej części klatki i przodu barków."],
      ["close-grip-bench", "Przenosi pracę na tricepsy."],
      ["spoto-press", "Pauza tuż nad klatką buduje kontrolę."],
    ],
    faq: [
      [
        "Czy potrzebuję asekuracji?",
        "Przy ciężkich seriach poproś kogoś o asekurację albo ćwicz w klatce z zabezpieczeniami ustawionymi tuż poniżej wysokości klatki.",
      ],
      [
        "Jak szeroki powinien być chwyt?",
        "Większość osób wyciska najlepiej z przedramionami pionowo na dole, zwykle trochę szerzej niż na szerokość barków.",
      ],
      ["Czy wyginać plecy w łuk?", "Niewielki łuk od ściągnięcia łopatek jest normalny. Pośladki trzymaj na ławce."],
    ],
  },
  "incline-bench-press": {
    intro:
      "Wyciskanie sztangi na ławce skośnej robisz na ławce ustawionej pod kątem około 30 stopni. Przenosi więcej pracy na górną część klatki i przód barków niż ławka płaska.",
    mistakes: [
      ["Za stroma ławka", "Około 30 stopni w zupełności wystarczy. Stromiej i robi się z tego wyciskanie na barki."],
      ["Sztanga opuszczana za nisko", "Opuszczaj sztangę do górnej części klatki, tuż pod obojczyki."],
      ["Barki uciekają do przodu", "Trzymaj łopatki ściągnięte do tyłu i w dół, tak jak na ławce płaskiej."],
    ],
    sets: ["**Siła:** 3 do 4 serii po 4 do 6 powtórzeń.", "**Masa mięśniowa:** 3 serie po 6 do 12 powtórzeń."],
    variations: [
      ["db-incline-press", "Hantle: większy zakres, mniejsze obciążenie barków."],
      ["smith-incline-press", "Prowadzony tor ruchu, żeby bezpiecznie dać z siebie wszystko."],
      ["bench-press", "Ławka płaska: ogólnie większy ciężar."],
    ],
    faq: [
      ["Jaki kąt ławki skośnej?", "Około 30 stopni. Wiele regulowanych ławek ma ustawienie blisko tego kąta."],
      [
        "Czy potrzebuję i płaskiej, i skośnej?",
        "Niekoniecznie, ale obie razem trenują klatkę pod dwoma kątami. Wiele planów traktuje jedną jako główne ćwiczenie, a drugą jako dodatkowe wyciskanie.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "W wyciskaniu hantli na ławce wyciskasz dwa hantle, leżąc na ławce płaskiej. Każda ręka pracuje osobno, a hantle mogą zejść niżej niż sztanga, więc to świetne ćwiczenie na rozmiar klatki i wyrównanie stron.",
    mistakes: [
      ["Złe wejście w pozycję", "Usiądź z hantlami na udach, potem połóż się i podrzuć je kolanami w górę."],
      ["Hantle uciekają za szeroko", "Opuszczaj je po bokach klatki, z łokciami pod kątem około 45 stopni."],
      ["Stukanie hantlami na górze", "Wyciskaj w górę i lekko do środka, zatrzymując się tuż przed zetknięciem hantli."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 do 4 serii po 6 do 12 powtórzeń.",
      "**W domu:** 3 serie po 10 do 20 powtórzeń z wolnym opuszczaniem, jeśli masz lekkie hantle.",
    ],
    variations: [
      ["db-incline-press", "Nacisk na górną część klatki."],
      ["db-floor-press", "Bez ławki; krótszy zakres."],
      ["db-neutral-press", "Dłonie zwrócone do siebie: mniejsze obciążenie barków."],
    ],
    faq: [
      [
        "Wyciskanie hantli czy sztangi?",
        "Sztanga pozwala podnieść więcej; hantle dają większy zakres i wyrównują strony. Jedno i drugie buduje klatkę.",
      ],
      ["Jak bezpiecznie odłożyć hantle?", "Przyciągnij je do klatki, a potem, siadając, opuść je na uda. Nie upuszczaj ich na boki."],
    ],
  },
  "db-incline-press": {
    intro:
      "W wyciskaniu hantli na ławce skośnej wyciskasz dwa hantle na ławce ustawionej pod kątem. To jedno z najlepszych ćwiczeń na górną część klatki i mniej obciąża barki niż wyciskanie sztangi na skosie.",
    mistakes: [
      ["Za stromy skos", "Ustaw około 30 stopni, żeby główną robotę wykonywała klatka."],
      ["Skracanie zakresu", "Opuszczaj hantle do wysokości klatki, pod kontrolą, dla pełnego rozciągnięcia."],
      ["Odrywanie się od ławki w łuku", "Trzymaj biodra w dole, a górną część pleców dociśniętą do oparcia."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 8 do 12 powtórzeń."],
    variations: [
      ["db-low-incline-press", "Niższy kąt, między płaską a skośną."],
      ["incline-bench-press", "Wersja ze sztangą na większe ciężary."],
      ["incline-machine-press", "Maszyna, żeby mocno pchać bez balansowania."],
    ],
    faq: [
      ["Czy wyciskanie na skosie buduje górną część klatki?", "Tak. Skos przenosi więcej pracy na górne włókna klatki."],
      ["Jaki ciężar w porównaniu z ławką płaską?", "Zwykle o 10 do 20% mniej niż w wyciskaniu hantli na ławce płaskiej."],
    ],
  },
  "push-up": {
    intro:
      "W pompce wypychasz ciało z podłogi. Trenuje klatkę, barki i tricepsy w każdym miejscu, a trudniejsze wersje mogą zaprowadzić cię naprawdę daleko.",
    mistakes: [
      ["Opadające biodra", "Napnij pośladki i brzuch, żeby ciało było w jednej linii."],
      ["Łokcie rozstawione na boki", "Trzymaj łokcie pod kątem około 45 stopni od tułowia."],
      ["Połówki powtórzeń", "Opuszczaj się, aż klatka będzie na wysokość pięści nad podłogą, potem wypchnij do pełnego wyprostu."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie, kończąc jedno lub dwa powtórzenia przed upadkiem mięśniowym.",
      "**Za łatwo?** Unieś stopy, zwolnij opuszczanie albo załóż plecak z obciążeniem.",
    ],
    variations: [
      ["incline-push-up", "Dłonie na ławce: łatwiej, pierwszy krok."],
      ["decline-push-up", "Stopy wyżej: trudniej, więcej górnej części klatki."],
      ["archer-push-up", "Przenosi pracę na jedną rękę."],
      ["deficit-push-up", "Dłonie na podwyższeniach dla głębszego rozciągnięcia."],
    ],
    faq: [
      [
        "Ile pompek robić?",
        "Tyle dobrych powtórzeń, ile dasz radę, minus jedno lub dwa, w 3 seriach. Utrudnij je, gdy przekroczysz około 20.",
      ],
      [
        "Czy pompki budują mięśnie?",
        "Tak, o ile serie są ciężkie. Gdy rośnie siła, przechodź na trudniejsze wersje. Zobacz [progresje kalisteniczne](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro:
      "W pompkach na poręczach opuszczasz i wypychasz ciało między dwiema równoległymi poręczami. To jedno z najlepszych ćwiczeń z masą ciała na klatkę i tricepsy.",
    mistakes: [
      ["Za głębokie zejście", "Opuszczaj się, aż ramiona będą mniej więcej równoległe do podłogi, albo płycej, jeśli barki protestują."],
      ["Unoszenie barków", "Trzymaj barki opuszczone, z dala od uszu."],
      ["Bujanie się", "Skrzyżuj kostki i trzymaj ciało nieruchomo."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 6 do 12 powtórzeń.", "**Za łatwo?** Dodaj ciężar na pasie albo hantel między stopami."],
    variations: [
      ["negative-dip", "Tylko wolne opuszczanie, pierwszy krok."],
      ["band-assisted-dip", "Guma przejmuje część twojego ciężaru."],
      ["ring-dip", "Dużo trudniej: kółka się ruszają."],
    ],
    faq: [
      [
        "Klatka czy tricepsy?",
        "Pochyl się do przodu, żeby bardziej pracowała klatka; trzymaj się prosto, żeby bardziej pracowały tricepsy.",
      ],
      [
        "Czy pompki na poręczach szkodzą barkom?",
        "U większości osób nie, jeśli kontrolujesz głębokość. Zatrzymaj się przed zakresem, który boli.",
      ],
    ],
  },
  "cable-fly": {
    intro:
      "W rozpiętkach na wyciągu łączysz dłonie łukiem jak przy przytulaniu, przeciw dwóm linkom. To ćwiczenie izoluje klatkę i utrzymuje na niej napięcie przez całe powtórzenie, zwłaszcza w rozciągnięciu.",
    mistakes: [
      ["Zamienianie tego w wyciskanie", "Utrzymuj stałe, lekkie ugięcie łokci. Ruch tylko w barkach."],
      ["Za duży ciężar", "Wybierz ciężar, który kontrolujesz w pełnym rozciągnięciu."],
      ["Barki uciekają do przodu", "Trzymaj klatkę wysoko, a łopatki ściągnięte."],
    ],
    sets: ["**Masa mięśniowa:** 2 do 3 serii po 10 do 15 powtórzeń, po wyciskaniach."],
    variations: [
      ["low-cable-fly", "Z dołu do góry: górna część klatki."],
      ["pec-deck", "Maszyna z prowadzonym torem ruchu."],
      ["db-fly", "Z hantlami, bez wyciągu."],
    ],
    faq: [
      [
        "Rozpiętki z górnego czy dolnego wyciągu?",
        "Z góry do dołu bardziej pracuje dolna część klatki; z dołu do góry górna. Obie wersje są dobre.",
      ],
      [
        "Rozpiętki na wyciągu czy z hantlami?",
        "Wyciąg utrzymuje napięcie na górze ruchu; hantle są najcięższe w rozciągnięciu. Obie wersje działają.",
      ],
    ],
  },
  "overhead-press": {
    intro:
      "W wyciskaniu żołnierskim wyciskasz sztangę z barków nad głowę na stojąco. Buduje barki i tricepsy, a całe ciało musi się napiąć, żeby utrzymać ciężar.",
    mistakes: [
      ["Mocne odchylanie się do tyłu", "Napnij pośladki i brzuch, żeby ciało było w jednej linii."],
      ["Sztanga omija twarz łukiem", "Cofnij brodę, wyciskaj prosto w górę, a gdy sztanga minie głowę, przesuń głowę pod nią."],
      ["Łokcie rozstawione na starcie", "Zaczynaj z łokciami lekko przed sztangą."],
    ],
    sets: ["**Siła:** 3 do 5 serii po 3 do 6 powtórzeń.", "**Masa mięśniowa:** 3 serie po 6 do 10 powtórzeń."],
    variations: [
      ["db-shoulder-press", "Na siedząco, z hantlami: mniejsze obciążenie dolnego odcinka pleców."],
      ["push-press", "Trochę pomocy z nóg, żeby ruszyć większe ciężary."],
      ["landmine-press", "Wyciskanie pod kątem dla marudnych barków."],
    ],
    faq: [
      [
        "Dlaczego w wyciskaniu żołnierskim tak często staję w miejscu?",
        "To ćwiczenie z mniejszym ciężarem, więc skoki obciążenia są stosunkowo duże. Używaj małych talerzy albo najpierw dokładaj powtórzenia, potem ciężar. Zobacz [progresja liniowa a podwójna](/blog/linear-vs-double-progression/).",
      ],
      ["Na stojąco czy na siedząco?", "Na stojąco trenujesz też tułów; na siedząco barki mogą wycisnąć więcej. Obie wersje działają."],
    ],
  },
  "db-shoulder-press": {
    intro:
      "W wyciskaniu hantli nad głowę wyciskasz dwa hantle, zwykle na siedząco z oparciem. Buduje przód i boki barków przy mniejszym obciążeniu dolnego odcinka pleców niż wyciskanie sztangi na stojąco.",
    mistakes: [
      ["Oparcie ustawione całkiem pionowo", "Ustaw je tuż przed pionem, żeby plecy były podparte."],
      ["Za płytkie opuszczanie", "Opuszczaj hantle mniej więcej do wysokości uszu lub brody."],
      ["Stukanie hantlami o siebie", "Wyciskaj w górę i lekko do środka, zatrzymując się, zanim się zetkną."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 6 do 12 powtórzeń."],
    variations: [
      ["db-arnold-press", "Z obrotem dłoni, więcej przodu barków."],
      ["machine-shoulder-press", "Prowadzony tor ruchu, żeby bezpiecznie dać z siebie wszystko."],
      ["overhead-press", "Sztanga, na stojąco."],
    ],
    faq: [
      ["Na siedząco czy na stojąco?", "Na siedząco wyciśniesz więcej; na stojąco trenujesz równowagę i tułów."],
      [
        "Dłonie do przodu czy do siebie?",
        "Dłonie lekko zwrócone do siebie są dla wielu osób łagodniejsze dla barków. Rób tak, jak czujesz się najlepiej.",
      ],
    ],
  },
  "lateral-raise": {
    intro:
      "We wznosach bokiem unosisz dwa hantle na boki. To ćwiczenie izoluje boczne części barków, które dają barkom szerokość, a wyciskania prawie ich nie trenują.",
    mistakes: [
      ["Wyrzucanie ciężaru", "Użyj ciężaru, który uniesiesz bez odchylania się i unoszenia barków."],
      ["Unoszenie barków do uszu", "Myśl o wypychaniu hantli na boki, od siebie, a nie w górę."],
      ["Za duży ciężar", "Lekkie hantle na 12 do 20 dobrych powtórzeń są lepsze niż ciężkie, wymachiwane powtórzenia."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 12 do 20 powtórzeń, dwa lub trzy razy w tygodniu."],
    variations: [
      ["cable-lateral-raise", "Stałe napięcie, po jednej ręce."],
      ["lean-away-lateral-raise", "Trzymając się słupka, dla dłuższego zakresu."],
      ["machine-lateral-raise", "Prowadzony tor ruchu, łatwo dojść do upadku mięśniowego."],
    ],
    faq: [
      ["Jak ciężkie hantle do wznosów bokiem?", "Lekkie. Większość osób robi dobre powtórzenia z hantlami 4 do 10 kg."],
      ["Jak wysoko unosić?", "Mniej więcej do wysokości barków. Wyżej włączają się mięśnie czworoboczne."],
    ],
  },
  "face-pull": {
    intro:
      "W face pullu przyciągasz linę z górnego wyciągu do twarzy, rozciągając ręce na boki. Trenuje tylne części barków i górną część pleców, co równoważy wyciskania i pomaga w postawie.",
    mistakes: [
      ["Ciągnięcie dolnym odcinkiem pleców", "Stań prosto i napnij tułów; odchyl się tylko lekko."],
      ["Dłonie za nisko", "Ciągnij do czoła albo oczu, kończąc z dłońmi obok uszu."],
      ["Za duży ciężar", "Użyj ciężaru, przy którym zatrzymasz się na końcu każdego powtórzenia."],
    ],
    sets: ["**Masa mięśniowa i zdrowe barki:** 2 do 3 serii po 12 do 20 powtórzeń."],
    variations: [
      ["band-face-pull", "Z gumą, w domu."],
      ["rear-delt-fly", "Z hantlami, w opadzie."],
      ["reverse-pec-deck", "Maszyna z prowadzonym torem ruchu."],
    ],
    faq: [
      [
        "Czy face pull jest dobry na barki?",
        "Trenuje tylne części barków i górną część pleców, co równoważy wyciskania. Wiele osób robi go na każdym treningu góry ciała.",
      ],
      ["Lina czy drążek?", "Lina pozwala rozciągnąć dłonie na końcu ruchu, co mocniej trenuje tylne części barków."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "W odwrotnych rozpiętkach pochylasz się do przodu i unosisz dwa hantle na boki. To ćwiczenie izoluje tylne części barków, których większość wyciskań, a nawet wiosłowań, prawie nie trenuje.",
    mistakes: [
      ["Zamienianie tego w wiosłowanie", "Utrzymuj lekkie, stałe ugięcie łokci i ruszaj się w barkach."],
      ["Ściąganie łopatek", "Niech pracują barki; łopatki zostają w miarę nieruchomo."],
      ["Za duży ciężar", "Najlepiej działają bardzo lekkie hantle z pełną kontrolą."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 12 do 20 powtórzeń."],
    variations: [
      ["reverse-pec-deck", "Maszyna, łatwiej o czystą technikę."],
      ["cable-rear-delt-fly", "Wyciąg dla stałego napięcia."],
      ["face-pull", "Przyciąganie, które trenuje też górną część pleców."],
    ],
    faq: [
      [
        "Na siedząco czy na stojąco?",
        "Na siedząco z klatką na kolanach albo leżąc klatką na ławce skośnej łatwiej utrzymać czystą technikę.",
      ],
      ["Po co trenować tylne części barków?", "Zaokrąglają barki i równoważą wszystkie wyciskania, które ma większość planów."],
    ],
  },
  "pull-up": {
    intro:
      "W podciąganiu nachwytem wisisz na drążku z dłońmi zwróconymi od siebie i podciągasz się, aż broda minie drążek. To klasyczne ćwiczenie na plecy z masą ciała: trenuje najszersze grzbietu, górną część pleców i bicepsy.",
    mistakes: [
      ["Kipping albo bujanie się", "Każde powtórzenie zaczynaj z nieruchomego zwisu."],
      ["Połówki powtórzeń", "Od prostych rąk do brody nad drążkiem."],
      ["Unoszenie barków na górze", "Podciągając się, ściągaj barki w dół i do tyłu."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 do 4 serii, kończąc jedno lub dwa powtórzenia przed upadkiem mięśniowym.",
      "**Za łatwo?** Dodaj ciężar na pasie albo hantel między stopami.",
    ],
    variations: [
      ["negative-pull-up", "Wskocz na górę i opuszczaj się powoli, pierwszy krok."],
      ["band-assisted-pull-up", "Guma przejmuje część twojego ciężaru."],
      ["chin-up", "Dłonie zwrócone do ciebie: trochę łatwiej, więcej bicepsów."],
      ["neutral-grip-pull-up", "Dłonie zwrócone do siebie, łagodne dla łokci."],
    ],
    faq: [
      [
        "Jak zrobić pierwsze podciągnięcie?",
        "Wolne negatywy, podciąganie z gumą i ściąganie drążka wyciągu, trzy razy w tygodniu. Większość osób robi pierwsze w ciągu paru miesięcy.",
      ],
      [
        "Podciąganie czy ściąganie drążka wyciągu?",
        "Oba trenują najszersze grzbietu. Podciąganie angażuje też tułów; na wyciągu ustawisz dowolny ciężar.",
      ],
    ],
  },
  "chin-up": {
    intro:
      "W podciąganiu podchwytem wisisz na drążku z dłońmi zwróconymi do siebie i podciągasz się, aż broda minie drążek. Trenuje najszersze grzbietu i mocniej angażuje bicepsy niż podciąganie nachwytem, a większość osób zrobi kilka powtórzeń więcej.",
    mistakes: [
      ["Brak pełnego zwisu", "Na dole każdego powtórzenia wyprostuj ręce."],
      ["Sięganie brodą", "Przyciągaj klatkę do drążka, zamiast wyciągać szyję."],
      ["Bujanie się", "Trzymaj nogi nieruchomo, a tułów napięty."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii, kończąc jedno lub dwa powtórzenia przed upadkiem mięśniowym."],
    variations: [
      ["pull-up", "Dłonie od siebie: więcej górnej części pleców."],
      ["reverse-grip-pulldown", "Ten sam chwyt na wyciągu."],
      ["negative-pull-up", "Wolne opuszczanie, żeby do tego dojść."],
    ],
    faq: [
      [
        "Podchwyt czy nachwyt?",
        "Podchwyt mocniej angażuje bicepsy i jest trochę łatwiejszy; nachwyt bardziej górną część pleców. Oba budują najszersze grzbietu.",
      ],
      ["Jak szeroki powinien być chwyt?", "Mniej więcej na szerokość barków."],
    ],
  },
  "lat-pulldown": {
    intro:
      "W ściąganiu drążka wyciągu przyciągasz drążek z górnego wyciągu do górnej części klatki. Trenuje najszersze grzbietu jak podciąganie, ale sam wybierasz ciężar, więc każdy da radę.",
    mistakes: [
      ["Mocne odchylanie się", "Odchyl się tylko lekko i trzymaj klatkę wysoko."],
      ["Ciągnięcie rękami", "Myśl o sprowadzaniu łokci w dół do boków."],
      ["Ściąganie za kark", "Ściągaj do górnej części klatki."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 8 do 12 powtórzeń."],
    variations: [
      ["close-grip-pulldown", "Wąski uchwyt, dłuższy zakres."],
      ["one-arm-cable-pulldown", "Po jednej stronie."],
      ["pull-up", "Twoja własna masa ciała."],
    ],
    faq: [
      ["Szeroki czy wąski chwyt?", "Oba pracują na najszersze grzbietu. Większości osób pasuje średni chwyt, trochę szerszy niż barki."],
      [
        "Czy ściąganie drążka pomoże mi się podciągnąć?",
        "Tak, zwłaszcza z wolnymi negatywami. Zobacz [trening pleców](/blog/back-workout/).",
      ],
    ],
  },
  "barbell-row": {
    intro:
      "W wiosłowaniu sztangą pochylasz się do przodu i przyciągasz sztangę do brzucha. Buduje całą górną część pleców, najszersze grzbietu i tylne części barków, i pozwala używać dużych ciężarów.",
    mistakes: [
      ["Prostowanie się podczas wiosłowania", "Trzymaj tułów pod stałym kątem, około 30 do 45 stopni od podłogi."],
      ["Szarpanie ciężaru", "Przyciągaj płynnie i opuszczaj pod kontrolą."],
      ["Zaokrąglanie dolnego odcinka pleców", "Napnij tułów i trzymaj plecy płasko. Zmniejsz ciężar, jeśli się zaokrąglają."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 6 do 12 powtórzeń.", "**Siła:** 3 serie po 5 do 8 powtórzeń."],
    variations: [
      ["pendlay-row", "Każde powtórzenie z podłogi, plecy płasko."],
      ["chest-supported-row", "Zero obciążenia dolnego odcinka pleców."],
      ["db-row", "Po jednej ręce, z podparciem."],
    ],
    faq: [
      ["Nachwyt czy podchwyt?", "Nachwyt bardziej angażuje górną część pleców; podchwyt najszersze grzbietu i bicepsy. Oba są w porządku."],
      [
        "Dlaczego przy wiosłowaniu boli mnie dolny odcinek pleców?",
        "Tułów nie ma podparcia. Zmniejsz ciężar albo przejdź na wiosłowanie z podparciem klatki.",
      ],
    ],
  },
  "db-row": {
    intro:
      "W wiosłowaniu hantlem jednorącz opierasz dłoń i kolano na ławce i przyciągasz hantel do biodra. Trenuje najszersze grzbietu i górną część pleców na każdą stronę osobno, z podpartymi plecami.",
    mistakes: [
      ["Skręcanie się przy podnoszeniu", "Trzymaj barki i biodra równolegle do podłogi."],
      ["Przyciąganie do klatki", "Przyciągaj w stronę biodra, żeby pracowały najszersze grzbietu."],
      ["Krótki zakres", "W każdym powtórzeniu pozwól hantlowi zwisnąć do końca, żeby poczuć rozciągnięcie."],
    ],
    sets: ["**Masa mięśniowa:** 3 serie po 8 do 12 powtórzeń na rękę."],
    variations: [
      ["chest-supported-row", "Obie ręce, klatka na ławce skośnej."],
      ["kb-row", "Z kettlebellem."],
      ["seal-row", "Leżąc na wysokiej ławce: bardzo czysta technika."],
    ],
    faq: [
      ["Czy potrzebuję ławki?", "Z ławką najłatwiej. Bez niej oprzyj dłoń o stabilne krzesło albo o kolano."],
      ["Jak ciężki hantel do wiosłowania?", "Na tyle ciężki, żeby ostatnie powtórzenia były trudne bez skręcania się."],
    ],
  },
  "seated-cable-row": {
    intro:
      "W wiosłowaniu na wyciągu siedząc przyciągasz uchwyt z dolnego wyciągu do brzucha. Trenuje górną część pleców i najszersze grzbietu ze stałym napięciem i bez obciążania dolnego odcinka pleców.",
    mistakes: [
      ["Bujanie się w przód i w tył", "Trzymaj tułów nieruchomo, odchylając się tylko lekko na końcu."],
      ["Unoszenie barków", "Ściągaj łopatki do tyłu i w dół, nie w górę."],
      ["Pośpiech przy powrocie", "Prostuj ręce pod kontrolą i poczuj rozciągnięcie."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 8 do 15 powtórzeń."],
    variations: [
      ["cable-row-wide", "Szeroki drążek: więcej górnej części pleców."],
      ["single-arm-cable-row", "Po jednej stronie."],
      ["machine-row", "Maszyna z podparciem klatki."],
    ],
    faq: [
      [
        "Który uchwyt jest najlepszy?",
        "Wąski uchwyt V bardziej angażuje najszersze grzbietu; szeroki drążek górną część pleców. Z czasem używaj obu.",
      ],
      ["Czy pochylać się do przodu?", "Trochę na starcie, dla rozciągnięcia, a potem siądź prosto, przyciągając."],
    ],
  },
  "barbell-curl": {
    intro:
      "W uginaniu ramion ze sztangą podnosisz sztangę od ud do barków. To klasyczne ćwiczenie na bicepsy i pozwala użyć największego ciężaru ze wszystkich uginań.",
    mistakes: [
      ["Bujanie plecami", "Stań prosto z łokciami przy bokach. Zmniejsz ciężar, jeśli musisz się bujać."],
      ["Łokcie uciekają do przodu", "Trzymaj je blisko ciała przez całe powtórzenie."],
      ["Upuszczanie sztangi", "Opuszczaj ją pod kontrolą przez dwie lub trzy sekundy."],
    ],
    sets: ["**Masa mięśniowa:** 2 do 4 serii po 8 do 12 powtórzeń."],
    variations: [
      ["ez-curl", "Łamana sztanga, łagodniejsza dla nadgarstków."],
      ["db-curl", "Każda ręka osobno."],
      ["drag-curl", "Sztanga sunie w górę po ciele, dla szczytu bicepsa."],
    ],
    faq: [
      ["Prosta sztanga czy łamana?", "Łamana jest łagodniejsza dla nadgarstków. Prosta odrobinę mocniej angażuje bicepsy."],
      [
        "Ile uginań robić?",
        "Około 6 do 12 ciężkich serii na bicepsy w tygodniu, licząc podciąganie podchwytem i wiosłowania. Zobacz [trening ramion](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "W uginaniu ramion z hantlami trzymasz hantel w każdej ręce. Każda ręka pracuje osobno i możesz obracać dłonie w górę w trakcie ruchu, co w pełni angażuje bicepsy.",
    mistakes: [
      ["Bujanie się", "Trzymaj łokcie przy bokach, a ciało nieruchomo."],
      ["Za późny obrót", "Zacznij z dłońmi zwróconymi do środka i obracaj je w górę w trakcie uginania."],
      ["Krótki zakres", "Na dole w pełni prostuj ręce."],
    ],
    sets: ["**Masa mięśniowa:** 2 do 4 serii po 8 do 15 powtórzeń."],
    variations: [
      ["incline-db-curl", "Na ławce skośnej dla długiego rozciągnięcia."],
      ["hammer-curl", "Dłonie do środka: więcej przedramion i mięśnia ramiennego."],
      ["db-preacher-curl", "Ramię na modlitewniku dla czystych powtórzeń."],
    ],
    faq: [
      [
        "Naprzemiennie czy obiema rękami naraz?",
        "Obojętnie. Naprzemiennie łatwiej skupić się na każdej ręce; obiema naraz oszczędzasz czas.",
      ],
      ["Na stojąco czy na siedząco?", "Na siedząco trudniej się bujać."],
    ],
  },
  "hammer-curl": {
    intro:
      "W uginaniu młotkowym uginasz ramiona z hantlami, z dłońmi zwróconymi do siebie. Mocniej niż zwykłe uginanie angażuje mięsień ramienny i mięśnie przedramion, co dodaje ramieniu grubości.",
    mistakes: [
      ["Wymachiwanie ciężarem", "Stań prosto i trzymaj łokcie nieruchomo."],
      ["Obracanie dłoni", "Przez całe powtórzenie trzymaj dłonie zwrócone do siebie."],
      ["Pośpiech", "Opuszczaj pod kontrolą."],
    ],
    sets: ["**Masa mięśniowa:** 2 do 3 serii po 8 do 15 powtórzeń."],
    variations: [
      ["rope-hammer-curl", "Na wyciągu z liną."],
      ["incline-hammer-curl", "Na ławce skośnej dla rozciągnięcia."],
      ["reverse-curl", "Dłonie w dół, na przedramiona."],
    ],
    faq: [
      ["Uginanie młotkowe czy zwykłe?", "Rób oba: zwykłe na bicepsy, młotkowe na mięsień ramienny i przedramiona."],
      ["W poprzek ciała czy prosto?", "Oba działają. W poprzek ciała to popularna wersja, którą niektórzy uważają za wygodniejszą."],
    ],
  },
  "cable-pushdown": {
    intro:
      "W prostowaniu ramion na wyciągu wypychasz drążek albo linę w dół z górnego wyciągu. To ćwiczenie izoluje tricepsy, łatwo się go nauczyć, jest łagodne dla łokci i łatwo w nim robić postępy.",
    mistakes: [
      ["Ruchome łokcie", "Przyklej łokcie do boków; ruszają się tylko przedramiona."],
      ["Pochylanie się nad ciężarem", "Stań prosto z lekkim pochyleniem do przodu, nie garb się."],
      ["Krótki zakres", "Na dole wyprostuj ręce do końca, a w górze pozwól przedramionom minąć poziom."],
    ],
    sets: ["**Masa mięśniowa:** 2 do 4 serii po 10 do 15 powtórzeń."],
    variations: [
      ["rope-pushdown", "Lina pozwala rozsunąć dłonie na dole."],
      ["cable-overhead-extension", "Nad głową: długa głowa tricepsa."],
      ["reverse-grip-pushdown", "Podchwytem, inne odczucie."],
    ],
    faq: [
      ["Lina czy drążek?", "Na drążku podniesiesz więcej; lina pozwala rozsunąć dłonie. Używaj dowolnego."],
      [
        "Czy potrzebuję też ćwiczenia na tricepsy nad głową?",
        "Dodanie prostowania nad głową trenuje długą głowę tricepsa w rozciągnięciu, co może zbudować więcej mięśni.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "We francuskim wyciskaniu leżąc opuszczasz łamaną sztangę w stronę czoła, leżąc na ławce, a potem prostujesz ręce. Trenuje wszystkie trzy głowy tricepsa z dobrym rozciągnięciem.",
    mistakes: [
      ["Łokcie uciekają na boki", "Trzymaj je skierowane w sufit, mniej więcej na szerokość barków."],
      ["Opuszczanie do czoła", "Opuszczaj w stronę czubka głowy albo tuż za nią: więcej rozciągnięcia i mniej ryzyka."],
      ["Za duży ciężar", "Wybierz ciężar, który kontrolujesz przez całą drogę w dół."],
    ],
    sets: ["**Masa mięśniowa:** 2 do 3 serii po 8 do 12 powtórzeń."],
    variations: [
      ["db-skull-crusher", "Z hantlami, łagodniejsze dla nadgarstków."],
      ["incline-skull-crusher", "Na ławce skośnej dla dłuższego rozciągnięcia."],
      ["jm-press", "Coś pomiędzy francuskim wyciskaniem a wyciskaniem wąskim chwytem."],
    ],
    faq: [
      [
        "Czy francuskie wyciskanie szkodzi łokciom?",
        "Niektórym łokciom może przeszkadzać. Jeśli boli, zmniejsz ciężar, spróbuj hantli albo przejdź na wyciąg.",
      ],
      ["Sztanga łamana czy prosta?", "Łamana jest łagodniejsza dla nadgarstków."],
    ],
  },
  "close-grip-bench": {
    intro:
      "Wyciskanie wąskim chwytem to wyciskanie na ławce z dłońmi mniej więcej na szerokość barków. Przenosi więcej pracy na tricepsy, a wciąż pozwala dźwigać duże ciężary.",
    mistakes: [
      ["Za wąski chwyt", "Mniej więcej na szerokość barków. Dłonie stykające się ze sobą bolą nadgarstki."],
      ["Łokcie uciekają na boki", "Trzymaj je blisko tułowia."],
      ["Dotykanie za wysoko", "Opuszczaj do dolnej części klatki."],
    ],
    sets: ["**Siła:** 3 do 4 serii po 5 do 8 powtórzeń.", "**Masa mięśniowa:** 3 serie po 8 do 12 powtórzeń."],
    variations: [
      ["bench-press", "Szerszy chwyt, więcej klatki."],
      ["db-close-press", "Hantle ściśnięte razem."],
      ["diamond-push-up", "Wersja z masą ciała."],
    ],
    faq: [
      ["To ćwiczenie na klatkę czy na tricepsy?", "Na jedno i drugie, z większym udziałem tricepsów niż w zwykłym wyciskaniu na ławce."],
      ["O ile mniej niż na zwykłej ławce?", "Zwykle o około 10 do 15% mniej."],
    ],
  },
  "preacher-curl": {
    intro:
      "W uginaniu na modlitewniku opierasz ramiona o skośną podkładkę i uginasz łamaną sztangę. Podkładka nie pozwala się bujać i mocno obciąża bicepsy na dole, w rozciągnięciu.",
    mistakes: [
      ["Brak pełnego rozciągnięcia", "Opuszczaj pod kontrolą, aż ręce będą prawie proste."],
      ["Odrywanie łokci od podkładki", "Trzymaj ramiona płasko na podkładce."],
      ["Opadanie na dół", "Zwolnij w ostatniej części opuszczania, tam gdzie jest rozciągnięcie."],
    ],
    sets: ["**Masa mięśniowa:** 2 do 3 serii po 8 do 12 powtórzeń."],
    variations: [
      ["db-preacher-curl", "Po jednej ręce z hantlem."],
      ["machine-preacher-curl", "Prowadzony tor ruchu, łatwo dać z siebie wszystko."],
      ["cable-preacher-curl", "Napięcie także na górze."],
    ],
    faq: [
      [
        "Czy uginanie na modlitewniku jest lepsze niż na stojąco?",
        "Wymusza czystszą technikę i mocniej obciąża pozycję rozciągnięcia. Oba budują bicepsy.",
      ],
      ["Dlaczego boli na dole?", "Zmniejsz ciężar i zwolnij. Jeśli łokcie protestują, zatrzymaj się przed pełnym wyprostem."],
    ],
  },
  "power-clean": {
    intro:
      "W zarzucie siłowym podrywasz sztangę z podłogi i łapiesz ją na przodzie barków w jednym szybkim ruchu. Buduje wybuchową siłę bioder do sportu i skoków, a przy okazji trenuje razem pośladki, tył uda, czworoboczne i górę pleców.",
    mistakes: [
      [
        "Za wczesne ciągnięcie rękami",
        "Trzymaj ręce długie jak liny, aż biodra i kolana się wyprostują. Potem unieś barki i wejdź pod sztangę.",
      ],
      ["Sztanga odjeżdża od ciała", "Prowadź sztangę tak blisko, żeby muskała uda. Jeśli zatoczy łuk do przodu, wytrąci cię z równowagi."],
      ["Łapanie z nisko opuszczonymi łokciami", "Szybko wyrzuć łokcie do przodu, żeby sztanga wylądowała na barkach, a nie w dłoniach."],
    ],
    sets: [
      "**Moc:** 4 do 6 serii po 2 do 3 powtórzenia, z pełnym odpoczynkiem. Kończ serię, gdy powtórzenia zwalniają.",
      "**Nauka:** 5 serii po 2 z pustą sztangą lub lekkimi talerzami, zaczynając z zawisu.",
    ],
    variations: [
      ["hang-clean", "Z wysokości ud: najłatwiej nauczyć się łapania."],
      ["db-hang-clean", "Z hantlami, gdy nie ma sztangi ani talerzy gumowych."],
      ["clean-and-jerk", "Dodaj podrzut nad głowę: pełny bój olimpijski."],
    ],
    faq: [
      [
        "Czy zarzut siłowy jest dla początkujących?",
        "Tak, jeśli uczysz się go z lekkim ciężarem. Zacznij z zawisu z pustą sztangą i dokładaj ciężar tylko wtedy, gdy sztanga idzie blisko, a łapanie jest czyste. Sprinty i [skoki na skrzynię](/exercises/box-jump/) też budują moc, gdy się uczysz.",
      ],
      [
        "Czym różni się zarzut siłowy od pełnego zarzutu?",
        "W zarzucie siłowym łapiesz sztangę powyżej równoległej, w ćwierćprzysiadzie. W pełnym zarzucie schodzisz do głębokiego przysiadu przedniego, co pozwala podnieść więcej, ale wymaga większej mobilności.",
      ],
      [
        "Czy mogę robić zarzuty w domu?",
        "Tylko ze sztangą, talerzami gumowymi i podłogą, która wytrzyma upuszczoną sztangę. Inaczej spróbuj [zarzutu z zawisu z hantlami](/exercises/db-hang-clean/) albo [swingu z kettlebell](/exercises/kb-swing/).",
      ],
    ],
  },
  "db-rdl": {
    intro:
      "W rumuńskim martwym ciągu z hantlami zginasz się w biodrach z hantlem w każdej ręce i prowadzisz je w dół wzdłuż nóg, aż poczujesz rozciąganie tyłu uda. Buduje tył uda i pośladki z mniejszym ciężarem niż sztanga i da się go robić w domu z parą hantli.",
    mistakes: [
      ["Uginanie kolan jak w przysiadzie", "Trzymaj lekko ugięte kolana pod stałym kątem i cofaj biodra w stronę ściany za tobą."],
      [
        "Zaokrąglanie pleców, by zejść niżej",
        "Zatrzymaj się, gdy tył uda jest w pełni rozciągnięty, zwykle tuż pod kolanem. Zakres bierze się z bioder, nie z kręgosłupa.",
      ],
      ["Hantle odjeżdżają do przodu", "Prowadź je wzdłuż ud i goleni. Im dalej odjadą, tym więcej pracuje dolny odcinek pleców."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 do 4 serii po 8 do 12 powtórzeń, opuszczając przez około trzy sekundy.",
      "**W domu z lekkimi hantlami:** 3 serie po 15 do 20 powtórzeń albo na jednej nodze.",
    ],
    variations: [
      ["romanian-deadlift", "Ze sztangą, do większych ciężarów."],
      ["db-single-leg-rdl", "Na jednej nodze, dla równowagi i podwójnego obciążenia na nogę."],
      ["kb-romanian-deadlift", "Jeden kettlebell trzymany oburącz."],
    ],
    faq: [
      [
        "Jakie mięśnie trenuje rumuński martwy ciąg z hantlami?",
        "Głównie tył uda i pośladki; dolny odcinek pleców trzyma kręgosłup, a przedramiona trzymają hantle. Obciąża tył uda w rozciągnięciu, co dobrze służy wzrostowi mięśni.",
      ],
      [
        "Rumuński martwy ciąg z hantlami czy ze sztangą?",
        "Oba trenują te same mięśnie. Sztanga pozwala na więcej; hantle szybciej przygotujesz, są łagodniejsze dla nadgarstków i nadają się do domu. Wybierz to, czym obciążysz się na 8 do 12 ciężkich powtórzeń.",
      ],
      [
        "Jak ciężkie powinny być hantle?",
        "Tak ciężkie, żeby dwa ostatnie powtórzenia każdej serii były trudne przy prostych plecach. Jeśli chwyt puszcza pierwszy, użyj pasków albo przejdź na [wersję ze sztangą](/exercises/romanian-deadlift/).",
      ],
    ],
  },
  "back-extension": {
    intro:
      "Przy wyprostach tułowia opuszczasz tułów nad podpórką i unosisz go, aż ciało będzie proste. Wzmacniają dolny odcinek pleców, pośladki i tył uda przy małym obciążeniu kręgosłupa, więc dobrze uzupełniają ciężkie przysiady i martwe ciągi.",
    mistakes: [
      [
        "Mocne przeprostowanie na górze",
        "Zatrzymaj się, gdy ciało tworzy prostą linię. Dalej tylko ściskasz dolny odcinek pleców, niczego więcej nie trenując.",
      ],
      ["Odbijanie się na dole", "Opuszczaj powoli i unoś płynnie. Rozpęd zabiera pracę mięśniom."],
      ["Za wysoko ustawiona podpórka", "Ustaw ją tuż pod kośćmi biodrowymi, żeby swobodnie zginać się w biodrach."],
    ],
    sets: [
      "**Mięśnie i siła:** 3 serie po 10 do 15 powtórzeń, z talerzem lub hantlem, gdy 15 jest łatwe.",
      "**Zdrowe plecy:** 2 do 3 serii po 15 do 20 powolnych powtórzeń albo [utrzymanie](/exercises/back-extension-hold/) przez 20 do 30 sekund.",
    ],
    variations: [
      ["weighted-back-extension", "Trzymaj ciężar przy klatce, żeby było trudniej."],
      ["back-extension-hold", "Utrzymuj prostą pozycję zamiast się ruszać."],
      ["reverse-hyper-bench", "Ruszają się nogi zamiast tułowia."],
    ],
    faq: [
      [
        "Czy wyprosty tułowia są dobre na dolny odcinek pleców?",
        "Tak. Robione powoli do prostej linii budują wytrzymałość mięśni wzdłuż kręgosłupa, dzięki czemu lepiej znoszą długie dni i ciężkie boje. Odpuść je przy ostrym bólu pleców i skonsultuj się ze specjalistą, jeśli nie mija.",
      ],
      [
        "Czy wyprosty tułowia trenują pośladki?",
        "Tak. Lekko zaokrąglij górę pleców, obróć stopy na zewnątrz i napinaj pośladki przy unoszeniu: wtedy pośladki pracują więcej niż dolny odcinek pleców.",
      ],
      [
        "Co robić bez ławki do wyprostów?",
        "[Hip thrust](/exercises/hip-thrust/) albo [rumuński martwy ciąg](/exercises/romanian-deadlift/) trenują te same mięśnie, a unoszenie klatki w leżeniu na brzuchu trenuje dolny odcinek pleców bez sprzętu.",
      ],
    ],
  },
  "cable-pull-through": {
    intro:
      "W przeciąganiu liny wyciągu między nogami stajesz tyłem do dolnego wyciągu, zginasz się w biodrach z liną między nogami i wypychasz biodra do przodu, żeby wstać. Uczy zgięcia w biodrach i trenuje pośladki oraz tył uda bez obciążania kręgosłupa, więc pasuje początkującym i zmęczonym plecom.",
    mistakes: [
      ["Przysiad zamiast zgięcia w biodrach", "Cofaj biodra prosto do tyłu, z goleniami prawie pionowo. Kolana zginają się tylko trochę."],
      ["Ciągnięcie rękami", "Ręce tylko trzymają linę. Wstawaj, wypychając biodra do przodu."],
      [
        "Odchylanie się na górze",
        "Kończ wyprostowany, z napiętymi pośladkami i opuszczonymi żebrami, a nie z wygiętym dolnym odcinkiem pleców.",
      ],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie po 12 do 15 powtórzeń, z sekundowym napięciem na górze.",
      "**Nauka zgięcia w biodrach:** 2 do 3 lekkich serii po 10 przed martwym ciągiem lub swingami.",
    ],
    variations: [
      ["band-pull-through", "Z gumą zaczepioną nisko, do domu."],
      ["kb-swing", "To samo wypchnięcie bioder, szybko, z kettlebell."],
      ["hip-thrust", "Cięższa praca pośladków z plecami na ławce."],
    ],
    faq: [
      [
        "Jakie mięśnie trenuje przeciąganie liny wyciągu między nogami?",
        "Pośladki i tył uda. Linka ciągnie cię do tyłu, więc pośladki pracują aż do samej góry, gdzie martwy ciąg robi się łatwy.",
      ],
      [
        "Przeciąganie liny czy swing z kettlebell?",
        "Przeciąganie jest wolniejsze i łatwiejsze do nauki; swing jest szybszy i dodaje kondycji. Naucz się zgięcia w biodrach na wyciągu, potem dodaj [swingi](/exercises/kb-swing/).",
      ],
      ["Jak daleko od wyciągu stanąć?", "Około dwa duże kroki, żeby ciężar nie opadał na stos na dole każdego powtórzenia."],
    ],
  },
  "reverse-crunch": {
    intro:
      "Odwrotne brzuszki robisz na plecach, podwijając biodra od podłogi w stronę klatki. Trenują brzuch, najmocniej jego dolną część, i nie obciążają karku. Nie potrzebujesz sprzętu.",
    mistakes: [
      ["Machanie nogami", "Trzymaj kolana ugięte pod tym samym kątem i unoś biodra brzuchem, zamiast rzucać nogami."],
      [
        "Biodra nie odrywają się od podłogi",
        "Powtórzenie liczy się, gdy kość ogonowa odrywa się od podłogi. Samo przyciąganie kolan trenuje głównie zginacze bioder.",
      ],
      ["Szybkie opadanie", "Opuszczaj przez dwie do trzech sekund. Powolne opuszczanie robi połowę roboty."],
    ],
    sets: [
      "**Brzuch:** 3 serie po 10 do 15 powolnych powtórzeń.",
      "**Trudniej:** na ławce skośnej albo przejdź do [unoszenia nóg w zwisie](/exercises/hanging-leg-raise/).",
    ],
    variations: [
      ["bench-reverse-crunch", "Na ławce, trzymając jej brzeg, dla większego zakresu."],
      ["cable-reverse-crunch", "Wyciąg dodaje ciężar, który możesz zwiększać."],
      ["hanging-leg-raise", "W zwisie na drążku: najtrudniejsza wersja."],
    ],
    faq: [
      [
        "Czy odwrotne brzuszki trenują dolny brzuch?",
        "Trenują cały mięsień prosty brzucha, który biegnie od żeber do miednicy. Podwijanie miednicy mocniej obciąża dolną część, dlatego czujesz je nisko.",
      ],
      [
        "Odwrotne czy zwykłe brzuszki?",
        "Odwrotne są łagodniejsze dla karku i trudniej w nich oszukiwać rozpędem. Odwrotne brzuszki i [deska](/exercises/plank/) razem dobrze pokrywają brzuch.",
      ],
      [
        "Czy odwrotne brzuszki spłaszczą mi brzuch?",
        "Wzmocnią mięśnie brzucha, ale utrata tłuszczu zależy od tego, co jesz i jak dużo się ruszasz, a nie od trenowania jednego miejsca.",
      ],
    ],
  },
  "pec-deck": {
    intro:
      "Rozpiętki na maszynie (butterfly) robisz na siedząco, łącząc dwa uchwyty łukiem przed klatką. Maszyna prowadzi tor ruchu, więc możesz mocno pracować klatką bez balansowania ciężarem: bezpieczne zakończenie po wyciskaniach.",
    mistakes: [
      ["Barki uciekają do przodu", "Trzymaj klatkę wysoko, a łopatki ściągnięte i oparte o oparcie przez całą serię."],
      ["Siedzisko za wysoko lub za nisko", "Ustaw je tak, żeby uchwyty były na wysokości klatki, a łokcie trochę poniżej barków."],
      ["Uderzanie stosem ciężarów", "Zatrzymaj się tuż przed zetknięciem płyt, żeby klatka była napięta między powtórzeniami."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie po 10 do 15 powtórzeń, z sekundowym napięciem, gdy dłonie się spotykają.",
      "**Na koniec:** 1 do 2 serii po 15 do 20 po wyciskaniach.",
    ],
    variations: [
      ["cable-fly", "Na wyciągach, dla swobodnego toru i większego rozciągnięcia."],
      ["db-fly", "Z hantlami na ławce płaskiej."],
      ["single-arm-pec-deck", "Jedną ręką naraz, żeby wyrównać strony."],
    ],
    faq: [
      [
        "Jakie mięśnie trenują rozpiętki na maszynie?",
        "Głównie klatkę. Trenują jej zadanie sprowadzania ramion przed ciało, z małą pomocą tricepsów, inaczej niż wyciskanie.",
      ],
      [
        "Butterfly czy rozpiętki na wyciągach?",
        "Oba działają dobrze. Butterfly szybciej ustawisz i jest bardzo stabilny; wyciągi pozwalają zmieniać kąt. Wybierz to, co jest wolne na twojej siłowni.",
      ],
      [
        "Czy butterfly szkodzi barkom?",
        "Nie przy rozsądnym zakresie. Kończ rozciąganie, gdy łokcie są w linii z ciałem, nie daleko za nim, i trzymaj łopatki ściągnięte.",
      ],
    ],
  },
  "machine-shoulder-press": {
    intro:
      "W wyciskaniu nad głowę na maszynie siedzisz przy oparciu i wypychasz dwa uchwyty nad głowę po stałym torze. Trenuje przód barków i tricepsy bez balansowania, więc możesz bezpiecznie dojść blisko upadku mięśniowego.",
    mistakes: [
      ["Odrywanie się od oparcia", "Trzymaj plecy i głowę przy oparciu. Jeśli musisz się wygiąć, żeby skończyć, ciężar jest za duży."],
      [
        "Źle ustawione siedzisko",
        "Ustaw je tak, żeby uchwyty startowały mniej więcej na wysokości barków. Za nisko obciąża bark na dole; za wysoko skraca zakres.",
      ],
      ["Odbijanie na górze", "Wyciskaj płynnie do prawie prostych rąk i opuszczaj pod kontrolą."],
    ],
    sets: ["**Masa mięśniowa:** 3 do 4 serii po 8 do 12 powtórzeń.", "**Po wyciskaniu wolnymi ciężarami:** 2 serie po 12 do 15."],
    variations: [
      ["db-shoulder-press", "Z hantlami, każda ręka osobno."],
      ["overhead-press", "Wyciskanie sztangi stojąc, bój siłowy."],
      ["single-arm-shoulder-press-machine", "Jedną ręką naraz na tej samej maszynie."],
    ],
    faq: [
      [
        "Jakie mięśnie trenuje wyciskanie nad głowę na maszynie?",
        "Głównie przednie aktony barków i tricepsy, z pomocą bocznych aktonów. Dla szerszych barków dodaj [unoszenie ramion bokiem](/exercises/lateral-raise/).",
      ],
      [
        "Wyciskanie na maszynie czy z hantlami?",
        "Maszyna jest łatwiejsza do nauki i do bezpiecznego cisnięcia; hantle trenują równowagę i dają każdej ręce swobodę. Oba budują barki.",
      ],
      [
        "Których uchwytów używać?",
        "Neutralne (dłonie zwrócone do siebie) są łagodniejsze dla większości barków. Nachwytu używaj, jeśli dobrze się z nim czujesz.",
      ],
    ],
  },
  "straight-arm-pulldown": {
    intro:
      "Przy ściąganiu drążka prostymi rękami stajesz przodem do górnego wyciągu i prowadzisz drążek do ud prawie prostymi rękami. Izoluje mięśnie najszersze grzbietu bez pomocy bicepsów: dobra rozgrzewka przed podciąganiem i prosty sposób, żeby poczuć ich pracę.",
    mistakes: [
      [
        "Uginanie łokci",
        "Trzymaj lekkie, stałe ugięcie. Jeśli łokcie zginają się bardziej z każdym powtórzeniem, robi się z tego prostowanie ramion na wyciągu.",
      ],
      ["Praca całym ciałem", "Lekko się pochyl i utrzymaj tę pozycję. Ruszają się ręce, nie tułów."],
      ["Skracanie zakresu na górze", "Pozwól rękom unieść się, aż poczujesz rozciąganie najszerszych, potem prowadź w dół."],
    ],
    sets: [
      "**Masa mięśniowa:** 3 serie po 12 do 15 powtórzeń.",
      "**Rozgrzewka przed ciągnięciem:** 2 lekkie serie po 15 przed podciąganiem lub wiosłowaniem.",
    ],
    variations: [
      ["rope-straight-arm-pulldown", "Z liną, żeby dłonie mogły minąć biodra."],
      ["db-pullover", "Leżąc na ławce z hantlem."],
      ["band-straight-arm-pulldown", "Z gumą zaczepioną wysoko, do domu."],
    ],
    faq: [
      [
        "Jakie mięśnie trenuje ściąganie drążka prostymi rękami?",
        "Głównie najszersze grzbietu; głowa długa tricepsa i brzuch trzymają ręce i tułów nieruchomo.",
      ],
      [
        "Ściąganie prostymi rękami czy zwykłe ściąganie drążka?",
        "[Ściąganie drążka wyciągu](/exercises/lat-pulldown/) służy do cięższej pracy i angażuje też bicepsy; wersja prostymi rękami izoluje najszersze. Dobrze łączą się w jednym treningu.",
      ],
      ["Drążek czy lina?", "Prosty drążek jest stabilniejszy. Lina pozwala rozsunąć dłonie i minąć biodra, co daje trochę większy zakres."],
    ],
  },
};
