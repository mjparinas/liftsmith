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

export const pt: Partial<Record<Key, Message>> = {
  "explain.reps": "reps",
  "explain.seconds": "segundos",
  "explain.repsN": {
    one: "{count} rep",
    other: "{count} reps",
  },
  "explain.secondsN": {
    one: "{count} segundo",
    other: "{count} segundos",
  },
  "explain.level.new": "um iniciante",
  "explain.level.intermediate": "alguém de nível intermediário",
  "explain.level.advanced": "alguém de nível avançado",
  "explain.earlierToday": "hoje mais cedo",
  "explain.on": "em {date}",
  "explain.firstBw": "É sua primeira vez, então comece com {target} e descubra seu nível.",
  "explain.firstLoad": "É sua primeira vez, então começa com cerca de {pct}% do seu peso corporal ({bw}), o início comum para {level}.",
  "explain.firstLight": "Está leve de propósito. Se parecer fácil, diga isso depois da última série e na próxima vez sobe.",
  "explain.firstTitle": "Uma primeira tentativa cautelosa",
  "explain.last": "Última vez ({when}): {sets}, com meta de {target}.",
  "explain.feltEasy": "Você disse que estava fácil demais, então sobe um passo a mais.",
  "explain.feltHard": "Você disse que estava difícil demais, então recua um passo.",
  "explain.deload":
    "É a semana de deload, então está cerca de 10% mais leve e com menos séries para você se recuperar antes do próximo bloco.",
  "explain.bigMiss": "Uma série ficou 2 ou mais {unit} abaixo, então o peso cai um passo e você volta a {lo} {unit}.",
  "explain.top": "Você fez todas as séries no topo da faixa de {lo}–{hi}, então o peso sobe um passo e você volta a {lo} {unit}.",
  "explain.oneMoreRep": "Você completou todas as séries, então ganha mais uma rep com o mesmo peso. Com {hi} {unit}, o peso sobe.",
  "explain.oneMoreTimed":
    "Você completou todas as séries, então ganha mais um bloco de segundos com o mesmo peso. Com {hi} {unit}, o peso sobe.",
  "explain.oneMoreBw": "Você completou todas as séries, então desta vez é uma rep a mais.",
  "explain.oneMoreBwTimed": "Você completou todas as séries, então desta vez é um passo a mais.",
  "explain.same": "Nem todas as séries chegaram a {target}, então fica igual até todas chegarem.",
  "explain.picked": "Escolhido hoje: {pick}.",
  "explain.rir": {
    one: "{week} deste bloco: deixe cerca de {count} rep em reserva. A reserva diminui a cada semana, e depois um deload a reinicia.",
    other: "{week} deste bloco: deixe cerca de {count} reps em reserva. A reserva diminui a cada semana, e depois um deload a reinicia.",
  },
  "explain.easy": "Hoje é um dia leve: um passo mais leve, uma rep a mais em reserva e uma série a menos.",
  "explain.easyScore": "Hoje é um dia leve (prontidão {score}): um passo mais leve, uma rep a mais em reserva e uma série a menos.",
  "explain.push": "Hoje é dia de forçar, então o primeiro exercício principal vai uma rep mais perto da falha.",
  "explain.pushScore": "Hoje é dia de forçar (prontidão {score}), então o primeiro exercício principal vai uma rep mais perto da falha.",
  "explain.challenge":
    "Desafio: na última série, faça o máximo de reps bem-feitas que conseguir e registre o que fez. Não conta como falha.",
  "explain.barbell":
    "Com as suas anilhas, esta barra ({bar}) sobe de {jump} em {jump}, e todo peso mostrado é um que você consegue montar de verdade.",
  "explain.dumbbell": "Arredondado para o halter mais próximo que esta academia tem.",
  "explain.machine": "Arredondado para os passos de {step} do pino desta academia.",
};

export const ko: Partial<Record<Key, Message>> = {
  "explain.reps": "회",
  "explain.seconds": "초",
  "explain.repsN": {
    other: "{count}회",
  },
  "explain.secondsN": {
    other: "{count}초",
  },
  "explain.level.new": "초보자",
  "explain.level.intermediate": "중급자",
  "explain.level.advanced": "상급자",
  "explain.earlierToday": "오늘 아까",
  "explain.on": "{date}",
  "explain.firstBw": "처음이니 {target}부터 시작해서 내 수준을 찾아보세요.",
  "explain.firstLoad": "처음이라 체중의 약 {pct}%({bw})로 시작해요. {level}의 일반적인 시작 무게예요.",
  "explain.firstLight": "일부러 가볍게 잡았어요. 쉬웠다면 마지막 세트 후에 알려 주세요. 다음엔 무게가 올라가요.",
  "explain.firstTitle": "조심스러운 첫 시도",
  "explain.last": "지난번({when}): {sets}, 목표는 {target}.",
  "explain.feltEasy": "너무 쉬웠다고 해서 한 단계 더 올라가요.",
  "explain.feltHard": "너무 힘들었다고 해서 한 단계 내려가요.",
  "explain.deload": "디로드 주간이라 다음 블록 전에 회복할 수 있도록 약 10% 가볍고 세트도 적어요.",
  "explain.bigMiss": "한 세트가 목표보다 2{unit} 이상 모자라서, 무게를 한 단계 내리고 다시 {lo}{unit}부터 시작해요.",
  "explain.top": "모든 세트에서 {lo}–{hi}{unit} 범위의 최상단을 채워서, 무게를 한 단계 올리고 다시 {lo}{unit}부터 시작해요.",
  "explain.oneMoreRep": "모든 세트를 해내서 같은 무게로 1회 더 해요. {hi}{unit}에 도달하면 무게가 올라가요.",
  "explain.oneMoreTimed": "모든 세트를 해내서 같은 무게로 시간을 한 단계 더 늘려요. {hi}{unit}에 도달하면 무게가 올라가요.",
  "explain.oneMoreBw": "모든 세트를 해내서 이번엔 1회 더 해요.",
  "explain.oneMoreBwTimed": "모든 세트를 해내서 이번엔 한 단계 더 늘려요.",
  "explain.same": "모든 세트가 {target}에 닿지 않아서, 모두 닿을 때까지 그대로 유지해요.",
  "explain.picked": "오늘의 선택: {pick}.",
  "explain.rir": {
    other: "이번 블록 {week}: 약 {count}회 여유를 남기세요. 여유는 매주 줄어들고, 디로드에서 다시 초기화돼요.",
  },
  "explain.easy": "오늘은 가볍게 가는 날이에요: 한 단계 가볍게, 여유 1회 더, 세트 하나 적게.",
  "explain.easyScore": "오늘은 가볍게 가는 날이에요(컨디션 {score}): 한 단계 가볍게, 여유 1회 더, 세트 하나 적게.",
  "explain.push": "오늘은 강하게 가는 날이라 첫 번째 주요 리프트를 실패 지점에 1회 더 가깝게 해요.",
  "explain.pushScore": "오늘은 강하게 가는 날이라(컨디션 {score}) 첫 번째 주요 리프트를 실패 지점에 1회 더 가깝게 해요.",
  "explain.challenge": "도전: 마지막 세트에서 좋은 자세로 할 수 있는 만큼 하고 그 횟수를 기록하세요. 실패로 치지 않아요.",
  "explain.barbell": "가진 원판으로 이 바({bar})는 {jump}씩 올라가고, 표시되는 무게는 모두 실제로 끼울 수 있는 무게예요.",
  "explain.dumbbell": "이 헬스장에 있는 가장 가까운 덤벨로 맞췄어요.",
  "explain.machine": "이 헬스장의 핀 간격 {step}에 맞춰 반올림했어요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "explain.reps": "tekrar",
  "explain.seconds": "saniye",
  "explain.repsN": {
    one: "{count} tekrar",
    other: "{count} tekrar",
  },
  "explain.secondsN": {
    one: "{count} saniye",
    other: "{count} saniye",
  },
  "explain.level.new": "yeni başlayanlar",
  "explain.level.intermediate": "orta seviye sporcular",
  "explain.level.advanced": "ileri seviye sporcular",
  "explain.earlierToday": "bugün daha önce",
  "explain.on": "{date}",
  "explain.firstBw": "İlk kez yapıyorsun, o yüzden {target} ile başla ve seviyeni bul.",
  "explain.firstLoad":
    "İlk kez yapıyorsun, o yüzden vücut ağırlığının yaklaşık %{pct} kadarıyla ({bw}) başlıyor; {level} için olağan başlangıç bu.",
  "explain.firstLight": "Bilerek hafif tutuldu. Kolay gelirse son setten sonra söyle, bir dahakine artar.",
  "explain.firstTitle": "Temkinli bir ilk deneme",
  "explain.last": "Geçen sefer ({when}): {sets}, hedef {target}.",
  "explain.feltEasy": "Çok kolay geldiğini söyledin, o yüzden bir adım daha artıyor.",
  "explain.feltHard": "Çok zor geldiğini söyledin, o yüzden bir adım geri çekiliyor.",
  "explain.deload": "Deload haftası, o yüzden bir sonraki bloktan önce toparlanman için yaklaşık %10 daha hafif ve daha az set var.",
  "explain.bigMiss": "Bir set 2 {unit} ya da daha fazla eksik kaldı, o yüzden ağırlık bir adım düşüyor ve {unit} yeniden {lo} oluyor.",
  "explain.top": "Her seti {lo}–{hi} aralığının tepesinde tamamladın, o yüzden ağırlık bir adım artıyor ve {unit} yeniden {lo} oluyor.",
  "explain.oneMoreRep": "Her seti tamamladın, o yüzden aynı ağırlıkta bir tekrar daha var. {hi} {unit} olunca ağırlık artar.",
  "explain.oneMoreTimed": "Her seti tamamladın, o yüzden aynı ağırlıkta bir saniye adımı daha var. {hi} {unit} olunca ağırlık artar.",
  "explain.oneMoreBw": "Her seti tamamladın, o yüzden bu sefer bir tekrar daha.",
  "explain.oneMoreBwTimed": "Her seti tamamladın, o yüzden bu sefer bir adım daha.",
  "explain.same": "Her set {target} hedefine ulaşmadı, o yüzden hepsi ulaşana kadar aynı kalıyor.",
  "explain.picked": "Bugün seçilen: {pick}.",
  "explain.rir": {
    one: "Blokta {week}: yaklaşık {count} tekrar yedekte bırak. Yedek her hafta azalır, sonra deload onu sıfırlar.",
    other: "Blokta {week}: yaklaşık {count} tekrar yedekte bırak. Yedek her hafta azalır, sonra deload onu sıfırlar.",
  },
  "explain.easy": "Bugün hafif bir gün: bir adım daha hafif, bir tekrar daha fazla yedek ve bir set eksik.",
  "explain.easyScore": "Bugün hafif bir gün (hazırlık {score}): bir adım daha hafif, bir tekrar daha fazla yedek ve bir set eksik.",
  "explain.push": "Bugün yüklenme günü, o yüzden ilk büyük hareket tükenişe bir tekrar daha yakın gidiyor.",
  "explain.pushScore": "Bugün yüklenme günü (hazırlık {score}), o yüzden ilk büyük hareket tükenişe bir tekrar daha yakın gidiyor.",
  "explain.challenge": "Meydan okuma: son sette yapabildiğin kadar düzgün tekrar yap ve kaç tane yaptığını kaydet. Eksik sayılmaz.",
  "explain.barbell": "Plakalarınla bu bar ({bar}) {jump} adımlarla artar ve gösterilen her ağırlık gerçekten takabileceğin bir ağırlık.",
  "explain.dumbbell": "Bu salondaki en yakın dambıla yuvarlandı.",
  "explain.machine": "Bu salonun {step} pim adımlarına yuvarlandı.",
};

export const pl: Partial<Record<Key, Message>> = {
  "explain.reps": "powt.",
  "explain.seconds": "s",
  "explain.repsN": {
    one: "{count} powtórzenie",
    few: "{count} powtórzenia",
    many: "{count} powtórzeń",
    other: "{count} powtórzenia",
  },
  "explain.secondsN": {
    one: "{count} sekunda",
    few: "{count} sekundy",
    many: "{count} sekund",
    other: "{count} sekundy",
  },
  "explain.level.new": "osoby początkującej",
  "explain.level.intermediate": "osoby średnio zaawansowanej",
  "explain.level.advanced": "osoby zaawansowanej",
  "explain.earlierToday": "dziś wcześniej",
  "explain.on": "{date}",
  "explain.firstBw": "To twój pierwszy raz, więc zacznij od {target} i znajdź swój poziom.",
  "explain.firstLoad": "To twój pierwszy raz, więc start to ok. {pct}% twojej masy ciała ({bw}), typowy początek dla {level}.",
  "explain.firstLight": "Celowo jest lżej. Jeśli będzie łatwo, powiedz to po ostatniej serii, a następnym razem pójdzie w górę.",
  "explain.firstTitle": "Ostrożna pierwsza próba",
  "explain.last": "Ostatnio ({when}): {sets}, cel {target}.",
  "explain.feltEasy": "Według ciebie było za łatwo, więc idzie o krok więcej w górę.",
  "explain.feltHard": "Według ciebie było za ciężko, więc cofa się o krok.",
  "explain.deload": "To tydzień deloadu, więc jest ok. 10% lżej i mniej serii, na regenerację przed kolejnym blokiem.",
  "explain.bigMiss": "W jednej serii zabrakło 2 lub więcej {unit}, więc ciężar spada o krok, a cel wraca do {lo} {unit}.",
  "explain.top": "Każda seria na górze zakresu {lo}–{hi}, więc ciężar rośnie o krok, a cel wraca do {lo} {unit}.",
  "explain.oneMoreRep":
    "Każda seria zaliczona, więc dostajesz jedno powtórzenie więcej przy tym samym ciężarze. Przy {hi} {unit} ciężar rośnie.",
  "explain.oneMoreTimed":
    "Każda seria zaliczona, więc dostajesz jeden blok sekund więcej przy tym samym ciężarze. Przy {hi} {unit} ciężar rośnie.",
  "explain.oneMoreBw": "Każda seria zaliczona, więc tym razem o jedno powtórzenie więcej.",
  "explain.oneMoreBwTimed": "Każda seria zaliczona, więc tym razem o krok więcej.",
  "explain.same": "Nie każda seria doszła do {target}, więc zostaje bez zmian, aż dojdą wszystkie.",
  "explain.picked": "Wybrane na dziś: {pick}.",
  "explain.rir": {
    one: "{week} tego bloku: zostaw ok. {count} powtórzenie w zapasie. Zapas maleje co tydzień, potem deload go resetuje.",
    few: "{week} tego bloku: zostaw ok. {count} powtórzenia w zapasie. Zapas maleje co tydzień, potem deload go resetuje.",
    many: "{week} tego bloku: zostaw ok. {count} powtórzeń w zapasie. Zapas maleje co tydzień, potem deload go resetuje.",
    other: "{week} tego bloku: zostaw ok. {count} powtórzenia w zapasie. Zapas maleje co tydzień, potem deload go resetuje.",
  },
  "explain.easy": "Dziś lżejszy dzień: o krok lżej, o jedno powtórzenie więcej w zapasie i o jedną serię mniej.",
  "explain.easyScore": "Dziś lżejszy dzień (gotowość {score}): o krok lżej, o jedno powtórzenie więcej w zapasie i o jedną serię mniej.",
  "explain.push": "Dziś mocniejszy dzień, więc pierwsze duże ćwiczenie idzie o jedno powtórzenie bliżej upadku mięśniowego.",
  "explain.pushScore":
    "Dziś mocniejszy dzień (gotowość {score}), więc pierwsze duże ćwiczenie idzie o jedno powtórzenie bliżej upadku mięśniowego.",
  "explain.challenge":
    "Wyzwanie: w ostatniej serii zrób tyle dobrych powtórzeń, ile dasz radę, i zapisz wynik. Nie liczy się to jako nieudana seria.",
  "explain.barbell": "Z twoimi talerzami ta sztanga ({bar}) rośnie co {jump}, a każdy pokazany ciężar da się naprawdę założyć.",
  "explain.dumbbell": "Zaokrąglone do najbliższego hantla na tej siłowni.",
  "explain.machine": "Zaokrąglone do skoku stosu na tej siłowni ({step}).",
};
