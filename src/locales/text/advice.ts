import type { Message } from "@/lib/i18n";

// Text for keys starting "advice.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "advice.rest": "Rest it. It's ready {when}.",
  "advice.rest.why": "{pct}% recovered. Plans leave out lifts that work it hard until it's back.",
  "advice.easy": "Go light on it. It's ready {when}.",
  "advice.easy.why": "{pct}% recovered. Plans won't make it the day's focus until it's back to 70%.",
  "advice.train": {
    one: "Good to train. {count} more set reaches this week's {goal}.",
    other: "Good to train. {count} more sets reach this week's {goal}.",
  },
  "advice.train.why": "{pct}% recovered, {done} of {goal} sets done this week.",
  "advice.done": "This week's sets are done. Let it recover for next week.",
  "advice.done.why": "{done} of {goal} sets done this week, so more won't add much.",
  "advice.last": "Last worked {when}.",
  "advice.priority": "Make it a priority",
  "advice.priority.hint": "It gets a third more weekly sets and is picked first when recovered.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "advice.rest": "Déjalo descansar. Estará listo {when}.",
  "advice.rest.why": "{pct}% recuperado. Los planes dejan fuera los ejercicios que lo trabajan a fondo hasta que se recupere.",
  "advice.easy": "Trabájalo suave. Estará listo {when}.",
  "advice.easy.why": "{pct}% recuperado. Los planes no lo harán el foco del día hasta que vuelva al 70%.",
  "advice.train": {
    one: "Listo para entrenar. Falta {count} serie para las {goal} de esta semana.",
    other: "Listo para entrenar. Faltan {count} series para las {goal} de esta semana.",
  },
  "advice.train.why": "{pct}% recuperado, {done} de {goal} series hechas esta semana.",
  "advice.done": "Las series de esta semana están hechas. Deja que se recupere para la próxima.",
  "advice.done.why": "{done} de {goal} series hechas esta semana, así que más no aportan mucho.",
  "advice.last": "Trabajado por última vez {when}.",
  "advice.priority": "Hacerlo prioridad",
  "advice.priority.hint": "Recibe un tercio más de series semanales y se elige primero cuando está recuperado.",
};

export const fr: Partial<Record<Key, Message>> = {
  "advice.rest": "Laissez-le se reposer. Il sera prêt {when}.",
  "advice.rest.why": "Récupéré à {pct} %. Les plans écartent les exercices qui le sollicitent fort jusqu'à sa récupération.",
  "advice.easy": "Allez-y doucement. Il sera prêt {when}.",
  "advice.easy.why": "Récupéré à {pct} %. Les plans n'en feront pas la cible du jour avant qu'il revienne à 70 %.",
  "advice.train": {
    one: "Prêt à travailler. Encore {count} série pour atteindre les {goal} de la semaine.",
    other: "Prêt à travailler. Encore {count} séries pour atteindre les {goal} de la semaine.",
  },
  "advice.train.why": "Récupéré à {pct} %, {done} séries sur {goal} faites cette semaine.",
  "advice.done": "Les séries de la semaine sont faites. Laissez-le récupérer pour la semaine prochaine.",
  "advice.done.why": "{done} séries sur {goal} faites cette semaine, en faire plus n'apporte pas grand-chose.",
  "advice.last": "Dernière séance {when}.",
  "advice.priority": "En faire une priorité",
  "advice.priority.hint": "Il reçoit un tiers de séries en plus par semaine et passe en premier une fois récupéré.",
};

export const de: Partial<Record<Key, Message>> = {
  "advice.rest": "Lass ihn ruhen. Er ist {when} bereit.",
  "advice.rest.why": "{pct} % erholt. Pläne lassen Übungen weg, die ihn stark beanspruchen, bis er wieder fit ist.",
  "advice.easy": "Mach es leicht. Er ist {when} bereit.",
  "advice.easy.why": "{pct} % erholt. Pläne machen ihn erst wieder zum Tagesschwerpunkt, wenn er bei 70 % ist.",
  "advice.train": {
    one: "Bereit fürs Training. Noch {count} Satz bis zu den {goal} dieser Woche.",
    other: "Bereit fürs Training. Noch {count} Sätze bis zu den {goal} dieser Woche.",
  },
  "advice.train.why": "{pct} % erholt, {done} von {goal} Sätzen diese Woche erledigt.",
  "advice.done": "Die Sätze dieser Woche sind erledigt. Lass ihn für nächste Woche erholen.",
  "advice.done.why": "{done} von {goal} Sätzen diese Woche erledigt, mehr bringt kaum noch etwas.",
  "advice.last": "Zuletzt trainiert {when}.",
  "advice.priority": "Priorisieren",
  "advice.priority.hint": "Er bekommt ein Drittel mehr Sätze pro Woche und wird zuerst gewählt, wenn er erholt ist.",
};

export const it: Partial<Record<Key, Message>> = {
  "advice.rest": "Lascialo riposare. Sarà pronto {when}.",
  "advice.rest.why": "Recupero al {pct}%. I piani escludono gli esercizi che lo impegnano molto finché non si riprende.",
  "advice.easy": "Vacci leggero. Sarà pronto {when}.",
  "advice.easy.why": "Recupero al {pct}%. I piani non lo metteranno al centro della giornata finché non torna al 70%.",
  "advice.train": {
    one: "Pronto per l’allenamento. Ancora {count} serie per le {goal} di questa settimana.",
    other: "Pronto per l’allenamento. Ancora {count} serie per le {goal} di questa settimana.",
  },
  "advice.train.why": "Recupero al {pct}%, {done} di {goal} serie fatte questa settimana.",
  "advice.done": "Le serie di questa settimana sono fatte. Lascialo recuperare per la prossima.",
  "advice.done.why": "{done} di {goal} serie fatte questa settimana, quindi altre non aggiungerebbero molto.",
  "advice.last": "Ultimo allenamento {when}.",
  "advice.priority": "Rendilo prioritario",
  "advice.priority.hint": "Riceve un terzo di serie settimanali in più e viene scelto per primo quando è recuperato.",
};

export const ja: Partial<Record<Key, Message>> = {
  "advice.rest": "休ませましょう。{when}に回復します。",
  "advice.rest.why": "回復 {pct}%。回復するまで、この筋肉に強い負荷がかかる種目はプランから外します。",
  "advice.easy": "軽めにしましょう。{when}に回復します。",
  "advice.easy.why": "回復 {pct}%。70%に戻るまで、この筋肉をその日のメインにはしません。",
  "advice.train": { other: "トレーニングできます。あと{count}セットで今週の{goal}セットに届きます。" },
  "advice.train.why": "回復 {pct}%、今週は{goal}セット中{done}セット完了。",
  "advice.done": "今週のセットは完了です。来週に向けて回復させましょう。",
  "advice.done.why": "今週は{goal}セット中{done}セット完了。これ以上増やしても効果はあまり上がりません。",
  "advice.last": "最後に鍛えたのは{when}。",
  "advice.priority": "優先する",
  "advice.priority.hint": "週のセット数が3分の1増え、回復したら最初に選ばれます。",
};

export const pt: Partial<Record<Key, Message>> = {
  "advice.rest": "Deixe descansar. Fica pronto {when}.",
  "advice.rest.why": "{pct}% recuperado. Os planos deixam de fora exercícios que o exigem muito até ele se recuperar.",
  "advice.easy": "Pegue leve com ele. Fica pronto {when}.",
  "advice.easy.why": "{pct}% recuperado. Os planos não vão fazer dele o foco do dia até voltar a 70%.",
  "advice.train": {
    one: "Pronto para treinar. Mais {count} série chega à meta de {goal} da semana.",
    other: "Pronto para treinar. Mais {count} séries chegam à meta de {goal} da semana.",
  },
  "advice.train.why": "{pct}% recuperado, {done} de {goal} séries feitas nesta semana.",
  "advice.done": "As séries desta semana estão feitas. Deixe recuperar para a próxima semana.",
  "advice.done.why": "{done} de {goal} séries feitas nesta semana, então mais não acrescenta muito.",
  "advice.last": "Treinado pela última vez {when}.",
  "advice.priority": "Tornar prioridade",
  "advice.priority.hint": "Ganha um terço a mais de séries semanais e é escolhido primeiro quando recuperado.",
};

export const ko: Partial<Record<Key, Message>> = {
  "advice.rest": "쉬게 해 주세요. {when} 준비돼요.",
  "advice.rest.why": "{pct}% 회복됐어요. 회복될 때까지 이 부위를 강하게 쓰는 운동은 계획에서 빠져요.",
  "advice.easy": "가볍게 하세요. {when} 준비돼요.",
  "advice.easy.why": "{pct}% 회복됐어요. 70%까지 회복될 때까지 그날의 주력 부위로 잡지 않아요.",
  "advice.train": {
    other: "운동해도 좋아요. {count}세트 더 하면 이번 주 목표 {goal}세트에 도달해요.",
  },
  "advice.train.why": "{pct}% 회복, 이번 주 {goal}세트 중 {done}세트 완료.",
  "advice.done": "이번 주 세트를 다 채웠어요. 다음 주를 위해 회복시키세요.",
  "advice.done.why": "이번 주 {goal}세트 중 {done}세트 완료라서 더 해도 효과가 크지 않아요.",
  "advice.last": "마지막 운동: {when}.",
  "advice.priority": "우선순위로 지정",
  "advice.priority.hint": "주간 세트가 3분의 1 늘고, 회복되면 가장 먼저 선택돼요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "advice.rest": "Dinlendir. Hazır olacağı zaman: {when}.",
  "advice.rest.why": "%{pct} toparlandı. Toparlanana kadar planlar onu çok zorlayan hareketleri dışarıda bırakır.",
  "advice.easy": "Hafif çalış. Hazır olacağı zaman: {when}.",
  "advice.easy.why": "%{pct} toparlandı. %70'e dönene kadar planlar onu günün odağı yapmaz.",
  "advice.train": {
    one: "Çalışmaya hazır. {count} set daha bu haftanın {goal} hedefine ulaştırır.",
    other: "Çalışmaya hazır. {count} set daha bu haftanın {goal} hedefine ulaştırır.",
  },
  "advice.train.why": "%{pct} toparlandı, bu hafta {goal} setin {done} tanesi yapıldı.",
  "advice.done": "Bu haftanın setleri tamam. Gelecek hafta için toparlanmasına izin ver.",
  "advice.done.why": "Bu hafta {goal} setin {done} tanesi yapıldı, daha fazlası pek bir şey katmaz.",
  "advice.last": "Son çalışma: {when}.",
  "advice.priority": "Öncelik yap",
  "advice.priority.hint": "Haftalık set sayısı üçte bir artar ve toparlandığında ilk o seçilir.",
};

export const pl: Partial<Record<Key, Message>> = {
  "advice.rest": "Daj mu odpocząć. Będzie gotowy {when}.",
  "advice.rest.why": "Zregenerowany w {pct}%. Plany pomijają ćwiczenia, które mocno go obciążają, dopóki nie wróci do formy.",
  "advice.easy": "Trenuj go lekko. Będzie gotowy {when}.",
  "advice.easy.why": "Zregenerowany w {pct}%. Plany nie zrobią z niego głównego celu dnia, dopóki nie wróci do 70%.",
  "advice.train": {
    one: "Gotowy do treningu. Jeszcze {count} seria do tygodniowego celu {goal}.",
    few: "Gotowy do treningu. Jeszcze {count} serie do tygodniowego celu {goal}.",
    many: "Gotowy do treningu. Jeszcze {count} serii do tygodniowego celu {goal}.",
    other: "Gotowy do treningu. Jeszcze {count} serii do tygodniowego celu {goal}.",
  },
  "advice.train.why": "Zregenerowany w {pct}%, w tym tygodniu zrobiono {done} z {goal} serii.",
  "advice.done": "Serie na ten tydzień zrobione. Daj mu się zregenerować na następny tydzień.",
  "advice.done.why": "W tym tygodniu zrobiono {done} z {goal} serii, więc kolejne niewiele dodadzą.",
  "advice.last": "Ostatnio trenowany {when}.",
  "advice.priority": "Ustaw jako priorytet",
  "advice.priority.hint": "Dostaje o jedną trzecią więcej serii tygodniowo i jest wybierany jako pierwszy po regeneracji.",
};
