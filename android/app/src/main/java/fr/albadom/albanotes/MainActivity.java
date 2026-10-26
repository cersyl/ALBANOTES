package fr.albadom.albanotes;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.security.KeyChain;
import android.webkit.ClientCertRequest;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;

/**
 * ALBANOTES pour Android.
 * L'interface (dossier public/ du dépôt) est embarquée dans l'APK et servie sous
 * https://appassets.androidplatform.net/ : l'appli démarre et fonctionne sans serveur,
 * les notes sont stockées sur le téléphone puis synchronisées quand le serveur répond.
 * L'interface se met à jour depuis le serveur (saveShell), sans réinstaller l'APK.
 */
public class MainActivity extends Activity {

    static final String HOST = "appassets.androidplatform.net";
    static final String ORIGIN = "https://" + HOST;
    static final int REQ_FILE = 4201;
    static final String[] SHELL_FILES = {"index.html", "app.js", "app.css"};

    WebView web;
    ValueCallback<Uri[]> fileCallback;
    SharedPreferences prefs;
    String bundledVersion = "0";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("albanotes", MODE_PRIVATE);
        bundledVersion = readAssetText("www/VERSION").trim();

        WebView.setWebContentsDebuggingEnabled(true); // chrome://inspect depuis le PC, utile en cas de souci
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setTextZoom(100);
        // autorise un serveur local en http:// (ex. http://192.168.0.x:3000) depuis l'interface embarquée
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        web.addJavascriptInterface(new Bridge(), "AlbaNative");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.loadUrl(startUrl(getIntent()));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String a = intent.getAction();
        if (Intent.ACTION_SEND.equals(a) || NotesWidget.ACTION_OPEN.equals(a) || NotesWidget.ACTION_NEW.equals(a)) {
            web.loadUrl(startUrl(intent));
        }
    }

    /** Page de démarrage ; un texte partagé depuis une autre appli devient une nouvelle note,
     *  le widget ouvre une note (?open=id) ou en crée une (?new=1). */
    String startUrl(Intent intent) {
        if (intent != null && NotesWidget.ACTION_OPEN.equals(intent.getAction())) {
            String id = intent.getStringExtra(NotesWidget.EXTRA_NOTE);
            if (id != null) return ORIGIN + "/?open=" + enc(id);
        }
        if (intent != null && NotesWidget.ACTION_NEW.equals(intent.getAction())) return ORIGIN + "/?new=1";
        if (intent != null && Intent.ACTION_SEND.equals(intent.getAction())) {
            String text = intent.getStringExtra(Intent.EXTRA_TEXT);
            String title = intent.getStringExtra(Intent.EXTRA_SUBJECT);
            if (text != null || title != null) {
                return ORIGIN + "/?text=" + enc(text) + "&title=" + enc(title);
            }
        }
        return ORIGIN + "/";
    }

    static String enc(String v) {
        try {
            return URLEncoder.encode(v == null ? "" : v, "UTF-8");
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    // ---------------------------------------------------------------- versions de l'interface

    static int compareVersions(String a, String b) {
        String[] x = (a == null ? "0" : a).split("[.-]");
        String[] y = (b == null ? "0" : b).split("[.-]");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int p = i < x.length ? toInt(x[i]) : 0;
            int q = i < y.length ? toInt(y[i]) : 0;
            if (p != q) return p - q;
        }
        return 0;
    }

    static int toInt(String v) {
        try {
            return Integer.parseInt(v.trim());
        } catch (Exception e) {
            return 0;
        }
    }

    /** Version d'interface téléchargée depuis le serveur, si plus récente que celle de l'APK. */
    String storedShellVersion() {
        String v = prefs.getString("shellVersion", null);
        File dir = new File(getFilesDir(), "shell");
        if (v == null || !new File(dir, "app.js").isFile()) return null;
        return compareVersions(v, bundledVersion) > 0 ? v : null;
    }

    String currentShellVersion() {
        String v = storedShellVersion();
        return v != null ? v : bundledVersion;
    }

    InputStream openShellFile(String name) {
        if (storedShellVersion() != null) {
            for (String f : SHELL_FILES) {
                if (f.equals(name)) {
                    File file = new File(new File(getFilesDir(), "shell"), name);
                    try {
                        if (file.isFile()) return new FileInputStream(file);
                    } catch (IOException ignored) {
                    }
                }
            }
        }
        try {
            return getAssets().open("www/" + name);
        } catch (IOException e) {
            return null;
        }
    }

    String readAssetText(String name) {
        try (InputStream in = getAssets().open(name)) {
            byte[] buf = new byte[4096];
            StringBuilder sb = new StringBuilder();
            int n;
            while ((n = in.read(buf)) > 0) sb.append(new String(buf, 0, n, StandardCharsets.UTF_8));
            return sb.toString();
        } catch (IOException e) {
            return "0";
        }
    }

    static String mimeOf(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".html")) return "text/html";
        if (n.endsWith(".js")) return "text/javascript";
        if (n.endsWith(".css")) return "text/css";
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".webmanifest")) return "application/manifest+json";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    // ---------------------------------------------------------------- navigateur intégré

    class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (!HOST.equals(u.getHost())) return null; // API du serveur : réseau normal
            String path = u.getPath();
            if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
            String name = path.substring(1);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            InputStream in = name.contains("..") ? null : openShellFile(name);
            if (in == null) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers,
                        new ByteArrayInputStream(new byte[0]));
            }
            String mime = mimeOf(name);
            String charset = mime.startsWith("text/") || mime.contains("json") ? "utf-8" : null;
            return new WebResourceResponse(mime, charset, 200, "OK", headers, in);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (HOST.equals(u.getHost())) return false;
            // liens externes (notes, GitHub…) : navigateur du téléphone
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, u));
            } catch (ActivityNotFoundException ignored) {
            }
            return true;
        }

        /** Certificat client (mTLS) : choisi une fois dans le trousseau Android, puis mémorisé. */
        @Override
        public void onReceivedClientCertRequest(WebView view, final ClientCertRequest request) {
            final String saved = prefs.getString("certAlias", null);
            if (saved != null) {
                new Thread(() -> {
                    if (!proceedWithCert(request, saved)) {
                        prefs.edit().remove("certAlias").apply();
                        runOnUiThread(() -> chooseCert(request));
                    }
                }).start();
            } else {
                chooseCert(request);
            }
        }
    }

    void chooseCert(final ClientCertRequest request) {
        KeyChain.choosePrivateKeyAlias(this, alias -> {
            if (alias == null) {
                request.ignore();
                return;
            }
            prefs.edit().putString("certAlias", alias).apply();
            new Thread(() -> {
                if (!proceedWithCert(request, alias)) request.ignore();
            }).start();
        }, request.getKeyTypes(), request.getPrincipals(), request.getHost(), request.getPort(), null);
    }

    boolean proceedWithCert(ClientCertRequest request, String alias) {
        try {
            PrivateKey key = KeyChain.getPrivateKey(this, alias);
            X509Certificate[] chain = KeyChain.getCertificateChain(this, alias);
            if (key == null || chain == null) return false;
            request.proceed(key, chain);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    class Chrome extends WebChromeClient {
        /** <input type="file"> : images de la galerie, import de notes. */
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                Intent intent = params.createIntent();
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }
                startActivityForResult(intent, REQ_FILE);
                return true;
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                return false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0) {
                result = new Uri[clip.getItemCount()];
                for (int i = 0; i < clip.getItemCount(); i++) result[i] = clip.getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    // ---------------------------------------------------------------- pont JavaScript (window.AlbaNative)

    class Bridge {
        @JavascriptInterface
        public String platform() {
            return "Android";
        }

        @JavascriptInterface
        public String getServer() {
            return prefs.getString("server", "");
        }

        @JavascriptInterface
        public void setServer(String url) {
            prefs.edit().putString("server", url == null ? "" : url).apply();
        }

        @JavascriptInterface
        public String shellVersion() {
            return currentShellVersion();
        }

        /** Enregistre une nouvelle version de l'interface téléchargée depuis le serveur. */
        @JavascriptInterface
        public boolean saveShell(String version, String html, String js, String css) {
            if (version == null || html == null || js == null || css == null) return false;
            if (compareVersions(version, currentShellVersion()) <= 0) return false; // jamais de retour en arrière
            File tmp = new File(getFilesDir(), "shell.tmp");
            File dir = new File(getFilesDir(), "shell");
            try {
                deleteDir(tmp);
                if (!tmp.mkdirs()) return false;
                writeText(new File(tmp, "index.html"), html);
                writeText(new File(tmp, "app.js"), js);
                writeText(new File(tmp, "app.css"), css);
                deleteDir(dir);
                if (!tmp.renameTo(dir)) return false;
                prefs.edit().putString("shellVersion", version).commit();
                return true;
            } catch (IOException e) {
                return false;
            }
        }

        /** Résumé des notes pour le widget d'écran d'accueil. */
        @JavascriptInterface
        public void updateWidget(String json) {
            if (json == null) return;
            try {
                WidgetData.save(MainActivity.this, json);
                NotesWidget.refreshAll(MainActivity.this);
            } catch (Exception ignored) {
            }
        }

        /** Exports (JSON, .txt) : dossier Téléchargements/ALBANOTES. */
        @JavascriptInterface
        public String saveFile(String name, String content) {
            String safe = (name == null ? "albanotes.txt" : name).replaceAll("[\\\\/:*?\"<>|]", "_");
            byte[] bytes = (content == null ? "" : content).getBytes(StandardCharsets.UTF_8);
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.MediaColumns.DISPLAY_NAME, safe);
                    cv.put(MediaStore.MediaColumns.MIME_TYPE, safe.endsWith(".json") ? "application/json" : "text/plain");
                    cv.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ALBANOTES");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (uri == null) return "Enregistrement impossible";
                    try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                        if (out == null) return "Enregistrement impossible";
                        out.write(bytes);
                    }
                    return "Enregistré dans Téléchargements/ALBANOTES/" + safe;
                }
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) dir = getFilesDir();
                File f = new File(dir, safe);
                try (OutputStream out = new FileOutputStream(f)) {
                    out.write(bytes);
                }
                return "Enregistré dans " + f.getAbsolutePath();
            } catch (Exception e) {
                return "Enregistrement impossible : " + e.getMessage();
            }
        }
    }

    static void writeText(File f, String text) throws IOException {
        try (OutputStream out = new FileOutputStream(f)) {
            out.write(text.getBytes(StandardCharsets.UTF_8));
        }
    }

    static void deleteDir(File d) {
        if (d == null || !d.exists()) return;
        File[] kids = d.listFiles();
        if (kids != null) for (File k : kids) deleteDir(k);
        //noinspection ResultOfMethodCallIgnored
        d.delete();
    }
}
