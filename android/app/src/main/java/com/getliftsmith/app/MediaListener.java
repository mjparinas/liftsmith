package com.getliftsmith.app;

import android.service.notification.NotificationListenerService;

/**
 * Exists only so Android lets NowPlayingPlugin read other apps' media sessions (the song name, the artist and
 * which app is playing) once the lifter allows notification access in Settings › Workout › Music controls
 * › Show song names. It reads no notifications itself and does nothing in the background.
 */
public class MediaListener extends NotificationListenerService {}
