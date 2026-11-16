import type { Message } from "@/lib/i18n";

// Text for keys starting "account.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "account.title": "Account and sync",
  "account.lead":
    "Sign in to back up your workouts and use them on all your devices: phone, tablet and the web. It's optional, and everything stays on this device too.",
  "account.leadIn":
    "Your workouts, gyms and settings sync to your account whenever you're online, so they're safe and on every device you sign in on.",
  "account.signIn": "Sign in",
  "account.yours": "Your account",
  "account.apple": "Continue with Apple",
  "account.google": "Continue with Google",
  "account.emailButton": "Continue with email",
  "account.agree": "By signing in, you agree to the terms of use and the privacy policy.",
  "account.emailNote":
    "Signing in also turns on a few emails: workout reminders, your weekly recap and tips. Turn any of them off in Settings or from the link in each email.",
  "account.terms": "Terms of use",
  "account.privacy": "Privacy policy",
  "account.email.label": "Your email",
  "account.email.send": "Email me a code",
  "account.email.sent": "We sent a six-digit code to {email}. It works for 10 minutes.",
  "account.email.code": "Code",
  "account.email.verify": "Sign in",
  "account.email.again": "Use a different email",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "email",
  "account.as": "Signed in as {email} with {via}.",
  "account.asNoEmail": "Signed in with {via}.",
  "account.syncing": "Syncing…",
  "account.synced": "Synced {when}.",
  "account.justNow": "just now",
  "account.notSynced": "Not synced yet. It syncs when you're online.",
  "account.waiting": { one: "{count} change waiting to sync.", other: "{count} changes waiting to sync." },
  "account.syncError": "Couldn't reach the server. It'll try again when you're online.",
  "account.syncFull":
    "Your account's sync storage is full, so new changes stay on this device. Everything here is safe. Tell us through Send feedback in Settings.",
  "account.syncNow": "Sync now",
  "account.signOut": "Sign out",
  "account.signOutNote":
    "Signing out saves your changes to your account, then erases your data from this device, so the next person sees none of it. Sign in again to get it all back.",
  "account.signingOut": "Saving your changes…",
  "account.ended": {
    one: "You were signed out, and {count} change on this device never reached your account. Sign in again to save it, download a backup, or erase it from this device.",
    other:
      "You were signed out, and {count} changes on this device never reached your account. Sign in again to save them, download a backup, or erase them from this device.",
  },
  "account.ended.erase": "Erase my data from this device",
  "account.signOut.unsynced": {
    one: "{count} change hasn't reached your account yet, so signing out now would erase it. Try again once you're online, download a backup first, or sign out anyway.",
    other:
      "{count} changes haven't reached your account yet, so signing out now would erase them. Try again once you're online, download a backup first, or sign out anyway.",
  },
  "account.signOut.retry": "Try again",
  "account.signOut.backup": "Download a backup",
  "account.signOut.anyway": "Sign out anyway",
  "account.signOut.photos": {
    one: "You have {count} progress photo on this device. Photos never sync, so signing out deletes it unless you save a backup with it first.",
    other:
      "You have {count} progress photos on this device. Photos never sync, so signing out deletes them unless you save a backup with them first.",
  },
  "account.signOut.photosConfirm": "Sign out and delete photos",
  "account.delete": "Delete my account",
  "account.delete.warn":
    "This deletes your account and the copy of your data on our server, for good. This device keeps its own copy. Your other devices are signed out and keep theirs.",
  "account.delete.confirm": "Delete my account for good",
  "account.lost": "You were signed out, so this device stopped syncing. Your data is still here. Sign in again to keep syncing.",
  "account.offline": "You're offline. Connect and try again.",
  "account.notReady": "Accounts aren't switched on yet. Your data is safe on this device.",
  "account.failed": "That didn't work. Try again.",
  "account.what": "What syncs",
  "account.what.body":
    "Your workouts, sets, notes, body weight, gyms, routines and settings, plus health readings, injuries and cycle logs if you use them. It's your data: it's never used for ads or analytics. Progress photos never leave this device.",
  "account.row": "Account and sync",
  "account.row.out": "Sign in to back up and sync",
  "account.row.in": "Signed in as {email}",
  "account.delete.webSub": "Your Pro subscription from the website ends now too, and won't be charged again.",
  "account.signOut.backupPhotos": "Save a backup with photos",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "account.title": "Cuenta y sincronización",
  "account.lead":
    "Inicia sesión para guardar una copia de tus entrenamientos y usarlos en todos tus dispositivos: teléfono, tableta y la web. Es opcional, y todo se queda también en este dispositivo.",
  "account.leadIn":
    "Tus entrenamientos, gimnasios y ajustes se sincronizan con tu cuenta cuando tienes conexión, así están seguros y en cada dispositivo donde inicies sesión.",
  "account.signIn": "Iniciar sesión",
  "account.yours": "Tu cuenta",
  "account.apple": "Continuar con Apple",
  "account.google": "Continuar con Google",
  "account.emailButton": "Continuar con correo",
  "account.agree": "Al iniciar sesión, aceptas los términos de uso y la política de privacidad.",
  "account.emailNote":
    "Al iniciar sesión también se activan algunos correos: recordatorios de entrenamiento, tu resumen semanal y consejos. Desactiva cualquiera en Ajustes o con el enlace de cada correo.",
  "account.terms": "Términos de uso",
  "account.privacy": "Política de privacidad",
  "account.email.label": "Tu correo",
  "account.email.send": "Envíame un código",
  "account.email.sent": "Enviamos un código de seis dígitos a {email}. Sirve durante 10 minutos.",
  "account.email.code": "Código",
  "account.email.verify": "Iniciar sesión",
  "account.email.again": "Usar otro correo",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "correo",
  "account.as": "Sesión iniciada como {email} con {via}.",
  "account.asNoEmail": "Sesión iniciada con {via}.",
  "account.syncing": "Sincronizando…",
  "account.synced": "Sincronizado {when}.",
  "account.justNow": "ahora mismo",
  "account.notSynced": "Aún sin sincronizar. Se sincroniza cuando tienes conexión.",
  "account.waiting": { one: "{count} cambio pendiente de sincronizar.", other: "{count} cambios pendientes de sincronizar." },
  "account.syncError": "No se pudo conectar con el servidor. Lo intentará de nuevo cuando tengas conexión.",
  "account.syncFull":
    "El almacenamiento de sincronización de tu cuenta está lleno, así que los cambios nuevos se quedan en este dispositivo. Todo lo de aquí está a salvo. Avísanos con Enviar comentarios en Ajustes.",
  "account.syncNow": "Sincronizar ahora",
  "account.signOut": "Cerrar sesión",
  "account.signOutNote":
    "Al cerrar sesión, tus cambios se guardan en tu cuenta y luego se borran tus datos de este dispositivo, así la siguiente persona no ve nada tuyo. Vuelve a iniciar sesión para recuperarlo todo.",
  "account.signingOut": "Guardando tus cambios…",
  "account.ended": {
    one: "Se cerró tu sesión y {count} cambio de este dispositivo nunca llegó a tu cuenta. Vuelve a iniciar sesión para guardarlo, descarga una copia o bórralo de este dispositivo.",
    other:
      "Se cerró tu sesión y {count} cambios de este dispositivo nunca llegaron a tu cuenta. Vuelve a iniciar sesión para guardarlos, descarga una copia o bórralos de este dispositivo.",
  },
  "account.ended.erase": "Borrar mis datos de este dispositivo",
  "account.signOut.unsynced": {
    one: "{count} cambio aún no ha llegado a tu cuenta, así que cerrar sesión ahora lo borraría. Vuelve a intentarlo cuando tengas conexión, descarga antes una copia o cierra sesión de todos modos.",
    other:
      "{count} cambios aún no han llegado a tu cuenta, así que cerrar sesión ahora los borraría. Vuelve a intentarlo cuando tengas conexión, descarga antes una copia o cierra sesión de todos modos.",
  },
  "account.signOut.retry": "Reintentar",
  "account.signOut.backup": "Descargar una copia",
  "account.signOut.anyway": "Cerrar sesión de todos modos",
  "account.signOut.photos": {
    one: "Tienes {count} foto de progreso en este dispositivo. Las fotos nunca se sincronizan, así que cerrar sesión la borra salvo que antes guardes una copia con ella.",
    other:
      "Tienes {count} fotos de progreso en este dispositivo. Las fotos nunca se sincronizan, así que cerrar sesión las borra salvo que antes guardes una copia con ellas.",
  },
  "account.signOut.photosConfirm": "Cerrar sesión y borrar las fotos",
  "account.delete": "Eliminar mi cuenta",
  "account.delete.warn":
    "Esto elimina tu cuenta y la copia de tus datos en nuestro servidor, para siempre. Este dispositivo conserva su propia copia. Tus otros dispositivos cierran sesión y conservan la suya.",
  "account.delete.confirm": "Eliminar mi cuenta para siempre",
  "account.lost":
    "Se cerró tu sesión, así que este dispositivo dejó de sincronizarse. Tus datos siguen aquí. Vuelve a iniciar sesión para seguir sincronizando.",
  "account.offline": "No tienes conexión. Conéctate e inténtalo de nuevo.",
  "account.notReady": "Las cuentas aún no están activadas. Tus datos están seguros en este dispositivo.",
  "account.failed": "No funcionó. Inténtalo de nuevo.",
  "account.what": "Qué se sincroniza",
  "account.what.body":
    "Tus entrenamientos, series, notas, peso corporal, gimnasios, rutinas y ajustes, además de datos de salud, lesiones y registros del ciclo si los usas. Son tus datos: nunca se usan para anuncios ni analítica. Las fotos de progreso nunca salen de este dispositivo.",
  "account.row": "Cuenta y sincronización",
  "account.row.out": "Inicia sesión para guardar y sincronizar",
  "account.row.in": "Sesión iniciada como {email}",
  "account.delete.webSub": "Tu suscripción Pro del sitio web también termina ahora y no se volverá a cobrar.",
  "account.signOut.backupPhotos": "Guardar una copia con fotos",
};

export const fr: Partial<Record<Key, Message>> = {
  "account.title": "Compte et synchronisation",
  "account.lead":
    "Connectez-vous pour sauvegarder vos séances et les retrouver sur tous vos appareils : téléphone, tablette et le web. C'est facultatif, et tout reste aussi sur cet appareil.",
  "account.leadIn":
    "Vos séances, salles et réglages se synchronisent avec votre compte dès que vous êtes en ligne : ils sont en sécurité et sur chaque appareil où vous vous connectez.",
  "account.signIn": "Se connecter",
  "account.yours": "Votre compte",
  "account.apple": "Continuer avec Apple",
  "account.google": "Continuer avec Google",
  "account.emailButton": "Continuer avec un e-mail",
  "account.agree": "En vous connectant, vous acceptez les conditions d’utilisation et la politique de confidentialité.",
  "account.emailNote":
    "La connexion active aussi quelques e-mails : rappels d'entraînement, votre bilan de la semaine et des conseils. Désactivez-les dans Réglages ou avec le lien de chaque e-mail.",
  "account.terms": "Conditions d’utilisation",
  "account.privacy": "Politique de confidentialité",
  "account.email.label": "Votre e-mail",
  "account.email.send": "M'envoyer un code",
  "account.email.sent": "Nous avons envoyé un code à six chiffres à {email}. Il est valable 10 minutes.",
  "account.email.code": "Code",
  "account.email.verify": "Se connecter",
  "account.email.again": "Utiliser un autre e-mail",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "e-mail",
  "account.as": "Connecté en tant que {email} avec {via}.",
  "account.asNoEmail": "Connecté avec {via}.",
  "account.syncing": "Synchronisation…",
  "account.synced": "Synchronisé {when}.",
  "account.justNow": "à l'instant",
  "account.notSynced": "Pas encore synchronisé. La synchronisation se fait quand vous êtes en ligne.",
  "account.waiting": {
    one: "{count} modification en attente de synchronisation.",
    other: "{count} modifications en attente de synchronisation.",
  },
  "account.syncError": "Impossible de joindre le serveur. Nouvel essai dès que vous serez en ligne.",
  "account.syncFull":
    "L'espace de synchronisation de votre compte est plein : les nouvelles modifications restent sur cet appareil. Tout ce qui est ici est en sécurité. Dites-le-nous avec Envoyer un avis dans Réglages.",
  "account.syncNow": "Synchroniser",
  "account.signOut": "Se déconnecter",
  "account.signOutNote":
    "Se déconnecter enregistre vos modifications sur votre compte, puis efface vos données de cet appareil : la personne suivante ne voit rien de vous. Reconnectez-vous pour tout retrouver.",
  "account.signingOut": "Enregistrement de vos modifications…",
  "account.ended": {
    one: "Vous avez été déconnecté, et {count} modification sur cet appareil n'est jamais arrivée sur votre compte. Reconnectez-vous pour l'enregistrer, téléchargez une sauvegarde ou effacez-la de cet appareil.",
    other:
      "Vous avez été déconnecté, et {count} modifications sur cet appareil ne sont jamais arrivées sur votre compte. Reconnectez-vous pour les enregistrer, téléchargez une sauvegarde ou effacez-les de cet appareil.",
  },
  "account.ended.erase": "Effacer mes données de cet appareil",
  "account.signOut.unsynced": {
    one: "{count} modification n'est pas encore arrivée sur votre compte : vous déconnecter maintenant l'effacerait. Réessayez une fois en ligne, téléchargez d'abord une sauvegarde, ou déconnectez-vous quand même.",
    other:
      "{count} modifications ne sont pas encore arrivées sur votre compte : vous déconnecter maintenant les effacerait. Réessayez une fois en ligne, téléchargez d'abord une sauvegarde, ou déconnectez-vous quand même.",
  },
  "account.signOut.retry": "Réessayer",
  "account.signOut.backup": "Télécharger une sauvegarde",
  "account.signOut.anyway": "Se déconnecter quand même",
  "account.signOut.photos": {
    one: "Vous avez {count} photo de progrès sur cet appareil. Les photos ne sont jamais synchronisées : la déconnexion la supprime, sauf si vous enregistrez d’abord une sauvegarde qui la contient.",
    other:
      "Vous avez {count} photos de progrès sur cet appareil. Les photos ne sont jamais synchronisées : la déconnexion les supprime, sauf si vous enregistrez d’abord une sauvegarde qui les contient.",
  },
  "account.signOut.photosConfirm": "Se déconnecter et supprimer les photos",
  "account.delete": "Supprimer mon compte",
  "account.delete.warn":
    "Cela supprime votre compte et la copie de vos données sur notre serveur, définitivement. Cet appareil garde sa propre copie. Vos autres appareils sont déconnectés et gardent la leur.",
  "account.delete.confirm": "Supprimer mon compte définitivement",
  "account.lost":
    "Vous avez été déconnecté, cet appareil ne se synchronise plus. Vos données sont toujours là. Reconnectez-vous pour continuer à synchroniser.",
  "account.offline": "Vous êtes hors ligne. Connectez-vous et réessayez.",
  "account.notReady": "Les comptes ne sont pas encore activés. Vos données sont en sécurité sur cet appareil.",
  "account.failed": "Ça n'a pas marché. Réessayez.",
  "account.what": "Ce qui est synchronisé",
  "account.what.body":
    "Vos séances, séries, notes, poids, salles, routines et réglages, ainsi que les données de santé, blessures et suivi du cycle si vous les utilisez. Ce sont vos données : jamais utilisées pour la publicité ni les statistiques. Les photos de progression ne quittent jamais cet appareil.",
  "account.row": "Compte et synchronisation",
  "account.row.out": "Connectez-vous pour sauvegarder et synchroniser",
  "account.row.in": "Connecté en tant que {email}",
  "account.delete.webSub": "Votre abonnement Pro pris sur le site prend fin maintenant aussi et ne sera plus facturé.",
  "account.signOut.backupPhotos": "Enregistrer une sauvegarde avec les photos",
};

export const de: Partial<Record<Key, Message>> = {
  "account.title": "Konto und Synchronisierung",
  "account.lead":
    "Melde dich an, um deine Trainings zu sichern und auf all deinen Geräten zu nutzen: Telefon, Tablet und Web. Das ist optional, und alles bleibt auch auf diesem Gerät.",
  "account.leadIn":
    "Deine Trainings, Studios und Einstellungen werden mit deinem Konto synchronisiert, sobald du online bist. So sind sie sicher und auf jedem Gerät, auf dem du angemeldet bist.",
  "account.signIn": "Anmelden",
  "account.yours": "Dein Konto",
  "account.apple": "Weiter mit Apple",
  "account.google": "Weiter mit Google",
  "account.emailButton": "Weiter mit E-Mail",
  "account.agree": "Wenn du dich anmeldest, stimmst du den Nutzungsbedingungen und der Datenschutzerklärung zu.",
  "account.emailNote":
    "Mit der Anmeldung werden auch ein paar E-Mails aktiviert: Trainingserinnerungen, dein Wochenrückblick und Tipps. Du kannst jede davon in den Einstellungen oder über den Link in jeder E-Mail abbestellen.",
  "account.terms": "Nutzungsbedingungen",
  "account.privacy": "Datenschutzerklärung",
  "account.email.label": "Deine E-Mail",
  "account.email.send": "Code per E-Mail senden",
  "account.email.sent": "Wir haben einen sechsstelligen Code an {email} gesendet. Er gilt 10 Minuten.",
  "account.email.code": "Code",
  "account.email.verify": "Anmelden",
  "account.email.again": "Andere E-Mail verwenden",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "E-Mail",
  "account.as": "Angemeldet als {email} mit {via}.",
  "account.asNoEmail": "Angemeldet mit {via}.",
  "account.syncing": "Wird synchronisiert…",
  "account.synced": "Synchronisiert {when}.",
  "account.justNow": "gerade eben",
  "account.notSynced": "Noch nicht synchronisiert. Das passiert, sobald du online bist.",
  "account.waiting": {
    one: "{count} Änderung wartet auf die Synchronisierung.",
    other: "{count} Änderungen warten auf die Synchronisierung.",
  },
  "account.syncError": "Der Server war nicht erreichbar. Es wird erneut versucht, sobald du online bist.",
  "account.syncFull":
    "Der Sync-Speicher deines Kontos ist voll, deshalb bleiben neue Änderungen auf diesem Gerät. Alles hier ist sicher. Sag uns über Feedback senden in den Einstellungen Bescheid.",
  "account.syncNow": "Jetzt synchronisieren",
  "account.signOut": "Abmelden",
  "account.signOutNote":
    "Beim Abmelden werden deine Änderungen in deinem Konto gespeichert und danach deine Daten von diesem Gerät gelöscht, damit die nächste Person nichts davon sieht. Melde dich wieder an, um alles zurückzubekommen.",
  "account.signingOut": "Änderungen werden gespeichert…",
  "account.ended": {
    one: "Du wurdest abgemeldet, und {count} Änderung auf diesem Gerät ist nie in deinem Konto angekommen. Melde dich wieder an, um sie zu speichern, lade eine Sicherung herunter oder lösche sie von diesem Gerät.",
    other:
      "Du wurdest abgemeldet, und {count} Änderungen auf diesem Gerät sind nie in deinem Konto angekommen. Melde dich wieder an, um sie zu speichern, lade eine Sicherung herunter oder lösche sie von diesem Gerät.",
  },
  "account.ended.erase": "Meine Daten von diesem Gerät löschen",
  "account.signOut.unsynced": {
    one: "{count} Änderung ist noch nicht in deinem Konto angekommen. Wenn du dich jetzt abmeldest, wird sie gelöscht. Versuch es wieder, sobald du online bist, lade vorher eine Sicherung herunter oder melde dich trotzdem ab.",
    other:
      "{count} Änderungen sind noch nicht in deinem Konto angekommen. Wenn du dich jetzt abmeldest, werden sie gelöscht. Versuch es wieder, sobald du online bist, lade vorher eine Sicherung herunter oder melde dich trotzdem ab.",
  },
  "account.signOut.retry": "Erneut versuchen",
  "account.signOut.backup": "Sicherung herunterladen",
  "account.signOut.anyway": "Trotzdem abmelden",
  "account.signOut.photos": {
    one: "Du hast {count} Fortschrittsfoto auf diesem Gerät. Fotos werden nie synchronisiert, also löscht das Abmelden es, wenn du nicht vorher eine Sicherung mit Foto speicherst.",
    other:
      "Du hast {count} Fortschrittsfotos auf diesem Gerät. Fotos werden nie synchronisiert, also löscht das Abmelden sie, wenn du nicht vorher eine Sicherung mit Fotos speicherst.",
  },
  "account.signOut.photosConfirm": "Abmelden und Fotos löschen",
  "account.delete": "Mein Konto löschen",
  "account.delete.warn":
    "Damit werden dein Konto und die Kopie deiner Daten auf unserem Server endgültig gelöscht. Dieses Gerät behält seine eigene Kopie. Deine anderen Geräte werden abgemeldet und behalten ihre.",
  "account.delete.confirm": "Mein Konto endgültig löschen",
  "account.lost":
    "Du wurdest abgemeldet, deshalb synchronisiert dieses Gerät nicht mehr. Deine Daten sind noch da. Melde dich erneut an, um weiter zu synchronisieren.",
  "account.offline": "Du bist offline. Verbinde dich und versuch es noch einmal.",
  "account.notReady": "Konten sind noch nicht eingeschaltet. Deine Daten sind auf diesem Gerät sicher.",
  "account.failed": "Das hat nicht geklappt. Versuch es noch einmal.",
  "account.what": "Was synchronisiert wird",
  "account.what.body":
    "Deine Trainings, Sätze, Notizen, Körpergewicht, Studios, Routinen und Einstellungen, dazu Gesundheitswerte, Verletzungen und Zyklusdaten, wenn du sie nutzt. Es sind deine Daten: Sie werden nie für Werbung oder Analysen genutzt. Fortschrittsfotos verlassen dieses Gerät nie.",
  "account.row": "Konto und Synchronisierung",
  "account.row.out": "Anmelden zum Sichern und Synchronisieren",
  "account.row.in": "Angemeldet als {email}",
  "account.delete.webSub": "Dein Pro-Abo von der Website endet damit ebenfalls und wird nicht mehr berechnet.",
  "account.signOut.backupPhotos": "Sicherung mit Fotos speichern",
};

export const it: Partial<Record<Key, Message>> = {
  "account.title": "Account e sincronizzazione",
  "account.lead":
    "Accedi per fare il backup degli allenamenti e usarli su tutti i tuoi dispositivi: telefono, tablet e web. È facoltativo, e tutto resta anche su questo dispositivo.",
  "account.leadIn":
    "Allenamenti, palestre e impostazioni si sincronizzano con il tuo account quando sei online, così sono al sicuro e su ogni dispositivo in cui accedi.",
  "account.signIn": "Accedi",
  "account.yours": "Il tuo account",
  "account.apple": "Continua con Apple",
  "account.google": "Continua con Google",
  "account.emailButton": "Continua con l’email",
  "account.agree": "Accedendo, accetti le condizioni d’uso e l’informativa sulla privacy.",
  "account.emailNote":
    "Accedendo attivi anche alcune email: promemoria di allenamento, il riepilogo della settimana e consigli. Puoi disattivarle nelle Impostazioni o dal link in ogni email.",
  "account.terms": "Condizioni d’uso",
  "account.privacy": "Informativa sulla privacy",
  "account.email.label": "La tua email",
  "account.email.send": "Inviami un codice via email",
  "account.email.sent": "Abbiamo inviato un codice di sei cifre a {email}. Vale per 10 minuti.",
  "account.email.code": "Codice",
  "account.email.verify": "Accedi",
  "account.email.again": "Usa un’altra email",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "email",
  "account.as": "Accesso come {email} con {via}.",
  "account.asNoEmail": "Accesso con {via}.",
  "account.syncing": "Sincronizzazione…",
  "account.synced": "Sincronizzato {when}.",
  "account.justNow": "proprio ora",
  "account.notSynced": "Non ancora sincronizzato. Succede quando sei online.",
  "account.waiting": { one: "{count} modifica in attesa di sincronizzazione.", other: "{count} modifiche in attesa di sincronizzazione." },
  "account.syncError": "Impossibile raggiungere il server. Riproverà quando sarai online.",
  "account.syncFull":
    "Lo spazio di sincronizzazione del tuo account è pieno, quindi le nuove modifiche restano su questo dispositivo. Qui è tutto al sicuro. Diccelo con Invia un feedback nelle Impostazioni.",
  "account.syncNow": "Sincronizza ora",
  "account.signOut": "Esci",
  "account.signOutNote":
    "Uscendo, le tue modifiche vengono salvate nel tuo account e poi i tuoi dati vengono cancellati da questo dispositivo, così la persona successiva non vede nulla di tuo. Accedi di nuovo per ritrovare tutto.",
  "account.signingOut": "Salvataggio delle modifiche…",
  "account.ended": {
    one: "Sei stato disconnesso e {count} modifica su questo dispositivo non è mai arrivata al tuo account. Accedi di nuovo per salvarla, scarica un backup o cancellala da questo dispositivo.",
    other:
      "Sei stato disconnesso e {count} modifiche su questo dispositivo non sono mai arrivate al tuo account. Accedi di nuovo per salvarle, scarica un backup o cancellale da questo dispositivo.",
  },
  "account.ended.erase": "Cancella i miei dati da questo dispositivo",
  "account.signOut.unsynced": {
    one: "{count} modifica non è ancora arrivata al tuo account, quindi uscire ora la cancellerebbe. Riprova quando sei online, scarica prima un backup o esci comunque.",
    other:
      "{count} modifiche non sono ancora arrivate al tuo account, quindi uscire ora le cancellerebbe. Riprova quando sei online, scarica prima un backup o esci comunque.",
  },
  "account.signOut.retry": "Riprova",
  "account.signOut.backup": "Scarica un backup",
  "account.signOut.anyway": "Esci comunque",
  "account.signOut.photos": {
    one: "Hai {count} foto dei progressi su questo dispositivo. Le foto non vengono mai sincronizzate, quindi uscire la elimina, a meno che prima non salvi un backup che la contiene.",
    other:
      "Hai {count} foto dei progressi su questo dispositivo. Le foto non vengono mai sincronizzate, quindi uscire le elimina, a meno che prima non salvi un backup che le contiene.",
  },
  "account.signOut.photosConfirm": "Esci ed elimina le foto",
  "account.delete": "Elimina il mio account",
  "account.delete.warn":
    "Elimina definitivamente il tuo account e la copia dei tuoi dati sul nostro server. Questo dispositivo conserva la sua copia. Gli altri dispositivi vengono disconnessi e conservano la loro.",
  "account.delete.confirm": "Elimina definitivamente il mio account",
  "account.lost":
    "Sei stato disconnesso, quindi questo dispositivo ha smesso di sincronizzare. I tuoi dati sono ancora qui. Accedi di nuovo per continuare.",
  "account.offline": "Sei offline. Connettiti e riprova.",
  "account.notReady": "Gli account non sono ancora attivi. I tuoi dati sono al sicuro su questo dispositivo.",
  "account.failed": "Non ha funzionato. Riprova.",
  "account.what": "Cosa si sincronizza",
  "account.what.body":
    "Allenamenti, serie, note, peso corporeo, palestre, routine e impostazioni, più misurazioni di salute, infortuni e dati del ciclo se li usi. Sono dati tuoi: non vengono mai usati per pubblicità o statistiche. Le foto dei progressi non lasciano mai questo dispositivo.",
  "account.row": "Account e sincronizzazione",
  "account.row.out": "Accedi per backup e sincronizzazione",
  "account.row.in": "Accesso come {email}",
  "account.delete.webSub": "Anche il tuo abbonamento Pro del sito termina ora e non ti verrà più addebitato.",
  "account.signOut.backupPhotos": "Salva un backup con le foto",
};

export const ja: Partial<Record<Key, Message>> = {
  "account.title": "アカウントと同期",
  "account.lead":
    "サインインするとワークアウトがバックアップされ、スマホ、タブレット、Web のどこでも使えます。任意で、データはこの端末にも残ります。",
  "account.leadIn":
    "オンラインのときはワークアウト、ジム、設定がアカウントに同期されるので、安全に保存され、サインインしたすべての端末で使えます。",
  "account.signIn": "サインイン",
  "account.yours": "あなたのアカウント",
  "account.apple": "Apple で続ける",
  "account.google": "Google で続ける",
  "account.emailButton": "メールで続ける",
  "account.agree": "サインインすると、利用規約とプライバシーポリシーに同意したことになります。",
  "account.emailNote":
    "サインインすると、ワークアウトのリマインダー、週のまとめ、ヒントのメールも届くようになります。設定または各メールのリンクからいつでも停止できます。",
  "account.terms": "利用規約",
  "account.privacy": "プライバシーポリシー",
  "account.email.label": "メールアドレス",
  "account.email.send": "コードをメールで受け取る",
  "account.email.sent": "{email}に6桁のコードを送りました。有効期限は10分です。",
  "account.email.code": "コード",
  "account.email.verify": "サインイン",
  "account.email.again": "別のメールアドレスを使う",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "メール",
  "account.as": "{via}で{email}としてサインイン中。",
  "account.asNoEmail": "{via}でサインイン中。",
  "account.syncing": "同期中…",
  "account.synced": "{when}に同期しました。",
  "account.justNow": "たった今",
  "account.notSynced": "まだ同期されていません。オンラインになると同期されます。",
  "account.waiting": { other: "{count}件の変更が同期待ちです。" },
  "account.syncError": "サーバーに接続できませんでした。オンラインになったら再試行します。",
  "account.syncFull":
    "アカウントの同期ストレージがいっぱいのため、新しい変更はこの端末に残ります。ここにあるデータは安全です。設定の「フィードバックを送る」からお知らせください。",
  "account.syncNow": "今すぐ同期",
  "account.signOut": "サインアウト",
  "account.signOutNote":
    "サインアウトすると、変更をアカウントに保存してから、この端末のデータを消去します。次に使う人にはあなたのデータは表示されません。もう一度サインインすればすべて戻ります。",
  "account.signingOut": "変更を保存しています…",
  "account.ended": {
    other:
      "サインアウトされましたが、この端末の{count}件の変更はアカウントに届いていません。もう一度サインインして保存するか、バックアップをダウンロードするか、この端末から消去してください。",
  },
  "account.ended.erase": "この端末からデータを消去",
  "account.signOut.unsynced": {
    other:
      "{count}件の変更がまだアカウントに届いていないため、今サインアウトすると消えてしまいます。オンラインになってから再試行するか、先にバックアップをダウンロードするか、このままサインアウトしてください。",
  },
  "account.signOut.retry": "再試行",
  "account.signOut.backup": "バックアップをダウンロード",
  "account.signOut.anyway": "このままサインアウト",
  "account.signOut.photos": {
    other:
      "この端末に進捗写真が{count}枚あります。写真は同期されないため、先に写真入りのバックアップを保存しないと、サインアウトで削除されます。",
  },
  "account.signOut.photosConfirm": "サインアウトして写真を削除",
  "account.delete": "アカウントを削除",
  "account.delete.warn":
    "アカウントとサーバー上のデータのコピーが完全に削除されます。この端末のデータは残ります。他の端末はサインアウトされ、それぞれのデータは残ります。",
  "account.delete.confirm": "アカウントを完全に削除",
  "account.lost":
    "サインアウトされたため、この端末の同期が止まりました。データは残っています。同期を続けるにはもう一度サインインしてください。",
  "account.offline": "オフラインです。接続してからもう一度お試しください。",
  "account.notReady": "アカウント機能はまだ有効になっていません。データはこの端末に安全に保存されています。",
  "account.failed": "うまくいきませんでした。もう一度お試しください。",
  "account.what": "同期されるもの",
  "account.what.body":
    "ワークアウト、セット、メモ、体重、ジム、ルーティン、設定、さらに使っていれば健康データ、ケガ、周期の記録。あなたのデータなので、広告や分析には使いません。進捗写真はこの端末から出ません。",
  "account.row": "アカウントと同期",
  "account.row.out": "サインインしてバックアップと同期",
  "account.row.in": "{email}でサインイン中",
  "account.delete.webSub": "ウェブサイトで登録した Pro のサブスクリプションも今すぐ終了し、今後請求されることはありません。",
  "account.signOut.backupPhotos": "写真入りのバックアップを保存",
};

export const pt: Partial<Record<Key, Message>> = {
  "account.title": "Conta e sincronização",
  "account.lead":
    "Entre para fazer backup dos seus treinos e usá-los em todos os seus dispositivos: celular, tablet e web. É opcional, e tudo continua neste dispositivo também.",
  "account.leadIn":
    "Seus treinos, academias e ajustes sincronizam com sua conta sempre que você está online, então ficam seguros e em todo dispositivo em que você entrar.",
  "account.signIn": "Entrar",
  "account.yours": "Sua conta",
  "account.apple": "Continuar com a Apple",
  "account.google": "Continuar com o Google",
  "account.emailButton": "Continuar com e-mail",
  "account.agree": "Ao entrar, você concorda com os termos de uso e a política de privacidade.",
  "account.emailNote":
    "Entrar também ativa alguns e-mails: lembretes de treino, seu resumo semanal e dicas. Desative qualquer um deles em Ajustes ou pelo link em cada e-mail.",
  "account.terms": "Termos de uso",
  "account.privacy": "Política de privacidade",
  "account.email.label": "Seu e-mail",
  "account.email.send": "Me envie um código",
  "account.email.sent": "Enviamos um código de seis dígitos para {email}. Ele vale por 10 minutos.",
  "account.email.code": "Código",
  "account.email.verify": "Entrar",
  "account.email.again": "Usar outro e-mail",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "e-mail",
  "account.as": "Conectado como {email} com {via}.",
  "account.asNoEmail": "Conectado com {via}.",
  "account.syncing": "Sincronizando…",
  "account.synced": "Sincronizado {when}.",
  "account.justNow": "agora mesmo",
  "account.notSynced": "Ainda não sincronizado. Sincroniza quando você estiver online.",
  "account.waiting": {
    one: "{count} alteração esperando para sincronizar.",
    other: "{count} alterações esperando para sincronizar.",
  },
  "account.syncError": "Não foi possível conectar ao servidor. Vamos tentar de novo quando você estiver online.",
  "account.syncFull":
    "O armazenamento de sincronização da sua conta está cheio, então as novas alterações ficam neste dispositivo. Tudo aqui está seguro. Avise a gente em Enviar feedback, nos Ajustes.",
  "account.syncNow": "Sincronizar agora",
  "account.signOut": "Sair",
  "account.signOutNote":
    "Ao sair, suas alterações são salvas na sua conta e depois seus dados são apagados deste dispositivo, para que a próxima pessoa não veja nada. Entre de novo para ter tudo de volta.",
  "account.signingOut": "Salvando suas alterações…",
  "account.ended": {
    one: "Você saiu da conta, e {count} alteração neste dispositivo nunca chegou à sua conta. Entre de novo para salvá-la, baixe um backup ou apague-a deste dispositivo.",
    other:
      "Você saiu da conta, e {count} alterações neste dispositivo nunca chegaram à sua conta. Entre de novo para salvá-las, baixe um backup ou apague-as deste dispositivo.",
  },
  "account.ended.erase": "Apagar meus dados deste dispositivo",
  "account.signOut.unsynced": {
    one: "{count} alteração ainda não chegou à sua conta, então sair agora a apagaria. Tente de novo quando estiver online, baixe um backup antes ou saia mesmo assim.",
    other:
      "{count} alterações ainda não chegaram à sua conta, então sair agora as apagaria. Tente de novo quando estiver online, baixe um backup antes ou saia mesmo assim.",
  },
  "account.signOut.retry": "Tentar de novo",
  "account.signOut.backup": "Baixar um backup",
  "account.signOut.anyway": "Sair mesmo assim",
  "account.signOut.photos": {
    one: "Você tem {count} foto de progresso neste dispositivo. As fotos nunca saem dele, então sair a apaga para sempre.",
    other: "Você tem {count} fotos de progresso neste dispositivo. As fotos nunca saem dele, então sair as apaga para sempre.",
  },
  "account.signOut.photosConfirm": "Sair e apagar as fotos",
  "account.delete": "Excluir minha conta",
  "account.delete.warn":
    "Isso exclui sua conta e a cópia dos seus dados no nosso servidor, para sempre. Este dispositivo mantém a própria cópia. Seus outros dispositivos saem da conta e mantêm as deles.",
  "account.delete.confirm": "Excluir minha conta para sempre",
  "account.lost":
    "Você saiu da conta, então este dispositivo parou de sincronizar. Seus dados continuam aqui. Entre de novo para continuar sincronizando.",
  "account.offline": "Você está offline. Conecte-se e tente de novo.",
  "account.notReady": "As contas ainda não estão ativadas. Seus dados estão seguros neste dispositivo.",
  "account.failed": "Não deu certo. Tente de novo.",
  "account.what": "O que sincroniza",
  "account.what.body":
    "Seus treinos, séries, notas, peso corporal, academias, rotinas e ajustes, além de leituras de saúde, lesões e registros do ciclo, se você os usar. Os dados são seus: nunca são usados para anúncios ou análises. As fotos de progresso nunca saem deste dispositivo.",
  "account.row": "Conta e sincronização",
  "account.row.out": "Entre para fazer backup e sincronizar",
  "account.row.in": "Conectado como {email}",
  "account.delete.webSub": "Sua assinatura Pro do site também termina agora e não será cobrada de novo.",
  "account.signOut.backupPhotos": "Salvar um backup com fotos",
};

export const ko: Partial<Record<Key, Message>> = {
  "account.title": "계정 및 동기화",
  "account.lead":
    "로그인하면 운동 기록을 백업하고 휴대폰, 태블릿, 웹 등 모든 기기에서 쓸 수 있어요. 선택 사항이며, 모든 데이터는 이 기기에도 그대로 남아요.",
  "account.leadIn": "온라인일 때마다 운동, 헬스장, 설정이 계정에 동기화돼서 안전하게 보관되고 로그인한 모든 기기에서 볼 수 있어요.",
  "account.signIn": "로그인",
  "account.yours": "내 계정",
  "account.apple": "Apple로 계속하기",
  "account.google": "Google로 계속하기",
  "account.emailButton": "이메일로 계속하기",
  "account.agree": "로그인하면 이용약관과 개인정보 처리방침에 동의하게 돼요.",
  "account.emailNote": "로그인하면 운동 알림, 주간 요약, 팁 등 몇 가지 이메일도 켜져요. 설정이나 각 이메일의 링크에서 언제든 끌 수 있어요.",
  "account.terms": "이용약관",
  "account.privacy": "개인정보 처리방침",
  "account.email.label": "이메일",
  "account.email.send": "이메일로 코드 받기",
  "account.email.sent": "{email}(으)로 6자리 코드를 보냈어요. 10분 동안 유효해요.",
  "account.email.code": "코드",
  "account.email.verify": "로그인",
  "account.email.again": "다른 이메일 사용",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "이메일",
  "account.as": "{via}(으)로 {email} 계정에 로그인했어요.",
  "account.asNoEmail": "{via}(으)로 로그인했어요.",
  "account.syncing": "동기화 중…",
  "account.synced": "{when} 동기화됨.",
  "account.justNow": "방금",
  "account.notSynced": "아직 동기화되지 않았어요. 온라인이 되면 동기화돼요.",
  "account.waiting": {
    other: "변경 사항 {count}개가 동기화를 기다리고 있어요.",
  },
  "account.syncError": "서버에 연결할 수 없어요. 온라인이 되면 다시 시도해요.",
  "account.syncFull":
    "계정의 동기화 저장 공간이 가득 차서 새 변경 사항은 이 기기에만 저장돼요. 여기 있는 데이터는 모두 안전해요. 설정의 의견 보내기로 알려 주세요.",
  "account.syncNow": "지금 동기화",
  "account.signOut": "로그아웃",
  "account.signOutNote":
    "로그아웃하면 변경 사항을 계정에 저장한 뒤 이 기기에서 데이터를 지워서, 다음 사람은 아무것도 볼 수 없어요. 다시 로그인하면 모두 돌아와요.",
  "account.signingOut": "변경 사항 저장 중…",
  "account.ended": {
    other:
      "로그아웃되었고, 이 기기의 변경 사항 {count}개가 계정에 저장되지 못했어요. 다시 로그인해서 저장하거나, 백업을 다운로드하거나, 이 기기에서 지우세요.",
  },
  "account.ended.erase": "이 기기에서 내 데이터 지우기",
  "account.signOut.unsynced": {
    other:
      "변경 사항 {count}개가 아직 계정에 저장되지 않아서 지금 로그아웃하면 지워져요. 온라인이 되면 다시 시도하거나, 먼저 백업을 다운로드하거나, 그래도 로그아웃하세요.",
  },
  "account.signOut.retry": "다시 시도",
  "account.signOut.backup": "백업 다운로드",
  "account.signOut.anyway": "그래도 로그아웃",
  "account.signOut.photos": {
    other: "이 기기에 진행 사진이 {count}장 있어요. 사진은 기기 밖으로 나가지 않아서 로그아웃하면 영구 삭제돼요.",
  },
  "account.signOut.photosConfirm": "로그아웃하고 사진 삭제",
  "account.delete": "계정 삭제",
  "account.delete.warn":
    "계정과 서버에 있는 데이터 사본이 영구 삭제돼요. 이 기기는 자체 사본을 유지해요. 다른 기기는 로그아웃되고 각자의 사본을 유지해요.",
  "account.delete.confirm": "계정 영구 삭제",
  "account.lost": "로그아웃되어 이 기기의 동기화가 멈췄어요. 데이터는 그대로 있어요. 동기화를 계속하려면 다시 로그인하세요.",
  "account.offline": "오프라인 상태예요. 연결한 뒤 다시 시도하세요.",
  "account.notReady": "계정 기능이 아직 켜지지 않았어요. 데이터는 이 기기에 안전하게 있어요.",
  "account.failed": "잘 안 됐어요. 다시 시도하세요.",
  "account.what": "동기화되는 항목",
  "account.what.body":
    "운동, 세트, 메모, 체중, 헬스장, 루틴, 설정, 그리고 사용한다면 건강 측정값, 부상, 생리 주기 기록까지요. 내 데이터이니 광고나 분석에 절대 쓰이지 않아요. 진행 사진은 이 기기 밖으로 나가지 않아요.",
  "account.row": "계정 및 동기화",
  "account.row.out": "로그인해서 백업 및 동기화",
  "account.row.in": "{email}(으)로 로그인됨",
  "account.delete.webSub": "웹사이트에서 구독한 Pro도 지금 종료되며 더 이상 결제되지 않아요.",
  "account.signOut.backupPhotos": "사진 포함 백업 저장",
};

export const tr: Partial<Record<Key, Message>> = {
  "account.title": "Hesap ve eşitleme",
  "account.lead":
    "Antrenmanlarını yedeklemek ve tüm cihazlarında kullanmak için giriş yap: telefon, tablet ve web. İsteğe bağlı; her şey bu cihazda da kalır.",
  "account.leadIn":
    "Antrenmanların, salonların ve ayarların internete bağlı olduğun her an hesabınla eşitlenir; böylece güvende kalır ve giriş yaptığın her cihazda olur.",
  "account.signIn": "Giriş yap",
  "account.yours": "Hesabın",
  "account.apple": "Apple ile devam et",
  "account.google": "Google ile devam et",
  "account.emailButton": "E-posta ile devam et",
  "account.agree": "Giriş yaparak kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.",
  "account.emailNote":
    "Giriş yapınca birkaç e-posta da açılır: antrenman hatırlatıcıları, haftalık özetin ve ipuçları. Hepsini Ayarlar'dan ya da her e-postadaki bağlantıdan kapatabilirsin.",
  "account.terms": "Kullanım koşulları",
  "account.privacy": "Gizlilik politikası",
  "account.email.label": "E-posta adresin",
  "account.email.send": "Bana kod gönder",
  "account.email.sent": "{email} adresine altı haneli bir kod gönderdik. 10 dakika geçerli.",
  "account.email.code": "Kod",
  "account.email.verify": "Giriş yap",
  "account.email.again": "Başka bir e-posta kullan",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "e-posta",
  "account.as": "{email} olarak {via} ile giriş yapıldı.",
  "account.asNoEmail": "{via} ile giriş yapıldı.",
  "account.syncing": "Eşitleniyor…",
  "account.synced": "Eşitlendi: {when}.",
  "account.justNow": "az önce",
  "account.notSynced": "Henüz eşitlenmedi. İnternete bağlanınca eşitlenir.",
  "account.waiting": {
    one: "{count} değişiklik eşitlenmeyi bekliyor.",
    other: "{count} değişiklik eşitlenmeyi bekliyor.",
  },
  "account.syncError": "Sunucuya ulaşılamadı. İnternete bağlanınca yeniden denenecek.",
  "account.syncFull":
    "Hesabının eşitleme alanı dolu, bu yüzden yeni değişiklikler bu cihazda kalıyor. Buradaki her şey güvende. Ayarlar'daki Geri bildirim gönder ile bize haber ver.",
  "account.syncNow": "Şimdi eşitle",
  "account.signOut": "Çıkış yap",
  "account.signOutNote":
    "Çıkış yapınca değişikliklerin hesabına kaydedilir, ardından verilerin bu cihazdan silinir; böylece sonraki kişi hiçbirini görmez. Hepsini geri almak için yeniden giriş yap.",
  "account.signingOut": "Değişikliklerin kaydediliyor…",
  "account.ended": {
    one: "Oturumun kapatıldı ve bu cihazdaki {count} değişiklik hesabına hiç ulaşmadı. Kaydetmek için yeniden giriş yap, bir yedek indir ya da bu cihazdan sil.",
    other:
      "Oturumun kapatıldı ve bu cihazdaki {count} değişiklik hesabına hiç ulaşmadı. Kaydetmek için yeniden giriş yap, bir yedek indir ya da bu cihazdan sil.",
  },
  "account.ended.erase": "Verilerimi bu cihazdan sil",
  "account.signOut.unsynced": {
    one: "{count} değişiklik henüz hesabına ulaşmadı, şimdi çıkış yaparsan silinir. İnternete bağlanınca yeniden dene, önce bir yedek indir ya da yine de çıkış yap.",
    other:
      "{count} değişiklik henüz hesabına ulaşmadı, şimdi çıkış yaparsan silinir. İnternete bağlanınca yeniden dene, önce bir yedek indir ya da yine de çıkış yap.",
  },
  "account.signOut.retry": "Yeniden dene",
  "account.signOut.backup": "Yedek indir",
  "account.signOut.anyway": "Yine de çıkış yap",
  "account.signOut.photos": {
    one: "Bu cihazda {count} gelişim fotoğrafın var. Fotoğraflar cihazdan hiç çıkmaz, bu yüzden çıkış yapmak onu kalıcı olarak siler.",
    other: "Bu cihazda {count} gelişim fotoğrafın var. Fotoğraflar cihazdan hiç çıkmaz, bu yüzden çıkış yapmak onları kalıcı olarak siler.",
  },
  "account.signOut.photosConfirm": "Çıkış yap ve fotoğrafları sil",
  "account.delete": "Hesabımı sil",
  "account.delete.warn":
    "Bu işlem hesabını ve sunucumuzdaki veri kopyanı kalıcı olarak siler. Bu cihaz kendi kopyasını tutar. Diğer cihazlarında oturum kapanır, onlar da kendi kopyalarını tutar.",
  "account.delete.confirm": "Hesabımı kalıcı olarak sil",
  "account.lost":
    "Oturumun kapatıldı, bu yüzden bu cihaz eşitlemeyi durdurdu. Verilerin hâlâ burada. Eşitlemeye devam etmek için yeniden giriş yap.",
  "account.offline": "Çevrimdışısın. Bağlan ve yeniden dene.",
  "account.notReady": "Hesaplar henüz açık değil. Verilerin bu cihazda güvende.",
  "account.failed": "Olmadı. Yeniden dene.",
  "account.what": "Neler eşitlenir",
  "account.what.body":
    "Antrenmanların, setlerin, notların, vücut ağırlığın, salonların, rutinlerin ve ayarların; kullanıyorsan sağlık ölçümleri, sakatlıklar ve döngü kayıtları da. Bunlar senin verilerin: asla reklam ya da analiz için kullanılmaz. Gelişim fotoğrafları bu cihazdan hiç çıkmaz.",
  "account.row": "Hesap ve eşitleme",
  "account.row.out": "Yedeklemek ve eşitlemek için giriş yap",
  "account.row.in": "{email} olarak giriş yapıldı",
  "account.delete.webSub": "Web sitesinden aldığın Pro aboneliğin de şimdi sona erer ve bir daha ücret alınmaz.",
  "account.signOut.backupPhotos": "Fotoğraflarla birlikte yedek kaydet",
};

export const pl: Partial<Record<Key, Message>> = {
  "account.title": "Konto i synchronizacja",
  "account.lead":
    "Zaloguj się, by mieć kopię zapasową treningów i korzystać z nich na wszystkich urządzeniach: telefonie, tablecie i w przeglądarce. To opcjonalne, a wszystko zostaje też na tym urządzeniu.",
  "account.leadIn":
    "Twoje treningi, siłownie i ustawienia synchronizują się z kontem, gdy masz internet, więc są bezpieczne i dostępne na każdym urządzeniu, na którym się zalogujesz.",
  "account.signIn": "Zaloguj się",
  "account.yours": "Twoje konto",
  "account.apple": "Kontynuuj z Apple",
  "account.google": "Kontynuuj z Google",
  "account.emailButton": "Kontynuuj przez e-mail",
  "account.agree": "Logując się, akceptujesz warunki korzystania i politykę prywatności.",
  "account.emailNote":
    "Logowanie włącza też kilka e-maili: przypomnienia o treningu, cotygodniowe podsumowanie i porady. Każdy z nich wyłączysz w Ustawieniach lub linkiem w e-mailu.",
  "account.terms": "Warunki korzystania",
  "account.privacy": "Polityka prywatności",
  "account.email.label": "Twój e-mail",
  "account.email.send": "Wyślij mi kod",
  "account.email.sent": "Wysłaliśmy sześciocyfrowy kod na {email}. Jest ważny 10 minut.",
  "account.email.code": "Kod",
  "account.email.verify": "Zaloguj się",
  "account.email.again": "Użyj innego e-maila",
  "account.via.google": "Google",
  "account.via.apple": "Apple",
  "account.via.email": "e-mail",
  "account.as": "Zalogowano jako {email} przez {via}.",
  "account.asNoEmail": "Zalogowano przez {via}.",
  "account.syncing": "Synchronizacja…",
  "account.synced": "Zsynchronizowano {when}.",
  "account.justNow": "przed chwilą",
  "account.notSynced": "Jeszcze nie zsynchronizowano. Synchronizacja nastąpi, gdy będziesz online.",
  "account.waiting": {
    one: "{count} zmiana czeka na synchronizację.",
    few: "{count} zmiany czekają na synchronizację.",
    many: "{count} zmian czeka na synchronizację.",
    other: "{count} zmiany czeka na synchronizację.",
  },
  "account.syncError": "Nie udało się połączyć z serwerem. Spróbujemy ponownie, gdy będziesz online.",
  "account.syncFull":
    "Miejsce na synchronizację na Twoim koncie jest pełne, więc nowe zmiany zostają na tym urządzeniu. Wszystko tutaj jest bezpieczne. Daj nam znać przez Wyślij opinię w Ustawieniach.",
  "account.syncNow": "Synchronizuj teraz",
  "account.signOut": "Wyloguj się",
  "account.signOutNote":
    "Wylogowanie zapisuje Twoje zmiany na koncie, a potem usuwa dane z tego urządzenia, więc następna osoba niczego nie zobaczy. Zaloguj się ponownie, by wszystko odzyskać.",
  "account.signingOut": "Zapisuję Twoje zmiany…",
  "account.ended": {
    one: "Wylogowano Cię, a {count} zmiana na tym urządzeniu nie trafiła na Twoje konto. Zaloguj się ponownie, by ją zapisać, pobierz kopię zapasową albo usuń ją z tego urządzenia.",
    few: "Wylogowano Cię, a {count} zmiany na tym urządzeniu nie trafiły na Twoje konto. Zaloguj się ponownie, by je zapisać, pobierz kopię zapasową albo usuń je z tego urządzenia.",
    many: "Wylogowano Cię, a {count} zmian na tym urządzeniu nie trafiło na Twoje konto. Zaloguj się ponownie, by je zapisać, pobierz kopię zapasową albo usuń je z tego urządzenia.",
    other:
      "Wylogowano Cię, a {count} zmiany na tym urządzeniu nie trafiło na Twoje konto. Zaloguj się ponownie, by je zapisać, pobierz kopię zapasową albo usuń je z tego urządzenia.",
  },
  "account.ended.erase": "Usuń moje dane z tego urządzenia",
  "account.signOut.unsynced": {
    one: "{count} zmiana nie trafiła jeszcze na Twoje konto, więc wylogowanie teraz by ją usunęło. Spróbuj ponownie, gdy będziesz online, najpierw pobierz kopię zapasową albo i tak się wyloguj.",
    few: "{count} zmiany nie trafiły jeszcze na Twoje konto, więc wylogowanie teraz by je usunęło. Spróbuj ponownie, gdy będziesz online, najpierw pobierz kopię zapasową albo i tak się wyloguj.",
    many: "{count} zmian nie trafiło jeszcze na Twoje konto, więc wylogowanie teraz by je usunęło. Spróbuj ponownie, gdy będziesz online, najpierw pobierz kopię zapasową albo i tak się wyloguj.",
    other:
      "{count} zmiany nie trafiło jeszcze na Twoje konto, więc wylogowanie teraz by je usunęło. Spróbuj ponownie, gdy będziesz online, najpierw pobierz kopię zapasową albo i tak się wyloguj.",
  },
  "account.signOut.retry": "Spróbuj ponownie",
  "account.signOut.backup": "Pobierz kopię zapasową",
  "account.signOut.anyway": "Wyloguj mimo to",
  "account.signOut.photos": {
    one: "Masz na tym urządzeniu {count} zdjęcie postępów. Zdjęcia nigdy go nie opuszczają, więc wylogowanie usunie je na zawsze.",
    few: "Masz na tym urządzeniu {count} zdjęcia postępów. Zdjęcia nigdy go nie opuszczają, więc wylogowanie usunie je na zawsze.",
    many: "Masz na tym urządzeniu {count} zdjęć postępów. Zdjęcia nigdy go nie opuszczają, więc wylogowanie usunie je na zawsze.",
    other: "Masz na tym urządzeniu {count} zdjęcia postępów. Zdjęcia nigdy go nie opuszczają, więc wylogowanie usunie je na zawsze.",
  },
  "account.signOut.photosConfirm": "Wyloguj i usuń zdjęcia",
  "account.delete": "Usuń moje konto",
  "account.delete.warn":
    "To na zawsze usuwa Twoje konto i kopię Twoich danych na naszym serwerze. To urządzenie zachowuje własną kopię. Twoje inne urządzenia zostaną wylogowane i zachowają swoje.",
  "account.delete.confirm": "Usuń moje konto na zawsze",
  "account.lost":
    "Wylogowano Cię, więc to urządzenie przestało się synchronizować. Twoje dane wciąż tu są. Zaloguj się ponownie, by dalej synchronizować.",
  "account.offline": "Nie masz internetu. Połącz się i spróbuj ponownie.",
  "account.notReady": "Konta nie są jeszcze włączone. Twoje dane są bezpieczne na tym urządzeniu.",
  "account.failed": "Nie udało się. Spróbuj ponownie.",
  "account.what": "Co się synchronizuje",
  "account.what.body":
    "Twoje treningi, serie, notatki, masa ciała, siłownie, plany i ustawienia, a także odczyty zdrowotne, kontuzje i zapisy cyklu, jeśli z nich korzystasz. To Twoje dane: nigdy nie służą do reklam ani analityki. Zdjęcia postępów nigdy nie opuszczają tego urządzenia.",
  "account.row": "Konto i synchronizacja",
  "account.row.out": "Zaloguj się, by mieć kopię i synchronizację",
  "account.row.in": "Zalogowano jako {email}",
  "account.delete.webSub": "Twoja subskrypcja Pro ze strony internetowej też kończy się teraz i nie zostanie ponownie obciążona.",
  "account.signOut.backupPhotos": "Zapisz kopię ze zdjęciami",
};
