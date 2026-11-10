import type { Message } from "@/lib/i18n";

// Text for keys starting "dots.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "dots.title": "DOTS score",
  "dots.body":
    "Your squat, bench and deadlift total scaled for body weight, so lifters of any size compare. Worked out from your estimated maxes.",
  "dots.missing": "Needs an estimated max for {names}. Log a heavy set of each, or enter them below.",
  "dots.total": "Total",
  "dots.bw": "Body weight",
  "dots.sex": "Formula",
  "dots.male": "Men's",
  "dots.female": "Women's",
  "dots.calc": "Change the numbers",
  "dots.reset": "Use my data",
  "dots.note": "Estimated maxes, not meet lifts. Bands are a rough guide: under 200 beginner, 300 intermediate, 400 advanced, 500 elite.",
  "dots.lift.squat": "Squat",
  "dots.lift.bench": "Bench",
  "dots.lift.deadlift": "Deadlift",
  "dots.band.elite": "Elite",
  "dots.band.advanced": "Advanced",
  "dots.band.intermediate": "Intermediate",
  "dots.band.novice": "Novice",
  "dots.band.beginner": "Beginner",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "dots.title": "Puntuación DOTS",
  "dots.body":
    "El total de sentadilla, press de banca y peso muerto ajustado al peso corporal, para comparar a personas de cualquier tamaño. Calculado con tus máximos estimados.",
  "dots.missing": "Necesita un máximo estimado de {names}. Registra una serie pesada de cada uno, o ponlos abajo.",
  "dots.total": "Total",
  "dots.bw": "Peso corporal",
  "dots.sex": "Fórmula",
  "dots.male": "Hombres",
  "dots.female": "Mujeres",
  "dots.calc": "Cambiar los números",
  "dots.reset": "Usar mis datos",
  "dots.note":
    "Máximos estimados, no levantamientos de competición. Las franjas son orientativas: menos de 200 principiante, 300 intermedio, 400 avanzado, 500 élite.",
  "dots.lift.squat": "Sentadilla",
  "dots.lift.bench": "Banca",
  "dots.lift.deadlift": "Peso muerto",
  "dots.band.elite": "Élite",
  "dots.band.advanced": "Avanzado",
  "dots.band.intermediate": "Intermedio",
  "dots.band.novice": "Novato",
  "dots.band.beginner": "Principiante",
};

export const fr: Partial<Record<Key, Message>> = {
  "dots.title": "Score DOTS",
  "dots.body":
    "Votre total squat, développé couché et soulevé de terre rapporté au poids de corps, pour comparer des gabarits différents. Calculé à partir de vos maximums estimés.",
  "dots.missing": "Il faut un maximum estimé pour {names}. Enregistrez une série lourde de chacun, ou saisissez-les ci-dessous.",
  "dots.total": "Total",
  "dots.bw": "Poids de corps",
  "dots.sex": "Formule",
  "dots.male": "Hommes",
  "dots.female": "Femmes",
  "dots.calc": "Changer les chiffres",
  "dots.reset": "Utiliser mes données",
  "dots.note":
    "Maximums estimés, pas des barres de compétition. Les paliers sont indicatifs : moins de 200 débutant, 300 intermédiaire, 400 avancé, 500 élite.",
  "dots.lift.squat": "Squat",
  "dots.lift.bench": "Développé couché",
  "dots.lift.deadlift": "Soulevé de terre",
  "dots.band.elite": "Élite",
  "dots.band.advanced": "Avancé",
  "dots.band.intermediate": "Intermédiaire",
  "dots.band.novice": "Novice",
  "dots.band.beginner": "Débutant",
};

export const de: Partial<Record<Key, Message>> = {
  "dots.title": "DOTS-Wert",
  "dots.body":
    "Die Summe aus Kniebeuge, Bankdrücken und Kreuzheben, auf das Körpergewicht umgerechnet, damit sich Lifter jeder Größe vergleichen können. Berechnet aus deinen geschätzten Maxima.",
  "dots.missing": "Braucht ein geschätztes Maximum für {names}. Trag von jeder Übung einen schweren Satz ein oder gib sie unten ein.",
  "dots.total": "Summe",
  "dots.bw": "Körpergewicht",
  "dots.sex": "Formel",
  "dots.male": "Männer",
  "dots.female": "Frauen",
  "dots.calc": "Werte ändern",
  "dots.reset": "Meine Daten verwenden",
  "dots.note":
    "Geschätzte Maxima, keine Wettkampfleistungen. Die Stufen sind ein grober Anhaltspunkt: unter 200 Anfänger, 300 Mittelstufe, 400 fortgeschritten, 500 Elite.",
  "dots.lift.squat": "Kniebeuge",
  "dots.lift.bench": "Bankdrücken",
  "dots.lift.deadlift": "Kreuzheben",
  "dots.band.elite": "Elite",
  "dots.band.advanced": "Fortgeschritten",
  "dots.band.intermediate": "Mittelstufe",
  "dots.band.novice": "Anfänger",
  "dots.band.beginner": "Einsteiger",
};

export const it: Partial<Record<Key, Message>> = {
  "dots.title": "Punteggio DOTS",
  "dots.body":
    "Il totale di squat, panca e stacco rapportato al peso corporeo, così si possono confrontare atleti di ogni taglia. Calcolato dai tuoi massimali stimati.",
  "dots.missing": "Serve un massimale stimato per {names}. Registra una serie pesante di ciascuno, o inseriscili qui sotto.",
  "dots.total": "Totale",
  "dots.bw": "Peso corporeo",
  "dots.sex": "Formula",
  "dots.male": "Uomini",
  "dots.female": "Donne",
  "dots.calc": "Cambia i numeri",
  "dots.reset": "Usa i miei dati",
  "dots.note":
    "Massimali stimati, non alzate di gara. Le fasce sono indicative: sotto 200 principiante, 300 intermedio, 400 avanzato, 500 élite.",
  "dots.lift.squat": "Squat",
  "dots.lift.bench": "Panca",
  "dots.lift.deadlift": "Stacco",
  "dots.band.elite": "Élite",
  "dots.band.advanced": "Avanzato",
  "dots.band.intermediate": "Intermedio",
  "dots.band.novice": "Principiante",
  "dots.band.beginner": "Esordiente",
};

export const ja: Partial<Record<Key, Message>> = {
  "dots.title": "DOTS スコア",
  "dots.body":
    "スクワット、ベンチプレス、デッドリフトの合計を体重で補正した値で、体格の違う人どうしでも比べられます。推定最大重量から計算します。",
  "dots.missing": "{names}の推定最大重量が必要です。それぞれ重めのセットを記録するか、下に入力してください。",
  "dots.total": "合計",
  "dots.bw": "体重",
  "dots.sex": "計算式",
  "dots.male": "男性",
  "dots.female": "女性",
  "dots.calc": "数値を変える",
  "dots.reset": "自分のデータを使う",
  "dots.note": "推定最大重量で、大会記録ではありません。目安：200未満は初心者、300で中級、400で上級、500でエリート。",
  "dots.lift.squat": "スクワット",
  "dots.lift.bench": "ベンチプレス",
  "dots.lift.deadlift": "デッドリフト",
  "dots.band.elite": "エリート",
  "dots.band.advanced": "上級",
  "dots.band.intermediate": "中級",
  "dots.band.novice": "初級",
  "dots.band.beginner": "入門",
};
