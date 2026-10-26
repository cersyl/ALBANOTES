package fr.albadom.albanotes;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Résumé des notes transmis par l'appli (window.AlbaNative.updateWidget) et lu par le widget. */
final class WidgetData {

    static final String ALL = "all";
    static final String FAV = "fav";

    static final class Folder {
        String id, name, emoji;
    }

    static final class Note {
        String id, title, preview, folder, color, tasks;
        boolean fav, pinned, image;
        long edited;
        Double order;
    }

    String sort = "modified";
    final List<Folder> folders = new ArrayList<>();
    final List<Note> notes = new ArrayList<>();

    private WidgetData() {
    }

    static File file(Context c) {
        return new File(c.getFilesDir(), "widget.json");
    }

    static void save(Context c, String json) throws IOException {
        File tmp = new File(c.getFilesDir(), "widget.json.tmp");
        try (OutputStream out = new FileOutputStream(tmp)) {
            out.write(json.getBytes(StandardCharsets.UTF_8));
        }
        if (!tmp.renameTo(file(c))) throw new IOException("rename");
    }

    static WidgetData load(Context c) {
        WidgetData d = new WidgetData();
        File f = file(c);
        if (!f.isFile()) return d;
        try (InputStream in = new FileInputStream(f)) {
            byte[] buf = new byte[(int) f.length()];
            int off = 0, r;
            while (off < buf.length && (r = in.read(buf, off, buf.length - off)) > 0) off += r;
            JSONObject o = new JSONObject(new String(buf, 0, off, StandardCharsets.UTF_8));
            d.sort = o.optString("sort", "modified");
            JSONArray fs = o.optJSONArray("folders");
            if (fs != null) for (int i = 0; i < fs.length(); i++) {
                JSONObject x = fs.getJSONObject(i);
                Folder fo = new Folder();
                fo.id = x.optString("id");
                fo.name = x.optString("name");
                fo.emoji = x.optString("emoji", "📁");
                d.folders.add(fo);
            }
            JSONArray ns = o.optJSONArray("notes");
            if (ns != null) for (int i = 0; i < ns.length(); i++) {
                JSONObject x = ns.getJSONObject(i);
                Note n = new Note();
                n.id = x.optString("id");
                n.title = x.optString("title", "Sans titre");
                n.preview = x.optString("preview", "");
                n.folder = x.optString("folder", "");
                n.color = x.optString("color", "default");
                n.tasks = x.optString("tasks", "");
                n.fav = x.optBoolean("fav");
                n.pinned = x.optBoolean("pinned");
                n.image = x.optBoolean("image");
                n.edited = x.optLong("edited");
                n.order = x.isNull("order") ? null : x.optDouble("order");
                d.notes.add(n);
            }
        } catch (Exception ignored) {
            // fichier absent ou illisible : widget vide
        }
        return d;
    }

    Folder folder(String id) {
        for (Folder f : folders) if (f.id.equals(id)) return f;
        return null;
    }

    /** Libellé affiché en tête du widget. */
    String label(String sel) {
        if (sel == null || ALL.equals(sel)) return "Toutes les notes";
        if (FAV.equals(sel)) return "⭐ Favoris";
        Folder f = folder(sel);
        return f == null ? "Dossier supprimé" : f.emoji + " " + f.name;
    }

    /** Notes du dossier choisi, épinglées d'abord, dans l'ordre de l'appli. */
    List<Note> select(String sel) {
        List<Note> out = new ArrayList<>();
        for (Note n : notes) {
            if (sel == null || ALL.equals(sel)) out.add(n);
            else if (FAV.equals(sel)) { if (n.fav) out.add(n); }
            else if (sel.equals(n.folder)) out.add(n);
        }
        final boolean custom = "custom".equals(sort);
        final boolean byTitle = "title".equals(sort);
        Collections.sort(out, (a, b) -> {
            if (a.pinned != b.pinned) return a.pinned ? -1 : 1;
            if (custom) {
                if (a.order == null && b.order == null) return Long.compare(b.edited, a.edited);
                if (a.order == null) return -1;
                if (b.order == null) return 1;
                return Double.compare(a.order, b.order);
            }
            if (byTitle) return a.title.compareToIgnoreCase(b.title);
            return Long.compare(b.edited, a.edited);
        });
        return out;
    }

    // ------------------------------------------------ dossier choisi pour chaque widget

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("albanotes_widgets", Context.MODE_PRIVATE);
    }

    static String selection(Context c, int widgetId) {
        return prefs(c).getString("w" + widgetId, ALL);
    }

    static void setSelection(Context c, int widgetId, String sel) {
        prefs(c).edit().putString("w" + widgetId, sel).apply();
    }

    static void forget(Context c, int widgetId) {
        prefs(c).edit().remove("w" + widgetId).apply();
    }
}
