package fr.albadom.albanotes;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/** Fournit les lignes de la liste du widget. */
public class NotesWidgetService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(getApplicationContext(),
                intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID));
    }

    static int background(String color) {
        switch (color == null ? "" : color) {
            case "yellow": return R.drawable.note_bg_yellow;
            case "green": return R.drawable.note_bg_green;
            case "blue": return R.drawable.note_bg_blue;
            case "purple": return R.drawable.note_bg_purple;
            case "pink": return R.drawable.note_bg_pink;
            case "orange": return R.drawable.note_bg_orange;
            case "gray": return R.drawable.note_bg_gray;
            default: return R.drawable.note_bg_default;
        }
    }

    static String date(long ms) {
        if (ms <= 0) return "";
        Calendar now = Calendar.getInstance(), d = Calendar.getInstance();
        d.setTimeInMillis(ms);
        String pattern;
        if (now.get(Calendar.YEAR) == d.get(Calendar.YEAR) && now.get(Calendar.DAY_OF_YEAR) == d.get(Calendar.DAY_OF_YEAR)) pattern = "HH:mm";
        else if (now.get(Calendar.YEAR) == d.get(Calendar.YEAR)) pattern = "d MMM";
        else pattern = "dd/MM/yyyy";
        return new SimpleDateFormat(pattern, Locale.FRANCE).format(new Date(ms));
    }

    static final class Factory implements RemoteViewsFactory {
        final Context context;
        final int widgetId;
        WidgetData data;
        List<WidgetData.Note> items = new ArrayList<>();

        Factory(Context context, int widgetId) {
            this.context = context;
            this.widgetId = widgetId;
        }

        @Override
        public void onCreate() {
        }

        @Override
        public void onDataSetChanged() {
            data = WidgetData.load(context);
            items = data.select(WidgetData.selection(context, widgetId));
        }

        @Override
        public void onDestroy() {
            items.clear();
        }

        @Override
        public int getCount() {
            return items.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_item);
            if (position < 0 || position >= items.size()) return v;
            WidgetData.Note n = items.get(position);
            v.setInt(R.id.i_root, "setBackgroundResource", background(n.color));
            v.setTextViewText(R.id.i_title, (n.pinned ? "📌 " : n.fav ? "⭐ " : "") + n.title);
            String preview = n.preview.isEmpty() && n.image ? "🖼 Image" : n.preview;
            v.setTextViewText(R.id.i_preview, preview);
            v.setViewVisibility(R.id.i_preview, preview.isEmpty() ? android.view.View.GONE : android.view.View.VISIBLE);
            StringBuilder meta = new StringBuilder(date(n.edited));
            if (!n.tasks.isEmpty()) meta.append("  ·  ☑ ").append(n.tasks);
            String sel = WidgetData.selection(context, widgetId);
            if ((WidgetData.ALL.equals(sel) || WidgetData.FAV.equals(sel)) && !n.folder.isEmpty()) {
                WidgetData.Folder f = data.folder(n.folder);
                if (f != null) meta.append("  ·  ").append(f.emoji).append(' ').append(f.name);
            }
            v.setTextViewText(R.id.i_meta, meta.toString());
            Intent fill = new Intent();
            fill.putExtra(NotesWidget.EXTRA_NOTE, n.id);
            v.setOnClickFillInIntent(R.id.i_root, fill);
            return v;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return false;
        }
    }
}
