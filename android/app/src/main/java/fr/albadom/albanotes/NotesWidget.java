package fr.albadom.albanotes;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

/** Widget d'écran d'accueil : liste des notes d'un dossier, + pour créer, dossier modifiable. */
public class NotesWidget extends AppWidgetProvider {

    static final String ACTION_OPEN = "fr.albadom.albanotes.OPEN_NOTE";
    static final String ACTION_NEW = "fr.albadom.albanotes.NEW_NOTE";
    static final String EXTRA_NOTE = "note";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        WidgetData data = WidgetData.load(context);
        for (int id : ids) update(context, manager, id, data);
    }

    @Override
    public void onDeleted(Context context, int[] ids) {
        for (int id : ids) WidgetData.forget(context, id);
    }

    static int flags(boolean mutable) {
        return PendingIntent.FLAG_UPDATE_CURRENT | (mutable ? PendingIntent.FLAG_MUTABLE : PendingIntent.FLAG_IMMUTABLE);
    }

    static void update(Context c, AppWidgetManager manager, int id, WidgetData data) {
        String sel = WidgetData.selection(c, id);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget);
        v.setTextViewText(R.id.w_title, data.label(sel));

        // liste des notes (fournie par NotesWidgetService)
        Intent svc = new Intent(c, NotesWidgetService.class);
        svc.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        v.setRemoteAdapter(R.id.w_list, svc);
        v.setEmptyView(R.id.w_list, R.id.w_empty);

        // toucher une note : l'ouvrir dans l'appli
        Intent open = new Intent(c, MainActivity.class).setAction(ACTION_OPEN);
        v.setPendingIntentTemplate(R.id.w_list, PendingIntent.getActivity(c, id, open, flags(true)));

        // + : nouvelle note
        Intent create = new Intent(c, MainActivity.class).setAction(ACTION_NEW);
        v.setOnClickPendingIntent(R.id.w_new, PendingIntent.getActivity(c, 1, create, flags(false)));

        // titre : ouvrir l'appli
        Intent launch = new Intent(c, MainActivity.class).setAction(Intent.ACTION_MAIN);
        v.setOnClickPendingIntent(R.id.w_title, PendingIntent.getActivity(c, 2, launch, flags(false)));
        v.setOnClickPendingIntent(R.id.w_empty, PendingIntent.getActivity(c, 3, launch, flags(false)));

        // icône dossier : changer le dossier affiché
        Intent cfg = new Intent(c, WidgetConfigActivity.class);
        cfg.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        cfg.setData(Uri.parse("albanotes://widget/" + id));
        v.setOnClickPendingIntent(R.id.w_folder, PendingIntent.getActivity(c, 100000 + id, cfg, flags(false)));

        manager.updateAppWidget(id, v);
        manager.notifyAppWidgetViewDataChanged(id, R.id.w_list);
    }

    /** Appelé quand l'appli transmet de nouvelles données. */
    static void refreshAll(Context c) {
        AppWidgetManager manager = AppWidgetManager.getInstance(c);
        int[] ids = manager.getAppWidgetIds(new ComponentName(c, NotesWidget.class));
        if (ids == null || ids.length == 0) return;
        WidgetData data = WidgetData.load(c);
        for (int id : ids) update(c, manager, id, data);
    }
}
