package com.getliftsmith.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSegment
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.metadata.Device
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Finished workouts as real exercise sessions in Health Connect (src/lib/health.ts saveWorkout; iOS:
 * HealthWorkoutPlugin.swift). The health plugin (@capgo/capacitor-health) can't write sessions, so this small
 * plugin asks for WRITE_EXERCISE only and writes one strength training session per workout. The session's
 * client record id is the workout's id, so writing the same workout again updates it instead of adding another.
 * Calories and heart rate still go through the health plugin, as separate records over the same time.
 */
@CapacitorPlugin(name = "HealthWorkout")
class HealthWorkoutPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val permission = HealthPermission.getWritePermission(ExerciseSessionRecord::class)
    private val contract = PermissionController.createRequestPermissionResultContract()

    private fun client(): HealthConnectClient? =
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) HealthConnectClient.getOrCreate(context) else null

    private fun answer(call: PluginCall, key: String, value: Boolean) {
        val r = JSObject()
        r.put(key, value)
        call.resolve(r)
    }

    /**
     * Sex and birth year for Your stats (src/lib/health.ts readBodyStats; iOS reads them from Apple Health).
     * Health Connect has no records for either, so Android answers with nothing and the lifter enters them in
     * Your stats (docs/decisions/platform-deltas.md). Height and weight come from Health Connect as usual.
     */
    @PluginMethod
    fun characteristics(call: PluginCall) {
        call.resolve(JSObject())
    }

    @PluginMethod
    fun status(call: PluginCall) {
        val c = client() ?: return answer(call, "granted", false)
        scope.launch {
            val granted = try {
                c.permissionController.getGrantedPermissions().contains(permission)
            } catch (e: Exception) {
                false
            }
            answer(call, "granted", granted)
        }
    }

    @PluginMethod
    fun request(call: PluginCall) {
        val c = client() ?: return answer(call, "granted", false)
        scope.launch {
            val granted = try {
                c.permissionController.getGrantedPermissions().contains(permission)
            } catch (e: Exception) {
                false
            }
            if (granted) return@launch answer(call, "granted", true)
            try {
                startActivityForResult(call, contract.createIntent(context, setOf(permission)), "onPermission")
            } catch (e: Exception) {
                answer(call, "granted", false)
            }
        }
    }

    /**
     * Opens the place to change what Liftsmith may read (src/lib/health.ts openHealthPermissions): Health Connect's
     * page for this app on Android 14+, Health Connect's own settings before that, or Google Play when Health
     * Connect isn't installed (Android 13 and older). Health Connect stops showing its permission sheet after the
     * lifter says no twice, so this is the only way back once a read was denied.
     */
    @PluginMethod
    fun openPermissions(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val intents = mutableListOf<Intent>()
        if (status == HealthConnectClient.SDK_AVAILABLE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                intents += Intent("android.health.connect.action.MANAGE_HEALTH_PERMISSIONS")
                    .putExtra(Intent.EXTRA_PACKAGE_NAME, context.packageName)
            }
            intents += Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
        } else {
            intents += Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$HEALTH_CONNECT"))
            intents += Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$HEALTH_CONNECT"))
        }
        for (intent in intents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                return answer(call, "opened", true)
            } catch (e: Exception) {
                // Try the next one.
            }
        }
        answer(call, "opened", false)
    }

    /**
     * Calories and protein eaten per day, for the food coach's notes (src/lib/health.ts readNutrition, insights.ts).
     * Food apps such as MyFitnessPal or Cronometer write nutrition records to Health Connect; this adds them up per
     * local day (Health Connect's aggregate, so two apps logging the same meal are counted once by its source
     * priority) for the `days` finished days before today. Today is left out because it's still being logged. The
     * health plugin can read energy but not protein, so this reads both. READ_NUTRITION is asked for in the health
     * plugin's sheet (dietaryEnergyConsumed in health.ts READ); without it the answer is empty. `ask` is for iOS.
     */
    @PluginMethod
    fun nutrition(call: PluginCall) {
        val days = (call.getInt("days") ?: 14).coerceIn(1, 60)
        val c = client() ?: return call.resolve(JSObject().put("days", JSArray()))
        scope.launch {
            val out = JSArray()
            try {
                val read = HealthPermission.getReadPermission(NutritionRecord::class)
                if (c.permissionController.getGrantedPermissions().contains(read)) {
                    val today = LocalDate.now()
                    val groups = c.aggregateGroupByPeriod(
                        AggregateGroupByPeriodRequest(
                            metrics = setOf(NutritionRecord.ENERGY_TOTAL, NutritionRecord.PROTEIN_TOTAL),
                            timeRangeFilter = TimeRangeFilter.between(today.minusDays(days.toLong()).atStartOfDay(), today.atStartOfDay()),
                            timeRangeSlicer = Period.ofDays(1),
                        ),
                    )
                    for (g in groups) {
                        val kcal = g.result[NutritionRecord.ENERGY_TOTAL]?.inKilocalories
                        val protein = g.result[NutritionRecord.PROTEIN_TOTAL]?.inGrams
                        if (kcal == null && protein == null) continue
                        val day = JSObject()
                        day.put("day", g.startTime.toLocalDate().toString())
                        if (kcal != null) day.put("kcal", kcal)
                        if (protein != null) day.put("protein", protein)
                        out.put(day)
                    }
                }
            } catch (e: Exception) {
                // Not allowed, or Health Connect is busy: nothing this time.
            }
            call.resolve(JSObject().put("days", out))
        }
    }

    @ActivityCallback
    private fun onPermission(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val granted = contract.parseResult(result.resultCode, result.data).contains(permission)
        answer(call, "granted", granted)
    }

    @PluginMethod
    fun save(call: PluginCall) {
        val id = call.getString("id")
        val start = call.getDouble("start")
        val end = call.getDouble("end")
        if (id.isNullOrEmpty() || start == null || end == null || end <= start) return call.reject("Bad workout")
        val c = client() ?: return answer(call, "saved", false)
        scope.launch {
            try {
                if (!c.permissionController.getGrantedPermissions().contains(permission)) return@launch answer(call, "saved", false)
                val from = Instant.ofEpochMilli(start.toLong())
                val to = Instant.ofEpochMilli(end.toLong())
                val zone = ZoneId.systemDefault().rules
                fun record(segments: List<ExerciseSegment>) = ExerciseSessionRecord(
                    startTime = from,
                    startZoneOffset = zone.getOffset(from),
                    endTime = to,
                    endZoneOffset = zone.getOffset(to),
                    metadata = Metadata.activelyRecorded(device = Device(type = Device.TYPE_PHONE), clientRecordId = id),
                    exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
                    title = call.getString("title"),
                    notes = call.getString("notes"),
                    segments = segments,
                )
                // The workout's parts as segments: weightlifting for lifting and rehab, stretching for the warm-up and
                // cool-down, and the machine's own type for a cardio part (biking, rowing...). Health Connect checks
                // segments against the session's type; if it refuses the cardio type, the cardio part goes as "other
                // workout", and if it still refuses, the workout is saved without segments.
                val session = try {
                    record(segmentsOf(call.getArray("segments"), from, to, exact = true))
                } catch (e: IllegalArgumentException) {
                    try {
                        record(segmentsOf(call.getArray("segments"), from, to, exact = false))
                    } catch (e2: IllegalArgumentException) {
                        record(emptyList())
                    }
                }
                c.insertRecords(listOf(session))
                answer(call, "saved", true)
            } catch (e: Exception) {
                answer(call, "saved", false)
            }
        }
    }

    private fun segmentsOf(list: JSArray?, from: Instant, to: Instant, exact: Boolean): List<ExerciseSegment> {
        if (list == null || list.length() < 2) return emptyList()
        val out = mutableListOf<ExerciseSegment>()
        for (i in 0 until list.length()) {
            val o = list.optJSONObject(i) ?: continue
            val a = Instant.ofEpochMilli(o.optLong("start"))
            val b = Instant.ofEpochMilli(o.optLong("end"))
            if (!b.isAfter(a) || a.isBefore(from) || b.isAfter(to)) continue
            val type = when (o.optString("kind")) {
                "warm", "cool" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_STRETCHING
                "cardio" -> if (exact) cardioSegment(o.optString("activity")) else ExerciseSegment.EXERCISE_SEGMENT_TYPE_OTHER_WORKOUT
                else -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_WEIGHTLIFTING
            }
            out.add(ExerciseSegment(startTime = a, endTime = b, segmentType = type))
        }
        return out
    }

    /** A cardio part's segment type, from what it was (partExtras.ts `cardioActivity`). */
    private fun cardioSegment(activity: String): Int = when (activity) {
        "bike" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_BIKING_STATIONARY
        "row" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_ROWING_MACHINE
        "run" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_RUNNING_TREADMILL
        "walk" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_WALKING
        "elliptical" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_ELLIPTICAL
        "stairs" -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_STAIR_CLIMBING_MACHINE
        else -> ExerciseSegment.EXERCISE_SEGMENT_TYPE_OTHER_WORKOUT
    }

    private companion object {
        const val HEALTH_CONNECT = "com.google.android.apps.healthdata"
    }
}
