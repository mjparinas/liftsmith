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
