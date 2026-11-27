import Foundation

/// The workout the phone is running, as the phone's WatchLink sends it (the same JSON as Android's).
struct WatchState: Decodable, Equatable {
    var title = ""
    var setLabel = ""
    var next = ""
    var plates = ""
    /// When rest ends, in ms since 1970; nil while lifting.
    var restUntil: Double?
    /// Heart rate the phone has from a Bluetooth monitor.
    var hr: Int?
    var vibrate = true
    /// A gentle tap 10 seconds before rest ends (Workout preferences), only when vibrate is on too.
    var warn = false
    var done: Int?
    var total: Int?
    var at: Double = 0
    var sessionId = ""
    /// Labs, watch rep counting: the phone wants the wrist's motion for this set.
    var motion = false
    /// Labs, hands-free watch sets: keep streaming through rest, so the phone sees the next set start.
    var motionRest = false
    /// Labs, hands-free watch sets: a new id means the set started or logged itself, and the watch taps once.
    var cue = ""
    /// Machine taken (src/lib/takenSwap.ts): what one tap swaps to; empty hides the button.
    var taken = ""
    /// Why the exercise is there after a Machine taken swap, or empty.
    var why = ""
    /// The set timer for holds, carries and cardio, phase by phase (src/lib/sessionNotify.ts TimerSegment).
    var timer: [Phase] = []
    /// What the crown and − / + can change on this set (watchAdjust.ts watchAdj).
    var adj: Adj?
    /// "How did it feel?" after an exercise's last set (watchAdjust.ts watchAsk).
    var ask: Ask?
    /// Start timer on a timed hold, carry or cardio set (src/lib/timerRun.ts watchTimerOffer); nil when there's none.
    var ts: Offer?
    /// What the timer says once a countdown has run out ("Time's up").
    var timerOver = ""
    /// The timer started on this watch before the phone's phases arrive (or with the phone asleep).
    private var started: [Phase] = []

    /// The set's weight ladder (kg, lightest first, empty for a bodyweight move) with the words for each, where the
    /// set's own weight is, and the reps. `key` names the set; the phone ignores values sent for another one.
    struct Adj: Decodable, Equatable {
        static let repsMax = 100
        var key: String
        var kg: [Double]
        var w: [String]
        var i: Int
        var reps: Int
        var rs: String

        var hasWeight: Bool { !kg.isEmpty }

        /// The ladder's step closest to `want` kg, so a choice survives the phone sending the ladder again around it.
        func nearest(_ want: Double) -> Int {
            var best = i
            for k in kg.indices where abs(kg[k] - want) < abs(kg[best] - want) { best = k }
            return best
        }

        static func clampReps(_ r: Int) -> Int { min(repsMax, max(1, r)) }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            key = try c.decode(String.self, forKey: .key)
            let kg = (try? c.decode([Double].self, forKey: .kg)) ?? []
            let w = (try? c.decode([String].self, forKey: .w)) ?? []
            let n = kg.count == w.count ? min(kg.count, 40) : 0
            self.kg = Array(kg.prefix(n))
            self.w = Array(w.prefix(n))
            i = (try? c.decode(Int.self, forKey: .i)) ?? 0
            reps = Adj.clampReps((try? c.decode(Int.self, forKey: .reps)) ?? 0)
            rs = (try? c.decode(String.self, forKey: .rs)) ?? ""
            if key.isEmpty || (n > 0 && !(0..<n).contains(i)) {
                throw DecodingError.dataCorruptedError(forKey: .i, in: c, debugDescription: "Not a ladder")
            }
            if n == 0 { i = 0 }
        }

        private enum CodingKeys: String, CodingKey { case key, kg, w, i, reps, rs }
    }

    /// The question, its three answers (`o`) and the rating each sends (`v`: 1 too easy, 0 about right, -1 too hard).
    struct Ask: Decodable, Equatable {
        var ex: String
        var q: String
        var o: [String]
        var v: [Int]
    }

    /// One phase of the set timer: counts down to `to` ("Time left", "Switch sides"…), or up from `from` with no end.
    struct Phase: Decodable, Equatable {
        /// ms since 1970, as the phone sends them.
        var from: Double
        var to: Double?
        var label: String

        var start: Date { Date(timeIntervalSince1970: from / 1000) }
        var end: Date? { to.map { Date(timeIntervalSince1970: $0 / 1000) } }
    }

    /// The set timer the set on screen offers: `s` seconds (a side, when `d` is 2) after 5 s to get set, or a count-up
    /// (`u`). The same rules as the phone's src/lib/setTimer.ts, so a timer started here matches the phone's to the second.
    struct Offer: Decodable, Equatable {
        static let leadMs: Double = 5000
        static let switchMs: Double = 5000
        var key: String
        var s: Int
        var d: Int
        var up: Bool
        /// The button's words ("Start timer · 0:40").
        var l: String
        /// Get set, the work phase, switch sides, side 2.
        var lb: [String]
        var o: String

        init(key: String, s: Int, d: Int, up: Bool, l: String, lb: [String], o: String) {
            self.key = key
            self.s = max(1, s)
            self.d = d == 2 ? 2 : 1
            self.up = up
            self.l = l
            self.lb = (lb + ["", "", "", ""]).prefix(4).map { $0 }
            self.o = o
        }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            let key = (try? c.decode(String.self, forKey: .key)) ?? ""
            let s = (try? c.decode(Int.self, forKey: .s)) ?? 0
            if key.isEmpty || s < 1 { throw DecodingError.dataCorruptedError(forKey: .s, in: c, debugDescription: "No timer") }
            self.init(
                key: key, s: s, d: (try? c.decode(Int.self, forKey: .d)) ?? 1, up: ((try? c.decode(Int.self, forKey: .u)) ?? 0) == 1,
                l: (try? c.decode(String.self, forKey: .l)) ?? "", lb: (try? c.decode([String].self, forKey: .lb)) ?? [],
                o: (try? c.decode(String.self, forKey: .o)) ?? ""
            )
        }

        private enum CodingKeys: String, CodingKey { case key, s, d, u, l, lb, o }

        /// The timer started at `start` (ms), phase by phase, as the phone's timerPhases lays it out.
        func phases(_ start: Double) -> [Phase] {
            let lead = start + Self.leadMs
            var out = [Phase(from: start, to: lead, label: lb[0])]
            if up { return out + [Phase(from: lead, to: nil, label: lb[1])] }
            let work = Double(s) * 1000
            out.append(Phase(from: lead, to: lead + work, label: lb[1]))
            if d == 2 {
                let sw = lead + work + Self.switchMs
                out.append(Phase(from: lead + work, to: sw, label: lb[2]))
                out.append(Phase(from: sw, to: sw + work, label: lb[3]))
            }
            return out
        }

        /// When a countdown started at `start` runs out (0 for a count-up, which runs until the set is logged).
        func end(_ start: Double) -> Double {
            up ? 0 : start + Self.leadMs + Double(s * d) * 1000 + (d == 2 ? Self.switchMs : 0)
        }

        /// What Log set saves at `at`: the seconds held ([reps], or [first side, second side] when stopped on the
        /// second side), or nil while getting set (the set as planned). Like setTimer.ts timerHeld.
        func held(_ start: Double, _ at: Double) -> [Int]? {
            let t = at - start - Self.leadMs
            if t < 0 { return nil }
            let secs = { (ms: Double) in max(1, Int(ms / 1000)) }
            if up { return [secs(t)] }
            let work = Double(s) * 1000
            if t < work { return [secs(t)] }
            if d == 1 || t < work + Self.switchMs { return [s] }
            let t2 = t - work - Self.switchMs
            return t2 < work ? [s, max(0, Int(t2 / 1000))] : [s]
        }
    }

    /// A workout the phone stopped talking about this long ago was forgotten (the phone ends those after 3 h).
    static let staleAfter: TimeInterval = 3 * 60 * 60

    static func parse(_ json: String?) -> WatchState? {
        guard let json, !json.isEmpty, let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WatchState.self, from: data)
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        title = (try? c.decode(String.self, forKey: .title)) ?? ""
        setLabel = (try? c.decode(String.self, forKey: .setLabel)) ?? ""
        next = (try? c.decode(String.self, forKey: .next)) ?? ""
        plates = (try? c.decode(String.self, forKey: .plates)) ?? ""
        restUntil = try? c.decode(Double.self, forKey: .restUntil)
        hr = try? c.decode(Int.self, forKey: .hr)
        vibrate = (try? c.decode(Bool.self, forKey: .vibrate)) ?? true
        warn = (try? c.decode(Bool.self, forKey: .warn)) ?? false
        done = try? c.decode(Int.self, forKey: .done)
        total = try? c.decode(Int.self, forKey: .total)
        at = (try? c.decode(Double.self, forKey: .at)) ?? 0
        sessionId = (try? c.decode(String.self, forKey: .sessionId)) ?? ""
        motion = (try? c.decode(Bool.self, forKey: .motion)) ?? false
        motionRest = (try? c.decode(Bool.self, forKey: .motionRest)) ?? false
        cue = (try? c.decode(String.self, forKey: .cue)) ?? ""
        taken = (try? c.decode(String.self, forKey: .taken)) ?? ""
        why = (try? c.decode(String.self, forKey: .why)) ?? ""
        let phases = (try? c.decode([Phase].self, forKey: .timer)) ?? []
        timer = Array(phases.filter { p in p.from > 0 && (p.to.map { to in to > p.from } ?? true) }.prefix(8))
        adj = try? c.decode(Adj.self, forKey: .adj)
        let ask = try? c.decode(Ask.self, forKey: .ask)
        self.ask = ask.flatMap { $0.o.count == 3 && $0.v.count == 3 && !$0.ex.isEmpty ? $0 : nil }
        ts = try? c.decode(Offer.self, forKey: .ts)
        timerOver = (try? c.decode(String.self, forKey: .timerOver)) ?? ts?.o ?? ""
    }

    private enum CodingKeys: String, CodingKey {
        case title, setLabel, next, plates, restUntil, hr, vibrate, warn, done, total, at, sessionId, motion, motionRest, cue, taken, why, timer, adj, ask, ts, timerOver
    }

    /// The set timer's phases: the phone's, or the ones this watch started on its own until the phone's arrive.
    var phases: [Phase] { timer.isEmpty ? started : timer }

    /// The set timer's phase at `now` (started, not ended); never while resting. Same rule as the phone's.
    func phase(at now: Date) -> Phase? {
        if resting(at: now) { return nil }
        return phases.first { $0.start <= now && ($0.end.map { now < $0 } ?? true) }
    }

    var timing: Bool { !phases.isEmpty }

    /// A countdown that has run out and waits for the phone to log the set.
    func timeUp(at now: Date) -> Bool {
        guard let end = phases.last?.end, !resting(at: now) else { return false }
        return now >= end
    }

    func canStartTimer(at now: Date) -> Bool { ts != nil && !resting(at: now) && !timing }

    /// This state with the timer this watch started for set `key` at `start` (ms), until the phone's phases arrive.
    func withStarted(_ key: String, _ start: Double) -> WatchState {
        guard let ts, ts.key == key, timer.isEmpty, start > 0 else { return self }
        var s = self
        s.started = ts.phases(start)
        return s
    }

    var restEnd: Date? { restUntil.map { Date(timeIntervalSince1970: $0 / 1000) } }

    func resting(at now: Date) -> Bool { (restEnd ?? .distantPast) > now }

    /// Whether to stream motion now: the phone asked for it, and rest hasn't started on this watch's clock (or the
    /// phone wants rest too, to see the next set start).
    func streamMotion(at now: Date) -> Bool { motion && (motionRest || !resting(at: now)) }

    /// Whether going from `prev` to this state should tap: a new cue during the same workout.
    func newCue(after prev: WatchState?) -> Bool {
        guard !cue.isEmpty, let prev, prev.sessionId == sessionId else { return false }
        return cue != prev.cue
    }

    func stale(at now: Date) -> Bool { at > 0 && now.timeIntervalSince1970 - at / 1000 > Self.staleAfter }

    /// The phone's times moved `ms` onto this watch's clock (WatchClock.offset): rest and every set timer phase.
    func shifted(by ms: Double) -> WatchState {
        guard ms != 0 else { return self }
        var s = self
        s.restUntil = restUntil.map { $0 + ms }
        s.timer = timer.map { p in Phase(from: p.from + ms, to: p.to.map { $0 + ms }, label: p.label) }
        return s
    }
}

/// Keeps the watch's countdowns on the phone's second (watch-apps.md "Same second as the phone"), like Android's
/// WatchClock.java: the phone sends rest and the set timer as times on its own clock plus when it sent them ("at"),
/// so the watch learns how far its clock is from the phone's and moves those times by it. An arrival earlier than
/// "at" can only be the watch running behind; a later one is mostly the trip over, so the watch only counts itself
/// ahead past 2 s.
struct WatchClock {
    static let samples = 16
    static let maxGap: Double = 60_000
    static let ahead: Double = 2_000
    private var gaps: [Double] = []

    mutating func heard(sentAt: Double, now: Double) {
        guard sentAt > 0 else { return }
        let gap = now - sentAt
        guard abs(gap) <= Self.maxGap else { return }
        gaps.append(gap)
        if gaps.count > Self.samples { gaps.removeFirst(gaps.count - Self.samples) }
    }

    /// How far this watch's clock is ahead of the phone's (negative: behind), in ms.
    var offset: Double {
        guard let least = gaps.min() else { return 0 }
        if least < 0 { return least }
        return least > Self.ahead ? least : 0
    }
}
