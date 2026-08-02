package com.PlushLife;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void updateWidget(PluginCall call) {
        String nextTask = call.getString("nextTask", "Open PlushLife for one caring step");
        String dayType = call.getString("dayType", "Today");
        int progress = Math.max(0, Math.min(100, call.getInt("progress", 0)));
        int weeklyProgress = Math.max(0, Math.min(100, call.getInt("weeklyProgress", 0)));
        JSArray tasks = call.getArray("tasks");

        SharedPreferences.Editor editor = getContext()
            .getSharedPreferences(PlushLifeWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString("nextTask", nextTask)
            .putString("dayType", dayType)
            .putInt("progress", progress)
            .putInt("weeklyProgress", weeklyProgress);

        for (int i = 0; i < 3; i++) {
            String label = "";
            boolean done = false;
            if (tasks != null && i < tasks.length()) {
                try {
                    JSONObject task = tasks.getJSONObject(i);
                    label = task.optString("label", "");
                    done = task.optBoolean("done", false);
                } catch (JSONException ignored) {
                    // Leave this row blank if the entry can't be read.
                }
            }
            editor.putString("task" + i + "Label", label);
            editor.putBoolean("task" + i + "Done", done);
        }
        editor.apply();

        getContext().sendBroadcast(new Intent(getContext(), PlushLifeWidgetProvider.class)
            .setAction(PlushLifeWidgetProvider.ACTION_REFRESH));
        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }
}
