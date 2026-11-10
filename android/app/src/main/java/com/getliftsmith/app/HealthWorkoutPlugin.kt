package com.getliftsmith.app

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.metadata.Device
import androidx.health.connect.client.records.metadata.Metadata
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Instant
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
                val record = ExerciseSessionRecord(
                    startTime = from,
                    startZoneOffset = zone.getOffset(from),
                    endTime = to,
                    endZoneOffset = zone.getOffset(to),
                    metadata = Metadata.activelyRecorded(device = Device(type = Device.TYPE_PHONE), clientRecordId = id),
                    exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
                    title = call.getString("title"),
                    notes = call.getString("notes"),
                )
                c.insertRecords(listOf(record))
                answer(call, "saved", true)
            } catch (e: Exception) {
                answer(call, "saved", false)
            }
        }
    }
}
