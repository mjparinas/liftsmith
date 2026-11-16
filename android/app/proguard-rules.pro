# R8 rules for the phone app's release build (docs/decisions/app-size.md "Code shrinking").
# Capacitor, its plugins, RevenueCat, Health Connect, Play services and AndroidX bring their own consumer rules,
# and Capacitor's keep every plugin class (they're found and called by name from the web layer).
# Services, receivers, the tile and the widget are kept through the manifest.

# Readable crash traces: keep line numbers; the mapping file in the bundle turns names back.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Our own plugins and their helpers are reached from the web layer by name, and some read their own fields by
# reflection through Capacitor (PluginCall data, @Permission aliases). Keeping our package whole costs a few KB.
-keep class com.getliftsmith.app.** { *; }

# Garmin Connect IQ companion SDK: its AAR ships no rules, and it talks to Garmin Connect over AIDL and Parcelables.
-keep class com.garmin.android.connectiq.** { *; }
-keep class com.garmin.android.apps.connectmobile.connectiq.** { *; }
-dontwarn com.garmin.**

# Cordova plugin glue Capacitor always includes, even with no Cordova plugins.
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**
