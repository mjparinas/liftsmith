import SwiftUI
import WidgetKit

/// Liftsmith's widget extension: the home-screen and lock-screen widget, the workout Live Activity, and (iOS 18)
/// a Control Center control. Android counterparts: WorkoutWidget.java, WorkoutService.java, WorkoutTileService.java.
@main
struct LiftsmithWidgets: WidgetBundle {
    var body: some Widget {
        QuickStartWidget()
        WorkoutLiveActivity()
        if #available(iOS 18.0, *) {
            StartWorkoutControl()
        }
    }
}

enum Brand {
    static let bg = Color(red: 10 / 255, green: 13 / 255, blue: 18 / 255)
    static let card = Color(red: 22 / 255, green: 27 / 255, blue: 36 / 255)
    static let accent = Color(red: 76 / 255, green: 141 / 255, blue: 255 / 255)
    static let muted = Color(red: 154 / 255, green: 166 / 255, blue: 183 / 255)
    /// Supporting hues for marks (the app's --color-ember, cyan, mint and violet).
    static let ember = Color(red: 255 / 255, green: 138 / 255, blue: 61 / 255)
    static let cyan = Color(red: 56 / 255, green: 214 / 255, blue: 232 / 255)
    static let mint = Color(red: 52 / 255, green: 211 / 255, blue: 153 / 255)
    static let violet = Color(red: 167 / 255, green: 139 / 255, blue: 250 / 255)
    static let start = URL(string: "liftsmith://start")!
    static let log = URL(string: "liftsmith://log")!
    static let add30 = URL(string: "liftsmith://add30")!
}

extension View {
    /// iOS 17 asks widgets for a container background; iOS 16 takes a plain one.
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(color, for: .widget)
        } else {
            background(color)
        }
    }
}
