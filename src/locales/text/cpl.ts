import type { Message } from "@/lib/i18n";

// Text for keys starting "cpl.", in every language: coach plans (Pro, Coach and Coach Plus; CoachPlan.tsx,
// src/lib/coachPlans.ts). English is the source.

export const en = {
  "cpl.title": "Your coaching plan",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "School team",
  "cpl.count": "Clients: {count} of {limit}",
  "cpl.countNoLimit": "Clients: {count}, no set limit",
  "cpl.full":
    "You're at your plan's limit, so new clients can't join yet. Remove a client you no longer coach, or move to a plan with more room.",
  "cpl.left": "Room left: {left}",
  "cpl.grace":
    "You had more clients than Pro covers when coach plans started, so your limit stays at {limit} until {date}. Everyone you coach now stays linked.",
  "cpl.over": "Everyone you coach stays linked. To add new clients, move to a plan with more room.",
  "cpl.school": "Free for verified high school coaches, up to {limit} clients.",
  "cpl.see": "See coach plans",
  "cpl.sheetTitle": "Coach plans",
  "cpl.sheetLead":
    "Pro covers up to {pro} clients. Coach plans add room as your client list grows, and include everything in Pro. Every coaching tool works on every plan.",
  "cpl.clients.coach": "Up to {limit} clients",
  "cpl.clients.coachPlus": "No set limit on clients",
  "cpl.what.coach": "Reports, routines, chat, check-ins, booking, payments and nutrition targets for a full client list.",
  "cpl.what.coachPlus": "The same tools with no set limit, for a big roster of clients.",
  "cpl.current": "Your plan",
  "cpl.yearly": "{tier}, yearly",
  "cpl.monthly": "{tier}, monthly",
  "cpl.yearPrice": "{price} a year, about {perMonth} a month. Renews each year until you cancel.",
  "cpl.monthPrice": "{price} a month. Renews each month until you cancel.",
  "cpl.free":
    "Your clients always train free, and on Coach and Coach Plus Liftsmith takes nothing from what they pay you. On Pro it keeps 2%.",
  "cpl.replace": "Moving up replaces your Pro subscription, so you pay for one plan, and what's left of Pro is credited.",
  "cpl.otherBill.web":
    "Your Pro is billed on the Liftsmith website. Once your coach plan starts, cancel Pro there, because coach plans include Pro.",
  "cpl.otherBill.store":
    "Your Pro is billed through your phone's app store. Once your coach plan starts, cancel Pro there, because coach plans include Pro.",
  "cpl.unavailable": "Coach plans can't be shown right now. Check your connection and try again.",
  "cpl.retry": "Try again",
  "cpl.manage": "Manage plan",
  "cpl.done": "{tier} is on. It can take a minute to reach your account.",
  "cpl.paid": "Thanks! Your coach plan is on. It can take a minute to show here.",
  "cpl.already": "Your account already has this plan or a bigger one.",
  "cpl.error": "That didn't go through. Try again in a moment.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "cpl.title": "Tu plan de entrenador",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "Equipo escolar",
  "cpl.count": "Clientes: {count} de {limit}",
  "cpl.countNoLimit": "Clientes: {count}, sin límite fijo",
  "cpl.full":
    "Has llegado al límite de tu plan, así que aún no pueden unirse clientes nuevos. Quita a un cliente que ya no entrenes o pasa a un plan con más espacio.",
  "cpl.left": "Espacio libre: {left}",
  "cpl.grace":
    "Tenías más clientes de los que cubre Pro cuando empezaron los planes de entrenador, así que tu límite sigue en {limit} hasta el {date}. Todos tus clientes actuales siguen contigo.",
  "cpl.over": "Todos tus clientes siguen contigo. Para añadir clientes nuevos, pasa a un plan con más espacio.",
  "cpl.school": "Gratis para entrenadores de secundaria verificados, hasta {limit} clientes.",
  "cpl.see": "Ver planes de entrenador",
  "cpl.sheetTitle": "Planes de entrenador",
  "cpl.sheetLead":
    "Pro cubre hasta {pro} clientes. Los planes de entrenador añaden espacio a medida que crece tu lista e incluyen todo lo de Pro. Todas las herramientas de entrenador funcionan en todos los planes.",
  "cpl.clients.coach": "Hasta {limit} clientes",
  "cpl.clients.coachPlus": "Sin límite fijo de clientes",
  "cpl.what.coach": "Informes, rutinas, chat, revisiones, reservas, pagos y objetivos de nutrición para una lista completa de clientes.",
  "cpl.what.coachPlus": "Las mismas herramientas sin límite fijo, para una cartera grande de clientes.",
  "cpl.current": "Tu plan",
  "cpl.yearly": "{tier}, anual",
  "cpl.monthly": "{tier}, mensual",
  "cpl.yearPrice": "{price} al año, unos {perMonth} al mes. Se renueva cada año hasta que lo canceles.",
  "cpl.monthPrice": "{price} al mes. Se renueva cada mes hasta que lo canceles.",
  "cpl.free":
    "Tus clientes siempre entrenan gratis, y con Coach y Coach Plus Liftsmith no se queda nada de lo que te pagan. Con Pro se queda un 2 %.",
  "cpl.replace": "Al subir de plan se sustituye tu suscripción Pro, así que pagas un solo plan, y lo que queda de Pro se descuenta.",
  "cpl.otherBill.web":
    "Tu Pro se cobra en la web de Liftsmith. Cuando empiece tu plan de entrenador, cancela Pro allí, porque los planes de entrenador incluyen Pro.",
  "cpl.otherBill.store":
    "Tu Pro se cobra a través de la tienda de apps de tu teléfono. Cuando empiece tu plan de entrenador, cancela Pro allí, porque los planes de entrenador incluyen Pro.",
  "cpl.unavailable": "Ahora no se pueden mostrar los planes de entrenador. Revisa tu conexión y vuelve a intentarlo.",
  "cpl.retry": "Reintentar",
  "cpl.manage": "Gestionar plan",
  "cpl.done": "{tier} está activo. Puede tardar un minuto en llegar a tu cuenta.",
  "cpl.paid": "¡Gracias! Tu plan de entrenador está activo. Puede tardar un minuto en aparecer aquí.",
  "cpl.already": "Tu cuenta ya tiene este plan o uno mayor.",
  "cpl.error": "No se ha podido completar. Inténtalo de nuevo en un momento.",
};

export const fr: Partial<Record<Key, Message>> = {
  "cpl.title": "Votre forfait coach",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "Équipe scolaire",
  "cpl.count": "Clients : {count} sur {limit}",
  "cpl.countNoLimit": "Clients : {count}, sans limite fixe",
  "cpl.full":
    "Vous avez atteint la limite de votre forfait : les nouveaux clients ne peuvent pas encore vous rejoindre. Retirez un client que vous ne suivez plus, ou passez à un forfait plus grand.",
  "cpl.left": "Places restantes : {left}",
  "cpl.grace":
    "Vous aviez plus de clients que Pro n'en couvre au lancement des forfaits coach : votre limite reste à {limit} jusqu'au {date}. Tous vos clients actuels restent liés.",
  "cpl.over": "Tous vos clients restent liés. Pour en ajouter de nouveaux, passez à un forfait avec plus de places.",
  "cpl.school": "Gratuit pour les entraîneurs de lycée vérifiés, jusqu'à {limit} clients.",
  "cpl.see": "Voir les forfaits coach",
  "cpl.sheetTitle": "Forfaits coach",
  "cpl.sheetLead":
    "Pro couvre jusqu'à {pro} clients. Les forfaits coach ajoutent des places à mesure que votre liste grandit et incluent tout Pro. Tous les outils de coaching fonctionnent avec chaque forfait.",
  "cpl.clients.coach": "Jusqu'à {limit} clients",
  "cpl.clients.coachPlus": "Sans limite fixe de clients",
  "cpl.what.coach":
    "Rapports, routines, messagerie, bilans, réservations, paiements et objectifs nutritionnels pour une liste complète de clients.",
  "cpl.what.coachPlus": "Les mêmes outils sans limite fixe, pour une grande clientèle.",
  "cpl.current": "Votre forfait",
  "cpl.yearly": "{tier}, annuel",
  "cpl.monthly": "{tier}, mensuel",
  "cpl.yearPrice": "{price} par an, environ {perMonth} par mois. Renouvelé chaque année jusqu'à résiliation.",
  "cpl.monthPrice": "{price} par mois. Renouvelé chaque mois jusqu'à résiliation.",
  "cpl.free":
    "Vos clients s'entraînent toujours gratuitement, et avec Coach et Coach Plus, Liftsmith ne prend rien sur ce qu'ils vous paient. Avec Pro, il garde 2 %.",
  "cpl.replace":
    "Passer à un forfait supérieur remplace votre abonnement Pro : vous ne payez qu'un forfait, et le reste de Pro est crédité.",
  "cpl.otherBill.web":
    "Votre Pro est facturé sur le site de Liftsmith. Une fois votre forfait coach commencé, résiliez Pro là-bas, car les forfaits coach incluent Pro.",
  "cpl.otherBill.store":
    "Votre Pro est facturé par la boutique d'applications de votre téléphone. Une fois votre forfait coach commencé, résiliez Pro là-bas, car les forfaits coach incluent Pro.",
  "cpl.unavailable": "Impossible d'afficher les forfaits coach pour l'instant. Vérifiez votre connexion et réessayez.",
  "cpl.retry": "Réessayer",
  "cpl.manage": "Gérer le forfait",
  "cpl.done": "{tier} est activé. Il peut falloir une minute pour qu'il arrive sur votre compte.",
  "cpl.paid": "Merci ! Votre forfait coach est activé. Il peut falloir une minute pour qu'il s'affiche ici.",
  "cpl.already": "Votre compte a déjà ce forfait ou un forfait supérieur.",
  "cpl.error": "Ça n'a pas fonctionné. Réessayez dans un instant.",
};

export const de: Partial<Record<Key, Message>> = {
  "cpl.title": "Dein Coaching-Plan",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "Schulteam",
  "cpl.count": "Kunden: {count} von {limit}",
  "cpl.countNoLimit": "Kunden: {count}, keine feste Grenze",
  "cpl.full":
    "Du hast die Grenze deines Plans erreicht, deshalb können noch keine neuen Kunden beitreten. Entferne einen Kunden, den du nicht mehr betreust, oder wechsle zu einem Plan mit mehr Platz.",
  "cpl.left": "Noch frei: {left}",
  "cpl.grace":
    "Als die Coach-Pläne starteten, hattest du mehr Kunden, als Pro abdeckt. Deshalb bleibt deine Grenze bis zum {date} bei {limit}. Alle Kunden, die du jetzt betreust, bleiben verbunden.",
  "cpl.over": "Alle Kunden, die du betreust, bleiben verbunden. Für neue Kunden wechsle zu einem Plan mit mehr Platz.",
  "cpl.school": "Kostenlos für bestätigte Schulsport-Coaches, bis zu {limit} Kunden.",
  "cpl.see": "Coach-Pläne ansehen",
  "cpl.sheetTitle": "Coach-Pläne",
  "cpl.sheetLead":
    "Pro deckt bis zu {pro} Kunden ab. Coach-Pläne geben dir mehr Platz, wenn deine Kundenliste wächst, und enthalten alles aus Pro. Jedes Coaching-Werkzeug funktioniert in jedem Plan.",
  "cpl.clients.coach": "Bis zu {limit} Kunden",
  "cpl.clients.coachPlus": "Keine feste Grenze für Kunden",
  "cpl.what.coach": "Berichte, Routinen, Chat, Check-ins, Buchungen, Zahlungen und Ernährungsziele für eine volle Kundenliste.",
  "cpl.what.coachPlus": "Dieselben Werkzeuge ohne feste Grenze, für einen großen Kundenstamm.",
  "cpl.current": "Dein Plan",
  "cpl.yearly": "{tier}, jährlich",
  "cpl.monthly": "{tier}, monatlich",
  "cpl.yearPrice": "{price} pro Jahr, etwa {perMonth} pro Monat. Verlängert sich jährlich, bis du kündigst.",
  "cpl.monthPrice": "{price} pro Monat. Verlängert sich monatlich, bis du kündigst.",
  "cpl.free":
    "Deine Kunden trainieren immer kostenlos, und mit Coach und Coach Plus behält Liftsmith nichts von dem ein, was sie dir zahlen. Mit Pro behält es 2 %.",
  "cpl.replace": "Ein Upgrade ersetzt dein Pro-Abo, du zahlst also nur einen Plan, und der Rest von Pro wird gutgeschrieben.",
  "cpl.otherBill.web":
    "Dein Pro wird über die Liftsmith-Website abgerechnet. Kündige Pro dort, sobald dein Coach-Plan läuft, denn Coach-Pläne enthalten Pro.",
  "cpl.otherBill.store":
    "Dein Pro wird über den App-Store deines Handys abgerechnet. Kündige Pro dort, sobald dein Coach-Plan läuft, denn Coach-Pläne enthalten Pro.",
  "cpl.unavailable": "Die Coach-Pläne können gerade nicht angezeigt werden. Prüfe deine Verbindung und versuche es noch einmal.",
  "cpl.retry": "Noch einmal versuchen",
  "cpl.manage": "Plan verwalten",
  "cpl.done": "{tier} ist aktiv. Es kann eine Minute dauern, bis es in deinem Konto ankommt.",
  "cpl.paid": "Danke! Dein Coach-Plan ist aktiv. Es kann eine Minute dauern, bis er hier erscheint.",
  "cpl.already": "Dein Konto hat diesen Plan oder einen größeren schon.",
  "cpl.error": "Das hat nicht geklappt. Versuche es gleich noch einmal.",
};

export const it: Partial<Record<Key, Message>> = {
  "cpl.title": "Il tuo piano da coach",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "Squadra scolastica",
  "cpl.count": "Clienti: {count} su {limit}",
  "cpl.countNoLimit": "Clienti: {count}, nessun limite fisso",
  "cpl.full":
    "Hai raggiunto il limite del tuo piano, quindi i nuovi clienti non possono ancora unirsi. Rimuovi un cliente che non segui più o passa a un piano con più posti.",
  "cpl.left": "Posti liberi: {left}",
  "cpl.grace":
    "Quando sono partiti i piani da coach avevi più clienti di quelli coperti da Pro, quindi il tuo limite resta {limit} fino al {date}. Tutti i clienti che segui ora restano collegati.",
  "cpl.over": "Tutti i clienti che segui restano collegati. Per aggiungerne di nuovi, passa a un piano con più posti.",
  "cpl.school": "Gratis per gli allenatori delle scuole superiori verificati, fino a {limit} clienti.",
  "cpl.see": "Vedi i piani da coach",
  "cpl.sheetTitle": "Piani da coach",
  "cpl.sheetLead":
    "Pro copre fino a {pro} clienti. I piani da coach aggiungono posti man mano che la tua lista cresce e includono tutto Pro. Ogni strumento da coach funziona con ogni piano.",
  "cpl.clients.coach": "Fino a {limit} clienti",
  "cpl.clients.coachPlus": "Nessun limite fisso di clienti",
  "cpl.what.coach": "Report, routine, chat, check-in, prenotazioni, pagamenti e obiettivi nutrizionali per una lista completa di clienti.",
  "cpl.what.coachPlus": "Gli stessi strumenti senza limite fisso, per una clientela numerosa.",
  "cpl.current": "Il tuo piano",
  "cpl.yearly": "{tier}, annuale",
  "cpl.monthly": "{tier}, mensile",
  "cpl.yearPrice": "{price} all'anno, circa {perMonth} al mese. Si rinnova ogni anno finché non lo annulli.",
  "cpl.monthPrice": "{price} al mese. Si rinnova ogni mese finché non lo annulli.",
  "cpl.free":
    "I tuoi clienti si allenano sempre gratis, e con Coach e Coach Plus Liftsmith non trattiene nulla di quello che ti pagano. Con Pro trattiene il 2%.",
  "cpl.replace":
    "Passare a un piano superiore sostituisce il tuo abbonamento Pro, così paghi un solo piano, e ciò che resta di Pro viene accreditato.",
  "cpl.otherBill.web":
    "Il tuo Pro viene addebitato sul sito di Liftsmith. Quando parte il piano da coach, annulla Pro lì, perché i piani da coach includono Pro.",
  "cpl.otherBill.store":
    "Il tuo Pro viene addebitato tramite lo store del telefono. Quando parte il piano da coach, annulla Pro lì, perché i piani da coach includono Pro.",
  "cpl.unavailable": "Al momento non è possibile mostrare i piani da coach. Controlla la connessione e riprova.",
  "cpl.retry": "Riprova",
  "cpl.manage": "Gestisci piano",
  "cpl.done": "{tier} è attivo. Può volerci un minuto perché arrivi al tuo account.",
  "cpl.paid": "Grazie! Il tuo piano da coach è attivo. Può volerci un minuto perché compaia qui.",
  "cpl.already": "Il tuo account ha già questo piano o uno superiore.",
  "cpl.error": "Non è andata a buon fine. Riprova tra un attimo.",
};

export const ja: Partial<Record<Key, Message>> = {
  "cpl.title": "コーチングのプラン",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "学校チーム",
  "cpl.count": "クライアント: {count} / {limit}人",
  "cpl.countNoLimit": "クライアント: {count}人 (上限なし)",
  "cpl.full":
    "プランの上限に達しているため、新しいクライアントはまだ参加できません。指導していないクライアントを外すか、枠の多いプランに切り替えてください。",
  "cpl.left": "残りの枠: {left}",
  "cpl.grace":
    "コーチプランが始まった時点で Pro の上限を超えるクライアントがいたため、{date}までは上限が{limit}人のままです。今指導しているクライアントは全員そのままつながっています。",
  "cpl.over":
    "今指導しているクライアントは全員そのままつながっています。新しいクライアントを加えるには、枠の多いプランに切り替えてください。",
  "cpl.school": "認証済みの高校のコーチは無料で、クライアント{limit}人まで。",
  "cpl.see": "コーチプランを見る",
  "cpl.sheetTitle": "コーチプラン",
  "cpl.sheetLead":
    "Pro はクライアント{pro}人まで。コーチプランはクライアントが増えるにつれて枠を広げ、Pro のすべてを含みます。コーチング機能はどのプランでもすべて使えます。",
  "cpl.clients.coach": "クライアント{limit}人まで",
  "cpl.clients.coachPlus": "クライアント数の上限なし",
  "cpl.what.coach": "レポート、ルーティン、チャット、チェックイン、予約、支払い、栄養目標を、クライアント全員に。",
  "cpl.what.coachPlus": "同じ機能を上限なしで。多くのクライアントを抱えるコーチ向け。",
  "cpl.current": "現在のプラン",
  "cpl.yearly": "{tier} 年額",
  "cpl.monthly": "{tier} 月額",
  "cpl.yearPrice": "年{price}、月あたり約{perMonth}。解約するまで毎年更新されます。",
  "cpl.monthPrice": "月{price}。解約するまで毎月更新されます。",
  "cpl.free":
    "クライアントはいつでも無料でトレーニングでき、Coach と Coach Plus では、クライアントからの支払いから Liftsmith が受け取る分はありません。Pro では 2% を受け取ります。",
  "cpl.replace": "アップグレードすると Pro の定期購入が置き換わるため、支払いは1つのプランだけで、Pro の残り期間分はクレジットされます。",
  "cpl.otherBill.web":
    "Pro は Liftsmith のウェブサイトで請求されています。コーチプランが始まったら、そちらで Pro を解約してください。コーチプランには Pro が含まれます。",
  "cpl.otherBill.store":
    "Pro はスマートフォンのアプリストアで請求されています。コーチプランが始まったら、そちらで Pro を解約してください。コーチプランには Pro が含まれます。",
  "cpl.unavailable": "今はコーチプランを表示できません。接続を確認して、もう一度お試しください。",
  "cpl.retry": "もう一度試す",
  "cpl.manage": "プランを管理",
  "cpl.done": "{tier} が有効になりました。アカウントに反映されるまで1分ほどかかることがあります。",
  "cpl.paid": "ありがとうございます。コーチプランが有効になりました。ここに表示されるまで1分ほどかかることがあります。",
  "cpl.already": "このアカウントには、すでにこのプランかそれ以上のプランがあります。",
  "cpl.error": "うまくいきませんでした。少ししてからもう一度お試しください。",
};

export const pt: Partial<Record<Key, Message>> = {
  "cpl.title": "Seu plano de coaching",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "Equipe escolar",
  "cpl.count": "Alunos: {count} de {limit}",
  "cpl.countNoLimit": "Alunos: {count}, sem limite definido",
  "cpl.full":
    "Você chegou ao limite do seu plano, então novos alunos ainda não podem entrar. Remova um aluno que você não treina mais, ou mude para um plano com mais espaço.",
  "cpl.left": "Espaço restante: {left}",
  "cpl.grace":
    "Você tinha mais alunos do que o Pro cobre quando os planos de coach começaram, então seu limite fica em {limit} até {date}. Todos que você treina agora continuam vinculados.",
  "cpl.over": "Todos que você treina continuam vinculados. Para adicionar novos alunos, mude para um plano com mais espaço.",
  "cpl.school": "Grátis para coaches de ensino médio verificados, até {limit} alunos.",
  "cpl.see": "Ver planos de coach",
  "cpl.sheetTitle": "Planos de coach",
  "cpl.sheetLead":
    "O Pro cobre até {pro} alunos. Os planos de coach dão mais espaço conforme sua lista de alunos cresce, e incluem tudo do Pro. Todas as ferramentas de coaching funcionam em todos os planos.",
  "cpl.clients.coach": "Até {limit} alunos",
  "cpl.clients.coachPlus": "Sem limite definido de alunos",
  "cpl.what.coach": "Relatórios, rotinas, chat, check-ins, agendamento, pagamentos e metas de nutrição para uma lista completa de alunos.",
  "cpl.what.coachPlus": "As mesmas ferramentas sem limite definido, para uma grande lista de alunos.",
  "cpl.current": "Seu plano",
  "cpl.yearly": "{tier}, anual",
  "cpl.monthly": "{tier}, mensal",
  "cpl.yearPrice": "{price} por ano, cerca de {perMonth} por mês. Renova todo ano até você cancelar.",
  "cpl.monthPrice": "{price} por mês. Renova todo mês até você cancelar.",
  "cpl.free":
    "Seus alunos sempre treinam de graça, e no Coach e no Coach Plus o Liftsmith não fica com nada do que eles te pagam. No Pro, ele fica com 2%.",
  "cpl.replace": "Fazer o upgrade substitui sua assinatura Pro, então você paga um plano só, e o que sobrar do Pro vira crédito.",
  "cpl.otherBill.web":
    "Seu Pro é cobrado no site do Liftsmith. Quando seu plano de coach começar, cancele o Pro lá, porque os planos de coach incluem o Pro.",
  "cpl.otherBill.store":
    "Seu Pro é cobrado pela loja de apps do seu celular. Quando seu plano de coach começar, cancele o Pro lá, porque os planos de coach incluem o Pro.",
  "cpl.unavailable": "Os planos de coach não podem ser mostrados agora. Verifique sua conexão e tente de novo.",
  "cpl.retry": "Tentar de novo",
  "cpl.manage": "Gerenciar plano",
  "cpl.done": "{tier} está ativo. Pode levar um minuto para chegar à sua conta.",
  "cpl.paid": "Obrigado! Seu plano de coach está ativo. Pode levar um minuto para aparecer aqui.",
  "cpl.already": "Sua conta já tem este plano ou um maior.",
  "cpl.error": "Não deu certo. Tente de novo daqui a pouco.",
};

export const ko: Partial<Record<Key, Message>> = {
  "cpl.title": "내 코칭 요금제",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "학교 팀",
  "cpl.count": "회원: {limit}명 중 {count}명",
  "cpl.countNoLimit": "회원: {count}명, 인원 제한 없음",
  "cpl.full":
    "요금제 한도에 도달해서 새 회원이 아직 가입할 수 없어요. 더 이상 코칭하지 않는 회원을 삭제하거나, 여유가 더 있는 요금제로 바꾸세요.",
  "cpl.left": "남은 자리: {left}",
  "cpl.grace":
    "코치 요금제가 시작될 때 Pro 한도보다 회원이 많았기 때문에, {date}까지 한도가 {limit}명으로 유지돼요. 지금 코칭하는 모든 회원은 연결된 채로 남아요.",
  "cpl.over": "지금 코칭하는 모든 회원은 연결된 채로 남아요. 새 회원을 추가하려면 여유가 더 있는 요금제로 바꾸세요.",
  "cpl.school": "인증된 고등학교 코치는 회원 {limit}명까지 무료예요.",
  "cpl.see": "코치 요금제 보기",
  "cpl.sheetTitle": "코치 요금제",
  "cpl.sheetLead":
    "Pro는 회원 {pro}명까지 지원해요. 코치 요금제는 회원이 늘어날수록 자리를 더해 주고, Pro의 모든 기능을 포함해요. 모든 코칭 도구는 모든 요금제에서 쓸 수 있어요.",
  "cpl.clients.coach": "회원 최대 {limit}명",
  "cpl.clients.coachPlus": "회원 인원 제한 없음",
  "cpl.what.coach": "회원 전체를 위한 리포트, 루틴, 채팅, 체크인, 예약, 결제, 영양 목표.",
  "cpl.what.coachPlus": "같은 도구를 인원 제한 없이, 많은 회원을 위해.",
  "cpl.current": "내 요금제",
  "cpl.yearly": "{tier}, 연간",
  "cpl.monthly": "{tier}, 월간",
  "cpl.yearPrice": "연 {price}, 월 약 {perMonth}. 해지할 때까지 매년 갱신돼요.",
  "cpl.monthPrice": "월 {price}. 해지할 때까지 매월 갱신돼요.",
  "cpl.free":
    "회원은 항상 무료로 운동하고, Coach와 Coach Plus에서는 Liftsmith가 회원이 코치에게 내는 금액에서 아무것도 가져가지 않아요. Pro에서는 2%를 가져가요.",
  "cpl.replace": "업그레이드하면 Pro 구독이 대체되어 요금제 하나만 결제하고, 남은 Pro 기간은 크레딧으로 돌려받아요.",
  "cpl.otherBill.web":
    "Pro는 Liftsmith 웹사이트에서 결제되고 있어요. 코치 요금제에 Pro가 포함되니, 코치 요금제가 시작되면 웹사이트에서 Pro를 해지하세요.",
  "cpl.otherBill.store":
    "Pro는 휴대폰의 앱 스토어에서 결제되고 있어요. 코치 요금제에 Pro가 포함되니, 코치 요금제가 시작되면 앱 스토어에서 Pro를 해지하세요.",
  "cpl.unavailable": "지금은 코치 요금제를 표시할 수 없어요. 연결을 확인하고 다시 시도하세요.",
  "cpl.retry": "다시 시도",
  "cpl.manage": "요금제 관리",
  "cpl.done": "{tier}이(가) 켜졌어요. 계정에 반영되는 데 1분 정도 걸릴 수 있어요.",
  "cpl.paid": "고마워요! 코치 요금제가 켜졌어요. 여기에 표시되는 데 1분 정도 걸릴 수 있어요.",
  "cpl.already": "계정에 이미 이 요금제나 더 큰 요금제가 있어요.",
  "cpl.error": "처리되지 않았어요. 잠시 후 다시 시도하세요.",
};

export const tr: Partial<Record<Key, Message>> = {
  "cpl.title": "Koçluk planın",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "Okul takımı",
  "cpl.count": "Danışanlar: {count} / {limit}",
  "cpl.countNoLimit": "Danışanlar: {count}, sınır yok",
  "cpl.full":
    "Planının sınırındasın, bu yüzden yeni danışanlar henüz katılamaz. Artık çalıştırmadığın bir danışanı kaldır ya da daha geniş bir plana geç.",
  "cpl.left": "Kalan yer: {left}",
  "cpl.grace":
    "Koç planları başladığında Pro'nun kapsadığından fazla danışanın vardı, bu yüzden sınırın {date} tarihine kadar {limit} olarak kalır. Şu an çalıştırdığın herkes bağlı kalır.",
  "cpl.over": "Çalıştırdığın herkes bağlı kalır. Yeni danışan eklemek için daha geniş bir plana geç.",
  "cpl.school": "Doğrulanmış lise koçları için ücretsiz, en fazla {limit} danışan.",
  "cpl.see": "Koç planlarını gör",
  "cpl.sheetTitle": "Koç planları",
  "cpl.sheetLead":
    "Pro en fazla {pro} danışanı kapsar. Koç planları, danışan listen büyüdükçe yer açar ve Pro'daki her şeyi içerir. Her koçluk aracı her planda çalışır.",
  "cpl.clients.coach": "En fazla {limit} danışan",
  "cpl.clients.coachPlus": "Danışan sınırı yok",
  "cpl.what.coach":
    "Dolu bir danışan listesi için raporlar, rutinler, sohbet, durum bildirimleri, rezervasyon, ödemeler ve beslenme hedefleri.",
  "cpl.what.coachPlus": "Aynı araçlar sınırsız, büyük bir danışan kadrosu için.",
  "cpl.current": "Planın",
  "cpl.yearly": "{tier}, yıllık",
  "cpl.monthly": "{tier}, aylık",
  "cpl.yearPrice": "Yılda {price}, ayda yaklaşık {perMonth}. İptal edene kadar her yıl yenilenir.",
  "cpl.monthPrice": "Ayda {price}. İptal edene kadar her ay yenilenir.",
  "cpl.free":
    "Danışanların her zaman ücretsiz antrenman yapar ve Coach ile Coach Plus'ta Liftsmith sana ödediklerinden hiçbir şey almaz. Pro'da %2 alır.",
  "cpl.replace": "Yükseltme Pro aboneliğinin yerini alır, böylece tek bir plan için ödersin; Pro'dan kalan süre de hesabına yansıtılır.",
  "cpl.otherBill.web":
    "Pro'n Liftsmith web sitesi üzerinden faturalanıyor. Koç planın başlayınca Pro'yu orada iptal et, çünkü koç planları Pro'yu içerir.",
  "cpl.otherBill.store":
    "Pro'n telefonunun uygulama mağazası üzerinden faturalanıyor. Koç planın başlayınca Pro'yu orada iptal et, çünkü koç planları Pro'yu içerir.",
  "cpl.unavailable": "Koç planları şu an gösterilemiyor. Bağlantını kontrol et ve yeniden dene.",
  "cpl.retry": "Yeniden dene",
  "cpl.manage": "Planı yönet",
  "cpl.done": "{tier} açık. Hesabına ulaşması bir dakika sürebilir.",
  "cpl.paid": "Teşekkürler! Koç planın açık. Burada görünmesi bir dakika sürebilir.",
  "cpl.already": "Hesabında zaten bu plan ya da daha büyüğü var.",
  "cpl.error": "İşlem gerçekleşmedi. Biraz sonra yeniden dene.",
};

export const pl: Partial<Record<Key, Message>> = {
  "cpl.title": "Twój plan trenerski",
  "cpl.tier.pro": "Pro",
  "cpl.tier.coach": "Coach",
  "cpl.tier.coachPlus": "Coach Plus",
  "cpl.tier.school": "Drużyna szkolna",
  "cpl.count": "Podopieczni: {count} z {limit}",
  "cpl.countNoLimit": "Podopieczni: {count}, bez limitu",
  "cpl.full":
    "Twój plan osiągnął limit, więc nowi podopieczni nie mogą jeszcze dołączyć. Usuń podopiecznego, którego już nie trenujesz, albo przejdź na plan z większym limitem.",
  "cpl.left": "Wolne miejsca: {left}",
  "cpl.grace":
    "Gdy wystartowały plany trenerskie, Twoich podopiecznych było więcej, niż obejmuje Pro, więc Twój limit zostaje na poziomie {limit} do {date}. Wszyscy, których teraz trenujesz, pozostają połączeni.",
  "cpl.over": "Wszyscy, których trenujesz, pozostają połączeni. Aby dodać nowych podopiecznych, przejdź na plan z większym limitem.",
  "cpl.school": "Za darmo dla zweryfikowanych trenerów szkół średnich, do {limit} podopiecznych.",
  "cpl.see": "Zobacz plany trenerskie",
  "cpl.sheetTitle": "Plany trenerskie",
  "cpl.sheetLead":
    "Pro obejmuje do {pro} podopiecznych. Plany trenerskie dają więcej miejsca, gdy lista podopiecznych rośnie, i zawierają wszystko z Pro. Każde narzędzie trenerskie działa w każdym planie.",
  "cpl.clients.coach": "Do {limit} podopiecznych",
  "cpl.clients.coachPlus": "Bez limitu podopiecznych",
  "cpl.what.coach": "Raporty, plany treningowe, czat, ankiety, rezerwacje, płatności i cele żywieniowe dla pełnej listy podopiecznych.",
  "cpl.what.coachPlus": "Te same narzędzia bez limitu, dla dużej grupy podopiecznych.",
  "cpl.current": "Twój plan",
  "cpl.yearly": "{tier}, rocznie",
  "cpl.monthly": "{tier}, miesięcznie",
  "cpl.yearPrice": "{price} rocznie, około {perMonth} miesięcznie. Odnawia się co roku, dopóki nie anulujesz.",
  "cpl.monthPrice": "{price} miesięcznie. Odnawia się co miesiąc, dopóki nie anulujesz.",
  "cpl.free":
    "Twoi podopieczni zawsze trenują za darmo, a w planach Coach i Coach Plus Liftsmith nie bierze nic z tego, co ci płacą. W Pro zatrzymuje 2%.",
  "cpl.replace": "Przejście wyżej zastępuje Twoją subskrypcję Pro, więc płacisz za jeden plan, a pozostała część Pro zostaje zaliczona.",
  "cpl.otherBill.web":
    "Twoje Pro jest rozliczane na stronie Liftsmith. Gdy plan trenerski się zacznie, anuluj tam Pro, bo plany trenerskie zawierają Pro.",
  "cpl.otherBill.store":
    "Twoje Pro jest rozliczane przez sklep z aplikacjami w telefonie. Gdy plan trenerski się zacznie, anuluj tam Pro, bo plany trenerskie zawierają Pro.",
  "cpl.unavailable": "Nie można teraz pokazać planów trenerskich. Sprawdź połączenie i spróbuj ponownie.",
  "cpl.retry": "Spróbuj ponownie",
  "cpl.manage": "Zarządzaj planem",
  "cpl.done": "{tier} jest aktywny. Może minąć chwila, zanim pojawi się na Twoim koncie.",
  "cpl.paid": "Dzięki! Twój plan trenerski jest aktywny. Może minąć chwila, zanim się tu pojawi.",
  "cpl.already": "Twoje konto ma już ten plan lub większy.",
  "cpl.error": "Nie udało się. Spróbuj ponownie za chwilę.",
};
