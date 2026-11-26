package com.getliftsmith.app.wear;

import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.WearableListenerService;

/** The phone's workout changed (or ended), or today's call did: straight to WatchHub, whether or not the screen is open. */
public class PhoneListenerService extends WearableListenerService {

    @Override
    public void onDataChanged(DataEventBuffer events) {
        for (DataEvent e : events) {
            // Today's call for the tile and complication, apart from the live workout.
            if (TodayStore.PATH_TODAY.equals(e.getDataItem().getUri().getPath())) {
                TodayStore.save(
                    this,
                    e.getType() == DataEvent.TYPE_DELETED ? null : DataMapItem.fromDataItem(e.getDataItem()).getDataMap().getString("json")
                );
                continue;
            }
            if (!WatchHub.PATH_WORKOUT.equals(e.getDataItem().getUri().getPath())) continue;
            if (e.getType() == DataEvent.TYPE_DELETED) {
                WatchHub.set(this, null);
            } else {
                WatchHub.set(this, WorkoutState.parse(DataMapItem.fromDataItem(e.getDataItem()).getDataMap().getString("json")));
            }
        }
    }
}
