import type { Message } from "@/lib/i18n";

// Text for keys starting "pr.": personal record moments (the banner during a workout, the "PR in reach"
// line on the rest card, and the PR replay on the summary), in every language. English is the source.

export const en = {
  "pr.banner": "New personal record",
  "pr.isNew": "{reps} reps at {weight} is a new PR.",
  "pr.inReach": "PR in reach: {reps} reps at {weight} beats your best.",
  "pr.replay": "▶ Replay {name}",
  "pr.replayTitle": "PR replay",
  "pr.newBest": "New personal best",
  "pr.demoLabel": "New best: {weight} × {reps}",
  "pr.allReps": { one: "{count} rep. Every one of them yours.", other: "{count} reps. Every one of them yours." },
  "pr.rep": "Rep {n}",
  "pr.estMax": "Estimated max now {weight}",
  "pr.again": "Play again",
  "pr.share": "Share this PR",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "pr.banner": "Nueva mejor marca",
  "pr.isNew": "{reps} repeticiones con {weight} es una nueva mejor marca.",
  "pr.inReach": "Mejor marca a tu alcance: {reps} repeticiones con {weight} superan tu récord.",
  "pr.replay": "▶ Repetir {name}",
  "pr.replayTitle": "Repetición de tu mejor marca",
  "pr.newBest": "Nueva mejor marca",
  "pr.demoLabel": "Nueva mejor marca: {weight} × {reps}",
  "pr.allReps": { one: "{count} repetición. Toda tuya.", other: "{count} repeticiones. Todas tuyas." },
  "pr.rep": "Repetición {n}",
  "pr.estMax": "Máximo estimado ahora {weight}",
  "pr.again": "Ver otra vez",
  "pr.share": "Compartir este récord",
};

export const fr: Partial<Record<Key, Message>> = {
  "pr.banner": "Nouveau record personnel",
  "pr.isNew": "{reps} répétitions à {weight}, c’est un nouveau record.",
  "pr.inReach": "Record à portée : {reps} répétitions à {weight} battent votre meilleur.",
  "pr.replay": "▶ Revoir {name}",
  "pr.replayTitle": "Revoir le record",
  "pr.newBest": "Nouveau record personnel",
  "pr.demoLabel": "Nouveau record : {weight} × {reps}",
  "pr.allReps": { one: "{count} répétition. Elle est toute à vous.", other: "{count} répétitions. Chacune est à vous." },
  "pr.rep": "Répétition {n}",
  "pr.estMax": "Max estimé maintenant {weight}",
  "pr.again": "Revoir",
  "pr.share": "Partager ce record",
};

export const de: Partial<Record<Key, Message>> = {
  "pr.banner": "Neuer persönlicher Rekord",
  "pr.isNew": "{reps} Wdh. mit {weight} sind ein neuer PR.",
  "pr.inReach": "PR in Reichweite: {reps} Wdh. mit {weight} schlagen deine Bestleistung.",
  "pr.replay": "▶ {name} nochmal ansehen",
  "pr.replayTitle": "PR-Wiederholung",
  "pr.newBest": "Neue Bestleistung",
  "pr.demoLabel": "Neue Bestleistung: {weight} × {reps}",
  "pr.allReps": { one: "{count} Wiederholung. Jede einzelne deine.", other: "{count} Wiederholungen. Jede einzelne deine." },
  "pr.rep": "Wdh. {n}",
  "pr.estMax": "Geschätztes Maximum jetzt {weight}",
  "pr.again": "Nochmal abspielen",
  "pr.share": "Diesen Rekord teilen",
};

export const it: Partial<Record<Key, Message>> = {
  "pr.banner": "Nuovo record personale",
  "pr.isNew": "{reps} ripetizioni con {weight} sono un nuovo PR.",
  "pr.inReach": "PR a portata: {reps} ripetizioni con {weight} battono il tuo record.",
  "pr.replay": "▶ Rivedi {name}",
  "pr.replayTitle": "Replay del PR",
  "pr.newBest": "Nuovo record",
  "pr.demoLabel": "Nuovo record: {weight} × {reps}",
  "pr.allReps": { one: "{count} ripetizione. Ognuna è tua.", other: "{count} ripetizioni. Ognuna è tua." },
  "pr.rep": "Rip. {n}",
  "pr.estMax": "Massimale stimato ora {weight}",
  "pr.again": "Riproduci di nuovo",
  "pr.share": "Condividi questo record",
};

export const ja: Partial<Record<Key, Message>> = {
  "pr.banner": "自己ベスト更新",
  "pr.isNew": "{weight}で{reps}回は自己ベストです。",
  "pr.inReach": "自己ベスト目前：{weight}で{reps}回なら記録更新です。",
  "pr.replay": "▶ {name}をリプレイ",
  "pr.replayTitle": "自己ベストのリプレイ",
  "pr.newBest": "自己ベスト",
  "pr.demoLabel": "自己ベスト：{weight} × {reps}",
  "pr.allReps": { other: "{count}回。すべてあなたの力です。" },
  "pr.rep": "{n}回目",
  "pr.estMax": "推定最大重量は{weight}に",
  "pr.again": "もう一度再生",
  "pr.share": "この自己ベストをシェア",
};

export const pt: Partial<Record<Key, Message>> = {
  "pr.banner": "Novo recorde pessoal",
  "pr.isNew": "{reps} reps com {weight} é um novo recorde.",
  "pr.inReach": "Recorde ao alcance: {reps} reps com {weight} supera seu melhor.",
  "pr.replay": "▶ Rever {name}",
  "pr.replayTitle": "Replay do recorde",
  "pr.newBest": "Novo recorde pessoal",
  "pr.demoLabel": "Novo recorde: {weight} × {reps}",
  "pr.allReps": {
    one: "{count} rep. Cada uma delas é sua.",
    other: "{count} reps. Cada uma delas é sua.",
  },
  "pr.rep": "Rep {n}",
  "pr.estMax": "Máximo estimado agora: {weight}",
  "pr.again": "Ver de novo",
  "pr.share": "Compartilhar este recorde",
};

export const ko: Partial<Record<Key, Message>> = {
  "pr.banner": "새 개인 최고 기록",
  "pr.isNew": "{weight}로 {reps}회는 새 PR이에요.",
  "pr.inReach": "PR 눈앞: {weight}로 {reps}회면 최고 기록을 넘어요.",
  "pr.replay": "▶ {name} 다시 보기",
  "pr.replayTitle": "PR 다시 보기",
  "pr.newBest": "새 개인 최고 기록",
  "pr.demoLabel": "새 최고 기록: {weight} × {reps}",
  "pr.allReps": {
    other: "{count}회. 한 회 한 회 모두 당신이 해냈어요.",
  },
  "pr.rep": "{n}회",
  "pr.estMax": "추정 최대 무게가 이제 {weight}",
  "pr.again": "다시 재생",
  "pr.share": "이 PR 공유",
};

export const tr: Partial<Record<Key, Message>> = {
  "pr.banner": "Yeni kişisel rekor",
  "pr.isNew": "{weight} ile {reps} tekrar yeni bir kişisel rekor.",
  "pr.inReach": "Kişisel rekor elinin altında: {weight} ile {reps} tekrar en iyini geçer.",
  "pr.replay": "▶ {name} tekrar oynat",
  "pr.replayTitle": "Rekor tekrarı",
  "pr.newBest": "Yeni kişisel rekor",
  "pr.demoLabel": "Yeni rekor: {weight} × {reps}",
  "pr.allReps": {
    one: "{count} tekrar. Her biri senin.",
    other: "{count} tekrar. Her biri senin.",
  },
  "pr.rep": "{n}. tekrar",
  "pr.estMax": "Tahmini maksimum artık {weight}",
  "pr.again": "Yeniden oynat",
  "pr.share": "Bu rekoru paylaş",
};

export const pl: Partial<Record<Key, Message>> = {
  "pr.banner": "Nowy rekord życiowy",
  "pr.isNew": "{reps} powt. z {weight} to nowy rekord życiowy.",
  "pr.inReach": "Rekord w zasięgu: {reps} powt. z {weight} pobija twój najlepszy wynik.",
  "pr.replay": "▶ Odtwórz: {name}",
  "pr.replayTitle": "Powtórka rekordu",
  "pr.newBest": "Nowy rekord życiowy",
  "pr.demoLabel": "Nowy rekord: {weight} × {reps}",
  "pr.allReps": {
    one: "{count} powtórzenie. W całości twoje.",
    few: "{count} powtórzenia. Każde z nich twoje.",
    many: "{count} powtórzeń. Każde z nich twoje.",
    other: "{count} powtórzenia. Każde z nich twoje.",
  },
  "pr.rep": "Powtórzenie {n}",
  "pr.estMax": "Szacowany maks teraz {weight}",
  "pr.again": "Odtwórz ponownie",
  "pr.share": "Udostępnij ten rekord",
};
