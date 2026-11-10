import type { Message } from "@/lib/i18n";

// Text for keys starting "fit.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "fit.title": "Fitness age",
  "fit.value": "About {age}",
  "fit.floor": "{age} or younger",
  "fit.ceiling": "{age} or older",
  "fit.range": "Likely {low} to {high}, you're {age}",
  "fit.chip.younger": "Fitter than typical for your age",
  "fit.chip.typical": "About typical for your age",
  "fit.chip.older": "Room to build",
  "fit.from": "From your watch's VO₂ max of {vo2} (newest reading {date}). A typical healthy {who} of {age} has about {expected}.",
  "fit.man": "man",
  "fit.woman": "woman",
  "fit.todo.younger":
    "Keep it there: two hard cardio sessions a week, like intervals, hill walks or rowing, hold VO₂ max as the years go by.",
  "fit.todo.typical":
    "Two 20-minute hard cardio sessions a week, like intervals, hill walks or rowing, usually raise VO₂ max within 6 to 8 weeks, and this number comes down with it.",
  "fit.todo.older":
    "This is the number that moves fastest with training. Two 20-minute hard cardio sessions a week, like intervals, hill walks or rowing, usually raise VO₂ max within 6 to 8 weeks. Lifting barely moves it.",
  "fit.strength": {
    one: "Strength training in the last 7 days: {count} day, {minutes} min. Guidelines suggest muscle-strengthening work on 2 or more days a week.",
    other:
      "Strength training in the last 7 days: {count} days, {minutes} min. Guidelines suggest muscle-strengthening work on 2 or more days a week.",
  },
  "fit.score": "Strength score: {score} ({band}), against typical lifters your weight.",
  "fit.seeProgress": "See Progress",
  "fit.how": "How is this worked out?",
  "fit.missing.vo2":
    "Needs a VO₂ max reading from a watch (Apple Watch, Fitbit, Pixel Watch or Garmin) through {source}. Watches record it after outdoor walks or runs.",
  "fit.missing.web": "Comes from your watch's VO₂ max through your phone's health app. Open Liftsmith on your phone to see it.",
  "fit.missing.profile": "Add your age and sex to compare your VO₂ max with healthy people like you.",
  "fit.addProfile": "Add age and sex",
  "fit.disclaimer":
    "A fitness estimate for general wellness. It isn't medical advice and can't tell you about any health condition. If you have concerns about your health, a doctor may be helpful.",
  "fit.how.1": "Your fitness age is the age at which a typical healthy person of your sex has your VO₂ max.",
  "fit.how.2":
    "The typical values come from the HUNT Fitness Study in Norway, which measured VO₂ max on a treadmill in 3,816 healthy adults (Loe and others, 2013). The idea of fitness age comes from the same research group (Nes and others, 2014).",
  "fit.how.3":
    "Your VO₂ max is your watch's estimate, the middle of your last few readings. Watch estimates are often 5 to 15% off a lab test, so the range shows your fitness age if the reading were 8% higher or lower.",
  "fit.how.4":
    "It follows cardio fitness. Intervals, hill walks, rowing and runs raise it; lifting barely changes it, so it isn't a score of your strength training.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "fit.title": "Edad física",
  "fit.value": "Unos {age}",
  "fit.floor": "{age} o menos",
  "fit.ceiling": "{age} o más",
  "fit.range": "Probablemente entre {low} y {high}; tienes {age}",
  "fit.chip.younger": "Más en forma de lo típico para tu edad",
  "fit.chip.typical": "Lo típico para tu edad",
  "fit.chip.older": "Margen para mejorar",
  "fit.from":
    "Según el VO₂ máx de tu reloj, {vo2} (última lectura {date}). Una persona sana típica ({who}) de {age} años tiene unos {expected}.",
  "fit.man": "hombre",
  "fit.woman": "mujer",
  "fit.todo.younger":
    "Mantenlo así: dos sesiones de cardio intenso a la semana, como intervalos, caminar cuesta arriba o remo, sostienen el VO₂ máx con los años.",
  "fit.todo.typical":
    "Dos sesiones de cardio intenso de 20 minutos a la semana, como intervalos, caminar cuesta arriba o remo, suelen subir el VO₂ máx en 6 a 8 semanas, y este número baja con él.",
  "fit.todo.older":
    "Es el número que más rápido cambia con el entrenamiento. Dos sesiones de cardio intenso de 20 minutos a la semana, como intervalos, caminar cuesta arriba o remo, suelen subir el VO₂ máx en 6 a 8 semanas. Las pesas apenas lo mueven.",
  "fit.strength": {
    one: "Fuerza en los últimos 7 días: {count} día, {minutes} min. Las guías recomiendan trabajo de fuerza 2 o más días a la semana.",
    other: "Fuerza en los últimos 7 días: {count} días, {minutes} min. Las guías recomiendan trabajo de fuerza 2 o más días a la semana.",
  },
  "fit.score": "Puntuación de fuerza: {score} ({band}), frente a levantadores típicos de tu peso.",
  "fit.seeProgress": "Ver Progreso",
  "fit.how": "¿Cómo se calcula?",
  "fit.missing.vo2":
    "Necesita una lectura de VO₂ máx de un reloj (Apple Watch, Fitbit, Pixel Watch o Garmin) a través de {source}. Los relojes la registran tras caminar o correr al aire libre.",
  "fit.missing.web": "Viene del VO₂ máx de tu reloj a través de la app de salud del móvil. Abre Liftsmith en el móvil para verla.",
  "fit.missing.profile": "Añade tu edad y sexo para comparar tu VO₂ máx con personas sanas como tú.",
  "fit.addProfile": "Añadir edad y sexo",
  "fit.disclaimer":
    "Una estimación de forma física para el bienestar general. No es consejo médico y no puede decirte nada sobre ninguna condición de salud. Si te preocupa tu salud, un médico puede ayudarte.",
  "fit.how.1": "Tu edad física es la edad a la que una persona sana típica de tu sexo tiene tu VO₂ máx.",
  "fit.how.2":
    "Los valores típicos vienen del estudio HUNT Fitness de Noruega, que midió el VO₂ máx en cinta a 3816 adultos sanos (Loe y otros, 2013). La idea de edad física es del mismo grupo de investigación (Nes y otros, 2014).",
  "fit.how.3":
    "Tu VO₂ máx es la estimación de tu reloj, el valor medio de tus últimas lecturas. Las estimaciones de reloj suelen desviarse un 5 a 15 % de una prueba de laboratorio, así que el rango muestra tu edad física si la lectura fuera un 8 % mayor o menor.",
  "fit.how.4":
    "Sigue a la forma cardiovascular. Los intervalos, caminar cuesta arriba, el remo y correr la suben; las pesas apenas la cambian, así que no mide tu entrenamiento de fuerza.",
};

export const fr: Partial<Record<Key, Message>> = {
  "fit.title": "Âge physique",
  "fit.value": "Environ {age}",
  "fit.floor": "{age} ou moins",
  "fit.ceiling": "{age} ou plus",
  "fit.range": "Probablement entre {low} et {high} ; vous avez {age} ans",
  "fit.chip.younger": "Plus en forme que la moyenne de votre âge",
  "fit.chip.typical": "Dans la moyenne de votre âge",
  "fit.chip.older": "Marge de progression",
  "fit.from":
    "D’après la VO₂ max de votre montre, {vo2} (dernière mesure {date}). Une personne en bonne santé typique ({who}) de {age} ans a environ {expected}.",
  "fit.man": "homme",
  "fit.woman": "femme",
  "fit.todo.younger":
    "Gardez le cap : deux séances de cardio intense par semaine, comme des fractionnés, de la marche en côte ou du rameur, maintiennent la VO₂ max au fil des ans.",
  "fit.todo.typical":
    "Deux séances de cardio intense de 20 minutes par semaine, comme des fractionnés, de la marche en côte ou du rameur, font en général monter la VO₂ max en 6 à 8 semaines, et ce chiffre baisse avec elle.",
  "fit.todo.older":
    "C’est le chiffre qui bouge le plus vite avec l’entraînement. Deux séances de cardio intense de 20 minutes par semaine, comme des fractionnés, de la marche en côte ou du rameur, font en général monter la VO₂ max en 6 à 8 semaines. La musculation la fait à peine bouger.",
  "fit.strength": {
    one: "Musculation sur les 7 derniers jours : {count} jour, {minutes} min. Les recommandations conseillent du renforcement musculaire 2 jours par semaine ou plus.",
    other:
      "Musculation sur les 7 derniers jours : {count} jours, {minutes} min. Les recommandations conseillent du renforcement musculaire 2 jours par semaine ou plus.",
  },
  "fit.score": "Score de force : {score} ({band}), par rapport aux pratiquants typiques de votre poids.",
  "fit.seeProgress": "Voir Progrès",
  "fit.how": "Comment est-ce calculé ?",
  "fit.missing.vo2":
    "Nécessite une mesure de VO₂ max d’une montre (Apple Watch, Fitbit, Pixel Watch ou Garmin) via {source}. Les montres la mesurent après une marche ou une course en extérieur.",
  "fit.missing.web": "Vient de la VO₂ max de votre montre via l’app santé du téléphone. Ouvrez Liftsmith sur votre téléphone pour la voir.",
  "fit.missing.profile": "Ajoutez votre âge et votre sexe pour comparer votre VO₂ max à des personnes en bonne santé comme vous.",
  "fit.addProfile": "Ajouter l’âge et le sexe",
  "fit.disclaimer":
    "Une estimation de la forme physique pour le bien-être général. Ce n’est pas un avis médical et elle ne peut rien dire sur un problème de santé. Si votre santé vous préoccupe, un médecin peut vous aider.",
  "fit.how.1": "Votre âge physique est l’âge auquel une personne en bonne santé typique de votre sexe a votre VO₂ max.",
  "fit.how.2":
    "Les valeurs typiques viennent de l’étude HUNT Fitness en Norvège, qui a mesuré la VO₂ max sur tapis de course chez 3816 adultes en bonne santé (Loe et coll., 2013). L’idée d’âge physique vient du même groupe de recherche (Nes et coll., 2014).",
  "fit.how.3":
    "Votre VO₂ max est l’estimation de votre montre, la valeur médiane de vos dernières mesures. Les estimations des montres s’écartent souvent de 5 à 15 % d’un test en laboratoire ; la fourchette montre donc votre âge physique si la mesure était 8 % plus haute ou plus basse.",
  "fit.how.4":
    "Il suit la forme cardio. Les fractionnés, la marche en côte, le rameur et la course le font baisser ; la musculation le change à peine, ce n’est donc pas un score de votre entraînement de force.",
};

export const de: Partial<Record<Key, Message>> = {
  "fit.title": "Fitnessalter",
  "fit.value": "Etwa {age}",
  "fit.floor": "{age} oder jünger",
  "fit.ceiling": "{age} oder älter",
  "fit.range": "Wahrscheinlich {low} bis {high}, du bist {age}",
  "fit.chip.younger": "Fitter als typisch für dein Alter",
  "fit.chip.typical": "Etwa typisch für dein Alter",
  "fit.chip.older": "Luft nach oben",
  "fit.from":
    "Aus dem VO₂max-Wert deiner Uhr von {vo2} (neuester Wert {date}). Ein typischer gesunder {who} mit {age} hat etwa {expected}.",
  "fit.man": "Mann",
  "fit.woman": "Frau",
  "fit.todo.younger":
    "Halte es so: Zwei harte Cardio-Einheiten pro Woche, etwa Intervalle, Bergwanderungen oder Rudern, halten den VO₂max über die Jahre.",
  "fit.todo.typical":
    "Zwei harte 20-Minuten-Cardio-Einheiten pro Woche, etwa Intervalle, Bergwanderungen oder Rudern, heben den VO₂max meist innerhalb von 6 bis 8 Wochen, und diese Zahl sinkt mit.",
  "fit.todo.older":
    "Das ist die Zahl, die sich mit Training am schnellsten bewegt. Zwei harte 20-Minuten-Cardio-Einheiten pro Woche, etwa Intervalle, Bergwanderungen oder Rudern, heben den VO₂max meist innerhalb von 6 bis 8 Wochen. Krafttraining bewegt ihn kaum.",
  "fit.strength": {
    one: "Krafttraining in den letzten 7 Tagen: {count} Tag, {minutes} Min. Empfehlungen raten zu muskelkräftigendem Training an 2 oder mehr Tagen pro Woche.",
    other:
      "Krafttraining in den letzten 7 Tagen: {count} Tage, {minutes} Min. Empfehlungen raten zu muskelkräftigendem Training an 2 oder mehr Tagen pro Woche.",
  },
  "fit.score": "Kraftwert: {score} ({band}), im Vergleich zu typischen Liftern mit deinem Gewicht.",
  "fit.seeProgress": "Fortschritt ansehen",
  "fit.how": "Wie wird das berechnet?",
  "fit.missing.vo2":
    "Braucht einen VO₂max-Wert von einer Uhr (Apple Watch, Fitbit, Pixel Watch oder Garmin) über {source}. Uhren messen ihn nach Spaziergängen oder Läufen im Freien.",
  "fit.missing.web":
    "Kommt aus dem VO₂max deiner Uhr über die Gesundheits-App deines Telefons. Öffne Liftsmith auf deinem Telefon, um es zu sehen.",
  "fit.missing.profile": "Gib dein Alter und Geschlecht an, um deinen VO₂max mit gesunden Menschen wie dir zu vergleichen.",
  "fit.addProfile": "Alter und Geschlecht hinzufügen",
  "fit.disclaimer":
    "Eine Fitness-Schätzung für das allgemeine Wohlbefinden. Sie ist keine medizinische Beratung und sagt nichts über Erkrankungen aus. Wenn du dir Sorgen um deine Gesundheit machst, kann ein Arzt helfen.",
  "fit.how.1": "Dein Fitnessalter ist das Alter, in dem ein typischer gesunder Mensch deines Geschlechts deinen VO₂max hat.",
  "fit.how.2":
    "Die typischen Werte stammen aus der HUNT Fitness Study in Norwegen, die den VO₂max bei 3.816 gesunden Erwachsenen auf dem Laufband gemessen hat (Loe und andere, 2013). Die Idee des Fitnessalters stammt von derselben Forschungsgruppe (Nes und andere, 2014).",
  "fit.how.3":
    "Dein VO₂max ist die Schätzung deiner Uhr, die Mitte deiner letzten Messungen. Uhrwerte weichen oft 5 bis 15 % von einem Labortest ab, daher zeigt der Bereich dein Fitnessalter, wenn der Wert 8 % höher oder niedriger wäre.",
  "fit.how.4":
    "Es folgt der Ausdauerfitness. Intervalle, Bergwanderungen, Rudern und Laufen heben es; Krafttraining verändert es kaum, es ist also kein Wert für dein Krafttraining.",
};

export const it: Partial<Record<Key, Message>> = {
  "fit.title": "Età fitness",
  "fit.value": "Circa {age}",
  "fit.floor": "{age} o meno",
  "fit.ceiling": "{age} o più",
  "fit.range": "Probabilmente tra {low} e {high}, tu hai {age} anni",
  "fit.chip.younger": "Più in forma della media per la tua età",
  "fit.chip.typical": "Nella media per la tua età",
  "fit.chip.older": "Margine per migliorare",
  "fit.from": "Dal VO₂ max del tuo orologio di {vo2} (lettura più recente {date}). Un tipico {who} sano di {age} anni ha circa {expected}.",
  "fit.man": "uomo",
  "fit.woman": "donna",
  "fit.todo.younger":
    "Mantienilo così: due sedute di cardio intenso a settimana, come interval training, camminate in salita o vogatore, mantengono il VO₂ max con il passare degli anni.",
  "fit.todo.typical":
    "Due sedute di cardio intenso da 20 minuti a settimana, come interval training, camminate in salita o vogatore, di solito alzano il VO₂ max in 6-8 settimane, e questo numero scende di conseguenza.",
  "fit.todo.older":
    "È il numero che cambia più in fretta con l’allenamento. Due sedute di cardio intenso da 20 minuti a settimana, come interval training, camminate in salita o vogatore, di solito alzano il VO₂ max in 6-8 settimane. I pesi lo cambiano a malapena.",
  "fit.strength": {
    one: "Allenamento di forza negli ultimi 7 giorni: {count} giorno, {minutes} min. Le linee guida consigliano esercizi di rinforzo muscolare almeno 2 giorni a settimana.",
    other:
      "Allenamento di forza negli ultimi 7 giorni: {count} giorni, {minutes} min. Le linee guida consigliano esercizi di rinforzo muscolare almeno 2 giorni a settimana.",
  },
  "fit.score": "Punteggio di forza: {score} ({band}), rispetto ad atleti tipici del tuo peso.",
  "fit.seeProgress": "Vedi Progressi",
  "fit.how": "Come viene calcolato?",
  "fit.missing.vo2":
    "Serve una misura di VO₂ max da un orologio (Apple Watch, Fitbit, Pixel Watch o Garmin) tramite {source}. Gli orologi la registrano dopo camminate o corse all’aperto.",
  "fit.missing.web": "Arriva dal VO₂ max del tuo orologio tramite l’app salute del telefono. Apri Liftsmith sul telefono per vederlo.",
  "fit.missing.profile": "Aggiungi età e sesso per confrontare il tuo VO₂ max con persone sane come te.",
  "fit.addProfile": "Aggiungi età e sesso",
  "fit.disclaimer":
    "Una stima della forma fisica per il benessere generale. Non è un consiglio medico e non può dirti nulla su eventuali condizioni di salute. Se hai dubbi sulla tua salute, un medico può esserti utile.",
  "fit.how.1": "La tua età fitness è l’età in cui una persona sana tipica del tuo sesso ha il tuo VO₂ max.",
  "fit.how.2":
    "I valori tipici vengono dallo studio HUNT Fitness in Norvegia, che ha misurato il VO₂ max su tapis roulant in 3.816 adulti sani (Loe e altri, 2013). L’idea di età fitness viene dallo stesso gruppo di ricerca (Nes e altri, 2014).",
  "fit.how.3":
    "Il tuo VO₂ max è la stima del tuo orologio, il valore centrale delle ultime misure. Le stime degli orologi spesso differiscono del 5-15% da un test di laboratorio, quindi l’intervallo mostra la tua età fitness se la misura fosse più alta o più bassa dell’8%.",
  "fit.how.4":
    "Segue la forma cardiovascolare. Interval training, camminate in salita, vogatore e corsa la migliorano; i pesi la cambiano appena, quindi non è un punteggio del tuo allenamento di forza.",
};

export const ja: Partial<Record<Key, Message>> = {
  "fit.title": "フィットネス年齢",
  "fit.value": "約{age}歳",
  "fit.floor": "{age}歳以下",
  "fit.ceiling": "{age}歳以上",
  "fit.range": "おそらく{low}〜{high}歳（実年齢{age}歳）",
  "fit.chip.younger": "同年代の平均より高い体力",
  "fit.chip.typical": "同年代とほぼ同じ",
  "fit.chip.older": "伸びしろあり",
  "fit.from": "ウォッチの VO₂ max {vo2}（最新の測定 {date}）から算出。{age}歳の健康な{who}の平均は約{expected}です。",
  "fit.man": "男性",
  "fit.woman": "女性",
  "fit.todo.younger":
    "この状態を保ちましょう。インターバル、坂道ウォーキング、ローイングなど、週2回のきつめの有酸素運動で、年を重ねても VO₂ max を維持できます。",
  "fit.todo.typical":
    "インターバル、坂道ウォーキング、ローイングなど、20分のきつめの有酸素運動を週2回行うと、たいてい6〜8週間で VO₂ max が上がり、この数値も下がります。",
  "fit.todo.older":
    "トレーニングで最も早く変わる数値です。インターバル、坂道ウォーキング、ローイングなど、20分のきつめの有酸素運動を週2回行うと、たいてい6〜8週間で VO₂ max が上がります。筋トレではほとんど変わりません。",
  "fit.strength": { other: "直近7日間の筋トレ：{count}日、{minutes}分。ガイドラインでは週2日以上の筋力トレーニングが推奨されています。" },
  "fit.score": "筋力スコア：{score}（{band}）。同じ体重の一般的なリフターとの比較です。",
  "fit.seeProgress": "進捗を見る",
  "fit.how": "どうやって計算していますか？",
  "fit.missing.vo2":
    "{source}経由で、ウォッチ（Apple Watch、Fitbit、Pixel Watch、Garmin）の VO₂ max の値が必要です。ウォッチは屋外でのウォーキングやランニングの後に記録します。",
  "fit.missing.web": "ウォッチの VO₂ max を端末のヘルスケアアプリ経由で取得します。スマホで Liftsmith を開くと表示されます。",
  "fit.missing.profile": "年齢と性別を入力すると、同じような健康な人と VO₂ max を比べられます。",
  "fit.addProfile": "年齢と性別を追加",
  "fit.disclaimer":
    "一般的な健康管理のための体力の目安です。医学的な助言ではなく、病気について何かを示すものでもありません。健康に不安がある場合は医師に相談すると安心です。",
  "fit.how.1": "フィットネス年齢とは、同じ性別の一般的な健康な人があなたと同じ VO₂ max を持つ年齢のことです。",
  "fit.how.2":
    "平均値は、ノルウェーの HUNT Fitness Study で健康な成人3,816人の VO₂ max をトレッドミルで測定したデータに基づきます（Loe ほか、2013年）。フィットネス年齢という考え方も同じ研究グループによるものです（Nes ほか、2014年）。",
  "fit.how.3":
    "VO₂ max はウォッチの推定値で、直近の数回の中央値を使います。ウォッチの推定値は検査室での測定と5〜15%ずれることが多いため、範囲は値が8%高い場合と低い場合のフィットネス年齢を示しています。",
  "fit.how.4":
    "心肺機能を反映する数値です。インターバル、坂道ウォーキング、ローイング、ランニングで上がり、筋トレではほとんど変わらないため、筋トレの評価ではありません。",
};
