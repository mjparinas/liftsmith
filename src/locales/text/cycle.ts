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

export const pt: Partial<Record<Key, Message>> = {
  "cycle.title": "Prontidão de acordo com o ciclo",
  "cycle.intro":
    "Opcional. Registre o dia em que sua menstruação começa, e o Liftsmith ajusta um pouco a decisão de forçar ou pegar leve ao longo do seu ciclo.",
  "cycle.setUp": "Configurar",
  "cycle.day": "Dia {day} de um ciclo de cerca de {length}.",
  "cycle.logFirst": "Registre o primeiro dia da sua próxima menstruação para começar.",
  "cycle.today": "Menstruação começou hoje",
  "cycle.yesterday": "Começou ontem",
  "cycle.offNote": "Isso desativa o recurso e apaga todas as menstruações que você registrou neste dispositivo.",
  "cycle.offConfirm": "Desativar e apagar",
  "cycle.cancel": "Cancelar",
  "cycle.off": "Desativar e apagar dados do ciclo",
  "cycle.consent1":
    "Você registra o primeiro dia de cada menstruação. O Liftsmith estima em que ponto do ciclo você está a partir da sua duração típica e ajusta um pouco a prontidão do dia. Por exemplo, pode sugerir treinar conforme a sensação durante a menstruação. Você sempre pode mudar a decisão.",
  "cycle.consent2a": "Os dados do seu ciclo ficam neste celular.",
  "cycle.consent2b":
    "Eles só saem daqui pelo seu próprio backup e sincronização, se você ativá-los. Nunca são usados para análises ou anúncios, nunca entram em relatórios de feedback e nunca são compartilhados ou vendidos.",
  "cycle.consent3":
    "As pesquisas sobre fase do ciclo e força são divergentes e variam entre pessoas, então o efeito é pequeno. Isto não é orientação médica, método contraceptivo nem ferramenta de fertilidade.",
  "cycle.consent4": "Você pode desativar a qualquer momento, o que apaga tudo o que registrou.",
  "cycle.agree": "Concordo, ativar",
  "cycle.notNow": "Agora não",
};

export const ko: Partial<Record<Key, Message>> = {
  "cycle.title": "생리 주기 반영 컨디션",
  "cycle.intro": "선택 사항이에요. 생리 시작일을 기록하면 Liftsmith가 주기에 맞춰 그날의 강하게 또는 가볍게 판단을 조금 조정해요.",
  "cycle.setUp": "설정",
  "cycle.day": "약 {length}일 주기 중 {day}일째.",
  "cycle.logFirst": "시작하려면 다음 생리 첫날을 기록하세요.",
  "cycle.today": "오늘 생리 시작",
  "cycle.yesterday": "어제 시작",
  "cycle.offNote": "이 기능을 끄고 이 기기에 기록한 모든 생리 기록을 삭제해요.",
  "cycle.offConfirm": "끄고 삭제",
  "cycle.cancel": "취소",
  "cycle.off": "끄고 주기 데이터 삭제",
  "cycle.consent1":
    "각 생리의 첫날을 기록하세요. Liftsmith는 내 평소 주기 길이로 현재 주기 위치를 추정하고 그날의 컨디션을 조금 조정해요. 예를 들어 생리 중에는 느낌대로 하라고 제안할 수 있어요. 판단은 언제든 직접 바꿀 수 있어요.",
  "cycle.consent2a": "주기 데이터는 이 휴대폰에 남아요.",
  "cycle.consent2b":
    "백업과 동기화를 직접 켠 경우에만 그 경로로 휴대폰 밖으로 나가요. 분석이나 광고에 절대 쓰이지 않고, 의견 보고서에 포함되지 않으며, 공유되거나 판매되지 않아요.",
  "cycle.consent3":
    "생리 주기와 근력에 관한 연구는 결과가 엇갈리고 사람마다 달라서 효과는 작아요. 의학적 조언, 피임 또는 임신 관련 도구가 아니에요.",
  "cycle.consent4": "언제든 끌 수 있고, 끄면 기록한 모든 내용이 삭제돼요.",
  "cycle.agree": "동의하고 켜기",
  "cycle.notNow": "나중에",
};

export const tr: Partial<Record<Key, Message>> = {
  "cycle.title": "Döngüye duyarlı hazırlık",
  "cycle.intro":
    "İsteğe bağlı. Regl döneminin başladığı günü kaydet, Liftsmith da günün yüklenme ya da hafif tutma kararını döngüne göre biraz ayarlasın.",
  "cycle.setUp": "Kur",
  "cycle.day": "Yaklaşık {length} günlük döngünün {day}. günü.",
  "cycle.logFirst": "Başlamak için bir sonraki regl döneminin ilk gününü kaydet.",
  "cycle.today": "Regl bugün başladı",
  "cycle.yesterday": "Dün başladı",
  "cycle.offNote": "Bu, özelliği kapatır ve bu cihazda kaydettiğin tüm regl dönemlerini siler.",
  "cycle.offConfirm": "Kapat ve sil",
  "cycle.cancel": "Vazgeç",
  "cycle.off": "Kapat ve döngü verilerini sil",
  "cycle.consent1":
    "Her regl döneminin ilk gününü kaydedersin. Liftsmith kendi ortalama döngü uzunluğundan döngünün neresinde olduğunu tahmin eder ve günün hazırlığını biraz ayarlar. Örneğin regl sırasında hissine göre gitmeyi önerebilir. Kararı her zaman değiştirebilirsin.",
  "cycle.consent2a": "Döngü verilerin bu telefonda kalır.",
  "cycle.consent2b":
    "Yalnızca açarsan kendi yedeğin ve eşitlemen yoluyla telefondan çıkar. Asla analiz ya da reklam için kullanılmaz, geri bildirim raporlarına eklenmez, paylaşılmaz ya da satılmaz.",
  "cycle.consent3":
    "Döngü evresi ve güç üzerine araştırmalar karışık ve kişiden kişiye değişiyor, bu yüzden etkisi küçük. Bu tıbbi tavsiye, doğum kontrolü ya da doğurganlık aracı değildir.",
  "cycle.consent4": "İstediğin zaman kapatabilirsin; bu, kaydettiğin her şeyi siler.",
  "cycle.agree": "Kabul ediyorum, aç",
  "cycle.notNow": "Şimdi değil",
};

export const pl: Partial<Record<Key, Message>> = {
  "cycle.title": "Gotowość z uwzględnieniem cyklu",
  "cycle.intro":
    "Opcjonalne. Zapisz dzień, w którym zaczyna się okres, a Liftsmith lekko dostosuje decyzję na dziś (Mocniej lub Lżej) do Twojego cyklu.",
  "cycle.setUp": "Skonfiguruj",
  "cycle.day": "Dzień cyklu {day} z około {length}.",
  "cycle.logFirst": "Zapisz pierwszy dzień następnego okresu, by zacząć.",
  "cycle.today": "Okres zaczął się dziś",
  "cycle.yesterday": "Zaczął się wczoraj",
  "cycle.offNote": "To wyłącza funkcję i usuwa wszystkie zapisane na tym urządzeniu okresy.",
  "cycle.offConfirm": "Wyłącz i usuń",
  "cycle.cancel": "Anuluj",
  "cycle.off": "Wyłącz i usuń dane o cyklu",
  "cycle.consent1":
    "Zapisujesz pierwszy dzień każdego okresu. Liftsmith szacuje, w którym miejscu cyklu jesteś, na podstawie Twojej typowej długości cyklu i lekko dostosowuje gotowość na dany dzień. Może np. zasugerować trening według samopoczucia w czasie okresu. Zawsze możesz zmienić decyzję.",
  "cycle.consent2a": "Twoje dane o cyklu zostają na tym telefonie.",
  "cycle.consent2b":
    "Opuszczają go tylko przez Twoją kopię zapasową i synchronizację, jeśli je włączysz. Nigdy nie służą do analityki ani reklam, nigdy nie trafiają do zgłoszeń z opiniami i nigdy nie są udostępniane ani sprzedawane.",
  "cycle.consent3":
    "Badania nad fazą cyklu a siłą są niejednoznaczne i różnią się między osobami, więc efekt jest niewielki. To nie jest porada medyczna, antykoncepcja ani narzędzie do płodności.",
  "cycle.consent4": "Możesz to wyłączyć w każdej chwili, co usuwa wszystkie Twoje zapisy.",
  "cycle.agree": "Zgadzam się, włącz",
  "cycle.notNow": "Nie teraz",
};
