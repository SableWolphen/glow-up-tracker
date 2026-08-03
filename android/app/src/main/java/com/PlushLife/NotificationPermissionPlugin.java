package com.PlushLife;

import android.Manifest;
import android.os.Build;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Requests POST_NOTIFICATIONS directly with Android's own permission API,
// bypassing @capacitor/push-notifications' requestPermissions() — which
// routes through Bridge.getPermissionStates(), a Capacitor core method with
// an open, unfixed upstream bug (ionic-team/capacitor#8400) that throws a
// NullPointerException and crashes the whole app. Confirmed via Crashlytics
// stack traces on real releases, not just suspected.
@CapacitorPlugin(name = "NotificationPermission")
public class NotificationPermissionPlugin extends Plugin {
    private PluginCall pendingCall;
    private ActivityResultLauncher<String> requestLauncher;

    @Override
    public void load() {
        // Runs during the Bridge's own onCreate-time setup, so this is well
        // before the activity reaches STARTED — same timing rule as any
        // registerForActivityResult call.
        requestLauncher = getActivity().registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            granted -> {
                if (pendingCall != null) {
                    JSObject result = new JSObject();
                    result.put("granted", granted);
                    pendingCall.resolve(result);
                    pendingCall = null;
                }
            }
        );
    }

    @PluginMethod
    public void requestPostNotifications(PluginCall call) {
        // Not a runtime permission before Android 13 — nothing to request.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        pendingCall = call;
        requestLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
    }
}
