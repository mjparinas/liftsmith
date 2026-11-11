import type { Message } from "@/lib/i18n";

// Text for keys starting "explain.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "explain.reps": "reps",
  "explain.seconds": "seconds",
  "explain.repsN": { one: "{count} rep", other: "{count} reps" },
  "explain.secondsN": { one: "{count} second", other: "{count} seconds" },
  "explain.level.new": "a new lifter",
  "explain.level.intermediate": "an intermediate lifter",
  "explain.level.advanced": "an advanced lifter",
  "explain.earlierToday": "earlier today",
  "explain.on": "on {date}",
  "explain.firstBw": "This is your first time, so start at {target} and find your level.",
  "explain.firstLoad": "This is your first time, so it starts from about {pct}% of your body weight ({bw}), the usual start for {level}.",
  "explain.firstLight": "It's on the light side on purpose. If it feels easy, say so after the last set and next time goes up.",
  "explain.firstTitle": "A cautious first try",
  "explain.last": "Last time ({when}): {sets}, aiming for {target}.",
  "explain.feltEasy": "You said it felt too easy, so it moves up a step more.",
  "explain.feltHard": "You said it felt too hard, so it backs off a step.",
  "explain.deload": "It's the deload week, so it's about 10% lighter with fewer sets to let you recover before the next block.",
  "explain.bigMiss": "A set fell 2 or more {unit} short, so the weight drops one step and the {unit} go back to {lo}.",
  "explain.top": "You hit every set at the top of your {lo}–{hi} range, so the weight goes up one step and the {unit} go back to {lo}.",
  "explain.oneMoreRep": "You hit every set, so you get one more rep at the same weight. At {hi} {unit} the weight goes up.",
  "explain.oneMoreTimed": "You hit every set, so you get one more second block at the same weight. At {hi} {unit} the weight goes up.",
  "explain.oneMoreBw": "You hit every set, so it's one more rep this time.",
  "explain.oneMoreBwTimed": "You hit every set, so it's one more step this time.",
  "explain.same": "Not every set reached {target}, so it stays the same until they all do.",
  "explain.picked": "Picked today: {pick}.",
  "explain.rir": {
    one: "{week} of this block: leave about {count} rep in reserve. The reserve shrinks each week, then a deload resets it.",
    other: "{week} of this block: leave about {count} reps in reserve. The reserve shrinks each week, then a deload resets it.",
  },
  "explain.easy": "Today is an easy day: one step lighter, one more rep in reserve and one set fewer.",
  "explain.easyScore": "Today is an easy day (readiness {score}): one step lighter, one more rep in reserve and one set fewer.",
  "explain.push": "Today is a push day, so the first big lift goes one rep closer to failure.",
  "explain.pushScore": "Today is a push day (readiness {score}), so the first big lift goes one rep closer to failure.",
  "explain.challenge": "Challenge: on the last set, do as many good reps as you can and log what you got. It won't count as a miss.",
  "explain.barbell": "With your plates, this bar ({bar}) moves in {jump} steps, and every weight shown is one you can actually load.",
  "explain.dumbbell": "Rounded to the nearest dumbbell this gym has.",
  "explain.machine": "Rounded to this gym's {step} pin steps.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "explain.reps": "repeticiones",
  "explain.seconds": "segundos",
  "explain.repsN": { one: "{count} repetición", other: "{count} repeticiones" },
  "explain.secondsN": { one: "{count} segundo", other: "{count} segundos" },
  "explain.level.new": "alguien que empieza",
  "explain.level.intermediate": "un nivel intermedio",
  "explain.level.advanced": "un nivel avanzado",
  "explain.earlierToday": "hoy, antes",
  "explain.on": "el {date}",
  "explain.firstBw": "Es tu primera vez, así que empieza con {target} y encuentra tu nivel.",
  "explain.firstLoad":
    "Es tu primera vez, así que parte de aproximadamente el {pct}% de tu peso corporal ({bw}), el comienzo habitual para {level}.",
  "explain.firstLight": "Es ligero a propósito. Si te resulta fácil, dilo tras la última serie y la próxima vez sube.",
  "explain.firstTitle": "Un primer intento prudente",
  "explain.last": "La última vez ({when}): {sets}, buscando {target}.",
  "explain.feltEasy": "Dijiste que se hizo demasiado fácil, así que sube un escalón más.",
  "explain.feltHard": "Dijiste que se hizo demasiado duro, así que baja un escalón.",
  "explain.deload":
    "Es la semana de descarga, así que es un 10% más ligero y con menos series para recuperarte antes del siguiente bloque.",
  "explain.bigMiss": "En una serie faltaron 2 o más {unit}, así que el peso baja un escalón y vuelves a {lo} {unit}.",
  "explain.top":
    "Completaste todas las series en lo alto de tu rango de {lo}–{hi}, así que el peso sube un escalón y vuelves a {lo} {unit}.",
  "explain.oneMoreRep":
    "Completaste todas las series, así que haces una repetición más con el mismo peso. Al llegar a {hi} {unit}, sube el peso.",
  "explain.oneMoreTimed":
    "Completaste todas las series, así que sumas un bloque de segundos con el mismo peso. Al llegar a {hi} {unit}, sube el peso.",
  "explain.oneMoreBw": "Completaste todas las series, así que esta vez es una repetición más.",
  "explain.oneMoreBwTimed": "Completaste todas las series, así que esta vez es un paso más.",
  "explain.same": "No todas las series llegaron a {target}, así que se mantiene igual hasta que todas lleguen.",
  "explain.picked": "Elegido hoy: {pick}.",
  "explain.rir": {
    one: "{week} de este bloque: deja unas {count} repetición en reserva. La reserva baja cada semana y la descarga la reinicia.",
    other: "{week} de este bloque: deja unas {count} repeticiones en reserva. La reserva baja cada semana y la descarga la reinicia.",
  },
  "explain.easy": "Hoy es un día suave: un escalón más ligero, una repetición más en reserva y una serie menos.",
  "explain.easyScore": "Hoy es un día suave (preparación {score}): un escalón más ligero, una repetición más en reserva y una serie menos.",
  "explain.push": "Hoy es día para apretar, así que el primer ejercicio grande va una repetición más cerca del fallo.",
  "explain.pushScore":
    "Hoy es día para apretar (preparación {score}), así que el primer ejercicio grande va una repetición más cerca del fallo.",
  "explain.challenge":
    "Reto: en la última serie, haz todas las buenas repeticiones que puedas y registra lo que consigas. No contará como fallo.",
  "explain.barbell":
    "Con tus discos, esta barra ({bar}) avanza de {jump} en {jump}, y cada peso que ves es uno que puedes cargar de verdad.",
  "explain.dumbbell": "Redondeado a la mancuerna más cercana que tiene este gimnasio.",
  "explain.machine": "Redondeado a los saltos de {step} de las máquinas de este gimnasio.",
};

export const fr: Partial<Record<Key, Message>> = {
  "explain.reps": "répétitions",
  "explain.seconds": "secondes",
  "explain.repsN": { one: "{count} répétition", other: "{count} répétitions" },
  "explain.secondsN": { one: "{count} seconde", other: "{count} secondes" },
  "explain.level.new": "un débutant",
  "explain.level.intermediate": "un niveau intermédiaire",
  "explain.level.advanced": "un niveau avancé",
  "explain.earlierToday": "plus tôt aujourd’hui",
  "explain.on": "le {date}",
  "explain.firstBw": "C’est votre première fois : commencez à {target} et trouvez votre niveau.",
  "explain.firstLoad": "C’est votre première fois : on part d’environ {pct} % de votre poids ({bw}), le départ habituel pour {level}.",
  "explain.firstLight": "C’est volontairement léger. Si c’est facile, dites-le après la dernière série et la prochaine fois ça monte.",
  "explain.firstTitle": "Un premier essai prudent",
  "explain.last": "La dernière fois ({when}) : {sets}, pour viser {target}.",
  "explain.feltEasy": "Vous avez trouvé ça trop facile, donc ça monte d’un cran de plus.",
  "explain.feltHard": "Vous avez trouvé ça trop dur, donc ça redescend d’un cran.",
  "explain.deload": "C’est la semaine de décharge : environ 10 % plus léger, avec moins de séries, pour récupérer avant le prochain bloc.",
  "explain.bigMiss": "Une série a manqué de 2 {unit} ou plus, donc la charge baisse d’un cran et les {unit} reviennent à {lo}.",
  "explain.top":
    "Toutes les séries réussies en haut de votre fourchette de {lo} à {hi}, donc la charge monte d’un cran et les {unit} reviennent à {lo}.",
  "explain.oneMoreRep": "Toutes les séries réussies : une répétition de plus à la même charge. À {hi} {unit}, la charge monte.",
  "explain.oneMoreTimed": "Toutes les séries réussies : un palier de secondes de plus à la même charge. À {hi} {unit}, la charge monte.",
  "explain.oneMoreBw": "Toutes les séries réussies : une répétition de plus cette fois.",
  "explain.oneMoreBwTimed": "Toutes les séries réussies : un palier de plus cette fois.",
  "explain.same": "Toutes les séries n’ont pas atteint {target}, donc on garde la même chose jusqu’à ce qu’elles y arrivent toutes.",
  "explain.picked": "Choisi aujourd’hui : {pick}.",
  "explain.rir": {
    one: "{week} de ce bloc : gardez environ {count} répétition en réserve. La réserve diminue chaque semaine, puis une décharge la remet à zéro.",
    other:
      "{week} de ce bloc : gardez environ {count} répétitions en réserve. La réserve diminue chaque semaine, puis une décharge la remet à zéro.",
  },
  "explain.easy": "Aujourd’hui est un jour tranquille : un cran plus léger, une répétition de plus en réserve et une série de moins.",
  "explain.easyScore":
    "Aujourd’hui est un jour tranquille (forme {score}) : un cran plus léger, une répétition de plus en réserve et une série de moins.",
  "explain.push": "Aujourd’hui on pousse : le premier gros exercice va une répétition plus près de l’échec.",
  "explain.pushScore": "Aujourd’hui on pousse (forme {score}) : le premier gros exercice va une répétition plus près de l’échec.",
  "explain.challenge":
    "Défi : sur la dernière série, faites autant de bonnes répétitions que possible et notez votre résultat. Ça ne comptera pas comme un échec.",
  "explain.barbell":
    "Avec vos disques, cette barre ({bar}) progresse par paliers de {jump}, et chaque charge affichée est réellement chargeable.",
  "explain.dumbbell": "Arrondi à l’haltère le plus proche de cette salle.",
  "explain.machine": "Arrondi aux paliers de {step} des machines de cette salle.",
};

export const de: Partial<Record<Key, Message>> = {
  "explain.reps": "Wiederholungen",
  "explain.seconds": "Sekunden",
  "explain.repsN": { one: "{count} Wiederholung", other: "{count} Wiederholungen" },
  "explain.secondsN": { one: "{count} Sekunde", other: "{count} Sekunden" },
  "explain.level.new": "Einsteiger",
  "explain.level.intermediate": "Fortgeschrittene",
  "explain.level.advanced": "Erfahrene",
  "explain.earlierToday": "heute früher",
  "explain.on": "am {date}",
  "explain.firstBw": "Das ist dein erstes Mal, also starte mit {target} und finde dein Niveau.",
  "explain.firstLoad":
    "Das ist dein erstes Mal, also beginnt es bei etwa {pct} % deines Körpergewichts ({bw}), dem üblichen Start für {level}.",
  "explain.firstLight":
    "Es ist absichtlich eher leicht. Wenn es sich leicht anfühlt, sag es nach dem letzten Satz, dann geht es nächstes Mal hoch.",
  "explain.firstTitle": "Ein vorsichtiger erster Versuch",
  "explain.last": "Letztes Mal ({when}): {sets}, Ziel {target}.",
  "explain.feltEasy": "Du fandest es zu leicht, also geht es einen Schritt mehr nach oben.",
  "explain.feltHard": "Du fandest es zu schwer, also geht es einen Schritt zurück.",
  "explain.deload": "Es ist die Deload-Woche, also etwa 10 % leichter mit weniger Sätzen, damit du dich vor dem nächsten Block erholst.",
  "explain.bigMiss":
    "Ein Satz blieb 2 oder mehr {unit} zurück, also sinkt das Gewicht um einen Schritt und die {unit} gehen zurück auf {lo}.",
  "explain.top":
    "Du hast jeden Satz am oberen Ende deines Bereichs von {lo}–{hi} geschafft, also steigt das Gewicht um einen Schritt und die {unit} gehen zurück auf {lo}.",
  "explain.oneMoreRep":
    "Du hast jeden Satz geschafft, also bekommst du eine Wiederholung mehr bei gleichem Gewicht. Bei {hi} {unit} steigt das Gewicht.",
  "explain.oneMoreTimed":
    "Du hast jeden Satz geschafft, also bekommst du einen Sekundenblock mehr bei gleichem Gewicht. Bei {hi} {unit} steigt das Gewicht.",
  "explain.oneMoreBw": "Du hast jeden Satz geschafft, also diesmal eine Wiederholung mehr.",
  "explain.oneMoreBwTimed": "Du hast jeden Satz geschafft, also diesmal eine Stufe mehr.",
  "explain.same": "Nicht jeder Satz hat {target} erreicht, also bleibt es gleich, bis alle es tun.",
  "explain.picked": "Heute gewählt: {pick}.",
  "explain.rir": {
    one: "{week} dieses Blocks: Lass etwa {count} Wiederholung in Reserve. Die Reserve schrumpft jede Woche, dann setzt ein Deload sie zurück.",
    other:
      "{week} dieses Blocks: Lass etwa {count} Wiederholungen in Reserve. Die Reserve schrumpft jede Woche, dann setzt ein Deload sie zurück.",
  },
  "explain.easy": "Heute ist ein lockerer Tag: einen Schritt leichter, eine Wiederholung mehr in Reserve und ein Satz weniger.",
  "explain.easyScore":
    "Heute ist ein lockerer Tag (Bereitschaft {score}): einen Schritt leichter, eine Wiederholung mehr in Reserve und ein Satz weniger.",
  "explain.push": "Heute ist ein Push-Tag, also geht die erste große Übung eine Wiederholung näher ans Muskelversagen.",
  "explain.pushScore":
    "Heute ist ein Push-Tag (Bereitschaft {score}), also geht die erste große Übung eine Wiederholung näher ans Muskelversagen.",
  "explain.challenge":
    "Herausforderung: Mach im letzten Satz so viele saubere Wiederholungen wie möglich und trag ein, was du geschafft hast. Es zählt nicht als Fehlversuch.",
  "explain.barbell":
    "Mit deinen Scheiben bewegt sich diese Stange ({bar}) in Schritten von {jump}, und jedes angezeigte Gewicht kannst du tatsächlich laden.",
  "explain.dumbbell": "Auf die nächste Kurzhantel gerundet, die dieses Studio hat.",
  "explain.machine": "Auf die Steckstufen von {step} dieses Studios gerundet.",
};

export const it: Partial<Record<Key, Message>> = {
  "explain.reps": "ripetizioni",
  "explain.seconds": "secondi",
  "explain.repsN": { one: "{count} ripetizione", other: "{count} ripetizioni" },
  "explain.secondsN": { one: "{count} secondo", other: "{count} secondi" },
  "explain.level.new": "un principiante",
  "explain.level.intermediate": "un atleta intermedio",
  "explain.level.advanced": "un atleta esperto",
  "explain.earlierToday": "oggi, prima",
  "explain.on": "il {date}",
  "explain.firstBw": "È la prima volta, quindi inizia con {target} e trova il tuo livello.",
  "explain.firstLoad":
    "È la prima volta, quindi si parte da circa il {pct}% del tuo peso corporeo ({bw}), la partenza abituale per {level}.",
  "explain.firstLight": "È volutamente leggero. Se ti sembra facile, dillo dopo l’ultima serie e la prossima volta si sale.",
  "explain.firstTitle": "Un primo tentativo prudente",
  "explain.last": "L’ultima volta ({when}): {sets}, puntando a {target}.",
  "explain.feltEasy": "Hai detto che era troppo facile, quindi sale di un passo in più.",
  "explain.feltHard": "Hai detto che era troppo duro, quindi scende di un passo.",
  "explain.deload": "È la settimana di scarico, quindi circa il 10% più leggero con meno serie, per recuperare prima del prossimo blocco.",
  "explain.bigMiss": "Una serie è rimasta corta di 2 o più {unit}, quindi il peso scende di un passo e le {unit} tornano a {lo}.",
  "explain.top":
    "Hai completato ogni serie al massimo dell’intervallo {lo}–{hi}, quindi il peso sale di un passo e le {unit} tornano a {lo}.",
  "explain.oneMoreRep": "Hai completato ogni serie, quindi fai una ripetizione in più con lo stesso peso. A {hi} {unit} il peso sale.",
  "explain.oneMoreTimed":
    "Hai completato ogni serie, quindi fai un blocco di secondi in più con lo stesso peso. A {hi} {unit} il peso sale.",
  "explain.oneMoreBw": "Hai completato ogni serie, quindi stavolta una ripetizione in più.",
  "explain.oneMoreBwTimed": "Hai completato ogni serie, quindi stavolta un passo in più.",
  "explain.same": "Non tutte le serie hanno raggiunto {target}, quindi resta uguale finché non ci arrivano tutte.",
  "explain.picked": "Scelto oggi: {pick}.",
  "explain.rir": {
    one: "{week} di questo blocco: tieni circa {count} ripetizione di riserva. La riserva cala ogni settimana, poi uno scarico la azzera.",
    other:
      "{week} di questo blocco: tieni circa {count} ripetizioni di riserva. La riserva cala ogni settimana, poi uno scarico la azzera.",
  },
  "explain.easy": "Oggi è un giorno leggero: un passo più leggero, una ripetizione in più di riserva e una serie in meno.",
  "explain.easyScore":
    "Oggi è un giorno leggero (prontezza {score}): un passo più leggero, una ripetizione in più di riserva e una serie in meno.",
  "explain.push": "Oggi è un giorno da spingere, quindi il primo grande esercizio va una ripetizione più vicino al cedimento.",
  "explain.pushScore":
    "Oggi è un giorno da spingere (prontezza {score}), quindi il primo grande esercizio va una ripetizione più vicino al cedimento.",
  "explain.challenge":
    "Sfida: nell’ultima serie fai tutte le ripetizioni buone che riesci e registra quante ne hai fatte. Non conta come mancata.",
  "explain.barbell":
    "Con i tuoi dischi, questo bilanciere ({bar}) sale a passi di {jump}, e ogni peso mostrato è uno che puoi davvero caricare.",
  "explain.dumbbell": "Arrotondato al manubrio più vicino disponibile in questa palestra.",
  "explain.machine": "Arrotondato ai passi da {step} della macchina di questa palestra.",
};

export const ja: Partial<Record<Key, Message>> = {
  "explain.reps": "回数",
  "explain.seconds": "秒数",
  "explain.repsN": { other: "{count}回" },
  "explain.secondsN": { other: "{count}秒" },
  "explain.level.new": "初心者",
  "explain.level.intermediate": "中級者",
  "explain.level.advanced": "上級者",
  "explain.earlierToday": "今日の早い時間",
  "explain.on": "{date}",
  "explain.firstBw": "初めてなので、{target}から始めてレベルを確認しましょう。",
  "explain.firstLoad": "初めてなので、体重（{bw}）の約{pct}%から始めます。{level}の一般的なスタート重量です。",
  "explain.firstLight": "あえて軽めにしています。楽に感じたら最後のセットの後にそう答えてください。次回は重くなります。",
  "explain.firstTitle": "慎重な最初の1回",
  "explain.last": "前回（{when}）：{sets}、目標は{target}。",
  "explain.feltEasy": "楽すぎたとのことなので、もう1段階上げます。",
  "explain.feltHard": "きつすぎたとのことなので、1段階下げます。",
  "explain.deload": "ディロード週なので、約10%軽くセット数も減らし、次のブロックの前に回復します。",
  "explain.bigMiss": "あるセットが{unit}で2以上届かなかったため、重量を1段階下げ、{unit}は{lo}に戻します。",
  "explain.top": "すべてのセットで{lo}〜{hi}の上限に達したため、重量を1段階上げ、{unit}は{lo}に戻します。",
  "explain.oneMoreRep": "すべてのセットを達成したので、同じ重量で1回増やします。{hi}{unit}に達したら重量を上げます。",
  "explain.oneMoreTimed": "すべてのセットを達成したので、同じ重量で時間を1段階延ばします。{hi}{unit}に達したら重量を上げます。",
  "explain.oneMoreBw": "すべてのセットを達成したので、今回は1回増やします。",
  "explain.oneMoreBwTimed": "すべてのセットを達成したので、今回は1段階延ばします。",
  "explain.same": "{target}に届かなかったセットがあるため、全セット達成まで同じ内容にします。",
  "explain.picked": "今日選んだ理由：{pick}。",
  "explain.rir": { other: "このブロックの{week}：余力は約{count}回残します。余力は毎週減っていき、ディロードでリセットされます。" },
  "explain.easy": "今日は軽めの日です。重量を1段階下げ、余力を1回増やし、セットを1つ減らします。",
  "explain.easyScore": "今日は軽めの日です（コンディション {score}）。重量を1段階下げ、余力を1回増やし、セットを1つ減らします。",
  "explain.push": "今日はプッシュデーなので、最初の主要種目は限界まであと1回近づけます。",
  "explain.pushScore": "今日はプッシュデーなので（コンディション {score}）、最初の主要種目は限界まであと1回近づけます。",
  "explain.challenge":
    "チャレンジ：最後のセットはきれいなフォームでできるだけ多く行い、できた回数を記録してください。未達にはカウントされません。",
  "explain.barbell": "手持ちのプレートでは、このバー（{bar}）は{jump}刻みで、表示される重量はすべて実際に付けられる重さです。",
  "explain.dumbbell": "このジムにある最も近いダンベルに丸めています。",
  "explain.machine": "このジムのピン刻み（{step}）に丸めています。",
};
