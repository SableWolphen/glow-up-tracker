package com.PlushLife;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

public class MainActivity extends BridgeActivity {
    // Must be registered before the activity reaches STARTED, so this has to
    // be a field initializer rather than something called later from
    // onCreate/onResume.
    private final ActivityResultLauncher<IntentSenderRequest> updateLauncher =
        registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {});

    private AppUpdateManager appUpdateManager;
    private InstallStateUpdatedListener installStateListener;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate() — this is what tells the system
        // to actually dismiss the splash screen once the first frame draws,
        // instead of leaving it (and the permanently-applied splash theme)
        // in an undefined state.
        SplashScreen.installSplashScreen(this);
        EdgeToEdge.enable(this);
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NotificationPermissionPlugin.class);
        super.onCreate(savedInstanceState);
        // Belt-and-suspenders: the theme-level windowActionBar/windowNoTitle
        // items didn't visibly remove the persistent bar on a real device,
        // despite Theme.SplashScreen's own ancestry already being NoActionBar
        // (confirmed against the actual androidx source) — so whatever this
        // bar actually is, it's still under investigation. This is a no-op
        // if there's genuinely no support action bar, and a real fix if one
        // is somehow present despite the theme.
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        checkForUpdate();
    }

    // Play's own background auto-update job can lag well behind a new
    // release actually going live, leaving a device on a stale build
    // indefinitely. Asking Play Store directly on every launch closes that
    // gap. IMMEDIATE (a full-screen forced update) is tried first, but Play
    // doesn't always allow it — depends on the release track and how the
    // update was rolled out — and when it doesn't, silently doing nothing
    // is exactly the "it never tells me to update" symptom. FLEXIBLE (a
    // background download followed by a restart prompt) is the fallback.
    private void checkForUpdate() {
        appUpdateManager = AppUpdateManagerFactory.create(this);
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) return;
            if (info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                appUpdateManager.startUpdateFlowForResult(
                    info, updateLauncher, AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build());
            } else if (info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                installStateListener = state -> {
                    if (state.installStatus() == InstallStatus.DOWNLOADED) {
                        promptToRestartForUpdate();
                    }
                };
                appUpdateManager.registerListener(installStateListener);
                appUpdateManager.startUpdateFlowForResult(
                    info, updateLauncher, AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build());
            }
        });
    }

    private void promptToRestartForUpdate() {
        new AlertDialog.Builder(this)
            .setTitle("Update ready")
            .setMessage("A newer version of PlushLife has finished downloading.")
            .setPositiveButton("Restart now", (dialog, which) -> appUpdateManager.completeUpdate())
            .setNegativeButton("Later", null)
            .setCancelable(true)
            .show();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Covers the case where a FLEXIBLE download already finished while
        // the app was backgrounded — the listener above only fires on the
        // transition into DOWNLOADED, not on an already-downloaded state.
        if (appUpdateManager != null) {
            appUpdateManager.getAppUpdateInfo().addOnSuccessListener(info -> {
                if (info.installStatus() == InstallStatus.DOWNLOADED) {
                    promptToRestartForUpdate();
                }
            });
        }
    }

    @Override
    public void onDestroy() {
        if (appUpdateManager != null && installStateListener != null) {
            appUpdateManager.unregisterListener(installStateListener);
        }
        super.onDestroy();
    }
}
