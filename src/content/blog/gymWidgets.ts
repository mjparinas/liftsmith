import type { Article } from "../articles";

// Blog: website widgets for official gyms (traffic idea 3, Melvin 2026-11-27, docs/decisions/gyms.md "Website widgets").
// Only what ships, and no other app named (seo.test.ts).
export const BLOG_GYM_WIDGETS: Article[] = [
  {
    slug: "gym-website-widgets",
    kind: "blog",
    title: "Put your class schedule and equipment on your gym's website",
    description:
      "Gyms on Liftsmith can now show their class schedule, equipment or a Find us on Liftsmith badge on their own website with one line of code.",
    date: "2026-11-27",
    tag: "Training",
    cta: "plan",
    body: [
      {
        p: "Most gym websites have a schedule page that was right the week it went up. Then a class moves, an instructor changes, a new rack arrives, and the page quietly drifts out of date while members ask at the front desk. If you already keep your gym's page on Liftsmith current, your website can now show the same thing, and you never update it twice.",
      },
      { h2: "Three widgets, one line of code each" },
      {
        ul: [
          "**Class schedule:** your week of classes, Monday first, with the time, the instructor and the room, and the dates a class is off.",
          "**Equipment:** the equipment your gym has, your dumbbell range, your amenities and prices, and a button that adds your gym to a member's Liftsmith with all of it.",
          "**Find us on Liftsmith badge:** a small badge that links to your gym's page, for your footer or your contact page.",
        ],
      },
      {
        p: "Each one comes in a light or dark look and in any of the ten languages Liftsmith speaks, so it fits the site it sits on.",
      },
      { cta: "plan" },
      { h2: "How to add one" },
      {
        ol: [
          "Claim your gym on Liftsmith if you haven't yet: find it in the app's gym finder and tap Is this your gym? Claim it.",
          "In the app, open your gym and tap Manage this gym's page. Widgets for your website is near the poster.",
          "Pick a widget, a look and a language. The preview shows exactly what your visitors will see.",
          "Tap Copy code and paste it into an HTML, code or embed block on your website. Every popular website builder has one.",
        ],
      },
      {
        p: "That's it. When you change a class, mark a holiday or add equipment in the app, the widget on your website changes too, within about a quarter of an hour.",
      },
      { h2: "Safe and fast on your site" },
      {
        p: "We built the widgets so a gym owner never has to think twice about pasting them in. They run no scripts on your site, set no cookies and track nobody. The schedule and equipment widgets are a plain page in a sandboxed frame that loads only when a visitor scrolls near it, so they never slow your own page down. The badge is just an image with a link.",
      },
      {
        p: "If you ever release your gym's page, the widgets show a short line instead of your details, so your site never shows a broken box.",
      },
      {
        tip: "Put the equipment widget on your membership page. People choosing a gym want to know whether you have a squat rack and how heavy the dumbbells go, and the button under it lets them add your gym to their app before their first visit.",
      },
    ],
    faq: [
      ["Does it cost anything?", "No. Claiming your gym and the widgets are free."],
      [
        "Can I change how the widget looks?",
        "Pick the light or dark look and the language when you copy the code. To change the size, change the height in the code; the schedule scrolls inside its frame when your week is long.",
      ],
      [
        "Can members book a class from the widget?",
        "No. Liftsmith doesn't take bookings, so the schedule says to book with the gym directly. Add how to book in each class's note.",
      ],
    ],
  },
];
