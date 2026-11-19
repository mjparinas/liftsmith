"use client";

// Form video check-ins (Melvin, 2026-11-19, gap item 3; docs/decisions/trainer-mode.md "Form videos"). A client films a
// set with the app's own camera, or picks a clip, and sends it to their coach; the coach (or physio) watches it slowed
// down and pins notes to moments in it, and the client answers on the same notes. Pure web code (the camera through
// getUserMedia, which the Android and iOS web views already allow for rep counting; the clip through a file input;
// playback in a <video>), so Android, iOS and the web get it together. Under 18s can't send one (formVideos.ts).
import { useEffect, useMemo, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { AuthError, useAccount } from "@/lib/auth";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import {
  addVideoNote,
  baseType,
  clipProblem,
  clipSeconds,
  deleteVideo,
  deleteVideoNote,
  GET_READY,
  loadVideos,
  notePlace,
  openVideo,
  RECORD,
  recorderType,
  sendVideo,
  SPEEDS,
  stamp,
  VIDEO_MAX,
  type ClipProblem,
  type FormVideo,
  type SendState,
  type VideoNote,
} from "@/lib/formVideo";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { useApp } from "@/lib/store";
import { trainerError, videosSeen, type Person } from "@/lib/trainer";

import { Icon } from "./icons";
import { canUseCamera } from "./PhotoCamera";
import { go, goBack, historyDepth } from "./router";
import { Button, Chip, CountDot, EmptyState, ScreenHeader, Section, Sheet } from "./ui";

const errText = (e: unknown) => {
  if (e instanceof AuthError) {
    if (e.message === "upload") return t("fv.err.upload");
    if (e.message === "off") return t("fv.err.off");
    if (e.message === "teen") return t("fv.teen");
    if (e.message === "full") return t("fv.err.full");
    if (e.message === "big") return t("fv.err.big");
    if (e.message === "long") return t("fv.err.long", { secs: VIDEO_MAX.secs });
  }
  return trainerError(e);
};
const problemText = (p: ClipProblem) => (p === "long" ? t("fv.err.long", { secs: VIDEO_MAX.secs }) : t(`fv.err.${p}` as "fv.err.type"));

/** Every video this account sent or was sent, from the copy on the device first, then the server's. */
function useVideos(version = 0) {
  const signedIn = useAccount((s) => !!s.account);
  const [state, setState] = useState<{ videos: FormVideo[]; send: SendState } | null>(null);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    liveRead("coach.videos", loadVideos, (v) => {
      if (live) setState({ videos: Array.isArray(v?.videos) ? v.videos : [], send: v?.send ?? "off" });
    }).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [signedIn, version]);
  return state;
}

const liftLabel = (v: Pick<FormVideo, "lift">) => v.lift || t("fv.untitled");
const waitingOn = (v: FormVideo) => (v.unseen ? 1 : 0) + v.newNotes;

/** A row for one video: the lift, when, how many notes, and a red count for what's new. */
function VideoRow({ v, who }: { v: FormVideo; who?: string }) {
  const n = waitingOn(v);
  return (
    <li>
      <button
        type="button"
        onClick={() => go("trainer", `v.${v.id}`)}
        className="press card flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raised text-violet">
          <Icon name="play" size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{liftLabel(v)}</span>
          <span className="block truncate text-sm text-muted">
            {who ? `${who} · ` : ""}
            {date(v.at, { month: "short", day: "numeric" })} · {v.notes.length ? t("fv.notes", { count: v.notes.length }) : t("fv.noNotes")}
          </span>
        </span>
        <CountDot n={n} />
        {n > 0 && <span className="sr-only">{v.unseen ? t("fv.new") : t("fv.newNotes", { count: v.newNotes })}</span>}
        <Icon name="chevronRight" size={18} />
      </button>
    </li>
  );
}

/** The client's side, on their Coaching page: send a video to a coach, and the ones they sent with the coach's notes. */
export function ClientVideos({ coaches }: { coaches: Person[] }) {
  const [version, setVersion] = useState(0);
  const data = useVideos(version);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  if (!coaches.length || !data) return null;
  const ids = new Set(coaches.map((c) => c.id));
  const mine = data.videos.filter((v) => ids.has(v.coachId));
  if (data.send === "off" && !mine.length) return null;
  const waiting = mine.reduce((n, v) => n + waitingOn(v), 0);
  const nameOf = (id: string) => coaches.find((c) => c.id === id)?.name || t("trn.noName");
  return (
    <Section title={t("fv.title")} icon="camera" right={<CountDot n={waiting} />}>
      <div className="space-y-3">
        <p className="px-1 text-sm text-muted">{data.send === "teen" ? t("fv.teen") : t("fv.hint")}</p>
        {data.send === "ok" && (
          <Button className="w-full" kind="ghost" icon="camera" onClick={() => setOpen(true)}>
            {t("fv.send")}
          </Button>
        )}
        {done && (
          <p role="status" className="px-1 text-sm text-good">
            {done}
          </p>
        )}
        {mine.length > 0 && (
          <ul className="space-y-2">
            {mine.map((v) => (
              <VideoRow key={v.id} v={v} who={coaches.length > 1 ? nameOf(v.coachId) : undefined} />
            ))}
          </ul>
        )}
      </div>
      <SendSheet
        open={open}
        coaches={coaches}
        onClose={() => setOpen(false)}
        onSent={(v) => {
          setOpen(false);
          setDone(t("fv.sent", { name: nameOf(v.coachId) }));
          setVersion((n) => n + 1);
        }}
      />
    </Section>
  );
}

/** The coach's side, on a client's page: the videos that client sent, newest first. */
export function CoachVideos({ clientId, name, teen }: { clientId: string; name: string; teen: boolean }) {
  const data = useVideos();
  if (!data || (data.send === "off" && !data.videos.length)) return null;
  const theirs = data.videos.filter((v) => v.clientId === clientId);
  const waiting = theirs.reduce((n, v) => n + waitingOn(v), 0);
  const who = name || t("trn.noName");
  return (
    <Section title={t("fv.title")} icon="camera" right={<CountDot n={waiting} />}>
      <div className="space-y-3">
        <p className="px-1 text-sm text-muted">{teen ? t("fv.teenCoach") : t("fv.hintCoach", { name: who })}</p>
        {theirs.length > 0 ? (
          <ul className="space-y-2">
            {theirs.map((v) => (
              <VideoRow key={v.id} v={v} />
            ))}
          </ul>
        ) : (
          !teen && <p className="px-1 text-sm text-muted">{t("fv.none")}</p>
        )}
      </div>
    </Section>
  );
}

// --- Sending ---

interface Clip {
  file: Blob;
  type: string;
  secs: number;
}

/** The lifter's most recent lifts, newest first, as names in their language: the usual answer to "which lift?". */
function useRecentLifts(): string[] {
  const events = useApp((s) => s.events);
  return useMemo(() => {
    const out: string[] = [];
    for (let i = events.length - 1; i >= 0 && out.length < 6; i--) {
      const e = events[i]!;
      if (e.type !== "set") continue;
      const name = EXERCISE_BY_ID.get(e.exerciseId)?.name;
      if (name && !out.includes(name)) out.push(name);
    }
    return out;
  }, [events]);
}

function SendSheet({
  open,
  coaches,
  onClose,
  onSent,
}: {
  open: boolean;
  coaches: Person[];
  onClose: () => void;
  onSent: (v: FormVideo) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={t("fv.send")}>
      {open && <SendBody coaches={coaches} onSent={onSent} />}
    </Sheet>
  );
}

function SendBody({ coaches, onSent }: { coaches: Person[]; onSent: (v: FormVideo) => void }) {
  const lifts = useRecentLifts();
  const [coach, setCoach] = useState(coaches[0]!.id);
  const [lift, setLift] = useState(lifts[0] ?? "");
  const [question, setQuestion] = useState("");
  const [clip, setClip] = useState<Clip | null>(null);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const clipUrl = useMemo(() => (clip ? URL.createObjectURL(clip.file) : undefined), [clip]);
  useEffect(() => () => void (clipUrl && URL.revokeObjectURL(clipUrl)), [clipUrl]);
  useEffect(() => () => abort.current?.abort(), []);
  const coachName = coaches.find((c) => c.id === coach)?.name || t("trn.noName");

  const take = async (file: Blob, type: string, secs?: number) => {
    const c = { file, type: baseType(type) || type, secs: secs ?? (await clipSeconds(file)) };
    const p = clipProblem({ type: c.type, bytes: file.size, secs: c.secs });
    if (p) {
      oops();
      setError(problemText(p));
      return;
    }
    setError(null);
    setClip(c);
  };

  const send = async () => {
    if (!clip) return;
    setError(null);
    setProgress(0);
    abort.current = new AbortController();
    try {
      const v = await sendVideo(clip, { coach, lift: lift.trim(), question: question.trim() }, setProgress, abort.current.signal);
      haptic("success");
      sound.log();
      track("feature", { name: "formVideo", detail: "sent" });
      onSent(v);
    } catch (e) {
      if (e instanceof AuthError && e.message === "cancelled") return;
      oops();
      setError(errText(e));
    } finally {
      setProgress(null);
    }
  };

  if (recording)
    return (
      <Recorder
        onCancel={() => setRecording(false)}
        onDone={(file, type, secs) => {
          setRecording(false);
          void take(file, type, secs);
        }}
      />
    );

  const sending = progress !== null;
  return (
    <div className="space-y-4">
      {coaches.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold">{t("fv.to")}</p>
          <div className="flex flex-wrap gap-2">
            {coaches.map((c) => (
              <Chip key={c.id} active={coach === c.id} onClick={() => setCoach(c.id)}>
                {c.name || t("trn.noName")}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold">{t("fv.lift")}</p>
        {lifts.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {lifts.map((l) => (
              <Chip key={l} active={lift === l} onClick={() => setLift(l)}>
                {l}
              </Chip>
            ))}
          </div>
        )}
        <input
          value={lift}
          onChange={(e) => setLift(e.target.value.slice(0, VIDEO_MAX.lift))}
          placeholder={t("fv.liftPlaceholder")}
          aria-label={t("fv.lift")}
          className="min-h-11 w-full rounded-xl border border-line bg-raised px-3"
        />
      </div>
      <div>
        <label htmlFor="fv-question" className="mb-2 block text-sm font-semibold">
          {t("fv.question")}
        </label>
        <textarea
          id="fv-question"
          value={question}
          rows={2}
          onChange={(e) => setQuestion(e.target.value.slice(0, VIDEO_MAX.question))}
          placeholder={t("fv.questionPlaceholder")}
          className="w-full rounded-xl border border-line bg-raised px-3 py-2"
        />
      </div>
      {clip && clipUrl ? (
        <div className="space-y-2">
          <video src={clipUrl} controls muted playsInline aria-label={t("fv.preview")} className="max-h-64 w-full rounded-2xl bg-black" />
          <p className="num px-1 text-sm text-muted">{stamp(clip.secs * 1000)}</p>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {canUseCamera() && (
          <Button kind="ghost" icon="camera" disabled={sending} onClick={() => setRecording(true)}>
            {clip ? t("fv.cam.retake") : t("fv.record")}
          </Button>
        )}
        <label
          className={`press card flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm font-semibold ${canUseCamera() ? "" : "col-span-2"}`}
        >
          <Icon name="image" size={18} />
          {clip ? t("fv.change") : t("fv.choose")}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={sending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void take(f, f.type);
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
      {sending ? (
        <div className="space-y-2">
          <div
            role="progressbar"
            aria-label={t("fv.sendTo", { name: coachName })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((progress ?? 0) * 100)}
            className="h-2 overflow-hidden rounded-full bg-raised"
          >
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
          </div>
          <p className="num text-sm text-muted">{t("fv.sending", { pct: Math.round((progress ?? 0) * 100) })}</p>
          <Button kind="quiet" className="w-full" onClick={() => abort.current?.abort()}>
            {t("fv.cancel")}
          </Button>
        </div>
      ) : (
        <Button className="w-full" icon="send" disabled={!clip} onClick={() => void send()}>
          {t("fv.sendTo", { name: coachName })}
        </Button>
      )}
      <p className="px-1 text-xs text-muted">{t("fv.private", { name: coachName })}</p>
    </div>
  );
}

/** The app's own camera: a few seconds to get into place, then up to a minute of 720p, stopped by hand or by time. */
function Recorder({ onCancel, onDone }: { onCancel: () => void; onDone: (file: Blob, type: string, secs: number) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [failed, setFailed] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let s: MediaStream | undefined;
    let gone = false;
    (async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facing, width: { ideal: RECORD.width }, height: { ideal: RECORD.height } },
        });
        if (gone || !video.current) return s.getTracks().forEach((tr) => tr.stop());
        stream.current = s;
        video.current.srcObject = s;
        await video.current.play();
      } catch {
        if (!gone) setFailed(true);
      }
    })().catch(() => undefined);
    return () => {
      gone = true;
      s?.getTracks().forEach((tr) => tr.stop());
    };
  }, [facing]);

  useEffect(
    () => () => {
      if (rec.current?.state === "recording") rec.current.stop();
    },
    [],
  );

  const begin = () => {
    const s = stream.current;
    if (!s || typeof MediaRecorder === "undefined") return setFailed(true);
    const type = recorderType((x) => MediaRecorder.isTypeSupported(x));
    const chunks: Blob[] = [];
    let r: MediaRecorder;
    try {
      r = new MediaRecorder(s, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: RECORD.bitsPerSecond });
    } catch {
      return setFailed(true);
    }
    const t0 = Date.now();
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      const kind = r.mimeType || type || "video/webm";
      onDone(new Blob(chunks, { type: kind }), kind, (Date.now() - t0) / 1000);
    };
    r.start(1000);
    rec.current = r;
    setStartedAt(t0);
    setNow(t0);
    haptic("tap");
    sound.start();
  };

  // Get ready: one tick a second, then the camera starts keeping it.
  useEffect(() => {
    if (count === null) return;
    sound.tick();
    haptic("select");
    const id = setTimeout(() => {
      if (count <= 1) {
        setCount(null);
        begin();
      } else setCount(count - 1);
    }, 1000);
    return () => clearTimeout(id);
    // begin reads the live stream; it doesn't need to re-run the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const stop = () => {
    if (rec.current?.state === "recording") {
      rec.current.stop();
      haptic("tap");
    }
    setStartedAt(null);
  };

  // While recording, the time left, and the stop at a minute.
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n - startedAt >= VIDEO_MAX.secs * 1000) stop();
    }, 250);
    return () => clearInterval(id);
  }, [startedAt]);

  if (failed)
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-muted">
          {t("fv.cam.none")}
        </p>
        <Button kind="ghost" className="w-full" onClick={onCancel}>
          {t("fv.cancel")}
        </Button>
      </div>
    );

  const left = startedAt === null ? VIDEO_MAX.secs : Math.max(0, Math.ceil(VIDEO_MAX.secs - (now - startedAt) / 1000));
  const mirror = facing === "user" ? { transform: "scaleX(-1)" } : undefined;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("fv.cam.hint")}</p>
      <div className="relative mx-auto aspect-[9/16] max-h-[55vh] overflow-hidden rounded-2xl bg-black" data-no-swipe>
        <video ref={video} muted playsInline aria-label={t("fv.cam.live")} className="h-full w-full object-cover" style={mirror} />
        {count !== null && (
          <span aria-hidden className="display absolute inset-0 grid place-items-center text-7xl text-white">
            {count}
          </span>
        )}
        {startedAt !== null && (
          <span className="num absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-sm font-semibold text-white">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-bad" />
            {t("fv.cam.left", { secs: left })}
          </span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {count !== null ? t("fv.cam.ready", { count }) : startedAt !== null ? t("fv.cam.recording") : ""}
      </p>
      {startedAt !== null ? (
        <Button className="w-full" kind="danger" onClick={stop}>
          {t("fv.cam.stop")}
        </Button>
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button
            kind="ghost"
            icon="flip"
            label={t("fv.cam.flip")}
            disabled={count !== null}
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          >
            <span className="sr-only">{t("fv.cam.flip")}</span>
          </Button>
          {count !== null ? (
            <Button kind="ghost" onClick={() => setCount(null)}>
              {t("fv.cancel")}
            </Button>
          ) : (
            <Button icon="camera" onClick={() => setCount(GET_READY)}>
              {t("fv.cam.start")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Watching, with notes pinned to moments ---

/** One video on its own screen (#/trainer/v.<id>): the clip, slow motion, and the notes pinned along it. */
export function VideoScreen({ id }: { id: string }) {
  const me = useAccount((s) => s.account?.id ?? "");
  const [data, setData] = useState<{ video: FormVideo; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    openVideo(id).then(
      (d) => {
        if (!live) return;
        setData(d);
        videosSeen(waitingOn(d.video));
      },
      (e: unknown) => live && setError(e instanceof AuthError && e.message === "gone" ? t("fv.gone") : errText(e)),
    );
    return () => {
      live = false;
    };
  }, [id, version]);
  const back = {
    label: t("trn.back"),
    onClick: () => {
      if (historyDepth() > 0) return goBack();
      if (data && data.video.coachId === me) go("trainer", `c.${data.video.clientId}`);
      else go("trainer", "mine");
    },
  };
  if (error)
    return (
      <div className="pb-2">
        <ScreenHeader back={back} title={t("fv.untitled")} />
        <EmptyState icon="info" title={error} />
      </div>
    );
  if (!data) return <ScreenHeader back={back} title={t("fv.loading")} />;
  return <Player key={data.url} video={data.video} url={data.url} me={me} back={back} onChange={() => setVersion((n) => n + 1)} />;
}

function Player({
  video: v,
  url,
  me,
  back,
  onChange,
}: {
  video: FormVideo;
  url: string;
  me: string;
  back: { label: string; onClick: () => void };
  onChange: () => void;
}) {
  const el = useRef<HTMLVideoElement>(null);
  const [notes, setNotes] = useState<VideoNote[]>(v.notes);
  const [at, setAt] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [writing, setWriting] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coachSide = v.coachId === me;
  const sorted = [...notes].sort((a, b) => a.ms - b.ms || a.at - b.at);

  useEffect(() => {
    if (el.current) el.current.playbackRate = speed;
  }, [speed]);

  const seek = (ms: number) => {
    const x = el.current;
    if (!x) return;
    x.pause();
    x.currentTime = ms / 1000;
    setAt(ms);
    haptic("select");
  };
  const startNote = () => {
    const x = el.current;
    x?.pause();
    setWriting(Math.round((x?.currentTime ?? 0) * 1000));
    setText("");
  };
  const save = async () => {
    if (writing === null || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const n = await addVideoNote(v.id, writing, text.trim());
      setNotes((list) => [...list, n]);
      setWriting(null);
      setText("");
      haptic("success");
      sound.log();
      track("feature", { name: "formVideo", detail: coachSide ? "coachNote" : "clientNote" });
    } catch (e) {
      oops();
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const removeNote = async (n: VideoNote) => {
    try {
      await deleteVideoNote(n.id);
      setNotes((list) => list.filter((x) => x.id !== n.id));
      haptic("toggle");
    } catch (e) {
      oops();
      setError(errText(e));
    }
  };
  const remove = async () => {
    if (!sure) return setSure(true);
    try {
      await deleteVideo(v.id);
      haptic("toggle");
      back.onClick();
      onChange();
    } catch (e) {
      oops();
      setError(errText(e));
    }
  };

  return (
    <div className="desk-col pb-2">
      <ScreenHeader back={back} kicker={date(v.at, { weekday: "short", month: "short", day: "numeric" })} title={liftLabel(v)} />
      {v.question && (
        <div className="card mt-4 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("fv.asked")}</p>
          <p className="mt-1 whitespace-pre-line">{v.question}</p>
        </div>
      )}
      <div className="mt-4" data-no-swipe>
        <video
          ref={el}
          src={url}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={t("fv.video", { lift: liftLabel(v) })}
          onTimeUpdate={(e) => setAt(Math.round(e.currentTarget.currentTime * 1000))}
          className="max-h-[60vh] w-full rounded-2xl bg-black"
        />
        {/* Where the notes sit along the clip; the list below is how to reach each one. */}
        <div aria-hidden className="relative mx-1 mt-2 h-3 rounded-full bg-raised">
          <span className="absolute inset-y-0 left-0 rounded-full bg-accent/40" style={{ width: `${notePlace(at, v.secs)}%` }} />
          {sorted.map((n) => (
            <span
              key={n.id}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-violet"
              style={{ left: `${notePlace(n.ms, v.secs)}%` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t("fv.speed")}>
        <span className="text-sm text-muted">{t("fv.speed")}</span>
        {SPEEDS.map((s) => (
          <Chip key={s} active={speed === s} onClick={() => setSpeed(s)}>
            {`${s}×`}
          </Chip>
        ))}
      </div>
      <Section title={t("fv.notesTitle")} icon="flag">
        <div className="space-y-3">
          <p className="px-1 text-sm text-muted">
            {coachSide ? t("fv.notesHintCoach") : sorted.length ? t("fv.notesHintClient") : t("fv.noNotesYet")}
          </p>
          {sorted.length > 0 && (
            <ul className="space-y-2">
              {sorted.map((n) => (
                <li key={n.id} className="card flex items-start gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => seek(n.ms)}
                    className="press flex min-h-11 min-w-0 flex-1 items-start gap-3 p-2 text-left"
                  >
                    <span className="num shrink-0 rounded-lg bg-violet/15 px-2 py-0.5 text-sm font-bold text-violet">{stamp(n.ms)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="sr-only">{t("fv.seek", { time: stamp(n.ms) })}</span>
                      <span className="block whitespace-pre-line">{n.text}</span>
                      <span className="block text-xs text-muted">
                        {n.authorId === me ? t("fv.you") : coachSide ? t("trn.client") : t("fv.coach")}
                      </span>
                    </span>
                  </button>
                  {n.authorId === me && (
                    <button
                      type="button"
                      onClick={() => void removeNote(n)}
                      aria-label={t("fv.deleteNote")}
                      className="press grid h-11 w-11 shrink-0 place-items-center text-muted"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {writing !== null ? (
            <div className="card space-y-2 p-3">
              <label htmlFor="fv-note" className="block text-sm font-semibold">
                {t("fv.noteAt", { time: stamp(writing) })}
              </label>
              <textarea
                id="fv-note"
                value={text}
                rows={3}
                // The lifter just asked to write here, so the box takes the keyboard.
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={(e) => setText(e.target.value.slice(0, VIDEO_MAX.note))}
                placeholder={t("fv.notePlaceholder")}
                className="w-full rounded-xl border border-line bg-raised px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button kind="ghost" onClick={() => setWriting(null)}>
                  {t("fv.cancel")}
                </Button>
                <Button disabled={busy || !text.trim()} onClick={() => void save()}>
                  {t("fv.save")}
                </Button>
              </div>
            </div>
          ) : (
            notes.length < VIDEO_MAX.notes && (
              <Button className="w-full" icon="plus" onClick={startNote}>
                {t("fv.addAt", { time: stamp(at) })}
              </Button>
            )
          )}
          {error && (
            <p role="alert" className="text-sm text-bad">
              {error}
            </p>
          )}
        </div>
      </Section>
      <Button kind="danger" className="mt-6 w-full" onClick={() => void remove()}>
        {sure ? t("fv.deleteSure") : t("fv.delete")}
      </Button>
    </div>
  );
}
