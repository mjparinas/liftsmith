import Capacitor
import EventKit

/// Calendar (src/lib/calendar.ts), iOS side (Android: CalendarPlugin.java). Writes the training days as one weekly
/// repeating event in the default calendar, and, only when the lifter turned it on, reads busy times (start and end
/// only, never titles, places or attendees).
@objc(CalendarPlugin)
public class CalendarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CalendarPlugin"
    public let jsName = "Calendar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveTrainingDays", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeTrainingDays", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "busy", returnType: CAPPluginReturnPromise),
    ]

    private let store = EKEventStore()
    private let savedKey = "liftsmith.calendar.eventId"

    private var granted: Bool {
        let status = EKEventStore.authorizationStatus(for: .event)
        if #available(iOS 17.0, *) { return status == .fullAccess }
        return status == .authorized
    }

    @objc func requestAccess(_ call: CAPPluginCall) {
        // Full access, because updating the training event and reading busy times both need to read events.
        let done: (Bool, Error?) -> Void = { ok, _ in call.resolve(["granted": ok]) }
        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents(completion: done)
        } else {
            store.requestAccess(to: .event, completion: done)
        }
    }

    @objc func saveTrainingDays(_ call: CAPPluginCall) {
        guard granted else { return call.reject("Calendar access not granted") }
        let days = (call.getArray("days", Int.self) ?? []).filter { (0...6).contains($0) }
        guard !days.isEmpty, let calendar = store.defaultCalendarForNewEvents else { return call.reject("No days or calendar") }
        let hour = call.getInt("hour") ?? 18
        let minute = call.getInt("minute") ?? 0
        let minutes = call.getInt("minutes") ?? 45
        deleteSaved()

        let event = EKEvent(eventStore: store)
        event.calendar = calendar
        event.title = call.getString("title") ?? "Liftsmith workout"
        // Both come from the app in its language (calendar.ts).
        event.notes = call.getString("notes") ?? "Open Liftsmith to start today's workout."
        event.startDate = nextStart(days: days, hour: hour, minute: minute)
        event.endDate = event.startDate.addingTimeInterval(TimeInterval(minutes * 60))
        event.availability = .busy
        // EKWeekday is 1 = Sunday; our days are 0 = Sunday.
        let weekdays = days.compactMap { EKWeekday(rawValue: $0 + 1) }.map { EKRecurrenceDayOfWeek($0) }
        event.addRecurrenceRule(EKRecurrenceRule(recurrenceWith: .weekly, interval: 1, daysOfTheWeek: weekdays, daysOfTheMonth: nil, monthsOfTheYear: nil, weeksOfTheYear: nil, daysOfTheYear: nil, setPositions: nil, end: nil))
        do {
            try store.save(event, span: .futureEvents, commit: true)
            UserDefaults.standard.set(event.eventIdentifier, forKey: savedKey)
            call.resolve(["saved": true])
        } catch {
            call.reject("Couldn't save", nil, error)
        }
    }

    @objc func removeTrainingDays(_ call: CAPPluginCall) {
        if granted { deleteSaved() }
        call.resolve()
    }

    @objc func busy(_ call: CAPPluginCall) {
        guard granted else { return call.resolve(["busy": [] as [Any]]) }
        let from = Date(timeIntervalSince1970: (call.getDouble("from") ?? Date().timeIntervalSince1970 * 1000) / 1000)
        let to = Date(timeIntervalSince1970: (call.getDouble("to") ?? from.timeIntervalSince1970 * 1000 + 3 * 3_600_000) / 1000)
        let own = UserDefaults.standard.string(forKey: savedKey)
        let events = store.events(matching: store.predicateForEvents(withStart: from, end: to, calendars: nil))
        // Only times leave this method: no titles, places, attendees or notes.
        let busy = events
            .filter { !$0.isAllDay && $0.availability != .free && $0.eventIdentifier != own }
            .map { ["start": $0.startDate.timeIntervalSince1970 * 1000, "end": $0.endDate.timeIntervalSince1970 * 1000] }
        call.resolve(["busy": busy])
    }

    private func deleteSaved() {
        guard let id = UserDefaults.standard.string(forKey: savedKey) else { return }
        if let event = store.event(withIdentifier: id) {
            try? store.remove(event, span: .futureEvents, commit: true)
        }
        UserDefaults.standard.removeObject(forKey: savedKey)
    }

    private func nextStart(days: [Int], hour: Int, minute: Int) -> Date {
        let cal = Calendar.current
        let now = Date()
        for i in 0..<8 {
            guard let day = cal.date(byAdding: .day, value: i, to: now),
                  let start = cal.date(bySettingHour: hour, minute: minute, second: 0, of: day) else { continue }
            if days.contains(cal.component(.weekday, from: start) - 1) && start >= now { return start }
        }
        return now
    }
}
