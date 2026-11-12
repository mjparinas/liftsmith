package com.getliftsmith.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/**
 * The Play Store's own rating prompt (In-App Review), shown at a happy moment after a workout
 * (src/lib/rateApp.ts decides when; docs/decisions/growth.md). Play decides whether it actually appears
 * and never says, so this resolves either way. iOS counterpart: StoreReviewPlugin in DelightPlugins.swift.
 */
@CapacitorPlugin(name = "StoreReview")
public class StoreReviewPlugin extends Plugin {

    @PluginMethod
    public void request(PluginCall call) {
        if (getActivity() == null) {
            call.resolve();
            return;
        }
        ReviewManager manager = ReviewManagerFactory.create(getContext());
        manager
            .requestReviewFlow()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful() || getActivity() == null) {
                    call.resolve();
                    return;
                }
                ReviewInfo info = task.getResult();
                manager.launchReviewFlow(getActivity(), info).addOnCompleteListener(done -> call.resolve());
            });
    }
}
