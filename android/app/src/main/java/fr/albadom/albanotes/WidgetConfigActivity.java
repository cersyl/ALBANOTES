package fr.albadom.albanotes;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.os.Bundle;
import android.util.TypedValue;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

/** Choix du dossier affiché par un widget (à l'ajout, puis via l'icône dossier du widget). */
public class WidgetConfigActivity extends Activity {

    int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setResult(RESULT_CANCELED);
        Intent in = getIntent();
        if (in != null) widgetId = in.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        final WidgetData data = WidgetData.load(this);
        final List<String> keys = new ArrayList<>();
        final List<String> labels = new ArrayList<>();
        keys.add(WidgetData.ALL);
        labels.add("📝  Toutes les notes");
        keys.add(WidgetData.FAV);
        labels.add("⭐  Favoris");
        for (WidgetData.Folder f : data.folders) {
            keys.add(f.id);
            labels.add(f.emoji + "  " + f.name);
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(16);
        root.setPadding(pad, pad / 2, pad, pad / 2);
        if (data.folders.isEmpty()) {
            TextView hint = new TextView(this);
            hint.setText("Ouvrez ALBANOTES une fois pour que vos dossiers apparaissent ici.");
            hint.setPadding(0, 0, 0, pad / 2);
            root.addView(hint);
        }
        ListView list = new ListView(this);
        list.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_single_choice, labels));
        list.setChoiceMode(ListView.CHOICE_MODE_SINGLE);
        int current = keys.indexOf(WidgetData.selection(this, widgetId));
        if (current >= 0) list.setItemChecked(current, true);
        list.setOnItemClickListener((parent, view, position, id) -> choose(keys.get(position)));
        root.addView(list);
        setContentView(root);
    }

    void choose(String key) {
        WidgetData.setSelection(this, widgetId, key);
        AppWidgetManager manager = AppWidgetManager.getInstance(this);
        NotesWidget.update(this, manager, widgetId, WidgetData.load(this));
        Intent result = new Intent();
        result.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        setResult(RESULT_OK, result);
        finish();
    }

    int dp(int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }
}
