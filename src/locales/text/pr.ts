import type { Message } from "@/lib/i18n";

// Text for keys starting "pr.": personal record moments (the banner during a workout, the "PR in reach"
// line on the rest card, and the PR replay on the summary), in every language. English is the source.

export const en = {
  "pr.banner": "New personal record",
  "pr.isNew": "🏆 {reps} reps at {weight} is a new PR.",
  "pr.inReach": "🏆 PR in reach: {reps} reps at {weight} beats your best.",
  "pr.replay": "▶ Replay {name}",
  "pr.replayTitle": "PR replay",
  "pr.newBest": "New personal best",
  "pr.demoLabel": "New best: {weight} × {reps}",
  "pr.allReps": { one: "{count} rep. Every one of them yours.", other: "{count} reps. Every one of them yours." },
  "pr.rep": "Rep {n}",
  "pr.estMax": "Estimated max now {weight}",
  "pr.again": "Play again",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "pr.banner": "Nueva mejor marca",
  "pr.isNew": "🏆 {reps} repeticiones con {weight} es una nueva mejor marca.",
  "pr.inReach": "🏆 Mejor marca a tu alcance: {reps} repeticiones con {weight} superan tu récord.",
  "pr.replay": "▶ Repetir {name}",
  "pr.replayTitle": "Repetición de tu mejor marca",
  "pr.newBest": "Nueva mejor marca",
  "pr.demoLabel": "Nueva mejor marca: {weight} × {reps}",
  "pr.allReps": { one: "{count} repetición. Toda tuya.", other: "{count} repeticiones. Todas tuyas." },
  "pr.rep": "Repetición {n}",
  "pr.estMax": "Máximo estimado ahora {weight}",
  "pr.again": "Ver otra vez",
};

export const fr: Partial<Record<Key, Message>> = {
  "pr.banner": "Nouveau record personnel",
  "pr.isNew": "🏆 {reps} répétitions à {weight}, c’est un nouveau record.",
  "pr.inReach": "🏆 Record à portée : {reps} répétitions à {weight} battent votre meilleur.",
  "pr.replay": "▶ Revoir {name}",
  "pr.replayTitle": "Revoir le record",
  "pr.newBest": "Nouveau record personnel",
  "pr.demoLabel": "Nouveau record : {weight} × {reps}",
  "pr.allReps": { one: "{count} répétition. Elle est toute à vous.", other: "{count} répétitions. Chacune est à vous." },
  "pr.rep": "Répétition {n}",
  "pr.estMax": "Max estimé maintenant {weight}",
  "pr.again": "Revoir",
};

export const de: Partial<Record<Key, Message>> = {
  "pr.banner": "Neuer persönlicher Rekord",
  "pr.isNew": "🏆 {reps} Wdh. mit {weight} sind ein neuer PR.",
  "pr.inReach": "🏆 PR in Reichweite: {reps} Wdh. mit {weight} schlagen deine Bestleistung.",
  "pr.replay": "▶ {name} nochmal ansehen",
  "pr.replayTitle": "PR-Wiederholung",
  "pr.newBest": "Neue Bestleistung",
  "pr.demoLabel": "Neue Bestleistung: {weight} × {reps}",
  "pr.allReps": { one: "{count} Wiederholung. Jede einzelne deine.", other: "{count} Wiederholungen. Jede einzelne deine." },
  "pr.rep": "Wdh. {n}",
  "pr.estMax": "Geschätztes Maximum jetzt {weight}",
  "pr.again": "Nochmal abspielen",
};

export const it: Partial<Record<Key, Message>> = {
  "pr.banner": "Nuovo record personale",
  "pr.isNew": "🏆 {reps} ripetizioni con {weight} sono un nuovo PR.",
  "pr.inReach": "🏆 PR a portata: {reps} ripetizioni con {weight} battono il tuo record.",
  "pr.replay": "▶ Rivedi {name}",
  "pr.replayTitle": "Replay del PR",
  "pr.newBest": "Nuovo record",
  "pr.demoLabel": "Nuovo record: {weight} × {reps}",
  "pr.allReps": { one: "{count} ripetizione. Ognuna è tua.", other: "{count} ripetizioni. Ognuna è tua." },
  "pr.rep": "Rip. {n}",
  "pr.estMax": "Massimale stimato ora {weight}",
  "pr.again": "Riproduci di nuovo",
};

export const ja: Partial<Record<Key, Message>> = {
  "pr.banner": "自己ベスト更新",
  "pr.isNew": "🏆 {weight}で{reps}回は自己ベストです。",
  "pr.inReach": "🏆 自己ベスト目前：{weight}で{reps}回なら記録更新です。",
  "pr.replay": "▶ {name}をリプレイ",
  "pr.replayTitle": "自己ベストのリプレイ",
  "pr.newBest": "自己ベスト",
  "pr.demoLabel": "自己ベスト：{weight} × {reps}",
  "pr.allReps": { other: "{count}回。すべてあなたの力です。" },
  "pr.rep": "{n}回目",
  "pr.estMax": "推定最大重量は{weight}に",
  "pr.again": "もう一度再生",
};
