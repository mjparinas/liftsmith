import type { Message } from "@/lib/i18n";

// Text for keys starting "bmi.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "bmi.under": "Underweight",
  "bmi.healthy": "Healthy range",
  "bmi.over": "Overweight",
  "bmi.obese": "Obese",
  "bmi.where": "BMI {bmi}: {band}. The bands are under 18.5, 18.5 to 25, 25 to 30, and 30 and over.",
  "bmi.note": "BMI can't tell muscle from fat, so lifters often read high. Body fat says more.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "bmi.under": "Bajo peso",
  "bmi.healthy": "Rango saludable",
  "bmi.over": "Sobrepeso",
  "bmi.obese": "Obesidad",
  "bmi.where": "IMC {bmi}: {band}. Los rangos son menos de 18,5, de 18,5 a 25, de 25 a 30, y 30 o más.",
  "bmi.note": "El IMC no distingue músculo de grasa, así que quien entrena suele salir alto. La grasa corporal dice más.",
};

export const fr: Partial<Record<Key, Message>> = {
  "bmi.under": "Insuffisance pondérale",
  "bmi.healthy": "Zone saine",
  "bmi.over": "Surpoids",
  "bmi.obese": "Obésité",
  "bmi.where": "IMC {bmi} : {band}. Les zones sont moins de 18,5, de 18,5 à 25, de 25 à 30, et 30 ou plus.",
  "bmi.note":
    "L'IMC ne distingue pas le muscle de la graisse, alors les pratiquants de musculation sortent souvent haut. Le taux de graisse en dit plus.",
};

export const de: Partial<Record<Key, Message>> = {
  "bmi.under": "Untergewicht",
  "bmi.healthy": "Gesunder Bereich",
  "bmi.over": "Übergewicht",
  "bmi.obese": "Adipositas",
  "bmi.where": "BMI {bmi}: {band}. Die Bereiche sind unter 18,5, 18,5 bis 25, 25 bis 30 sowie 30 und mehr.",
  "bmi.note":
    "Der BMI unterscheidet nicht zwischen Muskeln und Fett, deshalb liegen Kraftsportler oft hoch. Der Körperfettanteil sagt mehr.",
};

export const it: Partial<Record<Key, Message>> = {
  "bmi.under": "Sottopeso",
  "bmi.healthy": "Normopeso",
  "bmi.over": "Sovrappeso",
  "bmi.obese": "Obesità",
  "bmi.where": "IMC {bmi}: {band}. Le fasce sono sotto 18,5, da 18,5 a 25, da 25 a 30, e 30 o più.",
  "bmi.note": "L'IMC non distingue i muscoli dal grasso, quindi chi solleva pesi risulta spesso alto. La massa grassa dice di più.",
};

export const ja: Partial<Record<Key, Message>> = {
  "bmi.under": "低体重",
  "bmi.healthy": "標準範囲",
  "bmi.over": "過体重",
  "bmi.obese": "肥満",
  "bmi.where": "BMI {bmi}：{band}。区分は18.5未満、18.5〜25、25〜30、30以上です。",
  "bmi.note": "BMIは筋肉と脂肪を区別できないため、筋トレをする人は高めに出がちです。体脂肪率のほうが参考になります。",
};
