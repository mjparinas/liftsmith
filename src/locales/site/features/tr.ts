import type { FeaturesText } from "./types";

// The features page in Turkish (sen). English is src/content/features.ts plus en.ts; keep the same ids and {placeholders}.

export const tr: FeaturesText = {
  chrome: {
    title: "{name} özellikleri ve uyumlu olduğu uygulamalar",
    description:
      "{name} uygulamasının tüm özellikleri, hangilerinin ücretsiz olduğu, en yenileri ve Android, iPhone ve web'de uyumlu olduğu saat, sağlık uygulaması, tartı ve servislerin tablosu.",
    crumb: "Özellikler",
    h1: "{name} uygulamasının tüm özellikleri",
    intro:
      "{count} özelliğin tamamı: hangileri ücretsiz, ne neyle çalışıyor ve neler yeni. Çoğu ücretsiz; Pro'nun neler kattığını görmek için {pricing} sayfasına bak.",
    pricing: "fiyatlar",
    onThisPage: "Bu sayfada",
    newestNav: "En yeniler",
    worksWithNav: "Uyumlu olanlar",
    newestH: "En yeni özellikler",
    newestIntro: "Son eklenenler, kategoriye göre. Düzeltmeler dahil her değişiklik {whatsNew} sayfasında.",
    whatsNew: "Yenilikler",
    midTitle: "Kendin gör",
    midBody: "Ücretsiz, hesap gerekmez. İlk antrenmanın bir dakikadan kısa sürede planlanır.",
    midButton: "Ücretsiz başla",
    worksH: "{name} neyle çalışır",
    worksIntro:
      "Uygulamalar, saatler ve cihazlar ile her birinin nerede çalıştığı. “Sağlık üzerinden”, {name} uygulamasına Android'de Health Connect, iPhone'da Apple Sağlık üzerinden ulaştığı anlamına gelir. “Chrome”, Web Bluetooth desteği olan Chrome'daki web uygulaması demektir.",
    tableLabel: "Uyumluluk tablosu",
    cols: {
      connection: "Bağlantı",
      does: "Ne yapar",
      android: "Android",
      iphone: "iPhone",
      web: "Web",
      plan: "Plan",
    },
    footnote:
      "“Yakında”, hazır olduğu ve mağaza sayfasını beklediği anlamına gelir. “İnceleniyor”, üzerinde çalıştığımız ama diğer şirketin onayına bağlı olduğu için henüz söz veremediğimiz anlamına gelir. Fitness servisleri ücretsiz bir {name} hesabıyla bağlanır. Laboratuvar, Ayarlar › Laboratuvar'dan açtığın Pro deneyleridir. Ürün adları sahiplerinin ticari markalarıdır.",
    endTitle: "Ücretsiz başla, hesap gerekmez",
    endBody: "İlk antrenmanın bir dakikadan kısa sürede planlanır. Asla reklam yok.",
  },
  tiers: {
    free: "Ücretsiz",
    pro: "Pro",
    both: "Ücretsiz + Pro",
    lab: "Laboratuvar (Pro)",
  },
  where: {
    all: "Android, iPhone ve web",
    phones: "Android ve iPhone uygulamaları",
  },
  support: {
    yes: "Evet",
    no: "Hayır",
    soon: "Yakında",
    investigating: "İnceleniyor",
    chrome: "Chrome",
    health: "Sağlık üzerinden",
  },
  groups: {
    plan: {
      title: "Sana uyum sağlayan bir plan",
      intro: "Bugünün antrenmanı salonundan, toparlanmandan ve antrenman bloğundan oluşturulur ve her sayı nedenini söyler.",
    },
    workout: {
      title: "Antrenman",
      intro: "Tek dokunuş, seti plana göre kaydeder. Geri kalan her şey dinlenmeni bekler.",
    },
    progress: {
      title: "İlerleme ve koçluk",
      intro: "Önce sırada ne yapacağın gelir. Sayılar, onlara göre harekete geçebileceğin zaman görünür.",
    },
    body: {
      title: "Vücut ve sağlık",
      intro: "Tartılar, vücut yağı ve sağlık ölçümleri mümkün olduğunda kendiliğinden gelir ve tavsiyeye dönüşür.",
    },
    programs: {
      title: "Programlar, rutinler ve egzersizler",
      intro: "Klasik bir programı takip et, kendi rutinlerini oluştur ya da planı uygulamaya bırak. Hepsi tek bir kütüphaneden.",
    },
    gyms: {
      title: "Salonlar ve ekipman",
      intro: "Her plan gerçekten sahip olduğun ekipmanla başlar.",
    },
    friends: {
      title: "Arkadaşlar ve paylaşım",
      intro: "Bir izleyici kitlesi için değil, insanlarla birlikte antrenman yap. Arkadaşlar ücretsiz.",
    },
    coaches: {
      title: "Koçlar için",
      intro: "Birinin danışanı olmak herkes için ücretsiz.",
    },
    fun: {
      title: "Ödüller",
      intro: "Hiçbir setin önüne geçmeyen biraz eğlence.",
    },
    phone: {
      title: "Telefonunda ve bileğinde",
      intro: "Liftsmith her telefonun en iyi yaptığı şeyi kullanır.",
    },
    data: {
      title: "Verilerin",
      intro: "Çevrimdışı çalışır, hesap gerekmez ve verilerin sende kalır.",
    },
    access: {
      title: "Görünüm, kullanım ve diller",
      intro: "Her sporcu için rahat: salonda tek elle ya da evde büyük ekranda.",
    },
    labs: {
      title: "Laboratuvar",
      intro: "Pro kullanıcılarının Ayarlar › Laboratuvar'dan açabildiği deneyler. Değişebilir ya da kaldırılabilirler.",
    },
  },
  features: {
    adaptive: {
      name: "Her gün uyarlanan antrenmanlar",
      body: "Salonunda yapılabilen ve kaslarının hazır olduğu egzersizleri seçer, sonra her ağırlığı ve tekrarı son antrenmanlarına göre belirler.",
      proPart: "Ücretsiz kullanıcılar ücretsiz programlarının yanında haftada bir uyarlanmış antrenman alır; Pro her günü planlar.",
    },
    "auto-supersets": {
      name: "Otomatik süper setler",
      body: "Süper setleri aç, uyarlanabilir plan aynı kasları çalıştırmayan egzersizleri, örneğin bir press ve bir row'u eşleştirsin ve her turdan sonra daha kısa dinlenme versin, böylece süreye daha fazlası sığsın. Ağır squat ve deadlift'ler tek başına kalır, ısınma setlerini de kapatabilirsin.",
    },
    "pick-weights": {
      name: "Sevdiğin hareketleri öğrenir",
      body: "Popüler hareketler en sık seçilir. Bir egzersizi yıldızla, çok daha sık gelsin; birini değiştirip çıkar, daha az gelsin ve bu etki birkaç ayda kaybolsun.",
    },
    splits: {
      name: "Uyarlanan bölünmüş programlar",
      body: "Push, pull, legs ya da üst ve alt vücut; yine de her gün toparlanmana göre ayarlanır.",
    },
    readiness: {
      name: "Günün kararı",
      body: "Toparlanmana, kaçırdığın tekrarlara ve son setlerinin ne kadar zor geldiğine göre Yüklen, Plana göre ya da Hafif tut. Her zaman kendin değiştirebilirsin.",
    },
    "health-readiness": {
      name: "Uyku ve HRV kararı etkiler",
      body: "Telefonunun sağlık uygulamasından gelen uyku, kalp atış hızı değişkenliği, dinlenik nabız ve solunum hızı günün kararını yukarı ya da aşağı çeker.",
    },
    blocks: {
      name: "Antrenman blokları ve deload",
      body: "Yedekte kalan tekrar hedefiyle dört haftalık bloklar, daha hafif bir haftayla biter; böylece tükenmeden ilerlemeye devam edersin.",
    },
    why: {
      name: "Her öneri nedenini söyler",
      body: "Her egzersiz, set sayısı, tekrar hedefi ve ağırlık kısa bir gerekçeyle gelir; ekranda görünür, asla bir dokunuşun arkasına saklanmaz.",
    },
    "short-on-time": {
      name: "Az vakit",
      body: "Antrenmana daha az vaktin olduğunu söyle, en az önemli kısmı kırpsın.",
      proPart: "Başkasının kullandığı bir sehpa ya da rack'e göre planı ayarlamak Pro'dadır.",
    },
    injury: {
      name: "Sakatlık modu",
      body: "Neren ağrıyor söyle; ağrıyı artıracak hareketleri çıkarır, riskli hareketler için uyarır ve 0–10 arası ağrı puanını zaman içinde takip eder.",
    },
    "rehab-done": {
      name: "Fizyoterapistinin rehabilitasyonu, hallolmuş",
      body: "Fizyoterapistinden gelen program Bugün ekranında seni bekler, tek dokunuşla kaydedilir ve ilgili sakatlığı kaydeder. İstedikleri haftalık sıklığa uyar, dinlenme günlerinde de görünür ve yalnızca o sakatlık için ağrıyı sorar.",
      note: "Rehabilitasyon hatırlatıcıları ve yeni program bildirimi Android ve iPhone'da.",
    },
    cycle: {
      name: "Döngüye duyarlı hazırlık",
      body: "İstersen döngünü kaydet, günün kararı bunu da hesaba katsın.",
    },
    pregnancy: {
      name: "Hamilelik ve doğum sonrası modu",
      body: "Hamile olduğunu ya da bebeğini doğurduğunu söyle, her antrenman haftana uysun: daha hafif yükler, sınıra kadar set yok, hamileliğin sonlarında sırtüstü hareket yok ve doğumdan sonra yaklaşık 16 haftalık kademeli dönüş.",
    },
    "goal-planner": {
      name: "Hedef planlayıcı",
      body: "Bir hareket ve hedef seç; gerçekçi bir tarih ve oraya giden yolu hesaplasın.",
    },
    logger: {
      name: "Tek dokunuşla set kaydı",
      body: "Sıradaki set her zaman doldurulmuş olur. Basılı tutunca tekrarlayan butonlar ağırlığı ve tekrarı değiştirir; yazmak sadece yedek seçenek.",
    },
    "rest-timer": {
      name: "Kilit ekranında dinlenme sayacı",
      body: "Her setten sonra kendiliğinden başlar ve kilit ekranında geri sayar: sıradaki set, plakalar, nabız ve uygulama kapalıyken bile çalışan Seti kaydet ve +30 s butonlarıyla. Bitişe 10 saniye kala hafif bir titreşim, hazırlanman için zaman tanır; telefonda da saatinde de.",
      note: "Android: kalıcı bir bildirim, Android 16'da Live Update ve Samsung'un Now Bar'ı. iPhone: kilit ekranında ve Dynamic Island'da Live Activity. Web: sayfa açıkken bir bildirim.",
    },
    plates: {
      name: "Plaka hesabı",
      body: "Her tarafa hangi plakaların takılacağını, salonundaki plakalara göre hesaplayıp gösterir; her boyut kendi renginde.",
    },
    warmups: {
      name: "Isınma setleri",
      body: "Her ağır hareket için hesaplanmış kademeli setler; böylece çalışma ağırlığına hazır gelirsin.",
    },
    demos: {
      name: "3D egzersiz gösterimleri",
      body: "Her egzersizde, hareketi kendi ekipmanıyla gösteren 3D bir figür, kurulum adımları ve ipuçları var.",
    },
    "form-mistakes": {
      name: "Sık yapılan hatalar ve düzeltmeleri",
      body: "Her egzersiz ve esneme, en sık yapılan iki üç form hatasını 3D figürün yanında, düzeltmesi ve neden önemli olduğuyla gösterir; dinlenme sayacı da bir sonraki set için birini gösterir. Çevrimdışı çalışır.",
    },
    "set-types": {
      name: "Drop set ve rest-pause",
      body: "Setlerin arasına bir drop set ya da rest-pause seti ekle.",
    },
    "timed-sets": {
      name: "Tutuşlar, taşımalar ve kardiyo için set sayacı",
      body: "Plank, taşıma, asılma ve kardiyo gibi süreli egzersizler set sayacı alır; kilit ekranında ve saatlerde de.",
    },
    "each-side": {
      name: "Her taraf ve el başına",
      body: "Tek taraflı yapılan egzersizler bunu belirtir, dambıl ağırlıkları el başına gösterilir.",
    },
    swaps: {
      name: "Egzersiz değiştirme",
      body: "Herhangi bir egzersizi, salonundaki ekipmanla aynı kasları çalıştıran bir başkasıyla değiştir.",
    },
    "heart-rate": {
      name: "Canlı nabız",
      body: "Bluetooth nabız kuşağını ya da saatini bağla, her sette ve dinlenmede nabzını gör.",
      note: "Web: yalnızca Chrome.",
    },
    breathing: {
      name: "Dinlenmede kutu nefesi",
      body: "Dinlenme ekranında hazır ayarlı ya da kendi düzenine göre bir nefes rehberi.",
    },
    "voice-coach": {
      name: "Sesli koç",
      body: "Antrenman sırasında, örneğin dinlenme bittiğinde sesli söyler; telefona bakmana gerek kalmaz.",
      note: "Android dinlenmenin bittiğini ekran kilitliyken de söyler; iPhone ve web uygulama açıkken.",
    },
    stretching: {
      name: "Esneme",
      body: "3D gösterimli 48 esneme: isteğe bağlı bir ısınma öncesinde, soğuma sonrasında ya da herhangi bir gün esneme rutini. Her esneme ve her taraf öncesinde pozisyon almak için birkaç saniye var ve ekran açık kalır.",
    },
    "workout-parts": {
      name: "Bölümlü antrenmanlar",
      body: "Bir antrenman ısınmayı, ağırlık kısmını ve soğumayı sırayla yürütebilir, aralarında Atla seçeneğiyle. Kilit ekranı ve saatin hangi bölümde olduğunu gösterir, Geçmiş her bölümü gösterir ve 10 dakika ya da daha uzun esneme günleri serini korur. Rutinler kendi ısınma ve soğumasını taşıyabilir; paylaşım linklerinde ve koçundan gelenlerde de. Koç notları her bölümü okur: rehabilitasyondan sonra azalan ya da artan ağrı, soğuma boyunca yüksek kalan nabız. Fizyoterapistinin rehabilitasyonu, zamanı geldiği günlerde aynı antrenmanda ağırlıkların yanında yapılabilir; kardiyo da ağırlıkların ardından gelebilir, makine ve dakikalar dokunarak seçilir.",
    },
    "workout-length": {
      name: "Antrenman süresi her bölümü kapsar",
      body: "Bugün ekranındaki süre kaydırıcısı antrenmanın tamamını belirler. Isınma, kardiyo, rehabilitasyon ya da soğuma dakikalarını ağırlık kısmından alır ve kaydırıcının altındaki ince bir çubuk sürenin nereye gittiğini gösterir. Ağırlık kısmı en az 15 dakika kalır: önce kardiyo kısalır ve nedenini söyleyen bir satır çıkar. Kardiyo ve esneme gününde ağırlıkları kapat, süre kardiyoya kalsın.",
    },
    "now-playing": {
      name: "Müzik kontrolleri",
      body: "Bugün ekranından ve antrenman sırasında müziğini oynat, duraklat ve atla; şarkı ve onu çalan uygulama görünür. Ayarlar'dan kapatabilirsin.",
      note: "iPhone: yalnızca Apple Music, çünkü Apple uygulamaların başka müzik uygulamalarını kontrol etmesine izin vermiyor.",
    },
    notes: {
      name: "Koç notları",
      body: "Biriken yorgunluğu, takılan bir hareketi, seti eksik kalan bir kası, tehlikedeki haftalık hedefi ya da yavaşça artan vücut yağını fark eder; her birinde yapılacak tek bir şey var, çoğu zaman tek dokunuş.",
    },
    plateau: {
      name: "Plato dedektifi",
      body: "Bir hareket takıldığında olası nedeni ve tek dokunuşluk üç haftalık bir çözüm sunar, sonra işe yarayıp yaramadığını söyler.",
    },
    "recovery-map": {
      name: "Toparlanma haritası",
      body: "Kasların 3D bir figürde ne kadar toparlandıklarına göre parlar. Birine dokun, bugün için ne anlama geldiğini gör.",
    },
    "advanced-stats": {
      name: "Gelişmiş istatistikler",
      body: "Kas başına haftalık setler ve hedefleri, tahmini 1RM trend çizgileri ve her hareketin hangi yöne gittiği.",
    },
    bests: {
      name: "Kişisel rekorlar ve geçmiş",
      body: "Her rekor, tahmini 1RM, güç puanı ve geçmiş antrenman; geçmişte sınır yok.",
    },
    "calendar-history": {
      name: "Antrenman takvimi",
      body: "İlerleme ekranında geçmiş antrenmanların aylık takvimi, her gün adıyla.",
    },
    "edit-history": {
      name: "Geçmiş antrenmanları düzenle ve tekrarla",
      body: "Bir seti düzelt, not ekle, antrenmana ad ver ya da tekrarla; her hareketin geçmişiyle birlikte kendi sayfası var.",
    },
    "exercise-stats": {
      name: "Her egzersiz için istatistik",
      body: "Kütüphanede herhangi bir egzersize dokun: setlerin, kaldırdığın toplam ağırlık, tahmini maksimumun ve yayımlanmış güç standartlarına göre aynı kilo, yaş ve cinsiyetteki antrenmanlı sporcularla karşılaştırman.",
      proPart: "Bir haftadan bir yıla kadar grafikler Pro'nun gelişmiş istatistiklerinin parçası.",
    },
    "log-past": {
      name: "Geçmiş bir antrenmanı kaydet",
      body: "Telefonunu mu unuttun? Antrenmanı sonradan kaydet, diğerleri gibi sayılsın.",
    },
    recap: {
      name: "Aylık özet",
      body: "Ayına kısa bir bakış, paylaşmaya hazır.",
    },
    anniversary: {
      name: "Ağırlık yıldönümün",
      body: "Her yıl ilk antrenmanının olduğu gün, Bugün ekranı ilk günü bugünün yanına koyar: antrenmanlar, setler, toplam kaldırılan ağırlık ve en çok gelişen hareket, paylaşılacak bir kartla. Bir hafta boyunca kalır.",
    },
    body: {
      name: "Tartı, vücut yağı ve fotoğraflar",
      body: "Kilonu ve vücut yağını kaydet ya da tartından telefonunun sağlık uygulaması üzerinden gelsin; ilerleme fotoğraflarını telefonunda sakla.",
    },
    "photo-compare": {
      name: "Hizalanan ilerleme fotoğrafları",
      body: "Kamera, hizalanman için son fotoğrafını soluk bir çizgi olarak gösterir; geri çekilmen için zamanlayıcı da var. İstediğin iki tarihi kaydırıcıyla ya da yan yana, o gün kaç kilo olduğunla birlikte karşılaştır. Fotoğraflar telefonunda kalır; bir yedek dosyası onları yenisine taşıyabilir.",
    },
    measurements: {
      name: "Mezura ölçüleri",
      body: "Santimetre ya da inç cinsinden dokuz bölge. Vücut yağı ölçümü yoksa büyüyen ya da küçülen bel bir koç notuna dönüşür.",
    },
    "body-figure": {
      name: "Sana benzeyen 3D figür",
      body: "Aç, Sağlık ekranındaki, toparlanma haritasındaki ve egzersiz gösterimlerindeki figürler boyuna, kilona, vücut yağına ve mezura ölçülerine göre senin yapını alsın.",
    },
    "health-twin": {
      name: "Sağlık ikizi ve fitness yaşı",
      body: "Uyku, HRV, dinlenik nabız, adımlar, solunum hızı ve VO₂ max tek yerde; trendinle ve VO₂ max'ından hesaplanan bir fitness yaşıyla.",
      note: "Sağlık ölçümleri Android'de Health Connect'ten, iPhone'da Apple Sağlık'tan gelir. Web uygulaması tartıları, vücut yağını, BMI ve kalorileri gösterir.",
    },
    "fitness-tests": {
      name: "Fitness testleri",
      body: "Barda asılma, tek ayak üstünde durma ve 30 saniyelik sandalyeden kalkma; her biri sayaç, tipik aralık ve neyin işe yaradığıyla.",
    },
    food: {
      name: "Beslenme uygulamandan koç notları",
      body: "Bir beslenme uygulamasında kaydettiğin kalori, protein, karbonhidrat ve yağ, telefonunun sağlık uygulaması üzerinden Liftsmith'e ulaşır ve “üç gündür protein eksik” gibi notlara dönüşür; hedefine göre tek bir hedef setiyle değerlendirilir. Sadece protein kaydetmek de sayılır. Uygulamada yemek kaydı yok.",
    },
    "measured-maintenance": {
      name: "Yediklerinden ölçülen koruma kalorisi",
      body: "İki haftalık yemek ve tartı kaydı gerçek günlük kalorini ölçer; bu da Makrolar'ı, TDEE'yi ve beslenme notlarını yönlendirir. Vücut ekranındaki Beslenme kartı haftanı hedeflerinle karşılaştırır.",
      note: "18 yaş altındakiler yalnızca protein tavsiyesi alır: yağ yakma hedefi ve kalori notu yok.",
    },
    "your-stats": {
      name: "Bilgilerin",
      body: "Her aracın okuduğu cinsiyet, yaş ve boy için tek yer; iPhone'da Apple Sağlık'tan doldurulur.",
    },
    "fixed-programs": {
      name: "Klasik programlar",
      body: "Klasik 5×5, başlangıç 3×5, 5×5 artı kol, kademeli 5×5, katmanlı ilerleme, training max dalgaları, vücut ağırlığı becerileri ve dambılla tüm vücut. Ücretsiz program salonuna uyar.",
    },
    routines: {
      name: "Kendi rutinlerin",
      body: "Egzersiz tarayıcısından sınırsız sayıda rutin oluştur ve link olarak paylaş.",
    },
    "routine-library": {
      name: "Rutin kütüphanesi",
      body: "Başkalarının yayımladığı rutinleri hedefe, kelimelere ve salonundaki ekipmana göre ara, tek dokunuşla kaydet ve yıldızla puanla. Kendi rutinini düzenleyicisinden, adınla ya da adsız yayımla; web sitesinde kendi sayfası olur. Yalnızca hareketler ve setler paylaşılır, ağırlıkların ya da notların asla.",
      note: "Yayımlamak için hesap ve 18 yaş gerekir. Herkes göz atabilir.",
    },
    library: {
      name: "1.000 egzersiz",
      body: "Serbest ağırlık, vücut ağırlığı, makineler, lastik bantlar, kettlebell ve kardiyo; arama, kas filtreleri ve bu salon filtresiyle. Kardiyo süre ve mesafe kaydeder.",
    },
    remix: {
      name: "Remiks linkleri",
      body: "Bir antrenmanı arkadaşına, kendisinin de yapabileceği bir link olarak gönder.",
    },
    gyms: {
      name: "Salonların ve ekipmanları",
      body: "Her salonu bir kez kur: barlar, plakalar, dambıllar ve kettlebell'ler gerçekte nasılsa öyle; makineler ve ayarları.",
    },
    "gym-location": {
      name: "Konuma göre salon",
      body: "Vardığında doğru salonu seçer.",
    },
    "gym-share": {
      name: "Salon kurulumunu paylaş",
      body: "Salonunun ekipmanını link olarak gönder; antrenman partnerin aynı ekipmanla başlasın.",
    },
    "gym-finder": {
      name: "Salon bulucu ve salon sayfaları",
      body: "Yakınındaki salonları büyük bir haritada, her biri üstünde yarı saydam bir kartla bul; önce resmi olanlar, her biri kendi sayfasıyla: ekipman, çalışma saatleri, harita ve üyeler. Sahipler salonlarını sahiplenip logo ve fotoğraf ekleyebilir. Bir salon eksik mi? Ekle. Sahipler kaç kişinin salonu eklediğini ve afişi taradığını, sırada ne yapacaklarını görür. Resmi salonlar haftalık sıralamalı bir kulüp yürütebilir. Bir sayfada yanlış bir şey mi var? Bildir, ekibimiz düzeltsin.",
    },
    "gym-amenities": {
      name: "Salon sayfalarında olanaklar ve fiyatlar",
      body: "Salon sahipleri ekipman dışında neler olduğunu (duş, otopark, 7/24 erişim, kadınlara özel alan ve daha fazlası) ve günlük giriş, haftalık giriş ya da üyeliğin ne kadar tuttuğunu listeler.",
    },
    "gym-news": {
      name: "Salonundan duyurular",
      body: "Resmi salonlar tatil saatlerini, yeni ekipmanı ya da ders değişikliklerini sayfalarında paylaşır, salon kulübünün üyeleri bildirim alır.",
    },
    "gym-problems": {
      name: "Bozuk ekipmanı bildir",
      body: "Salonuna bir makinenin bozuk ya da eksik olduğunu söyle. Orada antrenman yapan herkes buna göre ayarlanmış bir plan alır, sahip de bunu Düzeltildi butonuyla görür.",
    },
    "gym-trainers": {
      name: "Salon sayfalarında antrenörler",
      body: "Koçlar danışan çalıştırdıkları salonlarda kendilerini listeler; kendileri hakkında bir satır ve onlarla antrenmana başlamak için bir butonla. Resmi salonlarda önce sahibin onayı gerekir.",
    },
    "gym-staff": {
      name: "Salonlar için personel hesapları",
      body: "Resmi bir salonun sahibi, yöneticileri ve resepsiyon personelini tek kullanımlık bir linkle davet eder. Her biri kendi hesabıyla salonun sayfasını, duyurularını ve arıza bildirimlerini güncel tutar.",
    },
    "gym-classes": {
      name: "Salon sayfalarında ders programı",
      body: "Resmî salonlar her hafta verdikleri dersleri eğitmen ve alanla birlikte paylaşır, dersin olmadığı günleri işaretler. Üyeler haftayı uygulamada ve webde salonun sayfasında görür, sıradaki dersi tek dokunuşla takvimine ekler.",
    },
    "gym-chains": {
      name: "Bir salon zincirinin tüm şubeleri",
      body: "Bir zincire ait salonlar zincirin logosunu gösterir ve tüm şubelerinin olduğu bir sayfaya bağlanır; uygulamada en yakınlar önce. Web sitesinde her zincirin kendi sayfası var.",
      note: "Zincirleri haritadaki marka bilgisinden ya da birkaç şehirdeki salonların paylaştığı bir addan tanırız. Sahiplenilmiş salonlar kendi logolarını korur.",
    },
    "gym-open-now": {
      name: "Salon bulucuda Şu an açık",
      body: "Yakındaki salonlar şu an açık olup olmadığını, ne zaman kapanıp yeniden açılacağını gösterir. Şu an açık'a bir dokunuş yalnızca hemen gidebileceğin salonları bırakır.",
      note: "Her salonun çalışma saatleri ve kendi saatinle hesaplanır, yakındaki salonlar için.",
    },
    "gym-starter": {
      name: "Salonların başlangıç programları",
      body: "Resmi salonlar uygulamadaki ve web'deki sayfalarında yeni üyelere bir program önerir, sporcular onu tek dokunuşla kaydeder. Liftsmith her sporcunun kendi ağırlıklarını doldurur.",
    },
    "buy-next": {
      name: "Sırada ne almalı",
      body: "Ev salonları için: en çok egzersizin önünü açacak tek ekipman.",
    },
    feed: {
      name: "Arkadaş akışı",
      body: "İnsanları takip et ve antrenmanlarını gör; beğeniler, yorumlar, yanıtlar ve @bahsetmelerle. Kendi antrenmanlarının her birini kimin göreceğini sen seç.",
    },
    cheers: {
      name: "Şu an antrenmanda olanlar ve tezahürat",
      body: "Şu anda kimin antrenman yaptığını gör ve antrenman ekranında yukarı süzülen bir tezahürat gönder.",
    },
    "check-in": {
      name: "Salonda check-in yap",
      body: "Bugün ekranında tek dokunuş, seçtiğin arkadaşlarına salonda olduğunu söyler. Onlar bir bildirim, kapatana kadar da uygulamada bir not alır.",
      note: "18 yaş ve üzeri için. Bildirimler Android ve iPhone'da; web uygulaması açıkken notu gösterir.",
    },
    challenges: {
      name: "Meydan okumalar, kulüpler ve sıralamalar",
      body: "Bir arkadaşına meydan oku, haftalık sıralaması olan bir kulübe ya da salon ekibine katıl ve herkesle aylık meydan okumaya gir.",
    },
    "club-chat": {
      name: "Kulüp sohbeti ve ekip antrenmanları",
      body: "Antrenmanlar arasında kulübünle konuş, birlikte çalışmak için bir saat ve yer paylaş, kimlerin geldiğini gör. Katılan herkes bir saat önce hatırlatma alır; sonra antrenmanını paylaşınca antrenman yapmış görünürsün ve birlikte çalıştığın arkadaşların etiketlenir.",
      note: "18 yaş ve üzeri içindir. Bildirimler Android ve iPhone'da; web uygulaması sohbet açıkken yeni mesajları gösterir.",
    },
    profiles: {
      name: "Herkese açık profiller",
      body: "En iyi kaldırışların ve antrenmanlarınla isteğe bağlı, herkese açık bir sayfa.",
    },
    "tagline-gym": {
      name: "Slogan ve ana salon",
      body: "Adının altına kısa bir satır ekle ve salon bulucudan ana salonunu seç; arkadaşların nerede antrenman yaptığını bilsin. Antrenmanlarını görenlere ve herkese açık sayfanda görünür.",
      note: "Ana salon 18 yaş ve üzeri için.",
    },
    safety: {
      name: "Engelle, sessize al ve şikâyet et",
      body: "Herkesi engelleyebilir ya da sessize alabilirsin; bir gönderiyi, yorumu ya da profili bir nedene tek dokunuşla şikâyet edebilirsin. Ekibimiz her şikâyeti inceler; uyarabilir, askıya alabilir ya da yasaklayabilir.",
    },
    "invite-friends": {
      name: "Arkadaşlarını davet et, Pro kazan",
      body: "Davet linkini Arkadaşlar'dan, antrenman sonundan ya da herhangi bir paylaşım kartından paylaş. Linkle katılan arkadaşın seni geri takip eder ve üç antrenman bitirdiğinde ikiniz de bir ay Pro kazanırsınız. Davetlerin bölümü her arkadaşının ne kadar yaklaştığını gösterir.",
      note: "Yılda en fazla 12 ay. 18 yaş altındakiler arkadaş davet edebilir ama ödül onlara sunulmaz.",
    },
    share: {
      name: "Paylaşım kartları ve linkleri",
      body: "Bir antrenmanı, yeni bir rekoru ya da bir dönüm noktasını görsel olarak ya da önizlemeli herkese açık bir linkle paylaş. Yeni rekor altın renginde parlar ve hemen dinlenme ekranından paylaşılabilir.",
    },
    "screenshot-share": {
      name: "Ekran görüntüsü alınca paylaşım kartları",
      body: "Ekran görüntüsü al, antrenman kartlarından oluşan bir sayfa açılsın: son ay, üç ay, altı ay, yıl ya da tüm zamanlar; toplamlar, setlerin nereye gittiği veya en iyi kaldırışların olarak. Aralarında kaydır, gözle ağırlıkları gizle ve davet bağlantın kartın üstünde basılı olarak paylaş. Aynı kartlar İlerleme'deki Antrenmanımı paylaş altında. Paylaştığın her bağlantı artık davetini taşıyor, bunu söyleyen bir bağlantıyla.",
      note: "Ekran görüntüleri bunu Android 14 ve sonrasında ve iPhone'da açar, kapatılabilir. Başka yerlerde İlerleme'den aç. 18 yaş altı, davet bağlantısı olmadan paylaşır.",
    },
    coaching: {
      name: "Danışan çalıştır",
      body: "Danışanlarını bağla, sonuçlarını gör ve onlara rutin ata; telefonda ya da geniş ekranda.",
    },
    "coach-chat": {
      name: "Sohbet, uyarılar ve vücut verileri",
      body: "Her danışanına mesaj at, antrenman yaptıklarında ya da bir hafta sessiz kaldıklarında bildirim al; paylaşmayı seçtiklerinde tartılarını, ölçülerini ve onlara benzeyen 3D figürü gör.",
      note: "Bildirimler Android ve iPhone'da. Web uygulaması açıkken yeni mesajları gösterir.",
    },
    physio: {
      name: "Fizyoterapistler ve rehabilitasyon uzmanları için",
      body: "Haftalık sıklıkla hafif rehabilitasyon programları ata, danışanların bunlara ne kadar uyduğunu gör; paylaşmayı seçtikleri ağrı puanlarını ve sakatlıkları egzersiz egzersiz izle, ağrı yükseldiğinde bildirim al.",
      note: "Liftsmith danışanların kaydettiklerini gösterir. Hiçbir şeyi teşhis etmez ya da tedavi etmez.",
    },
    "rehab-phases": {
      name: "Ağrıyla ilerleyen aşamalı rehabilitasyon protokolleri",
      body: "Her rehabilitasyon programının bölgeyi sakinleştirmekten tam kullanıma kadar üç aşaması var. Basit bir ağrı kuralı her egzersizden sonraki ve ertesi günkü puanları okur, danışanın sonraki aşamaya ne zaman hazır olduğunu ya da ne zaman geri dönmesi gerektiğini söyler; fizyoterapist de tek dokunuşla gönderir.",
      note: "Danışanlar ücretsiz kullanır. Liftsmith danışanların kaydettiklerini gösterir. Teşhis koymaz ve tedavi etmez.",
    },
    "coach-nutrition": {
      name: "Danışanlar için beslenme hedefleri",
      body: "Her danışanın günlük kalori, protein, karbonhidrat ve yağ hedefini belirle, istersen dinlenme günü için ayrı bir kalori sayısıyla; tek dokunuşla onların kendi sayılarından doldurulur. Koç notları haftalık beslenmelerini bunlara göre kontrol eder, paylaştıklarında nasıl beslendiklerini görürsün.",
    },
    "school-teams": {
      name: "Lise takımlarına ücretsiz",
      body: "Okul e-posta adresini doğrulayan lise koçları Pro'yu ücretsiz alır; takımlarındaki 13–18 yaş arası sporcular da öyle, haftalık takım sıralamasıyla. Vücut yağı ve herkese açık profiller 18 yaş altı için kapalı kalır.",
    },
    "team-session": {
      name: "Tek tablette takım seansları",
      body: "Lise koçu tüm takımın antrenmanını tek tabletten yönetir: her sporcu adına dokunup kendi setlerini kaydeder, ağırlık kaldığı yerden başlar ve pano kimin başlamadığını gösterir. Bitince her sporcunun setleri kendi hesabına kaydedilir. Çekim olmadan da çalışır.",
    },
    "coach-checkins": {
      name: "Check-in formları ve anketler",
      body: "Danışanlarına haftalık bir check-in, bir ön değerlendirme anketi ya da kendi formunu gönder; bir kez ya da her hafta. Birkaç dokunuşla yanıtlarlar; düşük bir puan ya da geç bir yanıt raporlarının en üstüne çıkar.",
    },
    "coach-checkin-trends": {
      name: "Ağırlık, fotoğraf ve gidişatla ilerleme kontrolleri",
      body: "Herhangi bir forma vücut ağırlığı ve fotoğraf soruları ekle, her hafta, 2 haftada veya 4 haftada bir gönder. Ağırlık danışanın son tartımından gelir, fotoğrafları yalnızca sen görürsün ve her cevabın gidişatı raporda görünür. 18 yaşından küçüklerden asla fotoğraf istenmez.",
    },
    "coach-form-videos": {
      name: "Videoda notlu form videoları",
      body: "Danışanların uygulamada bir set çekip sana gönderir. Yavaşlatarak izle, tam önemli anlara not iliştir; onlar da aynı notlara yanıt verir. Yalnızca ikiniz görürsünüz; 18 yaşından küçükler gönderemez.",
      note: "Video göndermek danışanlar için ücretsiz. Android, iPhone ve web.",
    },
    "coach-roles": {
      name: "Kişisel antrenörler ve koçlar için",
      body: "Birebir çalışan bir kişisel antrenör mü, grupları ve takımları yöneten bir koç mu olduğunu söyle. Danışanlar sana uygun unvanı görür, en çok kullandığın araçlar da öne gelir.",
    },
    "coach-booking": {
      name: "Seans rezervasyonu ve planlama",
      body: "Müsait olduğun saatleri bir kez ya da her hafta aç; danışanlar uygulamadan rezervasyon yapsın ya da danışanı kendin ekle. Programın aylık bir takvim: bir güne dokun, kimin rezervasyonu olduğunu ve neyin boş kaldığını gör. İki taraf da bildirim alır, ertesi günkü seans Bugün ekranında görünür ve tek dokunuşla takvime eklenir.",
    },
    "coach-payments": {
      name: "Stripe ile danışan ödemeleri",
      body: "Kendi Stripe hesabını bağla ve her danışanın ücretini seans başına ya da aylık belirle. Danışanlar Stripe'ın güvenli sayfasında öder, para doğrudan sana gelir; başarısız bir aylık ödeme raporlarının en üstünde görünür.",
    },
    "coach-pages": {
      name: "Her taraf için bir sayfa",
      body: "Danışanlar yalnızca koçlarını görür: tek dokunuşla mesaj atar, check-in'leri yanıtlar, seans ayırır ve neyi paylaşacağını seçer. Koçların her iş için bir sayfası var: danışanlar, mesajlar, program, check-in'ler ve ödemeler; web'de ve telefonlarda sekmeler halinde.",
      proPart: "Danışan olmak ücretsiz; danışan çalıştırmak Pro.",
    },
    "coach-sharing": {
      name: "Koçlarının neyi göreceğini danışanlar seçer",
      body: "Antrenmanlar her zaman paylaşılır. Nabız, antrenman notları, hazırlık ve toparlanma, vücut verileri, ağrı ve sakatlıklar ile döngü, danışanın her koç için ayrı açıp kapattığı birer anahtardır; onay ekranında ya da sonra istediği zaman. Fotoğraflar ve salonlar asla paylaşılmaz.",
      proPart: "Danışan olmak ücretsiz; danışan çalıştırmak Pro.",
    },
    "trainer-directory": {
      name: "Antrenör rehberinde yer al",
      body: "Salonunda antrenör, koç ya da fizyoterapist olarak kendini listele; o salonun sayfasında ve web sitesindeki o şehrin antrenör rehberinde, biyografin ve yeni danışanların seninle antrenmana başlaması için bir linkle görün. Yalnızca yetişkinler listelenir.",
    },
    "coach-chat-dock": {
      name: "Sohbet paneli, durumlar ve çıkartmalar",
      body: "Bilgisayarda koç sohbeti, bir mesajlaşma uygulaması gibi sağ altta bir panelde durur: mesaj atabileceğin herkes, katlanabilen en fazla iki sohbet penceresi, mesaj gelince bir ses ve sekmede bir sayaç. İki taraf da bir durum seçer (çevrimiçi, danışanla, antrenmanda, uzakta, rahatsız etmeyin, tatilde ya da çevrimdışı görün), karşı tarafın ne zaman yazdığını ve mesajını ne zaman gördüğünü görür, emoji ve spor salonu çıkartmaları gönderir; telefonda da.",
      proPart: "Danışan olmak ücretsiz; danışan çalıştırmak Pro.",
    },
    "coach-programs": {
      name: "Koç programları",
      body: "Koçlar ve kişisel antrenörler rutinlerini seviye, hedef ve kaç hafta uygulanacağıyla birlikte ücretsiz ya da ücretli bir programa dönüştürür ve bağlantısını paylaşır. Günlerini tek dokunuşla rutinlerine kaydedersin, ağırlıkları kendi ilerlemen belirler. Ücretli programların ödemesi koçun kendi Stripe hesabına gider.",
      note: "Ücretli programlar web sitesinden satın alınır; Android ve iPhone uygulamaları ücretsiz programları ve sahip olduklarını gösterir.",
      proPart: "Program almak ücretsiz; program oluşturmak Pro olan koçluğun parçası.",
    },
    "coach-reviews": {
      name: "Gerçek danışanlardan puanlar ve değerlendirmeler",
      body: "Danışanlar, dört hafta ya da birlikte iki seanstan sonra koçlarını, kişisel antrenörlerini ya da fizyoterapistlerini yıldızla ve kısa bir değerlendirmeyle puanlar. Puan, koçun üç değerlendirmesi olunca görünür; yanında son iki haftada danışanlarından kaçının antrenman yaptığı yer alır, davetinde ve antrenör dizininde. Koçlar her birine bir kez yanıt verir ve herkes bir değerlendirmeyi bildirebilir. Yalnızca yetişkinler değerlendirme bırakabilir.",
      proPart: "Değerlendirme bırakmak ücretsiz; danışan çalıştırmak Pro.",
    },
    "program-pages": {
      name: "Koçların programları web sitesinde, puanlarıyla",
      body: "Bir koçun yayınladığı her programın web sitesinde kendi sayfası olur; seviyesi, hedefi, hafta ve gün sayısı ve ücretsizse egzersizleri görünür, böylece aramada bulunur. Bir programa iki haftadır sahip olanlar onu yıldız ve kısa bir değerlendirmeyle puanlar; puanlar üç değerlendirmeden sonra görünür ve koç her birine bir kez yanıt verir.",
      proPart: "Program puanlamak ücretsizdir; program yapmak Pro olan koçluğun parçasıdır.",
    },
    "coach-plans": {
      name: "Danışan listenle büyüyen koç planları",
      body: "Pro en fazla 3 danışanı kapsar. Coach 25 danışana yer açar, Coach Plus'ın belirli bir sınırı yok; her planda tüm koçluk araçları var. Danışanların her zaman ücretsiz antrenman yapar ve Coach ile Coach Plus'ta Liftsmith sana ödediklerinden hiçbir şey almaz. Pro'da %2 alır.",
    },
    awards: {
      name: "Başarımlar, seviyeler ve seriler",
      body: "Kademeli rozetler, ödüllü 50 seviye, haftalık görevler, seri dondurma ve adil ligler.",
    },
    seasons: {
      name: "Antrenman sezonları",
      body: "Kendi haftalık hedefine doğru antrenman yaparak tırmandığın 20 kademelik yolu olan on haftalık sezonlar: haftada iki gün de beş gün kadar hızlı ilerler, fazladan günler puan getirmez. Kademeler sezona özel rozetler, bir avatar, bir vurgu rengi ve uygulama simgesiyle bir tema verir; sezon bitince de senin kalır. Sezon meydan okumaları, yeni rekorlardan nadir ganimet, prestij yıldızları, kaçırılan haftadan sonra telafi haftası, çift puanlı final ve paylaşılabilir özet kartı. 2027 sonuna kadar arka arkaya altı sezon planlandı (Kor, Fırtına, Çiçek, Gündönümü, Akçaağaç ve Obsidyen); her birinin kendi görünümü ve üç meydan okuması var.",
      proPart: "Tüm kademeler ve ödülleri ücretsiz; Pro üç kademeye bonus ödül ekler.",
      note: "Sezon uygulama simgeleri Android ve iPhone'da; web'de tema var. Sezonlar Ayarlar'dan kapatılabilir.",
    },
    locker: {
      name: "Temalar, vurgu renkleri ve uygulama simgeleri",
      body: "Tema ve vurgu renkleri kazan; telefonlarda da temanın renklerinde bir uygulama simgesi.",
      note: "Kazanılan uygulama simgeleri yalnızca Android ve iPhone'da.",
    },
    watch: {
      name: "Saat uygulamaları",
      body: "Wear OS ve Apple Watch'ta antrenman: set ya da dinlenme geri sayımı, saatten nabız, Seti kaydet ve +30 s, dinlenme bitince de bir titreşim.",
    },
    widgets: {
      name: "Ana ekran widget'ları",
      body: "Üç widget: Bugün (günün kararı, haftalık hedefin, bir koç notu ve Başla ya da Seti kaydet), Bu hafta (antrenman yaptığın günler, serin ve onu neyin sürdürdüğü) ve Toparlanma (hangi kasların antrenmana hazır olduğu ve geri kalanların ne zaman hazır olacağı).",
      note: "Web uygulamasında bunun yerine ana ekran simgesinde kısayollar var.",
    },
    shortcuts: {
      name: "Hızlı ayarlar, Siri ve kısayollar",
      body: "Android'de Hızlı Ayarlar kutucuğundan, iPhone'da Denetim Merkezi'nden ve Siri'yle antrenman başlat.",
    },
    calendar: {
      name: "Takvim",
      body: "Antrenman günlerini takvimine ekler ve bir antrenmanı bir sonraki toplantından önce sığacak şekilde kısaltabilir.",
      note: "Web uygulaması bunun yerine bir .ics dosyası indirir.",
    },
    reminders: {
      name: "Hatırlatıcılar",
      body: "Antrenman günlerinde nazik hatırlatıcılar; telefonlarda bildirim, bir de e-posta olarak.",
    },
    emails: {
      name: "Seni motive tutan e-postalar",
      body: "Gerçek ekranlarla sekiz başlangıç ipucu, haftalık ve aylık özet, yeni kişisel rekorlar, hangi arkadaşların antrenman yaptığı, bir aradan sonra geri dönmen için küçük bir dürtme ve ardından henüz keşfetmemiş olabileceğin bir özellik hakkında haftalık bir ipucu. Her türün kendi anahtarı var.",
      note: "Hesapla açık, 18 yaş altı için kendileri açmadıkça kapalı. Her e-postada tek tıkla abonelikten çıkma var.",
    },
    cloud: {
      name: "Fitness servisi bağlantıları",
      body: "Oura, ücretsiz bir hesapla uyku, HRV, dinlenik nabız ve adımları gönderir. Strava, WHOOP, Withings, Polar ve Concept2'yi inceliyoruz.",
    },
    "health-save": {
      name: "Antrenmanlar sağlık uygulamana kaydedilir",
      body: "Biten her antrenman Health Connect'e ya da Apple Sağlık'a kalori ve nabızla birlikte kuvvet antrenmanı olarak kaydedilir.",
    },
    "outside-workouts": {
      name: "Diğer uygulamalardaki antrenmanlar sayılır",
      body: "Açarsan, diğer uygulamaların sağlık uygulamana kaydettiği koşu, bisiklet, spor ve dersler toparlanma haritanda ve yarının planında sayılır. Dün uzun bir maç oynadıysan bacaklar toparlanıyor görünür ve plan buna göre ayarlanır.",
    },
    offline: {
      name: "Çevrimdışı çalışır",
      body: "Her şey cihazında çalışır ve arka planda eşitlenir; bodrumdaki salonda çekmese de sorun yok.",
    },
    sync: {
      name: "Hesaplar ve eşitleme",
      body: "Google, Apple ya da e-postayla gelen bir kodla isteğe bağlı giriş, telefonunu, tabletini ve web uygulamasını eşit tutar.",
    },
    backup: {
      name: "Yedekleme ve dışa aktarma",
      body: "İstediğin zaman bir yedek dosyası kaydet ya da antrenmanlarını tablo olarak dışa aktar.",
    },
    import: {
      name: "Başka bir uygulamadan içe aktar",
      body: "Geçmişini Strong, Hevy, Fitbod, StrongLifts, JEFIT ya da FitNotes'tan, onların dışa aktarma dosyasıyla taşı; kardiyo dahil.",
    },
    importExtras: {
      name: "Başka bir uygulamadan rutinler ve vücut bilgileri",
      body: "İçe aktarma, aynı adla tekrarladığın antrenmanları rutine dönüştürür ve Hevy, FitNotes ya da bir tartı uygulamasından vücut ağırlığını, vücut yağını ve mezura ölçülerini getirir.",
    },
    "strength-standards": {
      name: "Gerçek sporculardan güç standartları",
      body: "Web sitesi, sporcuların squat, bench press, deadlift ve press'te gerçekte ne kadar kaldırdığını cinsiyete ve vücut ağırlığına göre gösterir; her gün, sayılan sporculardan hesaplanır. Yalnızca 30 veya daha fazla kişilik gruplar yüzdelik olarak gösterilir, kimsenin kendi sayıları asla gösterilmez. Ayarlar › Verilerin ve gizlilik'teki tek bir anahtar senin sayılıp sayılmayacağına karar verir; 18 yaş altındakiler asla sayılmaz.",
    },
    community: {
      name: "Topluluk: fikirler, hatalar ve yol haritası",
      body: "Liftsmith'in sırada ne yapması gerektiğini öner, istediğin fikirlere oy ver, yalnızca ekibin gördüğü bir ekran görüntüsüyle hata bildir, yorum yap ya da @ ile birinden bahset. Her biri inceleniyordan yayınlandıya kadar nerede olduğunu gösterir ve oy verdiğin bir fikir yayınlanınca haber alırsın. Yol haritası ve değişiklik günlüğü web sitesinde de var.",
    },
    whatsNew: {
      name: "Uygulamadaki yenilikler",
      body: "Ayarlar sürümünü bir Yenilikler düğmesiyle gösterir: yeni, daha iyi ve düzeltilmiş olanlar, sade bir dille. Bir güncellemeden sonra Bugün bunu bir kez söyler ve yalnızca zaten kullanabildiklerini listeler.",
    },
    "icon-badge": {
      name: "Uygulama simgesinde bir sayı",
      body: "Uygulama simgesi kaç mesaj, beğeni, yorum ve takip isteğinin beklediğini gösterir. Uygulamada Arkadaşlar'daki ve koçundaki kırmızı sayılar nerede olduklarını söyler, gördüğünde sayı kaybolur. Ayarlar › Hatırlatıcılar'daki bir anahtar kapatır.",
      note: "Android ve iPhone. Web uygulaması Chrome, Edge veya Safari'den yüklendiğinde gösterir.",
    },
    languages: {
      name: "On dil",
      body: "İngilizce, İspanyolca, Fransızca, Almanca, İtalyanca, Japonca, Brezilya Portekizcesi, Korece, Lehçe ve Türkçe; telefonunun ya da tarayıcının dilini takip eder veya karşılama ekranında ve ayarlarda istediğini seçersin.",
    },
    "settings-search": {
      name: "Ayarlarda ara",
      body: "Ayarlar'ın en üstüne bir kelime yaz, eşleşen her ayar nerede olduğuyla birlikte görünsün. Dokun, o ayar görünür şekilde açılsın.",
    },
    appearance: {
      name: "Koyu, açık ya da telefonuna uygun",
      body: "Varsayılan olarak koyu bir görünüm, açık bir görünüm ya da telefonun hangisini kullanıyorsa o.",
    },
    a11y: {
      name: "Erişilebilirlik",
      body: "%150'ye kadar büyük yazı, renk körlüğüne uygun renkler, daha fazla kontrast, ekran okuyucu desteği ve tam klavye kullanımı; WCAG 2.2 AA'ya göre kontrol edilir.",
    },
    "one-hand": {
      name: "Tek elle kontroller",
      body: "Ağırlık ve tekrar butonlarını Seti kaydet'in yanına, sol ya da sağ başparmağının altına taşı.",
    },
    "big-numbers": {
      name: "Büyük rakamlar",
      body: "Set sırasında ağırlık ve tekrar çok daha büyür, Seti kaydet uzar; müzik ve sıradaki egzersiz dinlenene kadar bekler. Set ortasında, kol mesafesinden kolayca okunur.",
    },
    lean: {
      name: "Sade mod, sesler ve titreşim",
      body: "Animasyonları ve konfetiyi, sesleri ya da titreşimi kapat; her biri tek bir anahtarla.",
    },
    "lite-demos": {
      name: "3D figürler için pil tasarrufu",
      body: "Egzersiz gösterimlerini ve toparlanma haritasını daha düşük çözünürlük ve kare hızında çiz; eski telefonlar ve daha uzun pil ömrü için.",
    },
    desktop: {
      name: "Masaüstü düzeni",
      body: "Bilgisayarda web uygulamasının bir kenar çubuğu, geniş sayfaları, antrenman sırasında klavye kısayolları (L seti kaydeder) ve geniş bir rutin oluşturucusu var.",
      note: "Fareyle kullanılan geniş bir pencerede web uygulaması; telefonlar ve tabletler telefon düzenini korur.",
    },
    "lab-rep-count": {
      name: "Kamerayla tekrar sayma",
      body: "Telefonunu bir yere yasla, kamera tekrarlarını saysın; görüntünün üzerine iskelet çizilir. Hiçbir şey telefonundan çıkmaz.",
    },
    "lab-bar-speed": {
      name: "Kamerayla bar hızı",
      body: "Barın ne kadar hızlı hareket ettiğini ve seti bitirecek kadar yavaşladığını gösterir.",
    },
    "lab-form": {
      name: "Kamerayla form kontrolü",
      body: "Paralelin üstünde kalan squat'ları, yarım kesilen tekrarları ve bir tarafa yatmayı fark eder, setler arasında tek bir ipucu verir.",
    },
    "lab-speed-max": {
      name: "Isınmalardan bugünün maksimumu",
      body: "Isınma setlerindeki bar hızına göre ilk çalışma ağırlığını biraz artırmayı ya da azaltmayı önerir.",
    },
    "lab-bar-path": {
      name: "Bar yolu tekrarı",
      body: "Bir squat, deadlift ya da overhead press tekrarını barın yolu çizili olarak yeniden oynatır; bar saptıysa tek bir ipucu verir.",
    },
    "lab-motion": {
      name: "Telefon hareketiyle tekrar sayma",
      body: "Telefon seninle birlikte hareket ettiğinde, kendi hareket sensörleriyle tekrarları sayar.",
      note: "Hareket sensörü olan telefonlar ve tabletler.",
    },
    "lab-watch-reps": {
      name: "Saatle tekrar sayma",
      body: "Wear OS saatin ya da Apple Watch'ın tekrarları bileğinden sayar.",
    },
    "lab-hands-free": {
      name: "Eller serbest setler",
      body: "Bir tekrar sayacı sayarken set, son tekrarından birkaç saniye sonra kendiliğinden kaydedilir.",
    },
    "lab-voice": {
      name: "Sesle set kaydı",
      body: "Bir seti kaydetmek için “8 tekrar 100” ya da “çok kolay” de. Cihazında tanınır; hiçbir ses dışarı çıkmaz.",
      note: "Web: Chrome 139 veya üzeri.",
    },
    "lab-volume": {
      name: "Ses tuşuyla set kaydı",
      body: "Seti kaydetmek için telefonunda ya da kulaklığında ses açma tuşuna bas.",
    },
    "lab-tempo": {
      name: "Tempo koçu",
      body: "Tempolu ve duraklamalı hareketlerde her tekrarın indirme, bekleme ve kaldırma kısmını sesle ve titreşimle sayar.",
    },
    "lab-hr-rest": {
      name: "Nabza göre dinlenme sayacı",
      body: "Nabzın düştüğünde dinlenmeyi erken bitirir, ama asla planlanan dinlenmenin %60'ının altına inmez.",
    },
    "lab-machines": {
      name: "Bluetooth spor salonu makineleri",
      body: "Bisikletler, kürek makineleri, koşu bantları ve eliptikler bir kardiyo setinin süresini, mesafesini ve gücünü doldurur.",
      note: "Web: yalnızca Chrome.",
    },
    "lab-scale": {
      name: "Bluetooth akıllı tartı",
      body: "Uyumlu bir tartıya çık; tartı kaydı kilonu ve vücut yağını senin kontrol edip kaydetmen için doldursun.",
      note: "Web: yalnızca Chrome.",
    },
    "lab-sonos": {
      name: "Sonos",
      body: "Bir Sonos hoparlörünü antrenmandan kontrol et; setler için bir ses seviyesi, dinlenme için başka bir ses seviyesiyle.",
    },
  },
  connectionGroups: {
    health: "Sağlık uygulamaları",
    watches: "Saatler ve nabız",
    bluetooth: "Bluetooth cihazlar (Laboratuvar)",
    services: "Fitness servisleri (ücretsiz hesap gerekir)",
    music: "Müzik ve hoparlörler",
    other: "Takvimler ve diğer uygulamalar",
  },
  connections: {
    "health-connect": {
      name: "Health Connect",
      does: "Tartılar, vücut yağı, uyku, HRV, nabız, adımlar ve beslenme gelir; biten antrenmanlar gider; açarsan diğer uygulamaların antrenmanları da gelir",
    },
    "apple-health": {
      name: "Apple Sağlık",
      does: "Tartılar, vücut yağı, uyku, HRV, nabız, adımlar, beslenme, boy, yaş ve cinsiyet gelir; biten antrenmanlar gider; açarsan diğer uygulamaların antrenmanları da gelir",
    },
    "samsung-health": {
      name: "Samsung Health",
      does: "Health Connect ile paylaştığın andan itibaren ölçümleri",
    },
    "health-devices": {
      name: "Fitbit, Garmin Connect, akıllı tartılar, Hume Body Pod",
      does: "Telefonunun sağlık uygulamasına ne yazıyorlarsa",
    },
    "wear-os": {
      name: "Wear OS saatler",
      does: "Bileğinde antrenman, nabız, Seti kaydet ve +30 s",
    },
    "apple-watch": {
      name: "Apple Watch",
      does: "Bileğinde antrenman, nabız, Seti kaydet ve +30 s",
    },
    garmin: {
      name: "Garmin saatler (Connect IQ)",
      does: "Liftsmith saat uygulamasıyla bileğinde antrenman",
    },
    "hr-strap": {
      name: "Bluetooth nabız kuşakları",
      does: "Setlerde ve dinlenmede canlı nabız (standart Bluetooth nabız verisi paylaşan her kuşak ya da kol bandı)",
    },
    scale: {
      name: "Bluetooth akıllı tartılar",
      does: "Tartı kaydında kilo ve vücut yağı (standart Weight Scale ya da Body Composition servisini paylaşan tartılar)",
      link: "Uyumlu tartılar",
    },
    machines: {
      name: "Bluetooth spor salonu makineleri",
      does: "Standart Fitness Machine servisini paylaşan bisiklet, kürek makinesi, koşu bandı ve eliptiklerden süre, mesafe ve güç",
    },
    oura: {
      name: "Oura",
      does: "Uyku, HRV, dinlenik nabız ve adımlar gelir",
    },
    strava: {
      name: "Strava",
      does: "Biten her antrenman Strava'da paylaşılır",
    },
    "garmin-connect": {
      does: "Uyku, HRV, dinlenik nabız, adımlar ve Index tartı ölçümleri gelir; koşu, bisiklet ve kapalı alan kürek seansları kardiyo antrenmanı olarak gelir",
    },
    whoop: {
      name: "WHOOP",
      does: "Uyku, toparlanma, HRV ve dinlenik nabız gelir",
    },
    withings: {
      name: "Withings",
      does: "Tartılar, vücut yağı, uyku ve adımlar gelir",
    },
    polar: {
      name: "Polar",
      does: "Nightly Recharge, HRV ve uyku gelir",
    },
    concept2: {
      name: "Concept2 Logbook",
      does: "RowErg, SkiErg ve BikeErg seansları kardiyo antrenmanı olarak gelir",
    },
    "music-apps": {
      name: "Spotify, YouTube Music ve diğer müzik uygulamaları",
      does: "Bugün ekranından ve antrenmandan oynat, duraklat ve atla; şarkının adıyla",
    },
    "apple-music": {
      name: "Apple Music",
      does: "Bugün ekranından ve antrenmandan oynat, duraklat ve atla; şarkının adıyla",
    },
    sonos: {
      name: "Sonos",
      does: "Antrenmandan oynat, duraklat, atla ve ses seviyesi; müzik setleri ve dinlenmeyi takip eder",
    },
    calendar: {
      name: "Telefon takvimi (Google, iCloud, Outlook)",
      does: "Antrenman günleri takviminde, antrenmanlar dolu saatlerin etrafına yerleştirilir",
    },
    ics: {
      name: "Her takvim (.ics dosyası)",
      does: "Antrenman günleri takvim dosyası olarak",
    },
    import: {
      name: "Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes",
      does: "Antrenman geçmişin onların dışa aktarma dosyasından içe aktarılır",
      link: "Nasıl geçilir",
    },
  },
};
