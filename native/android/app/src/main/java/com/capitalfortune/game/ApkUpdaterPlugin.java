package com.capitalfortune.game;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Environment;
import android.database.Cursor;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.Locale;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {
  private static final String PREFS = "capitalfortune_apk_update";
  private static final String KEY_DOWNLOAD_ID = "download_id";
  private static final String KEY_SHA256 = "sha256";
  private static final String KEY_READY = "ready";
  private static final String APK_NAME = "capitalfortune-update.apk";
  private DownloadManager downloadManager;
  private BroadcastReceiver downloadReceiver;

  @Override
  public void load() {
    downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
    downloadReceiver = new BroadcastReceiver() {
      @Override public void onReceive(Context context, Intent intent) {
        if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
        long completedId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
        long expectedId = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong(KEY_DOWNLOAD_ID, -2L);
        if (completedId != expectedId) return;
        verifyDownloadedApk(completedId);
      }
    };
    ContextCompat.registerReceiver(getContext(), downloadReceiver,
      new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), ContextCompat.RECEIVER_NOT_EXPORTED);
  }

  @Override
  protected void handleOnDestroy() {
    if (downloadReceiver != null) {
      try { getContext().unregisterReceiver(downloadReceiver); } catch (Exception ignored) {}
    }
    super.handleOnDestroy();
  }

  @PluginMethod
  public void downloadAndVerify(PluginCall call) {
    String url = call.getString("url");
    String sha256 = call.getString("sha256");
    if (url == null || !url.startsWith("https://") || sha256 == null || !sha256.matches("(?i)[a-f0-9]{64}")) {
      call.reject("A valid HTTPS APK URL and SHA-256 checksum are required.");
      return;
    }
    try {
      File oldApk = getApkFile();
      if (oldApk.exists()) oldApk.delete();
      DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
      request.setTitle("Capital Fortune update");
      request.setDescription("Downloading and verifying the latest game version");
      request.setMimeType("application/vnd.android.package-archive");
      request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
      request.setAllowedOverMetered(true);
      request.setAllowedOverRoaming(false);
      request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, APK_NAME);
      long id = downloadManager.enqueue(request);
      getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        .putLong(KEY_DOWNLOAD_ID, id).putString(KEY_SHA256, sha256.toLowerCase(Locale.ROOT))
        .putBoolean(KEY_READY, false).apply();
      JSObject result = new JSObject();
      result.put("downloadId", id);
      call.resolve(result);
      JSObject event = new JSObject();
      event.put("downloadId", id);
      notifyListeners("downloadStarted", event);
    } catch (Exception error) {
      call.reject("Could not start the APK download.", error);
    }
  }

  @PluginMethod
  public void installVerifiedApk(PluginCall call) {
    File apk = getApkFile();
    boolean ready = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_READY, false);
    if (!ready || !apk.isFile()) {
      call.reject("There is no verified update APK ready to install.");
      return;
    }
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O &&
          !getContext().getPackageManager().canRequestPackageInstalls()) {
        Intent settings = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
          Uri.parse("package:" + getContext().getPackageName()));
        settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(settings);
        JSObject result = new JSObject();
        result.put("permissionRequired", true);
        call.resolve(result);
        return;
      }
      Uri apkUri = FileProvider.getUriForFile(getContext(),
        getContext().getPackageName() + ".fileprovider", apk);
      Intent install = new Intent(Intent.ACTION_VIEW);
      install.setDataAndType(apkUri, "application/vnd.android.package-archive");
      install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
      getContext().startActivity(install);
      JSObject result = new JSObject();
      result.put("permissionRequired", false);
      call.resolve(result);
    } catch (Exception error) {
      call.reject("Android could not open the package installer.", error);
    }
  }

  private void verifyDownloadedApk(long downloadId) {
    DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
    try (Cursor cursor = downloadManager.query(query)) {
      if (cursor == null || !cursor.moveToFirst()) {
        emitFailure("Download status could not be read.");
        return;
      }
      int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
      if (status != DownloadManager.STATUS_SUCCESSFUL) {
        emitFailure("APK download did not complete successfully.");
        return;
      }
    } catch (Exception error) {
      emitFailure("APK download verification failed.");
      return;
    }
    try {
      String expected = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_SHA256, "");
      String actual = sha256(getApkFile());
      if (!actual.equalsIgnoreCase(expected)) {
        getApkFile().delete();
        emitFailure("Downloaded APK checksum does not match the published manifest.");
        return;
      }
      getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_READY, true).apply();
      JSObject event = new JSObject();
      event.put("sha256", actual);
      notifyListeners("updateReady", event);
    } catch (Exception error) {
      emitFailure("Could not verify the downloaded APK.");
    }
  }

  private File getApkFile() {
    return new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), APK_NAME);
  }

  private String sha256(File file) throws Exception {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    try (FileInputStream input = new FileInputStream(file)) {
      byte[] buffer = new byte[8192];
      int read;
      while ((read = input.read(buffer)) != -1) digest.update(buffer, 0, read);
    }
    StringBuilder hex = new StringBuilder();
    for (byte value : digest.digest()) hex.append(String.format(Locale.ROOT, "%02x", value));
    return hex.toString();
  }

  private void emitFailure(String message) {
    JSObject event = new JSObject();
    event.put("message", message);
    notifyListeners("downloadFailed", event);
  }
}
