import type { Message } from "@/lib/i18n";

// Text for keys starting "cycle.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "cycle.title": "Cycle-aware readiness",
  "cycle.intro": "Optional. Log the day your period starts and Liftsmith nudges the day's push or easy call a little around your cycle.",
  "cycle.setUp": "Set up",
  "cycle.day": "Cycle day {day} of about {length}.",
  "cycle.logFirst": "Log the first day of your next period to start.",
  "cycle.today": "Period started today",
  "cycle.yesterday": "Started yesterday",
  "cycle.offNote": "This turns it off and deletes every period you logged on this device.",
  "cycle.offConfirm": "Turn off and delete",
  "cycle.cancel": "Cancel",
  "cycle.off": "Turn off and delete cycle data",
  "cycle.consent1":
    "You log the first day of each period. Liftsmith estimates where you are in your cycle from your own typical length and adjusts the day's readiness a little. For example, it might suggest going by feel during your period. You can always override the call.",
  "cycle.consent2a": "Your cycle data stays on this phone.",
  "cycle.consent2b":
    "It only leaves it through your own backup and sync if you turn those on. It is never used for analytics or ads, never included in feedback reports, and never shared or sold.",
  "cycle.consent3":
    "Research on cycle phase and strength is mixed and varies between people, so the effect is small. This isn't medical advice, contraception or a fertility tool.",
  "cycle.consent4": "You can turn it off at any time, which deletes everything you logged.",
  "cycle.agree": "I agree, turn it on",
  "cycle.notNow": "Not now",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cycle.title": "Preparación según el ciclo",
  "cycle.intro":
    "Opcional. Registra el día en que empieza tu periodo y Liftsmith ajusta un poco la recomendación del día (apretar o ir suave) según tu ciclo.",
  "cycle.setUp": "Configurar",
  "cycle.day": "Día {day} del ciclo, de unos {length}.",
  "cycle.logFirst": "Registra el primer día de tu próximo periodo para empezar.",
  "cycle.today": "El periodo empezó hoy",
  "cycle.yesterday": "Empezó ayer",
  "cycle.offNote": "Esto lo desactiva y borra todos los periodos que registraste en este dispositivo.",
  "cycle.offConfirm": "Desactivar y borrar",
  "cycle.cancel": "Cancelar",
  "cycle.off": "Desactivar y borrar los datos del ciclo",
  "cycle.consent1":
    "Registras el primer día de cada periodo. Liftsmith estima en qué punto del ciclo estás según tu duración habitual y ajusta un poco la preparación del día. Por ejemplo, puede sugerir guiarte por sensaciones durante el periodo. Siempre puedes cambiar la recomendación.",
  "cycle.consent2a": "Los datos de tu ciclo se quedan en este teléfono.",
  "cycle.consent2b":
    "Solo salen de él mediante tu propia copia de seguridad y sincronización, si las activas. Nunca se usan para estadísticas ni anuncios, nunca se incluyen en los informes de comentarios y nunca se comparten ni se venden.",
  "cycle.consent3":
    "La investigación sobre la fase del ciclo y la fuerza no es concluyente y varía entre personas, así que el efecto es pequeño. Esto no es consejo médico, ni anticoncepción, ni una herramienta de fertilidad.",
  "cycle.consent4": "Puedes desactivarlo cuando quieras, y se borra todo lo que registraste.",
  "cycle.agree": "Acepto, activarlo",
  "cycle.notNow": "Ahora no",
};

export const fr: Partial<Record<Key, Message>> = {
  "cycle.title": "Forme selon le cycle",
  "cycle.intro":
    "Facultatif. Indiquez le jour où vos règles commencent et Liftsmith ajuste un peu la recommandation du jour (pousser ou y aller doucement) selon votre cycle.",
  "cycle.setUp": "Configurer",
  "cycle.day": "Jour {day} du cycle, sur environ {length}.",
  "cycle.logFirst": "Indiquez le premier jour de vos prochaines règles pour commencer.",
  "cycle.today": "Règles commencées aujourd’hui",
  "cycle.yesterday": "Commencées hier",
  "cycle.offNote": "Cela le désactive et supprime toutes les règles enregistrées sur cet appareil.",
  "cycle.offConfirm": "Désactiver et supprimer",
  "cycle.cancel": "Annuler",
  "cycle.off": "Désactiver et supprimer les données du cycle",
  "cycle.consent1":
    "Vous indiquez le premier jour de chaque période de règles. Liftsmith estime où vous en êtes dans votre cycle d’après votre durée habituelle et ajuste un peu la forme du jour. Par exemple, il peut suggérer d’y aller au ressenti pendant vos règles. Vous pouvez toujours changer la recommandation.",
  "cycle.consent2a": "Vos données de cycle restent sur ce téléphone.",
  "cycle.consent2b":
    "Elles n’en sortent que par votre propre sauvegarde et synchronisation, si vous les activez. Elles ne servent jamais aux statistiques ni à la publicité, ne figurent jamais dans les rapports de retour et ne sont jamais partagées ni vendues.",
  "cycle.consent3":
    "La recherche sur la phase du cycle et la force est partagée et varie selon les personnes, donc l’effet est faible. Ce n’est ni un avis médical, ni une contraception, ni un outil de fertilité.",
  "cycle.consent4": "Vous pouvez le désactiver à tout moment, ce qui supprime tout ce que vous avez enregistré.",
  "cycle.agree": "J’accepte, l’activer",
  "cycle.notNow": "Pas maintenant",
};

export const de: Partial<Record<Key, Message>> = {
  "cycle.title": "Zyklusbewusste Bereitschaft",
  "cycle.intro":
    "Optional. Trag den Tag ein, an dem deine Periode beginnt, und Liftsmith passt die Entscheidung zwischen Gas geben und locker rund um deinen Zyklus ein wenig an.",
  "cycle.setUp": "Einrichten",
  "cycle.day": "Zyklustag {day} von etwa {length}.",
  "cycle.logFirst": "Trag zum Start den ersten Tag deiner nächsten Periode ein.",
  "cycle.today": "Periode heute begonnen",
  "cycle.yesterday": "Gestern begonnen",
  "cycle.offNote": "Damit schaltest du es aus und löschst jede Periode, die du auf diesem Gerät eingetragen hast.",
  "cycle.offConfirm": "Ausschalten und löschen",
  "cycle.cancel": "Abbrechen",
  "cycle.off": "Ausschalten und Zyklusdaten löschen",
  "cycle.consent1":
    "Du trägst den ersten Tag jeder Periode ein. Liftsmith schätzt anhand deiner eigenen typischen Zykluslänge, wo du gerade stehst, und passt die Bereitschaft des Tages ein wenig an. Zum Beispiel schlägt es während der Periode vielleicht vor, nach Gefühl zu trainieren. Du kannst die Entscheidung immer überstimmen.",
  "cycle.consent2a": "Deine Zyklusdaten bleiben auf diesem Telefon.",
  "cycle.consent2b":
    "Sie verlassen es nur über deine eigene Sicherung und Synchronisierung, wenn du diese einschaltest. Sie werden nie für Analysen oder Werbung genutzt, nie in Feedback-Berichte aufgenommen und nie weitergegeben oder verkauft.",
  "cycle.consent3":
    "Die Forschung zu Zyklusphase und Kraft ist uneinheitlich und von Mensch zu Mensch verschieden, deshalb ist der Effekt klein. Das ist keine medizinische Beratung, keine Verhütung und kein Fruchtbarkeits-Tool.",
  "cycle.consent4": "Du kannst es jederzeit ausschalten, dann wird alles gelöscht, was du eingetragen hast.",
  "cycle.agree": "Einverstanden, einschalten",
  "cycle.notNow": "Nicht jetzt",
};

export const it: Partial<Record<Key, Message>> = {
  "cycle.title": "Prontezza in base al ciclo",
  "cycle.intro":
    "Facoltativo. Registra il giorno in cui iniziano le mestruazioni e Liftsmith adatta un po’ la scelta tra spingere e andare leggero in base al tuo ciclo.",
  "cycle.setUp": "Configura",
  "cycle.day": "Giorno {day} del ciclo, su circa {length}.",
  "cycle.logFirst": "Per iniziare, registra il primo giorno delle prossime mestruazioni.",
  "cycle.today": "Mestruazioni iniziate oggi",
  "cycle.yesterday": "Iniziate ieri",
  "cycle.offNote": "Così lo disattivi ed elimini tutte le mestruazioni registrate su questo dispositivo.",
  "cycle.offConfirm": "Disattiva ed elimina",
  "cycle.cancel": "Annulla",
  "cycle.off": "Disattiva ed elimina i dati del ciclo",
  "cycle.consent1":
    "Registri il primo giorno di ogni ciclo. Liftsmith stima a che punto sei in base alla tua durata tipica e adatta un po’ la prontezza del giorno. Per esempio, durante le mestruazioni potrebbe suggerirti di andare a sensazione. Puoi sempre cambiare la scelta.",
  "cycle.consent2a": "I dati del ciclo restano su questo telefono.",
  "cycle.consent2b":
    "Escono solo tramite il tuo backup e la sincronizzazione, se li attivi. Non vengono mai usati per statistiche o pubblicità, mai inclusi nelle segnalazioni e mai condivisi o venduti.",
  "cycle.consent3":
    "Gli studi su fase del ciclo e forza sono contrastanti e variano da persona a persona, quindi l’effetto è piccolo. Non è un consiglio medico, un contraccettivo né uno strumento per la fertilità.",
  "cycle.consent4": "Puoi disattivarlo quando vuoi, ed elimina tutto quello che hai registrato.",
  "cycle.agree": "Accetto, attiva",
  "cycle.notNow": "Non ora",
};

export const ja: Partial<Record<Key, Message>> = {
  "cycle.title": "周期に合わせたコンディション",
  "cycle.intro": "任意です。生理が始まった日を記録すると、周期に合わせてその日の「攻め」か「軽め」かの判断を少し調整します。",
  "cycle.setUp": "設定する",
  "cycle.day": "周期{day}日目（約{length}日周期）。",
  "cycle.logFirst": "始めるには、次の生理の初日を記録してください。",
  "cycle.today": "今日生理が始まった",
  "cycle.yesterday": "昨日始まった",
  "cycle.offNote": "オフにすると、この端末に記録した生理のデータはすべて削除されます。",
  "cycle.offConfirm": "オフにして削除",
  "cycle.cancel": "キャンセル",
  "cycle.off": "オフにして周期のデータを削除",
  "cycle.consent1":
    "生理の初日を毎回記録してください。Liftsmith はあなたの普段の周期の長さから今の時期を推定し、その日のコンディションを少し調整します。たとえば生理中は体調に合わせるよう提案することがあります。判断はいつでも自分で変えられます。",
  "cycle.consent2a": "周期のデータはこの端末に保存されます。",
  "cycle.consent2b":
    "端末の外に出るのは、自分でオンにしたバックアップと同期のときだけです。分析や広告に使われることも、フィードバックに含まれることも、共有・販売されることもありません。",
  "cycle.consent3":
    "周期とパフォーマンスの関係についての研究は結果がまちまちで個人差も大きいため、調整はわずかです。医学的な助言、避妊、妊活のためのツールではありません。",
  "cycle.consent4": "いつでもオフにでき、その場合は記録したデータがすべて削除されます。",
  "cycle.agree": "同意してオンにする",
  "cycle.notNow": "今はしない",
};
