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
}

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
}

export interface FeedComment {
  id: string;
  handle: string;
  name: string;
  at: number;
  body: string;
  mine: boolean;
  /** The reader may delete it: their own comment, or any comment on their own post. */
  canDelete: boolean;
}

export type ActivityKind = "follow" | "request" | "like" | "comment" | "sent";
export interface ActivityItem {
  kind: ActivityKind;
  handle: string;
  name: string;
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
  exercises: 20,
  muscles: 6,
};

/** Lowercase letters, digits and underscores. */
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
export const cleanHandle = (v: unknown) => (typeof v === "string" ? v.trim().replace(/^@/, "").toLowerCase() : "");
