package com.getliftsmith.app.wear;

import com.google.android.gms.wearable.DataMap;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.WearableListenerService;

/**
 * The phone's workout changed (or ended), today's call or carried plan did, or a phone-free workout reached the phone:
 * straight to WatchHub, whether or not the screen is open.
 */
public class PhoneListenerService extends WearableListenerService {

    @Override
    public void onMessageReceived(MessageEvent message) {
        if (WatchHub.PATH_WORKOUT.equals(message.getPath())) {
            WatchHub.receive(this, DataMap.fromByteArray(message.getData()), true);
        }
    }

    @Override
    public void onDataChanged(DataEventBuffer events) {
        for (DataEvent e : events) {
            String path = e.getDataItem().getUri().getPath();
            boolean deleted = e.getType() == DataEvent.TYPE_DELETED;
            // Today's plan carried for a phone-free workout (WatchRun), or taken off.
            if (CarryStore.PATH_CARRY.equals(path)) {
                WatchHub.carry(this, deleted ? null : DataMapItem.fromDataItem(e.getDataItem()).getDataMap().getString("json"));
                continue;
            }
            // A finished run's item, deleted by the phone once it kept it: it arrived.
            if (path != null && path.startsWith(CarryStore.PATH_DONE)) {
                if (deleted) WatchHub.arrived(this, path.substring(CarryStore.PATH_DONE.length()));
                continue;
            }
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
                WatchHub.receive(this, null, false);
            } else {
                WatchHub.receive(this, DataMapItem.fromDataItem(e.getDataItem()).getDataMap(), false);
            }
        }
    }
}
