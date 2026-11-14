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
    /// The set timer for holds, carries and cardio, phase by phase (src/lib/sessionNotify.ts TimerSegment).
    var timer: [Phase] = []

    /// One phase of the set timer: counts down to `to` ("Time left", "Switch sides"…), or up from `from` with no end.
    struct Phase: Decodable, Equatable {
        /// ms since 1970, as the phone sends them.
        var from: Double
        var to: Double?
        var label: String

        var start: Date { Date(timeIntervalSince1970: from / 1000) }
        var end: Date? { to.map { Date(timeIntervalSince1970: $0 / 1000) } }
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
        let phases = (try? c.decode([Phase].self, forKey: .timer)) ?? []
        timer = Array(phases.filter { p in p.from > 0 && (p.to.map { to in to > p.from } ?? true) }.prefix(8))
    }

    private enum CodingKeys: String, CodingKey {
        case title, setLabel, next, plates, restUntil, hr, vibrate, warn, done, total, at, sessionId, motion, timer
    }

    /// The set timer's phase at `now` (started, not ended); never while resting. Same rule as the phone's.
    func phase(at now: Date) -> Phase? {
        if resting(at: now) { return nil }
        return timer.first { $0.start <= now && ($0.end.map { now < $0 } ?? true) }
    }

    var restEnd: Date? { restUntil.map { Date(timeIntervalSince1970: $0 / 1000) } }

    func resting(at now: Date) -> Bool { (restEnd ?? .distantPast) > now }

    /// Whether to stream motion now: the phone asked for it, and rest hasn't started on this watch's clock.
    func streamMotion(at now: Date) -> Bool { motion && !resting(at: now) }

    func stale(at now: Date) -> Bool { at > 0 && now.timeIntervalSince1970 - at / 1000 > Self.staleAfter }
}
