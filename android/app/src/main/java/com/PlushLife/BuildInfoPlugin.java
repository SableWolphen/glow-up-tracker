package com.PlushLife;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// versionCode/versionName already come from @capacitor/app's App.getInfo();
// the only thing that plugin can't tell you is which exact commit this
// native build was compiled from, since the web content it displays loads
// live from GitHub Pages independent of the installed native build.
@CapacitorPlugin(name = "BuildInfo")
public class BuildInfoPlugin extends Plugin {
    @PluginMethod
    public void getInfo(PluginCall call) {
        JSObject result = new JSObject();
        result.put("gitSha", BuildConfig.GIT_SHA);
        call.resolve(result);
    }
}
