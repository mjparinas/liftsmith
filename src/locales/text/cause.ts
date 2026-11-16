import type { Message } from "@/lib/i18n";

// Text for keys starting "cause.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "cause.missed": "{missed} of your last {count} sets fell short of the target reps. The weight has got ahead of you.",
  "cause.hard": {
    one: "You rated it too hard {count} time since your last best.",
    other: "You rated it too hard {count} times since your last best.",
  },
  "cause.volume": "It's had about {sets} hard sets a week, against {want} for this block.",
  "cause.rest": "You've rested about {sec} seconds between sets, against {planned} planned.",
  "cause.readiness":
    "Your readiness has averaged {avg}, below the 50 baseline. Recovery may be the limit: sleep, food and stress count too.",
  "cause.sameReps": "Every session since your best has been in the same {lo}–{hi} rep range.",
  "cause.none": "Nothing in your data stands out. Effort, sets and rest all look fine, so a change of exercise is the best next step.",
  "cause.food":
    "You've eaten about {gap} a day under maintenance this past week. Strength rarely climbs in a deficit, so holding it is a win, and a small step back that rebuilds with the reps is the fair fix.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} de tus últimas {count} series se quedaron por debajo de las repeticiones objetivo. El peso te ha adelantado.",
  "cause.hard": {
    one: "Lo marcaste como demasiado duro {count} vez desde tu última mejor marca.",
    other: "Lo marcaste como demasiado duro {count} veces desde tu última mejor marca.",
  },
  "cause.volume": "Ha tenido unas {sets} series duras por semana, frente a {want} en este bloque.",
  "cause.rest": "Has descansado unos {sec} segundos entre series, frente a {planned} previstos.",
  "cause.readiness":
    "Tu preparación ha promediado {avg}, por debajo de la base de 50. El límite puede ser la recuperación: el sueño, la comida y el estrés también cuentan.",
  "cause.sameReps": "Todas las sesiones desde tu mejor marca han sido en el mismo rango de {lo}–{hi} repeticiones.",
  "cause.none":
    "Nada destaca en tus datos. Esfuerzo, series y descanso parecen correctos, así que cambiar de ejercicio es el mejor siguiente paso.",
  "cause.food":
    "Esta semana has comido unas {gap} al día por debajo del mantenimiento. La fuerza rara vez sube en déficit, así que mantenerla ya es un logro, y un pequeño paso atrás que se recupera con las repeticiones es lo justo.",
};

export const fr: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} de vos {count} dernières séries sont restées sous les répétitions cibles. La charge vous a devancé.",
  "cause.hard": {
    one: "Vous l’avez jugé trop dur {count} fois depuis votre dernier record.",
    other: "Vous l’avez jugé trop dur {count} fois depuis votre dernier record.",
  },
  "cause.volume": "Il a eu environ {sets} séries difficiles par semaine, pour {want} prévues dans ce bloc.",
  "cause.rest": "Vous vous êtes reposé environ {sec} secondes entre les séries, pour {planned} prévues.",
  "cause.readiness":
    "Votre forme a été en moyenne de {avg}, sous la base de 50. La récupération peut être la limite : le sommeil, l’alimentation et le stress comptent aussi.",
  "cause.sameReps": "Chaque séance depuis votre record s’est faite dans la même fourchette de {lo} à {hi} répétitions.",
  "cause.none":
    "Rien ne ressort de vos données. Effort, séries et repos semblent corrects, donc changer d’exercice est la meilleure prochaine étape.",
  "cause.food":
    "Cette semaine, vous avez mangé environ {gap} par jour sous votre maintien. La force monte rarement en déficit : la garder est déjà une réussite, et un petit pas en arrière qui se reconstruit avec les répétitions est la bonne solution.",
};

export const de: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} deiner letzten {count} Sätze blieben unter den Ziel-Wiederholungen. Das Gewicht ist dir davongelaufen.",
  "cause.hard": {
    one: "Du hast es seit deiner letzten Bestleistung {count} Mal als zu schwer bewertet.",
    other: "Du hast es seit deiner letzten Bestleistung {count} Mal als zu schwer bewertet.",
  },
  "cause.volume": "Es hatte etwa {sets} harte Sätze pro Woche, gegenüber {want} für diesen Block.",
  "cause.rest": "Du hast zwischen den Sätzen etwa {sec} Sekunden pausiert, geplant waren {planned}.",
  "cause.readiness":
    "Deine Bereitschaft lag im Schnitt bei {avg}, unter dem Ausgangswert 50. Die Erholung könnte die Grenze sein: Schlaf, Ernährung und Stress zählen auch.",
  "cause.sameReps": "Jede Einheit seit deiner Bestleistung lag im selben Bereich von {lo}–{hi} Wiederholungen.",
  "cause.none":
    "In deinen Daten fällt nichts auf. Einsatz, Sätze und Pausen sehen gut aus, also ist ein Übungswechsel der beste nächste Schritt.",
  "cause.food":
    "Du hast diese Woche etwa {gap} am Tag unter deinem Erhaltungsbedarf gegessen. Im Defizit steigt die Kraft selten, sie zu halten ist schon ein Erfolg, und ein kleiner Schritt zurück, der sich über die Wiederholungen wieder aufbaut, ist die faire Lösung.",
};

export const it: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} delle tue ultime {count} serie sono rimaste sotto le ripetizioni previste. Il peso ti ha superato.",
  "cause.hard": {
    one: "L’hai valutato troppo duro {count} volta dal tuo ultimo record.",
    other: "L’hai valutato troppo duro {count} volte dal tuo ultimo record.",
  },
  "cause.volume": "Ha avuto circa {sets} serie impegnative a settimana, contro le {want} di questo blocco.",
  "cause.rest": "Hai riposato circa {sec} secondi tra le serie, contro i {planned} previsti.",
  "cause.readiness":
    "La tua prontezza è stata in media {avg}, sotto la base di 50. Il limite potrebbe essere il recupero: contano anche sonno, alimentazione e stress.",
  "cause.sameReps": "Ogni seduta dal tuo record è stata nello stesso intervallo di {lo}–{hi} ripetizioni.",
  "cause.none": "Nei tuoi dati non spicca nulla. Impegno, serie e riposo sembrano a posto, quindi cambiare esercizio è il passo migliore.",
  "cause.food":
    "Questa settimana hai mangiato circa {gap} al giorno sotto il mantenimento. In deficit la forza sale di rado, quindi mantenerla è già un successo, e un piccolo passo indietro che si ricostruisce con le ripetizioni è la soluzione giusta.",
};

export const ja: Partial<Record<Key, Message>> = {
  "cause.missed": "直近{count}セットのうち{missed}セットで目標レップに届きませんでした。重量が今の力を上回っています。",
  "cause.hard": { other: "前回のベスト以降、{count}回「きつすぎる」と評価しています。" },
  "cause.volume": "週あたりのハードセットは約{sets}で、このブロックの目安は{want}です。",
  "cause.rest": "セット間の休憩は約{sec}秒で、予定は{planned}でした。",
  "cause.readiness":
    "コンディションの平均は{avg}で、基準の50を下回っています。回復が限界かもしれません。睡眠、食事、ストレスも影響します。",
  "cause.sameReps": "ベスト以降のセッションはすべて同じ{lo}〜{hi}レップの範囲でした。",
  "cause.none": "データに目立った問題はありません。強度、セット数、休憩はどれも問題ないので、種目を変えるのが次の一手です。",
  "cause.food":
    "この1週間、維持カロリーより1日約{gap}少なく食べています。カロリー不足の間は筋力はなかなか伸びないので、維持できれば十分です。少し重量を下げて回数で戻していくのが妥当な対策です。",
};

export const pt: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} das suas últimas {count} séries ficaram abaixo das reps-alvo. O peso passou à sua frente.",
  "cause.hard": {
    one: "Você avaliou como difícil demais {count} vez desde seu último recorde.",
    other: "Você avaliou como difícil demais {count} vezes desde seu último recorde.",
  },
  "cause.volume": "Ele teve cerca de {sets} séries pesadas por semana, contra {want} para este bloco.",
  "cause.rest": "Você descansou cerca de {sec} segundos entre as séries, contra {planned} planejados.",
  "cause.readiness":
    "Sua prontidão ficou em média em {avg}, abaixo da base de 50. A recuperação pode ser o limite: sono, alimentação e estresse também contam.",
  "cause.sameReps": "Todas as sessões desde seu recorde ficaram na mesma faixa de {lo}–{hi} reps.",
  "cause.none":
    "Nada nos seus dados chama atenção. Esforço, séries e descanso parecem bons, então trocar de exercício é o melhor próximo passo.",
  "cause.food":
    "Você comeu cerca de {gap} por dia abaixo da manutenção na última semana. A força raramente sobe em déficit, então mantê-la já é uma vitória, e um pequeno passo atrás que se reconstrói com as reps é o ajuste justo.",
};

export const ko: Partial<Record<Key, Message>> = {
  "cause.missed": "최근 {count}세트 중 {missed}세트가 목표 횟수에 못 미쳤어요. 무게가 실력을 앞서가고 있어요.",
  "cause.hard": {
    other: "마지막 최고 기록 이후 {count}번 너무 힘들다고 평가했어요.",
  },
  "cause.volume": "이번 블록 목표는 주 {want}세트인데, 고강도 세트를 주 약 {sets}세트 했어요.",
  "cause.rest": "계획은 {planned}초인데, 세트 사이에 약 {sec}초 쉬었어요.",
  "cause.readiness": "컨디션 평균이 {avg}로, 기준선 50보다 낮아요. 회복이 한계일 수 있어요. 수면, 식사, 스트레스도 중요해요.",
  "cause.sameReps": "최고 기록 이후 모든 운동이 같은 {lo}–{hi}회 범위였어요.",
  "cause.none": "데이터에서 눈에 띄는 건 없어요. 강도, 세트, 휴식 모두 괜찮아 보이니 운동 동작을 바꾸는 게 가장 좋은 다음 단계예요.",
  "cause.food":
    "지난주에 유지 칼로리보다 하루 약 {gap} 적게 먹었어요. 칼로리 적자에서는 근력이 잘 오르지 않으니 유지만 해도 성공이에요. 무게를 조금 낮췄다가 횟수로 다시 올리는 게 적절한 해결책이에요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "cause.missed": "Son {count} setinin {missed} tanesi hedef tekrarın altında kaldı. Ağırlık senden önde gitmiş.",
  "cause.hard": {
    one: "Son rekorundan bu yana {count} kez çok zor olarak puanladın.",
    other: "Son rekorundan bu yana {count} kez çok zor olarak puanladın.",
  },
  "cause.volume": "Bu blok için hedef {want} iken haftada yaklaşık {sets} zor set yapıldı.",
  "cause.rest": "Setler arasında planlanan {planned} saniye yerine yaklaşık {sec} saniye dinlendin.",
  "cause.readiness":
    "Hazırlık ortalaman {avg}, 50'lik temel değerin altında. Sınır toparlanma olabilir: uyku, beslenme ve stres de önemli.",
  "cause.sameReps": "Rekorundan bu yana her antrenman aynı {lo}–{hi} tekrar aralığındaydı.",
  "cause.none":
    "Verilerinde göze çarpan bir şey yok. Efor, set sayısı ve dinlenme iyi görünüyor; bu yüzden en iyi sonraki adım egzersizi değiştirmek.",
  "cause.food":
    "Geçen hafta koruma kalorinin günde yaklaşık {gap} altında yedin. Kalori açığında güç nadiren artar; onu korumak bile kazanç, tekrarlarla yeniden yükselen küçük bir geri adım da adil bir çözüm.",
};

export const pl: Partial<Record<Key, Message>> = {
  "cause.missed": "{missed} z Twoich ostatnich {count} serii nie osiągnęło docelowych powtórzeń. Ciężar Cię wyprzedził.",
  "cause.hard": {
    one: "Od ostatniego rekordu {count} raz oceniono je jako za ciężkie.",
    few: "Od ostatniego rekordu {count} razy oceniono je jako za ciężkie.",
    many: "Od ostatniego rekordu {count} razy oceniono je jako za ciężkie.",
    other: "Od ostatniego rekordu {count} raza oceniono je jako za ciężkie.",
  },
  "cause.volume": "Dostawało około {sets} ciężkich serii tygodniowo, przy {want} zaplanowanych na ten blok.",
  "cause.rest": "Odpoczywasz około {sec} sekund między seriami, przy zaplanowanych {planned}.",
  "cause.readiness":
    "Twoja średnia gotowość to {avg}, poniżej bazowego 50. Ograniczeniem może być regeneracja: sen, jedzenie i stres też się liczą.",
  "cause.sameReps": "Każdy trening od Twojego rekordu był w tym samym zakresie {lo}–{hi} powtórzeń.",
  "cause.none":
    "Nic w Twoich danych się nie wyróżnia. Wysiłek, serie i przerwy wyglądają dobrze, więc najlepszym krokiem jest zmiana ćwiczenia.",
  "cause.food":
    "W ostatnim tygodniu Twoje jedzenie było o około {gap} dziennie poniżej zapotrzebowania. Na deficycie siła rzadko rośnie, więc jej utrzymanie to sukces, a uczciwym rozwiązaniem jest mały krok w tył, który odbudujesz powtórzeniami.",
};
