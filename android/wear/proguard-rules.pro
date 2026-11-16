# R8 rules for the Wear OS app's release build (docs/decisions/app-size.md "Code shrinking").
# Activities, services and the tile are kept through the manifest; Play services and AndroidX bring their own rules.

# Readable crash traces: keep line numbers; the mapping file in the bundle turns names back.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# The watch app is small and reads its own messages by name; keep our package whole.
-keep class com.getliftsmith.app.wear.** { *; }
