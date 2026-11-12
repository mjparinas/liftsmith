package com.getliftsmith.app;

import android.Manifest;
import android.accounts.Account;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
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
            // Both come from the app in its language (calendar.ts).
            String notes = call.getString("notes", "Open Liftsmith to start today's workout.");
            if (days.isEmpty()) {
                call.reject("No days");
                return;
            }
            Target target = pickCalendar();
            if (target == null) {
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
            v.put(CalendarContract.Events.CALENDAR_ID, target.id);
            v.put(CalendarContract.Events.TITLE, title);
            v.put(CalendarContract.Events.DESCRIPTION, notes);
            long start = nextStart(days, hour, minute);
            v.put(CalendarContract.Events.DTSTART, start);
            v.put(CalendarContract.Events.DURATION, "PT" + minutes + "M");
            v.put(CalendarContract.Events.RRULE, "FREQ=WEEKLY;BYDAY=" + byday);
            v.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            v.put(CalendarContract.Events.AVAILABILITY, CalendarContract.Events.AVAILABILITY_BUSY);
            Uri uri = getContext().getContentResolver().insert(CalendarContract.Events.CONTENT_URI, v);
            JSObject r = new JSObject();
            r.put("saved", uri != null);
            if (uri != null) {
                prefs().edit().putLong(KEY_EVENT, ContentUris.parseId(uri)).apply();
                r.put("calendar", target.name);
                r.put("start", start);
                // Push it to the account now, so it shows in the calendar app and on the lifter's other devices
                // without waiting for the next scheduled sync.
                if (target.account != null && target.accountType != null) {
                    Bundle extras = new Bundle();
                    extras.putBoolean(ContentResolver.SYNC_EXTRAS_MANUAL, true);
                    extras.putBoolean(ContentResolver.SYNC_EXTRAS_EXPEDITED, true);
                    try {
                        ContentResolver.requestSync(new Account(target.account, target.accountType), CalendarContract.AUTHORITY, extras);
                    } catch (RuntimeException ignored) {
                        // The calendar app syncs it later.
                    }
                }
            }
            call.resolve(r);
        } catch (JSONException | RuntimeException e) {
            call.reject("Couldn't save", e);
        }
    }

    /** Opens the phone's calendar app at a time (the first training event), so the lifter sees where it went. */
    @PluginMethod
    public void show(PluginCall call) {
        long at = call.getLong("at", System.currentTimeMillis());
        Uri.Builder b = CalendarContract.CONTENT_URI.buildUpon().appendPath("time");
        ContentUris.appendId(b, at);
        Intent i = new Intent(Intent.ACTION_VIEW).setData(b.build()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
            call.resolve();
        } catch (RuntimeException e) {
            call.reject("No calendar app", e);
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

    private static final class Target {
        long id;
        String name;
        String account;
        String accountType;
    }

    /**
     * The calendar the lifter actually looks at. The first writable calendar is often a phone-only one (Samsung's
     * "My calendar", a local account) that Google Calendar never shows, so the event was saved but nowhere to be
     * seen (Melvin, 2026-11-12). Ranked: the primary calendar of a Google account, then any account's primary
     * calendar, then any synced calendar, then a phone-only one.
     */
    private Target pickCalendar() {
        ContentResolver cr = getContext().getContentResolver();
        String[] projection = {
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.IS_PRIMARY,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.ACCOUNT_TYPE,
            CalendarContract.Calendars.OWNER_ACCOUNT,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.SYNC_EVENTS,
        };
        String where = CalendarContract.Calendars.VISIBLE + " = 1 AND " + CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + " >= " + CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR;
        Target best = null;
        int bestScore = -1;
        try (Cursor c = cr.query(CalendarContract.Calendars.CONTENT_URI, projection, where, null, null)) {
            while (c != null && c.moveToNext()) {
                String account = c.getString(2);
                String type = c.getString(3);
                String owner = c.getString(4);
                boolean primary = c.getInt(1) == 1 || (account != null && account.equals(owner));
                int score = CalendarPick.score(type, primary, c.getInt(6) == 1);
                if (score > bestScore) {
                    bestScore = score;
                    best = new Target();
                    best.id = c.getLong(0);
                    best.name = c.getString(5) != null ? c.getString(5) : account;
                    best.account = account;
                    best.accountType = type;
                }
            }
        }
        return best;
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
