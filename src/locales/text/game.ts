import type { Message } from "@/lib/i18n";

// Text for keys starting "game.": the game card on Today (streak at risk, this week's quests, the closest
// badge), in every language. English is the source.

export const en = {
  "game.freezeSaves": {
    one: "This week's goal is out of reach. A freeze will save your {count}-week streak.",
    other: "This week's goal is out of reach. A freeze will save your {count}-week streak.",
  },
  "game.streakResets": {
    one: "This week's goal is out of reach, so your {count}-week streak starts again on Monday. Every 4 goal weeks earns a freeze.",
    other: "This week's goal is out of reach, so your {count}-week streak starts again on Monday. Every 4 goal weeks earns a freeze.",
  },
  "game.thisWeek": "This week",
  "game.almost": "Almost there:",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "El objetivo de esta semana ya no se puede cumplir. Un congelador salvará tu racha de {count} semana.",
    other: "El objetivo de esta semana ya no se puede cumplir. Un congelador salvará tu racha de {count} semanas.",
  },
  "game.streakResets": {
    one: "El objetivo de esta semana ya no se puede cumplir, así que tu racha de {count} semana vuelve a empezar el lunes. Cada 4 semanas con el objetivo cumplido ganas un congelador.",
    other:
      "El objetivo de esta semana ya no se puede cumplir, así que tu racha de {count} semanas vuelve a empezar el lunes. Cada 4 semanas con el objetivo cumplido ganas un congelador.",
  },
  "game.thisWeek": "Esta semana",
  "game.almost": "Casi lo tienes:",
};

export const fr: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "L’objectif de cette semaine est hors de portée. Un gel sauvera votre série de {count} semaine.",
    other: "L’objectif de cette semaine est hors de portée. Un gel sauvera votre série de {count} semaines.",
  },
  "game.streakResets": {
    one: "L’objectif de cette semaine est hors de portée, votre série de {count} semaine repart donc à zéro lundi. Chaque tranche de 4 semaines d’objectif atteint vous rapporte un gel.",
    other:
      "L’objectif de cette semaine est hors de portée, votre série de {count} semaines repart donc à zéro lundi. Chaque tranche de 4 semaines d’objectif atteint vous rapporte un gel.",
  },
  "game.thisWeek": "Cette semaine",
  "game.almost": "Presque :",
};

export const de: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "Das Wochenziel ist nicht mehr zu schaffen. Ein Freeze rettet deine Serie von {count} Woche.",
    other: "Das Wochenziel ist nicht mehr zu schaffen. Ein Freeze rettet deine Serie von {count} Wochen.",
  },
  "game.streakResets": {
    one: "Das Wochenziel ist nicht mehr zu schaffen, deshalb beginnt deine Serie von {count} Woche am Montag neu. Alle 4 Zielwochen gibt es einen Freeze.",
    other:
      "Das Wochenziel ist nicht mehr zu schaffen, deshalb beginnt deine Serie von {count} Wochen am Montag neu. Alle 4 Zielwochen gibt es einen Freeze.",
  },
  "game.thisWeek": "Diese Woche",
  "game.almost": "Fast geschafft:",
};

export const it: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "L’obiettivo di questa settimana non è più raggiungibile. Un freeze salverà la tua serie di {count} settimana.",
    other: "L’obiettivo di questa settimana non è più raggiungibile. Un freeze salverà la tua serie di {count} settimane.",
  },
  "game.streakResets": {
    one: "L’obiettivo di questa settimana non è più raggiungibile, quindi la tua serie di {count} settimana ripartirà lunedì. Ogni 4 settimane a obiettivo guadagni un freeze.",
    other:
      "L’obiettivo di questa settimana non è più raggiungibile, quindi la tua serie di {count} settimane ripartirà lunedì. Ogni 4 settimane a obiettivo guadagni un freeze.",
  },
  "game.thisWeek": "Questa settimana",
  "game.almost": "Ci sei quasi:",
};

export const ja: Partial<Record<Key, Message>> = {
  "game.freezeSaves": { other: "今週の目標は達成できなくなりました。フリーズで{count}週間の連続記録を守れます。" },
  "game.streakResets": {
    other:
      "今週の目標は達成できなくなったため、{count}週間の連続記録は月曜日からやり直しです。目標達成4週ごとにフリーズを1つ獲得できます。",
  },
  "game.thisWeek": "今週",
  "game.almost": "あと少し：",
};

export const pt: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "A meta desta semana não dá mais para alcançar. Um congelamento vai salvar sua sequência de {count} semana.",
    other: "A meta desta semana não dá mais para alcançar. Um congelamento vai salvar sua sequência de {count} semanas.",
  },
  "game.streakResets": {
    one: "A meta desta semana não dá mais para alcançar, então sua sequência de {count} semana recomeça na segunda. A cada 4 semanas com meta cumprida você ganha um congelamento.",
    other:
      "A meta desta semana não dá mais para alcançar, então sua sequência de {count} semanas recomeça na segunda. A cada 4 semanas com meta cumprida você ganha um congelamento.",
  },
  "game.thisWeek": "Esta semana",
  "game.almost": "Quase lá:",
};

export const ko: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    other: "이번 주 목표는 달성할 수 없어요. 프리즈가 {count}주 연속 기록을 지켜 줄 거예요.",
  },
  "game.streakResets": {
    other:
      "이번 주 목표는 달성할 수 없어서 {count}주 연속 기록이 월요일에 다시 시작돼요. 목표를 달성한 주가 4번 쌓일 때마다 프리즈를 받아요.",
  },
  "game.thisWeek": "이번 주",
  "game.almost": "거의 다 왔어요:",
};

export const tr: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "Bu haftanın hedefine artık ulaşılamaz. Bir dondurma {count} haftalık serini kurtaracak.",
    other: "Bu haftanın hedefine artık ulaşılamaz. Bir dondurma {count} haftalık serini kurtaracak.",
  },
  "game.streakResets": {
    one: "Bu haftanın hedefine artık ulaşılamaz, bu yüzden {count} haftalık serin pazartesi yeniden başlar. Hedefe ulaşılan her 4 hafta bir dondurma kazandırır.",
    other:
      "Bu haftanın hedefine artık ulaşılamaz, bu yüzden {count} haftalık serin pazartesi yeniden başlar. Hedefe ulaşılan her 4 hafta bir dondurma kazandırır.",
  },
  "game.thisWeek": "Bu hafta",
  "game.almost": "Az kaldı:",
};

export const pl: Partial<Record<Key, Message>> = {
  "game.freezeSaves": {
    one: "Cel na ten tydzień jest już poza zasięgiem. Zamrożenie uratuje twoją passę ({count} tydz.).",
    few: "Cel na ten tydzień jest już poza zasięgiem. Zamrożenie uratuje twoją passę ({count} tyg.).",
    many: "Cel na ten tydzień jest już poza zasięgiem. Zamrożenie uratuje twoją passę ({count} tyg.).",
    other: "Cel na ten tydzień jest już poza zasięgiem. Zamrożenie uratuje twoją passę ({count} tyg.).",
  },
  "game.streakResets": {
    one: "Cel na ten tydzień jest już poza zasięgiem, więc twoja passa ({count} tydz.) zacznie się od nowa w poniedziałek. Co 4 tygodnie z osiągniętym celem dają zamrożenie.",
    few: "Cel na ten tydzień jest już poza zasięgiem, więc twoja passa ({count} tyg.) zacznie się od nowa w poniedziałek. Co 4 tygodnie z osiągniętym celem dają zamrożenie.",
    many: "Cel na ten tydzień jest już poza zasięgiem, więc twoja passa ({count} tyg.) zacznie się od nowa w poniedziałek. Co 4 tygodnie z osiągniętym celem dają zamrożenie.",
    other:
      "Cel na ten tydzień jest już poza zasięgiem, więc twoja passa ({count} tyg.) zacznie się od nowa w poniedziałek. Co 4 tygodnie z osiągniętym celem dają zamrożenie.",
  },
  "game.thisWeek": "Ten tydzień",
  "game.almost": "Już prawie:",
};
