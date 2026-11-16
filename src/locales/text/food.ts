import type { Message } from "@/lib/i18n";

// Text for keys starting "food.", in every language: the Food card on Body › Health (FoodCard.tsx). English is the
// source: add a key here first, then the other languages. A missing translation falls back to English.

export const en = {
  "food.title": "Food",
  "food.kcal": "{avg} of {target} kcal",
  "food.protein": "{avg} of {target} g protein",
  "food.carbs": "{avg} of {target} g carbs",
  "food.fat": "{avg} of {target} g fat",
  "food.notEnough": "A few more logged days and your week shows here.",
  "food.why.coach": "Daily averages this past week, against the targets {name} set.",
  "food.why.goal": "Daily averages this past week, against targets for your goal: {goal}.",
  "food.why.measured":
    "Daily averages this past week, against targets for your goal ({goal}) from your maintenance, measured over {days} days.",
  "food.open": "Open Macros",
  "food.connect": "Allow food from {source}",
  "food.connect.body":
    "Log meals in any food app that writes to {source}, such as MyFitnessPal or Cronometer. Coach's notes then check your protein and calories, and your maintenance is measured from what you really eat.",
  "food.connect.done": "Done. Food shows here after your next fully logged day in {source}.",
  "food.connect.hide": "Not now",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "food.title": "Comida",
  "food.kcal": "{avg} de {target} kcal",
  "food.protein": "{avg} de {target} g de proteína",
  "food.carbs": "{avg} de {target} g de carbohidratos",
  "food.fat": "{avg} de {target} g de grasa",
  "food.notEnough": "Con unos días más registrados, aquí verás tu semana.",
  "food.why.coach": "Medias diarias de esta semana, frente a los objetivos que fijó {name}.",
  "food.why.goal": "Medias diarias de esta semana, frente a los objetivos para tu meta: {goal}.",
  "food.why.measured":
    "Medias diarias de esta semana, frente a los objetivos para tu meta ({goal}) según tu mantenimiento, medido en {days} días.",
  "food.open": "Abrir Macros",
  "food.connect": "Permitir la comida de {source}",
  "food.connect.body":
    "Registra tus comidas en cualquier app que escriba en {source}, como MyFitnessPal o Cronometer. Las notas del entrenador revisarán tu proteína y tus calorías, y tu mantenimiento se medirá con lo que comes de verdad.",
  "food.connect.done": "Listo. La comida aparecerá aquí después de tu próximo día completo en {source}.",
  "food.connect.hide": "Ahora no",
};

export const fr: Partial<Record<Key, Message>> = {
  "food.title": "Alimentation",
  "food.kcal": "{avg} sur {target} kcal",
  "food.protein": "{avg} sur {target} g de protéines",
  "food.carbs": "{avg} sur {target} g de glucides",
  "food.fat": "{avg} sur {target} g de lipides",
  "food.notEnough": "Encore quelques jours notés et votre semaine s’affichera ici.",
  "food.why.coach": "Moyennes par jour cette semaine, comparées aux objectifs fixés par {name}.",
  "food.why.goal": "Moyennes par jour cette semaine, comparées aux objectifs de votre but : {goal}.",
  "food.why.measured":
    "Moyennes par jour cette semaine, comparées aux objectifs de votre but ({goal}) d’après votre maintien, mesuré sur {days} jours.",
  "food.open": "Ouvrir Macros",
  "food.connect": "Autoriser l’alimentation de {source}",
  "food.connect.body":
    "Notez vos repas dans une appli qui écrit dans {source}, comme MyFitnessPal ou Cronometer. Les notes du coach vérifieront alors vos protéines et vos calories, et votre maintien sera mesuré sur ce que vous mangez vraiment.",
  "food.connect.done": "C’est fait. L’alimentation s’affichera ici après votre prochain jour complet dans {source}.",
  "food.connect.hide": "Pas maintenant",
};

export const de: Partial<Record<Key, Message>> = {
  "food.title": "Ernährung",
  "food.kcal": "{avg} von {target} kcal",
  "food.protein": "{avg} von {target} g Protein",
  "food.carbs": "{avg} von {target} g Kohlenhydraten",
  "food.fat": "{avg} von {target} g Fett",
  "food.notEnough": "Noch ein paar erfasste Tage, dann siehst du hier deine Woche.",
  "food.why.coach": "Tagesschnitt dieser Woche, verglichen mit den Zielen von {name}.",
  "food.why.goal": "Tagesschnitt dieser Woche, verglichen mit den Zielen für dein Ziel: {goal}.",
  "food.why.measured":
    "Tagesschnitt dieser Woche, verglichen mit den Zielen für dein Ziel ({goal}) aus deinem Erhaltungsbedarf, gemessen über {days} Tage.",
  "food.open": "Makros öffnen",
  "food.connect": "Ernährung aus {source} erlauben",
  "food.connect.body":
    "Erfasse Mahlzeiten in einer App, die in {source} schreibt, etwa MyFitnessPal oder Cronometer. Die Coach-Notizen prüfen dann dein Protein und deine Kalorien, und dein Erhaltungsbedarf wird aus dem gemessen, was du wirklich isst.",
  "food.connect.done": "Erledigt. Deine Ernährung erscheint hier nach deinem nächsten vollständig erfassten Tag in {source}.",
  "food.connect.hide": "Nicht jetzt",
};

export const it: Partial<Record<Key, Message>> = {
  "food.title": "Alimentazione",
  "food.kcal": "{avg} su {target} kcal",
  "food.protein": "{avg} su {target} g di proteine",
  "food.carbs": "{avg} su {target} g di carboidrati",
  "food.fat": "{avg} su {target} g di grassi",
  "food.notEnough": "Ancora qualche giorno registrato e qui vedrai la tua settimana.",
  "food.why.coach": "Medie giornaliere di questa settimana, rispetto agli obiettivi fissati da {name}.",
  "food.why.goal": "Medie giornaliere di questa settimana, rispetto agli obiettivi per il tuo traguardo: {goal}.",
  "food.why.measured":
    "Medie giornaliere di questa settimana, rispetto agli obiettivi per il tuo traguardo ({goal}) dal tuo mantenimento, misurato su {days} giorni.",
  "food.open": "Apri Macro",
  "food.connect": "Consenti l'alimentazione da {source}",
  "food.connect.body":
    "Registra i pasti in un'app che scrive in {source}, come MyFitnessPal o Cronometer. Le note del coach controlleranno proteine e calorie, e il tuo mantenimento sarà misurato su quello che mangi davvero.",
  "food.connect.done": "Fatto. L'alimentazione comparirà qui dopo il tuo prossimo giorno registrato per intero in {source}.",
  "food.connect.hide": "Non ora",
};

export const ja: Partial<Record<Key, Message>> = {
  "food.title": "食事",
  "food.kcal": "{target} kcal中{avg}",
  "food.protein": "たんぱく質 {target} g中{avg}",
  "food.carbs": "炭水化物 {target} g中{avg}",
  "food.fat": "脂質 {target} g中{avg}",
  "food.notEnough": "あと数日記録すると、ここに1週間の様子が表示されます。",
  "food.why.coach": "この1週間の1日平均を、{name}が設定した目標と比べています。",
  "food.why.goal": "この1週間の1日平均を、目標「{goal}」の目安と比べています。",
  "food.why.measured": "この1週間の1日平均を、{days}日分から測った維持カロリーにもとづく目標「{goal}」の目安と比べています。",
  "food.open": "PFCバランスを開く",
  "food.connect": "{source}の食事データを許可",
  "food.connect.body":
    "MyFitnessPal や Cronometer など、{source}に書き込む食事アプリで記録しましょう。コーチのメモがたんぱく質とカロリーをチェックし、維持カロリーも実際の食事から測れるようになります。",
  "food.connect.done": "完了しました。{source}で次に1日分をすべて記録すると、ここに表示されます。",
  "food.connect.hide": "今はしない",
};

export const pt: Partial<Record<Key, Message>> = {
  "food.title": "Alimentação",
  "food.kcal": "{avg} de {target} kcal",
  "food.protein": "{avg} de {target} g de proteína",
  "food.carbs": "{avg} de {target} g de carboidratos",
  "food.fat": "{avg} de {target} g de gordura",
  "food.notEnough": "Mais alguns dias registrados e sua semana aparece aqui.",
  "food.why.coach": "Médias diárias da última semana, comparadas com as metas que {name} definiu.",
  "food.why.goal": "Médias diárias da última semana, comparadas com as metas para seu objetivo: {goal}.",
  "food.why.measured":
    "Médias diárias da última semana, comparadas com as metas para seu objetivo ({goal}) a partir da sua manutenção, medida em {days} dias.",
  "food.open": "Abrir Macros",
  "food.connect": "Permitir alimentação de {source}",
  "food.connect.body":
    "Registre refeições em qualquer app de alimentação que grave no {source}, como MyFitnessPal ou Cronometer. As Notas do coach passam a checar sua proteína e calorias, e sua manutenção é medida pelo que você come de verdade.",
  "food.connect.done": "Pronto. A alimentação aparece aqui depois do seu próximo dia totalmente registrado no {source}.",
  "food.connect.hide": "Agora não",
};

export const ko: Partial<Record<Key, Message>> = {
  "food.title": "식단",
  "food.kcal": "{avg} / {target} kcal",
  "food.protein": "단백질 {avg} / {target} g",
  "food.carbs": "탄수화물 {avg} / {target} g",
  "food.fat": "지방 {avg} / {target} g",
  "food.notEnough": "며칠만 더 기록하면 이번 주가 여기 표시돼요.",
  "food.why.coach": "지난 한 주의 하루 평균이에요. {name} 님이 정한 목표 기준이에요.",
  "food.why.goal": "지난 한 주의 하루 평균이에요. 목표({goal}) 기준이에요.",
  "food.why.measured": "지난 한 주의 하루 평균이에요. {days}일 동안 측정한 유지 칼로리를 바탕으로 목표({goal}) 기준이에요.",
  "food.open": "매크로 열기",
  "food.connect": "{source}에서 식단 가져오기 허용",
  "food.connect.body":
    "MyFitnessPal이나 Cronometer처럼 {source}에 기록하는 식단 앱이면 어디서든 식사를 기록하세요. 그러면 코치 노트가 단백질과 칼로리를 확인하고, 실제로 먹은 양으로 유지 칼로리를 측정해요.",
  "food.connect.done": "완료했어요. {source}에서 하루를 모두 기록하면 여기에 식단이 표시돼요.",
  "food.connect.hide": "나중에",
};

export const tr: Partial<Record<Key, Message>> = {
  "food.title": "Beslenme",
  "food.kcal": "{avg} / {target} kcal",
  "food.protein": "{avg} / {target} g protein",
  "food.carbs": "{avg} / {target} g karbonhidrat",
  "food.fat": "{avg} / {target} g yağ",
  "food.notEnough": "Birkaç gün daha kaydedince haftan burada görünür.",
  "food.why.coach": "Geçen haftanın günlük ortalamaları, {name} tarafından belirlenen hedeflere göre.",
  "food.why.goal": "Geçen haftanın günlük ortalamaları, hedefine göre belirlenen değerlerle: {goal}.",
  "food.why.measured":
    "Geçen haftanın günlük ortalamaları; hedefin ({goal}) için, {days} gün boyunca ölçülen koruma kalorinden hesaplanan değerlere göre.",
  "food.open": "Makroları aç",
  "food.connect": "{source} üzerinden beslenme verilerine izin ver",
  "food.connect.body":
    "Öğünlerini {source} uygulamasına yazan herhangi bir beslenme uygulamasında kaydet (MyFitnessPal ya da Cronometer gibi). Koç notları proteinini ve kalorini kontrol eder, koruma kalorin de gerçekte ne yediğinden ölçülür.",
  "food.connect.done": "Tamam. {source} üzerinde bir sonraki tam kayıtlı gününden sonra beslenme burada görünür.",
  "food.connect.hide": "Şimdi değil",
};

export const pl: Partial<Record<Key, Message>> = {
  "food.title": "Jedzenie",
  "food.kcal": "{avg} z {target} kcal",
  "food.protein": "{avg} z {target} g białka",
  "food.carbs": "{avg} z {target} g węglowodanów",
  "food.fat": "{avg} z {target} g tłuszczu",
  "food.notEnough": "Jeszcze kilka zapisanych dni, a pojawi się tu twój tydzień.",
  "food.why.coach": "Średnie dzienne z ostatniego tygodnia względem celów, które ustawia {name}.",
  "food.why.goal": "Średnie dzienne z ostatniego tygodnia względem celów dla twojego celu: {goal}.",
  "food.why.measured":
    "Średnie dzienne z ostatniego tygodnia względem celów dla twojego celu ({goal}) na podstawie twojego zapotrzebowania, zmierzonego w ciągu {days} dni.",
  "food.open": "Otwórz Makro",
  "food.connect": "Pozwól na dane o jedzeniu z {source}",
  "food.connect.body":
    "Zapisuj posiłki w dowolnej aplikacji, która zapisuje do {source}, np. MyFitnessPal lub Cronometer. Notatki trenera sprawdzą wtedy twoje białko i kalorie, a zapotrzebowanie zostanie zmierzone z tego, co naprawdę jesz.",
  "food.connect.done": "Gotowe. Jedzenie pojawi się tu po następnym w pełni zapisanym dniu w {source}.",
  "food.connect.hide": "Nie teraz",
};
