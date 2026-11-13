// The shape of the website's translated text (src/lib/siteLang.ts): the home page, the pricing page and the frame
// around them (header, footer, store badges, calls to action). One file per language beside this one; English (en.ts)
// is the source and reads its questions and plan lists from src/lib/faqs.ts and src/lib/plans.ts, so the English
// site, the help page and the Inbox's drafted replies never disagree. Placeholders in braces are filled with `fill()`:
// {name} the app's name, {days} the trial length, {n} a count, {monthly} and {annual} the prices, {perMonth} the
// annual price per month, {store} a store's name.
import type { Faq } from "@/lib/faqs";

export interface Titled {
  title: string;
  body: string;
}

export interface SiteText {
  chrome: {
    nav: { features: string; exercises: string; guides: string; blog: string; tools: string; pricing: string; faq: string };
    /** aria-label of the header nav, the narrow screens' menu button and its list. */
    siteNav: string;
    menu: string;
    siteMenu: string;
    signIn: string;
    startFree: string;
    tagline: string;
    footerBlurb: string;
    cols: { product: string; learn: string; tools: string; support: string; company: string };
    links: {
      openApp: string;
      features: string;
      whoFor: string;
      /** The gym finder's pages (/gyms/). */
      gyms: string;
      coaches: string;
      pricing: string;
      whatsNew: string;
      exercises: string;
      muscles: string;
      equipment: string;
      guides: string;
      blog: string;
      plates: string;
      oneRm: string;
      warmUp: string;
      rpe: string;
      standards: string;
      dots: string;
      tdee: string;
      help: string;
      contact: string;
      status: string;
      deleteAccount: string;
      about: string;
      compare: string;
      fromStrong: string;
      fromHevy: string;
      privacy: string;
      terms: string;
      trust: string;
      accessibility: string;
    };
    /** The store badge credit the badge guidelines ask for. */
    trademarks: string;
    language: string;
    breadcrumb: string;
    banner: { label: string; points: [string, string, string, string]; button: string };
    sticky: string;
    badges: { playSmall: string; appleSmall: string; soon: string; comingSoon: string; web: string };
  };
  home: {
    title: string;
    shareTitle: string;
    description: string;
    eyebrow: string;
    h1a: string;
    h1b: string;
    lede: string;
    cta: string;
    demosButton: string;
    checks: [string, string, string, string];
    glance: string;
    facts: { value: string; label: string }[];
    how: {
      eyebrow: string;
      title: string;
      /** A link under the first step to the gym finder (/gyms/). */ findGym: string;
      steps: Titled[];
      cta: string;
    };
    features: {
      eyebrow: string;
      title: string;
      /** In the order of FEATURE_SHOTS in HomeView. */
      items: { eyebrow: string; title: string; body: string; points: string[]; alt: string; cta: string }[];
    };
    mid: { title: string; body: string; cta: string };
    demos: { eyebrow: string; title: string; body: string; cta: string; picker: string };
    more: {
      eyebrow: string;
      title: string;
      /** Link to /features/ (the full list and the connections table; English only for now). */ all: string;
      items: Titled[];
    };
    juice: { eyebrow: string; title: string; body: string; cta: string; alt: string };
    quotes: { eyebrow: string; title: string; sample: string; looking: string; lookingRest: string; cta: string };
    pricing: {
      eyebrow: string;
      title: string;
      body: string;
      free: string;
      forever: string;
      startFree: string;
      daysFree: string;
      perYear: string;
      perMonth: string;
      /** "About $3.33 a month, or $6.99 a month" */
      priceNote: string;
      trialCta: string;
      /** The coach band under the plans, linking to /coaches/. */
      coachLead: string;
      coachRest: string;
      coachCta: string;
      billed: string;
    };
    faq: { eyebrow: string; title: string };
    final: { title: string; body: string; cta: string; pricing: string };
  };
  /** The hero's 3D lifter (HeroLift). */
  hero: {
    alt: string;
    figure: string;
    set: string;
    eachSide: string;
    reps: string;
    volume: string;
    e1rm: string;
    total: string;
    loading: string;
    paused: string;
    caption: string;
    /** The motion's phase labels (English, from src/lib/demo) in this language. */
    phases: Record<string, string>;
  };
  pricing: {
    title: string;
    description: string;
    h1: string;
    intro: string;
    included: string;
    notIncluded: string;
    compare: string;
    caption: string;
    feature: string;
    billing: string;
    termsBefore: string;
    termsLink: string;
    termsAfter: string;
    endTitle: string;
    endBody: string;
    /** Coach plans (src/lib/coachPlans.ts): Pro's few clients, Coach and Coach Plus. */
    coach: {
      title: string;
      intro: string;
      upTo: string;
      noLimit: string;
      inPro: string;
      orMonthly: string;
      free: string;
      cta: string;
    };
  };
  /** The page for coaches (/coaches/, CoachesView): trainer mode, what clients share, and what it costs. */
  coaches: {
    title: string;
    description: string;
    h1: string;
    intro: string;
    cta: string;
    how: { title: string; steps: Titled[] };
    see: { title: string; body: string; seesLabel: string; sees: string[]; neverLabel: string; never: string[] };
    cost: { title: string; body: string; contactBefore: string; contactLink: string };
    faqTitle: string;
    faqs: Faq[];
    endTitle: string;
    endBody: string;
  };
  /** The home page's questions (FAQS) and the pricing page's billing questions, in the same order as English. */
  faqs: Faq[];
  billing: Faq[];
  plans: {
    free: string[];
    pro: string[];
    /** PLAN_TABLE's group names and each group's feature names, in its order. */
    groups: string[];
    rows: string[][];
    never: string;
    annualPlan: string;
  };
}
