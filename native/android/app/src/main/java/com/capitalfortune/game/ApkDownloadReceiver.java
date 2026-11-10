package com.capitalfortune.game;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.os.Environment;
import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.Locale;
public class ApkDownloadReceiver extends BroadcastReceiver {
  private static final String PREFS = "capitalfortune_apk_update";
  private static final String KEY_DOWNLOAD_ID = "download_id";
  private static final String KEY_SHA256 = "sha256";
  private static final String KEY_READY = "ready";
  private static final String APK_NAME = "capitalfortune-update.apk";
  @Override public void onReceive(Context context, Intent intent) {
    if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
    android.content.SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    if (id != prefs.getLong(KEY_DOWNLOAD_ID, -2L)) return;
    DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
    try (Cursor cursor = manager.query(new DownloadManager.Query().setFilterById(id))) {
      if (cursor == null || !cursor.moveToFirst() || cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)) != DownloadManager.STATUS_SUCCESSFUL) { prefs.edit().putBoolean(KEY_READY, false).apply(); return; }
      File apk = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), APK_NAME);
      if (!apk.isFile() || !sha256(apk).equalsIgnoreCase(prefs.getString(KEY_SHA256, ""))) { apk.delete(); prefs.edit().putBoolean(KEY_READY, false).apply(); return; }
      prefs.edit().putBoolean(KEY_READY, true).apply();
    } catch (Exception ignored) { prefs.edit().putBoolean(KEY_READY, false).apply(); }
  }
  private String sha256(File file) throws Exception {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    try (FileInputStream input = new FileInputStream(file)) { byte[] buffer = new byte[8192]; int read; while ((read = input.read(buffer)) != -1) digest.update(buffer, 0, read); }
    StringBuilder hex = new StringBuilder(); for (byte value : digest.digest()) hex.append(String.format(Locale.ROOT, "%02x", value)); return hex.toString();
  }
}