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
  "account.signOutNote": "Signing out keeps everything on this device. It just stops syncing.",
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
  "account.setup": "Already use Liftsmith? Sign in",
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
  "account.signOutNote": "Al cerrar sesión todo se queda en este dispositivo. Solo deja de sincronizarse.",
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
  "account.setup": "¿Ya usas Liftsmith? Inicia sesión",
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
  "account.signOutNote": "Se déconnecter garde tout sur cet appareil. La synchronisation s'arrête, c'est tout.",
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
  "account.setup": "Vous utilisez déjà Liftsmith ? Connectez-vous",
};
