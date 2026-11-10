# Health and fitness age: options and recommendation

Status: **decided and built** (2026-11-09). Melvin picked option 1, fitness age from VO₂ max. It ships on Android, iOS and the web app in one change; see AGENTS.md "Fitness age" for how it's built.

Question (Melvin, 2026-11-09): can the data we already have estimate how healthy someone is, or how fast they're ageing, using current research, without diagnosing anything and without becoming a medical device for the FDA or Health Canada?

Short answer: **yes, as a "fitness age" built from VO₂ max**, which has the strongest evidence of anything we can measure and is a well-trodden wellness feature. A composite "biological age" or "health age" from resting heart rate, HRV, sleep and steps is not something the research supports yet with our data, and it would read like a clinical risk score.

## What we have

From Health Connect and Apple Health (the health twin, `src/lib/twin.ts`): weight, height, BMI, body fat and lean mass, resting heart rate, HRV (RMSSD on Android, SDNN on iOS), sleep, steps, VO₂ max (watch estimate), overnight breathing rate. From our own data: age and sex (setup, or Apple Health), every set lifted with estimated one-rep maxes (`onerm.ts`), the strength score (`strength.ts`), weekly training time, and the heart rate drop in the first minute of rest.

We don't have blood tests, blood pressure, waist size, grip strength, raw PPG signals or ECGs.

## The options

| Option | Data it needs | Evidence | Fits us? |
| --- | --- | --- | --- |
| **1. Fitness age from VO₂ max** (HUNT study, Norway) | VO₂ max, age, sex | **Strong.** Cardio fitness is one of the strongest single predictors of long-term health in large cohorts | **Yes** |
| 2. Non-exercise fitness estimate, then fitness age | Age, sex, resting HR, activity, waist (or BMI in older US models) | Moderate. Validated against lab tests in HUNT; error is larger than a measured VO₂ max | Fallback only |
| 3. Strength for age | One-rep maxes, body weight, age, sex | Moderate for strength and health in general; **no validated "strength age" formula** | Yes, but not as an "age" |
| 4. Composite "health age" from resting HR, HRV, sleep, steps | All of the twin's metrics | Each part is linked to health on its own; **no published, validated way to combine them** from consumer wearables | No |
| 5. Blood-marker or epigenetic biological age (PhenoAge, clocks) | Blood tests or DNA samples | Strong in research | No, we have no samples |
| 6. Device makers' own "ages" built on raw signals | Raw PPG or pulse-wave data, private models | Unpublished or company-run studies | No, we only get summary values |

### 1. Fitness age from VO₂ max (recommended)

- **How it works:** fitness age is the age at which a typical healthy person of your sex has your VO₂ max. A 45-year-old man with the VO₂ max of a typical 35-year-old has a fitness age of 35. It comes from the HUNT Fitness Study at NTNU, which measured VO₂ max on a treadmill in about 4,600 healthy adults aged 20 to 90 (Loe et al., *Med Sci Sports Exerc* 2013, reference values by age and sex), and defined fitness age from those values (Nes et al., *Med Sci Sports Exerc* 2014). In the wider HUNT cohort (about 55,000 people followed for decades), fitness age predicted long-term outcomes better than calendar age.
- **Evidence behind VO₂ max:** large cohorts and meta-analyses link higher cardio fitness to better long-term health in a dose-response way (Kodama et al., *JAMA* 2009, 33 studies; Mandsager et al., *JAMA Network Open* 2018, 122,007 treadmill tests; Kokkinos et al., *JACC* 2022, 750,302 veterans). This is the most consistent signal in the field.
- **Data quality:** our VO₂ max is a watch estimate (Apple Watch, Fitbit, Pixel Watch, Garmin), taken from outdoor walks and runs. Validation studies of consumer watches report average errors of roughly 5 to 15% against lab tests, often reading fit people low. So we show a **range**, never one exact year, and say it's from the watch. Lifters who never walk or run outdoors with a watch won't get a reading.
- **Precedent:** fitness-tracker makers have shown a VO₂-max-based fitness age as a wellness feature for years.
- **Action over stats:** the number is only worth showing with what moves it. VO₂ max responds to steady and interval cardio within weeks; we'd say what would move it (more daily steps, two short hard cardio sessions a week) and show the trend over three months. The twin already tracks VO₂ max's three-month trend, so this is mostly a new view of data we have.

### 2. Non-exercise fitness estimate (fallback)

HUNT also published a model that estimates VO₂ max without a test, from age, sex, waist size, resting heart rate and an activity score (Nes et al., *Med Sci Sports Exerc* 2011); an older US model uses BMI and self-reported activity instead of waist (Jackson et al., 1990). Error is wider than a watch reading. We'd need one new optional input (waist, by `BumpField`; Apple Health has a waist type, Health Connect doesn't). Worth adding later, labelled "estimated without a fitness test", only if many lifters have no VO₂ max reading.

### 3. Strength for age

Strength is linked to long-term health: grip strength in the PURE study (Leong et al., *Lancet* 2015, about 140,000 adults), bench and leg press strength relative to body weight (Ruiz et al., *BMJ* 2008, 8,762 men), and 30 to 60 minutes a week of muscle-strengthening work (Momma et al., *Br J Sports Med* 2022, meta-analysis). But nobody has validated turning one-rep maxes into a "strength age", and lifting numbers depend heavily on technique and practice. We already have the honest version: the strength score and strength twins (`strength.ts`), which compare to standards by age and sex. Recommendation: **show the strength score beside fitness age, not a second "age"**, and count weekly strength-training minutes, which is the measure the health research actually used.

### 4. Composite "health age" (not recommended)

Each input has published links on its own: resting heart rate (Zhang et al., *CMAJ* 2016), daily steps (Paluch et al., *Lancet Public Health* 2022: benefits level off around 6,000 to 8,000 steps over 60 and 8,000 to 10,000 under 60), sleep length (Cappuccio et al., *Sleep* 2010, lowest risk around 7 to 8 hours) and HRV (Hillebrand et al., *Europace* 2013). But those studies used clinical-grade measures, and no one has published a validated way to weigh consumer-wearable readings into one age. Any weights would be our own invention, the result would look like a clinical risk score, and an unexplained jump (a bad night's sleep making you "5 years older") would erode trust. HRV is also measured differently on Android and iOS (RMSSD against SDNN), so one formula wouldn't mean the same thing on both. **Keep these as separate twin metrics compared with the lifter's own normal**, as today.

### 5 and 6. Blood, DNA or raw-signal ages

Out of reach: we have no blood or DNA samples, and Health Connect and HealthKit give us summary values, not the raw pulse signals that device makers' private models use.

## Staying general wellness (FDA and Health Canada)

**FDA.** The *General Wellness: Policy for Low Risk Devices* guidance was updated on 6 January 2026. A product stays general wellness when it's meant only for wellness and is low risk. The 2026 update is friendlier to non-invasive wearables estimating physiological values for sleep, activity, fitness or stress, as long as the product doesn't name a disease, doesn't call a value "abnormal", "pathological" or "diagnostic", shows no clinical thresholds, diagnoses or treatment advice, and gives no ongoing alerts to manage a disease. A limited note that a doctor "may be helpful" is allowed.

**Health Canada.** Under the *Food and Drugs Act*, software is a medical device when it's sold or represented for diagnosing, treating, mitigating or preventing a disease, so intended use and claims decide it. Health Canada's software-as-a-medical-device guidance (2019) treats coaching about staying fit and tools that only organise and track health information as not devices.

**App stores.** Apple's guideline 1.4.1 asks apps that estimate health measures to disclose their data and method, and Google Play's health apps policy asks for a disclaimer that the app isn't a medical device. Both fit the "How is this worked out?" sheet below.

**What that means for us (rules for any version):**

1. **Name: "Fitness age".** Never "biological age", "health age", "heart age", "real age" or "life expectancy". "Heart age" and "biological age" imply heart-disease risk or ageing biomarkers.
2. **No disease words** anywhere in the feature, its glossary entry, the store listing or marketing: no heart disease, diabetes, mortality, "risk of death", "live longer" or "reverse ageing". The research section of this doc is for us, not for the app.
3. **No clinical labels or thresholds.** No "abnormal", "unhealthy", "at risk" or red warning states. Use fitness words: "fitter than typical for your age", "about typical", "room to build". Use the brand colours, never status red.
4. **No alerts.** Fitness age is something the lifter looks at; it never sends a notification, and a change never triggers one.
5. **A range and its source.** "Fitness age about 34 to 38, from your watch's VO₂ max" with a "How is this worked out?" sheet: the method, the HUNT reference data, that watch estimates can be off by 5 to 15%, and "This is a fitness estimate for general wellness. It isn't medical advice and can't tell you about any health condition. If you have concerns about your health, a doctor may be helpful." That last line is general and shown always, never triggered by a value.
6. **Always paired with what to do** (action over stats): what tends to raise VO₂ max, and what the lifter did recently.
7. **Nothing leaves the device.** Same as the rest of the health twin: no analytics, feedback reports or share links. A share card, if ever, shows only the fitness age and only when the lifter ticks it.
8. **No lawyer review** (Melvin, 2026-11-10): rules 1 to 7 are the safeguard. This doc is research, not legal advice.

## Recommendation

**Build option 1, Fitness age from VO₂ max, on the Body tab's Health view, with the existing strength score shown beside it (option 3's honest form) and weekly strength-training minutes.** Don't build a composite health or biological age.

- Free to view, like the rest of the health twin.
- Engine: a pure function in `src/lib/fitnessAge.ts` (HUNT reference values by sex, interpolated by age; range from the reading's error band; needs a VO₂ max from the last 120 days and an age), tested in node. The card in `HealthTwin.tsx`, a glossary entry, and text in `en.ts`, `es.ts`, `fr.ts`.
- No native code: VO₂ max already arrives through `health.ts` on Android and iOS, so both apps get it from the same build. The web app shows the card with "On your phone", like the other health-store metrics.
- Reference values: Loe et al. 2013, Table 2 (HUNT 3 Fitness Study means by sex and ten-year age group), cited in `fitnessAge.ts`. The range uses a reading 8% higher or lower, the middle of the reported watch error.

Later, if many lifters have no VO₂ max: the non-exercise estimate (option 2) with an optional waist input, clearly labelled.

## Sources

- Nes BM et al. Fitness age: a new way to estimate... *Med Sci Sports Exerc* 2014. https://pmc.ncbi.nlm.nih.gov/articles/PMC4245230/ (see also the HUNT non-exercise model, Nes et al. 2011, and Loe et al. 2013 reference data)
- Non-exercise fitness model and mortality, HUNT follow-up: https://pmc.ncbi.nlm.nih.gov/articles/PMC4721596/
- Kodama S et al. *JAMA* 2009;301:2024. Mandsager K et al. *JAMA Netw Open* 2018;1:e183605. Kokkinos P et al. *JACC* 2022;80:598.
- Leong DP et al. *Lancet* 2015;386:266. Ruiz JR et al. *BMJ* 2008;337:a439. Momma H et al. *Br J Sports Med* 2022;56:755.
- Paluch AE et al. *Lancet Public Health* 2022;7:e219. Zhang D et al. *CMAJ* 2016;188:E53. Cappuccio FP et al. *Sleep* 2010;33:585. Hillebrand S et al. *Europace* 2013;15:742.
- FDA, General Wellness: Policy for Low Risk Devices (6 January 2026), summaries: https://www.foley.com/insights/publications/2026/01/digital-health-policy-fda-relaxes-restrictions-over-wearables-and-ai-decision-ma/ and https://www.kslaw.com/insights/articles/fda-updates-general-wellness-and-clinical-decision-support-guidance-documents
- Health Canada, Software as a Medical Device guidance (2019) and examples: https://www.canada.ca/en/health-canada/services/drugs-health-products/public-involvement-consultations/medical-devices/software-medical-device-draft-guidance/examples.html ; commentary: https://www.canadaregulatoryreview.com/eatclean-hearthealth-getyourstepsin-will-your-health-and-fitness-app-be-regulated-as-a-medical-device-in-canada
