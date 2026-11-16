import type { Message } from "@/lib/i18n";

// Text for keys starting "nav.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "nav.main": "Main",
  "nav.back.today": "Today",
  "nav.loading": "Loading",
  "nav.crash.title": "Something went wrong on this screen",
  "nav.crash.body": "Your workout and data are safe. Reload to carry on.",
  "nav.crash.reload": "Reload",
  "nav.crash.details": "Error details",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "nav.main": "Principal",
  "nav.back.today": "Hoy",
  "nav.loading": "Cargando",
  "nav.crash.title": "Algo salió mal en esta pantalla",
  "nav.crash.body": "Tu entrenamiento y tus datos están a salvo. Recarga para seguir.",
  "nav.crash.reload": "Recargar",
  "nav.crash.details": "Detalles del error",
};

export const fr: Partial<Record<Key, Message>> = {
  "nav.main": "Principale",
  "nav.back.today": "Aujourd’hui",
  "nav.loading": "Chargement",
  "nav.crash.title": "Un problème est survenu sur cet écran",
  "nav.crash.body": "Ta séance et tes données sont en sécurité. Recharge pour continuer.",
  "nav.crash.reload": "Recharger",
  "nav.crash.details": "Détails de l’erreur",
};

export const de: Partial<Record<Key, Message>> = {
  "nav.main": "Hauptmenü",
  "nav.back.today": "Heute",
  "nav.loading": "Wird geladen",
  "nav.crash.title": "Auf diesem Bildschirm ist etwas schiefgelaufen",
  "nav.crash.body": "Dein Training und deine Daten sind sicher. Lade neu, um weiterzumachen.",
  "nav.crash.reload": "Neu laden",
  "nav.crash.details": "Fehlerdetails",
};

export const it: Partial<Record<Key, Message>> = {
  "nav.main": "Principale",
  "nav.back.today": "Oggi",
  "nav.loading": "Caricamento",
  "nav.crash.title": "Qualcosa è andato storto in questa schermata",
  "nav.crash.body": "Il tuo allenamento e i tuoi dati sono al sicuro. Ricarica per continuare.",
  "nav.crash.reload": "Ricarica",
  "nav.crash.details": "Dettagli dell’errore",
};

export const ja: Partial<Record<Key, Message>> = {
  "nav.main": "メイン",
  "nav.back.today": "今日",
  "nav.loading": "読み込み中",
  "nav.crash.title": "この画面で問題が発生しました",
  "nav.crash.body": "ワークアウトとデータは安全です。再読み込みして続けてください。",
  "nav.crash.reload": "再読み込み",
  "nav.crash.details": "エラーの詳細",
};

export const pt: Partial<Record<Key, Message>> = {
  "nav.main": "Principal",
  "nav.back.today": "Hoje",
  "nav.loading": "Carregando",
  "nav.crash.title": "Algo deu errado nesta tela",
  "nav.crash.body": "Seu treino e seus dados estão seguros. Recarregue para continuar.",
  "nav.crash.reload": "Recarregar",
  "nav.crash.details": "Detalhes do erro",
};

export const ko: Partial<Record<Key, Message>> = {
  "nav.main": "메인",
  "nav.back.today": "오늘",
  "nav.loading": "불러오는 중",
  "nav.crash.title": "이 화면에서 문제가 생겼어요",
  "nav.crash.body": "운동과 데이터는 안전해요. 새로고침해서 계속하세요.",
  "nav.crash.reload": "새로고침",
  "nav.crash.details": "오류 정보",
};

export const tr: Partial<Record<Key, Message>> = {
  "nav.main": "Ana",
  "nav.back.today": "Bugün",
  "nav.loading": "Yükleniyor",
  "nav.crash.title": "Bu ekranda bir şeyler ters gitti",
  "nav.crash.body": "Antrenmanın ve verilerin güvende. Devam etmek için yeniden yükle.",
  "nav.crash.reload": "Yeniden yükle",
  "nav.crash.details": "Hata ayrıntıları",
};

export const pl: Partial<Record<Key, Message>> = {
  "nav.main": "Główna",
  "nav.back.today": "Dziś",
  "nav.loading": "Ładowanie",
  "nav.crash.title": "Coś poszło nie tak na tym ekranie",
  "nav.crash.body": "Twój trening i dane są bezpieczne. Odśwież, żeby kontynuować.",
  "nav.crash.reload": "Odśwież",
  "nav.crash.details": "Szczegóły błędu",
};
