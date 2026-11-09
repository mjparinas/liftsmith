import AppIntents
import SwiftUI
import WidgetKit

/// iOS 18 Control Center (and Lock Screen / Action button) control that starts today's workout. StartWorkoutIntent
/// opens the app, so it runs there. Android counterpart: the Quick Settings tile (WorkoutTileService.java).
@available(iOS 18.0, *)
struct StartWorkoutControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "com.liftsmith.app.start") {
            ControlWidgetButton(action: StartWorkoutIntent()) {
                Label("Start workout", systemImage: "figure.strengthtraining.traditional")
            }
        }
        .displayName("Start workout")
        .description("Start today's workout in Liftsmith.")
    }
}
