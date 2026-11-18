import type { Message } from "@/lib/i18n";

// Text for keys starting "unl.", features that appear as a new lifter trains (src/lib/unlocks.ts), in every
// language. English is the source.

export const en = {
  "unl.new": "New for you",
  "unl.awards.title": "Awards are open",
  "unl.awards.body": "Every workout now earns XP toward your next level, and badges mark your milestones.",
  "unl.awards.go": "See Awards",
  "unl.quests.title": "Weekly quests",
  "unl.quests.body": "A few small goals each week for bonus XP, like trying a new exercise. They're on Today's This week card.",
  "unl.quests.go": "See quests",
  "unl.friends.title": "Friends",
  "unl.friends.body": "Follow friends, cheer their workouts and post yours. Lifters who train with friends keep at it longer.",
  "unl.friends.go": "Open Friends",
  "unl.seasons.title": "Training seasons",
  "unl.seasons.body":
    "Ten-week seasons with rewards you can only earn then, paced to your own weekly goal. The crates you've won are in the locker on Awards.",
  "unl.seasons.go": "See the season",
  "unl.more.title": "More to explore",
  "unl.more.body": "A monthly challenge on Awards, more options for adaptive workouts in Settings, and experiments in Labs.",
  "unl.more.go": "See the challenge",
  "unl.all": "Show everything",
  "unl.allHint": "New lifters see features a few at a time as they train. Turn this on to see them all now.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "unl.new": "Novedades para ti",
  "unl.awards.title": "Ya tienes logros",
  "unl.awards.body": "Cada entrenamiento suma XP para tu próximo nivel, y las insignias marcan tus hitos.",
  "unl.awards.go": "Ver logros",
  "unl.quests.title": "Misiones semanales",
  "unl.quests.body":
    "Unos pequeños objetivos cada semana para ganar XP extra, como probar un ejercicio nuevo. Están en la tarjeta Esta semana de Hoy.",
  "unl.quests.go": "Ver misiones",
  "unl.friends.title": "Amigos",
  "unl.friends.body": "Sigue a tus amigos, anima sus entrenamientos y publica los tuyos. Quien entrena con amigos lo mantiene más tiempo.",
  "unl.friends.go": "Abrir Amigos",
  "unl.seasons.title": "Temporadas de entrenamiento",
  "unl.seasons.body":
    "Temporadas de diez semanas con recompensas que solo se ganan entonces, al ritmo de tu propio objetivo semanal. Las cajas que has ganado están en la taquilla de Logros.",
  "unl.seasons.go": "Ver la temporada",
  "unl.more.title": "Más por descubrir",
  "unl.more.body": "Un reto mensual en Logros, más opciones para los entrenamientos adaptativos en Ajustes y experimentos en Labs.",
  "unl.more.go": "Ver el reto",
  "unl.all": "Mostrar todo",
  "unl.allHint": "Quien empieza ve las funciones poco a poco a medida que entrena. Actívalo para verlas todas ya.",
};

export const fr: Partial<Record<Key, Message>> = {
  "unl.new": "Nouveau pour vous",
  "unl.awards.title": "Les trophées sont ouverts",
  "unl.awards.body": "Chaque séance rapporte désormais de l’XP vers votre prochain niveau, et les badges marquent vos étapes.",
  "unl.awards.go": "Voir les trophées",
  "unl.quests.title": "Quêtes de la semaine",
  "unl.quests.body":
    "Quelques petits objectifs chaque semaine pour de l’XP en bonus, comme essayer un nouvel exercice. Ils sont sur la carte Cette semaine d’Aujourd’hui.",
  "unl.quests.go": "Voir les quêtes",
  "unl.friends.title": "Amis",
  "unl.friends.body":
    "Suivez vos amis, encouragez leurs séances et publiez les vôtres. On tient plus longtemps quand on s’entraîne entre amis.",
  "unl.friends.go": "Ouvrir Amis",
  "unl.seasons.title": "Saisons d’entraînement",
  "unl.seasons.body":
    "Des saisons de dix semaines avec des récompenses à gagner seulement pendant la saison, au rythme de votre propre objectif hebdomadaire. Les caisses gagnées sont dans le casier des trophées.",
  "unl.seasons.go": "Voir la saison",
  "unl.more.title": "Encore plus à découvrir",
  "unl.more.body":
    "Un défi mensuel dans les trophées, plus d’options pour les séances adaptatives dans les réglages, et des expériences dans Labs.",
  "unl.more.go": "Voir le défi",
  "unl.all": "Tout afficher",
  "unl.allHint": "Au début, les fonctions apparaissent petit à petit au fil des séances. Activez ceci pour tout voir dès maintenant.",
};

export const de: Partial<Record<Key, Message>> = {
  "unl.new": "Neu für dich",
  "unl.awards.title": "Erfolge sind freigeschaltet",
  "unl.awards.body": "Jedes Workout bringt dir jetzt XP für dein nächstes Level, und Abzeichen markieren deine Meilensteine.",
  "unl.awards.go": "Erfolge ansehen",
  "unl.quests.title": "Wochenaufgaben",
  "unl.quests.body":
    "Jede Woche ein paar kleine Ziele für Bonus-XP, etwa eine neue Übung ausprobieren. Du findest sie auf der Karte „Diese Woche“ unter Heute.",
  "unl.quests.go": "Aufgaben ansehen",
  "unl.friends.title": "Freunde",
  "unl.friends.body": "Folge Freunden, feuere ihre Workouts an und teile deine. Wer mit Freunden trainiert, bleibt länger dabei.",
  "unl.friends.go": "Freunde öffnen",
  "unl.seasons.title": "Trainingssaisons",
  "unl.seasons.body":
    "Saisons über zehn Wochen mit Belohnungen, die es nur dann gibt, im Tempo deines eigenen Wochenziels. Deine gewonnenen Kisten liegen im Spind unter Erfolge.",
  "unl.seasons.go": "Saison ansehen",
  "unl.more.title": "Noch mehr zu entdecken",
  "unl.more.body": "Eine Monats-Challenge unter Erfolge, mehr Optionen für adaptive Workouts in den Einstellungen und Experimente in Labs.",
  "unl.more.go": "Challenge ansehen",
  "unl.all": "Alles anzeigen",
  "unl.allHint": "Neue Nutzer sehen die Funktionen nach und nach, während sie trainieren. Schalte das ein, um gleich alles zu sehen.",
};

export const it: Partial<Record<Key, Message>> = {
  "unl.new": "Novità per te",
  "unl.awards.title": "I premi sono sbloccati",
  "unl.awards.body": "Ogni allenamento ora ti dà XP per il prossimo livello, e i badge segnano i tuoi traguardi.",
  "unl.awards.go": "Vedi i premi",
  "unl.quests.title": "Missioni settimanali",
  "unl.quests.body":
    "Qualche piccolo obiettivo ogni settimana per XP bonus, come provare un esercizio nuovo. Le trovi nella scheda Questa settimana di Oggi.",
  "unl.quests.go": "Vedi le missioni",
  "unl.friends.title": "Amici",
  "unl.friends.body": "Segui gli amici, incoraggia i loro allenamenti e pubblica i tuoi. Chi si allena con gli amici continua più a lungo.",
  "unl.friends.go": "Apri Amici",
  "unl.seasons.title": "Stagioni di allenamento",
  "unl.seasons.body":
    "Stagioni di dieci settimane con premi che si vincono solo in quel periodo, al ritmo del tuo obiettivo settimanale. Le casse che hai vinto sono nell’armadietto dei premi.",
  "unl.seasons.go": "Vedi la stagione",
  "unl.more.title": "Altro da scoprire",
  "unl.more.body": "Una sfida mensile nei premi, più opzioni per gli allenamenti adattivi nelle impostazioni ed esperimenti in Labs.",
  "unl.more.go": "Vedi la sfida",
  "unl.all": "Mostra tutto",
  "unl.allHint": "All’inizio le funzioni compaiono poco alla volta mentre ti alleni. Attiva questa opzione per vederle tutte subito.",
};

export const ja: Partial<Record<Key, Message>> = {
  "unl.new": "新しく使えるようになりました",
  "unl.awards.title": "実績が使えるようになりました",
  "unl.awards.body": "これからはワークアウトごとに次のレベルへの XP がたまり、節目にはバッジがもらえます。",
  "unl.awards.go": "実績を見る",
  "unl.quests.title": "今週のクエスト",
  "unl.quests.body": "新しい種目を試すなど、毎週いくつかの小さな目標でボーナス XP がもらえます。今日の画面の「今週」カードにあります。",
  "unl.quests.go": "クエストを見る",
  "unl.friends.title": "フレンド",
  "unl.friends.body":
    "フレンドをフォローして、ワークアウトを応援したり自分のワークアウトを投稿したりできます。仲間と続けると長続きします。",
  "unl.friends.go": "フレンドを開く",
  "unl.seasons.title": "トレーニングシーズン",
  "unl.seasons.body":
    "10 週間のシーズンで、その期間だけの報酬がもらえます。ペースは自分の週の目標に合わせて決まります。獲得したクレートは実績のロッカーにあります。",
  "unl.seasons.go": "シーズンを見る",
  "unl.more.title": "さらに使える機能",
  "unl.more.body": "実績の月間チャレンジ、設定のアダプティブワークアウトの追加オプション、ラボの試験的な機能です。",
  "unl.more.go": "チャレンジを見る",
  "unl.all": "すべて表示",
  "unl.allHint": "始めたばかりのうちは、トレーニングを重ねるごとに機能が少しずつ表示されます。オンにするとすぐにすべて表示されます。",
};

export const pt: Partial<Record<Key, Message>> = {
  "unl.new": "Novidades para você",
  "unl.awards.title": "Prêmios liberados",
  "unl.awards.body": "Agora cada treino rende XP para o próximo nível, e as insígnias marcam suas conquistas.",
  "unl.awards.go": "Ver prêmios",
  "unl.quests.title": "Missões da semana",
  "unl.quests.body":
    "Algumas metas pequenas por semana para ganhar XP extra, como experimentar um exercício novo. Elas ficam no cartão Esta semana de Hoje.",
  "unl.quests.go": "Ver missões",
  "unl.friends.title": "Amigos",
  "unl.friends.body": "Siga amigos, incentive os treinos deles e publique os seus. Quem treina com amigos continua por mais tempo.",
  "unl.friends.go": "Abrir Amigos",
  "unl.seasons.title": "Temporadas de treino",
  "unl.seasons.body":
    "Temporadas de dez semanas com recompensas que só dá para ganhar nesse período, no ritmo da sua própria meta semanal. As caixas que você ganhou estão no armário de Prêmios.",
  "unl.seasons.go": "Ver a temporada",
  "unl.more.title": "Mais para explorar",
  "unl.more.body": "Um desafio mensal em Prêmios, mais opções para os treinos adaptativos nos Ajustes e experimentos no Labs.",
  "unl.more.go": "Ver o desafio",
  "unl.all": "Mostrar tudo",
  "unl.allHint": "No começo, os recursos aparecem aos poucos conforme você treina. Ative para ver todos agora.",
};

export const ko: Partial<Record<Key, Message>> = {
  "unl.new": "새로 열린 기능",
  "unl.awards.title": "업적이 열렸어요",
  "unl.awards.body": "이제 운동할 때마다 다음 레벨을 위한 XP가 쌓이고, 중요한 순간마다 배지를 받아요.",
  "unl.awards.go": "업적 보기",
  "unl.quests.title": "주간 퀘스트",
  "unl.quests.body": "새 운동 해 보기처럼 매주 작은 목표 몇 가지로 보너스 XP를 받아요. 오늘 화면의 이번 주 카드에 있어요.",
  "unl.quests.go": "퀘스트 보기",
  "unl.friends.title": "친구",
  "unl.friends.body": "친구를 팔로우하고, 친구의 운동을 응원하고, 내 운동도 올려 보세요. 친구와 함께하면 더 오래 이어 가요.",
  "unl.friends.go": "친구 열기",
  "unl.seasons.title": "트레이닝 시즌",
  "unl.seasons.body":
    "10주 동안 이어지는 시즌으로, 그 기간에만 받을 수 있는 보상이 있어요. 속도는 내 주간 목표에 맞춰져요. 얻은 상자는 업적의 보관함에 있어요.",
  "unl.seasons.go": "시즌 보기",
  "unl.more.title": "더 둘러보기",
  "unl.more.body": "업적의 월간 챌린지, 설정의 맞춤 운동 추가 옵션, 실험실의 실험 기능이에요.",
  "unl.more.go": "챌린지 보기",
  "unl.all": "모두 보기",
  "unl.allHint": "처음에는 운동을 할수록 기능이 조금씩 나타나요. 켜면 지금 바로 모두 볼 수 있어요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "unl.new": "Senin için yeni",
  "unl.awards.title": "Ödüller açıldı",
  "unl.awards.body": "Artık her antrenman bir sonraki seviyen için XP kazandırıyor ve rozetler önemli anlarını gösteriyor.",
  "unl.awards.go": "Ödülleri gör",
  "unl.quests.title": "Haftalık görevler",
  "unl.quests.body": "Her hafta yeni bir egzersiz denemek gibi birkaç küçük hedefle bonus XP kazan. Bugün ekranındaki Bu hafta kartında.",
  "unl.quests.go": "Görevleri gör",
  "unl.friends.title": "Arkadaşlar",
  "unl.friends.body":
    "Arkadaşlarını takip et, antrenmanlarını alkışla ve kendininkini paylaş. Arkadaşlarıyla çalışanlar daha uzun sürdürür.",
  "unl.friends.go": "Arkadaşlar'ı aç",
  "unl.seasons.title": "Antrenman sezonları",
  "unl.seasons.body":
    "Yalnızca o dönemde kazanılabilen ödüllerle on haftalık sezonlar, kendi haftalık hedefinin hızında. Kazandığın kasalar Ödüller'deki dolapta.",
  "unl.seasons.go": "Sezonu gör",
  "unl.more.title": "Keşfedecek daha çok şey",
  "unl.more.body":
    "Ödüller'de aylık bir meydan okuma, Ayarlar'da uyarlanabilir antrenmanlar için daha fazla seçenek ve Laboratuvar'da deneyler.",
  "unl.more.go": "Meydan okumayı gör",
  "unl.all": "Her şeyi göster",
  "unl.allHint": "Yeni başlayanlar özellikleri antrenman yaptıkça azar azar görür. Hepsini şimdi görmek için bunu aç.",
};

export const pl: Partial<Record<Key, Message>> = {
  "unl.new": "Nowe dla ciebie",
  "unl.awards.title": "Nagrody są odblokowane",
  "unl.awards.body": "Każdy trening daje teraz XP do następnego poziomu, a odznaki oznaczają twoje kamienie milowe.",
  "unl.awards.go": "Zobacz nagrody",
  "unl.quests.title": "Zadania tygodnia",
  "unl.quests.body":
    "Kilka małych celów co tydzień za dodatkowe XP, na przykład wypróbowanie nowego ćwiczenia. Są na karcie Ten tydzień na ekranie Dziś.",
  "unl.quests.go": "Zobacz zadania",
  "unl.friends.title": "Znajomi",
  "unl.friends.body": "Obserwuj znajomych, dopinguj ich treningi i publikuj swoje. Kto trenuje ze znajomymi, dłużej wytrwa.",
  "unl.friends.go": "Otwórz Znajomych",
  "unl.seasons.title": "Sezony treningowe",
  "unl.seasons.body":
    "Dziesięciotygodniowe sezony z nagrodami, które można zdobyć tylko wtedy, w tempie twojego własnego celu tygodniowego. Wygrane skrzynki są w szafce w Nagrodach.",
  "unl.seasons.go": "Zobacz sezon",
  "unl.more.title": "Więcej do odkrycia",
  "unl.more.body": "Miesięczne wyzwanie w Nagrodach, więcej opcji treningów adaptacyjnych w Ustawieniach i eksperymenty w Laboratorium.",
  "unl.more.go": "Zobacz wyzwanie",
  "unl.all": "Pokaż wszystko",
  "unl.allHint": "Na początku funkcje pojawiają się stopniowo, w miarę jak trenujesz. Włącz to, aby zobaczyć wszystkie od razu.",
};
