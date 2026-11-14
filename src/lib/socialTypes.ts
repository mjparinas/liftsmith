// Shapes shared by the Friends feed's app side (src/lib/social.ts) and server (src/server/social.ts).
// Decision record: docs/decisions/friends.md.

/** One exercise in a posted workout. Weights are kilograms; the reader's own unit is used to show them. */
export interface PostExercise {
  /** The exercise id, so each reader sees the name in their own language. */
  id: string;
  /** The poster's name for it, for custom exercises the reader doesn't have. */
  name: string;
  sets: number;
  /** The best set: kilograms (null while the poster hides weights, or for bodyweight), reps (or seconds for holds). */
  w: number | null;
  r: number;
  /** Metres, for cardio logged with distance. */
  d?: number;
  /** Every set in order (weights null while the poster hides them), for the whole-workout view. Older posts have none. */
  log?: PostSet[];
  /** A new best (estimated one-rep max) on this exercise in this workout. */
  pr?: boolean;
}

/** One set in a posted workout: kilograms (or null), reps or seconds, and metres for cardio. */
export interface PostSet {
  w: number | null;
  r: number;
  d?: number;
}

/**
 * What a post carries: the workout summary only. Never heart rate, body weight or fat, measurements, cycle data,
 * injuries, gyms or places (the same rule as share cards, docs/decisions/sharing.md).
 */
export interface PostBody {
  v: 1;
  seconds: number;
  sets: number;
  /** Kilograms lifted in all, or null while the poster hides weights. */
  volume: number | null;
  prs: number;
  muscles: string[];
  exercises: PostExercise[];
}

/**
 * A real gym on a profile (Melvin, 2026-11-14): one of the finder's gyms (gymPlaces.ts), never a typed place. Its
 * name and city as the gym list has them, and its web page's path (/gyms/<city>/<slug>/).
 */
export interface HomeGym {
  id: string;
  name: string;
  city: string;
  path: string;
}

export interface SocialProfile {
  handle: string;
  name: string;
  /** A short line under the name (up to SOCIAL_LIMITS.tagline characters, through the word filter), or "". */
  tagline: string;
  /**
   * The lifter's home gym, picked from their gyms that are linked to a real gym, or null. Never for someone under
   * 18 (school teams, docs/decisions/school-teams.md). Shown to the same people who see the posts.
   */
  homeGym: HomeGym | null;
  /** Anyone can follow without asking. Off by default: follow requests need approval. */
  open: boolean;
  /** Post every finished workout without asking. Off by default. */
  autoPost: boolean;
  /** Show weights on posts. On by default, like share cards. */
  weights: boolean;
  /**
   * Anyone can see the profile and its workouts, in the app and on the web (www.getliftsmith.com/u/<handle>/,
   * listed in the people sitemap). Off by default; on also means anyone can follow.
   */
  public: boolean;
  /** Push notifications by kind (Friends settings › Notifications). Likes start off, the rest on. */
  push: PushPrefs;
  /** The picture beside the name (an AVATAR_IDS id), or "" for the name's first letter. */
  avatar: string;
  /** Who sees a new post unless the lifter picks otherwise when posting. */
  audience: Audience;
  /** Show the best lifts on the profile (only to people who can see the posts, and only while weights show). */
  showLifts: boolean;
  /** The best lifts last sent by the app, for the profile's showcase. */
  lifts: ShowcaseLift[];
  /** Can be suggested to people with a tie to the lifter (a mutual follow, a club, a tagged workout). On to start. */
  suggest: boolean;
  /** Mutual friends see when the lifter is mid-workout and can cheer (off to start; Friends gap list 2, item 4). */
  live: boolean;
  /**
   * Friends can cheer while the lifter shares their training (on to start; Melvin, 2026-11-12: "disable cheers in
   * settings"). Off hides the cheer buttons from friends, refuses new cheers and shows none on the workout screen.
   */
  cheers: boolean;
  /** The level and the training-week streak last sent by the app, shown on the profile to people who see the posts. */
  level: number;
  streak: number;
}

/**
 * Who sees a post: "all" is everyone who can see the profile (accepted followers, or anyone while it's public),
 * "friends" only people the lifter and they both follow, "me" only the lifter.
 */
export const AUDIENCES = ["all", "friends", "me"] as const;
export type Audience = (typeof AUDIENCES)[number];

/** One lift on a profile's showcase: the exercise id, its best set (kilograms and reps) and when it was done. */
export interface ShowcaseLift {
  id: string;
  w: number;
  r: number;
  at: number;
}

/**
 * Avatars (Melvin, 2026-11-11: "unlock different avatars through locker but have a few default ones"). The first
 * four are everyone's; the rest come from levels and badges (game.ts) and show in the Locker. The server only
 * checks the id is one of these, because unlocks are worked out from the lifter's own event log on the device.
 */
export const AVATAR_IDS = [
  "av-dumbbell",
  "av-bolt",
  "av-leaf",
  "av-moon",
  "av-target",
  "av-heart",
  "av-stretch",
  "av-mascot",
  "av-trophy",
  "av-flame",
  "av-pro",
] as const;
export type AvatarId = (typeof AVATAR_IDS)[number];

export interface PushPrefs {
  follows: boolean;
  comments: boolean;
  sent: boolean;
  likes: boolean;
  /** A friend's cheer during a workout (on to start). */
  cheers: boolean;
  /** A workout from someone the lifter rang the bell for (on to start; nothing comes until a bell is on). */
  posts: boolean;
  /** A friend checked in at the gym (Check in on Today; on to start). */
  checkins: boolean;
}

/** How the reader stands with someone. */
export type Relation = "self" | "none" | "requested" | "following" | "blocked";

export interface PersonCard {
  handle: string;
  name: string;
  /** Their tagline, or "". */
  tagline: string;
  /** Their home gym, only to people who can see their posts, and never for someone under 18. */
  homeGym: HomeGym | null;
  followers: number;
  following: number;
  posts: number;
  relation: Relation;
  /** They follow the reader. */
  followsYou: boolean;
  /** Whether their posts are visible to the reader. */
  canSee: boolean;
  open: boolean;
  public: boolean;
  avatar: string;
  /** The reader has muted them: their posts stay out of the reader's feed. */
  muted: boolean;
  /** The reader rang the bell: a push when they post a workout the reader may see (only while following). */
  bell: boolean;
  /** Their best lifts, when they show them and the reader can see their posts. */
  lifts: ShowcaseLift[];
  /** Their level and training-week streak (0 when the reader can't see their posts, or not sent yet). */
  level: number;
  streak: number;
  /** When each workout they posted in the last 12 weeks started (ms), from posts the reader may see. */
  trained: number[];
}

/** Why someone is suggested: they follow the lifter, they're followed by people the lifter follows, a club, a tag. */
export type SuggestReason = "followsYou" | "mutual" | "club" | "partner";

/** Someone the lifter may know, with the strongest tie as the reason. */
export interface Suggestion {
  handle: string;
  name: string;
  avatar: string;
  reason: SuggestReason;
  /** For "mutual": how many people the lifter follows also follow them, and one of their names. For "club": its name. */
  count?: number;
  via?: string;
  open: boolean;
}

/** One person in a list: followers, following, search results. */
export interface PersonRow {
  handle: string;
  name: string;
  avatar: string;
  at?: number;
}

export interface FeedPost {
  id: string;
  handle: string;
  name: string;
  /** When the workout started (ms). */
  at: number;
  body: PostBody;
  likes: number;
  liked: boolean;
  comments: number;
  mine: boolean;
  avatar: string;
  /** The poster's own words about the workout, or "". */
  caption: string;
  audience: Audience;
  /** Training partners the poster tagged (mutual friends). */
  partners: Partner[];
  /** The reader is one of them (they can remove themselves). */
  tagged: boolean;
}

/** A training partner tagged on a post. */
export interface Partner {
  handle: string;
  name: string;
  avatar: string;
}

export interface FeedComment {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  at: number;
  body: string;
  mine: boolean;
  /** The reader may delete it: their own comment, or any comment on their own post. */
  canDelete: boolean;
  /** For a reply, the top comment it answers (replies sit one level deep). */
  replyTo?: string;
}

export type ActivityKind = "follow" | "request" | "like" | "comment" | "sent" | "challenge" | "tag" | "mention" | "reply" | "cheer";
export interface ActivityItem {
  kind: ActivityKind;
  handle: string;
  name: string;
  avatar: string;
  at: number;
  postId?: string;
  /** The comment's text, for comments; the workout's name, for a sent workout. */
  text?: string;
  /** A sent workout's routine code (opens #/routine/<code>). */
  code?: string;
}

export type ReportKind = "post" | "comment" | "profile";
export const REPORT_REASONS = [
  "spam",
  "abuse",
  "hate",
  "sexual",
  "danger",
  "impersonation",
  "name",
  "underage",
  "cheating",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * The fixed reasons offered for each kind of report (docs/decisions/moderation.md). A profile has its own list:
 * pretending to be someone, an offensive name, handle or tagline, someone under 13 and fake lifts only make sense there
 * (fake lifts on a post too). "Something else" is always last and is the one that asks for a note.
 */
export const REASONS_FOR: Record<ReportKind, readonly ReportReason[]> = {
  post: ["spam", "abuse", "hate", "sexual", "danger", "cheating", "other"],
  comment: ["spam", "abuse", "hate", "sexual", "danger", "other"],
  profile: ["spam", "abuse", "hate", "impersonation", "name", "underage", "cheating", "other"],
};
/** A report's optional note (only staff read it). */
export const REPORT_NOTE_MAX = 280;

/**
 * What the lifter is told after staff acted on their profile (moderation.md): a warning (until they say Got it), a
 * suspension with its end, or a ban. A shadow ban is never told.
 */
export interface ModerationNotice {
  kind: "warn" | "suspend" | "ban";
  /** The report reason staff picked, or "" for none given. */
  reason: ReportReason | "";
  at: number;
  /** When a suspension ends; null for a ban or a warning. */
  until: number | null;
}

export const SOCIAL_LIMITS = {
  handleMin: 3,
  handleMax: 20,
  name: 40,
  /** A profile's tagline (Melvin, 2026-11-14: "about 60 characters"). */
  tagline: 60,
  comment: 280,
  caption: 280,
  lifts: 3,
  partners: 5,
  challengeName: 40,
  /** People in one challenge, the starter included. */
  challengeMembers: 20,
  /** Challenges one lifter can have running that they started. */
  challengesActive: 10,
  clubName: 40,
  /** People in one club, the starter included. */
  clubMembers: 100,
  /** People in an official gym's club (docs/decisions/gyms.md): a whole gym's members, not a crew. */
  gymClubMembers: 1000,
  /** Clubs one lifter can be in. */
  clubsEach: 10,
  exercises: 20,
  /** Sets kept per exercise in a post's log. */
  setsEach: 30,
  muscles: 6,
  /** People suggested at once, and search results. */
  suggestions: 20,
  /** Letters needed before a name search runs. */
  searchMin: 2,
  /** Weeks of a profile's training calendar. */
  calendarWeeks: 12,
  /** Bell pushes sent for one post (people who rang the bell for the poster). */
  bellsPerPost: 500,
};

/** Lowercase letters, digits and underscores. */
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
export const cleanHandle = (v: unknown) => (typeof v === "string" ? v.trim().replace(/^@/, "").toLowerCase() : "");

/** One person on the friends leaderboard: what they've posted this week that the reader may see. */
export interface BoardRow {
  handle: string;
  name: string;
  avatar: string;
  /** The reader's own row. */
  me: boolean;
  workouts: number;
  sets: number;
  minutes: number;
  /** Kilograms, from posts that show weights. */
  volume: number;
  prs: number;
}
export const BOARD_METRICS = ["workouts", "sets", "minutes", "volume"] as const;
export type BoardMetric = (typeof BOARD_METRICS)[number];

/** Who sent an invite link, as the invite screen shows them. */
export interface Inviter {
  handle: string;
  name: string;
  avatar: string;
}

/** How long a friend challenge runs, in days. */
export const CHALLENGE_DAYS = [7, 14, 28] as const;
/** How many days after a challenge ends its result still shows as a coach's note (gap list 3, item 5). */
export const RESULT_NOTE_DAYS = 3;
export type ChallengeDays = (typeof CHALLENGE_DAYS)[number];

/** One person in a challenge, with their score so far (joined members only score). */
export interface ChallengeMember {
  handle: string;
  name: string;
  avatar: string;
  me: boolean;
  joined: boolean;
  value: number;
}

/** A friend challenge as one member sees it. */
export interface Challenge {
  id: string;
  /** The starter's name for it, or "" (the app names it after the measure). */
  name: string;
  metric: BoardMetric;
  startsAt: number;
  endsAt: number;
  owner: { handle: string; name: string };
  /** The reader started it (leaving ends it for everyone). */
  mine: boolean;
  status: "invited" | "joined";
  members: ChallengeMember[];
}

/** A club or gym crew in the lifter's list. */
export interface ClubSummary {
  id: string;
  name: string;
  members: number;
  /** The reader started it (they run it). */
  mine: boolean;
}

/** One club as a member sees it: its members, this week's board from their posts, and its join code. */
export interface ClubDetail extends ClubSummary {
  code: string;
  owner: { handle: string; name: string };
  rows: BoardRow[];
  /** The crew's goal for the week, everyone's posted workouts added up; null when the starter hasn't set one. */
  goal?: ClubGoal | null;
}

/** A mutual friend who has gone quiet: no post lately after training regularly before (coach's notes). */
export interface QuietFriend {
  handle: string;
  name: string;
  avatar: string;
  /** Their last post (ms). */
  lastAt: number;
  /** Workouts posted in the six weeks before they went quiet. */
  before: number;
}

/** Everything the coach's friend notes need, in one call (`nudges` op). */
export interface FriendSignals {
  week: BoardRow[];
  challenges: Challenge[];
  quiet: QuietFriend[];
  /** Challenges the lifter joined that ended in the last few days, for the result note (gap list 3, item 5). */
  ended?: Challenge[];
}

/** What a club's members add up to each week. */
export type ClubGoalMetric = "workouts" | "sets" | "minutes";
export interface ClubGoal {
  metric: ClubGoalMetric;
  target: number;
}
/** The biggest weekly goal for each measure, and the step the − and + buttons move it by. */
export const CLUB_GOAL: Record<ClubGoalMetric, { max: number; step: number; each: number }> = {
  workouts: { max: 500, step: 1, each: 3 },
  sets: { max: 20_000, step: 10, each: 60 },
  minutes: { max: 50_000, step: 30, each: 150 },
};

/** What the join screen shows before the lifter joins. */
export interface ClubPreview {
  id: string;
  name: string;
  members: number;
  owner: { handle: string; name: string };
  /** Already a member. */
  joined: boolean;
}

/** The cheers a friend can send mid-workout, like a video call's reactions. */
export const CHEERS = ["🔥", "💪", "👏", "🎉", "⚡"] as const;
/** One cheer per friend this often (the server refuses sooner ones; the Training now buttons count it down). */
export const CHEER_GAP = 5_000;
export type Cheer = (typeof CHEERS)[number];

/** A mutual friend who is training right now. */
export interface TrainingNow {
  handle: string;
  name: string;
  avatar: string;
  /** The exercise they're on, its id (the reader's app names it), and sets done of the workout's total. */
  exercise: string;
  done: number;
  total: number;
  startedAt: number;
  updatedAt: number;
  /** They take cheers (their "Let friends cheer me on" switch); false hides the cheer buttons. */
  cheers: boolean;
}

/** A cheer that reached the lifter during their workout. */
export interface CheerIn {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  emoji: Cheer;
  at: number;
}

/** A friend's check-in ("I'm at the gym"), shown as a toast until dismissed. `focus` is muscle ids, worded on the phone. */
export interface CheckinIn {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  gym: string;
  focus: string[];
  at: number;
}
