import type { Message } from "@/lib/i18n";

// Text for keys starting "wdg.", in every language: the home-screen widget (src/lib/widget.ts).
// English is the source: add a key here first, then its Spanish and French. A missing translation falls back to English.

export const en = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Start",
  "wdg.resume": "Resume",
  "wdg.log": "Log set",
  "wdg.activeWhy": "Your next set is ready. Log it here or open the workout.",
  "wdg.stale": "Open Liftsmith for today's plan.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} of {goal} this week. {count} more to hit your goal.",
    other: "{done} of {goal} this week. {count} more to hit your goal.",
  },
  "wdg.goalStreak": {
    one: "{done} of {goal} this week. {count} more keeps your {weeks}-week streak.",
    other: "{done} of {goal} this week. {count} more keep your {weeks}-week streak.",
  },
  "wdg.goalMet": "Weekly goal met: {done} of {goal}. Rest is training too.",
  "wdg.weekTitle": "{done} of {goal} this week",
  "wdg.streak": { one: "{count}-week streak", other: "{count}-week streak" },
  "wdg.weekKeep": {
    one: "{count} more day keeps your {weeks}-week streak.",
    other: "{count} more days keep your {weeks}-week streak.",
  },
  "wdg.weekMore": { one: "{count} more day hits your goal.", other: "{count} more days hit your goal." },
  "wdg.weekMet": "Goal met. Anything more is a bonus.",
  "wdg.ready": "Ready to train",
  "wdg.resting": "Still recovering",
  "wdg.allReady": "Everything has recovered. Any workout fits today.",
  "wdg.readyAt": "{name} · ready {time}",
  "wdg.area.chest": "Chest",
  "wdg.area.shoulders": "Shoulders",
  "wdg.area.back": "Back",
  "wdg.area.arms": "Arms",
  "wdg.area.core": "Core",
  "wdg.area.legs": "Legs",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Empezar",
  "wdg.resume": "Seguir",
  "wdg.log": "Registrar serie",
  "wdg.activeWhy": "Tu próxima serie está lista. Regístrala aquí o abre el entrenamiento.",
  "wdg.stale": "Abre Liftsmith para ver el plan de hoy.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} de {goal} esta semana. {count} más para cumplir tu objetivo.",
    other: "{done} de {goal} esta semana. {count} más para cumplir tu objetivo.",
  },
  "wdg.goalStreak": {
    one: "{done} de {goal} esta semana. {count} más mantiene tu racha de {weeks} semanas.",
    other: "{done} de {goal} esta semana. {count} más mantienen tu racha de {weeks} semanas.",
  },
  "wdg.goalMet": "Objetivo semanal cumplido: {done} de {goal}. Descansar también es entrenar.",
  "wdg.weekTitle": "{done} de {goal} esta semana",
  "wdg.streak": { one: "Racha de {count} semana", other: "Racha de {count} semanas" },
  "wdg.weekKeep": {
    one: "{count} día más mantiene tu racha de {weeks} semanas.",
    other: "{count} días más mantienen tu racha de {weeks} semanas.",
  },
  "wdg.weekMore": { one: "{count} día más para cumplir tu objetivo.", other: "{count} días más para cumplir tu objetivo." },
  "wdg.weekMet": "Objetivo cumplido. Lo que hagas de más es un extra.",
  "wdg.ready": "Listo para entrenar",
  "wdg.resting": "Aún recuperándose",
  "wdg.allReady": "Todo está recuperado. Cualquier entrenamiento vale hoy.",
  "wdg.readyAt": "{name} · listo {time}",
  "wdg.area.chest": "Pecho",
  "wdg.area.shoulders": "Hombros",
  "wdg.area.back": "Espalda",
  "wdg.area.arms": "Brazos",
  "wdg.area.core": "Core",
  "wdg.area.legs": "Piernas",
};

export const fr: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Commencer",
  "wdg.resume": "Reprendre",
  "wdg.log": "Noter la série",
  "wdg.activeWhy": "Votre prochaine série est prête. Notez-la ici ou ouvrez la séance.",
  "wdg.stale": "Ouvrez Liftsmith pour le plan du jour.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} sur {goal} cette semaine. Encore {count} pour atteindre votre objectif.",
    other: "{done} sur {goal} cette semaine. Encore {count} pour atteindre votre objectif.",
  },
  "wdg.goalStreak": {
    one: "{done} sur {goal} cette semaine. Encore {count} pour garder votre série de {weeks} semaines.",
    other: "{done} sur {goal} cette semaine. Encore {count} pour garder votre série de {weeks} semaines.",
  },
  "wdg.goalMet": "Objectif de la semaine atteint : {done} sur {goal}. Le repos fait aussi partie de l’entraînement.",
  "wdg.weekTitle": "{done} sur {goal} cette semaine",
  "wdg.streak": { one: "Série de {count} semaine", other: "Série de {count} semaines" },
  "wdg.weekKeep": {
    one: "Encore {count} jour pour garder votre série de {weeks} semaines.",
    other: "Encore {count} jours pour garder votre série de {weeks} semaines.",
  },
  "wdg.weekMore": {
    one: "Encore {count} jour pour atteindre votre objectif.",
    other: "Encore {count} jours pour atteindre votre objectif.",
  },
  "wdg.weekMet": "Objectif atteint. Le reste est un bonus.",
  "wdg.ready": "Prêt à travailler",
  "wdg.resting": "Encore en récupération",
  "wdg.allReady": "Tout est récupéré. Toute séance convient aujourd’hui.",
  "wdg.readyAt": "{name} · prêt {time}",
  "wdg.area.chest": "Pectoraux",
  "wdg.area.shoulders": "Épaules",
  "wdg.area.back": "Dos",
  "wdg.area.arms": "Bras",
  "wdg.area.core": "Gainage",
  "wdg.area.legs": "Jambes",
};

export const de: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} Min.",
  "wdg.start": "Start",
  "wdg.resume": "Fortsetzen",
  "wdg.log": "Satz eintragen",
  "wdg.activeWhy": "Dein nächster Satz ist bereit. Trag ihn hier ein oder öffne das Training.",
  "wdg.stale": "Öffne Liftsmith für den heutigen Plan.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} von {goal} diese Woche. Noch {count} bis zu deinem Ziel.",
    other: "{done} von {goal} diese Woche. Noch {count} bis zu deinem Ziel.",
  },
  "wdg.goalStreak": {
    one: "{done} von {goal} diese Woche. Noch {count}, und deine Serie von {weeks} Wochen hält.",
    other: "{done} von {goal} diese Woche. Noch {count}, und deine Serie von {weeks} Wochen hält.",
  },
  "wdg.goalMet": "Wochenziel erreicht: {done} von {goal}. Erholung ist auch Training.",
  "wdg.weekTitle": "{done} von {goal} diese Woche",
  "wdg.streak": { one: "{count} Woche in Folge", other: "{count} Wochen in Folge" },
  "wdg.weekKeep": {
    one: "Noch {count} Tag hält deine Serie von {weeks} Wochen.",
    other: "Noch {count} Tage halten deine Serie von {weeks} Wochen.",
  },
  "wdg.weekMore": { one: "Noch {count} Tag bis zum Ziel.", other: "Noch {count} Tage bis zum Ziel." },
  "wdg.weekMet": "Ziel erreicht. Alles Weitere ist ein Bonus.",
  "wdg.ready": "Bereit fürs Training",
  "wdg.resting": "Erholt sich noch",
  "wdg.allReady": "Alles ist erholt. Heute passt jedes Training.",
  "wdg.readyAt": "{name} · bereit {time}",
  "wdg.area.chest": "Brust",
  "wdg.area.shoulders": "Schultern",
  "wdg.area.back": "Rücken",
  "wdg.area.arms": "Arme",
  "wdg.area.core": "Rumpf",
  "wdg.area.legs": "Beine",
};

export const it: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Inizia",
  "wdg.resume": "Riprendi",
  "wdg.log": "Registra serie",
  "wdg.activeWhy": "La prossima serie è pronta. Registrala qui o apri l’allenamento.",
  "wdg.stale": "Apri Liftsmith per il piano di oggi.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} di {goal} questa settimana. Ancora {count} per l’obiettivo.",
    other: "{done} di {goal} questa settimana. Ancora {count} per l’obiettivo.",
  },
  "wdg.goalStreak": {
    one: "{done} di {goal} questa settimana. Ancora {count} per tenere la serie di {weeks} settimane.",
    other: "{done} di {goal} questa settimana. Ancora {count} per tenere la serie di {weeks} settimane.",
  },
  "wdg.goalMet": "Obiettivo settimanale raggiunto: {done} di {goal}. Anche il riposo è allenamento.",
  "wdg.weekTitle": "{done} di {goal} questa settimana",
  "wdg.streak": { one: "Serie di {count} settimana", other: "Serie di {count} settimane" },
  "wdg.weekKeep": {
    one: "Ancora {count} giorno mantiene la tua serie di {weeks} settimane.",
    other: "Ancora {count} giorni mantengono la tua serie di {weeks} settimane.",
  },
  "wdg.weekMore": { one: "Ancora {count} giorno per l’obiettivo.", other: "Ancora {count} giorni per l’obiettivo." },
  "wdg.weekMet": "Obiettivo raggiunto. Il resto è un extra.",
  "wdg.ready": "Pronti per allenarsi",
  "wdg.resting": "Ancora in recupero",
  "wdg.allReady": "Tutto è recuperato. Oggi va bene qualsiasi allenamento.",
  "wdg.readyAt": "{name} · pronti {time}",
  "wdg.area.chest": "Petto",
  "wdg.area.shoulders": "Spalle",
  "wdg.area.back": "Schiena",
  "wdg.area.arms": "Braccia",
  "wdg.area.core": "Core",
  "wdg.area.legs": "Gambe",
};

export const ja: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes}分",
  "wdg.start": "開始",
  "wdg.resume": "再開",
  "wdg.log": "セットを記録",
  "wdg.activeWhy": "次のセットの準備ができています。ここで記録するか、ワークアウトを開いてください。",
  "wdg.stale": "Liftsmith を開いて今日のプランを確認しましょう。",
  "wdg.note": "{note} · {action}",
  "wdg.goal": { other: "今週 {done}/{goal}回。目標まであと{count}回。" },
  "wdg.goalStreak": { other: "今週 {done}/{goal}回。あと{count}回で{weeks}週間の連続記録をキープ。" },
  "wdg.goalMet": "今週の目標達成：{done}/{goal}回。休むこともトレーニングです。",
  "wdg.weekTitle": "今週 {done}/{goal}回",
  "wdg.streak": { other: "{count}週連続" },
  "wdg.weekKeep": { other: "あと{count}日で{weeks}週連続をキープ。" },
  "wdg.weekMore": { other: "あと{count}日で目標達成。" },
  "wdg.weekMet": "目標達成。ここからはボーナスです。",
  "wdg.ready": "トレーニングOK",
  "wdg.resting": "回復中",
  "wdg.allReady": "すべて回復済み。今日はどのワークアウトでもOK。",
  "wdg.readyAt": "{name}・{time}に回復",
  "wdg.area.chest": "胸",
  "wdg.area.shoulders": "肩",
  "wdg.area.back": "背中",
  "wdg.area.arms": "腕",
  "wdg.area.core": "体幹",
  "wdg.area.legs": "脚",
};

export const pt: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Começar",
  "wdg.resume": "Retomar",
  "wdg.log": "Registrar série",
  "wdg.activeWhy": "Sua próxima série está pronta. Registre aqui ou abra o treino.",
  "wdg.stale": "Abra o Liftsmith para ver o plano de hoje.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} de {goal} esta semana. Mais {count} para bater sua meta.",
    other: "{done} de {goal} esta semana. Mais {count} para bater sua meta.",
  },
  "wdg.goalStreak": {
    one: "{done} de {goal} esta semana. Mais {count} mantém sua sequência de {weeks} semanas.",
    other: "{done} de {goal} esta semana. Mais {count} mantêm sua sequência de {weeks} semanas.",
  },
  "wdg.goalMet": "Meta semanal batida: {done} de {goal}. Descansar também é treinar.",
};

export const ko: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes}분",
  "wdg.start": "시작",
  "wdg.resume": "계속",
  "wdg.log": "세트 기록",
  "wdg.activeWhy": "다음 세트가 준비됐어요. 여기서 기록하거나 운동을 여세요.",
  "wdg.stale": "오늘의 계획을 보려면 Liftsmith를 여세요.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    other: "이번 주 {goal}회 중 {done}회. 목표까지 {count}회 더.",
  },
  "wdg.goalStreak": {
    other: "이번 주 {goal}회 중 {done}회. {count}회 더 하면 {weeks}주 연속 기록 유지.",
  },
  "wdg.goalMet": "주간 목표 달성: {goal}회 중 {done}회. 휴식도 운동이에요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} dk",
  "wdg.start": "Başla",
  "wdg.resume": "Devam et",
  "wdg.log": "Seti kaydet",
  "wdg.activeWhy": "Sonraki setin hazır. Buradan kaydet ya da antrenmanı aç.",
  "wdg.stale": "Bugünün planı için Liftsmith'i aç.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "Bu hafta {goal} antrenmandan {done}. Hedefine {count} kaldı.",
    other: "Bu hafta {goal} antrenmandan {done}. Hedefine {count} kaldı.",
  },
  "wdg.goalStreak": {
    one: "Bu hafta {goal} antrenmandan {done}. {count} antrenman daha {weeks} haftalık serini korur.",
    other: "Bu hafta {goal} antrenmandan {done}. {count} antrenman daha {weeks} haftalık serini korur.",
  },
  "wdg.goalMet": "Haftalık hedef tamam: {goal} antrenmandan {done}. Dinlenmek de antrenmandır.",
};

export const pl: Partial<Record<Key, Message>> = {
  "wdg.title": "{call} · {minutes} min",
  "wdg.start": "Start",
  "wdg.resume": "Wznów",
  "wdg.log": "Zapisz serię",
  "wdg.activeWhy": "Następna seria jest gotowa. Zapisz ją tutaj albo otwórz trening.",
  "wdg.stale": "Otwórz Liftsmith, żeby zobaczyć plan na dziś.",
  "wdg.note": "{note} · {action}",
  "wdg.goal": {
    one: "{done} z {goal} w tym tygodniu. Jeszcze {count} do celu.",
    few: "{done} z {goal} w tym tygodniu. Jeszcze {count} do celu.",
    many: "{done} z {goal} w tym tygodniu. Jeszcze {count} do celu.",
    other: "{done} z {goal} w tym tygodniu. Jeszcze {count} do celu.",
  },
  "wdg.goalStreak": {
    one: "{done} z {goal} w tym tygodniu. Jeszcze {count}, by utrzymać passę ({weeks} tyg.).",
    few: "{done} z {goal} w tym tygodniu. Jeszcze {count}, by utrzymać passę ({weeks} tyg.).",
    many: "{done} z {goal} w tym tygodniu. Jeszcze {count}, by utrzymać passę ({weeks} tyg.).",
    other: "{done} z {goal} w tym tygodniu. Jeszcze {count}, by utrzymać passę ({weeks} tyg.).",
  },
  "wdg.goalMet": "Cel tygodniowy osiągnięty: {done} z {goal}. Odpoczynek to też trening.",
};
