import type { Message } from "@/lib/i18n";

// Text for keys starting "remix.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "remix.broken": "This workout link didn’t open. It may be from a newer version of the app, or cut short.",
  "remix.back": "Back to today",
  "remix.title": "Shared workout",
  "remix.rebuilt": "Rebuilt for {gym} at your own weights. About {min} min.",
  "remix.yourGym": "your gym",
  "remix.closest": "(closest match here)",
  "remix.missing": "{name}: nothing similar here, left out",
  "remix.finishFirst": "Finish the workout you’re in first, then open the link again.",
  "remix.start": "Start this workout",
  "remix.notNow": "Not now",
  "remix.shareTitle": "A workout for you",
  "remix.noteSame": "From a shared workout, at your weights",
  "remix.noteSwap": "Swapped in for {name} at this gym",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "remix.broken": "Este enlace de entrenamiento no se abrió. Puede ser de una versión más nueva de la app o estar cortado.",
  "remix.back": "Volver a hoy",
  "remix.title": "Entrenamiento compartido",
  "remix.rebuilt": "Adaptado a {gym} con tus propios pesos. Unos {min} min.",
  "remix.yourGym": "tu gimnasio",
  "remix.closest": "(lo más parecido aquí)",
  "remix.missing": "{name}: nada parecido aquí, se omite",
  "remix.finishFirst": "Termina primero el entrenamiento en curso y luego abre el enlace otra vez.",
  "remix.start": "Empezar este entrenamiento",
  "remix.notNow": "Ahora no",
  "remix.shareTitle": "Un entrenamiento para ti",
  "remix.noteSame": "De un entrenamiento compartido, con tus pesos",
  "remix.noteSwap": "En lugar de {name} en este gimnasio",
};

export const fr: Partial<Record<Key, Message>> = {
  "remix.broken": "Ce lien de séance ne s’est pas ouvert. Il vient peut-être d’une version plus récente de l’app, ou il est coupé.",
  "remix.back": "Retour à aujourd’hui",
  "remix.title": "Séance partagée",
  "remix.rebuilt": "Adaptée à {gym} avec vos propres charges. Environ {min} min.",
  "remix.yourGym": "votre salle",
  "remix.closest": "(le plus proche ici)",
  "remix.missing": "{name} : rien de semblable ici, retiré",
  "remix.finishFirst": "Terminez d’abord la séance en cours, puis rouvrez le lien.",
  "remix.start": "Commencer cette séance",
  "remix.notNow": "Pas maintenant",
  "remix.shareTitle": "Une séance pour vous",
  "remix.noteSame": "Tiré d’une séance partagée, avec vos charges",
  "remix.noteSwap": "Remplace {name} dans cette salle",
};

export const de: Partial<Record<Key, Message>> = {
  "remix.broken": "Dieser Trainingslink ließ sich nicht öffnen. Er stammt vielleicht aus einer neueren App-Version oder ist abgeschnitten.",
  "remix.back": "Zurück zu Heute",
  "remix.title": "Geteiltes Training",
  "remix.rebuilt": "Für {gym} mit deinen eigenen Gewichten neu aufgebaut. Etwa {min} Min.",
  "remix.yourGym": "dein Studio",
  "remix.closest": "(nächste Entsprechung hier)",
  "remix.missing": "{name}: hier nichts Ähnliches, weggelassen",
  "remix.finishFirst": "Beende zuerst dein laufendes Training und öffne den Link dann erneut.",
  "remix.start": "Dieses Training starten",
  "remix.notNow": "Nicht jetzt",
  "remix.shareTitle": "Ein Training für dich",
  "remix.noteSame": "Aus einem geteilten Training, mit deinen Gewichten",
  "remix.noteSwap": "Ersetzt {name} in diesem Studio",
};

export const it: Partial<Record<Key, Message>> = {
  "remix.broken": "Questo link all’allenamento non si è aperto. Potrebbe venire da una versione più recente dell’app, o essere troncato.",
  "remix.back": "Torna a oggi",
  "remix.title": "Allenamento condiviso",
  "remix.rebuilt": "Ricostruito per {gym} con i tuoi pesi. Circa {min} min.",
  "remix.yourGym": "la tua palestra",
  "remix.closest": "(il più simile qui)",
  "remix.missing": "{name}: niente di simile qui, escluso",
  "remix.finishFirst": "Prima finisci l’allenamento in corso, poi riapri il link.",
  "remix.start": "Inizia questo allenamento",
  "remix.notNow": "Non ora",
  "remix.shareTitle": "Un allenamento per te",
  "remix.noteSame": "Da un allenamento condiviso, con i tuoi pesi",
  "remix.noteSwap": "Al posto di {name} in questa palestra",
};

export const ja: Partial<Record<Key, Message>> = {
  "remix.broken": "このワークアウトのリンクを開けませんでした。新しいバージョンのアプリのものか、途中で切れている可能性があります。",
  "remix.back": "今日に戻る",
  "remix.title": "共有されたワークアウト",
  "remix.rebuilt": "{gym}向けに、あなたの重量で組み直しました。約{min}分。",
  "remix.yourGym": "あなたのジム",
  "remix.closest": "（ここで最も近い種目）",
  "remix.missing": "{name}：ここに似た種目がないため省略",
  "remix.finishFirst": "実行中のワークアウトを終えてから、もう一度リンクを開いてください。",
  "remix.start": "このワークアウトを開始",
  "remix.notNow": "今はしない",
  "remix.shareTitle": "あなたへのワークアウト",
  "remix.noteSame": "共有ワークアウトから、あなたの重量で",
  "remix.noteSwap": "このジムでは{name}の代わり",
};
