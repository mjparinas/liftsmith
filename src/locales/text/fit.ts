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
  "fit.seeStrength": "See strength score",
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
  "fit.seeStrength": "Ver puntuación de fuerza",
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
  "fit.seeStrength": "Voir le score de force",
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
  "fit.seeStrength": "Kraftwert ansehen",
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
  "fit.seeStrength": "Vedi punteggio di forza",
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
  "fit.seeStrength": "筋力スコアを見る",
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

export const pt: Partial<Record<Key, Message>> = {
  "fit.title": "Idade física",
  "fit.value": "Cerca de {age}",
  "fit.floor": "{age} ou menos",
  "fit.ceiling": "{age} ou mais",
  "fit.range": "Provavelmente de {low} a {high}; você tem {age}",
  "fit.chip.younger": "Em melhor forma que o comum para sua idade",
  "fit.chip.typical": "Mais ou menos o comum para sua idade",
  "fit.chip.older": "Espaço para evoluir",
  "fit.from":
    "Do VO₂ máx. de {vo2} do seu relógio (leitura mais recente: {date}). Uma pessoa saudável típica ({who}) de {age} anos tem cerca de {expected}.",
  "fit.man": "homem",
  "fit.woman": "mulher",
  "fit.todo.younger":
    "Mantenha assim: duas sessões de cardio intenso por semana, como intervalados, caminhadas em subida ou remo, seguram o VO₂ máx. com o passar dos anos.",
  "fit.todo.typical":
    "Duas sessões de cardio intenso de 20 minutos por semana, como intervalados, caminhadas em subida ou remo, costumam aumentar o VO₂ máx. em 6 a 8 semanas, e este número cai junto.",
  "fit.todo.older":
    "Este é o número que mais muda com o treino. Duas sessões de cardio intenso de 20 minutos por semana, como intervalados, caminhadas em subida ou remo, costumam aumentar o VO₂ máx. em 6 a 8 semanas. Musculação quase não o altera.",
  "fit.strength": {
    one: "Treino de força nos últimos 7 dias: {count} dia, {minutes} min. As diretrizes recomendam fortalecimento muscular em 2 ou mais dias por semana.",
    other:
      "Treino de força nos últimos 7 dias: {count} dias, {minutes} min. As diretrizes recomendam fortalecimento muscular em 2 ou mais dias por semana.",
  },
  "fit.score": "Pontuação de força: {score} ({band}), em comparação com praticantes típicos do seu peso.",
  "fit.seeStrength": "Ver pontuação de força",
  "fit.how": "Como isso é calculado?",
  "fit.missing.vo2":
    "Precisa de uma leitura de VO₂ máx. de um relógio (Apple Watch, Fitbit, Pixel Watch ou Garmin) via {source}. Os relógios registram isso depois de caminhadas ou corridas ao ar livre.",
  "fit.missing.web": "Vem do VO₂ máx. do seu relógio pelo app de saúde do celular. Abra o Liftsmith no celular para ver.",
  "fit.missing.profile": "Adicione sua idade e sexo para comparar seu VO₂ máx. com pessoas saudáveis como você.",
  "fit.addProfile": "Adicionar idade e sexo",
  "fit.disclaimer":
    "Uma estimativa de condicionamento para bem-estar geral. Não é orientação médica e não diz nada sobre qualquer condição de saúde. Se tiver preocupações com sua saúde, consultar um médico pode ajudar.",
  "fit.how.1": "Sua idade física é a idade em que uma pessoa saudável típica do seu sexo tem o seu VO₂ máx.",
  "fit.how.2":
    "Os valores típicos vêm do HUNT Fitness Study, na Noruega, que mediu o VO₂ máx. em esteira de 3.816 adultos saudáveis (Loe e colegas, 2013). A ideia de idade física vem do mesmo grupo de pesquisa (Nes e colegas, 2014).",
  "fit.how.3":
    "Seu VO₂ máx. é a estimativa do seu relógio, o valor do meio das suas últimas leituras. As estimativas de relógio costumam errar de 5 a 15% em relação a um teste de laboratório, então a faixa mostra sua idade física se a leitura fosse 8% mais alta ou mais baixa.",
  "fit.how.4":
    "Ela acompanha o condicionamento cardiorrespiratório. Intervalados, caminhadas em subida, remo e corrida a aumentam; musculação quase não a altera, então não é uma nota do seu treino de força.",
};

export const ko: Partial<Record<Key, Message>> = {
  "fit.title": "체력 나이",
  "fit.value": "약 {age}세",
  "fit.floor": "{age}세 이하",
  "fit.ceiling": "{age}세 이상",
  "fit.range": "{low}~{high}세로 추정, 실제 나이는 {age}세",
  "fit.chip.younger": "또래보다 체력이 좋아요",
  "fit.chip.typical": "또래와 비슷해요",
  "fit.chip.older": "더 키울 여지가 있어요",
  "fit.from": "워치의 VO₂ max {vo2}(최근 측정 {date}) 기준이에요. {age}세의 건강한 {who}은 보통 약 {expected}예요.",
  "fit.man": "남성",
  "fit.woman": "여성",
  "fit.todo.younger":
    "지금처럼 유지하세요: 인터벌, 언덕 걷기, 로잉 같은 고강도 유산소를 일주일에 두 번 하면 나이가 들어도 VO₂ max를 지킬 수 있어요.",
  "fit.todo.typical":
    "인터벌, 언덕 걷기, 로잉 같은 20분 고강도 유산소를 일주일에 두 번 하면 보통 6~8주 안에 VO₂ max가 오르고, 이 숫자도 함께 내려가요.",
  "fit.todo.older":
    "훈련으로 가장 빨리 바뀌는 숫자예요. 인터벌, 언덕 걷기, 로잉 같은 20분 고강도 유산소를 일주일에 두 번 하면 보통 6~8주 안에 VO₂ max가 올라요. 웨이트로는 거의 바뀌지 않아요.",
  "fit.strength": {
    other: "최근 7일 근력 운동: {count}일, {minutes}분. 가이드라인은 일주일에 2일 이상 근력 운동을 권장해요.",
  },
  "fit.score": "근력 점수: {score}({band}), 같은 체중의 일반적인 리프터 기준이에요.",
  "fit.seeStrength": "근력 점수 보기",
  "fit.how": "어떻게 계산하나요?",
  "fit.missing.vo2":
    "{source}에서 받은 워치(Apple Watch, Fitbit, Pixel Watch, Garmin)의 VO₂ max 측정값이 필요해요. 워치는 야외 걷기나 달리기 후에 측정해요.",
  "fit.missing.web": "휴대폰 건강 앱을 통해 워치의 VO₂ max를 가져와요. 휴대폰에서 Liftsmith를 열어 확인하세요.",
  "fit.missing.profile": "나이와 성별을 추가하면 나와 비슷한 건강한 사람들과 VO₂ max를 비교할 수 있어요.",
  "fit.addProfile": "나이와 성별 추가",
  "fit.disclaimer":
    "일반적인 건강 관리를 위한 체력 추정치예요. 의학적 조언이 아니며 어떤 건강 상태도 알려 줄 수 없어요. 건강이 걱정된다면 의사와 상담하는 것이 도움이 될 수 있어요.",
  "fit.how.1": "체력 나이는 같은 성별의 일반적인 건강한 사람이 내 VO₂ max를 갖는 나이예요.",
  "fit.how.2":
    "일반적인 수치는 노르웨이의 HUNT 체력 연구에서 나왔어요. 건강한 성인 3,816명의 VO₂ max를 트레드밀에서 측정한 연구예요(Loe 외, 2013). 체력 나이라는 개념도 같은 연구진에게서 나왔어요(Nes 외, 2014).",
  "fit.how.3":
    "VO₂ max는 워치의 추정치로, 최근 몇 번 측정값의 중간값이에요. 워치 추정치는 실험실 측정과 5~15% 정도 차이가 나는 경우가 많아서, 측정값이 8% 높거나 낮을 때의 체력 나이를 범위로 보여 줘요.",
  "fit.how.4":
    "심폐 체력을 따라가요. 인터벌, 언덕 걷기, 로잉, 달리기로 올라가고 웨이트로는 거의 바뀌지 않아요. 그러니 근력 운동 점수가 아니에요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "fit.title": "Fitness yaşı",
  "fit.value": "Yaklaşık {age}",
  "fit.floor": "{age} ya da daha genç",
  "fit.ceiling": "{age} ya da daha yaşlı",
  "fit.range": "Muhtemelen {low} ile {high} arası, sen {age} yaşındasın",
  "fit.chip.younger": "Yaşına göre ortalamadan daha fit",
  "fit.chip.typical": "Yaşına göre ortalama civarında",
  "fit.chip.older": "Gelişime açık",
  "fit.from":
    "Saatinin VO₂ max değerinden: {vo2} (en yeni ölçüm {date}). {age} yaşındaki sağlıklı bir {who} için tipik değer yaklaşık {expected}.",
  "fit.man": "erkek",
  "fit.woman": "kadın",
  "fit.todo.younger":
    "Böyle kalsın: haftada iki zorlu kardiyo seansı (interval, yokuş yürüyüşü ya da kürek gibi) yıllar geçse de VO₂ max'ı korur.",
  "fit.todo.typical":
    "Haftada iki kez 20 dakikalık zorlu kardiyo (interval, yokuş yürüyüşü ya da kürek gibi) genelde 6 ila 8 haftada VO₂ max'ı artırır ve bu sayı da onunla birlikte düşer.",
  "fit.todo.older":
    "Antrenmanla en hızlı değişen sayı bu. Haftada iki kez 20 dakikalık zorlu kardiyo (interval, yokuş yürüyüşü ya da kürek gibi) genelde 6 ila 8 haftada VO₂ max'ı artırır. Ağırlık çalışması onu pek değiştirmez.",
  "fit.strength": {
    one: "Son 7 günde kuvvet antrenmanı: {count} gün, {minutes} dk. Öneriler haftada 2 ya da daha fazla gün kas güçlendirici çalışma yapılmasını söyler.",
    other:
      "Son 7 günde kuvvet antrenmanı: {count} gün, {minutes} dk. Öneriler haftada 2 ya da daha fazla gün kas güçlendirici çalışma yapılmasını söyler.",
  },
  "fit.score": "Kuvvet puanı: {score} ({band}), senin kilondaki tipik sporculara göre.",
  "fit.seeStrength": "Kuvvet puanını gör",
  "fit.how": "Bu nasıl hesaplanıyor?",
  "fit.missing.vo2":
    "{source} üzerinden bir saatten (Apple Watch, Fitbit, Pixel Watch ya da Garmin) VO₂ max ölçümü gerekiyor. Saatler bunu açık havada yürüyüş ya da koşulardan sonra kaydeder.",
  "fit.missing.web": "Saatinin VO₂ max değerinden, telefonunun sağlık uygulaması üzerinden gelir. Görmek için Liftsmith'i telefonunda aç.",
  "fit.missing.profile": "VO₂ max'ını senin gibi sağlıklı insanlarla karşılaştırmak için yaşını ve cinsiyetini ekle.",
  "fit.addProfile": "Yaş ve cinsiyet ekle",
  "fit.disclaimer":
    "Genel sağlıklı yaşam için bir fitness tahmini. Tıbbi tavsiye değildir ve herhangi bir sağlık durumu hakkında bilgi veremez. Sağlığınla ilgili endişelerin varsa bir doktora danışmak faydalı olabilir.",
  "fit.how.1": "Fitness yaşın, senin cinsiyetindeki tipik sağlıklı bir insanın senin VO₂ max değerine sahip olduğu yaştır.",
  "fit.how.2":
    "Tipik değerler, Norveç'teki HUNT Fitness Çalışması'ndan geliyor; bu çalışmada 3.816 sağlıklı yetişkinin VO₂ max değeri koşu bandında ölçüldü (Loe ve diğerleri, 2013). Fitness yaşı fikri de aynı araştırma grubundan çıktı (Nes ve diğerleri, 2014).",
  "fit.how.3":
    "VO₂ max değerin saatinin tahmini; son birkaç ölçümünün ortası. Saat tahminleri laboratuvar testinden çoğu zaman %5 ila %15 sapar, bu yüzden aralık, ölçüm %8 daha yüksek ya da düşük olsaydı fitness yaşının ne olacağını gösterir.",
  "fit.how.4":
    "Kardiyo kondisyonunu izler. Interval, yokuş yürüyüşü, kürek ve koşu onu yükseltir; ağırlık çalışması pek değiştirmez, yani kuvvet antrenmanının puanı değildir.",
};

export const pl: Partial<Record<Key, Message>> = {
  "fit.title": "Wiek sprawnościowy",
  "fit.value": "Ok. {age}",
  "fit.floor": "{age} lub mniej",
  "fit.ceiling": "{age} lub więcej",
  "fit.range": "Prawdopodobnie od {low} do {high}, twój wiek: {age}",
  "fit.chip.younger": "Sprawniej niż typowo w twoim wieku",
  "fit.chip.typical": "Mniej więcej typowo dla twojego wieku",
  "fit.chip.older": "Jest co budować",
  "fit.from":
    "Na podstawie VO₂ max z twojego zegarka: {vo2} (najnowszy odczyt {date}). Typowa zdrowa osoba ({who}, {age} lat) ma ok. {expected}.",
  "fit.man": "mężczyzna",
  "fit.woman": "kobieta",
  "fit.todo.younger":
    "Utrzymaj to: dwa mocne treningi cardio w tygodniu, np. interwały, marsze pod górę albo wiosłowanie, utrzymują VO₂ max mimo upływu lat.",
  "fit.todo.typical":
    "Dwa 20-minutowe mocne treningi cardio w tygodniu, np. interwały, marsze pod górę albo wiosłowanie, zwykle podnoszą VO₂ max w ciągu 6–8 tygodni, a ta liczba spada razem z tym.",
  "fit.todo.older":
    "Ta liczba najszybciej reaguje na trening. Dwa 20-minutowe mocne treningi cardio w tygodniu, np. interwały, marsze pod górę albo wiosłowanie, zwykle podnoszą VO₂ max w ciągu 6–8 tygodni. Trening siłowy prawie jej nie zmienia.",
  "fit.strength": {
    one: "Trening siłowy w ostatnich 7 dniach: {count} dzień, {minutes} min. Zalecenia mówią o ćwiczeniach wzmacniających mięśnie co najmniej 2 dni w tygodniu.",
    few: "Trening siłowy w ostatnich 7 dniach: {count} dni, {minutes} min. Zalecenia mówią o ćwiczeniach wzmacniających mięśnie co najmniej 2 dni w tygodniu.",
    many: "Trening siłowy w ostatnich 7 dniach: {count} dni, {minutes} min. Zalecenia mówią o ćwiczeniach wzmacniających mięśnie co najmniej 2 dni w tygodniu.",
    other:
      "Trening siłowy w ostatnich 7 dniach: {count} dnia, {minutes} min. Zalecenia mówią o ćwiczeniach wzmacniających mięśnie co najmniej 2 dni w tygodniu.",
  },
  "fit.score": "Wynik siłowy: {score} ({band}) w porównaniu z typowymi osobami trenującymi o twojej masie ciała.",
  "fit.seeStrength": "Zobacz wynik siłowy",
  "fit.how": "Jak to jest liczone?",
  "fit.missing.vo2":
    "Potrzebny jest odczyt VO₂ max z zegarka (Apple Watch, Fitbit, Pixel Watch lub Garmin) przez {source}. Zegarki zapisują go po marszach lub biegach na zewnątrz.",
  "fit.missing.web":
    "Pochodzi z VO₂ max z twojego zegarka, przez aplikację zdrowotną w telefonie. Otwórz Liftsmith na telefonie, żeby to zobaczyć.",
  "fit.missing.profile": "Dodaj wiek i płeć, żeby porównać swoje VO₂ max ze zdrowymi osobami podobnymi do ciebie.",
  "fit.addProfile": "Dodaj wiek i płeć",
  "fit.disclaimer":
    "Szacunek sprawności do celów ogólnego dobrego samopoczucia. To nie porada medyczna i nie mówi nic o żadnym stanie zdrowia. Jeśli martwisz się o swoje zdrowie, warto porozmawiać z lekarzem.",
  "fit.how.1": "Twój wiek sprawnościowy to wiek, w którym typowa zdrowa osoba twojej płci ma takie VO₂ max jak ty.",
  "fit.how.2":
    "Typowe wartości pochodzą z norweskiego badania HUNT Fitness Study, w którym zmierzono VO₂ max na bieżni u 3816 zdrowych dorosłych (Loe i in., 2013). Pomysł wieku sprawnościowego pochodzi od tej samej grupy badawczej (Nes i in., 2014).",
  "fit.how.3":
    "Twoje VO₂ max to szacunek zegarka, środek kilku ostatnich odczytów. Szacunki z zegarków często różnią się od testu laboratoryjnego o 5–15%, więc zakres pokazuje twój wiek sprawnościowy, gdyby odczyt był o 8% wyższy lub niższy.",
  "fit.how.4":
    "Odzwierciedla wydolność. Interwały, marsze pod górę, wiosłowanie i bieganie ją podnoszą; trening siłowy prawie jej nie zmienia, więc to nie jest ocena twojego treningu siłowego.",
};
