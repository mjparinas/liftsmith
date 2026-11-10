import type { Message } from "@/lib/i18n";

// Text for keys starting "a11y.", in every language. English is the source: add a key here first,
// then its Spanish and French. A missing translation falls back to English.

export const en = {
  "a11y.hand": "One-handed controls",
  "a11y.hand.right": "Right hand",
  "a11y.hand.left": "Left hand",
  "a11y.hand.note":
    "During a workout, the weight and rep buttons move down next to Log set, with Log set under the thumb of the hand holding the phone. Hold a + or − button to keep changing.",
  "a11y.text": "Text size",
  "a11y.text.system": "Match my phone",
  "a11y.text.100": "Default",
  "a11y.text.115": "Large",
  "a11y.text.130": "Larger",
  "a11y.text.150": "Largest",
  "a11y.text.note": "Match my phone follows the text size in your phone's settings. Every screen reflows to fit larger text.",
  "a11y.colours": "Colours",
  "a11y.colours.standard": "Standard",
  "a11y.colours.cvd": "Colour-blind safe",
  "a11y.colours.note":
    "Colour-blind safe uses blue, orange and pink instead of green, amber and red for recovery and status, so they stay apart with red-green or blue-yellow colour blindness. The recovery map also marks recovering muscles with dots and fatigued ones with stripes.",
  "a11y.contrast": "Contrast",
  "a11y.contrast.more": "More",
  "a11y.contrast.note":
    "More makes secondary text and outlines stronger and removes background glows. For less motion, use Lean mode below or your phone's reduce motion setting.",
} as const;

type Key = keyof typeof en;

export const es: Partial<Record<Key, Message>> = {
  "a11y.hand": "Controles a una mano",
  "a11y.hand.right": "Mano derecha",
  "a11y.hand.left": "Mano izquierda",
  "a11y.hand.note":
    "Durante el entrenamiento, los botones de peso y repeticiones bajan junto a Registrar serie, con Registrar serie bajo el pulgar de la mano que sujeta el teléfono. Mantén pulsado + o − para seguir cambiando.",
  "a11y.text": "Tamaño del texto",
  "a11y.text.system": "Igual que el teléfono",
  "a11y.text.100": "Normal",
  "a11y.text.115": "Grande",
  "a11y.text.130": "Más grande",
  "a11y.text.150": "El más grande",
  "a11y.text.note":
    "«Igual que el teléfono» usa el tamaño de texto de los ajustes del teléfono. Todas las pantallas se adaptan al texto más grande.",
  "a11y.colours": "Colores",
  "a11y.colours.standard": "Estándar",
  "a11y.colours.cvd": "Aptos para daltonismo",
  "a11y.colours.note":
    "«Aptos para daltonismo» usa azul, naranja y rosa en lugar de verde, ámbar y rojo para la recuperación y los estados, para que se distingan con daltonismo rojo-verde o azul-amarillo. El mapa de recuperación marca además con puntos los músculos que se recuperan y con rayas los fatigados.",
  "a11y.contrast": "Contraste",
  "a11y.contrast.more": "Más",
  "a11y.contrast.note":
    "«Más» refuerza el texto secundario y los contornos y quita los brillos de fondo. Para menos movimiento, usa el modo sobrio más abajo o la opción de reducir movimiento del teléfono.",
};

export const fr: Partial<Record<Key, Message>> = {
  "a11y.hand": "Commandes à une main",
  "a11y.hand.right": "Main droite",
  "a11y.hand.left": "Main gauche",
  "a11y.hand.note":
    "Pendant la séance, les boutons de charge et de répétitions descendent à côté de Enregistrer la série, sous le pouce de la main qui tient le téléphone. Maintenez + ou − pour continuer à changer.",
  "a11y.text": "Taille du texte",
  "a11y.text.system": "Comme mon téléphone",
  "a11y.text.100": "Par défaut",
  "a11y.text.115": "Grand",
  "a11y.text.130": "Plus grand",
  "a11y.text.150": "Très grand",
  "a11y.text.note":
    "« Comme mon téléphone » suit la taille du texte réglée sur votre téléphone. Chaque écran s’adapte au texte plus grand.",
  "a11y.colours": "Couleurs",
  "a11y.colours.standard": "Standard",
  "a11y.colours.cvd": "Adaptées au daltonisme",
  "a11y.colours.note":
    "« Adaptées au daltonisme » utilise le bleu, l’orange et le rose au lieu du vert, de l’ambre et du rouge pour la récupération et les états, afin qu’ils restent distincts en cas de daltonisme rouge-vert ou bleu-jaune. La carte de récupération marque aussi de points les muscles en récupération et de rayures les muscles fatigués.",
  "a11y.contrast": "Contraste",
  "a11y.contrast.more": "Renforcé",
  "a11y.contrast.note":
    "« Renforcé » accentue le texte secondaire et les contours et retire les halos d’arrière-plan. Pour moins d’animations, utilisez le mode sobre plus bas ou l’option Réduire les animations du téléphone.",
};
