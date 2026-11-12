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

export interface SocialProfile {
  handle: string;
  name: string;
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
}

/** How the reader stands with someone. */
export type Relation = "self" | "none" | "requested" | "following" | "blocked";

export interface PersonCard {
  handle: string;
  name: string;
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

export type ActivityKind = "follow" | "request" | "like" | "comment" | "sent" | "challenge" | "tag" | "mention" | "reply";
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
export const REPORT_REASONS = ["spam", "abuse", "hate", "sexual", "danger", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const SOCIAL_LIMITS = {
  handleMin: 3,
  handleMax: 20,
  name: 40,
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
}

/** What the join screen shows before the lifter joins. */
export interface ClubPreview {
  id: string;
  name: string;
  members: number;
  owner: { handle: string; name: string };
  /** Already a member. */
  joined: boolean;
}
