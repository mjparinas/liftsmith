# Google Play promotional content: training seasons

Generated from `store/play/promotions/events.json` by `node scripts/play-promotions.mjs --doc`. Edit the JSON, not this page. Decisions are in [Play promotional content](decisions/play-promotions.md).

One Play event for each training season's start (its first four weeks) and one for its finale week, when every point counts twice ([Training seasons](decisions/seasons.md)). Season 1, Ember, started on 23 November 2026, before this plan, so it gets only its finale. Add each in Play Console › Grow users › **Promotional content** › Create promotional content › **Time-limited event**, with the English text as the default and the other nine under Manage translations:

| Text | Play languages |
| --- | --- |
| English (default) | English (United States) en-US, the default |
| Español | es-ES, es-419, es-US |
| Français | fr-FR, fr-CA |
| Deutsch | de-DE |
| Italiano | it-IT |
| 日本語 | ja-JP |
| Português (Brasil) | pt-BR, pt-PT |
| 한국어 | ko-KR |
| Polski | pl-PL |
| Türkçe | tr-TR |

Submit each one by its date, two weeks ahead, so it can be featured (Play needs at least 24 hours, and recommends at least four days). Only one promotional item can run at a time; these never overlap. Times are UTC: a season starts on each lifter's own Monday, so an event starts at noon UTC on that Monday, when it's Monday nearly everywhere.

Play's rules, which `src/lib/playPromotions.test.ts` checks: a tagline of 80 characters at most (48, or 23 in Japanese and Korean, to also fit the spotlight format), a description of 100 to 500 with no bullets, line breaks, HTML or call to action, no ranking or award claims, no prices, no other apps' names, and no emoji. The images have no text, logo or anything that looks like a button, and keep the figure inside the safe zone. Every event says that seasons open after a lifter's fifth workout ([Features that unlock as you train](decisions/unlocks.md)), so nobody who installs from it expects to see the season on day one.

## Schedule

| Event | What | Submit by | Starts | Ends |
| --- | --- | --- | --- | --- |
| s1-finale | Finale week | 2027-01-11 | 2027-01-25 12:00 UTC | 2027-02-01 00:00 UTC |
| s2-launch | Season start | 2027-01-18 | 2027-02-01 12:00 UTC | 2027-02-28 23:00 UTC |
| s2-finale | Finale week | 2027-03-22 | 2027-04-05 12:00 UTC | 2027-04-12 00:00 UTC |
| s3-launch | Season start | 2027-03-29 | 2027-04-12 12:00 UTC | 2027-05-09 23:00 UTC |
| s3-finale | Finale week | 2027-05-31 | 2027-06-14 12:00 UTC | 2027-06-21 00:00 UTC |
| s4-launch | Season start | 2027-06-07 | 2027-06-21 12:00 UTC | 2027-07-18 23:00 UTC |
| s4-finale | Finale week | 2027-08-09 | 2027-08-23 12:00 UTC | 2027-08-30 00:00 UTC |
| s5-launch | Season start | 2027-08-16 | 2027-08-30 12:00 UTC | 2027-09-26 23:00 UTC |
| s5-finale | Finale week | 2027-10-18 | 2027-11-01 12:00 UTC | 2027-11-08 00:00 UTC |
| s6-launch | Season start | 2027-10-25 | 2027-11-08 12:00 UTC | 2027-12-05 23:00 UTC |
| s6-finale | Finale week | 2027-12-27 | 2028-01-10 12:00 UTC | 2028-01-17 00:00 UTC |

## Events

### s1-finale: Season 1: Ember — the finale counts double

- Type: Time-limited event
- Starts 2027-01-25 12:00 UTC, ends 2027-02-01 00:00 UTC. Submit by 2027-01-11.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/ember-finale.png`

#### English (default)

Tagline (42/80): **Season 1: Ember — the finale counts double**

Description (374/500):

```text
The season's last week counts double. Meet your own weekly goal and every training day earns twice the points, toward the last tiers of badges, avatars and a theme with its own app icon, yours to keep after the season ends. Days past your goal still add nothing, so rest stays in the plan. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (42/80): **Temporada 1: Brasa — la final cuenta doble**

Description (424/500):

```text
La última semana de la temporada cuenta doble. Cumple tu propio objetivo semanal y cada día de entreno da el doble de puntos, hacia los últimos niveles de insignias, avatares y un tema con su propio icono de app, tuyos cuando la temporada termine. Los días de más siguen sin sumar, así que el descanso sigue en el plan. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (43/80): **Saison 1 : Braise — la finale compte double**

Description (458/500):

```text
La dernière semaine de la saison compte double. Atteignez votre objectif hebdomadaire et chaque jour d'entraînement rapporte deux fois plus de points, vers les derniers paliers de badges, d'avatars et d'un thème avec sa propre icône d'app, à garder après la saison. Les jours en plus ne rapportent toujours rien : le repos reste dans le plan. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (41/80): **Saison 1: Glut — das Finale zählt doppelt**

Description (430/500):

```text
Die letzte Woche der Saison zählt doppelt. Erreiche dein Wochenziel, und jeder Trainingstag bringt doppelt so viele Punkte, für die letzten Stufen mit Abzeichen, Avataren und einem Theme mit eigenem App-Symbol, die du nach der Saison behältst. Tage über dem Ziel bringen weiterhin nichts, also bleibt die Pause im Plan. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (41/80): **Stagione 1: Brace — la finale vale doppio**

Description (424/500):

```text
L'ultima settimana della stagione vale doppio. Raggiungi il tuo obiettivo settimanale e ogni giorno di allenamento dà il doppio dei punti, verso gli ultimi livelli di badge, avatar e un tema con la sua icona dell'app, tuoi anche dopo la stagione. I giorni in più non danno punti, quindi il riposo resta nel piano. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (18/80): **シーズン1:エンバー — 最終週2倍**

Description (201/500):

```text
シーズン最後の1週間はポイントが2倍です。自分の週の目標を達成すると、トレーニングした日ごとのポイントが2倍になり、バッジ、アバター、専用アプリアイコン付きテーマの最後のティアに近づけます。獲得した報酬はシーズン終了後も残ります。目標を超えた日は引き続き加算されないので、休養も計画のうちです。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (42/80): **Temporada 1: Brasa — a final vale em dobro**

Description (425/500):

```text
A última semana da temporada vale em dobro. Bata sua própria meta semanal e cada dia de treino dá o dobro de pontos, rumo aos últimos níveis de medalhas, avatares e um tema com o próprio ícone do app, que ficam com você depois da temporada. Dias além da meta continuam sem somar, então o descanso segue no plano. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (20/80): **시즌 1: 엠버 — 마지막 주 두 배**

Description (211/500):

```text
시즌의 마지막 주는 포인트가 두 배예요. 내 주간 목표를 달성하면 운동한 날마다 포인트를 두 배로 받아, 배지, 아바타, 전용 앱 아이콘이 있는 테마의 마지막 단계에 다가가요. 얻은 보상은 시즌이 끝나도 계속 내 거예요. 목표를 넘긴 날은 여전히 더해지지 않으니 휴식도 계획의 일부예요. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (40/80): **Sezon 1: Żar — finał liczy się podwójnie**

Description (405/500):

```text
Ostatni tydzień sezonu liczy się podwójnie. Osiągnij własny cel tygodniowy, a każdy dzień treningu da dwa razy więcej punktów, w stronę ostatnich poziomów odznak, awatarów i motywu z własną ikoną aplikacji, które zostaną z tobą po sezonie. Dni ponad cel dalej nic nie dają, więc odpoczynek zostaje w planie. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (36/80): **Sezon 1: Kor — final haftası iki kat**

Description (417/500):

```text
Sezonun son haftası iki kat sayılır. Kendi haftalık hedefini tutturduğunda her antrenman günü iki kat puan getirir ve sezon bitince de sende kalacak rozetlerin, avatarların ve kendi uygulama simgesi olan temanın son kademelerine yaklaşırsın. Hedefin üstündeki günler yine puan getirmez, yani dinlenmek planda kalır. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s2-launch: Season 2: Tempest — ten weeks of new rewards

- Type: Time-limited event
- Starts 2027-02-01 12:00 UTC, ends 2027-02-28 23:00 UTC. Submit by 2027-01-18.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/tempest-launch.png`

#### English (default)

Tagline (44/80): **Season 2: Tempest — ten weeks of new rewards**

Description (385/500):

```text
Ten weeks, 20 tiers and rewards you can only earn this season: badges, avatars and a theme with its own app icon. Points come from training toward your own weekly goal, never past it. Challenges: Meet your weekly goal 4 weeks in a row. Set a new best on 4 different exercises. Finish 8 weekly quests. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (43/80): **Temporada 2: Tempestad — nuevas recompensas**

Description (428/500):

```text
Diez semanas, 20 niveles y recompensas que solo puedes ganar esta temporada: insignias, avatares y un tema con su propio icono de app. Los puntos siguen tu objetivo semanal, nunca más allá. Retos: Cumple tu objetivo semanal 4 semanas seguidas. Logra una nueva marca en 4 ejercicios distintos. Completa 8 misiones semanales. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (42/80): **Saison 2 : Tempête — nouvelles récompenses**

Description (446/500):

```text
Dix semaines, 20 paliers et des récompenses à gagner seulement cette saison : badges, avatars et un thème avec sa propre icône d'app. Les points suivent votre objectif hebdomadaire, jamais au-delà. Défis : Atteignez votre objectif 4 semaines d'affilée. Battez un record sur 4 exercices différents. Terminez 8 quêtes de la semaine. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (44/80): **Saison 2: Sturm — 10 Wochen neue Belohnungen**

Description (462/500):

```text
Zehn Wochen, 20 Stufen und Belohnungen, die es nur in dieser Saison gibt: Abzeichen, Avatare und ein Theme mit eigenem App-Symbol. Punkte gibt es fürs Training bis zu deinem Wochenziel, nie darüber hinaus. Challenges: Erreiche dein Wochenziel 4 Wochen in Folge. Stell in 4 verschiedenen Übungen eine neue Bestleistung auf. Schließ 8 Wochenaufgaben ab. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (39/80): **Stagione 2: Tempesta — nuove ricompense**

Description (451/500):

```text
Dieci settimane, 20 livelli e ricompense che puoi ottenere solo in questa stagione: badge, avatar e un tema con la sua icona dell'app. I punti seguono il tuo obiettivo settimanale, mai oltre. Sfide: Raggiungi l'obiettivo settimanale per 4 settimane di fila. Stabilisci un nuovo record in 4 esercizi diversi. Completa 8 missioni settimanali. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (19/80): **シーズン2:テンペスト — 新しい報酬**

Description (225/500):

```text
10週間・20ティアで、今シーズンだけの報酬が手に入ります。バッジ、アバター、専用アプリアイコン付きのテーマまで。ポイントは自分の週の目標に向けたトレーニングでたまり、目標を超えた日は加算されないので、週2日でも週5日と同じ速さで進めます。チャレンジ:週の目標を4週連続で達成する。4種目で自己ベストを更新する。週間クエストを8個クリアする。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (44/80): **Temporada 2: Tempestade — nuevas recompensas**

Description (424/500):

```text
Dez semanas, 20 níveis e recompensas que você só ganha nesta temporada: medalhas, avatares e um tema com o próprio ícone do app. Os pontos seguem a sua meta semanal, nunca além dela. Desafios: Bata sua meta semanal 4 semanas seguidas. Faça um novo recorde em 4 exercícios diferentes. Conclua 8 missões semanais. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (17/80): **시즌 2: 템페스트 — 새 보상**

Description (252/500):

```text
10주, 20단계, 이번 시즌에만 받을 수 있는 보상이 있어요. 배지, 아바타, 전용 앱 아이콘이 있는 테마까지요. 포인트는 내 주간 목표를 향한 운동으로 쌓이고 목표를 넘긴 날은 더해지지 않아서, 주 2일도 주 5일만큼 빠르게 올라가요. 챌린지: 주간 목표를 4주 연속 달성하기. 서로 다른 운동 4개에서 개인 최고 기록 세우기. 주간 퀘스트 8개 완료하기. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (34/80): **Sezon 2: Burza — 10 tygodni nagród**

Description (422/500):

```text
Dziesięć tygodni, 20 poziomów i nagrody do zdobycia tylko w tym sezonie: odznaki, awatary i motyw z własną ikoną aplikacji. Punkty dają treningi w stronę własnego celu tygodniowego, nigdy ponad niego. Wyzwania: Osiągnij cel tygodniowy 4 tygodnie z rzędu. Ustanów nowy rekord w 4 różnych ćwiczeniach. Ukończ 8 zadań tygodnia. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (40/80): **Sezon 2: Fırtına — 10 hafta yeni ödüller**

Description (406/500):

```text
On hafta, 20 kademe ve yalnızca bu sezon kazanabileceğin ödüller: rozetler, avatarlar ve kendi uygulama simgesi olan bir tema. Puanlar haftalık hedefine kadar gelir, ötesinden asla. Meydan okumalar: Haftalık hedefini üst üste 4 hafta tuttur. 4 farklı egzersizde yeni rekor kır. 8 haftalık görevi tamamla. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s2-finale: Season 2: Tempest — the finale counts double

- Type: Time-limited event
- Starts 2027-04-05 12:00 UTC, ends 2027-04-12 00:00 UTC. Submit by 2027-03-22.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/tempest-finale.png`

#### English (default)

Tagline (44/80): **Season 2: Tempest — the finale counts double**

Description (374/500):

```text
The season's last week counts double. Meet your own weekly goal and every training day earns twice the points, toward the last tiers of badges, avatars and a theme with its own app icon, yours to keep after the season ends. Days past your goal still add nothing, so rest stays in the plan. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (46/80): **Temporada 2: Tempestad — la final cuenta doble**

Description (424/500):

```text
La última semana de la temporada cuenta doble. Cumple tu propio objetivo semanal y cada día de entreno da el doble de puntos, hacia los últimos niveles de insignias, avatares y un tema con su propio icono de app, tuyos cuando la temporada termine. Los días de más siguen sin sumar, así que el descanso sigue en el plan. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (44/80): **Saison 2 : Tempête — la finale compte double**

Description (458/500):

```text
La dernière semaine de la saison compte double. Atteignez votre objectif hebdomadaire et chaque jour d'entraînement rapporte deux fois plus de points, vers les derniers paliers de badges, d'avatars et d'un thème avec sa propre icône d'app, à garder après la saison. Les jours en plus ne rapportent toujours rien : le repos reste dans le plan. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (42/80): **Saison 2: Sturm — das Finale zählt doppelt**

Description (430/500):

```text
Die letzte Woche der Saison zählt doppelt. Erreiche dein Wochenziel, und jeder Trainingstag bringt doppelt so viele Punkte, für die letzten Stufen mit Abzeichen, Avataren und einem Theme mit eigenem App-Symbol, die du nach der Saison behältst. Tage über dem Ziel bringen weiterhin nichts, also bleibt die Pause im Plan. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (44/80): **Stagione 2: Tempesta — la finale vale doppio**

Description (424/500):

```text
L'ultima settimana della stagione vale doppio. Raggiungi il tuo obiettivo settimanale e ogni giorno di allenamento dà il doppio dei punti, verso gli ultimi livelli di badge, avatar e un tema con la sua icona dell'app, tuoi anche dopo la stagione. I giorni in più non danno punti, quindi il riposo resta nel piano. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (19/80): **シーズン2:テンペスト — 最終週2倍**

Description (201/500):

```text
シーズン最後の1週間はポイントが2倍です。自分の週の目標を達成すると、トレーニングした日ごとのポイントが2倍になり、バッジ、アバター、専用アプリアイコン付きテーマの最後のティアに近づけます。獲得した報酬はシーズン終了後も残ります。目標を超えた日は引き続き加算されないので、休養も計画のうちです。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (47/80): **Temporada 2: Tempestade — a final vale em dobro**

Description (425/500):

```text
A última semana da temporada vale em dobro. Bata sua própria meta semanal e cada dia de treino dá o dobro de pontos, rumo aos últimos níveis de medalhas, avatares e um tema com o próprio ícone do app, que ficam com você depois da temporada. Dias além da meta continuam sem somar, então o descanso segue no plano. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (22/80): **시즌 2: 템페스트 — 마지막 주 두 배**

Description (211/500):

```text
시즌의 마지막 주는 포인트가 두 배예요. 내 주간 목표를 달성하면 운동한 날마다 포인트를 두 배로 받아, 배지, 아바타, 전용 앱 아이콘이 있는 테마의 마지막 단계에 다가가요. 얻은 보상은 시즌이 끝나도 계속 내 거예요. 목표를 넘긴 날은 여전히 더해지지 않으니 휴식도 계획의 일부예요. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (42/80): **Sezon 2: Burza — finał liczy się podwójnie**

Description (405/500):

```text
Ostatni tydzień sezonu liczy się podwójnie. Osiągnij własny cel tygodniowy, a każdy dzień treningu da dwa razy więcej punktów, w stronę ostatnich poziomów odznak, awatarów i motywu z własną ikoną aplikacji, które zostaną z tobą po sezonie. Dni ponad cel dalej nic nie dają, więc odpoczynek zostaje w planie. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (40/80): **Sezon 2: Fırtına — final haftası iki kat**

Description (417/500):

```text
Sezonun son haftası iki kat sayılır. Kendi haftalık hedefini tutturduğunda her antrenman günü iki kat puan getirir ve sezon bitince de sende kalacak rozetlerin, avatarların ve kendi uygulama simgesi olan temanın son kademelerine yaklaşırsın. Hedefin üstündeki günler yine puan getirmez, yani dinlenmek planda kalır. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s3-launch: Season 3: Bloom — ten weeks of new rewards

- Type: Time-limited event
- Starts 2027-04-12 12:00 UTC, ends 2027-05-09 23:00 UTC. Submit by 2027-03-29.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/bloom-launch.png`

#### English (default)

Tagline (42/80): **Season 3: Bloom — ten weeks of new rewards**

Description (421/500):

```text
Ten weeks, 20 tiers and rewards you can only earn this season: badges, avatars and a theme with its own app icon. Points come from training toward your own weekly goal, never past it. Challenges: Try 10 exercises you've never done. Do 6 stretch routines of 10+ minutes on their own. Meet your weekly goal in the first and the last week. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (43/80): **Temporada 3: Floración — nuevas recompensas**

Description (463/500):

```text
Diez semanas, 20 niveles y recompensas que solo puedes ganar esta temporada: insignias, avatares y un tema con su propio icono de app. Los puntos siguen tu objetivo semanal, nunca más allá. Retos: Prueba 10 ejercicios que nunca hayas hecho. Haz 6 rutinas de estiramientos de 10+ minutos por separado. Cumple tu objetivo semanal la primera y la última semana. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (44/80): **Saison 3 : Floraison — nouvelles récompenses**

Description (473/500):

```text
Dix semaines, 20 paliers et des récompenses à gagner seulement cette saison : badges, avatars et un thème avec sa propre icône d'app. Les points suivent votre objectif hebdomadaire, jamais au-delà. Défis : Essayez 10 exercices jamais faits. Faites 6 séances d'étirements de 10 min ou plus à part. Atteignez votre objectif la première et la dernière semaine. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (44/80): **Saison 3: Blüte — 10 Wochen neue Belohnungen**

Description (484/500):

```text
Zehn Wochen, 20 Stufen und Belohnungen, die es nur in dieser Saison gibt: Abzeichen, Avatare und ein Theme mit eigenem App-Symbol. Punkte gibt es fürs Training bis zu deinem Wochenziel, nie darüber hinaus. Challenges: Probier 10 Übungen, die du noch nie gemacht hast. Mach 6 eigene Dehnroutinen von 10+ Minuten. Erreiche dein Wochenziel in der ersten und der letzten Woche. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (40/80): **Stagione 3: Fioritura — nuove ricompense**

Description (460/500):

```text
Dieci settimane, 20 livelli e ricompense che puoi ottenere solo in questa stagione: badge, avatar e un tema con la sua icona dell'app. I punti seguono il tuo obiettivo settimanale, mai oltre. Sfide: Prova 10 esercizi mai fatti. Fai 6 routine di stretching da 10+ minuti a parte. Raggiungi l'obiettivo settimanale nella prima e nell'ultima settimana. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (18/80): **シーズン3:ブルーム — 新しい報酬**

Description (237/500):

```text
10週間・20ティアで、今シーズンだけの報酬が手に入ります。バッジ、アバター、専用アプリアイコン付きのテーマまで。ポイントは自分の週の目標に向けたトレーニングでたまり、目標を超えた日は加算されないので、週2日でも週5日と同じ速さで進めます。チャレンジ:やったことのない種目を10個試す。10分以上のストレッチを単独で6回行う。最初の週と最後の週に週の目標を達成する。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (41/80): **Temporada 3: Florada — nuevas recompensas**

Description (459/500):

```text
Dez semanas, 20 níveis e recompensas que você só ganha nesta temporada: medalhas, avatares e um tema com o próprio ícone do app. Os pontos seguem a sua meta semanal, nunca além dela. Desafios: Experimente 10 exercícios que você nunca fez. Faça 6 rotinas de alongamento de 10+ minutos à parte. Bata sua meta semanal na primeira e na última semana. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (15/80): **시즌 3: 블룸 — 새 보상**

Description (258/500):

```text
10주, 20단계, 이번 시즌에만 받을 수 있는 보상이 있어요. 배지, 아바타, 전용 앱 아이콘이 있는 테마까지요. 포인트는 내 주간 목표를 향한 운동으로 쌓이고 목표를 넘긴 날은 더해지지 않아서, 주 2일도 주 5일만큼 빠르게 올라가요. 챌린지: 해 본 적 없는 운동 10개 해 보기. 10분 이상 스트레칭을 따로 6번 하기. 첫 주와 마지막 주에 주간 목표 달성하기. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (36/80): **Sezon 3: Rozkwit — 10 tygodni nagród**

Description (457/500):

```text
Dziesięć tygodni, 20 poziomów i nagrody do zdobycia tylko w tym sezonie: odznaki, awatary i motyw z własną ikoną aplikacji. Punkty dają treningi w stronę własnego celu tygodniowego, nigdy ponad niego. Wyzwania: Spróbuj 10 ćwiczeń, których nigdy nie robiłeś. Zrób 6 osobnych sesji rozciągania 10+ minut. Osiągnij cel tygodniowy w pierwszym i ostatnim tygodniu. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (38/80): **Sezon 3: Çiçek — 10 hafta yeni ödüller**

Description (425/500):

```text
On hafta, 20 kademe ve yalnızca bu sezon kazanabileceğin ödüller: rozetler, avatarlar ve kendi uygulama simgesi olan bir tema. Puanlar haftalık hedefine kadar gelir, ötesinden asla. Meydan okumalar: Hiç yapmadığın 10 egzersizi dene. Tek başına 10+ dakikalık 6 esneme rutini yap. İlk ve son haftada haftalık hedefini tuttur. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s3-finale: Season 3: Bloom — the finale counts double

- Type: Time-limited event
- Starts 2027-06-14 12:00 UTC, ends 2027-06-21 00:00 UTC. Submit by 2027-05-31.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/bloom-finale.png`

#### English (default)

Tagline (42/80): **Season 3: Bloom — the finale counts double**

Description (374/500):

```text
The season's last week counts double. Meet your own weekly goal and every training day earns twice the points, toward the last tiers of badges, avatars and a theme with its own app icon, yours to keep after the season ends. Days past your goal still add nothing, so rest stays in the plan. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (46/80): **Temporada 3: Floración — la final cuenta doble**

Description (424/500):

```text
La última semana de la temporada cuenta doble. Cumple tu propio objetivo semanal y cada día de entreno da el doble de puntos, hacia los últimos niveles de insignias, avatares y un tema con su propio icono de app, tuyos cuando la temporada termine. Los días de más siguen sin sumar, así que el descanso sigue en el plan. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (46/80): **Saison 3 : Floraison — la finale compte double**

Description (458/500):

```text
La dernière semaine de la saison compte double. Atteignez votre objectif hebdomadaire et chaque jour d'entraînement rapporte deux fois plus de points, vers les derniers paliers de badges, d'avatars et d'un thème avec sa propre icône d'app, à garder après la saison. Les jours en plus ne rapportent toujours rien : le repos reste dans le plan. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (42/80): **Saison 3: Blüte — das Finale zählt doppelt**

Description (430/500):

```text
Die letzte Woche der Saison zählt doppelt. Erreiche dein Wochenziel, und jeder Trainingstag bringt doppelt so viele Punkte, für die letzten Stufen mit Abzeichen, Avataren und einem Theme mit eigenem App-Symbol, die du nach der Saison behältst. Tage über dem Ziel bringen weiterhin nichts, also bleibt die Pause im Plan. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (45/80): **Stagione 3: Fioritura — la finale vale doppio**

Description (424/500):

```text
L'ultima settimana della stagione vale doppio. Raggiungi il tuo obiettivo settimanale e ogni giorno di allenamento dà il doppio dei punti, verso gli ultimi livelli di badge, avatar e un tema con la sua icona dell'app, tuoi anche dopo la stagione. I giorni in più non danno punti, quindi il riposo resta nel piano. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (18/80): **シーズン3:ブルーム — 最終週2倍**

Description (201/500):

```text
シーズン最後の1週間はポイントが2倍です。自分の週の目標を達成すると、トレーニングした日ごとのポイントが2倍になり、バッジ、アバター、専用アプリアイコン付きテーマの最後のティアに近づけます。獲得した報酬はシーズン終了後も残ります。目標を超えた日は引き続き加算されないので、休養も計画のうちです。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (44/80): **Temporada 3: Florada — a final vale em dobro**

Description (425/500):

```text
A última semana da temporada vale em dobro. Bata sua própria meta semanal e cada dia de treino dá o dobro de pontos, rumo aos últimos níveis de medalhas, avatares e um tema com o próprio ícone do app, que ficam com você depois da temporada. Dias além da meta continuam sem somar, então o descanso segue no plano. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (20/80): **시즌 3: 블룸 — 마지막 주 두 배**

Description (211/500):

```text
시즌의 마지막 주는 포인트가 두 배예요. 내 주간 목표를 달성하면 운동한 날마다 포인트를 두 배로 받아, 배지, 아바타, 전용 앱 아이콘이 있는 테마의 마지막 단계에 다가가요. 얻은 보상은 시즌이 끝나도 계속 내 거예요. 목표를 넘긴 날은 여전히 더해지지 않으니 휴식도 계획의 일부예요. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (44/80): **Sezon 3: Rozkwit — finał liczy się podwójnie**

Description (405/500):

```text
Ostatni tydzień sezonu liczy się podwójnie. Osiągnij własny cel tygodniowy, a każdy dzień treningu da dwa razy więcej punktów, w stronę ostatnich poziomów odznak, awatarów i motywu z własną ikoną aplikacji, które zostaną z tobą po sezonie. Dni ponad cel dalej nic nie dają, więc odpoczynek zostaje w planie. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (38/80): **Sezon 3: Çiçek — final haftası iki kat**

Description (417/500):

```text
Sezonun son haftası iki kat sayılır. Kendi haftalık hedefini tutturduğunda her antrenman günü iki kat puan getirir ve sezon bitince de sende kalacak rozetlerin, avatarların ve kendi uygulama simgesi olan temanın son kademelerine yaklaşırsın. Hedefin üstündeki günler yine puan getirmez, yani dinlenmek planda kalır. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s4-launch: Season 4: Solstice — ten weeks of new rewards

- Type: Time-limited event
- Starts 2027-06-21 12:00 UTC, ends 2027-07-18 23:00 UTC. Submit by 2027-06-07.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/solstice-launch.png`

#### English (default)

Tagline (45/80): **Season 4: Solstice — ten weeks of new rewards**

Description (395/500):

```text
Ten weeks, 20 tiers and rewards you can only earn this season: badges, avatars and a theme with its own app icon. Points come from training toward your own weekly goal, never past it. Challenges: Meet your weekly goal in 7 weeks. Meet your weekly goal 3 weeks in a row. Set a new best on 5 different exercises. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (43/80): **Temporada 4: Solsticio — nuevas recompensas**

Description (435/500):

```text
Diez semanas, 20 niveles y recompensas que solo puedes ganar esta temporada: insignias, avatares y un tema con su propio icono de app. Los puntos siguen tu objetivo semanal, nunca más allá. Retos: Cumple tu objetivo semanal 7 semanas. Cumple tu objetivo semanal 3 semanas seguidas. Logra una nueva marca en 5 ejercicios distintos. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (43/80): **Saison 4 : Solstice — nouvelles récompenses**

Description (450/500):

```text
Dix semaines, 20 paliers et des récompenses à gagner seulement cette saison : badges, avatars et un thème avec sa propre icône d'app. Les points suivent votre objectif hebdomadaire, jamais au-delà. Défis : Atteignez votre objectif 7 semaines. Atteignez votre objectif 3 semaines d'affilée. Battez un record sur 5 exercices différents. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (48/80): **Saison 4: Sonnwende — 10 Wochen neue Belohnungen**

Description (471/500):

```text
Zehn Wochen, 20 Stufen und Belohnungen, die es nur in dieser Saison gibt: Abzeichen, Avatare und ein Theme mit eigenem App-Symbol. Punkte gibt es fürs Training bis zu deinem Wochenziel, nie darüber hinaus. Challenges: Erreiche dein Wochenziel in 7 Wochen. Erreiche dein Wochenziel 3 Wochen in Folge. Stell in 5 verschiedenen Übungen eine neue Bestleistung auf. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (40/80): **Stagione 4: Solstizio — nuove ricompense**

Description (469/500):

```text
Dieci settimane, 20 livelli e ricompense che puoi ottenere solo in questa stagione: badge, avatar e un tema con la sua icona dell'app. I punti seguono il tuo obiettivo settimanale, mai oltre. Sfide: Raggiungi l'obiettivo settimanale per 7 settimane. Raggiungi l'obiettivo settimanale per 3 settimane di fila. Stabilisci un nuovo record in 5 esercizi diversi. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (20/80): **シーズン4:ソルスティス — 新しい報酬**

Description (222/500):

```text
10週間・20ティアで、今シーズンだけの報酬が手に入ります。バッジ、アバター、専用アプリアイコン付きのテーマまで。ポイントは自分の週の目標に向けたトレーニングでたまり、目標を超えた日は加算されないので、週2日でも週5日と同じ速さで進めます。チャレンジ:週の目標を7週達成する。週の目標を3週連続で達成する。5種目で自己ベストを更新する。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (43/80): **Temporada 4: Solstício — nuevas recompensas**

Description (432/500):

```text
Dez semanas, 20 níveis e recompensas que você só ganha nesta temporada: medalhas, avatares e um tema com o próprio ícone do app. Os pontos seguem a sua meta semanal, nunca além dela. Desafios: Bata sua meta semanal em 7 semanas. Bata sua meta semanal 3 semanas seguidas. Faça um novo recorde em 5 exercícios diferentes. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (17/80): **시즌 4: 솔스티스 — 새 보상**

Description (252/500):

```text
10주, 20단계, 이번 시즌에만 받을 수 있는 보상이 있어요. 배지, 아바타, 전용 앱 아이콘이 있는 테마까지요. 포인트는 내 주간 목표를 향한 운동으로 쌓이고 목표를 넘긴 날은 더해지지 않아서, 주 2일도 주 5일만큼 빠르게 올라가요. 챌린지: 주간 목표를 7주 달성하기. 주간 목표를 3주 연속 달성하기. 서로 다른 운동 5개에서 개인 최고 기록 세우기. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (40/80): **Sezon 4: Przesilenie — 10 tygodni nagród**

Description (437/500):

```text
Dziesięć tygodni, 20 poziomów i nagrody do zdobycia tylko w tym sezonie: odznaki, awatary i motyw z własną ikoną aplikacji. Punkty dają treningi w stronę własnego celu tygodniowego, nigdy ponad niego. Wyzwania: Osiągnij cel tygodniowy w 7 tygodniach. Osiągnij cel tygodniowy 3 tygodnie z rzędu. Ustanów nowy rekord w 5 różnych ćwiczeniach. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (42/80): **Sezon 4: Gündönümü — 10 hafta yeni ödüller**

Description (413/500):

```text
On hafta, 20 kademe ve yalnızca bu sezon kazanabileceğin ödüller: rozetler, avatarlar ve kendi uygulama simgesi olan bir tema. Puanlar haftalık hedefine kadar gelir, ötesinden asla. Meydan okumalar: Haftalık hedefini 7 hafta tuttur. Haftalık hedefini üst üste 3 hafta tuttur. 5 farklı egzersizde yeni rekor kır. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s4-finale: Season 4: Solstice — the finale counts double

- Type: Time-limited event
- Starts 2027-08-23 12:00 UTC, ends 2027-08-30 00:00 UTC. Submit by 2027-08-09.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/solstice-finale.png`

#### English (default)

Tagline (45/80): **Season 4: Solstice — the finale counts double**

Description (374/500):

```text
The season's last week counts double. Meet your own weekly goal and every training day earns twice the points, toward the last tiers of badges, avatars and a theme with its own app icon, yours to keep after the season ends. Days past your goal still add nothing, so rest stays in the plan. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (46/80): **Temporada 4: Solsticio — la final cuenta doble**

Description (424/500):

```text
La última semana de la temporada cuenta doble. Cumple tu propio objetivo semanal y cada día de entreno da el doble de puntos, hacia los últimos niveles de insignias, avatares y un tema con su propio icono de app, tuyos cuando la temporada termine. Los días de más siguen sin sumar, así que el descanso sigue en el plan. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (45/80): **Saison 4 : Solstice — la finale compte double**

Description (458/500):

```text
La dernière semaine de la saison compte double. Atteignez votre objectif hebdomadaire et chaque jour d'entraînement rapporte deux fois plus de points, vers les derniers paliers de badges, d'avatars et d'un thème avec sa propre icône d'app, à garder après la saison. Les jours en plus ne rapportent toujours rien : le repos reste dans le plan. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (46/80): **Saison 4: Sonnwende — das Finale zählt doppelt**

Description (430/500):

```text
Die letzte Woche der Saison zählt doppelt. Erreiche dein Wochenziel, und jeder Trainingstag bringt doppelt so viele Punkte, für die letzten Stufen mit Abzeichen, Avataren und einem Theme mit eigenem App-Symbol, die du nach der Saison behältst. Tage über dem Ziel bringen weiterhin nichts, also bleibt die Pause im Plan. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (45/80): **Stagione 4: Solstizio — la finale vale doppio**

Description (424/500):

```text
L'ultima settimana della stagione vale doppio. Raggiungi il tuo obiettivo settimanale e ogni giorno di allenamento dà il doppio dei punti, verso gli ultimi livelli di badge, avatar e un tema con la sua icona dell'app, tuoi anche dopo la stagione. I giorni in più non danno punti, quindi il riposo resta nel piano. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (20/80): **シーズン4:ソルスティス — 最終週2倍**

Description (201/500):

```text
シーズン最後の1週間はポイントが2倍です。自分の週の目標を達成すると、トレーニングした日ごとのポイントが2倍になり、バッジ、アバター、専用アプリアイコン付きテーマの最後のティアに近づけます。獲得した報酬はシーズン終了後も残ります。目標を超えた日は引き続き加算されないので、休養も計画のうちです。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (46/80): **Temporada 4: Solstício — a final vale em dobro**

Description (425/500):

```text
A última semana da temporada vale em dobro. Bata sua própria meta semanal e cada dia de treino dá o dobro de pontos, rumo aos últimos níveis de medalhas, avatares e um tema com o próprio ícone do app, que ficam com você depois da temporada. Dias além da meta continuam sem somar, então o descanso segue no plano. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (22/80): **시즌 4: 솔스티스 — 마지막 주 두 배**

Description (211/500):

```text
시즌의 마지막 주는 포인트가 두 배예요. 내 주간 목표를 달성하면 운동한 날마다 포인트를 두 배로 받아, 배지, 아바타, 전용 앱 아이콘이 있는 테마의 마지막 단계에 다가가요. 얻은 보상은 시즌이 끝나도 계속 내 거예요. 목표를 넘긴 날은 여전히 더해지지 않으니 휴식도 계획의 일부예요. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (48/80): **Sezon 4: Przesilenie — finał liczy się podwójnie**

Description (405/500):

```text
Ostatni tydzień sezonu liczy się podwójnie. Osiągnij własny cel tygodniowy, a każdy dzień treningu da dwa razy więcej punktów, w stronę ostatnich poziomów odznak, awatarów i motywu z własną ikoną aplikacji, które zostaną z tobą po sezonie. Dni ponad cel dalej nic nie dają, więc odpoczynek zostaje w planie. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (42/80): **Sezon 4: Gündönümü — final haftası iki kat**

Description (417/500):

```text
Sezonun son haftası iki kat sayılır. Kendi haftalık hedefini tutturduğunda her antrenman günü iki kat puan getirir ve sezon bitince de sende kalacak rozetlerin, avatarların ve kendi uygulama simgesi olan temanın son kademelerine yaklaşırsın. Hedefin üstündeki günler yine puan getirmez, yani dinlenmek planda kalır. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s5-launch: Season 5: Maple — ten weeks of new rewards

- Type: Time-limited event
- Starts 2027-08-30 12:00 UTC, ends 2027-09-26 23:00 UTC. Submit by 2027-08-16.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/maple-launch.png`

#### English (default)

Tagline (42/80): **Season 5: Maple — ten weeks of new rewards**

Description (376/500):

```text
Ten weeks, 20 tiers and rewards you can only earn this season: badges, avatars and a theme with its own app icon. Points come from training toward your own weekly goal, never past it. Challenges: Meet your weekly goal in the first and the last week. Set 4 new bests. Finish 12 weekly quests. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (38/80): **Temporada 5: Arce — nuevas recompensas**

Description (414/500):

```text
Diez semanas, 20 niveles y recompensas que solo puedes ganar esta temporada: insignias, avatares y un tema con su propio icono de app. Los puntos siguen tu objetivo semanal, nunca más allá. Retos: Cumple tu objetivo semanal la primera y la última semana. Logra 4 nuevas marcas. Completa 12 misiones semanales. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (41/80): **Saison 5 : Érable — nouvelles récompenses**

Description (434/500):

```text
Dix semaines, 20 paliers et des récompenses à gagner seulement cette saison : badges, avatars et un thème avec sa propre icône d'app. Les points suivent votre objectif hebdomadaire, jamais au-delà. Défis : Atteignez votre objectif la première et la dernière semaine. Battez 4 records. Terminez 12 quêtes de la semaine. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (44/80): **Saison 5: Ahorn — 10 Wochen neue Belohnungen**

Description (453/500):

```text
Zehn Wochen, 20 Stufen und Belohnungen, die es nur in dieser Saison gibt: Abzeichen, Avatare und ein Theme mit eigenem App-Symbol. Punkte gibt es fürs Training bis zu deinem Wochenziel, nie darüber hinaus. Challenges: Erreiche dein Wochenziel in der ersten und der letzten Woche. Stell 4 neue Bestleistungen auf. Schließ 12 Wochenaufgaben ab. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (36/80): **Stagione 5: Acero — nuove ricompense**

Description (441/500):

```text
Dieci settimane, 20 livelli e ricompense che puoi ottenere solo in questa stagione: badge, avatar e un tema con la sua icona dell'app. I punti seguono il tuo obiettivo settimanale, mai oltre. Sfide: Raggiungi l'obiettivo settimanale nella prima e nell'ultima settimana. Stabilisci 4 nuovi record. Completa 12 missioni settimanali. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (18/80): **シーズン5:メープル — 新しい報酬**

Description (229/500):

```text
10週間・20ティアで、今シーズンだけの報酬が手に入ります。バッジ、アバター、専用アプリアイコン付きのテーマまで。ポイントは自分の週の目標に向けたトレーニングでたまり、目標を超えた日は加算されないので、週2日でも週5日と同じ速さで進めます。チャレンジ:最初の週と最後の週に週の目標を達成する。自己ベストを4回更新する。週間クエストを12個クリアする。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (39/80): **Temporada 5: Bordo — nuevas recompensas**

Description (411/500):

```text
Dez semanas, 20 níveis e recompensas que você só ganha nesta temporada: medalhas, avatares e um tema com o próprio ícone do app. Os pontos seguem a sua meta semanal, nunca além dela. Desafios: Bata sua meta semanal na primeira e na última semana. Faça 4 novos recordes. Conclua 12 missões semanais. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (16/80): **시즌 5: 메이플 — 새 보상**

Description (247/500):

```text
10주, 20단계, 이번 시즌에만 받을 수 있는 보상이 있어요. 배지, 아바타, 전용 앱 아이콘이 있는 테마까지요. 포인트는 내 주간 목표를 향한 운동으로 쌓이고 목표를 넘긴 날은 더해지지 않아서, 주 2일도 주 5일만큼 빠르게 올라가요. 챌린지: 첫 주와 마지막 주에 주간 목표 달성하기. 개인 최고 기록 4번 세우기. 주간 퀘스트 12개 완료하기. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (33/80): **Sezon 5: Klon — 10 tygodni nagród**

Description (415/500):

```text
Dziesięć tygodni, 20 poziomów i nagrody do zdobycia tylko w tym sezonie: odznaki, awatary i motyw z własną ikoną aplikacji. Punkty dają treningi w stronę własnego celu tygodniowego, nigdy ponad niego. Wyzwania: Osiągnij cel tygodniowy w pierwszym i ostatnim tygodniu. Ustanów 4 nowe rekordy. Ukończ 12 zadań tygodnia. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (41/80): **Sezon 5: Akçaağaç — 10 hafta yeni ödüller**

Description (391/500):

```text
On hafta, 20 kademe ve yalnızca bu sezon kazanabileceğin ödüller: rozetler, avatarlar ve kendi uygulama simgesi olan bir tema. Puanlar haftalık hedefine kadar gelir, ötesinden asla. Meydan okumalar: İlk ve son haftada haftalık hedefini tuttur. 4 yeni rekor kır. 12 haftalık görevi tamamla. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s5-finale: Season 5: Maple — the finale counts double

- Type: Time-limited event
- Starts 2027-11-01 12:00 UTC, ends 2027-11-08 00:00 UTC. Submit by 2027-10-18.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/maple-finale.png`

#### English (default)

Tagline (42/80): **Season 5: Maple — the finale counts double**

Description (374/500):

```text
The season's last week counts double. Meet your own weekly goal and every training day earns twice the points, toward the last tiers of badges, avatars and a theme with its own app icon, yours to keep after the season ends. Days past your goal still add nothing, so rest stays in the plan. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (41/80): **Temporada 5: Arce — la final cuenta doble**

Description (424/500):

```text
La última semana de la temporada cuenta doble. Cumple tu propio objetivo semanal y cada día de entreno da el doble de puntos, hacia los últimos niveles de insignias, avatares y un tema con su propio icono de app, tuyos cuando la temporada termine. Los días de más siguen sin sumar, así que el descanso sigue en el plan. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (43/80): **Saison 5 : Érable — la finale compte double**

Description (458/500):

```text
La dernière semaine de la saison compte double. Atteignez votre objectif hebdomadaire et chaque jour d'entraînement rapporte deux fois plus de points, vers les derniers paliers de badges, d'avatars et d'un thème avec sa propre icône d'app, à garder après la saison. Les jours en plus ne rapportent toujours rien : le repos reste dans le plan. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (42/80): **Saison 5: Ahorn — das Finale zählt doppelt**

Description (430/500):

```text
Die letzte Woche der Saison zählt doppelt. Erreiche dein Wochenziel, und jeder Trainingstag bringt doppelt so viele Punkte, für die letzten Stufen mit Abzeichen, Avataren und einem Theme mit eigenem App-Symbol, die du nach der Saison behältst. Tage über dem Ziel bringen weiterhin nichts, also bleibt die Pause im Plan. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (41/80): **Stagione 5: Acero — la finale vale doppio**

Description (424/500):

```text
L'ultima settimana della stagione vale doppio. Raggiungi il tuo obiettivo settimanale e ogni giorno di allenamento dà il doppio dei punti, verso gli ultimi livelli di badge, avatar e un tema con la sua icona dell'app, tuoi anche dopo la stagione. I giorni in più non danno punti, quindi il riposo resta nel piano. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (18/80): **シーズン5:メープル — 最終週2倍**

Description (201/500):

```text
シーズン最後の1週間はポイントが2倍です。自分の週の目標を達成すると、トレーニングした日ごとのポイントが2倍になり、バッジ、アバター、専用アプリアイコン付きテーマの最後のティアに近づけます。獲得した報酬はシーズン終了後も残ります。目標を超えた日は引き続き加算されないので、休養も計画のうちです。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (42/80): **Temporada 5: Bordo — a final vale em dobro**

Description (425/500):

```text
A última semana da temporada vale em dobro. Bata sua própria meta semanal e cada dia de treino dá o dobro de pontos, rumo aos últimos níveis de medalhas, avatares e um tema com o próprio ícone do app, que ficam com você depois da temporada. Dias além da meta continuam sem somar, então o descanso segue no plano. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (21/80): **시즌 5: 메이플 — 마지막 주 두 배**

Description (211/500):

```text
시즌의 마지막 주는 포인트가 두 배예요. 내 주간 목표를 달성하면 운동한 날마다 포인트를 두 배로 받아, 배지, 아바타, 전용 앱 아이콘이 있는 테마의 마지막 단계에 다가가요. 얻은 보상은 시즌이 끝나도 계속 내 거예요. 목표를 넘긴 날은 여전히 더해지지 않으니 휴식도 계획의 일부예요. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (41/80): **Sezon 5: Klon — finał liczy się podwójnie**

Description (405/500):

```text
Ostatni tydzień sezonu liczy się podwójnie. Osiągnij własny cel tygodniowy, a każdy dzień treningu da dwa razy więcej punktów, w stronę ostatnich poziomów odznak, awatarów i motywu z własną ikoną aplikacji, które zostaną z tobą po sezonie. Dni ponad cel dalej nic nie dają, więc odpoczynek zostaje w planie. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (41/80): **Sezon 5: Akçaağaç — final haftası iki kat**

Description (417/500):

```text
Sezonun son haftası iki kat sayılır. Kendi haftalık hedefini tutturduğunda her antrenman günü iki kat puan getirir ve sezon bitince de sende kalacak rozetlerin, avatarların ve kendi uygulama simgesi olan temanın son kademelerine yaklaşırsın. Hedefin üstündeki günler yine puan getirmez, yani dinlenmek planda kalır. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s6-launch: Season 6: Obsidian — ten weeks of new rewards

- Type: Time-limited event
- Starts 2027-11-08 12:00 UTC, ends 2027-12-05 23:00 UTC. Submit by 2027-10-25.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/obsidian-launch.png`

#### English (default)

Tagline (45/80): **Season 6: Obsidian — ten weeks of new rewards**

Description (406/500):

```text
Ten weeks, 20 tiers and rewards you can only earn this season: badges, avatars and a theme with its own app icon. Points come from training toward your own weekly goal, never past it. Challenges: Meet your weekly goal 5 weeks in a row. Do 5 stretch routines of 10+ minutes on their own. Try 6 exercises you've never done. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (43/80): **Temporada 6: Obsidiana — nuevas recompensas**

Description (451/500):

```text
Diez semanas, 20 niveles y recompensas que solo puedes ganar esta temporada: insignias, avatares y un tema con su propio icono de app. Los puntos siguen tu objetivo semanal, nunca más allá. Retos: Cumple tu objetivo semanal 5 semanas seguidas. Haz 5 rutinas de estiramientos de 10+ minutos por separado. Prueba 6 ejercicios que nunca hayas hecho. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (45/80): **Saison 6 : Obsidienne — nouvelles récompenses**

Description (458/500):

```text
Dix semaines, 20 paliers et des récompenses à gagner seulement cette saison : badges, avatars et un thème avec sa propre icône d'app. Les points suivent votre objectif hebdomadaire, jamais au-delà. Défis : Atteignez votre objectif 5 semaines d'affilée. Faites 5 séances d'étirements de 10 min ou plus à part. Essayez 6 exercices jamais faits. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (47/80): **Saison 6: Obsidian — 10 Wochen neue Belohnungen**

Description (465/500):

```text
Zehn Wochen, 20 Stufen und Belohnungen, die es nur in dieser Saison gibt: Abzeichen, Avatare und ein Theme mit eigenem App-Symbol. Punkte gibt es fürs Training bis zu deinem Wochenziel, nie darüber hinaus. Challenges: Erreiche dein Wochenziel 5 Wochen in Folge. Mach 5 eigene Dehnroutinen von 10+ Minuten. Probier 6 Übungen, die du noch nie gemacht hast. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (40/80): **Stagione 6: Ossidiana — nuove ricompense**

Description (447/500):

```text
Dieci settimane, 20 livelli e ricompense che puoi ottenere solo in questa stagione: badge, avatar e un tema con la sua icona dell'app. I punti seguono il tuo obiettivo settimanale, mai oltre. Sfide: Raggiungi l'obiettivo settimanale per 5 settimane di fila. Fai 5 routine di stretching da 10+ minuti a parte. Prova 6 esercizi mai fatti. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (21/80): **シーズン6:オブシディアン — 新しい報酬**

Description (231/500):

```text
10週間・20ティアで、今シーズンだけの報酬が手に入ります。バッジ、アバター、専用アプリアイコン付きのテーマまで。ポイントは自分の週の目標に向けたトレーニングでたまり、目標を超えた日は加算されないので、週2日でも週5日と同じ速さで進めます。チャレンジ:週の目標を5週連続で達成する。10分以上のストレッチを単独で5回行う。やったことのない種目を6個試す。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (43/80): **Temporada 6: Obsidiana — nuevas recompensas**

Description (446/500):

```text
Dez semanas, 20 níveis e recompensas que você só ganha nesta temporada: medalhas, avatares e um tema com o próprio ícone do app. Os pontos seguem a sua meta semanal, nunca além dela. Desafios: Bata sua meta semanal 5 semanas seguidas. Faça 5 rotinas de alongamento de 10+ minutos à parte. Experimente 6 exercícios que você nunca fez. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (17/80): **시즌 6: 옵시디언 — 새 보상**

Description (252/500):

```text
10주, 20단계, 이번 시즌에만 받을 수 있는 보상이 있어요. 배지, 아바타, 전용 앱 아이콘이 있는 테마까지요. 포인트는 내 주간 목표를 향한 운동으로 쌓이고 목표를 넘긴 날은 더해지지 않아서, 주 2일도 주 5일만큼 빠르게 올라가요. 챌린지: 주간 목표를 5주 연속 달성하기. 10분 이상 스트레칭을 따로 5번 하기. 해 본 적 없는 운동 6개 해 보기. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (37/80): **Sezon 6: Obsydian — 10 tygodni nagród**

Description (442/500):

```text
Dziesięć tygodni, 20 poziomów i nagrody do zdobycia tylko w tym sezonie: odznaki, awatary i motyw z własną ikoną aplikacji. Punkty dają treningi w stronę własnego celu tygodniowego, nigdy ponad niego. Wyzwania: Osiągnij cel tygodniowy 5 tygodni z rzędu. Zrób 5 osobnych sesji rozciągania 10+ minut. Spróbuj 6 ćwiczeń, których nigdy nie robiłeś. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (41/80): **Sezon 6: Obsidyen — 10 hafta yeni ödüller**

Description (422/500):

```text
On hafta, 20 kademe ve yalnızca bu sezon kazanabileceğin ödüller: rozetler, avatarlar ve kendi uygulama simgesi olan bir tema. Puanlar haftalık hedefine kadar gelir, ötesinden asla. Meydan okumalar: Haftalık hedefini üst üste 5 hafta tuttur. Tek başına 10+ dakikalık 5 esneme rutini yap. Hiç yapmadığın 6 egzersizi dene. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```

### s6-finale: Season 6: Obsidian — the finale counts double

- Type: Time-limited event
- Starts 2028-01-10 12:00 UTC, ends 2028-01-17 00:00 UTC. Submit by 2027-12-27.
- Deep link: https://www.getliftsmith.com/app/#/season
- Image (1920×1080): `store/play/promotions/obsidian-finale.png`

#### English (default)

Tagline (45/80): **Season 6: Obsidian — the finale counts double**

Description (374/500):

```text
The season's last week counts double. Meet your own weekly goal and every training day earns twice the points, toward the last tiers of badges, avatars and a theme with its own app icon, yours to keep after the season ends. Days past your goal still add nothing, so rest stays in the plan. Every tier is free, and Pro adds a bonus row. Seasons open after your fifth workout.
```

#### Español

Tagline (46/80): **Temporada 6: Obsidiana — la final cuenta doble**

Description (424/500):

```text
La última semana de la temporada cuenta doble. Cumple tu propio objetivo semanal y cada día de entreno da el doble de puntos, hacia los últimos niveles de insignias, avatares y un tema con su propio icono de app, tuyos cuando la temporada termine. Los días de más siguen sin sumar, así que el descanso sigue en el plan. Todos los niveles son gratis y Pro añade una fila extra. Las temporadas se abren tras tu quinto entreno.
```

#### Français

Tagline (47/80): **Saison 6 : Obsidienne — la finale compte double**

Description (458/500):

```text
La dernière semaine de la saison compte double. Atteignez votre objectif hebdomadaire et chaque jour d'entraînement rapporte deux fois plus de points, vers les derniers paliers de badges, d'avatars et d'un thème avec sa propre icône d'app, à garder après la saison. Les jours en plus ne rapportent toujours rien : le repos reste dans le plan. Tous les paliers sont gratuits, et Pro ajoute une rangée bonus. Les saisons s'ouvrent après votre cinquième séance.
```

#### Deutsch

Tagline (45/80): **Saison 6: Obsidian — das Finale zählt doppelt**

Description (430/500):

```text
Die letzte Woche der Saison zählt doppelt. Erreiche dein Wochenziel, und jeder Trainingstag bringt doppelt so viele Punkte, für die letzten Stufen mit Abzeichen, Avataren und einem Theme mit eigenem App-Symbol, die du nach der Saison behältst. Tage über dem Ziel bringen weiterhin nichts, also bleibt die Pause im Plan. Alle Stufen sind kostenlos, Pro bringt eine Bonusreihe dazu. Saisons öffnen sich nach deinem fünften Training.
```

#### Italiano

Tagline (45/80): **Stagione 6: Ossidiana — la finale vale doppio**

Description (424/500):

```text
L'ultima settimana della stagione vale doppio. Raggiungi il tuo obiettivo settimanale e ogni giorno di allenamento dà il doppio dei punti, verso gli ultimi livelli di badge, avatar e un tema con la sua icona dell'app, tuoi anche dopo la stagione. I giorni in più non danno punti, quindi il riposo resta nel piano. Tutti i livelli sono gratuiti e Pro aggiunge una fila bonus. Le stagioni si aprono dopo il quinto allenamento.
```

#### 日本語

Tagline (21/80): **シーズン6:オブシディアン — 最終週2倍**

Description (201/500):

```text
シーズン最後の1週間はポイントが2倍です。自分の週の目標を達成すると、トレーニングした日ごとのポイントが2倍になり、バッジ、アバター、専用アプリアイコン付きテーマの最後のティアに近づけます。獲得した報酬はシーズン終了後も残ります。目標を超えた日は引き続き加算されないので、休養も計画のうちです。すべてのティアは無料で、Proならボーナス列も追加されます。シーズンは5回目のワークアウトのあとに開きます。
```

#### Português (Brasil)

Tagline (46/80): **Temporada 6: Obsidiana — a final vale em dobro**

Description (425/500):

```text
A última semana da temporada vale em dobro. Bata sua própria meta semanal e cada dia de treino dá o dobro de pontos, rumo aos últimos níveis de medalhas, avatares e um tema com o próprio ícone do app, que ficam com você depois da temporada. Dias além da meta continuam sem somar, então o descanso segue no plano. Todos os níveis são grátis, e o Pro adiciona uma fileira bônus. As temporadas abrem depois do seu quinto treino.
```

#### 한국어

Tagline (22/80): **시즌 6: 옵시디언 — 마지막 주 두 배**

Description (211/500):

```text
시즌의 마지막 주는 포인트가 두 배예요. 내 주간 목표를 달성하면 운동한 날마다 포인트를 두 배로 받아, 배지, 아바타, 전용 앱 아이콘이 있는 테마의 마지막 단계에 다가가요. 얻은 보상은 시즌이 끝나도 계속 내 거예요. 목표를 넘긴 날은 여전히 더해지지 않으니 휴식도 계획의 일부예요. 모든 단계는 무료이고, Pro는 보너스 줄을 더해요. 시즌은 다섯 번째 운동 후에 열려요.
```

#### Polski

Tagline (45/80): **Sezon 6: Obsydian — finał liczy się podwójnie**

Description (405/500):

```text
Ostatni tydzień sezonu liczy się podwójnie. Osiągnij własny cel tygodniowy, a każdy dzień treningu da dwa razy więcej punktów, w stronę ostatnich poziomów odznak, awatarów i motywu z własną ikoną aplikacji, które zostaną z tobą po sezonie. Dni ponad cel dalej nic nie dają, więc odpoczynek zostaje w planie. Wszystkie poziomy są darmowe, a Pro dodaje rząd bonusów. Sezony otwierają się po piątym treningu.
```

#### Türkçe

Tagline (41/80): **Sezon 6: Obsidyen — final haftası iki kat**

Description (417/500):

```text
Sezonun son haftası iki kat sayılır. Kendi haftalık hedefini tutturduğunda her antrenman günü iki kat puan getirir ve sezon bitince de sende kalacak rozetlerin, avatarların ve kendi uygulama simgesi olan temanın son kademelerine yaklaşırsın. Hedefin üstündeki günler yine puan getirmez, yani dinlenmek planda kalır. Tüm kademeler ücretsiz, Pro ise bir bonus sırası ekler. Sezonlar beşinci antrenmanından sonra açılır.
```
