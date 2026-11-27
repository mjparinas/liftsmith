import { GEN_PL } from "./gen/pl";
import type { LocalTools } from "./types";

// The calculators in Polish (ty). Same parts as the English pages (src/app/tools/).
export const PL_TOOLS: LocalTools = {
  frame: {
    tools: "Narzędzia",
    questions: "Pytania",
    more: "Więcej:",
    and: " i ",
    englishLinks: "Podlinkowane poradniki i artykuły są po angielsku.",
  },
  "plate-calculator": {
    page: {
      title: "Kalkulator talerzy: jakie talerze założyć na każdą stronę sztangi",
      description:
        "Wpisz ciężar i zobacz dokładnie, jakie talerze założyć na każdą stronę sztangi, w kg lub lb, z talerzy, które masz. Jeśli się nie da, podaje najbliższy możliwy ciężar.",
      name: "Kalkulator talerzy",
      intro:
        "Jakie talerze idą na każdą stronę sztangi przy dowolnym ciężarze. Dotykaj + i −, żeby go ustawić; wyłącz talerze, których nie masz.",
      sticky: "Talerze rozrysowane w każdej serii",
      mid: {
        title: "Przestań liczyć talerze między seriami",
        body: "{app} rozrysowuje talerze w każdej serii i w czasie przerwy pokazuje, co zmienić przed następną.",
        button: "Wypróbuj za darmo",
      },
      end: {
        title: "Każda seria załadowana za ciebie",
        body: "Powiedz {app} raz, jakie talerze ma twoja siłownia. Każdy zaplanowany ciężar to taki, który naprawdę możesz załadować, z talerzami na każdą stronę.",
      },
      faq: [
        [
          "Jak policzyć talerze na stronę?",
          "Weź docelowy ciężar, odejmij sztangę (20 kg lub 45 lb w standardowej sztandze olimpijskiej) i podziel przez dwa. Tyle idzie na każdą stronę. Najcięższe talerze zakładaj najpierw.",
        ],
        [
          "A jeśli moje talerze nie dają tego ciężaru?",
          "Kalkulator znajdzie najbliższe ciężary, które da się złożyć, powyżej i poniżej. Wybierz lżejszy: to bezpieczniejszy błąd.",
        ],
        [
          "Ile waży sztanga?",
          "Standardowa sztanga olimpijska waży 20 kg lub 45 lb. Sztangi damskie 15 kg lub 35 lb. Gryfy łamane, sztangi heksagonalne i suwnice Smitha bywają różne, więc sprawdź swoją.",
        ],
        [
          "Czy {app} zrobi to za mnie?",
          "Tak. {app} proponuje tylko ciężary, które da się złożyć z talerzy twojej siłowni, rozrysowuje talerze w każdej serii i w czasie przerwy pokazuje, co zmienić między seriami.",
        ],
      ],
      reading: [
        {
          href: "/blog/how-to-load-a-barbell/",
          label: "jak załadować sztangę",
        },
      ],
    },
    ui: {
      units: "Jednostki",
      weight: "Ciężar na sztandze ({unit})",
      weightAria: "ciężar",
      bar: "Sztanga",
      plates: "Talerze, które masz",
      loadThis: "Załaduj to",
      cantMake: "Z tych talerzy nie da się złożyć {want}. Najbliżej:",
      eachSide: "Na każdą stronę: {plates}",
      justBar: "nic, sama sztanga",
      closestOne: "Najbliżej, co da się złożyć: {below}. Mniej to bezpieczniejszy błąd.",
      closestTwo: "Najbliżej, co da się złożyć: {below} albo {above}. Mniej to bezpieczniejszy błąd.",
    },
  },
  "one-rep-max-calculator": {
    page: {
      title: "Kalkulator 1RM: oblicz ciężar maksymalny z dowolnej serii",
      description:
        "Oblicz swój ciężar maksymalny na jedno powtórzenie z ciężaru, powtórzeń i powtórzeń w zapasie, z tabelą ciężaru na liczbę powtórzeń i wynikami wzorów Epleya, Brzyckiego i sześciu innych.",
      name: "Kalkulator 1RM",
      intro:
        "Twoje szacowane maksimum z dowolnej serii, bez sprawdzania go na sztandze. Dotykaj + i −, żeby wpisać serię; przytrzymaj, żeby szło szybciej.",
      sticky: "Twoje maksimum śledzone w każdej serii",
      mid: {
        title: "Patrz, jak rośnie twoje maksimum, seria po serii",
        body: "{app} aktualizuje szacunek z każdą zapisaną serią i pokazuje trend każdego ćwiczenia.",
        button: "Zacznij za darmo",
      },
      end: {
        title: "Zyskuj siłę bez zgadywania",
        body: "{app} zamienia twoje maksimum we właściwy ciężar na każdą serię i podnosi go, gdy na to zapracujesz.",
      },
      faq: [
        [
          "Jak szacuje się ciężar maksymalny?",
          "Z ciężaru i liczby powtórzeń, które mógłbyś zrobić do upadku mięśniowego (twoje powtórzenia plus te, które zostały w zapasie). Do 10 powtórzeń do upadku uśrednia wzory Brzyckiego, Epleya i równanie z 2026 roku zależne od ciężaru; powyżej 10 używa wzorów Mayhewa, Wathana i tego samego równania, które lepiej sprawdzają się przy większej liczbie powtórzeń.",
        ],
        [
          "Po co liczyć powtórzenia, które zostały w zapasie?",
          "Wzory zakładają, że doszedłeś do upadku. Seria 5 powtórzeń z 2 w zapasie to w praktyce wysiłek na 7, więc jeśli tego nie policzysz, szacunek wyjdzie za niski.",
        ],
        [
          "Jak dokładny jest wynik?",
          "Najdokładniejszy przy ciężkich seriach od 2 do 6 powtórzeń, wciąż przydatny do około 10, a od 15 przybliżony. Traktuj go jako zakres i patrz na trend w czasie.",
        ],
        [
          "Czy {app} śledzi to za mnie?",
          "Tak. Każda zapisana seria aktualizuje szacunek dla tego ćwiczenia, z większą wagą dla nowszych serii i tych bliżej upadku, i pokazuje go na wykresie w czasie.",
        ],
      ],
      reading: [
        {
          href: "/blog/how-to-estimate-your-one-rep-max/",
          label: "jak oszacować ciężar maksymalny",
        },
        {
          href: "/guides/reps-in-reserve/",
          label: "powtórzenia w zapasie",
        },
      ],
    },
    ui: {
      units: "Jednostki",
      weight: "Podniesiony ciężar ({unit})",
      weightAria: "ciężar",
      reps: "Powtórzenia",
      repsAria: "powtórzenia",
      left: "Powtórzenia w zapasie",
      failure: "0 (upadek)",
      leftNote: "Policzenie powtórzeń w zapasie sprawia, że szacunek jest dużo dokładniejszy.",
      rough: "Powyżej 10 powtórzeń do upadku szacunki są bardziej przybliżone.",
      estimate: "Szacowany 1RM",
      tableCaption: "Ciężar dla każdej liczby powtórzeń do upadku",
      colReps: "Powt.",
      colWeight: "Ciężar",
      colPct: "% maksimum",
      formulas: "Co mówi każdy wzór",
      formulasNote: "Szacunek powyżej uśrednia wzory pasujące do {n} powtórzeń do upadku (oznaczone ✓).",
    },
  },
  "warm-up-calculator": {
    page: {
      title: "Kalkulator rozgrzewki: serie wprowadzające dla dowolnego ciężaru",
      description:
        "Wpisz ciężar roboczy i dostań serie rozgrzewkowe do przysiadu, wyciskania sztangi na ławce, martwego ciągu, wyciskania żołnierskiego albo wiosłowania, z talerzami na każdą stronę.",
      name: "Kalkulator rozgrzewki",
      intro:
        "Serie rozgrzewkowe przed ciężarem roboczym: tyle, żeby być gotowym, nie tyle, żeby się zmęczyć. Wybierz ćwiczenie i wpisz ciężar.",
      sticky: "Rozgrzewka zaplanowana do każdego ćwiczenia",
      mid: {
        title: "Już nigdy nie licz rozgrzewki",
        body: "{app} dodaje serie rozgrzewkowe do każdego treningu, z rozrysowanymi talerzami, i pomija je, gdy mięsień jest już rozgrzany.",
        button: "Zaplanuj mój trening",
      },
      end: {
        title: "Przyjdź, rozgrzej się, podnoś",
        body: "{app} planuje rozgrzewkę, serie robocze i przerwy między nimi, więc ty tylko podnosisz.",
      },
      faq: [
        [
          "Ile serii rozgrzewkowych zrobić?",
          "Po pustej sztandze: jedną lżejszą serię, jeśli ciężar roboczy to mniej niż około 50 kg (110 lb), dwie serie wprowadzające od 50 kg i trzy od 100 kg (220 lb), ostatnią z jednym powtórzeniem przy około 85%.",
        ],
        [
          "Ile powtórzeń w serii rozgrzewkowej?",
          "Tym mniej, im wyższy ciężar: około 5 przy połowie ciężaru roboczego, 2 lub 3 przy 70–80% i jedno przy około 85%. Chodzi o przećwiczenie ruchu i oswojenie się z obciążeniem, nie o zmęczenie.",
        ],
        [
          "Jak długa przerwa między seriami rozgrzewkowymi?",
          "Około {rest} sekund wystarczy przy lekkich seriach. Przed pierwszą serią roboczą odpocznij tyle co zwykle.",
        ],
        [
          "Czy muszę się rozgrzewać przed każdym ćwiczeniem?",
          "Nie. Pierwsze ciężkie ćwiczenie na dany mięsień potrzebuje serii wprowadzających. Kolejne na te same mięśnie potrzebuje najwyżej jednej serii próbnej, a lekkie ćwiczenia akcesoryjne prawie nigdy niczego.",
        ],
      ],
      more: {
        heading: "Jak liczona jest rozgrzewka",
        paragraphs: [
          "Zaczyna się od pustej sztangi, 10 łatwych powtórzeń (chyba że ciężar roboczy niewiele przekracza sztangę), a potem kilkoma krokami dochodzi do ciężaru roboczego. Każdy krok to ciężar, który naprawdę da się złożyć z twoich talerzy, cięższy od poprzedniego i lżejszy od roboczego. Im cięższe ćwiczenie, tym więcej kroków i mniej powtórzeń w każdym, żeby rozgrzewka cię przygotowała, nie odbierając siły na serie robocze.",
          "To ta sama progresja, której używa aplikacja {app}. W aplikacji wie ona też, które mięśnie są już rozgrzane wcześniej w treningu, więc drugie ćwiczenie wypychające dostaje jedną serię próbną zamiast pełnego wprowadzenia.",
        ],
      },
      reading: [
        {
          href: "/blog/how-to-warm-up-for-lifting/",
          label: "jak rozgrzać się przed treningiem siłowym",
        },
        {
          href: "/pl/tools/plate-calculator/",
          label: "kalkulator talerzy",
        },
        {
          href: "/blog/dynamic-vs-static-stretching/",
          label: "rozciąganie dynamiczne czy statyczne",
        },
      ],
    },
    ui: {
      units: "Jednostki",
      lift: "Ćwiczenie",
      lifts: {
        "back-squat": "Przysiad",
        "bench-press": "Wyciskanie sztangi na ławce",
        deadlift: "Martwy ciąg",
        "overhead-press": "Wyciskanie żołnierskie",
        "barbell-row": "Wiosłowanie sztangą",
      },
      work: "Ciężar roboczy ({unit})",
      workAria: "ciężar roboczy",
      setsOne: "{n} seria rozgrzewkowa, potem {rest} s przerwy",
      setsMany: "Serie rozgrzewkowe: {n}, po każdej {rest} s przerwy",
      none: "Przy tym ciężarze serie rozgrzewkowe nie są potrzebne",
      working: "{weight}: twoje serie robocze",
      eachSide: "Na każdą stronę: {plates}",
      empty: "Pusta sztanga",
    },
  },
  "tdee-calculator": {
    page: {
      title: "Kalkulator TDEE: dzienne zapotrzebowanie kaloryczne na utrzymanie, redukcję i masę",
      description:
        "Oblicz całkowity dzienny wydatek energetyczny na podstawie wieku, płci, wzrostu, wagi i aktywności: podstawowa przemiana materii, BMI, kalorie na redukcję lub budowę mięśni i zakres białka dla osób trenujących.",
      name: "Kalkulator TDEE",
      intro:
        "Ile kalorii spalasz dziennie i ile jeść, żeby utrzymać, schudnąć albo przytyć. Dotykaj + i −, żeby wpisać swoje liczby; przytrzymaj, żeby szło szybciej.",
      sticky: "Kalorie, które idą za twoimi ważeniami",
      mid: {
        title: "Zawsze aktualne, bez myślenia",
        body: "Twoje TDEE zmienia się razem z wagą i treningiem. {app} przelicza je samo na podstawie ważeń i dni, w które naprawdę trenujesz, i pokazuje, jak zmienia się w czasie.",
        button: "Otwórz {app}",
      },
      end: {
        title: "Twoje TDEE, zawsze aktualne",
        body: "{app} przelicza je na podstawie ważeń i dni treningowych, a do tego planuje twoje treningi.",
      },
      faq: [
        [
          "Co to jest TDEE?",
          "Całkowity dzienny wydatek energetyczny: kalorie, które spalasz w ciągu dnia, czyli spoczynkowa przemiana materii (BMR), trawienie, codzienny ruch i trening razem. Jeśli jesz mniej więcej tyle, twoja waga się nie zmienia.",
        ],
        [
          "Jakiego wzoru używa?",
          "Mifflina-St Jeora dla wydatku spoczynkowego, najdokładniejszego z popularnych równań dla większości ludzi. Jeśli dodasz tkankę tłuszczową, przechodzi na Katcha-McArdle'a, który wychodzi od beztłuszczowej masy ciała i lepiej pasuje do osób umięśnionych. Potem BMR mnoży się przez współczynnik aktywności od 1,2 (siedzący tryb życia) do 1,9 (sportowiec).",
        ],
        [
          "Ile kalorii, żeby schudnąć albo przytyć?",
          "Około 500 poniżej TDEE daje spadek około 0,5 kg tygodniowo. Żeby budować mięśnie przy małym przyroście tłuszczu, około 250 powyżej. Waż się kilka razy w tygodniu i koryguj, jeśli trend się nie zgadza.",
        ],
        [
          "Jak dokładny jest wynik?",
          "Każdy wzór to szacunek, u większości ludzi często z błędem do 10%. Rozstrzyga waga: jeśli trend z dwóch, trzech tygodni się nie zgadza, dodaj lub odejmij 100–200 kalorii.",
        ],
        [
          "Czy {app} aktualizuje moje TDEE?",
          "Tak. W {app} twoje TDEE przelicza się samo, gdy zmienia się twoja waga, wiek albo trening, odczytuje wagę, wzrost i tkankę tłuszczową z Health Connect lub Apple Zdrowie, jeśli na to pozwolisz, ustala poziom aktywności według dni, w które naprawdę trenujesz, i pokazuje, jak się zmienia.",
        ],
      ],
      reading: [
        {
          href: "/pl/tools/macro-calculator/",
          label: "kalkulator makroskładników",
        },
        {
          href: "/blog/how-much-protein-to-build-muscle/",
          label: "ile białka do budowy mięśni",
        },
        {
          href: "/blog/body-recomposition/",
          label: "rekompozycja sylwetki",
        },
      ],
    },
    ui: {
      units: "Jednostki",
      metric: "Metryczne",
      imperial: "Imperialne",
      sex: "Płeć",
      female: "Kobieta",
      male: "Mężczyzna",
      age: "Wiek",
      weightKg: "Waga (kg)",
      weightLb: "Waga (lb)",
      heightCm: "Wzrost (cm)",
      heightIn: "Wzrost (in)",
      fat: "Tkanka tłuszczowa (opcjonalnie)",
      skip: "Pomiń",
      add: "Dodaj",
      fatPct: "Tkanka tłuszczowa (%)",
      activity: "Aktywność",
    },
  },
  "macro-calculator": {
    page: {
      title: "Kalkulator makroskładników dla trenujących: białko, tłuszcze i węglowodany",
      description:
        "Oblicz kalorie i makroskładniki na redukcję, utrzymanie albo budowę mięśni na podstawie wieku, płci, wzrostu, wagi i aktywności, z białkiem dobranym dla osób trenujących siłowo.",
      name: "Kalkulator makroskładników",
      intro:
        "Kalorie na twój cel wyliczone z TDEE, rozłożone na białko, tłuszcze i węglowodany dla osoby trenującej siłowo, z uzasadnieniem każdej liczby.",
      sticky: "Makro, które idą za twoimi ważeniami",
      mid: {
        title: "Makro, które nadążają za tobą",
        body: "W {app} twoje kalorie i makro idą za ważeniami i dniami treningowymi, a trener daje znać, gdy brakuje ci białka.",
        button: "Zacznij za darmo",
      },
      end: {
        title: "Trenuj pod cel, pod który jesz",
        body: "{app} planuje każdy trening według twojej regeneracji i bloku, żebyś na redukcji nie tracił siły, a na masie budował mięśnie.",
      },
      faq: [
        [
          "Ile białka potrzebuję do budowy mięśni?",
          "Większość badań na osobach trenujących siłowo podaje od 1,6 do 2,2 g na kg masy ciała dziennie. Ten kalkulator przyjmuje 1,8 g na utrzymanie lub masę i 2,2 g na redukcji, gdzie więcej białka pomaga zachować mięśnie.",
        ],
        [
          "Jak ustalane są tłuszcze i węglowodany?",
          "Tłuszcze to jedna czwarta kalorii, ale nigdy mniej niż 0,6 g na kg, ze względu na hormony. Węglowodany wypełniają resztę, bo to paliwo na ciężkie serie. Jeśli wolisz więcej tłuszczu i mniej węglowodanów, wymieniaj je według kalorii: 1 g tłuszczu to 9 kalorii, a 1 g węglowodanów to 4.",
        ],
        [
          "Ile kalorii, żeby zgubić tłuszcz albo zbudować mięśnie?",
          "Około 500 poniżej TDEE daje spadek około 0,5 kg tygodniowo, nigdy poniżej podstawowej przemiany materii. Około 250 powyżej buduje mięśnie przy małym przyroście tłuszczu. Waż się kilka razy w tygodniu i koryguj, jeśli trend się nie zgadza.",
        ],
        [
          "Czy muszę idealnie trafiać w makro?",
          "Nie. Dobijaj do białka i trzymaj się blisko kalorii prawie każdego dnia; podział między tłuszcze a węglowodany ma dużo mniejsze znaczenie.",
        ],
      ],
      more: {
        heading: "Jak to jest liczone",
        paragraphs: [
          "TDEE wynika z równania Mifflina-St Jeora pomnożonego przez współczynnik aktywności, tak jak w kalkulatorze TDEE. Twój cel ustala kalorie: 500 mniej (nigdy poniżej podstawowej przemiany materii), tyle samo albo 250 więcej. Najpierw ustalane jest białko na kilogram masy ciała, potem tłuszcze, a węglowodany dostają resztę.",
        ],
      },
      reading: [
        {
          href: "/pl/tools/tdee-calculator/",
          label: "kalkulator TDEE",
        },
        {
          href: "/blog/how-much-protein-to-build-muscle/",
          label: "ile białka do budowy mięśni",
        },
        {
          href: "/blog/lean-bulk/",
          label: "czysta masa",
        },
      ],
    },
    ui: {
      units: "Jednostki",
      metric: "Metryczne",
      imperial: "Imperialne",
      goal: "Cel",
      cut: "Redukcja tłuszczu",
      maintain: "Utrzymanie",
      bulk: "Budowa mięśni",
      sex: "Płeć",
      female: "Kobieta",
      male: "Mężczyzna",
      age: "Wiek",
      weightKg: "Waga (kg)",
      weightLb: "Waga (lb)",
      heightCm: "Wzrost (cm)",
      heightIn: "Wzrost (cale)",
      activity: "Aktywność",
      kcalDay: "kalorii dziennie",
      protein: "Białko",
      fat: "Tłuszcze",
      carbs: "Węglowodany",
      proteinCut: "{perKg} g na kg masy ciała: górna granica zakresu, żeby zachować mięśnie podczas redukcji tłuszczu.",
      proteinMaintain: "{perKg} g na kg masy ciała: środek zakresu, którego potrzebuje osoba trenująca.",
      proteinBulk: "{perKg} g na kg masy ciała: wystarczająco do budowy mięśni, a dodatkowe kalorie idą w węglowodany.",
      fatWhy: "Jedna czwarta twoich kalorii i nigdy mniej niż 0,6 g na kg, ze względu na hormony.",
      carbsWhy: "Reszta twoich kalorii, jako energia na ciężkie serie.",
      kcalFloor: "Twoja podstawowa przemiana materii, {bmr}: większe cięcie zeszłoby poniżej niej, a to kosztuje mięśnie.",
      kcalCut: "500 poniżej twojego TDEE, {tdee}: około {pace} mniej tygodniowo.",
      kcalMaintain: "Twoje TDEE: tyle, ile spalasz w zwykły dzień.",
      kcalBulk: "250 powyżej twojego TDEE, {tdee}: około {pace} więcej tygodniowo, głównie mięśni.",
      meals: "Rozłóż białko na posiłki ({meals} dziennie); najlepiej wykorzystuje się w porcjach po 30–40 g.",
    },
  },
  "wilks-calculator": {
    page: {
      title: "Kalkulator Wilks z punktami IPF GL i DOTS",
      description:
        "Oceń swój total z przysiadu, wyciskania sztangi na ławce i martwego ciągu względem masy ciała wzorem Wilksa, punktami IPF GL (klasyczny lub w sprzęcie) i DOTS, w kg lub lb.",
      name: "Kalkulator Wilks",
      intro:
        "Twój total w trójboju siłowym oceniony względem masy ciała na trzy sposoby, Wilks, IPF GL i DOTS, żeby porównać zawodników każdej wielkości i zobaczyć, ile brakuje do następnego poziomu.",
      sticky: "Twój wynik siłowy, zawsze aktualny",
      mid: {
        title: "Wszystkie trzy wyniki, z każdą zapisaną serią",
        body: "{app} szacuje twój najlepszy przysiad, wyciskanie na ławce i martwy ciąg z treningów i na bieżąco aktualizuje Wilks, IPF GL i DOTS, razem z bojem, który najbardziej odstaje.",
        button: "Zacznij za darmo",
      },
      end: {
        title: "Zbuduj większy total",
        body: "{app} planuje każdy trening z powtórzeniami w zapasie, robi deload, gdy narasta zmęczenie, i podnosi każdy bój, gdy na to zapracujesz.",
      },
      faq: [
        [
          "Co to jest wynik Wilks?",
          "Liczba, która porównuje totale w trójboju siłowym między różnymi masami ciała. Twój total mnoży się przez współczynnik z wzoru opublikowanego przez Roberta Wilksa, więc lekki i ciężki zawodnik mogą być klasyfikowani razem. Przez dziesięciolecia był standardem i wiele osób wciąż go używa.",
        ],
        [
          "Co to są punkty IPF GL?",
          "Własny wzór Międzynarodowej Federacji Trójboju Siłowego od 2020 roku, czasem nazywany punktami Goodlift. Ma osobne wersje dla trójboju klasycznego (bez sprzętu) i w sprzęcie oraz dla samego wyciskania na ławce. Około 100 punktów to total na poziomie światowym.",
        ],
        [
          "Którego wyniku używać?",
          "Jeśli startujesz w zawodach, tego, którego używa twoja federacja. Do śledzenia własnych postępów DOTS i IPF GL to najnowsze wzory, dopasowane do niedawnych wyników zawodów. Porównuj wynik tylko z wynikiem z tego samego wzoru.",
        ],
        [
          "Jaki wynik Wilks jest dobry?",
          "Z grubsza około 300 to solidny total na poziomie średniozaawansowanym, 400 zaawansowanym, a 450 i więcej elitarnym u mężczyzn; wyniki kobiet są na tej samej skali. To przybliżone wskazówki, nie oficjalne poziomy.",
        ],
      ],
      more: {
        heading: "Jak liczone są wyniki",
        paragraphs: [
          "Wilks dzieli 500 przez wielomian piątego stopnia masy ciała w kilogramach, z osobnymi współczynnikami dla mężczyzn i kobiet, i mnoży twój total przez wynik. IPF GL dzieli 100 przez A − B·e^(−C·masa ciała), z wartościami A, B i C publikowanymi przez IPF dla każdej płci, sprzętu i konkurencji. DOTS używa wielomianu czwartego stopnia. Funty są najpierw przeliczane na kilogramy. Współczynniki są sprawdzone z otwartym projektem wyników trójboju siłowego.",
        ],
      },
      reading: [
        {
          href: "/pl/tools/dots-calculator/",
          label: "kalkulator DOTS",
        },
        {
          href: "/pl/tools/one-rep-max-calculator/",
          label: "kalkulator 1RM",
        },
        {
          href: "/blog/how-to-increase-your-squat/",
          label: "jak poprawić przysiad",
        },
      ],
    },
    ui: {
      units: "Jednostki",
      formula: "Wzór",
      men: "Wzór dla mężczyzn",
      women: "Wzór dla kobiet",
      gear: "Sprzęt",
      classic: "Klasyczny (bez sprzętu)",
      equipped: "W sprzęcie",
      bw: "Masa ciała ({unit})",
      squat: "Przysiad",
      bench: "Wyciskanie sztangi na ławce",
      deadlift: "Martwy ciąg",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      level: "Poziom DOTS: {level}.",
      next: "Dodaj około {weight} {unit} do totalu, żeby dojść do poziomu {level} (DOTS {score}).",
      elite: "To total na poziomie elitarnym.",
      note: "Wilks i DOTS nie zmieniają się zależnie od sprzętu. IPF GL ma osobne wzory dla trójboju klasycznego i w sprzęcie, więc wybierz ten, który pasuje do twojej formuły startów.",
      levels: {
        beginner: "Początkujący",
        novice: "Nowicjusz",
        intermediate: "Średniozaawansowany",
        advanced: "Zaawansowany",
        elite: "Elita",
      },
    },
  },
  "dots-calculator": {
    page: {
      title: "Kalkulator DOTS: oceń swój total w trójboju siłowym",
      description:
        "Oblicz wynik DOTS z przysiadu, wyciskania sztangi na ławce, martwego ciągu i masy ciała, w kg lub lb, żeby porównać zawodników każdej wielkości.",
      name: "Kalkulator DOTS",
      intro:
        "Twój total z przysiadu, wyciskania na ławce i martwego ciągu oceniony względem masy ciała, żeby lekki i ciężki zawodnik mogli sprawdzić, kto jest silniejszy jak na swoje gabaryty.",
      sticky: "Twój DOTS, zawsze aktualny",
      mid: {
        title: "Twój DOTS, z każdą serią",
        body: "{app} szacuje twój najlepszy przysiad, wyciskanie na ławce i martwy ciąg z zapisanych serii i na bieżąco aktualizuje twój DOTS, bez dnia testowania maksów.",
        button: "Zacznij za darmo",
      },
      end: {
        title: "Zbuduj większy total",
        body: "{app} planuje trening w blokach z celami powtórzeń w zapasie i deloadami, i podnosi każdy bój, gdy na to zapracujesz.",
      },
      faq: [
        [
          "Co to jest wynik DOTS?",
          "Sposób porównywania totali w trójboju siłowym między różnymi masami ciała. Twój total mnoży się przez współczynnik zależny od masy ciała, więc osoba ważąca 60 kg i osoba ważąca 110 kg mogą być klasyfikowane na tej samej skali. Używa go wiele federacji.",
        ],
        [
          "Jaki wynik DOTS jest dobry?",
          "Z grubsza: 200 to total nowicjusza, 300 średniozaawansowany, 400 zaawansowany, a 500 i więcej elitarny. To poziomy powszechnie stosowane, nie oficjalna skala.",
        ],
        [
          "DOTS czy Wilks?",
          "DOTS opublikowano w 2019 roku jako sprawiedliwszy następca starego wzoru Wilksa, oparty na większym zbiorze niedawnych wyników zawodów. Wyniki nie są wymienne, więc porównuj DOTS z DOTS.",
        ],
        [
          "Czy mogę użyć szacowanych maksimów zamiast totalu z zawodów?",
          "Do śledzenia własnych postępów tak. Oficjalne klasyfikacje używają bojów wykonanych na zawodach, według przepisów federacji.",
        ],
      ],
      more: {
        heading: "Jak liczony jest DOTS",
        paragraphs: [
          "DOTS dzieli 500 przez wielomian czwartego stopnia masy ciała w kilogramach, z osobnymi współczynnikami dla mężczyzn i kobiet, i mnoży twój total przez wynik. Masa ciała jest ograniczona do 40–210 kg u mężczyzn i 40–150 kg u kobiet. Współczynniki są opublikowane i sprawdzone z otwartym projektem wyników trójboju siłowego. Funty są najpierw przeliczane na kilogramy.",
        ],
      },
      reading: [
        {
          href: "/pl/tools/one-rep-max-calculator/",
          label: "kalkulator 1RM",
        },
        {
          href: "/blog/how-to-increase-your-squat/",
          label: "jak poprawić przysiad",
        },
        {
          href: "/blog/how-to-increase-your-deadlift/",
          label: "jak poprawić martwy ciąg",
        },
      ],
    },
    ui: {
      unitsSex: "Jednostki i płeć",
      men: "Wzór dla mężczyzn",
      women: "Wzór dla kobiet",
      bw: "Masa ciała ({unit})",
      squat: "Przysiad",
      bench: "Wyciskanie sztangi na ławce",
      deadlift: "Martwy ciąg",
      liftLabel: "{lift} ({unit})",
      total: "Total {total} {unit}",
      note: "Około 200 to total nowicjusza, 300 średniozaawansowany, 400 zaawansowany, a 500 i więcej elitarny. To przybliżone poziomy, nie oficjalna skala.",
      levels: {
        beginner: "Początkujący",
        novice: "Nowicjusz",
        intermediate: "Średniozaawansowany",
        advanced: "Zaawansowany",
        elite: "Elita",
      },
    },
  },
  "workout-generator": GEN_PL,
};
