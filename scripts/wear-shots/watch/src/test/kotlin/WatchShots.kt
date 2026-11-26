package com.getliftsmith.app.wear

import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.TextView
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import org.junit.Rule
import org.junit.Test

// The Wear OS app's screen for the email pictures (scripts/email-watch.mjs): the watch's own layout, strings and
// drawables (android/wear/src/main/res) drawn by Android's renderer, Paparazzi, on a 454 px round watch, in every
// language, filled in the way WorkoutActivity.render() does. Not part of the app's build or CI:
//   cd scripts/wear-shots && echo "sdk.dir=$ANDROID_HOME" > local.properties && gradle :watch:recordPaparazziDebug
//
// What the phone sends (sessionAhead.ts sessionFields), worked out with the app's own catalogues on 2026-11-26 for
// set 2 of 4 of a barbell bench press (workout.setOf, the exercise name, workout.restTitle, setText and plateText):
// 185 lb with a pound gym in English, 80 kg elsewhere. Re-derive them if those words change.
data class Phone(val setLabel: String, val name: String, val restTitle: String, val next: String, val plates: String)

val PHONE = mapOf(
    "en" to Phone("Set 2 of 4", "Barbell bench press", "Rest · Barbell bench press", "185 lb × 8 reps", "Each side: 45 + 25 lb"),
    "es" to Phone("Serie 2 de 4", "Press de banca con barra", "Descanso · Press de banca con barra", "80 kg × 8 reps", "Cada lado: 25 + 5 kg"),
    "fr" to Phone("Série 2 sur 4", "Développé couché à la barre", "Repos · Développé couché à la barre", "80 kg × 8 rép.", "Chaque côté : 25 + 5 kg"),
    "de" to Phone("Satz 2 von 4", "Bankdrücken mit Langhantel", "Pause · Bankdrücken mit Langhantel", "80 kg × 8 Wdh.", "Pro Seite: 25 + 5 kg"),
    "it" to Phone("Serie 2 di 4", "Panca piana con bilanciere", "Riposo · Panca piana con bilanciere", "80 kg × 8 rip.", "Per lato: 25 + 5 kg"),
    "ja" to Phone("2/4セット目", "バーベルベンチプレス", "休憩 · バーベルベンチプレス", "80 kg × 8回", "片側：25 + 5 kg"),
    "pt" to Phone("Série 2 de 4", "Supino reto com barra", "Descanso · Supino reto com barra", "80 kg × 8 reps", "Cada lado: 25 + 5 kg"),
    "ko" to Phone("4세트 중 2세트", "바벨 벤치 프레스", "휴식 · 바벨 벤치 프레스", "80 kg × 8회", "한쪽에: 25 + 5 kg"),
    "pl" to Phone("Seria 2 z 4", "Wyciskanie sztangi na ławce poziomej", "Przerwa · Wyciskanie sztangi na ławce poziomej", "80 kg × 8 powtórzeń", "Na stronę: 25 + 5 kg"),
    "tr" to Phone("Set 2 / 4", "Barbell bench press", "Dinlenme · Barbell bench press", "80 kg × 8 tekrar", "Her taraf: 25 + 5 kg")
)

class WatchShots {
  @get:Rule val paparazzi = Paparazzi(deviceConfig = DeviceConfig.GALAXY_WATCH4_CLASSIC_LARGE, theme = "android:Theme.DeviceDefault", showSystemUi = false)

  @Test fun shots() {
    for ((lang, p) in PHONE) {
      paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.GALAXY_WATCH4_CLASSIC_LARGE.copy(locale = lang))
      for (state in listOf("set", "rest", "start")) {
        val root = LayoutInflater.from(paparazzi.context).inflate(R.layout.activity_workout, null)
        root.setBackgroundColor(paparazzi.context.getColor(R.color.bg))
        val ctx = root.context
        val set = root.findViewById<TextView>(R.id.set); val title = root.findViewById<TextView>(R.id.title)
        val big = root.findViewById<TextView>(R.id.big); val sub = root.findViewById<TextView>(R.id.sub)
        val hr = root.findViewById<TextView>(R.id.hr); val log = root.findViewById<Button>(R.id.log)
        val add = root.findViewById<Button>(R.id.add); val phone = root.findViewById<Button>(R.id.phone)
        // The same steps as WorkoutActivity.render() for each state.
        when (state) {
          "start" -> {
            set.visibility = View.GONE; big.visibility = View.GONE; hr.visibility = View.GONE
            log.visibility = View.GONE; add.visibility = View.GONE
            title.setText(R.string.none_title); sub.setText(R.string.none_body)
            phone.setText(R.string.start_on_phone); phone.visibility = View.VISIBLE
          }
          else -> {
            val resting = state == "rest"
            set.text = p.setLabel
            title.text = if (resting) p.restTitle else p.name
            big.text = if (resting) "1:24" else p.next
            sub.text = if (resting) ctx.getString(R.string.up_next, p.next) else p.plates
            hr.text = ctx.getString(R.string.bpm, if (resting) 118 else 134)
            add.visibility = if (resting) View.VISIBLE else View.GONE
          }
        }
        paparazzi.snapshot(root, "$lang-$state")
      }
    }
  }
}
