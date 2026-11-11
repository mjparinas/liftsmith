import type { Message } from "@/lib/i18n";

// Text for keys starting "ton.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "ton.piano": "a grand piano",
  "ton.car": "a family car",
  "ton.elephant": "an African elephant",
  "ton.trex": "a T. rex",
  "ton.bus": "a double-decker bus",
  "ton.humpback": "a humpback whale",
  "ton.tank": "a battle tank",
  "ton.bluewhale": "a blue whale",
  "ton.liberty": "the Statue of Liberty",
  "ton.iss": "the International Space Station",
  "ton.million": "a million kilograms",
  "ton.eiffel": "the Eiffel Tower's iron",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "ton.piano": "un piano de cola",
  "ton.car": "un coche familiar",
  "ton.elephant": "un elefante africano",
  "ton.trex": "un T. rex",
  "ton.bus": "un autobús de dos pisos",
  "ton.humpback": "una ballena jorobada",
  "ton.tank": "un tanque de combate",
  "ton.bluewhale": "una ballena azul",
  "ton.liberty": "la Estatua de la Libertad",
  "ton.iss": "la Estación Espacial Internacional",
  "ton.million": "un millón de kilos",
  "ton.eiffel": "el hierro de la Torre Eiffel",
};

export const fr: Partial<Record<Key, Message>> = {
  "ton.piano": "un piano à queue",
  "ton.car": "une voiture familiale",
  "ton.elephant": "un éléphant d’Afrique",
  "ton.trex": "un T. rex",
  "ton.bus": "un bus à impériale",
  "ton.humpback": "une baleine à bosse",
  "ton.tank": "un char d’assaut",
  "ton.bluewhale": "une baleine bleue",
  "ton.liberty": "la statue de la Liberté",
  "ton.iss": "la Station spatiale internationale",
  "ton.million": "un million de kilos",
  "ton.eiffel": "le fer de la tour Eiffel",
};

export const de: Partial<Record<Key, Message>> = {
  "ton.piano": "einen Konzertflügel",
  "ton.car": "ein Familienauto",
  "ton.elephant": "einen Afrikanischen Elefanten",
  "ton.trex": "einen T. rex",
  "ton.bus": "einen Doppeldeckerbus",
  "ton.humpback": "einen Buckelwal",
  "ton.tank": "einen Kampfpanzer",
  "ton.bluewhale": "einen Blauwal",
  "ton.liberty": "die Freiheitsstatue",
  "ton.iss": "die Internationale Raumstation",
  "ton.million": "eine Million Kilogramm",
  "ton.eiffel": "das Eisen des Eiffelturms",
};

export const it: Partial<Record<Key, Message>> = {
  "ton.piano": "un pianoforte a coda",
  "ton.car": "un’auto familiare",
  "ton.elephant": "un elefante africano",
  "ton.trex": "un T. rex",
  "ton.bus": "un autobus a due piani",
  "ton.humpback": "una megattera",
  "ton.tank": "un carro armato",
  "ton.bluewhale": "una balenottera azzurra",
  "ton.liberty": "la Statua della Libertà",
  "ton.iss": "la Stazione Spaziale Internazionale",
  "ton.million": "un milione di chili",
  "ton.eiffel": "il ferro della Torre Eiffel",
};

export const ja: Partial<Record<Key, Message>> = {
  "ton.piano": "グランドピアノ",
  "ton.car": "ファミリーカー",
  "ton.elephant": "アフリカゾウ",
  "ton.trex": "ティラノサウルス",
  "ton.bus": "2階建てバス",
  "ton.humpback": "ザトウクジラ",
  "ton.tank": "戦車",
  "ton.bluewhale": "シロナガスクジラ",
  "ton.liberty": "自由の女神",
  "ton.iss": "国際宇宙ステーション",
  "ton.million": "100万キログラム",
  "ton.eiffel": "エッフェル塔の鉄骨",
};
