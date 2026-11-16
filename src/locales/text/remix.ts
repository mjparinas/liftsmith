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

export const pt: Partial<Record<Key, Message>> = {
  "remix.broken": "Este link de treino não abriu. Ele pode ser de uma versão mais nova do app, ou estar cortado.",
  "remix.back": "Voltar para hoje",
  "remix.title": "Treino compartilhado",
  "remix.rebuilt": "Refeito para {gym} com os seus pesos. Cerca de {min} min.",
  "remix.yourGym": "sua academia",
  "remix.closest": "(o mais parecido aqui)",
  "remix.missing": "{name}: nada parecido aqui, ficou de fora",
  "remix.finishFirst": "Termine primeiro o treino em andamento e depois abra o link de novo.",
  "remix.start": "Começar este treino",
  "remix.notNow": "Agora não",
  "remix.shareTitle": "Um treino para você",
  "remix.noteSame": "De um treino compartilhado, com os seus pesos",
  "remix.noteSwap": "Trocado por {name} nesta academia",
};

export const ko: Partial<Record<Key, Message>> = {
  "remix.broken": "이 운동 링크를 열 수 없어요. 앱의 최신 버전에서 만든 링크이거나 잘렸을 수 있어요.",
  "remix.back": "오늘로 돌아가기",
  "remix.title": "공유된 운동",
  "remix.rebuilt": "{gym}에 맞게 내 무게로 다시 구성했어요. 약 {min}분.",
  "remix.yourGym": "내 헬스장",
  "remix.closest": "(여기서 가장 비슷한 동작)",
  "remix.missing": "{name}: 여기엔 비슷한 동작이 없어서 뺐어요",
  "remix.finishFirst": "지금 하고 있는 운동을 먼저 마친 뒤 링크를 다시 여세요.",
  "remix.start": "이 운동 시작",
  "remix.notNow": "나중에",
  "remix.shareTitle": "당신을 위한 운동",
  "remix.noteSame": "공유된 운동에서, 내 무게로",
  "remix.noteSwap": "이 헬스장에서 {name} 대신 교체",
};

export const tr: Partial<Record<Key, Message>> = {
  "remix.broken": "Bu antrenman bağlantısı açılmadı. Uygulamanın daha yeni bir sürümünden olabilir ya da kesik kalmış olabilir.",
  "remix.back": "Bugün'e dön",
  "remix.title": "Paylaşılan antrenman",
  "remix.rebuilt": "{gym} için kendi ağırlıklarınla yeniden oluşturuldu. Yaklaşık {min} dk.",
  "remix.yourGym": "salonun",
  "remix.closest": "(buradaki en yakın karşılık)",
  "remix.missing": "{name}: burada benzeri yok, çıkarıldı",
  "remix.finishFirst": "Önce içinde olduğun antrenmanı bitir, sonra bağlantıyı yeniden aç.",
  "remix.start": "Bu antrenmana başla",
  "remix.notNow": "Şimdi değil",
  "remix.shareTitle": "Sana bir antrenman",
  "remix.noteSame": "Paylaşılan bir antrenmandan, senin ağırlıklarınla",
  "remix.noteSwap": "Bu salonda {name} yerine geldi",
};

export const pl: Partial<Record<Key, Message>> = {
  "remix.broken": "Ten link do treningu się nie otworzył. Może pochodzi z nowszej wersji aplikacji albo został ucięty.",
  "remix.back": "Wróć do Dziś",
  "remix.title": "Udostępniony trening",
  "remix.rebuilt": "Przebudowany dla: {gym}, z twoimi ciężarami. Około {min} min.",
  "remix.yourGym": "twoja siłownia",
  "remix.closest": "(najbliższy odpowiednik tutaj)",
  "remix.missing": "{name}: nic podobnego tutaj, pominięte",
  "remix.finishFirst": "Najpierw skończ obecny trening, potem otwórz link ponownie.",
  "remix.start": "Zacznij ten trening",
  "remix.notNow": "Nie teraz",
  "remix.shareTitle": "Trening dla ciebie",
  "remix.noteSame": "Z udostępnionego treningu, z twoimi ciężarami",
  "remix.noteSwap": "Zamiast: {name} na tej siłowni",
};
