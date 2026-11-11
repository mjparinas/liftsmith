import type { Message } from "@/lib/i18n";

// Text for keys starting "tempo.": the tempo coach (a lab), in every language. English is the source.

export const en = {
  "tempo.start": "Count tempo",
  "tempo.label": "Count the tempo out loud for this set",
  "tempo.stopShort": "Stop",
  "tempo.stop": "Stop counting the tempo",
  "tempo.lead": "Get set",
  "tempo.down": "Lower",
  "tempo.hold": "Hold",
  "tempo.up": "Lift",
  "tempo.pull": "Pull",
  "tempo.return": "Return",
  "tempo.s.down": "{s} s down",
  "tempo.s.hold": "{s} s hold",
  "tempo.s.up": "{s} s up",
  "tempo.s.pull": "{s} s pull",
  "tempo.s.return": "{s} s back",
  "tempo.now": "{phase} {left} · rep {rep} of {reps}",
};

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "tempo.start": "Marcar el tempo",
  "tempo.label": "Marcar el tempo en voz alta en esta serie",
  "tempo.stopShort": "Parar",
  "tempo.stop": "Dejar de marcar el tempo",
  "tempo.lead": "Prepárate",
  "tempo.down": "Baja",
  "tempo.hold": "Aguanta",
  "tempo.up": "Sube",
  "tempo.pull": "Tira",
  "tempo.return": "Vuelve",
  "tempo.s.down": "{s} s bajando",
  "tempo.s.hold": "{s} s quieto",
  "tempo.s.up": "{s} s subiendo",
  "tempo.s.pull": "{s} s tirando",
  "tempo.s.return": "{s} s volviendo",
  "tempo.now": "{phase} {left} · repetición {rep} de {reps}",
};

export const fr: Partial<Record<Key, Message>> = {
  "tempo.start": "Compter le tempo",
  "tempo.label": "Compter le tempo à voix haute pour cette série",
  "tempo.stopShort": "Arrêter",
  "tempo.stop": "Arrêter de compter le tempo",
  "tempo.lead": "En place",
  "tempo.down": "Descends",
  "tempo.hold": "Tiens",
  "tempo.up": "Monte",
  "tempo.pull": "Tire",
  "tempo.return": "Reviens",
  "tempo.s.down": "{s} s à la descente",
  "tempo.s.hold": "{s} s de pause",
  "tempo.s.up": "{s} s à la montée",
  "tempo.s.pull": "{s} s de tirage",
  "tempo.s.return": "{s} s au retour",
  "tempo.now": "{phase} {left} · répétition {rep} sur {reps}",
};

export const de: Partial<Record<Key, Message>> = {
  "tempo.start": "Tempo zählen",
  "tempo.label": "Das Tempo für diesen Satz laut zählen",
  "tempo.stopShort": "Stopp",
  "tempo.stop": "Tempo nicht mehr zählen",
  "tempo.lead": "Bereit machen",
  "tempo.down": "Ablassen",
  "tempo.hold": "Halten",
  "tempo.up": "Hoch",
  "tempo.pull": "Ziehen",
  "tempo.return": "Zurück",
  "tempo.s.down": "{s} s ablassen",
  "tempo.s.hold": "{s} s halten",
  "tempo.s.up": "{s} s hoch",
  "tempo.s.pull": "{s} s ziehen",
  "tempo.s.return": "{s} s zurück",
  "tempo.now": "{phase} {left} · Wiederholung {rep} von {reps}",
};

export const it: Partial<Record<Key, Message>> = {
  "tempo.start": "Conta il tempo",
  "tempo.label": "Conta il tempo ad alta voce in questa serie",
  "tempo.stopShort": "Ferma",
  "tempo.stop": "Smetti di contare il tempo",
  "tempo.lead": "Preparati",
  "tempo.down": "Scendi",
  "tempo.hold": "Tieni",
  "tempo.up": "Sali",
  "tempo.pull": "Tira",
  "tempo.return": "Torna",
  "tempo.s.down": "{s} s in discesa",
  "tempo.s.hold": "{s} s di fermo",
  "tempo.s.up": "{s} s in salita",
  "tempo.s.pull": "{s} s di tirata",
  "tempo.s.return": "{s} s di ritorno",
  "tempo.now": "{phase} {left} · ripetizione {rep} di {reps}",
};

export const ja: Partial<Record<Key, Message>> = {
  "tempo.start": "テンポを数える",
  "tempo.label": "このセットのテンポを音で数えます",
  "tempo.stopShort": "停止",
  "tempo.stop": "テンポのカウントを止める",
  "tempo.lead": "準備",
  "tempo.down": "下ろす",
  "tempo.hold": "止める",
  "tempo.up": "上げる",
  "tempo.pull": "引く",
  "tempo.return": "戻す",
  "tempo.s.down": "下ろす{s}秒",
  "tempo.s.hold": "止める{s}秒",
  "tempo.s.up": "上げる{s}秒",
  "tempo.s.pull": "引く{s}秒",
  "tempo.s.return": "戻す{s}秒",
  "tempo.now": "{phase} {left}・{reps}回中{rep}回目",
};
