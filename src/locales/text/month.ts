import type { Message } from "@/lib/i18n";

// Text for keys starting "month.", in every language: the monthly challenge for everyone (src/lib/monthly.ts,
// MonthChallenge.tsx; docs/decisions/friends.md). English is the source: add a key here first.

export const en = {
  "month.title": "Challenge of the month",
  "month.goal.workouts": { one: "{month}: finish {count} workout", other: "{month}: finish {count} workouts" },
  "month.goal.sets": { one: "{month}: log {count} set", other: "{month}: log {count} sets" },
  "month.goal.minutes": { one: "{month}: train for {count} minute", other: "{month}: train for {count} minutes" },
  "month.unit.workouts": { one: "{count} workout", other: "{count} workouts" },
  "month.unit.sets": { one: "{count} set", other: "{count} sets" },
  "month.unit.minutes": { one: "{count} minute", other: "{count} minutes" },
  "month.left": { one: "{count} day left", other: "{count} days left" },
  "month.toGo": "{left} to go: about {per} a week finishes it.",
  "month.done": "Finished. The {month} medal is yours.",
  "month.everyone":
    "The same challenge for every lifter, new each month. Finishing earns that month's medal and counts toward the Monthly challenger badge.",
  "month.medals": "Medals",
  "month.medal": "{month}, finished",
  "month.friends": "Friends on this month’s challenge",
  "month.friendsHint": "From workouts posted to Friends, so it can trail what’s on your phone.",
  "month.finished": "Finished",
  "month.finishers": { one: "{n} lifter has finished it so far.", other: "{n} lifters have finished it so far." },
  "month.finishersDone": { one: "{n} lifter has finished it, you included.", other: "{n} lifters have finished it, you included." },
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "month.title": "Reto del mes",
  "month.goal.workouts": { one: "{month}: termina {count} entrenamiento", other: "{month}: termina {count} entrenamientos" },
  "month.goal.sets": { one: "{month}: registra {count} serie", other: "{month}: registra {count} series" },
  "month.goal.minutes": { one: "{month}: entrena {count} minuto", other: "{month}: entrena {count} minutos" },
  "month.unit.workouts": { one: "{count} entrenamiento", other: "{count} entrenamientos" },
  "month.unit.sets": { one: "{count} serie", other: "{count} series" },
  "month.unit.minutes": { one: "{count} minuto", other: "{count} minutos" },
  "month.left": { one: "Queda {count} día", other: "Quedan {count} días" },
  "month.toGo": "Faltan {left}: con unos {per} por semana lo terminas.",
  "month.done": "Terminado. La medalla de {month} es tuya.",
  "month.everyone": "El mismo reto para todos, nuevo cada mes. Terminarlo te da la medalla del mes y cuenta para la insignia Reto del mes.",
  "month.medals": "Medallas",
  "month.medal": "{month}, terminado",
  "month.friends": "Amigos en el reto de este mes",
  "month.friendsHint": "Según los entrenamientos publicados en Amigos, así que puede ir por detrás de lo que hay en tu teléfono.",
  "month.finished": "Terminado",
  "month.finishers": { one: "{n} persona lo ha completado hasta ahora.", other: "{n} personas lo han completado hasta ahora." },
  "month.finishersDone": { one: "{n} persona lo ha completado, tú incluido.", other: "{n} personas lo han completado, tú incluido." },
};

export const fr: Partial<Record<Key, Message>> = {
  "month.title": "Défi du mois",
  "month.goal.workouts": { one: "{month} : terminez {count} séance", other: "{month} : terminez {count} séances" },
  "month.goal.sets": { one: "{month} : enregistrez {count} série", other: "{month} : enregistrez {count} séries" },
  "month.goal.minutes": { one: "{month} : entraînez-vous {count} minute", other: "{month} : entraînez-vous {count} minutes" },
  "month.unit.workouts": { one: "{count} séance", other: "{count} séances" },
  "month.unit.sets": { one: "{count} série", other: "{count} séries" },
  "month.unit.minutes": { one: "{count} minute", other: "{count} minutes" },
  "month.left": { one: "{count} jour restant", other: "{count} jours restants" },
  "month.toGo": "Encore {left} : environ {per} par semaine et c’est fait.",
  "month.done": "Terminé. La médaille de {month} est à vous.",
  "month.everyone":
    "Le même défi pour tout le monde, nouveau chaque mois. Le réussir vous donne la médaille du mois et compte pour le badge Défi du mois.",
  "month.medals": "Médailles",
  "month.medal": "{month}, réussi",
  "month.friends": "Vos amis sur le défi du mois",
  "month.friendsHint": "D’après les séances publiées dans Amis, donc parfois en retard sur votre téléphone.",
  "month.finished": "Réussi",
  "month.finishers": { one: "{n} personne l’a terminé pour l’instant.", other: "{n} personnes l’ont terminé pour l’instant." },
  "month.finishersDone": { one: "{n} personne l’a terminé, vous compris.", other: "{n} personnes l’ont terminé, vous compris." },
};

export const de: Partial<Record<Key, Message>> = {
  "month.title": "Challenge des Monats",
  "month.goal.workouts": { one: "{month}: {count} Training schaffen", other: "{month}: {count} Trainings schaffen" },
  "month.goal.sets": { one: "{month}: {count} Satz eintragen", other: "{month}: {count} Sätze eintragen" },
  "month.goal.minutes": { one: "{month}: {count} Minute trainieren", other: "{month}: {count} Minuten trainieren" },
  "month.unit.workouts": { one: "{count} Training", other: "{count} Trainings" },
  "month.unit.sets": { one: "{count} Satz", other: "{count} Sätze" },
  "month.unit.minutes": { one: "{count} Minute", other: "{count} Minuten" },
  "month.left": { one: "Noch {count} Tag", other: "Noch {count} Tage" },
  "month.toGo": "Noch {left}: mit etwa {per} pro Woche schaffst du es.",
  "month.done": "Geschafft. Die Medaille für {month} gehört dir.",
  "month.everyone":
    "Dieselbe Challenge für alle, jeden Monat neu. Wer sie schafft, bekommt die Medaille des Monats, und sie zählt für das Abzeichen Monatschallenge.",
  "month.medals": "Medaillen",
  "month.medal": "{month}, geschafft",
  "month.friends": "Freunde bei der Challenge des Monats",
  "month.friendsHint": "Aus den Trainings, die in Freunde gepostet wurden, daher manchmal hinter deinem Handy.",
  "month.finished": "Geschafft",
  "month.finishers": { one: "{n} Person hat es bisher geschafft.", other: "{n} Leute haben es bisher geschafft." },
  "month.finishersDone": {
    one: "{n} Person hat es geschafft, du eingeschlossen.",
    other: "{n} Leute haben es geschafft, du eingeschlossen.",
  },
};

export const it: Partial<Record<Key, Message>> = {
  "month.title": "Sfida del mese",
  "month.goal.workouts": { one: "{month}: completa {count} allenamento", other: "{month}: completa {count} allenamenti" },
  "month.goal.sets": { one: "{month}: registra {count} serie", other: "{month}: registra {count} serie" },
  "month.goal.minutes": { one: "{month}: allenati per {count} minuto", other: "{month}: allenati per {count} minuti" },
  "month.unit.workouts": { one: "{count} allenamento", other: "{count} allenamenti" },
  "month.unit.sets": { one: "{count} serie", other: "{count} serie" },
  "month.unit.minutes": { one: "{count} minuto", other: "{count} minuti" },
  "month.left": { one: "Manca {count} giorno", other: "Mancano {count} giorni" },
  "month.toGo": "Ne mancano {left}: con circa {per} a settimana la completi.",
  "month.done": "Completata. La medaglia di {month} è tua.",
  "month.everyone":
    "La stessa sfida per tutti, nuova ogni mese. Completarla ti dà la medaglia del mese e conta per il badge Sfida del mese.",
  "month.medals": "Medaglie",
  "month.medal": "{month}, completata",
  "month.friends": "Amici nella sfida di questo mese",
  "month.friendsHint": "Dagli allenamenti pubblicati in Amici, quindi può restare indietro rispetto al telefono.",
  "month.finished": "Completata",
  "month.finishers": { one: "{n} persona l’ha completata finora.", other: "{n} persone l’hanno completata finora." },
  "month.finishersDone": { one: "{n} persona l’ha completata, tu compreso.", other: "{n} persone l’hanno completata, tu compreso." },
};

export const ja: Partial<Record<Key, Message>> = {
  "month.title": "今月のチャレンジ",
  "month.goal.workouts": { other: "{month}:ワークアウトを{count}回" },
  "month.goal.sets": { other: "{month}:{count}セットを記録" },
  "month.goal.minutes": { other: "{month}:{count}分トレーニング" },
  "month.unit.workouts": { other: "ワークアウト{count}回" },
  "month.unit.sets": { other: "{count}セット" },
  "month.unit.minutes": { other: "{count}分" },
  "month.left": { other: "残り{count}日" },
  "month.toGo": "あと{left}:週に{per}ほどで達成できます。",
  "month.done": "達成しました。{month}のメダルを獲得です。",
  "month.everyone":
    "毎月変わる、全員共通のチャレンジです。達成するとその月のメダルがもらえ、マンスリーチャレンジャーのバッジにも加算されます。",
  "month.medals": "メダル",
  "month.medal": "{month}、達成",
  "month.friends": "今月のチャレンジに挑む友達",
  "month.friendsHint": "フレンドに投稿されたワークアウトから集計するため、スマホの記録より遅れることがあります。",
  "month.finished": "達成",
  "month.finishers": { other: "これまでに{n}人が達成しました。" },
  "month.finishersDone": { other: "あなたを含め{n}人が達成しました。" },
};

export const pt: Partial<Record<Key, Message>> = {
  "month.title": "Desafio do mês",
  "month.goal.workouts": {
    one: "{month}: conclua {count} treino",
    other: "{month}: conclua {count} treinos",
  },
  "month.goal.sets": {
    one: "{month}: registre {count} série",
    other: "{month}: registre {count} séries",
  },
  "month.goal.minutes": {
    one: "{month}: treine {count} minuto",
    other: "{month}: treine {count} minutos",
  },
  "month.unit.workouts": {
    one: "{count} treino",
    other: "{count} treinos",
  },
  "month.unit.sets": {
    one: "{count} série",
    other: "{count} séries",
  },
  "month.unit.minutes": {
    one: "{count} minuto",
    other: "{count} minutos",
  },
  "month.left": {
    one: "Falta {count} dia",
    other: "Faltam {count} dias",
  },
  "month.toGo": "Faltam {left}: cerca de {per} por semana completa o desafio.",
  "month.done": "Concluído. A medalha de {month} é sua.",
  "month.everyone":
    "O mesmo desafio para todo mundo, novo a cada mês. Concluir rende a medalha do mês e conta para a medalha Desafiante mensal.",
  "month.medals": "Medalhas",
  "month.medal": "{month}, concluído",
  "month.friends": "Amigos no desafio deste mês",
  "month.friendsHint": "Dos treinos publicados em Amigos, então pode ficar atrás do que está no seu celular.",
  "month.finished": "Concluído",
  "month.finishers": {
    one: "{n} pessoa concluiu até agora.",
    other: "{n} pessoas concluíram até agora.",
  },
  "month.finishersDone": {
    one: "{n} pessoa concluiu, incluindo você.",
    other: "{n} pessoas concluíram, incluindo você.",
  },
};

export const ko: Partial<Record<Key, Message>> = {
  "month.title": "이달의 챌린지",
  "month.goal.workouts": {
    other: "{month}: 운동 {count}번 완료",
  },
  "month.goal.sets": {
    other: "{month}: {count}세트 기록",
  },
  "month.goal.minutes": {
    other: "{month}: {count}분 운동",
  },
  "month.unit.workouts": {
    other: "운동 {count}번",
  },
  "month.unit.sets": {
    other: "{count}세트",
  },
  "month.unit.minutes": {
    other: "{count}분",
  },
  "month.left": {
    other: "{count}일 남음",
  },
  "month.toGo": "{left} 남았어요. 주당 약 {per}이면 완료해요.",
  "month.done": "완료했어요. {month} 메달을 받았어요.",
  "month.everyone": "모든 사용자에게 같은 챌린지가 매달 새로 나와요. 완료하면 그달의 메달을 받고 월간 챌린저 배지에 반영돼요.",
  "month.medals": "메달",
  "month.medal": "{month}, 완료",
  "month.friends": "이달의 챌린지에 참여 중인 친구",
  "month.friendsHint": "친구에 올린 운동 기준이라 휴대폰 기록보다 늦을 수 있어요.",
  "month.finished": "완료",
  "month.finishers": {
    other: "지금까지 {n}명이 완료했어요.",
  },
  "month.finishersDone": {
    other: "나를 포함해 {n}명이 완료했어요.",
  },
};

export const tr: Partial<Record<Key, Message>> = {
  "month.title": "Ayın meydan okuması",
  "month.goal.workouts": {
    one: "{month}: {count} antrenman bitir",
    other: "{month}: {count} antrenman bitir",
  },
  "month.goal.sets": {
    one: "{month}: {count} set kaydet",
    other: "{month}: {count} set kaydet",
  },
  "month.goal.minutes": {
    one: "{month}: {count} dakika antrenman yap",
    other: "{month}: {count} dakika antrenman yap",
  },
  "month.unit.workouts": {
    one: "{count} antrenman",
    other: "{count} antrenman",
  },
  "month.unit.sets": {
    one: "{count} set",
    other: "{count} set",
  },
  "month.unit.minutes": {
    one: "{count} dakika",
    other: "{count} dakika",
  },
  "month.left": {
    one: "{count} gün kaldı",
    other: "{count} gün kaldı",
  },
  "month.toGo": "Kalan {left}: haftada yaklaşık {per} ile biter.",
  "month.done": "Tamamlandı. {month} madalyası senin.",
  "month.everyone":
    "Her sporcu için aynı meydan okuma, her ay yenisi. Tamamlamak o ayın madalyasını kazandırır ve Aylık meydan okuyucu rozetine sayılır.",
  "month.medals": "Madalyalar",
  "month.medal": "{month}, tamamlandı",
  "month.friends": "Bu ayın meydan okumasındaki arkadaşlar",
  "month.friendsHint": "Arkadaşlar'da paylaşılan antrenmanlardan, bu yüzden telefonundakinin gerisinde kalabilir.",
  "month.finished": "Tamamlandı",
  "month.finishers": {
    one: "Şu ana kadar {n} sporcu tamamladı.",
    other: "Şu ana kadar {n} sporcu tamamladı.",
  },
  "month.finishersDone": {
    one: "Sen dahil {n} sporcu tamamladı.",
    other: "Sen dahil {n} sporcu tamamladı.",
  },
};

export const pl: Partial<Record<Key, Message>> = {
  "month.title": "Wyzwanie miesiąca",
  "month.goal.workouts": {
    one: "{month}: ukończ {count} trening",
    few: "{month}: ukończ {count} treningi",
    many: "{month}: ukończ {count} treningów",
    other: "{month}: ukończ {count} treningu",
  },
  "month.goal.sets": {
    one: "{month}: zapisz {count} serię",
    few: "{month}: zapisz {count} serie",
    many: "{month}: zapisz {count} serii",
    other: "{month}: zapisz {count} serii",
  },
  "month.goal.minutes": {
    one: "{month}: trenuj przez {count} minutę",
    few: "{month}: trenuj przez {count} minuty",
    many: "{month}: trenuj przez {count} minut",
    other: "{month}: trenuj przez {count} minuty",
  },
  "month.unit.workouts": {
    one: "{count} trening",
    few: "{count} treningi",
    many: "{count} treningów",
    other: "{count} treningu",
  },
  "month.unit.sets": {
    one: "{count} seria",
    few: "{count} serie",
    many: "{count} serii",
    other: "{count} serii",
  },
  "month.unit.minutes": {
    one: "{count} minuta",
    few: "{count} minuty",
    many: "{count} minut",
    other: "{count} minuty",
  },
  "month.left": {
    one: "Został {count} dzień",
    few: "Zostały {count} dni",
    many: "Zostało {count} dni",
    other: "Zostało {count} dnia",
  },
  "month.toGo": "Brakuje: {left}. Około {per} tygodniowo i gotowe.",
  "month.done": "Ukończone. Medal za {month} jest twój.",
  "month.everyone":
    "To samo wyzwanie dla wszystkich, nowe co miesiąc. Ukończenie daje medal tego miesiąca i liczy się do odznaki Miesięczny pretendent.",
  "month.medals": "Medale",
  "month.medal": "{month}, ukończone",
  "month.friends": "Znajomi w tegomiesięcznym wyzwaniu",
  "month.friendsHint": "Na podstawie treningów publikowanych w Znajomych, więc może nie nadążać za tym, co masz w telefonie.",
  "month.finished": "Ukończone",
  "month.finishers": {
    one: "Do tej pory ukończyła je {n} osoba.",
    few: "Do tej pory ukończyły je {n} osoby.",
    many: "Do tej pory ukończyło je {n} osób.",
    other: "Do tej pory ukończyło je {n} osoby.",
  },
  "month.finishersDone": {
    one: "Ukończyła je {n} osoba, w tym ty.",
    few: "Ukończyły je {n} osoby, w tym ty.",
    many: "Ukończyło je {n} osób, w tym ty.",
    other: "Ukończyło je {n} osoby, w tym ty.",
  },
};
