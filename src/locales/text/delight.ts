import type { Message } from "@/lib/i18n";

// Text for keys starting "delight.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "delight.voice": "Voice coach",
  "delight.voiceHint":
    "Spoken cues between sets: the next weight and reps, the last set, ten seconds left, and new bests. Music dips while it talks.",
  "delight.ghost": "Ghost mode",
  "delight.ghostHint": "Race your last session of each exercise: its weights, reps and rests show on the rest timer.",
  "delight.plates": "Smart plate memory",
  "delight.platesHint": "Between sets, show only the plates to add or take off.",
  "delight.rest": "While you rest",
  "delight.breathe": "Breathing guide",
  "delight.game": "Plate math game",
  "delight.neither": "Neither",
  "delight.themes": "Themes",
  "delight.lightNote": "With Appearance set to light, a theme changes the accent colour only.",
  "delight.icon": "App icon",
  "delight.iconLocked": "{name}: {how} to unlock.",
  "delight.iconDone": "Done. On Android the home screen updates once you leave the app.",
  "delight.iconFailed": "Couldn't change the icon on this phone.",
  "delight.classic": "Classic",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "delight.voice": "Entrenador por voz",
  "delight.voiceHint":
    "Indicaciones habladas entre series: el siguiente peso y repeticiones, la última serie, los últimos diez segundos y los nuevos récords. La música baja mientras habla.",
  "delight.ghost": "Modo fantasma",
  "delight.ghostHint": "Compite con tu última sesión de cada ejercicio: sus pesos, repeticiones y descansos aparecen en el temporizador.",
  "delight.plates": "Memoria de discos",
  "delight.platesHint": "Entre series, muestra solo los discos que hay que poner o quitar.",
  "delight.rest": "Mientras descansas",
  "delight.breathe": "Guía de respiración",
  "delight.game": "Juego de cálculo de discos",
  "delight.neither": "Ninguno",
  "delight.themes": "Temas",
  "delight.lightNote": "Con la apariencia en claro, un tema solo cambia el color de acento.",
  "delight.icon": "Icono de la app",
  "delight.iconLocked": "{name}: {how} para desbloquearlo.",
  "delight.iconDone": "Hecho. En Android, la pantalla de inicio se actualiza al salir de la app.",
  "delight.iconFailed": "No se pudo cambiar el icono en este teléfono.",
  "delight.classic": "Clásico",
};

export const fr: Partial<Record<Key, Message>> = {
  "delight.voice": "Coach vocal",
  "delight.voiceHint":
    "Des indications parlées entre les séries : le prochain poids et les répétitions, la dernière série, les dix dernières secondes et les nouveaux records. La musique baisse pendant qu’il parle.",
  "delight.ghost": "Mode fantôme",
  "delight.ghostHint": "Affrontez votre dernière séance de chaque exercice : ses poids, répétitions et repos s’affichent sur le minuteur.",
  "delight.plates": "Mémoire des disques",
  "delight.platesHint": "Entre les séries, n’affiche que les disques à ajouter ou à retirer.",
  "delight.rest": "Pendant le repos",
  "delight.breathe": "Guide de respiration",
  "delight.game": "Jeu de calcul des disques",
  "delight.neither": "Aucun",
  "delight.themes": "Thèmes",
  "delight.lightNote": "Avec l’apparence en clair, un thème ne change que la couleur d’accent.",
  "delight.icon": "Icône de l’app",
  "delight.iconLocked": "{name} : {how} pour la débloquer.",
  "delight.iconDone": "C’est fait. Sur Android, l’écran d’accueil se met à jour quand vous quittez l’app.",
  "delight.iconFailed": "Impossible de changer l’icône sur ce téléphone.",
  "delight.classic": "Classique",
};
