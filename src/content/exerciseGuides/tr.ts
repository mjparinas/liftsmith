import type { ExerciseGuide } from "../exerciseGuides";

// The exercise guides in Turkish (sen). Same order and parts as the English guides (lower.ts, upper.ts).
export const TR_GUIDES: Record<string, ExerciseGuide> = {
  "back-squat": {
    intro:
      "Back squat, alt vücut için klasik kuvvet hareketidir. Ön bacakları, kalçayı ve iç bacağı (adduktörleri) yoğun çalıştırır, çok ağırlık yüklemene ve yıllarca ilerlemene izin verir, bu arada güçlü bir gövde de kazandırır.",
    mistakes: [
      [
        "Kalkarken dizlerin içe kapanması",
        "Tekrar boyunca dizlerini parmak uçlarının üzerinden dışarı it; bunu yapabilene kadar barı hafiflet.",
      ],
      [
        "Ağırlık arttıkça derinliği kısaltmak",
        "Her tekrarda aynı derinliğe in; kalçan izin veriyorsa en az kalça kıvrımın diz hizasına gelsin.",
      ],
      ["Dipte gövde sıkılığını kaybetmek", "Her tekrardan önce karnına derin bir nefes al ve en zor kısmı geçene kadar tut."],
      [
        "Topukların kalkması",
        "Ağırlığını ayağının ortasında tut. Topuğu yükseltilmiş ayakkabı ya da biraz daha geniş bir duruş yardımcı olur.",
      ],
    ],
    sets: [
      "**Kuvvet:** 3 ila 6 tekrardan 3 ila 5 set, 3 ila 5 dakika dinlenme.",
      "**Kas:** 6 ila 10 tekrardan 3 ila 4 set, 2 ila 3 dakika dinlenme.",
      "**Yeni başlıyorsan:** 10 ila 12 kez kaldırabileceğin bir ağırlıkla 8 tekrardan 3 set, her antrenmanda biraz ekle.",
    ],
    variations: [
      ["front-squat", "Daha dik, daha çok ön bacak, bele daha nazik."],
      ["box-squat", "Geriye oturmayı ve her tekrarda aynı derinliğe inmeyi öğretir."],
      ["pause-squat", "Çoğu kişinin takıldığı dipten çıkış gücünü geliştirir."],
      ["goblet-squat", "Bara yük takmadan önce hareketi öğrenmenin en iyi yolu."],
    ],
    faq: [
      [
        "Squat'ta ne kadar derine inmeliyim?",
        "Sırt pozisyonunu ve topuklarını yerde tutabildiğin kadar derine. Çoğu kişi için bu, paralel ya da paralelin biraz altıdır.",
      ],
      [
        "High bar mı, low bar mı?",
        "High bar omuzların üstünde durur ve gövde daha dik kalır; low bar daha aşağıda durur ve biraz daha fazla kaldırmanı sağlar. İkisi de işe yarar.",
      ],
      [
        "Kemer gerekir mi?",
        "Başlangıçta gerekmez. Önce kemersiz gövdeni sıkmayı öğren; ileride ağır setlerde kemer yardımcı olabilir. Bkz. [ağırlık kemeri](/blog/lifting-belt/).",
      ],
    ],
  },
  "front-squat": {
    intro:
      "Front squat'ta bar omuzlarının önünde durur; bu da gövdeni dik tutar ve işin daha büyük kısmını ön bacaklara verir. Bele back squat'tan daha naziktir ve doğru squat duruşunu öğretmekte çok iyidir.",
    mistakes: [
      ["Dirseklerin düşmesi", "Tekrar boyunca dirseklerini yukarı ve öne it. Bar yuvarlanıyorsa önce dirseklerin düşmüştür."],
      [
        "Barı ellerinle taşımak",
        "Bar omuzlarında durur; parmakların sadece yerinde tutar. Bileklerin sertse çapraz kol tutuşu ya da kayış kullan.",
      ],
      [
        "Üst sırtın yuvarlanması",
        "Göğsünü yukarıda tut ve gövdeni sıkıca kilitle. Göğüs dikken daha hafif ağırlık, öne katlanarak kaldırılan ağır ağırlıktan iyidir.",
      ],
    ],
    sets: ["**Kuvvet:** 3 ila 5 tekrardan 3 ila 5 set.", "**Kas:** 6 ila 10 tekrardan 3 set."],
    variations: [
      ["goblet-squat", "Dambılla aynı dik pozisyon, öğrenmesi daha kolay."],
      ["back-squat", "Genel olarak daha fazla ağırlık kaldırmanı sağlar."],
      ["db-front-squat", "Squat sehpası gerekmez, bilek esnemesi yok."],
    ],
    faq: [
      [
        "Front squat, back squat'tan daha mı iyi?",
        "Biri diğerinden iyi değil. Front squat ön bacaklara daha çok yüklenir ve sırta daha naziktir; back squat daha fazla kaldırmanı sağlar.",
      ],
      [
        "Front squat neden bileklerimi acıtıyor?",
        "Bileklerin ve sırt kasların (latlar) sert. Barın altında sadece iki üç parmağını tut ya da çapraz kol tutuşu kullan.",
      ],
    ],
  },
  "goblet-squat": {
    intro:
      "Goblet squat'ta tek bir dambılı ya da kettlebell'ı göğsünde tutarsın. Öndeki ağırlık dik kalmayı ve derine oturmayı kolaylaştırır; bu yüzden squat öğrenmenin en iyi yolu ve evde harika bir bacak egzersizidir.",
    mistakes: [
      ["Ağırlığın seni öne çekmesi", "Ağırlığı göğsüne yaslı tut ve dirseklerini altında içeride topla."],
      ["Fazla sığ squat", "Topuklarının arasına otur; dipte dirseklerin dizlerinin yanından geçecek kadar in."],
      ["Tekrarları aceleye getirmek", "İki üç saniyede in. Bu, hafif bir ağırlığı çok daha zor hale getirir."],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 3 set.", "**Evde hafif ağırlıkla:** 15 ila 20 tekrardan 3 set, yavaş inişle."],
    variations: [
      ["kb-goblet-squat", "Aynı hareket, kettlebell kulplarından tutularak."],
      ["db-goblet-squat-heels", "Topuklar yükseltilmiş: daha çok ön bacak, daha derin squat."],
      ["back-squat", "Dambıllar yetmemeye başlayınca bir sonraki adım."],
    ],
    faq: [
      [
        "Goblet squat bacak geliştirmek için iyi mi?",
        "Evet, elindeki en ağır dambıl kolaylaşana kadar. Sonra tekrarları yavaşlat, dipte bekle ya da barbell squat'a geç.",
      ],
      ["Dambıl mı, kettlebell mı?", "İkisi de olur. Dambılı bir ucundan dik tut, kettlebell'ı kulplarından."],
    ],
  },
  "bulgarian-split-squat": {
    intro:
      "Bulgarian split squat'ta arka ayağın bir sehpanın üstündedir, böylece işin neredeyse tamamını öndeki bacak yapar. Ön bacakları ve kalçayı tek tek, back squat yükünün küçük bir kısmıyla geliştirir; bu da bele nazik olmasını sağlar.",
    mistakes: [
      [
        "Ön ayağın sehpaya fazla yakın olması",
        "Ön kaval kemiğin aşağı yukarı dik kalacak ve dizin dipte rahatça bükülebilecek kadar ileri adım at.",
      ],
      ["Arka ayaktan güç almak", "Arka ayak sadece denge içindir. Ağırlığının çoğunu öndeki topuk ve ayak ortasında tut."],
      ["Dengeyi kaybetmek", "Dengen oturana kadar bir elinle bir yere tutun ya da daha alçak bir sehpa kullan."],
    ],
    sets: [
      "**Kas:** Bacak başına 8 ila 12 tekrardan 3 set, zayıf tarafından başlayarak.",
      "**Evde:** Vücut ağırlığı ya da hafif dambıllarla bacak başına 12 ila 20 tekrardan 3 set.",
    ],
    variations: [
      ["split-squat", "İki ayak da yerde: dengesi daha kolay."],
      ["front-foot-elevated-split-squat", "Ön bacak için daha derin bir esneme."],
      ["barbell-bulgarian-split-squat", "Dambılları tutmak zorlaşınca daha fazla yük."],
    ],
    faq: [
      [
        "Ön bacak mı, kalça mı?",
        "İkisi de. Daha dik gövde ve kısa duruş ön bacaklara yüklenir; uzun duruşla öne eğilmek kalçayı daha çok çalıştırır.",
      ],
      [
        "Neden bu kadar zor?",
        "Tek bacak iki bacağın işini yapıyor, üstüne denge de ekleniyor. Hafif başla; ağırlığın ne kadar hızlı arttığına şaşıracaksın.",
      ],
    ],
  },
  "leg-press": {
    intro:
      "Leg press, omurgana yük bindirmeden ve denge gerektirmeden ön bacakları ve kalçayı çalıştırır; sırtın ya da tekniğin squat'ı kısıtladığında bile bacaklarını güvenle zorlayabilirsin.",
    mistakes: [
      ["Belin minderden kalkması", "Kalçanı ve belini koltukta tutabildiğin kadar derine in."],
      ["Tepede dizleri sertçe kilitlemek", "Tam kilitlemeden hemen önce dur ve doğrudan bir sonraki tekrara geç."],
      [
        "Daha çok ağırlık için hareketi kısaltmak",
        "Daha az ağırlıkla tam ve kontrollü bir hareket, bütün ağırlıkla yapılan yarım tekrarlardan daha çok kas yapar.",
      ],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 3 ila 4 set.", "**Bitiriş hareketi olarak:** Squat'tan sonra 15 ila 25 tekrardan 1 ila 2 set."],
    variations: [
      ["narrow-leg-press", "Ayaklar daha aşağıda ve bitişik: daha çok ön bacak."],
      ["wide-leg-press", "Ayaklar daha yukarıda ve geniş: daha çok kalça ve iç bacak."],
      ["single-leg-press", "Farkları dengelemek için tek bacakla."],
    ],
    faq: [
      [
        "Leg press squat kadar iyi mi?",
        "Bacak kası yapmak için yakın. Squat dengeyi ve gövdeyi de çalıştırır; leg press bacakları daha az yorgunlukla daha çok zorlamanı sağlar.",
      ],
      [
        "Ayaklarım nereye gelmeli?",
        "Platformun ortası, omuz genişliğinde, iyi bir başlangıçtır. Kalça için yukarı, ön bacak için aşağı al.",
      ],
    ],
  },
  "hack-squat": {
    intro:
      "Hack squat makinesi, sırtın destekliyken bir kızak üzerinde squat yaptırır. Bar dengelemeden derine inip zorlayabildiğin için en iyi ön bacak geliştiricilerinden biridir.",
    mistakes: [
      [
        "Ayakların platformda fazla yukarıda olması",
        "Daha çok ön bacak çalışması için ayaklarını ortaya ya da biraz aşağıya, topuklar yere tam basacak şekilde koy.",
      ],
      ["Dipten sekerek kalkmak", "İnişi kontrol et ve yukarı itmeden önce kısa bir an bekle."],
      ["Yarım tekrarlar", "Belin minderden ayrılmadan kalçanın izin verdiği kadar derine in."],
    ],
    sets: ["**Kas:** 6 ila 12 tekrardan 3 ila 4 set.", "**Kuvvet:** Ana squat'ından sonra 5 ila 8 tekrardan 3 set."],
    variations: [
      ["pendulum-squat", "Daha derin bir yay çizen benzer bir makine."],
      ["leg-press", "Omuzlarda hiç yük yok."],
      ["back-squat", "Serbest ağırlık, dengeyi ve gövdeyi çalıştırır."],
    ],
    faq: [
      [
        "Hack squat dizlere zararlı mı?",
        "Hayır. Dizlerin parmak uçlarının önüne geçmesi normaldir. Ağırlığı yavaş yavaş artır ve ağrısız tut.",
      ],
      [
        "Hack squat mı, leg press mi?",
        "Hack squat genelde ön bacakları biraz daha çok zorlar; leg press omuzlara ve sırta daha naziktir. İkisi de iyidir.",
      ],
    ],
  },
  deadlift: {
    intro:
      "Deadlift, yüklü bir barı yerden kaldırmaktır. Vücudun tüm arka zincirini, yani kalçayı, arka bacakları, sırtı ve kavrayışı çalıştırır ve genelde insanların en fazla ağırlık kaldırabildiği harekettir.",
    mistakes: [
      [
        "Barın bacaklardan uzaklaşması",
        "Bar yukarı çıkarken kaval kemiklerine ve uyluklarına değsin. Başlarken ayağının ortasının üstünde olsun.",
      ],
      ["Belin yuvarlanması", "Çekmeden önce gövdeni sıkıca kilitle; sırtın pozisyonu koruyamıyorsa ağırlığı azalt."],
      ["Barı yerden aniden çekmek", "Önce boşluğu al: bar plakalara tıklayana kadar gerin, sonra yeri ayaklarınla it."],
      ["Tepede çok geriye yaslanmak", "Kalçanı sıkarak dimdik durarak bitir. Geriye yaslanmana gerek yok."],
    ],
    sets: [
      "**Kuvvet:** 2 ila 5 tekrardan 2 ila 4 set, 3 ila 5 dakika dinlenme.",
      "**Kas:** 5 ila 8 tekrardan 3 set. Deadlift yorucudur, bu yüzden çoğu kişi haftada bir yapar.",
    ],
    variations: [
      ["trap-bar-deadlift", "Öğrenmesi daha kolay, daha dik, sırta daha nazik."],
      ["sumo-deadlift", "Bazı vücut yapılarına daha uygun geniş bir duruş."],
      ["romanian-deadlift", "Yukarıdan başlar ve arka bacaklara daha çok yüklenir."],
      ["paused-deadlift", "Yerden hemen sonraki kontrolü geliştirir."],
    ],
    faq: [
      [
        "Ne sıklıkla deadlift yapmalıyım?",
        "Çoğu kişi için haftada bir yeterli; başka bir gün de Romanian deadlift gibi daha hafif bir kalça menteşe hareketi ekle.",
      ],
      [
        "Barı tepeden bırakmak sorun olur mu?",
        "Kontrollü indir. Tepeden bırakmak plakalara ve zemine zarar verir, tekrarın da yarısını atlar.",
      ],
      [
        "Kayış kullanmalı mıyım?",
        "Önce kavrayışın tükeniyorsa en ağır setlerinde kullan. Kavrayışı ısınma setlerinle çalıştır. Bkz. [kavrama gücü](/blog/grip-strength/).",
      ],
    ],
  },
  "sumo-deadlift": {
    intro:
      "Sumo deadlift'te geniş bir duruşla ellerin dizlerinin içinde olur. Barın kat ettiği mesafeyi kısaltır, daha dik kalmanı sağlar ve işin daha büyük kısmını kalçaya, ön bacaklara ve iç bacağa verir.",
    mistakes: [
      ["Duruşun fazla geniş olması", "Kaval kemiklerin aşağı yukarı dik kalacak ve dizlerin parmak uçlarını takip edecek kadar aç."],
      ["Kalçanın önce fırlaması", "Dizlerini dışarı it ve yeri iki yana açar gibi bas; kalçan ve göğsün birlikte yükselsin."],
      ["Gevşek kollarla başlamak", "Bar yerden ayrılmadan önce boşluğu al."],
    ],
    sets: ["**Kuvvet:** 2 ila 5 tekrardan 3 ila 5 set.", "**Kas:** 5 ila 8 tekrardan 3 set."],
    variations: [
      ["deadlift", "Klasik duruş, daha çok arka bacak ve sırt."],
      ["kb-sumo-deadlift", "Duruşu öğrenmenin hafif bir yolu."],
      ["trap-bar-deadlift", "Sumo gibi dik, kurulumu daha basit."],
    ],
    faq: [
      ["Sumo hile mi?", "Hayır. Powerlifting'de kabul gören bir stil. Vücuduna uyan ve iyi kaldırmanı sağlayan duruşu seç."],
      ["Sumo mu, klasik mi?", "Birkaç hafta ikisini de dene. Bacakları uzun, kolları kısa olanlar genelde sumoyu tercih eder."],
    ],
  },
  "romanian-deadlift": {
    intro:
      "Romanian deadlift ayakta başlar ve neredeyse düz bacaklarla kalçanı geriye iterek barı indirir. Arka bacakları ve kalçayı uzun bir esnemede yüklediği için en iyi arka bacak ve kalça geliştiricilerinden biridir.",
    mistakes: [
      ["Dizleri fazla bükmek", "Değişmeyen hafif bir bükülme koru. İnerken dizlerin daha çok bükülüyorsa hareket squat'a döner."],
      ["Fazla aşağı inmek", "Sadece kalçan geriye gitmeye devam ettiği ve sırtın düz kaldığı kadar in; genelde kaval kemiğinin ortası."],
      ["Barın bacaklardan uzak olması", "Barı uyluklarının üstünden kaydırarak indir. Ne kadar yakın kalırsa belin o kadar rahat eder."],
    ],
    sets: ["**Kas:** 6 ila 12 tekrardan 3 set, yavaş inişle.", "**Deadlift'ten sonra:** 8 ila 10 tekrardan 2 ila 3 set, daha hafif."],
    variations: [
      ["db-rdl", "Dambıllarla, evde harika."],
      ["single-leg-rdl", "Tek bacak: denge çalışır, daha az ağırlık gerekir."],
      ["stiff-leg-deadlift", "Her tekrarda yerden başlar."],
    ],
    faq: [
      [
        "Romanian deadlift mi, deadlift mi?",
        "Romanian yukarıdan başlar ve arka bacaklara daha çok yüklenir; deadlift yerden başlar ve daha fazla kaldırmanı sağlar.",
      ],
      [
        "Nerede hissetmeliyim?",
        "Uyluklarının arkasında ve kalçanda. Çoğunlukla belinde hissediyorsan ağırlığı azalt ve kalçanı daha geriye it.",
      ],
    ],
  },
  "trap-bar-deadlift": {
    intro:
      "Trap bar deadlift'te yanlarında tutamaçları olan altıgen bir barın içinde durursun. Daha dik kalabildiğin için belin üzerindeki stres azalır; bu da onu öğrenmesi ve ağır yüklemesi en kolay deadlift yapar.",
    mistakes: [
      ["Squat gibi yapmak", "Bu hâlâ bir kalça menteşe hareketi. Tutamaçlara uzanmak için kalçanı geriye it, sonra yeri ayaklarınla it."],
      ["Barın içinde ortalanmamak", "Tutamaçlar ayağının ortasıyla aynı hizada olacak şekilde dur."],
      [
        "Dipte gerginliği kaybetmek",
        "Tekrarlar arasında yeniden pozisyon al ya da plakaları hafifçe yere değdirip devam et; plakaları sektirme.",
      ],
    ],
    sets: ["**Kuvvet:** 3 ila 5 tekrardan 3 ila 5 set.", "**Kas ya da spor:** 5 ila 8 tekrardan 3 set."],
    variations: [
      ["high-handle-trap-bar-deadlift", "Yüksek tutamaçlar: yeni başlayanlar ya da uzun boylular için daha kısa hareket."],
      ["deadlift", "Düz bar, daha çok sırt ve arka bacak."],
      ["trap-bar-rdl", "Arka bacak odaklı bir versiyon."],
    ],
    faq: [
      ["Trap bar deadlift daha mı kolay?", "Çoğu kişi öğrenmesini daha kolay bulur ve daha dik olduğu için biraz daha fazla kaldırabilir."],
      ["Aynı kasları mı çalıştırır?", "Büyük ölçüde. Düz bar deadlift'e göre biraz daha çok ön bacak, biraz daha az bel kullanır."],
    ],
  },
  "hip-thrust": {
    intro:
      "Hip thrust'ta üst sırtını bir sehpaya yaslar ve yüklü bir barı kalçanla yukarı itersin. Kalça tam açıkken kalça kaslarına neredeyse diğer tüm egzersizlerden daha fazla yük bindirir.",
    mistakes: [
      [
        "Tepede beli kavislendirmek",
        "Çeneni içeri al ve kaburgalarını aşağıda tut; hareketi belini kavislendirerek değil, kalçanı sıkarak bitir.",
      ],
      [
        "Ayakların yanlış yerde olması",
        "Tepede kaval kemiklerin aşağı yukarı dik olmalı. Fazla yakınsa ön bacaklar, fazla uzaksa arka bacaklar devreye girer.",
      ],
      ["Tepeyi aceleye getirmek", "Her tekrarda tepede bir saniye bekle."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 3 ila 4 set.", "**Kuvvet:** Tepede beklemeyle 5 ila 8 tekrardan 3 set."],
    variations: [
      ["glute-bridge", "Yerden: kurulumu daha kolay, hareket daha kısa."],
      ["db-hip-thrust", "Kalçada tek dambıl, evde iyi."],
      ["single-leg-hip-thrust", "Tek bacakla, yük gerekmez."],
    ],
    faq: [
      ["Bar pedi gerekir mi?", "Bar pedi ya da katlanmış bir mat, ağır setleri çok daha rahat hale getirir."],
      [
        "Kalça için hip thrust mı, squat mı?",
        "İkisi de. Squat kalçayı derin bir esnemede çalıştırır; hip thrust en çok tepede zorlar. Bkz. [kalça antrenmanı](/blog/glute-workout/).",
      ],
    ],
  },
  "glute-bridge": {
    intro:
      "Glute bridge'de sırtın yerde düzken kalçanı yerden kaldırırsın. Her yerde yapabileceğin basit bir kalça egzersizi ve hip thrust'tan önce kalça kaslarını kullanmayı öğrenmenin iyi bir yoludur.",
    mistakes: [
      ["Parmak uçlarından itmek", "İşin kalçada kalması için topuklarından it."],
      ["Daha yükseğe çıkmak için beli kavislendirmek", "Kalçan ve uyluklarınla düz bir çizgi oluşunca dur. Orada kalçanı sık."],
      ["Tekrarları koşturmak", "Tepede bir iki saniye bekle."],
    ],
    sets: [
      "**Evde:** Tepede beklemeyle 15 ila 25 tekrardan 3 set.",
      "**Yüklü:** Kalçanda bir dambıl ya da barla 10 ila 15 tekrardan 3 set.",
    ],
    variations: [
      ["single-leg-glute-bridge", "Her taraf için iki kat iş."],
      ["hip-thrust", "Daha uzun hareket ve daha ağır yükler için sırt sehpada."],
      ["marching-glute-bridge", "Core ve kalça dengesini de ekler."],
    ],
    faq: [
      [
        "Glute bridge mi, hip thrust mı?",
        "Bridge daha kolaydır ve hiçbir şey gerektirmez; hip thrust'ın hareket açıklığı daha uzundur ve daha fazla ağırlık alır.",
      ],
      ["Neden arka bacaklarımda hissediyorum?", "Ayaklarını kalçana biraz daha yaklaştır ve topuklarından it."],
    ],
  },
  "walking-lunge": {
    intro:
      "Walking lunge'da sürekli öne adım atarak lunge yaparsın. Ön bacakları ve kalçayı tek tek çalıştırır, dengeni zorlar ve nabzını yükseltir.",
    mistakes: [
      ["Adımların fazla kısa olması", "Dipte iki dizin de yaklaşık 90 dereceye bükülecek kadar uzun adım at."],
      ["Ön dizin içe kapanması", "Ön dizini parmak uçlarınla aynı hizada tut."],
      ["Arka dizi yere çarpmak", "Arka dizin neredeyse yere değene kadar kontrollü in."],
    ],
    sets: ["**Kas:** Bacak başına 10 ila 12 adımdan 3 set.", "**Kondisyon:** Toplam 20 ila 30 adımdan 2 ila 3 set, kısa dinlenmelerle."],
    variations: [
      ["reverse-lunge", "Geriye adım atmak dizlere ve dengeye daha kolay gelir."],
      ["barbell-walking-lunge", "Dambılları tutmak zorlaşınca daha fazla yük."],
      ["bulgarian-split-squat", "Yerinde kalır ve her bacağı daha çok izole eder."],
    ],
    faq: [
      [
        "Walking lunge mı, reverse lunge mı?",
        "Reverse lunge'ı kontrol etmek daha kolaydır ve dizlere daha naziktir; walking lunge denge ve kondisyon katar.",
      ],
      ["Ne kadar alana ihtiyacım var?", "Bir set için yaklaşık 10 metre. Yerin yoksa geri dön ya da reverse lunge'a geç."],
    ],
  },
  "reverse-lunge": {
    intro:
      "Reverse lunge'da geriye adım atarak lunge yaparsın. Geriye adım atmak ağırlığını ön ayağında tutar; bu da onu öne lunge'a göre dengesi daha kolay ve dizlere daha nazik yapar.",
    mistakes: [
      ["Fazla dar adım atmak", "İp üstünde değil, tren rayında yürür gibi geriye adım at ki dengen korunsun."],
      ["Arka ayaktan güç almak", "Öndeki topuğundan iterek kalk; arka bacak sadece dengeye yardım eder."],
      ["Çok öne eğilmek", "Oldukça dik kal; daha çok kalça için hafifçe öne eğil."],
    ],
    sets: [
      "**Vücut ağırlığıyla:** Bacak başına 12 ila 20 tekrardan 3 set.",
      "**Yüklü:** Dambıllarla bacak başına 8 ila 12 tekrardan 3 set.",
    ],
    variations: [
      ["db-reverse-lunge", "Daha fazla yük için dambıllar."],
      ["deficit-reverse-lunge", "Daha derin hareket için ön ayak bir basamakta."],
      ["walking-lunge", "Denge ve kondisyon katar."],
    ],
    faq: [
      ["Reverse lunge sorunlu dizler için iyi mi?", "Hassas dizler için genelde en rahat lunge budur. Hareketi ağrısız aralıkta tut."],
      ["Bacak değiştirerek mi, önce bir taraf mı?", "İkisi de olur. Önce bir tarafı bitirmek daha zordur ve tekrarları eşit tutar."],
    ],
  },
  "leg-extension": {
    intro:
      "Leg extension makinesinde dizini dirence karşı düzleştirirsin. Ön bacakları, squat'ın pek çalıştırmadığı kısmı da dahil olmak üzere izole eder ve tükenişe yakın güvenle zorlamak kolaydır.",
    mistakes: [
      ["Dizin makinenin eksenine hizalı olmaması", "Koltuğu, diz eklemin makinenin dönme ekseniyle aynı hizaya gelecek şekilde ayarla."],
      ["Ağırlığı savurarak kaldırmak", "Kontrollü kaldır ve tepede kısa bir an bekle."],
      ["Kalçayı koltuktan kaldırmak", "Tutamaçları tut ve kalçanı aşağıda tut."],
    ],
    sets: [
      "**Kas:** Squat ya da press hareketlerinden sonra 10 ila 15 tekrardan 2 ila 3 set.",
      "**Bitiriş:** Tükenişe yakın 15 ila 20 tekrardan 1 set.",
    ],
    variations: [
      ["single-leg-extension", "Farkları dengelemek için tek bacakla."],
      ["sissy-squat", "Vücut ağırlığıyla ön bacak izolasyonu."],
      ["leg-press", "Çok eklemli bir ön bacak egzersizi."],
    ],
    faq: [
      [
        "Leg extension dizlere zararlı mı?",
        "Makul bir ağırlıkla hayır. Diz rehabilitasyonunda sık kullanılır. Eklem ağrısı hissedersen dur.",
      ],
      [
        "Squat yapıyorsam leg extension gerekir mi?",
        "Şart değil, ama fazla yormadan ön bacak çalışması ekler ve squat'ın pek esnetmediği rectus femoris'i çalıştırır.",
      ],
    ],
  },
  "lying-leg-curl": {
    intro:
      "Lying leg curl'de yüzüstü yatarken dizlerini bir pede karşı bükersin. Deadlift gibi kalça menteşe hareketlerinin ağırlıklı olarak kalçadan çalıştırdığı arka bacakları izole eder.",
    mistakes: [
      ["Kalçanın sehpadan kalkması", "Kalçanı minderin içine bastır ve orada tut."],
      ["Momentum kullanmak", "Akıcı bir şekilde bük ve iki üç saniyede yavaşça indir."],
      ["Kısa hareket", "Bir sonraki tekrardan önce bacakların neredeyse düzleşene kadar indir."],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 3 set."],
    variations: [
      ["seated-leg-curl", "Kalça bükülü, böylece arka bacaklar daha uzun bir esnemeden çalışır."],
      ["nordic-curl", "Vücut ağırlığıyla ve çok zor; sprinterler için harika."],
      ["slider-leg-curl", "Evde havlu ya da kaydırıcılarla."],
    ],
    faq: [
      [
        "Yatarak mı, oturarak mı leg curl?",
        "Oturarak yapılan versiyon arka bacakları daha çok esnetir ve biraz daha fazla kas yapabilir. Salonunda hangisi varsa onu kullan.",
      ],
      [
        "Deadlift yapıyorsam leg curl gerekir mi?",
        "Leg curl arka bacakların diz büken tarafını çalıştırır, deadlift çalıştırmaz. Haftada bir curl hareketi işe yarar.",
      ],
    ],
  },
  "seated-leg-curl": {
    intro:
      "Seated leg curl'de otururken dizlerini bir pede karşı bükersin. Oturmak arka bacakları uzun bir esnemeye sokar; bu da onu kas için en iyi arka bacak egzersizlerinden biri yapar.",
    mistakes: [
      ["Uyluk pedinin gevşek olması", "Bacakların kalkmasın diye uyluk pedini sıkıca kilitle."],
      ["Hile için geriye yaslanmak", "Esnemeyi korumak için dik otur ya da hafifçe öne eğil."],
      ["İnişi aceleye getirmek", "İki üç saniye boyunca kontrol et."],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 3 set."],
    variations: [
      ["lying-leg-curl", "Kalça düz; oturarak yapılan makine doluysa."],
      ["single-leg-curl", "Tek bacakla."],
      ["romanian-deadlift", "Arka bacakları diz yerine kalçadan çalıştırır."],
    ],
    faq: [
      [
        "Seated leg curl yatarak yapılandan daha mı iyi?",
        "Arka bacakları daha uzun bir esnemeden çalıştırır, bu da biraz daha fazla kas yapabilir. İkisi de iyidir.",
      ],
      [
        "Leg curl'de ne kadar ağırlık kullanmalıyım?",
        "Her setin son birkaç tekrarı zorlayacak, ama inişi hâlâ kontrol edebileceğin kadar.",
      ],
    ],
  },
  "standing-calf-raise": {
    intro:
      "Standing calf raise'de dizlerin düzken dirence karşı parmak uçlarına yükselirsin. Baldırın büyük kasını, gastroknemiusu en iyi bu çalıştırır.",
    mistakes: [
      ["Dipte sekmek", "Her tekrarın dibinde esnemede bir saniye bekle."],
      ["Yarım tekrarlar", "Derin bir esnemeden parmak uçlarında çıkabildiğin en yükseğe kadar git."],
      ["Dizleri bükmek", "Kaldırma işini baldırlar yapsın diye dizlerini düz ama kilitlemeden tut."],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 3 ila 4 set, yavaş, haftada iki üç kez."],
    variations: [
      ["seated-calf-raise", "Bükülü dizler, alttaki soleus için."],
      ["single-leg-calf-raise", "Evde bir basamakta, tek bacakla."],
      ["calf-press", "Leg press makinesinde."],
    ],
    faq: [
      [
        "Baldırlarım neden büyümüyor?",
        "Çoğu kişi kısa tekrarlarla sekerek geçer. Esnemede bekleyerek tam hareket açıklığı kullan ve daha sık çalıştır. Bkz. [baldır antrenmanı](/blog/calf-workout/).",
      ],
      ["Ayakta mı, oturarak mı calf raise?", "İkisi de. Ayakta gastroknemiusu, oturarak soleusu daha çok çalıştırır."],
    ],
  },
  plank: {
    intro:
      "Plank'ta vücudunu ön kolların ve parmak uçların üzerinde düz bir çizgide tutarsın. Karın kaslarını ve gövdeni bükülmeye direnmeye çalıştırır; bu da ağır bar altında gövdeni sıkmana doğrudan yansır.",
    mistakes: [
      ["Kalçanın sarkması", "Kalçanı sık ve kaburgalarını kalçana doğru çek."],
      ["Kalçanın havaya kalkması", "Vücudun baştan topuğa tek bir düz çizgi olana kadar indir."],
      ["Dakikalarca tutmak", "60 saniye tutabildiğinde süreyi uzatmak yerine hareketi zorlaştır."],
    ],
    sets: ["**Core:** 20 ila 60 saniyelik 2 ila 3 tutuş, haftada iki üç kez."],
    variations: [
      ["side-plank", "Yan karın kaslarını ve kalçanın yanlarını çalıştırır."],
      ["long-lever-plank", "Dirsekler daha önde: çok daha zor."],
      ["ab-wheel", "Plank kolaylaşınca hareketli bir versiyon."],
    ],
    faq: [
      ["Plank'ı ne kadar tutmalıyım?", "Kusursuz formla 20 ila 60 saniye. Ötesinde daha zor bir versiyon daha çok işe yarar."],
      [
        "Plank göbek yağı yakar mı?",
        "Hiçbir egzersiz tek bir bölgeden yağ yakmaz. Bkz. [göbek yağı nasıl verilir](/blog/how-to-lose-belly-fat/).",
      ],
    ],
  },
  "hanging-leg-raise": {
    intro:
      "Hanging leg raise'de bir bara asılıp bacaklarını kaldırırsın. Alt karın kaslarını ve kalça fleksörlerini, üstüne kavrayışını çalıştıran en zor karın egzersizlerinden biridir.",
    mistakes: [
      ["Sallanmak", "Sabit bir asılışla başla ve yavaşça indir. Sallanmaya başlarsan dipte bekle."],
      ["Sadece bacakları kaldırmak", "Tepede leğen kemiğini yukarı kıvır ki işi sadece kalça fleksörlerin değil, karın kasların yapsın."],
      ["Önce kavrayışın tükenmesi", "Karın askısı kullan ya da kavrayışı ayrıca çalıştır."],
    ],
    sets: ["**Core:** 6 ila 15 tekrardan 3 set."],
    variations: [
      ["hanging-knee-raise", "Bükülü dizler: daha kolay ilk adım."],
      ["parallel-bar-knee-raise", "Dips barında, kavrayış gerekmez."],
      ["lying-leg-raise", "Yerde, daha da kolay."],
    ],
    faq: [
      ["Sallanmayı nasıl durdururum?", "Yavaşça indir, dipte bekle ve omuzlarını aktif tut."],
      ["Çok mu zor?", "Hanging knee raise ile başla, 12 tekrardan 3 set yapabildiğinde düz bacaklara geç."],
    ],
  },
  "ab-wheel": {
    intro:
      "Ab wheel'ı önüne doğru yuvarlar ve geri getirirsin. Kolların başının üzerine uzanırken belinin kavislenmesini durdurmayı öğreten, en zorlayıcı karın egzersizlerinden biridir.",
    mistakes: [
      ["Belin sarkması", "Sadece belinin kavislenmediği kadar yuvarla. Leğen kemiğini içeri al ve kalçanı sık."],
      ["Geri dönerken kalçanın öne geçmesi", "Kalçanı havaya dikerek değil, karın kaslarınla ve kollarınla birlikte geri çek."],
      ["Çok erken çok uzağa gitmek", "Önce bir duvara kadar ya da kısa bir mesafe yuvarla, sonra her hafta biraz daha uzağa git."],
    ],
    sets: ["**Core:** Dizlerinin üzerinden 5 ila 12 tekrardan 3 set; güçlenince ayakta."],
    variations: [
      ["plank", "Ona hazırlanmak için sabit versiyon."],
      ["plank-reach", "Aynı beceriyi çalıştırmanın daha yumuşak bir yolu."],
      ["dead-bug", "Sırtüstü, belini yerde tutmayı öğrenmek için."],
    ],
    faq: [
      ["Ab wheel sırta zararlı mı?", "Belinin kavislenmediği aralıkta kalırsan hayır. Belinde hissediyorsan mesafeyi kısalt."],
      ["Dizler üstünde mi, ayakta mı?", "Çoğu kişi için dizler üstünde. Ayakta yuvarlamak ileri seviye bir hedeftir."],
    ],
  },
  "kb-swing": {
    intro:
      "Kettlebell swing'de kalçanı hızla öne iterek kettlebell'ı göğüs hizasına savurursun. Kalçayı ve arka bacakları patlayıcı şekilde çalıştırır ve aynı zamanda kondisyon da sağlar.",
    mistakes: [
      ["Swing'i squat gibi yapmak", "Bu bir kalça menteşe hareketi: kalçanı geriye it, dizlerini sadece biraz bük."],
      ["Kollarınla kaldırmak", "Kettlebell'ı kalçan yukarı gönderir; kolların sadece tutar."],
      ["Tepede geriye yaslanmak", "Plank'taki gibi kalçan ve karın kasların sıkı, dimdik durarak bitir."],
    ],
    sets: [
      "**Patlayıcı güç:** 10 tekrardan 5 ila 10 set, gerektiği kadar dinlenerek.",
      "**Kondisyon:** 10 dakika boyunca her dakika 10 ila 20 swing.",
    ],
    variations: [
      ["kb-single-swing", "Tek el: gövdenin direnmesi gereken bir dönme ekler."],
      ["db-swing", "Kettlebell yoksa dambılla."],
      ["kb-deadlift", "Swing'den önce kalça menteşesini öğren."],
    ],
    faq: [
      [
        "Kettlebell'ım ne kadar ağır olmalı?",
        "Swing yavaş değil, çabuk olacak kadar ağır. Birçok kadın 12 kg ile, birçok erkek 16 ila 20 kg ile başlar.",
      ],
      ["Ne kadar yükseğe savurmalıyım?", "Yaklaşık göğüs hizasına. Daha yükseği pek bir şey katmaz."],
    ],
  },
  "farmers-carry": {
    intro:
      "Farmer's carry'de iki ağır ağırlığı alıp yürürsün. Kavrayışı, trapezleri, core'u ve duruşu aynı anda çalıştırır ve günlük hayata doğrudan yansır.",
    mistakes: [
      ["Eğilmek ya da dönmek", "Dik yürü, omuzların geride ve aşağıda, kısa ve hızlı adımlarla."],
      ["Ağırlıkların fazla hafif olması", "Mesafeyi bitirmek zor olmalı. Sınırı kavrayışın belirlemeli."],
      ["Yuvarlak sırtla yerden almak", "Ağırlıkları deadlift yapar gibi kaldır ve aynı şekilde yere bırak."],
    ],
    sets: ["**Kuvvet:** 20 ila 40 metrelik 3 ila 5 tur, 1 ila 2 dakika dinlenme."],
    variations: [
      ["db-suitcase-carry", "Sadece tek taraf: yan karın kaslarını çalıştırır."],
      ["trap-bar-carry", "Tek barda daha ağır yükler."],
      ["kb-rack-carry", "Kettlebell'lar omuz hizasında, üst sırt için."],
    ],
    faq: [
      ["Farmer's carry'de ne kadar ağırlık?", "Her elde vücut ağırlığının yaklaşık dörtte biriyle başla ve artır."],
      ["Ne kadar yürümeliyim?", "Tur başına 20 ila 40 metre ya da 30 ila 60 saniye."],
    ],
  },
  "good-morning": {
    intro:
      "Good morning'de bar sırtındayken kalçadan öne eğilirsin. Arka bacakları, kalçayı ve beli güçlendirir ve sağlam bir kalça menteşe hareketi öğretir.",
    mistakes: [
      ["Fazla ağır gitmek", "Hafif başla. Form bozulursa bu hareket bele ağır gelir."],
      ["Sırtı yuvarlamak", "Sırtını düz, göğsünü dik tut; sadece bunu koruyabildiğin kadar in."],
      ["Dizleri fazla bükmek", "Dizlerini hafif bükülü tut ve kalçanı düz geriye it."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 3 set, hafif."],
    variations: [
      ["romanian-deadlift", "Ağırlık elindeyken aynı kalça menteşesi."],
      ["band-good-morning", "Hafif ve öğrenmek için iyi."],
      ["seated-good-morning", "Oturarak: çoğunlukla bel."],
    ],
    faq: [
      ["Good morning tehlikeli mi?", "Makul ağırlık ve iyi formla hayır. Hafif başla ve ağırlığı yavaşça artır."],
      ["Ne kadar derine inmeliyim?", "Gövden yere aşağı yukarı paralel olana kadar; sırtın yuvarlanmaya başlarsa daha az."],
    ],
  },
  "step-up": {
    intro:
      "Step-up'ta tek bacakla bir kutuya ya da sehpaya çıkarsın. Ön bacakları ve kalçayı tek tek geliştirir ve merdivene, yürüyüşe ve spora doğrudan yansır.",
    mistakes: [
      ["Arka ayaktan güç almak", "Arka ayağını hafif tut; seni öndeki bacak kaldırsın."],
      ["Kutunun fazla yüksek olması", "Diz hizasında ya da biraz daha alçak bir kutuyla başla."],
      ["Kendini aşağı bırakmak", "Yavaşça in. İniş de bacağı çalıştırır."],
    ],
    sets: ["**Kas:** Bacak başına 8 ila 12 tekrardan 3 set.", "**Vücut ağırlığıyla:** Bacak başına 15 ila 20 tekrardan 3 set."],
    variations: [
      ["db-step-up", "Daha fazla yük için dambıllar."],
      ["db-lateral-step-up", "Kalça için yandan çıkış."],
      ["box-step-down", "Diz kontrolü için yavaş iniş."],
    ],
    faq: [
      [
        "Kutu ne kadar yüksek olmalı?",
        "Diz hizasında ya da daha alçak. Yüksek kutular kalçayı daha çok çalıştırır ama kontrol etmesi daha zordur.",
      ],
      [
        "Step-up mı, lunge mı?",
        "İkisi de aynı kasları çalıştırır. Step-up'ta denge daha kolaydır; lunge'ın hareket açıklığı daha uzundur.",
      ],
    ],
  },
  "bench-press": {
    intro:
      "Bench press, üst vücudun ana kuvvet hareketidir. Göğsü, ön omuzları ve arka kolu çalıştırır, çok ağırlık alır ve ilerlemeyi takip etmesi en kolay hareketlerden biridir.",
    mistakes: [
      ["Gevşek, yayvan omuzlar", "Barı almadan önce kürek kemiklerini geriye ve aşağı çek ve set boyunca sabit tut."],
      [
        "Dirseklerin tamamen yana açılması",
        "Dirseklerini vücuduna göre yaklaşık 45 ila 70 derecede topla. Hem daha güçlüdür hem omuzlara daha kolay gelir.",
      ],
      ["Barı göğüsten sektirmek", "Barı alt göğsüne hafifçe değdir, sonra it. Kısa bir bekleme kontrolü öğretir."],
      ["Ayakların havada kalması", "Ayaklarını yere sağlam bas ve vücudunu gergin tutmak için yeri it."],
    ],
    sets: [
      "**Kuvvet:** 3 ila 6 tekrardan 3 ila 5 set, 3 ila 5 dakika dinlenme.",
      "**Kas:** 6 ila 10 tekrardan 3 ila 4 set, 2 ila 3 dakika dinlenme.",
      "**Yeni başlıyorsan:** 8 tekrardan 3 set, her antrenmanda biraz ağırlık ekle.",
    ],
    variations: [
      ["db-bench-press", "Daha geniş hareket açıklığı, her taraf kendi başına çalışır."],
      ["incline-bench-press", "Daha çok üst göğüs ve ön omuz."],
      ["close-grip-bench", "İşi arka kola kaydırır."],
      ["spoto-press", "Kontrol için göğsün hemen üstünde bekler."],
    ],
    faq: [
      [
        "Yardımcıya (spotter) ihtiyacım var mı?",
        "Ağır setlerde bir yardımcı ya da güvenlik kolları göğüs hizasının hemen altına ayarlanmış bir sehpa kullan.",
      ],
      [
        "Tutuşum ne kadar geniş olmalı?",
        "Çoğu kişi dipte ön kolları dikken en iyi iter; bu genelde omuz genişliğinden biraz daha geniştir.",
      ],
      ["Sırtımı kavislendirmeli miyim?", "Kürek kemiklerini geriye çekmekten gelen küçük bir kavis normaldir. Kalçanı sehpada tut."],
    ],
  },
  "incline-bench-press": {
    intro:
      "Incline bench press'te yaklaşık 30 dereceye ayarlanmış bir sehpada barbell itersin. Düz bench'e göre işin daha büyük kısmını üst göğse ve ön omuzlara kaydırır.",
    mistakes: [
      ["Sehpanın fazla dik olması", "Yaklaşık 30 derece yeterli. Daha dik olursa omuz press'e döner."],
      ["Barın fazla aşağı inmesi", "Barı üst göğsüne, köprücük kemiklerinin hemen altına indir."],
      ["Omuzların öne kapanması", "Düz bench'teki gibi kürek kemiklerini geride ve aşağıda tut."],
    ],
    sets: ["**Kuvvet:** 4 ila 6 tekrardan 3 ila 4 set.", "**Kas:** 6 ila 12 tekrardan 3 set."],
    variations: [
      ["db-incline-press", "Dambıllar: daha geniş hareket, omuzlara daha kolay."],
      ["smith-incline-press", "Güvenle zorlamak için sabit bir yol."],
      ["bench-press", "Düz: genel olarak daha fazla ağırlık."],
    ],
    faq: [
      ["Incline sehpa hangi açıda olmalı?", "Yaklaşık 30 derece. Birçok ayarlanabilir sehpada buna yakın bir kademe vardır."],
      [
        "Hem düz hem incline gerekir mi?",
        "Şart değil, ama ikisini yapmak göğsü iki açıdan çalıştırır. Birçok program birini ana hareket, diğerini ikinci press olarak kullanır.",
      ],
    ],
  },
  "db-bench-press": {
    intro:
      "Dumbbell bench press'te düz bir sehpada yatarak iki dambıl itersin. Her kol kendi başına çalışır ve dambıllar bardan daha aşağı inebilir; bu yüzden göğüs gelişimi ve tarafları dengelemek için harikadır.",
    mistakes: [
      ["Pozisyona kötü girmek", "Dambıllar uyluklarındayken otur, sonra geriye yatarken dizlerinle onları yukarı it."],
      ["Dambılların fazla yana açılması", "Dirsekler yaklaşık 45 derecedeyken onları göğsünün yanlarına indir."],
      ["Tepede dambılları çarpıştırmak", "Yukarı ve hafifçe içe it, dambıllar birbirine değmeden hemen önce dur."],
    ],
    sets: ["**Kas:** 6 ila 12 tekrardan 3 ila 4 set.", "**Evde:** Dambılların hafifse yavaş inişle 10 ila 20 tekrardan 3 set."],
    variations: [
      ["db-incline-press", "Üst göğüs odaklı."],
      ["db-floor-press", "Sehpa gerekmez; hareket daha kısa."],
      ["db-neutral-press", "Avuç içleri birbirine bakar: omuzlara daha kolay."],
    ],
    faq: [
      [
        "Dambıl mı, barbell bench mi?",
        "Barbell daha fazla kaldırmanı sağlar; dambıllar daha geniş hareket verir ve tarafları dengeler. İkisi de göğüs yapar.",
      ],
      ["Dambılları nasıl güvenle bırakırım?", "Onları göğsüne getir, sonra doğrulurken uyluklarına indir. Yanlara düşürme."],
    ],
  },
  "db-incline-press": {
    intro:
      "Incline dumbbell press'te açılı bir sehpada iki dambıl itersin. En iyi üst göğüs egzersizlerinden biridir ve omuzlara incline barbell'dan daha naziktir.",
    mistakes: [
      ["Sehpanın fazla dik olması", "İşi göğüste tutmak için yaklaşık 30 derece kullan."],
      ["Hareketi kısaltmak", "Tam esneme için dambılların kontrollü şekilde göğüs hizasına inmesine izin ver."],
      ["Sehpadan kavis yaparak kalkmak", "Kalçanı aşağıda, üst sırtını pede bastırılmış tut."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 3 set."],
    variations: [
      ["db-low-incline-press", "Düz ile incline arasında, daha düşük bir açı."],
      ["incline-bench-press", "Daha ağır yükler için barbell versiyonu."],
      ["incline-machine-press", "Denge kurmadan zorlamak için makine."],
    ],
    faq: [
      ["Incline press üst göğüs geliştirir mi?", "Evet. Eğim, işin daha büyük kısmını göğsün üst liflerine kaydırır."],
      ["Düz press'e göre ne kadar ağır?", "Genelde düz dumbbell press'inden %10 ila 20 daha az."],
    ],
  },
  "push-up": {
    intro:
      "Şınavda vücudunu yerden yukarı itersin. Göğsü, omuzları ve arka kolu her yerde çalıştırır; zor versiyonlarıyla seni çok ileri götürebilir.",
    mistakes: [
      ["Kalçanın sarkması", "Kalçanı ve karın kaslarını sık ki vücudun tek bir çizgide kalsın."],
      ["Dirseklerin yana açılması", "Dirseklerini vücuduna göre yaklaşık 45 derecede tut."],
      ["Yarım tekrarlar", "Göğsün yerden bir yumruk yüksekliğine gelene kadar in, sonra sonuna kadar it."],
    ],
    sets: [
      "**Kas:** 3 set, tükenişe bir iki tekrar kala dur.",
      "**Çok mu kolay?** Ayaklarını yükselt, inişi yavaşlat ya da sırt çantası tak.",
    ],
    variations: [
      ["incline-push-up", "Eller sehpada: daha kolay, ilk adım."],
      ["decline-push-up", "Ayaklar yüksekte: daha zor, daha çok üst göğüs."],
      ["archer-push-up", "İşi tek kola kaydırır."],
      ["deficit-push-up", "Daha derin esneme için eller blokların üstünde."],
    ],
    faq: [
      ["Kaç şınav çekmeliyim?", "3 set boyunca yapabildiğin düzgün tekrar sayısının bir iki eksiği. Yaklaşık 20'yi geçince zorlaştır."],
      [
        "Şınav kas yapar mı?",
        "Evet, setler zor olduğu sürece. Güçlendikçe daha zor versiyonlara geç. Bkz. [kalistenik ilerlemeleri](/blog/calisthenics-progressions/).",
      ],
    ],
  },
  dip: {
    intro:
      "Dips'te iki paralel bar arasında vücudunu indirip yukarı itersin. Göğüs ve arka kol için en iyi vücut ağırlığı egzersizlerinden biridir.",
    mistakes: [
      ["Fazla derine inmek", "Üst kolların yere aşağı yukarı paralel olana kadar in; omuzların itiraz ederse daha az."],
      ["Omuzları yukarı kaldırmak", "Omuzlarını kulaklarından uzakta, aşağıda tut."],
      ["Sallanmak", "Ayak bileklerini çaprazla ve vücudunu sabit tut."],
    ],
    sets: ["**Kas:** 6 ila 12 tekrardan 3 set.", "**Çok mu kolay?** Kemerle ya da ayaklarının arasında bir dambılla ağırlık ekle."],
    variations: [
      ["negative-dip", "Sadece yavaş iniş, ilk adım."],
      ["band-assisted-dip", "Bant ağırlığının bir kısmını alır."],
      ["ring-dip", "Çok daha zor: halkalar hareket eder."],
    ],
    faq: [
      ["Göğüs mü, arka kol mu?", "Daha çok göğüs için öne eğil; daha çok arka kol için dik kal."],
      ["Dips omuzlara zararlı mı?", "Derinliği kontrol edersen çoğu kişi için hayır. Ağrıyan aralığa girmeden dur."],
    ],
  },
  "cable-fly": {
    intro:
      "Cable fly'da iki kabloya karşı kucaklar gibi bir yay çizerek ellerini birleştirirsin. Göğsü izole eder ve tekrar boyunca, özellikle esnemede, gerginliği göğüste tutar.",
    mistakes: [
      ["Hareketi press'e çevirmek", "Dirseklerinde sabit, hafif bir bükülme koru. Sadece omuzlardan hareket et."],
      ["Fazla ağır", "Tam esneme boyunca kontrol edebileceğin bir ağırlık seç."],
      ["Omuzları öne yuvarlamak", "Göğsünü yukarıda, kürek kemiklerini geride tut."],
    ],
    sets: ["**Kas:** Press hareketlerinden sonra 10 ila 15 tekrardan 2 ila 3 set."],
    variations: [
      ["low-cable-fly", "Aşağıdan yukarı: üst göğüs."],
      ["pec-deck", "Sabit yollu bir makine."],
      ["db-fly", "Dambıllarla, kablo gerekmez."],
    ],
    faq: [
      [
        "Yukarıdan mı, aşağıdan mı cable fly?",
        "Yukarıdan aşağı daha çok alt göğsü, aşağıdan yukarı daha çok üst göğsü çalıştırır. İkisi de iyidir.",
      ],
      ["Cable fly mı, dambıl fly mı?", "Kablolar tekrarın tepesinde gerginliği korur; dambıllar en çok esnemede zorlar. İkisi de olur."],
    ],
  },
  "overhead-press": {
    intro:
      "Overhead press'te ayakta dururken barbell'ı omuzlarından başının üstüne itersin. Omuzları ve arka kolu geliştirir; barı tutabilmek için tüm vücudun sıkı durmak zorundadır.",
    mistakes: [
      ["Çok geriye yaslanmak", "Kalçanı ve gövdeni sık ki vücudun dik bir hizada kalsın."],
      ["Barın yüzünün etrafından dolaşması", "Çeneni geri çek, düz yukarı it, bar geçince başını öne al."],
      ["Başlangıçta dirseklerin yana açılması", "Dirseklerin barın biraz önünde olacak şekilde başla."],
    ],
    sets: ["**Kuvvet:** 3 ila 6 tekrardan 3 ila 5 set.", "**Kas:** 6 ila 10 tekrardan 3 set."],
    variations: [
      ["db-shoulder-press", "Oturarak, dambıllarla: bele daha kolay."],
      ["push-press", "Daha ağır yükleri kaldırmak için biraz bacak desteği."],
      ["landmine-press", "Hassas omuzlar için açılı bir press."],
    ],
    faq: [
      [
        "Overhead press'im neden bu kadar sık takılıyor?",
        "Daha küçük bir hareket, bu yüzden ağırlık artışları görece büyük. Küçük plakalar kullan ya da ağırlıktan önce tekrar ekle. Bkz. [doğrusal ve çift ilerleme](/blog/linear-vs-double-progression/).",
      ],
      ["Ayakta mı, oturarak mı?", "Ayakta gövdeyi de çalıştırır; oturarak omuzların daha çok itmesini sağlar. İkisi de işe yarar."],
    ],
  },
  "db-shoulder-press": {
    intro:
      "Dumbbell shoulder press'te iki dambılı başının üstüne itersin, genelde sırt destekli oturarak. Ön ve yan omuzları, ayakta barbell press'e göre bele daha az yük bindirerek geliştirir.",
    mistakes: [
      ["Sehpanın tamamen dik olması", "Sırtın desteklensin diye dikin biraz gerisine ayarla."],
      ["Fazla az inmek", "Dambılları yaklaşık kulak ya da çene hizasına getir."],
      ["Dambılları birbirine çarpmak", "Yukarı ve hafifçe içe it, değmeden önce dur."],
    ],
    sets: ["**Kas:** 6 ila 12 tekrardan 3 set."],
    variations: [
      ["db-arnold-press", "Daha çok ön omuz için avuçları döndürerek."],
      ["machine-shoulder-press", "Güvenle zorlamak için sabit bir yol."],
      ["overhead-press", "Barbell, ayakta."],
    ],
    faq: [
      ["Oturarak mı, ayakta mı?", "Oturarak daha fazla itebilirsin; ayakta dengeyi ve gövdeyi çalıştırır."],
      ["Avuçlar önde mi, içe mi?", "Biraz içe bakmak birçok kişinin omuzlarına daha kolay gelir. En iyi hissettireni kullan."],
    ],
  },
  "lateral-raise": {
    intro:
      "Lateral raise'de iki dambılı yanlara kaldırırsın. Omuzlara genişlik veren ve press hareketlerinin pek çalıştırmadığı yan omuzları izole eder.",
    mistakes: [
      ["Ağırlığı savurarak kaldırmak", "Eğilmeden ya da omuz silkmeden kaldırabileceğin bir ağırlık kullan."],
      ["Omuz silkmek", "Dambılları yukarı değil, dışarı, senden uzağa ittiğini düşün."],
      ["Fazla ağır gitmek", "12 ila 20 düzgün tekrarlık hafif ağırlıklar, savrulan ağır tekrarlardan iyidir."],
    ],
    sets: ["**Kas:** 12 ila 20 tekrardan 3 ila 4 set, haftada iki üç kez."],
    variations: [
      ["cable-lateral-raise", "Sürekli gerginlik, tek kolla."],
      ["lean-away-lateral-raise", "Daha uzun hareket için bir direğe tutunarak."],
      ["machine-lateral-raise", "Sabit bir yol, tükenişe kadar zorlamak kolay."],
    ],
    faq: [
      ["Lateral raise'de ne kadar ağırlık kullanmalıyım?", "Hafif. Çoğu kişi düzgün tekrarlar için 4 ila 10 kg dambıl kullanır."],
      ["Ne kadar yükseğe kaldırmalıyım?", "Yaklaşık omuz hizasına. Daha yükseği trapezleri devreye sokar."],
    ],
  },
  "face-pull": {
    intro:
      "Face pull'da yüksek bir kablodaki halatı, ellerin ayrık şekilde yüzüne doğru çekersin. Press hareketlerini dengeleyen ve duruşa yardım eden arka omuzları ve üst sırtı çalıştırır.",
    mistakes: [
      ["Belinle çekmek", "Dik dur ve gövdeni sık; sadece hafifçe geriye yaslan."],
      ["Ellerin fazla aşağıda olması", "Alnına ya da gözlerine doğru çek, ellerin kulaklarının yanında bitsin."],
      ["Fazla ağır", "Her tekrarın sonunda bekleyebileceğin bir ağırlık kullan."],
    ],
    sets: ["**Kas ve omuz sağlığı:** 12 ila 20 tekrardan 2 ila 3 set."],
    variations: [
      ["band-face-pull", "Bantla, evde."],
      ["rear-delt-fly", "Dambıllarla, öne eğilerek."],
      ["reverse-pec-deck", "Sabit yollu bir makine."],
    ],
    faq: [
      [
        "Face pull omuzlar için iyi mi?",
        "Press hareketlerini dengeleyen arka omuzları ve üst sırtı çalıştırır. Birçok sporcu her üst vücut antrenmanında yapar.",
      ],
      ["Halat mı, bar mı?", "Halat, ellerinin sonda ayrılmasına izin verir; bu da arka omuzları daha çok çalıştırır."],
    ],
  },
  "rear-delt-fly": {
    intro:
      "Rear delt fly'da öne eğilip iki dambılı yanlara kaldırırsın. Çoğu press hareketinin, hatta row'ların bile pek çalıştırmadığı arka omuzları izole eder.",
    mistakes: [
      ["Row'a çevirmek", "Dirseklerde hafif, sabit bir bükülme koru ve omuzlardan hareket et."],
      ["Kürek kemiklerini sıkıştırmak", "İşi omuzlar yapsın; kürek kemikleri oldukça sabit kalır."],
      ["Fazla ağır", "Kontrollü, çok hafif ağırlıklar en iyisidir."],
    ],
    sets: ["**Kas:** 12 ila 20 tekrardan 3 set."],
    variations: [
      ["reverse-pec-deck", "Makine, formu korumak daha kolay."],
      ["cable-rear-delt-fly", "Sürekli gerginlik için kablolar."],
      ["face-pull", "Üst sırtı da çalıştıran bir çekiş."],
    ],
    faq: [
      ["Oturarak mı, ayakta mı?", "Göğsün dizlerinde oturarak ya da incline sehpada yüzüstü yaparak formu korumak daha kolaydır."],
      ["Arka omuz neden çalıştırılmalı?", "Omuzları tamamlar ve çoğu programdaki bütün press hareketlerini dengeler."],
    ],
  },
  "pull-up": {
    intro:
      "Barfikste avuçların karşıya bakacak şekilde bara asılır ve çeneni barın üstüne çekersin. Kanat kaslarını (latlar), üst sırtı ve pazuyu çalıştıran klasik vücut ağırlığı sırt egzersizidir.",
    mistakes: [
      ["Kipping ya da sallanmak", "Her tekrara sabit bir asılıştan başla."],
      ["Yarım tekrarlar", "Düz kollardan çene barın üstüne gelene kadar çık."],
      ["Tepede omuz silkmek", "Çekerken omuzlarını aşağı ve geriye çek."],
    ],
    sets: [
      "**Kas:** 3 ila 4 set, tükenişe bir iki tekrar kala dur.",
      "**Çok mu kolay?** Kemerle ya da ayaklarının arasında bir dambılla ağırlık ekle.",
    ],
    variations: [
      ["negative-pull-up", "Zıpla ve yavaşça in, ilk adım."],
      ["band-assisted-pull-up", "Bant ağırlığının bir kısmını alır."],
      ["chin-up", "Avuçlar sana bakar: biraz daha kolay, daha çok pazu."],
      ["neutral-grip-pull-up", "Avuçlar birbirine bakar, dirseklere kolay."],
    ],
    faq: [
      [
        "İlk barfiksimi nasıl çekerim?",
        "Haftada üç kez yavaş negatifler, bant destekli tekrarlar ve lat pulldown. Çoğu kişi ilkini birkaç ay içinde çeker.",
      ],
      [
        "Barfiks mi, lat pulldown mı?",
        "İkisi de kanat kaslarını çalıştırır. Barfiks gövdeyi de çalıştırır; pulldown istediğin ağırlığı seçmeni sağlar.",
      ],
    ],
  },
  "chin-up": {
    intro:
      "Chin-up'ta avuçların sana bakacak şekilde bara asılır ve çeneni barın üstüne çekersin. Kanat kaslarını çalıştırır, pazuyu barfiksten daha çok zorlar ve çoğu kişi birkaç tekrar daha fazla yapabilir.",
    mistakes: [
      ["Tam asılışa inmemek", "Her tekrarın dibinde kollarını düzleştir."],
      ["Çeneyle uzanmak", "Boynunla uzanmak yerine göğsünü bara doğru çek."],
      ["Sallanmak", "Bacaklarını sabit, gövdeni sıkı tut."],
    ],
    sets: ["**Kas:** 3 ila 4 set, tükenişe bir iki tekrar kala dur."],
    variations: [
      ["pull-up", "Avuçlar karşıya: daha çok üst sırt."],
      ["reverse-grip-pulldown", "Makinede aynı tutuş."],
      ["negative-pull-up", "Hazırlanmak için yavaş iniş."],
    ],
    faq: [
      [
        "Chin-up mı, barfiks mi?",
        "Chin-up pazuyu daha çok kullanır ve biraz daha kolaydır; barfiks üst sırtı daha çok kullanır. İkisi de kanat kaslarını geliştirir.",
      ],
      ["Tutuşum ne kadar geniş olmalı?", "Yaklaşık omuz genişliğinde."],
    ],
  },
  "lat-pulldown": {
    intro:
      "Lat pulldown'da yüksek bir kablodan barı üst göğsüne çekersin. Barfiks gibi kanat kaslarını çalıştırır ama ağırlığı seçmeni sağlar, böylece herkes yapabilir.",
    mistakes: [
      ["Çok geriye yaslanmak", "Sadece hafifçe geriye yaslan ve göğsünü yukarıda tut."],
      ["Kollarınla çekmek", "Dirseklerini yanlarına doğru aşağı sürdüğünü düşün."],
      ["Ensenin arkasına çekmek", "Üst göğsüne çek."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 3 ila 4 set."],
    variations: [
      ["close-grip-pulldown", "Dar tutamak, daha uzun hareket."],
      ["one-arm-cable-pulldown", "Tek taraf tek taraf."],
      ["pull-up", "Kendi vücut ağırlığınla."],
    ],
    faq: [
      ["Geniş mi, dar mı tutuş?", "İkisi de kanat kaslarını çalıştırır. Omuzlardan biraz geniş, orta bir tutuş çoğu kişiye uyar."],
      ["Pulldown barfiks çekmeme yardım eder mi?", "Evet, özellikle yavaş negatiflerle. Bkz. [sırt antrenmanı](/blog/back-workout/)."],
    ],
  },
  "barbell-row": {
    intro:
      "Barbell row'da öne eğilip barı karnına çekersin. Tüm üst sırtı, kanat kaslarını ve arka omuzları geliştirir ve ağır yükler kullanmana izin verir.",
    mistakes: [
      ["Çekerken doğrulmak", "Gövdeni yerden yaklaşık 30 ila 45 derecelik sabit bir açıda tut."],
      ["Ağırlığı silkerek çekmek", "Akıcı çek ve kontrollü indir."],
      ["Belin yuvarlanması", "Gövdeni sık ve sırtını düz tut. Yuvarlanıyorsa barı hafiflet."],
    ],
    sets: ["**Kas:** 6 ila 12 tekrardan 3 ila 4 set.", "**Kuvvet:** 5 ila 8 tekrardan 3 set."],
    variations: [
      ["pendlay-row", "Her tekrar yerden, düz sırtla."],
      ["chest-supported-row", "Bele hiç yük binmez."],
      ["db-row", "Destekle, tek kolla."],
    ],
    faq: [
      [
        "Üstten mi, alttan mı tutuş?",
        "Üstten tutuş daha çok üst sırtı, alttan tutuş daha çok kanat kaslarını ve pazuyu çalıştırır. İkisi de olur.",
      ],
      ["Row neden belimi ağrıtıyor?", "Gövden desteksiz. Daha az ağırlık kullan ya da göğüs destekli row'a geç."],
    ],
  },
  "db-row": {
    intro:
      "Tek kol dambıl row'da bir elini ve dizini sehpaya dayayıp dambılı kalçana doğru çekersin. Sırtın destekliyken kanat kaslarını ve üst sırtı tek tek çalıştırır.",
    mistakes: [
      ["Kaldırmak için dönmek", "Omuzlarını ve kalçanı yere paralel tut."],
      ["Göğse çekmek", "Kanat kaslarını çalıştırmak için kalçana doğru çek."],
      ["Kısa hareket", "Her tekrarda esneme için dambılın tamamen aşağı sarkmasına izin ver."],
    ],
    sets: ["**Kas:** Kol başına 8 ila 12 tekrardan 3 set."],
    variations: [
      ["chest-supported-row", "İki kol, göğüs incline sehpada."],
      ["kb-row", "Kettlebell ile."],
      ["seal-row", "Yüksek bir sehpada yüzüstü: çok sıkı form."],
    ],
    faq: [
      ["Sehpa gerekir mi?", "Sehpa en kolayı. Yoksa elini sağlam bir sandalyeye ya da dizine daya."],
      ["Dambıl row'da ne kadar ağırlık kullanmalıyım?", "Son birkaç tekrar dönmeden zorlayacak kadar ağır."],
    ],
  },
  "seated-cable-row": {
    intro:
      "Seated cable row'da otururken alçak bir kablodan tutamağı karnına çekersin. Üst sırtı ve kanat kaslarını sabit gerginlikle ve bele yük bindirmeden çalıştırır.",
    mistakes: [
      ["İleri geri sallanmak", "Gövdeni sabit tut, sadece sonda hafifçe geriye yaslan."],
      ["Omuz silkmek", "Kürek kemiklerini yukarı değil, geriye ve aşağı çek."],
      ["Dönüşü aceleye getirmek", "Kollarının kontrollü şekilde düzleşmesine izin ver ve esnemeyi hisset."],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 3 ila 4 set."],
    variations: [
      ["cable-row-wide", "Geniş bar: daha çok üst sırt."],
      ["single-arm-cable-row", "Tek taraf tek taraf."],
      ["machine-row", "Göğüs destekli bir makine."],
    ],
    faq: [
      [
        "Hangi tutamak en iyisi?",
        "Dar V tutamak daha çok kanat kaslarını, geniş bar daha çok üst sırtı çalıştırır. Zamanla ikisini de kullan.",
      ],
      ["Öne eğilmeli miyim?", "Esneme için başta biraz, sonra çekerken dik otur."],
    ],
  },
  "barbell-curl": {
    intro:
      "Barbell curl'de barı uyluklarından omuzlarına doğru bükerek kaldırırsın. Klasik pazu egzersizidir ve tüm curl'ler arasında en fazla ağırlığı kullanmana izin verir.",
    mistakes: [
      ["Sırtınla savurmak", "Dirseklerin yanlarındayken dik dur. Savurman gerekiyorsa barı hafiflet."],
      ["Dirseklerin öne kayması", "Tekrar boyunca dirseklerini vücuduna yakın tut."],
      ["Barı düşürmek", "İki üç saniyede kontrollü indir."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 2 ila 4 set."],
    variations: [
      ["ez-curl", "Bileklere daha kolay gelen açılı bir bar."],
      ["db-curl", "Her kol kendi başına."],
      ["drag-curl", "Daha çok pazu tepesi için barı vücuduna sürterek yukarı çeker."],
    ],
    faq: [
      ["Düz bar mı, EZ bar mı?", "EZ bar bileklere daha kolay gelir. Düz bar pazuyu biraz daha çok çalıştırır."],
      [
        "Kaç curl yapmalıyım?",
        "Chin-up ve row'lar dahil haftada yaklaşık 6 ila 12 zor pazu seti. Bkz. [kol antrenmanı](/blog/arm-workout/).",
      ],
    ],
  },
  "db-curl": {
    intro:
      "Dambıl curl'de her elde bir dambılla curl yaparsın. Her kol kendi başına çalışır ve kaldırırken avuçlarını yukarı çevirebilirsin; bu da pazuyu tam çalıştırır.",
    mistakes: [
      ["Sallanmak", "Dirseklerini yanlarında, vücudunu sabit tut."],
      ["Avuçları geç çevirmek", "Avuçlar içe bakarak başla ve kaldırırken yukarı çevir."],
      ["Kısa hareket", "Dipte kollarını tamamen düzleştir."],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 2 ila 4 set."],
    variations: [
      ["incline-db-curl", "Uzun bir esneme için incline sehpada."],
      ["hammer-curl", "Avuçlar içe: daha çok ön kol ve brakiyalis."],
      ["db-preacher-curl", "Sıkı form için kol pedin üstünde."],
    ],
    faq: [
      ["Sırayla mı, iki kol birden mi?", "İkisi de olur. Sırayla yapmak her kola odaklanmanı sağlar; iki kol birden zaman kazandırır."],
      ["Ayakta mı, oturarak mı?", "Oturarak savurmak daha zordur."],
    ],
  },
  "hammer-curl": {
    intro:
      "Hammer curl'de avuçların birbirine bakarken dambıllarla curl yaparsın. Brakiyalisi ve ön kol kaslarını normal curl'den daha çok çalıştırır; bu da kola kalınlık katar.",
    mistakes: [
      ["Ağırlığı savurmak", "Dik dur ve dirseklerini sabit tut."],
      ["Avuçları döndürmek", "Tekrar boyunca avuçların birbirine baksın."],
      ["Acele etmek", "Kontrollü indir."],
    ],
    sets: ["**Kas:** 8 ila 15 tekrardan 2 ila 3 set."],
    variations: [
      ["rope-hammer-curl", "Kabloda halatla."],
      ["incline-hammer-curl", "Esneme için incline sehpada."],
      ["reverse-curl", "Ön kollar için avuçlar aşağı."],
    ],
    faq: [
      ["Hammer curl mü, normal curl mü?", "İkisini de yap: pazu için normal curl, brakiyalis ve ön kol için hammer curl."],
      ["Çapraz mı, düz mü?", "İkisi de işe yarar. Vücudun önünden çapraz yapmak, bazılarının daha rahat bulduğu yaygın bir varyasyon."],
    ],
  },
  "cable-pushdown": {
    intro:
      "Cable pushdown'da yüksek bir kablodan barı ya da halatı aşağı itersin. Arka kolu izole eder; öğrenmesi kolay, dirseklere nazik ve ilerlemesi kolaydır.",
    mistakes: [
      ["Dirseklerin hareket etmesi", "Dirseklerini yanlarına sabitle; sadece ön kolların hareket etsin."],
      ["Ağırlığın üstüne eğilmek", "Kamburlaşmadan, hafifçe öne eğilerek dik dur."],
      ["Kısa hareket", "Dipte kollarını tamamen kilitle ve ön kollarının paralelin üstüne çıkmasına izin ver."],
    ],
    sets: ["**Kas:** 10 ila 15 tekrardan 2 ila 4 set."],
    variations: [
      ["rope-pushdown", "Halat, dipte ellerinin açılmasına izin verir."],
      ["cable-overhead-extension", "Baş üstünde: arka kolun uzun başı."],
      ["reverse-grip-pushdown", "Avuçlar yukarı, farklı bir his."],
    ],
    faq: [
      ["Halat mı, bar mı?", "Bar daha fazla kaldırmanı sağlar; halat ellerinin açılmasına izin verir. İkisini de kullanabilirsin."],
      [
        "Baş üstü arka kol çalışması da gerekir mi?",
        "Bir overhead extension eklemek arka kolun uzun başını esnemede çalıştırır, bu da daha fazla kas yapabilir.",
      ],
    ],
  },
  "skull-crusher": {
    intro:
      "Skull crusher'da sehpada yatarken EZ barı alnına doğru indirir, sonra kollarını açarsın. Arka kolun üç başını da iyi bir esnemeyle çalıştırır.",
    mistakes: [
      ["Dirseklerin yana açılması", "Dirseklerin omuz genişliğinde, tavana doğru baksın."],
      ["Alnına indirmek", "Daha çok esneme ve daha az risk için başının tepesine ya da hemen arkasına indir."],
      ["Fazla ağır", "Sonuna kadar kontrollü indirebileceğin bir ağırlık seç."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 2 ila 3 set."],
    variations: [
      ["db-skull-crusher", "Dambıllarla, bileklere daha kolay."],
      ["incline-skull-crusher", "Daha uzun esneme için incline sehpada."],
      ["jm-press", "Skull crusher ile dar tutuş press arası."],
    ],
    faq: [
      [
        "Skull crusher dirseklere zararlı mı?",
        "Bazı dirsekleri rahatsız edebilir. Ağrı yaparsa ağırlığı azalt, dambıl dene ya da kablo çalışmasına geç.",
      ],
      ["EZ bar mı, düz bar mı?", "EZ bar bileklere daha kolay gelir."],
    ],
  },
  "close-grip-bench": {
    intro:
      "Close-grip bench press, ellerin yaklaşık omuz genişliğinde olduğu bir bench press'tir. Ağır kaldırmana yine izin verirken işin daha büyük kısmını arka kola kaydırır.",
    mistakes: [
      ["Tutuşun fazla dar olması", "Yaklaşık omuz genişliği. Ellerin birbirine değmesi bilekleri acıtır."],
      ["Dirseklerin yana açılması", "Dirseklerini yanlarına yakın topla."],
      ["Fazla yükseğe değdirmek", "Alt göğsüne indir."],
    ],
    sets: ["**Kuvvet:** 5 ila 8 tekrardan 3 ila 4 set.", "**Kas:** 8 ila 12 tekrardan 3 set."],
    variations: [
      ["bench-press", "Daha geniş tutuş, daha çok göğüs."],
      ["db-close-press", "Birbirine bastırılmış dambıllar."],
      ["diamond-push-up", "Vücut ağırlığı versiyonu."],
    ],
    faq: [
      ["Göğüs egzersizi mi, arka kol egzersizi mi?", "İkisi de; normal bench press'e göre daha çok arka kol."],
      ["Bench'imden ne kadar az?", "Genelde yaklaşık %10 ila 15 daha az."],
    ],
  },
  "preacher-curl": {
    intro:
      "Preacher curl'de üst kollarını açılı bir pede dayar ve EZ barla curl yaparsın. Ped savurmanı engeller ve pazuyu dipte, esnemede yoğun yükler.",
    mistakes: [
      ["Tam esnemeye inmemek", "Kolların neredeyse düzleşene kadar kontrollü indir."],
      ["Dirsekleri pedden kaldırmak", "Üst kollarını pedin üstünde düz tut."],
      ["Dibe düşer gibi inmek", "İnişin esnemenin olduğu son kısmını yavaşlat."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 2 ila 3 set."],
    variations: [
      ["db-preacher-curl", "Dambılla tek kol."],
      ["machine-preacher-curl", "Sabit bir yol, zorlamak kolay."],
      ["cable-preacher-curl", "Tepede de gerginlik."],
    ],
    faq: [
      ["Preacher curl ayakta curl'den daha mı iyi?", "Formu daha sıkıdır ve esnemiş pozisyonu daha çok yükler. İkisi de pazu geliştirir."],
      ["Dipte neden ağrıyor?", "Daha hafif git ve yavaşla. Dirseklerin itiraz ederse tam kilitlemeden önce dur."],
    ],
  },
  "power-clean": {
    intro:
      "Power clean'de barı yerden tek ve hızlı bir hareketle çekip omuzlarının önünde karşılarsın. Spor ve sıçramalar için patlayıcı kalça gücü kazandırır; kalçayı, arka bacağı, trapezi ve üst sırtı birlikte çalıştırır.",
    mistakes: [
      [
        "Kollarla erken çekmek",
        "Kalçan ve dizlerin tam açılana kadar kollarını halat gibi uzun tut. Sonra omuzlarını silkip barın altına gir.",
      ],
      ["Barı vücuttan uzaklaştırmak", "Barı uyluklarını sıyıracak kadar yakın tut. Öne doğru yay çizerse dengeni bozar."],
      ["Dirsekler aşağıdayken karşılamak", "Dirseklerini hızla öne çıkar ki bar ellerine değil omuzlarına otursun."],
    ],
    sets: [
      "**Güç:** 2 ila 3 tekrardan 4 ila 6 set, tam dinlenerek. Tekrarlar yavaşlayınca seti bitir.",
      "**Öğrenirken:** boş bar ya da hafif plakalarla 2 tekrardan 5 set, önce asılı pozisyondan.",
    ],
    variations: [
      ["hang-clean", "Uyluklardan başlar: karşılamayı öğrenmenin en kolay yolu."],
      ["db-hang-clean", "Dambılla; bar ya da lastik plaka yoksa."],
      ["clean-and-jerk", "Baş üstüne silkmeyi ekle: tam olimpik kaldırış."],
    ],
    faq: [
      [
        "Power clean yeni başlayanlar için uygun mu?",
        "Hafif öğrenirsen evet. Boş barla asılı pozisyondan başla, bar yakın geçtiği ve karşılama temiz olduğu sürece ağırlık ekle. Öğrenirken sprintler ve [kutu sıçraması](/exercises/box-jump/) da güç kazandırır.",
      ],
      [
        "Power clean ile clean arasındaki fark ne?",
        "Power clean'de barı paralelin üstünde, çeyrek squatta karşılarsın. Tam clean'de derin bir ön squata inersin; daha fazla ağırlık kaldırırsın ama daha çok hareket açıklığı gerekir.",
      ],
      [
        "Evde power clean yapabilir miyim?",
        "Sadece bar, lastik plakalar ve düşen bara dayanacak bir zemin varsa. Yoksa [dambıl hang clean](/exercises/db-hang-clean/) ya da [kettlebell swing](/exercises/kb-swing/) dene.",
      ],
    ],
  },
  "db-rdl": {
    intro:
      "Dambıl Romanian deadlift'te her elinde bir dambılla kalçadan katlanır, arka bacağın gerilene kadar dambılları bacaklarının önünden indirirsin. Bara göre daha az ağırlıkla arka bacağı ve kalçayı geliştirir, bir çift dambılla evde de yapılır.",
    mistakes: [
      ["Dizleri squat gibi bükmek", "Dizlerini hafif ve hep aynı açıda bükülü tut, kalçanı arkandaki duvara doğru it."],
      [
        "Daha aşağı inmek için sırtı yuvarlamak",
        "Arka bacağın tamamen gerildiğinde dur; genelde dizin hemen altı. Hareket omurgadan değil kalçadan gelir.",
      ],
      [
        "Dambılların öne kaymasına izin vermek",
        "Onları uyluklarına ve kaval kemiğine yakın kaydır. Ne kadar uzaklaşırlarsa bel o kadar çok çalışır.",
      ],
    ],
    sets: [
      "**Kas:** 8 ila 12 tekrardan 3 ila 4 set, yaklaşık üç saniyede indirerek.",
      "**Evde hafif dambıllarla:** 15 ila 20 tekrardan 3 set ya da tek bacakla.",
    ],
    variations: [
      ["romanian-deadlift", "Barla, daha ağır yükler için."],
      ["db-single-leg-rdl", "Tek bacakla; denge için ve bacak başına iki kat yük."],
      ["kb-romanian-deadlift", "İki elle tutulan tek bir kettlebell."],
    ],
    faq: [
      [
        "Dambıl Romanian deadlift hangi kasları çalıştırır?",
        "Başta arka bacağı ve kalçayı; bel kasları omurgayı sabit tutar, ön kollar dambılları taşır. Arka bacağı gerilmişken yüklediği için kas gelişimine çok iyi gelir.",
      ],
      [
        "Dambıl mı bar mı?",
        "İkisi de aynı kasları çalıştırır. Bar daha ağır kaldırmanı sağlar; dambıllar daha hızlı hazırlanır, bileklere daha nazik ve evde de olur. 8 ila 12 zorlu tekrar için yeterince yükleyebildiğini seç.",
      ],
      [
        "Dambıllar ne kadar ağır olmalı?",
        "Sırtın düz kalırken her setin son iki tekrarı zor gelecek kadar. Önce kavrayışın bırakıyorsa kayış kullan ya da [bar versiyonuna](/exercises/romanian-deadlift/) geç.",
      ],
    ],
  },
  "back-extension": {
    intro:
      "Back extension'da üst gövdeni bir pedin üzerinden indirir ve vücudun düz olana kadar geri kaldırırsın. Omurgaya az yük bindirerek beli, kalçayı ve arka bacağı güçlendirir; ağır squat ve deadlift'e iyi bir eştir.",
    mistakes: [
      [
        "Tepede fazla geriye bükülmek",
        "Vücudun düz bir çizgi olunca dur. Daha ileri gitmek bir şeyi daha fazla çalıştırmadan sadece beli sıkıştırır.",
      ],
      ["Altta sekmek", "Yavaş in, akıcı kalk. Momentum işi kaslardan alır."],
      ["Pedi çok yüksek ayarlamak", "Pedi kalça kemiklerinin hemen altına koy ki kalçadan rahatça katlanabilesin."],
    ],
    sets: [
      "**Kas ve güç:** 10 ila 15 tekrardan 3 set; 15 kolaylaşınca bir plaka ya da dambıl tut.",
      "**Sırt sağlığı:** yavaş 15 ila 20 tekrardan 2 ila 3 set ya da 20 ila 30 saniyelik bir [tutuş](/exercises/back-extension-hold/).",
    ],
    variations: [
      ["weighted-back-extension", "Zorlaştırmak için göğsüne bir ağırlık tut."],
      ["back-extension-hold", "Hareket etmek yerine düz pozisyonda kal."],
      ["reverse-hyper-bench", "Üst gövde yerine bacaklar hareket eder."],
    ],
    faq: [
      [
        "Back extension bel için iyi mi?",
        "Evet. Düz çizgiye kadar yavaşça yapıldığında omurga boyunca uzanan kaslara dayanıklılık kazandırır, böylece uzun günlere ve ağır kaldırışlara daha iyi dayanırlar. Belinde keskin bir ağrı varken yapma, geçmezse bir uzmana danış.",
      ],
      [
        "Back extension kalçayı çalıştırır mı?",
        "Evet. Üst sırtını hafifçe yuvarla, ayak uçlarını dışa çevir ve kalkarken kalçanı sık; böylece kalça belden daha çok çalışır.",
      ],
      [
        "Back extension sehpası yoksa ne yapabilirim?",
        "[Hip thrust](/exercises/hip-thrust/) ya da [Romanian deadlift](/exercises/romanian-deadlift/) aynı kasları çalıştırır; yüzüstü yatıp göğsünü kaldırmak da ekipmansız beli çalıştırır.",
      ],
    ],
  },
  "cable-pull-through": {
    intro:
      "Kablo pull-through'da alçak bir kabloya sırtını dönersin, ip bacaklarının arasındayken kalçadan katlanır ve kalçanı öne iterek doğrulursun. Kalça menteşesini öğretir ve omurgaya yük bindirmeden kalçayı ve arka bacağı çalıştırır; yeni başlayanlara ve yorgun sırtlara uygundur.",
    mistakes: [
      ["Menteşe yerine çömelmek", "Kalçanı düz geriye it, kaval kemiklerin neredeyse dik kalsın. Dizler sadece biraz bükülür."],
      ["Kollarla çekmek", "Kolların sadece ipi tutar. Kalçanı öne iterek doğrul."],
      ["Tepede geriye yaslanmak", "Kalçan sıkılı, kaburgaların aşağıda dik bitir; beli bükerek değil."],
    ],
    sets: [
      "**Kas:** 12 ila 15 tekrardan 3 set, tepede bir saniye sıkarak.",
      "**Menteşeyi öğrenmek:** deadlift ya da swing öncesi 10 tekrardan 2 ila 3 hafif set.",
    ],
    variations: [
      ["band-pull-through", "Alçağa bağlanmış bir bantla, ev için."],
      ["kb-swing", "Aynı kalça itişi, hızlı ve kettlebell ile."],
      ["hip-thrust", "Sırtın sehpadayken daha ağır kalça çalışması."],
    ],
    faq: [
      [
        "Kablo pull-through hangi kasları çalıştırır?",
        "Kalçayı ve arka bacağı. Kablo seni geriye çektiği için kalça, deadlift'in kolaylaştığı en tepeye kadar çalışır.",
      ],
      [
        "Pull-through mu kettlebell swing mi?",
        "Pull-through daha yavaş ve öğrenmesi kolay; swing daha hızlı ve kondisyon da katar. Menteşeyi pull-through ile öğren, sonra [swing](/exercises/kb-swing/) ekle.",
      ],
      ["Kablodan ne kadar uzakta durmalıyım?", "Yaklaşık iki büyük adım; böylece her tekrarın altında ağırlık yığına değmez."],
    ],
  },
  "reverse-crunch": {
    intro:
      "Reverse crunch'ta sırtüstü yatıp kalçanı yerden göğsüne doğru kıvırırsın. Karın kaslarını, en çok da alt karnı çalıştırır ve boynu zorlamaz. Ekipman gerekmez.",
    mistakes: [
      ["Bacakları sallamak", "Dizlerini aynı açıda bükülü tut ve bacaklarını fırlatmak yerine kalçanı karın kaslarınla kaldır."],
      [
        "Kalçayı kaldırmamak",
        "Kuyruk sokumun yerden kalkınca tekrar sayılır. Sadece dizleri çekmek çoğunlukla kalça bükücüleri çalıştırır.",
      ],
      ["Hızla geri düşmek", "İki üç saniyede in. Yavaş iniş işin yarısını yapar."],
    ],
    sets: [
      "**Karın:** yavaş 10 ila 15 tekrardan 3 set.",
      "**Daha zor:** decline sehpada yap ya da [barfiks barında bacak kaldırmaya](/exercises/hanging-leg-raise/) geç.",
    ],
    variations: [
      ["bench-reverse-crunch", "Sehpada, kenarını tutarak, daha geniş hareket için."],
      ["cable-reverse-crunch", "Kablo, zamanla artırabileceğin bir yük ekler."],
      ["hanging-leg-raise", "Bardan asılarak: en zor versiyon."],
    ],
    faq: [
      [
        "Reverse crunch alt karnı çalıştırır mı?",
        "Kaburgalardan leğene uzanan düz karın kasının tamamını çalıştırır. Leğeni kıvırmak alt kısma daha çok yük bindirir, bu yüzden aşağıda hissedersin.",
      ],
      [
        "Reverse crunch mu normal crunch mı?",
        "Reverse crunch boyna daha nazik ve momentumla hile yapmak daha zor. Reverse crunch ile [plank](/exercises/plank/) birlikte karnı iyi kapsar.",
      ],
      [
        "Reverse crunch karnımı düzleştirir mi?",
        "Karın kaslarını güçlendirir ama yağ kaybı tek bir bölgeyi çalıştırmaktan değil, ne yediğinden ve genel olarak ne kadar hareket ettiğinden gelir.",
      ],
    ],
  },
  "pec-deck": {
    intro:
      "Pec deck fly'da bir makineye oturur ve iki tutamağı göğsünün önünde bir yay çizerek birleştirirsin. Yolu makine belirlediği için ağırlıkları dengelemeden göğsü sıkı çalıştırabilirsin; preslerden sonra güvenli bir bitiriş.",
    mistakes: [
      ["Omuzların öne kayması", "Set boyunca göğsünü yukarıda, kürek kemiklerini pede doğru geride tut."],
      ["Koltuk çok yüksek ya da alçak", "Tutamaklar göğüs hizasında, dirseklerin omuzlarının biraz altında olacak şekilde ayarla."],
      ["Ağırlık yığınını çarptırmak", "Plakalar birbirine değmeden hemen önce dur ki göğüs tekrarlar arasında gergin kalsın."],
    ],
    sets: [
      "**Kas:** 10 ila 15 tekrardan 3 set, eller buluşunca bir saniye sıkarak.",
      "**Bitiriş:** preslerden sonra 15 ila 20 tekrardan 1 ila 2 set.",
    ],
    variations: [
      ["cable-fly", "Kabloyla; serbest yol ve daha çok gerilme."],
      ["db-fly", "Düz sehpada dambıllarla."],
      ["single-arm-pec-deck", "Tek kolla; iki tarafı eşitlemek için."],
    ],
    faq: [
      [
        "Pec deck hangi kasları çalıştırır?",
        "Başta göğsü. Kolları vücudun önüne getirme görevini çalıştırır; preslerin aksine arka kol neredeyse yardım etmez.",
      ],
      [
        "Pec deck mi kablo fly mı?",
        "İkisi de iyi. Pec deck daha kolay ayarlanır ve çok sabittir; kablo açıyı değiştirmeni sağlar. Salonunda hangisi boşsa onu kullan.",
      ],
      [
        "Pec deck omuzlara zararlı mı?",
        "Makul bir açıklıkla değil. Dirseklerin vücudunla aynı hizaya gelince gerilmeyi bitir, çok geriye götürme ve kürek kemiklerini geride tut.",
      ],
    ],
  },
  "machine-shoulder-press": {
    intro:
      "Makinede shoulder press'te sırtını bir pede dayayıp iki tutamağı sabit bir yolda başının üstüne itersin. Denge gerektirmeden ön omuzları ve arka kolu çalıştırır, böylece tükenişe güvenle yaklaşabilirsin.",
    mistakes: [
      ["Peden ayrılıp beli bükmek", "Sırtını ve başını pede dayalı tut. Tekrarı bitirmek için belini bükmen gerekiyorsa ağırlık fazla."],
      [
        "Koltuğu yanlış ayarlamak",
        "Tutamaklar yaklaşık omuz hizasında başlayacak şekilde ayarla. Çok alçak altta omzu zorlar; çok yüksek hareketi kısaltır.",
      ],
      ["Tepede sekmek", "Kollar neredeyse düzleşene kadar akıcı it ve kontrollü indir."],
    ],
    sets: ["**Kas:** 8 ila 12 tekrardan 3 ila 4 set.", "**Serbest ağırlıkla presten sonra:** 12 ila 15 tekrardan 2 set."],
    variations: [
      ["db-shoulder-press", "Dambıllarla; her kol kendi başına."],
      ["overhead-press", "Ayakta bar pres, güç hareketi."],
      ["single-arm-shoulder-press-machine", "Aynı makinede tek kolla."],
    ],
    faq: [
      [
        "Makinede shoulder press hangi kasları çalıştırır?",
        "Başta ön omuzları ve arka kolu; yan omuzlar da yardım eder. Daha geniş görünen omuzlar için [yana açış](/exercises/lateral-raise/) ekle.",
      ],
      [
        "Makine mi dambıl mı?",
        "Makine öğrenmesi ve güvenle zorlaması daha kolay; dambıllar dengeyi de çalıştırır ve her kolu serbest bırakır. İkisi de omuz geliştirir.",
      ],
      [
        "Hangi tutamakları kullanmalıyım?",
        "Avuçların birbirine baktığı nötr tutamaklar çoğu omza daha nazik. Düz tutamaklar rahat geliyorsa onları kullan.",
      ],
    ],
  },
  "straight-arm-pulldown": {
    intro:
      "Düz kol pulldown'da yüksek bir kabloya dönük durur ve kolların neredeyse düzken barı uyluklarına kadar indirirsin. Pazu yardımı olmadan kanat kaslarını izole eder; barfiks öncesi iyi bir ısınma ve kanat kaslarının çalıştığını hissetmenin kolay bir yolu.",
    mistakes: [
      [
        "Dirsekleri bükmek",
        "Hafif ve değişmeyen bir büküm tut. Dirsekler her tekrarda daha çok bükülüyorsa hareket arka kol pushdown'una döner.",
      ],
      ["Tüm vücudu kullanmak", "Hafifçe öne eğil ve o pozisyonu koru. Kollar hareket eder, gövde etmez."],
      ["Tepede hareketi kısaltmak", "Kanat kaslarının gerildiğini hissedene kadar kollarını kaldır, sonra aşağı indir."],
    ],
    sets: ["**Kas:** 12 ila 15 tekrardan 3 set.", "**Çekiş ısınması:** barfiks ya da kürek öncesi 15 tekrardan 2 hafif set."],
    variations: [
      ["rope-straight-arm-pulldown", "İple; ellerin kalçanı geçebilsin diye."],
      ["db-pullover", "Sehpada yatarak bir dambılla."],
      ["band-straight-arm-pulldown", "Yükseğe bağlanmış bir bantla, ev için."],
    ],
    faq: [
      [
        "Düz kol pulldown hangi kasları çalıştırır?",
        "Başta kanat kaslarını; arka kolun uzun başı ve karın kasları kolları ve gövdeyi sabit tutar.",
      ],
      [
        "Düz kol pulldown mu lat pulldown mı?",
        "[Lat pulldown](/exercises/lat-pulldown/) daha ağır çalışma içindir ve pazuyu da çalıştırır; düz kol pulldown kanat kaslarını izole eder. Aynı antrenmanda iyi eşleşirler.",
      ],
      ["Bar mı ip mi?", "Düz bar daha sabittir. İp ellerinin açılıp kalçanı geçmesine izin verir, bu da hareketi biraz uzatır."],
    ],
  },
};
