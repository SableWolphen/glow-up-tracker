package com.PlushLife;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

public class PlushLifeWidgetProvider extends AppWidgetProvider {
    public static final String PREFS = "plushlife_widget";
    public static final String ACTION_REFRESH = "com.PlushLife.WIDGET_REFRESH";
    private static final int[] TASK_ROW_IDS = { R.id.widget_task_0, R.id.widget_task_1, R.id.widget_task_2 };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) updateWidget(context, manager, id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, PlushLifeWidgetProvider.class));
            onUpdate(context, manager, ids);
        }
    }

    static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.plushlife_widget);
        views.setTextViewText(R.id.widget_day_type, prefs.getString("dayType", "Today"));
        views.setProgressBar(R.id.widget_progress, 100, prefs.getInt("progress", 0), false);
        views.setProgressBar(R.id.widget_weekly_progress, 100, prefs.getInt("weeklyProgress", 0), false);

        boolean anyTaskShown = false;
        for (int i = 0; i < TASK_ROW_IDS.length; i++) {
            String label = prefs.getString("task" + i + "Label", "");
            if (label == null || label.isEmpty()) {
                views.setViewVisibility(TASK_ROW_IDS[i], View.GONE);
                continue;
            }
            boolean done = prefs.getBoolean("task" + i + "Done", false);
            views.setTextViewText(TASK_ROW_IDS[i], (done ? "✓ " : "○ ") + label);
            views.setViewVisibility(TASK_ROW_IDS[i], View.VISIBLE);
            anyTaskShown = true;
        }
        views.setTextViewText(R.id.widget_next_task, prefs.getString("nextTask", "Open PlushLife for one caring step"));
        views.setViewVisibility(R.id.widget_next_task, anyTaskShown ? View.GONE : View.VISIBLE);

        Intent launch = new Intent(context, MainActivity.class);
        PendingIntent pending = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pending);
        manager.updateAppWidget(widgetId, views);
    }
}
