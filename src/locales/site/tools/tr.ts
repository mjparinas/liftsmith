import type { LocalTools } from "./types";

// The calculators in Turkish (sen). Same parts as the English pages (src/app/tools/).
export const TR_TOOLS: LocalTools = {
  frame: {
    tools: "Araçlar",
    questions: "Sorular",
    more: "Daha fazlası:",
    and: " ve ",
    englishLinks: "Bağlantı verilen rehberler ve yazılar İngilizce.",
  },
  "plate-calculator": {
    page: {
      title: "Plaka hesaplayıcı: barın her iki yanına hangi plakalar takılır",
      description:
        "Bir ağırlık yaz ve elindeki plakalarla barın her iki yanına tam olarak hangi plakaları takacağını kg ya da lb olarak gör. Tam tutturulamıyorsa en yakın ağırlığı verir.",
      name: "Plaka hesaplayıcı",
      intro:
        "Herhangi bir ağırlık için barın her iki yanına hangi plakalar takılır. Ayarlamak için + ve −'ye dokun; elinde olmayan plakaları kapat.",
      sticky: "Her sette plakalar çizili",
      mid: {
        title: "Setler arasında plaka hesabını bırak",
        body: "{app} her setin plakalarını çizer ve dinlenirken bir sonraki set için neyi değiştireceğini gösterir.",
        button: "Ücretsiz dene",
      },
      end: {
        title: "Her set senin için hazır",
        body: "Salonunda hangi plakalar olduğunu {app} uygulamasına bir kez söyle. Planladığı her ağırlık, gerçekten takabileceğin bir ağırlıktır; her iki yanın plakalarıyla birlikte.",
      },
      faq: [
        [
          "Bir taraftaki plakaları nasıl hesaplarım?",
          "İstediğin ağırlıktan barı çıkar (standart bir olimpik barda 20 kg ya da 45 lb) ve ikiye böl. Her tarafa o kadar gider. Önce en ağır plakaları tak.",
        ],
        [
          "Plakalarım o ağırlığı tutturmuyorsa?",
          "Hesaplayıcı, yapabileceğin en yakın ağırlıkları bulur: biri üstünde, biri altında. Hafif olanı seç: en güvenli hata odur.",
        ],
        [
          "Bar kaç kilo?",
          "Standart bir olimpik bar 20 kg ya da 45 lb gelir. Kadın barları 15 kg ya da 35 lb. EZ barlar, hex barlar ve Smith makineleri değişir, kendininkini kontrol et.",
        ],
        [
          "{app} bunu benim için yapar mı?",
          "Evet. {app} yalnızca salonundaki plakalarla yapılabilecek ağırlıklar önerir, her setin plakalarını çizer ve dinlenirken setler arasında neyi değiştireceğini gösterir.",
        ],
      ],
      reading: [
        {
          href: "/blog/how-to-load-a-barbell/",
          label: "bar nasıl yüklenir",
        },
      ],
    },
    ui: {
      units: "Birimler",
      weight: "Bardaki ağırlık ({unit})",
      weightAria: "ağırlık",
      bar: "Bar",
      plates: "Elindeki plakalar",
      loadThis: "Bunu tak",
      cantMake: "Bu plakalarla {want} yapılamıyor. En yakını:",
      eachSide: "Her tarafa: {plates}",
      justBar: "hiçbir şey, sadece bar",
      closestOne: "Yapabileceğin en yakın ağırlık: {below}. Eksik kalmak en güvenli hatadır.",
      closestTwo: "Yapabileceğin en yakın ağırlıklar: {below} ya da {above}. Eksik kalmak en güvenli hatadır.",
    },
  },
  "one-rep-max-calculator": {
    page: {
      title: "1RM hesaplayıcı: herhangi bir setten maksimum tekrarını hesapla",
      description:
        "Ağırlık, tekrar ve yedekte kalan tekrardan tek tekrar maksimumunu hesapla; tekrara göre ağırlık tablosu ve Epley, Brzycki ile altı formülün daha sonuçlarıyla.",
      name: "1RM hesaplayıcı",
      intro:
        "Denemeye gerek kalmadan, herhangi bir setten tahmini maksimumun. Bir set girmek için + ve −'ye dokun; daha hızlı gitmek için basılı tut.",
      sticky: "Maksimumun, her sette takip edilir",
      mid: {
        title: "Maksimumunun set set yükselişini izle",
        body: "{app} kaydettiğin her setle tahminini günceller ve her hareketin trendini gösterir.",
        button: "Ücretsiz başla",
      },
      end: {
        title: "Tahmin yürütmeden güçlen",
        body: "{app} maksimumunu her set için doğru ağırlığa dönüştürür ve hak ettiğinde artırır.",
      },
      faq: [
        [
          "Tek tekrar maksimum nasıl tahmin edilir?",
          "Ağırlıkla ve tükenişe kadar yapabileceğin tekrar sayısıyla (yaptığın tekrarlar artı yedekte kalanlar). Tükenişe kadar 10 tekrara kadar Brzycki, Epley ve ağırlığa bağlı 2026 tarihli bir denklemin ortalamasını alır; 10'un üstünde Mayhew, Wathan ve aynı denklemi kullanır, bunlar yüksek tekrarlarda daha iyi tutar.",
        ],
        [
          "Yedekte kalan tekrarları neden saymalıyım?",
          "Formüller tükenişe kadar gittiğini varsayar. 2 tekrar yedekte bırakılan 5 tekrarlık bir set aslında 7 tekrarlık bir efordur; bunu saymazsan tahmin düşük çıkar.",
        ],
        [
          "Ne kadar doğru?",
          "En doğru sonucu 2–6 tekrarlık zor setler verir; yaklaşık 10 tekrara kadar hâlâ işe yarar, 15'ten sonra kabaca bir tahmindir. Bunu bir aralık olarak gör ve zaman içindeki trendi izle.",
        ],
        [
          "{app} bunu benim için takip eder mi?",
          "Evet. Kaydettiğin her set o hareketin tahminini günceller; yakın tarihli ve tükenişe daha yakın setlere daha çok ağırlık verir ve zaman içindeki değişimi grafikte gösterir.",
        ],
      ],
      reading: [
        {
          href: "/blog/how-to-estimate-your-one-rep-max/",
          label: "tek tekrar maksimumunu tahmin etmek",
        },
        {
          href: "/guides/reps-in-reserve/",
          label: "yedekte kalan tekrar",
        },
      ],
    },
    ui: {
      units: "Birimler",
      weight: "Kaldırılan ağırlık ({unit})",
      weightAria: "ağırlık",
      reps: "Tekrar",
      repsAria: "tekrar",
      left: "Yedekte kalan tekrar",
      failure: "0 (tükeniş)",
      leftNote: "Yedekte kalan tekrarları saymak tahmini çok daha doğru yapar.",
      rough: "Tükenişe kadar 10 tekrarın üstünde tahminler daha kabadır.",
      estimate: "Tahmini 1RM",
      tableCaption: "Tükenişe kadar her tekrar sayısı için ağırlık",
      colReps: "Tekrar",
      colWeight: "Ağırlık",
      colPct: "Maksimumun %'si",
      formulas: "Her formül ne diyor",
      formulasNote: "Yukarıdaki tahmin, tükenişe kadar {n} tekrara uyan formüllerin (✓ ile işaretli) ortalamasıdır.",
    },
  },
  "warm-up-calculator": {
    page: {
      title: "Isınma hesaplayıcı: her ağırlık için kademeli ısınma setleri",
      description:
        "Çalışma ağırlığını yaz; squat, bench press, deadlift, overhead press ya da barbell row için ısınma setlerini her iki yanın plakalarıyla birlikte al.",
      name: "Isınma hesaplayıcı",
      intro: "Çalışma ağırlığından önceki ısınma setleri: hazır olacak kadar, yoracak kadar değil. Bir hareket seç ve ağırlığı yaz.",
      sticky: "Her hareket için planlanmış ısınmalar",
      mid: {
        title: "Bir daha ısınma hesaplama",
        body: "{app} her antrenmana ısınma setlerini plakaları çizili olarak ekler ve kas zaten ısınmışsa onları atlar.",
        button: "Antrenmanımı planla",
      },
      end: {
        title: "Gel, ısın, kaldır",
        body: "{app} ısınmaları, çalışma setlerini ve aralarındaki dinlenmeyi planlar; sana sadece kaldırmak kalır.",
      },
      faq: [
        [
          "Kaç ısınma seti yapmalıyım?",
          "Boş bardan sonra: çalışma ağırlığın yaklaşık 50 kg'ın (110 lb) altındaysa bir hafif set, 50 kg'dan itibaren iki kademeli set, 100 kg'dan (220 lb) itibaren üç set; sonuncusu %85 civarında tek tekrar.",
        ],
        [
          "Bir ısınma setinde kaç tekrar?",
          "Ağırlık arttıkça daha az: çalışma ağırlığının yarısında yaklaşık 5, %70–80 arasında 2 ya da 3, %85 civarında tek tekrar. Amaç yorulmak değil, hareketi çalışmak ve yüke alışmak.",
        ],
        [
          "Isınma setleri arasında ne kadar dinlenmeli?",
          "Hafif setler için yaklaşık {rest} saniye yeterli. İlk çalışma setinden önce normal dinlenme süreni kullan.",
        ],
        [
          "Her harekette ısınmam gerekir mi?",
          "Hayır. Bir kas için ilk ağır hareket kademeli bir ısınma ister. Aynı kaslar için sonraki bir hareket en fazla bir deneme seti ister, hafif yardımcı çalışmalar ise neredeyse hiçbir şey istemez.",
        ],
      ],
      more: {
        heading: "Isınma nasıl hesaplanır",
        paragraphs: [
          "Boş barla 10 kolay tekrarla başlar (çalışma ağırlığın barı ancak geçiyorsa hariç), sonra birkaç adımda çalışma ağırlığına yükselir. Her adım, plakalarınla gerçekten yapılabilen, bir öncekinden ağır ve çalışma ağırlığından hafif bir ağırlıktır. Hareket ne kadar ağırsa adım o kadar çok, her adımdaki tekrar o kadar az olur; böylece ısınma seni hazırlar ama çalışma setlerinden güç çalmaz.",
          "Bu, {app} uygulamasının kullandığı kademelendirmenin aynısı. Uygulama, antrenmanın başında hangi kasların zaten ısındığını da bilir; bu yüzden ikinci bir itiş hareketi tam bir kademeli ısınma yerine tek bir deneme seti alır.",
        ],
      },
      reading: [
        {
          href: "/blog/how-to-warm-up-for-lifting/",
          label: "ağırlık çalışmasına nasıl ısınılır",
        },
        {
          href: "/tr/tools/plate-calculator/",
          label: "plaka hesaplayıcı",
        },
        {
          href: "/blog/dynamic-vs-static-stretching/",
          label: "dinamik ve statik esneme",
        },
      ],
    },
    ui: {
      units: "Birimler",
      lift: "Hareket",
      lifts: {
        "back-squat": "Squat",
        "bench-press": "Bench press",
        deadlift: "Deadlift",
        "overhead-press": "Overhead press",
        "barbell-row": "Barbell row",
      },
      work: "Çalışma ağırlığı ({unit})",
      workAria: "çalışma ağırlığı",
      setsOne: "{n} ısınma seti, ardından {rest} s dinlenme",
      setsMany: "{n} ısınma seti, her birinin ardından {rest} s dinlenme",
      none: "Bu ağırlıkta ısınma seti gerekmez",
      working: "{weight}: çalışma setlerin",
      eachSide: "Her tarafa: {plates}",
      empty: "Boş bar",
    },
  },
  "tdee-calculator": {
    page: {
      title: "TDEE hesaplama: korumak, yağ yakmak ya da kilo almak için günlük kalori",
      description:
        "Yaş, cinsiyet, boy, kilo ve aktivite düzeyinle toplam günlük enerji harcamanı hesapla: bazal metabolizma, BMI, yağ yakmak ya da kas kazanmak için kalori ve antrenman yapanlar için protein aralığı.",
      name: "TDEE hesaplayıcı",
      intro:
        "Günde kaç kalori yaktığın ve kilonu korumak, vermek ya da almak için ne yemen gerektiği. Sayılarını girmek için + ve −'ye dokun; daha hızlı gitmek için basılı tut.",
      sticky: "Tartılarını takip eden kaloriler",
      mid: {
        title: "Düşünmeden güncel tut",
        body: "TDEE'n kilonla ve antrenmanınla değişir. {app} onu tartılarınla ve gerçekten antrenman yaptığın günlerle kendiliğinden yeniden hesaplar ve zaman içindeki değişimini gösterir.",
        button: "{app} uygulamasını aç",
      },
      end: {
        title: "TDEE'n, her zaman güncel",
        body: "{app} onu tartılarınla ve antrenman günlerinle yeniden hesaplar, üstelik antrenmanlarını da planlar.",
      },
      faq: [
        [
          "TDEE nedir?",
          "Toplam günlük enerji harcaması: bir günde yaktığın kaloriler; dinlenme metabolizman (BMR), sindirim, günlük hareket ve egzersizin toplamı. Aşağı yukarı bu kadar yersen kilon sabit kalır.",
        ],
        [
          "Hangi formülü kullanıyor?",
          "Dinlenme harcaması için Mifflin-St Jeor; çoğu insan için yaygın denklemlerin en doğrusu. Vücut yağını eklersen yağsız kütleden yola çıkan ve kaslı kişilere daha iyi uyan Katch-McArdle'a geçer. Sonra BMR, 1,2 (hareketsiz) ile 1,9 (sporcu) arasında bir aktivite katsayısıyla çarpılır.",
        ],
        [
          "Kilo vermek ya da almak için kaç kalori?",
          "TDEE'nin yaklaşık 500 altı, haftada yaklaşık 0,5 kg kaybettirir. Az yağla kas kazanmak için yaklaşık 250 üstü. Haftada birkaç kez tartıl, trend uymuyorsa ayarla.",
        ],
        [
          "Ne kadar doğru?",
          "Her formül bir tahmindir; çoğu insan için genellikle %10'luk bir sapma payı vardır. Son sözü tartı söyler: iki üç haftalık trendin uymuyorsa 100–200 kalori artır ya da azalt.",
        ],
        [
          "{app} TDEE'mi güncel tutar mı?",
          "Evet. {app} içinde TDEE'n kilon, yaşın ya da antrenmanın değiştikçe kendiliğinden yeniden hesaplanır; izin verirsen kilo, boy ve vücut yağını Health Connect'ten ya da Apple Sağlık'tan okur, aktivite düzeyini gerçekten antrenman yaptığın günlere göre belirler ve gelişimini gösterir.",
        ],
      ],
      reading: [
        {
          href: "/tr/tools/macro-calculator/",
          label: "makro hesaplayıcı",
        },
        {
          href: "/blog/how-much-protein-to-build-muscle/",
          label: "kas yapmak için ne kadar protein",
        },
        {
          href: "/blog/body-recomposition/",
          label: "vücut kompozisyonu değişimi (rekompozisyon)",
        },
      ],
    },
    ui: {
      units: "Birimler",
      metric: "Metrik",
      imperial: "İmparatorluk",
      sex: "Cinsiyet",
      female: "Kadın",
      male: "Erkek",
      age: "Yaş",
      weightKg: "Kilo (kg)",
      weightLb: "Kilo (lb)",
      heightCm: "Boy (cm)",
      heightIn: "Boy (in)",
      fat: "Vücut yağı (isteğe bağlı)",
      skip: "Atla",
      add: "Ekle",
      fatPct: "Vücut yağı (%)",
      activity: "Aktivite",
    },
  },
  "macro-calculator": {
    page: {
      title: "Antrenman yapanlar için makro hesaplama: protein, yağ ve karbonhidrat",
      description:
        "Yaş, cinsiyet, boy, kilo ve aktivite düzeyine göre yağ yakmak, korumak ya da kas kazanmak için kalori ve makrolarını hesapla; protein, ağırlık çalışanlar düşünülerek belirlenir.",
      name: "Makro hesaplayıcı",
      intro:
        "TDEE'nden hedefine göre kalorilerin; kuvvet antrenmanı yapan biri için protein, yağ ve karbonhidrata bölünmüş, her sayının nedeniyle.",
      sticky: "Tartılarını takip eden makrolar",
      mid: {
        title: "Seninle birlikte değişen makrolar",
        body: "{app} içinde kalorilerin ve makroların tartılarını ve antrenman günlerini takip eder, proteinin eksik kaldığında koç seni uyarır.",
        button: "Ücretsiz başla",
      },
      end: {
        title: "Beslendiğin hedef için antrenman yap",
        body: "{app} her antrenmanı toparlanmana ve bloğuna göre planlar; böylece yağ yakarken güç kaybetmez, kilo alırken kas kazanırsın.",
      },
      faq: [
        [
          "Kas kazanmak için ne kadar proteine ihtiyacım var?",
          "Kuvvet antrenmanı yapanlarla yapılan çoğu çalışma, günde vücut ağırlığının kilogramı başına 1,6 ile 2,2 g arasını gösteriyor. Bu hesaplayıcı korumak ya da kilo almak için 1,8 g, yağ yakarken ise 2,2 g kullanır; bu dönemde fazla protein kası korumaya yardım eder.",
        ],
        [
          "Yağ ve karbonhidrat nasıl belirlenir?",
          "Yağ kalorilerin dörtte birini alır ama hormonları korumak için asla kilogram başına 0,6 g'ın altına inmez. Karbonhidratlar geri kalanı doldurur, çünkü zor setlerin yakıtı onlardır. Daha fazla yağ ve daha az karbonhidrat istersen kaloriye göre değiştir: 1 g yağ 9 kalori, 1 g karbonhidrat 4 kaloridir.",
        ],
        [
          "Yağ yakmak ya da kas kazanmak için kaç kalori?",
          "TDEE'nin yaklaşık 500 altı haftada yaklaşık 0,5 kg kaybettirir, ama asla bazal metabolizmanın altına inmez. Yaklaşık 250 üstü az yağla kas yapar. Haftada birkaç kez tartıl, trend uymuyorsa ayarla.",
        ],
        [
          "Makroları tam tutturmam şart mı?",
          "Hayır. Çoğu gün proteinini tamamla ve kalorine yakın kal; yağ ile karbonhidrat arasındaki dağılım çok daha az önemli.",
        ],
      ],
      more: {
        heading: "Nasıl hesaplanır",
        paragraphs: [
          "TDEE, tıpkı TDEE hesaplayıcıdaki gibi Mifflin-St Jeor denkleminin bir aktivite katsayısıyla çarpılmasından gelir. Hedefin kaloriyi belirler: 500 eksik (asla bazal metabolizmanın altında değil), aynı ya da 250 fazla. Önce kilogram başına protein belirlenir, sonra yağ; karbonhidratlar da geri kalanı alır.",
        ],
      },
      reading: [
        {
          href: "/tr/tools/tdee-calculator/",
          label: "TDEE hesaplayıcı",
        },
        {
          href: "/blog/how-much-protein-to-build-muscle/",
          label: "kas yapmak için ne kadar protein",
        },
        {
          href: "/blog/lean-bulk/",
          label: "temiz bulk",
        },
      ],
    },
    ui: {
      units: "Birimler",
      metric: "Metrik",
      imperial: "İmparatorluk",
      goal: "Hedef",
      cut: "Yağ yak",
      maintain: "Koru",
      bulk: "Kas kazan",
      sex: "Cinsiyet",
      female: "Kadın",
      male: "Erkek",
      age: "Yaş",
      weightKg: "Kilo (kg)",
      weightLb: "Kilo (lb)",
      heightCm: "Boy (cm)",
      heightIn: "Boy (inç)",
      activity: "Aktivite",
      kcalDay: "kalori/gün",
      protein: "Protein",
      fat: "Yağ",
      carbs: "Karbonhidrat",
      proteinCut: "Vücut ağırlığının kilogramı başına {perKg} g: yağ yakarken kası korumak için aralığın üst ucu.",
      proteinMaintain: "Vücut ağırlığının kilogramı başına {perKg} g: antrenman yapanların ihtiyaç duyduğu aralığın ortası.",
      proteinBulk: "Vücut ağırlığının kilogramı başına {perKg} g: kas kazanmaya yeter, fazla kaloriler karbonhidrattan gelir.",
      fatWhy: "Kalorilerinin dörtte biri ve hormonlar için asla kilogram başına 0,6 g'ın altında değil.",
      carbsWhy: "Kalorilerinin geri kalanı, zor setlere enerji vermek için.",
      kcalFloor: "Bazal metabolizman olan {bmr}: daha büyük bir açık bunun altına düşerdi ve bu kasa mal olur.",
      kcalCut: "{tdee} olan TDEE'nin 500 altı: haftada yaklaşık {pace} eksi.",
      kcalMaintain: "TDEE'n: normal bir günde yaktığın miktar.",
      kcalBulk: "{tdee} olan TDEE'nin 250 üstü: haftada yaklaşık {pace} artı, çoğu kas.",
      meals: "Proteini {meals} öğüne böl; 30–40 g'lık porsiyonlarda daha iyi kullanılır.",
    },
  },
  "wilks-calculator": {
    page: {
      title: "Wilks hesaplayıcı, IPF GL ve DOTS puanlarıyla",
      description:
        "Squat, bench press ve deadlift toplamını vücut ağırlığına göre Wilks formülü, IPF GL puanı (klasik ya da ekipmanlı) ve DOTS ile puanla; kg ya da lb olarak.",
      name: "Wilks hesaplayıcı",
      intro:
        "Powerlifting toplamın vücut ağırlığına göre üç şekilde puanlanır: Wilks, IPF GL ve DOTS. Böylece her boyuttaki sporcuyu karşılaştırabilir ve bir sonraki seviyeye ne kadar kaldığını görebilirsin.",
      sticky: "Güç puanın, her zaman güncel",
      mid: {
        title: "Kaydettiğin her setle üç puan birden",
        body: "{app} antrenmanından en iyi squat, bench press ve deadlift değerlerini tahmin eder; Wilks, IPF GL ve DOTS puanlarını ve en çok geride kalan hareketi güncel tutar.",
        button: "Ücretsiz başla",
      },
      end: {
        title: "Daha büyük bir toplam inşa et",
        body: "{app} her antrenmanı yedekte kalan tekrarla planlar, yorgunluk biriktiğinde deload yapar ve hak ettiğinde her hareketi artırır.",
      },
      faq: [
        [
          "Wilks puanı nedir?",
          "Powerlifting toplamlarını farklı vücut ağırlıkları arasında karşılaştıran bir sayı. Toplamın, Robert Wilks'in yayımladığı bir formülden gelen bir katsayıyla çarpılır; böylece hafif ve ağır bir sporcu birlikte sıralanabilir. Onlarca yıl standart oldu ve hâlâ çok kullanılıyor.",
        ],
        [
          "IPF GL puanı nedir?",
          "Uluslararası Powerlifting Federasyonu'nun 2020'den beri kullandığı kendi formülü; bazen Goodlift puanı da denir. Klasik (ekipmansız) ve ekipmanlı için, ayrıca yalnızca bench press için ayrı versiyonları var. Yaklaşık 100 puan dünya seviyesinde bir toplamdır.",
        ],
        [
          "Hangi puanı kullanmalıyım?",
          "Yarışıyorsan federasyonunun kullandığını. Kendi ilerlemeni takip etmek için DOTS ve IPF GL, son yarışma sonuçlarıyla ayarlanmış en yeni formüllerdir. Bir puanı yalnızca aynı formülle karşılaştır.",
        ],
        [
          "İyi bir Wilks puanı nedir?",
          "Kabaca erkeklerde yaklaşık 300 sağlam bir orta seviye toplam, 400 ileri, 450 ve üstü elit sayılır; kadınların puanları da aynı ölçekte. Bunlar resmi seviyeler değil, kaba rehberlerdir.",
        ],
      ],
      more: {
        heading: "Puanlar nasıl hesaplanır",
        paragraphs: [
          "Wilks, 500'ü kilogram cinsinden vücut ağırlığının beşinci dereceden bir polinomuna böler (erkekler ve kadınlar için farklı katsayılarla) ve toplamını sonuçla çarpar. IPF GL, 100'ü A − B·e^(−C·vücut ağırlığı) değerine böler; A, B ve C, IPF'nin her cinsiyet, ekipman ve branş için yayımladığı katsayılardır. DOTS dördüncü dereceden bir polinom kullanır. Pound değerleri önce kilograma çevrilir. Katsayılar, açık bir powerlifting sonuçları projesiyle doğrulanmıştır.",
        ],
      },
      reading: [
        {
          href: "/tr/tools/dots-calculator/",
          label: "DOTS hesaplayıcı",
        },
        {
          href: "/tr/tools/one-rep-max-calculator/",
          label: "1RM hesaplayıcı",
        },
        {
          href: "/blog/how-to-increase-your-squat/",
          label: "squat'ını nasıl artırırsın",
        },
      ],
    },
    ui: {
      units: "Birimler",
      formula: "Formül",
      men: "Erkek formülü",
      women: "Kadın formülü",
      gear: "Ekipman",
      classic: "Klasik (ekipmansız)",
      equipped: "Ekipmanlı",
      bw: "Vücut ağırlığı ({unit})",
      squat: "Squat",
      bench: "Bench press",
      deadlift: "Deadlift",
      liftLabel: "{lift} ({unit})",
      total: "Toplam {total} {unit}",
      level: "DOTS seviyesi: {level}.",
      next: "{level} seviyesine (DOTS {score}) ulaşmak için toplamına yaklaşık {weight} {unit} ekle.",
      elite: "Bu elit bir toplam.",
      note: "Wilks ve DOTS ekipmana göre değişmez. IPF GL'nin klasik ve ekipmanlı için ayrı formülleri var, kendi kategorine uyanı seç.",
      levels: {
        beginner: "Başlangıç",
        novice: "Acemi",
        intermediate: "Orta",
        advanced: "İleri",
        elite: "Elit",
      },
    },
  },
  "dots-calculator": {
    page: {
      title: "DOTS hesaplayıcı: powerlifting toplamını puanla",
      description:
        "Squat, bench press, deadlift ve vücut ağırlığınla DOTS puanını kg ya da lb olarak hesapla; her boyuttaki sporcuyu karşılaştır.",
      name: "DOTS hesaplayıcı",
      intro:
        "Squat, bench press ve deadlift toplamın vücut ağırlığına göre puanlanır; böylece hafif ve ağır bir sporcu, boyuna göre kimin daha güçlü olduğunu görebilir.",
      sticky: "DOTS puanın, her zaman güncel",
      mid: {
        title: "Her setle DOTS puanın",
        body: "{app} kaydettiğin setlerden en iyi squat, bench press ve deadlift değerlerini tahmin eder ve DOTS puanını güncel tutar; maksimum deneme gününe gerek yok.",
        button: "Ücretsiz başla",
      },
      end: {
        title: "Daha büyük bir toplam inşa et",
        body: "{app} antrenmanını yedekte kalan tekrar hedefleri ve deload'larla bloklar halinde planlar ve hak ettiğinde her hareketi artırır.",
      },
      faq: [
        [
          "DOTS puanı nedir?",
          "Powerlifting toplamlarını farklı vücut ağırlıkları arasında karşılaştırmanın bir yolu. Toplamın, kilona bağlı bir katsayıyla çarpılır; böylece 60 kg ve 110 kg'lık iki kişi aynı ölçekte sıralanabilir. Birçok federasyon bunu kullanır.",
        ],
        [
          "İyi bir DOTS puanı nedir?",
          "Kabaca: 200 acemi, 300 orta, 400 ileri, 500 ve üstü elit bir toplamdır. Bunlar yaygın kullanılan seviyelerdir, resmi bir ölçek değil.",
        ],
        [
          "DOTS mu, Wilks mi?",
          "DOTS, eski Wilks formülünün daha adil bir alternatifi olarak 2019'da, daha büyük bir güncel yarışma sonuçları setiyle yayımlandı. Puanlar birbirinin yerine geçmez; DOTS'u DOTS ile karşılaştır.",
        ],
        [
          "Yarışma toplamı yerine tahmini maksimumları kullanabilir miyim?",
          "Kendi ilerlemeni takip etmek için evet. Resmi sıralamalar, federasyon kurallarıyla yarışmada yapılan kaldırışları kullanır.",
        ],
      ],
      more: {
        heading: "DOTS nasıl hesaplanır",
        paragraphs: [
          "DOTS, 500'ü kilogram cinsinden vücut ağırlığının dördüncü dereceden bir polinomuna böler (erkekler ve kadınlar için farklı katsayılarla) ve toplamını sonuçla çarpar. Vücut ağırlığı erkeklerde 40–210 kg, kadınlarda 40–150 kg ile sınırlanır. Katsayılar yayımlanmış olanlardır ve açık bir powerlifting sonuçları projesiyle doğrulanmıştır. Pound değerleri önce kilograma çevrilir.",
        ],
      },
      reading: [
        {
          href: "/tr/tools/one-rep-max-calculator/",
          label: "1RM hesaplayıcı",
        },
        {
          href: "/blog/how-to-increase-your-squat/",
          label: "squat'ını nasıl artırırsın",
        },
        {
          href: "/blog/how-to-increase-your-deadlift/",
          label: "deadlift'ini nasıl artırırsın",
        },
      ],
    },
    ui: {
      unitsSex: "Birimler ve cinsiyet",
      men: "Erkek formülü",
      women: "Kadın formülü",
      bw: "Vücut ağırlığı ({unit})",
      squat: "Squat",
      bench: "Bench press",
      deadlift: "Deadlift",
      liftLabel: "{lift} ({unit})",
      total: "Toplam {total} {unit}",
      note: "Yaklaşık 200 acemi, 300 orta, 400 ileri, 500 ve üstü elit bir toplamdır. Bunlar kaba seviyelerdir, resmi bir ölçek değil.",
      levels: {
        beginner: "Başlangıç",
        novice: "Acemi",
        intermediate: "Orta",
        advanced: "İleri",
        elite: "Elit",
      },
    },
  },
};
