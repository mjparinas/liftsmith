package com.getliftsmith.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;
import org.json.JSONException;

/**
 * Calendar (src/lib/calendar.ts). Writes the training days as one weekly repeating event in the lifter's primary
 * calendar, and, only when they turned it on, reads busy times (start and end only, never titles or attendees).
 * iOS counterpart: ios/App/App/CalendarPlugin.swift.
 */
@CapacitorPlugin(
    name = "Calendar",
    permissions = { @Permission(alias = "calendar", strings = { Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR }) }
)
public class CalendarPlugin extends Plugin {

    private static final String PREFS = "liftsmith.calendar";
    private static final String KEY_EVENT = "eventId";
    private static final String[] BYDAY = { "SU", "MO", "TU", "WE", "TH", "FR", "SA" };

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (getPermissionState("calendar") == PermissionState.GRANTED) {
            resolveGranted(call);
            return;
        }
        requestPermissionForAlias("calendar", call, "accessCallback");
    }

    @PermissionCallback
    private void accessCallback(PluginCall call) {
        resolveGranted(call);
    }

    private void resolveGranted(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", getPermissionState("calendar") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void saveTrainingDays(PluginCall call) {
        if (getPermissionState("calendar") != PermissionState.GRANTED) {
            call.reject("Calendar access not granted");
            return;
        }
        try {
            List<Integer> days = call.getArray("days").toList();
            int hour = call.getInt("hour", 18);
            int minute = call.getInt("minute", 0);
            int minutes = call.getInt("minutes", 45);
            String title = call.getString("title", "Liftsmith workout");
            if (days.isEmpty()) {
                call.reject("No days");
                return;
            }
            long calendarId = primaryCalendar();
            if (calendarId < 0) {
                call.reject("No writable calendar");
                return;
            }
            deleteSaved();

            StringBuilder byday = new StringBuilder();
            for (int d : days) {
                if (byday.length() > 0) byday.append(',');
                byday.append(BYDAY[d]);
            }
            ContentValues v = new ContentValues();
            v.put(CalendarContract.Events.CALENDAR_ID, calendarId);
            v.put(CalendarContract.Events.TITLE, title);
            v.put(CalendarContract.Events.DESCRIPTION, "Open Liftsmith to start today's workout.");
            v.put(CalendarContract.Events.DTSTART, nextStart(days, hour, minute));
            v.put(CalendarContract.Events.DURATION, "PT" + minutes + "M");
            v.put(CalendarContract.Events.RRULE, "FREQ=WEEKLY;BYDAY=" + byday);
            v.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            v.put(CalendarContract.Events.AVAILABILITY, CalendarContract.Events.AVAILABILITY_BUSY);
            Uri uri = getContext().getContentResolver().insert(CalendarContract.Events.CONTENT_URI, v);
            JSObject r = new JSObject();
            r.put("saved", uri != null);
            if (uri != null) prefs().edit().putLong(KEY_EVENT, ContentUris.parseId(uri)).apply();
            call.resolve(r);
        } catch (JSONException | RuntimeException e) {
            call.reject("Couldn't save", e);
        }
    }

    @PluginMethod
    public void removeTrainingDays(PluginCall call) {
        if (getPermissionState("calendar") == PermissionState.GRANTED) deleteSaved();
        call.resolve();
    }

    @PluginMethod
    public void busy(PluginCall call) {
        JSArray out = new JSArray();
        if (getPermissionState("calendar") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("busy", out);
            call.resolve(r);
            return;
        }
        long from = call.getLong("from", System.currentTimeMillis());
        long to = call.getLong("to", from + 3 * 3_600_000L);
        long own = prefs().getLong(KEY_EVENT, -1);
        Uri.Builder b = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(b, from);
        ContentUris.appendId(b, to);
        // Only times: no titles, places, attendees or descriptions are read.
        String[] projection = { CalendarContract.Instances.BEGIN, CalendarContract.Instances.END, CalendarContract.Instances.ALL_DAY, CalendarContract.Instances.AVAILABILITY, CalendarContract.Instances.EVENT_ID };
        try (Cursor c = getContext().getContentResolver().query(b.build(), projection, null, null, CalendarContract.Instances.BEGIN + " ASC")) {
            while (c != null && c.moveToNext()) {
                if (c.getInt(2) == 1) continue;
                if (c.getInt(3) == CalendarContract.Instances.AVAILABILITY_FREE) continue;
                if (c.getLong(4) == own) continue;
                JSObject o = new JSObject();
                o.put("start", c.getLong(0));
                o.put("end", c.getLong(1));
                out.put(o);
            }
        } catch (RuntimeException ignored) {
            // Unreadable calendars just add nothing.
        }
        JSObject r = new JSObject();
        r.put("busy", out);
        call.resolve(r);
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private void deleteSaved() {
        long id = prefs().getLong(KEY_EVENT, -1);
        if (id < 0) return;
        try {
            getContext().getContentResolver().delete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id), null, null);
        } catch (RuntimeException ignored) {
            // Already gone.
        }
        prefs().edit().remove(KEY_EVENT).apply();
    }

    /** The primary visible calendar the lifter can write to, or the first writable one. */
    private long primaryCalendar() {
        ContentResolver cr = getContext().getContentResolver();
        String[] projection = { CalendarContract.Calendars._ID, CalendarContract.Calendars.IS_PRIMARY };
        String where = CalendarContract.Calendars.VISIBLE + " = 1 AND " + CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + " >= " + CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR;
        long first = -1;
        try (Cursor c = cr.query(CalendarContract.Calendars.CONTENT_URI, projection, where, null, null)) {
            while (c != null && c.moveToNext()) {
                if (first < 0) first = c.getLong(0);
                if (c.getInt(1) == 1) return c.getLong(0);
            }
        }
        return first;
    }

    static long nextStart(List<Integer> days, int hour, int minute) {
        Calendar now = Calendar.getInstance();
        List<Integer> wanted = new ArrayList<>(days);
        for (int i = 0; i < 8; i++) {
            Calendar d = (Calendar) now.clone();
            d.add(Calendar.DAY_OF_MONTH, i);
            d.set(Calendar.HOUR_OF_DAY, hour);
            d.set(Calendar.MINUTE, minute);
            d.set(Calendar.SECOND, 0);
            d.set(Calendar.MILLISECOND, 0);
            // Calendar.SUNDAY is 1; our days are 0 = Sunday.
            if (wanted.contains(d.get(Calendar.DAY_OF_WEEK) - 1) && !d.before(now)) return d.getTimeInMillis();
        }
        return now.getTimeInMillis();
    }
}
