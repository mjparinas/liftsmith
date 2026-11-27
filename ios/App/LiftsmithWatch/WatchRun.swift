import Foundation

/// Today's plan as the phone carries it for a workout on the watch with the phone away (src/lib/watchWorkout.ts
/// Carry): every Log set worked out ahead, with its words already in the app's language.
struct Carry: Codable, Equatable {
    struct Item: Codable, Equatable {
        var n: String
        var rt: String
        var q: String
        var kg: [Double]
        var w: [String]
        var rs: String
    }

    struct Step: Codable, Equatable {
        var e: Int
        var l: String
        var t: String
        var i: Int
        var r: Int
        var s: Int
        var f: Int?
        var a: Int?
        var c: Int?
        /// A timed hold: 1, or 2 for one side then the other; nil for reps. `r` is then the seconds.
        var m: Int?
        /// Its Start timer button's words.
        var tt: String?
    }

    var v: Int
    var id: String
    var day: String
    var title: String
    var why: String
    var vib: Bool
    var warn: Bool
    var o: [String]
    var done: String
    var fin: String
    var ex: [Item]
    var st: [Step]
    /// The timer's words when a step is a hold: get set, time left, side 1, switch sides, side 2, time's up.
    var tl: [String]?

    /// The watch's own date, like the phone's dayKey (src/lib/random.ts: "2026-11-5", no leading zeros).
    static func today(_ now: Date = Date()) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-M-d"
        return f.string(from: now)
    }

    /// Today's carried plan, if it's one the watch can run on `day`.
    static func parse(_ json: String?, day: String) -> Carry? {
        guard let json, let data = json.data(using: .utf8), let c = try? JSONDecoder().decode(Carry.self, from: data),
              c.v == 1, c.day == day, !c.st.isEmpty, c.st.allSatisfy({ c.ex.indices.contains($0.e) }) else { return nil }
        return c
    }
}

/// A workout run on the watch with the phone away (docs/decisions/watch-apps.md "Phone-free workouts"). The watch only
/// walks through the phone's steps, and draws itself in the same JSON the phone sends for its own workouts
/// (WatchState), so the screen and the taps work as they do with the phone. The same rules as Wear OS's WatchRun.java.
struct WatchRun: Codable, Equatable {
    /// A run this old was forgotten on the wrist: it's finished with what was logged.
    static let forgottenAfter: Double = 4 * 60 * 60 * 1000
    static let maxSets = 120

    var carry: Carry
    var id: String
    /// ms since 1970, like the phone.
    var start: Double
    var k = 0
    var kg: Double = -1
    var reps = 1
    var restUntil: Double = 0
    var setFrom: Double
    var ask = -1
    /// When Start timer was tapped on the hold on screen (ms), or nil.
    var timerAt: Double?
    /// Each Log set: [step, at, kg (-1: none), reps, set start] and, for a hold stopped on its second side, its seconds.
    var sets: [[Double]] = []
    var rates: [[Int]] = []
    var hrSum = 0
    var hrCount = 0
    var hrMax = 0
    var hrMin = 0

    init(carry: Carry, now: Double) {
        self.carry = carry
        id = "w" + String(Int64(now), radix: 36) + String(Int.random(in: 0..<1_000_000), radix: 36)
        start = now
        setFrom = now
        load(0)
    }

    func step(_ i: Int) -> Carry.Step? { carry.st.indices.contains(i) ? carry.st[i] : nil }
    func item(_ s: Carry.Step?) -> Carry.Item? { s.flatMap { carry.ex.indices.contains($0.e) ? carry.ex[$0.e] : nil } }
    var finishedAll: Bool { k >= carry.st.count }
    var adjustable: Bool { step(k)?.a == 1 }

    func plannedKg(_ s: Carry.Step?) -> Double {
        guard let s, let l = item(s)?.kg, !l.isEmpty else { return -1 }
        return l[max(0, min(l.count - 1, s.i))]
    }

    private mutating func load(_ i: Int) {
        k = i
        guard let s = step(i) else { return }
        kg = plannedKg(s)
        reps = max(1, s.r)
    }

    private static func nearest(_ l: [Double], _ want: Double) -> Int {
        var best = 0
        for i in l.indices where abs(l[i] - want) < abs(l[best] - want) { best = i }
        return best
    }

    mutating func adjust(kg want: Double?, reps r: Int?) {
        guard adjustable else { return }
        if let want, let l = item(step(k))?.kg, !l.isEmpty { kg = l[Self.nearest(l, want)] }
        if let r { reps = min(100, max(1, r)) }
    }

    // MARK: The set timer on a timed hold (the phone's rules: 5 s to get set, then the hold, each side in turn)

    /// The timer for the hold on screen, or nil when it isn't one.
    func offer() -> WatchState.Offer? {
        guard let s = step(k), let m = s.m, m == 1 || m == 2 else { return nil }
        let tl = carry.tl ?? []
        let w = { (i: Int) in tl.indices.contains(i) ? tl[i] : "" }
        return WatchState.Offer(key: "\(id):\(k)", s: s.r, d: m, up: false, l: s.tt ?? "", lb: [w(0), w(m == 2 ? 2 : 1), w(3), w(4)], o: w(5))
    }

    /// Start timer on the hold on screen at `now` (once; not during rest).
    mutating func startTimer(now: Double) {
        guard offer() != nil, restUntil <= now, timerAt == nil else { return }
        timerAt = now
    }

    /// When the running hold's countdown ends, or nil.
    var timerEnd: Double? {
        guard let o = offer(), let at = timerAt else { return nil }
        return o.end(at)
    }

    /// Log set at `now` with the weight and reps chosen on the watch, then the rest after it.
    mutating func log(now: Double, kg want: Double?, reps r: Int?) {
        guard let s = step(k), sets.count < Self.maxSets else { return }
        adjust(kg: want, reps: r)
        // A hold timed here saves the seconds held (as planned when stopped while getting set).
        let held = timerAt.flatMap { offer()?.held($0, now) }
        if let held { reps = held[0] }
        var set = [Double(k), now, kg < 0 ? -1 : kg, Double(reps), max(start, min(setFrom, now))]
        if let held, held.count > 1 { set.append(Double(held[1])) }
        sets.append(set)
        timerAt = nil
        let kept = (kg, reps)
        if s.f == 1 { ask = k }
        load(k + 1)
        let next = step(k)
        // The next set of the same exercise keeps what was dialled in, as on the phone.
        if next?.c == 1 { (kg, reps) = kept }
        restUntil = s.s > 0 && next != nil ? now + Double(s.s) * 1000 : 0
        setFrom = restUntil > 0 ? restUntil : now
    }

    mutating func add30(now: Double) {
        guard restUntil > now else { return }
        restUntil += 30_000
        setFrom = restUntil
    }

    mutating func rate(_ v: Int) {
        guard ask >= 0, (-1...1).contains(v) else { return }
        rates.append([ask, v])
        ask = -1
    }

    mutating func heartRate(_ bpm: Int) {
        guard (30...240).contains(bpm) else { return }
        hrSum += bpm
        hrCount += 1
        hrMax = max(hrMax, bpm)
        hrMin = hrMin == 0 ? bpm : min(hrMin, bpm)
    }

    func forgotten(now: Double) -> Bool { now - (sets.last?[1] ?? start) > Self.forgottenAfter }

    /// What the screen shows, in the phone's own workout JSON.
    func state(now: Double) -> String {
        var o: [String: Any] = [
            "at": now, "sessionId": id, "vibrate": carry.vib, "warn": carry.warn, "done": sets.count, "total": carry.st.count,
        ]
        if ask >= 0, let asked = item(step(ask)), carry.o.count == 3 {
            o["ask"] = ["ex": String(ask), "q": asked.q, "o": carry.o, "v": [1, 0, -1]] as [String: Any]
        }
        if let s = step(k), let it = item(s) {
            let resting = restUntil > now
            o["title"] = resting ? it.rt : it.n
            o["setLabel"] = s.l
            o["next"] = text(s, it)
            if resting { o["restUntil"] = restUntil }
            if !resting, let t = offer() {
                o["ts"] = ["key": t.key, "s": t.s, "d": t.d, "l": t.l, "lb": t.lb, "o": t.o] as [String: Any]
                if let at = timerAt {
                    o["timer"] = t.phases(at).map { p -> [String: Any] in
                        var ph: [String: Any] = ["from": p.from, "label": p.label]
                        if let to = p.to { ph["to"] = to }
                        return ph
                    }
                    o["timerOver"] = t.o
                }
            }
            if adjustable {
                o["adj"] = ["key": "\(id):\(k)", "kg": it.kg, "w": it.w, "i": it.kg.isEmpty ? 0 : Self.nearest(it.kg, kg), "reps": reps, "rs": it.rs] as [String: Any]
            }
        } else {
            o["title"] = carry.done
            o["setLabel"] = ""
            o["next"] = carry.fin
        }
        guard let data = try? JSONSerialization.data(withJSONObject: o) else { return "" }
        return String(data: data, encoding: .utf8) ?? ""
    }

    private func text(_ s: Carry.Step, _ it: Carry.Item) -> String {
        if abs(kg - plannedKg(s)) < 1e-6, reps == s.r { return s.t }
        let r = it.rs.isEmpty ? "\(reps)" : "\(reps) \(it.rs)"
        guard !it.kg.isEmpty, it.w.count == it.kg.count else { return r }
        return "\(it.w[Self.nearest(it.kg, kg)]) × \(r)"
    }

    /// What the phone saves (src/lib/watchWorkout.ts parseWatchResult), or nil when no set was logged.
    func result(now: Double) -> String? {
        guard let last = sets.last?[1] else { return nil }
        let end = max(start, last)
        var o: [String: Any] = [
            "v": 1, "id": id, "c": carry.id, "start": start, "end": max(end, min(now, end + 120_000)), "sets": sets, "rates": rates,
        ]
        o["hr"] = hrCount > 0 ? [Int((Double(hrSum) / Double(hrCount)).rounded()), hrMax, hrMin] : []
        guard let data = try? JSONSerialization.data(withJSONObject: o) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
